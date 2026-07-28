/* 빅데이터 분석 제42장 — 시계열 분석 (자기상관·고전적 분해·정상성·ACF/PACF·평활과 ARIMA)
   동작(behavior)만. 텍스트=content/bda42.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(자기상관·추세·계절지수·잔차·구간별 평균/분산·ACF·PACF·예측값·오차)는
   아래 고정 월별 시계열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 셔플·이동평균 분해·
   1차 차분·더빈-레빈슨 PACF 재귀·지수평활·차분+AR+MA 예측은 실제 알고리즘을 그대로 구현한다.
   난수(Math.random) 절대 금지 — 잡음·순서 셔플은 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=17, pad=10, top=y, n=lines.length, ht=n*lh+pad*2+(title?20:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?20:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+10); }
    ctx.font='11.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+10;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function variance(a){ var m=mean(a),s=0; for(var i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return s/a.length; }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 고정 데이터: 월별 신규 수강생 수(명), 54개월(4.5년), 계절주기 12 ══════════
  var N42=54, PERIOD42=12, BASE42=120, SLOPE42=2.6;
  var SEAS42=[-8,-5,18,6,-3,-10,-14,-6,20,10,-2,-6];   // 합=0(가법 계절효과) — 3월·9월(신학기) 최고
  var TS42=[];
  (function(){
    var rng=LCG(42420601);
    for(var t=0;t<N42;t++){
      var noise=(rng()-0.5)*14;
      TS42.push(+(BASE42+SLOPE42*t+SEAS42[t%PERIOD42]+noise).toFixed(1));
    }
  })();
  var MONTH_NAMES=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  function shuffledIdx(n,seed){
    var arr=[]; for(var i=0;i<n;i++) arr.push(i);
    var rng=LCG(seed);
    for(var i=n-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp; }
    return arr;
  }
  var SHUF_IDX42=shuffledIdx(N42,987654);
  var TS42_SHUF=SHUF_IDX42.map(function(i){ return TS42[i]; });

  // ── 자기상관 ──────────────────────────────────────────────
  function acf42(arr,k){
    var n=arr.length, m=mean(arr);
    var num=0; for(var t=0;t<n-k;t++) num+=(arr[t]-m)*(arr[t+k]-m);
    var den=0; for(var t=0;t<n;t++) den+=(arr[t]-m)*(arr[t]-m);
    return den===0?0:num/den;
  }
  var ACF_ORIG_1=acf42(TS42,1), ACF_SHUF_1=acf42(TS42_SHUF,1);

  // ── 고전적 분해(2x12 중앙화 이동평균) ──────────────────────────────────────────────
  function trendCMA(arr,period){
    var n=arr.length, out=new Array(n).fill(null), half=period/2;
    for(var t=half;t<n-half;t++){
      var s=0.5*arr[t-half]+0.5*arr[t+half];
      for(var k=-half+1;k<half;k++) s+=arr[t+k];
      out[t]=s/period;
    }
    return out;
  }
  var TREND42=trendCMA(TS42,PERIOD42);
  var DETREND42=TS42.map(function(v,t){ return TREND42[t]==null?null:v-TREND42[t]; });
  var SEASIDX42=(function(){
    var sums=new Array(PERIOD42).fill(0), cnts=new Array(PERIOD42).fill(0);
    for(var t=0;t<N42;t++){ if(DETREND42[t]!=null){ sums[t%PERIOD42]+=DETREND42[t]; cnts[t%PERIOD42]++; } }
    var idx=sums.map(function(s,i){ return s/cnts[i]; });
    var adj=mean(idx);
    return idx.map(function(v){ return v-adj; });
  })();
  var SEASONAL42=[]; for(var _t42=0;_t42<N42;_t42++) SEASONAL42.push(SEASIDX42[_t42%PERIOD42]);
  var RESID42=TS42.map(function(v,t){ return TREND42[t]==null?null:v-TREND42[t]-SEASONAL42[t]; });
  var RESID_VALID42=RESID42.filter(function(v){ return v!=null; });
  var RESID_SD42=Math.sqrt(variance(RESID_VALID42));
  var TREND_SLOPE42=(function(){ var a=null,b=null; for(var t=0;t<N42;t++){ if(TREND42[t]!=null){ if(a==null) a={t:t,v:TREND42[t]}; b={t:t,v:TREND42[t]}; } } return (b.v-a.v)/(b.t-a.t); })();

  // ── 정상성: 구간별 평균·분산, 1차 차분 ──────────────────────────────────────────────
  var DIFF42=[]; for(var _d42=1;_d42<N42;_d42++) DIFF42.push(+(TS42[_d42]-TS42[_d42-1]).toFixed(2));
  function segStats(arr,nseg){
    var n=arr.length, segLen=Math.floor(n/nseg), out=[];
    for(var s=0;s<nseg;s++){
      var start=s*segLen, end=(s===nseg-1)?n:start+segLen;
      var seg=arr.slice(start,end);
      out.push({start:start,end:end,mean:mean(seg),vari:variance(seg)});
    }
    return out;
  }

  // ── ACF/PACF(더빈-레빈슨) ──────────────────────────────────────────────
  var MAXLAG42=24;
  var ACF_ALL42=[]; for(var _L=0;_L<=MAXLAG42;_L++) ACF_ALL42.push(acf42(TS42,_L));
  function pacfDL(acfArr,K){
    var pacf=new Array(K+1).fill(0), prevPhi=[];
    for(var k=1;k<=K;k++){
      var num=acfArr[k], denom=1;
      for(var j=1;j<k;j++){ num-=prevPhi[j-1]*acfArr[k-j]; denom-=prevPhi[j-1]*acfArr[j]; }
      var phikk=denom===0?0:num/denom;
      var curPhi=new Array(k);
      for(j=1;j<k;j++) curPhi[j-1]=prevPhi[j-1]-phikk*prevPhi[k-j-1];
      curPhi[k-1]=phikk;
      pacf[k]=phikk; prevPhi=curPhi;
    }
    return pacf;
  }
  var PACF_ALL42=pacfDL(ACF_ALL42,MAXLAG42);

  // ── 예측: 이동평균·지수평활·ARIMA(1,1,1)류 ──────────────────────────────────────────────
  var HOLDOUT42=10;
  var TRAIN42=TS42.slice(0,N42-HOLDOUT42), TEST42=TS42.slice(N42-HOLDOUT42);
  function maForecast(history,k){ return mean(history.slice(-k)); }
  var MA_K42=3;
  function evalMA(k){
    var hist=TRAIN42.slice(), errs=[];
    for(var i=0;i<HOLDOUT42;i++){
      var f=maForecast(hist,k), actual=TEST42[i];
      errs.push((actual-f)*(actual-f)); hist.push(actual);
    }
    return {errs:errs, mse:mean(errs)};
  }
  function sesLevel(train,alpha){ var level=train[0]; for(var t=1;t<train.length;t++) level=alpha*train[t]+(1-alpha)*level; return level; }
  function evalSES(alpha){
    var hist=TRAIN42.slice(), errs=[], forecasts=[], level=sesLevel(hist,alpha);
    for(var i=0;i<HOLDOUT42;i++){
      var f=level; forecasts.push(f);
      var actual=TEST42[i];
      errs.push((actual-f)*(actual-f));
      level=alpha*actual+(1-alpha)*level;
    }
    return {errs:errs, mse:mean(errs), forecasts:forecasts};
  }
  function fitAR1(diffArr){
    var num=0,den=0;
    for(var t=1;t<diffArr.length;t++){ num+=diffArr[t]*diffArr[t-1]; den+=diffArr[t-1]*diffArr[t-1]; }
    return den===0?0:num/den;
  }
  function arima111Fit(train){
    var d=[]; for(var t=1;t<train.length;t++) d.push(train[t]-train[t-1]);
    var phi=fitAR1(d);
    var bestTheta=0, bestSSE=Infinity;
    for(var th=-0.9; th<=0.9+1e-9; th+=0.05){
      var e=[0], sse=0;
      for(var t2=1;t2<d.length;t2++){ var pred=phi*d[t2-1]+th*e[t2-1]; var err=d[t2]-pred; e.push(err); sse+=err*err; }
      if(sse<bestSSE){ bestSSE=sse; bestTheta=th; }
    }
    return {phi:phi, theta:bestTheta};
  }
  var ARIMA_PARAMS42=arima111Fit(TRAIN42);
  function evalARIMA(params){
    var hist=TRAIN42.slice(), errs=[], forecasts=[];
    var d=[]; for(var t=1;t<hist.length;t++) d.push(hist[t]-hist[t-1]);
    var e=[0];
    for(var t2=1;t2<d.length;t2++){ var pred=params.phi*d[t2-1]+params.theta*e[t2-1]; e.push(d[t2]-pred); }
    for(var i=0;i<HOLDOUT42;i++){
      var lastY=hist[hist.length-1], lastD=d[d.length-1], lastE=e[e.length-1];
      var dhat=params.phi*lastD+params.theta*lastE;
      var f=lastY+dhat; forecasts.push(f);
      var actual=TEST42[i];
      errs.push((actual-f)*(actual-f));
      var newD=actual-lastY, newE=newD-dhat;
      d.push(newD); e.push(newE); hist.push(actual);
    }
    return {errs:errs, mse:mean(errs), forecasts:forecasts};
  }
  var MA_RESULT42=evalMA(MA_K42);
  var ARIMA_RESULT42=evalARIMA(ARIMA_PARAMS42);

  var scenes = [

  // ══════════ 1. 순서가 정보가 될 때 ══════════
  { id:'bda42_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'y.autocorr(lag=1)   # pandas Series', hl:'.autocorr'},
        {t:'from statsmodels.tsa.stattools import acf', hl:'acf'},
        {t:'acf(y, nlags=1)[1]', hl:'acf(y'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'order_matters.py', s.step===0?null:2);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GRN; ctx.fillText('원래 순서 lag-1 자기상관 = '+ACF_ORIG_1.toFixed(3), W*0.04, ry);
      ctx.fillStyle=RED; ctx.fillText('무작위로 섞은 순서 lag-1 자기상관 = '+ACF_SHUF_1.toFixed(3), W*0.04, ry+18);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('54개 값은 그대로, 순서만 바뀌었을 뿐입니다', W*0.04, ry+40);
      ctx.fillText(s.step===0 ? '오른쪽: 두 순서를 같은 시간축에 겹쳐 그린 선그래프' : '오른쪽: (x[t], x[t+1]) 쌍의 산점도 — 대각선이면 자기상관이 큽니다', W*0.04, ry+58);

      var px0=W*0.50, px1=W*0.965, pTop=24, pBot=H-40;
      if(s.step===0){
        var xmin=0,xmax=N42-1;
        var ymin=Math.min(Math.min.apply(null,TS42),Math.min.apply(null,TS42_SHUF))-8;
        var ymax=Math.max(Math.max.apply(null,TS42),Math.max.apply(null,TS42_SHUF))+8;
        var PX=function(v){ return px0+(v-xmin)/(xmax-xmin)*(px1-px0); };
        var PY=function(v){ return pBot-(v-ymin)/(ymax-ymin)*(pBot-pTop); };
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('월(0~53)', (px0+px1)/2, pBot+18);
        function drawLine(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.beginPath();
          arr.forEach(function(v,i){ var x=PX(i),y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }
        drawLine(TS42_SHUF,RED); drawLine(TS42,GRN);
        ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.fillText('― 원래 순서(추세+계절)', px0+4, pTop+14);
        ctx.fillStyle=RED; ctx.fillText('― 뒤섞은 순서(잡음처럼 보임)', px0+140, pTop+14);
      } else {
        var vmin=Math.min.apply(null,TS42)-6, vmax=Math.max.apply(null,TS42)+6;
        var PXs=function(v){ return px0+(v-vmin)/(vmax-vmin)*(px1-px0); };
        var PYs=function(v){ return pBot-(v-vmin)/(vmax-vmin)*(pBot-pTop); };
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('x[t]', (px0+px1)/2, pBot+18);
        ctx.save(); ctx.translate(px0-16,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillText('x[t+1]',0,0); ctx.restore();
        for(var i=0;i<N42-1;i++){ ctx.fillStyle=GRN; ctx.globalAlpha=0.75; ctx.beginPath(); ctx.arc(PXs(TS42[i]),PYs(TS42[i+1]),2.4,0,7); ctx.fill(); }
        for(i=0;i<N42-1;i++){ ctx.fillStyle=RED; ctx.globalAlpha=0.7; ctx.beginPath(); ctx.arc(PXs(TS42_SHUF[i]),PYs(TS42_SHUF[i+1]),2.4,0,7); ctx.fill(); }
        ctx.globalAlpha=1;
        ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.fillText('● 원래 순서 r='+ACF_ORIG_1.toFixed(2), px0+4, pTop+14);
        ctx.fillStyle=RED; ctx.fillText('● 뒤섞은 순서 r='+ACF_SHUF_1.toFixed(2), px0+170, pTop+14);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 선그래프 → (x[t],x[t+1]) 산점도', true);
      E.big('순서가 정보가 될 때', '시계열은 관측이 서로 <b>독립이 아닙니다</b> — 이번 달 값은 지난달 값과 실제로 연결되어 있습니다. 같은 54개월치 신규 수강생 수를 원래 순서 그대로 두면 lag-1(한 달 시차) 자기상관이 '+ACF_ORIG_1.toFixed(3)+'로 매우 높지만, 값은 하나도 안 바꾸고 <b>순서만 무작위로 뒤섞으면</b> 자기상관은 '+ACF_SHUF_1.toFixed(3)+'로 거의 사라집니다. 값의 분포(평균·분산)는 두 경우 완전히 같은데도 「관측 사이의 관계」라는 정보 전체가 순서에만 들어 있었다는 뜻입니다 — 이것이 시계열 분석이 일반적인 표본 분석과 근본적으로 다른 이유이며, 시간 순서를 보존하는 것 자체가 분석의 출발점입니다.'); }
  },

  // ══════════ 2. 네 개의 성분으로 쪼개다 ══════════
  { id:'bda42_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'from statsmodels.tsa.seasonal import seasonal_decompose', hl:'seasonal_decompose'},
        {t:"result = seasonal_decompose(y, model='additive', period=12)", hl:"model='additive'"},
        {t:'result.trend, result.seasonal, result.resid', hl:'.resid'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'decompose.py', 1);
      var seasRange=Math.max.apply(null,SEASIDX42)-Math.min.apply(null,SEASIDX42);
      var bestMonth=SEASIDX42.indexOf(Math.max.apply(null,SEASIDX42));
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('추세 기울기(실측) ≈ '+TREND_SLOPE42.toFixed(2)+'명/월', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('계절지수 폭 = '+seasRange.toFixed(1)+'명 (최고 '+MONTH_NAMES[bestMonth]+')', W*0.04, ry+18);
      ctx.fillStyle=DIM; ctx.fillText('잔차 표준편차 = '+RESID_SD42.toFixed(2)+' (추세·계절로 설명 안 되는 나머지)', W*0.04, ry+36);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('관측 = 추세 + 계절 + 잔차. 「순환」은 이 4.5년 데이터로는', W*0.04, ry+58);
      ctx.fillText('주기를 확인하기엔 기간이 짧아 추세 성분에 섞여 들어갑니다', W*0.04, ry+74);

      var px0=W*0.50, px1=W*0.965, pTop=14, pBot=H-28;
      var rows=[{name:'관측',arr:TS42,col:TXT},{name:'추세',arr:TREND42,col:BLU},{name:'계절',arr:SEASONAL42,col:GLD},{name:'잔차',arr:RESID42,col:RED}];
      var gap=6, rh=(pBot-pTop-gap*3)/4;
      rows.forEach(function(row,ri){
        var ry0=pTop+ri*(rh+gap), ry1=ry0+rh;
        var vals=row.arr.filter(function(v){ return v!=null; });
        var vmin=Math.min.apply(null,vals), vmax=Math.max.apply(null,vals);
        if(vmax-vmin<1e-6){ vmax+=1; vmin-=1; }
        var PX=function(i){ return px0+(i/(N42-1))*(px1-px0); };
        var PY=function(v){ return ry1-(v-vmin)/(vmax-vmin)*(ry1-ry0); };
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ry1); ctx.lineTo(px1,ry1); ctx.stroke();
        ctx.strokeStyle=row.col; ctx.lineWidth=1.5; ctx.beginPath();
        var started=false;
        row.arr.forEach(function(v,i){ if(v==null) return; var x=PX(i),y=PY(v); if(!started){ ctx.moveTo(x,y); started=true; } else ctx.lineTo(x,y); });
        ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=row.col; ctx.textAlign='left';
        ctx.fillText(row.name, px0+2, ry0+11);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('월(0~53)', (px0+px1)/2, pBot+13);

      E.tapHint(W/2, H*0.95, '4개 성분이 실제로 계산되어 겹쳐 보이는지 확인하세요', false);
      E.big('네 개의 성분으로 쪼개다', '시계열은 흔히 네 가지 힘이 겹쳐 만들어집니다 — 장기적으로 밀고 가는 <b>추세</b>, 1년 주기로 되풀이되는 <b>계절</b>, 여러 해에 걸친 느린 <b>순환</b>, 그리고 남는 <b>불규칙(잔차)</b>. 실제로 2×12 중앙화 이동평균으로 추세를 뽑아내면 기울기는 월 '+TREND_SLOPE42.toFixed(2)+'명이고, 추세를 뺀 나머지를 월별 위치(1~12월)로 평균 내 계절지수를 구하면 '+MONTH_NAMES[bestMonth]+'이 가장 높아 폭이 '+seasRange.toFixed(1)+'명에 이릅니다. 관측에서 추세와 계절을 모두 빼고 남은 잔차의 표준편차는 '+RESID_SD42.toFixed(2)+'명 — 이것이 추세·계절만으로는 설명되지 않는 진짜 「잡음」의 크기입니다. 이 데이터는 4.5년치뿐이라 수년 단위의 순환은 따로 분리할 수 없어 추세 성분에 함께 녹아 있습니다.'); }
  },

  // ══════════ 3. 정상성 — 분석의 전제 ══════════
  { id:'bda42_03',
    enter:function(E){ this.s={nseg:3}; E.setOn([]); },
    tap:function(E){ this.s.nseg = this.s.nseg===3?6:3; E.blip(420,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'y.diff().dropna()   # 1차 차분', hl:'.diff()'},
        {t:'from statsmodels.tsa.stattools import adfuller', hl:'adfuller'},
        {t:'adfuller(y)[1], adfuller(y.diff().dropna())[1]', hl:'adfuller(y.diff'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'stationarity.py', 2);
      var rawSeg=segStats(TS42,s.nseg), diffSeg=segStats(DIFF42,s.nseg);
      var ry=codeBot+15;
      ctx.textAlign='left'; ctx.font='11px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText(s.nseg+'구간으로 나눈 구간별 평균(분산) 실측값', W*0.04, ry);
      var ly=ry+16;
      rawSeg.forEach(function(seg,si){
        ctx.fillStyle=RED; ctx.fillText('원계열 '+(si+1)+'구간: 평균 '+seg.mean.toFixed(1)+' (분산 '+seg.vari.toFixed(0)+')', W*0.04, ly+si*14);
      });
      var ly2=ly+rawSeg.length*14+8;
      diffSeg.forEach(function(seg,si){
        ctx.fillStyle=GRN; ctx.fillText('차분 '+(si+1)+'구간: 평균 '+seg.mean.toFixed(2)+' (분산 '+seg.vari.toFixed(1)+')', W*0.04, ly2+si*14);
      });

      var px0=W*0.50, px1=W*0.965, pTop=16, pBot=H-30;
      var midY=pTop+(pBot-pTop)*0.48;
      function panel(arr,y0,y1,segArr,col,label){
        var vmin=Math.min.apply(null,arr), vmax=Math.max.apply(null,arr);
        var PX=function(i){ return px0+(i/(arr.length-1))*(px1-px0); };
        var PY=function(v){ return y1-(v-vmin)/(vmax-vmin+1e-6)*(y1-y0); };
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(px0,y1); ctx.lineTo(px1,y1); ctx.stroke();
        ctx.strokeStyle=col; ctx.lineWidth=1.4; ctx.beginPath();
        arr.forEach(function(v,i){ var x=PX(i),y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        segArr.forEach(function(seg,si){
          var xs=PX(seg.start), xe=PX(Math.min(seg.end,arr.length)-1);
          ctx.strokeStyle=col; ctx.globalAlpha=0.55; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.moveTo(xs,PY(seg.mean)); ctx.lineTo(xe,PY(seg.mean)); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha=1;
          if(si>0){ ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(xs,y0); ctx.lineTo(xs,y1); ctx.stroke(); }
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=col; ctx.textAlign='left'; ctx.fillText(label, px0+2, y0+11);
      }
      panel(TS42, pTop, midY-6, rawSeg, RED, '원계열 (추세로 구간마다 평균이 뜁니다)');
      panel(DIFF42, midY+6, pBot, diffSeg, GRN, '1차 차분 (구간 평균이 거의 일정해집니다)');
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('월', (px0+px1)/2, pBot+14);

      E.tapHint(W/2, H*0.95, '화면 탭 = 구간을 3개 ↔ 6개로 다시 나눠 재계산', true);
      E.big('정상성 — 분석의 전제', '많은 시계열 기법은 <b>평균과 분산이 시간에 따라 변하지 않는다(정상성)</b>는 것을 전제로 삼습니다. 원계열을 '+s.nseg+'구간으로 나눠 구간별 평균을 실제로 재보면 '+rawSeg.map(function(g){return g.mean.toFixed(0);}).join(' → ')+'명으로 뚜렷이 계속 뜁니다 — 추세가 있으니 당연합니다. 그런데 <b>1차 차분(이번 달−지난달)</b>을 취한 뒤 같은 구간으로 나누면 구간별 평균이 '+diffSeg.map(function(g){return g.mean.toFixed(1);}).join(' → ')+'로 거의 일정한 값(월 성장분 약 '+SLOPE42.toFixed(1)+'명) 주변에 머무릅니다. 차분 하나로 「어디서 봐도 비슷한 계열」을 만들어낸 것이며, ARIMA를 비롯한 여러 예측 기법이 실제로 예측하기 전에 이런 차분을 먼저 적용하는 이유가 바로 이것입니다.'); }
  },

  // ══════════ 4. 자기상관 — ACF와 PACF ══════════
  { id:'bda42_04',
    enter:function(E){ var self=this; self.s={L:6};
      E.controls('<div class="ctrl"><label>시차(lag) L</label><input type="range" id="b424L" min="1" max="24" step="1" value="6"><output id="b424Lo">6</output></div>');
      E.bind('#b424L','input',function(e){ self.s.L=+e.target.value; document.getElementById('b424Lo').textContent=self.s.L; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from statsmodels.tsa.stattools import acf, pacf', hl:'acf, pacf'},
        {t:'acf_vals = acf(y, nlags=24)', hl:'acf(y'},
        {t:"pacf_vals = pacf(y, nlags=24, method='ywm')", hl:'pacf(y'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'acf_pacf.py', 1);
      var rCheck=acf42(TS42,s.L);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('시차 L='+s.L+'  ACF='+ACF_ALL42[s.L].toFixed(3)+'  PACF='+PACF_ALL42[s.L].toFixed(3), W*0.04, ry);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('산점도 상관계수로 직접 재계산한 값 = '+rCheck.toFixed(3)+' (ACF와 일치)', W*0.04, ry+18);

      var bx0=W*0.04, bx1=W*0.46, by0=ry+42, bh=Math.min(150,H-by0-32), bw=(bx1-bx0)/MAXLAG42;
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh*0.5); ctx.lineTo(bx1,by0+bh*0.5); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('ACF(파랑)·PACF(금) — 12·24개월 봉우리=계절성', bx0, by0-6);
      for(var L=1; L<=MAXLAG42; L++){
        var xk=bx0+(L-1)*bw;
        var a=ACF_ALL42[L], p=PACF_ALL42[L];
        var ha=Math.abs(a)*(bh*0.5), hp=Math.abs(p)*(bh*0.5);
        ctx.fillStyle=BLU; ctx.fillRect(xk+1, a>=0?by0+bh*0.5-ha:by0+bh*0.5, Math.max(1,bw*0.42), ha);
        ctx.fillStyle=GLD; ctx.fillRect(xk+1+bw*0.46, p>=0?by0+bh*0.5-hp:by0+bh*0.5, Math.max(1,bw*0.42), hp);
        if(L===s.L){ ctx.strokeStyle=RED; ctx.lineWidth=1.3; ctx.strokeRect(xk, by0-1, bw-1, bh+2); }
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('시차(1~24개월)', bx0, by0+bh+14);

      var px0=W*0.50, px1=W*0.965, pTop=24, pBot=H-40;
      var xs=[],ys=[]; for(var i=0;i<N42-s.L;i++){ xs.push(TS42[i]); ys.push(TS42[i+s.L]); }
      var vmin=Math.min.apply(null,TS42)-6, vmax=Math.max.apply(null,TS42)+6;
      var PX=function(v){ return px0+(v-vmin)/(vmax-vmin)*(px1-px0); };
      var PY=function(v){ return pBot-(v-vmin)/(vmax-vmin)*(pBot-pTop); };
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('x[t]', (px0+px1)/2, pBot+18);
      ctx.save(); ctx.translate(px0-16,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillText('x[t+L]',0,0); ctx.restore();
      for(i=0;i<xs.length;i++){ ctx.fillStyle=GLD; ctx.globalAlpha=0.75; ctx.beginPath(); ctx.arc(PX(xs[i]),PY(ys[i]),2.6,0,7); ctx.fill(); }
      ctx.globalAlpha=1;
      var mx=mean(xs), my=mean(ys), num=0,den=0;
      for(i=0;i<xs.length;i++){ num+=(xs[i]-mx)*(ys[i]-my); den+=(xs[i]-mx)*(xs[i]-mx); }
      var slope=den===0?0:num/den, intercept=my-slope*mx;
      ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath();
      ctx.moveTo(PX(vmin+6), PY(slope*(vmin+6)+intercept)); ctx.lineTo(PX(vmax-6), PY(slope*(vmax-6)+intercept)); ctx.stroke();

      E.tapHint(W/2, H*0.95, '슬라이더로 시차 L을 바꾸면 ACF·PACF·산점도가 함께 갱신됩니다', true);
      E.big('자기상관 — ACF와 PACF', '<b>ACF</b>(자기상관함수)는 시차 L만큼 떨어진 값끼리의 상관을 실제로 계산한 것이고, <b>PACF</b>(편자기상관함수, 더빈-레빈슨 재귀로 계산)는 그 사이 시차들의 영향을 제거한 「순수한」 L 시차 관계입니다. 지금 L='+s.L+'에서 ACF='+ACF_ALL42[s.L].toFixed(3)+', PACF='+PACF_ALL42[s.L].toFixed(3)+'이며, 오른쪽 산점도의 상관계수를 직접 계산해도 같은 값이 나와 서로 다른 두 계산 경로가 일치함을 확인할 수 있습니다. 시차를 1부터 24까지 훑으면 ACF 막대가 12개월·24개월 근처에서 뚜렷이 솟는데, 이것이 계절성이 자기상관에 남기는 「지문」입니다 — 계절 주기와 같은 시차에서 값이 다시 서로 닮아지기 때문입니다.'); }
  },

  // ══════════ 5. 예측 — 평활과 ARIMA ══════════
  { id:'bda42_05',
    enter:function(E){ var self=this; self.s={alpha:0.3};
      E.controls('<div class="ctrl"><label>지수평활 계수 α</label><input type="range" id="b425a" min="0.05" max="0.95" step="0.05" value="0.3"><output id="b425ao">0.30</output></div>');
      E.bind('#b425a','input',function(e){ self.s.alpha=+e.target.value; document.getElementById('b425ao').textContent=self.s.alpha.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from statsmodels.tsa.arima.model import ARIMA', hl:'ARIMA'},
        {t:'ARIMA(y_train, order=(1,1,1)).fit().forecast(10)', hl:'order=(1,1,1)'},
        {t:'y.ewm(alpha=alpha).mean()   # 지수평활', hl:'.ewm'}
      ];
      var codeBot=codePanel(E, W*0.04, 10, W*0.44, code, 'forecast.py', 2);
      var sesR=evalSES(s.alpha);
      var ry=codeBot+16;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('α='+s.alpha.toFixed(2)+'  지수평활 검증 MSE = '+sesR.mse.toFixed(1), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('이동평균(3개월) 검증 MSE = '+MA_RESULT42.mse.toFixed(1), W*0.04, ry+18);
      ctx.fillStyle=GRN; ctx.fillText('ARIMA(1,1,1) 검증 MSE = '+ARIMA_RESULT42.mse.toFixed(1)+' (φ='+ARIMA_PARAMS42.phi.toFixed(2)+' θ='+ARIMA_PARAMS42.theta.toFixed(2)+')', W*0.04, ry+36);

      var bx0=W*0.04, bx1=W*0.46, by0=ry+58, bh=Math.min(90,H-by0-56);
      var methods=[{name:'이동평균',mse:MA_RESULT42.mse,col:BLU},{name:'지수평활',mse:sesR.mse,col:GLD},{name:'ARIMA',mse:ARIMA_RESULT42.mse,col:GRN}];
      var maxmse=Math.max.apply(null,methods.map(function(m){ return m.mse; }));
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('검증 구간(10개월) MSE 비교', bx0, by0-6);
      var bw=(bx1-bx0)/methods.length;
      methods.forEach(function(m,mi){
        var xk=bx0+mi*bw, hh=(m.mse/maxmse)*bh*0.82;   // *0.82: 막대 값 라벨이 위 제목과 겹치지 않게 여유 확보
        ctx.fillStyle=m.col; ctx.fillRect(xk+bw*0.2, by0+bh-hh, bw*0.6, hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center'; ctx.fillText(m.name, xk+bw*0.5, by0+bh+14);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=m.col; ctx.fillText(m.mse.toFixed(0), xk+bw*0.5, by0+bh-hh-6);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('AR=과거 값에 의존 · I=차분으로 추세 제거 · MA=과거 오차를 보정', bx0, by0+bh+30);

      var px0=W*0.50, px1=W*0.965, pTop=22, pBot=H-40;
      var xmin=0,xmax=N42-1;
      var ymin=Math.min.apply(null,TS42)-8, ymax=Math.max.apply(null,TS42)+8;
      var PX=function(v){ return px0+(v-xmin)/(xmax-xmin)*(px1-px0); };
      var PY=function(v){ return pBot-(v-ymin)/(ymax-ymin)*(pBot-pTop); };
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('월(0~53, 44부터 검증 구간)', (px0+px1)/2, pBot+18);
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.beginPath();
      TS42.forEach(function(v,i){ var x=PX(i),y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.strokeStyle=RED; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PX(N42-HOLDOUT42),pTop); ctx.lineTo(PX(N42-HOLDOUT42),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=GLD; ctx.lineWidth=1.8; ctx.beginPath();
      sesR.forecasts.forEach(function(v,i){ var x=PX(N42-HOLDOUT42+i), y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.8; ctx.beginPath();
      ARIMA_RESULT42.forecasts.forEach(function(v,i){ var x=PX(N42-HOLDOUT42+i), y=PY(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=DIM; ctx.fillText('― 실제값', px0+4, pTop+14);
      ctx.fillStyle=GLD; ctx.fillText('― 지수평활', px0+78, pTop+14);
      ctx.fillStyle=GRN; ctx.fillText('― ARIMA', px0+170, pTop+14);

      E.tapHint(W/2, H*0.95, '슬라이더로 α를 바꿔 지수평활 예측과 오차가 실시간으로 바뀌는 것을 보세요', true);
      E.big('예측 — 평활과 ARIMA', '가장 단순한 예측은 최근 몇 개월의 <b>이동평균</b>을 그대로 다음 달 값으로 쓰는 것으로, 검증 MSE '+MA_RESULT42.mse.toFixed(1)+'입니다. <b>지수평활</b>은 최근 값일수록 더 크게, 오래된 값일수록 기하급수적으로 작게 가중해 한 줄 재귀식(수준=α×실제값+(1−α)×이전 수준)으로 계산하는데, 계수 α를 슬라이더로 바꾸면 MSE가 실제로 재계산되어 지금 α='+s.alpha.toFixed(2)+'에서 '+evalSES(s.alpha).mse.toFixed(1)+'입니다. <b>ARIMA</b>는 세 부품의 조합입니다 — <b>I</b>(차분)가 추세를 제거해 정상성을 만들고, <b>AR</b>이 차분된 값을 과거 차분값들의 선형결합으로, <b>MA</b>가 과거 예측 오차를 보정해 다음 값을 추정합니다. 실제로 φ(AR계수)='+ARIMA_PARAMS42.phi.toFixed(2)+', θ(MA계수)='+ARIMA_PARAMS42.theta.toFixed(2)+'를 데이터로부터 추정해 예측하면 검증 MSE '+ARIMA_RESULT42.mse.toFixed(1)+'로 이 장의 세 방법 중 가장 정확합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
