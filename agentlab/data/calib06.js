/* Calib06 — 실험실 0602(시뮬레이터를 실제에 맞추기)의 계산 모듈. 0601 의 가상 공장(S17: 숨은 세정 시간)을 그대로 이어받고, 새 가상 공장 S18(세정액이 낡아 세정 시간이 날마다 늘고 교체하면 돌아감)을 더한다.
 * 브라우저: mfgsim.js → loop06.js → loop06_tables.js → calib06_tables.js → 이 파일 → window.Calib06      node: require('./calib06.js')
 * 난수 없음(시드만 씀). mfgsim.js·loop06.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 파이썬(페이지 10절 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 값(HIDDEN·S18 교체 전 세정 시간 식)은 이 모듈 안에만 있고, CSV·표 파일·본문에는 넣지 않는다(정답 열기와 verify 만 읽는다). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./loop06.js'));
  else root.Calib06 = factory(root.MfgSim, root.Loop06);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, L6) {
  'use strict';
  var HIDDEN2 = { TT: 300 };                                        // S17 공장의 숨은 한 턴 길이(분). 세정 시간의 숨은 값은 Loop06.HIDDEN.CLEAN
  var FINE = []; for (var fc = 160; fc <= 240; fc += 2) FINE.push(fc);   // 세정 시간 촘촘한 격자(2분 간격, 41칸)
  var EMU_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108];       // 에뮬레이터를 만드는 트윈 시드(실제 로그 시드·결과 시드와 겹치지 않음)
  var WINDOWS = L6.WINDOWS, CAPS = L6.CAPS, CAP0 = L6.CAP0, DAYS = L6.DAYS;
  var KEYS1 = ['q', 'L'];                                         // 1차원 우도가 쓰는 지표(세정 중 평균 busy 는 27 상한에 붙어 정규 근사가 안 맞아 뺀다)
  var NB1 = 3;                                                     // 공분산을 합치는 이웃 칸 수(양쪽 3칸 = 7칸)
  var POL_NODES = [172, 176, 180, 184, 188, 192, 196, 200, 204, 208, 212];   // 결정 표 격자(4분 간격)
  var COVER_SEEDS = []; for (var cs = 401; cs <= 500; cs++) COVER_SEEDS.push(cs);   // 포함률을 재는 로그 시드 100개
  var RIDGE_C = []; for (var rc = 170; rc <= 230; rc += 5) RIDGE_C.push(rc);        // 2차원: 세정 시간 13칸
  var RIDGE_T = []; for (var rt = 260; rt <= 340; rt += 10) RIDGE_T.push(rt);       // 2차원: 한 턴 길이 9칸
  var RIDGE_SETS = { one: ['q'], three: ['q', 'L', 'out'], four: ['q', 'L', 'out', 'tr'] };
  var RIDGE_KO = { q: '세정 대기열 평균', L: 'Loss 총 장수', out: '시간당 완성 유리', tr: '시간당 반송 요청' };
  var DC = 0.5, DT = 1;                                           // 2차원 사후를 계산하는 촘촘한 칸(에뮬레이터는 직선으로 이음)
  var S18 = { DAYS: 90, BASE: 180, SLOPE: 0.8, REPLACE: [30, 60], CHUNK: 3, SKIP: 1, CHUNK_SEEDS: [], TUNE: [501, 502, 503, 504, 505, 506, 507, 508, 509, 510], EVAL: [], FIRST: 14,
              QS: [0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2, 3], RS: [0.25, 0.5, 1, 2, 4], FIXN: 14, MAN: 7, AFTER: 5 };
  for (var s1 = 101; s1 <= 116; s1++) S18.CHUNK_SEEDS.push(s1);   // 하루 관측 에뮬레이터용 시드 16개
  for (var s2 = 601; s2 <= 620; s2++) S18.EVAL.push(s2);
  var CODES = L6.CODES;

  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }

  /* ---------- 0. 작은 선형대수: 역행렬과 로그 행렬식(가우스-조르단) ---------- */
  function invLogDet(S) {
    var n = S.length, A = [], i, j, k, ld = 0;
    for (i = 0; i < n; i++) { A.push(S[i].slice()); for (j = 0; j < n; j++) A[i].push(i === j ? 1 : 0); }
    for (i = 0; i < n; i++) {
      var p = i; for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
      var t = A[i]; A[i] = A[p]; A[p] = t;
      var d = A[i][i]; ld += Math.log(Math.abs(d));
      for (j = 0; j < 2 * n; j++) A[i][j] /= d;
      for (k = 0; k < n; k++) if (k !== i) { var f = A[k][i]; if (f !== 0) for (j = 0; j < 2 * n; j++) A[k][j] -= f * A[i][j]; }
    }
    return { inv: A.map(function (r) { return r.slice(n); }), ld: ld };
  }
  function quad(inv, d) { var s = 0, n = d.length, i, j; for (i = 0; i < n; i++) for (j = 0; j < n; j++) s += d[i] * inv[i][j] * d[j]; return s; }

  /* ---------- 1. 에뮬레이터: 칸마다 트윈 시드 묶음의 지표(로그 척도) 평균과, 이웃 칸을 합친 공분산 ---------- */
  /* rows: 각 행 = {cellKey 값, seed, 지표들}. 지표는 ln(x+1) 로 바꿔서 쓴다(0601 gap 과 같은 척도). */
  function buildEmu(rows, cellKey, cells, keys, nb) {
    var X = cells.map(function (c) { return rows.filter(function (r) { return r[cellKey] === c; }).map(function (r) { return keys.map(function (k) { return Math.log(r[k] + 1); }); }); });
    var mu = X.map(function (x) { return keys.map(function (k, j) { return mean(x.map(function (v) { return v[j]; })); }); });
    var n = X[0].length, cov = [], inv = [], ld = [];
    cells.forEach(function (c, i) {
      var lo = Math.max(0, i - nb), hi = Math.min(cells.length - 1, i + nb), S = keys.map(function () { return keys.map(function () { return 0; }); }), N = 0, a, b, p, q;
      for (a = lo; a <= hi; a++) for (b = 0; b < X[a].length; b++) { N++; for (p = 0; p < keys.length; p++) for (q = 0; q < keys.length; q++) S[p][q] += (X[a][b][p] - mu[a][p]) * (X[a][b][q] - mu[a][q]); }
      var dof = N - (hi - lo + 1), f = (1 + 1 / n) / dof;
      for (p = 0; p < keys.length; p++) for (q = 0; q < keys.length; q++) S[p][q] *= f;   // 예측 공분산 = 시드 간 공분산 × (1 + 1/n): 에뮬레이터 평균이 n 개 시드로 만든 값이라는 불확실성까지
      cov.push(S); var il = invLogDet(S); inv.push(il.inv); ld.push(il.ld);
    });
    return { cells: cells, keys: keys, mu: mu, cov: cov, inv: inv, ld: ld, n: n };
  }
  /* 로그 척도의 우도(상수 뺀 로그): −½ (y−μ)ᵀ S⁻¹ (y−μ) − ½ ln|S| */
  function logLik(emu, obs) {
    var y = emu.keys.map(function (k) { return Math.log(obs[k] + 1); });
    return emu.cells.map(function (c, i) { var d = y.map(function (v, j) { return v - emu.mu[i][j]; }); return -0.5 * quad(emu.inv[i], d) - 0.5 * emu.ld[i]; });
  }
  /* 사후분포: 사전 = null(평평) 또는 {m, s}(정규). 칸 합이 1 */
  function gridPosterior(emu, obs, prior) {
    var ll = logLik(emu, obs), mx = -Infinity, i;
    for (i = 0; i < ll.length; i++) {
      var lp = prior ? -0.5 * Math.pow((emu.cells[i] - prior.m) / prior.s, 2) : 0;
      ll[i] += lp; if (ll[i] > mx) mx = ll[i];
    }
    var p = ll.map(function (v) { return Math.exp(v - mx); }), s = mean(p) * p.length;
    return p.map(function (v) { return v / s; });
  }
  /* 사후 요약: 평균·최빈값(같으면 작은 쪽)·표준편차·가운데 level 몫이 들어 있는 구간(칸 안에서는 직선으로 이은 누적분포) */
  function credible(post, cells, level) {
    var step = cells[1] - cells[0], lo = null, hi = null, cum = 0, i, a = (1 - level) / 2;
    for (i = 0; i < post.length; i++) {
      var nx = cum + post[i], edge = cells[i] - step / 2;
      if (lo == null && nx >= a - 1e-15 && post[i] > 0) lo = edge + step * (a - cum) / post[i];
      if (hi == null && nx >= 1 - a - 1e-15 && post[i] > 0) hi = edge + step * (1 - a - cum) / post[i];
      cum = nx;
    }
    return [lo, hi];
  }
  function postStats(post, cells, level) {
    var m = 0, v = 0, i, md = 0; level = level == null ? 0.95 : level;
    for (i = 0; i < post.length; i++) { m += post[i] * cells[i]; if (post[i] > post[md] + 1e-15) md = i; }
    for (i = 0; i < post.length; i++) v += post[i] * (cells[i] - m) * (cells[i] - m);
    var ci = credible(post, cells, level);
    return { mean: m, mode: cells[md], sd: Math.sqrt(v), lo: ci[0], hi: ci[1], width: ci[1] - ci[0] };
  }
  function priorOf(sd) { return sd == null || sd <= 0 ? null : { m: L6.V0_CLEAN, s: sd }; }   // 믿음 = 0601 트윈 판 0 의 세정 시간 180분

  /* ---------- 2. 표 읽기 도우미 ---------- */
  function logRow(logs, seed, days) { for (var i = 0; i < logs.length; i++) if (logs[i].seed === seed && logs[i].days === days) return logs[i]; return null; }
  function emuFine(T, days) { return buildEmu(T.fine.filter(function (r) { return r.days === days; }), 'clean', FINE, KEYS1, NB1); }
  function post1(T, emus, seed, days, sd) {
    var ob = logRow(T.logs, seed, days), p = gridPosterior(emus[days], ob, priorOf(sd)), st = postStats(p, FINE, 0.95);
    st.post = p; return st;
  }

  /* ---------- 3. 결정: 사후 기대 비용으로 고르기 ---------- */
  /* pol 행: clean(결정 표 격자), seed, cap, loss(60일 Loss). 결정 표 평균 → 칸의 세정 시간으로 직선 보간(범위 밖은 끝값) */
  function polTable(pol) {
    var tb = {}; POL_NODES.forEach(function (c) { tb[c] = {}; CAPS.forEach(function (cap) { var rr = pol.filter(function (r) { return r.clean === c && r.cap === cap; }); tb[c][cap] = mean(rr.map(function (r) { return r.loss; })) / DAYS; }); });
    return tb;
  }
  function lossInterp(tb, cap, c) {
    var n = POL_NODES; if (c <= n[0]) return tb[n[0]][cap]; if (c >= n[n.length - 1]) return tb[n[n.length - 1]][cap];
    var i = 0; while (c > n[i + 1]) i++;
    var f = (c - n[i]) / (n[i + 1] - n[i]); return tb[n[i]][cap] * (1 - f) + tb[n[i + 1]][cap] * f;
  }
  function pointSweep(tb, c, cost) { return CAPS.map(function (cap) { var l = lossInterp(tb, cap, c); return { cap: cap, loss: l, cost: l + cost * cap }; }); }
  function postSweep(tb, post, cost) {
    return CAPS.map(function (cap) {
      var l = 0; for (var i = 0; i < post.length; i++) if (post[i] > 0) l += post[i] * lossInterp(tb, cap, FINE[i]);
      return { cap: cap, loss: l, cost: l + cost * cap };
    });
  }
  function pointDecision(tb, c, cost) { return L6.argBest(pointSweep(tb, c, cost)); }
  function posteriorDecision(tb, post, cost) { return L6.argBest(postSweep(tb, post, cost)); }

  /* 촘촘한 격자(2분)로 gap 이 가장 작은 칸을 찾는 보정(0601 방식을 격자만 촘촘히 한 것). means = fineMeans 의 결과 */
  function fineMeans(T, days) { return FINE.map(function (c) { return L6.twinMean(T.fine, c, days); }); }
  function gapFine(means, real) {
    var curve = means.map(function (m, i) { var g = L6.gapOf(m, real); return { clean: FINE[i], gap: g.total, parts: g.parts }; }), best = curve[0];
    curve.forEach(function (p) { if (p.gap < best.gap - 1e-12) best = p; });
    return { curve: curve, best: best.clean, gapMin: best.gap };
  }
  /* 한 로그·기간·비용 가정의 결정과 손해 넷: 0601 점 추정(10분 격자 보정) · 촘촘한 격자의 점 추정 · 사후 평균 한 값 · 사후 기대 비용 */
  function decide(T0, T, emus, tb, seed, days, cost, sd, fm) {
    var p = post1(T, emus, seed, days, sd), lp = L6.loopFor(T0, seed, days, cost);
    var gf = gapFine(fm || fineMeans(T, days), logRow(T.logs, seed, days));
    var cf = pointDecision(tb, gf.best, cost), cm = pointDecision(tb, p.mean, cost), cp = posteriorDecision(tb, p.post, cost);
    var rf = L6.decisionRegret(T0.pol, cf, cost), rm = L6.decisionRegret(T0.pol, cm, cost), rp = L6.decisionRegret(T0.pol, cp, cost);
    return { post: p, chatGrid: lp.chat, capGrid: lp.cap1, regGrid: lp.reg1, chatFine: gf.best, capFine: cf, regFine: rf.regret, capMean: cm, regMean: rm.regret, capPost: cp, regPost: rp.regret, best: rm.best };
  }

  /* ---------- 4. 능선: 두 파라미터(세정 시간 × 한 턴 길이)의 2차원 사후 ---------- */
  function buildEmu2(rows, keys, nb) {
    var nc = RIDGE_C.length, nt = RIDGE_T.length, X = [], i, j, a, b, p, q;
    for (i = 0; i < nc; i++) { X.push([]); for (j = 0; j < nt; j++) X[i].push(rows.filter(function (r) { return r.clean === RIDGE_C[i] && r.tt === RIDGE_T[j]; }).map(function (r) { return keys.map(function (k) { return Math.log(r[k] + 1); }); })); }
    var mu = X.map(function (row) { return row.map(function (x) { return keys.map(function (k, m) { return mean(x.map(function (v) { return v[m]; })); }); }); });
    var n = X[0][0].length, inv = [], ld = [], cov = [];
    for (i = 0; i < nc; i++) { inv.push([]); ld.push([]); cov.push([]); for (j = 0; j < nt; j++) {
      var S = keys.map(function () { return keys.map(function () { return 0; }); }), N = 0, cells = 0;
      for (a = Math.max(0, i - nb); a <= Math.min(nc - 1, i + nb); a++) for (b = Math.max(0, j - nb); b <= Math.min(nt - 1, j + nb); b++) { cells++; for (var s = 0; s < X[a][b].length; s++) { N++; for (p = 0; p < keys.length; p++) for (q = 0; q < keys.length; q++) S[p][q] += (X[a][b][s][p] - mu[a][b][p]) * (X[a][b][s][q] - mu[a][b][q]); } }
      var f = (1 + 1 / n) / (N - cells); for (p = 0; p < keys.length; p++) for (q = 0; q < keys.length; q++) S[p][q] *= f;
      var il = invLogDet(S); inv[i].push(il.inv); ld[i].push(il.ld); cov[i].push(S); } }
    return { keys: keys, mu: mu, inv: inv, ld: ld, cov: cov, n: n };
  }
  function bilin(emu, c, t, m) {   // 에뮬레이터 평균을 칸 사이에서 직선으로 이음(범위 밖은 끝값)
    var fc = Math.min(Math.max((c - RIDGE_C[0]) / 5, 0), RIDGE_C.length - 1 - 1e-9), ft = Math.min(Math.max((t - RIDGE_T[0]) / 10, 0), RIDGE_T.length - 1 - 1e-9);
    var i = Math.floor(fc), j = Math.floor(ft), u = fc - i, v = ft - j;
    return emu.mu[i][j][m] * (1 - u) * (1 - v) + emu.mu[i + 1][j][m] * u * (1 - v) + emu.mu[i][j + 1][m] * (1 - u) * v + emu.mu[i + 1][j + 1][m] * u * v;
  }
  function cs2() { var a = [], b = []; for (var c = RIDGE_C[0]; c <= RIDGE_C[RIDGE_C.length - 1] + 1e-9; c += DC) a.push(c); for (var t = RIDGE_T[0]; t <= RIDGE_T[RIDGE_T.length - 1] + 1e-9; t += DT) b.push(t); return { c: a, t: b }; }
  /* 2차원 사후(평평한 사전): 행 = 세정 시간 칸, 열 = 한 턴 길이 칸. 요약은 가장자리 분포·상관·95% 구간·가장 그럴듯한 영역의 넓이(칸 수) */
  function post2(emu, obs) {
    var g = cs2(), y = emu.keys.map(function (k) { return Math.log(obs[k] + 1); }), P = [], mx = -Infinity, i, j, m;
    for (i = 0; i < g.c.length; i++) { P.push([]); var ci = Math.min(Math.round((g.c[i] - RIDGE_C[0]) / 5), RIDGE_C.length - 1);
      for (j = 0; j < g.t.length; j++) { var tj = Math.min(Math.round((g.t[j] - RIDGE_T[0]) / 10), RIDGE_T.length - 1), d = [];
        for (m = 0; m < emu.keys.length; m++) d.push(y[m] - bilin(emu, g.c[i], g.t[j], m));
        var ll = -0.5 * quad(emu.inv[ci][tj], d) - 0.5 * emu.ld[ci][tj]; P[i].push(ll); if (ll > mx) mx = ll; } }
    var tot = 0; for (i = 0; i < P.length; i++) for (j = 0; j < P[i].length; j++) { P[i][j] = Math.exp(P[i][j] - mx); tot += P[i][j]; }
    for (i = 0; i < P.length; i++) for (j = 0; j < P[i].length; j++) P[i][j] /= tot;
    return { g: g, P: P };
  }
  function stats2(po) {
    var g = po.g, P = po.P, mc = g.c.map(function () { return 0; }), mt = g.t.map(function () { return 0; }), i, j;
    for (i = 0; i < P.length; i++) for (j = 0; j < P[i].length; j++) { mc[i] += P[i][j]; mt[j] += P[i][j]; }
    var mC = 0, mT = 0; for (i = 0; i < mc.length; i++) mC += mc[i] * g.c[i]; for (j = 0; j < mt.length; j++) mT += mt[j] * g.t[j];
    var vC = 0, vT = 0, cv = 0; for (i = 0; i < mc.length; i++) vC += mc[i] * Math.pow(g.c[i] - mC, 2); for (j = 0; j < mt.length; j++) vT += mt[j] * Math.pow(g.t[j] - mT, 2);
    for (i = 0; i < P.length; i++) for (j = 0; j < P[i].length; j++) cv += P[i][j] * (g.c[i] - mC) * (g.t[j] - mT);
    var flat = []; for (i = 0; i < P.length; i++) for (j = 0; j < P[i].length; j++) flat.push(P[i][j]); flat.sort(function (a, b) { return b - a; });
    var cum = 0, k = 0; while (k < flat.length && cum < 0.95 - 1e-12) { cum += flat[k]; k++; }
    var ci = ivl(mc, g.c, DC), ti = ivl(mt, g.t, DT);
    return { meanC: mC, meanT: mT, sdC: Math.sqrt(vC), sdT: Math.sqrt(vT), cor: cv / Math.sqrt(vC * vT), ciC: ci, ciT: ti, hpdCells: k, hpdArea: k * DC * DT, mc: mc, mt: mt };
  }
  function ivl(m, x, step) { var a = 0.025, cum = 0, lo = null, hi = null; for (var i = 0; i < m.length; i++) { var nx = cum + m[i], e = x[i] - step / 2;
      if (lo == null && nx >= a - 1e-15 && m[i] > 0) lo = e + step * (a - cum) / m[i]; if (hi == null && nx >= 1 - a - 1e-15 && m[i] > 0) hi = e + step * (1 - a - cum) / m[i]; cum = nx; } return [lo, hi]; }

  /* ---------- 5. S18: 세정 시간이 움직이는 공장 ---------- */
  function s18Clean(day) {   // day = 0 부터. 교체한 날의 값이 가장 짧다(세정액이 새것)
    var last = 0; S18.REPLACE.forEach(function (r) { if (day >= r) last = r; });
    return S18.BASE + S18.SLOPE * (day - last);
  }
  function s18Seed(series, day) { return 700000 + series * 1000 + day; }
  /* 하루 관측: 앞 CHUNK 일을 그날의 세정 시간으로 돌리고 앞 SKIP 일(데우기)을 버린 나머지에서 세정 대기열 평균과 Loss 총 장수를 잰다 */
  function chunkMetrics(seed, clean) {
    var s = MS.simulateLoss({ seed: seed, days: S18.CHUNK, params: { CLEAN: clean, CAP: CAP0 } }), h = s.hourly.slice(S18.SKIP * 24, S18.CHUNK * 24), q = 0, Ls = 0, i;
    for (i = 0; i < h.length; i++) q += h[i].cleaner_queue; q /= h.length;
    for (i = 0; i < s.events.length; i++) { var e = s.events[i]; if (e.start_min >= S18.SKIP * 1440 && e.start_min < S18.CHUNK * 1440) Ls += e.loss_glass; }
    return { q: q, L: Ls };
  }
  function emuChunk(rows) { return buildEmu(rows, 'clean', FINE, KEYS1, NB1); }
  /* 날마다 관측 z(분)와 그 분산 R: 그날의 두 지표를 에뮬레이터로 뒤집은 사후(평평한 사전)의 평균과 분산 */
  function dailyObs(emu, rows) {
    var z = [], R = [];
    rows.forEach(function (r) { var p = gridPosterior(emu, r, null), st = postStats(p, FINE, 0.95); z.push(st.mean); R.push(st.sd * st.sd); });
    return { z: z, R: R };
  }
  /* 1차원 칼만 필터(상태 = 세정 시간, 랜덤워크): resets = 교체를 아는 날(그날 관측으로 다시 시작) */
  function kalmanTrack(z, R, Q, x0, P0, resets) {
    var x = [], P = [], K = [], pred = [], inn = [], S = [], xs = x0, Ps = P0, rs = {}, t;
    (resets || []).forEach(function (d) { rs[d] = true; });
    for (t = 0; t < z.length; t++) {
      pred.push(xs);
      if (t === 0 || rs[t]) { xs = z[t]; Ps = R[t]; K.push(1); inn.push(null); S.push(null); }
      else { var Pm = Ps + Q, k = Pm / (Pm + R[t]); inn.push(z[t] - xs); S.push(Pm + R[t]); xs = xs + k * (z[t] - xs); Ps = (1 - k) * Pm; K.push(k); }
      x.push(xs); P.push(Ps);
    }
    return { x: x, P: P, K: K, pred: pred, inn: inn, S: S };
  }
  function steadyK(Q, R) { var Pm = (Q + Math.sqrt(Q * Q + 4 * Q * R)) / 2; return Pm / (Pm + R); }
  /* 비교 방식들(모두 그날까지의 관측만 씀) */
  function fixedFirst(z, R, n) { var sw = 0, s = 0, i; for (i = 0; i < n; i++) { sw += 1 / R[i]; s += z[i] / R[i]; } return z.map(function () { return s / sw; }); }
  function cumBayes(z, R) { var sw = 0, s = 0; return z.map(function (v, i) { sw += 1 / R[i]; s += v / R[i]; return s / sw; }); }
  function movAvg(z, n) { return z.map(function (v, i) { var lo = Math.max(0, i - n + 1), s = 0; for (var j = lo; j <= i; j++) s += z[j]; return s / (i - lo + 1); }); }
  function rmse(est, truth, from) { var s = 0, n = 0; for (var i = from; i < est.length; i++) { s += Math.pow(est[i] - truth[i], 2); n++; } return Math.sqrt(s / n); }
  function predErr(z, est, from) {   // 내일 관측을 어제 추정으로 맞히는 오차(RMSE) — 숨은 값이 필요 없다
    var s = 0, n = 0; for (var i = Math.max(from, 1); i < z.length; i++) { s += Math.pow(z[i] - est[i - 1], 2); n++; } return Math.sqrt(s / n);
  }
  /* 교체한 날부터 N 일 동안 추정과 실제 값의 차(절댓값)의 평균 — 교체 두 번의 평균 */
  function afterReplace(est, truth, n) {
    var tot = 0;
    S18.REPLACE.forEach(function (r) { var s = 0, i; for (i = r; i < r + n; i++) s += Math.abs(est[i] - truth[i]); tot += s / n; });
    return tot / S18.REPLACE.length;
  }
  function innovLL(z, R, Q, resets) {   // 칼만 혁신 로그우도(Q 를 고르는 기준): 숨은 값이 필요 없다
    var kf = kalmanTrack(z, R, Q, z[0], R[0], resets), s = 0; for (var t = 0; t < z.length; t++) if (kf.inn[t] != null) s += -0.5 * (Math.log(kf.S[t]) + kf.inn[t] * kf.inn[t] / kf.S[t]); return s;
  }
  function tuneQ(series) {   // series: [{z,R}] → 혁신 로그우도 합이 가장 큰 Q(표준편차 분/일)
    var best = null, bv = -Infinity; S18.QS.forEach(function (sq) { var v = 0; series.forEach(function (o) { v += innovLL(o.z, o.R, sq * sq, S18.REPLACE); }); if (v > bv + 1e-9) { bv = v; best = sq; } });
    return { q: best, ll: bv };
  }
  function truthSeries() { var a = []; for (var d = 0; d < S18.DAYS; d++) a.push(s18Clean(d)); return a; }
  /* 한 계열(z, R)에 모든 방식을 돌려 추적 오차·예측 오차·교체 뒤 회복 날수를 낸다(오차는 첫 FIRST 일 이후) */
  function trackAll(o, sq, rs) {
    var tr = truthSeries(), f = S18.FIRST, Rm = o.R.map(function (v) { return v * rs * rs; });
    var kr = kalmanTrack(o.z, Rm, sq * sq, o.z[0], Rm[0], S18.REPLACE).x, kn = kalmanTrack(o.z, Rm, sq * sq, o.z[0], Rm[0], []).x;
    var fx = fixedFirst(o.z, o.R, S18.FIXN), cb = cumBayes(o.z, o.R), ma = movAvg(o.z, S18.MAN), raw = o.z;
    var M = { kalmanReset: kr, kalman: kn, fixed: fx, cum: cb, ma: ma }, out = {};
    Object.keys(M).forEach(function (k) { out[k] = { rmse: rmse(M[k], tr, f), pred: predErr(o.z, M[k], f), rec: afterReplace(M[k], tr, S18.AFTER), bias: mean(M[k].slice(f).map(function (v, i) { return v - tr[i + f]; })) }; });
    out.raw = { rmse: rmse(raw, tr, f), pred: NaN, rec: afterReplace(raw, tr, S18.AFTER), bias: mean(raw.slice(f).map(function (v, i) { return v - tr[i + f]; })) };
    return { est: M, stat: out };
  }

  /* ---------- 6. 표 만들기(Node 에서 build_csv.mjs 가 부른다) ---------- */
  function metOf(sim, d) {
    var m = L6.metricsOf(sim.events, sim.hourly, d), h = sim.hourly.slice(0, d * 24), o = 0, t = 0, i;
    for (i = 0; i < h.length; i++) { o += h[i].line_out; t += h[i].transport_requests; }
    return { q: m.q, busy: m.busy, L: m.L, out: o / h.length, tr: t / h.length };
  }
  function buildTables(tick) {
    var fine = [], pol = [], logs = [], ridge = [], chunk = [], s18 = [], i;
    EMU_SEEDS.forEach(function (sd) { FINE.forEach(function (c) {
      var sim = MS.simulateLoss({ seed: sd, params: { CLEAN: c, CAP: CAP0 } });
      WINDOWS.forEach(function (d) { var m = metOf(sim, d); fine.push({ clean: c, seed: sd, days: d, q: r4(m.q), busy: r4(m.busy), L: r4(m.L) }); });
      if (tick) tick(); }); });
    EMU_SEEDS.forEach(function (sd) { POL_NODES.forEach(function (c) { CAPS.forEach(function (cap) {
      var sim = MS.simulateLoss({ seed: sd, params: { CLEAN: c, CAP: cap } }); pol.push({ clean: c, seed: sd, cap: cap, loss: r4(L6.totalLoss(sim)) }); if (tick) tick(); }); }); });
    L6.REAL_LOG_SEEDS.concat(COVER_SEEDS).forEach(function (sd) {
      var sim = L6.realSim(sd, CAP0); WINDOWS.forEach(function (d) { var m = metOf(sim, d); logs.push({ seed: sd, days: d, q: r4(m.q), busy: r4(m.busy), L: r4(m.L), out: r4(m.out), tr: r4(m.tr) }); }); if (tick) tick(); });
    EMU_SEEDS.forEach(function (sd) { RIDGE_C.forEach(function (c) { RIDGE_T.forEach(function (t) {
      var sim = MS.simulateLoss({ seed: sd, params: { CLEAN: c, CAP: CAP0, T_TURN: t } }), m = metOf(sim, DAYS); ridge.push({ clean: c, tt: t, seed: sd, q: r4(m.q), L: r4(m.L), out: r4(m.out), tr: r4(m.tr) }); if (tick) tick(); }); }); });
    S18.CHUNK_SEEDS.forEach(function (sd) { FINE.forEach(function (c) { var m = chunkMetrics(sd, c); chunk.push({ clean: c, seed: sd, q: r4(m.q), L: r4(m.L) }); }); });
    S18.TUNE.concat(S18.EVAL).forEach(function (se) { for (var d = 0; d < S18.DAYS; d++) { var m = chunkMetrics(s18Seed(se, d), s18Clean(d)); s18.push({ series: se, day: d + 1, q: r4(m.q), L: r4(m.L) }); } if (tick) tick(); });
    return { fine: fine, pol: pol, logs: logs, ridge: ridge, chunk: chunk, s18: s18 };
  }

  /* ---------- 7. 표 → 요약(화면·verify 가 같이 쓴다) ---------- */
  function seriesOf(T, emuC, se) {   // s18 행 → {z, R}
    var rows = T.s18.filter(function (r) { return r.series === se; }).sort(function (a, b) { return a.day - b.day; });
    return dailyObs(emuC, rows);
  }
  function pct(vals, v) { return L6.pct(vals, v); }
  function pickRep(items, fns) {   // items: 후보 목록, fns: 각 후보의 지표 함수들 → Σ|백분위−50| 가 가장 작은 후보(같으면 앞쪽)
    var res = items.map(function (it) { return { it: it, score: 0 }; });
    fns.forEach(function (f) { var vals = items.map(f); res.forEach(function (o, i) { o.score += Math.abs(pct(vals, vals[i]) - 50); }); });
    var best = res[0]; res.forEach(function (o) { if (o.score < best.score - 1e-9) best = o; }); return { item: best.it, score: best.score, all: res };
  }

  return { HIDDEN2: HIDDEN2, FINE: FINE, EMU_SEEDS: EMU_SEEDS, WINDOWS: WINDOWS, KEYS1: KEYS1, NB1: NB1, POL_NODES: POL_NODES, COVER_SEEDS: COVER_SEEDS, RIDGE_C: RIDGE_C, RIDGE_T: RIDGE_T, RIDGE_SETS: RIDGE_SETS, RIDGE_KO: RIDGE_KO, DC: DC, DT: DT, S18: S18,
    buildEmu: buildEmu, logLik: logLik, gridPosterior: gridPosterior, credible: credible, postStats: postStats, priorOf: priorOf, logRow: logRow, emuFine: emuFine, post1: post1,
    fineMeans: fineMeans, gapFine: gapFine, polTable: polTable, lossInterp: lossInterp, pointSweep: pointSweep, postSweep: postSweep, pointDecision: pointDecision, posteriorDecision: posteriorDecision, decide: decide,
    buildEmu2: buildEmu2, bilin: bilin, post2: post2, stats2: stats2, cs2: cs2,
    s18Clean: s18Clean, s18Seed: s18Seed, chunkMetrics: chunkMetrics, emuChunk: emuChunk, dailyObs: dailyObs, kalmanTrack: kalmanTrack, steadyK: steadyK, fixedFirst: fixedFirst, cumBayes: cumBayes, movAvg: movAvg,
    rmse: rmse, predErr: predErr, afterReplace: afterReplace, innovLL: innovLL, tuneQ: tuneQ, truthSeries: truthSeries, trackAll: trackAll, seriesOf: seriesOf, pickRep: pickRep, buildTables: buildTables, metOf: metOf, mean: mean, r4: r4, invLogDet: invLogDet };
});
