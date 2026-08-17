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

  // ── ①-2 상단바 만들기 (겹침 방지의 핵심) ────────────────────────────
  // 공용 로그인·AI 버튼은 .topbar 가 있으면 그 안에 '흐름대로' 들어가고,
  // 없으면 화면 우상단에 고정(fixed)으로 떠서 본문 글자와 겹친다.
  // → ADP 페이지에도 진짜 상단바를 만들어 모든 버튼이 그 안에 줄지어 서게 한다.
  function topbar(){
    if(document.querySelector('.topbar')) return;
    var css = document.createElement('style');
    css.textContent = [
      // 본문과 완전히 분리된 고정 영역 — 어떤 스크롤에도 따라 움직이지 않는다.
      '.topbar{position:fixed;top:0;left:0;right:0;z-index:45;display:flex;align-items:center;',
      ' gap:.5rem;flex-wrap:wrap;padding:.45rem .8rem;background:var(--paper,#0f1a20);',
      ' border-bottom:1px solid var(--rule,#2b4451);margin:0}',
      '.topbar .tb-home{display:inline-flex;align-items:center;min-height:38px;padding:.25rem .7rem;',
      ' border:1px solid var(--rule,#2b4451);border-radius:9px;color:var(--accent,#2fa8d8);',
      ' text-decoration:none;font-weight:700;font-size:.85rem}',
      '.topbar .tb-pos{font-size:.8rem;color:var(--soft,var(--ink-soft,#a3b4bd))}',
      '.topbar .tb-grow{flex:1 1 12px}',
      '.topbar .acct-bar,.topbar .cw-wrap{position:static!important;margin:0!important}',
      '@media(max-width:520px){.topbar{padding:.4rem .6rem}.topbar .tb-pos{width:100%;order:9}}'
    ].join('');
    document.head.appendChild(css);

    var pos = document.querySelector('.labnav .pos');
    var bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML = '<a class="tb-home" href="' + (/\/labs\//.test(location.pathname) ? '../index.html' : './index.html') + '">← 홈</a>' +
                    '<span class="tb-pos">' + ((pos && pos.textContent) || 'ADP Master') + '</span>' +
                    '<span class="tb-grow"></span>';
    document.body.insertBefore(bar, document.body.firstChild);

    // 본문 위쪽의 옛 이동줄은 상단바와 역할이 겹치므로 숨긴다(아래쪽 이전·다음 줄은 유지).
    var top = document.querySelector('.labnav:not(.bot)');
    if(top) top.style.display = 'none';

    // 고정 영역이 본문을 가리지 않도록 그 높이만큼 자리를 비워 둔다.
    // 로그인·AI 버튼이 나중에 붙거나 화면이 좁아져 줄이 접히면 높이가 바뀌므로 계속 따라간다.
    function reserve(){ document.body.style.paddingTop = (bar.offsetHeight + 10) + 'px'; }
    reserve();
    if(window.ResizeObserver) new ResizeObserver(reserve).observe(bar);
    window.addEventListener('resize', reserve);
    setTimeout(reserve, 1200);                 // 공용 위젯이 늦게 붙는 경우 대비
  }

  // ── ①-3 최근 본 실험실 기록 ────────────────────────────────────────
  // 실험실이 수백 개가 되면 "아까 보던 것"으로 돌아가는 길이 가장 자주 쓰인다.
  // 허브가 이 기록을 읽어 맨 위에 띄운다. (이 기기에만 저장)
  function remember(){
    if(!/\/labs\//.test(location.pathname)) return;
    try{
      var h1 = document.querySelector('h1');
      var title = h1 ? h1.childNodes[0].textContent.trim() : document.title;
      var item = { href: 'labs/' + location.pathname.split('/').pop(), title: title, at: Date.now() };
      var list = JSON.parse(localStorage.getItem('adp_recent') || '[]')
                     .filter(function(x){ return x.href !== item.href; });
      list.unshift(item);
      localStorage.setItem('adp_recent', JSON.stringify(list.slice(0, 8)));
    }catch(e){}
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
    topbar();                                            // 버튼들이 들어앉을 자리를 먼저 만든다
    var up = /\/labs\//.test(location.pathname) ? '../' : './';
    var idx = document.createElement('script');          // 설명 주제 목차(버튼 글자·개념 사전용)
    idx.src = up + 'topics/index.js';
    document.head.appendChild(idx);
    var qna = document.createElement('script');          // 장면별 Q&A 팝업(오프라인에서도 동작)
    qna.src = up + 'qna.js';
    idx.onload = idx.onerror = function(){ document.head.appendChild(qna); };
    remember();                                          // 최근 본 실험실 기록(허브에서 다시 찾아가기 쉽게)
    if(location.search.indexOf('uicheck') >= 0){          // 겹침 자동 검사 모드(개발용)
      var u = document.createElement('script');
      u.src = (/\/labs\//.test(location.pathname) ? '../uicheck.js' : './uicheck.js');
      document.head.appendChild(u);
    }
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
