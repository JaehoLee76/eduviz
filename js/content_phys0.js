/* 물리학 트랙 — 시작 시퀀스 (환영 · 전체 윤곽)
   동작(behavior)만. 텍스트는 content/phys0.json. 반드시 content_phys1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 색: 물리=초록 테마(#5fd6a8). */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  // 상대성이론의 아버지 알베르트 아인슈타인 — 인트로 배경
  var EIN=new Image(); var EIN_OK=false; EIN.onload=function(){ EIN_OK=true; }; EIN.src='assets/einstein.jpg';

  var scenes = [

  // ── 시네마틱 오프닝: 뉴턴의 평평한 무대 → (빨간 사과→흰 질량) → 휘어진 시공간 → 빨려들기 ──
  { id:'phys0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/einstein.jpg', name:'알베르트 아인슈타인',
      sub:'Albert Einstein · 1879–1955<br>상대성이론 · 휘어진 시공간',
      caps:[
        ['물리의 세계로 초대합니다'],
        ['뉴턴은 믿었어요.','공간은 멈춰 있는 무대, 시간은 누구에게나 똑같이 흐른다고요.'],
        ['그런데 아인슈타인이 속삭입니다.','시간과 공간은 따로가 아니라고 — 둘은 하나, ‘시공간’이죠.'],
        ['보세요, 질량이 이 시공간을 움푹 휘게 합니다.'],
        ['그러면 모든 것이 그 휜 길을 따라 빨려듭니다.','바로 그게 중력이고, 가속도예요.'],
        ['자, 이 놀라운 세계로 — 함께 들어가 볼까요?']
      ] },
    enter:function(E){ this.s={ f0:E.frame, ended:false }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },   // 클릭 = 건너뛰기
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, st=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }   // smoothstep
      var ANIM=1148, FADE=18, HOLD=180, local=fr-st.f0;
      if(local>=ANIM+HOLD){ if(!st.ended){ st.ended=true; E.introEnd(this.story); } return; }   // 애니메이션 끝 → 엔드카드(아인슈타인+설명)
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      var warp = ss(0.33,0.52,ph);                                      // 평평(뉴턴)→휘어짐(아인슈타인)
      var cx=W*0.5, cy=H*0.46, gw=Math.min(W*0.40,H*0.50);
      // 아인슈타인 초상화 — 애니메이션 중엔 은은한 배경(흐릿)
      if(EIN_OK){ var ar=EIN.width/EIN.height, dh2=H*0.84, dw2=dh2*ar, ix2=W*0.5-dw2/2, iy2=H*0.50-dh2/2;
        ctx.save(); ctx.globalAlpha=(0.34+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(3px)';
        ctx.drawImage(EIN, ix2, iy2, dw2, dh2); ctx.restore(); }
      function dip(dx,dy){ var rr=(dx*dx+dy*dy)/(gw*gw*0.085); return warp*(gw*0.62)/(1+rr); }
      function P(u,v){ var bx=u*gw, by=v*gw*0.5, d=dip(bx,by), r=Math.hypot(bx,by)||1, pull=d*0.34; return [cx+bx-(bx/r)*pull, cy+by+d]; }
      // 별 배경
      for(var i=0;i<70;i++){ var hx=((Math.sin(i*12.9898)*43758.5453)%1+1)%1, hy=((Math.sin(i*78.233)*43758.5453)%1+1)%1, tw=0.25+0.55*Math.abs(Math.sin(fr*0.018+i));
        ctx.fillStyle='rgba(200,220,255,'+(tw*0.5*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.92, 1.7,1.7); }
      // 시공간 격자
      var N=15;
      for(var iy=0;iy<=N;iy++){ var v=iy/N*2-1; ctx.strokeStyle='rgba(95,214,168,'+((0.10+0.16*(1-Math.abs(v)))*seam).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath();
        for(var ix=0;ix<=N;ix++){ var p=P(ix/N*2-1,v); if(ix===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
      for(ix=0;ix<=N;ix++){ var u=ix/N*2-1; ctx.strokeStyle='rgba(122,184,255,'+((0.08+0.13*(1-Math.abs(u)))*seam).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath();
        for(iy=0;iy<=N;iy++){ var p2=P(u,iy/N*2-1); if(iy===0)ctx.moveTo(p2[0],p2[1]); else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); }
      // 사과(빨강) → 질량(흰색): 하나의 원이 떨어져 내려와 흰 질량으로 변신
      var fall=ss(0.17,0.32,ph), cf=ss(0.36,0.50,ph);                   // fall=낙하, cf=빨강→흰색
      var topY=cy-gw*0.55, oy = fall<1 ? topY+(cy-topY)*fall : cy+dip(0,0);
      var rr2=Math.round(226+(255-226)*cf), gg=Math.round(80+(255-80)*cf), bb=Math.round(58+(255-58)*cf);
      var orad=7+cf*5+warp*5;
      // 낙하 자취(옅은 빨강)
      if(fall>0 && fall<1){ ctx.strokeStyle='rgba(226,80,58,'+(0.30*seam)+')'; ctx.lineWidth=1.5; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(cx,topY); ctx.lineTo(cx,oy); ctx.stroke(); ctx.setLineDash([]); }
      // 흰 질량 후광
      if(cf>0.02){ var gl=ctx.createRadialGradient(cx,oy,2,cx,oy,orad*3.2); gl.addColorStop(0,'rgba(255,250,235,'+(cf*0.9*seam).toFixed(3)+')'); gl.addColorStop(1,'rgba(255,200,120,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,oy,orad*3.2,0,7); ctx.fill(); }
      ctx.globalAlpha=seam; ctx.fillStyle='rgb('+rr2+','+gg+','+bb+')'; ctx.beginPath(); ctx.arc(cx,oy,orad,0,7); ctx.fill(); ctx.globalAlpha=1;
      // 빨려들기: 입자가 우물로 나선 강하
      if(warp>0.55){ var sp=ss(0.67,0.97,ph), ang=sp*sp*Math.PI*7, rad=gw*0.9*(1-sp*sp);
        ctx.strokeStyle='rgba(255,178,122,'+(0.55*seam)+')'; ctx.lineWidth=2; ctx.beginPath();
        for(var k=0;k<46;k++){ var s2=sp-k*0.011; if(s2<0)break; var a2=s2*s2*Math.PI*7, r2=gw*0.9*(1-s2*s2), q=P(Math.cos(a2)*r2/gw, Math.sin(a2)*r2/gw); if(k===0)ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]); } ctx.stroke();
        var pp=P(Math.cos(ang)*rad/gw, Math.sin(ang)*rad/gw), glow=6+sp*6;
        ctx.globalAlpha=seam; ctx.fillStyle='rgba(95,214,168,0.3)'; ctx.beginPath(); ctx.arc(pp[0],pp[1],glow*1.8,0,7); ctx.fill();
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(pp[0],pp[1],glow,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // ── 상단 중앙 대화체 문구 (슬롯별 페이드 인/홀드/아웃) ──
      var caps=this.story.caps;
      var slot=1/caps.length, ci=Math.floor(ph/slot), lp=(ph-ci*slot)/slot;
      var a=(lp<0.2? lp/0.2 : lp>0.8? (1-lp)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(34,W*0.040)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(255,216,160,'+a.toFixed(3)+')':'rgba(214,228,245,'+(a*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], cx, H*0.135 + li*(mainF+9)); }
      ctx.shadowBlur=0;
    }
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
