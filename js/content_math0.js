/* 수학 트랙 — 시작 시퀀스(시네마틱 인트로). 반드시 content_ch1.js 보다 먼저 로드.
   엔진(js/engine.js) 공유. 끝나면 엔드카드(가우스 초상+설명+다시보기). 색: 수학=주황. */
(function(){
  var ORA='#ffb27a', BLU='#7ab8ff', GRN='#8fe3b5', DIM='#9b99a3';
  var GAUSS=new Image(); var G_OK=false; GAUSS.onload=function(){ G_OK=true; }; GAUSS.src='assets/gauss.jpg';

  var scenes = [
  { id:'math0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/gauss.jpg', name:'카를 프리드리히 가우스',
      sub:'Carl Friedrich Gauss · 1777–1855<br>수학의 왕자',
      caps:[
        ['수학의 세계로 초대합니다'],
        ['열 살의 가우스 — 선생님이 1부터 100까지 더하라 하자,','소년은 몇 초 만에 답했습니다. 5050.'],
        ['비결? 양 끝을 짝지으면 1+100, 2+99 … 모두 101.','101이 50쌍, 곧 101×50 = 5050.'],
        ['수는 외우는 게 아니라 ‘패턴을 보는’ 것 — 그것이 수학의 눈입니다.'],
        ['수에서 도형으로, 도형에서 무한으로.','이 세계로, 함께 들어가 볼까요?']
      ] },
    enter:function(E){ this.s={ f0:E.frame, ended:false }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      var ANIM=1560, FADE=22, local=fr-s.f0;
      if(local>=ANIM){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=local/ANIM, seam=(local<FADE? local/FADE : 1);
      if(G_OK){ var ar=GAUSS.width/GAUSS.height, dh=H*0.84, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.20+0.02*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(3px)';
        ctx.drawImage(GAUSS, ix, iy, dw, dh); ctx.restore(); }
      // 가우스 합 시각화: 1..n 노드 + 양끝 짝짓기 호(각 쌍의 합 = n+1)
      var n=10, x0=W*0.16, x1=W*0.84, yb=H*0.66;
      function NX(i){ return x0+(x1-x0)*(i-1)/(n-1); }
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var i=1;i<=n;i++){ ctx.globalAlpha=seam; ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.beginPath(); ctx.arc(NX(i),yb,13,0,7); ctx.fill();
        ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(NX(i),yb,13,0,7); ctx.stroke();
        ctx.fillStyle='#ffe0c6'; ctx.font='600 13px sans-serif'; ctx.fillText(i, NX(i), yb); }
      ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
      // 짝짓기 호가 ph에 따라 차례로 그려짐(1-10, 2-9, …)
      var pairs=Math.floor(ss(0.25,0.85,ph)*(n/2)+1e-6);
      for(var k=0;k<pairs && k<n/2;k++){ var L=NX(k+1), R=NX(n-k), mx=(L+R)/2, h=40+k*14;
        ctx.strokeStyle='rgba(143,227,181,'+(0.85*seam)+')'; ctx.lineWidth=1.8; ctx.beginPath();
        ctx.moveTo(L,yb-13); ctx.quadraticCurveTo(mx,yb-13-h, R,yb-13); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('11', mx, yb-13-h-4); }
      // 실제 합 1..100 (골든룰: 코드로 계산)
      var total=0; for(var t=1;t<=100;t++) total+=t;
      ctx.fillStyle=ORA; ctx.font='600 '+Math.max(17,Math.min(26,W*0.03))+'px sans-serif'; ctx.textAlign='center';
      ctx.globalAlpha=ss(0.2,0.4,ph)*seam; ctx.fillText('1 + 2 + 3 + … + 100 = '+total, W/2, H*0.82); ctx.globalAlpha=1;
      // 대화체 문구
      var caps=this.story.caps, slot=1/caps.length, ci=Math.floor(ph/slot), lp=(ph-ci*slot)/slot;
      var aa=(lp<0.2? lp/0.2 : lp>0.8? (1-lp)/0.2 : 1)*seam, lines=caps[ci]||caps[0];
      var mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(255,210,160,'+aa.toFixed(3)+')':'rgba(232,228,220,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  }
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
