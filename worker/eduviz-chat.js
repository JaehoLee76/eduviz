/* EduViz AI 튜터 — Cloudflare Worker 프록시 (Cloudflare Workers AI · Llama 3.3 70B)
 * ───────────────────────────────────────────────────────────────────
 *  외부 AI(Gemini/Groq)는 Cloudflare 한국 엣지 egress를 지역/IP 차단(403/지역오류)함.
 *  → Cloudflare 자체 Workers AI 사용(외부 호출 없음 = 차단 불가). 무료(하루 10,000 뉴런), 별도 키 불필요.
 *  배포:
 *   1) 이 파일을 Worker에 붙여넣고 Deploy.
 *   2) 바인딩 2개:  KV namespace → Variable name = EDUVIZ_KV  (이미 연결됨)
 *                  Workers AI    → Variable name = AI         (Bindings → Add → Workers AI)
 *      (선택) AI_MODEL = @cf/meta/llama-3.3-70b-instruct-fp8-fast  // 모델 변경 시(8B로 바꾸면 한도↑)
 *      (선택) RPD_CAP=900  RPM_CAP=25
 *      (로그인용, 선택) GOOGLE_CLIENT_ID
 *   3) 배포 주소를 js/chat-config.js 의 EDUVIZ_CHAT_ENDPOINT 에.
 *  처리: AI 질문(기본) + 학습기록 ?data=1(구글 토큰 검증→KV user:<sub>).
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const KV    = env.EDUVIZ_KV;
    const AI    = env.AI;                                              // Workers AI 바인딩
    const MODEL = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    const RPD   = parseInt(env.RPD_CAP || '900', 10);
    const RPM   = parseInt(env.RPM_CAP || '25', 10);
    const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
    const U = new URL(request.url);

    if (U.searchParams.get('debug')) return J({ hasAI: !!AI, hasKV: !!KV, model: MODEL });

    // ── 학습기록(위치·메모): ?data=1 (구글 ID 토큰 검증 → KV user:<sub>) ──
    if (U.searchParams.get('data')) {
      let token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      let pbody = null;
      if (request.method === 'POST') { try { pbody = await request.json(); } catch (e) {} if (!token && pbody && pbody._t) token = pbody._t; }
      let sub = null;
      if (token) {
        try {
          const tr = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
          if (tr.ok) {
            const p = await tr.json();
            const aud = env.GOOGLE_CLIENT_ID;
            if ((!aud || p.aud === aud) && (!p.exp || (Date.now() / 1000) < Number(p.exp))) sub = p.sub || null;
          }
        } catch (e) {}
      }
      if (!sub) return J({ error: 'unauth' }, 401);
      const uKey = 'user:' + sub;
      if (request.method === 'POST') {
        const rec = { pos: (pbody && pbody.pos) || {}, memos: (pbody && pbody.memos) || {}, ts: Date.now() };
        if (KV) { try { await KV.put(uKey, JSON.stringify(rec)); } catch (e) {} }
        return J({ ok: true });
      }
      const raw = KV && await KV.get(uKey);
      return J(raw ? JSON.parse(raw) : { pos: {}, memos: {} });
    }

    // ── 일일 소프트 예산(태평양 자정 리셋) ──
    const now = new Date();
    const pDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const pT   = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const [hh, mm, ss] = pT.split(':').map(Number);
    const secsToMidnight = 86400 - (hh * 3600 + mm * 60 + ss);
    const dayKey = 'rpd:' + pDay;
    const dayCount = async () => parseInt((KV && await KV.get(dayKey)) || '0', 10);

    if (request.method === 'GET' || U.searchParams.get('status')) {
      const c = await dayCount();
      const ex = c >= RPD;
      return J({ remaining: Math.max(0, RPD - c), exhausted: ex, resetSeconds: ex ? secsToMidnight : null });
    }

    if (!AI) return J({ error: 'no_ai' });   // Workers AI 바인딩(AI) 누락
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const question = (body.question || '').toString().slice(0, 1000);
    if (!question) return J({ error: 'empty' });

    const c = await dayCount();
    if (c >= RPD) return J({ exhausted: true, remaining: 0, resetSeconds: secsToMidnight, scope: 'day' });

    const minKey = 'rpm:' + Math.floor(Date.now() / 60000);
    const mc = parseInt((KV && await KV.get(minKey)) || '0', 10);
    if (mc >= RPM) return J({ exhausted: true, remaining: Math.max(0, RPD - c), resetSeconds: 60 - (Math.floor(Date.now() / 1000) % 60), scope: 'rate' });

    // ── 장면 컨텍스트 → 프롬프트 ──
    const ctx = body.context || {};
    const ctxStr = Object.keys(ctx).map(k => (ctx[k] ? '[' + k + '] ' + ctx[k] : '')).filter(Boolean).join('\n');
    const SYS =
'너는 EduViz 학습 사이트의 \'AI 튜터\'다. 학습자가 지금 보고 있는 한 장면에 대해 질문한다.\n' +
'규칙:\n' +
'1) 1순위 근거는 아래 [현재 장면]이다. 질문이 이 주제를 벗어나면 정중히 이 장면 주제로 되돌려라.\n' +
'2) 더 깊은 이해를 위해 필요하면 네 일반 지식으로 확장·심화해도 된다 — 단 이 장면의 주제와 학습자 수준 안에서.\n' +
'3) 한국어 존댓말. 핵심만 간결하게(보통 3~6문장, 필요하면 짧은 수식). 군더더기·일반론·반복 금지.\n' +
'4) 확실하지 않으면 추측하지 말고 모른다고 밝혀라. 화면 내용과 모순되는 말 금지.';
    const userMsg = '[현재 장면]\n' + ctxStr + '\n\n[학습자 질문]\n' + question;

    // ── Cloudflare Workers AI 호출(외부 egress 없음) ──
    let answer = '';
    try {
      const out = await AI.run(MODEL, {
        messages: [{ role: 'system', content: SYS }, { role: 'user', content: userMsg }],
        max_tokens: 600, temperature: 0.3
      });
      answer = (out && (out.response || out.result || (typeof out === 'string' ? out : ''))) || '';
    } catch (e) {
      // 뉴런 일일 한도 초과 등
      return J({ error: 'ai_fail', detail: (e && e.message) ? String(e.message).slice(0, 160) : '' });
    }
    if (!answer.trim()) return J({ error: 'no_answer' });

    if (KV) {
      try {
        await KV.put(dayKey, String(c + 1), { expirationTtl: 172800 });
        await KV.put(minKey, String(mc + 1), { expirationTtl: 120 });
      } catch (e) {}
    }

    return J({ answer: answer.trim(), remaining: Math.max(0, RPD - (c + 1)) });
  }
};
