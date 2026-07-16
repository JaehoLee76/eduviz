/* 산업위생기술사 제21장 — 논술 기출 은행 Ⅱ : 산업환기 (동작만. 텍스트=content/hyg21.json)
   직전 20장(논술은행Ⅰ)과 같은 철학 — 산업환기 고빈출 논술주제 6종을 "답안 골격(두문·본문 논점·결론)+도해"로 제시한다.
   근거: 실제 산업위생관리기술사 산업환기 파트 기출 논술주제(서영민 외 「SMART 산업위생관리기술사」 대조, 출제율 50~200%).
         _content/산업위생기술사/산업위생기술사_20251006.docx 원문 대조(후드 종류·압력변화 그래프·상당직경 공식·
         공기정화장치 분류·원심력 송풍기 3형식·보충용 공기 10~15% 등 전부 원문 수치·정의와 일치 확인).
   골든룰: hyg21_03(상당직경)은 슬라이더 실계산. hyg21_04(공기정화장치 선정)·hyg21_05(송풍기 특성)·hyg21_06(보충용 공기)도
           슬라이더 입력값으로부터 draw에서 실시간 판정·계산한다. hyg21_01(후드 분류)·hyg21_02(압력변화)는 탭으로
           단계를 진행하되, 표시되는 수치(Dalla Valle 필요송풍량, 계통 압력값)는 고정 예시 상수로부터 공식을 통해
           draw에서 직접 계산한다(최종값 하드코딩 금지 — hyg20_04의 RWL 패턴과 동일 원칙).
   17·18장(계산은행)과의 구분: 17·18장은 문제를 "풀이"하지만, 21장은 개념·분류·원리를 논술 답안 골격으로 "서술"한다.
   18_04(덕트치수 설계계산)와 21_03(상당직경)의 차이: 18_04는 정사각형 환산 등 단면 설계 계산이고,
   21_03은 "수력학적 정의 vs 마찰손실 등가 정의"라는 두 상당직경의 의미 차이를 논술로 다룬다. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다(hyg18~20 ROW 그대로 이식). 반환값=소비한 세로높이. */
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

  var scenes=[

  /* ── 21.1 후드의 종류와 선정 (출제율 50%) ──
     포위식(부스식·글로브박스) > 외부식(슬롯·그리드·푸쉬풀) > 레시버식(캐노피·그라인더커버) — 포집효과 순서.
     외부식 필요송풍량(Dalla Valle 기본식) Q=60·Ve·(10X²+A)를 고정 예시(Ve=0.5m/s, X=0.3m, A=0.05m²)로 실계산해 보여준다.
     검산: Q=60×0.5×(10×0.3²+0.05)=30×(0.9+0.05)=30×0.95=28.5 m³/min. */
  { id:'hyg21_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var Ve=0.5, X=0.3, A=0.05;                       // Dalla Valle 예시 고정값(외부식 자유공간·플랜지 미부착)
      var Qdv=60*Ve*(10*X*X+A);                          // 필요송풍량(m³/min) — 매 프레임 실계산
      var STAGES=['① 분류 개요','② 포위식(가장 효과적)','③ 외부식(제어속도 개념)','④ 레시버식(관성 이용)'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'선정 원칙', v:'가능하면 포위식 → 불가능하면 외부식(발생원에 최대한 근접) → 방향성 있으면 레시버식', c:BLU},
          {k:'포집효과 순서', v:'포위식(부스식) > 외부식 > 레시버식', c:GRN}
        ];
        note='후드 형태는 작업형태·유해물질 발생특성·근로자와 발생원 사이 관계로 결정되며, 형태에 따라 포위식·외부식·레시버식 3종으로 구분합니다.';
      } else if(s.step===1){
        calc=[
          {k:'개방면 속도 = 제어속도', v:'후드 개구면에서 측정한 면속도가 곧 제어속도(가장 효과적인 형태)', c:GRN},
          {k:'cover type', v:'유해물질 제거효과 최대 · 분쇄·혼합·파쇄 공정', c:BLU},
          {k:'glove box type', v:'box 내부가 음압 형성 · 독성가스·방사성동위원소·발암물질 취급', c:PNK}
        ];
        note='발생원을 완전히 포위해 필요환기량을 최소화할 수 있는, 국소배기 후드 중 가장 효과적인 형태입니다.';
      } else if(s.step===2){
        calc=[
          {k:'Dalla Valle 기본식 Q=60·Ve·(10X²+A)', v:'예시: Ve=0.5m/s, X=0.3m, A=0.05m² (자유공간·플랜지無)', c:DIM},
          {k:'필요송풍량 Q', v:'60×0.5×(10×0.3²+0.05) = '+Qdv.toFixed(1)+' m³/min', c:ORA},
          {k:'플랜지 부착 효과', v:'동일 제어속도에서 필요송풍량 약 25% 절감(포집범위 확대)', c:GRN}
        ];
        note='발생원을 포위할 수 없을 때 발생원과 가장 가까운 위치에 설치하며, 거리(X)가 멀어질수록 필요송풍량이 급격히 늘어나는 것이 핵심 논점입니다.';
      } else {
        calc=[
          {k:'원리', v:'유해물질이 관성(방향성)을 가지고 발생 — 그 방향으로 후드를 위치시켜 포집', c:BLU},
          {k:'대표 예', v:'캐노피 후드(상승기류) · 그라인더 커버(회전 비산 방향)', c:GRN}
        ];
        note='포위식·외부식처럼 흡인력으로 끌어오는 것이 아니라, 오염물질 자체의 운동 방향을 이용해 받아내는 방식입니다.';
      }
      window.HygDoc(E,{
        title:'후드의 종류와 선정', sub:STAGES[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.06,y:0.28,w:0.26,h:0.17,c:hl(1,BLU),t:'① 포위식',s:'부스식·글로브박스'},
          {x:0.375,y:0.28,w:0.26,h:0.17,c:hl(2,GRN),t:'② 외부식',s:'슬롯·그리드·푸쉬풀'},
          {x:0.69,y:0.28,w:0.26,h:0.17,c:hl(3,PNK),t:'③ 레시버식',s:'캐노피·그라인더커버'}
        ],
        arrows:[
          {x1:0.32,y1:0.365,x2:0.373,y2:0.365},
          {x1:0.635,y1:0.365,x2:0.688,y2:0.365}
        ],
        calc:calc,
        note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 21.2 국소배기장치 계통의 압력변화 (출제율 70%) ──
     후드→덕트→공기정화장치→송풍기→배출구 7개 지점에서 SP(정압)·VP(속도압)·TP(전압=SP+VP)를 실계산해 선그래프로 보여준다.
     상수: Fh=0.93(후드 유입손실계수, 평판형) · V=20m/s(반송속도, 고정) · VP=(V/4.043)²
     검산: VP=(20/4.043)²≈24.47, SP①(후드직후)=-(1+0.93)×24.47≈-47.23, TP①=-Fh×VP≈-22.76,
           송풍기 후 TP=TP④+250(팬 전압상승, 고정)≈142.4, 배출덕트 길이는 SP가 정확히 0으로 닫히도록 역산(derived). */
  { id:'hyg21_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Fh=0.93, V=20, VP=(V/4.043)*(V/4.043);
      var fric=0.42;              // 덕트 마찰손실률(mmH2O/m, 고정)
      var ductLen1=25, cleanerDrop=68, ductLen2=15, fanRiseTP=250;
      var SP=[0], VPa=[0], TPa=[0];
      SP.push(-(1+Fh)*VP); VPa.push(VP); TPa.push(SP[1]+VPa[1]);                              // ①후드 통과직후
      SP.push(SP[1]-fric*ductLen1); VPa.push(VP); TPa.push(SP[2]+VPa[2]);                       // ②공기정화장치 직전
      SP.push(SP[2]-cleanerDrop); VPa.push(VP); TPa.push(SP[3]+VPa[3]);                         // ③공기정화장치 통과 후
      SP.push(SP[3]-fric*ductLen2); VPa.push(VP); TPa.push(SP[4]+VPa[4]);                       // ④송풍기 흡입 직전
      var TP5=TPa[4]+fanRiseTP; VPa.push(VP); SP.push(TP5-VP); TPa.push(TP5);                   // ⑤송풍기 통과 직후
      var ductLen3=SP[5]/fric;                                                                    // SP가 0으로 닫히도록 역산(길이=압력÷손실률)
      SP.push(SP[5]-fric*ductLen3); VPa.push(VP); TPa.push(SP[6]+VPa[6]);                       // ⑥배출구(대기 배출점)
      var LABELS=['① 대기(후드 진입 전)','② 후드 통과 직후','③ 공기정화장치 직전','④ 공기정화장치 통과 후','⑤ 송풍기 흡입 직전','⑥ 송풍기 통과 직후','⑦ 배출구(대기 배출점)'];
      // 데이터 6개(SP·VPa·TPa 배열길이6)에 LABELS 7개가 어긋나지 않도록 재정렬: index0=대기(SP=0,VP=0,TP=0)는 이미 배열 첫원소
      var idx=s.step;
      // ★캔버스 실높이가 작아(hyg17_06/hyg18 주석 참조 표준 ≈235~295px) 차트+범례+수치+설명을 전부 압축 배치한다.
      //   전체 세로예산(H 비율 합)이 1.0을 넘지 않도록 각 블록을 좁게 잡고, 수치는 ROW카드 대신 한 줄 텍스트로 압축.
      var y0=H*0.145, chH=H*0.25, chY=y0, chX=W*0.10, chW=W*0.80;
      var allV=SP.concat(TPa).concat(VPa); var mx=Math.max.apply(null,allV.map(Math.abs))*1.15;
      function px(i){ return chX+chW*(i/6); }
      function py(v){ return chY+chH*0.5-(v/mx)*(chH*0.5); }
      T(ctx,'국소배기 계통 지점별 SP·VP·TP (mmH₂O, V='+V+'m/s 고정)',W*0.5,H*0.095,DIM,FS(H,0.02,8,11),'center');
      // 0선
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(chX,py(0)); ctx.lineTo(chX+chW,py(0)); ctx.stroke();
      T(ctx,'0',chX-6,py(0)+4,DIM,FS(H,0.016,7,9),'right');
      function line(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        for(var i=0;i<7;i++){ var x=px(i),y=py(arr[i]); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
        for(var i2=0;i2<7;i2++){ var x2=px(i2),y2=py(arr[i2]); ctx.fillStyle=(i2===idx)?TXT:col;
          ctx.beginPath(); ctx.arc(x2,y2,i2===idx?5:3,0,7); ctx.fill(); } ctx.lineWidth=1; }
      line(SP,ORA); line(VPa,BLU); line(TPa,GRN);
      var legY=chY+chH+FS(H,0.025,8,13);
      T(ctx,'● SP 정압',chX,legY,ORA,FS(H,0.018,7,10),'left');
      T(ctx,'● VP 속도압',chX+W*0.16,legY,BLU,FS(H,0.018,7,10),'left');
      T(ctx,'● TP 전압(=SP+VP)',chX+W*0.32,legY,GRN,FS(H,0.018,7,10),'left');
      // 현재 지점 세로 마커
      ctx.strokeStyle='rgba(255,178,122,0.35)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(px(idx),chY); ctx.lineTo(px(idx),chY+chH); ctx.stroke(); ctx.setLineDash([]);

      var y=legY+FS(H,0.045,14,20);
      T(ctx,'현재 지점: '+LABELS[idx],chX,y,TXT,FS(H,0.024,10,13),'left','700');
      y+=FS(H,0.04,12,18);
      T(ctx,'SP '+SP[idx].toFixed(2)+' mmH₂O   ·   VP '+VPa[idx].toFixed(2)+' mmH₂O   ·   TP '+TPa[idx].toFixed(2)+' mmH₂O',
        chX,y,GRN,FS(H,0.023,9,12),'left','600');
      y+=FS(H,0.05,15,22);
      var notes=[
        '대기 상태이므로 SP=VP=TP=0입니다. 탭하면 이 정지된 공기가 후드로 빨려 들어가기 시작합니다.',
        '정지된 공기가 후드로 빨려 들어가며 후드 유입손실만큼 SP가 급격히 "−"로 떨어지고, VP는 0에서 서서히 증가해 덕트 시작부터 일정해집니다.',
        '직선 덕트 구간에서는 마찰손실이 누적되어 SP가 완만하게 계속 감소하고, 덕트 직경이 일정하므로 VP는 변하지 않습니다.',
        '공기정화장치 내부는 유동단면이 커지고 오염물질 제거 기작(회전·차단·여과)으로 압력손실이 크게 발생 — 통과 후 SP가 큰 폭으로 더 떨어집니다.',
        '공기정화장치~송풍기 사이 덕트에서도 마찰손실이 누적되어 SP가 한 번 더 감소합니다 — 이 지점이 계통 전체에서 SP가 가장 낮은(음압이 가장 큰) 지점입니다.',
        '송풍기가 외부 동력으로 전압(TP)을 큰 폭으로 끌어올려 SP가 "−"에서 "+"로 뒤바뀝니다 — 송풍기 전후의 SP 차이가 곧 송풍기가 감당해야 하는 전압상승분입니다.',
        '배출덕트의 마찰손실로 SP가 다시 감소하며, 배출구에서는 대기압과 같아져 SP가 정확히 0으로 수렴합니다(VP는 배출과 동시에 대기 중 난류로 소산).'
      ];
      T(ctx,notes[idx]||notes[0],W*0.08,y,DIM,FS(H,0.021,9,12),'left');

      E.tapHint(0,0,'화면 탭 = 다음 지점',true);
    }
  },

  /* ── 21.3 상당직경(등가직경, equivalent diameter) — 출제율 200%, 최고빈출 — ★골든룰 슬라이더 실계산 ──
     정의①(수력학적 상당직경): 사각형관과 동일한 유체역학적 특성(유속분포)을 갖는 원형관의 직경. de=2ab/(a+b) (4×단면적/둘레)
     정의②(마찰 등가직경, ASHRAE): 사각형관과 마찰손실이 동등한 원형관의 직경. de=1.3(ab)^0.625/(a+b)^0.25
     검산(a=0.3m, b=0.2m): de①=2×0.06/0.5=0.24m, de②=1.3×0.06^0.625/0.5^0.25≈0.2664m (마찰 등가직경이 더 큼 — 소수점만
     다른 게 아니라 정의 자체가 달라 값이 다르다는 점이 논술 채점 포인트). */
  { id:'hyg21_03',
    enter:function(E){ var self=this; this.s={a:30,b:20};
      E.controls('<div class="ctrl"><label>장변 a (cm)</label><input type="range" id="q3a" min="10" max="100" step="1" value="30"><output id="q3ao">30</output></div>'
        +'<div class="ctrl"><label>단변 b (cm)</label><input type="range" id="q3b" min="10" max="100" step="1" value="20"><output id="q3bo">20</output></div>');
      E.bind('#q3a','input',function(e){ self.s.a=+e.target.value; document.getElementById('q3ao').textContent=e.target.value; });
      E.bind('#q3b','input',function(e){ self.s.b=+e.target.value; document.getElementById('q3bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var a=s.a/100, b=s.b/100;                                          // cm→m
      var de1=2*a*b/(a+b);                                               // 수력학적 상당직경
      var de2=1.3*Math.pow(a*b,0.625)/Math.pow(a+b,0.25);                // 마찰 등가직경(ASHRAE)
      var diff=de2-de1, diffPct=de1>0? (diff/de1*100) : 0;
      var y=H*0.17;
      T(ctx,'사각(장방형) 덕트 a×b='+s.a+'×'+s.b+'cm — 두 정의의 상당직경을 동시에 계산합니다',W*0.06,y,DIM,FS(H,0.022,9,12),'left');
      y+=FS(H,0.05,16,24);

      // 단면 도해: 사각형 vs 두 원형(비례 스케일)
      var boxX=W*0.08, boxY=y, boxMaxW=W*0.30, boxMaxH=H*0.22, scl=Math.min(boxMaxW/Math.max(a,b),boxMaxH/Math.max(a,b))*0.85;
      var rw=a*scl, rh=b*scl;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.6;
      RR(ctx,boxX+(boxMaxW-rw)/2, boxY+(boxMaxH-rh)/2, rw, rh, 3); ctx.fill(); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'장방형 a×b',boxX+boxMaxW/2,boxY+boxMaxH+FS(H,0.026,10,14),BLU,FS(H,0.021,9,12),'center');

      var c1x=W*0.44, c2x=W*0.68, cy=boxY+boxMaxH/2, maxR=Math.min(W*0.11,boxMaxH/2)*0.9;
      var rScl=maxR/Math.max(de1,de2)*2;
      ctx.fillStyle='rgba(255,178,122,0.12)'; ctx.strokeStyle=ORA; ctx.beginPath(); ctx.arc(c1x,cy,de1*rScl/2,0,7); ctx.fill(); ctx.stroke();
      T(ctx,'de①(수력학적)',c1x,boxY+boxMaxH+FS(H,0.026,10,14),ORA,FS(H,0.021,9,12),'center');
      ctx.fillStyle='rgba(143,227,181,0.12)'; ctx.strokeStyle=GRN; ctx.beginPath(); ctx.arc(c2x,cy,de2*rScl/2,0,7); ctx.fill(); ctx.stroke();
      T(ctx,'de②(마찰 등가)',c2x,boxY+boxMaxH+FS(H,0.026,10,14),GRN,FS(H,0.021,9,12),'center');

      y=boxY+boxMaxH+FS(H,0.09,26,36);
      var rows=[
        ['① 수력학적 상당직경  de=2ab/(a+b)', '2×'+a.toFixed(2)+'×'+b.toFixed(2)+'/('+a.toFixed(2)+'+'+b.toFixed(2)+') = '+de1.toFixed(4)+' m', ORA],
        ['② 마찰 등가직경(ASHRAE)  de=1.3(ab)^0.625/(a+b)^0.25', '≈ '+de2.toFixed(4)+' m', GRN],
        ['차이(②−①)', diff.toFixed(4)+' m  ('+(diffPct>=0?'+':'')+diffPct.toFixed(1)+'%, 정의가 달라 항상 값도 다름)', diff>=0?AMB:RED]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.025,8,14);
      T(ctx,'①은 "단면적 4배÷둘레"(수력반경×4)로 유속분포가 같은 원형관을 찾는 정의, ②는 "마찰손실이 같은" 원형관을 찾는 정의 — 목적이 다르므로 항상 값이 다릅니다.',
        W*0.06,y,DIM,FS(H,0.02,8.5,11.5),'left');

      E.tapHint(0,0,'슬라이더로 장변 a·단변 b 조절',true);
      E.big('de① '+de1.toFixed(3)+'m  vs  de② '+de2.toFixed(3)+'m',
            '같은 사각덕트인데 "무엇을 같게 만들 것이냐"(유속분포냐 마찰손실이냐)에 따라 상당직경이 달라진다는 점이 이 논술 주제의 핵심입니다.'); }
  },

  /* ── 21.4 공기정화장치(집진장치) 종류·원리·선정 (출제율 50%) ──
     건식(중력침강실·관성력·원심력 cyclone·여과 bag filter·전기집진 EP) + 습식(세정 scrubber)
     입자직경 슬라이더로 각 장치의 통상 적용범위(㎛)와 대조해 적합 여부를 실시간 판정한다. */
  { id:'hyg21_04',
    enter:function(E){ var self=this; this.s={dp:5};
      E.controls('<div class="ctrl"><label>입자 직경 (㎛)</label><input type="range" id="q4a" min="0.01" max="200" step="0.01" value="5"><output id="q4ao">5.00</output></div>');
      E.bind('#q4a','input',function(e){ self.s.dp=+e.target.value; document.getElementById('q4ao').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, dp=s.dp;
      var DEVICES=[
        {t:'중력침강실', rng:[50,1000], c:BLU, note:'가장 간단 · 자중 낙하 · 조대입자 전처리용'},
        {t:'관성력집진장치', rng:[10,100], c:GRN, note:'장애물로 급격한 방향전환 → 관성으로 침강'},
        {t:'원심력집진(Cyclone)', rng:[3,100], c:PNK, note:'회전 원심력 이용 · 전처리장치로 후단 효율 보완'},
        {t:'여과집진(Bag filter)', rng:[0.1,20], c:AMB, note:'여과포 통과 · 미세입자에도 고효율'},
        {t:'전기집진장치(EP)', rng:[0.01,10], c:ORA, note:'코로나 방전 대전 → 집진극 포집 · 최미세입자·저압손실'},
        {t:'세정집진(Scrubber)', rng:[0.1,50], c:'#7ee0b0', note:'액적·액막·기포로 세정 · 점착성·가연성 분진에 유리'}
      ];
      // ★6행 목록 전체가 캔버스 실높이(≈235~295px) 안에 들어오도록 rowH·gap을 좁게 잡는다(hyg21_02와 동일 교정 원칙).
      var y=H*0.11;
      T(ctx,'건식(중력·관성·원심·여과·전기) + 습식(세정) — 입자직경 '+dp.toFixed(2)+'㎛에 적합한 장치를 실시간 판정합니다',W*0.06,y,DIM,FS(H,0.02,8,11),'left');
      y+=FS(H,0.035,10,15);
      var rowH=FS(H,0.078,20,26), gap=FS(H,0.007,2,4);
      for(var i=0;i<DEVICES.length;i++){ var D=DEVICES[i], ok=(dp>=D.rng[0]&&dp<=D.rng[1]);
        var by=y+i*(rowH+gap);
        ctx.fillStyle=ok?'rgba(143,227,181,0.12)':'rgba(255,255,255,0.03)'; ctx.strokeStyle=ok?GRN:D.c;
        RR(ctx,W*0.06,by,W*0.88,rowH,6); ctx.fill(); ctx.stroke();
        var fs1=FS(H,0.021,9,12), fs2=FS(H,0.017,7,9.5);
        T(ctx,(ok?'✓ ':'· ')+D.t,W*0.08,by+rowH*0.4,ok?GRN:TXT,fs1,'left','700');
        T(ctx,'적용범위 '+D.rng[0]+'~'+D.rng[1]+'㎛ · '+D.note,W*0.08,by+rowH*0.78,DIM,fs2,'left');
        T(ctx,ok?'적합':'범위 밖',W*0.90,by+rowH*0.56,ok?GRN:DIM,fs1,'right','700');
      }
      y+=DEVICES.length*(rowH+gap)+FS(H,0.018,5,10);
      T(ctx,'선정 시 추가 고려요인: 오염물질 농도·처리가스 유량/온도/습도·집진효율 요구수준·부착성/응집성/전기저항·에너지비용·분진 처분방법',
        W*0.06,y,DIM,FS(H,0.018,7.5,10),'left');

      E.tapHint(0,0,'슬라이더로 입자직경 조절',true);
      E.big('입자 '+dp.toFixed(2)+'㎛ → 적합 장치 '+DEVICES.filter(function(D){return dp>=D.rng[0]&&dp<=D.rng[1];}).length+'종',
            '입자가 작아질수록(왼쪽으로) 전기집진·여과집진처럼 정전기·미세여과 원리 장치가, 커질수록(오른쪽으로) 중력·관성처럼 단순 물리력 장치가 유리해집니다.'); }
  },

  /* ── 21.5 원심력 송풍기의 종류와 특성 (출제율 50%) ──
     다익형(시로코, 전향날개, 저압·대풍량, 과부하 위험) · 평판형(방사형, 자기청소, 고농도 분진) · 터보형(후향/익형, 고압·고효율·비과부하)
     풍량비율 슬라이더로 3형식의 소요동력 곡선을 동시에 그려, "터보형만 한계부하(비과부하) 특성을 가진다"는 논점을 실계산으로 보여준다. */
  { id:'hyg21_05',
    enter:function(E){ var self=this; this.s={qr:100};
      E.controls('<div class="ctrl"><label>풍량 비율 (정격 대비 %)</label><input type="range" id="q5a" min="10" max="150" step="1" value="100"><output id="q5ao">100</output></div>');
      E.bind('#q5a','input',function(e){ self.s.qr=+e.target.value; document.getElementById('q5ao').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var q=s.qr/100;
      var pMulti=100*Math.pow(q,2.3);                                    // 다익형: 동력이 풍량에 계속 급격히 증가(과부하 위험)
      var pRadial=88*Math.pow(q,1.9);                                    // 평판형(방사형): 다익형보다 완만
      var pTurboRaw=100*(1-Math.pow((q-0.65)/0.65,2));
      var pTurbo=Math.max(4,pTurboRaw);                                  // 터보형(후향): 65%부근 정점 후 감소(한계부하)
      var y=H*0.16;
      T(ctx,'풍량비율 '+s.qr+'% 에서 3형식의 소요동력(상대값)을 동시에 계산합니다',W*0.06,y,DIM,FS(H,0.022,9,12),'left');
      y+=FS(H,0.045,14,20);

      var chX=W*0.10, chW=W*0.80, chY=y, chH=H*0.30;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(chX,chY); ctx.lineTo(chX,chY+chH); ctx.lineTo(chX+chW,chY+chH); ctx.stroke();
      T(ctx,'동력',chX-FS(H,0.03,8,14),chY+8,DIM,FS(H,0.02,8,11),'right');
      T(ctx,'풍량%→',chX+chW,chY+chH+FS(H,0.028,10,15),DIM,FS(H,0.02,8,11),'right');
      var maxP=Math.max(pMulti,180);
      function px(qq){ return chX+chW*(qq-0.1)/1.4; }
      function py(p){ return chY+chH-(p/maxP)*chH; }
      function curve(fn,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        for(var i=0;i<=56;i++){ var qq=0.1+1.4*i/56, p=fn(qq); var x=px(qq),yy=py(Math.min(p,maxP));
          if(i===0)ctx.moveTo(x,yy); else ctx.lineTo(x,yy); } ctx.stroke(); ctx.lineWidth=1; }
      curve(function(qq){return 100*Math.pow(qq,2.3);}, RED);
      curve(function(qq){return 88*Math.pow(qq,1.9);}, AMB);
      curve(function(qq){return Math.max(4,100*(1-Math.pow((qq-0.65)/0.65,2)));}, GRN);
      var mx=px(q); ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(mx,chY); ctx.lineTo(mx,chY+chH); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'● 다익형(과부하 위험)',chX,chY+chH+FS(H,0.05,16,24),RED,FS(H,0.019,8,11),'left');
      T(ctx,'● 평판형(방사형)',chX+W*0.24,chY+chH+FS(H,0.05,16,24),AMB,FS(H,0.019,8,11),'left');
      T(ctx,'● 터보형(후향/익형, 한계부하)',chX+W*0.44,chY+chH+FS(H,0.05,16,24),GRN,FS(H,0.019,8,11),'left');

      y=chY+chH+FS(H,0.09,26,36);
      var rows=[
        ['다익형(시로코) — 현재 상대동력', pMulti.toFixed(1)+' (풍량 증가에 비례해 계속 급증)', RED],
        ['평판형(방사형) — 현재 상대동력', pRadial.toFixed(1)+' (자기청소, 고농도 분진용)', AMB],
        ['터보형(후향/익형) — 현재 상대동력', pTurbo.toFixed(1)+' (65% 부근 정점 후 감소 = 비과부하 특성)', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.02,6,12);
      T(ctx,'다익형=저압·대풍량(전체환기·공조용), 터보형(후향/익형)=고압·최고효율·정압변동에도 과부하 없음, 방사형=마모성·고농도 분진 이송 전용',
        W*0.06,y,DIM,FS(H,0.02,8.5,11.5),'left');

      E.tapHint(0,0,'슬라이더로 풍량 비율 조절',true);
      E.big('풍량 '+s.qr+'% → 다익형 동력 '+pMulti.toFixed(0)+' vs 터보형 '+pTurbo.toFixed(0),
            '풍량이 늘어날수록 다익형은 동력이 끝없이 치솟아 과부하되지만, 터보형(후향날개)은 어느 지점부터 동력이 오히려 줄어들어 큰 동력의 산업용 국소배기에 널리 쓰입니다.'); }
  },

  /* ── 21.6 보충용 공기(Make-up Air)·국소배기 우선 원칙 (출제율 50%) ──
     배기량의 약 110~115%를 청정 외기로 보충해 실내를 약간의 양압으로 유지. 급기위치=바닥 2.4~3m, 계절별 급기온도. */
  { id:'hyg21_06',
    enter:function(E){ var self=this; this.s={Qexh:200, season:0};
      E.controls('<div class="ctrl"><label>국소배기 배출량 (m³/min)</label><input type="range" id="q6a" min="20" max="600" step="10" value="200"><output id="q6ao">200</output></div>'
        +'<div class="ctrl"><label>계절</label><input type="range" id="q6b" min="0" max="1" step="1" value="0"><output id="q6bo">겨울</output></div>');
      E.bind('#q6a','input',function(e){ self.s.Qexh=+e.target.value; document.getElementById('q6ao').textContent=e.target.value; });
      E.bind('#q6b','input',function(e){ self.s.season=+e.target.value; document.getElementById('q6bo').textContent=(+e.target.value===0?'겨울':'여름'); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Qmin=s.Qexh*1.10, Qmax=s.Qexh*1.15;                            // 배기량의 10~15% 여유(원문 기준)
      var winter=s.season===0;
      var y=H*0.18;
      T(ctx,'국소배기가 뽑아낸 만큼의 청정 외기를 보충하지 않으면 실내가 음압이 되어, 문틈으로 오염된 옆 공정의 공기가 역류합니다',
        W*0.06,y,DIM,FS(H,0.021,9,12),'left');
      y+=FS(H,0.05,16,22);

      var bx=W*0.06, bw=W*0.88, bh=FS(H,0.10,32,44);
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; RR(ctx,bx,y,bw,bh,8); ctx.fill(); ctx.stroke();
      T(ctx,'배기량(Q_exhaust) = '+s.Qexh+' m³/min',bx+W*0.02,y+bh*0.42,TXT,FS(H,0.026,11,15),'left','600');
      T(ctx,'권장 보충량 = 배기량×(1.10~1.15) = '+Qmin.toFixed(0)+' ~ '+Qmax.toFixed(0)+' m³/min',bx+W*0.02,y+bh*0.78,BLU,FS(H,0.023,10,13),'left','700');
      y+=bh+FS(H,0.045,14,20);

      var rows=[
        ['보충량 범위(배기량의 10~15% 여유)', Qmin.toFixed(0)+' ~ '+Qmax.toFixed(0)+' m³/min → 실내 약한 양압 유지', GRN],
        ['보충용 공기 유입위치', '바닥으로부터 2.4~3m 높이(근로자 작업영역)', BLU],
        ['급기 온도('+(winter?'겨울':'여름')+')', winter? '18~20℃ 가온(고열원 밀집 시 15.6℃, 필요시 12.8℃까지 저하 가능)' : '외기 그대로 공급(열부하가 크면 냉각 후 공급)', AMB],
        ['분배 방식', '다점분배(균일 대량공급) vs 일점분배(배플로 재유입 최소화)', DIM]
      ];
      var rowsH=ROW(ctx,W,H,bx,y,bw,rows);
      y+=rowsH+FS(H,0.03,10,16);
      T(ctx,'국소배기 우선 원칙: 오염원 근접 포집(국소배기)이 실내 전체 공기를 희석하는 전체환기보다 필요환기량이 훨씬 적고 효율적입니다 — 보충용 공기는 그 국소배기가 정상 작동하기 위한 전제조건입니다.',
        bx,y,DIM,FS(H,0.021,9,12),'left');

      E.tapHint(0,0,'슬라이더로 배출량·계절 조절',true);
      E.big('배기 '+s.Qexh+' → 보충 '+Qmin.toFixed(0)+'~'+Qmax.toFixed(0)+' m³/min',
            '보충량이 배기량보다 적으면 실내가 음압이 되어 오염공기가 역류하고, 반대로 지나치게 많으면 과잉 냉난방 비용이 발생합니다 — 10~15% 여유가 그 균형점입니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
