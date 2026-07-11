/* 산업위생기술사 제0장 — 시험의 전략 (동작만. 텍스트=content/hyg0.json) */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  var scenes=[
  { id:'hyg0_01', concept:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      /* 실계산: 필기 총 시험시간 · 종합 합격률 */
      var per=100, n=4, tot=per*n;            // 4교시 × 100분 = 400분
      var hrs=tot/60;                          // ≈ 6.7시간
      var pW=0.175, pI=0.65, pAll=pW*pI;      // 필기 15~20%(중앙 17.5%) × 면접 60~70%(중앙 65%)
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var NOTE=[
        '산업위생관리기술사는 필기(논술)와 면접(구술), 두 관문을 통과해야 합니다. 화면을 탭하며 각 관문을 차례로 살펴보세요.',
        '필기는 4교시 × 100분, 총 400분의 논술 마라톤입니다. 단답형과 주관식 논술형으로 구성되며 100점 만점에 60점 이상이면 합격 — 합격률은 약 15~20%입니다.',
        '면접은 약 30분의 구술 평가입니다. 면접위원 3~5명이 전문지식·실무능력·의사소통을 종합 평가하며, 60점 이상 합격에 합격률은 약 60~70%입니다.',
        '두 관문의 확률을 곱하면 종합 합격률은 약 11% — 열에 한 명꼴입니다. 그러나 구조를 알고 전략을 세우면 이 시험은 운이 아니라 준비의 문제가 됩니다.'];
      window.HygDoc(E,{
        title:'산업위생관리기술사 — 자격 취득의 두 관문',
        sub:['전체 구조','① 필기(논술)','② 면접(구술)','③ 자격 취득'][s.step],
        boxes:[
          {x:0.05,y:0.30,w:0.25,h:0.26,c:hl(1,BLU),t:'① 필기 — 논술',s:n+'교시 × '+per+'분 · 60점 합격'},
          {x:0.05,y:0.60,w:0.25,h:0.10,c:s.step===1?PNK:DIM,t:'합격률 약 15~20%',s:'단답형 + 주관식 논술형'},
          {x:0.385,y:0.30,w:0.25,h:0.26,c:hl(2,BLU),t:'② 면접 — 구술',s:'약 30분 · 위원 3~5명 · 60점'},
          {x:0.385,y:0.60,w:0.25,h:0.10,c:s.step===2?PNK:DIM,t:'합격률 약 60~70%',s:'전문지식·실무·의사소통'},
          {x:0.72,y:0.30,w:0.23,h:0.26,c:hl(3,GRN),t:'③ 자격 취득',s:'국가기술자격 최고 등급'},
          {x:0.72,y:0.60,w:0.23,h:0.10,c:s.step===3?AMB:DIM,t:'이론 + 실무 + 견해',s:'기술사가 요구하는 세 가지'}],
        arrows:[
          {x1:0.30,y1:0.43,x2:0.385,y2:0.43,c:s.step===2?ORA:DIM},
          {x1:0.635,y1:0.43,x2:0.72,y2:0.43,c:s.step===3?ORA:DIM}],
        calc:[
          {k:'필기 총 시험시간',v:n+'교시×'+per+'분 = '+tot+'분 ≈ '+hrs.toFixed(1)+'시간',c:BLU},
          {k:'종합 합격률',v:(pW*100).toFixed(1)+'% × '+(pI*100).toFixed(0)+'% ≈ '+(pAll*100).toFixed(1)+'%',c:ORA},
          {k:'필기 과목',v:'산업위생학 · 산업환기 · 측정평가 · 환경관리',c:GRN}],
        note:NOTE[s.step]});
      E.tapHint(0,0,'화면 탭 = 다음 관문',true);
    },
  },
  { id:'hyg0_02',
    enter:function(E){ var self=this; this.s={h:10};
      E.controls('<div class="ctrl"><label>주당 공부시간 (h)</label><input type="range" id="wkh" min="3" max="40" step="1" value="10"><output id="wkho">10</output></div>');
      E.bind('#wkh','input',function(e){ self.s.h=+e.target.value; document.getElementById('wkho').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      /* 550h 모델: 기본 300 + 서브노트 50 + 마무리 200 — 전부 슬라이더 값으로 실계산 */
      var PH=[{t:'기본 학습',h:300,c:BLU},{t:'서브노트',h:50,c:AMB},{t:'마무리·기출',h:200,c:GRN}];
      var tot=0,i; for(i=0;i<PH.length;i++) tot+=PH[i].h;
      var wk=tot/s.h;                          // 완주까지 주 수
      var mo=wk/4.345;                         // 완주까지 개월 수
      var x0=W*0.10, x1=W*0.90, y=H*0.36, bh=Math.max(30,H*0.07);
      ctx.textAlign='center';
      var x=x0;
      for(i=0;i<PH.length;i++){ var bw=(x1-x0)*PH[i].h/tot;
        ctx.globalAlpha=0.85; ctx.fillStyle=PH[i].c; ctx.fillRect(x,y,bw-3,bh); ctx.globalAlpha=1;
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.fillText(PH[i].t, x+bw/2, y-30);
        ctx.fillStyle=PH[i].c; ctx.font='12px sans-serif';
        ctx.fillText(PH[i].h+'h ≈ '+(PH[i].h/s.h).toFixed(1)+'주', x+bw/2, y-13);
        x+=bw; }
      /* 개월 축: 막대 전체 폭 = mo개월 */
      var ax=y+bh+22;
      ctx.strokeStyle=DIM; ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.beginPath(); ctx.moveTo(x0,ax); ctx.lineTo(x1,ax); ctx.stroke();
      var stepM = mo>24? 6 : (mo>10? 3 : 1);
      for(var m=0;m<=mo+1e-9;m+=stepM){ var mx=x0+(x1-x0)*m/mo; if(mx>x1+1) break;
        ctx.beginPath(); ctx.moveTo(mx,ax-4); ctx.lineTo(mx,ax+4); ctx.stroke();
        ctx.fillText(m+'개월', mx, ax+18); }
      /* 페이스 진단(실계산 개월 수 기준) */
      var msg, mc;
      if(mo<=12){ msg='1년 내 완주 페이스입니다'; mc=GRN; }
      else if(mo<=24){ msg='1~2년 장기전 페이스입니다 — 꾸준함이 관건입니다'; mc=AMB; }
      else { msg='완주까지 2년 이상 — 주당 시간을 조금 늘려 보세요'; mc=RED; }
      ctx.fillStyle=mc; ctx.font='700 15px sans-serif';
      ctx.fillText(msg, (x0+x1)/2, ax+50);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('총 '+tot+'h = 기본 학습 300h + 서브노트 정리 50h + 마무리 200h', (x0+x1)/2, ax+72);
      E.big('주 '+s.h+'시간 학습', '완주 약 '+mo.toFixed(1)+'개월 ('+Math.ceil(wk)+'주 · 총 '+tot+'h)');
    },
  },
  { id:'hyg0_03', concept:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      /* 실계산: 시간·분량 배분 */
      var per=100, nQ=4, pages=14;
      var tq=per/nQ;                           // 문제당 25분
      var pq=pages/nQ;                         // 문제당 3.5면
      var tp=per/pages;                        // 1면당 약 7.1분
      var LN=[0,2,4,5,6];
      var NOTE=[
        '① 정의 — 첫 문장이 승부처입니다. 핵심 용어의 정의를 한 문장으로 정확히 쓰면 채점자는 첫 줄에서 수준을 알아봅니다.',
        '② 원리·메커니즘 — 왜 그런지를 수식과 그림으로 보입니다. 도식이 들어간 답안은 글만 있는 답안보다 확실히 눈에 띄고, 그것이 곧 득점입니다.',
        '③ 종류·특징 — 나열형 내용은 표로 정리합니다. 표 하나가 문장 열 줄보다 빠르게 읽히고, 빠짐없이 썼다는 인상을 줍니다.',
        '④ 실무 적용·문제점·대책 — 기술사 답안의 차별점입니다. 현장 적용과 문제점, 대책까지 이어야 "경험이 있는 답안"이 됩니다.',
        '⑤ 결론 — 본인 견해로 답안을 닫습니다. 기승전결이 완성된 답안은 같은 지식이라도 점수가 다릅니다.'];
      window.HygDoc(E,{
        title:'논술 답안의 기술 — 다섯 단락 구조',
        sub:'화면 탭 = 다음 단락 ('+(s.step+1)+'/5)',
        codeTitle:'답안 템플릿',
        code:['1. 정의','   - 핵심 용어를 한 문장으로','2. 원리·메커니즘','   - 그림·수식 필수(도식화=득점)','3. 종류·특징 (표)','4. 실무 적용·문제점·대책','5. 결론 — 본인 견해'],
        actLine:LN[s.step],
        boxes:[
          {x:0.62,y:0.28,w:0.33,h:0.12,c:s.step===0?ORA:BLU,t:'기승전결 구조',s:'서론→본론→결론이 한눈에'},
          {x:0.62,y:0.44,w:0.33,h:0.12,c:s.step===2?ORA:GRN,t:'키워드 강조',s:'채점자는 키워드를 찾습니다'},
          {x:0.62,y:0.60,w:0.33,h:0.12,c:s.step===1?ORA:PNK,t:'도식화 = 득점',s:'문제당 그림·표 1개 이상'}],
        calc:[
          {k:'교시',v:per+'분 · 논술 '+nQ+'문제',c:BLU},
          {k:'문제당 시간',v:per+'÷'+nQ+' = '+tq+'분',c:ORA},
          {k:'문제당 분량',v:pages+'면÷'+nQ+' = '+pq.toFixed(1)+'면',c:GRN},
          {k:'1면당',v:'약 '+tp.toFixed(1)+'분',c:PNK}],
        note:NOTE[s.step]});
      E.tapHint(0,0,'화면 탭 = 다음 단락',true);
    },
  },
  { id:'hyg0_04', concept:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      /* 실계산: 복원 훈련 물량 */
      var perDay=3, days=40, topics=perDay*days;   // 하루 3주제 × 40일 = 120주제
      var hl=function(i){ return s.step===i? ORA : BLU; };
      var NOTE=[
        '① 교재와 기출에서 자주 나오는 주제를 뽑습니다. 기출 분석이 곧 출제 지도입니다 — 같은 주제가 표현만 바꿔 반복 출제됩니다.',
        '② 주제당 딱 1페이지 — 정의→수식→그림→실무 예시→결론의 틀로 압축합니다. 1페이지에 담기지 않으면 아직 소화가 덜 된 것입니다.',
        '③ 문장이 아니라 뼈대를 남깁니다. 채점자가 찾는 것은 키워드·수식·도식이므로, 외울 것도 바로 그 세 가지입니다.',
        '④ 백지에 서브노트를 보지 않고 복원해 봅니다. 복원되지 않는 부분이 바로 시험장에서 무너질 부분 — 그곳만 다시 채우면 됩니다.'];
      window.HygDoc(E,{
        title:'서브노트 — 아는 것을 쓸 수 있는 것으로',
        sub:'화면 탭 = 다음 단계 ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.03,y:0.34,w:0.21,h:0.26,c:hl(0),t:'① 교재·기출',s:'범위 파악 · 주제 추출'},
          {x:0.275,y:0.34,w:0.21,h:0.26,c:hl(1),t:'② 1페이지 요약',s:'주제당 딱 1페이지'},
          {x:0.52,y:0.34,w:0.21,h:0.26,c:hl(2),t:'③ 키워드·수식·그림',s:'답안의 뼈대만 남기기'},
          {x:0.765,y:0.34,w:0.21,h:0.26,c:s.step===3?ORA:GRN,t:'④ 암송·백지 복원',s:'보지 않고 재현하기'}],
        arrows:[
          {x1:0.24,y1:0.47,x2:0.275,y2:0.47,c:s.step>=1?ORA:DIM},
          {x1:0.485,y1:0.47,x2:0.52,y2:0.47,c:s.step>=2?ORA:DIM},
          {x1:0.73,y1:0.47,x2:0.765,y2:0.47,c:s.step>=3?ORA:DIM}],
        calc:[
          {k:'주제당 분량',v:'1페이지 (정의·식·그림·실무·결론)',c:BLU},
          {k:'복원 훈련',v:perDay+'주제/일 × '+days+'일 = '+topics+'주제',c:GRN},
          {k:'완성 기준',v:'백지 복원 성공률 100%',c:ORA}],
        note:NOTE[s.step]});
      E.tapHint(0,0,'화면 탭 = 다음 단계',true);
    },
  },
  { id:'hyg0_05', concept:true,
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      /* 실계산: 예상 문항 수 */
      var min=30, perQ=2.5, nQ=Math.round(min/perQ);   // 30분 ÷ 문항당 약 2.5분 ≈ 12개
      var hl=function(i){ return s.step===i? ORA : BLU; };
      var NOTE=[
        '면접은 지식 시험이 아니라 "이 사람이 기술사로서 일할 수 있는가"의 검증입니다. 위원 3~5명이 약 30분간 네 가지 축으로 평가합니다.',
        '① 전문지식 — 필기의 핵심 개념을 말로 설명할 수 있어야 합니다. 정의→원리→실무 순서로 두괄식으로 말하는 연습이 필요합니다.',
        '② 실무 경험 — 본인이 수행한 측정·평가·개선 사례를 STAR(상황-과제-행동-결과)로 정리해 두세요. 면접에서는 경험이 곧 답입니다.',
        '③ 견해·판단 — "이런 현장이라면 어떻게 하시겠습니까?" 모르는 질문에는 모른다고 정직하게 말하고 접근 방법을 제시하는 것이 정답입니다.',
        '④ 소통·태도 — 결론부터 말하고 근거를 붙이는 두괄식, 차분하고 겸손한 태도가 신뢰를 만듭니다. 위원은 동료가 될 사람을 뽑습니다.'];
      window.HygDoc(E,{
        title:'면접(구술) — 경험이 답이 되는 시간',
        sub:'화면 탭 = 다음 평가축 ('+(s.step+1)+'/5)',
        boxes:[
          {x:0.03,y:0.34,w:0.21,h:0.26,c:hl(1),t:'① 전문지식 확인',s:'전공 핵심 개념 질문'},
          {x:0.275,y:0.34,w:0.21,h:0.26,c:hl(2),t:'② 실무 경험',s:'본인 수행 업무 검증'},
          {x:0.52,y:0.34,w:0.21,h:0.26,c:hl(3),t:'③ 견해·판단',s:'상황 제시형 질문'},
          {x:0.765,y:0.34,w:0.21,h:0.26,c:s.step===4?ORA:GRN,t:'④ 소통·태도',s:'논리 · 명료함 · 자세'}],
        arrows:[
          {x1:0.24,y1:0.47,x2:0.275,y2:0.47,c:DIM},
          {x1:0.485,y1:0.47,x2:0.52,y2:0.47,c:DIM},
          {x1:0.73,y1:0.47,x2:0.765,y2:0.47,c:DIM}],
        calc:[
          {k:'구술 시간',v:'약 '+min+'분',c:BLU},
          {k:'면접위원',v:'3~5명 종합 평가',c:PNK},
          {k:'예상 문항',v:min+'분 ÷ 문항당 '+perQ+'분 ≈ '+nQ+'개',c:ORA},
          {k:'합격 기준',v:'100점 만점 60점 이상',c:GRN}],
        note:NOTE[s.step]});
      E.tapHint(0,0,'화면 탭 = 다음 평가축',true);
    },
  },
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
