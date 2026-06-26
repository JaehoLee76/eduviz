/* EduViz AI 튜터 설정 — 한 줄만 바꾸면 AI 답변이 켜집니다.
   모델: Google Gemini Flash-Lite (무료 티어). 키는 사이트가 아니라 Cloudflare Worker에만 둡니다.
   배포 절차는 worker/eduviz-chat.js 상단 주석 참고:
     ① worker/eduviz-chat.js 를 Cloudflare Worker로 배포(+ KV 바인딩 EDUVIZ_KV + Secret GEMINI_API_KEY)
     ② 받은 주소(https://xxx.workers.dev)를 아래에 붙여넣기.
   (비어 있으면 위젯은 "AI 답변이 아직 설정되지 않았습니다" 로 안내합니다.) */
window.EDUVIZ_CHAT_ENDPOINT = "";   // 예: "https://eduviz-chat.your-name.workers.dev"

/* 무료 티어 한도(하루/분당 질문 수)는 Worker의 RPD_CAP·RPM_CAP 변수로 조절.
   한도는 키 1개 = 사이트 전체 공유입니다(개인별 할당은 로그인 필요). */

/* ── 로그인 + 학습기록(위치 복원·메모) ──
   ① Google Cloud Console에서 OAuth Client ID(웹용) 발급 → 승인된 JS 출처에
      https://jaeholee76.github.io (+ 테스트용 http://localhost:8077) 등록.
   ② 발급받은 Client ID(공개값, 비밀키 아님)를 아래에 붙여넣기.
   클라우드 동기화는 위 EDUVIZ_CHAT_ENDPOINT(같은 Worker)가 ?data=1 로 처리합니다.
   (비어 있으면 메모·위치는 이 기기(localStorage)에만 저장되고, 값을 채우면 자동으로
    구글 로그인 + 기기 간 클라우드 동기화가 켜집니다.) */
window.EDUVIZ_GOOGLE_CLIENT_ID = "";   // 예: "1234567890-abc.apps.googleusercontent.com"
