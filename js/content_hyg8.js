/* 산업위생관리기술사 제8장 — 법규와 관리 체계(제도를 아는 것도 실력). 동작만. 텍스트=content/hyg8.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 글자 크기 = H 비례 + 클램프(낮은 뷰포트에서 겹침·잘림 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn, Math.min(mx, H*frac)); }

  var scenes=[

  // 8.1 산업안전보건법 체계 — 법·시행령·시행규칙·고시 (탭 단계 · 위계 피라미드)
  { id:'hyg8_01',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      // 위계 피라미드: 위는 좁고(법) 아래로 넓어짐(고시) — 상위일수록 상위 법원(法源)
      var tiers=[
        {c:BLU, t:'법률 (국회 제정)',       d:'목적·기본원칙·사업주 의무 — 산업안전보건법'},
        {c:GRN, t:'시행령 (대통령령)',       d:'적용범위·대상 사업·관리체계 — 관리감독자·안전보건관리자'},
        {c:AMB, t:'시행규칙 (고용노동부령)', d:'절차·방법 — 작업환경측정 주기·특수건강진단·MSDS'},
        {c:ORA, t:'고시·예규 (고용노동부장관)', d:'세부 기술기준 — 노출기준 고시·측정 및 분석방법 고시'}
      ];
      var top=H*0.325, tierH=H*0.115, gap=H*0.128;
      var axF=FS(H,0.024,12,14), dF=FS(H,0.020,11,14);
      for(var i=0;i<tiers.length && i<=st;i++){ var T=tiers[i];
        var wFrac=0.34+i*0.14, w=W*wFrac, x=(W-w)/2, y=top+i*gap;
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=T.c; ctx.lineWidth=1.8;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,tierH,9); } else { ctx.beginPath(); ctx.rect(x,y,w,tierH); }
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillStyle=T.c; ctx.font='600 '+axF+'px sans-serif';
        ctx.fillText(T.t, W/2, y+tierH*0.42);
        ctx.fillStyle=DIM; ctx.font=dF+'px sans-serif';
        ctx.fillText(T.d, W/2, y+tierH*0.78);
        // 상위→하위 연결(구체화) 화살표
        if(i>0){ ctx.strokeStyle='rgba(223,238,251,0.4)'; ctx.lineWidth=1.6;
          var ay=y-gap+tierH, ay2=y;
          ctx.beginPath(); ctx.moveTo(W/2, ay); ctx.lineTo(W/2, ay2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(W/2, ay2); ctx.lineTo(W/2-5, ay2-7); ctx.lineTo(W/2+5, ay2-7); ctx.fillStyle='rgba(223,238,251,0.4)'; ctx.fill(); }
      }
      if(st>=4){ ctx.fillStyle=DIM; ctx.font=FS(H,0.020,11,14)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('논술 답안은 "산업안전보건법 제○조 → 시행규칙 제○조 → 고시"로 근거 조문을 인용할수록 설득력이 커집니다', W/2, H*0.955); }
      E.tapHint(0,0,'다음 층',true);
      var big=['맨 위엔 국회가 만든 법률이 있습니다','법이 위임한 것을 대통령령(시행령)이 받습니다','구체적 절차·방법은 고용노동부령(시행규칙)이 정합니다','가장 세부적인 기술기준은 고시·예규가 정합니다','근거 조문을 인용하는 것이 논술의 힘입니다'][st];
      var sub=['산업안전보건법은 목적·기본원칙과 사업주·근로자의 의무를 정합니다 — 모든 하위 규정의 뿌리입니다. D키로 아래로 내려가 보세요',
        '시행령(대통령령)은 법의 적용범위와 대상 사업, 안전보건관리체계(관리감독자·안전보건관리자 선임)를 정합니다',
        '시행규칙(고용노동부령)은 실무 절차를 정합니다 — 작업환경측정 주기, 특수건강진단, MSDS 작성·비치가 여기에 있습니다',
        '노출기준 수치, 측정·분석방법 같은 세부 기술기준은 고용노동부장관 고시·예규가 정합니다 — 자주 개정되는 층입니다',
        '위계를 알면 "이 규정의 근거가 어디 있나"를 짚을 수 있습니다 — 조문 인용이 정확할수록 답안과 면접의 설득력이 올라갑니다'][st];
      E.big(big, sub); }
  },

  // 8.2 작업환경측정 제도 — 주기 타임라인 (슬라이더 · 커스텀 캔버스)
  { id:'hyg8_02',
    enter:function(E){ var self=this; this.s={el:7};
      E.controls('<div class="ctrl"><label>전회 측정 이후 경과 개월</label><input type="range" id="el" min="0" max="24" step="1" value="7"><output id="elo">7</output></div>');
      E.bind('#el','input',function(e){ self.s.el=+e.target.value; document.getElementById('elo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var e=s.el, Mmax=24;
      var regimes=[
        {p:3,  c:RED, name:'발암성 물질 등'},
        {p:6,  c:AMB, name:'정기 측정'},
        {p:12, c:GRN, name:'2회 연속 기준미만'}
      ];
      var left=W*0.33, right=W*0.95, tw=right-left, top=H*0.335, rowGap=H*0.085;
      function X(m){ return left+m/Mmax*tw; }
      var axF=FS(H,0.021,11,14), nmF=FS(H,0.022,12,15), lbF=FS(H,0.021,11,14);
      // 월 눈금 축(맨 아래 행 밑)
      var axisY=top+2*rowGap+rowGap*0.6;
      ctx.strokeStyle='rgba(219,238,251,0.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(left,axisY); ctx.lineTo(right,axisY); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font=axF+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      for(var m=0;m<=Mmax;m+=6){ ctx.fillText(m+'월', X(m), axisY+FS(H,0.028,13,17)); }
      // 현재 경과 세로선(3개 행 관통)
      var cx=X(e);
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(cx, top-rowGap*0.5); ctx.lineTo(cx, axisY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.font='600 '+axF+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('현재 '+e+'월', cx, top-rowGap*0.7);
      // 각 주기 행: 눈금(측정 예정일) + 다음 측정까지 남은 개월 실계산
      var nextInfo=[];
      for(var i=0;i<regimes.length;i++){ var R=regimes[i], p=R.p, ry=top+i*rowGap;
        ctx.strokeStyle='rgba(219,238,251,0.18)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(left,ry); ctx.lineTo(right,ry); ctx.stroke();
        // 라벨(왼쪽)
        ctx.fillStyle=R.c; ctx.font='600 '+lbF+'px sans-serif'; ctx.textAlign='right';
        ctx.fillText(R.name, left-W*0.015, ry+lbF*0.35);
        ctx.fillStyle=DIM; ctx.font=FS(H,0.018,10,13)+'px sans-serif';
        ctx.fillText(p+'개월 주기', left-W*0.015, ry+lbF*0.35+FS(H,0.026,12,15));
        // 측정 예정 눈금
        var rem = (e % p === 0) ? 0 : p - (e % p);
        var nextM = e + rem;
        nextInfo.push({R:R, rem:rem, nextM:nextM});
        for(var mk=0;mk<=Mmax;mk+=p){
          var due = (mk===nextM);
          ctx.fillStyle= (mk<=e)? 'rgba(155,153,163,0.55)' : R.c;
          var rad = due? FS(H,0.012,7,10) : FS(H,0.008,5,7);
          ctx.beginPath(); ctx.arc(X(mk), ry, rad, 0, 6.29); ctx.fill();
          if(due){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(X(mk),ry,rad,0,6.29); ctx.stroke(); }
        }
      }
      // 절차 스트립: 측정 → 분석 → 보고(30일 이내) → 기록보존(5년/발암 30년)
      var flow=[
        {c:BLU, t:'측정',   s:'시료 채취'},
        {c:GRN, t:'분석',   s:'지정측정기관'},
        {c:AMB, t:'보고',   s:'완료일부터 30일 이내'},
        {c:PNK, t:'기록보존', s:'5년 · 발암성 30년'}
      ];
      var fy=H*0.70, fh=H*0.115, fn=flow.length, fgap=W*0.025, fw=(W*0.90-(fn-1)*fgap)/fn, fx0=W*0.05;
      var ftF=FS(H,0.024,12,14), fsF=FS(H,0.019,10,14);
      for(var k=0;k<fn;k++){ var F=flow[k], fx=fx0+k*(fw+fgap);
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=F.c; ctx.lineWidth=1.6;
        if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(fx,fy,fw,fh,8); } else { ctx.beginPath(); ctx.rect(fx,fy,fw,fh); }
        ctx.fill(); ctx.stroke();
        ctx.textAlign='center'; ctx.fillStyle=F.c; ctx.font='600 '+ftF+'px sans-serif';
        ctx.fillText(F.t, fx+fw/2, fy+fh*0.42);
        ctx.fillStyle=DIM; ctx.font=fsF+'px sans-serif';
        ctx.fillText(F.s, fx+fw/2, fy+fh*0.78);
        if(k<fn-1){ ctx.strokeStyle='rgba(223,238,251,0.5)'; ctx.lineWidth=1.8;
          var mx=fx+fw+fgap*0.5, my=fy+fh/2;
          ctx.beginPath(); ctx.moveTo(fx+fw+3,my); ctx.lineTo(fx+fw+fgap-3,my); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx+fw+fgap-3,my); ctx.lineTo(fx+fw+fgap-9,my-5); ctx.lineTo(fx+fw+fgap-9,my+5); ctx.fillStyle='rgba(223,238,251,0.5)'; ctx.fill(); }
      }
      var reg = nextInfo[1]; // 정기(6개월)
      var remTxt = reg.rem===0? '측정일 도래' : (reg.rem+'개월 후(' + reg.nextM + '월째)');
      E.big('경과 '+e+'개월 → 정기(6개월) 다음 측정: '+remTxt,
        '발암성 물질은 3개월마다, 정기는 6개월마다, 2회 연속 노출기준 미만이면 1년마다 측정합니다 — 측정 완료일부터 30일 이내 보고, 기록은 5년(발암성 30년) 보존합니다'); }
  },

  // 8.3 특수건강진단 — 몸으로 확인하는 관리 (탭 단계 · HygDoc)
  { id:'hyg8_03',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], arrows=[], calc=[];
      // 두 축 라벨(상단)
      boxes.push({x:0.03,y:0.325,w:0.44,h:0.075,c:BLU,t:'작업환경측정 = 환경(공기)'});
      boxes.push({x:0.53,y:0.325,w:0.44,h:0.075,c:PNK,t:'건강진단 = 인체(몸)'});
      // 건강진단 흐름(오른쪽 축)
      boxes.push({x:0.53,y:0.425,w:0.44,h:0.085,c:GRN,t:'① 배치전건강진단',s:'배치 전 기초자료·업무 적합성'});
      if(st>=1){ boxes.push({x:0.53,y:0.525,w:0.44,h:0.085,c:AMB,t:'② 정기 특수건강진단',s:'유해인자별 6·12·24개월 주기'});
        arrows.push({x1:0.75,y1:0.510,x2:0.75,y2:0.525,c:'rgba(223,238,251,0.5)'}); }
      if(st>=2){ boxes.push({x:0.53,y:0.625,w:0.44,h:0.085,c:ORA,t:'③ 수시건강진단',s:'증상 호소 시 수시 실시'});
        arrows.push({x1:0.75,y1:0.610,x2:0.75,y2:0.625,c:'rgba(223,238,251,0.5)'}); }
      if(st>=3){ boxes.push({x:0.53,y:0.725,w:0.44,h:0.085,c:RED,t:'④ 임시건강진단',s:'집단 발생·지방관서장 명령'});
        arrows.push({x1:0.75,y1:0.710,x2:0.75,y2:0.725,c:'rgba(223,238,251,0.5)'}); }
      // 환경 축(왼쪽)
      if(st>=1){ boxes.push({x:0.03,y:0.525,w:0.44,h:0.185,c:BLU,t:'작업환경측정',s:'유해인자 공기농도 → 노출기준 비교'}); }
      // 사후관리(하단)
      if(st>=4){ boxes.push({x:0.03,y:0.82,w:0.44,h:0.12,c:GRN,t:'건강관리구분',s:'A 정상 · C1 직업병 요관찰 · C2 일반질병 요관찰 · D1 직업병 유소견'});
        boxes.push({x:0.53,y:0.82,w:0.44,h:0.12,c:PNK,t:'사후관리',s:'작업전환·근로시간 단축·근무제한·추적검사'});
        arrows.push({x1:0.50,y1:0.71,x2:0.50,y2:0.60,c:'rgba(223,238,251,0.35)',dash:true});
        calc.push({k:'배치 후 첫 진단(예: 벤젠)',v:'6개월 이내',c:AMB});
        calc.push({k:'유소견자',v:'D1(직업병)·D2(일반)',c:RED}); }
      window.HygDoc(E,{ boxes:boxes, arrows:arrows, calc:calc,
        note: st>=4? '환경(작업환경측정)과 인체(건강진단)를 함께 봐야 예방이 완성됩니다' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['일하기 전에 몸의 출발점을 기록합니다','유해인자별로 정해진 주기로 다시 봅니다','이상이 느껴지면 즉시 수시로 확인합니다','집단으로 발생하면 임시로 전면 확인합니다','결과를 구분하고 몸을 지키는 조치를 합니다'][st];
      var sub=['배치전건강진단은 유해업무 배치 전에 기초 건강자료를 확보하고 업무 적합성을 판단합니다 — 훗날 인과 판단의 기준선입니다. D키로 이어 보세요',
        '정기 특수건강진단은 유해인자별로 6·12·24개월 주기로 실시합니다(배치 후 첫 진단 시기는 물질별로 규정). 같은 시기에 작업환경측정으로 공기도 봅니다',
        '수시건강진단은 근로자가 관련 증상을 호소하거나 의사가 필요하다고 판단할 때 정기 주기와 무관하게 실시합니다',
        '임시건강진단은 같은 부서에서 직업병 유소견자·의심자가 집단 발생하는 등의 경우, 지방고용노동관서장의 명령으로 실시합니다',
        '결과는 A(정상)·C1(직업병 요관찰)·C2(일반질병 요관찰)·D1(직업병 유소견)으로 구분하고, 유소견자에겐 작업전환·근로시간 단축 등 사후관리를 합니다 — 환경과 인체, 두 축이 함께 갑니다'][st];
      E.big(big, sub); }
  },

  // 8.4 위험성평가 — 가능성 × 중대성 (슬라이더 2개 · 5×5 매트릭스)
  { id:'hyg8_04',
    enter:function(E){ var self=this; this.s={P:3, S:3};
      E.controls('<div class="ctrl"><label>발생가능성 P (1~5)</label><input type="range" id="pp" min="1" max="5" step="1" value="3"><output id="ppo">3</output></div>'+
                 '<div class="ctrl"><label>중대성 S (1~5)</label><input type="range" id="ss" min="1" max="5" step="1" value="3"><output id="sso">3</output></div>');
      E.bind('#pp','input',function(e){ self.s.P=+e.target.value; document.getElementById('ppo').textContent=e.target.value; });
      E.bind('#ss','input',function(e){ self.s.S=+e.target.value; document.getElementById('sso').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var P=s.P, Sv=s.S, R=P*Sv;                       // 위험성 = 가능성 × 중대성 (곱셈법, 실계산)
      function band(r){ return r<=4?0 : (r<=12?1:2); }  // 저(≤4)·중(5~12)·고(≥15) 3단계
      var bcol=['rgba(143,227,181,0.55)','rgba(242,189,85,0.55)','rgba(240,136,138,0.6)'];
      var bname=['낮음 (허용 가능)','보통 (개선 필요)','높음 (즉시 개선·허용 불가)'];
      var n=5, gsz=Math.min(W*0.50, H*0.50), cell=gsz/n;
      var gx0=W*0.52-gsz/2+W*0.06, gy0=H*0.32;
      var numF=FS(H,0.024,12,15), axF=FS(H,0.022,11,15), lbF=FS(H,0.023,12,14);
      ctx.textBaseline='alphabetic';
      for(var r=0;r<n;r++){ for(var c=0;c<n;c++){
        var Sc=c+1, Pc=n-r, Rc=Sc*Pc, bd=band(Rc);
        var x=gx0+c*cell, y=gy0+r*cell;
        ctx.fillStyle=bcol[bd]; ctx.fillRect(x,y,cell-2,cell-2);
        // 현재 셀 강조
        if(Sc===Sv && Pc===P){ ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.strokeRect(x+1,y+1,cell-4,cell-4); }
        ctx.fillStyle='rgba(20,24,33,0.85)'; ctx.font='600 '+numF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText(Rc, x+cell/2, y+cell/2+numF*0.35);
      }}
      // 축 라벨
      ctx.fillStyle=DIM; ctx.font=axF+'px sans-serif'; ctx.textAlign='center';
      for(var c2=0;c2<n;c2++) ctx.fillText((c2+1), gx0+c2*cell+cell/2, gy0+gsz+FS(H,0.028,13,18));
      ctx.fillText('중대성 S →', gx0+gsz/2, gy0+gsz+FS(H,0.055,26,36));
      ctx.textAlign='right';
      for(var r2=0;r2<n;r2++) ctx.fillText((n-r2), gx0-6, gy0+r2*cell+cell/2+4);
      ctx.save(); ctx.translate(gx0-FS(H,0.055,26,38), gy0+gsz/2); ctx.rotate(-Math.PI/2);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('발생가능성 P →', 0, 0); ctx.restore();
      // 범례(왼쪽 세로)
      var lx=W*0.045, ly=gy0+FS(H,0.02,12,14);
      ctx.textAlign='left'; ctx.font=FS(H,0.021,11,14)+'px sans-serif';
      for(var b=0;b<3;b++){ var yy=ly+b*FS(H,0.052,24,34);
        ctx.fillStyle=bcol[b]; ctx.fillRect(lx, yy-FS(H,0.018,10,13), FS(H,0.026,12,16), FS(H,0.026,12,16));
        ctx.fillStyle=TXT; ctx.fillText(bname[b], lx+FS(H,0.034,16,22), yy); }
      var bd=band(R);
      E.big('위험성 = P '+P+' × S '+Sv+' = '+R+'  →  '+bname[bd],
        bd===2? '허용 불가 — 대체·공학적 대책으로 즉시 개선하고, 재평가로 허용 수준까지 낮춥니다'
        : bd===1? '개선 필요 — 가능성(P) 조정이 어려우면 중대성(S)을 낮추는 대책으로 위험성을 감소시킵니다'
        : '허용 가능 — 현 수준을 유지하되 필요에 따라 개선하고 기록을 남깁니다'); }
  },

  // 8.5 관리대상·특별관리물질과 국제 흐름 (탭 단계 · HygDoc)
  { id:'hyg8_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], calc=[];
      boxes.push({x:0.03,y:0.325,w:0.94,h:0.105,c:BLU,t:'관리대상 유해물질',s:'유기화합물 116 · 금속류 23 · 산·알칼리 17 · 가스상 15종 — 건강장해 예방기준 적용'});
      if(st>=1){ boxes.push({x:0.03,y:0.45,w:0.94,h:0.105,c:RED,t:'특별관리물질 (관리대상 중 특히 위험)',s:'발암성·생식세포 변이원성·생식독성 — 벤젠·6가크롬·카드뮴·포름알데히드·니켈'}); }
      if(st>=2){ boxes.push({x:0.03,y:0.575,w:0.455,h:0.10,c:AMB,t:'GHS 경고표지 6요소',s:'명칭·그림문자·신호어·유해문구·예방문구·공급자정보'});
        boxes.push({x:0.515,y:0.575,w:0.455,h:0.10,c:GRN,t:'MSDS (물질안전보건자료)',s:'16개 항목 작성·비치·교육'}); }
      if(st>=3){ boxes.push({x:0.03,y:0.695,w:0.94,h:0.095,c:PNK,t:'근로자 알권리 — 경고표지 부착·MSDS 게시·특별관리물질 게시 고지'}); }
      if(st>=4){ boxes.push({x:0.03,y:0.805,w:0.94,h:0.11,c:GRN,t:'국제 조화 (GHS)',s:'유엔 GHS로 분류·표지 국제 통일 → 각국 제도 정합 · 나노물질 등 신규 유해인자 대응'});
        calc.push({k:'특별관리물질 기록보존',v:'30년',c:RED});
        calc.push({k:'경고표지 신호어',v:'위험 / 경고',c:AMB}); }
      window.HygDoc(E,{ boxes:boxes, calc:calc,
        note: st>=4? '제도의 큰 그림 — 물질을 분류하고, 표지·자료로 알리고, 몸과 환경을 감시합니다' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['관리대상 유해물질 — 건강장해 예방의 대상 목록','그 중 특히 위험한 것이 특별관리물질입니다','위험을 알리는 두 도구 — 경고표지와 MSDS','근로자는 무엇을 다루는지 알 권리가 있습니다','GHS로 세계가 같은 언어를 씁니다'][st];
      var sub=['관리대상 유해물질은 유기화합물 116종·금속류 23종·산과 알칼리 17종·가스상 15종으로, 건강장해 예방을 위한 취급·설비·환기 기준이 적용됩니다. D키로 이어 보세요',
        '특별관리물질은 관리대상 중에서도 발암성·생식세포 변이원성·생식독성이 있는 물질로, 벤젠·6가크롬·카드뮴·포름알데히드 등이 해당하며 더 엄격히 관리합니다',
        'GHS 경고표지는 명칭·그림문자·신호어(위험/경고)·유해위험문구·예방조치문구·공급자정보의 6요소로 구성되고, MSDS는 16개 항목으로 물질의 모든 정보를 담습니다',
        '사업주는 경고표지를 붙이고 MSDS를 근로자가 쉽게 볼 수 있는 곳에 게시하며, 특별관리물질은 발암성 등의 사실을 게시판으로 고지해야 합니다 — 근로자의 알권리입니다',
        'GHS(화학물질 분류·표지의 세계조화시스템)로 각국의 분류·표지가 통일되어 국제 교역과 관리가 정합해졌습니다 — 나노물질 등 새 유해인자에도 같은 틀로 대응합니다'][st];
      E.big(big, sub); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
