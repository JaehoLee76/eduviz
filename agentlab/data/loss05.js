/* Loss05 — 단계 5(생산 Loss) 실험실의 계산 모듈. 0501(분류 체계와 파레토)이 쓰고 0502·0503 도 이어 쓴다.
 * 브라우저: mfgsim.js 다음에 <script src="loss05.js"> → window.Loss05      node: require('./loss05.js')
 * simulateLoss 가 만든 Loss 사건(reason=직접 사유, root_cause=근본 원인, caused_by_block=원인 블록)을 읽어 집계만 한다.
 * 난수·시각 함수 없음. mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 페이지의 Python 이 CSV 에서 독립으로 다시 구현하고 verify.py 가 대조한다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'));
  else root.Loss05 = factory(root.MfgSim);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS) {
  'use strict';
  var DEFAULT_SEED = 20261011, DAYS = 60, SEEDS = 40, WEEK_MIN = 10080;
  var CODES = MS.LOSS_CODES.concat(['LB-LINE']);
  var CAT_ORDER = ['설비', '품질', '물류', '세정', '운영', '라인'];
  var BLOCKS = MS.BLOCKS;
  var N_TURN = MS.CFG.N_TURN;

  /* ---------- 코드 설명(모듈에서 읽는다) ---------- */
  function info(code) { var m = MS.LOSS_META[code]; return { code: code, cat: m ? m[0] : '기타', ko: m ? m[1] : code }; }
  function catOf(code) { return info(code).cat; }

  /* ---------- 일반 집계 ---------- */
  function val(e, v) { return v === 'min' ? e.loss_chamber_min : e.loss_glass; }
  var LABELS = {
    reason: function (e) { return e.reason; },
    root_cause: function (e) { return e.root_cause; },
    caused_by_block: function (e) { return e.caused_by_block; },
    block: function (e) { return e.block; },
    cat_reason: function (e) { return catOf(e.reason); },
    cat_root: function (e) { return catOf(e.root_cause); }
  };
  /* label: 사건 → 이름. value: 'glass'(기본) | 'min'. 큰 순(같으면 이름 순) */
  function paretoWith(ev, label, value) {
    var acc = {}, total = 0, i, k;
    for (i = 0; i < ev.length; i++) {
      var key = label(ev[i]), v = val(ev[i], value);
      var a = acc[key] || (acc[key] = { key: key, n: 0, v: 0 }); a.n++; a.v += v; total += v;
    }
    var items = []; for (k in acc) items.push(acc[k]);
    items.sort(function (a, b) { return b.v - a.v || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0); });
    var cum = 0;
    items.forEach(function (it) { cum += it.v; it.share = total ? it.v / total : 0; it.cum = total ? cum / total : 0; });
    return { total: total, n: ev.length, items: items };
  }
  function pareto(ev, by, value) { return paretoWith(ev, LABELS[by], value); }

  /* 몫이 문턱(비율)보다 작은 막대를 '기타' 하나로 묶는다(기타는 맨 뒤) */
  function fold(par, thr) {
    if (!(thr > 0)) return par;
    var keep = [], oth = { key: '기타', n: 0, v: 0 };
    par.items.forEach(function (it) { if (it.share < thr) { oth.n += it.n; oth.v += it.v; } else keep.push({ key: it.key, n: it.n, v: it.v }); });
    if (oth.n) keep.push(oth);
    var cum = 0;
    keep.forEach(function (it) { cum += it.v; it.share = par.total ? it.v / par.total : 0; it.cum = par.total ? cum / par.total : 0; });
    return { total: par.total, n: par.n, items: keep };
  }
  /* 누적 비율이 q 이상이 되는 데 필요한 막대 수 */
  function barsFor(par, q) { for (var i = 0; i < par.items.length; i++) if (par.items[i].cum >= q - 1e-12) return i + 1; return par.items.length; }

  /* ---------- 직접 × 근본 교차표(장수) ---------- */
  function cross(ev) {
    var dp = pareto(ev, 'reason'), rp = pareto(ev, 'root_cause');
    var rows = dp.items.map(function (x) { return x.key; }), cols = rp.items.map(function (x) { return x.key; });
    var m = rows.map(function () { return cols.map(function () { return 0; }); });
    ev.forEach(function (e) { m[rows.indexOf(e.reason)][cols.indexOf(e.root_cause)] += e.loss_glass; });
    return { rows: rows, cols: cols, m: m, rowTot: dp.items.map(function (x) { return x.v; }), colTot: rp.items.map(function (x) { return x.v; }), total: dp.total };
  }

  /* ---------- 재귀속: 직접 사유 하나를 근본 원인별로 나눈 몫 ---------- */
  function reattribute(ev, directCode) { return pareto(ev.filter(function (e) { return e.reason === directCode; }), 'root_cause'); }

  /* ---------- 코드 합치기·나누기: 근본 원인 파레토에 코드 체계를 입힌다 ----------
   * merges: [{name, codes:[..]}]  — codes 에 든 근본 원인 코드를 name 하나로 합친다
   * split : 코드 목록 또는 '*' — 그 코드를 원인 블록별(코드@블록)로 나눈다(합친 이름은 나누지 않음) */
  function codeSystem(ev, merges, split, thr, value) {
    var map = {}; (merges || []).forEach(function (g) { g.codes.forEach(function (c) { map[c] = g.name; }); });
    var par = paretoWith(ev, function (e) {
      var c = e.root_cause;
      if (map[c]) return map[c];
      if (split === '*' || (split && split.indexOf(c) >= 0)) return c + '@' + e.caused_by_block;
      return c;
    }, value);
    return fold(par, thr || 0);
  }

  /* ---------- 주 단위: 시작 시각이 속한 주(0 = 첫 월요일부터). 끝에 남는 일곱 일 미만은 뺀다 ---------- */
  function weekly(ev, days, by) {
    var nw = Math.floor(days * 1440 / WEEK_MIN), out = [];
    for (var w = 0; w < nw; w++) {
      var part = ev.filter(function (e) { return Math.floor(e.start_min / WEEK_MIN) === w; });
      out.push({ week: w, par: pareto(part, by) });
    }
    return out;
  }

  /* ---------- 시드 하나의 요약(사건은 버리고 코드별 합만 남긴다) ---------- */
  function sumByCode(ev, by) {
    var o = {};
    ev.forEach(function (e) { var k = e[by], a = o[k] || (o[k] = { n: 0, glass: 0, min: 0 }); a.n++; a.glass += e.loss_glass; a.min += e.loss_chamber_min; });
    return o;
  }
  function seedRun(seed, days) {
    var sim = MS.simulateLoss(seed === DEFAULT_SEED ? { days: days || DAYS } : { seed: seed, days: days || DAYS });
    var tot = 0, oth = 0;
    sim.events.forEach(function (e) { tot += e.loss_glass; if (e.caused_by_block !== e.block) oth += e.loss_glass; });
    return { seed: seed, days: days || DAYS, total: tot, other: oth, direct: sumByCode(sim.events, 'reason'), root: sumByCode(sim.events, 'root_cause') };
  }
  /* 요약 목록 → CSV 행(seed, kind, code, n, glass, min) */
  function seedRows(list) {
    var rows = [];
    list.forEach(function (r) {
      ['direct', 'root'].forEach(function (kind) {
        Object.keys(r[kind]).sort().forEach(function (code) { var a = r[kind][code]; rows.push({ seed: r.seed, kind: kind, code: code, n: a.n, glass: a.glass, min: a.min }); });
      });
    });
    return rows;
  }

  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }
  function percentile(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-9) lt++; else if (Math.abs(x - v) <= 1e-9) eq++; }); return (lt + eq / 2) / vals.length; }

  /* ---------- 순위 흔들림: 시드 목록(요약)에서 코드마다 순위 분포와 1위 비율 ----------
   * 순위는 모든 시드에 나온 코드 전체에서 매긴다(없으면 0장 — 맨 뒤쪽). 같은 장수는 코드 이름 순. */
  function rankStab(list, kind) {
    var codes = {}; list.forEach(function (r) { Object.keys(r[kind]).forEach(function (c) { codes[c] = 1; }); });
    var all = Object.keys(codes).sort();
    var ranks = {}, shares = {}; all.forEach(function (c) { ranks[c] = []; shares[c] = []; });
    list.forEach(function (r) {
      var tot = 0; all.forEach(function (c) { tot += r[kind][c] ? r[kind][c].glass : 0; });
      var ord = all.slice().sort(function (a, b) { var ga = r[kind][a] ? r[kind][a].glass : 0, gb = r[kind][b] ? r[kind][b].glass : 0; return gb - ga || (a < b ? -1 : a > b ? 1 : 0); });
      ord.forEach(function (c, i) { ranks[c].push(i + 1); shares[c].push((r[kind][c] ? r[kind][c].glass : 0) / tot); });
    });
    var n = list.length;
    var out = all.map(function (c) {
      var rk = ranks[c], sh = shares[c];
      return { code: c, top1: rk.filter(function (x) { return x === 1; }).length / n, top3: rk.filter(function (x) { return x <= 3; }).length / n,
               r25: quantile(rk, 0.25), r50: quantile(rk, 0.5), r75: quantile(rk, 0.75), rmin: Math.min.apply(null, rk), rmax: Math.max.apply(null, rk),
               s10: quantile(sh, 0.1), s25: quantile(sh, 0.25), s50: quantile(sh, 0.5), s75: quantile(sh, 0.75), s90: quantile(sh, 0.9), shares: sh, ranks: rk };
    });
    out.sort(function (a, b) { return b.top1 - a.top1 || a.r50 - b.r50 || b.s50 - a.s50 || (a.code < b.code ? -1 : 1); });
    return { n: n, codes: out };
  }
  /* 한 시드의 순위(rankStab 과 같은 규칙) */
  function rankOne(r, kind, universe) {
    var ord = universe.slice().sort(function (a, b) { var ga = r[kind][a] ? r[kind][a].glass : 0, gb = r[kind][b] ? r[kind][b].glass : 0; return gb - ga || (a < b ? -1 : a > b ? 1 : 0); });
    var o = {}; ord.forEach(function (c, i) { o[c] = i + 1; }); return o;
  }
  function shareOf(r, kind, code) { var tot = 0, k; for (k in r[kind]) tot += r[kind][k].glass; return (r[kind][code] ? r[kind][code].glass : 0) / tot; }
  /* 시드마다 한 값씩 나오는 지표(대표 시드의 백분위를 재는 데 쓴다) */
  var METRICS = [
    { id: 'rootTop', name: '근본 원인 1위의 몫', f: function (r) { var t = 0, m = 0, k; for (k in r.root) { t += r.root[k].glass; if (r.root[k].glass > m) m = r.root[k].glass; } return m / t; } },
    { id: 'rootGap', name: '근본 원인 1위와 2위의 몫 차(%p)', f: function (r) { var v = Object.keys(r.root).map(function (k) { return r.root[k].glass; }).sort(function (a, b) { return b - a; }), t = v.reduce(function (a, b) { return a + b; }, 0); return (v[0] - (v[1] || 0)) / t * 100; } },
    { id: 'pm', name: 'EQ-PM 의 근본 원인 몫', f: function (r) { return shareOf(r, 'root', 'EQ-PM'); } },
    { id: 'mask', name: 'Q-MASK 의 근본 원인 몫', f: function (r) { return shareOf(r, 'root', 'Q-MASK'); } },
    { id: 'lb', name: 'LB-LINE 의 직접 사유 몫', f: function (r) { return shareOf(r, 'direct', 'LB-LINE'); } },
    { id: 'bd', name: 'EQ-BD 의 근본 원인 몫', f: function (r) { return shareOf(r, 'root', 'EQ-BD'); } }
  ];

  /* ---------- 원인이 된 블록 표 ---------- */
  function blockTable(ev) {
    var t = BLOCKS.map(function (b) { return { block: b, lost: 0, lostByOthers: 0, causedOthers: 0, self: 0 }; });
    var ix = {}; BLOCKS.forEach(function (b, i) { ix[b] = i; });
    ev.forEach(function (e) {
      var v = e.loss_glass, a = t[ix[e.block]], c = t[ix[e.caused_by_block]];
      a.lost += v;
      if (e.caused_by_block !== e.block) { a.lostByOthers += v; c.causedOthers += v; } else a.self += v;
    });
    var tot = 0; t.forEach(function (r) { tot += r.lost; });
    t.forEach(function (r) { r.net = r.causedOthers - r.lostByOthers; r.shareLost = tot ? r.lost / tot : 0; });
    return { total: tot, rows: t };
  }
  /* 직접 사유별 '다른 블록 때문에 잃은 몫' */
  function otherShare(ev) {
    var tot = 0, oth = 0; ev.forEach(function (e) { tot += e.loss_glass; if (e.caused_by_block !== e.block) oth += e.loss_glass; });
    return { total: tot, other: oth, share: tot ? oth / tot : 0 };
  }

  /* ---------- 대표 사건 연쇄: 규칙 = 잃은 장수가 가장 큰 LB-LINE 사건 하나 + 같은 원인 블록의 근본 사건들 ---------- */
  function chain(ev) {
    var lb = null;
    ev.forEach(function (e) { if (e.reason === 'LB-LINE' && (!lb || e.loss_glass > lb.loss_glass || (e.loss_glass === lb.loss_glass && e.start_min < lb.start_min))) lb = e; });
    if (!lb) return null;
    var causes = ev.filter(function (e) { return e.block === lb.caused_by_block && e.reason === lb.root_cause && e.root_cause === lb.root_cause && e.start_min < lb.end_min && e.end_min > lb.start_min; });
    causes.sort(function (a, b) { return a.start_min - b.start_min; });
    return { lb: lb, causes: causes };
  }

  /* ---------- 성과 환산: 개선율 r 로 과제를 걸었을 때 고칠 수 있는 장수 ----------
   * A 증상 과제 = 직접 사유 1위(LB-LINE)에 걸었을 때. 한 과제가 닿는 곳은 그 사유의 근본 원인 하나뿐이라고 보고 가장 큰 근본 원인의 몫만 센다.
   * B 직접 사유 순위의 '자기 원인' 1위 = reason 과 root_cause 가 같은 사건만 모아 직접 사유로 센 1위.
   * C 근본 원인 1위 = 근본 원인으로 귀속한 장수(그 원인이 일으킨 다른 블록·다른 사유의 Loss 포함). */
  function tasks(ev) {
    var dp = pareto(ev, 'reason'), rp = pareto(ev, 'root_cause');
    var topD = dp.items[0], spread = reattribute(ev, topD.key);
    var self = pareto(ev.filter(function (e) { return e.reason === e.root_cause; }), 'reason');
    var rt = rp.items[0];
    var selfAll = pareto(ev, 'reason').items.filter(function (x) { return x.key === self.items[0].key; })[0];
    return {
      A: { code: topD.key, book: topD.v, reach: spread.items[0].v, reachCode: spread.items[0].key, nRoots: spread.items.length },
      B: { code: self.items[0].key, glass: selfAll ? selfAll.v : 0, selfGlass: self.items[0].v },
      C: { code: rt.key, glass: rt.v },
      total: rp.total
    };
  }

  return {
    DEFAULT_SEED: DEFAULT_SEED, DAYS: DAYS, SEEDS: SEEDS, WEEK_MIN: WEEK_MIN, CODES: CODES, CAT_ORDER: CAT_ORDER, BLOCKS: BLOCKS, N_TURN: N_TURN, METRICS: METRICS,
    info: info, catOf: catOf, pareto: pareto, paretoWith: paretoWith, fold: fold, barsFor: barsFor, cross: cross, reattribute: reattribute,
    codeSystem: codeSystem, weekly: weekly, seedRun: seedRun, seedRows: seedRows, quantile: quantile, percentile: percentile, rankStab: rankStab, rankOne: rankOne,
    shareOf: shareOf, blockTable: blockTable, otherShare: otherShare, chain: chain, tasks: tasks
  };
});
