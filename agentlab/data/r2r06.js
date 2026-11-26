/* R2R06 — 실험실 0603(런투런 제어)의 계산 모듈. 새 가상 공장 S19(마스크 한 장을 쓰는 60턴 동안 배율이 마모·열로 밀리고, 중간에 마스크를 바꿈)와
 * 세 제어 방식(보정 없음·사람 방식·EWMA 런투런), 안정 지도, 잔류 오프셋, 로그에서 외란 되살리기(replay), 시드 요약을 모은다.
 * 브라우저: mfgsim.js 다음에 r2r06_tables.js(미리 계산한 요약) 와 이 파일 → window.R2R06      node: require('./r2r06.js')
 * 난수는 mfgsim 의 rng·hashSeed 만 쓴다(시드만 씀, 시각·무작위 함수 없음). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다.
 * 같은 규칙을 파이썬(페이지 10절 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 값(HIDDEN.BETA = 실제 공정 이득)은 이 모듈 안에만 있고 CSV·표 파일·본문에는 넣지 않는다(정답 열기와 verify 만 읽는다). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'));
  else root.R2R06 = factory(root.MfgSim);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS) {
  'use strict';
  var CFG = MS.CFG, S14 = MS.s14tools;
  var HIDDEN = { BETA: 0.8 };                          // 실제 공정 이득(보정 1ppm 이 배율을 실제로 움직이는 양). 제어기가 믿는 값은 B_BELIEF
  var B_BELIEF = 1;                                    // 제어기가 믿는 공정 이득 b (보정값 1ppm = 배율 1ppm)
  var N = 60;                                          // 마스크 한 장을 쓰는 동안의 턴 수(본문: 60턴)
  var REP_LO = 28, REP_SPAN = 13;                      // 마스크를 바꾸는 턴: 28~40 사이(시드마다)
  var LIMIT = S14.LIMIT;                               // spec: 목표에서 ±LIMIT ppm (0306 의 한계)
  var AGE = CFG.AGE_PPM_PER_TURN, CLEAN_STEP = CFG.CLEAN_STEP_PPM;   // 마모 기울기(ppm/턴)와 첫 세정 계단 — 0303·0306 의 값
  var THERMAL = (CFG.ALPHA_M - CFG.ALPHA_G) * 1e6;     // 열 기울기(ppm/K) = −2.0 (0303 이 추정한 값이 가리키는 물리 계수)
  var SEASON_RATE = S14.SEASON_K / (S14.NOW - 1);      // 챔버 온도의 느린 상승(K/턴) — 0303·0306 의 계절 가정과 같은 속도
  var AMB_SD = 0.12, AMB_PHI = 0.7;                    // 턴마다 달라지는 챔버 온도 변동(K, 표준편차·자기상관) — 이 장의 가정
  var NG = S14.GITS.length;                            // 0306 이 턴마다 잰 유리 수(6)
  var MEAS_GLASS = 1;                                  // 제어용으로 턴마다 재는 유리 수(가정: 한 장)
  var LAMS = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];   // λ 후보
  var XIS = []; for (var xi = 3; xi <= 30; xi++) XIS.push(Math.round(xi) / 10);   // ξ 후보 0.3~3.0
  var MAPL = []; for (var ml = 1; ml <= 20; ml++) MAPL.push(ml / 20);             // 안정 지도의 λ: 0.05~1.0
  var DRIFTS = [0, 0.5, 1, 2, 3, 4], LAM_SLOW = 0.2;                   // 표류 배수
  var SEEDS = 200, DEFAULT_LAM = null;                 // 기본 λ 는 시드 200 개의 중앙값이 가장 작은 λ(아래 default 계산)
  var HUMAN_THR = LIMIT;                               // 사람 방식: 잰 값의 크기가 이 문턱을 넘을 때만 그만큼 한 번 보정(가정)
  var NOISE_TURN = null;                               // 턴 평균(유리 6장)의 잡음 표준편차: 표(life_s14.csv) 또는 tables 에서

  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }

  /* ---------- 0. 잡음 수준: 0306 의 턴 평균 표(S14)에서 마스크별 직선 둘레의 잔차(자유도 6) ---------- */
  function noiseFromS14() {
    var S = MS.scenario('S14'), rows = S.csvRows(), by = {}, ss = 0, df = 0;
    rows.forEach(function (r) { (by[r.mask_id] || (by[r.mask_id] = [])).push(r.Mx_comp); });
    Object.keys(by).forEach(function (id) {
      var y = by[id], n = y.length, xb = (n - 1) / 2, yb = mean(y), sxx = 0, sxy = 0, i;
      for (i = 0; i < n; i++) { sxx += (i - xb) * (i - xb); sxy += (i - xb) * (y[i] - yb); }
      var b = sxy / sxx; for (i = 0; i < n; i++) { var r = y[i] - (yb + b * (i - xb)); ss += r * r; } df += n - 2;
    });
    return Math.sqrt(ss / df);
  }
  function noiseSD(tab) { var nt = tab && tab.noise_turn != null ? tab.noise_turn : (NOISE_TURN == null ? (NOISE_TURN = noiseFromS14()) : NOISE_TURN); return nt * Math.sqrt(NG / MEAS_GLASS); }

  /* ---------- 1. 시나리오 S19: 외란 d_t 와 잡음 ε_t (제어와 무관한 부분) ---------- */
  /* 반환: {d:[N], eps:[N], rep:교체 턴(그 턴부터 새 마스크), parts:{off 마스크 오프셋, drift 마모·계절 표류(배수 m 을 곱하기 전), amb 온도 변동의 열 성분, z 표준정규 잡음}} — d = off + m·drift + amb, eps = z·sd */
  function scenario(seed, o, tab) {
    o = o || {}; var m = o.m == null ? 1 : o.m, sd = o.noise == null ? noiseSD(tab) : o.noise;
    var rr = MS.rng(MS.hashSeed('S19', seed, 'rep')), rep = REP_LO + rr.int(REP_SPAN);
    var c = 1 + MS.rng(MS.hashSeed('S19', seed, 'ch')).int(4), idA = MS.maskId('B03', 'A', c), idB = MS.maskId('B03', 'B', c);
    var mkA = MS.makeMask(idA, null, 'S19-' + seed), mkB = MS.makeMask(idB, null, 'S19-' + seed);
    var amb = MS.ar1Series(N, { seed: MS.hashSeed('S19', seed, 'amb'), sd: AMB_SD, phi: AMB_PHI }), re = MS.rng(MS.hashSeed('S19', seed, 'eps'));
    var d = [], eps = [], z = [], off = [], drift = [], ambp = [], t, age;
    for (t = 1; t <= N; t++) {
      var useB = t >= rep; age = useB ? t - rep + 1 : t;
      var o0 = (useB ? mkB : mkA).Mx0, w1 = AGE * age + CLEAN_STEP + THERMAL * SEASON_RATE * (t - 1), h = THERMAL * amb[t - 1], zz = re.normal(0, 1);
      off.push(o0); drift.push(w1); ambp.push(h); z.push(zz); d.push(o0 + m * w1 + h); eps.push(zz * sd);
    }
    return { seed: seed, d: d, eps: eps, rep: rep, mask: [idA, idB], parts: { off: off, drift: drift, amb: ambp, z: z }, sd: sd };
  }

  /* ---------- 2. 제어 방식 ---------- */
  /* 공정: y_t = beta·u_t + d_t + eps_t. u_t 는 t 턴에 쓰는 보정값(t−1 턴까지의 측정으로 정함). 반환 {y,u,a,rep:교체 턴} */
  function run(sc, method, p) {
    p = p || {}; var beta = p.beta == null ? HIDDEN.BETA : p.beta, b = p.b == null ? B_BELIEF : p.b, lam = p.lam == null ? 0.3 : p.lam, target = p.target == null ? 0 : p.target;
    var thr = p.thr == null ? HUMAN_THR : p.thr, reset = !!p.reset, n = sc.d.length, y = [], u = [], a = [], cur = 0, ah = 0, t;
    for (t = 0; t < n; t++) {
      u.push(cur); var yt = beta * cur + sc.d[t] + sc.eps[t]; y.push(yt);
      if (method === 'none') { a.push(0); continue; }
      if (method === 'human') { var e = yt - target; if (Math.abs(e) > thr) cur = cur - e / b; a.push(NaN); continue; }
      var z = yt - b * cur;                                  // 이 턴에 보정이 설명하지 못한 몫 = 외란 + (β−b)u + 잡음
      if (reset && (t + 1) === sc.rep) ah = z; else ah = lam * z + (1 - lam) * ah;
      a.push(ah); cur = (target - ah) / b;
    }
    return { y: y, u: u, a: a };
  }
  function metrics(y, limit) {
    limit = limit == null ? LIMIT : limit; var n = y.length, ss = 0, oos = 0, i, du = 0;
    for (i = 0; i < n; i++) { ss += y[i] * y[i]; if (Math.abs(y[i]) > limit) oos++; }
    return { rms: Math.sqrt(ss / n), oos: oos };
  }
  function wiggle(u) { var d = [], i; for (i = 1; i < u.length; i++) d.push(u[i] - u[i - 1]); var m = mean(d), s = 0; d.forEach(function (v) { s += (v - m) * (v - m); }); return Math.sqrt(s / (d.length - 1)); }
  function bestLam(sc, p) { var best = null; LAMS.forEach(function (l) { var q = {}; for (var k in p) q[k] = p[k]; q.lam = l; var r = metrics(run(sc, 'ewma', q).y).rms; if (best === null || r < best.rms - 1e-12) best = { lam: l, rms: r }; }); return best; }

  /* ---------- 3. 시드 한 줄 요약(보정 없음·사람·EWMA·λ 스윕) ---------- */
  function seedRun(seed, lam, tab) {
    var sc = scenario(seed, null, tab), mn = metrics(run(sc, 'none').y), mh = metrics(run(sc, 'human').y), re = run(sc, 'ewma', { lam: lam, reset: true }), me = metrics(re.y), mr = metrics(run(sc, 'ewma', { lam: lam, reset: false }).y), ms1 = metrics(run(sc, 'ewma', { lam: LAM_SLOW, reset: true }).y), ms0 = metrics(run(sc, 'ewma', { lam: LAM_SLOW, reset: false }).y), gf = gainFit(logFrom(sc));
    var sweep = LAMS.map(function (l) { return metrics(run(sc, 'ewma', { lam: l, reset: true }).y).rms; }), bi = 0; sweep.forEach(function (v, i) { if (v < sweep[bi] - 1e-12) bi = i; });
    return { seed: seed, rep: sc.rep, rms_none: mn.rms, rms_human: mh.rms, rms_ewma: me.rms, oos_none: mn.oos, oos_human: mh.oos, oos_ewma: me.oos, best_lam: LAMS[bi], wig_ewma: wiggle(re.u), rms_ewma_nr: mr.rms, oos_ewma_nr: mr.oos, rms_slow: ms1.rms, rms_slow_nr: ms0.rms, oos_slow: ms1.oos, oos_slow_nr: ms0.oos, gain_hat: gf.beta, sweep: sweep };
  }
  function allSeeds(lam, tab) { var o = []; for (var s = 1; s <= SEEDS; s++) o.push(seedRun(s, lam, tab)); return o; }
  /* 기본 λ: 시드 200 개에서 EWMA(교체 알림 있음) RMS 의 중앙값이 가장 작은 λ */
  function pickLam(tab) { var med = LAMS.map(function () { return []; }); for (var s = 1; s <= SEEDS; s++) { var sc = scenario(s, null, tab); LAMS.forEach(function (l, i) { med[i].push(metrics(run(sc, 'ewma', { lam: l, reset: true }).y).rms); }); } var mm = med.map(function (a) { return quantile(a, 0.5); }), bi = 0; mm.forEach(function (v, i) { if (v < mm[bi] - 1e-12) bi = i; }); return { lam: LAMS[bi], med: mm }; }
  /* 대표 시드: 지표 여섯(RMS 보정없음·사람·EWMA, spec 밖 사람·EWMA, 최적 λ)의 백분위가 50 에서 떨어진 정도의 합이 가장 작은 시드. 동점은 중간 순위 백분위 */
  var REP_KEYS = ['rms_human', 'rms_ewma', 'oos_human', 'oos_ewma', 'best_lam', 'wig_ewma'];
  function pctRank(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-12) lt++; else if (Math.abs(x - v) <= 1e-12) eq++; }); return 100 * (lt + 0.5 * eq) / vals.length; }
  function pickRep(rows) { var cols = REP_KEYS.map(function (k) { return rows.map(function (r) { return r[k]; }); }), best = null; rows.forEach(function (r) { var sc = 0; REP_KEYS.forEach(function (k, i) { sc += Math.abs(pctRank(cols[i], r[k]) - 50); }); if (best === null || sc < best.score - 1e-12) best = { seed: r.seed, score: sc }; }); return best; }

  /* ---------- 4. 안정 지도(실측) 와 이론 경계, 잔류 오프셋 ---------- */
  /* 외란 0·잡음 0 에서 처음 추정 a0=1 로 시작해 turns 턴을 돌린 뒤 |a|/|a0| 로 판정: >1 발산, <1 수렴, 같으면 경계 */
  function stabRun(lam, xi, turns) {
    var b = 1, beta = xi * b, ah = 1, cur = -ah / b, t, y = 0;
    for (t = 0; t < (turns || 200); t++) { y = beta * cur; var z = y - b * cur; ah = lam * z + (1 - lam) * ah; cur = -ah / b; }
    return Math.abs(ah);
  }
  function stabClass(v) { return v > 1 + 1e-6 ? 'div' : v < 1 - 1e-6 ? 'ok' : 'edge'; }
  function theoryClass(lam, xi) { var p = lam * xi; return p > 2 + 1e-9 ? 'div' : p < 2 - 1e-9 ? 'ok' : 'edge'; }
  function stabMap(turns) { var out = []; MAPL.forEach(function (l) { XIS.forEach(function (x) { var v = stabRun(l, x, turns); out.push({ lam: l, xi: x, a: v, meas: stabClass(v), theory: theoryClass(l, x) }); }); }); return out; }
  /* 잔류 오프셋: 외란 = 기울기 s 의 직선(d_t = s·t), 잡음 0, 충분히 지난 뒤 y 의 값. 공식: s/(λξ) = s·(1−λ)/λ(추정의 늦음, ξ=1) + s(한 턴 지연) */
  function offsetRun(lam, xi, s, turns) {
    var sc = { d: [], eps: [], rep: 1e9 }, t; for (t = 1; t <= (turns || 400); t++) { sc.d.push(s * t); sc.eps.push(0); }
    var r = run(sc, 'ewma', { lam: lam, beta: xi, b: 1, reset: false }); return r.y[r.y.length - 1];
  }
  function offsetFormula(lam, xi, s) { return s / (lam * xi); }

  /* ---------- 5. 로그 되살리기(replay) ---------- */
  /* log = [{turn,y,u,replaced}], 사람 방식으로 운영한 기록. 공정 이득 추정 β̂: 턴 사이 변화 Δy 를 Δu 와 상수(표류 기울기)에 회귀한 기울기.
   * 교체 턴의 Δy 는 마스크 계단이라 뺀다. se = 회귀 기울기의 표준오차(자유도 n−2), njump = 보정값이 바뀐 턴 수 */
  function gainFit(log) {
    var dy = [], du = [], i; for (i = 1; i < log.length; i++) { if (log[i].replaced) continue; dy.push(log[i].y - log[i - 1].y); du.push(log[i].u - log[i - 1].u); }
    var n = dy.length, m1 = mean(du), m2 = mean(dy), sxy = 0, sxx = 0, nj = 0; for (i = 0; i < n; i++) { sxy += (du[i] - m1) * (dy[i] - m2); sxx += (du[i] - m1) * (du[i] - m1); if (Math.abs(du[i]) > 1e-12) nj++; }
    if (!(sxx > 0)) return { beta: NaN, se: NaN, njump: 0, n: n };
    var beta = sxy / sxx, rss = 0; for (i = 0; i < n; i++) { var r = (dy[i] - m2) - beta * (du[i] - m1); rss += r * r; }
    return { beta: beta, se: Math.sqrt(rss / (n - 2) / sxx), njump: nj, n: n };
  }
  function estGainLog(log) { return gainFit(log).beta; }
  function logFrom(sc) { var r = run(sc, 'human'), log = [], t; for (t = 0; t < N; t++) log.push({ turn: t + 1, y: r4(r.y[t]), u: r4(r.u[t]), replaced: (t + 1) === sc.rep ? 1 : 0 }); return log; }
  function replayD(log, betaHat) { return log.map(function (r) { return r.y - betaHat * r.u; }); }
  /* 외란을 마스크 구간별 직선(기울기 γ)과 나머지로 나누어 표류 배수 m 를 적용: d' = d + (m−1)·γ·(구간 안 위치) */
  function driftScale(d, repIdx, m) {
    var out = d.slice(), segs = repIdx > 0 ? [[0, repIdx], [repIdx, d.length]] : [[0, d.length]];
    segs.forEach(function (sg) { var a = sg[0], bq = sg[1], n = bq - a, xb = (n - 1) / 2, yb = 0, sxx = 0, sxy = 0, i; for (i = 0; i < n; i++) yb += d[a + i]; yb /= n; for (i = 0; i < n; i++) { sxx += (i - xb) * (i - xb); sxy += (i - xb) * (d[a + i] - yb); } var g = sxy / sxx; for (i = 0; i < n; i++) out[a + i] = d[a + i] + (m - 1) * g * i; });
    return out;
  }
  /* 되살린 외란 위에서 제어 방식을 다시 돌림: y' = ξ·b·u' + d' (잡음은 d' 에 이미 들어 있음) */
  function replayRun(dhat, rep, method, p) { return run({ d: dhat, eps: dhat.map(function () { return 0; }), rep: rep }, method, p); }
  /* 표류 배수(0~4) × λ 에서 되살린 외란 위 RMS(교체 알림 있음) */
  function replaySweep(dhat, repIdx, xi, ms) { return (ms || DRIFTS).map(function (m) { var dm = driftScale(dhat, repIdx, m); return LAMS.map(function (l) { return metrics(replayRun(dm, repIdx + 1, 'ewma', { beta: xi, lam: l, reset: true }).y).rms; }); }); }

  /* ---------- 6. 로그 한 벌 만들기(사람 방식으로 운영한 기록, 대표 시드) — CSV 의 재료 ---------- */
  function logOf(seed, tab) { return logFrom(scenario(seed, null, tab)); }


  /* ---------- 7. 시드 200 개 요약표·λ 스윕·대표 시드 (build_csv.mjs 가 CSV·표 파일로 만든다) ---------- */
  var NOISE_MULTS = [0.5, 1, 2, 4];
  function sweepRows(tab) {
    var out = [];
    function one(axis, value, o) {
      var cols = LAMS.map(function () { return []; }), oo = LAMS.map(function () { return []; }), s, i;
      for (s = 1; s <= SEEDS; s++) { var sc = scenario(s, o, tab); LAMS.forEach(function (l, j) { var m = metrics(run(sc, 'ewma', { lam: l, reset: true }).y); cols[j].push(m.rms); oo[j].push(m.oos); }); }
      LAMS.forEach(function (l, j) { out.push({ axis: axis, value: value, lam: l, rms_p10: r4(quantile(cols[j], 0.1)), rms_p50: r4(quantile(cols[j], 0.5)), rms_p90: r4(quantile(cols[j], 0.9)), oos_p50: r4(quantile(oo[j], 0.5)) }); });
    }
    DRIFTS.forEach(function (m) { one('drift', m, { m: m }); });
    NOISE_MULTS.forEach(function (k) { one('noise', k, { noise: noiseSD(tab) * k }); });
    return out;
  }
  function buildTables(tab) {
    tab = tab || { noise_turn: noiseFromS14() }; var pl = pickLam(tab), rows = allSeeds(pl.lam, tab), rep = pickRep(rows);
    return { noise_turn: tab.noise_turn, lam: pl.lam, med: pl.med, rep: rep.seed, score: rep.score, log: logOf(rep.seed, tab),
      seeds: rows.map(function (r) { return { seed: r.seed, rep_turn: r.rep, rms_none: r4(r.rms_none), rms_human: r4(r.rms_human), rms_ewma: r4(r.rms_ewma), rms_ewma_nr: r4(r.rms_ewma_nr), oos_none: r.oos_none, oos_human: r.oos_human, oos_ewma: r.oos_ewma, oos_ewma_nr: r.oos_ewma_nr, rms_slow: r4(r.rms_slow), rms_slow_nr: r4(r.rms_slow_nr), oos_slow: r.oos_slow, oos_slow_nr: r.oos_slow_nr, best_lam: r.best_lam, wig_ewma: r4(r.wig_ewma), gain_hat: r4(r.gain_hat) }; }),
      sweep: sweepRows(tab) };
  }

  return {
    HIDDEN: HIDDEN, B_BELIEF: B_BELIEF, N: N, LIMIT: LIMIT, AGE: AGE, CLEAN_STEP: CLEAN_STEP, THERMAL: THERMAL, SEASON_RATE: SEASON_RATE, AMB_SD: AMB_SD, AMB_PHI: AMB_PHI, NG: NG, MEAS_GLASS: MEAS_GLASS,
    LAM_SLOW: LAM_SLOW, LAMS: LAMS, XIS: XIS, MAPL: MAPL, DRIFTS: DRIFTS, SEEDS: SEEDS, HUMAN_THR: HUMAN_THR, REP_LO: REP_LO, REP_SPAN: REP_SPAN, REP_KEYS: REP_KEYS,
    noiseFromS14: noiseFromS14, noiseSD: noiseSD, scenario: scenario, run: run, metrics: metrics, wiggle: wiggle, bestLam: bestLam, seedRun: seedRun, allSeeds: allSeeds, pickLam: pickLam, pickRep: pickRep, pctRank: pctRank,
    stabRun: stabRun, stabMap: stabMap, stabClass: stabClass, theoryClass: theoryClass, offsetRun: offsetRun, offsetFormula: offsetFormula,
    gainFit: gainFit, estGainLog: estGainLog, logFrom: logFrom, replayD: replayD, driftScale: driftScale, replayRun: replayRun, replaySweep: replaySweep, logOf: logOf, buildTables: buildTables, sweepRows: sweepRows, NOISE_MULTS: NOISE_MULTS, quantile: quantile, mean: mean, r4: r4
  };
});
