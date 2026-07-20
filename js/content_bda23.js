/* 빅데이터 분석 제23장 — 판별 분석과 선형 분류 모델 (LDA·로지스틱 비교·PLS/벌점 분류·NSC·사례 종합)
   동작(behavior)만. 텍스트=content/bda23.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(판별 방향·투영 분포·분류 정확도·공분산행렬·벌점 경로의 생존 변수 수·
   교차검증 정확도·축소중심 판별점수·카파·AUC)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산
   (하드코딩 금지). LDA는 2×2 공분산 역행렬을 크래머 공식으로 직접 풀고, 벌점 분류는 좌표하강
   소프트임계값(ISTA) 라쏘를, 최근접 축소 중심은 실제 PAM/NSC 알고리즘을 그대로 구현한다.
   난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
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
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function sigmoid(z){ return 1/(1+Math.exp(-z)); }

  // ══════════ 고정 데이터: 지원서 70건 — 예산요청(x1)·실적점수(x2) → 승인 여부(y) ══════════
  var N23=70, X1_23=[], X2_23=[], Y23=[];
  (function(){
    var rng=LCG(20260901);
    for(var i=0;i<N23;i++){
      var x1=2+0.12*i+2.2*Math.sin(i/6)+(rng()-0.5)*2.4; x1=Math.max(0.2,x1);
      var x2=1+0.09*i+1.6*Math.cos(i/4)+(rng()-0.5)*2.0; x2=Math.max(0.2,x2);
      var z=-0.28*x1+0.55*x2-0.5;
      var p=sigmoid(z);
      var y=(rng()<p)?1:0;
      X1_23.push(+x1.toFixed(2)); X2_23.push(+x2.toFixed(2)); Y23.push(y);
    }
  })();
  var IDX0_23=[], IDX1_23=[]; for(var _i23=0;_i23<N23;_i23++) (Y23[_i23]===1?IDX1_23:IDX0_23).push(_i23);
  var POS23=IDX1_23.length, NEG23=IDX0_23.length;

  // 추가 특징(3~5장면용): 예산·실적과 약하게 얽힌 특징 2개 + 순수 잡음 6개 (별도 rng 스트림 — y와 무관하게 생성)
  var FNAME23=['예산요청(x1)','실적점수(x2)','기관규모(약신호)','공동연구지수(약신호)','잡음1','잡음2','잡음3','잡음4','잡음5','잡음6'];
  var FEATS23=[X1_23, X2_23];
  (function(){
    var rng2=LCG(31415926);
    var w1=[], w2=[];
    for(var i=0;i<N23;i++){
      w1.push(+(0.42*X2_23[i]+(rng2()-0.5)*4.2).toFixed(2));
      w2.push(+(-0.35*X1_23[i]+6+(rng2()-0.5)*4.0).toFixed(2));
    }
    FEATS23.push(w1); FEATS23.push(w2);
    for(var k=0;k<6;k++){
      var col=[];
      for(i=0;i<N23;i++) col.push(+((rng2()-0.5)*6).toFixed(2));
      FEATS23.push(col);
    }
  })();
  var P23=FEATS23.length;

  // ── 2×2 LDA(주어진 인덱스 부분집합) ──────────────────────────
  function meanIdx(idx,arr){ return mean(idx.map(function(i){return arr[i];})); }
  function covMat2(idx,a1,a2,m1,m2){
    var s11=0,s12=0,s22=0; idx.forEach(function(i){ var d1=a1[i]-m1, d2=a2[i]-m2; s11+=d1*d1; s12+=d1*d2; s22+=d2*d2; });
    var n=idx.length-1; return [[s11/n,s12/n],[s12/n,s22/n]];
  }
  function ldaFit2D(idx0,idx1,a1,a2){
    var mu0=[meanIdx(idx0,a1),meanIdx(idx0,a2)], mu1=[meanIdx(idx1,a1),meanIdx(idx1,a2)];
    var S0=covMat2(idx0,a1,a2,mu0[0],mu0[1]), S1=covMat2(idx1,a1,a2,mu1[0],mu1[1]);
    var n0=idx0.length, n1=idx1.length;
    var Sw=[[((n0-1)*S0[0][0]+(n1-1)*S1[0][0])/(n0+n1-2),((n0-1)*S0[0][1]+(n1-1)*S1[0][1])/(n0+n1-2)],
            [((n0-1)*S0[1][0]+(n1-1)*S1[1][0])/(n0+n1-2),((n0-1)*S0[1][1]+(n1-1)*S1[1][1])/(n0+n1-2)]];
    var det=Sw[0][0]*Sw[1][1]-Sw[0][1]*Sw[1][0];
    var Swi=[[Sw[1][1]/det,-Sw[0][1]/det],[-Sw[1][0]/det,Sw[0][0]/det]];
    var dmu=[mu1[0]-mu0[0], mu1[1]-mu0[1]];
    var w=[Swi[0][0]*dmu[0]+Swi[0][1]*dmu[1], Swi[1][0]*dmu[0]+Swi[1][1]*dmu[1]];
    function proj(x1,x2){ return w[0]*x1+w[1]*x2; }
    var t0=idx0.map(function(i){return proj(a1[i],a2[i]);}), t1=idx1.map(function(i){return proj(a1[i],a2[i]);});
    var cutoff=(mean(t0)+mean(t1))/2;
    return {mu0:mu0,mu1:mu1,S0:S0,S1:S1,Sw:Sw,w:w,proj:proj,t0:t0,t1:t1,cutoff:cutoff};
  }
  var LDA23=ldaFit2D(IDX0_23,IDX1_23,X1_23,X2_23);
  var LDA23_ACC=(function(){ var c=0; for(var i=0;i<N23;i++){ var pred=(LDA23.proj(X1_23[i],X2_23[i])>LDA23.cutoff)?1:0; if(pred===Y23[i])c++; } return c/N23; })();
  // 단순 평균차 방향(공분산 무시)과 비교
  var NAIVE23_W=(function(){ var dx=LDA23.mu1[0]-LDA23.mu0[0], dy=LDA23.mu1[1]-LDA23.mu0[1], n=Math.sqrt(dx*dx+dy*dy); return [dx/n,dy/n]; })();
  var NAIVE23=(function(){
    function proj(x1,x2){ return NAIVE23_W[0]*x1+NAIVE23_W[1]*x2; }
    var t0=IDX0_23.map(function(i){return proj(X1_23[i],X2_23[i]);}), t1=IDX1_23.map(function(i){return proj(X1_23[i],X2_23[i]);});
    var cutoff=(mean(t0)+mean(t1))/2;
    var c=0; for(var i=0;i<N23;i++){ var pred=(proj(X1_23[i],X2_23[i])>cutoff)?1:0; if(pred===Y23[i])c++; }
    return {proj:proj, t0:t0, t1:t1, cutoff:cutoff, acc:c/N23};
  })();

  // ── 로지스틱 회귀(경사하강) ──────────────────────────
  function logregGD(feats, y, lr, iters, l2){
    var p=feats[0].length, n=y.length, w=new Array(p).fill(0), b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0), gb=0;
      for(var i=0;i<n;i++){
        var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j];
        var pr=sigmoid(z), err=pr-y[i];
        for(j=0;j<p;j++) gw[j]+=err*feats[i][j];
        gb+=err;
      }
      for(j=0;j<p;j++) w[j]=w[j]-lr*(gw[j]/n + l2*w[j]);
      b=b-lr*(gb/n);
    }
    return {w:w,b:b};
  }
  var mX1_23=mean(X1_23), sX1_23=std(X1_23), mX2_23=mean(X2_23), sX2_23=std(X2_23);
  var X1s_23=X1_23.map(function(v){return (v-mX1_23)/sX1_23;});
  var X2s_23=X2_23.map(function(v){return (v-mX2_23)/sX2_23;});
  var LOGF23=[]; for(_i23=0;_i23<N23;_i23++) LOGF23.push([X1s_23[_i23],X2s_23[_i23]]);
  var LR23=logregGD(LOGF23, Y23, 0.5, 3000, 0.02);
  var LR23_ACC=(function(){ var c=0; for(var i=0;i<N23;i++){ var z=LR23.b+LR23.w[0]*X1s_23[i]+LR23.w[1]*X2s_23[i]; var pred=sigmoid(z)>0.5?1:0; if(pred===Y23[i])c++; } return c/N23; })();

  // ── 라쏘형 벌점 분류(좌표하강 ISTA) — 표준화된 P23개 특징 ──────────────
  var MEANS23=[], STDS23=[], FEATSs23=[];
  for(var j23=0;j23<P23;j23++){ var m23=mean(FEATS23[j23]), s23=std(FEATS23[j23]); MEANS23.push(m23); STDS23.push(s23); FEATSs23.push(FEATS23[j23].map(function(v){return (v-m23)/s23;})); }
  var XMAT23=[]; for(_i23=0;_i23<N23;_i23++){ var row=[]; for(j23=0;j23<P23;j23++) row.push(FEATSs23[j23][_i23]); XMAT23.push(row); }
  function softThresh(rho,lam){ if(rho>lam) return rho-lam; if(rho<-lam) return rho+lam; return 0; }
  function lassoCD(X,y,lam,iters){
    var n=X.length, p=X[0].length, beta=new Array(p).fill(0), ybar=mean(y);
    var yc=y.map(function(v){return v-ybar;});
    for(var it=0;it<iters;it++){
      for(var j=0;j<p;j++){
        var rho=0, denom=0;
        for(var i=0;i<n;i++){
          var pred=0; for(var k=0;k<p;k++){ if(k!==j) pred+=X[i][k]*beta[k]; }
          rho+=X[i][j]*(yc[i]-pred); denom+=X[i][j]*X[i][j];
        }
        beta[j]=softThresh(rho,lam*n)/denom;
      }
    }
    return {beta:beta, intercept:ybar};
  }
  function predictLin(m,xi){ var s=m.intercept; for(var j=0;j<m.beta.length;j++) s+=m.beta[j]*xi[j]; return s; }
  function cvAccLasso(X,y,lam,folds){
    var n=X.length, acc=0, cnt=0;
    for(var f=0;f<folds;f++){
      var trX=[],trY=[],teX=[],teY=[];
      for(var i=0;i<n;i++){ if(i%folds===f){teX.push(X[i]);teY.push(y[i]);} else {trX.push(X[i]);trY.push(y[i]);} }
      var m=lassoCD(trX,trY,lam,60), correct=0;
      for(i=0;i<teX.length;i++){ var pr=predictLin(m,teX[i]); if((pr>0.5?1:0)===teY[i]) correct++; }
      acc+=correct; cnt+=teX.length;
    }
    return acc/cnt;
  }

  // ── 최근접 축소 중심(NSC, 원본 스케일 특징 사용) ──────────────
  function nscTrain(feats,y){
    var n=y.length, p=feats.length, idx0=[],idx1=[];
    for(var i=0;i<n;i++) (y[i]===1?idx1:idx0).push(i);
    var n0=idx0.length, n1=idx1.length;
    var xbar=[],xbar0=[],xbar1=[],sj=[];
    for(var j=0;j<p;j++){
      var col=feats[j], m=mean(col);
      var m0=mean(idx0.map(function(i){return col[i];})), m1=mean(idx1.map(function(i){return col[i];}));
      var ss=0; idx0.forEach(function(i){ var d=col[i]-m0; ss+=d*d; }); idx1.forEach(function(i){ var d=col[i]-m1; ss+=d*d; });
      var s=Math.sqrt(ss/(n-2));
      xbar.push(m); xbar0.push(m0); xbar1.push(m1); sj.push(s);
    }
    var s0=sj.slice().sort(function(a,b){return a-b;})[Math.floor(p/2)];
    var m0k=Math.sqrt(1/n0+1/n), m1k=Math.sqrt(1/n1+1/n);
    var d0=[],d1=[];
    for(j=0;j<p;j++){ d0.push((xbar0[j]-xbar[j])/(m0k*(sj[j]+s0))); d1.push((xbar1[j]-xbar[j])/(m1k*(sj[j]+s0))); }
    return {xbar:xbar,sj:sj,s0:s0,m0k:m0k,m1k:m1k,d0:d0,d1:d1,n0:n0,n1:n1,n:n};
  }
  function shrink(d,delta){ var sg=d>0?1:(d<0?-1:0); return sg*Math.max(0,Math.abs(d)-delta); }
  function nscSurviving(model,delta){
    var cnt=0; for(var j=0;j<model.xbar.length;j++){ if(Math.abs(shrink(model.d0[j],delta))>1e-9||Math.abs(shrink(model.d1[j],delta))>1e-9) cnt++; } return cnt;
  }
  function nscClassify(model,xi,delta){
    var p=model.xbar.length, pi0=model.n0/model.n, pi1=model.n1/model.n, score0=0, score1=0;
    for(var j=0;j<p;j++){
      var d0s=shrink(model.d0[j],delta), d1s=shrink(model.d1[j],delta);
      var c0=model.xbar[j]+model.m0k*(model.sj[j]+model.s0)*d0s;
      var c1=model.xbar[j]+model.m1k*(model.sj[j]+model.s0)*d1s;
      score0+=(xi[j]-c0)*(xi[j]-c0)/((model.sj[j]+model.s0)*(model.sj[j]+model.s0));
      score1+=(xi[j]-c1)*(xi[j]-c1)/((model.sj[j]+model.s0)*(model.sj[j]+model.s0));
    }
    score0-=2*Math.log(pi0); score1-=2*Math.log(pi1);
    return score1<score0?1:0;
  }
  function nscCV(feats,y,delta,folds){
    var n=y.length, correct=0, total=0;
    for(var f=0;f<folds;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<n;i++){ if(i%folds===f) teIdx.push(i); else trIdx.push(i); }
      var trFeats=feats.map(function(col){ return trIdx.map(function(i){return col[i];}); });
      var trY=trIdx.map(function(i){return y[i];});
      var model=nscTrain(trFeats,trY);
      teIdx.forEach(function(i){ var xi=feats.map(function(col){return col[i];}); if(nscClassify(model,xi,delta)===y[i]) correct++; });
      total+=teIdx.length;
    }
    return correct/total;
  }
  var NSC23_FULL=nscTrain(FEATS23,Y23);

  function accKappa(preds,y){
    var n=preds.length, TP=0,FP=0,TN=0,FN=0;
    preds.forEach(function(pred,i){ var act=y[i];
      if(pred===1&&act===1)TP++; else if(pred===1&&act===0)FP++; else if(pred===0&&act===0)TN++; else FN++; });
    var Po=(TP+TN)/n, predPos=TP+FP,predNeg=TN+FN,actPos=TP+FN,actNeg=TN+FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po, kappa:(Po-Pe)/(1-Pe)};
  }

  // ── 22장 스타일 ROC-AUC(전체 적합 기준 점수, 참고용) ──────────────
  function rocAUCFromScores(scores,y){
    var seen={}, thr=[];
    scores.forEach(function(s){ if(!seen[s]){seen[s]=1; thr.push(s);} });
    thr.sort(function(a,b){return b-a;});
    var mx=Math.max.apply(null,scores), mn=Math.min.apply(null,scores);
    thr.unshift(mx+1); thr.push(mn-1);
    function confAtT(t){ var TP=0,FP=0,TN=0,FN=0; for(var i=0;i<scores.length;i++){ var pred=scores[i]>=t?1:0; if(pred===1&&y[i]===1)TP++; else if(pred===1&&y[i]===0)FP++; else if(pred===0&&y[i]===0)TN++; else FN++; } return {TP:TP,FP:FP,TN:TN,FN:FN}; }
    var pts=thr.map(function(t){ var c=confAtT(t); return {fpr:c.FP/(c.FP+c.TN), tpr:c.TP/(c.TP+c.FN)}; });
    pts.sort(function(a,b){ return (a.fpr-b.fpr)||(a.tpr-b.tpr); });
    var a=0; for(var i=1;i<pts.length;i++) a+=(pts[i].fpr-pts[i-1].fpr)*(pts[i].tpr+pts[i-1].tpr)/2;
    return a;
  }

  // ── 22.5(사례) 5겹 교차검증 종합 비교: LDA·로지스틱·라쏘(λ=0.08)·NSC(Δ=0.2) ──────────────
  var CASE23=(function(){
    var folds=5;
    var predLDA=new Array(N23), predLR=new Array(N23), predLasso=new Array(N23), predNSC=new Array(N23);
    for(var f=0;f<folds;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N23;i++){ if(i%folds===f) teIdx.push(i); else trIdx.push(i); }
      var tr0=trIdx.filter(function(i){return Y23[i]===0;}), tr1=trIdx.filter(function(i){return Y23[i]===1;});
      var ldaM=ldaFit2D(tr0,tr1,X1_23,X2_23);
      teIdx.forEach(function(i){ predLDA[i]=(ldaM.proj(X1_23[i],X2_23[i])>ldaM.cutoff)?1:0; });
      var trX1=trIdx.map(function(i){return X1_23[i];}), trX2=trIdx.map(function(i){return X2_23[i];});
      var m1=mean(trX1), s1=std(trX1), m2=mean(trX2), s2=std(trX2);
      var feats=trIdx.map(function(i){return [(X1_23[i]-m1)/s1,(X2_23[i]-m2)/s2];});
      var yv=trIdx.map(function(i){return Y23[i];});
      var lrM=logregGD(feats,yv,0.5,2000,0.02);
      teIdx.forEach(function(i){ var z=lrM.b+lrM.w[0]*(X1_23[i]-m1)/s1+lrM.w[1]*(X2_23[i]-m2)/s2; predLR[i]=sigmoid(z)>0.5?1:0; });
      var trXL=trIdx.map(function(i){return XMAT23[i];}), teXL=teIdx.map(function(i){return XMAT23[i];});
      var trYL=trIdx.map(function(i){return Y23[i];});
      var lassoM=lassoCD(trXL,trYL,0.08,80);
      teIdx.forEach(function(i,ii){ predLasso[i]=(predictLin(lassoM,teXL[ii])>0.5)?1:0; });
      var trFeatsRaw=FEATS23.map(function(col){ return trIdx.map(function(i){return col[i];}); });
      var nscM=nscTrain(trFeatsRaw,trYL);
      teIdx.forEach(function(i){ var xi=FEATS23.map(function(col){return col[i];}); predNSC[i]=nscClassify(nscM,xi,0.2); });
    }
    var scoreLDAfull=X1_23.map(function(x1,i){ return LDA23.proj(x1,X2_23[i]); });
    var scoreLRfull=X1s_23.map(function(x1s,i){ return LR23.b+LR23.w[0]*x1s+LR23.w[1]*X2s_23[i]; });
    var lassoFull=lassoCD(XMAT23,Y23,0.08,80);
    var scoreLassoFull=XMAT23.map(function(xi){ return predictLin(lassoFull,xi); });
    function nscScoreDiff(model,xi,delta){
      var p=model.xbar.length, pi0=model.n0/model.n, pi1=model.n1/model.n, s0v=0,s1v=0;
      for(var j=0;j<p;j++){ var d0s=shrink(model.d0[j],delta), d1s=shrink(model.d1[j],delta);
        var c0=model.xbar[j]+model.m0k*(model.sj[j]+model.s0)*d0s, c1=model.xbar[j]+model.m1k*(model.sj[j]+model.s0)*d1s;
        s0v+=(xi[j]-c0)*(xi[j]-c0)/((model.sj[j]+model.s0)*(model.sj[j]+model.s0));
        s1v+=(xi[j]-c1)*(xi[j]-c1)/((model.sj[j]+model.s0)*(model.sj[j]+model.s0)); }
      s0v-=2*Math.log(pi0); s1v-=2*Math.log(pi1); return s0v-s1v;
    }
    var scoreNSCfull=[]; for(_i23=0;_i23<N23;_i23++){ var xi=FEATS23.map(function(col){return col[_i23];}); scoreNSCfull.push(nscScoreDiff(NSC23_FULL,xi,0.2)); }
    return {
      LDA: (function(){var ak=accKappa(predLDA,Y23); ak.auc=rocAUCFromScores(scoreLDAfull,Y23); return ak;})(),
      LR: (function(){var ak=accKappa(predLR,Y23); ak.auc=rocAUCFromScores(scoreLRfull,Y23); return ak;})(),
      Lasso: (function(){var ak=accKappa(predLasso,Y23); ak.auc=rocAUCFromScores(scoreLassoFull,Y23); return ak;})(),
      NSC: (function(){var ak=accKappa(predNSC,Y23); ak.auc=rocAUCFromScores(scoreNSCfull,Y23); return ak;})()
    };
  })();

  var scenes = [

  // ══════════ 1. 두 집단을 가르는 선을 긋다 — 선형판별분석(LDA) ══════════
  { id:'bda23_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.discriminant_analysis import (', dim:true},
        {t:'    LinearDiscriminantAnalysis)', hl:'LinearDiscriminantAnalysis'},
        {t:'lda = LinearDiscriminantAnalysis()', hl:'LinearDiscriminantAnalysis'},
        {t:'lda.fit(X[:, :2], y)   # 판별 방향 = Sw⁻¹(μ1−μ0)', hl:'.fit('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'lda_fit.py', s.step===0?null:3);
      var caps=['예산요청(x1)·실적점수(x2) 두 축 위의 승인(초록)·반려(빨강) 산점도입니다',
                '단순히 두 집단 평균을 잇는 방향(공분산 무시)으로 투영하면 겹칩니다',
                'Sw⁻¹(μ1−μ0) 방향(집단내 분산 대비 집단간 분산 최대화)으로 투영하면 덜 겹칩니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      ctx.font='12.5px ui-monospace,Menlo,monospace';
      if(s.step===1){ ctx.fillStyle=RED; ctx.fillText('단순 평균차 방향 분류 정확도 = '+NAIVE23.acc.toFixed(3), W*0.04, codeBot+44); }
      else if(s.step===2){
        ctx.fillStyle=GRN; ctx.fillText('LDA 판별 방향 분류 정확도 = '+LDA23_ACC.toFixed(3), W*0.04, codeBot+44);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('(단순 평균차 '+NAIVE23.acc.toFixed(2)+' → LDA '+LDA23_ACC.toFixed(2)+', 공분산을 반영한 만큼 개선)', W*0.04, codeBot+64);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU;
        ctx.fillText('w=('+LDA23.w[0].toFixed(3)+', '+LDA23.w[1].toFixed(3)+')  cutoff='+LDA23.cutoff.toFixed(2), W*0.04, codeBot+84);
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=200;
      var x1max=Math.max.apply(null,X1_23)+1, x2max=Math.max.apply(null,X2_23)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('예산요청(x1)', (px0+px1)/2, pBot+20);
      ctx.save(); ctx.translate(px0-26,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('실적점수(x2)',0,0); ctx.restore();
      for(var i=0;i<N23;i++){ ctx.fillStyle=Y23[i]===1?GRN:RED; ctx.beginPath(); ctx.arc(PX(X1_23[i]),PY(X2_23[i]),3.2,0,7); ctx.fill(); }

      if(s.step>=1){
        var wUse=(s.step===1)?NAIVE23_W:LDA23.w, cutUse=(s.step===1)?NAIVE23.cutoff:LDA23.cutoff, col=(s.step===1)?RED:GRN;
        var norm=Math.sqrt(wUse[0]*wUse[0]+wUse[1]*wUse[1]);
        var dirx=wUse[0]/norm, diry=wUse[1]/norm;
        ctx.strokeStyle=col; ctx.lineWidth=2;
        var cx=x1max*0.5, cy=x2max*0.5, len=Math.max(x1max,x2max)*0.8;
        ctx.beginPath(); ctx.moveTo(PX(cx-dirx*len),PY(cy-diry*len)); ctx.lineTo(PX(cx+dirx*len),PY(cy+diry*len)); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=col; ctx.textAlign='left';
        var lblX=Math.max(px0+4, Math.min(px1-58, PX(cx+dirx*len)+4));
        var lblY=Math.max(pTop+12, Math.min(pBot-4, PY(cy+diry*len)));
        ctx.fillText('판별 방향', lblX, lblY);

        // 투영 히스토그램(1D)
        var hy0=pBot+42, hyH=46, hx0=px0, hx1=px1;
        var allT=(s.step===1?NAIVE23.t0.concat(NAIVE23.t1):LDA23.t0.concat(LDA23.t1));
        var tmin=Math.min.apply(null,allT)-0.3, tmax=Math.max.apply(null,allT)+0.3;
        function PT(v){ return hx0+((v-tmin)/(tmax-tmin))*(hx1-hx0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(hx0,hy0+hyH/2); ctx.lineTo(hx1,hy0+hyH/2); ctx.stroke();
        var t0arr=(s.step===1)?NAIVE23.t0:LDA23.t0, t1arr=(s.step===1)?NAIVE23.t1:LDA23.t1;
        t0arr.forEach(function(t){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PT(t),hy0+hyH/2-6,3,0,7); ctx.fill(); });
        t1arr.forEach(function(t){ ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PT(t),hy0+hyH/2+6,3,0,7); ctx.fill(); });
        var cutT=(s.step===1)?NAIVE23.cutoff:LDA23.cutoff;
        ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PT(cutT),hy0-4); ctx.lineTo(PT(cutT),hy0+hyH+4); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('투영값 1차원 분포 (빨강=반려, 초록=승인, 노랑점선=분류 경계)', hx0, hy0-10);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (산점도 → 단순 방향 → LDA 판별 방향)', true);
      E.big('두 집단을 가르는 선을 긋다 — LDA', '지원서 70건을 예산요청(x1)과 실적점수(x2) 두 축에 놓으면 승인(초록)·반려(빨강)가 뒤섞여 있습니다. 이 둘을 가장 잘 가르는 「방향」을 찾는 것이 선형판별분석입니다 — 단순히 두 집단의 평균을 잇는 방향으로 투영하면 정확도 '+NAIVE23.acc.toFixed(3)+'에 그치지만, <b>집단 내 분산은 작게, 집단 간 분산은 크게</b> 만드는 방향 w=Sw⁻¹(μ1−μ0)(공분산 역행렬을 2×2 크래머 공식으로 직접 풀어 구함)으로 투영하면 정확도가 '+LDA23_ACC.toFixed(3)+'로 오릅니다. 같은 두 평균을 잇는 것 같아도, 집단 안에서 퍼진 방향으로는 너그럽고 집단 사이를 가르는 방향으로는 엄격하게 가중치를 매기는 것이 핵심입니다.'); }
  },

  // ══════════ 2. 로지스틱 회귀와 무엇이 다른가 ══════════
  { id:'bda23_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.linear_model import LogisticRegression', hl:'LogisticRegression'},
        {t:'logit = LogisticRegression().fit(X[:, :2], y)', hl:'.fit('},
        {t:'# LDA: 정규분포 + 등공분산 가정, 최대우도가 아닌', dim:true},
        {t:'# 평균·공분산 적률로 직접 방향을 구함', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'lda_vs_logit.py', s.step===0?1:null);
      var det0=LDA23.S0[0][0]*LDA23.S0[1][1]-LDA23.S0[0][1]*LDA23.S0[1][0];
      var det1=LDA23.S1[0][0]*LDA23.S1[1][1]-LDA23.S1[0][1]*LDA23.S1[1][0];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GRN; ctx.fillText('LDA 정확도 = '+LDA23_ACC.toFixed(3), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('로지스틱 정확도 = '+LR23_ACC.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('두 방법 모두 선형 경계지만 추정 방식이 다릅니다', W*0.04, ry+41);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(Math.abs(det0-det1)/Math.max(det0,det1)>0.2)?RED:GLD;
      ctx.fillText('반려 집단 공분산 |S0|='+det0.toFixed(2)+'  승인 집단 |S1|='+det1.toFixed(2), W*0.04, ry+63);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('두 값이 꽤 다름 → LDA의 「등공분산」 가정이 어긋난 상태', W*0.04, ry+83);

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=210;
      var x1max=Math.max.apply(null,X1_23)+1, x2max=Math.max.apply(null,X2_23)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      for(var i=0;i<N23;i++){ ctx.fillStyle=Y23[i]===1?GRN:RED; ctx.beginPath(); ctx.arc(PX(X1_23[i]),PY(X2_23[i]),3.2,0,7); ctx.fill(); }
      // LDA 경계: w0*x1+w1*x2 = cutoff → x2 = (cutoff - w0*x1)/w1
      function ldaX2(x1v){ return (LDA23.cutoff - LDA23.w[0]*x1v)/LDA23.w[1]; }
      ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.beginPath();
      ctx.moveTo(PX(0),PY(Math.max(0,Math.min(x2max,ldaX2(0))))); ctx.lineTo(PX(x1max),PY(Math.max(0,Math.min(x2max,ldaX2(x1max)))));
      ctx.stroke();
      if(s.step===1){
        // 로지스틱 경계: b + w0*x1s + w1*x2s = 0 → x2 = ((-b - w0*x1s)*sX2 + mX2*w1)/w1  (재환산)
        function lrX2(x1v){ var x1s=(x1v-mX1_23)/sX1_23; var x2s=(-LR23.b-LR23.w[0]*x1s)/LR23.w[1]; return x2s*sX2_23+mX2_23; }
        ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.setLineDash([5,3]); ctx.beginPath();
        ctx.moveTo(PX(0),PY(Math.max(0,Math.min(x2max,lrX2(0))))); ctx.lineTo(PX(x1max),PY(Math.max(0,Math.min(x2max,lrX2(x1max)))));
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('예산요청(x1)', (px0+px1)/2, pBot+20);
      ctx.save(); ctx.translate(px0-26,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('실적점수(x2)',0,0); ctx.restore();
      ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText(s.step===0?'LDA 결정경계(초록 실선)':'LDA(초록 실선) vs 로지스틱(파랑 점선) 결정경계', px0, 18);

      E.tapHint(W/2, H*0.95, '화면 탭 = 로지스틱 회귀 경계를 겹쳐 비교', true);
      E.big('로지스틱 회귀와 무엇이 다른가', 'LDA는 「각 집단이 정규분포를 따르고 공분산이 서로 같다」는 가정 아래 평균·공분산의 적률(moment)로 판별 방향을 직접 계산합니다. 로지스틱 회귀는 그런 분포 가정 없이 우도를 최대화해 경계를 추정합니다. 같은 데이터에 두 방법을 실제로 적용하면 정확도는 LDA '+LDA23_ACC.toFixed(3)+', 로지스틱 '+LR23_ACC.toFixed(3)+'로 비슷하지만 경계선의 각도는 미묘하게 다릅니다. 실제로 두 집단의 공분산행렬을 계산해 보면 반려 집단 |S0|='+det0.toFixed(2)+', 승인 집단 |S1|='+det1.toFixed(2)+'로 <b>등공분산 가정이 어긋나 있습니다</b> — 이런 상황에서는 이론적으로 로지스틱 회귀(분포 가정이 적어 더 견고함)가 유리할 수 있지만, 표본이 적을 때는 LDA가 오히려 분산이 낮은(더 안정적인) 추정을 내놓기도 합니다. 어느 쪽이 나은지는 가정이 얼마나 어긋났는지와 표본 크기의 싸움입니다.'); }
  },

  // ══════════ 3. 변수가 많을 때 — PLS/벌점 분류 ══════════
  { id:'bda23_03',
    enter:function(E){ var self=this;
      self.s={lam:0.02};
      E.controls('<div class="ctrl"><label>벌점 강도 λ</label><input type="range" id="b233l" min="0" max="0.3" step="0.01" value="0.02"><output id="b233lo">0.02</output></div>');
      E.bind('#b233l','input',function(e){ self.s.lam=+e.target.value; document.getElementById('b233lo').textContent=self.s.lam.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# 좌표하강 + 소프트임계값(라쏘형 벌점)', dim:true},
        {t:'beta[j] = soft_threshold(rho_j, lam) / denom', hl:'soft_threshold'},
        {t:'nonzero = sum(abs(beta) > 0)', hl:'nonzero'},
        {t:'cv_acc = cross_val_score(model, X, y, cv=5)', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'penalized.py', 1);
      var m=lassoCD(XMAT23,Y23,s.lam,80);
      var nz=m.beta.filter(function(b){return Math.abs(b)>1e-6;}).length;
      var cv=cvAccLasso(XMAT23,Y23,s.lam,5);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('λ='+s.lam.toFixed(2)+'  생존 변수 = '+nz+'/'+P23, W*0.04, ry);
      ctx.fillStyle=(cv>0.68)?GRN:BLU; ctx.fillText('5겹 교차검증 정확도 = '+cv.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('λ=0(전체 '+P23+'개) 정확도 '+cvAccLasso(XMAT23,Y23,0,5).toFixed(2)+'은 잡음까지 끌어안아 오히려 낮습니다', W*0.04, ry+41);

      var bx0=W*0.49, bx1=W*0.965, by0=68, bh=140, bw=(bx1-bx0)/P23;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh/2); ctx.lineTo(bx1,by0+bh/2); ctx.stroke();
      var maxAbs=Math.max.apply(null,m.beta.map(function(b){return Math.abs(b);}),0.05);
      for(var j=0;j<P23;j++){
        var bh2=(Math.abs(m.beta[j])/maxAbs)*(bh/2-4);
        var col=(j<2)?GRN:(j<4?GLD:DIM);
        ctx.fillStyle=(Math.abs(m.beta[j])>1e-6)?col:'rgba(255,255,255,0.10)';
        if(m.beta[j]>=0) ctx.fillRect(bx0+j*bw+2, by0+bh/2-bh2, bw-4, bh2);
        else ctx.fillRect(bx0+j*bw+2, by0+bh/2, bw-4, bh2);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('특징별 계수(라쏘 경로) — 초록 2개: 강신호, 금 2개: 약신호, 회색 6개: 잡음', bx0, by0-8);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('x1  x2  w1  w2  n1  n2  n3  n4  n5  n6', (bx0+bx1)/2, by0+bh+16);

      var cy0=by0+bh+40;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('λ 스윕: 생존 변수 수(파랑) vs 교차검증 정확도(금)', bx0, cy0-4);
      var lambdas=[0,0.02,0.04,0.06,0.08,0.1,0.15,0.2,0.25,0.3];
      var lw=(bx1-bx0)/lambdas.length;
      lambdas.forEach(function(lam,li){
        var mm=lassoCD(XMAT23,Y23,lam,60);
        var nzz=mm.beta.filter(function(b){return Math.abs(b)>1e-6;}).length;
        var cvv=cvAccLasso(XMAT23,Y23,lam,5);
        var hgt1=(nzz/P23)*30, hgt2=cvv*30;
        ctx.fillStyle=BLU; ctx.fillRect(bx0+li*lw+2, cy0+30-hgt1, lw*0.42, hgt1);
        ctx.fillStyle=GLD; ctx.fillRect(bx0+li*lw+2+lw*0.46, cy0+30-hgt2, lw*0.42, hgt2);
        if(Math.abs(lam-s.lam)<0.011){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.strokeRect(bx0+li*lw+1, cy0-2, lw*0.94, 34); }
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 λ를 올려 생존 변수 수와 정확도가 실제로 바뀌는 것을 보세요', true);
      E.big('변수가 많을 때 — PLS/벌점 분류', '특징을 '+P23+'개(예산·실적 외에 약한 신호 2개, 순수 잡음 6개)로 늘리면 LDA·로지스틱처럼 모든 특징을 그대로 쓰는 선형 분류기는 잡음 변수까지 끌어안아 흔들립니다(λ=0일 때 5겹 교차검증 정확도 '+cvAccLasso(XMAT23,Y23,0,5).toFixed(2)+'). <b>라쏘형 벌점</b>은 좌표하강과 소프트임계값(부분나마 계수를 정확히 0으로 미는 것)을 실제로 반복 적용해, λ를 슬라이더로 올릴수록 생존 변수 수가 '+P23+'개에서 단계적으로 줄어듭니다. 잡음 변수들은 λ가 아주 작을 때부터 먼저 0으로 밀려나고, 신호가 있는 변수들이 더 오래 살아남습니다 — 교차검증 정확도는 적당한 λ 부근에서 최댓값을 찍은 뒤, λ가 너무 커져 신호 변수까지 밀려나면 다시 떨어집니다. 벌점이 「어떤 변수가 진짜인지」를 데이터로부터 실제로 골라내는 과정을 보여줍니다.'); }
  },

  // ══════════ 4. 가까운 중심으로 — 최근접 축소 중심(NSC) ══════════
  { id:'bda23_04',
    enter:function(E){ var self=this;
      self.s={delta:0.2};
      E.controls('<div class="ctrl"><label>축소량 Δ</label><input type="range" id="b234d" min="0" max="3" step="0.1" value="0.2"><output id="b234do">0.2</output></div>');
      E.bind('#b234d','input',function(e){ self.s.delta=+e.target.value; document.getElementById('b234do').textContent=self.s.delta.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'d_kj = (xbar_kj - xbar_j) / (m_k*(s_j+s0))', hl:'d_kj'},
        {t:"d'_kj = sign(d_kj) * max(|d_kj|-Δ, 0)", hl:'sign(d_kj)'},
        {t:"centroid'_kj = xbar_j + m_k*(s_j+s0)*d'_kj", hl:"centroid'_kj"},
        {t:'predict = nearest(centroid_shrunk, x)', hl:'nearest'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'nsc.py', 1);
      var surv=nscSurviving(NSC23_FULL,s.delta);
      var cv=nscCV(FEATS23,Y23,s.delta,5);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('Δ='+s.delta.toFixed(1)+'  생존 변수 = '+surv+'/'+P23, W*0.04, ry);
      ctx.fillStyle=(cv>0.65)?GRN:BLU; ctx.fillText('5겹 교차검증 정확도 = '+cv.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('Δ=0(전부 생존)은 잡음까지 중심 이동에 반영해 정확도가 낮습니다', W*0.04, ry+41);

      var bx0=W*0.49, bx1=W*0.965, by0=68, bh=130, bw=(bx1-bx0)/P23;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh/2); ctx.lineTo(bx1,by0+bh/2); ctx.stroke();
      var maxD=Math.max.apply(null,NSC23_FULL.d0.map(Math.abs).concat(NSC23_FULL.d1.map(Math.abs)));
      for(var j=0;j<P23;j++){
        var d1s=shrink(NSC23_FULL.d1[j],s.delta);
        var hh=(Math.abs(d1s)/maxD)*(bh/2-4);
        var col=(j<2)?GRN:(j<4?GLD:DIM);
        ctx.fillStyle=(Math.abs(d1s)>1e-6)?col:'rgba(255,255,255,0.10)';
        if(d1s>=0) ctx.fillRect(bx0+j*bw+2, by0+bh/2-hh, bw-4, hh);
        else ctx.fillRect(bx0+j*bw+2, by0+bh/2, bw-4, hh);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('승인 집단의 축소된 표준화 중심차 d\'₁ⱼ (0이면 그 변수는 탈락)', bx0, by0-8);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('x1  x2  w1  w2  n1  n2  n3  n4  n5  n6', (bx0+bx1)/2, by0+bh+16);

      var cy0=by0+bh+38;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('Δ 스윕: 생존 변수 수(파랑) vs 교차검증 정확도(금)', bx0, cy0-4);
      var deltas=[0,0.2,0.4,0.6,0.8,1.0,1.5,2.0,2.5,3.0];
      var dw=(bx1-bx0)/deltas.length;
      deltas.forEach(function(dv,di){
        var s2=nscSurviving(NSC23_FULL,dv), cv2=nscCV(FEATS23,Y23,dv,5);
        var hgt1=(s2/P23)*28, hgt2=cv2*28;
        ctx.fillStyle=BLU; ctx.fillRect(bx0+di*dw+2, cy0+28-hgt1, dw*0.42, hgt1);
        ctx.fillStyle=GLD; ctx.fillRect(bx0+di*dw+2+dw*0.46, cy0+28-hgt2, dw*0.42, hgt2);
        if(Math.abs(dv-s.delta)<0.06){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.strokeRect(bx0+di*dw+1, cy0-2, dw*0.94, 32); }
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 Δ를 올려 남는 변수 수와 정확도가 실제로 바뀌는 것을 보세요', true);
      E.big('가까운 중심으로 — 최근접 축소 중심', '새 지원서는 「어느 클래스 중심에 더 가까운가」로 분류할 수 있습니다. 다만 '+P23+'개 특징의 중심을 그대로 쓰면 잡음 변수(n1~n6)까지 중심 위치를 흔듭니다. <b>최근접 축소 중심(NSC)</b>은 각 변수의 표준화된 클래스-전체 중심차 d_kj를 계산한 뒤, 축소량 Δ만큼 0 쪽으로 소프트임계값 처리합니다 — Δ가 커질수록 신호가 약한 변수부터 중심차가 정확히 0이 되어(그 변수는 두 클래스 중심이 전체 평균과 같아짐) 분류에서 사실상 탈락합니다. Δ=0.2 부근에서는 잡음이 억제되면서도 예산·실적 신호는 남아 5겹 교차검증 정확도가 좋아지지만, Δ를 3까지 올리면 신호 변수까지 탈락해 정확도가 다시 정체됩니다 — 이 「축소된 중심」 자체가 곧 압축된 분류 규칙입니다.'); }
  },

  // ══════════ 5. 사례: 지원서 심사 예측 ══════════
  { id:'bda23_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'models = {"LDA":lda, "Logit":logit,', dim:true},
        {t:'          "Lasso":lasso, "NSC":nsc}', dim:true},
        {t:'for name, m in models.items():', dim:true},
        {t:'    cross_val_score(m, X, y, cv=5)   # 공정 비교', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_cv.py', 3);
      var names=['LDA','Logit','Lasso(λ.08)','NSC(Δ.2)'];
      var keys=['LDA','LR','Lasso','NSC'];
      var cols=[GRN,BLU,GLD,PUR];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('5겹 교차검증(fold마다 재학습) — 22장의 정확도·카파 지표로 비교', W*0.04, ry);
      var shown=Math.min(s.step+1,4);
      for(var k=0;k<shown;k++){
        var r=CASE23[keys[k]];
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[k];
        ctx.fillText(names[k]+'  정확도='+r.acc.toFixed(3)+'  κ='+r.kappa.toFixed(3)+'  AUC='+r.auc.toFixed(3), W*0.04, ry+22+k*20);
      }
      if(shown===4){
        var best='LDA', bk=CASE23.LDA.kappa;
        keys.forEach(function(kk){ if(CASE23[kk].kappa>bk){ bk=CASE23[kk].kappa; best=kk; } });
        ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
        ctx.fillText('→ 카파(정직한 교차검증 지표) 기준 최종 선택: '+best, W*0.04, ry+22+4*20+10);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=40, bh=210, bw=(bx1-bx0)/4*0.6, gap=(bx1-bx0)/4;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('교차검증 정확도(연한색) vs 카파(진한색)', bx0, by0-8);
      for(k=0;k<shown;k++){
        var r2=CASE23[keys[k]];
        var hAcc=r2.acc*bh, hKap=Math.max(0,r2.kappa)*bh;
        var xk=bx0+k*gap+gap*0.15;
        ctx.fillStyle=cols[k]; ctx.globalAlpha=0.35; ctx.fillRect(xk, by0+bh-hAcc, bw*0.42, hAcc); ctx.globalAlpha=1;
        ctx.fillStyle=cols[k]; ctx.fillRect(xk+bw*0.46, by0+bh-hKap, bw*0.42, hKap);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(names[k], xk+bw*0.44, by0+bh+16);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 모델을 하나씩 추가해 비교', true);
      E.big('사례: 지원서 심사 예측', '지금까지 배운 선형 분류기 넷(LDA·로지스틱·라쏘형 벌점·최근접 축소 중심)을 같은 70건의 지원서에 <b>5겹 교차검증(폴드마다 처음부터 재학습)</b>으로 공정하게 비교합니다. LDA와 로지스틱은 예산·실적 2개 특징만 쓰고, 라쏘와 NSC는 잡음 6개를 포함한 '+P23+'개 특징 전체에서 스스로 신호를 골라냅니다. 정확도만 보면 네 모델이 얼추 비슷해 보이지만, 22장에서 배운 <b>카파</b>로 우연 일치를 걷어내고 보면 라쏘형 벌점 모델(κ='+CASE23.Lasso.kappa.toFixed(3)+')이 가장 뚜렷한 신호를 잡아냅니다 — 흥미롭게도 전체 데이터에 적합한 AUC만 보면 LDA·로지스틱이 근소하게 앞서는데, 이는 그 AUC가 held-out 검증이 아닌 전체 적합 기준이기 때문입니다. <b>모델 선택은 교차검증으로 낸 정직한 지표를 기준으로 삼아야 한다</b>는 15장·22장의 원칙이 여기서도 그대로 확인됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
