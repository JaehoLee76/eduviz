/* OPE06 — 실험실 0604(과거 로그로 새 규칙 평가하기: 오프폴리시 평가)의 계산 모듈. 새 가상 상황 S20(세정기가 비어 다음 세트를 고르는 결정)과
 * 기록 정책(먼저 온 순서 + 작은 탐색 ε, 고른 확률을 기록), 목표 정책(새 규칙), 단순 평균·중요도 가중(IPS)·자기 정규화(SNIPS)·이중 강건(DR)·유효 표본 수·지원 점검,
 * 성향 점수를 추정으로 대신한 경우, 결과 모델을 틀리게 한 경우, 시드 분포, 후보 규칙 거르기와 성과 환산을 모은다.
 * 브라우저: mfgsim.js 다음에 ope06_tables.js(미리 계산한 요약) 와 이 파일 → window.OPE06      node: require('./ope06.js')
 * 난수는 mfgsim 의 rng·hashSeed 만 쓴다(시드만 씀, 시각·무작위 함수 없음). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다.
 * 같은 규칙을 파이썬(페이지 12절 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 생성 모형(HIDDEN: 상황·행동에 따른 기대 Loss 와 잡음 크기)은 이 모듈 안에만 있고 CSV·표 파일·본문에는 넣지 않는다(정답 열기와 verify 만 읽는다).
 * ※ simulateLoss 는 세정 투입 순서가 고정이라 이 결정을 바꿀 수 없다. 그래서 이 실험실의 '결과'는 학습용 생성 모형이다(상황 분포만 S17 시간별 기록에서 가져옴). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'));
  else root.OPE06 = factory(root.MfgSim);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS) {
  'use strict';
  /* 숨은 생성 모형: 상황 z = (대기 수·카세트 여유·남은 시간)를 고정 상수로 표준화한 값(zq·zc·zs)에서 행동별 기대 Loss(결정 뒤 두 시간 동안 잃는 유리 장수) */
  var HIDDEN = { BASE: [60, 7, -3, 1.5], E1: [-3, 8, 2, -1], E2: [1, -2.5, -1], SIGMA: 12 };
  var STAND = { QM: 29, QS: 7, CM: 1.8, CS: 0.5, SM: 3.2, SS: 0.9 };      // 표준화에 쓰는 고정 상수(자료에서 다시 재지 않음)
  var BEH = { WQ: 1, US: 1.2 };                                           // 기록 정책: 대기가 짧을수록 벗어남이 늘고, 남은 시간이 짧을수록 벗어날 때 급한 세트를 고름
  var S_FILL = { LO: 58, SPAN: 42, S0: 0.5, S1: 4 };                      // 남은 시간(h) = 0.5 + 4·(스토커 채움률 − 58)/42  (S17 시간별 기록의 스토커 채움률을 0.5~4.5 시간으로 옮김, 가정)
  var ACTIONS = ['fifo', 'urgent', 'oldest'];
  var DEF_EPS = 0.1, DEF_N = 1080;                                        // 석 달(하루 열두 번 × 90일)
  var EPS_GRID = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3], SLIDER_EPS = [0].concat(EPS_GRID), N_GRID = [270, 540, 1080, 2160];
  var SEEDS = 200, PER_DAY = 12, MONTH = PER_DAY * 30;                    // 한 달의 결정 수
  var RIDGE_Y = 2, RIDGE_P = 1e-3, NEWTON = 12, P_FLOOR = 1e-3, ESS_MIN = 30;
  var CTX = null;

  function r2(v) { return Math.round(v * 1e2) / 1e2; }
  function r3(v) { return Math.round(v * 1e3) / 1e3; }
  function r6(v) { return Math.round(v * 1e6) / 1e6; }
  function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function quantile(x, p) { var b = sorted(x), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sigm(z) { return 1 / (1 + Math.exp(-z)); }

  /* ---------- 0. 상황 분포: S17 시간별 기록에서 100 칸 분위 값 ---------- */
  /* rows: s17_real_hourly 의 줄(cleaner_queue·cassette_free·stocker_fill). 각 변수의 정렬값에서 (2k+1)·n/200 번째(내림)를 k = 0..99 로 뽑는다 */
  function ctxFromHourly(rows) {
    function qv(vals) { var b = sorted(vals), n = b.length, o = [], k; for (k = 0; k < 100; k++) o.push(b[Math.floor(((2 * k + 1) * n) / 200)]); return o; }
    return {
      Q: qv(rows.map(function (r) { return +r.cleaner_queue; })),
      C: qv(rows.map(function (r) { return Math.max(0, +r.cassette_free); })),
      S: qv(rows.map(function (r) { return r3(S_FILL.S0 + S_FILL.S1 * (+r.stocker_fill - S_FILL.LO) / S_FILL.SPAN); }))
    };
  }
  function setCtx(c) { CTX = c; GRID = null; }
  function ctx() { if (!CTX) throw new Error('OPE06.setCtx 를 먼저 부르십시오'); return CTX; }

  /* ---------- 1. 기대 Loss · 기록 정책 ---------- */
  function zq(q) { return (q - STAND.QM) / STAND.QS; }
  function zc(c) { return (c - STAND.CM) / STAND.CS; }
  function zs(s) { return (s - STAND.SM) / STAND.SS; }
  function muAll(q, c, s) {
    var a = zq(q), b = zc(c), d = zs(s), H = HIDDEN, m0 = H.BASE[0] + H.BASE[1] * a + H.BASE[2] * b + H.BASE[3] * d;
    return [m0, m0 + H.E1[0] + H.E1[1] * d + H.E1[2] * d * d + H.E1[3] * a, m0 + H.E2[0] + H.E2[1] * a + H.E2[2] * b];
  }
  /* 기록 정책의 행동 확률 [먼저 온 순서, 급한 세트, 오래된 마스크]. 벗어날 확률 = ε·w(대기가 짧을수록 큼, 0~2), 벗어날 때 급한 세트를 고를 몫 u(남은 시간이 짧을수록 큼) */
  function behavior(q, c, s, eps) {
    var w = 2 * sigm(-BEH.WQ * zq(q)), u = sigm(-BEH.US * zs(s)), dev = eps * w;
    return [1 - dev, dev * u, dev * (1 - u)];
  }

  /* ---------- 2. 로그 만들기 ---------- */
  /* 같은 시드는 ε 가 달라도 같은 상황·같은 잡음을 쓴다(행동만 ε 에 따라 바뀜). n 을 늘리면 앞 줄이 그대로 유지된다(줄을 차례로 만든다) */
  function scenario(seed, o) {
    o = o || {}; var eps = o.eps == null ? DEF_EPS : o.eps, n = o.n == null ? DEF_N : o.n, C = ctx();
    var rc = MS.rng(MS.hashSeed('S20', seed, 'ctx')), ra = MS.rng(MS.hashSeed('S20', seed, 'act')), rn = MS.rng(MS.hashSeed('S20', seed, 'noise')), rows = [], i;
    for (i = 0; i < n; i++) {
      var q = C.Q[rc.int(100)], c = C.C[rc.int(100)], s = C.S[rc.int(100)], p = behavior(q, c, s, eps), u = ra.u(), a = u < p[0] ? 0 : (u < p[0] + p[1] ? 1 : 2), z = rn.normal(0, 1);
      var y = muAll(q, c, s)[a] + HIDDEN.SIGMA * z;
      rows.push({ i: i + 1, q: q, c: c, s: s, a: a, action: ACTIONS[a], p: r6(p[a]), y: r2(y) });
    }
    return rows;
  }
  function logRows(rows) { return rows.map(function (r) { return { decision: r.i, queue: r.q, cassette_free: r.c, slack_h: r.s, action: r.action, propensity: r.p, loss_glass: r.y }; }); }

  /* ---------- 3. 규칙(목표 정책): 상황 → 행동 번호 ---------- */
  var RULES = [
    { id: 'fifo', name: '먼저 온 순서 (지금 규칙)', f: function () { return 0; } },
    { id: 'urgent_all', name: '항상 급한 세트 먼저', f: function () { return 1; } },
    { id: 'urgent_s3', name: '남은 시간이 3시간 이하일 때만 급한 세트 먼저', f: function (q, c, s) { return s <= 3 ? 1 : 0; } },
    { id: 'urgent_s2', name: '남은 시간 2시간 이하일 때만 급한 세트 먼저', f: function (q, c, s) { return s <= 2 ? 1 : 0; } },
    { id: 'urgent_s25', name: '남은 시간 2.5시간 이하일 때만 급한 세트 먼저', f: function (q, c, s) { return s <= 2.5 ? 1 : 0; } },
    { id: 'urgent_s35', name: '남은 시간 3.5시간 이하일 때만 급한 세트 먼저', f: function (q, c, s) { return s <= 3.5 ? 1 : 0; } },
    { id: 'urgent_s4', name: '남은 시간 4시간 이하일 때만 급한 세트 먼저', f: function (q, c, s) { return s <= 4 ? 1 : 0; } },
    { id: 'oldest_all', name: '항상 가장 오래된 마스크 먼저', f: function () { return 2; } },
    { id: 'oldest_qle25', name: '대기 25개 이하일 때 오래된 마스크 먼저', f: function (q) { return q <= 25 ? 2 : 0; } },
    { id: 'oldest_qge33', name: '대기 33개 이상일 때 오래된 마스크 먼저', f: function (q) { return q >= 33 ? 2 : 0; } },
    { id: 'urgent_sge35', name: '남은 시간 3.5시간 이상일 때 급한 세트 먼저', f: function (q, c, s) { return s >= 3.5 ? 1 : 0; } },
    { id: 'urgent_qge33', name: '대기 33개 이상일 때 급한 세트 먼저', f: function (q) { return q >= 33 ? 1 : 0; } }
  ];
  function ruleById(id) { for (var i = 0; i < RULES.length; i++) if (RULES[i].id === id) return RULES[i]; return null; }
  var TARGETS = { urgent: 'urgent_all', cond: 'urgent_s3' };               // 페이지가 쓰는 두 목표 정책
  var POOL = RULES.slice(1);                                               // 거르기 후보 11개(지금 규칙 제외)

  /* ---------- 4. 모델 맞추기: 결과 모델(행동별 능형 최소제곱) · 성향 점수(행동별 로지스틱을 합 1 로 맞춤) ---------- */
  function feats(r) { return [1, zq(r.q), zc(r.c), zs(r.s)]; }
  function solve(A, b) {                                                   // 가우스 소거(부분 피벗)
    var n = b.length, M = A.map(function (row, i) { return row.concat([b[i]]); }), i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i; for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      var t = M[i]; M[i] = M[piv]; M[piv] = t;
      for (j = i + 1; j < n; j++) { var f = M[j][i] / M[i][i]; for (k = i; k <= n; k++) M[j][k] -= f * M[i][k]; }
    }
    var x = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) { var s = M[i][n]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  function fitRidge(X, y) {
    var p = X[0].length, A = [], g = new Array(p).fill(0), i, j, k;
    for (j = 0; j < p; j++) A.push(new Array(p).fill(0));
    for (i = 0; i < X.length; i++) for (j = 0; j < p; j++) { g[j] += X[i][j] * y[i]; for (k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k]; }
    for (j = 1; j < p; j++) A[j][j] += RIDGE_Y;
    return solve(A, g);
  }
  function fitLogit(X, y) {
    var p = X[0].length, beta = new Array(p).fill(0), i, j, k, it, m = mean(y);
    m = Math.min(1 - 1e-6, Math.max(1e-6, m)); beta[0] = Math.log(m / (1 - m));
    for (it = 0; it < NEWTON; it++) {
      var A = [], g = new Array(p).fill(0);
      for (j = 0; j < p; j++) A.push(new Array(p).fill(0));
      for (i = 0; i < X.length; i++) {
        var z = 0; for (j = 0; j < p; j++) z += beta[j] * X[i][j];
        var q = sigm(z), w = q * (1 - q);
        for (j = 0; j < p; j++) { g[j] += (y[i] - q) * X[i][j]; for (k = 0; k < p; k++) A[j][k] += w * X[i][j] * X[i][k]; }
      }
      for (j = 0; j < p; j++) { g[j] -= RIDGE_P * beta[j]; A[j][j] += RIDGE_P; }
      var d = solve(A, g); for (j = 0; j < p; j++) beta[j] += d[j];
    }
    return beta;
  }
  function dot(b, x) { var s = 0, j; for (j = 0; j < b.length; j++) s += b[j] * x[j]; return s; }
  /* 반환: lin[a] = 선형 결과 모델 계수(그 행동이 로그에 없으면 null), cst[a] = 행동별 평균(상황 무시), lg[a] = 로지스틱 계수(없으면 null), cnt[a] = 행동별 줄 수 */
  function fitAll(rows) {
    var F = rows.map(feats), res = { lin: [], cst: [], lg: [], cnt: [0, 0, 0] }, a;
    for (a = 0; a < 3; a++) {
      var ix = [], i; for (i = 0; i < rows.length; i++) if (rows[i].a === a) ix.push(i);
      res.cnt[a] = ix.length;
      if (!ix.length) { res.lin.push(null); res.cst.push(null); res.lg.push(null); continue; }
      res.lin.push(fitRidge(ix.map(function (k) { return F[k]; }), ix.map(function (k) { return rows[k].y; })));
      res.cst.push(mean(ix.map(function (k) { return rows[k].y; })));
      res.lg.push(fitLogit(F, rows.map(function (r) { return r.a === a ? 1 : 0; })));
    }
    res.F = F; return res;
  }
  function propHat(fits, i) {                                              // 추정 성향 점수 세 개(합 1, 하한 P_FLOOR)
    var v = [0, 0, 0], a, s = 0; for (a = 0; a < 3; a++) { v[a] = fits.lg[a] ? sigm(dot(fits.lg[a], fits.F[i])) : 0; s += v[a]; }
    return v.map(function (x) { return s > 0 ? Math.max(P_FLOOR, x / s) : P_FLOOR; });
  }

  /* ---------- 5. 추정기 ---------- */
  /* tf: (q,c,s) → 행동 번호(결정적 규칙). 반환 값은 '목표 정책의 평균 Loss(장/결정)' 추정. 일치한 줄이 없으면 NaN(지원 없음) */
  function estimate(rows, fits, tf, wantHat) {
    var n = rows.length, i, m = 0, sy = 0, sw = 0, sw2 = 0, swy = 0, o = { n: n }, tg = [];
    for (i = 0; i < n; i++) tg.push(tf(rows[i].q, rows[i].c, rows[i].s));
    var w = [], wh = [], ph = [];
    for (i = 0; i < n; i++) {
      var hit = rows[i].a === tg[i]; w.push(hit ? 1 / rows[i].p : 0);
      if (hit) { m++; sy += rows[i].y; sw += w[i]; sw2 += w[i] * w[i]; swy += w[i] * rows[i].y; }
    }
    o.matched = m; o.naive = m ? sy / m : NaN; o.ips = m ? swy / n : NaN; o.snips = m ? swy / sw : NaN; o.ess = m ? sw * sw / sw2 : 0;
    o.maxw = w.reduce(function (a, b) { return Math.max(a, b); }, 0); o.sumw = sw;
    function dm(kind, i) { var a = tg[i]; if (kind === 'lin') return fits.lin[a] ? dot(fits.lin[a], fits.F[i]) : NaN; return fits.cst[a] === null ? NaN : fits.cst[a]; }
    ['lin', 'cst'].forEach(function (kind) {
      var s1 = 0, s2 = 0, ok = true;
      for (i = 0; i < n; i++) { var mh = dm(kind, i); if (isNaN(mh)) { ok = false; break; } s1 += mh; s2 += mh + w[i] * (rows[i].y - mh); }
      o[kind === 'lin' ? 'dm' : 'dm_bad'] = ok ? s1 / n : NaN; o[kind === 'lin' ? 'dr' : 'dr_bad'] = ok ? s2 / n : NaN;
    });
    if (wantHat) {
      var t1 = 0, t2 = 0, ok2 = true, u;
      for (i = 0; i < n; i++) {
        ph = propHat(fits, i); var hit2 = rows[i].a === tg[i], wi = hit2 ? 1 / ph[rows[i].a] : 0; t1 += wi * rows[i].y;
        var mh2 = dm('lin', i); if (isNaN(mh2)) ok2 = false; t2 += mh2 + wi * (rows[i].y - mh2);
      }
      o.ips_hat = m ? t1 / n : NaN; o.dr_hat = ok2 ? t2 / n : NaN;
    }
    return o;
  }
  function supportCheck(rows, tf) {                                        // 지원 점검: 목표가 고를 행동이 로그에 실제로 있는가
    var n = rows.length, m = 0, minp = Infinity, i;
    for (i = 0; i < n; i++) if (rows[i].a === tf(rows[i].q, rows[i].c, rows[i].s)) { m++; if (rows[i].p < minp) minp = rows[i].p; }
    return { n: n, matched: m, share: m / n, min_p: m ? minp : NaN, ok: m > 0 };
  }

  /* ---------- 6. 정답(숨은 생성 모형): 상황 격자 100³ 곳의 정확한 평균 ---------- */
  var GRID = null;
  function grid() {
    if (GRID) return GRID; var C = ctx(), A = [], i, j, k, n = 0; GRID = { Q: [], C: [], S: [], M: [] };
    for (i = 0; i < 100; i++) for (j = 0; j < 100; j++) for (k = 0; k < 100; k++) { GRID.Q.push(C.Q[i]); GRID.C.push(C.C[j]); GRID.S.push(C.S[k]); GRID.M.push(muAll(C.Q[i], C.C[j], C.S[k])); }
    return GRID;
  }
  var TRUTH_CACHE = {};
  function truthRule(tf, key) {
    if (key && TRUTH_CACHE[key] != null) return TRUTH_CACHE[key];
    var g = grid(), s = 0, i, n = g.Q.length; for (i = 0; i < n; i++) s += g.M[i][tf(g.Q[i], g.C[i], g.S[i])];
    var v = s / n; if (key) TRUTH_CACHE[key] = v; return v;
  }
  function truthBehavior(eps) {                                            // 기록 정책(ε)의 평균 Loss
    var g = grid(), s = 0, i, n = g.Q.length; for (i = 0; i < n; i++) { var p = behavior(g.Q[i], g.C[i], g.S[i], eps), m = g.M[i]; s += p[0] * m[0] + p[1] * m[1] + p[2] * m[2]; }
    return s / n;
  }

  /* ---------- 7. 시드 한 줄 · 요약표 ---------- */
  var COLS = ['naive', 'ips', 'snips', 'dr', 'dr_bad', 'dm', 'dm_bad', 'ips_hat', 'dr_hat', 'ess', 'matched'];
  function seedEst(seed, eps, n, rule) {
    var rows = scenario(seed, { eps: eps, n: n }), fits = fitAll(rows), e = estimate(rows, fits, ruleById(rule).f, true), o = { seed: seed };
    COLS.forEach(function (k) { o[k] = e[k]; }); return o;
  }
  function r4(v) { return isFinite(v) ? Math.round(v * 1e4) / 1e4 : v; }
  /* 요약표 행: target(urgent·cond)·n·eps·seed + COLS (소수 넷째 자리 반올림, 지원 없음은 빈칸) */
  function summaryRows(onlyTarget) {
    var out = [];
    Object.keys(TARGETS).forEach(function (tk) {
      if (onlyTarget && onlyTarget !== tk) return;
      (tk === 'urgent' ? N_GRID : [DEF_N]).forEach(function (n) {
        EPS_GRID.forEach(function (eps) {
          for (var s = 1; s <= SEEDS; s++) { var e = seedEst(s, eps, n, TARGETS[tk]), o = { target: tk, n: n, eps: eps, seed: s }; COLS.forEach(function (k) { o[k] = (k === 'ess' || k === 'matched') ? r4(e[k]) : (isFinite(e[k]) ? r4(e[k]) : ''); }); out.push(o); }
        });
      });
    });
    return out;
  }
  function pctRank(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-12) lt++; else if (Math.abs(x - v) <= 1e-12) eq++; }); return 100 * (lt + 0.5 * eq) / vals.length; }
  var REP_KEYS = ['naive', 'ips', 'snips', 'dr', 'ess', 'matched'];
  function pickRep(rows) {                                                 // rows: 기본 조건(urgent·n·ε)의 시드 200줄
    var cols = REP_KEYS.map(function (k) { return rows.map(function (r) { return +r[k]; }); }), best = null;
    rows.forEach(function (r) { var sc = 0; REP_KEYS.forEach(function (k, i) { sc += Math.abs(pctRank(cols[i], +r[k]) - 50); }); if (best === null || sc < best.score - 1e-12) best = { seed: r.seed, score: sc }; });
    return best;
  }

  /* ---------- 8. 후보 규칙 거르기와 성과 환산 ---------- */
  /* 한 로그에서 후보 11개의 이중 강건 추정과 유효 표본 수. 기준(지금 규칙)도 같은 방법으로 추정해 이득 = 기준 − 후보 */
  function screen(rows, fits, essMin) {
    essMin = essMin == null ? ESS_MIN : essMin;
    var base = estimate(rows, fits, RULES[0].f, false), out = [];
    POOL.forEach(function (r) {
      var e = estimate(rows, fits, r.f, false), gain = base.dr - e.dr, hasSup = e.matched > 0 && isFinite(e.dr);
      var pass = hasSup && e.ess >= essMin && gain > 0;
      out.push({ id: r.id, name: r.name, dr: e.dr, gain: gain, ess: e.ess, matched: e.matched, support: hasSup, pass: pass, why: !hasSup ? '지원 없음' : (e.ess < essMin ? '유효 표본 수 미달' : (gain <= 0 ? '이득 추정이 0 이하' : '라인 시험으로')) });
    });
    return { base: base.dr, rows: out };
  }
  function truthGains() {                                                  // 후보별 참 이득(장/결정, 양수 = Loss 가 줄어듦)
    var v0 = truthRule(RULES[0].f, 'fifo'); return POOL.map(function (r) { return { id: r.id, name: r.name, gain: v0 - truthRule(r.f, r.id), v: truthRule(r.f, r.id) }; });
  }
  /* 시드 200 개에서 거르기 결과를 한 달(MONTH 결정)의 유리 장수로 환산. 라인 시험만 = 나쁜 후보를 전부 한 달씩 써 보는 비용 */
  function perfBox(eps, n, essMin) {
    var tg = truthGains(), bad = tg.filter(function (t) { return t.gain < 0; }), good = tg.filter(function (t) { return t.gain > 0; }), byId = {}; tg.forEach(function (t) { byId[t.id] = t; });
    var lineCost = 0; bad.forEach(function (t) { lineCost += -t.gain * MONTH; });
    var per = [], s;
    for (s = 1; s <= SEEDS; s++) {
      var rows = scenario(s, { eps: eps == null ? DEF_EPS : eps, n: n == null ? DEF_N : n }), fits = fitAll(rows), sc = screen(rows, fits, essMin), fb = 0, fg = 0, pb = 0, pg = 0, av = 0, mi = 0;
      sc.rows.forEach(function (r) { var t = byId[r.id]; if (t.gain < 0) { if (r.pass) { pb++; } else { fb++; av += -t.gain * MONTH; } } else if (t.gain > 0) { if (r.pass) pg++; else { fg++; mi += t.gain * MONTH; } } });
      per.push({ seed: s, bad_pass: pb, bad_filtered: fb, good_pass: pg, good_filtered: fg, avoided: av, missed: mi, line_cost_after: lineCost - av });
    }
    return { gains: tg, nbad: bad.length, ngood: good.length, lineCost: lineCost, per: per };
  }

  return {
    HIDDEN: HIDDEN, STAND: STAND, BEH: BEH, S_FILL: S_FILL, ACTIONS: ACTIONS, DEF_EPS: DEF_EPS, DEF_N: DEF_N, EPS_GRID: EPS_GRID, SLIDER_EPS: SLIDER_EPS, N_GRID: N_GRID, SEEDS: SEEDS, PER_DAY: PER_DAY, MONTH: MONTH,
    RIDGE_Y: RIDGE_Y, RIDGE_P: RIDGE_P, NEWTON: NEWTON, P_FLOOR: P_FLOOR, ESS_MIN: ESS_MIN, COLS: COLS, REP_KEYS: REP_KEYS, RULES: RULES, POOL: POOL, TARGETS: TARGETS,
    ctxFromHourly: ctxFromHourly, setCtx: setCtx, ctx: ctx, muAll: muAll, behavior: behavior, scenario: scenario, logRows: logRows, ruleById: ruleById, fitAll: fitAll, propHat: propHat, estimate: estimate, supportCheck: supportCheck,
    truthRule: truthRule, truthBehavior: truthBehavior, truthGains: truthGains, seedEst: seedEst, summaryRows: summaryRows, pickRep: pickRep, pctRank: pctRank, quantile: quantile, mean: mean, screen: screen, perfBox: perfBox, r4: r4
  };
});
