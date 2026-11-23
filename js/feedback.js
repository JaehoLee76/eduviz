/* 의견 남기기 — 실험실 페이지 공용 부품
 * 절(<section id>)마다 끝에 [✎ 이 절에 의견] 단추를 붙이고, 상단바에 [✎ 의견 N] 단추를 둔다.
 * 저장: 이 기기 localStorage('eduviz_fb') + 로그인 상태면 계정 설정(EduvizStore prefs 'fb')에도 —
 *       같은 계정이면 다른 기기에서도 보인다. 항목마다 ts 를 두어 늦게 쓴 쪽이 이긴다(지운 것도 ts 로 남김).
 * 모아 보기 창의 [전체 복사] 는 페이지 주소·절 제목·의견을 한 덩어리 글로 만들어 클립보드에 넣는다.
 */
(function(){
  if(window.__eduvizFb) return; window.__eduvizFb = true;
  var PAGE = location.pathname.replace(/^.*\/eduviz\//, '').replace(/^\//, '');
  var LS = 'eduviz_fb';
  var all = {};
  function loadLocal(){ try{ all = JSON.parse(localStorage.getItem(LS)) || {}; }catch(e){ all = {}; } }
  function saveLocal(){ try{ localStorage.setItem(LS, JSON.stringify(all)); }catch(e){} }
  function mine(){ return all[PAGE] = all[PAGE] || {}; }
  function S(){ var s = window.EduvizStore; return (s && s.loggedIn && s.loggedIn()) ? s : null; }
  function merge(src){ var ch = false;
    for(var p in src){ var a = all[p] = all[p] || {}, b = src[p] || {};
      for(var k in b){ if(!a[k] || (b[k].ts || 0) > (a[k].ts || 0)){ a[k] = b[k]; ch = true; } } }
    return ch; }
  function push(){ var s = S(); if(s && s.setPref) s.setPref('fb', all); }
  function pull(){ var s = S(); if(!s || !s.getPref) return false;
    var cloud = s.getPref('fb') || {}; var ch = merge(cloud);
    if(ch){ saveLocal(); render(); }
    if(JSON.stringify(cloud) !== JSON.stringify(all)) push();
    return true; }

  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function secTitle(sec){ var h = sec.h; if(!h) return sec.id;
    var all = (h.textContent || '').replace(/\s+/g, ' ').trim(), no = h.querySelector('.no,.step');
    if(!no) return all; var n = (no.textContent || '').trim();
    return n.replace(/[★§]/g, '') + '절 · ' + all.slice(n.length).trim(); }
  function live(){ var m = mine(), o = []; for(var k in m) if(m[k] && m[k].t) o.push(k); return o; }

  function style(){ var s = el('style'); s.textContent =
    '.fb-row{margin:1.1rem 0 .2rem;display:flex;flex-wrap:wrap;gap:.45rem;align-items:flex-start}' +
    '.fb-btn{display:inline-flex;align-items:center;gap:.35rem;min-height:36px;padding:.25rem .8rem;border-radius:9px;' +
      'border:1px dashed var(--rule);background:transparent;color:var(--soft);font:inherit;font-size:.84rem;cursor:pointer}' +
    '.fb-btn.has{border-style:solid;border-color:var(--accent);color:var(--accent);background:var(--tint);font-weight:700}' +
    '.fb-note{flex:1 1 100%;font-size:.86rem;color:var(--ink);background:var(--tint);border-left:3px solid var(--accent);' +
      'border-radius:6px;padding:.45rem .7rem;white-space:pre-wrap;word-break:break-word}' +
    '.topbar .fb-top{display:inline-flex;align-items:center;min-height:38px;padding:.25rem .75rem;border:1px solid var(--rule);' +
      'border-radius:9px;background:var(--card);color:var(--accent);font:inherit;font-size:.86rem;font-weight:700;cursor:pointer}' +
    '.fb-ov{position:fixed;inset:0;z-index:70;display:none;background:rgba(0,0,0,.55);align-items:center;justify-content:center}' +
    '.fb-ov.on{display:flex}' +
    '.fb-card{background:var(--card);color:var(--ink);border:1px solid var(--rule);border-radius:14px;width:min(560px,calc(100vw - 32px));' +
      'max-height:min(80vh,680px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3)}' +
    '.fb-hd{display:flex;align-items:center;gap:.5rem;padding:.8rem 1rem;border-bottom:1px solid var(--rule);font-weight:800}' +
    '.fb-hd span{flex:1;font-size:.95rem}' +
    '.fb-x{min-width:38px;min-height:38px;border:0;background:transparent;color:var(--soft);font-size:1.2rem;cursor:pointer}' +
    '.fb-bd{padding:.9rem 1rem;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}' +
    '.fb-ta{width:100%;min-height:140px;box-sizing:border-box;border:1px solid var(--rule);border-radius:9px;background:var(--paper);' +
      'color:var(--ink);font:inherit;font-size:.95rem;padding:.6rem .7rem;resize:vertical}' +
    '.fb-ft{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;padding:.7rem 1rem;border-top:1px solid var(--rule)}' +
    '.fb-ft button{min-height:38px;padding:.25rem .9rem;border-radius:9px;border:1px solid var(--rule);background:var(--card);' +
      'color:var(--ink);font:inherit;font-size:.88rem;cursor:pointer}' +
    '.fb-ft .pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}' +
    '.fb-it{border:1px solid var(--rule);border-radius:9px;padding:.55rem .7rem;margin-bottom:.55rem;cursor:pointer}' +
    '.fb-it b{display:block;font-size:.86rem;color:var(--accent);margin-bottom:.2rem}' +
    '.fb-it div{font-size:.9rem;white-space:pre-wrap;word-break:break-word}' +
    '.fb-empty,.fb-hint{font-size:.86rem;color:var(--soft)}' +
    '.fb-hint{margin:.6rem 0 0}' +
    '@media(max-width:520px){.fb-ov{align-items:flex-end}.fb-card{width:100vw;border-radius:14px 14px 0 0;max-height:86vh;' +
      'padding-bottom:env(safe-area-inset-bottom)}}';
    document.head.appendChild(s); }

  // ── 팝업 하나를 두 용도(한 절 쓰기 / 모아 보기)로 쓴다 ──
  var ov, hdT, bd, ft, scrollY0 = 0;
  function build(){ ov = el('div', 'fb-ov'); var card = el('div', 'fb-card');
    var hd = el('div', 'fb-hd'); hdT = el('span'); var x = el('button', 'fb-x', '×'); x.type = 'button'; x.setAttribute('aria-label', '닫기');
    x.onclick = close; hd.appendChild(hdT); hd.appendChild(x);
    bd = el('div', 'fb-bd'); ft = el('div', 'fb-ft');
    card.appendChild(hd); card.appendChild(bd); card.appendChild(ft); ov.appendChild(card);
    ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && ov.classList.contains('on')) close(); });
    document.body.appendChild(ov); }
  function open(){ scrollY0 = window.scrollY; var b = document.body.style;
    b.position = 'fixed'; b.top = (-scrollY0) + 'px'; b.left = '0'; b.right = '0'; ov.classList.add('on'); }
  function close(){ if(onClose) onClose(); onClose = null; ov.classList.remove('on'); var b = document.body.style;
    b.position = ''; b.top = ''; b.left = ''; b.right = ''; window.scrollTo(0, scrollY0); }
  var onClose = null;
  function btn(label, cls, fn){ var b = el('button', cls || null, label); b.type = 'button'; b.onclick = fn; ft.appendChild(b); return b; }

  function edit(sec){ var m = mine(), cur = (m[sec.id] && m[sec.id].t) || '';
    hdT.textContent = '의견 — ' + secTitle(sec); bd.innerHTML = ''; ft.innerHTML = '';
    var ta = el('textarea', 'fb-ta'); ta.value = cur;
    ta.placeholder = '이 절에서 고칠 점, 헷갈린 대목, 더 보고 싶은 그림을 적어 주세요.';
    bd.appendChild(ta);
    function save(){ var v = ta.value.trim(); if(v === cur) return;
      m[sec.id] = { t:v, ti:secTitle(sec), ts:Date.now() }; cur = v; saveLocal(); push(); render(); }
    onClose = save;
    if(cur) btn('지우기', null, function(){ ta.value = ''; save(); close(); });
    btn('모아 보기', null, function(){ save(); onClose = null; list(); });
    btn('저장', 'pri', function(){ save(); close(); });
    if(!ov.classList.contains('on')) open(); setTimeout(function(){ ta.focus(); }, 50); }

  function text(){ var m = mine(), ks = live();
    var head = '[의견] ' + (document.title || PAGE) + '\n' + location.origin + location.pathname + '\n';
    return head + ks.map(function(k){ return '\n■ ' + (m[k].ti || k) + '\n' + m[k].t; }).join('\n') + '\n'; }
  function list(){ var m = mine(), ks = live();
    ks.sort(function(a, b){ return order(a) - order(b); });
    hdT.textContent = '남긴 의견 ' + ks.length + '개'; bd.innerHTML = ''; ft.innerHTML = '';
    if(!ks.length) bd.appendChild(el('div', 'fb-empty', '아직 남긴 의견이 없습니다. 각 절 끝의 [✎ 이 절에 의견] 단추로 남기실 수 있습니다.'));
    ks.forEach(function(k){ var it = el('div', 'fb-it', '<b>' + esc(m[k].ti || k) + '</b><div>' + esc(m[k].t) + '</div>');
      it.onclick = function(){ var s = unit(k); if(s) edit(s); }; bd.appendChild(it); });
    if(ks.length) bd.appendChild(el('p', 'fb-hint', '[전체 복사]를 누르면 절 제목과 의견이 한 번에 복사되어 그대로 전달하실 수 있습니다.' +
      (S() ? '' : ' 로그인하시면 다른 기기에서도 이 의견이 보입니다.')));
    var cp = ks.length ? btn('전체 복사', 'pri', function(){ copy(text(), function(ok){ cp.textContent = ok ? '복사했습니다 ✓' : '복사 실패 — 길게 눌러 선택하세요'; }); }) : null;
    btn('닫기', ks.length ? null : 'pri', close);
    if(!ov.classList.contains('on')) open(); }
  function copy(t, done){
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ done(true); }, function(){ fallback(); }); }
    else fallback();
    function fallback(){ var ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta);
      ta.select(); var ok = false; try{ ok = document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); done(ok); } }

  var secs = [], topB = null;
  function unit(id){ for(var i = 0; i < secs.length; i++) if(secs[i].id === id) return secs[i]; return null; }
  function order(id){ for(var i = 0; i < secs.length; i++) if(secs[i].id === id) return i; return 9999; }
  function render(){ var m = mine();
    secs.forEach(function(sec){ var row = sec.__fb; if(!row) return; var e = m[sec.id], t = e && e.t;
      row.btn.className = 'fb-btn' + (t ? ' has' : ''); row.btn.textContent = t ? '✎ 내 의견 고치기' : '✎ 이 절에 의견';
      row.note.style.display = t ? '' : 'none'; row.note.textContent = t || ''; });
    if(topB) topB.textContent = '✎ 의견' + (live().length ? ' ' + live().length : ''); }

  function start(){ loadLocal(); style(); build();
    // 단위 = <section id> 가 있으면 그 절, 없으면 h2 하나부터 다음 h2 직전까지(ADP 실험실 구조).
    var ss = [].slice.call(document.querySelectorAll('section[id]')).filter(function(s){ return s.querySelector('h2'); });
    if(ss.length) secs = ss.map(function(s){ return { id:s.id, h:s.querySelector('h2'), put:function(r){ s.appendChild(r); } }; });
    else { var hs = [].slice.call(document.querySelectorAll('h2')).filter(function(h){ return !h.closest('.fb-ov,.qna-ov,.topbar'); });
      secs = hs.map(function(h, i){ var nx = hs[i + 1];
        return { id:'h' + i, h:h, put:function(r){ if(nx) nx.parentNode.insertBefore(r, nx); else h.parentNode.appendChild(r); } }; }); }
    secs.forEach(function(sec){ var row = el('div', 'fb-row'); var b = el('button', 'fb-btn'); b.type = 'button';
      var note = el('div', 'fb-note'); b.onclick = function(){ edit(sec); };
      row.appendChild(b); row.appendChild(note); sec.put(row); sec.__fb = { btn:b, note:note }; });
    var bar = document.querySelector('.topbar');
    if(bar){ topB = el('button', 'fb-top'); topB.type = 'button'; topB.title = '남긴 의견 모아 보기 · 복사'; topB.onclick = list;
      var th = bar.querySelector('.tb-theme'); if(th) bar.insertBefore(topB, th); else bar.appendChild(topB); }
    render();
    // 계정 동기화: account.js 가 로그인·클라우드 읽기를 마칠 때까지 잠시 기다렸다가 합친다.
    var n = 0; (function poll(){ if(pull() && n > 6) return; if(++n < 40) setTimeout(poll, 1500); })();
    window.addEventListener('focus', pull); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
