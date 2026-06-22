/* 물리학 트랙 — 시작 시퀀스 (환영 · 전체 윤곽)
   동작(behavior)만. 텍스트는 content/phys0.json. 반드시 content_phys1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 색: 물리=초록 테마(#5fd6a8). */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  var scenes = [

  // ── 오프닝: 뉴턴의 평평한 무대 → 아인슈타인의 휘어진 시공간 → 빨려들어가기 ──
  { id:'phys0_00',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame;
      var CYCLE=1320, ph=(fr%CYCLE)/CYCLE;                         // 0..1 한 사이클(약 22초)
      var warp = ph<0.14?0 : ph<0.46? (ph-0.14)/0.32 : 1;          // 평평(뉴턴)→휘어짐(아인슈타인)
      var cx=W*0.5, cy=H*0.44, gw=Math.min(W*0.42,H*0.52);
      function dip(dx,dy){ var rr=(dx*dx+dy*dy)/(gw*gw*0.085); return warp*(gw*0.62)/(1+rr); }   // 중심으로 꺼지는 우물
      // 별 배경(결정적)
      for(var i=0;i<70;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.018+i));
        ctx.fillStyle='rgba(200,220,255,'+(tw*0.5).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.92, 1.7,1.7); }
      function P(u,v){ var bx=u*gw, by=v*gw*0.5, d=dip(bx,by), r=Math.hypot(bx,by)||1, pull=d*0.34; return [cx+bx-(bx/r)*pull, cy+by+d]; }
      var N=15;
      for(var iy=0;iy<=N;iy++){ var v=iy/N*2-1; ctx.strokeStyle='rgba(95,214,168,'+(0.10+0.16*(1-Math.abs(v))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath();
        for(var ix=0;ix<=N;ix++){ var p=P(ix/N*2-1,v); if(ix===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
      for(ix=0;ix<=N;ix++){ var u=ix/N*2-1; ctx.strokeStyle='rgba(122,184,255,'+(0.08+0.13*(1-Math.abs(u))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath();
        for(iy=0;iy<=N;iy++){ var p2=P(u,iy/N*2-1); if(iy===0)ctx.moveTo(p2[0],p2[1]); else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); }
      // 뉴턴 단계: 평평한 무대 위 떨어지는 사과
      if(ph<0.14){ var fall=(ph/0.14), ay=cy-gw*0.32+fall*gw*0.5; ctx.fillStyle='#e2503a'; ctx.beginPath(); ctx.arc(cx+gw*0.5,ay,7,0,7); ctx.fill();
        ctx.strokeStyle='rgba(226,80,58,0.3)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(cx+gw*0.5,cy-gw*0.32); ctx.lineTo(cx+gw*0.5,ay); ctx.stroke(); ctx.setLineDash([]); }
      // 중심 질량(휘어질수록 등장)
      if(warp>0.04){ var my=cy+dip(0,0), mr=10+warp*16;
        var grd=ctx.createRadialGradient(cx,my,2,cx,my,mr*2.4); grd.addColorStop(0,'rgba(255,244,210,'+warp.toFixed(3)+')'); grd.addColorStop(1,'rgba(255,178,90,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,my,mr*2.4,0,7); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,my,2+warp*5,0,7); ctx.fill(); }
      // 가속/빨려들어가기: 휘어진 후 입자가 우물로 나선 강하
      if(ph>=0.46){ var sp=(ph-0.46)/0.54; var ang=sp*sp*Math.PI*7, rad=gw*0.92*(1-sp*sp);
        ctx.strokeStyle='rgba(255,178,122,0.55)'; ctx.lineWidth=2; ctx.beginPath();
        for(var k=0;k<46;k++){ var s2=sp-k*0.011; if(s2<0)break; var a2=s2*s2*Math.PI*7, r2=gw*0.92*(1-s2*s2), q=P(Math.cos(a2)*r2/gw, Math.sin(a2)*r2/(gw)); if(k===0)ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]); } ctx.stroke();
        var pp=P(Math.cos(ang)*rad/gw, Math.sin(ang)*rad/gw); var glow=6+sp*6;
        ctx.fillStyle='rgba(95,214,168,0.3)'; ctx.beginPath(); ctx.arc(pp[0],pp[1],glow*1.8,0,7); ctx.fill();
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(pp[0],pp[1],glow,0,7); ctx.fill(); }
      // 단계별 내레이션
      var title, sub;
      if(ph<0.14){ title='뉴턴의 세계 — 멈춰 있는 무대'; sub='공간은 고정된 격자, 시간은 누구에게나 똑같이 흐른다고 믿었습니다. 사과는 그저 ‘떨어진다’.'; }
      else if(ph<0.46){ title='아인슈타인 — 시간과 공간은 하나였다'; sub='여러분, 시공간을 아시나요? 시간과 공간은 따로가 아니라 하나로 엮인 ‘시공간’입니다. 질량이 이 천을 휘게 합니다.'; }
      else if(ph<0.82){ title='가속도의 비밀 — 휘어진 시공간'; sub='중력은 끌어당기는 힘이 아닙니다. 휘어진 시공간을 따라 ‘똑바로’ 가다 빨려드는 것 — 그것이 가속도입니다.'; }
      else { title='이 놀라운 세계로, 함께 빨려들어 갑시다'; sub='뉴턴의 정적인 우주가 출렁이기 시작합니다. 지금부터 그 세계를 하나씩 탐험합니다 — 다음 ▸'; }
      E.big(title, sub); }
  },

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
