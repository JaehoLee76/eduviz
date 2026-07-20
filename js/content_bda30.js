/* 빅데이터 분석 제30장 — 특징 선택 (필터·래퍼·선택 편향, 사례: 인지 상태 예측)
   동작(behavior)만. 텍스트=content/bda30.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(정확도·카파·선택된 변수 수·판별 점수·상관계수)는 아래 고정 배열로부터
   이 파일 로드 시 실제 계산(하드코딩 금지). 분류기는 표준화 특징 위의 kNN(k=5, 유클리드 거리)과
   로지스틱 회귀(경사하강)를 실제로 학습·평가한다. 난수(Math.random) 절대 금지 — 표본·초기화는
   고정 시드 LCG. */
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
  function corr(x,y){ var mx=mean(x), my=mean(y), sxy=0,sxx=0,syy=0,i; for(i=0;i<x.length;i++){ var dx=x[i]-mx, dy=y[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; } return sxy/Math.sqrt(sxx*syy); }
  function range(a,b){ var r=[]; for(var i=a;i<b;i++) r.push(i); return r; }

  // ══════════ 고정 데이터: 임상 지원자 110명 — 인지 상태(0=정상,1=저하) ══════════
  var N30=110;
  var S1_30=[], S2_30=[], S3_30=[], W1_30=[], W2_30=[], Y30=[];
  (function(){
    var rng=LCG(20260930);
    for(var i=0;i<N30;i++){
      var lat=0.9*Math.sin(i*0.29)+0.6*Math.cos(i*0.15)+(rng()-0.5)*1.4;
      var s1=lat*1.1+(rng()-0.5)*1.0, s2=lat*0.9+(rng()-0.5)*1.2, s3=-lat*0.7+(rng()-0.5)*1.3;
      var w1=lat*0.35+(rng()-0.5)*2.0, w2=lat*0.30+(rng()-0.5)*2.2;
      var p=sigmoid(lat*1.3-0.1);
      var y=(rng()<p)?1:0;
      S1_30.push(+s1.toFixed(3)); S2_30.push(+s2.toFixed(3)); S3_30.push(+s3.toFixed(3));
      W1_30.push(+w1.toFixed(3)); W2_30.push(+w2.toFixed(3)); Y30.push(y);
    }
  })();
  // 실험 후보 생체지표 30개(전부 순수 잡음 — 진짜 신호와 무관)
  var NOISE30=[];
  (function(){
    var rng2=LCG(19770604), NNOISE=30;
    for(var k=0;k<NNOISE;k++){ var col=[]; for(var i=0;i<N30;i++) col.push(+((rng2()-0.5)*3).toFixed(3)); NOISE30.push(col); }
  })();
  var FNAME30=['생체지표1(강)','생체지표2(강)','생체지표3(강)','인구통계(약)','병력점수(약)'];
  for(var _k30=0;_k30<NOISE30.length;_k30++) FNAME30.push('후보'+(_k30+1));
  var FEATS30=[S1_30,S2_30,S3_30,W1_30,W2_30].concat(NOISE30);
  var P30=FEATS30.length;   // 35
  var POS30=Y30.filter(function(v){return v===1;}).length;

  var MEANS30=[], STDS30=[], FEATSs30=[];
  for(var j30=0;j30<P30;j30++){ var m30=mean(FEATS30[j30]), s30=std(FEATS30[j30]); MEANS30.push(m30); STDS30.push(s30); FEATSs30.push(FEATS30[j30].map(function(v){return (v-m30)/s30;})); }

  function dist2(idxs,a,b){ var s=0; for(var t=0;t<idxs.length;t++){ var jj=idxs[t]; var d=FEATSs30[jj][a]-FEATSs30[jj][b]; s+=d*d; } return s; }
  function knnPredAll(idxs,y,k,folds,off){
    var n=y.length, preds=new Array(n);
    for(var f=0;f<folds;f++){
      var trainIdx=[], testIdx=[];
      for(var i=0;i<n;i++){ if((i+(off||0))%folds===f) testIdx.push(i); else trainIdx.push(i); }
      testIdx.forEach(function(ti){
        if(idxs.length===0){ var c1=trainIdx.filter(function(i){return y[i]===1;}).length; preds[ti]=(c1*2>=trainIdx.length)?1:0; return; }
        var ds=trainIdx.map(function(tr){ return {i:tr, d:dist2(idxs,ti,tr)}; });
        ds.sort(function(a,b){return a.d-b.d;});
        var votes=0; for(var t=0;t<k && t<ds.length;t++) votes+=y[ds[t].i];
        preds[ti]=votes*2>=Math.min(k,ds.length)?1:0;
      });
    }
    return preds;
  }
  function accKappa(preds,y){
    var n=preds.length, TP=0,FP=0,TN=0,FN=0;
    preds.forEach(function(pred,i){ var act=y[i];
      if(pred===1&&act===1)TP++; else if(pred===1&&act===0)FP++; else if(pred===0&&act===0)TN++; else FN++; });
    var Po=(TP+TN)/n, predPos=TP+FP,predNeg=TN+FN,actPos=TP+FN,actNeg=TN+FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po, kappa:(Po-Pe)/(1-Pe)};
  }
  function knnCVAccOffset(idxs,y,k,folds,off){ var ak=accKappa(knnPredAll(idxs,y,k,folds,off), y); return ak.acc; }
  function knnCVAcc(idxs,y,k,folds,reps){ reps=reps||1; var s=0; for(var r=0;r<reps;r++) s+=knnCVAccOffset(idxs,y,k,folds,r); return s/reps; }

  // ── 로지스틱 회귀(경사하강, 표준화 특징) ──────────────
  function logregGD(feats,y,lr,iters){
    var p=feats[0].length, n=y.length, w=new Array(p).fill(0), b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0), gb=0;
      for(var i=0;i<n;i++){ var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j]; var pr=sigmoid(z), err=pr-y[i];
        for(j=0;j<p;j++) gw[j]+=err*feats[i][j]; gb+=err; }
      for(j=0;j<p;j++) w[j]-=lr*(gw[j]/n); b-=lr*(gb/n);
    }
    return {w:w,b:b};
  }
  function buildRows(idxs){ var rows=[]; for(var i=0;i<N30;i++){ var row=[]; for(var t=0;t<idxs.length;t++) row.push(FEATSs30[idxs[t]][i]); rows.push(row); } return rows; }
  function logregCVAcc(idxs,folds,off,iters){
    if(idxs.length===0){ var maj=(POS30*2>=N30)?1:0; var c=0; for(var i=0;i<N30;i++) if(Y30[i]===maj) c++; return c/N30; }
    var rows=buildRows(idxs), correct=0;
    for(var f=0; f<folds; f++){
      var trIdx=[], teIdx=[];
      for(var i=0;i<N30;i++){ if((i+off)%folds===f) teIdx.push(i); else trIdx.push(i); }
      var trX=trIdx.map(function(i){return rows[i];}), trY=trIdx.map(function(i){return Y30[i];});
      var m=logregGD(trX,trY,0.3,iters);
      teIdx.forEach(function(i){ var z=m.b; for(var t=0;t<idxs.length;t++) z+=m.w[t]*rows[i][t]; var pred=sigmoid(z)>0.5?1:0; if(pred===Y30[i]) correct++; });
    }
    return correct/N30;
  }
  function logregCVAccRep(idxs,folds,reps,iters){ var s=0; for(var r=0;r<reps;r++) s+=logregCVAcc(idxs,folds,r,iters); return s/reps; }

  // ══════════ 1절: 잡음 후보 변수를 늘릴수록(로지스틱 회귀, 파라미터가 있는 모델) 정확도 실측 ══════════
  var BASE_IDX30=[0,1,2,3,4];
  var NOISE_LEVELS30=[0,6,12,18,24,30];
  var ACC_BY_NOISE30 = NOISE_LEVELS30.map(function(nz){ return logregCVAccRep(BASE_IDX30.concat(range(5,5+nz)), 5, 5, 350); });

  // ══════════ 2절: 필터(|피어슨 상관|) — 임계값에 따른 선택 변수 수·정확도 ══════════
  var SCORE30=[]; for(j30=0;j30<P30;j30++) SCORE30.push(Math.abs(corr(FEATS30[j30],Y30)));
  var SCORE_MAX30 = Math.max.apply(null,SCORE30);
  var SCORE_ORDER30 = range(0,P30).slice().sort(function(a,b){return SCORE30[b]-SCORE30[a];});

  // ══════════ 3절: 래퍼(전진 선택) — 8단계 그리디 탐색을 실제로 수행 ══════════
  var FWD_STEPS30 = (function(){
    var selected=[], remaining=range(0,P30), steps=[];
    for(var step=0; step<8; step++){
      var best=null, bestAcc=-1;
      remaining.forEach(function(cand){
        var acc=knnCVAcc(selected.concat([cand]),Y30,5,5,1);
        if(acc>bestAcc){ bestAcc=acc; best=cand; }
      });
      selected.push(best); remaining=remaining.filter(function(v){return v!==best;});
      steps.push({idx:best, name:FNAME30[best], acc:bestAcc, sel:selected.slice()});
    }
    return steps;
  })();
  var FWD_BASE30 = knnCVAcc([],Y30,5,5,1);

  // ══════════ 4절: 선택 편향 — 개선(전체 데이터로 선택) vs 정직(폴드 안에서 선택) ══════════
  var SHUF_Y30 = (function(){
    var rng=LCG(20261207), y=Y30.slice();
    for(var i=y.length-1;i>0;i--){ var jx=Math.floor(rng()*(i+1)); var tmp=y[i]; y[i]=y[jx]; y[jx]=tmp; }
    return y;
  })();
  function topKIdx(idxList,yArr,k){
    var scored=[]; for(var j=0;j<P30;j++){ var xs=idxList.map(function(i){return FEATS30[j][i];}); scored.push({j:j,s:Math.abs(corr(xs,yArr))}); }
    scored.sort(function(a,b){return b.s-a.s;});
    return scored.slice(0,k).map(function(o){return o.j;});
  }
  function improperAcc(yArr,reps){
    var sel=topKIdx(range(0,N30),yArr,5), s=0;
    for(var r=0;r<reps;r++) s+=knnCVAccOffset(sel,yArr,5,5,r);
    return s/reps;
  }
  function correctAcc(yArr,reps){
    var s=0;
    for(var r=0;r<reps;r++){
      var folds=5, correct=0;
      for(var f=0; f<folds; f++){
        var trainIdx=[], testIdx=[];
        for(var i=0;i<N30;i++){ if((i+r)%folds===f) testIdx.push(i); else trainIdx.push(i); }
        var yTrain=trainIdx.map(function(i){return yArr[i];});
        var sel=topKIdx(trainIdx,yTrain,5);
        testIdx.forEach(function(ti){
          var ds=trainIdx.map(function(tr){ return {i:tr, d:dist2(sel,ti,tr)}; });
          ds.sort(function(a,b){return a.d-b.d;});
          var votes=0; for(var t=0;t<5 && t<ds.length;t++) votes+=yArr[ds[t].i];
          var pred=votes*2>=Math.min(5,ds.length)?1:0;
          if(pred===yArr[ti]) correct++;
        });
      }
      s+=correct/N30;
    }
    return s/reps;
  }
  var BIAS_REPS30=6;
  var IMPROPER_REAL30=improperAcc(Y30,BIAS_REPS30), CORRECT_REAL30=correctAcc(Y30,BIAS_REPS30);
  var IMPROPER_SHUF30=improperAcc(SHUF_Y30,BIAS_REPS30), CORRECT_SHUF30=correctAcc(SHUF_Y30,BIAS_REPS30);

  // ══════════ 5절: 사례 종합 — 4가지 변수집합을 같은 기준으로 비교 ══════════
  var FILTER_TAU30=0.2;
  var FILTER_IDX30=[]; for(j30=0;j30<P30;j30++) if(SCORE30[j30]>=FILTER_TAU30) FILTER_IDX30.push(j30);
  var WRAP_IDX30 = FWD_STEPS30.slice(0,6).map(function(s){return s.idx;});
  var FULL_IDX30 = range(0,P30);
  function finalReport(idxs){ return accKappa(knnPredAll(idxs,Y30,5,5,0), Y30); }
  var CASE30 = {
    clin: finalReport(BASE_IDX30),
    filt: finalReport(FILTER_IDX30),
    wrap: finalReport(WRAP_IDX30),
    full: finalReport(FULL_IDX30)
  };

  var scenes = [

  // ══════════ 1. 변수를 줄여야 하는 이유 ══════════
  { id:'bda30_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%NOISE_LEVELS30.length; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.linear_model import LogisticRegression', hl:'LogisticRegression'},
        {t:'X_ext = np.hstack([X_clinical, X_candidate[:, :k]])', hl:'X_ext'},
        {t:'acc = cross_val_score(clf, X_ext, y, cv=5).mean()', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'add_candidates.py', 1);
      var nz=NOISE_LEVELS30[s.step], acc=ACC_BY_NOISE30[s.step], base=ACC_BY_NOISE30[0];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('임상변수 5개 + 실험 후보 '+nz+'개 = 총 '+(5+nz)+'개', W*0.04, ry);
      ctx.fillStyle=(acc>=base-0.005)?GRN:RED; ctx.fillText('5겹 교차검증 정확도 = '+acc.toFixed(3), W*0.04, ry+22);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('임상변수만(후보 0개) 정확도 '+base.toFixed(3)+' 대비 '+((acc-base)>=0?'+':'')+(acc-base).toFixed(3), W*0.04, ry+44);
      ctx.fillText('로지스틱 회귀는 변수마다 계수를 하나씩 추정 — 후보가 늘수록 추정이 불안정해집니다', W*0.04, ry+64);

      var bx0=W*0.49, bx1=W*0.965, by0=40, bh=190, bw=(bx1-bx0)/NOISE_LEVELS30.length;
      var yMax=0.8;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      var baseY=by0+bh-(base/yMax)*bh;
      ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(bx0,baseY); ctx.lineTo(bx1,baseY); ctx.stroke(); ctx.setLineDash([]);
      NOISE_LEVELS30.forEach(function(nzv,i){
        var h=(ACC_BY_NOISE30[i]/yMax)*bh;
        var bxp=bx0+i*bw+bw*0.18, bwid=bw*0.64;
        ctx.fillStyle=(i===s.step)?ROSE:'rgba(122,184,255,0.55)';
        ctx.fillRect(bxp, by0+bh-h, bwid, h);
        if(i===s.step){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.strokeRect(bxp-2, by0+bh-h-2, bwid+4, h+4); }
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(nzv), bxp+bwid/2, by0+bh+16);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('추가한 실험 후보 변수 수 → 5겹 교차검증 정확도 (점선=후보 0개 기준선)', bx0, by0-8);

      E.tapHint(W/2, H*0.95, '화면 탭 = 후보 변수를 0개에서 30개까지 늘려보기', true);
      E.big('변수를 줄여야 하는 이유', '병원의 인지 상태 예측 모델에는 이미 알려진 임상변수 5개(생체지표 3개 + 인구통계·병력 2개)가 있습니다. 여기에 아직 검증되지 않은 실험 후보 생체지표를 최대 30개까지 추가하면 어떻게 될까요? 실제로 로지스틱 회귀를 학습시켜 보면, 후보를 0개에서 30개까지 늘리는 동안 5겹 교차검증 정확도는 '+ACC_BY_NOISE30[0].toFixed(3)+'에서 '+ACC_BY_NOISE30[NOISE_LEVELS30.length-1].toFixed(3)+' 부근까지 떨어집니다 — 이 후보들이 전부 진짜 신호와 무관한(잡음) 변수이기 때문입니다. 회귀 계수가 있는 모델은 변수 하나하나의 값을 추정해야 하므로, 쓸모없는 변수가 늘수록 추정이 흔들리고 예측이 나빠집니다. 여기에 더해 변수가 많아질수록 해석은 어려워지고, 검사 하나하나에 드는 비용·채혈량·환자 부담도 함께 늘어납니다 — 특징 선택이 필요한 이유입니다.'); }
  },

  // ══════════ 2. 필터 방식 — 모델과 무관하게 관련성으로 걸러내기 ══════════
  { id:'bda30_02',
    enter:function(E){ var self=this;
      self.s={tau:0.1};
      E.controls('<div class="ctrl"><label>관련성 임계값 τ</label><input type="range" id="b302t" min="0" max="0.35" step="0.01" value="0.10"><output id="b302to">0.10</output></div>');
      E.bind('#b302t','input',function(e){ self.s.tau=+e.target.value; document.getElementById('b302to').textContent=self.s.tau.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'scores = [abs(pearsonr(X[:,j], y)[0]) for j in cols]', hl:'pearsonr'},
        {t:'keep = [j for j in cols if scores[j] >= tau]', hl:'keep'},
        {t:'acc = cross_val_score(knn, X[:, keep], y, cv=5).mean()', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'filter_select.py', 1);
      var sel=[]; for(var j=0;j<P30;j++) if(SCORE30[j]>=s.tau) sel.push(j);
      var acc = sel.length? knnCVAcc(sel,Y30,5,5,3) : null;
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('τ='+s.tau.toFixed(2)+'  선택된 변수 = '+sel.length+'/'+P30, W*0.04, ry);
      if(acc!=null){ ctx.fillStyle=(acc>0.62)?GRN:BLU; ctx.fillText('5겹 교차검증 정확도 = '+acc.toFixed(3), W*0.04, ry+22); }
      else { ctx.fillStyle=RED; ctx.fillText('선택된 변수가 없습니다 — τ를 낮추세요', W*0.04, ry+22); }
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('전체 '+P30+'개(τ=0) 정확도는 잡음까지 끌어안아 낮습니다', W*0.04, ry+44);

      var bx0=W*0.49, bx1=W*0.965, by0=40, bh=180, bw=(bx1-bx0)/P30;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      SCORE_ORDER30.forEach(function(jv,i){
        var h=(SCORE30[jv]/SCORE_MAX30)*bh;
        var selected=SCORE30[jv]>=s.tau;
        ctx.fillStyle = selected ? (jv<3?GRN:(jv<5?GLD:BLU)) : 'rgba(255,255,255,0.14)';
        ctx.fillRect(bx0+i*bw+1, by0+bh-h, Math.max(1,bw-2), h);
      });
      var tauY=by0+bh-(s.tau/SCORE_MAX30)*bh;
      ctx.strokeStyle=RED; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(bx0,tauY); ctx.lineTo(bx1,tauY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='left'; ctx.fillText('τ', bx1+4, tauY+4);
      ctx.fillStyle=TXT; ctx.fillText('변수 35개를 |상관계수| 내림차순으로 나열(초록·금=강신호, 파랑=약신호, 회색=탈락)', bx0, by0-8);

      E.tapHint(W/2, H*0.95, null, false);
      E.big('필터 방식 — 관련성으로 걸러내기', '필터 방식은 어떤 모델을 쓸지 정하기도 전에, 목표(인지 상태)와 각 변수의 관련성만으로 먼저 골라냅니다. 여기서는 |피어슨 상관계수|를 점수로 씁니다. 슬라이더로 임계값 τ를 올리면 선택되는 변수 수가 '+P30+'개에서 실시간으로 줄어들고, 그 부분집합으로 5겹 교차검증 정확도를 다시 계산합니다 — τ=0(전부 사용)일 때는 잡음까지 끌어안아 정확도가 낮고, 적당한 τ에서 정확도가 오릅니다. 다만 필터는 <b>변수 하나하나를 따로따로</b> 평가하므로, 두 변수를 함께 볼 때만 드러나는 상호작용은 놓칩니다 — 계산은 매우 빠르지만 그 대가입니다.'); }
  },

  // ══════════ 3. 래퍼 방식 — 재귀적 제거와 전진 선택 ══════════
  { id:'bda30_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%9; E.blip(360+this.s.step*40,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'selected = []', dim:true},
        {t:'for _ in range(8):', dim:true},
        {t:'    best = max(remaining, key=lambda j: cv_acc(selected+[j]))', hl:'cv_acc'},
        {t:'    selected.append(best)', hl:'append'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'forward_select.py', s.step===0?null:2);
      var ry=codeBot+22;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText('0단계: 아직 아무 변수도 선택 전', W*0.04, ry);
        ctx.fillStyle=BLU; ctx.fillText('다수결 정확도 = '+FWD_BASE30.toFixed(3), W*0.04, ry+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('매 단계 남은 후보 전부를 하나씩 추가해 보고 가장 좋아지는 것을 고릅니다', W*0.04, ry+46);
      } else {
        var cur=FWD_STEPS30[s.step-1];
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText(s.step+'단계: + '+cur.name, W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('5겹 교차검증 정확도 = '+cur.acc.toFixed(3), W*0.04, ry+22);
        var evalCnt=0; for(var t=0;t<s.step;t++) evalCnt+=(P30-t);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('지금까지 (변수 조합→CV) 평가 횟수 = '+evalCnt+'번 — 계산 비용이 큰 이유', W*0.04, ry+46);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=30, bh=190;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.moveTo(bx0,by0); ctx.lineTo(bx0,by0+bh); ctx.stroke();
      var allAcc=[FWD_BASE30].concat(FWD_STEPS30.map(function(s2){return s2.acc;}));
      var yMax=0.8;
      function PX(i){ return bx0+(i/8)*(bx1-bx0); }
      function PY(v){ return by0+bh-(v/yMax)*bh; }
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      allAcc.forEach(function(v,i){ if(i<=s.step){ if(i===0) ctx.moveTo(PX(i),PY(v)); else ctx.lineTo(PX(i),PY(v)); } });
      ctx.stroke();
      allAcc.forEach(function(v,i){ if(i>s.step) return;
        ctx.fillStyle=(i===s.step)?RED:GRN; ctx.beginPath(); ctx.arc(PX(i),PY(v),i===s.step?4.5:3,0,7); ctx.fill(); });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      for(var i=0;i<=8;i+=2) ctx.fillText(String(i), PX(i), by0+bh+16);
      ctx.textAlign='left'; ctx.fillText('선택 단계 → 5겹 교차검증 정확도', bx0, by0-8);

      E.tapHint(W/2, H*0.95, '▶ 화면 탭 = 한 단계씩 변수 추가', true);
      E.big('래퍼 방식 — 전진 선택', '래퍼 방식은 필터와 반대로, 실제 모델(여기서는 kNN)의 교차검증 정확도 그 자체를 잣대로 변수를 고릅니다. <b>전진 선택</b>은 빈 집합에서 시작해, 매 단계마다 아직 선택되지 않은 변수 전부를 하나씩 추가해 보고 정확도가 가장 오르는 것만 채택합니다 — 8단계를 실제로 실행하면 다수결 기준 '+FWD_BASE30.toFixed(3)+'에서 시작해 정확도가 오르내리며 최고 '+Math.max.apply(null,FWD_STEPS30.map(function(s2){return s2.acc;})).toFixed(3)+'까지 오릅니다. 문제는 계산량입니다 — 8단계 동안 실제로 평가한 (변수 조합, 교차검증) 쌍이 252번이나 됩니다. 재귀적 제거(RFE)는 반대로 전체에서 시작해 가장 덜 중요한 변수를 하나씩 빼는 방식으로, 계산 구조는 같지만 방향이 반대입니다. 그런데 눈치채셨나요 — 선택된 변수 중 상당수가 이름이 \'후보\'인 실험 변수입니다. 우연히 이번 데이터에 잘 맞아떨어진 것일 수도 있습니다. 이 의심이 다음 절의 주제입니다.'); }
  },

  // ══════════ 4. ★선택 편향 — 가장 위험한 함정 ══════════
  { id:'bda30_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# 잘못: 전체 데이터로 변수를 고른 뒤 CV', dim:true},
        {t:'sel = top5_by_corr(X, y)', hl:'top5_by_corr'},
        {t:'cross_val_score(knn, X[:, sel], y, cv=5)'},
        {t:'# 올바른: 폴드의 훈련 부분에서만 선택(중첩)', dim:true},
        {t:'for tr, te in KFold(5).split(X):', hl:'KFold(5)'},
        {t:'    sel = top5_by_corr(X[tr], y[tr])'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'selection_bias.py', s.step===0?null:(s.step===1?1:4));
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      if(s.step===0){
        ctx.fillText('변수를 고르는 시점이 CV 안이냐 밖이냐 — 9장 데이터 누수와 같은 함정입니다', W*0.04, ry);
        ctx.fillText('전체 데이터로 top-5 변수를 고르면, 그 변수는 이미 검증용 데이터까지 봤습니다', W*0.04, ry+22);
        ctx.fillText('올바른 절차는 매 폴드마다 훈련 부분에서만 다시 변수를 고릅니다', W*0.04, ry+44);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.fillText('실데이터(진짜 신호가 있는 인지 상태 예측)로 두 절차를 비교합니다', W*0.04, ry);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('잘못(개선 편향) 정확도 = '+IMPROPER_REAL30.toFixed(3), W*0.04, ry+24);
        ctx.fillStyle=GRN; ctx.fillText('올바른(중첩) 정확도 = '+CORRECT_REAL30.toFixed(3), W*0.04, ry+44);
      } else {
        ctx.fillStyle=TXT; ctx.fillText('이번엔 라벨을 완전히 뒤섞어 진짜 신호를 없앤 데이터로 같은 비교를', W*0.04, ry);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('잘못(개선 편향) 정확도 = '+IMPROPER_SHUF30.toFixed(3), W*0.04, ry+24);
        ctx.fillStyle=GRN; ctx.fillText('올바른(중첩) 정확도 = '+CORRECT_SHUF30.toFixed(3), W*0.04, ry+44);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=44, bh=170;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      var chanceY=by0+bh-(0.5/1)*bh;
      ctx.strokeStyle=DIM; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(bx0,chanceY); ctx.lineTo(bx1,chanceY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('우연 수준(0.5)', bx1-84, chanceY-4);
      if(s.step>=1){
        var vals = s.step===1 ? [IMPROPER_REAL30,CORRECT_REAL30] : [IMPROPER_SHUF30,CORRECT_SHUF30];
        var labels=['잘못(개선편향)','올바른(중첩)'];
        var cols=[RED,GRN];
        vals.forEach(function(v,i){
          var h=v*bh, bxp=bx0+(bx1-bx0)*(0.22+i*0.4), bwid=(bx1-bx0)*0.26;
          ctx.fillStyle=cols[i]; ctx.fillRect(bxp, by0+bh-h, bwid, h);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(v.toFixed(3), bxp+bwid/2, by0+bh-h-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(labels[i], bxp+bwid/2, by0+bh+16);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(s.step===1?'실데이터: top-5 변수 선택 절차 비교':'라벨을 섞은 순수 잡음 데이터: 같은 비교', bx0, by0-8);
      } else {
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('[전체 데이터] → [변수선택] → [5겹 CV 평가]  (잘못)', bx0, by0+40);
        ctx.fillText('[5겹 분할] → [훈련 폴드에서만 변수선택] → [해당 폴드 평가]  (올바른)', bx0, by0+70);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 실데이터 → 라벨을 섞은 데이터 순서로', true);
      E.big('★선택 편향 — 가장 위험한 함정', '특징 선택을 교차검증 <b>바깥</b>에서 하면 무슨 일이 벌어질까요? 진짜 신호가 있는 데이터로는 잘못된 절차가 '+IMPROPER_REAL30.toFixed(3)+', 올바른(폴드 안에서 다시 선택하는 중첩) 절차가 '+CORRECT_REAL30.toFixed(3)+'로 그런대로 비슷해 보입니다. 하지만 라벨을 완전히 뒤섞어 <b>진짜로는 아무 신호도 없는</b> 데이터에 똑같은 비교를 해보면 극명하게 갈립니다 — 잘못된 절차는 '+IMPROPER_SHUF30.toFixed(3)+'이라는, 마치 뭔가 예측하는 것처럼 보이는 수치를 냅니다. 전체 데이터로 변수를 고르는 순간 검증용 데이터의 정보가 이미 새어 들어갔기 때문입니다(9장에서 배운 데이터 누수와 같은 함정). 올바른 절차는 '+CORRECT_SHUF30.toFixed(3)+'로 우연 수준(0.5)에 훨씬 가깝게 떨어집니다 — 이것이 정상입니다. <b>특징 선택은 반드시 리샘플링 절차 안에 넣어야</b> 한다는 것이 이 장 전체에서 가장 중요한 교훈입니다.'); }
  },

  // ══════════ 5. 사례: 인지 상태 예측 ══════════
  { id:'bda30_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"methods = {'임상변수':clin, '필터':filt,", dim:true},
        {t:"           '래퍼':wrap, '전체':full}", dim:true},
        {t:'for name, idx in methods.items():', dim:true},
        {t:'    acc, kappa = evaluate_cv(X[:, idx], y)', hl:'evaluate_cv'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_selection.py', 3);
      var names=['임상변수만(5)','필터(τ=.2,'+FILTER_IDX30.length+')','래퍼(전진6)','전체('+P30+')'];
      var keys=['clin','filt','wrap','full'];
      var cols=[BLU,GRN,GLD,PUR];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('5겹 교차검증(단일 분할) — 22장의 정확도·카파로 비교', W*0.04, ry);
      var shown=Math.min(s.step+1,4);
      for(var k=0;k<shown;k++){
        var r=CASE30[keys[k]];
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[k];
        ctx.fillText(names[k]+'  정확도='+r.acc.toFixed(3)+'  κ='+r.kappa.toFixed(3), W*0.04, ry+20+k*19);
      }
      if(shown===4){
        ctx.font='11px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('→ 하지만 이 수치들도 변수를 고른 뒤 그 위에서 평가한 것', W*0.04, ry+20+4*19+8);
        ctx.fillText('4절의 중첩 절차로 다시 재면 정확도는 '+IMPROPER_REAL30.toFixed(3)+' → '+CORRECT_REAL30.toFixed(3)+'로 낮아집니다', W*0.04, ry+20+4*19+26);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=32, bh=200, bw=(bx1-bx0)/4*0.62, gap=(bx1-bx0)/4;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('정확도(연한색) vs 카파(진한색)', bx0, by0-8);
      for(k=0;k<shown;k++){
        var r2=CASE30[keys[k]];
        var hAcc=r2.acc*bh, hKap=Math.max(0,r2.kappa)*bh;
        var xk=bx0+k*gap+gap*0.12;
        ctx.fillStyle=cols[k]; ctx.globalAlpha=0.35; ctx.fillRect(xk, by0+bh-hAcc, bw*0.42, hAcc); ctx.globalAlpha=1;
        ctx.fillStyle=cols[k]; ctx.fillRect(xk+bw*0.46, by0+bh-hKap, bw*0.42, hKap);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(names[k], xk+bw*0.44, by0+bh+16);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 방법을 하나씩 추가해 비교', true);
      E.big('사례: 인지 상태 예측', '지금까지 배운 필터·래퍼와 비교 기준(임상변수만·전체 미선택)을 같은 '+N30+'명의 데이터에 5겹 교차검증으로 나란히 놓습니다. 임상변수 5개만 쓰면 정확도 '+CASE30.clin.acc.toFixed(3)+'(κ='+CASE30.clin.kappa.toFixed(3)+')로 신호가 약하고, 실험 후보 '+P30+'개를 전부 넣으면 오히려 '+CASE30.full.acc.toFixed(3)+'로 떨어집니다. 필터(τ=0.2, '+FILTER_IDX30.length+'개 선택)는 '+CASE30.filt.acc.toFixed(3)+'(κ='+CASE30.filt.kappa.toFixed(3)+')로 크게 개선되고, 래퍼(전진 선택 6개)는 겉보기 정확도 '+CASE30.wrap.acc.toFixed(3)+'(κ='+CASE30.wrap.kappa.toFixed(3)+')로 가장 높습니다. 그런데 4절에서 배운 대로, 변수를 고르고 그 위에서 평가한 이 수치들은 낙관적으로 부풀려져 있을 수 있습니다 — 같은 원리를 적용해 정직하게 다시 재면 정확도가 '+IMPROPER_REAL30.toFixed(3)+'에서 '+CORRECT_REAL30.toFixed(3)+'로 낮아집니다. <b>최종 선택은 가장 화려한 숫자가 아니라, 리샘플링 절차 전체를 정직하게 통과한 숫자를 기준으로</b> 삼아야 한다는 것이 이 장의 결론입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
