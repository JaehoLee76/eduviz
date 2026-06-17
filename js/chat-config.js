/* EduViz AI 튜터 설정 — 한 줄만 바꾸면 AI 답변이 켜집니다.
   Cloudflare Worker 배포 후, 받은 주소를 아래에 붙여넣으세요.
   (비어 있으면 위젯은 "API 키가 제공되지 않았습니다" 로 안내합니다.) */
window.EDUVIZ_CHAT_ENDPOINT = "";   // 예: "https://eduviz-chat.your-name.workers.dev"

/* (선택) 로그인 붙인 뒤 등급 전환용 — free | pro | premium | admin
   미설정 시 free(질문 3회). 로그인에서 받은 등급을 여기에 주입하면 위젯 한도가 바뀝니다. */
// window.EDUVIZ_ROLE = "free";
