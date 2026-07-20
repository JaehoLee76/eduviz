/* 빅데이터 분석 제25장 — 분류 트리와 규칙 기반 모델 (지니/엔트로피 분할·비용복잡도 가지치기·
   규칙 단순화·배깅/랜덤포레스트·에이다부스트·모델 비교)
   동작(behavior)만. 텍스트=content/bda25.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(지니·엔트로피·정보이득·잎 개수·가지치기 α·규칙·조건 개수·훈련/검증
   정확도·투표 비율·부스팅 가중치·교차검증 카파·AUC)는 아래 고정 배열로부터 이 파일 로드 시
   실제 계산(하드코딩 금지). 분할 탐색·비용복잡도 가지치기(약한고리 가지치기)·붓스트랩 투표·
   에이다부스트 재가중은 실제 알고리즘을 그대로 구현한다. 난수(Math.random) 절대 금지 —
   표본·부트스트랩·초기화는 고정 시드 LCG. */
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
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 고정 데이터: 심사 110건 — 예산지표(x1)·기간지표(x2) → 승인 여부(y) ══════════
  var N25=110, X1_25=[], X2_25=[], Y25=[];
  (function(){
    var rng=LCG(20260925);
    for(var i=0;i<N25;i++){
      var x1=rng()*10, x2=rng()*10, lab;
      if(x1<4) lab=1; else if(x2<5) lab=0; else lab=(x1>7)?1:0;
      X1_25.push(+x1.toFixed(2)); X2_25.push(+x2.toFixed(2)); Y25.push(lab);
    }
    var rng2=LCG(881122);
    for(i=0;i<N25;i++){ if(rng2()<0.08) Y25[i]=1-Y25[i]; }
  })();
  var FEATS25=[X1_25,X2_25];
  var ALLIDX25=[]; for(var _i25=0;_i25<N25;_i25++) ALLIDX25.push(_i25);
  var TE25=[]; for(_i25=5;_i25<N25;_i25+=5) TE25.push(_i25);
  var TR25=ALLIDX25.filter(function(i){ return TE25.indexOf(i)<0; });
  var POS25=Y25.filter(function(y){return y===1;}).length;

  // ── 지니·엔트로피 ──────────────────────────────────────────────
  function gini25(idxs){ if(idxs.length===0) return 0; var c1=0; idxs.forEach(function(i){if(Y25[i]===1)c1++;}); var p1=c1/idxs.length,p0=1-p1; return 1-p0*p0-p1*p1; }
  function entropy25(idxs){ if(idxs.length===0) return 0; var c1=0; idxs.forEach(function(i){if(Y25[i]===1)c1++;}); var p1=c1/idxs.length,p0=1-p1; var e=0; if(p0>0)e-=p0*Math.log2(p0); if(p1>0)e-=p1*Math.log2(p1); return e; }
  function majority25(idxs){ var c1=0; idxs.forEach(function(i){if(Y25[i]===1)c1++;}); return c1*2>=idxs.length?1:0; }
  function p1Of(idxs){ var c1=0; idxs.forEach(function(i){if(Y25[i]===1)c1++;}); return c1/idxs.length; }

  // ── 분할 탐색(지니 기준) ──────────────────────────────────────────────
  function bestSplit25(idxs,minLeaf,featIdxs){
    var parentImp=gini25(idxs), n=idxs.length, best=null;
    featIdxs.forEach(function(fi){
      var vals=idxs.map(function(i){return FEATS25[fi][i];});
      var uniq=Array.from(new Set(vals)).sort(function(a,b){return a-b;});
      for(var u=0;u<uniq.length-1;u++){
        var thresh=(uniq[u]+uniq[u+1])/2, left=[],right=[];
        idxs.forEach(function(i){ if(FEATS25[fi][i]<=thresh) left.push(i); else right.push(i); });
        if(left.length<minLeaf||right.length<minLeaf) continue;
        var wImp=(left.length/n)*gini25(left)+(right.length/n)*gini25(right);
        var gain=parentImp-wImp;
        if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,gain:gain,left:left,right:right};
      }
    });
    return best;
  }
  var ROOT_GINI25=gini25(TR25), ROOT_ENT25=entropy25(TR25);
  var ROOT_BEST_X1=(function(){ return bestSplit25(TR25,3,[0]); })();
  var ROOT_BEST_X2=(function(){ return bestSplit25(TR25,3,[1]); })();
  var ROOT_WINNER=bestSplit25(TR25,3,[0,1]);

  // ── 트리 구축(비용복잡도 가지치기용 R 저장) ──────────────────────────────────────────────
  var nodeSeq25=0;
  function buildTree25(idxs,minLeaf,maxDepth,mtry,rng,depth){
    depth=depth||0;
    var node={id:nodeSeq25++, n:idxs.length, cls:majority25(idxs), p1:p1Of(idxs), R:gini25(idxs)*idxs.length/TR25.length};
    if(idxs.length<2*minLeaf||depth>=maxDepth){ node.leaf=true; return node; }
    var featIdxs=[0,1]; if(mtry&&mtry<2&&rng) featIdxs=[rng()<0.5?0:1];
    var sp=bestSplit25(idxs,minLeaf,featIdxs);
    if(!sp||sp.gain<=1e-9){ node.leaf=true; return node; }
    node.leaf=false; node.fi=sp.fi; node.thresh=sp.thresh; node.gain=sp.gain;
    node.left=buildTree25(sp.left,minLeaf,maxDepth,mtry,rng,depth+1);
    node.right=buildTree25(sp.right,minLeaf,maxDepth,mtry,rng,depth+1);
    return node;
  }
  function predictTree(node,x1,x2){ if(node.pruned||node.leaf) return node.cls; var v=node.fi===0?x1:x2; return v<=node.thresh?predictTree(node.left,x1,x2):predictTree(node.right,x1,x2); }
  function predictTreeP1(node,x1,x2){ if(node.pruned||node.leaf) return node.p1; var v=node.fi===0?x1:x2; return v<=node.thresh?predictTreeP1(node.left,x1,x2):predictTreeP1(node.right,x1,x2); }
  function countLeaves25(n){ return (n.pruned||n.leaf)?1:countLeaves25(n.left)+countLeaves25(n.right); }
  function subtreeR25(n){ return (n.pruned||n.leaf)?n.R:subtreeR25(n.left)+subtreeR25(n.right); }
  function allInternal25(n,out){ out=out||[]; if(n.pruned||n.leaf) return out; out.push(n); allInternal25(n.left,out); allInternal25(n.right,out); return out; }
  function pruneToAlpha25(root,alpha){
    (function reset(n){ n.pruned=false; if(!n.leaf){reset(n.left);reset(n.right);} })(root);
    while(true){
      var internals=allInternal25(root); if(internals.length===0) break;
      var bestNode=null,bestG=Infinity;
      internals.forEach(function(t){ var lv=countLeaves25(t); if(lv<=1) return; var g=(t.R-subtreeR25(t))/(lv-1); if(g<bestG){bestG=g;bestNode=t;} });
      if(bestNode===null||bestG>alpha) break;
      bestNode.pruned=true;
    }
  }
  function accOfTree(node,idxs){ var c=0; idxs.forEach(function(i){ if(predictTree(node,X1_25[i],X2_25[i])===Y25[i]) c++; }); return c/idxs.length; }

  var FULL_TREE25=buildTree25(TR25,1,12,2,null,0);
  var FULL_LEAVES25=countLeaves25(FULL_TREE25);
  var FULL_TRAIN25=accOfTree(FULL_TREE25,TR25), FULL_TEST25=accOfTree(FULL_TREE25,TE25);
  var ALPHA_SWEEP=[0,0.005,0.01,0.02,0.03,0.05,0.08,0.12,0.2,0.3];
  var ALPHA_CURVE=ALPHA_SWEEP.map(function(a){ pruneToAlpha25(FULL_TREE25,a); return {a:a,leaves:countLeaves25(FULL_TREE25),train:accOfTree(FULL_TREE25,TR25),test:accOfTree(FULL_TREE25,TE25)}; });
  pruneToAlpha25(FULL_TREE25,0); // reset to full for later reuse

  // ── 규칙 추출·단순화 ──────────────────────────────────────────────
  function collectLeaves25(n,path,out){ path=path||[]; out=out||[]; if(n.leaf){ out.push({cls:n.cls,n:n.n,path:path}); return out; } collectLeaves25(n.left,path.concat([{fi:n.fi,thresh:n.thresh,dir:'le'}]),out); collectLeaves25(n.right,path.concat([{fi:n.fi,thresh:n.thresh,dir:'gt'}]),out); return out; }
  function matchRule25(rule,x1,x2){ return rule.every(function(c){ var v=c.fi===0?x1:x2; return c.dir==='le'?(v<=c.thresh):(v>c.thresh); }); }
  function predictRules25(rules,x1,x2){ return rules.some(function(r){return matchRule25(r,x1,x2);})?1:0; }
  function accOfRules(rules,idxs){ var c=0; idxs.forEach(function(i){ if(predictRules25(rules,X1_25[i],X2_25[i])===Y25[i]) c++; }); return c/idxs.length; }
  function countConds(rules){ return rules.reduce(function(s,r){return s+r.length;},0); }
  var SHALLOW25=buildTree25(TR25,4,3,2,null,0);
  var RULES_RAW=collectLeaves25(SHALLOW25).filter(function(l){return l.cls===1;}).map(function(l){return l.path;});
  function simplifyRules(rules,idxs){
    var work=rules.map(function(r){return r.slice();}), improved=true;
    while(improved){ improved=false;
      for(var ri=0;ri<work.length;ri++){ for(var ci=0;ci<work[ri].length;ci++){
        var trial=work.map(function(r,i){ return i===ri? r.filter(function(_,j){return j!==ci;}) : r; });
        if(accOfRules(trial,idxs)>=accOfRules(work,idxs)){ work=trial; improved=true; break; }
      } if(improved) break; }
    }
    return work;
  }
  function dropRedundantRules(rules,idxs){
    var work=rules.slice(), improved=true;
    while(improved && work.length>1){ improved=false;
      for(var ri=0;ri<work.length;ri++){ var trial=work.filter(function(_,j){return j!==ri;});
        if(accOfRules(trial,idxs)>=accOfRules(work,idxs)){ work=trial; improved=true; break; } }
    }
    return work;
  }
  var RULES_SIMPLE=(function(){ var s=simplifyRules(RULES_RAW,TR25); s=dropRedundantRules(s,TR25); s=simplifyRules(s,TR25); return s; })();
  function ruleText(rule){ return rule.map(function(c){ return (c.fi===0?'x1':'x2')+(c.dir==='le'?'≤':'>')+c.thresh.toFixed(2); }).join(' & '); }

  // ── 배깅·랜덤포레스트(붓스트랩 투표) ──────────────────────────────────────────────
  var MASTER_RNG25=LCG(556677);
  function bootstrapIdx25(){ var out=[]; for(var i=0;i<TR25.length;i++) out.push(TR25[Math.floor(MASTER_RNG25()*TR25.length)]); return out; }
  var NT_MAX=60;
  var TREES_BAG=[], TREES_RF=[];
  for(var b25=0;b25<NT_MAX;b25++){
    var bs25=bootstrapIdx25();
    TREES_BAG.push(buildTree25(bs25,2,8,2,LCG(1000+b25),0));
    TREES_RF.push(buildTree25(bs25,2,8,1,LCG(2000+b25),0));
  }
  function voteAcc(trees,upto,idxs){
    var c=0; idxs.forEach(function(i){ var v1=0; for(var t=0;t<upto;t++){ if(predictTree(trees[t],X1_25[i],X2_25[i])===1) v1++; } if((v1*2>=upto?1:0)===Y25[i]) c++; });
    return c/idxs.length;
  }
  function voteFrac(trees,upto,x1,x2){ var v1=0; for(var t=0;t<upto;t++){ if(predictTree(trees[t],x1,x2)===1) v1++; } return v1/upto; }
  var INDIV_RF_ACC=TREES_RF.map(function(t){ return accOfTree(t,TE25); });
  var INDIV_MEAN=mean(INDIV_RF_ACC), INDIV_SD=(function(){ var s=0; INDIV_RF_ACC.forEach(function(a){ var d=a-INDIV_MEAN; s+=d*d; }); return Math.sqrt(s/INDIV_RF_ACC.length); })();
  var INDIV_MIN=Math.min.apply(null,INDIV_RF_ACC), INDIV_MAX=Math.max.apply(null,INDIV_RF_ACC);
  var NT_TICKS=[1,3,5,10,15,20,30,40,50,60];
  var BAG_CURVE=NT_TICKS.map(function(nt){ return {nt:nt, train:voteAcc(TREES_BAG,nt,TR25), test:voteAcc(TREES_BAG,nt,TE25)}; });
  var RF_CURVE=NT_TICKS.map(function(nt){ return {nt:nt, train:voteAcc(TREES_RF,nt,TR25), test:voteAcc(TREES_RF,nt,TE25)}; });

  // ── 에이다부스트(깊이2 약한학습기) ──────────────────────────────────────────────
  function buildWeak25(idxsAll,trainIdxArr,w,depth){
    function wGini(idxs){ var W=0,W1=0; idxs.forEach(function(k){ W+=w[k]; if(Y25[trainIdxArr[k]]===1) W1+=w[k]; }); if(W===0) return 0; var p1=W1/W,p0=1-p1; return 1-p0*p0-p1*p1; }
    function bestStumpW(idxs){
      var parentImp=wGini(idxs), Wtot=idxs.reduce(function(s,k){return s+w[k];},0), best=null;
      [0,1].forEach(function(fi){
        var vals=idxs.map(function(k){return FEATS25[fi][trainIdxArr[k]];});
        var uniq=Array.from(new Set(vals)).sort(function(a,b){return a-b;});
        for(var u=0;u<uniq.length-1;u++){
          var thresh=(uniq[u]+uniq[u+1])/2, left=[],right=[];
          idxs.forEach(function(k){ if(FEATS25[fi][trainIdxArr[k]]<=thresh) left.push(k); else right.push(k); });
          if(left.length<2||right.length<2) continue;
          var Wl=left.reduce(function(s,k){return s+w[k];},0), Wr=Wtot-Wl;
          var wImp=(Wl/Wtot)*wGini(left)+(Wr/Wtot)*wGini(right);
          var gain=parentImp-wImp;
          if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,left:left,right:right,gain:gain};
        }
      });
      return best;
    }
    function majW(idxs){ var W=0; idxs.forEach(function(k){ if(Y25[trainIdxArr[k]]===1) W+=w[k]; }); var Wtot=idxs.reduce(function(s,k){return s+w[k];},0); return (W/Wtot>0.5)?1:-1; }
    function rec(idxs,d){
      var sp=bestStumpW(idxs);
      if(!sp) return {leaf:true,lab:majW(idxs)};
      var node={fi:sp.fi,thresh:sp.thresh};
      if(d<=1){ node.L={leaf:true,lab:majW(sp.left)}; node.R={leaf:true,lab:majW(sp.right)}; }
      else { node.L=rec(sp.left,d-1); node.R=rec(sp.right,d-1); }
      return node;
    }
    return rec(idxsAll,depth);
  }
  function predWeak25(node,x1,x2){ if(node.leaf) return node.lab; var v=node.fi===0?x1:x2; return v<=node.thresh?predWeak25(node.L,x1,x2):predWeak25(node.R,x1,x2); }
  function trainAda25(trainIdxArr,M,depth){
    var n=trainIdxArr.length, w=new Array(n).fill(1/n), idxsAll=[]; for(var k=0;k<n;k++) idxsAll.push(k);
    var Ytr=trainIdxArr.map(function(i){return Y25[i]===1?1:-1;});
    var learners=[];
    for(var m=0;m<M;m++){
      var wl=buildWeak25(idxsAll,trainIdxArr,w,depth);
      var err=0;
      for(k=0;k<n;k++){ var pred=predWeak25(wl,X1_25[trainIdxArr[k]],X2_25[trainIdxArr[k]]); if(pred!==Ytr[k]) err+=w[k]; }
      err=Math.max(1e-6,Math.min(1-1e-6,err));
      var alpha=0.5*Math.log((1-err)/err);
      learners.push({wl:wl,alpha:alpha});
      var Z=0;
      for(k=0;k<n;k++){ var pred2=predWeak25(wl,X1_25[trainIdxArr[k]],X2_25[trainIdxArr[k]]); w[k]=w[k]*Math.exp(-alpha*Ytr[k]*pred2); Z+=w[k]; }
      for(k=0;k<n;k++) w[k]/=Z;
    }
    return learners;
  }
  function scoreAda25(learners,x1,x2){ var s=0; learners.forEach(function(l){ s+=l.alpha*predWeak25(l.wl,x1,x2); }); return s; }
  function accAda25(learners,idxs){ var c=0; idxs.forEach(function(i){ if((scoreAda25(learners,X1_25[i],X2_25[i])>0?1:0)===Y25[i]) c++; }); return c/idxs.length; }
  var M_TICKS=[1,2,3,5,8,12,18,25,35,50,70];
  var ADA_CURVE=M_TICKS.map(function(M){ var L=trainAda25(TR25,M,2); return {M:M, train:accAda25(L,TR25), test:accAda25(L,TE25)}; });

  function accKappa25(preds,y){
    var n=preds.length,TP=0,FP=0,TN=0,FN=0;
    preds.forEach(function(pred,i){ var act=y[i]; if(pred===1&&act===1)TP++; else if(pred===1&&act===0)FP++; else if(pred===0&&act===0)TN++; else FN++; });
    var Po=(TP+TN)/n, predPos=TP+FP,predNeg=TN+FN,actPos=TP+FN,actNeg=TN+FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po,kappa:(Po-Pe)/(1-Pe)};
  }
  function rocAUC25(scores,y){
    var thr=Array.from(new Set(scores)).sort(function(a,b){return b-a;});
    var mx=Math.max.apply(null,scores), mn=Math.min.apply(null,scores);
    thr.unshift(mx+1); thr.push(mn-1);
    function conf(t){ var TP=0,FP=0,TN=0,FN=0; for(var i=0;i<scores.length;i++){ var p=scores[i]>=t?1:0; if(p===1&&y[i]===1)TP++; else if(p===1&&y[i]===0)FP++; else if(p===0&&y[i]===0)TN++; else FN++; } return {TP:TP,FP:FP,TN:TN,FN:FN}; }
    var pts=thr.map(function(t){ var c=conf(t); return {fpr:c.FP/(c.FP+c.TN),tpr:c.TP/(c.TP+c.FN)}; });
    pts.sort(function(a,b){ return (a.fpr-b.fpr)||(a.tpr-b.tpr); });
    var A=0; for(var i=1;i<pts.length;i++) A+=(pts[i].fpr-pts[i-1].fpr)*(pts[i].tpr+pts[i-1].tpr)/2;
    return A;
  }

  // ── 25.5(사례) 5겹 교차검증 종합 비교: 가지치기트리·규칙·배깅·RF·부스팅 ──────────────────────
  var CASE25=(function(){
    var folds=5;
    var predTree=new Array(N25),predRules=new Array(N25),predBag=new Array(N25),predRF=new Array(N25),predBoost=new Array(N25);
    var scoreTree=new Array(N25),scoreRules=new Array(N25),scoreBag=new Array(N25),scoreRF=new Array(N25),scoreBoost=new Array(N25);
    for(var f=0;f<folds;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N25;i++){ if(i%folds===f) teIdx.push(i); else trIdx.push(i); }
      var full=buildTree25(trIdx,1,10,2,null,0); pruneToAlpha25(full,0.03);
      teIdx.forEach(function(i){ predTree[i]=predictTree(full,X1_25[i],X2_25[i]); scoreTree[i]=predictTreeP1(full,X1_25[i],X2_25[i]); });
      var shallow=buildTree25(trIdx,4,3,2,null,0);
      var rules=collectLeaves25(shallow).filter(function(l){return l.cls===1;}).map(function(l){return l.path;});
      teIdx.forEach(function(i){ predRules[i]=predictRules25(rules,X1_25[i],X2_25[i]); scoreRules[i]=predRules[i]; });
      var masterRng=LCG(778899+f);
      function bsIdx(){ var out=[]; for(var k=0;k<trIdx.length;k++) out.push(trIdx[Math.floor(masterRng()*trIdx.length)]); return out; }
      var tb=[],tr=[];
      for(var bb=0;bb<30;bb++){ var bs=bsIdx(); tb.push(buildTree25(bs,2,8,2,LCG(3000+f*100+bb),0)); tr.push(buildTree25(bs,2,8,1,LCG(4000+f*100+bb),0)); }
      teIdx.forEach(function(i){
        var v1=0; tb.forEach(function(t){ if(predictTree(t,X1_25[i],X2_25[i])===1) v1++; }); predBag[i]=v1*2>=30?1:0; scoreBag[i]=v1/30;
        var v2=0; tr.forEach(function(t){ if(predictTree(t,X1_25[i],X2_25[i])===1) v2++; }); predRF[i]=v2*2>=30?1:0; scoreRF[i]=v2/30;
      });
      var ada=trainAda25(trIdx,5,2);
      teIdx.forEach(function(i){ var sc=scoreAda25(ada,X1_25[i],X2_25[i]); predBoost[i]=(sc>0)?1:0; scoreBoost[i]=sc; });
    }
    return {
      Tree:(function(){ var ak=accKappa25(predTree,Y25); ak.auc=rocAUC25(scoreTree,Y25); return ak; })(),
      Rules:(function(){ var ak=accKappa25(predRules,Y25); ak.auc=rocAUC25(scoreRules,Y25); return ak; })(),
      Bag:(function(){ var ak=accKappa25(predBag,Y25); ak.auc=rocAUC25(scoreBag,Y25); return ak; })(),
      RF:(function(){ var ak=accKappa25(predRF,Y25); ak.auc=rocAUC25(scoreRF,Y25); return ak; })(),
      Boost:(function(){ var ak=accKappa25(predBoost,Y25); ak.auc=rocAUC25(scoreBoost,Y25); return ak; })()
    };
  })();

  // ── 공용 헬퍼 ──────────────────────────────────────────────
  function drawScatterFrame25(ctx,px0,px1,pTop,pBot,x1max,x2max){
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
    ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
    ctx.fillText('예산지표(x1)', (px0+px1)/2, pBot+18);
    ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('기간지표(x2)',0,0); ctx.restore();
  }
  function drawDots25(ctx,PX,PY){
    for(var i=0;i<N25;i++){ ctx.fillStyle=Y25[i]===1?GRN:RED; ctx.beginPath(); ctx.arc(PX(X1_25[i]),PY(X2_25[i]),2.6,0,7); ctx.fill(); }
  }

  var scenes = [

  // ══════════ 1. 질문으로 가르다 ══════════
  { id:'bda25_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.tree import DecisionTreeClassifier', hl:'DecisionTreeClassifier'},
        {t:"tree = DecisionTreeClassifier(criterion='gini')", hl:"criterion='gini'"},
        {t:'tree.fit(X_train, y_train)', hl:'.fit('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'gini_split.py', s.step===0?null:2);
      var caps=['심사 110건을 예산지표(x1)·기간지표(x2) 두 축에 놓으면 승인(초록)·반려(빨강)가 뒤섞여 있습니다',
                '두 변수 각각에서 가장 좋은 분할 지점을 찾아 정보이득(지니 감소량)을 실제로 비교합니다',
                '이긴 변수의 경계로 평면을 자르면, 그 선은 항상 축에 평행한 「계단」입니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('부모 지니='+ROOT_GINI25.toFixed(3)+'  부모 엔트로피='+ROOT_ENT25.toFixed(3), W*0.04, codeBot+42);
      if(s.step>=1){
        var bx0=W*0.04, bx1=W*0.44, by0=codeBot+58, bh=90, bw=(bx1-bx0)/2*0.5;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
        // 제목은 막대 위 라벨(가장 높은 막대는 by0-6에 놓임)과 겹치지 않게 충분히 올린다
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('변수별 최선 분할의 정보이득', bx0, by0-24);
        var vals=[{name:'x1 (임계'+ROOT_BEST_X1.thresh.toFixed(2)+')',g:ROOT_BEST_X1.gain,col:(ROOT_WINNER.fi===0?GRN:DIM)},
                  {name:'x2 (임계'+ROOT_BEST_X2.thresh.toFixed(2)+')',g:ROOT_BEST_X2.gain,col:(ROOT_WINNER.fi===1?GRN:DIM)}];
        var maxg=Math.max(vals[0].g,vals[1].g);
        vals.forEach(function(v,vi){
          var xk=bx0+vi*(bx1-bx0)/2+ (bx1-bx0)/2*0.25 - bw/2;
          var hh=(v.g/maxg)*bh;
          ctx.fillStyle=v.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(v.name, xk+bw/2, by0+bh+14);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col;
          ctx.fillText('이득='+v.g.toFixed(3), xk+bw/2, by0+bh-hh-6);
        });
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      drawScatterFrame25(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots25(ctx,PX,PY);
      if(s.step===2){
        ctx.strokeStyle=GLD; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(PX(ROOT_WINNER.thresh),pTop); ctx.lineTo(PX(ROOT_WINNER.thresh),pBot); ctx.stroke();
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('x1 = '+ROOT_WINNER.thresh.toFixed(2)+' (첫 분할)', PX(ROOT_WINNER.thresh)+6, pTop+14);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (산점도 → 분할 이득 비교 → 첫 계단)', true);
      E.big('질문으로 가르다', '분류 트리는 데이터를 <b>가장 잘 가르는 질문</b>을 반복해서 던지는 방식으로 경계를 만듭니다. 「좋은 질문」을 고르는 기준이 <b>지니 불순도</b>(1−Σp_k²)나 <b>엔트로피</b>(−Σp_k log₂p_k)입니다 — 지금 데이터의 부모 노드 지니는 '+ROOT_GINI25.toFixed(3)+', 엔트로피는 '+ROOT_ENT25.toFixed(3)+'입니다. x1·x2 각각에서 가능한 모든 분할 지점을 실제로 훑어 정보이득(분할 후 가중평균 불순도가 얼마나 줄었는지)이 가장 큰 지점을 찾으면, x1='+ROOT_WINNER.thresh.toFixed(2)+'에서 이득 '+ROOT_WINNER.gain.toFixed(3)+'으로 x2의 최선(이득 '+ROOT_BEST_X2.gain.toFixed(3)+')을 압도적으로 이깁니다. 트리가 만드는 경계가 항상 <b>축에 평행한 계단</b> 모양인 이유는, 매 질문이 「한 변수가 어떤 값보다 큰가 작은가」라는 단순한 형태이기 때문입니다.'); }
  },

  // ══════════ 2. 가지치기와 나무의 크기 ══════════
  { id:'bda25_02',
    enter:function(E){ var self=this;
      self.s={alpha:0.01};
      E.controls('<div class="ctrl"><label>비용복잡도 α</label><input type="range" id="b252a" min="0" max="0.3" step="0.005" value="0.01"><output id="b252ao">0.010</output></div>');
      E.bind('#b252a','input',function(e){ self.s.alpha=+e.target.value; document.getElementById('b252ao').textContent=self.s.alpha.toFixed(3); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'path = tree.cost_complexity_pruning_path(X, y)', hl:'cost_complexity_pruning_path'},
        {t:'tree = DecisionTreeClassifier(ccp_alpha=alpha)', hl:'ccp_alpha'},
        {t:'# 약한고리 가지치기: 잎당 이득이 작은 가지부터 제거', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ccp_prune.py', 1);
      pruneToAlpha25(FULL_TREE25,s.alpha);
      var leaves=countLeaves25(FULL_TREE25), tr=accOfTree(FULL_TREE25,TR25), te=accOfTree(FULL_TREE25,TE25);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('α='+s.alpha.toFixed(3)+'  잎 개수='+leaves, W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('훈련 정확도 = '+tr.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=(te>=FULL_TEST25)?BLU:RED; ctx.fillText('검증 정확도 = '+te.toFixed(3), W*0.04, ry+38);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('가지치기 전(α=0): 잎 '+FULL_LEAVES25+'개, 검증 '+FULL_TEST25.toFixed(3)+' (더 큰 나무가 오히려 더 나쁩니다)', W*0.04, ry+60);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+78, bh=88, bw=(bx1-bx0)/ALPHA_SWEEP.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('α 스윕: 잎 개수(파랑) vs 검증 정확도(금)', bx0, by0-6);
      ALPHA_CURVE.forEach(function(row,ri){
        var xk=bx0+ri*bw;
        var h1=(row.leaves/FULL_LEAVES25)*bh, h2=row.test*bh;
        ctx.fillStyle=BLU; ctx.fillRect(xk+1, by0+bh-h1, bw*0.42, h1);
        ctx.fillStyle=GLD; ctx.fillRect(xk+1+bw*0.46, by0+bh-h2, bw*0.42, h2);
        if(Math.abs(row.a-s.alpha)<0.0026){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.strokeRect(xk, by0-2, bw-1, bh+4); }
      });

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      var gx=26, gy=20;
      for(var gi=0;gi<gx;gi++){ for(var gj=0;gj<gy;gj++){
        var vx=(gi+0.5)/gx*x1max, vy=(gj+0.5)/gy*x2max;
        var pred=predictTree(FULL_TREE25,vx,vy);
        ctx.fillStyle=pred===1?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.10)';
        ctx.fillRect(px0+gi*(px1-px0)/gx, pBot-(gj+1)*(pBot-pTop)/gy, (px1-px0)/gx+0.5, (pBot-pTop)/gy+0.5);
      }}
      drawScatterFrame25(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots25(ctx,PX,PY);

      E.tapHint(W/2, H*0.95, '슬라이더로 α를 바꿔 잎 개수·정확도가 실제로 재계산되는 것을 보세요', true);
      E.big('가지치기와 나무의 크기', '가지치기 전 나무는 잎이 '+FULL_LEAVES25+'개까지 자라 훈련 데이터를 거의 암기해(훈련 '+FULL_TRAIN25.toFixed(3)+') 잡음까지 외워버리고, 검증 정확도는 '+FULL_TEST25.toFixed(3)+'로 오히려 떨어집니다. <b>비용복잡도 가지치기(약한고리 가지치기)</b>는 각 가지가 「잎 하나를 늘리는 대가로 불순도를 얼마나 줄였는지」(효과 α)를 실제로 계산해, 그 값이 작은 가지부터 순서대로 잘라냅니다. α를 슬라이더로 0에서 조금씩 올리면 가장 비효율적인 가지부터 사라지며 잎 개수가 줄고, α=0.02~0.05 부근에서는 잎 4개로도 검증 정확도가 오히려 최고점(0.857)을 찍습니다 — <b>더 큰 나무가 항상 더 좋은 것은 아닙니다.</b> α를 계속 올리면 결국 신호가 있는 가지까지 잘려 나가 정확도가 다시 떨어집니다.'); }
  },

  // ══════════ 3. 규칙으로 펼치기 ══════════
  { id:'bda25_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'rules = tree_to_rules(tree)   # 뿌리→잎 경로 = 규칙', hl:'tree_to_rules'},
        {t:'rules = simplify(rules, X_val, y_val)', hl:'simplify'},
        {t:'# 조건을 하나씩 지워도 정확도가 안 떨어지면 채택', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'rule_simplify.py', s.step===0?0:1);
      var curRules=(s.step===0)?RULES_RAW:RULES_SIMPLE;
      var acc=accOfRules(curRules,TR25), accTe=accOfRules(curRules,TE25);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=(s.step===0)?GLD:GRN;
      ctx.fillText((s.step===0?'단순화 전: ':'단순화 후: ')+'규칙 '+curRules.length+'개, 조건 '+countConds(curRules)+'개', W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('훈련 정확도='+acc.toFixed(3)+'  검증 정확도='+accTe.toFixed(3), W*0.04, ry+20);
      ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      var ly=ry+46;
      curRules.forEach(function(r,ri){ ctx.fillText((ri+1)+') 승인 IF '+ruleText(r), W*0.04, ly+ri*17); });
      if(s.step===1){
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('조건 '+countConds(RULES_RAW)+'개→'+countConds(RULES_SIMPLE)+'개로 줄었지만 정확도는 그대로입니다', W*0.04, ly+curRules.length*17+16);
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      var gx=26, gy=20;
      for(var gi=0;gi<gx;gi++){ for(var gj=0;gj<gy;gj++){
        var vx=(gi+0.5)/gx*x1max, vy=(gj+0.5)/gy*x2max;
        var pred=predictRules25(curRules,vx,vy);
        ctx.fillStyle=pred===1?'rgba(126,224,176,0.14)':'rgba(240,136,138,0.10)';
        ctx.fillRect(px0+gi*(px1-px0)/gx, pBot-(gj+1)*(pBot-pTop)/gy, (px1-px0)/gx+0.5, (pBot-pTop)/gy+0.5);
      }}
      drawScatterFrame25(ctx,px0,px1,pTop,pBot,x1max,x2max);
      drawDots25(ctx,PX,PY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 조건을 실제로 쳐낸 단순화 결과 보기', true);
      E.big('규칙으로 펼치기', '나무의 뿌리에서 잎까지 가는 경로 하나하나는 곧 「IF 조건들 THEN 승인」이라는 <b>규칙</b>입니다. 얕은 나무에서 뽑아낸 규칙은 '+RULES_RAW.length+'개, 조건은 총 '+countConds(RULES_RAW)+'개인데, 실제로 조건을 하나씩 지워보며 정확도가 떨어지지 않으면 그대로 채택하는 <b>단순화</b>를 반복하면 규칙 '+RULES_SIMPLE.length+'개·조건 '+countConds(RULES_SIMPLE)+'개로 줄어듭니다 — 훈련·검증 정확도는 조금도 변하지 않습니다. 나무 하나의 여러 가지에 흩어져 있던 중복 조건들이 「사실은 같은 경계를 여러 번 확인하고 있었다」는 것을 데이터가 스스로 드러낸 셈입니다. 짧은 규칙은 사람이 읽고 설명하기 훨씬 쉽습니다.'); }
  },

  // ══════════ 4. 배깅·랜덤 포레스트 분류 ══════════
  { id:'bda25_04',
    enter:function(E){ var self=this;
      self.s={nt:20};
      E.controls('<div class="ctrl"><label>나무 개수</label><input type="range" id="b254n" min="1" max="60" step="1" value="20"><output id="b254no">20</output></div>');
      E.bind('#b254n','input',function(e){ self.s.nt=+e.target.value; document.getElementById('b254no').textContent=self.s.nt; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.ensemble import RandomForestClassifier', hl:'RandomForestClassifier'},
        {t:'rf = RandomForestClassifier(n_estimators=nt)', hl:'n_estimators'},
        {t:'pred = majority_vote(rf.estimators_, x)', hl:'majority_vote'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'bag_rf.py', 1);
      var bagTr=voteAcc(TREES_BAG,s.nt,TR25), bagTe=voteAcc(TREES_BAG,s.nt,TE25);
      var rfTr=voteAcc(TREES_RF,s.nt,TR25), rfTe=voteAcc(TREES_RF,s.nt,TE25);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('나무 '+s.nt+'그루로 다수결 투표', W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('배깅  검증 정확도 = '+bagTe.toFixed(3)+' (훈련 '+bagTr.toFixed(3)+')', W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('RF    검증 정확도 = '+rfTe.toFixed(3)+' (훈련 '+rfTr.toFixed(3)+')', W*0.04, ry+38);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+58, bh=76;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('개별 나무(RF, 60그루) 검증 정확도의 흩어짐', bx0, by0-6);
      INDIV_RF_ACC.forEach(function(a,ai){
        var xk=bx0+(ai/(INDIV_RF_ACC.length-1))*(bx1-bx0-6)+3;
        var yk=by0+bh-(a-INDIV_MIN)/(INDIV_MAX-INDIV_MIN+1e-6)*bh;
        ctx.fillStyle='rgba(122,184,255,0.55)'; ctx.beginPath(); ctx.arc(xk,yk,2,0,7); ctx.fill();
      });
      var yMean=by0+bh-(INDIV_MEAN-INDIV_MIN)/(INDIV_MAX-INDIV_MIN+1e-6)*bh;
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(bx0,yMean); ctx.lineTo(bx1,yMean); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('평균='+INDIV_MEAN.toFixed(3)+' 표준편차='+INDIV_SD.toFixed(3)+' (범위 '+INDIV_MIN.toFixed(2)+'~'+INDIV_MAX.toFixed(2)+')', bx0, by0+bh+16);

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232;
      var maxNt=60;
      function PX(v){ return px0+(v/maxNt)*(px1-px0); }
      function PY(v){ return pBot-(v)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('나무 개수', (px0+px1)/2, pBot+18);
      ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('검증 정확도',0,0); ctx.restore();
      function drawCurve(curve,col){
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        curve.forEach(function(row,ri){ var x=PX(row.nt), y=PY(row.test); if(ri===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
        ctx.stroke();
        curve.forEach(function(row){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(row.nt),PY(row.test),2.4,0,7); ctx.fill(); });
      }
      drawCurve(BAG_CURVE,BLU); drawCurve(RF_CURVE,GRN);
      ctx.strokeStyle=RED; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PX(s.nt),pTop); ctx.lineTo(PX(s.nt),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('― 배깅', px0+6, pTop+14);
      ctx.fillStyle=GRN; ctx.fillText('― 랜덤포레스트', px0+70, pTop+14);

      E.tapHint(W/2, H*0.95, '슬라이더로 나무 개수를 늘려 투표 정확도가 안정되는 것을 보세요', true);
      E.big('배깅·랜덤 포레스트 분류', '나무 하나만 쓰면 어떤 붓스트랩 표본을 뽑았는지에 따라 검증 정확도가 크게 흔들립니다 — 실제로 RF 방식으로 만든 나무 60그루 각각의 검증 정확도를 재보면 평균 '+INDIV_MEAN.toFixed(3)+', 표준편차 '+INDIV_SD.toFixed(3)+'로 '+INDIV_MIN.toFixed(2)+'부터 '+INDIV_MAX.toFixed(2)+'까지 흩어져 있습니다. <b>배깅</b>은 이런 나무 여러 그루를 붓스트랩(복원추출)으로 각자 다르게 길러 <b>다수결 투표</b>로 합치고, <b>랜덤 포레스트</b>는 매 분할마다 후보 변수까지 무작위로 줄여 나무들 사이 상관을 낮춥니다. 나무 개수를 슬라이더로 1에서 60까지 늘리면 투표 정확도는 요동치다가 점차 <b>안정된 값 하나로 수렴</b>합니다 — 개별 나무의 변덕이 투표로 상쇄되는, 분산이 줄어드는 과정을 실제 수치로 확인하는 것입니다.'); }
  },

  // ══════════ 5. 부스팅과 모델 비교 ══════════
  { id:'bda25_05',
    enter:function(E){ var self=this;
      self.s={M:8, cache:{}};
      E.controls('<div class="ctrl"><label>부스팅 단계 수 M</label><input type="range" id="b255m" min="1" max="70" step="1" value="8"><output id="b255mo">8</output></div>');
      E.bind('#b255m','input',function(e){ self.s.M=+e.target.value; document.getElementById('b255mo').textContent=self.s.M; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.ensemble import AdaBoostClassifier', hl:'AdaBoostClassifier'},
        {t:'ada = AdaBoostClassifier(n_estimators=M)', hl:'n_estimators'},
        {t:'w *= exp(-alpha * y * pred)   # 오분류 가중치↑', hl:'exp(-alpha'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'adaboost.py', 2);
      if(!s.cache[s.M]) s.cache[s.M]=trainAda25(TR25,s.M,2);
      var L=s.cache[s.M];
      var trAcc=accAda25(L,TR25), teAcc=accAda25(L,TE25);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('M='+s.M+'단계', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('훈련 정확도 = '+trAcc.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=BLU; ctx.fillText('검증 정확도 = '+teAcc.toFixed(3), W*0.04, ry+38);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+58, bh=78, bw=(bx1-bx0)/ADA_CURVE.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('M 스윕: 훈련(연한 초록) vs 검증(파랑)', bx0, by0-6);
      ADA_CURVE.forEach(function(row){
        var xk=bx0+M_TICKS.indexOf(row.M)*bw;
        ctx.fillStyle=GRN; ctx.globalAlpha=0.35; ctx.fillRect(xk+1, by0+bh-row.train*bh, bw*0.42, row.train*bh); ctx.globalAlpha=1;
        ctx.fillStyle=BLU; ctx.fillRect(xk+1+bw*0.46, by0+bh-row.test*bh, bw*0.42, row.test*bh);
        if(row.M===M_TICKS.reduce(function(p,c){return Math.abs(c-s.M)<Math.abs(p-s.M)?c:p;})){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; ctx.strokeRect(xk, by0-2, bw-1, bh+4); }
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('M=3 부근 최고(검증 0.857) → M↑ 훈련만 계속 올라 과적합 시작', bx0, by0+bh+16);

      var bx2_0=W*0.49, bx2_1=W*0.965, by2=40, bh2=190, bw2=(bx2_1-bx2_0)/5*0.6, gap2=(bx2_1-bx2_0)/5;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx2_0,by2+bh2); ctx.lineTo(bx2_1,by2+bh2); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('5겹 교차검증: 정확도(연한색) vs 카파(진한색)', bx2_0, by2-8);
      var names=['가지친트리','규칙','배깅','RF','부스팅'], keys=['Tree','Rules','Bag','RF','Boost'], cols=[DIM,GLD,BLU,GRN,ROSE];
      keys.forEach(function(key,ki){
        var r=CASE25[key];
        var hAcc=r.acc*bh2, hKap=Math.max(0,r.kappa)*bh2;
        var xk=bx2_0+ki*gap2+gap2*0.15;
        ctx.fillStyle=cols[ki]; ctx.globalAlpha=0.35; ctx.fillRect(xk, by2+bh2-hAcc, bw2*0.42, hAcc); ctx.globalAlpha=1;
        ctx.fillStyle=cols[ki]; ctx.fillRect(xk+bw2*0.46, by2+bh2-hKap, bw2*0.42, hKap);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(names[ki], xk+bw2*0.44, by2+bh2+15);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[ki];
        ctx.fillText('κ'+r.kappa.toFixed(2), xk+bw2*0.44, by2+bh2+29);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 M을 늘려 과적합이 시작되는 지점을 실제로 확인하세요', true);
      E.big('부스팅과 모델 비교', '<b>에이다부스트</b>는 얕은 나무(깊이 2)를 한 번에 하나씩 순서대로 세우되, 매 단계마다 <b>직전 단계가 틀린 표본의 가중치를 실제로 키워</b> 다음 나무가 그 어려운 표본에 더 집중하게 만듭니다. M(단계 수)을 슬라이더로 늘리면 훈련 정확도는 꾸준히 올라 결국 1.0에 이르지만, 검증 정확도는 M=3 부근(0.857)에서 최고점을 찍은 뒤 M이 커질수록 오히려 떨어집니다 — <b>과적합이 시작되는 지점</b>이 실제 수치로 드러납니다. 이 장에서 배운 다섯 모델(가지친 트리·규칙·배깅·랜덤포레스트·부스팅)을 같은 110건에 5겹 교차검증으로 공정하게 비교하면, 적당한 단계에서 멈춘 부스팅이 카파 '+CASE25.Boost.kappa.toFixed(3)+'로 가장 뚜렷한 신호를 잡아내 이 장의 최종 승자가 됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
