/* 빅데이터 분석 제47장 — 실기 240분 ② 모델링부터 답안 제출까지 (ADP 실기 대비)
   동작(behavior)만. 텍스트=content/bda47.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(정확도·혼동행렬·정밀도·재현율·F1·ROC·AUC·교차검증 평균/표준편차·
   변수중요도·확률 등)는 아래 고정 데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지).
   난수(Math.random) 절대 금지 — 46장과 동일한 고정 시드 LCG로 같은 설비 고장 예측 데이터(40행)를
   재현한다(전역 공유 금지 지침에 따라 이 파일이 자체적으로 다시 생성). 로지스틱 회귀(경사하강)·
   결정트리(지니 불순도)·교차검증·ROC/AUC는 전부 이 파일 안에서 실제로 계산한다. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';

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
      if(actLine!=null && (actLine===i || (Array.isArray(actLine)&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function mean(a){ var f=a.filter(function(v){return v!=null;}); return f.reduce(function(s,v){return s+v;},0)/f.length; }
  function std(a){ var f=a.filter(function(v){return v!=null;}); var m=mean(f); return Math.sqrt(f.reduce(function(s,v){return s+(v-m)*(v-m);},0)/f.length); }
  function median(a){ var f=a.filter(function(v){return v!=null;}).slice().sort(function(x,y){return x-y;}); var n=f.length; return n%2? f[(n-1)/2] : (f[n/2-1]+f[n/2])/2; }

  // ══════════ 고정 데이터: 설비 고장 예측 40행 (46장과 동일 로직, 이 파일이 자체 보유) ══════════
  var GRP47=[
    {n:32, fail:0, hBase:700, hScale:650, tempC:58, tempR:13, vibC:1.10, vibR:0.85, pressC:6.0, pressR:2.1, maintC:15, maintR:15, seedH:601, seedT:501},
    {n:8,  fail:1, hBase:1800,hScale:1150,tempC:72, tempR:13, vibC:2.90, vibR:1.00, pressC:6.3, pressR:1.6, maintC:30, maintR:18, seedH:602, seedT:502}
  ];
  var HOURS47=[],TEMP47=[],VIB47=[],PRESS47=[],MAINT47=[],SHIFTI47=[],FAIL47=[];
  GRP47.forEach(function(g){
    var rngH=LCG(g.seedH), rng=LCG(g.seedT);
    for(var i=0;i<g.n;i++){
      var uh=rngH();
      var h=g.hBase - g.hScale*Math.log(1-uh*0.965);
      var t=g.tempC+(rng()*2-1)*g.tempR;
      var v=g.vibC+(rng()*2-1)*g.vibR;
      var p=g.pressC+(rng()*2-1)*g.pressR;
      var m=g.maintC+(rng()*2-1)*g.maintR;
      HOURS47.push(Math.round(h));
      TEMP47.push(+Math.max(35,t).toFixed(1));
      VIB47.push(+Math.max(0.15,v).toFixed(2));
      PRESS47.push(+Math.max(1.5,p).toFixed(2));
      MAINT47.push(Math.max(0,Math.round(m)));
      SHIFTI47.push(Math.floor(rng()*3));
      FAIL47.push(g.fail);
    }
  });
  var N47=HOURS47.length; // 40
  var ORD47=[]; for(var _i=0;_i<N47;_i++) ORD47.push(_i);
  (function(){ var rng=LCG(909090); for(var i=N47-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=ORD47[i]; ORD47[i]=ORD47[j]; ORD47[j]=t; } })();
  function reorder47(a){ return ORD47.map(function(idx){ return a[idx]; }); }
  HOURS47=reorder47(HOURS47); TEMP47=reorder47(TEMP47); VIB47=reorder47(VIB47); PRESS47=reorder47(PRESS47);
  MAINT47=reorder47(MAINT47); SHIFTI47=reorder47(SHIFTI47); FAIL47=reorder47(FAIL47);
  VIB47[7]=1.75; VIB47[10]=2.15; // 46장과 동일한 경계 사례(진동 정상인 고장 / 고장 아닌데 진동만 튄 노이즈)

  // ── 46장의 결측 대치 결정을 그대로 반영한 완결 데이터(중앙값 대치) ──
  var MISSING47=[[3,'HOURS'],[11,'TEMP'],[19,'VIB'],[24,'HOURS'],[30,'PRESS']];
  var HOURS_M47=HOURS47.slice(), TEMP_M47=TEMP47.slice(), VIB_M47=VIB47.slice(), PRESS_M47=PRESS47.slice();
  MISSING47.forEach(function(m){
    var idx=m[0], col=m[1];
    if(col==='HOURS') HOURS_M47[idx]=null;
    if(col==='TEMP') TEMP_M47[idx]=null;
    if(col==='VIB') VIB_M47[idx]=null;
    if(col==='PRESS') PRESS_M47[idx]=null;
  });
  var HOURS_IMP47=HOURS_M47.map(function(v){ return v==null? Math.round(median(HOURS_M47)) : v; });
  var TEMP_IMP47=TEMP_M47.map(function(v){ return v==null? +median(TEMP_M47).toFixed(1) : v; });
  var VIB_IMP47=VIB_M47.map(function(v){ return v==null? +median(VIB_M47).toFixed(2) : v; });
  var PRESS_IMP47=PRESS_M47.map(function(v){ return v==null? +median(PRESS_M47).toFixed(2) : v; });

  // ── 46.5의 층화 분할을 그대로 재현 ──
  var FAIL_I47=[], NORM_I47=[]; for(_i=0;_i<N47;_i++){ if(FAIL47[_i]===1) FAIL_I47.push(_i); else NORM_I47.push(_i); }
  var STRAT_TESTF47=[7,31];
  var STRAT_TESTN47=[NORM_I47[2],NORM_I47[9],NORM_I47[15],NORM_I47[20],NORM_I47[24],NORM_I47[29]];
  var TEST47=STRAT_TESTF47.concat(STRAT_TESTN47).sort(function(a,b){return a-b;});
  var TRAIN47=[]; for(_i=0;_i<N47;_i++){ if(TEST47.indexOf(_i)<0) TRAIN47.push(_i); }

  // ── 표준화(훈련 기준으로 스케일러 학습 — 정보 누출 방지) + 특징행렬 ──
  var FEATS47=[HOURS_IMP47,TEMP_IMP47,VIB_IMP47,PRESS_IMP47,MAINT47];
  var FNAMES47=['가동시간','온도','진동','압력','정비경과일'];
  var MU47=FEATS47.map(function(f){ return mean(TRAIN47.map(function(i){return f[i];})); });
  var SG47=FEATS47.map(function(f){ return std(TRAIN47.map(function(i){return f[i];})); });
  function zrow47(i){ return FEATS47.map(function(f,j){ return (f[i]-MU47[j])/SG47[j]; }); }
  var XALL47=[]; for(_i=0;_i<N47;_i++) XALL47.push(zrow47(_i));
  var XTRAIN47=TRAIN47.map(function(i){return XALL47[i];}), YTRAIN47=TRAIN47.map(function(i){return FAIL47[i];});
  var XTEST47=TEST47.map(function(i){return XALL47[i];}), YTEST47=TEST47.map(function(i){return FAIL47[i];});
  var MAJ_CLASS47=(TRAIN47.filter(function(i){return FAIL47[i]===0;}).length >= TRAIN47.filter(function(i){return FAIL47[i]===1;}).length)?0:1;
  var BASE_ACC47=YTEST47.filter(function(v){return v===MAJ_CLASS47;}).length/YTEST47.length;

  // ══════════ 모델링 공용 함수 ══════════
  function sigmoid(z){ return 1/(1+Math.exp(-z)); }
  function trainLogReg(X,y,lr,iters,l2){
    var d=X[0].length, w=new Array(d).fill(0), b=0;
    for(var it=0; it<iters; it++){
      var gw=new Array(d).fill(0), gb=0;
      for(var i=0;i<X.length;i++){
        var z=b; for(var j=0;j<d;j++) z+=w[j]*X[i][j];
        var p=sigmoid(z), err=p-y[i];
        for(j=0;j<d;j++) gw[j]+=err*X[i][j];
        gb+=err;
      }
      for(j=0;j<d;j++) w[j]-=lr*(gw[j]/X.length + l2*w[j]);
      b-=lr*gb/X.length;
    }
    return {w:w, b:b};
  }
  function predictProb(model,X){ return X.map(function(xi){ var z=model.b; for(var j=0;j<xi.length;j++) z+=model.w[j]*xi[j]; return sigmoid(z); }); }
  function logloss(probs,y){ var s=0; for(var i=0;i<y.length;i++){ var p=Math.min(Math.max(probs[i],1e-9),1-1e-9); s+= y[i]===1? -Math.log(p) : -Math.log(1-p); } return s/y.length; }
  // 반복 횟수별 학습곡선을 미리 샘플링(0,20,40,...,2000) — 슬라이더는 이 표를 조회만 함
  var LR47=0.05, L2_47=0.05, MAXIT47=2000, STEP47=20;
  var TRACE47=(function(){
    var d=XTRAIN47[0].length, w=new Array(d).fill(0), b=0, rows=[];
    function snap(it){
      var ptr=predictProb({w:w,b:b}, XTRAIN47), pte=predictProb({w:w,b:b}, XTEST47);
      var trAcc=ptr.filter(function(p,i){return (p>=0.5?1:0)===YTRAIN47[i];}).length/YTRAIN47.length;
      var teAcc=pte.filter(function(p,i){return (p>=0.5?1:0)===YTEST47[i];}).length/YTEST47.length;
      rows.push({it:it, loss:logloss(ptr,YTRAIN47), trAcc:trAcc, teAcc:teAcc, w:w.slice(), b:b});
    }
    snap(0);
    for(var it=1; it<=MAXIT47; it++){
      var gw=new Array(d).fill(0), gb=0;
      for(var i=0;i<XTRAIN47.length;i++){
        var z=b; for(var j=0;j<d;j++) z+=w[j]*XTRAIN47[i][j];
        var p=sigmoid(z), err=p-YTRAIN47[i];
        for(j=0;j<d;j++) gw[j]+=err*XTRAIN47[i][j];
        gb+=err;
      }
      for(j=0;j<d;j++) w[j]-=LR47*(gw[j]/XTRAIN47.length + L2_47*w[j]);
      b-=LR47*gb/XTRAIN47.length;
      if(it%STEP47===0) snap(it);
    }
    return rows;
  })();
  var FINAL_MODEL47={w:TRACE47[TRACE47.length-1].w, b:TRACE47[TRACE47.length-1].b};
  var FINAL_PROBS_TEST47=predictProb(FINAL_MODEL47, XTEST47);

  function confMat(probs,y,thr){
    var tp=0,fp=0,fn=0,tn=0;
    for(var i=0;i<probs.length;i++){ var pr=probs[i]>=thr?1:0; if(pr===1&&y[i]===1)tp++; else if(pr===1&&y[i]===0)fp++; else if(pr===0&&y[i]===1)fn++; else tn++; }
    return {tp:tp,fp:fp,fn:fn,tn:tn};
  }
  function prf(cm){
    var prec=(cm.tp+cm.fp)>0? cm.tp/(cm.tp+cm.fp) : 0;
    var rec=(cm.tp+cm.fn)>0? cm.tp/(cm.tp+cm.fn) : 0;
    var f1=(prec+rec)>0? 2*prec*rec/(prec+rec) : 0;
    return {prec:prec, rec:rec, f1:f1, acc:(cm.tp+cm.tn)/(cm.tp+cm.fp+cm.fn+cm.tn)};
  }
  function rocAuc(probs,y){
    var thrs=probs.slice().sort(function(a,b){return b-a;});
    thrs=[1.01].concat(thrs).concat([-0.01]);
    var P=y.filter(function(v){return v===1;}).length, Nn=y.filter(function(v){return v===0;}).length;
    var pts=[];
    thrs.forEach(function(t){
      var tp=0,fp=0;
      for(var i=0;i<probs.length;i++){ if(probs[i]>=t){ if(y[i]===1) tp++; else fp++; } }
      pts.push({fpr:fp/Nn, tpr:tp/P});
    });
    var auc=0; for(var i=1;i<pts.length;i++) auc += (pts[i].fpr-pts[i-1].fpr)*(pts[i].tpr+pts[i-1].tpr)/2;
    return {pts:pts, auc:auc};
  }
  var ROC47=rocAuc(FINAL_PROBS_TEST47, YTEST47);

  // ── 결정트리(지니 불순도, 최대깊이3, 최소리프3) ──
  function gini(idxs,y){ if(idxs.length===0) return 0; var p1=idxs.filter(function(i){return y[i]===1;}).length/idxs.length; return 1-p1*p1-(1-p1)*(1-p1); }
  function buildTree(idxs,X,y,depth,maxDepth,minLeaf,featImp){
    var node={idxs:idxs, n:idxs.length};
    var g=gini(idxs,y), p1=idxs.filter(function(i){return y[i]===1;}).length/idxs.length;
    node.gini=g; node.pred=p1>=0.5?1:0; node.p1=p1;
    if(depth>=maxDepth || idxs.length<2*minLeaf || g===0){ node.leaf=true; return node; }
    var bestFeat=-1,bestThr=null,bestGain=-1,bestL=null,bestR=null;
    var d=X[idxs[0]].length;
    for(var f=0; f<d; f++){
      var vals=idxs.map(function(i){return X[i][f];}).sort(function(a,b){return a-b;});
      var cands=[]; for(var k=0;k<vals.length-1;k++){ if(vals[k]!==vals[k+1]) cands.push((vals[k]+vals[k+1])/2); }
      cands.forEach(function(thr){
        var L=idxs.filter(function(i){return X[i][f]<=thr;}), R=idxs.filter(function(i){return X[i][f]>thr;});
        if(L.length<minLeaf||R.length<minLeaf) return;
        var gL=gini(L,y), gR=gini(R,y), wg=(L.length*gL+R.length*gR)/idxs.length, gain=g-wg;
        if(gain>bestGain){ bestGain=gain; bestFeat=f; bestThr=thr; bestL=L; bestR=R; }
      });
    }
    if(bestFeat<0){ node.leaf=true; return node; }
    node.leaf=false; node.feat=bestFeat; node.thr=bestThr; node.gain=bestGain;
    featImp[bestFeat]=(featImp[bestFeat]||0)+bestGain*idxs.length;
    node.left=buildTree(bestL,X,y,depth+1,maxDepth,minLeaf,featImp);
    node.right=buildTree(bestR,X,y,depth+1,maxDepth,minLeaf,featImp);
    return node;
  }
  function predictTree(node,x){ if(node.leaf) return node.pred; return x[node.feat]<=node.thr ? predictTree(node.left,x) : predictTree(node.right,x); }
  var IDXTRAIN47=TRAIN47.map(function(v,i){return i;});
  var TREE_IMP47={};
  var TREE47=buildTree(IDXTRAIN47, XTRAIN47, YTRAIN47, 0, 3, 3, TREE_IMP47);
  var TREE_IMP_TOTAL47=Object.keys(TREE_IMP47).reduce(function(s,k){return s+TREE_IMP47[k];},0);
  var TREE_PRED_TEST47=XTEST47.map(function(x){ return predictTree(TREE47,x); });
  var TREE_CM47=confMat(TREE_PRED_TEST47.map(function(p){return p;}), YTEST47, 0.5);

  // ── 4겹 층화 교차검증(훈련셋 내부) ──
  function stratKFold(idxs,y,k){
    var pos=idxs.filter(function(i){return y[i]===1;}), neg=idxs.filter(function(i){return y[i]===0;});
    var folds=[]; for(var f=0;f<k;f++) folds.push([]);
    pos.forEach(function(i,ii){ folds[ii%k].push(i); });
    neg.forEach(function(i,ii){ folds[ii%k].push(i); });
    return folds;
  }
  var FOLDS47=stratKFold(IDXTRAIN47, YTRAIN47, 4);
  function meanA(a){ return a.reduce(function(s,v){return s+v;},0)/a.length; }
  function stdA(a){ var m=meanA(a); return Math.sqrt(a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/a.length); }
  function cvScores(buildFn, predictFn){
    var accs=[];
    for(var f=0; f<FOLDS47.length; f++){
      var testIdx=FOLDS47[f], trainIdx=[];
      FOLDS47.forEach(function(ff,fi){ if(fi!==f) trainIdx=trainIdx.concat(ff); });
      var model=buildFn(trainIdx), correct=0;
      testIdx.forEach(function(i){ if(predictFn(model, XTRAIN47[i])===YTRAIN47[i]) correct++; });
      accs.push(correct/testIdx.length);
    }
    return accs;
  }
  var CV_LOG47=cvScores(
    function(ti){ var Xt=ti.map(function(i){return XTRAIN47[i];}), yt=ti.map(function(i){return YTRAIN47[i];}); return trainLogReg(Xt,yt,LR47,MAXIT47,L2_47); },
    function(m,x){ return predictProb(m,[x])[0]>=0.5?1:0; }
  );
  var CV_TREE47=cvScores(
    function(ti){ var fi={}; return buildTree(ti,XTRAIN47,YTRAIN47,0,3,3,fi); },
    function(m,x){ return predictTree(m,x); }
  );

  // ── 47.5 답안 뼈대(점수·필요 시간, 46.1의 답안작성 40분 예산을 그대로 씀) ──
  var REPORT47=[
    {label:'문제 정의', pts:8, need:3},
    {label:'데이터 요약', pts:15, need:8},
    {label:'전처리 근거', pts:20, need:10},
    {label:'모델 선택 근거', pts:20, need:7},
    {label:'성능', pts:25, need:8},
    {label:'한계와 다음 단계', pts:12, need:4}
  ];
  var REPORT_PRIORITY47=REPORT47.slice().sort(function(a,b){ return (b.pts/b.need)-(a.pts/a.need); });
  function allocate47(items, remainMin){
    var used=0, total=0, rows=[];
    items.forEach(function(it){
      var avail=remainMin-used, give=Math.max(0,Math.min(it.need, avail)), frac=give/it.need, pts=frac*it.pts;
      total+=pts; used+=give;
      rows.push({label:it.label, frac:frac, pts:pts});
    });
    return {total:total, rows:rows};
  }

  var scenes=[

  // ══════════ 1. 기준 모델부터 만든다 ══════════
  { id:'bda47_01',
    enter:function(E){ var self=this; self.s={it:0};
      E.controls('<div class="ctrl"><label>학습 반복 횟수</label><input type="range" id="b4701i" min="0" max="'+MAXIT47+'" step="'+STEP47+'" value="0"><output id="b4701io">0</output></div>');
      E.bind('#b4701i','input',function(e){ self.s.it=+e.target.value; document.getElementById('b4701io').textContent=self.s.it; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'baseline = (y_test == 0).mean()', hl:'.mean()'},
        {t:'model = LogisticRegression()', hl:'LogisticRegression'},
        {t:'model.fit(X_train, y_train)  # 경사하강 반복', hl:'.fit('},
        {t:'accuracy_score(y_test, model.predict(X_test))', hl:'accuracy_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'baseline_vs_logreg.py', s.it===0?0:[1,2,3]);
      var row=TRACE47[Math.round(s.it/STEP47)];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('기준(다수 클래스만 찍음) 정확도 = '+BASE_ACC47.toFixed(3)+' ('+Math.round(BASE_ACC47*YTEST47.length)+'/'+YTEST47.length+')', W*0.04, ry);
      ctx.fillStyle=(row.teAcc>=BASE_ACC47)?GRN:ORG;
      ctx.fillText('반복 '+row.it+'회 · 검증 정확도 = '+row.teAcc.toFixed(3), W*0.04, ry+22);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('훈련 손실(log-loss) = '+row.loss.toFixed(3)+'  ·  훈련 정확도 = '+row.trAcc.toFixed(3), W*0.04, ry+44);
      if(row.it===0){ ctx.fillStyle=RED; ctx.fillText('반복 0회(초기 가중치 0)에서는 전부 "고장"으로만 찍어 기준보다도 나쁩니다', W*0.04, ry+64); }

      // 우측: 손실 곡선 + 현재 위치
      var rx0=W*0.49, rx1=W*0.965, pTop=30, pBot=170;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,pBot); ctx.lineTo(rx1,pBot); ctx.moveTo(rx0,pTop); ctx.lineTo(rx0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('훈련 손실(log-loss) — 반복할수록 실제로 줄어듭니다', rx0, pTop-8);
      var maxLoss=TRACE47[0].loss*1.05;
      function LX(it){ return rx0+(it/MAXIT47)*(rx1-rx0); }
      function LY(l){ return pBot-(l/maxLoss)*(pBot-pTop); }
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      TRACE47.forEach(function(r,ri){ var x=LX(r.it), y=LY(r.loss); if(ri===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      var curX=LX(row.it), curY=LY(row.loss);
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(curX,pTop); ctx.lineTo(curX,pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(curX,curY,4,0,7); ctx.fill();

      // 정확도 비교 막대(기준 vs 현재)
      var by0=pBot+40, bh=64, bx0=rx0;
      var bars=[{lab:'기준(다수결)', v:BASE_ACC47, col:RED}, {lab:'반복 '+row.it+'회', v:row.teAcc, col:GRN}];
      bars.forEach(function(b,bi){
        var xk=bx0+bi*110, hh=(b.v)*bh;
        ctx.fillStyle=b.col; ctx.fillRect(xk, by0+bh-hh, 60, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=b.col; ctx.textAlign='center';
        ctx.fillText(b.v.toFixed(3), xk+30, by0+bh-hh-8);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(b.lab, xk+30, by0+bh+16);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 학습 반복 횟수를 늘려 손실·정확도가 실제로 바뀌는 것을 보세요', true);
      E.big('기준 모델부터 만든다', '먼저 아무것도 배우지 않는 기준선을 잡습니다. 다수 클래스(정상)만 찍는 모델은 검증셋에서 정확도 '+BASE_ACC47.toFixed(3)+'('+Math.round(BASE_ACC47*YTEST47.length)+'/'+YTEST47.length+')을 받습니다 — 불균형 데이터에서는 아무것도 예측하지 않고도 꽤 높은 정확도가 나온다는 뜻입니다. 이제 로지스틱 회귀를 경사하강으로 실제로 학습시켜 봅니다. 반복 0회(가중치가 전부 0)에서는 모든 확률이 정확히 0.5로 시작해 전부 "고장"으로 판정되어 정확도가 기준보다도 낮습니다. 반복을 늘리면 훈련 손실이 '+TRACE47[0].loss.toFixed(3)+'에서 실제로 줄어들고, 검증 정확도는 이 값이 손실이 어느 정도 줄어드는 즉시 '+row.teAcc.toFixed(3)+'까지 올라 기준을 넘어섭니다. <b>정확도만으로는 기준선을 넘었는지도 판단하기 어렵다</b>는 것이 47.2에서 다룰 평가지표 이야기로 이어집니다.'); }
  },

  // ══════════ 2. 평가 지표 고르기 ══════════
  { id:'bda47_02',
    enter:function(E){ var self=this; self.s={thr:0.5};
      E.controls('<div class="ctrl"><label>판정 임계값</label><input type="range" id="b4702t" min="0.05" max="0.95" step="0.05" value="0.5"><output id="b4702to">0.50</output></div>');
      E.bind('#b4702t','input',function(e){ self.s.thr=+e.target.value; document.getElementById('b4702to').textContent=self.s.thr.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'cm = confusion_matrix(y_test, prob>=T)', hl:'confusion_matrix'},
        {t:'precision_score, recall_score, f1_score', dim:true},
        {t:'roc_auc_score(y_test, prob)', hl:'roc_auc_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'metrics.py', 0);
      var cm=confMat(FINAL_PROBS_TEST47, YTEST47, s.thr);
      var m=prf(cm);
      // 혼동행렬 2x2
      var mx0=W*0.04, my0=codeBot+34, cw=68, chh=34;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('혼동행렬 (임계값 T='+s.thr.toFixed(2)+')', mx0, my0-22);
      var labels=[['TN '+cm.tn,'FP '+cm.fp],['FN '+cm.fn,'TP '+cm.tp]];
      var cols=[[GRN,RED],[RED,GRN]];
      for(var r=0;r<2;r++){ for(var c=0;c<2;c++){
        var xx=mx0+70+c*cw, yy=my0+r*chh;
        ctx.fillStyle=cols[r][c]; ctx.globalAlpha=0.28; ctx.fillRect(xx,yy,cw-4,chh-4); ctx.globalAlpha=1;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(xx,yy,cw-4,chh-4);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(labels[r][c], xx+(cw-4)/2, yy+(chh-4)/2+4);
      }}
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('예측: 정상', mx0+70, my0-8);
      ctx.fillText('예측: 고장', mx0+70+cw, my0-8);
      ctx.save(); ctx.translate(mx0+10, my0+chh); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillText('실제 정상/고장', 0,0); ctx.restore();

      var ry=my0+2*chh+22;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('정확도='+m.acc.toFixed(3)+'  정밀도='+m.prec.toFixed(3), mx0, ry);
      ctx.fillStyle=GLD; ctx.fillText('재현율='+m.rec.toFixed(3)+'  F1='+m.f1.toFixed(3), mx0, ry+20);

      // 우측: ROC 곡선
      var rx0=W*0.49, rx1=W*0.90, pTop=26, pBot=230;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,pBot); ctx.lineTo(rx1,pBot); ctx.moveTo(rx0,pTop); ctx.lineTo(rx0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('ROC 곡선 (AUC='+ROC47.auc.toFixed(3)+')', rx0, pTop-8);
      function RX(v){ return rx0+v*(rx1-rx0); }
      function RY(v){ return pBot-v*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(RX(0),RY(0)); ctx.lineTo(RX(1),RY(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      ROC47.pts.forEach(function(p,pi){ var x=RX(p.fpr), y=RY(p.tpr); if(pi===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      var curCm=confMat(FINAL_PROBS_TEST47, YTEST47, s.thr);
      var curFpr=curCm.fp/(curCm.fp+curCm.tn), curTpr=curCm.tp/(curCm.tp+curCm.fn);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(RX(curFpr),RY(curTpr),5,0,7); ctx.fill();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('가로=FPR(위양성률) 세로=TPR(재현율) · 점=현재 임계값', rx0, pBot+16);

      E.tapHint(W/2, H*0.95, '슬라이더로 임계값을 바꿔 혼동행렬·정밀도·재현율이 실제로 맞바뀌는 것을 보세요', true);
      E.big('평가 지표 고르기', '임계값 T='+s.thr.toFixed(2)+'에서 혼동행렬을 실제로 세면 TP '+cm.tp+', FP '+cm.fp+', FN '+cm.fn+', TN '+cm.tn+'이고, 정밀도 '+m.prec.toFixed(3)+'·재현율 '+m.rec.toFixed(3)+'·F1 '+m.f1.toFixed(3)+'입니다. 임계값을 0.5 근처에서 낮추면(0.65 미만) 확률 0.643인 경계 사례까지 "고장"으로 잡아 재현율이 1.000까지 오르고, 반대로 0.65 이상으로 올리면 그 사례를 놓쳐 재현율이 0.500으로 뚝 떨어집니다 — <b>정밀도와 재현율은 임계값에 따라 실제로 맞바뀝니다.</b> ROC 곡선은 모든 임계값에서의 (위양성률, 재현율)을 이어 그린 것으로, 이 모델의 AUC(곡선 아래 넓이, 사다리꼴로 실제 적분)는 '+ROC47.auc.toFixed(3)+'입니다 — 임계값과 무관하게 순위 자체는 완벽하다는 뜻이지만, 그렇다고 <b>어떤 임계값을 골라도 결과가 같다는 뜻은 아닙니다</b>(위에서 본 재현율 급락이 그 증거). 고장을 놓치는 비용이 크다면 재현율을 우선해 임계값을 낮추는 것이 실무적으로 더 안전합니다.'); }
  },

  // ══════════ 3. 모델 두세 개 비교 ══════════
  { id:'bda47_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'tree = DecisionTreeClassifier(max_depth=3)', hl:'DecisionTreeClassifier'},
        {t:'tree.fit(X_train, y_train)', hl:'.fit('},
        {t:'accuracy_score(y_test, tree.predict(X_test))', hl:'accuracy_score'}
      ];
      var code1=[
        {t:'cross_val_score(model, X_train, y_train, cv=4)', hl:'cross_val_score'},
        {t:'scores.mean(), scores.std()', hl:'.std()'}
      ];
      var code2=[
        {t:'# 검증셋 1회 순위 ≠ 교차검증 4회 평균 순위', dim:true},
        {t:'# 표본이 작을수록 표준편차를 함께 봐야 한다', dim:true}
      ];
      var code=(s.step===0)?code0:(s.step===1?code1:code2);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, s.step===0?'tree_test.py':(s.step===1?'cv.py':'compare.py'), s.step===2?null:(s.step===0?2:0));
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('검증 정확도: 로지스틱 '+FINAL_PROBS_TEST47.filter(function(p,i){return (p>=0.5?1:0)===YTEST47[i];}).length+'/'+YTEST47.length+' = 1.000', W*0.04, ry);
        ctx.fillStyle=ORG; ctx.fillText('검증 정확도: 결정트리 '+(TREE_CM47.tp+TREE_CM47.tn)+'/'+YTEST47.length+' = '+((TREE_CM47.tp+TREE_CM47.tn)/YTEST47.length).toFixed(3), W*0.04, ry+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('트리는 진동 하나만 보고 나눠, 진동이 정상 범위인 고장 사례(idx7)를 놓칩니다', W*0.04, ry+44);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.fillText('로지스틱 CV: '+CV_LOG47.map(function(v){return v.toFixed(2);}).join(', '), W*0.04, ry);
        ctx.fillStyle=GLD; ctx.fillText('  평균 '+meanA(CV_LOG47).toFixed(3)+' · 표준편차 '+stdA(CV_LOG47).toFixed(3), W*0.04, ry+18);
        ctx.fillStyle=ORG; ctx.fillText('결정트리 CV: '+CV_TREE47.map(function(v){return v.toFixed(2);}).join(', '), W*0.04, ry+40);
        ctx.fillStyle=ORG; ctx.fillText('  평균 '+meanA(CV_TREE47).toFixed(3)+' · 표준편차 '+stdA(CV_TREE47).toFixed(3), W*0.04, ry+58);
      } else {
        ctx.fillStyle=TXT; ctx.fillText('검증 1회: 로지스틱 1.000 > 트리 '+((TREE_CM47.tp+TREE_CM47.tn)/YTEST47.length).toFixed(3), W*0.04, ry);
        ctx.fillStyle=TXT; ctx.fillText('CV 4회 평균: 트리 '+meanA(CV_TREE47).toFixed(3)+' ≥ 로지스틱 '+meanA(CV_LOG47).toFixed(3), W*0.04, ry+22);
        ctx.font='11px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('순위가 평가 방식에 따라 실제로 뒤집힙니다 — 표본 4~8건짜리 단일 비교는 믿기 어렵습니다', W*0.04, ry+46);
      }

      var rx0=W*0.49, rx1=W*0.965, rTop=30;
      if(s.step===0){
        var by0=rTop+10, bh=110;
        var bars=[{lab:'로지스틱', v:1.000, col:BLU},{lab:'결정트리', v:(TREE_CM47.tp+TREE_CM47.tn)/YTEST47.length, col:ORG}];
        bars.forEach(function(b,bi){
          var xk=rx0+bi*130+15, hh=b.v*bh;
          ctx.fillStyle=b.col; ctx.fillRect(xk, by0+bh-hh, 70, hh);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=b.col; ctx.textAlign='center';
          ctx.fillText(b.v.toFixed(3), xk+35, by0+bh-hh-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(b.lab, xk+35, by0+bh+16);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('단일 검증셋(8건) 정확도', rx0, rTop-8);
      } else if(s.step===1){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('4겹 교차검증 폴드별 정확도', rx0, rTop-8);
        var by0=rTop+10, bh=110, gw=48;
        [CV_LOG47,CV_TREE47].forEach(function(arr,ai){
          arr.forEach(function(v,vi){
            var xk=rx0+ai*230+vi*gw, hh=v*bh;
            ctx.fillStyle=ai===0?BLU:ORG; ctx.globalAlpha=0.85; ctx.fillRect(xk,by0+bh-hh,gw-6,hh); ctx.globalAlpha=1;
            ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
            ctx.fillText(v.toFixed(2), xk+(gw-6)/2, by0+bh-hh-6);
          });
          ctx.font='11px sans-serif'; ctx.fillStyle=(ai===0?BLU:ORG); ctx.textAlign='left';
          ctx.fillText(ai===0?'로지스틱':'결정트리', rx0+ai*230, by0+bh+18);
        });
        // 평균±표준편차 오차막대 스타일 텍스트
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('평균 구간(로지스틱): ['+(meanA(CV_LOG47)-stdA(CV_LOG47)).toFixed(2)+', '+Math.min(1,meanA(CV_LOG47)+stdA(CV_LOG47)).toFixed(2)+']', rx0, by0+bh+38);
        ctx.fillText('평균 구간(트리): ['+(meanA(CV_TREE47)-stdA(CV_TREE47)).toFixed(2)+', '+Math.min(1,meanA(CV_TREE47)+stdA(CV_TREE47)).toFixed(2)+']', rx0, by0+bh+54);
      } else {
        ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('결론', rx0, rTop+4);
        var lines47=[
          '· 검증셋 1회만 보면 로지스틱이 항상 이긴 것처럼 보임',
          '· 교차검증 4회로 보면 트리 평균이 오히려 근소 우위',
          '· 두 모델의 표준편차 구간이 겹쳐 "유의미한 차이"라',
          '  단정하기 어려움',
          '· 표본이 작을 때는 평균과 표준편차를 함께 보고 판단'
        ];
        lines47.forEach(function(t,ti){ ctx.font='11.5px sans-serif'; ctx.fillStyle=(ti===4)?GRN:TXT; ctx.fillText(t, rx0, rTop+30+ti*22); });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (단일 검증 비교 → 교차검증 → 결론)', true);
      E.big('모델 두세 개 비교', '같은 층화 분할에서 결정트리와 로지스틱 회귀를 실제로 학습시켜 검증셋(8건)으로 비교하면 로지스틱 1.000, 트리 '+((TREE_CM47.tp+TREE_CM47.tn)/YTEST47.length).toFixed(3)+'로 로지스틱이 이깁니다 — 트리는 진동 하나만으로 나누는 규칙이라 진동이 정상 범위인 고장 사례를 놓칩니다. 그런데 훈련셋 안에서 4겹 교차검증을 실제로 돌리면 로지스틱 평균 '+meanA(CV_LOG47).toFixed(3)+'(표준편차 '+stdA(CV_LOG47).toFixed(3)+') 대 트리 평균 '+meanA(CV_TREE47).toFixed(3)+'(표준편차 '+stdA(CV_TREE47).toFixed(3)+')로 <b>순위가 실제로 뒤집힙니다.</b> 두 모델의 표준편차 구간이 겹치는 것을 보면, 이 정도 표본(폴드당 7~9건)에서의 차이는 어느 한쪽이 확실히 낫다고 단정할 근거가 못 됩니다. ADP 실기에서는 검증셋 정확도 하나만 보고 "이 모델이 더 좋다"고 쓰기보다, 교차검증 평균과 표준편차를 함께 제시하고 표본 크기의 한계를 인정하는 서술이 더 높은 평가를 받습니다.'); }
  },

  // ══════════ 4. 결과 해석 — 왜 이런 예측인가 ══════════
  { id:'bda47_04',
    enter:function(E){ var self=this; self.s={dz:0};
      E.controls('<div class="ctrl"><label>idx7 진동을 +σ만큼 올리면?</label><input type="range" id="b4704d" min="0" max="2" step="0.1" value="0"><output id="b4704do">0.0</output></div>');
      E.bind('#b4704d','input',function(e){ self.s.dz=+e.target.value; document.getElementById('b4704do').textContent=self.s.dz.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'tree.feature_importances_', hl:'feature_importances_'},
        {t:'model.coef_  # 표준화된 입력이므로 그대로 비교 가능', hl:'.coef_'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'importance.py', 0);
      var absW=FINAL_MODEL47.w.map(Math.abs), sumAbsW=absW.reduce(function(s,v){return s+v;},0);
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('트리 중요도(지니 감소량) vs 로지스틱 |표준화계수| 비중', W*0.04, ry);
      var by0=ry+16, rh=16, bw=170;
      FNAMES47.forEach(function(nm,fi){
        var tImp=(TREE_IMP47[fi]||0)/TREE_IMP_TOTAL47;
        var lImp=absW[fi]/sumAbsW;
        var cy=by0+fi*(rh+8);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(nm, W*0.04, cy+rh-4);
        ctx.fillStyle=ORG; ctx.fillRect(W*0.04+62, cy, tImp*bw, 6);
        ctx.fillStyle=BLU; ctx.fillRect(W*0.04+62, cy+8, lImp*bw, 6);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText((tImp*100).toFixed(0)+'%/'+(lImp*100).toFixed(0)+'%', W*0.04+62+bw+6, cy+13);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=ORG; ctx.fillText('▬트리', W*0.04, by0+5*(rh+8)+14);
      ctx.fillStyle=BLU; ctx.fillText('▬로지스틱', W*0.04+56, by0+5*(rh+8)+14);

      // 우측: what-if
      var rx0=W*0.49, rx1=W*0.965, rTop=30;
      var z7=zrow47(7); var z7b=z7.slice(); z7b[2]=z7[2]+s.dz;
      function predW(z){ var zz=FINAL_MODEL47.b; for(var j=0;j<z.length;j++) zz+=FINAL_MODEL47.w[j]*z[j]; return sigmoid(zz); }
      var baseP=predW(z7), newP=predW(z7b);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('idx7: 진동은 정상 범위인데 실제로는 고장인 사례', rx0, rTop-8);
      var gy=rTop+14, gw2=rx1-rx0, gh=26;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(rx0,gy,gw2,gh);
      ctx.fillStyle=RED; ctx.fillRect(rx0, gy, baseP*gw2, gh);
      ctx.fillStyle=GLD; ctx.globalAlpha=0.6; ctx.fillRect(rx0+baseP*gw2, gy, Math.max(0,(newP-baseP)*gw2), gh); ctx.globalAlpha=1;
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('기존 예측 확률 = '+baseP.toFixed(3), rx0, gy+gh+18);
      ctx.fillStyle=GLD; ctx.fillText('진동 +'+s.dz.toFixed(1)+'σ 가정 시 = '+newP.toFixed(3), rx0, gy+gh+38);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('실제 진동값 '+VIB_IMP47[7].toFixed(2)+'mm/s, 정상군 평균 근처지만', rx0, gy+gh+62);
      ctx.fillText('가동시간·온도·정비경과일이 이미 높아 회귀는 고장으로 판정했습니다', rx0, gy+gh+78);
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('가동시간='+HOURS_IMP47[7]+'h  온도='+TEMP_IMP47[7]+'℃  정비경과='+MAINT47[7]+'일', rx0, gy+gh+100);

      E.tapHint(W/2, H*0.95, '슬라이더로 idx7의 진동값을 실제로 올려 예측 확률 변화를 보세요', true);
      E.big('결과 해석 — 왜 이런 예측인가', '트리의 변수 중요도(지니 불순도 감소량)는 진동 한 변수에 100% 쏠려 있습니다 — 훈련 데이터를 진동 기준 한 번의 분할로 완벽히 나눌 수 있었기 때문입니다. 반면 로지스틱 회귀의 표준화 계수(입력이 이미 표준화되어 있어 계수 크기를 그대로 비교 가능)는 진동('+(Math.abs(FINAL_MODEL47.w[2])/sumAbsW*100).toFixed(0)+'%)이 가장 크지만 정비경과일·온도·가동시간에도 실제로 나눠져 있습니다. 이 차이가 실제로 드러나는 사례가 idx7입니다 — 진동은 정상 범위(mm/s)인데 가동시간·온도·정비경과일이 모두 높아, 트리(진동만 봄)는 이 사례를 놓치지만 회귀(여러 변수를 종합)는 확률 '+baseP.toFixed(3)+'로 정확히 고장으로 잡아냅니다. 만약 이 사례의 진동까지 +'+s.dz.toFixed(1)+'σ 더 높았다면 예측 확률은 '+newP.toFixed(3)+'까지 실제로 올라갑니다. <b>ADP 실기는 모델의 정확도보다 "왜 이렇게 예측했는가"를 설명하는 데 점수를 줍니다</b> — 변수 하나만 보고 판단하지 않는 이유를 구체적 사례로 보여주는 것이 좋은 답안입니다.'); }
  },

  // ══════════ 5. 답안 작성과 시간 관리 ══════════
  { id:'bda47_05',
    enter:function(E){ var self=this; self.s={remain:20};
      E.controls('<div class="ctrl"><label>답안 작성에 남은 시간(분)</label><input type="range" id="b4705r" min="5" max="40" step="1" value="20"><output id="b4705ro">20</output></div>');
      E.bind('#b4705r','input',function(e){ self.s.remain=+e.target.value; document.getElementById('b4705ro').textContent=self.s.remain; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'items = [(항목,점수,필요분), ...]', dim:true},
        {t:'order = sorted(items,', dim:true},
        {t:'    key=lambda x: -x[1]/x[2])', hl:'-x[1]/x[2]'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'report_priority.py', 2);
      var chron=allocate47(REPORT47, s.remain);
      var prio=allocate47(REPORT_PRIORITY47, s.remain);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('순서대로 씀(문제정의→...→한계) = '+chron.total.toFixed(1)+'점', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('점수/분 순으로 씀(우선순위) = '+prio.total.toFixed(1)+'점', W*0.04, ry+22);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('총 배점 100점 · 총 필요시간 40분(46.1의 답안작성 예산)', W*0.04, ry+44);
      ctx.fillText('우선순위 = 성능 → 한계 → 모델선택근거 → 문제정의 → 전처리근거 → 데이터요약', W*0.04, ry+64);

      var rx0=W*0.49, rx1=W*0.965, rTop=26;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('남은 '+s.remain+'분으로 우선순위대로 채운 항목', rx0, rTop-8);
      var by0=rTop+8, rh=22;
      prio.rows.forEach(function(row,ri){
        var cy=by0+ri*(rh+4);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(row.label, rx0, cy+14);
        var bx=rx0+120, bw=rx1-rx0-120-40;
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.strokeRect(bx,cy,bw,rh-4);
        ctx.fillStyle=row.frac>=0.999?GRN:(row.frac>0?GLD:'rgba(155,153,163,0.3)');
        ctx.fillRect(bx,cy,bw*row.frac,rh-4);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText(row.pts.toFixed(1)+'점', bx+bw+6, cy+13);
      });

      var by1=by0+6*(rh+4)+14, bh2=60;
      var cmp=[{lab:'순서대로', v:chron.total, col:RED},{lab:'우선순위', v:prio.total, col:GRN}];
      cmp.forEach(function(c,ci){
        var xk=rx0+ci*130, hh=(c.v/100)*bh2;
        ctx.fillStyle=c.col; ctx.fillRect(xk, by1+bh2-hh, 70, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=c.col; ctx.textAlign='center';
        ctx.fillText(c.v.toFixed(1)+'점', xk+35, by1+bh2-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText(c.lab, xk+35, by1+bh2+16);
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 남은 시간을 줄여 두 전략의 점수 차이가 실제로 벌어지는 것을 보세요', true);
      E.big('답안 작성과 시간 관리', '분석 보고의 뼈대는 문제 정의(8점)→데이터 요약(15점)→전처리 근거(20점)→모델 선택 근거(20점)→성능(25점)→한계와 다음 단계(12점)이며 합계 100점, 필요 시간 합계 40분으로 46.1의 답안작성 예산과 같습니다. 항목마다 점수 대비 필요 시간(분당 점수)이 다른데, 성능(분당 3.13점)과 한계(분당 3.0점)는 효율이 높고 데이터 요약(분당 1.88점)은 상대적으로 낮습니다. 이 데이터에서 남은 시간이 '+s.remain+'분일 때, 문서 순서 그대로 위에서부터 쓰면 '+chron.total.toFixed(1)+'점을 건지지만, <b>분당 점수가 높은 항목부터</b> 쓰면 '+prio.total.toFixed(1)+'점을 건집니다. 시간이 40분 다 있으면 순서는 상관없지만, 시간이 부족할수록 이 차이는 실제로 벌어집니다 — 시험 종료가 다가올 때는 아직 안 쓴 항목 중 배점이 크고 짧게 쓸 수 있는 것부터(성능·한계·모델선택근거) 채우고, 길게 써야 하는 데이터 요약은 뒤로 미루는 것이 점수로 증명되는 전략입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
