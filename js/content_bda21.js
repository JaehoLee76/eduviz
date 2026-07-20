/* 빅데이터 분석 제21장 — 사례 연구: 콘크리트 혼합물의 압축 강도 (배합을 설계하다)
   동작(behavior)만. 텍스트=content/bda21.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(상관계수·교차검증 RMSE·변수 중요도·부분의존 곡선·최적 배합·불확실성)는
   아래 고정 배열로부터 이 파일 로드 시 실제 계산(하드코딩 금지). 선형회귀(공학적 특징 포함)·
   회귀나무·배깅앙상블을 직접 구현해 비교하고, 트리 분할 이득 누적으로 변수 중요도를,
   진짜 부분의존(각 훈련점에서 한 변수만 바꿔 평균)으로 효과 곡선을, 격자 탐색으로 배합
   최적화를 직접 계산한다. 난수(Math.random) 절대 금지 — 표본·초기화는 고정 시드 LCG. */
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
  function corr(a,b){ var ma=mean(a), mb=mean(b), sab=0,saa=0,sbb=0,i; for(i=0;i<a.length;i++){ sab+=(a[i]-ma)*(b[i]-mb); saa+=(a[i]-ma)*(a[i]-ma); sbb+=(b[i]-mb)*(b[i]-mb); } return sab/Math.sqrt(saa*sbb); }
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

  // ══════════ 고정 데이터: 콘크리트 혼합물 50건(시멘트·슬래그·물 비율 + 재령 → 압축강도) ══════════
  // 비율은 전체 배합(=1)의 일부이며, 나머지는 골재(자갈·모래) — 세 비율의 합이 늘 1보다 작아야
  // 골재 몫이 남는다는 것이 이 데이터의 특수한 제약이다.
  var N21=50, C21=[], S21=[], W21=[], AGE21=[], STR21=[];
  (function(){
    var rng=LCG(20260727);
    var ageCycle=[3,7,14,28,56,90,120];
    for(var i=0;i<N21;i++){
      var c=0.16+0.16*rng();
      var wc=0.40+0.35*rng();
      var w=wc*c;
      var s=0.20*rng();
      if(c+s+w>0.85) s=Math.max(0,0.85-c-w);
      var age=ageCycle[i%ageCycle.length];
      var noise=(rng()-0.5)*5.0;
      var strength=10+55*c-25*(w/c)+60*s-200*s*s+8.5*Math.log(1+age)+noise;
      C21.push(+c.toFixed(4)); S21.push(+s.toFixed(4)); W21.push(+w.toFixed(4)); AGE21.push(age);
      STR21.push(+Math.max(4,strength).toFixed(2));
    }
  })();
  var ALLIDX21=[]; for(var _i=0;_i<N21;_i++) ALLIDX21.push(_i);
  var WC21=ALLIDX21.map(function(i){ return W21[i]/C21[i]; });
  var AGG21=ALLIDX21.map(function(i){ return 1-C21[i]-S21[i]-W21[i]; });

  var K21=5;
  var FOLDS21=(function(){
    var arr=[];
    for(var k=0;k<K21;k++){
      var tr=[],te=[];
      ALLIDX21.forEach(function(i){ if(i%K21===k) te.push(i); else tr.push(i); });
      arr.push({k:k,tr:tr,te:te});
    }
    return arr;
  })();

  // ── 모델 1: 선형회귀(공학적 특징 c, wc비, s, age 사용) ──────────────────────────────
  function rowOLS21(i){ return [1, C21[i], WC21[i], S21[i], AGE21[i]]; }
  function fitOLS21(idxs){
    var X=idxs.map(rowOLS21), y=idxs.map(function(i){return STR21[i];});
    var Xt=matT(X), XtX=matMul(Xt,X), Xty=matVec(Xt,y);
    return {w:solveLin(XtX,Xty)};
  }
  function predOLS21(m,i){ var r=rowOLS21(i); var s=0; for(var k=0;k<r.length;k++) s+=m.w[k]*r[k]; return s; }
  function predRowOLS21(m,c,s2,w,age){ var wc=w/c; var r=[1,c,wc,s2,age]; var s=0; for(var k=0;k<r.length;k++) s+=m.w[k]*r[k]; return s; }

  // ── 모델 2·3: 회귀나무 + 배깅앙상블 (원 특징 c,s,w,age 4개로 직접 분할) ──────────────────────────────
  var FEATS21=[C21,S21,W21,AGE21], FNAME21=['시멘트비율(c)','슬래그비율(s)','물비율(w)','재령(age,일)'];
  function sseIdx21(idxs){ if(!idxs.length) return 0; var m=mean(idxs.map(function(i){return STR21[i];})), s=0; idxs.forEach(function(i){ var d=STR21[i]-m; s+=d*d; }); return s; }
  function bestSplit21(idxs,minLeaf){
    var parentSSE=sseIdx21(idxs), best=null;
    [0,1,2,3].forEach(function(fi){
      var vals=idxs.map(function(i){return FEATS21[fi][i];}), uq=uniqSorted(vals);
      for(var u=0;u<uq.length-1;u++){
        var thresh=(uq[u]+uq[u+1])/2, left=[],right=[];
        idxs.forEach(function(i){ if(FEATS21[fi][i]<=thresh) left.push(i); else right.push(i); });
        if(left.length<minLeaf||right.length<minLeaf) continue;
        var gain=parentSSE-sseIdx21(left)-sseIdx21(right);
        if(best===null||gain>best.gain) best={fi:fi,thresh:thresh,gain:gain,left:left,right:right};
      }
    });
    return best;
  }
  function buildTree21(idxs,minLeaf,maxDepth,depth){
    depth=depth||0;
    var node={idxs:idxs, n:idxs.length, mean:mean(idxs.map(function(i){return STR21[i];}))};
    if(idxs.length<2*minLeaf || depth>=maxDepth){ node.leaf=true; return node; }
    var sp=bestSplit21(idxs,minLeaf);
    if(!sp||sp.gain<=1e-9){ node.leaf=true; return node; }
    node.leaf=false; node.fi=sp.fi; node.thresh=sp.thresh; node.gain=sp.gain;
    node.left=buildTree21(sp.left,minLeaf,maxDepth,depth+1);
    node.right=buildTree21(sp.right,minLeaf,maxDepth,depth+1);
    return node;
  }
  function treePredict21(node,i){ if(node.leaf) return node.mean; var v=FEATS21[node.fi][i]; return v<=node.thresh?treePredict21(node.left,i):treePredict21(node.right,i); }
  function treePredictRow21(node,row){ if(node.leaf) return node.mean; var v=row[node.fi]; return v<=node.thresh?treePredictRow21(node.left,row):treePredictRow21(node.right,row); }
  function countLeaves21(n){ return n.leaf?1:countLeaves21(n.left)+countLeaves21(n.right); }
  function sumGainByFeat21(n,acc){ acc=acc||[0,0,0,0]; if(n.leaf) return acc; acc[n.fi]+=n.gain; sumGainByFeat21(n.left,acc); sumGainByFeat21(n.right,acc); return acc; }

  var TREE_MINLEAF21=4, TREE_MAXDEPTH21=4, BAG_B21=12;
  function fitTree21(idxs){ return buildTree21(idxs,TREE_MINLEAF21,TREE_MAXDEPTH21,0); }
  function fitBag21(idxs){
    var rng=LCG(20260728), trees=[];
    for(var b=0;b<BAG_B21;b++){
      var bs=[]; for(var t=0;t<idxs.length;t++) bs.push(idxs[Math.floor(rng()*idxs.length)]);
      trees.push(buildTree21(bs,TREE_MINLEAF21,TREE_MAXDEPTH21,0));
    }
    return trees;
  }
  function predBag21(trees,i){ var s=0; for(var t=0;t<trees.length;t++) s+=treePredict21(trees[t],i); return s/trees.length; }
  function predRowBag21(trees,row){ var s=0; for(var t=0;t<trees.length;t++) s+=treePredictRow21(trees[t],row); return s/trees.length; }
  function bagSpreadAtRow21(trees,row){
    var preds=trees.map(function(t){ return treePredictRow21(t,row); });
    return {mean:mean(preds), sd:sampStd(preds), preds:preds};
  }

  var MODEL_DEFS21=[
    {key:'ols',  label:'선형회귀(공학적 특징)', color:BLU, fit:fitOLS21,  pred:predOLS21},
    {key:'tree', label:'회귀나무',              color:GRN, fit:fitTree21, pred:treePredict21},
    {key:'bag',  label:'배깅앙상블',            color:RED, fit:fitBag21,  pred:predBag21}
  ];
  var ORDER21=MODEL_DEFS21.map(function(m){return m.key;});
  function labelOf21(key){ return MODEL_DEFS21.filter(function(m){return m.key===key;})[0].label; }
  function colorOf21(key){ return MODEL_DEFS21.filter(function(m){return m.key===key;})[0].color; }

  // ══════════ 21.1 배합비 제약 + 예측변수-강도 상관관계(실측) ══════════
  var CORR21={
    c: +corr(C21,STR21).toFixed(3),
    wc: +corr(WC21,STR21).toFixed(3),
    s: +corr(S21,STR21).toFixed(3),
    age: +corr(AGE21.map(function(a){return Math.log(1+a);}),STR21).toFixed(3)
  };
  var SUMSTAT21=(function(){
    var sumC=0,i; for(i=0;i<N21;i++) sumC+=C21[i]+S21[i]+W21[i]+AGG21[i];
    return { sumCheck: +(sumC/N21).toFixed(4), aggMin:+Math.min.apply(null,AGG21).toFixed(3), aggMax:+Math.max.apply(null,AGG21).toFixed(3) };
  })();

  // ══════════ 21.2 5-겹 교차검증 실측 ══════════
  var CV21=(function(){
    var res={};
    MODEL_DEFS21.forEach(function(md){
      var foldRMSE=[];
      FOLDS21.forEach(function(f){
        var model=md.fit(f.tr), sse=0;
        f.te.forEach(function(i){ var p=md.pred(model,i); var d=STR21[i]-p; sse+=d*d; });
        foldRMSE.push(Math.sqrt(sse/f.te.length));
      });
      var mn=mean(foldRMSE), sd=sampStd(foldRMSE);
      res[md.key]={folds:foldRMSE, mean:mn, sd:sd, se:sd/Math.sqrt(foldRMSE.length), min:Math.min.apply(null,foldRMSE), max:Math.max.apply(null,foldRMSE)};
    });
    return res;
  })();
  var BEST21=ORDER21.slice().sort(function(a,b){return CV21[a].mean-CV21[b].mean;})[0];
  // 부분의존·최적화·배치 예측은 배깅앙상블을 목적함수로 쓴다 — 선형회귀(BEST21)는 검증 성능은
  // 가장 좋지만 예측면이 완전한 직선/평면이라 격자 탐색에서 훈련 범위 밖으로 끝없이 좋아지는 것처럼
  // 보이는 외삽 위험이 있다. 배깅앙상블은 나무의 평균이라 훈련 범위를 벗어나도 값이 튀지 않는다.
  var OPT_MODEL21='bag';

  // ══════════ 전체 데이터로 학습한 모델(중요도·부분의존·최적화·최종 예측용) ══════════
  var FULL21={}; MODEL_DEFS21.forEach(function(md){ FULL21[md.key]=md.fit(ALLIDX21); });

  // ══════════ 21.3 변수 중요도(트리 분할 이득 누적) + 부분의존(진짜 PD, 전 표본 평균) ══════════
  var IMPORT21=(function(){
    var full=buildTree21(ALLIDX21,3,5,0);
    var gains=sumGainByFeat21(full);
    var total=gains.reduce(function(a,b){return a+b;},0);
    return FNAME21.map(function(nm,fi){ return {name:nm, fi:fi, gain:gains[fi], pct:+(100*gains[fi]/total).toFixed(1)}; }).sort(function(a,b){return b.gain-a.gain;});
  })();
  function predRowByKey21(key,row){
    if(key==='ols') return predRowOLS21(FULL21.ols, row[0],row[1],row[2],row[3]);
    if(key==='tree') return treePredictRow21(FULL21.tree, row);
    return predRowBag21(FULL21.bag, row);
  }
  function pdCurveWC21(model,grid){
    return grid.map(function(wcv){
      var s=0;
      ALLIDX21.forEach(function(i){ var row=[C21[i], S21[i], wcv*C21[i], AGE21[i]]; s+=predRowByKey21(model,row); });
      return s/N21;
    });
  }
  function pdCurveAge21(model,grid){
    return grid.map(function(av){
      var s=0;
      ALLIDX21.forEach(function(i){ var row=[C21[i], S21[i], W21[i], av]; s+=predRowByKey21(model,row); });
      return s/N21;
    });
  }
  var WC_MIN21=Math.min.apply(null,WC21), WC_MAX21=Math.max.apply(null,WC21);
  var AGE_MIN21=Math.min.apply(null,AGE21), AGE_MAX21=Math.max.apply(null,AGE21);

  // ══════════ 21.4 배합 최적화: 격자 탐색(제약을 슬라이더로 조정) ══════════
  function optimizeAt21(cMax, ageFixed){
    var best=null;
    for(var c=0.16; c<=cMax+1e-9; c+=0.02){
      for(var s=0; s<=0.20+1e-9; s+=0.02){
        for(var w=0.10; w<=0.26+1e-9; w+=0.02){
          if(c+s+w>0.85) continue;
          var row=[c,s,w,ageFixed];
          var pred=predRowByKey21(OPT_MODEL21,row);
          if(best===null||pred>best.pred) best={c:+c.toFixed(2), s:+s.toFixed(2), w:+w.toFixed(2), age:ageFixed, pred:pred};
        }
      }
    }
    return best;
  }
  var AGE_STD21=28;

  var scenes=[

  // ══════════ 1. 문제와 데이터 ══════════
  { id:'bda21_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'mix[["c","slag","water","aggregate"]].sum(axis=1)', hl:'.sum(axis=1)'},
        {t:'# 항상 1.0 — 배합비는 서로 독립일 수 없다', dim:true},
        {t:'df["wc_ratio"] = df.water / df.cement', hl:'wc_ratio'},
        {t:'df.corr()["strength"]', hl:'.corr('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'mix_data.py', s.step===0?0:(s.step===2?3:2));
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      var caps=['배합 50건: 시멘트·슬래그·물 비율 + 골재(나머지) = 항상 1.0',
                '재령(양생 일수)이 길수록 강도가 오르지만 뒤로 갈수록 둔해집니다(로그형)',
                '네 변수 모두 강도와 실측 상관계수를 가집니다'];
      ctx.fillText(caps[s.step], W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===0){
        ctx.fillStyle=GLD; ctx.fillText('c+s+w+골재 평균 = '+SUMSTAT21.sumCheck+' (골재 비율 '+SUMSTAT21.aggMin+'~'+SUMSTAT21.aggMax+')', W*0.04, ry+22);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif';
        ctx.fillText('→ 시멘트를 늘리면 슬래그·물·골재 중 누군가는 줄어야 합니다', W*0.04, ry+41);
      } else if(s.step===2){
        [['시멘트비율 c',CORR21.c,BLU],['물-시멘트비 wc',CORR21.wc,RED],['슬래그비율 s',CORR21.s,GRN],['ln(1+재령)',CORR21.age,GLD]].forEach(function(r,ri){
          ctx.fillStyle=r[2]; ctx.fillText(r[0]+' 상관 = '+r[1], W*0.04, ry+22+ri*19);
        });
      }

      var px0=W*0.47, px1=W*0.965, pTop=30, pBot=210;
      function PXa(av){ return px0+((av-AGE_MIN21)/(AGE_MAX21-AGE_MIN21))*(px1-px0); }
      var sMin=Math.min.apply(null,STR21), sMax=Math.max.apply(null,STR21);
      function PYs(v){ return pBot-((v-sMin)/(sMax-sMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('재령(양생 일수) vs 압축강도 — 50건 실측', px0, 18);
      AGE21.forEach(function(av,idx){ ctx.fillStyle=GLD; ctx.globalAlpha=0.75; ctx.beginPath(); ctx.arc(PXa(av),PYs(STR21[idx]),3,0,7); ctx.fill(); ctx.globalAlpha=1; });
      var ageGrid=[]; for(var ag=3; ag<=120; ag+=3) ageGrid.push(ag);
      ctx.strokeStyle=DIM; ctx.lineWidth=1.6; ctx.setLineDash([2,3]); ctx.beginPath();
      var a0=mean(C21), s0=mean(S21), w0=mean(W21);
      ageGrid.forEach(function(av,gi){ var pr=10+55*a0-25*(w0/a0)+60*s0-200*s0*s0+8.5*Math.log(1+av); var xp=PXa(av),yp=PYs(pr); if(gi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); });
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('점선: 평균 배합에서 재령만 바꾼 이론곡선(로그형 체감)', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (배합비 제약 → 재령 효과 → 상관계수)', true);
      E.big('문제와 데이터', '10~19장까지는 특징 몇 개로 하나의 목표값을 예측했다면, 이번 사례 연구는 <b>배합비 자체가 서로 독립일 수 없다</b>는 특수한 제약을 가진 문제입니다. 시멘트·슬래그·물 비율에 골재(나머지) 비율을 더하면 50건 모두에서 실제로 1.0이 됩니다 — 시멘트를 늘리려면 다른 재료의 비율을 줄여야만 합니다. 재령(양생 일수)은 3일에서 120일까지 실측했는데, 압축강도는 재령이 늘수록 오르지만 뒤로 갈수록 상승 폭이 줄어드는 로그형 체감을 보입니다. 물-시멘트비(wc, 물÷시멘트)는 강도와 상관계수 '+CORR21.wc+'로 뚜렷한 음의 관계를 보여, 「물을 시멘트 대비 적게 쓸수록 강해진다」는 현장의 경험칙이 이 데이터에도 그대로 나타납니다.'); }
  },

  // ══════════ 2. 모델 후보 비교 ══════════
  { id:'bda21_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'X = df[["cement","slag","water","age"]]', hl:'"age"'},
        {t:'models = [LinearRegression(),', hl:'LinearRegression'},
        {t:'          DecisionTreeRegressor(max_depth=4),', hl:'DecisionTreeRegressor'},
        {t:'          BaggingRegressor(n_estimators=12)]', hl:'BaggingRegressor'},
        {t:'cross_val_score(m, X, y, cv=5, scoring=\'neg_rmse\')', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_models.py', null);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('선형·비선형(나무)·트리 앙상블 세 후보를 5-겹으로 겨룹니다', W*0.04, ry);
      ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=colorOf21(BEST21); ctx.fillText('1위 '+labelOf21(BEST21)+'  CV RMSE='+CV21[BEST21].mean.toFixed(2)+' ± '+CV21[BEST21].se.toFixed(2), W*0.04, ry+22);
      if(s.step===1){
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('배합비가 서로 얽혀 있어도(§21.1) wc비를 특징에', W*0.04, ry+46);
        ctx.fillText('넣은 선형회귀도 꽤 선전합니다', W*0.04, ry+64);
      }

      var px0=W*0.47, px1=W*0.965, top=44, rowH=64, n=ORDER21.length;
      var maxR=0; ORDER21.forEach(function(k){ if(CV21[k].max>maxR) maxR=CV21[k].max; }); maxR*=1.1;
      function PX(v){ return px0+90+(v/maxR)*(px1-px0-100); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('모델별 검증 RMSE 리샘플링 구간(5폴드)', px0, 18);
      ORDER21.forEach(function(k,ki){
        var y=top+ki*rowH+14, c=CV21[k];
        ctx.fillStyle=colorOf21(k); ctx.font='600 11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(labelOf21(k), px0, y-8);
        ctx.strokeStyle=colorOf21(k); ctx.lineWidth=3; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.moveTo(PX(c.min),y); ctx.lineTo(PX(c.max),y); ctx.stroke(); ctx.globalAlpha=1;
        ctx.fillStyle=colorOf21(k); ctx.beginPath(); ctx.moveTo(PX(c.mean),y-5); ctx.lineTo(PX(c.mean)+5,y); ctx.lineTo(PX(c.mean),y+5); ctx.lineTo(PX(c.mean)-5,y); ctx.closePath(); ctx.fill();
        if(s.step===1){ ctx.fillStyle=colorOf21(k); ctx.globalAlpha=0.85; c.folds.forEach(function(fv,fi){ ctx.beginPath(); ctx.arc(PX(fv), y+((fi%3)-1)*7, 2.2, 0, 7); ctx.fill(); }); ctx.globalAlpha=1; }
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
        ctx.fillText(c.mean.toFixed(2)+' MPa', px1, y-8);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (평균 비교 → 폴드별 분포)', true);
      E.big('모델 후보 비교', '선형회귀(물-시멘트비 같은 공학적 특징을 포함)·회귀나무·배깅앙상블 세 후보를 같은 5-겹 교차검증으로 겨룹니다. 실측 결과 1위는 <b>'+labelOf21(BEST21)+'</b>(CV RMSE='+CV21[BEST21].mean.toFixed(2)+' MPa)입니다. 시멘트·슬래그·물 비율이 서로 얽혀 있는(21.1) 데이터라도, 물-시멘트비 같은 도메인 지식을 특징으로 미리 넣어 주면 단순한 선형회귀도 경쟁력을 가질 수 있습니다 — 반대로 원본 비율만 그대로 넣은 트리 계열은 그런 도메인 지식 없이도 비슷한 성능에 도달합니다. 다음 장면(21.3)에서는 이 모델이 <b>무엇을 근거로</b> 예측하는지 들여다봅니다.'); }
  },

  // ══════════ 3. 무엇이 강도를 좌우하는가 ══════════
  { id:'bda21_03',
    enter:function(E){ var self=this;
      self.s={view:0};
      E.controls('<div class="ctrl"><label>부분의존 곡선 변수</label><input type="range" id="b213v" min="0" max="1" step="1" value="0"><output id="b213vo">물-시멘트비</output></div>');
      E.bind('#b213v','input',function(e){ self.s.view=+e.target.value; document.getElementById('b213vo').textContent=self.s.view===0?'물-시멘트비':'재령(일)'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'imp = tree.feature_importances_    # 분할 이득 누적', hl:'feature_importances_'},
        {t:'for v in grid: X2 = X.copy(); X2[col] = v', hl:'X2[col]'},
        {t:'pdp = model.predict(X2).mean()    # 부분의존', hl:'.mean()'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'importance_pdp.py', s.view===0?1:2);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('변수 중요도(트리 분할 이득 누적, 100%로 정규화)', W*0.04, ry);
      IMPORT21.forEach(function(im,ii){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=[BLU,GRN,RED,GLD][ii];
        ctx.fillText(im.name+'  '+im.pct+'%', W*0.04, ry+22+ii*19);
      });

      var px0=W*0.47, px1=W*0.965, pTop=34, pBot=210;
      var grid, curve, xMin, xMax, xLab, pdModel;
      if(s.view===0){
        grid=[]; for(var g=WC_MIN21; g<=WC_MAX21+1e-9; g+=(WC_MAX21-WC_MIN21)/16) grid.push(g);
        pdModel='ols'; curve=pdCurveWC21(pdModel,grid); xMin=WC_MIN21; xMax=WC_MAX21; xLab='물-시멘트비(wc)';
      } else {
        grid=[]; for(var g2=AGE_MIN21; g2<=AGE_MAX21+1e-9; g2+=(AGE_MAX21-AGE_MIN21)/16) grid.push(g2);
        pdModel='bag'; curve=pdCurveAge21(pdModel,grid); xMin=AGE_MIN21; xMax=AGE_MAX21; xLab='재령(일)';
      }
      var yMin=Math.min.apply(null,curve), yMax=Math.max.apply(null,curve); var pad=(yMax-yMin)*0.15||1; yMin-=pad; yMax+=pad;
      function PX(v){ return px0+((v-xMin)/(xMax-xMin))*(px1-px0); }
      function PY(v){ return pBot-((v-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText(xLab+'만 바꿔가며 평균 낸 부분의존 곡선(다른 변수는 실제 훈련값 유지)', px0, 18);
      ctx.strokeStyle=PUR; ctx.lineWidth=2.4; ctx.beginPath();
      grid.forEach(function(gv,gi){ var xp=PX(gv), yp=PY(curve[gi]); if(gi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.fillStyle=PUR; grid.forEach(function(gv,gi){ ctx.beginPath(); ctx.arc(PX(gv),PY(curve[gi]),2.4,0,7); ctx.fill(); });
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('x축: '+xLab+'   y축: '+labelOf21(pdModel)+' 예측 압축강도(MPa)', px0, pBot+22);
      ctx.fillStyle=GLD; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillText((s.view===0?'wc 최소→최대 예측 변화 = ':'재령 최소→최대 예측 변화 = ')+(curve[curve.length-1]-curve[0]).toFixed(2)+' MPa', px0, pBot+42);

      E.tapHint(W/2, H*0.95, '슬라이더로 물-시멘트비 ↔ 재령 부분의존 곡선을 바꿔 보세요', true);
      E.big('무엇이 강도를 좌우하는가', '회귀나무의 분할이 각 변수에서 얻은 SSE 감소량을 전부 더해 100%로 정규화하면, <b>'+IMPORT21[0].name+'</b>가 '+IMPORT21[0].pct+'%로 압도적이고 <b>물비율(원 특징)은 '+IMPORT21[3].pct+'%로 거의 무시됩니다</b> — 나무는 물을 시멘트와 <i>비율로</i> 엮어 보지 못하고 각각 따로 쪼갤 뿐이라, 물-시멘트비라는 관계 자체를 스스로 찾아내지 못하기 때문입니다. 그래서 물-시멘트비의 부분의존 곡선은 그 비율을 직접 학습한 선형회귀 기준으로, 재령의 부분의존 곡선은 비선형을 잡아내는 배깅앙상블 기준으로 각각 확인합니다. 물-시멘트비를 최솟값에서 최댓값까지 쓸어보면 선형회귀의 예측 압축강도가 뚜렷이 낮아져, 「물을 시멘트 대비 덜 쓸수록 강해진다」는 현장 경험칙이 모델 안에도 학습돼 있음을 확인할 수 있습니다. 재령 곡선은 초반엔 가파르게, 뒤로 갈수록 완만하게 오르는 로그형 체감을 보여 21.1에서 본 이론곡선과 같은 모양입니다 — <b>같은 데이터라도 어떤 질문(비율의 효과? 시간의 효과?)이냐에 따라 어느 모델로 물어야 답이 보이는지가 달라집니다.</b>'); }
  },

  // ══════════ 4. 배합 최적화 ══════════
  { id:'bda21_04',
    enter:function(E){ var self=this;
      self.s={cMax:0.30, opt:optimizeAt21(0.30,AGE_STD21)};
      E.controls('<div class="ctrl"><label>시멘트 비율 상한(비용 제약)</label><input type="range" id="b214c" min="0.20" max="0.32" step="0.01" value="0.30"><output id="b214co">0.30</output></div>');
      E.bind('#b214c','input',function(e){ self.s.cMax=+e.target.value; document.getElementById('b214co').textContent=self.s.cMax.toFixed(2); self.s.opt=optimizeAt21(self.s.cMax,AGE_STD21); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, opt=s.opt;
      var code=[
        {t:'for c in arange(0.16, cMax, 0.02):', dim:true},
        {t:'  for s in arange(0, 0.20, 0.02):', dim:true},
        {t:'    for w in arange(0.10, 0.26, 0.02):', dim:true},
        {t:'      if c+s+w <= 0.85:   # 골재 몫 확보', hl:'<= 0.85'},
        {t:'        pred = model.predict([[c,s,w,28]])', hl:'.predict('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'optimize_mix.py', 4);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('시멘트 상한 = '+s.cMax.toFixed(2)+'  (재령 28일 고정, 표준 양생)', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('최적 배합: c='+opt.c.toFixed(2)+' s='+opt.s.toFixed(2)+' w='+opt.w.toFixed(2), W*0.04, ry+22);
      var agg=1-opt.c-opt.s-opt.w;
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('골재 몫 = '+agg.toFixed(2)+'  물-시멘트비 = '+(opt.w/opt.c).toFixed(2), W*0.04, ry+44);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=ROSE;
      ctx.fillText('예측 압축강도 = '+opt.pred.toFixed(2)+' MPa', W*0.04, ry+68);

      var px0=W*0.47, px1=W*0.965, pTop=34, pBot=210;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('시멘트 상한을 바꿀 때 최적 배합·예측강도의 변화(실측)', px0, 18);
      var cs=[]; for(var cc=0.20; cc<=0.32+1e-9; cc+=0.01) cs.push(+cc.toFixed(2));
      var opts=cs.map(function(cv){ return optimizeAt21(cv,AGE_STD21); });
      var yMin=Math.min.apply(null,opts.map(function(o){return o.pred;})), yMax=Math.max.apply(null,opts.map(function(o){return o.pred;}));
      var padY=(yMax-yMin)*0.15||1; yMin-=padY; yMax+=padY;
      function PXc(cv){ return px0+((cv-0.20)/(0.32-0.20))*(px1-px0); }
      function PYp(v){ return pBot-((v-yMin)/(yMax-yMin))*(pBot-pTop); }
      ctx.strokeStyle=GRN; ctx.lineWidth=2.2; ctx.beginPath();
      opts.forEach(function(o,oi){ var xp=PXc(cs[oi]), yp=PYp(o.pred); if(oi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(PXc(s.cMax),PYp(opt.pred),5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('x축: 시멘트 비율 상한(비용 제약)   y축: 그 상한에서 격자 탐색으로 찾은 최고 예측강도', px0, pBot+22);
      ctx.fillText('상한이 낮을수록(왼쪽) 시멘트를 아낀 배합만 허용 — 강도는 대체로 낮아집니다', px0, pBot+41);

      E.tapHint(W/2, H*0.95, '슬라이더로 시멘트 비용 상한을 바꿔 최적 배합이 다시 계산되는 것을 보세요', true);
      E.big('배합 최적화', '지금까지 만든 모델을 <b>목적함수</b>로 삼아, 「이 조건에서 압축강도를 최대로 만드는 배합이 무엇인가」를 거꾸로 찾습니다. 시멘트·슬래그·물 비율을 0.02 간격 격자로 촘촘히 훑되, 세 비율의 합이 0.85를 넘지 않도록(골재 몫을 최소 0.15 남기도록) 제약을 걸고, 재령은 표준 양생 기준인 28일로 고정합니다. 시멘트 비율 상한(비용·재료 제약의 대리 지표) 슬라이더를 '+s.cMax.toFixed(2)+'로 두면 최적 배합은 <b>c='+opt.c.toFixed(2)+', s='+opt.s.toFixed(2)+', w='+opt.w.toFixed(2)+'</b>(예측 강도 '+opt.pred.toFixed(1)+' MPa)로 실제로 재계산됩니다. 상한을 낮추면(비용을 더 아끼면) 격자 탐색이 매번 다시 돌아 최적 배합과 예측강도가 함께 낮아지는 것을 확인할 수 있습니다 — 「좋은 배합」은 강도만이 아니라 주어진 제약 안에서 최선을 찾는 문제입니다.'); }
  },

  // ══════════ 5. 결과를 현장으로 ══════════
  { id:'bda21_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var opt=optimizeAt21(0.30,AGE_STD21);
      var row=[opt.c,opt.s,opt.w,opt.age];
      var spread=bagSpreadAtRow21(FULL21.bag,row);
      var inRange=function(v,arr){ return v>=Math.min.apply(null,arr) && v<=Math.max.apply(null,arr); };
      var checks=[
        {name:'시멘트비율 c', ok:inRange(opt.c,C21), v:opt.c},
        {name:'슬래그비율 s', ok:inRange(opt.s,S21), v:opt.s},
        {name:'물비율 w', ok:inRange(opt.w,W21), v:opt.w},
        {name:'재령 age', ok:inRange(opt.age,AGE21), v:opt.age}
      ];
      var allIn=checks.every(function(c){return c.ok;});
      var code=[
        {t:'pred_ensemble = [t.predict(mix) for t in trees]', hl:'trees'},
        {t:'uncertainty = std(pred_ensemble)', hl:'std('},
        {t:'in_range = all(lo[j] <= mix[j] <= hi[j] for j in cols)', hl:'in_range'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'deploy_check.py', s.step);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GRN; ctx.fillText('배합 c='+opt.c.toFixed(2)+' s='+opt.s.toFixed(2)+' w='+opt.w.toFixed(2)+' age='+opt.age, W*0.04, ry);
      if(s.step>=0){ ctx.fillStyle=ROSE; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText('예측 압축강도 = '+opt.pred.toFixed(2)+' MPa', W*0.04, ry+22); }
      if(s.step>=1){
        ctx.fillStyle=GLD; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('나무 '+BAG_B21+'그루 예측 표준편차 = ±'+spread.sd.toFixed(2)+' MPa', W*0.04, ry+46);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('(앙상블 나무마다 예측이 다른 정도 = 이 배합의 불확실성)', W*0.04, ry+65);
      }
      if(s.step>=2){
        ctx.fillStyle=allIn?GRN:RED; ctx.font='600 12px sans-serif';
        ctx.fillText(allIn?'네 변수 모두 훈련 범위 안 — 외삽 위험 낮음':'훈련 범위를 벗어난 변수 있음 — 외삽 주의', W*0.04, ry+88);
      }

      var px0=W*0.47, px1=W*0.965, top=44, rowH=38;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('배합 변수별 훈련 데이터 범위 vs 최적 배합 값', px0, 18);
      var ranges=[['c',C21,opt.c],['s',S21,opt.s],['w',W21,opt.w],['age',AGE21,opt.age]];
      ranges.forEach(function(r,ri){
        var nm=r[0], arr=r[1], v=r[2];
        var mn=Math.min.apply(null,arr), mx=Math.max.apply(null,arr);
        var y=top+ri*rowH+10;
        ctx.fillStyle=TXT; ctx.font='600 11.5px sans-serif'; ctx.fillText(nm, px0, y+4);
        var bx0=px0+50, bx1=px1-10;
        ctx.strokeStyle=DIM; ctx.lineWidth=4; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.moveTo(bx0,y); ctx.lineTo(bx1,y); ctx.stroke(); ctx.globalAlpha=1;
        function PXv(vv){ return bx0+((vv-mn)/(mx-mn))*(bx1-bx0); }
        var inr = v>=mn && v<=mx;
        ctx.fillStyle = (s.step>=2) ? (inr?GRN:RED) : ROSE;
        ctx.beginPath(); ctx.arc(PXv(Math.max(mn,Math.min(mx,v))),y,5,0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
        ctx.fillText(mn.toFixed(2)+'~'+mx.toFixed(2), bx1, y-8);
        ctx.textAlign='left';
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (예측값 → 불확실성 → 외삽 위험 점검)', true);
      E.big('결과를 현장으로', '21.4에서 찾은 최적 배합(c='+opt.c.toFixed(2)+', s='+opt.s.toFixed(2)+', w='+opt.w.toFixed(2)+', 재령 '+opt.age+'일)의 예측 압축강도는 <b>'+opt.pred.toFixed(1)+' MPa</b>입니다. 하지만 예측값 하나만 현장에 넘기면 위험합니다 — 배깅앙상블의 나무 '+BAG_B21+'그루가 이 배합에 대해 내놓은 예측들의 표준편차(±'+spread.sd.toFixed(2)+' MPa)를 <b>불확실성</b>으로 함께 보고해야 합니다. 마지막으로 이 배합의 네 변수가 훈련 데이터가 실제로 관측한 범위 안에 있는지 점검하면, '+(allIn?'모두 범위 안에 있어 외삽 위험이 낮습니다':'일부 변수가 범위를 벗어나 있어 외삽 위험을 주의해야 합니다')+' — 모델이 한 번도 보지 못한 조합에 대한 예측은 아무리 정교한 모델이라도 신뢰도가 떨어집니다. 여기까지가 회귀 모델로 예측하고 최적화하는 여정입니다 — 다음 파트부터는 목표값이 숫자가 아니라 <b>범주(합격/불합격, 클래스)</b>인 분류 모델로 넘어갑니다.'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
