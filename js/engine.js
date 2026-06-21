/* 수학 시각 교실 — 공용 엔진
   하나의 화면이 morph되는 경험을 만드는 코어.
   - Stage: 풀스크린 캔버스
   - Particles: 장면 사이를 흩어졌다 모이는 점들
   - NumberLine: 재사용 수직선 부품
   - Character: 안내자 "도형이" + 말풍선
   - SceneManager: 순서대로(기본) + 점프(옵션)
*/
(function(global){
  'use strict';

  // ---------- Stage ----------
  var cv, ctx, W, H, DPR;
  function initStage(canvas){
    cv = canvas; ctx = cv.getContext('2d'); resize();
    global.addEventListener('resize', function(){ resize(); if(SM.cur!=null){ var s=SM.scenes[SM.cur]; if(s&&s.enter) layoutOnly(s); } });
  }
  function resize(){ DPR=global.devicePixelRatio||1; W=cv.clientWidth||innerWidth; H=cv.clientHeight||innerHeight; cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
  function layoutOnly(s){ if(s.layout) s.layout(E); }

  // ---------- Sound (듣고) ----------
  var actx=null;
  function blip(f,dur,type){ try{ if(!actx) actx=new (global.AudioContext||global.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();   // 키보드 탐색(화살표/D 등) 후에도 소리 나도록 즉시 resume
    var o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;
    o.type=type||'sine'; o.frequency.value=f; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.08,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.25)); o.start(t); o.stop(t+(dur||0.25)+0.02);
  }catch(e){} }
  function resumeAudio(){ if(actx&&actx.state==='suspended')actx.resume(); }
  global.addEventListener('pointerdown',resumeAudio); global.addEventListener('keydown',resumeAudio);   // 마우스·키보드 어느 쪽으로 탐색해도 오디오 활성

  // ---------- 끝 알림 토스트 (분기 마지막에서 더 가려 할 때): 비프 2회 + 떴다 서서히 사라짐 ----------
  var _endEl=null, _endStyled=false;
  function endToast(msg, sub){
    blip(720,0.07,'triangle'); setTimeout(function(){ blip(720,0.07,'triangle'); }, 115);  // 두 번 빠르게
    if(!_endStyled){ var st=document.createElement('style'); st.textContent=
      '#endToast{position:fixed;left:50%;top:16%;transform:translateX(-50%) translateY(-10px);'
      +'background:rgba(18,20,28,0.94);border:1px solid var(--accent,#ffb27a);color:#eef3fb;'
      +'padding:13px 24px;border-radius:13px;font-size:15px;font-weight:600;z-index:99990;text-align:center;'
      +'opacity:0;pointer-events:none;box-shadow:0 10px 36px rgba(0,0,0,0.45);'
      +'transition:opacity .22s ease, transform .22s ease;}'
      +'#endToast.show{opacity:1;transform:translateX(-50%) translateY(0);}'
      +'#endToast.fade{opacity:0;transform:translateX(-50%) translateY(-10px);transition:opacity 1.5s ease, transform 1.5s ease;}'
      +'#endToast .et-sub{display:block;font-size:11px;font-weight:400;color:#9fb0c8;margin-top:4px;letter-spacing:.03em;}';
      document.head.appendChild(st); _endStyled=true; }
    if(!_endEl){ _endEl=document.createElement('div'); _endEl.id='endToast'; document.body.appendChild(_endEl); }
    var el=_endEl;
    el.innerHTML='<span>'+(msg||'끝 · 이 갈래의 마지막입니다')+'</span><span class="et-sub">'+(sub||'End of this branch — ↑ 나가기로 뼈대로 돌아갑니다')+'</span>';
    el.classList.remove('fade'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(el._t1); clearTimeout(el._t2);
    el._t1=setTimeout(function(){ el.classList.add('fade'); el.classList.remove('show'); }, 1150);
    el._t2=setTimeout(function(){ el.classList.remove('fade'); }, 2750);
  }

  // ---------- Colors ----------
  var COL = { accent:'#ffb27a', blue:'#7ab8ff', green:'#8fe3b5', pink:'#f4a0c0', dim:'rgba(230,228,220,0.78)', faint:'rgba(255,255,255,0.22)', txt:'#9b99a3' };

  // ---------- Particles ----------
  var MAX=42, P=[];
  for(var i=0;i<MAX;i++) P.push({x:0,y:0,tx:0,ty:0,on:false,r:7,col:COL.accent,a:0,ta:0});
  function spawn(){ return {x:W/2+(Math.random()-.5)*60, y:H*0.58+(Math.random()-.5)*60}; }
  function setOn(list, col, r){
    for(var i=0;i<MAX;i++){
      if(i<list.length){ if(!P[i].on){ var s=spawn(); P[i].x=s.x; P[i].y=s.y; } P[i].on=true; P[i].ta=1;
        P[i].tx=list[i].x; P[i].ty=list[i].y; P[i].r=(list[i].r||r||7);
        P[i].col=(list[i].col||(typeof col==='function'?col(i):col)||COL.accent); }
      else { P[i].on=false; P[i].ta=0; P[i].tx=W/2; P[i].ty=H*0.62; }
    }
  }
  function renderParticles(){
    for(var i=0;i<MAX;i++){ var a=P[i]; a.x+=(a.tx-a.x)*0.12; a.y+=(a.ty-a.y)*0.12; a.a+=(a.ta-a.a)*0.12;
      if(a.a>0.02){ ctx.globalAlpha=a.a; ctx.fillStyle=a.col; ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,7); ctx.fill();
        ctx.globalAlpha=a.a*0.22; ctx.beginPath(); ctx.arc(a.x,a.y,a.r+5,0,7); ctx.fill(); ctx.globalAlpha=1; } }
  }

  // ---------- NumberLine 부품 ----------
  function NumberLine(){ this.min=-5; this.max=5; this.y=0.52; this.tmin=-5; this.tmax=5; }
  NumberLine.prototype.range=function(a,b){ this.tmin=a; this.tmax=b; return this; };
  NumberLine.prototype.step=function(){ this.min+=(this.tmin-this.min)*0.1; this.max+=(this.tmax-this.max)*0.1; };
  NumberLine.prototype.px=function(v){ var pad=70; return pad+(v-this.min)/(this.max-this.min)*(W-pad*2); };
  NumberLine.prototype.yy=function(){ return H*this.y; };
  NumberLine.prototype.val=function(x){ var pad=70; return this.min+(x-pad)/(W-pad*2)*(this.max-this.min); };
  NumberLine.prototype.draw=function(opts){ opts=opts||{}; var y=this.yy();
    ctx.strokeStyle=COL.faint; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(W-40,y); ctx.stroke();
    // arrow tips
    ctx.fillStyle=COL.faint; [[W-40,1],[60,-1]].forEach(function(p){ ctx.beginPath(); ctx.moveTo(p[0],y); ctx.lineTo(p[0]-8*p[1],y-5); ctx.lineTo(p[0]-8*p[1],y+5); ctx.fill(); });
    // integer ticks
    var lo=Math.ceil(this.min), hi=Math.floor(this.max), span=this.max-this.min;
    if(opts.integers!==false && (hi-lo)<=24){
      ctx.fillStyle=COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center';
      for(var v=lo; v<=hi; v++){ var x=this.px(v); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x,y-6); ctx.lineTo(x,y+6); ctx.stroke(); if(Math.abs(v)<=12) ctx.fillText(v, x, y+26); }
    }
  };
  NumberLine.prototype.dot=function(v,col,r){ var x=this.px(v),y=this.yy(); ctx.fillStyle=col||COL.accent; ctx.beginPath(); ctx.arc(x,y,r||6,0,7); ctx.fill(); };
  NumberLine.prototype.marker=function(v,col,label){ var x=this.px(v),y=this.yy();
    ctx.fillStyle=col||COL.accent; ctx.beginPath(); ctx.arc(x,y,12,0,7); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,12,0,7); ctx.stroke();
    if(label!=null){ ctx.fillStyle=col||COL.accent; ctx.font='600 24px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x, y-24); } };

  // ---------- Character / narration ----------
  var bubbleEl, hintEl, titleEl, secEl;
  function say(html){ if(!bubbleEl) return; bubbleEl.classList.add('fade');
    setTimeout(function(){ bubbleEl.innerHTML=html; bubbleEl.classList.remove('fade'); },170); }

  // ---------- generic DOM controls ----------
  var controlsEl, keyHintEl;
  // 키 조작 힌트 바(스택 push/pop 등 tap 장면) — sc.keys = [{code,key,label,act}]
  function renderKeyHint(sc){ if(!keyHintEl) return;
    if(sc && sc.keys && sc.keys.length){ var h='';
      for(var i=0;i<sc.keys.length;i++){ var k=sc.keys[i]; h+='<span class="kh-item"><kbd class="kc">'+(k.key||k.code.replace('Key',''))+'</kbd> '+k.label+'</span>'; }
      keyHintEl.innerHTML=h; keyHintEl.style.display='flex'; }
    else keyHintEl.style.display='none'; }
  // 슬라이더마다 다른 키쌍(감소/증가) — 3개 이상도 각자 단축키
  var SLIDER_KEYS=[['KeyA','KeyD','A','D'],['KeyF','KeyH','F','H'],['KeyJ','KeyL','J','L'],['KeyB','KeyN','B','N']];
  function controls(html){ if(!controlsEl) return; controlsEl.innerHTML=html||''; controlsEl.style.display=html?'flex':'none';
    var rs=controlsEl.querySelectorAll('input[type=range]'); if(!rs.length) return;
    var sliders=[].slice.call(rs), multi=sliders.length>1;
    // 슬라이더마다 세로 유닛으로 재구성: [라벨·슬라이더·값] 위, 그 슬라이더의 단축키를 바로 아래에
    for(var i=0;i<sliders.length;i++){ var sl=sliders[i];
      var av=sl.getAttribute('value'); if(av!=null) sl.value=av;   // value 속성 무시 방지
      var p=SLIDER_KEYS[i]||SLIDER_KEYS[SLIDER_KEYS.length-1];
      sl.setAttribute('data-kdec',p[0]); sl.setAttribute('data-kinc',p[1]);
      var lab=sl.previousElementSibling, out=sl.nextElementSibling;
      var unit=document.createElement('div'); unit.className='sl-unit';
      var row=document.createElement('div'); row.className='sl-row';
      if(lab && lab.tagName==='LABEL'){ lab.style.marginLeft=''; row.appendChild(lab); }
      row.appendChild(sl);
      if(out && out.tagName==='OUTPUT') row.appendChild(out);
      unit.appendChild(row);
      var hk=document.createElement('div'); hk.className='ctrl-keys';
      hk.innerHTML='<kbd class="kc">'+p[2]+'</kbd> ◂'+(multi?'':' 값 조절')+' ▸ <kbd class="kc">'+p[3]+'</kbd>';
      unit.appendChild(hk);
      controlsEl.appendChild(unit);
    }
    var emp=controlsEl.querySelectorAll('.ctrl');   // 비워진 원래 컨테이너 제거
    for(var j=0;j<emp.length;j++) if(!emp[j].querySelector('input,label,output')) emp[j].parentNode.removeChild(emp[j]);
  }
  function bind(sel,ev,fn){ var el=document.querySelector(sel); if(el) el.addEventListener(ev,fn); return el; }

  // 재사용 문제풀이(퀴즈) 부품 — 핵심→응용→문제풀이 흐름의 마지막 단계
  function quiz(cfg){ // {q, choices:[...], answer:idx, explain}
    var h='<div class="quiz"><div class="q">'+cfg.q+'</div><div class="opts">';
    for(var i=0;i<cfg.choices.length;i++) h+='<button class="opt" data-i="'+i+'"><span class="optk">'+(i+1)+'</span>'+cfg.choices[i]+'</button>';
    h+='</div><div class="fb" id="qfb">숫자 키 1~'+cfg.choices.length+' 로도 선택</div></div>';
    controls(h);
    var done=false, opts=controlsEl.querySelectorAll('.opt');
    for(var k=0;k<opts.length;k++){ opts[k].addEventListener('click',function(){ if(done)return;
      var i=+this.dataset.i, ok=(i===cfg.answer); this.classList.add(ok?'ok':'no');
      var fb=document.getElementById('qfb');
      if(ok){ done=true; fb.className='fb ok'; fb.innerHTML='✓ 정답! '+(cfg.explain||''); blip(720,0.22); }
      else { fb.className='fb no'; fb.innerHTML='다시 한번 볼까요?'; blip(200,0.2); }
    }); }
  }

  // ---------- big overlay ----------
  var bigEl,bigN,bigW;
  function big(n,w){ if(!bigEl)return; if(n==null){ bigEl.classList.add('hidden'); return; } bigEl.classList.remove('hidden'); bigN.innerHTML=n; bigW.innerHTML=w||''; }

  // ---------- 펼침 학습 패널 (scene.more = 상세설명 HTML, scene.problem = {q, solution}) ----------
  var studyEl, studyBody, studyMore, studyProb, chevLabel, branchPageEl, branchPageInner;
  function setStudy(sc){
    if(!studyEl) return;
    var has = !!(sc.more || sc.problem);
    studyEl.style.display = has ? 'flex' : 'none';
    studyEl.classList.remove('open'); if(document.body) document.body.classList.remove('study-open'); if(chevLabel) chevLabel.innerHTML='더 알아보기'+kc('W');
    if(studyMore){ var mh = sc.more ? ('<h4>더 알아보기</h4>'+sc.more) : '';
      if(sc.more_en) mh += '<div class="en-block">'+sc.more_en+'</div>';
      studyMore.innerHTML = mh; studyMore.style.display = mh?'block':'none'; }
    if(studyProb){
      if(sc.problem){ studyProb.style.display='block'; var p=sc.problem;
        studyProb.innerHTML = '<h4>연습 문제</h4><div class="prob-q">'+p.q+'</div>'
          +(p.q_en?'<div class="prob-q en-text">'+p.q_en+'</div>':'')
          +'<button class="sol-toggle" type="button">풀이 보기 ▾'+kc('R')+'</button>'
          +'<div class="prob-sol">'+p.solution+(p.sol_en?'<div class="en-text" style="margin-top:8px">'+p.sol_en+'</div>':'')+'</div>'; }
      else { studyProb.style.display='none'; studyProb.innerHTML=''; }
    }
  }
  function studyVisible(){ return studyEl && getComputedStyle(studyEl).display!=='none'; }
  function openStudy(){ if(!studyVisible()) return; studyEl.classList.add('open'); if(document.body) document.body.classList.add('study-open');
    if(studyBody) studyBody.scrollTop=0;   // 열 때마다 맨 위에서 시작(스크롤 위치는 항상 0으로 지정)
    if(chevLabel){ setTimeout(function(){ if(studyBody&&studyEl.classList.contains('open')&&studyBody.scrollHeight>studyBody.clientHeight+8) chevLabel.innerHTML='접기'+kc('W')+' <span class="scrollkc">'+kc('Q')+'/'+kc('Z')+' 스크롤</span>'; },360);
      chevLabel.innerHTML='접기'+kc('W'); } }
  function closeStudy(){ if(!studyVisible()) return; studyEl.classList.remove('open'); if(document.body) document.body.classList.remove('study-open'); if(chevLabel) chevLabel.innerHTML='더 알아보기'+kc('W'); }
  function toggleStudy(){ if(!studyVisible()) return; if(studyEl.classList.contains('open')) closeStudy(); else openStudy(); }
  // 연습문제 '풀이 보기/숨기기' 토글(R). 학습패널이 닫혀 있으면 먼저 펼친 뒤 풀이를 연다. 풀이 토글이 없으면 false 반환(다른 키 처리로 위임).
  function toggleSolution(){ if(!studyProb) return false; var btn=studyProb.querySelector('.sol-toggle'); if(!btn) return false;
    if(studyVisible() && !studyEl.classList.contains('open')) openStudy();
    btn.click(); return true; }

  // ---------- Scene Manager (계층형: 뼈대 spine + 분기 branch) ----------
  // 분기 장면은 content에서 sc.branchOf='<부모 뼈대 id>' 로 표시. 같은 branchOf끼리 순서대로 그룹.
  var SM={ scenes:[], cur:null };
  function addScenes(arr){ for(var i=0;i<arr.length;i++) SM.scenes.push(arr[i]); }
  var S={}; // 현재 장면 로컬 상태
  var HR={ spine:[], byId:{} }; // 계층 인덱스 (주의: 캔버스 높이 H와 이름 충돌 금지)

  function buildHierarchy(){
    var sc=SM.scenes; HR.spine=[]; HR.byId={};
    for(var i=0;i<sc.length;i++){ sc[i]._idx=i; sc[i]._branches=null; if(sc[i].id) HR.byId[sc[i].id]=i; }
    var spineNo=0;
    for(i=0;i<sc.length;i++){ if(!sc[i].branchOf){ spineNo++; sc[i]._isSpine=true; sc[i]._spineNo=spineNo; sc[i]._spinePos=HR.spine.length; sc[i]._num=''+spineNo; HR.spine.push(i); } }
    for(i=0;i<sc.length;i++){ var b=sc[i].branchOf; if(b!=null){ var pIdx=HR.byId[b]; sc[i]._isSpine=false; sc[i]._parentIdx=pIdx;
      if(pIdx!=null&&sc[pIdx]){ if(!sc[pIdx]._branches) sc[pIdx]._branches=[]; sc[pIdx]._branches.push(i); } } }
    // 분기 순서 = ord 필드 오름차순(기본 9999), 동률이면 파일 순서. 정렬 후 번호(_num) 부여 → 재배치/재정렬을 JSON ord만으로 제어.
    for(i=0;i<HR.spine.length;i++){ var pi=HR.spine[i], br=sc[pi]._branches; if(!br) continue;
      br.sort(function(x,y){ var ox=(sc[x].ord==null?9999:sc[x].ord), oy=(sc[y].ord==null?9999:sc[y].ord); return (ox-oy)||(x-y); });
      for(var k=0;k<br.length;k++){ sc[br[k]]._num=sc[pi]._spineNo+'.'+(k+1); } }
  }
  function crumbOf(sc){ var a=[];
    if(sc.branchOf!=null){ var p=SM.scenes[sc._parentIdx]; if(p){ if(p.ch)a.push({t:p.ch,i:null}); a.push({t:p.title,i:p._idx}); } a.push({t:sc.title,i:sc._idx,cur:true}); }
    else { if(sc.ch)a.push({t:sc.ch,i:null}); a.push({t:sc.title,i:sc._idx,cur:true}); }
    return a;
  }

  function buildTOC(){
    var toc=document.getElementById('toc'); if(!toc) return; toc.innerHTML='';
    var lastSec=null;
    HR.spine.forEach(function(idx){ var sc=SM.scenes[idx];
      if(sc.sec!==lastSec){ var h=document.createElement('div'); h.className='toc-sec'; h.textContent=sc.sec; toc.appendChild(h); lastSec=sc.sec; }
      var a=document.createElement('div'); a.className='toc-item'; a.textContent='#'+sc._num+'  '+sc.title; a.dataset.i=idx;
      a.onclick=function(){ goTo(+this.dataset.i); toggleTOC(false); }; toc.appendChild(a);
      if(sc._branches){ sc._branches.forEach(function(bi){ var b=SM.scenes[bi];
        var s=document.createElement('div'); s.className='toc-item toc-sub'; s.textContent='↳ #'+b._num+'  '+b.title; s.dataset.i=bi;
        s.onclick=function(){ goTo(+this.dataset.i); toggleTOC(false); }; toc.appendChild(s); }); }
    });
  }
  function paintTOC(){ var items=document.querySelectorAll('.toc-item'); items.forEach(function(el){ el.classList.toggle('active', +el.dataset.i===SM.cur); }); }
  function toggleTOC(force){ var p=document.getElementById('toc-panel'); if(!p)return; var open=(force!=null)?force:!p.classList.contains('open'); p.classList.toggle('open',open); }

  function progress(){ var b=document.getElementById('bar'); if(!b||!HR.spine.length) return; var sc=SM.scenes[SM.cur];
    var pos=(sc._isSpine?sc._spinePos:SM.scenes[sc._parentIdx]._spinePos); b.style.width=((pos+1)/HR.spine.length*100)+'%'; }

  function renderCrumb(sc){ var cb=document.getElementById('crumb'); if(!cb) return; cb.innerHTML='';
    var parts=crumbOf(sc);
    parts.forEach(function(p,k){ if(k>0){ var sep=document.createElement('span'); sep.className='crumb-sep'; sep.textContent='▸'; cb.appendChild(sep); }
      var el=document.createElement(p.i!=null?'span':'span'); el.className='crumb-seg'+(p.cur?' cur':'')+(sc.branchOf!=null&&p.cur?' branch':''); el.textContent=p.t;
      if(p.i!=null&&!p.cur){ el.classList.add('clk'); el.onclick=function(){ goTo(p.i); }; } cb.appendChild(el); });
  }
  function updateBranchBtn(sc){ var bb=document.getElementById('branchBtn'); if(!bb) return;
    if(sc._isSpine && sc._branches && sc._branches.length){ bb.style.display='inline-flex'; bb.innerHTML='📚 심화학습 ('+sc._branches.length+')'+kc('↓'); bb.className='btn branch-in'; bb.onclick=enterBranch; }
    else if(sc.branchOf!=null){ bb.style.display='inline-flex'; bb.innerHTML='나가기'+kc('↑'); bb.className='btn branch-out'; bb.onclick=exitBranch; }
    else { bb.style.display='none'; }
  }

  function goTo(i){ if(i<0||i>=SM.scenes.length) return; SM.cur=i; var sc=SM.scenes[i]; S={};
    say(sc.narr||''); if(hintEl)hintEl.textContent=sc.hint||''; if(titleEl)titleEl.textContent=sc.title||''; if(secEl)secEl.textContent=(sc.ch?sc.ch+' · ':'')+(sc.sec||'');
    var snEl=document.getElementById('sceneNo'); if(snEl) snEl.textContent='#'+(sc._num||(i+1));
    renderCrumb(sc); updateBranchBtn(sc); updateNavBtns(sc);
    controls(''); big(null); setStudy(sc);
    setVizMode(sc);                     // 코드+애니 viz 장면이면 2단 레이아웃 + 스텝, 아니면 레거시 풀스크린
    if(document.body) document.body.classList.toggle('in-branch', sc.branchOf!=null);  // 분기(세부학습) 진입 시 배경 틴트
    var pageMode = !!(sc.branchOf!=null && sc.page);   // 심화학습 책 페이지(중앙 본문). 말풍선·자세히보기·캔버스 숨김
    if(document.body) document.body.classList.toggle('page-mode', pageMode);
    if(branchPageInner){ branchPageInner.innerHTML = pageMode ? sc.page : '';
      if(branchPageEl){ if(pageMode){ branchPageEl.scrollTop=0;
          var chk=function(){ branchPageEl.classList.toggle('scrollable', branchPageEl.scrollHeight > branchPageEl.clientHeight + 8); };
          requestAnimationFrame(chk); setTimeout(chk, 180);   // SVG·이미지 레이아웃 후 재확인
        } else branchPageEl.classList.remove('scrollable'); } }
    if(sc.enter) sc.enter(E);
    renderKeyHint(sc);
    paintTOC(); progress(); blip(660,0.14);
  }
  // 이전/다음 버튼: 뼈대=장면 이동, 분기=형제 분기 이동(끝장 비활성), 단일분기=둘 다 비활성('나가기'만)
  function updateNavBtns(sc){ var pb=document.getElementById('prev'), nb=document.getElementById('next'); if(!pb||!nb) return;
    if(sc.branchOf!=null){ var sibs=SM.scenes[sc._parentIdx]._branches, pos=sibs.indexOf(SM.cur), n=sibs.length;
      pb.innerHTML=(pos>0?'◂ '+(pos-1):'◂')+kc('←');   // 좌 = 바로 전 페이지 번호(0부터)
      nb.innerHTML=(pos+1)+' / '+n+kc('→');            // 우 = 몇 개 중 몇 번째(현재/전체)
      pb.disabled=(pos<=0); nb.disabled=false;          // 마지막에서도 누르면 끝 알림(next()가 처리)
    } else {
      pb.innerHTML='◂ 이전'+kc('←'); pb.disabled=(sc._spinePos===0);
      var lastSpine=(sc._spinePos===HR.spine.length-1);
      nb.innerHTML=(lastSpine?'처음으로 ↺':'다음 ▸')+kc('→'); nb.disabled=false;
    } }
  // 뼈대=선형 이동. 분기 안=형제 분기만 이동(끝에서 멈춤, 복귀는 '나가기'↑).
  function next(){ var sc=SM.scenes[SM.cur];
    if(sc.branchOf!=null){ var sibs=SM.scenes[sc._parentIdx]._branches, pos=sibs.indexOf(SM.cur);
      if(pos<sibs.length-1) goTo(sibs[pos+1]);
      else endToast();   // 자세히보기(분기) 마지막에서 더 가려 하면 끝 알림
    } else { var sp2=sc._spinePos; goTo(sp2<HR.spine.length-1?HR.spine[sp2+1]:HR.spine[0]); }
  }
  function prev(){ var sc=SM.scenes[SM.cur];
    if(sc.branchOf!=null){ var sibs=SM.scenes[sc._parentIdx]._branches, pos=sibs.indexOf(SM.cur);
      if(pos>0) goTo(sibs[pos-1]);
    } else { if(sc._spinePos>0) goTo(HR.spine[sc._spinePos-1]); }
  }
  function enterBranch(){ var sc=SM.scenes[SM.cur]; if(sc._isSpine && sc._branches && sc._branches.length) goTo(sc._branches[0]); }
  function exitBranch(){ var sc=SM.scenes[SM.cur]; if(sc.branchOf!=null) goTo(sc._parentIdx); }

  // ---------- VIZ MODE: 코드 + 애니메이션 + 단계 컨트롤 (알고리즘 트랙) ----------
  // 장면이 .code(코드 줄 배열) + .build(V)→frames 를 가지면 viz 장면.
  // 각 frame = {line:코드줄(또는 배열), cap:설명HTML, ...상태}. draw(V, frame)로 렌더.
  // 코드 패널/스텝바 DOM이 없는 페이지(math.html)나 코드 없는 장면은 전혀 영향 없음(레거시 풀스크린).
  var codeBodyEl, conceptExtraEl, codeHeadEl, codeInputEl, skUpEl, skDnEl, stepStpEl, stepCapEl, sbPrev, sbNext, sbAuto, sbReset;
  var _steps=null, _stepI=0, _autoT=null;
  function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function kc(k){ return ' <kbd class="kc">'+k+'</kbd>'; }   // 버튼 단축키 표시
  // 더 알아보기 + 연습문제 블록 (영어는 'In English' 표제 없이 본문만)
  // 구현 코드 한 줄 가벼운 하이라이트: 주석(//~끝)을 먼저 떼고 키워드만 강조(중첩·속성오염 없음)
  function hlCode(line){ var s=escHtml(line), cm='', ci=s.indexOf('//');
    if(ci>=0){ cm='<span class="cc">'+s.slice(ci)+'</span>'; s=s.slice(0,ci); }
    s=s.replace(/\b(for|while|if|else|elif|return|def|function|void|int|long|bool|var|let|const|new|swap|true|false|null|None|and|or|not|in|break|continue)\b/g,'<span class="ck">$1</span>');
    return s+cm; }
  function implBlock(sc){ if(!sc.impl||!sc.impl.length) return '';
    var ci=''; for(var i=0;i<sc.impl.length;i++) ci+='<div class="il"><span class="iln">'+i+'</span><span class="ic">'+hlCode(sc.impl[i])+'</span></div>';
    return '<div class="cpt-sec"><div class="cpt-h">구현 코드'+(sc.impl_lang?' · '+sc.impl_lang:'')+'</div><div class="implcode">'+ci+'</div></div>'; }
  function richBlocks(sc){ var h=implBlock(sc);
    if(sc.more) h+='<div class="cpt-sec"><div class="cpt-h">핵심 요약</div>'+sc.more+'</div>';
    if(sc.more_en) h+='<div class="cpt-sec en">'+sc.more_en+'</div>';
    if(sc.problem){ var p=sc.problem; h+='<div class="cpt-sec"><div class="cpt-h">연습 문제</div><div>'+p.q+'</div>'
      +(p.q_en?'<div class="en">'+p.q_en+'</div>':'')
      +'<details class="cpt-sol"><summary>풀이 보기</summary>'+p.solution+(p.sol_en?'<div class="en" style="margin-top:6px">'+p.sol_en+'</div>':'')+'</details></div>'; }
    return h; }
  function renderCode(sc){ if(!codeBodyEl) return; var h='<div class="codelines">';
    for(var i=0;i<sc.code.length;i++){ h+='<div class="cl" data-i="'+i+'"><span class="ln">'+i+'</span><span class="ct">'+escHtml(sc.code[i])+'</span></div>'; }
    h+='</div>'; codeBodyEl.innerHTML=h;                                   // 코드만(스텝 캡션이 바로 아래로)
    if(conceptExtraEl){ var extra=richBlocks(sc); conceptExtraEl.innerHTML=extra?'<div class="concept codeextra">'+extra+'</div>':''; } }   // 핵심요약 = 스텝 아래
  // 개념 장면(실행 코드 없음): 왼쪽 패널에 설명(narr+핵심요약+문제)
  function renderConcept(sc){ if(codeBodyEl) codeBodyEl.innerHTML='';
    if(!conceptExtraEl) return; var h='<div class="concept">';
    if(sc.narr) h+='<div class="cpt-intro">'+sc.narr+'</div>';
    h+=richBlocks(sc)+'</div>'; conceptExtraEl.innerHTML=h; }
  function paintStep(){ if(!_steps) return; var f=_steps[_stepI]||{};
    if(codeBodyEl){ var cls=codeBodyEl.querySelectorAll('.cl'); for(var i=0;i<cls.length;i++) cls[i].classList.remove('on');
      var lines=(f.line!=null)?(Array.isArray(f.line)?f.line:[f.line]):[];
      lines.forEach(function(ln){ var el=codeBodyEl.querySelector('.cl[data-i="'+ln+'"]'); if(el){ el.classList.add('on'); el.scrollIntoView({block:'nearest'}); } }); }
    if(stepStpEl) stepStpEl.textContent='STEP '+(_stepI+1)+' / '+_steps.length;
    if(stepCapEl) stepCapEl.innerHTML=f.cap||'';
    if(sbPrev) sbPrev.disabled=(_stepI<=0);
    if(sbNext) sbNext.disabled=(_stepI>=_steps.length-1); }
  function stepNext(){ if(_steps&&_stepI<_steps.length-1){ _stepI++; paintStep(); blip(560,0.06); } else stopAuto(); }
  function stepPrev(){ if(_steps&&_stepI>0){ _stepI--; paintStep(); blip(420,0.06); } }
  function stepReset(){ if(_steps){ _stepI=0; paintStep(); stopAuto(); blip(340,0.1); } }
  function stopAuto(){ if(_autoT){ clearInterval(_autoT); _autoT=null; if(sbAuto) sbAuto.innerHTML='▶ 자동 재생'+kc('S'); } }
  function toggleAuto(){ if(_autoT){ stopAuto(); return; } if(!_steps) return; if(_stepI>=_steps.length-1){ _stepI=0; paintStep(); }
    if(sbAuto) sbAuto.innerHTML='⏸ 정지'+kc('S'); _autoT=setInterval(function(){ if(_stepI>=_steps.length-1){ stopAuto(); return; } stepNext(); }, 820); }
  function setVizMode(sc){ var hasCode=!!(sc.code&&sc.build), concept=!!sc.concept&&!hasCode, viz=hasCode||concept; sc._viz=viz;
    if(document.body){ document.body.classList.toggle('viz',viz); document.body.classList.toggle('viz-concept',concept); }
    stopAuto(); resize();
    if(codeInputEl){ if(hasCode&&sc.input){ codeInputEl.innerHTML='<span class="ik">입력</span>  '+sc.input; codeInputEl.setAttribute('data-on','1'); } else codeInputEl.removeAttribute('data-on'); }
    if(hasCode){ setOn([]); if(codeHeadEl) codeHeadEl.textContent='📌 '+(sc.title||'CODE');
      renderCode(sc); _steps=sc.build(E)||[]; _stepI=0; paintStep(); }
    else if(concept){ if(codeHeadEl) codeHeadEl.textContent='💡 '+(sc.title||''); renderConcept(sc);
      if(sc.build){ _steps=sc.build(E)||[]; _stepI=0; paintStep(); } else _steps=null; }   // 개념 장면도 build 있으면 단계 애니메이션(D/A/S)
    else { _steps=null; }
    if(document.body) document.body.classList.toggle('stepped', !!(_steps&&_steps.length>1));   // 스텝 캡션·버튼 표시(코드/개념 공통)
    setTimeout(updateScrollHints,30); }
  // 자세히보기 스크롤 힌트(Q/Z) 표시 갱신
  function updateScrollHints(){ var el=conceptExtraEl; if(!el||!skUpEl||!skDnEl) return;
    // 조작키(E/C)를 쓰는 장면(스택/큐)에선 스크롤은 Q/Z, 그 외엔 E/C
    var cs=(SM&&SM.cur!=null)?SM.scenes[SM.cur]:null, useEC=!(cs&&cs.keys);
    skUpEl.innerHTML='<kbd class="kc">'+(useEC?'E':'Q')+'</kbd> ▲ 위로';
    skDnEl.innerHTML='▼ 아래로 <kbd class="kc">'+(useEC?'C':'Z')+'</kbd>';
    var scrollable=el.scrollHeight>el.clientHeight+4 && getComputedStyle(el).display!=='none';
    if(!scrollable){ skUpEl.classList.add('hidden'); skDnEl.classList.add('hidden'); return; }
    skUpEl.classList.toggle('hidden', el.scrollTop<=2);
    skDnEl.classList.toggle('hidden', el.scrollTop>=el.scrollHeight-el.clientHeight-2); }
  function scrollConcept(dir){
    var bp=branchPageEl;   // 심화학습 책 페이지(page 모드)
    if(bp && document.body && document.body.classList.contains('page-mode') && bp.scrollHeight>bp.clientHeight+4){
      bp.scrollTop += dir*Math.max(120, bp.clientHeight*0.78); return true; }
    var el=conceptExtraEl;   // algo: 좌측 개념 패널
    if(el && getComputedStyle(el).display!=='none' && el.scrollHeight>el.clientHeight+4){
      el.scrollTop += dir*Math.max(110, el.clientHeight*0.7);   // 즉시 스크롤(smooth는 일부 환경서 무시됨)
      updateScrollHints(); return true; }
    var sm=studyBody;   // math: 자세히보기(W) 학습 패널
    if(studyEl&&studyEl.classList.contains('open')&&sm&&sm.scrollHeight>sm.clientHeight+4){
      sm.scrollTop+=dir*Math.max(110,sm.clientHeight*0.7); updateScrollHints(); return true; }
    return false; }

  // ---------- main loop ----------
  var frameN=0;
  function loop(){ frameN++; ctx.clearRect(0,0,W,H);
    var sc=(SM.cur!=null)?SM.scenes[SM.cur]:null;
    if(sc&&sc.back) sc.back(E,ctx);     // 배경(수직선 등) 먼저
    renderParticles();
    if(sc&&sc.draw&&!(sc.branchOf!=null&&sc.page)){ if(sc._viz&&_steps) sc.draw(E,_steps[_stepI]); else sc.draw(E,ctx); }  // viz면 현재 frame 전달. page 모드(심화학습 책 페이지)면 캔버스 그리기 생략
    requestAnimationFrame(loop);
  }

  // ---------- Plot: 좌표평면 + 함수 그래프 (재사용: 함수·미적분까지) ----------
  function Plot(){ this.xmin=-6;this.xmax=6;this.ymin=-4;this.ymax=8; }
  Plot.prototype.range=function(a,b,c,d){ this.xmin=a;this.xmax=b;this.ymin=c;this.ymax=d; return this; };
  Plot.prototype.geom=function(){ var m=70, top=H*0.15, bot=H*0.72, h=bot-top, w=Math.min(W-2*m, h*1.5), left=W/2-w/2; return {left:left,top:top,w:w,h:h,right:left+w,bot:bot}; };
  Plot.prototype.X=function(x){ var g=this.geom(); return g.left+(x-this.xmin)/(this.xmax-this.xmin)*g.w; };
  Plot.prototype.Y=function(y){ var g=this.geom(); return g.bot-(y-this.ymin)/(this.ymax-this.ymin)*g.h; };
  Plot.prototype.axes=function(){ var g=this.geom(), x, y, y0=this.Y(0), x0=this.X(0);
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    for(x=Math.ceil(this.xmin);x<=this.xmax;x++){ var px=this.X(x); ctx.beginPath(); ctx.moveTo(px,g.top); ctx.lineTo(px,g.bot); ctx.stroke(); }
    for(y=Math.ceil(this.ymin);y<=this.ymax;y++){ var py=this.Y(y); ctx.beginPath(); ctx.moveTo(g.left,py); ctx.lineTo(g.right,py); ctx.stroke(); }
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.5;
    if(this.ymin<=0&&this.ymax>=0){ ctx.beginPath(); ctx.moveTo(g.left,y0); ctx.lineTo(g.right,y0); ctx.stroke(); }
    if(this.xmin<=0&&this.xmax>=0){ ctx.beginPath(); ctx.moveTo(x0,g.top); ctx.lineTo(x0,g.bot); ctx.stroke(); }
    ctx.fillStyle=COL.txt; ctx.font='11px sans-serif';
    ctx.textAlign='center'; for(x=Math.ceil(this.xmin);x<=this.xmax;x++){ if(x!==0) ctx.fillText(x,this.X(x),y0+14); }
    ctx.textAlign='right'; for(y=Math.ceil(this.ymin);y<=this.ymax;y++){ if(y!==0) ctx.fillText(y,x0-6,this.Y(y)+4); } };
  Plot.prototype.curve=function(fn,col,wd){ ctx.strokeStyle=col||'#7ab8ff'; ctx.lineWidth=wd||2.5; ctx.beginPath(); var on=false;
    for(var i=0;i<=240;i++){ var x=this.xmin+(this.xmax-this.xmin)*i/240, y=fn(x);
      if(!isFinite(y)||y>this.ymax+3||y<this.ymin-3){ on=false; continue; }
      var px=this.X(x),py=this.Y(y); if(on) ctx.lineTo(px,py); else { ctx.moveTo(px,py); on=true; } }
    ctx.stroke(); };
  Plot.prototype.dot=function(x,y,col,label){ var px=this.X(x),py=this.Y(y); ctx.fillStyle=col||COL.accent; ctx.beginPath(); ctx.arc(px,py,6,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    if(label!=null){ ctx.fillStyle=col||COL.accent; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(label,px,py-13); } };

  // ---------- 깜빡임 / 탭 안내 (전 챕터 공용) ----------
  function blink(){ return 0.32+0.68*(0.5+0.5*Math.sin(frameN*0.13)); }
  function tapHint(cx,cy,text,pulse){ ctx.save();
    ctx.font='600 15px sans-serif'; ctx.textBaseline='middle';
    var kw=26, gap=10, tw=ctx.measureText(text).width, inner=tw+gap+kw;    // 텍스트 + D 키 배지(단계 진행)
    var w=inner+40, h=40, x=cx-w/2, y=cy-h/2;
    var pa=pulse?(0.55+0.45*Math.sin(frameN*0.10)):0.85;
    ctx.globalAlpha=pa*0.22; ctx.fillStyle='#d8814a'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();}else ctx.fillRect(x,y,w,h);
    ctx.globalAlpha=pa; ctx.strokeStyle='#d8814a'; ctx.lineWidth=1.6; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.stroke();}else ctx.strokeRect(x,y,w,h);
    var tx=cx-inner/2;
    ctx.textAlign='left'; ctx.fillStyle='#ffb27a'; ctx.fillText(text,tx,cy);
    var kx=tx+tw+gap, ky=cy-11;                                            // D 키 배지(단계 진행 단축키)
    ctx.lineWidth=1.3; ctx.strokeStyle='#ffb27a'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(kx,ky,kw,22,5);ctx.stroke();}else ctx.strokeRect(kx,ky,kw,22);
    ctx.font='700 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('D',kx+kw/2,cy+0.5);
    ctx.restore(); ctx.textBaseline='alphabetic'; ctx.textAlign='start'; }

  // ---------- engine facade (장면에 전달) ----------
  var E = {
    get ctx(){return ctx;}, get W(){return W;}, get H(){return H;}, get frame(){return frameN;},
    P:P, setOn:setOn, NL:new NumberLine(), Plot:new Plot(), COL:COL, S:function(){return S;},
    say:say, big:big, controls:controls, bind:bind, blip:blip, next:next, quiz:quiz,
    blink:blink, tapHint:tapHint
  };

  // ---------- boot ----------
  function start(opts){
    initStage(document.getElementById(opts.canvas));
    bubbleEl=document.getElementById('bubble'); hintEl=document.getElementById('hint');
    titleEl=document.getElementById('sceneTitle'); secEl=document.getElementById('sceneSec');
    controlsEl=document.getElementById('controls'); keyHintEl=document.getElementById('keyhint'); bigEl=document.getElementById('bignum');
    bigN=document.getElementById('bigN'); bigW=document.getElementById('bigW');
    // nav
    var nb=document.getElementById('next'), pb=document.getElementById('prev');
    if(nb)nb.onclick=next; if(pb)pb.onclick=prev;
    // 키보드 ← → 로 이전·다음 (슬라이더/입력 포커스 시엔 그쪽이 우선)
    global.addEventListener('keydown',function(e){
      var t=e.target;
      if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return;  // 텍스트 입력 중엔 무시(버튼 포커스는 막지 않음)
      if(document.querySelector('.cw-ov.open')) return;   // AI 채팅 열려 있으면 무시
      // ★ e.code 사용: 한글 입력기(IME)·자판배열과 무관하게 물리 키 인식(KeyD 등). e.key는 한글모드서 'ㅇ'로 들어와 실패.
      var s=SM.scenes[SM.cur], k=e.key, c=e.code, space=(k===' '||c==='Space'), enter=(k==='Enter');
      var viz=!!(s&&s._viz&&_steps);
      if(k==='ArrowRight'){ next(); e.preventDefault(); return; }
      if(k==='ArrowLeft'){ prev(); e.preventDefault(); return; }
      if(k==='ArrowDown'){ enterBranch(); e.preventDefault(); return; }   // ↓ 자세히(분기)로
      if(k==='ArrowUp'){ exitBranch(); e.preventDefault(); return; }      // ↑ 나가기
      // W 한 키로 자세히 보기(좌측 패널) 펼치기·접기 토글(math). viz(algo)에선 W=다음 단계.
      if(c==='KeyW'){ if(studyVisible()){ toggleStudy(); e.preventDefault(); return; } if(viz){ stepNext(); e.preventDefault(); } return; }
      if(c==='KeyX'){ if(viz){ stepReset(); e.preventDefault(); } return; }   // X = viz 초기화
      if(c==='KeyQ'){ scrollConcept(-1); e.preventDefault(); return; }   // Q 자세히보기 위로(보조)
      if(c==='KeyZ'){ scrollConcept(1); e.preventDefault(); return; }    // Z 자세히보기 아래로(보조)
      if(s&&s.keys){ for(var ki=0;ki<s.keys.length;ki++){ if(c===s.keys[ki].code){ s.keys[ki].act.call(s,E); e.preventDefault(); return; } } }  // 장면별 키 조작(스택/큐 E/C)
      if(c==='KeyR'){ if(toggleSolution()){ e.preventDefault(); } return; }   // R = 연습문제 풀이 보기/숨기기(math)
      if(c==='KeyE'){ scrollConcept(-1); e.preventDefault(); return; }   // E 자세히보기 위로(조작키 없는 장면)
      if(c==='KeyC'){ scrollConcept(1); e.preventDefault(); return; }    // C 자세히보기 아래로
      if(viz){   // 코드+스텝: A 이전 / D(Space·Enter) 다음 / S 자동
        if(c==='KeyD'||space||enter){ stepNext(); e.preventDefault(); }
        else if(c==='KeyA'){ stepPrev(); e.preventDefault(); }
        else if(c==='KeyS'){ toggleAuto(); e.preventDefault(); }
        return;
      }
      // 슬라이더(슬라이더별 키쌍) · 퀴즈(숫자) · 탭(D·Space) 장면
      if(controlsEl && controlsEl.style.display!=='none'){
        var rss=controlsEl.querySelectorAll('input[type=range]');
        for(var ri=0;ri<rss.length;ri++){ var rg=rss[ri], kd=rg.getAttribute('data-kdec'), ki=rg.getAttribute('data-kinc');
          if(c===kd||c===ki){ var st=parseFloat(rg.step)||1, v=parseFloat(rg.value)+(c===ki?st:-st);
            v=Math.max(parseFloat(rg.min), Math.min(parseFloat(rg.max), v)); rg.value=v; rg.dispatchEvent(new Event('input',{bubbles:true})); e.preventDefault(); return; } }
      }
      var dm=/^Digit([1-9])$/.exec(c);
      if(dm){ var opt=controlsEl&&controlsEl.querySelector('.opt[data-i="'+(parseInt(dm[1],10)-1)+'"]'); if(opt){ opt.click(); e.preventDefault(); } return; }
      if(c==='KeyD'&&s&&s.tap&&!s.keys){ s.tap(E, W/2, H/2); e.preventDefault(); return; }            // D = 단계 진행(애니메이션)
      if(c==='KeyS'&&s&&s.tap&&!s.keys){ if(s.s){ s.s.auto=!s.s.auto; s.s.hold=0; if(s.s.auto&&s.s.step>=3){ s.s.step=0; s.s.t=1; } } e.preventDefault(); return; }   // S = 자동 진행
    });
    var tb=document.getElementById('toc-toggle'); if(tb)tb.onclick=function(){toggleTOC();};
    // viz 코드 패널 + 스텝 컨트롤 (algo.html에만 존재)
    codeBodyEl=document.getElementById('codeBody'); conceptExtraEl=document.getElementById('conceptExtra'); codeHeadEl=document.getElementById('codeHead');
    codeInputEl=document.getElementById('codeInput'); skUpEl=document.getElementById('skUp'); skDnEl=document.getElementById('skDn');
    if(conceptExtraEl) conceptExtraEl.addEventListener('scroll', updateScrollHints);
    global.addEventListener('resize', updateScrollHints);
    stepStpEl=document.getElementById('stepStp'); stepCapEl=document.getElementById('stepCap');
    sbPrev=document.getElementById('sbPrev'); sbNext=document.getElementById('sbNext'); sbAuto=document.getElementById('sbAuto'); sbReset=document.getElementById('sbReset');
    if(sbPrev)sbPrev.onclick=stepPrev; if(sbNext)sbNext.onclick=stepNext; if(sbAuto)sbAuto.onclick=toggleAuto; if(sbReset)sbReset.onclick=stepReset;
    // 학습 패널: 꺽쇠 펼침 + 풀이 토글
    studyEl=document.getElementById('study'); studyBody=document.getElementById('studyBody'); studyMore=document.getElementById('studyMore'); studyProb=document.getElementById('studyProblem'); chevLabel=document.getElementById('chevLabel');
    branchPageEl=document.getElementById('branchPage'); branchPageInner=document.getElementById('branchPageInner');
    var chevBtn=document.getElementById('chevBtn');
    if(chevBtn) chevBtn.onclick=toggleStudy;
    if(studyProb) studyProb.addEventListener('click',function(e){ var btn=(e.target&&e.target.closest)?e.target.closest('.sol-toggle'):null; if(btn){ var s=studyProb.querySelector('.prob-sol'); var op=s.classList.toggle('show'); btn.innerHTML=(op?'풀이 숨기기 ▴':'풀이 보기 ▾')+kc('R'); } });
    // pointer routing
    cv.addEventListener('pointerdown',function(e){ var s=SM.scenes[SM.cur]; if(s){ if(s._viz&&_steps){ stepNext(); return; } if(s.down)s.down(E,e.clientX,e.clientY); if(s.tap)s.tap(E,e.clientX,e.clientY);} });
    cv.addEventListener('pointermove',function(e){ var s=SM.scenes[SM.cur]; if(s&&s.move)s.move(E,e.clientX,e.clientY); });
    cv.addEventListener('pointerup',function(e){ var s=SM.scenes[SM.cur]; if(s&&s.up)s.up(E); });
    // 눈 깜빡임
    var eL=document.getElementById('eyeL'), eR=document.getElementById('eyeR');
    if(eL) setInterval(function(){ eL.setAttribute('ry','0.6'); eR.setAttribute('ry','0.6'); setTimeout(function(){ eL.removeAttribute('ry'); eR.removeAttribute('ry'); },140); },3600);
    function relayout(){ resize(); var s=SM.scenes[SM.cur]; if(s&&s.layout) s.layout(E); }
    function boot(){ buildHierarchy(); buildTOC(); loop(); goTo(0);
      global.addEventListener('load', relayout); setTimeout(relayout,200); setTimeout(relayout,600); }
    // ── 콘텐츠(텍스트)는 content/*.json 에서 로드 → 동작(코드)과 분리. 편집은 JSON만 하면 반영 ──
    var cfiles=(opts.content||['content/ch1.json','content/ch2.json','content/ch3.json','content/ch4.json','content/ch5.json']);
    var cb='?v='+Date.now();
    Promise.all(cfiles.map(function(f){ return fetch(f+cb).then(function(r){ return r.json(); }).catch(function(err){ console.warn('[content] load fail', f, err); return {}; }); }))
      .then(function(jsons){ var m={}; jsons.forEach(function(j){ for(var k in j) m[k]=j[k]; });
        SM.scenes.forEach(function(sc){ var c=m[sc.id]; if(c){ for(var k in c) sc[k]=c[k]; } });
        boot();
      })
      .catch(function(e){ console.warn('[content] merge fail', e); boot(); });
  }

  global.Engine = { start:start, addScenes:addScenes, NumberLine:NumberLine, goTo:goTo, enterBranch:enterBranch, exitBranch:exitBranch };
})(window);
