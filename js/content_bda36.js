/* 빅데이터 분석 제36장 — 무엇을 분석할지 정하는 법
   (분석 기획 방향성 도출·분석 방법론·분석 과제 발굴·분석 프로젝트 관리)
   동작(behavior)만. 텍스트=content/bda36.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(사분면 배치·군집 결과·정확도·타당성 점수·우선순위 등)는 아래 고정
   데이터로부터 이 파일 로드 시 또는 draw 시 실제 계산(하드코딩 금지). 난수 없음(전 고정 배열/결정적 계산).
   ADP 필기 이론(계산할 수치가 거의 없는 서술형 지식) 특성상, 그럴듯한 가짜 통계 막대 대신
   작은 고정 예제를 실제로 분류·정렬·판정·시뮬레이션하는 "동작하는 모형"으로 구성한다. */
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

  function meanA(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function stdA(a,m){ var s=0; for(var i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/a.length); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  // ══════════ 36.1 데이터: 분석의 대상(What)·방법(How) 4유형 ══════════
  function classifyWH(t,m){
    if(t&&m) return {en:'Optimization', ko:'최적화'};
    if(t&&!m) return {en:'Solution', ko:'솔루션'};
    if(!t&&m) return {en:'Insight', ko:'통찰'};
    return {en:'Discovery', ko:'발견'};
  }
  var Q36_ITEMS=[
    {n:'설비 가동률 개선', t:true, m:true},
    {n:'물류 경로 최적화', t:true, m:true},
    {n:'이탈 예측 기법 선정', t:true, m:false},
    {n:'추천 알고리즘 선정', t:true, m:false},
    {n:'판매 로그 재분석', t:false, m:true},
    {n:'상담 이상신호 탐지', t:false, m:true},
    {n:'신사업 기회 탐색', t:false, m:false},
    {n:'외부데이터 결합 탐색', t:false, m:false}
  ];
  var FOCUS36_SEQ=[[true,true],[true,false],[false,true],[false,false]];

  // ══════════ 36.2 데이터: KDD 파이프라인(매장 14건 실제 처리) ══════════
  var RAW14=[
    {id:1, rev:82, ft:410},{id:2, rev:65, ft:null},{id:3, rev:120, ft:530},
    {id:4, rev:58, ft:290},{id:5, rev:410, ft:600},{id:6, rev:74, ft:null},
    {id:7, rev:95, ft:455},{id:8, rev:69, ft:310},{id:9, rev:88, ft:470},
    {id:10, rev:102, ft:null},{id:11, rev:77, ft:330},{id:12, rev:61, ft:275},
    {id:13, rev:110, ft:510},{id:14, rev:84, ft:420}
  ];
  var SEL14=RAW14.filter(function(r){ return r.ft!=null; });
  var SEL_M=meanA(SEL14.map(function(r){return r.rev;})), SEL_S=stdA(SEL14.map(function(r){return r.rev;}),SEL_M);
  SEL14.forEach(function(r){ r.z=(r.rev-SEL_M)/SEL_S; });
  var PRE10=SEL14.filter(function(r){ return Math.abs(r.z)<=2; });
  var OUT_ID=SEL14.filter(function(r){ return Math.abs(r.z)>2; }).map(function(r){return r.id;});
  var PRE_RM=meanA(PRE10.map(function(r){return r.rev;})), PRE_RS=stdA(PRE10.map(function(r){return r.rev;}),PRE_RM);
  var PRE_FM=meanA(PRE10.map(function(r){return r.ft;})), PRE_FS=stdA(PRE10.map(function(r){return r.ft;}),PRE_FM);
  PRE10.forEach(function(r){ r.revZ=(r.rev-PRE_RM)/PRE_RS; r.ftZ=(r.ft-PRE_FM)/PRE_FS; });
  function kmeans2D(X,Y,k,maxIter){
    var N=X.length;
    function d2(i,cx,cy){ var dx=X[i]-cx, dy=Y[i]-cy; return dx*dx+dy*dy; }
    var centers=[[X[0],Y[0]]];
    while(centers.length<k){
      var bestI=-1,bestD=-1;
      for(var i=0;i<N;i++){ var md=Infinity; centers.forEach(function(c){ var dx=X[i]-c[0],dy=Y[i]-c[1]; var dd=dx*dx+dy*dy; if(dd<md) md=dd; }); if(md>bestD){bestD=md;bestI=i;} }
      centers.push([X[bestI],Y[bestI]]);
    }
    var assign=new Array(N).fill(0);
    for(var it=0; it<maxIter; it++){
      var changed=false;
      for(var i=0;i<N;i++){ var bd=Infinity,bj=0; for(var j=0;j<k;j++){ var dd=d2(i,centers[j][0],centers[j][1]); if(dd<bd){bd=dd;bj=j;} } if(assign[i]!==bj){changed=true;assign[i]=bj;} }
      var sx=new Array(k).fill(0), sy=new Array(k).fill(0), cnt=new Array(k).fill(0);
      for(var i2=0;i2<N;i2++){ sx[assign[i2]]+=X[i2]; sy[assign[i2]]+=Y[i2]; cnt[assign[i2]]++; }
      for(var j2=0;j2<k;j2++){ if(cnt[j2]>0) centers[j2]=[sx[j2]/cnt[j2], sy[j2]/cnt[j2]]; }
      if(!changed && it>0) break;
    }
    var sse=0; for(var i3=0;i3<N;i3++) sse+=d2(i3,centers[assign[i3]][0],centers[assign[i3]][1]);
    return {centers:centers, assign:assign, sse:sse};
  }
  var KM36=kmeans2D(PRE10.map(function(r){return r.revZ;}), PRE10.map(function(r){return r.ftZ;}), 2, 50);
  PRE10.forEach(function(r,i){ r.cl=KM36.assign[i]; });
  var CL0=PRE10.filter(function(r){return r.cl===0;}), CL1=PRE10.filter(function(r){return r.cl===1;});
  var CL0_REV=meanA(CL0.map(function(r){return r.rev;})), CL1_REV=meanA(CL1.map(function(r){return r.rev;}));
  var CL0_FT=meanA(CL0.map(function(r){return r.ft;})), CL1_FT=meanA(CL1.map(function(r){return r.ft;}));

  // ══════════ 36.3 데이터: CRISP-DM 평가 피드백 루프 ══════════
  var DATA36_3=[
    {f1:3,f2:8,label:1},{f1:4,f2:2,label:0},{f1:5,f2:9,label:1},{f1:2,f2:1,label:0},
    {f1:6,f2:3,label:0},{f1:7,f2:8,label:1},{f1:3,f2:6,label:0},{f1:8,f2:6,label:1},
    {f1:4,f2:7,label:1},{f1:5,f2:1,label:0}
  ];
  function ruleV1(r){ return r.f1>=5?1:0; }
  function ruleV2(r){ return r.f2>=5?1:0; }
  function accOf(fn){ var c=0; DATA36_3.forEach(function(r){ if(fn(r)===r.label) c++; }); return c/DATA36_3.length; }
  var ACC_V1=accOf(ruleV1), ACC_V2=accOf(ruleV2), THRESH36=0.75;
  var F1_MEAN=meanA(DATA36_3.map(function(r){return r.f1;})), F2_MEAN=meanA(DATA36_3.map(function(r){return r.f2;}));
  var F1_MIN=Math.min.apply(null,DATA36_3.map(function(r){return r.f1;})), F1_MAX=Math.max.apply(null,DATA36_3.map(function(r){return r.f1;}));
  var F2_MIN=Math.min.apply(null,DATA36_3.map(function(r){return r.f2;})), F2_MAX=Math.max.apply(null,DATA36_3.map(function(r){return r.f2;}));

  // ══════════ 36.4 데이터: 하향식(BMC 후보 + 타당성 검토) ══════════
  var BMC_CATS=['업무','제품','고객','규제·감사','지원인프라'];
  var BMC_COL=[GRN,BLU,GLD,PUR,ORG];
  var BMC_CANDS=[
    {cat:0,n:'생산 공정 병목 탐지'},{cat:0,n:'재고 회전율 최적화'},
    {cat:1,n:'제품 기능 사용 패턴 분석'},{cat:1,n:'서비스 모니터링 지표 설계'},
    {cat:2,n:'콜센터 대기시간 최소화'},{cat:2,n:'영업점 위치 최적화'},
    {cat:3,n:'품질 이상징후 조기감지'},{cat:3,n:'환경 규제 대응 원가 분석'},
    {cat:4,n:'데이터웨어하우스 성능 최적화'},{cat:4,n:'적정 운영 인력 산정'}
  ];
  var SEL_CAND=BMC_CANDS[4];
  var FEAS36=[
    {n:'설비 고장 예측', da:4, tf:3, cost:80, ben:150},
    {n:'고객 이탈 방지', da:5, tf:4, cost:60, ben:200},
    {n:'신규 시장 수요예측', da:2, tf:2, cost:100, ben:180},
    {n:'콜센터 대기시간 최소화', da:4, tf:4, cost:40, ben:90},
    {n:'가격 최적화', da:3, tf:3, cost:70, ben:130},
    {n:'SNS 여론 모니터링', da:2, tf:3, cost:50, ben:70}
  ];
  FEAS36.forEach(function(c){ c.feas=c.da*c.tf; c.roi=c.ben-c.cost; c.total=c.feas+c.roi/10; });
  var FEAS36_SORTED=FEAS36.slice().sort(function(a,b){ return b.total-a.total; });
  var FEAS36_MAXTOTAL=Math.max.apply(null,FEAS36.map(function(c){return c.total;}));

  // ══════════ 36.5 데이터: 상향식(발산/수렴)+반복+정확도/정밀도 ══════════
  var IDEAS8=[
    {n:'구독형 요금제 신설', impact:4, feas:3},{n:'AI 챗봇 상담 도입', impact:5, feas:2},
    {n:'매장 무인화 확대', impact:3, feas:2},{n:'친환경 포장 전환', impact:2, feas:4},
    {n:'로열티 포인트 통합', impact:3, feas:4},{n:'해외 배송 자동화', impact:4, feas:2},
    {n:'사내 데이터 마켓플레이스', impact:2, feas:2},{n:'개인화 추천 강화', impact:5, feas:3}
  ];
  IDEAS8.forEach(function(x){ x.score=x.impact*x.feas; });
  var IDEAS8_SORTED=IDEAS8.slice().sort(function(a,b){ return b.score-a.score; });
  var IDEAS8_MAX=Math.max.apply(null,IDEAS8.map(function(x){return x.score;}));
  var UNCERT36=[0,1,2,3].map(function(i){ var u=100*Math.pow(0.55,i); return {iter:i, u:u, p:100-u}; });
  var PROJECT5=[
    {n:'범위(Scope)', d:'모델·데이터에 따라 범위가 자주 바뀜'},
    {n:'시간(Time)', d:'초기 의도 결과가 안 나와 반복 소요'},
    {n:'원가(Cost)', d:'데이터·인프라·인력 비용 사전 산정'},
    {n:'품질(Quality)', d:'정확도·재현성 기준을 사전 수립'},
    {n:'통합(Integration)', d:'여러 산출물·이해관계자 조정'}
  ];
  var DIM5=['Data Size','Data Complexity','Speed','Analytic Complexity','Accuracy&Precision'];
  var APSCEN=['HH','HL','LH','LL'];
  var APPTS={
    HH:[[0.05,0.03],[-0.04,0.06],[0.02,-0.05],[0.06,0.02],[-0.03,-0.04]],
    HL:[[0.3,0.2],[-0.25,-0.3],[0.15,-0.35],[-0.3,0.25],[0.28,-0.1]],
    LH:[[0.35,0.32],[0.38,0.28],[0.33,0.35],[0.36,0.3],[0.34,0.33]],
    LL:[[0.5,0.4],[0.2,0.6],[0.6,0.1],[0.3,0.55],[0.55,0.3]]
  };
  function apStat(pts){
    var cx=meanA(pts.map(function(p){return p[0];})), cy=meanA(pts.map(function(p){return p[1];}));
    var bias=Math.sqrt(cx*cx+cy*cy);
    var spread=meanA(pts.map(function(p){ var dx=p[0]-cx,dy=p[1]-cy; return Math.sqrt(dx*dx+dy*dy); }));
    return {acc:clamp(1-bias/0.5,0,1), prec:clamp(1-spread/0.4,0,1)};
  }
  var AP_LABEL={HH:'정확·정밀', HL:'정확·산만', LH:'편향·정밀', LL:'편향·산만'};

  var scenes = [

  // ══════════ 1. 분석 기획이란 무엇인가 — 대상·방법 4유형 ══════════
  { id:'bda36_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*50,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        'def classify(target_known, method_known):',
        '    if target_known and method_known:',
        "        return '최적화'",
        '    if target_known and not method_known:',
        "        return '솔루션'",
        '    if not target_known and method_known:',
        "        return '통찰'",
        "    return '발견'"
      ];
      var actMap=[[1,2],[3,4],[5,6],[7]];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'classify_topic.py', actMap[s.step]);
      var ft=FOCUS36_SEQ[s.step], fT=ft[0], fM=ft[1], fres=classifyWH(fT,fM);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('예시: 고객 이탈 방지 캠페인', W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('대상을 아는가: '+(fT?'예':'아니오')+'   방법을 아는가: '+(fM?'예':'아니오'), W*0.04, ry+20);
      ctx.fillStyle=ROSE; ctx.fillText('classify() 결과 = '+fres.ko+' ('+fres.en+')', W*0.04, ry+40);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('탭할 때마다 두 값이 바뀌고, 같은 함수가 실제로 다른 유형을 돌려줍니다', W*0.04, ry+60);

      var x0=W*0.49,x1=W*0.965,y0=44,y1=228, midx=(x0+x1)/2, midy=(y0+y1)/2;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.strokeRect(x0,y0,x1-x0,y1-y0);
      ctx.beginPath(); ctx.moveTo(midx,y0); ctx.lineTo(midx,y1); ctx.moveTo(x0,midy); ctx.lineTo(x1,midy); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('대상(What): 안다', (x0+midx)/2, y0-8); ctx.fillText('대상(What): 모른다', (midx+x1)/2, y0-8);
      ctx.save(); ctx.translate(x0-10, (y0+midy)/2); ctx.rotate(-Math.PI/2); ctx.fillText('방법: 안다',0,0); ctx.restore();
      ctx.save(); ctx.translate(x0-10, (midy+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('방법: 모른다',0,0); ctx.restore();

      function qCenter(t,m){ return [ t?(x0+midx)/2:(midx+x1)/2, m?(y0+midy)/2:(midy+y1)/2 ]; }
      var qLabels=[{t:true,m:true,lab:'최적화'},{t:false,m:true,lab:'통찰'},{t:true,m:false,lab:'솔루션'},{t:false,m:false,lab:'발견'}];
      qLabels.forEach(function(q){ var c=qCenter(q.t,q.m); ctx.font='11.5px sans-serif'; ctx.fillStyle=WHITE; ctx.fillText(q.lab, c[0], (q.m?y0:midy)+16); });

      var counts={Optimization:0,Solution:0,Insight:0,Discovery:0}, groups={};
      Q36_ITEMS.forEach(function(it,i){ var key=(it.t?'1':'0')+(it.m?'1':'0'); if(!groups[key]) groups[key]=[]; groups[key].push(i); counts[classifyWH(it.t,it.m).en]++; });
      Object.keys(groups).forEach(function(key){
        var t=key[0]==='1', m=key[1]==='1', c=qCenter(t,m), arr=groups[key];
        arr.forEach(function(idx,j){ var dx=(j-(arr.length-1)/2)*20; ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(c[0]+dx, c[1]+30, 4, 0, 7); ctx.fill(); });
      });
      counts[fres.en]++;
      var fc=qCenter(fT,fM);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(fc[0], fc[1]+34, 6, 0, 7); ctx.fill();
      ctx.strokeStyle=TXT; ctx.lineWidth=1.3; ctx.stroke();

      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=DIM;
      ctx.fillText('사분면별 과제 수(배경 8개+이번 예시) — 최적화 '+counts.Optimization+' · 솔루션 '+counts.Solution+' · 통찰 '+counts.Insight+' · 발견 '+counts.Discovery, x0, y1+20);

      E.tapHint(W/2, H*0.95, '화면 탭 = 이번 예시의 대상·방법 인지 여부를 바꿔 실제로 재분류', true);
      E.big('분석 기획이란 무엇인가', '분석 기획은 어떤 목표(Why)를 위해 어떤 데이터(What)를 어떤 방식(How)으로 분석할지 사전에 계획하는 작업입니다. 모든 분석 주제는 <b>대상(What)을 아는가</b>와 <b>방법(How)을 아는가</b> 두 축으로 실제 분류할 수 있습니다 — 둘 다 알면 <b>최적화</b>, 대상은 알지만 방법을 모르면 <b>솔루션</b>, 방법은 알지만 대상이 불명확하면 <b>통찰</b>, 둘 다 모르면 <b>발견</b>입니다. 지금 예시(고객 이탈 방지 캠페인)의 결과는 '+fres.ko+'인데, 실제 프로젝트에서는 하나의 주제도 진행하면서 이 네 유형을 넘나듭니다 — 최적화로 접근했다가 예상 밖의 발견으로 이어지는 일이 흔합니다. 배경의 8개 예시 과제도 같은 classify() 함수로 사분면에 실제 배치되어 있습니다.'); }
  },

  // ══════════ 2. 왜 방법론이 필요한가 — KDD 절차를 실제로 돌려본다 ══════════
  { id:'bda36_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        "raw = load_stores()            # 원본 14건",
        "sel = raw.dropna()             # ①선택(Selection)",
        "pre = sel[abs(zscore(sel.rev))<2]  # ②전처리",
        "pre['revZ']=zscore(pre.rev); pre['ftZ']=zscore(pre.ft)  # ③변환",
        "km = KMeans(2).fit(pre[['revZ','ftZ']])  # ④마이닝",
        "pre.groupby(km.labels_).rev.mean()  # ⑤해석/평가"
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'kdd_pipeline.py', s.step+1);
      var ry=codeBot+18;
      var stepNames=['①선택(Selection): 결측 없는 매장만 고른다','②전처리(Preprocessing): 이상값을 걸러낸다','③변환(Transformation): 평균0·표준편차1로 맞춘다','④데이터마이닝(Mining): 실제로 군집화한다','⑤해석/평가(Interpretation): 군집의 의미를 읽는다'];
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(stepNames[s.step], W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      if(s.step===0) ctx.fillText('원본 14건 중 방문객수 결측 '+ (RAW14.length-SEL14.length) +'건 제외 → '+SEL14.length+'건 선택', W*0.04, ry+20);
      if(s.step===1) ctx.fillText('선택된 '+SEL14.length+'건의 매출 평균 '+SEL_M.toFixed(1)+', 표준편차 '+SEL_S.toFixed(1)+' → id'+OUT_ID.join(',')+' z점수 2 초과로 제거', W*0.04, ry+20);
      if(s.step===2) ctx.fillText('남은 '+PRE10.length+'건의 매출·방문객수를 각각 z점수로 정규화(단위를 맞춤)', W*0.04, ry+20);
      if(s.step===3) ctx.fillText('정규화된 '+PRE10.length+'개 점을 K-평균(k=2)으로 실제 군집화, SSE='+KM36.sse.toFixed(2), W*0.04, ry+20);
      if(s.step===4){
        ctx.fillText('군집0('+CL0.length+'건) 평균매출 '+CL0_REV.toFixed(1)+'·평균방문 '+CL0_FT.toFixed(0), W*0.04, ry+20);
        ctx.fillText('군집1('+CL1.length+'건) 평균매출 '+CL1_REV.toFixed(1)+'·평균방문 '+CL1_FT.toFixed(0), W*0.04, ry+38);
      }

      var x0=W*0.49,x1=W*0.965,y0=30,y1=225;
      var revMax=Math.max.apply(null,RAW14.map(function(r){return r.rev;}))*1.05, ftMax=Math.max.apply(null,RAW14.filter(function(r){return r.ft!=null;}).map(function(r){return r.ft;}))*1.05;
      function PX(v){ return x0+(v/revMax)*(x1-x0); } function PY(v){ return y1-(v/ftMax)*(y1-y0); }

      if(s.step<=1){
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(x0,y1); ctx.lineTo(x1,y1); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('매출', (x0+x1)/2, y1+16);
        ctx.save(); ctx.translate(x0-20,(y0+y1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('방문객수',0,0); ctx.restore();
        RAW14.forEach(function(r){
          var included = r.ft!=null && (s.step===0 || Math.abs(r.z)<=2);
          var isOutlier = s.step===1 && r.ft!=null && Math.abs(r.z)>2;
          if(r.ft==null){ ctx.fillStyle='rgba(155,153,163,0.45)'; ctx.beginPath(); ctx.arc(PX(r.rev), y1-6, 3, 0, 7); ctx.fill(); return; }
          ctx.fillStyle = isOutlier?RED:(included?GRN:DIM);
          ctx.beginPath(); ctx.arc(PX(r.rev), PY(r.ft), isOutlier?5:3.4, 0, 7); ctx.fill();
          if(isOutlier){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(PX(r.rev)-6,PY(r.ft)-6); ctx.lineTo(PX(r.rev)+6,PY(r.ft)+6); ctx.moveTo(PX(r.rev)+6,PY(r.ft)-6); ctx.lineTo(PX(r.rev)-6,PY(r.ft)+6); ctx.stroke(); }
        });
      } else {
        var zx0=x0, zx1=x1, zy0=y0, zy1=y1, zR=2.4;
        function ZX(v){ return (zx0+zx1)/2 + (v/zR)*(zx1-zx0)/2; } function ZY(v){ return (zy0+zy1)/2 - (v/zR)*(zy1-zy0)/2; }
        ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo((zx0+zx1)/2,zy0); ctx.lineTo((zx0+zx1)/2,zy1); ctx.moveTo(zx0,(zy0+zy1)/2); ctx.lineTo(zx1,(zy0+zy1)/2); ctx.stroke();
        PRE10.forEach(function(r){
          var col = s.step<3 ? BLU : (r.cl===0?GRN:GLD);
          ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ZX(r.revZ), ZY(r.ftZ), 4, 0, 7); ctx.fill();
        });
        if(s.step>=3){ KM36.centers.forEach(function(c,ci){ var cx=ZX(c[0]), cy=ZY(c[1]); ctx.strokeStyle=ci===0?GRN:GLD; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(cx-7,cy-7); ctx.lineTo(cx+7,cy+7); ctx.moveTo(cx+7,cy-7); ctx.lineTo(cx-7,cy+7); ctx.stroke(); }); }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('(정규화된 z점수 좌표)', zx0+4, zy0+14);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = KDD의 다음 단계로 진행(선택→전처리→변환→마이닝→평가)', true);
      E.big('왜 방법론이 필요한가', '데이터 분석을 개인의 감이 아니라 반복 가능한 절차로 만든 것이 <b>분석 방법론</b>입니다. 큰 흐름은 하향식으로 순서대로 진행하는 <b>폭포수 모델</b>, 반복하며 점차 완성도를 높이는 <b>나선형 모델</b>, 일단 만들어보고 고쳐가는 <b>프로토타입 모델</b> 중 프로젝트 특성에 맞게 고릅니다. 그 절차를 데이터 마이닝 관점에서 구체화한 것이 1996년 페이야드(Fayyad)의 <b>KDD</b>입니다 — 선택→전처리→변환→마이닝→해석/평가의 9단계로, 각 단계의 산출물이 다음 단계의 입력이 됩니다. 지금 화면은 매장 14건을 실제로 이 절차에 흘려보낸 것입니다: 결측 매장 3곳을 뺀 '+SEL14.length+'건 중 매출이 비정상적으로 큰 매장(z점수 '+SEL14.filter(function(r){return Math.abs(r.z)>2;})[0].z.toFixed(2)+')을 제거해 '+PRE10.length+'건을 남기고, 정규화 후 실제로 군집화하면 저매출·저방문 '+CL0.length+'곳(평균매출 '+CL0_REV.toFixed(1)+')과 고매출·고방문 '+CL1.length+'곳(평균매출 '+CL1_REV.toFixed(1)+')이라는 두 유형이 드러납니다.'); }
  },

  // ══════════ 3. CRISP-DM — 평가에서 되돌아가는 반복을 실제로 본다 ══════════
  { id:'bda36_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%8; E.blip(360+this.s.step*30,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var stages=['업무 이해','데이터 이해','데이터 준비','모델링 v1','평가 v1(실패)','모델링 v2','평가 v2(통과)','전개'];
      var stageIdx=[0,1,2,3,4,3,4,5]; // 어느 CRISP-DM 박스를 강조할지(모델링/평가는 반복)
      var code=[
        "model_v1 = lambda r: r.f1>=5      # 특성 1개만 사용",
        "acc1 = accuracy(model_v1, data)   # = "+ACC_V1.toFixed(2),
        "if acc1 < 0.75:                   # 임계값 미달 → 되돌아감",
        "    model_v2 = lambda r: r.f2>=5  # 특성 교체",
        "    acc2 = accuracy(model_v2, data)  # = "+ACC_V2.toFixed(2)
      ];
      var actLine=[null,null,null,0,2,3,4,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'crisp_dm_loop.py', actLine);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('CRISP-DM: '+stages[s.step], W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      if(s.step===0) ctx.fillText('목표: 상담원 배정 만족도(1/0)를 예측할 수 있는가', W*0.04, ry+20);
      if(s.step===1) ctx.fillText('데이터 10건, 특성 f1 평균='+F1_MEAN.toFixed(1)+'(범위 '+F1_MIN+'~'+F1_MAX+'), f2 평균='+F2_MEAN.toFixed(1)+'(범위 '+F2_MIN+'~'+F2_MAX+')', W*0.04, ry+20);
      if(s.step===2) ctx.fillText('결측 없는 10건 그대로 사용(정제 완료) — 다음 모델링 단계로 전달', W*0.04, ry+20);
      if(s.step===3||s.step===5){ var acc=s.step===3?ACC_V1:ACC_V2; ctx.fillText('규칙: '+(s.step===3?'f1≥5 → 1':'f2≥5 → 1')+'  실제 정확도 = '+acc.toFixed(2)+' ('+Math.round(acc*10)+'/10)', W*0.04, ry+20); }
      if(s.step===4||s.step===6){ var acc2=s.step===4?ACC_V1:ACC_V2, pass=acc2>=THRESH36;
        ctx.fillStyle=pass?GRN:RED; ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillText('정확도 '+acc2.toFixed(2)+' vs 임계값 '+THRESH36+' → '+(pass?'통과, 전개로 진행':'미달, 모델링으로 되돌아감'), W*0.04, ry+20);
      }
      if(s.step===7) ctx.fillText('빅데이터분석방법론(5단계)로 보면: 업무·데이터이해=분석기획, 준비=데이터준비, 모델링·평가=데이터분석, 전개=시스템구현+평가및전개', W*0.04, ry+20);

      // 6개 단계 박스(2행 3열) + 되돌아가는 화살표
      var bx0=W*0.49, bw=(W*0.965-bx0)/3, by0=40, bh=44, gap=8;
      var boxNames=['업무이해','데이터이해','데이터준비','모델링','평가','전개'];
      for(var i=0;i<6;i++){
        var col=i%3, row=Math.floor(i/3);
        var x=bx0+col*bw, y=by0+row*(bh+34);
        var active = (i===stageIdx[s.step]);
        ctx.fillStyle = active?'rgba(255,122,184,0.28)':'rgba(255,255,255,0.05)';
        ctx.strokeStyle = active?ROSE:'rgba(255,255,255,0.25)'; ctx.lineWidth=active?2:1;
        roundRect(ctx, x+gap/2, y, bw-gap, bh, 7); ctx.fill(); ctx.stroke();
        ctx.font='11.5px sans-serif'; ctx.fillStyle=active?WHITE:DIM; ctx.textAlign='center';
        ctx.fillText(boxNames[i], x+bw/2, y+bh/2+4);
      }
      // 되돌아가는 화살표: 평가(row1,col1)→모델링(row1,col0)
      var loopOn = (s.step===4||s.step===5);
      var ex0=bx0+1*bw+bw/2, ey0=by0+(bh+34)+bh+10, ex1=bx0+0*bw+bw/2, ey1=by0+(bh+34)+bh+10;
      ctx.strokeStyle = loopOn?RED:'rgba(255,255,255,0.18)'; ctx.lineWidth=loopOn?2.2:1.2;
      ctx.beginPath(); ctx.moveTo(ex0,ey0); ctx.lineTo(ex0,ey0+14); ctx.lineTo(ex1,ey0+14); ctx.lineTo(ex1,ey1); ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(ex1,ey1); ctx.lineTo(ex1-4,ey1+7); ctx.lineTo(ex1+4,ey1+7); ctx.closePath(); ctx.fill();
      ctx.font='11px sans-serif'; ctx.fillStyle=loopOn?RED:DIM; ctx.textAlign='center';
      ctx.fillText('기준 미달 시 되돌아감', (ex0+ex1)/2, ey0+27);

      // 정확도 막대 + 임계선
      var accY0=by0+(bh+34)*2+10, accY1=accY0+40;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(bx0,accY1); ctx.lineTo(bx0+bw*3-gap,accY1); ctx.stroke();
      var curAcc = (s.step>=3)? ((s.step===3||s.step===4)?ACC_V1:ACC_V2) : 0;
      if(curAcc>0){
        var barW=(bx0+bw*3-gap-bx0)*curAcc;
        ctx.fillStyle = curAcc>=THRESH36?GRN:RED; ctx.fillRect(bx0, accY0, barW, accY1-accY0);
        var thX = bx0+(bx0+bw*3-gap-bx0)*THRESH36;
        ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(thX,accY0-4); ctx.lineTo(thX,accY1+4); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('임계 '+THRESH36, thX+3, accY0-6);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = CRISP-DM 다음 단계(평가 실패 시 실제로 모델링으로 되돌아감)', true);
      E.big('CRISP-DM — 평가에서 되돌아가는 반복', 'CRISP-DM은 업무 이해→데이터 이해→데이터 준비→모델링→평가→전개의 6단계로, 폭포수처럼 한 방향이 아니라 <b>단계 사이 피드백</b>이 실제로 일어납니다. 지금 화면은 특성 1개(f1)만 쓴 첫 모델의 정확도를 실제로 계산하면 '+ACC_V1.toFixed(2)+'로, 임계값 '+THRESH36+'에 못 미쳐 <b>평가 단계가 다시 모델링 단계로 되돌아갑니다</b>. 특성을 f2로 바꿔 다시 모델링하면 정확도가 '+ACC_V2.toFixed(2)+'로 실제로 올라 임계값을 통과하고, 그제서야 전개 단계로 넘어갑니다 — 숫자를 가짜로 채운 것이 아니라 10건의 데이터에 두 가지 규칙을 실제로 적용해 맞힌 개수를 센 것입니다. 이 6단계를 빅데이터 환경에 맞게 다시 쓴 것이 다음 장면에서 볼 <b>빅데이터 분석 방법론 5단계</b>(분석기획·데이터준비·데이터분석·시스템구현·평가및전개)입니다.'); }
  },

  // ══════════ 4. 하향식 접근 — 문제 탐색에서 타당성 검토까지 ══════════
  { id:'bda36_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codes=[
        ["for area in ['업무','제품','고객','규제감사','지원인프라']:", "    후보들[area] = 비즈니스모델캔버스에서_발굴(area)", "# 카테고리 5개 × 후보 2개 = 총 "+BMC_CANDS.length+"개"],
        ["선택후보 = '"+SEL_CAND.n+"'", "분석문제 = 비즈니스문제를_데이터문제로_변환(선택후보)"],
        ["역량 = 상담분석_전문인력_보유여부  # False", "시스템 = 기존_상담시스템_개선가능여부  # True", "방안 = 해결방안_매트릭스[역량][시스템]"],
        ["feas = 데이터확보가능성 * 기술적용가능성   # 곱", "roi  = 기대효과 - 투자비용                 # 차", "total = feas + roi/10                     # 합산", "과제.sort(key=lambda c: -c.total)"]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codes[s.step], 'top_down_'+(s.step+1)+'.py', s.step===3?3:null);
      var ry=codeBot+18;
      var stageNames=['가. 문제 탐색(Problem Discovery)','나. 문제 정의(Problem Definition)','다. 해결방안 탐색(Solution Search)','라. 타당성 검토(Feasibility Study)'];
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(stageNames[s.step], W*0.04, ry);

      var x0=W*0.49, x1=W*0.965, y0=32, y1=225;
      if(s.step===0){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('비즈니스 모델 캔버스 5개 영역에서 후보를 실제로 나열(카테고리당 2개)', x0, y0+2);
        var rh=(y1-y0-14)/5;
        BMC_CATS.forEach(function(cat,ci){
          var y=y0+18+ci*rh;
          ctx.fillStyle=BMC_COL[ci]; ctx.beginPath(); ctx.arc(x0+6,y+rh/2-6,4,0,7); ctx.fill();
          ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left'; ctx.fillText(cat, x0+16, y+rh/2-2);
          var cands=BMC_CANDS.filter(function(c){return c.cat===ci;});
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(cands.map(function(c){return c.n;}).join(' · '), x0+90, y+rh/2-2);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('실제 필터링: 총 '+BMC_CANDS.length+'개 후보 중 "고객" 카테고리만 세면 '+BMC_CANDS.filter(function(c){return c.cat===2;}).length+'개', x0, y1+16);
      } else if(s.step===1){
        ctx.font='11.5px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
        var lines=['비즈니스 문제:','"'+SEL_CAND.n+'"','','↓ 데이터 문제로 변환','','분석 문제:','"상담원별 대기시간 로그를 분석해','대기시간에 가장 영향을 주는','요인을 찾고, 배치를 최적화"'];
        lines.forEach(function(t,i){ ctx.fillStyle=(i===1||i>=6)?ROSE:(i===5?GLD:DIM); ctx.fillText(t, x0, y0+18+i*20); });
      } else if(s.step===2){
        var mx0=x0, mx1=x1, my0=y0+10, my1=y1-10, mmx=(mx0+mx1)/2, mmy=(my0+my1)/2;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(mx0,my0,mx1-mx0,my1-my0);
        ctx.beginPath(); ctx.moveTo(mmx,my0); ctx.lineTo(mmx,my1); ctx.moveTo(mx0,mmy); ctx.lineTo(mx1,mmy); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('역량 확보', (mx0+mmx)/2, my0-8); ctx.fillText('역량 미확보', (mmx+mx1)/2, my0-8);
        ctx.save(); ctx.translate(mx0-10,(my0+mmy)/2); ctx.rotate(-Math.PI/2); ctx.fillText('기존시스템 개선',0,0); ctx.restore();
        ctx.save(); ctx.translate(mx0-10,(mmy+my1)/2); ctx.rotate(-Math.PI/2); ctx.fillText('신규시스템 도입',0,0); ctx.restore();
        // 셀 중심: TL(확보+개선)=시스템고도화, TR(미확보+개선)=교육채용후활용, BL(확보+신규)=자체구축, BR(미확보+신규)=전문업체소싱
        var cellTL=[(mx0+mmx)/2,(my0+mmy)/2], cellTR=[(mmx+mx1)/2,(my0+mmy)/2], cellBL=[(mx0+mmx)/2,(mmy+my1)/2], cellBR=[(mmx+mx1)/2,(mmy+my1)/2];
        var labels=[['시스템 고도화',cellTL],['교육/채용 후 활용',cellTR],['자체 구축',cellBL],['전문업체 소싱',cellBR]];
        labels.forEach(function(L){ ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(L[0],L[1][0],L[1][1]); });
        // 이번 후보: 역량=false(미확보,오른쪽), 시스템=true(기존개선,위쪽) → TR 셀(교육/채용 후 활용)
        var capable=false, improve=true;
        var cell = capable? (improve?cellTL:cellBL) : (improve?cellTR:cellBR);
        ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(cell[0],cell[1],7,0,7); ctx.fill(); ctx.strokeStyle=TXT; ctx.lineWidth=1.3; ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('→ 이번 후보는 "교육/채용 후 활용"으로 실제 판정', mx0, my1+22);
      } else {
        var maxT=FEAS36_MAXTOTAL*1.08;
        var rh2=(y1-y0)/FEAS36.length;
        var barSpan=x1-x0-160-135; // 막대 뒤 수치 라벨 공간을 미리 확보(넘침 방지)
        FEAS36_SORTED.forEach(function(c,i){
          var y=y0+i*rh2, bw2=((c.total/maxT))*barSpan;
          ctx.fillStyle= i===0?GLD:BLU; ctx.fillRect(x0+150, y+2, bw2, rh2-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left';
          ctx.fillText((i+1)+'위 '+c.n, x0, y+rh2/2+2);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText('feas='+c.feas+' roi='+c.roi+' → '+c.total.toFixed(1), x0+150+bw2+6, y+rh2/2+2);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 하향식 4단계(탐색→정의→해결방안→타당성)로 진행', true);
      E.big('하향식 접근 — 문제 탐색에서 타당성 검토까지', '하향식(Top Down) 접근은 문제가 이미 주어진 상태에서 체계적으로 답을 찾아갑니다. <b>문제 탐색</b>은 비즈니스 모델 캔버스의 업무·제품·고객·규제감사·지원인프라 5개 영역을 빠짐없이 훑어 후보를 실제로 나열합니다(이번 예시 '+BMC_CANDS.length+'개). <b>문제 정의</b>는 그중 하나("'+SEL_CAND.n+'")를 골라 분석 가능한 데이터 문제로 바꿉니다. <b>해결방안 탐색</b>은 분석 역량 보유 여부와 시스템 활용 방식을 실제로 교차해 네 가지 중 하나("교육/채용 후 활용")로 판정합니다. <b>타당성 검토</b>는 6개 후보의 데이터확보가능성×기술적용가능성(곱)과 기대효과-투자비용(순편익)을 실제로 합산해 정렬하면, "'+FEAS36_SORTED[0].n+'"이 '+FEAS36_SORTED[0].total.toFixed(1)+'점으로 1위, "'+FEAS36_SORTED[FEAS36_SORTED.length-1].n+'"이 '+FEAS36_SORTED[FEAS36_SORTED.length-1].total.toFixed(1)+'점으로 꼴찌가 됩니다 — 점수를 매겨보기 전에는 직관과 다른 결과가 나올 수 있습니다.'); }
  },

  // ══════════ 5. 상향식 접근과 분석 프로젝트 관리 ══════════
  { id:'bda36_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*36,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var codeSets=[
        ["아이디어 = [발산_단계에서_나온_8개_후보]", "# 정답을 미리 정하지 않고 일단 늘어놓는다"],
        ["아이디어.sort(key=lambda x: -x.impact*x.feas)", "선정 = 아이디어[:3]   # 수렴: 점수 상위 3개"],
        ["uncertainty = 100 * 0.55 ** iteration", "success_prob = 100 - uncertainty"],
        ["PM_영역 = ['범위','시간','원가','품질','통합']"],
        ["accuracy  = 1 - 평균오차(중심에서)/기준", "precision = 1 - 평균산포(자기중심에서)/기준"]
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, codeSets[s.step], ['ideate.py','converge.py','prototype_loop.py','pm_areas.py','acc_precision.py'][s.step], s.step===2?0:(s.step===4?[0,1]:null));
      var ry=codeBot+18;
      var titles=['상향식: 발산(Diverge)','상향식: 수렴(Converge)','프로토타이핑: 반복할수록 불확실성 감소','분석 프로젝트 관리 5영역','데이터 분석 특유 관리항목 — 정확도·정밀도'];
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(titles[s.step], W*0.04, ry);

      var x0=W*0.49, x1=W*0.965, y0=32, y1=228;
      if(s.step===0||s.step===1){
        var list = s.step===0? IDEAS8 : IDEAS8_SORTED;
        var rh=(y1-y0)/list.length;
        list.forEach(function(x,i){
          var y=y0+i*rh, bw=(x.score/IDEAS8_MAX)*(x1-x0-140);
          var top3 = s.step===1 && i<3;
          ctx.fillStyle= s.step===1 ? (top3?GRN:'rgba(122,184,255,0.35)') : BLU;
          ctx.fillRect(x0+130, y+2, bw, rh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle= (s.step===1&&!top3)?DIM:WHITE; ctx.textAlign='left';
          ctx.fillText(x.n, x0, y+rh/2+2);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText(''+x.score, x0+130+bw+6, y+rh/2+2);
        });
      } else if(s.step===2){
        var bw2=(x1-x0)/UNCERT36.length;
        UNCERT36.forEach(function(u,i){
          var x=x0+i*bw2, hh=(u.u/100)*(y1-y0);
          ctx.fillStyle=RED; ctx.globalAlpha=0.75; ctx.fillRect(x+8,y1-hh,bw2-30,hh); ctx.globalAlpha=1;
          var hp=(u.p/100)*(y1-y0);
          ctx.fillStyle=GRN; ctx.fillRect(x+bw2-22,y1-hp,14,hp);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(i+1+'회', x+bw2/2-6, y1+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED; ctx.fillText(u.u.toFixed(0)+'%', x+8+(bw2-30)/2, y1-hh-6);
          ctx.fillStyle=GRN; ctx.fillText(u.p.toFixed(0)+'%', x+bw2-15, y1-hp-6);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('빨강=불확실성  초록=성공가능성', x0, y0+2);
      } else if(s.step===3){
        var rh3=(y1-y0)/PROJECT5.length;
        PROJECT5.forEach(function(p,i){
          var y=y0+i*rh3;
          ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(x0+6,y+rh3/2,4,0,7); ctx.fill();
          ctx.font='11.5px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='left'; ctx.fillText(p.n, x0+16, y+rh3/2+4);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(p.d, x0+130, y+rh3/2+4);
        });
      } else {
        var cw=(x1-x0)/2, ch=(y1-y0)/2, R=Math.min(cw,ch)*0.34;
        APSCEN.forEach(function(k,i){
          var col=i%2, row=Math.floor(i/2);
          var cx=x0+col*cw+cw/2, cy=y0+row*ch+ch/2;
          ctx.strokeStyle='rgba(255,255,255,0.25)';
          [1,0.66,0.33].forEach(function(f){ ctx.beginPath(); ctx.arc(cx,cy,R*f,0,7); ctx.stroke(); });
          var st=apStat(APPTS[k]);
          APPTS[k].forEach(function(p){ ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(cx+p[0]*R*1.4, cy+p[1]*R*1.4, 2.6, 0, 7); ctx.fill(); });
          ctx.font='11px sans-serif'; ctx.fillStyle=WHITE; ctx.textAlign='center';
          ctx.fillText(AP_LABEL[k], cx, y0+row*ch+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
          ctx.fillText('acc='+st.acc.toFixed(2)+' prec='+st.prec.toFixed(2), cx, y0+row*ch+ch-6);
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 발산→수렴→반복→관리영역→정확도/정밀도 순으로 진행', true);
      E.big('상향식 접근과 분석 프로젝트 관리', '상향식(Bottom Up)은 정답을 미리 정하지 않고 데이터를 보며 문제를 재정의합니다. 디자인 싱킹의 <b>발산</b> 단계에서 아이디어 '+IDEAS8.length+'개를 실제로 늘어놓고, <b>수렴</b> 단계에서 영향력×실행가능성 점수를 실제로 곱해 정렬하면 "'+IDEAS8_SORTED[0].n+'"이 '+IDEAS8_SORTED[0].score+'점으로 1위가 됩니다. <b>프로토타이핑</b>은 가설→실험→테스트→통찰을 반복하는데, 반복할수록 불확실성이 실제로 줄어듭니다(1회 후 '+UNCERT36[1].u.toFixed(0)+'%, 3회 후 '+UNCERT36[3].u.toFixed(0)+'%). 분석 프로젝트는 일반 IT 프로젝트의 <b>범위·시간·원가·품질·통합</b> 5영역 관리에 더해, 데이터 특유의 5가지 차원(Data Size·Complexity·Speed·Analytic Complexity·<b>Accuracy&Precision</b>)을 함께 봐야 합니다. 정확도와 정밀도는 서로 다른 개념입니다 — 다트 좌표를 실제로 계산해 보면 "정확·산만"(acc='+apStat(APPTS.HL).acc.toFixed(2)+', prec='+apStat(APPTS.HL).prec.toFixed(2)+')처럼 한쪽만 높은 경우가 실제로 존재합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
