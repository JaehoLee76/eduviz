/* 빅데이터 분석 제50장 — 과목 II(데이터 처리 기술) 총정리
   동작(behavior)만. 텍스트=content/bda50.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   이 장은 34·35장이 원리를 깊게 다뤘지만 ADP 필기가 실제로 묻는 "레이어 명칭·구현체 이름·특성 목록"이
   비어 있던 것을 채우는 총정리 장이다(gap_subj2.md 기준). 앞 3장면은 window.BdaMap(js/bda_map.js)으로
   명칭·분류 체계를 보여주고, 뒤 2장면은 스타/스노우플레이크 스키마의 조인 횟수·읽는 행 수, 그리고
   가상화의 자원 분할·오버헤드를 실제로 계산해 보여준다.
   골든룰: 체계도 장면은 계산이 없어 위반이 아니다(단 수치를 쓰면 실계산). 동작 장면(50_04·50_05)의
   모든 수(조인 횟수·읽는 행 수·중복 칸 수·할당량·오버헤드·사용가능량)는 아래 고정 데이터로부터
   이 파일 로드 시 또는 draw 시 실제 계산한다. 난수(Math.random) 절대 금지 — 일관 해싱 데모의 해시는
   결정적 문자열 해시 함수를 쓴다. 오버헤드 기준값(가상화 씬)은 "이 모형이 정한 가정"임을 화면에 밝힌다. */
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

  function fmt(n){ var s=Math.round(n)+''; var out=''; for(var i=0;i<s.length;i++){ if(i>0 && (s.length-i)%3===0) out+=','; out+=s[i]; } return out; }

  // ══════════ 50.4 스타 vs 스노우플레이크 — 고정 데이터(정규화 계층에서 스타를 실제로 파생) ══════════
  var COUNTRY=[{id:0,name:'가국'},{id:1,name:'나국'}];
  var REGION=[{id:0,name:'수도권',country:0},{id:1,name:'남부권',country:0},{id:2,name:'대양주',country:1}];
  var CITY=[{id:0,name:'서울',region:0},{id:1,name:'인천',region:0},{id:2,name:'부산',region:1},{id:3,name:'광주',region:1},{id:4,name:'시드니',region:2}];
  var STORE=[{id:0,name:'점포1',city:0},{id:1,name:'점포2',city:0},{id:2,name:'점포3',city:1},{id:3,name:'점포4',city:1},{id:4,name:'점포5',city:2},{id:5,name:'점포6',city:2},{id:6,name:'점포7',city:3},{id:7,name:'점포8',city:4}];
  var FACT50=[]; (function(){ for(var i=0;i<30;i++) FACT50.push({store:i%8, amt:1000+((i*137)%900)*10}); })();
  function cityOf(id){ return CITY[STORE[id].city]; }
  function regionOf(id){ return REGION[cityOf(id).region]; }
  function countryOf(id){ return COUNTRY[regionOf(id).country]; }
  var STORE_STAR=STORE.map(function(s){ return {id:s.id, name:s.name, city:cityOf(s.id).name, region:regionOf(s.id).name, country:countryOf(s.id).name}; });
  var DEPTH_LABELS=['매장','도시','지역','국가'];
  var DEPTH_TABLES=['store','store→city','store→city→region','store→city→region→country'];
  function groupKeyStar(storeId,depth){ var s=STORE_STAR[storeId]; return depth===0?s.name:depth===1?s.city:depth===2?s.region:s.country; }
  function groupKeySnow(storeId,depth){ if(depth===0) return STORE[storeId].name; if(depth===1) return CITY[STORE[storeId].city].name; if(depth===2) return REGION[CITY[STORE[storeId].city].region].name; return COUNTRY[REGION[CITY[STORE[storeId].city].region].country].name; }
  function rowsSnow(depth){ return FACT50.length+STORE.length+(depth>=1?CITY.length:0)+(depth>=2?REGION.length:0)+(depth>=3?COUNTRY.length:0); }
  var ROWS_STAR50 = FACT50.length+STORE_STAR.length; // 38
  var DUP_CITY=STORE.length-CITY.length, DUP_REGION=STORE.length-REGION.length, DUP_COUNTRY=STORE.length-COUNTRY.length;
  var DUP_TOTAL50=DUP_CITY+DUP_REGION+DUP_COUNTRY; // 14
  var TOTAL_AMT50=(function(){ var t=0; FACT50.forEach(function(f){t+=f.amt;}); return t; })(); // 157950
  function groupAgg(depth,useStar){
    var g={};
    FACT50.forEach(function(f){ var k=useStar?groupKeyStar(f.store,depth):groupKeySnow(f.store,depth); g[k]=(g[k]||0)+f.amt; });
    return g;
  }

  // ══════════ 50.5 가상화 — 물리 서버 총량(이 장면이 정한 가정) + 기준 오버헤드 ══════════
  var VTOTAL={cpu:16, mem:128, io:800}; // 코어 / GB / MB·s
  var VBASE={ full:{cpu:0.08, mem:0.10, io:0.15}, para:{cpu:0.03, mem:0.04, io:0.06} };
  function vscale(n){ return 1+0.04*(n-2); }
  function vcalc(n,mode){
    var out={};
    ['cpu','mem','io'].forEach(function(r){
      var ovh=VBASE[mode][r]*vscale(n);
      var alloc=VTOTAL[r]/n;
      var usable=alloc*(1-ovh);
      out[r]={ovh:ovh, alloc:alloc, usable:usable, totalUsable:usable*n};
    });
    return out;
  }

  // ══════════ 50.2 일관 해싱 — 결정적 문자열 해시로 링 데모(모듈로 대비) ══════════
  function strHash50(s){ var h=5381>>>0; for(var i=0;i<s.length;i++){ h=(((h*33)>>>0) ^ s.charCodeAt(i))>>>0; } return h; }
  var CH_RING=10007;
  function ringPos50(s){ return strHash50(s)%CH_RING; }
  var CH_KEYS=['apple','banana','cherry','date','elder','fig','grape','honey','kiwi','lemon','mango','nectar'];
  var CH_REPL=4;
  function nodePoints50(name){ var pts=[]; for(var r=0;r<CH_REPL;r++) pts.push({name:name, h:ringPos50(name+'#'+r)}); return pts; }
  var CH_NODES4=['N0','N1','N2','N3'];
  var CH_PTS4=[].concat.apply([], CH_NODES4.map(nodePoints50));
  var CH_PTS5=[].concat.apply([], CH_NODES4.concat(['N4']).map(nodePoints50));
  function ringAssign50(points,keyHash){ var sorted=points.slice().sort(function(a,b){return a.h-b.h;}); for(var i=0;i<sorted.length;i++){ if(keyHash<=sorted[i].h) return sorted[i].name; } return sorted[0].name; }
  var CH_KEYHASH=CH_KEYS.map(function(k){ return ringPos50(k); });
  var CH_BEFORE=CH_KEYHASH.map(function(kh){ return ringAssign50(CH_PTS4,kh); });
  var CH_AFTER=CH_KEYHASH.map(function(kh){ return ringAssign50(CH_PTS5,kh); });
  var CH_RING_CHANGED=CH_BEFORE.filter(function(v,i){ return v!==CH_AFTER[i]; }).length;
  var CH_MOD_BEFORE=CH_KEYHASH.map(function(kh){ return kh%4; });
  var CH_MOD_AFTER=CH_KEYHASH.map(function(kh){ return kh%5; });
  var CH_MOD_CHANGED=CH_MOD_BEFORE.filter(function(v,i){ return v!==CH_MOD_AFTER[i]; }).length;

  var scenes = [

  // ══════════ 1. 데이터가 흐르는 다섯 단계, 그 옆 갈래들 ══════════
  { id:'bda50_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      window.BdaMap(E, {
        title:'데이터가 흐르는 다섯 단계, 그 옆 갈래들',
        sub:'탭으로 ETL 레이어 → CDC 갈래 → 데이터 연계 → EAI 효과, 한 열씩 짚어 봅니다',
        cols:[
          { t:'ETL, 다섯 켜(레이어)로 보면', c:ROSE, items:[
            {t:'인터페이스 단계', s:'원천(DB·파일·웹서비스)에서 데이터를 끌어오는 통로 자체'},
            {t:'데이터 스테이징 단계', s:'원천 구조 그대로 임시 테이블에 부려놓는다 — 정규화 없음'},
            {t:'데이터 프로파일링 단계', s:'품질을 점검해 보고서만 남긴다 — 아직 고치지 않음'},
            {t:'데이터 클렌징 단계', s:'프로파일링이 찾은 오류를 규칙에 따라 실제로 고침'},
            {t:'익스포트 단계', s:'정제된 데이터를 규칙에 맞춰 웨어하우스·마트로 내보냄'}
          ]},
          { t:'CDC, 다섯에 둘을 더하면', c:BLU, items:[
            {t:'다섯 갈래(시각·버전·상태·트리거·로그)', s:'34장에서 실제로 비교함 — 여기서는 이름만 정리해 둠'},
            {t:'복합 기법(시각+버전+상태)', s:'세 특성을 함께 써 정교한 조건으로 추출 — 이번 장 신규'},
            {t:'이벤트 프로그래밍 방식', s:'변경 감지 로직을 앱에 직접 심음 — 개발 부담 크지만 자유로움(신규)'}
          ]},
          { t:'데이터 연계, 세 갈래로 보면', c:GLD, items:[
            {t:'배치 통합', s:'정해진 주기로 몰아서 — 대용량에 강함(34장에서 실측)'},
            {t:'비동기식 근접 실시간 통합', s:'배치와 실시간 사이 — 짧은 지연으로 자주 반영, 절충점'},
            {t:'동기식 실시간 통합', s:'발생 즉시 처리 — 지연 최소, 처리 부담은 그대로(34장에서 실측)'}
          ]},
          { t:'EAI가 실제로 주는 것', c:GRN, items:[
            {t:'개발·유지보수 비용 절감', s:'허브 하나로 모아 매번 새로 잇지 않음(34장에서 연결 수 실측)'},
            {t:'정보 시스템의 지속적 발전 기반', s:'시스템을 갈아끼워도 허브 인터페이스만 맞추면 됨'},
            {t:'협력사·파트너 연계 기반 확보', s:'외부 조직과의 연동 통로를 표준화해 둠'},
            {t:'인터넷 비즈니스의 토대', s:'웹 서비스 확장에 필요한 연동 구조를 미리 갖춤'}
          ]}
        ],
        focus: s.step===0? -1 : s.step-1,
        foot:'이 여덟 갈래는 34장의 실측(연결 수·지연·절감폭) 위에 얹는 이름표입니다'
      });
      E.tapHint(0,0,'▶ 탭으로 한 열씩', false);
      E.big('데이터가 흐르는 다섯 단계, 그 옆 갈래들', 'ETL은 인터페이스 → 스테이징 → 프로파일링 → 클렌징 → 익스포트, <b>다섯 켜(레이어)</b>로 나뉩니다. CDC는 34장에서 다룬 다섯 갈래(타임스탬프·버전·상태·트리거·로그 스캔)에 더해, 세 특성을 함께 쓰는 <b>복합 기법</b>과 감지 로직을 애플리케이션에 직접 심는 <b>이벤트 프로그래밍 방식</b>이 있습니다. 데이터 연계는 배치·실시간 둘로 끝나지 않고, 그 사이에 <b>비동기식 근접 실시간</b>이라는 절충 갈래가 있습니다. EAI는 34장에서 실제로 센 연결 수 절감을 발판 삼아, 개발비 절감부터 인터넷 비즈니스 토대까지 네 가지 실질적 효과로 이어집니다.'); }
  },

  // ══════════ 2. 저장을 나눈 이름들 ══════════
  { id:'bda50_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      window.BdaMap(E, {
        title:'저장을 나눈 이름들',
        sub:'구글식 분산파일시스템의 가정 → NoSQL 두 갈래 → HPC 클러스터 파일시스템 → 병렬 DBMS',
        cols:[
          { t:'구글식 분산파일시스템이 가정한 것', c:ROSE, items:[
            {t:'저가 서버가 흔히 고장난다고 가정', s:'장애를 예외가 아니라 기본값으로 두고 설계'},
            {t:'파일은 대부분 대용량이라고 가정', s:'작은 파일 최적화보다 대용량 처리 효율을 우선'},
            {t:'순차 읽기 위주의 작업 부하', s:'전체를 쭉 읽거나 임의 지점을 조금 읽는 두 유형이 대부분'},
            {t:'쓰기는 추가(append) 위주', s:'이미 쓴 내용을 고치기보다 뒤에 이어붙이는 패턴'},
            {t:'응답 지연보다 처리율이 중요', s:'한 건을 빨리 끝내기보다 전체 처리량을 높이는 쪽'}
          ]},
          { t:'이름 붙은 NoSQL 두 갈래', c:BLU, items:[
            {t:'컬럼 지향 저장소(대형 검색기업)', s:'row-key+column-key+시각으로 정렬된 다차원 구조'},
            {t:'키-값 저장소(대형 전자상거래기업)', s:'일관 해싱이면 노드 4→5에 키 '+CH_KEYS.length+'개 중 '+CH_RING_CHANGED+'개만 재배치(실측) — 단순나머지면 '+CH_MOD_CHANGED+'개(35장)'}
          ]},
          { t:'메타데이터를 떼어낸 클러스터 파일시스템', c:GLD, items:[
            {t:'클라이언트 파일시스템', s:'응용에는 평범한 파일시스템처럼 보이게 하는 창구'},
            {t:'메타데이터 서버', s:'이름공간·파일 위치만 관리 — 크기가 작아 메모리에 다 올림'},
            {t:'객체 저장 서버', s:'실제 데이터를 들고 클라이언트와 직접 주고받음 — 메타서버 우회'},
            {t:'구글식 파일시스템과 다른 점', s:'고성능컴퓨팅(HPC) 워크로드 — 동시 접근 잠금 관리가 정교함'}
          ]},
          { t:'병렬 DBMS, 아키텍처와 제품군', c:GRN, items:[
            {t:'리소스 공유 3방식', s:'공유디스크(장애에 강함) · 공유메모리(응답빠름·확장한계) · 무공유(확장무제한)'},
            {t:'대형 상용 RDBMS의 클러스터 옵션', s:'공유 디스크 — 장애 노드 서비스를 다른 노드가 이어받음'},
            {t:'통합 클러스터 환경', s:'평소 무공유 파티션 + 장애 시 공유 디스크로 전환'},
            {t:'상용 서버의 병렬 처리', s:'독립 서버마다 데이터를 나눠 갖고 UNION ALL로 하나처럼 합침'},
            {t:'오픈소스 RDBMS 클러스터', s:'무공유·메모리 기반 — 파티셔닝 제약·디스크 기반 클러스터링'}
          ]}
        ],
        focus: s.step===0? -1 : s.step-1,
        foot:'청크·복제·해시 파티셔닝(35장 실측) 위에 얹는 저장 인프라 이름표입니다'
      });
      E.tapHint(0,0,'▶ 탭으로 한 열씩', false);
      E.big('저장을 나눈 이름들', '구글식 분산파일시스템은 저가 서버의 잦은 고장·대용량 파일·추가(append) 위주 쓰기·높은 처리율을 <b>가정</b>하고 설계됐습니다(35장의 청크·복제가 이 가정 위에 서 있습니다). NoSQL 두 갈래(컬럼 지향·키-값) 중 키-값 저장소는 <b>일관 해싱</b>을 쓰면 노드를 4개에서 5개로 늘려도 '+CH_KEYS.length+'개 키 중 '+CH_RING_CHANGED+'개만 실제로 재배치됩니다 — 35장에서 본 단순 나머지 해싱은 같은 변화에 '+CH_MOD_CHANGED+'개가 재배치됐습니다. 고성능컴퓨팅(HPC)용 클러스터 파일시스템은 메타데이터 서버와 객체 저장 서버를 분리해, 이름·위치 정보(가벼움)와 실제 데이터(무거움)를 서로 다른 서버가 맡습니다. 병렬 DBMS는 리소스 공유 방식(공유 디스크·공유 메모리·무공유)에 따라 실제 제품군의 성격이 갈립니다.'); }
  },

  // ══════════ 3. 처리·질의·플랫폼의 이름들 ══════════
  { id:'bda50_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s;
      window.BdaMap(E, {
        title:'처리·질의·플랫폼의 이름들',
        sub:'로그 수집 시스템의 자격 → 분산 병렬 처리 플랫폼의 자격 → 질의 언어 3종 → 그밖의 이름표',
        cols:[
          { t:'대용량 로그 수집 시스템의 자격', c:ROSE, items:[
            {t:'초고속 수집 성능과 확장성', s:'서버가 늘면 에이전트 수만 늘려 그대로 대응'},
            {t:'데이터 전송 보장 메커니즘', s:'단계마다 신호를 주고받아 유실 없이 — 안정성·성능 트레이드오프'},
            {t:'다양한 수집·저장 플러그인', s:'잘 알려진 서비스는 설정만으로, 저장소도 여러 종류 지원'},
            {t:'인터페이스 상속을 통한 기능 확장', s:'기본 기능은 그대로 두고 업무에 맞게 일부만 오버라이드'}
          ]},
          { t:'분산 병렬 처리 플랫폼의 자격', c:BLU, items:[
            {t:'선형적인 성능·용량 확장', s:'무공유 구조라 서버를 더하면 그 대수에 비례해 늘어남'},
            {t:'고장 감내성', s:'데이터는 여러 복제본, 죽은 태스크는 다른 서버가 자동 재실행'},
            {t:'핵심 비즈니스 로직에 집중', s:'맵·리듀스 두 함수만 작성 — 장애·확장은 플랫폼이 처리'},
            {t:'풍부한 생태계', s:'수집·연동·질의·워크플로 각 영역에 붙여 쓸 도구가 갖춰짐'}
          ]},
          { t:'분산 병렬 질의 언어 3종', c:GLD, items:[
            {t:'대형 검색기업의 절차형 질의 언어', s:'명령을 순서대로 나열해 처리 흐름을 직접 지정'},
            {t:'데이터 흐름형 스크립트 언어', s:'데이터가 파이프라인을 따라 흐르며 단계마다 변형됨'},
            {t:'SQL 유사 웨어하우스 언어', s:'SQL 문법을 흉내내 관계형 DB 경험자가 바로 씀'}
          ]},
          { t:'그밖에 알아둘 이름표', c:GRN, items:[
            {t:'클라우드형 데이터 서비스', s:'관계형 모델을 API 기반 클라우드 저장소로 옮긴 초기 형태'},
            {t:'잡 관리 구조(작업추적자→태스크추적자)', s:'마스터가 태스크로 쪼개 배정 → 워커가 실행, 하트비트로 생존 알림'},
            {t:'대량 전송 도구', s:'RDBMS↔분산저장소 사이 스키마를 읽어 대량 이동, 양방향'},
            {t:'즉시질의 SQL 엔진', s:'맵리듀스를 새로 띄우지 않고 상주 데몬이 곧장 질의를 처리'},
            {t:'완전가상화', s:'하이퍼바이저가 자원을 전부 대신 제어 — 매 특권명령마다 가로챔'},
            {t:'반가상화', s:'게스트OS가 하이퍼바이저를 직접 호출(하이퍼콜) — 커널 일부 수정'}
          ]}
        ],
        focus: s.step===0? -1 : s.step-1,
        foot:'맵리듀스(35장 실측) 위에서 실제로 무엇이 이름 붙어 돌아가는지의 지도입니다'
      });
      E.tapHint(0,0,'▶ 탭으로 한 열씩', false);
      E.big('처리·질의·플랫폼의 이름들', '대용량 로그 수집 시스템은 <b>초고속 수집·전송 보장·다양한 플러그인·인터페이스 확장</b> 네 가지를 갖춰야 하고, 분산 병렬 처리 플랫폼은 <b>선형 확장·고장 감내·비즈니스 로직 집중·풍부한 생태계</b>를 갖춰야 합니다. 35장에서 실제로 돌려본 맵리듀스(map→shuffle→reduce) 위에는 <b>작업 추적자(마스터)</b>가 태스크를 쪼개 <b>태스크 추적자(워커)</b>들에게 배정하는 구조가 있습니다. 사람이 직접 맵리듀스 코드를 짜지 않고도 데이터를 다룰 수 있게, 절차형·데이터흐름형·SQL유사형 세 갈래의 질의 언어가 그 위에 얹혀 있고, 맵리듀스를 아예 거치지 않는 <b>즉시질의 SQL 엔진</b>도 있습니다. 완전가상화·반가상화는 다음 장면에서 실제 오버헤드로 계산해 봅니다.'); }
  },

  // ══════════ 4. 스타 스키마 vs 스노우플레이크 — 조인 횟수와 읽는 행 수 ══════════
  { id:'bda50_04',
    enter:function(E){ var self=this; self.s={depth:1};
      E.controls('<div class="ctrl"><label>질의 계층 깊이</label><input type="range" id="b504d" min="0" max="3" step="1" value="1"><output id="b504do">도시</output></div>');
      E.bind('#b504d','input',function(e){ self.s.depth=+e.target.value; document.getElementById('b504do').textContent=DEPTH_LABELS[self.s.depth]; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, d=s.depth;
      var joinsStar=1, joinsSnow=d+1, rowsStar=ROWS_STAR50, rowsSnowN=rowsSnow(d);
      var codeLines=[
        {t:'depth = "'+DEPTH_LABELS[d]+'"          # '+DEPTH_TABLES[d], dim:true},
        {t:'STAR_JOINS  = 1                # 항상 고정', hl:'1'},
        {t:'SNOW_JOINS  = depth + 1  ->  '+joinsSnow, hl:''+joinsSnow},
        {t:'SNOW_ROWS   = fact + store [..country]  ->  '+rowsSnowN, hl:''+rowsSnowN}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, codeLines, 'star_vs_snowflake.py', [1,2,3]);

      var gStar=groupAgg(d,true), gSnow=groupAgg(d,false);
      var nStar=Object.keys(gStar).length;
      var sumStar=0; for(var k in gStar) sumStar+=gStar[k];
      var match = JSON.stringify(gStar)===JSON.stringify(gSnow);

      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText(DEPTH_LABELS[d]+'별 매출 합계 — 조인 스타 '+joinsStar+'회 vs 스노우 '+joinsSnow+'회', W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('읽는 총 행 수: 스타 '+rowsStar+'행(고정) vs 스노우플레이크 '+rowsSnowN+'행', W*0.04, ry+19);
      ctx.fillStyle=match?GRN:RED;
      ctx.fillText((match?'검산 일치: ':'검산 불일치: ')+'그룹 '+nStar+'개, 매출 합계 '+fmt(sumStar)+'원 — 두 스키마 동일', W*0.04, ry+38);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('대신 스타는 이름 문자열 '+DUP_TOTAL50+'칸 중복(도시'+DUP_CITY+'+지역'+DUP_REGION+'+국가'+DUP_COUNTRY+', 점포 8개 기준)', W*0.04, ry+57);

      var rx0=W*0.51, rx1=W*0.965;
      var t1=40, t1h=210;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('필요한 JOIN 수(왼쪽)와 읽는 행 수(오른쪽, /50 눈금)', rx0, t1-14);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,t1+t1h); ctx.lineTo(rx1,t1+t1h); ctx.stroke();
      var grpW=(rx1-rx0)/4, jw=grpW*0.62, jmax=4, rmax=50;
      var bars=[
        {lab:'스타·JOIN',v:joinsStar,max:jmax,col:GRN},
        {lab:'스노우·JOIN',v:joinsSnow,max:jmax,col:BLU},
        {lab:'스타·행',v:rowsStar,max:rmax,col:GRN},
        {lab:'스노우·행',v:rowsSnowN,max:rmax,col:BLU}
      ];
      bars.forEach(function(b,bi){
        var bx=rx0+bi*grpW+(grpW-jw)/2;
        var hh=(b.v/b.max)*t1h;
        ctx.fillStyle=b.col; ctx.fillRect(bx, t1+t1h-hh, jw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=b.col; ctx.textAlign='center';
        ctx.fillText(''+b.v, bx+jw/2, t1+t1h-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(b.lab, bx+jw/2, t1+t1h+16);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 조회 깊이를 바꿔 조인 횟수·행 수가 실제로 바뀌는 것을 보세요', true);
      E.big('스타 스키마 vs 스노우플레이크 스키마', '<b>스타 스키마</b>는 차원 테이블(점포)에 도시·지역·국가 이름을 전부 미리 펼쳐(비정규화) 담아둡니다 — 그래서 어느 깊이를 조회하든 조인은 항상 '+joinsStar+'회, 읽는 행 수는 '+rowsStar+'행으로 고정됩니다. <b>스노우플레이크 스키마</b>는 같은 정보를 store→city→region→country로 정규화해 쪼개 둡니다 — 지금처럼 '+DEPTH_LABELS[d]+'별로 조회하려면 조인이 '+joinsSnow+'회 필요하고 읽는 행 수도 '+rowsSnowN+'행으로, 깊이가 늘수록 실제로 늘어납니다(매장 38→도시 43→지역 46→국가 48). 두 방식으로 계산한 '+DEPTH_LABELS[d]+'별 매출 합계는 그룹 '+nStar+'개, 총 '+fmt(sumStar)+'원으로 완전히 일치합니다 — 같은 답을 얻는 데 드는 <b>조인 비용</b>이 다를 뿐입니다. 그 대신 스타 스키마는 점포 8개에 도시·지역·국가 이름을 반복해서 담아 '+DUP_TOTAL50+'칸을 중복 저장합니다 — 조인을 줄인 대가로 저장 공간과 데이터 중복을 지불하는 셈입니다.'); }
  },

  // ══════════ 5. 가상화의 자원 분할과 오버헤드 ══════════
  { id:'bda50_05',
    enter:function(E){ var self=this; self.s={n:4, mode:0};
      E.controls('<div class="ctrl"><label>가상머신 수</label><input type="range" id="b505n" min="2" max="8" step="1" value="4"><output id="b505no">4</output></div>'
               +'<div class="ctrl"><label>가상화 방식</label><input type="range" id="b505m" min="0" max="1" step="1" value="0"><output id="b505mo">완전가상화</output></div>');
      E.bind('#b505n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b505no').textContent=self.s.n; });
      E.bind('#b505m','input',function(e){ self.s.mode=+e.target.value; document.getElementById('b505mo').textContent=self.s.mode===0?'완전가상화':'반가상화'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var n=s.n, modeKey=s.mode===0?'full':'para', modeLabel=s.mode===0?'완전가상화':'반가상화';
      var R=vcalc(n,modeKey);
      var code=[
        {t:'TOTAL = {cpu:16, mem:128, io:800}  # 물리서버(가정)', dim:true},
        {t:'alloc = TOTAL[r] / '+n+'                  # 균등 분할', hl:'/ '+n},
        {t:'overhead = BASE_OVH["'+modeKey+'"] * (1+0.04*('+n+'-2))', hl:'"'+modeKey+'"'},
        {t:'usable = alloc * (1 - overhead)', hl:'usable'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'virtualize_'+modeKey+'.py', 3);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('VM '+n+'대 · '+modeLabel+' (이 장면이 정한 기준 오버헤드)', W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ['cpu','mem','io'].forEach(function(r,ri){
        var lab=r==='cpu'?'CPU':(r==='mem'?'메모리':'I/O');
        var unit=r==='cpu'?'코어':(r==='mem'?'GB':'MB/s');
        ctx.fillText(lab+': VM당 '+R[r].alloc.toFixed(2)+unit+' 할당 → 오버헤드 '+(R[r].ovh*100).toFixed(1)+'% → 사용가능 '+R[r].usable.toFixed(2)+unit, W*0.04, ry+20+ri*17);
      });

      var rx0=W*0.51, rx1=W*0.965;
      var bt=ry+18, bh=26, gap=14;
      ['cpu','mem','io'].forEach(function(r,ri){
        var lab=r==='cpu'?'CPU('+VTOTAL.cpu+'코어)':(r==='mem'?'메모리('+VTOTAL.mem+'GB)':'I/O('+VTOTAL.io+'MB/s)');
        var y=bt+ri*(bh+gap);
        var full=VTOTAL[r]/n, usableW=(R[r].usable/full)*(rx1-rx0), ovhW=(rx1-rx0)-usableW;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(lab+' — VM당 할당', rx0, y-4);
        ctx.fillStyle=GRN; ctx.fillRect(rx0, y, usableW, bh);
        ctx.fillStyle=RED; ctx.fillRect(rx0+usableW, y, ovhW, bh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle='#111'; ctx.textAlign='center';
        if(usableW>36) ctx.fillText('사용가능', rx0+usableW/2, y+bh/2+4);
      });

      var cy=bt+3*(bh+gap)+6;
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      var otherKey=s.mode===0?'para':'full', otherR=vcalc(n,otherKey);
      ctx.fillText('같은 VM '+n+'대에서 '+(s.mode===0?'반가상화였다면':'완전가상화였다면')+' 총 사용가능 CPU '+otherR.cpu.totalUsable.toFixed(2)+'코어(지금 '+R.cpu.totalUsable.toFixed(2)+'코어)', rx0, cy);
      ctx.fillText('메모리 '+otherR.mem.totalUsable.toFixed(1)+'GB(지금 '+R.mem.totalUsable.toFixed(1)+'GB) · I/O '+otherR.io.totalUsable.toFixed(0)+'MB/s(지금 '+R.io.totalUsable.toFixed(0)+'MB/s)', rx0, cy+18);

      E.tapHint(W/2, H*0.95, 'VM 수·가상화 방식 슬라이더로 할당·오버헤드·사용가능량이 실제로 바뀌는 것을 보세요', true);
      E.big('가상화의 자원 분할과 오버헤드', '물리 서버 한 대(CPU '+VTOTAL.cpu+'코어·메모리 '+VTOTAL.mem+'GB·I/O '+VTOTAL.io+'MB/s — 이 장면이 정한 가정)를 VM '+n+'대로 <b>균등 분할</b>하면 VM 하나는 CPU '+R.cpu.alloc.toFixed(2)+'코어를 할당받습니다. 그런데 하이퍼바이저를 거치는 데는 대가가 있습니다 — <b>'+modeLabel+'</b>은 CPU 기준 오버헤드 '+(R.cpu.ovh*100).toFixed(1)+'%를 실제로 깎아, 사용 가능한 몫은 '+R.cpu.usable.toFixed(2)+'코어로 줄어듭니다. 완전가상화는 특권 명령마다 하이퍼바이저가 가로채 대신 실행(trap)하므로 게스트 OS를 고칠 필요는 없지만 오버헤드가 크고, 반가상화는 게스트가 하이퍼콜로 곧장 요청하므로 커널 일부를 고쳐야 하지만 오버헤드가 작습니다 — 지금 VM '+n+'대 기준으로 총 사용가능 CPU가 완전가상화 '+vcalc(n,'full').cpu.totalUsable.toFixed(2)+'코어, 반가상화 '+vcalc(n,'para').cpu.totalUsable.toFixed(2)+'코어로 실제로 갈립니다. VM 수를 슬라이더로 늘려 보면(이 모형은 VM이 늘수록 하이퍼바이저의 스케줄링 부담도 함께 늘어난다고 가정합니다) 총 사용가능량이 서서히 줄어드는 것도 확인할 수 있습니다 — 자원을 잘게 쪼갤수록 관리 비용이 조금씩 더 든다는 뜻입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
