/* 산업위생관리기술사 제1장 — 산업위생 개론(노출기준과 핵심 계산). 동작만. 텍스트=content/hyg1.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  var MV=24.45; // 25℃·1기압에서 기체 1몰의 부피(L) — 산업위생 표준상태

  var scenes=[

  // 1.1 노출기준 3형제 — TWA·STEL·C (개념·탭)
  { id:'hyg1_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H, st=s.step;
      var conc=[45,60,70,55,85,110,140,90,70,55,160,100,65,50,60,45];
      var n=conc.length, mL=72,mR=42,mT=56,mB=58, pw=W-mL-mR, ph=H-mT-mB, ymax=200, dt=8/n;
      function X(t){return mL+t/8*pw;}
      function Y(c){return mT+ph-(c/ymax)*ph;}
      // 축
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(mL,mT); ctx.lineTo(mL,mT+ph); ctx.lineTo(mL+pw,mT+ph); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(var h=0;h<=8;h+=2) ctx.fillText(h+'h', X(h), mT+ph+16);
      ctx.textAlign='right';
      for(var c=0;c<=200;c+=50) ctx.fillText(c, mL-8, Y(c)+4);
      ctx.save(); ctx.translate(16, mT+ph/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('농도 (ppm)',0,0); ctx.restore();
      // 하루 농도 프로파일(계단)
      var i,sum=0,mx=0,pk=0;
      for(i=0;i<n;i++){ var x0=X(i*dt), x1=X((i+1)*dt), yb=Y(conc[i]);
        ctx.fillStyle='rgba(122,184,255,0.22)'; ctx.fillRect(x0,yb,x1-x0,mT+ph-yb);
        ctx.strokeStyle=BLU; ctx.lineWidth=1.3; ctx.strokeRect(x0,yb,x1-x0,mT+ph-yb);
        sum+=conc[i]; if(conc[i]>mx){mx=conc[i];pk=i;} }
      var twa=sum/n; // Σ(Ci·Ti)/8, 각 구간 0.5h → 평균과 동일
      // ① TWA — 8시간 평균선
      if(st>=1){ ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.setLineDash([2,0]);
        ctx.beginPath(); ctx.moveTo(mL,Y(twa)); ctx.lineTo(mL+pw,Y(twa)); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('TWA '+twa.toFixed(1)+' ppm (8h 평균)', mL+6, Y(twa)-6); }
      // ② STEL — 15분 단기 창(최고 구간)
      if(st>=2){ var sx0=X(pk*dt), sx1=X((pk+1)*dt);
        ctx.fillStyle='rgba(255,178,122,0.28)'; ctx.fillRect(sx0,mT,sx1-sx0,ph);
        ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.strokeRect(sx0,mT,sx1-sx0,ph); ctx.setLineDash([]);
        ctx.fillStyle=ORA; ctx.textAlign='center'; ctx.font='11px sans-serif';
        ctx.fillText('STEL 15분', (sx0+sx1)/2, mT-6); }
      // ③ C — 천장선(절대 초과 금지)
      if(st>=3){ var cy=Y(mx)-2; ctx.strokeStyle=RED; ctx.lineWidth=2.4; ctx.setLineDash([8,5]);
        ctx.beginPath(); ctx.moveTo(mL,cy); ctx.lineTo(mL+pw,cy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='bold 12px sans-serif'; ctx.textAlign='right';
        ctx.fillText('천장값 C — 순간도 초과 금지', mL+pw, cy-6); }
      E.tapHint(0,0,'다음 기준',true);
      var big=['하루 농도는 시시각각 오르내립니다','TWA = 8시간 시간가중평균','STEL = 15분 단시간 노출','C = 천장값(Ceiling)'][st];
      var sub=['같은 물질도 3가지 잣대로 관리합니다 — 탭하세요','만성 영향 관리 — 하루를 통틀어 평균으로 판단','급성·자극·마취 방지 — 짧고 강한 노출을 잡는다','즉시 위험 물질 — 잠시도 넘어선 안 되는 절대선'][st];
      E.big(big, sub); }
  },

  // 1.2 TWA 계산 — 시간이 무게다 (슬라이더)
  { id:'hyg1_02',
    enter:function(E){ var self=this; this.s={c1:60,c2:140,c3:40};
      E.controls(
        '<div class="ctrl"><label>구간1 농도 C₁ (4시간)</label><input type="range" id="c1" min="0" max="300" step="5" value="60"><output id="c1o">60</output></div>'+
        '<div class="ctrl"><label>구간2 농도 C₂ (2시간)</label><input type="range" id="c2" min="0" max="300" step="5" value="140"><output id="c2o">140</output></div>'+
        '<div class="ctrl"><label>구간3 농도 C₃ (2시간)</label><input type="range" id="c3" min="0" max="300" step="5" value="40"><output id="c3o">40</output></div>');
      E.bind('#c1','input',function(e){ self.s.c1=+e.target.value; document.getElementById('c1o').textContent=e.target.value; });
      E.bind('#c2','input',function(e){ self.s.c2=+e.target.value; document.getElementById('c2o').textContent=e.target.value; });
      E.bind('#c3','input',function(e){ self.s.c3=+e.target.value; document.getElementById('c3o').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var T=[4,2,2], C=[s.c1,s.c2,s.c3], LIM=100; // 예: TWA 노출기준 100ppm
      var twa=(C[0]*T[0]+C[1]*T[1]+C[2]*T[2])/8;   // Σ(Ci·Ti)/8 실계산
      var mL=70,mR=40,mT=54,mB=56, pw=W-mL-mR, ph=H-mT-mB, ymax=300;
      function X(t){return mL+t/8*pw;}
      function Y(c){return mT+ph-(c/ymax)*ph;}
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(mL,mT); ctx.lineTo(mL,mT+ph); ctx.lineTo(mL+pw,mT+ph); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right';
      for(var c=0;c<=300;c+=100) ctx.fillText(c, mL-8, Y(c)+4);
      // 구간 막대(폭=시간, 높이=농도 → 넓이=기여도)
      var t0=0, cols=[BLU,ORA,PNK];
      for(var i=0;i<3;i++){ var x0=X(t0), x1=X(t0+T[i]), yb=Y(C[i]);
        ctx.fillStyle=cols[i]; ctx.globalAlpha=0.30; ctx.fillRect(x0,yb,x1-x0,mT+ph-yb); ctx.globalAlpha=1;
        ctx.strokeStyle=cols[i]; ctx.lineWidth=1.6; ctx.strokeRect(x0,yb,x1-x0,mT+ph-yb);
        ctx.fillStyle=cols[i]; ctx.textAlign='center'; ctx.font='11px sans-serif';
        ctx.fillText('C'+(i+1)+'·T'+(i+1)+' = '+(C[i]*T[i]), (x0+x1)/2, Math.min(yb-6,mT+ph-8));
        ctx.fillStyle=DIM; ctx.fillText(T[i]+'h', (x0+x1)/2, mT+ph+16);
        t0+=T[i]; }
      // 기준선
      ctx.strokeStyle=DIM; ctx.setLineDash([4,4]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(mL,Y(LIM)); ctx.lineTo(mL+pw,Y(LIM)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('노출기준 '+LIM+' ppm', mL+4, Y(LIM)-5);
      // 가중평균선(TWA)
      var over=twa>LIM;
      ctx.strokeStyle=over?RED:GRN; ctx.lineWidth=2.6;
      ctx.beginPath(); ctx.moveTo(mL,Y(twa)); ctx.lineTo(mL+pw,Y(twa)); ctx.stroke();
      ctx.fillStyle=over?RED:GRN; ctx.font='bold 12px sans-serif'; ctx.textAlign='right';
      ctx.fillText('TWA '+twa.toFixed(1)+' ppm', mL+pw, Y(twa)-6);
      E.big('TWA = ('+C[0]+'×4 + '+C[1]+'×2 + '+C[2]+'×2) ÷ 8 = '+twa.toFixed(1)+' ppm',
        over?('노출기준 '+LIM+'ppm 초과 — 즉시 개선 필요'):('농도×시간의 넓이를 8시간으로 나눈 값 (기준 이내)')); }
  },

  // 1.3 혼합물 노출지수 — 합이 1을 넘으면 초과 (슬라이더)
  { id:'hyg1_03',
    enter:function(E){ var self=this; this.s={c1:40,c2:20,c3:6};
      E.controls(
        '<div class="ctrl"><label>물질A 농도 (기준 100)</label><input type="range" id="c1" min="0" max="120" step="2" value="40"><output id="c1o">40</output></div>'+
        '<div class="ctrl"><label>물질B 농도 (기준 50)</label><input type="range" id="c2" min="0" max="60" step="1" value="20"><output id="c2o">20</output></div>'+
        '<div class="ctrl"><label>물질C 농도 (기준 25)</label><input type="range" id="c3" min="0" max="30" step="1" value="6"><output id="c3o">6</output></div>');
      E.bind('#c1','input',function(e){ self.s.c1=+e.target.value; document.getElementById('c1o').textContent=e.target.value; });
      E.bind('#c2','input',function(e){ self.s.c2=+e.target.value; document.getElementById('c2o').textContent=e.target.value; });
      E.bind('#c3','input',function(e){ self.s.c3=+e.target.value; document.getElementById('c3o').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var T=[100,50,25], C=[s.c1,s.c2,s.c3], cols=[BLU,ORA,PNK], names=['A','B','C'];
      var r=[C[0]/T[0],C[1]/T[1],C[2]/T[2]], EI=r[0]+r[1]+r[2]; // 복합노출지수 실계산
      var mL=70, pw=W-mL-46, top=70;
      // 기여 막대(누적)
      ctx.font='12px sans-serif';
      var y=top;
      for(var i=0;i<3;i++){
        ctx.fillStyle=DIM; ctx.textAlign='right'; ctx.fillText('물질'+names[i], mL-10, y+14);
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(mL,y,pw,20);
        ctx.fillStyle=cols[i]; ctx.fillRect(mL,y,Math.min(r[i],1.4)/1.4*pw,20);
        ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(C[i]+'/'+T[i]+' = '+r[i].toFixed(3), mL+pw+6-pw, y+15);
        ctx.textAlign='right'; ctx.fillText(r[i].toFixed(3), mL+pw-6, y+15);
        y+=34; }
      // 게이지 0~1.4 (1.0에서 초록→빨강 경계)
      var gy=y+18, gh=30, over=EI>1;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(mL,gy,pw,gh);
      var frac=Math.min(EI,1.4)/1.4;
      ctx.fillStyle=over?RED:GRN; ctx.fillRect(mL,gy,frac*pw,gh);
      // 1.0 경계선
      var lx=mL+(1/1.4)*pw;
      ctx.strokeStyle=TXT; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(lx,gy-8); ctx.lineTo(lx,gy+gh+8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=TXT; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('한계 1.0', lx, gy-12);
      ctx.textAlign='left'; ctx.fillStyle=over?RED:GRN;
      ctx.fillText('EI = '+EI.toFixed(3)+(over?'  ▶ 노출기준 초과':'  ▶ 기준 이내'), mL, gy+gh+26);
      E.big('EI = '+r[0].toFixed(2)+' + '+r[1].toFixed(2)+' + '+r[2].toFixed(2)+' = '+EI.toFixed(3),
        over?'상가작용 가정 — 각 물질은 기준 이내여도 합이 1을 넘으면 초과':'서로 같은 표적장기 = 유해성 합산(상가작용)'); }
  },

  // 1.4 ppm ↔ mg/m³ — 분자량이 다리 (슬라이더)
  { id:'hyg1_04',
    enter:function(E){ var self=this; this.s={M:78,ppm:100};
      E.controls(
        '<div class="ctrl"><label>분자량 M (g/mol)</label><input type="range" id="mm" min="17" max="200" step="1" value="78"><output id="mmo">78</output></div>'+
        '<div class="ctrl"><label>농도 (ppm)</label><input type="range" id="pp" min="0" max="500" step="5" value="100"><output id="ppo">100</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=e.target.value; });
      E.bind('#pp','input',function(e){ self.s.ppm=+e.target.value; document.getElementById('ppo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var M=s.M, ppm=s.ppm, mg=ppm*M/MV; // mg/m³ = ppm × M / 24.45 실계산
      // 부피 상자(1 m³ 공기) + 입자 = 부피비(ppm)
      var bx=70, by=80, bw=Math.min(300,W-260), bh=bw;
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=1.6; ctx.strokeRect(bx,by,bw,bh);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('공기 1 m³ (25℃·1기압)', bx, by-8);
      // 입자 개수 ∝ ppm (부피비), 결정적 배치
      var N=Math.round(ppm/12); if(N>40)N=40;
      var rad=3+M/60; // 입자 크기 ∝ 분자량(질량 느낌)
      for(var i=0;i<N;i++){
        var gx=(Math.sin(i*12.9898)*43758.5453); gx=gx-Math.floor(gx);
        var gy=(Math.sin(i*78.233)*12345.678); gy=gy-Math.floor(gy);
        var px=bx+8+gx*(bw-16), py=by+8+gy*(bh-16);
        ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(px,py,rad,0,6.2832); ctx.fill(); }
      ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.font='12px sans-serif';
      ctx.fillText('입자 수 ∝ ppm (부피비)', bx+bw/2, by+bh+20);
      ctx.fillText('입자 크기 ∝ 분자량 M (질량)', bx+bw/2, by+bh+38);
      // 오른쪽 환산 패널
      var rx=bx+bw+40, ry=by+30;
      ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillStyle=BLU; ctx.fillText(ppm+' ppm', rx, ry);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('× M('+M+') ÷ 24.45', rx, ry+22);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(rx,ry+32); ctx.lineTo(rx+140,ry+32); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='bold 15px sans-serif';
      ctx.fillText(mg.toFixed(1)+' mg/m³', rx, ry+56);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('24.45 L = 기체 1몰의 부피', rx, ry+86);
      ctx.fillText('(25℃·1기압 표준상태)', rx, ry+102);
      E.big(ppm+' ppm × '+M+' ÷ 24.45 = '+mg.toFixed(1)+' mg/m³',
        'ppm=부피비(온도·압력만 좌우) → 질량으로 바꾸려면 분자량이 다리'); }
  },

  // 1.5 비정상 작업시간 보정 — 오래 일하면 기준이 내려간다 (슬라이더)
  { id:'hyg1_05',
    enter:function(E){ var self=this; this.s={h:10};
      E.Plot.range(8,16,0,110).lab('작업시간 h','보정기준 ppm');
      E.controls('<div class="ctrl"><label>하루 작업시간 h (시간)</label><input type="range" id="hh" min="8" max="16" step="0.5" value="10"><output id="hho">10</output></div>');
      E.bind('#hh','input',function(e){ self.s.h=+e.target.value; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot, ctx=E.ctx, h=s.h, TLV=100;
      var RF=(8/h)*((24-h)/16), corr=TLV*RF;   // Brief & Scala 보정 실계산
      var osha=TLV*8/h;                          // OSHA 보정(비교용)
      P.axes();
      P.curve(function(x){return TLV*(8/x)*((24-x)/16);}, GRN); // Brief&Scala 곡선
      P.curve(function(x){return TLV*8/x;}, DIM);               // OSHA 곡선(비교)
      // 원기준선
      ctx.strokeStyle='rgba(219,238,251,0.3)'; ctx.setLineDash([4,4]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(P.X(8),P.Y(TLV)); ctx.lineTo(P.X(16),P.Y(TLV)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('원기준 '+TLV+' ppm (8h)', P.X(8)+4, P.Y(TLV)-6);
      ctx.fillStyle=DIM; ctx.fillText('OSHA', P.X(15.2), P.Y(TLV*8/15.2)-6);
      P.dot(h, corr, corr<osha?GRN:GRN, 'B&S = '+corr.toFixed(1));
      P.dot(h, osha, DIM);
      E.big('보정기준 = 100 × (8/'+h.toFixed(1)+') × ((24−'+h.toFixed(1)+')/16) = '+corr.toFixed(1)+' ppm',
        '오래 일할수록 회복시간이 줄어 기준을 더 낮춰야 안전 — h가 커지면 곡선이 내려간다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
