/* 물리학 트랙 — 시작 시퀀스 (환영 · 전체 윤곽)
   동작(behavior)만. 텍스트는 content/phys0.json. 반드시 content_phys1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 색: 물리=초록 테마(#5fd6a8). */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  var scenes = [

  // ── 환영: 포물선을 그리는 공 (물리는 운동을 예측한다) ──
  { id:'phys0_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, t=(E.frame%180)/180;   // 0..1 주기
      var g=9.8, v0=14, ang=58*Math.PI/180, T=2*v0*Math.sin(ang)/g;       // 비행시간
      var tt=t*T, x=v0*Math.cos(ang)*tt, y=v0*Math.sin(ang)*tt-0.5*g*tt*tt;  // 실제 포물선 운동
      var scale=Math.min(W*0.5/ (v0*v0*Math.sin(2*ang)/g), H*0.32/ (v0*v0*Math.sin(ang)*Math.sin(ang)/(2*g)) );
      var ox=W*0.24, oy=H*0.66;
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ox-20,oy); ctx.lineTo(W*0.82,oy); ctx.stroke();
      // 자취(점선)
      ctx.strokeStyle='rgba(95,214,168,0.4)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath();
      for(var k=0;k<=40;k++){ var tk=k/40*T, xk=v0*Math.cos(ang)*tk, yk=v0*Math.sin(ang)*tk-0.5*g*tk*tk; var px=ox+xk*scale, py=oy-yk*scale; if(k===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke(); ctx.setLineDash([]);
      // 공
      var bx=ox+x*scale, by=oy-y*scale;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(bx,by,9,0,7); ctx.fill();
      ctx.fillStyle='rgba(95,214,168,0.25)'; ctx.beginPath(); ctx.arc(bx,by,15,0,7); ctx.fill();
      E.big('물리학 — 자연을 수식으로 예측하다', '돌은 떨어질 자리를 모르지만, 식 하나는 이미 알고 있습니다. 다음 ▸ 로 여정을 시작하세요'); }
  },

  // ── 전체 윤곽: 14장 여정 지도 ──
  { id:'phys0_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      function rr(x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#dfeefb'; ctx.font='600 19px sans-serif'; ctx.fillText('물리의 여정 — 다섯 묶음, 열네 정거장', cx, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.fillText('역학에서 출발해 파동·열·전자기를 지나 현대 물리까지 — 앞장이 곧 뒷장의 열쇠입니다.', cx, H*0.12+22);
      var groups=[
        {c:GRN, t:'역학',     items:['운동학','뉴턴 법칙','일·에너지','운동량','회전','중력','진동']},
        {c:'#9fd0ff', t:'파동·유체', items:['파동','유체']},
        {c:ORA, t:'열',       items:['열역학']},
        {c:PNK, t:'전자기',   items:['전기장','회로','자기·유도']},
        {c:'#c9b6ff', t:'현대', items:['빛·현대물리']}
      ];
      var n=groups.length, x0=W*0.05, colW=W*0.90/n, top=H*0.26;
      var maxI=0; for(var q=0;q<n;q++) maxI=Math.max(maxI,groups[q].items.length);
      var rowH=Math.min(40,(H*0.56)/Math.max(1,maxI));
      for(var i=0;i<n;i++){ var s=groups[i], cxi=x0+i*colW+colW*0.5;
        ctx.fillStyle=s.c; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.t, cxi, top);
        if(i<n-1){ var ax=x0+(i+1)*colW-colW*0.03; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(ax-12,top-5); ctx.lineTo(ax-2,top-5); ctx.lineTo(ax-7,top-9); ctx.moveTo(ax-2,top-5); ctx.lineTo(ax-7,top-1); ctx.stroke(); }
        for(var k=0;k<s.items.length;k++){ var y=top+20+k*rowH, bw=colW*0.86, bx=cxi-bw/2;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=s.c; ctx.lineWidth=1.5; rr(bx,y,bw,rowH-8,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#dfeefb'; ctx.font='12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.items[k], cxi, y+(rowH-8)/2+4); } }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('1장 운동학부터 시작합니다 — 다음 ▸', cx, H*0.94); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
