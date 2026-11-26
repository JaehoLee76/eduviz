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

  /* ============================================================
   * 0503 — Loss 예측. (A) 라인 수준: 시간별 상태·사건 기록으로 '다음 H 시간 안에 시작하는 사건의 잃은 유리 장수'를 맞힌다.
   *        (B) 제품 공정 추적: simulateLoss({trace:true}).transitions 의 마스크 사용 이력으로 결함 위험 순위를 매긴다.
   * 0501·0502 의 계산은 한 줄도 바꾸지 않는다. 아래는 전부 새 함수이며 난수·시각 함수를 쓰지 않는다(섞어 나누기는 번호의 정수 해시).
   * ============================================================ */
  var F5 = { H: 24, SPLIT: 40, DEPTH: 3, MINLEAF: 20, ORIGIN0: 48, K: 0.1, BINS: 5, SEEDS: 40, HMIN: 6, HMAX: 48, SHUF: 3, SHUF_MUL: 2654435761 };
  /* 근본 원인 묶음(목표를 갈라 보는 칸). fault = 수명이 우연으로 정해지는 사건(고장·증착기 불량), other = 나머지 */
  var G5 = [
    { id: 'pm', ko: '정규 PM', codes: ['EQ-PM'] },
    { id: 'mask', ko: '마스크 불량', codes: ['Q-MASK'] },
    { id: 'fault', ko: '고장 계열', codes: ['EQ-BD', 'Q-EVAP'] },
    { id: 'other', ko: '그 밖', codes: null }
  ];
  function group5(code) { for (var i = 0; i < G5.length - 1; i++) if (G5[i].codes.indexOf(code) >= 0) return i; return G5.length - 1; }
  /* 특징표: avail = 그 값이 알려지는 시각(예측 시각 t 기준). before = t 이전, inside = 예측 구간 안, after = 구간이 끝난 뒤 */
  var FEAT5 = [
    { id: 'pm_due', ko: '다음 H 시간 안에 PM 주기가 오는 챔버 수', avail: 'before', note: '챔버마다 지난 PM 시작 + 추정 주기' },
    { id: 'l24_pm', ko: '지난 24 시간 끝난 사건 장수 — 근본 원인 PM', avail: 'before', note: '끝난 사건만' },
    { id: 'l24_mask', ko: '지난 24 시간 끝난 사건 장수 — 근본 원인 마스크', avail: 'before', note: '끝난 사건만' },
    { id: 'l24_fault', ko: '지난 24 시간 끝난 사건 장수 — 근본 원인 고장 계열', avail: 'before', note: '끝난 사건만' },
    { id: 'l24_other', ko: '지난 24 시간 끝난 사건 장수 — 그 밖', avail: 'before', note: '끝난 사건만' },
    { id: 'stocker_fill', ko: '직전 시간 stocker 채움', avail: 'before', note: '직전 시간 마지막 값' },
    { id: 'cleaner_queue', ko: '직전 시간 세정 대기', avail: 'before', note: '직전 시간 마지막 값' },
    { id: 'cassette_free', ko: '직전 시간 빈 카세트', avail: 'before', note: '직전 시간 마지막 값' },
    { id: 'blocks_triple', ko: '직전 시간 triple 운전 블록 수', avail: 'before', note: '직전 시간 마지막 값' },
    { id: 'line_out', ko: '직전 시간 라인 출력 장수', avail: 'before', note: '직전 시간 합' },
    { id: 'since_bd', ko: '마지막 고장 시작 뒤 경과 시간(시간)', avail: 'before', note: '라인 전체에서 가장 최근' },
    { id: 'since_ev', ko: '마지막 증착기 불량 시작 뒤 경과 시간(시간)', avail: 'before', note: '라인 전체에서 가장 최근' },
    { id: 'fut_triple', ko: '예측 구간 안 triple 운전 블록 수 평균', avail: 'inside', note: '구간이 지나야 알 수 있음', leak: true },
    { id: 'fut_pmshare', ko: '예측 구간 안 사건 중 근본 원인이 PM 인 비율', avail: 'after', note: '근본 원인 칸은 사건이 끝난 뒤에 채워짐', leak: true }
  ];
  var NLEG5 = 12;

  function prefix5(a) { var p = [0], i; for (i = 0; i < a.length; i++) p.push(p[i] + a[i]); return p; }
  function ps5(p, a, b) { return p[b] - p[a]; }
  /* 시간 칸별 합 → 누적합. S = 시작 시간 칸, E = 끝난 시간 칸(올림: 끝 시각이 정각이면 그 정각 칸) */
  function pre5(sim) {
    var ev = sim.events, hr = sim.hourly, n = hr.length, ng = G5.length, i, g;
    var S = [], E = [], St = new Array(n).fill(0), Et = new Array(n).fill(0), cnt = new Array(n).fill(0), cpm = new Array(n).fill(0);
    for (g = 0; g < ng; g++) { S.push(new Array(n).fill(0)); E.push(new Array(n).fill(0)); }
    ev.forEach(function (e) {
      var g2 = group5(e.root_cause), sb = Math.floor(e.start_min / 60), eb = Math.ceil(e.end_min / 60);
      if (sb >= 0 && sb < n) { S[g2][sb] += e.loss_glass; St[sb] += e.loss_glass; cnt[sb]++; if (e.root_cause === 'EQ-PM') cpm[sb]++; }
      if (eb >= 0 && eb < n) { E[g2][eb] += e.loss_glass; Et[eb] += e.loss_glass; }
    });
    var chm = {}, bd = [], evp = [];
    ev.forEach(function (e) {
      if (e.reason === 'EQ-PM' && e.root_cause === 'EQ-PM') { var k = e.block + '|' + e.chamber; (chm[k] || (chm[k] = [])).push(e.start_min); }
      if (e.reason === 'EQ-BD' && e.root_cause === 'EQ-BD') bd.push(e.start_min);
      if (e.reason === 'Q-EVAP' && e.root_cause === 'Q-EVAP') evp.push(e.start_min);
    });
    var keys = Object.keys(chm).sort(); keys.forEach(function (k) { chm[k].sort(function (a, b) { return a - b; }); });
    bd.sort(function (a, b) { return a - b; }); evp.sort(function (a, b) { return a - b; });
    return { n: n, hr: hr, S: S.map(prefix5), E: E.map(prefix5), St: prefix5(St), Et: prefix5(Et), cnt: prefix5(cnt), cpm: prefix5(cpm), tri: prefix5(hr.map(function (r) { return r.blocks_triple; })), chm: chm, keys: keys, bd: bd, evp: evp };
  }
  /* 학습 기간(시작 시각이 split 시간 이전)의 같은 챔버 PM 시작 간격 중앙값(분) */
  function pmPeriod5(P, splitMin) {
    var gaps = [];
    P.keys.forEach(function (k) { var a = P.chm[k]; for (var i = 1; i < a.length; i++) if (a[i] < splitMin) gaps.push(a[i] - a[i - 1]); });
    return gaps.length ? quantile(gaps, 0.5) : NaN;
  }
  function lastLE5(a, t) { var lo = 0, hi = a.length - 1, r = -1; while (lo <= hi) { var m = (lo + hi) >> 1; if (a[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }

  /* 데이터 집합: 예측 시각 t = 60h 분(h = ORIGIN0 … hours−H). 목표 y = t 이후 H 시간 안에 시작한 사건의 잃은 유리 합(걸친 사건도 시작 시각의 칸에 전부 넣음). */
  function build503(sim, H, splitDay) {
    var P = pre5(sim), n = P.n, hr = P.hr, ng = G5.length, splitH = splitDay * 24, period = pmPeriod5(P, splitH * 60);
    var rows = [], h, g, j;
    var h0 = Math.max(F5.ORIGIN0, Math.ceil(period / 60));   /* 추정 주기만큼의 처음 기간은 모든 챔버의 첫 PM 을 아직 못 봤으므로 뺀다 */
    for (h = h0; h + H <= n; h++) {
      var t = h * 60, X = [], due = 0;
      P.keys.forEach(function (k) { var a = P.chm[k], i = lastLE5(a, t); if (i >= 0) { var nx = a[i] + period; if (nx >= t && nx < t + H * 60) due++; } });
      X.push(due);
      for (g = 0; g < ng; g++) X.push(ps5(P.E[g], h - 23, h + 1));
      var r = hr[h - 1]; X.push(r.stocker_fill, r.cleaner_queue, r.cassette_free, r.blocks_triple, r.line_out);
      var ib = lastLE5(P.bd, t), ie = lastLE5(P.evp, t);
      X.push(ib >= 0 ? (t - P.bd[ib]) / 60 : t / 60, ie >= 0 ? (t - P.evp[ie]) / 60 : t / 60);
      var nc = ps5(P.cnt, h, h + H), npm = ps5(P.cpm, h, h + H);
      X.push(ps5(P.tri, h, h + H) / H, nc > 0 ? npm / nc : 0);
      var yg = []; for (g = 0; g < ng; g++) yg.push(ps5(P.S[g], h, h + H));
      var pg = []; for (g = 0; g < ng; g++) pg.push(ps5(P.E[g], h - H + 1, h + 1));
      rows.push({ h: h, X: X, y: ps5(P.St, h, h + H), yg: yg, pers: ps5(P.Et, h - H + 1, h + 1), persg: pg });
    }
    return { H: H, splitDay: splitDay, splitH: splitH, period: period, rows: rows, n: n };
  }

  /* ---------- 모델 ---------- */
  function mae5(y, p) { var s = 0; for (var i = 0; i < y.length; i++) s += Math.abs(y[i] - p[i]); return s / y.length; }
  function rmse5(y, p) { var s = 0; for (var i = 0; i < y.length; i++) s += (y[i] - p[i]) * (y[i] - p[i]); return Math.sqrt(s / y.length); }
  function score5(y, p) { return { mae: mae5(y, p), rmse: rmse5(y, p) }; }
  /* 가우스 소거(부분 피벗) */
  function solve5(A, b) {
    var n = b.length, i, j, k, M = A.map(function (r, ii) { return r.concat([b[ii]]); });
    for (i = 0; i < n; i++) {
      var piv = i; for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      for (j = i + 1; j < n; j++) { var f = M[j][i] / M[i][i]; if (f !== 0) for (k = i; k <= n; k++) M[j][k] -= f * M[i][k]; }
    }
    var x = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) { var s = M[i][n]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  function standardizer5(X) {
    var p = X[0].length, mu = [], sd = [], j, i;
    for (j = 0; j < p; j++) { var m = 0; for (i = 0; i < X.length; i++) m += X[i][j]; m /= X.length; var v = 0; for (i = 0; i < X.length; i++) v += (X[i][j] - m) * (X[i][j] - m); v = Math.sqrt(v / X.length); mu.push(m); sd.push(v > 0 ? v : 1); }
    return { mu: mu, sd: sd, f: function (r) { return r.map(function (v, k) { return (v - mu[k]) / sd[k]; }); } };
  }
  /* 직선 회귀(정규방정식, 표준화한 특징 + 절편). Z 는 표준화된 행렬 */
  function fitLinear5(Z, y) {
    var p = Z[0].length + 1, A = [], b = [], i, j, k;
    for (j = 0; j < p; j++) { A.push(new Array(p).fill(0)); b.push(0); }
    for (i = 0; i < Z.length; i++) { var r = [1].concat(Z[i]); for (j = 0; j < p; j++) { b[j] += r[j] * y[i]; for (k = 0; k < p; k++) A[j][k] += r[j] * r[k]; } }
    return solve5(A, b);
  }
  function predLin5(beta, Z) { return Z.map(function (z) { var s = beta[0]; for (var j = 0; j < z.length; j++) s += beta[j + 1] * z[j]; return s; }); }
  /* 포아송 회귀(로그 연결). 장수는 정수가 아니므로 준우도(quasi-likelihood)로 쓴다 — 점수 방정식 Σ(y−μ)x = 0 을 IRLS 로 푼다 */
  function fitPoisson5(Z, y) {
    var p = Z[0].length + 1, beta = new Array(p).fill(0), my = 0, i, j, k, it;
    for (i = 0; i < y.length; i++) my += y[i]; my /= y.length; beta[0] = Math.log(my > 0 ? my : 1e-9);
    for (it = 0; it < 100; it++) {
      var A = [], b = [];
      for (j = 0; j < p; j++) { A.push(new Array(p).fill(0)); b.push(0); }
      for (i = 0; i < Z.length; i++) {
        var r = [1].concat(Z[i]), eta = 0; for (j = 0; j < p; j++) eta += beta[j] * r[j];
        if (eta > 30) eta = 30; if (eta < -30) eta = -30;
        var mu = Math.exp(eta), z = eta + (y[i] - mu) / mu;
        for (j = 0; j < p; j++) { b[j] += mu * r[j] * z; for (k = 0; k < p; k++) A[j][k] += mu * r[j] * r[k]; }
      }
      var nb = solve5(A, b), d = 0; for (j = 0; j < p; j++) d = Math.max(d, Math.abs(nb[j] - beta[j]));
      beta = nb; if (d < 1e-11) break;
    }
    return beta;
  }
  function predPois5(beta, Z) { return Z.map(function (z) { var s = beta[0]; for (var j = 0; j < z.length; j++) s += beta[j + 1] * z[j]; if (s > 30) s = 30; return Math.exp(s); }); }
  /* 회귀 트리: 제곱오차를 가장 줄이는 (특징, 문턱). 같은 점수면 앞 특징·작은 문턱. 문턱 = 이웃한 다른 값의 가운데(a/2 + b/2), 값 ≤ 문턱이면 왼쪽. 두 값 차이가 1e-7 이하면 자르지 않음. */
  function fitTree5(X, y, idx, depth, minLeaf) {
    function mean2(ix) { var s = 0; for (var i = 0; i < ix.length; i++) s += y[ix[i]]; return s / ix.length; }
    function grow(ix, d) {
      var node = { n: ix.length, v: mean2(ix) };
      if (d >= depth || ix.length < 2 * minLeaf) return node;
      var tot = 0, i, f; for (i = 0; i < ix.length; i++) tot += y[ix[i]];
      var best = null, bestScore = -Infinity;
      for (f = 0; f < X[0].length; f++) {
        var o = ix.slice().sort(function (a, b) { return X[a][f] - X[b][f] || a - b; }), sl = 0;
        for (i = 0; i < o.length - 1; i++) {
          sl += y[o[i]]; var nl = i + 1, nr = o.length - nl;
          var a = X[o[i]][f], bb = X[o[i + 1]][f];
          if (bb <= a + 1e-7 || nl < minLeaf || nr < minLeaf) continue;
          var sr = tot - sl, sc = sl * sl / nl + sr * sr / nr;
          if (best === null || sc > bestScore * (1 + 1e-12)) { bestScore = sc; best = { f: f, thr: a / 2 + bb / 2 }; }
        }
      }
      if (!best) return node;
      var L = [], R = []; ix.forEach(function (k) { (X[k][best.f] <= best.thr ? L : R).push(k); });
      node.f = best.f; node.thr = best.thr; node.l = grow(L, d + 1); node.r = grow(R, d + 1);
      return node;
    }
    return grow(idx, 0);
  }
  function predTree5(tree, X) { return X.map(function (x) { var t = tree; while (t.f != null) t = x[t.f] <= t.thr ? t.l : t.r; return t.v; }); }
  function treeUse5(tree, acc) { acc = acc || {}; if (tree.f != null) { acc[tree.f] = (acc[tree.f] || 0) + 1; treeUse5(tree.l, acc); treeUse5(tree.r, acc); } return acc; }
  function treeLeaves5(tree) { return tree.f == null ? 1 : treeLeaves5(tree.l) + treeLeaves5(tree.r); }

  /* 시험 구간 나누기. time: 학습 = 목표 구간이 split 시간 안에 끝난 출발 시각, 시험 = split 시간 이후 출발. shuffle: 번호 정수 해시로 1/SHUF 를 시험으로 */
  function split5(ds, mode) {
    var tr = [], te = [];
    ds.rows.forEach(function (r, i) {
      if (mode === 'shuffle') { if ((r.h * F5.SHUF_MUL) % 4294967296 % F5.SHUF === 0) te.push(i); else tr.push(i); }
      else { if (r.h + ds.H <= ds.splitH) tr.push(i); else if (r.h >= ds.splitH) te.push(i); }
    });
    return { tr: tr, te: te };
  }
  /* 한 번의 시험. o = {mode, leak:[bool,bool,bool(표준화에 시험 기간 포함)], depth, minLeaf, target:'tot'|0..3} */
  function eval503(ds, o) {
    var sp = split5(ds, o.mode || 'time'), rows = ds.rows, nf = NLEG5 + (o.leak && o.leak[0] ? 1 : 0) + (o.leak && o.leak[1] ? 1 : 0);
    var cols = []; for (var j = 0; j < NLEG5; j++) cols.push(j); if (o.leak && o.leak[0]) cols.push(NLEG5); if (o.leak && o.leak[1]) cols.push(NLEG5 + 1);
    var tg = o.target == null ? 'tot' : o.target;
    function yOf(r) { return tg === 'tot' ? r.y : r.yg[tg]; }
    function pOf(r) { return tg === 'tot' ? r.pers : r.persg[tg]; }
    var Xall = rows.map(function (r) { return cols.map(function (c) { return r.X[c]; }); });
    var yall = rows.map(yOf);
    var Xtr = sp.tr.map(function (i) { return Xall[i]; }), ytr = sp.tr.map(function (i) { return yall[i]; });
    var Xte = sp.te.map(function (i) { return Xall[i]; }), yte = sp.te.map(function (i) { return yall[i]; });
    var st = standardizer5(o.leak && o.leak[2] ? Xall : Xtr);
    var Ztr = Xtr.map(st.f), Zte = Xte.map(st.f);
    var mtr = mean(ytr), out = { nTr: ytr.length, nTe: yte.length, meanTr: mtr, nf: nf };
    out.yte = yte; out.hte = sp.te.map(function (i) { return rows[i].h; });
    out.pred = {};
    out.pred.mean = yte.map(function () { return mtr; });
    out.pred.persist = sp.te.map(function (i) { return pOf(rows[i]); });
    var bl = fitLinear5(Ztr, ytr); out.pred.linear = predLin5(bl, Zte); out.betaLin = bl;
    var bp = fitPoisson5(Ztr, ytr); out.pred.poisson = predPois5(bp, Zte); out.betaPois = bp;
    var fr = function (r) { return r.map(Math.fround); }, Xtrf = Xtr.map(fr), Xtef = Xte.map(fr);   /* 트리는 scikit-learn 처럼 특징을 32비트 실수로 보고 가른다 */
    var tree = fitTree5(Xtrf, ytr, Xtr.map(function (_, i) { return i; }), o.depth == null ? F5.DEPTH : o.depth, o.minLeaf || F5.MINLEAF);
    out.pred.tree = predTree5(tree, Xtef); out.tree = tree; out.cols = cols;
    out.score = {}; ['mean', 'persist', 'linear', 'poisson', 'tree'].forEach(function (k) { out.score[k] = score5(yte, out.pred[k]); });
    var ptr = { mean: ytr.map(function () { return mtr; }), linear: predLin5(bl, Ztr), poisson: predPois5(bp, Ztr), tree: predTree5(tree, Xtrf) };
    out.train = {}; Object.keys(ptr).forEach(function (k) { out.train[k] = score5(ytr, ptr[k]); });
    out.train.persist = score5(ytr, sp.tr.map(function (i) { return pOf(rows[i]); }));
    var bb = out.score.mean.mae <= out.score.persist.mae ? 'mean' : 'persist';
    out.bestBase = bb;
    out.imp = {}; ['linear', 'poisson', 'tree'].forEach(function (k) { out.imp[k] = 1 - out.score[k].mae / out.score[bb].mae; });
    out.impRmse = {}; ['linear', 'poisson', 'tree'].forEach(function (k) { out.impRmse[k] = 1 - out.score[k].rmse / out.score[bb].rmse; });
    return out;
  }
  /* 근본 원인 묶음별: 기준 대비 직선·트리 개선률(시험 MAE) */
  function byRoot503(ds, depth) {
    return G5.map(function (g, gi) {
      var r = eval503(ds, { mode: 'time', leak: [false, false, false], depth: depth, target: gi });
      var sh = mean(r.yte);
      return { id: g.id, ko: g.ko, share: sh, mae: { mean: r.score.mean.mae, persist: r.score.persist.mae, linear: r.score.linear.mae, tree: r.score.tree.mae },
               bestBase: r.bestBase, imp: { linear: r.imp.linear, tree: r.imp.tree }, meanTe: sh };
    });
  }

  /* 분해 예측: 정규 PM 몫은 직선 회귀로, 나머지 몫(마스크·고장 계열·그 밖)은 학습 기간 평균(기준)으로 맞추고 더해 전체를 맞춘다. 어느 몫에 모델을 쓸지는 5절의 근본 원인별 시험 전에 정한 규칙(PM 만 달력 특징이 있음)이다 */
  function composite503(ds) {
    var tot = eval503(ds, { mode: 'time', leak: [false, false, false], target: 'tot' }), p = null, i, g;
    var parts = G5.map(function (_, gi) { return eval503(ds, { mode: 'time', leak: [false, false, false], target: gi }); });
    var pred = parts[0].pred.linear.map(function (v, k) { var s = v; for (g = 1; g < parts.length; g++) s += parts[g].pred.mean[k]; return s; });
    var sc = score5(tot.yte, pred), bb = tot.bestBase;
    return { pred: pred, yte: tot.yte, hte: tot.hte, score: sc, bestBase: bb, base: tot.score[bb], imp: 1 - sc.mae / tot.score[bb].mae, impRmse: 1 - sc.rmse / tot.score[bb].rmse };
  }

  /* ---------- 무기억성: 고장 간격과 경과 시간별 고장 위험 ---------- */
  /* 챔버마다 연달은 자기 원인 사건의 '끝 → 다음 시작' 간격(시간). 관찰창(0~tmax) 안에서 다음 시작이 보인 것만 */
  function gaps503(ev, code, tmaxMin) {
    var byC = {}; ev.forEach(function (e) { if (e.reason === code && e.root_cause === code && e.end_min <= tmaxMin) { var k = e.block + '|' + e.chamber; (byC[k] || (byC[k] = [])).push(e); } });
    var g = []; Object.keys(byC).sort().forEach(function (k) { var a = byC[k].sort(function (x, y) { return x.start_min - y.start_min; }); for (var i = 1; i < a.length; i++) g.push((a[i].start_min - a[i - 1].end_min) / 60); });
    return g;
  }
  function sd5(a) { return Math.sqrt(variance(a)); }
  /* 생명표: 챔버마다 마지막 고장이 끝난 뒤 시간(경과)을 구간으로 나눠, 구간별 노출 시간(챔버·시간)과 그 안에서 다음 고장이 시작한 건수 → 시간당 위험률.
   * 첫 고장 이전은 경과를 알 수 없으므로 뺀다. edges: 경과 구간 경계(시간) */
  function lifeTable503(ev, code, tmaxMin, edges) {
    var byC = {}; ev.forEach(function (e) { if (e.reason === code && e.root_cause === code && e.start_min < tmaxMin) { var k = e.block + '|' + e.chamber; (byC[k] || (byC[k] = [])).push(e); } });
    var nb = edges.length, expo = new Array(nb).fill(0), cnt = new Array(nb).fill(0);
    function bin(x) { for (var b = nb - 1; b >= 0; b--) if (x >= edges[b]) return b; return -1; }
    Object.keys(byC).sort().forEach(function (k) {
      var a = byC[k].sort(function (x, y) { return x.start_min - y.start_min; });
      for (var i = 0; i < a.length; i++) {
        var from = a[i].end_min, nxt = i + 1 < a.length ? a[i + 1].start_min : null, to = nxt != null ? nxt : tmaxMin, span = (to - from) / 60;
        if (span <= 0) continue;
        for (var b = 0; b < nb; b++) { var lo = edges[b], hi = b + 1 < nb ? edges[b + 1] : Infinity, ov = Math.min(span, hi) - lo; if (ov > 0) expo[b] += ov; }
        if (nxt != null) { var b2 = bin(span); if (b2 >= 0) cnt[b2]++; }
      }
    });
    return edges.map(function (lo, b) { return { lo: lo, hi: b + 1 < nb ? edges[b + 1] : null, expo: expo[b], n: cnt[b], rate: expo[b] > 0 ? cnt[b] / expo[b] : NaN }; });
  }
  /* 지수 가정의 평균 대기 시간(시간): 총 노출 / 건수 */
  function lifeMean5(tab) { var e = 0, n = 0; tab.forEach(function (r) { e += r.expo; n += r.n; }); return n ? e / n : NaN; }
  /* 위험률 기울기 검정: 앞쪽 절반 노출 구간 vs 뒤쪽 — 정확 이항(포아송 비율 검정) */
  function lifeSplit5(tab, cutIdx) {
    var e1 = 0, e2 = 0, n1 = 0, n2 = 0; tab.forEach(function (r, i) { if (i < cutIdx) { e1 += r.expo; n1 += r.n; } else { e2 += r.expo; n2 += r.n; } });
    var t = poissonRateTest(n1, e1, n2, e2); return { e1: e1, n1: n1, e2: e2, n2: n2, r1: n1 / e1, r2: n2 / e2, ratio: t.ratio, p: t.p };
  }

  /* ---------- B. 제품 공정 추적: 마스크 사용 이력 ---------- */
  /* 사용 한 번 = to:'in_use' 행. 결함 = 다음 in_use 행 전에 to:'repair' & trigger:'turn_end_defect' 행이 있음. 끝나지 않은 사용은 결함 없음으로 센다 */
  function maskUses(trans) {
    var uses = [], cur = {}, info = MS.BLOCK_INFO;
    trans.forEach(function (x) {
      if (x.entity !== 'mask') return;
      if (x.to === 'in_use') { var u = { mask_id: x.id, t: x.t, age: +String(x.cause).replace('age=', ''), block: x.id.slice(0, 3), fmm: info[x.id.slice(0, 3)].fmm ? 1 : 0, defect: 0, set: x.id.slice(0, 5) }; uses.push(u); cur[x.id] = u; }
      else if (x.to === 'repair' && x.trigger === 'turn_end_defect' && cur[x.id]) cur[x.id].defect = 1;
    });
    var g = {}; uses.forEach(function (u) { var k = u.set + '|' + u.t; var a = g[k] || (g[k] = { s: 0, n: 0 }); a.s += u.age; a.n++; });
    uses.forEach(function (u) { var a = g[u.set + '|' + u.t]; u.setAge = a.s / a.n; });
    return uses;
  }
  var MFEAT = {
    full: { names: ['나이', 'FMM', '나이×FMM'], f: function (u) { return [u.age, u.fmm, u.age * u.fmm]; } },
    add: { names: ['나이', 'FMM'], f: function (u) { return [u.age, u.fmm]; } },
    fmm: { names: ['FMM'], f: function (u) { return [u.fmm]; } },
    set: { names: ['세트 평균 나이', 'FMM', '세트 평균 나이×FMM'], f: function (u) { return [u.setAge, u.fmm, u.setAge * u.fmm]; } }
  };
  function sigm5(z) { return 1 / (1 + Math.exp(-z)); }
  /* 로지스틱 회귀(규제 없음, 뉴턴법). 반환 {beta, iter, ok} */
  function fitLogit5(X, y) {
    var p = X[0].length + 1, beta = new Array(p).fill(0), i, j, k, it, ok = false;
    var my = 0; for (i = 0; i < y.length; i++) my += y[i]; my /= y.length; beta[0] = Math.log(my / (1 - my));
    for (it = 0; it < 60; it++) {
      var A = [], g = [];
      for (j = 0; j < p; j++) { A.push(new Array(p).fill(0)); g.push(0); }
      for (i = 0; i < X.length; i++) {
        var r = [1].concat(X[i]), z = 0; for (j = 0; j < p; j++) z += beta[j] * r[j];
        var q = sigm5(z), w = q * (1 - q);
        for (j = 0; j < p; j++) { g[j] += (y[i] - q) * r[j]; for (k = 0; k < p; k++) A[j][k] += w * r[j] * r[k]; }
      }
      var d = solve5(A, g), m = 0; for (j = 0; j < p; j++) { beta[j] += d[j]; m = Math.max(m, Math.abs(d[j])); }
      if (m < 1e-10) { ok = true; break; }
      if (!isFinite(m) || m > 1e6) break;
    }
    return { beta: beta, iter: it + 1, ok: ok };
  }
  function predLogit5(beta, X) { return X.map(function (x) { var z = beta[0]; for (var j = 0; j < x.length; j++) z += beta[j + 1] * x[j]; return sigm5(z); }); }
  function logloss5(p, y) { var s = 0, e = 1e-15; for (var i = 0; i < y.length; i++) { var q = Math.min(1 - e, Math.max(e, p[i])); s -= y[i] * Math.log(q) + (1 - y[i]) * Math.log(1 - q); } return s / y.length; }
  /* 상위 k 몫을 점검했을 때 잡히는 결함 수(같은 점수 묶음은 경계에서 비례로 센다) */
  function groupsByP5(p, y) {
    var ix = p.map(function (_, i) { return i; }).sort(function (a, b) { return p[b] - p[a] || a - b; }), gs = [], i;
    for (i = 0; i < ix.length; i++) { var q = p[ix[i]]; if (gs.length && Math.abs(gs[gs.length - 1].p - q) <= 1e-12 * Math.max(1, Math.abs(q))) { gs[gs.length - 1].n++; gs[gs.length - 1].d += y[ix[i]]; } else gs.push({ p: q, n: 1, d: y[ix[i]] }); }
    return gs;
  }
  function riskCapture5(p, y, k) {
    var n = p.length, want = k * n, gs = groupsByP5(p, y), taken = 0, cap = 0, tot = 0, i;
    for (i = 0; i < y.length; i++) tot += y[i];
    for (i = 0; i < gs.length && taken < want - 1e-12; i++) { var take = Math.min(gs[i].n, want - taken); cap += gs[i].d * take / gs[i].n; taken += take; }
    return { n: n, check: want, captured: cap, total: tot, rate: tot ? cap / tot : NaN };
  }
  /* 보정도: 예측 확률이 같은 묶음은 쪼개지 않고, 낮은 쪽부터 묶음을 쌓아 한 칸이 n/bins 이상이 되면 자른다 */
  function calibTable5(p, y, bins) {
    var gs = groupsByP5(p, y).reverse(), n = p.length, rows = [], cn = 0, cd = 0, cp = 0, i;
    for (i = 0; i < gs.length; i++) {
      cn += gs[i].n; cd += gs[i].d; cp += gs[i].p * gs[i].n;
      if (cn >= n / bins - 1e-9 && rows.length < bins - 1 || i === gs.length - 1) { rows.push({ n: cn, pred: cp / cn, rate: cd / cn, defects: cd }); cn = 0; cd = 0; cp = 0; }
    }
    return rows;
  }
  /* 마스크 한 번의 시험(시간순). 반환: 학습·시험 건수·결함, 모델별 계수·로그 손실·포착률 */
  function mask503(uses, splitDay, k, kinds) {
    var cut = splitDay * 1440, tr = uses.filter(function (u) { return u.t < cut; }), te = uses.filter(function (u) { return u.t >= cut; });
    var ytr = tr.map(function (u) { return u.defect; }), yte = te.map(function (u) { return u.defect; });
    var out = { nTr: tr.length, nTe: te.length, dTr: sum(ytr), dTe: sum(yte), models: {} };
    var rate = out.dTr / tr.length, pb = te.map(function () { return rate; });
    out.base = { rate: rate, logloss: logloss5(pb, yte), capture: riskCapture5(pb, yte, k) };
    (kinds || ['full', 'add', 'set', 'fmm']).forEach(function (kd) {
      var fe = MFEAT[kd], fit = fitLogit5(tr.map(fe.f), ytr), p = predLogit5(fit.beta, te.map(fe.f));
      out.models[kd] = { names: fe.names, beta: fit.beta, ok: fit.ok, iter: fit.iter, p: p, logloss: logloss5(p, yte), capture: riskCapture5(p, yte, k) };
    });
    out.te = te;
    return out;
  }
  /* 시드 하나(60일): 마스크 + 라인 요약. 페이지·CSV 가 같은 값을 쓴다 */
  function seed503(seed, H, splitDay, depth, k, keep) {
    var sim = MS.simulateLoss({ seed: seed, trace: true }), uses = maskUses(sim.transitions), m = mask503(uses, splitDay, k, ['full', 'add', 'set', 'fmm']);
    var ds = build503(sim, H, splitDay), a = eval503(ds, { mode: 'time', leak: [false, false, false], depth: depth }), b = eval503(ds, { mode: 'time', leak: [true, true, false], depth: depth });
    var grp = byRoot503(ds, depth);
    var res = { seed: seed, uses: uses.length, defects: sum(uses.map(function (u) { return u.defect; })), nTe: m.nTe, dTe: m.dTe,
             capFull: m.models.full.capture.rate, capSet: m.models.set.capture.rate, capAdd: m.models.add.capture.rate, capFmm: m.models.fmm.capture.rate, ageCoef: m.models.add.beta[1], fmmCoef: m.models.add.beta[2],
             llFull: m.models.full.logloss, llBase: m.base.logloss, okFull: m.models.full.ok ? 1 : 0,
             maeMean: a.score.mean.mae, maePers: a.score.persist.mae, maeLin: a.score.linear.mae, maeTree: a.score.tree.mae, maeTreeLeak: b.score.tree.mae, impLin: a.imp.linear, impTree: a.imp.tree, impTreeLeak: b.imp.tree, impComp: composite503(ds).imp,
             impPm: grp[0].imp.tree, impFault: grp[2].imp.tree, impPmLin: grp[0].imp.linear, impFaultLin: grp[2].imp.linear };
    if (keep) res.keep = { y: m.te.map(function (u) { return u.defect; }), p: m.models.full.p, pSet: m.models.set.p, pFmm: m.models.fmm.p };   /* 슬라이더로 바꾼 점검 몫에서 포착률을 다시 재기 위한 시험 구간 점수 */
    return res;
  }
  function seed503Rows(list) { return list.map(function (r) { var o = {}; Object.keys(r).forEach(function (kk) { o[kk] = typeof r[kk] === 'number' && kk !== 'seed' && r[kk] % 1 !== 0 ? Math.round(r[kk] * 1e9) / 1e9 : r[kk]; }); return o; }); }
  function maskRows(uses) { return uses.map(function (u) { return { mask_id: u.mask_id, t: u.t, age: u.age, block: u.block, fmm: u.fmm, set_age: Math.round(u.setAge * 1e6) / 1e6, defect: u.defect }; }); }

  return {
    DEFAULT_SEED: DEFAULT_SEED, DAYS: DAYS, SEEDS: SEEDS, WEEK_MIN: WEEK_MIN, CODES: CODES, CAT_ORDER: CAT_ORDER, BLOCKS: BLOCKS, N_TURN: N_TURN, METRICS: METRICS,
    info: info, catOf: catOf, pareto: pareto, paretoWith: paretoWith, fold: fold, barsFor: barsFor, cross: cross, reattribute: reattribute,
    codeSystem: codeSystem, weekly: weekly, seedRun: seedRun, seedRows: seedRows, quantile: quantile, percentile: percentile, rankStab: rankStab, rankOne: rankOne,
    shareOf: shareOf, blockTable: blockTable, otherShare: otherShare, chain: chain, tasks: tasks,
    /* 0502 */
    DAY_MIN: DAY_MIN, S16: S16, mean: mean, variance: variance, corr: corr, lagCorr: lagCorr, detrend: detrend, detrendedCorr: detrendedCorr, ratePerExposure: ratePerExposure,
    dispersion: dispersion, poissonPmf: poissonPmf, binomPmf: binomPmf, poissonRateTest: poissonRateTest, dailyCounts: dailyCounts, hourlyCounts: hourlyCounts, dailySum: dailySum,
    chainCheck: chainCheck, rootUnitDaily: rootUnitDaily, fanOut: fanOut, s16Gen: s16Gen, s16Metrics: s16Metrics, s16Run: s16Run, s16Rep: s16Rep, s16Rows: s16Rows, S16_REP_KEYS: S16_REP_KEYS,
    /* 0503 */
    F5: F5, G5: G5, FEAT5: FEAT5, NLEG5: NLEG5, group5: group5, build503: build503, eval503: eval503, byRoot503: byRoot503, composite503: composite503, split5: split5, pmPeriod5: pmPeriod5, pre5: pre5,
    fitLinear5: fitLinear5, fitPoisson5: fitPoisson5, fitTree5: fitTree5, predTree5: predTree5, treeUse5: treeUse5, treeLeaves5: treeLeaves5, standardizer5: standardizer5,
    gaps503: gaps503, lifeTable503: lifeTable503, lifeMean5: lifeMean5, lifeSplit5: lifeSplit5, sd5: sd5,
    maskUses: maskUses, MFEAT: MFEAT, fitLogit5: fitLogit5, predLogit5: predLogit5, logloss5: logloss5, riskCapture5: riskCapture5, calibTable5: calibTable5, mask503: mask503,
    seed503: seed503, seed503Rows: seed503Rows, maskRows: maskRows, mae5: mae5, rmse5: rmse5
  };
});
