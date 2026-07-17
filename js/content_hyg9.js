/* 산업위생관리기술사 제9장 — 기출·논술 도장(답안을 완성하는 훈련). 동작만. 텍스트=content/hyg9.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 글자 크기 = H 비례 + 클램프(낮은 뷰포트에서 겹침·잘림 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn, Math.min(mx, H*frac)); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  // 표준정규 누적분포(Abramowitz-Stegun 근사) — 초과확률 실계산용
  function ncdf(z){ var t=1/(1+0.2316419*Math.abs(z));
    var d=0.3989423*Math.exp(-z*z/2);
    var p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
    return z>0? 1-p : p; }
  // 우측 해설 카드(제목+줄 목록) — 좌표·행간 전부 H 비례
  function card(E,xr,yr,wr,hr,title,lines,col){ var ctx=E.ctx,W=E.W,H=E.H;
    var x=xr*W, y=yr*H, w=wr*W, h=hr*H;
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=col||BLU; ctx.lineWidth=1.5;
    RR(ctx,x,y,w,h,9); ctx.fill(); ctx.stroke();
    var tF=FS(H,0.024,13,14), lF=FS(H,0.021,12,15);
    var pad=Math.max(10,Math.min(16,H*0.022));
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=col||BLU; ctx.font='600 '+tF+'px sans-serif';
    ctx.fillText(title, x+pad, y+pad+tF*0.8);
    var lh=Math.max(16,Math.min(24,(h-pad*2-tF-6)/Math.max(1,lines.length)));
    ctx.font=lF+'px sans-serif';
    for(var i=0;i<lines.length;i++){ var L=lines[i];
      ctx.fillStyle=(L.charAt(0)==='★')? AMB : TXT;
      ctx.fillText(L, x+pad, y+pad+tF+10+(i+0.7)*lh); } }

  var scenes=[

  // 9.1 계산형 논술 — 국소배기장치 설계(제어풍속→Q→덕트경→VP·SPh, 전부 실계산)
  { id:'hyg9_01',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      // ── 설계 실계산(표시값 전부 여기서 산출) ─────────────────────────
      var Vc=0.5, X=0.3, A=0.4*0.25, F=0.4, Vt=10, Dsel=0.25;      // 조건: 가스상·외부식 측방흡인형
      var Q=60*Vc*(10*X*X+A);                                      // 필요송풍량(m³/min)
      var Qs=Q/60;                                                 // m³/s
      var Dth=Math.sqrt(4*Qs/(Math.PI*Vt));                        // 이론 덕트경(m)
      var Ad=Math.PI*Dsel*Dsel/4;                                  // 선정 관경 단면적(m²)
      var Vact=Qs/Ad;                                              // 실제 반송속도(m/s)
      var VP=Math.pow(Vact/4.043,2);                               // 속도압(mmH2O)
      var SPh=VP*(1+F);                                            // 후드정압(mmH2O)
      // ── 좌측: 답안 개요(줄커서) + 하단 calc ─────────────────────────
      var calc=[];
      if(st>=1) calc.push({k:'Vc', v:Vc.toFixed(1)+' m/s', c:GRN});
      if(st>=2) calc.push({k:'Q',  v:Q.toFixed(1)+' m³/min', c:GRN});
      if(st>=3) calc.push({k:'D',  v:Dth.toFixed(3)+'→'+Dsel.toFixed(2)+' m', c:BLU});
      if(st>=3) calc.push({k:'V',  v:Vact.toFixed(2)+' m/s', c:BLU});
      if(st>=4) calc.push({k:'VP', v:VP.toFixed(2)+' mmH₂O', c:ORA});
      if(st>=4) calc.push({k:'SPh',v:SPh.toFixed(2)+' mmH₂O', c:ORA});
      window.HygDoc(E,{
        title:'계산형 논술 — 국소배기장치 설계',
        sub:'조건 정리 → 근거 → 식 → 대입 → 답(단위) 순서가 곧 득점 순서입니다',
        codeTitle:'답안 개요(뼈대)',
        code:[
          '1. 개요·설계 조건 정리 (+공정 그림)',
          '2. 제어풍속 선정 — 법정 기준 근거',
          '3. 필요송풍량 Q = 60·Vc·(10X²+A)',
          '4. 반송속도 → 덕트 직경 결정',
          '5. 속도압 VP → 후드정압 SPh',
          '6. 결론 — 설계값 요약표'
        ],
        actLine:st,
        calc:calc,
        note:(st>=5)?'각 단계마다 근거(고시 기준·공식 출처)를 한 줄씩 붙이는 것이 채점의 핵심입니다':''
      });
      // ── 우측: 계통 흐름 상자 + 단계별 계산 카드 ─────────────────────
      var flow=[{t:'후드',on:st>=1},{t:'덕트',on:st>=3},{t:'송풍기',on:st>=4},{t:'배기구',on:st>=5}];
      var fy=H*0.235, fh=H*0.075, fx0=W*0.52, fw=W*0.095, fg=W*0.012;
      var fF=FS(H,0.021,12,15);
      for(var i=0;i<flow.length;i++){ var fx=fx0+i*(fw+fg);
        ctx.fillStyle='rgba(255,255,255,0.04)';
        ctx.strokeStyle=flow[i].on? ORA : 'rgba(155,153,163,0.5)'; ctx.lineWidth=1.6;
        RR(ctx,fx,fy,fw,fh,8); ctx.fill(); ctx.stroke();
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillStyle=flow[i].on? ORA : DIM; ctx.font='600 '+fF+'px sans-serif';
        ctx.fillText(flow[i].t, fx+fw/2, fy+fh*0.62);
        if(i<flow.length-1){ ctx.strokeStyle='rgba(223,238,251,0.4)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(fx+fw+2,fy+fh/2); ctx.lineTo(fx+fw+fg-2,fy+fh/2); ctx.stroke(); } }
      var cards=[
        {t:'조건 정리(그림과 함께)', c:BLU, L:[
          '도금조 상부 개방면 — 가스상 유해물질',
          '후드: 외부식 장방형(플랜지 없음)',
          '개구면 0.4 m × 0.25 m → A = '+A.toFixed(2)+' m²',
          '발생원까지 제어거리 X = '+X.toFixed(1)+' m',
          '후드 유입손실계수 F = '+F.toFixed(1),
          '★답안 첫머리에 조건표+단면 그림']},
        {t:'제어풍속 선정(근거 명기)', c:GRN, L:[
          '관리대상 유해물질 · 가스 상태',
          '외부식 측방흡인형 후드',
          '→ 제어풍속 Vc = '+Vc.toFixed(1)+' m/s',
          '(후드 형식별 제어풍속 기준표)',
          '★수치보다 "왜 이 값인가"가 점수']},
        {t:'필요송풍량 Q 계산', c:GRN, L:[
          'Q = 60·Vc·(10X² + A)',
          '  = 60 × '+Vc.toFixed(1)+' × (10×'+X.toFixed(1)+'² + '+A.toFixed(2)+')',
          '  = 60 × '+Vc.toFixed(1)+' × '+(10*X*X+A).toFixed(2),
          '  = '+Q.toFixed(1)+' m³/min',
          '★대입 과정을 생략하면 부분점수 상실']},
        {t:'반송속도 → 덕트 직경', c:BLU, L:[
          '가스상 최소 반송속도 V = '+Vt.toFixed(0)+' m/s',
          'D(이론) = √(4Q/πV) = '+Dth.toFixed(3)+' m',
          '표준 관경으로 D = '+Dsel.toFixed(2)+' m 선정',
          '실제 V = Q/A덕트 = '+Vact.toFixed(2)+' m/s ≥ '+Vt.toFixed(0),
          '★이론값→표준규격 선정→재검산 순서']},
        {t:'속도압·후드정압', c:ORA, L:[
          'VP = (V/4.043)²',
          '   = ('+Vact.toFixed(2)+'/4.043)² = '+VP.toFixed(2)+' mmH₂O',
          'SPh = VP(1+F) = '+VP.toFixed(2)+' × '+(1+F).toFixed(1),
          '    = '+SPh.toFixed(2)+' mmH₂O',
          '★송풍기 정압 선정의 출발점임을 명기']},
        {t:'결론 — 요약표로 마무리', c:AMB, L:[
          'Vc '+Vc.toFixed(1)+' m/s · Q '+Q.toFixed(1)+' m³/min',
          'D '+Dsel.toFixed(2)+' m · V '+Vact.toFixed(2)+' m/s',
          'VP '+VP.toFixed(2)+' · SPh '+SPh.toFixed(2)+' (mmH₂O)',
          '★그림·표·근거 조문 = 계산형의 3대 득점',
          '★단위 누락은 그 항 전체 감점']}
      ][st];
      card(E, 0.52, 0.345, 0.43, 0.42, cards.t, cards.L, cards.c);
      E.tapHint(0,0,'다음 단계',true);
      var big=['문제를 조건표와 그림으로 먼저 정리합니다','제어풍속은 법정 기준을 근거로 선정합니다',
        '필요송풍량 Q를 식→대입→답 순으로 조립합니다','반송속도를 정하고 덕트 직경을 역산합니다',
        '속도압과 후드정압까지 이어서 계산합니다','요약표와 그림으로 답안을 완성합니다'][st];
      var sub=['개구면적 A와 제어거리 X를 조건에서 뽑아 그림에 표기합니다 — 채점자는 그림에서 이해도를 먼저 봅니다',
        '가스상·외부식 측방흡인형이므로 0.5 m/s — 근거 없는 수치는 점수가 없습니다',
        'Q = 60×0.5×(10×0.09+0.1) = '+Q.toFixed(1)+' m³/min — 대입 과정 한 줄이 부분점수를 지킵니다',
        '이론 직경 '+Dth.toFixed(3)+' m → 표준 관경 0.25 m 선정 → 실제 반송속도 '+Vact.toFixed(2)+' m/s로 재검산합니다',
        'VP = (V/4.043)² = '+VP.toFixed(2)+', SPh = VP(1+F) = '+SPh.toFixed(2)+' mmH₂O — 단위까지가 답입니다',
        '설계값 요약표를 놓으면 채점자가 10초 만에 채점할 수 있습니다 — 계산형 25점 문제의 정석입니다'][st];
      E.big(big, sub); }
  },

  // 9.2 판정형 논술 — 작업환경측정 결과 평가(GM·GSD·95퍼센타일·초과확률 실계산)
  { id:'hyg9_02',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      // ── 통계 실계산 ────────────────────────────────────────────────
      var V=[22,30,41,28,35], OEL=50, AL=OEL/2, n=V.length, i;
      var sl=0; for(i=0;i<n;i++) sl+=Math.log(V[i]);
      var mu=sl/n, GM=Math.exp(mu);
      var ss=0; for(i=0;i<n;i++) ss+=Math.pow(Math.log(V[i])-mu,2);
      var sd=Math.sqrt(ss/(n-1)), GSD=Math.exp(sd);
      var P95=GM*Math.pow(GSD,1.645);
      var z=(Math.log(OEL)-mu)/sd, pex=(1-ncdf(z))*100;
      var calc=[];
      if(st>=1) calc.push({k:'GM', v:GM.toFixed(1)+' ppm', c:GRN});
      if(st>=1) calc.push({k:'GSD', v:GSD.toFixed(2), c:GRN});
      if(st>=2) calc.push({k:'GM/기준', v:(GM/OEL).toFixed(2), c:BLU});
      if(st>=3) calc.push({k:'95퍼센타일', v:P95.toFixed(1)+' ppm', c:PNK});
      if(st>=3) calc.push({k:'초과확률', v:pex.toFixed(1)+' %', c:PNK});
      window.HygDoc(E,{
        title:'판정형 논술 — 측정결과 평가',
        sub:'수치 나열이 아니라 통계 → 기준 비교 → 판정 → 조치의 이야기로 씁니다',
        codeTitle:'답안 개요(뼈대)',
        code:[
          '1. 자료 정리 — 대수정규분포 가정',
          '2. GM·GSD 산출 (로그 변환)',
          '3. 노출기준·AL(기준의 1/2)과 비교',
          '4. 95퍼센타일·초과확률로 평가',
          '5. 판정·조치 — 측정주기·개선 결정'
        ],
        actLine:st,
        calc:calc,
        note:(st>=4)?'판정 근거(통계량)와 조치(주기·개선)를 짝지어 쓰는 것이 판정형의 완성입니다':''
      });
      // ── 우측: 측정값 막대 + 기준선(전부 실계산 좌표) ─────────────────
      var x0=W*0.545, x1=W*0.945, y0=H*0.72, y1=H*0.26, Vmax=60;
      function YY(v){ return y0-(v/Vmax)*(y0-y1); }
      ctx.strokeStyle='rgba(219,238,251,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1-H*0.01); ctx.stroke();
      var aF=FS(H,0.019,11,14);
      ctx.fillStyle=DIM; ctx.font=aF+'px sans-serif'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
      for(var g=0;g<=60;g+=20){ ctx.fillText(g, x0-6, YY(g)+4);
        ctx.strokeStyle='rgba(219,238,251,0.10)'; ctx.beginPath(); ctx.moveTo(x0,YY(g)); ctx.lineTo(x1,YY(g)); ctx.stroke(); }
      ctx.textAlign='left'; ctx.fillText('ppm', x0-W*0.001, y1-H*0.018);
      var bw=(x1-x0)/(n+1)*0.55;
      for(i=0;i<n;i++){ var bx=x0+(i+0.7)*(x1-x0)/(n+0.5), by=YY(V[i]);
        ctx.fillStyle= V[i]>AL? 'rgba(242,189,85,0.75)':'rgba(122,184,255,0.75)';
        ctx.fillRect(bx-bw/2, by, bw, y0-by);
        ctx.fillStyle=TXT; ctx.font=aF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText(V[i], bx, by-5); }
      function hline(v,col,lbl,dash){ var y=YY(v);
        ctx.strokeStyle=col; ctx.lineWidth=1.8; if(dash)ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=col; ctx.font='600 '+aF+'px sans-serif'; ctx.textAlign='right';
        ctx.fillText(lbl, x1, y-4); }
      hline(OEL, RED, '노출기준 '+OEL, true);
      if(st>=2) hline(AL, AMB, 'AL '+AL.toFixed(0), true);
      if(st>=1) hline(GM, GRN, 'GM '+GM.toFixed(1), false);
      if(st>=3) hline(P95, PNK, '95% '+P95.toFixed(1), false);
      // 판정 배지(마지막 단계)
      if(st>=4){ var bx2=W*0.545, by2=H*0.775, bw2=W*0.40, bh2=H*0.075;
        ctx.fillStyle='rgba(143,227,181,0.10)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6;
        RR(ctx,bx2,by2,bw2,bh2,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 '+FS(H,0.022,12,14)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('판정: 노출기준 미만 (95% '+P95.toFixed(1)+' < '+OEL+', 초과확률 '+pex.toFixed(1)+'%)', bx2+bw2/2, by2+bh2*0.42);
        ctx.fillStyle=DIM; ctx.font=FS(H,0.018,11,14)+'px sans-serif';
        ctx.fillText('단, GM('+GM.toFixed(1)+') > AL('+AL.toFixed(0)+') → 정기측정 유지·공정관리 지속', bx2+bw2/2, by2+bh2*0.80); }
      E.tapHint(0,0,'다음 단계',true);
      var big=['측정값 5개를 있는 그대로 나열하면 0점 답안입니다','로그 변환으로 기하평균과 기하표준편차를 구합니다',
        '노출기준과 그 절반(AL)에 견주어 봅니다','95퍼센타일과 초과확률로 분포 전체를 평가합니다',
        '판정과 조치를 짝지어 결론을 씁니다'][st];
      var sub=['톨루엔 측정치 22·30·41·28·35 ppm(기준 50) — 작업환경 농도는 대수정규분포를 따르므로 통계 처리가 답안의 시작입니다',
        'GM = '+GM.toFixed(1)+' ppm, GSD = '+GSD.toFixed(2)+' — 로그를 취해 평균·표준편차를 구한 뒤 지수로 되돌립니다',
        'GM/기준 = '+(GM/OEL).toFixed(2)+' — 전 측정치가 기준 미만이지만 AL(25)을 넘는 값이 있어 안심할 단계가 아닙니다',
        '95퍼센타일 = GM×GSD^1.645 = '+P95.toFixed(1)+' ppm < 기준 50, 초과확률 '+pex.toFixed(1)+'% < 5% — 통계적으로 수용 가능합니다',
        '노출기준 미만으로 판정하되 GM이 AL을 넘으므로 정기측정을 유지하고 발생원 관리를 지속합니다 — 판정+조치가 한 세트입니다'][st];
      E.big(big, sub); }
  },

  // 9.3 대책형 논술 — 용접공정 유해인자와 관리(위계 사다리)
  { id:'hyg9_03',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      window.HygDoc(E,{
        title:'대책형 논술 — 용접공정의 유해인자와 관리',
        sub:'인자 열거 → 기준 → 위계 순 대책 → 건강관리, 6하원칙과 키워드가 뼈대입니다',
        codeTitle:'답안 개요(뼈대)',
        code:[
          '1. 개요 — 공정·작업을 6하원칙으로',
          '2. 유해인자 — 흄·가스·물리적 인자',
          '3. 노출기준 — 대표 인자 수치 명기',
          '4. 관리대책 — 위계(효과 큰 순) 서술',
          '5. 건강관리·측정 — 진단·측정주기',
          '6. 결론 — 우선순위와 기대효과'
        ],
        actLine:st,
        calc:[],
        note:(st>=5)?'대책형은 위계 순서 자체가 채점 기준입니다 — 보호구부터 쓰면 감점입니다':''
      });
      var xr=0.52, xw=0.43, x=xr*W, xwPx=xw*W;
      var cF=FS(H,0.020,11,15), sF=FS(H,0.018,11,13);
      // ── 유해인자 칩(2단계) ─────────────────────────────────────────
      if(st>=1){ var chips=[
          {t:'용접흄(Cr⁶⁺·Ni)',c:RED},{t:'오존 O₃',c:PNK},{t:'질소산화물',c:PNK},
          {t:'일산화탄소',c:PNK},{t:'자외선(아크광)',c:BLU},{t:'소음·고열',c:BLU}];
        var chY=H*0.235, chH=H*0.058, chW=xwPx/3-W*0.008;
        for(var i=0;i<chips.length;i++){ var col=i%3, row=Math.floor(i/3);
          var cx=x+col*(chW+W*0.008), cy=chY+row*(chH+H*0.012);
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=chips[i].c; ctx.lineWidth=1.4;
          RR(ctx,cx,cy,chW,chH,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=chips[i].c; ctx.font='600 '+cF+'px sans-serif';
          ctx.textAlign='center'; ctx.textBaseline='alphabetic';
          ctx.fillText(chips[i].t, cx+chW/2, cy+chH*0.62); } }
      // ── 노출기준 줄(3단계) ─────────────────────────────────────────
      if(st>=2){ ctx.fillStyle=AMB; ctx.font='600 '+sF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('노출기준: 용접흄 TWA 5 mg/m³ · 오존 TWA 0.08(STEL 0.2) ppm · CO TWA 30 ppm', x+xwPx/2, H*0.395); }
      // ── 관리대책 위계 사다리(4단계) ────────────────────────────────
      if(st>=3){ var lad=[
          {t:'① 제거·대체', d:'저흄 용접봉·자동화·밀폐 작업방식 변경', c:GRN},
          {t:'② 공학적 대책', d:'이동식 흄 후드(국소배기)·차광 칸막이', c:BLU},
          {t:'③ 관리적 대책', d:'작업시간·순환배치·교육·표지', c:AMB},
          {t:'④ 개인보호구', d:'방진(송기)마스크·차광면·귀마개', c:RED}];
        var ly=H*0.425, lh=H*0.082, lg=H*0.014;
        for(var k=0;k<lad.length;k++){ var Lk=lad[k], yk=ly+k*(lh+lg);
          var wk=xwPx*(1-k*0.07);                                   // 아래로 갈수록 좁게 = 効果 작음
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=Lk.c; ctx.lineWidth=1.6;
          RR(ctx,x,yk,wk,lh,8); ctx.fill(); ctx.stroke();
          ctx.textAlign='left'; ctx.fillStyle=Lk.c; ctx.font='600 '+cF+'px sans-serif';
          ctx.fillText(Lk.t, x+W*0.012, yk+lh*0.40);
          ctx.fillStyle=DIM; ctx.font=sF+'px sans-serif';
          ctx.fillText(Lk.d, x+W*0.012, yk+lh*0.78); }
        ctx.save(); ctx.translate(x+xwPx*0.985, ly+(lh*4+lg*3)/2); ctx.rotate(Math.PI/2);
        ctx.fillStyle=DIM; ctx.font=sF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('위 → 아래 = 효과 큰 순', 0, 0); ctx.restore(); }
      // ── 건강관리 줄(5단계) ─────────────────────────────────────────
      if(st>=4){ ctx.fillStyle=GRN; ctx.font='600 '+sF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('특수건강진단(용접흄 대상) · 작업환경측정 6개월 주기(초과 시 3개월) · 결과 근로자 통지', x+xwPx/2, H*0.845); }
      E.tapHint(0,0,'다음 단계',true);
      var big=['상황을 6하원칙으로 먼저 정의합니다','유해인자를 화학적·물리적으로 빠짐없이 열거합니다',
        '대표 인자의 노출기준 수치를 명기합니다','대책은 반드시 위계 순서로 씁니다',
        '건강관리와 측정으로 관리 고리를 닫습니다','우선순위를 요약하며 결론을 맺습니다'][st];
      var sub=['누가(용접공)·어디서(밀폐 구조물)·무엇을(스테인리스 MIG)·어떻게(연속 아크) — 첫 문단에서 상황이 그려져야 합니다',
        '흄(산화금속·Cr⁶⁺·Ni), 가스(오존·질소산화물·CO), 물리적(자외선·소음·고열) — 분류 틀이 있으면 빠뜨리지 않습니다',
        '용접흄 5 mg/m³, 오존 0.08 ppm(STEL 0.2), CO 30 ppm — 수치를 쓰면 답안의 신뢰도가 달라집니다',
        '제거·대체 → 공학 → 관리 → 보호구 — 보호구를 먼저 쓰는 답안은 위계를 모른다고 읽힙니다',
        '특수건강진단과 6개월 주기 측정(초과 시 3개월 강화)까지 써야 관리의 고리가 완성됩니다',
        '핵심 키워드(위계·국소배기·특수건강진단)에 밑줄을 긋듯 강조하면 채점자가 빨리 찾습니다'][st];
      E.big(big, sub); }
  },

  // 9.4 개념 비교형 논술 — TWA vs STEL 비교표 조립
  { id:'hyg9_04',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      window.HygDoc(E,{
        title:'개념 비교형 논술 — TWA와 STEL',
        sub:'비교형은 표가 답안입니다 — 같은 기준(행)으로 나란히 견주면 고득점입니다'
      });
      // ── 비교표(행이 단계마다 채워짐) — 전부 H 비례 ───────────────────
      var x0=W*0.08, x1=W*0.92, labW=(x1-x0)*0.18, colW=((x1-x0)-labW)/2;
      var top=H*0.305, rowH=Math.max(34, Math.min(64, H*0.105)), nRow=5;
      var rows=[
        {k:'구분',   a:['TWA (시간가중평균)'],                    b:['STEL (단시간노출기준)'], hdr:true},
        {k:'정의',   a:['1일 8시간·주 40시간의','시간가중 평균농도'], b:['15분간의 시간가중','평균 노출기준']},
        {k:'목적',   a:['만성 건강영향 예방','장기 노출 관리지표'],   b:['급성 자극·중독 등','단시간 영향 예방']},
        {k:'적용',   a:['노출기준 설정 물질의','기본값(거의 전 물질)'], b:['TWA 이하라도 1일 4회 이하','회간 60분 이상 간격']},
        {k:'한계',   a:['짧은 고농도 첨두 노출을','평균이 가려버림'],  b:['미설정 물질 많음 →','노출상한 3배·5배로 보완']}
      ];
      var kF=FS(H,0.022,12,14), cFt=FS(H,0.020,11,15);
      function fit(txt,weight,base,maxW){ var f=base; ctx.font=weight+f+'px sans-serif';
        while(f>8 && ctx.measureText(txt).width>maxW){ f--; ctx.font=weight+f+'px sans-serif'; } return f; }
      for(var r=0;r<nRow;r++){ var Rw=rows[r], y=top+r*rowH, shown=(r<=st);
        // 셀 테두리
        for(var c=0;c<3;c++){ var cx=(c===0)?x0:(c===1? x0+labW : x0+labW+colW);
          var cw=(c===0)?labW:colW;
          ctx.strokeStyle= shown? 'rgba(223,238,251,0.30)':'rgba(223,238,251,0.10)';
          ctx.lineWidth=1; ctx.strokeRect(cx,y,cw,rowH); }
        if(!shown) continue;
        ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        // 행 라벨
        ctx.fillStyle= Rw.hdr? TXT : AMB; ctx.font='600 '+fit(Rw.k,'600 ',kF,labW-10)+'px sans-serif';
        ctx.fillText(Rw.k, x0+labW/2, y+rowH*0.58);
        // 두 열
        var cols=[{tx:Rw.a, cx:x0+labW+colW/2, col: Rw.hdr? BLU:TXT},
                  {tx:Rw.b, cx:x0+labW+colW*1.5, col: Rw.hdr? PNK:TXT}];
        for(var q=0;q<2;q++){ var C=cols[q], m=C.tx.length;
          for(var li=0;li<m;li++){ var t=C.tx[li];
            var f2=fit(t, Rw.hdr?'600 ':'', cFt, colW-14);
            ctx.fillStyle=C.col; ctx.font=(Rw.hdr?'600 ':'')+f2+'px sans-serif';
            var ly=y+rowH*(m===1?0.58:(0.38+li*0.34));
            ctx.fillText(t, C.cx, ly); } } }
      // 노출상한 각주(마지막 단계) — 표 아래
      if(st>=4){ ctx.fillStyle=DIM; ctx.font=FS(H,0.019,11,14)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('※ STEL 미설정 물질의 노출상한(ACGIH): TWA의 3배는 30분 이내만, 5배는 잠시라도 초과 금지', W/2, top+nRow*rowH+FS(H,0.032,16,22)); }
      E.tapHint(0,0,'다음 행',true);
      var big=['비교형은 표의 틀부터 그립니다','첫 행 — 두 개념의 정의를 나란히 씁니다',
        '둘째 행 — 무엇을 지키려는 기준인지 견줍니다','셋째 행 — 적용 조건과 시간 규칙을 채웁니다',
        '넷째 행 — 한계와 보완 장치로 마무리합니다'][st];
      var sub=['구분(행 라벨)을 정의·목적·적용·한계로 먼저 세우면 서술이 흔들리지 않습니다 — 채점자도 표를 먼저 봅니다',
        'TWA는 8시간·주 40시간 가중평균, STEL은 15분 가중평균 — 시간 창의 차이가 모든 차이의 뿌리입니다',
        'TWA는 만성 영향의 장기 관리지표, STEL은 급성 자극·중독을 막는 단시간 안전판입니다',
        'STEL은 TWA를 지켰더라도 1일 4회 이하·회간 60분 이상이라는 횟수·간격 규칙이 따로 붙습니다',
        'TWA는 첨두 노출을 가리고, STEL 미설정 물질은 노출상한(3배 30분·5배 금지)으로 보완합니다 — 한계를 아는 답안이 만점 답안입니다'][st];
      E.big(big, sub); }
  },

  // 9.5 백지 복원 훈련 — WBGT 서브노트 5요소(정의·식·그림·실무·결론)
  { id:'hyg9_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      window.HygDoc(E,{
        title:'백지 복원 훈련 — WBGT 서브노트',
        sub:'시험 전날, 백지에 정의·식·그림·실무·결론이 손으로 복원되는지 확인합니다'
      });
      // ── 실계산(예시 온도 → WBGT → 작업·휴식비 판정) ─────────────────
      var NWB=28, GT=32, DB=30;
      var wOut=0.7*NWB+0.2*GT+0.1*DB;                              // 옥외(태양직사)
      var wIn=0.7*NWB+0.3*GT;                                      // 옥내·태양 없음
      var lim=[{t:'계속 작업',v:26.7},{t:'75% 작업·25% 휴식',v:28.0},
               {t:'50% 작업·50% 휴식',v:29.4},{t:'25% 작업·75% 휴식',v:31.1}];   // 중등작업 기준
      var pick=-1; for(var li=0;li<lim.length;li++){ if(lim[li].v>=wOut){ pick=li; break; } }
      // ── 좌측: 서브노트 시트 ────────────────────────────────────────
      var sx=W*0.06, sw=W*0.60, syT=H*0.24, syB=H*0.93;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(242,189,85,0.35)'; ctx.lineWidth=1.2;
      RR(ctx,sx,syT,sw,syB-syT,10); ctx.fill(); ctx.stroke();
      var hF=FS(H,0.021,12,15), bF=FS(H,0.019,11,14);
      var pad=Math.max(10,Math.min(18,W*0.014));
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillStyle=AMB; ctx.font='600 '+FS(H,0.023,13,14)+'px sans-serif';
      ctx.fillText('주제: WBGT(습구흑구온도지수)', sx+pad, syT+H*0.038);
      function secHead(t,y,col){ ctx.fillStyle=col; ctx.font='600 '+hF+'px sans-serif'; ctx.fillText(t, sx+pad, y); }
      function line(t,y,col){ ctx.fillStyle=col||TXT; ctx.font=bF+'px sans-serif'; ctx.fillText(t, sx+pad+W*0.012, y); }
      var lh=Math.max(15,Math.min(22,H*0.030));
      if(st>=1){ var y1=syT+H*0.075; secHead('① 정의', y1, BLU);
        line('고열 환경 평가의 대표 온열지표 — 기온·습도·복사열·기류를 반영', y1+lh, TXT); }
      if(st>=2){ var y2=syT+H*0.155; secHead('② 식', y2, GRN);
        line('옥외(태양직사) WBGT = 0.7×자연습구 + 0.2×흑구 + 0.1×건구', y2+lh, TXT);
        line('옥내·태양 없음 WBGT = 0.7×자연습구 + 0.3×흑구', y2+lh*2, TXT);
        line('예) 습구 '+NWB+'·흑구 '+GT+'·건구 '+DB+'℃ → 옥외 '+wOut.toFixed(1)+'℃ · 옥내 '+wIn.toFixed(1)+'℃', y2+lh*3, AMB); }
      if(st>=3){ var y3=syT+H*0.30; secHead('③ 그림 — 세 온도계와 가중치', y3, PNK);
        var th=[{t:'자연습구',w:'0.7',c:BLU},{t:'흑구',w:'0.2',c:RED},{t:'건구',w:'0.1',c:GRN}];
        var tW=sw*0.20, tH=H*0.105, tY=y3+lh*0.7;
        for(var k=0;k<3;k++){ var tx=sx+pad+k*(tW+sw*0.06);
          ctx.strokeStyle=th[k].c; ctx.lineWidth=1.8;
          // 온도계 몸통+구부(그림 요소)
          var mx=tx+tW*0.28;
          ctx.beginPath(); ctx.moveTo(mx, tY); ctx.lineTo(mx, tY+tH*0.62); ctx.stroke();
          ctx.beginPath(); ctx.arc(mx, tY+tH*0.72, Math.max(4,Math.min(8,H*0.011)), 0, 6.29); ctx.stroke();
          ctx.fillStyle=th[k].c; ctx.font='600 '+bF+'px sans-serif'; ctx.textAlign='left';
          ctx.fillText('×'+th[k].w, mx+W*0.010, tY+tH*0.40);
          ctx.fillStyle=DIM; ctx.font=bF+'px sans-serif';
          ctx.fillText(th[k].t, mx-W*0.012, tY+tH*0.97); } }
      if(st>=4){ var y4=syT+H*0.485; secHead('④ 실무 — 노출기준(중등작업)과 판정', y4, ORA);
        var ty=y4+lh*0.8, rH2=Math.max(15,Math.min(21,H*0.028));
        for(var r2=0;r2<lim.length;r2++){ var on=(r2===pick);
          ctx.fillStyle= on? 'rgba(255,178,122,0.14)':'rgba(255,255,255,0.0)';
          if(on){ ctx.fillRect(sx+pad, ty+r2*rH2-rH2*0.72, sw-pad*2, rH2); }
          ctx.fillStyle= on? ORA : DIM; ctx.font=(on?'600 ':'')+bF+'px sans-serif'; ctx.textAlign='left';
          ctx.fillText(lim[r2].t+' — '+lim[r2].v.toFixed(1)+'℃'+(on?'  ← WBGT '+wOut.toFixed(1)+'℃ 판정':''), sx+pad+W*0.008, ty+r2*rH2); } }
      if(st>=5){ var y5=syT+H*0.665; secHead('⑤ 결론', y5, GRN);
        line('기준 초과 시 작업·휴식비 조정, 급수·바람·차열, 순응 기간, 열중증 예방 교육', y5+lh, TXT); }
      // ── 우측: 복원 체크리스트(진행에 따라 ☑) ────────────────────────
      var cx0=W*0.69, cw0=W*0.26, cy0=H*0.26;
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle='rgba(223,238,251,0.25)'; ctx.lineWidth=1.2;
      RR(ctx,cx0,cy0,cw0,H*0.44,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=TXT; ctx.font='600 '+hF+'px sans-serif'; ctx.textAlign='left';
      ctx.fillText('자기 점검 체크리스트', cx0+pad, cy0+H*0.045);
      var items=['정의를 한 줄로','식(두 경우 구분)','그림(가중치 표기)','수치(노출기준표)','결론(조치·견해)'];
      var clh=Math.max(18,Math.min(30,H*0.055));
      for(var q2=0;q2<items.length;q2++){ var done=(st>=q2+1);
        ctx.fillStyle= done? GRN : DIM; ctx.font=(done?'600 ':'')+bF+'px sans-serif';
        ctx.fillText((done?'☑ ':'☐ ')+items[q2], cx0+pad, cy0+H*0.085+q2*clh); }
      ctx.fillStyle=DIM; ctx.font=FS(H,0.018,10,13)+'px sans-serif';
      ctx.fillText('막힌 항목 = 내일 아침 첫 복습', cx0+pad, cy0+H*0.44-H*0.018);
      E.tapHint(0,0,'다음 요소',true);
      var big=['백지에서 시작합니다 — 주제만 쓰여 있습니다','① 정의 — 한 줄로 복원합니다',
        '② 식 — 두 경우를 구분해 쓰고 예시로 검산합니다','③ 그림 — 가중치가 보이는 도식을 그립니다',
        '④ 실무 — 노출기준표와 판정을 복원합니다','⑤ 결론 — 조치와 견해로 닫고 점검합니다'][st];
      var sub=['서브노트를 덮고 빈 종이에 5요소(정의·식·그림·실무·결론)를 손으로 재현하는 것이 마지막 훈련입니다',
        'WBGT는 기온·습도·복사열·기류를 반영하는 고열 평가지표 — 정의가 막히면 그 뒤는 없습니다',
        '옥외 0.7·0.2·0.1, 옥내 0.7·0.3 — 예시(습구 28·흑구 32·건구 30℃)로 옥외 '+wOut.toFixed(1)+'℃를 직접 계산해 봅니다',
        '자연습구에 0.7의 무게가 실리는 이유(증발 냉각=인체 방열)를 그림 옆에 한 줄 쓰면 이해가 증명됩니다',
        '중등작업 기준표에서 WBGT '+wOut.toFixed(1)+'℃는 매시간 50% 작업·50% 휴식에 해당합니다 — 수치 판정까지가 실무입니다',
        '체크리스트에서 막힌 항목이 내일 아침의 복습 목록입니다 — 복원되는 주제만 시험장에서 내 것입니다'][st];
      E.big(big, sub); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
