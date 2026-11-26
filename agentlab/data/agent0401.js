/* Agent0401 — 실험실 0401 의 계산 모듈: S15 적재본 14일 위에서 하루 한 바퀴(관찰 → 점검 → 분석 → 결정 → 요청 → 보고)를 도는 에이전트의 뼈대.
 * 브라우저: mfgsim.js · llm_runs_0410.js · llmcheck.js · llm_runs_0411.js · llmverify.js 다음에 <script src="agent0401.js"> → window.Agent0401
 * node    : require('./agent0401.js')
 * 난수 없음. mfgsim.js(s15tools · requestTransition · ESTC)와 llmverify.js(validate · render)는 읽어서 부르기만 하고 고치지 않습니다.
 * 같은 규칙을 파이썬(페이지 10절 코드)이 다시 구현해 verify.py 가 대조합니다. LLM 호출 없음 — 보고 문장은 정해 둔 틀로 만듭니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./llmverify.js'));
  else root.Agent0401 = factory(root.MfgSim, root.LlmVerify);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, LV) {
  'use strict';
  var SC = MS.scenario('S15'), T = MS.s15tools, P = SC.params, CHK = T.CH.map(function (c) { return c.key; }), DAYS = P.days, DAYMIN = T.DAY_MIN;
  var MIN_N = 6, REPAIR_DAYS = 3, ALPHA = 0.05, SPEC_GAP = 3;
  var POLICY0 = { tol: 0, k: 2, m: 3, delta: 0.5, bonf: true, ex_n: 6, repair_cap: 2, repair_human: false, spec_reject: false, scrap_ratio: 0.5, spec_share: 0.1 };
  var RULE_KO = { rows: '행 수', dup: 'glass_id 중복', cols: '필수 열 존재', blank: '빈칸 비율', join: '이음 비율', ts: 'ts 범위·순서', model: 'model_ver 종류' };
  var KIND_KO = { baseline: '새 마스크 기준 측정', correct: '보정값 입력', repair: '리페어', scrap: '마스크 제외(scrap)', spec: 'spec 변경' };
  var VERDICT_KO = { ok: '허용', guard: '가드 거절', table: '표에 없음 거절', queue: '승인 대기', auto: '정책 자동 반려', applied: '승인·실행', rejected: '반려', guardlate: '승인했으나 가드 거절' };

  /* ---------- 통계 (0104 판정 흐름에 쓰는 것만, 자체 구현) ---------- */
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function sd(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
  function quantile(x, p) { var b = x.slice().sort(function (a, c) { return a - c; }), pos = (b.length - 1) * p, lo = Math.floor(pos), f = pos - lo; return lo + 1 < b.length ? b[lo] + (b[lo + 1] - b[lo]) * f : b[lo]; }
  function lag1(x) { var m = mean(x), num = 0, den = 0, i; for (i = 0; i < x.length; i++) { den += (x[i] - m) * (x[i] - m); if (i) num += (x[i] - m) * (x[i - 1] - m); } return den === 0 ? 0 : num / den; }
  function gammln(x) { var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  }
  function betai(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; var bt = Math.exp(gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  function tp2(t, df) { return betai(df / 2, 0.5, df / (df + t * t)); }
  function r3(x) { return Math.floor(x * 1000 + 0.5) / 1000; }

  /* ---------- 1. 관찰: 날마다 한 번 만들어 두는 표 (정책과 무관) ---------- */
  var RUN = T.runAll(SC), OBS = [];
  var IN_USE = SC.loaded.mask_hist.filter(function (r) { return r.state === 'IN_USE'; });
  function maskAt(chKey, t) {                                   // 시각 t 에 챔버에 걸린 마스크 이력 줄
    var hit = null; IN_USE.forEach(function (r) { if (r.block + '-' + r.chamber === chKey && r.from_ts <= t - 1 && t - 1 < r.to_ts) hit = r; }); return hit;
  }
  function baseState(id, t) {                                   // mask_hist 의 상태 이름을 ESTC 이름으로: IN_USE → in_use, WASH → cleaning, 이력에 없으면 stock
    var s = 'stock';
    SC.loaded.mask_hist.forEach(function (r) { if (r.mask_id === id && r.from_ts <= t - 1 && t - 1 < r.to_ts) { s = r.state === 'IN_USE' ? 'in_use' : r.state === 'WASH' ? 'cleaning' : 'stock'; } });
    return s;
  }
  var MASK_IDS = {}; SC.loaded.mask_hist.forEach(function (r) { MASK_IDS[r.mask_id] = 1; }); SC.masks.forEach(function (m) { if (m.mask_b) MASK_IDS[m.mask_b] = 1; });
  for (var k = 1; k <= DAYS; k++) {
    var asOf = k * DAYMIN, ex = T.extract(SC.loaded, k, asOf), rows = T.join(ex.fdcW, ex.ppaW), day = RUN.days[k - 1], ch = {}, mk = {};
    CHK.forEach(function (c) { ch[c] = { vals: [], mets: [], ord: [] }; var h = maskAt(c, asOf); mk[c] = h ? { id: h.mask_id, from: h.from_ts } : null; });
    rows.forEach(function (r) {
      var o = ch[r.f.block + '-' + r.f.chamber]; if (!o) return;
      o.ord.push({ g: r.f.glass_id, v: r.f.chamber_temp != null ? r.p.Mx - P.thermal * (r.f.chamber_temp - P.T_ref) : null, m: r.p.ppa_metric });
    });
    CHK.forEach(function (c) {
      var o = ch[c]; o.ord.sort(function (x, y) { return x.g < y.g ? -1 : x.g > y.g ? 1 : 0; });          // 같은 챔버는 glass_id 순 = 시간순, 같은 id 는 값이 같다
      o.ord.forEach(function (x) { if (x.v != null) o.vals.push(x.v); o.mets.push(x.m); });
    });
    OBS.push({ day: k, t: asOf, checks: day.checks, fails: day.checks.filter(function (c) { return !c.pass; }).map(function (c) { return c.id; }), n_fdc: ex.fdcW.length, n_ppa: ex.ppaW.length,
      fp: T.fp(T.inLines(ex.fdcW, ex.ppaW)), ch: ch, mask: mk, truth_faults: SC.faults[k - 1].kinds.slice(), wrong: day.wrong });
  }
  var MASK0 = {}; CHK.forEach(function (c) { var h = maskAt(c, 1); MASK0[c] = h.mask_id; });

  /* ---------- 2. 한 바퀴를 하루씩 ---------- */
  function copy(o) { var r = {}; Object.keys(o).forEach(function (k2) { r[k2] = o[k2]; }); return r; }
  function dayMean(o) { return o && o.vals.length ? mean(o.vals) : null; }
  function snapshot(S, t) {                                      // 요청 판정에 쓰는 마스크 상태 스냅샷
    var st = {}, cleaning = 0;
    Object.keys(MASK_IDS).forEach(function (id) { var s = S.mstate[id] || baseState(id, t); st['mask:' + id] = s; if (s === 'cleaning') cleaning++; });
    return { t: t, states: st, repairPath: {}, cleaning: cleaning, clean_wait: 0 };
  }
  function nRepair(S) { var n = 0; Object.keys(S.mstate).forEach(function (id) { if (S.mstate[id] === 'repair') n++; }); return n; }

  function detect(S, d, pol, an) {                               // 변경점 판정: 최근 k일 vs 그 전 m일, 대조 = 다른 챔버의 하루 중앙값(이중차분), 이음새 닮음(자기상관) 보정 Welch, 다중 비교
    var rec = [], bef = [], j, out = { enough: false, rows: [], alpha: pol.bonf ? ALPHA / CHK.length : ALPHA, flagged: [] };
    an.forEach(function (x) { if (x <= d && x > d - pol.k) rec.push(x); else if (x <= d - pol.k && x > d - pol.k - pol.m) bef.push(x); });
    out.rec = rec; out.bef = bef; if (!rec.length || !bef.length) return out;
    out.enough = true;
    function cv(c, jj) { var ms = []; CHK.forEach(function (c2) { if (c2 !== c) { var m = dayMean(S.data[jj][c2]); if (m != null) ms.push(m); } }); return ms.length ? median(ms) : null; }
    CHK.forEach(function (c) {
      var rR = [], rB = [], row = { key: c };
      rec.forEach(function (jj) { var cc = cv(c, jj); S.data[jj][c].vals.forEach(function (v) { if (cc != null) rR.push(v - cc); }); });
      bef.forEach(function (jj) { var cc = cv(c, jj); S.data[jj][c].vals.forEach(function (v) { if (cc != null) rB.push(v - cc); }); });
      if (rR.length < MIN_N || rB.length < MIN_N) { row.skip = true; out.rows.push(row); return; }
      var phi = Math.max(0, (lag1(rR) + lag1(rB)) / 2), neR = Math.max(rR.length * (1 - phi) / (1 + phi), 2), neB = Math.max(rB.length * (1 - phi) / (1 + phi), 2);
      var vR = sd(rR) * sd(rR) / neR, vB = sd(rB) * sd(rB) / neB, se = Math.sqrt(vR + vB), eff = mean(rR) - mean(rB), t = eff / se, df = (vR + vB) * (vR + vB) / (vR * vR / (neR - 1) + vB * vB / (neB - 1)), p = tp2(t, df);
      row.n_rec = rR.length; row.n_bef = rB.length; row.phi = phi; row.eff = eff; row.se = se; row.t = t; row.df = df; row.p = p; row.flag = Math.abs(eff) >= pol.delta && p <= out.alpha;
      out.rows.push(row); if (row.flag) out.flagged.push(c);
    });
    return out;
  }

  function causes(S, c, d, pol) {                                // 변경점 근처의 사건: 마스크 교체(이력 표 — 비교한 구간 전체) · 이벤트(이벤트 표 — 최근 구간과 그 하루 전). 후보일 뿐 확정이 아님
    var wm = (d - pol.k - pol.m) * DAYMIN, we = (d - pol.k) * DAYMIN - DAYMIN, w1 = d * DAYMIN, out = [];
    S.reps.forEach(function (r) { if (r.ch === c && r.ts >= wm && r.ts <= w1) out.push({ kind: '마스크 교체', ts: r.ts, text: r.from + ' → ' + r.to, rank: 0 }); });
    var RK = { '센서 교정': 1, 'PM': 2, '세정': 3, '인터락': 4 };
    (SC.evByCh[c] || []).forEach(function (e) { if (e.start_ts >= we && e.start_ts <= w1) out.push({ kind: e.kind, ts: e.start_ts, text: e.event_id, rank: RK[e.kind] }); });
    out.sort(function (a, b) { return a.rank - b.rank || a.ts - b.ts; });
    return out;
  }

  function newReq(S, d, kind, c, mask, text, rev, cites, extra) {
    var r = { id: 'R-' + (S.reqN < 9 ? '0' : '') + (++S.reqN), day: d, kind: kind, ch: c, mask: mask, text: text, reversible: rev, human: false, verdict: null, reason: '', cites: cites || [], status: null };
    if (extra) Object.keys(extra).forEach(function (k2) { r[k2] = extra[k2]; });
    return r;
  }
  function judge(S, r, pol, d) {                                 // 요청 판정: 표 → 사람 승인 → 가드(리페어 동시 한도) → 정책
    var t = d * DAYMIN;
    if (r.kind === 'baseline' || r.kind === 'correct') { r.verdict = 'ok'; r.reason = '기록만 남기는 요청이라 설비 상태를 바꾸지 않습니다'; r.status = 'done'; return r; }
    if (r.kind === 'spec') {
      r.human = true;
      if (pol.spec_reject) { r.verdict = 'auto'; r.reason = '정책: spec 변경은 자동 반려'; r.status = 'rejected'; } else { r.verdict = 'queue'; r.reason = 'ESTC 표 밖의 일이며 spec 은 사람이 정합니다'; r.status = 'pending'; }
      return r;
    }
    var to = r.kind === 'repair' ? 'repair' : 'scrapped', rt = MS.requestTransition(snapshot(S, t), 'mask', r.mask, to);
    r.table = rt;
    if (!rt.ok && rt.kind === 'not_in_table') { r.verdict = 'table'; r.reason = rt.reason; r.status = 'rejected'; return r; }
    if (!rt.ok && rt.kind === 'needs_human') { r.human = true; r.verdict = 'queue'; r.reason = rt.reason; r.status = 'pending'; return r; }
    if (r.kind === 'repair') {
      var n = nRepair(S);
      if (n >= pol.repair_cap) { r.verdict = 'guard'; r.reason = '리페어 동시 한도 ' + n + '/' + pol.repair_cap + ' 가 찼습니다'; r.status = 'rejected'; return r; }
      if (pol.repair_human) { r.human = true; r.verdict = 'queue'; r.reason = '정책: 리페어도 사람 승인'; r.status = 'pending'; return r; }
      S.mstate[r.mask] = 'repair'; S.repairUntil[r.mask] = d + REPAIR_DAYS; r.verdict = 'ok'; r.reason = '표에 있고 가드를 통과했습니다'; r.status = 'done'; return r;
    }
    r.verdict = 'ok'; r.status = 'done'; return r;
  }

  function decideQueue(S, d, pol, decisions) {                   // 어제 올린 요청에 대한 사람의 결정을 오늘 아침에 반영
    var done = [];
    S.queue.forEach(function (r) {
      if (r.status !== 'pending' || r.day !== d - 1) return;
      var dec = decisions && decisions[r.id]; if (!dec) return;
      r.decided_day = d; r.decision = dec;
      if (dec === 'reject') { r.status = 'rejected'; r.verdict = 'rejected'; r.reason = '학습자가 반려했습니다'; done.push(r); return; }
      if (r.kind === 'repair') {
        var n = nRepair(S);
        if (n >= pol.repair_cap) { r.status = 'rejected'; r.verdict = 'guardlate'; r.reason = '리페어 동시 한도 ' + n + '/' + pol.repair_cap + ' 가 차서 실행하지 못했습니다'; done.push(r); return; }
        S.mstate[r.mask] = 'repair'; S.repairUntil[r.mask] = d + REPAIR_DAYS;
      } else if (r.kind === 'scrap') { S.mstate[r.mask] = 'scrapped'; }
      else if (r.kind === 'spec') { S.spec = r.proposed; }
      r.status = 'done'; r.verdict = 'applied'; r.reason = '학습자가 승인해 ' + d + '일 아침에 실행했습니다'; done.push(r);
    });
    return done;
  }

  function run(policy, decisions) {
    var pol = copy(POLICY0); if (policy) Object.keys(policy).forEach(function (k2) { pol[k2] = policy[k2]; });
    var S = { spec: P.spec, data: {}, mstate: {}, repairUntil: {}, known: copy(MASK0), reps: [], open: {}, baseReq: {}, queue: [], reqN: 0, lastSpec: -99, an: [] };
    var days = [], k2;
    for (k2 = 1; k2 <= DAYS; k2++) {
      var o = OBS[k2 - 1], D = { day: k2, steps: [], requests: [], decided: [], flagged: [], det: null, causes: {}, skipped: null, analyzed: false, fails: o.fails.slice(), nfail: o.fails.length, truth: o.truth_faults };
      /* 오늘 아침: 어제 올린 요청에 대한 사람의 결정 반영 · 리페어 마친 마스크 복귀 */
      Object.keys(S.repairUntil).forEach(function (id) { if (S.repairUntil[id] === k2 && S.mstate[id] === 'repair') { delete S.mstate[id]; delete S.repairUntil[id]; } });
      D.decided = decideQueue(S, k2, pol, decisions);
      D.steps.push({ step: '관찰', tool: 'observe(day)', inp: k2 + '일 창 · 입력 지문 ' + o.fp, out: 'FDC ' + o.n_fdc + '줄 · PPA ' + o.n_ppa + '줄' });
      var pass = o.fails.length <= pol.tol;
      D.pass = pass;
      D.steps.push({ step: '점검', tool: 'run_checks', inp: '규칙 일곱', out: o.fails.length ? '실패 ' + o.fails.length + '개(' + o.fails.map(function (f) { return RULE_KO[f]; }).join('·') + ')' + (pass ? ' — 허용 수 ' + pol.tol + ' 이하라 분석' : ' — 분석 안 함') : '전부 통과' });
      if (!pass) { D.skipped = 'check'; D.steps.push({ step: '분석', tool: '—', inp: '—', out: '건너뜀(자료 실패 알림만)' }); D.steps.push({ step: '결정', tool: '—', inp: '—', out: '없음' }); D.steps.push({ step: '요청', tool: '—', inp: '—', out: '없음' }); }
      else {
        S.data[k2] = o.ch; S.an.push(k2); D.analyzed = true;
        /* 마스크 교체 관찰(마스크 이력 표 — 점검을 통과한 날에만 읽음) */
        CHK.forEach(function (c) { var cur = o.mask[c]; if (cur && cur.id !== S.known[c]) { S.reps.push({ ch: c, from: S.known[c], to: cur.id, ts: cur.from, seen: k2 }); S.known[c] = cur.id; } });
        var det = detect(S, k2, pol, S.an); D.det = det;
        D.steps.push({ step: '분석', tool: 'analyze → detect_change', inp: '최근 ' + pol.k + '일 vs 그 전 ' + pol.m + '일(분석한 날만)', out: det.enough ? '변경점 ' + det.flagged.length + '곳(' + (det.flagged.join('·') || '없음') + ')' : '비교할 날이 모자라 판정 안 함' });
        var dec = [], reqs = [];
        /* 새 마스크 기준 측정 */
        S.reps.forEach(function (r) {
          if (S.baseReq[r.to]) return; S.baseReq[r.to] = 1;
          if (S.mstate[r.to] == null) S.mstate[r.to] = 'in_use';
          var q = judge(S, newReq(S, k2, 'baseline', r.ch, r.to, r.ch + ' 의 새 마스크 ' + r.to + ' 기준 측정을 요청', true, ['rep']), pol, k2); q.rep = r; reqs.push(q);
          dec.push({ ch: r.ch, text: '마스크 교체(' + r.from + ' → ' + r.to + ')를 이력 표에서 확인 → 기준이 없는 마스크로 수명을 내지 않고 기준 측정을 요청' });
        });
        /* 변경점마다 원인 후보 → 조치 */
        CHK.forEach(function (c) {
          var flag = det.flagged.indexOf(c) >= 0;
          if (!flag) { if (S.open[c]) delete S.open[c]; return; }
          if (S.open[c]) return;                                  // 이미 알린 변경점
          S.open[c] = k2; D.flagged.push(c);
          var cs = causes(S, c, k2, pol); D.causes[c] = cs; var row = det.rows.filter(function (x) { return x.key === c; })[0];
          var mask = S.known[c], E = 0, Nn = 0; det.rec.forEach(function (jj) { var oo = S.data[jj][c]; Nn += oo.mets.length; oo.mets.forEach(function (m) { if (m > S.spec) E++; }); });
          var primary = cs.length ? cs[0] : null;
          if (primary && primary.kind === '마스크 교체') { dec.push({ ch: c, text: c + ' 변경점의 원인 후보 = 마스크 교체 → 리페어가 아니라 기준 측정(위 요청)으로' }); return; }
          var share = Nn ? E / Nn : 0;
          if (E >= pol.ex_n && share >= pol.scrap_ratio) { dec.push({ ch: c, text: c + ' 지표 초과 ' + E + '/' + Nn + '장(' + Math.round(share * 100) + '%) — 되돌릴 수 없는 마스크 제외 후보' }); reqs.push(judge(S, newReq(S, k2, 'scrap', c, mask, c + ' 마스크 ' + mask + ' 제외를 요청', false, []), pol, k2)); }
          else if (E >= pol.ex_n) { dec.push({ ch: c, text: c + ' 지표 초과 ' + E + '/' + Nn + '장 → 리페어 후보' }); reqs.push(judge(S, newReq(S, k2, 'repair', c, mask, c + ' 마스크 ' + mask + ' 리페어를 요청', true, []), pol, k2)); }
          else { dec.push({ ch: c, text: c + ' 지표 초과 ' + E + '/' + Nn + '장 — 리페어까지는 아님 → 보정값 입력 후보' }); reqs.push(judge(S, newReq(S, k2, 'correct', c, mask, c + ' 보정값 ' + (row.eff >= 0 ? '−' : '+') + Math.abs(row.eff).toFixed(3) + ' ppm 입력을 요청', true, [], { corr: -row.eff }), pol, k2)); }
        });
        /* spec 변경 제안 */
        if (det.enough || S.an.length) {
          var rcs = S.an.filter(function (x) { return x <= k2 && x > k2 - pol.k; }), allM = [], ex2 = 0;
          rcs.forEach(function (jj) { CHK.forEach(function (c) { S.data[jj][c].mets.forEach(function (m) { allM.push(m); if (m > S.spec) ex2++; }); }); });
          var sh = allM.length ? ex2 / allM.length : 0; D.share = sh;
          var pend = S.queue.some(function (q) { return q.kind === 'spec' && q.status === 'pending'; });
          if (sh >= pol.spec_share && !pend && S.lastSpec + SPEC_GAP <= k2) {
            var prop = r3(quantile(allM, P.spec_q)), top = null, topE = -1; S.lastSpec = k2;
            CHK.forEach(function (c) { var e3 = 0; rcs.forEach(function (jj) { S.data[jj][c].mets.forEach(function (m) { if (m > S.spec) e3++; }); }); if (e3 > topE) { topE = e3; top = c; } });
            if (prop > S.spec) { var q2 = newReq(S, k2, 'spec', null, null, 'spec 을 ' + S.spec.toFixed(3) + ' → ' + prop.toFixed(3) + ' µm 으로 올리자고 요청', false, [], { proposed: prop, share: sh, spec0: S.spec, top: top, top_share: ex2 ? topE / ex2 : 0 }); reqs.push(judge(S, q2, pol, k2)); dec.push({ ch: null, text: '최근 ' + rcs.length + '일 전체 유리의 ' + Math.round(sh * 100) + '%가 spec 을 넘음(그 가운데 ' + Math.round(100 * topE / ex2) + '%가 ' + top + ') → spec 변경 요청(되돌릴 수 없음)' }); }
          }
        }
        D.decisions = dec; D.requests = reqs;
        D.steps.push({ step: '결정', tool: 'decide', inp: '정책 문턱 · 원인 후보', out: dec.length ? dec.length + '건' : '없음' });
        D.steps.push({ step: '요청', tool: 'request → requestTransition', inp: reqs.length + '건', out: reqs.length ? reqs.map(function (q) { return q.id + ' ' + VERDICT_KO[q.verdict]; }).join(' · ') : '없음' });
        reqs.forEach(function (q) { S.queue.push(q); });
      }
      if (!D.decisions) D.decisions = [];
      D.report = report(S, D, o, pol);
      D.steps.push({ step: '보고', tool: 'report → validate', inp: D.report.facts.length + '개 사실', out: D.report.v.pass ? '검사 V1~V6 통과' : '검사 실패 ' + D.report.v.failSentences.length + '문장' });
      D.fp = o.fp; D.spec = S.spec; D.nrepair = nRepair(S); D.pending = S.queue.filter(function (q) { return q.status === 'pending'; }).length;
      days.push(D);
    }
    return { days: days, queue: S.queue, policy: pol, S: S, summary: summarize(days, S) };
  }

  function summarize(days, S) {
    var an = days.filter(function (d) { return d.analyzed; }).length, reqs = [], dn = 0, vp = 0, cs = 0;
    days.forEach(function (d) {
      d.requests.forEach(function (q) { reqs.push(q); }); dn += d.decisions.length; if (d.report.v.pass) vp++;
      JSON.parse(d.report.raw).sentences.forEach(function (x) { if (x.type === '원인' || x.type === '원인 미확인') cs++; });
    });
    function c(f) { return reqs.filter(f).length; }
    var hum = c(function (q) { return q.human; });
    return { analyzed: an, stopped: days.length - an, decisions: dn, requests: reqs.length, ok: c(function (q) { return q.verdict === 'ok'; }), refused: c(function (q) { return q.verdict === 'guard' || q.verdict === 'table' || q.verdict === 'auto'; }),
      queued: c(function (q) { return q.verdict === 'queue'; }), pending_end: S.queue.filter(function (q) { return q.status === 'pending'; }).length, report_pass: vp, alerts: days.length - an, approvals: hum, cause_sentences: cs, human_items: days.length - an + hum + cs };
  }

  /* ---------- 3. 보고: 사실 목록 + 정해 둔 문장 틀 → validate(V1~V6) → render ---------- */
  function fx(id, what, value, unit, kind, dec, source) { return { id: id, what: what, value: value, unit: unit, source: source, kind: kind, dec: dec == null ? 0 : dec }; }
  function report(S, D, o, pol) {
    var f = [], sent = [], n = 0;
    function add(what, value, unit, kind, dec, src) { n++; f.push(fx('f' + n, what, value, unit, kind, dec, src)); return '{{f' + n + '}}'; }
    var nf = o.fails.length, sf = add(o.day + '일 점검에서 실패한 규칙 수', nf, '개', 'value', 0, '자료 점검');
    sent.push({ text: nf ? '점검에서 실패한 규칙은 ' + sf + '개입니다(' + o.fails.map(function (x) { return RULE_KO[x]; }).join(', ') + ').' : '점검에서 실패한 규칙은 ' + sf + '개입니다.', cites: ['f1'], type: '사실' });
    if (!D.analyzed) {
      var id2 = add(D.day + '일 입력 지문', o.fp, '', 'value', 0, '0400 run_daily');
      sent.push({ text: '자료 점검이 허용 수를 넘어 분석하지 않고 알림만 냅니다. 입력 지문은 ' + id2 + '입니다.', cites: ['f1', 'f' + n], type: '사실' });
    } else {
      var det = D.det;
      if (!det.enough) sent.push({ text: '비교할 날이 모자라 변경점을 판정하지 않았습니다.', cites: [], type: '사실' });
      else if (!D.flagged.length) { var fa = add('새로 잡힌 변경점 수', D.flagged.length, '곳', 'value', 0, '변경점 판정'); sent.push({ text: '새로 잡힌 변경점은 ' + fa + '곳입니다.', cites: ['f' + n], type: '사실' }); }
      D.flagged.forEach(function (c) {
        var row = det.rows.filter(function (x) { return x.key === c; })[0], a = add(c + ' 보정 후 Mx 변화(대조 챔버 대비)', r3(row.eff), 'ppm', 'value', 3, '변경점 판정'), b = add(c + ' 변경점 p 값', row.p < 0.0001 ? '0.0001 미만' : row.p.toFixed(4), '', 'value', 0, '변경점 판정');
        sent.push({ text: c + ' 의 보정 후 Mx 가 대조 챔버 대비 ' + a + ' 달라졌습니다(p ' + b + ').', cites: ['f' + (n - 1), 'f' + n], type: '사실' });
        var cs = D.causes[c] || [];
        if (cs.length && cs[0].kind === '마스크 교체') { var e = add(c + ' 마스크 교체 시각', T.iso(cs[0].ts), '', 'event', 0, '마스크 이력'); sent.push({ text: '마스크 이력에 교체 ' + e + '가 있어 원인 후보입니다. 확정은 아닙니다.', cites: ['f' + n], type: '원인' }); }
        else if (cs.length) { var e2 = add(c + ' ' + cs[0].kind + ' 시작 시각', T.iso(cs[0].ts), '', 'event', 0, '이벤트 표'); sent.push({ text: cs[0].kind + ' 이벤트 시작 ' + e2 + '가 있어 원인 후보입니다. 확정은 아닙니다.', cites: ['f' + n], type: '원인' }); }
        else sent.push({ text: '원인으로 볼 사건을 찾지 못했습니다.', cites: [], type: '원인 미확인' });
      });
    }
    D.requests.forEach(function (q) {
      if (q.kind === 'spec') {
        var s0 = add('현재 spec', r3(q.spec0), 'µm', 'value', 3, 'spec'), s1 = add('제안한 spec', q.proposed, 'µm', 'value', 3, '최근 유리의 지표 분포'), sv = add(q.id + ' 요청 판정', VERDICT_KO[q.verdict], '', 'value', 0, '요청 판정');
        sent.push({ text: 'spec 을 ' + s0 + ' 에서 ' + s1 + ' 로 올리자고 요청했고 판정은 ' + sv + '입니다.', cites: [s0, s1, sv].map(function (x) { return x.replace(/[{}]/g, ''); }), type: '권고' });
      } else if (q.kind === 'correct') {
        var cv = add(q.ch + ' 보정값', r3(q.corr), 'ppm', 'value', 3, '변경점 판정'), v2 = add(q.id + ' 요청 판정', VERDICT_KO[q.verdict], '', 'value', 0, '요청 판정');
        sent.push({ text: q.ch + ' 에 보정값 ' + cv + ' 입력을 요청했고 판정은 ' + v2 + '입니다.', cites: [cv, v2].map(function (x) { return x.replace(/[{}]/g, ''); }), type: '권고' });
      } else {
        var v = add(q.id + ' 요청 판정', VERDICT_KO[q.verdict], '', 'value', 0, '요청 판정'); sent.push({ text: q.text + '했고 판정은 ' + v + '입니다.', cites: ['f' + n], type: '권고' });
      }
    });
    D.decided.forEach(function (q) { var v = add(q.id + ' 사람의 결정 결과', VERDICT_KO[q.verdict], '', 'value', 0, '승인 대기열'); sent.push({ text: '어제 올린 요청의 처리 결과는 ' + v + '입니다.', cites: ['f' + n], type: '사실' }); });
    var raw = JSON.stringify({ sentences: sent }), v = LV.validate(raw, f), rd = LV.render(raw, f) || [];
    return { facts: f, raw: raw, v: v, render: rd };
  }

  /* ---------- 4. 실행 기록 CSV 줄 · 승인 대기열 줄 ---------- */
  function logRows(res) {
    var out = [];
    res.days.forEach(function (d) {
      var o = OBS[d.day - 1];
      d.steps.forEach(function (s) { out.push({ day: d.day, step: s.step, tool: s.tool, input: s.inp, output: s.out, decision: '', cites: '', request: '', verdict: '', reason: '' }); });
      d.decisions.forEach(function (x) { out.push({ day: d.day, step: '결정', tool: 'decide', input: x.ch || '전체', output: x.text, decision: x.text, cites: '', request: '', verdict: '', reason: '' }); });
      d.requests.forEach(function (q) { out.push({ day: d.day, step: '요청', tool: q.kind === 'baseline' || q.kind === 'correct' || q.kind === 'spec' ? 'request' : 'requestTransition', input: q.text, output: q.id, decision: KIND_KO[q.kind], cites: d.report.facts.length ? 'f1~f' + d.report.facts.length : '', request: q.id, verdict: VERDICT_KO[q.verdict], reason: q.reason }); });
    });
    return out;
  }
  function queueRows(res) {
    return res.queue.filter(function (q) { return q.human || q.verdict === 'queue' || q.decision; }).map(function (q) {
      return { id: q.id, request: q.text, kind: KIND_KO[q.kind], reversible: q.reversible ? '예' : '아니오', basis: q.reason, requested_day: q.day, approver: q.decision ? '학습자' : '', decision: q.decision ? (q.decision === 'approve' ? '승인' : '반려') : '', decided_day: q.decided_day || '' };
    });
  }

  return { POLICY0: POLICY0, RULE_KO: RULE_KO, KIND_KO: KIND_KO, VERDICT_KO: VERDICT_KO, CH: CHK, DAYS: DAYS, OBS: OBS, MIN_N: MIN_N, REPAIR_DAYS: REPAIR_DAYS, ALPHA: ALPHA, SPEC_GAP: SPEC_GAP, SC: SC, run: run, logRows: logRows, queueRows: queueRows, summarize: summarize, snapshot: snapshot, baseState: baseState, tp2: tp2, lag1: lag1 };
});
