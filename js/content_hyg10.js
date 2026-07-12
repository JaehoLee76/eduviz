/* 산업위생기술사 제10장 — 면접 시뮬레이션(경험이 답이 되는 시간). 동작만. 텍스트=content/hyg10.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 글자 크기·간격 = H 비례 + 클램프(낮은 뷰포트 겹침 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn, Math.min(mx, H*frac)); }
  function rr(ctx,x,y,w,h,r){ if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); } else { ctx.beginPath(); ctx.rect(x,y,w,h); } }
  function card(ctx,x,y,w,h,c,bg){ ctx.fillStyle=bg||'rgba(255,255,255,0.05)'; ctx.strokeStyle=c; ctx.lineWidth=1.6; rr(ctx,x,y,w,h,9); ctx.fill(); ctx.stroke(); }
  // 질문 카드(면접위원의 질문) 공용
  function qCard(E,text){ var ctx=E.ctx, W=E.W, H=E.H;
    var x=W*0.07, y=H*0.305, w=W*0.86, h=H*0.082;
    card(ctx,x,y,w,h,AMB,'rgba(242,189,85,0.08)');
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=AMB; ctx.font='700 '+FS(H,0.022,10,13)+'px sans-serif';
    ctx.fillText('면접위원', x+w*0.025, y+h*0.40);
    ctx.fillStyle=TXT; ctx.font='600 '+FS(H,0.023,10,14)+'px sans-serif';
    ctx.fillText(text, x+w*0.025, y+h*0.78); }

  var scenes=[

  // 10.1 면접의 구조 — 평가 3축(전문지식·실무·의사소통) + "모르면 모른다" 원칙 (탭 단계 · 커스텀 다이어그램)
  { id:'hyg10_01',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      // ─ 면접장: 위원 3~5명 + 수험자 (항상 표시)
      var pr=FS(H,0.020,7,12), py=H*0.355;
      for(var i=0;i<5;i++){ var px=W*0.13+i*W*0.085;
        ctx.fillStyle='rgba(122,184,255,0.75)'; ctx.beginPath(); ctx.arc(px,py,pr,0,6.29); ctx.fill();
        ctx.fillStyle='rgba(122,184,255,0.30)'; ctx.beginPath(); ctx.arc(px,py+pr*2.1,pr*1.35,Math.PI,0); ctx.fill(); }
      ctx.fillStyle=BLU; ctx.font='600 '+FS(H,0.020,9,12)+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('면접위원 3~5명', W*0.30, py+pr*4.4);
      var cy=H*0.485;
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(W*0.30,cy,pr*1.1,0,6.29); ctx.fill();
      ctx.fillStyle='rgba(255,178,122,0.32)'; ctx.beginPath(); ctx.arc(W*0.30,cy+pr*2.2,pr*1.5,Math.PI,0); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='600 '+FS(H,0.020,9,12)+'px sans-serif';
      ctx.fillText('수험자 · 구술 약 30분 · 60점 합격', W*0.30, cy+pr*4.6);
      // ─ 합격률 대비 막대(값→너비 계산)
      var rates=[ {t:'필기 합격률', lo:15, hi:20, c:RED}, {t:'면접 합격률', lo:60, hi:70, c:GRN} ];
      var lx=W*0.58, tw=W*0.35, bh=H*0.030, lbF=FS(H,0.019,8,11);
      for(var r=0;r<rates.length;r++){ var R=rates[r], by=H*0.355+r*H*0.085;
        ctx.fillStyle=DIM; ctx.font=lbF+'px sans-serif'; ctx.textAlign='left';
        ctx.fillText(R.t+' 약 '+R.lo+'~'+R.hi+'%', lx, by-bh*0.45);
        ctx.fillStyle='rgba(223,238,251,0.10)'; rr(ctx,lx,by,tw,bh,4); ctx.fill();
        var w1=R.lo/100*tw, w2=R.hi/100*tw;           // 실제 %값 → 픽셀 변환
        ctx.fillStyle=R.c; ctx.globalAlpha=0.45; rr(ctx,lx,by,w2,bh,4); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle=R.c; rr(ctx,lx,by,w1,bh,4); ctx.fill(); }
      // ─ 평가 3축 카드(단계 1~3에 하나씩)
      var axes=[
        {c:BLU, t:'전문지식',  l1:'정의·수치·조문의 정확성', l2:'근거를 짚어 말하는가',  bad:'감점: 틀린 수치를 자신 있게'},
        {c:GRN, t:'실무능력',  l1:'현장 적용과 판단 근거',   l2:'대안·우선순위 제시',    bad:'감점: 이론 암송·경험 부재'},
        {c:AMB, t:'의사소통',  l1:'두괄식·경청·간결함',      l2:'지적에 대한 수용 태도',  bad:'감점: 장황함·방어적 반박'}
      ];
      var gap=W*0.02, cw=(W*0.90-2*gap)/3, chh=H*0.185, cy2=H*0.575;
      var tF=FS(H,0.023,10,14), bF=FS(H,0.018,8,11);
      for(var a=0;a<axes.length;a++){ if(st<a+1) continue; var A=axes[a], ax=W*0.05+a*(cw+gap);
        card(ctx,ax,cy2,cw,chh,A.c);
        ctx.textAlign='center';
        ctx.fillStyle=A.c; ctx.font='700 '+tF+'px sans-serif'; ctx.fillText(A.t, ax+cw/2, cy2+chh*0.22);
        ctx.fillStyle=TXT; ctx.font=bF+'px sans-serif';
        ctx.fillText(A.l1, ax+cw/2, cy2+chh*0.44);
        ctx.fillText(A.l2, ax+cw/2, cy2+chh*0.62);
        ctx.fillStyle=RED; ctx.font='600 '+bF+'px sans-serif';
        ctx.fillText(A.bad, ax+cw/2, cy2+chh*0.85); }
      // ─ 마지막: 정직+접근법 원칙 배너
      if(st>=4){ var bnY=H*0.805, bnH=H*0.085;
        card(ctx,W*0.10,bnY,W*0.80,bnH,ORA,'rgba(255,178,122,0.10)');
        ctx.textAlign='center'; ctx.fillStyle=ORA; ctx.font='700 '+FS(H,0.023,10,14)+'px sans-serif';
        ctx.fillText('"정확한 수치는 기억나지 않습니다. 다만 이런 원리로 접근하겠습니다"', W/2, bnY+bnH*0.42);
        ctx.fillStyle=TXT; ctx.font=FS(H,0.019,9,12)+'px sans-serif';
        ctx.fillText('정직한 인정 + 접근법 제시 — 아는 척보다 훨씬 높은 점수를 받습니다', W/2, bnY+bnH*0.80); }
      E.tapHint(0,0,'다음 축',true);
      var big=['면접위원 3~5명 앞, 약 30분의 구술','첫째 축 — 전문지식의 정확성','둘째 축 — 실무 판단력','셋째 축 — 의사소통과 태도','모르면, 모른다고 말하세요'][st];
      var sub=['필기를 뚫은 뒤의 마지막 관문입니다. 100점 만점에 60점 — 합격률은 필기보다 높지만, 준비 없이 서면 짧지 않은 30분입니다. D키로 위원의 채점표를 열어 보세요',
        '정의·수치·법 조문이 정확한지 봅니다. 모르는 것을 아는 척하다 틀린 수치를 말하는 순간이 가장 큰 감점입니다',
        '이론을 현장에 어떻게 적용했는지, 판단의 근거가 있는지 봅니다. 교과서 암송만 이어지면 "경험이 없구나"로 읽힙니다',
        '결론부터 말하는지, 질문을 끝까지 듣는지, 지적에 어떻게 반응하는지 봅니다. 장황함과 방어적 반박이 대표 감점 요인입니다',
        '모르는 질문 앞에서 정직하게 인정하고 접근법을 제시하는 태도 — 위원은 그 순간 "현장에 세워도 되겠다"고 판단합니다'][st];
      E.big(big, sub); }
  },

  // 10.2 지식 확인형 질문 — 두괄식 답변 조립(TWA vs STEL) + 하루 농도 스트립(TWA 실계산)
  { id:'hyg10_02',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      qCard(E,'Q. TWA와 STEL의 차이를 설명해 보시오.');
      var hF=FS(H,0.021,9,13), tF=FS(H,0.020,9,12), dF=FS(H,0.017,8,11);
      // ─ 왼쪽: 나쁜 답변(미괄식) — 결론이 맨 끝
      var lxx=W*0.05, lw=W*0.42, by0=H*0.455, bh=H*0.062, bg=H*0.012;
      ctx.textAlign='left'; ctx.fillStyle=RED; ctx.font='700 '+hF+'px sans-serif';
      ctx.fillText('나쁜 답변 — 결론이 마지막', lxx, by0-bg*1.6);
      var badL=['정의를 처음부터 길게…','배경·연혁 설명…','관련 규정 총망라…','(3분 뒤) 결론…'];
      for(var b=0;b<4;b++){ var byy=by0+b*(bh+bg);
        card(ctx,lxx,byy,lw,bh, b<3?'rgba(155,153,163,0.55)':RED, 'rgba(155,153,163,0.08)');
        ctx.fillStyle=b<3?DIM:RED; ctx.font=dF+'px sans-serif'; ctx.textAlign='left';
        ctx.fillText(badL[b], lxx+lw*0.05, byy+bh*0.62); }
      // ─ 오른쪽: 좋은 답변(두괄식) — D키로 조립
      var rx=W*0.53, rw=W*0.42;
      ctx.fillStyle=GRN; ctx.font='700 '+hF+'px sans-serif'; ctx.textAlign='left';
      ctx.fillText('좋은 답변 — 결론이 첫 문장', rx, by0-bg*1.6);
      var good=[
        {c:ORA, t:'① 결론부터', d:'TWA=8시간 평균 · STEL=15분 기준'},
        {c:BLU, t:'② 정의·원리', d:'TWA=Σ(C·T)/8 · 사이값은 15분·4회·간격60분'},
        {c:GRN, t:'③ 실무 예시', d:'순간 고농도 공정은 TWA만으론 놓칩니다'},
        {c:PNK, t:'④ 한 줄 마무리', d:'만성=TWA · 급성=STEL로 함께 관리'}
      ];
      for(var g2=0; g2<4; g2++){ if(st<g2+1) continue; var G=good[g2], gy=by0+g2*(bh+bg);
        card(ctx,rx,gy,rw,bh,G.c);
        ctx.fillStyle=G.c; ctx.font='700 '+tF+'px sans-serif'; ctx.textAlign='left';
        ctx.fillText(G.t, rx+rw*0.04, gy+bh*0.40);
        ctx.fillStyle=TXT; ctx.font=dF+'px sans-serif';
        ctx.fillText(G.d, rx+rw*0.04, gy+bh*0.82); }
      // ─ 하루 농도 스트립(단계 3부터): TWA는 실계산 — 평균은 적합인데 15분이 STEL 초과
      if(st>=3){ var base=40, spike=160, dur=0.25, tlv=50, stel=150;
        var twa=(base*(8-dur)+spike*dur)/8;                      // 시간가중평균 실계산
        var sx0=W*0.07, sx1=W*0.62, yb=H*0.945, yt=H*0.805, maxC=stel*1.25;
        function TX(t){ return sx0+(sx1-sx0)*t/8; }
        function CY(c){ return yb-(yb-yt)*c/maxC; }
        ctx.strokeStyle='rgba(223,238,251,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(sx0,yb); ctx.lineTo(sx1,yb); ctx.stroke();
        ctx.fillStyle='rgba(122,184,255,0.35)';
        ctx.fillRect(TX(0), CY(base), TX(8)-TX(0), yb-CY(base));
        ctx.fillStyle='rgba(240,136,138,0.75)';
        ctx.fillRect(TX(4), CY(spike), TX(4+dur)-TX(4), yb-CY(spike));
        var lines=[{v:tlv,c:GRN,t:'TWA 기준 '+tlv},{v:stel,c:RED,t:'STEL '+stel}];
        for(var L=0; L<2; L++){ var ln=lines[L];
          ctx.strokeStyle=ln.c; ctx.setLineDash([5,4]); ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.moveTo(sx0,CY(ln.v)); ctx.lineTo(sx1,CY(ln.v)); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle=ln.c; ctx.font=FS(H,0.016,8,10)+'px sans-serif'; ctx.textAlign='left';
          ctx.fillText(ln.t, sx0+4, CY(ln.v)-3); }
        ctx.fillStyle=DIM; ctx.font=FS(H,0.016,8,10)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('0시간', TX(0), yb+FS(H,0.022,10,13)); ctx.fillText('8시간', TX(8), yb+FS(H,0.022,10,13));
        ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.font='600 '+dF+'px sans-serif';
        ctx.fillText('TWA '+twa.toFixed(1)+' ppm ≤ '+tlv+' → 적합', W*0.65, H*0.845);
        ctx.fillStyle=RED;
        ctx.fillText('15분 '+spike+' ppm > STEL '+stel+' → 초과', W*0.65, H*0.895);
        ctx.fillStyle=DIM; ctx.font=FS(H,0.016,8,10)+'px sans-serif';
        ctx.fillText('같은 하루를 두 기준이 다르게 봅니다', W*0.65, H*0.938); }
      E.tapHint(0,0,'답변 조각',true);
      var big=['질문이 나왔습니다 — 어디서부터 답할까요','① 결론부터 — 두괄식','② 정의와 원리 — 뼈대를 세웁니다','③ 실무 예시 — 경험을 한 스푼','④ 한 줄 마무리 — 답변을 접어 닫습니다'][st];
      var sub=['나쁜 답변은 정의·배경·규정을 다 말한 뒤에야 결론에 도착합니다. 위원은 이미 지쳐 있습니다. D키로 좋은 답변을 조립해 보세요',
        '"둘 다 노출기준이지만 시간창이 다릅니다 — TWA는 8시간 가중평균, STEL은 15분 단시간 기준입니다." 첫 문장에 답이 다 들어 있습니다',
        'TWA=Σ(C·T)/8. STEL은 급성 영향을 막는 15분 기준이며, TWA 초과~STEL 이하 노출은 1회 15분 이내·1일 4회 이하·간격 60분 이상이어야 합니다',
        '하루 평균은 기준 이하인데 15분 급상승이 STEL을 넘는 공정 — 아래 그래프처럼 TWA만 보면 놓칩니다. 이런 예시 하나가 실무자를 증명합니다',
        '"그래서 만성 영향은 TWA로, 급성 영향은 STEL로 함께 관리합니다" — 결론을 한 번 더 접어 닫으면 답변이 완결됩니다'][st];
      E.big(big, sub); }
  },

  // 10.3 실무 경험형 질문 — STAR 조립 + 노출지수 게이지(개선 전후 실계산)
  { id:'hyg10_03',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      qCard(E,'Q. 담당 사업장의 유해인자 개선 사례를 말씀해 보시오.');
      // 사례 수치(6가크롬 미스트) — 화면 표시는 전부 아래에서 계산
      var c0=0.008, c1=0.004, tlv=0.01;
      var ei0=c0/tlv, ei1=c1/tlv, pct0=Math.round(ei0*100), red=Math.round((1-c1/c0)*100);
      var rows=[
        {k:'S', c:BLU, t:'상황',        l1:'도금 공정 6가크롬 미스트', l2:'TWA '+c0+' mg/m³ = 기준('+tlv+')의 '+pct0+'%'},
        {k:'T', c:AMB, t:'과제',        l1:'노출지수 '+ei0.toFixed(1)+' → 0.5 이하 목표', l2:'국소배기 성능 복원 · 3개월 내'},
        {k:'A', c:ORA, t:'행동 — 주어는 "제가"', l1:'후드 플랜지 보강·제어풍속 복원', l2:'작업위치 조정·세정 절차 표준화'},
        {k:'R', c:GRN, t:'결과 — 수치로', l1:'재측정 '+c1+' → 노출지수 '+ei1.toFixed(1), l2:'농도 '+red+'% 저감 · 유소견자 0명'}
      ];
      var lxx=W*0.05, lw=W*0.52, ry0=H*0.435, rh=H*0.100, rg=H*0.014;
      var kF=FS(H,0.032,13,20), tF=FS(H,0.020,9,12), dF=FS(H,0.017,8,11);
      for(var i=0;i<4;i++){ var R=rows[i], ry=ry0+i*(rh+rg), on=(st>=i+1);
        card(ctx,lxx,ry,lw,rh, on?R.c:'rgba(155,153,163,0.35)', on?undefined:'rgba(155,153,163,0.05)');
        ctx.textAlign='left';
        ctx.fillStyle=on?R.c:DIM; ctx.font='800 '+kF+'px sans-serif';
        ctx.fillText(R.k, lxx+lw*0.035, ry+rh*0.66);
        if(on){ ctx.fillStyle=R.c; ctx.font='700 '+tF+'px sans-serif';
          ctx.fillText(R.t, lxx+lw*0.16, ry+rh*0.30);
          ctx.fillStyle=TXT; ctx.font=dF+'px sans-serif';
          ctx.fillText(R.l1, lxx+lw*0.16, ry+rh*0.57);
          ctx.fillText(R.l2, lxx+lw*0.16, ry+rh*0.83); }
        else { ctx.fillStyle=DIM; ctx.font=dF+'px sans-serif';
          ctx.fillText(['상황을 수치로','과제를 목표로','내가 한 조치','정량 결과'][i]+' — D키로 채웁니다', lxx+lw*0.16, ry+rh*0.60); } }
      // ─ 노출지수 게이지(오른쪽): EI = 농도 ÷ 기준, 실계산 값만 표시
      var gx=W*0.63, gw=W*0.31, sc=1.2;
      function XU(u){ return gx+gw*Math.min(u,sc)/sc; }
      ctx.textAlign='left'; ctx.fillStyle=TXT; ctx.font='600 '+tF+'px sans-serif';
      ctx.fillText('노출지수 EI = 농도 ÷ 기준', gx, H*0.455);
      var gy1=H*0.505, gy2=H*0.615, gh=H*0.042;
      ctx.fillStyle='rgba(223,238,251,0.10)'; rr(ctx,gx,gy1,gw,gh,4); ctx.fill(); rr(ctx,gx,gy2,gw,gh,4); ctx.fill();
      ctx.strokeStyle=RED; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(XU(1),gy1-H*0.02); ctx.lineTo(XU(1),gy2+gh+H*0.02); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=RED; ctx.font=FS(H,0.016,8,10)+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('1.0 초과선', XU(1), gy1-H*0.032);
      if(st>=2){ ctx.strokeStyle=AMB; ctx.setLineDash([3,4]); ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.moveTo(XU(0.5),gy1-H*0.012); ctx.lineTo(XU(0.5),gy2+gh+H*0.012); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=AMB; ctx.textAlign='center'; ctx.fillText('목표 0.5', XU(0.5), gy2+gh+H*0.042); }
      ctx.textAlign='left';
      if(st>=1){ ctx.fillStyle=AMB; rr(ctx,gx,gy1,XU(ei0)-gx,gh,4); ctx.fill();
        ctx.fillStyle=AMB; ctx.font='600 '+dF+'px sans-serif';
        ctx.fillText('개선 전 EI '+ei0.toFixed(2), gx, gy1-H*0.012); }
      if(st>=4){ ctx.fillStyle=GRN; rr(ctx,gx,gy2,XU(ei1)-gx,gh,4); ctx.fill();
        ctx.fillStyle=GRN; ctx.font='600 '+dF+'px sans-serif';
        ctx.fillText('개선 후 EI '+ei1.toFixed(2), gx, gy2-H*0.012);
        ctx.fillStyle=GRN; ctx.font='700 '+FS(H,0.024,11,15)+'px sans-serif';
        ctx.fillText('농도 저감률 '+red+'%', gx, H*0.745);
        ctx.fillStyle=DIM; ctx.font=FS(H,0.017,8,11)+'px sans-serif';
        ctx.fillText('수치로 닫는 경험담이 진짜 경력입니다', gx, H*0.785); }
      E.tapHint(0,0,'STAR 조각',true);
      var big=['경험 질문 — 위원이 가장 기다리는 순간','S 상황 — 숫자로 그립니다','T 과제 — 목표를 분명히','A 행동 — 주어는 "제가"','R 결과 — 정량으로 닫습니다'][st];
      var sub=['기술사 면접의 본론입니다. 두서없이 이야기하면 좋은 경험도 흐릿해집니다. STAR 네 칸에 담아 보세요 — D키로 조립합니다',
        '"도금 공정 6가크롬 미스트, 측정 결과 기준의 80% 수준이었습니다" — 상황을 수치로 말하는 순간 위원의 귀가 열립니다',
        '"노출지수를 0.5 이하로 낮추는 것이 과제였습니다" — 목표가 수치이면 결과도 수치로 검증할 수 있습니다',
        '"제가 후드에 플랜지를 보강하고 제어풍속을 복원했으며, 작업위치와 세정 절차를 표준화했습니다" — 팀이 아니라 내가 한 일을 말합니다',
        '"재측정 결과 노출지수 0.4, 농도 50% 저감, 특수건강진단 유소견자 0명이었습니다" — 게이지가 말해 주듯, 수치로 끝나는 답변이 신뢰를 만듭니다'][st];
      E.big(big, sub); }
  },

  // 10.4 판단·견해형 질문 — 원칙→근거→절충→결론 + 상가작용 실계산(각각 적합, 합은 초과)
  { id:'hyg10_04',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      qCard(E,'Q. 노출기준 이하인데 근로자가 증상을 호소합니다. 어떻게 하시겠습니까?');
      var rows=[
        {c:GRN, t:'① 원칙', l1:'기준 이하 ≠ 안전 보장', l2:'근로자 건강 우선 · 사전예방'},
        {c:BLU, t:'② 근거', l1:'기준 = "거의 모든 근로자" 수준', l2:'개인차 · 복합 노출(상가작용)'},
        {c:AMB, t:'③ 현실적 절충', l1:'개인시료 재측정 · 특수건강진단', l2:'그동안 작업방법·보호구 보완'},
        {c:ORA, t:'④ 결론', l1:'기준은 관리의 출발점', l2:'증상 호소 = 우선 조사 신호'}
      ];
      var lxx=W*0.05, lw=W*0.50, ry0=H*0.435, rh=H*0.100, rg=H*0.014;
      var tF=FS(H,0.020,9,12), dF=FS(H,0.017,8,11);
      for(var i=0;i<4;i++){ var R=rows[i], ry=ry0+i*(rh+rg), on=(st>=i+1);
        card(ctx,lxx,ry,lw,rh, on?R.c:'rgba(155,153,163,0.35)', on?undefined:'rgba(155,153,163,0.05)');
        ctx.textAlign='left';
        if(on){ ctx.fillStyle=R.c; ctx.font='700 '+tF+'px sans-serif';
          ctx.fillText(R.t, lxx+lw*0.045, ry+rh*0.30);
          ctx.fillStyle=TXT; ctx.font=dF+'px sans-serif';
          ctx.fillText(R.l1, lxx+lw*0.045, ry+rh*0.57);
          ctx.fillText(R.l2, lxx+lw*0.045, ry+rh*0.83); }
        else { ctx.fillStyle=DIM; ctx.font=dF+'px sans-serif';
          ctx.fillText(R.t+' — D키로 채웁니다', lxx+lw*0.045, ry+rh*0.60); } }
      if(st<2){
        // 딜레마 저울: 측정 수치 vs 사람의 증상
        var px=W*0.75, py2=H*0.55, bw=W*0.13;
        ctx.strokeStyle=DIM; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(px,py2); ctx.lineTo(px,py2+H*0.10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px-bw,py2-H*0.02); ctx.lineTo(px+bw,py2+H*0.02); ctx.stroke();
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px-bw,py2-H*0.02+H*0.045,FS(H,0.028,12,18),0,6.29); ctx.fill();
        ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(px+bw,py2+H*0.02+H*0.045,FS(H,0.028,12,18),0,6.29); ctx.fill();
        ctx.textAlign='center'; ctx.font='600 '+dF+'px sans-serif';
        ctx.fillStyle=BLU; ctx.fillText('수치는 적합', px-bw, py2+H*0.115);
        ctx.fillStyle=PNK; ctx.fillText('사람은 아픔', px+bw, py2+H*0.115);
        ctx.fillStyle=DIM; ctx.fillText('어느 쪽에 서겠습니까?', px, py2+H*0.165); }
      else {
        // 상가작용 계산 카드: 물질별 적합인데 합이 1 초과 — 전부 실계산
        var cA=30, tA=50, cB=100, tB=200;
        var rA=cA/tA, rB=cB/tB, ei=rA+rB;
        var gx=W*0.60, gw=W*0.34, sc=1.2;
        function XU(u){ return gx+gw*Math.min(u,sc)/sc; }
        ctx.textAlign='left'; ctx.fillStyle=TXT; ctx.font='600 '+tF+'px sans-serif';
        ctx.fillText('상가작용 — 각각은 적합, 합은?', gx, H*0.455);
        var items=[
          {t:'톨루엔 '+cA+'/'+tA, v:rA, c:BLU},
          {t:'MEK '+cB+'/'+tB,   v:rB, c:BLU},
          {t:'EI 합', v:ei, c:(ei>1?RED:GRN)}
        ];
        var gh=H*0.036;
        for(var k2=0;k2<3;k2++){ var it=items[k2], gy=H*0.50+k2*H*0.095;
          ctx.fillStyle=DIM; ctx.font=dF+'px sans-serif'; ctx.textAlign='left';
          ctx.fillText(it.t, gx, gy-H*0.010);
          ctx.fillStyle='rgba(223,238,251,0.10)'; rr(ctx,gx,gy,gw,gh,4); ctx.fill();
          ctx.fillStyle=it.c; rr(ctx,gx,gy,XU(it.v)-gx,gh,4); ctx.fill();
          ctx.fillStyle=it.c; ctx.font='600 '+dF+'px sans-serif';
          ctx.fillText(it.v.toFixed(2)+(k2===2?(ei>1?' > 1 → 초과':' ≤ 1 적합'):' (적합)'), gx+gw+W*0.012, gy+gh*0.75); }
        ctx.strokeStyle=RED; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(XU(1),H*0.485); ctx.lineTo(XU(1),H*0.50+2*H*0.095+gh+H*0.012); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font=FS(H,0.016,8,10)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('1.0', XU(1), H*0.50+2*H*0.095+gh+H*0.042);
        ctx.fillStyle=DIM; ctx.font=FS(H,0.017,8,11)+'px sans-serif'; ctx.textAlign='left';
        ctx.fillText('EI = C₁/T₁ + C₂/T₂ = '+rA.toFixed(2)+' + '+rB.toFixed(2)+' = '+ei.toFixed(2), gx, H*0.80);
        ctx.fillText('물질별 "적합"이 곧 안전은 아닙니다', gx, H*0.845); }
      E.tapHint(0,0,'판단 조각',true);
      var big=['정답 없는 질문 — 판단력을 봅니다','① 원칙 — 기준 이하는 안전 보장이 아닙니다','② 근거 — 왜 기준 이하인데 아플 수 있나','③ 현실적 절충 — 단계적으로 좁혀 갑니다','④ 결론 — 소신을 한 문장으로'][st];
      var sub=['측정 수치는 적합인데 사람은 아픕니다. 어느 쪽에 서겠습니까? 위원이 보는 것은 정답이 아니라 판단의 구조입니다. D키로 답을 세워 보세요',
        '노출기준 준수는 최소선이고, 근로자 건강 보호와 사전예방이 산업위생의 제1원칙입니다. 원칙을 먼저 선언하면 답변의 축이 섭니다',
        '노출기준은 "거의 모든 근로자"가 영향을 받지 않는 수준 — 모든 근로자가 아닙니다. 개인 감수성 차이가 있고, 오른쪽처럼 물질별로는 적합해도 상가작용 합은 초과일 수 있습니다',
        '개인시료 재측정과 특수건강진단으로 원인을 좁히고, 그동안 작업방법 개선·보호구로 노출을 줄입니다 — 원칙만 외치지 않고 실행 경로를 제시합니다',
        '"기준은 관리의 출발점이며, 증상 호소는 가장 우선하는 조사 신호로 다루겠습니다" — 근거 위에 선 소신이 판단·견해형의 모범답입니다'][st];
      E.big(big, sub); }
  },

  // 10.5 최종 정리 — D-day 체크리스트 + 전 10장 완주 경로 (탭 회고)
  { id:'hyg10_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      var tF=FS(H,0.021,9,13), dF=FS(H,0.017,8,11), sF=FS(H,0.015,7,10);
      // ─ 왼쪽: D-day 체크리스트(회고가 진행될수록 체크가 채워짐 — 체크 수 = 단계)
      var lxx=W*0.05, lw=W*0.38, ly0=H*0.335;
      ctx.textAlign='left'; ctx.fillStyle=AMB; ctx.font='700 '+tF+'px sans-serif';
      ctx.fillText('면접 D-day 체크리스트', lxx, ly0);
      var items=[
        {t:'최신 법규 개정 확인',    d:'중대재해처벌법 · 고시 개정'},
        {t:'사회 이슈 한 줄 견해',   d:'반도체 직업병 · 직업성 암'},
        {t:'본인 사례 3개 — STAR',  d:'수치로 요약해 소리 내기'},
        {t:'모의 구술 30분',        d:'두괄식 · 경청 · 정직 점검'}
      ];
      var ih=H*0.105, ig=H*0.018, bx=FS(H,0.020,9,13);
      for(var i=0;i<4;i++){ var it=items[i], iy=ly0+H*0.035+i*(ih+ig), done=(i<st);
        card(ctx,lxx,iy,lw,ih, done?GRN:'rgba(155,153,163,0.4)', done?'rgba(143,227,181,0.06)':undefined);
        ctx.strokeStyle=done?GRN:DIM; ctx.lineWidth=1.6;
        rr(ctx,lxx+lw*0.05,iy+ih*0.30,bx,bx,3); ctx.stroke();
        if(done){ ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.beginPath();
          ctx.moveTo(lxx+lw*0.05+bx*0.2, iy+ih*0.30+bx*0.55);
          ctx.lineTo(lxx+lw*0.05+bx*0.45, iy+ih*0.30+bx*0.85);
          ctx.lineTo(lxx+lw*0.05+bx*0.85, iy+ih*0.30+bx*0.15); ctx.stroke(); }
        ctx.textAlign='left';
        ctx.fillStyle=done?TXT:DIM; ctx.font='600 '+dF+'px sans-serif';
        ctx.fillText(it.t, lxx+lw*0.18, iy+ih*0.42);
        ctx.fillStyle=DIM; ctx.font=sF+'px sans-serif';
        ctx.fillText(it.d, lxx+lw*0.18, iy+ih*0.75); }
      // ─ 오른쪽: 완주 경로(1~10장) — 회고 단계마다 구간 점등
      var labels=['1 개론','2 환기','3 측정','4 소음','5 관리','6 물리','7 독성','8 법규','9 답안','10 면접'];
      var cols=[BLU,BLU,BLU,BLU,GRN,GRN,GRN,AMB,AMB,ORA];
      function lit(i2){ return (i2<4&&st>=1)||(i2>=4&&i2<7&&st>=2)||(i2>=7&&i2<9&&st>=3)||(i2===9&&st>=4); }
      var jx0=W*0.50, jx1=W*0.93, jy0=H*0.845, jy1=H*0.40;
      var pts=[];
      for(var n=0;n<10;n++){ var t=n/9;
        pts.push({ x:jx0+(jx1-jx0)*t, y:jy0+(jy1-jy0)*t + (n%2===0?0.020:-0.030)*H }); }
      ctx.strokeStyle='rgba(223,238,251,0.25)'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
      for(var p2=1;p2<10;p2++) ctx.lineTo(pts[p2].x,pts[p2].y); ctx.stroke();
      var nr=FS(H,0.013,5,9);
      for(var m=0;m<10;m++){ var P=pts[m], on=lit(m);
        ctx.fillStyle=on?cols[m]:'rgba(155,153,163,0.4)';
        ctx.beginPath(); ctx.arc(P.x,P.y,nr,0,6.29); ctx.fill();
        if(on){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(P.x,P.y,nr,0,6.29); ctx.stroke(); }
        ctx.fillStyle=on?cols[m]:DIM; ctx.font=(on?'600 ':'')+sF+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText(labels[m], P.x, P.y+(m%2===0? nr+sF+4 : -(nr+6))); }
      if(st>=4){ var FP=pts[9];
        ctx.strokeStyle=ORA; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(FP.x,FP.y-nr); ctx.lineTo(FP.x,FP.y-nr-H*0.055); ctx.stroke();
        ctx.fillStyle=ORA; ctx.beginPath();
        ctx.moveTo(FP.x,FP.y-nr-H*0.055); ctx.lineTo(FP.x+W*0.028,FP.y-nr-H*0.042); ctx.lineTo(FP.x,FP.y-nr-H*0.029);
        ctx.closePath(); ctx.fill();
        ctx.textAlign='center'; ctx.fillStyle=ORA; ctx.font='700 '+FS(H,0.024,11,15)+'px sans-serif';
        ctx.fillText('완주를 축하합니다 — 이제 당신의 경험이 답입니다', W*0.66, H*0.935); }
      E.tapHint(0,0,'다음 걸음',true);
      var big=['D-day 전날 — 마지막 점검','알다 — 유해인자와 만나다 (1~4장)','다루다 — 관리와 독성 (5~7장)','쓰다 — 제도와 답안 (8~9장)','말하다 — 면접, 그리고 완주'][st];
      var sub=['면접 전날은 새 이론을 넣는 날이 아니라 꺼내는 연습을 하는 날입니다. 최신 법규·이슈·본인 사례 3개를 소리 내어 정리하세요. D키로 여정을 되돌아봅니다',
        '개론에서 노출기준의 철학을, 산업환기에서 공학적 제어를, 측정·평가에서 숫자 읽는 법을, 소음·진동에서 물리 인자의 기초를 배웠습니다',
        '작업환경관리로 대책의 우선순위를, 물리적 유해인자와 독성학으로 유해요인이 인체에 닿는 메커니즘을 익혔습니다 — 지식이 판단으로 바뀐 구간입니다',
        '법규로 근거 조문을 갖추고, 답안 작성 훈련으로 아는 것을 답안지에 담는 법을 익혔습니다 — 종이 위의 실력은 준비되었습니다',
        '인지 → 측정 → 평가 → 관리 → 제도 → 답안 → 면접. 긴 여정을 완주하셨습니다. 면접장에서는 지식이 아니라 당신이 걸어온 현장이 답합니다. 합격을 응원합니다'][st];
      E.big(big, sub); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
