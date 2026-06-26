/* 알고리즘 — 시작 시퀀스 (Greeting · 전체 윤곽 · 첫 걸음 스토리)
   마스코트 '에이스타(A*)'가 안내. 비-viz 풀스크린 인트로(코드/concept 아님 → 캐릭터+말풍선 노출).
   텍스트는 content/algo0.json. 반드시 content_algo1.js 보다 먼저 로드(시작이 맨 앞). */
(function(){
  var BLU='#7ab8ff', GRN='#8fe3b5', ORA='#ffb27a', DIM='#9b99a3';
  var ADA=new Image(); var ADA_OK=false; ADA.onload=function(){ ADA_OK=true; }; ADA.src='assets/ada.jpg';   // 최초의 프로그래머 에이다 러브레이스 — 인트로 배경
  // ── 공용 심화 섹션 '학습 지도' 렌더러 (모든 섹션 노드가 데이터만으로 사용) ──
  // cfg = { title, sub, stages:[{c,t,items:[]}], foot }
  window.AlgoMap = function(E, cfg){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
    function rr(x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle='#dfeefb'; ctx.font='600 19px sans-serif'; ctx.fillText(cfg.title, cx, H*0.11);
    if(cfg.sub){ ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.fillText(cfg.sub, cx, H*0.11+22); }
    var st=cfg.stages, n=st.length, x0=W*0.05, colW=W*0.90/n, top=H*0.25;
    var maxItems=0; for(var q=0;q<n;q++) maxItems=Math.max(maxItems, st[q].items.length);
    var rowH=Math.min(38, (H*0.58)/Math.max(1,maxItems));
    for(var i=0;i<n;i++){ var s=st[i], cxi=x0+i*colW+colW*0.5;
      ctx.fillStyle=s.c; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.t, cxi, top);
      if(i<n-1){ var ax=x0+(i+1)*colW-colW*0.03; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(ax-12, top-5); ctx.lineTo(ax-2, top-5); ctx.lineTo(ax-7, top-9); ctx.moveTo(ax-2,top-5); ctx.lineTo(ax-7,top-1); ctx.stroke(); }
      for(var k=0;k<s.items.length;k++){ var y=top+20+k*rowH, bw=colW*0.86, bx=cxi-bw/2;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=s.c; ctx.lineWidth=1.5; rr(bx,y,bw,rowH-8,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.items[k], cxi, y+(rowH-8)/2+4); } }
    if(cfg.foot){ ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(cfg.foot, cx, H*0.95); } };
  // 5각 별 (에이스타)
  function star(ctx, cx, cy, R, ratio, fill, rot){ var r=R*ratio; ctx.beginPath();
    for(var i=0;i<10;i++){ var rad=(i%2===0)?R:r, a=(rot||0)+(-90+i*36)*Math.PI/180, x=cx+rad*Math.cos(a), y=cy+rad*Math.sin(a);
      if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); }
  function face(ctx, cx, cy, R, blink){ var ex=R*0.30, ey=-R*0.05, er=R*0.11;
    ctx.fillStyle='#16161f'; ctx.beginPath(); ctx.ellipse(cx-ex,cy+ey,er,blink?er*0.18:er,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+ex,cy+ey,er,blink?er*0.18:er,0,0,7); ctx.fill();
    ctx.strokeStyle='#16161f'; ctx.lineWidth=Math.max(2,R*0.05); ctx.beginPath(); ctx.arc(cx,cy+R*0.10,R*0.22,0.18*Math.PI,0.82*Math.PI); ctx.stroke(); }

  var scenes=[

  // ══════ 시네마틱 인트로 — 에이다 러브레이스 (끝나면 엔드카드) ══════
  { id:'algo0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/ada.jpg', name:'에이다 러브레이스',
      sub:'Ada Lovelace · 1815–1852<br>최초의 프로그래머',
      caps:[
        ['알고리즘의 세계로 초대합니다'],
        ['1843년, 에이다 러브레이스가 인류 최초의 알고리즘을 적습니다.','배비지의 ‘해석기관’을 위한 한 줄 한 줄의 절차였죠.'],
        ['그녀는 내다봤어요 — 기계가 숫자를 넘어','음악도, 무엇이든 ‘절차’로 다룰 수 있다고.'],
        ['알고리즘이란 ‘문제를 푸는 단계의 레시피’.','컴퓨터는 그 단계를 충실히 밟을 뿐이죠.'],
        ['정렬하고, 탐색하고, 길을 찾는 수많은 레시피 —','이 세계로, 함께 들어가 볼까요?']
      ] },
    enter:function(E){ this.s={ f0:E.frame, ended:false }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=480, FADE=18, local=fr-s.f0;
      if(local>=ANIM){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=local/ANIM, seam=(local<FADE? local/FADE : 1);
      if(ADA_OK){ var ar=ADA.width/ADA.height, dh=H*0.84, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.40+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(3px)';
        ctx.drawImage(ADA, ix, iy, dw, dh); ctx.restore(); }
      // 정렬 알고리즘 시각화: 막대가 단계를 밟아 정렬(선택정렬, 실제 계산)
      var base=[5,2,8,1,6,4,7,3], nB=base.length;
      var steps=Math.floor(ss(0.22,0.86,ph)*nB);
      var arr=base.slice(); for(var p=0;p<steps && p<nB;p++){ var mi=p; for(var j=p+1;j<nB;j++) if(arr[j]<arr[mi]) mi=j; var tmp=arr[p]; arr[p]=arr[mi]; arr[mi]=tmp; }
      var bw=Math.min(46,W*0.07), gap=bw*0.35, totW=nB*bw+(nB-1)*gap, bx0=W/2-totW/2, baseY=H*0.72, unit=H*0.045;
      ctx.globalAlpha=seam;
      for(var b=0;b<nB;b++){ var x=bx0+b*(bw+gap), hh=arr[b]*unit, sorted=(b<steps);
        ctx.fillStyle=sorted?'rgba(143,227,181,0.85)':'rgba(122,184,255,0.8)'; ctx.fillRect(x,baseY-hh,bw,hh);
        ctx.fillStyle='#cfe6ff'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(arr[b], x+bw/2, baseY-hh-6); }
      ctx.globalAlpha=1;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.globalAlpha=ss(0.2,0.4,ph)*seam;
      ctx.fillText('기계가 단계를 밟아 정렬합니다 — 선택정렬 ('+Math.min(steps,nB)+'/'+nB+' 단계)', W/2, H*0.80); ctx.globalAlpha=1;
      // 대화체 문구
      var caps=this.story.caps, slot=1/caps.length, ci=Math.floor(ph/slot), lp=(ph-ci*slot)/slot;
      var aa=(lp<0.2? lp/0.2 : lp>0.8? (1-lp)/0.2 : 1)*seam, lines=caps[ci]||caps[0];
      var mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(180,214,255,'+aa.toFixed(3)+')':'rgba(224,230,245,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  },

  // ══════ 시작 1 — 전체 윤곽(여정 지도) ══════
  { id:'algo0_02',
    enter:function(E){ this.s={step:0}; this.stops=['복잡도','자료구조','정렬','탐색','트리','그래프','DP','패러다임']; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%(this.stops.length+1); E.blip(460+this.s.step*40,0.1); },
    draw:function(E){ var ctx=E.ctx, n=this.stops.length, x0=E.W*0.11, x1=E.W*0.89, baseY=E.H*0.50, amp=E.H*0.12, s=this.s, self=this;
      function pos(i){ var f=(n>1)?i/(n-1):0; return [x0+(x1-x0)*f, baseY+Math.sin(f*Math.PI*2.2)*amp]; }
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=3; ctx.setLineDash([2,9]); ctx.lineCap='round'; ctx.beginPath();
      for(var i=0;i<n;i++){ var p=pos(i); if(i===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); ctx.setLineDash([]);
      for(i=0;i<n;i++){ var p=pos(i), done=i<s.step-1, here=(i===s.step-1);
        ctx.fillStyle=here?'rgba(255,178,122,0.3)':done?'rgba(143,227,181,0.2)':'rgba(122,184,255,0.14)';
        ctx.strokeStyle=here?ORA:done?GRN:BLU; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p[0],p[1],17,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=here?ORA:done?GRN:'#dfeefb'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(i+1,p[0],p[1]); ctx.textBaseline='alphabetic';
        ctx.fillStyle=here?ORA:DIM; ctx.font='12px sans-serif'; ctx.fillText(self.stops[i], p[0], p[1]+(p[1]<baseY?36:-26)); }
      var t=E.frame*0.05, sp=(s.step===0)?[x0-26,baseY]:pos(Math.min(s.step-1,n-1));
      star(ctx, sp[0], sp[1]-34+Math.sin(t)*4, 14, 0.42, ORA, Math.sin(t*0.3)*0.1);
      E.tapHint(E.W/2, E.H*0.82, s.step>n?'↻ 처음부터':(s.step===0?'▶ 출발! 정거장 따라가기':'▶ 다음 정거장'), true);
      E.big('우리가 함께 걸을 길 — 8개의 정거장', '복잡도에서 출발해 자료구조·정렬·탐색·트리·그래프·동적계획법을 지나 설계 패러다임까지. <b>각 정거장은 다음 정거장의 디딤돌</b>이라, 순서대로 밟으면 자연스럽게 이어집니다.'); }
  },

  // ══════ 시작 3 — 첫 걸음 스토리 ══════
  { id:'algo0_03',
    enter:function(E){ this.s={}; this.A=[3,7,2,8,5]; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, A=this.A, cx=E.W/2, y=E.H*0.48, bw=64, gap=16, total=A.length*bw+(A.length-1)*gap, x0=cx-total/2, t=E.frame*0.05;
      for(var i=0;i<A.length;i++){ var x=x0+i*(bw+gap), big=(A[i]===8);
        ctx.fillStyle=big?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.12)'; ctx.strokeStyle=big?ORA:BLU; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,10);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,bw,bw);ctx.strokeRect(x,y,bw,bw);}
        ctx.fillStyle=big?ORA:'#dfeefb'; ctx.font='600 26px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(A[i],x+bw/2,y+bw/2); ctx.textBaseline='alphabetic'; }
      var bx=x0+3*(bw+gap)+bw/2; star(ctx, bx, y-42+Math.sin(t)*3, 15, 0.42, ORA, Math.sin(t*0.3)*0.1);
      ctx.fillStyle=ORA; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('가장 큰 수는?', bx, y-66);
      E.big('첫 걸음 — 알고리즘이란 무엇일까?', '거창해 보이지만 알고리즘은 결국 "문제를 푸는 분명한 단계"입니다. 누구나 아는 문제부터 시작합니다 — 숫자 더미에서 <b>가장 큰 수 찾기</b>. 다음 화면에서 그 단계를 하나씩 뜯어봅니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
