/* RL06 — 실험실 0605(트윈 안에서 정책 학습: 작은 강화학습과 도메인 무작위화)의 계산 모듈. 새 가상 상황 S21(세트 교체 시점 결정)의 작은 이산 사건 환경, 표 형태 Q 학습, 정책 평가를 모은다.
 * 브라우저: mfgsim.js 다음에 rl06_tables.js(미리 계산한 표) 와 이 파일 → window.RL06      node: require('./rl06.js')
 * 난수는 mfgsim 의 rng·hashSeed 만 쓴다(시드만 씀, 시각·무작위 함수 없음). mfgsim.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 파이썬(페이지 11절 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * ※ simulateLoss 는 세정 투입·세트 교체 순서가 고정이라 이 결정을 바깥에서 바꿀 수 없다. 그래서 이 실험실의 환경은 학습용 작은 모형이다. 세정 시간(CLEAN)이 세트 도착 시각을 정하는 길만
 *    simulateLoss 의 기록(세정 대기열 q·세정 중 평균 busy, 60일 8시드 평균)에서 리틀의 법칙(줄 서서 기다리는 시간 = 대기열 × 세정 시간 ÷ 세정 중 평균)으로 가져온다.
 * 환경과 학습기는 새 환경 점검(verify.py 0605)이 파이썬 독립 구현과 같은 난수 줄기로 대조한다. 숨은 '실제' 세정 시간(Loop06.HIDDEN)은 realEpisodes 를 만들 때만 읽고(build_csv.mjs), 표 파일·CSV·본문에는 넣지 않는다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), function () { try { return require('./rl06_tables.js'); } catch (e) { return null; } });
  else root.RL06 = factory(root.MfgSim, function () { return root.RL06_TABLES || null; });
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, tabFn) {
  'use strict';
  /* ---------- 0. 설정(가정) ---------- */
  var EP = 30, TR = 20;                    // 한 판단 간격 30분 · 세정이 끝난 뒤 반송에 걸리는 분(고정, 가정)
  var R_LO = 3, R_HI = 12;                 // 판이 시작할 때 지금 세트의 남은 유리(판단 간격 수 = 30분 단위 작업량), 균등 정수
  var KMAX = 23, WMAX = 5, RMAX = 12;      // 상태 칸: 도착 전 경과 0..23, 도착 뒤 대기 0..5, 남은 유리 0..12
  var NS = KMAX + 1 + WMAX + 1;            // 한 남은 유리 값당 도착 상태 칸 수(30)
  var NSTATE = (RMAX + 1) * NS;            // 390
  var DMAX = 60;                           // 도착 판단 간격 상한(판이 끝없이 길어지지 않게)
  var CH_PER_BLOCK = 4;                    // 한 블록의 챔버 수(CH1~CH4)
  var IDLE = CH_PER_BLOCK * (EP / MS.CFG.CT);   // 블록이 한 간격(30분) 서 있을 때 잃는 유리 장수 = 챔버 4개 × (30분 ÷ 유리 1장 2.5분) = 48
  var COST = { csw: IDLE, idle: IDLE, hold: 6 };   // 교체 한 번(블록이 한 간격 서는 값, 기본 48장) · 블록이 한 간격 노는 손실 · 도착한 세트가 기다릴 때 간격당 대기 비용의 기본 단위(장, 가정)
  var GAMMA = 1;                           // 판이 반드시 끝나므로 할인 없음
  var ALPHA = 0.05, EPS = 0.1, EPISODES = 4000, SEEDS = 20, MINV = 10;   // 학습률·탐색률·학습 판 수·학습 시드 수·학습했다고 보는 최소 방문 수
  var N_EVAL = 4000;                       // 트윈 안 평가에 쓰는 고정 판 수(실제 쪽은 표의 실제 판 목록)
  var EVAL_TAG = 'S21eval', TRAIN_TAG = 'S21train', REAL_TAG = 'S21real';
  var METHODS = [
    { id: 'rule', name: '지금 규칙 (끝까지 기다림)' },
    { id: 'v0', name: '트윈 판 0 에서 학습' },
    { id: 'cal', name: '0601 보정한 트윈에서 학습' },
    { id: 'pm', name: '사후 평균 한 값의 트윈에서 학습' },
    { id: 'dr', name: '사후분포로 무작위화해 학습' }
  ];

  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sorted(a) { return Array.prototype.slice.call(a).sort(function (x, y) { return x - y; }); }
  function quantile(x, p) { var b = sorted(x), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function r8(v) { return Math.round(v * 1e8) / 1e8; }
  function T() { var t = tabFn(); if (!t) throw new Error('RL06_TABLES 를 먼저 읽으십시오'); return t; }

  /* ---------- 1. 세정 시간 → 도착 시각 ---------- */
  /* 세정을 시작하기 전 줄 서서 기다리는 평균 시간(분): 리틀의 법칙. 표(wq)는 세정 시간 칸마다 대기열·세정 중 평균(트윈 시드 8개·60일 평균)에서 만든 값. 칸 사이는 직선, 밖은 끝값 */
  function wqOf(clean, wq) {
    wq = wq || T().wq; var c = wq.c, w = wq.w, n = c.length;
    if (clean <= c[0]) return w[0]; if (clean >= c[n - 1]) return w[n - 1];
    var i = 0; while (clean > c[i + 1]) i++;
    var f = (clean - c[i]) / (c[i + 1] - c[i]); return w[i] * (1 - f) + w[i + 1] * f;
  }
  /* 한 판의 난수 재료 (r0, e1, e2, uc): 지금 세트 남은 유리 · 대기 시간을 이루는 단위 지수분포 둘 · 무작위화에서 세정 시간을 고르는 균등 난수 */
  function drawEp(rng) { return { r0: R_LO + rng.int(R_HI - R_LO + 1), e1: rng.exp(1), e2: rng.exp(1), uc: rng.u() }; }
  /* 다음 세트가 도착하는 판단 간격 수 D: 줄 서서 기다림(두 지수분포의 평균 = 에를랑 2) + 세정 시간 + 반송, 30분 단위 올림 */
  function arrival(clean, e1, e2, wq) {
    var tot = clean + wqOf(clean, wq) * 0.5 * (e1 + e2) + TR, d = Math.ceil(tot / EP);
    return d > DMAX ? DMAX : d;
  }
  /* 환경 명세: {fixed: 세정 시간} 또는 {cells, cum: 누적확률}(무작위화) */
  function specFixed(clean) { return { fixed: clean }; }
  function specDist(cells, weights) {
    var cum = [], s = 0, i, tot = 0; for (i = 0; i < weights.length; i++) tot += weights[i];
    for (i = 0; i < weights.length; i++) { s += weights[i] / tot; cum.push(s); }
    cum[cum.length - 1] = 1; return { cells: cells, cum: cum };
  }
  function cleanOf(spec, uc) { if (spec.fixed != null) return spec.fixed; var i = 0; while (uc > spec.cum[i]) i++; return spec.cells[i]; }
  function specArrival(spec, ep, wq) { return arrival(cleanOf(spec, ep.uc), ep.e1, ep.e2, wq); }

  /* ---------- 2. 한 칸 전이 ---------- */
  function sidx(r, arrived, k, w) { return r * NS + (arrived ? KMAX + 1 + (w > WMAX ? WMAX : w) : (k > KMAX ? KMAX : k)); }
  /* 행동 a(0 기다림 · 1 지금 교체)를 했을 때의 (보상, 끝났는가, 다음 r, 다음 k, 다음 도착 여부, 다음 w). 보상은 −(잃은 장수) = −(굶음 idle + 막힘 hold + 교체 sw). 도착 전·도착 뒤 규칙은 페이지 3절과 같다 */
  function step(r, k, arrived, w, a, D, C) {
    var idle = 0, hold = 0, sw = 0, done = false, nr = r, nk = k, na = arrived, nw = w;
    if (!arrived) {
      if (a === 1) { sw = C.csw * (2 + (r > 0 ? 1 : 0)); done = true; }
      else {
        idle = r > 0 ? 0 : C.idle; nr = r > 0 ? r - 1 : 0; nk = k + 1;
        if (nk >= D) { na = true; nw = 0; if (nr === 0) { sw = C.csw; done = true; } }
      }
    } else {
      if (a === 1) { sw = 2 * C.csw; done = true; }
      else { hold = C.hold * (w + 1); nr = r - 1; nw = w + 1; if (nr === 0) { sw = C.csw; done = true; } }
    }
    return { rew: -(idle + hold + sw), idle: idle, hold: hold, sw: sw, done: done, r: nr, k: nk, arrived: na, w: nw };
  }

  /* ---------- 3. 정책 평가 ---------- */
  /* pol: 칸마다 행동(0/1)의 배열(길이 NSTATE). eps: 판 목록 [{r0, D}]. 반환: 판당 평균 Loss 와 항목별 평균 */
  function evalPolicy(pol, eps, C) {
    C = C || COST; var idle = 0, hold = 0, sw = 0, nSp = 0, nEa = 0, i;
    for (i = 0; i < eps.length; i++) {
      var r = eps[i].r0, k = 0, arrived = false, w = 0, D = eps[i].D, guard = 0;
      while (guard++ < 400) {
        var s = sidx(r, arrived, k, w), a = pol[s], st = step(r, k, arrived, w, a, D, C);
        idle += st.idle; hold += st.hold; sw += st.sw;
        if (a === 1) { if (arrived) nEa++; else nSp++; }
        if (st.done) break;
        r = st.r; k = st.k; arrived = st.arrived; w = st.w;
      }
    }
    var n = eps.length;
    return { mean: (idle + hold + sw) / n, idle: idle / n, hold: hold / n, sw: sw / n, spare: nSp / n, early: nEa / n };
  }
  /* 트윈 쪽 평가용 판 목록: 고정 재료(evalDraws) × 환경 명세 */
  function evalDraws(n, tag) { var g = MS.rng(MS.hashSeed(tag || EVAL_TAG)), a = [], i; for (i = 0; i < (n || N_EVAL); i++) a.push(drawEp(g)); return a; }
  function twinEpisodes(spec, draws, wq) { return draws.map(function (d) { return { r0: d.r0, D: specArrival(spec, d, wq) }; }); }
  /* 실제 쪽 평가용 판 목록: 표에 들어 있는 (r0, D) */
  function realEpisodes() { var R = T().real; return R.r0.map(function (v, i) { return { r0: v, D: R.D[i] }; }); }
  /* 숨은 실제 세정 시간으로 실제 판 목록을 만든다(build_csv.mjs 전용: 숨은 값은 여기서만 읽는다) */
  function buildReal(clean, n, wq) { var g = MS.rng(MS.hashSeed(REAL_TAG)), r0 = [], D = [], i; for (i = 0; i < n; i++) { var d = drawEp(g); r0.push(d.r0); D.push(arrival(clean, d.e1, d.e2, wq)); } return { r0: r0, D: D }; }

  /* ---------- 4. 정책 ---------- */
  function rulePolicy() { return new Int8Array(NSTATE); }                 // 지금 규칙: 늘 기다림(0)
  /* Q 표에서 정책을 읽는다. 학습한 적이 적은 칸(방문 수 < minV)은 지금 규칙(기다림)으로 되돌린다(검증 영역 밖). 값이 같으면 기다림 */
  function policyFromQ(Q, Nv, minV) {
    minV = minV == null ? MINV : minV; var pol = new Int8Array(NSTATE), s;
    for (s = 0; s < NSTATE; s++) { var v = Nv[2 * s] + Nv[2 * s + 1]; pol[s] = v >= minV && Q[2 * s + 1] > Q[2 * s] ? 1 : 0; }
    return pol;
  }
  /* 손으로 짠 규칙: 남은 유리가 0 이 되었는데 다음 세트가 아직 안 왔고 경과가 tau 간격 미만이면 대기 중인 다른 세트로 바꾼다. 그 밖에는 기다린다(tau = 0 이면 지금 규칙) */
  function handPolicy(tau) { var pol = new Int8Array(NSTATE), k; for (k = 0; k <= KMAX; k++) if (k < tau) pol[sidx(0, false, k, 0)] = 1; return pol; }
  function stateCells(r, arrived, kw) { return sidx(r, arrived, arrived ? 0 : kw, arrived ? kw : 0); }

  /* ---------- 5. 표 형태 Q 학습 ---------- */
  /* spec: 환경 명세. o: {episodes, alpha, eps, seed, cost, curveEvery, twinEps, realEps, minV}. 한 시드의 한 번 학습. 같은 시드는 환경이 달라도 판의 난수 재료(r0, e1, e2, uc)가 같다 */
  function train(spec, o) {
    o = o || {}; var episodes = o.episodes == null ? EPISODES : o.episodes, alpha = o.alpha == null ? ALPHA : o.alpha, eps = o.eps == null ? EPS : o.eps, C = o.cost || COST, minV = o.minV == null ? MINV : o.minV;
    var rng = MS.rng(MS.hashSeed(TRAIN_TAG, o.seed == null ? 1 : o.seed)), Q = new Float64Array(2 * NSTATE), Nv = new Int32Array(2 * NSTATE), curve = [], sumLoss = 0, win = [];
    var wq = o.wq, e, curveEvery = o.curveEvery || 0, trace = [], nTrace = o.trace || 0, traceFrom = o.traceFrom || 0;
    for (e = 0; e < episodes; e++) {
      var d = drawEp(rng), clean = cleanOf(spec, d.uc), D = arrival(clean, d.e1, d.e2, wq), r = d.r0, k = 0, arrived = false, w = 0, loss = 0, guard = 0;
      while (guard++ < 400) {
        var s = sidx(r, arrived, k, w), u = rng.u(), a;
        if (u < eps) a = rng.int(2); else a = Q[2 * s + 1] > Q[2 * s] ? 1 : 0;
        var st = step(r, k, arrived, w, a, D, C), tg = st.rew;
        if (!st.done) { var s2 = sidx(st.r, st.arrived, st.k, st.w); tg += GAMMA * (Q[2 * s2] > Q[2 * s2 + 1] ? Q[2 * s2] : Q[2 * s2 + 1]); }
        var q0 = Q[2 * s + a]; Q[2 * s + a] += alpha * (tg - q0); Nv[2 * s + a]++; loss -= st.rew;
        if (e >= traceFrom && trace.length < nTrace) trace.push({ ep: e + 1, r: r, k: k, arrived: arrived, w: w, a: a, rew: st.rew, target: tg, q0: q0, q1: Q[2 * s + a], explore: u < eps, done: st.done });
        if (st.done) break; r = st.r; k = st.k; arrived = st.arrived; w = st.w;
      }
      sumLoss += loss;
      if (curveEvery && ((e + 1) % curveEvery === 0 || e === episodes - 1)) {
        var pol = policyFromQ(Q, Nv, minV), pt = o.twinEps ? evalPolicy(pol, o.twinEps, C).mean : null, pr = o.realEps ? evalPolicy(pol, o.realEps, C).mean : null;
        curve.push({ ep: e + 1, twin: pt, real: pr });
      }
    }
    return { Q: Q, Nv: Nv, curve: curve, trainLoss: sumLoss / episodes, trace: trace };
  }

  /* ---------- 6. 한 학습 방식의 환경 명세와 한 시드 결과 ---------- */
  /* 방식별 환경 명세: 표의 값에서 만든다. widthKey = 무작위화 폭('w7'·'w14'·'w30'·'w60'·'prior') */
  function methodSpec(id, widthKey) {
    var t = T();
    if (id === 'v0') return specFixed(t.cal.v0);
    if (id === 'cal') return specFixed(widthKey && t.cal.gridw[widthKey] != null ? t.cal.gridw[widthKey] : t.cal.grid);
    if (id === 'pm') return specFixed(widthKey === 'prior' ? t.cal.v0 : t.cal.pm[widthKey || 'w60']);
    if (id === 'dr') return specDist(t.post.c, t.post[widthKey || 'w60']);
    return null;
  }
  /* 한 방식·한 시드: 학습 → 정책 → 트윈 안 평가와 실제 평가. cache 용으로 정책을 함께 돌려준다 */
  function runMethod(id, o) {
    o = o || {}; var C = o.cost || COST, real = o.realEps || realEpisodes(), draws = o.draws || evalDraws();
    if (id === 'rule') { var pr = rulePolicy(), ev = evalPolicy(pr, real, C); return { id: id, pol: pr, real: ev, twin: ev, Q: null, Nv: null, curve: [] }; }
    var spec = methodSpec(id, o.width), twinEps = twinEpisodes(spec, draws, o.wq);
    var tr = train(spec, { episodes: o.episodes, alpha: o.alpha, eps: o.eps, seed: o.seed, cost: o.trainCost || C, curveEvery: o.curveEvery, twinEps: twinEps, realEps: real, minV: o.minV, wq: o.wq });
    var pol = policyFromQ(tr.Q, tr.Nv, o.minV);
    return { id: id, pol: pol, real: evalPolicy(pol, real, C), twin: evalPolicy(pol, twinEps, C), Q: tr.Q, Nv: tr.Nv, curve: tr.curve, trainLoss: tr.trainLoss };
  }
  /* 시드 1..n 의 방식 하나 결과 요약: [{seed, real, twin}] (정책은 돌려주지 않는다) */
  function seedRuns(id, o) {
    o = o || {}; var n = o.seeds || SEEDS, out = [], s; var real = o.realEps || realEpisodes(), draws = o.draws || evalDraws();
    for (s = 1; s <= n; s++) { var r = runMethod(id, { episodes: o.episodes, alpha: o.alpha, eps: o.eps, seed: s, cost: o.cost, trainCost: o.trainCost, width: o.width, realEps: real, draws: draws, minV: o.minV, wq: o.wq }); out.push({ seed: s, real: r.real.mean, twin: r.twin.mean, spare: r.real.spare, early: r.real.early }); }
    return out;
  }

  /* ---------- 7. 정책 읽기: 상태 격자의 사람 말 요약 ---------- */
  /* 격자 두 장: 도착 전(남은 유리 r × 경과 k), 도착 뒤(남은 유리 r × 대기 w). 값 0 기다림 · 1 교체 · -1 학습한 적 적음 */
  function grids(pol, Nv, minV) {
    minV = minV == null ? MINV : minV; var pre = [], post = [], r, k, w;
    for (r = 0; r <= RMAX; r++) {
      var rowP = [], rowQ = [];
      for (k = 0; k <= KMAX; k++) { var s = sidx(r, false, k, 0), v = Nv ? Nv[2 * s] + Nv[2 * s + 1] : 1e9; rowP.push(v < minV ? -1 : pol[s]); }
      for (w = 0; w <= WMAX; w++) { var s2 = sidx(r, true, 0, w), v2 = Nv ? Nv[2 * s2] + Nv[2 * s2 + 1] : 1e9; rowQ.push(r === 0 || v2 < minV ? -1 : pol[s2]); }
      pre.push(rowP); post.push(rowQ);
    }
    return { pre: pre, post: post };
  }
  /* 도착 전 r = 0 줄에서 처음으로 '기다림'이 되는 경과 k 의 직전까지 교체하는 칸 수(문턱): 줄 안의 교체 칸 가운데 가장 큰 k + 1 (없으면 0) */
  function spareThreshold(pol, Nv, minV) {
    var g = grids(pol, Nv, minV), row = g.pre[0], t = 0, k; for (k = 0; k <= KMAX; k++) if (row[k] === 1) t = k + 1; return t;
  }

  return {
    EP: EP, TR: TR, R_LO: R_LO, R_HI: R_HI, KMAX: KMAX, WMAX: WMAX, RMAX: RMAX, NS: NS, NSTATE: NSTATE, DMAX: DMAX, COST: COST, GAMMA: GAMMA, ALPHA: ALPHA, EPS: EPS, EPISODES: EPISODES, SEEDS: SEEDS, MINV: MINV, N_EVAL: N_EVAL, METHODS: METHODS,
    EVAL_TAG: EVAL_TAG, TRAIN_TAG: TRAIN_TAG, REAL_TAG: REAL_TAG,
    wqOf: wqOf, drawEp: drawEp, arrival: arrival, specFixed: specFixed, specDist: specDist, cleanOf: cleanOf, specArrival: specArrival, sidx: sidx, step: step,
    evalPolicy: evalPolicy, evalDraws: evalDraws, twinEpisodes: twinEpisodes, realEpisodes: realEpisodes, buildReal: buildReal,
    rulePolicy: rulePolicy, handPolicy: handPolicy, CH_PER_BLOCK: CH_PER_BLOCK, IDLE: IDLE, policyFromQ: policyFromQ, stateCells: stateCells, train: train, methodSpec: methodSpec, runMethod: runMethod, seedRuns: seedRuns, grids: grids, spareThreshold: spareThreshold,
    mean: mean, quantile: quantile, r4: r4, r8: r8
  };
});
