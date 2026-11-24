/* MfgSim — 가상 제조 데이터 시뮬레이터 (DATA_SPEC.md 구현)
 * 브라우저: <script src="mfgsim.js"> → window.MfgSim
 * node    : const MfgSim = require('./mfgsim.js')  (createRequire 경유)
 * 외부 의존 0 · 결정적(mulberry32 + Box–Muller) · Math.random / Date.now 사용 안 함.
 * 모든 값은 교재용 가상값이며 실제 공정값이 아닙니다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MfgSim = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ============================================================
   * 0. 상수·PRNG·유틸
   * ============================================================ */
  var BLOCKS = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11'];
  var BLOCK_INFO = {
    B01: { layer: 'HIL·HTL 공통층', fmm: false },
    B02: { layer: "R' (적색 프라임·공진 HTL)", fmm: true },
    B03: { layer: 'R EML', fmm: true },
    B04: { layer: "G' (녹색 프라임)", fmm: true },
    B05: { layer: 'G EML', fmm: true },
    B06: { layer: "B' (청색 프라임)", fmm: true },
    B07: { layer: 'B EML', fmm: true },
    B08: { layer: 'HBL·ETL 공통층', fmm: false },
    B09: { layer: 'Open Mask (EIL·캐소드)', fmm: false },
    B10: { layer: 'CPL 캡핑층', fmm: false },
    B11: { layer: '봉지 전 보호·버퍼층', fmm: false }
  };
  var CHAMBERS = ['CH1', 'CH2', 'CH3', 'CH4'];
  var SETS = ['A', 'B', 'C'];
  var CFG = {
    L: 1500, S: 925, NX: 11, NY: 7,          // 격자(장변 mm, 단변 mm, 가로 11 × 세로 7)
    N_TURN: 120, CT: 2.5,                     // 턴당 유리 수/챔버, 유리 1장 증착 분
    T0: 80, ALPHA_M: 1.5e-6, ALPHA_G: 3.5e-6, // 기준온도(°C), 마스크 Invar·유리 팽창계수
    SIGMA_STICK: 0.4, SIGMA_PITCH: 0.8,       // 스틱 오프셋(µm)·피치(ppm) 산포
    NOISE: 0.25,                              // 측정 반복성 σ (µm)
    TEMP_RISE: 1.2, TEMP_TAU: 35,             // 턴 안 온도 상승폭(K)·시정수(유리 수)
    TEMP_OFF: { CH1: 0, CH2: 0.15, CH3: -0.1, CH4: 0.25 },
    AGE_PPM_PER_TURN: -0.02, CLEAN_STEP_PPM: -0.05,
    P_TARGET: 300
  };
  var SIM_START = Date.UTC(2026, 0, 5, 0, 0, 0);   // 가상 시작 시각(고정)

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed() {                       // 문자열·숫자 묶음 → 32비트 시드(FNV-1a)
    var s = Array.prototype.join.call(arguments, '|'), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var u = mulberry32(seed >>> 0), spare = null;
    var r = {
      u: u,
      normal: function (m, s) {
        m = m || 0; s = s == null ? 1 : s;
        if (spare !== null) { var z = spare; spare = null; return m + s * z; }
        var a = u() || 1e-12, b = u(), rad = Math.sqrt(-2 * Math.log(a));
        spare = rad * Math.sin(2 * Math.PI * b);
        return m + s * rad * Math.cos(2 * Math.PI * b);
      },
      exp: function (mean) { return -mean * Math.log(1 - u()); },
      lognormal: function (median, sigma) { return median * Math.exp(sigma * r.normal()); },
      int: function (n) { return Math.floor(u() * n); }
    };
    return r;
  }
  function isoTs(min) {
    return new Date(SIM_START + Math.round(min) * 60000).toISOString().slice(0, 16).replace('T', ' ');
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function sd(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function isFMM(block) { return !!(BLOCK_INFO[block] && BLOCK_INFO[block].fmm); }

  /* ============================================================
   * 1. 소형 통계 (시나리오 자체 점검용; 실험실은 자기 구현을 쓴다)
   * ============================================================ */
  function gammln(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  }
  function betai(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tp2(t, df) { return betai(df / 2, 0.5, df / (df + t * t)); }          // 양측 p
  function fsf(F, d1, d2) { return betai(d2 / 2, d1 / 2, d2 / (d2 + d1 * F)); }  // F 상측 p
  function welch(a, b) {
    var ma = mean(a), mb = mean(b), va = sd(a) * sd(a) / a.length, vb = sd(b) * sd(b) / b.length;
    var se = Math.sqrt(va + vb), t = (mb - ma) / se, df = (va + vb) * (va + vb) / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
    return { diff: mb - ma, se: se, t: t, df: df, p: tp2(t, df) };
  }
  function pairedT(a, b) {
    var d = a.map(function (v, i) { return b[i] - v; }), n = d.length, se = sd(d) / Math.sqrt(n), t = mean(d) / se;
    return { diff: mean(d), se: se, t: t, df: n - 1, p: tp2(t, n - 1) };
  }
  function levene(a, b, center) {            // Brown–Forsythe(center='median') / Levene(center='mean')
    var f = center === 'mean' ? mean : median, ca = f(a), cb = f(b);
    var za = a.map(function (v) { return Math.abs(v - ca); }), zb = b.map(function (v) { return Math.abs(v - cb); });
    var N = a.length + b.length, ma = mean(za), mb = mean(zb), mt = (ma * a.length + mb * b.length) / N;
    var between = a.length * (ma - mt) * (ma - mt) + b.length * (mb - mt) * (mb - mt), within = 0, i;
    for (i = 0; i < za.length; i++) within += (za[i] - ma) * (za[i] - ma);
    for (i = 0; i < zb.length; i++) within += (zb[i] - mb) * (zb[i] - mb);
    var F = (N - 2) * between / within;
    return { F: F, p: fsf(F, 1, N - 2) };
  }
  function lag1(x) {                          // 표본 1차 자기상관
    var m = mean(x), num = 0, den = 0;
    for (var i = 0; i < x.length; i++) { den += (x[i] - m) * (x[i] - m); if (i) num += (x[i] - m) * (x[i - 1] - m); }
    return num / den;
  }
  var stats = { mean: mean, sd: sd, median: median, welch: welch, pairedT: pairedT, levene: levene, lag1: lag1, tp2: tp2, fsf: fsf, betai: betai };

  /* ============================================================
   * 2. 공정 모델: 마스크 · 프레임 · 챔버 온도
   * ============================================================ */
  function maskId(block, set, n) { return block + '-' + set + n; }
  function parseMaskId(id) {
    var m = /^(B\d\d)-([ABC])([1-4])$/.exec(id);
    return { block: m[1], set: m[2], n: +m[3], chamber: 'CH' + m[3] };
  }

  /* 마스크 한 장의 고정 특성(제작 품질). overrides 로 일부를 강제할 수 있다. */
  function makeMask(id, over, tag) {      // tag(선택): 주면 S10 시드 줄기로 다시 뽑는다. 없으면 기존 결정적 값 그대로
    var p = parseMaskId(id), r = rng(tag == null ? hashSeed('mask', id) : hashSeed('S10', tag, 'mask', id)), lr = rng(tag == null ? hashSeed('lot', p.block, p.set) : hashSeed('S10', tag, 'lot', p.block, p.set));
    var lotMx = lr.normal(0, 0.6), lotMy = lr.normal(0, 0.4);           // 제작 로트 평균(로트 차이)
    var m = {
      mask_id: id, block: p.block, set: p.set, chamber: p.chamber, lot: 'LOT-' + p.block + p.set,
      Mx0: lotMx + r.normal(0, 0.35), My0: lotMy + r.normal(0, 0.3), K0: r.normal(0, 0.4),
      Cx0: r.normal(0, 0.5), Cy0: r.normal(0, 0.4), theta0: r.normal(0, 0.4),
      Tx0: r.normal(0, 0.4), Ty0: r.normal(0, 0.4),
      stick_zo: [], stick_zp: [], bad_stick: -1, bad_jitter_k: 1.0,
      defects: [], age_base: 0, repaired: false, remount_dx_um: 0
    };
    for (var j = 0; j < CFG.NX; j++) { m.stick_zo.push(r.normal()); m.stick_zp.push(r.normal()); }
    if (r.u() < 0.08) m.bad_stick = r.int(CFG.NX);                      // 일부 마스크만 불량 스틱 보유
    if (r.u() < 0.2) m.defects.push({ px: r.int(CFG.NX), py: r.int(CFG.NY), dx: r.normal(0, 2.5), dy: r.normal(0, 2.5) });
    if (over) for (var k in over) m[k] = over[k];
    return m;
  }
  /* 리페어: PPA 보정(성분 일부를 0 쪽으로) + 이물 제거(국소 결함 삭제) + 노화 리셋 */
  function repairMask(mask, atTurn, keep) {
    keep = keep == null ? 0.6 : keep;
    var m = JSON.parse(JSON.stringify(mask));
    ['Mx0', 'My0', 'K0', 'Cx0', 'Cy0', 'theta0', 'Tx0', 'Ty0'].forEach(function (k) { m[k] = mask[k] * keep; });
    m.stick_zo = mask.stick_zo.map(function (z) { return z * keep; }); m.stick_zp = mask.stick_zp.map(function (z) { return z * keep; });
    m.defects = []; m.age_base = atTurn; m.repaired = true;
    return m;
  }
  /* 불량 스틱 교체: 그 스틱이 정상 품질로 돌아간다. */
  function replaceStick(mask, remountDx) {
    var m = JSON.parse(JSON.stringify(mask));
    m.bad_stick = -1; m.remount_dx_um = remountDx || 0; return m;
  }
  function frameOf(block, chamber) {                                   // 프레임(frame) 품질
    var r = rng(hashSeed('frame', block, chamber));
    return { K: r.normal(0, 0.3), Cy: r.normal(0, 0.4) };
  }
  /* 챔버 온도: 턴 안에서 1차 지연 상승 → 포화. FDC와 PPA가 같은 값을 공유. */
  function chamberTemp(chamber, g, o) {
    o = o || {};
    var T = CFG.T0 + (CFG.TEMP_OFF[chamber] || 0) + (o.season || 0) + CFG.TEMP_RISE * (1 - Math.exp(-g / CFG.TEMP_TAU));
    if (o.rng) T += o.rng.normal(0, o.noise == null ? 0.04 : o.noise);
    return T;
  }

  /* ============================================================
   * 3. PPA — 2차원 위치 오차 격자 (성분의 합)
   * ============================================================ */
  function gridXY(px, py) {
    return { x: -CFG.L / 2 + px * CFG.L / (CFG.NX - 1), y: -CFG.S / 2 + py * CFG.S / (CFG.NY - 1) };
  }
  /* 정답 성분. ctx = {glass_id, chamber, block, turn, glass_in_turn, chamber_temp}
   * opts = {badMult(4), noise, mxJitter, seed, noJitter} */
  function ppaComponents(ctx, mask, opts) {
    opts = opts || {};
    var badMult = opts.badMult == null ? 4 : opts.badMult;
    var mxJit = opts.mxJitter == null ? 0.08 : opts.mxJitter;
    var rg = rng(hashSeed(opts.alignId || ctx.glass_id, 'al', opts.seed || 0));          // 난수 소비 순서는 옵션과 무관하게 고정
    var aTx = rg.normal(0, 0.3), aTy = rg.normal(0, 0.3), aTh = rg.normal(0, 0.4), aMx = rg.normal(0, 1), jit = rg.normal(0, 1);
    var fr = frameOf(mask.block, mask.chamber);
    var age = Math.max(0, ctx.turn - mask.age_base);
    var dT = ctx.chamber_temp - CFG.T0;
    var Mx_th = (CFG.ALPHA_M - CFG.ALPHA_G) * dT * 1e6, My_th = Mx_th;   // ppm
    var Mx_age = CFG.AGE_PPM_PER_TURN * age + (age > 0 ? CFG.CLEAN_STEP_PPM : 0);
    var so = [], sp = [];
    for (var j = 0; j < CFG.NX; j++) {
      var m = j === mask.bad_stick ? badMult : 1;
      so.push(mask.stick_zo[j] * CFG.SIGMA_STICK * m + (j === mask.bad_stick && !opts.noJitter ? jit * mask.bad_jitter_k * CFG.SIGMA_STICK * m : 0));
      sp.push(mask.stick_zp[j] * CFG.SIGMA_PITCH * m);
    }
    return {
      Tx: mask.Tx0 + aTx + mask.remount_dx_um, Ty: mask.Ty0 + aTy, theta: mask.theta0 + aTh,
      Mx: mask.Mx0 + Mx_age + Mx_th + aMx * mxJit, My: mask.My0 + My_th * 0.5, K: mask.K0 + fr.K,
      Cx: mask.Cx0, Cy: mask.Cy0 + fr.Cy,
      Mx_th: Mx_th, Mx_mask: mask.Mx0, Mx_age: Mx_age, My_th: My_th, T_ch: ctx.chamber_temp,
      stick_off: so, stick_pitch: sp, bad_stick: mask.bad_stick,
      defects: mask.defects.slice()
    };
  }
  /* 한 점의 잡음 없는 성분 합(결함 제외). c = ppaComponents 의 반환값(또는 같은 키를 가진 성분 묶음), 단위 µm, x·y 는 mm */
  function fieldAt(c, x, y, px) {
    var xm = x / 1000, ym = y / 1000;
    var dx = c.Tx - c.theta * y * 1e-3 + c.Mx * x * 1e-3 + c.K * y * 1e-3 + c.Cx * xm * ym + c.stick_off[px];
    var dy = c.Ty + c.theta * x * 1e-3 + c.My * y * 1e-3 + c.Cy * xm * xm + c.stick_pitch[px] * y * 1e-3;
    return [dx, dy];
  }
  var ZERO11 = []; (function () { for (var j = 0; j < 11; j++) ZERO11.push(0); })();
  /* 슬라이더용 순수 성분 장: comp 에 없는 성분은 0. 잡음 없음. 반환 [{px,py,x_mm,y_mm,dx,dy}] (77점, ppa 와 같은 순서) */
  function ppaField(comp) {
    var c = { Tx: 0, Ty: 0, theta: 0, Mx: 0, My: 0, K: 0, Cx: 0, Cy: 0, stick_off: ZERO11, stick_pitch: ZERO11, defects: [] }, k, out = [], i, dm = {};
    for (k in comp) c[k] = comp[k];
    for (i = 0; i < c.defects.length; i++) dm[c.defects[i].px + ',' + c.defects[i].py] = c.defects[i];
    for (var py = 0; py < CFG.NY; py++) for (var px = 0; px < CFG.NX; px++) {
      var xy = gridXY(px, py), v = fieldAt(c, xy.x, xy.y, px), d = dm[px + ',' + py];
      out.push({ px: px, py: py, x_mm: xy.x, y_mm: xy.y, dx: v[0] + (d ? d.dx : 0), dy: v[1] + (d ? d.dy : 0) });
    }
    return out;
  }
  /* 77점 격자 생성. 반환 {…ctx, grid:[{px,py,x_mm,y_mm,dx_um,dy_um,defect}], truth} */
  function ppa(ctx, mask, opts) {
    opts = opts || {};
    var c = ppaComponents(ctx, mask, opts), nz = opts.noise == null ? CFG.NOISE : opts.noise;
    var rn = rng(hashSeed(ctx.glass_id, 'nz', opts.seed || 0)), grid = [], dmap = {}, i;
    for (i = 0; i < c.defects.length; i++) dmap[c.defects[i].px + ',' + c.defects[i].py] = c.defects[i];
    for (var py = 0; py < CFG.NY; py++) for (var px = 0; px < CFG.NX; px++) {
      var xy = gridXY(px, py), x = xy.x, y = xy.y, v = fieldAt(c, x, y, px), dx = v[0], dy = v[1];
      var d = dmap[px + ',' + py], flag = 0;
      if (d) { dx += d.dx; dy += d.dy; flag = 1; }
      dx += rn.normal(0, nz); dy += rn.normal(0, nz);
      grid.push({ px: px, py: py, x_mm: x, y_mm: y, dx_um: dx, dy_um: dy, defect: flag });
    }
    var out = {}; for (var k in ctx) out[k] = ctx[k];
    out.mask_id = mask.mask_id; out.grid = grid; out.truth = c;
    return out;
  }
  function ppaMetric(grid) {                   // 품질 지표 |평균| + 3σ (dx, dy 각각)
    var dx = grid.map(function (g) { return g.dx_um; }), dy = grid.map(function (g) { return g.dy_um; });
    var r = { dx_mean: mean(dx), dx_sd: sd(dx), dy_mean: mean(dy), dy_sd: sd(dy) };
    r.dx_metric = Math.abs(r.dx_mean) + 3 * r.dx_sd; r.dy_metric = Math.abs(r.dy_mean) + 3 * r.dy_sd;
    return r;
  }
  function solve(A, b) {                       // 가우스 소거(작은 정규방정식용)
    var n = b.length, i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i; for (j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
      var t = A[i]; A[i] = A[piv]; A[piv] = t; var tb = b[i]; b[i] = b[piv]; b[piv] = tb;
      for (j = i + 1; j < n; j++) { var f = A[j][i] / A[i][i]; for (k = i; k < n; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { var s = b[i]; for (j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return x;
  }
  function lsq(rows, y) {
    var p = rows[0].length, A = [], b = [], i, j, k;
    for (i = 0; i < p; i++) { A.push(new Array(p).fill(0)); b.push(0); }
    for (k = 0; k < rows.length; k++) for (i = 0; i < p; i++) { b[i] += rows[k][i] * y[k]; for (j = 0; j < p; j++) A[i][j] += rows[k][i] * rows[k][j]; }
    return solve(A, b);
  }
  /* 회귀 분해: dx = Tx + Mx·x + (K−θ)·y + Cx·x·y,  dy = Ty + My·y + θ·x + Cy·x².  단위 µm, mm → ppm / µm·m⁻² */
  function ppaFit(grid) {
    var rx = grid.map(function (g) { return [1, g.x_mm * 1e-3, g.y_mm * 1e-3, g.x_mm * g.y_mm * 1e-6]; });
    var ry = grid.map(function (g) { return [1, g.y_mm * 1e-3, g.x_mm * 1e-3, g.x_mm * g.x_mm * 1e-6]; });
    var bx = lsq(rx, grid.map(function (g) { return g.dx_um; })), by = lsq(ry, grid.map(function (g) { return g.dy_um; }));
    return { Tx: bx[0], Mx: bx[1], K_minus_theta: bx[2], Cx: bx[3], Ty: by[0], My: by[1], theta: by[2], Cy: by[3] };
  }

  /* ============================================================
   * 4. FDC 궤적 생성기·특징 추출
   * ============================================================ */
  function stepResp(t, zeta, wn) {              // 단위 계단에 대한 2차계 응답
    if (t <= 0) return 0;
    if (zeta < 1) {
      var wd = wn * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / Math.sqrt(1 - zeta * zeta) * Math.sin(wd * t));
    }
    if (zeta === 1) return 1 - Math.exp(-wn * t) * (1 + wn * t);
    var s = Math.sqrt(zeta * zeta - 1), a = wn * (zeta - s), b = wn * (zeta + s);
    return 1 - (b * Math.exp(-a * t) - a * Math.exp(-b * t)) / (b - a);
  }
  /* 계단 응답형(압력·가스 유량). 60초 · 1초 간격. */
  function stepTrace(o) {
    o = o || {};
    var target = o.target == null ? CFG.P_TARGET : o.target, zeta = o.zeta == null ? 0.6 : o.zeta, wn = o.wn == null ? 0.9 : o.wn;
    var ton = o.t_on == null ? 5 : o.t_on, toff = o.t_off == null ? 55 : o.t_off, n = o.n || 60, noise = o.noise == null ? 0.9 : o.noise;
    var r = rng(o.seed == null ? 1 : o.seed), t = [], y = [];
    for (var i = 0; i < n; i++) {
      var v = target * (stepResp(i - ton, zeta, wn) - stepResp(i - toff, zeta, wn)) + r.normal(0, noise);
      if (o.spike && i >= o.spike.t0 && i < o.spike.t0 + o.spike.len) v += o.spike.amp;
      t.push(i); y.push(v);
    }
    return { t: t, y: y, target: target, t_on: ton, t_off: toff };
  }
  /* 온도 상승·포화형: 턴 안 유리 번호 g 에 따른 챔버 온도(PPA와 공유) */
  function tempSeries(chamber, nGlass, o) {
    var out = [], r = rng(hashSeed('temp', chamber, (o && o.seed) || 0));
    for (var g = 1; g <= nGlass; g++) out.push(chamberTemp(chamber, g, { season: o && o.season, rng: r }));
    return out;
  }
  /* 증착 속도형: 소스 잔량 감소 → 서서히 하락, 소스 교체(PM) 때 복귀 */
  function rateSeries(n, o) {
    o = o || {};
    var r0 = o.r0 == null ? 2.0 : o.r0, k = o.decay == null ? 0.0004 : o.decay, noise = o.noise == null ? 0.006 : o.noise;
    var rep = {}; (o.replace_at || []).forEach(function (i) { rep[i] = 1; });
    var r = rng(o.seed == null ? 7 : o.seed), since = o.since0 || 0, y = [];
    for (var i = 0; i < n; i++) { if (rep[i]) since = 0; y.push(r0 * (1 - k * since) + r.normal(0, noise)); since++; }
    return y;
  }
  /* 자기상관형: AR(1). 주변 표준편차가 sd 가 되도록 혁신 분산을 조정. */
  function ar1Series(n, o) {
    o = o || {};
    var phi = o.phi == null ? 0.7 : o.phi, s = o.sd == null ? 1 : o.sd, mu = o.mean == null ? 0 : o.mean;
    var r = rng(o.seed == null ? 3 : o.seed), e = r.normal(0, s), y = [], inn = s * Math.sqrt(1 - phi * phi);
    for (var i = 0; i < n; i++) {
      if (i) e = phi * e + r.normal(0, inn);
      y.push(mu + e + (o.shift_at != null && i >= o.shift_at ? o.shift : 0));
    }
    return y;
  }
  function eventFlags(n, o) {                  // 이벤트·카운터형: 인터락 플래그와 밸브 동작 횟수
    o = o || {};
    var r = rng(o.seed == null ? 11 : o.seed), p = o.p == null ? 0.01 : o.p, flag = [], valve = [];
    for (var i = 0; i < n; i++) { flag.push(r.u() < p ? 1 : 0); valve.push(40 + r.int(5) + (flag[i] ? 6 : 0)); }
    return { interlock: flag, valve_count: valve };
  }
  /* 특징 추출: 정상구간 평균·표준편차·최대편차·정착시간·오버슈트 */
  function features(tr, o) {
    o = o || {};
    var w0 = o.win ? o.win[0] : 25, w1 = o.win ? o.win[1] : 50, tgt = o.target == null ? tr.target : o.target;
    var win = [], i;
    for (i = w0; i <= w1; i++) win.push(tr.y[i]);
    var sm = mean(win), ss = sd(win), md = 0;
    for (i = 0; i < win.length; i++) md = Math.max(md, Math.abs(win[i] - tgt));
    var band = 0.02 * sm, settle = null;
    for (i = tr.t_on; i < tr.t_off; i++) {
      var ok = true;
      for (var j = i; j < tr.t_off; j++) if (Math.abs(tr.y[j] - sm) > band) { ok = false; break; }
      if (ok) { settle = i - tr.t_on; break; }
    }
    var mx = -Infinity; for (i = tr.t_on; i < tr.t_off; i++) mx = Math.max(mx, tr.y[i]);
    return { steady_mean: sm, steady_std: ss, max_dev: md, settle_s: settle == null ? tr.t_off - tr.t_on : settle,
             overshoot_pct: Math.max(0, (mx - sm) / sm * 100) };
  }

  /* ============================================================
   * 5. Loss 사건 기반 시뮬레이션 (11개 블록 · 1분 해상도)
   * ============================================================ */
  var LOSS_CODES = ['EQ-BD', 'EQ-PM', 'Q-MASK', 'Q-EVAP', 'LG-TRANS', 'LG-STK', 'LG-CST', 'LG-JC', 'CL-CAPA', 'JC-EARLY', 'RUN-TRIPLE'];
  var LOSS_META = {
    'EQ-BD': ['설비', '설비 고장'], 'EQ-PM': ['설비', '정규 PM'], 'Q-MASK': ['품질', '마스크 기인 불량'],
    'Q-EVAP': ['품질', '증착기 기인 불량'], 'LG-TRANS': ['물류', '유리·마스크 반송 문제'], 'LG-STK': ['물류', 'stocker full'],
    'LG-CST': ['물류', '마스크 카세트 부족'], 'LG-JC': ['물류', '동시 잡 체인지·PM 반송 부하'], 'CL-CAPA': ['세정', '세정기 capa 부족'],
    'JC-EARLY': ['운영', '조기 잡 체인지'], 'RUN-TRIPLE': ['운영', 'triple 투입 조절'],
    'LB-LINE': ['라인', '라인 밸런스(상·하류 블록 때문에 굶거나 막힘; 11개 코드 외 파생 사유)']
  };

  function simulateLoss(o) {
    o = o || {};
    var days = o.days || 60, END = days * 1440, R = rng(o.seed == null ? 20261011 : o.seed);
    var P = {
      CT: CFG.CT, T_TURN: CFG.N_TURN * CFG.CT, CAP: 27, CLEAN: 180, TRCAP: 16, SPARE_CST: 2, TR: 30, TOSTK: 20,
      MTBF_BD: 14 * 1440, BD_MED: 180, MTBF_EV: 12 * 1440, EV_MED: 90, PM_PERIOD: 14 * 1440, PM_DUR: 360,
      PM_HOLD: 60, P_MASK0: 0.004, P_MASK_AGE: 0.0003, P_MASK_OPEN: 0.1, REPAIR_MED: 600,
      FILL_BASE: 50, FILL_Q: 1.0, FILL_RDY: 1.0, FILL_PM: 1.2, FILL_THR: 90, BUFMAX: 40, BUF0: 20, THROTTLE: 0.9,
      FAULT_MEAN: 6 * 1440, FAULT_MED: 45, BG_REQ: 0.35, LB_MIN: 90
    };
    if (o.params) for (var pk in o.params) P[pk] = o.params[pk];
    var NOMCAP = 4 / P.CT;
    var events = [], hourly = [], turns = [], reqHour = [], cleanQ = [], cleanRun = [], arrivals = [], repairBench = [];
    var fill = P.FILL_BASE, ou = 0, faultUntil = -1, nextFault = R.exp(P.FAULT_MEAN), reqNow = 0, outHour = 0;
    var blocks = [], b, c, s, i;
    /* ---- ESTC 기록 훅(o.trace === true 일 때만 동작·난수 R 을 부르지 않고 상태를 읽기만 한다) ---- */
    var TRACE = o.trace === true, trans = [], resTr = [], curSt = {};
    function tr(t, ent, id, to, trig, cause) {
      var key = ent + ':' + id, from = curSt[key] || 'init';
      if (from === to) return;
      trans.push({ t: t, entity: ent, id: id, from: from, to: to, trigger: trig, cause: cause || '' }); curSt[key] = to;
    }
    function trm(t, mk, to, trig, cause) { tr(t, 'mask', mk.id, to, trig, cause); }
    function trs(t, S, to, trig) { tr(t, 'set', S.block + '-' + S.name, to, trig, ''); }
    function trc(t, B, ci, to, trig, cause) { tr(t, 'chamber', B.id + '-CH' + (ci + 1), to, trig, cause); }
    function mst(mk) { return curSt['mask:' + mk.id]; }

    function hr(t) { return Math.floor(t / 60); }
    function addReq(t, n) { var h = hr(t); reqHour[h] = (reqHour[h] || 0) + n; }

    /* ---- 블록 초기화 ---- */
    var pmIdx = 0;
    BLOCKS.forEach(function (bid, bi) {
      var B = { id: bid, bi: bi, fmm: isFMM(bid), ch: [], sets: {}, dep: null, elapsed: 0, glass: [0, 0, 0, 0], want: false, early: false,
                idleEv: null, idleMin: 0, rootMin: {}, catchup: false, catchupRoot: '', lastEarly: false, tri: null,
                done: 0, doneAtTurn: 0, turnStart: 0, lb: null, lbQuiet: 0, cap: 0, rootNow: '', turnNo: 0 };
      for (var ci = 0; ci < 4; ci++) {
        var pmOff = (bid === 'B03' && ci === 1) ? 0.5 * 1440 : R.u() * P.PM_PERIOD;
        B.ch.push({ st: 'run', until: 0, ev: null, reason: '', root: '', nextBD: R.exp(P.MTBF_BD), nextEV: R.exp(P.MTBF_EV), nextPM: pmOff, pmStart: -1 });
      }
      SETS.forEach(function (sn) {
        var masks = []; for (var m = 0; m < 4; m++) { masks.push({ ch: m, avail: true, age: R.int(10), failAt: -1, failed: false }); if (TRACE) masks[m].id = maskId(bid, sn, m + 1); }
        B.sets[sn] = { name: sn, block: bid, turn: 0, state: 'ready', readyAt: 0, pending: 0, masks: masks };
      });
      blocks.push(B);
    });

    function modeName(B) { var n = 0; B.ch.forEach(function (x) { if (x.st !== 'run') n++; }); return n === 0 ? 'quad' : n === 1 ? 'triple' : 'degraded'; }
    function nRun(B) { var n = 0; B.ch.forEach(function (x) { if (x.st === 'run') n++; }); return n; }
    function openEv(t, B, ch, reason, root, extra) {
      var e = { start_min: t, end_min: null, block: B.id, chamber: ch, reason: reason, root_cause: root, caused_by_block: B.id,
                run_mode: modeName(B), mask_set: B.dep ? B.dep.name : '', turn: B.dep ? B.dep.turn : 0, loss_chamber_min: 0, _acc: 0 };
      if (extra) for (var k in extra) e[k] = extra[k];
      events.push(e); return e;
    }
    function closeEv(e, t, loss) { e.end_min = t; e.loss_chamber_min = loss == null ? t - e.start_min : loss; }

    /* ---- 세트 투입(잡 체인지) ---- */
    function enterDep(B, S, t) {
      S.state = 'dep'; S.turn++; B.dep = S; B.elapsed = 0; B.glass = [0, 0, 0, 0]; B.want = false; B.early = false;
      B.turnStart = t; B.doneAtTurn = B.done; B.turnNo++;
      if (TRACE) trs(t, S, 'dep', 'job_change');
      for (var ci = 0; ci < 4; ci++) {
        var mk = S.masks[ci], ch = B.ch[ci];
        mk.failed = false; mk.failAt = -1;
        if (!mk.avail) {
          if (ch.st === 'run') { ch.st = 'mask'; ch.reason = 'Q-MASK'; ch.root = 'Q-MASK'; ch.ev = openEv(t, B, B.id === '' ? '' : 'CH' + (ci + 1), 'Q-MASK', 'Q-MASK'); if (TRACE) trc(t, B, ci, 'mask', 'mask_missing', 'Q-MASK'); }
        } else {
          if (TRACE) trm(t, mk, 'in_use', 'job_change', 'age=' + mk.age);
          var pf = (B.fmm ? P.P_MASK0 : P.P_MASK0 * P.P_MASK_OPEN) + (B.fmm ? P.P_MASK_AGE : P.P_MASK_AGE * P.P_MASK_OPEN) * mk.age;
          if (R.u() < pf) mk.failAt = Math.floor(P.T_TURN * (0.1 + 0.8 * R.u()));
        }
      }
    }
    function leaveDep(B, t) {
      var S = B.dep, nUnits = 0;
      turns.push({ block: B.id, set: S.name, turn: S.turn, start_min: B.turnStart, end_min: t, serial0: Math.floor(B.doneAtTurn),
                   glass: B.glass.map(function (g) { return Math.floor(g); }), early: B.early ? 1 : 0 });
      for (var ci = 0; ci < 4; ci++) {
        var mk = S.masks[ci], ch = B.ch[ci];
        if (ch.st === 'mask') { closeEv(ch.ev, t); ch.st = 'run'; ch.ev = null; ch.nextBD = t + R.exp(P.MTBF_BD); ch.nextEV = t + R.exp(P.MTBF_EV); if (TRACE) trc(t, B, ci, 'run', 'set_leave', 'Q-MASK'); }
        if (mk.failed) { mk.avail = false; repairBench.push({ mk: mk, doneAt: t + P.TR + R.lognormal(P.REPAIR_MED, 0.5), set: S }); if (TRACE) trm(t, mk, 'repair', 'turn_end_defect', 'Q-MASK'); }
        else if (mk.avail) { if (TRACE) trm(t, mk, 'to_clean', mst(mk) === 'in_use' ? 'turn_end' : 'turn_end_unused', ''); mk.age++; arrivals.push({ at: t + P.TR, u: { set: S, mk: mk, repair: false } }); nUnits++; }
      }
      S.state = 'out'; S.pending = nUnits; B.dep = null; addReq(t, 2);
      if (nUnits === 0) S.state = 'clean';
      if (TRACE) trs(t, S, S.state, 'turn_end');
    }

    /* ---- 막힘 사유(잡 체인지를 못 하게 하는 공유 자원) ---- */
    function nPMhold(t) {
      var n = 0;
      blocks.forEach(function (B) { B.ch.forEach(function (x) { if (x.st === 'pm' && (t - x.pmStart < P.PM_HOLD || x.until - t < P.PM_HOLD)) n++; }); });
      return n;
    }
    function anyRepairUnit() {
      for (var k = 0; k < cleanQ.length; k++) if (cleanQ[k].repair) return true;
      for (k = 0; k < cleanRun.length; k++) if (cleanRun[k].u.repair) return true;
      return false;
    }
    function pmThisHour(t) { var h = hr(t), n = 0; blocks.forEach(function (B) { B.ch.forEach(function (x) { if (x.st === 'pm' && (hr(x.pmStart) === h || hr(x.until) === h)) n++; }); }); return n > 0; }
    function readySet(B) { for (var k = 0; k < 3; k++) { var S = B.sets[SETS[k]]; if (S.state === 'ready') return S; } return null; }
    function readyCount(B) { var n = 0; SETS.forEach(function (x) { if (B.sets[x].state === 'ready') n++; }); return n; }
    function blocker(B, t) {
      if (!readySet(B)) {
        if (cleanQ.length > 0) return { reason: 'CL-CAPA', root: anyRepairUnit() ? 'Q-MASK' : 'CL-CAPA' };
        if (faultUntil > t) return { reason: 'LG-TRANS', root: 'LG-TRANS' };
        return { reason: 'CL-CAPA', root: B.lastEarly ? 'JC-EARLY' : 'CL-CAPA' };
      }
      if (P.SPARE_CST - nPMhold(t) < 1) return { reason: 'LG-CST', root: 'EQ-PM' };
      if (fill > P.FILL_THR) return { reason: 'LG-STK', root: cleanQ.length > 6 ? 'CL-CAPA' : 'LG-STK' };
      if (faultUntil > t) return { reason: 'LG-TRANS', root: 'LG-TRANS' };
      if ((reqHour[hr(t)] || 0) + 2 > P.TRCAP) return { reason: 'LG-JC', root: pmThisHour(t) ? 'EQ-PM' : 'LG-JC' };
      return null;
    }

    /* ---- 초기 상태: 블록마다 위상을 흩뜨려 동기화 방지 ---- */
    blocks.forEach(function (B) {
      var first = B.sets[SETS[R.int(3)]];
      if (TRACE) B.ch.forEach(function (x, ci) { trc(0, B, ci, 'run', 'init', ''); });
      enterDep(B, first, 0);
      B.elapsed = R.int(P.T_TURN - 20);
      B.buf = P.BUF0;
      SETS.forEach(function (sn) {
        var S = B.sets[sn]; if (S === first) return;
        S.turn = 5 + R.int(5);
        if (R.u() < 0.5) S.state = 'ready';
        else { S.state = 'out'; S.pending = 4; for (var m = 0; m < 4; m++) arrivals.push({ at: R.int(60), u: { set: S, mk: S.masks[m], repair: false } }); }
        if (TRACE) { trs(0, S, S.state, 'init'); S.masks.forEach(function (mk) { trm(0, mk, S.state === 'ready' ? 'stock' : 'to_clean', 'init', ''); }); }
      });
    });

    var tri = null;
    /* ---- 메인 루프 ---- */
    for (var t = 0; t < END; t++) {
      var h = hr(t);
      if (t % 60 === 0) {                                   // stocker 적재율 갱신(1시간 단위)
        ou = 0.85 * ou + R.normal(0, 2.5);
        var rc = 0, pmc = 0; blocks.forEach(function (B) { rc += readyCount(B); B.ch.forEach(function (x) { if (x.st === 'pm') pmc++; }); });
        fill = Math.max(0, Math.min(100, P.FILL_BASE + P.FILL_Q * cleanQ.length + P.FILL_RDY * rc + P.FILL_PM * pmc + ou));
        if (R.u() < P.BG_REQ * 2) addReq(t, 1);
      }
      if (t >= nextFault) { faultUntil = t + R.lognormal(P.FAULT_MED, 0.5); nextFault = t + R.exp(P.FAULT_MEAN); }

      /* 세정기 */
      for (i = arrivals.length - 1; i >= 0; i--) if (arrivals[i].at <= t) { var uu = arrivals[i].u; uu.enq = t; cleanQ.push(uu); arrivals.splice(i, 1); if (TRACE) trm(t, uu.mk, 'clean_wait', 'arrive', ''); }
      for (i = cleanRun.length - 1; i >= 0; i--) if (cleanRun[i].doneAt <= t) {
        var done = cleanRun[i].u;
        if (done.repair) { done.mk.avail = true; done.mk.age = 0; if (TRACE) trm(t, done.mk, 'stock', 'repair_clean_done', ''); } else { done.set.pending--; if (TRACE) trm(t, done.mk, 'held', 'clean_done', ''); }
        cleanRun.splice(i, 1);
      }
      while (cleanRun.length < P.CAP && cleanQ.length) { if (TRACE) trm(t, cleanQ[0].mk, 'cleaning', 'cleaner_free', ''); cleanRun.push({ u: cleanQ.shift(), doneAt: t + P.CLEAN * (0.9 + 0.2 * R.u()) }); }
      for (i = repairBench.length - 1; i >= 0; i--) if (repairBench[i].doneAt <= t) {
        cleanQ.push({ set: repairBench[i].set, mk: repairBench[i].mk, repair: true, enq: t }); if (TRACE) trm(t, repairBench[i].mk, 'clean_wait', 'repair_done', ''); repairBench.splice(i, 1);
      }
      for (b = 0; b < 11; b++) SETS.forEach(function (sn) {
        var S = blocks[b].sets[sn];
        if ((S.state === 'out' || S.state === 'clean') && S.pending <= 0 && S.state !== 'xfer') {
          S.state = 'xfer'; S.readyAt = t + P.TOSTK; addReq(t, 1);
          if (TRACE) { trs(t, S, 'xfer', 'all_masks_back'); S.masks.forEach(function (mk) { if (mst(mk) === 'held') trm(t, mk, 'to_stock', 'set_complete', ''); }); }
        }
        else if (S.state === 'xfer' && t >= S.readyAt) {
          S.state = 'ready';
          if (TRACE) { trs(t, S, 'ready', 'stocker_in'); S.masks.forEach(function (mk) { if (mst(mk) === 'to_stock') trm(t, mk, 'stock', 'stocker_in', ''); }); }
        }
      });

      /* 블록별 */
      var capArr = new Array(11), rootArr = new Array(11);
      for (b = 0; b < 11; b++) {
        var B = blocks[b];
        for (c = 0; c < 4; c++) {                           // 챔버 상태
          var ch = B.ch[c], cn = 'CH' + (c + 1);
          if (ch.st === 'run') {
            if (t >= ch.nextBD) { ch.st = 'bd'; ch.reason = 'EQ-BD'; ch.root = 'EQ-BD'; ch.until = t + R.lognormal(P.BD_MED, 0.6); ch.ev = openEv(t, B, cn, 'EQ-BD', 'EQ-BD'); if (TRACE) trc(t, B, c, 'bd', 'breakdown', 'EQ-BD'); }
            else if (t >= ch.nextEV) { ch.st = 'ev'; ch.reason = 'Q-EVAP'; ch.root = 'Q-EVAP'; ch.until = t + R.lognormal(P.EV_MED, 0.5); ch.ev = openEv(t, B, cn, 'Q-EVAP', 'Q-EVAP'); if (TRACE) trc(t, B, c, 'ev', 'evap_fault', 'Q-EVAP'); }
            else if (t >= ch.nextPM) { ch.st = 'pm'; ch.reason = 'EQ-PM'; ch.root = 'EQ-PM'; ch.pmStart = t; ch.until = t + P.PM_DUR; ch.nextPM = t + P.PM_PERIOD; ch.ev = openEv(t, B, cn, 'EQ-PM', 'EQ-PM'); addReq(t, 2); if (TRACE) trc(t, B, c, 'pm', 'pm_start', 'EQ-PM'); }
          } else if (ch.st !== 'mask' && t >= ch.until) {
            if (ch.st === 'pm') addReq(t, 2);
            if (TRACE) trc(t, B, c, 'run', 'recovered', ch.reason);
            closeEv(ch.ev, t); ch.st = 'run'; ch.ev = null; ch.nextBD = t + R.exp(P.MTBF_BD); ch.nextEV = t + R.exp(P.MTBF_EV);
          }
        }
        if (B.dep) {                                        // 마스크 중도 불량
          for (c = 0; c < 4; c++) {
            var mk = B.dep.masks[c], ch2 = B.ch[c];
            if (mk.failAt >= 0 && !mk.failed && B.elapsed >= mk.failAt && ch2.st === 'run') {
              mk.failed = true; ch2.st = 'mask'; ch2.reason = 'Q-MASK'; ch2.root = 'Q-MASK'; ch2.ev = openEv(t, B, 'CH' + (c + 1), 'Q-MASK', 'Q-MASK');
              if (TRACE) trc(t, B, c, 'mask', 'mask_failure', 'Q-MASK');
            }
          }
        }
        /* triple 투입 조절 이벤트 */
        var exc = B.ch.filter(function (x) { return x.st !== 'run'; });
        var wantCh = exc.length === 1 ? exc[0] : null;
        if (B.tri && (!wantCh || B.tri.ref !== wantCh)) { closeEv(B.tri.ev, t, B.tri.ev._acc); B.tri = null; }
        if (wantCh && !B.tri) { B.tri = { ref: wantCh, ev: openEv(t, B, 'ALL', 'RUN-TRIPLE', wantCh.root) }; B.tri.ev.run_mode = 'triple'; }

        var nr = nRun(B), blockedNow = null;
        /* 잡 체인지 판단 */
        if (B.dep) {
          if (!B.want) {
            if (B.elapsed >= P.T_TURN) { B.want = true; B.early = false; B.idleMin = 0; B.rootMin = {}; }
            else if (B.catchup && B.elapsed >= 0.6 * P.T_TURN && readyCount(B) >= 2) { B.want = true; B.early = true; B.idleMin = 0; B.rootMin = {}; }
          }
          if (B.want) {
            blockedNow = blocker(B, t);
            if (blockedNow) {
              if (!B.idleEv || B.idleEv.reason !== blockedNow.reason || B.idleEv.root_cause !== blockedNow.root) {
                if (B.idleEv) closeEv(B.idleEv, t, B.idleEv._acc);
                B.idleEv = openEv(t, B, 'ALL', blockedNow.reason, blockedNow.root);
              }
              B.idleEv._acc += nr; B.idleMin++; B.rootMin[blockedNow.root] = (B.rootMin[blockedNow.root] || 0) + 1;
            } else {                                        // 교체 실행
              if (B.idleEv) { closeEv(B.idleEv, t, B.idleEv._acc); B.idleEv = null; }
              var early = B.early, remain = P.T_TURN - B.elapsed, nrNow = nr;
              if (B.tri) { closeEv(B.tri.ev, t, B.tri.ev._acc); B.tri = null; }
              var Y = readySet(B);
              leaveDep(B, t);
              if (early) {
                var ee = openEv(t, B, 'ALL', 'JC-EARLY', B.catchupRoot || 'CL-CAPA'); closeEv(ee, t + remain, remain * nrNow);
                B.catchup = false; B.lastEarly = true;
              } else {
                B.lastEarly = false;
                if (B.idleMin >= 20) {
                  B.catchup = true; var bestR = '', bm = -1; for (var rk in B.rootMin) if (B.rootMin[rk] > bm) { bm = B.rootMin[rk]; bestR = rk; }
                  B.catchupRoot = bestR;
                }
              }
              enterDep(B, Y, t); addReq(t, 2);
              nr = nRun(B);
            }
          }
        }
        if (TRACE) {                                        // 블록 상태(바뀔 때만 기록)
          var bs = B.dep && B.want && blockedNow ? 'wait_jc' : (nr === 4 ? 'quad' : nr === 3 ? 'triple' : 'degraded');
          var bfrom = curSt['block:' + B.id] || 'init', bcause = '', btrig = 'chamber_change';
          if (bs === 'wait_jc') { bcause = blockedNow.reason; btrig = 'turn_end_blocked'; }
          else { var bx = B.ch.filter(function (x) { return x.st !== 'run'; })[0]; bcause = bx ? bx.root : ''; btrig = bfrom === 'wait_jc' ? 'job_change' : bfrom === 'init' ? 'init' : (bx ? 'chamber_stop' : 'chamber_resume'); }
          tr(t, 'block', B.id, bs, btrig, bcause);
        }
        /* 용량과 유리 처리 */
        var cap = 0;
        if (B.dep && !(B.want && blockedNow)) cap = nr === 4 ? NOMCAP : nr * P.THROTTLE / P.CT;
        if (nr === 4) cap = B.dep && !(B.want && blockedNow) ? NOMCAP : 0;
        B.cap = cap; capArr[b] = cap;
        rootArr[b] = B.idleEv ? B.idleEv.root_cause : (B.tri ? B.tri.ref.root : (nr < 4 && B.dep ? (B.ch.filter(function (x) { return x.st !== 'run'; })[0] || {}).root || '' : ''));
      }
      /* 라인 흐름(버퍼) — 상류에서 하류로 */
      var bott = -1, minRatio = 0.999;
      for (b = 0; b < 11; b++) if (capArr[b] / NOMCAP < minRatio) { minRatio = capArr[b] / NOMCAP; bott = b; }
      for (b = 0; b < 11; b++) {
        B = blocks[b];
        var cp = capArr[b], p = cp, starved = false, blockedDown = false;
        if (b > 0 && blocks[b - 1].buf < p) { p = blocks[b - 1].buf; starved = true; }
        if (b < 10 && P.BUFMAX - B.buf < p) { p = Math.max(0, P.BUFMAX - B.buf); blockedDown = true; }
        if (b > 0) blocks[b - 1].buf -= p;
        if (b < 10) B.buf += p; else outHour += p;
        B.done += p;
        var nr2 = nRun(B);
        if (nr2 > 0 && p > 0) for (c = 0; c < 4; c++) if (B.ch[c].st === 'run') B.glass[c] += p / nr2;
        if (B.dep && !(B.want && B.idleEv)) B.elapsed++;
        if (B.tri && cp > 0) B.tri.ev._acc += 0.1 * 3;
        /* 라인 밸런스 손실 */
        var lossNow = cp > 0 ? nr2 * (1 - p / cp) : 0;
        if (lossNow > 0.02 && (starved || blockedDown)) {
          var cb = bott >= 0 && bott !== b ? bott : (starved ? Math.max(0, b - 1) : Math.min(10, b + 1));
          var rt = rootArr[cb] || 'EQ-BD';
          if (B.lb && (B.lb.caused_by_block !== BLOCKS[cb] || B.lb.root_cause !== rt)) { closeEv(B.lb, t, B.lb._acc); B.lb = null; }
          if (!B.lb) { B.lb = openEv(t, B, 'ALL', 'LB-LINE', rt); B.lb.caused_by_block = BLOCKS[cb]; }
          B.lb._acc += lossNow; B.lbQuiet = 0;
        } else if (B.lb) {
          B.lbQuiet++; if (B.lbQuiet > 45) { closeEv(B.lb, t - 45, B.lb._acc); B.lb = null; }
        }
      }
      if (t % 60 === 59) {
        var tripN = 0, idleN = 0, wip = 0;
        blocks.forEach(function (B2) { if (modeName(B2) === 'triple') tripN++; if (B2.want && B2.idleEv) idleN++; wip += B2.buf; });
        hourly.push({ ts: isoTs(h * 60), stocker_fill: +fill.toFixed(1), cleaner_queue: cleanQ.length, cleaner_busy: cleanRun.length,
                      cassette_free: P.SPARE_CST - nPMhold(t), transport_requests: reqHour[h] || 0, blocks_triple: tripN, blocks_idle: idleN,
                      line_wip: Math.round(wip), line_out: Math.round(outHour) });
        if (TRACE) resTr.push({ t: h * 60, cleaning: cleanRun.length, clean_wait: cleanQ.length, stocker_fill: +fill.toFixed(1), cassette_free: P.SPARE_CST - nPMhold(t) });
        outHour = 0;
      }
    }
    /* 종료 처리 */
    blocks.forEach(function (B2) {
      B2.ch.forEach(function (x) { if (x.ev && x.ev.end_min == null) closeEv(x.ev, END); });
      if (B2.tri && B2.tri.ev.end_min == null) closeEv(B2.tri.ev, END, B2.tri.ev._acc);
      if (B2.idleEv && B2.idleEv.end_min == null) closeEv(B2.idleEv, END, B2.idleEv._acc);
      if (B2.lb && B2.lb.end_min == null) closeEv(B2.lb, END, B2.lb._acc);
      if (B2.dep) turns.push({ block: B2.id, set: B2.dep.name, turn: B2.dep.turn, start_min: B2.turnStart, end_min: END, serial0: Math.floor(B2.doneAtTurn), glass: B2.glass.map(Math.floor), early: 0 });
    });
    events = events.filter(function (e) { return e.reason !== 'LB-LINE' || e.loss_chamber_min >= P.LB_MIN; });
    events.sort(function (a, z) { return a.start_min - z.start_min || (a.block < z.block ? -1 : 1); });
    events.forEach(function (e, k) {
      e.event_id = 'E' + pad(k + 1, 5); e.start_ts = isoTs(e.start_min); e.end_ts = isoTs(e.end_min);
      e.loss_chamber_min = +e.loss_chamber_min.toFixed(1); e.loss_glass = +(e.loss_chamber_min / P.CT).toFixed(1); delete e._acc;
    });
    turns.sort(function (a, z) { return a.start_min - z.start_min; });
    var out = { events: events, hourly: hourly, turns: turns, params: P, days: days };
    if (TRACE) { out.transitions = trans; out.resources = resTr; out.end = END; }
    return out;
  }

  /* ============================================================
   * 5.5 ESTC 층 — 개체·상태·전이·제약 (simulateLoss({trace:true}) 의 기록을 읽는다)
   *   표(ESTC)는 순수 데이터: 화면·Python 검증이 같은 표를 쓴다. 시뮬레이터 본체는 이 표를 모른다(기록 훅만 있음).
   * ============================================================ */
  var MASK_ST = [
    ['stock', '대기', 'stocker 안 세트 속에서 다음 장착을 기다림'], ['to_clean', '세정기로 반송', '턴이 끝나 세정기로 옮겨 가는 중(30분)'],
    ['clean_wait', '세정 대기열', '세정기 자리가 나기를 기다림'], ['cleaning', '세정 중', '세정기 안(약 180분)'],
    ['held', '짝 대기', '세정은 끝났으나 세트의 나머지 마스크를 기다림'], ['to_stock', 'stocker로 반송', '세트가 모두 모여 stocker 로 옮겨 가는 중(20분)'],
    ['in_use', '장착·증착', '챔버에 걸려 유리를 증착하는 중'], ['repair', '리페어', '불량 표시 뒤 리페어 대기·작업(반송 포함)'], ['scrapped', '제외', '폐기(시뮬레이터는 내지 않음 — 사람 승인 전이)']
  ];
  function stList(a) { return a.map(function (x) { return { id: x[0], ko: x[1], desc: x[2] }; }); }
  var ESTC_TRANS = [];
  function T(ent, from, to, trig, guard, gid, rev, human) { ESTC_TRANS.push({ entity: ent, from: from, to: to, trigger: trig, guard: guard, guard_id: gid || null, reversible: rev !== false, needs_human: !!human }); }
  (function () {
    T('mask', 'init', 'stock', 'init', '기록 시작 시각의 초기 상태'); T('mask', 'init', 'to_clean', 'init', '기록 시작 시각의 초기 상태'); T('mask', 'init', 'in_use', 'init', '기록 시작 시각의 초기 상태');
    T('mask', 'stock', 'in_use', 'job_change', '세트가 ready 이고 같은 블록에 증착 중인 세트가 없음(턴 끝 또는 조기 잡 체인지 조건)', 'set_ready');
    T('mask', 'in_use', 'to_clean', 'turn_end', '턴이 끝났고 불량 표시가 없음');
    T('mask', 'stock', 'to_clean', 'turn_end_unused', '턴 도중 리페어에서 돌아와 장착 못 한 마스크도 세트와 함께 세정으로 보냄');
    T('mask', 'in_use', 'repair', 'turn_end_defect', '턴 중 불량 표시가 붙었고 턴이 끝남');
    T('mask', 'to_clean', 'clean_wait', 'arrive', '반송 30분이 지남');
    T('mask', 'repair', 'clean_wait', 'repair_done', '리페어와 반송이 끝남');
    T('mask', 'clean_wait', 'cleaning', 'cleaner_free', '세정기 사용 중 수 < 세정 동시 한도(27장)', 'cleaner_free');
    T('mask', 'cleaning', 'held', 'clean_done', '세정이 끝났음(정상 경로)');
    T('mask', 'cleaning', 'stock', 'repair_clean_done', '리페어 뒤 세정이 끝났음(바로 세트에 복귀)');
    T('mask', 'held', 'to_stock', 'set_complete', '세트의 나머지 마스크(빠진 장 제외)가 모두 짝 대기', 'set_all_back');
    T('mask', 'to_stock', 'stock', 'stocker_in', 'stocker 반송 20분이 지남');
    T('mask', 'repair', 'scrapped', 'scrap', '사람 승인 — 되돌릴 수 없음', null, false, true);
    T('mask', 'in_use', 'scrapped', 'scrap', '사람 승인 — 되돌릴 수 없음', null, false, true);
    T('set', 'init', 'ready', 'init', '기록 시작 시각의 초기 상태'); T('set', 'init', 'out', 'init', '기록 시작 시각의 초기 상태'); T('set', 'init', 'dep', 'job_change', '블록마다 한 세트가 증착 중으로 시작');
    T('set', 'ready', 'dep', 'job_change', '같은 블록에 증착 중인 세트가 없음(턴 끝 또는 조기 잡 체인지 조건)');
    T('set', 'dep', 'out', 'turn_end', '턴이 끝나 마스크가 세정 경로로 흩어짐'); T('set', 'dep', 'clean', 'turn_end', '모든 마스크가 리페어로 빠져 세정 경로에 남은 장이 없음');
    T('set', 'out', 'xfer', 'all_masks_back', '세정 경로에 남은 마스크가 없음'); T('set', 'clean', 'xfer', 'all_masks_back', '세정 경로에 남은 마스크가 없음');
    T('set', 'xfer', 'ready', 'stocker_in', 'stocker 반송 20분이 지남');
    T('chamber', 'init', 'run', 'init', '기록 시작 시각의 초기 상태');
    [['bd', 'breakdown', '고장이 남'], ['ev', 'evap_fault', '증착기 기인 불량이 남'], ['pm', 'pm_start', '정규 PM 주기가 됨'], ['mask', 'mask_failure', '턴 중 마스크 불량 표시'], ['mask', 'mask_missing', '장착할 마스크가 세트에 없음(리페어 중)']].forEach(function (x) { T('chamber', 'run', x[0], x[1], x[2]); });
    [['bd', 'recovered'], ['ev', 'recovered'], ['pm', 'recovered'], ['mask', 'set_leave']].forEach(function (x) { T('chamber', x[0], 'run', x[1], x[0] === 'mask' ? '세트가 빠져 나감(턴 끝)' : '정지가 끝남'); });
    ['quad', 'triple', 'degraded'].forEach(function (b) { T('block', 'init', b, 'init', '기록 시작 시각의 초기 상태(그 시각 가동 중인 챔버 수)'); });
    ['quad', 'triple', 'degraded', 'wait_jc'].forEach(function (a) {
      ['quad', 'triple', 'degraded', 'wait_jc'].forEach(function (b) {
        if (a === b) return;
        T('block', a, b, b === 'wait_jc' ? 'turn_end_blocked' : a === 'wait_jc' ? 'job_change' : (a === 'quad' || (a === 'triple' && b === 'degraded')) ? 'chamber_stop' : 'chamber_resume',
          b === 'wait_jc' ? '턴이 끝났으나 잡 체인지를 못 함(막힘 사유 코드가 cause)' : a === 'wait_jc' ? '막힘이 풀려 잡 체인지 실행' : '정지한 챔버 수가 바뀜');
      });
    });
  })();
  var ESTC = {
    note: '가상 공장의 공정 상태 모델. 마스크·세트·챔버·블록은 전이를 쌓고, 세정기·stocker·카세트는 수량 자원, 유리는 연결 키로만 잇는다.',
    entities: [
      { name: 'mask', ko: '마스크', kind: 'transition', id_format: 'B03-A2 (블록-세트-챔버 번호)', states: stList(MASK_ST) },
      { name: 'set', ko: '마스크 세트', kind: 'transition', id_format: 'B03-A (블록-세트)', states: stList([['ready', '준비', '세트 4장이 stocker 에 모여 장착 대기'], ['dep', '증착 중', '블록에 걸려 한 턴을 돎'], ['out', '세정 중(흩어짐)', '마스크가 세정 경로에 흩어져 있음'], ['clean', '세정 끝(남은 장 없음)', '세정 경로에 남은 마스크가 없음'], ['xfer', 'stocker로 반송', '세트가 모여 stocker 로 옮겨 가는 중']]) },
      { name: 'chamber', ko: '챔버', kind: 'transition', id_format: 'B03-CH2 (블록-챔버)', states: stList([['run', '가동', '증착 중이거나 대기'], ['bd', '고장(EQ-BD)', '설비 고장으로 정지'], ['ev', '증착기 불량(Q-EVAP)', '증착기 기인 불량으로 정지'], ['pm', '정규 PM(EQ-PM)', '정규 PM 으로 정지'], ['mask', '마스크 정지(Q-MASK)', '마스크 불량 또는 마스크 없음으로 정지']]) },
      { name: 'block', ko: '블록', kind: 'transition', id_format: 'B03 (11개 블록)', states: stList([['quad', '4챔버 가동', '챔버 4개가 모두 가동'], ['triple', '3챔버 가동', '챔버 하나가 정지'], ['degraded', '2개 이상 정지', '챔버 둘 이상이 정지'], ['wait_jc', '잡 체인지 대기', '턴이 끝났는데 잡 체인지를 못 하고 있음(막힘 사유 코드가 cause)']]) },
      { name: 'cleaner', ko: '세정기', kind: 'resource', measure: '사용 중 장 수(≤ 동시 한도 27), 대기열 길이', states: [] },
      { name: 'stocker', ko: 'stocker', kind: 'resource', measure: '적재율(%) — 90% 를 넘으면 LG-STK', states: [] },
      { name: 'cassette', ko: '카세트', kind: 'resource', measure: '여유 카세트 수 = 예비 2 − PM 유보', states: [] },
      { name: 'glass', ko: '유리', kind: 'linked', measure: '전이를 쌓지 않음. 턴·유리 이력의 연결 키(블록·세트·턴·유리 번호)로 마스크 궤적에 이어짐', states: [] }
    ],
    transitions: ESTC_TRANS,
    constraints: [
      { id: 'C1', text: '세정 중인 마스크는 동시에 27장 이하', check: '전이 기록에서 cleaning 상태 수를 재구성해 매 시점 한도와 비교', enforced_by_sim: true },
      { id: 'C2', text: '한 블록에서 증착 중(dep)인 세트는 동시에 1개 이하', check: '세트 전이에서 블록별 dep 수를 재구성', enforced_by_sim: true },
      { id: 'C3', text: '한 개체는 한 시각에 한 상태 — 직전 전이의 to 가 다음 전이의 from', check: '개체별 전이 이음새 대조', enforced_by_sim: true },
      { id: 'C4', text: '챔버가 상태마다 머문 시간의 합 = 기록 기간', check: '챔버별 체류 분 합산', enforced_by_sim: true },
      { id: 'C5', text: 'PPA spec: |평균| + 3σ ≤ 기준(에이전트가 사례 판단에서 검사)', check: '기준값은 PPA 실험실에서 정함', enforced_by_sim: false },
      { id: 'C6', text: '마스크 턴 수 한계(표시용 기준값 — 가상값 20턴)', check: '시뮬레이터는 강제하지 않음', enforced_by_sim: false }
    ],
    params: { CAP: 27, TR: 30, TOSTK: 20, CLEAN: 180, TURN_LIMIT: 20, WAIT_CASE_MIN: 20 }
  };
  var ESTC_KEY = {};
  ESTC_TRANS.forEach(function (x, i) { ESTC_KEY[x.entity + '|' + x.from + '|' + x.to] = i; });

  function estcCheck(trans, o) {
    o = o || {};
    var CAP = o.cap == null ? ESTC.params.CAP : o.cap, end = o.end, viol = [], counts = { transitions: trans.length, by_entity: {}, by_rule: {} };
    var last = {}, lastT = {}, cleaning = 0, depN = {}, chFirst = {}, chDw = {}, tPrev = -Infinity, i;
    function V(rule, x, detail) { viol.push({ rule: rule, t: x.t, id: x.id, detail: detail }); counts.by_rule[rule] = (counts.by_rule[rule] || 0) + 1; }
    for (i = 0; i < trans.length; i++) {
      var x = trans[i], key = x.entity + ':' + x.id;
      counts.by_entity[x.entity] = (counts.by_entity[x.entity] || 0) + 1;
      if (x.t < tPrev) V('T1', x, '시각이 앞 줄보다 이름'); tPrev = Math.max(tPrev, x.t);
      if (ESTC_KEY[x.entity + '|' + x.from + '|' + x.to] == null) V('T0', x, '표에 없는 전이 ' + x.from + '→' + x.to);
      var prev = last[key] || 'init';
      if (x.from !== prev) V('C3', x, '직전 상태 ' + prev + ' 인데 from=' + x.from);
      if (lastT[key] != null && x.t < lastT[key]) V('T1', x, '같은 개체의 시각이 거꾸로');
      last[key] = x.to; lastT[key] = x.t;
      if (x.entity === 'mask') {
        if (x.to === 'cleaning') { cleaning++; if (cleaning > CAP) V('C1', x, '세정 중 ' + cleaning + '장 > 한도 ' + CAP); }
        if (x.from === 'cleaning') cleaning--;
      } else if (x.entity === 'set') {
        var blk = x.id.slice(0, 3);
        if (x.to === 'dep') { depN[blk] = (depN[blk] || 0) + 1; if (depN[blk] > 1) V('C2', x, '블록 ' + blk + ' 에 증착 중 세트 ' + depN[blk] + '개'); }
        if (x.from === 'dep') depN[blk]--;
      } else if (x.entity === 'chamber') {
        var cd = chDw[x.id] || (chDw[x.id] = { st: null, t: 0, sum: 0, first: null });
        if (cd.first == null) cd.first = x.t; else cd.sum += x.t - cd.t; cd.t = x.t; cd.st = x.to;
      }
    }
    if (end != null) for (var cid in chDw) { var d = chDw[cid], tot = d.sum + (end - d.t); if (d.first !== 0 || tot !== end) viol.push({ rule: 'C4', t: end, id: cid, detail: '체류 합 ' + tot + ' ≠ 기록 기간 ' + end }), counts.by_rule.C4 = (counts.by_rule.C4 || 0) + 1; }
    return { ok: viol.length === 0, violations: viol, counts: counts };
  }
  function dwell(trans, id, end) {
    var out = {}, st = null, t0 = 0;
    for (var i = 0; i < trans.length; i++) {
      var x = trans[i]; if (x.id !== id) continue;
      if (st != null) out[st] = (out[st] || 0) + (x.t - t0);
      st = x.to; t0 = x.t;
    }
    if (st != null && end != null) out[st] = (out[st] || 0) + (end - t0);
    return out;
  }
  function trajectory(trans, id, t0, t1) {
    return trans.filter(function (x) { return x.id === id && (t0 == null || x.t >= t0) && (t1 == null || x.t <= t1); });
  }
  /* 시각 t 까지의 모든 개체 상태 + 세정기 사용 수 */
  function stateAt(trans, t) {
    var st = {}, rp = {}, cleaning = 0, cq = 0;
    for (var i = 0; i < trans.length; i++) {
      var x = trans[i]; if (x.t > t) break;
      st[x.entity + ':' + x.id] = x.to;
      if (x.entity === 'mask') { if (x.to === 'repair') rp[x.id] = 1; else if (x.to === 'stock' || x.to === 'in_use' || x.to === 'to_clean') delete rp[x.id]; if (x.to === 'cleaning') cleaning++; if (x.from === 'cleaning') cleaning--; if (x.to === 'clean_wait') cq++; if (x.from === 'clean_wait') cq--; }
    }
    return { t: t, states: st, repairPath: rp, cleaning: cleaning, clean_wait: cq };
  }
  /* 전이 요청 판정: 에이전트가 도구를 부르는 규칙 — 표에 있는가 → 사람 승인이 필요한가 → 가드를 통과하는가 */
  function requestTransition(snap, entity, id, to, cap) {
    var CAP = cap == null ? ESTC.params.CAP : cap, from = snap.states[entity + ':' + id] || 'init', k = ESTC_KEY[entity + '|' + from + '|' + to];
    if (k == null) return { ok: false, kind: 'not_in_table', from: from, to: to, reason: '표에 ' + from + ' → ' + to + ' 전이가 없습니다' };
    var row = ESTC_TRANS[k];
    if (row.needs_human) return { ok: false, kind: 'needs_human', from: from, to: to, trigger: row.trigger, reason: '되돌릴 수 없는 전이라 사람의 승인이 있어야 합니다' };
    if (row.guard_id === 'cleaner_free' && snap.cleaning >= CAP) return { ok: false, kind: 'guard_fail', from: from, to: to, trigger: row.trigger, reason: '세정기 ' + snap.cleaning + '/' + CAP + '장이 사용 중이라 자리가 없습니다' };
    var mm = entity === 'mask' ? parseMaskId(id) : null;
    if (row.guard_id === 'set_ready') {
      var sid = mm.block + '-' + mm.set, ss = snap.states['set:' + sid];
      if (ss !== 'ready') return { ok: false, kind: 'guard_fail', from: from, to: to, trigger: row.trigger, reason: '세트 ' + sid + ' 가 ready 가 아니라 ' + ss + ' 입니다' };
      for (var q = 0; q < SETS.length; q++) if (snap.states['set:' + mm.block + '-' + SETS[q]] === 'dep') return { ok: false, kind: 'guard_fail', from: from, to: to, trigger: row.trigger, reason: '블록 ' + mm.block + ' 에 세트 ' + SETS[q] + ' 가 이미 증착 중입니다' };
    }
    if (row.guard_id === 'set_all_back') {
      var bad = [];
      for (var n = 1; n <= 4; n++) { var oid = mm.block + '-' + mm.set + n, os = snap.states['mask:' + oid]; if (oid === id) continue; if (os === 'held' || os === 'to_stock' || os === 'stock' || os === 'repair' || (snap.repairPath[oid] && (os === 'clean_wait' || os === 'cleaning'))) continue; bad.push(oid + '=' + os); }
      if (bad.length) return { ok: false, kind: 'guard_fail', from: from, to: to, trigger: row.trigger, reason: '세트의 다른 마스크가 아직 짝 대기가 아닙니다(' + bad.join(', ') + ')' };
    }
    return { ok: true, kind: 'ok', from: from, to: to, trigger: row.trigger, reason: '표에 있고 가드를 통과했습니다' };
  }

  /* 사례 은행 양식 */
  var CASE_SCHEMA = {
    version: 1,
    fields: [
      { name: 'case_id', type: 'string', required: true, desc: '사례 번호(C00001 …), 시각 순' },
      { name: 't_detect', type: 'string', required: true, desc: '감지 시각 YYYY-MM-DD HH:MM (분 단위 이상)' },
      { name: 'entity', type: 'string', required: true, desc: '개체 종류(mask·block …)', enum: ['mask', 'set', 'chamber', 'block'] },
      { name: 'id', type: 'string', required: true, desc: '연결 키 형식의 개체 번호(예 B03-A2, B03)' },
      { name: 'state_before', type: 'string', required: true, desc: '판단 직전 상태(표의 상태 이름)' },
      { name: 'evidence', type: 'array', required: true, desc: '판단 근거 목록 {kind, ref, value} — 숫자와 출처' },
      { name: 'decision', type: 'object', required: true, desc: '{rule, why, by} — by 는 agent 또는 human' },
      { name: 'action', type: 'object', required: true, desc: '{transition:{from,to}, needs_human, approved_by}' },
      { name: 'state_after', type: 'string', required: true, desc: '행동 직후 상태' },
      { name: 'outcome', type: 'object', required: true, desc: '{t_check, result, value} — 정해진 확인 시각에 다시 채움' },
      { name: 'label', type: 'string', required: true, desc: '결과 확인 뒤 붙이는 이름표(0205 의 진성·가성 라벨과 같은 자리)', enum: ['recurred', 'not_recurred', 'censored', 'early_jc', 'no_early_jc'] },
      { name: 'links', type: 'object', required: true, desc: '{events:[event_id], turns:[{block,set,turn}]} — 이벤트·턴·유리 이력으로 잇는 키' },
      { name: 'text_log', type: 'string', required: false, desc: '같은 사례를 사람이 글로 적은 한 줄(비교용)' }
    ]
  };
  function validateCase(rec, o) {
    o = o || {};
    var errs = [], f = CASE_SCHEMA.fields;
    f.forEach(function (d) {
      var v = rec[d.name];
      if (v == null) { if (d.required) errs.push('필수 칸 없음: ' + d.name); return; }
      var ty = Array.isArray(v) ? 'array' : typeof v;
      if (ty !== d.type) errs.push(d.name + ' 형식 ' + ty + ' ≠ ' + d.type);
      if (d.enum && d.enum.indexOf(v) < 0) errs.push(d.name + ' 값 ' + v + ' 은 허용 목록에 없음');
    });
    if (errs.length) return errs;
    if (!/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(rec.t_detect)) errs.push('t_detect 형식(분 단위)');
    if (rec.outcome.t_check < rec.t_detect) errs.push('결과 확인 시각이 감지 시각보다 앞');
    if (['agent', 'human'].indexOf(rec.decision.by) < 0) errs.push('decision.by 는 agent 또는 human');
    var a = rec.action.transition || {};
    if (ESTC_KEY[rec.entity + '|' + a.from + '|' + a.to] == null && !(rec.entity === 'block' && a.from === 'wait_jc')) errs.push('행동 전이 ' + a.from + '→' + a.to + ' 가 표에 없음');
    else { var row = ESTC_TRANS[ESTC_KEY[rec.entity + '|' + a.from + '|' + a.to]]; if (row && row.needs_human && (!rec.action.needs_human || !rec.action.approved_by || rec.action.approved_by === 'rule')) errs.push('사람 승인이 필요한 전이인데 승인 칸이 비어 있음'); }
    return errs;
  }
  function caseRecords(sim) {
    if (!sim.transitions) throw new Error('simulateLoss({trace:true}) 결과가 필요합니다');
    var tr = sim.transitions, byMask = {}, blkRows = {}, i, cases = [];
    tr.forEach(function (x) { if (x.entity === 'mask') (byMask[x.id] || (byMask[x.id] = [])).push(x); else if (x.entity === 'block') (blkRows[x.id] || (blkRows[x.id] = [])).push(x); });
    var END = sim.end, qev = {};
    sim.events.forEach(function (e) { if (e.reason === 'Q-MASK' && e.chamber !== 'ALL') (qev[e.block + '|' + e.chamber] || (qev[e.block + '|' + e.chamber] = [])).push(e); });
    function turnOf(block, t) { for (var k = 0; k < sim.turns.length; k++) { var u = sim.turns[k]; if (u.block === block && u.start_min <= t && t < u.end_min) return u; } return null; }
    tr.forEach(function (x) {
      if (x.entity !== 'chamber' || x.to !== 'mask' || x.trigger !== 'mask_failure') return;
      var blk = x.id.slice(0, 3), cn = x.id.slice(-1), rows = null, mid = null, k;
      for (var s = 0; s < SETS.length && !mid; s++) { var cand = blk + '-' + SETS[s] + cn, rr = byMask[cand]; if (!rr) continue; for (k = 0; k < rr.length; k++) if (rr[k].to === 'repair' && rr[k].t >= x.t && rr[k].t - x.t < 400) { mid = cand; rows = rr; break; } }
      if (!mid) return;
      var kr = k, rep = rows[kr], age = null, tuse = null;
      for (var q = kr - 1; q >= 0; q--) if (rows[q].to === 'in_use') { age = +String(rows[q].cause).replace('age=', ''); tuse = rows[q].t; break; }
      var ev = (qev[blk + '|CH' + cn] || []).filter(function (e) { return e.start_min === x.t; })[0];
      var tBack = null, tNext = null, tEnd = null, res = '미확인', val = null;
      for (q = kr + 1; q < rows.length; q++) { if (tBack == null && rows[q].from === 'cleaning' && rows[q].to === 'stock') tBack = rows[q].t; else if (tBack != null && rows[q].to === 'in_use') { tNext = rows[q].t; if (rows[q + 1]) { tEnd = rows[q + 1].t; res = rows[q + 1].to === 'repair' ? '재불량' : '정상 반납'; val = tEnd - tNext; } break; } }
      var absent = 0, tFrom = rep.t, tTo = tNext == null ? END : tNext;
      (qev[blk + '|CH' + cn] || []).forEach(function (e) { if (e.mask_set === mid.slice(4, 5) && e.start_min > rep.t && e.start_min < tTo) absent += e.loss_chamber_min; });
      var tc = tEnd == null ? END : tEnd, u = turnOf(blk, x.t), lbl = res === '재불량' ? 'recurred' : res === '정상 반납' ? 'not_recurred' : 'censored';
      cases.push({ _t: x.t, case_id: '', t_detect: isoTs(x.t), entity: 'mask', id: mid, state_before: 'in_use',
        evidence: [{ kind: 'event', ref: ev ? ev.event_id : '', value: '챔버 ' + x.id.slice(4) + ' 마스크 정지 ' + (ev ? ev.loss_chamber_min : 0) + '분' },
                   { kind: 'mask_age', ref: mid, value: age }, { kind: 'transition', ref: mid + '@' + isoTs(rep.t), value: 'in_use→repair' }],
        decision: { rule: 'R-MASK-REPAIR', why: '턴 중 마스크 불량 표시(장착 때 이미 ' + age + '턴을 쓴 마스크), 챔버 정지 ' + (ev ? ev.loss_chamber_min : 0) + '분 → 턴 끝에 리페어로 보냄', by: 'agent' },
        action: { transition: { from: 'in_use', to: 'repair' }, needs_human: false, approved_by: 'rule' }, state_after: 'repair',
        outcome: { t_check: isoTs(tc), result: res, value: val, absent_min: Math.round(absent), t_back: tBack == null ? null : isoTs(tBack) }, label: lbl,
        links: { events: ev ? [ev.event_id] : [], turns: u ? [{ block: u.block, set: u.set, turn: u.turn }] : [] },
        text_log: isoTs(x.t).slice(5) + ' ' + blk + ' CH' + cn + ' 마스크 불량으로 정지, 리페어 보냄' });
    });
    Object.keys(blkRows).forEach(function (blk) {
      var rows = blkRows[blk];
      rows.forEach(function (x, k) {
        if (x.to !== 'wait_jc') return;
        var nx = rows[k + 1]; if (!nx) return;
        var dur = nx.t - x.t; if (dur < ESTC.params.WAIT_CASE_MIN) return;
        var by = {}, ids = [];
        sim.events.forEach(function (e) {
          if (e.block !== blk || e.chamber !== 'ALL' || ['CL-CAPA', 'LG-TRANS', 'LG-STK', 'LG-CST', 'LG-JC'].indexOf(e.reason) < 0) return;
          var ov = Math.min(e.end_min, nx.t) - Math.max(e.start_min, x.t); if (ov <= 0) return;
          by[e.reason] = (by[e.reason] || 0) + ov; ids.push(e.event_id);
        });
        var top = x.cause, best = -1; for (var rk in by) if (by[rk] > best) { best = by[rk]; top = rk; }
        var h = Math.floor(x.t / 60), rs = sim.resources[Math.min(h, sim.resources.length - 1)], u = null;
        for (var m = 0; m < sim.turns.length; m++) if (sim.turns[m].block === blk && sim.turns[m].start_min === nx.t) { u = sim.turns[m]; break; }
        var early = u ? u.early === 1 : false, cens = u && u.end_min === END && !early;
        var bef = turnOf(blk, x.t - 1);
        cases.push({ _t: x.t, case_id: '', t_detect: isoTs(x.t), entity: 'block', id: blk, state_before: x.from,
          evidence: [{ kind: 'event', ref: ids.join(' '), value: top + ' 가 ' + Math.round(best < 0 ? dur : best) + '분으로 가장 길었음' },
                     { kind: 'resource', ref: 'clean_wait@' + isoTs(rs.t), value: rs.clean_wait }, { kind: 'resource', ref: 'cleaning@' + isoTs(rs.t), value: rs.cleaning }],
          decision: { rule: 'R-JC-BLOCKER', why: '턴이 끝났으나 ' + top + ' 때문에 잡 체인지를 ' + dur + '분 못 함', by: 'agent' },
          action: { transition: { from: 'wait_jc', to: nx.to }, needs_human: false, approved_by: 'rule' }, state_after: nx.to,
          outcome: { t_check: isoTs(u ? u.end_min : END), result: cens ? '미확인' : early ? '조기 잡 체인지' : '정상 주기', value: dur },
          label: cens ? 'censored' : early ? 'early_jc' : 'no_early_jc',
          links: { events: ids.filter(function (v, a, z) { return z.indexOf(v) === a; }), turns: bef ? [{ block: bef.block, set: bef.set, turn: bef.turn }] : [] },
          text_log: isoTs(x.t).slice(5) + ' ' + blk + ' 잡 체인지 ' + dur + '분 지연(' + top + ')' });
      });
    });
    cases.sort(function (a, z) { return a._t - z._t || (a.id < z.id ? -1 : 1); });
    cases.forEach(function (c, k) { c.case_id = 'C' + pad(k + 1, 5); delete c._t; });
    return cases;
  }
  /* 화면·Python 이 함께 쓰는 대표 사건: 시간순으로 처음 나온 Q-MASK 사례 가운데 정지 60분 이상이고 리페어 중 장착 못 해 다시 선 시간이 있는 것 */
  function featuredCase(cases) {
    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      if (c.decision.rule !== 'R-MASK-REPAIR' || c.label === 'censored' || !(c.outcome.absent_min > 0)) continue;
      var m = /(\d+)분/.exec(c.evidence[0].value);
      if (m && +m[1] >= 60) return c;
    }
    return null;
  }
  /* 핵심 지표(시드 분포용): 마스크 한 바퀴 중 짝 대기·세정 대기 비율, 잡 체인지 대기 건수, Q-MASK 사례 재불량 비율 */
  function estcMetrics(sim, cases) {
    cases = cases || caseRecords(sim);
    var byMask = {}, cyc = 0, hd = 0, cw = 0;
    sim.transitions.forEach(function (x) { if (x.entity === 'mask') (byMask[x.id] || (byMask[x.id] = [])).push(x); });
    Object.keys(byMask).forEach(function (id) {
      var rows = byMask[id], start = null, acc = null;
      rows.forEach(function (x, k) {
        if (x.to === 'to_clean' && x.from !== 'init') { start = x.t; acc = { held: 0, wait: 0, bad: false }; }
        else if (acc && x.to === 'repair') acc.bad = true;
        else if (acc && x.to === 'in_use') { if (!acc.bad) { cyc += x.t - start; hd += acc.held; cw += acc.wait; } acc = null; }
        if (acc && rows[k + 1]) { var d = rows[k + 1].t - x.t; if (x.to === 'held') acc.held += d; else if (x.to === 'clean_wait') acc.wait += d; }
      });
    });
    var mq = cases.filter(function (c) { return c.decision.rule === 'R-MASK-REPAIR' && c.label !== 'censored'; }), rec = mq.filter(function (c) { return c.label === 'recurred'; }).length;
    var wj = cases.filter(function (c) { return c.entity === 'block'; });
    return { held_frac: hd / cyc, wait_frac: cw / cyc, wait_jc: wj.length, qmask_cases: mq.length, qmask_recur: mq.length ? rec / mq.length : 0, cycle_min: cyc };
  }

  /* 턴 기록 → 유리 이력(연결 키 포함). 유리 ID 는 블록 안 처리 순번(FIFO 라 블록 간에도 같은 번호가 같은 유리). */
  function glassHistory(sim, o) {
    o = o || {};
    var block = o.block || 'B03', from = o.turnFrom || 0, to = o.turnTo == null ? 6 : o.turnTo;
    var tr = sim.turns.filter(function (x) { return x.block === block; }).slice(from, to), rows = [], i, c, k;
    tr.forEach(function (T) {
      var recs = [];
      for (c = 0; c < 4; c++) {
        var n = T.glass[c], span = T.end_min - T.start_min;
        for (k = 1; k <= n; k++) recs.push({ ts_min: T.start_min + (k - 0.5) * span / n, c: c, k: k });
      }
      recs.sort(function (a, z) { return a.ts_min - z.ts_min || a.c - z.c; });
      recs.forEach(function (r, idx) {
        var ch = 'CH' + (r.c + 1);
        rows.push({ glass_id: 'G' + pad(T.serial0 + idx + 1, 7), ts: isoTs(r.ts_min), ts_min: r.ts_min, block: block, chamber: ch,
                    mask_id: maskId(block, T.set, r.c + 1), mask_set: T.set, turn: T.turn, glass_in_turn: r.k,
                    chamber_temp: +chamberTemp(ch, r.k).toFixed(3) });
      });
    });
    if (o.maxRows && rows.length > o.maxRows) rows = rows.slice(0, o.maxRows);
    return rows;
  }

  /* FDC 특징 표: 유리 이력 + 압력 궤적 특징 + 온도 + 속도 + 라벨 */
  function fdcTable(glasses, sim, o) {
    o = o || {};
    var pmShift = o.pmShift || { CH2: 0.8 }, pmEnd = {}, rows = [], rng2 = rng(hashSeed('fdc', o.seed || 0)), i;
    var block = glasses.length ? glasses[0].block : 'B03';
    sim.events.forEach(function (e) {
      if (e.reason === 'EQ-PM' && e.block === block && (pmEnd[e.chamber] == null || e.end_min < pmEnd[e.chamber])) pmEnd[e.chamber] = e.end_min;
    });
    var seen = {}, since = {};
    glasses.forEach(function (g) {
      var after = pmEnd[g.chamber] != null && g.ts_min >= pmEnd[g.chamber] ? 1 : 0;
      if (after && !seen[g.chamber]) { seen[g.chamber] = 1; since[g.chamber] = 0; }
      var tgt = CFG.P_TARGET * (1 + rng2.normal(0, 0.0087)) + (after ? CFG.P_TARGET * (pmShift[g.chamber] || 0) / 100 : 0);
      var anom = rng2.u() < 0.015, atype = '', so = { target: tgt, wn: 0.9 * (1 + rng2.normal(0, 0.03)), seed: hashSeed(g.glass_id, 'p') };
      if (anom) {
        atype = ['spike', 'slow_valve', 'offset'][rng2.int(3)];
        if (atype === 'spike') so.spike = { t0: 38, len: 3, amp: 12 };
        else if (atype === 'slow_valve') so.wn = 0.35;
        else so.target = tgt * 1.015;
      }
      var tr = stepTrace(so), f = features(tr, { target: CFG.P_TARGET });
      var rateBase = 2.0 * (1 - 0.0004 * (g.glass_in_turn + (since[g.chamber] || 0)));
      if (seen[g.chamber]) since[g.chamber] = (since[g.chamber] || 0) + 0;
      var itrue = anom && rng2.u() < 0.7 ? 1 : 0, ifalse = !itrue && rng2.u() < 0.012 ? 1 : 0;
      rows.push({ glass_id: g.glass_id, ts: g.ts, block: g.block, chamber: g.chamber, mask_id: g.mask_id, mask_set: g.mask_set, turn: g.turn,
                  glass_in_turn: g.glass_in_turn, chamber_temp: g.chamber_temp, p_steady_mean: +f.steady_mean.toFixed(3), p_steady_std: +f.steady_std.toFixed(3),
                  p_max_dev: +f.max_dev.toFixed(3), p_settle_s: f.settle_s, p_overshoot_pct: +f.overshoot_pct.toFixed(3),
                  rate_ang_s: +(rateBase + rng2.normal(0, 0.006)).toFixed(4), pm_flag: after, true_anomaly: anom ? 1 : 0, anomaly_type: atype,
                  interlock: itrue || ifalse, interlock_true: itrue });
    });
    return rows;
  }

  /* ============================================================
   * 6. 시나리오 S1~S7 (숨은 정답 포함)
   * ============================================================ */
  var SEEDS = { S1: 12, S2: 5, S3: 1, S4: 4, S5: 4, S6: 6, S7: 8, S8: 134, S9: 12, S10: 128 };   // 기본 시드(S10=128: 시드 1~200 의 일곱 지표(불량 스틱 마스크 수·지표만 보면 놓친 수·열 단면이 잡은 수·열 단면 헛표시 마스크 수·튀는 점 찾은 수·spec·섞인 문항 수) 백분위에서 Σ|백분위 − 50| 이 가장 작은 시드 · S9=12: 시드 1~200의 일곱 지표(P0·P1·P2 확인 비용, 놓침 기록 없을 때 k 이동, 섞어 나누기·시간순 낙관 편향, 적응형 놓침 변화) 백분위에서 Σ|백분위 − 50| 이 가장 작은 시드 · S7·S8 은 시드 200개 분포의 중앙값 근처인 대표 시드; verify.py 가 분포를 확인). S8=134: 시드 1~200 중 다섯 첫 알람 지연(슈하트·EWMA·CUSUM·잔차 3σ·잔차 CUSUM)이 모두 분포 25~75% 안이고 변화 전 헛알람이 없는 유일한 시드

  function scenario(name, params) {
    params = params || {};
    var key = String(name).toUpperCase().slice(0, String(name).length > 2 && /^S10/i.test(String(name)) ? 3 : 2);
    var fn = { S1: S1, S2: S2, S3: S3, S4: S4, S5: S5, S6: S6, S7: S7, S8: S8, S9: S9, S10: S10 }[key];
    if (!fn) throw new Error('unknown scenario ' + name);
    return fn(params);
  }

  /* S1 pm_shift — B03 CH2, PM 전·후 30장, 정상구간 압력 평균 */
  function S1(p) {
    var seed = p.seed == null ? SEEDS.S1 : p.seed, nb = p.n_before || 30, na = p.n_after || 30;
    var shiftPct = p.shift_pct == null ? 0.8 : p.shift_pct, sigG = p.sigma_glass_pct == null ? 0.87 : p.sigma_glass_pct;
    var r = rng(hashSeed('S1', seed)), rows = [], before = [], after = [];
    function one(phase, i, shift) {
      var tgt = CFG.P_TARGET * (1 + r.normal(0, sigG / 100)) + CFG.P_TARGET * shift / 100;
      var tr = stepTrace({ target: tgt, wn: 0.9 * (1 + r.normal(0, 0.03)), seed: hashSeed('S1t', seed, phase, i) });
      var f = features(tr, { target: CFG.P_TARGET }).steady_mean;
      rows.push({ glass_id: 'S1' + (phase === 'before' ? 'B' : 'A') + pad(i + 1, 3), block: 'B03', chamber: 'CH2', phase: phase, idx: i + 1, steady_pressure_mean: +f.toFixed(4) });
      return f;
    }
    for (var i = 0; i < nb; i++) before.push(one('before', i, 0));
    for (i = 0; i < na; i++) after.push(one('after', i, shiftPct));
    var mb = mean(before), sb = sd(before), w = welch(before, after);
    return { id: 'S1', name: 'pm_shift', block: 'B03', chamber: 'CH2', before: before, after: after, rows: rows, params: { seed: seed, n_before: nb, n_after: na, shift_pct: shiftPct, sigma_glass_pct: sigG },
             truth: { target: CFG.P_TARGET, shift_pct: shiftPct, shift_abs: CFG.P_TARGET * shiftPct / 100, spread_changed: false },
             check: { lo3: mb - 3 * sb, hi3: mb + 3 * sb, all_after_inside_3sigma: after.every(function (v) { return v > mb - 3 * sb && v < mb + 3 * sb; }), welch: w } };
  }

  /* S2 stick_replace — 마스크 B05-B3(CH3), 불량 스틱 교체 전·후 20장, 유리별 dx |평균|+3σ */
  function S2(p) {
    var seed = p.seed == null ? SEEDS.S2 : p.seed, n = p.n || 20, badMult = p.bad_mult == null ? 4 : p.bad_mult;
    var remount = p.remount_dx_um == null ? 1.0 : p.remount_dx_um, jitterK = p.bad_jitter_k == null ? 1.0 : p.bad_jitter_k;
    var id = 'B05-B3', base = makeMask(id, { bad_stick: 3, bad_jitter_k: jitterK, defects: [], Mx0: 0, My0: 0.15, K0: 0.1, Cx0: 0.2, Cy0: 0.2, theta0: 0, Tx0: 0, Ty0: 0 });
    var T60 = chamberTemp('CH3', 60);
    base.Mx0 = -((CFG.ALPHA_M - CFG.ALPHA_G) * (T60 - CFG.T0) * 1e6) + CFG.AGE_PPM_PER_TURN * -9;   // 설계 보상(작동 온도에서 장변 배율≈0)
    var fixed = replaceStick(base, remount), rows = [], before = [], after = [];
    for (var ph = 0; ph < 2; ph++) {
      var m = ph ? fixed : base, turn = ph ? 10 : 9;
      for (var i = 0; i < n; i++) {
        var g = 50 + i, ctx = { glass_id: 'S2' + (ph ? 'A' : 'B') + pad(i + 1, 3), block: 'B05', chamber: 'CH3', turn: turn, glass_in_turn: g, chamber_temp: chamberTemp('CH3', g) };
        var res = ppa(ctx, m, { badMult: badMult, seed: seed }), met = ppaMetric(res.grid);
        (ph ? after : before).push(met.dx_metric);
        rows.push({ glass_id: ctx.glass_id, block: 'B05', chamber: 'CH3', mask_id: id, phase: ph ? 'after' : 'before', turn: turn, glass_in_turn: g,
                    chamber_temp: +ctx.chamber_temp.toFixed(3), dx_mean_um: +met.dx_mean.toFixed(4), dx_sd_um: +met.dx_sd.toFixed(4), dx_metric_um: +met.dx_metric.toFixed(4), dy_metric_um: +met.dy_metric.toFixed(4) });
      }
    }
    return { id: 'S2', name: 'stick_replace', mask_id: id, before: before, after: after, rows: rows, params: { seed: seed, n: n, bad_mult: badMult, remount_dx_um: remount, bad_jitter_k: jitterK },
             truth: { bad_stick_index: 3, bad_mult: badMult, replaced: true, mean_change_expected: 'small', spread_change_expected: 'smaller after' },
             check: { welch: welch(before, after), levene_median: levene(before, after, 'median') } };
  }

  /* S3 repair_pair — 마스크 B03-A2 리페어 전·후 같은 77점 |오차|, 그리고 세정 전·후 쌍 */
  function S3(p) {
    var seed = p.seed == null ? SEEDS.S3 : p.seed, id = 'B03-A2';
    var m0 = makeMask(id, { Mx0: p.Mx0 == null ? 1.4 : p.Mx0, My0: 0.9, K0: 1.0, Cx0: 0.8, Cy0: 1.0, theta0: 0.6, Tx0: 0.8, Ty0: -0.6, stick_zo: null, bad_stick: -1,
                            defects: [{ px: 2, py: 1, dx: 1.5, dy: -1.2 }, { px: 8, py: 5, dx: -1.8, dy: 1.4 }] });
    var r0 = rng(hashSeed('S3m', p.mask_seed == null ? 4 : p.mask_seed)); m0.stick_zo = []; m0.stick_zp = [];
    for (var j = 0; j < CFG.NX; j++) { m0.stick_zo.push(r0.normal()); m0.stick_zp.push(r0.normal()); }
    var amp = p.amp == null ? 3 : p.amp;
    ['Mx0', 'My0', 'K0', 'Cx0', 'Cy0', 'theta0', 'Tx0', 'Ty0'].forEach(function (k) { m0[k] *= amp; });
    m0.stick_zo = m0.stick_zo.map(function (z) { return z * amp; }); m0.stick_zp = m0.stick_zp.map(function (z) { return z * amp; });
    var keep = p.repair_keep == null ? 0.9 : p.repair_keep, turn = 12;
    var m1 = repairMask(m0, turn + 1, keep), g = 60, T = chamberTemp('CH2', g);
    function glass(tag, turnNo, m, extra) { var ex = extra || { seed: seed }; ex.alignId = 'S3align'; return ppa({ glass_id: 'S3' + tag, block: 'B03', chamber: 'CH2', turn: turnNo, glass_in_turn: g, chamber_temp: T }, m, ex); }
    function err(res) { return res.grid.map(function (q) { return Math.sqrt(q.dx_um * q.dx_um + q.dy_um * q.dy_um); }); }
    function clean(res, pm) { return res.truth; }
    var pb = glass('R0', turn, m0), pa = glass('R1', turn + 1, m1);
    var eb = err(pb), ea = err(pa), pts = pb.grid.map(function (q) { return { px: q.px, py: q.py, x_mm: q.x_mm, y_mm: q.y_mm, defect_before: q.defect }; });
    // 세정 전·후: 참 변화가 아주 작은 쌍(장변 배율 +0.02 ppm 이완). 같은 마스크(리페어 후 상태) 위에서 비교.
    var m2 = JSON.parse(JSON.stringify(m1)); m2.Mx0 = m1.Mx0 + (p.clean_dMx == null ? 0.02 : p.clean_dMx);
    var cb = glass('C0', turn + 1, m1, { seed: seed }), ca = glass('C1', turn + 1, m2, { seed: seed });
    var ecb = err(cb), eca = err(ca);
    var rows = pts.map(function (q, i) { return { px: q.px, py: q.py, x_mm: q.x_mm, y_mm: q.y_mm, repair_err_before: +eb[i].toFixed(4), repair_err_after: +ea[i].toFixed(4), defect_before: q.defect_before, clean_err_before: +ecb[i].toFixed(4), clean_err_after: +eca[i].toFixed(4) }; });
    return { id: 'S3', name: 'repair_pair', mask_id: id, points: pts, repair: { before: eb, after: ea }, clean: { before: ecb, after: eca }, rows: rows, params: { seed: seed, repair_keep: keep },
             truth: { repair_keep: keep, defects_removed: 2, clean_true_dMx_ppm: m2.Mx0 - m1.Mx0, tost_delta_um: 0.3 },
             check: { welch_repair: welch(eb, ea), paired_repair: pairedT(eb, ea), paired_clean: pairedT(ecb, eca) } };
  }

  /* S4 thermal_confound — B07 CH1(세정 방법 변경, 처리) vs CH2(대조). 같은 시기 온도 상승(계절)으로 둘 다 Mx 이동 */
  function S4(p) {
    var seed = p.seed == null ? SEEDS.S4 : p.seed, n = p.n || 40, season = p.season_dT == null ? 0.5 : p.season_dT, eff = p.true_effect_ppm || 0;
    var groups = [{ g: 'treated', ch: 'CH1', mask: 'B07-A1' }, { g: 'control', ch: 'CH2', mask: 'B07-A2' }], rows = [], out = {};
    var rn = rng(hashSeed('S4', seed));
    groups.forEach(function (G) {
      var m = makeMask(G.mask, { bad_stick: -1, defects: [] });
      out[G.g] = { before: [], after: [] };
      for (var ph = 0; ph < 2; ph++) for (var i = 0; i < n; i++) {
        var gg = 20 + ((i * 7) % 80), ctx = { glass_id: 'S4' + G.g[0].toUpperCase() + (ph ? 'A' : 'B') + pad(i + 1, 3), block: 'B07', chamber: G.ch, turn: 8, glass_in_turn: gg };
        ctx.chamber_temp = chamberTemp(G.ch, gg, { season: ph ? season : 0, rng: rn, noise: 0.05 });
        var res = ppa(ctx, m, { seed: seed, mxJitter: 0.3 });
        var mx = ppaFit(res.grid).Mx + (G.g === 'treated' && ph ? eff : 0);
        out[G.g][ph ? 'after' : 'before'].push(mx);
        rows.push({ glass_id: ctx.glass_id, block: 'B07', group: G.g, chamber: G.ch, mask_id: G.mask, phase: ph ? 'after' : 'before', glass_in_turn: gg, chamber_temp: +ctx.chamber_temp.toFixed(3), mx_ppm: +mx.toFixed(4) });
      }
    });
    var dT = mean(out.treated.after) - mean(out.treated.before), dC = mean(out.control.after) - mean(out.control.before);
    return { id: 'S4', name: 'thermal_confound', treated: out.treated, control: out.control, rows: rows, params: { seed: seed, n: n, season_dT: season },
             truth: { true_effect_ppm: eff, thermal_mx_shift_ppm: (CFG.ALPHA_M - CFG.ALPHA_G) * season * 1e6, season_dT_K: season },
             check: { welch_treated: welch(out.treated.before, out.treated.after), did: dT - dC, treated_diff: dT, control_diff: dC } };
  }

  /* S5 autocorr — AR(1) φ=0.7, 전·후 각 50, 작은 참 이동 */
  function S5(p) {
    var seed = p.seed == null ? SEEDS.S5 : p.seed, n = p.n || 50, phi = p.phi == null ? 0.7 : p.phi, shift = p.shift == null ? 0.13 : p.shift;
    var s = ar1Series(2 * n, { phi: phi, sd: 0.3, mean: 5.0, seed: hashSeed('S5', seed), shift_at: n, shift: shift });
    var before = s.slice(0, n), after = s.slice(n), rows = s.map(function (v, i) { return { idx: i + 1, phase: i < n ? 'before' : 'after', vac_level: +v.toFixed(5) }; });
    var w = welch(before, after), phiHat = (lag1(before) + lag1(after)) / 2;
    var neff = n * (1 - phiHat) / (1 + phiHat), sp = Math.sqrt((sd(before) * sd(before) + sd(after) * sd(after)) / 2);
    var tc = (mean(after) - mean(before)) / (sp * Math.sqrt(2 / neff)), pc = tp2(tc, 2 * neff - 2);
    return { id: 'S5', name: 'autocorr', before: before, after: after, rows: rows, params: { seed: seed, n: n, phi: phi, shift: shift },
             truth: { phi: phi, shift: shift, sd_marginal: 0.3, n_eff_true: n * (1 - phi) / (1 + phi) },
             check: { welch_naive: w, phi_hat: phiHat, n_eff_hat: neff, t_corrected: tc, p_corrected: pc } };
  }

  /* S6 false_alarm — 정상 유리 500장 × 특징 590개(센서 118 × 5), 같은 센서의 다섯 특징은 상관 ρ=0.6.
   * 기준 300장으로 특징별 평균·표준편차를 추정해 한계를 긋는다. 진짜 이상 10장은 특징 하나가 δσ 이동. */
  function qnorm(z) {                          // 표준정규 상측 확률 Q(z) = 1 − Φ(z)
    var x = Math.abs(z) / Math.SQRT2, e;
    if (x < 2) {                               // erf 급수
      var sum = x, term = x, n = 0;
      while (Math.abs(term) > 1e-17 && n < 200) { n++; term = -term * x * x / n; sum += term / (2 * n + 1); }
      e = 1 - 2 / Math.sqrt(Math.PI) * sum;
    } else {                                   // erfc 연분수
      var f = x; for (var i = 80; i >= 1; i--) f = x + (i / 2) / f;
      e = Math.exp(-x * x) / Math.sqrt(Math.PI) / f;
    }
    return z >= 0 ? e / 2 : 1 - e / 2;
  }
  function qinv(q) {                           // Q(k) = q 인 k (이분법)
    var lo = 0, hi = 12, mid, i;
    for (i = 0; i < 200; i++) { mid = (lo + hi) / 2; if (qnorm(mid) > q) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function S6(p) {
    var seed = p.seed == null ? SEEDS.S6 : p.seed, N = p.n || 500, N0 = p.n0 || 300, nS = p.sensors || 118, per = 5, m = nS * per;
    var rho = p.rho == null ? 0.6 : p.rho, nA = p.n_anom || 10, delta = p.delta == null ? 5 : p.delta, famA = 0.0027;
    var r = rng(hashSeed('S6', seed)), a = Math.sqrt(rho), b = Math.sqrt(1 - rho), j, i, s, k;
    var mu = new Float64Array(m), sig = new Float64Array(m);
    for (j = 0; j < m; j++) { mu[j] = 20 + 180 * r.u(); sig[j] = mu[j] * (0.02 + 0.06 * r.u()); }
    function zrow() {                          // 표준 척도 한 줄: 센서마다 공통 성분 + 특징 고유 성분
      var z = new Float64Array(m), c;
      for (s = 0; s < nS; s++) { c = r.normal(); for (k = 0; k < per; k++) z[s * per + k] = a * c + b * r.normal(); }
      return z;
    }
    function toX(z) { var x = new Float64Array(m); for (var q = 0; q < m; q++) x[q] = Math.round((mu[q] + sig[q] * z[q]) * 1000) / 1000; return x; }
    var ref = [], nor = [], anom = [];
    for (i = 0; i < N0; i++) ref.push(toX(zrow()));
    for (i = 0; i < N; i++) nor.push(toX(zrow()));
    for (i = 0; i < nA; i++) {
      var z = zrow(), col = r.int(m);          // 이상: 무작위 센서의 무작위 특징 하나
      z[col] += delta;                         // 표준 척도에서 +δ
      anom.push({ x: toX(z), col: col, sensor: Math.floor(col / per), k: col % per });
    }
    var rm = new Float64Array(m), rs = new Float64Array(m);
    for (j = 0; j < m; j++) {
      var col0 = ref.map(function (x) { return x[j]; }); rm[j] = mean(col0); rs[j] = sd(col0);
    }
    function zscore(x, q) { return (x[q] - rm[q]) / rs[q]; }
    function glassAlarm(x, kk) { for (var q = 0; q < m; q++) if (Math.abs(zscore(x, q)) > kk) return true; return false; }
    var alpha = 2 * qnorm(3), bonfK = qinv(famA / m / 2), sidakK = qinv((1 - Math.pow(1 - famA, 1 / m)) / 2);
    var cells3 = 0, gl3 = 0, glB = 0;
    nor.forEach(function (x) { var any3 = false, anyB = false; for (var q = 0; q < m; q++) { var az = Math.abs(zscore(x, q)); if (az > 3) { cells3++; any3 = true; } if (az > bonfK) anyB = true; } if (any3) gl3++; if (anyB) glB++; });
    var c3 = 0, cB = 0;
    anom.forEach(function (o) { var az = Math.abs(zscore(o.x, o.col)); if (az > 3) c3++; if (az > bonfK) cB++; });
    function csvRows() {
      var names = [], q, rows = [];
      var FN = ['steady_mean', 'steady_std', 'max_dev', 'settle_s', 'overshoot_pct'];
      for (q = 0; q < m; q++) names.push('s' + pad(Math.floor(q / per) + 1, 3) + '_' + FN[q % per]);
      function add(group, tag, x, n) { var o = { glass_id: tag + pad(n + 1, 4), group: group }; for (var u = 0; u < m; u++) o[names[u]] = x[u]; rows.push(o); }
      ref.forEach(function (x, n) { add('ref', 'R', x, n); });
      nor.forEach(function (x, n) { add('normal', 'N', x, n); });
      anom.forEach(function (o, n) { add('anomaly', 'A', o.x, n); });
      return rows;
    }
    return { id: 'S6', name: 'false_alarm', ref: ref, normal: nor, anom: anom, mu: mu, sig: sig, ref_mean: rm, ref_sd: rs, csvRows: csvRows,
             params: { seed: seed, n: N, n0: N0, sensors: nS, per_sensor: per, m: m, rho: rho, n_anom: nA, delta: delta, family_alpha: famA },
             truth: { alpha_single: alpha, fwer_indep: 1 - Math.pow(1 - alpha, m), bonf_k: bonfK, sidak_k: sidakK, anomalies: anom.map(function (o) { return { sensor: o.sensor, feature: o.k, col: o.col }; }) },
             check: { single_rate_3sigma: cells3 / (N * m), fwer_3sigma: gl3 / N, glasses_alarmed_3sigma: gl3, glasses_alarmed_bonf: glB, fwer_bonf: glB / N,
                      caught_3sigma: c3, caught_bonf: cB } };
  }

  /* S7 hidden_assumptions — 3σ 한계의 숨은 가정 셋(정규성·독립성·깨끗한 기준 데이터).
   * 세 갈래 모두 "위쪽 한계 하나"(명목 헛알람률 Q(3)=0.00135)로 통일한다.
   *  A 치우침: 로그정규 ln x ~ N(0,s) · B 자기상관: AR(1) φ, 기준 = PM 직후 연속 L장 · C 오염된 기준: 5%가 +6σ 근처.
   * 난수 줄기를 갈래·역할별로 따로 두어, 슬라이더 값만 바꿔 다시 만들어도 나머지 값은 그대로 유지된다. */
  var K3 = 3, P3 = 0.99865, MADK = 1.4826;
  function skewOf(x) {                         // 왜도(표본, scipy.stats.skew 기본값과 같은 편향 있는 형태)
    var n = x.length, m = mean(x), m2 = 0, m3 = 0, i, d;
    for (i = 0; i < n; i++) { d = x[i] - m; m2 += d * d; m3 += d * d * d; }
    m2 /= n; m3 /= n;
    return m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
  }
  function quantileOf(x, p) {                  // numpy.quantile 기본(선형 보간)
    var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo;
    return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo];
  }
  function madOf(x) { var md = median(x); return median(x.map(function (v) { return Math.abs(v - md); })); }
  function bcT(x, lam) { return x.map(function (v) { return Math.abs(lam) < 1e-9 ? Math.log(v) : (Math.pow(v, lam) - 1) / lam; }); }
  function bcLlf(x, lam, slog) {
    var y = bcT(x, lam), n = y.length, m = mean(y), v = 0, i;
    for (i = 0; i < n; i++) v += (y[i] - m) * (y[i] - m);
    return (lam - 1) * slog - n / 2 * Math.log(v / n);
  }
  function boxcoxLam(x) {                      // 최대우도 λ (거친 격자 → 황금분할)
    var slog = 0, i, best = -3, bv = -Infinity, v;
    for (i = 0; i < x.length; i++) slog += Math.log(x[i]);
    for (var l = -3; l <= 3.0001; l += 0.1) { v = bcLlf(x, l, slog); if (v > bv) { bv = v; best = l; } }
    var a = best - 0.1, b = best + 0.1, g = (Math.sqrt(5) - 1) / 2, c = b - g * (b - a), d = a + g * (b - a);
    for (i = 0; i < 60; i++) { if (bcLlf(x, c, slog) > bcLlf(x, d, slog)) b = d; else a = c; c = b - g * (b - a); d = a + g * (b - a); }
    return (a + b) / 2;
  }
  function boxcoxLimit(x, k) {                 // 변환 공간 평균+kσ → 역변환. 반환 {lam, limit}
    var lam = boxcoxLam(x), y = bcT(x, lam), yl = mean(y) + k * sd(y), lim;
    if (Math.abs(lam) < 1e-9) lim = Math.exp(yl);
    else { var t = lam * yl + 1; lim = t > 0 ? Math.pow(t, 1 / lam) : (lam < 0 ? Infinity : 0); }
    return { lam: lam, limit: lim };
  }
  function arFit(x) {                          // 중심화 후 최소제곱 φ̂, 잔차 sd. 반환 {m, phi, sdr}
    var m = mean(x), num = 0, den = 0, i;
    for (i = 1; i < x.length; i++) { num += (x[i] - m) * (x[i - 1] - m); den += (x[i - 1] - m) * (x[i - 1] - m); }
    var phi = den > 0 ? num / den : 0, r = [];
    for (i = 1; i < x.length; i++) r.push((x[i] - m) - phi * (x[i - 1] - m));
    return { m: m, phi: phi, sdr: sd(r) };
  }
  function resid(x, f) { var r = []; for (var i = 1; i < x.length; i++) r.push((x[i] - f.m) - f.phi * (x[i - 1] - f.m)); return r; }
  function rateAbove(x, lim) { var n = 0; for (var i = 0; i < x.length; i++) if (x[i] > lim) n++; return n / x.length; }
  function countAbove(x, lim) { var n = 0; for (var i = 0; i < x.length; i++) if (x[i] > lim) n++; return n; }
  function firstAbove(x, lim, from) { for (var i = from; i < x.length; i++) if (x[i] > lim) return i; return -1; }
  function pctile(sorted, q) { var pos = (sorted.length - 1) * q, lo = Math.floor(pos), f = pos - lo; return lo + 1 < sorted.length ? sorted[lo] + (sorted[lo + 1] - sorted[lo]) * f : sorted[lo]; }
  function summ(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return { min: b[0], p10: pctile(b, 0.1), med: pctile(b, 0.5), mean: mean(b), p90: pctile(b, 0.9), max: b[b.length - 1] }; }
  function lnTheoryA(s) {                      // 로그정규 평균+3σ 한계의 이론 헛알람률
    if (s < 1e-9) return 0;
    var e = Math.exp(s * s), L = Math.sqrt(e) + K3 * Math.sqrt((e - 1) * e);
    return qnorm(Math.log(L) / s);
  }

  function S7(p) {
    var seed = p.seed == null ? SEEDS.S7 : p.seed, only = p.only || '';
    var s = p.s == null ? 0.5 : p.s, n0 = p.n0 || 300, phi = p.phi == null ? 0.9 : p.phi, L = p.ref_len || 50;
    var cp = p.contam_p == null ? 0.05 : p.contam_p, csz = p.contam_size == null ? 6 : p.contam_size;
    var NP = p.n || 5000, NREP = 30, BREP = 40, GAP = 300, STEPLEN = 150, STEPAT = 75, STEPSZ = 2, NAN = 20, SHIFTC = 4, N0C = 300;
    var out = { id: 'S7', name: 'hidden_assumptions', params: { seed: seed, s: s, n0: n0, phi: phi, ref_len: L, contam_p: cp, contam_size: csz, n: NP,
                 nominal: qnorm(K3), p_quant: P3, k: K3, n_anom_c: NAN, shift_c: SHIFTC, step_at: STEPAT, step_size: STEPSZ, step_len: STEPLEN, n0_c: N0C } };
    var i, j, r;

    /* ---- A 치우침(정규성) ---- */
    if (!only || only === 'A') {
      r = rng(hashSeed('S7', seed, 'Aref'));  var zr = []; for (i = 0; i < n0; i++) zr.push(r.normal());
      r = rng(hashSeed('S7', seed, 'Apost')); var zp = []; for (i = 0; i < NP; i++) zp.push(r.normal());
      var refA = zr.map(function (z) { return Math.exp(s * z); }), postA = zp.map(function (z) { return Math.exp(s * z); });
      var mA = mean(refA), sA = sd(refA), limN = mA + K3 * sA, limQ = quantileOf(refA, P3), bc = boxcoxLimit(refA, K3);
      var postSorted = postA.slice().sort(function (a, b) { return a - b; });
      function rateS(lim) { var lo = 0, hi = postSorted.length; while (lo < hi) { var mid = (lo + hi) >> 1; if (postSorted[mid] > lim) hi = mid; else lo = mid + 1; } return (postSorted.length - lo) / postSorted.length; }
      var repQ = [], repR = [], repN = [];
      for (j = 0; j < NREP; j++) {
        var rr = rng(hashSeed('S7', seed, 'Arep', j)), xs = []; for (i = 0; i < n0; i++) xs.push(Math.exp(s * rr.normal()));
        var q = quantileOf(xs, P3); repQ.push(q); repR.push(rateS(q)); repN.push(rateS(mean(xs) + K3 * sd(xs)));
      }
      out.A = { ref: refA, post: postA, mean: mA, sd: sA, skew: skewOf(refA), lam: bc.lam, mad_ratio: sA / (MADK * madOf(refA)), lag1: lag1(refA),
                limits: { naive: limN, quantile: limQ, boxcox: bc.limit },
                rates: { naive: rateS(limN), quantile: rateS(limQ), boxcox: rateS(bc.limit) },
                theory: { naive_rate: lnTheoryA(s), skew: (Math.exp(s * s) + 2) * Math.sqrt(Math.exp(s * s) - 1), lam: 0 },
                rep: { n: NREP, q_limit: summ(repQ), q_rate: summ(repR), naive_rate: summ(repN) } };
    }

    /* ---- B 자기상관(독립성) ---- */
    if (!only || only === 'B') {
      r = rng(hashSeed('S7', seed, 'B'));
      var T = GAP + NP + STEPLEN, inn = Math.sqrt(1 - phi * phi), xb = [], e0 = r.normal();
      xb.push(e0); for (i = 1; i < T; i++) xb.push(phi * xb[i - 1] + inn * r.normal());
      var refB = xb.slice(0, L), postB = xb.slice(GAP, GAP + NP), stepB = xb.slice(GAP + NP).map(function (v, k) { return k >= STEPAT ? v + STEPSZ : v; });
      var mB = mean(refB), sB = sd(refB), limNB = mB + K3 * sB, fit = arFit(refB), limR = K3 * fit.sdr;
      var rPost = resid(postB, fit), rStep = resid(stepB, fit);
      var fN = firstAbove(stepB, limNB, STEPAT), fR = firstAbove(rStep, limR, STEPAT - 1);   // rStep[k-1] ↔ stepB[k]
      var repN2 = [], repR2 = [];
      for (j = 0; j < BREP; j++) {
        var rb = rng(hashSeed('S7', seed, 'Brep', j)), xs2 = [rb.normal()]; for (i = 1; i < L; i++) xs2.push(phi * xs2[i - 1] + inn * rb.normal());
        var ft = arFit(xs2); repN2.push(rateAbove(postB, mean(xs2) + K3 * sd(xs2))); repR2.push(rateAbove(resid(postB, ft), K3 * ft.sdr));
      }
      var ac = lag1(refB);
      out.B = { ref: refB, post: postB, step: stepB, mean: mB, sd: sB, lag1: ac, skew: skewOf(refB), mad_ratio: sB / (MADK * madOf(refB)),
                fit: fit, limits: { naive: limNB, resid: limR },
                rates: { naive: rateAbove(postB, limNB), resid: rateAbove(rPost, limR) },
                first_alarm: { naive: fN < 0 ? null : fN - STEPAT + 1, resid: fR < 0 ? null : fR + 1 - STEPAT + 1 },
                false_before: { naive: countAbove(stepB.slice(0, STEPAT), limNB), resid: countAbove(rStep.slice(0, STEPAT - 1), limR) },
                n_eff: { true_phi: L * (1 - phi) / (1 + phi), lag1: L * (1 - ac) / (1 + ac), phi_hat: L * (1 - fit.phi) / (1 + fit.phi) },
                rep: { n: BREP, naive_rate: summ(repN2), resid_rate: summ(repR2) } };
    }

    /* ---- C 오염된 기준 ---- */
    if (!only || only === 'C') {
      r = rng(hashSeed('S7', seed, 'Cref'));
      var zc = [], wc = [], ord = [];
      for (i = 0; i < N0C; i++) { zc.push(r.normal()); wc.push(r.normal()); ord.push(i); }
      for (i = N0C - 1; i > 0; i--) { j = r.int(i + 1); var t = ord[i]; ord[i] = ord[j]; ord[j] = t; }   // ord[k] = 순위 k 가 되는 위치
      var nBad = Math.round(cp * N0C), bad = []; for (i = 0; i < N0C; i++) bad.push(false);
      for (i = 0; i < nBad; i++) bad[ord[i]] = true;
      var refC = [], clean = [];
      for (i = 0; i < N0C; i++) { refC.push(bad[i] ? csz + wc[i] : zc[i]); if (!bad[i]) clean.push(zc[i]); }
      r = rng(hashSeed('S7', seed, 'Cpost')); var postC = []; for (i = 0; i < NP; i++) postC.push(r.normal());
      r = rng(hashSeed('S7', seed, 'Canom')); var anomC = []; for (i = 0; i < NAN; i++) anomC.push(SHIFTC + r.normal());
      var mC = mean(refC), sC = sd(refC), md = median(refC), mad = madOf(refC);
      var limNC = mC + K3 * sC, limRC = md + K3 * MADK * mad, limCl = mean(clean) + K3 * sd(clean);
      function missed(lim) { return NAN - countAbove(anomC, lim); }
      out.C = { ref: refC, bad: bad, n_bad: nBad, post: postC, anom: anomC, mean: mC, sd: sC, median: md, mad: mad, skew: skewOf(refC), lag1: lag1(refC),
                mad_ratio: sC / (MADK * mad),
                limits: { naive: limNC, robust: limRC, clean: limCl },
                rates: { naive: rateAbove(postC, limNC), robust: rateAbove(postC, limRC), clean: rateAbove(postC, limCl) },
                false_alarms: { naive: countAbove(postC, limNC), robust: countAbove(postC, limRC), clean: countAbove(postC, limCl) },
                missed: { naive: missed(limNC), robust: missed(limRC), clean: missed(limCl) } };
    }
    out.csvRows = function () {                // 긴 형식: branch(A/B/C), role(ref/post/step/anom), idx, value, truth_flag
      var rows = [];
      function add(br, role, arr, flags) { for (var q = 0; q < arr.length; q++) rows.push({ branch: br, role: role, idx: q, value: arr[q], truth_flag: flags ? (flags[q] ? 1 : 0) : 0 }); }
      if (out.A) { add('A', 'ref', out.A.ref); add('A', 'post', out.A.post); }
      if (out.B) { add('B', 'ref', out.B.ref); add('B', 'post', out.B.post); add('B', 'step', out.B.step, out.B.step.map(function (_, k) { return k >= STEPAT; })); }
      if (out.C) { add('C', 'ref', out.C.ref, out.C.bad); add('C', 'post', out.C.post); add('C', 'anom', out.C.anom, out.C.anom.map(function () { return true; })); }
      return rows;
    };
    return out;
  }
  S7.tools = { skewOf: skewOf, quantileOf: quantileOf, madOf: madOf, boxcoxLam: boxcoxLam, boxcoxLimit: boxcoxLimit, arFit: arFit, resid: resid, rateAbove: rateAbove, lnTheoryA: lnTheoryA, summ: summ, MADK: MADK, P3: P3 };

  /* S8 small_shift — 작은 지속 변화 감지: 슈하트 3σ 선 · EWMA · CUSUM 과 평균 런 길이(ARL).
   * 특징은 증착 속도(안정 구간 평균, Å/s). 정상 μ0=1.000, σ=0.010, 변화는 아래쪽 계단(−δσ). 세 방식 모두 위·아래 양쪽을 감시한다.
   * 공정한 비교: 세 방식 모두 정상 때 ARL0 = 1/(2Q(3)) = 370.4 로 맞춘다(EWMA 의 L, CUSUM 의 h 는 ARL 계산식을 이분법으로 풀어 구함).
   * ARL: 슈하트 = 닫힌 식, EWMA = 마르코프 사슬(Lucas–Saccucci, m=101), CUSUM = 마르코프 사슬(Brook–Evans, m=100) + 양쪽 합성(Lucas–Crosier).
   * 난수 줄기: trace(기준·감시 궤적) · mc(런 길이 몬테카를로) · R(자기상관 갈래) 를 따로 두어, 슬라이더로 λ·k·δ 를 바꿔도 같은 잡음이 유지된다. */
  var MU0 = 1.0, SIG0 = 0.01;
  var ARL0_T = 1 / (2 * qnorm(3));
  function phiFast(x) {                        // 표준정규 누적분포 Φ(x) (Hart/West 유리식 근사, 상대오차 ~1e-15)
    var xa = Math.abs(x), c;
    if (xa > 37) c = 0;
    else {
      var e = Math.exp(-xa * xa / 2);
      if (xa < 7.07106781186547) {
        var b = 0.0352624965998911 * xa + 0.700383064443688;
        b = b * xa + 6.37396220353165; b = b * xa + 33.912866078383; b = b * xa + 112.079291497871; b = b * xa + 221.213596169931; b = b * xa + 220.206867912376;
        c = e * b;
        var d = 0.0883883476483184 * xa + 1.75566716318264;
        d = d * xa + 16.064177579207; d = d * xa + 86.7807322029461; d = d * xa + 296.564248779674; d = d * xa + 637.333633378831; d = d * xa + 793.826512519948; d = d * xa + 440.413735824752;
        c = c / d;
      } else {
        var f = xa + 0.65; f = xa + 4 / f; f = xa + 3 / f; f = xa + 2 / f; f = xa + 1 / f;
        c = e / f / 2.506628274631;
      }
    }
    return x > 0 ? 1 - c : c;
  }
  function solveLin(A, b, n) {                 // 가우스 소거(I−R 은 대각 우세 M-행렬이라 피벗 불필요). A·b 를 제자리에서 바꾼다
    var c, r, q, f, s;
    for (c = 0; c < n; c++) {
      var piv = A[c * n + c];
      for (r = c + 1; r < n; r++) {
        f = A[r * n + c] / piv; if (f === 0) continue;
        for (q = c; q < n; q++) A[r * n + q] -= f * A[c * n + q];
        b[r] -= f * b[c];
      }
    }
    for (c = n - 1; c >= 0; c--) { s = b[c]; for (q = c + 1; q < n; q++) s -= A[c * n + q] * b[q]; b[c] = s / A[c * n + c]; }
    return b;
  }
  function arlShewhart(delta, L) { return 1 / (qnorm(L - delta) + qnorm(L + delta)); }
  function arlEwma(lam, L, delta, m) {         // 표준화 공간 (−UCL, UCL) 을 m 칸으로 나눈 마르코프 사슬, 시작은 가운데 칸
    m = m || 101;
    var U = L * Math.sqrt(lam / (2 - lam)), w = 2 * U / m, A = new Float64Array(m * m), b = new Float64Array(m), i, j, base, prev, cur;
    for (i = 0; i < m; i++) {
      base = (1 - lam) * (-U + (i + 0.5) * w);
      prev = phiFast((-U - base) / lam - delta);
      for (j = 0; j < m; j++) { cur = phiFast((-U + (j + 1) * w - base) / lam - delta); A[i * m + j] = (i === j ? 1 : 0) - (cur - prev); prev = cur; }
      b[i] = 1;
    }
    solveLin(A, b, m);
    return b[(m - 1) >> 1];
  }
  function arlCusum1(k, h, delta, m) {         // 한쪽 CUSUM(위로 감지, z~N(δ,1)). 칸 0 = [0, w/2], 칸 j = (jw−w/2, jw+w/2], w = 2h/(2m−1)
    m = m || 100;
    var w = 2 * h / (2 * m - 1), G = new Float64Array(2 * m), A = new Float64Array(m * m), b = new Float64Array(m), i, j, d;
    for (d = -m; d < m; d++) G[d + m] = phiFast((d + 0.5) * w + k - delta);
    for (i = 0; i < m; i++) {
      A[i * m] = (i === 0 ? 1 : 0) - G[-i + m];
      for (j = 1; j < m; j++) A[i * m + j] = (i === j ? 1 : 0) - (G[j - i + m] - G[j - i - 1 + m]);
      b[i] = 1;
    }
    solveLin(A, b, m);
    return b[0];
  }
  function arlCusum(k, h, delta, m) {          // 양쪽: 1/ARL = 1/ARL⁺ + 1/ARL⁻ (Lucas–Crosier)
    var a = arlCusum1(k, h, delta, m);
    if (Math.abs(delta) < 1e-12) return a / 2;
    return 1 / (1 / a + 1 / arlCusum1(k, h, -delta, m));
  }
  function bisect(fn, target, lo, hi, it) {    // fn 은 매개변수에 대해 증가. fn(x)=target 인 x
    var mid, i;
    for (i = 0; i < (it || 40); i++) { mid = (lo + hi) / 2; if (fn(mid) < target) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  var CAL = {};
  function calibEwmaL(lam, target) {
    var key = 'e' + lam + '|' + (target || ''); if (CAL[key] != null) return CAL[key];
    return (CAL[key] = bisect(function (L) { return arlEwma(lam, L, 0); }, target || ARL0_T, 1.0, 5.0, 30));
  }
  function calibCusumH(k, target) {
    var key = 'c' + k + '|' + (target || ''); if (CAL[key] != null) return CAL[key];
    return (CAL[key] = bisect(function (h) { return arlCusum(k, h, 0); }, target || ARL0_T, 0.05, 60, 36));
  }
  /* ---- 감시 함수: z(표준화 값 배열) → 알람. 변화 전(resetBefore 번째 유리 이전)에 난 알람은 헛알람으로 세고 통계량을 처음 상태로 되돌린다 ---- */
  function shewhartMonitor(z, L, resetBefore) {
    var pre = [], first = null, i;
    for (i = 0; i < z.length; i++) if (Math.abs(z[i]) > L) { if (i + 1 < (resetBefore || 0)) pre.push(i + 1); else if (first === null) first = i + 1; }
    return { first: first, pre: pre };
  }
  function ewmaMonitor(z, lam, L, resetBefore) {
    var U = L * Math.sqrt(lam / (2 - lam)), w = 0, ws = [], pre = [], first = null, i;
    for (i = 0; i < z.length; i++) {
      w = lam * z[i] + (1 - lam) * w; ws.push(w);
      if (Math.abs(w) > U) { if (i + 1 < (resetBefore || 0)) { pre.push(i + 1); w = 0; } else if (first === null) first = i + 1; }
    }
    return { w: ws, ucl: U, first: first, pre: pre };
  }
  function cusumMonitor(z, k, h, resetBefore) {   // start = 알람 직전 합이 마지막으로 0이었던 다음 유리(1부터 센 번호)
    var sp = 0, sm = 0, zp = -1, zm = -1, SP = [], SM = [], pre = [], first = null, start = null, side = null, i;
    for (i = 0; i < z.length; i++) {
      sp = Math.max(0, sp + z[i] - k); sm = Math.max(0, sm - z[i] - k);
      if (sp === 0) zp = i; if (sm === 0) zm = i;
      SP.push(sp); SM.push(sm);
      if (sp > h || sm > h) {
        if (i + 1 < (resetBefore || 0)) { pre.push(i + 1); sp = 0; sm = 0; zp = i; zm = i; }
        else if (first === null) { first = i + 1; side = (sm > h && sm >= sp) ? 'down' : 'up'; start = (side === 'down' ? zm : zp) + 2; }
      }
    }
    return { Sp: SP, Sm: SM, h: h, first: first, pre: pre, start: start, side: side };
  }
  function delayOf(first, shiftAt) { return first == null ? null : first - shiftAt + 1; }

  function runSummary(runs, cap) {
    var n = runs.length, m = mean(runs), s = sd(runs), b = runs.slice().sort(function (a, c) { return a - c; }), capN = 0, i;
    for (i = 0; i < n; i++) if (runs[i] >= cap) capN++;
    return { n: n, mean: m, se: s / Math.sqrt(n), sd: s, med: pctile(b, 0.5), p10: pctile(b, 0.1), p90: pctile(b, 0.9), capped: capN };
  }
  function oneRun(method, rr, delta, P) {      // 변화 −δσ 가 첫 유리부터 시작한다고 보고 첫 알람까지의 유리 수
    var t = 0, w = 0, sp = 0, sm = 0, z;
    while (t < P.cap) {
      t++; z = rr.normal() - delta;
      if (method === 'shew') { if (Math.abs(z) > P.L) return t; }
      else if (method === 'ewma') { w = P.lam * z + (1 - P.lam) * w; if (Math.abs(w) > P.ucl) return t; }
      else { sp = Math.max(0, sp + z - P.k); sm = Math.max(0, sm - z - P.k); if (sp > P.h || sm > P.h) return t; }
    }
    return P.cap;
  }
  function mcCell(method, delta, nRuns, seed, P, keep) {
    var runs = [], j, rr, out;
    for (j = 0; j < nRuns; j++) { rr = rng(hashSeed('S8', seed, 'mc', delta, j)); runs.push(oneRun(method, rr, delta, P)); }
    out = runSummary(runs, P.cap); if (keep) out.runs = runs;
    return out;
  }

  /* ---- 갈래 R: AR(1) φ, 전체 표준편차 1. 궤적(trace)은 기준 200장에서 추정한 φ̂ 로 잔차를 만들고, 런 길이 몬테카를로는 ARL 표와 같은 약속(참 φ 를 안다)으로 잰다. 감시 구간에서 원값 평균이 −δ 계단 이동(변화 직후 잔차는 −δ/√(1−φ²) 로 한 번 튀고, 그 뒤로는 −δ(1−φ)/√(1−φ²) 만큼만 계속 밀린다) ---- */
  function branchR(o) {
    var phi = o.phi, delta = o.delta, nRef = o.nRef, nMon = o.nMon, sa = o.shiftAt, seed = o.seed, inn = Math.sqrt(1 - phi * phi), i;
    var r = rng(hashSeed('S8', seed, 'Rtrace')), x = [r.normal()];
    for (i = 1; i < nRef + nMon; i++) x.push(phi * x[i - 1] + inn * r.normal());
    var obs = x.map(function (v, q) { return q >= nRef + sa - 1 ? v - delta : v; });
    var ref = obs.slice(0, nRef), mon = obs.slice(nRef), fit = arFit(ref), sdx = sd(ref);
    var firstHat = delta * sdx / fit.sdr, persistHat = delta * (1 - fit.phi) * sdx / fit.sdr;
    var kR = persistHat / 2, hR = calibCusumH(kR), kRaw = 0.5, hRaw = calibCusumH(kRaw);
    var kTh = delta * Math.sqrt((1 - phi) / (1 + phi)) / 2, hTh = calibCusumH(kTh);    // 참 φ 를 아는 이상적인 경우의 설계값(런 길이 몬테카를로용)
    var res = [], raw = mon.slice(), prev = ref[nRef - 1];
    for (i = 0; i < nMon; i++) { res.push(((mon[i] - fit.m) - fit.phi * (prev - fit.m)) / fit.sdr); prev = mon[i]; }
    var m3 = shewhartMonitor(res, 3, sa), mc = cusumMonitor(res, kR, hR, sa), mr = cusumMonitor(raw, kRaw, hRaw, sa);
    var out = { phi: phi, delta: delta, ref: ref, mon: mon, res: res, fit: fit, sdx: sdx, k_res: kR, h_res: hR, k_raw: kRaw, h_raw: hRaw, k_ideal: kTh, h_ideal: hTh,
                shift_res: { first_theory: delta / inn, persist_theory: delta * (1 - phi) / inn, first_hat: firstHat, persist_hat: persistHat },
                res3: { first: m3.first, delay: delayOf(m3.first, sa), pre: m3.pre },
                rescusum: { first: mc.first, delay: delayOf(mc.first, sa), pre: mc.pre, Sp: mc.Sp, Sm: mc.Sm, start: mc.start, side: mc.side },
                rawcusum: { first: mr.first, delay: delayOf(mr.first, sa), pre: mr.pre, Sp: mr.Sp, Sm: mr.Sm } };
    if (o.mcRuns > 0) {
      var cap = 20000, kinds = [['s', ['res3', 'rescusum']], ['n', ['res3', 'rescusum', 'raw']]], mcOut = { shift: {}, null: {} };
      kinds.forEach(function (kd) {
        var shifted = kd[0] === 's', names = kd[1], runs = {}, j, q, nm;
        names.forEach(function (n) { runs[n] = []; });
        for (j = 0; j < o.mcRuns; j++) {
          var rr = rng(hashSeed('S8', seed, 'Rmc', kd[0], j)), xp = rr.normal(), yp = xp, t = 0, left = names.length, done = {}, st = { sp: 0, sm: 0, rp: 0, rm: 0 };
          while (left > 0 && t < cap) {
            t++; var xt = phi * xp + inn * rr.normal(), yt = xt - (shifted ? delta : 0), rz = (yt - phi * yp) / inn;
            if (!done.res3 && names.indexOf('res3') >= 0 && Math.abs(rz) > 3) { done.res3 = 1; runs.res3.push(t); left--; }
            if (!done.rescusum && names.indexOf('rescusum') >= 0) {
              st.sp = Math.max(0, st.sp + rz - kTh); st.sm = Math.max(0, st.sm - rz - kTh);
              if (st.sp > hTh || st.sm > hTh) { done.rescusum = 1; runs.rescusum.push(t); left--; }
            }
            if (!done.raw && names.indexOf('raw') >= 0) {
              st.rp = Math.max(0, st.rp + yt - kRaw); st.rm = Math.max(0, st.rm - yt - kRaw);
              if (st.rp > hRaw || st.rm > hRaw) { done.raw = 1; runs.raw.push(t); left--; }
            }
            xp = xt; yp = yt;
          }
          for (q = 0; q < names.length; q++) { nm = names[q]; if (!done[nm]) runs[nm].push(cap); }
        }
        names.forEach(function (n) { mcOut[shifted ? 'shift' : 'null'][n] = runSummary(runs[n], cap); if (o.keep) mcOut[shifted ? 'shift' : 'null'][n].runs = runs[n]; });
      });
      out.mc = mcOut;
    }
    return out;
  }

  function S8(p) {
    var seed = p.seed == null ? SEEDS.S8 : p.seed, only = p.only || '';
    var delta = p.delta == null ? 1 : p.delta, lam = p.lam == null ? 0.2 : p.lam, k = p.k == null ? 0.5 : p.k, phi = p.phi == null ? 0.9 : p.phi, Lsh = p.L == null ? 3 : p.L;
    var nRef = p.n_ref || 200, nMon = p.n_mon || 300, sa = p.shift_at || 100, mcRuns = p.mc_runs == null ? 2000 : p.mc_runs, mcR = p.mc_runs_r == null ? 1000 : p.mc_runs_r, keep = p.keep_runs !== false;
    var Le = calibEwmaL(lam), hc = calibCusumH(k), ucl = Le * Math.sqrt(lam / (2 - lam)), DEL = [0, 0.5, 1, 2, 3], i;
    var out = { id: 'S8', name: 'small_shift', params: { seed: seed, mu0: MU0, sd0: SIG0, delta: delta, lam: lam, k: k, L_shew: Lsh, L_ewma: Le, ucl_ewma: ucl, h_cusum: hc, arl0_target: ARL0_T,
                 m_ewma: 101, m_cusum: 100, n_ref: nRef, n_mon: nMon, shift_at: sa, mc_runs: mcRuns, mc_runs_r: mcR, phi: phi, deltas: DEL } };
    if (!only || only === 'arl') {
      out.arl = { deltas: DEL, shew: DEL.map(function (d) { return arlShewhart(d, Lsh); }), ewma: DEL.map(function (d) { return arlEwma(lam, Le, d); }), cusum: DEL.map(function (d) { return arlCusum(k, hc, d); }) };
      if (mcRuns > 0) {
        var P = { L: Lsh, lam: lam, ucl: ucl, k: k, h: hc, cap: 100000 };
        out.mc = { deltas: DEL, shew: [], ewma: [], cusum: [] };
        DEL.forEach(function (d) { ['shew', 'ewma', 'cusum'].forEach(function (m) { out.mc[m].push(mcCell(m, d, mcRuns, seed, P, keep)); }); });
      }
    }
    if (!only || only === 'trace' || only === 'S') {
      var r = rng(hashSeed('S8', seed, 'trace')), ref = [], mon = [], z, zs = [];
      for (i = 0; i < nRef; i++) ref.push(MU0 + SIG0 * r.normal());
      for (i = 0; i < nMon; i++) mon.push(MU0 + SIG0 * (r.normal() - (i >= sa - 1 ? delta : 0)));
      zs = mon.map(function (v) { return (v - MU0) / SIG0; });
      var ms = shewhartMonitor(zs, Lsh, sa), me = ewmaMonitor(zs, lam, Le, sa), mcu = cusumMonitor(zs, k, hc, sa);
      out.trace = { ref: ref, mon: mon, z: zs, ref_mean: mean(ref), ref_sd: sd(ref), shift_at: sa, delta: delta,
        shew: { first: ms.first, delay: delayOf(ms.first, sa), pre: ms.pre },
        ewma: { first: me.first, delay: delayOf(me.first, sa), pre: me.pre, w: me.w, ucl: me.ucl },
        cusum: { first: mcu.first, delay: delayOf(mcu.first, sa), pre: mcu.pre, Sp: mcu.Sp, Sm: mcu.Sm, h: hc, start: mcu.start, start_err: mcu.start == null ? null : mcu.start - sa, side: mcu.side } };
    }
    if (!only || only === 'trace' || only === 'R') {
      out.R = branchR({ phi: phi, delta: delta, nRef: nRef, nMon: nMon, shiftAt: sa, seed: seed, mcRuns: (only === 'trace' ? 0 : mcR), keep: keep });
    }
    out.csvRows = function () {                // branch(S/R), role(ref/mon), idx, value, truth_flag(변화 뒤 유리=1)
      var rows = [];
      function add(br, role, arr, flagFrom) { for (var q = 0; q < arr.length; q++) rows.push({ branch: br, role: role, idx: q, value: arr[q], truth_flag: flagFrom != null && q >= flagFrom ? 1 : 0 }); }
      if (out.trace) { add('S', 'ref', out.trace.ref); add('S', 'mon', out.trace.mon, sa - 1); }
      if (out.R) { add('R', 'ref', out.R.ref); add('R', 'mon', out.R.mon, sa - 1); }
      return rows;
    };
    return out;
  }
  S8.tools = { phiFast: phiFast, arlShewhart: arlShewhart, arlEwma: arlEwma, arlCusum1: arlCusum1, arlCusum: arlCusum, bisect: bisect, calibEwmaL: calibEwmaL, calibCusumH: calibCusumH,
               shewhartMonitor: shewhartMonitor, ewmaMonitor: ewmaMonitor, cusumMonitor: cusumMonitor, runSummary: runSummary, ARL0_T: ARL0_T, MU0: MU0, SIG0: SIG0 };

  /* S9 adaptive_spec_replay — 가성 인터락을 줄이는 spec: 적응형 한계와, 라벨이 붙은 과거 기록에 후보 spec 을 다시 돌려 보는 일(과거 재현).
   * 하루 200장 × 180일(기록 36,000장) + 배포 뒤 90일(18,000장, "미래"; 선택에 쓰지 않고 낙관 편향을 재는 데만 씀). PM 은 약 2,000장마다, PM 뒤 새 정상 수준 = 공칭(0) + N(0,τ²)(누적 아님, 첫 구간도 같은 분포).
   * 정상 산포 σ=1. 진성 이상 = 기대 3,000장에 1건(PM 직후 50장은 8배), 크기 +2.5σ~+5σ, 길이 기하분포(평균 40장, 다음 PM 에서 끊김).
   * 정책: P0 현행 고정(k=3) · P1 고정+k 최적화 · P2 적응형(PM 뒤 n_b장 안정화 구간 중앙값·1.4826·MAD, 허용 이동폭 Δmax 가드).
   * 모든 정책은 같은 원자료에 같은 규칙(재가동 뒤 10장 안 재알람은 같은 건, 진성 알람이 나면 그 사건은 조치되어 끝남)으로 돌린다. */
  var S9_GRID = []; (function () { for (var j = 0; j <= 80; j++) S9_GRID.push((200 + 5 * j) / 100); })();
  var S9_PERIODS = ['tr', 'ck', 'fut', 'A', 'B'];                  // 학습 90일 · 확인 90일 · 배포 뒤 90일 · 섞어 나누기 A · B
  var S9_TAU = 0.35;                                // PM 뒤 새 정상 수준 = 공칭(0) + N(0, τ²), 누적 아님(부품을 새로 맞춰 공칭 근처로 돌아오되 매번 조금씩 다른 자리에 앉음)
  function s9gen(seed, o) {
    o = o || {};
    var per = o.per_day || 200, nH = per * (o.days || 180), nF = per * (o.future_days == null ? 90 : o.future_days), N = nH + nF, i, j;
    var rp = rng(hashSeed('S9', seed, 'pm')), tau = o.tau == null ? S9_TAU : o.tau, pm = [], lev = [rp.normal(0, tau)], pos = 0;
    for (;;) { pos += 1600 + Math.floor(rp.u() * 801); if (pos >= N) break; pm.push(pos); lev.push(rp.normal(0, tau)); }
    var seg = new Int32Array(N), p = 0;
    for (i = 0; i < N; i++) { while (p < pm.length && i >= pm[p]) p++; seg[i] = p; }
    var re = rng(hashSeed('S9', seed, 'ev')), ev = new Int32Array(N).fill(-1), events = [], BASE = 1 / 3000, BOOST = o.boost == null ? 8 : o.boost, BLEN = o.boost_len || 50, lg = Math.log(1 - 1 / 40);
    i = 0;
    while (i < N) {
      var sg = seg[i], since = sg > 0 ? i - pm[sg - 1] : 1e9, hz = since < BLEN ? BASE * BOOST : BASE;
      if (re.u() < hz) {
        var len = 1 + Math.floor(Math.log(1 - re.u()) / lg), size = 2.5 + 2.5 * re.u(), segEnd = sg < pm.length ? pm[sg] : N, end = Math.min(i + len, segEnd);
        for (j = i; j < end; j++) ev[j] = events.length;
        events.push({ start: i, end: end, size: size }); i = end;
      } else i++;
    }
    var rn = rng(hashSeed('S9', seed, 'x')), x = new Float64Array(N);
    for (i = 0; i < N; i++) { x[i] = lev[seg[i]] + rn.normal() + (ev[i] >= 0 ? events[ev[i]].size : 0); }
    var rl = rng(hashSeed('S9', seed, 'lab')), U = new Float64Array(N), UE = [], rs = rng(hashSeed('S9', seed, 'split')), memA = new Uint8Array(N);
    for (i = 0; i < N; i++) U[i] = rl.u();
    for (j = 0; j < events.length; j++) UE.push(rl.u());
    for (i = 0; i < nH; i++) memA[i] = rs.u() < 0.5 ? 1 : 0;
    var cum = {}; S9_PERIODS.forEach(function (nm) {
      var c = new Int32Array(N + 1); for (i = 0; i < N; i++) { var m = nm === 'tr' ? i < nH / 2 : nm === 'ck' ? (i >= nH / 2 && i < nH) : nm === 'fut' ? i >= nH : nm === 'A' ? !!memA[i] : (i < nH && !memA[i]); c[i + 1] = c[i] + (m ? 1 : 0); } cum[nm] = c;
    });
    var nb0 = Math.min(o.n_base || 2000, pm.length ? pm[0] : N), bs = Array.prototype.slice.call(x, 0, nb0);
    return { seed: seed, tau: tau, N: N, nHist: nH, nFut: nF, per_day: per, x: x, pm: pm, level: lev, ev: ev, events: events, U: U, UE: UE, memA: memA, cum: cum, base: { n: nb0, c: mean(bs), w: sd(bs) }, pc: {}, cc: {}, rc: {} };
  }
  function s9policy(D, kind, nb, dmax, guard) {
    var key = kind + '|' + nb + '|' + dmax + '|' + guard; if (D.pc[key]) return D.pc[key];
    var N = D.N, x = D.x, T = new Float64Array(N), CA = new Float64Array(N), WA = new Float64Array(N), AA = new Float64Array(N), forced = [], moves = [], c = D.base.c, w = D.base.w, i, j;
    CA.fill(c); WA.fill(w);
    var firstEnd = kind === 'fixed' || !D.pm.length ? N : D.pm[0];
    for (i = 0; i < firstEnd; i++) T[i] = Math.abs(x[i] - c) / w;
    if (kind !== 'fixed') {
      for (j = 0; j < D.pm.length; j++) {
        var pst = D.pm[j], segEnd = j + 1 < D.pm.length ? D.pm[j + 1] : N, we = Math.min(pst + nb, segEnd), win = Array.prototype.slice.call(x, pst, we);
        var nc = median(win), nw = 1.4826 * median(win.map(function (v) { return Math.abs(v - nc); })), moved = Math.abs(nc - c) > dmax * w, evs = [], q, last = -1;
        for (q = pst; q < we; q++) if (D.ev[q] >= 0 && D.ev[q] !== last) { last = D.ev[q]; evs.push(last); }
        var adopt = true;
        if (guard && moved) { forced.push({ t: we - 1, evs: evs, from: pst, to: we }); adopt = evs.length === 0; }
        moves.push({ pm: pst, old_c: c, old_w: w, new_c: nc, new_w: nw, moved: moved, anom_in_window: evs.length > 0, checked: !!(guard && moved), adopted: adopt, win_end: we });
        for (q = pst; q < we; q++) { T[q] = Math.abs(x[q] - c) / w - dmax; CA[q] = c; WA[q] = w; AA[q] = dmax; }
        if (adopt) { c = nc; w = nw; }
        for (q = we; q < segEnd; q++) { T[q] = Math.abs(x[q] - c) / w; CA[q] = c; WA[q] = w; }
      }
    }
    var ci = [], ct = []; for (i = 0; i < N; i++) if (T[i] > 2) { ci.push(i); ct.push(T[i]); }
    var ks = Object.keys(D.pc); if (ks.length >= 16) delete D.pc[ks[0]];       // 슬라이더를 오래 끌어도 메모리가 쌓이지 않게 오래된 것부터 버린다
    return (D.pc[key] = { kind: kind, nb: nb, dmax: dmax, guard: guard, c: CA, w: WA, add: AA, ci: Int32Array.from(ci), ct: Float64Array.from(ct), forced: forced, moves: moves });
  }
  function s9labels(D, err, dir) {                 // 기록된 라벨: 진성 사건이 가성으로 적힘(사건 단위, 'both'·'true2fa') · 정상 유리의 알람이 진성으로 적힘(유리 단위, 'both'·'fa2true')
    dir = dir || 'both'; var key = 'e' + err + dir; if (D.rc[key]) return D.rc[key];
    var evId = new Int32Array(D.N), mis = new Uint8Array(D.events.length), i, eT = dir === 'fa2true' ? 0 : err, eF = dir === 'true2fa' ? 0 : err;
    for (var e = 0; e < D.events.length; e++) mis[e] = D.UE[e] < eT ? 1 : 0;
    for (i = 0; i < D.N; i++) { var e0 = D.ev[i]; evId[i] = e0 >= 0 ? (mis[e0] ? -1 : e0) : (D.U[i] < eF ? -2 : -1); }
    return (D.rc[key] = { evId: evId, mis: mis });
  }
  function s9scan(D, pol, k, lab, traced, rearm) {
    rearm = rearm == null ? 10 : rearm;
    var evId = lab ? lab.evId : D.ev, mis = lab ? lab.mis : null, ne = D.events.length, det = new Float64Array(ne).fill(Infinity), cum = D.cum, np = S9_PERIODS.length;
    var fa = [0, 0, 0, 0, 0], miss = [0, 0, 0, 0, 0], sup = -1, checks = 0, fi = 0, a = 0, ci = pol.ci, ct = pol.ct, F = pol.forced, P, q, e, alarms = [], hits = [];
    function addFA(i) { for (P = 0; P < np; P++) { var c = cum[S9_PERIODS[P]]; fa[P] += c[i + 1] - c[i]; } alarms.push(i); }
    for (;;) {
      while (a < ci.length && ct[a] <= k) a++;
      var nextC = a < ci.length ? ci[a] : Infinity, nextF = fi < F.length ? F[fi].t : Infinity;
      if (nextC === Infinity && nextF === Infinity) break;
      if (nextF <= nextC) {
        var f = F[fi++]; if (nextF === nextC) a++;
        var found = false;
        for (q = 0; q < f.evs.length; q++) { e = f.evs[q]; if (mis && mis[e]) continue; found = true; if (det[e] === Infinity) det[e] = f.t; }
        if (!found) addFA(f.t); else hits.push(f.t);
        checks++; sup = f.t + rearm; continue;
      }
      var i = nextC; a++;
      e = evId[i];
      if (e >= 0 && det[e] < i) continue;
      if (i <= sup) continue;
      sup = i + rearm;
      if (e >= 0) { det[e] = i; hits.push(i); } else if (e === -1) addFA(i); else hits.push(i);
    }
    for (e = 0; e < ne; e++) {
      if (mis && mis[e]) continue;
      var ev0 = D.events[e], d = det[e];
      if (d === Infinity && traced === false) continue;
      var b = Math.min(d, ev0.end);
      for (P = 0; P < np; P++) { var c2 = cum[S9_PERIODS[P]]; miss[P] += c2[b] - c2[ev0.start]; }
    }
    return { fa: fa, miss: miss, checks: checks, det: det, alarms: alarms, hits: hits };
  }
  function s9curve(D, popt, labErr, traced, dir) {      // 정책 popt={kind,nb,dmax,guard} 을 k 격자 전체에 돌린 결과(캐시). labErr == null 이면 참값 라벨
    var key = [popt.kind, popt.nb, popt.dmax, popt.guard, labErr == null ? 'T' : labErr, traced === false ? 'u' : 't', dir || 'both'].join('|'); if (D.cc[key]) return D.cc[key];
    var pol = s9policy(D, popt.kind, popt.nb, popt.dmax, popt.guard), lab = labErr == null ? null : s9labels(D, labErr, dir), out = { fa: [], miss: [], checks: [] };
    for (var j = 0; j < S9_GRID.length; j++) { var r = s9scan(D, pol, S9_GRID[j], lab, traced === false ? false : true); out.fa.push(r.fa); out.miss.push(r.miss); out.checks.push(r.checks); }
    return (D.cc[key] = out);
  }
  function s9cost(cv, j, per, cfa, cmiss) { var P = S9_PERIODS.indexOf(per); return cfa * cv.fa[j][P] + cmiss * cv.miss[j][P]; }
  function s9argmin(cv, per, cfa, cmiss) { var best = 0, bv = Infinity; for (var j = 0; j < S9_GRID.length; j++) { var v = s9cost(cv, j, per, cfa, cmiss); if (v < bv - 1e-9) { bv = v; best = j; } } return best; }
  var S9_K3 = 20;                                  // S9_GRID[20] = 3.00
  function s9analyze(D, o) {
    o = o || {};
    var nb = o.n_burn || 100, dmax = o.dmax == null ? 3 : o.dmax, guard = o.guard !== false, cfa = o.c_fa == null ? 15 : o.c_fa, cmiss = o.c_miss == null ? 10 : o.c_miss, err = o.label_err || 0, dir = o.label_dir || 'both', traced = o.miss_traced !== false;
    var p1 = { kind: 'fixed', nb: nb, dmax: dmax, guard: guard }, p2 = { kind: 'adaptive', nb: nb, dmax: dmax, guard: guard };
    var T1 = s9curve(D, p1, null, true), T2 = s9curve(D, p2, null, true);                         // 참값 라벨
    var R1 = err > 0 || !traced ? s9curve(D, p1, err, traced, dir) : T1, R2 = err > 0 || !traced ? s9curve(D, p2, err, traced, dir) : T2;   // 기록된 라벨
    function at(cv, j) { var r = {}; S9_PERIODS.forEach(function (per, P) { r[per] = { fa: cv.fa[j][P], miss: cv.miss[j][P], cost: cfa * cv.fa[j][P] + cmiss * cv.miss[j][P] }; }); r.k = S9_GRID[j]; r.checks = cv.checks[j]; return r; }
    function pick(rec, tru, per) { var j = s9argmin(rec, per, cfa, cmiss), jt = s9argmin(tru, per, cfa, cmiss); return { j: j, k: S9_GRID[j], j_true: jt, k_true: S9_GRID[jt] }; }
    var out = { params: { seed: D.seed, n_burn: nb, dmax: dmax, guard: guard, c_fa: cfa, c_miss: cmiss, r: cmiss / cfa, label_err: err, label_dir: dir, miss_traced: traced }, grid: S9_GRID };
    out.P0 = at(T1, S9_K3);
    var s1 = pick(R1, T1, 'tr'), s2 = pick(R2, T2, 'tr'), sh1 = pick(R1, T1, 'A'), sh2 = pick(R2, T2, 'A');
    out.P1 = { time: at(T1, s1.j), rec: at(R1, s1.j), at_true_k: at(T1, s1.j_true), pick: s1 }; out.P2 = { time: at(T2, s2.j), rec: at(R2, s2.j), at_true_k: at(T2, s2.j_true), pick: s2 };
    out.shuffle = { P1: { pick: sh1, at: at(T1, sh1.j) }, P2: { pick: sh2, at: at(T2, sh2.j) } };
    out.curves = { P1_true: T1, P2_true: T2, P1_rec: R1, P2_rec: R2 };
    out.policy2 = s9policy(D, 'adaptive', nb, dmax, guard);
    return out;
  }
  function S9(p) {
    var seed = p.seed == null ? SEEDS.S9 : p.seed, D = s9gen(seed, p), A = s9analyze(D, p);
    var nbur = A.params.n_burn, burnEv = [];
    D.events.forEach(function (e, id) { for (var q = 0; q < D.pm.length; q++) if (e.start >= D.pm[q] && e.start < D.pm[q] + nbur) { burnEv.push(id); break; } });
    var out = { id: 'S9', name: 'adaptive_spec_replay', params: Object.assign({ per_day: D.per_day, days: D.nHist / D.per_day, future_days: D.nFut / D.per_day, rearm: 10, grid_step: 0.05, k_min: 2, k_max: 6, tau: D.tau, size_min: 2.5, size_max: 5, len_mean: 40, pm_gap_min: 1600, pm_gap_max: 2400 }, A.params),
      N: D.N, nHist: D.nHist, x: D.x, pm_idx: D.pm, level: D.level, events: D.events, ev: D.ev, base: D.base, burn_events: burnEv, analysis: A, D: D };
    out.analyze = function (o) { return s9analyze(D, Object.assign({}, p, o || {})); };
    out.csvRows = function () {                    // idx, day, x(전체 자릿수), pm_start(PM 직후 첫 유리 1), event_id(0=정상, 1~=진성 이상 사건 번호), half(섞어 나누기 표시: 1 = 한쪽, 0 = 다른 쪽)
      var rows = [], pmset = {}; D.pm.forEach(function (q) { pmset[q] = 1; });
      for (var q = 0; q < D.nHist; q++) rows.push({ idx: q, day: Math.floor(q / D.per_day) + 1, x: D.x[q], pm_start: pmset[q] ? 1 : 0, event_id: D.ev[q] >= 0 ? D.ev[q] + 1 : 0, half: D.memA[q] });
      return rows;
    };
    return out;
  }
  S9.tools = { gen: s9gen, policy: s9policy, labels: s9labels, scan: s9scan, curve: s9curve, cost: s9cost, argmin: s9argmin, analyze: s9analyze, GRID: S9_GRID, PERIODS: S9_PERIODS, K3: S9_K3 };

  /* S10 ppa_vector_field — PPA 를 벡터장으로 보기(실험실 0301). 마스크 72장(B02~B07 × 세트 A·B·C × 챔버 1~4) 각각의 측정 유리 한 장.
   * seed 마다 마스크 집단(makeMask 의 tag 줄기)·턴·유리 순번을 다시 뽑는다. 새 난수는 전부 hashSeed('S10', …) 줄기. */
  var S10_COMPS = ['trans', 'rot', 'mag', 'ortho', 'high', 'stick', 'local'];
  var S10_COMP_KO = { trans: '평행이동', rot: '회전', mag: '배율', ortho: '직교도', high: '고차 성분', stick: '스틱', local: '국소 결함' };
  var S10_SPEC_Q = 0.95, S10_COL_Z = 3.5, S10_PT_Z = 4;
  function s10parts(c) {                         // 성분별 77점 기여 [{dx,dy}…] (잡음 없음). 일곱 묶음의 합 = 전체 장
    var out = {}, k; S10_COMPS.forEach(function (n) { out[n] = []; });
    var dm = {}; for (k = 0; k < c.defects.length; k++) dm[c.defects[k].px + ',' + c.defects[k].py] = c.defects[k];
    for (var py = 0; py < CFG.NY; py++) for (var px = 0; px < CFG.NX; px++) {
      var xy = gridXY(px, py), x = xy.x, y = xy.y, xm = x / 1000, ym = y / 1000, d = dm[px + ',' + py];
      out.trans.push({ dx: c.Tx, dy: c.Ty });
      out.rot.push({ dx: -c.theta * y * 1e-3, dy: c.theta * x * 1e-3 });
      out.mag.push({ dx: c.Mx * x * 1e-3, dy: c.My * y * 1e-3 });
      out.ortho.push({ dx: c.K * y * 1e-3, dy: 0 });
      out.high.push({ dx: c.Cx * xm * ym, dy: c.Cy * xm * xm });
      out.stick.push({ dx: c.stick_off[px], dy: c.stick_pitch[px] * y * 1e-3 });
      out.local.push({ dx: d ? d.dx : 0, dy: d ? d.dy : 0 });
    }
    return out;
  }
  function s10shares(c) {                        // 성분별 제곱합 Σ(dx²+dy²)와 몫(일곱 제곱합의 합이 분모). 주된 성분 = 몫 최대
    var P = s10parts(c), ss = {}, tot = 0, best = null;
    S10_COMPS.forEach(function (n) { var s = 0; P[n].forEach(function (q) { s += q.dx * q.dx + q.dy * q.dy; }); ss[n] = s; tot += s; });
    var share = {}; S10_COMPS.forEach(function (n) { share[n] = tot > 0 ? ss[n] / tot : 0; if (best === null || share[n] > share[best]) best = n; });
    return { ss: ss, share: share, total: tot, dominant: best };
  }
  function s10cols(grid) {                       // 77점 → 열(11)마다 dx 평균
    var cm = [], j, i; for (j = 0; j < CFG.NX; j++) { var s = 0; for (i = 0; i < CFG.NY; i++) s += grid[i * CFG.NX + j].dx_um; cm.push(s / CFG.NY); }
    return cm;
  }
  /* 열 단면: 열 평균 cm 을 이웃 열로 예측(안쪽 열 = 양 이웃 평균, 바깥 열 = 안쪽 두 열로 직선 연장)한 잔차를,
   * 잔차 분산 배수(안쪽 1.5, 바깥 6)의 제곱근으로 나눠 같은 눈금으로 만든 뒤 로버스트 z = (r − 중앙값)/(1.4826·MAD) */
  function columnProfile(grid, zthr) {
    zthr = zthr == null ? S10_COL_Z : zthr;
    var cm = s10cols(grid), n = cm.length, r = [], j;
    for (j = 0; j < n; j++) {
      var pred = j === 0 ? 2 * cm[1] - cm[2] : j === n - 1 ? 2 * cm[n - 2] - cm[n - 3] : (cm[j - 1] + cm[j + 1]) / 2;
      r.push((cm[j] - pred) / Math.sqrt(j === 0 || j === n - 1 ? 6 : 1.5));
    }
    var md = median(r), sc = 1.4826 * median(r.map(function (v) { return Math.abs(v - md); })), z = r.map(function (v) { return sc > 0 ? (v - md) / sc : 0; });
    var zmax = 0, jmax = 0; z.forEach(function (v, i) { if (Math.abs(v) > zmax) { zmax = Math.abs(v); jmax = i; } });
    return { col_mean: cm, resid: r, scale: sc, z: z, zmax: zmax, jmax: jmax, flagged: z.map(function (v, i) { return Math.abs(v) >= zthr ? i : -1; }).filter(function (i) { return i >= 0; }) };
  }
  /* 튀는 점: 점마다 (자기 − 이웃 중앙값)을 dx·dy 따로 구하고, 각각 로버스트 z(전체 잔차의 중앙값·1.4826·MAD)로 바꿔 둘 중 큰 쪽이 zthr 이상이면 표시 */
  function pointOutliers(grid, zthr) {
    zthr = zthr == null ? S10_PT_Z : zthr;
    var NX = CFG.NX, NY = CFG.NY, rx = [], ry = [], px, py, a, b;
    for (py = 0; py < NY; py++) for (px = 0; px < NX; px++) {
      var nx = [], ny = [];
      for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) {
        if (!a && !b) continue; var qx = px + a, qy = py + b; if (qx < 0 || qx >= NX || qy < 0 || qy >= NY) continue;
        var g = grid[qy * NX + qx]; nx.push(g.dx_um); ny.push(g.dy_um);
      }
      var me = grid[py * NX + px]; rx.push(me.dx_um - median(nx)); ry.push(me.dy_um - median(ny));
    }
    function rz(r) { var md = median(r), sc = 1.4826 * median(r.map(function (v) { return Math.abs(v - md); })); return r.map(function (v) { return sc > 0 ? (v - md) / sc : 0; }); }
    var zx = rz(rx), zy = rz(ry), out = [];
    for (var i = 0; i < zx.length; i++) { var zm = Math.max(Math.abs(zx[i]), Math.abs(zy[i])); if (zm >= zthr) out.push({ px: i % NX, py: Math.floor(i / NX), zx: zx[i], zy: zy[i], z: zm }); }
    return { zx: zx, zy: zy, flagged: out };
  }
  function s10pickPair(items, spec) {            // 규칙: 지표 판정(spec 안/밖)이 같고 주된 성분이 다른 짝 가운데 |dx_metric 차이| 최소
    var best = null;
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
      var A = items[i], B = items[j];
      if (A.dominant === B.dominant || (A.metric.dx_metric <= spec) !== (B.metric.dx_metric <= spec)) continue;
      var d = Math.abs(A.metric.dx_metric - B.metric.dx_metric);
      if (best === null || d < best.diff) best = { i: i, j: j, diff: d, diff_dy: Math.abs(A.metric.dy_metric - B.metric.dy_metric) };
    }
    return best;
  }
  function s10pickQuiz(items, exclude) {         // 규칙: 성분마다 그 성분 몫이 가장 큰 유리(앞 문항에서 쓴 유리·exclude 제외). 몫 50% 미만이면 mixed
    var used = {}; (exclude || []).forEach(function (i) { used[i] = 1; });
    return S10_COMPS.map(function (n) {
      var bi = -1; items.forEach(function (it, i) { if (!used[i] && (bi < 0 || it.share[n] > items[bi].share[n])) bi = i; });
      used[bi] = 1; return { comp: n, i: bi, share: items[bi].share[n], mixed: items[bi].share[n] < 0.5 };
    });
  }
  function S10(p) {
    var seed = p.seed == null ? SEEDS.S10 : p.seed, items = [], b, s, c, ids = [];
    ['B02', 'B03', 'B04', 'B05', 'B06', 'B07'].forEach(function (bk) { SETS.forEach(function (st) { for (c = 1; c <= 4; c++) ids.push(maskId(bk, st, c)); }); });
    ids.forEach(function (id) {
      var mk = makeMask(id, null, seed), r = rng(hashSeed('S10', seed, id, 'turn')), pm = parseMaskId(id);
      var turn = 1 + r.int(20), git = 1 + r.int(CFG.N_TURN), temp = chamberTemp(pm.chamber, git);
      var ctx = { glass_id: 'S10-' + seed + '-' + id, block: mk.block, chamber: mk.chamber, mask_set: mk.set, turn: turn, glass_in_turn: git, chamber_temp: temp };
      var res = ppa(ctx, mk), sh = s10shares(res.truth), cp = columnProfile(res.grid), po = pointOutliers(res.grid);
      var defOut = res.truth.defects.length ? po.flagged.some(function (f) { return f.px === res.truth.defects[0].px && f.py === res.truth.defects[0].py; }) : null;
      items.push({ glass_id: ctx.glass_id, mask_id: id, block: mk.block, mask_set: mk.set, chamber: mk.chamber, turn: turn, glass_in_turn: git, chamber_temp: temp,
        grid: res.grid, truth: res.truth, bad_stick: mk.bad_stick, metric: ppaMetric(res.grid), ss: sh.ss, share: sh.share, dominant: sh.dominant, total: sh.total, col: cp, pts: po, defect_found: defOut });
    });
    var good = items.filter(function (it) { return it.bad_stick < 0; }).map(function (it) { return it.metric.dx_metric; });
    var spec = quantileOf(good, S10_SPEC_Q);
    var bad = items.map(function (it, i) { return i; }).filter(function (i) { return items[i].bad_stick >= 0; });
    var missM = bad.filter(function (i) { return items[i].metric.dx_metric <= spec; });
    var caught = missM.filter(function (i) { return items[i].col.flagged.indexOf(items[i].bad_stick) >= 0; });
    var falseCol = items.filter(function (it) { return it.bad_stick < 0 && it.col.flagged.length > 0; }).length;
    var pair = s10pickPair(items, spec), quiz = s10pickQuiz(items, pair ? [pair.i, pair.j] : []);
    var withDef = items.filter(function (it) { return it.truth.defects.length > 0; }), defHit = withDef.filter(function (it) { return it.defect_found; });
    var defMiss = withDef.filter(function (it) { return it.metric.dx_metric <= spec; });
    var out = { id: 'S10', name: 'ppa_vector_field', params: { seed: seed, n_mask: items.length, spec_quantile: S10_SPEC_Q, col_z: S10_COL_Z, pt_z: S10_PT_Z },
      items: items, spec: spec, bad: bad, miss_metric: missM, caught_col: caught, false_col: falseCol, n_good: good.length, pair: pair, quiz: quiz,
      defect: { n: withDef.length, found: defHit.length, in_spec: defMiss.length }, ssum: null };
    out.csvRows = function () {
      var rows = [];
      items.forEach(function (it) { it.grid.forEach(function (q) { rows.push({ glass_id: it.glass_id, block: it.block, chamber: it.chamber, mask_id: it.mask_id, mask_set: it.mask_set, turn: it.turn, glass_in_turn: it.glass_in_turn,
        chamber_temp: +it.chamber_temp.toFixed(3), px: q.px, py: q.py, x_mm: +q.x_mm.toFixed(1), y_mm: +q.y_mm.toFixed(1), dx_um: +q.dx_um.toFixed(4), dy_um: +q.dy_um.toFixed(4), defect: q.defect, bad_stick: it.bad_stick }); }); });
      return rows;
    };
    return out;
  }
  S10.tools = { fieldAt: fieldAt, parts: s10parts, shares: s10shares, cols: s10cols, columnProfile: columnProfile, pointOutliers: pointOutliers, pickPair: s10pickPair, pickQuiz: s10pickQuiz, COMPS: S10_COMPS, COMP_KO: S10_COMP_KO, SPEC_Q: S10_SPEC_Q, COL_Z: S10_COL_Z, PT_Z: S10_PT_Z, quantileOf: quantileOf };

  /* ---- 실험실 0302: 성분 분해(최소제곱). dx·dy 154행을 하나의 설계 행렬로 풀어 계수·표준오차·잔차를 낸다. 기존 ppaFit 은 그대로 둔다. ---- */
  var S10_TERMS_ALL = ['T', 'rot', 'mag', 'ortho', 'high'];
  var S10_TERM_COEF = { T: ['Tx', 'Ty'], rot: ['theta'], mag: ['Mx', 'My'], ortho: ['K'], high: ['Cx', 'Cy'] };
  var S10_COEF_ORDER = ['Tx', 'Ty', 'theta', 'Mx', 'My', 'K', 'Cx', 'Cy'];
  var S10_PRESETS = {                                  // 측정점 누락 프리셋(점 번호 = py·11 + px)
    right_col: (function () { var a = []; for (var py = 0; py < 7; py++) a.push(py * 11 + 10); return a; })(),
    corners: [0, 10, 66, 76],                          // 네 모서리(가운데 기준 대칭으로 빠짐)
    top_right: [65, 75, 76]                            // 오른쪽 위 모서리 세 점(비대칭으로 빠짐)
  };
  var S10_CORR_TERMS = ['T', 'rot', 'mag', 'ortho'];   // 단순 평균법과 견주는 모델(두 방법이 다루는 여섯 계수)
  function s10coefs(terms) { terms = terms || S10_TERMS_ALL; return S10_COEF_ORDER.filter(function (c) { return terms.some(function (t) { return S10_TERM_COEF[t].indexOf(c) >= 0; }); }); }
  function s10col(c, x, y) {                           // 계수 한 칸의 설계 행렬 값 [dx 행, dy 행], x·y 는 mm
    var xm = x / 1000, ym = y / 1000;
    switch (c) {
      case 'Tx': return [1, 0]; case 'Ty': return [0, 1]; case 'theta': return [-ym, xm]; case 'Mx': return [xm, 0];
      case 'My': return [0, ym]; case 'K': return [ym, 0]; case 'Cx': return [xm * ym, 0]; default: return [0, xm * xm];
    }
  }
  function s10keep(exclude) { var ex = {}, k = [], i; (exclude || []).forEach(function (e) { ex[e] = 1; }); for (i = 0; i < CFG.NX * CFG.NY; i++) if (!ex[i]) k.push(i); return k; }
  /* 설계 행렬: 앞 절반 = 남은 점의 dx 행, 뒤 절반 = dy 행. 반환 {X, y, names, kept} */
  function s10design(grid, terms, exclude) {
    var names = s10coefs(terms), kept = s10keep(exclude), X = [], y = [], i, k, r;
    for (r = 0; r < 2; r++) for (i = 0; i < kept.length; i++) {
      var g = grid[kept[i]], row = [];
      for (k = 0; k < names.length; k++) row.push(s10col(names[k], g.x_mm, g.y_mm)[r]);
      X.push(row); y.push(r === 0 ? g.dx_um : g.dy_um);
    }
    return { X: X, y: y, names: names, kept: kept };
  }
  function s10inv(A) {                                 // 가우스-조던 역행렬(작은 행렬용). 특이하면 null
    var n = A.length, M = A.map(function (r, i) { var q = r.slice(); for (var j = 0; j < n; j++) q.push(i === j ? 1 : 0); return q; }), i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i; for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      if (Math.abs(M[piv][i]) < 1e-11) return null;
      var t = M[i]; M[i] = M[piv]; M[piv] = t; var d = M[i][i];
      for (k = 0; k < 2 * n; k++) M[i][k] /= d;
      for (j = 0; j < n; j++) if (j !== i) { var f = M[j][i]; if (f) for (k = 0; k < 2 * n; k++) M[j][k] -= f * M[i][k]; }
    }
    return M.map(function (r) { return r.slice(n); });
  }
  function s10rank(X) {                                // 행렬의 계수(rank): 열 기준 가우스 소거, 문턱 = 최대 절댓값 × 1e-9
    var A = X.map(function (r) { return r.slice(); }), m = A.length, n = A[0].length, rank = 0, mx = 0, i, j, k;
    A.forEach(function (r) { r.forEach(function (v) { if (Math.abs(v) > mx) mx = Math.abs(v); }); });
    for (j = 0; j < n && rank < m; j++) {
      var piv = rank; for (i = rank + 1; i < m; i++) if (Math.abs(A[i][j]) > Math.abs(A[piv][j])) piv = i;
      if (Math.abs(A[piv][j]) < mx * 1e-9) continue;
      var t = A[rank]; A[rank] = A[piv]; A[piv] = t;
      for (i = rank + 1; i < m; i++) { var f = A[i][j] / A[rank][j]; for (k = j; k < n; k++) A[i][k] -= f * A[rank][k]; }
      rank++;
    }
    return rank;
  }
  function s10model(coef, g) { var c = { stick_off: ZERO11, stick_pitch: ZERO11 }; S10_COEF_ORDER.forEach(function (n) { c[n] = coef[n] || 0; }); return fieldAt(c, g.x_mm, g.y_mm, 0); }
  function s10gridOf(grid, coef, exclude) {            // 모델이 그린 장과 잔차(측정 − 모델)를 77점 격자꼴로
    var ex = {}; (exclude || []).forEach(function (e) { ex[e] = 1; });
    var fit = [], res = [];
    grid.forEach(function (g, i) {
      var v = s10model(coef, g), base = { px: g.px, py: g.py, x_mm: g.x_mm, y_mm: g.y_mm, excluded: ex[i] ? 1 : 0 };
      fit.push(Object.assign({}, base, { dx_um: v[0], dy_um: v[1] })); res.push(Object.assign({}, base, { dx_um: g.dx_um - v[0], dy_um: g.dy_um - v[1] }));
    });
    return { fitted: fit, resid: res };
  }
  /* 최소제곱: terms ⊆ S10_TERMS_ALL(기본 전부), exclude = 뺄 점 번호 목록. 반환 coef·se(σ̂ 기반)·se_known(CFG.NOISE 기반)·fitted·resid·rss·n(행 수)·p(계수 수)·sigma */
  function s10fit(grid, o) {
    o = o || {}; var D = s10design(grid, o.terms, o.exclude), X = D.X, y = D.y, p = D.names.length, n = X.length, i, j, k;
    var A = []; for (i = 0; i < p; i++) A.push(new Array(p).fill(0));
    var b = new Array(p).fill(0);
    for (k = 0; k < n; k++) for (i = 0; i < p; i++) { b[i] += X[k][i] * y[k]; for (j = 0; j < p; j++) A[i][j] += X[k][i] * X[k][j]; }
    var Ai = s10inv(A); if (!Ai || n <= p) return { error: 'rank', p: p, n: n, names: D.names, kept: D.kept };
    var beta = Ai.map(function (r) { var s = 0; for (var q = 0; q < p; q++) s += r[q] * b[q]; return s; });
    var coef = {}, se = {}, sk = {}, rss = 0;
    for (k = 0; k < n; k++) { var f = 0; for (i = 0; i < p; i++) f += X[k][i] * beta[i]; rss += (y[k] - f) * (y[k] - f); }
    var sigma = n > p ? Math.sqrt(rss / (n - p)) : NaN;
    D.names.forEach(function (c, q) { coef[c] = beta[q]; se[c] = sigma * Math.sqrt(Ai[q][q]); sk[c] = CFG.NOISE * Math.sqrt(Ai[q][q]); });
    var G = s10gridOf(grid, coef, o.exclude);
    return { terms: o.terms || S10_TERMS_ALL.slice(), names: D.names, coef: coef, se: se, se_known: sk, fitted: G.fitted, resid: G.resid, rss: rss, n: n, p: p, npts: D.kept.length, sigma: sigma, kept: D.kept, exclude: (o.exclude || []).slice() };
  }
  /* 단순 평균법: 좌표를 가운데로 맞추지 않고 '대칭 격자'를 믿는 계산. 격자가 온전하면 [T·회전·배율·직교도] 최소제곱과 같다 */
  function s10naive(grid, exclude) {
    var kept = s10keep(exclude), sx2 = 0, sy2 = 0, sxdx = 0, sydy = 0, sxdy = 0, sydx = 0, mdx = 0, mdy = 0;
    kept.forEach(function (i) { var g = grid[i], x = g.x_mm / 1000, y = g.y_mm / 1000; sx2 += x * x; sy2 += y * y; sxdx += x * g.dx_um; sydy += y * g.dy_um; sxdy += x * g.dy_um; sydx += y * g.dx_um; mdx += g.dx_um; mdy += g.dy_um; });
    var th = sxdy / sx2, coef = { Tx: mdx / kept.length, Ty: mdy / kept.length, theta: th, Mx: sxdx / sx2, My: sydy / sy2, K: sydx / sy2 + th };
    var G = s10gridOf(grid, coef, exclude);
    return { coef: coef, fitted: G.fitted, resid: G.resid, npts: kept.length, kept: kept, exclude: (exclude || []).slice() };
  }
  /* 열마다 상수(스틱 오프셋) 11개를 모델에 넣을 때의 식별 점검. conv: 'none'(약속 없음) · 'sum0'(오프셋 합 0, 가로 기울기 0) · 'ends'(양 끝 열 오프셋 0). 약속은 KKT 연립방정식으로 정확히 건다 */
  function s10stickFit(grid, conv, exclude) {
    var D = s10design(grid, S10_CORR_TERMS, exclude), nb = D.names.length, np = D.kept.length, NX = CFG.NX, X = [], i, j, k;
    for (k = 0; k < D.X.length; k++) { var r = D.X[k].slice(), isdx = k < np, g = grid[D.kept[k % np]]; for (j = 0; j < NX; j++) r.push(isdx && g.px === j ? 1 : 0); X.push(r); }
    var p = nb + NX, C = [];
    if (conv === 'sum0') { C.push(new Array(nb).fill(0).concat(new Array(NX).fill(1))); C.push(new Array(nb).fill(0).concat(grid.slice(0, NX).map(function (g) { return g.x_mm / 1000; }))); }
    else if (conv === 'ends') { var a = new Array(nb + NX).fill(0), b2 = new Array(nb + NX).fill(0); a[nb] = 1; b2[nb + NX - 1] = 1; C.push(a, b2); }
    var out = { p: p, rank: s10rank(X), names: D.names.concat(grid.slice(0, NX).map(function (g, j) { return 'o' + j; })) };
    out.deficiency = p - out.rank;
    if (conv === 'none') return out;
    var q = C.length, m = p + q, K = [], rhs = new Array(m).fill(0);
    for (i = 0; i < m; i++) K.push(new Array(m).fill(0));
    for (k = 0; k < X.length; k++) for (i = 0; i < p; i++) { rhs[i] += X[k][i] * D.y[k]; for (j = 0; j < p; j++) K[i][j] += X[k][i] * X[k][j]; }
    for (i = 0; i < q; i++) for (j = 0; j < p; j++) { K[p + i][j] = C[i][j]; K[j][p + i] = C[i][j]; }
    var sol = solve(K, rhs), coef = {}; D.names.forEach(function (c, t) { coef[c] = sol[t]; });
    out.coef = coef; out.offsets = sol.slice(nb, p); out.rank_with_constraints = s10rank(X.concat(C.map(function (c) { return c.slice(); })));
    return out;
  }
  function s10errField(coef, truth, grid) {            // 추정 계수가 그리는 장과 정답 계수가 그리는 장의 차이의 제곱평균제곱근(µm). 여섯 계수(T·회전·배율·직교도)만 견줌
    var tc = {}, s = 0; S10_COEF_ORDER.slice(0, 6).forEach(function (c) { tc[c] = c === 'theta' ? truth.theta : truth[c]; });
    grid.forEach(function (g) { var a = s10model(coef, g), b = s10model(tc, g); s += (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); });
    return Math.sqrt(s / grid.length);
  }
  function s10subtract(grid, coef) { return grid.map(function (g) { var v = s10model(coef, g); return { px: g.px, py: g.py, x_mm: g.x_mm, y_mm: g.y_mm, dx_um: g.dx_um - v[0], dy_um: g.dy_um - v[1] }; }); }
  function s10pick(o, names) { var r = {}; names.forEach(function (n) { r[n] = o[n]; }); return r; }
  /* 유리 72장 전체 요약(추정 − 정답 오차·se_known 대비 배율·보정 효과·점 누락 프리셋에서 단순 평균법과의 비교) */
  function s10fitSummary(S) {
    var spec = S.spec, items = S.items.map(function (it, i) {
      var f = s10fit(it.grid), t = it.truth, err = {}, ratio = {};
      S10_COEF_ORDER.forEach(function (c) { err[c] = f.coef[c] - t[c]; ratio[c] = Math.abs(err[c]) / f.se_known[c]; });
      var aligned = s10subtract(it.grid, s10pick(f.coef, ['Tx', 'Ty', 'theta'])), cp = columnProfile(f.resid), pre = {};
      Object.keys(S10_PRESETS).forEach(function (k) {
        var ex = S10_PRESETS[k], l4 = s10fit(it.grid, { terms: S10_CORR_TERMS, exclude: ex }), nv = s10naive(it.grid, ex), kg = function (a) { return a.filter(function (g, q) { return ex.indexOf(q) < 0; }); };
        var lg = s10subtract(it.grid, l4.coef), ng = s10subtract(it.grid, nv.coef);
        pre[k] = { err_lsq: s10errField(l4.coef, t, it.grid), err_naive: s10errField(nv.coef, t, it.grid), metric_lsq: ppaMetric(lg).dx_metric, metric_naive: ppaMetric(ng).dx_metric,
          Tx_lsq: l4.coef.Tx - t.Tx, Tx_naive: nv.coef.Tx - t.Tx, Mx_lsq: l4.coef.Mx - t.Mx, Mx_naive: nv.coef.Mx - t.Mx };
      });
      var l4f = s10fit(it.grid, { terms: S10_CORR_TERMS }), nvf = s10naive(it.grid);
      return { mask_id: it.mask_id, glass_id: it.glass_id, bad_stick: it.bad_stick, coef: f.coef, se: f.se, se_known: f.se_known, err: err, ratio: ratio, rss: f.rss, sigma: f.sigma,
        metric_meas: it.metric.dx_metric, metric_align: ppaMetric(aligned).dx_metric, metric_all: ppaMetric(f.resid).dx_metric, col_flag_resid: cp.flagged,
        err_full4: s10errField(l4f.coef, t, it.grid), err_naive_full: s10errField(nvf.coef, t, it.grid), pre: pre };
    });
    return { spec: spec, items: items };
  }
  S10.tools.fit = s10fit; S10.tools.naive = s10naive; S10.tools.fitSummary = s10fitSummary; S10.tools.stickFit = s10stickFit; S10.tools.design = s10design; S10.tools.rank = s10rank;
  S10.tools.subtract = s10subtract; S10.tools.errField = s10errField; S10.tools.coefs = s10coefs;
  S10.tools.PRESETS = S10_PRESETS; S10.tools.TERMS = S10_TERMS_ALL; S10.tools.COEF_ORDER = S10_COEF_ORDER; S10.tools.CORR_TERMS = S10_CORR_TERMS; S10.tools.TERM_COEF = S10_TERM_COEF;

  return {
    version: 2, BLOCKS: BLOCKS, BLOCK_INFO: BLOCK_INFO, CHAMBERS: CHAMBERS, SETS: SETS, CFG: CFG, LOSS_CODES: LOSS_CODES, LOSS_META: LOSS_META,
    rng: rng, hashSeed: hashSeed, mulberry32: mulberry32, isoTs: isoTs, isFMM: isFMM,
    makeMask: makeMask, repairMask: repairMask, replaceStick: replaceStick, maskId: maskId, parseMaskId: parseMaskId, chamberTemp: chamberTemp,
    ppa: ppa, ppaField: ppaField, ppaComponents: ppaComponents, ppaMetric: ppaMetric, ppaFit: ppaFit,
    stepTrace: stepTrace, tempSeries: tempSeries, rateSeries: rateSeries, ar1Series: ar1Series, eventFlags: eventFlags, features: features,
    simulateLoss: simulateLoss, ESTC: ESTC, estcCheck: estcCheck, dwell: dwell, trajectory: trajectory, stateAt: stateAt, requestTransition: requestTransition, CASE_SCHEMA: CASE_SCHEMA, validateCase: validateCase, caseRecords: caseRecords, estcMetrics: estcMetrics, featuredCase: featuredCase, glassHistory: glassHistory, fdcTable: fdcTable, scenario: scenario, stats: stats, SEEDS: SEEDS, qnorm: qnorm, qinv: qinv, s7tools: S7.tools, s8tools: S8.tools, s9tools: S9.tools, s10tools: S10.tools
  };
});
