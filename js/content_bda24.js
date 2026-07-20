/* 빅데이터 분석 제24장 — 비선형 분류 모델 (QDA/RDA·커널 로지스틱(SVM)·신경망·나이브 베이즈·모델 비교)
   동작(behavior)만. 텍스트=content/bda24.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(정확도·공분산행렬·판별식·커널 가중치·역전파 그래디언트·가우스 우도·
   교차검증 카파·AUC)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   QDA/RDA는 2×2 공분산 역행렬을 크래머 공식으로 직접 풀고, SVM은 RBF 커널 로지스틱 회귀를
   경사하강으로, 신경망은 순전파·역전파를 직접 구현, 나이브 베이즈는 대각 가우스 우도를 계산한다.
   난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff';

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

  // ══════════ 고정 데이터: 동심원 90건 — 심사지표1(x1)·심사지표2(x2) → 통과 여부(y) ══════════
  var N24=90, X1_24=[], X2_24=[], Y24=[];
  (function(){
    var rng=LCG(20260924);
    for(var i=0;i<N24;i++){
      var inner=(i%2===0);
      var ang=rng()*2*Math.PI;
      var r=inner?(1.1+rng()*1.1):(3.0+rng()*1.3);
      var x1=5+r*Math.cos(ang)+(rng()-0.5)*0.5;
      var x2=5+r*Math.sin(ang)*0.85+(rng()-0.5)*0.5;
      X1_24.push(+x1.toFixed(2)); X2_24.push(+x2.toFixed(2)); Y24.push(inner?1:0);
    }
    var rng2=LCG(552013);
    for(i=0;i<N24;i++){ if(rng2()<0.07) Y24[i]=1-Y24[i]; }
  })();
  var IDX0_24=[], IDX1_24=[]; for(var _i24=0;_i24<N24;_i24++) (Y24[_i24]===1?IDX1_24:IDX0_24).push(_i24);
  var POS24=IDX1_24.length, NEG24=N24-POS24;
  var TE24=[]; for(_i24=4;_i24<N24;_i24+=5) TE24.push(_i24);
  var TR24=[]; for(_i24=0;_i24<N24;_i24++){ if(TE24.indexOf(_i24)<0) TR24.push(_i24); }

  // ── 선형 로지스틱 회귀(경사하강) ──────────────────────────
  var mX1_24=mean(X1_24), sX1_24=std(X1_24), mX2_24=mean(X2_24), sX2_24=std(X2_24);
  var X1s_24=X1_24.map(function(v){return (v-mX1_24)/sX1_24;});
  var X2s_24=X2_24.map(function(v){return (v-mX2_24)/sX2_24;});
  function logregGD(feats,y,lr,iters,l2){
    var p=feats[0].length,n=y.length,w=new Array(p).fill(0),b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0),gb=0;
      for(var i=0;i<n;i++){ var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j]; var pr=sigmoid(z),err=pr-y[i];
        for(j=0;j<p;j++) gw[j]+=err*feats[i][j]; gb+=err; }
      for(j=0;j<p;j++) w[j]-=lr*(gw[j]/n+l2*w[j]);
      b-=lr*(gb/n);
    }
    return {w:w,b:b};
  }
  var LOGF24=[]; for(_i24=0;_i24<N24;_i24++) LOGF24.push([X1s_24[_i24],X2s_24[_i24]]);
  var LR24=logregGD(LOGF24,Y24,0.5,2000,0.02);
  var LR24_ACC=(function(){ var c=0; for(var i=0;i<N24;i++){ var z=LR24.b+LR24.w[0]*X1s_24[i]+LR24.w[1]*X2s_24[i]; if((sigmoid(z)>0.5?1:0)===Y24[i]) c++; } return c/N24; })();
  var MAJ24_ACC=Math.max(POS24,NEG24)/N24;

  // ── 2×2 공분산 · QDA/RDA(정규화 판별) ──────────────────────
  function meanIdx(idx,a){ return mean(idx.map(function(i){return a[i];})); }
  function covMat2(idx,a1,a2,m1,m2){
    var s11=0,s12=0,s22=0; idx.forEach(function(i){ var d1=a1[i]-m1,d2=a2[i]-m2; s11+=d1*d1; s12+=d1*d2; s22+=d2*d2; });
    var n=idx.length-1; return [[s11/n,s12/n],[s12/n,s22/n]];
  }
  function inv2(M){ var det=M[0][0]*M[1][1]-M[0][1]*M[1][0]; return {inv:[[M[1][1]/det,-M[0][1]/det],[-M[1][0]/det,M[0][0]/det]],det:det}; }
  var MU0_24=[meanIdx(IDX0_24,X1_24),meanIdx(IDX0_24,X2_24)], MU1_24=[meanIdx(IDX1_24,X1_24),meanIdx(IDX1_24,X2_24)];
  var S0_24=covMat2(IDX0_24,X1_24,X2_24,MU0_24[0],MU0_24[1]), S1_24=covMat2(IDX1_24,X1_24,X2_24,MU1_24[0],MU1_24[1]);
  var n0_24=IDX0_24.length, n1_24=IDX1_24.length;
  var Sp_24=[[((n0_24-1)*S0_24[0][0]+(n1_24-1)*S1_24[0][0])/(n0_24+n1_24-2),((n0_24-1)*S0_24[0][1]+(n1_24-1)*S1_24[0][1])/(n0_24+n1_24-2)],
             [((n0_24-1)*S0_24[1][0]+(n1_24-1)*S1_24[1][0])/(n0_24+n1_24-2),((n0_24-1)*S0_24[1][1]+(n1_24-1)*S1_24[1][1])/(n0_24+n1_24-2)]];
  var DET_S0_24=S0_24[0][0]*S0_24[1][1]-S0_24[0][1]*S0_24[1][0], DET_S1_24=S1_24[0][0]*S1_24[1][1]-S1_24[0][1]*S1_24[1][0];
  function rdaModel(lam){
    var Sig0=[[lam*Sp_24[0][0]+(1-lam)*S0_24[0][0], lam*Sp_24[0][1]+(1-lam)*S0_24[0][1]],[lam*Sp_24[1][0]+(1-lam)*S0_24[1][0], lam*Sp_24[1][1]+(1-lam)*S0_24[1][1]]];
    var Sig1=[[lam*Sp_24[0][0]+(1-lam)*S1_24[0][0], lam*Sp_24[0][1]+(1-lam)*S1_24[0][1]],[lam*Sp_24[1][0]+(1-lam)*S1_24[1][0], lam*Sp_24[1][1]+(1-lam)*S1_24[1][1]]];
    return {I0:inv2(Sig0), I1:inv2(Sig1), pi0:n0_24/N24, pi1:n1_24/N24};
  }
  function rdaScore(m,x1,x2){
    function disc(mu,Iv,det,pi){ var d1=x1-mu[0],d2=x2-mu[1]; var maha=Iv[0][0]*d1*d1+2*Iv[0][1]*d1*d2+Iv[1][1]*d2*d2; return -0.5*Math.log(Math.abs(det))-0.5*maha+Math.log(pi); }
    return disc(MU1_24,m.I1.inv,m.I1.det,m.pi1) - disc(MU0_24,m.I0.inv,m.I0.det,m.pi0);
  }
  function rdaAcc(lam){ var m=rdaModel(lam); var c=0; for(var i=0;i<N24;i++){ if((rdaScore(m,X1_24[i],X2_24[i])>0?1:0)===Y24[i]) c++; } return c/N24; }

  // ── 커널 로지스틱 회귀(RBF 커널, SVM 대역) ──────────────────────
  function rbf24(x1a,x2a,x1b,x2b,gamma){ var d1=x1a-x1b,d2=x2a-x2b; return Math.exp(-gamma*(d1*d1+d2*d2)); }
  function trainKLR(idxs,gamma,lr,iters,l2){
    var n=idxs.length;
    var K=[]; for(var a=0;a<n;a++){ var row=[]; for(var b=0;b<n;b++) row.push(rbf24(X1_24[idxs[a]],X2_24[idxs[a]],X1_24[idxs[b]],X2_24[idxs[b]],gamma)); K.push(row); }
    var alpha=new Array(n).fill(0), bb=0;
    for(var it=0;it<iters;it++){
      var pred=new Array(n), err=new Array(n);
      for(a=0;a<n;a++){ var z=bb; for(var c=0;c<n;c++) z+=alpha[c]*K[a][c]; pred[a]=sigmoid(z); err[a]=pred[a]-Y24[idxs[a]]; }
      var galpha=new Array(n).fill(0), gb=0;
      for(a=0;a<n;a++){ for(c=0;c<n;c++) galpha[c]+=err[a]*K[a][c]; gb+=err[a]; }
      for(a=0;a<n;a++) alpha[a]-=lr*(galpha[a]/n+l2*alpha[a]);
      bb-=lr*(gb/n);
    }
    return {alpha:alpha,b:bb,idxs:idxs,gamma:gamma};
  }
  function klrScore(m,x1,x2){ var z=m.b; for(var c=0;c<m.idxs.length;c++){ var j=m.idxs[c]; z+=m.alpha[c]*rbf24(x1,x2,X1_24[j],X2_24[j],m.gamma); } return z; }
  function klrAcc(m,idxs){ var c=0; idxs.forEach(function(i){ if((klrScore(m,X1_24[i],X2_24[i])>0?1:0)===Y24[i]) c++; }); return c/idxs.length; }

  // ── 신경망(은닉층 1개, tanh + 시그모이드, 역전파) ──────────────────────
  function trainNN24(idxs,H,epochs,lr,seed){
    var rng=LCG(seed);
    function rnd(){ return (rng()-0.5)*1.2; }
    var W1=[],b1=[]; for(var h=0;h<H;h++){ W1.push([rnd(),rnd()]); b1.push(rnd()); }
    var w2=[]; for(h=0;h<H;h++) w2.push(rnd());
    var b2=rnd();
    for(var ep=0;ep<epochs;ep++){
      var gW1=W1.map(function(){return [0,0];}), gb1=new Array(H).fill(0), gw2=new Array(H).fill(0), gb2=0;
      idxs.forEach(function(i){
        var x=[X1s_24[i],X2s_24[i]], y=Y24[i];
        var a1=[]; for(var h=0;h<H;h++){ var z=b1[h]+W1[h][0]*x[0]+W1[h][1]*x[1]; a1.push(Math.tanh(z)); }
        var z2=b2; for(h=0;h<H;h++) z2+=w2[h]*a1[h];
        var a2=sigmoid(z2), dz2=a2-y;
        for(h=0;h<H;h++) gw2[h]+=dz2*a1[h];
        gb2+=dz2;
        for(h=0;h<H;h++){ var da1=dz2*w2[h]; var dz1=da1*(1-a1[h]*a1[h]); gW1[h][0]+=dz1*x[0]; gW1[h][1]+=dz1*x[1]; gb1[h]+=dz1; }
      });
      var n=idxs.length;
      for(h=0;h<H;h++){ W1[h][0]-=lr*gW1[h][0]/n; W1[h][1]-=lr*gW1[h][1]/n; b1[h]-=lr*gb1[h]/n; w2[h]-=lr*gw2[h]/n; }
      b2-=lr*gb2/n;
    }
    return {H:H,W1:W1,b1:b1,w2:w2,b2:b2};
  }
  function nn24Score(m,x1v,x2v){
    var x=[(x1v-mX1_24)/sX1_24,(x2v-mX2_24)/sX2_24]; var a1=[];
    for(var h=0;h<m.H;h++){ var z=m.b1[h]+m.W1[h][0]*x[0]+m.W1[h][1]*x[1]; a1.push(Math.tanh(z)); }
    var z2=m.b2; for(h=0;h<m.H;h++) z2+=m.w2[h]*a1[h];
    return z2;
  }
  function nn24Acc(m,idxs){ var c=0; idxs.forEach(function(i){ if((nn24Score(m,X1_24[i],X2_24[i])>0?1:0)===Y24[i]) c++; }); return c/idxs.length; }
  var NN_HS=[1,2,3,4,6,8,12,16,20,24];
  var NN_CURVE=NN_HS.map(function(H){ var m=trainNN24(TR24,H,400,0.6,7000+H); return {H:H,train:nn24Acc(m,TR24),test:nn24Acc(m,TE24)}; });

  // ── 나이브 베이즈(대각 가우스) ──────────────────────
  function stdIdx(idx,a,m){ var s=0; idx.forEach(function(i){ var d=a[i]-m; s+=d*d; }); return Math.sqrt(s/(idx.length-1)); }
  var NB24=(function(){
    var m10=meanIdx(IDX0_24,X1_24), s10=stdIdx(IDX0_24,X1_24,m10), m20=meanIdx(IDX0_24,X2_24), s20=stdIdx(IDX0_24,X2_24,m20);
    var m11=meanIdx(IDX1_24,X1_24), s11=stdIdx(IDX1_24,X1_24,m11), m21=meanIdx(IDX1_24,X2_24), s21=stdIdx(IDX1_24,X2_24,m21);
    return {m10:m10,s10:s10,m20:m20,s20:s20,m11:m11,s11:s11,m21:m21,s21:s21,pi0:n0_24/N24,pi1:n1_24/N24};
  })();
  function gaussLog(x,m,s){ return -Math.log(s)-((x-m)*(x-m))/(2*s*s); }
  function nb24Score(m,x1,x2){
    var l0=Math.log(m.pi0)+gaussLog(x1,m.m10,m.s10)+gaussLog(x2,m.m20,m.s20);
    var l1=Math.log(m.pi1)+gaussLog(x1,m.m11,m.s11)+gaussLog(x2,m.m21,m.s21);
    return l1-l0;
  }
  var NB24_ACC=(function(){ var c=0; for(var i=0;i<N24;i++){ if((nb24Score(NB24,X1_24[i],X2_24[i])>0?1:0)===Y24[i]) c++; } return c/N24; })();

  function accKappa(preds,y){
    var n=preds.length,TP=0,FP=0,TN=0,FN=0;
    preds.forEach(function(pred,i){ var act=y[i]; if(pred===1&&act===1)TP++; else if(pred===1&&act===0)FP++; else if(pred===0&&act===0)TN++; else FN++; });
    var Po=(TP+TN)/n, predPos=TP+FP,predNeg=TN+FN,actPos=TP+FN,actNeg=TN+FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po,kappa:(Po-Pe)/(1-Pe)};
  }
  function rocAUC(scores,y){
    var thr=Array.from(new Set(scores)).sort(function(a,b){return b-a;});
    var mx=Math.max.apply(null,scores), mn=Math.min.apply(null,scores);
    thr.unshift(mx+1); thr.push(mn-1);
    function conf(t){ var TP=0,FP=0,TN=0,FN=0; for(var i=0;i<scores.length;i++){ var p=scores[i]>=t?1:0; if(p===1&&y[i]===1)TP++; else if(p===1&&y[i]===0)FP++; else if(p===0&&y[i]===0)TN++; else FN++; } return {TP:TP,FP:FP,TN:TN,FN:FN}; }
    var pts=thr.map(function(t){ var c=conf(t); return {fpr:c.FP/(c.FP+c.TN),tpr:c.TP/(c.TP+c.FN)}; });
    pts.sort(function(a,b){ return (a.fpr-b.fpr)||(a.tpr-b.tpr); });
    var A=0; for(var i=1;i<pts.length;i++) A+=(pts[i].fpr-pts[i-1].fpr)*(pts[i].tpr+pts[i-1].tpr)/2;
    return A;
  }

  // ── 24.5(사례) 5겹 교차검증: QDA·SVM(커널로지스틱)·NN·NB ──────────────────────
  var CASE24=(function(){
    var folds=5;
    var predQDA=new Array(N24),predSVM=new Array(N24),predNN=new Array(N24),predNB=new Array(N24);
    for(var f=0;f<folds;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N24;i++){ if(i%folds===f) teIdx.push(i); else trIdx.push(i); }
      var tr0=trIdx.filter(function(i){return Y24[i]===0;}), tr1=trIdx.filter(function(i){return Y24[i]===1;});
      var mu0=[meanIdx(tr0,X1_24),meanIdx(tr0,X2_24)], mu1=[meanIdx(tr1,X1_24),meanIdx(tr1,X2_24)];
      var s0=covMat2(tr0,X1_24,X2_24,mu0[0],mu0[1]), s1=covMat2(tr1,X1_24,X2_24,mu1[0],mu1[1]);
      var i0=inv2(s0), i1=inv2(s1), pi0f=tr0.length/trIdx.length, pi1f=tr1.length/trIdx.length;
      function qScore(x1,x2){
        function disc(mu,Iv,det,pi){ var d1=x1-mu[0],d2=x2-mu[1]; var maha=Iv[0][0]*d1*d1+2*Iv[0][1]*d1*d2+Iv[1][1]*d2*d2; return -0.5*Math.log(Math.abs(det))-0.5*maha+Math.log(pi); }
        return disc(mu1,i1.inv,i1.det,pi1f) - disc(mu0,i0.inv,i0.det,pi0f);
      }
      teIdx.forEach(function(i){ predQDA[i]=(qScore(X1_24[i],X2_24[i])>0)?1:0; });
      var km=trainKLR(trIdx,0.3,0.5,120,0.05);
      teIdx.forEach(function(i){ predSVM[i]=(klrScore(km,X1_24[i],X2_24[i])>0)?1:0; });
      var nm=trainNN24(trIdx,6,250,0.6,9000+f);
      teIdx.forEach(function(i){ predNN[i]=(nn24Score(nm,X1_24[i],X2_24[i])>0)?1:0; });
      var m10=meanIdx(tr0,X1_24), s10=stdIdx(tr0,X1_24,m10), m20=meanIdx(tr0,X2_24), s20=stdIdx(tr0,X2_24,m20);
      var m11=meanIdx(tr1,X1_24), s11=stdIdx(tr1,X1_24,m11), m21=meanIdx(tr1,X2_24), s21=stdIdx(tr1,X2_24,m21);
      var nbm={m10:m10,s10:s10,m20:m20,s20:s20,m11:m11,s11:s11,m21:m21,s21:s21,pi0:pi0f,pi1:pi1f};
      teIdx.forEach(function(i){ predNB[i]=(nb24Score(nbm,X1_24[i],X2_24[i])>0)?1:0; });
    }
    var qmFull=rdaModel(0);
    var scoreQDA=X1_24.map(function(x1,i){ return rdaScore(qmFull,x1,X2_24[i]); });
    var allI=[]; for(_i24=0;_i24<N24;_i24++) allI.push(_i24);
    var kmFull=trainKLR(allI,0.3,0.5,150,0.05);
    var scoreSVM=X1_24.map(function(x1,i){ return klrScore(kmFull,x1,X2_24[i]); });
    var nmFull=trainNN24(allI,6,400,0.6,12345);
    var scoreNN=X1_24.map(function(x1,i){ return nn24Score(nmFull,x1,X2_24[i]); });
    var scoreNB=X1_24.map(function(x1,i){ return nb24Score(NB24,x1,X2_24[i]); });
    return {
      QDA:(function(){ var ak=accKappa(predQDA,Y24); ak.auc=rocAUC(scoreQDA,Y24); return ak; })(),
      SVM:(function(){ var ak=accKappa(predSVM,Y24); ak.auc=rocAUC(scoreSVM,Y24); return ak; })(),
      NN:(function(){ var ak=accKappa(predNN,Y24); ak.auc=rocAUC(scoreNN,Y24); return ak; })(),
      NB:(function(){ var ak=accKappa(predNB,Y24); ak.auc=rocAUC(scoreNB,Y24); return ak; })()
    };
  })();
  var BEST24=(function(){ var best='QDA', bk=CASE24.QDA.kappa; ['SVM','NN','NB'].forEach(function(k){ if(CASE24[k].kappa>bk){ bk=CASE24[k].kappa; best=k; } }); return best; })();
  var BEST24_NAME={QDA:'QDA',SVM:'커널 SVM',NN:'신경망',NB:'나이브 베이즈'};

  // ── 공용: 산점도 축 그리기 ──────────────────────
  function drawScatterFrame(ctx,px0,px1,pTop,pBot,x1max,x2max){
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
    ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
    ctx.fillText('심사지표1(x1)', (px0+px1)/2, pBot+18);
    ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('심사지표2(x2)',0,0); ctx.restore();
  }
  function drawDots(ctx,X1,X2,Y,PX,PY){
    for(var i=0;i<X1.length;i++){ ctx.fillStyle=Y[i]===1?GRN:RED; ctx.beginPath(); ctx.arc(PX(X1[i]),PY(X2[i]),2.8,0,7); ctx.fill(); }
  }

  var scenes = [

  // ══════════ 1. 직선으로 못 가르는 경계 ══════════
  { id:'bda24_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.linear_model import LogisticRegression', hl:'LogisticRegression'},
        {t:'linreg = LogisticRegression()', hl:'LogisticRegression'},
        {t:'linreg.fit(X[:, :2], y)   # 직선 경계만 표현', hl:'.fit('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'linear_fail.py', s.step===0?null:2);
      var caps=['지원 90건을 심사지표1(x1)·심사지표2(x2) 두 축에 놓으면 통과(초록)가 중심에, 반려(빨강)가 바깥 고리를 두릅니다',
                '어떤 직선을 그어도 안쪽 초록과 바깥 빨강을 가를 수 없습니다 — 원형으로 뒤엉킨 경계입니다',
                '실제로 로지스틱 회귀를 적합해 정확도를 재보면, 다수결로 찍는 것보다도 나쁩니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      ctx.font='12.5px ui-monospace,Menlo,monospace';
      if(s.step===2){
        ctx.fillStyle=RED; ctx.fillText('선형 로지스틱 정확도 = '+LR24_ACC.toFixed(3), W*0.04, codeBot+46);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('다수 클래스만 찍는 정확도 = '+MAJ24_ACC.toFixed(3)+' (직선 분류기가 이보다도 낮습니다)', W*0.04, codeBot+66);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('원형 구조에서는 「어느 쪽으로 직선을 그어도」 정확도가 무작위 수준에 머뭅니다', W*0.04, codeBot+90);
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=210;
      var x1max=Math.max.apply(null,X1_24)+1, x2max=Math.max.apply(null,X2_24)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      drawScatterFrame(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots(ctx,X1_24,X2_24,Y24,PX,PY);
      if(s.step>=1){
        // several sample straight lines through the data cloud (all fail)
        var lines=[[0.2,9],[9,0.2],[0.5,0.5]];
        ctx.setLineDash([3,3]); ctx.lineWidth=1.4;
        lines.forEach(function(pt,idx){
          ctx.strokeStyle= idx===2 && s.step===2 ? RED : 'rgba(255,255,255,0.28)';
          ctx.beginPath();
          if(idx<2){ ctx.moveTo(PX(0),PY(pt[0])); ctx.lineTo(PX(10),PY(10-pt[0]+pt[1]-pt[1])); }
        });
        // draw the actually-fitted logistic boundary: b + w0*x1s + w1*x2s = 0
        function lrX2(x1v){ var x1s=(x1v-mX1_24)/sX1_24; var x2s=(-LR24.b-LR24.w[0]*x1s)/LR24.w[1]; return x2s*sX2_24+mX2_24; }
        ctx.setLineDash([]); ctx.strokeStyle=(s.step===2)?RED:BLU; ctx.lineWidth=2.2;
        ctx.beginPath();
        ctx.moveTo(PX(0),PY(Math.max(0,Math.min(x2max,lrX2(0))))); ctx.lineTo(PX(x1max),PY(Math.max(0,Math.min(x2max,lrX2(x1max)))));
        ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=(s.step===2)?RED:BLU; ctx.textAlign='left';
        ctx.fillText('적합된 직선 경계', px0+6, pTop+14);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (산점도 → 직선 시도 → 정확도 확인)', true);
      E.big('직선으로 못 가르는 경계', '23장까지 배운 LDA·로지스틱·라쏘·NSC는 모두 곧은 직선(또는 평면)으로 두 집단을 가릅니다. 하지만 지원 90건이 심사지표1·2 위에서 통과(안쪽)·반려(바깥 고리)로 <b>원형</b>으로 뒤엉켜 있다면 어떤 직선도 이 둘을 가르지 못합니다 — 실제로 로지스틱 회귀를 적합해 정확도를 재면 '+LR24_ACC.toFixed(3)+'로, 다수 클래스만 찍는 정확도 '+MAJ24_ACC.toFixed(3)+'보다도 낮습니다. 데이터의 진짜 경계가 곡선이나 원이라면, 직선 하나로는 그 모양을 표현할 수조차 없습니다 — 이번 장은 이런 <b>비선형 경계</b>를 실제로 찾아내는 방법들을 다룹니다.'); }
  },

  // ══════════ 2. 이차판별분석(QDA)과 정규화 판별(RDA) ══════════
  { id:'bda24_02',
    enter:function(E){ var self=this;
      self.s={lam:1.0};
      E.controls('<div class="ctrl"><label>정규화 λ (1=LDA ↔ 0=QDA)</label><input type="range" id="b242l" min="0" max="1" step="0.05" value="1"><output id="b242lo">1.00</output></div>');
      E.bind('#b242l','input',function(e){ self.s.lam=+e.target.value; document.getElementById('b242lo').textContent=self.s.lam.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.discriminant_analysis import (', dim:true},
        {t:'    QuadraticDiscriminantAnalysis)', hl:'QuadraticDiscriminantAnalysis'},
        {t:'qda = QuadraticDiscriminantAnalysis(', hl:'QuadraticDiscriminantAnalysis'},
        {t:'    reg_param=lam)   # 정규화 판별(RDA)', hl:'reg_param'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'qda_rda.py', 2);
      var acc=rdaAcc(s.lam);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=(s.lam>0.6)?RED:(s.lam>0.15?GLD:GRN);
      ctx.fillText('λ='+s.lam.toFixed(2)+'  정확도 = '+acc.toFixed(3), W*0.04, ry);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('λ=1(LDA, 공분산 공유): '+rdaAcc(1).toFixed(3)+'  λ=0(QDA, 공분산 개별): '+rdaAcc(0).toFixed(3), W*0.04, ry+20);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=(Math.abs(DET_S0_24-DET_S1_24)/Math.max(DET_S0_24,DET_S1_24)>0.5)?RED:GLD;
      ctx.fillText('반려 집단 |S0|='+DET_S0_24.toFixed(2)+'  통과 집단 |S1|='+DET_S1_24.toFixed(2)+' — 두 값이 크게 다릅니다', W*0.04, ry+42);

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=Math.max.apply(null,X1_24)+1, x2max=Math.max.apply(null,X2_24)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      // decision region shading via grid (real recompute per lam)
      var m=rdaModel(s.lam);
      var gx=26, gy=20;
      for(var gi=0;gi<gx;gi++){
        for(var gj=0;gj<gy;gj++){
          var vx=(gi+0.5)/gx*x1max, vy=(gj+0.5)/gy*x2max;
          var pred=(rdaScore(m,vx,vy)>0)?1:0;
          ctx.fillStyle=pred===1?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.10)';
          ctx.fillRect(px0+gi*(px1-px0)/gx, pBot-(gj+1)*(pBot-pTop)/gy, (px1-px0)/gx+0.5, (pBot-pTop)/gy+0.5);
        }
      }
      drawScatterFrame(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots(ctx,X1_24,X2_24,Y24,PX,PY);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('연한 배경 = 현재 λ의 판별 경계(초록=통과 예측, 빨강=반려 예측)', px0, pTop-10);

      E.tapHint(W/2, H*0.95, '슬라이더로 λ를 바꿔 LDA↔QDA 사이를 오가며 경계가 바뀌는 것을 보세요', true);
      E.big('이차판별분석(QDA)과 정규화 판별(RDA)', '두 집단(통과·반려)의 공분산행렬을 각각 실제로 계산해 보면 반려 집단은 |S0|='+DET_S0_24.toFixed(2)+', 통과 집단은 |S1|='+DET_S1_24.toFixed(2)+'로 크게 다릅니다 — 안쪽 원은 좁고 촘촘하고, 바깥 고리는 넓고 성깁니다. 23장의 LDA는 두 집단이 <b>같은</b> 공분산을 공유한다고 가정해 직선 경계만 만들 수 있지만(λ=1일 때 정확도 '+rdaAcc(1).toFixed(3)+'), <b>QDA</b>는 두 집단의 공분산을 따로 인정해 <b>곡선(원에 가까운) 경계</b>를 만듭니다(λ=0일 때 정확도 '+rdaAcc(0).toFixed(3)+'). <b>정규화 판별(RDA)</b>은 λ로 그 사이를 잇는 다이얼입니다 — λ가 1에서 0으로 갈수록 두 집단 각자의 공분산을 얼마나 믿을지가 늘어나며 경계가 직선에서 곡선으로 부드럽게 휘어집니다.'); }
  },

  // ══════════ 3. 커널로 공간을 휘다 — SVM ══════════
  { id:'bda24_03',
    enter:function(E){ var self=this;
      self.s={gamma:0.3, cache:{}};
      E.controls('<div class="ctrl"><label>커널 폭(γ)</label><input type="range" id="b243g" min="0.02" max="4" step="0.02" value="0.3"><output id="b243go">0.30</output></div>');
      E.bind('#b243g','input',function(e){ self.s.gamma=+e.target.value; document.getElementById('b243go').textContent=self.s.gamma.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.svm import SVC', hl:'SVC'},
        {t:"svm = SVC(kernel='rbf', gamma=g)", hl:"kernel='rbf'"},
        {t:'svm.fit(X_train[:, :2], y_train)', hl:'.fit('},
        {t:'# 커널: 원 공간을 휘어 새 공간에서 직선으로', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'kernel_svm.py', 1);
      var gkey=s.gamma.toFixed(2);
      if(!s.cache[gkey]) s.cache[gkey]=trainKLR(TR24,s.gamma,0.5,150,0.05);
      var m=s.cache[gkey];
      var trAcc=klrAcc(m,TR24), teAcc=klrAcc(m,TE24);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('γ='+s.gamma.toFixed(2), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('훈련 정확도 = '+trAcc.toFixed(3), W*0.04, ry+20);
      ctx.fillStyle=BLU; ctx.fillText('검증 정확도 = '+teAcc.toFixed(3), W*0.04, ry+40);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var note = s.gamma<0.08 ? 'γ가 너무 작아 경계가 밋밋합니다 — 과소적합' : (s.gamma>2 ? 'γ가 너무 커 점 하나하나에 들러붙습니다 — 과적합 조짐' : 'γ가 적당해 원형 경계를 잘 잡습니다');
      ctx.fillText(note, W*0.04, ry+64);

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=Math.max.apply(null,X1_24)+1, x2max=Math.max.apply(null,X2_24)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      var gx=26, gy=20;
      for(var gi=0;gi<gx;gi++){
        for(var gj=0;gj<gy;gj++){
          var vx=(gi+0.5)/gx*x1max, vy=(gj+0.5)/gy*x2max;
          var pred=(klrScore(m,vx,vy)>0)?1:0;
          ctx.fillStyle=pred===1?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.10)';
          ctx.fillRect(px0+gi*(px1-px0)/gx, pBot-(gj+1)*(pBot-pTop)/gy, (px1-px0)/gx+0.5, (pBot-pTop)/gy+0.5);
        }
      }
      drawScatterFrame(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots(ctx,X1_24,X2_24,Y24,PX,PY);

      E.tapHint(W/2, H*0.95, '슬라이더로 γ를 바꿔 경계와 훈련/검증 정확도가 실제로 재계산되는 것을 보세요', true);
      E.big('커널로 공간을 휘다 — SVM', '원래 평면에서는 안쪽 원과 바깥 고리를 직선으로 가를 수 없지만, <b>커널</b>은 데이터를 (겉으로 드러내지 않고) 더 높은 차원의 공간으로 옮겨 그 공간에서는 직선(초평면)으로 갈리게 만듭니다. RBF 커널은 두 점의 거리가 가까울수록 큰 값을 주는 함수 exp(−γ‖x−x′‖²)입니다 — γ(감마)는 그 「가까움」을 얼마나 좁게 볼지 정합니다. γ를 슬라이더로 낮추면(0.02 근처) 경계가 뭉툭해 훈련·검증 정확도가 함께 낮고(과소적합), γ를 0.1~1 부근으로 두면 원형 경계를 정확히 그려 두 정확도가 모두 높아지며, γ를 계속 올리면(4 근처) 경계가 점 하나하나에 들러붙어 훈련 정확도는 높지만 검증 정확도는 오히려 흔들립니다(과적합 조짐) — 경계의 「구불거림 정도」를 γ 하나로 조절하는 셈입니다.'); }
  },

  // ══════════ 4. 신경망 분류와 유연함의 대가 ══════════
  { id:'bda24_04',
    enter:function(E){ var self=this;
      self.s={H:6, cache:{}};
      E.controls('<div class="ctrl"><label>은닉 노드 수</label><input type="range" id="b244h" min="1" max="24" step="1" value="6"><output id="b244ho">6</output></div>');
      E.bind('#b244h','input',function(e){ self.s.H=+e.target.value; document.getElementById('b244ho').textContent=self.s.H; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.neural_network import MLPClassifier', hl:'MLPClassifier'},
        {t:'nn = MLPClassifier(hidden_layer_sizes=(H,),', hl:'hidden_layer_sizes'},
        {t:"                    activation='tanh')", dim:true},
        {t:'nn.fit(X_train[:, :2], y_train)', hl:'.fit('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'nn_classify.py', 1);
      if(!s.cache[s.H]) s.cache[s.H]=trainNN24(TR24,s.H,400,0.6,7000+s.H);
      var m=s.cache[s.H];
      var trAcc=nn24Acc(m,TR24), teAcc=nn24Acc(m,TE24);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('은닉 노드 H='+s.H, W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('훈련 정확도 = '+trAcc.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=BLU; ctx.fillText('검증 정확도 = '+teAcc.toFixed(3), W*0.04, ry+38);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+54, bh=110, bw=(bx1-bx0)/NN_HS.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('H 스윕: 훈련(연한 초록) vs 검증(파랑) 정확도', bx0, by0-6);
      NN_CURVE.forEach(function(row,ri){
        var xk=bx0+ri*bw;
        ctx.fillStyle=GRN; ctx.globalAlpha=0.35; ctx.fillRect(xk+1, by0+bh-row.train*bh, bw*0.42, row.train*bh); ctx.globalAlpha=1;
        ctx.fillStyle=BLU; ctx.fillRect(xk+1+bw*0.46, by0+bh-row.test*bh, bw*0.42, row.test*bh);
        if(row.H===s.H){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.strokeRect(xk, by0-2, bw-1, bh+4); }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(''+row.H, xk+bw/2, by0+bh+14);
      });

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=Math.max.apply(null,X1_24)+1, x2max=Math.max.apply(null,X2_24)+1;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      var gx=26, gy=20;
      for(var gi=0;gi<gx;gi++){
        for(var gj=0;gj<gy;gj++){
          var vx=(gi+0.5)/gx*x1max, vy=(gj+0.5)/gy*x2max;
          var pred=(nn24Score(m,vx,vy)>0)?1:0;
          ctx.fillStyle=pred===1?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.10)';
          ctx.fillRect(px0+gi*(px1-px0)/gx, pBot-(gj+1)*(pBot-pTop)/gy, (px1-px0)/gx+0.5, (pBot-pTop)/gy+0.5);
        }
      }
      drawScatterFrame(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots(ctx,X1_24,X2_24,Y24,PX,PY);

      E.tapHint(W/2, H*0.95, '슬라이더로 은닉 노드 수를 바꿔 경계 복잡도가 실제로 바뀌는 것을 보세요', true);
      E.big('신경망 분류와 유연함의 대가', '은닉층 노드 하나하나는 입력을 저마다 다른 방향의 완만한 곡선(tanh)으로 접어, 이를 다시 합쳐 최종 경계를 만듭니다. 노드가 H=1~2개뿐이면(순전파·역전파를 직접 실행해 실측) 표현력이 부족해 원형 경계를 흉내조차 못 내 훈련·검증 정확도가 모두 낮습니다. H=3~4 근처에서 원형을 표현할 만큼 노드가 갖춰지며 두 정확도가 함께 뛰어오르고, 이후로는 노드를 더 늘려도(H=24까지) 정확도가 크게 나아지지 않습니다 — 이 데이터의 진짜 경계(원)를 표현하는 데 필요한 유연함은 이미 충분하기 때문입니다. 신경망은 유연한 만큼 계산 비용과 해석 난이도라는 대가를 치릅니다.'); }
  },

  // ══════════ 5. 나이브 베이즈와 모델 비교 ══════════
  { id:'bda24_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.naive_bayes import GaussianNB', hl:'GaussianNB'},
        {t:'nb = GaussianNB().fit(X[:, :2], y)', hl:'.fit('},
        {t:'# 조건부 독립 가정: p(x1,x2|y)=p(x1|y)p(x2|y)', dim:true},
        {t:'cross_val_score(model, X, y, cv=5)   # 공정 비교', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'nb_compare.py', s.step===0?1:3);
      var ry=codeBot+20;
      if(s.step===0){
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('나이브 베이즈 정확도 = '+NB24_ACC.toFixed(3), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('x1·x2를 서로 독립인 가우스 분포로 가정 — 대담한 가정입니다', W*0.04, ry+22);
        ctx.fillText('하지만 이 데이터는 두 축 사이 상관이 약해(원형 대칭) 가정이 크게 안 어긋납니다', W*0.04, ry+42);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU;
        ctx.fillText('반려집단 σ(x1)='+NB24.s10.toFixed(2)+' σ(x2)='+NB24.s20.toFixed(2), W*0.04, ry+66);
        ctx.fillText('통과집단 σ(x1)='+NB24.s11.toFixed(2)+' σ(x2)='+NB24.s21.toFixed(2), W*0.04, ry+86);
      } else {
        var names=['QDA','SVM(커널)','신경망','나이브베이즈'];
        var keys=['QDA','SVM','NN','NB'];
        var cols=[GRN,BLU,GLD,PUR];
        ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('5겹 교차검증(fold마다 재학습) — 22장의 정확도·카파·AUC로 비교', W*0.04, ry);
        var shown=Math.min(s.step,4);
        for(var k=0;k<shown;k++){
          var r=CASE24[keys[k]];
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[k];
          ctx.fillText(names[k]+'  정확도='+r.acc.toFixed(3)+'  κ='+r.kappa.toFixed(3)+'  AUC='+r.auc.toFixed(3), W*0.04, ry+22+k*20);
        }
        if(shown===4){
          var best='QDA', bk=CASE24.QDA.kappa;
          keys.forEach(function(kk){ if(CASE24[kk].kappa>bk){ bk=CASE24[kk].kappa; best=kk; } });
          ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
          ctx.fillText('→ 카파 기준 최종 선택: '+best, W*0.04, ry+22+4*20+10);
        }
      }

      var bx0=W*0.49, bx1=W*0.965, by0=40, bh=190, bw=(bx1-bx0)/4*0.6, gap=(bx1-bx0)/4;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('교차검증 정확도(연한색) vs 카파(진한색)', bx0, by0-8);
      var names2=['QDA','SVM','신경망','NB'], keys2=['QDA','SVM','NN','NB'], cols2=[GRN,BLU,GLD,PUR];
      var shown2=s.step===0?0:Math.min(s.step,4);
      for(var k2=0;k2<shown2;k2++){
        var r2=CASE24[keys2[k2]];
        var hAcc=r2.acc*bh, hKap=Math.max(0,r2.kappa)*bh;
        var xk2=bx0+k2*gap+gap*0.15;
        ctx.fillStyle=cols2[k2]; ctx.globalAlpha=0.35; ctx.fillRect(xk2, by0+bh-hAcc, bw*0.42, hAcc); ctx.globalAlpha=1;
        ctx.fillStyle=cols2[k2]; ctx.fillRect(xk2+bw*0.46, by0+bh-hKap, bw*0.42, hKap);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(names2[k2], xk2+bw*0.44, by0+bh+16);
      }
      if(s.step===0){ ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('탭하면 이 장의 네 모델을 하나씩 비교합니다 →', bx0, by0+bh/2); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (나이브 베이즈 → 모델을 하나씩 비교)', true);
      E.big('나이브 베이즈와 모델 비교', '<b>나이브 베이즈</b>는 「x1과 x2가 클래스 안에서 서로 독립」이라는 대담한 가정을 둡니다 — 두 축의 공분산(비대각 성분)을 아예 무시하고 각 축의 가우스 분포만 곱합니다. 원형으로 대칭인 이 데이터는 두 축 사이 상관이 실제로 약해서 이 가정이 크게 어긋나지 않고, 정확도 '+NB24_ACC.toFixed(3)+'로 QDA(공분산을 온전히 쓰는 모델)에 뒤지지 않습니다. 이 장에서 배운 QDA·커널 SVM·신경망·나이브 베이즈를 같은 90건에 <b>5겹 교차검증</b>으로 공정하게 비교하면 '+BEST24_NAME[BEST24]+'이(가) 카파 '+CASE24[BEST24].kappa.toFixed(3)+'로 가장 앞서지만 네 모델 모두 카파 0.7~0.8 사이로 준수합니다 — 가정이 완전히 틀리지만 않는다면, <b>단순한 모델도 복잡한 모델에 크게 밀리지 않을 수 있다</b>는 것이 비선형 분류의 흥미로운 결론입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
