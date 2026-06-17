# EduViz AI 튜터 — 배포 안내 (A단계)

정적 사이트(GitHub Pages)는 API 키를 숨길 수 없어, 키를 보관할 작은 중계 서버(Cloudflare Worker, 무료)가 필요합니다. 이 폴더가 그 서버입니다. **키는 코드에 없습니다** — 배포 시 비밀값으로 넣습니다.

## 1. Anthropic API 키 발급
- https://console.claude.com → API Keys → 키 생성 (Claude 구독과 별개, 사용한 만큼 과금)
- 짧은 Q&A 기준 질문 1건당 보통 0.1센트 미만 (모델: `claude-haiku-4-5`)

## 2. Worker 배포 (둘 중 하나)

### 방법 A — wrangler (터미널)
```bash
npm i -g wrangler
wrangler login
cd worker
wrangler secret put ANTHROPIC_API_KEY      # 여기서 키를 붙여넣음 (저장소엔 안 들어감)
wrangler deploy
```
배포가 끝나면 `https://eduviz-chat.<계정>.workers.dev` 주소가 출력됩니다.

### 방법 B — 대시보드 (브라우저)
1. Cloudflare → Workers & Pages → Create → Worker → 이름 `eduviz-chat`
2. `eduviz-chat-worker.js` 내용을 붙여넣고 Deploy
3. 그 Worker → Settings → Variables and Secrets → **Add → Secret** → 이름 `ANTHROPIC_API_KEY`, 값=발급한 키 → Encrypt/Save

## 3. 사이트에 연결
`js/chat-config.js` 의 한 줄을 배포 주소로 바꿉니다:
```js
window.EDUVIZ_CHAT_ENDPOINT = "https://eduviz-chat.<계정>.workers.dev";
```
그리고 커밋·push:
```bash
git add js/chat-config.js && git commit -m "chat: 엔드포인트 연결" && git push
```
1~2분 뒤 사이트의 🤖 AI 질문이 실제로 답합니다.

## 메모
- 키 미설정/오류 시 위젯은 "API 키가 제공되지 않았습니다"로 안내합니다(오류 없음).
- 질문 제한은 현재 브라우저 기준 3회(우회 가능). 계정·등급별 정밀 제한은 로그인+DB가 필요한 B단계입니다.
- 허용 출처(CORS)는 `eduviz-chat-worker.js`의 `ALLOWED_ORIGINS`에서 조정합니다.
