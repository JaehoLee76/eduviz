/* 빅데이터 분석 제27장 — 클래스 불균형 처리 (사례: 가입 예측)
   동작(behavior)만. 텍스트=content/bda27.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(더미 분류기 정확도·카파·민감도·혼동행렬·기대비용·SMOTE 보간점·
   언더/오버샘플링 후 교차검증 성능·가중 로지스틱 경계)는 아래 고정 배열로부터 이 파일 로드 시
   실제 계산(하드코딩 금지). 로지스틱은 경사하강(가중 버전 포함)을 직접 구현하고, SMOTE는 소수
   클래스 안에서 실제 k-최근접 이웃을 찾아 선분 위 보간점을 계산해 그린다.
   난수(Math.random) 절대 금지 — 표본·가중치 초기화·SMOTE 보간 비율·폴드 분할은 고정 시드 LCG. */
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

  // ══════════ 고정 데이터: 가입 예측 240건 — 관심도(x1)·과거반응(x2) → 가입여부(y, 드문 사건) ══════════
  var N27=240, X1_27=[], X2_27=[], Y27=[];
  (function(){
    var rng=LCG(20260920);
    for(var i=0;i<N27;i++){
      var x1=1+9*rng(), x2=1+9*rng();
      var z=0.55*x1+0.5*x2-10.0;
      var p=sigmoid(z);
      var y=(rng()<p)?1:0;
      X1_27.push(+x1.toFixed(2)); X2_27.push(+x2.toFixed(2)); Y27.push(y);
    }
  })();
  var mX1_27=mean(X1_27), sX1_27=std(X1_27), mX2_27=mean(X2_27), sX2_27=std(X2_27);
  var X1s_27=X1_27.map(function(v){return (v-mX1_27)/sX1_27;});
  var X2s_27=X2_27.map(function(v){return (v-mX2_27)/sX2_27;});
  var FEATS27=X1s_27.map(function(v,i){return [v,X2s_27[i]];});
  var IDXPOS27=[],IDXNEG27=[]; for(var _i27=0;_i27<N27;_i27++) (Y27[_i27]===1?IDXPOS27:IDXNEG27).push(_i27);
  var POSRATE27=mean(Y27);
  var COSTFN27=20, COSTFP27=1; // 미가입 놓침(FN)이 잘못 연락(FP)보다 20배 비쌈

  // ── 로지스틱 회귀(경사하강, 클래스 가중치 지원) ──────────────────────────
  function logregGDw(feats,y,lr,iters,l2,wPos){
    wPos = wPos||1;
    var p=feats[0].length,n=y.length,w=new Array(p).fill(0),b=0;
    for(var it=0;it<iters;it++){
      var gw=new Array(p).fill(0),gb=0,wsum=0;
      for(var i=0;i<n;i++){
        var z=b; for(var j=0;j<p;j++) z+=w[j]*feats[i][j];
        var pr=sigmoid(z), err=pr-y[i];
        var wi=(y[i]===1)?wPos:1;
        for(j=0;j<p;j++) gw[j]+=wi*err*feats[i][j];
        gb+=wi*err; wsum+=wi;
      }
      for(j=0;j<p;j++) w[j]=w[j]-lr*(gw[j]/wsum+l2*w[j]);
      b=b-lr*(gb/wsum);
    }
    return {w:w,b:b,wPos:wPos};
  }
  function logregPredict(m,xi){ var z=m.b; for(var j=0;j<m.w.length;j++) z+=m.w[j]*xi[j]; return sigmoid(z); }

  var BASE27 = logregGDw(FEATS27, Y27, 0.5, 400, 0.02, 1);
  var PROB27 = FEATS27.map(function(xi){ return logregPredict(BASE27,xi); });

  function confAt(probArr, y, t){
    var TP=0,FP=0,TN=0,FN=0;
    for(var i=0;i<probArr.length;i++){ var pred=probArr[i]>=t?1:0;
      if(pred===1&&y[i]===1)TP++; else if(pred===1&&y[i]===0)FP++; else if(pred===0&&y[i]===0)TN++; else FN++; }
    return {TP:TP,FP:FP,TN:TN,FN:FN};
  }
  function expCost(c){ return c.FN*COSTFN27+c.FP*COSTFP27; }
  function accKappa(c){
    var n=c.TP+c.FP+c.TN+c.FN, Po=(c.TP+c.TN)/n;
    var predPos=c.TP+c.FP, predNeg=c.TN+c.FN, actPos=c.TP+c.FN, actNeg=c.TN+c.FP;
    var Pe=(predPos*actPos+predNeg*actNeg)/(n*n);
    return {acc:Po, kappa:(Po-Pe)/(1-Pe)};
  }

  // 더미 분류기("전부 음성")
  var DUMMY27 = (function(){ var c={TP:0,FP:0,TN:IDXNEG27.length,FN:IDXPOS27.length}; var ak=accKappa(c); return {c:c,acc:ak.acc,kappa:ak.kappa}; })();
  // 훈련된 로지스틱, 기본 임계값 0.5에서의 성능(같은 함정에 빠지는지 확인)
  var BASE_AT_05 = confAt(PROB27, Y27, 0.5);

  // 비용 최소 임계값(0.02~0.98 스윕, 실제 계산)
  function sweepBestThresh(probArr,y){
    var best=null;
    for(var t=0.02;t<=0.98;t+=0.01){
      var c=confAt(probArr,y,t), cost=expCost(c);
      if(!best||cost<best.cost) best={t:t,cost:cost,c:c};
    }
    return best;
  }
  var BEST_T27 = sweepBestThresh(PROB27, Y27);

  // ── 폴드 분할(순열, 고정 시드) ──────────────────────────
  var FOLDS27=5;
  function foldPerm(seed,n,folds){
    var rng=LCG(seed), keys=[]; for(var i=0;i<n;i++) keys.push({i:i,k:rng()});
    keys.sort(function(a,b){return a.k-b.k;});
    var assign=new Array(n); keys.forEach(function(o,pos){ assign[o.i]=pos%folds; });
    return assign;
  }
  var ASSIGN27 = foldPerm(555111, N27, FOLDS27);

  // ── OOF(교차검증 out-of-fold) 확률: 임계값을 held-out 기준으로 정직하게 고르기 위함 ──────────────────────────
  var OOFPROB27 = (function(){
    var prob=new Array(N27);
    for(var f=0;f<FOLDS27;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N27;i++){ if(ASSIGN27[i]===f) teIdx.push(i); else trIdx.push(i); }
      var trFeats=trIdx.map(function(i){return FEATS27[i];}), trY=trIdx.map(function(i){return Y27[i];});
      var m=logregGDw(trFeats,trY,0.5,300,0.02,1);
      teIdx.forEach(function(i){ prob[i]=logregPredict(m,FEATS27[i]); });
    }
    return prob;
  })();
  var BEST_OOF_T27 = sweepBestThresh(OOFPROB27, Y27);

  // ── 언더/오버샘플링·SMOTE ──────────────────────────
  function undersample(negIdx, stride){ var out=[]; for(var i=0;i<negIdx.length;i+=stride) out.push(negIdx[i]); return out; }
  function oversample(posIdx, targetCount){ var out=[]; for(var i=0;i<targetCount;i++) out.push(posIdx[i%posIdx.length]); return out; }
  function smote(minorIdx, X1s, X2s, k, numSynth, seedGap){
    var rngG=LCG(seedGap), out=[];
    for(var s=0;s<numSynth;s++){
      var baseI=minorIdx[s%minorIdx.length], bx=X1s[baseI], by=X2s[baseI];
      var dists=minorIdx.filter(function(j){return j!==baseI;}).map(function(j){ var dx=X1s[j]-bx,dy=X2s[j]-by; return {j:j,d:dx*dx+dy*dy}; });
      dists.sort(function(a,b){return a.d-b.d;});
      var kk=Math.min(k,dists.length), neigh=dists.slice(0,kk), pick=neigh[s%neigh.length];
      var gap=rngG();
      out.push({x:bx+gap*(X1s[pick.j]-bx), y:by+gap*(X2s[pick.j]-by), base:baseI, neigh:pick.j, gap:gap});
    }
    return out;
  }
  // 전체데이터 기준 SMOTE 시연용(시각화 전용, 성능 비교는 CV 내부에서 별도 재계산)
  var SMOTE_DEMO27 = smote(IDXPOS27, X1s_27, X2s_27, 3, 16, 424242);

  // 리샘플링 전략별 5겹 교차검증(각 폴드의 "훈련 구간에만" 리샘플링 적용 — 검증 왜곡 방지)
  function cvStrategy(strategy){
    var predAll=new Array(N27), TPt=0,FPt=0,TNt=0,FNt=0;
    for(var f=0;f<FOLDS27;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N27;i++){ if(ASSIGN27[i]===f) teIdx.push(i); else trIdx.push(i); }
      var trPos=trIdx.filter(function(i){return Y27[i]===1;});
      var trNeg=trIdx.filter(function(i){return Y27[i]===0;});
      var feats=[],labels=[];
      if(strategy==='base'){
        trIdx.forEach(function(i){ feats.push(FEATS27[i]); labels.push(Y27[i]); });
      } else if(strategy==='under'){
        var stride=Math.max(1,Math.round(trNeg.length/trPos.length));
        undersample(trNeg,stride).forEach(function(i){ feats.push(FEATS27[i]); labels.push(0); });
        trPos.forEach(function(i){ feats.push(FEATS27[i]); labels.push(1); });
      } else if(strategy==='over'){
        trNeg.forEach(function(i){ feats.push(FEATS27[i]); labels.push(0); });
        oversample(trPos,trNeg.length).forEach(function(i){ feats.push(FEATS27[i]); labels.push(1); });
      } else if(strategy==='smote'){
        trNeg.forEach(function(i){ feats.push(FEATS27[i]); labels.push(0); });
        trPos.forEach(function(i){ feats.push(FEATS27[i]); labels.push(1); });
        var need=trNeg.length-trPos.length;
        if(need>0) smote(trPos,X1s_27,X2s_27,3,need,900000+f).forEach(function(s){ feats.push([s.x,s.y]); labels.push(1); });
      }
      var m=logregGDw(feats,labels,0.5,300,0.02,1);
      teIdx.forEach(function(i){
        var pr=logregPredict(m,FEATS27[i]), pred=pr>=0.5?1:0;
        predAll[i]=pred;
        if(pred===1&&Y27[i]===1)TPt++; else if(pred===1&&Y27[i]===0)FPt++; else if(pred===0&&Y27[i]===0)TNt++; else FNt++;
      });
    }
    var c={TP:TPt,FP:FPt,TN:TNt,FN:FNt};
    var ak=accKappa(c);
    return {acc:ak.acc,kappa:ak.kappa,c:c,cost:expCost(c)};
  }
  var CV_BASE27=cvStrategy('base'), CV_UNDER27=cvStrategy('under'), CV_OVER27=cvStrategy('over'), CV_SMOTE27=cvStrategy('smote');

  // 비용 민감(가중 로지스틱) 전체데이터 스윕(시각화용) + CV(요약용)
  function cvWeighted(wPos){
    var TPt=0,FPt=0,TNt=0,FNt=0;
    for(var f=0;f<FOLDS27;f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N27;i++){ if(ASSIGN27[i]===f) teIdx.push(i); else trIdx.push(i); }
      var trFeats=trIdx.map(function(i){return FEATS27[i];}), trY=trIdx.map(function(i){return Y27[i];});
      var m=logregGDw(trFeats,trY,0.5,300,0.02,wPos);
      teIdx.forEach(function(i){
        var pr=logregPredict(m,FEATS27[i]), pred=pr>=0.5?1:0;
        if(pred===1&&Y27[i]===1)TPt++; else if(pred===1&&Y27[i]===0)FPt++; else if(pred===0&&Y27[i]===0)TNt++; else FNt++;
      });
    }
    var c={TP:TPt,FP:FPt,TN:TNt,FN:FNt};
    return {c:c,cost:expCost(c)};
  }
  // 최적 wPos(1~30 스윕, 전체데이터 적합 기준으로 대략 탐색 후 CV로 최종 확정)
  var BEST_WPOS27 = (function(){
    var best=null;
    for(var wp=1;wp<=30;wp++){
      var m=logregGDw(FEATS27,Y27,0.5,400,0.02,wp);
      var c=confAt(FEATS27.map(function(xi){return logregPredict(m,xi);}), Y27, 0.5);
      var cost=expCost(c);
      if(!best||cost<best.cost) best={wPos:wp,cost:cost,c:c};
    }
    return best;
  })();
  var CV_WEIGHTED27 = cvWeighted(BEST_WPOS27.wPos);

  var scenes = [

  // ══════════ 1. 드문 사건의 함정 ══════════
  { id:'bda27_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'dummy_pred = [0] * len(y)   # 전부 "미가입"', hl:'[0] * len(y)'},
        {t:'accuracy_score(y, dummy_pred)', hl:'accuracy_score'},
        {t:'cohen_kappa_score(y, dummy_pred)', hl:'cohen_kappa_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'imbalance_trap.py', s.step);
      var ry=codeBot+22;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('가입 '+IDXPOS27.length+'건 / 전체 '+N27+'건 (가입률 '+(POSRATE27*100).toFixed(1)+'%)', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('점 하나하나가 실제 관심도·과거반응 값입니다 — 붉은 점이 거의 안 보입니다', W*0.04, ry+22);
      } else if(s.step===1){
        ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('"전부 미가입" 더미 분류기 정확도 = '+DUMMY27.acc.toFixed(3), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('아무것도 학습하지 않았는데 정확도가 '+(DUMMY27.acc*100).toFixed(1)+'%나 됩니다', W*0.04, ry+22);
      } else {
        ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
        ctx.fillText('카파 = '+DUMMY27.kappa.toFixed(3)+'   민감도 = 0 / '+IDXPOS27.length+' = 0.000', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('실제로 훈련시킨 로지스틱도 기본 임계값 0.5에서는', W*0.04, ry+22);
        ctx.fillText('TP='+BASE_AT_05.TP+' — 똑같이 아무도 못 잡아냅니다(다음 장면 예고)', W*0.04, ry+40);
      }

      var px0=W*0.50, px1=W*0.965, pTop=28, pBot=250;
      var x1max=Math.max.apply(null,X1_27)+0.5, x2max=Math.max.apply(null,X2_27)+0.5;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('관심도 점수(x1)', (px0+px1)/2, pBot+18);
      ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('과거반응 점수(x2)',0,0); ctx.restore();
      IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.5)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2.2,0,7); ctx.fill(); });
      IDXPOS27.forEach(function(i){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),4,0,7); ctx.fill(); });
      ctx.font='11px sans-serif'; ctx.fillStyle=RED; ctx.textAlign='left';
      ctx.fillText('● 가입('+IDXPOS27.length+'건)', px0, pTop+12);
      ctx.fillStyle=DIM; ctx.fillText('● 미가입('+IDXNEG27.length+'건)', px0+90, pTop+12);

      E.tapHint(W/2, H*0.95, '화면 탭 = 더미 분류기 정확도 → 카파로 진실 보기', true);
      E.big('드문 사건의 함정', '가입 예측 데이터 '+N27+'건 중 실제 가입은 겨우 '+IDXPOS27.length+'건('+(POSRATE27*100).toFixed(1)+'%)입니다. 아무것도 배우지 않고 <b>「모두 미가입」</b>이라고만 답하는 더미 분류기조차 정확도 '+DUMMY27.acc.toFixed(3)+'을 냅니다 — 22장에서 배운 카파로 우연 일치를 걷어내면 정확히 '+DUMMY27.kappa.toFixed(3)+'로, 실제로는 아무 것도 맞히지 못했다는 사실이 드러납니다. 더 심각한 건, 실제로 훈련시킨 로지스틱 회귀조차 기본 임계값 0.5에서는 TP='+BASE_AT_05.TP+'로 <b>똑같은 함정</b>에 빠진다는 점입니다 — 클래스가 이렇게 드물면 「학습이 됐는가」와 「임계값이 맞는가」는 완전히 다른 문제입니다.'); }
  },

  // ══════════ 2. 임계값을 옮기다 ══════════
  { id:'bda27_02',
    enter:function(E){ var self=this;
      self.s={t:0.5};
      E.controls('<div class="ctrl"><label>판정 임계값</label><input type="range" id="b272t" min="0.02" max="0.9" step="0.01" value="0.5"><output id="b272to">0.50</output></div>');
      E.bind('#b272t','input',function(e){ self.s.t=+e.target.value; document.getElementById('b272to').textContent=self.s.t.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'prob = model.predict_proba(X)[:, 1]', hl:'predict_proba'},
        {t:'pred = (prob >= threshold).astype(int)', hl:'threshold'},
        {t:'cost = FN*cost_fn + FP*cost_fp   # 비대칭 비용', hl:'cost_fn'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'move_threshold.py', 1);
      var c=confAt(PROB27,Y27,s.t), ak=accKappa(c), cost=expCost(c);
      var sens=c.TP/(c.TP+c.FN), spec=c.TN/(c.TN+c.FP);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('임계값='+s.t.toFixed(2)+'  TP='+c.TP+' FP='+c.FP+' FN='+c.FN+' TN='+c.TN, W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('민감도='+sens.toFixed(2)+'  특이도='+spec.toFixed(2)+'  카파='+ak.kappa.toFixed(3), W*0.04, ry+22);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=(Math.abs(s.t-BEST_T27.t)<0.02)?GRN:RED;
      ctx.fillText('기대비용 = '+cost, W*0.04, ry+46);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('비용 최소 임계값(실제 스윕) = '+BEST_T27.t.toFixed(2)+' (비용 '+BEST_T27.cost+')', W*0.04, ry+66);
      ctx.fillText('가입 놓침(FN) 비용을 잘못 연락(FP)의 '+COSTFN27+'배로 설정', W*0.04, ry+84);

      // 혼동행렬 2x2
      var mx0=W*0.505, my0=32, cw=64, ch=42;
      ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=DIM;
      ctx.fillText('예측:미가입', mx0+cw*1.5, my0-6); ctx.fillText('예측:가입', mx0+cw*2.5+8, my0-6);
      var cells=[['TN',c.TN,GRN],['FN',c.FN,RED],['FP',c.FP,RED],['TP',c.TP,GRN]];
      for(var r2=0;r2<2;r2++) for(var cc=0;cc<2;cc++){
        var cell=cells[r2*2+cc];
        var xx=mx0+cw*(1+cc)+8*cc, yy=my0+ch*r2;
        ctx.fillStyle='rgba(255,255,255,0.05)'; roundRect(ctx,xx,yy,cw,ch-4,5); ctx.fill();
        ctx.fillStyle=cell[2]; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillText(String(cell[1]), xx+cw/2, yy+18);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(cell[0], xx+cw/2, yy+34);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='right';
      ctx.fillText('실제:미가입', mx0-6, my0+17); ctx.fillText('실제:가입', mx0-6, my0+ch+17);

      // 비용 vs 임계값 곡선
      var px0=W*0.505, px1=W*0.965, pTop=my0+ch*2+34, pBot=340;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      var ts=[]; for(var tt=0.02; tt<=0.9; tt+=0.02) ts.push(+tt.toFixed(2));
      var costs=ts.map(function(tv){ return expCost(confAt(PROB27,Y27,tv)); });
      var maxCost=Math.max.apply(null,costs);
      function PXt(v){ return px0+(v/0.9)*(px1-px0); }
      function PYc(v){ return pBot-(v/maxCost)*(pBot-pTop); }
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      ts.forEach(function(tv,ti){ var xp=PXt(tv), yp=PYc(costs[ti]); if(ti===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(PXt(BEST_T27.t),pTop); ctx.lineTo(PXt(BEST_T27.t),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PXt(s.t),PYc(cost),5,0,7); ctx.fill();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('임계값별 기대비용(파랑) — 금색 점선=최소 지점', px0, pTop-8);
      ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('판정 임계값', (px0+px1)/2, pBot+16);

      E.tapHint(W/2, H*0.95, '슬라이더로 임계값을 내려보며 혼동행렬·비용이 실제로 바뀌는 것을 보세요', true);
      E.big('임계값을 옮기다', '모델은 그대로 두고 「몇 점 이상이면 가입으로 판정할까」만 바꿔도 결과가 완전히 달라집니다. 기본값 0.5에서는 TP='+BASE_AT_05.TP+'(아무도 못 잡음, 기대비용 '+expCost(BASE_AT_05)+')였지만, 임계값을 0.02~0.9 사이에서 실제로 스윕하면 <b>비용 최소 지점은 '+BEST_T27.t.toFixed(2)+'</b>(기대비용 '+BEST_T27.cost+')로 나타납니다 — 0.5의 절반에도 못 미치는 낮은 값입니다. 가입을 놓치는 비용(FN)이 잘못 연락하는 비용(FP)의 '+COSTFN27+'배이므로, 조금 과하다 싶을 만큼 「가입」 쪽으로 후하게 판정하는 것이 실제로 더 저렴합니다. 임계값 곡선이 U자 모양을 그리는 것도, 임계값을 너무 낮추면 이번엔 FP가 폭증해 비용이 다시 늘어나기 때문입니다.'); }
  },

  // ══════════ 3. 표본을 다시 짜다 — 언더/오버샘플링과 SMOTE ══════════
  { id:'bda27_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'RandomUnderSampler().fit_resample(X, y)', hl:'RandomUnderSampler'},
        {t:'RandomOverSampler().fit_resample(X, y)', hl:'RandomOverSampler'},
        {t:'SMOTE(k_neighbors=3).fit_resample(X, y)', hl:'SMOTE'}
      ];
      var actL=(s.step===0)?null:(s.step===1?0:(s.step===2?1:2));
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'resample.py', actL);
      var labels=['원본(불균형)','언더샘플링','오버샘플링','SMOTE'];
      var res=[CV_BASE27,CV_UNDER27,CV_OVER27,CV_SMOTE27];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      for(var i=0;i<=s.step;i++){
        ctx.fillStyle=(i===s.step)?GLD:DIM;
        ctx.fillText(labels[i]+'  5겹 CV 카파='+res[i].kappa.toFixed(3)+'  기대비용='+res[i].cost, W*0.04, ry+i*20);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('(각 폴드의 훈련 구간에만 리샘플링 적용 — 검증 표본은 원본 그대로)', W*0.04, ry+(s.step+1)*20+6);

      var px0=W*0.50, px1=W*0.965, pTop=28, pBot=260;
      var x1max=Math.max.apply(null,X1_27)+0.5, x2max=Math.max.apply(null,X2_27)+0.5;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();

      if(s.step===0){
        IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.5)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2.2,0,7); ctx.fill(); });
        IDXPOS27.forEach(function(i){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),4,0,7); ctx.fill(); });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('원본: 미가입 '+IDXNEG27.length+'건 vs 가입 '+IDXPOS27.length+'건', px0, pTop+10);
      } else if(s.step===1){
        var stride=Math.max(1,Math.round(IDXNEG27.length/IDXPOS27.length));
        var negKeep=undersample(IDXNEG27,stride);
        IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.18)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2,0,7); ctx.fill(); });
        negKeep.forEach(function(i){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),3,0,7); ctx.fill(); });
        IDXPOS27.forEach(function(i){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),4,0,7); ctx.fill(); });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('언더샘플링: 미가입 '+IDXNEG27.length+'→'+negKeep.length+'건으로 줄임(파랑=남김)', px0, pTop+10);
      } else if(s.step===2){
        IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.5)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2.2,0,7); ctx.fill(); });
        var posUp=oversample(IDXPOS27, IDXNEG27.length);
        posUp.forEach(function(i,ui){ ctx.fillStyle=(ui<IDXPOS27.length)?RED:'rgba(240,136,138,0.35)'; ctx.beginPath(); ctx.arc(PX(X1_27[i])+((ui%3)-1)*1.4,PY(X2_27[i])+((ui%5)-2)*1.4,2.6,0,7); ctx.fill(); });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('오버샘플링: 가입 '+IDXPOS27.length+'→'+posUp.length+'건으로 복제(진한 점=원본)', px0, pTop+10);
      } else {
        IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.5)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2.2,0,7); ctx.fill(); });
        IDXPOS27.forEach(function(i){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),4,0,7); ctx.fill(); });
        SMOTE_DEMO27.forEach(function(sp){
          ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(PX(X1_27[sp.base]),PY(X2_27[sp.base])); ctx.lineTo(PX(sp.x*sX1_27+mX1_27),PY(sp.y*sX2_27+mX2_27)); ctx.stroke();
          ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PX(sp.x*sX1_27+mX1_27),PY(sp.y*sX2_27+mX2_27),3,0,7); ctx.fill();
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('SMOTE: 소수 클래스 이웃 사이를 실제로 보간해 새 점(초록) 생성', px0, pTop+10);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('관심도 점수(x1) →', (px0+px1)/2, pBot+16);

      E.tapHint(W/2, H*0.95, '화면 탭 = 언더샘플링 → 오버샘플링 → SMOTE', true);
      E.big('표본을 다시 짜다 — 언더/오버샘플링과 SMOTE', '드문 클래스를 다루는 또 다른 길은 모델이 아니라 <b>표본 구성 자체를 바꾸는 것</b>입니다. 언더샘플링은 다수 클래스를 솎아내고(카파 '+CV_UNDER27.kappa.toFixed(3)+'), 오버샘플링은 소수 클래스를 복제합니다(카파 '+CV_OVER27.kappa.toFixed(3)+'). <b>SMOTE</b>는 한 걸음 더 나아가, 소수 클래스 표본 하나와 그 K-최근접 이웃(K=3) 사이의 선분 위에 실제로 새 점을 보간해 만듭니다(초록 점과 연결선이 실제 계산 결과입니다) — 단순 복제보다 소수 클래스가 차지하는 공간을 자연스럽게 채워, 카파 '+CV_SMOTE27.kappa.toFixed(3)+'로 세 방법 중 가장 좋습니다. 다만 모든 리샘플링은 <b>각 교차검증 폴드의 훈련 구간에만</b> 적용해야 합니다 — 검증 표본까지 복제·보간해버리면 성능이 부풀려집니다.'); }
  },

  // ══════════ 4. 비용을 모델에 알려주다 — 비용 민감 학습 ══════════
  { id:'bda27_04',
    enter:function(E){ var self=this;
      self.s={wPos:1};
      E.controls('<div class="ctrl"><label>가입(소수) 클래스 가중치</label><input type="range" id="b274w" min="1" max="30" step="1" value="1"><output id="b274wo">1</output></div>');
      E.bind('#b274w','input',function(e){ self.s.wPos=+e.target.value; document.getElementById('b274wo').textContent=self.s.wPos; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'LogisticRegression(class_weight={0:1, 1:w})', hl:'class_weight'},
        {t:'.fit(X, y)   # 오류마다 다른 비용을 직접 반영', hl:'.fit('}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cost_sensitive.py', 0);
      var m=logregGDw(FEATS27,Y27,0.5,300,0.02,s.wPos);
      var probM=FEATS27.map(function(xi){return logregPredict(m,xi);});
      var c=confAt(probM,Y27,0.5), ak=accKappa(c), cost=expCost(c);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('w='+s.wPos+'  TP='+c.TP+' FP='+c.FP+' FN='+c.FN+' TN='+c.TN, W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('카파='+ak.kappa.toFixed(3), W*0.04, ry+22);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=(Math.abs(s.wPos-BEST_WPOS27.wPos)<=1)?GRN:RED;
      ctx.fillText('기대비용 = '+cost, W*0.04, ry+46);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('비용 최소 가중치(실제 스윕) = '+BEST_WPOS27.wPos+' (비용 '+BEST_WPOS27.cost+')', W*0.04, ry+66);
      ctx.fillText('임계값은 그대로 0.5 — 대신 학습 자체가 소수 클래스를', W*0.04, ry+84);
      ctx.fillText('놓치는 오류에 w배 더 큰 벌점을 매깁니다', W*0.04, ry+102);

      var px0=W*0.50, px1=W*0.965, pTop=28, pBot=250;
      var x1max=Math.max.apply(null,X1_27)+0.5, x2max=Math.max.apply(null,X2_27)+0.5;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      IDXNEG27.forEach(function(i){ ctx.fillStyle='rgba(155,153,163,0.5)'; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),2.2,0,7); ctx.fill(); });
      IDXPOS27.forEach(function(i){ ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(X1_27[i]),PY(X2_27[i]),4,0,7); ctx.fill(); });
      // 경계: b + w0*x1s + w1*x2s = 0 → x2 = (-b - w0*x1s)/w1 → 원 스케일
      function bx2(x1v){ var x1s=(x1v-mX1_27)/sX1_27; var x2s=(-m.b-m.w[0]*x1s)/m.w[1]; return x2s*sX2_27+mX2_27; }
      ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
      ctx.moveTo(PX(0),PY(Math.max(0,Math.min(x2max,bx2(0))))); ctx.lineTo(PX(x1max),PY(Math.max(0,Math.min(x2max,bx2(x1max)))));
      ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('결정 경계(w='+s.wPos+')', px0, pTop+10);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText('관심도 점수(x1) →', (px0+px1)/2, pBot+16);

      // 비용 vs w 곡선(작은 보조 차트)
      var cy0=pBot+30, cy1=350;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(px0,cy1); ctx.lineTo(px1,cy1); ctx.stroke();
      var ws=[]; for(var wv=1; wv<=30; wv+=1) ws.push(wv);
      var wcosts=ws.map(function(wv){ var mm=logregGDw(FEATS27,Y27,0.5,200,0.02,wv); var cc=confAt(FEATS27.map(function(xi){return logregPredict(mm,xi);}),Y27,0.5); return expCost(cc); });
      var maxWC=Math.max.apply(null,wcosts);
      function PXw(v){ return px0+((v-1)/29)*(px1-px0); }
      function PYw(v){ return cy1-(v/maxWC)*(cy1-cy0); }
      ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.beginPath();
      ws.forEach(function(wv,wi){ var xp=PXw(wv), yp=PYw(wcosts[wi]); if(wi===0) ctx.moveTo(xp,yp); else ctx.lineTo(xp,yp); }); ctx.stroke();
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PXw(s.wPos),PYw(cost),4,0,7); ctx.fill();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.fillText('가중치별 기대비용', px0, cy0-6);

      E.tapHint(W/2, H*0.95, '슬라이더로 가중치를 올려 경계가 이동하고 기대비용이 재계산되는 것을 보세요', true);
      E.big('비용을 모델에 알려주다 — 비용 민감 학습', '리샘플링 대신, 오류마다 다른 비용을 <b>학습 과정 자체에</b> 직접 알려줄 수도 있습니다. 소수 클래스(가입)의 오류에 가중치 w를 곱해 경사하강을 하면, w가 커질수록 결정 경계가 실제로 다수 클래스 쪽으로 밀려나 더 많은 사례를 「가입」으로 분류하게 됩니다. w=1(가중치 없음)일 때는 27.1장과 같은 함정(TP=0)에 빠지지만, 1부터 30까지 실제로 스윕해 보면 <b>w='+BEST_WPOS27.wPos+'</b>에서 기대비용이 '+BEST_WPOS27.cost+'로 최소가 됩니다. 임계값은 그대로 0.5인데도 마치 임계값을 옮긴 것과 비슷한 효과가 나는 이유는, 가중치가 결정 경계 자체의 위치를 바꾸기 때문입니다 — 27.2장의 「임계값 이동」과 이번 「가중치 조정」은 같은 문제를 서로 다른 손잡이로 푸는 두 방법입니다.'); }
  },

  // ══════════ 5. 사례 종합: 가입 예측 ══════════
  { id:'bda27_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'strategies = ["기준", "임계값이동", "SMOTE", "비용민감"]', dim:true},
        {t:'for name in strategies:', dim:true},
        {t:'    cross_val_cost(name)   # held-out 기대비용', hl:'cross_val_cost'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'final_compare.py', 2);
      var labels=['기준(임계값.5)','임계값만 이동','SMOTE','비용민감 가중'];
      var costs=[CV_BASE27.cost, expCost(BEST_OOF_T27.c), CV_SMOTE27.cost, CV_WEIGHTED27.cost];
      var cols=[DIM,BLU,GRN,GLD];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      for(var i=0;i<=s.step;i++){
        ctx.fillStyle=cols[i];
        var pct=(1-costs[i]/costs[0])*100;
        ctx.fillText(labels[i]+'  기대비용='+costs[i]+(i>0?'  ('+pct.toFixed(0)+'% 절감)':''), W*0.04, ry+i*20);
      }
      if(s.step===3){
        var order=labels.map(function(l,li){return {l:l,c:costs[li]};}).sort(function(a,b){return a.c-b.c;});
        ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
        ctx.fillText('→ 비용 최소: '+order[0].l+' (비용 '+order[0].c+')', W*0.04, ry+4*20+8);
      }

      var bx0=W*0.50, bx1=W*0.965, by0=40, bh=200, bw=(bx1-bx0)/4*0.55, gap=(bx1-bx0)/4;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('전략별 5겹 교차검증 기대비용(낮을수록 좋음)', bx0, by0-10);
      var maxC=Math.max.apply(null,costs);
      for(i=0;i<=s.step;i++){
        var hh=(costs[i]/maxC)*bh;
        var xk=bx0+i*gap+gap*0.22;
        ctx.fillStyle=cols[i]; ctx.fillRect(xk, by0+bh-hh, bw, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(costs[i]), xk+bw/2, by0+bh-hh-8<by0+12?by0+12:by0+bh-hh-8);
        ctx.font='11px sans-serif'; ctx.fillStyle=cols[i];
        ctx.fillText(labels[i], xk+bw/2, by0+bh+16);
      }

      var order2=labels.map(function(l,li){return {l:l,c:costs[li]};}).sort(function(a,b){return a.c-b.c;});
      var winner2=order2[0].l, winnerCost2=order2[0].c, runnerUp2=order2[1].l, runnerCost2=order2[1].c;
      E.tapHint(W/2, H*0.95, '화면 탭 = 전략을 하나씩 추가해 기대비용 비교', true);
      E.big('사례 종합: 가입 예측', '이번 장에서 배운 세 전략(임계값 이동·표본 재구성·비용 민감 학습)을 같은 가입 예측 데이터에 5겹 교차검증으로 공정하게 적용해 <b>기대비용</b>으로 비교합니다. 아무 조치도 하지 않은 기준(비용 '+CV_BASE27.cost+')에 비해 세 전략 모두 큰 폭으로 비용을 줄이는데, 이번 실측에서는 <b>'+winner2+'(비용 '+winnerCost2+')이 가장 낮고, '+runnerUp2+'(비용 '+runnerCost2+')이 근소한 차이로 뒤따릅니다</b> — 셋의 격차가 크지 않다는 점 자체가 「어느 한 방법이 항상 정답은 아니다」라는 신호입니다. 그래서 <b>실무 권고는 구현 난이도가 낮은 순서</b>대로입니다: 먼저 학습된 모델의 임계값만 옮겨 보고(가장 싸고 빠르며, 이번 사례에서도 이미 비용의 대부분을 회수합니다), 그래도 부족하면 표본을 재구성하고, 마지막으로 비용 민감 학습처럼 모델 내부를 바꾸는 방법까지 검토하는 것이 합리적인 순서입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
