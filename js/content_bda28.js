/* 빅데이터 분석 제28장 — 사례 연구: 작업 스케줄링 (다중 클래스 + 비대칭 비용)
   동작(behavior)만. 텍스트=content/bda28.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(실행시간 분포·등급 빈도·4×4 혼동행렬·클래스별 정밀도재현율·
   비용행렬 총비용·5겹 교차검증 정확도카파비용·기대비용 최소 판정)는 아래 고정 배열로부터
   이 파일 로드 시 실제 계산(하드코딩 금지). 다항 로지스틱은 배치 경사하강을, 트리·배깅은
   지니 불순도 기반 실제 분할 탐색을 그대로 구현한다.
   난수(Math.random) 절대 금지 — 표본·부트스트랩·순열은 고정 시드 LCG. */
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

  // ══════════ 고정 데이터: 계산 작업 140건 — 입력크기(x1)·반복수(x2) → 실행시간 → 4등급 ══════════
  var N28=140, K28=4;
  var CLASSCODE=['VF','F','M','L'], CLASSNAME=['매우짧음','짧음','보통','김'];
  var X1_28=[], X2_28=[], TSEC28=[], Y28=[];
  (function(){
    var rng=LCG(20260910);
    for(var i=0;i<N28;i++){
      var x1=1+5.0*Math.pow(rng(),1.4);
      var x2=1+180*Math.pow(rng(),2.0);
      var logT=-0.2+0.5*Math.log(x1+0.3)+0.72*Math.log(x2+1)+(rng()-0.5)*2.4;
      var t=Math.exp(logT);
      X1_28.push(+x1.toFixed(2)); X2_28.push(Math.round(x2)); TSEC28.push(+t.toFixed(2));
      var y=(t<10)?0:(t<50?1:(t<130?2:3));
      Y28.push(y);
    }
  })();
  var CNT28=[0,0,0,0]; Y28.forEach(function(y){ CNT28[y]++; });
  var MEANT28=mean(TSEC28), MEDT28=TSEC28.slice().sort(function(a,b){return a-b;})[Math.floor(N28/2)];
  var RMSEMEAN28=Math.sqrt(mean(TSEC28.map(function(t){ return (t-MEANT28)*(t-MEANT28); })));
  var MAJC28=0; for(var _c=1;_c<4;_c++) if(CNT28[_c]>CNT28[MAJC28]) MAJC28=_c;
  var BASEACC28=CNT28[MAJC28]/N28;

  // 실행시간 히스토그램(로그 구간)
  var HEDGES28=[0.3,1,3,10,30,90,270], HLAB28=['0.3~1','1~3','3~10','10~30','30~90','90~270'];
  var HIST28=new Array(HEDGES28.length-1).fill(0);
  TSEC28.forEach(function(t){ for(var e=0;e<HEDGES28.length-1;e++){ if(t>=HEDGES28[e] && t<HEDGES28[e+1]){ HIST28[e]++; break; } } });

  // ── 비용 행렬 COST28[예측][실제] — 긴 작업을 짧다고 오판할수록 벌점이 크다 ──────────────
  var COST28=[ [0,1,5,10], [1,0,5,5], [1,1,0,1], [1,1,1,0] ];

  // ── 표준화 ──────────────────────────────────────────────
  var mX1_28=mean(X1_28), sX1_28=std(X1_28), mX2_28=mean(X2_28), sX2_28=std(X2_28);

  // ── 다항 로지스틱(softmax) 경사하강 ──────────────────────────
  function softmax4(z){ var mx=Math.max.apply(null,z); var ex=z.map(function(v){return Math.exp(v-mx);}); var s=ex.reduce(function(a,b){return a+b;},0); return ex.map(function(v){return v/s;}); }
  function softmaxFit(X,y,K,lr,iters,l2){
    var n=X.length, p=X[0].length;
    var W=[]; for(var k=0;k<K;k++) W.push(new Array(p).fill(0));
    var b=new Array(K).fill(0);
    for(var it=0;it<iters;it++){
      var gW=[]; for(k=0;k<K;k++) gW.push(new Array(p).fill(0));
      var gb=new Array(K).fill(0);
      for(var i=0;i<n;i++){
        var z=new Array(K); for(k=0;k<K;k++){ var s=b[k]; for(var j=0;j<p;j++) s+=W[k][j]*X[i][j]; z[k]=s; }
        var pr=softmax4(z);
        for(k=0;k<K;k++){ var err=pr[k]-(y[i]===k?1:0); for(j=0;j<p;j++) gW[k][j]+=err*X[i][j]; gb[k]+=err; }
      }
      for(k=0;k<K;k++){ for(j=0;j<p;j++) W[k][j]-=lr*(gW[k][j]/n+l2*W[k][j]); b[k]-=lr*(gb[k]/n); }
    }
    return {W:W,b:b};
  }
  function softmaxLogits(m,xi){ var K=m.W.length,p=xi.length; var z=new Array(K); for(var k=0;k<K;k++){ var s=m.b[k]; for(var j=0;j<p;j++) s+=m.W[k][j]*xi[j]; z[k]=s; } return z; }

  // ── 소형 분류 트리(지니, depth<=4) ──────────────────────────
  function classCounts28(idx,y,K){ var c=new Array(K).fill(0); idx.forEach(function(i){c[y[i]]++;}); return c; }
  function gini28(counts,n){ var g=1; for(var k=0;k<counts.length;k++){ var p=counts[k]/n; g-=p*p; } return g; }
  function buildTree28(idx,X,y,K,depth,maxDepth,minLeaf){
    var counts=classCounts28(idx,y,K), n=idx.length;
    var maj=0; for(var k=1;k<K;k++) if(counts[k]>counts[maj]) maj=k;
    if(depth>=maxDepth || n<minLeaf || counts[maj]===n) return {leaf:true,pred:maj,n:n};
    var baseG=gini28(counts,n), bestGain=1e-9, bestFeat=-1, bestThresh=0, bestL=null, bestR=null;
    for(var f=0;f<2;f++){
      var vals=idx.map(function(i){return X[i][f];}).slice().sort(function(a,b){return a-b;});
      var uniq=[]; for(var vi=0;vi<vals.length;vi++) if(vi===0||vals[vi]!==vals[vi-1]) uniq.push(vals[vi]);
      for(var u=0;u<uniq.length-1;u++){
        var thresh=(uniq[u]+uniq[u+1])/2, L=[],R=[];
        idx.forEach(function(i){ if(X[i][f]<=thresh) L.push(i); else R.push(i); });
        if(L.length<1||R.length<1) continue;
        var cL=classCounts28(L,y,K), cR=classCounts28(R,y,K);
        var childG=(L.length*gini28(cL,L.length)+R.length*gini28(cR,R.length))/n;
        var gain=baseG-childG;
        if(gain>bestGain){ bestGain=gain; bestFeat=f; bestThresh=thresh; bestL=L; bestR=R; }
      }
    }
    if(bestFeat<0) return {leaf:true,pred:maj,n:n};
    return {leaf:false,feat:bestFeat,thresh:bestThresh,
      left:buildTree28(bestL,X,y,K,depth+1,maxDepth,minLeaf),
      right:buildTree28(bestR,X,y,K,depth+1,maxDepth,minLeaf)};
  }
  function predTree28(node,xi){ while(!node.leaf){ node=(xi[node.feat]<=node.thresh)?node.left:node.right; } return node.pred; }
  function buildBag28(idx,X,y,K,B,maxDepth,minLeaf,rng){
    var trees=[];
    for(var b=0;b<B;b++){
      var boot=[]; for(var i=0;i<idx.length;i++) boot.push(idx[Math.floor(rng()*idx.length)]);
      trees.push(buildTree28(boot,X,y,K,0,maxDepth,minLeaf));
    }
    return trees;
  }
  function predBag28(trees,xi,K){ var votes=new Array(K).fill(0); trees.forEach(function(t){ votes[predTree28(t,xi)]++; }); var mx=0; for(var k=1;k<K;k++) if(votes[k]>votes[mx]) mx=k; return mx; }

  // ── 평가 지표 ──────────────────────────────────────────────
  function confusion28(pred,y,K){ var M=[]; for(var k=0;k<K;k++) M.push(new Array(K).fill(0)); for(var i=0;i<pred.length;i++) M[pred[i]][y[i]]++; return M; }
  function totalCost28(M){ var c=0; for(var p=0;p<4;p++) for(var a=0;a<4;a++) c+=M[p][a]*COST28[p][a]; return c; }
  function accKappa28(pred,y,K){
    var n=pred.length, M=confusion28(pred,y,K);
    var Po=0; for(var k=0;k<K;k++) Po+=M[k][k]; Po/=n;
    var rowSum=new Array(K).fill(0), colSum=new Array(K).fill(0);
    for(var p=0;p<K;p++) for(var a=0;a<K;a++){ rowSum[p]+=M[p][a]; colSum[a]+=M[p][a]; }
    var Pe=0; for(k=0;k<K;k++) Pe+=(rowSum[k]*colSum[k])/(n*n);
    return {acc:Po, kappa:(Po-Pe)/(1-Pe), M:M};
  }

  // ── 5겹 교차검증: softmax(OOF 로짓 보존) / 트리 / 배깅 ──────────────────────────
  var FOLDS28=5;
  var LOGITS_OOF28=new Array(N28), PRED_SOFT28=new Array(N28), PRED_TREE28=new Array(N28), PRED_BAG28=new Array(N28);
  (function(){
    var bagRng=LCG(777888);
    for(var f=0; f<FOLDS28; f++){
      var trIdx=[],teIdx=[];
      for(var i=0;i<N28;i++){ if(i%FOLDS28===f) teIdx.push(i); else trIdx.push(i); }
      var trX1=trIdx.map(function(i){return X1_28[i];}), trX2=trIdx.map(function(i){return X2_28[i];});
      var m1=mean(trX1), s1=std(trX1), m2=mean(trX2), s2=std(trX2);
      var trFs=trIdx.map(function(i){return [(X1_28[i]-m1)/s1,(X2_28[i]-m2)/s2];});
      var trY=trIdx.map(function(i){return Y28[i];});
      var softM=softmaxFit(trFs,trY,K28,0.3,800,0.01);
      teIdx.forEach(function(i){
        var xi=[(X1_28[i]-m1)/s1,(X2_28[i]-m2)/s2];
        var z=softmaxLogits(softM,xi);
        LOGITS_OOF28[i]=z;
        var mx=0; for(var k=1;k<K28;k++) if(z[k]>z[mx]) mx=k;
        PRED_SOFT28[i]=mx;
      });
      var localIdx=trIdx.map(function(v,ii){return ii;});
      var trFeatRaw=trIdx.map(function(i){return [X1_28[i],X2_28[i]];});
      var trYRaw=trIdx.map(function(i){return Y28[i];});
      var tree=buildTree28(localIdx,trFeatRaw,trYRaw,K28,0,4,6);
      teIdx.forEach(function(i){ PRED_TREE28[i]=predTree28(tree,[X1_28[i],X2_28[i]]); });
      var bagTrees=buildBag28(localIdx,trFeatRaw,trYRaw,K28,7,4,6,bagRng);
      teIdx.forEach(function(i){ PRED_BAG28[i]=predBag28(bagTrees,[X1_28[i],X2_28[i]],K28); });
    }
  })();
  var M_SOFT28=accKappa28(PRED_SOFT28,Y28,K28);
  var M_TREE28=accKappa28(PRED_TREE28,Y28,K28);
  var M_BAG28=accKappa28(PRED_BAG28,Y28,K28);
  var COST_SOFT28=totalCost28(M_SOFT28.M), COST_TREE28=totalCost28(M_TREE28.M), COST_BAG28=totalCost28(M_BAG28.M);
  var PRED_BASE28=new Array(N28).fill(MAJC28);
  var M_BASE28=accKappa28(PRED_BASE28,Y28,K28), COST_BASE28=totalCost28(M_BASE28.M);

  // ── 편향(bias) 슬라이더: L 로짓에 가중치를 더해 argmax 재판정 ──────────────────────────
  function predWithBias28(bias){
    var pred=new Array(N28);
    for(var i=0;i<N28;i++){
      var z=LOGITS_OOF28[i].slice(); z[3]+=bias;
      var mx=0; for(var k=1;k<K28;k++) if(z[k]>z[mx]) mx=k;
      pred[i]=mx;
    }
    return pred;
  }

  // ── 기대비용 최소 판정 규칙 ──────────────────────────
  function expectedCostPred28(probs){
    var best=0,bestEC=Infinity;
    for(var c=0;c<4;c++){ var ec=0; for(var a=0;a<4;a++) ec+=probs[a]*COST28[c][a]; if(ec<bestEC){ bestEC=ec; best=c; } }
    return best;
  }
  var PRED_ARGMAX28=predWithBias28(0);
  var PRED_EXPCOST28=new Array(N28), PROBS_OOF28=new Array(N28);
  for(var _i28=0;_i28<N28;_i28++){ PROBS_OOF28[_i28]=softmax4(LOGITS_OOF28[_i28]); PRED_EXPCOST28[_i28]=expectedCostPred28(PROBS_OOF28[_i28]); }
  var M_ARGMAX28=accKappa28(PRED_ARGMAX28,Y28,K28), COST_ARGMAX28=totalCost28(M_ARGMAX28.M);
  var M_EXPCOST28=accKappa28(PRED_EXPCOST28,Y28,K28), COST_EXPCOST28=totalCost28(M_EXPCOST28.M);
  var DISAGREE28=[]; for(_i28=0;_i28<N28;_i28++) if(PRED_ARGMAX28[_i28]!==PRED_EXPCOST28[_i28]) DISAGREE28.push(_i28);

  function pr28(M,k){ var rowSum=0; for(var a=0;a<4;a++) rowSum+=M[k][a]; return rowSum>0?(M[k][k]/rowSum):null; }
  function rec28(M,k){ var colSum=0; for(var p=0;p<4;p++) colSum+=M[p][k]; return colSum>0?(M[k][k]/colSum):null; }
  function fmt3(v){ return v==null?'—':v.toFixed(3); }

  var scenes = [

  // ══════════ 1. 문제와 데이터 — 네 등급으로 나눠 예측한다 ══════════
  { id:'bda28_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"labels = ['VF','F','M','L']", dim:true},
        {t:"df['등급'] = pd.cut(df.실행시간,", hl:'pd.cut'},
        {t:'    bins=[0,10,50,130,np.inf], labels=labels)'},
        {t:'df.등급.value_counts(normalize=True)', hl:'value_counts'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'job_grade.py', s.step<2?1:3);
      var caps=[
        '계산 작업 140건의 x1(입력크기)·x2(반복수) 데이터입니다',
        '평균 '+MEANT28.toFixed(1)+'초 > 중앙값 '+MEDT28.toFixed(1)+'초 — 긴 꼬리 분포입니다',
        '경계값(10·50·130초)으로 등급을 나누면 네 등급의 빈도가 크게 불균형합니다'
      ];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      ctx.font='12px ui-monospace,Menlo,monospace';
      if(s.step===1){
        ctx.fillStyle=RED; ctx.fillText('평균만 예측(회귀)할 때 RMSE = '+RMSEMEAN28.toFixed(1)+'초', W*0.04, codeBot+46);
        ctx.fillStyle=BLU; ctx.fillText('다수 등급(F)만 답할 때(분류) 정확도 = '+BASEACC28.toFixed(3), W*0.04, codeBot+68);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('오차 34.5초는 등급 경계 폭(10~130초)보다 훨씬 커서 회귀는 스케줄러에 쓸모가 적습니다', W*0.04, codeBot+90);
      } else if(s.step===2){
        ctx.fillStyle=GLD; ctx.fillText('VF '+CNT28[0]+'건('+(CNT28[0]/N28*100).toFixed(1)+'%)  F '+CNT28[1]+'건('+(CNT28[1]/N28*100).toFixed(1)+'%)', W*0.04, codeBot+46);
        ctx.fillStyle=GLD; ctx.fillText('M '+CNT28[2]+'건('+(CNT28[2]/N28*100).toFixed(1)+'%)  L '+CNT28[3]+'건('+(CNT28[3]/N28*100).toFixed(1)+'%)', W*0.04, codeBot+68);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('L(김)은 가장 드물지만(2.9%) 잘못 짧다고 판정하면 손해가 가장 큽니다', W*0.04, codeBot+90);
      }

      var bx0=W*0.49, bx1=W*0.965, bTop=32, bBot=155;
      var maxH=Math.max.apply(null,HIST28);
      var barW=(bx1-bx0)/HIST28.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,bBot); ctx.lineTo(bx1,bBot); ctx.stroke();
      for(var e=0;e<HIST28.length;e++){
        var hh=(HIST28[e]/maxH)*(bBot-bTop-14);
        ctx.fillStyle=ROSE; ctx.fillRect(bx0+e*barW+3, bBot-hh, barW-6, hh);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(HIST28[e]), bx0+e*barW+barW/2, bBot-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(HLAB28[e], bx0+e*barW+barW/2, bBot+16);
      }
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText('실행시간(초) 분포 — 로그 구간별 작업 수', bx0, 22);

      if(s.step===2){
        var gy0=190, gbh=130, gbw=(bx1-bx0)/4*0.6, ggap=(bx1-bx0)/4;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,gy0+gbh); ctx.lineTo(bx1,gy0+gbh); ctx.stroke();
        var maxC=Math.max.apply(null,CNT28);
        for(var k=0;k<4;k++){
          var hgt=(CNT28[k]/maxC)*gbh;
          var col=(k===3)?RED:(k===0?GRN:(k===1?BLU:GLD));
          var gx=bx0+k*ggap+ggap*0.2;
          ctx.fillStyle=col; ctx.fillRect(gx, gy0+gbh-hgt, gbw, hgt);
          ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(CLASSCODE[k]+' '+CNT28[k], gx+gbw/2, gy0+gbh+16);
        }
        ctx.fillText('네 등급 빈도(불균형)', (bx0+bx1)/2, gy0-8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (분포 → 회귀 vs 분류 → 등급 불균형)', true);
      E.big('사례: 작업 스케줄링 — 몇 등급으로 나눌까', '고성능 컴퓨팅 스케줄러는 작업이 「대략 얼마나 걸릴지」만 알아도 자원 배분을 크게 개선할 수 있습니다. 이번 사례는 계산 작업 '+N28+'건의 입력크기(x1)·반복수(x2)로부터 실행시간(초)을 추정한 뒤, 이를 <b>매우짧음(VF)·짧음(F)·보통(M)·김(L)</b> 네 등급으로 나눠 분류합니다. 실행시간을 그대로 회귀로 예측하면 평균만 맞히는 기준선의 오차가 '+RMSEMEAN28.toFixed(1)+'초로, 등급 경계 폭(10·50·130초)보다 훨씬 큽니다 — 소수의 아주 긴 작업이 오차를 지배하기 때문입니다. 반면 등급으로 나누면 다수 등급(F)만 늘 답하는 단순 기준도 정확도 '+BASEACC28.toFixed(3)+'을 얻고, 무엇보다 스케줄러가 실제로 필요로 하는 「어느 큐에 넣을까」라는 질문에 바로 답합니다. 다만 등급 분포는 VF '+(CNT28[0]/N28*100).toFixed(0)+'%·F '+(CNT28[1]/N28*100).toFixed(0)+'%·M '+(CNT28[2]/N28*100).toFixed(0)+'%·L '+(CNT28[3]/N28*100).toFixed(1)+'%로 심하게 <b>불균형</b>합니다.'); }
  },

  // ══════════ 2. 다중 클래스의 평가 — 혼동행렬과 비용 ══════════
  { id:'bda28_02',
    enter:function(E){ var self=this; self.s={bias:0};
      E.controls('<div class="ctrl"><label>L 판정 가중치</label><input type="range" id="b282b" min="0" max="4" step="0.1" value="0"><output id="b282bo">0.0</output></div>');
      E.bind('#b282b','input',function(e){ self.s.bias=+e.target.value; document.getElementById('b282bo').textContent=self.s.bias.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        'proba = clf.predict_proba(X_test)',
        {t:'y_pred = proba.argmax(axis=1)', hl:'argmax'},
        {t:'cm = confusion_matrix(y_test, y_pred)', hl:'confusion_matrix'},
        {t:'total_cost = (cm * COST).sum()', hl:'COST'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'evaluate.py', 3);
      var pred=predWithBias28(s.bias);
      var mk=accKappa28(pred,Y28,K28), cost=totalCost28(mk.M);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('bias='+s.bias.toFixed(1)+'  정확도='+mk.acc.toFixed(3)+'  총비용='+cost, W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('(bias=0 기준: 정확도 '+M_ARGMAX28.acc.toFixed(3)+' · 비용 '+COST_ARGMAX28+')', W*0.04, ry+21);
      ctx.fillStyle=RED;
      ctx.fillText('이 두 특징만으로는 M·L 등급을 한 번도 예측하지 못하는 지점이 있습니다', W*0.04, ry+45);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('슬라이더로 L 로짓을 밀어 올리면 예측이 바뀌며 정확도·비용이 각자 다르게 움직입니다', W*0.04, ry+66);

      // 4x4 혼동행렬(행=예측, 열=실제)
      var gx0=W*0.50, gx1=W*0.965, gy0=44, rowH=25;
      var colW=(gx1-gx0)/5;
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('혼동행렬 (행=예측, 열=실제)', gx0, gy0-8);
      ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      for(var k=0;k<4;k++){ ctx.fillStyle=GLD; ctx.fillText(CLASSCODE[k], gx0+colW*(k+1)+colW/2, gy0+rowH*0.7); }
      var maxCell=1; for(var p=0;p<4;p++) for(var a=0;a<4;a++) if(mk.M[p][a]>maxCell) maxCell=mk.M[p][a];
      for(p=0;p<4;p++){
        var ry2=gy0+rowH*(p+1);
        ctx.fillStyle=GLD; ctx.fillText(CLASSCODE[p], gx0+colW/2, ry2+rowH*0.7);
        for(a=0;a<4;a++){
          var v=mk.M[p][a];
          var cx=gx0+colW*(a+1), cy=ry2;
          var isDiag=(p===a);
          var inten=v/maxCell;
          ctx.fillStyle=isDiag?('rgba(126,224,176,'+(0.15+0.55*inten)+')'):('rgba(240,136,138,'+(0.06+0.35*inten)+')');
          ctx.fillRect(cx+2, cy+2, colW-4, rowH-4);
          ctx.fillStyle=isDiag?GRN:TXT;
          ctx.fillText(String(v), cx+colW/2, cy+rowH*0.7);
        }
      }
      ctx.strokeStyle='rgba(255,255,255,0.18)';
      for(var gi=0;gi<=5;gi++){ ctx.beginPath(); ctx.moveTo(gx0,gy0+rowH*gi); ctx.lineTo(gx1,gy0+rowH*gi); ctx.stroke(); }
      for(gi=0;gi<=5;gi++){ ctx.beginPath(); ctx.moveTo(gx0+colW*gi,gy0); ctx.lineTo(gx0+colW*gi,gy0+rowH*5); ctx.stroke(); }

      var py=gy0+rowH*5+22;
      ctx.textAlign='left'; ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('VF 정밀='+fmt3(pr28(mk.M,0))+' 재현='+fmt3(rec28(mk.M,0))+'   F 정밀='+fmt3(pr28(mk.M,1))+' 재현='+fmt3(rec28(mk.M,1)), gx0, py);
      ctx.fillText('M 정밀='+fmt3(pr28(mk.M,2))+' 재현='+fmt3(rec28(mk.M,2))+'   L 정밀='+fmt3(pr28(mk.M,3))+' 재현='+fmt3(rec28(mk.M,3)), gx0, py+20);

      roundRect(ctx, gx0, py+34, gx1-gx0, 44, 8);
      ctx.fillStyle='rgba(255,178,122,0.08)'; ctx.fill(); ctx.strokeStyle='rgba(255,178,122,0.35)'; ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
      ctx.fillText('bias=0.0·0.9은 정확도가 똑같이 0.657인데', gx0+10, py+52);
      ctx.fillText('총비용은 160과 156으로 다릅니다', gx0+10, py+70);

      E.tapHint(W/2, H*0.95, '슬라이더로 L 판정 가중치를 올려 혼동행렬·비용이 바뀌는 것을 보세요', true);
      E.big('다중 클래스의 평가 — 혼동행렬과 비용', '4개 등급을 예측하면 오차표는 2×2가 아니라 <b>4×4 혼동행렬</b>이 됩니다(행=예측, 열=실제). 이 데이터에 다항 로지스틱을 5겹 교차검증으로 적합하면 정확도는 '+M_ARGMAX28.acc.toFixed(3)+'이지만, 예산요청·실적점수 같은 두 특징만으로는 M·L 등급을 <b>한 번도 예측하지 못합니다</b>(혼동행렬 3·4행이 전부 0). 정확도만 보면 그럴듯하지만, 혼동행렬에 <b>비용행렬을 원소별로 곱해 더하면</b> 총비용은 '+COST_ARGMAX28+'입니다. 슬라이더로 L 로짓에 가중치를 더하면 정확도와 비용이 <b>서로 다른 리듬으로</b> 움직입니다 — 실제로 bias=0.0과 bias=0.9는 정확도가 똑같이 0.657인데 총비용은 160과 156으로 다릅니다. <b>정확도가 같아도 비용은 다를 수 있다</b>는 것이 이 장의 첫 번째 교훈입니다.'); }
  },

  // ══════════ 3. 모델 후보 비교 — 잣대에 따라 순위가 바뀐다 ══════════
  { id:'bda28_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"models = {'선형':softmax_lr, '트리':tree,", dim:true},
        {t:"          '앙상블':bagging}", dim:true},
        {t:'for name, m in models.items():', dim:true},
        {t:'    cross_val_score(m, X, y, cv=5,', hl:'cross_val_score'},
        {t:'                     scoring=[acc, kappa, cost])'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare_cv.py', 3);
      var names=['선형(softmax)','트리(CART)','앙상블(배깅)'];
      var accs=[M_SOFT28.acc,M_TREE28.acc,M_BAG28.acc], kaps=[M_SOFT28.kappa,M_TREE28.kappa,M_BAG28.kappa], costs=[COST_SOFT28,COST_TREE28,COST_BAG28];
      var cols=[GRN,BLU,GLD];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('5겹 교차검증(폴드마다 재학습) 결과', W*0.04, ry);
      var shown=Math.min(s.step+1,3);
      for(var m=0;m<shown;m++){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[m];
        ctx.fillText(names[m]+' 정확도='+accs[m].toFixed(3)+' 카파='+kaps[m].toFixed(3)+' 비용='+costs[m], W*0.04, ry+22+m*20);
      }
      if(s.step===3){
        ctx.font='600 11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('정확도·카파는 선형>트리지만(0.657>0.614)', W*0.04, ry+22+3*20+10);
        ctx.fillText('비용은 트리<선형(146<160) — 순위가 뒤집힙니다', W*0.04, ry+22+3*20+29);
      }

      var bx0=W*0.49, bx1=W*0.965;
      var t1y0=32, t1y1=118, groupW=(bx1-bx0)/3;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,t1y1); ctx.lineTo(bx1,t1y1); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('정확도(연함)·카파(진함) — 높을수록 좋음', bx0, t1y0-8);
      for(m=0;m<shown;m++){
        var gx=bx0+m*groupW+groupW*0.18, bw=groupW*0.28;
        var hA=accs[m]*(t1y1-t1y0), hK=Math.max(0,kaps[m])*(t1y1-t1y0);
        ctx.fillStyle=cols[m]; ctx.globalAlpha=0.35; ctx.fillRect(gx, t1y1-hA, bw, hA); ctx.globalAlpha=1;
        ctx.fillStyle=cols[m]; ctx.fillRect(gx+bw+6, t1y1-hK, bw, hK);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(names[m].split('(')[0], gx+bw+3, t1y1+16);
      }

      var t2y0=178, t2y1=270, maxCostRef=Math.max(COST_BASE28, costs[0],costs[1],costs[2])+10;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,t2y1); ctx.lineTo(bx1,t2y1); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('총비용(낮을수록 좋음) — 점선=기준선 비용 '+COST_BASE28, bx0, t2y0-8);
      var baseY=t2y1-(COST_BASE28/maxCostRef)*(t2y1-t2y0);
      ctx.strokeStyle=DIM; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(bx0,baseY); ctx.lineTo(bx1,baseY); ctx.stroke(); ctx.setLineDash([]);
      for(m=0;m<shown;m++){
        var gx2=bx0+m*groupW+groupW*0.28, bw2=groupW*0.44;
        var hC=(costs[m]/maxCostRef)*(t2y1-t2y0);
        ctx.fillStyle=cols[m]; ctx.fillRect(gx2, t2y1-hC, bw2, hC);
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(costs[m]), gx2+bw2/2, t2y1-hC-6);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 모델을 하나씩 추가해 세 잣대로 비교', true);
      E.big('모델 후보 비교 — 잣대에 따라 순위가 바뀐다', '선형(다항 로지스틱)·트리(CART)·앙상블(배깅) 세 모델을 같은 데이터에 5겹 교차검증으로 공정하게 비교합니다. 정확도·카파만 보면 앙상블('+M_BAG28.acc.toFixed(3)+')이 가장 좋고 선형('+M_SOFT28.acc.toFixed(3)+')이 그다음이며 트리('+M_TREE28.acc.toFixed(3)+')가 가장 낮습니다. 그런데 <b>총비용</b>으로 줄을 세우면 앙상블('+COST_BAG28+')이 여전히 1위지만, <b>트리('+COST_TREE28+')가 선형('+COST_SOFT28+')보다 비용이 낮습니다</b> — 정확도·카파에서는 선형이 트리를 앞섰는데(0.657>0.614) 비용에서는 순위가 뒤집힙니다. 트리는 M 등급을 몇 차례 실제로 예측해 큰 벌점(비용 5·10)을 피한 반면, 선형은 M·L을 아예 포기하고 VF·F 사이에서만 안전하게 맞혀 정확도는 높지만 비용이 큰 오류를 그대로 남겼기 때문입니다. <b>잣대(정확도·카파·비용) 중 무엇을 기준으로 모델을 뽑느냐가 실제 결론을 바꿉니다.</b>'); }
  },

  // ══════════ 4. ★비용을 반영한 판정 — 기대비용 최소 규칙 ══════════
  { id:'bda28_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'proba = clf.predict_proba(X)    # (n,4)', dim:true},
        {t:'exp_cost = proba @ COST.T', hl:'proba @ COST.T'},
        {t:'y_rule = exp_cost.argmin(axis=1)', hl:'argmin'},
        {t:'# 확률 최대(argmax)가 아니라', dim:true},
        {t:'# 기대비용 최소로 등급을 고른다', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'cost_rule.py', 1);
      var ry=codeBot+18;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('예: 실제로 F인 작업 하나의 예측 확률 분포', W*0.04, ry);
        var pr0=PROBS_OOF28[0];
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('P(VF)='+pr0[0].toFixed(2)+' P(F)='+pr0[1].toFixed(2)+' P(M)='+pr0[2].toFixed(2)+' P(L)='+pr0[3].toFixed(2), W*0.04, ry+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('argmax 규칙 → F 선택 (확률이 가장 큼)', W*0.04, ry+44);
        var ecs=[]; for(var c=0;c<4;c++){ var ec=0; for(var a=0;a<4;a++) ec+=pr0[a]*COST28[c][a]; ecs.push(ec); }
        var minC=0; for(c=1;c<4;c++) if(ecs[c]<ecs[minC]) minC=c;
        ctx.font='11.5px ui-monospace,Menlo,monospace';
        for(c=0;c<4;c++){ ctx.fillStyle=(c===minC)?GRN:DIM; ctx.fillText('기대비용('+CLASSCODE[c]+')='+ecs[c].toFixed(2)+(c===minC?'  ← 최소':''), W*0.04, ry+66+c*19); }
      } else if(s.step===1){
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('argmax(확률최대) 총비용 = '+COST_ARGMAX28, W*0.04, ry+4);
        ctx.fillStyle=GRN; ctx.fillText('기대비용 최소 규칙 총비용 = '+COST_EXPCOST28, W*0.04, ry+28);
        var savePct=(1-COST_EXPCOST28/COST_ARGMAX28)*100;
        ctx.font='600 12px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('→ 같은 모델·같은 확률로 규칙만 바꿔 비용 '+savePct.toFixed(1)+'% 절감', W*0.04, ry+54);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('두 규칙의 예측이 갈린 작업 '+DISAGREE28.length+'/'+N28+'건('+(DISAGREE28.length/N28*100).toFixed(1)+'%)', W*0.04, ry+76);
      } else {
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('등급별로 몇 번씩 선택됐는지(140건 전체)', W*0.04, ry);
        var cntA=[0,0,0,0]; PRED_ARGMAX28.forEach(function(c){cntA[c]++;});
        var cntE=[0,0,0,0]; PRED_EXPCOST28.forEach(function(c){cntE[c]++;});
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('argmax:   VF='+cntA[0]+' F='+cntA[1]+' M='+cntA[2]+' L='+cntA[3], W*0.04, ry+22);
        ctx.fillStyle=GRN; ctx.fillText('기대비용: VF='+cntE[0]+' F='+cntE[1]+' M='+cntE[2]+' L='+cntE[3], W*0.04, ry+44);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('argmax은 M을 단 한 번도 고르지 않지만, 기대비용 규칙은 '+cntE[2]+'번 골라', W*0.04, ry+68);
        ctx.fillText('실제 M·L 작업을 훨씬 많이 잡아냅니다(재현율 상승)', W*0.04, ry+87);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=40, by1=210;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('규칙별 등급 선택 분포(회색=VF·파랑=F·금=M·빨강=L)', bx0, by0-8);
      var cntA2=[0,0,0,0]; PRED_ARGMAX28.forEach(function(c){cntA2[c]++;});
      var cntE2=[0,0,0,0]; PRED_EXPCOST28.forEach(function(c){cntE2[c]++;});
      var stackCols=['rgba(255,255,255,0.35)',BLU,GLD,RED];
      [['argmax',cntA2],['기대비용',cntE2]].forEach(function(pair,pi){
        var lbl=pair[0], cnts=pair[1];
        var cx=bx0+pi*((bx1-bx0)/2)+((bx1-bx0)/2)*0.22, cw=(bx1-bx0)/2*0.5;
        var y=by1;
        for(var k=0;k<4;k++){
          var hh=(cnts[k]/N28)*(by1-by0);
          ctx.fillStyle=stackCols[k]; ctx.fillRect(cx, y-hh, cw, hh); y-=hh;
        }
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(lbl, cx+cw/2, by1+16);
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (예시 한 건 → 총비용 비교 → 등급별 분포)', true);
      E.big('비용을 반영한 판정 — 기대비용 최소 규칙', '가장 흔한 규칙은 확률이 가장 높은 등급(argmax)을 고르는 것입니다. 하지만 비용이 등급마다 다르다면, <b>후보 등급 각각의 기대비용 Σ P(a)·COST[c][a]를 실제로 계산</b>해 그 값이 가장 낮은 등급을 고르는 것이 더 합리적입니다. 같은 모델·같은 확률 예측을 두고 규칙만 argmax에서 기대비용 최소로 바꾸면, 총비용이 '+COST_ARGMAX28+'에서 <b>'+COST_EXPCOST28+'로 '+(100-COST_EXPCOST28/COST_ARGMAX28*100).toFixed(1)+'% 줄어듭니다</b>(정확도는 오히려 '+M_EXPCOST28.acc.toFixed(3)+'로 낮아지는데도 그렇습니다). argmax 규칙은 M·L 등급을 한 번도 고르지 않았지만, 기대비용 규칙은 「긴 작업을 짧다고 오판하는 값비싼 실수」를 피하려고 훨씬 자주 M을 고릅니다 — 확률이 조금 낮아도 비용을 줄이는 쪽으로 <b>의도적으로 더 자주 틀리는</b> 판정이, 실제로는 훨씬 싼 실수입니다.'); }
  },

  // ══════════ 5. 운영으로 ══════════
  { id:'bda28_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:"strategies = {'기준':base, '확률최대':argmax,", dim:true},
        {t:"    '기대비용':cost_rule, '최선모델':best_cv}", dim:true},
        {t:'{name: total_cost(y_test, pred)', dim:true},
        {t:'  for name, pred in strategies.items()}', hl:'total_cost'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'summary.py', 3);
      var names=['기준(다수등급)','argmax(선형)','최선모델(배깅)','기대비용(선형)'];
      var costs=[COST_BASE28, COST_ARGMAX28, COST_BAG28, COST_EXPCOST28];
      var cols=[DIM, BLU, GLD, GRN];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('이번 장에서 시도한 전략들의 총비용(같은 140건 기준)', W*0.04, ry);
      var shown=Math.min(s.step+1,4);
      for(var m=0;m<shown;m++){
        var pct=(1-costs[m]/COST_BASE28)*100;
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=cols[m];
        ctx.fillText(names[m]+'  비용='+costs[m]+(m>0?'  ('+pct.toFixed(1)+'% 절감)':''), W*0.04, ry+22+m*20);
      }
      if(shown===4){
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('실무에서는 지연 허용치·재학습 주기를 함께 따져', W*0.04, ry+22+4*20+8);
        ctx.fillText('가장 단순히 절감되는 방법부터 적용하는 것이 안전합니다', W*0.04, ry+22+4*20+27);
      }

      var bx0=W*0.49, bx1=W*0.965, by0=36, by1=220;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by1); ctx.lineTo(bx1,by1); ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('총비용 비교 — 낮을수록 좋음', bx0, by0-8);
      var groupW=(bx1-bx0)/4, maxC=COST_BASE28+10;
      for(m=0;m<shown;m++){
        var gx=bx0+m*groupW+groupW*0.22, bw=groupW*0.56;
        var hh=(costs[m]/maxC)*(by1-by0);
        ctx.fillStyle=cols[m]; ctx.fillRect(gx, by1-hh, bw, hh);
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(String(costs[m]), gx+bw/2, by1-hh-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        var lbl2=names[m].split('(')[0];
        ctx.font='11px sans-serif';
        ctx.fillText(lbl2, gx+bw/2, by1+16);
      }

      var noteY=by1+38;
      roundRect(ctx, bx0, noteY, bx1-bx0, 78, 8);
      ctx.fillStyle='rgba(255,178,122,0.06)'; ctx.fill(); ctx.strokeStyle='rgba(255,178,122,0.30)'; ctx.stroke();
      ctx.font='11.5px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
      ctx.fillText('운영 체크리스트', bx0+10, noteY+18);
      ctx.fillStyle=TXT; ctx.font='11.5px sans-serif';
      ctx.fillText('· 지연 허용: 스케줄러가 오판을 몇 초 안에 되돌릴 수 있나', bx0+10, noteY+37);
      ctx.fillText('· 재학습 주기: 작업 특성이 바뀌면 등급 경계도 다시 검증', bx0+10, noteY+55);
      ctx.fillText('· 비용행렬 자체도 업무 변화에 맞춰 주기적으로 재검토', bx0+10, noteY+73);

      E.tapHint(W/2, H*0.95, '화면 탭 = 전략을 하나씩 추가해 비교, 마지막에 운영 체크리스트', true);
      E.big('운영으로', '이번 장에서 시도한 네 전략 — 기준(다수 등급)·argmax(확률 최대)·최선 모델(배깅)·기대비용 최소 — 을 같은 140건에 적용한 총비용을 나란히 놓으면 '+COST_BASE28+' → '+COST_ARGMAX28+' → '+COST_BAG28+' → <b>'+COST_EXPCOST28+'</b>로 꾸준히 줄어듭니다. 흥미로운 점은 <b>모델을 더 정교하게 바꾸는 것(배깅, '+(100-COST_BAG28/COST_BASE28*100).toFixed(0)+'% 절감)보다 같은 모델에 비용을 반영한 판정 규칙을 씌우는 것(기대비용, '+(100-COST_EXPCOST28/COST_BASE28*100).toFixed(0)+'% 절감)이 더 크게 이깁니다</b> — 구현 난도는 오히려 후자가 낮습니다. 실제 스케줄러에 넣을 때는 정확도 숫자만으로 끝나지 않습니다: 오판했을 때 되돌릴 수 있는 <b>지연 허용치</b>, 작업 특성이 계절이나 프로젝트에 따라 바뀔 때의 <b>재학습 주기</b>, 그리고 <b>비용행렬 자체가 업무 우선순위 변화에 맞춰 살아있는 문서</b>여야 한다는 점까지 함께 관리해야 이 26%~55%의 절감이 실제 현장에서도 재현됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
