/* LlmVerify — 실험실 0411 의 계산 모듈: 사실 목록(f1~f10)을 S15 정답본에서 다시 계산하고, 맡기는 법 A·B 의 실제 LLM 답 6개를 검사기(V1~V6)에 넣습니다.
 * 브라우저: mfgsim.js · llm_runs_0410.js · llmcheck.js · llm_runs_0411.js 다음에 <script src="llmverify.js"> → window.LlmVerify
 * node    : require('./llmverify.js')
 * 난수 없음. mfgsim.js·llm_runs_0411.json 은 읽기만 합니다. 같은 규칙을 파이썬(페이지 10절 코드)이 다시 구현해 verify.py 가 대조합니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mfgsim.js'), require('./llmcheck.js'), require('./llm_runs_0411.js'));
  else root.LlmVerify = factory(root.MfgSim, root.LlmCheck, root.LLM_RUNS_0411);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MS, LC, RUNS) {
  'use strict';
  var SC = MS.scenario('S15'), T = MS.s15tools, KEYS = LC.keys, CI = KEYS.indexOf('B03-CH2');
  var BASE = LC.tsMin('2026-03-02 06:00');

  function round3(x) { return Math.round(x * 1000) / 1000; }

  /* ---------- 1. 사실 목록 f1~f8 을 정답본에서 다시 계산 ---------- */
  function glassCount7() {                                   // f5: 7일 창에서 B03-CH2 PPA 를 잰 유리 수
    var e = T.extract(SC.clean, 7, 1e9);
    return T.join(e.fdcW, e.ppaW).filter(function (r) { return r.f.block === 'B03' && r.f.chamber === 'CH2'; }).length;
  }
  var NG = glassCount7();
  function sumEx7() { var s = 0; LC.ex.forEach(function (r) { s += r[6]; }); return s; }
  var MASK = LC.mask;

  /* 하루 구간: k 일째 = 1일 06:00 + (k−1)일 ~ +1일 (분 단위 절대 시각) */
  function win(k) {
    var s = BASE + (k - 1) * 1440, e = s + 1440;
    return { k: k, s: s, e: e, ss: T.iso(s - BASE), es: T.iso(e - BASE), short: T.iso(s - BASE).slice(5) + ' ~ ' + T.iso(e - BASE).slice(5) };
  }
  /* 사건 시각(분, 절대)에서 만드는 사건·관계 사실. 기본은 기록의 교체 시각 */
  var TC0 = LC.tsMin(MASK.ts);
  function relFacts(tc) {
    var day = Math.floor((tc - BASE) / 1440) + 1, w7 = win(7), gap = (w7.s - tc) / 60;
    return {
      f7: { id: 'f7', what: 'B03-CH2 마스크 교체(B03-A2 → B03-B2) 시각', value: T.iso(tc - BASE), unit: '', source: '마스크 이력', kind: 'event', dec: 0 },
      f9: { id: 'f9', what: 'B03-CH2 마스크 교체가 든 날', value: day, unit: '일', source: '계산: f7 이 어느 하루 구간(06:00~06:00)에 드는가', kind: 'relation', dec: 0 },
      f10: { id: 'f10', what: '7일 구간 시작 − 교체 시각 (양수면 7일 자료는 전부 교체 뒤)', value: Math.round(gap * 10) / 10, unit: '시간', source: '계산: 7일 구간 시작 − f7', kind: 'relation', dec: 1 }
    };
  }
  function facts(tc) {
    var rf = relFacts(tc == null ? TC0 : tc), mv = LC.mx[CI];
    var f1 = mv[6], f2 = mv[3], f4 = LC.ex[CI][6];
    return [
      { id: 'f1', what: 'B03-CH2 7일 하루 평균 보정 후 Mx', value: f1, unit: 'ppm', source: '표 1', kind: 'value', dec: 3 },
      { id: 'f2', what: 'B03-CH2 4일 하루 평균 보정 후 Mx', value: f2, unit: 'ppm', source: '표 1', kind: 'value', dec: 3 },
      { id: 'f3', what: 'B03-CH2 4일→7일 Mx 변화량', value: round3(f1 - f2), unit: 'ppm', source: '계산: f1 − f2', kind: 'value', dec: 3 },
      { id: 'f4', what: 'B03-CH2 7일 PPA 지표 초과 건수', value: f4, unit: '건', source: '표 2', kind: 'value', dec: 0 },
      { id: 'f5', what: 'B03-CH2 7일 잰 유리 수', value: NG, unit: '장', source: '표 2 집계', kind: 'value', dec: 0 },
      { id: 'f6', what: '7일 전체 챔버 초과 건수 합', value: sumEx7(), unit: '건', source: '표 2', kind: 'value', dec: 0 },
      rf.f7,
      { id: 'f8', what: 'PPA 지표 초과 판정 기준(spec)', value: LC.spec3, unit: 'µm', source: '0400 파이프라인 설정', kind: 'value', dec: 3 },
      rf.f9, rf.f10
    ];
  }
  var FACTS = facts();
  var FBY = {}; FACTS.forEach(function (f) { FBY[f.id] = f; });
  function byId(list) { var o = {}; list.forEach(function (f) { o[f.id] = f; }); return o; }

  function factsCheck() {                                    // 기록 속 f1~f8 과 다시 계산한 값 견주기
    return RUNS.facts.map(function (r) {
      var c = FBY[r.id];
      return { id: r.id, what: r.what, rec: r.value, calc: c.value, unit: r.unit, ok: r.value === c.value && r.unit === c.unit && r.what === c.what && r.source === c.source };
    });
  }

  /* ---------- 2. 값 문자열 · 계산식 ---------- */
  function fmtVal(f, plain) {
    if (typeof f.value === 'string') return f.value;
    var s = f.value.toFixed(f.dec); if (+s === 0) s = s.replace('-', '');
    return plain || !f.unit ? s : s + (f.unit.length === 1 && /[건장일]/.test(f.unit) ? '' : ' ') + f.unit;
  }
  function tokens(expr) {                                    // 허용 글자만: 번호(f숫자)·숫자·+ − * / ( ) 와 공백
    var s = expr.replace(/−/g, '-'), re = /\s*(?:(f\d+)|(\d+(?:\.\d+)?)|([+\-*/()]))/y, out = [], pos = 0, m;
    while (pos < s.length) {
      re.lastIndex = pos; m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(pos))) break; return { err: '허용하지 않는 글자 “' + s.slice(pos).trim().charAt(0) + '”' }; }
      out.push(m[1] ? { t: 'id', v: m[1] } : m[2] ? { t: 'num', v: parseFloat(m[2]) } : { t: 'op', v: m[3] }); pos = re.lastIndex;
    }
    return { toks: out };
  }
  function calc(expr, fb) {                                  // 도구가 식을 계산: 반환 {val, ids} 또는 {err}
    var tk = tokens(expr); if (tk.err) return tk;
    var t = tk.toks, p = 0, ids = [];
    if (!t.length) return { err: '식이 비어 있음' };
    function prim() {
      var x = t[p];
      if (!x) throw new Error('식이 끝나지 않음');
      if (x.t === 'num') { p++; return x.v; }
      if (x.t === 'id') {
        p++; var f = fb[x.v];
        if (!f) throw new Error('목록에 없는 번호 ' + x.v);
        if (typeof f.value !== 'number') throw new Error(x.v + ' 는 숫자가 아님');
        if (ids.indexOf(x.v) < 0) ids.push(x.v); return f.value;
      }
      if (x.v === '(') { p++; var v = expr0(); if (!t[p] || t[p].v !== ')') throw new Error('괄호가 닫히지 않음'); p++; return v; }
      if (x.v === '-') { p++; return -prim(); }
      throw new Error('식 모양이 맞지 않음');
    }
    function term() { var v = prim(); while (t[p] && (t[p].v === '*' || t[p].v === '/')) { var o = t[p++].v, r = prim(); if (o === '/' && r === 0) throw new Error('0 으로 나눔'); v = o === '*' ? v * r : v / r; } return v; }
    function expr0() { var v = term(); while (t[p] && (t[p].v === '+' || t[p].v === '-') && t[p].t === 'op') { var o = t[p++].v, r = term(); v = o === '+' ? v + r : v - r; } return v; }
    try { var val = expr0(); if (p < t.length) throw new Error('식 모양이 맞지 않음'); if (!isFinite(val)) throw new Error('값이 유한하지 않음'); return { val: val, ids: ids }; }
    catch (e) { return { err: e.message }; }
  }
  var CALC_DEC = 1;                                          // 식 결과는 소수 첫째 자리까지 (렌더 규칙)
  function fmtCalc(v) { var s = v.toFixed(CALC_DEC); return +s === 0 ? s.replace('-', '') : s; }

  /* ---------- 3. 자리 {{…}} 읽기 ---------- */
  var SLOT = /\{\{([^{}]*)\}\}/g;
  function slotsOf(text, fb) {                               // 반환 [{raw, kind:'fact'|'calc'|'bad', ids, val?, err?}], 닫히지 않은 괄호 여부
    var out = [], m, re = new RegExp(SLOT.source, 'g');
    while ((m = re.exec(text)) !== null) {
      var c = m[1].trim(), o = { raw: m[0], start: m.index, end: m.index + m[0].length };
      if (/^calc\s*:/.test(c)) { var r = calc(c.replace(/^calc\s*:/, ''), fb); o.kind = 'calc'; if (r.err) { o.err = r.err; o.ids = []; } else { o.val = r.val; o.ids = r.ids; } }
      else if (/^f\d+$/.test(c)) { o.kind = 'fact'; o.ids = [c]; if (!fb[c]) o.err = '목록에 없는 번호 ' + c; }
      else { o.kind = 'bad'; o.ids = []; o.err = '알 수 없는 자리 모양 “' + c + '”'; }
      out.push(o);
    }
    var rest = text.replace(new RegExp(SLOT.source, 'g'), ''); out.open = /\{\{|\}\}/.test(rest);
    return out;
  }
  function stripSlots(text) { return text.replace(new RegExp(SLOT.source, 'g'), ' '); }

  /* ---------- 4. 검사기 V1~V6 ---------- */
  var TYPES = ['사실', '원인', '원인 미확인', '권고'];
  var REL_WORDS = ['같은 기간', '같은 시기', '그 기간', '이후', '이전', '전후', '직전', '직후', '사이', '동안', '앞서', '뒤에', '전에', '후에', '구간 안', '구간 속'];
  var RULES = [
    { id: 'V1', name: '형식', desc: 'JSON 으로 읽히고(앞뒤 글·코드 울타리 없음) sentences 배열의 문장마다 text·cites·type 이 있고 type 이 네 가지 가운데 하나' },
    { id: 'V2', name: '숫자 직접 쓰기 금지', desc: '자리 {{…}} 밖의 text 에 숫자가 없음 (챔버·마스크 이름과 “7일” 같은 날 이름만 허용)' },
    { id: 'V3', name: '자리 확인', desc: '{{fN}} 의 N 이 목록에 있고, {{calc: 식}} 의 식이 번호·숫자 상수·+ − * / ( ) 만 쓰며 도구가 계산할 수 있음' },
    { id: 'V4', name: '근거 달기', desc: 'text 에 쓴 번호가 cites 에 모두 있고, cites 의 번호가 목록에 있고, type 이 원인이면 cites 가 비어 있지 않음' },
    { id: 'V5', name: '원인 규칙', desc: 'type 이 원인인 문장의 cites 에 사건 사실(시각을 값으로 가진 사실)이 있음' },
    { id: 'V6', name: '시점 관계 근거 (제안)', desc: '사건 사실을 인용한 문장에 시점 관계 낱말(' + REL_WORDS.slice(0, 8).join('·') + ' …)이 있으면 관계 사실도 인용' }
  ];
  var NAME_RE = /[A-Za-z][A-Za-z0-9_]*\d[A-Za-z0-9_]*(?:-[A-Za-z0-9_]+)*/g;
  function numsOutside(text) {                               // V2: 자리 밖 숫자 (이름·날 이름만 제외)
    var s = stripSlots(text).replace(NAME_RE, function (m) { return new Array(m.length + 1).join(' '); }).replace(/\d+일(?:간)?/g, function (m) { return new Array(m.length + 1).join(' '); });
    return s.match(/\d+(?:[.,]\d+)*/g) || [];
  }
  function relWordIn(text) { var w = null; REL_WORDS.some(function (x) { if (text.indexOf(x) >= 0) { w = x; return true; } return false; }); return w; }

  function parseAnswer(raw) {
    var o, why = null;
    if (typeof raw !== 'string') return { err: '글이 아님' };
    var s = raw.trim();
    if (s.charAt(0) !== '{') return { err: '첫 글자가 { 가 아님 — JSON 이 아니라 보통 글(' + (s.length > 14 ? s.slice(0, 14) + '…' : s) + ')' };
    try { o = JSON.parse(s); } catch (e) { return { err: 'JSON 으로 읽히지 않음 (' + e.message.slice(0, 60) + ')' }; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { err: 'JSON 이 {…} 꼴이 아님' };
    if (!Array.isArray(o.sentences) || !o.sentences.length) return { err: 'sentences 배열이 없거나 비어 있음' };
    for (var i = 0; i < o.sentences.length; i++) {
      var x = o.sentences[i];
      if (!x || typeof x !== 'object') { why = (i + 1) + '번째 문장이 {…} 꼴이 아님'; break; }
      if (typeof x.text !== 'string') { why = (i + 1) + '번째 문장에 text(글)가 없음'; break; }
      if (!Array.isArray(x.cites) || x.cites.some(function (c) { return typeof c !== 'string'; })) { why = (i + 1) + '번째 문장의 cites 가 글 배열이 아님'; break; }
      if (TYPES.indexOf(x.type) < 0) { why = (i + 1) + '번째 문장의 type “' + x.type + '” 이 네 가지가 아님'; break; }
    }
    if (why) return { err: why, partial: o };
    return { obj: o };
  }

  /* validate(answerText, factList, opts) — opts.on = {V1..V6: bool}, opts.v6wide */
  function validate(raw, factList, opts) {
    opts = opts || {}; var on = opts.on || {}, fl = factList || FACTS, fb = byId(fl);
    function isOn(id) { return on[id] !== false; }
    var res = { rules: {}, fails: [], sentences: null, parse: null };
    RULES.forEach(function (r) { res.rules[r.id] = { id: r.id, on: isOn(r.id), ran: false, ok: null, fails: [] }; });
    var p = parseAnswer(raw); res.parse = p;
    function fail(id, si, msg) { res.rules[id].fails.push({ s: si, msg: msg }); }
    if (isOn('V1')) { res.rules.V1.ran = true; if (p.err) fail('V1', null, p.err); }
    if (p.err && !p.partial) { finish(res); return res; }                  // 읽을 수 없으면 나머지는 검사하지 않음
    var obj = p.obj || p.partial; res.sentences = obj.sentences;
    if (p.err) { finish(res); return res; }                                // 형식이 어긋난 답은 V2~V6 을 돌리지 않음
    obj.sentences.forEach(function (x, si) {
      var sl = slotsOf(x.text, fb), used = {};
      sl.forEach(function (o) { o.ids.forEach(function (i) { used[i] = 1; }); });
      if (isOn('V2')) { res.rules.V2.ran = true; var ns = numsOutside(x.text); if (ns.length) fail('V2', si, '자리 밖 숫자 ' + ns.join(' · ')); }
      if (isOn('V3')) {
        res.rules.V3.ran = true;
        sl.forEach(function (o) { if (o.err) fail('V3', si, o.raw + ' → ' + o.err); });
        if (sl.open) fail('V3', si, '닫히지 않은 자리 괄호');
      }
      if (isOn('V4')) {
        res.rules.V4.ran = true;
        Object.keys(used).forEach(function (id) { if (x.cites.indexOf(id) < 0 && fb[id]) fail('V4', si, 'text 의 ' + id + ' 가 cites 에 없음'); });
        x.cites.forEach(function (c) { if (!fb[c]) fail('V4', si, 'cites 의 ' + c + ' 가 목록에 없음'); });
        if (x.type === '원인' && !x.cites.length) fail('V4', si, '원인 문장인데 cites 가 비어 있음');
      }
      if (isOn('V5')) {
        res.rules.V5.ran = true;
        if (x.type === '원인' && !x.cites.some(function (c) { return fb[c] && fb[c].kind === 'event'; })) fail('V5', si, '원인 문장의 cites 에 사건 사실이 없음');
      }
      if (isOn('V6')) {
        res.rules.V6.ran = true;
        var w = relWordIn(x.text), hasEv = x.cites.some(function (c) { return fb[c] && fb[c].kind === 'event'; }), hasRel = x.cites.some(function (c) { return fb[c] && fb[c].kind === 'relation'; });
        if (w && (opts.v6wide || hasEv) && !hasRel) fail('V6', si, '시점 관계 낱말(' + w + ')이 있는데 관계 사실을 인용하지 않음');
      }
    });
    finish(res); return res;
  }
  function finish(res) {
    var set = {};
    RULES.forEach(function (r) { var o = res.rules[r.id]; o.ok = o.ran ? o.fails.length === 0 : null; o.fails.forEach(function (f) { if (f.s != null) set[f.s] = 1; }); });
    res.failSentences = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    res.pass = RULES.every(function (r) { return res.rules[r.id].ok !== false; });
  }

  /* ---------- 5. render ---------- */
  var BATCH_DIG = { '0': 1, '1': 1, '3': 1, '6': 1, '7': 1, '8': 1 };
  function hasBatchim(s) {
    var c = s.charAt(s.length - 1), code = c.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 !== 0;
    if (/\d/.test(c)) return !!BATCH_DIG[c];
    if (/[lmnLMN]/.test(c)) return true;
    return false;
  }
  var JOSA = { '이': ['이', '가'], '가': ['이', '가'], '은': ['은', '는'], '는': ['은', '는'], '을': ['을', '를'], '를': ['을', '를'] };
  function renderText(text, factList) {
    var fb = byId(factList || FACTS), sl = slotsOf(text, fb), out = '', pos = 0;
    sl.forEach(function (o) {
      out += text.slice(pos, o.start); pos = o.end;
      var rest = text.slice(o.end), piece;
      if (o.err) { out += o.raw; return; }
      if (o.kind === 'calc') piece = fmtCalc(o.val);
      else {
        var f = fb[o.ids[0]], u = f.unit, plain = !u || rest.replace(/^\s*/, '').indexOf(u) === 0;
        piece = fmtVal(f, plain);
        if (!plain && /[건장일]/.test(u) && u.length === 1) piece = fmtVal(f, true) + u;
      }
      var m = /^([이가은는을를])(?=$|[\s.,;)])/.exec(rest);
      if (m) { var pair = JOSA[m[1]], lastBase = piece; out += piece + (hasBatchim(lastBase) ? pair[0] : pair[1]); pos = o.end + 1; }
      else out += piece;
    });
    out += text.slice(pos);
    return out;
  }
  function render(raw, factList) {
    var p = parseAnswer(raw); if (!p.obj) return null;
    return p.obj.sentences.map(function (x) { return { text: renderText(x.text, factList), type: x.type, cites: x.cites }; });
  }

  /* ---------- 6. 설계 A: 문장 나누기 · 숫자 대조(0410 의 checkNumbers 를 사실 목록 문맥으로) ---------- */
  function splitSent(t) { var out = [], m, re = /[\s\S]+?다\.(?=\s|$)/g, last = 0; while ((m = re.exec(t)) !== null) { out.push(m[0].trim()); last = re.lastIndex; } if (t.slice(last).trim()) out.push(t.slice(last).trim()); return out; }
  function ctxA() {
    var cells = [], der = [], nf = FACTS.slice(0, 8).filter(function (f) { return typeof f.value === 'number'; });
    nf.forEach(function (f) { cells.push({ v: Math.abs(f.value), label: f.id + ' (' + f.what + ')' }); });
    nf.forEach(function (a) {
      nf.forEach(function (b) {
        if (a === b) return;
        if (a.id < b.id) { der.push({ v: Math.abs(a.value - b.value), fam: 'diff', label: '|' + a.id + ' − ' + b.id + '|' }); der.push({ v: a.value + b.value, fam: 'sum', label: a.id + ' + ' + b.id }); }
        if (b.value !== 0) { der.push({ v: Math.abs(a.value / b.value), fam: 'ratio', label: a.id + ' ÷ ' + b.id }); der.push({ v: Math.abs(a.value / b.value) * 100, fam: 'pct', label: a.id + ' ÷ ' + b.id + ' × 100' }); }
      });
    });
    return { cells: cells, der: der };
  }
  var CTXA = ctxA(), FAMA = ['diff', 'sum', 'ratio'];
  var FAMA_DESC = { diff: '두 사실의 차 (절댓값)', sum: '두 사실의 합', ratio: '두 사실의 비 (앞 ÷ 뒤)', pct: '두 사실의 비 × 100 (퍼센트 숫자)' };
  function checkA(text, tolK) { return LC.classifyCtx(text, CTXA, tolK, FAMA); }
  var ASKED = [
    { name: '7일 초과 비율(%) = f4 ÷ f5 × 100', f: function () { return FBY.f4.value / FBY.f5.value * 100; } },
    { name: 'B03-CH2 의 몫(%) = f4 ÷ f6 × 100', f: function () { return FBY.f4.value / FBY.f6.value * 100; } }
  ];
  function askedOf(text) {                                    // A 답이 쓴 두 퍼센트 숫자가 정답(소수 첫째 자리 반올림)과 같은가
    var pc = LC.extract(text).filter(function (x) { return x.pct; }).map(function (x) { return x.raw.replace(/[ \t%]/g, ''); });
    return ASKED.map(function (a) { var want = a.f().toFixed(1); return { name: a.name, want: want, ok: pc.indexOf(want) >= 0 }; });
  }
  function answersOf(id) { return RUNS.designs.filter(function (d) { return d.id === id; })[0].answers; }
  var A_ANS = answersOf('A'), B_ANS = answersOf('B');

  /* ---------- 7. 사람이 붙인 표지와 근거 숫자 ---------- */
  var MARKS = [
    { id: 'a1', d: 'A', ai: 1, mark: '틀림', kind: '관계 틀림: 7일 구간 안이라고 씀', quote: '바뀐 시각 2026-03-07 01:24가 7일 구간 안에 들어 있습니다' },
    { id: 'a2', d: 'A', ai: 2, mark: '맞음', kind: '교체가 5일 구간에 든다고 바르게 씀', quote: '이 시각은 5일 구간(03-06 06:00 ~ 03-07 06:00)에 속해 7일 데이터는 전부 교체 이후' },
    { id: 'a3', d: 'A', ai: 3, mark: '맞음', kind: '4일과 7일 구간 사이라고 바르게 씀', quote: '4일과 7일 구간 사이에 들어가' },
    { id: 'b2', d: 'B', ai: 2, mark: '틀림', kind: '관계 틀림: 같은 기간이 7일로 읽힘', quote: '같은 기간 B03-CH2에서는 {{f7}}에 마스크가 B03-A2에서 B03-B2로 교체되었지만' }
  ];
  function inWin(tc, k) { var w = win(k); return tc >= w.s && tc < w.e; }
  function markEvidence(m) {
    var tc = TC0, o = {};
    if (m.id === 'a1') o = { w7: win(7).short, w5: win(5).short, in7: inWin(tc, 7), in5: inWin(tc, 5), day: MASK.day };
    else if (m.id === 'a2') o = { w5: win(5).short, quoteHasW5: m.quote.indexOf(win(5).short) >= 0, in5: inWin(tc, 5), all7After: tc < win(7).s, f10: FBY.f10.value };
    else if (m.id === 'a3') o = { endDay4: win(4).es, startDay7: win(7).ss, between: win(4).e <= tc && tc < win(7).s, in5: inWin(tc, 5) };
    else {
      var sn = B_ANS[1] && parseAnswer(B_ANS[1]).obj ? parseAnswer(B_ANS[1]).obj.sentences : [], idx = -1;
      sn.forEach(function (x, i) { if (x.text.indexOf('같은 기간 B03-CH2에서는') === 0) idx = i; });
      var prev = idx > 0 ? sn[idx - 1].text : '';
      o = { idx: idx + 1, prevMentions7: /7일/.test(prev), in7: inWin(tc, 7), in5: inWin(tc, 5), day: MASK.day, v: validate(B_ANS[1], FACTS) };
    }
    return o;
  }
  function marks() { return MARKS.map(function (m) { var t = m.d === 'A' ? A_ANS[m.ai - 1] : B_ANS[m.ai - 1]; return { id: m.id, d: m.d, ai: m.ai, mark: m.mark, kind: m.kind, quote: m.quote, found: t.indexOf(m.quote) >= 0, ev: markEvidence(m) }; }); }

  /* ---------- 8. 6답의 검사 결과 · 읽을 문장 수 ---------- */
  var ALL = [];
  A_ANS.forEach(function (t, i) { ALL.push({ id: 'A-' + (i + 1), d: 'A', ai: i + 1, text: t }); });
  B_ANS.forEach(function (t, i) { ALL.push({ id: 'B-' + (i + 1), d: 'B', ai: i + 1, text: t }); });
  function runAll(on, v6wide) { return ALL.map(function (a) { return { id: a.id, d: a.d, ai: a.ai, v: validate(a.text, FACTS, { on: on, v6wide: v6wide }) }; }); }
  var CAUSEQ = ['원인 후보는 마스크 교체이며', '원인으로 볼 수 있는 사건은', '시기가 맞아떨어지지만'];   // A 세 답이 원인을 말한 대목
  function causeA() { return A_ANS.map(function (t, i) { return { ai: i + 1, quote: CAUSEQ[i], found: t.indexOf(CAUSEQ[i]) >= 0, holds: /인과가[^.]*확정|인과는[^.]*확정/.test(t) }; }); }
  function causeTypes() {                                     // B 답의 type 분포
    return B_ANS.map(function (t) { var p = parseAnswer(t); var c = {}; (p.obj ? p.obj.sentences : []).forEach(function (x) { c[x.type] = (c[x.type] || 0) + 1; }); return c; });
  }
  function readCounts(on, v6wide) {                           // 사람이 읽어야 할 문장 수: A = 전부, B = 검사 실패 + 원인·원인 미확인·권고 type
    var A = A_ANS.map(function (t) { return splitSent(t).length; });
    var B = B_ANS.map(function (t) {
      var v = validate(t, FACTS, { on: on, v6wide: v6wide }), n = v.sentences ? v.sentences.length : 0, set = {};
      v.failSentences.forEach(function (i) { set[i] = 1; });
      (v.sentences || []).forEach(function (x, i) { if (x.type !== '사실') set[i] = 1; });
      return { n: n, read: Object.keys(set).length };
    });
    return { A: A, B: B };
  }

  /* ---------- 9. 프롬프트 틀: 사실 목록 표를 끼워 넣어 기록 속 프롬프트와 같은 글을 만듭니다 ---------- */
  var P_HEAD = '도구를 하나도 쓰지 마십시오(파일 읽기·계산·실행 금지). 아래 글만 읽고 답만 쓰십시오. 최종 보고에는 답 본문만 쓰고 다른 설명은 붙이지 마십시오.\n\n(가상 공장 자료입니다. 하루 = 그날 06:00 부터 다음 날 06:00 까지, 1일 = 2026-03-02 06:00 시작.)\n\n사실 목록 (도구가 계산한 값)\nid | 내용 | 값 | 출처\n';
  var P_TASK = '\n위 사실 목록으로 7일 아침 보고를 네 문장으로 쓰십시오. B03-CH2 의 7일 초과 비율(초과 건수 ÷ 잰 유리 수, %)과, B03-CH2 가 7일 전체 초과에서 차지하는 몫(%)도 넣고, 원인이 있으면 함께 쓰십시오.\n';
  var P_RULES = '\n반드시 지킬 규칙\n1) 숫자·시각을 직접 쓰지 마십시오. 사실 목록의 값은 {{f1}} 처럼 id 로만 쓰십시오.\n2) 목록에 없는 숫자(비율·몫 등)가 필요하면 직접 계산하지 말고 {{calc: 식}} 으로 쓰십시오. 예: {{calc: (f1+f2)/2}}. 식에는 id 와 + − * / ( ) 숫자 상수만 씁니다.\n3) 원인 문장은 그 원인을 가리키는 사실 id 가 목록에 있을 때만 쓰고, cites 에 그 id 를 넣으십시오. 근거 사실이 없으면 type 을 "원인 미확인" 으로 하고 추측하지 마십시오.\n4) 출력은 아래 JSON 하나뿐이어야 합니다. 앞뒤에 다른 글, 코드 울타리(```)를 쓰지 마십시오.\n{"sentences":[{"text":"…","cites":["f1"],"type":"사실|원인|원인 미확인|권고"}]}\n';
  function factRow(f) { return f.id + ' | ' + f.what + ' | ' + fmtVal(f, true) + ' ' + f.unit + ' | 출처: ' + f.source; }
  function makePrompt(design, factList) {
    var fl = factList || FACTS.slice(0, 8), body = P_HEAD + fl.map(factRow).join('\n') + '\n' + P_TASK;
    return design === 'B' ? body + P_RULES : body;
  }
  function promptCheck() { return RUNS.designs.map(function (d) { return { id: d.id, ok: makePrompt(d.id) === d.prompt }; }); }

  return {
    makePrompt: makePrompt, promptCheck: promptCheck, factRow: factRow, pHead: P_HEAD, pTask: P_TASK, pRules: P_RULES,
    facts: FACTS, factsCheck: factsCheck, relFacts: relFacts, factsAt: facts, win: win, inWin: inWin, mask: MASK, tc0: TC0, base: BASE,
    rules: RULES, relWords: REL_WORDS, types: TYPES, validate: validate, parseAnswer: parseAnswer, runAll: runAll, calc: calc, slotsOf: slotsOf, numsOutside: numsOutside,
    render: render, renderText: renderText, fmtVal: fmtVal, fmtCalc: fmtCalc, splitSent: splitSent,
    ctxA: CTXA, famA: FAMA, famADesc: FAMA_DESC, checkA: checkA, askedOf: askedOf, marks: marks, causeA: causeA, causeTypes: causeTypes, readCounts: readCounts,
    answersA: A_ANS, answersB: B_ANS, all: ALL, designs: RUNS.designs, meta: { model: RUNS.model, date: RUNS.date, about: RUNS.about }
  };
});
