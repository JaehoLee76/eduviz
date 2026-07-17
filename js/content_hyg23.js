/* 산업위생기술사 제23장 — 논술 기출 은행 Ⅳ : 산업독성학 (동작만. 텍스트=content/hyg23.json)
   18~22장(논술은행)과 같은 철학 — 산업독성학 고빈출 논술주제를 "답안 골격(두문·본문 논점·결론)+도해"로 제시한다.
   ★7장(hyg7, 독성학 개론: 용량반응·ADME·표적장기·BEI·발암성분류)과 주제가 겹치므로 심화 관점으로 차별화한다 —
   7장은 "독이 몸에서 어떻게 움직이는가"를 서사(탭 애니메이션)로 가르쳤다면, 23장은 "논술 답안을 어떻게 쓰는가"를
   두문·논점·결론 골격 + 7장에 없던 심화 수치(NOAEL/LOAEL/TI, 반감기 잔류계산, 침적기전 4종, 석면 잠복기 실수치,
   GHS 경고표지 4요소)로 채운다.
   근거: _content/산업위생기술사/산업위생기술사_20251006.docx · 산업위생사하권_20251010.docx 원문 대조
         (생물학적모니터링 채취시기 3구분·반감기 예시(납 혈액 3주/뼈 10~20년,무기수은 6주,DMF 4시간)/
          입자 침적기전 4종(관성충돌·중력침강·확산·차단)과 입경별 침착부위/석면 잠복기(중피종 최소 30년·폐암
          최소 10년·조혈기계암 최소 1년)/GHS 경고표지 4요소(그림문자·신호어·H/P문구)) +
         /tmp/essay_topics.txt 고빈출표(생물학적모니터링200%·침적기전50%·석면해체조치40%+보건규칙495조50%·
         양-반응관계곡선30%·생물학적모니터링분류30%·BEI30%).
   7번째 장면(hyg23_07)은 서브노트(복원 요령) — 캔버스는 6대 토픽 골격 한 장, 학습패널(more)에 복원 순서·암기법.
   골든룰: hyg23_01(역치 시그모이드 vs LNT)·hyg23_03(반감기 잔류농도)·hyg23_04(Stokes 침강속도·침적기전 판정)는
           슬라이더 실계산. 나머지 4장면(02·05·06·07)도 탭 단계마다 표시되는 수치는 고정 상수로부터 draw에서
           직접 계산한다(hyg22 패턴과 동일 원칙 — 최종값 하드코딩 금지).
   겹침 방지: 슬라이더 장면은 hyg22_03/05/06과 동일하게 커스텀 캔버스+누적커서 ROW를 사용(검증된 무겹침 패턴).
             탭 장면은 HygDoc을 쓰되, hyg22_01/07이 저해상도(예: 1000×550)에서 sub 라벨↔box행, calc↔note가
             겹치는 것을 실측 확인했으므로, box를 더 아래(y≥0.30)에 배치하고 calc를 최대 2행·짧은 문장으로
             제한해 겹침 여지를 구조적으로 줄였다. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb', PUR='#c9a0f4';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다(hyg18~22 ROW 그대로 이식). 반환값=소비한 세로높이. */
  function ROW(ctx,W,H,x,y,w,rows){
    var labelFs=FS(H,0.021,9,12), valueFs=FS(H,0.026,11,14);
    var gap=FS(H,0.008,2,4), rowGap=FS(H,0.009,3,5);
    var blockH=labelFs+gap+valueFs, cy=y;
    for(var i=0;i<rows.length;i++){
      ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,x-8,cy-3,w,blockH+6,7); ctx.fill();
      T(ctx,rows[i][0],x,cy+labelFs,DIM,labelFs,'left');
      T(ctx,rows[i][1],x,cy+labelFs+gap+valueFs,rows[i][2],valueFs,'left','700');
      cy+=blockH+rowGap;
    }
    return cy-y-rowGap;
  }

  // ── 공통 고정 상수(실계산에 재사용, hyg23_07 서브노트에서도 동일 상수로 재계산) ──
  var LD50=50, DRK=3;                                  // 23.1: LD50=50mg/kg(고정예시), 시그모이드 기울기 k=3
  var U50=Math.log(LD50)/Math.LN10;                    // log10(50)≈1.69897
  function Rthr(d){ var u=Math.log(d)/Math.LN10; return 100/(1+Math.exp(-DRK*(u-U50))); }   // 역치형(시그모이드)
  function Rlnt(d){ return Math.min(100, 100*d/500); }                                       // 무역치(LNT 선형, 500mg/kg에서 100%)
  var NOAEL=Math.pow(10, U50-Math.log(99)/DRK);         // 반응≈1% 지점 — 검산: ≈1.47
  var LOAEL=Math.pow(10, U50-Math.log(19)/DRK);         // 반응≈5% 지점 — 검산: ≈5.22
  var ED50=10, TD50=80;                                 // 23.1: 치료지수 예시(고정) — TI=TD50÷ED50=8.0

  function residualPct(n){ return 100*Math.pow(0.5,n); }   // 23.3/23.7: C=C0×0.5^n (n=경과 반감기 배수)

  function depoMech(d){                                  // 23.4/23.7: 입경(㎛)→침적기전·부위 판정
    if(d>=5) return {m:'관성충돌(Impaction)', s:'비강·인후두(상기도)', c:ORA};
    if(d>=1) return {m:'중력침강(Sedimentation)', s:'기관·기관지(세기관지)', c:GRN};
    if(d>=0.5) return {m:'확산+침강 혼재', s:'세기관지~폐포 경계', c:BLU};
    return {m:'확산(Diffusion, 브라운운동)', s:'폐포(가스교환부위)', c:PNK};
  }
  function stokesV(d){                                    // Stokes 법칙 침강속도(단위밀도 구형입자 가정, ACGIH 공기역학경 정의와 동일 관례)
    var dm=d*1e-6, rho=1000, g=9.8, mu=1.81e-5;           // rho=1000kg/m³(단위밀도) · mu=공기점성 1.81e-5 Pa·s
    return rho*g*dm*dm/(18*mu)*100;                        // m/s→cm/s
  }

  var scenes=[

  /* ── 23.1 용량-반응 관계와 역치 (출제율 30% — 양-반응관계 곡선/NOAEL·NOEL·LOAEL 용어) ★골든룰 슬라이더 실계산 ──
     역치형(일반독성, 시그모이드) vs 무역치(발암·변이원, LNT 선형)를 같은 화면에서 대조하고,
     관리모드 토글로 어느 쪽 관리기준(TLV vs ALARA)이 적용되는지 강조한다. 7장(hyg7_01)과 달리 LOAEL·치료지수(TI)까지 포함. */
  { id:'hyg23_01',
    enter:function(E){ var self=this; this.s={logD:U50, mode:1};
      E.controls('<div class="ctrl"><label>투여 용량 D (mg/kg, 로그축)</label><input type="range" id="q1a" min="-1" max="3" step="0.02" value="'+U50+'"><output id="q1ao">50</output></div>'
        +'<div class="ctrl"><label>관리모드 (0=무역치·발암성 / 1=역치형·일반독성)</label><input type="range" id="q1b" min="0" max="1" step="1" value="1"><output id="q1bo">1</output></div>');
      E.bind('#q1a','input',function(e){ self.s.logD=+e.target.value; var d=Math.pow(10,+e.target.value);
        document.getElementById('q1ao').textContent=(d>=10? d.toFixed(0) : d.toFixed(2)); });
      E.bind('#q1b','input',function(e){ self.s.mode=+e.target.value; document.getElementById('q1bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var D=Math.pow(10,s.logD), mode=s.mode;
      var rt=Rthr(D), rl=Rlnt(D), TI=TD50/ED50;
      var top=H*0.20, bot=H*0.46, left=W*0.13, right=W*0.95, pw=right-left, ph=bot-top;
      function X(u){ return left+(u-(-1))/(3-(-1))*pw; }
      function Y(r){ return bot-(r/100)*ph; }
      var axF=FS(H,0.021,9,11);
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bot); ctx.lineTo(right,bot); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font=axF+'px sans-serif'; ctx.textAlign='center';
      var xt=[['-1','0.1'],['0','1'],['1','10'],['2','100'],['3','1000']];
      for(var i=0;i<xt.length;i++) T(ctx,xt[i][1],X(+xt[i][0]),bot+FS(H,0.026,11,15),DIM,axF,'center');
      ctx.textAlign='right';
      for(var r=0;r<=100;r+=50) T(ctx,r+'%',left-6,Y(r)+4,DIM,axF,'right');
      T(ctx,'용량 D (mg/kg, 로그축)',(left+right)/2,bot+FS(H,0.05,20,28),DIM,axF,'center');
      // 역치형(일반독성) 시그모이드 — mode=1일 때 굵게 강조
      ctx.strokeStyle=GRN; ctx.lineWidth=mode===1?3.0:1.6; ctx.beginPath();
      for(var j=0;j<=160;j++){ var u=-1+4*j/160, px=X(u), py=Y(Rthr(Math.pow(10,u))); if(j===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke();
      // 무역치(발암) LNT — mode=0일 때 굵게 강조
      ctx.strokeStyle=PNK; ctx.lineWidth=mode===0?3.0:1.6; ctx.setLineDash([6,4]); ctx.beginPath();
      for(var j2=0;j2<=160;j2++){ var u2=-1+4*j2/160, px2=X(u2), py2=Y(Rlnt(Math.pow(10,u2))); if(j2===0)ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2); }
      ctx.stroke(); ctx.setLineDash([]);
      // 현재 용량 세로선 + 두 곡선 위 점
      var cx=X(s.logD);
      ctx.strokeStyle=BLU; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(cx,top); ctx.lineTo(cx,bot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,Y(rt),FS(H,0.01,3,6),0,6.29); ctx.fill();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(cx,Y(rl),FS(H,0.01,3,6),0,6.29); ctx.fill();
      // 범례
      ctx.textAlign='left'; ctx.font=axF+'px sans-serif';
      T(ctx,'━ 역치형(일반독성)',right-pw*0.34,top+FS(H,0.026,11,15),GRN,axF,'left');
      T(ctx,'┅ 무역치(발암·변이원)',right-pw*0.34,top+FS(H,0.026,11,15)+FS(H,0.026,11,15),PNK,axF,'left');

      var y=bot+FS(H,0.04,12,18);
      var rows=[
        ['LD₅₀(반수치사량,고정예시) / NOAEL(≈1%반응)', LD50.toFixed(0)+'mg/kg / '+NOAEL.toFixed(2)+'mg/kg', AMB],
        ['LOAEL(≈5%반응) / TI=TD₅₀÷ED₅₀('+TD50+'÷'+ED50+')', LOAEL.toFixed(2)+'mg/kg / '+TI.toFixed(1)+'배', ORA]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.03,12,18);
      T(ctx,mode===1? '역치형(일반독성)은 NOAEL~LOAEL 사이에서 관리기준(TLV)을 설정할 수 있습니다.'
                     : '무역치(발암·변이원)는 안전한 용량이 없다고 가정(LNT)해 ALARA로 최대한 낮춥니다.',
        W*0.06,y,DIM,FS(H,0.018,9,11),'left');

      E.tapHint(0,0,'슬라이더로 용량·관리모드 조절',true);
      E.big('D='+(D>=10?D.toFixed(0):D.toFixed(2))+'mg/kg → 역치형 '+rt.toFixed(1)+'% · 무역치 '+rl.toFixed(2)+'%',
        '"용량이 독을 만든다"(파라켈수스) — 같은 원리라도 역치 유무에 따라 관리기준 설정 방식이 완전히 갈립니다'); }
  },

  /* ── 23.2 생물학적 모니터링·BEI (출제율 200% — 산업독성학 최고빈출) ──
     정의·환경측정과의 차이·ACGIH BEI·반감기 기반 채취시기(수시/당일/주말) 4단계. */
  { id:'hyg23_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 정의·환경측정과의 차이','② ACGIH BEI','③ 채취시기(반감기 기반)','④ 장점·한계'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'정의', v:'생체시료(혈액·소변·호기)에서 물질·대사산물·생물학적 변화를 측정해 내부용량을 평가', c:BLU},
          {k:'환경측정과의 차이', v:'환경측정=공기 중 농도(외부노출)만 / 생물학적모니터링=전 경로+개인차까지 반영', c:GRN}
        ];
        note='시험포인트: "왜 생물학적 모니터링이 환경측정을 보완하는가"— 흡입뿐 아니라 피부·경구 경로와 개인 행동습관까지 반영하기 때문입니다.';
      } else if(s.step===1){
        calc=[
          {k:'BEI(생물학적노출지수)', v:'ACGIH 제정 — 건강한 근로자가 TLV 수준 노출을 반복했을 때 넘지 않아야 할 지표', c:BLU},
          {k:'예시(납)', v:'혈중 납 BEI=30 µg/dL (TLV-TWA 0.05mg/m³에 대응)', c:AMB}
        ];
        note='시험포인트: BEI는 TLV(공기중 기준)와 짝을 이루는 "내부용량" 관리기준이라는 관계를 명시해야 합니다.';
      } else if(s.step===2){
        var half=21, targetPct=10, nHalf=Math.log(targetPct/100)/Math.log(0.5), days=nHalf*half;
        calc=[
          {k:'채취시기 3구분(원문대조)', v:'수시(아무때)·당일(작업종료 2h전~직후)·주말(4~5일 연속작업 후 목/금 종료시)', c:BLU},
          {k:'예: 납 혈액 반감기 '+half+'일 → 10%로 감소', v:nHalf.toFixed(2)+'반감기 × '+half+'일 = '+days.toFixed(0)+'일(약 '+(days/7).toFixed(1)+'주)', c:GRN}
        ];
        note='시험포인트: 반감기가 짧으면(수시간) 노출 직후, 길면(수주) 주말채취로 축적을 반영합니다 — 무기수은 6주·DMF 4시간이 대표 대조 사례.';
      } else {
        calc=[
          {k:'장점', v:'흡입+피부+경구 전 경로 통합 반영, 보호구 착용·개인 행동습관 차이까지 포착', c:GRN},
          {k:'한계', v:'혈액 등 침습적 채취, 생체 변동성이 큼, 물질별 지표·분석법이 없으면 적용 불가', c:RED}
        ];
        note='시험포인트: 환경측정과 생물학적모니터링은 "대체"가 아니라 "상호보완" 관계임을 결론에서 강조합니다.';
      }
      window.HygDoc(E,{
        title:'생물학적 모니터링과 BEI', sub:STAGES[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.03,y:0.32,w:0.44,h:0.15,c:hl(0,BLU),t:s.step===0?'①정의·차이':(s.step===1?'②ACGIH BEI':(s.step===2?'③채취시기':'④장점·한계'))},
          {x:0.53,y:0.32,w:0.44,h:0.15,c:hl(1,GRN),t:'내부용량 ↔ 외부노출'}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 23.3 체내 동태(ADME)·반감기 (기초 필수개념) ★골든룰 슬라이더 실계산 ──
     7장(hyg7_02)의 ADME 탭 여정과 달리, 반감기 슬라이더로 잔류농도 C=C0×0.5^n(n=경과 반감기 배수)을 실계산하고
     반감기 값에 따라 즉시배출형/단기축적형/장기(생체)축적형을 판정한다. */
  { id:'hyg23_03',
    enter:function(E){ var self=this; this.s={logT:1, n:2};
      E.controls('<div class="ctrl"><label>생물학적 반감기 T½ (시간, 로그축)</label><input type="range" id="q3a" min="-1" max="4.5" step="0.05" value="1"><output id="q3ao">10</output></div>'
        +'<div class="ctrl"><label>경과 배수 n (반감기 개수)</label><input type="range" id="q3b" min="0" max="6" step="0.1" value="2"><output id="q3bo">2.0</output></div>');
      E.bind('#q3a','input',function(e){ self.s.logT=+e.target.value; var TH=Math.pow(10,+e.target.value);
        document.getElementById('q3ao').textContent=(TH>=10? TH.toFixed(0):TH.toFixed(2)); });
      E.bind('#q3b','input',function(e){ self.s.n=+e.target.value; document.getElementById('q3bo').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var TH=Math.pow(10,s.logT), n=s.n;
      var pct=residualPct(n);
      var tElapsed=n*TH;                                                   // 경과 실제시간(시간)
      var cat, catColor;
      if(TH<1){ cat='즉시배출형(단시간 내 배출)'; catColor=GRN; }
      else if(TH<720){ cat='단기(주중)축적형(수일~수주 내 축적)'; catColor=AMB; }
      else { cat='장기(생체)축적형(수개월~수년 축적)'; catColor=RED; }
      var y=H*0.10;
      T(ctx,'체내 동태(ADME) — 흡수(호흡기>피부>경구)→분포(혈류·표적장기)→대사(간 1상 CYP450+2상 포합)→배설',W*0.05,y,DIM,FS(H,0.019,9,10.5),'left');
      y+=FS(H,0.032,10,15);
      T(ctx,'배설 속도를 나타내는 값이 생물학적 반감기(T½)이며, 반감기가 길수록 몸에 오래 남습니다',W*0.05,y,DIM,FS(H,0.019,9,10.5),'left');
      y+=FS(H,0.045,13,18);

      var barX=W*0.06, barMaxW=W*0.55, barH=FS(H,0.05,15,22);
      ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.fillRect(barX,y,barMaxW,barH);
      ctx.fillStyle=catColor==RED?'rgba(240,136,138,0.35)':(catColor==AMB?'rgba(242,189,85,0.35)':'rgba(143,227,181,0.35)');
      ctx.fillRect(barX,y,barMaxW*(pct/100),barH);
      ctx.strokeStyle=BLU; ctx.strokeRect(barX,y,barMaxW,barH);
      T(ctx,'잔류율 '+pct.toFixed(1)+'%',barX+8,y+barH*0.68,TXT,FS(H,0.022,10,13),'left','700');
      y+=barH+FS(H,0.045,14,20);

      var rows=[
        ['반감기 T½', TH.toFixed(2)+'시간 ('+(TH/24).toFixed(2)+'일, '+(TH/8760).toFixed(3)+'년)', BLU],
        ['잔류농도 C=C₀×0.5ⁿ (n='+n.toFixed(1)+')', '100×0.5^'+n.toFixed(1)+' = '+pct.toFixed(1)+'%', ORA],
        ['경과 실제시간 t=n×T½', tElapsed.toFixed(1)+'시간 ('+(tElapsed/24).toFixed(1)+'일)', GRN],
        ['분류 판정', cat, catColor]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.03,10,16);
      T(ctx,'예: 납(혈액) 반감기 약 21일·무기수은 약 6주(단기축적형) / 카드뮴·납(골격) 수십년(장기축적형) / DMF 약 4시간(즉시배출형)',
        W*0.06,y,DIM,FS(H,0.018,9,10.5),'left');

      E.tapHint(0,0,'슬라이더로 반감기·경과배수 조절',true);
      E.big('T½ '+TH.toFixed(1)+'h, n='+n.toFixed(1)+' → 잔류율 '+pct.toFixed(1)+'% ('+cat+')',
        '반감기가 채취시기(수시·당일·주말)를 결정하고, 반감기가 수년이면 축적물질로서 특수건강진단·모니터링 주기가 달라집니다'); }
  },

  /* ── 23.4 입자상 물질 호흡기 침적 기전 (출제율 50% — 산업독성학 2번째 고빈출) ★골든룰 슬라이더 실계산 ──
     입경 슬라이더 → Stokes 법칙으로 침강속도를 실계산하고, 입경별 지배기전(관성충돌/중력침강/확산)·침적부위를 판정. */
  { id:'hyg23_04',
    enter:function(E){ var self=this; this.s={logD:0};
      E.controls('<div class="ctrl"><label>입자 직경 d (㎛, 로그축)</label><input type="range" id="q4a" min="-1.3" max="1.5" step="0.02" value="0"><output id="q4ao">1.0</output></div>');
      E.bind('#q4a','input',function(e){ self.s.logD=+e.target.value; var d=Math.pow(10,+e.target.value);
        document.getElementById('q4ao').textContent=d.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var d=Math.pow(10,s.logD);
      var dep=depoMech(d);
      var v=stokesV(d);
      var diffDominant=v<=0.001;
      var y=H*0.10;
      T(ctx,'입경이 클수록 관성으로 충돌하고, 작을수록 브라운 운동(확산)으로 침적됩니다 — 그 경계를 슬라이더로 확인하세요',
        W*0.05,y,DIM,FS(H,0.02,9,11),'left');
      y+=FS(H,0.045,13,18);

      // 입경 스케일 바(0.1~30㎛, 로그) + 현재 위치 마커 + 4구간 색칠
      var barX=W*0.06, barW=W*0.88, barY=y, barH=FS(H,0.055,18,26);
      var lo=-1, hi=1.5;
      function bx(logv){ return barX+(logv-lo)/(hi-lo)*barW; }
      var zones=[[lo,Math.log(0.5)/Math.LN10,PNK],[Math.log(0.5)/Math.LN10,0,BLU],[0,Math.log(5)/Math.LN10,GRN],[Math.log(5)/Math.LN10,hi,ORA]];
      for(var zi=0;zi<zones.length;zi++){ var z=zones[zi], x0=bx(z[0]), x1=bx(z[1]);
        ctx.fillStyle=z[2]; ctx.globalAlpha=0.30; ctx.fillRect(x0,barY,x1-x0,barH); ctx.globalAlpha=1; }
      ctx.strokeStyle='rgba(223,238,251,0.4)'; ctx.strokeRect(barX,barY,barW,barH);
      var mx=bx(s.logD);
      ctx.strokeStyle=TXT; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(mx,barY-6); ctx.lineTo(mx,barY+barH+6); ctx.stroke();
      var lblF=FS(H,0.017,9,10);
      T(ctx,'0.5㎛',bx(Math.log(0.5)/Math.LN10),barY+barH+FS(H,0.024,11,14),DIM,lblF,'center');
      T(ctx,'1㎛',bx(0),barY+barH+FS(H,0.024,11,14),DIM,lblF,'center');
      T(ctx,'5㎛',bx(Math.log(5)/Math.LN10),barY+barH+FS(H,0.024,11,14),DIM,lblF,'center');
      T(ctx,'확산',bx((lo+Math.log(0.5)/Math.LN10)/2),barY+barH*0.62,'#2a1f1f',FS(H,0.02,9,11),'center','700');
      T(ctx,'침강',bx(Math.log(0.5)/Math.LN10/2),barY+barH*0.62,'#1a2530',FS(H,0.02,9,11),'center','700');
      T(ctx,'충돌',bx((Math.log(5)/Math.LN10+hi)/2),barY+barH*0.62,'#2a2010',FS(H,0.02,9,11),'center','700');
      y=barY+barH+FS(H,0.075,26,34);

      var rows=[
        ['입경 d', d.toFixed(2)+'㎛', BLU],
        ['지배 기전', dep.m, dep.c],
        ['주요 침적부위', dep.s, dep.c],
        ['Stokes 침강속도 v (단위밀도 구형 가정)', v.toFixed(5)+' cm/s → '+(diffDominant?'0.001cm/s 이하(확산 지배)':'0.001cm/s 초과(침강·충돌 지배)'), diffDominant?PNK:GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.03,10,16);
      T(ctx,'차단(Interception)은 길고 가는 섬유(석면)가 기도 표면에 스치며 침착하는 별도 기전으로, 입경과 무관하게 작용합니다. 호흡성분진 절단직경은 약 4㎛(ACGIH).',
        W*0.06,y,DIM,FS(H,0.018,9,10.5),'left');

      E.tapHint(0,0,'슬라이더로 입경 조절',true);
      E.big('d='+d.toFixed(2)+'㎛ → '+dep.m,
        dep.s+'에 주로 침적됩니다 — 입경-기전-부위를 한 세트로 묶어 외우는 것이 이 주제의 핵심입니다'); }
  },

  /* ── 23.5 직업성 폐질환·발암 (석면 40%+보건규칙495조 50%) ──
     진폐(규폐증·석면폐)·석면 관련 암(중피종·폐암)·발암성 분류(요약)·업무관련성 판정 5단계. */
  { id:'hyg23_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 진폐(규폐증·석면폐)','② 석면 관련 암','③ 발암성 분류(요약)','④ 업무관련성 판정'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'규폐증(Silicosis)', v:'결정형 유리규산(석영·이산화규소) 장기흡입 → 폐 섬유화, 대식세포가 용해 못함', c:BLU},
          {k:'석면폐(Asbestosis)', v:'석면섬유가 대식세포에 용해되지 않고 폐에 남아 섬유화(진폐)를 유발', c:GRN}
        ];
        note='시험포인트: 진폐는 "섬유화"이지 암이 아닙니다 — 유리규산·석면 모두 대식세포 저항성이 공통 원인입니다.';
      } else if(s.step===1){
        calc=[
          {k:'중피종(원문대조 잠복기)', v:'흉막·복막 악성종양, 고형암 최소 잠복기 약 30년', c:RED},
          {k:'석면 폐암·석면 위험도', v:'최소 잠복기 약 10년 / 위험도: 청석면>갈석면>백석면', c:ORA}
        ];
        note='시험포인트: 잠복기가 수십년으로 매우 길어 노출 당시엔 증상이 없다는 점이 관리를 어렵게 만드는 핵심 이유입니다.';
      } else if(s.step===2){
        calc=[
          {k:'IARC', v:'Group1(확인)·2A(추정)·2B(가능)·3(미분류) — 석면·벤젠은 Group1', c:BLU},
          {k:'GHS(국내 고시)', v:'1A(사람증거)·1B(동물증거→추정)·2(의심) — 세부는 7장 참조', c:GRN}
        ];
        note='분류체계 자체의 상세(ACGIH A1~A5 등)는 7장에서 다뤘으므로, 여기서는 "석면이 어느 등급인가"에 집중합니다.';
      } else {
        calc=[
          {k:'판정 5단계(원문대조)', v:'①암확진→②노출확인→③잠복기조사→④노출량조사→⑤관련성평가', c:BLU},
          {k:'잠복기 기준', v:'고형암(중피종)≥30년·폐암≥10년·조혈기계암≥1년', c:AMB}
        ];
        note='시험포인트: "충분한 잠복기가 지났는가"가 업무상 질병 인정의 핵심 요건 중 하나입니다.';
      }
      window.HygDoc(E,{
        title:'직업성 폐질환과 발암', sub:STAGES[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.03,y:0.32,w:0.44,h:0.15,c:hl(0,BLU),t:s.step===0?'①진폐':(s.step===1?'②석면발암':(s.step===2?'③분류체계':'④판정단계'))},
          {x:0.53,y:0.32,w:0.44,h:0.15,c:hl(1,RED),t:'긴 잠복기 → 조기발견 어려움'}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 23.6 GHS 분류·표시 + 직업성 질환의 특성 ──
     경고표지 4요소(그림문자·신호어·H/P문구)와, 왜 직업병 인정이 어려운가(긴잠복기·비특이성·다요인성). */
  { id:'hyg23_06',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s;
      var STAGES=['① GHS 목적·유해성 축','② 경고표지 4요소','③ 직업성 질환의 특성'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'GHS 목적', v:'화학물질 분류·표시체계를 세계적으로 통일해 안전정보 전달을 일관화', c:BLU},
          {k:'3대 유해성 축', v:'물리적 유해성(폭발·인화)·건강 유해성(급성독성·발암성 등)·환경 유해성', c:GRN}
        ];
        note='시험포인트: GHS는 "새 유해성 개념"이 아니라 기존 각국 표시체계를 통일한 국제조화 시스템입니다.';
      } else if(s.step===1){
        calc=[
          {k:'그림문자·신호어', v:'검은그림+빨간테두리+흰바탕 (5개↑시 4개까지만) · 신호어=위험/경고(중복시 위험만)', c:ORA},
          {k:'H/P 문구', v:'유해위험문구(H)·예방조치문구(P) — 분류결과에 따라 결정', c:PNK}
        ];
        note='시험포인트: 4요소(그림문자·신호어·H문구·P문구)를 빠짐없이 나열하는 것이 채점 포인트입니다.';
      } else {
        calc=[
          {k:'긴 잠복기·비특이적 증상', v:'노출~발병 수년~수십년, 초기엔 일반질환과 구별 어려움', c:RED},
          {k:'다요인성', v:'작업요인 외 흡연·개인감수성 등 복합작용 → 업무관련성 입증이 어려움(예: 금속열)', c:AMB}
        ];
        note='시험포인트: "왜 직업병 인정이 어려운가"를 잠복기+비특이성+다요인 3가지로 구조화해 서술하면 고득점입니다.';
      }
      window.HygDoc(E,{
        title:'GHS 분류·표시와 직업성 질환의 특성', sub:STAGES[s.step]+'  ('+(s.step+1)+'/3)',
        boxes:[
          {x:0.03,y:0.32,w:0.44,h:0.15,c:hl(0,BLU),t:s.step===0?'①목적·유해성축':(s.step===1?'②경고표지4요소':'③직업병 특성')},
          {x:0.53,y:0.32,w:0.44,h:0.15,c:hl(1,PNK),t:'사전예방 ↔ 사후판정'}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── ★23.7 서브노트 — 산업독성학 한 장 복원 (탭으로 6대 토픽 3쌍을 순회, 캔버스=전체 골격 항상 표시) ──
     학습패널(more)에 "복원 요령"(공통주제·암기법·핵심개념 왜·복원 순서)을 담는다(JSON). 골든룰: 각 페이지 수치는
     앞선 6개 장면과 동일한 고정 상수로부터 이 장면에서도 다시 실계산한다. */
  { id:'hyg23_07',
    enter:function(E){ this.s={page:0}; E.setOn([]); },
    tap:function(E){ this.s.page=(this.s.page+1)%3; },
    draw:function(E){ var s=this.s;
      var PAGES=['① 용량반응·역치 / BEI·생물학적모니터링','② ADME·반감기 / 침적기전','③ 폐질환·발암 / GHS'];
      var pairs=[[0,1],[2,3],[4,5]];
      var cur=pairs[s.page];
      var hl=function(i,base){ return (i===cur[0]||i===cur[1])? ORA : base; };
      var calc, note;
      if(s.page===0){
        var TI=TD50/ED50;
        calc=[
          {k:'①LD₅₀·NOAEL·LOAEL', v:'LD₅₀='+LD50+' · NOAEL≈'+NOAEL.toFixed(1)+' · LOAEL≈'+LOAEL.toFixed(1)+' · TI='+TI.toFixed(1)+'배', c:GRN},
          {k:'②BEI', v:'ACGIH 제정, 예)납 혈중 30µg/dL · 채취시기=수시/당일/주말(반감기 기반)', c:BLU}
        ];
        note='복원 순서 1~2단계: 용량이 독을 만든다(역치 유무)→그 결과를 몸에서 확인(BEI) 순서로 먼저 뼈대를 그립니다.';
      } else if(s.page===1){
        var n=2, pct=residualPct(n);
        var dep=depoMech(1.0);
        calc=[
          {k:'③반감기(ADME 배설)', v:'C=C₀×0.5ⁿ, n='+n+' → '+pct.toFixed(1)+'% · 즉시배출/단기축적/장기축적 3분류', c:ORA},
          {k:'④침적기전 4종', v:'관성충돌(≥5㎛,상기도)·중력침강(1~5㎛,기관지)·확산(<0.5㎛,폐포)·차단(섬유)', c:PNK}
        ];
        note='복원 순서 3~4단계: 몸에 들어온 독이 "얼마나 남는가"(반감기)와 "어디에 쌓이는가"(입경별 침적)를 잇습니다.';
      } else {
        calc=[
          {k:'⑤폐질환·발암 잠복기', v:'중피종≥30년·폐암≥10년·조혈기계암≥1년 · 판정 5단계(확진→노출→잠복기→노출량→관련성)', c:RED},
          {k:'⑥GHS 4요소', v:'그림문자·신호어(위험/경고)·H문구·P문구', c:AMB}
        ];
        note='복원 순서 5~6단계: 그 결과가 "어떤 병"으로 나타나는가(폐질환·발암)와, "미리 알리는 장치"(GHS)로 마무리합니다.';
      }
      window.HygDoc(E,{
        title:'산업독성학 한 장 복원 — 23장 전체 골격', sub:PAGES[s.page]+'  ('+(s.page+1)+'/3)',
        boxes:[
          {x:0.02,y:0.27,w:0.30,h:0.14,c:hl(0,GRN),t:'①용량반응·역치'},
          {x:0.35,y:0.27,w:0.30,h:0.14,c:hl(1,BLU),t:'②BEI·생물학적모니터링'},
          {x:0.68,y:0.27,w:0.30,h:0.14,c:hl(2,PUR),t:'③반감기'},
          {x:0.02,y:0.45,w:0.30,h:0.14,c:hl(3,PNK),t:'④침적기전'},
          {x:0.35,y:0.45,w:0.30,h:0.14,c:hl(4,RED),t:'⑤폐질환·발암'},
          {x:0.68,y:0.45,w:0.30,h:0.14,c:hl(5,AMB),t:'⑥GHS'}
        ],
        arrows:[
          {x1:0.325,y1:0.34,x2:0.348,y2:0.34},
          {x1:0.655,y1:0.34,x2:0.678,y2:0.34},
          {x1:0.325,y1:0.52,x2:0.348,y2:0.52},
          {x1:0.655,y1:0.52,x2:0.678,y2:0.52}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 쌍(복원 요령은 아래 "더 알아보기")',true);
    }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
