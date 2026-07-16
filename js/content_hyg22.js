/* 산업위생기술사 제22장 — 논술 기출 은행 Ⅲ : 작업환경측정과 평가 (동작만. 텍스트=content/hyg22.json)
   20·21장(논술은행Ⅰ·Ⅱ)과 같은 철학 — 작업환경측정·평가 고빈출 논술주제를 "답안 골격(두문·본문 논점·결론)+도해"로 제시한다.
   근거: _content/산업위생기술사/산업위생기술사_20251006.docx 원문 대조(탈착효율 정의·산출식/GC 검출기 FID·ECD·FPD 원리·특징/
         IDL·MDL·PQL 정의/기하평균·기하표준편차·대수정규분포/능동식·수동식 원리/흡착관·임핀저·여과지·사이클론) +
         /tmp/essay_topics.txt 고빈출표(채취기구60%·수동식50%·탈착효율50%·회수율50%·GC검출기40%·LOQ30%).
   7번째 장면(hyg22_07)은 서브노트(복원 요령) — 캔버스는 6대 토픽 골격 한 장, 학습패널(more)에 복원 순서·암기법을 담는다.
   골든룰: hyg22_03(DE 보정)·hyg22_05(LOD/LOQ)·hyg22_06(TWA)은 슬라이더 실계산. 나머지 4장면(01·02·04·07)도 탭 단계마다
           표시되는 수치(채취량 V=Q×t, 분할채취 시간, DE·LOD·LOQ·GM·GSD 예시값)는 고정 상수로부터 draw에서 직접 계산한다
           (hyg21_01의 Dalla Valle 패턴과 동일 원칙 — 최종값 하드코딩 금지).
   겹침 방지: 박스 텍스트는 HygDoc의 fitFont(측정→축소)를 그대로 사용, calc 배열은 HygDoc의 자동 줄바꿈(lines)을 사용,
             ROW 카드는 누적커서(cy+=blockH+rowGap)로 쌓아 겹침이 구조적으로 불가능하다. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다(hyg18~21 ROW 그대로 이식). 반환값=소비한 세로높이. */
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

  // 22.6 TWA/GM/GSD 예시 고정 배열(5개 측정값) — 검산: ln평균→GM=exp(mean(ln))≈10.008, 표본표준편차(n-1)→GSD=exp(sd(ln))≈1.348
  var GSAMPLES=[8.2,11.5,9.8,15.3,7.1];
  function calcGMGSD(arr){
    var n=arr.length, i, lns=[], sum=0;
    for(i=0;i<n;i++){ lns.push(Math.log(arr[i])); sum+=lns[i]; }
    var mean=sum/n, GM=Math.exp(mean), sq=0;
    for(i=0;i<n;i++){ sq+=(lns[i]-mean)*(lns[i]-mean); }
    var sd=Math.sqrt(sq/(n-1)), GSD=Math.exp(sd);
    return {GM:GM, GSD:GSD};
  }

  var scenes=[

  /* ── 22.1 작업환경측정의 목적과 절차 (출제율 30%) ──
     측정주기(원칙 6개월1회 · 발암성 등 특별관리물질 초과사업장 3개월1회) · 절차(예비조사→시료채취→분석→평가) ·
     근로자대표 입회·결과공지·초과시 개선. 골든룰: 1회 채취시간 30분 이상·6시간초과시 분할 규칙을 고정 예시(6.5h)로 실계산. */
  { id:'hyg22_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 목적·대상','② 측정주기','③ 측정절차','④ 입회·후속조치'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'목적', v:'근로자 노출수준을 정량 평가해 유해인자를 사전에 통제하기 위함', c:BLU},
          {k:'측정대상', v:'분진·유기화합물·금속 등 화학적 인자, 소음 등 물리적 인자에 노출되는 공정', c:GRN}
        ];
        note='시험포인트: 작업환경측정은 산업위생 4대 관리(예측·인지·평가·관리) 중 "평가" 단계를 실제로 수행하는 실행수단이라는 위치를 먼저 짚어야 합니다.';
      } else if(s.step===1){
        calc=[
          {k:'정기측정 원칙', v:'6개월에 1회 이상', c:BLU},
          {k:'단축 주기(발암성물질 등 특별관리물질 초과사업장)', v:'3개월에 1회 이상', c:RED},
          {k:'신규 공정 가동', v:'가동 후 일정기간 내 최초측정 실시, 이후 정기측정으로 편입', c:DIM}
        ];
        note='시험포인트: "왜 발암성물질은 주기가 짧은가" — 만성·비가역적 건강영향 물질일수록 노출추이를 더 촘촘히 감시해야 하기 때문이라는 논리를 답안에 명시합니다.';
      } else if(s.step===2){
        var Ttotal=6.5, maxSingle=6, nSplit=Ttotal>maxSingle?Math.ceil(Ttotal/maxSingle):1, perSeg=Ttotal/nSplit, minReq=0.5;
        var ok=perSeg>=minReq;
        calc=[
          {k:'절차 순서', v:'예비조사(공정·유해인자·측정지점 확정) → 시료채취 → 분석 → 평가', c:BLU},
          {k:'분할채취 판정 예시: 필요채취시간 '+Ttotal+'h (> 6h 기준)', v:nSplit+'회로 분할 → 1회 '+(perSeg*60).toFixed(0)+'분 ('+(ok?'30분 이상 기준 충족':'기준 미달')+')', c:ok?GRN:RED}
        ];
        note='시험포인트: 1회 시료채취는 원칙적으로 30분 이상 연속으로, 6시간을 초과하면 등간격으로 나누어 채취합니다 — 순간값이 아닌 "대표성 있는" 노출을 재기 위함입니다.';
      } else {
        calc=[
          {k:'근로자대표 요구 시', v:'입회를 요청할 수 있으며, 사업주는 정당한 사유 없이 거부할 수 없음', c:BLU},
          {k:'결과 공지·보존', v:'근로자에게 결과를 설명·게시하고, 측정결과는 일정기간 보존', c:GRN},
          {k:'기준 초과 시', v:'시설·설비 개선, 건강진단 등 근로자 건강보호 조치로 이어짐', c:RED}
        ];
        note='시험포인트: 측정은 "재는 것"으로 끝나지 않고 초과 시 개선까지 이어져야 완결됩니다 — 20장 위험성평가 절차(예측→인지→평가→관리)와 동일한 순환 논리로 결론을 맺습니다.';
      }
      window.HygDoc(E,{
        title:'작업환경측정의 목적과 절차', sub:STAGES[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.03,y:0.28,w:0.22,h:0.17,c:hl(0,BLU),t:'①목적·대상'},
          {x:0.27,y:0.28,w:0.22,h:0.17,c:hl(1,GRN),t:'②측정주기'},
          {x:0.51,y:0.28,w:0.22,h:0.17,c:hl(2,PNK),t:'③측정절차'},
          {x:0.75,y:0.28,w:0.22,h:0.17,c:hl(3,AMB),t:'④입회·후속'}
        ],
        arrows:[
          {x1:0.255,y1:0.365,x2:0.268,y2:0.365},
          {x1:0.495,y1:0.365,x2:0.508,y2:0.365},
          {x1:0.735,y1:0.365,x2:0.748,y2:0.365}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 22.2 시료채취 방법 — 능동식 vs 수동식, 가스상 vs 입자상 매체 (출제율 60%, 최고빈출) ──
     골든룰: 능동식 채취량 V=Q×t를 고정 예시(Q=0.2L/min, t=480min)로 실계산. */
  { id:'hyg22_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 능동식','② 수동식','③ 가스상 매체','④ 입자상 매체'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        var Q=0.2, t=480, V=Q*t;
        calc=[
          {k:'원리', v:'시료채취 펌프로 공기를 강제로 흡인해 매체를 통과시킴', c:BLU},
          {k:'채취량 V=Q×t (Q=유량 0.2L/min 고정예시, t=8시간=480분)', v:'0.2×480 = '+V.toFixed(0)+' L', c:ORA},
          {k:'특징', v:'유량을 알고 있어 농도 계산이 직접적, 펌프 소음·전원 필요', c:GRN}
        ];
        note='시험포인트: 능동식은 "펌프가 있어 유량을 아는" 방식이라는 점이 수동식과의 근본 차이입니다.';
      } else if(s.step===1){
        calc=[
          {k:'원리', v:'펌프 없이 오염물질의 농도차에 의한 자연 확산(Fick 확산법칙)으로 포집', c:BLU},
          {k:'장점', v:'무동력·무소음, 착용 간편해 개인시료 채취에 유리', c:GRN},
          {k:'단점', v:'저농도·단시간 노출에서는 포집량이 작아 정밀도가 떨어질 수 있음', c:RED}
        ];
        note='시험포인트: 수동식은 유량을 "재는" 것이 아니라 매체 고유의 확산속도(uptake rate) 상수를 이용해 역산한다는 점이 계산 문제의 핵심입니다.';
      } else if(s.step===2){
        calc=[
          {k:'흡착관(고체흡착)', v:'활성탄(비극성 유기용제) · 실리카겔(극성물질, 흡습성 有)', c:BLU},
          {k:'임핀저(액체포집)', v:'흡수액에 통과시켜 포집 · 반응성이 크거나 흡착관에 불안정한 가스에 사용', c:GRN}
        ];
        note='시험포인트: 매체 선택 기준은 "그 가스의 극성·반응성"입니다 — 비극성엔 활성탄, 극성·흡습성 물질엔 실리카겔, 불안정한 가스엔 임핀저.';
      } else {
        calc=[
          {k:'여과지(막여과지)', v:'재질(PVC·MCE·유리섬유 등)에 따라 총분진·특정 유해물질용으로 구분', c:BLU},
          {k:'사이클론(분립장치)', v:'원심분리로 조대입자를 걸러내고 호흡성분진만 통과 · 절단직경 약 4㎛(ACGIH 50%효율 정의)', c:GRN}
        ];
        note='시험포인트: 사이클론은 "무엇을 거르는 장치"가 아니라 "무엇을 통과시키는 장치"입니다 — 호흡성분진(폐포까지 도달)만 여과지로 보내기 위한 전처리기입니다.';
      }
      window.HygDoc(E,{
        title:'시료채취 방법의 분류', sub:STAGES[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.03,y:0.28,w:0.22,h:0.17,c:hl(0,BLU),t:'①능동식'},
          {x:0.27,y:0.28,w:0.22,h:0.17,c:hl(1,GRN),t:'②수동식'},
          {x:0.51,y:0.28,w:0.22,h:0.17,c:hl(2,PNK),t:'③가스상매체'},
          {x:0.75,y:0.28,w:0.22,h:0.17,c:hl(3,AMB),t:'④입자상매체'}
        ],
        arrows:[
          {x1:0.255,y1:0.365,x2:0.268,y2:0.365},
          {x1:0.495,y1:0.365,x2:0.508,y2:0.365},
          {x1:0.735,y1:0.365,x2:0.748,y2:0.365}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 22.3 탈착효율(DE)·회수율(RE) 보정 — 출제율 50%+50% ★골든룰 슬라이더 실계산 ──
     DE(%)=탈착(분석)량÷첨가(스파이크)량×100. 보정농도=현장 실측분석량÷DE.
     검산(기본값): 85÷100×100=85.0%, 보정농도=62.3÷0.85≈73.29㎍. */
  { id:'hyg22_03',
    enter:function(E){ var self=this; this.s={spike:100, desorbed:85};
      E.controls('<div class="ctrl"><label>첨가(스파이크)량 (㎍)</label><input type="range" id="q3a" min="50" max="200" step="1" value="100"><output id="q3ao">100</output></div>'
        +'<div class="ctrl"><label>탈착(분석)량 (㎍)</label><input type="range" id="q3b" min="10" max="200" step="1" value="85"><output id="q3bo">85</output></div>');
      E.bind('#q3a','input',function(e){ self.s.spike=+e.target.value; document.getElementById('q3ao').textContent=e.target.value; });
      E.bind('#q3b','input',function(e){ self.s.desorbed=+e.target.value; document.getElementById('q3bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var spike=s.spike, desorbed=s.desorbed;
      var DE=spike>0? desorbed/spike*100 : 0;
      var fieldMeasured=62.3;                                            // 현장시료 실측 분석량(㎍) — 고정 예시
      var corrected=DE>0? fieldMeasured/(DE/100) : NaN;
      var deOk=DE>=75 && DE<=125;
      var y=H*0.10;
      T(ctx,'활성탄관 등에 알려진 양(첨가량)을 스파이크한 뒤 탈착·분석해 회수율(DE)을 구합니다',W*0.05,y,DIM,FS(H,0.02,9,11),'left');
      y+=FS(H,0.04,12,17);

      var barX=W*0.06, barMaxW=W*0.55, barH=FS(H,0.045,14,20), maxV=Math.max(spike,desorbed,1);
      var by1=y;
      ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.fillRect(barX,by1,barMaxW*(spike/maxV),barH);
      ctx.strokeStyle=BLU; ctx.strokeRect(barX,by1,barMaxW,barH);
      T(ctx,'첨가량 '+spike+'㎍',barX+6,by1+barH*0.68,TXT,FS(H,0.02,9,11),'left','600');
      var by2=by1+barH+FS(H,0.014,4,7);
      ctx.fillStyle='rgba(255,178,122,0.22)'; ctx.fillRect(barX,by2,barMaxW*(desorbed/maxV),barH);
      ctx.strokeStyle=ORA; ctx.strokeRect(barX,by2,barMaxW,barH);
      T(ctx,'탈착(분석)량 '+desorbed+'㎍',barX+6,by2+barH*0.68,TXT,FS(H,0.02,9,11),'left','600');
      y=by2+barH+FS(H,0.05,14,20);

      var rows=[
        ['DE = 탈착량÷첨가량×100', desorbed+'÷'+spike+'×100 = '+DE.toFixed(1)+'%', ORA],
        ['판정(일반적 허용범위 75~125%)', DE.toFixed(1)+'% → '+(deOk?'허용범위 이내':'재실험 검토 필요'), deOk?GRN:RED],
        ['보정농도 = 현장 실측분석량 ÷ DE', fieldMeasured+'㎍ ÷ '+(DE/100).toFixed(3)+' = '+(isFinite(corrected)?corrected.toFixed(2):'—')+'㎍', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.035,14,20);
      T(ctx,'RE(회수율)는 여과지 매체에 동일한 방식(회수량÷첨가량×100)을 적용한 이름만 다른 개념입니다. 실험은 보통 저·중·고 3개 농도수준에서 반복 측정해 평균 DE를 구합니다.',
        W*0.06,y,DIM,FS(H,0.02,9,11),'left');

      E.tapHint(0,0,'슬라이더로 첨가량·탈착량 조절',true);
      E.big('DE '+DE.toFixed(1)+'% → 보정농도 '+(isFinite(corrected)?corrected.toFixed(2):'—')+'㎍',
            '탈착효율을 보정하지 않으면 실제보다 항상 낮은 농도로 오판(과소평가)하게 됩니다 — 보정은 선택이 아니라 필수입니다.'); }
  },

  /* ── 22.4 GC 검출기의 종류와 선정 (출제율 40%) ──
     FID(범용, 탄화수소) · ECD(할로겐·전기음성기, 농약) · NPD(질소·인) · TCD(범용·저감도) · FPD(황·인).
     원문 대조: FID 감응범위 10~100pg·80~100℃ 유지, ECD 검출한계 약 50pg. */
  { id:'hyg22_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      var STAGES=['① FID(불꽃이온화)','② ECD(전자포획)','③ NPD(질소인)','④ TCD(열전도도)','⑤ FPD(불꽃광전자)'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        var lo=10, hi=100;
        calc=[
          {k:'원리', v:'수소·공기 불꽃(약 2,100℃) 속에서 시료가 연소하며 이온화 → 전류로 검출', c:BLU},
          {k:'대상', v:'탄소수에 비례해 감응 — 유기용제·탄화수소 전반(가장 범용적으로 사용)', c:GRN},
          {k:'감응범위(원문 대조)', v:lo+'~'+hi+'pg, 검출기 온도 80~100℃ 이상 유지 필요(수분 응축 방지)', c:ORA}
        ];
        note='시험포인트: FID는 H₂O·CO₂·N₂·SO₂ 등 무기가스에는 감응하지 않는다는 점이 GC 검출기 비교 문제의 단골 함정입니다.';
      } else if(s.step===1){
        calc=[
          {k:'원리', v:'β선원이 운반기체(주로 N₂)를 전리 → 유기화합물이 전자를 포획하면 전류가 감소', c:BLU},
          {k:'대상', v:'할로겐·니트로기 등 전기음성도가 큰 작용기 — 염소계 농약 검출에 널리 사용', c:GRN},
          {k:'특징(원문 대조)', v:'검출한계 약 50pg, 아민·알코올·탄화수소류에는 감응하지 않음', c:ORA}
        ];
        note='시험포인트: ECD="전기음성기에 예민, 파과되지 않는 장점"이 채점 포인트 — FID와 정확히 반대 성질(할로겐엔 둔감한 FID vs 예민한 ECD)로 대비해 서술합니다.';
      } else if(s.step===2){
        calc=[
          {k:'원리', v:'FID를 변형해 질소·인 화합물에 선택성을 높인 검출기', c:BLU},
          {k:'대상', v:'유기인계 농약, 포름알데히드 유도체(2,4-DNPH) 등 질소·인 함유 화합물', c:GRN}
        ];
        note='시험포인트: NPD는 "질소·인"이라는 원소 선택성 자체가 핵심 키워드 — 대상물질 이름(농약·포름알데히드)과 묶어 암기합니다.';
      } else if(s.step===3){
        calc=[
          {k:'원리', v:'시료성분과 운반기체의 열전도도 차이를 이용 — 불꽃을 쓰지 않는 비파괴적 검출', c:BLU},
          {k:'대상', v:'거의 모든 물질(범용) — 영구가스·무기가스 분석에 주로 사용', c:GRN},
          {k:'단점', v:'감도가 다른 검출기보다 낮아 미량분석에는 부적합', c:RED}
        ];
        note='시험포인트: TCD는 FID·TCD 둘 다 "범용"이지만, TCD는 불꽃을 쓰지 않아 비파괴적인 대신 감도가 낮다는 대비로 서술합니다.';
      } else {
        calc=[
          {k:'원리', v:'불꽃 속에서 여기된 화합물이 바닥상태로 돌아오며 내는 특정 발광을 광증배관으로 검출', c:BLU},
          {k:'대상', v:'광학필터로 황(S)·인(P) 함유 화합물에 매우 높은 선택성', c:GRN}
        ];
        note='시험포인트: "황·인=FPD, 질소·인=NPD"로 P(인)가 겹치는 함정에 주의 — S(황)가 나오면 FPD, N(질소)이 나오면 NPD로 구분합니다.';
      }
      window.HygDoc(E,{
        title:'가스 크로마토그래피 검출기의 종류', sub:STAGES[s.step]+'  ('+(s.step+1)+'/5)',
        boxes:[
          {x:0.02,y:0.28,w:0.185,h:0.17,c:hl(0,BLU),t:'①FID',s:'범용·탄화수소'},
          {x:0.225,y:0.28,w:0.185,h:0.17,c:hl(1,GRN),t:'②ECD',s:'할로겐·농약'},
          {x:0.43,y:0.28,w:0.185,h:0.17,c:hl(2,PNK),t:'③NPD',s:'질소·인'},
          {x:0.635,y:0.28,w:0.155,h:0.17,c:hl(3,AMB),t:'④TCD',s:'범용·저감도'},
          {x:0.81,y:0.28,w:0.17,h:0.17,c:hl(4,ORA),t:'⑤FPD',s:'황·인'}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 검출기',true);
    }
  },

  /* ── 22.5 검출한계·정량한계·신뢰성 평가 (출제율 30%+30%) ★골든룰 슬라이더 실계산 ──
     LOD≈3σ, LOQ≈10σ(≈3.3×LOD) — 바탕시료 반복측정 표준편차(σ) 기반. 정확도(bias)·정밀도(CV) 동시 실계산.
     검산(기본값 σ=1.0,평균=10): LOD=3.0, LOQ=10.0, 3.3×LOD=9.9(≈10σ), CV=10.0%, bias=(10−10.5)/10.5×100≈−4.76%. */
  { id:'hyg22_05',
    enter:function(E){ var self=this; this.s={sigma:1.0, mean:10};
      E.controls('<div class="ctrl"><label>바탕시료 표준편차 σ</label><input type="range" id="q5a" min="0.1" max="5" step="0.1" value="1.0"><output id="q5ao">1.0</output></div>'
        +'<div class="ctrl"><label>반복측정 평균값</label><input type="range" id="q5b" min="1" max="50" step="0.5" value="10"><output id="q5bo">10</output></div>');
      E.bind('#q5a','input',function(e){ self.s.sigma=+e.target.value; document.getElementById('q5ao').textContent=(+e.target.value).toFixed(1); });
      E.bind('#q5b','input',function(e){ self.s.mean=+e.target.value; document.getElementById('q5bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var sigma=s.sigma, mean=s.mean, certRef=10.5;                       // certRef=인증표준물질 참값(고정 예시)
      var LOD=3*sigma, LOQ10=10*sigma, LOQ33=3.3*LOD;
      var CV=mean>0? sigma/mean*100 : Infinity;
      var bias=(mean-certRef)/certRef*100;
      var precGrade, precColor;
      if(CV<10){ precGrade='우수'; precColor=GRN; } else if(CV<20){ precGrade='양호(관리 필요)'; precColor=AMB; } else { precGrade='불량(재실험 권장)'; precColor=RED; }
      var y=H*0.10;
      T(ctx,'바탕시료(blank)를 여러 번 반복측정한 표준편차(σ)로부터 LOD·LOQ를 산출하고, 반복측정 평균값으로 정밀도·정확도를 함께 평가합니다',
        W*0.05,y,DIM,FS(H,0.02,9,11),'left');
      y+=FS(H,0.045,13,18);

      var rows=[
        ['LOD(검출한계) = 3×σ', '3×'+sigma.toFixed(2)+' = '+LOD.toFixed(2), ORA],
        ['LOQ(정량한계) = 10×σ', '10×'+sigma.toFixed(2)+' = '+LOQ10.toFixed(2), GRN],
        ['LOQ 검증 = 3.3×LOD', '3.3×'+LOD.toFixed(2)+' = '+LOQ33.toFixed(2)+' ≈ 10σ(두 정의가 근사적으로 일치)', BLU],
        ['정밀도(CV) = σ÷평균×100', CV.toFixed(1)+'% → '+precGrade, precColor],
        ['정확도(bias) = (평균−참값)÷참값×100', bias.toFixed(1)+'% (참값 '+certRef+' 기준 고정예시)', AMB]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.035,14,20);
      T(ctx,'LOD 미만은 "검출 안 됨", LOD~LOQ 사이는 "검출은 되나 정량 신뢰 불가", LOQ 이상만 정량값으로 보고합니다.',
        W*0.06,y,DIM,FS(H,0.02,9,11),'left');

      E.tapHint(0,0,'슬라이더로 σ·평균값 조절',true);
      E.big('LOD '+LOD.toFixed(2)+' / LOQ '+LOQ10.toFixed(2)+' → 정밀도 '+precGrade,
            'σ가 커질수록(들쭉날쭉할수록) LOD·LOQ가 함께 높아져 더 큰 농도까지만 신뢰할 수 있게 됩니다 — 신뢰성은 곧 재현성입니다.'); }
  },

  /* ── 22.6 측정결과의 통계적 평가 — 대수정규분포·TWA (출제율 30%) ★골든룰 슬라이더 실계산 ──
     TWA=Σ(Ci·Ti)/8. 대수정규분포이므로 대표값은 산술평균이 아닌 기하평균(GM)·기하표준편차(GSD).
     검산(기본값 C1=80,T1=3,C2=30,T2=3,T3=2): Σ=80×3+30×3+0×2=330, TWA=330/8=41.25.
     GM/GSD 예시(고정 5개 측정값 GSAMPLES): GM≈10.008, GSD≈1.348(calcGMGSD 함수로 매 프레임 재계산). */
  { id:'hyg22_06',
    enter:function(E){ var self=this; this.s={C1:80,T1:3,C2:30,T2:3};
      E.controls('<div class="ctrl"><label>구간① 농도 C1 (ppm)</label><input type="range" id="q6a" min="0" max="200" step="1" value="80"><output id="q6ao">80</output></div>'
        +'<div class="ctrl"><label>구간① 시간 T1 (h)</label><input type="range" id="q6b" min="0" max="8" step="0.5" value="3"><output id="q6bo">3</output></div>'
        +'<div class="ctrl"><label>구간② 농도 C2 (ppm)</label><input type="range" id="q6c" min="0" max="200" step="1" value="30"><output id="q6co">30</output></div>'
        +'<div class="ctrl"><label>구간② 시간 T2 (h)</label><input type="range" id="q6d" min="0" max="8" step="0.5" value="3"><output id="q6do">3</output></div>');
      E.bind('#q6a','input',function(e){ self.s.C1=+e.target.value; document.getElementById('q6ao').textContent=e.target.value; });
      E.bind('#q6b','input',function(e){ self.s.T1=+e.target.value; document.getElementById('q6bo').textContent=e.target.value; });
      E.bind('#q6c','input',function(e){ self.s.C2=+e.target.value; document.getElementById('q6co').textContent=e.target.value; });
      E.bind('#q6d','input',function(e){ self.s.T2=+e.target.value; document.getElementById('q6do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var C1=s.C1, T1=s.T1, C2=s.C2, T2=s.T2;
      var T3=Math.max(0, 8-T1-T2), C3=0;                                  // 구간③(휴게 등 청정구간)=0ppm 고정, 나머지 시간 자동배분
      var sumCT=C1*T1+C2*T2+C3*T3;
      var TWA=sumCT/8;
      var OEL=50;                                                          // 노출기준(예시, 고정)
      var over=TWA>OEL;
      var gg=calcGMGSD(GSAMPLES);
      var y=H*0.09;
      T(ctx,'TWA=Σ(Ci·Ti)÷8 (8시간 시간가중평균), 구간③(휴게 등)은 자동으로 나머지 시간·0ppm으로 배분됩니다',W*0.05,y,DIM,FS(H,0.02,9,11),'left');
      y+=FS(H,0.038,11,15);

      var rows=[
        ['구간합 Σ(Ci·Ti) = C1T1+C2T2+C3T3', C1+'×'+T1+' + '+C2+'×'+T2+' + 0×'+T3.toFixed(1)+' = '+sumCT.toFixed(0), BLU],
        ['TWA = Σ(Ci·Ti) ÷ 8', sumCT.toFixed(0)+' ÷ 8 = '+TWA.toFixed(2)+'ppm', ORA],
        ['노출기준(OEL, 예시 '+OEL+'ppm) 대비 판정', TWA.toFixed(2)+'ppm → '+(over?'초과(개선 필요)':'이하(허용범위)'), over?RED:GRN],
        ['기하평균(GM) — 대수정규분포 대표값(5개 측정값 예시)', 'GM = '+gg.GM.toFixed(2)+' (산술평균이 아닌 로그평균의 역변환)', PNK],
        ['기하표준편차(GSD) — 동일 예시', 'GSD = '+gg.GSD.toFixed(2)+' (1에 가까울수록 값이 균일)', AMB]
      ];
      var rowsH=ROW(ctx,W,H,W*0.06,y,W*0.90,rows);
      y+=rowsH+FS(H,0.035,14,20);
      T(ctx,'작업장 유해물질 농도는 대체로 대수정규분포를 따르므로, 대표값은 산술평균이 아닌 기하평균(GM)·산포는 기하표준편차(GSD)로 나타냅니다.',
        W*0.06,y,DIM,FS(H,0.019,9,10.5),'left');

      E.tapHint(0,0,'슬라이더로 구간별 농도·시간 조절',true);
      E.big('TWA '+TWA.toFixed(2)+'ppm → '+(over?'노출기준 초과':'노출기준 이하'),
            '순간 최고농도가 아무리 높아도 노출시간이 짧으면 TWA는 낮아질 수 있습니다 — 판정은 항상 8시간 전체를 가중평균한 값으로 합니다.'); }
  },

  /* ── ★22.7 서브노트 — 측정·평가 한 장 복원 (탭으로 6대 토픽 3쌍을 순회, 캔버스=전체 골격 항상 표시) ──
     학습패널(more)에 "복원 요령"(공통주제·암기법·핵심개념 왜·복원 순서)을 담는다(JSON). 골든룰: 각 페이지 수치는
     앞선 6개 장면과 동일한 고정 상수로부터 이 장면에서도 다시 실계산한다(암기용 재현이지 하드코딩 아님). */
  { id:'hyg22_07',
    enter:function(E){ this.s={page:0}; E.setOn([]); },
    tap:function(E){ this.s.page=(this.s.page+1)%3; },
    draw:function(E){ var s=this.s;
      var PAGES=['① 측정주기·채취방법','② 보정(DE/RE)·검출기매칭','③ LOD/LOQ·GM/GSD'];
      var pairs=[[0,1],[2,3],[4,5]];
      var cur=pairs[s.page];
      var hl=function(i,base){ return (i===cur[0]||i===cur[1])? ORA : base; };
      var calc, note;
      if(s.page===0){
        var Q=0.2, t=480, V=Q*t, Ttotal=6.5, nSplit=Math.ceil(Ttotal/6), perSeg=Ttotal/nSplit;
        calc=[
          {k:'①측정주기', v:'원칙 6개월1회 · 발암성 등 특별관리물질 초과사업장 3개월1회', c:BLU},
          {k:'②능동식 채취량 V=Q×t', v:'0.2L/min×480min = '+V.toFixed(0)+'L · 분할채취 예시 '+Ttotal+'h→'+nSplit+'회×'+(perSeg*60).toFixed(0)+'분', c:GRN}
        ];
        note='복원 순서 1~2단계: 왜 재는가(목적)→언제(주기)→어떻게(능동/수동, 가스상/입자상 매체) 순서로 먼저 뼈대를 그립니다.';
      } else if(s.page===1){
        var spike=100, desorbed=85, DE=desorbed/spike*100;
        calc=[
          {k:'③DE(탈착효율)=탈착량÷첨가량×100', v:desorbed+'÷'+spike+'×100 = '+DE.toFixed(1)+'% → 보정농도=실측÷DE', c:ORA},
          {k:'④검출기 매칭', v:'할로겐→ECD · 질소인→NPD · 황인→FPD · 범용→FID(고감도)/TCD(저감도)', c:PNK}
        ];
        note='복원 순서 3~4단계: 매체가 아무리 정확히 채취해도 "탈착·분석"에서 손실되는 몫을 DE/RE로 되돌려놓아야 진짜 농도가 나옵니다.';
      } else {
        var sigma=1.0, LOD=3*sigma, LOQ=10*sigma, gg=calcGMGSD(GSAMPLES);
        calc=[
          {k:'⑤LOD=3σ, LOQ=10σ (σ=1.0 예시)', v:'LOD='+LOD.toFixed(1)+', LOQ='+LOQ.toFixed(1)+' (LOQ≈3.3×LOD)', c:ORA},
          {k:'⑥GM/GSD·TWA', v:'GM='+gg.GM.toFixed(2)+', GSD='+gg.GSD.toFixed(2)+' · TWA=Σ(Ci·Ti)÷8', c:GRN}
        ];
        note='복원 순서 5~6단계: 그 값을 "얼마나 믿을 수 있나"(LOD/LOQ)와 "여러 번 잰 값을 어떻게 대표할까"(대수정규·GM/GSD·TWA)로 마무리합니다.';
      }
      window.HygDoc(E,{
        title:'측정·평가 한 장 복원 — 22장 전체 골격', sub:PAGES[s.page]+'  ('+(s.page+1)+'/3)',
        boxes:[
          {x:0.02,y:0.24,w:0.30,h:0.15,c:hl(0,BLU),t:'①측정주기'},
          {x:0.35,y:0.24,w:0.30,h:0.15,c:hl(1,GRN),t:'②채취방법'},
          {x:0.68,y:0.24,w:0.30,h:0.15,c:hl(2,PNK),t:'③DE/RE보정'},
          {x:0.02,y:0.42,w:0.30,h:0.15,c:hl(3,AMB),t:'④검출기매칭'},
          {x:0.35,y:0.42,w:0.30,h:0.15,c:hl(4,'#c9a0f4'),t:'⑤LOD/LOQ'},
          {x:0.68,y:0.42,w:0.30,h:0.15,c:hl(5,'#7ee0b0'),t:'⑥GM/GSD·TWA'}
        ],
        arrows:[
          {x1:0.325,y1:0.315,x2:0.348,y2:0.315},
          {x1:0.655,y1:0.315,x2:0.678,y2:0.315},
          {x1:0.325,y1:0.495,x2:0.348,y2:0.495},
          {x1:0.655,y1:0.495,x2:0.678,y2:0.495}
        ],
        calc:calc, note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 쌍(복원 요령은 아래 "더 알아보기")',true);
    }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
