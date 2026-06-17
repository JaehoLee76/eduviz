/* 알고리즘 — 시작 시퀀스 (Greeting · 전체 윤곽 · 첫 걸음 스토리)
   마스코트 '에이스타(A*)'가 안내. 비-viz 풀스크린 인트로(코드/concept 아님 → 캐릭터+말풍선 노출).
   텍스트는 content/algo0.json. 반드시 content_algo1.js 보다 먼저 로드(시작이 맨 앞). */
(function(){
  var BLU='#7ab8ff', GRN='#8fe3b5', ORA='#ffb27a', DIM='#9b99a3';
  // 5각 별 (에이스타)
  function star(ctx, cx, cy, R, ratio, fill, rot){ var r=R*ratio; ctx.beginPath();
    for(var i=0;i<10;i++){ var rad=(i%2===0)?R:r, a=(rot||0)+(-90+i*36)*Math.PI/180, x=cx+rad*Math.cos(a), y=cy+rad*Math.sin(a);
      if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); }
  function face(ctx, cx, cy, R, blink){ var ex=R*0.30, ey=-R*0.05, er=R*0.11;
    ctx.fillStyle='#16161f'; ctx.beginPath(); ctx.ellipse(cx-ex,cy+ey,er,blink?er*0.18:er,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+ex,cy+ey,er,blink?er*0.18:er,0,0,7); ctx.fill();
    ctx.strokeStyle='#16161f'; ctx.lineWidth=Math.max(2,R*0.05); ctx.beginPath(); ctx.arc(cx,cy+R*0.10,R*0.22,0.18*Math.PI,0.82*Math.PI); ctx.stroke(); }

  var scenes=[

  // ══════ 시작 1 — 인사 ══════
  { id:'algo0_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.48, t=E.frame*0.04;
      for(var k=0;k<14;k++){ var a=t*0.3+k*0.45, rr=E.H*0.20+Math.sin(t+k)*10, x=cx+Math.cos(a)*rr*1.7, y=cy+Math.sin(a)*rr, sz=1.4+1.3*Math.abs(Math.sin(t*1.2+k));
        ctx.globalAlpha=0.35+0.45*Math.abs(Math.sin(t*1.3+k)); ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(x,y,sz,0,7); ctx.fill(); }
      ctx.globalAlpha=1;
      var R=Math.min(E.W,E.H)*0.12*(1+0.03*Math.sin(t*1.5)), rot=Math.sin(t*0.2)*0.08;
      ctx.globalAlpha=0.16; star(ctx,cx,cy,R*1.4,0.42,BLU,rot); ctx.globalAlpha=1;
      star(ctx,cx,cy,R,0.42,BLU,rot); face(ctx,cx,cy,R,(E.frame%210)<8);
      ctx.fillStyle='#bfe0ff'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('길잡이 · 에이스타 (A*)', cx, cy+R+34);
      E.big('알고리즘의 세계에 오신 걸 환영합니다', '저는 최적의 길을 찾는 알고리즘 A*에서 온 길잡이 <b>에이스타</b>입니다. 여러분이 길을 잃지 않도록, 한 걸음씩 함께 가겠습니다.'); }
  },

  // ══════ 시작 2 — 전체 윤곽(여정 지도) ══════
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
