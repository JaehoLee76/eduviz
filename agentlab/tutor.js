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


  /* ───── 문서형 틀: 상단 고정 바 + 좌측 차례 + 읽음 기록 (PC 폭 1000px 이상에서만 보인다) ───── */
  var LABS_URL = inLab ? '../labs.js' : 'labs.js';
  var HUB_URL = inLab ? '../index.html' : 'index.html';
  var curId = (location.pathname.match(/\/labs\/(\d{4})-/) || [])[1] || '';

  function rd(k){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? null : v; }catch(e){ return null; } }
  function wr(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function addTo(k, id){
    var a = rd(k); if(!Array.isArray(a)) a = [];
    if(a.indexOf(id) < 0){ a.push(id); wr(k, a); }
  }
  function arr(k){ var a = rd(k); return Array.isArray(a) ? a : []; }

  var FRAME_CSS =
    '.al-nav,.al-brand,.al-doctitle{display:none}' +
    '@media(min-width:1000px){' +
    ':root{--al-w:280px}' +
    'body{padding-left:var(--al-w)}' +
    '.topbar{flex-wrap:nowrap;gap:.9rem;padding:.4rem 1rem;z-index:50}' +
    '.topbar .tb-home.al-hide,.topbar .tb-title.al-hide{display:none}' +
    '.topbar .tb-grow{flex:0 0 0}' +
    '.al-brand{display:inline-flex;align-items:center;color:var(--accent);font-weight:800;font-size:1rem;' +
      'text-decoration:none;white-space:nowrap;letter-spacing:-.005em}' +
    '.al-brand:hover{text-decoration:underline}' +
    '.al-doctitle{display:block;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
      'color:var(--ink);font-size:.95rem;font-weight:600;padding-left:.9rem;border-left:1px solid var(--rule)}' +
    '.al-doctitle .no{color:var(--soft);font-weight:700;margin-right:.5rem;font-variant-numeric:tabular-nums}' +
    '.al-nav{display:block;position:fixed;left:0;bottom:0;top:var(--al-top,52px);width:var(--al-w);overflow-y:auto;' +
      'overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:var(--paper);' +
      'border-right:1px solid var(--rule);padding:1rem .8rem 2.5rem .6rem;z-index:40;font-size:.8125rem;line-height:1.45}' +
    '.al-nav a{color:var(--ink);text-decoration:none}' +
    '.al-nav a:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
    '.al-nav .al-top{display:block;padding:.3rem .5rem .3rem .75rem;font-weight:700;font-size:.875rem;color:var(--accent);' +
      'border-left:3px solid transparent}' +
    '.al-nav .al-top.cur{border-left-color:var(--accent);background:var(--tint)}' +
    '.al-nav .al-top:hover{text-decoration:underline}' +
    '.al-prog{margin:.15rem .5rem .2rem .75rem;color:var(--soft);font-size:.75rem}' +
    '.al-prog .bar{height:3px;background:var(--track);border-radius:2px;margin-top:.3rem;overflow:hidden}' +
    '.al-prog .bar i{display:block;height:100%;background:var(--good);width:0}' +
    '.al-nav .al-sh{margin:1.15rem .5rem .25rem .75rem;font-size:.75rem;font-weight:700;color:var(--soft);line-height:1.35}' +
    '.al-nav a.al-it{display:flex;align-items:baseline;gap:.5rem;padding:.3rem .5rem .3rem .75rem;border-left:3px solid transparent;' +
      'border-radius:0 6px 6px 0}' +
    '.al-nav a.al-it:hover{background:var(--tint)}' +
    '.al-nav a.al-it .n{flex:0 0 2.3rem;color:var(--soft);font-variant-numeric:tabular-nums;font-weight:600}' +
    '.al-nav a.al-it .t{flex:1 1 auto;min-width:0}' +
    '.al-nav a.al-it .ck{flex:0 0 .9rem;color:var(--good);font-weight:800;text-align:right}' +
    '.al-nav a.al-it.seen .t,.al-nav a.al-it.seen .n{color:var(--accent)}' +
    '.al-nav a.al-it.cur{border-left-color:var(--accent);background:var(--tint)}' +
    '.al-nav a.al-it.cur .t{font-weight:700;color:var(--ink)}' +
    '.al-nav a.al-it.cur .n{color:var(--accent);font-weight:800}' +
    'main.wrap [class^="two"]>*,main.wrap .cols3>*{min-width:0}' +
    'main.wrap pre{max-width:100%;overflow-x:auto}' +
    '.al-resume{margin:0 0 1rem}' +
    '.al-resume a{display:inline-block;color:var(--accent-ink);font-weight:700;font-size:1rem;' +
      'border-bottom:2px solid currentColor;text-decoration:none;padding-bottom:1px}' +
    '.al-resume a:hover{opacity:.85}' +
    'a.labitem .al-st{flex:0 0 auto;font-size:.8125rem;font-weight:700;color:var(--soft)}' +
    'a.labitem.al-done .al-st{color:var(--good)}' +
    'a.labitem.al-seen .no2{color:var(--accent)}' +
    'a.labitem.al-seen{border-color:var(--accent2)}' +
    '}';

  function el(tag, cls, txt){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  }

  function buildNav(LABS){
    var bar = document.querySelector('.topbar');
    if(!bar || !LABS || !LABS.length) return;
    var st = document.createElement('style'); st.textContent = FRAME_CSS; document.head.appendChild(st);

    // 상단 바: 트랙 이름 + 지금 편 (바는 새로 만들지 않고 기존 것을 고쳐 쓴다)
    var cur = null;
    for(var i = 0; i < LABS.length; i++) if(LABS[i].id === curId) cur = LABS[i];
    if(cur){
      var home = bar.querySelector('.tb-home'), ttl = bar.querySelector('.tb-title');
      var brand = el('a', 'al-brand', 'Manufacturing Agent Lab'); brand.href = HUB_URL;
      var dt = el('span', 'al-doctitle');
      dt.appendChild(el('span', 'no', cur.id)); dt.appendChild(document.createTextNode(cur.title));
      dt.title = cur.id + ' ' + cur.title;
      if(home) home.classList.add('al-hide');
      if(ttl) ttl.classList.add('al-hide');
      bar.insertBefore(dt, bar.firstChild); bar.insertBefore(brand, dt);
    }

    // 좌측 차례
    var nav = el('nav', 'al-nav'); nav.setAttribute('aria-label', '실험실 차례');
    var top = el('a', 'al-top' + (cur ? '' : ' cur'), '트랙 홈'); top.href = HUB_URL;
    var prog = el('div', 'al-prog'); var ptxt = el('div', ''); var pbar = el('div', 'bar'); var pfill = el('i');
    pbar.appendChild(pfill); prog.appendChild(ptxt); prog.appendChild(pbar);
    nav.appendChild(top); nav.appendChild(prog);
    var items = {}, lastStage = null;
    for(var j = 0; j < LABS.length; j++){
      var L = LABS[j];
      if(L.stage !== lastStage){ nav.appendChild(el('div', 'al-sh', L.stage)); lastStage = L.stage; }
      var a = el('a', 'al-it'); a.href = (inLab ? '' : 'labs/') + L.file;
      a.appendChild(el('span', 'n', L.id)); a.appendChild(el('span', 't', L.title)); a.appendChild(el('span', 'ck', ''));
      if(L.id === curId){ a.className += ' cur'; a.setAttribute('aria-current', 'page'); }
      nav.appendChild(a); items[L.id] = a;
    }
    document.body.appendChild(nav);

    // 허브 6절 목록의 각 링크에도 읽음 표시
    var hubItems = {};
    if(!inLab){
      var as = document.querySelectorAll('a.labitem');
      for(var k = 0; k < as.length; k++){
        var m = (as[k].getAttribute('href') || '').match(/labs\/(\d{4})-/);
        if(m){ var sp = el('span', 'al-st', ''); var tt = as[k].querySelector('.tt');
          if(tt && tt.nextSibling) as[k].insertBefore(sp, tt.nextSibling); else as[k].appendChild(sp);
          hubItems[m[1]] = { a: as[k], sp: sp }; }
      }
    }

    function refresh(){
      var seen = arr('agentlab_seen'), done = arr('agentlab_done'), nd = 0;
      for(var id in items){
        var isDone = done.indexOf(id) >= 0, isSeen = isDone || seen.indexOf(id) >= 0;
        if(isDone) nd++;
        var a2 = items[id], cls = 'al-it' + (isSeen ? ' seen' : '') + (id === curId ? ' cur' : '');
        a2.className = cls;
        a2.lastChild.textContent = isDone ? '✓' : '';
        a2.title = isDone ? '끝까지 읽음' : (isSeen ? '연 적 있음' : '');
        var h = hubItems[id];
        if(h){
          h.a.className = 'labitem' + (isSeen ? ' al-seen' : '') + (isDone ? ' al-done' : '');
          h.sp.textContent = isDone ? '✓ 읽음' : (isSeen ? '연 적 있음' : '');
        }
      }
      ptxt.textContent = LABS.length + '편 중 ' + nd + '편 읽음';
      pfill.style.width = (100 * nd / LABS.length) + '%';
    }

    // 기록: 연 편 · 끝까지 읽은 편 · 마지막 편
    if(cur){
      addTo('agentlab_seen', cur.id); wr('agentlab_last', cur.id);
      var check = function(){
        var h = document.documentElement.scrollHeight;
        if(window.scrollY + window.innerHeight >= h - 200){
          if(arr('agentlab_done').indexOf(cur.id) < 0){ addTo('agentlab_done', cur.id); refresh(); }
        }
      };
      window.addEventListener('scroll', check, { passive:true });
      setTimeout(check, 600);
    }
    refresh();
    window.addEventListener('storage', refresh);

    // 허브 맨 위: 이어서 보기
    if(!inLab){
      var last = rd('agentlab_last'), tgt = null;
      for(var q = 0; q < LABS.length; q++) if(LABS[q].id === last) tgt = LABS[q];
      var anchor = document.querySelector('header.hero .sub') || document.querySelector('h1');
      if(anchor){
        var p = el('p', 'al-resume'), ra = el('a', '', tgt ? '이어서 보기: ' + tgt.id + ' ' + tgt.title + ' →' : LABS[0].id + '부터 시작 →');
        ra.href = 'labs/' + (tgt ? tgt.file : LABS[0].file);
        p.appendChild(ra); anchor.parentNode.insertBefore(p, anchor.nextSibling);
      }
    }

    // 상단 바 높이만큼 차례를 내리고, 지금 편을 차례 가운데로
    var barH = function(){ document.documentElement.style.setProperty('--al-top', bar.offsetHeight + 'px'); };
    barH();
    if(window.ResizeObserver) new ResizeObserver(barH).observe(bar);
    window.addEventListener('resize', barH);
    var c = nav.querySelector('a.cur.al-it');
    if(c) nav.scrollTop = Math.max(0, c.offsetTop - nav.clientHeight / 2);
  }

  function frame(){
    var s = document.createElement('script');
    s.src = LABS_URL;
    s.onload = function(){ try{ buildNav(window.AGENTLAB_LABS); }catch(e){} };
    s.onerror = function(){};
    document.head.appendChild(s);
  }

  function start(){
    style();
    plant();
    frame();
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
