/* 빅데이터 분석 제20장 — 회귀 모델 총정리 (16~19장 대표 모델을 한자리에)
   동작(behavior)만. 텍스트=content/bda20.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(교차검증 RMSE·훈련/예측 시간·해석가능 파라미터 수·잔차·1-표준오차 임계값)는
   아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 선형회귀·능형회귀·k-최근접이웃·
   회귀나무·배깅앙상블 다섯 모델을 동일한 6-겹 교차검증으로 직접 구현해 비교한다.
   난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c9a0ff';

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
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function uniqSorted(a){ var b=a.slice().sort(function(p,q){return p-q;}), out=[]; for(var i=0;i<b.length;i++){ if(i===0||b[i]!==b[i-1]) out.push(b[i]); } return out; }
  function matT(A){ var r=A.length,c=A[0].length,T=[]; for(var j=0;j<c;j++){ var row=[]; for(var i=0;i<r;i++) row.push(A[i][j]); T.push(row); } return T; }
  function matMul(A,B){ var r=A.length,k=A[0].length,c=B[0].length,C=[]; for(var i=0;i<r;i++){ var row=[]; for(var j=0;j<c;j++){ var s=0; for(var p=0;p<k;p++) s+=A[i][p]*B[p][j]; row.push(s); } C.push(row); } return C; }
  function matVec(A,v){ return A.map(function(row){ var s=0; for(var i=0;i<row.length;i++) s+=row[i]*v[i]; return s; }); }
  function solveLin(A,b){
    var n=A.length; var M=A.map(function(row,i){ return row.concat([b[i]]); });
    for(var col=0; col<n; col++){
      var piv=col; for(var r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[piv][col])) piv=r;
      var tmp=M[col]; M[col]=M[piv]; M[piv]=tmp;
      var pv=M[col][col]; if(Math.abs(pv)<1e-12) continue;
      for(r=col;r<=n;r++) M[col][r]/=pv;
      for(r=0;r<n;r++){ if(r!==col){ var f=M[r][col]; for(var cc=col;cc<=n;cc++) M[r][cc]-=f*M[col][cc]; } }
    }
    return M.map(function(row){ return row[n]; });
  }

  // ══════════ 고정 데이터: 두 특징(g1=문턱 있는 주신호, g2=약한 주기 부신호) ══════════
  var N20=42, G1=[], G2=[], Y20=[];
  (function(){
    var rng=LCG(20260724);
    for(var i=0;i<N20;i++){
      var g1=i;
      var g2=4.2+2.1*Math.sin(i/5.3)+(rng()-0.5)*1.3;
      var base=(g1<=22)?(3.2+0.16*g1):(3.2+0.16*22+0.58*(g1-22));
      var noise=(rng()-0.5)*2.2;
      var y=base+0.42*g2+noise;
      G1.push(g1); G2.push(+g2.toFixed(3)); Y20.push(+y.toFixed(3));
    }
  })();
  var ALLIDX20=[]; for(var _i=0;_i<N20;_i++) ALLIDX20.push(_i);
  var G2MIN=Math.min.apply(null,G2), G2MAX=Math.max.apply(null,G2), G2MEAN=+mean(G2).toFixed(2);
  var YMIN20=Math.min.apply(null,Y20), YMAX20=Math.max.apply(null,Y20);

  var K20=6;
  var FOLDS20=(function(){
    var arr=[];
    for(var k=0;k<K20;k++){
      var tr=[],te=[];
      ALLIDX20.forEach(function(i){ if(i%K20===k) te.push(i); else tr.push(i); });
      arr.push({k:k,tr:tr,te:te});
    }
    return arr;
  })();

  // ── 모델 1: 선형회귀(OLS) ──────────────────────────────
  function fitOLS20(idxs){
    var X=idxs.map(function(i){ return [1,G1[i],G2[i]]; }), y=idxs.map(function(i){return Y20[i];});
    var Xt=matT(X), XtX=matMul(Xt,X), Xty=matVec(Xt,y);
    return {w:solveLin(XtX,Xty)};
  }
  function predOLS20(m,i){ return m.w[0]+m.w[1]*G1[i]+m.w[2]*G2[i]; }
  function olsPredictVal20(m,g1v,g2v){ return m.w[0]+m.w[1]*g1v+m.w[2]*g2v; }

  // ── 모델 2: 능형회귀(Ridge, OLS와 같은 두 특징을 표준화 후 λ만큼 축소) ──────────────────────────────
  var RIDGE_LAMBDA20=1.0;
  function ridgeFeat20(g1v,g2v){ return [g1v, g2v]; }
  function fitRidge20(idxs,lambda){
    var feats=idxs.map(function(i){ return ridgeFeat20(G1[i],G2[i]); });
    var p=2, means=[],sds=[],c;
    for(c=0;c<p;c++){ var col=feats.map(function(r){return r[c];}); var m=mean(col), s=std(col); if(s<1e-9)s=1; means.push(m); sds.push(s); }
    var Xs=feats.map(function(r){ return r.map(function(v,cc){ return (v-means[cc])/sds[cc]; }); });
    var y=idxs.map(function(i){return Y20[i];}), ym=mean(y), yc=y.map(function(v){return v-ym;});
    var Xt=matT(Xs), XtX=matMul(Xt,Xs);
    for(var d=0; d<p; d++) XtX[d][d]+=lambda;
    var Xty=matVec(Xt,yc);
    return {w:solveLin(XtX,Xty), means:means, sds:sds, ym:ym};
  }
  function predRidgeRaw20(m,g1v,g2v){
    var f=ridgeFeat20(g1v,g2v), s=m.ym;
    for(var c=0;c<2;c++) s+=m.w[c]*((f[c]-m.means[c])/m.sds[c]);
    return s;
  }
  function predRidge20(m,i){ return predRidgeRaw20(m,G1[i],G2[i]); }
  // 표준화된 능형 계수를 원래 척도의 절편+기울기 2개(즉 선형회귀와 같은 형태의 수식 3개 숫자)로 환산
  function ridgeRawCoefs20(m){
    var b1=m.w[0]/m.sds[0], b2=m.w[1]/m.sds[1];
    var b0=m.ym-b1*m.means[0]-b2*m.means[1];
    return [b0,b1,b2];
  }

  // ── 모델 3: k-최근접이웃(k=5, 표준화 거리) ──────────────────────────────
  var KNN_K20=5;
  function fitKNN20(idxs){
    var g1s=idxs.map(function(i){return G1[i];}), g2s=idxs.map(function(i){return G2[i];});
    return {idxs:idxs, m1:mean(g1s), s1:(std(g1s)||1), m2:mean(g2s), s2:(std(g2s)||1)};
  }
  function predKNNRaw20(model,g1v,g2v,k){
    var qz1=(g1v-model.m1)/model.s1, qz2=(g2v-model.m2)/model.s2;
    var arr=model.idxs.map(function(j){
      var z1=(G1[j]-model.m1)/model.s1, z2=(G2[j]-model.m2)/model.s2;
      return {j:j, d:Math.sqrt((z1-qz1)*(z1-qz1)+(z2-qz2)*(z2-qz2))};
    });
    arr.sort(function(a,b){return a.d-b.d;});
    var kk=Math.min(k,arr.length), s=0; for(var t=0;t<kk;t++) s+=Y20[arr[t].j];
    return s/kk;
  }
  function predKNN20(m,i){ return predKNNRaw20(m,G1[i],G2[i],KNN_K20); }

  // ── 모델 4·5: 회귀나무 + 배깅앙상블 ──────────────────────────────
  var FEATS20=[G1,G2];
  function sseIdx20(idxs){ if(!idxs.length) return 0; var m=mean(idxs.map(function(i){return Y20[i];})), s=0; idxs.forEach(function(i){ var d=Y20[i]-m; s+=d*d; }); return s; }
  function bestSplit20(idxs,minLeaf){
    var parentSSE=sseIdx20(idxs), best=null;
    [0,1].forEach(function(fi){
      var vals=idxs.map(function(i){return FEATS20[fi][i];}), uq=uniqSorted(vals);
      for(var u=0;u<uq.length-1;u++){
        var thresh=(uq[u]+uq[u+1])/2, left=[],right=[];
        idxs.forEach(function(i){ if(FEATS20[fi][i]<=thresh) left.push(i); else right.push(i); });
        if(left.length<minLeaf||right.length<minLeaf) continue;
        var gain=parentSSE-sseIdx20(left)-sseIdx20(right);
        if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,gain:gain,left:left,right:right};
      }
    });
    return best;
  }
  function buildTree20(idxs,minLeaf,maxDepth,depth){
    depth=depth||0;
    var node={idxs:idxs, n:idxs.length, mean:mean(idxs.map(function(i){return Y20[i];}))};
    if(idxs.length<2*minLeaf || depth>=maxDepth){ node.leaf=true; return node; }
    var sp=bestSplit20(idxs,minLeaf);
    if(!sp||sp.gain<=1e-9){ node.leaf=true; return node; }
    node.leaf=false; node.fi=sp.fi; node.thresh=sp.thresh; node.gain=sp.gain;
    node.left=buildTree20(sp.left,minLeaf,maxDepth,depth+1);
    node.right=buildTree20(sp.right,minLeaf,maxDepth,depth+1);
    return node;
  }
  function treePredict20(node,i){ if(node.leaf) return node.mean; var v=(node.fi===0)?G1[i]:G2[i]; return v<=node.thresh?treePredict20(node.left,i):treePredict20(node.right,i); }
  function treePredictVal20(node,g1v,g2v){ if(node.leaf) return node.mean; var v=(node.fi===0)?g1v:g2v; return v<=node.thresh?treePredictVal20(node.left,g1v,g2v):treePredictVal20(node.right,g1v,g2v); }
  function countLeaves20(n){ return n.leaf?1:countLeaves20(n.left)+countLeaves20(n.right); }
  var TREE_MINLEAF20=5, TREE_MAXDEPTH20=3, BAG_B20=10;
  function fitTree20(idxs){ return buildTree20(idxs,TREE_MINLEAF20,TREE_MAXDEPTH20,0); }
  function fitBag20(idxs){
    var rng=LCG(20260725), trees=[];
    for(var b=0;b<BAG_B20;b++){
      var bs=[]; for(var t=0;t<idxs.length;t++) bs.push(idxs[Math.floor(rng()*idxs.length)]);
      trees.push(buildTree20(bs,TREE_MINLEAF20,TREE_MAXDEPTH20,0));
    }
    return trees;
  }
  function predBag20(trees,i){ var s=0; for(var t=0;t<trees.length;t++) s+=treePredict20(trees[t],i); return s/trees.length; }
  function baggedPredictVal20(trees,g1v,g2v){ var s=0; for(var t=0;t<trees.length;t++) s+=treePredictVal20(trees[t],g1v,g2v); return s/trees.length; }

  // ══════════ 모델 정의(공통 인터페이스) ══════════
  var MODEL_DEFS20=[
    {key:'ols',   label:'선형회귀',      short:'OLS',   color:BLU, hp:0, fit:fitOLS20,                       pred:predOLS20},
    {key:'ridge', label:'능형회귀',      short:'Ridge', color:PUR, hp:1, fit:function(tr){return fitRidge20(tr,RIDGE_LAMBDA20);}, pred:predRidge20},
    {key:'knn',   label:'k-최근접이웃',  short:'kNN',   color:GLD, hp:1, fit:fitKNN20,                       pred:predKNN20},
    {key:'tree',  label:'회귀나무',      short:'Tree',  color:GRN, hp:2, fit:fitTree20,                      pred:treePredict20},
    {key:'bag',   label:'배깅앙상블',    short:'Bag',   color:RED, hp:3, fit:fitBag20,                       pred:predBag20}
  ];

  // ══════════ 20.1 6-겹 교차검증 실측 ══════════
  var CV20=(function(){
    var res={};
    MODEL_DEFS20.forEach(function(md){
      var foldRMSE=[], oof={};
      FOLDS20.forEach(function(f){
        var model=md.fit(f.tr), sse=0;
        f.te.forEach(function(i){ var p=md.pred(model,i); oof[i]=p; var d=Y20[i]-p; sse+=d*d; });
        foldRMSE.push(Math.sqrt(sse/f.te.length));
      });
      var mn=mean(foldRMSE), sd=sampStd(foldRMSE), se=sd/Math.sqrt(foldRMSE.length);
      res[md.key]={folds:foldRMSE, mean:mn, sd:sd, se:se, min:Math.min.apply(null,foldRMSE), max:Math.max.apply(null,foldRMSE), oof:oof};
    });
    return res;
  })();
  var ORDER20=MODEL_DEFS20.map(function(m){return m.key;});
  var RANK20=ORDER20.slice().sort(function(a,b){ return CV20[a].mean-CV20[b].mean; });

  // ══════════ 20.2 전체 데이터로 학습한 모델(시간·해석가능성·경계 비교용) ══════════
  var FULL20={};
  MODEL_DEFS20.forEach(function(md){ FULL20[md.key]=md.fit(ALLIDX20); });
  var INTERP20={
    ols: FULL20.ols.w.length,
    ridge: ridgeRawCoefs20(FULL20.ridge).length,
    knn: FULL20.knn.idxs.length,
    tree: countLeaves20(FULL20.tree),
    bag: (function(){ var s=0; FULL20.bag.forEach(function(t){s+=countLeaves20(t);}); return s; })()
  };
  var TIMING20=(function(){
    var res={}, REPS=200;
    MODEL_DEFS20.forEach(function(md){
      var t0=performance.now();
      for(var r=0;r<REPS;r++) md.fit(ALLIDX20);
      var t1=performance.now(), fitMs=(t1-t0)/REPS;
      var model=md.fit(ALLIDX20);
      var t2=performance.now();
      for(r=0;r<REPS;r++){ for(var i=0;i<ALLIDX20.length;i++) md.pred(model,ALLIDX20[i]); }
      var t3=performance.now(), predMs=(t3-t2)/REPS;
      res[md.key]={fitMs:fitMs, predMs:predMs};
    });
    return res;
  })();

  // ══════════ 20.4 잔차 공통 오차구간 vs 모델 고유 약점(실측) ══════════
  var RESID20=(function(){
    var thr={}; ORDER20.forEach(function(k){ thr[k]=CV20[k].mean*1.3; });
    var commonIdx=[], specificByKey={}; ORDER20.forEach(function(k){specificByKey[k]=[];});
    ALLIDX20.forEach(function(i){
      var hits=[];
      ORDER20.forEach(function(k){ var r=Math.abs(Y20[i]-CV20[k].oof[i]); if(r>thr[k]) hits.push(k); });
      if(hits.length>=4) commonIdx.push(i);
      if(hits.length===1) specificByKey[hits[0]].push(i);
    });
    return {thr:thr, commonIdx:commonIdx, specificByKey:specificByKey};
  })();

  // ══════════ 20.5 1-표준오차 규칙 실측 ══════════
  var SELECT20=(function(){
    var bestKey=RANK20[0], threshold=CV20[bestKey].mean+CV20[bestKey].se;
    var accept=ORDER20.filter(function(k){ return CV20[k].mean<=threshold; });
    var chosen=accept.slice().sort(function(a,b){ return (INTERP20[a]-INTERP20[b]) || (MODEL_DEFS20.filter(function(m){return m.key===a;})[0].hp - MODEL_DEFS20.filter(function(m){return m.key===b;})[0].hp); })[0];
    return {bestKey:bestKey, threshold:threshold, accept:accept, chosen:chosen};
  })();
  function labelOf(key){ return MODEL_DEFS20.filter(function(m){return m.key===key;})[0].label; }
  function colorOf(key){ return MODEL_DEFS20.filter(function(m){return m.key===key;})[0].color; }
  function shortOf(key){ return MODEL_DEFS20.filter(function(m){return m.key===key;})[0].short; }

  var scenes=[

  // ══════════ 1. 모든 후보를 같은 잣대로 ══════════
  { id:'bda20_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'models = [LinearRegression(), Ridge(alpha='+RIDGE_LAMBDA20+'),', hl:'Ridge'},
        {t:'          KNeighborsRegressor(n_neighbors='+KNN_K20+'),', hl:'KNeighborsRegressor'},
        {t:'          DecisionTreeRegressor(max_depth='+TREE_MAXDEPTH20+'),', hl:'DecisionTreeRegressor'},
        {t:'          BaggingRegressor(n_estimators='+BAG_B20+')]', hl:'BaggingRegressor'},
        {t:'cross_val_score(m, X, y, cv='+K20+', scoring=\'neg_rmse\')', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_cv.py', s.step===0?4:null);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('16~19장에서 각각 배운 모델 다섯을 같은 데이터·같은 6-겹으로 겨룹니다', W*0.04, ry);
      ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=colorOf(RANK20[0]); ctx.fillText('1위 '+labelOf(RANK20[0])+'  CV RMSE='+CV20[RANK20[0]].mean.toFixed(3)+' ± '+CV20[RANK20[0]].se.toFixed(3), W*0.04, ry+22);
      ctx.fillStyle=colorOf(RANK20[RANK20.length-1]); ctx.fillText('꼴찌 '+labelOf(RANK20[RANK20.length-1])+'  CV RMSE='+CV20[RANK20[RANK20.length-1]].mean.toFixed(3), W*0.04, ry+41);
      if(s.step===1){
        var ov=CV20[RANK20[0]].min<=CV20[RANK20[1]].max && CV20[RANK20[0]].max>=CV20[RANK20[1]].min;
        ctx.fillStyle=ov?GLD:GRN; ctx.font='11.5px sans-serif';
        ctx.fillText(ov? '1위·2위('+labelOf(RANK20[1])+') 구간이 겹칩니다 — 우연한 차이일 수 있음':'1위·2위 구간이 겹치지 않습니다 — 실제 차이로 볼 만함', W*0.04, ry+64);
      }

      var px0=W*0.47, px1=W*0.965, top=34, rowH=44, n=ORDER20.length;
      var maxR=0; ORDER20.forEach(function(k){ if(CV20[k].max>maxR) maxR=CV20[k].max; }); maxR*=1.08;
      function PX(v){ return px0+90+(v/maxR)*(px1-px0-100); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('모델별 검증 RMSE 리샘플링 구간(6폴드)', px0, 18);
      ORDER20.forEach(function(k,ki){
        var y=top+ki*rowH+14, c=CV20[k];
        ctx.fillStyle=colorOf(k); ctx.font='600 11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText(shortOf(k), px0, y+4);
        ctx.strokeStyle=colorOf(k); ctx.lineWidth=3; ctx.globalAlpha=0.55;
        ctx.beginPath(); ctx.moveTo(PX(c.min),y); ctx.lineTo(PX(c.max),y); ctx.stroke(); ctx.globalAlpha=1;
        ctx.fillStyle=colorOf(k); ctx.beginPath(); ctx.moveTo(PX(c.mean),y-5); ctx.lineTo(PX(c.mean)+5,y); ctx.lineTo(PX(c.mean),y+5); ctx.lineTo(PX(c.mean)-5,y); ctx.closePath(); ctx.fill();
        if(s.step===1){
          ctx.fillStyle=colorOf(k); ctx.globalAlpha=0.85;
          c.folds.forEach(function(fv,fi){ ctx.beginPath(); ctx.arc(PX(fv), y+((fi%3)-1)*7, 2.2, 0, 7); ctx.fill(); });
          ctx.globalAlpha=1;
        }
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
        ctx.fillText(c.mean.toFixed(2), px1, y+4);
      });
      ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('x축: 검증 RMSE(작을수록 좋음)  ◆=평균  선=최소~최대', px0, top+n*rowH+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (평균 비교 → 폴드별 분포와 겹침까지)', true);
      E.big('모든 후보를 같은 잣대로', '16장에서 배운 선형회귀·능형회귀(벌점)부터 18장의 k-최근접이웃(비선형), 19장의 회귀나무·배깅앙상블(트리 계열)까지 — 지금까지 따로 배운 다섯 대표 모델을 <b>완전히 같은 데이터, 같은 6-겹 교차검증</b>으로 나란히 겨룹니다. 1위는 '+labelOf(RANK20[0])+'(CV RMSE='+CV20[RANK20[0]].mean.toFixed(2)+')이지만, 폴드마다 학습·검증 데이터가 바뀌면 성능이 흔들리므로 <b>평균 하나만으로 승자를 단정하면 안 됩니다</b> — 각 모델의 6개 폴드 RMSE가 만드는 범위(최소~최대)를 함께 보면, 순위 1·2위의 구간이 겹치는지 아닌지에 따라 「진짜 차이」인지 「우연한 차이」인지가 갈립니다.'); }
  },

  // ══════════ 2. 성능만으로 못 고른다 ══════════
  { id:'bda20_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'t0 = time.perf_counter()', hl:'perf_counter'},
        {t:'model.fit(X_train, y_train)', hl:'.fit('},
        {t:'fit_ms = (time.perf_counter()-t0)*1000', hl:'fit_ms'},
        {t:'len(model.get_params())   # 튜닝할 값의 수', hl:'get_params'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cost_axes.py', s.step===1?1:(s.step===2?3:null));
      var titles=['성능(교차검증 RMSE)','속도(훈련·예측 실측 ms)','난이도·해석가능성(파라미터 수)'];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=GLD;
      ctx.fillText('축 '+(s.step+1)+'/3 — '+titles[s.step], W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var notes=[
        'RMSE 순위 1위 = '+labelOf(RANK20[0])+' (근소한 차이)',
        '훈련+예측 시간이 모델마다 100배 넘게 벌어집니다',
        '해석 파라미터: 선형·능형 3개, 나무 잎 개수, kNN 훈련점 전체'
      ];
      ctx.fillText(notes[s.step], W*0.04, ry+20);

      var px0=W*0.47, px1=W*0.965, top=34, rowH=44, n=ORDER20.length;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      var vals={}, unit='', fmt=function(v){return v.toFixed(3);};
      if(s.step===0){ ORDER20.forEach(function(k){ vals[k]=CV20[k].mean; }); unit='RMSE(작을수록 좋음)'; }
      else if(s.step===1){ ORDER20.forEach(function(k){ vals[k]=TIMING20[k].fitMs+TIMING20[k].predMs; }); unit='훈련+예측 ms(실측, 작을수록 빠름)'; }
      else { ORDER20.forEach(function(k){ vals[k]=INTERP20[k]; }); unit='해석에 필요한 파라미터·잎·기억점 수(작을수록 단순)'; fmt=function(v){return v.toFixed(0);}; }
      ctx.fillText(unit, px0, 18);
      var maxV=0; ORDER20.forEach(function(k){ if(vals[k]>maxV) maxV=vals[k]; }); maxV*=1.1; if(maxV<=0)maxV=1;
      function BX(v){ return px0+90+(v/maxV)*(px1-px0-140); }
      ORDER20.forEach(function(k,ki){
        var y=top+ki*rowH+8;
        ctx.fillStyle=colorOf(k); ctx.font='600 11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(shortOf(k), px0, y+13);
        ctx.fillStyle=colorOf(k); ctx.globalAlpha=0.75; ctx.fillRect(px0+90, y, Math.max(2,BX(vals[k])-(px0+90)), 18); ctx.globalAlpha=1;
        ctx.fillStyle=TXT; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText(fmt(vals[k])+(s.step===1?'ms':''), BX(vals[k])+6, y+13);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 축 (성능 → 속도 → 난이도·해석가능성)', true);
      E.big('성능만으로 못 고른다', '다섯 모델의 검증 RMSE는 '+CV20[RANK20[0]].mean.toFixed(2)+'~'+CV20[RANK20[RANK20.length-1]].mean.toFixed(2)+' 사이로 큰 차이가 아닙니다. 그런데 실제로 페이지를 새로고침할 때마다 <b>실측한 훈련 시간</b>을 보면 선형·능형은 '+(TIMING20.ols.fitMs+TIMING20.ols.predMs).toFixed(3)+'ms 안팎으로 즉시 끝나지만, 배깅앙상블은 나무 '+BAG_B20+'개를 매번 새로 길러야 해 더 오래 걸립니다. 해석가능성도 다릅니다 — 선형·능형은 계수 3개짜리 수식 한 줄로 요약되지만, k-최근접이웃은 예측할 때마다 훈련점 '+INTERP20.knn+'개 전부를 들여다봐야 하고, 회귀나무는 잎 '+INTERP20.tree+'개짜리 규칙표, 배깅은 그런 나무 '+BAG_B20+'그루의 평균이라 사람이 읽고 설명하기 어렵습니다. <b>정확도가 비슷하다면 이 세 축(속도·튜닝 난이도·해석가능성)이 실제 선택을 가릅니다.</b>'); }
  },

  // ══════════ 3. 모델이 보는 세상이 다르다 ══════════
  { id:'bda20_03',
    enter:function(E){ var self=this;
      self.s={g2v:G2MEAN};
      E.controls('<div class="ctrl"><label>부신호 g2 값(고정 슬라이스)</label><input type="range" id="b203g2" min="'+G2MIN.toFixed(1)+'" max="'+G2MAX.toFixed(1)+'" step="0.1" value="'+G2MEAN+'"><output id="b203go">'+G2MEAN.toFixed(1)+'</output></div>');
      E.bind('#b203g2','input',function(e){ self.s.g2v=+e.target.value; document.getElementById('b203go').textContent=self.s.g2v.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'y_lin  = model_ols.predict([[g1, g2] for g1 in range(42)])', hl:'model_ols'},
        {t:'y_tree = model_tree.predict([[g1, g2] for g1 in range(42)])', hl:'model_tree'},
        {t:'abs(y_lin - y_tree).mean()   # 구조적 차이', hl:'.mean('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_surface.py', 1);
      var g1grid=[]; for(var gi=0;gi<N20;gi++) g1grid.push(gi);
      var olsC=g1grid.map(function(g1v){ return olsPredictVal20(FULL20.ols,g1v,s.g2v); });
      var treeC=g1grid.map(function(g1v){ return treePredictVal20(FULL20.tree,g1v,s.g2v); });
      var diffs=g1grid.map(function(g1v,gi){ return Math.abs(olsC[gi]-treeC[gi]); });
      var meanDiff=mean(diffs);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('선형모델: 기울기 일정한 직선 하나', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('회귀나무: g1=22에서 꺾이는 계단(문턱 구조)', W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillText('두 예측면의 평균 차이 = '+meanDiff.toFixed(3), W*0.04, ry+42);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('(g2='+s.g2v.toFixed(1)+'로 고정한 슬라이스에서 g1=0..41 42개 지점 실측 평균)', W*0.04, ry+61);

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=210;
      function PX(v){ return px0+(v/(N20-1))*(px1-px0); }
      function PY(v){ return pBot-((v-YMIN20)/(YMAX20-YMIN20))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('실제 데이터(점, g2가 슬라이더값에 가까울수록 진하게) + 두 모델의 예측', px0, 18);
      G1.forEach(function(g1v,idx){
        var near=Math.abs(G2[idx]-s.g2v)<0.8;
        ctx.fillStyle=near?TXT:'rgba(234,223,232,0.22)';
        ctx.beginPath(); ctx.arc(PX(g1v),PY(Y20[idx]),near?3:2,0,7); ctx.fill();
      });
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath();
      g1grid.forEach(function(g1v,gi){ var xp=PX(g1v),yp=PY(olsC[gi]); if(gi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath();
      g1grid.forEach(function(g1v,gi){ var xp=PX(g1v),yp=PY(treeC[gi]); if(gi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PX(22),pTop); ctx.lineTo(PX(22),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('g1=22(문턱)', PX(22), pBot-6);
      ctx.textAlign='left'; ctx.fillText('선형(파랑)은 문턱을 못 담아 왼쪽·오른쪽 어느 쪽에서든 조금씩 어긋납니다', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '슬라이더로 g2를 바꿔 두 모델의 예측선이 벌어지는 정도를 보세요', true);
      E.big('모델이 보는 세상이 다르다', '같은 훈련 데이터로 만든 선형모델과 회귀나무는 완전히 다른 모양의 예측을 냅니다. 선형모델은 g1이 커질수록 <b>기울기가 일정한 직선</b> 하나로 세상을 보고, 회귀나무는 g1=22 언저리에서 <b>기울기가 바뀌는 계단</b>으로 세상을 봅니다. g2 슬라이더를 어디에 두든 두 예측선의 평균 차이는 실측으로 '+meanDiff.toFixed(2)+' 안팎이며, 그 차이는 특히 문턱(g1=22) 근처에서 가장 크게 벌어집니다 — 데이터에 실제로 <b>문턱·꺾임 구조</b>가 있다면 트리 계열이 유리하고, 데이터가 <b>매끈하게 선형</b>이라면 오히려 선형모델이 더 적은 파라미터로 같은 정확도를 냅니다. 「어떤 모델이 항상 좋다」가 아니라 「데이터의 구조에 맞는 모델을 고른다」는 것이 이 비교의 핵심입니다.'); }
  },

  // ══════════ 4. 잔차를 나란히 놓고 보기 ══════════
  { id:'bda20_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var showKeys=['ols','tree','bag'];
      var code=[
        {t:'resid = {m: y_test - oof_pred[m] for m in models}', hl:'oof_pred'},
        {t:'big = {m: abs(resid[m]) > 1.3*cv_rmse[m] for m in models}', hl:'1.3*cv_rmse'},
        {t:'common = [i for i in idx if sum(big[m][i]) >= 4]', hl:'sum(big'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'residuals.py', s.step===2?1:(s.step===1?2:null));
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['다섯 모델의 out-of-fold 잔차(예측-실제)를 index별로 겹쳐 봅니다',
                '공통 오차 구간: 5개 중 4개 이상 모델이 동시에 크게 틀리는 지점 — 데이터 자체의 잡음',
                '모델 고유 약점: 딱 1개 모델만 크게 틀리는 지점 — 그 모델의 구조적 한계'];
      ctx.fillText(caps[s.step], W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===1){ ctx.fillStyle=RED; ctx.fillText('공통 오차 지점 '+RESID20.commonIdx.length+'개 (g1='+RESID20.commonIdx.map(function(i){return G1[i];}).join(',')+')', W*0.04, ry+22); }
      if(s.step===2){
        var wk=ORDER20.filter(function(k){return RESID20.specificByKey[k].length>0;}).sort(function(a,b){return RESID20.specificByKey[b].length-RESID20.specificByKey[a].length;})[0];
        if(wk){ ctx.fillStyle=colorOf(wk); ctx.fillText(labelOf(wk)+' 고유 약점 '+RESID20.specificByKey[wk].length+'개 지점(g1='+RESID20.specificByKey[wk].map(function(i){return G1[i];}).join(',')+')', W*0.04, ry+22); }
      }

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=200, zy=(pTop+pBot)/2;
      var maxAbs=0; showKeys.forEach(function(k){ ALLIDX20.forEach(function(i){ var r=Math.abs(Y20[i]-CV20[k].oof[i]); if(r>maxAbs) maxAbs=r; }); }); maxAbs*=1.15;
      function PX(g1v){ return px0+(g1v/(N20-1))*(px1-px0); }
      function PY(rv){ return zy-(rv/maxAbs)*((pBot-pTop)/2); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,zy); ctx.lineTo(px1,zy); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('세 모델의 out-of-fold 잔차(0선 = 완벽 예측)', px0, 18);
      if(s.step>=1){
        ctx.fillStyle='rgba(240,136,138,0.16)';
        RESID20.commonIdx.forEach(function(i){ ctx.fillRect(PX(G1[i])-6, pTop, 12, pBot-pTop); });
      }
      showKeys.forEach(function(k){
        ctx.fillStyle=colorOf(k); ctx.globalAlpha=0.85;
        ALLIDX20.forEach(function(i){ var r=Y20[i]-CV20[k].oof[i]; ctx.beginPath(); ctx.arc(PX(G1[i]),PY(r),2.6,0,7); ctx.fill(); });
        ctx.globalAlpha=1;
      });
      if(s.step===2){
        var wk2=ORDER20.filter(function(k){return RESID20.specificByKey[k].length>0;}).sort(function(a,b){return RESID20.specificByKey[b].length-RESID20.specificByKey[a].length;})[0];
        if(wk2){
          ctx.strokeStyle=colorOf(wk2); ctx.lineWidth=2;
          RESID20.specificByKey[wk2].forEach(function(i){ var r=Y20[i]-CV20[wk2].oof[i]; ctx.beginPath(); ctx.arc(PX(G1[i]),PY(r),7,0,7); ctx.stroke(); });
        }
      }
      ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(shortOf('ols')+'=파랑  '+shortOf('tree')+'=초록  '+shortOf('bag')+'=빨강   x축: g1(자료 순서)', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (전체 잔차 → 공통 오차구간 → 모델 고유 약점)', true);
      E.big('잔차를 나란히 놓고 보기', '평균 RMSE 하나로는 「어디서」 틀리는지가 보이지 않습니다. 다섯 모델의 out-of-fold 잔차(그 데이터가 검증 폴드였을 때의 예측-실제)를 index별로 겹쳐 보면, <b>공통 오차 구간</b>(5개 모델 중 4개 이상이 동시에 자기 평균 RMSE의 1.3배 넘게 틀리는 지점, 실측 '+RESID20.commonIdx.length+'곳)이 드러납니다 — 이런 지점은 어느 모델을 써도 못 고치는 <b>데이터 자체의 잡음</b>일 가능성이 큽니다. 반대로 <b>모델 고유 약점</b>(딱 1개 모델만 크게 틀리는 지점)은 그 모델의 구조적 한계를 가리킵니다 — 이번 데이터에서는 선형모델이 문턱(g1=22) 근처에서만 유독 크게 틀리는데, 이는 3장에서 본 「모델이 보는 세상이 다르다」의 잔차판 증거입니다.'); }
  },

  // ══════════ 5. 무엇을 고를 것인가 ══════════
  { id:'bda20_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'best = min(models, key=lambda m: cv_mean[m])', hl:'min('},
        {t:'thresh = cv_mean[best] + cv_se[best]', hl:'cv_se'},
        {t:'ok = [m for m in models if cv_mean[m] <= thresh]', hl:'<= thresh'},
        {t:'choice = min(ok, key=lambda m: interp_params[m])', hl:'interp_params'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'one_se_rule.py', Math.min(s.step,3));
      var ry=codeBot+22;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      var blocks=[
        [ {c:colorOf(SELECT20.bestKey), t:'1단계: 최저 평균 = '+labelOf(SELECT20.bestKey)+' ('+CV20[SELECT20.bestKey].mean.toFixed(3)+'±'+CV20[SELECT20.bestKey].se.toFixed(3)+')'} ],
        [ {c:GLD, t:'2단계: 임계값(평균+SE) = '+SELECT20.threshold.toFixed(3)},
          {c:GLD, t:'통과: '+SELECT20.accept.map(labelOf).join(', ')} ],
        [ {c:GRN, t:'3단계: 통과 중 가장 단순 = '+labelOf(SELECT20.chosen)+' (파라미터 '+INTERP20[SELECT20.chosen]+'개)'} ],
        [ {c:ROSE, t:'최종 선택: '+labelOf(SELECT20.chosen)+' — 1위와 동등, 훨씬 단순'} ]
      ];
      var yy=ry;
      for(var bi=0; bi<=s.step; bi++){
        blocks[bi].forEach(function(ln){ ctx.fillStyle=ln.c; ctx.fillText(ln.t, W*0.04, yy); yy+=19; });
      }

      var px0=W*0.47, px1=W*0.965, top=34, rowH=42, n=ORDER20.length;
      var maxR=0; ORDER20.forEach(function(k){ if(CV20[k].mean+CV20[k].se>maxR) maxR=CV20[k].mean+CV20[k].se; }); maxR*=1.1;
      function PX(v){ return px0+90+(v/maxR)*(px1-px0-110); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('모델별 평균 CV RMSE ± 표준오차(SE)', px0, 18);
      if(s.step>=1){
        ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.setLineDash([3,3]); ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(PX(SELECT20.threshold),top-6); ctx.lineTo(PX(SELECT20.threshold),top+n*rowH); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GLD; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('임계값', PX(SELECT20.threshold), top-10);
      }
      ORDER20.forEach(function(k,ki){
        var y=top+ki*rowH+12, c=CV20[k];
        var passed = s.step>=1 ? SELECT20.accept.indexOf(k)>=0 : true;
        var isChosen = s.step>=2 && k===SELECT20.chosen;
        ctx.globalAlpha = passed?1:0.28;
        ctx.fillStyle=colorOf(k); ctx.font=(isChosen?'700 ':'600 ')+'11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText(shortOf(k)+(isChosen?' ★':''), px0, y+4);
        ctx.strokeStyle=colorOf(k); ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(PX(c.mean-c.se),y); ctx.lineTo(PX(c.mean+c.se),y); ctx.stroke();
        ctx.fillStyle=colorOf(k); ctx.beginPath(); ctx.arc(PX(c.mean),y,4,0,7); ctx.fill();
        ctx.globalAlpha=1;
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 단계 (최저평균 → 임계값 → 단순함 → 최종선택)', true);
      E.big('무엇을 고를 것인가', '실전 선택 절차는 네 단계입니다. ①평균 성능이 가장 좋은 모델을 찾고(여기선 '+labelOf(SELECT20.bestKey)+'), ②그 평균에 표준오차 1개를 더한 <b>임계값('+SELECT20.threshold.toFixed(2)+')</b> 안에 드는 모델을 모두 「통계적으로 구분 안 되는 후보」로 인정합니다(1-표준오차 규칙). ③그 후보들 중 가장 단순한(해석가능 파라미터가 적은) 모델을 고르면, ④최종 선택은 <b>'+labelOf(SELECT20.chosen)+'</b>입니다 — 1위와 성능은 사실상 같지만 계수 '+INTERP20[SELECT20.chosen]+'개짜리 수식이라 운영·설명이 훨씬 쉽습니다. 「가장 정확한 모델」이 아니라 「충분히 정확하면서 가장 다루기 쉬운 모델」을 고르는 것 — 이것이 16~19장 전체를 관통하는 실전 결론입니다.'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
