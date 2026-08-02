/* 빅데이터 분석 제49장 — 과목 I(데이터 이해) 총정리
   (ADP 필기 과목 I이 묻는 명명된 목록·분류·기관·비유·기법을 체계도 4장면 + 실측 1장면으로 정리)
   동작(behavior)만. 텍스트=content/bda49.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 체계도 장면(49_01~04)은 window.BdaMap으로 분류·명칭·정의를 구조로 보여줄 뿐 계산이 없다
   (js/bda_map.js 참고 — 계산 없는 체계도는 골든룰 위반이 아니다). 49_05는 화면의 모든 수(저장 용량 배수·
   정보량 단위 전환 연도·혼잡시간대 개수·절약 시간·부서 커버리지 등)를 아래 고정 데이터로부터 이 파일
   로드 시 실제 계산한다(하드코딩 금지). 가정이 필요한 수치(저장장치 가격 반감 주기, 정보량 증가율,
   교통·부서 모형의 세부값)는 전부 "이 모형이 정한 가정"으로 화면에 밝힌다. Math.random()/Date.now() 금지. */
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

  // ══════════ 49.1 데이터베이스 개념도 (32장과 안 겹치는 부분만) ══════════
  var COLS49_01 = [
    { t:'말의 시작과 법이 정의한 것', c:ROSE, items:[
      {t:'1950년대 미국', s:'세계에 흩어진 자국 군비를 관리하려 만든 전산 도서관 — "데이터(data)의 기지(base)"'},
      {t:'EU 지침의 정의', s:'체계적으로 정리되고 개별 접근 가능한 저작물·소재의 수집물'},
      {t:'국내 저작권법의 정의', s:'소재를 체계적으로 배열해 개별 접근·검색이 가능하게 한 편집물'},
      {t:'표준용어사전의 정의', s:'여러 이용자의 요구에 맞춰 데이터를 저장·공급하도록 편성한 집합'}
    ]},
    { t:'성질과 얼굴 일곱', c:BLU, items:[
      {t:'기계가독성', s:'정보처리기기가 직접 읽고 쓸 수 있음 — 일반 DB의 성질'},
      {t:'검색가능성', s:'다양한 방법으로 필요한 정보를 찾아낼 수 있음 — 일반 DB의 성질'},
      {t:'원격조작성', s:'통신망으로 먼 곳에서도 즉시 온라인으로 이용 — 일반 DB의 성질'},
      {t:'웨어하우스·주제지향성', s:'업무 절차가 아니라 고객·상품 같은 주제를 중심으로 모음'},
      {t:'웨어하우스·통합성', s:'여러 원천의 데이터를 하나의 일관된 형식으로 합침'},
      {t:'웨어하우스·시계열성', s:'시간 흐름에 따라 데이터를 쌓아 과거 이력까지 함께 저장'},
      {t:'웨어하우스·비휘발성', s:'한 번 적재된 데이터는 임의로 갱신·삭제하지 않음'}
    ]},
    { t:'사회기반 데이터베이스 넷', c:GLD, items:[
      {t:'지리(NGIS)', s:'국가지형도·지하매설물도를 전산화 — 1995년 착수(물류망과 같은 해, 32장 실측)'},
      {t:'교통', s:'실시간·비실시간 교통정보를 함께 관리 — 1998년 착수(32장에서 가장 늦은 착수)'},
      {t:'의료(EMR·PACS)', s:'전자의무기록과 영상처리시스템으로 병원정보화 — 1996년 상용화'},
      {t:'교육(NEIS)', s:'학교별 DB를 시·도 교육청 DB로 묶어 교무·학사·행정을 처리 — 2003년 적용'}
    ]},
    { t:'기업의 데이터베이스 — CRM·SCM', c:PUR, items:[
      {t:'CRM·제조부문', s:'ERP 이후 SCM으로 기능 확장, 대기업→중소기업으로 실시간기업(RTE) 확산'},
      {t:'CRM·금융부문', s:'IMF 외환위기 이후 e-CRM으로 고객정보를 전략적으로 활용'},
      {t:'CRM·유통부문', s:'백화점·할인점 등으로 다양해지며 지역·고객 중심 운영에 필수가 됨'},
      {t:'SCM·제조부문', s:'ERP 이후 부품 설계~유통 전 공정으로 범위가 확대됨'},
      {t:'SCM·금융부문', s:'EAI·ERP로 데이터베이스 간 정보 공유·통합, 이후 EDW로 확장'},
      {t:'SCM·유통부문', s:'전자문서교환(EDI)이 본격화되며 예산을 투입해 구축'}
    ]}
  ];

  // ══════════ 49.2 빅데이터 정의·배경·비유 ══════════
  var COLS49_02 = [
    { t:'누가 정의했나', c:ROSE, items:[
      {t:'컨설팅 회사의 정의', s:'일반적인 DB 소프트웨어로 다루기 힘든 규모에 초점'},
      {t:'조사·분석 기관의 정의', s:'대량 데이터에서 저렴하게 가치를 뽑는 차세대 기술·아키텍처에 초점'},
      {t:'저술가의 정의', s:'작은 데이터로는 못 얻던 통찰을 뽑아 시장·정부·시민의 관계까지 바꾸는 일'}
    ]},
    { t:'왜 지금 나타났나', c:BLU, items:[
      {t:'산업계 — 고객 데이터 축적', s:'기업들이 오래 모아온 데이터가 거대한 가치를 만들 규모에 도달'},
      {t:'학계 — 거대 데이터 과학', s:'유전체·물리학처럼 방대한 관측 데이터를 다루는 학문이 늘어남'},
      {t:'기술 발전', s:'디지털화·저장기술·인터넷·모바일·클라우드가 겹쳐 커짐 — 나눠 저장·계산하는 방식(35장)도 이 흐름'}
    ]},
    { t:'네 가지에 비유하면', c:GLD, items:[
      {t:'산업혁명의 석탄과 철', s:'증기기관을 움직인 동력원처럼, 차세대 산업의 원동력이 될 것으로 기대'},
      {t:'21세기의 원유', s:'가공해야 힘을 내는 원유처럼, 빅데이터도 정제해야 정보가 됨'},
      {t:'렌즈', s:'현미경이 생물학을 바꿨듯, 데이터가 사회를 들여다보는 창이 됨'},
      {t:'플랫폼', s:'OS 위에 소프트웨어가 얹히듯, 여러 사업자가 공동으로 활용하는 기반이 됨'}
    ]},
    { t:'미래 빅데이터의 세 조건', c:PUR, items:[
      {t:'데이터화', s:'아직 기록되지 않은 현상을 데이터로 옮기는 힘'},
      {t:'인공지능', s:'쌓인 데이터에서 패턴을 찾아내는 분석 기술'},
      {t:'인력', s:'데이터 사이언티스트처럼 그 둘을 잇는 사람'}
    ]}
  ];

  // ══════════ 49.3 빅데이터의 가치·활용·프라이버시 ══════════
  var COLS49_03 = [
    { t:'가치를 만드는 다섯 방식', c:ROSE, items:[
      {t:'투명성 제고', s:'숨어 있던 데이터를 관련 부서가 함께 보게 해 연구개발·관리 효율을 높임'},
      {t:'시뮬레이션으로 수요 포착', s:'가상으로 돌려 보고 주요 변수를 미리 찾아 경쟁력을 키움'},
      {t:'고객 세분화', s:'무리별로 나눠 맞춤 서비스를 제공 — 40장 군집분석이 이 갈래'},
      {t:'알고리즘 의사결정', s:'사람의 판단을 알고리즘이 보조하거나 대신함'},
      {t:'비즈니스 모델 혁신', s:'제품·서비스 자체를 새로 설계하는 데까지 나아감'}
    ]},
    { t:'실제로 쓰인 자리 다섯', c:BLU, items:[
      {t:'검색엔진', s:'사용자 로그로 검색 결과 자체를 계속 개선'},
      {t:'대형 유통', s:'구매 패턴을 분석해 상품을 함께 진열'},
      {t:'질의응답 시스템', s:'방대한 자료를 학습해 사람의 질문에 직접 답함'},
      {t:'정보기관', s:'여러 경로의 신호를 모아 상황을 분석'},
      {t:'선거·문화산업', s:'유권자·팬의 데이터로 활동 전략을 짬'}
    ]},
    { t:'기본 테크닉 일곱 가지', c:GLD, items:[
      {t:'연관규칙학습', s:'"이걸 사면 저것도 사는가?" — 41장에서 실제로 계산'},
      {t:'유형분석', s:'"이 사용자는 어떤 집단에 속하는가?" — 분류 트리(25장)와 같은 갈래'},
      {t:'유전 알고리즘', s:'"어떤 조합이 최적인가?" — 자연선택 방식으로 점진적으로 진화시켜 찾음(우리 트랙 미수록)'},
      {t:'기계학습', s:'"다음엔 무엇을 원할까?" — 9~31장 예측 모델링 전체가 이 갈래'},
      {t:'회귀분석', s:'"무엇이 무엇에 영향을 주는가?" — 8장에서 실제로 계산'},
      {t:'감정분석', s:'"이 의견은 긍정인가 부정인가?" — 43장 텍스트 마이닝에서 실제로 계산'},
      {t:'소셜네트워크분석', s:'"이 사람은 몇 다리 건너 연결되는가?" — 44장에서 실제로 계산'}
    ]},
    { t:'프라이버시를 지키는 세 권고', c:PUR, items:[
      {t:'설계 단계부터 보호', s:'상품을 만들 때부터 프라이버시 보호 방안을 넣음'},
      {t:'선택권 간소화', s:'소비자가 정보 공유 여부를 쉽게 고를 수 있게 함'},
      {t:'투명성 강화', s:'수집된 정보의 내용을 공개하고 접근권을 줌'}
    ]}
  ];

  // ══════════ 49.4 전략과 인문학 ══════════
  var COLS49_04 = [
    { t:'다섯 가지 경고 사례', c:RED, items:[
      {t:'열풍과 회의론', s:'성공사례로 소개되는 것 다수가 기존 고객분석(CRM)을 포장만 바꾼 것'},
      {t:'싸이월드, 페이스북이 되지 못한 이유', s:'데이터는 있었지만 분석에 기초해 판단을 내리는 조직문화가 없었음'},
      {t:'"Big"이 핵심이 아니다', s:'설문에서 기업들의 관심사는 데이터 양이 아니라 데이터의 다양함이었음'},
      {t:'전략적 통찰 없는 분석의 함정', s:'조사에서 성과 낮은 기업 중 분석 역량을 갖췄다는 응답은 소수에 그침'},
      {t:'가정 위의 분석, 그 한계', s:'2008년 금융위기 — 낙관적 가정에 기댄 모델이 그 가정이 깨지자 함께 무너짐'}
    ]},
    { t:'사회경제 환경변화 셋', c:BLU, items:[
      {t:'복잡한 세계화', s:'규모의 경제·표준화이던 흐름이 다양성·정체성·연결성으로 바뀜'},
      {t:'제품에서 서비스로', s:'고장 없는 품질보다 고객 경험·서비스가 더 중요해짐'},
      {t:'생산에서 시장창조로', s:'좋은 제품을 만들면 팔리던 시대에서, 현지 문화를 이해해야 파는 시대로'}
    ]},
    { t:'가치 패러다임 변화 3단계', c:GLD, items:[
      {t:'디지털화', s:'아날로그를 0과 1로 옮기는 힘이 가치의 원천이던 시대'},
      {t:'연결', s:'옮겨진 정보를 서로 잇는 힘이 가치의 원천이 된 시대'},
      {t:'에이전시', s:'복잡해진 연결을 대신 관리해 주는 힘이 다음 가치의 원천'}
    ]},
    { t:'인문학이 돌아온 이유', c:PUR, items:[
      {t:'과학과 인문의 교차로', s:'정량 분석(과학)과 인문학적 통찰에 근거한 추론을 함께 조합하는 일'},
      {t:'인문학적 사고 = 비판', s:'익숙한 것을 낯설게 보고, 왜 그렇게 생각했는지 캐묻는 태도'},
      {t:'과거·현재·미래 × 정보·통찰력', s:'같은 질문도 어느 축에 있느냐에 따라 보고서가 되거나 통찰이 됨'}
    ]}
  ];

  function bdaMapScene(id, cols, title, sub, foot){
    return { id:id,
      enter:function(E){ this.s={step:0}; E.setOn([]); },
      tap:function(E){ this.s.step=(this.s.step+1)%(cols.length+1); },
      draw:function(E){ var s=this.s;
        window.BdaMap(E, { title:title, sub:sub, cols:cols,
          focus: s.step===0? -1 : s.step-1, foot:foot });
        E.tapHint(0,0,'▶ 탭으로 한 갈래씩', false);
      }
    };
  }

  // ══════════ 49.5: 네 가지를 직접 계산해 보다 (동작 항목) ══════════
  // (a) 무어의 법칙과 저장장치 가격 하락 — 이 모형의 가정: GB당 가격이 18개월마다 절반
  var MOORE_START49 = 800000;      // 가정: 기준 시점 GB당 저장장치 가격(원)
  var MOORE_HALF_M49 = 18;         // 가정: 반값이 되는 데 걸리는 개월 수
  var MOORE_YEARS49 = [0,5,10,15,20,25,30];
  var MOORE_PRICE49 = MOORE_YEARS49.map(function(y){ return MOORE_START49/Math.pow(2, (y*12)/MOORE_HALF_M49); });
  var MOORE_CAP49 = MOORE_PRICE49.map(function(p){ return MOORE_START49/p; }); // 같은 예산으로 살 수 있는 배수

  // (b) ZB·EB 단위로 본 정보량 증가 추이 — 이 모형의 가정: 전세계 정보량이 해마다 40%씩 증가
  var INFO_START49 = 1;            // 가정: 기준 시점 전세계 디지털 정보량(EB)
  var INFO_GROWTH49 = 1.4;         // 가정: 연간 성장 배수
  var INFO_YEARS49 = [0,1,2,3,4,5,6,7,8,9,10];
  var INFO_EB49 = INFO_YEARS49.map(function(y){ return INFO_START49*Math.pow(INFO_GROWTH49, y); });
  var INFO_ZB_YEAR49 = (function(){ for(var i=0;i<INFO_EB49.length;i++){ if(INFO_EB49[i]>=1000) return INFO_YEARS49[i]; } return -1; })();

  // (c) 같은 데이터가 기업·정부·개인에 미치는 효과 — 24시간 교차로 통행량(고정 수식, 난수 아님)
  var TRAFFIC49 = []; for(var _h=0; _h<24; _h++){ TRAFFIC49.push(Math.max(5, Math.round(50+40*Math.sin((_h-8)*Math.PI/12)))); }
  var TRAFFIC_MEAN49 = TRAFFIC49.reduce(function(s,v){return s+v;},0)/TRAFFIC49.length;
  var TRAFFIC_PEAK_H49 = (function(){ var bi=0; for(var i=1;i<24;i++){ if(TRAFFIC49[i]>TRAFFIC49[bi]) bi=i; } return bi; })();
  var GOV_THRESH49 = TRAFFIC_MEAN49*1.3;                                   // 가정: 평균의 1.3배를 넘으면 혼잡 시간대
  var GOV_ALERT_H49 = TRAFFIC49.filter(function(v){ return v>GOV_THRESH49; }).length;
  var SPEED_PEAK49 = 18, SPEED_OFF49 = 45, TRIP_KM49 = 10;                  // 가정: 혼잡·평시 평균속도(km/h)·기준 이동거리(km)
  var TIME_SAVED_MIN49 = (TRIP_KM49/SPEED_PEAK49 - TRIP_KM49/SPEED_OFF49)*60; // 개인이 혼잡시간을 피해 아끼는 분
  var BIZ_TRIPS49 = 500;                                                    // 가정: 이 경로를 매일 오가는 이용자 수
  var BIZ_SAVED_H49 = TIME_SAVED_MIN49*BIZ_TRIPS49/60;

  // (d) 일차적 분석 vs 가치기반 분석 — 6개 부서 모형(고정 가정값)
  var DEPTS49 = ['마케팅','물류','품질관리','고객센터','재무','전략기획'];
  var PRIMARY_IDX49 = [1,2];                    // 일차적 분석이 닿는 부서(물류·품질관리)
  var PRIMARY_IMPACT49 = [18,22];               // 가정: 그 두 부서의 개선율(%)
  var VALUE_IMPACT49 = [9,12,11,8,7,14];        // 가정: 가치기반 분석이 전 부서에 주는 개선율(%)
  var PRIMARY_SUM49 = PRIMARY_IMPACT49.reduce(function(s,v){return s+v;},0);
  var VALUE_SUM49 = VALUE_IMPACT49.reduce(function(s,v){return s+v;},0);
  var PRIMARY_AVG49 = PRIMARY_SUM49/PRIMARY_IDX49.length;
  var VALUE_AVG49 = VALUE_SUM49/DEPTS49.length;
  var PRIMARY_COVER49 = PRIMARY_IDX49.length/DEPTS49.length;
  var VALUE_COVER49 = 1;

  function frame49(ctx,px0,px1,pTop,pBot,xlab,ylab){
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
    ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
    if(xlab) ctx.fillText(xlab, (px0+px1)/2, pBot+34);
    if(ylab){ ctx.save(); ctx.translate(px0-24,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText(ylab,0,0); ctx.restore(); }
  }

  var PANEL_TITLE49 = ['moore_storage.py','info_volume.py','traffic_stakeholders.py','primary_vs_value.py'];
  var PANEL_HEAD49 = ['무어의 법칙과 저장장치 가격', 'ZB·EB로 본 정보량 증가', '기업·정부·개인, 같은 데이터 다른 효과', '일차적 분석 vs 가치기반 분석'];

  var scenes = [

  bdaMapScene('bda49_01', COLS49_01, '데이터베이스, 그리고 그것을 채운 조직들',
    '32장에서 다룬 "통합된 데이터" 말고, 나머지 정의·성질·조직을 마저 짚습니다',
    '지리·교통·의료·교육 넷 + 물류(32장 실측) = 다섯 사회기반 데이터베이스'),

  bdaMapScene('bda49_02', COLS49_02, '빅데이터, 왜 지금 왔고 무엇에 비유되나',
    '33장의 3V 다음, 이번엔 정의의 출처·출현 배경·네 가지 비유를 짚습니다',
    '탭으로 정의 → 배경 → 비유 → 미래조건 순서로 짚어 봅니다'),

  bdaMapScene('bda49_03', COLS49_03, '빅데이터의 가치, 활용, 지켜야 할 선',
    '33장의 위기 요인 다음, 이번엔 가치를 만드는 방식·실제 활용·기법·보호 권고를 짚습니다',
    '테크닉 7가지 중 5가지는 우리 트랙 다른 장에서 실제로 돌려 봤습니다'),

  bdaMapScene('bda49_04', COLS49_04, '데이터에서 통찰로 — 전략과 인문학',
    '거의 다루지 않았던 3장(전략 인사이트) 전체를 한 화면에 모읍니다',
    '데이터가 있어도 통찰로 이어지지 않으면 싸이월드처럼 됩니다'),

  { id:'bda49_05',
    enter:function(E){ this.s={panel:0}; E.setOn([]); },
    tap:function(E){ this.s.panel=(this.s.panel+1)%4; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, p=s.panel;

      if(p===0){
        var code=[
          '# 가정: 18개월마다 GB당 가격이 절반',
          'price = START / 2**(months/18)',
          'capacity = START / price   # 같은 예산으로 살 GB 배수'
        ];
        var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, PANEL_TITLE49[p], 1);
        ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('30년 뒤 같은 예산으로 살 수 있는 용량 = '+MOORE_CAP49[MOORE_CAP49.length-1].toFixed(1)+'배', W*0.04, codeBot+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('가정: 기준가 '+MOORE_START49.toLocaleString()+'원/GB, 18개월마다 반값 (모형의 가정값)', W*0.04, codeBot+42);

        var px0=W*0.49, px1=W*0.965, pTop=30, pBot=234;
        frame49(ctx,px0,px1,pTop,pBot,'경과 연수','같은 예산의 저장 배수(log)');
        var maxCap=MOORE_CAP49[MOORE_CAP49.length-1];
        function bx(i){ return px0+ (i/(MOORE_YEARS49.length-1))*(px1-px0); }
        function by(v){ var t=Math.log(Math.max(1,v))/Math.log(maxCap); return pBot-(t)*(pBot-pTop); }
        ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
        MOORE_CAP49.forEach(function(v,i){ var x=bx(i),y=by(v); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        MOORE_CAP49.forEach(function(v,i){ ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(bx(i),by(v),3,0,7); ctx.fill();
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(MOORE_YEARS49[i]+'년', bx(i), pBot+15);
          if(i===MOORE_CAP49.length-1 || i===0) ctx.fillText('×'+v.toFixed(1), bx(i), by(v)-10);
        });

        E.tapHint(0,0,'▶ 탭 = 다음 계산(4개 중 1/4)', false);
        E.big(PANEL_HEAD49[p], '저장 비용은 무어의 법칙과 비슷한(혹은 더 빠른) 속도로 떨어졌습니다. "18개월마다 절반"이라는 이 모형의 가정으로 실제 계산하면, 같은 예산으로 살 수 있는 저장 용량은 5년마다 대략 10배씩 불어나 30년 뒤에는 처음의 '+MOORE_CAP49[MOORE_CAP49.length-1].toFixed(0)+'배에 이릅니다. 저장 비용이 이렇게 무너졌기 때문에 "일단 다 모아 두고 나중에 분석하자"는 빅데이터의 전제 자체가 경제적으로 가능해졌습니다.');
      } else if(p===1){
        var code2=[
          '# 가정: 전세계 디지털 정보량이 해마다 40%씩 증가',
          'vol[y] = START * 1.4**y   # 단위: EB',
          'if vol[y] >= 1000: unit = "ZB"   # 1ZB = 1000EB'
        ];
        var codeBot2=codePanel(E, W*0.04, 12, W*0.42, code2, PANEL_TITLE49[p], 1);
        ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText((INFO_ZB_YEAR49>=0? (INFO_ZB_YEAR49+'년 차에 1ZB(=1000EB)를 처음 넘습니다') : '10년 안에는 1ZB를 넘지 않습니다'), W*0.04, codeBot2+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('가정: 기준 시점 '+INFO_START49+'EB, 연 40% 증가 (모형의 가정값 — 실제 공표치 아님)', W*0.04, codeBot2+42);

        var px0=W*0.49, px1=W*0.965, pTop=30, pBot=234;
        frame49(ctx,px0,px1,pTop,pBot,'경과 연수','정보량(log, EB)');
        var maxV=INFO_EB49[INFO_EB49.length-1];
        function bx2(i){ return px0+(i/(INFO_YEARS49.length-1))*(px1-px0); }
        function by2(v){ var t=Math.log(Math.max(1,v))/Math.log(maxV); return pBot-t*(pBot-pTop); }
        ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle=BLU; ctx.setLineDash([3,3]);
        var zbY = by2(1000);
        ctx.beginPath(); ctx.moveTo(px0,zbY); ctx.lineTo(px1,zbY); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=BLU; ctx.textAlign='left'; ctx.fillText('1000EB = 1ZB', px0+4, zbY-5);
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
        INFO_EB49.forEach(function(v,i){ var x=bx2(i),y=by2(v); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        INFO_EB49.forEach(function(v,i){ ctx.fillStyle=(INFO_YEARS49[i]===INFO_ZB_YEAR49)?RED:GRN; ctx.beginPath(); ctx.arc(bx2(i),by2(v),(INFO_YEARS49[i]===INFO_ZB_YEAR49)?4.2:2.6,0,7); ctx.fill();
          if(i%2===0){ ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(INFO_YEARS49[i]+'년', bx2(i), pBot+15); }
        });

        E.tapHint(0,0,'▶ 탭 = 다음 계산(4개 중 2/4)', false);
        E.big(PANEL_HEAD49[p], '연 40% 증가라는 이 모형의 가정으로 실제 계산해 보면, 기준 시점 1EB(엑사바이트)이던 정보량이 '+(INFO_ZB_YEAR49>=0?INFO_ZB_YEAR49:'10')+'년 차에 1000EB, 즉 1ZB(제타바이트)를 넘습니다. 처음엔 EB 단위로도 충분했던 정보량이 10년이 채 지나기 전에 자릿수를 하나 더 올려 ZB 단위로 옮겨가야 할 만큼 가파르게 불어난다는 뜻입니다 — 이것이 "빅"데이터라는 말이 과장이 아닌 이유입니다.');
      } else if(p===2){
        var code3=[
          'v[h] = round(50 + 40*sin((h-8)*pi/12))  # 24시간 통행량',
          'gov_alert = count(v[h] > mean(v)*1.3)    # 정부: 혼잡 시간대 수',
          'saved_min = 10/18*60 - 10/45*60          # 개인: 우회로 아낀 분'
        ];
        var codeBot3=codePanel(E, W*0.04, 12, W*0.42, code3, PANEL_TITLE49[p], [0,1,2]);
        ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GRN; ctx.fillText('기업: 우회 추천으로 하루 총 '+BIZ_SAVED_H49.toFixed(1)+'시간 절약(이용자 '+BIZ_TRIPS49+'명 가정)', W*0.04, codeBot3+20);
        ctx.fillStyle=BLU; ctx.fillText('정부: 평균의 1.3배 넘는 혼잡 시간대 '+GOV_ALERT_H49+'개('+TRAFFIC_PEAK_H49+'시가 최고점)', W*0.04, codeBot3+38);
        ctx.fillStyle=GLD; ctx.fillText('개인: 혼잡시간을 피하면 10km 이동에 '+TIME_SAVED_MIN49.toFixed(1)+'분 절약', W*0.04, codeBot3+56);

        var px0=W*0.49, px1=W*0.965, pTop=30, pBot=224, bw=(px1-px0)/24;
        frame49(ctx,px0,px1,pTop,pBot,'시각(0~23시)','통행량(대/시)');
        var maxT=Math.max.apply(null,TRAFFIC49);
        TRAFFIC49.forEach(function(v,h){ var x=px0+h*bw, hh=(v/maxT)*(pBot-pTop), y=pBot-hh;
          ctx.fillStyle=(v>GOV_THRESH49)?RED:(h===TRAFFIC_PEAK_H49?GLD:BLU); ctx.fillRect(x+1,y,bw-2,hh); });
        ctx.strokeStyle=DIM; ctx.setLineDash([2,3]);
        var thY=pBot-(GOV_THRESH49/maxT)*(pBot-pTop);
        ctx.beginPath(); ctx.moveTo(px0,thY); ctx.lineTo(px1,thY); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('정부 임계선(평균×1.3)', px0+4, thY-5);

        E.tapHint(0,0,'▶ 탭 = 다음 계산(4개 중 3/4)', false);
        E.big(PANEL_HEAD49[p], '같은 교차로의 24시간 통행량 하나로, 세 주체는 서로 다른 숫자를 뽑아냅니다. 기업(내비게이션 서비스)은 혼잡시간 우회를 추천해 이용자 '+BIZ_TRIPS49+'명 기준 하루 '+BIZ_SAVED_H49.toFixed(1)+'시간을 아껴 경쟁력을 높이고(혁신·생산성), 정부는 평균의 1.3배를 넘는 시간대를 실제로 세어 '+GOV_ALERT_H49+'개의 관리 대상 구간을 찾아내며(환경 탐색·상황 분석), 개인은 그 데이터를 보고 혼잡시간을 피해 10km 이동에 '+TIME_SAVED_MIN49.toFixed(1)+'분을 아낍니다. 데이터는 하나지만 그 데이터가 만드는 효과는 보는 주체에 따라 완전히 다른 숫자로 갈립니다.');
      } else {
        var code4=[
          'primary = impact[물류, 품질관리]      # 부서 2곳',
          'value = impact[전 부서 6곳]           # 부서 전체',
          'coverage = len(부서) / 전체부서수'
        ];
        var codeBot4=codePanel(E, W*0.04, 12, W*0.42, code4, PANEL_TITLE49[p], [0,1,2]);
        ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('일차적 분석: 부서 '+PRIMARY_IDX49.length+'/'+DEPTS49.length+'곳, 부서당 평균 '+PRIMARY_AVG49.toFixed(1)+'%, 합계 '+PRIMARY_SUM49+'', W*0.04, codeBot4+20);
        ctx.fillStyle=GRN; ctx.fillText('가치기반 분석: 부서 '+DEPTS49.length+'/'+DEPTS49.length+'곳, 부서당 평균 '+VALUE_AVG49.toFixed(1)+'%, 합계 '+VALUE_SUM49+'', W*0.04, codeBot4+38);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('가정: 부서별 개선율(%)은 이 모형이 정한 값 — 실제 조사치가 아닙니다', W*0.04, codeBot4+58);

        var px0=W*0.49, px1=W*0.965, pTop=30, pBot=224;
        frame49(ctx,px0,px1,pTop,pBot,null,'개선율(%)');
        var gw=(px1-px0)/DEPTS49.length, maxV4=Math.max.apply(null,VALUE_IMPACT49.concat(PRIMARY_IMPACT49));
        DEPTS49.forEach(function(name,di){
          var x=px0+di*gw+gw*0.5;
          var vi=VALUE_IMPACT49[di], hh2=(vi/maxV4)*(pBot-pTop);
          ctx.fillStyle=GRN; ctx.globalAlpha=0.85; ctx.fillRect(x-gw*0.22,pBot-hh2,gw*0.4,hh2); ctx.globalAlpha=1;
          var pidx=PRIMARY_IDX49.indexOf(di);
          if(pidx>=0){ var pv=PRIMARY_IMPACT49[pidx], hh3=(pv/maxV4)*(pBot-pTop);
            ctx.fillStyle=RED; ctx.fillRect(x+gw*0.02,pBot-hh3,gw*0.4,hh3); }
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(name, x, pBot+15);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GRN; ctx.textAlign='left'; ctx.fillText('■가치기반(전 부서)', px0, pTop-14);
        ctx.fillStyle=RED; ctx.fillText('■일차적(해당 부서만)', px0+120, pTop-14);

        E.tapHint(0,0,'▶ 탭 = 처음으로(4개 중 4/4)', false);
        E.big(PANEL_HEAD49[p], '같은 회사 6개 부서를 놓고 두 분석을 실제로 대비합니다. 일차적 분석은 물류·품질관리 두 부서에만 닿지만 그 두 부서 안에서는 평균 '+PRIMARY_AVG49.toFixed(1)+'%라는 큰 개선을 냅니다(전체 대비 부서 비중 '+Math.round(PRIMARY_COVER49*100)+'%). 가치기반 분석은 부서당 평균 개선율('+VALUE_AVG49.toFixed(1)+'%)은 더 작지만 전 부서('+Math.round(VALUE_COVER49*100)+'%)에 걸쳐 있어, 회사 전체로 더한 개선의 합('+VALUE_SUM49+')이 일차적 분석의 합('+PRIMARY_SUM49+')보다 큽니다 — 좁고 깊은 분석과 넓고 얕은(그러나 총합은 더 큰) 분석의 차이입니다.');
      }
    }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
