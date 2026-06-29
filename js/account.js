/* EduViz 계정·학습기록 위젯 — math/algo/physics/calculus 공용
   기능: ① Google 로그인(GIS) ② 학습위치 저장/복원(로그인 시 클라우드 동기화, 아니면 로컬)
        ③ 장면별 메모(작성·목록·점프)
   설정(js/chat-config.js):
     window.EDUVIZ_GOOGLE_CLIENT_ID = "...apps.googleusercontent.com";  // 구글 OAuth Client ID
     window.EDUVIZ_CHAT_ENDPOINT    = "https://...workers.dev";          // 같은 Worker(데이터 저장 겸용)
   클라우드 저장은 Worker가 ?data=1 로 처리(ID 토큰 검증 후 KV user:<sub>에 저장).
   설정이 없어도 로컬(localStorage)로 동작하며, 로그인/클라우드는 값이 채워지면 자동 활성화. */
(function(){
  var GIS_SRC = 'https://accounts.google.com/gsi/client';
  function clientId(){ return window.EDUVIZ_GOOGLE_CLIENT_ID || ''; }
  function worker(){ return window.EDUVIZ_CHAT_ENDPOINT || ''; }
  function dataUrl(){ var w=worker(); return w ? (w + (w.indexOf('?')>=0?'&':'?') + 'data=1') : ''; }

  var TRACK = (function(){ var p=location.pathname.toLowerCase();
    if(p.indexOf('algo')>=0) return 'algo'; if(p.indexOf('phys')>=0) return 'physics';
    if(p.indexOf('calc')>=0) return 'calculus'; if(p.indexOf('math')>=0) return 'math'; return 'etc'; })();

  // ── 사용자 상태 ──
  var user = null;   // {sub,name,email,picture,idToken}
  function uid(){ return user ? user.sub : 'guest'; }
  function jwtDecode(t){ try{ var b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(decodeURIComponent(atob(b).split('').map(function(c){ return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2); }).join(''))); }catch(e){ return null; } }

  // ── 데이터(위치·메모) ──
  var data = { pos:{}, memos:{}, chat:{} };
  function lsKey(){ return 'eduviz_data_'+uid(); }
  function loadLocal(){ try{ data=JSON.parse(localStorage.getItem(lsKey()))||{}; }catch(e){ data={}; }
    data.pos=data.pos||{}; data.memos=data.memos||{}; data.chat=data.chat||{}; }
  function saveLocal(){ try{ localStorage.setItem(lsKey(), JSON.stringify(data)); }catch(e){} }
  var cloudTimer=null;
  function persist(){ saveLocal();
    if(user && dataUrl()){ clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudSave, 2500); } }   // 디바운스(쓰기 절약)
  function cloudSave(){ if(!user||!dataUrl()) return;
    fetch(dataUrl(), { method:'POST', headers:{'content-type':'application/json','authorization':'Bearer '+user.idToken},
      body:JSON.stringify({pos:data.pos, memos:data.memos, chat:data.chat}) }).catch(function(){}); }
  function cloudLoad(done){ if(!user||!dataUrl()){ done&&done(); return; }
    fetch(dataUrl(), { headers:{'authorization':'Bearer '+user.idToken} })
      .then(function(r){ return r.json(); })
      .then(function(d){ if(d && (d.pos||d.memos||d.chat)){ data.pos=d.pos||data.pos; data.memos=d.memos||data.memos; data.chat=d.chat||data.chat; saveLocal(); } done&&done(); })
      .catch(function(){ done&&done(); }); }

  // ── 장면별 대화 기억(요약 발췌 저장) — chat.js가 사용 ──
  window.EduvizStore = {
    user: function(){ return user; },
    loggedIn: function(){ return !!user; },
    promptLogin: function(){ if(!user) onLoginClick(); },
    openMemo: function(){ openMemo(); },   // M 단축키(engine.js)에서 호출
    getChat: function(sid){ return (sid && data.chat && data.chat[sid]) ? data.chat[sid].slice() : []; },
    addChat: function(sid, q, a){ if(!sid || !q) return; data.chat = data.chat || {};
      var arr = (data.chat[sid] || []).slice();
      arr.push({ q: String(q).slice(0, 300), a: String(a || '').slice(0, 300) });   // 답변은 핵심만(요약 발췌)
      if(arr.length > 24) arr = arr.slice(-24);
      data.chat[sid] = arr; persist(); }
  };

  // ── 현재 장면 ──
  function curId(){ return (window.Engine && Engine.curId) ? Engine.curId() : null; }
  function txt(id){ var e=document.getElementById(id); return e? (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim() : ''; }
  function curMeta(){ return { id:curId(), crumb:txt('crumb'), title:txt('sceneTitle'), badge:txt('sceneNo') }; }

  // ── 위치 저장(장면 변화 감지) ──
  var recTimer=null;
  function recordPos(){ var m=curMeta(); if(!m.id) return;
    if(m.badge && m.badge.indexOf('인트로')>=0) return;            // 인트로는 저장 안 함
    data.pos[TRACK] = { id:m.id, crumb:m.crumb, title:m.title, badge:m.badge, ts:Date.now() };
    persist(); updateMemoBtn(); }
  function scheduleRecord(){ clearTimeout(recTimer); recTimer=setTimeout(recordPos, 1500); }
  function watchScene(){ var el=document.getElementById('sceneNo'); if(!el || !window.MutationObserver) return;
    new MutationObserver(scheduleRecord).observe(el,{childList:true,characterData:true,subtree:true}); }

  // ── 위치 복원 ──
  // 로그인 여부와 무관하게 저장된 위치가 있으면 항상 그 장면으로 이동(바로가기 일관성).
  // 토스트의 '처음으로'로 인트로부터 다시 볼 수 있다. (게스트도 localStorage에 위치가 있으면 이어보기)
  var restored=false;
  function restorePos(){ if(restored) return;                      // 페이지 로드당 1회만(로그인 후 재호출이 읽는 중 사용자를 끌어가지 않게)
    var p=data.pos[TRACK]; if(!p || !p.id) return;
    if(!window.Engine || !Engine.indexOfId) return;
    var i=Engine.indexOfId(p.id); if(i<0) return;                  // 콘텐츠에서 사라진 장면
    if(p.id===curId()){ restored=true; return; }                  // 이미 그 장면
    Engine.goTo(i); restored=true;
    toast('이어서 학습 중입니다 — '+(p.title||p.crumb||''), '처음으로', function(){ Engine.goTo(0); });
  }

  // ── 토스트/배너 ──
  function toast(msg, actLabel, actFn){ var t=mk('div','acct-toast'); t.appendChild(mk('span',null,msg));
    if(actLabel){ var b=mk('button','acct-tlink',actLabel); b.onclick=function(){ actFn&&actFn(); t.remove(); }; t.appendChild(b); }
    document.body.appendChild(t); setTimeout(function(){ t.classList.add('show'); },20);
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); },400); }, 6000); }
  function banner(msg, actFn){ var t=mk('div','acct-toast show'); t.appendChild(mk('span',null,msg));
    var b=mk('button','acct-tlink','이동'); b.onclick=function(){ actFn&&actFn(); t.remove(); }; t.appendChild(b);
    var x=mk('button','acct-tx','×'); x.onclick=function(){ t.remove(); }; t.appendChild(x);
    document.body.appendChild(t); }

  // ── 유틸 ──
  function mk(tag,cls,html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }

  // ── 스타일 ──
  function injectStyle(){ if(document.getElementById('acct-style')) return; var s=mk('style'); s.id='acct-style';
    s.textContent=[
      /* 로그인 시 콘텐츠 텍스트만 드래그 선택·복사 허용(질문·참고용). 비로그인은 기존대로 잠금. */
      'body.eduviz-auth .bubble,body.eduviz-auth .bignum,body.eduviz-auth #conceptExtra,body.eduviz-auth #stepCap,'+
        'body.eduviz-auth #codeBody,body.eduviz-auth #studyPanel,body.eduviz-auth #branchPage,body.eduviz-auth .titles,'+
        'body.eduviz-auth #caption,body.eduviz-auth #bubble{user-select:text;-webkit-user-select:text;cursor:text;}',
      '#eduToolbar{display:flex;flex-direction:row;align-items:center;gap:8px;flex:0 0 auto;margin-left:auto;}',   /* 상단바 안 flex 항목, 오른쪽 끝으로(viz서 제목 숨겨도 우측 유지). non-viz선 titles flex:1이 채워 무해 */
      '#eduToolbar .cw-wrap{align-items:center;}',
      '.acct-btn{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);color:var(--text-1,#f4f3ee);',
        'border:1px solid var(--border,rgba(255,255,255,.18));border-radius:999px;padding:6px 12px;font-size:13px;',
        'font-family:inherit;cursor:pointer;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.3);}',
      '.acct-btn:hover{filter:brightness(1.12);}',
      '.acct-btn.on{border-color:var(--accent,#4f93d6);}',
      '.acct-btn .dot{width:7px;height:7px;border-radius:50%;background:var(--accent-light,#7ab8ff);display:none;}',
      '.acct-btn.has .dot{display:inline-block;}',
      '.acct-pic{width:20px;height:20px;border-radius:50%;object-fit:cover;}',
      '.acct-ov{position:fixed;inset:0;z-index:41;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);}',
      '.acct-ov.open{display:flex;}',
      '.acct-card{width:min(520px,92vw);max-height:84vh;display:flex;flex-direction:column;background:var(--panel-bg,rgba(22,22,30,.98));',
        'border:1px solid var(--border,rgba(255,255,255,.14));border-radius:16px;overflow:hidden;color:var(--text-1,#f4f3ee);}',
      '.acct-head{padding:13px 18px;border-bottom:1px solid var(--border,rgba(255,255,255,.12));display:flex;align-items:center;gap:10px;}',
      '.acct-head .t{font-weight:600;font-size:15px;}',
      '.acct-x{margin-left:auto;background:none;border:none;color:var(--text-3,#9b99a3);font-size:20px;cursor:pointer;line-height:1;}',
      '.acct-body{flex:1;overflow-y:auto;padding:14px 18px;display:flex;flex-direction:column;gap:12px;}',
      '.acct-ta{width:100%;min-height:120px;resize:vertical;background:rgba(255,255,255,.06);border:1px solid var(--border,rgba(255,255,255,.16));',
        'border-radius:10px;color:var(--text-1,#f4f3ee);font-family:inherit;font-size:14px;line-height:1.6;padding:10px 12px;box-sizing:border-box;}',
      '.acct-row{display:flex;gap:8px;align-items:center;}',
      '.acct-save{background:var(--accent,#4f93d6);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:14px;font-family:inherit;cursor:pointer;}',
      '.acct-ghost{background:none;border:1px solid var(--border,rgba(255,255,255,.18));color:var(--text-2,#cfcdc6);border-radius:10px;padding:8px 14px;font-size:13px;cursor:pointer;}',
      '.acct-sec{font-size:12px;color:var(--text-3,#9b99a3);margin-top:4px;}',
      '.acct-list{display:flex;flex-direction:column;gap:7px;}',
      '.acct-item{display:flex;gap:9px;align-items:flex-start;padding:9px 11px;background:rgba(255,255,255,.04);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:10px;cursor:pointer;}',
      '.acct-item:hover{background:rgba(255,255,255,.08);}',
      '.acct-item .ttl{font-size:13px;font-weight:600;color:var(--accent-light,#9cc3f0);}',
      '.acct-item .snip{font-size:12.5px;color:var(--text-2,#cfcdc6);line-height:1.5;white-space:pre-wrap;}',
      '.acct-item .del{margin-left:auto;background:none;border:none;color:var(--text-3,#9b99a3);font-size:15px;cursor:pointer;}',
      '.acct-empty{font-size:13px;color:var(--text-3,#9b99a3);text-align:center;padding:18px 0;}',
      '.acct-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,16px);z-index:50;display:flex;align-items:center;gap:10px;',
        'background:var(--panel-bg,rgba(28,28,36,.98));border:1px solid var(--border,rgba(255,255,255,.16));border-radius:12px;',
        'padding:10px 14px;font-size:13.5px;color:var(--text-1,#f4f3ee);box-shadow:0 6px 22px rgba(0,0,0,.4);opacity:0;transition:.35s;max-width:90vw;}',
      '.acct-toast.show{opacity:1;transform:translate(-50%,0);}',
      '.acct-tlink{background:var(--accent,#4f93d6);color:#fff;border:none;border-radius:8px;padding:5px 11px;font-size:13px;cursor:pointer;font-family:inherit;}',
      '.acct-tx{background:none;border:none;color:var(--text-3,#9b99a3);font-size:17px;cursor:pointer;line-height:1;}',
      '.acct-umenu{position:fixed;z-index:42;min-width:180px;background:var(--panel-bg,rgba(28,28,36,.98));border:1px solid var(--border,rgba(255,255,255,.16));border-radius:12px;box-shadow:0 8px 26px rgba(0,0,0,.45);overflow:hidden;}',
      '.acct-uinfo{padding:11px 14px;border-bottom:1px solid var(--border,rgba(255,255,255,.1));}',
      '.acct-uinfo .nm{font-size:13.5px;font-weight:600;color:var(--text-1,#f4f3ee);}',
      '.acct-uinfo .em{font-size:12px;color:var(--text-3,#9b99a3);margin-top:2px;word-break:break-all;}',
      '.acct-uout{display:block;width:100%;text-align:left;background:none;border:none;color:var(--text-1,#f4f3ee);font-family:inherit;font-size:13.5px;padding:10px 14px;cursor:pointer;}',
      '.acct-uout:hover{background:rgba(255,255,255,.07);color:#f0a0a0;}',
      '@media(max-width:560px){ #eduToolbar{gap:5px;} .acct-btn{padding:6px 9px;font-size:12px;} }'
    ].join(''); document.head.appendChild(s); }

  // ── 툴바(로그인/프로필 + 메모 버튼) + AI버튼 재배치 ──
  var loginBtn, memoBtn;
  function buildToolbar(){
    var bar=mk('div'); bar.id='eduToolbar';
    loginBtn=mk('button','acct-btn'); renderLogin();
    memoBtn=mk('button','acct-btn','<span>📝 메모</span> <kbd class="kc">M</kbd><span class="dot"></span>');
    bar.appendChild(loginBtn);
    if(document.getElementById('sceneNo')) bar.appendChild(memoBtn);   // 학습 페이지에서만 메모 버튼(홈엔 로그인만)
    // 툴바를 상단바(.topbar) 안 flex 항목으로 삽입 → 가운데 제목이 남는 공간에서 줄어듦(겹침 원천 차단). 없으면 body.
    var tb=document.querySelector('.topbar'), toc=document.getElementById('toc-toggle');
    if(tb && toc) tb.insertBefore(bar, toc); else if(tb) tb.appendChild(bar);
    else { bar.style.position='fixed'; bar.style.top='12px'; bar.style.right='16px'; bar.style.zIndex='31'; document.body.appendChild(bar); }   // 홈 등 상단바 없는 페이지: 우상단 고정
    // chat.js의 AI버튼(.cw-wrap)을 같은 툴바로 이동(고정위치 해제). 늦게 생기면 재시도.
    function moveCw(){ var cw=document.querySelector('.cw-wrap'); if(cw && cw.parentNode!==bar){ cw.style.position='static'; cw.style.top='auto'; cw.style.right='auto'; cw.style.margin='0'; bar.appendChild(cw); return true; } return !!(cw&&cw.parentNode===bar); }
    if(!moveCw()){ var tries=0; var t=setInterval(function(){ if(moveCw()||tries++>20) clearInterval(t); }, 200); }
    loginBtn.onclick=onLoginClick;
    memoBtn.onclick=openMemo;
  }
  function renderLogin(){ if(!loginBtn) return;
    if(document.body) document.body.classList.toggle('eduviz-auth', !!user);   // 로그인 시 콘텐츠 텍스트 드래그 복사 허용
    if(user){ loginBtn.classList.add('on');
      loginBtn.innerHTML = (user.picture? '<img class="acct-pic" src="'+user.picture+'" alt="">':'👤 ')+'<span>'+(user.name||'로그인됨')+'</span>'; }
    else { loginBtn.classList.remove('on'); loginBtn.innerHTML='<span>👤 로그인</span>'; } }
  function updateMemoBtn(){ if(!memoBtn) return; var id=curId();
    memoBtn.classList.toggle('has', !!(id && data.memos[id] && data.memos[id].text)); }

  // ── 메모 패널 ──
  var memoOv, memoTa, memoListWrap;
  function buildMemo(){ var ov=mk('div','acct-ov'); memoOv=ov; var card=mk('div','acct-card');
    var head=mk('div','acct-head'); head.appendChild(mk('span','t','📝 메모'));
    var x=mk('button','acct-x','×'); head.appendChild(x);
    var body=mk('div','acct-body');
    var lab=mk('div','acct-sec','이 장면의 메모'); var ta=mk('textarea','acct-ta'); memoTa=ta; ta.placeholder='이 장면에서 기억할 점을 적어 두세요…';
    var row=mk('div','acct-row'); var save=mk('button','acct-save','저장');
    var del=mk('button','acct-ghost','이 메모 삭제'); row.appendChild(save); row.appendChild(del);
    var lab2=mk('div','acct-sec','내 메모 전체보기'); memoListWrap=mk('div','acct-list');
    body.appendChild(lab); body.appendChild(ta); body.appendChild(row); body.appendChild(lab2); body.appendChild(memoListWrap);
    card.appendChild(head); card.appendChild(body); ov.appendChild(card); document.body.appendChild(ov);
    x.onclick=closeMemo; ov.addEventListener('click',function(e){ if(e.target===ov) closeMemo(); });
    save.onclick=function(){ saveMemo(); }; del.onclick=function(){ deleteMemo(); };
    document.addEventListener('keydown',function(e){ if(e.key==='Escape' && ov.classList.contains('open')) closeMemo(); }); }
  function openMemo(){ if(!user){ toast('메모는 로그인 후 이용할 수 있어요.'); onLoginClick(); return; }
    var id=curId(); if(!id){ return; }
    memoTa.value = (data.memos[id] && data.memos[id].text) || '';
    renderMemoList(); memoOv.classList.add('open'); setTimeout(function(){ memoTa.focus(); },50); }
  function closeMemo(){ if(memoTa && memoTa.value.trim()!==((data.memos[curId()]||{}).text||'')) saveMemo(true); memoOv.classList.remove('open'); }
  function saveMemo(silent){ var id=curId(); if(!id) return; var v=memoTa.value.trim();
    if(v){ var m=curMeta(); data.memos[id]={ text:v, title:m.title, crumb:m.crumb, track:TRACK, ts:Date.now() }; }
    else { delete data.memos[id]; }
    persist(); updateMemoBtn(); renderMemoList(); if(!silent) toast('메모를 저장했습니다.'); }
  function deleteMemo(){ var id=curId(); if(id){ delete data.memos[id]; memoTa.value=''; persist(); updateMemoBtn(); renderMemoList(); } }
  function renderMemoList(){ var keys=Object.keys(data.memos); memoListWrap.innerHTML='';
    if(!keys.length){ memoListWrap.appendChild(mk('div','acct-empty','아직 메모가 없습니다.')); return; }
    keys.sort(function(a,b){ return (data.memos[b].ts||0)-(data.memos[a].ts||0); }).forEach(function(k){ var m=data.memos[k];
      var it=mk('div','acct-item');
      var col=mk('div'); col.style.flex='1';
      col.appendChild(mk('div','ttl',(m.title||k)+(m.track&&m.track!==TRACK?' ['+m.track+']':'')));
      col.appendChild(mk('div','snip', m.text.length>90? m.text.slice(0,90)+'…':m.text));
      it.appendChild(col);
      var del=mk('button','del','×'); del.onclick=function(e){ e.stopPropagation(); delete data.memos[k]; persist(); updateMemoBtn(); renderMemoList(); };
      it.appendChild(del);
      it.onclick=function(){ jumpToMemo(k, m); };
      memoListWrap.appendChild(it); }); }
  function jumpToMemo(id, m){
    if(m.track && m.track!==TRACK){ // 다른 트랙이면 해당 페이지로 이동(해시로 대상 전달)
      var page={algo:'algo.html',math:'math.html',physics:'physics.html',calculus:'calculus.html'}[m.track];
      if(page){ location.href=page+'#scene='+encodeURIComponent(id); return; } }
    if(window.Engine && Engine.indexOfId){ var i=Engine.indexOfId(id); if(i>=0){ Engine.goTo(i); closeMemo(); return; } }
    toast('그 장면을 찾지 못했습니다.'); }
  function applyHashJump(){ var h=location.hash||''; var mt=h.match(/scene=([^&]+)/); if(!mt) return;
    var id=decodeURIComponent(mt[1]); if(window.Engine && Engine.indexOfId){ var i=Engine.indexOfId(id); if(i>=0) setTimeout(function(){ Engine.goTo(i); },300); }
    try{ history.replaceState(null,'',location.pathname); }catch(e){} }

  // ── Google 로그인 ──
  var gisReady=false;
  function loadGIS(cb){ if(window.google && google.accounts && google.accounts.id){ cb(); return; }
    var s=document.createElement('script'); s.src=GIS_SRC; s.async=true; s.defer=true; s.onload=cb; s.onerror=function(){}; document.head.appendChild(s); }
  function initGIS(){ if(!clientId()) return; loadGIS(function(){ if(!(window.google&&google.accounts)) return;
    google.accounts.id.initialize({ client_id:clientId(), callback:onCredential, auto_select:true });
    gisReady=true;
    if(!user){ try{ google.accounts.id.prompt(); }catch(e){} }   // 로드 시 One Tap 자동 로그인(이전에 동의한 사용자는 무클릭 로그인)
  }); }
  function logout(){ if(window.google&&google.accounts) google.accounts.id.disableAutoSelect();
    try{ localStorage.removeItem('eduviz_session'); }catch(e){}
    user=null; loadLocal(); renderLogin(); updateMemoBtn(); hideUserMenu(); toast('로그아웃되었습니다.'); }
  // 로그인 상태에서 알약 클릭 → 즉시 로그아웃 대신 작은 메뉴(이름·이메일 + 로그아웃)
  var userMenu=null;
  function buildUserMenu(){ if(userMenu) return; userMenu=mk('div','acct-umenu'); userMenu.style.display='none'; document.body.appendChild(userMenu);
    document.addEventListener('click', function(e){ if(userMenu.style.display==='block' && !userMenu.contains(e.target) && loginBtn && !loginBtn.contains(e.target)) hideUserMenu(); });
    window.addEventListener('resize', hideUserMenu); }
  function showUserMenu(){ if(!userMenu || !user || !loginBtn) return; userMenu.innerHTML='';
    var info=mk('div','acct-uinfo'); info.appendChild(mk('div','nm', user.name||'로그인됨')); if(user.email) info.appendChild(mk('div','em', user.email));
    var out=mk('button','acct-uout','로그아웃'); out.onclick=function(e){ e.stopPropagation(); logout(); };
    userMenu.appendChild(info); userMenu.appendChild(out);
    var r=loginBtn.getBoundingClientRect(); userMenu.style.top=(r.bottom+6)+'px'; userMenu.style.right=Math.max(8,(window.innerWidth-r.right))+'px'; userMenu.style.display='block'; }
  function hideUserMenu(){ if(userMenu) userMenu.style.display='none'; }
  function toggleUserMenu(){ if(userMenu && userMenu.style.display==='block') hideUserMenu(); else showUserMenu(); }
  function onLoginClick(){
    if(user){ toggleUserMenu(); return; }   // 로그인됨 → 메뉴 열기(즉시 로그아웃 안 함)
    if(!clientId()){ toast('로그인은 곧 활성화됩니다. (관리자 설정 대기)'); return; }
    if(!gisReady){ toast('로그인 준비 중… 잠시 후 다시 눌러 주세요.'); initGIS(); return; }
    google.accounts.id.prompt();   // One Tap / 로그인 창
  }
  function onCredential(resp){ var t=resp&&resp.credential; if(!t) return; var p=jwtDecode(t); if(!p) return;
    user={ sub:p.sub, name:p.name||p.email, email:p.email, picture:p.picture, idToken:t };
    try{ localStorage.setItem('eduviz_session', JSON.stringify(user)); }catch(e){}   // 페이지 간 로그인 유지
    loadLocal();                                  // 사용자 키로 전환
    renderLogin();
    cloudLoad(function(){ updateMemoBtn(); restorePos(); });   // 클라우드에서 끌어와 복원
    toast('로그인되었습니다 — '+(user.name||''));
  }

  // ── 초기화 ──
  function restoreSession(){ try{ var su=JSON.parse(localStorage.getItem('eduviz_session')||'null'); if(su && su.sub) user=su; }catch(e){} }
  function init(){
    injectStyle(); restoreSession(); loadLocal(); buildToolbar(); buildMemo(); buildUserMenu();
    watchScene(); updateMemoBtn();
    initGIS();
    // 엔진 준비 후 위치 복원/해시 점프.
    // ★ Engine.curId() 가 실제 장면 id를 반환할 때까지 대기 — 함수 존재만 보고 일찍 실행하면
    //   start()/addScenes 전이라 indexOfId가 -1을 줘 복원이 조용히 실패한다(게스트에서 인트로에 머무는 버그 원인).
    var tries=0; (function wait(){ if(window.Engine && Engine.curId && Engine.curId()){ applyHashJump();
        if(user && dataUrl()) cloudLoad(restorePos); else restorePos();   // 로그인 상태면 클라우드에서 트랙별 위치 받아 복원(기기 간). recordPos는 호출 안 함(복원지점 덮어쓰기 버그) — 저장은 watchScene이 실제 이동 때만.
        return; }
      if(tries++<80) setTimeout(wait,120); })();
    window.addEventListener('beforeunload', function(){ if(user && dataUrl()){ try{
      navigator.sendBeacon && navigator.sendBeacon(dataUrl(), new Blob([JSON.stringify({pos:data.pos,memos:data.memos,_t:user.idToken})],{type:'application/json'})); }catch(e){} } });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
