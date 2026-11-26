/* OFF06 — 실험실 0606(지금 닿을 수 있는 한계선: 오프라인 강화학습과 LLM 에이전트)의 계산 모듈. 0605 의 환경(S21, rl06.js)에서 지금 규칙 + 작은 탐색 ε 로 쌓인 로그를 만들고,
 * 로그만으로 정책을 배우는 세 방식(행동 복제·단순 오프라인 Q·보수적 Q), 횟수표, 분포 밖 행동의 가치 부풀림 격자, 실제 판 기록 평가, 시드 분포를 모은다.
 * 브라우저: mfgsim.js · rl06_tables.js · rl06.js 다음에 off06_tables.js(도착 시각 문턱표) 와 이 파일 → window.OFF06      node: require('./off06.js')
 * 난수는 mfgsim 의 rng·hashSeed 만 쓴다(시드만 씀, 시각·무작위 함수 없음). mfgsim.js·rl06.js 는 읽어서 부르기만 하고 고치지 않는다. 같은 규칙을 파이썬(페이지 코드)이 CSV 에서 다시 구현하고 verify.py 가 대조한다.
 * 숨은 '실제' 세정 시간(Loop06.HIDDEN.CLEAN)은 buildThr(build_csv.mjs 전용)·exactTrue(정답 열기와 verify)에서만 읽고 표 파일·CSV·본문에는 넣지 않는다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./rl06.js'), function () { try { return require('./off06_tables.js'); } catch (e) { return null; } });
  else root.OFF06 = factory(root.MfgSim, root.RL06, function () { return root.OFF06_TABLES || null; });
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, RL, tabFn) {
  'use strict';
  var NSTATE = RL.NSTATE, EP = RL.EP, TR = RL.TR, DMAX = RL.DMAX, KMAX = RL.KMAX, WMAX = RL.WMAX, RMAX = RL.RMAX, NS = RL.NS;
  var LOG_TAG = 'S21off';
  var EPS_DEF = 0.1, N_DEF = 300, BETA_DEF = 144, SWEEPS = 80;            // 기록 정책 탐색률 · 로그 판 수 · 벌점 세기(교체 한 번 48장의 3배 = 도착 전에 바꿀 때의 최대 교체 손실) · 값 갱신 횟수(고정)
  var EPS_GRID = [0, 0.01, 0.03, 0.1, 0.3], N_GRID = [100, 300, 1000, 3000], BETA_GRID = [0, 24, 48, 96, 144, 192, 288, 480];
  var SEEDS = 200;
  function T() { var t = tabFn(); if (!t) throw new Error('OFF06_TABLES 를 먼저 읽으십시오'); return t; }
  function r4(v) { return Math.round(v * 1e4) / 1e4; }
  function r8(v) { return Math.round(v * 1e8) / 1e8; }

  /* ---------- 1. 도착 시각: 난수 재료 → 도착 간격 수 ---------- */
  /* 도착 간격 수 D 는 e = e1 + e2 가 문턱 thr[d] 를 넘는 개수로 정한다: D ≥ d ⇔ e > thr[d] (d = 2..DMAX). 문턱표는 build_csv.mjs 가 '실제' 세정 시간으로 만든다(숨은 값 비노출). */
  function dOf(e, thr) { var d = 1, i; for (i = 2; i <= DMAX; i++) { if (e > thr[i - 2]) d = i; else break; } return d; }
  /* 문턱표 만들기(build_csv.mjs 와 정답 열기 전용): 세정 시간 clean 에서 d 마다 D ≥ d 가 되는 e 의 하한 */
  function buildThr(clean, wq) { var w = RL.wqOf(clean, wq), out = [], d; for (d = 2; d <= DMAX; d++) out.push(r8((EP * (d - 1) - clean - TR) / (0.5 * w))); return out; }

  /* ---------- 2. 로그 만들기 ---------- */
  /* 기록 정책(지금 규칙 + ε): 판단마다 확률 ε 로 두 행동 가운데 하나를 무작위로(0 또는 1, 각각 ε/2), 아니면 지금 규칙(기다림). 고른 확률도 함께 적는다(0604 와 같은 방식).
   * 판 i 의 난수는 (시드, 판 번호) 로 따로 뽑으므로 n 을 늘려도 앞 판이 그대로이고, 같은 판의 상황(남은 유리·도착)은 ε 가 달라도 같다. */
  function makeLog(seed, o) {
    o = o || {}; var eps = o.eps == null ? EPS_DEF : o.eps, n = o.n == null ? N_DEF : o.n, thr = o.thr || T().thr, rows = [], i;
    for (i = 0; i < n; i++) {
      var g = MS.rng(MS.hashSeed(LOG_TAG, seed, i)), r0 = RL.R_LO + g.int(RL.R_HI - RL.R_LO + 1), e = g.exp(1) + g.exp(1), D = dOf(e, thr);
      var r = r0, k = 0, arrived = false, w = 0, t = 0, guard = 0;
      while (guard++ < 400) {
        var s = RL.sidx(r, arrived, k, w), u = g.u(), c = g.int(2), a = u < eps ? c : 0;
        var st = RL.step(r, k, arrived, w, a, D, RL.COST), s2 = st.done ? -1 : RL.sidx(st.r, st.arrived, st.k, st.w);
        rows.push({ ep: i + 1, t: t, s: s, a: a, p: a === 0 ? 1 - eps / 2 : eps / 2, rew: -(st.idle + st.hold + st.sw), done: st.done ? 1 : 0, s2: s2, r: r, k: k, arrived: arrived ? 1 : 0, w: w });
        if (st.done) break; r = st.r; k = st.k; arrived = st.arrived; w = st.w; t++;
      }
    }
    return rows;
  }

  /* ---------- 3. 횟수표 · 행동 복제 ---------- */
  function countTable(log) { var N = new Int32Array(2 * NSTATE), i; for (i = 0; i < log.length; i++) N[2 * log[i].s + log[i].a]++; return N; }
  /* 행동 복제: 칸마다 로그에서 더 자주 고른 행동(같거나 본 적 없으면 기다림 = 지금 규칙) */
  function behaviorClone(log) { var N = countTable(log), pol = new Int8Array(NSTATE), s; for (s = 0; s < NSTATE; s++) pol[s] = N[2 * s + 1] > N[2 * s] ? 1 : 0; return pol; }

  /* ---------- 4. 오프라인 Q (단순 · 보수적) ---------- */
  /* 로그만으로 만든 경험 모형(칸·행동마다 평균 보상과 다음 칸 비율)에 값 갱신을 SWEEPS 번 한다. 보수적이면 갱신에서 Q̃ = Q − β/√(n+1) 을 쓴다(로그에 드문 행동일수록 깎음). β = 0 이 단순 오프라인 Q.
   * 본 적 없는 (칸, 행동)은 Q = 0 에서 출발해 그대로 둔다(보상이 모두 0 이하라서 가장 좋은 값처럼 보임). */
  function offlineQ(log, beta, sweeps, stack) {
    beta = beta == null ? 0 : beta; sweeps = sweeps == null ? SWEEPS : sweeps;
    var N = countTable(log), RS = new Float64Array(2 * NSTATE), nxt = {}, i, j;
    for (i = 0; i < log.length; i++) { var L = log[i], x = 2 * L.s + L.a; RS[x] += L.rew; if (!L.done) { var kk = x + ',' + L.s2; nxt[kk] = (nxt[kk] || 0) + 1; } }
    var xs = [], tos = [], cnt = []; Object.keys(nxt).forEach(function (key) { var p = key.split(','); xs.push(+p[0]); tos.push(+p[1]); cnt.push(nxt[key]); });
    var Q = new Float64Array(2 * NSTATE), pen = new Float64Array(2 * NSTATE), x;
    for (x = 0; x < 2 * NSTATE; x++) pen[x] = N[x] > 0 ? beta / Math.sqrt(N[x] + 1) : beta;
    var Qp = new Float64Array(2 * NSTATE), it, V = new Float64Array(NSTATE), s;
    for (x = 0; x < 2 * NSTATE; x++) Qp[x] = -pen[x];
    for (it = 0; it < sweeps; it++) {
      for (s = 0; s < NSTATE; s++) { var a1 = Qp[2 * s + 1] > Qp[2 * s] ? 1 : 0; V[s] = stack ? Qp[2 * s + a1] : Q[2 * s + a1]; }   // 고르기는 벌점 뒤 값으로, 값을 이어받을 때는 고른 행동의 벌점 전 값(stack 이면 벌점 뒤 값 = 벌점이 판 길이만큼 쌓임)
      var acc = new Float64Array(2 * NSTATE);
      for (j = 0; j < xs.length; j++) acc[xs[j]] += cnt[j] * V[tos[j]];
      for (x = 0; x < 2 * NSTATE; x++) { Q[x] = N[x] > 0 ? (RS[x] + acc[x]) / N[x] : 0; Qp[x] = Q[x] - pen[x]; }
    }
    return { Q: Q, Qp: Qp, N: N, beta: beta };
  }
  function policyFromPen(Qp) { var pol = new Int8Array(NSTATE), s; for (s = 0; s < NSTATE; s++) pol[s] = Qp[2 * s + 1] > Qp[2 * s] ? 1 : 0; return pol; }

  /* ---------- 5. 한 로그·한 방식 결과 ---------- */
  function methodPolicy(id, log, beta, stack) {
    if (id === 'rule') return RL.rulePolicy();
    if (id === 'bc') return behaviorClone(log);
    if (id === 'naive') return policyFromPen(offlineQ(log, 0).Qp);
    if (id === 'cons') return policyFromPen(offlineQ(log, beta == null ? BETA_DEF : beta, null, stack).Qp);
    return null;
  }
  function realLoss(pol) { return RL.evalPolicy(pol, RL.realEpisodes(), RL.COST); }
  var METHODS = [{ id: 'rule', name: '지금 규칙 (끝까지 기다림)' }, { id: 'bc', name: '행동 복제' }, { id: 'naive', name: '단순 오프라인 Q' }, { id: 'cons', name: '보수적 Q' }];
  /* 한 시드의 한 설정: 로그 → 세 방식의 실제 Loss 와 근거 없는 선택(ood_check, 판당 평균 개수) */
  function runSeed(seed, o) {
    o = o || {}; var log = makeLog(seed, o), out = { seed: seed, nlog: log.length }, N = countTable(log), ids = ['bc', 'naive', 'cons'], i;
    for (i = 0; i < ids.length; i++) { var pol = methodPolicy(ids[i], log, o.beta); out[ids[i]] = realLoss(pol).mean; out[ids[i] + '_ood'] = oodCheck(pol, N).per; }
    return out;
  }
  function quantile(x, p) { var b = Array.prototype.slice.call(x).sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }

  /* ---------- 6. 분포 밖 행동 격자 ---------- */
  /* 칸 s 에서 '지금 교체'의 참 값: 교체하면 판이 끝나므로 −(교체 손실) 하나뿐(보상 규칙에서 바로 나옴). 단순 Q 가 그 칸을 몇 번 봤는지·값을 얼마나 부풀렸는지 */
  function trueReplace(s) {
    var r = Math.floor(s / NS), j = s % NS, arrived = j > KMAX, st = RL.step(r, arrived ? 0 : j, arrived, arrived ? j - KMAX - 1 : 0, 1, 1, RL.COST);
    return -st.sw;
  }
  function validState(s) { var r = Math.floor(s / NS), j = s % NS; return !(j > KMAX && r === 0); }  // r = 0 에서 도착 뒤 칸은 판이 이미 끝남
  /* 격자: 도착 전 (남은 유리 r × 경과 k) 셀마다 {n1: 교체를 본 횟수, n0: 기다림을 본 횟수, over: 단순 Q(교체) − 참 값, picked: 단순 Q 가 교체를 고르는가, bad: 그 선택이 참 값에서 손해인가는 정답 열기 쪽} */
  function oodGrid(log, beta) {
    var q = offlineQ(log, beta == null ? 0 : beta), N = q.N, cells = [], r, k;
    for (r = 0; r <= RMAX; r++) for (k = 0; k <= KMAX; k++) {
      var s = RL.sidx(r, false, k, 0), n0 = N[2 * s], n1 = N[2 * s + 1];
      cells.push({ r: r, k: k, s: s, n0: n0, n1: n1, q0: q.Q[2 * s], q1: q.Q[2 * s + 1], qp0: q.Qp[2 * s], qp1: q.Qp[2 * s + 1], over: q.Q[2 * s + 1] - trueReplace(s), pick: q.Qp[2 * s + 1] > q.Qp[2 * s] ? 1 : 0, truth1: trueReplace(s) });
    }
    return cells;
  }

  /* ---------- 7. 정답 열기: 숨은 실제 세정 시간으로 계산한 참 값 (정답 열기와 verify 전용) ---------- */
  /* 도착 전 칸 (r, k) 에서 '아직 안 왔다'는 조건일 때 다음 간격에 도착할 확률 h(k) = P(D = k+1) / P(D > k). e = e1 + e2 는 감마(2, 1) 이라 P(e > x) = (1 + x) e^(−x).
   * pol 이 있으면 그 정책을, 없으면 가장 좋은 행동(같으면 기다림)을 따를 때의 칸마다 참 Q 와 판당 기대 Loss 를 뒤에서부터 계산한다. */
  function surv(x) { return x <= 0 ? 1 : (1 + x) * Math.exp(-x); }
  function exactTrue(clean, wq, pol) {
    var thr = buildThr(clean, wq), PD = new Array(DMAX + 2), d, C = RL.COST, r, k, w, W2 = 24;
    for (d = 1; d <= DMAX; d++) { var lo = d === 1 ? 0 : thr[d - 2], hi = d === DMAX ? null : thr[d - 1]; PD[d] = surv(lo) - (hi === null ? 0 : surv(hi)); }
    var S = new Array(DMAX + 2); S[DMAX + 1] = 0; for (d = DMAX; d >= 1; d--) S[d] = S[d + 1] + PD[d];
    function pick(q0, q1, forced) { return forced != null ? forced : (q1 > q0 ? 1 : 0); }
    var A0 = [], A1 = [], VA = [];
    for (r = 0; r <= RMAX; r++) { A0.push(new Array(W2 + 2).fill(0)); A1.push(new Array(W2 + 2).fill(0)); VA.push(new Array(W2 + 2).fill(0)); }
    for (r = 1; r <= RMAX; r++) for (w = 0; w <= W2; w++) {
      var hold = C.hold * (w + 1), q1 = -2 * C.csw, q0 = r - 1 === 0 ? -(hold + C.csw) : -hold + VA[r - 1][Math.min(w + 1, W2)];
      A0[r][w] = q0; A1[r][w] = q1; VA[r][w] = pick(q0, q1, pol ? pol[RL.sidx(r, true, 0, w)] : null) ? q1 : q0;
    }
    var N0 = [], N1 = [], VN = [];
    for (r = 0; r <= RMAX; r++) { N0.push(new Array(DMAX + 1).fill(0)); N1.push(new Array(DMAX + 1).fill(0)); VN.push(new Array(DMAX + 2).fill(0)); }
    for (k = DMAX - 1; k >= 0; k--) for (r = 0; r <= RMAX; r++) {
      var idle = r > 0 ? 0 : C.idle, nr = r > 0 ? r - 1 : 0, h = S[k + 1] > 0 ? PD[k + 1] / S[k + 1] : 1, qa = r > 0 ? -C.csw * 3 : -C.csw * 2;
      var vArr = nr === 0 ? -(idle + C.csw) : -idle + VA[nr][0];
      var vNot = k + 1 < DMAX ? -idle + VN[nr][k + 1] : vArr;
      var q0b = h * vArr + (1 - h) * vNot;
      N0[r][k] = q0b; N1[r][k] = qa; VN[r][k] = pick(q0b, qa, pol ? pol[RL.sidx(r, false, Math.min(k, KMAX), 0)] : null) ? qa : q0b;
    }
    var tot = 0; for (r = RL.R_LO; r <= RL.R_HI; r++) tot += VN[r][0];
    return { loss: -tot / (RL.R_HI - RL.R_LO + 1), Q0: N0, Q1: N1, PD: PD };
  }
  /* 판 목록에서 정책이 로그에서 nmin 번 미만 본 행동을 고르는 판단: {판당 평균 개수, 그런 판단이 하나라도 있는 판의 비율} (ood_check) */
  function oodCheck(pol, N, nmin, eps) {
    nmin = nmin == null ? 3 : nmin; eps = eps || RL.realEpisodes(); var C = RL.COST, cnt = 0, hit = 0, i;
    for (i = 0; i < eps.length; i++) {
      var r = eps[i].r0, k = 0, arrived = false, w = 0, D = eps[i].D, g = 0, any = 0;
      while (g++ < 400) { var s = RL.sidx(r, arrived, k, w), a = pol[s], st = RL.step(r, k, arrived, w, a, D, C); if (N[2 * s + a] < nmin) any++; if (st.done) break; r = st.r; k = st.k; arrived = st.arrived; w = st.w; }
      cnt += any; if (any > 0) hit++;
    }
    return { per: cnt / eps.length, share: hit / eps.length };
  }

  /* ---------- 8. 시드 요약표 · 대표 시드 · CSV 줄 (build_csv.mjs 전용) ---------- */
  function pctOf(vals, v) { var lt = 0, eq = 0; vals.forEach(function (x) { if (x < v - 1e-9) lt++; else if (Math.abs(x - v) <= 1e-9) eq++; }); return 100 * (lt + 0.5 * eq) / vals.length; }
  /* 기본 설정(ε·로그 판 수·벌점)에서 시드 1..SEEDS 의 [naive, cons, naive − cons, naive 의 근거 없는 선택] 백분위가 50 에서 떨어진 정도의 합이 가장 작은 시드(같으면 작은 시드) */
  function pickRep(rows) {
    var cols = [function (r) { return r.naive; }, function (r) { return r.cons; }, function (r) { return r.naive - r.cons; }, function (r) { return r.naive_ood; }], best = null, i;
    var cv = cols.map(function (f) { return rows.map(f); });
    for (i = 0; i < rows.length; i++) { var sc = 0; cols.forEach(function (f, j) { sc += Math.abs(pctOf(cv[j], f(rows[i])) - 50); }); if (best === null || sc < best.score - 1e-9) best = { seed: rows[i].seed, score: sc }; }
    return best;
  }
  function logCsv(log) {
    return log.map(function (L) {
      return { episode: L.ep, step: L.t, remaining_glass: L.r, arrived: L.arrived, elapsed_or_wait: L.arrived ? L.w : L.k, action: L.a, propensity: r8(L.p), reward: L.rew, done: L.done };
    });
  }
  return { LOG_TAG: LOG_TAG, EPS_DEF: EPS_DEF, N_DEF: N_DEF, BETA_DEF: BETA_DEF, SWEEPS: SWEEPS, EPS_GRID: EPS_GRID, N_GRID: N_GRID, BETA_GRID: BETA_GRID, SEEDS: SEEDS, METHODS: METHODS,
    dOf: dOf, buildThr: buildThr, makeLog: makeLog, countTable: countTable, behaviorClone: behaviorClone, offlineQ: offlineQ, policyFromPen: policyFromPen, methodPolicy: methodPolicy, realLoss: realLoss, runSeed: runSeed,
    trueReplace: trueReplace, validState: validState, oodGrid: oodGrid, exactTrue: exactTrue, oodCheck: oodCheck, NMIN: 3, pctOf: pctOf, pickRep: pickRep, logCsv: logCsv, quantile: quantile, r4: r4, r8: r8 };
});
