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
  function makeMask(id, over) {
    var p = parseMaskId(id), r = rng(hashSeed('mask', id)), lr = rng(hashSeed('lot', p.block, p.set));
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
  /* 77점 격자 생성. 반환 {…ctx, grid:[{px,py,x_mm,y_mm,dx_um,dy_um,defect}], truth} */
  function ppa(ctx, mask, opts) {
    opts = opts || {};
    var c = ppaComponents(ctx, mask, opts), nz = opts.noise == null ? CFG.NOISE : opts.noise;
    var rn = rng(hashSeed(ctx.glass_id, 'nz', opts.seed || 0)), grid = [], dmap = {}, i;
    for (i = 0; i < c.defects.length; i++) dmap[c.defects[i].px + ',' + c.defects[i].py] = c.defects[i];
    for (var py = 0; py < CFG.NY; py++) for (var px = 0; px < CFG.NX; px++) {
      var xy = gridXY(px, py), x = xy.x, y = xy.y, xm = x / 1000, ym = y / 1000;
      var dx = c.Tx - c.theta * y * 1e-3 + c.Mx * x * 1e-3 + c.K * y * 1e-3 + c.Cx * xm * ym + c.stick_off[px];
      var dy = c.Ty + c.theta * x * 1e-3 + c.My * y * 1e-3 + c.Cy * xm * xm + c.stick_pitch[px] * y * 1e-3;
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
        var masks = []; for (var m = 0; m < 4; m++) masks.push({ ch: m, avail: true, age: R.int(10), failAt: -1, failed: false });
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
      for (var ci = 0; ci < 4; ci++) {
        var mk = S.masks[ci], ch = B.ch[ci];
        mk.failed = false; mk.failAt = -1;
        if (!mk.avail) {
          if (ch.st === 'run') { ch.st = 'mask'; ch.reason = 'Q-MASK'; ch.root = 'Q-MASK'; ch.ev = openEv(t, B, B.id === '' ? '' : 'CH' + (ci + 1), 'Q-MASK', 'Q-MASK'); }
        } else {
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
        if (ch.st === 'mask') { closeEv(ch.ev, t); ch.st = 'run'; ch.ev = null; ch.nextBD = t + R.exp(P.MTBF_BD); ch.nextEV = t + R.exp(P.MTBF_EV); }
        if (mk.failed) { mk.avail = false; repairBench.push({ mk: mk, doneAt: t + P.TR + R.lognormal(P.REPAIR_MED, 0.5), set: S }); }
        else if (mk.avail) { mk.age++; arrivals.push({ at: t + P.TR, u: { set: S, mk: mk, repair: false } }); nUnits++; }
      }
      S.state = 'out'; S.pending = nUnits; B.dep = null; addReq(t, 2);
      if (nUnits === 0) S.state = 'clean';
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
      enterDep(B, first, 0);
      B.elapsed = R.int(P.T_TURN - 20);
      B.buf = P.BUF0;
      SETS.forEach(function (sn) {
        var S = B.sets[sn]; if (S === first) return;
        S.turn = 5 + R.int(5);
        if (R.u() < 0.5) S.state = 'ready';
        else { S.state = 'out'; S.pending = 4; for (var m = 0; m < 4; m++) arrivals.push({ at: R.int(60), u: { set: S, mk: S.masks[m], repair: false } }); }
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
      for (i = arrivals.length - 1; i >= 0; i--) if (arrivals[i].at <= t) { var uu = arrivals[i].u; uu.enq = t; cleanQ.push(uu); arrivals.splice(i, 1); }
      for (i = cleanRun.length - 1; i >= 0; i--) if (cleanRun[i].doneAt <= t) {
        var done = cleanRun[i].u;
        if (done.repair) { done.mk.avail = true; done.mk.age = 0; } else { done.set.pending--; }
        cleanRun.splice(i, 1);
      }
      while (cleanRun.length < P.CAP && cleanQ.length) cleanRun.push({ u: cleanQ.shift(), doneAt: t + P.CLEAN * (0.9 + 0.2 * R.u()) });
      for (i = repairBench.length - 1; i >= 0; i--) if (repairBench[i].doneAt <= t) {
        cleanQ.push({ set: repairBench[i].set, mk: repairBench[i].mk, repair: true, enq: t }); repairBench.splice(i, 1);
      }
      for (b = 0; b < 11; b++) SETS.forEach(function (sn) {
        var S = blocks[b].sets[sn];
        if ((S.state === 'out' || S.state === 'clean') && S.pending <= 0 && S.state !== 'xfer') { S.state = 'xfer'; S.readyAt = t + P.TOSTK; addReq(t, 1); }
        else if (S.state === 'xfer' && t >= S.readyAt) S.state = 'ready';
      });

      /* 블록별 */
      var capArr = new Array(11), rootArr = new Array(11);
      for (b = 0; b < 11; b++) {
        var B = blocks[b];
        for (c = 0; c < 4; c++) {                           // 챔버 상태
          var ch = B.ch[c], cn = 'CH' + (c + 1);
          if (ch.st === 'run') {
            if (t >= ch.nextBD) { ch.st = 'bd'; ch.reason = 'EQ-BD'; ch.root = 'EQ-BD'; ch.until = t + R.lognormal(P.BD_MED, 0.6); ch.ev = openEv(t, B, cn, 'EQ-BD', 'EQ-BD'); }
            else if (t >= ch.nextEV) { ch.st = 'ev'; ch.reason = 'Q-EVAP'; ch.root = 'Q-EVAP'; ch.until = t + R.lognormal(P.EV_MED, 0.5); ch.ev = openEv(t, B, cn, 'Q-EVAP', 'Q-EVAP'); }
            else if (t >= ch.nextPM) { ch.st = 'pm'; ch.reason = 'EQ-PM'; ch.root = 'EQ-PM'; ch.pmStart = t; ch.until = t + P.PM_DUR; ch.nextPM = t + P.PM_PERIOD; ch.ev = openEv(t, B, cn, 'EQ-PM', 'EQ-PM'); addReq(t, 2); }
          } else if (ch.st !== 'mask' && t >= ch.until) {
            if (ch.st === 'pm') addReq(t, 2);
            closeEv(ch.ev, t); ch.st = 'run'; ch.ev = null; ch.nextBD = t + R.exp(P.MTBF_BD); ch.nextEV = t + R.exp(P.MTBF_EV);
          }
        }
        if (B.dep) {                                        // 마스크 중도 불량
          for (c = 0; c < 4; c++) {
            var mk = B.dep.masks[c], ch2 = B.ch[c];
            if (mk.failAt >= 0 && !mk.failed && B.elapsed >= mk.failAt && ch2.st === 'run') {
              mk.failed = true; ch2.st = 'mask'; ch2.reason = 'Q-MASK'; ch2.root = 'Q-MASK'; ch2.ev = openEv(t, B, 'CH' + (c + 1), 'Q-MASK', 'Q-MASK');
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
    return { events: events, hourly: hourly, turns: turns, params: P, days: days };
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
   * 6. 시나리오 S1~S6 (숨은 정답 포함)
   * ============================================================ */
  var SEEDS = { S1: 12, S2: 5, S3: 1, S4: 4, S5: 4, S6: 6 };   // 기본 시드(오프라인 탐색으로 확정; verify.py 가 성질을 확인)

  function scenario(name, params) {
    params = params || {};
    var key = String(name).toUpperCase().slice(0, 2);
    var fn = { S1: S1, S2: S2, S3: S3, S4: S4, S5: S5, S6: S6 }[key];
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

  return {
    version: 2, BLOCKS: BLOCKS, BLOCK_INFO: BLOCK_INFO, CHAMBERS: CHAMBERS, SETS: SETS, CFG: CFG, LOSS_CODES: LOSS_CODES, LOSS_META: LOSS_META,
    rng: rng, hashSeed: hashSeed, mulberry32: mulberry32, isoTs: isoTs, isFMM: isFMM,
    makeMask: makeMask, repairMask: repairMask, replaceStick: replaceStick, maskId: maskId, parseMaskId: parseMaskId, chamberTemp: chamberTemp,
    ppa: ppa, ppaComponents: ppaComponents, ppaMetric: ppaMetric, ppaFit: ppaFit,
    stepTrace: stepTrace, tempSeries: tempSeries, rateSeries: rateSeries, ar1Series: ar1Series, eventFlags: eventFlags, features: features,
    simulateLoss: simulateLoss, glassHistory: glassHistory, fdcTable: fdcTable, scenario: scenario, stats: stats, SEEDS: SEEDS, qnorm: qnorm, qinv: qinv
  };
});
