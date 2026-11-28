/* SEL02 — 실험실 0210(잡고 싶은 이상에서 거꾸로 특징 고르기)의 계산 모듈. 가상 상황 S22:
 * 센서 118 × 특징 5 = 590 (0202 의 S6 와 같은 구조, 같은 센서 안 상관 0.6, 표준 척도), 기준 300장, 정상 500장,
 * 고장 모드 넷(A 진공 누설·B 히터 열화·C MFC 흔들림·D 밸브 응답 지연)과 목록에 없는 새 모드 E, 모드마다 과거 라벨된 고장 유리 48장.
 * 반응표(모드 × 특징의 평균 z)를 라벨 유리로 추정하고 문턱으로 특징을 골라, 가족 오류율을 같게(0.0027) 맞춘 설계 다섯을 견준다.
 * 브라우저: mfgsim.js 다음에 sel02_tables.js(시드 200개 요약)와 이 파일 → window.SEL02      node: require('./sel02.js')
 * 난수는 mfgsim 의 rng·hashSeed 만 쓴다(시드만 씀, 시각·무작위 함수 없음). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다.
 * 같은 규칙을 파이썬(페이지 Python 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 값: 모드마다 옮기는 크기 δ 는 CSV 에 넣지 않는다(정답 열기와 verify 만 읽는다). CSV 에는 센서·특징 이름과 z 값만 있다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'));
  else root.SEL02 = factory(root.MfgSim);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS) {
  'use strict';
  var ALPHA = 0.0027, NS = 118, PER = 5, M = NS * PER, RHO = 0.6, N0 = 300, N = 500, NM = 40, NLAB = 48;
  var SEEDS = 200, DEF_SEED = 1, R_RAND = 40;
  var L_GRID = [3, 6, 12, 24, 48], L_DEF = 12, THR_DEF = 1.5, THR_MIN = 0.5, THR_MAX = 3.0, THR_STEP = 0.1, S_DEF = 0.8, S_MIN = 0.5, S_MAX = 1.0, S_STEP = 0.05;
  var D_LO = 2.5, D_HI = 4.5, E_LO = 4, E_HI = 7;                          // 모드 A~D 의 이동 크기(σ) 범위, 새 모드 E 의 범위
  var FEATS = ['steady_mean', 'steady_std', 'max_dev', 'settle_s', 'overshoot_pct'];
  /* 센서 번호는 1 부터. cells = [센서 번호, 특징 번호(0~4)] */
  var SENSORS = { 7: '챔버 압력', 23: '히터 온도', 41: '가스 유량', 58: '밸브 위치' };
  var MODES = [
    { id: 'A', name: '진공 누설', cells: [[7, 0], [7, 2]] },
    { id: 'B', name: '히터 열화', cells: [[23, 3], [23, 4]] },
    { id: 'C', name: 'MFC 흔들림', cells: [[41, 1]] },
    { id: 'D', name: '밸브 응답 지연', cells: [[58, 3], [7, 2]] }
  ];
  var DESIGNS = ['D0', 'D1', 'D2', 'D3', 'D4'];

  function r3(v) { return Math.round(v * 1e3) / 1e3; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function colOf(cell) { return (cell[0] - 1) * PER + cell[1]; }
  function colName(c) { return 's' + pad(Math.floor(c / PER) + 1, 3) + '_' + FEATS[c % PER]; }
  function modeCols(mi) { return MODES[mi].cells.map(colOf); }
  function truthSet() { var o = {}; MODES.forEach(function (m) { m.cells.forEach(function (c) { o[colOf(c)] = true; }); }); return Object.keys(o).map(Number).sort(function (a, b) { return a - b; }); }
  function qinv(q) { return MS.qinv(q); }
  function kOfAlpha(a) { return a >= 1 ? 0 : MS.qinv(a / 2); }            // 양측 한계: 특징 하나의 허용 헛알람 확률 a → k

  /* ---------- 1. 데이터 만들기 ---------- */
  function zrow(r) {                                                       // 표준 척도 한 줄: 센서마다 공통 성분 + 특징 고유 성분 (S6 와 같은 식)
    var a = Math.sqrt(RHO), b = Math.sqrt(1 - RHO), z = new Float64Array(M), s, k, c;
    for (s = 0; s < NS; s++) { c = r.normal(); for (k = 0; k < PER; k++) z[s * PER + k] = a * c + b * r.normal(); }
    return z;
  }
  function finish(z) { for (var q = 0; q < M; q++) z[q] = r3(z[q]); return z; }
  function faultRow(r, cols, lo, hi) {                                     // 고장 유리 한 장: 이동 크기 δ 를 먼저 뽑고 정상 한 줄에 더한다
    var d = lo + (hi - lo) * r.u(), z = zrow(r);
    cols.forEach(function (c) { z[c] += d; });
    return { z: finish(z), d: d };
  }
  function generate(seed) {
    var rb = MS.rng(MS.hashSeed('S22', seed, 'base')), ref = [], nor = [], i, g = {};
    for (i = 0; i < N0; i++) ref.push(finish(zrow(rb)));
    for (i = 0; i < N; i++) nor.push(finish(zrow(rb)));
    g.ref = ref; g.normal = nor; g.fault = {}; g.label = {}; g.delta = {}; g.labDelta = {};
    MODES.forEach(function (m, mi) {
      var cols = modeCols(mi), rf = MS.rng(MS.hashSeed('S22', seed, 'f' + m.id)), rl = MS.rng(MS.hashSeed('S22', seed, 'l' + m.id)), f = [], fd = [], l = [], ld = [], x;
      for (i = 0; i < NM; i++) { x = faultRow(rf, cols, D_LO, D_HI); f.push(x.z); fd.push(x.d); }
      for (i = 0; i < NLAB; i++) { x = faultRow(rl, cols, D_LO, D_HI); l.push(x.z); ld.push(x.d); }
      g.fault[m.id] = f; g.delta[m.id] = fd; g.label[m.id] = l; g.labDelta[m.id] = ld;
    });
    var re = MS.rng(MS.hashSeed('S22', seed, 'fE')), used = {}, col, e = [], ed = [];
    Object.keys(SENSORS).forEach(function (s) { used[+s] = true; });
    do { col = re.int(M); } while (used[Math.floor(col / PER) + 1]);       // 고른 묶음 밖 센서의 한 특징(센서 번호는 A~D 가 쓰는 센서가 아님)
    for (i = 0; i < NM; i++) { var x2 = faultRow(re, [col], E_LO, E_HI); e.push(x2.z); ed.push(x2.d); }
    g.fault.E = e; g.delta.E = ed; g.eCol = col;
    var rp = MS.rng(MS.hashSeed('S22', seed, 'perm')); g.perms = [];       // 무작위로 고르는 비교용 순열 R_RAND 개
    for (var p = 0; p < R_RAND; p++) { var a = [], j, t, h; for (j = 0; j < M; j++) a.push(j); for (j = M - 1; j > 0; j--) { h = rp.int(j + 1); t = a[j]; a[j] = a[h]; a[h] = t; } g.perms.push(a); }
    return g;
  }

  /* ---------- 2. 기준(평균·표준편차) 추정과 |z| 행렬 ---------- */
  function prep(seed) {
    var g = generate(seed), rm = new Float64Array(M), rs = new Float64Array(M), j, i;
    for (j = 0; j < M; j++) {
      var s = 0, s2 = 0; for (i = 0; i < N0; i++) s += g.ref[i][j]; var mu = s / N0;
      for (i = 0; i < N0; i++) { var d = g.ref[i][j] - mu; s2 += d * d; }
      rm[j] = mu; rs[j] = Math.sqrt(s2 / (N0 - 1));
    }
    function zm(rows, signed) { var out = new Float64Array(rows.length * M), q; for (q = 0; q < rows.length; q++) for (j = 0; j < M; j++) { var z = (rows[q][j] - rm[j]) / rs[j]; out[q * M + j] = signed ? z : Math.abs(z); } return out; }
    var P = { seed: seed, g: g, rm: rm, rs: rs, Zn: zm(g.normal, false), Zf: {}, Zl: {} };
    MODES.forEach(function (m) { P.Zf[m.id] = zm(g.fault[m.id], false); P.Zl[m.id] = zm(g.label[m.id], true); });
    P.Zf.E = zm(g.fault.E, false);
    return P;
  }

  /* ---------- 3. 반응표와 선정 ---------- */
  /* 과거 라벨된 고장 유리 앞 L 장의 특징별 평균 z (모드 × 590) */
  function table(P, L) {
    var t = {}, j, i;
    MODES.forEach(function (m) { var a = new Float64Array(M), Z = P.Zl[m.id]; for (i = 0; i < L; i++) for (j = 0; j < M; j++) a[j] += Z[i * M + j]; for (j = 0; j < M; j++) a[j] /= L; t[m.id] = a; });
    return t;
  }
  function select(tbl, thr) {                                              // |평균 z| ≥ thr 인 특징(모드별 근거와 합집합)
    var by = {}, un = {}, j;
    MODES.forEach(function (m) { by[m.id] = []; for (j = 0; j < M; j++) if (Math.abs(tbl[m.id][j]) >= thr - 1e-12) { by[m.id].push(j); un[j] = true; } });
    return { by: by, feats: Object.keys(un).map(Number).sort(function (a, b) { return a - b; }) };
  }
  function quality(feats) {                                                // 정답 반응 특징 포함률과 엉뚱한 특징 수
    var tr = truthSet(), has = {}, inc = 0, extra = 0;
    feats.forEach(function (c) { has[c] = true; });
    tr.forEach(function (c) { if (has[c]) inc++; });
    feats.forEach(function (c) { if (tr.indexOf(c) < 0) extra++; });
    return { incl: inc / tr.length, inclN: inc, extra: extra, ntruth: tr.length };
  }

  /* ---------- 4. 한계 ---------- */
  function limitsAll() { return { kAll: kOfAlpha(ALPHA / M) }; }
  /* 고른 묶음(m_sel 개)에 몫 s, 나머지(M − m_sel 개)에 몫 1 − s. 고른 것이 없으면 전체에 전부, 나머지가 없으면 고른 묶음에 전부 */
  function split(msel, share) {
    var mr = M - msel;
    if (msel <= 0) return { kSel: Infinity, kRest: kOfAlpha(ALPHA / M), aSel: 0, aRest: ALPHA / M, share: 0 };
    if (mr <= 0 || share >= 1) return { kSel: kOfAlpha(ALPHA / msel), kRest: Infinity, aSel: ALPHA / msel, aRest: 0, share: 1 };
    return { kSel: kOfAlpha(share * ALPHA / msel), kRest: kOfAlpha((1 - share) * ALPHA / mr), aSel: share * ALPHA / msel, aRest: (1 - share) * ALPHA / mr, share: share };
  }

  /* ---------- 5. 설계 평가 ---------- */
  /* groups: [{cols:[...], k}] — 유리 한 장의 어느 감시 특징이든 자기 그룹의 k 를 넘으면 알람 */
  function alarmRows(Z, nrow, groups) {
    var cnt = 0, i, g, c, hit, b;
    for (i = 0; i < nrow; i++) {
      hit = false; b = i * M;
      for (g = 0; g < groups.length && !hit; g++) { var G = groups[g], cols = G.cols, k = G.k; for (c = 0; c < cols.length; c++) if (Z[b + cols[c]] > k) { hit = true; break; } }
      if (hit) cnt++;
    }
    return cnt;
  }
  function evalGroups(P, groups) {
    var o = { famN: alarmRows(P.Zn, N, groups), det: {} };
    MODES.forEach(function (m) { o.det[m.id] = alarmRows(P.Zf[m.id], NM, groups) / NM; });
    o.det.E = alarmRows(P.Zf.E, NM, groups) / NM;
    o.fam = o.famN / N; o.ad = (o.det.A + o.det.B + o.det.C + o.det.D) / 4;
    return o;
  }
  function allCols() { var a = [], j; for (j = 0; j < M; j++) a.push(j); return a; }
  var ALLC = allCols();
  function restOf(sel) { var h = {}; sel.forEach(function (c) { h[c] = true; }); return ALLC.filter(function (c) { return !h[c]; }); }
  /* 설계 다섯. params: {L, thr, share} — 기본 L_DEF·THR_DEF·S_DEF */
  function run(P, o) {
    o = o || {}; var L = o.L == null ? L_DEF : o.L, thr = o.thr == null ? THR_DEF : o.thr, share = o.share == null ? S_DEF : o.share;
    var tbl = table(P, L), sel = select(tbl, thr), feats = sel.feats, ms = feats.length, q = quality(feats), kAll = limitsAll().kAll, sp = split(ms, share), rest = restOf(feats);
    var out = { L: L, thr: thr, share: share, msel: ms, feats: feats, by: sel.by, tbl: tbl, quality: q, kAll: kAll, kSel: sp.kSel, kRest: sp.kRest, split: sp, des: {} };
    out.des.D0 = evalGroups(P, [{ cols: ALLC, k: kAll }]);
    out.des.D1 = ms > 0 ? evalGroups(P, [{ cols: feats, k: kOfAlpha(ALPHA / ms) }]) : evalGroups(P, []);
    out.k1 = ms > 0 ? kOfAlpha(ALPHA / ms) : Infinity;
    var gr = []; if (ms > 0) gr.push({ cols: feats, k: sp.kSel }); if (rest.length && isFinite(sp.kRest)) gr.push({ cols: rest, k: sp.kRest });
    out.des.D3 = evalGroups(P, gr);
    var tr = truthSet(), k4 = kOfAlpha(ALPHA / tr.length);
    out.des.D4 = evalGroups(P, [{ cols: tr, k: k4 }]); out.k4 = k4; out.ntruth = tr.length;
    /* D2: 같은 개수를 무작위로 R_RAND 번 골라 평균 */
    var acc = { famN: 0, det: { A: 0, B: 0, C: 0, D: 0, E: 0 } }, p, kr = ms > 0 ? kOfAlpha(ALPHA / ms) : Infinity;
    for (p = 0; p < R_RAND; p++) {
      var e = evalGroups(P, ms > 0 ? [{ cols: P.g.perms[p].slice(0, ms), k: kr }] : []);
      acc.famN += e.famN; ['A', 'B', 'C', 'D', 'E'].forEach(function (id) { acc.det[id] += e.det[id]; });
    }
    var d2 = { famN: acc.famN / R_RAND, det: {} }; ['A', 'B', 'C', 'D', 'E'].forEach(function (id) { d2.det[id] = acc.det[id] / R_RAND; });
    d2.fam = d2.famN / N; d2.ad = (d2.det.A + d2.det.B + d2.det.C + d2.det.D) / 4; out.des.D2 = d2;
    return out;
  }

  /* ---------- 6. 시드 요약 ---------- */
  var SUM_KEYS = ['seed', 'msel', 'incl12', 'extra12', 'k0', 'k1', 'k3s', 'k3r',
    'd0ad', 'd1ad', 'd2ad', 'd3ad', 'd4ad', 'd0e', 'd1e', 'd2e', 'd3e', 'd4e', 'f0', 'f1', 'f2', 'f3', 'f4',
    'i3', 'x3', 'a3', 'i6', 'x6', 'a6', 'i12', 'x12', 'a12', 'i24', 'x24', 'a24', 'i48', 'x48', 'a48'];
  function summary(seed, P) {
    P = P || prep(seed); var r = run(P), o = { seed: seed }, d = r.des;
    o.msel = r.msel; o.incl12 = r4(r.quality.incl); o.extra12 = r.quality.extra; o.k0 = r4(r.kAll); o.k1 = r4(r.k1); o.k3s = r4(r.kSel); o.k3r = r4(r.kRest);
    DESIGNS.forEach(function (id, i) { var s = d[id]; o['d' + i + 'ad'] = r4(s.ad); o['d' + i + 'e'] = r4(s.det.E); o['f' + i] = r4(s.famN); });
    L_GRID.forEach(function (L) { var q = run(P, { L: L }); o['i' + L] = r4(q.quality.incl); o['x' + L] = q.quality.extra; o['a' + L] = r4(q.des.D1.ad); });
    return o;
  }
  function pctRank(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-12) lt++; else if (Math.abs(x - v) <= 1e-12) eq++; }); return 100 * (lt + 0.5 * eq) / vals.length; }
  var REP_KEYS = ['d0ad', 'd1ad', 'd3ad', 'd3e', 'msel', 'incl12'];
  function pickRep(rows) {                                                 // Σ|백분위 − 50| 최소 시드
    var cols = REP_KEYS.map(function (k) { return rows.map(function (r) { return +r[k]; }); }), best = null;
    rows.forEach(function (r) { var sc = 0; REP_KEYS.forEach(function (k, i) { sc += Math.abs(pctRank(cols[i], +r[k]) - 50); }); if (best === null || sc < best.score - 1e-12) best = { seed: r.seed, score: sc }; });
    return best;
  }
  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }

  /* ---------- 7. CSV (모드 라벨 유리·기준·정상·고장 유리의 z 값) ---------- */
  function csvRows(P) {
    var names = [], q, rows = [], g = P.g;
    for (q = 0; q < M; q++) names.push(colName(q));
    function add(group, tag, x, n) { var o = { glass_id: tag + pad(n + 1, 4), group: group }; for (var u = 0; u < M; u++) o[names[u]] = x[u]; rows.push(o); }
    g.ref.forEach(function (x, n) { add('ref', 'R', x, n); });
    g.normal.forEach(function (x, n) { add('normal', 'N', x, n); });
    MODES.forEach(function (m) { g.label[m.id].forEach(function (x, n) { add('label_' + m.id, 'L' + m.id, x, n); }); });
    MODES.forEach(function (m) { g.fault[m.id].forEach(function (x, n) { add('fault_' + m.id, 'F' + m.id, x, n); }); });
    g.fault.E.forEach(function (x, n) { add('fault_E', 'FE', x, n); });
    return rows;
  }

  return {
    ALPHA: ALPHA, NS: NS, PER: PER, M: M, RHO: RHO, N0: N0, N: N, NM: NM, NLAB: NLAB, SEEDS: SEEDS, DEF_SEED: DEF_SEED, R_RAND: R_RAND,
    L_GRID: L_GRID, L_DEF: L_DEF, THR_DEF: THR_DEF, THR_MIN: THR_MIN, THR_MAX: THR_MAX, THR_STEP: THR_STEP, S_DEF: S_DEF, S_MIN: S_MIN, S_MAX: S_MAX, S_STEP: S_STEP,
    D_LO: D_LO, D_HI: D_HI, E_LO: E_LO, E_HI: E_HI, FEATS: FEATS, SENSORS: SENSORS, MODES: MODES, DESIGNS: DESIGNS, SUM_KEYS: SUM_KEYS, REP_KEYS: REP_KEYS,
    colOf: colOf, colName: colName, modeCols: modeCols, truthSet: truthSet, kOfAlpha: kOfAlpha, generate: generate, prep: prep, table: table, select: select, quality: quality,
    split: split, run: run, summary: summary, pickRep: pickRep, pctRank: pctRank, quantile: quantile, csvRows: csvRows, r4: r4
  };
});
