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
    var o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;
    o.type=type||'sine'; o.frequency.value=f; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.08,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.25)); o.start(t); o.stop(t+(dur||0.25)+0.02);
  }catch(e){} }
  global.addEventListener('pointerdown',function(){ if(actx&&actx.state==='suspended')actx.resume(); });

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
  var controlsEl;
  function controls(html){ if(!controlsEl) return; controlsEl.innerHTML=html||''; controlsEl.style.display=html?'flex':'none';
    // range 슬라이더 value 속성이 무시되고 중앙으로 뜨는 문제 방지: 속성값을 프로퍼티로 강제
    var rs=controlsEl.querySelectorAll('input[type=range]'); for(var i=0;i<rs.length;i++){ var av=rs[i].getAttribute('value'); if(av!=null) rs[i].value=av; } }
  function bind(sel,ev,fn){ var el=document.querySelector(sel); if(el) el.addEventListener(ev,fn); return el; }

  // 재사용 문제풀이(퀴즈) 부품 — 핵심→응용→문제풀이 흐름의 마지막 단계
  function quiz(cfg){ // {q, choices:[...], answer:idx, explain}
    var h='<div class="quiz"><div class="q">'+cfg.q+'</div><div class="opts">';
    for(var i=0;i<cfg.choices.length;i++) h+='<button class="opt" data-i="'+i+'">'+cfg.choices[i]+'</button>';
    h+='</div><div class="fb" id="qfb">&nbsp;</div></div>';
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
  var studyEl, studyMore, studyProb, chevLabel;
  function setStudy(sc){
    if(!studyEl) return;
    var has = !!(sc.more || sc.problem);
    studyEl.style.display = has ? 'flex' : 'none';
    studyEl.classList.remove('open'); if(chevLabel) chevLabel.textContent='자세히 보기';
    if(studyMore){ var mh = sc.more ? ('<h4>더 알아보기</h4>'+sc.more) : '';
      if(sc.more_en) mh += '<div class="en-block"><div class="en-tag">IN ENGLISH</div>'+sc.more_en+'</div>';
      studyMore.innerHTML = mh; studyMore.style.display = mh?'block':'none'; }
    if(studyProb){
      if(sc.problem){ studyProb.style.display='block'; var p=sc.problem;
        studyProb.innerHTML = '<h4>연습 문제</h4><div class="prob-q">'+p.q+'</div>'
          +(p.q_en?'<div class="prob-q en-text">'+p.q_en+'</div>':'')
          +'<button class="sol-toggle" type="button">풀이 보기 ▾</button>'
          +'<div class="prob-sol">'+p.solution+(p.sol_en?'<div class="en-text" style="margin-top:8px">'+p.sol_en+'</div>':'')+'</div>'; }
      else { studyProb.style.display='none'; studyProb.innerHTML=''; }
    }
  }

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
    var bc={};
    for(i=0;i<sc.length;i++){ var b=sc[i].branchOf; if(b!=null){ var pIdx=HR.byId[b]; sc[i]._isSpine=false; sc[i]._parentIdx=pIdx;
      bc[b]=(bc[b]||0)+1; var pNo=(pIdx!=null&&sc[pIdx])?sc[pIdx]._spineNo:'?'; sc[i]._num=pNo+'.'+bc[b];
      if(pIdx!=null&&sc[pIdx]){ if(!sc[pIdx]._branches) sc[pIdx]._branches=[]; sc[pIdx]._branches.push(i); } } }
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
    if(sc._isSpine && sc._branches && sc._branches.length){ bb.style.display='inline-flex'; bb.textContent='🔍 자세히 ('+sc._branches.length+'갈래)'; bb.className='btn branch-in'; bb.onclick=enterBranch; }
    else if(sc.branchOf!=null){ bb.style.display='inline-flex'; bb.textContent='↩ 뼈대로'; bb.className='btn branch-out'; bb.onclick=exitBranch; }
    else { bb.style.display='none'; }
  }

  function goTo(i){ if(i<0||i>=SM.scenes.length) return; SM.cur=i; var sc=SM.scenes[i]; S={};
    say(sc.narr||''); if(hintEl)hintEl.textContent=sc.hint||''; if(titleEl)titleEl.textContent=sc.title||''; if(secEl)secEl.textContent=(sc.ch?sc.ch+' · ':'')+(sc.sec||'');
    var snEl=document.getElementById('sceneNo'); if(snEl) snEl.textContent='#'+(sc._num||(i+1));
    renderCrumb(sc); updateBranchBtn(sc);
    var pb=document.getElementById('prev'), nb=document.getElementById('next');
    if(pb) pb.disabled=(sc._isSpine && sc._spinePos===0);
    if(nb){ var lastSpine=(sc._isSpine && sc._spinePos===HR.spine.length-1);
      var lastBranch=(sc.branchOf!=null); // 분기 안에서는 '다음'이 다음 분기/뼈대 복귀
      nb.textContent=lastSpine?'처음으로 ↺':'다음 ▸'; }
    controls(''); big(null); setStudy(sc);
    setVizMode(sc);                     // 코드+애니 viz 장면이면 2단 레이아웃 + 스텝, 아니면 레거시 풀스크린
    if(sc.enter) sc.enter(E);
    paintTOC(); progress(); blip(660,0.14);
  }
  // 뼈대 위에서만 선형 이동(분기는 건너뜀). 분기 안에서는 분기 내 이동 후 뼈대 복귀.
  function next(){ var sc=SM.scenes[SM.cur];
    if(sc.branchOf!=null){ var sibs=SM.scenes[sc._parentIdx]._branches, pos=sibs.indexOf(SM.cur);
      if(pos<sibs.length-1) goTo(sibs[pos+1]); else { var sp=SM.scenes[sc._parentIdx]._spinePos; goTo(sp<HR.spine.length-1?HR.spine[sp+1]:HR.spine[0]); }
    } else { var sp2=sc._spinePos; goTo(sp2<HR.spine.length-1?HR.spine[sp2+1]:HR.spine[0]); }
  }
  function prev(){ var sc=SM.scenes[SM.cur];
    if(sc.branchOf!=null){ var sibs=SM.scenes[sc._parentIdx]._branches, pos=sibs.indexOf(SM.cur);
      if(pos>0) goTo(sibs[pos-1]); else goTo(sc._parentIdx);
    } else { if(sc._spinePos>0) goTo(HR.spine[sc._spinePos-1]); }
  }
  function enterBranch(){ var sc=SM.scenes[SM.cur]; if(sc._isSpine && sc._branches && sc._branches.length) goTo(sc._branches[0]); }
  function exitBranch(){ var sc=SM.scenes[SM.cur]; if(sc.branchOf!=null) goTo(sc._parentIdx); }

  // ---------- VIZ MODE: 코드 + 애니메이션 + 단계 컨트롤 (알고리즘 트랙) ----------
  // 장면이 .code(코드 줄 배열) + .build(V)→frames 를 가지면 viz 장면.
  // 각 frame = {line:코드줄(또는 배열), cap:설명HTML, ...상태}. draw(V, frame)로 렌더.
  // 코드 패널/스텝바 DOM이 없는 페이지(math.html)나 코드 없는 장면은 전혀 영향 없음(레거시 풀스크린).
  var codeBodyEl, codeHeadEl, stepStpEl, stepCapEl, sbPrev, sbNext, sbAuto, sbReset;
  var _steps=null, _stepI=0, _autoT=null;
  function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function renderCode(sc){ if(!codeBodyEl) return; var h='';
    for(var i=0;i<sc.code.length;i++){ h+='<div class="cl" data-i="'+i+'"><span class="ln">'+i+'</span><span class="ct">'+escHtml(sc.code[i])+'</span></div>'; }
    codeBodyEl.innerHTML=h; }
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
  function stopAuto(){ if(_autoT){ clearInterval(_autoT); _autoT=null; if(sbAuto) sbAuto.textContent='▶ 자동 재생'; } }
  function toggleAuto(){ if(_autoT){ stopAuto(); return; } if(!_steps) return; if(_stepI>=_steps.length-1){ _stepI=0; paintStep(); }
    if(sbAuto) sbAuto.textContent='⏸ 정지'; _autoT=setInterval(function(){ if(_stepI>=_steps.length-1){ stopAuto(); return; } stepNext(); }, 820); }
  function setVizMode(sc){ var viz=!!(sc.code&&sc.build); sc._viz=viz;
    if(document.body) document.body.classList.toggle('viz',viz);
    stopAuto(); resize();
    if(viz){ setOn([]); if(codeHeadEl) codeHeadEl.textContent='📌 '+(sc.title||'CODE');
      renderCode(sc); _steps=sc.build(E)||[]; _stepI=0; paintStep(); }
    else { _steps=null; } }

  // ---------- main loop ----------
  var frameN=0;
  function loop(){ frameN++; ctx.clearRect(0,0,W,H);
    var sc=(SM.cur!=null)?SM.scenes[SM.cur]:null;
    if(sc&&sc.back) sc.back(E,ctx);     // 배경(수직선 등) 먼저
    renderParticles();
    if(sc&&sc.draw){ if(sc._viz&&_steps) sc.draw(E,_steps[_stepI]); else sc.draw(E,ctx); }  // viz면 현재 frame 전달
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
    ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    var w=ctx.measureText(text).width+36, h=40, x=cx-w/2, y=cy-h/2;
    var pa=pulse?(0.55+0.45*Math.sin(frameN*0.10)):0.85;
    ctx.globalAlpha=pa*0.22; ctx.fillStyle='#d8814a'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();}else ctx.fillRect(x,y,w,h);
    ctx.globalAlpha=pa; ctx.strokeStyle='#d8814a'; ctx.lineWidth=1.6; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.stroke();}else ctx.strokeRect(x,y,w,h);
    ctx.fillStyle='#ffb27a'; ctx.fillText(text,cx,cy); ctx.restore(); ctx.textBaseline='alphabetic'; }

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
    controlsEl=document.getElementById('controls'); bigEl=document.getElementById('bignum');
    bigN=document.getElementById('bigN'); bigW=document.getElementById('bigW');
    // nav
    var nb=document.getElementById('next'), pb=document.getElementById('prev');
    if(nb)nb.onclick=next; if(pb)pb.onclick=prev;
    // 키보드 ← → 로 이전·다음 (슬라이더/입력 포커스 시엔 그쪽이 우선)
    global.addEventListener('keydown',function(e){
      var t=e.target;
      if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='BUTTON'||t.isContentEditable)) return;
      if(e.key==='ArrowRight'){ next(); e.preventDefault(); }
      else if(e.key==='ArrowLeft'){ prev(); e.preventDefault(); }
      else if(e.key==='ArrowDown'){ enterBranch(); e.preventDefault(); }   // ↓ 분기(자세히)로 들어가기
      else if(e.key==='ArrowUp'){ exitBranch(); e.preventDefault(); }      // ↑ 뼈대로 나오기
      // Space/Enter = 한 단계 진행 (viz면 다음 스텝, 레거시면 tap). 캔버스 클릭 막힌 환경 대체 입력
      else if(e.key===' '||e.key==='Enter'){ var s=SM.scenes[SM.cur]; if(s&&s._viz){ stepNext(); e.preventDefault(); } else if(s&&s.tap){ s.tap(E, W/2, H/2); e.preventDefault(); } }
    });
    var tb=document.getElementById('toc-toggle'); if(tb)tb.onclick=function(){toggleTOC();};
    // viz 코드 패널 + 스텝 컨트롤 (algo.html에만 존재)
    codeBodyEl=document.getElementById('codeBody'); codeHeadEl=document.getElementById('codeHead');
    stepStpEl=document.getElementById('stepStp'); stepCapEl=document.getElementById('stepCap');
    sbPrev=document.getElementById('sbPrev'); sbNext=document.getElementById('sbNext'); sbAuto=document.getElementById('sbAuto'); sbReset=document.getElementById('sbReset');
    if(sbPrev)sbPrev.onclick=stepPrev; if(sbNext)sbNext.onclick=stepNext; if(sbAuto)sbAuto.onclick=toggleAuto; if(sbReset)sbReset.onclick=stepReset;
    // 학습 패널: 꺽쇠 펼침 + 풀이 토글
    studyEl=document.getElementById('study'); studyMore=document.getElementById('studyMore'); studyProb=document.getElementById('studyProblem'); chevLabel=document.getElementById('chevLabel');
    var chevBtn=document.getElementById('chevBtn');
    if(chevBtn) chevBtn.onclick=function(){ var open=studyEl.classList.toggle('open'); if(chevLabel)chevLabel.textContent=open?'접기':'자세히 보기'; };
    if(studyProb) studyProb.addEventListener('click',function(e){ if(e.target&&e.target.classList&&e.target.classList.contains('sol-toggle')){ var s=studyProb.querySelector('.prob-sol'); var op=s.classList.toggle('show'); e.target.textContent=op?'풀이 숨기기 ▴':'풀이 보기 ▾'; } });
    // pointer routing
    cv.addEventListener('pointerdown',function(e){ var s=SM.scenes[SM.cur]; if(s){ if(s._viz){ stepNext(); return; } if(s.down)s.down(E,e.clientX,e.clientY); if(s.tap)s.tap(E,e.clientX,e.clientY);} });
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
