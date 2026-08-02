/* 빅데이터 분석 제51장 — 과목 III 총정리: 분석 기획
   (해결방안 탐색 2×2 매트릭스·분석 과제 관리 프로세스 7단계·분석가의 자격·방법론의 뼈대·거버넌스 체계)
   동작(behavior)만. 텍스트=content/bda51.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(분류 판정·단계별 건수·팀 규모·소요기간·전환율 등)는 아래 고정 데이터로부터
   이 파일 로드 시 또는 draw 시 실제 계산(하드코딩 금지). 난수 없음(전 고정 배열/결정적 계산).
   51.1·51.2 = 동작하는 모형. 51.3~51.5 = window.BdaMap(js/bda_map.js)을 쓴 개념 체계도. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a', WHITE='#efe4ea';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=19, pad=12, top=y, n=lines.length, ht=n*lh+pad*2+(title?24:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?24:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='12px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && ((typeof actLine==='number'&&i===actLine)||(actLine.indexOf&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=ROSE; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#efe4ea'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }

  // ══════════ 51.1 데이터: 해결방안 탐색 2×2 매트릭스 ══════════
  // 축: 기존 시스템 활용 가능 여부(sys) × 분석 노하우 축적 정도(know). 네 칸 모두 실제 사례로 채운다.
  var SOLU51 = [
    {n:'그대로 활용',        d:['기존 시스템을 그대로 써서','내부 인력이 해결']},          // sys=1,know=1
    {n:'교육/채용 후 활용',   d:['부족한 역량을 교육·채용으로 채운 뒤','기존 시스템으로 해결']}, // sys=1,know=0
    {n:'시스템 구축 후 해결', d:['역량은 있으니 새 시스템을','자체로 구축해 해결']},          // sys=0,know=1
    {n:'전문업체 소싱',      d:['역량도 시스템도 없으니','외부 전문업체의 도움을 받아 해결']}  // sys=0,know=0
  ];
  function solveCell51(sys,know){ return sys? (know?SOLU51[0]:SOLU51[1]) : (know?SOLU51[2]:SOLU51[3]); }
  var PROJ51 = [
    {n:'매출 리포트 자동화',     sys:1, know:1},
    {n:'상담원 배치 최적화',     sys:1, know:0},
    {n:'신사업 고객 이탈 예측',  sys:0, know:0},
    {n:'설비 고장 예지',        sys:0, know:1}
  ];

  // ══════════ 51.2 데이터: 분석 과제 관리 프로세스 7단계 파이프라인 ══════════
  var IDEAS51 = [
    {n:'콜봇 응대 자동화',    impact:8, cost:4},
    {n:'재고 이상탐지',       impact:7, cost:5},
    {n:'직원 만족도 예측',    impact:4, cost:3},
    {n:'매장 배치 최적화',    impact:6, cost:6},
    {n:'거래 사기 탐지',      impact:9, cost:7},
    {n:'설비 고장 예지',      impact:8, cost:8},
    {n:'배송 경로 최적화',    impact:7, cost:5},
    {n:'고객 이탈 방지',      impact:9, cost:4},
    {n:'문서 검색 개선',      impact:3, cost:2},
    {n:'SNS 여론 모니터링',   impact:5, cost:6}
  ];
  var N51 = IDEAS51.length; // 1) 아이디어 발굴: 10건
  var CANDS51 = IDEAS51.filter(function(x){ return x.impact>=5; }); // 2) 과제 후보 제안
  CANDS51.forEach(function(x){ x.net=x.impact-x.cost; });
  var SORTED51 = CANDS51.slice().sort(function(a,b){ return b.net-a.net; });
  var CONFIRMED51 = SORTED51.slice(0,4); // 3) 과제 확정: 상위 4건
  CONFIRMED51.forEach(function(x){ x.team=Math.ceil(x.cost/3); x.weeks=x.cost*2; });
  var TEAM_TOTAL51 = CONFIRMED51.reduce(function(s,x){ return s+x.team; },0);          // 4) 팀 구성
  var MAXWEEKS51 = Math.max.apply(null, CONFIRMED51.map(function(x){ return x.weeks; })); // 5) 과제 실행
  var ATRISK51 = CONFIRMED51.filter(function(x){ return x.weeks>10; });                // 6) 진행 관리
  var SUCCESS51 = CONFIRMED51.filter(function(x){ return x.weeks<=10; });              // 7) 결과 공유·개선
  var CONV51 = CONFIRMED51.length / N51;
  var COUNTS51 = [N51, CANDS51.length, CONFIRMED51.length, CONFIRMED51.length, CONFIRMED51.length, CONFIRMED51.length, CONFIRMED51.length];
  var STAGE_NAMES51 = ['아이디어 발굴','과제 후보 제안','과제 확정','팀 구성','과제 실행','진행 관리','결과 공유·개선'];
  var STAGE_SHORT51 = ['발굴','제안','확정','팀구성','실행','관리','공유'];

  var scenes = [

  // ══════════ 1. 해결방안 탐색 — 2×2 매트릭스로 실제 판정 ══════════
  { id:'bda51_01',
    enter:function(E){ var self=this; self.s={sys:1, know:1};
      E.controls('<div class="ctrl"><label>기존 시스템 활용 가능?</label><input type="range" id="b511s" min="0" max="1" step="1" value="1"><output id="b511so">예</output></div>'
               +'<div class="ctrl"><label>분석 노하우 충분?</label><input type="range" id="b511k" min="0" max="1" step="1" value="1"><output id="b511ko">예</output></div>');
      E.bind('#b511s','input',function(e){ self.s.sys=+e.target.value; document.getElementById('b511so').textContent=self.s.sys?'예':'아니오'; });
      E.bind('#b511k','input',function(e){ self.s.know=+e.target.value; document.getElementById('b511ko').textContent=self.s.know?'예':'아니오'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'sys  = 기존_시스템_활용가능여부   # '+s.sys, hl:'sys'},
        {t:'know = 분석_노하우_충분여부      # '+s.know, hl:'know'},
        {t:'방안 = 매트릭스[sys][know]', hl:'매트릭스[sys][know]'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'solution_matrix.py', 2);
      var sol=solveCell51(s.sys,s.know);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('판정 → '+sol.n, W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(sol.d[0], W*0.04, ry+20);
      ctx.fillText(sol.d[1], W*0.04, ry+37);
      var ty=ry+62;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('같은 규칙으로 네 사례를 전부 분류(그리드의 1~4)', W*0.04, ty);
      PROJ51.forEach(function(p,pi){
        var y=ty+20+pi*17, ps=solveCell51(p.sys,p.know);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=ORG; ctx.fillText((pi+1)+')', W*0.04, y);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(p.n+' → '+ps.n, W*0.04+20, y);
      });

      var mx0=W*0.50, mx1=W*0.965, my0=40, my1=225, mmx=(mx0+mx1)/2, mmy=(my0+my1)/2;
      function cellXY(sys,know){ var cx=know?(mmx+mx1)/2:(mx0+mmx)/2, cy=sys?(my0+mmy)/2:(mmy+my1)/2; return [cx,cy]; }
      function quadRect(sys,know){ var x0=know?mmx:mx0, x1=know?mx1:mmx, y0=sys?my0:mmy, y1=sys?mmy:my1; return [x0,y0,x1-x0,y1-y0]; }
      var qr=quadRect(s.sys,s.know);
      ctx.fillStyle='rgba(255,210,122,0.16)'; ctx.fillRect(qr[0],qr[1],qr[2],qr[3]);
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1;
      ctx.strokeRect(mx0,my0,mx1-mx0,my1-my0);
      ctx.beginPath(); ctx.moveTo(mmx,my0); ctx.lineTo(mmx,my1); ctx.moveTo(mx0,mmy); ctx.lineTo(mx1,mmy); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('노하우 부족', (mx0+mmx)/2, my0-10); ctx.fillText('노하우 충분', (mmx+mx1)/2, my0-10);
      ctx.save(); ctx.translate(mx0-14,(my0+mmy)/2); ctx.rotate(-Math.PI/2); ctx.fillText('시스템 있음',0,0); ctx.restore();
      ctx.save(); ctx.translate(mx0-14,(mmy+my1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('시스템 없음',0,0); ctx.restore();
      [[1,0,SOLU51[1].n],[1,1,SOLU51[0].n],[0,0,SOLU51[3].n],[0,1,SOLU51[2].n]].forEach(function(c){
        var p=cellXY(c[0],c[1]);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(c[2], p[0], p[1]-4);
      });
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.strokeRect(qr[0]+2,qr[1]+2,qr[2]-4,qr[3]-4);
      PROJ51.forEach(function(p,pi){
        var p0=cellXY(p.sys,p.know), ang=pi*(Math.PI/2)+0.5, ox=Math.cos(ang)*16, oy=Math.sin(ang)*16;
        var x=p0[0]+ox, y=p0[1]+oy+16;
        ctx.fillStyle=ORG; ctx.beginPath(); ctx.arc(x,y,8,0,7); ctx.fill();
        ctx.fillStyle='#241a1e'; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText(''+(pi+1), x, y+4);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 두 축을 바꿔 판정이 실제로 재계산되는 것을 보세요', true);
      E.big('해결방안 탐색 — 2×2 매트릭스로 실제 판정', '문제를 정의한 다음에는 <b>어떻게 풀 것인가</b>를 정해야 합니다. 그 판단을 감이 아니라 구조로 하는 것이 해결방안 탐색 매트릭스입니다 — 가로축은 <b>분석 노하우(기법 지식)를 충분히 쌓았는가</b>, 세로축은 <b>기존 정보시스템을 그대로 활용할 수 있는가</b>입니다. 두 축을 실제로 교차하면 네 칸이 나옵니다: 시스템도 있고 노하우도 있으면 <b>그대로 활용</b>, 시스템은 있는데 노하우가 없으면 <b>교육/채용 후 활용</b>, 노하우는 있는데 시스템이 없으면 <b>시스템 구축 후 해결</b>, 둘 다 없으면 <b>전문업체 소싱</b>입니다. 지금 슬라이더 값(시스템 '+(s.sys?'있음':'없음')+' · 노하우 '+(s.know?'충분':'부족')+')을 매트릭스에 넣으면 실제로 "'+sol.n+'"이 되고, 네 개의 사례를 같은 규칙에 넣으면 네 칸이 하나씩 빠짐없이 채워집니다 — 이것이 "매트릭스"라는 이름이 뜻하는 것입니다.'); }
  },

  // ══════════ 2. 분석 과제 관리 프로세스 7단계 파이프라인 ══════════
  { id:'bda51_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; E.blip(360+this.s.step*30,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, st=s.step;
      var codeSets=[
        ["ideas = [열 개의 자유 제안]", "len(ideas)  # "+N51],
        ["cands = [x for x in ideas if x.impact>=5]", "len(cands)  # "+CANDS51.length],
        ["net = impact - cost", "cands.sort(key=lambda x: -net)", "confirmed = cands[:4]"],
        ["team = ceil(cost/3)  # 과제별", "sum(team)  # "+TEAM_TOTAL51+'명'],
        ["weeks = cost*2  # 과제별", "총기간 = max(weeks)  # 병렬"],
        ["at_risk = [t for t in confirmed if weeks(t)>10]", "len(at_risk)  # "+ATRISK51.length+'건'],
        ["성공 = [t for t in confirmed if weeks(t)<=10]", "전환율 = len(confirmed)/len(ideas)"]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codeSets[st], 'task_pipeline.py', codeSets[st].length-1);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText((st+1)+') '+STAGE_NAMES51[st], W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var msg;
      if(st===0) msg=['아이디어 '+N51+'건이 자유롭게 들어옵니다', '(아직 아무 것도 걸러내지 않은 원안)'];
      else if(st===1) msg=['영향도(impact)≥5로 걸러 '+CANDS51.length+'건 통과', '(탈락 '+(N51-CANDS51.length)+'건: 만족도예측·문서검색)'];
      else if(st===2) msg=['영향도−난이도(net) 상위 4건 확정', CONFIRMED51.map(function(x){return x.n;}).join(' · ')];
      else if(st===3) msg=['과제별 팀 규모 = ⌈원가/3⌉', '합계 팀원 = '+TEAM_TOTAL51+'명'];
      else if(st===4) msg=['과제별 소요기간 = 원가×2주', '병렬 진행 → 전체 기간 = 최댓값 '+MAXWEEKS51+'주'];
      else if(st===5) msg=['10주 초과 과제 = 지연 위험 '+ATRISK51.length+'건', '('+ATRISK51.map(function(x){return x.n;}).join(',')+')'];
      else msg=['성공 '+SUCCESS51.length+'건 · 지연 '+ATRISK51.length+'건', '전환율 = '+CONFIRMED51.length+'/'+N51+' = '+Math.round(CONV51*100)+'%'];
      ctx.fillText(msg[0], W*0.04, ry+20); ctx.fillText(msg[1], W*0.04, ry+38);

      var bx0=W*0.50, bx1=W*0.965, bBot=225, bTop=42, maxC=N51*1.15, gap=(bx1-bx0)/7, bw=gap*0.6;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('단계별로 남아 있는 과제 수', bx0, bTop-16);
      COUNTS51.forEach(function(c,i){
        var x=bx0+i*gap+gap*0.5-bw/2, h=(c/maxC)*(bBot-bTop);
        ctx.fillStyle = i===st? GLD : (i<st? BLU : 'rgba(122,184,255,0.28)');
        ctx.fillRect(x, bBot-h, bw, h);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(i===st)?GLD:DIM; ctx.textAlign='center';
        ctx.fillText(''+c, x+bw/2, bBot-h-7);
        ctx.font='11px sans-serif'; ctx.fillStyle=(i===st)?TXT:DIM;
        ctx.fillText(STAGE_SHORT51[i], x+bw/2, bBot+15);
      });
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx1,bBot); ctx.stroke();

      E.tapHint(W/2, H*0.95, '화면 탭 = 7단계 파이프라인의 다음 단계로 진행', true);
      E.big('분석 과제 관리 프로세스 7단계', '과제를 하나 확정했다고 끝이 아닙니다 — 아이디어부터 결과 공유까지 실제로 흘려보내는 관리 절차가 있습니다: <b>아이디어 발굴</b>(자유 제안 '+N51+'건) → <b>과제 후보 제안</b>(영향도 기준으로 걸러 '+CANDS51.length+'건) → <b>과제 확정</b>(영향도−난이도 상위 4건: '+CONFIRMED51.map(function(x){return x.n;}).join(', ')+') → <b>팀 구성</b>(과제별 팀 규모를 합해 '+TEAM_TOTAL51+'명) → <b>과제 실행</b>(병렬 진행이므로 전체 기간은 가장 오래 걸리는 과제 기준 '+MAXWEEKS51+'주) → <b>진행 관리</b>(10주를 넘겨 지연 위험으로 표시된 과제 '+ATRISK51.length+'건) → <b>결과 공유·개선</b>(최종 성공 '+SUCCESS51.length+'건, 아이디어 대비 전환율 '+Math.round(CONV51*100)+'%). 단계마다 실제로 몇 건이 살아남는지 세어 보면, 관리는 "좋은 아이디어 하나 찾기"가 아니라 <b>깔때기를 통과시키는 절차 전체</b>라는 것이 드러납니다.'); }
  },

  // ══════════ 3. 분석가의 자격과 출발점 (체계도) ══════════
  { id:'bda51_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      var cols=[
        { t:'데이터 사이언스 3대 역량', c:ROSE, items:[
          {t:'수학·통계 지식', s:'현상을 숫자로 옮기고 불확실성을 다루는 힘'},
          {t:'IT 기술', s:'데이터를 실제로 다루고 계산을 돌리는 도구'},
          {t:'도메인 지식', s:'그 숫자가 현장에서 무엇을 뜻하는지 아는 눈'}
        ]},
        { t:'분석가에게 요구되는 영역', c:BLU, items:[
          {t:'분석적 역량', s:'데이터를 실제로 분석해 답을 뽑는 힘'},
          {t:'비즈니스 역량', s:'어떤 문제가 풀 가치가 있는지 아는 감각'},
          {t:'IT·프로그래밍 역량', s:'도구를 만들고 다룰 줄 아는 손'},
          {t:'의사소통 역량', s:'결과를 현업이 알아듣게 옮기는 힘'},
          {t:'프로젝트관리 역량', s:'일정·자원 안에서 끝까지 끌고 가는 힘'},
          {t:'리더십', s:'여러 역량을 가진 사람을 하나로 모으는 힘'}
        ]},
        { t:'분석 기획 시 고려사항', c:GLD, items:[
          {t:'가용한 데이터', s:'쓸 수 있는 데이터가 실제로 있는가'},
          {t:'적절한 활용 사례', s:'참고할 만한 앞선 사례가 있는가'},
          {t:'수행상의 장애요소', s:'조직·문화·규제가 발목 잡지 않는가'}
        ]},
        { t:'데이터 유형 3분류', c:GRN, items:[
          {t:'정형 데이터', s:'행과 열의 표로 이미 정리된 데이터'},
          {t:'반정형 데이터', s:'구조는 있지만 표는 아닌 데이터'},
          {t:'비정형 데이터', s:'정해진 구조가 없는 데이터(글·이미지·영상)'}
        ]}
      ];
      var total=cols.reduce(function(a,c){ return a+c.items.length; },0);
      window.BdaMap(E, {
        title:'분석가의 자격과 출발점',
        sub:'탭으로 한 갈래씩 짚어 봅니다',
        cols:cols,
        focus: s.step===0? -1 : s.step-1,
        foot:'네 갈래 · 항목 '+total+'개(배열 길이에서 실제로 집계)'
      });
      E.tapHint(0,0,'▶ 탭으로 한 갈래씩', false);
      E.big('분석가의 자격과 출발점', '분석 프로젝트는 사람과 준비물에서 시작합니다. <b>데이터 사이언스의 3대 역량</b>은 수학·통계 지식 · IT 기술 · 도메인 지식이며, 이 셋이 겹치는 자리에 서야 진짜 통찰이 나옵니다. 실무의 <b>분석가</b>에게는 그보다 더 넓게 분석·비즈니스·IT/프로그래밍·의사소통·프로젝트관리·리더십까지 여섯 영역이 요구됩니다. 프로젝트를 <b>기획할 때</b>는 가용한 데이터가 있는가·참고할 활용 사례가 있는가·수행을 가로막는 장애요소는 없는가 세 가지를 먼저 점검하고, 다룰 <b>데이터 유형</b>은 정형·반정형·비정형 셋으로 나뉩니다. 정형·비정형 데이터를 실제로 만지는 장면은 32장과 41장(텍스트 마이닝)에서, 도메인 지식이 분석 결과를 어떻게 좌우하는지는 이 트랙 전체가 사례로 보여 줍니다.'); }
  },

  // ══════════ 4. 방법론의 뼈대 (체계도, 3화면) ══════════
  { id:'bda51_04',
    enter:function(E){ this.s={view:0}; E.setOn([]); },
    tap:function(E){ this.s.view=(this.s.view+1)%3; },
    draw:function(E){ var s=this.s, v=s.view, cfg;
      if(v===0){
        var cols0=[
          { t:'방법론의 네 조각', c:ROSE, items:[
            {t:'절차(Procedure)', s:'단계별로 무엇을 할지 정한 흐름'},
            {t:'방법(Method)', s:'각 단계에서 쓰는 세부 기법'},
            {t:'도구와 기법', s:'실제로 손에 쥐는 소프트웨어·통계기법'},
            {t:'템플릿과 산출물', s:'결과를 남기는 정해진 양식'}
          ]},
          { t:'계층적 프로세스 모델 3계층', c:BLU, items:[
            {t:'단계(Phase)', s:'최상위 흐름 — WBS의 대분류에 대응'},
            {t:'태스크(Task)', s:'단계 안의 하위 작업 — WBS의 중분류'},
            {t:'스텝(Step)', s:'입력-처리-출력의 실행 단위 — WBS의 소분류'}
          ]},
          { t:'CRISP-DM 4계층 모델', c:GLD, items:[
            {t:'단계(Phase)', s:'업무이해~전개의 최상위 6단계'},
            {t:'일반 과제', s:'각 단계에서 반드시 거치는 공통 작업'},
            {t:'세부 과제', s:'특정 상황에만 필요한 구체적 작업'},
            {t:'프로세스 실행', s:'실제 프로젝트에서 기록으로 남은 결과'}
          ]}
        ];
        var total0=cols0.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'방법론이란 무엇으로 이루어지는가', sub:'화면 1/3 · 방법론 구성요소·계층 모델', cols:cols0, focus:-1, foot:'3열 · 항목 '+total0+'개 · 탭 = 다음 화면' };
      } else if(v===1){
        var cols1=[
          { t:'이해에서 준비까지', c:ROSE, items:[
            {t:'① 비즈니스 도메인 이해', s:'무엇을 왜 푸는지 먼저 아는 단계'},
            {t:'② 데이터셋 선택', s:'분석에 쓸 원본 데이터를 고르는 단계'},
            {t:'③ 노이즈·이상값 제거', s:'지저분한 값을 걸러내는 전처리 단계'},
            {t:'④ 변수 선정·차원축소', s:'꼭 필요한 변수만 추리는 변환 단계'}
          ]},
          { t:'기법 선택에서 활용까지', c:BLU, items:[
            {t:'⑤ 마이닝 기법 선택', s:'분류·군집·연관 중 무엇을 쓸지 정함'},
            {t:'⑥ 마이닝 알고리즘 선택', s:'그 기법 안의 구체적 알고리즘을 고름'},
            {t:'⑦ 마이닝 시행', s:'실제로 알고리즘을 돌리는 단계'},
            {t:'⑧ 결과 해석', s:'나온 결과가 무엇을 뜻하는지 읽는 단계'},
            {t:'⑨ 발견된 지식 활용', s:'실제 업무에 적용하는 단계'}
          ]}
        ];
        var total1=cols1.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'KDD의 원래 9단계', sub:'화면 2/3 · 36장에서 실제로 돌려본 5단계(선택·전처리·변환·마이닝·해석)는 이 9단계 중 일부입니다', cols:cols1, focus:-1, foot:'2열 · 단계 '+total1+'개(배열 길이 실제 집계) · 탭 = 다음 화면' };
      } else {
        var cols2=[
          { t:'1단계 분석기획', c:ROSE, items:[
            {t:'비즈니스 이해·범위 설정', s:'무엇을 풀지 경계를 정함'},
            {t:'프로젝트 정의·계획', s:'일정·자원을 계획으로 구체화'},
            {t:'프로젝트 위험 계획', s:'무엇이 틀어질 수 있는지 미리 대비'}
          ]},
          { t:'2단계 데이터준비', c:BLU, items:[
            {t:'필요 데이터 정의', s:'분석에 어떤 데이터가 필요한지 정함'},
            {t:'데이터 스토어 설계', s:'그 데이터를 어디에 어떻게 쌓을지'},
            {t:'수집·정합성 점검', s:'실제로 모으고 값이 맞는지 확인'}
          ]},
          { t:'3단계 데이터분석', c:GLD, items:[
            {t:'분석용 데이터 준비', s:'모델에 넣을 형태로 다듬는 작업'},
            {t:'텍스트 분석', s:'비정형 글 데이터를 분석'},
            {t:'탐색적 데이터 분석', s:'본격 모델링 전에 구조를 눈으로 확인'},
            {t:'모델링', s:'실제 알고리즘을 데이터에 적용'},
            {t:'모델 평가·검증', s:'만든 모델이 쓸 만한지 실측으로 확인'}
          ]},
          { t:'4단계 시스템구현', c:GRN, items:[
            {t:'설계·구현', s:'평가를 통과한 모델을 시스템으로 만듦'},
            {t:'시스템 테스트·운영', s:'실제 서비스 환경에서 검증하며 가동'}
          ]},
          { t:'5단계 평가및전개', c:PUR, items:[
            {t:'모델 발전계획', s:'앞으로 어떻게 개선해 나갈지 계획'},
            {t:'프로젝트 평가·보고', s:'성과를 정리해 이해관계자에게 보고'}
          ]}
        ];
        var total2=cols2.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'빅데이터 분석 방법론 5단계와 세부 태스크', sub:'화면 3/3 · 태스크를 실제로 5단계 아래 배치하면', cols:cols2, focus:-1, foot:'5단계 · 태스크 '+total2+'개(배열 길이 실제 집계) · 탭 = 처음으로' };
      }
      window.BdaMap(E, cfg);
      E.tapHint(0,0,'▶ 탭으로 화면 전환(구성요소 → KDD 9단계 → 5단계 태스크)', false);
      E.big('방법론의 뼈대', '방법론은 절차·방법·도구와 기법·템플릿과 산출물 네 조각으로 이루어지고, 이를 담는 그릇이 계층적 프로세스 모델(단계→태스크→스텝, 작업분해구조에 대응)입니다. CRISP-DM은 이 발상을 단계·일반 과제·세부 과제·프로세스 실행의 4계층으로 구체화했는데, 36장에서 실제로 모델링↔평가 피드백을 시뮬레이션한 그 CRISP-DM입니다. 데이터 마이닝 절차의 원형인 <b>KDD</b>는 원래 9단계이며, 36장에서 실제로 계산까지 해 본 선택·전처리·변환·마이닝·해석 5단계는 그중 수치가 오가는 부분만 추린 것입니다. 이를 빅데이터 환경에 맞게 다시 쓴 <b>분석 방법론 5단계</b>는 15개 안팎의 세부 태스크로 구성되는데, 화면 3/3에서 그 15개 태스크가 실제로 어느 단계에 속하는지 배치를 직접 봅니다.'); }
  },

  // ══════════ 5. 거버넌스와 데이터 관리 체계 총정리 (체계도, 4화면) ══════════
  { id:'bda51_05',
    enter:function(E){ this.s={view:0}; E.setOn([]); },
    tap:function(E){ this.s.view=(this.s.view+1)%4; },
    draw:function(E){ var s=this.s, v=s.view, cfg;
      if(v===0){
        var cols0=[
          { t:'분석과제 정의서의 다섯 조각', c:ROSE, items:[
            {t:'비즈니스 문제', s:'무엇을 왜 풀어야 하는지'},
            {t:'데이터', s:'어떤 데이터를 쓸 것인지'},
            {t:'분석 기법과 방법', s:'어떤 방식으로 풀 것인지'},
            {t:'예상 결과', s:'무엇이 나올 것으로 보는지'},
            {t:'기대 효과', s:'그 결과로 무엇을 얻는지'}
          ]},
          { t:'산출물로 남기는 것', c:BLU, items:[
            {t:'활용사례(유즈케이스) 정의', s:'문제를 실행 가능한 사례로 구체화'},
            {t:'외부 참조모델 벤치마킹', s:'유사 산업의 앞선 사례에서 실마리를 찾음'}
          ]},
          { t:'계획의 연결고리', c:GLD, items:[
            {t:'정보전략계획(ISP)', s:'조직 전체 정보화 방향을 정하는 상위 계획'},
            {t:'분석 마스터플랜', s:'ISP를 분석에 특화해 구체화, 다시 과제 정의서로 이어짐'}
          ]}
        ];
        var total0=cols0.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'산출물과 계획의 연결', sub:'화면 1/4', cols:cols0, focus:-1, foot:'3열 · 항목 '+total0+'개 · 탭 = 다음' };
      } else if(v===1){
        var cols1=[
          { t:'데이터 거버넌스 3대 구성요소', c:ROSE, items:[
            {t:'원칙(Principle)', s:'데이터를 다루는 규칙과 기준'},
            {t:'조직(Organization)', s:'그 규칙을 지킬 책임과 역할'},
            {t:'프로세스(Process)', s:'규칙이 실제로 돌아가게 하는 절차'}
          ]},
          { t:'성숙도의 뿌리', c:BLU, items:[
            {t:'능력성숙도통합모델', s:'조직 역량이 단계적으로 자란다고 보는 일반 모델'},
            {t:'분석 성숙도 모델', s:'이를 도입→활용→확산→최적화 4단계로 재구성'}
          ]},
          { t:'분석 지원 인프라 방안', c:GLD, items:[
            {t:'개별 시스템 방식', s:'과제마다 따로 시스템을 둠, 빠르지만 중복'},
            {t:'플랫폼 구조', s:'여러 과제가 공통 기반을 함께 씀'},
            {t:'플랫폼 구성요소', s:'데이터저장·분석엔진·모델관리·서비스제공'}
          ]}
        ];
        var total1=cols1.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'거버넌스의 뼈대', sub:'화면 2/4 · 37장에서 준비도·성숙도를 실제로 계산했던 그 성숙도의 이론적 뿌리입니다', cols:cols1, focus:-1, foot:'3열 · 항목 '+total1+'개 · 탭 = 다음' };
      } else if(v===2){
        var cols2=[
          { t:'데이터 저장소 관리', c:ROSE, items:[
            {t:'전사 데이터 저장소', s:'흩어진 데이터를 한 곳에 모아 두는 곳'},
            {t:'메타데이터 관리', s:'데이터에 대한 데이터(정의·출처·형식)'},
            {t:'표준 데이터 관리', s:'같은 뜻의 데이터가 여러 이름으로 흩어지지 않게'}
          ]},
          { t:'표준화 활동', c:BLU, items:[
            {t:'표준 용어사전', s:'같은 말을 같은 뜻으로 쓰게 만드는 사전'},
            {t:'명명 규칙', s:'데이터 이름을 짓는 일관된 규칙'},
            {t:'준수 여부 모니터링', s:'정한 표준이 실제로 지켜지는지 확인'},
            {t:'주기적 교육', s:'표준을 새로 들어온 사람에게도 계속 전달'}
          ]},
          { t:'데이터 생명주기 관리', c:GLD, items:[
            {t:'생성', s:'데이터가 처음 만들어지는 시점'},
            {t:'활용', s:'분석·서비스에 실제로 쓰이는 시점'},
            {t:'보관', s:'당장 안 쓰지만 보관 기간 동안 남겨두는 시점'},
            {t:'폐기', s:'보관 기간이 끝나 지우는 시점'}
          ]},
          { t:'전담 조직으로 가는 흐름', c:GRN, items:[
            {t:'전담조직 신설', s:'분석 인력을 한 조직으로 모으는 흐름'},
            {t:'컨트롤타워 신설', s:'전사 데이터 의사결정을 한 곳에서 지휘'}
          ]}
        ];
        var total2=cols2.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'데이터를 다루는 살림살이', sub:'화면 3/4', cols:cols2, focus:-1, foot:'4열 · 항목 '+total2+'개 · 탭 = 다음' };
      } else {
        var cols3=[
          { t:'일반 IT 5영역', c:ROSE, items:[
            {t:'범위', s:'무엇을 할지 그 경계를 정하는 일'},
            {t:'시간', s:'언제까지 끝낼지 일정을 짜는 일'},
            {t:'원가', s:'얼마나 쓸지 예산을 잡는 일'},
            {t:'품질', s:'결과가 얼마나 정확해야 하는지 기준'},
            {t:'통합', s:'여러 산출물을 하나로 맞추는 일'}
          ]},
          { t:'데이터 특화 확장 5영역', c:BLU, items:[
            {t:'이해관계자', s:'누가 이 결과에 영향받는지 파악'},
            {t:'자원', s:'사람·장비를 언제 얼마나 투입할지'},
            {t:'리스크', s:'무엇이 잘못될 수 있는지 미리 대비'},
            {t:'조달', s:'외부에서 사올 것을 정하는 일'},
            {t:'의사소통', s:'진행 상황을 누구에게 어떻게 알릴지'}
          ]},
          { t:'교육으로 내재화하는 3단계', c:GLD, items:[
            {t:'준비기', s:'경영진 인식 교육으로 필요성부터 알림'},
            {t:'도입기', s:'관리자 실무 교육으로 손에 익힘'},
            {t:'안정추진기', s:'전문가 심화 교육으로 내재화를 굳힘'}
          ]}
        ];
        var total3=cols3.reduce(function(a,c){ return a+c.items.length; },0);
        cfg={ title:'사람과 관리의 남은 조각', sub:'화면 4/4 · 37장은 이 중 5영역만 다뤘습니다(통합·범위·시간·원가·품질)', cols:cols3, focus:-1, foot:'3열 · 항목 '+total3+'개 · 탭 = 처음으로' };
      }
      window.BdaMap(E, cfg);
      E.tapHint(0,0,'▶ 탭으로 화면 전환(산출물 → 거버넌스 → 데이터관리 → 사람/관리)', false);
      E.big('거버넌스와 데이터 관리 체계 총정리', '과제 하나의 성공을 넘어 조직 전체가 분석을 계속 잘 해내려면 거버넌스가 필요합니다. <b>데이터 거버넌스</b>는 원칙·조직·프로세스 3요소로 이루어지고, 그 성숙도를 재는 <b>분석 성숙도 모델</b>은 원래 조직 역량 전반을 재던 능력성숙도통합모델을 가져온 것입니다 — 37장에서 실제로 계산했던 준비도·성숙도 점수의 이론적 뿌리가 이것입니다. 그 아래에는 데이터 저장소·표준화·생명주기 관리라는 살림살이가 있고, 프로젝트 관리는 범위·시간·원가·품질·통합(37장이 다룬 5영역)에 이해관계자·자원·리스크·조달·의사소통 5영역이 더해져 <b>10대 주제그룹</b>을 이룹니다. 세부 이행 일정(추진과제 기간을 쌓아 총 소요기간을 계산하는 간트 형태)은 37장의 로드맵(Stage1~3)이 큰 틀을 이미 보여 주었으므로, 이 장에서는 그 로드맵을 뒷받침하는 거버넌스·데이터 관리 체계 쪽을 채웁니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
