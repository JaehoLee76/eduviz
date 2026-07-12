/* 산업위생기술사 제0장 — 시험의 전략 (동작만. 텍스트=content/hyg0.json)
   인트로 = 라마치니(1700 『일하는 사람들의 질병』) 시네마틱 — 초상은 판화풍 SVG(내장 data URI). */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  // 판화풍 초상(내장 SVG): 오벌 프레임 + 17세기 의사(긴 가발·로브) 실루엣 — 앰버 톤
  var RAMA_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380">'
    +'<rect width="300" height="380" fill="#14141c"/>'
    +'<ellipse cx="150" cy="185" rx="118" ry="152" fill="#1c1a22" stroke="#8a713b" stroke-width="3"/>'
    +'<ellipse cx="150" cy="185" rx="106" ry="140" fill="none" stroke="#5c4d2c" stroke-width="1.2"/>'
    +'<path d="M62 330 Q78 246 128 232 L150 244 L172 232 Q222 246 238 330 Z" fill="#2c2620"/>'
    +'<path d="M62 330 Q78 246 128 232 L150 244 L172 232 Q222 246 238 330 Z" fill="none" stroke="#8a713b" stroke-width="1.4" opacity="0.7"/>'
    +'<path d="M136 218 L150 250 L164 218 L158 208 L142 208 Z" fill="#cfc4a8"/>'
    +'<ellipse cx="150" cy="168" rx="34" ry="44" fill="#d8b98a"/>'
    +'<path d="M150 150 q10 16 4 34 q-2 8 -4 10" fill="none" stroke="#a8875c" stroke-width="2" opacity="0.7"/>'
    +'<circle cx="137" cy="160" r="3.2" fill="#3a3026"/><circle cx="163" cy="160" r="3.2" fill="#3a3026"/>'
    +'<path d="M138 196 q12 8 24 0" fill="none" stroke="#7a5c38" stroke-width="2.4"/>'
    +'<path d="M150 108 q-52 2 -58 58 q-4 44 10 86 q6 18 22 24 q-14 -46 -12 -84 q2 -34 38 -36 q36 2 38 36 q2 38 -12 84 q16 -6 22 -24 q14 -42 10 -86 q-6 -56 -58 -58 Z" fill="#403428"/>'
    +'<path d="M112 150 q-6 60 8 108 M188 150 q6 60 -8 108" stroke="#5a4632" stroke-width="3" fill="none" opacity="0.8"/>'
    +'<text x="150" y="358" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#c8b070">RAMAZZINI · 1700</text>'
    +'</svg>');
  var scenes=[

  // ══════ 시네마틱 인트로 — 라마치니 (직업의학의 아버지, 끝나면 엔드카드) ══════
  { id:'hyg0_00', cinematic:true, introCard:true,
    story:{ portrait:RAMA_SVG, name:'베르나르디노 라마치니',
      sub:'Bernardino Ramazzini · 1633–1714<br>직업의학의 아버지',
      caps:[
        ['산업위생의 세계로 초대합니다'],
        ['1700년, 이탈리아의 의사 라마치니가 낯선 책을 펴냅니다.','『일하는 사람들의 질병』 — 인류 최초의 직업병 의학서였죠.'],
        ['그는 히포크라테스 이래의 문진에 질문 하나를 더했습니다.','"당신의 직업은 무엇입니까?"'],
        ['병의 원인이 일터에 있다면, 일터를 바꿔 병을 막을 수 있다 —','산업위생학 전체가 이 한 문장에서 자랍니다.'],
        ['유해인자를 측정하고, 평가하고, 관리한다.','근로자의 건강을 지키는 기술의 정점 — 기술사의 길을 시작합니다.']
      ] },
    enter:function(E){ this.s={ ended:false, acc:0, last:0 }; E.setOn([]); },
    tap:function(E){ if(!this.s.ended){ this.s.ended=true; E.introEnd(this.story); } },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      function ss(a,b,x){ x=(x-a)/(b-a); x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
      function rnd(i){ return ((Math.sin(i*12.9898+78.233)*43758.5453)%1+1)%1; }
      var ANIM=1050, FADE=18, HOLD=170;
      var _n=(typeof performance!=='undefined'&&performance.now)?performance.now():0, _dt=s.last?(_n-s.last):16.7; if(_dt<0||_dt>200)_dt=16.7; s.last=_n; s.acc=(s.acc||0)+_dt*0.036; var local=s.acc;
      if(local>=ANIM+HOLD){ if(!s.ended){ s.ended=true; E.introEnd(this.story); } return; }
      var ph=Math.min(local,ANIM)/ANIM, seam=(local<FADE? local/FADE : 1);
      ctx.globalAlpha=seam;
      // 작업장 분진 입자(결정적) — 후반부, 관리로 기준선 위 입자가 사라진다
      var clear=ss(0.62,0.92,ph);
      var stdY=H*0.55, n=54;
      for(var i=0;i<n;i++){
        var bx=rnd(i)*W, sway=Math.sin(local*0.05+i)*14;
        var by=(rnd(i*7+3)*H*0.66)+H*0.12 + Math.sin(local*0.03+i*2)*8;
        var harmful=by<stdY;
        var a=harmful? (0.5*(1-clear)) : 0.42;
        if(a<=0.02) continue;
        ctx.fillStyle= harmful? 'rgba(240,136,138,'+a+')' : 'rgba(143,227,181,'+(a*0.9)+')';
        ctx.beginPath(); ctx.arc(bx+sway, by, 2+rnd(i*13)*2.6, 0, 7); ctx.fill();
      }
      // 노출기준선(중반부)
      var lineIn=ss(0.42,0.58,ph);
      if(lineIn>0){ ctx.strokeStyle='rgba(242,189,85,'+(0.85*lineIn)+')'; ctx.lineWidth=2; ctx.setLineDash([8,6]);
        ctx.beginPath(); ctx.moveTo(W*0.08, stdY); ctx.lineTo(W*0.08+(W*0.84)*lineIn, stdY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(242,189,85,'+lineIn+')'; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('노출기준 — 지켜야 할 선', W*0.08, stdY-10); }
      // 펼친 책(초반부)
      var bookIn=ss(0.10,0.30,ph)*(1-ss(0.55,0.75,ph));
      if(bookIn>0.02){ ctx.save(); ctx.globalAlpha=seam*bookIn;
        var bcx=W*0.5, bcy=H*0.36, bw=Math.min(210,W*0.24), bh=bw*0.62;
        ctx.fillStyle='#241f18'; ctx.strokeStyle='#8a713b'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(bcx-bw,bcy); ctx.quadraticCurveTo(bcx-bw*0.5,bcy-bh*0.34,bcx,bcy-bh*0.16);
        ctx.quadraticCurveTo(bcx+bw*0.5,bcy-bh*0.34,bcx+bw,bcy); ctx.lineTo(bcx+bw,bcy+bh*0.5);
        ctx.quadraticCurveTo(bcx+bw*0.5,bcy+bh*0.2,bcx,bcy+bh*0.38); ctx.quadraticCurveTo(bcx-bw*0.5,bcy+bh*0.2,bcx-bw,bcy+bh*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bcx,bcy-bh*0.16); ctx.lineTo(bcx,bcy+bh*0.38); ctx.stroke();
        ctx.fillStyle='#c8b070'; ctx.font='600 13px Georgia,serif'; ctx.textAlign='center';
        ctx.fillText('De Morbis Artificum', bcx, bcy+bh*0.72);
        ctx.fillStyle='#8a8893'; ctx.font='11px sans-serif'; ctx.fillText('일하는 사람들의 질병 · 1700', bcx, bcy+bh*0.72+18);
        ctx.restore(); }
      // 라마치니의 질문(중반부)
      var qIn=ss(0.34,0.48,ph)*(1-ss(0.60,0.78,ph));
      if(qIn>0.02){ ctx.globalAlpha=seam*qIn; ctx.fillStyle='#e8ddc0'; ctx.font='600 '+Math.min(30,W*0.032)+'px Georgia,serif'; ctx.textAlign='center';
        ctx.fillText('"당신의 직업은 무엇입니까?"', W/2, H*0.30); ctx.globalAlpha=seam; }
      // 자막(하단, 구간별 페이드)
      var caps=this.story.caps, seg=1/caps.length;
      for(var c=0;c<caps.length;c++){
        var t0=c*seg, t1=(c+1)*seg;
        var a2=ss(t0,t0+seg*0.25,ph)*(1-ss(t1-seg*0.18,t1,ph)); if(c===caps.length-1) a2=ss(t0,t0+seg*0.25,ph);
        if(a2<=0.02) continue;
        ctx.globalAlpha=seam*a2; ctx.textAlign='center';
        var lines=caps[c];
        for(var L=0;L<lines.length;L++){ ctx.fillStyle=(L===0?'#dfeefb':'#b9b6c4'); ctx.font=(L===0?'600 ':'')+Math.min(21,W*0.023)+'px sans-serif';
          ctx.fillText(lines[L], W/2, H*0.80+L*30); }
      }
      ctx.globalAlpha=1; }
  },

  { id:'hyg0_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
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
          {x:0.05,y:0.59,w:0.25,h:0.14,c:s.step===1?PNK:DIM,t:'합격률 약 15~20%',s:'단답형 + 주관식 논술형'},
          {x:0.385,y:0.30,w:0.25,h:0.26,c:hl(2,BLU),t:'② 면접 — 구술',s:'약 30분 · 위원 3~5명 · 60점'},
          {x:0.385,y:0.59,w:0.25,h:0.14,c:s.step===2?PNK:DIM,t:'합격률 약 60~70%',s:'전문지식·실무·의사소통'},
          {x:0.72,y:0.30,w:0.23,h:0.26,c:hl(3,GRN),t:'③ 자격 취득',s:'국가기술자격 최고 등급'},
          {x:0.72,y:0.59,w:0.23,h:0.14,c:s.step===3?AMB:DIM,t:'이론 + 실무 + 견해',s:'기술사가 요구하는 세 가지'}],
        arrows:[
          {x1:0.30,y1:0.43,x2:0.385,y2:0.43,c:s.step===2?ORA:DIM},
          {x1:0.635,y1:0.43,x2:0.72,y2:0.43,c:s.step===3?ORA:DIM}],
        calc:[
          {k:'필기 총 시험시간',v:n+'교시×'+per+'분 = '+tot+'분 ≈ '+hrs.toFixed(1)+'시간',c:BLU},
          {k:'종합 합격률',v:(pW*100).toFixed(1)+'% × '+(pI*100).toFixed(0)+'% ≈ '+(pAll*100).toFixed(1)+'%',c:ORA},
          {k:'필기 과목',v:'산업위생학 · 산업환기 · 측정평가 · 환경관리',c:GRN}],
        note:NOTE[s.step]});
      E.tapHint(0,0,'다음 관문',true);
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
  { id:'hyg0_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
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
      E.tapHint(0,0,'다음 단락',true);
    },
  },
  { id:'hyg0_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
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
      E.tapHint(0,0,'다음 단계',true);
    },
  },
  { id:'hyg0_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
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
      E.tapHint(0,0,'다음 평가축',true);
    },
  },
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
