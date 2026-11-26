/* LlmCheck — 실험실 0410 의 계산 모듈: S15 정답본에서 표 1·2·3 과 원자료를 다시 만들고, LLM 답 18개의 숫자를 표와 견줍니다.
 * 브라우저: mfgsim.js · llm_runs_0410.js 다음에 <script src="llmcheck.js"> → window.LlmCheck
 * node    : require('./llmcheck.js')
 * 난수 없음. mfgsim.js 는 읽기만 하고 고치지 않습니다. 같은 규칙을 파이썬(페이지 10절 코드)이 다시 구현해 verify.py 가 대조합니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./llm_runs_0410.js'));
  else root.LlmCheck = factory(root.MfgSim, root.LLM_RUNS_0410);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, RUNS) {
  'use strict';
  var SC = MS.scenario('S15'), T = MS.s15tools, P = SC.params, KEYS = T.CH.map(function (c) { return c.key; });
  var EPS = 1e-9, TOLK = 0.5, NDAY = 7;

  function s3(x) { var s = x.toFixed(3); return s === '-0.000' ? '0.000' : s; }
  function pnum(v, d) { return String(+v.toFixed(d)); }
  function tsMin(s) { var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000; }
  var BASE = tsMin('2026-03-02 06:00');

  /* ---------- 1. 표 다시 만들기 (정답본, 1~7일, 06:00 창) ---------- */
  var MXV = KEYS.map(function () { return []; }), MXS = KEYS.map(function () { return []; }), EXV = KEYS.map(function () { return []; });
  for (var k = 1; k <= NDAY; k++) {
    var e = T.extract(SC.clean, k, 1e9), a = T.analyze(SC, e.fdcW, e.ppaW);
    a.ch.forEach(function (c, i) { var s = s3(c.mx); MXS[i].push(s); MXV[i].push(parseFloat(s)); EXV[i].push(c.ex); });
  }
  var HEAD = '챔버\t1일\t2일\t3일\t4일\t5일\t6일\t7일';
  var T1TEXT = HEAD + '\n' + KEYS.map(function (kk, i) { return kk + '\t' + MXS[i].join('\t'); }).join('\n');
  var T2TEXT = HEAD + '\n' + KEYS.map(function (kk, i) { return kk + '\t' + EXV[i].join('\t'); }).join('\n');
  var MH = SC.csvRows('mask_hist'), MHCOLS = ['mask_id', 'from_ts', 'to_ts', 'chamber', 'block', 'state'];
  var T3TEXT = MHCOLS.join(',') + '\n' + MH.map(function (r) { return MHCOLS.map(function (c) { return r[c]; }).join(','); }).join('\n');
  var e6 = T.extract(SC.clean, 6, 1e9), R6 = T.join(e6.fdcW, e6.ppaW).filter(function (r) { return r.f.block === 'B03' && r.f.chamber === 'CH2'; }).sort(function (x, y) { return x.f.ts - y.f.ts; });
  var RAW = R6.map(function (r) { return { id: r.f.glass_id, ts: T.iso(r.f.ts), mx: +pnum(r.p.Mx - P.thermal * (r.f.chamber_temp - P.T_ref), 4), pm: +pnum(r.p.ppa_metric, 3), pmFull: r.p.ppa_metric }; });
  var T6TEXT = 'glass_id,ts,Mx_comp,ppa_metric\n' + RAW.map(function (r) { return [r.id, r.ts, pnum(r.mx, 4), pnum(r.pm, 3)].join(','); }).join('\n');
  var SPEC3 = +P.spec.toFixed(3);

  var TASKS = RUNS.tasks;
  var TABLE_NEED = [[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0, 0, 1]];   // 과제별로 프롬프트 속에 들어 있어야 할 표: 표 1·표 2·표 3·원자료
  function tableChecks() {
    var out = [];
    TASKS.forEach(function (t, i) {
      [['표 1', T1TEXT], ['표 2', T2TEXT], ['표 3', T3TEXT], ['원자료', T6TEXT]].forEach(function (x, j) {
        var need = TABLE_NEED[i][j];
        if (need) out.push({ task: t.id, table: x[0], ok: t.prompt.indexOf(x[1]) >= 0, lines: x[1].split('\n').length });
      });
    });
    return out;
  }

  /* ---------- 2. 마스크 교체가 속한 날의 몫 (T4) ---------- */
  var WASH = MH.filter(function (r) { return r.state === 'WASH'; });
  var CHG = WASH.length ? WASH[0] : null;
  function maskInfo() {
    if (!CHG) return null;
    var tc = tsMin(CHG.from_ts), day = Math.floor((tc - BASE) / 1440) + 1, hb = (tc - (BASE + (day - 1) * 1440)) / 60, ha = 24 - hb;
    var ci = KEYS.indexOf(CHG.block + '-' + CHG.chamber), mv = MXV[ci];
    var vOld = (mv[day - 1] - (ha / 24) * mv[day]) / (hb / 24);                 // 교체 뒤 값 = 다음 날 값이라는 가정 → 옛 마스크만의 값
    var vNew = (mv[day - 1] * 24 - mv[day - 2] * hb) / ha;                       // 교체 앞 몫 = 전날 값이라는 가정 → 새 마스크 몫의 평균
    return { ts: CHG.from_ts, day: day, hb: hb, ha: ha, chamber: KEYS[ci], ci: ci, vOld: vOld, vNew: vNew, mid: mv[day - 1], prev: mv[day - 2], next: mv[day], next2: mv[day + 1], cellOld: mv[day - 2] };
  }
  var MASK = maskInfo();

  /* ---------- 3. 숫자 뽑기 ---------- */
  function blankAll(s, re, grp) {
    return s.replace(re, function () { var m = arguments[0], g = grp ? arguments[grp] : m; return m.slice(0, m.length - g.length) + new Array(g.length + 1).join(' '); });
  }
  var MASKS = [
    [/[A-Za-z][A-Za-z0-9_]*\d[A-Za-z0-9_]*(?:-[A-Za-z0-9_]+)*/g, 0],     // 챔버·마스크·유리 이름
    [/\d{4}-\d{2}-\d{2}/g, 0],                                           // 날짜
    [/(^|[^0-9-])(\d{2}-\d{2})(?![0-9-])/g, 2],                          // 월-일
    [/\d{1,2}:\d{2}/g, 0],                                               // 시각
    [/표[ \t]*\d+/g, 0],                                                 // 표 번호
    [/\d+[ \t]*[~∼][ \t]*\d+[ \t]*일(?:간)?/g, 0],                        // n~m일
    [/\d+[ \t]*일(?:간)?/g, 0],                                           // n일
    [/\d+[ \t]*월/g, 0],                                                 // n월
    [/\d+[ \t]*시(?!간)(?:[ \t]*\d+[ \t]*분)?/g, 0],                      // 01시 24분
    [/(^|[^0-9.])(\d+\))/g, 2]                                           // 1) 번호
  ];
  function extract(text) {
    var s = text; MASKS.forEach(function (m) { s = blankAll(s, m[0], m[1]); });
    var re = /([+\-−])?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([ \t]*%)?/g, out = [], m;
    while ((m = re.exec(s)) !== null) {
      var neg = !!m[1] && (m.index === 0 || !/[A-Za-z0-9가-힣)]/.test(s.charAt(m.index - 1))) && m[1] !== '+';
      var d = m[3] ? m[3].length - 1 : 0, v = parseFloat(m[2].replace(/,/g, '') + (m[3] || ''));
      out.push({ start: m.index, end: m.index + m[0].length, raw: m[0], v: v, neg: neg, dec: d, pct: !!m[4] });
    }
    return out;
  }

  /* ---------- 4. 계산 목록 (과제별 기준 값) ---------- */
  var FAM = {
    diff: '같은 챔버 두 날의 차 (표 1)', diffc: '같은 챔버 두 날의 건수 차 (표 2)', rowmean: '한 챔버의 7일 평균 (표 1)', rowsum: '한 챔버의 7일 합 (표 2)',
    colsum: '하루 합 · 표 전체 합 (표 2)', slope: '하루 평균 변화 (7일−1일)÷6 (표 1)', pct: '한 챔버 합 ÷ 표 전체 합 × 100 (표 2)', ratio: '두 챔버의 (7일−1일) 변화량의 비 (표 1)',
    stat: '표 1 56칸 전체의 개수·합·평균·제곱합·분산·표준편차·중앙값·순위 위치·부호별 개수', mask: '교체 시각이 속한 날의 앞·뒤 시간 몫과 두 가정에서 나온 값 (표 3)',
    col: '원자료 열의 개수·합·평균·최댓값·최솟값·기준 위 개수'
  };
  var FAM_ORDER = ['mask', 'stat', 'col', 'diff', 'diffc', 'rowmean', 'rowsum', 'colsum', 'slope', 'pct', 'ratio'];
  function flat1() { var a = []; MXV.forEach(function (r) { r.forEach(function (v) { a.push(v); }); }); return a; }
  function stat1() {
    var a = flat1(), n = a.length, sum = 0, sq = 0, i; a.forEach(function (v) { sum += v; sq += v * v; });
    var mean = sum / n, sxx = 0; a.forEach(function (v) { sxx += (v - mean) * (v - mean); });
    var b = a.slice().sort(function (x, y) { return x - y; }), med = (b[n / 2 - 1] + b[n / 2]) / 2, neg = 0, pos = 0;
    a.forEach(function (v) { if (v < 0) neg++; else if (v > 0) pos++; });
    var vr = sxx / (n - 1);
    return { n: n, sum: sum, mean: mean, sq: sq, sxx: sxx, sqm: sq - sum * sum / n, vr: vr, sd: Math.sqrt(vr), med: med, neg: neg, pos: pos, below: a.filter(function (v) { return v < 0.5; }).length };
  }
  var ST1 = stat1();
  function ctx(ti) {                     // ti = 0..5 (T1..T6)
    var t = TASKS[ti], cells = [], der = [], i, j, d, e2;
    function C(v, label) { cells.push({ v: Math.abs(v), label: label }); }
    function D(v, fam, label) { der.push({ v: Math.abs(v), fam: fam, label: label }); }
    var q = t.prompt;
    [T1TEXT, T2TEXT, T3TEXT, T6TEXT].forEach(function (x) { q = q.split(x).join(''); });
    extract(q).forEach(function (x) { C(x.v, '문제 글의 ' + x.raw); });
    if (ti < 5) {
      for (i = 0; i < 8; i++) for (j = 0; j < NDAY; j++) C(MXV[i][j], '표 1 · ' + KEYS[i] + ' ' + (j + 1) + '일');
      if (ti < 4) for (i = 0; i < 8; i++) for (j = 0; j < NDAY; j++) C(EXV[i][j], '표 2 · ' + KEYS[i] + ' ' + (j + 1) + '일');
      for (i = 0; i < 8; i++) for (d = 0; d < NDAY; d++) for (e2 = d + 1; e2 < NDAY; e2++) D(MXV[i][e2] - MXV[i][d], 'diff', KEYS[i] + ' ' + (e2 + 1) + '일 − ' + (d + 1) + '일');
      if (ti < 4) for (i = 0; i < 8; i++) for (d = 0; d < NDAY; d++) for (e2 = d + 1; e2 < NDAY; e2++) D(EXV[i][e2] - EXV[i][d], 'diffc', KEYS[i] + ' ' + (e2 + 1) + '일 − ' + (d + 1) + '일');
      for (i = 0; i < 8; i++) { var sm = 0; MXV[i].forEach(function (v) { sm += v; }); D(sm / NDAY, 'rowmean', KEYS[i] + ' 평균'); }
      var tot2 = 0;
      if (ti < 4) {
        for (i = 0; i < 8; i++) { var s2 = 0; EXV[i].forEach(function (v) { s2 += v; }); tot2 += s2; D(s2, 'rowsum', KEYS[i] + ' 합'); }
        for (j = 0; j < NDAY; j++) { var c2 = 0; for (i = 0; i < 8; i++) c2 += EXV[i][j]; D(c2, 'colsum', (j + 1) + '일 합'); }
        D(tot2, 'colsum', '표 2 전체 합');
      }
      for (i = 0; i < 8; i++) D((MXV[i][6] - MXV[i][0]) / 6, 'slope', KEYS[i] + ' 하루 평균 변화');
      if (ti < 4) for (i = 0; i < 8; i++) { var s3_ = 0; EXV[i].forEach(function (v) { s3_ += v; }); D(s3_ / tot2 * 100, 'pct', KEYS[i] + ' 몫(%)'); }
      for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) if (i !== j) { var dj = MXV[j][6] - MXV[j][0]; if (Math.abs(dj) > 0) D((MXV[i][6] - MXV[i][0]) / dj, 'ratio', KEYS[i] + ' ÷ ' + KEYS[j]); }
      var S1 = ST1;
      if (ti === 4) [['n', S1.n], ['n−1', S1.n - 1], ['합', S1.sum], ['평균', S1.mean], ['제곱합', S1.sq], ['편차제곱합', S1.sxx], ['편차제곱합(제곱합−합²/n)', S1.sqm], ['분산', S1.vr], ['표준편차', S1.sd], ['중앙값', S1.med], ['음수 개수', S1.neg], ['양수 개수', S1.pos], ['순위 n/2', S1.n / 2], ['순위 n/2+1', S1.n / 2 + 1]].forEach(function (x) { D(x[1], 'stat', '표 1 ' + x[0]); });
      if (ti === 3 && MASK) [['교체 전 시간', MASK.hb], ['교체 뒤 시간', MASK.ha], ['옛 마스크만의 값(가정)', MASK.vOld], ['새 마스크 몫의 평균(가정)', MASK.vNew]].forEach(function (x) { D(x[1], 'mask', x[0]); });
    } else {
      RAW.forEach(function (r, ri) { C(r.mx, '원자료 ' + (ri + 1) + '번째 줄의 Mx_comp'); C(r.pm, '원자료 ' + (ri + 1) + '번째 줄의 ppa_metric'); });
      var n = RAW.length, smx = 0, spm = 0, mxs = RAW.map(function (r) { return r.mx; }), pms = RAW.map(function (r) { return r.pm; });
      mxs.forEach(function (v) { smx += v; }); pms.forEach(function (v) { spm += v; });
      var over = pms.filter(function (v) { return v > SPEC3; }).length;
      [['줄 수', n], ['Mx_comp 합', smx], ['Mx_comp 평균', smx / n], ['Mx_comp 최댓값', Math.max.apply(null, mxs)], ['Mx_comp 최솟값', Math.min.apply(null, mxs)], ['ppa_metric 합', spm], ['ppa_metric 평균', spm / n], ['ppa_metric 최댓값', Math.max.apply(null, pms)], ['ppa_metric 최솟값', Math.min.apply(null, pms)], ['기준 위 개수', over], ['기준 아래 개수', n - over]].forEach(function (x) { D(x[1], 'col', x[0]); });
    }
    return { cells: cells, der: der };
  }
  var CTX = []; function ctxOf(ti) { return CTX[ti] || (CTX[ti] = ctx(ti)); }

  function bestOf(list, v, tol, fam) {       // 허용 오차 안에서 가장 가까운 후보(같으면 앞선 후보)
    var b = null, i, d;
    for (i = 0; i < list.length; i++) { if (fam && list[i].fam !== fam) continue; d = Math.abs(v - list[i].v); if (d <= tol && (!b || d < b.diff - 1e-12)) b = { diff: d, got: list[i].v, label: list[i].label, fam: list[i].fam }; }
    return b;
  }
  function classify(text, ti, tolK) { return classifyCtx(text, ctxOf(ti), tolK, FAM_ORDER); }
  function classifyCtx(text, c, tolK, famOrder) {            // 0411 이 같은 대조를 다른 계산 목록(사실 목록 문맥)으로 쓰도록 문맥을 받는 꼴
    var K = tolK == null ? TOLK : tolK, nums = extract(text), counts = { n: nums.length, has: 0, calc: 0, none: 0, loose: 0 };
    nums.forEach(function (x) {
      var tol = K * Math.pow(10, -x.dec) + EPS, hit = null, bc = null, bd = null, fi;
      x.tol = tol; x.coarse = tol >= 0.05 - 1e-12;
      if (x.pct) { bd = bestOf(c.der, x.v, tol, 'pct'); if (bd) hit = { cls: 'calc', b: bd }; }      // % 는 100 곱한 비율 값하고만 견준다
      else {
        bc = bestOf(c.cells, x.v, tol, null);
        if (bc && bc.diff <= EPS) hit = { cls: 'has', b: bc };
        else {
          for (fi = 0; fi < famOrder.length && !bd; fi++) bd = bestOf(c.der, x.v, tol, famOrder[fi]);
          if (bc && bd) hit = bd.diff < bc.diff - 1e-12 ? { cls: 'calc', b: bd } : { cls: 'has', b: bc };
          else if (bc) hit = { cls: 'has', b: bc }; else if (bd) hit = { cls: 'calc', b: bd };
        }
      }
      if (hit) { x.cls = hit.cls; x.fam = hit.cls === 'has' ? 'cell' : hit.b.fam; x.label = hit.b.label; x.got = hit.b.got; x.loose = hit.b.diff > EPS && x.coarse; }
      else { x.cls = 'none'; x.fam = ''; x.label = ''; x.got = null; x.loose = false; }
      counts[x.cls]++; if (x.loose) counts.loose++;
    });
    return { nums: nums, counts: counts };
  }
  var ANS = []; TASKS.forEach(function (t, ti) { t.answers.forEach(function (a, ai) { ANS.push({ ti: ti, ai: ai, id: t.id + '-' + (ai + 1), task: t.id, kind: t.kind, text: a }); }); });
  function summary(tolK) { return ANS.map(function (a) { var r = classify(a.text, a.ti, tolK); return { id: a.id, task: a.task, ai: a.ai, n: r.counts.n, has: r.counts.has, calc: r.counts.calc, none: r.counts.none, loose: r.counts.loose }; }); }
  function chanceRate(tolK) {            // 소수 d 자리로 쓴 숫자가 우연히 '있음·계산됨'이 되는 비율 (0.1~2.0 을 한 칸씩 훑음, T1 목록 기준)
    var out = [];
    [1, 2, 3].forEach(function (d) {
      var step = Math.pow(10, -d), N = Math.round(2 / step), has = 0, calc = 0, i;
      for (i = 1; i <= N; i++) { var x = i * step, tol = (tolK == null ? TOLK : tolK) * step + EPS, c = ctxOf(0), h = false; for (var a = 0; a < c.cells.length && !h; a++) if (Math.abs(x - c.cells[a].v) <= tol) h = true; if (h) has++; else { for (var b = 0; b < c.der.length; b++) if (Math.abs(x - c.der[b].v) <= tol) { calc++; break; } } }
      out.push({ d: d, n: N, has: has, calc: calc });
    });
    return out;
  }

  /* ---------- 5. 계산 과제(T2·T5·T6) 정답과 답 채점 ---------- */
  function truthT2() {
    var rows = KEYS.map(function (kk, i) { var si = 0; MXV[i].forEach(function (v) { si += Math.round(v * 1000); }); var d = Math.round(MXV[i][6] * 1000) - Math.round(MXV[i][0] * 1000); return { key: kk, mean: (si / 7 / 1000).toFixed(3), delta: (d / 1000).toFixed(3) }; });
    var best = 0; rows.forEach(function (r, i) { if (Math.abs(+r.delta) > Math.abs(+rows[best].delta)) best = i; });
    return { rows: rows, maxKey: rows[best].key };
  }
  function truthT5() { return { sd: ST1.sd, med: ST1.med, sd4: pnum(ST1.sd, 4), med4: pnum(ST1.med, 4) }; }
  function truthT6() {
    var n = RAW.length, s = 0, bi = 0; RAW.forEach(function (r, i) { s += r.mx; if (r.pm > RAW[bi].pm) bi = i; });
    var over = RAW.filter(function (r) { return r.pm > SPEC3; }).length, overFull = RAW.filter(function (r) { return r.pmFull > P.spec; }).length;
    return { mean: s / n, mean4: pnum(s / n, 4), over: over, overFull: overFull, max: RAW[bi].pm, id: RAW[bi].id, ts: RAW[bi].ts, sum: s };
  }
  function mnum(s) { return parseFloat(String(s).replace(/−/g, '-')); }
  function scoreCalc(ti, text) {
    var items = [], t;
    if (ti === 1) {
      t = truthT2();
      var re = /\|[ \t]*(B0[23]-CH[1-4])[ \t]*\|[ \t]*([-−]?\d+\.\d+)[ \t]*\|[ \t]*([-−]?\d+\.\d+)[ \t]*\|/g, m, got = {};
      while ((m = re.exec(text)) !== null) got[m[1]] = [mnum(m[2]), mnum(m[3])];
      t.rows.forEach(function (r) {
        var g = got[r.key];
        items.push({ name: r.key + ' 평균', got: g ? g[0] : null, want: +r.mean, ok: !!g && Math.abs(g[0] - +r.mean) < 1e-9 });
        items.push({ name: r.key + ' 변화량', got: g ? g[1] : null, want: +r.delta, ok: !!g && Math.abs(g[1] - +r.delta) < 1e-9 });
      });
      var mk = /변화량의 크기가 가장 큰 챔버는 (B0[23]-CH[1-4])/.exec(text);
      items.push({ name: '변화량이 가장 큰 챔버', got: mk ? mk[1] : null, want: t.maxKey, ok: !!mk && mk[1] === t.maxKey });
    } else if (ti === 4) {
      t = truthT5();
      var ms = /표준편차[^\n]*?:[ \t]*(\d+\.\d+)/.exec(text), mm = /중앙값:[ \t]*(\d+\.\d+)/.exec(text);
      items.push({ name: '표본 표준편차', got: ms ? +ms[1] : null, want: +t.sd4, ok: !!ms && Math.abs(+ms[1] - +t.sd4) < 1e-9 });
      items.push({ name: '중앙값', got: mm ? +mm[1] : null, want: +t.med4, ok: !!mm && Math.abs(+mm[1] - +t.med4) < 1e-9 });
    } else if (ti === 5) {
      t = truthT6();
      var a1 = /(?:^|\n)1\)[^\n]*?([-−]?\d+\.\d{4})/.exec(text), a2 = /5\.713[ \t]*을?[ \t]*넘는[^\d\n]*(\d+)장/.exec(text), a3 = /최댓값[^\n]*?(\d+\.\d+)/.exec(text), a4 = /(G115-[A-Z0-9-]+)/.exec(text.slice(text.indexOf('최댓값')));
      items.push({ name: 'Mx_comp 평균', got: a1 ? mnum(a1[1]) : null, want: +t.mean4, ok: !!a1 && Math.abs(mnum(a1[1]) - +t.mean4) < 1e-9 });
      items.push({ name: '기준을 넘는 유리 수', got: a2 ? +a2[1] : null, want: t.over, ok: !!a2 && +a2[1] === t.over });
      items.push({ name: 'ppa_metric 최댓값', got: a3 ? +a3[1] : null, want: t.max, ok: !!a3 && Math.abs(+a3[1] - t.max) < 1e-9 });
      items.push({ name: '그 유리의 glass_id', got: a4 ? a4[1] : null, want: t.id, ok: !!a4 && a4[1] === t.id });
    }
    return { items: items, ok: items.filter(function (x) { return x.ok; }).length, total: items.length };
  }

  /* ---------- 6. 사람이 붙인 문장 판정과 근거 숫자 ---------- */
  function ansText(task, ai) { return TASKS[task - 1].answers[ai - 1]; }
  function countIn(s, re) { var m = s.match(re); return m ? m.length : 0; }
  var VERD = [
    { id: 'v1', task: 4, ai: 3, kind: '숫자는 맞고 잇는 말이 틀림', quote: '나머지 4.6시간의 평균은 약 -1.5여야 5일 평균 0.496이 나옵니다. 이 값은 6일과 7일 수준과 같아서' },
    { id: 'v2', task: 4, ai: 3, kind: '표에 없는 작동 원리', quote: '새 마스크 B2는 패턴 배치가 달라 배율이 한쪽으로 치우친 것으로 보입니다' },
    { id: 'v3', task: 4, ai: 1, kind: '가정을 밝힌 계산 (맞음)', quote: '하루를 고르게 나눈다고 가정하면 옛 마스크만의 값은 약 0.86 ppm으로 추정됩니다' },
    { id: 'v4', task: 1, ai: 3, kind: '기준 없이 문턱을 정한 판단', quote: '절댓값이 0.2ppm 미만이라 현재로서는 이상으로 보기 어렵습니다' },
    { id: 'v5', task: 1, ai: 1, kind: '근거 없는 추측 (약함)', quote: '보정 값이 과하게 움직이고 있는지 확인할 만합니다' },
    { id: 'v6', task: 4, ai: 1, kind: '시각 위치 (맞음)', quote: '이 시각은 1일 기준으로 5일(03-06 06:00~03-07 06:00) 안에 있습니다' },
    { id: 'v7', task: 4, ai: 2, kind: '시각 위치 (맞음)', quote: '5일(03-06 06:00~03-07 06:00) 중 03-07 01:24에' },
    { id: 'v8', task: 4, ai: 3, kind: '시각 위치 (맞음)', quote: '교체 시각이 그 날 안에 들어 있습니다' }
  ];
  function verdictEvidence(v) {
    var o = {}, p1 = TASKS[0].prompt, p4 = TASKS[3].prompt, m = MASK;
    if (v.id === 'v1') {
      var step = Math.abs(MXV[m.ci][m.day + 1] - MXV[m.ci][m.day]);
      o = { said: Math.abs(extract(v.quote)[1].v), vNew: m.vNew, d6: Math.abs(m.vNew - m.next), d7: Math.abs(m.vNew - m.next2), step: step, times: Math.abs(m.vNew - m.next2) / step, v6: m.next, v7: m.next2 };
    } else if (v.id === 'v2') {
      o = { pattern: countIn(p4, /패턴/g), cols: MHCOLS.length, spec: countIn(T3TEXT, /패턴|배율/g) };
    } else if (v.id === 'v3') {
      var sd3 = extract(v.quote).slice(-1)[0].v; o = { vOld: m.vOld, hb: m.hb, ha: m.ha, said: sd3, gap: Math.abs(sd3 - m.vOld) };
    } else if (v.id === 'v4') {
      var small = 0; MXV.forEach(function (r) { r.forEach(function (x) { if (Math.abs(x) < 0.2) small++; }); });
      var cl = classify('0.2', 0, TOLK).nums[0];
      o = { said: extract(v.quote)[0].v, crit: countIn(p1, /기준|한계|spec|허용|규격/g), sameAnsNoCrit: ansText(1, 3).indexOf('초과 판정 기준값도 자료에 없어') >= 0, small: small, cells: 56, cls: cl.cls, label: cl.label, got: cl.got, loose: cl.loose };
    } else if (v.id === 'v5') {
      o = { adjVal: countIn(p1, /보정 값/g), afterCorr: countIn(p1, /보정 후/g), cols: 0 };
    } else {
      o = { hb: m.hb, ha: m.ha, day: m.day, inDay: m.hb > 0 && m.hb < 24, ts: m.ts };
    }
    return o;
  }
  function verdicts() { return VERD.map(function (v) { var t = ansText(v.task, v.ai); return { id: v.id, task: 'T' + v.task, ai: v.ai, kind: v.kind, quote: v.quote, found: t.indexOf(v.quote) >= 0, ev: verdictEvidence(v) }; }); }

  /* ---------- 7. 원인 문장: T3(근거 없음) · T4(이력 줌) ---------- */
  var CAND = [['위치·정렬이 틀어짐', /위치|정렬/], ['계측·보정 값이 바뀜', /계측|보정값|보정 값|영점/], ['부품 교체·정비', /부품 교체|정비|재장착/], ['레시피 변경', /레시피/], ['챔버 조건 변화', /챔버 조건/]];
  var MASKRE = /마스크[ \t]*교체|마스크를[ \t]*바꾼|새[ \t]*마스크/;
  function causes() {
    var rows = CAND.map(function (c) { return { name: c[0], in: [1, 2, 3].map(function (a) { return c[1].test(ansText(3, a)); }) }; });
    var sets = [0, 1, 2].map(function (i) { return rows.filter(function (r) { return r.in[i]; }).map(function (r) { return r.name; }); });
    var first = function (task, a) { var m = /^[\s\S]*?다\./.exec(ansText(task, a)); return m ? m[0] : ''; };
    return {
      rows: rows, sets: sets, pairs: pairJac(sets),
      t3Hold: [1, 2, 3].map(function (a) { return /확정할 수/.test(ansText(3, a)); }), t4Hold: [1, 2, 3].map(function (a) { return /구분할 수 없|나눌 수 없|확정됩니다/.test(ansText(4, a)); }), t3Mask: [1, 2, 3].map(function (a) { return MASKRE.test(ansText(3, a)); }), t4Mask: [1, 2, 3].map(function (a) { return MASKRE.test(ansText(4, a)); }),
      t3First: [1, 2, 3].map(function (a) { return first(3, a); }), t4First: [1, 2, 3].map(function (a) { return first(4, a); }),
      inPrompt: CAND.map(function (c) { return c[1].test(TASKS[2].prompt.split(T1TEXT).join('').split(T2TEXT).join('')); })
    };
  }
  function pairJac(sets) {
    var out = [], i, j;
    function inter(a, b) { return a.filter(function (x) { return b.indexOf(x) >= 0; }); }
    function uni(a, b) { return a.concat(b.filter(function (x) { return a.indexOf(x) < 0; })); }
    for (i = 0; i < sets.length; i++) for (j = i + 1; j < sets.length; j++) { var n = inter(sets[i], sets[j]).length, u = uni(sets[i], sets[j]).length; out.push({ a: i + 1, b: j + 1, inter: n, union: u, jac: u ? n / u : null }); }
    var all = sets.reduce(function (a, b) { return a.filter(function (x) { return b.indexOf(x) >= 0; }); }), allu = sets.reduce(function (a, b) { return uni(a, b); });
    out.all = { inter: all.length, union: allu.length, jac: allu.length ? all.length / allu.length : null };
    return out;
  }

  /* ---------- 8. 같은 질문 세 답: T1 의 챔버 · 숫자 겹침 ---------- */
  var GROUP_RE = [/B02[ \t]*챔버[ \t]*네[ \t]*개/, /B02의[ \t]*네[ \t]*챔버/, /B02-CH1부터[ \t]*CH4/];
  function chambersIn(text) {
    var s = {}, m, re = /B0[23]-CH[1-4]/g;
    while ((m = re.exec(text)) !== null) s[m[0]] = 1;
    if (GROUP_RE.some(function (r) { return r.test(text); })) ['B02-CH1', 'B02-CH2', 'B02-CH3', 'B02-CH4'].forEach(function (k) { s[k] = 1; });
    return KEYS.filter(function (k) { return s[k]; });
  }
  function numKeys(text) { var s = {}; classify(text, 0).nums.forEach(function (x) { s[String(x.v)] = 1; }); return Object.keys(s).sort(function (a, b) { return parseFloat(a) - parseFloat(b); }); }
  function overlapT1() {
    var ch = [1, 2, 3].map(function (a) { return chambersIn(ansText(1, a)); }), nm = [1, 2, 3].map(function (a) { return numKeys(ansText(1, a)); });
    return { ch: ch, nm: nm, chPairs: pairJac(ch), nmPairs: pairJac(nm) };
  }

  return {
    keys: KEYS, params: P, t1: T1TEXT, t2: T2TEXT, t3: T3TEXT, t6: T6TEXT, mx: MXV, mxs: MXS, ex: EXV, raw: RAW, spec3: SPEC3, mask: MASK, st1: ST1,
    tasks: TASKS, answers: ANS, fam: FAM, famOrder: FAM_ORDER, meta: { model: RUNS.model, date: RUNS.date, about: RUNS.about },
    tableChecks: tableChecks, extract: extract, ctx: ctxOf, classify: classify, classifyCtx: classifyCtx, summary: summary, chanceRate: chanceRate,
    truthT2: truthT2, truthT5: truthT5, truthT6: truthT6, scoreCalc: scoreCalc, verdicts: verdicts, causes: causes, overlapT1: overlapT1, ansText: ansText, pairJac: pairJac, tsMin: tsMin, TOLK: TOLK
  };
});
