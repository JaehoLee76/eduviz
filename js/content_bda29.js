/* 빅데이터 분석 제29장 — 예측 변수 중요도 측정
   동작(behavior)만. 텍스트=content/bda29.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(상관계수·집단분리도·표준화계수·트리 분할이득 누적·순열 중요도 평균표준편차·
   누수 변수 상관·R²)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 선형회귀는
   정규방정식을 가우스-조던 소거로 직접 풀고, 회귀트리는 분산감소 기반 실제 분할 탐색을,
   순열 중요도는 고정 시드 셔플을 반복해 성능 저하를 그대로 구현한다.
   난수(Math.random) 절대 금지 — 표본·순열·부트스트랩은 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
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

  // ── 수치 도구 ──────────────────────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function std(a){ var m=mean(a),s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/a.length); }
  function corr(a,b){ var ma=mean(a),mb=mean(b),sa=0,sb=0,sab=0,i; for(i=0;i<a.length;i++){ var da=a[i]-ma,db=b[i]-mb; sab+=da*db; sa+=da*da; sb+=db*db; } return sab/Math.sqrt(sa*sb); }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 고정 데이터: 28장과 같은 작업 140건 + 추가 예측 변수 ══════════
  var N29=140;
  var X1_29=[], X2_29=[], TSEC29=[];
  (function(){
    var rng=LCG(20260910);
    for(var i=0;i<N29;i++){
      var x1=1+5.0*Math.pow(rng(),1.4);
      var x2=1+180*Math.pow(rng(),2.0);
      var logT=-0.2+0.5*Math.log(x1+0.3)+0.72*Math.log(x2+1)+(rng()-0.5)*2.4;
      var t=Math.exp(logT);
      X1_29.push(+x1.toFixed(2)); X2_29.push(Math.round(x2)); TSEC29.push(+t.toFixed(2));
    }
  })();
  var X3_29=[],X4_29=[],X5_29=[],X6_29=[],X7_29=[],PROTO29=[];
  (function(){
    var rng=LCG(90210555);
    for(var i=0;i<N29;i++){
      X3_29.push(1+Math.round(rng()*9));
      X4_29.push(+(2+0.15*X2_29[i]+(rng()-0.5)*8).toFixed(2));
      X5_29.push(+((rng()-0.5)*10).toFixed(2));
      X6_29.push(+((rng()-0.5)*6).toFixed(2));
      X7_29.push(+((rng()-0.5)*6).toFixed(2));
    }
    for(i=0;i<N29;i++) PROTO29.push(X2_29[i]+(rng()-0.5)*120);
    var sorted=PROTO29.slice().sort(function(a,b){return a-b;});
    var q1=sorted[Math.floor(N29/3)], q2=sorted[Math.floor(2*N29/3)];
    for(i=0;i<N29;i++) PROTO29[i]=(PROTO29[i]<q1)?0:(PROTO29[i]<q2?1:2);
  })();
  var PROTONM=['A','B','C'];
  var FNAME29=['입력크기(x1)','반복수(x2)','우선순위(x3)','메모리요청(x4)','사용자이력(x5)','잡음1(x6)','잡음2(x7)'];
  var RAWCOLS29=[X1_29,X2_29,X3_29,X4_29,X5_29,X6_29,X7_29];
  var P29=RAWCOLS29.length;
  var ALLNAME29=FNAME29.concat(['프로토콜']);
  var CORR29=RAWCOLS29.map(function(col){ return corr(col,TSEC29); });

  var PGROUPS29=[[],[],[]]; for(var _pi=0;_pi<N29;_pi++) PGROUPS29[PROTO29[_pi]].push(TSEC29[_pi]);
  var PMEANS29=PGROUPS29.map(mean);
  var GRANDMEAN29=mean(TSEC29);
  var SSB29=0; PGROUPS29.forEach(function(g,gi){ SSB29+=g.length*(PMEANS29[gi]-GRANDMEAN29)*(PMEANS29[gi]-GRANDMEAN29); });
  var SST29=0; TSEC29.forEach(function(t){ SST29+=(t-GRANDMEAN29)*(t-GRANDMEAN29); });
  var ETA2_29=SSB29/SST29;

  // ── 다중 선형회귀(정규방정식, 가우스-조던 소거) ──────────────────────────
  function zeros2(r,c){ var M=[]; for(var i=0;i<r;i++) M.push(new Array(c).fill(0)); return M; }
  function matSolve(A,bVec){
    var n=A.length, M=[]; for(var i=0;i<n;i++) M.push(A[i].concat([bVec[i]]));
    for(var col=0;col<n;col++){
      var piv=col; for(i=col+1;i<n;i++) if(Math.abs(M[i][col])>Math.abs(M[piv][col])) piv=i;
      var tmp=M[col]; M[col]=M[piv]; M[piv]=tmp;
      var pv=M[col][col]; if(Math.abs(pv)<1e-12) pv=1e-12;
      for(var j=col;j<=n;j++) M[col][j]/=pv;
      for(i=0;i<n;i++){ if(i===col) continue; var f=M[i][col]; for(j=col;j<=n;j++) M[i][j]-=f*M[col][j]; }
    }
    return M.map(function(row){ return row[n]; });
  }
  function fitLinReg(Xmat,y,l2){
    var n=Xmat.length, p=Xmat[0].length, XtX=zeros2(p,p), Xty=new Array(p).fill(0);
    for(var i=0;i<n;i++){ for(var a=0;a<p;a++){ Xty[a]+=Xmat[i][a]*y[i]; for(var bc=0;bc<p;bc++) XtX[a][bc]+=Xmat[i][a]*Xmat[i][bc]; } }
    for(a=0;a<p;a++) XtX[a][a]+=l2;
    return matSolve(XtX,Xty);
  }
  function predictLR(beta,xi){ var s=0; for(var j=0;j<xi.length;j++) s+=beta[j]*xi[j]; return s; }
  function r2fn(pred,y){ var m=mean(y),ssr=0,sst=0; for(var i=0;i<y.length;i++){ ssr+=(y[i]-pred[i])*(y[i]-pred[i]); sst+=(y[i]-m)*(y[i]-m); } return 1-ssr/sst; }

  var MEANS29=[],STDS29=[],STDCOLS29=[];
  for(var j29=0;j29<P29;j29++){ var m29=mean(RAWCOLS29[j29]), s29=std(RAWCOLS29[j29]); MEANS29.push(m29); STDS29.push(s29); STDCOLS29.push(RAWCOLS29[j29].map(function(v){return (v-m29)/s29;})); }
  var protoB29=PROTO29.map(function(p){return p===1?1:0;}), protoC29=PROTO29.map(function(p){return p===2?1:0;});
  function buildDesign(dropSet){
    var Xd=[];
    for(var i=0;i<N29;i++){
      var row=[1];
      for(var j=0;j<P29;j++){ if(dropSet && dropSet.indexOf(j)>=0) continue; row.push(STDCOLS29[j][i]); }
      row.push(protoB29[i]); row.push(protoC29[i]);
      Xd.push(row);
    }
    return Xd;
  }
  var XDESIGN29=buildDesign(null);
  var BETAFULL29=fitLinReg(XDESIGN29,TSEC29,0.01);
  var PREDFULL29=XDESIGN29.map(function(xi){return predictLR(BETAFULL29,xi);});
  var R2FULL29=r2fn(PREDFULL29,TSEC29);
  function r2Without(dropIdx){
    var Xd=buildDesign([dropIdx]);
    var beta=fitLinReg(Xd,TSEC29,0.01);
    var pred=Xd.map(function(xi){return predictLR(beta,xi);});
    return r2fn(pred,TSEC29);
  }
  function r2WithoutBoth(i1,i2){
    var Xd=buildDesign([i1,i2]);
    var beta=fitLinReg(Xd,TSEC29,0.01);
    var pred=Xd.map(function(xi){return predictLR(beta,xi);});
    return r2fn(pred,TSEC29);
  }
  var R2_NOX1=r2Without(0), R2_NOX2=r2Without(1), R2_NOX4=r2Without(3), R2_NOX2X4=r2WithoutBoth(1,3);
  function simpleCoef(colIdx){
    var Xs=[]; for(var i=0;i<N29;i++) Xs.push([1,STDCOLS29[colIdx][i]]);
    var b=fitLinReg(Xs,TSEC29,0.001);
    return b[1];
  }
  var X2ALONE29=simpleCoef(1), X4ALONE29=simpleCoef(3);
  var COEFNAME29=FNAME29.concat(['프로토콜B','프로토콜C']);
  var STDCOEF29=BETAFULL29.slice(1); // 절편 제외, 순서: x1..x7, protoB, protoC

  // ── 회귀 트리(분산감소, depth<=4) + 분할이득 누적 중요도 ──────────────────────────
  var TREECOLS29=RAWCOLS29.concat([PROTO29]);
  var TP29=TREECOLS29.length;
  function variance29(idx,y){ if(idx.length===0) return 0; var vals=idx.map(function(i){return y[i];}); var m=mean(vals),s=0; vals.forEach(function(v){s+=(v-m)*(v-m);}); return s/idx.length; }
  var IMP29=new Array(TP29).fill(0);
  function buildRTree29(idx,depth,maxDepth,minLeaf){
    var n=idx.length;
    if(depth>=maxDepth||n<minLeaf) return {leaf:true,pred:mean(idx.map(function(i){return TSEC29[i];})),n:n};
    var baseVar=variance29(idx,TSEC29), bestGain=1e-9,bestFeat=-1,bestThresh=0,bestL=null,bestR=null;
    for(var f=0;f<TP29;f++){
      var vals=idx.map(function(i){return TREECOLS29[f][i];}).slice().sort(function(a,b){return a-b;});
      var uniq=[]; for(var vi=0;vi<vals.length;vi++) if(vi===0||vals[vi]!==vals[vi-1]) uniq.push(vals[vi]);
      for(var u=0;u<uniq.length-1;u++){
        var thresh=(uniq[u]+uniq[u+1])/2, L=[],R=[];
        idx.forEach(function(i){ if(TREECOLS29[f][i]<=thresh) L.push(i); else R.push(i); });
        if(L.length<3||R.length<3) continue;
        var childVar=(L.length*variance29(L,TSEC29)+R.length*variance29(R,TSEC29))/n;
        var gain=baseVar-childVar;
        if(gain>bestGain){ bestGain=gain; bestFeat=f; bestThresh=thresh; bestL=L; bestR=R; }
      }
    }
    if(bestFeat<0) return {leaf:true,pred:mean(idx.map(function(i){return TSEC29[i];})),n:n};
    IMP29[bestFeat]+=n*bestGain;
    return {leaf:false,feat:bestFeat,thresh:bestThresh,
      left:buildRTree29(bestL,depth+1,maxDepth,minLeaf),
      right:buildRTree29(bestR,depth+1,maxDepth,minLeaf)};
  }
  var ALLIDX29=[]; for(var _ai=0;_ai<N29;_ai++) ALLIDX29.push(_ai);
  buildRTree29(ALLIDX29,0,4,8);
  var IMPSUM29=IMP29.reduce(function(a,b){return a+b;},0);
  var IMPNORM29=IMP29.map(function(v){return v/IMPSUM29;});

  // ── 순열 중요도(선형모델 기준, 고정 셔플 30회 사전계산) ──────────────────────────
  var ORIGROWS29=[]; for(var _oi=0;_oi<N29;_oi++){ var v=[]; for(var j=0;j<P29;j++) v.push(RAWCOLS29[j][_oi]); v.push(PROTO29[_oi]); ORIGROWS29.push(v); }
  function encodeRow29(vals){
    var row=[1];
    for(var j=0;j<P29;j++) row.push((vals[j]-MEANS29[j])/STDS29[j]);
    var proto=vals[P29];
    row.push(proto===1?1:0); row.push(proto===2?1:0);
    return row;
  }
  function shuffleIdx29(seed){
    var rng=LCG(seed), idx=[]; for(var i=0;i<N29;i++) idx.push(i);
    for(i=N29-1;i>0;i--){ var jj=Math.floor(rng()*(i+1)); var t=idx[i]; idx[i]=idx[jj]; idx[jj]=t; }
    return idx;
  }
  function r2WithShuffled29(featIdx,permIdx){
    var preds=[];
    for(var i=0;i<N29;i++){
      var v=ORIGROWS29[i].slice();
      v[featIdx]=ORIGROWS29[permIdx[i]][featIdx];
      preds.push(predictLR(BETAFULL29,encodeRow29(v)));
    }
    return r2fn(preds,TSEC29);
  }
  var REPS29=30;
  var DROPS29=[];
  for(var pf=0; pf<TP29; pf++){
    DROPS29.push([]);
    for(var pr=0; pr<REPS29; pr++){
      var pidx=shuffleIdx29(500000+pf*1000+pr);
      DROPS29[pf].push(R2FULL29-r2WithShuffled29(pf,pidx));
    }
  }
  function meanArr(a){ return a.reduce(function(x,y){return x+y;},0)/a.length; }
  function stdArr(a){ var m=meanArr(a),s=0; a.forEach(function(v){s+=(v-m)*(v-m);}); return Math.sqrt(s/a.length); }

  // ── XOR 상호작용 데모(단변량의 한계) ──────────────────────────
  var medX1_29=X1_29.slice().sort(function(a,b){return a-b;})[Math.floor(N29/2)];
  var medX2_29=X2_29.slice().sort(function(a,b){return a-b;})[Math.floor(N29/2)];
  var ATOY29=X1_29.map(function(v){return v>medX1_29?1:0;});
  var BTOY29=X2_29.map(function(v){return v>medX2_29?1:0;});
  var YTOY29=ATOY29.map(function(a,i){return (a!==BTOY29[i])?1:0;});
  var CORR_A_29=corr(ATOY29,YTOY29), CORR_B_29=corr(BTOY29,YTOY29);
  function cellMean(av,bv){ var s=0,n=0; for(var i=0;i<N29;i++){ if(ATOY29[i]===av&&BTOY29[i]===bv){ s+=YTOY29[i]; n++; } } return n>0?s/n:0; }

  // ── 누수(leakage) 변수 데모 ──────────────────────────
  var LEAK29=[];
  (function(){ var rng=LCG(13131313); for(var i=0;i<N29;i++) LEAK29.push(+(TSEC29[i]*1.02+(rng()-0.5)*2).toFixed(2)); })();
  var CORR_LEAK29=corr(LEAK29,TSEC29);
  var mLeak29=mean(LEAK29), sLeak29=std(LEAK29);
  var XDESIGNLEAK29=XDESIGN29.map(function(row,i){ return row.concat([(LEAK29[i]-mLeak29)/sLeak29]); });
  var BETALEAK29=fitLinReg(XDESIGNLEAK29,TSEC29,0.01);
  var PREDLEAK29=XDESIGNLEAK29.map(function(xi){return predictLR(BETALEAK29,xi);});
  var R2LEAK29=r2fn(PREDLEAK29,TSEC29);
  var LEAKCOEF29=BETALEAK29[BETALEAK29.length-1];
  var X2AFTER_LEAK29=BETALEAK29[2];

  function barChart(ctx,x0,x1,y0,y1,items,valFn,colFn,fmtFn){
    var maxV=0; items.forEach(function(it){ var v=Math.abs(valFn(it)); if(v>maxV) maxV=v; });
    if(maxV<=0) maxV=1;
    var bw=(x1-x0)/items.length;
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x0,y0+(y1-y0)/2); ctx.lineTo(x1,y0+(y1-y0)/2); ctx.stroke();
    items.forEach(function(it,i){
      var v=valFn(it), h=(Math.abs(v)/maxV)*((y1-y0)/2-6);
      var cx=x0+i*bw+bw*0.15, cw=bw*0.7;
      ctx.fillStyle=colFn(it,i);
      if(v>=0) ctx.fillRect(cx, y0+(y1-y0)/2-h, cw, h); else ctx.fillRect(cx, y0+(y1-y0)/2, cw, h);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
      ctx.fillText(fmtFn(v), cx+cw/2, (v>=0)? (y0+(y1-y0)/2-h-4) : (y0+(y1-y0)/2+h+13));
    });
  }

  var scenes = [

  // ══════════ 1. 중요도란 무엇인가 ══════════
  { id:'bda29_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'r2_full = LinearRegression().fit(X, y).score(X, y)', hl:'.score('},
        {t:"X_drop = X.drop(columns=['x1'])"},
        {t:'r2_drop = LinearRegression().fit(', dim:true},
        {t:'    X_drop, y).score(X_drop, y)', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'importance_def.py', s.step===0?null:0);
      var caps=[
        '중요도 = 「이 변수가 없으면 성능이 얼마나 나빠지는가」를 재는 것입니다',
        'x1(입력크기)을 빼면 R²가 0.353에서 0.341로 떨어집니다 — 그 차이 0.012가 x1의 성능기여 중요도',
        'x2(반복수)를 빼면 개별 상관은 x1보다 훨씬 큰데도 R² 손실은 더 작습니다 — 무언가 x2를 대신하고 있습니다'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      if(s.step>=1){
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GRN; ctx.fillText('R²(전체 8개 변수) = '+R2FULL29.toFixed(3), W*0.04, codeBot+46);
        ctx.fillStyle=(s.step===1)?RED:DIM; ctx.fillText('R²(x1 제외) = '+R2_NOX1.toFixed(3)+'   손실 = '+(R2FULL29-R2_NOX1).toFixed(3), W*0.04, codeBot+68);
        if(s.step===2){
          ctx.fillStyle=RED; ctx.fillText('R²(x2 제외) = '+R2_NOX2.toFixed(3)+'   손실 = '+(R2FULL29-R2_NOX2).toFixed(3), W*0.04, codeBot+90);
          ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText('상관 |corr(x1,T)|='+Math.abs(CORR29[0]).toFixed(3)+' < |corr(x2,T)|='+Math.abs(CORR29[1]).toFixed(3)+'인데 손실은 반대입니다', W*0.04, codeBot+111);
        }
      }

      var bx0=W*0.49, bx1=W*0.965;
      if(s.step===0){
        var by=90;
        roundRect(ctx,bx0,by,150,50,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.fill(); ctx.strokeStyle=GRN; ctx.stroke();
        ctx.font='12px sans-serif'; ctx.fillStyle=GRN; ctx.textAlign='center'; ctx.fillText('모델(전체 변수)', bx0+75, by+22); ctx.fillText('성능 = X', bx0+75, by+40);
        ctx.strokeStyle=TXT; ctx.beginPath(); ctx.moveTo(bx0+150,by+25); ctx.lineTo(bx0+230,by+25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx0+230,by+25); ctx.lineTo(bx0+222,by+20); ctx.moveTo(bx0+230,by+25); ctx.lineTo(bx0+222,by+30); ctx.stroke();
        roundRect(ctx,bx0+235,by,150,50,8); ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.fill(); ctx.strokeStyle=RED; ctx.stroke();
        ctx.fillStyle=RED; ctx.fillText('한 변수 제거', bx0+310,by+22); ctx.fillText("성능 = X'", bx0+310, by+40);
        ctx.font='600 13px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText("중요도 = X − X'  (클수록 그 변수가 중요)", bx0, by+90);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('모델 종류를 가리지 않는 정의입니다 —', bx0, by+112);
        ctx.fillText('이후 방법들에서 이 X−X\'을 실제로 잽니다', bx0, by+131);
      } else {
        var by0=32, by1=210, items=[['전체',R2FULL29,GRN],['x1 제외',R2_NOX1,RED],['x2 제외',s.step===2?R2_NOX2:null,RED]].filter(function(it){return it[1]!=null;});
        var gw=(bx1-bx0)/3;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
        items.forEach(function(it,i){
          var hh=it[1]*(by1-by0);
          var gx=bx0+i*gw+gw*0.2, gwid=gw*0.6;
          ctx.fillStyle=it[2]; ctx.fillRect(gx, by1-hh, gwid, hh);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(it[1].toFixed(3), gx+gwid/2, by1-hh-8);
          ctx.font='11.5px sans-serif';
          ctx.fillText(it[0], gx+gwid/2, by1+16);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('R²(결정계수) 비교 — 낮아질수록 그 변수가 중요', bx0, by0-8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (정의 → x1 제거 → x2 제거로 비교)', true);
      E.big('예측 변수 중요도란 무엇인가', '28장에서는 어떤 모델·판정 규칙이 총비용을 가장 줄이는지 비교했습니다. 그런데 그 모델들이 쓴 입력크기(x1)·반복수(x2) 같은 변수들 중 <b>정작 어떤 변수가 얼마나 중요한지는 따로 재본 적이 없습니다</b>. 중요도는 「이 변수가 없으면 성능이 얼마나 나빠지는가」로 정의됩니다 — 전체 8개 변수로 지은 모델의 R²='+R2FULL29.toFixed(3)+'에서 x1을 빼면 R²='+R2_NOX1.toFixed(3)+'로 떨어져 손실 '+(R2FULL29-R2_NOX1).toFixed(3)+'이 x1의 중요도입니다. 그런데 x2를 빼면 개별 상관은 x2가 x1보다 훨씬 큰데도(|corr|='+Math.abs(CORR29[1]).toFixed(2)+' vs '+Math.abs(CORR29[0]).toFixed(2)+') 손실은 오히려 더 작습니다('+(R2FULL29-R2_NOX2).toFixed(3)+') — 이 어긋남의 이유는 29.3장에서 밝혀집니다. 이 X−X\' 아이디어가 이후 배울 상관·표준화계수·순열 중요도 모두를 관통하는 공통 뼈대입니다.'); }
  },

  // ══════════ 2. 모델 없이 재는 법 ══════════
  { id:'bda29_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'corrs = X_numeric.corrwith(y)', hl:'corrwith'},
        {t:"means = df.groupby('proto')[target].mean()", hl:'groupby'},
        {t:'eta2 = ss_between / ss_total', hl:'eta2'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'univariate.py', s.step);
      var caps=[
        '수치형 변수는 목표(실행시간)와의 상관계수로 순위를 매깁니다',
        '범주형 변수(프로토콜)는 집단별 평균이 얼마나 갈라지는지(분리도 η²)로 잽니다',
        '단, 단변량 방식은 「따로는 무관해도 함께면 결정적인」 상호작용을 못 봅니다'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var bx0=W*0.49, bx1=W*0.965;
      if(s.step===0){
        var order=FNAME29.map(function(nm,i){return {nm:nm,v:CORR29[i]};}).sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v);});
        var by0=34, by1=230, bw=(bx1-bx0)/order.length;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+(by1-by0)/2); ctx.lineTo(bx1,by0+(by1-by0)/2); ctx.stroke();
        order.forEach(function(it,i){
          var h=(Math.abs(it.v)/0.6)*((by1-by0)/2-8);
          var cx=bx0+i*bw+bw*0.15, cw=bw*0.7;
          ctx.fillStyle=(it.v>=0)?GRN:RED;
          if(it.v>=0) ctx.fillRect(cx, by0+(by1-by0)/2-h, cw, h); else ctx.fillRect(cx, by0+(by1-by0)/2, cw, h);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(it.v.toFixed(2), cx+cw/2, (it.v>=0)?(by0+(by1-by0)/2-h-4):(by0+(by1-by0)/2+h+14));
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          var short=it.nm.replace(/\(.*\)/,'');
          ctx.fillText(short, cx+cw/2, by1+16);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('실행시간과의 상관계수(내림차순)', bx0, by0-8);
      } else if(s.step===1){
        var by0b=40, by1b=200, gw=(bx1-bx0)/3;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1b); ctx.lineTo(bx1,by1b); ctx.stroke();
        var maxM=Math.max.apply(null,PMEANS29);
        PMEANS29.forEach(function(m,i){
          var hh=(m/maxM)*(by1b-by0b);
          var gx=bx0+i*gw+gw*0.22, gwid=gw*0.56;
          ctx.fillStyle=[GRN,BLU,GLD][i]; ctx.fillRect(gx, by1b-hh, gwid, hh);
          ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(m.toFixed(1)+'초', gx+gwid/2, by1b-hh-8);
          ctx.font='11.5px sans-serif';
          ctx.fillText('프로토콜 '+PROTONM[i], gx+gwid/2, by1b+16);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('프로토콜별 평균 실행시간', bx0, by0b-8);
        ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('분리도 η² = '+ETA2_29.toFixed(3), bx0, by1b+42);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('(전체 분산 중 프로토콜 차이로 설명되는 비율 — 1에 가까울수록 잘 갈라짐)', bx0, by1b+62);
      } else {
        var gsz=76, gx0b=bx0+40, gy0b=44;
        var cells=[[0,0],[0,1],[1,0],[1,1]];
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('A(x1 상위?)·B(x2 상위?)에 따른 평균(정확히 XOR 패턴)', bx0, gy0b-14);
        cells.forEach(function(c){
          var av=c[0], bv=c[1], m=cellMean(av,bv);
          var cx=gx0b+av*gsz, cy=gy0b+bv*gsz;
          ctx.fillStyle=(m>0.5)?'rgba(126,224,176,0.30)':'rgba(240,136,138,0.14)';
          ctx.fillRect(cx,cy,gsz-4,gsz-4);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(cx,cy,gsz-4,gsz-4);
          ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(m.toFixed(2), cx+(gsz-4)/2, cy+(gsz-4)/2+5);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('A=0', gx0b+(gsz-4)/2, gy0b-2); ctx.fillText('A=1', gx0b+gsz+(gsz-4)/2, gy0b-2);
        ctx.save(); ctx.translate(gx0b-14, gy0b+(gsz-4)/2); ctx.rotate(-Math.PI/2); ctx.fillText('B=0', 0,0); ctx.restore();
        ctx.save(); ctx.translate(gx0b-14, gy0b+gsz+(gsz-4)/2); ctx.rotate(-Math.PI/2); ctx.fillText('B=1', 0,0); ctx.restore();
        var tx=gx0b+2*gsz+30;
        ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('corr(A,결과)='+CORR_A_29.toFixed(3), tx, gy0b+30);
        ctx.fillText('corr(B,결과)='+CORR_B_29.toFixed(3), tx, gy0b+54);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('개별 상관은 거의 0인데', tx, gy0b+84);
        ctx.fillText('둘을 같이 보면 완벽히 갈립니다', tx, gy0b+103);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (수치형 상관 → 범주형 분리도 → 상호작용 맹점)', true);
      E.big('모델 없이 재는 법 — 상관과 분리도', '가장 손쉬운 방법은 모델을 만들지 않고 <b>목표와의 관계를 직접 재는 것</b>입니다. 수치형 변수는 상관계수로: x2(반복수) |corr|='+Math.abs(CORR29[1]).toFixed(3)+'가 가장 크고 x4(메모리요청) '+Math.abs(CORR29[3]).toFixed(3)+'가 근소하게 뒤따르며, 우선순위·사용자이력·잡음 변수들은 모두 0에 가깝습니다. 범주형 변수(프로토콜)는 집단별 평균 차이로: A '+PMEANS29[0].toFixed(1)+'초·B '+PMEANS29[1].toFixed(1)+'초·C '+PMEANS29[2].toFixed(1)+'초로 뚜렷이 갈리고, 분리도 η²='+ETA2_29.toFixed(3)+'로 요약됩니다. 하지만 이 <b>단변량 방식에는 한계</b>가 있습니다 — x1·x2의 중앙값 기준 상하 여부(A·B)로 만든 인위적인 결과값을 보면, A·B 각각과의 상관은 '+CORR_A_29.toFixed(3)+'·'+CORR_B_29.toFixed(3)+'로 거의 0인데도 둘을 함께 보면(2×2 표) 완벽하게 갈립니다. <b>혼자서는 무관해 보이는 변수들이 함께는 결정적일 수 있다</b>는 것을 단변량 순위는 볼 수 없습니다.'); }
  },

  // ══════════ 3. 모델 기반 중요도 ══════════
  { id:'bda29_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'lr = LinearRegression().fit(Xs, y)', hl:'LinearRegression'},
        {t:'std_coef = lr.coef_', hl:'coef_'},
        {t:'tree = DecisionTreeRegressor(max_depth=4)', hl:'DecisionTreeRegressor'},
        {t:'tree_imp = tree.feature_importances_', hl:'feature_importances_'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'model_importance.py', s.step===0?1:3);
      var caps=[
        '표준화한 뒤 적합한 선형회귀 계수의 크기를 중요도로 씁니다',
        '트리는 각 분할이 줄인 분산을 그 분할에 쓰인 변수에 누적해 중요도로 씁니다',
        'x2·x4는 상관 0.964로 거의 같은 정보 — 둘이 있으면 중요도를 서로 나눠 가집니다'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var bx0=W*0.49, bx1=W*0.965;
      if(s.step===0){
        var order=COEFNAME29.map(function(nm,i){return {nm:nm,v:STDCOEF29[i]};}).sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v);});
        barChart(ctx,bx0,bx1,30,220,order,function(it){return it.v;},function(it){return it.v>=0?GRN:RED;},function(v){return v.toFixed(1);});
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        var bw2=(bx1-bx0)/order.length;
        order.forEach(function(it,i){ ctx.fillText(it.nm.replace(/\(.*\)/,'').slice(0,5), bx0+i*bw2+bw2/2, 236); });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('표준화 계수 (R²='+R2FULL29.toFixed(3)+')', bx0, 22);
      } else if(s.step===1){
        var order2=ALLNAME29.map(function(nm,i){return {nm:nm,v:IMPNORM29[i]};}).sort(function(a,b){return b.v-a.v;});
        var by0=34, by1=210, bw3=(bx1-bx0)/order2.length;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
        order2.forEach(function(it,i){
          var hh=it.v*(by1-by0);
          var cx=bx0+i*bw3+bw3*0.15, cw=bw3*0.7;
          ctx.fillStyle=GLD; ctx.fillRect(cx, by1-hh, cw, hh);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(it.v.toFixed(2), cx+cw/2, by1-hh-6);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(it.nm.replace(/\(.*\)/,'').slice(0,5), cx+cw/2, by1+16);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('트리 분할이득 누적 중요도(합=1)', bx0, by0-8);
      } else {
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('corr(x2,x4) = '+corr(X2_29,X4_29).toFixed(3)+' — 거의 같은 신호를 담고 있습니다', bx0, 32);
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('단독 회귀 계수:  x2='+X2ALONE29.toFixed(1)+'   x4='+X4ALONE29.toFixed(1), bx0, 58);
        ctx.fillStyle=GLD; ctx.fillText('함께 있을 때:     x2='+STDCOEF29[1].toFixed(1)+'    x4='+STDCOEF29[3].toFixed(1), bx0, 80);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('둘을 합치면 신호는 살아있고 배분만 바뀝니다', bx0, 102);

        var ty=130;
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('R²(x2 제외)='+R2_NOX2.toFixed(3)+'  손실 '+(R2FULL29-R2_NOX2).toFixed(3), bx0, ty);
        ctx.fillText('R²(x4 제외)='+R2_NOX4.toFixed(3)+'  손실 '+(R2FULL29-R2_NOX4).toFixed(3), bx0, ty+22);
        ctx.fillStyle=RED;
        ctx.fillText('R²(x2·x4 둘 다 제외)='+R2_NOX2X4.toFixed(3)+'  손실 '+(R2FULL29-R2_NOX2X4).toFixed(3), bx0, ty+44);
        ctx.font='600 11.5px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('하나만 빼면 손실이 작지만(다른 하나가 대신함), 둘 다 빼면 손실이 확 커집니다', bx0, ty+70);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (표준화계수 → 트리중요도 → x2x4 redundancy)', true);
      E.big('모델 기반 중요도 — 계수와 분할이득', '많은 모델은 중요도를 <b>내장</b>하고 있습니다. 표준화한 뒤 적합한 선형회귀는 x2(반복수) 계수 '+STDCOEF29[1].toFixed(1)+'·프로토콜C 계수 '+STDCOEF29[8].toFixed(1)+'을 가장 크게 두고, 회귀트리는 각 분할이 줄인 분산을 누적해 x2에 '+(IMPNORM29[1]*100).toFixed(0)+'%를 몰아줍니다. 두 방법의 순위는 대체로 일치하지만, <b>상관된 변수 사이에서는 중요도가 쪼개집니다</b> — x2와 x4는 상관 '+corr(X2_29,X4_29).toFixed(3)+'로 거의 같은 정보를 담고 있어서, 각각 <b>단독으로</b> 회귀하면 계수가 '+X2ALONE29.toFixed(1)+'·'+X4ALONE29.toFixed(1)+'로 비슷하게 크지만, <b>함께</b> 넣으면 '+STDCOEF29[1].toFixed(1)+'·'+STDCOEF29[3].toFixed(1)+'로 둘 다 줄어듭니다. 실제로 하나만 빼면 R² 손실이 작지만(다른 하나가 그 자리를 메꿈), 둘 다 빼면 손실이 '+(R2FULL29-R2_NOX2X4).toFixed(3)+'로 확 커집니다 — <b>신호는 그대로인데 두 변수가 공을 나눠 가진 것</b>입니다.'); }
  },

  // ══════════ 4. ★순열 중요도 ══════════
  { id:'bda29_04',
    enter:function(E){ var self=this; self.s={reps:10};
      E.controls('<div class="ctrl"><label>반복 횟수 n_repeats</label><input type="range" id="b294r" min="1" max="30" step="1" value="10"><output id="b294ro">10</output></div>');
      E.bind('#b294r','input',function(e){ self.s.reps=+e.target.value; document.getElementById('b294ro').textContent=self.s.reps; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.inspection import (', dim:true},
        {t:'    permutation_importance)', hl:'permutation_importance'},
        {t:'r = permutation_importance(lr, X, y,', hl:'permutation_importance'},
        {t:'    n_repeats=n)', hl:'n_repeats'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'perm_importance.py', 2);
      var R=s.reps;
      var stats=ALLNAME29.map(function(nm,i){ var d=DROPS29[i].slice(0,R); return {nm:nm, mean:meanArr(d), std:stdArr(d)}; });
      var top=stats.slice().sort(function(a,b){return b.mean-a.mean;})[0];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('n_repeats='+R, W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('한 변수를 뒤섞어 R² 하락폭을 R번 반복 측정한 평균±표준편차', W*0.04, ry+22);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('1위 변수: '+top.nm+'  '+top.mean.toFixed(3)+' ± '+top.std.toFixed(3), W*0.04, ry+48);
      var x1Stat=stats[0];
      ctx.fillStyle=(R<10)?RED:GRN;
      ctx.fillText('x1: '+x1Stat.mean.toFixed(3)+' ± '+x1Stat.std.toFixed(3)+(R<10?'  (반복이 적어 아직 불안정)':'  (반복이 늘며 안정)'), W*0.04, ry+70);

      var bx0=W*0.49, bx1=W*0.965, by0=30, by1=195;
      var order=stats.slice().sort(function(a,b){return b.mean-a.mean;});
      var bw=(bx1-bx0)/order.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
      var maxV=Math.max.apply(null,order.map(function(o){return o.mean+o.std;}),0.02);
      order.forEach(function(it,i){
        var hh=(Math.max(0,it.mean)/maxV)*(by1-by0);
        var cx=bx0+i*bw+bw*0.2, cw=bw*0.6;
        ctx.fillStyle=GRN; ctx.fillRect(cx, by1-hh, cw, hh);
        var errH=(it.std/maxV)*(by1-by0);
        ctx.strokeStyle=TXT; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(cx+cw/2, by1-hh-errH); ctx.lineTo(cx+cw/2, by1-hh+errH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+cw/2-4, by1-hh-errH); ctx.lineTo(cx+cw/2+4, by1-hh-errH); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText(it.nm.replace(/\(.*\)/,'').slice(0,5), cx+cw/2, by1+16);
      });
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('순열 중요도 평균 ± 표준편차(선)', bx0, by0-8);

      var sx0=bx0, sx1=bx0+180, sy0=230, sy1=290;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.strokeRect(sx0,sy0,sx1-sx0,sy1-sy0);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('x1 누적평균의 안정화(1~'+R+'회)', sx0, sy0-6);
      var running=[]; var acc=0;
      for(var r=0;r<R;r++){ acc+=DROPS29[0][r]; running.push(acc/(r+1)); }
      var rmax=Math.max.apply(null,running.concat([0.001])), rmin=Math.min.apply(null,running.concat([0]));
      if(rmax===rmin) rmax=rmin+0.001;
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath();
      running.forEach(function(v,i){
        var px=sx0+((i)/(Math.max(1,R-1)))*(sx1-sx0);
        var py=sy1-((v-rmin)/(rmax-rmin))*(sy1-sy0-6)-3;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      });
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText(running[running.length-1].toFixed(3), sx1+8, sy1-((running[running.length-1]-rmin)/(rmax-rmin))*(sy1-sy0-6)-3+4);

      E.tapHint(W/2, H*0.95, '슬라이더로 반복 횟수를 늘려 추정이 안정화되는 모습을 보세요', true);
      E.big('순열 중요도 — 뒤섞어서 재는 성능 손실', '모델을 다시 학습하지 않고도 중요도를 잴 수 있습니다: 한 변수의 값을 표본 사이에서 <b>실제로 뒤섞은 뒤</b>(고정 시드 셔플) 그 모델로 다시 예측해 R²가 얼마나 떨어지는지 봅니다. x2를 뒤섞으면 R²가 평균 '+meanArr(DROPS29[1].slice(0,30)).toFixed(3)+' 떨어져 8개 변수 중 가장 크고, 프로토콜(η²로도 강하게 나왔던)도 '+meanArr(DROPS29[7].slice(0,30)).toFixed(3)+'로 뒤를 잇습니다. 이 방법은 <b>선형이든 트리든 신경망이든 모델 종류를 가리지 않고</b> 똑같이 적용됩니다. 다만 셔플은 무작위 과정이라 <b>한 번만 재면 추정이 흔들립니다</b> — 슬라이더로 반복 횟수를 1에서 30까지 늘리면 x1처럼 신호가 약한 변수의 평균값이 눈에 띄게 흔들리다가 점점 안정화되는 것을(왼쪽 아래 누적평균 그래프) 실제로 확인할 수 있습니다.'); }
  },

  // ══════════ 5. 중요도를 오해하지 않기 ══════════
  { id:'bda29_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"corr(df.proto_ord, df['반복수'])", hl:'corr'},
        {t:"df['LEAK'] = y * 1.02 + noise   # 결과값 누수", dim:true},
        {t:'LinearRegression().fit(X_with_leak, y)', hl:'LinearRegression'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'pitfalls.py', s.step===0?0:2);
      var caps=[
        '프로토콜이 중요해 보이는 것은 프로토콜 자체가 원인이 아니라 반복수와 얽혀 있기 때문일 수 있습니다',
        '결과값을 거의 그대로 베낀 변수(누수)를 넣으면 중요도가 압도적 1위로 왜곡됩니다',
        '중요도는 인과가 아니며, 상관·척도·누수에 흔들립니다 — 결론을 내리기 전에 늘 확인하세요'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);

      var bx0=W*0.49, bx1=W*0.965;
      if(s.step===0){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('corr(프로토콜, x2 반복수) = '+corr(PROTO29,X2_29).toFixed(3), W*0.04, codeBot+48);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('프로토콜이 바뀔 때 반복수도 함께 바뀌도록 만들어진 데이터입니다', W*0.04, codeBot+70);
        ctx.fillText('→ "프로토콜이 중요하다"가 아니라 "프로토콜과 얽힌 무언가가 중요하다"', W*0.04, codeBot+89);

        var by0=32, by1=210;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
        var pts=[]; for(var i=0;i<N29;i++) pts.push([PROTO29[i],X2_29[i]]);
        var maxX2=Math.max.apply(null,X2_29);
        function PY(v){ return by1-(v/maxX2)*(by1-by0); }
        [0,1,2].forEach(function(pc){
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(PROTONM[pc], bx0+ (pc+0.5)*(bx1-bx0)/3, by1+16);
        });
        pts.forEach(function(p){
          var jig=((p[0]*37+p[1])%20-10)/10*((bx1-bx0)/3)*0.28;
          var cx=bx0+(p[0]+0.5)*(bx1-bx0)/3+jig;
          ctx.fillStyle='rgba(122,184,255,0.55)'; ctx.beginPath(); ctx.arc(cx,PY(p[1]),2.4,0,7); ctx.fill();
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('프로토콜별 x2(반복수) 산점도 — 뚜렷이 함께 움직입니다', bx0, by0-8);
      } else if(s.step===1){
        var order=COEFNAME29.concat(['LEAK']).map(function(nm,i){ var v=(i<COEFNAME29.length)?BETALEAK29[i+1]:LEAKCOEF29; return {nm:nm,v:v}; }).sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v);});
        barChart(ctx,bx0,bx1,32,210,order,function(it){return it.v;},function(it){return it.nm==='LEAK'?RED:(it.v>=0?GRN:BLU);},function(v){return v.toFixed(1);});
        var bw2=(bx1-bx0)/order.length;
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        order.forEach(function(it,i){ ctx.fillText(it.nm.replace(/\(.*\)/,'').slice(0,5), bx0+i*bw2+bw2/2, 226); });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('LEAK 포함 표준화 계수 — R²='+R2LEAK29.toFixed(3), bx0, 22);
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
        ctx.fillText('corr(LEAK,실행시간)='+CORR_LEAK29.toFixed(3)+'  x2 계수 '+STDCOEF29[1].toFixed(1)+' → '+X2AFTER_LEAK29.toFixed(2)+'로 붕괴', bx0, 246);
      } else {
        roundRect(ctx,bx0,32,bx1-bx0,215,10);
        ctx.fillStyle='rgba(255,178,122,0.06)'; ctx.fill(); ctx.strokeStyle='rgba(255,178,122,0.30)'; ctx.stroke();
        ctx.font='12px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('중요도를 읽을 때 확인할 체크리스트', bx0+12, 56);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('· 인과가 아니라 관계의 세기 — "중요"가 "원인"은 아닙니다', bx0+12, 82);
        ctx.fillText('· 상관된 변수쌍(예: x2·x4, corr='+corr(X2_29,X4_29).toFixed(2)+')은 중요도가 쪼개질 수 있습니다', bx0+12, 104);
        ctx.fillText('· 척도가 다른 변수는 표준화 후 비교해야 공정합니다', bx0+12, 126);
        ctx.fillText('· 결과값과 사실상 같은 변수(누수, corr≈1)는 압도적 1위로 왜곡됩니다', bx0+12, 148);
        ctx.fillText('· 가능하면 방법을 2개 이상(상관·모델기반·순열) 겹쳐 확인하세요', bx0+12, 170);
        ctx.font='600 11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('중요도 순위는 "무엇을 더 볼지"를 알려줄 뿐, "왜"를 대신 답해주지 않습니다', bx0+12, 200);
        ctx.fillText('그 "왜"는 여전히 도메인 지식과 실험으로 확인해야 합니다', bx0+12, 219);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (혼재 → 누수 → 체크리스트)', true);
      E.big('중요도를 오해하지 않기', '중요도 순위는 강력하지만 <b>인과가 아닙니다</b>. 프로토콜은 실행시간과 강하게 관련되지만, 실은 반복수(x2)와 상관 '+corr(PROTO29,X2_29).toFixed(3)+'로 얽혀 있도록 만들어진 데이터입니다 — 프로토콜 자체가 실행시간을 늘리는 원인인지, 단지 반복수가 많은 작업이 특정 프로토콜에 몰려서인지는 중요도 숫자만으로 구분할 수 없습니다. 더 극단적인 예로, 결과값을 거의 그대로 베낀 <b>누수 변수</b>(corr(LEAK,실행시간)='+CORR_LEAK29.toFixed(3)+')를 하나 끼워 넣으면 R²는 '+R2LEAK29.toFixed(3)+'까지 치솟고 이 변수 하나가 중요도를 압도해 x2의 계수는 '+STDCOEF29[1].toFixed(1)+'에서 '+X2AFTER_LEAK29.toFixed(2)+'로 무너집니다 — 실무 데이터에 이런 변수가 섞여 있으면(예: 결과가 이미 반영된 파생 지표) 중요도 분석 전체가 왜곡됩니다. <b>중요도는 「무엇을 더 들여다볼지」의 실마리일 뿐, 「왜 그런지」는 여전히 도메인 지식과 별도의 실험으로 확인해야 합니다.</b>'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
