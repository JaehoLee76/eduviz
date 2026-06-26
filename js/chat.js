/* EduViz AI 튜터 위젯 — math/algo/physics/calculus 공용 (자체 DOM+스타일 주입)
   - 모델: Google Gemini Flash-Lite (무료 티어). 키는 Cloudflare Worker 프록시에만 둠.
   - 무료 티어 한도는 "사이트 전체 공유"(키 1개). 남은 횟수·충전 남은시간은 서버(Worker)가 알려준다.
   - 장면 컨텍스트(현재 화면의 제목/설명/요약/단계/코드)를 함께 보내 "이 장면 한정 + 필요시 심화" 답변.
   - 설정: 배포한 Worker 주소를 js/chat-config.js 의 window.EDUVIZ_CHAT_ENDPOINT 에 붙여넣기.
   서버 응답 규약:
     POST {question, topic, context}  → 성공 {answer, remaining}  /  소진 {exhausted:true, remaining, resetSeconds, scope}
     GET  ?status=1                   → {remaining, exhausted, resetSeconds}
*/
(function(){
  function endpoint(){ return window.EDUVIZ_CHAT_ENDPOINT || ''; }

  // ── 현재 장면 컨텍스트 수집(화면에 보이는 것 그대로 = 학습자가 보는 맥락) ──
  function txt(id){ var e=document.getElementById(id); if(!e) return '';
    return (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim(); }
  function clip(s,n){ return s && s.length>n ? s.slice(0,n)+'…' : (s||''); }
  function topic(){ return txt('sceneTitle') || ''; }
  function sceneContext(){
    var c = {
      주제: txt('crumb') || (txt('sceneSec')+' '+txt('sceneTitle')).trim(),
      제목: txt('sceneTitle'),
      설명: clip(txt('bubble'), 1200),
      핵심요약: clip(txt('studyMore') || txt('conceptExtra'), 1000),
      현재단계: clip(txt('stepCap') || txt('stepcap'), 300),
      연습문제: clip(txt('studyProblem'), 500),
      코드: clip(txt('codeBody'), 800)
    };
    var out={}; for(var k in c){ if(c[k]) out[k]=c[k]; } return out;
  }
  // 장면별 대화 스레드: 같은 장면이면 최근 대화를 이어 기억, 장면 바뀌면 리셋
  function sceneKey(){ return (window.Engine && Engine.curId && Engine.curId()) || topic() || ''; }
  function resetThread(){ history=[]; threadScene=sceneKey(); if(bodyEl) bodyEl.innerHTML=''; }

  // ── 무료 티어 상태(서버가 알려주는 공유 카운터) ──
  var Q = { remaining:null, exhausted:false, resetLeft:0 };  // resetLeft: 초(클라이언트가 1초씩 카운트다운)
  var tickTimer=null;
  function stopTick(){ if(tickTimer){ clearInterval(tickTimer); tickTimer=null; } }
  function startTick(){ stopTick(); tickTimer=setInterval(function(){
      Q.resetLeft--; if(Q.resetLeft<=0){ stopTick(); Q.exhausted=false; fetchStatus(); }
      renderFab(); }, 1000); }
  function setExhausted(secs, remaining){
    Q.exhausted=true; Q.remaining=(typeof remaining==='number')?remaining:0;
    Q.resetLeft=Math.max(1, Math.ceil(secs||60)); startTick(); renderFab(); }
  function fmtTime(secs){ secs=Math.max(0,Math.round(secs));
    var h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
    function p(n){ return (n<10?'0':'')+n; }
    return h>0 ? (p(h)+':'+p(m)+':'+p(s)) : (p(m)+':'+p(s)); }

  function fetchStatus(){ var ep=endpoint(); if(!ep){ Q.remaining=null; renderFab(); return; }
    fetch(ep+(ep.indexOf('?')>=0?'&':'?')+'status=1').then(function(r){ return r.json(); }).then(function(d){
      if(d && d.exhausted){ setExhausted(d.resetSeconds, 0); }
      else { Q.exhausted=false; stopTick(); Q.remaining=(d&&typeof d.remaining==='number')?d.remaining:null; renderFab(); }
    }).catch(function(){ renderFab(); }); }

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

  function injectStyle(){
    if(document.getElementById('eduviz-chat-style')) return;
    var s=el('style'); s.id='eduviz-chat-style';
    s.textContent = [
      '.cw-wrap{position:fixed;top:10px;right:62px;z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:3px;}',
      '.cw-fab{display:flex;align-items:center;gap:6px;background:var(--accent,#4f93d6);color:#fff;border:none;',
        'border-radius:999px;padding:7px 14px;font-size:13.5px;font-family:inherit;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3);white-space:nowrap;}',
      '.cw-fab:hover{filter:brightness(1.08);}',
      '.cw-fab.cw-cool{background:#6b6f7a;cursor:default;font-variant-numeric:tabular-nums;}',
      '.cw-key{display:inline-block;margin-left:5px;font-size:10px;font-weight:700;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.4);border-radius:4px;padding:0 5px;line-height:15px;}',
      '.cw-sub{font-size:11px;color:var(--text-1,#e9e7e0);background:rgba(0,0,0,.42);border-radius:6px;padding:1px 8px;pointer-events:none;line-height:1.5;}',
      '.cw-sub.zero{color:#f0a0a0;}',
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

  var ovEl, bodyEl, inEl, sendEl, metaEl, fabEl, fabLabel, subEl, busy=false, history=[], threadScene=null;

  function addMsg(kind, text){ var m=el('div','cw-msg '+kind); m.textContent=text; bodyEl.appendChild(m); bodyEl.scrollTop=bodyEl.scrollHeight; return m; }

  // ── FAB(버튼) + 하단 횟수 라벨 렌더 ──
  function renderFab(){
    if(!fabEl) return;
    if(Q.exhausted){ fabLabel.textContent='토큰충전 남은시간 '+fmtTime(Q.resetLeft); fabEl.classList.add('cw-cool'); }
    else { fabLabel.innerHTML='🤖 AI 질문 <span class="cw-key">i</span>'; fabEl.classList.remove('cw-cool'); }
    if(Q.remaining==null){ subEl.textContent=''; subEl.classList.remove('zero'); }
    else { subEl.textContent='추가 질문 '+Q.remaining+'회'; subEl.classList.toggle('zero', Q.remaining<=0); }
    if(metaEl && ovEl && ovEl.classList.contains('open')) refreshMeta();
  }

  function refreshMeta(){
    if(!metaEl) return;
    var left = Q.exhausted ? ('충전까지 '+fmtTime(Q.resetLeft))
             : (Q.remaining==null ? '' : ('오늘 남은 질문 '+Q.remaining+'회'));
    metaEl.querySelector('.cw-left').textContent = left;
    var blocked = Q.exhausted || (typeof Q.remaining==='number' && Q.remaining<=0) || !endpoint();
    inEl.disabled = blocked; sendEl.disabled = blocked || busy;
    inEl.placeholder = Q.exhausted ? ('충전까지 '+fmtTime(Q.resetLeft)+' 남았습니다')
                     : (blocked && endpoint() ? '무료 질문을 모두 사용했습니다' : '이 장면에 대해 궁금한 점을 물어보세요…');
  }

  function send(){
    if(busy) return;
    var q=(inEl.value||'').trim(); if(!q) return;
    if(q.length>1000){ addMsg('sys','질문이 너무 깁니다 (1000자 이내).'); return; }
    if(Q.exhausted || (typeof Q.remaining==='number' && Q.remaining<=0)){
      addMsg('sys','무료 질문을 모두 사용했습니다. 충전까지 '+fmtTime(Q.resetLeft)+' 남았어요.'); return; }
    if(sceneKey()!==threadScene){ resetThread(); }   // 장면이 바뀌면 새 대화 스레드
    var ep=endpoint();
    addMsg('u', q); inEl.value=''; inEl.style.height='auto';
    if(!ep){ addMsg('a','⚠️ AI 답변이 아직 설정되지 않았습니다. (관리자가 Worker 주소를 등록하면 활성화됩니다.)'); return; }
    busy=true; refreshMeta();
    var th=addMsg('sys','…생각 중');
    var ctx=sceneContext();
    if(history.length){ ctx['이전 대화'] = history.slice(-5).map(function(h){ return 'Q: '+h.q+'\nA: '+h.a; }).join('\n\n'); }
    fetch(ep, { method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ question:q, topic:topic(), context:ctx }) })
      .then(function(r){ return r.json().catch(function(){ return {error:'bad'}; }); })
      .then(function(d){ th.remove();
        if(d && d.error==='no_key'){ addMsg('a','⚠️ AI 키가 설정되지 않았습니다.'); }
        else if(d && d.exhausted){
          addMsg('a','무료 질문을 모두 사용했습니다. '+fmtTime(d.resetSeconds)+' 후 다시 질문할 수 있어요.');
          setExhausted(d.resetSeconds, d.remaining); }
        else if(d && d.answer){
          addMsg('a', d.answer);
          history.push({ q:q, a:d.answer }); if(history.length>12) history=history.slice(-12);
          if(typeof d.remaining==='number'){ Q.remaining=d.remaining; Q.exhausted=false; stopTick(); }
          renderFab(); }
        else { addMsg('a','답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
      })
      .catch(function(){ th.remove(); addMsg('a','일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); })
      .then(function(){ busy=false; refreshMeta(); });
  }

  function build(){
    injectStyle();
    var wrap=el('div','cw-wrap');
    fabEl=el('button','cw-fab'); fabLabel=el('span',null,'🤖 AI 질문'); fabEl.appendChild(fabLabel);
    subEl=el('div','cw-sub','');
    wrap.appendChild(fabEl); wrap.appendChild(subEl);

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
    ov.appendChild(card); document.body.appendChild(ov); document.body.appendChild(wrap);

    function open(){ tp.textContent = topic()||'이 장면';
      if(sceneKey()!==threadScene){ resetThread(); }   // 장면 바뀌면 이전 대화 비우고 새로 시작
      if(!bodyEl.children.length){
        addMsg('sys', endpoint()
          ? '"'+(topic()||'이 장면')+'" 에 대해 물어보세요. (이해를 돕는 심화 설명도 해 드려요.)'
          : 'AI 답변이 아직 설정되지 않았습니다. (관리자가 Worker 주소를 등록하면 활성화됩니다.)'); }
      ov.classList.add('open'); refreshMeta(); setTimeout(function(){ if(!inEl.disabled) inEl.focus(); },50); }
    function close(){ ov.classList.remove('open'); }
    fabEl.onclick=open; x.onclick=close;
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    sendEl.onclick=send;
    inEl.addEventListener('keydown', function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } });
    inEl.addEventListener('input', function(){ inEl.style.height='auto'; inEl.style.height=Math.min(120,inEl.scrollHeight)+'px'; });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
    // 'i' = AI 질문 열기/닫기 (입력 중·조합키일 땐 무시)
    document.addEventListener('keydown', function(e){
      if(e.code!=='KeyI' || e.metaKey || e.ctrlKey || e.altKey) return;
      var ae=document.activeElement, tag=ae&&ae.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||(ae&&ae.isContentEditable)) return;
      e.preventDefault();
      if(ov.classList.contains('open')) close(); else open();
    });

    renderFab();
    fetchStatus();   // 로드 시 사이트 공유 남은 횟수·충전 상태 조회
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
