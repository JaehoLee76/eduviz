/* EduViz AI 튜터 — Cloudflare Worker 프록시
   역할: 브라우저(정적 사이트)와 Claude API 사이에서 API 키를 숨기는 중계 서버.
   키는 코드에 없음 → Cloudflare에 'ANTHROPIC_API_KEY' 비밀값(secret)으로 설정한다.
     wrangler:  wrangler secret put ANTHROPIC_API_KEY
     대시보드:  Workers & Pages → 해당 워커 → Settings → Variables and Secrets → Add (Encrypt)
   배포 후 그 주소(https://eduviz-chat.<계정>.workers.dev)를 js/chat-config.js 에 넣으면 활성화.

   ★키 미설정 시 {error:"no_key"} 반환 → 프론트가 "API 키가 제공되지 않았습니다" 출력. */

const ALLOWED_ORIGINS = [
  "https://jaeholee76.github.io",   // GitHub Pages (실서비스)
  "http://localhost:8077",          // 로컬 미리보기
  "http://127.0.0.1:8077",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}
function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request.headers.get("Origin") || "");
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

    // 키 미설정 → 프론트가 "API 키가 제공되지 않았습니다" 표시
    if (!env.ANTHROPIC_API_KEY) return json({ error: "no_key" }, 200, cors);

    let q, topic;
    try { const b = await request.json(); q = (b.question || "").trim(); topic = (b.topic || "").slice(0, 120); }
    catch { return json({ error: "bad_request" }, 400, cors); }
    if (!q) return json({ error: "empty" }, 400, cors);
    if (q.length > 1000) return json({ error: "too_long" }, 400, cors);

    const system =
      "너는 'EduViz' 수학·알고리즘 시각 학습 사이트의 친절한 한국어 튜터다. " +
      "학습자가 지금 보고 있는 주제: \"" + (topic || "일반") + "\". " +
      "그 맥락에 맞춰 쉽고 정확하게, 너무 길지 않게(보통 5문장 이내) 설명하라. " +
      "수식은 평문으로(예: x^2, a/b) 표기하고, 모르면 모른다고 솔직히 답하라. " +
      "학습 사이트 범위를 벗어난 요청은 정중히 사양하라.";

    let r;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",   // 짧은 Q&A에 저렴 ($1/$5 per 1M)
          max_tokens: 600,
          system,
          messages: [{ role: "user", content: q }],
        }),
      });
    } catch {
      return json({ error: "upstream_unreachable" }, 502, cors);
    }

    if (!r.ok) {
      // 401/403 = 키 문제 → 프론트는 동일하게 "API 키가 제공되지 않았습니다"로 처리
      if (r.status === 401 || r.status === 403) return json({ error: "no_key" }, 200, cors);
      return json({ error: "upstream_error", status: r.status }, 200, cors);
    }

    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return json({ answer: text || "(답변 없음)" }, 200, cors);
  },
};
