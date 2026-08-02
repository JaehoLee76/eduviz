/* 빅데이터 분석 제52장 — 과목 IV 총정리: 통계 이론의 바닥 (제1종·제2종 오류·검정력·신뢰구간·표본추출 4종·확률분포 갤러리·비모수 검정)
   동작(behavior)만. 텍스트=content/bda52.json. 엔진 js/engine.js + js/bda_map.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(α·β·검정력·신뢰구간·포함개수·표본평균·pmf/pdf값·F통계량 등)는 이 파일 로드/프레임마다
   실제 계산(하드코딩 금지). 정규분포 누적확률은 오차함수(erf) 근사로, t·카이제곱·F분포는 랜초스 lgamma +
   심프슨 수치적분으로 직접 구한다. 난수 절대 금지 — 표본은 고정 시드 LCG로 결정적으로 추출한다. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', ORG='#ffb27a', PUR='#c79dff';

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

  // ── 수치 도구(골든룰의 심장) ──────────────────────────────────────────
  function erf(x){
    var sign=x<0?-1:1; x=Math.abs(x);
    var a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    var t=1/(1+p*x);
    var y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return sign*y;
  }
  function Phi(z){ return 0.5*(1+erf(z/Math.SQRT2)); }
  function ppfNorm(q){ var lo=-8,hi=8,i; for(i=0;i<50;i++){ var m=(lo+hi)/2; if(Phi(m)<q) lo=m; else hi=m; } return (lo+hi)/2; }

  function simpson(f,a,b,n){ if(n%2)n++; var h=(b-a)/n, s=f(a)+f(b), i; for(i=1;i<n;i++) s+=f(a+i*h)*((i%2)?4:2); return s*h/3; }

  var LG=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
          12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  function lgamma(x){
    if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);
    x-=1; var a=0.99999999999980993, t=x+7.5, i;
    for(i=0;i<8;i++) a+=LG[i]/(x+i+1);
    return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
  }
  function tpdf(x,df){ var lg=lgamma((df+1)/2)-lgamma(df/2)-0.5*Math.log(df*Math.PI); return Math.exp(lg-((df+1)/2)*Math.log(1+x*x/df)); }
  function tsf(t,df){ return simpson(function(x){return tpdf(x,df);}, t, t+80, 400); }
  function tppf(df,conf){ var target=(1-conf)/2, lo=0,hi=30,i; for(i=0;i<40;i++){ var m=(lo+hi)/2; if(tsf(m,df)>target) lo=m; else hi=m; } return (lo+hi)/2; }
  function chi2pdf(x,k){ if(x<=0) return 0; var lg=lgamma(k/2); return Math.exp((k/2-1)*Math.log(x)-x/2-(k/2)*Math.LN2-lg); }
  function fpdf(x,d1,d2){ if(x<=0) return 0;
    var lg=lgamma((d1+d2)/2)-lgamma(d1/2)-lgamma(d2/2);
    var num=(d1/2)*Math.log(d1)+(d2/2)*Math.log(d2)+(d1/2-1)*Math.log(x);
    var den=((d1+d2)/2)*Math.log(d2+d1*x);
    return Math.exp(lg+num-den);
  }
  function fsf(x,d1,d2){ return simpson(function(t){return fpdf(t,d1,d2);}, x, x+300, 600); }

  function normPdf(x,mu,sg){ var z=(x-mu)/sg; return Math.exp(-z*z/2)/(sg*Math.sqrt(2*Math.PI)); }

  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sdA(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m); return Math.sqrt(s/(a.length-(ddof||0))); }
  function fact(n){ var r=1,i; for(i=2;i<=n;i++) r*=i; return r; }
  function comb(n,k){ return fact(n)/(fact(k)*fact(n-k)); }
  function binomPmf(n,p){ var ys=[],i, p0=Math.exp(n*Math.log(1-p)); ys.push(p0);
    for(i=0;i<n;i++){ ys.push(ys[i]*(n-i)/(i+1)*(p/(1-p))); } return ys; }
  function poisPmf(lam,kmax){ var ys=[Math.exp(-lam)],k; for(k=1;k<=kmax;k++) ys.push(ys[k-1]*lam/k); return ys; }

  // ══════════ 52.4 공용 데이터: 매장 48개 · 지역(군집) 8개 · 매출등급(층) 4개 ══════════
  var NPOP=48, NCL=8, CLSZ=6;
  var CLMEAN=[30,45,38,62,50,70,42,58]; // 지역별 실제 다른 평균 판매액(만원) — 군집 이질성 설계
  var SALEY=[], CLID=[];
  (function(){
    var rng=LCG(909090), c,j;
    for(c=0;c<NCL;c++) for(j=0;j<CLSZ;j++){ SALEY.push(+(CLMEAN[c]+(rng()-0.5)*6).toFixed(2)); CLID.push(c); }
  })();
  var MU_SALE=mean(SALEY);
  var SALE_ORDER=SALEY.map(function(v,i){return i;}).sort(function(a,b){return SALEY[a]-SALEY[b];});
  var STRID=new Array(NPOP);
  (function(){ var q,k; for(q=0;q<4;q++) for(k=0;k<12;k++) STRID[SALE_ORDER[q*12+k]]=q; })();

  function simpleRandomIdx(n,seed){ var rng=LCG(seed), idxs=[]; while(idxs.length<n){ var idx=Math.floor(rng()*NPOP); if(idxs.indexOf(idx)<0) idxs.push(idx); } return idxs; }
  function systematicIdx(n,seed){ var k=Math.max(1,Math.round(NPOP/n)), rng=LCG(seed), start=Math.floor(rng()*k), out=[],i; for(i=start;i<NPOP&&out.length<n;i+=k) out.push(i); return out; }
  function clusterIdx(n,seed){ var kcl=Math.max(1,Math.round(n/CLSZ)), rng=LCG(seed), pool=[0,1,2,3,4,5,6,7], pick=[];
    while(pick.length<kcl && pool.length){ var pi=Math.floor(rng()*pool.length); pick.push(pool[pi]); pool.splice(pi,1); }
    var out=[],i; for(i=0;i<NPOP;i++) if(pick.indexOf(CLID[i])>=0) out.push(i); return out; }
  function stratifiedIdx(n,seed){ var per=Math.round(n/4), rng=LCG(seed), out=[],s;
    for(s=0;s<4;s++){ var members=[],i; for(i=0;i<NPOP;i++) if(STRID[i]===s) members.push(i);
      var chosen=[]; while(chosen.length<per && members.length){ var pi=Math.floor(rng()*members.length); chosen.push(members[pi]); members.splice(pi,1); }
      out=out.concat(chosen); }
    return out; }
  var METHOD_FN={simple:simpleRandomIdx, sys:systematicIdx, cluster:clusterIdx, stratified:stratifiedIdx};
  var METHOD_NAME={simple:'단순랜덤', sys:'계통추출', cluster:'집락추출', stratified:'층화추출'};
  var METHOD_COL={simple:BLU, sys:GLD, cluster:RED, stratified:GRN};
  function methodStats(method,n,M){
    var ests=[],i; for(i=0;i<M;i++){ var idxs=METHOD_FN[method](n, 1000+i*97+n); var vals=idxs.map(function(ix){return SALEY[ix];}); ests.push(mean(vals)); }
    var m=mean(ests), s=sdA(ests,1);
    return {ests:ests, m:m, s:s, bias:m-MU_SALE};
  }

  // ══════════ 52.3 공용 데이터: 성인 신장(cm) 가상 모집단 300명 ══════════
  var NPOP3=300, MU0_H=170, SIG0_H=8;
  var HPOP=[];
  (function(){ var rng=LCG(20260802), i; for(i=0;i<NPOP3;i++){ var u=Math.min(0.9999,Math.max(0.0001,rng())); HPOP.push(+(MU0_H+SIG0_H*ppfNorm(u)).toFixed(2)); } })();
  var MU_H=mean(HPOP), SIG_H=sdA(HPOP,0);
  function heightSample(n,seed){ var rng=LCG(seed), out=[],j; for(j=0;j<n;j++) out.push(HPOP[Math.floor(rng()*NPOP3)]); return out; }

  // ══════════ 52.5 ANOVA 토이 예시(F검정 실계산) — 3개 그룹, n=5씩 ══════════
  var ANOVA_G=[[48,51,50,49,52],[55,58,54,57,56],[42,45,44,41,43]];
  var ANOVA_MEANS=ANOVA_G.map(mean), ANOVA_ALL=ANOVA_G[0].concat(ANOVA_G[1],ANOVA_G[2]);
  var ANOVA_GRAND=mean(ANOVA_ALL);
  var ANOVA_SSB=0; ANOVA_G.forEach(function(g,i){ ANOVA_SSB+=g.length*Math.pow(ANOVA_MEANS[i]-ANOVA_GRAND,2); });
  var ANOVA_SSW=0; ANOVA_G.forEach(function(g,i){ g.forEach(function(v){ ANOVA_SSW+=Math.pow(v-ANOVA_MEANS[i],2); }); });
  var ANOVA_DFB=2, ANOVA_DFW=12, ANOVA_MSB=ANOVA_SSB/ANOVA_DFB, ANOVA_MSW=ANOVA_SSW/ANOVA_DFW, ANOVA_F=ANOVA_MSB/ANOVA_MSW;
  var ANOVA_P=fsf(ANOVA_F, ANOVA_DFB, ANOVA_DFW);

  // ══════════ 52.1 확률 공리 예시: 주사위 2개 ══════════
  var DICE=[]; (function(){ var d1,d2; for(d1=1;d1<=6;d1++) for(d2=1;d2<=6;d2++) DICE.push(d1+d2); })();
  var DICE_N=DICE.length, DICE_E=DICE.filter(function(v){return v===7;}).length, DICE_P=DICE_E/DICE_N;

  function frame(ctx,px0,px1,pTop,pBot,xlab){
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
    if(xlab){ ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(xlab,(px0+px1)/2,pBot+18); }
  }

  var scenes = [

  // ══════════ 1. 통계 추론의 지도 ══════════
  { id:'bda52_01',
    enter:function(E){ this.s={page:0}; E.setOn([]); },
    tap:function(E){ this.s.page=(this.s.page+1)%4; },
    draw:function(E){ var s=this.s;
      var PAGES=[
        { title:'통계학이 하는 두 가지 일 — 요약인가, 짐작인가', sub:'(1/4) 화면 탭 = 다음 화면',
          cols:[
            { t:'기술통계', c:GRN, items:[
                {t:'평균·중앙값·표준편차', s:'7장에서 실제 계산 — 대푯값·흩어짐'},
                {t:'사분위수', s:'7장 — 위치를 요약'},
                {t:'막대·원·꺾은선그래프', s:'38·39장 — 그림으로 요약'},
                {t:'자료 자체만 요약', s:'모집단을 짐작하지 않음'} ] },
            { t:'추론통계', c:BLU, items:[
                {t:'추정(estimation)', s:'모수가 얼마일지 짐작 — 52.3'},
                {t:'가설검정(hypothesis test)', s:'가설의 채택여부 결정 — 7장·52.2'},
                {t:'예측(forecasting)', s:'미래의 불확실성 대응 — 15~17장'},
                {t:'표본에서 모집단으로', s:'귀납적 도약, 오류 가능성 동반'} ] },
            { t:'핵심 어휘', c:GLD, items:[
                {t:'모집단(population)', s:'알고자 하는 전체'},
                {t:'표본(sample)', s:'실제로 관측한 일부'},
                {t:'모수(parameter)', s:'모집단의 값 — 보통 모름'},
                {t:'통계량(statistic)', s:'표본에서 계산한 값'} ] } ],
          foot:'기술통계는 요약, 추론통계는 짐작 — 표본을 넘어 모집단까지 나아가는가가 기준입니다' },
        { title:'자료의 종류 — 척도 네 가지', sub:'(2/4) 척도마다 허용되는 연산이 다릅니다 ★출제 포인트',
          cols:[
            { t:'질적 자료', c:ROSE, items:[
                {t:'명목척도', s:'분류만 — 성별, 출생지'},
                {t:'서열척도', s:'순서만 — 선호도 5단계'} ] },
            { t:'양적 자료', c:BLU, items:[
                {t:'구간척도', s:'차이는 뜻 있음, 절대 0 없음 — 온도'},
                {t:'비율척도', s:'절대 0 있음 — 무게·소득·나이'} ] },
            { t:'척도별 허용 연산', c:GLD, items:[
                {t:'명목: =, ≠', s:'같다·다르다만'},
                {t:'서열: <, >', s:'순서 비교까지'},
                {t:'구간: +, −', s:'차이 계산까지(비율은 무의미)'},
                {t:'비율: ×, ÷', s:'모든 사칙연산'} ] } ],
          foot:'평균은 구간·비율척도라야 뜻이 있습니다 — 명목척도(성별 1/2코드)의 평균은 계산은 되어도 의미가 없습니다' },
        { title:'확률의 언어와 세 공리', sub:'(3/4) 조건부확률·독립·결합분포',
          cols:[
            { t:'확률의 언어', c:ROSE, items:[
                {t:'표본공간 Ω', s:'나올 수 있는 모든 결과'},
                {t:'사건(event)', s:'Ω의 부분집합'},
                {t:'근원사건', s:'원소 하나로만 된 사건'},
                {t:'P(E)=n(E)/n(Ω)', s:'근원사건이 등확률일 때'} ] },
            { t:'확률의 세 공리', c:BLU, items:[
                {t:'0 ≤ P(E) ≤ 1', s:'공리1'},
                {t:'P(Ω) = 1', s:'공리2 — 전체는 반드시 일어남'},
                {t:'배반사건은 확률을 더함', s:'공리3 — P(A∪B)=P(A)+P(B)'} ] },
            { t:'조건부확률·독립·결합분포', c:GLD, items:[
                {t:'P(B|A)=P(A∩B)/P(A)', s:'A가 일어난 조건에서 B'},
                {t:'독립: P(A∩B)=P(A)P(B)', s:'그러면 P(B|A)=P(B)'},
                {t:'결합확률분포', s:'두 확률변수를 함께 — P(X=xi,Y=yj)'} ] } ],
          foot:'예: 주사위 2개 — Ω='+DICE_N+'가지, 합이 7인 사건 E='+DICE_E+'가지 → P(E)='+DICE_E+'/'+DICE_N+'='+DICE_P.toFixed(3)+'(공리1 실제로 성립)' },
        { title:'확률변수의 요약값과 점추정의 재료', sub:'(4/4) 다음 장면(52.2·52.3)의 밑감',
          cols:[
            { t:'기댓값과 분산', c:ROSE, items:[
                {t:'E(X)=Σx·f(x)', s:'이산형 — 무게중심'},
                {t:'E(X)=∫x·f(x)dx', s:'연속형'},
                {t:'Var(X)=E[(X−μ)²]', s:'흩어진 정도, 수학 트랙 14장'} ] },
            { t:'백분위수', c:BLU, items:[
                {t:'제q백분위수', s:'P(X≤x_q)=q/100 인 x_q'},
                {t:'중앙값=제50백분위수', s:'7장 중앙값이 그 특수한 예'},
                {t:'사분위수=25·50·75', s:'7장에서 이미 실계산'} ] },
            { t:'점추정의 재료', c:GLD, items:[
                {t:'표본평균 x̄', s:'모평균 μ의 추정량 — 52.3'},
                {t:'표본분산 s²(n−1로 나눔)', s:'모분산 σ²의 추정량'},
                {t:'추정량 하나로는 부족', s:'52.3에서 구간으로 넓힙니다'} ] } ],
          foot:'점 하나(점추정)만으로는 얼마나 정확한지 알 수 없습니다 — 다음 장면에서 구간으로 넓혀 봅니다' }
      ];
      var P=PAGES[s.page];
      window.BdaMap(E, { title:P.title, sub:P.sub, cols:P.cols, focus:-1, foot:P.foot });
      E.tapHint(E.W/2, E.H*0.95, '화면 탭 = 다음 화면', true);
    }
  },

  // ══════════ 2. 제1종·제2종 오류와 검정력 ══════════
  { id:'bda52_02',
    enter:function(E){ var self=this; this.s={c:55, delta:8, n:16};
      E.controls('<div class="ctrl"><label>기각역 경계 c(kg)</label><input type="range" id="b521c" min="42" max="78" step="0.5" value="55"><output id="b521co">55.0</output></div>'
               +'<div class="ctrl"><label>효과크기 Δ=μ1−μ0(kg)</label><input type="range" id="b521d" min="2" max="20" step="1" value="8"><output id="b521do">8</output></div>'
               +'<div class="ctrl"><label>표본수 n</label><input type="range" id="b521n" min="4" max="64" step="4" value="16"><output id="b521no">16</output></div>');
      E.bind('#b521c','input',function(e){ self.s.c=+e.target.value; document.getElementById('b521co').textContent=self.s.c.toFixed(1); });
      E.bind('#b521d','input',function(e){ self.s.delta=+e.target.value; document.getElementById('b521do').textContent=self.s.delta; });
      E.bind('#b521n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b521no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var mu0=50, sigma=10, n=s.n, c=s.c, delta=s.delta, mu1=mu0+delta;
      var SE=sigma/Math.sqrt(n);
      var alpha=1-Phi((c-mu0)/SE);
      var beta=Phi((c-mu1)/SE);
      var power=1-beta;
      var c05=mu0+ppfNorm(0.95)*SE;

      var code=[
        {t:'se = sigma / n**0.5', hl:'sigma'},
        {t:'alpha = 1 - norm.cdf(c, mu0, se)', hl:'norm.cdf'},
        {t:'beta  = norm.cdf(c, mu1, se)', hl:'norm.cdf'},
        {t:'power = 1 - beta', hl:'power'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'type_error.py', null);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('H0: μ=μ0='+mu0+'  ·  H1: μ=μ1='+mu1, W*0.04, ry);
      ctx.fillStyle=DIM; ctx.fillText('n='+n+' → SE=σ/√n='+SE.toFixed(3), W*0.04, ry+18);
      ctx.fillStyle=RED; ctx.fillText('α(제1종 오류) = 1−Φ((c−μ0)/SE) = '+alpha.toFixed(4), W*0.04, ry+40);
      ctx.fillStyle=ORG; ctx.fillText('β(제2종 오류) = Φ((c−μ1)/SE)   = '+beta.toFixed(4), W*0.04, ry+58);
      ctx.fillStyle=GRN; ctx.fillText('검정력 1−β            = '+power.toFixed(4), W*0.04, ry+76);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('참고: α를 정확히 0.05로 고정하려면 c='+c05.toFixed(1)+'kg (관행: α를 먼저 고정 후 기각역 산출)', W*0.04, ry+100);
      ctx.fillText('c를 오른쪽으로 밀면 α↓·β↑, n을 늘리면(같은 c) 둘 다 함께 줄어듭니다', W*0.04, ry+120);

      var px0=W*0.49, px1=W*0.965, pTop=42, pBot=248;
      var xlo=Math.min(mu0,mu1)-4*SE-2, xhi=Math.max(mu0,mu1)+4*SE+2;
      function PX(x){ return px0+(x-xlo)/(xhi-xlo)*(px1-px0); }
      var peak=normPdf(mu0,mu0,SE), ysc=(pBot-pTop)*0.92/peak;
      function PY(d){ return pBot-d*ysc; }

      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('― H0(μ0='+mu0+') 분포', px0, 22);
      ctx.fillStyle=GLD; ctx.fillText('― H1(μ1='+mu1+') 분포', px0+130, 22);
      ctx.fillStyle=RED; ctx.fillText('▨α', px0+260, 22);
      ctx.fillStyle=ORG; ctx.fillText('▨β', px0+290, 22);
      ctx.fillStyle=GRN; ctx.fillText('▨검정력', px0+320, 22);

      // α 영역: H0 곡선, x>c
      ctx.beginPath(); var i,x,n2=60;
      ctx.moveTo(PX(Math.max(c,xlo)), pBot);
      for(i=0;i<=n2;i++){ x=Math.max(c,xlo)+(xhi-Math.max(c,xlo))*i/n2; ctx.lineTo(PX(x), PY(normPdf(x,mu0,SE))); }
      ctx.lineTo(PX(xhi), pBot); ctx.closePath();
      ctx.fillStyle=RED; ctx.globalAlpha=0.32; ctx.fill(); ctx.globalAlpha=1;

      // β 영역: H1 곡선, x<c
      ctx.beginPath(); ctx.moveTo(PX(xlo), pBot);
      for(i=0;i<=n2;i++){ x=xlo+(Math.min(c,xhi)-xlo)*i/n2; ctx.lineTo(PX(x), PY(normPdf(x,mu1,SE))); }
      ctx.lineTo(PX(Math.min(c,xhi)), pBot); ctx.closePath();
      ctx.fillStyle=ORG; ctx.globalAlpha=0.30; ctx.fill(); ctx.globalAlpha=1;

      // 검정력 영역: H1 곡선, x>c
      ctx.beginPath(); ctx.moveTo(PX(Math.max(c,xlo)), pBot);
      for(i=0;i<=n2;i++){ x=Math.max(c,xlo)+(xhi-Math.max(c,xlo))*i/n2; ctx.lineTo(PX(x), PY(normPdf(x,mu1,SE))); }
      ctx.lineTo(PX(xhi), pBot); ctx.closePath();
      ctx.fillStyle=GRN; ctx.globalAlpha=0.22; ctx.fill(); ctx.globalAlpha=1;

      // 곡선 윤곽
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=120;i++){ x=xlo+(xhi-xlo)*i/120; var py=PY(normPdf(x,mu0,SE)); if(i===0)ctx.moveTo(PX(x),py); else ctx.lineTo(PX(x),py); }
      ctx.stroke();
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=120;i++){ x=xlo+(xhi-xlo)*i/120; var py2=PY(normPdf(x,mu1,SE)); if(i===0)ctx.moveTo(PX(x),py2); else ctx.lineTo(PX(x),py2); }
      ctx.stroke();

      frame(ctx,px0,px1,pTop,pBot,null);
      // 기각역 경계선(c)
      ctx.strokeStyle=TXT; ctx.lineWidth=1.6; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(PX(c),pTop); ctx.lineTo(PX(c),pBot); ctx.stroke();
      // α=0.05 기준선
      if(c05>xlo && c05<xhi){ ctx.strokeStyle=DIM; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(PX(c05),pTop); ctx.lineTo(PX(c05),pBot); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
      ctx.fillText('c='+c.toFixed(1), PX(c), pBot+14);
      ctx.fillText('측정값(kg)', (px0+px1)/2, pBot+32);
      ctx.textAlign='left'; ctx.fillStyle=DIM;
      ctx.fillText('회색 점선 = α=0.05 기준 경계선(c='+c05.toFixed(1)+'kg)', px0, pBot+50);

      E.tapHint(W/2, H*0.95, '슬라이더로 기각역 c·효과크기 Δ·표본수 n을 바꿔 α·β·검정력이 실제로 맞바뀌는 것을 보세요', true);
      E.big('제1종·제2종 오류와 검정력', '귀무가설 H0(μ0='+mu0+')이 참인 세계와 대립가설 H1(μ1='+mu1+')이 참인 세계, 두 확률분포를 실제로 겹쳐 그렸습니다. 표본평균이 기각역 경계 c='+c.toFixed(1)+'을 넘으면 H0을 기각합니다. <b>제1종 오류 α</b>는 H0이 실제로 참인데도 기각해 버릴 확률(빨간 영역) — 지금 '+alpha.toFixed(4)+'입니다. <b>제2종 오류 β</b>는 H1이 실제로 참인데도 H0을 채택해 버릴 확률(주황 영역) — 지금 '+beta.toFixed(4)+'이고, <b>검정력 1−β</b>(초록 영역, H1이 참일 때 올바르게 기각할 확률)는 '+power.toFixed(4)+'입니다. c를 오른쪽으로 밀면 α는 줄지만 β는 늘어납니다 — 두 오류는 한쪽을 줄이면 다른 쪽이 커지는 상충관계입니다. 그래서 실무에서는 α를 먼저 0.05 같은 값으로 고정한 뒤(참고선 c='+c05.toFixed(1)+') β가 최소가 되도록 설계합니다 — 표본수 n을 늘리면 SE가 줄어 α를 그대로 둔 채로도 β를 줄일 수 있습니다. 7장에서 이미 p값으로 판정을 내려봤지만, 그 판정 뒤에 항상 이 두 가지 오류의 가능성이 함께 있었던 것입니다.'); }
  },

  // ══════════ 3. 점추정과 신뢰구간 ══════════
  { id:'bda52_03',
    enter:function(E){ var self=this; this.s={n:20, conf:0.95, known:0};
      E.controls('<div class="ctrl"><label>표본크기 n</label><input type="range" id="b522n" min="10" max="40" step="10" value="20"><output id="b522no">20</output></div>'
               +'<div class="ctrl"><label>신뢰수준</label><input type="range" id="b522c" min="0" max="2" step="1" value="1"><output id="b522co">95%</output></div>'
               +'<div class="ctrl"><label>모표준편차 σ</label><input type="range" id="b522s" min="0" max="1" step="1" value="0"><output id="b522so">앎</output></div>');
      E.bind('#b522n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b522no').textContent=self.s.n; });
      E.bind('#b522c','input',function(e){ var m=[0.90,0.95,0.99]; self.s.conf=m[+e.target.value]; document.getElementById('b522co').textContent=(self.s.conf*100).toFixed(0)+'%'; });
      E.bind('#b522s','input',function(e){ self.s.known=+e.target.value; document.getElementById('b522so').textContent=(self.s.known? '모름' : '앎'); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var n=s.n, conf=s.conf, known=s.known;
      var M=40;
      var zstar=ppfNorm(1-(1-conf)/2);
      var rows=[], cnt=0, i, firstXbar=null;
      for(i=0;i<M;i++){
        var samp=heightSample(n, 5000+i*131+n);
        var xbar=mean(samp);
        if(i===0) firstXbar=xbar;
        var half;
        if(!known){ half=zstar*SIG_H/Math.sqrt(n); }
        else { var sS=sdA(samp,1); var tstar=tppf(n-1,conf); half=tstar*sS/Math.sqrt(n); }
        var lo=xbar-half, hi=xbar+half;
        var hit=(lo<=MU_H && MU_H<=hi); if(hit) cnt++;
        rows.push({xbar:xbar, lo:lo, hi:hi, hit:hit});
      }
      var covPct=cnt/M*100;

      var code = !known ? [
        {t:'xbar = sample.mean()', hl:'.mean()'},
        {t:'se = sigma / n**0.5      # σ 앎', hl:'sigma'},
        {t:'half = z_star * se', hl:'z_star'},
        {t:'ci = (xbar-half, xbar+half)', hl:'ci'}
      ] : [
        {t:'xbar = sample.mean()', hl:'.mean()'},
        {t:'s = sample.std(ddof=1)   # σ 모름', hl:'ddof=1'},
        {t:'half = t_star * s / n**0.5', hl:'t_star'},
        {t:'ci = (xbar-half, xbar+half)', hl:'ci'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'confidence_interval.py', null);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('모집단(가상 성인 신장 300명) 실제 μ='+MU_H.toFixed(2)+'cm, σ='+SIG_H.toFixed(2)+'cm', W*0.04, ry);
      ctx.fillStyle=DIM; ctx.fillText('점추정 1벌: x̄='+firstXbar.toFixed(2)+'cm — 딱 이 값이 μ일 가능성은 사실상 0', W*0.04, ry+19);
      ctx.fillStyle=(known? ORG:BLU); ctx.fillText((known? 't*(df='+(n-1)+',' : 'z*(') +conf+')='+(known? tppf(n-1,conf).toFixed(3) : zstar.toFixed(3)), W*0.04, ry+41);
      ctx.fillStyle=(covPct>=(conf*100-10)? GRN:RED);
      ctx.fillText(M+'벌 중 μ를 실제로 포함한 구간 = '+cnt+'개 ('+covPct.toFixed(1)+'%)', W*0.04, ry+63);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('목표 신뢰수준 '+(conf*100).toFixed(0)+'%와 비교 — 시행이 유한하면 정확히 일치하지 않습니다', W*0.04, ry+86);

      var px0=W*0.50, px1=W*0.965, pTop=22, pBot=356;
      var vlo=Math.min.apply(null,rows.map(function(r){return r.lo;})), vhi=Math.max.apply(null,rows.map(function(r){return r.hi;}));
      vlo=Math.min(vlo, MU_H-1); vhi=Math.max(vhi, MU_H+1);
      function PX(v){ return px0+(v-vlo)/(vhi-vlo)*(px1-px0); }
      var rh=(pBot-pTop)/M;
      for(i=0;i<M;i++){
        var y=pTop+i*rh+rh/2, r=rows[i];
        ctx.strokeStyle=r.hit? GRN : RED; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(PX(r.lo),y); ctx.lineTo(PX(r.hi),y); ctx.stroke();
        ctx.fillStyle=r.hit? GRN : RED; ctx.beginPath(); ctx.arc(PX(r.xbar),y,1.4,0,7); ctx.fill();
      }
      ctx.strokeStyle=TXT; ctx.lineWidth=1.4; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(PX(MU_H),pTop-4); ctx.lineTo(PX(MU_H),pBot+4); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
      ctx.fillText('μ='+MU_H.toFixed(1), PX(MU_H), pTop-8);
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.fillText('세로 점선 = 실제 모평균  ·  가로선 하나 = 신뢰구간 한 벌', px0, pBot+18);

      E.tapHint(W/2, H*0.95, '슬라이더로 n·신뢰수준·σ 앎/모름을 바꿔 구간 40개와 포함 개수가 실제로 다시 계산되는 것을 보세요', true);
      E.big('점추정과 신뢰구간', '표본 하나의 평균(점추정) x̄='+firstXbar.toFixed(2)+'cm만으로는 이 값이 실제 모평균과 얼마나 가까운지 알 수 없습니다. <b>신뢰구간</b>은 점추정에 폭을 더해 「이 구간 안에 모수가 있을 것」이라고 선언하는 방법입니다. 여기서는 같은 모집단(실제 μ='+MU_H.toFixed(2)+'cm)에서 표본을 '+M+'벌 실제로 뽑아 각각 신뢰구간을 그렸습니다 — 신뢰수준 '+(conf*100).toFixed(0)+'%로 계산했더니 '+M+'개 중 '+cnt+'개('+covPct.toFixed(1)+'%)가 실제로 μ를 포함했습니다. <b>「'+(conf*100).toFixed(0)+'% 신뢰수준」의 진짜 뜻</b>은 "이 구간이 μ를 포함할 확률이 '+conf+'"이 아니라 "이 방법으로 무한히 많은 표본을 뽑아 구간을 만들면 그중 '+(conf*100).toFixed(0)+'%가 μ를 포함한다"는 것입니다 — 이미 뽑힌 구간 하나는 μ를 포함하거나 안 하거나 둘 중 하나로 정해져 있어, 그 자체에 확률을 붙이는 것은 원래 뜻이 아닙니다. σ를 「모른다」로 바꾸면 표본에서 구한 s로 대신하는 대가로 정규분포 대신 <b>t분포</b>(52.5에서 자세히)를 써서 구간이 조금 더 넓어집니다.'); }
  },

  // ══════════ 4. 표본추출 4종 실측 비교 ══════════
  { id:'bda52_04',
    enter:function(E){ var self=this; this.s={n:16};
      E.controls('<div class="ctrl"><label>표본크기 n</label><input type="range" id="b523n" min="8" max="32" step="8" value="16"><output id="b523no">16</output></div>');
      E.bind('#b523n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b523no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var n=s.n, M=50, methods=['simple','sys','cluster','stratified'];
      var R={}; methods.forEach(function(mk){ R[mk]=methodStats(mk,n,M); });

      var code=[
        {t:'# 층화: 매출등급 4층에서 층별 n/4씩', dim:true},
        {t:'for s in strata: sample += pick(s, n//4)', hl:'pick'},
        {t:'bias = sample.mean() - MU', hl:'bias'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'sampling_4ways.py', null);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('매장 48곳 · 지역(군집) 8곳 · 매출등급(층) 4단계', W*0.04, ry);
      ctx.fillStyle=DIM; ctx.fillText('실제 모평균 μ='+MU_SALE.toFixed(2)+'만원, 지역평균 범위 '+Math.min.apply(null,CLMEAN)+'~'+Math.max.apply(null,CLMEAN)+'만원', W*0.04, ry+18);
      ctx.font='11px ui-monospace,Menlo,monospace';
      var yy=ry+42;
      methods.forEach(function(mk,mi){
        ctx.fillStyle=METHOD_COL[mk];
        ctx.fillText(METHOD_NAME[mk]+': 치우침='+R[mk].bias.toFixed(2)+', 흩어짐(SD)='+R[mk].s.toFixed(2), W*0.04, yy+mi*18);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('흩어짐(SD)이 작을수록 '+M+'벌의 표본평균이 서로 가깝다 — 더 안정적', W*0.04, yy+4*18+6);

      var px0=W*0.50, px1=W*0.965, pTop=48, pBot=340;
      var allEst=[]; methods.forEach(function(mk){ allEst=allEst.concat(R[mk].ests); });
      var vlo=Math.min.apply(null,allEst), vhi=Math.max.apply(null,allEst);
      var pad2=(vhi-vlo)*0.08; vlo-=pad2; vhi+=pad2;
      function PY(v){ return pBot-(v-vlo)/(vhi-vlo)*(pBot-pTop); }
      var colW=(px1-px0)/4;
      var rngLCG=LCG(31415);
      methods.forEach(function(mk,mi){
        var cx=px0+mi*colW+colW/2;
        ctx.font='11px sans-serif'; ctx.fillStyle=METHOD_COL[mk]; ctx.textAlign='center';
        ctx.fillText(METHOD_NAME[mk], cx, pTop-30);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText('SD='+R[mk].s.toFixed(2), cx, pTop-16);
        R[mk].ests.forEach(function(v){
          var jitter=(rngLCG()-0.5)*colW*0.62;
          ctx.fillStyle=METHOD_COL[mk]; ctx.globalAlpha=0.55;
          ctx.beginPath(); ctx.arc(cx+jitter, PY(v), 2.1, 0, 7); ctx.fill(); ctx.globalAlpha=1;
        });
        // 평균 표시(가로 짧은 막대)
        ctx.strokeStyle=TXT; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(cx-colW*0.32, PY(R[mk].m)); ctx.lineTo(cx+colW*0.32, PY(R[mk].m)); ctx.stroke();
      });
      ctx.strokeStyle=TXT; ctx.lineWidth=1.4; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(px0,PY(MU_SALE)); ctx.lineTo(px1,PY(MU_SALE)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('점선 = 실제 모평균 μ='+MU_SALE.toFixed(2), px0, PY(MU_SALE)-6);
      ctx.fillStyle=DIM; ctx.fillText('점 '+M+'개 = 같은 n으로 '+M+'번 반복 추출한 표본평균, 굵은 가로선 = 그 평균들의 평균', px0, pBot+18);

      var best=methods.slice().sort(function(a,b){return R[a].s-R[b].s;})[0];
      var worst=methods.slice().sort(function(a,b){return R[b].s-R[a].s;})[0];
      E.tapHint(W/2, H*0.95, '슬라이더로 표본크기 n을 바꿔 네 방법의 치우침·흩어짐이 실제로 다시 계산되는 것을 보세요', true);
      E.big('표본추출 4종 실측 비교', '같은 매장 48곳(지역 8곳×6곳, 매출등급 4단계)에서 네 가지 방법으로 각각 '+M+'번씩 실제로 표본(n='+n+')을 뽑아 표본평균의 흩어짐을 비교했습니다. <b>단순랜덤추출</b>은 전체에서 무작위로 n개를 뽑고(SD='+R.simple.s.toFixed(2)+'), <b>계통추출</b>은 간격 K마다 하나씩 뽑습니다(SD='+R.sys.s.toFixed(2)+') — 매장이 지역별로 나열돼 있어 간격이 우연히 지역 구조와 맞아떨어지면 뜻밖에 정확해질 수 있습니다. <b>집락추출</b>은 지역(군집) 몇 곳을 통째로 뽑는데, 지역별 평균이 크게 다르게 설계돼 있어 SD='+R.cluster.s.toFixed(2)+'로 네 방법 중 가장 불안정합니다 — 뽑힌 지역이 우연히 평균이 높은 곳으로 몰리면 전체 평균이 크게 틀어집니다. <b>층화추출</b>은 매출등급(층) 4단계에서 고르게 뽑아 SD='+R.stratified.s.toFixed(2)+'로 가장 안정적입니다 — 층 내부가 균질하도록 미리 나눴기 때문입니다. 지금 n='+n+'에서는 <b>'+METHOD_NAME[best]+'</b>이 가장 안정적이고 <b>'+METHOD_NAME[worst]+'</b>이 가장 불안정합니다. 9장·46장에서 이미 쓴 층화 분할(StratifiedKFold, stratify=y)이 사실 이 층화추출의 원리를 그대로 응용한 것입니다.'); }
  },

  // ══════════ 5. 확률분포 갤러리와 비모수 검정 ══════════
  { id:'bda52_05',
    enter:function(E){ var self=this; this.s={page:0, di:3, p:0.48};
      E.controls('<div class="ctrl"><label>분포 선택</label><input type="range" id="b524i" min="0" max="9" step="1" value="3"><output id="b524io">포아송</output></div>'
               +'<div class="ctrl"><label>모수</label><input type="range" id="b524p" min="0" max="1" step="0.02" value="0.48"><output id="b524po"></output></div>');
      function upd(){ document.getElementById('b524io').textContent=DIST_NAMES[self.s.di]; document.getElementById('b524po').textContent=paramLabel(self.s.di,self.s.p); }
      E.bind('#b524i','input',function(e){ self.s.di=+e.target.value; upd(); });
      E.bind('#b524p','input',function(e){ self.s.p=+e.target.value; upd(); });
      upd();
      E.setOn([]); },
    tap:function(E){ this.s.page=(this.s.page+1)%2; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      if(s.page===1){
        window.BdaMap(E, {
          title:'모수적 검정 대 비모수적 검정', sub:'모집단 분포를 가정하는가 — 그 하나가 갈림길입니다',
          cols:[
            { t:'모수적 검정', c:BLU, items:[
                {t:'분포를 가정', s:'보통 정규분포를 전제'},
                {t:'검정통계량', s:'표본평균 x̄·표본분산 s² 이용'},
                {t:'t검정·χ²검정', s:'7장에서 이미 실제로 계산'},
                {t:'F검정(분산분석)', s:'방금 52장에서 실제로 계산 — F='+ANOVA_F.toFixed(2)},
                {t:'회귀의 F통계량', s:'8장 — 사실 일원배치 F검정의 확장'} ] },
            { t:'비모수적 검정', c:GLD, items:[
                {t:'분포 가정 없음', s:'"분포 형태가 같다/다르다"만 검정'},
                {t:'순위·부호만 이용', s:'절대적 크기에 의존하지 않음'},
                {t:'부호검정(sign test)', s:'대응표본, 차이의 부호만 봄'},
                {t:'윌콕슨 순위합검정', s:'두 독립표본의 순위 합 비교'},
                {t:'윌콕슨 부호순위합검정', s:'대응표본, 부호+순위 함께'},
                {t:'만-위트니 U검정', s:'순위합검정과 사실상 동등'},
                {t:'런검정(run test)', s:'배열이 무작위인지 검정'} ] },
            { t:'언제 비모수를 쓰는가', c:ROSE, items:[
                {t:'표본이 작아 정규성 확신 어려움', s:'분포 가정 자체가 위험'},
                {t:'이상치가 심함', s:'순위는 극단값에 덜 흔들림'},
                {t:'서열척도 자료', s:'52.1에서 본 그 척도 — 평균 자체가 무의미'} ] } ],
          foot:'모수적 검정이 가정을 만족 못 하면 힘을 잃습니다 — 비모수 검정은 가정을 덜 요구하는 대신 검정력이 대개 더 낮습니다'
        });
        E.tapHint(E.W/2, E.H*0.95, '화면 탭 = 분포 갤러리로', true);
        return;
      }

      var D=distInfo(s.di, s.p);
      var code=[
        {t:D.eng, hl:D.hl},
        {t:'E(X) = '+D.meanTxt, dim:true},
        {t:'Var(X) = '+D.varTxt, dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, D.file, null);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText(D.name+' — '+D.paramTxt, W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('E(X) 실제값 = '+D.meanVal.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('Var(X) 실제값 = '+(isNaN(D.varVal)? '식 생략(d2 조건부)' : D.varVal.toFixed(3)), W*0.04, ry+38);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      var noteLines=D.note.split('\n');
      noteLines.forEach(function(ln,li){ ctx.fillText(ln, W*0.04, ry+62+li*17); });

      var px0=W*0.49, px1=W*0.965, pTop=30, pBot=300;
      if(D.kind==='multinom'){
        var cats=['범주1','범주2','범주3'], maxV=Math.max.apply(null,D.counts.concat(D.probs.map(function(pv){return D.n*pv;})))*1.2;
        var cw=(px1-px0)/3;
        cats.forEach(function(cn,ci){
          var cx=px0+ci*cw+cw/2, exp=D.n*D.probs[ci], real=D.counts[ci];
          var bw2=cw*0.28;
          var hExp=(exp/maxV)*(pBot-pTop), hReal=(real/maxV)*(pBot-pTop);
          ctx.fillStyle=BLU; ctx.globalAlpha=0.55; ctx.fillRect(cx-bw2-2, pBot-hExp, bw2, hExp); ctx.globalAlpha=1;
          ctx.fillStyle=GLD; ctx.fillRect(cx+2, pBot-hReal, bw2, hReal);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(cn+'(p='+D.probs[ci].toFixed(1)+')', cx, pBot+16);
          ctx.font='11px ui-monospace,Menlo,monospace';
          ctx.fillStyle=BLU; ctx.fillText('기대'+exp.toFixed(1), cx-bw2-2+bw2/2, pBot-hExp-6);
          ctx.fillStyle=GLD; ctx.fillText('실현'+real, cx+2+bw2/2, pBot-hReal-6);
        });
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      } else if(D.kind==='discrete'){
        var maxY=Math.max.apply(null,D.ys)*1.15;
        function PXd(k){ return px0+(k-D.xs[0]+0.5)/(D.xs.length)*(px1-px0); }
        function PYd(v){ return pBot-(v/maxY)*(pBot-pTop); }
        var bw=(px1-px0)/D.xs.length*0.62;
        D.xs.forEach(function(k,ki){
          ctx.fillStyle=GLD; ctx.fillRect(PXd(k)-bw/2, PYd(D.ys[ki]), bw, pBot-PYd(D.ys[ki]));
        });
        if(D.overlay){
          ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.beginPath();
          D.xs.forEach(function(k,ki){ var py=PYd(D.overlay[ki]||0); if(ki===0)ctx.moveTo(PXd(k),py); else ctx.lineTo(PXd(k),py); });
          ctx.stroke();
        }
        frame(ctx,px0,px1,pTop,pBot,null);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        var step=Math.max(1,Math.ceil(D.xs.length/12));
        D.xs.forEach(function(k,ki){ if(ki%step===0) ctx.fillText(''+k, PXd(k), pBot+14); });
      } else {
        var xs=D.xs, ymax=0, i;
        var ys=xs.map(function(x){ return D.pdf(x); });
        ymax=Math.max.apply(null,ys)*1.12;
        function PXc(x){ return px0+(x-xs[0])/(xs[xs.length-1]-xs[0])*(px1-px0); }
        function PYc(v){ return pBot-(v/ymax)*(pBot-pTop); }
        ctx.beginPath(); ctx.moveTo(PXc(xs[0]),pBot);
        for(i=0;i<xs.length;i++) ctx.lineTo(PXc(xs[i]), PYc(ys[i]));
        ctx.lineTo(PXc(xs[xs.length-1]),pBot); ctx.closePath();
        ctx.fillStyle=GLD; ctx.globalAlpha=0.28; ctx.fill(); ctx.globalAlpha=1;
        ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
        for(i=0;i<xs.length;i++){ var py=PYc(ys[i]); if(i===0)ctx.moveTo(PXc(xs[i]),py); else ctx.lineTo(PXc(xs[i]),py); }
        ctx.stroke();
        if(D.overlay2){
          ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.setLineDash([4,3]); ctx.beginPath();
          for(i=0;i<xs.length;i++){ var py2=PYc(D.overlay2(xs[i])); if(i===0)ctx.moveTo(PXc(xs[i]),py2); else ctx.lineTo(PXc(xs[i]),py2); }
          ctx.stroke(); ctx.setLineDash([]);
        }
        if(D.marker!=null){
          var mxRaw=PXc(D.marker), inRange=(mxRaw>=px0 && mxRaw<=px1);
          var mx=inRange? mxRaw : (mxRaw>px1? px1 : px0);
          ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.moveTo(mx,pTop); ctx.lineTo(mx,pBot); ctx.stroke(); ctx.setLineDash([]);
          ctx.font='11px sans-serif'; ctx.fillStyle=RED;
          if(inRange){ ctx.textAlign='center'; ctx.fillText(D.markerLabel, mx, pTop-8); }
          else if(mxRaw>px1){ ctx.textAlign='right'; ctx.fillText(D.markerLabel+' →(범위 밖)', px1-4, pTop-8); }
          else { ctx.textAlign='left'; ctx.fillText('←(범위 밖) '+D.markerLabel, px0+4, pTop-8); }
        }
        frame(ctx,px0,px1,pTop,pBot,null);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      var kindLbl=(D.kind==='discrete'?'확률질량함수 pmf':(D.kind==='multinom'?'기대 대 실현 개수':'확률밀도함수 pdf'));
      ctx.fillText(D.name+' — '+kindLbl+(D.xlab?' ('+D.xlab+')':''), px0, 20);

      E.tapHint(W/2, H*0.95, '슬라이더로 분포·모수를 바꾸고, 화면 탭으로 모수적/비모수적 체계도를 보세요', true);
      E.big('확률분포 갤러리 — '+D.name, D.big); }
  }

  ];

  // ── 52.5 분포 정보 계산기(전부 실계산) ─────────────────────────────
  var DIST_NAMES=['베르누이','이항','기하','포아송','다항','균일','지수','t','카이제곱','F'];
  function paramLabel(di,p){
    if(di===0) return 'p='+p.toFixed(2);
    if(di===1) return 'p='+p.toFixed(2)+'(n=10 고정)';
    if(di===2) return 'p='+(0.05+p*0.9).toFixed(2);
    if(di===3) return 'λ='+(0.5+p*14.5).toFixed(1);
    if(di===4) return '(고정 예시)';
    if(di===5) return 'b='+(1+p*9).toFixed(1)+'(a=0)';
    if(di===6) return 'λ='+(0.1+p*1.9).toFixed(2);
    if(di===7) return 'df='+Math.max(1,Math.round(1+p*29));
    if(di===8) return 'df='+Math.max(1,Math.round(1+p*19));
    return 'd1=2, d2='+Math.max(2,Math.round(2+p*38));
  }
  function distInfo(di,p){
    if(di===0){ var pp=0.03+p*0.94;
      return { name:'베르누이분포', kind:'discrete', xs:[0,1], ys:[1-pp,pp], xlab:'X(성공=1)',
        meanVal:pp, varVal:pp*(1-pp), meanTxt:'p', varTxt:'p(1−p)', paramTxt:'p='+pp.toFixed(2),
        eng:'X ~ Bernoulli(p)', hl:'Bernoulli', file:'bernoulli.py',
        note:'시행 한 번, 결과는 성공(1)·실패(0) 둘뿐 — 모든 이산분포의 씨앗입니다.',
        big:'베르누이는 딱 한 번의 동전 던지기입니다. 성공확률 p='+pp.toFixed(2)+'짜리 시행을 n번 반복해 합하면 다음 슬라이더 위치(이항분포)가 됩니다 — 모든 이산확률분포의 출발점입니다.' }; }
    if(di===1){ var pb=0.03+p*0.94, nb=10, ys1=binomPmf(nb,pb), xs1=[]; for(var k=0;k<=nb;k++) xs1.push(k);
      return { name:'이항분포', kind:'discrete', xs:xs1, ys:ys1, xlab:'성공 횟수 k(n=10)',
        meanVal:nb*pb, varVal:nb*pb*(1-pb), meanTxt:'np', varTxt:'np(1−p)', paramTxt:'n=10, p='+pb.toFixed(2),
        eng:'X ~ Binomial(n=10, p)', hl:'Binomial', file:'binomial.py',
        note:'베르누이 시행 10번의 합 — 성공 횟수의 분포입니다.',
        big:'이항분포는 베르누이 시행을 n=10번 반복해 성공 횟수를 센 것입니다. p='+pb.toFixed(2)+'일 때 기댓값은 np='+(nb*pb).toFixed(2)+'번 — 막대 봉우리가 그 근처에 있는 것을 실제 계산으로 확인할 수 있습니다.' }; }
    if(di===2){ var pg=0.05+p*0.9, xs2=[],ys2=[]; for(var kk=1;kk<=15;kk++){ xs2.push(kk); ys2.push(Math.pow(1-pg,kk-1)*pg); }
      return { name:'기하분포', kind:'discrete', xs:xs2, ys:ys2, xlab:'첫 성공까지 시행 횟수 k',
        meanVal:1/pg, varVal:(1-pg)/(pg*pg), meanTxt:'1/p', varTxt:'(1−p)/p²', paramTxt:'p='+pg.toFixed(2),
        eng:'X ~ Geometric(p)', hl:'Geometric', file:'geometric.py',
        note:'첫 성공이 나올 때까지 걸리는 시행 횟수입니다.',
        big:'기하분포는 "몇 번째 시행에서 처음 성공하는가"를 셉니다. 성공확률 p='+pg.toFixed(2)+'이면 평균적으로 1/p='+(1/pg).toFixed(2)+'번째에 첫 성공이 납니다 — p가 작을수록(성공이 드물수록) 오래 기다립니다.' }; }
    if(di===3){ var lam=0.5+p*14.5, kmax=Math.max(20,Math.ceil(lam*3+10)); var ys3=poisPmf(lam,kmax), xs3=[]; for(var k3=0;k3<=kmax;k3++) xs3.push(k3);
      var byN=200, byP=lam/byN, byY=binomPmf(byN,byP);
      var maxDiff=0; for(var d=0;d<=kmax;d++){ var dv=Math.abs((byY[d]||0)-(ys3[d]||0)); if(dv>maxDiff) maxDiff=dv; }
      return { name:'포아송분포', kind:'discrete', xs:xs3, ys:ys3, xlab:'단위시간당 사건 수 k', overlay:byY,
        meanVal:lam, varVal:lam, meanTxt:'λ', varTxt:'λ', paramTxt:'λ='+lam.toFixed(1),
        eng:'X ~ Poisson(λ)', hl:'Poisson', file:'poisson.py',
        note:'파란 선 = 이항(n=200,p=λ/200) — 최대 차이 '+maxDiff.toFixed(4)+'로 사실상 포아송과 겹칩니다.\nn이 커지고 p가 작아지며 np=λ로 고정되면 이항이 포아송에 수렴합니다.',
        big:'포아송분포는 단위시간(단위공간)에 평균 λ='+lam.toFixed(1)+'번 일어나는 희귀 사건의 횟수입니다. 이항(n=200, p=λ/200)을 실제로 계산해 겹쳐 보면 최대 차이가 '+maxDiff.toFixed(4)+'에 불과합니다 — n이 아주 크고 p가 아주 작을 때(np=λ 고정) 이항분포가 포아송분포로 수렴한다는 사실을 실제 숫자로 확인한 것입니다.' }; }
    if(di===4){
      var probs=[0.5,0.3,0.2], nT=12, rng=LCG(4242), counts=[0,0,0], t;
      for(t=0;t<nT;t++){ var u=rng(), cum=0, chosen=2,c2; for(c2=0;c2<3;c2++){ cum+=probs[c2]; if(u<=cum){ chosen=c2; break; } } counts[chosen]++; }
      return { name:'다항분포(고정 예시)', kind:'multinom', counts:counts, probs:probs, n:nT,
        meanVal:nT*probs[0], varVal:nT*probs[0]*(1-probs[0]), meanTxt:'n·p_i', varTxt:'n·p_i(1−p_i)', paramTxt:'n='+nT+', p=[0.5,0.3,0.2]',
        eng:'X ~ Multinomial(n=12, p)', hl:'Multinomial', file:'multinomial.py',
        note:'이항분포를 범주 3개 이상으로 확장한 것 — 12번 시행을 3개 범주로 나눕니다.',
        big:'다항분포는 이항분포의 다범주 확장입니다. 범주확률 [0.5,0.3,0.2]로 12번 시행을 실제로 뽑아보면(고정 시드) 기대 개수 [6.0,3.6,2.4]와 달리 실현된 개수는 ['+counts.join(',')+']입니다 — 기댓값 근처에서 실제로는 이렇게 흔들립니다.' }; }
    if(di===5){ var b=1+p*9, xs5=[-0.5,0,0,b,b,b+0.5];
      return { name:'균일분포', kind:'continuous', xs:linspace(-0.5,b+0.5,120), pdf:function(x){ return (x>=0&&x<=b)? 1/b : 0; }, xlab:'X',
        meanVal:b/2, varVal:b*b/12, meanTxt:'(a+b)/2', varTxt:'(b−a)²/12', paramTxt:'a=0, b='+b.toFixed(1),
        eng:'X ~ Uniform(0, b)', hl:'Uniform', file:'uniform.py',
        note:'구간 [0,'+b.toFixed(1)+'] 안 어디든 밀도가 똑같습니다 — 높이 1/b='+(1/b).toFixed(3)+'인 직사각형.',
        big:'균일분포는 구간 [0,'+b.toFixed(1)+'] 안 어느 지점이든 밀도가 똑같은(1/b='+(1/b).toFixed(3)+') 가장 단순한 연속분포입니다. 다음 슬라이더 위치(지수분포)의 대기시간처럼, 완전히 다른 모양의 분포도 사실은 균일분포에서 역변환으로 만들어낼 수 있습니다(7장 표본추출이 실제로 쓴 방법입니다).' }; }
    if(di===6){ var lex=0.1+p*1.9, xhiE=Math.min(30,6/lex);
      return { name:'지수분포', kind:'continuous', xs:linspace(0.0001,xhiE,120), pdf:function(x){ return lex*Math.exp(-lex*x); }, xlab:'대기시간',
        meanVal:1/lex, varVal:1/(lex*lex), meanTxt:'1/λ', varTxt:'1/λ²', paramTxt:'λ='+lex.toFixed(2),
        eng:'X ~ Exponential(λ)', hl:'Exponential', file:'exponential.py',
        note:'포아송 과정에서 사건과 사건 사이의 대기시간이 바로 이 분포를 따릅니다.',
        big:'지수분포는 사건이 평균 λ='+lex.toFixed(2)+'번/단위시간 일어나는 포아송 과정에서, 한 사건에서 다음 사건까지 걸리는 대기시간입니다. 평균 대기시간은 1/λ='+(1/lex).toFixed(2)+' — λ(포아송 슬라이더 위치)를 키우면 사건이 잦아지고 대기시간은 짧아집니다.' }; }
    if(di===7){ var df7=Math.max(1,Math.round(1+p*29));
      var diffs=0; var grid=linspace(-6,6,120);
      grid.forEach(function(x){ var d=Math.abs(tpdf(x,df7)-normPdf(x,0,1)); if(d>diffs) diffs=d; });
      return { name:'t분포', kind:'continuous', xs:grid, pdf:function(x){ return tpdf(x,df7); }, xlab:'t', overlay2:function(x){ return normPdf(x,0,1); },
        meanVal:0, varVal:(df7>2? df7/(df7-2):Infinity), meanTxt:'0(df>1)', varTxt:'df/(df−2)(df>2)', paramTxt:'df='+df7,
        eng:'T ~ t(df='+df7+')', hl:'t(df', file:'t_dist.py',
        note:'파란 점선 = 표준정규 — t분포와의 최대 차이 '+diffs.toFixed(4)+'.\n7장 t검정이 실제로 쓴 그 분포입니다. df가 커질수록 정규분포에 가까워집니다.',
        big:'t분포는 모분산을 몰라 표본분산으로 대신 잴 때 등장하는, 정규분포보다 꼬리가 두꺼운 분포입니다. 자유도 df='+df7+'에서 표준정규와 최대 차이는 '+diffs.toFixed(4)+' — df를 슬라이더로 키우면 이 차이가 실제로 줄어들어 정규분포에 가까워지는 것을 확인할 수 있습니다. 7장의 t검정과 52.3의 신뢰구간(σ 모름)이 실제로 쓴 그 분포입니다.' }; }
    if(di===8){ var df8=Math.max(1,Math.round(1+p*19)); var xhiC=Math.max(10,df8+4*Math.sqrt(2*df8));
      return { name:'카이제곱분포', kind:'continuous', xs:linspace(0.0001,xhiC,120), pdf:function(x){ return chi2pdf(x,df8); }, xlab:'χ²',
        meanVal:df8, varVal:2*df8, meanTxt:'df', varTxt:'2·df', paramTxt:'df='+df8,
        eng:'X ~ χ²(df='+df8+')', hl:'χ²(df', file:'chi2_dist.py',
        note:'7장 분할표 독립성 검정이 실제로 쓴 그 분포입니다.',
        big:'카이제곱분포는 표준정규 확률변수 df='+df8+'개를 각각 제곱해 더한 분포입니다 — 평균이 정확히 df와 같습니다(지금 '+df8+'). 7장에서 관측도수와 기대도수의 어긋남 Σ(O−E)²/E를 판정할 때 실제로 쓴 그 분포가 바로 이것입니다.' }; }
    var d2=Math.max(2,Math.round(2+p*38)), d1=2;
    var xhiF=Math.max(6, 1+6/Math.sqrt(d2));
    var pval=fsf(ANOVA_F,ANOVA_DFB,ANOVA_DFW);
    return { name:'F분포', kind:'continuous', xs:linspace(0.0001,xhiF,140), pdf:function(x){ return fpdf(x,d1,d2); }, xlab:'F',
      meanVal:(d2>2? d2/(d2-2):Infinity), varVal:NaN, meanTxt:'d2/(d2−2)(d2>2)', varTxt:'(생략)', paramTxt:'d1='+d1+', d2='+d2,
      eng:'F ~ F(d1='+d1+', d2='+d2+')', hl:'F(d1', file:'f_dist.py',
      marker:(d2===ANOVA_DFW? ANOVA_F : null), markerLabel:'실제 F='+ANOVA_F.toFixed(2),
      note:'빨간선(d2='+ANOVA_DFW+'일 때) = 3그룹·n=5씩 분산분석의 실제 F='+ANOVA_F.toFixed(2)+', p='+ANOVA_P.toExponential(2)+'.\n8장 회귀의 F통계량과 원리가 같습니다 — 두 분산의 비율입니다.',
      big:'F분포는 두 카이제곱분포의 비율(각자 자유도로 나눈 것)입니다. 세 그룹(n=5씩)의 실제 데이터로 일원배치 분산분석을 계산하면 그룹간분산 MSB='+ANOVA_MSB.toFixed(2)+', 그룹내분산 MSW='+ANOVA_MSW.toFixed(2)+', F=MSB/MSW='+ANOVA_F.toFixed(2)+'가 나옵니다 — d2='+ANOVA_DFW+'일 때 F분포 위에 실제로 표시하면(빨간선) 꼬리 끝 훨씬 바깥이라 p='+ANOVA_P.toExponential(2)+'로 그룹 간 차이가 우연이라 보기 어렵습니다. 8장에서 본 회귀식의 F통계량도 사실 이 일원배치 분산분석의 F검정과 원리가 같습니다 — 설명된 분산과 설명 못 한 분산의 비율입니다.' };
  }
  function linspace(a,b,n){ var out=[],i; for(i=0;i<=n;i++) out.push(a+(b-a)*i/n); return out; }

  if(window.Engine) window.Engine.addScenes(scenes);
})();
