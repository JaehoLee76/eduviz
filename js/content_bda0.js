/* 빅데이터 분석 트랙 — 시작 시퀀스 (시네마틱: 더그 레이니 + 2001 리서치 노트 + 3V의 탄생 → 예측 곡선 수렴)
   동작(behavior)만. 텍스트=content/bda0.json. 반드시 content_bda1.js 보다 먼저 로드. 엔진 js/engine.js 공유.
   색: BDA=로즈 마젠타 테마(#ff7ab8). 골든룰: 화면의 건수 카운터는 실제로 그려진 점의 개수. 난수·Date.now 금지(결정적 해시). */
(function(){
  var MG='#ff7ab8', MGD='#d15591', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', TXT='#dfeefb';
  // 3V를 처음 정식화한 더그 레이니 — 자체 제작 초상(인트로 배경)
  var LANEY=new Image(); var LANEY_OK=false; LANEY.onload=function(){ LANEY_OK=true; }; LANEY.src='assets/laney.svg';

  var scenes = [

  // ── 시네마틱: 데이터가 쏟아지고(양) 흐르고(속도) 흩어졌다가(다양성) 예측 곡선으로 수렴 → 엔드카드(더그 레이니) ──
  { id:'bda0_00', cinematic:true, introCard:true,
    story:{ portrait:'assets/laney.svg', name:'더그 레이니',
      sub:'Doug Laney · 데이터 전략가<br>3V(Volume·Velocity·Variety)로 빅데이터의 개념을 최초로 정식화 (2001)',
      caps:[
        ['빅데이터 분석의 세계에 오신 것을 환영합니다'],
        ['2001년, 닷컴 붐 — 온라인 상거래의 데이터가','매일 폭발적으로 쏟아지던 시절이었습니다.'],
        ['한 분석가가 짧은 리서치 노트를 씁니다. 그런데 그 글에','‘Big Data’라는 말은 한 번도 등장하지 않습니다.'],
        ['대신 그는 데이터의 도전을 세 축으로 정리했습니다.','첫째 — 얼마나 많은가 (Volume).'],
        ['둘째 — 얼마나 빨리 밀려오는가 (Velocity).'],
        ['셋째 — 얼마나 제각각인가 (Variety).'],
        ['이름보다 개념이 먼저 태어난 것이죠. 10년 뒤 세상이','‘빅데이터’를 정의할 때 꺼내 든 것이 바로 이 세 축이었습니다.'],
        ['양을 다루고, 속도를 견디고, 다양성을 정돈해 —','마지막엔 예측으로. 그 여정을 지금 시작합니다.']
      ] },
    enter:function(E){ this.s={ ended:false, acc:0, last:0 }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      function hsh(n){ var v=Math.sin(n)*43758.5453; return v-Math.floor(v); }
      var ANIM=1215, FADE=18, HOLD=170;
      var _n=(typeof performance!=="undefined"&&performance.now)?performance.now():0, _dt=s.last?(_n-s.last):16.7; if(_dt<0||_dt>200)_dt=16.7; s.last=_n; s.acc+=_dt*0.036; var local=s.acc;
      if(local>=ANIM+HOLD){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      // 레이니 초상(은은한 배경)
      if(LANEY_OK){ var ar=(LANEY.width/LANEY.height)||0.83, dh=H*0.78, dw=dh*ar, ix=W*0.5-dw/2, iy=H*0.50-dh/2;
        ctx.save(); ctx.globalAlpha=(0.32+0.03*Math.sin(fr*0.012))*seam; if('filter' in ctx) ctx.filter='blur(2px)';
        ctx.drawImage(LANEY, ix, iy, dw, dh); ctx.restore(); }
      // 별/먼지 배경(로즈)
      for(var i=0;i<48;i++){ var hx=hsh(i*12.9898+1), hy=hsh(i*78.233+2), tw=0.25+0.55*Math.abs(Math.sin(fr*0.016+i));
        ctx.fillStyle='rgba(255,122,184,'+(tw*0.26*seam).toFixed(3)+')'; ctx.fillRect(hx*W, hy*H*0.9, 1.6,1.6); }
      // 데이터 비 — 2001년, 쏟아지는 상거래 데이터(초반부, 3V 등장 전 페이드아웃)
      var rainA=(1-ss(0.32,0.42,ph))*ss(0.02,0.08,ph)*seam;
      if(rainA>0.01){ for(i=0;i<40;i++){ var rx=hsh(i*3.1+7)*W, sp0=0.0016+0.0028*hsh(i*1.7+3), ry=((hsh(i*5.3+11)+fr*sp0)%1)*H;
        ctx.fillStyle='rgba(255,122,184,'+(rainA*(0.18+0.34*hsh(i+0.5))).toFixed(3)+')'; ctx.fillRect(rx, ry, 2, 7); } }
      // 리서치 노트 카드 — 'Big Data'라는 말이 없는 그 노트
      var na=ss(0.14,0.20,ph)*(1-ss(0.33,0.375,ph))*seam;
      if(na>0.01){ var cw0=Math.min(250,W*0.26), chh=cw0*1.12, cx0=W*0.5-cw0/2, cy0=H*0.47-chh/2;
        ctx.save(); ctx.globalAlpha=na;
        ctx.fillStyle='rgba(255,255,255,0.055)'; ctx.strokeStyle='rgba(255,122,184,0.55)'; ctx.lineWidth=1.2;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(cx0,cy0,cw0,chh,10); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(cx0,cy0,cw0,chh); ctx.strokeRect(cx0,cy0,cw0,chh); }
        ctx.fillStyle=MG; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('2001 · Research Note', cx0+14, cy0+22);
        for(var L=0;L<6;L++){ var lw=cw0*(0.52+0.32*hsh(L*2.7+1));
          ctx.fillStyle='rgba(223,238,251,0.28)'; ctx.fillRect(cx0+14, cy0+38+L*16, lw, 5); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('‘Big Data’라는 단어: 0번', W*0.5, cy0+chh+22);
        ctx.restore(); }
      // ── 3V 세 구역 + 수렴 ──
      var yTop=H*0.42, yBase=H*0.70, labelY=H*0.755;
      var vA=ss(0.36,0.45,ph), vB=ss(0.50,0.58,ph), vC=ss(0.625,0.70,ph), cv=ss(0.77,0.90,ph);
      function curveY(t){ return H*0.62 - H*0.20*t + H*0.03*Math.sin(t*6.0); }
      var pts=[], cnt=0;
      // Volume — 점이 차곡차곡 쌓이는 더미(카운터=실제 그려진 점 개수, 골든룰)
      if(vA>0){ var cxA=W*0.19, wA=W*0.20, dR=Math.max(3,H*0.0085), rowH=Math.max(10,H*0.036);
        for(var j=0;j<42;j++){ var colA=j%6, rowA=(j-colA)/6;
          var ap=vA*48-(j+hsh(j*4.4+2)*4); if(ap<=0) continue; ap=ap>1?1:ap; cnt++;
          pts.push({ x:cxA-wA/2+(colA+0.5)*wA/6, y:yBase-6-rowA*rowH-(1-ap)*18, col:MG, sh:0, r:dR, a:0.5+0.5*ap }); } }
      // Velocity — 왼→오로 흐르는 스트림(꼬리선이 속도감)
      if(vB>0){ var xLb=W*0.5-W*0.11, wB=W*0.22;
        for(i=0;i<14;i++){ var spd=0.0035+0.0045*hsh(i*9.9+4);
          var px2=xLb+((hsh(i*2.3+6)+fr*spd)%1)*wB, py2=yTop+8+hsh(i*5.7+8)*(yBase-yTop-20);
          var al=vB*(0.45+0.5*hsh(i+0.3));
          if(cv<0.9){ var tl=(spd/0.008)*26;
            ctx.strokeStyle='rgba(255,210,122,'+(al*0.45*(1-cv)*seam).toFixed(3)+')'; ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.moveTo(px2-tl,py2); ctx.lineTo(px2,py2); ctx.stroke(); }
          pts.push({ x:px2, y:py2, col:GLD, sh:0, r:3.2, a:al }); } }
      // Variety — 모양도 색도 제각각인 데이터
      if(vC>0){ var cxC=W*0.81, wC=W*0.20, hC=yBase-yTop-14, vcols=[GRN,BLU,PNK,MG];
        for(i=0;i<16;i++){ var ap2=vC*18-(i+hsh(i*3.3)*2); if(ap2<=0) continue; ap2=ap2>1?1:ap2;
          var gc=i%4, gr=(i-gc)/4;
          pts.push({ x:cxC-wC/2+(gc+0.5)*wC/4+(hsh(i*7.1+9)-0.5)*wC*0.14,
                     y:yTop+10+(gr+0.5)*hC/4+(hsh(i*11.3+5)-0.5)*hC*0.16,
                     col:vcols[(i*2+gr)%4], sh:(i+gr)%4, r:4.2, a:0.55+0.45*ap2 }); } }
      // 렌더: 수렴 진행률 cv 로 각 점을 예측 곡선 위 자기 자리로 보간
      function glyph(x,y,r,shp){ ctx.beginPath();
        if(shp===0){ ctx.arc(x,y,r,0,7); }
        else if(shp===1){ ctx.rect(x-r,y-r,2*r,2*r); }
        else if(shp===2){ ctx.moveTo(x,y-r*1.2); ctx.lineTo(x-r*1.1,y+r*0.9); ctx.lineTo(x+r*1.1,y+r*0.9); ctx.closePath(); }
        else { ctx.moveTo(x,y-r*1.25); ctx.lineTo(x+r*1.25,y); ctx.lineTo(x,y+r*1.25); ctx.lineTo(x-r*1.25,y); ctx.closePath(); }
        ctx.fill(); }
      var M=pts.length;
      for(j=0;j<M;j++){ var p=pts[j], t=(M>1)? j/(M-1) : 0;
        var tx=W*0.12+t*W*0.76, ty=curveY(t);
        var x4=p.x+(tx-p.x)*cv, y4=p.y+(ty-p.y)*cv;
        ctx.globalAlpha=seam*p.a; ctx.fillStyle=(cv>0.65)?MG:p.col;
        glyph(x4, y4, p.r+(3-p.r)*cv, (cv>0.5)?0:p.sh); }
      ctx.globalAlpha=1;
      // 구역 라벨(수렴하며 옅어짐)
      var la=seam*(1-cv);
      ctx.font='600 13px sans-serif'; ctx.textAlign='center';
      if(vA>0.05){ ctx.globalAlpha=la*vA; ctx.fillStyle=MG;  ctx.fillText('Volume · 얼마나 많은가',    W*0.19, labelY); }
      if(vB>0.05){ ctx.globalAlpha=la*vB; ctx.fillStyle=GLD; ctx.fillText('Velocity · 얼마나 빠른가',  W*0.50, labelY); }
      if(vC>0.05){ ctx.globalAlpha=la*vC; ctx.fillStyle=BLU; ctx.fillText('Variety · 얼마나 제각각인가', W*0.81, labelY); }
      if(vA>0.05 && cnt>0){ ctx.globalAlpha=la*vA; ctx.fillStyle=TXT; ctx.font='12px ui-monospace, monospace';
        ctx.fillText(cnt+' rows', W*0.19, yBase-6-7*Math.max(10,H*0.036)-12); }
      // 예측 곡선 — 세 축이 하나로 (진행형 스트로크)
      var cwv=ss(0.84,0.95,ph);
      if(cwv>0){ ctx.strokeStyle=MG; ctx.lineWidth=2.5; ctx.globalAlpha=seam*0.9; ctx.beginPath();
        for(var k=0;k<=60;k++){ var t2=(k/60)*cwv, xx=W*0.12+t2*W*0.76, yy=curveY(t2);
          if(k===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); } ctx.stroke();
        if(cwv>0.75){ ctx.globalAlpha=seam*ss(0.90,0.96,ph); ctx.fillStyle=MG; ctx.font='600 13px sans-serif'; ctx.textAlign='right';
          ctx.fillText('예측 Prediction', W*0.88, curveY(1)-16); } }
      ctx.globalAlpha=1;
      // 상단 대화체 문구
      var caps=this.story.caps, slot=1/caps.length, ci=Math.floor(ph/slot), lp2=(ph-ci*slot)/slot;
      var aa=(lp2<0.2? lp2/0.2 : lp2>0.8? (1-lp2)/0.2 : 1)*seam;
      var lines=caps[ci]||caps[0], mainF=Math.max(20,Math.min(33,W*0.039)), subF=Math.max(14,Math.min(21,W*0.024));
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.shadowColor='rgba(0,0,0,0.65)'; ctx.shadowBlur=14;
      for(var li=0;li<lines.length;li++){ var big2=(li===0);
        ctx.font=(big2?'600 '+mainF:'400 '+subF)+'px -apple-system, sans-serif';
        ctx.fillStyle=big2?'rgba(255,170,205,'+aa.toFixed(3)+')':'rgba(240,238,225,'+(aa*0.92).toFixed(3)+')';
        ctx.fillText(lines[li], W/2, H*0.13 + li*(mainF+9)); }
      ctx.shadowBlur=0; }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
