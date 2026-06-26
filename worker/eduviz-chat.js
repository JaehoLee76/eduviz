/* EduViz AI 튜터 — Cloudflare Worker 프록시 (Gemini Flash-Lite 무료 티어)
 * ───────────────────────────────────────────────────────────────────
 * 배포 방법(키는 본인이 직접 입력 — 코드/사이트에 절대 넣지 말 것):
 *  1) Cloudflare 대시보드 → Workers & Pages → Create Worker, 이 파일 내용을 붙여넣고 Deploy.
 *  2) KV namespace 생성(예: 이름 eduviz-quota) → Worker 설정 → Variables → KV Bindings
 *     에서 Variable name = EDUVIZ_KV 로 바인딩.
 *  3) Worker 설정 → Variables and Secrets:
 *       - Secret  GEMINI_API_KEY = (Google AI Studio 무료 키, 본인이 입력)
 *       - (선택) GEMINI_MODEL = gemini-2.5-flash-lite   // 무료 티어 모델
 *       - (선택) RPD_CAP = 900    // 하루 상한(무료 1000 미만으로 여유)
 *       - (선택) RPM_CAP = 12     // 분당 상한(무료 15 미만)
 *  4) 배포된 주소(https://xxx.workers.dev)를 EduViz의 js/chat-config.js
 *     window.EDUVIZ_CHAT_ENDPOINT 에 붙여넣기.
 *
 * 주의: Gemini 무료 티어 한도는 "키 1개 = 사이트 전체 공유"입니다.
 *  → 남은 횟수/충전 남은시간은 모든 방문자가 공유합니다(개인별 아님).
 *  → KV는 최종적 일관성이라 카운트가 살짝 어긋날 수 있어 RPD_CAP을 1000보다 낮게 둡니다.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const KV    = env.EDUVIZ_KV;                       // KV 바인딩(없으면 카운트 비활성=무제한 위험 → 반드시 바인딩)
    const KEY   = env.GEMINI_API_KEY;                  // Secret
    const MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const RPD   = parseInt(env.RPD_CAP || '900', 10);  // 하루 상한
    const RPM   = parseInt(env.RPM_CAP || '12', 10);   // 분당 상한
    const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } });

    // ── 태평양시(무료 티어 일일 리셋 기준) 날짜 + 자정까지 남은 초 ──
    const now = new Date();
    const pDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); // YYYY-MM-DD
    const pT   = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const [hh, mm, ss] = pT.split(':').map(Number);
    const secsToMidnight = 86400 - (hh * 3600 + mm * 60 + ss);

    const dayKey = 'rpd:' + pDay;
    const dayCount = async () => parseInt((KV && await KV.get(dayKey)) || '0', 10);

    // ── 상태 조회(GET 또는 ?status) ──
    const isStatus = request.method === 'GET' || new URL(request.url).searchParams.get('status');
    if (isStatus) {
      const c = await dayCount();
      const ex = c >= RPD;
      return J({ remaining: Math.max(0, RPD - c), exhausted: ex, resetSeconds: ex ? secsToMidnight : null });
    }

    // ── 질문(POST) ──
    if (!KEY) return J({ error: 'no_key' });
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const question = (body.question || '').toString().slice(0, 1000);
    if (!question) return J({ error: 'empty' });

    // 일일 예산
    const c = await dayCount();
    if (c >= RPD) return J({ exhausted: true, remaining: 0, resetSeconds: secsToMidnight, scope: 'day' });

    // 분당 예산(거친 슬라이딩 — 버스트로 Gemini 429 맞기 전에 차단)
    const minKey = 'rpm:' + Math.floor(Date.now() / 60000);
    const mc = parseInt((KV && await KV.get(minKey)) || '0', 10);
    if (mc >= RPM) {
      return J({ exhausted: true, remaining: Math.max(0, RPD - c), resetSeconds: 60 - (Math.floor(Date.now() / 1000) % 60), scope: 'rate' });
    }

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

    // ── Gemini 호출 ──
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + KEY;
    let resp, data;
    try {
      resp = await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYS }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
        })
      });
      data = await resp.json();
    } catch (e) { return J({ error: 'fetch_fail' }); }

    // 429(분당/일일 한도 초과) → Gemini가 주는 retryDelay 우선
    if (resp.status === 429 || (data && data.error && data.error.code === 429)) {
      let retry = 30;
      try {
        const d = ((data.error && data.error.details) || []).find(x => (x['@type'] || '').includes('RetryInfo'));
        if (d && d.retryDelay) retry = parseInt(d.retryDelay, 10) || 30;
      } catch (e) {}
      return J({ exhausted: true, remaining: Math.max(0, RPD - c), resetSeconds: retry, scope: 'rate' });
    }
    if (!data || data.error) return J({ error: (data && data.error && data.error.message) || 'api_error' });

    const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    const answer = parts.map(p => p.text || '').join('').trim();
    if (!answer) return J({ error: 'no_answer' });

    // 카운터 증가(성공 시에만)
    if (KV) {
      try {
        await KV.put(dayKey, String(c + 1), { expirationTtl: 172800 });
        await KV.put(minKey, String(mc + 1), { expirationTtl: 120 });
      } catch (e) {}
    }

    return J({ answer, remaining: Math.max(0, RPD - (c + 1)) });
  }
};
