/* 미적분학 트랙 — 시작 시퀀스 (시네마틱 오프닝 · 환영 · 16장 윤곽)
   동작(behavior)만. 텍스트는 content/calc0.json. 반드시 content_calc1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 색: 미적분=보라 테마(#b99cff).
   골든룰: 화면의 기울기·넓이는 모두 실시간 수치미분/리만합으로 계산(베껴 그리기 금지). */
(function(){
  var VIO='#b99cff', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3';
  // 미적분의 창시자 아이작 뉴턴(흑사병의 해 1665~66 '기적의 해'에 유율법 고안) — 인트로 배경
  var NEWTON=new Image(); var NEWTON_OK=false; NEWTON.onload=function(){ NEWTON_OK=true; }; NEWTON.src='assets/newton.jpg';

  var scenes = [

  // ── 시네마틱 오프닝: 변화(미분=접선) → 누적(적분=넓이) → 기본정리 → 현실. 끝나면 엔드카드(뉴턴+설명) ──
  { id:'calc0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/newton.jpg', name:'아이작 뉴턴',
      sub:'Isaac Newton · 1643–1727<br>미적분의 창시자 (라이프니츠와 함께)',
      caps:[
        ['미적분의 세계로 초대합니다'],
        ['1665년, 흑사병이 케임브리지를 닫았을 때 —','스물세 살 뉴턴은 고향 농가에 홀로 칩거합니다.'],
        ['그 ‘기적의 해’에 그가 빚어낸 것이 바로 이 변화의 수학.','(라이프니츠도 곧 독립적으로, ∫ 기호와 함께.)'],
        ['세상은 끊임없이 변합니다.','그 ‘변화’를 어떻게 한순간에 붙잡을 수 있을까요?'],
        ['곡선에 살짝 닿는 직선의 기울기 —','그 한순간의 변화율이 바로 ‘미분’입니다.'],
        ['휘어진 도형의 넓이는 또 어떻게 잴까요?','무수히 잘게 쪼개어, 다시 더합니다.'],
        ['그 무한한 합이 ‘적분’ —','조각들을 쌓아 전체를 되찾는 마법이죠.'],
        ['놀랍게도 미분과 적분은 하나로 이어집니다.','이 언어로 우린 로켓을 쏘고 미래를 그립니다 — 함께 가볼까요?']
      ] },
    enter:function(E){ this.s={ f0:E.frame, ended:false }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },   // 클릭 = 건너뛰기
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=1740, FADE=22, local=fr-s.f0;
      if(local>=ANIM){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }   // 애니메이션 끝 → 엔드카드(초상화+설명+다시보기)
      var ph=local/ANIM, seam=(local<FADE? local/FADE : 1);
      // 뉴턴 초상화 — 애니메이션 중엔 은은한 배경(흐릿)
      if(NEWTON_OK){ var ar=NEWTON.width/NEWTON.height, dh=H*0.84, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.22+0.02*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(3px)';
        ctx.drawImage(NEWTON, ix, iy, dw, dh); ctx.restore(); }
      // 실제 곡선 f와 좌표계
      function f(x){ return 0.55 + 1.45*Math.exp(-(x-2.15)*(x-2.15)/1.65); }   // 부드러운 언덕
      function df(x){ return (f(x+1e-3)-f(x-1e-3))/2e-3; }                      // 수치 도함수(실측)
      var X0=0.2, X1=4.2, FMAX=2.2;
      var ox=W*0.12, pw=W*0.76, oy=H*0.80, pv=H*0.50;
      function SX(x){ return ox + (x-X0)/(X1-X0)*pw; }
      function SY(y){ return oy - y/FMAX*pv; }
      // 별/먼지 배경
      for(var i=0;i<54;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.016+i));
        ctx.fillStyle='rgba(200,190,255,'+(tw*0.4*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.9, 1.6,1.6); }
      // 좌표축(은은)
      ctx.globalAlpha=seam; ctx.strokeStyle='rgba(185,156,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      // 곡선(slot0에서 좌→우로 그려짐, 이후 완성 유지)
      var reveal = ph<1/6 ? ss(0,1,ph*6) : 1;
      var xEnd = X0 + reveal*(X1-X0);
      ctx.strokeStyle='rgba(185,156,255,'+(0.95*seam)+')'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=X0;x<=xEnd+1e-9;x+=0.02){ var px=SX(x),py=SY(f(x)); if(x===X0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();

      // ── 미분 구간 [1/6, 3/6): 접선이 곡선을 미끄러지며 순간 기울기 ──
      if(ph>=1/6 && ph<3/6){ var dp=(ph-1/6)/(2/6);             // 0..1
        var xp=0.9+dp*2.5, yp=f(xp), m=df(xp);                  // 접점·실측 기울기
        // 도입부: 할선(secant)이 접선으로 수렴(dp<0.45)
        if(dp<0.45){ var h=1.6*(1-ss(0,1,dp/0.45)); if(h>0.04){ var xs=xp+h, ms=(f(xs)-yp)/h;
          ctx.strokeStyle='rgba(126,224,176,'+(0.7*seam)+')'; ctx.lineWidth=1.6; ctx.beginPath();
          ctx.moveTo(SX(X0), SY(yp+ms*(X0-xp))); ctx.lineTo(SX(X1), SY(yp+ms*(X1-xp))); ctx.stroke();
          ctx.fillStyle='rgba(126,224,176,'+(0.9*seam)+')'; ctx.beginPath(); ctx.arc(SX(xs),SY(f(xs)),5,0,7); ctx.fill(); } }
        // 접선
        ctx.strokeStyle='rgba(255,210,122,'+(0.95*seam)+')'; ctx.lineWidth=2.2; ctx.beginPath();
        ctx.moveTo(SX(X0), SY(yp+m*(X0-xp))); ctx.lineTo(SX(X1), SY(yp+m*(X1-xp))); ctx.stroke();
        // 접점
        ctx.fillStyle='rgba(255,210,122,'+seam+')'; ctx.beginPath(); ctx.arc(SX(xp),SY(yp),6.5,0,7); ctx.fill();
        ctx.fillStyle='rgba(255,210,122,0.25)'; ctx.beginPath(); ctx.arc(SX(xp),SY(yp),12,0,7); ctx.fill();
        // 기울기 실측값
        ctx.globalAlpha=seam; ctx.fillStyle='#ffd27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText("기울기 dy/dx = "+m.toFixed(2), SX(xp)+16, SY(yp)-14); ctx.globalAlpha=seam;
      }

      // ── 적분 구간 [3/6, 5/6): 리만 직사각형이 잘게 쪼개지며 넓이 누적 ──
      if(ph>=3/6 && ph<5/6){ var ip=(ph-3/6)/(2/6);
        var n=Math.round(5 + ss(0,1,ip)*55);                    // 5→60칸
        var a=0.6, b=3.7, dxw=(b-a)/n, area=0;
        for(var k=0;k<n;k++){ var xm=a+(k+0.5)*dxw, fm=f(xm); area+=fm*dxw;   // 중점합(실측)
          var rx=SX(a+k*dxw), rw=SX(a+(k+1)*dxw)-rx, ry=SY(fm), rh=oy-ry;
          ctx.fillStyle='rgba(185,156,255,'+(0.16*seam)+')'; ctx.fillRect(rx,ry,rw,rh);
          ctx.strokeStyle='rgba(185,156,255,'+(0.5*seam)+')'; ctx.lineWidth=0.7; ctx.strokeRect(rx,ry,rw,rh); }
        // 넓이 실측값
        ctx.globalAlpha=seam; ctx.fillStyle='#b99cff'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText("넓이 ∫f dx ≈ "+area.toFixed(3)+"   ("+n+"칸)", SX((a+b)/2), oy+24);
      }

      // ── 기본정리 구간 [5/6,1): 접선 + 채워진 넓이가 함께 (둘은 하나) ──
      if(ph>=5/6){ var a2=0.6,b2=3.7;
        ctx.fillStyle='rgba(185,156,255,'+(0.18*seam)+')'; ctx.beginPath(); ctx.moveTo(SX(a2),oy);
        for(var x2=a2;x2<=b2+1e-9;x2+=0.02) ctx.lineTo(SX(x2),SY(f(x2))); ctx.lineTo(SX(b2),oy); ctx.closePath(); ctx.fill();
        var xt=2.6, mt=df(xt);
        ctx.strokeStyle='rgba(255,210,122,'+(0.9*seam)+')'; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(SX(X0),SY(f(xt)+mt*(X0-xt))); ctx.lineTo(SX(X1),SY(f(xt)+mt*(X1-xt))); ctx.stroke();
        ctx.fillStyle='rgba(255,210,122,'+seam+')'; ctx.beginPath(); ctx.arc(SX(xt),SY(f(xt)),6,0,7); ctx.fill();
      }
      ctx.globalAlpha=1; ctx.lineWidth=1;

      // ── 상단 중앙 대화체 문구 (슬롯별 페이드 인/홀드/아웃) ──
      var caps=this.story.caps;
      var slot=1/caps.length, ci=Math.floor(ph/slot), lp=(ph-ci*slot)/slot;
      var aa=(lp<0.2? lp/0.2 : lp>0.8? (1-lp)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(206,184,255,'+aa.toFixed(3)+')':'rgba(224,224,245,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; ctx.textBaseline='alphabetic'; }
  },

  // ── 환영: 접선이 미끄러지며 도함수 곡선이 그려진다(변화율의 그림) ──
  { id:'calc0_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, t=(E.frame%660)/660;   // 0..1 주기(약 11초 — 느리게)
      function f(x){ return 0.6 + 1.4*Math.exp(-(x-2.1)*(x-2.1)/1.6); }
      function df(x){ return (f(x+1e-3)-f(x-1e-3))/2e-3; }
      var X0=0.2,X1=4.0,FMAX=2.2,DMAX=1.4;
      var ox=W*0.13, pw=W*0.74, oy=H*0.74, pv=H*0.34;
      function SX(x){ return ox+(x-X0)/(X1-X0)*pw; }
      function SY(y){ return oy - y/FMAX*pv; }
      function SYd(y){ return oy - (y+DMAX)/(2*DMAX)*pv*0.9; }   // 도함수는 0선 기준
      // 원함수
      ctx.strokeStyle='rgba(185,156,255,0.95)'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=X0;x<=X1;x+=0.02){ var p=SY(f(x)); if(x===X0)ctx.moveTo(SX(x),p); else ctx.lineTo(SX(x),p); } ctx.stroke();
      // 접점 위치(왕복)
      var s=t<0.5? t*2 : (1-t)*2, xp=X0+0.15+s*(X1-X0-0.3), yp=f(xp), m=df(xp);
      // 도함수 자취(접점까지 기울기를 점으로 — 실측을 '그림'으로)
      ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.lineWidth=1.6; ctx.setLineDash([2,3]); ctx.beginPath();
      ctx.moveTo(SX(X0),SYd(0)); ctx.lineTo(SX(X1),SYd(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      for(var x2=X0;x2<=xp+1e-9;x2+=0.02){ var pd=SYd(df(x2)); if(x2===X0)ctx.moveTo(SX(x2),pd); else ctx.lineTo(SX(x2),pd); } ctx.stroke();
      // 접선
      ctx.strokeStyle='rgba(255,210,122,0.95)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(SX(xp-1),SY(yp-m)); ctx.lineTo(SX(xp+1),SY(yp+m)); ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(SX(xp),SY(yp),6,0,7); ctx.fill();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(SX(xp),SYd(m),5,0,7); ctx.fill();
      ctx.fillStyle='#9b8bd0'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText("f(x)", SX(X1)-2, SY(f(X1))-8); ctx.fillStyle='#caa86a'; ctx.fillText("f '(x) = 기울기", SX(X0)+6, SYd(DMAX)-6);
      E.big('미적분 — 변화와 누적의 언어', '곡선 위 한 점의 기울기를 따라가면, 새로운 곡선(도함수)이 태어납니다. 다음 ▸ 로 여정을 시작하세요'); }
  },

  // ── 전체 윤곽: 미적분 16장 여정 지도 ──
  { id:'calc0_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#e7e1ff'; ctx.font='600 19px sans-serif'; ctx.fillText('미적분의 여정 — 다섯 묶음, 열다섯 정거장', cx, H*0.12);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.fillText('함수에서 출발해 미분·적분을 거쳐 급수·다변수·벡터장까지 — 앞장이 곧 뒷장의 열쇠입니다.', cx, H*0.12+22);
      var groups=[
        {c:VIO, t:'기초',     items:['함수와 모델','극한과 연속']},
        {c:GLD, t:'미분',     items:['도함수','미분법','미분의 응용']},
        {c:'#9fd0ff', t:'적분', items:['적분','적분의 응용','적분기법']},
        {c:GRN, t:'변화·급수', items:['미분방정식','매개변수·극좌표','수열과 급수']},
        {c:'#c9b6ff', t:'다변수·벡터', items:['공간벡터','다변수 미분','다중적분','벡터미적분']}
      ];
      var n=groups.length, x0=W*0.05, colW=W*0.90/n, top=H*0.26;
      var maxI=0; for(var q=0;q<n;q++) maxI=Math.max(maxI,groups[q].items.length);
      var rowH=Math.min(40,(H*0.56)/Math.max(1,maxI));
      for(var i=0;i<n;i++){ var s=groups[i], cxi=x0+i*colW+colW*0.5;
        ctx.fillStyle=s.c; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.t, cxi, top-14);
        for(var k=0;k<s.items.length;k++){ var y=top+k*(rowH+8), bw=colW*0.82, bx=cxi-bw/2;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw,rowH,8);}else{ctx.beginPath();ctx.rect(bx,y,bw,rowH);}
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); ctx.strokeStyle=s.c; ctx.lineWidth=1; ctx.globalAlpha=0.55; ctx.stroke(); ctx.globalAlpha=1;
          ctx.fillStyle='#e1ddf0'; ctx.font='12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.items[k], cxi, y+(rowH-8)/2+4); }
        if(i<n-1){ ctx.fillStyle='rgba(185,156,255,0.4)'; ctx.font='18px sans-serif'; ctx.fillText('▸', x0+(i+1)*colW, top+rowH*0.6); } }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('1장 함수와 모델부터 시작합니다 — 다음 ▸', cx, H*0.94); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
