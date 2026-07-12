/* 산업위생관리기술사 제7장 — 산업독성학(독은 양이 정한다). 동작만. 텍스트=content/hyg7.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 글자 크기 = H 비례 + 클램프(낮은 뷰포트에서 겹침·잘림 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn, Math.min(mx, H*frac)); }

  var scenes=[

  // 7.1 용량-반응 — 파라켈수스의 원리 (슬라이더 · 커스텀 캔버스)
  { id:'hyg7_01',
    enter:function(E){ var self=this; this.s={logD:2};
      E.controls('<div class="ctrl"><label>투여 용량 D (mg/kg, 로그축)</label><input type="range" id="ld" min="-1" max="3" step="0.02" value="2"><output id="ldo">100</output></div>');
      E.bind('#ld','input',function(e){ self.s.logD=+e.target.value; var d=Math.pow(10,+e.target.value);
        document.getElementById('ldo').textContent=(d>=10? d.toFixed(0) : d.toFixed(1)); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var logD=s.logD, D=Math.pow(10,logD);
      var u50=2, k=3;                              // 로지스틱: log10(LD50)=2 → LD50=100
      function Rthr(d){ var u=Math.log(d)/Math.LN10; return 100/(1+Math.exp(-k*(u-u50))); }  // 역치형(시그모이드)
      function Rlnt(d){ return Math.min(100, 100*d/1000); }                                    // 무역치(LNT 선형)
      var rt=Rthr(D), rl=Rlnt(D);
      var LD50=Math.pow(10,u50);                                                               // =100 (실계산)
      var NOAEL=Math.pow(10, u50 - Math.log(99)/k);                                            // 반응 ~1% 지점(≈2.9)
      // 그래프 영역(H 비례, 모두 0.30 아래)
      var top=H*0.335, bot=H*0.88, left=W*0.14, right=W*0.95, pw=right-left, ph=bot-top;
      function X(u){ return left+(u-(-1))/(3-(-1))*pw; }
      function Y(r){ return bot-(r/100)*ph; }
      var axF=FS(H,0.022,9,12), lbF=FS(H,0.026,11,14);
      // 축
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bot); ctx.lineTo(right,bot); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font=axF+'px sans-serif'; ctx.textAlign='center';
      var xt=[['-1','0.1'],['0','1'],['1','10'],['2','100'],['3','1000']];
      for(var i=0;i<xt.length;i++) ctx.fillText(xt[i][1], X(+xt[i][0]), bot+FS(H,0.028,13,18));
      ctx.textAlign='right';
      for(var r=0;r<=100;r+=25) ctx.fillText(r+'%', left-6, Y(r)+4);
      ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.font=axF+'px sans-serif';
      ctx.fillText('용량 D (mg/kg, 로그축)', (left+right)/2, bot+FS(H,0.055,26,36));
      // 역치형(일반독성) 시그모이드
      ctx.strokeStyle=GRN; ctx.lineWidth=2.6; ctx.beginPath();
      for(var j=0;j<=200;j++){ var u=-1+4*j/200, px=X(u), py=Y(Rthr(Math.pow(10,u))); if(j===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke();
      // 무역치(발암) LNT
      ctx.strokeStyle=PNK; ctx.lineWidth=2.4; ctx.setLineDash([6,4]); ctx.beginPath();
      for(var j2=0;j2<=200;j2++){ var u2=-1+4*j2/200, px2=X(u2), py2=Y(Rlnt(Math.pow(10,u2))); if(j2===0)ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2); }
      ctx.stroke(); ctx.setLineDash([]);
      // LD50 마커(가로 50% + 세로선)
      ctx.strokeStyle='rgba(242,189,85,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(left,Y(50)); ctx.lineTo(X(u50),Y(50)); ctx.lineTo(X(u50),bot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=AMB; ctx.font='600 '+axF+'px sans-serif'; ctx.textAlign='left';
      ctx.fillText('LD₅₀ = '+LD50.toFixed(0)+' mg/kg', X(u50)+6, Y(50)-6);
      // NOAEL 마커(역치)
      var nu=Math.log(NOAEL)/Math.LN10;
      ctx.strokeStyle='rgba(143,227,181,0.6)'; ctx.lineWidth=1.4; ctx.setLineDash([2,3]);
      ctx.beginPath(); ctx.moveTo(X(nu),bot); ctx.lineTo(X(nu),Y(Rthr(NOAEL))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.textAlign='center';
      ctx.fillText('NOAEL≈'+NOAEL.toFixed(1), X(nu), Y(Rthr(NOAEL))-6);
      // 현재 용량 세로선 + 두 곡선 위 점
      var cx=X(logD);
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(cx,top); ctx.lineTo(cx,bot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,Y(rt),FS(H,0.011,4,7),0,6.29); ctx.fill();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(cx,Y(rl),FS(H,0.011,4,7),0,6.29); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,Y(rt),FS(H,0.011,4,7),0,6.29); ctx.stroke();
      // 범례
      var lx=right-pw*0.30, ly=top+FS(H,0.03,14,20);
      ctx.textAlign='left'; ctx.font=axF+'px sans-serif';
      ctx.fillStyle=GRN; ctx.fillText('■ 역치형(일반독성)', lx, ly);
      ctx.fillStyle=PNK; ctx.fillText('▤ 무역치(발암성)', lx, ly+FS(H,0.03,14,19));
      E.big('D = '+(D>=10?D.toFixed(0):D.toFixed(1))+' mg/kg → 역치형 반응 '+rt.toFixed(1)+'% · 발암 위험 '+rl.toFixed(2)+'%',
        '"모든 것은 독이며, 독이 아니게 하는 것은 오직 용량뿐" — 일반독성엔 역치(NOAEL≈'+NOAEL.toFixed(1)+'), 발암성엔 안전한 용량이 없습니다'); }
  },

  // 7.2 ADME — 독의 여정 (탭 단계 · HygDoc)
  { id:'hyg7_02',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], arrows=[], calc=[];
      boxes.push({x:0.27,y:0.335,w:0.46,h:0.10,c:BLU,t:'① 흡수 (Absorption)',s:'호흡기(최다) > 피부(경피) > 소화기'});
      if(st>=1){ boxes.push({x:0.27,y:0.465,w:0.46,h:0.10,c:GRN,t:'② 분포 (Distribution)',s:'혈류를 타고 표적장기로 이동·축적'});
        arrows.push({x1:0.50,y1:0.435,x2:0.50,y2:0.465,c:'rgba(223,238,251,0.5)'}); }
      if(st>=2){ boxes.push({x:0.27,y:0.595,w:0.46,h:0.10,c:AMB,t:'③ 대사 (Metabolism) — 주로 간',s:'제1상 산화(CYP450) + 제2상 포합 → 수용성↑'});
        arrows.push({x1:0.50,y1:0.565,x2:0.50,y2:0.595,c:'rgba(223,238,251,0.5)'}); }
      if(st>=3){ boxes.push({x:0.27,y:0.725,w:0.46,h:0.10,c:GRN,t:'④ 배설 (Excretion)',s:'소변(신장)·호기(폐)·담즙'});
        arrows.push({x1:0.50,y1:0.695,x2:0.50,y2:0.725,c:'rgba(223,238,251,0.5)'}); }
      if(st>=4){ boxes.push({x:0.10,y:0.855,w:0.80,h:0.105,c:RED,t:'⚠ 대사 활성화 (Bioactivation)',s:'해독이 아니라 독성↑ — 벤젠→벤젠옥사이드→골수독성 / n-헥산→2,5-헥산디온(신경독)'});
        arrows.push({x1:0.35,y1:0.695,x2:0.30,y2:0.855,c:RED,dash:true}); }
      if(st>=1) calc.push({k:'폐포 침투 입경',v:'0.5~5 µm',c:BLU});
      if(st>=1) calc.push({k:'피부흡수 비중',v:'전 흡수의 ~15%',c:GRN});
      if(st>=2) calc.push({k:'제1상 핵심효소',v:'Cytochrome P-450',c:AMB});
      window.HygDoc(E,{ boxes:boxes, arrows:arrows, calc:calc,
        note: st>=4? '같은 물질도 대사에 따라 해독되거나 더 독해집니다' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['독은 몸속에서 여행을 합니다 — 흡수부터','흡수된 독은 혈류를 타고 온몸으로','간이 화학공장처럼 독을 바꿉니다','바뀐 독은 몸 밖으로 빠져나갑니다','대사가 오히려 독을 더 세게 만들기도'][st];
      var sub=['가장 큰 문은 호흡기입니다 — 폐포까지 닿는 0.5~5µm 입자가 핵심이고, 피부·소화기가 뒤를 잇습니다. D키로 여정을 이어 보세요',
        '흡수된 독은 혈액을 타고 퍼지며, 지용성·친화성에 따라 특정 표적장기에 모입니다',
        '간의 제1상(산화·환원·가수분해, CYP450)과 제2상(글루쿠론산·글루타치온 포합)이 독을 수용성으로 바꿔 배설을 돕습니다',
        '수용성이 된 대사물은 주로 소변(신장)과 호기(폐), 일부는 담즙으로 배설됩니다',
        '벤젠은 간에서 산화되며 오히려 골수를 해치는 독성 대사물이 됩니다 — 대사=항상 해독은 아닙니다'][st];
      E.big(big, sub); }
  },

  // 7.3 표적장기와 대표 독성물질 (탭 단계 · HygDoc)
  { id:'hyg7_03',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var rows=[
        {o:'폐 (호흡기)',   c:BLU, m:'석면 · 유리규산',      d:'중피종·폐암·규폐증 (IARC 1)'},
        {o:'조혈 (골수)',   c:PNK, m:'벤젠',                  d:'백혈병·재생불량성빈혈 (IARC 1)'},
        {o:'신장',          c:GRN, m:'카드뮴',                d:'단백뇨·이타이이타이병'},
        {o:'신경',          c:AMB, m:'납 · 망간 · 수은',      d:'뇌증·말초신경병·파킨슨양'},
        {o:'간',            c:ORA, m:'사염화탄소 (CCl₄)',     d:'중심소엽성 괴사·황달'}
      ];
      var boxes=[], y0=0.33, rh=0.105, gap=0.12;
      for(var i=0;i<rows.length && i<=st;i++){ var R=rows[i], y=y0+i*gap;
        boxes.push({x:0.03,y:y,w:0.24,h:rh,c:R.c,t:R.o});
        boxes.push({x:0.30,y:y,w:0.32,h:rh,c:R.c,t:R.m,s:'대표 물질'});
        boxes.push({x:0.65,y:y,w:0.32,h:rh,c:R.c,t:R.d,s:'표적 손상'});
      }
      window.HygDoc(E,{ boxes:boxes, note:'같은 독도 잘 모이는 장기가 다릅니다 — 표적장기를 알면 감시항목이 정해집니다' });
      E.tapHint(0,0,'다음 장기',true);
      var big=['폐 — 들이마신 섬유·분진이 쌓입니다','조혈(골수) — 벤젠이 피를 만드는 공장을 칩니다','신장 — 카드뮴이 걸러내는 필터를 망가뜨립니다','신경 — 납·망간이 뇌와 말초를 공격합니다','간 — 사염화탄소가 해독공장을 무너뜨립니다'][st];
      var sub=['석면·유리규산은 폐 깊숙이 박혀 중피종·폐암·규폐증을 일으킵니다 — 모두 대표적 직업성 발암/진폐입니다. D키로 이어 보세요',
        '벤젠은 골수의 조혈기능을 억제해 재생불량성빈혈과 백혈병을 부릅니다 — IARC 1군 대표 물질입니다',
        '카드뮴은 근위세뇨관을 손상시켜 단백뇨를 남기고, 만성 축적은 이타이이타이병으로 알려진 골연화를 부릅니다',
        '납은 중추·말초신경을, 망간은 파킨슨양 증상을 일으켜 신경계를 손상시킵니다 — 대표적 신경독성 중금속입니다',
        '사염화탄소는 간의 중심소엽성 괴사를 일으킵니다 — 간은 해독의 중심이라 오히려 손상되기 쉽습니다'][st];
      E.big(big, sub); }
  },

  // 7.4 생물학적 노출지표 BEI — 몸이 말하는 노출량 (슬라이더 · 커스텀 캔버스)
  { id:'hyg7_04',
    enter:function(E){ var self=this; this.s={cair:0.05};
      E.controls('<div class="ctrl"><label>공기 중 납 농도 C (mg/m³)</label><input type="range" id="ca" min="0" max="0.15" step="0.005" value="0.05"><output id="cao">0.050</output></div>');
      E.bind('#ca','input',function(e){ self.s.cair=+e.target.value; document.getElementById('cao').textContent=(+e.target.value).toFixed(3); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var C=s.cair, TLV=0.05, BEI=30, base=3;         // 납: TWA 0.05 mg/m³, BEI 혈중납 30 µg/dL, 배경 3
      var slope=(BEI-base)/TLV;                         // 노출-내부용량 선형기울기 실계산
      var PbB=base+slope*C;                             // 혈중 납(예측) 실계산
      var over=PbB>BEI;
      var top=H*0.335, bot=H*0.88, left=W*0.15, right=W*0.95, pw=right-left, ph=bot-top;
      var Cmax=0.15, Ymax=90;
      function X(c){ return left+c/Cmax*pw; }
      function Y(p){ return bot-Math.min(p,Ymax)/Ymax*ph; }
      var axF=FS(H,0.022,9,12);
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bot); ctx.lineTo(right,bot); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font=axF+'px sans-serif'; ctx.textAlign='center';
      for(var c=0;c<=0.15+1e-9;c+=0.05) ctx.fillText(c.toFixed(2), X(c), bot+FS(H,0.028,13,18));
      ctx.textAlign='right';
      for(var p=0;p<=90;p+=30) ctx.fillText(p, left-6, Y(p)+4);
      ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('공기 중 납 (mg/m³) — 외부노출', (left+right)/2, bot+FS(H,0.055,26,36));
      ctx.save(); ctx.translate(left-FS(H,0.075,32,44), (top+bot)/2); ctx.rotate(-Math.PI/2);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('혈중 납 µg/dL — 내부용량', 0, 0); ctx.restore();
      // 노출-내부용량 직선
      ctx.strokeStyle=BLU; ctx.lineWidth=2.6; ctx.beginPath();
      ctx.moveTo(X(0),Y(base)); ctx.lineTo(X(Cmax),Y(base+slope*Cmax)); ctx.stroke();
      // BEI 기준선(가로) + TLV(세로)
      ctx.strokeStyle=AMB; ctx.lineWidth=1.6; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(left,Y(BEI)); ctx.lineTo(right,Y(BEI)); ctx.stroke();
      ctx.fillStyle=AMB; ctx.textAlign='left'; ctx.font='600 '+axF+'px sans-serif';
      ctx.fillText('BEI 30 µg/dL', left+6, Y(BEI)-6);
      ctx.strokeStyle='rgba(143,227,181,0.6)';
      ctx.beginPath(); ctx.moveTo(X(TLV),bot); ctx.lineTo(X(TLV),Y(BEI)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.textAlign='center'; ctx.fillText('TLV 0.05', X(TLV), bot-6);
      // 보정점(노출=TLV일 때 지표=BEI) 강조
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(X(TLV),Y(BEI),FS(H,0.009,3,5),0,6.29); ctx.fill();
      // 현재 점
      var px=X(C), py=Y(PbB);
      ctx.strokeStyle=over?RED:BLU; ctx.lineWidth=1.6; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(px,bot); ctx.lineTo(px,py); ctx.lineTo(left,py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=over?RED:GRN; ctx.beginPath(); ctx.arc(px,py,FS(H,0.012,5,8),0,6.29); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,FS(H,0.012,5,8),0,6.29); ctx.stroke();
      ctx.fillStyle=over?RED:GRN; ctx.font='600 '+FS(H,0.024,11,14)+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText(PbB.toFixed(1)+' µg/dL', px, py-FS(H,0.024,11,15));
      E.big('공기 중 납 '+C.toFixed(3)+' mg/m³ → 혈중 납(예측) '+PbB.toFixed(1)+' µg/dL',
        over? ('BEI 30 µg/dL 초과 — 이미 몸에 흡수·축적된 상태입니다')
            : ('공기측정=외부노출, 생물학적 모니터링=내부용량 — 피부흡수·개인차까지 반영해 서로 보완합니다')); }
  },

  // 7.5 발암성 분류와 관리 — 역치 없는 위험 (탭 단계 · HygDoc)
  { id:'hyg7_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], calc=[];
      // ① IARC 4구분
      boxes.push({x:0.03,y:0.33,w:0.225,h:0.11,c:RED,t:'Group 1',s:'인체 발암 확인'});
      boxes.push({x:0.275,y:0.33,w:0.225,h:0.11,c:ORA,t:'Group 2A',s:'추정(동물 충분)'});
      boxes.push({x:0.52,y:0.33,w:0.225,h:0.11,c:AMB,t:'Group 2B',s:'가능(제한적)'});
      boxes.push({x:0.765,y:0.33,w:0.205,h:0.11,c:BLU,t:'Group 3',s:'미분류'});
      if(st>=1){ boxes.push({x:0.03,y:0.475,w:0.94,h:0.095,c:GRN,t:'GHS·고용노동부 : 1A(사람 증거) · 1B(동물 증거→추정) · 2(의심)'}); }
      if(st>=2){ boxes.push({x:0.03,y:0.595,w:0.94,h:0.095,c:PNK,t:'ACGIH : A1 확정(석면·벤지딘·염화비닐·6가크롬) · A2 의심 · A3 동물 · A4 미분류 · A5 미의심'}); }
      if(st>=3){ boxes.push({x:0.03,y:0.715,w:0.94,h:0.095,c:RED,t:'A1 확정물질 TWA : 석면 0.1개/cm³ · 6가크롬(불용) 0.01 mg/m³ · 염화비닐 1 ppm'}); }
      if(st>=4){ boxes.push({x:0.03,y:0.835,w:0.94,h:0.105,c:GRN,t:'관리 — 역치가 없다 → ALARA',s:'대체·밀폐·국소배기로 노출 최소화 + 특수건강진단(발암성 6개월 주기)'});
        calc.push({k:'벤젠 노출기준',v:'TWA 1 ppm',c:AMB});
        calc.push({k:'발암성 특수건강진단',v:'6개월 주기',c:GRN}); }
      window.HygDoc(E,{ boxes:boxes, calc:calc,
        note: st>=4? '발암물질은 아무리 낮은 노출도 위험 0이 아니므로 "합리적으로 달성 가능한 최저(ALARA)"로 관리합니다' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['발암성은 증거의 무게로 등급을 매깁니다 — IARC','우리 법령은 GHS 체계로 1A·1B·2를 씁니다','ACGIH는 A1~A5로 실무 관리에 씁니다','대표 확정물질엔 별도의 노출기준이 있습니다','발암물질은 역치가 없어 최소화가 원칙입니다'][st];
      var sub=['IARC는 사람·동물 증거의 충분성에 따라 1(확인)·2A(추정)·2B(가능)·3(미분류)으로 나눕니다 — 벤젠·석면은 1군입니다. D키로 이어 보세요',
        'GHS와 고용노동부 고시는 1A(주로 사람 증거)·1B(주로 동물 증거로 추정)·2(의심)로 구분해 표지·관리합니다',
        'ACGIH는 A1(확정)부터 A5(미의심)까지 다섯 단계로 나눠 현장 노출관리와 연동합니다',
        '석면 0.1개/cm³, 6가크롬(불용성) 0.01 mg/m³, 염화비닐 1 ppm처럼 확정물질은 매우 낮은 노출기준을 둡니다',
        '역치가 없으므로 "허용선까지"가 아니라 대체·밀폐·국소배기로 최대한 낮추고, 발암성 물질은 6개월마다 특수건강진단을 실시합니다'][st];
      E.big(big, sub); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
