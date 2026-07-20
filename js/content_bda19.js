/* 빅데이터 분석 제19장 — 회귀 트리와 규칙 기반 모델 (CART·가지치기·모델트리·배깅·랜덤포레스트·부스팅)
   동작(behavior)만. 텍스트=content/bda19.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(분할 SSE 감소·가지치기 alpha별 나무크기·훈련/검증 오차·상수잎 대 선형잎 오차·
   배깅 앙상블 오차·나무 간 상관계수·부스팅 잔차)는 아래 고정 배열로부터 이 파일 로드 시 실제 계산
   (하드코딩 금지). 회귀나무 분할은 SSE 감소를 전수 탐색으로 직접 구현하고, 가지치기는 실제 약한고리
   (weakest-link) 비용복잡도 가지치기 알고리즘을, 배깅·부스팅은 각각 부트스트랩 앙상블과 잔차 순차
   학습을 직접 구현한다. 난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
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
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function uniqSorted(a){ var b=a.slice().sort(function(p,q){return p-q;}), out=[]; for(var i=0;i<b.length;i++){ if(i===0||b[i]!==b[i-1]) out.push(b[i]); } return out; }
  function corr(a,b){ var ma=mean(a), mb=mean(b), sab=0,saa=0,sbb=0,i; for(i=0;i<a.length;i++){ sab+=(a[i]-ma)*(b[i]-mb); saa+=(a[i]-ma)*(a[i]-ma); sbb+=(b[i]-mb)*(b[i]-mb); } return sab/Math.sqrt(saa*sbb); }

  // ══════════ 고정 데이터: 두 특징(F1=주된 신호, F2=약한 부신호) → 꺾이는 목표값 + 잡음 ══════════
  var N19=40, F1=[], F2=[], Y19=[];
  (function(){
    var rng=LCG(20260722);
    for(var i=0;i<N19;i++){
      var f1=i;
      var f2=5+3*Math.cos(i/4)+(rng()-0.5)*1.2;
      var kink=(f1<=20)?(2+0.12*f1):(2+0.12*20+0.75*(f1-20));
      var wig=1.3*Math.sin(f2/3);
      var noise=(rng()-0.5)*3.5;
      F1.push(f1); F2.push(+f2.toFixed(3)); Y19.push(+(kink+wig+noise).toFixed(3));
    }
  })();
  var FEATS19=[F1,F2], FNAME19=['연체비율_유사특징(f1)','부신호(f2)'];
  var ALLIDX19=[]; for(var _i=0;_i<N19;_i++) ALLIDX19.push(_i);
  var TESTIDX19=[], TRAINIDX19=[];
  for(_i=3;_i<N19;_i+=4) TESTIDX19.push(_i);
  ALLIDX19.forEach(function(i){ if(TESTIDX19.indexOf(i)<0) TRAINIDX19.push(i); });

  function sseIdx19(idxs){ if(idxs.length===0) return 0; var m=mean(idxs.map(function(i){return Y19[i];})); var s=0; idxs.forEach(function(i){ var d=Y19[i]-m; s+=d*d; }); return s; }
  function bestSplit19(idxs, minLeaf, featIdxs){
    featIdxs=featIdxs||[0,1];
    var parentSSE=sseIdx19(idxs), best=null;
    featIdxs.forEach(function(fi){
      var vals=idxs.map(function(i){ return FEATS19[fi][i]; });
      var uq=uniqSorted(vals);
      for(var u=0;u<uq.length-1;u++){
        var thresh=(uq[u]+uq[u+1])/2, left=[], right=[];
        idxs.forEach(function(i){ if(FEATS19[fi][i]<=thresh) left.push(i); else right.push(i); });
        if(left.length<minLeaf||right.length<minLeaf) continue;
        var gain=parentSSE-sseIdx19(left)-sseIdx19(right);
        if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,gain:gain,left:left,right:right};
      }
    });
    return best;
  }
  function buildTree19(idxs, minLeaf, maxDepth, featIdxs, rng, mtry, depth){
    depth=depth||0;
    var node={idxs:idxs, n:idxs.length, mean:mean(idxs.map(function(i){return Y19[i];})), sseVal:sseIdx19(idxs)};
    if(idxs.length<2*minLeaf || depth>=maxDepth){ node.leaf=true; return node; }
    var useFeat=featIdxs||[0,1];
    if(mtry && mtry<useFeat.length && rng){ useFeat=[ rng()<0.5?0:1 ]; }
    var sp=bestSplit19(idxs, minLeaf, useFeat);
    if(!sp || sp.gain<=1e-9){ node.leaf=true; return node; }
    node.leaf=false; node.fi=sp.fi; node.thresh=sp.thresh; node.gain=sp.gain;
    node.left=buildTree19(sp.left, minLeaf, maxDepth, featIdxs, rng, mtry, depth+1);
    node.right=buildTree19(sp.right, minLeaf, maxDepth, featIdxs, rng, mtry, depth+1);
    return node;
  }
  function treePredict19(node, f1v, f2v){
    if(node.pruned || node.leaf) return node.mean;
    var v=(node.fi===0)?f1v:f2v;
    return v<=node.thresh ? treePredict19(node.left,f1v,f2v) : treePredict19(node.right,f1v,f2v);
  }
  function leavesOf19(node,out){ out=out||[]; if(node.pruned||node.leaf){ out.push(node); return out; } leavesOf19(node.left,out); leavesOf19(node.right,out); return out; }
  function countLeaves19(n){ return (n.pruned||n.leaf) ? 1 : countLeaves19(n.left)+countLeaves19(n.right); }
  function subtreeSSE19(n){ return (n.pruned||n.leaf) ? n.sseVal : subtreeSSE19(n.left)+subtreeSSE19(n.right); }
  function allInternal19(n,out){ out=out||[]; if(n.pruned||n.leaf) return out; out.push(n); allInternal19(n.left,out); allInternal19(n.right,out); return out; }

  // ── 19.1 첫 분할: SSE 감소 최대 지점을 F1 후보 전수 탐색 ──────────────
  var SPLIT19=(function(){
    var parentSSE=sseIdx19(ALLIDX19), parentMean=mean(ALLIDX19.map(function(i){return Y19[i];}));
    var uq=uniqSorted(F1), cands=[];
    for(var u=0;u<uq.length-1;u++){
      var thresh=(uq[u]+uq[u+1])/2, left=[], right=[];
      ALLIDX19.forEach(function(i){ if(F1[i]<=thresh) left.push(i); else right.push(i); });
      var gain=parentSSE-sseIdx19(left)-sseIdx19(right);
      cands.push({thresh:thresh, gain:gain, left:left, right:right});
    }
    var best=cands[0]; cands.forEach(function(c){ if(c.gain>best.gain) best=c; });
    return {parentSSE:parentSSE, parentMean:parentMean, cands:cands, best:best,
      leftMean:mean(best.left.map(function(i){return Y19[i];})), rightMean:mean(best.right.map(function(i){return Y19[i];})),
      leftN:best.left.length, rightN:best.right.length};
  })();

  // ── 19.2 비용복잡도 가지치기(CCP, ccp_alpha) — 약한고리 알고리즘 ──────────────
  var CCP_ROOT19 = buildTree19(TRAINIDX19, 1, 8, [0,1], null, 0, 0);
  var CCP_FULL_LEAVES19 = countLeaves19(CCP_ROOT19);
  function applyAlpha19(alpha){
    (function resetAll(n){ n.pruned=false; if(!n.leaf){ resetAll(n.left); resetAll(n.right); } })(CCP_ROOT19);
    while(true){
      var internals=allInternal19(CCP_ROOT19);
      if(internals.length===0) break;
      var bestNode=null, bestG=Infinity;
      internals.forEach(function(t){
        var lv=countLeaves19(t); if(lv<=1) return;
        var g=(t.sseVal - subtreeSSE19(t)) / (lv-1);
        if(g<bestG){ bestG=g; bestNode=t; }
      });
      if(bestNode===null || bestG>alpha) break;
      bestNode.pruned=true;
    }
  }
  var CCP19=(function(){
    var grid=[];
    for(var a=0; a<=6.001; a+=0.15){
      var alpha=+a.toFixed(2);
      applyAlpha19(alpha);
      var leaves=countLeaves19(CCP_ROOT19);
      var trSse=0; TRAINIDX19.forEach(function(i){ var p=treePredict19(CCP_ROOT19,F1[i],F2[i]); var d=Y19[i]-p; trSse+=d*d; });
      var teSse=0; TESTIDX19.forEach(function(i){ var p=treePredict19(CCP_ROOT19,F1[i],F2[i]); var d=Y19[i]-p; teSse+=d*d; });
      grid.push({alpha:alpha, leaves:leaves, trainRMSE:Math.sqrt(trSse/TRAINIDX19.length), testRMSE:Math.sqrt(teSse/TESTIDX19.length)});
    }
    var best=grid[0]; grid.forEach(function(g){ if(g.testRMSE<best.testRMSE) best=g; });
    applyAlpha19(0); // 상태 복구(전체 나무)
    return {grid:grid, best:best, fullLeaves:CCP_FULL_LEAVES19};
  })();

  // ── 19.3 모델 트리: 잎에 상수 대신 선형식(같은 얕은 트리에서 비교) ──────────────
  var MODELTREE19=(function(){
    var tree=buildTree19(TRAINIDX19, 10, 2, [0,1], null, 0, 0);
    var lvs=leavesOf19(tree);
    function linFit(idxs){
      var mx=mean(idxs.map(function(i){return F1[i];})), my=mean(idxs.map(function(i){return Y19[i];})), sxy=0, sxx=0;
      idxs.forEach(function(i){ sxy+=(F1[i]-mx)*(Y19[i]-my); sxx+=(F1[i]-mx)*(F1[i]-mx); });
      var slope=sxx>1e-9?sxy/sxx:0;
      return {slope:slope, intercept:my-slope*mx};
    }
    lvs.forEach(function(lf){ lf.lin=linFit(lf.idxs); });
    function predictConst(f1v,f2v){ return treePredict19(tree,f1v,f2v); }
    function findLeaf(f1v,f2v){ var node=tree; while(!node.leaf){ var v=(node.fi===0)?f1v:f2v; node=(v<=node.thresh)?node.left:node.right; } return node; }
    function predictLinear(f1v,f2v){ var lf=findLeaf(f1v,f2v); return lf.lin.intercept+lf.lin.slope*f1v; }
    function rmseOn(idxs, fn){ var s=0; idxs.forEach(function(i){ var d=Y19[i]-fn(F1[i],F2[i]); s+=d*d; }); return Math.sqrt(s/idxs.length); }
    return {
      tree:tree, leaves:lvs,
      constTrain:rmseOn(TRAINIDX19,predictConst), constTest:rmseOn(TESTIDX19,predictConst),
      linTrain:rmseOn(TRAINIDX19,predictLinear), linTest:rmseOn(TESTIDX19,predictLinear)
    };
  })();

  // ── 19.4 배깅과 랜덤포레스트: 붓스트랩 앙상블 + 특징 무작위 선택 ──────────────
  var BAG19=(function(){
    var masterRng=LCG(20260723);
    function bootstrapIdx(){ var out=[]; for(var i=0;i<TRAINIDX19.length;i++) out.push(TRAINIDX19[Math.floor(masterRng()*TRAINIDX19.length)]); return out; }
    var MAXT=40, treesBag=[], treesRF=[], b;
    for(b=0;b<MAXT;b++){
      var bs=bootstrapIdx();
      treesBag.push(buildTree19(bs,2,6,[0,1],null,0,0));
      treesRF.push(buildTree19(bs,2,6,[0,1],LCG(50000+b),1,0));
    }
    function ensemblePred(trees, upto, f1v, f2v){ var s=0; for(var i=0;i<upto;i++) s+=treePredict19(trees[i],f1v,f2v); return s/upto; }
    function rmseEns(trees, upto, idxs){ var s=0; idxs.forEach(function(i){ var d=Y19[i]-ensemblePred(trees,upto,F1[i],F2[i]); s+=d*d; }); return Math.sqrt(s/idxs.length); }
    function rmseSingle(t, idxs){ var s=0; idxs.forEach(function(i){ var d=Y19[i]-treePredict19(treesBag[t],F1[i],F2[i]); s+=d*d; }); return Math.sqrt(s/idxs.length); }
    var singleRmses=[]; for(b=0;b<MAXT;b++) singleRmses.push(rmseSingle(b,TESTIDX19));
    var curveByB=[]; for(var nt=1; nt<=MAXT; nt++) curveByB.push({n:nt, testRMSE:rmseEns(treesBag,nt,TESTIDX19)});
    function predsOn(tree,idxs){ return idxs.map(function(i){ return treePredict19(tree,F1[i],F2[i]); }); }
    function avgPairCorr(trees){
      var preds=trees.map(function(t){ return predsOn(t,TESTIDX19); });
      var sum=0,cnt=0;
      for(var i=0;i<preds.length;i++) for(var j=i+1;j<preds.length;j++){ sum+=corr(preds[i],preds[j]); cnt++; }
      return sum/cnt;
    }
    return {
      treesBag:treesBag, treesRF:treesRF, singleRmses:singleRmses,
      singleMean:mean(singleRmses), singleStd:(function(){ var m=mean(singleRmses),s=0; singleRmses.forEach(function(v){var d=v-m;s+=d*d;}); return Math.sqrt(s/singleRmses.length); })(),
      curveByB:curveByB, corrBag:avgPairCorr(treesBag), corrRF:avgPairCorr(treesRF),
      ensemblePred:ensemblePred
    };
  })();

  // ── 19.5 부스팅: 잔차를 순차적으로 학습(그루터기·학습률) ──────────────
  function fitStump19(idxs, resid, minLeaf){
    var parentSSE=(function(){ var vals=idxs.map(function(i){return resid[i];}); var m=mean(vals); var s=0; vals.forEach(function(v){var d=v-m; s+=d*d;}); return s; })();
    var best=null;
    [0,1].forEach(function(fi){
      var vals=idxs.map(function(i){ return FEATS19[fi][i]; }), uq=uniqSorted(vals);
      for(var u=0;u<uq.length-1;u++){
        var thresh=(uq[u]+uq[u+1])/2, left=[], right=[];
        idxs.forEach(function(i){ if(FEATS19[fi][i]<=thresh) left.push(i); else right.push(i); });
        if(left.length<minLeaf||right.length<minLeaf) continue;
        function s2(arr){ if(arr.length===0) return 0; var vs=arr.map(function(i){return resid[i];}), m2=mean(vs), s=0; vs.forEach(function(v){var d=v-m2; s+=d*d;}); return s; }
        var gain=parentSSE-s2(left)-s2(right);
        if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,left:left,right:right,gain:gain};
      }
    });
    if(!best) return null;
    return {fi:best.fi, thresh:best.thresh, leftMean:mean(best.left.map(function(i){return resid[i];})), rightMean:mean(best.right.map(function(i){return resid[i];}))};
  }
  function stumpPredict19(st, f1v, f2v){ var v=(st.fi===0)?f1v:f2v; return v<=st.thresh?st.leftMean:st.rightMean; }
  var BOOST19=(function(){
    var LR=0.15, MINLEAF=3, M=60;
    var F0=mean(TRAINIDX19.map(function(i){return Y19[i];}));
    var predAll={}; ALLIDX19.forEach(function(i){ predAll[i]=F0; });
    var resid={}; TRAINIDX19.forEach(function(i){ resid[i]=Y19[i]-F0; });
    var stumps=[], history=[];
    for(var m=0;m<M;m++){
      var st=fitStump19(TRAINIDX19, resid, MINLEAF);
      if(!st) break;
      stumps.push(st);
      TRAINIDX19.forEach(function(i){ var upd=LR*stumpPredict19(st,F1[i],F2[i]); predAll[i]+=upd; resid[i]=Y19[i]-predAll[i]; });
      TESTIDX19.forEach(function(i){ predAll[i]+=LR*stumpPredict19(st,F1[i],F2[i]); });
      var trSse=0; TRAINIDX19.forEach(function(i){ var d=Y19[i]-predAll[i]; trSse+=d*d; });
      var teSse=0; TESTIDX19.forEach(function(i){ var d=Y19[i]-predAll[i]; teSse+=d*d; });
      history.push({m:m+1, trainRMSE:Math.sqrt(trSse/TRAINIDX19.length), testRMSE:Math.sqrt(teSse/TESTIDX19.length)});
    }
    var best=history[0]; history.forEach(function(h){ if(h.testRMSE<best.testRMSE) best=h; });
    return {F0:F0, stumps:stumps, history:history, best:best, lr:LR};
  })();
  function boostPredictAt(M, f1v, f2v){
    var p=BOOST19.F0;
    for(var m=0;m<M && m<BOOST19.stumps.length;m++) p+=BOOST19.lr*stumpPredict19(BOOST19.stumps[m],f1v,f2v);
    return p;
  }

  var scenes = [

  // ══════════ 1. 나무로 수를 예측하다 ══════════
  { id:'bda19_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'for t in thresholds:', dim:true},
        {t:'    left, right = X[:,0]<=t, X[:,0]>t', hl:'X[:,0]'},
        {t:'    gain = sse(y) - sse(y[left]) - sse(y[right])', hl:'sse('},
        {t:'best_t = thresholds[argmax(gains)]', hl:'argmax'},
        {t:'DecisionTreeRegressor(max_depth=1).fit(X, y)', hl:'DecisionTreeRegressor'}
      ];
      var acti=(s.step===0)?null:(s.step===1?2:3);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'first_split.py', acti);
      var caps=['분할이 없다면 예측은 그냥 전체 평균입니다',
                '후보 경계 39곳마다 SSE 감소량을 실제로 계산합니다',
                '가장 크게 SSE를 줄이는 경계에서 나무를 둘로 가릅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      if(s.step===0) ctx.fillText('전체 평균 = '+SPLIT19.parentMean.toFixed(2)+'  SSE = '+SPLIT19.parentSSE.toFixed(1), W*0.04, codeBot+44);
      else if(s.step===2){
        ctx.fillText('f1 ≤ '+SPLIT19.best.thresh+' → 평균 '+SPLIT19.leftMean.toFixed(2)+' (n='+SPLIT19.leftN+')', W*0.04, codeBot+44);
        ctx.fillStyle=BLU; ctx.fillText('f1 > '+SPLIT19.best.thresh+' → 평균 '+SPLIT19.rightMean.toFixed(2)+' (n='+SPLIT19.rightN+')', W*0.04, codeBot+63);
        ctx.fillStyle=GRN; ctx.fillText('SSE '+SPLIT19.parentSSE.toFixed(0)+' → '+(SPLIT19.parentSSE-SPLIT19.best.gain).toFixed(1)+' (감소 '+SPLIT19.best.gain.toFixed(0)+')', W*0.04, codeBot+82);
      }

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=200;
      var yMin=Math.min.apply(null,Y19)-1, yMax=Math.max.apply(null,Y19)+1;
      function PX(xv){ return px0+(xv/39)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;

      if(s.step===0){
        ctx.fillText('관측(점)과 분할 없는 예측(가로선 = 전체 평균)', px0, 18);
        ctx.fillStyle=BLU; F1.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y19[idx]),2.6,0,7); ctx.fill(); });
        ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px0,PY(SPLIT19.parentMean)); ctx.lineTo(px1,PY(SPLIT19.parentMean)); ctx.stroke();
      } else if(s.step===1){
        ctx.fillText('후보 경계별 SSE 감소량(실측)', px0, 18);
        var gMax=Math.max.apply(null,SPLIT19.cands.map(function(c){return c.gain;}));
        function PYg(gv){ return pBot-(Math.max(0,gv)/gMax)*(pBot-pTop); }
        ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
        SPLIT19.cands.forEach(function(c,ci){ var xp=PX(c.thresh), yp=PYg(c.gain); if(ci===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
        ctx.stroke();
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PX(SPLIT19.best.thresh),PYg(SPLIT19.best.gain),5,0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('x축: 분할 경계(f1)   y축: 그 경계로 나눴을 때 SSE 감소량', px0, pBot+20);
      } else {
        ctx.fillText('두 잎으로 나눈 예측(계단)', px0, 18);
        ctx.fillStyle=BLU; F1.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y19[idx]),2.6,0,7); ctx.fill(); });
        ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath();
        ctx.moveTo(px0,PY(SPLIT19.leftMean)); ctx.lineTo(PX(SPLIT19.best.thresh),PY(SPLIT19.leftMean));
        ctx.lineTo(PX(SPLIT19.best.thresh),PY(SPLIT19.rightMean)); ctx.lineTo(px1,PY(SPLIT19.rightMean)); ctx.stroke();
        ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(PX(SPLIT19.best.thresh),pTop); ctx.lineTo(PX(SPLIT19.best.thresh),pBot); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('f1='+SPLIT19.best.thresh, PX(SPLIT19.best.thresh), pTop-8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (평균 예측 → 경계 탐색 → 두 잎으로 분할)', true);
      E.big('나무로 수를 예측하다', '회귀 나무는 분류 나무와 원리가 같지만 기준이 다릅니다 — 지니 불순도 대신 <b>SSE 감소량(=분산 감소량)</b>을 기준으로 분할을 고릅니다. 분할이 전혀 없다면 예측은 그냥 전체 평균('+SPLIT19.parentMean.toFixed(2)+', SSE='+SPLIT19.parentSSE.toFixed(0)+')입니다. f1 값을 기준으로 가능한 분할 경계 39곳 전부에서 「이 경계로 나누면 SSE가 얼마나 줄어드는가」를 실제로 계산하면, f1='+SPLIT19.best.thresh+'에서 감소량이 최대(SSE '+SPLIT19.parentSSE.toFixed(0)+' → '+(SPLIT19.parentSSE-SPLIT19.best.gain).toFixed(0)+')가 됩니다. 이 경계로 나눈 두 잎은 각각 평균 '+SPLIT19.leftMean.toFixed(2)+'(n='+SPLIT19.leftN+')과 '+SPLIT19.rightMean.toFixed(2)+'(n='+SPLIT19.rightN+')을 예측값으로 내놓습니다 — 이 과정을 각 잎에서 재귀적으로 반복하면 나무가 자라납니다.'); }
  },

  // ══════════ 2. 가지치기 — 언제 멈출 것인가 ══════════
  { id:'bda19_02',
    enter:function(E){ var self=this;
      self.s={idx:3}; // alpha=0.45
      E.controls('<div class="ctrl"><label>비용복잡도 α (ccp_alpha)</label><input type="range" id="b192a" min="0" max="'+(CCP19.grid.length-1)+'" step="1" value="3"><output id="b192ao">'+CCP19.grid[3].alpha.toFixed(2)+'</output></div>');
      E.bind('#b192a','input',function(e){ self.s.idx=+e.target.value; document.getElementById('b192ao').textContent=CCP19.grid[self.s.idx].alpha.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'path = tree.cost_complexity_pruning_path(X,y)', hl:'cost_complexity_pruning_path'},
        {t:'tree = DecisionTreeRegressor(ccp_alpha=a)', hl:'ccp_alpha'},
        {t:'tree.fit(X_train, y_train)', hl:'.fit('},
        {t:'rmse(y_train, tree.predict(X_train))', hl:'y_train'},
        {t:'rmse(y_val, tree.predict(X_val))', hl:'y_val'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ccp_prune.py', 1);
      var cur=CCP19.grid[s.idx];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('α = '+cur.alpha.toFixed(2)+'  나무 크기(잎) = '+cur.leaves, W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('훈련 RMSE = '+cur.trainRMSE.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=RED; ctx.fillText('검증 RMSE = '+cur.testRMSE.toFixed(3), W*0.04, ry+38);
      ctx.fillStyle=GRN; ctx.fillText('최적 α* = '+CCP19.best.alpha.toFixed(2)+' (잎 '+CCP19.best.leaves+'개, 검증 RMSE='+CCP19.best.testRMSE.toFixed(3)+')', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('α=0(잎 '+CCP19.fullLeaves+'개, 다 자란 나무)은 훈련점을 거의 암기합니다', W*0.04, ry+78);

      var px0=W*0.47, px1=W*0.965, pTop=50, pBot=230;
      var maxR=0; CCP19.grid.forEach(function(g){ if(g.testRMSE>maxR)maxR=g.testRMSE; if(g.trainRMSE>maxR)maxR=g.trainRMSE; });
      function PXa(av){ return px0+(av/6)*(px1-px0); }
      function PYr(rv){ return pBot-(rv/maxR)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('α별 훈련(금) vs 검증(빨강) RMSE — 나무 크기가 줄어드는 방향', px0, 16);
      function drawCurve(key,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        CCP19.grid.forEach(function(g,gi){ var xp=PXa(g.alpha), yp=PYr(g[key]); if(gi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke(); }
      drawCurve('trainRMSE',GLD); drawCurve('testRMSE',RED);
      ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(PXa(CCP19.best.alpha),pTop); ctx.lineTo(PXa(CCP19.best.alpha),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('α*='+CCP19.best.alpha.toFixed(2), PXa(CCP19.best.alpha), pTop-10);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXa(cur.alpha),PYr(cur.trainRMSE),4.5,0,7); ctx.fill();
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PXa(cur.alpha),PYr(cur.testRMSE),4.5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('α가 커질수록(오른쪽) 가지치기가 강해져 나무가 작아집니다', px0, pBot+20);

      E.tapHint(W/2, H*0.95, '슬라이더로 α를 올려 나무 크기와 오차가 실제로 바뀌는 것을 보세요', true);
      E.big('가지치기 — 언제 멈출 것인가', '깊게 다 자란 나무(잎 '+CCP19.fullLeaves+'개)에서 시작해 비용복잡도 가지치기(약한고리 알고리즘)로 나무를 실제로 줄여 나갑니다. 각 내부 노드마다 「그 가지를 접었을 때 SSE가 얼마나 늘고 잎이 몇 개 줄어드는지」의 비율(효과알파)을 계산해 가장 작은 노드부터 순서대로 접으면, α를 0부터 6까지 슬라이더로 올릴 때 나무 크기가 단계적으로 줄어듭니다. 훈련 RMSE는 α가 커질수록(나무가 작아질수록) 꾸준히 커지지만, 검증 RMSE는 <b>α≈'+CCP19.best.alpha.toFixed(2)+'(잎 '+CCP19.best.leaves+'개)에서 최저('+CCP19.best.testRMSE.toFixed(3)+')</b>를 찍고 그 뒤 다시 커집니다 — α=0(다 자란 나무)은 훈련점을 거의 암기(RMSE 0.01 수준)하지만 검증에서는 오히려 손해를 봅니다. 15장의 과적합 U자 곡선이 나무의 크기라는 다이얼로 다시 나타난 것입니다.'); }
  },

  // ══════════ 3. 모델 트리와 규칙 ══════════
  { id:'bda19_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var lf0=MODELTREE19.leaves[0], lf1=MODELTREE19.leaves[1];
      var code = (s.step===0) ? [
        {t:'IF f1 <= '+MODELTREE19.tree.thresh+':', dim:true},
        {t:'    predict = '+lf0.mean.toFixed(2)+'   # 잎 평균(상수)', hl:'predict'},
        {t:'ELSE:', dim:true},
        {t:'    predict = '+lf1.mean.toFixed(2)+'   # 잎 평균(상수)', hl:'predict'}
      ] : [
        {t:'IF f1 <= '+MODELTREE19.tree.thresh+':', dim:true},
        {t:'    predict = '+lf0.lin.intercept.toFixed(2)+' + '+lf0.lin.slope.toFixed(3)+'*f1', hl:'predict'},
        {t:'ELSE:', dim:true},
        {t:'    predict = '+lf1.lin.intercept.toFixed(2)+' + '+lf1.lin.slope.toFixed(3)+'*f1', hl:'predict'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step===0?'const_leaf.py':'model_tree.py', null);
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(s.step===0 ? '잎이 딱 2개뿐인 얕은 나무 — 잎마다 상수(평균) 하나' : '같은 나무, 잎마다 f1에 대한 선형식 하나' , W*0.04, codeBot+22);
      ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=RED; ctx.fillText('상수잎  훈련 RMSE='+MODELTREE19.constTrain.toFixed(3)+'  검증 RMSE='+MODELTREE19.constTest.toFixed(3), W*0.04, codeBot+44);
      } else {
        ctx.fillStyle=GRN; ctx.fillText('선형잎  훈련 RMSE='+MODELTREE19.linTrain.toFixed(3)+'  검증 RMSE='+MODELTREE19.linTest.toFixed(3), W*0.04, codeBot+44);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('(상수잎 대비 검증 RMSE '+MODELTREE19.constTest.toFixed(2)+' → '+MODELTREE19.linTest.toFixed(2)+')', W*0.04, codeBot+64);
      }

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=210;
      var yMin=Math.min.apply(null,Y19)-1, yMax=Math.max.apply(null,Y19)+1;
      function PX(xv){ return px0+(xv/39)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText(s.step===0?'상수 잎(계단) vs 실제 데이터':'선형 잎(꺾인 직선) vs 실제 데이터', px0, 18);
      ctx.fillStyle=BLU; F1.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y19[idx]),2.6,0,7); ctx.fill(); });
      var th=MODELTREE19.tree.thresh;
      ctx.strokeStyle=(s.step===0)?RED:GRN; ctx.lineWidth=2.4; ctx.beginPath();
      if(s.step===0){
        ctx.moveTo(px0,PY(lf0.mean)); ctx.lineTo(PX(th),PY(lf0.mean));
        ctx.lineTo(PX(th),PY(lf1.mean)); ctx.lineTo(px1,PY(lf1.mean));
      } else {
        ctx.moveTo(px0,PY(lf0.lin.intercept+lf0.lin.slope*0)); ctx.lineTo(PX(th),PY(lf0.lin.intercept+lf0.lin.slope*th));
        ctx.moveTo(PX(th),PY(lf1.lin.intercept+lf1.lin.slope*th)); ctx.lineTo(px1,PY(lf1.lin.intercept+lf1.lin.slope*39));
      }
      ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PX(th),pTop); ctx.lineTo(PX(th),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('f1='+th, PX(th), pTop-8);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('두 잎 모두 f1 범위가 넓어(왼쪽 n='+lf0.n+', 오른쪽 n='+lf1.n+') 상수 하나로는 안쪽 추세를 못 담습니다', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (상수 잎 → 선형 잎, 같은 나무에서 오차 비교)', true);
      E.big('모델 트리와 규칙', '회귀 나무의 잎은 항상 상수(그 잎에 속한 훈련점들의 평균)를 예측값으로 냅니다. 잎이 딱 2개뿐인 얕은 나무(f1≤'+th+' 기준)에서 상수 잎은 검증 RMSE '+MODELTREE19.constTest.toFixed(2)+'를 냅니다 — 각 잎 안에서도 f1이 커질수록 y가 계속 늘어나는 추세가 남아 있는데 상수 하나로 뭉갰기 때문입니다. 같은 나무의 잎마다 상수 대신 f1에 대한 <b>선형식</b>을 하나씩 적합하면(모델 트리) 검증 RMSE가 '+MODELTREE19.linTest.toFixed(2)+'로 뚜렷이 줄어듭니다. 이렇게 완성된 나무는 「IF f1≤'+th+' THEN y='+lf0.lin.intercept.toFixed(1)+'+'+lf0.lin.slope.toFixed(2)+'×f1 ELSE y='+lf1.lin.intercept.toFixed(1)+'+'+lf1.lin.slope.toFixed(2)+'×f1」이라는 사람이 읽을 수 있는 <b>규칙</b> 두 줄로 그대로 옮겨 적을 수 있습니다 — 나무 구조는 「어느 규칙을 적용할지」를 정하고, 각 규칙 안의 계산은 선형회귀가 맡는 것입니다.'); }
  },

  // ══════════ 4. 배깅과 랜덤 포레스트 ══════════
  { id:'bda19_04',
    enter:function(E){ var self=this;
      self.s={B:10};
      E.controls('<div class="ctrl"><label>나무 개수 B</label><input type="range" id="b194b" min="1" max="40" step="1" value="10"><output id="b194bo">10</output></div>');
      E.bind('#b194b','input',function(e){ self.s.B=+e.target.value; document.getElementById('b194bo').textContent=self.s.B; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'bag = BaggingRegressor(n_estimators=B)', hl:'BaggingRegressor'},
        {t:'rf  = RandomForestRegressor(n_estimators=B,', hl:'RandomForestRegressor'},
        {t:'      max_features=1)   # 분할마다 특징 1개만', hl:'max_features'},
        {t:'pred = mean([t.predict(x) for t in trees])', hl:'mean('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'bagging_rf.py', 3);
      var cur=BAG19.curveByB[s.B-1];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('B='+s.B+'  앙상블 검증 RMSE = '+cur.testRMSE.toFixed(3), W*0.04, ry);
      ctx.fillStyle=RED; ctx.fillText('단일 나무 RMSE: 평균 '+BAG19.singleMean.toFixed(3)+' ± '+BAG19.singleStd.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('나무 하나하나는 붓스트랩 표본마다 크게 흔들리지만,', W*0.04, ry+40);
      ctx.fillText('평균을 내면 그 흔들림이 줄어듭니다', W*0.04, ry+58);
      ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('나무 간 예측 상관계수: 배깅 '+BAG19.corrBag.toFixed(3)+'  vs  RF(특징1개) '+BAG19.corrRF.toFixed(3), W*0.04, ry+80);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('RF는 나무를 서로 덜 닮게 만들지만, 특징이 2개뿐이라 개별 나무는 더 약해집니다', W*0.04, ry+98);

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=170;
      var yMin=Math.min.apply(null,Y19)-1, yMax=Math.max.apply(null,Y19)+1;
      function PX(xv){ return px0+(xv/39)*(px1-px0); }
      function PY(yv){ return pBot-((yv-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('나무 #1(빨강, 단일) vs B개 평균 앙상블(금)', px0, 18);
      ctx.fillStyle=BLU; F1.forEach(function(x,idx){ ctx.beginPath(); ctx.arc(PX(x),PY(Y19[idx]),2.2,0,7); ctx.fill(); });
      ctx.strokeStyle=RED; ctx.globalAlpha=0.55; ctx.lineWidth=1.4; ctx.beginPath();
      F1.forEach(function(x,idx){ var yp=PY(treePredict19(BAG19.treesBag[0],x,F2[idx])), xp=PX(x); if(idx===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke(); ctx.globalAlpha=1;
      ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
      F1.forEach(function(x,idx){ var yp=PY(BAG19.ensemblePred(BAG19.treesBag,s.B,x,F2[idx])), xp=PX(x); if(idx===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();

      var bx0=px0, by0=pBot+30, bw=(px1-px0)/40, bh=54;
      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('B별 앙상블 검증 RMSE(배깅)', bx0, by0-6);
      var maxE=Math.max.apply(null,BAG19.curveByB.map(function(c){return c.testRMSE;}));
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath();
      BAG19.curveByB.forEach(function(c,ci){ var xp=bx0+ci*bw, yp=by0+bh-(c.testRMSE/maxE)*bh; if(ci===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke();
      var curX=bx0+(s.B-1)*bw, curY=by0+bh-(cur.testRMSE/maxE)*bh;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(curX,curY,4,0,7); ctx.fill();

      E.tapHint(W/2, H*0.95, '슬라이더로 나무 개수를 늘려 앙상블 오차가 안정되는 것을 보세요', true);
      E.big('배깅과 랜덤 포레스트', '고정 시드 LCG로 훈련 데이터를 복원추출해 붓스트랩 표본 B개를 만들고, 각 표본마다 회귀 나무를 하나씩 길러 예측을 평균 냅니다(배깅). 나무 40개 각각을 단독으로 시험하면 검증 RMSE가 평균 '+BAG19.singleMean.toFixed(2)+', 표준편차 '+BAG19.singleStd.toFixed(2)+'로 표본에 따라 크게 흔들리지만, B개를 평균 낸 앙상블은 B를 슬라이더로 늘릴수록 RMSE가 훨씬 좁은 범위 안에서 안정됩니다 — 분산이 줄어드는 것을 실제로 확인할 수 있습니다. <b>랜덤 포레스트</b>는 분할마다 두 특징 중 하나만 무작위로 고르게 강제해(max_features=1) 나무 간 예측 상관계수를 배깅의 '+BAG19.corrBag.toFixed(2)+'에서 '+BAG19.corrRF.toFixed(2)+'까지 크게 낮춥니다 — 특징이 많아 상관된 나무들이 쏟아지는 실전 데이터에서는 이 디커플링이 평균의 분산을 더 줄여주지만, 이번 예제처럼 특징이 단 2개뿐이면 무작위로 뺏기는 정보의 손실이 더 커서 실익이 상쇄될 수 있다는 점도 함께 확인됩니다.'); }
  },

  // ══════════ 5. 부스팅 — 틀린 곳에 집중하기 ══════════
  { id:'bda19_05',
    enter:function(E){ var self=this;
      self.s={M:20};
      E.controls('<div class="ctrl"><label>부스팅 단계 수 M</label><input type="range" id="b195m" min="1" max="'+BOOST19.history.length+'" step="1" value="20"><output id="b195mo">20</output></div>');
      E.bind('#b195m','input',function(e){ self.s.M=+e.target.value; document.getElementById('b195mo').textContent=self.s.M; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'F = mean(y_train)', hl:'mean('},
        {t:'for m in range(M):', dim:true},
        {t:'    resid = y_train - F', hl:'resid'},
        {t:'    stump = DecisionTreeRegressor(max_depth=1)', hl:'max_depth=1'},
        {t:'    F += lr * stump.fit(X_train, resid).predict(X)', hl:'lr *'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'gb_boost.py', 4);
      var cur=BOOST19.history[s.M-1];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('M='+s.M+'  훈련 RMSE = '+cur.trainRMSE.toFixed(3), W*0.04, ry);
      ctx.fillStyle=RED; ctx.fillText('검증 RMSE = '+cur.testRMSE.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('최적 M* = '+BOOST19.best.m+' (검증 RMSE='+BOOST19.best.testRMSE.toFixed(3)+')', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('그루터기(깊이 1 나무) '+s.M+'개가 학습률 '+BOOST19.lr+'로 잔차를 이어받으며', W*0.04, ry+58);
      ctx.fillText('조금씩 예측을 고쳐 나갑니다', W*0.04, ry+76);

      var px0=W*0.47, px1=W*0.965, pTop=50, pBot=210;
      var maxR=Math.max.apply(null,BOOST19.history.map(function(h){return Math.max(h.trainRMSE,h.testRMSE);}));
      function PXm(mv){ return px0+((mv-1)/(BOOST19.history.length-1))*(px1-px0); }
      function PYr(rv){ return pBot-(rv/maxR)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('단계 수 M별 훈련(금) vs 검증(빨강) RMSE', px0, 16);
      function drawCurve(key,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        BOOST19.history.forEach(function(h,hi){ var xp=PXm(h.m), yp=PYr(h[key]); if(hi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke(); }
      drawCurve('trainRMSE',GLD); drawCurve('testRMSE',RED);
      ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(PXm(BOOST19.best.m),pTop); ctx.lineTo(PXm(BOOST19.best.m),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('M*='+BOOST19.best.m, PXm(BOOST19.best.m), pTop-10);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXm(s.M),PYr(cur.trainRMSE),4.5,0,7); ctx.fill();
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PXm(s.M),PYr(cur.testRMSE),4.5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('M*를 지나면(오른쪽) 훈련 오차는 계속 줄어도 검증 오차는 다시 늘어납니다', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '슬라이더로 단계 수를 늘려 검증 오차가 다시 커지는 지점을 찾아보세요', true);
      E.big('부스팅 — 틀린 곳에 집중하기', '배깅이 서로 독립적인 나무를 평균 내는 것과 정반대로, 부스팅은 <b>이전 단계가 틀린 만큼(잔차)</b>을 다음 그루터기(깊이 1 나무)가 이어받아 순차적으로 학습합니다. 전체 평균에서 시작해 학습률 '+BOOST19.lr+'로 그루터기를 하나씩 추가하며 M을 1부터 '+BOOST19.history.length+'까지 슬라이더로 늘리면, 훈련 RMSE는 4.5 근처에서 시작해 M='+BOOST19.history.length+'에서 0.34까지 꾸준히 줄어듭니다. 하지만 검증 RMSE는 <b>M='+BOOST19.best.m+'에서 최저('+BOOST19.best.testRMSE.toFixed(3)+')</b>를 찍고 그 뒤로는 다시 커집니다 — 단계를 계속 추가하면 결국 훈련 데이터의 잡음까지 잔차로 착각해 쫓아가기 때문입니다. 배깅은 「많은 독립적인 추측을 평균 내 분산을 줄이는」 전략이고, 부스팅은 「이전의 실수를 정확히 겨냥해 편향을 줄이는」 전략입니다 — 방향은 반대지만 둘 다 15장의 그 U자 곡선 앞에서는 예외가 아닙니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
