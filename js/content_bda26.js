/* 빅데이터 분석 제26장 — 분류 모델 총정리 (지원 심사 확장 사례로 22~25장을 한자리에)
   동작(behavior)만. 텍스트=content/bda26.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(교차검증 정확도·카파·AUC·리샘플링 변동폭·계수·트리 규칙·오분류 겹침·
   1-표준오차 임계값)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   로지스틱은 경사하강, 결정 트리는 지니 불순도 기반 재귀분할, kNN은 실제 거리계산+다수결,
   신경망은 은닉층 1개(tanh)+역전파를 직접 구현해 학습한다.
   난수(Math.random) 절대 금지 — 표본·가중치 초기화·폴드 분할은 전부 고정 시드 LCG. */
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

  // ══════════ 고정 데이터: 지원 심사 확장판 110건 — 예산요청(x1)·실적점수(x2) → 특별승인(y) ══════════
  // 특별승인 기준이 「예산은 낮은데 실적이 아주 높다」거나 「예산은 아주 높은데 실적은 낮다」는 두 구석 코너라
  // 선형 경계 하나로는 가를 수 없는 비선형(체크보드형) 문제다. 22~25장에서 배운 후보들이 이 자리에서 겨룬다.
  var N26=110, X1_26=[], X2_26=[], Y26=[];
  (function(){
    var rng=LCG(20260913);
    for(var i=0;i<N26;i++){
      var x1=0.2+13.6*rng(), x2=0.2+13.6*rng();
      var cornerA=(x1<4.5 && x2>10), cornerB=(x1>10.5 && x2<4.5);
      var pBase=(cornerA||cornerB)?0.85:0.06;
      var y=(rng()<pBase)?1:0;
      X1_26.push(+x1.toFixed(2)); X2_26.push(+x2.toFixed(2)); Y26.push(y);
    }
  })();
  var mX1_26=mean(X1_26), sX1_26=std(X1_26), mX2_26=mean(X2_26), sX2_26=std(X2_26);
  var X1s_26=X1_26.map(function(v){return (v-mX1_26)/sX1_26;});
  var X2s_26=X2_26.map(function(v){return (v-mX2_26)/sX2_26;});
  var FEATS26=X1s_26.map(function(v,i){return [v,X2s_26[i]];});
  var POSRATE26=mean(Y26);

  // ── 로지스틱 회귀(경사하강) ──────────────────────────
  function logregGD(feats,y,lr,iters,l2){
    var p=feats[0].length,n=y.length,w=new Array(p).fill(0),b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0),gb=0;
      for(var i=0;i<n;i++){
        var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j];
        var pr=sigmoid(z), err=pr-y[i];
        for(j=0;j<p;j++) gw[j]+=err*feats[i][j];
        gb+=err;
      }
      for(j=0;j<p;j++) w[j]=w[j]-lr*(gw[j]/n+l2*w[j]);
      b=b-lr*(gb/n);
    }
    return {w:w,b:b};
  }
  function logregPredict(m,xi){ var z=m.b; for(var j=0;j<m.w.length;j++) z+=m.w[j]*xi[j]; return sigmoid(z); }

  // ── 결정 트리(지니 불순도, 재귀 이진분할) ──────────────────────────
  function gini(idx,y){ if(idx.length===0) return 0; var p1=0; idx.forEach(function(i){p1+=y[i];}); p1/=idx.length; return 1-p1*p1-(1-p1)*(1-p1); }
  function buildTree(idx,X,y,depth,maxDepth,minLeaf){
    var p1=0; idx.forEach(function(i){p1+=y[i];}); p1/=idx.length;
    if(depth>=maxDepth || idx.length<2*minLeaf || p1===0 || p1===1) return {leaf:true,p1:p1,cls:p1>=0.5?1:0};
    var bestGain=-1,bestFeat=-1,bestThresh=0,bestL=null,bestR=null,baseGini=gini(idx,y);
    for(var f=0;f<X[0].length;f++){
      var vals=idx.map(function(i){return X[i][f];}).slice().sort(function(a,b){return a-b;});
      for(var t=1;t<vals.length;t++){
        var thresh=(vals[t-1]+vals[t])/2;
        var L=idx.filter(function(i){return X[i][f]<=thresh;});
        var R=idx.filter(function(i){return X[i][f]>thresh;});
        if(L.length<minLeaf||R.length<minLeaf) continue;
        var wGini=(L.length*gini(L,y)+R.length*gini(R,y))/idx.length;
        var gain=baseGini-wGini;
        if(gain>bestGain){ bestGain=gain; bestFeat=f; bestThresh=thresh; bestL=L; bestR=R; }
      }
    }
    if(bestFeat<0) return {leaf:true,p1:p1,cls:p1>=0.5?1:0};
    return {leaf:false,featIdx:bestFeat,thresh:bestThresh,
      left:buildTree(bestL,X,y,depth+1,maxDepth,minLeaf),
      right:buildTree(bestR,X,y,depth+1,maxDepth,minLeaf)};
  }
  function treePredict(node,xi){ while(!node.leaf){ node=(xi[node.featIdx]<=node.thresh)?node.left:node.right; } return node.p1; }
  function bestLeafPath(node,path){
    if(node.leaf) return {p1:node.p1,path:path};
    var Lr=bestLeafPath(node.left,path.concat([{f:node.featIdx,t:node.thresh,dir:'≤'}]));
    var Rr=bestLeafPath(node.right,path.concat([{f:node.featIdx,t:node.thresh,dir:'>'}]));
    return (Lr.p1>=Rr.p1)?Lr:Rr;
  }
  function pathText(path){
    var names=['예산요청','실적점수'], means=[mX1_26,mX2_26], stds=[sX1_26,sX2_26];
    return path.map(function(c){
      var raw=c.t*stds[c.f]+means[c.f];
      return names[c.f]+c.dir+raw.toFixed(1);
    }).join('  그리고  ');
  }

  // ── kNN(k=7, 확률 = 이웃 중 양성 비율) ──────────────────────────
  function knnProb(trainX,trainY,xi,k){
    var d=trainX.map(function(x,i){ var dx=x[0]-xi[0],dy=x[1]-xi[1]; return {d:dx*dx+dy*dy,y:trainY[i]}; });
    d.sort(function(a,b){return a.d-b.d;});
    var s=0; for(var i=0;i<k;i++) s+=d[i].y;
    return s/k;
  }

  // ── 소형 신경망(2→4은닉[tanh]→1출력[sigmoid], 역전파) ──────────────────────────
  function nnTrain(feats,y,hidden,lr,epochs,seed){
    var p=feats[0].length,n=y.length,rng=LCG(seed);
    function rnd(){ return (rng()-0.5)*1.2; }
    var W1=[],b1=new Array(hidden).fill(0);
    for(var h=0;h<hidden;h++){ var row=[]; for(var j=0;j<p;j++) row.push(rnd()); W1.push(row); }
    var W2=[]; for(h=0;h<hidden;h++) W2.push(rnd()); var b2=0;
    for(var ep=0;ep<epochs;ep++){
      var gW1=W1.map(function(r){return r.map(function(){return 0;});}), gb1=new Array(hidden).fill(0);
      var gW2=new Array(hidden).fill(0), gb2=0;
      for(var i=0;i<n;i++){
        var hAct=[]; for(h=0;h<hidden;h++){ var z=b1[h]; for(var j=0;j<p;j++) z+=W1[h][j]*feats[i][j]; hAct.push(Math.tanh(z)); }
        var zo=b2; for(h=0;h<hidden;h++) zo+=W2[h]*hAct[h];
        var out=sigmoid(zo), errO=out-y[i];
        for(h=0;h<hidden;h++) gW2[h]+=errO*hAct[h];
        gb2+=errO;
        for(h=0;h<hidden;h++){
          var dH=errO*W2[h]*(1-hAct[h]*hAct[h]);
          for(j=0;j<p;j++) gW1[h][j]+=dH*feats[i][j];
          gb1[h]+=dH;
        }
      }
      for(h=0;h<hidden;h++){ for(var j2=0;j2<p;j2++) W1[h][j2]-=lr*gW1[h][j2]/n; b1[h]-=lr*gb1[h]/n; W2[h]-=lr*gW2[h]/n; }
      b2-=lr*gb2/n;
    }
    return {W1:W1,b1:b1,W2:W2,b2:b2,hidden:hidden};
  }
  function nnPredict(m,xi){
    var hAct=[]; for(var h=0;h<m.hidden;h++){ var z=m.b1[h]; for(var j=0;j<xi.length;j++) z+=m.W1[h][j]*xi[j]; hAct.push(Math.tanh(z)); }
    var zo=m.b2; for(h=0;h<m.hidden;h++) zo+=m.W2[h]*hAct[h];
    return sigmoid(zo);
  }

  // ── 카파·AUC(22장과 동일 방식) ──────────────────────────
  function accKappa(preds,y){
    var n=preds.length,TP=0,FP=0,TN=0,FN=0;
    preds.forEach(function(pred,i){ var act=y[i];
      if(pred===1&&act===1)TP++; else if(pred===1&&act===0)FP++; else if(pred===0&&act===0)TN++; else FN++; });
    var Po=(TP+TN)/n, predPos=TP+FP,predNeg=TN+FN,actPos=TP+FN,actNeg=TN+FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po,kappa:(Po-Pe)/(1-Pe),TP:TP,FP:FP,TN:TN,FN:FN};
  }
  function rocAUCFromScores(scores,y){
    var seen={},thr=[];
    scores.forEach(function(s){ if(!seen[s]){seen[s]=1;thr.push(s);} });
    thr.sort(function(a,b){return b-a;});
    var mx=Math.max.apply(null,scores), mn=Math.min.apply(null,scores);
    thr.unshift(mx+1); thr.push(mn-1);
    function confAtT(t){ var TP=0,FP=0,TN=0,FN=0; for(var i=0;i<scores.length;i++){ var pred=scores[i]>=t?1:0; if(pred===1&&y[i]===1)TP++; else if(pred===1&&y[i]===0)FP++; else if(pred===0&&y[i]===0)TN++; else FN++; } return {TP:TP,FP:FP,TN:TN,FN:FN}; }
    var pts=thr.map(function(t){ var c=confAtT(t); return {fpr:c.FP/(c.FP+c.TN), tpr:c.TP/(c.TP+c.FN)}; });
    pts.sort(function(a,b){ return (a.fpr-b.fpr)||(a.tpr-b.tpr); });
    var a=0; for(var i=1;i<pts.length;i++) a+=(pts[i].fpr-pts[i-1].fpr)*(pts[i].tpr+pts[i-1].tpr)/2;
    return a;
  }

  // ── 폴드 분할(순열, 고정 시드) ──────────────────────────
  var FOLDS26=5, REPS26=4;
  function foldPerm(seed,n,folds){
    var rng=LCG(seed), keys=[]; for(var i=0;i<n;i++) keys.push({i:i,k:rng()});
    keys.sort(function(a,b){return a.k-b.k;});
    var assign=new Array(n); keys.forEach(function(o,pos){ assign[o.i]=pos%folds; });
    return assign;
  }

  // ── 4개 후보(로지스틱·트리·신경망·kNN)를 4회 반복 5겹 교차검증으로 비교 ──────────────────────────
  var MODEL_KEYS26=['Logit','Tree','NN','kNN'];
  var MODEL_LABEL26={Logit:'로지스틱(선형)',Tree:'결정 트리',NN:'신경망(1은닉층)',kNN:'kNN(k=7)'};
  var MODEL_COL26={Logit:BLU,Tree:GLD,NN:PUR,kNN:GRN};
  var RESULTS26={Logit:[],Tree:[],NN:[],kNN:[]};
  var MISS26={Logit:new Array(N26).fill(0),Tree:new Array(N26).fill(0),NN:new Array(N26).fill(0),kNN:new Array(N26).fill(0)};
  (function(){
    for(var rep=0;rep<REPS26;rep++){
      var pred={Logit:new Array(N26),Tree:new Array(N26),NN:new Array(N26),kNN:new Array(N26)};
      var sc={Logit:new Array(N26),Tree:new Array(N26),NN:new Array(N26),kNN:new Array(N26)};
      var assign=foldPerm(777000+rep*97,N26,FOLDS26);
      for(var f=0;f<FOLDS26;f++){
        var trIdx=[],teIdx=[];
        for(var i=0;i<N26;i++){ if(assign[i]===f) teIdx.push(i); else trIdx.push(i); }
        var trFeats=trIdx.map(function(i){return FEATS26[i];});
        var trY=trIdx.map(function(i){return Y26[i];});
        var lg=logregGD(trFeats,trY,0.5,300,0.02);
        var tree=buildTree(trIdx.map(function(_,k){return k;}),trFeats,trY,0,3,5);
        var nn=nnTrain(trFeats,trY,4,0.6,250,2000+rep*13+f*3);
        teIdx.forEach(function(i){
          var xi=FEATS26[i];
          var pl=logregPredict(lg,xi); sc.Logit[i]=pl; pred.Logit[i]=pl>0.5?1:0;
          var pt=treePredict(tree,xi); sc.Tree[i]=pt; pred.Tree[i]=pt>=0.5?1:0;
          var pn=nnPredict(nn,xi); sc.NN[i]=pn; pred.NN[i]=pn>0.5?1:0;
          var pk=knnProb(trFeats,trY,xi,7); sc.kNN[i]=pk; pred.kNN[i]=pk>=0.5?1:0;
        });
      }
      MODEL_KEYS26.forEach(function(k){
        var ak=accKappa(pred[k],Y26); ak.auc=rocAUCFromScores(sc[k],Y26);
        RESULTS26[k].push(ak);
        for(var i2=0;i2<N26;i2++){ if(pred[k][i2]!==Y26[i2]) MISS26[k][i2]++; }
      });
    }
  })();
  function metricStats(key,field){
    var arr=RESULTS26[key].map(function(r){return r[field];});
    return {mean:mean(arr),min:Math.min.apply(null,arr),max:Math.max.apply(null,arr),std:std(arr),se:std(arr)/Math.sqrt(arr.length),arr:arr};
  }

  // ── 전체데이터 full-fit(해석용) ──────────────────────────
  var LOGIT_FULL26=logregGD(FEATS26,Y26,0.5,400,0.02);
  var TREE_FULL26=buildTree(FEATS26.map(function(_,i){return i;}),FEATS26,Y26,0,3,5);
  var NN_FULL26=nnTrain(FEATS26,Y26,4,0.6,250,9999);
  var NN_IMPORT26=(function(){
    var ib=0,is=0; for(var h=0;h<4;h++){ ib+=Math.abs(NN_FULL26.W1[h][0]); is+=Math.abs(NN_FULL26.W1[h][1]); }
    return {budget:ib,score:is};
  })();
  var BEST_LEAF26=bestLeafPath(TREE_FULL26,[]);

  // ── 오분류 겹침(4회 중 2회 이상 틀리면 「자주 틀림」으로 집계) ──────────────────────────
  var OVERLAP_HIST26=(function(){
    var hist=[0,0,0,0,0];
    for(var i=0;i<N26;i++){
      var cnt=0; MODEL_KEYS26.forEach(function(k){ if(MISS26[k][i]>=2) cnt++; });
      hist[cnt]++;
    }
    return hist;
  })();
  var UNIQUE_MISS26=(function(){
    var uniq={Logit:0,Tree:0,NN:0,kNN:0};
    for(var i=0;i<N26;i++){
      var wrong=MODEL_KEYS26.filter(function(k){return MISS26[k][i]>=2;});
      if(wrong.length===1) uniq[wrong[0]]++;
    }
    return uniq;
  })();

  // ── 1-표준오차 규칙(카파 기준, 단순함 순서: Logit<Tree<NN<kNN) ──────────────────────────
  var SIMPLICITY26=['Logit','Tree','NN','kNN'];
  var ONE_SE26=(function(){
    var best=null;
    MODEL_KEYS26.forEach(function(k){ var m=metricStats(k,'kappa'); if(!best||m.mean>best.mean) best={key:k,mean:m.mean,se:m.se}; });
    var threshold=best.mean-best.se;
    var chosen=best.key;
    for(var i=0;i<SIMPLICITY26.length;i++){
      var k=SIMPLICITY26[i]; if(k===best.key) break;
      var m=metricStats(k,'kappa');
      if(m.mean+m.se>=threshold){ chosen=k; break; }
    }
    return {best:best,threshold:threshold,chosen:chosen};
  })();

  var scenes = [

  // ══════════ 1. 모든 분류 후보를 같은 잣대로 ══════════
  { id:'bda26_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'models = {"Logit":logit, "Tree":tree,', dim:true},
        {t:'          "NN":mlp, "kNN":knn}', dim:true},
        {t:'for name, m in models.items():', dim:true},
        {t:'    cross_val_score(m, X, y, cv=5, scoring="Kappa")', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_all.py', 3);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('4회 반복 5겹 교차검증(폴드 구성을 4번 다르게 바꿔가며 재학습)', W*0.04, ry);
      var shown=MODEL_KEYS26.slice(0,s.step+1);
      shown.forEach(function(k,ki){
        var a=metricStats(k,'acc'), kp=metricStats(k,'kappa'), au=metricStats(k,'auc');
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=MODEL_COL26[k];
        ctx.fillText(MODEL_LABEL26[k]+'  정확도='+a.mean.toFixed(3)+'  κ='+kp.mean.toFixed(3)+'(±'+kp.std.toFixed(3)+')  AUC='+au.mean.toFixed(3), W*0.04, ry+22+ki*20);
      });
      if(s.step===0){
        var kp0=metricStats('Logit','kappa'), a0=metricStats('Logit','acc');
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('정확도 '+a0.mean.toFixed(2)+'인데 카파는 정확히 '+kp0.mean.toFixed(3)+' — 다음 장면에서 이유를 봅니다', W*0.04, ry+22+20+4);
      }

      // 오른쪽: 모델별 3지표 막대(신뢰구간=4회 반복 실측 최소~최대)
      var bx0=W*0.50, bx1=W*0.965, by0=32, bh=190;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('정확도(연)·카파(중)·AUC(진) — 세로선=4회 반복 실측 범위', bx0, by0-10);
      var gw=(bx1-bx0)/4, bw=gw*0.22;
      MODEL_KEYS26.forEach(function(k,ki){
        if(ki>s.step) return;
        var gx=bx0+ki*gw+gw*0.14;
        var fields=['acc','kappa','auc'], alphas=[0.35,0.65,1];
        fields.forEach(function(fld,fi){
          var m=metricStats(k,fld);
          var xk=gx+fi*(bw+6);
          var hM=Math.max(0,m.mean)*bh, hMin=Math.max(0,m.min)*bh, hMax=Math.max(0,m.max)*bh;
          ctx.globalAlpha=alphas[fi]; ctx.fillStyle=MODEL_COL26[k];
          ctx.fillRect(xk, by0+bh-hM, bw, hM); ctx.globalAlpha=1;
          ctx.strokeStyle=TXT; ctx.lineWidth=1.3;
          ctx.beginPath(); ctx.moveTo(xk+bw/2, by0+bh-hMax); ctx.lineTo(xk+bw/2, by0+bh-hMin); ctx.stroke();
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=MODEL_COL26[k]; ctx.textAlign='center';
        ctx.fillText(k, gx+1.5*bw+3, by0+bh+16);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 후보 추가 (로지스틱 → 트리 → 신경망 → kNN)', true);
      E.big('모든 분류 후보를 같은 잣대로', '22~25장에서 하나씩 배운 선형·비선형·트리 계열 분류기 넷을 같은 지원 심사 데이터(예산요청·실적점수, 특별승인 여부) '+N26+'건에 <b>4회 반복 5겹 교차검증</b>으로 나란히 세웁니다. 이번 사례는 「예산은 낮은데 실적이 아주 높다」거나 그 반대인 두 구석에서만 승인되는 <b>비선형(체크보드형)</b> 경계라, 직선 하나로 가르는 로지스틱은 정확도 '+metricStats('Logit','acc').mean.toFixed(2)+'을 내고도 카파는 '+metricStats('Logit','kappa').mean.toFixed(3)+'에 그칩니다. 세로선으로 표시한 4회 반복의 실측 범위 자체가 「리샘플링마다 이만큼은 흔들린다」는 정직한 불확실성입니다 — 한 번의 교차검증 결과만으로 순위를 단정하면 안 되는 이유이기도 합니다.'); }
  },

  // ══════════ 2. 지표에 따라 순위가 바뀐다 ══════════
  { id:'bda26_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'rank_acc = sorted(models, key=acc, reverse=True)', hl:'rank_acc'},
        {t:'rank_kappa = sorted(models, key=kappa, reverse=True)', hl:'rank_kappa'},
        {t:'rank_auc = sorted(models, key=auc, reverse=True)', hl:'rank_auc'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'rank_by_metric.py', s.step);
      var ry=codeBot+20;
      var kpLogit=metricStats('Logit','kappa'), accLogit=metricStats('Logit','acc');
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
      ctx.fillText('로지스틱: 정확도='+accLogit.mean.toFixed(3)+'(4위 아님) 인데 카파='+kpLogit.mean.toFixed(3), W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('예측을 대부분 「반려」로만 채워도 우연히 정확도는 높게 나옵니다', W*0.04, ry+20);
      ctx.fillText('(27장에서 이 함정을 정면으로 다룹니다)', W*0.04, ry+38);

      var colW=W*0.1445, colGap=W*0.0155;
      var cols=[
        {label:'정확도 순위', field:'acc', x0:W*0.50},
        {label:'카파 순위', field:'kappa', x0:W*0.50+colW+colGap},
        {label:'AUC 순위', field:'auc', x0:W*0.50+2*(colW+colGap)}
      ];
      var rowH=30, top=36;
      var ranked={};
      cols.forEach(function(c){ ranked[c.field]=MODEL_KEYS26.slice().sort(function(a,b){return metricStats(b,c.field).mean-metricStats(a,c.field).mean;}); });
      cols.forEach(function(c,ci){
        if(ci>s.step) return;
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(c.label, c.x0, top-8);
        ranked[c.field].forEach(function(k,ri){
          var yy=top+ri*rowH;
          var isSwap = (c.field!=='acc') && (k==='Tree'||k==='NN') && (ranked[c.field].indexOf(k)!==ranked['acc'].indexOf(k));
          ctx.fillStyle=isSwap?'rgba(240,136,138,0.20)':'rgba(255,255,255,0.04)';
          roundRect(ctx,c.x0,yy,colW-6,rowH-6,5); ctx.fill();
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=MODEL_COL26[k]; ctx.textAlign='left';
          ctx.fillText((ri+1)+'. '+k, c.x0+6, yy+17);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=isSwap?RED:DIM; ctx.textAlign='right';
          ctx.fillText(metricStats(k,c.field).mean.toFixed(3), c.x0+colW-10, yy+17);
        });
      });
      if(s.step===2){
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='left';
        ctx.fillText('붉게 표시된 트리·신경망 순서가 정확도 열과 카파·AUC 열에서 실제로 뒤바뀝니다', W*0.50, top+4*rowH+18);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 카파 순위 → AUC 순위 추가', true);
      E.big('지표에 따라 순위가 바뀐다', '정확도만 보면 순위는 하나로 정해질 것 같지만, 실제로 세 지표를 나란히 계산해 보면 그렇지 않습니다. 이번 데이터에서 <b>결정 트리와 신경망은 정확도로는 신경망이 근소하게 앞서지만, 우연 일치를 걷어낸 카파와 순위 능력을 재는 AUC로는 트리가 오히려 앞섭니다</b> — 신경망의 원시 확률 출력이 결정 트리의 잎(리프) 확률보다 0.5 근방에서 더 자주 흔들리기 때문입니다. 그리고 로지스틱은 정확도(='+accLogit.mean.toFixed(3)+')만 보면 중위권처럼 보이지만 카파는 '+kpLogit.mean.toFixed(3)+'로 사실상 최하위입니다. <b>어떤 지표로 순위를 매기느냐 자체가 하나의 선택</b>이라는 22장의 원칙이 여기서 실제 수치로 확인됩니다.'); }
  },

  // ══════════ 3. 해석과 성능의 맞바꿈 ══════════
  { id:'bda26_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var order=['Logit','Tree','NN','kNN'];
      var k=order[s.step];
      var code=[
        {t:'# 모델별 「왜 이렇게 예측했는가」 추출', dim:true},
        k==='Logit' ? {t:'logit.coef_   # 계수 = 방향과 크기', hl:'.coef_'} :
        k==='Tree'  ? {t:'export_text(tree)   # 조건문 경로', hl:'export_text'} :
        k==='NN'    ? {t:'sum(abs(W1), axis=0)   # 가중치 합', hl:'sum(abs'} :
                      {t:'knn.kneighbors(x)   # 매번 이웃 재탐색', hl:'.kneighbors'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'interpret.py', 1);
      var ry=codeBot+22;
      ctx.textAlign='left';
      if(k==='Logit'){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU;
        ctx.fillText('예산요청 계수='+LOGIT_FULL26.w[0].toFixed(3)+'  실적점수 계수='+LOGIT_FULL26.w[1].toFixed(3), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('가장 해석 쉬움 — 그런데 예산 계수가 음수라 「예산이 낮을수록 유리」로', W*0.04, ry+22);
        ctx.fillText('읽히지만, 실제로는 예산이 아주 높은 코너도 승인됩니다(왜곡된 해석)', W*0.04, ry+40);
      } else if(k==='Tree'){
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('가장 확실한 잎(승인확률 '+BEST_LEAF26.p1.toFixed(2)+'):', W*0.04, ry);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText(pathText(BEST_LEAF26.path), W*0.04, ry+20);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=GRN;
        ctx.fillText('조건문 규칙이라 담당자에게 그대로 설명 가능 — 정확도도 준수', W*0.04, ry+42);
      } else if(k==='NN'){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=PUR;
        ctx.fillText('은닉가중치 절대값 합: 예산='+NN_IMPORT26.budget.toFixed(2)+'  실적='+NN_IMPORT26.score.toFixed(2), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('총 파라미터 17개(가중치13+절편4) — 「두 변수를 섞어 쓴다」 정도만', W*0.04, ry+22);
        ctx.fillText('말할 수 있고, 담당자에게 규칙으로 설명하긴 어렵습니다', W*0.04, ry+40);
      } else {
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('전역 규칙 없음 — 새 사례마다 가장 가까운 7건을 다시 찾습니다', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('가장 정확(κ='+metricStats('kNN','kappa').mean.toFixed(3)+')하지만 「왜?」에 대한', W*0.04, ry+22);
        ctx.fillText('답은 「비슷한 과거 사례 7건이 대부분 승인이었다」뿐입니다', W*0.04, ry+40);
      }

      // 오른쪽: 정확도 vs 해석 용이성(정성) 매트릭스 — 4모델 위치 표시(카파=실측, 해석순서=범주)
      var px0=W*0.52, px1=W*0.965, pTop=40, pBot=230;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('해석 쉬움 → 어려움', (px0+px1)/2, pBot+20);
      ctx.save(); ctx.translate(px0-24,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('카파(정확도의 정직한 지표)',0,0); ctx.restore();
      var interpOrder=['Logit','Tree','NN','kNN']; // 해석 쉬움→어려움 순
      interpOrder.forEach(function(kk,ii){
        var kp=metricStats(kk,'kappa').mean;
        var xx=px0+(ii+0.5)/interpOrder.length*(px1-px0);
        var yy=pBot-Math.max(0,kp)*(pBot-pTop);
        var isCur=(kk===k);
        ctx.fillStyle=MODEL_COL26[kk]; ctx.beginPath(); ctx.arc(xx,yy,isCur?7:4.5,0,7); ctx.fill();
        if(isCur){ ctx.strokeStyle=TXT; ctx.lineWidth=1.5; ctx.stroke(); }
        ctx.font='11px sans-serif'; ctx.fillStyle=MODEL_COL26[kk]; ctx.textAlign='center';
        ctx.fillText(kk, xx, pBot+38);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 모델의 실제 해석 근거 보기', true);
      E.big('해석과 성능의 맞바꿈', '가장 정확한 모델(kNN, κ='+metricStats('kNN','kappa').mean.toFixed(3)+')과 가장 설명하기 쉬운 모델(로지스틱)은 서로 다릅니다. 각 모델에서 실제로 뽑아낸 해석 수단을 보면 그 이유가 드러납니다 — 로지스틱의 계수는 간단하지만 이번처럼 비선형 경계에서는 그 계수의 부호조차 실제 관계를 왜곡해서 전달합니다. 결정 트리는 조건문 규칙(정확도도 준수)을 그대로 심사 담당자에게 보여줄 수 있어 균형점에 가깝습니다. kNN과 신경망은 정확도는 높지만 「왜 이 사례가 승인인가」를 한두 문장으로 설명하기 어렵습니다. <b>어느 모델을 최종으로 쓸지는 성능과 설명 요구사항을 함께 놓고 판단해야 하는 문제</b>입니다.'); }
  },

  // ══════════ 4. 모델이 틀리는 곳은 겹치는가 ══════════
  { id:'bda26_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'wrong = {name: (pred[name] != y) for name in models}', hl:'wrong'},
        {t:'overlap = sum(wrong[name][i] for name in models)', hl:'overlap'},
        {t:'# i마다 「몇 개 모델이 틀렸는가」를 센다', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'error_overlap.py', 1);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
      ctx.fillText('네 모델 모두 자주 틀리는 표본 = '+OVERLAP_HIST26[4]+'건 / '+N26+'건', W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('→ 특징 두 개만으로는 설명 안 되는, 데이터 자체의 경계 잡음', W*0.04, ry+20);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
      ctx.fillText('한 모델만 자주 틀리는 표본 = '+(OVERLAP_HIST26[1])+'건', W*0.04, ry+44);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
      var uy=ry+64;
      MODEL_KEYS26.forEach(function(k,ki){
        ctx.fillStyle=MODEL_COL26[k];
        ctx.fillText(k+':'+UNIQUE_MISS26[k]+'건', W*0.04+ki*90, uy);
      });

      var bx0=W*0.52, bx1=W*0.965, by0=40, bh=180;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('몇 개 모델이 이 표본에서 자주 틀렸는가(0~4)', bx0, by0-10);
      var maxH=Math.max.apply(null,OVERLAP_HIST26,1);
      var bw2=(bx1-bx0)/5*0.6, gap2=(bx1-bx0)/5;
      OVERLAP_HIST26.forEach(function(cnt,ci){
        var hh=(cnt/maxH)*bh;
        var xx=bx0+ci*gap2+gap2*0.2;
        ctx.fillStyle=(ci===0)?GRN:(ci===4?RED:GLD);
        ctx.fillRect(xx,by0+bh-hh,bw2,hh);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(cnt), xx+bw2/2, by0+bh-hh-6<by0+14?by0+14:by0+bh-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(String(ci), xx+bw2/2, by0+bh+16);
      });

      E.big('모델이 틀리는 곳은 겹치는가', N26+'건의 지원서 각각에 대해 4개 모델(로지스틱·트리·신경망·kNN)이 4회 반복 교차검증에서 자주 틀린(4회 중 2회 이상) 표본을 실제로 세어 겹쳐 봅니다. <b>네 모델 모두 자주 틀리는 표본이 '+OVERLAP_HIST26[4]+'건</b> 있는데, 이는 예산·실적 두 특징만으로는 설명되지 않는 「데이터 자체의 한계」입니다(경계 코너 부근의 잡음 표본일 가능성이 큽니다) — 아무리 좋은 모델을 골라도 못 맞히는 몫입니다. 반대로 <b>한 모델만 자주 틀리는 표본은 '+OVERLAP_HIST26[1]+'건</b>으로, 이는 그 모델 고유의 약점(로지스틱의 선형성 한계, 신경망의 확률 불안정 등)입니다. 이 구분이 「더 좋은 모델을 찾을 여지가 있는가」와 「이 정도가 데이터의 한계인가」를 가르는 실질적 기준이 됩니다.'); }
  },

  // ══════════ 5. 최종 선택과 근거 문서화 ══════════
  { id:'bda26_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'best = max(models, key=lambda m: kappa[m].mean())', hl:'max('},
        {t:'thresh = kappa[best].mean() - kappa[best].se()', hl:'thresh'},
        {t:'chosen = simplest model with kappa.mean()+se >= thresh', hl:'chosen'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'select_1se.py', 2);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('1-표준오차 문턱 = '+ONE_SE26.best.mean.toFixed(3)+' − '+ONE_SE26.best.se.toFixed(3)+' = '+ONE_SE26.threshold.toFixed(3), W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=MODEL_COL26[ONE_SE26.chosen];
      ctx.fillText('→ 최종 선택: '+MODEL_LABEL26[ONE_SE26.chosen], W*0.04, ry+22);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var reason = (ONE_SE26.chosen==='kNN') ?
        '더 단순한 후보들의 (평균+표준오차) 상한이 문턱에 못 미쳐, 단순화할 근거가 없습니다' :
        '더 정확한 kNN과 통계적으로 구별되지 않으면서 더 단순합니다';
      ctx.fillText(reason, W*0.04, ry+44);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('문서화: 데이터 정의·전처리·CV 설계(5겹×4회)·후보 4종·선택 지표(κ)·', W*0.04, ry+68);
      ctx.fillText('1-SE 규칙·오분류 겹침 분석까지 남겨야 재현·감사가 가능합니다', W*0.04, ry+86);

      var bx0=W*0.52, bx1=W*0.965, by0=32, bh=200;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('모델별 카파 평균 ± 표준오차(SE, 4회 반복 기준)', bx0, by0-10);
      var gw3=(bx1-bx0)/4;
      var yThresh=by0+bh-Math.max(0,ONE_SE26.threshold)*bh*1.7;
      MODEL_KEYS26.forEach(function(k,ki){
        var m=metricStats(k,'kappa');
        var xk=bx0+ki*gw3+gw3*0.32, bw3=gw3*0.36;
        var hM=Math.max(0,m.mean)*bh*1.7, hSe=m.se*bh*1.7;
        ctx.fillStyle=MODEL_COL26[k]; ctx.fillRect(xk,by0+bh-hM,bw3,hM);
        ctx.strokeStyle=TXT; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(xk+bw3/2,by0+bh-hM-hSe); ctx.lineTo(xk+bw3/2,by0+bh-hM+hSe); ctx.stroke();
        if(k===ONE_SE26.chosen){ ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.strokeRect(xk-4,by0+bh-Math.max(hM,20)-8,bw3+8,Math.max(hM,20)+8); }
        ctx.font='11px sans-serif'; ctx.fillStyle=MODEL_COL26[k]; ctx.textAlign='center';
        ctx.fillText(k, xk+bw3/2, by0+bh+16);
      });
      ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(bx0,yThresh); ctx.lineTo(bx1,yThresh); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='right';
      ctx.fillText('1-SE 문턱', bx1, yThresh-6<by0+10?by0+10:yThresh-6);

      E.big('최종 선택과 근거 문서화', '앞선 세 장면(지표 순위·해석 가능성·오분류 겹침)을 종합해 최종 모델을 고릅니다. 15장에서 배운 <b>1-표준오차 규칙</b>을 카파에 적용하면: 가장 카파가 높은 모델의 (평균−표준오차)를 문턱으로 삼고, 그 문턱을 넘는 <b>가장 단순한</b> 후보를 고릅니다. 이번 사례에서는 '+MODEL_LABEL26[ONE_SE26.chosen]+'이 최종 선택됩니다 — '+reason+'. 이 판단 과정 자체(데이터 정의, 4종 후보, 교차검증 설계, 선택 지표와 근거)를 문서로 남겨야, 나중에 누군가 「왜 이 모델을 골랐나」라고 물었을 때 재현 가능한 답을 줄 수 있습니다. 성능 숫자 하나만 보고하는 것과 그 숫자에 이르는 판단 과정을 남기는 것은 실무에서 전혀 다른 무게를 가집니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
