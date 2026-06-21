/* 제16장 확률 — 16.1 확률과 기본 성질 · 16.2 조건부확률·곱셈정리
   동작(behavior)만. 텍스트는 content/ch16.json */
(function(){
  var TAU=Math.PI*2;
  // 주사위 눈 그리기
  function die(ctx,x,y,s,val,on){
    ctx.fillStyle=on?'rgba(255,178,122,0.22)':'rgba(255,255,255,0.05)';
    ctx.strokeStyle=on?'#ffb27a':'rgba(255,255,255,0.25)'; ctx.lineWidth=2;
    if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,s,s,10);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,s,s);ctx.strokeRect(x,y,s,s);}
    var p=s/4, pos={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[val];
    ctx.fillStyle=on?'#ffb27a':'#9b99a3';
    pos.forEach(function(q){ ctx.beginPath(); ctx.arc(x+q[0]*p, y+q[1]*p, s*0.06, 0, TAU); ctx.fill(); });
  }

  var scenes=[

  // ══════════ 16.1 확률과 기본 성질 ══════════
  // 16.1a 확률이란 = 경우의 수 비율
  { id:'ch16_01',
    enter:function(E){ this.s={k:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>k 이하가 나올 확률</label><input type="range" id="kk" min="1" max="6" step="1" value="3"><output id="kko">3</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(420+self.s.k*40,0.1); }); },
    draw:function(E){ var ctx=E.ctx, k=this.s.k, s=Math.min(86,E.W*0.10), gap=18, totalW=6*s+5*gap, x0=E.W/2-totalW/2, y=E.H*0.40;
      for(var i=1;i<=6;i++) die(ctx, x0+(i-1)*(s+gap), y, s, i, i<=k);
      function gcd(a,b){ return b?gcd(b,a%b):a; } var g=gcd(k,6);
      E.big('P = '+k+'/6 = '+(k/6).toFixed(3)+'  ('+(k/g)+'/'+(6/g)+')', '확률 = (원하는 경우의 수) / (전체 경우의 수) — 0과 1 사이'); }
  },

  // 16.1b 큰수의 법칙 — 동전 시뮬
  { id:'ch16_02',
    enter:function(E){ this.s={hist:[],h:0,n:0}; E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.n>=600){ s.hist=[]; s.h=0; s.n=0; E.blip(320,0.12); return; }
      for(var i=0;i<30;i++){ s.n++; if(Math.random()<0.5) s.h++; if(s.n%3===0||s.n<30) s.hist.push(s.h/s.n); } E.blip(560,0.1); },
    draw:function(E){ var ctx=E.ctx, s=this.s, x0=E.W*0.16, x1=E.W*0.86, yT=E.H*0.32, yB=E.H*0.66, mid=(yT+yB)/2;
      // 축 + 0.5선
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x0,yB); ctx.lineTo(x1,yB); ctx.moveTo(x0,yT); ctx.lineTo(x0,yB); ctx.stroke();
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(x0,mid); ctx.lineTo(x1,mid); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('P = 0.5 (이론값)', x1-110, mid-6);
      ctx.fillStyle='#9b99a3'; ctx.textAlign='right'; ctx.fillText('1.0', x0-6, yT+4); ctx.fillText('0.5', x0-6, mid+4); ctx.fillText('0', x0-6, yB+4);
      // 빈도 곡선
      var H=s.hist.length;
      if(H>1){ ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath();
        for(var i=0;i<H;i++){ var px=x0+(x1-x0)*i/(H-1), py=yB-(yB-yT)*s.hist[i]; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
        var lp=s.hist[H-1]; ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(x0+(x1-x0),yB-(yB-yT)*lp,5,0,TAU); ctx.fill(); }
      E.tapHint(E.W/2, yB+44, s.n>=600?'↻ 다시 (30회씩, 현재 '+s.n+'회)':'▶ 30회 더 던지기 ('+s.n+'회)', true);
      var cur=s.n? (s.h/s.n):0;
      E.big('앞면 '+s.h+' / '+s.n+'회 = '+(s.n?cur.toFixed(3):'—'), '던질수록 상대도수가 0.5에 수렴 = 큰수의 법칙 (확률의 실험적 의미)'); }
  },

  // 16.1c 덧셈정리 (벤다이어그램 — 겹침 슬라이더, 면적비 실계산)
  { id:'ch16_03',
    // 두 원의 반지름은 고정, 중심거리 d를 슬라이더로 조절 → 교집합(렌즈) 면적을 실제로 적분해
    // 표본공간 S(고정 사각형 면적) 대비 비율로 P(A)·P(B)·P(A∩B)·P(A∪B)를 실계산한다.
    enter:function(E){ this.s={ov:55}; E.setOn([]);  // ov = 겹침 정도 0~100(클수록 두 원이 가까움)
      E.controls('<div class="ctrl"><label>두 사건의 겹침 정도</label><input type="range" id="ov" min="0" max="100" step="1" value="55"><output id="ovo">보통</output></div>');
      var self=this; E.bind('#ov','input',function(e){ self.s.ov=+e.target.value; var v=+e.target.value;
        document.getElementById('ovo').textContent = v<8?'배반(겹침 없음)' : v>92?'거의 같은 사건' : v<40?'조금 겹침' : v<70?'보통' : '많이 겹침';
        E.blip(420+v*4,0.08); }); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.40, r=Math.min(108,E.H*0.155);
      // 표본공간 S = 두 원이 들어가는 고정 사각형. 면적비의 분모.
      var S = (4*r)*(2.6*r);
      // 겹침 슬라이더 → 중심거리 d. ov=0이면 d=2r(접함=배반), ov=100이면 d≈0(완전 일치).
      var t=this.s.ov/100, d=2*r*(1-t);
      var ax=cx-d/2, bx=cx+d/2;
      // 두 원 면적(같음)
      var areaA=Math.PI*r*r, areaB=Math.PI*r*r;
      // 두 동일 반지름 원의 교집합(렌즈) 면적 실계산: 2 r² acos(d/2r) − (d/2)√(4r²−d²)
      var lens=0; if(d < 2*r){ var hd=d/2; lens = 2*r*r*Math.acos(hd/r) - hd*Math.sqrt(Math.max(0,4*r*r-d*d)); }
      var uni = areaA+areaB-lens;
      var pA=areaA/S, pB=areaB/S, pI=lens/S, pU=uni/S;
      // ── 원 그리기 ──
      ctx.fillStyle='rgba(122,184,255,0.20)'; ctx.beginPath(); ctx.arc(ax,cy,r,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(143,227,181,0.20)'; ctx.beginPath(); ctx.arc(bx,cy,r,0,TAU); ctx.fill();
      // 교집합 강조(두 원 클립 교차)
      if(lens>0.5){ ctx.save(); ctx.beginPath(); ctx.arc(ax,cy,r,0,TAU); ctx.clip();
        ctx.beginPath(); ctx.arc(bx,cy,r,0,TAU); ctx.fillStyle='rgba(244,160,192,0.45)'; ctx.fill(); ctx.restore(); }
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ax,cy,r,0,TAU); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(bx,cy,r,0,TAU); ctx.stroke();
      ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('A', ax-r*0.55, cy-r*0.4); ctx.fillStyle='#8fe3b5'; ctx.fillText('B', bx+r*0.55, cy-r*0.4);
      if(pI>0.005){ ctx.fillStyle='#f4a0c0'; ctx.fillText('A∩B', (ax+bx)/2, cy); }
      ctx.textBaseline='alphabetic';
      // ── 수치 패널(실계산) ──
      ctx.font='13px sans-serif'; ctx.textAlign='left'; var lx=E.W*0.06, ly=E.H*0.66, lh=20;
      ctx.fillStyle='#7ab8ff'; ctx.fillText('P(A) = '+pA.toFixed(3), lx, ly);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('P(B) = '+pB.toFixed(3), lx, ly+lh);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('P(A∩B) = '+pI.toFixed(3), lx, ly+lh*2);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif';
      ctx.fillText('P(A∪B) = '+pA.toFixed(3)+' + '+pB.toFixed(3)+' − '+pI.toFixed(3)+' = '+pU.toFixed(3), lx, ly+lh*3+4);
      var note = pI<0.005 ? '겹침이 0 → 배반사건이라 그냥 더한 값입니다' : '겹친 부분을 두 번 더했으니 한 번 빼서 합집합 확률을 얻습니다';
      E.big('P(A∪B) = P(A) + P(B) − P(A∩B)', '겹침 슬라이더를 움직이면 면적비로 계산한 합집합 확률이 실시간으로 바뀝니다 — '+note); }
  },

  // ══════════ 16.2 조건부확률·곱셈정리 ══════════
  // 16.2a 조건부확률
  { id:'ch16_04',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'주사위에서 "짝수가 나왔다"고 알 때, 그 수가 6일 확률은?', choices:['1/6','1/3','1/2','1/4'], answer:1, explain:'짝수는 {2,4,6} 3개로 좁혀짐 → 그 중 6은 1개 → 1/3'}); },
    draw:function(E){ var ctx=E.ctx, s=Math.min(70,E.W*0.08), gap=14, x0=E.W/2-(3*s+2*gap)/2, y=E.H*0.36, evens=[2,4,6];
      ctx.fillStyle='#cfcdc6'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('조건: 짝수가 나왔다 → 표본공간이 {2,4,6}으로 축소', E.W/2, y-22);
      for(var i=0;i<3;i++){ var on=(evens[i]===6); ctx.fillStyle=on?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.15)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        var x=x0+i*(s+gap); if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,s,s,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,s,s);ctx.strokeRect(x,y,s,s);}
        ctx.fillStyle=on?'#ffb27a':'#cfcdc6'; ctx.font='600 24px sans-serif'; ctx.textBaseline='middle'; ctx.fillText(evens[i], x+s/2, y+s/2); ctx.textBaseline='alphabetic'; }
      E.big('P(B | A) = P(A∩B) / P(A)', '조건부확률 — "A가 일어났다"는 정보로 표본공간이 A로 좁아집니다'); }
  },

  // 16.2b 곱셈정리·독립 (확률 나무 — 가지확률 슬라이더, 잎=부모×자식 실곱셈)
  { id:'ch16_05',
    // p1 = 1차 시행에서 '빨강' 가지 확률(변수). 독립이므로 2차 시행도 같은 분포(빨강 = p1).
    // 잎 확률은 draw에서 (부모가지 × 자식가지)로 실제 곱셈해 표시한다(하드코딩 없음).
    enter:function(E){ this.s={p1:50}; E.setOn([]);  // p1 = 빨강 확률(%) 0~100
      E.controls('<div class="ctrl"><label>빨강이 나올 확률 P(빨강)</label><input type="range" id="p1" min="5" max="95" step="5" value="50"><output id="p1o">0.50</output></div>');
      var self=this; E.bind('#p1','input',function(e){ self.s.p1=+e.target.value; document.getElementById('p1o').textContent=(self.s.p1/100).toFixed(2); E.blip(440+self.s.p1*3,0.08); }); },
    draw:function(E){ var ctx=E.ctx, rootX=E.W*0.22, rootY=E.H*0.40, midX=E.W*0.48, leafX=E.W*0.70;
      var pR=this.s.p1/100, pB=1-pR;                 // 1차 가지확률(실수)
      var br=[['빨강',pR],['파랑',pB]];               // 부모 가지: [라벨, 확률]
      var child=[['빨강',pR],['파랑',pB]];            // 독립 → 자식 가지도 같은 분포
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(rootX,rootY,8,0,TAU); ctx.fill();
      ctx.font='13px sans-serif';
      var sum=0;
      for(var i=0;i<2;i++){ var ty=rootY+(i-0.5)*E.H*0.34, parentP=br[i][1];
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(rootX,rootY); ctx.lineTo(midX,ty); ctx.stroke();
        ctx.fillStyle='#7ab8ff'; ctx.textAlign='center'; ctx.fillText(parentP.toFixed(2), (rootX+midX)/2, ty+(i?18:-8)-5);
        ctx.beginPath(); ctx.arc(midX,ty,6,0,TAU); ctx.fill(); ctx.textAlign='right'; ctx.fillText(br[i][0], midX-10, ty+4);
        for(var j=0;j<2;j++){ var ly=ty+(j-0.5)*E.H*0.14, childP=child[j][1];
          var leafP=parentP*childP;                  // ★ 실제 곱셈 = 부모가지 × 자식가지
          sum+=leafP;
          ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(midX,ty); ctx.lineTo(leafX,ly); ctx.stroke();
          ctx.fillStyle='#8fe3b5'; ctx.textAlign='center'; ctx.fillText(childP.toFixed(2), (midX+leafX)/2, ly+(j?16:-6)-4);
          ctx.beginPath(); ctx.arc(leafX,ly,5,0,TAU); ctx.fill();
          ctx.fillStyle='#dfeefb'; ctx.textAlign='left';
          ctx.fillText(br[i][0].slice(0,1)+'→'+child[j][0].slice(0,1)+'  '+parentP.toFixed(2)+'×'+childP.toFixed(2)+'='+leafP.toFixed(2), leafX+10, ly+4); } }
      // 잎 확률 합 검산(실계산, 항상 1.00)
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('네 잎 확률의 합 = '+sum.toFixed(2)+' (전체 = 1)', E.W*0.06, E.H*0.78);
      var rr=(pR*pR);
      E.big('P(빨강∩빨강) = P(빨강) · P(빨강) = '+pR.toFixed(2)+' × '+pR.toFixed(2)+' = '+rr.toFixed(2),
        '곱셈정리 — 가지를 따라 곱합니다. 두 시행이 독립이라 P(B|A)=P(B), 잎 확률은 부모×자식으로 실제 계산됩니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
