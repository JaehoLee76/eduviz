/* 인공지능 트랙 — 시작 시퀀스 (시네마틱 오프닝 · 환영 · 16장 윤곽)
   동작(behavior)만. 텍스트는 content/ai0.json. 반드시 content_ai1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 색: AI=시안 테마(#3dd6dc).
   골든룰: 화면의 직선·손실·기울기는 모두 실시간 경사하강(수치 계산)으로 산출(베껴 그리기 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3';
  // 딥러닝의 아버지 제프리 힌턴 — 역전파를 부활시켜 신경망 시대를 연 인물(인트로 배경)
  var HINTON=new Image(); var HINTON_OK=false; HINTON.onload=function(){ HINTON_OK=true; }; HINTON.src='assets/hinton.svg';

  // 결정적(난수 없음) 학습용 데이터: 참 직선 y=0.6x+0.18 둘레에 해시 잡음
  var DATA=(function(){ var a=[],N=11; for(var i=0;i<N;i++){ var x=0.06+i/(N-1)*0.88;
    var n=((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5;            // 결정적 잡음 -0.5..0.5
    a.push([x, 0.6*x+0.18 + n*0.16]); } return a; })();
  // nSteps번 경사하강(MSE) 후 직선 파라미터·손실 반환 — 매 프레임 실제 계산
  function gd(nSteps){ var w=0,b=0,lr=0.5,N=DATA.length;
    for(var s=0;s<nSteps;s++){ var gw=0,gb=0; for(var i=0;i<N;i++){ var e=(w*DATA[i][0]+b)-DATA[i][1]; gw+=e*DATA[i][0]; gb+=e; }
      gw=2*gw/N; gb=2*gb/N; w-=lr*gw; b-=lr*gb; }
    var mse=0; for(i=0;i<N;i++){ var e2=(w*DATA[i][0]+b)-DATA[i][1]; mse+=e2*e2; } mse/=N;
    return {w:w,b:b,mse:mse}; }

  var scenes = [

  // ── 시네마틱: 흩어진 점에 직선이 '스스로 맞춰진다'(경사하강) → 신경망 점화 → 엔드카드(힌턴) ──
  { id:'ai0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/hinton.svg', name:'제프리 힌턴',
      sub:'Geoffrey Hinton · 1947–<br>딥러닝의 아버지 (역전파 부활 · 2024 노벨물리학상)',
      caps:[
        ['인공지능의 세계로 초대합니다'],
        ['1980년대, 신경망은 한물간 아이디어로 외면받았습니다 —','제프리 힌턴은 홀로 그 불씨를 지켰습니다.'],
        ['여러 층으로 쌓은 인공 신경망에 오차를 거꾸로 흘려보내','(역전파) 기계가 스스로 배우게 하는 길을 열었죠.'],
        ['데이터가 쌓이고 계산이 빨라지자, 불씨는 들불이 되었습니다.','이미지를 알아보고, 말을 이해하고, 글을 짓는 기계 —'],
        ['거기에 ‘어텐션’이 더해져 거대 언어 모델(LLM)이 태어납니다.','지금 여러분과 대화하는 이 AI도 그 후예입니다.'],
        ['그런데 기계는 대체 어떻게 ‘배운다’는 걸까요?','흩어진 점들에 가장 잘 맞는 직선을 찾는 일 —'],
        ['숫자 몇 개(가중치)를 조금씩 고쳐 오차를 줄여 갑니다.','이 단순한 ‘경사하강’이 모든 학습의 심장입니다.'],
        ['그 작은 원리에서 오늘의 지능이 피어올랐습니다.','기초부터 LLM·에이전트까지 — 함께 파헤쳐 볼까요?']
      ] },
    enter:function(E){ this.s={ ended:false, acc:0, last:0 }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=1215, FADE=18, HOLD=170;
      var _n=(typeof performance!=="undefined"&&performance.now)?performance.now():0, _dt=s.last?(_n-s.last):16.7; if(_dt<0||_dt>200)_dt=16.7; s.last=_n; s.acc+=_dt*0.036; var local=s.acc;
      if(local>=ANIM+HOLD){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      // 힌턴 초상(은은한 배경)
      if(HINTON_OK){ var ar=HINTON.width/HINTON.height||0.83, dh=H*0.82, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.34+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(2px)';
        ctx.drawImage(HINTON, ix, iy, dw, dh); ctx.restore(); }
      // 별/먼지 배경
      for(var i=0;i<54;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.016+i));
        ctx.fillStyle='rgba(120,230,235,'+(tw*0.4*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.9, 1.6,1.6); }
      // 좌표계
      var ox=W*0.16, pw=W*0.68, oy=H*0.80, pv=H*0.52;
      function SX(x){ return ox + x*pw; }
      function SY(y){ return oy - y/1.05*pv; }
      ctx.globalAlpha=seam; ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      // 데이터 점(페이드 인)
      var pa=ss(0,1,ph/0.18);
      for(i=0;i<DATA.length;i++){ ctx.fillStyle='rgba(127,233,238,'+(0.9*pa*seam)+')'; ctx.beginPath(); ctx.arc(SX(DATA[i][0]),SY(DATA[i][1]),5,0,7); ctx.fill(); }
      // 직선 학습(경사하강): ph 0.18~0.85 → nSteps 0..60(실제 GD)
      if(ph>=0.12){ var fp=ss(0,1,(ph-0.12)/0.66), nSteps=Math.round(fp*60), r=gd(nSteps);
        // 잔차(점→직선 수직선)
        ctx.strokeStyle='rgba(244,160,192,'+(0.5*seam)+')'; ctx.lineWidth=1.2;
        for(i=0;i<DATA.length;i++){ var yh=r.w*DATA[i][0]+r.b; ctx.beginPath(); ctx.moveTo(SX(DATA[i][0]),SY(DATA[i][1])); ctx.lineTo(SX(DATA[i][0]),SY(yh)); ctx.stroke(); }
        // 학습된 직선
        ctx.strokeStyle='rgba(255,210,122,'+(0.96*seam)+')'; ctx.lineWidth=2.6; ctx.beginPath();
        ctx.moveTo(SX(0),SY(r.b)); ctx.lineTo(SX(1),SY(r.w+r.b)); ctx.stroke();
        // 손실 실측값(감소)
        ctx.globalAlpha=seam; ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('손실(MSE) = '+r.mse.toFixed(4)+'   ·   '+nSteps+'번째 학습', ox, oy+26);
      }
      // 마무리(ph>0.85): 작은 신경망 점화
      if(ph>=0.84){ var np=ss(0,1,(ph-0.84)/0.16), nx=W*0.80, ny=H*0.32, L=[2,3,1], gap=46;
        for(var l=0;l<L.length;l++){ for(var k=0;k<L[l];k++){ var cx2=nx+l*gap, cy2=ny+(k-(L[l]-1)/2)*30;
          if(l<L.length-1){ for(var k2=0;k2<L[l+1];k2++){ var cy3=ny+(k2-(L[l+1]-1)/2)*30;
            ctx.strokeStyle='rgba(61,214,220,'+(0.5*np*seam)+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(nx+(l+1)*gap,cy3); ctx.stroke(); } }
          ctx.fillStyle='rgba(20,40,46,'+(np*seam)+')'; ctx.strokeStyle='rgba(127,233,238,'+(np*seam)+')'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.arc(cx2,cy2,6,0,7); ctx.fill(); ctx.stroke(); } }
      }
      ctx.globalAlpha=1; ctx.lineWidth=1;
      // 상단 대화체 문구
      var caps=this.story.caps;
      var slot=1/caps.length, ci=Math.floor(ph/slot), lp=(ph-ci*slot)/slot;
      var aa=(lp<0.2? lp/0.2 : lp>0.8? (1-lp)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(160,236,240,'+aa.toFixed(3)+')':'rgba(224,240,242,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  },

  // ── 환영: 손실 곡면을 따라 공이 굴러 내려간다(경사하강이 최소를 찾는 그림) ──
  { id:'ai0_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, t=(E.frame%600)/600;
      // 손실 L(w) = (w-1.3)^2*0.7 + 0.15 (볼록). 경사하강 w←w-η·L'(w) 실제 반복
      function L(w){ return 0.7*(w-1.3)*(w-1.3)+0.15; }
      function dL(w){ return (L(w+1e-3)-L(w-1e-3))/2e-3; }
      var nSteps=Math.round(t*42), w=-1.4, lr=0.18; for(var s=0;s<nSteps;s++){ w-=lr*dL(w); }
      var X0=-1.8,X1=4.0, ox=W*0.16,pw=W*0.68, oy=H*0.74, pv=H*0.50, LMAX=L(X0);
      function SX(x){ return ox+(x-X0)/(X1-X0)*pw; }
      function SY(y){ return oy - y/LMAX*pv; }
      // 손실 곡선
      ctx.strokeStyle='rgba(61,214,220,0.92)'; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=X0;x<=X1;x+=0.03){ var p=SY(L(x)); if(x===X0)ctx.moveTo(SX(x),p); else ctx.lineTo(SX(x),p); } ctx.stroke();
      // 최소점 표시
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(SX(1.3),oy); ctx.lineTo(SX(1.3),SY(L(1.3))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('최소(최적 가중치)', SX(1.3), oy+18);
      // 굴러가는 공 + 접선 기울기(=경사)
      var m=dL(w); ctx.strokeStyle='rgba(255,210,122,0.85)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(SX(w-0.8),SY(L(w)-m*0.8*(LMAX/(X1-X0))*0)); // (시각 보조선 생략용)
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(SX(w),SY(L(w)),8,0,7); ctx.fill();
      ctx.fillStyle='#caa86a'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('손실 L', SX(X0)+4, SY(LMAX)-6);
      ctx.fillStyle=GLD; ctx.textAlign='center'; ctx.fillText('w = '+w.toFixed(2)+'   L = '+L(w).toFixed(3)+'   (기울기 '+m.toFixed(2)+')', SX(w), SY(L(w))-16);
      E.big('학습 = 손실을 줄이는 일', '가중치 w를 기울기 반대 방향으로 조금씩 옮기면(경사하강) 손실 골짜기로 굴러 내려갑니다. 이 단순한 반복이 회귀부터 거대 신경망까지 모두를 학습시킵니다. 다음 ▸ 로 여정을 시작하세요'); }
  },

  // ── 전체 윤곽: AI 16장 여정 지도 ──
  { id:'ai0_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#dffafa'; ctx.font='600 19px sans-serif'; ctx.fillText('인공지능의 여정 — 다섯 묶음, 열여섯 정거장', cx, H*0.12);
      ctx.fillStyle='#8a9396'; ctx.font='13px sans-serif'; ctx.fillText('데이터에서 출발해 머신러닝·딥러닝을 거쳐 Transformer·LLM·에이전트까지 — 앞장이 곧 뒷장의 열쇠입니다.', cx, H*0.12+22);
      var groups=[
        {c:CYA, t:'기초',         items:['AI·ML·DL 개관','데이터와 학습']},
        {c:GLD, t:'머신러닝',     items:['지도학습','모델 평가','핵심 알고리즘']},
        {c:GRN, t:'딥러닝',       items:['신경망·순전파','역전파·최적화','CNN','RNN·시퀀스']},
        {c:'#9fd0ff', t:'트랜스포머·LLM', items:['임베딩·어텐션','Transformer','사전학습·LLM','정렬·프롬프트']},
        {c:PNK, t:'실무·에이전트', items:['RAG·벡터검색','Agent AI','파이썬 생태계']}
      ];
      var n=groups.length, x0=W*0.04, colW=W*0.92/n, top=H*0.27;
      var maxI=0; for(var q=0;q<n;q++) maxI=Math.max(maxI,groups[q].items.length);
      var rowH=Math.min(38,(H*0.50)/Math.max(1,maxI));
      for(var i=0;i<n;i++){ var g=groups[i], cxi=x0+i*colW+colW*0.5;
        ctx.fillStyle=g.c; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(g.t, cxi, top-14);
        for(var k=0;k<g.items.length;k++){ var y=top+k*(rowH+8), bw=colW*0.84, bx=cxi-bw/2;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw,rowH,8);}else{ctx.beginPath();ctx.rect(bx,y,bw,rowH);}
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); ctx.strokeStyle=g.c; ctx.lineWidth=1; ctx.globalAlpha=0.55; ctx.stroke(); ctx.globalAlpha=1;
          ctx.fillStyle='#dfeef0'; ctx.font='12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(g.items[k], cxi, y+(rowH-8)/2+4); }
        if(i<n-1){ ctx.fillStyle='rgba(61,214,220,0.4)'; ctx.font='18px sans-serif'; ctx.fillText('▸', x0+(i+1)*colW, top+rowH*0.6); } }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('1장 AI·ML·DL 개관부터 시작합니다 — 다음 ▸', cx, H*0.93); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
