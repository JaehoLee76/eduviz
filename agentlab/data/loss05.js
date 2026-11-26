/* Loss05 — 단계 5(생산 Loss) 실험실의 계산 모듈. 0501(분류 체계와 파레토)이 쓰고 0502·0503 도 이어 쓴다.
 * 브라우저: mfgsim.js 다음에 <script src="loss05.js"> → window.Loss05      node: require('./loss05.js')
 * simulateLoss 가 만든 Loss 사건(reason=직접 사유, root_cause=근본 원인, caused_by_block=원인 블록)을 읽어 집계만 한다.
 * 0501 부분은 난수·시각 함수 없음(0502 의 S16 은 mfgsim 의 hashSeed/rng 만 빌려 쓴다). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 페이지의 Python 이 CSV 에서 독립으로 다시 구현하고 verify.py 가 대조한다. */
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

  /* ============================================================
   * 0502 — Loss 연쇄와 가짜 상관. 날별 건수·분산/평균·상관·포아송 비율 검정·연쇄 확인(A: simulateLoss 기록)과
   * 새 시나리오 S16 '공통 추세'(가상 램프업 라인 90일 · 새 난수 줄기 hashSeed('S16', 시드, 줄기)).
   * 0501 의 계산은 한 줄도 바꾸지 않는다. 아래는 전부 새 함수다.
   * ============================================================ */
  var DAY_MIN = 1440;
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function variance(a) { var m = mean(a), s = 0, i; for (i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return s / (a.length - 1); }   // 표본 분산(n−1)
  function corr(a, b) {
    var ma = mean(a), mb = mean(b), s = 0, x = 0, y = 0, i;
    for (i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); x += (a[i] - ma) * (a[i] - ma); y += (b[i] - mb) * (b[i] - mb); }
    return s / Math.sqrt(x * y);
  }
  /* corr(a[t], b[t+lag]) — a 가 먼저, b 가 lag 칸 뒤. lag 0 이면 같은 날(시) 상관 */
  function lagCorr(a, b, lag) {
    var A = [], B = [], t;
    for (t = 0; t < a.length; t++) if (t + lag >= 0 && t + lag < b.length) { A.push(a[t]); B.push(b[t + lag]); }
    return corr(A, B);
  }
  /* 날 번호(0,1,2,…)에 대한 직선을 뺀 잔차 */
  function detrend(y) {
    var n = y.length, mt = (n - 1) / 2, my = mean(y), sxy = 0, sxx = 0, i;
    for (i = 0; i < n; i++) { sxy += (i - mt) * (y[i] - my); sxx += (i - mt) * (i - mt); }
    var b = sxy / sxx; return y.map(function (v, k) { return v - my - b * (k - mt); });
  }
  function detrendedCorr(a, b) { return corr(detrend(a), detrend(b)); }
  /* 건수 ÷ 노출량 × 1000 */
  function ratePerExposure(counts, expo) { return counts.map(function (k, i) { return 1000 * k / expo[i]; }); }
  /* 분산/평균. 노출량을 주면 노출량에 비례하는 기대치로 본 값: Σ(k−μ)²/μ ÷ (n−1), μ = 노출량 × (건수 합 ÷ 노출량 합) */
  function dispersion(counts, expo) {
    var m = mean(counts);
    if (!expo) return { mean: m, var: variance(counts), ratio: variance(counts) / m };
    var K = 0, E = 0, i; for (i = 0; i < counts.length; i++) { K += counts[i]; E += expo[i]; }
    var s = 0; for (i = 0; i < counts.length; i++) { var mu = expo[i] * K / E; s += (counts[i] - mu) * (counts[i] - mu) / mu; }
    return { mean: m, var: variance(counts), ratio: s / (counts.length - 1) };
  }
  /* 포아송 확률 P(K=k) = μ^k e^−μ / k! (로그로 계산) */
  function lgamma(x) {     // 로그 감마(란초스 근사, 상대 오차 1e-9 수준)
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t); var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x);
  }
  function poissonPmf(k, mu) { return Math.exp(k * Math.log(mu) - mu - lgamma(k + 1)); }
  function binomPmf(k, n, p) { if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0; return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)); }
  /* 두 기간의 건수 k1,k2 와 노출량 n1,n2 로 '비율이 같다'를 본다.
   * 비율이 같으면 합 K=k1+k2 건 가운데 앞 기간에 떨어진 수 k1 은 이항 Bin(K, n1/(n1+n2)). 정확 양쪽 p 값 = 확률이 관측값 이하인 모든 결과의 확률 합(scipy.stats.binomtest 와 같은 규칙).
   * 같이 정규 근사 z = (k1 − Kπ) / √(Kπ(1−π)) 도 낸다. */
  function poissonRateTest(k1, n1, k2, n2) {
    var K = k1 + k2, pi = n1 / (n1 + n2), p0 = binomPmf(k1, K, pi), p = 0, i, tol = 1 + 1e-7;
    for (i = 0; i <= K; i++) { var q = binomPmf(i, K, pi); if (q <= p0 * tol) p += q; }
    if (p > 1) p = 1;
    var z = (K > 0 && pi > 0 && pi < 1) ? (k1 - K * pi) / Math.sqrt(K * pi * (1 - pi)) : 0;
    return { k1: k1, n1: n1, k2: k2, n2: n2, K: K, pi: pi, r1: k1 / n1, r2: k2 / n2, ratio: (k2 / n2) / (k1 / n1), p: p, z: z };
  }
  /* A: 사건 → 날별 건수 */
  function dailyCounts(ev, code, days, by) {
    var c = []; for (var d = 0; d < days; d++) c.push(0);
    ev.forEach(function (e) { if (e[by || 'reason'] === code) { var d2 = Math.floor(e.start_min / DAY_MIN); if (d2 >= 0 && d2 < days) c[d2]++; } });
    return c;
  }
  function hourlyCounts(ev, code, hours) {
    var c = []; for (var h = 0; h < hours; h++) c.push(0);
    ev.forEach(function (e) { if (e.reason === code) { var h2 = Math.floor(e.start_min / 60); if (h2 >= 0 && h2 < hours) c[h2]++; } });
    return c;
  }
  /* 시간별 표(hourly)를 날별로 더한다 */
  function dailySum(hourly, key, days) { var o = []; for (var d = 0; d < days; d++) { var s = 0; for (var h = 0; h < 24; h++) s += hourly[d * 24 + h][key]; o.push(s); } return o; }
  /* A: 연쇄 확인. child 코드의 사건 가운데 근본 원인이 다른 코드인 것(파생 사건)을 근본 사건에 잇는다.
   * 근본 사건 = 원인 블록에서 근본 원인 코드로 일어난 자기 원인 사건(reason = root_cause = 그 코드) 가운데
   *   파생 사건이 시작할 때 이미 시작했고 아직 안 끝난 것 중 가장 늦게 시작한 것(같으면 사건 번호가 앞선 것). */
  function linkRoot(ev, d, byBlock) {
    var best = null, list = byBlock[d.caused_by_block + '|' + d.root_cause] || [], i;
    for (i = 0; i < list.length; i++) { var r = list[i]; if (r.start_min <= d.start_min && r.end_min > d.start_min && (!best || r.start_min > best.start_min || (r.start_min === best.start_min && r.event_id < best.event_id))) best = r; }
    return best;
  }
  function selfIndex(ev) {
    var ix = {}; ev.forEach(function (e) { if (e.reason === e.root_cause) { var k = e.block + '|' + e.reason; (ix[k] || (ix[k] = [])).push(e); } }); return ix;
  }
  function chainCheck(ev, child) {
    var ix = selfIndex(ev), all = ev.filter(function (e) { return e.reason === child; });
    var der = all.filter(function (e) { return e.root_cause !== child; });
    var byRoot = {}, delays = [], per = {}, linked = 0, gl = 0;
    der.forEach(function (d) {
      var a = byRoot[d.root_cause] || (byRoot[d.root_cause] = { code: d.root_cause, n: 0, glass: 0 }); a.n++; a.glass += d.loss_glass; gl += d.loss_glass;
      var r = linkRoot(ev, d, ix);
      if (r) { linked++; delays.push(d.start_min - r.start_min); per[r.event_id] = (per[r.event_id] || 0) + 1; }
    });
    var roots = {}; der.forEach(function (d) { roots[d.root_cause] = 1; });
    var rootEv = ev.filter(function (e) { return e.reason === e.root_cause && roots[e.reason]; });
    var hist = {}; rootEv.forEach(function (r) { var k = per[r.event_id] || 0; hist[k] = (hist[k] || 0) + 1; });
    var rows = Object.keys(byRoot).map(function (k) { var a = byRoot[k]; a.share = a.n / der.length; a.gshare = a.glass / gl; return a; });
    rows.sort(function (a, b) { return b.n - a.n || (a.code < b.code ? -1 : 1); });
    var dl = delays.slice().sort(function (a, b) { return a - b; });
    var perVals = rootEv.map(function (r) { return per[r.event_id] || 0; });
    return { child: child, nAll: all.length, nDerived: der.length, nLinked: linked, byRoot: rows, delays: dl, nRoots: rootEv.length, perRoot: perVals,
             delayQ: dl.length ? [dl[0], quantile(dl, 0.25), quantile(dl, 0.5), quantile(dl, 0.75), dl[dl.length - 1]] : [], zeroShare: dl.length ? dl.filter(function (x) { return x === 0; }).length / dl.length : 0,
             hist: hist, rootsUsed: Object.keys(per).length };
  }
  /* 근본 원인 코드마다: 자기 원인 사건(근본 사건) 수, 그 코드가 근본 원인인데 직접 사유가 다른 파생 사건 수와 잃은 장수 */
  function fanOut(ev) {
    var o = {};
    ev.forEach(function (e) {
      var a = o[e.root_cause] || (o[e.root_cause] = { code: e.root_cause, roots: 0, derived: 0, glassDerived: 0 });
      if (e.reason === e.root_cause) a.roots++; else { a.derived++; a.glassDerived += e.loss_glass; }
    });
    return Object.keys(o).map(function (k) { var a = o[k]; a.per = a.roots ? a.derived / a.roots : 0; return a; }).sort(function (a, b) { return b.derived - a.derived || (a.code < b.code ? -1 : 1); });
  }
  /* 근본 사건 단위로 센 날별 건수: 파생 사건이 이은 근본 사건(중복 없이)을 근본 사건의 시작일에 센다 */
  function rootUnitDaily(ev, child, days) {
    var ix = selfIndex(ev), seen = {}, c = []; for (var d = 0; d < days; d++) c.push(0);
    ev.forEach(function (e) {
      if (e.reason === child && e.root_cause !== child) { var r = linkRoot(ev, e, ix); if (r && !seen[r.event_id]) { seen[r.event_id] = 1; var d2 = Math.floor(r.start_min / DAY_MIN); if (d2 >= 0 && d2 < days) c[d2]++; } }
    });
    return c;
  }

  /* ---------- S16 '공통 추세' ---------- */
  var S16 = {
    DAYS: 90, HALF: 45, SEEDS: 200, N0: 400, SLOPE: 12, SD_N: 30,        // 투입 유리 수 N(t) = N0 + SLOPE·t + 잡음(sd SD_N), 하루 장수
    LAM_X: 18, LAM_Y: 15, P_CHAIN: 0.4, GLASS_PER_EVENT: 50,             // 1000장당 건수 비율(X·Y), X 한 건이 다음 날 Z 를 하나 더 낳을 확률, Loss 한 건당 잃은 유리(가정)
    CODES: { X: 'VX-JAM', Y: 'VY-SRC', Z: 'VZ-RETRY' },
    KO: { 'VX-JAM': '반송 걸림 — 가상 라인에서 유리 반송 중 걸려 서는 일', 'VY-SRC': '증발원 경보 — 가상 라인에서 증발원 상태 경보로 서는 일', 'VZ-RETRY': '재투입 지연 — 반송 걸림 다음 날 다시 넣느라 서는 일' }
  };
  function pdraw(r, mu) { var u = r.u(), k = 0, p = Math.exp(-mu), c = p; while (u > c && k < 1000) { k++; p *= mu / k; c += p; } return k; }
  /* 시드 하나: 난수 줄기 넷(N·X·Y·Z)을 따로 쓴다. X·Y 는 서로 읽지 않는다 — 원인 관계 없음. Z 는 전날 X 한 건마다 확률 P_CHAIN 으로 하나. */
  function s16Gen(seed, xCut) {   // xCut: 반사실 — X 의 평균만 (1−xCut) 배로 줄여 같은 난수로 다시 만든다(Y 줄기는 X 를 읽지 않으므로 그대로)
    var rn = MS.rng(MS.hashSeed('S16', seed, 'N')), rx = MS.rng(MS.hashSeed('S16', seed, 'X')), ry = MS.rng(MS.hashSeed('S16', seed, 'Y')), rz = MS.rng(MS.hashSeed('S16', seed, 'Z'));
    var N = [], X = [], Y = [], Z = [], t, i;
    for (t = 0; t < S16.DAYS; t++) {
      var n = Math.round(S16.N0 + S16.SLOPE * t + rn.normal(0, S16.SD_N));
      N.push(n); X.push(pdraw(rx, S16.LAM_X * n / 1000 * (1 - (xCut || 0)))); Y.push(pdraw(ry, S16.LAM_Y * n / 1000));
      var z = 0; if (t > 0) for (i = 0; i < X[t - 1]; i++) if (rz.u() < S16.P_CHAIN) z++;
      Z.push(z);
    }
    return { seed: seed, N: N, X: X, Y: Y, Z: Z };
  }
  function sum(a, lo, hi) { var s = 0; for (var i = lo == null ? 0 : lo; i < (hi == null ? a.length : hi); i++) s += a[i]; return s; }
  function ratio(a, N) { return a.map(function (v, i) { return v / N[i]; }); }
  /* 시드 하나의 지표들 */
  function s16Metrics(g) {
    var N = g.N, X = g.X, Y = g.Y, Z = g.Z, H = S16.HALF, n = S16.DAYS, rx = ratio(X, N), ry = ratio(Y, N), rz = ratio(Z, N), m = {};
    m.xy_raw = corr(X, Y); m.xy_ratio = corr(rx, ry); m.xy_resid = detrendedCorr(X, Y);
    m.xz_same = corr(X, Z); m.xz_lag = lagCorr(X, Z, 1); m.xz_lag_ratio = lagCorr(rx, rz, 1); m.xz_lag_resid = corr(detrend(X).slice(0, n - 1), detrend(Z).slice(1)); m.xz_same_ratio = corr(rx, rz); m.xz_same_resid = detrendedCorr(X, Z);
    m.y_disp_raw = dispersion(Y).ratio; m.y_disp_expo = dispersion(Y, N).ratio; m.x_disp_raw = dispersion(X).ratio; m.x_disp_expo = dispersion(X, N).ratio;
    var k1 = sum(X, 0, H), k2 = sum(X, H, n), n1 = sum(N, 0, H), n2 = sum(N, H, n);
    m.p_plain = poissonRateTest(k1, H, k2, n - H).p; m.p_expo = poissonRateTest(k1, n1, k2, n2).p;
    return m;
  }
  /* 시드 목록 → 지표 목록, 지표별 값 목록 */
  function s16Run(seeds) { var out = []; for (var i = 0; i < seeds.length; i++) { var g = s16Gen(seeds[i]); out.push({ g: g, m: s16Metrics(g) }); } return out; }
  var S16_REP_KEYS = ['xy_raw', 'xy_ratio', 'xz_lag', 'y_disp_raw'];       // 대표 시드를 고르는 지표 넷
  /* 대표 시드: 지표 넷의 백분위(%)에서 50 을 뺀 절댓값의 합이 가장 작은 시드(같으면 시드 번호가 작은 쪽) */
  function s16Rep(runs) {
    var best = null;
    runs.forEach(function (r) {
      var sc = 0, pcs = {};
      S16_REP_KEYS.forEach(function (k) { var vals = runs.map(function (q) { return q.m[k]; }); var pc = 100 * percentile(vals, r.m[k]); pcs[k] = pc; sc += Math.abs(pc - 50); });
      if (!best || sc < best.score - 1e-12) best = { seed: r.g.seed, score: sc, pcs: pcs };
    });
    return best;
  }
  function s16Rows(g) { return g.N.map(function (n, t) { return { day: t + 1, glass_in: n, vx_jam: g.X[t], vy_src: g.Y[t], vz_retry: g.Z[t] }; }); }

  return {
    DEFAULT_SEED: DEFAULT_SEED, DAYS: DAYS, SEEDS: SEEDS, WEEK_MIN: WEEK_MIN, CODES: CODES, CAT_ORDER: CAT_ORDER, BLOCKS: BLOCKS, N_TURN: N_TURN, METRICS: METRICS,
    info: info, catOf: catOf, pareto: pareto, paretoWith: paretoWith, fold: fold, barsFor: barsFor, cross: cross, reattribute: reattribute,
    codeSystem: codeSystem, weekly: weekly, seedRun: seedRun, seedRows: seedRows, quantile: quantile, percentile: percentile, rankStab: rankStab, rankOne: rankOne,
    shareOf: shareOf, blockTable: blockTable, otherShare: otherShare, chain: chain, tasks: tasks,
    /* 0502 */
    DAY_MIN: DAY_MIN, S16: S16, mean: mean, variance: variance, corr: corr, lagCorr: lagCorr, detrend: detrend, detrendedCorr: detrendedCorr, ratePerExposure: ratePerExposure,
    dispersion: dispersion, poissonPmf: poissonPmf, binomPmf: binomPmf, poissonRateTest: poissonRateTest, dailyCounts: dailyCounts, hourlyCounts: hourlyCounts, dailySum: dailySum,
    chainCheck: chainCheck, rootUnitDaily: rootUnitDaily, fanOut: fanOut, s16Gen: s16Gen, s16Metrics: s16Metrics, s16Run: s16Run, s16Rep: s16Rep, s16Rows: s16Rows, S16_REP_KEYS: S16_REP_KEYS
  };
});
