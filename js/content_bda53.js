/* 빅데이터 분석 제53장 — 과목별 총정리: 과목 V(데이터 시각화)
   동작(behavior)만. 텍스트=content/bda53.json. 엔진 js/engine.js + js/bda_map.js 공유. 색: BDA=로즈 마젠타 테마.
   ADP 필기 과목 V 커버리지가 가장 낮아(29%) 명명된 이론·인물·원칙·차트 유형을 채우는 총정리 장이다.
   38·39장(탐색-분석-활용 3단계, 5분류, 전주의적 속성, 판독 정확도, 과밀)과 중복 설명하지 않는다.
   골든룰: 화면의 모든 수(면적·왜곡 배율·인구대비 순위·정규화 점수·색상 간격·잉크 비율·상관계수)는
   아래 고정 데이터로부터 실제 계산한다(하드코딩 금지). Math.random()/Date.now() 절대 금지.
   체계도(BdaMap) 3장면 + 동작 2장면 구성. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';

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

  // ══════════ 53.1 DIKW 4분 구분 (체계도) ══════════
  var DIKW_COLS = [
    { t:'데이터 → 데이터 시각화', c:BLU, items:[
      {t:'데이터(data)', s:'분리된 요소 — 숫자·기호·도표, 아직 맥락 없음'},
      {t:'대응 활동: 시각화', s:'가장 기본 단계, 그림으로 바꾸는 일 자체'},
      {t:'핵심 동사', s:'종류를 나누다·계산하다·대조하다·모으다'},
      {t:'예', s:'표, 기본 막대·선그래프(38장에서 실제로 그림)'}
    ]},
    { t:'정보 → 정보 시각화', c:GRN, items:[
      {t:'정보(information)', s:'요소끼리 연관된 것 — 의견·단락·개념'},
      {t:'대응 활동: 디자인', s:'요소 사이 관계·패턴을 짜 넣는 단계'},
      {t:'핵심 동사', s:'맥락을 놓다·비교하다·거르다·우선순위 매기다'},
      {t:'예', s:'39장의 시간·분포·관계·비교·공간 5분류'}
    ]},
    { t:'지식 → 정보 디자인', c:GLD, items:[
      {t:'지식(knowledge)', s:'정보가 경험으로 자기조직화된 것'},
      {t:'대응 활동: 매핑', s:'구조를 해석·재구성해 새로 배치하는 단계'},
      {t:'핵심 동사', s:'구조화하다·해석하다·따져보다·해체하다'},
      {t:'예', s:'이 장의 체계도, 방법론·절차 비교'}
    ]},
    { t:'지혜 → 인포그래픽', c:ROSE, items:[
      {t:'지혜(wisdom)', s:'내면화된 지식 — 말로 옮기기 어려움'},
      {t:'설득형 메시지', s:'원자료보다 주장·스토리 전달이 목적'},
      {t:'핵심 동사', s:'엮다·구체화하다·식별하다·종합하다'},
      {t:'예', s:'지하철 노선도 — 왜곡해서라도 이해를 돕는 그림'}
    ]}
  ];
  var DIKW_TOTAL=0; DIKW_COLS.forEach(function(c){ DIKW_TOTAL+=c.items.length; });

  // ══════════ 53.2 방법론·절차·도구 (체계도, 3스텝) ══════════
  var METH_COLS = [
    {t:'정보디자인 4단계', c:BLU, items:[
      {t:'조직화된 데이터', s:'수집·정제를 마친 원자료'},
      {t:'시각적 매핑', s:'값을 위치·크기 등 속성에 대응시킴'},
      {t:'시각적 형태', s:'차트·그래프의 구체적 모양을 정함'},
      {t:'전달 방식', s:'어떤 매체·형식으로 내보낼지'}
    ]},
    {t:'샤피로 3단계', c:GRN, items:[
      {t:'질문 만들기', s:'무엇이 알고 싶은지 먼저 정함'},
      {t:'데이터 수집하기', s:'그 질문에 맞는 데이터를 모음'},
      {t:'시각적 표현 적용', s:'모은 데이터를 그림으로 바꿈'},
      {t:'특징', s:'일반 시각화용 — 빅데이터엔 옆 열이 더 알맞음'}
    ]},
    {t:'벤 프라이 7단계 ★', c:GLD, items:[
      {t:'① 획득', s:'파일·네트워크에서 정보를 모음'},
      {t:'② 분해', s:'의미별로 구조화·범주화'},
      {t:'③ 선별', s:'의미 없는 정보를 걷어냄'},
      {t:'④ 마이닝', s:'통계·알고리즘으로 패턴을 뽑아냄'},
      {t:'⑤ 표현', s:'뽑아낸 정보를 그림 형태로'},
      {t:'⑥ 정제', s:'그래픽 디자인으로 다듬음'},
      {t:'⑦ 상호작용', s:'수용자가 여러 각도로 살펴보게 함'}
    ]}
  ];
  var PROC_COLS = [
    {t:'정보 구조화 4단계', c:BLU, items:[
      {t:'수집 및 탐색', s:'데이터를 모으고 전체를 훑어봄'},
      {t:'분류하기', s:'같은 성격끼리 나눔'},
      {t:'배열하기', s:'나눈 것을 순서·위계로 놓음'},
      {t:'재배열하기', s:'다른 기준으로 다시 놓아 새 패턴을 찾음'}
    ]},
    {t:'인포그래픽 10단계 (1~5)', c:GRN, items:[
      {t:'1 데이터 수집', s:'흩어진 리소스에서 단서를 모음'},
      {t:'2 모두 읽기', s:'중요 부분만 보지 않고 전체를 훑음'},
      {t:'3 내러티브 찾기', s:'데이터에서 이야기를 끌어냄'},
      {t:'4 문제 정의', s:'끌어낸 이야기가 현실적인지 검토'},
      {t:'5 계층구조 만들기', s:'주인공과 보조 요소를 가름'}
    ]},
    {t:'인포그래픽 10단계 (6~10)', c:GLD, items:[
      {t:'6 와이어프레임', s:'정보 계층을 뼈대로 배치'},
      {t:'7 포맷 선택', s:'차트·다이어그램·숫자 나열 중 결정'},
      {t:'8 시각 접근법 결정', s:'데이터 미학형 vs 일러스트·메타포형'},
      {t:'9 정제와 테스트', s:'낯선 사람에게도 이해되는지 확인'},
      {t:'10 세상에 선보이기', s:'공개 뒤에도 해석은 계속 열려 있음'}
    ]}
  ];
  var TOOL_COLS = [
    {t:'도구를 고르는 기준', c:BLU, items:[
      {t:'정적 이미지', s:'인쇄·보고서용, 한 장으로 완결'},
      {t:'대화형 웹', s:'독자가 직접 탐색·필터링'},
      {t:'대시보드', s:'실시간 지표를 계속 갱신해 감시'},
      {t:'지도 특화', s:'좌표·행정구역 데이터 전용'}
    ]},
    {t:'상호작용 원칙(얕음 보강)', c:GRN, items:[
      {t:'① 개요 먼저', s:'전체 모양부터 한눈에 보여줌'},
      {t:'② 확대·필터', s:'관심 범위만 좁혀서 보게 함'},
      {t:'③ 세부는 요청 시', s:'필요할 때만 낱개 값을 보여줌'}
    ]}
  ];
  var METH_TOTAL=0; METH_COLS.forEach(function(c){ METH_TOTAL+=c.items.length; });
  var PROC_TOTAL=0; PROC_COLS.forEach(function(c){ PROC_TOTAL+=c.items.length; });
  var TOOL_TOTAL=0; TOOL_COLS.forEach(function(c){ TOOL_TOTAL+=c.items.length; });

  // ══════════ 53.3 그래픽 요소·지각 원리·디자인 원칙 (체계도, 4스텝) ══════════
  var BERTIN_COLS = [
    {t:'그래픽 요소(베르탱) 7가지 ★', c:BLU, items:[
      {t:'위치', s:'같은 요소도 Y좌표를 바꾸면 강조됨 — 수치로도 표현 가능'},
      {t:'크기', s:'클수록 시선을 끔 — 수치·순서 모두 표현 가능'},
      {t:'모양', s:'윤곽으로 구분 — 색·크기보다 지각이 더 어려움'},
      {t:'색', s:'구분엔 강하지만 수치·순서 표현엔 부적합'},
      {t:'명도', s:'밝기 차이 — 색상보다 판독이 더 정확함'},
      {t:'기울기', s:'방향을 틀어 반복에서 벗어나게 함'},
      {t:'질감', s:'같은 색·형태라도 표면 패턴으로 구분 — 과용 주의'}
    ]}
  ];
  var PERCEP_COLS = [
    {t:'게슈탈트 — 지각의 원리', c:GRN, items:[
      {t:'게슈탈트(gestalt)', s:'뇌가 색·형태 조각을 하나의 집합으로 보는 것'},
      {t:'구분이 먼저', s:'비슷한 것과 다른 것부터 가른 뒤에야 자세히 봄'},
      {t:'그래픽 요소의 근거', s:'앞 화면의 7가지 요소가 이 원리 위에 서 있음'},
      {t:'실제 사례', s:'같은 것 속 다른 하나는 저절로 튀어 보임(39장 전주의적 속성)'}
    ]},
    {t:'단기기억의 한계 ★', c:GLD, items:[
      {t:'밀러의 매직넘버(1956)', s:'단기 기억이 다루는 정보는 5~9개(7±2)'},
      {t:'구분 가능한 색상', s:'사람이 뚜렷이 가르는 색은 대략 8가지'},
      {t:'다음 장면에서 실측', s:'색을 늘려가며 몇 번째부터 헷갈리는지 직접 셉니다'}
    ]}
  ];
  var STYLE_COLS = [
    {t:'색채 원리', c:BLU, items:[
      {t:'색상·명도·채도', s:'세 속성으로 카테고리·중요도·위계를 표현'},
      {t:'보색', s:'두 색만 쓸 땐 보색 + 같은 명도·채도가 안전'},
      {t:'인쇄 vs 스크린', s:'인쇄는 감산혼합, 화면은 가산혼합 — 보색이 다름'},
      {t:'팔레트를 먼저', s:'즉흥적으로 고르지 말고 팔레트를 정해 그 안에서만'}
    ]},
    {t:'타이포그래피 원리', c:GRN, items:[
      {t:'서체 수', s:'많아야 두 가지(한글·영문 각 1) — 셋 이상은 산만'},
      {t:'무게(굵기)', s:'굵을수록 무거워 보여 위계를 표현'},
      {t:'크기', s:'값이 아니라 정보의 중요도·위계를 나타냄'},
      {t:'세리프 vs 산세리프', s:'세리프=가독성(본문), 산세리프=주목성(제목)'}
    ]}
  ];
  var PRINCIPLE_COLS = [
    {t:'터프티의 시각정보 디자인 7원칙 ★', c:ROSE, items:[
      {t:'① 시각적 비교 강화', s:'비교할 도구를 줘야 정보 가치가 오름'},
      {t:'② 인과관계 제시', s:'원인과 결과를 명쾌하게 보여줌'},
      {t:'③ 다중변수 표시', s:'연관된 여러 변수를 함께 표현'},
      {t:'④ 텍스트·그래픽·데이터 통합', s:'라벨·범례가 도표에 녹아 있어야 함'},
      {t:'⑤ 콘텐츠의 질·진실성', s:'사용자 목적에 실제로 도움이 되는가'},
      {t:'⑥ 공간순 나열', s:'시간 순서보다 공간 배치가 이해가 쉬움'},
      {t:'⑦ 정량성을 지켜라', s:'그래프로 바꿔도 정량 정보를 잃지 마라(다음 장 데이터-잉크 비율과 같은 정신)'}
    ]}
  ];
  var BERTIN_TOTAL=BERTIN_COLS[0].items.length;
  var PERCEP_TOTAL=0; PERCEP_COLS.forEach(function(c){ PERCEP_TOTAL+=c.items.length; });
  var STYLE_TOTAL=0; STYLE_COLS.forEach(function(c){ STYLE_TOTAL+=c.items.length; });
  var PRINCIPLE_TOTAL=PRINCIPLE_COLS[0].items.length;

  // ══════════ 53.4 데이터: 면적·색 인코딩(트리맵·버블·단계구분도·카토그램·히트맵·데이터잉크) ══════════
  var TREE_CATS = [
    {n:'가전', col:BLU, subs:[{n:'냉장고',v:38},{n:'세탁기',v:26},{n:'TV',v:16}]},
    {n:'의류', col:GRN, subs:[{n:'아우터',v:22},{n:'이너웨어',v:14}]},
    {n:'식품', col:GLD, subs:[{n:'신선식품',v:30},{n:'가공식품',v:18}]}
  ];
  var TREE_TOTAL=0;
  TREE_CATS.forEach(function(c){ c.v=0; c.subs.forEach(function(s){ c.v+=s.v; }); TREE_TOTAL+=c.v; });

  var BUB=[{n:'B매장',v:10},{n:'A매장',v:40}];
  var BUB_RATIO=BUB[1].v/BUB[0].v;
  var BUB_RK=1.2;
  var BUB_R_LIN=BUB.map(function(b){ return b.v*BUB_RK; });
  var BUB_AREA_LIN=BUB_R_LIN.map(function(r){ return Math.PI*r*r; });
  var BUB_AREA_RATIO_LIN=BUB_AREA_LIN[1]/BUB_AREA_LIN[0];
  var BUB_DISTORT=BUB_AREA_RATIO_LIN/BUB_RATIO;
  var BUB_AK=40;
  var BUB_AREA_COR=BUB.map(function(b){ return b.v*BUB_AK; });
  var BUB_R_COR=BUB_AREA_COR.map(function(a){ return Math.sqrt(a/Math.PI); });
  var BUB_AREA_RATIO_COR=BUB_AREA_COR[1]/BUB_AREA_COR[0];

  var REGION5=[
    {n:'서울', pop:940, val:120, area0:120},
    {n:'부산', pop:340, val:45, area0:80},
    {n:'대구', pop:240, val:38, area0:65},
    {n:'광주', pop:150, val:52, area0:55},
    {n:'대전', pop:150, val:22, area0:55}
  ];
  REGION5.forEach(function(r){ r.per=r.val/r.pop; });
  var BY_VAL=REGION5.slice().sort(function(a,b){ return b.val-a.val; });
  var BY_PER=REGION5.slice().sort(function(a,b){ return b.per-a.per; });
  REGION5.forEach(function(r){ r.rankVal=BY_VAL.indexOf(r)+1; r.rankPer=BY_PER.indexOf(r)+1; r.rankDiff=r.rankVal-r.rankPer; });

  var STORES_HM=[
    {n:'C매장', sales:62, cust:340, ret:0.18, revisit:0.41},
    {n:'F매장', sales:88, cust:410, ret:0.09, revisit:0.62},
    {n:'A매장', sales:45, cust:290, ret:0.22, revisit:0.33},
    {n:'E매장', sales:77, cust:380, ret:0.12, revisit:0.55},
    {n:'B매장', sales:52, cust:310, ret:0.20, revisit:0.37},
    {n:'D매장', sales:83, cust:395, ret:0.10, revisit:0.58}
  ];
  var HM_METRICS=['sales','cust','ret','revisit'];
  var HM_LABEL={sales:'매출',cust:'고객수',ret:'반품률',revisit:'재구매율'};
  var HM_INVERT={sales:false,cust:false,ret:true,revisit:false};
  HM_METRICS.forEach(function(m){
    var vals=STORES_HM.map(function(s){ return s[m]; });
    var mn=Math.min.apply(null,vals), mx=Math.max.apply(null,vals);
    STORES_HM.forEach(function(s){
      var t=(mx>mn)?(s[m]-mn)/(mx-mn):0.5;
      s['n_'+m]= HM_INVERT[m] ? (1-t) : t;
    });
  });
  STORES_HM.forEach(function(s){ s.score=(s.n_sales+s.n_cust+s.n_ret+s.n_revisit)/4; });
  var HM_SORTED=STORES_HM.slice().sort(function(a,b){ return b.score-a.score; });

  var BARS_INK=[34,41,29,47];
  var INK_MAXV=Math.max.apply(null,BARS_INK);
  var INK_CW=300, INK_CH=140, INK_BARW=50, INK_GAP=25;
  var INK_HEIGHTS=BARS_INK.map(function(v){ return v/INK_MAXV*INK_CH; });
  var INK_DATA_AREA=0; INK_HEIGHTS.forEach(function(h){ INK_DATA_AREA+=INK_BARW*h; });
  var INK_GRID_N=4, INK_GRID_AREA=INK_GRID_N*INK_CW*1;
  var INK_BORDER_AREA=2*(INK_CW+INK_CH)*1.5;
  var INK_SHADOW_AREA=INK_DATA_AREA;
  var INK_DEPTH_AREA=0; INK_HEIGHTS.forEach(function(h){ INK_DEPTH_AREA+=8*h; });
  var INK_NONDATA_A=INK_GRID_AREA+INK_BORDER_AREA+INK_SHADOW_AREA+INK_DEPTH_AREA;
  var INK_RATIO_A=INK_DATA_AREA/(INK_DATA_AREA+INK_NONDATA_A);
  var INK_BASELINE_AREA=INK_CW*1;
  var INK_RATIO_B=INK_DATA_AREA/(INK_DATA_AREA+INK_BASELINE_AREA);

  // ══════════ 53.5 데이터: 다변량(체르노프·스타·평행좌표) + 색상 8종 한계 ══════════
  var STORE6=[
    {n:'A', growth:4, sat:62, ret:15, revisit:38},
    {n:'B', growth:9, sat:71, ret:11, revisit:47},
    {n:'C', growth:2, sat:55, ret:19, revisit:31},
    {n:'D', growth:13, sat:82, ret:7, revisit:61},
    {n:'E', growth:7, sat:68, ret:13, revisit:44},
    {n:'F', growth:16, sat:88, ret:5, revisit:68}
  ];
  var S6_METRICS=['growth','sat','ret','revisit'];
  var S6_LABEL={growth:'성장률%',sat:'만족도',ret:'반품률↓',revisit:'재구매율%'};
  var S6_INVERT={growth:false,sat:false,ret:true,revisit:false};
  S6_METRICS.forEach(function(m){
    var vals=STORE6.map(function(s){ return s[m]; });
    var mn=Math.min.apply(null,vals), mx=Math.max.apply(null,vals);
    STORE6.forEach(function(s){
      var t=(mx>mn)?(s[m]-mn)/(mx-mn):0.5;
      s['n_'+m]= S6_INVERT[m]?(1-t):t;
    });
  });
  var S6_COLORS=[ROSE,BLU,GLD,GRN,PUR,ORG];
  function corr(xs,ys){
    var n=xs.length, mx=0,my=0,i;
    for(i=0;i<n;i++){ mx+=xs[i]; my+=ys[i]; } mx/=n; my/=n;
    var num=0,dx=0,dy=0;
    for(i=0;i<n;i++){ num+=(xs[i]-mx)*(ys[i]-my); dx+=(xs[i]-mx)*(xs[i]-mx); dy+=(ys[i]-my)*(ys[i]-my); }
    return num/Math.sqrt(dx*dy);
  }
  var CORR_GROWTH_REVISIT = corr(STORE6.map(function(s){return s.growth;}), STORE6.map(function(s){return s.revisit;}));

  var COLOR_NS=[6,8,10,14];
  var COLOR_THRESH=45;
  var COLOR_INFO=COLOR_NS.map(function(N){ var gap=360/N; return {N:N, gap:gap, risky: gap<COLOR_THRESH}; });

  var scenes = [

  // ══════════ 1. 시각 이해의 위계 — DIKW 4분 구분 ══════════
  { id:'bda53_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, focus=(s.step===0)?-1:s.step-1;
      window.BdaMap(E, {
        title:'시각 이해의 위계 — 데이터에서 인포그래픽까지',
        sub:'탭으로 데이터→정보→지식→지혜 순서를 하나씩 짚어봅니다',
        cols: DIKW_COLS,
        focus: focus,
        foot: '데이터→정보→지식→지혜로 갈수록 조직성과 의미가 함께 늘어납니다(총 '+DIKW_TOTAL+'개 대응 확인)'
      });
      E.tapHint(0,0,'▶ 탭으로 한 계층씩', false);
      E.big('시각 이해의 위계 — 데이터에서 인포그래픽까지',
        '맥캔들레스가 정리한 「데이터 위계 모델」은 이해의 단계를 데이터·정보·지식·지혜 넷으로 나누고, 각 단계에 대응하는 시각화 활동을 <b>시각화(Visualization)·디자인(Design)·매핑(Mapping)·정의되지 않음</b>으로 짝짓습니다. 우리 트랙에서는 이 네 층을 <b>데이터 시각화·정보 시각화·정보 디자인·인포그래픽</b>이라는 이름으로 씁니다. 조직화된 데이터(38장에서 실제로 그린 표·막대그래프)에서 출발해, 39장의 5분류(시간·분포·관계·비교·공간)로 관계를 짜 넣으면 정보 시각화가 되고, 이 장의 체계도처럼 구조를 재배치하면 정보 디자인이 됩니다. 마지막 인포그래픽은 <b>원데이터를 거의 다루지 않고</b> 설득형 메시지(주장을 시각적으로 강렬하게 전달)에 초점을 둡니다 — 반대로 데이터·정보 시각화는 객관적 전달에 초점을 둔 정보형 메시지에 가깝습니다. 빅데이터 시각화는 원자료를 다루는 일이 많아 정보형 메시지(데이터·정보 시각화) 쪽에 무게가 실립니다.'); }
  },

  // ══════════ 2. 방법론과 절차 — 무엇을, 어떻게 만드나 ══════════
  { id:'bda53_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s;
      if(s.step===0){
        window.BdaMap(E, {
          title:'빅데이터 시각화 방법론 3종 비교 ★',
          sub:'같은 목표(데이터를 그림으로)를 몇 단계로 쪼개는가가 다릅니다',
          cols: METH_COLS,
          focus: -1,
          foot: '벤 프라이 7단계일수록 데이터 수집·분석을 더 잘게 나눕니다 — 빅데이터일수록 세분화가 필요합니다(총 '+METH_TOTAL+'개 단계)'
        });
      } else if(s.step===1){
        window.BdaMap(E, {
          title:'실행 절차 — 정보 구조화와 인포그래픽 10단계',
          sub:'정보 구조화의 마지막(재배열)이 인포그래픽 5단계(계층구조)와 맞닿습니다',
          cols: PROC_COLS,
          focus: -1,
          foot: '정보 구조화 4단계 + 인포그래픽 10단계 = 총 '+PROC_TOTAL+'개 항목'
        });
      } else {
        window.BdaMap(E, {
          title:'구현 — 도구를 고르는 기준과 상호작용 원칙',
          sub:'라이브러리·상용 도구 이름 대신 "어떤 상황에 어떤 성격의 도구가 맞는가"만 정리합니다',
          cols: TOOL_COLS,
          focus: -1,
          foot: '총 '+TOOL_TOTAL+'개 기준 — 39장에서 이미 상호작용(줌·필터)을 실제로 다뤘습니다'
        });
      }
      E.tapHint(0,0,'▶ 탭으로 방법론 → 절차 → 도구', false);
      E.big('빅데이터 시각화, 어떻게 설계할 것인가',
        '같은 목표라도 이론가마다 단계를 다르게 쪼갭니다. <b>정보디자인 4단계</b>(조직화된 데이터→시각적 매핑→시각적 형태→전달 방식)는 교과서적 뼈대이고, <b>샤피로 3단계</b>(질문 만들기→데이터 수집→시각 표현 적용)는 일반적인 시각화에 맞습니다. 빅데이터처럼 다뤄야 할 양이 클수록 <b>벤 프라이의 7단계</b>(획득→분해→선별→마이닝→표현→정제→상호작용)가 더 세밀합니다 — 데이터를 모으고 분석하는 앞 네 단계가 나머지 방법론보다 더 잘게 나뉜 것이 특징입니다. 실행 절차로 내려가면 <b>정보 구조화 4단계</b>(수집및탐색→분류→배열→재배열)가 있고, 설득형 메시지를 만드는 <b>인포그래픽 10단계</b>는 데이터 수집에서 세상에 선보이기까지를 다룹니다. 마지막으로 도구는 이름이 아니라 성격(정적 이미지/대화형 웹/대시보드/지도 특화)으로 고르고, 상호작용은 <b>개요를 먼저 보여준 뒤 확대·필터로 좁히고 세부는 요청이 있을 때만</b> 보여주는 순서를 지켜야 독자가 길을 잃지 않습니다.'); }
  },

  // ══════════ 3. 그래픽 요소·지각 원리·디자인 원칙 총정리 ══════════
  { id:'bda53_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      if(s.step===0){
        window.BdaMap(E, { title:'그래픽 요소(시각 변수) — 자크 베르탱 ★', sub:'뇌가 패턴을 먼저 감지한다는 게슈탈트 이론에 근거해 정리된 7가지', cols: BERTIN_COLS, focus:-1, foot:'총 '+BERTIN_TOTAL+'가지 — 이 가운데 위치·크기만 수치로 정확히 표현할 수 있습니다' });
      } else if(s.step===1){
        window.BdaMap(E, { title:'지각과 기억의 한계', sub:'그래픽 요소가 통하는 이유(게슈탈트)와 한계(단기기억)', cols: PERCEP_COLS, focus:-1, foot:'총 '+PERCEP_TOTAL+'개 — 8종 한계는 다음 장에서 색을 실제로 늘려가며 확인합니다' });
      } else if(s.step===2){
        window.BdaMap(E, { title:'그래픽 디자인 기본 원리 — 색채·타이포그래피', sub:'시각화 결과물의 질을 가장 크게 좌우하는 두 축', cols: STYLE_COLS, focus:-1, foot:'총 '+STYLE_TOTAL+'개 — 애니메이션도 상호작용 기법의 하나로 취급됩니다' });
      } else {
        window.BdaMap(E, { title:'터프티의 시각정보 디자인 7원칙 ★', sub:'정보 구조화·시각화·시각표현을 거친 뒤 마지막으로 점검하는 체크리스트', cols: PRINCIPLE_COLS, focus:-1, foot:'총 '+PRINCIPLE_TOTAL+'개 원칙 — ⑦번이 다음 장의 데이터-잉크 비율과 같은 정신입니다' });
      }
      E.tapHint(0,0,'▶ 탭으로 요소 → 지각 → 색·서체 → 7원칙', false);
      E.big('그래픽 요소·지각 원리·디자인 원칙 총정리',
        '자크 베르탱은 게슈탈트 이론(뇌가 색·형태 조각을 하나의 집합으로 지각한다는 원리)에 근거해 정보 표현의 그래픽 요소 <b>위치·크기·모양·색·명도·기울기·질감</b> 7가지를 정리했습니다. 이 가운데 위치와 크기만 수치로 정확히 표현할 수 있고, 모양·색은 구분에는 강하지만 순서나 양을 나타내기엔 부적합합니다. 이 지각 능력에는 한계가 있는데, 조지 밀러가 1956년 밝힌 <b>단기기억의 매직넘버 7±2</b>와 <b>구분 가능한 색상 약 8종</b>이 그것입니다. 그래픽을 완성하는 마지막 단계는 색채(색상·명도·채도, 보색, 팔레트를 미리 정해두기)와 타이포그래피(서체는 최대 두 가지, 굵기·크기로 위계 표현, 세리프=가독성·산세리프=주목성) 원리입니다. 이 모든 것을 관통하는 체크리스트가 에드워드 터프티의 <b>시각정보 디자인 7원칙</b>입니다 — 비교를 강화하고, 인과관계를 보여주고, 다중변수를 표시하고, 텍스트·그래픽·데이터를 통합하고, 콘텐츠의 진실성을 지키고, 시간이 아닌 공간순으로 나열하고, 정량성을 잃지 말라는 것입니다.'); }
  },

  // ══════════ 4. 값이 그림이 되는 방식을 믿을 수 있는가 ══════════
  { id:'bda53_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;

      if(s.step===0){
        var code0=[
          {t:'w_i = W * (cat.v / total)   # 대분류 폭', hl:'cat.v / total'},
          {t:'h_j = H * (sub.v / cat.v)   # 세부 항목 높이', hl:'sub.v / cat.v'}
        ];
        var codeBot0=codePanel(E, W*0.04, 12, W*0.42, code0, 'treemap_area.py', 1);
        ctx.font='12.5px ui-monospace,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('총합 '+TREE_TOTAL+'억원 — 대분류 '+TREE_CATS.length+'개', W*0.04, codeBot0+20);
        TREE_CATS.forEach(function(c,ci){
          var pct=(c.v/TREE_TOTAL*100).toFixed(1);
          ctx.fillStyle=c.col; ctx.font='11.5px sans-serif';
          ctx.fillText(c.n+' '+c.v+'억원 ('+pct+'%)', W*0.04, codeBot0+44+ci*17);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('바깥 사각형=대분류, 안쪽 사각형=세부 — 면적이 곧 값입니다', W*0.04, codeBot0+44+TREE_CATS.length*17+16);

        var tx0=W*0.49, tx1=W*0.965, ty0=32, ty1=232;
        var tw=tx1-tx0, th=ty1-ty0, cx=tx0;
        TREE_CATS.forEach(function(c){
          var cw=tw*(c.v/TREE_TOTAL), sy=ty0;
          c.subs.forEach(function(sub){
            var sh=th*(sub.v/c.v);
            ctx.fillStyle=c.col; ctx.globalAlpha=0.22+ (sub.v/c.v)*0.30;
            ctx.fillRect(cx, sy, cw, sh);
            ctx.globalAlpha=1;
            ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1; ctx.strokeRect(cx,sy,cw,sh);
            if(cw>44 && sh>22){
              ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='left';
              ctx.fillText(sub.n, cx+4, sy+14);
              ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=DIM;
              ctx.fillText(sub.v+'억', cx+4, sy+28);
            }
            sy+=sh;
          });
          ctx.strokeStyle=c.col; ctx.lineWidth=2; ctx.strokeRect(cx,ty0,cw,th);
          ctx.fillStyle=c.col; ctx.font='600 11.5px sans-serif'; ctx.textAlign='center';
          ctx.fillText(c.n, cx+cw/2, ty0-10);
          cx+=cw;
        });

      } else if(s.step===1){
        var code1=[
          {t:'r_wrong = v * k        # 반지름 ∝ 값(흔한 실수)', hl:'r_wrong'},
          {t:'area = pi * r_wrong**2 # 넓이는 반지름의 제곱', hl:'r_wrong**2'},
          {t:'r_right = sqrt(v*k2/pi)# 넓이 ∝ 값(올바른 식)', hl:'r_right'}
        ];
        var codeBot1=codePanel(E, W*0.04, 12, W*0.42, code1, 'bubble_distortion.py', 1);
        var ry=codeBot1+20;
        ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillStyle=GLD; ctx.fillText('실제 값 비율 = '+BUB[1].v+'/'+BUB[0].v+' = '+BUB_RATIO.toFixed(2)+'배', W*0.04, ry);
        ctx.fillStyle=RED; ctx.fillText('반지름 비례 → 넓이비율 '+BUB_AREA_RATIO_LIN.toFixed(2)+'배 → 왜곡 '+BUB_DISTORT.toFixed(2)+'배 과장', W*0.04, ry+20);
        ctx.fillStyle=GRN; ctx.fillText('넓이 비례 → 넓이비율 '+BUB_AREA_RATIO_COR.toFixed(2)+'배 → 왜곡 없음', W*0.04, ry+40);

        var bx0=W*0.50, bx1=W*0.95, cxs=[bx0+70, bx0+220];
        ctx.textAlign='center';
        ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText('반지름 비례(흔한 오류)', (bx0+bx1)/2, 40);
        BUB.forEach(function(b,i){
          var y=95;
          ctx.beginPath(); ctx.fillStyle=RED; ctx.globalAlpha=0.42; ctx.arc(cxs[i], y, BUB_R_LIN[i], 0, 7); ctx.fill(); ctx.globalAlpha=1;
          ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(cxs[i], y, BUB_R_LIN[i], 0, 7); ctx.stroke();
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText(b.n+' v='+b.v, cxs[i], y+BUB_R_LIN[i]+16);
          ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=DIM; ctx.fillText('r='+BUB_R_LIN[i].toFixed(1), cxs[i], y+BUB_R_LIN[i]+30);
        });
        ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText('넓이 비례(올바른 계산)', (bx0+bx1)/2, 195);
        BUB.forEach(function(b,i){
          var y=245;
          ctx.beginPath(); ctx.fillStyle=GRN; ctx.globalAlpha=0.42; ctx.arc(cxs[i], y, BUB_R_COR[i], 0, 7); ctx.fill(); ctx.globalAlpha=1;
          ctx.strokeStyle=GRN; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(cxs[i], y, BUB_R_COR[i], 0, 7); ctx.stroke();
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText(b.n+' v='+b.v, cxs[i], y+BUB_R_COR[i]+16);
          ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=DIM; ctx.fillText('r='+BUB_R_COR[i].toFixed(1), cxs[i], y+BUB_R_COR[i]+30);
        });

      } else if(s.step===2){
        var code2=[
          {t:'w_choro = W * area0_i/max(area0) # 명목 면적(가정)', hl:'area0_i'},
          {t:'w_carto = W * pop_i / max(pop)   # 카토그램=인구 비례', hl:'pop_i'}
        ];
        var codeBot2=codePanel(E, W*0.04, 12, W*0.42, code2, 'choropleth_vs_cartogram.py', null);
        var ry2=codeBot2+18;
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('인구=만명, 값=매출 억원 — 면적은 모형이 정한 가정', W*0.04, ry2);
        REGION5.forEach(function(r,i){
          ctx.fillStyle = (r.rankDiff<=-3)? RED : TXT;
          ctx.font='11px ui-monospace,monospace';
          ctx.fillText(r.n+' 원값 '+r.rankVal+'위→인구대비 '+r.rankPer+'위(차'+(r.rankDiff>0?'+':'')+r.rankDiff+')', W*0.04, ry2+18+i*16);
        });

        var rx0=W*0.49, rx1=W*0.965;
        var maxArea=Math.max.apply(null, REGION5.map(function(r){return r.area0;}));
        var maxPop=Math.max.apply(null, REGION5.map(function(r){return r.pop;}));
        var maxVal=Math.max.apply(null, REGION5.map(function(r){return r.val;}));
        var minVal=Math.min.apply(null, REGION5.map(function(r){return r.val;}));
        var maxPer=Math.max.apply(null, REGION5.map(function(r){return r.per;}));
        var minPer=Math.min.apply(null, REGION5.map(function(r){return r.per;}));
        function scaleColor(t,hue){ return 'hsl('+hue+',70%,'+(25+t*40)+'%)'; }
        var rowH=20, gap=4, y1=36;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('단계구분도(면적=명목 지역크기, 색=원값)', rx0, y1-8);
        REGION5.forEach(function(r,i){
          var w=(rx1-rx0)*0.5*(r.area0/maxArea), t=(r.val-minVal)/(maxVal-minVal), y=y1+i*(rowH+gap);
          ctx.fillStyle=scaleColor(t,330); ctx.fillRect(rx0,y,w,rowH);
          ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.strokeRect(rx0,y,w,rowH);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText(r.n+' '+r.val, rx0+w+6, y+rowH*0.72);
        });
        var y2=y1+5*(rowH+gap)+18;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.fillText('카토그램(면적=인구, 색=인구대비 값)', rx0, y2-8);
        REGION5.forEach(function(r,i){
          var w=(rx1-rx0)*0.5*(r.pop/maxPop), t=(r.per-minPer)/(maxPer-minPer), y=y2+i*(rowH+gap);
          ctx.fillStyle=scaleColor(t,150); ctx.fillRect(rx0,y,w,rowH);
          ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.strokeRect(rx0,y,w,rowH);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.fillText(r.n+' '+r.per.toFixed(3), rx0+w+6, y+rowH*0.72);
        });

      } else if(s.step===3){
        var code3=[
          {t:'score = mean(normalize(sales,cust,1-ret,revisit))', hl:'normalize'},
          {t:'rows.sort(key=lambda r: -r.score)  # 행 정렬', hl:'.sort'}
        ];
        var codeBot3=codePanel(E, W*0.04, 12, W*0.42, code3, 'heatmap_sort.py', 1);
        var ry3=codeBot3+18;
        ctx.font='11px ui-monospace,monospace'; ctx.textAlign='left';
        HM_SORTED.forEach(function(r,i){
          ctx.fillStyle = i===0? GRN : (i===HM_SORTED.length-1? RED : TXT);
          ctx.fillText((i+1)+'위 '+r.n+' 점수='+r.score.toFixed(3), W*0.04, ry3+i*15);
        });

        var rx0=W*0.49, rx1=W*0.965;
        function colorCell(t){ return 'hsl(330,65%,'+(28+t*42)+'%)'; }
        function drawMatrix(rows,y0,label){
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(label, rx0, y0-6);
          var nameW=52, cellW=(rx1-rx0-nameW)/4, cellH=17;
          HM_METRICS.forEach(function(m,ci){
            ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
            ctx.fillText(HM_LABEL[m], rx0+nameW+ci*cellW+cellW/2, y0+9);
          });
          rows.forEach(function(r,ri){
            var y=y0+14+ri*cellH;
            ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
            ctx.fillText(r.n, rx0, y+12);
            HM_METRICS.forEach(function(m,ci){
              var x=rx0+nameW+ci*cellW;
              ctx.fillStyle=colorCell(r['n_'+m]);
              ctx.fillRect(x+2,y,cellW-4,cellH-2);
            });
          });
          return y0+14+rows.length*cellH;
        }
        var b1=drawMatrix(STORES_HM, 36, '정렬 전(원래 순서)');
        drawMatrix(HM_SORTED, b1+22, '정렬 후(점수 내림차순) — 위로 갈수록 밝음');

      } else {
        var code4=[
          {t:'ink_data = sum(bar_w * bar_h)', hl:'ink_data'},
          {t:'ink_junk = grid+border+shadow+depth', hl:'ink_junk'},
          {t:'ratio = ink_data/(ink_data+ink_junk)', hl:'ratio'}
        ];
        var codeBot4=codePanel(E, W*0.04, 12, W*0.42, code4, 'data_ink_ratio.py', 2);
        var ry4=codeBot4+20;
        ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillStyle=RED; ctx.fillText('잉크 낭비형 비율 = '+(INK_RATIO_A*100).toFixed(1)+'%', W*0.04, ry4);
        ctx.fillStyle=GRN; ctx.fillText('정제형 비율 = '+(INK_RATIO_B*100).toFixed(1)+'%', W*0.04, ry4+20);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('막대(데이터 잉크) 면적은 그대로, 곁다리 잉크만 걷어냈습니다', W*0.04, ry4+42);

        function drawInkChart(x0,y0,scale,junk,label){
          var cw=INK_CW*scale, ch=INK_CH*scale, bw=INK_BARW*scale, gap=INK_GAP*scale;
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(label, x0, y0-6);
          if(junk){
            ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
            for(var g=1; g<=4; g++){ var gy=y0+ch-(ch*g/4); ctx.beginPath(); ctx.moveTo(x0,gy); ctx.lineTo(x0+cw,gy); ctx.stroke(); }
            ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5*scale; ctx.strokeRect(x0,y0,cw,ch);
          } else {
            ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(x0,y0+ch); ctx.lineTo(x0+cw,y0+ch); ctx.stroke();
          }
          var bx=x0;
          BARS_INK.forEach(function(v,i){
            var bh=INK_HEIGHTS[i]*scale, by=y0+ch-bh;
            if(junk){
              ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(bx+4*scale, by+4*scale, bw, bh);
              ctx.fillStyle=ROSE; ctx.globalAlpha=0.5; ctx.fillRect(bx+bw, by, 6*scale, bh); ctx.globalAlpha=1;
            }
            ctx.fillStyle=ROSE; ctx.fillRect(bx,by,bw,bh);
            bx += bw+gap;
          });
        }
        var iscale=0.62;
        drawInkChart(W*0.50, 46, iscale, true, '잉크 낭비형(그리드·테두리·그림자·입체선)');
        drawInkChart(W*0.50+(INK_CW*iscale+40), 46, iscale, false, '정제형(막대+기준선만)');
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음(트리맵→버블→단계구분도/카토그램→히트맵→데이터잉크)', true);
      E.big('값이 그림이 되는 방식을 믿을 수 있는가',
        '값을 면적이나 색으로 바꾸는 순간 왜곡이 끼어들 여지가 생깁니다. <b>트리맵</b>은 매출 '+TREE_TOTAL+'억원을 대분류 폭과 세부 항목 높이로 실제로 쪼갠 것이므로 면적 자체가 곧 값입니다. <b>버블차트</b>는 반지름을 값에 비례시키면(흔한 실수) 넓이가 제곱으로 커져 실제 '+BUB_RATIO.toFixed(0)+'배 차이가 화면에서는 '+BUB_DISTORT.toFixed(2)+'배로 과장되지만, 넓이를 값에 비례시키면 왜곡이 사라집니다. <b>단계구분도</b>는 지역의 원값을 명목 면적에 색칠하는데, 서울처럼 인구가 압도적으로 많은 지역은 원값 1위라도 인구 대비로는 '+REGION5[0].rankPer+'위(가장 낮음)일 수 있습니다 — <b>카토그램</b>은 면적 자체를 인구에 비례시켜 이런 인구 대비 왜곡을 바로잡습니다. <b>히트맵</b>은 값을 색으로만 매핑하지만, 행을 점수순으로 정렬하면 흩어져 있던 값들 사이에서 실제 패턴(밝은 색이 위로 몰리는 경향)이 드러납니다. 마지막 <b>데이터-잉크 비율</b>은 같은 막대그래프에서 그리드·테두리·그림자·입체선을 걷어내는 것만으로 잉크 비율이 '+(INK_RATIO_A*100).toFixed(0)+'%에서 '+(INK_RATIO_B*100).toFixed(0)+'%로 오른다는 것을 보여줍니다 — 데이터는 그대로인데 곁다리 잉크만 줄인 결과입니다.'); }
  },

  // ══════════ 5. 같은 데이터를 세 개의 얼굴로 + 색상의 한계 ══════════
  { id:'bda53_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;

      if(s.step===0){
        var code0=[
          {t:'width = f(norm_growth)   # 얼굴 폭', hl:'norm_growth'},
          {t:'eye_r = f(norm_sat)      # 눈 크기', hl:'norm_sat'},
          {t:'brow  = f(norm_ret_inv)  # 눈썹 기울기', hl:'norm_ret_inv'},
          {t:'mouth = f(norm_revisit)  # 입꼬리', hl:'norm_revisit'}
        ];
        codePanel(E, W*0.04, 12, W*0.42, code0, 'chernoff_face.py', null);
        var fx0=W*0.505, fx1=W*0.955, cw=(fx1-fx0)/3, rowYs=[95,225];
        STORE6.forEach(function(st,i){
          var col=i%3, row=Math.floor(i/3);
          var cx=fx0+col*cw+cw/2, cy=rowYs[row];
          var faceW=18+st.n_growth*14, faceH=faceW*1.15;
          ctx.strokeStyle=S6_COLORS[i]; ctx.lineWidth=1.6;
          ctx.beginPath(); ctx.ellipse(cx,cy,faceW,faceH,0,0,7); ctx.stroke();
          var eyeR=2+st.n_sat*3;
          ctx.fillStyle=TXT;
          ctx.beginPath(); ctx.arc(cx-faceW*0.4,cy-faceH*0.15,eyeR,0,7); ctx.fill();
          ctx.beginPath(); ctx.arc(cx+faceW*0.4,cy-faceH*0.15,eyeR,0,7); ctx.fill();
          var browT=(st.n_ret-0.5)*10;
          ctx.strokeStyle=TXT; ctx.lineWidth=1.4;
          [-1,1].forEach(function(side){
            var bx=cx+side*faceW*0.4;
            ctx.beginPath(); ctx.moveTo(bx-faceW*0.18, cy-faceH*0.32-browT*side); ctx.lineTo(bx+faceW*0.18, cy-faceH*0.32+browT*side); ctx.stroke();
          });
          var mCurve=(st.n_revisit-0.5)*faceH*0.5;
          ctx.beginPath(); ctx.moveTo(cx-faceW*0.4, cy+faceH*0.35);
          ctx.quadraticCurveTo(cx, cy+faceH*0.35+mCurve, cx+faceW*0.4, cy+faceH*0.35);
          ctx.stroke();
          ctx.fillStyle=S6_COLORS[i]; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
          ctx.fillText(st.n+'매장', cx, cy+faceH+16);
          ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=DIM;
          ctx.fillText('성장'+st.growth+'% 만족'+st.sat, cx, cy+faceH+30);
        });

      } else if(s.step===1){
        var code1=[
          {t:'angle_k = 2*pi*k/4     # 4개 축', hl:'2*pi*k/4'},
          {t:'r = R * norm_value[k]  # 중심에서의 거리', hl:'norm_value[k]'}
        ];
        codePanel(E, W*0.04, 12, W*0.42, code1, 'star_chart.py', null);
        var cxr=W*0.72, cyr=142, Rm=82;
        var axA=[-Math.PI/2, 0, Math.PI/2, Math.PI];
        for(var ring=1; ring<=4; ring++){
          ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.beginPath();
          axA.forEach(function(a,i){ var x=cxr+Math.cos(a)*Rm*ring/4, y=cyr+Math.sin(a)*Rm*ring/4; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
          ctx.closePath(); ctx.stroke();
        }
        axA.forEach(function(a,i){
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(cxr,cyr); ctx.lineTo(cxr+Math.cos(a)*Rm, cyr+Math.sin(a)*Rm); ctx.stroke();
          var lx=cxr+Math.cos(a)*(Rm+24), ly=cyr+Math.sin(a)*(Rm+24);
          ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
          ctx.fillText(S6_LABEL[S6_METRICS[i]], lx, ly);
        });
        STORE6.forEach(function(st,si){
          ctx.strokeStyle=S6_COLORS[si]; ctx.lineWidth=1.6; ctx.globalAlpha=0.85;
          ctx.beginPath();
          S6_METRICS.forEach(function(m,i){
            var v=st['n_'+m], a=axA[i], x=cxr+Math.cos(a)*Rm*v, y=cyr+Math.sin(a)*Rm*v;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          });
          ctx.closePath(); ctx.stroke(); ctx.globalAlpha=1;
        });
        var lx0=W*0.505, ly0=284;
        STORE6.forEach(function(st,i){
          var lx=lx0+(i%3)*72, ly=ly0+Math.floor(i/3)*16;
          ctx.fillStyle=S6_COLORS[i]; ctx.fillRect(lx,ly-8,10,10);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.n+'매장', lx+14, ly);
        });

      } else if(s.step===2){
        var code2=[
          {t:'y_k = axisBot - norm[k]*axisH  # 축마다 같은 정규화', hl:'norm[k]'},
          {t:'polyline(store) connects 4 y_k', dim:true}
        ];
        var codeBot2=codePanel(E, W*0.04, 12, W*0.42, code2, 'parallel_coords.py', 0);
        ctx.font='11px ui-monospace,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('성장률·재구매율 상관계수 = '+CORR_GROWTH_REVISIT.toFixed(3), W*0.04, codeBot2+20);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('평행좌표에서 두 축의 선 기울기가 나란한 게 이 상관관계입니다', W*0.04, codeBot2+40);

        var px0=W*0.505, px1=W*0.94, pTop=40, pBot=226, axX=[];
        for(var k=0;k<4;k++) axX.push(px0+(px1-px0)*(k/3));
        axX.forEach(function(x,k){
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x,pTop); ctx.lineTo(x,pBot); ctx.stroke();
          ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
          ctx.fillText(S6_LABEL[S6_METRICS[k]], x, pBot+16);
        });
        STORE6.forEach(function(st,si){
          ctx.strokeStyle=S6_COLORS[si]; ctx.lineWidth=1.6; ctx.globalAlpha=0.85;
          ctx.beginPath();
          S6_METRICS.forEach(function(m,k){
            var v=st['n_'+m], y=pBot-(pBot-pTop)*v;
            if(k===0) ctx.moveTo(axX[k],y); else ctx.lineTo(axX[k],y);
          });
          ctx.stroke(); ctx.globalAlpha=1;
        });
        var lx0=W*0.505, ly0=264;
        STORE6.forEach(function(st,i){
          var lx=lx0+(i%3)*72, ly=ly0+Math.floor(i/3)*16;
          ctx.fillStyle=S6_COLORS[i]; ctx.fillRect(lx,ly-8,10,10);
          ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.n+'매장', lx+14, ly);
        });

      } else {
        var code3=[
          {t:'gap = 360 / N        # 색상환을 N등분', hl:'360 / N'},
          {t:'risky = gap < 45     # 8종 기준선(45도) 대비', hl:'gap < 45'}
        ];
        var codeBot3=codePanel(E, W*0.04, 12, W*0.42, code3, 'color_limit.py', 1);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('밀러의 8종 한계 = 360°/8 = 45°를 기준선으로 씀', W*0.04, codeBot3+20);

        var py0=44, panelH=54;
        COLOR_INFO.forEach(function(p,pi){
          var y=py0+pi*panelH;
          ctx.font='11px ui-monospace,monospace'; ctx.textAlign='left';
          ctx.fillStyle = p.risky? RED : GRN;
          ctx.fillText('N='+p.N+'  간격='+p.gap.toFixed(1)+'°  '+(p.risky?'구분 어려움':'구분 가능'), W*0.505, y+10);
          var sw=13, gapx=3;
          for(var i=0;i<p.N;i++){
            var hue=i*360/p.N;
            ctx.fillStyle='hsl('+hue+',70%,55%)';
            ctx.fillRect(W*0.505+i*(sw+gapx), y+16, sw, 18);
          }
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음(체르노프→스타차트→평행좌표→색상 8종 한계)', true);
      E.big('같은 데이터를 세 개의 얼굴로 — 그리고 색의 한계',
        '매장 6곳의 같은 4개 지표(성장률·만족도·반품률·재구매율)를 세 가지 방식으로 실제로 그립니다. <b>체르노프 페이스</b>는 각 지표를 얼굴 폭·눈 크기·눈썹 기울기·입꼬리에 대응시켜, 사람이 표정을 직관적으로 읽는 능력을 빌립니다 — F매장은 모든 지표에서 앞서 웃는 큰 얼굴로, A매장은 작고 처진 얼굴로 나타납니다. <b>스타차트</b>는 같은 값을 4개 축의 중심으로부터의 거리로 표현해 다각형 크기로 종합 성과를 비교합니다. <b>평행좌표계</b>는 4개 축을 나란히 세우고 매장마다 선으로 이어, 성장률과 재구매율처럼 상관계수 '+CORR_GROWTH_REVISIT.toFixed(2)+'에 이르는 강한 관계를 두 축 사이 선의 기울기가 나란한 모습으로 보여줍니다 — 체르노프는 개별 매장의 「인상」을, 스타차트는 「종합 크기」를, 평행좌표는 「변수 사이의 관계」를 각각 잘 드러내고 서로의 몫을 감춥니다. 마지막으로 색상 하나로 범주를 늘려가 보면, N=8일 때 색상환 간격은 정확히 45도(밀러가 말한 구분 가능 한계)이고 N=10부터는 36도로 좁아져 인접한 색이 헷갈리기 시작합니다 — 「구분 가능한 색은 약 8종」이라는 말이 실제 색상환 계산으로 확인됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
