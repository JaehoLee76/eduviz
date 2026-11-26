/* Eval0402 — 실험실 0402 의 계산 모듈: 0401 에이전트의 판단을 사람 결론(가상 공장에서는 정답)과 맞대어 혼동표·일치율·윌슨 구간을 내고,
 * 에이전트가 계획에 쓰는 단순 모델의 예측을 0206 의 실제 전이 기록(simulateLoss trace)과 견주어 sim-real gap 을 잰다.
 * 브라우저: mfgsim.js · llm_runs_0410.js · llmcheck.js · llm_runs_0411.js · llmverify.js · agent0401.js 다음에 <script src="eval0402.js"> → window.Eval0402
 * node    : require('./eval0402.js')
 * 난수 없음. mfgsim.js 와 agent0401.js 는 읽어서 부르기만 하고 고치지 않습니다. 같은 규칙을 파이썬(페이지 9절 코드)이 다시 구현해 verify.py 가 대조합니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./agent0401.js'));
  else root.Eval0402 = factory(root.MfgSim, root.Agent0401);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, A0) {
  'use strict';
  var DAYS = A0.DAYS, CH = A0.CH, NCH = CH.length, DAYMIN = MS.s15tools.DAY_MIN;
  var DELTA_H = 0.5, G0 = 2, SEEDS = 200, GAP_SEEDS = 30, REP = A0.SC.params.seed;
  var POLS = [{ id: 'strict', name: '엄격(점검 하나라도 실패하면 멈춤)', short: '엄격', tol: 0 }, { id: 'two', name: '실패 2개까지 허용', short: '2개 허용', tol: 2 }, { id: 'off', name: '점검 끔', short: '점검 끔', tol: 7 }];
  var UNITS = [{ id: 'day', name: '날 판정', per: 1 }, { id: 'chg', name: '변경점', per: NCH }, { id: 'req', name: '요청', per: NCH + 1 }];

  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sd(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }

  /* ---------- 1. 한 시드의 원자료: 사람 결론(정답)과 정책별 에이전트 행동 ---------- */
  function rawOf(A) {
    var SC = A.SC, P = SC.params, fm = {}, swaps = [], fault = [], kinds = [], pol = {};
    SC.clean.fdc.forEach(function (f) { fm[f.glass_id] = f; });
    SC.masks.forEach(function (m) {
      if (!(m.swap_ts > 0)) return;
      var day = Math.floor(m.swap_ts / DAYMIN) + 1; if (day > DAYS) return;
      var key = m.block + '-' + m.chamber, bef = [], aft = [];
      SC.clean.ppa.forEach(function (p) {
        var f = fm[p.glass_id]; if (!f || f.block + '-' + f.chamber !== key || f.chamber_temp == null) return;
        (p.ts < m.swap_ts ? bef : aft).push(p.Mx - P.thermal * (f.chamber_temp - P.T_ref));
      });
      swaps.push({ ch: key, day: day, ts: m.swap_ts, eff: mean(aft) - mean(bef) });
    });
    swaps.sort(function (a, b) { return a.day - b.day || (a.ch < b.ch ? -1 : 1); });
    for (var d = 0; d < DAYS; d++) { fault.push(SC.faults[d].kinds.length > 0); kinds.push(SC.faults[d].kinds.slice()); }
    POLS.forEach(function (p) {
      var r = A.run({ tol: p.tol }), an = [], flags = [], base = [], other = [];
      r.days.forEach(function (D) {
        an.push(D.analyzed);
        D.flagged.forEach(function (c) { flags.push({ day: D.day, ch: c }); });
        D.requests.forEach(function (q) { if (q.kind === 'baseline') base.push({ day: D.day, ch: q.ch }); else other.push({ day: D.day, ch: q.ch, kind: q.kind }); });
      });
      pol[p.id] = { an: an, flags: flags, base: base, other: other, summary: r.summary };
    });
    return { seed: P.seed, swaps: swaps, fault: fault, kinds: kinds, pol: pol };
  }
  function seedRaw(seed) { return seed === REP ? rawOf(A0) : rawOf(A0.forSeed(seed)); }

  /* ---------- 2. 평가: 평가 단위 셋의 혼동표 ---------- */
  function cell(c) { c.n = c.tp + c.fn + c.fp + c.tn; c.agree = c.n ? (c.tp + c.tn) / c.n : NaN; c.pos = c.tp + c.fn; c.allno = c.n ? (c.n - c.pos) / c.n : NaN; return c; }
  function evalRaw(raw, polId, G, D) {
    G = G == null ? G0 : G; D = D == null ? DAYS : D;
    var P = raw.pol[polId], i, d;
    var day = { tp: 0, fn: 0, fp: 0, tn: 0 };
    for (d = 1; d <= D; d++) { var f = raw.fault[d - 1], st = !P.an[d - 1]; if (f && st) day.tp++; else if (f) day.fn++; else if (st) day.fp++; else day.tn++; }
    var sw = raw.swaps.filter(function (s) { return s.day <= D; });
    var chg = { tp: 0, fn: 0, fp: 0, tn: 0 }, req = { tp: 0, fn: 0, fp: 0, tn: 0 }, lateC = 0, lateR = 0, items = [], exC = 0, exR = 0;
    var flags = P.flags.filter(function (x) { return x.day <= D; }), used = {};
    var base = P.base.filter(function (x) { return x.day <= D; }), usedB = {};
    function find(list, um, s, lo, hi) { for (var j = 0; j < list.length; j++) { var x = list[j]; if (!um[j] && x.ch === s.ch && x.day >= lo && x.day <= hi) return j; } return -1; }
    function pend(list, um, s) { list.forEach(function (x, j) { if (x.ch === s.ch && x.day >= s.day) um[j] = 1; }); }
    sw.forEach(function (s) {
      var posC = Math.abs(s.eff) >= DELTA_H, it = { ch: s.ch, day: s.day, eff: s.eff, posC: posC, chg: null, req: null }, j, k, l;
      if (s.day + G > D) {                                      // 판정 마감 전인 교체: 단위에서 빼고, 그 챔버의 이후 신호도 헛으로 세지 않음
        exR++; if (posC) exC++; pend(flags, used, s); pend(base, usedB, s); it.chg = posC ? '보류' : null; it.req = '보류'; items.push(it); return;
      }
      if (posC) {
        j = find(flags, used, s, s.day, s.day + G);
        if (j >= 0) { used[j] = 1; chg.tp++; it.chg = '맞음 ' + flags[j].day + '일'; }
        else { chg.fn++; l = find(flags, used, s, s.day + G + 1, D); if (l >= 0) { used[l] = 1; lateC++; it.chg = '놓침(늦게 ' + flags[l].day + '일)'; } else it.chg = '놓침'; }
      }
      k = find(base, usedB, s, s.day, s.day + G);
      if (k >= 0) { usedB[k] = 1; req.tp++; it.req = '맞음 ' + base[k].day + '일'; }
      else { req.fn++; l = find(base, usedB, s, s.day + G + 1, D); if (l >= 0) { usedB[l] = 1; lateR++; it.req = '놓침(늦게 ' + base[l].day + '일)'; } else it.req = '놓침'; }
      items.push(it);
    });
    var fpC = {}, fpR = {}, listFP = [];
    flags.forEach(function (x, j) { if (!used[j]) { fpC[x.day + '|' + x.ch] = 1; listFP.push({ kind: 'chg', day: x.day, ch: x.ch }); } });
    base.forEach(function (x, j) { if (!usedB[j]) { fpR[x.day + '|' + x.ch] = 1; listFP.push({ kind: 'baseline', day: x.day, ch: x.ch }); } });
    P.other.forEach(function (x) { if (x.day <= D) { fpR[x.day + '|' + (x.ch || '전체')] = 1; listFP.push({ kind: x.kind, day: x.day, ch: x.ch || '전체' }); } });
    chg.fp = Object.keys(fpC).length; req.fp = Object.keys(fpR).length;
    chg.tn = D * NCH - exC - chg.tp - chg.fn - chg.fp; req.tn = D * (NCH + 1) - exR - req.tp - req.fn - req.fp;
    cell(day); cell(chg); cell(req);
    return { day: day, chg: chg, req: req, lateC: lateC, lateR: lateR, items: items, fp: listFP, G: G, D: D };
  }

  /* ---------- 3. 윌슨 구간 ---------- */
  function zOf(conf) { return MS.qinv((1 - conf) / 2); }
  function wilson(k, n, conf) {
    conf = conf == null ? 0.95 : conf; if (!n) return { p: NaN, lo: NaN, hi: NaN };
    var z = zOf(conf), p = k / n, den = 1 + z * z / n, ctr = (p + z * z / (2 * n)) / den, half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
    return { p: p, lo: Math.max(0, ctr - half), hi: Math.min(1, ctr + half), z: z };
  }
  function pool(cells) { var c = { tp: 0, fn: 0, fp: 0, tn: 0 }; cells.forEach(function (x) { c.tp += x.tp; c.fn += x.fn; c.fp += x.fp; c.tn += x.tn; }); return cell(c); }

  /* ---------- 4. 계획 모델과 sim-real gap ---------- */
  function planParams(sim) { var p = sim.params; return { CAP: p.CAP, TR: p.TR, CLEAN: p.CLEAN, TOSTK: p.TOSTK, REPAIR_MED: p.REPAIR_MED }; }
  function gapPaths(trans, par) {
    var CAP = par.CAP, TR = par.TR, CL = par.CLEAN, TS = par.TOSTK, RM = par.REPAIR_MED, st = {}, open = {}, paths = [], names = Object.create(null);
    trans.forEach(function (x) {
      if (x.entity !== 'mask') return;
      var id = x.id, o, rep;
      if (x.from === 'in_use' && (x.to === 'to_clean' || x.to === 'repair')) {
        rep = x.to === 'repair';
        var run = [], que = [], tra = [];
        Object.keys(st).forEach(function (k) {
          if (k === id) return; var q = st[k];
          if (q.s === 'cleaning') run.push(Math.max(x.t, q.t + CL));
          else if (q.s === 'clean_wait') que.push({ a: x.t, ord: q.t });
          else if (q.s === 'to_clean') tra.push({ a: q.t + TR, ord: q.t });
          else if (q.s === 'repair') tra.push({ a: q.t + TR + RM, ord: q.t });
        });
        var a0 = x.t + TR + (rep ? RM : 0), items = que.concat(tra).concat([{ a: a0, ord: 1e12, own: 1 }]).sort(function (p, q) { return p.a - q.a || p.ord - q.ord; });
        var free = run.slice(), start0 = null; while (free.length < CAP) free.push(x.t);
        items.forEach(function (it) { free.sort(function (p, q) { return p - q; }); var s = Math.max(it.a, free[0]); free[0] = s + CL; if (it.own) start0 = s; });
        o = { id: id, rep: rep, t0: x.t, v1: x.t + TR + (rep ? RM + CL : CL + TS), v2: start0 + CL + (rep ? 0 : TS), wait: 0, held: 0, tl: [] };
        open[id] = o; paths.push(o);
      }
      o = open[id];
      if (o) {
        if (x.from === 'clean_wait' && x.to === 'cleaning') o.wait = x.t - st[id].t;
        if (x.from === 'held' && x.to === 'to_stock') o.held = x.t - st[id].t;
        o.tl.push(x.t);
        if (x.to === 'stock') { o.act = x.t; delete open[id]; }
      }
      st[id] = { s: x.to, t: x.t };
    });
    return paths.filter(function (p) { return p.act != null; });
  }
  function gapStats(paths, key) {
    var g = paths.map(function (p) { return p[key] - p.act; }), ab = g.map(Math.abs);
    return { n: g.length, bias: mean(g), sd: sd(g), q50: quantile(ab, 0.5), q90: quantile(ab, 0.9), q99: quantile(ab, 0.99) };
  }
  function gapSeed(seed) {
    var sim = seed == null ? MS.simulateLoss({ trace: true }) : MS.simulateLoss({ trace: true, seed: seed }), par = planParams(sim), ps = gapPaths(sim.transitions, par);
    var nm = ps.filter(function (p) { return !p.rep; });
    return { seed: seed, days: sim.days, par: par, n: ps.length, nrep: ps.length - nm.length, s1: gapStats(ps, 'v1'), s2: gapStats(ps, 'v2'), n1: gapStats(nm, 'v1'), n2: gapStats(nm, 'v2'), paths: ps };
  }
  function slim(r) { return { seed: r.seed, n: r.n, nrep: r.nrep, s1: r.s1, s2: r.s2, n1: r.n1, n2: r.n2 }; }

  /* ---------- 5. 시드 1~200 모으기(조각 계산) ---------- */
  function sweepSync(from, to) { var out = []; for (var s = from; s <= to; s++) out.push(seedRaw(s)); return out; }
  function sweepAsync(n, step, done, tick) {
    var out = [], s = 1;
    (function loop() { if (s > n) { done(out); return; } out.push(seedRaw(s)); if (tick) tick(s, n); s++; setTimeout(loop, 0); })();
  }
  function gapSweepAsync(n, done, tick) {
    var out = [], s = 1;
    (function loop() { if (s > n) { done(out); return; } out.push(slim(gapSeed(s))); if (tick) tick(s, n); s++; setTimeout(loop, 0); })();
  }

  /* ---------- 6. CSV 줄(대표 시드): 에이전트 행동 기록과 사람 결론 ---------- */
  function logRows(raw) {
    var rows = [];
    POLS.forEach(function (p) {
      var P = raw.pol[p.id];
      for (var d = 1; d <= DAYS; d++) rows.push({ policy: p.id, day: d, event: 'day', chamber: '', detail: P.an[d - 1] ? 'analyzed' : 'stopped' });
      P.flags.forEach(function (x) { rows.push({ policy: p.id, day: x.day, event: 'flag', chamber: x.ch, detail: '' }); });
      P.base.forEach(function (x) { rows.push({ policy: p.id, day: x.day, event: 'request', chamber: x.ch, detail: 'baseline' }); });
      P.other.forEach(function (x) { rows.push({ policy: p.id, day: x.day, event: 'request', chamber: x.ch || '', detail: x.kind }); });
    });
    return rows;
  }
  function labelRows(raw) {
    var rows = [];
    raw.fault.forEach(function (f, i) { if (f) rows.push({ kind: 'fault', day: i + 1, chamber: '', value: raw.kinds[i].join('+') }); });
    raw.swaps.forEach(function (s) { rows.push({ kind: 'swap', day: s.day, chamber: s.ch, value: s.eff.toFixed(6) }); });
    return rows;
  }

  return { POLS: POLS, UNITS: UNITS, DAYS: DAYS, CH: CH, NCH: NCH, DELTA_H: DELTA_H, G0: G0, SEEDS: SEEDS, GAP_SEEDS: GAP_SEEDS, REP: REP,
    rawOf: rawOf, seedRaw: seedRaw, evalRaw: evalRaw, wilson: wilson, pool: pool, zOf: zOf, planParams: planParams, gapPaths: gapPaths, gapStats: gapStats, gapSeed: gapSeed, slim: slim,
    sweepSync: sweepSync, sweepAsync: sweepAsync, gapSweepAsync: gapSweepAsync, logRows: logRows, labelRows: labelRows, quantile: quantile, mean: mean, sd: sd };
});
