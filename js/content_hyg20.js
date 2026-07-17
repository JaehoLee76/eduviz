/* 산업위생기술사 제20장 — 논술 기출 은행 Ⅰ : 개론·인간공학·관리 (동작만. 텍스트=content/hyg20.json)
   앞선 17~19장(계산 은행Ⅰ~Ⅲ)과 달리 이 장은 서술형(논술) 기출 6종을 "답안 골격(두문·본문 논점·결론)+도해"로 제시한다.
   근거: 실제 산업위생관리기술사 기출 논술주제(출제율 20~400%, 서영민 외 「SMART 산업위생관리기술사」 상·하권 대조)를 대표 예시로 재구성.
         법령·수치(NIOSH RWL 계수식, 산업안전보건기준 제656~663조, 중대재해 정의 등)는 원문 대조 검증. 답안 문장은 신규 작성.
   골든룰: hyg20_04(RWL·LI)는 슬라이더 실계산. 나머지 5장면은 규정·정의를 그대로 옮기되, 화면에 표시되는 판정·비율·개수는
           슬라이더/상수로부터 draw에서 실계산한다(하드코딩 문자열 금지).
   16장(2026 개정 공시·위험성평가 제재)과 연계: hyg20_02(위험성평가 절차)·hyg20_06(중대재해)이 16_06의 제재 내용을 전제로 한다. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다(hyg18·hyg19 ROW 그대로 이식). 반환값=소비한 세로높이. */
  function ROW(ctx,W,H,x,y,w,rows){
    var labelFs=FS(H,0.021,11,14), valueFs=FS(H,0.026,13,14);
    var gap=FS(H,0.008,4,6), rowGap=FS(H,0.009,5,7);
    var blockH=labelFs+gap+valueFs, cy=y;
    for(var i=0;i<rows.length;i++){
      ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,x-8,cy-3,w,blockH+6,7); ctx.fill();
      T(ctx,rows[i][0],x,cy+labelFs,DIM,labelFs,'left');
      T(ctx,rows[i][1],x,cy+labelFs+gap+valueFs,rows[i][2],valueFs,'left','700');
      cy+=blockH+rowGap;
    }
    return cy-y-rowGap;
  }

  // 20.4 NIOSH FM(빈도계수) 표 — 지속시간 ≤1시간 기준, 수직위치 V<75cm / V≥75cm 두 열 (1991 개정 NIOSH 들기공식 표준표)
  var FREQS=[0.2,0.5,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  var FM_LT75=[1.00,0.97,0.94,0.91,0.88,0.84,0.80,0.75,0.70,0.60,0.52,0.45,0.41,0.37,0,0,0];
  var FM_GE75=[1.00,0.97,0.94,0.91,0.88,0.84,0.80,0.75,0.70,0.60,0.52,0.45,0.41,0.37,0.34,0.31,0.28];
  var COUPLING=[{name:'양호(Good)', lt75:1.00, ge75:1.00}, {name:'보통(Fair)', lt75:0.95, ge75:1.00}, {name:'불량(Poor)', lt75:0.90, ge75:0.90}];

  var scenes=[

  /* ── 20.1 산업위생의 정의와 4대 관리 — AIHA 순환구조 ──
     AIHA(1994): 근로자·지역주민의 건강장해를 예측(Anticipation)·인지(Recognition)·평가(Evaluation)·관리(Control)하는 과학과 기술.
     4단계를 사각형 순환 배치로 tap 이동시켜, "관리 후 다시 예측으로" 순환됨을 보여준다. */
  { id:'hyg20_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var STAGES=[
        {t:'① 예측 Anticipation', d:'신설 공정·물질 도입 전, 어떤 유해인자가 생길지 미리 내다보는 단계입니다.'},
        {t:'② 인지 Recognition', d:'작업장을 순회점검·청취조사하여 실제 존재하는 유해인자를 확인(인지)하는 단계입니다.'},
        {t:'③ 평가 Evaluation', d:'작업환경측정·노출평가로 그 유해인자가 얼마나 위험한지 정량적으로 재는 단계입니다.'},
        {t:'④ 관리 Control', d:'공학적·관리적 대책, 개인보호구로 유해인자를 허용기준 이하로 낮추는 단계이며, 다시 예측으로 순환합니다.'}
      ];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      window.HygDoc(E,{
        title:'산업위생의 정의 — AIHA(1994) 4대 관리', sub:STAGES[s.step].t+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.08,y:0.28,w:0.36,h:0.16,c:hl(0,BLU),t:'① 예측',s:'Anticipation'},
          {x:0.56,y:0.28,w:0.36,h:0.16,c:hl(1,GRN),t:'② 인지',s:'Recognition'},
          {x:0.56,y:0.55,w:0.36,h:0.16,c:hl(2,PNK),t:'③ 평가',s:'Evaluation'},
          {x:0.08,y:0.55,w:0.36,h:0.16,c:hl(3,AMB),t:'④ 관리',s:'Control'}
        ],
        arrows:[
          {x1:0.44,y1:0.36,x2:0.555,y2:0.36,c:'rgba(223,238,251,0.5)'},
          {x1:0.74,y1:0.44,x2:0.74,y2:0.548,c:'rgba(223,238,251,0.5)'},
          {x1:0.56,y1:0.63,x2:0.445,y2:0.63,c:'rgba(223,238,251,0.5)'},
          {x1:0.26,y1:0.55,x2:0.26,y2:0.442,c:'rgba(255,178,122,0.55)',dash:true}
        ],
        calc:[
          {k:'현재 단계', v:(s.step+1)+' / 4', c:ORA},
          {k:'순환 여부', v:(s.step===3?'④ 관리 이후 다시 ① 예측으로 순환':'선형이 아니라 반복되는 사이클'), c:GRN}
        ],
        note:STAGES[s.step].d
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 20.2 위험성평가 추진절차 5단계 (출제율 400% 최고빈출) ──
     사전준비 → 유해·위험요인 파악 → 위험성 추정(빈도×강도, Matrix) → 위험성 결정 → 개선대책 수립·실행
     검산(대표값): 발생빈도 3(가끔) × 중대성 3(중상) = 위험도 9 — 값이 클수록 개선 우선순위가 높아짐을 보여주는 예시일 뿐, 등급 구간은 사업장이 자체 설정. */
  { id:'hyg20_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 사전준비','② 유해·위험요인 파악','③ 위험성 추정(Matrix)','④ 위험성 결정','⑤ 개선대책 수립·실행'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'실시계획서 포함사항', v:'목적·방법, 담당자·책임자 역할, 연간계획·시기', c:BLU},
          {k:'수집 정보', v:'작업표준, MSDS, 공정흐름도, 재해사례·통계, 측정·건강진단 결과', c:GRN}
        ];
        note='평가팀에는 공정·작업 관리자뿐 아니라 현장에서 위험에 직접 노출되는 근로자가 반드시 참여해야 형식적 평가에 그치지 않습니다(2026 개정에서 근로자 미참여 시 과태료 대상으로 명문화 — 16장 연계).';
      } else if(s.step===1){
        calc=[
          {k:'파악 방법(택1 이상)', v:'순회점검·청취조사·안전보건자료·체크리스트', c:BLU},
          {k:'4M 분류', v:'Man(인적)·Machine(기계)·Media(물질·환경)·Management(관리)', c:GRN}
        ];
        note='4M은 산업안전보건공단이 정성적 위험요인을 4개 범주로 그룹화해 사업장이 쉽게 적용하도록 만든 파악 기법입니다.';
      } else if(s.step===2){
        var freq=3, sev=3, risk=freq*sev;
        calc=[
          {k:'위험도(위험의 크기) = 사고빈도 × 중대성(강도)', v:freq+' × '+sev+' = '+risk, c:ORA},
          {k:'빈도 구간(예시)', v:'5단계(예: 1거의없음~5매우잦음)', c:DIM},
          {k:'강도 구간(예시)', v:'4단계(예: 1경미~4치명적)', c:DIM}
        ];
        note='추정 방법은 행렬(Matrix) 조합을 권장하며, 빈도·강도의 단계 수와 등급 경계는 사업장 규모·업종 특성에 맞춰 위험성평가팀이 사전에 자체 설정합니다.';
      } else if(s.step===3){
        calc=[
          {k:'판단 기준', v:'추정된 위험성 크기 vs 사업장 설정 허용가능 위험성 기준', c:BLU},
          {k:'허용 불가 시', v:'5단계(개선대책)로 진행 — NO면 2단계로 되돌아가 재파악', c:RED}
        ];
        note='허용가능 위험성 기준은 위험성 결정 전에 미리 준비해 두어야 하며, 업종·규모에 따라 변경할 수 있습니다.';
      } else {
        calc=[
          {k:'감소대책 우선순위 ①', v:'위험한 작업 폐지·변경, 설계·계획 단계에서 제거·저감', c:GRN},
          {k:'감소대책 우선순위 ②', v:'연동장치·환기장치 등 공학적 대책', c:BLU},
          {k:'감소대책 우선순위 ③', v:'작업절차서 정비 등 관리적 대책 → 개인보호구', c:ORA}
        ];
        note='중대재해·중대산업사고 우려가 있어 대책 실행에 시간이 걸리면 즉시 잠정조치를 강구하고, 종료 후 남은 유해·위험요인은 근로자에게 게시·주지합니다.';
      }
      window.HygDoc(E,{
        title:'위험성평가 추진절차 5단계', sub:STAGES[s.step]+'  ('+(s.step+1)+'/5)',
        boxes:[
          {x:0.03,y:0.28,w:0.175,h:0.17,c:hl(0,BLU),t:'①사전준비'},
          {x:0.225,y:0.28,w:0.175,h:0.17,c:hl(1,GRN),t:'②요인파악'},
          {x:0.42,y:0.28,w:0.175,h:0.17,c:hl(2,PNK),t:'③위험성추정'},
          {x:0.615,y:0.28,w:0.175,h:0.17,c:hl(3,AMB),t:'④위험성결정'},
          {x:0.81,y:0.28,w:0.17,h:0.17,c:hl(4,ORA),t:'⑤개선실행'}
        ],
        arrows:[
          {x1:0.205,y1:0.365,x2:0.222,y2:0.365},
          {x1:0.40,y1:0.365,x2:0.417,y2:0.365},
          {x1:0.595,y1:0.365,x2:0.612,y2:0.365},
          {x1:0.79,y1:0.365,x2:0.807,y2:0.365}
        ],
        calc:calc,
        note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    }
  },

  /* ── 20.3 근골격계부담작업 유해요인조사 (출제율 40%) ──
     시기(정기 3년·신설 1년·수시) · 내용(기본조사+증상조사) · 평가도구(OWAS/RULA/REBA/NLE/JSI) 비교
     근거: 안전보건규칙 제657조 · KOSHA CODE H-9-2016 */
  { id:'hyg20_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s;
      var STAGES=['① 조사 시기','② 조사 내용','③ 평가도구 비교'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        calc=[
          {k:'정기조사', v:'유해요인조사 완료일로부터 매 3년마다', c:BLU},
          {k:'신설사업장 최초조사', v:'신설일부터 1년 이내', c:GRN},
          {k:'수시조사(지체없이)', v:'근골격계질환자 발생·신규작업/설비 도입·작업환경 변경 시', c:ORA}
        ];
        note='조사결과는 근골격계질환의 이환을 긍정도 부정도 하는 근거로 쓸 수 없습니다 — 목적은 어디까지나 유해요인의 제거·감소입니다.';
      } else if(s.step===1){
        calc=[
          {k:'유해요인 기본조사', v:'작업장 상황(공정·설비·작업량·속도) + 작업조건(반복성·부자연스런자세·과도한힘·접촉스트레스·진동)', c:BLU},
          {k:'근골격계질환 증상조사', v:'증상·징후, 직업력(근무력), 근무형태, 취미생활, 과거 질병력', c:GRN},
          {k:'조사 원칙', v:'사업장 내 근골격계부담작업 전수조사(동일조건 작업은 단계적 조사 가능)', c:DIM}
        ];
        note='기본조사와 증상조사 결과를 종합해 개선 우선순위를 정하고, 개선대책 수립·실행 후 개선효과를 평가하는 순서로 이어집니다.';
      } else {
        calc=[
          {k:'OWAS', v:'전신(허리·다리·팔) · 관찰만으로 평가(기구 불필요) · 현장 적용 용이', c:BLU},
          {k:'RULA', v:'상지 중심(손목·팔꿈치·어깨·목) · 정적 상지자세 평가 · 조립·재봉 등', c:GRN},
          {k:'REBA', v:'전신(RULA의 하지분석 한계 보완) · 간호·의료 등 예측불가 자세 多업종', c:PNK},
          {k:'NLE(NIOSH Lifting Equation)', v:'중량물 들기작업 전용 · RWL·LI 산출 → 20.4장에서 실계산', c:ORA},
          {k:'JSI(작업긴장도지수)', v:'상지 반복작업 · 점수 7 이상이면 즉시 개선이 필요한 위험작업', c:AMB}
        ];
        note='다섯 도구는 서로 대체재가 아니라 "어느 신체부위·어느 작업형태냐"에 따라 골라 쓰는 보완적 관계입니다.';
      }
      window.HygDoc(E,{
        title:'근골격계부담작업 유해요인조사', sub:STAGES[s.step]+'  ('+(s.step+1)+'/3)',
        boxes:[
          {x:0.06,y:0.28,w:0.26,h:0.17,c:hl(0,BLU),t:'① 조사 시기',s:'3년·1년·수시'},
          {x:0.375,y:0.28,w:0.26,h:0.17,c:hl(1,GRN),t:'② 조사 내용',s:'기본조사+증상조사'},
          {x:0.69,y:0.28,w:0.26,h:0.17,c:hl(2,PNK),t:'③ 평가도구',s:'OWAS·RULA·REBA·NLE·JSI'}
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

  /* ── 20.4 개정 NIOSH 중량물 취급 권고기준 (RWL·LI, 출제율 30%) — ★골든룰 슬라이더 실계산 ──
     RWL = LC(23kg) × HM × VM × DM × AM × FM × CM
     HM=25/H · VM=1-0.003|V-75| · DM=0.82+4.5/D · AM=1-0.0032·A · FM,CM=표(빈도·커플링×수직위치)
     LI = 물체무게 ÷ RWL.  기본 슬라이더값(H30·V60·D80·A0·F4·불량커플링)은 실제 기출 예제와 동일한 조건으로 설정:
     검산: 원문(교재)은 HM·VM·DM을 소수 3자리로 반올림한 뒤 곱해 RWL=23×0.833×0.955×0.876×1×0.84×0.90≈12.117kg, LI=13/12.117≈1.073을 얻는다.
     이 코드는 매 프레임 25/H 등을 반올림 없이 직접 나눠 곱하므로(골든룰: 중간값 사전반올림 금지) RWL≈12.126kg, LI≈1.072로 소수 셋째자리만
     미세하게 다르다(중간값 반올림 차이일 뿐 공식 오류 아님). 화면에는 근사값(≈)으로 표기한다. */
  { id:'hyg20_04',
    enter:function(E){ var self=this; this.s={H:30, V:60, D:80, A:0, fIdx:5, cIdx:2};
      E.controls('<div class="ctrl"><label>수평거리 H (cm)</label><input type="range" id="q4a" min="25" max="63" step="1" value="30"><output id="q4ao">30</output></div>'
        +'<div class="ctrl"><label>수직위치 V (cm)</label><input type="range" id="q4b" min="0" max="175" step="1" value="60"><output id="q4bo">60</output></div>'
        +'<div class="ctrl"><label>수직이동거리 D (cm)</label><input type="range" id="q4c" min="25" max="175" step="1" value="80"><output id="q4co">80</output></div>'
        +'<div class="ctrl"><label>비대칭각도 A (도)</label><input type="range" id="q4d" min="0" max="135" step="1" value="0"><output id="q4do">0</output></div>'
        +'<div class="ctrl"><label>들기빈도 F (회/분)</label><input type="range" id="q4e" min="0" max="16" step="1" value="5"><output id="q4eo">4</output></div>'
        +'<div class="ctrl"><label>커플링(손잡이) 상태</label><input type="range" id="q4f" min="0" max="2" step="1" value="2"><output id="q4fo">불량(Poor)</output></div>');
      E.bind('#q4a','input',function(e){ self.s.H=+e.target.value; document.getElementById('q4ao').textContent=e.target.value; });
      E.bind('#q4b','input',function(e){ self.s.V=+e.target.value; document.getElementById('q4bo').textContent=e.target.value; });
      E.bind('#q4c','input',function(e){ self.s.D=+e.target.value; document.getElementById('q4co').textContent=e.target.value; });
      E.bind('#q4d','input',function(e){ self.s.A=+e.target.value; document.getElementById('q4do').textContent=e.target.value; });
      E.bind('#q4e','input',function(e){ self.s.fIdx=+e.target.value; document.getElementById('q4eo').textContent=FREQS[self.s.fIdx]; });
      E.bind('#q4f','input',function(e){ self.s.cIdx=+e.target.value; document.getElementById('q4fo').textContent=COUPLING[self.s.cIdx].name; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // ★6슬라이더 장면은 컨트롤 박스가 커서 캔버스 실높이가 매우 작다(≈150~220px) — 도해 대신 촘촘한 2열 막대그리드로 압축(hyg17_06 막대 패턴 이식).
      var objWeight=13;   // 기출 원 문제 고정 물체무게(kg) — 검산 재현을 위해 고정, 6개 계수만 슬라이더로 조작
      var Vlt75 = s.V<75;
      var HM=Math.min(1, 25/s.H);
      var VM=Math.max(0, 1-0.003*Math.abs(s.V-75));
      var DM=0.82+4.5/s.D;
      var AM=Math.max(0, 1-0.0032*s.A);
      var FM=(Vlt75?FM_LT75:FM_GE75)[s.fIdx];
      var CM=(Vlt75?COUPLING[s.cIdx].lt75:COUPLING[s.cIdx].ge75);
      var RWL=23*HM*VM*DM*AM*FM*CM;
      var LI=RWL>0? objWeight/RWL : Infinity;
      var over=LI>1;
      var y=H*0.10;
      T(ctx,'RWL=23×HM×VM×DM×AM×FM×CM(kg) · LI=물체무게÷RWL · 물체무게 '+objWeight+'kg 고정(기출값)',W*0.05,y,DIM,FS(H,0.048,10,13),'left');
      y+=FS(H,0.075,15,20);

      var items=[
        ['HM=25/'+s.H, HM, BLU],
        ['VM(V='+s.V+'cm)', VM, GRN],
        ['DM=0.82+4.5/'+s.D, DM, ORA],
        ['AM=1-0.0032×'+s.A, AM, PNK],
        ['FM(F='+FREQS[s.fIdx]+'/분,'+(Vlt75?'V<75':'V≥75')+')', FM, AMB],
        ['CM('+COUPLING[s.cIdx].name+','+(Vlt75?'V<75':'V≥75')+')', CM, '#cfd8e6']
      ];
      var gapX=W*0.02, colW=(W*0.90-gapX)/2, rowH=FS(H,0.135,26,34);
      var barH=FS(H,0.032,8,11), labFs=FS(H,0.05,10.5,13);
      for(var i=0;i<6;i++){ var col=i%2, row=Math.floor(i/2);
        var x=W*0.05+col*(colW+gapX), yy=y+row*rowH, it=items[i];
        T(ctx,it[0]+' = '+it[1].toFixed(3),x,yy+labFs,TXT,labFs,'left','600');
        var by=yy+labFs+FS(H,0.018,5,8);
        ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(x,by,colW,barH);
        ctx.fillStyle=it[2]; ctx.fillRect(x,by,colW*Math.max(0,Math.min(1,it[1])),barH);
      }
      y+=rowH*3+FS(H,0.03,8,12);

      var rh=FS(H,0.155,30,40);
      ctx.fillStyle=over?'rgba(240,136,138,0.14)':'rgba(143,227,181,0.12)'; ctx.strokeStyle=over?RED:GRN;
      RR(ctx,W*0.05,y,W*0.90,rh,8); ctx.fill(); ctx.stroke();
      var rfs=FS(H,0.07,13,17);
      T(ctx,'RWL≈'+RWL.toFixed(2)+'kg   ·   LI='+objWeight+'÷'+RWL.toFixed(2)+'≈'+LI.toFixed(2)+'   →   '+(over?'1 초과(요통 위험)':'1 이하(허용범위)'),
        W*0.5,y+rh*0.6,over?RED:GRN,rfs,'center','700');

      E.tapHint(0,0,'슬라이더로 H·V·D·A·F·커플링 조절',true);
      E.big('RWL '+RWL.toFixed(1)+'kg → LI '+LI.toFixed(2)+' ('+(over?'요통 위험':'허용범위')+')',
            '기본값은 기출 원문제(13kg 상자, 손잡이 없음)와 동일해 RWL≈12.12kg·LI≈1.07이 재현됩니다 — 6개 계수 중 어느 것을 개선해야 LI가 1 이하로 내려가는지 슬라이더로 찾아보세요.'); }
  },

  /* ── 20.5 근골격계질환 예방관리 프로그램 (출제율 40%) ──
     수립·시행 의무: 요양승인 근로자 연간 10명 이상 발생, 또는 5명 이상+비율 10%이상, 또는 노사이견 지속시 명령(안전보건규칙 제662조)
     구성요소 6가지가 순환(정책수립→교육훈련→관리→개선활동→평가→피드백) */
  { id:'hyg20_05',
    enter:function(E){ var self=this; this.s={approved:6, workers:80};
      E.controls('<div class="ctrl"><label>연간 요양승인 근로자 수 (명)</label><input type="range" id="q5a" min="0" max="15" step="1" value="6"><output id="q5ao">6</output></div>'
        +'<div class="ctrl"><label>사업장 전체 근로자 수 (명)</label><input type="range" id="q5b" min="20" max="200" step="5" value="80"><output id="q5bo">80</output></div>');
      E.bind('#q5a','input',function(e){ self.s.approved=+e.target.value; document.getElementById('q5ao').textContent=e.target.value; });
      E.bind('#q5b','input',function(e){ self.s.workers=+e.target.value; document.getElementById('q5bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ratio=s.approved/s.workers*100;
      var cond1=s.approved>=10, cond2=(s.approved>=5 && ratio>=10);
      var mandatory=cond1||cond2;
      var bx=W*0.08, bw=W*0.84;
      var y=H*0.19;
      T(ctx,'수립·시행 의무(안전보건규칙 제662조): 요양승인 근로자 연간 10명 이상, 또는 5명 이상+비율 10%이상, 또는 노사이견 지속 시 고용노동부장관 명령',
        bx,y,DIM,FS(H,0.02,10.5,13.5),'left');
      y+=FS(H,0.045,16,22);

      var boxH=FS(H,0.10,34,50);
      ctx.fillStyle=mandatory?'rgba(240,136,138,0.14)':'rgba(143,227,181,0.12)'; ctx.strokeStyle=mandatory?RED:GRN;
      RR(ctx,bx,y,bw,boxH,8); ctx.fill(); ctx.stroke();
      var fs=FS(H,0.026,13,15);
      T(ctx,'요양승인 '+s.approved+'명 / 전체 '+s.workers+'명 → 비율 '+ratio.toFixed(1)+'%',bx+W*0.02,y+boxH*0.42,TXT,fs,'left','600');
      T(ctx,mandatory?'수립·시행 의무 발생':'현재 조건상 의무 미발생(자율 예방관리 권장)',bx+W*0.02,y+boxH*0.78,mandatory?RED:GRN,fs,'left','700');
      y+=boxH+FS(H,0.045,16,22);

      var rows=[
        ['조건① 요양승인자 연간 10명 이상', s.approved+'명 → '+(cond1?'해당':'미해당'), cond1?RED:DIM],
        ['조건② 5명 이상 & 비율 10%↑ = '+s.approved+'/'+s.workers+'×100', ratio.toFixed(1)+'% → '+(cond2?'해당':'미해당'), cond2?RED:DIM],
        ['조건③ 노사이견 지속·고용노동부장관 명령', '(수치와 무관한 별도 요건 — 항상 확인 필요)', AMB]
      ];
      var rowsH=ROW(ctx,W,H,bx,y,bw,rows);
      y+=rowsH+FS(H,0.038,14,20);

      T(ctx,'프로그램 6대 구성요소(순환) — 정책수립 → 교육·훈련 → 유해요인·의학적 관리 → 작업환경 등 개선활동 → 프로그램 평가 → 피드백',
        bx,y,TXT,FS(H,0.023,12,15),'left','600');
      y+=FS(H,0.04,14,20);
      var COMP=['①정책수립','②교육·훈련','③유해요인관리','④의학적관리','⑤개선활동','⑥평가·피드백'];
      var cw=(bw-5*8)/6, chh=FS(H,0.075,26,36);
      for(var i=0;i<COMP.length;i++){ var cx=bx+i*(cw+8);
        ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.strokeStyle=BLU; RR(ctx,cx,y,cw,chh,7); ctx.fill(); ctx.stroke();
        T(ctx,COMP[i],cx+cw/2,y+chh/2+FS(H,0.007,5,7),TXT,FS(H,0.019,10,13),'center','600');
        if(i<COMP.length-1){ var ax=cx+cw+2; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(ax,y+chh/2); ctx.lineTo(ax+4,y+chh/2); ctx.stroke(); } }
      y+=chh+FS(H,0.03,12,16);
      T(ctx,'평가결과는 다시 정책수립으로 피드백되어 순환합니다. 작성·시행 시 노사협의를 거치고, 필요 시 인간공학·산업의학·산업위생·산업간호 전문가의 지도·조언을 받을 수 있습니다.',
        bx,y,DIM,FS(H,0.02,10.5,13.5),'left');

      E.tapHint(0,0,'슬라이더로 요양승인자수·전체근로자수 조절',true);
      E.big(mandatory?'수립·시행 의무 발생 — 비율 '+ratio.toFixed(1)+'%':'의무 미발생 — 비율 '+ratio.toFixed(1)+'%',
            mandatory?'조건① 또는 ②를 충족하면 노사협의를 거쳐 프로그램을 작성·시행해야 합니다.':'조건에 못 미쳐도 예방적으로 유해요인조사·개선활동은 계속 이어가야 합니다.'); }
  },

  /* ── 20.6 중대재해 — 산업안전보건법 vs 중대재해처벌법(중대산업재해) 정의 비교 (출제율 40% + 2026 연계) ──
     산업안전보건법 시행규칙 제3조: ①사망1명↑ ②3개월↑요양 부상자 동시2명↑ ③부상+직업성질병자 동시10명↑
     중대재해처벌법 제2조(중대산업재해): ①사망1명↑ ②동일사고 6개월↑치료 부상자 동시2명↑ ③동일유해요인 급성중독등 직업성질병자 1년내3명↑ */
  { id:'hyg20_06',
    enter:function(E){ var self=this; this.s={deaths:0, injured:2, months:3};
      E.controls('<div class="ctrl"><label>동일 사고 사망자 수 (명)</label><input type="range" id="q6a" min="0" max="3" step="1" value="0"><output id="q6ao">0</output></div>'
        +'<div class="ctrl"><label>동일 사고 부상자 수 (명)</label><input type="range" id="q6b" min="0" max="15" step="1" value="2"><output id="q6bo">2</output></div>'
        +'<div class="ctrl"><label>필요 요양(치료) 기간 (개월)</label><input type="range" id="q6c" min="1" max="12" step="1" value="3"><output id="q6co">3</output></div>');
      E.bind('#q6a','input',function(e){ self.s.deaths=+e.target.value; document.getElementById('q6ao').textContent=e.target.value; });
      E.bind('#q6b','input',function(e){ self.s.injured=+e.target.value; document.getElementById('q6bo').textContent=e.target.value; });
      E.bind('#q6c','input',function(e){ self.s.months=+e.target.value; document.getElementById('q6co').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var osha1=s.deaths>=1;
      var osha2=(s.injured>=2 && s.months>=3);
      var osha3=(s.injured>=10);
      var oshaResult=osha1||osha2||osha3;
      var sa1=s.deaths>=1;
      var sa2=(s.injured>=2 && s.months>=6);
      var saResult=sa1||sa2;   // 직업성질병자 1년내3명 조건은 슬라이더 변수와 무관해 별도 안내
      var fs=FS(H,0.024,12,15);
      var bx=W*0.06, colW=W*0.43, gap=W*0.02, y0=H*0.24;

      T(ctx,'슬라이더로 재해 규모를 바꾸며, 두 법의 "중대재해" 판정 기준이 어떻게 다른지 비교합니다',W*0.06,H*0.155,DIM,FS(H,0.021,11,14),'left');

      function panel(x,title,rows,result,resColor){
        var y=y0;
        T(ctx,title,x+colW/2,y,TXT,FS(H,0.027,13,15),'center','700'); y+=FS(H,0.04,14,20);
        for(var i=0;i<rows.length;i++){ var ok=rows[i][2];
          ctx.fillStyle=ok?'rgba(143,227,181,0.10)':'rgba(255,255,255,0.03)'; ctx.strokeStyle=ok?GRN:'rgba(255,255,255,0.10)';
          var rh=FS(H,0.058,20,28); RR(ctx,x,y,colW,rh,7); ctx.fill(); ctx.stroke();
          T(ctx,(ok?'✓ ':'· ')+rows[i][0],x+10,y+rh*0.4,ok?GRN:DIM,FS(H,0.02,10.5,13.5),'left');
          T(ctx,rows[i][1],x+10,y+rh*0.78,ok?GRN:DIM,FS(H,0.019,10,13),'left');
          y+=rh+FS(H,0.012,6,9); }
        y+=FS(H,0.014,7,11);
        ctx.fillStyle=result?'rgba(240,136,138,0.16)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=resColor;
        var rh2=FS(H,0.06,21,30); RR(ctx,x,y,colW,rh2,8); ctx.fill(); ctx.stroke();
        T(ctx,result?'해당 — 중대재해':'해당 없음',x+colW/2,y+rh2*0.65,resColor,FS(H,0.027,13,15),'center','700');
        return y+rh2;
      }
      var yEndL=panel(bx,'산업안전보건법 시행규칙 제3조',[
        ['① 사망자 1명 이상', '현재 사망 '+s.deaths+'명', osha1],
        ['② 3개월↑요양 부상자 동시 2명↑', '현재 부상 '+s.injured+'명 · 요양 '+s.months+'개월', osha2],
        ['③ 부상+직업성질병자 동시 10명↑', '현재 부상 '+s.injured+'명', osha3]
      ], oshaResult, oshaResult?RED:GRN);
      var yEndR=panel(bx+colW+gap,'중대재해처벌법 제2조(중대산업재해)',[
        ['① 사망자 1명 이상', '현재 사망 '+s.deaths+'명', sa1],
        ['② 동일사고 6개월↑치료 부상자 동시 2명↑', '현재 부상 '+s.injured+'명 · 치료 '+s.months+'개월', sa2],
        ['③ 동일 유해요인 급성중독 등 직업성질병자 1년내 3명↑', '슬라이더로 표현 불가 — 별도 확인 필요', false]
      ], saResult, saResult?RED:GRN);

      var y=Math.max(yEndL,yEndR)+FS(H,0.03,12,16);
      T(ctx,'핵심 차이: 요양·치료 기간 기준이 3개월(산안법) vs 6개월(중대재해처벌법)로 더 엄격 — 처벌법이 충족되면 산안법 기준도 항상 충족됩니다.',
        W*0.06,y,AMB,FS(H,0.021,11,14),'left');
      y+=FS(H,0.032,13,16);
      T(ctx,'2026 개정: 상시 50인 이상 사업장은 2027.1.1부터, 50인 미만은 2028.1.1부터 위험성평가 미실시·근로자 미참여 등에 단계적으로 과태료 제재가 적용됩니다(16장 연계).',
        W*0.06,y,DIM,FS(H,0.02,10.5,13.5),'left');

      E.tapHint(0,0,'슬라이더로 사망자·부상자수·요양기간 조절',true);
      E.big((oshaResult||saResult)?'중대재해 해당 — 사업주는 즉시 작업중지·대피조치':'현재 조건은 두 법 모두 중대재해 미해당',
            '산업안전보건법은 사업주의 작업중지·대피 의무를, 중대재해처벌법은 경영책임자의 형사처벌 가능성을 규정한다는 점도 함께 기억해 둡니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
