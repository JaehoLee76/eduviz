/* Manufacturing Agent Lab — AI 질문 + 구글 로그인 연결기
   ADP 실험실과 같은 공용 위젯(js/chat-config.js · account.js · chat.js)을 불러와
   상단바 안에 [로그인][🤖 AI 질문] 버튼을 넣는다.
   튜터가 읽는 맥락 = 숨은 요소(sceneTitle·crumb·conceptExtra). conceptExtra 에는
   지금 화면에 보이는 절의 본문을 넣고, 스크롤할 때마다 갈아 끼운다(질문이 그 절 기준이 되도록). */
(function(){
  var inLab = /\/labs\//.test(location.pathname);
  var BASE = inLab ? '../../js/' : '../js/';

  function hidden(id){
    var e = document.getElementById(id);
    if(e) return e;
    e = document.createElement('span');
    e.id = id;
    e.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(e);
    return e;
  }
  function clean(s){ return (s || '').replace(/\s+/g, ' ').trim(); }

  // 화면 위쪽 1/3 지점에 걸친 절(section)을 찾는다. 없으면 본문 전체.
  function currentSection(){
    var secs = document.querySelectorAll('main section, .wrap section');
    var y = window.innerHeight * 0.33, pick = null;
    for(var i = 0; i < secs.length; i++){
      var r = secs[i].getBoundingClientRect();
      if(r.top <= y && r.bottom > y){ pick = secs[i]; break; }
      if(r.top > y && !pick){ pick = secs[i]; break; }
    }
    return pick;
  }
  function plant(){
    var h1 = document.querySelector('h1');
    var title = clean(h1 ? h1.textContent : document.title);
    var sec = currentSection();
    var head = sec ? sec.querySelector('h2, h3') : null;
    hidden('sceneTitle').textContent = title;
    hidden('crumb').textContent = 'Manufacturing Agent Lab · ' + title + (head ? ' · ' + clean(head.textContent) : '');
    var src = sec || document.querySelector('main') || document.body;
    hidden('conceptExtra').textContent = clean(src.innerText || src.textContent);
  }

  function style(){
    var s = document.createElement('style');
    s.textContent =
      // 공용 위젯이 쓰는 색 이름을 이 트랙의 색에 잇는다(라이트·다크 모두 따라감)
      ':root{--text-1:var(--ink);--text-2:var(--ink);--text-3:var(--soft);--border:var(--rule);' +
      '--panel-bg:var(--card);--accent-light:var(--accent2);--accent-soft:var(--tint)}' +
      '.topbar .acct-btn{background:var(--card);border:1px solid var(--rule)}' +
      '.topbar .acct-bar,.topbar .cw-wrap{position:static!important;margin:0!important}';
    document.head.appendChild(s);
  }

  function load(list){
    var i = 0;
    (function next(){
      if(i >= list.length) return;
      var s = document.createElement('script');
      s.src = BASE + list[i++];
      s.onload = next;
      s.onerror = next;          // 하나가 실패해도 페이지는 그대로 동작
      document.head.appendChild(s);
    })();
  }

  function start(){
    style();
    plant();
    var tid = 0;
    window.addEventListener('scroll', function(){ clearTimeout(tid); tid = setTimeout(plant, 200); }, { passive:true });
    document.addEventListener('pointerdown', function(e){       // AI 질문 버튼을 누르는 순간 맥락을 최신으로
      if(e.target && e.target.closest && e.target.closest('.cw-fab')) plant();
    }, true);
    if(navigator.onLine === false) return;                      // 오프라인: 학습만
    load(['chat-config.js', 'account.js', 'chat.js']);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.addEventListener('online', function(){
    if(!document.querySelector('.cw-wrap')) load(['chat-config.js', 'account.js', 'chat.js']);
  }, { once:true });
})();
