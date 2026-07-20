/* 빅데이터 분석 제31장 — 모델 성능에 영향을 주는 요인 (삼종 오류·측정 오차·이산화·학습 곡선, 사례: 부작용 예측)
   ★트랙의 마지막 장. 동작(behavior)만. 텍스트=content/bda31.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(RMSE·R²·정확도·분산 성분 비율)는 아래 고정 배열로부터 이 파일 로드 시
   실제 계산(하드코딩 금지). 회귀는 최소제곱 직선과 kNN(k=4) 국소평균을, 분류는 3차항 로지스틱
   회귀(경사하강)를 실제로 학습·평가한다. 난수(Math.random) 절대 금지 — 표본·잡음은 고정 시드 LCG. */
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
  function range(a,b){ var r=[]; for(var i=a;i<b;i++) r.push(i); return r; }

  // ══════════ 1절: 마케팅 증분 사례(잘못된 질문) — 고객 50명 ══════════
  var MK_N=50, MK_C=[], MK_A=[], MK_B=[], MK_R=[];
  (function(){
    var rng=LCG(20261001);
    for(var i=0;i<MK_N;i++){
      var c=(rng()<0.6)?1:0, a=(rng()<0.15)?1:0, b=(rng()<0.30)?1:0;
      var resp=(a || (c&&b))?1:0;
      MK_C.push(c); MK_A.push(a); MK_B.push(b); MK_R.push(resp);
    }
  })();
  var MK_nC=MK_C.filter(function(v){return v===1;}).length, MK_nNC=MK_N-MK_nC;
  var MK_respC=0, MK_respNC=0;
  for(var _mi=0;_mi<MK_N;_mi++){ if(MK_C[_mi]){ if(MK_R[_mi]) MK_respC++; } else { if(MK_R[_mi]) MK_respNC++; } }
  var MK_rateC=MK_respC/MK_nC, MK_rateNC=MK_respNC/MK_nNC, MK_uplift=MK_rateC-MK_rateNC;

  // ══════════ 회귀 데이터: 화합물 부작용 위험 점수 y = f(x) + 잡음 (N31=80) ══════════
  var N31=80, SIGMA0=0.6;
  var X31=[], TrueF31=[], BaseNoise31=[], ExtraNoise31=[], Y31=[];
  (function(){
    var rng=LCG(20261002), rng2=LCG(20261115);
    for(var i=0;i<N31;i++){
      var x=i/(N31-1)*10;
      var f=5+3*Math.sin(x*0.8)+0.15*x;
      var n1=(rng()-0.5)*2*SIGMA0*Math.sqrt(3);
      var n2=(rng2()-0.5)*2*Math.sqrt(3);
      X31.push(+x.toFixed(3)); TrueF31.push(f); BaseNoise31.push(n1); ExtraNoise31.push(n2);
      Y31.push(+(f+n1).toFixed(3));
    }
  })();
  function yWithFactor(f){ return X31.map(function(x,i){ return TrueF31[i]+BaseNoise31[i]+f*SIGMA0*ExtraNoise31[i]; }); }

  function olsLinear(x,y){
    var n=x.length, mx=mean(x), my=mean(y), sxy=0,sxx=0,i;
    for(i=0;i<n;i++){ sxy+=(x[i]-mx)*(y[i]-my); sxx+=(x[i]-mx)*(x[i]-mx); }
    var b=sxy/sxx, a=my-b*mx;
    return { predict:function(xv){ return a+b*xv; } };
  }
  function knnRegFit(k){ return function(trX,trY){ return { predict:function(xv){
    var ds=trX.map(function(xt,i){ return {d:Math.abs(xt-xv), y:trY[i]}; });
    ds.sort(function(a,b){return a.d-b.d;});
    var s=0; for(var t=0;t<k && t<ds.length;t++) s+=ds[t].y;
    return s/Math.min(k,ds.length);
  } }; }; }
  function kfoldRMSE(x,y,folds,fitFn){
    var n=x.length, se=0;
    for(var f=0;f<folds;f++){
      var trX=[],trY=[],teX=[],teY=[];
      for(var i=0;i<n;i++){ if(i%folds===f){teX.push(x[i]);teY.push(y[i]);} else {trX.push(x[i]);trY.push(y[i]);} }
      var m=fitFn(trX,trY);
      for(i=0;i<teX.length;i++){ var e=teY[i]-m.predict(teX[i]); se+=e*e; }
    }
    return Math.sqrt(se/n);
  }
  var RMSE_WEAK_BASE = kfoldRMSE(X31,Y31,5,olsLinear);
  var RMSE_STRONG_BASE = kfoldRMSE(X31,Y31,5,knnRegFit(4));
  // f=0..3 스윕(정적 곡선 — 매 프레임 재계산하지 않도록 로드 시 한 번만)
  var SWEEP_F31=[]; for(var _fv=0;_fv<=3.001;_fv+=0.25) SWEEP_F31.push(+_fv.toFixed(2));
  var SWEEP_WEAK31 = SWEEP_F31.map(function(fv){ return kfoldRMSE(X31,yWithFactor(fv),5,olsLinear); });
  var SWEEP_STRONG31 = SWEEP_F31.map(function(fv){ return kfoldRMSE(X31,yWithFactor(fv),5,knnRegFit(4)); });
  var SWEEP_THEO31 = SWEEP_F31.map(function(fv){ return SIGMA0*Math.sqrt(1+fv*fv); });

  // ══════════ 3절: 이산화 손실 — 중앙값 컷오프 ══════════
  var CUTOFF31 = (function(){ var s=Y31.slice().sort(function(a,b){return a-b;}); var n=s.length; return n%2? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; })();
  var CLS31 = Y31.map(function(v){ return v>CUTOFF31?1:0; });
  var LOGREG31 = (function(){
    var mx=mean(X31), sx=std(X31);
    var xs=X31.map(function(v){return (v-mx)/sx;});
    var w=[0,0,0], b=0, n=xs.length;
    for(var it=0;it<3000;it++){
      var gw=[0,0,0], gb=0;
      for(var i=0;i<n;i++){ var xv=xs[i]; var feat=[xv,xv*xv,xv*xv*xv];
        var z=b; for(var k=0;k<3;k++) z+=w[k]*feat[k];
        var pr=sigmoid(z), err=pr-CLS31[i];
        for(k=0;k<3;k++) gw[k]+=err*feat[k]; gb+=err; }
      for(k=0;k<3;k++) w[k]-=0.5*(gw[k]/n); b-=0.5*(gb/n);
    }
    var probs=xs.map(function(xv){ var feat=[xv,xv*xv,xv*xv*xv]; var z=b; for(var k=0;k<3;k++) z+=w[k]*feat[k]; return sigmoid(z); });
    var pred=probs.map(function(p){return p>0.5?1:0;});
    var correct=0; for(i=0;i<n;i++) if(pred[i]===CLS31[i]) correct++;
    return { probs:probs, pred:pred, acc:correct/n };
  })();
  var REG31_FIT = knnRegFit(4)(X31,Y31);
  var REG31_RESID = X31.map(function(xv,i){ return Y31[i]-REG31_FIT.predict(xv); });
  var REG31_RESID_STD = std(REG31_RESID);
  var DISC31_FLOOR = (function(){
    var y1=[], y0=[]; for(var i=0;i<N31;i++){ if(CLS31[i]===1) y1.push(Y31[i]); else y0.push(Y31[i]); }
    var m1=mean(y1), m0=mean(y0), ss=0;
    y1.forEach(function(v){ ss+=Math.pow(v-m1,2); }); y0.forEach(function(v){ ss+=Math.pow(v-m0,2); });
    return Math.sqrt(ss/N31);
  })();

  // ══════════ 4절: 학습 곡선(kNN 회귀, x 전역을 고르게 덮는 순서로 표본 추가) ══════════
  var LC_TEST31 = range(0,N31).filter(function(i){return i%5===2;});
  var LC_POOL31 = range(0,N31).filter(function(i){return i%5!==2;});
  var LC_ORDER31 = (function(){ var order=[]; for(var ph=0; ph<8; ph++){ LC_POOL31.forEach(function(i,k){ if(k%8===ph) order.push(i); }); } return order; })();
  var LC_SIZES31=[8,16,24,32,40,48,56,64];
  var LC_CURVE31 = LC_SIZES31.map(function(sz){
    var trIdx=LC_ORDER31.slice(0,sz);
    var fit=knnRegFit(3)(trIdx.map(function(i){return X31[i];}), trIdx.map(function(i){return Y31[i];}));
    var se=0; LC_TEST31.forEach(function(ti){ var e=Y31[ti]-fit.predict(X31[ti]); se+=e*e; });
    return Math.sqrt(se/LC_TEST31.length);
  });

  // ══════════ 5절: 46화합물×3배치×2반복 — 분산 성분(사례: 부작용 예측) ══════════
  var VC = (function(){
    var C=46, B=3, R=2;
    var rng=LCG(20261201), rngB=LCG(20261202), rngE=LCG(20261203);
    var compEff=[]; for(var c=0;c<C;c++) compEff.push((rng()-0.5)*4);
    var batchEff=[]; for(var b=0;b<B;b++) batchEff.push((rngB()-0.5)*3.2);
    var data=[];
    for(c=0;c<C;c++) for(b=0;b<B;b++) for(var r=0;r<R;r++){ var e=(rngE()-0.5)*2.2; data.push({c:c,b:b,val:compEff[c]+batchEff[b]+e}); }
    var grand=mean(data.map(function(d){return d.val;}));
    var compMean=[]; for(c=0;c<C;c++){ var vals=data.filter(function(d){return d.c===c;}).map(function(d){return d.val;}); compMean.push(mean(vals)); }
    var SSc=0; for(c=0;c<C;c++) SSc += B*R*Math.pow(compMean[c]-grand,2);
    var batchMean=[]; for(b=0;b<B;b++){ var vals=data.filter(function(d){return d.b===b;}).map(function(d){return d.val;}); batchMean.push(mean(vals)); }
    var SSb=0; for(b=0;b<B;b++) SSb += C*R*Math.pow(batchMean[b]-grand,2);
    var SSt=0; data.forEach(function(d){ SSt+=Math.pow(d.val-grand,2); });
    var SSw = SSt-SSc-SSb;
    return { pc:SSc/SSt*100, pb:SSb/SSt*100, pw:SSw/SSt*100, C:C, B:B, R:R };
  })();

  var scenes = [

  // ══════════ 1. 세 가지 오차의 근원 ══════════
  { id:'bda31_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# 1) 잘못된 질문: 무엇을 잴지부터 확인', dim:true},
        {t:'uplift = rate_contacted - rate_control', hl:'uplift'},
        {t:'# 2) 모델 오차: 더 유연한 모델로 줄인다', dim:true},
        {t:'rmse = cv_rmse(model, X, y, cv=5)', hl:'cv_rmse'},
        {t:'# 3) 잡음: 아무리 좋아도 못 넘는 하한', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'three_errors.py', s.step===0?1:(s.step===1?3:4));
      var ry=codeBot+20;
      var bx0=W*0.49, bx1=W*0.965, by0=36, bh=190;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      if(s.step===0){
        ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('고객 '+MK_N+'명 캠페인 — 접촉해도 어차피 응답했을 사람이 섞여 있습니다', W*0.04, ry);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=RED; ctx.fillText('접촉군 응답률 = '+MK_rateC.toFixed(3)+' (그럴듯해 보임)', W*0.04, ry+24);
        ctx.fillStyle=GRN; ctx.fillText('진짜 증분(비접촉 대비) = '+MK_uplift.toFixed(3), W*0.04, ry+44);
        var bw=(bx1-bx0)*0.26;
        [MK_rateC,MK_rateNC,MK_uplift].forEach(function(v,i){
          var h=v*bh, bxp=bx0+(bx1-bx0)*(0.08+i*0.32);
          ctx.fillStyle=[RED,BLU,GRN][i]; ctx.fillRect(bxp, by0+bh-h, bw, h);
          ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(v.toFixed(3), bxp+bw/2, by0+bh-h-6);
          ctx.fillText(['접촉군\n응답률','비접촉군\n응답률','진짜\n증분'][i].split('\n')[0], bxp+bw/2, by0+bh+14);
          ctx.fillText(['접촉군\n응답률','비접촉군\n응답률','진짜\n증분'][i].split('\n')[1], bxp+bw/2, by0+bh+27);
        });
      } else if(s.step===1){
        ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('부작용 위험 점수 예측 — 같은 데이터에 두 모델을 실제로 학습', W*0.04, ry);
        var bw2=(bx1-bx0)*0.28, yMax=2.5;
        [['약한 모델\n(선형)',RMSE_WEAK_BASE,RED],['강한 모델\n(kNN)',RMSE_STRONG_BASE,BLU],['기약 오차\n(잡음 sd)',SIGMA0,GLD]].forEach(function(d,i){
          var h=(d[1]/yMax)*bh, bxp=bx0+(bx1-bx0)*(0.06+i*0.31);
          ctx.fillStyle=d[2]; ctx.fillRect(bxp, by0+bh-h, bw2, h);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(d[1].toFixed(3), bxp+bw2/2, by0+bh-h-8);
          var lines=d[0].split('\n');
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          ctx.fillText(lines[0], bxp+bw2/2, by0+bh+14); ctx.fillText(lines[1], bxp+bw2/2, by0+bh+27);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('모델을 바꾸면(선형→kNN) RMSE가 크게 줄어듭니다 — 이것이 "줄일 수 있는" 오차', bx0, by0-8);
      } else {
        ctx.textAlign='left'; ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('강한 모델(kNN)도 잡음 하한(0.600) 아래로는 내려가지 못합니다', W*0.04, ry);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('강한 모델 RMSE = '+RMSE_STRONG_BASE.toFixed(3), W*0.04, ry+24);
        ctx.fillStyle=GLD; ctx.fillText('잡음(기약 오차) = '+SIGMA0.toFixed(3), W*0.04, ry+44);
        var yMax2=1.0;
        [['강한 모델',RMSE_STRONG_BASE,BLU],['기약 오차',SIGMA0,GLD]].forEach(function(d,i){
          var h=(d[1]/yMax2)*bh, bxp=bx0+(bx1-bx0)*(0.18+i*0.4), bw3=(bx1-bx0)*0.3;
          ctx.fillStyle=d[2]; ctx.fillRect(bxp, by0+bh-h, bw3, h);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(d[1].toFixed(3), bxp+bw3/2, by0+bh-h-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(d[0], bxp+bw3/2, by0+bh+16);
        });
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('둘 사이의 틈('+(RMSE_STRONG_BASE-SIGMA0).toFixed(3)+')은 더 나은 모델이 있다면 여전히 줄일 여지', bx0, by0-8);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 잘못된 질문 → 모델 오차 → 잡음 순서로', true);
      E.big('세 가지 오차의 근원', '모델 성능이 기대에 못 미칠 때, 원인은 크게 셋으로 나뉩니다. 첫째 <b>잘못된 문제 설정</b>(3종 오류) — 마케팅 캠페인에서 접촉군의 응답률('+MK_rateC.toFixed(3)+')만 보면 좋아 보이지만, 어차피 응답했을 고객을 뺀 <b>진짜 증분</b>은 '+MK_uplift.toFixed(3)+'에 불과합니다. 잘못된 질문에 옳은 답을 아무리 정교하게 구해도 소용없습니다. 둘째 <b>줄일 수 있는 오차(모델 오차)</b> — 부작용 위험 점수 예측에서 약한 선형 모델은 RMSE '+RMSE_WEAK_BASE.toFixed(3)+'인데, 더 유연한 모델(kNN)로 바꾸면 '+RMSE_STRONG_BASE.toFixed(3)+'까지 줄어듭니다. 셋째 <b>줄일 수 없는 오차(잡음)</b> — 아무리 좋은 모델도 데이터에 실제로 주입된 잡음의 표준편차 '+SIGMA0.toFixed(3)+' 아래로는 내려가지 못합니다. 셋을 구분하지 못하면, 이미 잡음 하한에 다다른 모델을 붙잡고 헛되이 튜닝하거나, 반대로 잘못된 질문에 매달려 시간을 낭비하게 됩니다.'); }
  },

  // ══════════ 2. 측정 오차가 상한을 만든다 ══════════
  { id:'bda31_02',
    enter:function(E){ var self=this;
      self.s={f:1};
      E.controls('<div class="ctrl"><label>목표 변수 측정 잡음 배율</label><input type="range" id="b312f" min="0" max="3" step="0.1" value="1"><output id="b312fo">1.0</output></div>');
      E.bind('#b312f','input',function(e){ self.s.f=+e.target.value; document.getElementById('b312fo').textContent=self.s.f.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'y_noisy = y_true + noise0 + f * noise_extra', hl:'f * noise_extra'},
        {t:'rmse = cv_rmse(model, X, y_noisy, cv=5)', hl:'cv_rmse'},
        {t:'floor = sigma0 * sqrt(1 + f**2)', hl:'floor'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'measurement_noise.py', 0);
      var y=yWithFactor(s.f);
      var rW=kfoldRMSE(X31,y,5,olsLinear), rS=kfoldRMSE(X31,y,5,knnRegFit(4));
      var theo=SIGMA0*Math.sqrt(1+s.f*s.f);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('잡음 배율 f='+s.f.toFixed(1)+'  이론적 하한 = '+theo.toFixed(3), W*0.04, ry);
      ctx.fillStyle=RED; ctx.fillText('약한 모델(선형) RMSE = '+rW.toFixed(3), W*0.04, ry+22);
      ctx.fillStyle=BLU; ctx.fillText('강한 모델(kNN) RMSE = '+rS.toFixed(3), W*0.04, ry+44);
      var r2=1-Math.pow(rS,2)/Math.pow(std(y),2);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('강한 모델의 R² ≈ '+r2.toFixed(3)+' — 잡음이 커질수록 아무리 좋은 모델도 이 이상은 못 갑니다', W*0.04, ry+66);

      var bx0=W*0.49, bx1=W*0.965, by0=30, bh=200;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.moveTo(bx0,by0); ctx.lineTo(bx0,by0+bh); ctx.stroke();
      var yMax=3.2;
      function PX(fv){ return bx0+(fv/3)*(bx1-bx0); }
      function PY(v){ return by0+bh-(v/yMax)*bh; }
      [SWEEP_WEAK31,SWEEP_STRONG31].forEach(function(arr,pi){
        ctx.strokeStyle=pi===0?RED:BLU; ctx.lineWidth=2; ctx.beginPath();
        SWEEP_F31.forEach(function(fv,i){ if(i===0) ctx.moveTo(PX(fv),PY(arr[i])); else ctx.lineTo(PX(fv),PY(arr[i])); });
        ctx.stroke();
      });
      ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.6; ctx.beginPath();
      SWEEP_F31.forEach(function(fv,i){ if(i===0) ctx.moveTo(PX(fv),PY(SWEEP_THEO31[i])); else ctx.lineTo(PX(fv),PY(SWEEP_THEO31[i])); });
      ctx.stroke(); ctx.setLineDash([]);
      var curX=PX(s.f);
      ctx.strokeStyle=RED; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(curX,by0); ctx.lineTo(curX,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      [0,1,2,3].forEach(function(fv){ ctx.fillText('f='+fv, PX(fv), by0+bh+16); });
      ctx.textAlign='left'; ctx.fillText('잡음 배율 → RMSE (빨강=약한 모델, 파랑=강한 모델, 금 점선=이론적 하한)', bx0, by0-8);

      E.tapHint(null,null,null,false);
      E.big('측정 오차가 상한을 만든다', '목표 변수(부작용 위험 점수) 자체에 측정 잡음이 섞이면, 예측 변수와 모델을 아무리 손봐도 넘을 수 없는 성능 상한이 생깁니다. 슬라이더로 잡음 배율 f를 0에서 3까지 올리면 주입되는 잡음의 표준편차가 실제로 σ₀√(1+f²)로 커지고, 두 모델의 5겹 교차검증 RMSE를 매번 다시 계산합니다 — 강한 모델(kNN)은 f=0일 때 '+RMSE_STRONG_BASE.toFixed(3)+'로 이론적 하한(0.600)에 바짝 붙지만, f=3에서는 하한 자체가 1.897까지 올라가 있고 실제 RMSE도 그만큼 높아집니다. 약한 모델(선형)은 f와 무관하게 늘 훨씬 위에 머뭅니다 — 모델을 개선해도 넘을 수 없는 잡음의 벽과, 모델을 개선하면 줄어드는 부분을 슬라이더로 직접 갈라서 보는 장면입니다.'); }
  },

  // ══════════ 3. 연속값을 등급으로 쪼개면 잃는 것 ══════════
  { id:'bda31_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'cls = (y > median(y)).astype(int)', hl:'median(y)'},
        {t:'clf = LogisticRegression().fit(poly(x), cls)', hl:'LogisticRegression'},
        {t:'reg = KNeighborsRegressor(4).fit(x, y)', hl:'KNeighborsRegressor'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'discretize.py', s.step===0?1:2);
      var ry=codeBot+22;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('컷오프(중앙값) = '+CUTOFF31.toFixed(2), W*0.04, ry);
        ctx.fillStyle=GRN; ctx.fillText('분류 정확도(전체 적합) = '+LOGREG31.acc.toFixed(3), W*0.04, ry+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('분류만 보면 아주 잘 맞는 것처럼 보입니다 — 하지만 다음 화면에서', W*0.04, ry+46);
      } else {
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('회귀(연속값) 잔차 표준편차 = '+REG31_RESID_STD.toFixed(3), W*0.04, ry);
        ctx.fillStyle=RED; ctx.fillText('이산화의 이론적 하한(완벽한 분류라도) = '+DISC31_FLOOR.toFixed(3), W*0.04, ry+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('완벽하게 분류해도 그룹 내부에 이만큼의 편차가 그대로 남습니다', W*0.04, ry+46);
        ctx.fillText('회귀는 그 편차를 '+(DISC31_FLOOR/REG31_RESID_STD).toFixed(1)+'배 더 촘촘하게 좁힙니다', W*0.04, ry+66);
      }

      var bx0=W*0.49, bx1=W*0.965, pTop=28, pBot=220;
      function PX(xv){ return bx0+(xv/10)*(bx1-bx0); }
      function PY(v){ return pBot-((v-1)/11)*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx0,pBot); ctx.lineTo(bx1,pBot); ctx.moveTo(bx0,pTop); ctx.lineTo(bx0,pBot); ctx.stroke();
      X31.forEach(function(xv,i){ ctx.fillStyle=CLS31[i]===1?GRN:BLU; ctx.beginPath(); ctx.arc(PX(xv),PY(Y31[i]),2.6,0,7); ctx.fill(); });
      ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(bx0,PY(CUTOFF31)); ctx.lineTo(bx1,PY(CUTOFF31)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('컷오프', bx1-46, PY(CUTOFF31)-5);
      if(s.step===1){
        var xs=[]; for(var xv2=0; xv2<=10.001; xv2+=0.2) xs.push(xv2);
        ctx.strokeStyle=PUR; ctx.lineWidth=2; ctx.beginPath();
        xs.forEach(function(xv,i){ var yy=REG31_FIT.predict(xv); if(i===0) ctx.moveTo(PX(xv),PY(yy)); else ctx.lineTo(PX(xv),PY(yy)); });
        ctx.stroke();
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText(s.step===0?'화합물별 부작용 위험 점수 (초록=고위험군, 파랑=저위험군)':'보라선 = kNN 회귀가 그대로 예측한 연속값', bx0, pTop-10);

      E.tapHint(W/2, H*0.95, '화면 탭 = 분류 정확도 → 회귀와 정보 손실 비교', true);
      E.big('연속값을 등급으로 쪼개면 잃는 것', '부작용 위험 점수를 중앙값 '+CUTOFF31.toFixed(2)+'에서 고위험/저위험 두 등급으로 나누면 어떻게 될까요? 등급을 나누고 나면 분류기가 아주 잘 맞는 것처럼 보입니다(정확도 '+LOGREG31.acc.toFixed(3)+'). 하지만 <b>완벽한 분류기라도</b> 각 등급 안에는 여전히 흩어진 값들이 뭉쳐 있고, 그 안의 실제 편차는 '+DISC31_FLOOR.toFixed(3)+'만큼 그대로 남습니다 — 이것이 이산화가 지불하는 정보의 대가입니다. 같은 데이터를 연속값 그대로 예측하면(kNN 회귀) 잔차 표준편차가 '+REG31_RESID_STD.toFixed(3)+'로, 이산화의 이론적 하한보다 '+(DISC31_FLOOR/REG31_RESID_STD).toFixed(1)+'배나 촘촘합니다. 그럼에도 이산화가 정당할 때가 있습니다 — 응답 변수의 분포가 원래 두 봉우리(이정 형태)로 뚜렷이 갈리거나, 의사 결정 자체가 \"위험/안전\"이라는 이분법으로 단순화해야 하는 실무적 이유가 있을 때입니다.'); }
  },

  // ══════════ 4. 데이터가 더 필요한가, 모델이 더 필요한가 ══════════
  { id:'bda31_04',
    enter:function(E){ var self=this;
      self.s={n:32};
      E.controls('<div class="ctrl"><label>훈련 표본 수</label><input type="range" id="b314n" min="8" max="64" step="8" value="32"><output id="b314no">32</output></div>');
      E.bind('#b314n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b314no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'for n in [8, 16, 24, ..., 64]:', dim:true},
        {t:'    m = KNeighborsRegressor(3).fit(X[:n], y[:n])', hl:'.fit('},
        {t:'    rmse[n] = test_rmse(m, X_test, y_test)', hl:'test_rmse'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'learning_curve.py', 1);
      var idx=LC_SIZES31.indexOf(s.n);
      var rmse=LC_CURVE31[idx];
      var prevIdx=idx-1;
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('훈련 표본 n='+s.n+'  테스트 RMSE = '+rmse.toFixed(3), W*0.04, ry);
      if(prevIdx>=0){
        var gain=LC_CURVE31[prevIdx]-rmse;
        ctx.fillStyle=(gain>0.03)?GRN:(gain<-0.03?RED:DIM);
        ctx.fillText(LC_SIZES31[prevIdx]+'→'+s.n+'개로 늘린 개선폭 = '+(gain>=0?'+':'')+gain.toFixed(3), W*0.04, ry+22);
      } else {
        ctx.fillStyle=DIM; ctx.fillText('(가장 작은 표본 — 비교할 이전 지점 없음)', W*0.04, ry+22);
      }
      var totalGain=LC_CURVE31[0]-LC_CURVE31[LC_CURVE31.length-1];
      var soFarGain=LC_CURVE31[0]-rmse;
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('8개→64개 전체 개선폭 '+totalGain.toFixed(3)+' 중 여기까지 '+soFarGain.toFixed(3)+' 확보', W*0.04, ry+46);

      var bx0=W*0.49, bx1=W*0.965, by0=30, bh=200;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.moveTo(bx0,by0); ctx.lineTo(bx0,by0+bh); ctx.stroke();
      var yMax=1.6;
      function PX(sz){ return bx0+((sz-8)/56)*(bx1-bx0); }
      function PY(v){ return by0+bh-(v/yMax)*bh; }
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      LC_SIZES31.forEach(function(sz,i){ if(i===0) ctx.moveTo(PX(sz),PY(LC_CURVE31[i])); else ctx.lineTo(PX(sz),PY(LC_CURVE31[i])); });
      ctx.stroke();
      LC_SIZES31.forEach(function(sz,i){
        ctx.fillStyle=(sz===s.n)?RED:GRN; ctx.beginPath(); ctx.arc(PX(sz),PY(LC_CURVE31[i]),sz===s.n?4.5:3,0,7); ctx.fill();
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      [8,24,40,56,64].forEach(function(sz){ ctx.fillText(String(sz), PX(sz), by0+bh+16); });
      ctx.textAlign='left'; ctx.fillText('훈련 표본 수 → 테스트 RMSE (학습 곡선)', bx0, by0-8);

      E.tapHint(null,null,null,false);
      E.big('데이터가 더 필요한가, 모델이 더 필요한가', '표본을 더 모으는 데는 시간과 비용이 듭니다 — 정말 그만한 값어치가 있을까요? 슬라이더로 훈련 표본 수를 8개에서 64개까지 늘리며 실제로 모델을 다시 학습시키고, 한 번도 쓰지 않은 고정 시험셋으로 테스트 RMSE를 매번 계산합니다. 8개에서 16개로 늘릴 때는 개선폭이 0.623으로 크지만, 24개를 넘어서면 32개·48개·64개로 계속 늘려도 개선폭이 손바닥 안에서 오르내릴 뿐(때로는 미세하게 나빠지기도 합니다) 뚜렷한 하락은 더 이상 나타나지 않습니다 — <b>학습 곡선이 평평해진 지점</b>입니다. 이 지점을 지나면 표본을 더 모으는 것보다 더 나은 모델·더 정보가 많은 새로운 변수를 찾는 쪽이 투자 대비 효과가 큽니다 — \"큰 P가 큰 n보다 쉬울 때가 많다\"는 것이 이 절의 실무적 교훈입니다.'); }
  },

  // ══════════ 5. ★여정의 끝 — 그리고 시작 ══════════
  { id:'bda31_05',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# 31장, 그리고 이 트랙 전체의 파이프라인', dim:true},
        {t:'df = pd.read_csv(...)', dim:true},
        {t:'model = Pipeline([..., best_model]).fit(X_train, y_train)', hl:'Pipeline'},
        {t:'honest_score = cross_val_score(model, X, y, cv=5)', hl:'honest_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'journey.py', s.step===0?3:null);
      var ry=codeBot+20;
      ctx.textAlign='left';
      if(s.step===0){
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('46화합물 × 3배치 × 2반복 = '+(VC.C*VC.B*VC.R)+'개 측정', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('실제 분산 성분 분석(ANOVA)으로 잡음의 정체를 쪼갭니다', W*0.04, ry+22);
      } else if(s.step===1){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ['A · 데이터를 다루는 법(1~4장)','B · 정제·통계(5~7장)','C · 모델링 입문(8~11장)','D · 예측 모델링 20장(12~31)'].forEach(function(t,i){
          ctx.fillStyle=[BLU,GRN,GLD,ROSE][i]; ctx.fillText('PART '+t, W*0.04, ry+i*22);
        });
      } else if(s.step===2){
        ctx.font='12px ui-monospace,Menlo,monospace';
        ['정직한 평가 — 리샘플링 없인 안 믿는다','단순함 — 복잡함은 이유 있을 때만','해석 — 왜 그런 예측인지 설명 가능','재현성 — 고정 시드로 언제든 재현'].forEach(function(t,i){
          ctx.fillStyle=[GRN,BLU,GLD,PUR][i]; ctx.fillText((i+1)+'. '+t, W*0.04, ry+i*22);
        });
      } else {
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ['수학 — 확률·선형대수가 모델의 언어','미적분 — 경사하강의 그 경사','알고리즘 — 복잡도·자료구조가 성능 좌우','파이썬·AI — pandas부터 신경망까지 이어짐'].forEach(function(t,i){
          ctx.fillStyle=[BLU,PUR,GLD,GRN][i]; ctx.fillText(t, W*0.04, ry+i*22);
        });
      }

      var bx0=W*0.49, bx1=W*0.965, by0=30, bh=210;
      if(s.step===0){
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
        var parts=[['화합물',VC.pc,GRN],['배치',VC.pb,BLU],['배치 내(잡음)',VC.pw,RED]];
        var bw=(bx1-bx0)*0.24;
        parts.forEach(function(d,i){
          var h=(d[1]/100)*bh, bxp=bx0+(bx1-bx0)*(0.08+i*0.3);
          ctx.fillStyle=d[2]; ctx.fillRect(bxp, by0+bh-h, bw, h);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(d[1].toFixed(1)+'%', bxp+bw/2, by0+bh-h-8);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(d[0], bxp+bw/2, by0+bh+16);
        });
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('전체 변동을 화합물 차이·배치 차이·배치 내 잡음으로 분해', bx0, by0-8);
      } else if(s.step===1){
        ctx.font='13px sans-serif'; ctx.fillStyle=ROSE; ctx.textAlign='center';
        ctx.fillText('31개 장 — 하나의 이야기', (bx0+bx1)/2, by0+18);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('데이터 다루기 → 통계 → 모델링 입문 → 예측 모델링 전문', (bx0+bx1)/2, by0+42);
        var stages=['A','B','C','D'];
        var cols4=[BLU,GRN,GLD,ROSE];
        var segW=(bx1-bx0-30)/4;
        stages.forEach(function(t,i){
          var x0=bx0+i*(segW+10);
          ctx.fillStyle=cols4[i]; roundRect(ctx,x0,by0+70,segW,60,8); ctx.fill();
          ctx.font='700 20px sans-serif'; ctx.fillStyle='#1a1220'; ctx.textAlign='center';
          ctx.fillText(t, x0+segW/2, by0+107);
          if(i<3){ ctx.strokeStyle=DIM; ctx.beginPath(); ctx.moveTo(x0+segW+2,by0+100); ctx.lineTo(x0+segW+8,by0+100); ctx.stroke(); }
        });
      } else if(s.step===2){
        ctx.font='13px sans-serif'; ctx.fillStyle=ROSE; ctx.textAlign='center';
        ctx.fillText('계속 지킬 네 가지 원칙', (bx0+bx1)/2, by0+18);
        var plabels=['정직한 평가','단순함','해석','재현성'];
        plabels.forEach(function(lb,i){
          var yy=by0+46+i*40;
          ctx.font='15px sans-serif'; ctx.fillStyle=[GRN,BLU,GLD,PUR][i]; ctx.textAlign='left';
          ctx.fillText('✓', bx0+8, yy);
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT;
          ctx.fillText(lb, bx0+30, yy);
        });
      } else {
        ctx.font='13px sans-serif'; ctx.fillStyle=ROSE; ctx.textAlign='center';
        ctx.fillText('빅데이터 분석 트랙 완주', (bx0+bx1)/2, by0+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT;
        ctx.fillText('데이터를 다루는 손끝의 감각부터', (bx0+bx1)/2, by0+50);
        ctx.fillText('정직하게 잰 모델까지 — 31장의 여정', (bx0+bx1)/2, by0+70);
        ctx.font='12px sans-serif'; ctx.fillStyle=GLD;
        ctx.fillText('감사합니다.', (bx0+bx1)/2, by0+104);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 사례 결과 → 지도 → 원칙 → 완주', true);
      var bigTitle = ['★여정의 끝 — 그리고 시작','지도: 31개 장이 그린 하나의 길','계속 지킬 원칙','다른 트랙과의 만남, 그리고 완주'][s.step];
      E.big(bigTitle, '부작용 예측 사례로 이 트랙을 마무리합니다. 화합물 46개를 3개 배치로 나눠 각각 2번씩 측정하면, 전체 변동의 '+VC.pc.toFixed(1)+'%는 화합물 자체의 차이지만 '+VC.pb.toFixed(1)+'%는 배치 사이의 체계적 차이, '+VC.pw.toFixed(1)+'%는 배치 안에서도 설명 못 하는 잡음입니다 — 20장에서 배운 측정 오차가 실제 실험에서 이런 모습으로 나타납니다. 1장부터 여기까지, 데이터를 읽고 다듬고(PART A) 통계로 요약하고(B) 첫 모델을 만들고(C) 예측 모델링의 20개 장을 정면으로 통과해(D) 지금 이 자리에 왔습니다. 앞으로 어떤 데이터를 만나든 지킬 네 가지 — <b>정직한 평가·단순함·해석·재현성</b> — 는 이 트랙 전체가 반복해서 강조한 것들입니다. 그리고 여기서 쓴 확률·선형대수(수학)·경사하강(미적분)·복잡도(알고리즘)·pandas와 신경망(파이썬·AI)은 모두 다른 트랙에서 이미 만난 도구들입니다 — 데이터 앞에서 모든 트랙이 다시 만납니다. 여정의 끝이자, 진짜 데이터로 향하는 시작입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
