/* 빅데이터 분석 제32장 — 데이터와 데이터베이스
   (데이터의 정의·유형 · DIKW 피라미드 · 데이터베이스 정의·특징(통합) · DBMS·SQL(OLTP/OLAP) · 사회기반구조)
   동작(behavior)만. 텍스트=content/bda32.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(분류 개수·최저가·절감액·중복 건수·집계 합계·이동거리 등)는 아래 고정
   데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지). Math.random()/Date.now() 금지.
   이 장은 ADP 필기 이론(서술형) 과목이라 수치가 정말 필요한 곳이 적다 — 이 파일의 "예시 값"
   (가격표·급여파일·주문내역·GPS 위치)은 개념을 실제로 돌려 보이기 위한 설명용 고정 시나리오이며,
   시장 통계나 실제 조사치를 주장하지 않는다(장면 안에서 그렇게 밝힌다). */
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

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 32.1: 데이터의 정의와 유형 (정성/정량, 암묵지/형식지) ══════════
  var ITEMS32 = [
    {raw:'매출이 늘었다는 회의록 문구', kind:'경영 리포트'},
    {raw:34, kind:'고객 나이'},
    {raw:48.4, kind:'제품 무게(kg)'},
    {raw:'아주 만족스럽다는 후기', kind:'고객 후기'},
    {raw:23.5, kind:'평균 기온(℃)'},
    {raw:'선호도가 높다는 응답', kind:'설문 응답'},
    {raw:120, kind:'월 방문자 수'},
    {raw:'배송이 느렸다는 접수', kind:'불만 접수'},
    {raw:4.8, kind:'평점(5점 만점)'},
    {raw:'네이비를 선호한다는 응답', kind:'색상 응답'}
  ];
  function isNum32(v){ return typeof v==='number'; }
  var QN32 = ITEMS32.filter(function(it){ return isNum32(it.raw); }).length;
  var TN32 = ITEMS32.length - QN32;

  var TACIT32 = [
    {name:'자전거를 타는 몸의 감각', formal:false},
    {name:'제품 사용 설명서', formal:true},
    {name:'숙련공의 손끝 요령', formal:false},
    {name:'사내 업무 매뉴얼 문서', formal:true},
    {name:'오랜 경력자의 직감적 판단', formal:false},
    {name:'DB에 저장된 규정집', formal:true}
  ];
  var TC32 = TACIT32.filter(function(t){ return !t.formal; }).length;
  var EC32 = TACIT32.length - TC32;

  // ══════════ 32.2: DIKW 피라미드 — 세 상점 가격표 ══════════
  var ITEMNAME32 = ['연필','지우개','노트','필통','샤프심'];
  var STORE32 = ['A마트','B마트','C마트'];
  var PRICE32 = [
    [300, 500, 1200, 3500, 800],
    [350, 450, 1100, 3700, 750],
    [280, 480, 1300, 3600, 900]
  ];
  var MININFO32 = ITEMNAME32.map(function(name,i){
    var vals = PRICE32.map(function(row){ return row[i]; });
    var mi=0; for(var s=1;s<vals.length;s++){ if(vals[s]<vals[mi]) mi=s; }
    return {item:name, price:vals[mi], storeIdx:mi, vals:vals};
  });
  var CHEAPCOUNT32 = [0,0,0];
  MININFO32.forEach(function(m){ CHEAPCOUNT32[m.storeIdx]++; });
  var BEST_STORE32 = 0; for(var _s=1;_s<3;_s++){ if(CHEAPCOUNT32[_s]>CHEAPCOUNT32[BEST_STORE32]) BEST_STORE32=_s; }
  var TOTAL_OPT32 = MININFO32.reduce(function(s,m){ return s+m.price; },0);
  var TOTAL_BEST32 = PRICE32[BEST_STORE32].reduce(function(s,v){ return s+v; },0);
  var SAVE32 = TOTAL_BEST32 - TOTAL_OPT32;

  // ══════════ 32.3: 데이터베이스의 통합성 — 부서별 파일 vs 통합 DB ══════════
  var FILE_SALES32 = [ {id:1,name:'김민준'}, {id:2,name:'이서연'}, {id:5,name:'박도윤'}, {id:7,name:'최지우'} ];
  var FILE_HR32    = [ {id:1,name:'김민준'}, {id:3,name:'정하은'}, {id:5,name:'박도윤'}, {id:8,name:'한지호'} ];
  var FILE_FIN32   = [ {id:2,name:'이서연'}, {id:3,name:'정하은'}, {id:5,name:'박도윤'}, {id:9,name:'오채원'} ];
  var ALLFILES32 = [ {label:'영업부 파일', rows:FILE_SALES32}, {label:'인사부 파일', rows:FILE_HR32}, {label:'회계부 파일', rows:FILE_FIN32} ];
  var TOTAL_ROWS32 = ALLFILES32.reduce(function(s,f){ return s+f.rows.length; },0);
  var UNIQUE_MAP32 = {}; ALLFILES32.forEach(function(f){ f.rows.forEach(function(r){ UNIQUE_MAP32[r.id]=r; }); });
  var UNIQUE_N32 = Object.keys(UNIQUE_MAP32).length;
  var DUP_N32 = TOTAL_ROWS32 - UNIQUE_N32;
  // 갱신 문제: id=5(박도윤)의 연락처를 파일 방식에서는 영업부 파일 한 곳만 고쳤다고 가정
  var PHONE_BEFORE32 = '010-1111-0005';
  var PHONE_AFTER32 = '010-9999-0005';
  var FILES_WITH_ID5_32 = ALLFILES32.filter(function(f){ return f.rows.some(function(r){ return r.id===5; }); }).length; // 3곳 모두 보유
  var STALE_COUNT32 = FILES_WITH_ID5_32 - 1; // 영업부만 갱신 → 나머지는 옛 값

  // ══════════ 32.4: OLTP와 OLAP — 같은 주문 데이터 ══════════
  var PRODUCT32 = ['노트북','마우스','키보드','모니터'];
  var UNITPRICE32 = [1200000, 15000, 45000, 280000];
  var ORD32 = [];
  (function(){
    var id=1;
    for(var m=1;m<=3;m++){
      for(var p=0;p<PRODUCT32.length;p++){
        var qty = ((m+p)%3)+1; // 1~3, 고정 공식(난수 아님)
        for(var q=0;q<qty;q++){ ORD32.push({id:id++, prod:p, month:m, amt:UNITPRICE32[p]}); }
      }
    }
  })();
  var N_ORD32 = ORD32.length; // 24
  var OLTP_TARGET32 = ORD32[4]; // id=5
  var OLTP_OLD32 = OLTP_TARGET32.amt;
  var OLTP_NEW32 = Math.round(OLTP_OLD32*0.5); // 반품 처리로 절반 환불(예시 시나리오)
  var BY_PRODUCT32 = PRODUCT32.map(function(name,pi){
    var rows = ORD32.filter(function(o){ return o.prod===pi; });
    var sum = rows.reduce(function(s,o){ return s+o.amt; },0);
    return {name:name, n:rows.length, sum:sum};
  });
  var BY_MONTH32 = [1,2,3].map(function(m){
    var rows = ORD32.filter(function(o){ return o.month===m; });
    var sum = rows.reduce(function(s,o){ return s+o.amt; },0);
    return {month:m, n:rows.length, sum:sum};
  });

  // ══════════ 32.5: 사회기반구조로서의 데이터베이스 — 연혁 + 실시간 물류추적 ══════════
  var DOMAIN32 = [
    {name:'물류', year:1995, desc:'종합물류정보망 착수 — 실시간 차량추적'},
    {name:'지리', year:1995, desc:'국가지리정보체계(NGIS) 착수'},
    {name:'의료', year:1996, desc:'의료EDI 상용서비스 시작'},
    {name:'교육', year:1997, desc:'교육정보화종합계획 1단계 시작'},
    {name:'교통', year:1998, desc:'국가교통 데이터베이스 구축 시작'}
  ];
  var YEARS32 = DOMAIN32.map(function(d){ return d.year; });
  var EARLIEST32 = Math.min.apply(null,YEARS32);
  var LATEST32 = Math.max.apply(null,YEARS32);
  var SPAN32 = LATEST32-EARLIEST32;

  var GPS32 = [ {t:0,x:0.0,y:0.0}, {t:5,x:1.2,y:0.6}, {t:10,x:2.9,y:0.4}, {t:15,x:3.6,y:1.8}, {t:20,x:5.1,y:2.0} ];
  var GPS_DIST32 = 0;
  for(var _g=1;_g<GPS32.length;_g++){ var dx=GPS32[_g].x-GPS32[_g-1].x, dy=GPS32[_g].y-GPS32[_g-1].y; GPS_DIST32 += Math.sqrt(dx*dx+dy*dy); }
  var GPS_TIME32 = GPS32[GPS32.length-1].t - GPS32[0].t; // 분
  var GPS_SPEED32 = GPS_DIST32/(GPS_TIME32/60); // km/h

  // ── 공용 헬퍼 ──
  function frame32(px0,px1,pTop,pBot,xlab,ylab){
    return function(ctx){
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      if(xlab){ ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(xlab, (px0+px1)/2, pBot+18); }
      if(ylab){ ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(ylab,0,0); ctx.restore(); }
    };
  }

  var scenes = [

  // ══════════ 1. 데이터란 무엇인가 ══════════
  { id:'bda32_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'data = ["매출이 늘었다", 34, 48.4, ...]', hl:'data'},
        {t:'def is_quant(v):'},
        {t:'    return isinstance(v, (int, float))', hl:'isinstance'},
        {t:'sum(is_quant(v) for v in data)  # 정량 개수', hl:'sum'}
      ];
      var code1=[
        {t:"know = [('자전거 감각', False), ('설명서', True), ...]"},
        {t:'sum(1 for name, formal in know if formal)', hl:'formal'},
        {t:'# True=형식지(문서·DB), False=암묵지(체화된 요령)', dim:true}
      ];
      var code=(s.step<=1)?code0:code1;
      var actLine=(s.step===0)?null:(s.step===1?[1,2,3]:1);
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, code, (s.step<=1?'classify_data.py':'classify_knowledge.py'), actLine);
      var caps=['데이터는 형태로 두 갈래로 나뉩니다 — 언어·문자로 적힌 정성 데이터, 수치·기호로 적힌 정량 데이터입니다',
                '10건을 파이썬으로 실제 분류해 보면(isinstance로 숫자 여부 판정) 정량 '+QN32+'건 · 정성 '+TN32+'건입니다',
                '데이터는 지식경영의 재료이기도 합니다 — 몸에 밴 암묵지(체험) vs 문서로 남은 형식지(공유 가능)'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      wrapText(ctx, caps[s.step], W*0.04, codeBot+20, W*0.42, 15);

      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      if(s.step<=1){
        ctx.fillText('원본 데이터 10건', rx0, rTop);
        var rh=17.5;
        ITEMS32.forEach(function(it,i){
          var y=rTop+18+i*rh;
          var q=isNum32(it.raw);
          var col = (s.step===1) ? (q?BLU:ROSE) : TXT;
          ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=col; ctx.textAlign='left';
          var vtxt = q? String(it.raw) : ('"'+it.raw.slice(0,14)+(it.raw.length>14?'…':'')+'"');
          ctx.fillText(vtxt, rx0, y);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
          ctx.fillText(it.kind, rx0+188, y);
          if(s.step===1){ ctx.fillStyle=col; ctx.textAlign='right'; ctx.fillText(q?'정량':'정성', rx1, y); }
        });
        if(s.step===1){
          var by=rTop+18+ITEMS32.length*rh+18;
          var bw=(rx1-rx0-16)/2, bh=54, maxc=Math.max(QN32,TN32);
          ctx.fillStyle=BLU; ctx.fillRect(rx0, by+bh-(QN32/maxc)*bh, bw, (QN32/maxc)*bh);
          ctx.fillStyle=ROSE; ctx.fillRect(rx0+bw+16, by+bh-(TN32/maxc)*bh, bw, (TN32/maxc)*bh);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillStyle=BLU; ctx.fillText('정량 '+QN32+'건', rx0+bw/2, by+bh+16);
          ctx.fillStyle=ROSE; ctx.fillText('정성 '+TN32+'건', rx0+bw+16+bw/2, by+bh+16);
        }
      } else {
        ctx.fillText('지식경영 관점의 6가지 예', rx0, rTop);
        var rh2=26;
        TACIT32.forEach(function(t,i){
          var y=rTop+22+i*rh2;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(t.name, rx0, y);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=t.formal?GRN:GLD; ctx.textAlign='right';
          ctx.fillText(t.formal?'형식지':'암묵지', rx1, y);
        });
        var by2=rTop+22+TACIT32.length*rh2+14;
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('암묵지 '+TC32+'건', rx0, by2);
        ctx.fillStyle=GRN; ctx.fillText('형식지 '+EC32+'건', rx0+120, by2);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (분류 전 → 파이썬으로 정성·정량 실제 분류 → 암묵지·형식지)', true);
      E.big('데이터란 무엇인가', '데이터는 형태에 따라 언어·문자로 기술되는 <b>정성 데이터</b>와 수치·기호로 표시되는 <b>정량 데이터</b>로 나뉩니다. 10건의 원본 데이터를 파이썬으로 실제 분류해 보면(각 값이 숫자인지 isinstance로 판정) 정량 '+QN32+'건, 정성 '+TN32+'건입니다 — 정량 데이터는 DBMS에 저장·검색·분석하기 쉽지만, 정성 데이터(특히 형태가 정해지지 않은 비정형 데이터)는 다루는 데 상대적으로 많은 비용이 듭니다. 데이터는 또한 지식경영의 재료이기도 합니다. 자전거 타는 감각처럼 몸에 배어 겉으로 드러나지 않는 <b>암묵지</b>는 공유가 어렵고, 매뉴얼이나 DB처럼 형상화된 <b>형식지</b>는 전달·공유가 쉽습니다. 6가지 예를 분류하면 암묵지 '+TC32+'건, 형식지 '+EC32+'건 — 개인의 암묵지를 문서·숫자로 표출화하는 과정이 곧 데이터를 만드는 과정이며, 이것이 데이터가 지식 형성의 기초를 이루는 이유입니다.'); }
  },

  // ══════════ 2. DIKW 피라미드 ══════════
  { id:'bda32_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var labels=['data.py — 원본 수치','info.py — 가공(비교)','knowledge.py — 패턴','wisdom.py — 행동 규칙'];
      var codes=[
        [ {t:'price = {"A마트":[300,500,1200,3500,800],'}, {t:'         "B마트":[...], "C마트":[...]}', dim:true} ],
        [ {t:'for i in items:'}, {t:'    best[i] = min(stores, key=lambda s: price[s][i])', hl:'min'} ],
        [ {t:'from collections import Counter'}, {t:'Counter(best.values())  # 마트별 최저가 횟수', hl:'Counter'} ],
        [ {t:'lowest = [price[best[i]][i] for i in items]'}, {t:'total = sum(lowest)', hl:'sum'} ]
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, codes[s.step], labels[s.step], s.step===0?null:(codes[s.step].length-1));
      var stageName=['데이터(Data)','정보(Information)','지식(Knowledge)','지혜(Wisdom)'][s.step];
      var stageDesc=[
        '아직 비교하지 않은 순수한 수치입니다 — 3개 마트 × 5개 품목의 가격표',
        '항목마다 최저가·최저가 마트를 실제로 비교해 계산했습니다 — 의미가 붙었습니다',
        '어느 마트가 최저가를 가장 자주 차지하는지 실제로 세어 패턴을 찾았습니다',
        '패턴을 근거로 실제 행동 규칙(어디서 무엇을 살까)을 계산해 냈습니다'
      ][s.step];
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
      ctx.fillText(stageName, W*0.04, codeBot+22);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      wrapText(ctx, stageDesc, W*0.04, codeBot+42, W*0.42, 15);

      var rx0=W*0.49, rx1=W*0.965, rTop=28;
      var colw=(rx1-rx0-40)/3, rh=17;
      ctx.font='11px sans-serif'; ctx.textAlign='center';
      STORE32.forEach(function(name,si){ ctx.fillStyle=(s.step>=2&&si===BEST_STORE32)?GLD:TXT; ctx.fillText(name, rx0+40+colw*si+colw/2, rTop); });
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.fillText('품목', rx0, rTop);
      ITEMNAME32.forEach(function(name,ii){
        var y=rTop+18+ii*rh;
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(name, rx0, y);
        STORE32.forEach(function(sn,si){
          var v=PRICE32[si][ii];
          var isMin = (s.step>=1) && (si===MININFO32[ii].storeIdx);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillStyle = isMin ? GRN : DIM;
          ctx.textAlign='center';
          ctx.fillText(v, rx0+40+colw*si+colw/2, y);
        });
      });
      var by=rTop+18+ITEMNAME32.length*rh+16;
      if(s.step===2){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('마트별 최저가 획득 횟수', rx0, by);
        var bw=(rx1-rx0)/3*0.55, bh=48, maxc=Math.max.apply(null,CHEAPCOUNT32);
        STORE32.forEach(function(name,si){
          var xk=rx0+si*((rx1-rx0)/3)+((rx1-rx0)/3-bw)/2;
          var hh=maxc? (CHEAPCOUNT32[si]/maxc)*bh : 0;
          ctx.fillStyle=(si===BEST_STORE32)?GLD:BLU;
          ctx.fillRect(xk, by+18+bh-hh, bw, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=TXT;
          ctx.fillText(CHEAPCOUNT32[si]+'회', xk+bw/2, by+18+bh-hh-6);
          ctx.fillText(name, xk+bw/2, by+18+bh+14);
        });
      } else if(s.step===3){
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.fillText('품목별 최저가 조합 = '+TOTAL_OPT32+'원', rx0, by+16);
        ctx.fillStyle=BLU; ctx.fillText(STORE32[BEST_STORE32]+' 한 곳만 이용 = '+TOTAL_BEST32+'원', rx0, by+36);
        ctx.fillStyle=GLD; ctx.fillText('절약액 = '+SAVE32+'원', rx0, by+56);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '행동 규칙: 품목별로 가장 싼 마트에서 나눠 사면 '+STORE32[BEST_STORE32]+' 한 곳만 이용할 때보다 '+SAVE32+'원 아낍니다', rx0, by+78, rx1-rx0, 15);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 데이터 → 정보 → 지식 → 지혜, 한 걸음씩 실제로 계산', true);
      E.big('DIKW 피라미드 — 데이터에서 지혜로', '같은 가격표 3×5칸이 단계를 오르며 다른 것이 됩니다. <b>데이터</b>는 아직 비교하지 않은 순수한 수치(가격표 그 자체)입니다. <b>정보</b>는 품목마다 최저가를 실제로 비교해 의미를 붙인 것 — 연필은 '+MININFO32[0].price+'원에 '+STORE32[MININFO32[0].storeIdx]+'가 가장 쌉니다. <b>지식</b>은 그 비교를 5개 품목 전체로 반복해 패턴을 찾은 것 — '+STORE32[BEST_STORE32]+'가 '+CHEAPCOUNT32[BEST_STORE32]+'개 품목에서 최저가를 차지해 "대체로 저렴한 마트"라는 패턴이 드러납니다. <b>지혜</b>는 그 패턴 위에서 실제 행동 규칙을 계산해 낸 것 — 품목별로 나눠 사면 '+TOTAL_OPT32+'원, '+STORE32[BEST_STORE32]+' 한 곳만 이용하면 '+TOTAL_BEST32+'원이므로, "품목별로 나눠 사라"는 지혜는 '+SAVE32+'원의 실제 절약으로 이어집니다. 데이터베이스는 이 모든 단계의 출발점, 즉 1층의 데이터를 체계적으로 저장하는 곳입니다.'); }
  },

  // ══════════ 3. 데이터베이스의 통합성 — 중복을 실제로 세다 ══════════
  { id:'bda32_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(320+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        [ {t:'sales = [1,2,5,7]; hr = [1,3,5,8]; fin = [2,3,5,9]', hl:'sales'} ],
        [ {t:'total = len(sales)+len(hr)+len(fin)  # 전체 행 수', hl:'total'}, {t:'unique = len(set(sales)|set(hr)|set(fin))  # 통합 DB', hl:'set'} ],
        [ {t:"sales_db['id5'].phone = '010-9999-0005'  # DB: 1곳만 고침", hl:'phone'}, {t:'# hr·fin은 자동으로 같은 값을 봄(단일 사본)', dim:true} ]
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, codes[s.step], (s.step===0?'file_based.py':(s.step===1?'integrate.py':'db_update.py')), codes[s.step].length-1);
      var ry=codeBot+20;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){ ctx.fillStyle=TXT; ctx.fillText('부서 3곳이 각자 파일로 직원 명단을 보관합니다', W*0.04, ry); }
      else if(s.step===1){
        ctx.fillStyle=RED; ctx.fillText('파일 방식 전체 행 = '+TOTAL_ROWS32+'건', W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('통합 DB(중복 제거) = '+UNIQUE_N32+'건', W*0.04, ry+20);
        ctx.fillStyle=GLD; ctx.fillText('중복 저장된 레코드 = '+DUP_N32+'건', W*0.04, ry+40);
      } else {
        ctx.fillStyle=RED; ctx.fillText('파일 방식: 영업부만 갱신 → 나머지 '+STALE_COUNT32+'곳은 옛 값', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '박도윤 3곳 파일 모두 연락처를 갖고 있는데, 영업부 파일만 고치면 인사부·회계부는 그대로 "'+PHONE_BEFORE32+'"로 남습니다', W*0.04, ry+22, W*0.42, 15);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('통합 DB: 사본이 1개뿐 → 갱신 즉시 모두가 새 값을 봄', W*0.04, ry+62);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      var colw=(rx1-rx0-8)/3;
      ALLFILES32.forEach(function(f,fi){
        var x0=rx0+fi*colw;
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
        roundRect(ctx, x0, rTop, colw-6, 150, 8); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(f.label, x0+(colw-6)/2, rTop+16);
        f.rows.forEach(function(r,ri){
          var y=rTop+36+ri*22;
          var dup = (s.step>=1) && (Object.keys(UNIQUE_MAP32).filter(function(k){return UNIQUE_MAP32[k].id===r.id;}).length>0) && ALLFILES32.filter(function(ff){return ff.rows.some(function(rr){return rr.id===r.id;});}).length>1;
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillStyle = (s.step>=1 && dup) ? GLD : TXT;
          ctx.fillText('#'+r.id+' '+r.name, x0+(colw-6)/2, y);
          if(s.step===2 && r.id===5){
            ctx.font='11px ui-monospace,Menlo,monospace';
            ctx.fillStyle = (fi===0) ? GRN : RED;
            ctx.fillText(fi===0?PHONE_AFTER32:PHONE_BEFORE32, x0+(colw-6)/2, y+13);
          }
        });
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 파일 방식 → 중복 실제로 세기 → 갱신 문제 비교', true);
      E.big('데이터베이스는 통합된 데이터', '데이터베이스의 첫 번째 특징은 <b>통합(integrated data)</b> — 동일한 내용이 중복 저장되지 않는다는 것입니다. 영업부·인사부·회계부가 각자 파일로 직원 명단을 관리한다고 하면, 3개 파일의 행을 그냥 더한 값은 '+TOTAL_ROWS32+'건이지만, 실제로 서로 다른 사람만 세어 보면(id를 집합으로 합쳐 중복 제거) '+UNIQUE_N32+'명뿐입니다 — 즉 '+DUP_N32+'건이 여러 파일에 똑같이 중복 저장되어 있는 셈입니다. 이 중복은 <b>갱신 문제</b>로 이어집니다: 박도윤(#5)의 연락처를 영업부 파일에서만 고치면, 그 사람의 기록을 가진 나머지 '+STALE_COUNT32+'개 파일은 그대로 옛 값에 머뭅니다 — "지금 어떤 값이 맞는가"를 아무도 보장할 수 없습니다. 데이터베이스는 이런 자료를 한 곳에 통합해 사본을 하나만 두므로, 한 번의 갱신이 그 데이터를 쓰는 모든 사람에게 즉시 반영됩니다 — 이것이 데이터베이스가 <b>저장된 데이터·공용 데이터·변화되는 데이터</b>라는 나머지 세 특징과 함께 파일 방식보다 근본적으로 안전한 이유입니다.'); }
  },

  // ══════════ 4. OLTP와 OLAP — 같은 주문 데이터, 두 가지 쓰임 ══════════
  { id:'bda32_04',
    enter:function(E){ this.s={mode:0}; E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(this.s.mode?420:340,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codeOLTP=[
        {t:'df.loc[df.id==5, "amt"] = '+OLTP_NEW32+'  # 반품 처리', hl:'.loc'},
        {t:'# 트랜잭션 1건 — 한 행만 즉시 갱신', dim:true}
      ];
      var codeOLAP=[
        {t:'df.groupby("prod")["amt"].sum()', hl:'.groupby'},
        {t:'df.groupby("month")["amt"].sum()', hl:'.groupby'}
      ];
      var code = s.mode===0? codeOLTP : codeOLAP;
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, code, (s.mode===0?'oltp_update.py':'olap_query.py'), 0);
      var ry=codeBot+20;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.mode===0){
        ctx.fillStyle=GLD; ctx.fillText('OLTP — 거래를 즉시 처리(Online Transaction Processing)', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '주문 #'+OLTP_TARGET32.id+'의 금액을 '+OLTP_OLD32.toLocaleString()+'원 → '+OLTP_NEW32.toLocaleString()+'원으로 즉시 갱신합니다 — 영향받은 행 = 1건', W*0.04, ry+22, W*0.42, 15);
      } else {
        ctx.fillStyle=GLD; ctx.fillText('OLAP — 쌓인 데이터를 집계 분석(Online Analytical Processing)', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '전체 '+N_ORD32+'건을 상품별·월별로 실제 합산해 경향을 봅니다 — 어떤 행도 바뀌지 않습니다', W*0.04, ry+22, W*0.42, 15);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      if(s.mode===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('주문 원장(24건 중 갱신 대상 근처)', rx0, rTop);
        var rows=ORD32.slice(2,9);
        var rh=18;
        rows.forEach(function(o,i){
          var y=rTop+20+i*rh;
          var isT = o.id===OLTP_TARGET32.id;
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle= isT? GLD : TXT; ctx.textAlign='left';
          ctx.fillText('#'+o.id+'  '+PRODUCT32[o.prod], rx0, y);
          ctx.textAlign='right';
          ctx.fillStyle = isT? GRN : DIM;
          ctx.fillText((isT? OLTP_NEW32 : o.amt).toLocaleString()+'원', rx1, y);
          if(isT){ ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('← 원래 '+OLTP_OLD32.toLocaleString()+'원', rx0+150, y); }
        });
      } else {
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('상품별 매출 합계 (실제 groupby 합산)', rx0, rTop);
        var maxs=Math.max.apply(null,BY_PRODUCT32.map(function(b){return b.sum;}));
        var bh0=rTop+16, bw=(rx1-rx0)/4;
        BY_PRODUCT32.forEach(function(b,bi){
          var hh=(b.sum/maxs)*54;
          ctx.fillStyle=BLU; ctx.fillRect(rx0+bi*bw+8, bh0+64-hh, bw-16, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=TXT;
          ctx.fillText((b.sum/10000).toFixed(0)+'만', rx0+bi*bw+bw/2, bh0+64-hh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(b.name, rx0+bi*bw+bw/2, bh0+80);
        });
        var by2=bh0+104;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('월별 매출 합계', rx0, by2);
        var maxm=Math.max.apply(null,BY_MONTH32.map(function(b){return b.sum;}));
        BY_MONTH32.forEach(function(b,bi){
          var hh=(b.sum/maxm)*44;
          var bw2=(rx1-rx0)/3;
          ctx.fillStyle=PUR; ctx.fillRect(rx0+bi*bw2+10, by2+16+44-hh, bw2-20, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillStyle=TXT;
          ctx.fillText((b.sum/10000).toFixed(0)+'만', rx0+bi*bw2+bw2/2, by2+16+44-hh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(b.month+'월('+b.n+'건)', rx0+bi*bw2+bw2/2, by2+16+58);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = OLTP(행 하나 갱신) ↔ OLAP(전체 집계), 같은 데이터 다른 쓰임', true);
      E.big('DBMS와 SQL — OLTP와 OLAP', 'DBMS(데이터베이스 관리 시스템)로 만든 데이터베이스는 SQL로 저장·검색·집계합니다. 같은 주문 원장 '+N_ORD32+'건을 놓고 두 가지 전혀 다른 방식으로 씁니다. <b>OLTP</b>(온라인 거래처리)는 "지금 이 순간의 거래 하나"를 즉시 반영합니다 — 주문 #'+OLTP_TARGET32.id+'의 반품을 처리해 금액을 '+OLTP_OLD32.toLocaleString()+'원에서 '+OLTP_NEW32.toLocaleString()+'원으로 고치면 딱 1개 행만 바뀝니다. <b>OLAP</b>(온라인 분석처리)는 반대로 "쌓인 전체를 훑어 경향을 찾는" 집계 질의입니다 — 24건을 상품별로 실제 합산하면 '+BY_PRODUCT32[0].name+' 매출이 '+BY_PRODUCT32[0].sum.toLocaleString()+'원으로 가장 크고, 월별로 합산하면 3개월 매출이 각각 계산됩니다. OLTP는 행 하나를 빠르고 정확하게 바꾸는 데, OLAP는 수많은 행을 훑어 요약하는 데 최적화되어 있습니다 — 이 차이가 기업이 거래 시스템과 별도로 데이터웨어하우스(DW)를 두고 CRM·SCM·ERP·BI를 그 위에 얹는 이유입니다.'); }
  },

  // ══════════ 5. 데이터베이스는 사회의 바탕 시설 ══════════
  { id:'bda32_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(this.s.step?400:320,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'years = {"물류":1995,"지리":1995,"의료":1996,"교육":1997,"교통":1998}', hl:'years'},
        {t:'max(years.values()) - min(years.values())  # 격차', hl:'max'}
      ];
      var code1=[
        {t:'gps = [(0,0,0),(5,1.2,0.6),(10,2.9,0.4),(15,3.6,1.8),(20,5.1,2.0)]', hl:'gps'},
        {t:'dist = sum(hypot(x2-x1,y2-y1) for ... in zip(gps,gps[1:]))', hl:'hypot'},
        {t:'speed_kmh = dist / (time_min/60)', hl:'speed_kmh'}
      ];
      var codeBot = codePanel(E, W*0.04, 12, W*0.42, s.step===0?code0:code1, s.step===0?'infra_years.py':'gps_track.py', s.step===0?1:2);
      var ry=codeBot+20;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('가장 먼저 = '+EARLIEST32+'년(물류·지리)  ·  격차 = '+SPAN32+'년', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '1990년대 정부부처를 중심으로 물류·지리·의료·교육·교통 인프라 DB가 잇따라 구축되었습니다', W*0.04, ry+22, W*0.42, 15);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('총 이동거리 = '+GPS_DIST32.toFixed(2)+'km ('+GPS_TIME32+'분)', W*0.04, ry);
        ctx.fillStyle=BLU; ctx.fillText('평균 속도 = '+GPS_SPEED32.toFixed(1)+'km/h', W*0.04, ry+20);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        wrapText(ctx, '종합물류정보망의 "실시간 차량추적"은 이런 위치 기록을 DB에 계속 쌓아 계산합니다', W*0.04, ry+42, W*0.42, 15);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=30, rBot=230;
      if(s.step===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('부문별 인프라 DB 착수 연도', rx0, rTop-10);
        var sorted=DOMAIN32.slice().sort(function(a,b){return a.year-b.year;});
        var bx0=rx0+70, bx1=rx1, span=(LATEST32-EARLIEST32)||1;
        function yx(y){ return bx0+((y-EARLIEST32)/span)*(bx1-bx0-30); }
        sorted.forEach(function(d,i){
          var y=rTop+i*36;
          ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(d.name, rx0, y+14);
          ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=6; ctx.lineCap='round';
          ctx.beginPath(); ctx.moveTo(bx0, y+10); ctx.lineTo(yx(d.year), y+10); ctx.stroke();
          ctx.fillStyle = (d.year===EARLIEST32)?GLD:BLU;
          ctx.beginPath(); ctx.arc(yx(d.year), y+10, 5, 0, 7); ctx.fill();
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(d.year+'년', yx(d.year)+10, y+14);
        });
      } else {
        var px0=rx0+10, px1=rx1-10, pTop=rTop+6, pBot=rBot-10;
        frame32(px0,px1,pTop,pBot,'동쪽 이동(km)','북쪽 이동(km)')(ctx);
        function PX(v){ return px0+(v/5.5)*(px1-px0); }
        function PY(v){ return pBot-(v/2.4)*(pBot-pTop); }
        ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.beginPath();
        GPS32.forEach(function(p,i){ var x=PX(p.x),y=PY(p.y); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        GPS32.forEach(function(p,i){
          ctx.fillStyle= i===0?GLD:(i===GPS32.length-1?RED:GRN);
          ctx.beginPath(); ctx.arc(PX(p.x),PY(p.y),4,0,7); ctx.fill();
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText('t='+p.t+'분', PX(p.x), PY(p.y)-9);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 부문별 착수 연도 → 실시간 물류추적 GPS 실측', true);
      E.big('데이터베이스는 사회의 바탕 시설', '1990년대부터 정부부처를 중심으로 물류·지리·교통·의료·교육 등 사회 전반의 데이터베이스가 구축되었습니다. 착수 연도를 실제로 나열해 보면 물류·지리가 '+EARLIEST32+'년으로 가장 이르고, 가장 늦은 교통('+LATEST32+'년)까지 '+SPAN32+'년의 격차가 있습니다 — 이 순서가 "무엇이 사회 인프라로 먼저 인식됐는가"를 보여줍니다. 종합물류정보망이 내세운 대표 서비스가 <b>실시간 차량추적</b>입니다 — 차량의 위치를 시간마다 DB에 계속 기록하면, 두 지점 사이 거리를 실제로 계산할 수 있습니다. 5개 위치 기록으로 이동 궤적을 실측하면 총 '+GPS_DIST32.toFixed(2)+'km를 '+GPS_TIME32+'분에 이동해 평균 속도 '+GPS_SPEED32.toFixed(1)+'km/h가 나옵니다 — 이런 계산이 실시간으로 가능한 것 자체가 "위치 데이터가 DB로 통합·저장되어 즉시 조회 가능하다"는 전제 위에서만 성립합니다. 지리·교통·의료·교육 데이터베이스도 같은 원리로, 흩어진 기록을 한 곳에 모아 국민 누구나 조회할 수 있게 한 것이 사회기반구조로서 데이터베이스의 역할입니다.'); }
  }

  ];

  function wrapText(ctx, text, x, y, maxW, lh){
    var words=text.split(''), line='', ty=y;
    for(var i=0;i<words.length;i++){
      var test=line+words[i];
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line, x, ty); line=words[i]; ty+=lh; }
      else line=test;
    }
    if(line) ctx.fillText(line, x, ty);
  }

  if(window.Engine) window.Engine.addScenes(scenes);
})();
