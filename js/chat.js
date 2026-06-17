/* EduViz AI 튜터 위젯 — math.html / algo.html 공용 (자체 DOM+스타일 주입)
   - 키(서버리스 프록시 엔드포인트) 미설정 시: "API 키가 제공되지 않았습니다" 안내
   - 질문 횟수 제한: 등급별(role) 구조. 현재 free=3, admin=무한 (브라우저 localStorage).
     ★주의: 클라이언트 제한은 우회 가능(시크릿/저장소삭제). 진짜 계정·등급별 게이팅은 로그인+서버DB 필요.
   - 설정: 프록시 배포 후 HTML에서 window.EDUVIZ_CHAT_ENDPOINT = 'https://...워커.workers.dev' 로 지정.
           로그인 붙이면 window.EDUVIZ_ROLE = 'admin' | 'free' | 'pro' ... 로 등급 전환. */
(function(){
  // ── 등급별 한도 (나중에 로그인으로 role 주입하면 그대로 동작) ──
  var LIMITS = { free:3, pro:50, premium:200, admin:Infinity };
  function role(){ return window.EDUVIZ_ROLE || 'free'; }
  function limit(){ var l=LIMITS[role()]; return l==null?3:l; }
  function used(){ return parseInt(localStorage.getItem('eduviz_q_used')||'0',10)||0; }
  function setUsed(n){ try{ localStorage.setItem('eduviz_q_used', String(n)); }catch(e){} }
  function remaining(){ var r=limit()-used(); return r<0?0:r; }
  function endpoint(){ return window.EDUVIZ_CHAT_ENDPOINT || ''; }
  function topic(){ var el=document.getElementById('sceneTitle'); return el?el.textContent.trim():''; }

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

  function injectStyle(){
    if(document.getElementById('eduviz-chat-style')) return;
    var s=el('style'); s.id='eduviz-chat-style';
    s.textContent = [
      '.cw-fab{position:fixed;top:10px;right:62px;z-index:30;display:flex;align-items:center;gap:6px;',
        'background:var(--accent,#4f93d6);color:#fff;border:none;border-radius:999px;padding:7px 14px;',
        'font-size:13.5px;font-family:inherit;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3);}',
      '.cw-fab:hover{filter:brightness(1.08);}',
      '.cw-ov{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);}',
      '.cw-ov.open{display:flex;}',
      '.cw-card{width:min(540px,92vw);max-height:84vh;display:flex;flex-direction:column;',
        'background:var(--panel-bg,rgba(22,22,30,.98));border:1px solid var(--border,rgba(255,255,255,.14));',
        'border-radius:16px;overflow:hidden;color:var(--text-1,#f4f3ee);}',
      '.cw-head{padding:14px 18px;border-bottom:1px solid var(--border,rgba(255,255,255,.12));display:flex;align-items:center;gap:10px;}',
      '.cw-head .t{font-weight:600;font-size:15px;}',
      '.cw-head .topic{font-size:12px;color:var(--accent-light,#7ab8ff);background:var(--accent-soft,rgba(79,147,214,.16));border-radius:8px;padding:2px 8px;margin-left:auto;max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cw-x{background:none;border:none;color:var(--text-3,#9b99a3);font-size:20px;cursor:pointer;line-height:1;}',
      '.cw-body{flex:1;overflow-y:auto;padding:14px 18px;display:flex;flex-direction:column;gap:10px;min-height:120px;}',
      '.cw-msg{font-size:14.5px;line-height:1.6;padding:9px 13px;border-radius:12px;max-width:88%;white-space:pre-wrap;}',
      '.cw-msg.u{align-self:flex-end;background:var(--accent-soft,rgba(79,147,214,.18));border:1px solid var(--accent,#4f93d6);}',
      '.cw-msg.a{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid var(--border,rgba(255,255,255,.12));}',
      '.cw-msg.sys{align-self:center;color:var(--text-3,#9b99a3);font-size:13px;background:none;border:none;text-align:center;}',
      '.cw-foot{padding:12px 18px;border-top:1px solid var(--border,rgba(255,255,255,.12));}',
      '.cw-row{display:flex;gap:8px;align-items:flex-end;}',
      '.cw-in{flex:1;resize:none;background:rgba(255,255,255,.06);border:1px solid var(--border,rgba(255,255,255,.16));',
        'border-radius:10px;color:var(--text-1,#f4f3ee);font-family:inherit;font-size:14px;padding:9px 12px;max-height:120px;}',
      '.cw-send{background:var(--accent,#4f93d6);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:14px;font-family:inherit;cursor:pointer;}',
      '.cw-send:disabled{opacity:.4;cursor:default;}',
      '.cw-meta{margin-top:7px;font-size:12px;color:var(--text-3,#9b99a3);display:flex;justify-content:space-between;}'
    ].join('');
    document.head.appendChild(s);
  }

  var ovEl, bodyEl, inEl, sendEl, metaEl, busy=false;

  function addMsg(kind, text){ var m=el('div','cw-msg '+kind); m.textContent=text; bodyEl.appendChild(m); bodyEl.scrollTop=bodyEl.scrollHeight; return m; }
  function refreshMeta(){
    var r=remaining(), lim=limit();
    metaEl.querySelector('.cw-left').textContent = (lim===Infinity)? '질문 무제한 ('+role()+')' : ('남은 질문 '+r+' / '+lim);
    var done = (lim!==Infinity && r<=0);
    inEl.disabled=done; sendEl.disabled=done||busy;
    inEl.placeholder = done ? '무료 질문을 모두 사용했습니다' : '이 주제에 대해 궁금한 점을 물어보세요…';
  }

  function send(){
    if(busy) return;
    var q=(inEl.value||'').trim(); if(!q) return;
    if(q.length>1000){ addMsg('sys','질문이 너무 깁니다 (1000자 이내).'); return; }
    if(limit()!==Infinity && remaining()<=0){ addMsg('sys','질문 횟수를 모두 사용했습니다.'); return; }
    addMsg('u', q); inEl.value='';
    var ep=endpoint();
    if(!ep){ addMsg('a','⚠️ API 키가 제공되지 않았습니다.'); return; }   // 키/프록시 미설정
    busy=true; refreshMeta();
    var th=addMsg('sys','…생각 중');
    fetch(ep, { method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ question:q, topic:topic() }) })
      .then(function(r){ return r.json().catch(function(){ return {error:'bad'}; }); })
      .then(function(d){ th.remove();
        if(d && d.error==='no_key'){ addMsg('a','⚠️ API 키가 제공되지 않았습니다.'); }
        else if(d && d.answer){ addMsg('a', d.answer); if(limit()!==Infinity) setUsed(used()+1); }
        else { addMsg('a','답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
      })
      .catch(function(){ th.remove(); addMsg('a','⚠️ API 키가 제공되지 않았습니다.'); })
      .then(function(){ busy=false; refreshMeta(); });
  }

  function build(){
    injectStyle();
    var fab=el('button','cw-fab','🤖 AI 질문');
    var ov=el('div','cw-ov'); ovEl=ov;
    var card=el('div','cw-card');
    var head=el('div','cw-head');
    head.appendChild(el('span','t','AI 튜터'));
    var tp=el('span','topic',''); head.appendChild(tp);
    var x=el('button','cw-x','×'); head.appendChild(x);
    bodyEl=el('div','cw-body');
    var foot=el('div','cw-foot');
    var row=el('div','cw-row');
    inEl=el('textarea','cw-in'); inEl.rows=1;
    sendEl=el('button','cw-send','보내기');
    row.appendChild(inEl); row.appendChild(sendEl);
    metaEl=el('div','cw-meta','<span class="cw-left"></span><span class="cw-right">Enter 전송 · Shift+Enter 줄바꿈</span>');
    foot.appendChild(row); foot.appendChild(metaEl);
    card.appendChild(head); card.appendChild(bodyEl); card.appendChild(foot);
    ov.appendChild(card); document.body.appendChild(ov); document.body.appendChild(fab);

    function open(){ tp.textContent = topic()||'일반'; ov.classList.add('open');
      if(!bodyEl.children.length){ addMsg('sys', endpoint()? '"'+(topic()||'이 주제')+'"에 대해 무엇이든 물어보세요.' : 'API 키가 제공되지 않았습니다. (관리자가 키를 설정하면 답변이 활성화됩니다.)'); }
      refreshMeta(); setTimeout(function(){ inEl.focus(); },50); }
    function close(){ ov.classList.remove('open'); }
    fab.onclick=open; x.onclick=close;
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    sendEl.onclick=send;
    inEl.addEventListener('keydown', function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } });
    inEl.addEventListener('input', function(){ inEl.style.height='auto'; inEl.style.height=Math.min(120,inEl.scrollHeight)+'px'; });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
