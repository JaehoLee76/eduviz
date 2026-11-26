/* Loop06 — 실험실 0601(닫힌 고리)의 계산 모듈. '실제 공장'은 숨은 파라미터로 돌린 simulateLoss, '트윈'은 같은 시뮬레이터에 지금 믿는 파라미터를 넣은 것이다.
 * 브라우저: mfgsim.js 다음에 loop06_tables.js(미리 계산한 표) 와 이 파일 → window.Loop06      node: require('./loop06.js')
 * 난수 없음(시드만 씀). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 파이썬(페이지 10절 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 값(HIDDEN)은 이 모듈 안에만 있고, CSV·표 파일·본문에는 넣지 않는다(정답 열기와 verify 만 읽는다). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'));
  else root.Loop06 = factory(root.MfgSim);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS) {
  'use strict';
  var DAYS = 60, CAP0 = 27, V0_CLEAN = 180, DEFAULT_COST = 500;   // DEFAULT_COST: 세정기 한 대의 하루 운영비(유리 장수로 환산, 가정)의 기본값
  var HIDDEN = { CLEAN: 196 };                                   // 실제 공장의 숨은 세정 시간(분). 화면 본문은 '정답 열기' 뒤에만 쓴다
  var GRID = [150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260];
  var CAPS = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34];
  var WINDOWS = [7, 14, 30, 60];
  var TWIN_SEEDS = [101, 102, 103, 104, 105, 106];                 // 트윈 쪽 시드(실제 쪽과 겹치지 않음)
  var REAL_LOG_SEEDS = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220];
  var REAL_EVAL_SEEDS = [301, 302, 303, 304, 305, 306, 307, 308]; // 결정을 적용한 '뒤'의 실제 결과를 재는 시드
  var CODES = MS.LOSS_CODES.concat(['LB-LINE']);
  var GAPK = ['q', 'busy', 'L'];                                  // 보정이 맞추는 지표: 세정 대기열 평균·세정기 사용 대수 평균·Loss 총 장수
  var KO = { q: '세정 대기열 평균(대)', busy: '세정 중 평균(대)', L: 'Loss 총 장수' };

  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }

  /* ---------- 1. 공장 돌리기 ---------- */
  function realSim(seed, cap) { return MS.simulateLoss({ seed: seed, params: { CLEAN: HIDDEN.CLEAN, CAP: cap == null ? CAP0 : cap } }); }
  function twinSim(seed, clean, cap) { return MS.simulateLoss({ seed: seed, params: { CLEAN: clean, CAP: cap == null ? CAP0 : cap } }); }

  /* 로그의 앞 N 일로 줄인 지표 하나 묶음: 세정 대기열 평균·세정 중 평균·Loss 총 장수·코드별 장수 */
  function metricsOf(events, hourly, days) {
    var h = hourly.slice(0, days * 24), q = [], b = [], i;
    for (i = 0; i < h.length; i++) { q.push(h[i].cleaner_queue); b.push(h[i].cleaner_busy); }
    var by = {}, L = 0; CODES.forEach(function (c) { by[c] = 0; });
    for (i = 0; i < events.length; i++) { var e = events[i]; if (e.start_min < days * 1440) { by[e.reason] = (by[e.reason] || 0) + e.loss_glass; L += e.loss_glass; } }
    return { days: days, q: mean(q), busy: mean(b), L: L, by: by };
  }
  function totalLoss(sim) { var L = 0; sim.events.forEach(function (e) { L += e.loss_glass; }); return L; }

  /* ---------- 2. gap 와 격자 보정 (표 → 값, 순수 함수) ---------- */
  /* 지표 하나의 차: |ln((트윈+1)/(실제+1))| — 배율의 차이라서 단위가 다른 지표를 같은 저울에 올린다. gap = 세 지표의 평균 */
  function gapOf(tw, re) {
    var parts = {}, s = 0;
    GAPK.forEach(function (k) { parts[k] = Math.abs(Math.log((tw[k] + 1) / (re[k] + 1))); s += parts[k]; });
    return { total: s / GAPK.length, parts: parts };
  }
  /* 트윈 격자 표(행: clean·seed·days·q·busy·L)에서 (clean, days) 의 시드 평균 지표 */
  function twinMean(grid, clean, days) {
    var rows = grid.filter(function (r) { return r.clean === clean && r.days === days; });
    return { q: mean(rows.map(function (r) { return r.q; })), busy: mean(rows.map(function (r) { return r.busy; })), L: mean(rows.map(function (r) { return r.L; })), n: rows.length };
  }
  /* 격자 보정: 모든 CLEAN 후보의 gap 을 재고 가장 작은 곳을 고른다(같으면 작은 쪽) */
  function gridCalibrate(grid, real, days) {
    var curve = GRID.map(function (c) { var g = gapOf(twinMean(grid, c, days), real); return { clean: c, gap: g.total, parts: g.parts }; });
    var best = curve[0]; curve.forEach(function (p) { if (p.gap < best.gap - 1e-12) best = p; });
    return { curve: curve, best: best.clean, gapMin: best.gap };
  }

  /* ---------- 3. 결정 표(정책 훑기)·결정 손해 ---------- */
  /* pol 행: side('twin'|'real'), clean(트윈만), seed, cap, loss(60일 Loss 총 장수). 총 비용(장/일) = 하루 Loss + 운전 대수 × 한 대 비용 */
  function lossAt(pol, side, clean, cap) {
    var rows = pol.filter(function (r) { return r.side === side && (side === 'real' || r.clean === clean) && r.cap === cap; });
    return mean(rows.map(function (r) { return r.loss; })) / DAYS;
  }
  function policySweep(pol, side, clean, cost) {
    return CAPS.map(function (c) { var l = lossAt(pol, side, clean, c); return { cap: c, loss: l, cost: l + cost * c }; });
  }
  function argBest(sw) { var b = sw[0]; sw.forEach(function (p) { if (p.cost < b.cost - 1e-9) b = p; }); return b.cap; }
  function decisionRegret(pol, choice, cost) {
    var re = policySweep(pol, 'real', null, cost), best = argBest(re), cv = re.filter(function (p) { return p.cap === choice; })[0], cb = re.filter(function (p) { return p.cap === best; })[0];
    return { choice: choice, best: best, regret: cv.cost - cb.cost, costChoice: cv.cost, costBest: cb.cost };
  }

  /* ---------- 4. 검증 영역 ---------- */
  /* 로그에 나타난 운전 조건: 시간별 '세정 중 대수' 의 최소·최대와 쓴 결정 값(CAP0) */
  function envelope(hourly, cap0) {
    var b = hourly.map(function (h) { return h.cleaner_busy; }), q = hourly.map(function (h) { return h.cleaner_queue; });
    return { busyMin: Math.min.apply(null, b), busyMax: Math.max.apply(null, b), qMax: Math.max.apply(null, q), cap0: cap0 == null ? CAP0 : cap0 };
  }
  function inEnvelope(env, cap) { return cap >= env.busyMin && cap <= env.cap0; }

  /* ---------- 5. 표 만들기(Node 에서 build_csv.mjs 가 부른다) ---------- */
  function buildTables(tick) {
    var pol = [], grid = [], reallog = [], rep = {};
    TWIN_SEEDS.forEach(function (s) {
      GRID.forEach(function (c) {
        CAPS.forEach(function (cap) {
          var sim = twinSim(s, c, cap); pol.push({ side: 'twin', clean: c, seed: s, cap: cap, loss: r4(totalLoss(sim)) });
          if (cap === CAP0) WINDOWS.forEach(function (d) { var m = metricsOf(sim.events, sim.hourly, d); var r = { clean: c, seed: s, days: d, q: r4(m.q), busy: r4(m.busy), L: r4(m.L) }; CODES.forEach(function (k) { r[k] = r4(m.by[k]); }); grid.push(r); });
          if (tick) tick();
        });
      });
    });
    REAL_EVAL_SEEDS.forEach(function (s) { CAPS.forEach(function (cap) { var sim = realSim(s, cap); pol.push({ side: 'real', clean: '', seed: s, cap: cap, loss: r4(totalLoss(sim)) }); if (tick) tick(); }); });
    REAL_LOG_SEEDS.forEach(function (s) {   // 실제 로그 쪽 지표는 반올림하지 않는다(회사 PC 에서 로그로 다시 계산한 값과 같아야 한다)
      var sim = realSim(s, CAP0), env = envelope(sim.hourly, CAP0);
      WINDOWS.forEach(function (d) { var m = metricsOf(sim.events, sim.hourly, d); var r = { seed: s, days: d, q: m.q, busy: m.busy, L: m.L }; CODES.forEach(function (k) { r[k] = r4(m.by[k]); }); reallog.push(r); });
      if (tick) tick();
    });
    return { pol: pol, grid: grid, reallog: reallog };
  }

  /* ---------- 6. 한 로그 시드로 닫힌 고리 전체를 한 바퀴(표 + 비용 가정) ---------- */
  function realOf(reallog, seed, days) { return reallog.filter(function (r) { return r.seed === seed && r.days === days; })[0]; }
  function loopFor(T, seed, days, cost) {
    var re = realOf(T.reallog, seed, days), cal = gridCalibrate(T.grid, re, days);
    var gap0 = gapOf(twinMean(T.grid, V0_CLEAN, days), re).total;
    var s0 = policySweep(T.pol, 'twin', V0_CLEAN, cost), s1 = policySweep(T.pol, 'twin', cal.best, cost);
    var c0 = argBest(s0), c1 = argBest(s1), r0 = decisionRegret(T.pol, c0, cost), r1 = decisionRegret(T.pol, c1, cost);
    return { chat: cal.best, gapBefore: gap0, gapAfter: cal.gapMin, cap0: c0, cap1: c1, best: r0.best, reg0: r0.regret, reg1: r1.regret, curve: cal.curve };
  }
  /* 시드 요약 한 줄(로그 시드 × 기간): 보정 최소점·gap 전후·두 권고·결정 손해 */
  function seedSummary(T, cost) {
    var rows = [];
    REAL_LOG_SEEDS.forEach(function (s) { WINDOWS.forEach(function (d) { var r = loopFor(T, s, d, cost); rows.push({ seed: s, days: d, chat: r.chat, gap_before: r4(r.gapBefore), gap_after: r4(r.gapAfter), cap_v0: r.cap0, cap_cal: r.cap1, cap_best: r.best, regret_v0: r4(r.reg0), regret_cal: r4(r.reg1) }); }); });
    return rows;
  }
  /* 시드 분포에서 대표 시드: 핵심 지표들의 백분위가 50 에서 가장 가까운 시드(Σ|백분위−50| 최소) */
  function pct(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-9) lt++; else if (Math.abs(x - v) <= 1e-9) eq++; }); return 100 * (lt + 0.5 * eq) / vals.length; }
  function repSeed(T, cost) {
    var rows = seedSummary(T, cost), per = {};
    var metrics = [function (r) { return r.days === 60 ? r.chat : null; }, function (r) { return r.days === 30 ? r.chat : null; }, function (r) { return r.days === 60 ? r.gap_after : null; }, function (r) { return r.days === 60 ? r.regret_v0 : null; }, function (r) { return r.days === 60 ? r.regret_cal : null; }];
    var res = REAL_LOG_SEEDS.map(function (s) { return { seed: s, score: 0 }; });
    metrics.forEach(function (f) {
      var vals = rows.map(f).filter(function (v) { return v != null; });
      res.forEach(function (o) { var r = rows.filter(function (x) { return x.seed === o.seed && f(x) != null; })[0]; o.score += Math.abs(pct(vals, f(r)) - 50); });
    });
    var best = res[0]; res.forEach(function (o) { if (o.score < best.score - 1e-9) best = o; });
    return { seed: best.seed, score: best.score, all: res };
  }

  return { DAYS: DAYS, DEFAULT_COST: DEFAULT_COST, CAP0: CAP0, V0_CLEAN: V0_CLEAN, HIDDEN: HIDDEN, GRID: GRID, CAPS: CAPS, WINDOWS: WINDOWS, TWIN_SEEDS: TWIN_SEEDS, REAL_LOG_SEEDS: REAL_LOG_SEEDS, REAL_EVAL_SEEDS: REAL_EVAL_SEEDS, CODES: CODES, GAPK: GAPK, KO: KO,
    realSim: realSim, twinSim: twinSim, metricsOf: metricsOf, totalLoss: totalLoss, gapOf: gapOf, twinMean: twinMean, gridCalibrate: gridCalibrate,
    lossAt: lossAt, policySweep: policySweep, argBest: argBest, decisionRegret: decisionRegret, envelope: envelope, inEnvelope: inEnvelope,
    buildTables: buildTables, realOf: realOf, loopFor: loopFor, seedSummary: seedSummary, repSeed: repSeed, pct: pct, quantile: quantile, mean: mean, r4: r4 };
});
