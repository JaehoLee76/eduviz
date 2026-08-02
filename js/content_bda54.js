/* 빅데이터 분석 제54장 — 가설검정을 넓히다 (분산분석·두 비율검정·이항확률·적합도검정·대응자료검정)
   동작(behavior)만. 텍스트=content/bda54.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(SS·F·p·χ²·z·D·W)는 이 파일 로드 시 고정 데이터로부터 실제 계산(하드코딩 금지).
   정규·t·F·콜모고로프 분포의 누적확률은 수치적분(심프슨)·급수 근사로 직접 구한다.
   난수(Math.random) 절대 금지 — 1종 오류 누적 시뮬레이션은 고정 시드 LCG로 결정적 생성. */
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

  // ══════════ 수치 도구 (골든룰의 심장 — bda7과 동일 계열: 랜초스 lgamma + 심프슨 수치적분) ══════════
  function simpson(f,a,b,n){ if(n%2)n++; var h=(b-a)/n, s=f(a)+f(b), i;
    for(i=1;i<n;i++) s+=f(a+i*h)*((i%2)?4:2);
    return s*h/3; }

  var LG=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
          12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  function lgamma(x){
    if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);
    x-=1; var a=0.99999999999980993, t=x+7.5;
    for(var i=0;i<8;i++) a+=LG[i]/(x+i+1);
    return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
  }

  var NT=null;
  function normTable(){
    if(NT) return NT;
    var N=1600, z0=-8, dz=16/N, c=[0], z=[z0], s=0, prev=Math.exp(-z0*z0/2)/Math.sqrt(2*Math.PI), i;
    for(i=1;i<=N;i++){ var zz=z0+i*dz, f=Math.exp(-zz*zz/2)/Math.sqrt(2*Math.PI);
      s+=(prev+f)/2*dz; prev=f; c.push(s); z.push(zz); }
    for(i=0;i<=N;i++) c[i]/=s;
    NT={z:z,c:c,N:N,z0:z0,dz:dz}; return NT;
  }
  function cdfZ(t){ var T=normTable(), i=(t-T.z0)/T.dz;
    if(i<=0) return 0; if(i>=T.N) return 1;
    var k=Math.floor(i), fr=i-k; return T.c[k]*(1-fr)+T.c[k+1]*fr; }

  // χ² 생존함수 (맥니마 검정용)
  function chi2sf(x,k){
    if(x<=0) return 1;
    var lg=lgamma(k/2);
    function f(t){ return t<=0?0:Math.exp((k/2-1)*Math.log(t)-t/2-(k/2)*Math.LN2-lg); }
    return simpson(f,x,x+140,700);
  }
  // t 분포 생존함수(대응표본 검정용)
  function tsf(t,df){
    var lg=lgamma((df+1)/2)-lgamma(df/2)-0.5*Math.log(df*Math.PI);
    function f(x){ return Math.exp(lg-((df+1)/2)*Math.log(1+x*x/df)); }
    return simpson(f,t,t+60,600);
  }
  // F 분포: Beta 변환(0~1 콤팩트 구간)으로 생존함수를 정확히 수치 적분 — Y=d1x/(d1x+d2)~Beta(d1/2,d2/2)
  function Fpdf(x,d1,d2){
    if(x<=0) return 0;
    var lg=lgamma((d1+d2)/2)-lgamma(d1/2)-lgamma(d2/2);
    return Math.exp(lg+(d1/2)*Math.log(d1)+(d2/2)*Math.log(d2)+(d1/2-1)*Math.log(x)-((d1+d2)/2)*Math.log(d2+d1*x));
  }
  function Fsf(x,d1,d2){
    if(x<=0) return 1;
    var a=d1/2, b=d2/2, logB=lgamma(a)+lgamma(b)-lgamma(a+b);
    var y0=d1*x/(d1*x+d2);
    function f(y){ if(y<=0||y>=1) return 0; return Math.exp((a-1)*Math.log(y)+(b-1)*Math.log(1-y)-logB); }
    return simpson(f,y0,1,800);
  }
  function Fcrit(d1,d2,alpha){
    var lo=0.001, hi=60, i;
    for(i=0;i<60;i++){ var mid=(lo+hi)/2; if(Fsf(mid,d1,d2)>alpha) lo=mid; else hi=mid; }
    return (lo+hi)/2;
  }
  // 콜모고로프 분포: 급수 근사 P(D≥d) = 2·Σ(-1)^(k-1) exp(-2k²λ²), λ=D√n
  function kolmogorovP(D,n){
    var lam=D*Math.sqrt(n), s=0;
    for(var k=1;k<=100;k++){ var term=Math.pow(-1,k-1)*Math.exp(-2*k*k*lam*lam); s+=term; if(Math.abs(term)<1e-12) break; }
    return Math.max(0,Math.min(1,2*s));
  }
  function kolmogorovCrit(n,alpha){
    var lo=0,hi=3,i;
    for(i=0;i<60;i++){ var mid=(lo+hi)/2; if(kolmogorovP(mid,n)>alpha) lo=mid; else hi=mid; }
    return (lo+hi)/2;
  }
  function nCk(n,k){ if(k<0||k>n) return 0; k=Math.min(k,n-k); var r=1;
    for(var i=0;i<k;i++) r=r*(n-i)/(i+1); return r; }
  function binomPMF(n,k,p){ return nCk(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k); }
  function binomCDF(n,K,p){ var s=0; for(var k=0;k<=K;k++) s+=binomPMF(n,k,p); return s; }

  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sd(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m);
    return Math.sqrt(s/(a.length-(ddof||0))); }

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function randNormal(rng){ var u1=rng(), u2=rng(); if(u1<1e-12) u1=1e-12; return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); }

  // 독립표본 t검정 (합동분산)
  function ttest2(a,b){
    var na=a.length, nb=b.length, ma=mean(a), mb=mean(b), sa=sd(a,1), sb=sd(b,1);
    var sp2=((na-1)*sa*sa+(nb-1)*sb*sb)/(na+nb-2);
    var t=(ma-mb)/Math.sqrt(sp2*(1/na+1/nb));
    var df=na+nb-2;
    var p=2*tsf(Math.abs(t),df);
    if(p>1) p=1;
    return {t:t,df:df,p:p,ma:ma,mb:mb};
  }
  // 일원배치 분산분석
  function anova1(groups){
    var all=[]; groups.forEach(function(g){ all=all.concat(g); });
    var grand=mean(all), k=groups.length, N=all.length;
    var ssb=0, ssw=0, means=[];
    groups.forEach(function(g){ var m=mean(g); means.push(m); ssb+=g.length*(m-grand)*(m-grand);
      g.forEach(function(x){ ssw+=(x-m)*(x-m); }); });
    var dfb=k-1, dfw=N-k, msb=ssb/dfb, msw=ssw/dfw, F=msb/msw;
    var p=Fsf(F,dfb,dfw);
    return {grand:grand,means:means,ssb:ssb,ssw:ssw,sst:ssb+ssw,dfb:dfb,dfw:dfw,msb:msb,msw:msw,F:F,p:p};
  }
  // 이원배치 분산분석 (균형설계 a×b×n)
  function anova2(cell){
    var a=cell.length, b=cell[0].length, n=cell[0][0].length, i,j;
    var all=[]; cell.forEach(function(row){ row.forEach(function(c){ all=all.concat(c); }); });
    var grand=mean(all), N=all.length;
    var meanA=[], meanB=[], meanCell=[];
    for(j=0;j<b;j++) meanB.push(0);
    var cntB=[]; for(j=0;j<b;j++) cntB.push(0);
    for(i=0;i<a;i++){
      var rowAll=[]; meanCell.push([]);
      for(j=0;j<b;j++){ rowAll=rowAll.concat(cell[i][j]); meanCell[i].push(mean(cell[i][j]));
        meanB[j]+= cell[i][j].reduce(function(s,v){return s+v;},0); cntB[j]+=cell[i][j].length; }
      meanA.push(mean(rowAll));
    }
    for(j=0;j<b;j++) meanB[j]/=cntB[j];
    var SST=0; all.forEach(function(x){ SST+=(x-grand)*(x-grand); });
    var SSA=0; for(i=0;i<a;i++) SSA += b*n*(meanA[i]-grand)*(meanA[i]-grand);
    var SSB=0; for(j=0;j<b;j++) SSB += a*n*(meanB[j]-grand)*(meanB[j]-grand);
    var SSAB=0;
    for(i=0;i<a;i++) for(j=0;j<b;j++){ var d=meanCell[i][j]-meanA[i]-meanB[j]+grand; SSAB += n*d*d; }
    var SSE=SST-SSA-SSB-SSAB;
    var dfA=a-1, dfB=b-1, dfAB=(a-1)*(b-1), dfE=a*b*(n-1);
    var MSA=SSA/dfA, MSB=SSB/dfB, MSAB=SSAB/dfAB, MSE=SSE/dfE;
    var FA=MSA/MSE, FB=MSB/MSE, FAB=MSAB/MSE;
    var pA=Fsf(FA,dfA,dfE), pB=Fsf(FB,dfB,dfE), pAB=Fsf(FAB,dfAB,dfE);
    return {grand:grand,meanA:meanA,meanB:meanB,meanCell:meanCell,SST:SST,SSA:SSA,SSB:SSB,SSAB:SSAB,SSE:SSE,
      dfA:dfA,dfB:dfB,dfAB:dfAB,dfE:dfE,MSA:MSA,MSB:MSB,MSAB:MSAB,MSE:MSE,FA:FA,FB:FB,FAB:FAB,pA:pA,pB:pB,pAB:pAB};
  }
  // 두 모집단 비율 검정(합동비율)
  function propTest2(x1,n1,x2,n2){
    var p1=x1/n1, p2=x2/n2, pp=(x1+x2)/(n1+n2);
    var se=Math.sqrt(pp*(1-pp)*(1/n1+1/n2));
    var z=(p1-p2)/se;
    var p=2*(1-cdfZ(Math.abs(z)));
    return {p1:p1,p2:p2,pp:pp,se:se,z:z,p:p};
  }
  // 대응표본 t검정
  function pairedT(d){
    var n=d.length, m=mean(d), s=sd(d,1);
    var t=m/(s/Math.sqrt(n));
    var p=2*tsf(Math.abs(t),n-1);
    if(p>1) p=1;
    return {m:m,s:s,t:t,df:n-1,p:p};
  }
  // 윌콕슨 부호순위 검정(정규근사, 연속성수정)
  function wilcoxonSigned(d){
    var nz=d.filter(function(x){return x!==0;});
    var abs=nz.map(Math.abs);
    var idx=abs.map(function(v,i){return i;}).sort(function(a,b){return abs[a]-abs[b];});
    var ranks=new Array(nz.length), i=0;
    while(i<idx.length){
      var j=i;
      while(j+1<idx.length && abs[idx[j+1]]===abs[idx[i]]) j++;
      var avgRank=(i+1+j+1)/2;
      for(var k=i;k<=j;k++) ranks[idx[k]]=avgRank;
      i=j+1;
    }
    var Wp=0,Wm=0;
    for(i=0;i<nz.length;i++){ if(nz[i]>0) Wp+=ranks[i]; else Wm+=ranks[i]; }
    var n=nz.length, muW=n*(n+1)/4, sgW=Math.sqrt(n*(n+1)*(2*n+1)/24);
    var W=Math.min(Wp,Wm);
    var z=(W-muW+0.5)/sgW;
    var p=2*cdfZ(z); if(p>1) p=2*(1-cdfZ(Math.abs(z)));
    return {Wp:Wp,Wm:Wm,n:n,muW:muW,sgW:sgW,z:z,p:p};
  }
  function mcnemar(b,c){
    var stat=Math.pow(Math.abs(b-c)-1,2)/(b+c);
    var p=chi2sf(stat,1);
    return {stat:stat,p:p};
  }

  // ══════════ 54.1: 고정 데이터 — 다중비교 시뮬레이션 + 일원배치 실측 ══════════
  var GA1=[72,75,78,74,77,76], GB1=[80,83,79,85,82,81], GC1=[88,90,85,87,91,89];
  var ANOVA1=anova1([GA1,GB1,GC1]);
  var FCRIT_1=Fcrit(ANOVA1.dfb,ANOVA1.dfw,0.05);

  // 대표 표본 하나(같은 모집단 N(0,1)에서 뽑은 3집단, n=6) — 짝비교 실연산용
  var DEMO_RNG=LCG(90000);
  var DEMO_G1=[], DEMO_G2=[], DEMO_G3=[];
  (function(){ var i; for(i=0;i<6;i++) DEMO_G1.push(+randNormal(DEMO_RNG).toFixed(3));
    for(i=0;i<6;i++) DEMO_G2.push(+randNormal(DEMO_RNG).toFixed(3));
    for(i=0;i<6;i++) DEMO_G3.push(+randNormal(DEMO_RNG).toFixed(3)); })();
  var DEMO_AB=ttest2(DEMO_G1,DEMO_G2), DEMO_BC=ttest2(DEMO_G2,DEMO_G3), DEMO_AC=ttest2(DEMO_G1,DEMO_G3);

  // 1종 오류 누적 시뮬레이션: H0이 참인 세계(세 집단 모두 N(0,1), n=6)에서 REPL회 반복
  var REPL=1200, FALSEPOS=0;
  (function(){
    for(var r=0;r<REPL;r++){
      var rng=LCG(90000+r*7919), g1=[],g2=[],g3=[],i;
      for(i=0;i<6;i++) g1.push(randNormal(rng));
      for(i=0;i<6;i++) g2.push(randNormal(rng));
      for(i=0;i<6;i++) g3.push(randNormal(rng));
      var pAB=ttest2(g1,g2).p, pBC=ttest2(g2,g3).p, pAC=ttest2(g1,g3).p;
      if(pAB<0.05||pBC<0.05||pAC<0.05) FALSEPOS++;
    }
  })();
  var EMP_RATE=FALSEPOS/REPL, TH_RATE=1-Math.pow(0.95,3);

  // ══════════ 54.2: 이원배치 고정 데이터 (학습법 × 사전지식) ══════════
  var CELL2=[
    [ [65,68,63,70], [72,75,70,77] ],
    [ [78,82,76,80], [74,77,71,76] ]
  ];
  var METHOD_NAME=['강의식','토론식'], LEVEL_NAME=['사전지식 낮음','사전지식 높음'];
  var ANOVA2=anova2(CELL2);
  var FCRIT_A=Fcrit(ANOVA2.dfA,ANOVA2.dfE,0.05), FCRIT_B=Fcrit(ANOVA2.dfB,ANOVA2.dfE,0.05), FCRIT_AB=Fcrit(ANOVA2.dfAB,ANOVA2.dfE,0.05);

  // ══════════ 54.3: 이항분포 + 두 비율검정 고정 데이터 ══════════
  var BN=15, BP=0.12, BK=1;
  var BIN_EXACT=binomCDF(BN,BK,BP);
  var BIN_MU=BN*BP, BIN_SG=Math.sqrt(BN*BP*(1-BP));
  var BIN_ZCC=(BK+0.5-BIN_MU)/BIN_SG;
  var BIN_APPROX=cdfZ(BIN_ZCC);
  var PROP1=propTest2(25,200,6,150);

  // ══════════ 54.4: KS 적합도 검정 고정 데이터 ══════════
  var KS_SAMP=[3,5,6,8,9,11,12,14,16,19,23,30];
  var KS_MEAN=10;
  function expCDF(x){ return 1-Math.exp(-x/KS_MEAN); }
  var KS_N=KS_SAMP.length;
  var KS_D=0, KS_AT=0, KS_ATI=0;
  (function(){
    for(var i=0;i<KS_N;i++){
      var Fx=expCDF(KS_SAMP[i]), Fm=i/KS_N, Fp=(i+1)/KS_N;
      var d1=Math.abs(Fp-Fx), d2=Math.abs(Fx-Fm);
      if(d1>KS_D){ KS_D=d1; KS_AT=KS_SAMP[i]; KS_ATI=i; }
      if(d2>KS_D){ KS_D=d2; KS_AT=KS_SAMP[i]; KS_ATI=i; }
    }
  })();
  var KS_P=kolmogorovP(KS_D,KS_N);
  var KS_CRIT=kolmogorovCrit(KS_N,0.05);

  // ══════════ 54.5: 맥니마 + 대응연속자료(이상값) 고정 데이터 ══════════
  var MC_A=40, MC_B=8, MC_C=22, MC_D=30; // a=둘다있음, b=전만있음, c=후만있음, d=둘다없음
  var MC_R=mcnemar(MC_B,MC_C);

  var D14=[-5,-6,-7,-8,-4,-6,-9,-5,-7,-6,-5,-8,-7,45];
  var BEFORE14=[62,58,65,70,55,60,68,57,63,59,54,66,61,56];
  var AFTER14=BEFORE14.map(function(b,i){ return b+D14[i]; });
  var PT_14=pairedT(D14);
  var WX_14=wilcoxonSigned(D14);

  // ── 공용: 프레임(축) ──
  function frame(px0,px1,pTop,pBot,xlab,ylab){
    return function(ctx){
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      if(xlab){ ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(xlab, (px0+px1)/2, pBot+18); }
      if(ylab){ ctx.save(); ctx.translate(px0-24,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(ylab,0,0); ctx.restore(); }
    };
  }
  function judgeBox(ctx,x,y,w,h,ok,text){
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=ok?GRN:RED; ctx.lineWidth=1.5;
    roundRect(ctx,x,y,w,h,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle=ok?GRN:RED; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
    ctx.fillText(text, x+12, y+h/2+4);
  }

  var scenes = [

  // ══════════ 1. 다중비교의 함정과 일원배치 분산분석 ══════════
  { id:'bda54_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code0=[
        {t:'g1, g2, g3 = sample(pop, 6) × 3', dim:true},
        {t:'p1 = ttest_ind(g1, g2).pvalue', hl:'ttest_ind'},
        {t:'p2 = ttest_ind(g2, g3).pvalue', hl:'ttest_ind'},
        {t:'p3 = ttest_ind(g1, g3).pvalue', hl:'ttest_ind'},
        {t:'any(p < .05 for p in [p1,p2,p3])', hl:'any'}
      ];
      var code1=[
        {t:'from scipy.stats import f_oneway', hl:'f_oneway'},
        {t:'F, p = f_oneway(A, B, C)', hl:'f_oneway'},
        {t:'# SST = SSB(집단간) + SSW(집단내)', dim:true},
        {t:'# F = MSB / MSW', dim:true},
        {t:'p < 0.05', hl:'p < 0.05'}
      ];
      var code=(s.step<=1)?code0:code1;
      var act=(s.step===0)?null:(s.step===1?[1,2,3,4]:(s.step===2?2:[1,3]));
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step<=1?'multi_ttest.py':'anova_oneway.py', act);
      var ry=codeBot+20;
      ctx.textAlign='left';

      if(s.step===0){
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('학습법 A·B·C — 사실 세 집단 모두 같은 모집단(평균 0)에서', W*0.04, ry);
        ctx.fillText('n=6씩 뽑았을 뿐입니다. 겉보기엔 조금씩 달라 보입니다.', W*0.04, ry+18);
        var g0=[DEMO_G1,DEMO_G2,DEMO_G3], nm0=['A','B','C'], col0=[BLU,GLD,GRN];
        var bx0=W*0.49, bx1=W*0.965, rh0=54, y0=40;
        frame(bx0,bx1,y0-8,y0+3*rh0-8,'값 (모두 N(0,1)에서 추출)',null)(ctx);
        function PXd(v){ return bx0+(v+3)/6*(bx1-bx0); }
        for(i=0;i<3;i++){
          var yy=y0+i*rh0+22;
          ctx.fillStyle=col0[i]; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText(nm0[i]+'집단', bx0-2, yy-16);
          g0[i].forEach(function(v){ ctx.beginPath(); ctx.arc(PXd(v),yy,3.6,0,7); ctx.fill(); });
          var m=mean(g0[i]);
          ctx.strokeStyle=col0[i]; ctx.lineWidth=2.4;
          ctx.beginPath(); ctx.moveTo(PXd(m),yy-14); ctx.lineTo(PXd(m),yy+14); ctx.stroke();
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=col0[i];
          ctx.fillText('평균 '+m.toFixed(2), PXd(m)+8, yy-16);
        }
      } else if(s.step===1){
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('짝지어 t검정을 3번 하면, 정말 차이가 없어도 우연히 유의한 쌍이', W*0.04, ry);
        ctx.fillText('하나쯤 나올 수 있습니다 — 위 표본으로 실제 계산한 결과:', W*0.04, ry+18);
        var py=ry+42;
        var rows=[['A-B',DEMO_AB],['B-C',DEMO_BC],['A-C',DEMO_AC]];
        rows.forEach(function(r,ri){
          var sig=r[1].p<0.05;
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=sig?RED:TXT;
          ctx.fillText(r[0]+': t='+r[1].t.toFixed(2)+'  p='+r[1].p.toFixed(3)+(sig?'  ← 유의!':''), W*0.04, py+ri*18);
        });
        var bx0=W*0.49, bx1=W*0.965, bTop=40, bBot=210;
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(REPL+'회 반복 실험 — "적어도 하나가 우연히 유의(p<.05)"했던 비율', bx0, bTop-8);
        var vals=[{name:'실제 시뮬레이션\n(REPL='+REPL+'회)',v:EMP_RATE,col:GRN},{name:'이론적 근사\n1-(1-.05)³',v:TH_RATE,col:GLD},{name:'단일 검정 기준\nα=0.05',v:0.05,col:DIM}];
        var bw=(bx1-bx0)/3*0.5, maxv=0.20, bh=140;
        vals.forEach(function(v,vi){
          var xk=bx0+vi*(bx1-bx0)/3+(bx1-bx0)/3*0.25-bw/2;
          var hh=(v.v/maxv)*bh;
          ctx.fillStyle=v.col; ctx.fillRect(xk, bBot-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          var lines=v.name.split('\n');
          ctx.fillText(lines[0], xk+bw/2, bBot+14); ctx.fillText(lines[1], xk+bw/2, bBot+27);
          ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col;
          ctx.fillText((v.v*100).toFixed(1)+'%', xk+bw/2, bBot-hh-8);
        });
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx1,bBot); ctx.stroke();
      } else if(s.step===2){
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('그래서 세 집단을 "한 번에" 비교하는 정식 방법이 분산분석입니다.', W*0.04, ry);
        ctx.fillText('실제 학습법 점수(A/B/C, n=6씩)로 총제곱합을 쪼갭니다:', W*0.04, ry+18);
        var py=ry+40;
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('전체평균 = '+ANOVA1.grand.toFixed(2), W*0.04, py);
        var bx0=W*0.49, bx1=W*0.90, bTop=44, bBot=200, bw=90;
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('총제곱합의 분해 (SST = SSB + SSW)', bx0, bTop-10);
        var maxSS=ANOVA1.sst*1.08, hUnit=(bBot-bTop)/maxSS;
        // SST 단일 막대
        ctx.fillStyle='rgba(199,157,255,0.45)'; ctx.strokeStyle=PUR; ctx.lineWidth=1.2;
        var hT=ANOVA1.sst*hUnit;
        ctx.fillRect(bx0, bBot-hT, bw, hT); ctx.strokeRect(bx0, bBot-hT, bw, hT);
        ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.fillStyle=PUR; ctx.textAlign='center';
        ctx.fillText('SST='+ANOVA1.sst.toFixed(1), bx0+bw/2, bBot-hT-8);
        // SSB+SSW 스택 막대
        var bx2=bx0+bw+50;
        var hB=ANOVA1.ssb*hUnit, hW=ANOVA1.ssw*hUnit;
        ctx.fillStyle='rgba(255,178,122,0.5)'; ctx.strokeStyle=ORG;
        ctx.fillRect(bx2, bBot-hB, bw, hB); ctx.strokeRect(bx2, bBot-hB, bw, hB);
        ctx.fillStyle='rgba(122,184,255,0.45)'; ctx.strokeStyle=BLU;
        ctx.fillRect(bx2, bBot-hB-hW, bw, hW); ctx.strokeRect(bx2, bBot-hB-hW, bw, hW);
        ctx.fillStyle=ORG; ctx.font='11px ui-monospace,Menlo,monospace';
        ctx.fillText('SSB='+ANOVA1.ssb.toFixed(1)+'(집단간)', bx2+bw/2, bBot-hB/2+4);
        ctx.fillStyle=BLU;
        ctx.fillText('SSW='+ANOVA1.ssw.toFixed(1)+'(집단내)', bx2+bw/2, bBot-hB-hW/2+4);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx1,bBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('집단간 변동이 클수록, 집단내 변동(오차) 대비 "진짜 차이"라는 근거가 커집니다', bx0-6, bBot+22);
      } else {
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('MSB='+ANOVA1.msb.toFixed(2)+'÷ MSW='+ANOVA1.msw.toFixed(2)+' → F = '+ANOVA1.F.toFixed(2), W*0.04, ry);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('df = ('+ANOVA1.dfb+', '+ANOVA1.dfw+')  F_crit(0.05) = '+FCRIT_1.toFixed(2), W*0.04, ry+22);
        ctx.fillStyle=(ANOVA1.p<0.001)?GRN:TXT;
        ctx.fillText('p = '+(ANOVA1.p<1e-6? ANOVA1.p.toExponential(2) : ANOVA1.p.toFixed(4))+' (F분포 수치적분)', W*0.04, ry+42);

        var bx0=W*0.49, bx1=W*0.965, pTop=34, pBot=190;
        frame(bx0,bx1,pTop,pBot,'F 값',null)(ctx);
        var fmax=8;
        function FX(v){ return bx0+Math.min(v,fmax)/fmax*(bx1-bx0); }
        ctx.strokeStyle=ROSE; ctx.lineWidth=2; ctx.beginPath();
        for(i=0;i<=200;i++){ var x=0.05+fmax*i/200, y=pBot-Fpdf(x,ANOVA1.dfb,ANOVA1.dfw)*220;
          if(i===0) ctx.moveTo(FX(x),y); else ctx.lineTo(FX(x),y); }
        ctx.stroke();
        // F_crit 이후 기각역 음영
        ctx.fillStyle='rgba(240,136,138,0.28)'; ctx.beginPath(); ctx.moveTo(FX(FCRIT_1),pBot);
        for(i=0;i<=60;i++){ var xx=FCRIT_1+(fmax-FCRIT_1)*i/60; ctx.lineTo(FX(xx), pBot-Fpdf(xx,ANOVA1.dfb,ANOVA1.dfw)*220); }
        ctx.lineTo(FX(fmax),pBot); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(FX(FCRIT_1),pTop); ctx.lineTo(FX(FCRIT_1),pBot); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('F_crit='+FCRIT_1.toFixed(2), FX(FCRIT_1)+4, pTop+10);
        ctx.fillStyle=RED; ctx.textAlign='right';
        ctx.fillText('실제 F='+ANOVA1.F.toFixed(1)+' → 그림 밖(오른쪽)', bx1, pTop+24);

        judgeBox(ctx, bx0, pBot+18, bx1-bx0, 34, true, 'F='+ANOVA1.F.toFixed(2)+' > F_crit='+FCRIT_1.toFixed(2)+' → H₀ 기각: 세 학습법의 평균이 같지 않습니다');
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (다중비교 위험 → 시뮬레이션 → SS분해 → F검정)', true);
      E.big('다중비교의 함정과 일원배치 분산분석', '세 집단을 비교할 때 t검정을 세 번(A-B, B-C, A-C) 하고 싶은 유혹이 있습니다. 하지만 실제로 아무 차이가 없는 세계에서(모두 N(0,1)) n=6씩 뽑아 이 짓을 '+REPL+'번 반복 시뮬레이션한 결과, <b>적어도 하나가 우연히 유의했던 비율은 '+(EMP_RATE*100).toFixed(1)+'%</b>였습니다 — 검정 하나의 유의수준 5%보다 훨씬 큽니다(독립을 가정한 이론적 근사는 '+(TH_RATE*100).toFixed(1)+'%). <b>분산분석(ANOVA)</b>은 이 문제를 세 집단을 "한 번에" 비교해 피합니다: 총제곱합 SST='+ANOVA1.sst.toFixed(2)+'를 집단간 SSB='+ANOVA1.ssb.toFixed(2)+'와 집단내 SSW='+ANOVA1.ssw.toFixed(2)+'로 실제로 쪼개고, F=MSB/MSW='+ANOVA1.F.toFixed(2)+'를 F_crit='+FCRIT_1.toFixed(2)+'와 비교합니다. F가 훨씬 크므로(p≈0) 귀무가설을 기각합니다 — 단, ANOVA는 "적어도 하나가 다르다"까지만 말해 줄 뿐, 어느 쌍이 다른지는 사후검정(다중비교 보정)이 별도로 필요합니다.'); }
  },

  // ══════════ 2. 이원배치 분산분석과 교호작용 ══════════
  { id:'bda54_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i,j;
      var code=[
        {t:'model = ols("score ~ C(method)*C(level)",', hl:'C(method)*C(level)'},
        {t:'            data=df).fit()', dim:true},
        {t:'anova_lm(model, typ=2)', hl:'anova_lm'},
        {t:'# SS_A, SS_B, SS_AB(교호작용), SS_잔차', dim:true},
        {t:'# F = MS_효과 / MS_잔차', dim:true}
      ];
      var act=(s.step===0)?null:(s.step===1?[2,3]:(s.step===2?[2,4]:0));
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'anova_twoway.py', act);
      var ry=codeBot+20;
      ctx.textAlign='left';

      if(s.step===0){
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('학습법(강의식/토론식) × 사전지식(낮음/높음) — 2×2, 셀당 n=4', W*0.04, ry);
        var gx=W*0.49, gy=32, cw=100, rh=38, lw=64;
        ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle='rgba(255,122,184,0.14)'; ctx.fillRect(gx,gy,lw+cw*2,rh*0.9);
        ctx.fillStyle=ROSE;
        for(j=0;j<2;j++) ctx.fillText(LEVEL_NAME[j], gx+lw+j*cw+cw/2, gy+18);
        for(i=0;i<2;i++){
          var ry2=gy+rh*0.9+i*rh;
          ctx.fillStyle=(i%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
          ctx.fillRect(gx,ry2,lw+cw*2,rh);
          ctx.fillStyle=ROSE; ctx.font='600 12px sans-serif'; ctx.fillText(METHOD_NAME[i], gx+lw/2, ry2+rh/2+4);
          for(j=0;j<2;j++){
            var cx=gx+lw+j*cw;
            ctx.fillStyle=TXT; ctx.font='11px ui-monospace,Menlo,monospace';
            ctx.fillText(CELL2[i][j].join(', '), cx+cw/2, ry2+16);
            ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace';
            ctx.fillText('평균 '+ANOVA2.meanCell[i][j].toFixed(1), cx+cw/2, ry2+32);
          }
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('전체평균 = '+ANOVA2.grand.toFixed(3)+' — 강의식은 사전지식↑일수록 오르고, 토론식은 반대로 내려갑니다', gx-8, gy+rh*0.9+2*rh+24);
      } else if(s.step===1){
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('총제곱합을 요인 A(학습법)·B(사전지식)·교호작용 AB·잔차로 분해합니다', W*0.04, ry);
        var bx0=W*0.49, bx1=W*0.965, bTop=44, bBot=210, bw=64, gap=36;
        var items=[{n:'SST',v:ANOVA2.SST,col:PUR},{n:'SSA\n(학습법)',v:ANOVA2.SSA,col:BLU},{n:'SSB\n(사전지식)',v:ANOVA2.SSB,col:GLD},{n:'SSAB\n(교호작용)',v:ANOVA2.SSAB,col:ORG},{n:'SSE\n(잔차)',v:ANOVA2.SSE,col:DIM}];
        var maxv=ANOVA2.SST*1.1, hUnit=(bBot-bTop)/maxv;
        items.forEach(function(it,ii){
          var xk=bx0+ii*(bw+gap);
          var hh=it.v*hUnit;
          ctx.fillStyle=it.col; ctx.globalAlpha=0.55; ctx.fillRect(xk,bBot-hh,bw,hh); ctx.globalAlpha=1;
          ctx.strokeStyle=it.col; ctx.lineWidth=1.2; ctx.strokeRect(xk,bBot-hh,bw,hh);
          ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.fillStyle=it.col; ctx.textAlign='center';
          ctx.fillText(it.v.toFixed(1), xk+bw/2, bBot-hh-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          var lns=it.n.split('\n');
          ctx.fillText(lns[0], xk+bw/2, bBot+14);
          if(lns[1]) ctx.fillText(lns[1], xk+bw/2, bBot+27);
        });
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx0+5*(bw+gap)-gap,bBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('SST = SSA + SSB + SSAB + SSE  =  '+ANOVA2.SSA.toFixed(1)+' + '+ANOVA2.SSB.toFixed(1)+' + '+ANOVA2.SSAB.toFixed(1)+' + '+ANOVA2.SSE.toFixed(1), bx0, bBot+48);
      } else if(s.step===2){
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('각 제곱합을 자유도로 나눠 F = MS효과/MS잔차, p는 F분포 수치적분:', W*0.04, ry);
        var rows=[
          {n:'학습법(A)', F:ANOVA2.FA, df:ANOVA2.dfA, p:ANOVA2.pA, crit:FCRIT_A},
          {n:'사전지식(B)', F:ANOVA2.FB, df:ANOVA2.dfB, p:ANOVA2.pB, crit:FCRIT_B},
          {n:'교호작용(AB)', F:ANOVA2.FAB, df:ANOVA2.dfAB, p:ANOVA2.pAB, crit:FCRIT_AB}
        ];
        var py=ry+26;
        rows.forEach(function(r,ri){
          var sig=r.p<0.05;
          ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillStyle=sig?GRN:RED; ctx.textAlign='left';
          ctx.fillText(r.n+': F('+r.df+','+ANOVA2.dfE+')='+r.F.toFixed(2)+'  F_crit='+r.crit.toFixed(2)+'  p='+(r.p<0.001?r.p.toExponential(1):r.p.toFixed(4)), W*0.04, py+ri*38);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(sig?'유의함 (p<0.05)':'유의하지 않음 (p≥0.05)', W*0.04, py+ri*38+16);
        });
        var bx0=W*0.49, bx1=W*0.965, bTop=44, bBot=210;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('F값 비교 (파선=각 효과의 F_crit)', bx0, bTop-10);
        var fmax=Math.max(ANOVA2.FA,ANOVA2.FB,ANOVA2.FAB)*1.15;
        function FX2(v){ return Math.min(v/fmax,1)*(bx1-bx0-60); }
        var rowh=48;
        rows.forEach(function(r,ri){
          var yy=bTop+16+ri*rowh;
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(bx0,yy,bx1-bx0-60,14);
          var sig=r.p<0.05;
          ctx.fillStyle=sig?'rgba(126,224,176,0.55)':'rgba(240,136,138,0.5)';
          ctx.fillRect(bx0,yy,FX2(r.F),14);
          ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath();
          ctx.moveTo(bx0+FX2(r.crit),yy-3); ctx.lineTo(bx0+FX2(r.crit),yy+17); ctx.stroke();
          ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText('F='+r.F.toFixed(1), bx0+FX2(r.F)+6, yy+11);
        });
      } else {
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('교호작용이 유의(p='+(ANOVA2.pAB<0.001?ANOVA2.pAB.toExponential(1):ANOVA2.pAB.toFixed(4))+') — 두 학습법의 효과가', W*0.04, ry);
        ctx.fillText('사전지식 수준에 따라 서로 반대로 움직입니다(선이 교차):', W*0.04, ry+18);
        var bx0=W*0.49, bx1=W*0.90, pTop=40, pBot=210;
        frame(bx0,bx1,pTop,pBot,'사전지식 낮음 → 높음','점수 평균')(ctx);
        var ymin=60, ymax=85;
        function IY(v){ return pBot-(v-ymin)/(ymax-ymin)*(pBot-pTop); }
        var x1=bx0+ (bx1-bx0)*0.25, x2=bx0+(bx1-bx0)*0.75;
        ['강의식','토론식'].forEach(function(nm,mi){
          var col=(mi===0)?BLU:ORG;
          var y1=IY(ANOVA2.meanCell[mi][0]), y2=IY(ANOVA2.meanCell[mi][1]);
          ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
          ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x1,y1,4.2,0,7); ctx.fill();
          ctx.beginPath(); ctx.arc(x2,y2,4.2,0,7); ctx.fill();
          ctx.font='600 11.5px sans-serif'; ctx.textAlign='left';
          ctx.fillText(nm, x2+8, y2+(mi===0?-8:16));
        });
        judgeBox(ctx, bx0, pBot+22, bx1-bx0, 30, true, '학습법 효과가 사전지식에 따라 달라짐 → 두 요인을 따로 못 봅니다');
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (자료 → SS분해 → F검정 → 교호작용 그림)', true);
      E.big('이원배치 분산분석과 교호작용', '요인이 두 개(학습법·사전지식)라면 각각 따로 일원배치를 두 번 하는 대신, <b>이원배치 분산분석</b>으로 두 요인의 효과와 <b>교호작용(두 요인이 서로에게 미치는 영향)</b>까지 한 번에 봅니다. 총제곱합 SST='+ANOVA2.SST.toFixed(1)+'을 SSA(학습법)='+ANOVA2.SSA.toFixed(1)+', SSB(사전지식)='+ANOVA2.SSB.toFixed(1)+', SSAB(교호작용)='+ANOVA2.SSAB.toFixed(1)+', SSE(잔차)='+ANOVA2.SSE.toFixed(1)+'로 실제로 쪼갠 결과, 학습법의 주효과는 유의(F='+ANOVA2.FA.toFixed(2)+', p='+ANOVA2.pA.toFixed(4)+')하지만 사전지식의 주효과는 유의하지 않습니다(F='+ANOVA2.FB.toFixed(2)+', p='+ANOVA2.pB.toFixed(3)+'). 그런데 <b>교호작용은 강하게 유의</b>합니다(F='+ANOVA2.FAB.toFixed(2)+', p='+(ANOVA2.pAB<0.001?ANOVA2.pAB.toExponential(1):ANOVA2.pAB.toFixed(4))+') — 강의식은 사전지식이 높을수록 점수가 오르지만(66.5→73.5), 토론식은 오히려 낮을수록 점수가 높습니다(79→74.5). 교호작용이 유의하면 "학습법의 효과는 얼마인가"라는 질문 자체가 성립하지 않습니다 — 답이 "사전지식에 따라 다르다"이기 때문입니다. 주효과만 보고 교호작용을 놓치면 완전히 잘못된 결론(예: "학습법은 별 차이 없다")에 이를 수 있습니다.'); }
  },

  // ══════════ 3. 이항분포 확률과 두 모집단 비율 검정 ══════════
  { id:'bda54_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code0=[
        {t:'from scipy.stats import binom', hl:'binom'},
        {t:'binom.pmf(1, n=15, p=0.12)', hl:'.pmf'},
        {t:'binom.cdf(1, n=15, p=0.12)  # 누적', hl:'.cdf'}
      ];
      var code1=[
        {t:'mu, sg = n*p, sqrt(n*p*(1-p))', hl:'sqrt'},
        {t:'norm.cdf((1+0.5-mu)/sg)  # 연속성수정', hl:'norm.cdf'}
      ];
      var code2=[
        {t:'pp = (x1+x2)/(n1+n2)  # 합동비율', hl:'합동비율'},
        {t:'se = sqrt(pp*(1-pp)*(1/n1+1/n2))', hl:'sqrt'},
        {t:'z = (p1-p2)/se', hl:'z'},
        {t:'p = 2*(1-norm.cdf(abs(z)))', hl:'norm.cdf'}
      ];
      var code=(s.step===0)?code0:(s.step===1?code0.concat(code1):code2);
      var act=(s.step===0)?1:(s.step===1?4:[0,2,3]);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step<3? (s.step<2?'binom_exact.py':'prop_test.py'):'prop_test.py', act);
      var ry=codeBot+18;
      ctx.textAlign='left';

      if(s.step===0 || s.step===1){
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('불량률 p='+BP+', n='+BN+'개 검사 — P(X≤'+BK+') = '+BIN_EXACT.toFixed(4)+' (정확)', W*0.04, ry);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('C('+BN+','+BK+')×p^'+BK+'×(1-p)^'+(BN-BK)+' + C('+BN+',0)×(1-p)^'+BN+' — 조합으로 직접 계산', W*0.04, ry+18);
        if(s.step===1){
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU;
          ctx.fillText('정규근사 ≈ '+BIN_APPROX.toFixed(4)+'  (μ='+BIN_MU.toFixed(2)+', σ='+BIN_SG.toFixed(3)+')', W*0.04, ry+40);
          ctx.fillStyle=RED;
          ctx.fillText('오차 = |'+BIN_EXACT.toFixed(4)+' − '+BIN_APPROX.toFixed(4)+'| = '+Math.abs(BIN_EXACT-BIN_APPROX).toFixed(4), W*0.04, ry+60);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText('n이 작고 p가 0.5에서 멀수록(왜곡된 분포) 근사 오차가 커집니다', W*0.04, ry+80);
        }
        var bx0=W*0.49, bx1=W*0.965, bTop=30, bBot=220;
        frame(bx0,bx1,bTop,bBot,null,'확률')(ctx);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('불량 개수 k →', bx0, bTop-8);
        var KMAX=9, bw=(bx1-bx0)/(KMAX+1);
        var maxp=0; for(i=0;i<=KMAX;i++){ var pp=binomPMF(BN,i,BP); if(pp>maxp) maxp=pp; }
        for(i=0;i<=KMAX;i++){
          var pmf=binomPMF(BN,i,BP), hh=(pmf/maxp)*(bBot-bTop-10);
          ctx.fillStyle=(i<=BK)?'rgba(126,224,176,0.55)':'rgba(122,184,255,0.35)';
          ctx.strokeStyle=(i<=BK)?GRN:BLU; ctx.lineWidth=1;
          ctx.fillRect(bx0+i*bw+2, bBot-hh, bw-4, hh); ctx.strokeRect(bx0+i*bw+2, bBot-hh, bw-4, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(''+i, bx0+i*bw+bw/2, bBot+14);
        }
        if(s.step===1){
          // 정규곡선을 같은 세로축(막대 최고높이 기준)으로 스케일
          var normPeak=1/(BIN_SG*Math.sqrt(2*Math.PI));
          ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
          for(i=0;i<=140;i++){ var xv2=-0.5+(KMAX+1.5)*i/140;
            var dens=Math.exp(-(xv2-BIN_MU)*(xv2-BIN_MU)/(2*BIN_SG*BIN_SG))/(BIN_SG*Math.sqrt(2*Math.PI));
            var yy3=bBot-(dens/normPeak)*(bBot-bTop-10);
            var xx3=bx0+(xv2+0.5)*bw;
            if(i===0) ctx.moveTo(xx3,yy3); else ctx.lineTo(xx3,yy3);
          }
          ctx.stroke();
          ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='left';
          ctx.fillText('― 정규근사 곡선(같은 세로축)', bx0+150, bTop-8);
        }
      } else {
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('두 공장의 불량률이 정말 다른가? — 공장1: 25/200, 공장2: 6/150', W*0.04, ry);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('합동비율 = '+PROP1.pp.toFixed(4)+'  SE = '+PROP1.se.toFixed(4), W*0.04, ry+24);
        ctx.fillStyle=(PROP1.p<0.05)?GRN:RED;
        ctx.fillText('z = '+PROP1.z.toFixed(3)+'  p = '+PROP1.p.toFixed(4), W*0.04, ry+44);

        var bx0=W*0.49, bx1=W*0.80, bTop=40, bBot=170, bw=90;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('표본 불량률 비교', bx0, bTop-10);
        var maxr=0.16, hUnit=(bBot-bTop)/maxr;
        var props=[{n:'공장1\n25/200',v:PROP1.p1,col:BLU},{n:'공장2\n6/150',v:PROP1.p2,col:ORG}];
        props.forEach(function(pr,pi){
          var xk=bx0+pi*(bw+40), hh=pr.v*hUnit;
          ctx.fillStyle=pr.col; ctx.globalAlpha=0.55; ctx.fillRect(xk,bBot-hh,bw,hh); ctx.globalAlpha=1;
          ctx.strokeStyle=pr.col; ctx.strokeRect(xk,bBot-hh,bw,hh);
          ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillStyle=pr.col; ctx.textAlign='center';
          ctx.fillText((pr.v*100).toFixed(1)+'%', xk+bw/2, bBot-hh-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          var lns=pr.n.split('\n');
          ctx.fillText(lns[0], xk+bw/2, bBot+14); ctx.fillText(lns[1], xk+bw/2, bBot+27);
        });
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx0+2*bw+40,bBot); ctx.stroke();

        var gx0=W*0.84, gx1=W*0.965;
        ctx.save(); ctx.translate(gx0,105); ctx.rotate(-Math.PI/2);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText('|z| 게이지', 0, -10);
        ctx.restore();
        var gy0=40, gy1=200, zmax=4;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(gx0,gy0,18,gy1-gy0);
        var zh=Math.min(Math.abs(PROP1.z),zmax)/zmax*(gy1-gy0);
        ctx.fillStyle=(PROP1.p<0.05)?'rgba(126,224,176,0.6)':'rgba(240,136,138,0.55)';
        ctx.fillRect(gx0,gy1-zh,18,zh);
        var zcy=gy1-1.96/zmax*(gy1-gy0);
        ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(gx0-4,zcy); ctx.lineTo(gx0+22,zcy); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('1.96', gx0+24, zcy+3);

        judgeBox(ctx, bx0, bBot+42, gx1-bx0, 30, PROP1.p<0.05, PROP1.p<0.05? 'p='+PROP1.p.toFixed(4)+'<0.05 → 두 공장의 불량률은 다릅니다' : 'p≥0.05 → 다르다고 말할 근거 부족');
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (이항 정확계산 → 정규근사 오차 → 두 비율 검정)', true);
      E.big('이항분포 확률과 두 모집단 비율 검정', '불량률 p='+BP+'인 공정에서 n='+BN+'개를 검사할 때 "불량이 '+BK+'개 이하일 확률"은 조합 C(n,k)로 직접 계산하는 <b>이항 정확확률</b>입니다: P(X≤'+BK+') = '+BIN_EXACT.toFixed(4)+'. 정규분포로 근사하면(연속성 수정 포함) '+BIN_APPROX.toFixed(4)+'로, 오차는 '+Math.abs(BIN_EXACT-BIN_APPROX).toFixed(4)+'입니다 — n이 작고 p가 한쪽으로 치우칠수록 정규근사가 눈에 띄게 어긋납니다. 이 근사가 바로 <b>두 모집단 비율 검정</b>의 토대입니다: 공장1(25/200=12.5%)과 공장2(6/150=4.0%)의 불량률 차이가 진짜인지, 두 표본을 합친 <b>합동비율</b> '+PROP1.pp.toFixed(4)+'로 표준오차를 구해 z='+PROP1.z.toFixed(2)+'를 계산하면 p='+PROP1.p.toFixed(4)+' — 0.05보다 작으므로 두 공장의 불량률은 우연이라 보기 어려운 차이입니다.'); }
  },

  // ══════════ 4. 분포 적합도 검정 — 콜모고로프-스미르노프 ══════════
  { id:'bda54_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'from scipy.stats import kstest, expon', hl:'kstest'},
        {t:'D, p = kstest(x, expon(scale=10).cdf)', hl:'kstest'},
        {t:'# D = max|Fn(x) - F(x)|', dim:true},
        {t:'p < 0.05  # 이 분포와 다른가?', hl:'p < 0.05'}
      ];
      var act=(s.step===0)?0:(s.step===1?2:[1,3]);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ks_test.py', act);
      var ry=codeBot+18;
      ctx.textAlign='left';
      ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('부품 수명(개월) 12건 — "평균 10개월 지수분포를 따른다"는', W*0.04, ry);
      ctx.fillText('가정을 검정합니다(모수는 표본에서 추정하지 않음):', W*0.04, ry+18);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText(KS_SAMP.join(', '), W*0.04, ry+42);

      var bx0=W*0.49, bx1=W*0.965, pTop=30, pBot=210, xmax=32;
      frame(bx0,bx1,pTop,pBot,'수명(개월)','누적확률')(ctx);
      function PX(x){ return bx0+x/xmax*(bx1-bx0); }
      function PY(v){ return pBot-v*(pBot-pTop); }
      // 이론 CDF 곡선
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=160;i++){ var x=xmax*i/160, y=expCDF(x); if(i===0) ctx.moveTo(PX(x),PY(y)); else ctx.lineTo(PX(x),PY(y)); }
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('― 이론 F(x) = 1−e^(−x/10)', bx0, pTop-8);
      // 경험적 계단함수
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(PX(0),PY(0));
      for(i=0;i<KS_N;i++){
        ctx.lineTo(PX(KS_SAMP[i]),PY(i/KS_N));
        ctx.lineTo(PX(KS_SAMP[i]),PY((i+1)/KS_N));
      }
      ctx.lineTo(PX(xmax),PY(1));
      ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='11px sans-serif';
      ctx.fillText('┄ 경험분포 Fn(x) (계단)', bx0+180, pTop-8);
      for(i=0;i<KS_N;i++){ ctx.fillStyle=TXT; ctx.beginPath(); ctx.arc(PX(KS_SAMP[i]),pBot,2.6,0,7); ctx.fill(); }

      if(s.step>=1){
        var yLo=Math.min(KS_ATI/KS_N, expCDF(KS_AT)), yHi=Math.max((KS_ATI+1)/KS_N, expCDF(KS_AT));
        ctx.strokeStyle=RED; ctx.lineWidth=2.4; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(PX(KS_AT),PY(KS_ATI/KS_N)); ctx.lineTo(PX(KS_AT),PY((KS_ATI+1)/KS_N)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('D='+KS_D.toFixed(3)+' at x='+KS_AT, PX(KS_AT)+8, PY((KS_ATI+0.5)/KS_N)+4);
      }
      if(s.step>=2){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(KS_P<0.05)?RED:GRN;
        ctx.fillText('p = '+KS_P.toFixed(4)+' (콜모고로프 급수 근사)  D_crit(0.05,n='+KS_N+') = '+KS_CRIT.toFixed(3), W*0.04, ry+64);
        judgeBox(ctx, W*0.04, ry+82, (bx1-W*0.04), 30, KS_P>=0.05, KS_P>=0.05? 'D='+KS_D.toFixed(3)+' < D_crit='+KS_CRIT.toFixed(3)+' → 지수분포(평균10)에 부합한다고 볼 근거 충분' : 'D가 임계값을 넘어 이 분포라고 보기 어렵습니다');
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (분포 겹쳐보기 → 최대거리 D → 판정)', true);
      E.big('분포 적합도 검정 — 콜모고로프-스미르노프', '이 자료가 정말 평균 10개월인 지수분포를 따를까요? <b>경험분포함수</b> Fn(x)(표본을 크기순으로 세워 만든 계단 모양 누적확률)와 <b>이론분포</b> F(x)=1−e^(−x/10)를 겹쳐 그리고, 둘 사이의 <b>가장 큰 수직 거리 D</b>를 실제로 잽니다 — 이 표본에서는 x='+KS_AT+' 지점에서 D='+KS_D.toFixed(4)+'가 최댓값입니다. D가 클수록 "이 분포가 아니다"라는 증거가 강해지는데, D의 확률분포(콜모고로프 분포)를 급수 Σ(−1)^(k−1)e^(−2k²λ²)로 근사해 p='+KS_P.toFixed(4)+'를 얻습니다. 유의수준 0.05에서 임계값 D_crit='+KS_CRIT.toFixed(3)+'보다 D가 작으므로(작은 편이므로), 이 표본은 "평균 10개월 지수분포"라는 가정과 <b>충돌하지 않습니다</b> — 가정을 기각할 근거가 부족하다는 뜻이지, 그 가정이 참이라고 증명된 것은 아닙니다.'); }
  },

  // ══════════ 5. 대응자료 검정 — 맥니마와 비모수로 가는 길 ══════════
  { id:'bda54_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code0=[
        {t:'from statsmodels.stats.contingency_tables', dim:true},
        {t:'  import mcnemar', hl:'mcnemar'},
        {t:'mcnemar(table, correction=True)', hl:'mcnemar'},
        {t:'# 오직 b, c(바뀐 칸)만 씁니다', dim:true}
      ];
      var code1=[
        {t:'d = after - before', hl:'after - before'},
        {t:'ttest_rel(after, before)  # 대응 t', hl:'ttest_rel'},
        {t:'wilcoxon(after, before)   # 순위 기반', hl:'wilcoxon'}
      ];
      var code=(s.step<=1)?code0:code1;
      var act=(s.step===0)?null:(s.step===1?[1,2]:(s.step===2?1:2));
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step<=1?'mcnemar_test.py':'paired_vs_rank.py', act);
      var ry=codeBot+18;
      ctx.textAlign='left';

      if(s.step===0 || s.step===1){
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('광고 시청 전후, 같은 사람 100명의 구매의향(있음/없음) 변화', W*0.04, ry);
        var gx=W*0.49, gy=32, cw=110, rh=40, lw=90;
        ctx.font='600 11.5px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle='rgba(255,122,184,0.14)'; ctx.fillRect(gx,gy,lw+cw*2,rh*0.85);
        ctx.fillStyle=ROSE;
        ctx.fillText('후: 있음', gx+lw+cw/2, gy+18); ctx.fillText('후: 없음', gx+lw+cw+cw/2, gy+18);
        var rows=[['전: 있음',MC_A,MC_B],['전: 없음',MC_C,MC_D]];
        rows.forEach(function(r,ri){
          var yy=gy+rh*0.85+ri*rh;
          ctx.fillStyle=(ri%2)?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.05)';
          ctx.fillRect(gx,yy,lw+cw*2,rh);
          ctx.fillStyle=ROSE; ctx.font='600 11.5px sans-serif'; ctx.fillText(r[0], gx+lw/2, yy+rh/2+4);
          var isDiscordant=[false,true];
          [r[1],r[2]].forEach(function(v,ci){
            var cx=gx+lw+ci*cw;
            var discordant=(ri===0&&ci===1)||(ri===1&&ci===0);
            if(s.step>=1 && discordant){ ctx.fillStyle='rgba(240,136,138,0.22)'; ctx.fillRect(cx+1,yy+1,cw-2,rh-2); }
            ctx.fillStyle=discordant?RED:TXT; ctx.font='600 15px ui-monospace,Menlo,monospace';
            ctx.fillText(''+v, cx+cw/2, yy+rh/2+5);
          });
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        var fy2=gy+rh*0.85+2*rh+20;
        if(s.step===0){
          ctx.fillText('대각선(있음→있음 '+MC_A+', 없음→없음 '+MC_D+')은 "변화 없음" — 방향 판단에 무의미합니다', gx-16, fy2);
          ctx.fillText('바뀐 칸만(있음→없음 '+MC_B+', 없음→있음 '+MC_C+') 진짜 변화를 담고 있습니다', gx-16, fy2+18);
        } else {
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
          ctx.fillText('통계량 = (|b−c|−1)²/(b+c) = (|'+MC_B+'−'+MC_C+'|−1)²/('+MC_B+'+'+MC_C+') = '+MC_R.stat.toFixed(3), gx-16, fy2);
          ctx.fillStyle=(MC_R.p<0.05)?GRN:RED;
          ctx.fillText('p = '+MC_R.p.toFixed(4)+' (χ²₁ 분포, 수치적분)', gx-16, fy2+22);
          judgeBox(ctx, gx-16, fy2+38, lw+cw*2, 28, MC_R.p<0.05, MC_R.p<0.05?'변화가 한쪽으로 쏠렸습니다(있음→없음보다 없음→있음이 더 많음)':'변화 방향에 치우침이 없습니다');
        }
      } else {
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('이번엔 연속형 대응자료 — 프로그램 전후 스트레스지수 14명', W*0.04, ry);
        var bx0=W*0.49, bx1=W*0.965, pTop=30, pBot=170, xmax=14;
        frame(bx0,bx1,pTop,pBot,null,'전후 차이(after−before)')(ctx);
        function PXp(i2){ return bx0+(i2+0.5)/14*(bx1-bx0); }
        var ymin=-15, ymax=48;
        function PYp(v){ return pBot-(v-ymin)/(ymax-ymin)*(pBot-pTop); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,PYp(0)); ctx.lineTo(bx1,PYp(0)); ctx.stroke();
        for(i=0;i<14;i++){
          var isOut=(D14[i]>0);
          ctx.fillStyle=isOut?RED:BLU;
          ctx.fillRect(PXp(i)-6, Math.min(PYp(0),PYp(D14[i])), 12, Math.abs(PYp(D14[i])-PYp(0)));
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('13명 감소(파랑), 1명 +45 급증(빨강) — 정규성이 의심되는 이상값', bx0, pTop-8);

        if(s.step===2){
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
          ctx.fillText('평균차 = '+PT_14.m.toFixed(2)+'  표준편차 = '+PT_14.s.toFixed(2)+' (이상값 탓에 매우 큼)', bx0, pBot+26);
          ctx.fillStyle=(PT_14.p<0.05)?GRN:RED;
          ctx.fillText('대응표본 t = '+PT_14.t.toFixed(3)+'  df='+PT_14.df+'  p = '+PT_14.p.toFixed(4), bx0, pBot+46);
          judgeBox(ctx, bx0, pBot+58, bx1-bx0, 28, false, 't검정: p='+PT_14.p.toFixed(3)+' ≥ 0.05 → 유의한 변화 없음 (이상값이 분산을 부풀림)');
        } else {
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
          ctx.fillText('순위합 W₊='+WX_14.Wp+'  W₋='+WX_14.Wm+' (크기 순위만 사용, 값 자체는 안 씀)', bx0, pBot+26);
          ctx.fillStyle=(WX_14.p<0.05)?GRN:RED;
          ctx.fillText('윌콕슨 z = '+WX_14.z.toFixed(3)+'  p = '+WX_14.p.toFixed(4), bx0, pBot+46);
          judgeBox(ctx, bx0, pBot+58, bx1-bx0, 28, true, '윌콕슨: p='+WX_14.p.toFixed(3)+' < 0.05 → 유의한 감소! 결론이 t검정과 갈립니다');
        }
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (맥니마 표 → 판정 → 이상값 자료 → t vs 윌콕슨)', true);
      E.big('대응자료 검정 — 맥니마와 비모수로 가는 길', '같은 대상을 전후로 비교하는 <b>대응 이분형 자료</b>는 2×2표에서 <b>바뀐 칸(b,c)만</b>이 진짜 변화를 말해 줍니다 — 있음→있음('+MC_A+')과 없음→없음('+MC_D+')은 변화가 없었으니 방향 판단에 아무 정보가 없습니다. 맥니마 통계량 (|b−c|−1)²/(b+c) = '+MC_R.stat.toFixed(3)+', p='+MC_R.p.toFixed(4)+'로 변화가 한쪽으로 쏠렸음을 확인합니다. 그런데 대응자료가 <b>연속형</b>이고 <b>정규성이 깨지면</b> 이야기가 달라집니다 — 14명의 스트레스지수 변화에서 13명은 줄었지만 1명이 +45로 튀자, 대응표본 t검정은 이 이상값이 분산을 부풀려 p='+PT_14.p.toFixed(3)+'(유의하지 않음)를 내놓습니다. 하지만 값 대신 <b>순위</b>만 쓰는 윌콕슨 부호순위 검정은 이상값의 크기에 휘둘리지 않아 p='+WX_14.p.toFixed(3)+'(유의함)를 내놓습니다 — <b>같은 데이터, 정반대 결론</b>입니다. 전제(정규성)를 실제로 의심할 이유가 있으면(이상값·심한 비대칭) 순위 기반 비모수 검정으로 넘어가야 하고, 그 선택이 결론 자체를 바꿀 수 있다는 것이 이 장의 핵심입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
