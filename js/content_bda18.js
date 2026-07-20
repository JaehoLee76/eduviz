/* 빅데이터 분석 제18장 — 비선형 회귀 모델 (신경망·MARS·SVR·kNN)
   동작(behavior)만. 텍스트=content/bda18.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(잔차·훈련/검증 오차·절점 SSE·튜브 내 점 수·서포트벡터 수·CV RMSE)는
   아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 신경망은 순전파·역전파를 직접
   구현해 경사하강으로 학습하고, MARS는 후보 절점 전수 탐색, SVR은 epsilon-무감 손실을 반복 가중
   최소제곱(IRLS)으로 근사 학습한다. 난수(Math.random) 절대 금지 — 초기값·잡음은 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

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
  function sampStd(a){ if(a.length<2) return 0; var m=mean(a),s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/(a.length-1)); }
  function rmseOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++){ var d=ys[i]-preds[i]; s+=d*d; } return Math.sqrt(s/ys.length); }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function uniq(a){ var seen={}, out=[]; for(var i=0;i<a.length;i++){ var k=a[i]; if(!seen[k]){ seen[k]=1; out.push(k); } } return out.sort(function(p,q){return p-q;}); }

  function matT(A){ var r=A.length,c=A[0].length,T=[]; for(var j=0;j<c;j++){ var row=[]; for(var i=0;i<r;i++) row.push(A[i][j]); T.push(row); } return T; }
  function matMul(A,B){ var r=A.length,k=A[0].length,c=B[0].length,C=[]; for(var i=0;i<r;i++){ var row=[]; for(var j=0;j<c;j++){ var s=0; for(var p=0;p<k;p++) s+=A[i][p]*B[p][j]; row.push(s); } C.push(row); } return C; }
  function matVec(A,v){ return A.map(function(row){ var s=0; for(var i=0;i<row.length;i++) s+=row[i]*v[i]; return s; }); }
  function matMulW(A,W,B){ var r=A[0].length,c=B[0].length,rows=A.length,C=[]; for(var i=0;i<r;i++){ var row=[]; for(var j=0;j<c;j++){ var s=0; for(var p=0;p<rows;p++) s+=A[p][i]*W[p]*B[p][j]; row.push(s); } C.push(row); } return C; }
  function matVecW(A,W,v){ var r=A[0].length, rows=A.length, out=[]; for(var i=0;i<r;i++){ var s=0; for(var p=0;p<rows;p++) s+=A[p][i]*W[p]*v[p]; out.push(s); } return out; }
  function solveLin(A,b){
    var n=A.length; var M=A.map(function(row,i){ return row.concat([b[i]]); });
    for(var col=0; col<n; col++){
      var piv=col; for(var r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[piv][col])) piv=r;
      var tmp=M[col]; M[col]=M[piv]; M[piv]=tmp;
      var pv=M[col][col]; if(Math.abs(pv)<1e-9) continue;
      for(r=col;r<=n;r++) M[col][r]/=pv;
      for(r=0;r<n;r++){ if(r!==col){ var f=M[r][col]; for(var cc=col;cc<=n;cc++) M[r][cc]-=f*M[col][cc]; } }
    }
    return M.map(function(row){ return row[n]; });
  }

  // ══════════ 고정 데이터: 완만한 구간 뒤 가파른 구간으로 꺾이는 비선형 곡선 + 잡음 ══════════
  var N18=36, X18=[], Y18=[], Ytrue18=[];
  (function(){
    var rng=LCG(20260721);
    for(var i=0;i<N18;i++){
      var x=i;
      var base=(x<=18)?(2+0.15*x):(2+0.15*18+0.85*(x-18));
      var wig=0.6*Math.sin(x/3);
      var f=base+wig;
      var n=(rng()-0.5)*1.4;
      X18.push(x); Ytrue18.push(f); Y18.push(f+n);
    }
  })();
  var TRAIN18=[], VAL18=[];
  for(var _i=0;_i<N18;_i++){ if(_i%4===3) VAL18.push(_i); else TRAIN18.push(_i); }

  // 18.1 — 단순 직선 적합의 잔차
  var OLS18=(function(){
    var mx=mean(X18), my=mean(Y18), sxy=0, sxx=0, i;
    for(i=0;i<N18;i++){ sxy+=(X18[i]-mx)*(Y18[i]-my); sxx+=(X18[i]-mx)*(X18[i]-mx); }
    var slope=sxy/sxx, intercept=my-slope*mx;
    var resid=X18.map(function(x,idx){ return Y18[idx]-(intercept+slope*x); });
    var sse=0; resid.forEach(function(r){ sse+=r*r; });
    var z1=resid.slice(0,12), z2=resid.slice(12,24), z3=resid.slice(24,36);
    return {slope:slope, intercept:intercept, resid:resid, rmse:Math.sqrt(sse/N18), zoneMeans:[mean(z1),mean(z2),mean(z3)]};
  })();

  // 18.2 — 은닉층 신경망(직접 구현): 입력1→은닉H(tanh)→출력1, 표준화 후 경사하강
  function trainNN18(H, iters, lr, seed){
    var rng=LCG(seed);
    var xArr=TRAIN18.map(function(i){return X18[i];}), yArr=TRAIN18.map(function(i){return Y18[i];});
    var xm=mean(xArr), xs=std(xArr), ym=mean(yArr), ys=std(yArr);
    function nx(x){ return (x-xm)/xs; } function ny(y){ return (y-ym)/ys; } function invy(v){ return v*ys+ym; }
    var w1=[],b1=[],w2=[],b2=0,j;
    for(j=0;j<H;j++){ w1.push((rng()-0.5)*1.5); b1.push((rng()-0.5)*1.5); w2.push((rng()-0.5)*1.5); }
    var xn=xArr.map(nx), yn=yArr.map(ny), n=xn.length;
    for(var it=0; it<iters; it++){
      var gw1=new Array(H), gb1=new Array(H), gw2=new Array(H), gb2=0;
      for(j=0;j<H;j++){ gw1[j]=0; gb1[j]=0; gw2[j]=0; }
      for(var p=0;p<n;p++){
        var x=xn[p], yt=yn[p], a1=[];
        for(j=0;j<H;j++) a1.push(Math.tanh(w1[j]*x+b1[j]));
        var yhat=b2; for(j=0;j<H;j++) yhat+=w2[j]*a1[j];
        var err=yhat-yt; gb2+=2*err;
        for(j=0;j<H;j++){ gw2[j]+=2*err*a1[j]; var da=2*err*w2[j]*(1-a1[j]*a1[j]); gw1[j]+=da*x; gb1[j]+=da; }
      }
      for(j=0;j<H;j++){ w1[j]-=lr*gw1[j]/n; b1[j]-=lr*gb1[j]/n; w2[j]-=lr*gw2[j]/n; }
      b2-=lr*gb2/n;
    }
    return function(x){ var xv=nx(x), a1=[]; for(var j2=0;j2<H;j2++) a1.push(Math.tanh(w1[j2]*xv+b1[j2])); var yh=b2; for(j2=0;j2<H;j2++) yh+=w2[j2]*a1[j2]; return invy(yh); };
  }
  var NN18=(function(){
    var out=[];
    for(var H=1; H<=8; H++){
      var predict=trainNN18(H,6000,0.15,20260721+H*7);
      var trR=rmseOf(TRAIN18.map(function(i){return Y18[i];}), TRAIN18.map(function(i){return predict(X18[i]);}));
      var vaR=rmseOf(VAL18.map(function(i){return Y18[i];}), VAL18.map(function(i){return predict(X18[i]);}));
      var curve=[]; for(var xg=0; xg<=35; xg+=1) curve.push(predict(xg));
      out.push({H:H, trainRMSE:trR, valRMSE:vaR, curve:curve, predict:predict});
    }
    var best=out[0]; out.forEach(function(o){ if(o.valRMSE<best.valRMSE) best=o; });
    return {list:out, best:best};
  })();

  // 18.3 — MARS: 힌지 한 쌍의 절점을 전수 탐색(최소제곱 적합)
  var MARS18=(function(){
    var cands=[]; for(var t=4;t<=31;t++) cands.push(t);
    var results=cands.map(function(t){
      var Xd=X18.map(function(x){ return [1, Math.max(0,x-t), Math.max(0,t-x)]; });
      var Xt=matT(Xd), XtX=matMul(Xt,Xd), Xty=matVec(Xt,Y18);
      var w=solveLin(XtX,Xty);
      var sse=0; for(var i=0;i<N18;i++){ var pred=w[0]+w[1]*Math.max(0,X18[i]-t)+w[2]*Math.max(0,t-X18[i]); var d=Y18[i]-pred; sse+=d*d; }
      return {t:t, sse:sse, w:w};
    });
    var best=results[0]; results.forEach(function(r){ if(r.sse<best.sse) best=r; });
    return {cands:results, best:best};
  })();
  function marsPredict(x){ var b=MARS18.best; return b.w[0]+b.w[1]*Math.max(0,x-b.t)+b.w[2]*Math.max(0,b.t-x); }

  // 18.4 — SVR: epsilon-무감 손실을 반복 가중 최소제곱(IRLS)으로 근사 학습(특징=[1,x,x^2])
  var SVR_XM=mean(X18), SVR_XS=std(X18);
  function svrNx(x){ return (x-SVR_XM)/SVR_XS; }
  var SVR_XD=X18.map(function(x){ var xn=svrNx(x); return [1,xn,xn*xn]; });
  function svrWls(W){ var XtWX=matMulW(SVR_XD,W,SVR_XD), XtWy=matVecW(SVR_XD,W,Y18); return solveLin(XtWX,XtWy); }
  function svrPredAll(w){ return SVR_XD.map(function(row){ var s=0; for(var i=0;i<row.length;i++) s+=row[i]*w[i]; return s; }); }
  function trainSVR18(eps){
    var W=X18.map(function(){return 1;});
    var w=svrWls(W);
    for(var it=0; it<24; it++){
      var preds=svrPredAll(w);
      var Wtar=Y18.map(function(y,i){ var r=Math.abs(y-preds[i]); return r<=eps?0.02:1; });
      W=W.map(function(wv,i){ return 0.5*wv+0.5*Wtar[i]; });
      w=svrWls(W);
    }
    return w;
  }
  var SVR18=(function(){
    var out=[];
    for(var e=0.2; e<=3.001; e+=0.1){
      var eps=+e.toFixed(2);
      var w=trainSVR18(eps);
      var preds=svrPredAll(w);
      var inTube=0, sv=0, sse=0;
      for(var i=0;i<N18;i++){ var r=Math.abs(Y18[i]-preds[i]); if(r<=eps+1e-9) inTube++; else sv++; sse+=(Y18[i]-preds[i])*(Y18[i]-preds[i]); }
      var curve=[]; for(var xg=0;xg<=35;xg+=1){ var xn=svrNx(xg); curve.push(w[0]+w[1]*xn+w[2]*xn*xn); }
      out.push({eps:eps, inTube:inTube, sv:sv, rmse:Math.sqrt(sse/N18), curve:curve, w:w});
    }
    return out;
  })();

  // 18.5 — kNN 회귀 + 4모델(NN·MARS·SVR·kNN) 4겹 교차검증 공정 비교
  function knnPredictOn(trIdx, xq, k){
    var d=trIdx.map(function(i){ return {d:Math.abs(X18[i]-xq), y:Y18[i]}; });
    d.sort(function(a,b){ return a.d-b.d; });
    var s=0; for(var m=0;m<k;m++) s+=d[m].y;
    return s/k;
  }
  var KFOLDS18=(function(){
    var K=4, out=[];
    for(var kf=0;kf<K;kf++){
      var tr=[],te=[];
      for(var j=0;j<N18;j++){ if(j%K===kf) te.push(j); else tr.push(j); }
      out.push({tr:tr,te:te});
    }
    return out;
  })();
  var KNN18=(function(){
    var ks=[1,3,5,7,9,11,13], out=[];
    ks.forEach(function(k){
      var errs=[];
      KFOLDS18.forEach(function(f){
        var sse=0; f.te.forEach(function(i){ var p=knnPredictOn(f.tr,X18[i],k); var d=Y18[i]-p; sse+=d*d; });
        errs.push(sse/f.te.length);
      });
      out.push({k:k, rmse:Math.sqrt(mean(errs))});
    });
    var best=out[0]; out.forEach(function(o){ if(o.rmse<best.rmse) best=o; });
    return {list:out, best:best};
  })();
  function knnCurveFull(k){ var c=[]; for(var xg=0;xg<=35;xg+=1) c.push(knnPredictOn(TRAIN18,xg,k)); return c; }

  var COMPARE18=(function(){
    function cv(trainFn){
      var errs=[];
      KFOLDS18.forEach(function(f){
        var pred=trainFn(f.tr);
        var sse=0; f.te.forEach(function(i){ var d=Y18[i]-pred(X18[i]); sse+=d*d; });
        errs.push(sse/f.te.length);
      });
      return Math.sqrt(mean(errs));
    }
    function nnOn(trI){
      var xArr=trI.map(function(i){return X18[i];}), yArr=trI.map(function(i){return Y18[i];});
      var xm=mean(xArr), xs=std(xArr), ym=mean(yArr), ys=std(yArr);
      function nx(x){return (x-xm)/xs;} function ny(y){return (y-ym)/ys;} function invy(v){return v*ys+ym;}
      var H=3, rng=LCG(20260721), w1=[],b1=[],w2=[],b2=0,j;
      for(j=0;j<H;j++){ w1.push((rng()-0.5)*1.5); b1.push((rng()-0.5)*1.5); w2.push((rng()-0.5)*1.5); }
      var xn=xArr.map(nx), yn=yArr.map(ny), n=xn.length;
      for(var it=0; it<6000; it++){
        var gw1=[0,0,0], gb1=[0,0,0], gw2=[0,0,0], gb2=0;
        for(var p=0;p<n;p++){
          var x=xn[p], yt=yn[p], a1=[];
          for(j=0;j<H;j++) a1.push(Math.tanh(w1[j]*x+b1[j]));
          var yhat=b2; for(j=0;j<H;j++) yhat+=w2[j]*a1[j];
          var err=yhat-yt; gb2+=2*err;
          for(j=0;j<H;j++){ gw2[j]+=2*err*a1[j]; var da=2*err*w2[j]*(1-a1[j]*a1[j]); gw1[j]+=da*x; gb1[j]+=da; }
        }
        for(j=0;j<H;j++){ w1[j]-=0.15*gw1[j]/n; b1[j]-=0.15*gb1[j]/n; w2[j]-=0.15*gw2[j]/n; }
        b2-=0.15*gb2/n;
      }
      return function(xv){ var xnn=nx(xv), a1=[]; for(var j2=0;j2<H;j2++) a1.push(Math.tanh(w1[j2]*xnn+b1[j2])); var yh=b2; for(j2=0;j2<H;j2++) yh+=w2[j2]*a1[j2]; return invy(yh); };
    }
    function marsOn(trI){
      var xArr=trI.map(function(i){return X18[i];}), yArr=trI.map(function(i){return Y18[i];});
      var xmin=Math.min.apply(null,xArr), xmax=Math.max.apply(null,xArr);
      var cands=[]; for(var t=xmin+2;t<=xmax-2;t++) cands.push(t);
      var best=null;
      cands.forEach(function(t){
        var Xd=xArr.map(function(x){ return [1, Math.max(0,x-t), Math.max(0,t-x)]; });
        var Xt=matT(Xd), XtX=matMul(Xt,Xd), Xty=matVec(Xt,yArr);
        var w=solveLin(XtX,Xty);
        var sse=0; for(var i=0;i<xArr.length;i++){ var pred=w[0]+w[1]*Math.max(0,xArr[i]-t)+w[2]*Math.max(0,t-xArr[i]); var d=yArr[i]-pred; sse+=d*d; }
        if(best===null||sse<best.sse) best={t:t,w:w,sse:sse};
      });
      return function(xv){ return best.w[0]+best.w[1]*Math.max(0,xv-best.t)+best.w[2]*Math.max(0,best.t-xv); };
    }
    function svrOn(trI){
      var xArr=trI.map(function(i){return X18[i];}), yArr=trI.map(function(i){return Y18[i];});
      var xm2=mean(xArr), xs2=std(xArr);
      function nx2(x){ return (x-xm2)/xs2; }
      var Xd=xArr.map(function(x){ var xn=nx2(x); return [1,xn,xn*xn]; });
      function wls(W){ var XtWX=matMulW(Xd,W,Xd), XtWy=matVecW(Xd,W,yArr); return solveLin(XtWX,XtWy); }
      function predAll(w){ return Xd.map(function(row){ var s=0; for(var i=0;i<row.length;i++) s+=row[i]*w[i]; return s; }); }
      var W=xArr.map(function(){return 1;}), w=wls(W);
      for(var it=0; it<24; it++){
        var preds=predAll(w);
        var Wtar=yArr.map(function(y,i){ var r=Math.abs(y-preds[i]); return r<=0.6?0.02:1; });
        W=W.map(function(wv,i){ return 0.5*wv+0.5*Wtar[i]; });
        w=wls(W);
      }
      return function(xv){ var xn=nx2(xv); return w[0]+w[1]*xn+w[2]*xn*xn; };
    }
    function knnOn(trI){ return function(xv){ return knnPredictOn(trI,xv,3); }; }
    return {
      NN: cv(nnOn), MARS: cv(marsOn), SVR: cv(svrOn), kNN: cv(knnOn)
    };
  })();

  var scenes = [

  // ══════════ 1. 직선으로 안 되는 관계 ══════════
  { id:'bda18_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'model = LinearRegression().fit(X, y)', hl:'LinearRegression'},
        {t:'resid = y - model.predict(X)', hl:'resid'},
        {t:'plt.scatter(X, resid)   # 잔차 산점도', hl:'.scatter('},
        {t:'plt.axhline(0)          # 무작위면 이 선 주변에', hl:'axhline'}
      ];
      var acti=(s.step===0)?0:(s.step===1?1:2);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'residual_check.py', acti);
      var caps=['12건의 관측에 직선 하나를 최소제곱으로 맞춥니다',
                '그 직선의 잔차(실제-예측)를 점마다 실제로 계산합니다',
                '잔차를 구간별로 나눠 평균 내면 무작위가 아닌 패턴이 보입니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('직선: y = '+OLS18.intercept.toFixed(2)+' + '+OLS18.slope.toFixed(3)+'x   (RMSE='+OLS18.rmse.toFixed(2)+')', W*0.04, codeBot+44);

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=200;
      var xMax=35, yMin=Math.min.apply(null,Y18)-1, yMax=Math.max.apply(null,Y18)+1;
      function PX(xv){ return px0+(xv/xMax)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText(s.step<2 ? '관측값(점)과 최소제곱 직선' : '잔차(점) — 0선 기준 위/아래 패턴', px0, 18);

      if(s.step<2){
        ctx.fillStyle=BLU;
        X18.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y18[idx]),2.6,0,7); ctx.fill(); });
        if(s.step===1){
          ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
          ctx.moveTo(PX(0),PY(OLS18.intercept)); ctx.lineTo(PX(35),PY(OLS18.intercept+OLS18.slope*35)); ctx.stroke();
        }
      } else {
        var zeroY=PY(0);
        ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.setLineDash([4,3]); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(px0,zeroY); ctx.lineTo(px1,zeroY); ctx.stroke(); ctx.setLineDash([]);
        var rMax=Math.max.apply(null,OLS18.resid.map(Math.abs))+0.4;
        function PYR(rv){ return pBot-((rv+rMax)/(2*rMax))*(pBot-pTop); }
        X18.forEach(function(x,idx){
          var r=OLS18.resid[idx];
          ctx.fillStyle=r>=0?GRN:RED; ctx.beginPath(); ctx.arc(PX(x),PYR(r),3,0,7); ctx.fill();
        });
        var zones=[[0,11],[12,23],[24,35]], zlab=['앞 구간','중간 구간','뒤 구간'];
        zones.forEach(function(z,zi){
          var mxp=(PX(z[0])+PX(z[1]))/2, mv=OLS18.zoneMeans[zi];
          ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(PX(z[0]),PYR(mv)); ctx.lineTo(PX(z[1]),PYR(mv)); ctx.stroke();
          ctx.fillStyle=GLD; ctx.font='600 11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
          ctx.fillText(zlab[zi]+' 평균 '+mv.toFixed(2), mxp, PYR(mv)+(mv>=0?-8:16));
        });
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText(s.step===2 ? '초록=양, 빨강=음. 앞·뒤 구간은 (+), 중간 구간은 (-)로 체계적으로 쏠려 있습니다' : 'x = 0..35, 완만한 구간 뒤 가파른 구간으로 꺾이는 곡선 + 잡음', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (직선 적합 → 잔차 → 패턴 확인)', true);
      E.big('직선으로 안 되는 관계', '12건의 관측에 직선 하나를 최소제곱으로 맞추면 RMSE='+OLS18.rmse.toFixed(2)+'이 나옵니다. 그런데 그 직선의 잔차(실제-예측)를 x 순서대로 늘어놓고 앞·중간·뒤 세 구간의 평균을 실제로 계산하면 '+OLS18.zoneMeans[0].toFixed(2)+' → '+OLS18.zoneMeans[1].toFixed(2)+' → '+OLS18.zoneMeans[2].toFixed(2)+'로, 양(+)에서 음(-)으로 다시 양(+)으로 체계적으로 움직입니다. 잔차가 정말 무작위 잡음이라면 이런 구간별 쏠림이 나올 수 없습니다 — 이는 데이터에 직선이 못 담아내는 굽은 구조가 남아 있다는 뜻이고, 이 장에서는 그 구조를 잡아내는 네 가지 비선형 모델을 만납니다.'); }
  },

  // ══════════ 2. 신경망 — 유연함의 대가 ══════════
  { id:'bda18_02',
    enter:function(E){ var self=this;
      self.s={H:3};
      E.controls('<div class="ctrl"><label>은닉 노드 수</label><input type="range" id="b182h" min="1" max="8" step="1" value="3"><output id="b182ho">3</output></div>');
      E.bind('#b182h','input',function(e){ self.s.H=+e.target.value; document.getElementById('b182ho').textContent=self.s.H; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'mlp = MLPRegressor(hidden_layer_sizes=(h,),', hl:'MLPRegressor'},
        {t:"     activation='tanh', max_iter=6000)", dim:true},
        {t:'mlp.fit(X_train, y_train)', hl:'.fit('},
        {t:'rmse(y_train, mlp.predict(X_train))  # 훈련', hl:'y_train'},
        {t:'rmse(y_val, mlp.predict(X_val))      # 검증', hl:'y_val'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'mlp_demo.py', 2);

      var cur=NN18.list[s.H-1];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('은닉 h='+s.H+'  훈련 RMSE = '+cur.trainRMSE.toFixed(3), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('검증 RMSE = '+cur.valRMSE.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('최적 h* = '+NN18.best.H+' (검증 RMSE='+NN18.best.valRMSE.toFixed(3)+')', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('은닉 노드를 늘릴수록 곡선을 더 자유롭게 구부릴 수 있지만,', W*0.04, ry+58);
      ctx.fillText('그만큼 잡음까지 외우기 쉬워집니다', W*0.04, ry+76);

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=170;
      var yMin=Math.min.apply(null,Y18)-1, yMax=Math.max.apply(null,Y18)+1;
      function PX(xv){ return px0+(xv/35)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('학습된 곡선(금) vs 관측(점, 파랑=훈련·회색=검증)', px0, 18);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      cur.curve.forEach(function(yv,xi){ var xp=PX(xi), yp=PY(yv); if(xi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();
      TRAIN18.forEach(function(i2){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(X18[i2]),PY(Y18[i2]),2.6,0,7); ctx.fill(); });
      VAL18.forEach(function(i2){ ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(PX(X18[i2]),PY(Y18[i2]),3.2,0,7); ctx.stroke(); ctx.fillStyle=DIM; ctx.fill(); });

      var bx0=px0, by0=pBot+34, bw=(px1-px0-30)/8, bh=64;
      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('h별 훈련(금)·검증(파랑) RMSE', bx0, by0-6);
      var maxR=0; NN18.list.forEach(function(o){ if(o.trainRMSE>maxR)maxR=o.trainRMSE; if(o.valRMSE>maxR)maxR=o.valRMSE; });
      NN18.list.forEach(function(o,oi){
        var xh=bx0+oi*(bw+3);
        var htr=(o.trainRMSE/maxR)*bh, hva=(o.valRMSE/maxR)*bh;
        ctx.fillStyle=(o.H===s.H)?GLD:'rgba(255,210,122,0.45)'; ctx.fillRect(xh, by0+bh-htr, bw*0.42, htr);
        ctx.fillStyle=(o.H===s.H)?BLU:'rgba(122,184,255,0.45)'; ctx.fillRect(xh+bw*0.45, by0+bh-hva, bw*0.42, hva);
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(''+o.H, xh+bw*0.44, by0+bh+14);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 은닉 노드 수를 올려 검증 오차가 다시 커지는 지점을 찾아보세요', true);
      E.big('신경망 — 유연함의 대가', '입력 1개 → 은닉 노드 h개(쌍곡탄젠트 활성화) → 출력 1개인 작은 신경망을 순전파·역전파를 직접 구현해 경사하강으로 학습시킵니다. 은닉 노드를 1개에서 8개로 슬라이더로 늘리면 훈련 RMSE는 대체로 계속 줄어들지만(파라미터가 늘어 곡선이 더 자유로워지므로), 검증 RMSE는 h='+NN18.best.H+' 부근에서 최저('+NN18.best.valRMSE.toFixed(3)+')를 찍고 그 뒤로는 다시 커집니다. 은닉 노드가 너무 많으면 27개뿐인 훈련점의 잡음까지 곡선의 일부로 외워버리기 때문입니다 — 15장에서 본 그 U자 곡선이 신경망의 은닉층 크기에서도 똑같이 나타납니다. 실전에서는 이 지점을 넘지 않도록 L2 규제나 조기종료(검증 오차가 더 이상 줄지 않으면 학습을 멈추는 것)를 함께 씁니다.'); }
  },

  // ══════════ 3. 다변량 적응 회귀 스플라인(MARS) ══════════
  { id:'bda18_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"h_r = lambda t: np.maximum(0, X-t)", hl:'np.maximum'},
        {t:"h_l = lambda t: np.maximum(0, t-X)", dim:true},
        {t:'for t in candidates:', dim:true},
        {t:'    fit = LinearRegression().fit([h_r(t),h_l(t)], y)', hl:'LinearRegression'},
        {t:'best_t = min(candidates, key=sse)', hl:'min('}
      ];
      var acti=(s.step===0)?null:(s.step===1?[2,3][1]:4);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'mars_knot.py', acti);
      var caps=['꺾이는 지점(절점) 후보마다 힌지 함수 쌍을 만들어 봅니다',
                '후보 절점 28곳 전부에서 SSE를 실제로 계산합니다',
                'SSE가 가장 낮은 절점을 선택하고 구간별 기울기를 구합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('힌지(hinge) 함수 한 쌍', px0, 26);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU;
        ctx.fillText('h₊(x,t) = max(0, x-t)   ← 절점 t 오른쪽에서만 증가', px0, 50);
        ctx.fillStyle=GLD;
        ctx.fillText('h₋(x,t) = max(0, t-x)   ← 절점 t 왼쪽에서만 증가', px0, 72);
        var pTop=94, pBot=210;
        function PX(xv){ return px0+(xv/35)*(px1-px0); }
        function PY(yv){ return pBot-(yv/6)*(pBot-pTop); }
        var t0=16;
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
        for(var xv=0;xv<=35;xv++){ var yv=Math.max(0,xv-t0); var xp=PX(xv),yp=PY(yv); if(xv===0)ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }
        ctx.stroke();
        ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
        for(xv=0;xv<=35;xv++){ yv=Math.max(0,t0-xv); xp=PX(xv);yp=PY(yv); if(xv===0)ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }
        ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PX(t0),pTop); ctx.lineTo(PX(t0),pBot); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('예시 절점 t='+t0, PX(t0), pTop-8);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('후보 절점별 SSE (실측, 28개 전부 계산)', px0, 20);
        var pTop=36, pBot=210;
        var sseMax=Math.max.apply(null,MARS18.cands.map(function(c){return c.sse;}));
        function PXc(t){ return px0+((t-4)/27)*(px1-px0); }
        function PYs(sv){ return pBot-(sv/sseMax)*(pBot-pTop); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
        MARS18.cands.forEach(function(c,ci){ var xp=PXc(c.t), yp=PYs(c.sse); if(ci===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
        ctx.stroke();
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PXc(MARS18.best.t),PYs(MARS18.best.sse),5,0,7); ctx.fill();
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('x축: 절점 후보 t(4~31)   y축: 그 절점으로 힌지쌍을 적합했을 때 SSE', px0, pBot+20);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('최적 절점의 적합 곡선', px0, 20);
        var pTop=40, pBot=190;
        var yMin=Math.min.apply(null,Y18)-1, yMax=Math.max.apply(null,Y18)+1;
        function PX2(xv){ return px0+(xv/35)*(px1-px0); }
        function PY2(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
        ctx.fillStyle=BLU; X18.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX2(x),PY2(Y18[idx]),2.6,0,7); ctx.fill(); });
        ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
        for(var xv2=0;xv2<=35;xv2++){ var yp2=PY2(marsPredict(xv2)), xp2=PX2(xv2); if(xv2===0) ctx.moveTo(xp2,yp2); else ctx.lineTo(xp2,yp2); }
        ctx.stroke();
        ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(PX2(MARS18.best.t),pTop); ctx.lineTo(PX2(MARS18.best.t),pBot); ctx.stroke(); ctx.setLineDash([]);
        var slopeR=MARS18.best.w[1], slopeL=-MARS18.best.w[2];
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillStyle=GRN;
        ctx.fillText('절점 t*='+MARS18.best.t+' (SSE='+MARS18.best.sse.toFixed(2)+')', px0, pBot+22);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('t 이전 기울기 '+slopeL.toFixed(3)+' → t 이후 기울기 '+slopeR.toFixed(3), px0, pBot+42);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (힌지 함수 → 절점 탐색 → 최적 절점)', true);
      E.big('다변량 적응 회귀 스플라인(MARS)', '데이터가 스스로 「어디서 꺾이는지」를 알려주게 하는 방법입니다. 절점(knot) 후보 t마다 오른쪽으로만 기울어지는 힌지함수 h₊(x,t)=max(0,x-t)와 왼쪽으로만 기울어지는 h₋(x,t)=max(0,t-x)를 만들어 최소제곱으로 적합하고, SSE를 후보 28곳 전부에서 실제로 계산합니다. t=4부터 31까지 훑으면 SSE는 매끄러운 U자를 그리며 t='+MARS18.best.t+'에서 최솟값('+MARS18.best.sse.toFixed(2)+')을 기록합니다. 이 절점을 기준으로 앞 구간의 기울기는 '+(-MARS18.best.w[2]).toFixed(3)+', 뒤 구간의 기울기는 '+MARS18.best.w[1].toFixed(3)+'로 뚜렷이 갈립니다 — 직선 하나로는 억지로 눌러 담아야 했던 굽은 구조를, 데이터가 실제로 꺾이는 지점을 찾아 자연스럽게 표현한 것입니다.'); }
  },

  // ══════════ 4. 서포트 벡터 회귀 ══════════
  { id:'bda18_04',
    enter:function(E){ var self=this;
      self.s={idx:4}; // eps=0.2+4*0.1=0.6
      E.controls('<div class="ctrl"><label>튜브 폭 ε</label><input type="range" id="b184e" min="0" max="'+(SVR18.length-1)+'" step="1" value="4"><output id="b184eo">'+SVR18[4].eps.toFixed(1)+'</output></div>');
      E.bind('#b184e','input',function(e){ self.s.idx=+e.target.value; document.getElementById('b184eo').textContent=SVR18[self.s.idx].eps.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'svr = SVR(kernel="poly", degree=2, epsilon=eps)', hl:'epsilon=eps'},
        {t:'svr.fit(X_train, y_train)', hl:'.fit('},
        {t:'resid = np.abs(y - svr.predict(X))', hl:'resid'},
        {t:'in_tube = (resid <= eps).sum()', hl:'in_tube'},
        {t:'support_vectors = (resid > eps).sum()', hl:'support_vectors'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'svr_tube.py', 3);
      var cur=SVR18[s.idx];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('ε = '+cur.eps.toFixed(1), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('튜브 안 점 수 = '+cur.inTube+' / '+N18, W*0.04, ry+19);
      ctx.fillStyle=RED; ctx.fillText('서포트벡터 수 = '+cur.sv, W*0.04, ry+38);
      ctx.fillStyle=BLU; ctx.fillText('RMSE = '+cur.rmse.toFixed(3), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('튜브 안(오차 ≤ ε)은 벌점이 없어 곡선 모양에 영향을 못 줍니다', W*0.04, ry+78);

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=200;
      var yMin=Math.min.apply(null,Y18)-1, yMax=Math.max.apply(null,Y18)+1;
      function PX(xv){ return px0+(xv/35)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('회귀 곡선(금) ± ε 튜브(옅은 띠). 초록=튜브 안, 빨강=서포트벡터', px0, 18);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();

      ctx.beginPath();
      cur.curve.forEach(function(yv,xi){ var xp=PX(xi), yp=PY(yv+cur.eps); if(xi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      for(var xi2=35;xi2>=0;xi2--){ ctx.lineTo(PX(xi2), PY(cur.curve[xi2]-cur.eps)); }
      ctx.closePath(); ctx.fillStyle='rgba(255,210,122,0.14)'; ctx.fill();

      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      cur.curve.forEach(function(yv,xi){ var xp=PX(xi), yp=PY(yv); if(xi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();

      X18.forEach(function(x,idx){
        var pred=cur.curve[x], r=Math.abs(Y18[idx]-pred);
        ctx.fillStyle=(r<=cur.eps+1e-9)?GRN:RED; ctx.beginPath(); ctx.arc(PX(x),PY(Y18[idx]),2.8,0,7); ctx.fill();
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 ε을 넓혀 튜브 안 점 수와 서포트벡터 수 변화를 보세요', true);
      E.big('서포트 벡터 회귀', '일정 오차 범위(ε 튜브) 안에 들어온 점은 아예 벌점을 주지 않는다는 발상입니다. 이차항을 포함한 특징으로 epsilon-무감 손실을 반복 가중 최소제곱(IRLS)으로 근사 학습해, ε을 0.2부터 3.0까지 슬라이더로 넓히면 튜브 안 점 수는 '+SVR18[0].inTube+'개에서 시작해 점점 늘어나고, 튜브 밖에서 곡선의 모양을 실제로 결정짓는 서포트벡터 수는 그만큼 줄어드는 것을 매 단계 실제로 재계산합니다. ε이 너무 좁으면(0에 가까우면) 거의 모든 점이 서포트벡터가 되어 잡음까지 곡선에 반영되고, 너무 넓으면 곡선이 데이터의 진짜 굴곡을 놓치게 됩니다 — ε은 「이 정도 오차는 봐준다」는 관용의 크기를 정하는 다이얼입니다.'); }
  },

  // ══════════ 5. k-최근접 이웃 회귀와 모델 선택 ══════════
  { id:'bda18_05',
    enter:function(E){ var self=this;
      self.s={k:3};
      E.controls('<div class="ctrl"><label>이웃 수 k</label><input type="range" id="b185k" min="1" max="13" step="2" value="3"><output id="b185ko">3</output></div>');
      E.bind('#b185k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b185ko').textContent=self.s.k; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'knn = KNeighborsRegressor(n_neighbors=k)', hl:'KNeighborsRegressor'},
        {t:'knn.fit(X_train, y_train)', hl:'.fit('},
        {t:'cross_val_score(knn, X, y, cv=4)', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'knn_reg.py', 2);
      var curve=knnCurveFull(s.k);
      var curCV=null; KNN18.list.forEach(function(o){ if(o.k===s.k) curCV=o; });
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('k='+s.k+(curCV?'  CV RMSE = '+curCV.rmse.toFixed(3):''), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('최적 k* = '+KNN18.best.k+' (CV RMSE='+KNN18.best.rmse.toFixed(3)+')', W*0.04, ry+19);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('k가 작으면 곡선이 뾰족뾰족(잡음까지 추종),', W*0.04, ry+40);
      ctx.fillText('k가 크면 매끈하지만 굴곡을 놓칩니다', W*0.04, ry+58);

      ctx.font='600 12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('이 장 네 모델의 4겹 교차검증 RMSE 비교', W*0.04, ry+84);
      var models=[{name:'신경망',v:COMPARE18.NN,col:GLD},{name:'MARS',v:COMPARE18.MARS,col:BLU},{name:'SVR',v:COMPARE18.SVR,col:RED},{name:'kNN',v:COMPARE18.kNN,col:GRN}];
      var bestM=models[0]; models.forEach(function(m){ if(m.v<bestM.v) bestM=m; });
      var bw2=(W*0.42-8)/4, by2=ry+94, bh2=46, maxV=Math.max.apply(null,models.map(function(m){return m.v;}));
      models.forEach(function(m,mi){
        var xh=W*0.04+mi*bw2, hgt=(m.v/maxV)*bh2;
        ctx.fillStyle=(m===bestM)?m.col:m.col+'70'; ctx.fillRect(xh+3, by2+bh2-hgt, bw2-8, hgt);
        ctx.strokeStyle=(m===bestM)?'#fff':'rgba(255,255,255,0.25)'; ctx.lineWidth=(m===bestM)?1.6:1; ctx.strokeRect(xh+3, by2+bh2-hgt, bw2-8, hgt);
        ctx.fillStyle=TXT; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText(m.v.toFixed(3), xh+bw2/2, by2+bh2-hgt-5);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(m.name, xh+bw2/2, by2+bh2+15);
      });

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=170;
      var yMin=Math.min.apply(null,Y18)-1, yMax=Math.max.apply(null,Y18)+1;
      function PX(xv){ return px0+(xv/35)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('kNN 회귀 곡선(현재 k)', px0, 18);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      curve.forEach(function(yv,xi){ var xp=PX(xi), yp=PY(yv); if(xi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();
      ctx.fillStyle=BLU; X18.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y18[idx]),2.4,0,7); ctx.fill(); });

      var bx0=px0, by0=pBot+34, bw3=(px1-px0-40)/7;
      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('k별 4겹 CV RMSE', bx0, by0-6);
      var maxK=Math.max.apply(null,KNN18.list.map(function(o){return o.rmse;}));
      KNN18.list.forEach(function(o,oi){
        var xh=bx0+oi*bw3, hgt2=(o.rmse/maxK)*50;
        ctx.fillStyle=(o.k===s.k)?GRN:'rgba(126,224,176,0.4)'; ctx.fillRect(xh, by0+50-hgt2, bw3-6, hgt2);
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillText('k'+o.k, xh+(bw3-6)/2, by0+68);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 k를 바꿔 곡선의 부드러움과 CV RMSE를 비교해 보세요', true);
      E.big('k-최근접 이웃 회귀와 모델 선택', '새 입력값 주변에서 가장 가까운 k개 훈련점의 y값을 평균 내는, 가장 단순한 비선형 방법입니다. k를 1부터 13까지 슬라이더로 바꾸면 4겹 교차검증 RMSE는 k='+KNN18.best.k+'에서 최저('+KNN18.best.rmse.toFixed(3)+')를 찍습니다 — k가 작으면(k=1) 곡선이 각 점을 그대로 따라가 뾰족뾰족해지고(과적합), k가 크면(k=13) 너무 많은 이웃을 평균 내 굴곡을 뭉개버립니다(과소적합). 이 장에서 만난 신경망·MARS·SVR·kNN 네 모델을 같은 4겹 교차검증으로 공정하게 겨루면 MARS가 RMSE '+COMPARE18.MARS.toFixed(3)+'로 가장 낮고, 신경망('+COMPARE18.NN.toFixed(3)+')이 근소하게 뒤를 잇습니다 — 이 데이터처럼 뚜렷한 꺾임(절점) 하나가 구조의 전부라면 그 구조를 정확히 겨냥하는 MARS가 유리하고, 구조가 더 복잡하고 매끄럽다면 신경망이나 SVR이 유리해지는 식으로, 「어떤 모델이 항상 최고」는 없고 데이터의 생김새에 맞춰 골라야 합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
