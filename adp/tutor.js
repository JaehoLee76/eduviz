/* ADP Master — AI 튜터 연결기
   목적: 실험실 페이지에서도 EduViz의 AI 질문 기능(+구글 로그인)을 그대로 쓰게 한다.
   방식: ①이 페이지가 무엇을 보여 주고 있는지를 튜터가 읽을 수 있는 형태(숨은 요소)로 심고
        ②온라인일 때만 공용 위젯 스크립트를 불러온다(오프라인이면 조용히 넘어감 — 자기완결 유지).
   주의: adp/ 는 GitHub Pages 하위 폴더이므로 공용 스크립트 경로는 ../js/ 이다. */
(function(){
  var BASE = (function(){
    // labs/0002-....html 처럼 한 단계 더 들어간 경우를 자동 판별
    var p = location.pathname;
    return /\/labs\//.test(p) ? '../../js/' : '../js/';
  })();

  // ── ① 페이지 맥락을 숨은 요소로 심기 ────────────────────────────────
  // 공용 위젯은 학습 엔진의 DOM(id: sceneTitle·crumb·conceptExtra)에서 맥락을 읽는다.
  // ADP 페이지엔 엔진이 없으므로, 같은 id로 화면의 실제 내용을 넣어 준다.
  function plant(){
    var wrap = document.querySelector('.wrap') || document.body;
    if(!wrap) return;
    function hidden(id, text){
      if(document.getElementById(id)) return;
      var e = document.createElement('span');
      e.id = id;
      e.textContent = text || '';
      e.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
      document.body.appendChild(e);
    }
    var title = (document.title || 'ADP Master').replace(/\s*·.*$/, '');
    var pos = (document.querySelector('.labnav .pos') || {}).textContent || '';
    var h1 = document.querySelector('h1');
    hidden('sceneTitle', (h1 ? h1.textContent : title).trim());
    hidden('crumb', ('ADP 실기 · ' + (pos || title)).trim());
    // 본문 전체(위젯이 알아서 잘라 쓴다) — 지금 화면에 보이는 설명·표·문제가 그대로 맥락이 된다.
    hidden('conceptExtra', (wrap.innerText || wrap.textContent || '').replace(/\s+/g, ' ').trim());
  }

  // ── ② 온라인일 때만 공용 위젯 로드 ──────────────────────────────────
  function load(list, done){
    var i = 0;
    (function next(){
      if(i >= list.length){ if(done) done(); return; }
      var s = document.createElement('script');
      s.src = BASE + list[i++];
      s.onload = next;
      s.onerror = next;          // 한 개가 실패해도 페이지는 그대로 동작
      document.head.appendChild(s);
    })();
  }

  function start(){
    plant();
    if(navigator.onLine === false) return;               // 오프라인: 질문 버튼 없이 학습만
    load(['chat-config.js', 'account.js', 'chat.js']);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 오프라인으로 열었다가 인터넷이 붙으면 그때 한 번 더 시도한다.
  window.addEventListener('online', function(){
    if(!document.querySelector('.cw-wrap')) load(['chat-config.js', 'account.js', 'chat.js']);
  }, { once:true });
})();
