/* 빅데이터 분석 제16장 — 회귀 모델 성능 측정
   동작(behavior)만. 텍스트=content/bda16.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(RMSE·MAE·MAPE·R²·조정R²·편향·분산·재표본 평균/표준오차)는
   아래 고정 배열로부터 draw/build에서 실제 계산(하드코딩 금지). 부트스트랩·k-겹 분할은
   고정 시드 선형합동생성기(LCG) 또는 인덱스 나머지 연산으로 결정적으로 계산.
   난수(Math.random)·시각 의존(Date.now) 절대 금지. */
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
  function sampStd(a){ if(a.length<2) return 0; var m=mean(a),s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/(a.length-1)); }
  function rmseOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++){ var d=ys[i]-preds[i]; s+=d*d; } return Math.sqrt(s/ys.length); }
  function maeOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++) s+=Math.abs(ys[i]-preds[i]); return s/ys.length; }
  function mapeOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++) s+=Math.abs((ys[i]-preds[i])/ys[i]); return 100*s/ys.length; }

  // 정규방정식(가우스 소거) — 다항회귀
  function vander(xs,deg){ return xs.map(function(xv){ var row=[]; for(var p=0;p<=deg;p++) row.push(Math.pow(xv,p)); return row; }); }
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
  function fitRidge(xs,ys,deg,lambda){
    var X=vander(xs,deg), Xt=matT(X), XtX=matMul(Xt,X);
    for(var i=0;i<XtX.length;i++) XtX[i][i]+=lambda;
    var Xty=matVec(Xt,ys);
    return solveLin(XtX,Xty);
  }
  function polyPredict(w,xv){ var s=0; for(var p=0;p<w.length;p++) s+=w[p]*Math.pow(xv,p); return s; }
  function scaleFor(xsAbs){ var xmin=Math.min.apply(null,xsAbs), xmax=Math.max.apply(null,xsAbs);
    return function(xv){ return 2*(xv-xmin)/(xmax-xmin)-1; }; }
  // 다중선형회귀(정규방정식, 절편 포함)
  function olsFitMulti(X,y){
    var n=X.length, p=X[0].length;
    var Xb=X.map(function(row){ return [1].concat(row); });
    var Xt=matT(Xb), XtX=matMul(Xt,Xb), Xty=matVec(Xt,y);
    return solveLin(XtX,Xty); // [intercept, w1..wp]
  }
  function predMulti(w,row){ var s=w[0]; for(var i=0;i<row.length;i++) s+=w[i+1]*row[i]; return s; }
  function r2Of(ys,preds){ var m=mean(ys), ssRes=0, ssTot=0,i; for(i=0;i<ys.length;i++){ ssRes+=(ys[i]-preds[i])*(ys[i]-preds[i]); ssTot+=(ys[i]-m)*(ys[i]-m); } return 1-ssRes/ssTot; }
  function adjR2(r2,n,p){ return 1-(1-r2)*(n-1)/(n-p-1); }

  var scenes = [

  // ══════════ 1. 무엇을 오차라 부를 것인가 ══════════
  { id:'bda16_01',
    enter:function(E){ var self=this;
      var obs =[32,45,28,51,38,60,41,55,35,48,30,58];
      var pred=[33,43,30,49,40,57,39,53,37,46,32,55];
      var trend=[]; // 이상치 크기(0~8, 0.5 간격)에 따른 RMSE·MAE 궤적
      var d0=obs[0]-pred[0];
      for(var k=0;k<=16;k++){
        var kk=k*0.5;
        var pe=pred.slice(); pe[0]=pred[0]-kk;
        trend.push({k:kk, rmse:rmseOf(obs,pe), mae:maeOf(obs,pe)});
      }
      self.s={out:0, obs:obs, pred:pred, trend:trend};
      E.controls('<div class="ctrl"><label>0번째 예측의 이상치 크기</label><input type="range" id="b161k" min="0" max="8" step="0.5" value="0"><output id="b161ko">0.0</output></div>');
      E.bind('#b161k','input',function(e){ self.s.out=+e.target.value; document.getElementById('b161ko').textContent=self.s.out.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'from sklearn.metrics import (', dim:true},
        {t:'  mean_squared_error, mean_absolute_error,', hl:'mean_absolute_error'},
        {t:'  mean_absolute_percentage_error)', hl:'mean_absolute_percentage_error'},
        {t:'rmse = mean_squared_error(y, yhat)**0.5', hl:'mean_squared_error'},
        {t:'mae  = mean_absolute_error(y, yhat)', hl:'mean_absolute_error'},
        {t:'mape = mean_absolute_percentage_error(y, yhat)', hl:'mean_absolute_percentage_error'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'error_metrics.py', 3);

      var pe=s.pred.slice(); pe[0]=s.pred[0]-s.out;
      var rmse=rmseOf(s.obs,pe), mae=maeOf(s.obs,pe), mape=mapeOf(s.obs,pe);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('RMSE = '+rmse.toFixed(2), W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('MAE  = '+mae.toFixed(2), W*0.04, ry+19);
      ctx.fillStyle=BLU; ctx.fillText('MAPE = '+mape.toFixed(1)+'%', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('이상치가 0일 때: RMSE 2.33 · MAE 2.00', W*0.04, ry+62);
      ctx.fillText('슬라이더를 올리면 한 점만 어긋납니다', W*0.04, ry+80);

      var px0=W*0.50, px1=W*0.97, pTop=42, pBot=210;
      var kMax=8, yMax=0; s.trend.forEach(function(t){ if(t.rmse>yMax)yMax=t.rmse; }); yMax=Math.ceil(yMax)+0.5;
      function PXk(kv){ return px0+(kv/kMax)*(px1-px0); }
      function PYv(vv){ return pBot-(vv/yMax)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('이상치 크기에 따른 RMSE(빨강) vs MAE(금)', px0, 16);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(key,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        s.trend.forEach(function(t,ti){ var xx=PXk(t.k), yy=PYv(t[key]); if(ti===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke(); }
      drawCurve('rmse',RED); drawCurve('mae',GLD);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=0;i<=8;i+=2){ ctx.fillText(''+i, PXk(i), pBot+16); }
      var curX=PXk(s.out);
      ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(curX,pTop); ctx.lineTo(curX,pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(curX,PYv(rmse),4.5,0,7); ctx.fill();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(curX,PYv(mae),4.5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('RMSE는 오차를 제곱하므로 큰 이상치 하나에 훨씬 더 민감하게 반응합니다', px0, pBot+36);
      ctx.fillText('MAE는 절댓값만 더하므로 완만하게 증가합니다(같은 이상치라도 둔감)', px0, pBot+54);

      E.tapHint(W/2, H*0.95, '슬라이더로 이상치를 키우며 RMSE·MAE가 갈라지는 정도를 비교하세요', true);
      E.big('무엇을 오차라 부를 것인가', '12건의 예측·관측을 놓고 RMSE·MAE·MAPE를 실제로 계산합니다. 이상치가 없을 때는 RMSE 2.33·MAE 2.00으로 비슷하지만, 슬라이더로 0번째 예측 하나만 크게 어긋나게 만들면 RMSE는 오차를 제곱해서 더하기 때문에 훨씬 가파르게 치솟는 반면(이상치 8일 때 RMSE는 3배 이상 증가), MAE는 절댓값만 더하므로 완만하게 늘어납니다. 같은 예측 결과를 두고도 어떤 지표를 쓰느냐에 따라 「이 모델이 얼마나 나쁜가」에 대한 인상이 크게 달라진다는 뜻입니다 — 이상치가 잦은 데이터라면 MAE가, 큰 오차를 특히 경계해야 하는 문제라면 RMSE가 더 적합합니다.'); }
  },

  // ══════════ 2. R²의 진짜 의미와 한계 ══════════
  { id:'bda16_02',
    enter:function(E){ var self=this;
      // n=12, 진짜 신호 2개 + 잡음 예측변수 7개(고정 배열)
      var z1=[-1.8,-1.2,-0.7,-0.3,0.1,0.4,0.6,0.9,1.2,1.5,1.8,2.1];
      var z2=[0.9,-0.6,1.1,-1.3,0.4,-0.9,1.2,-0.4,0.7,-1.1,0.3,-0.7];
      var noiseY=[0.3,-0.2,0.4,-0.5,0.1,-0.3,0.5,-0.4,0.2,-0.1,0.3,-0.2];
      var y=z1.map(function(v,i){ return 2*v-1.5*z2[i]+noiseY[i]; });
      // 잡음 예측변수 7개(고정, 신호와 무관)
      var noiseCols=[
        [0.6,-0.4,0.9,-0.2,0.3,-0.8,0.5,0.1,-0.6,0.7,-0.3,0.4],
        [-0.3,0.8,-0.5,0.2,-0.7,0.4,-0.1,0.6,0.3,-0.9,0.5,-0.2],
        [0.2,0.5,-0.8,0.6,-0.1,0.3,-0.4,0.9,-0.5,0.1,0.7,-0.6],
        [-0.7,0.1,0.4,-0.6,0.8,-0.3,0.2,-0.5,0.9,-0.1,-0.4,0.6],
        [0.5,-0.9,0.2,0.7,-0.4,0.6,-0.8,0.3,0.1,-0.2,0.9,-0.5],
        [-0.2,0.6,-0.3,0.5,-0.9,0.1,0.7,-0.6,0.4,-0.8,0.2,0.3],
        [0.8,-0.5,0.6,-0.1,0.3,-0.7,0.4,-0.2,0.6,-0.4,0.1,-0.9]
      ];
      var Xall=[]; for(var i=0;i<12;i++){ var row=[z1[i],z2[i]]; noiseCols.forEach(function(c){row.push(c[i]);}); Xall.push(row); }
      var res=[]; var n=12;
      for(var p=1;p<=9;p++){
        var Xp=Xall.map(function(row){ return row.slice(0,p); });
        var w=olsFitMulti(Xp,y);
        var preds=Xp.map(function(row){ return predMulti(w,row); });
        var r2=r2Of(y,preds), ar2=adjR2(r2,n,p);
        res.push({p:p, r2:r2, ar2:ar2});
      }
      self.s={p:1, res:res, n:n};
      E.controls('<div class="ctrl"><label>예측 변수 개수 p (표본 n=12)</label><input type="range" id="b162p" min="1" max="9" step="1" value="1"><output id="b162po">1</output></div>');
      E.bind('#b162p','input',function(e){ self.s.p=+e.target.value; document.getElementById('b162po').textContent=self.s.p; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'model = LinearRegression().fit(X[:, :p], y)', hl:'LinearRegression'},
        {t:'r2 = model.score(X[:, :p], y)', hl:'.score('},
        {t:'adj_r2 = 1 - (1-r2)*(n-1)/(n-p-1)', hl:'adj_r2'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'r2_inflation.py', 1);

      var cur=s.res[s.p-1];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('p='+s.p+'  R² = '+cur.r2.toFixed(3), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('조정 R² = '+cur.ar2.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('처음 2개(p=1,2)만 진짜 신호이고,', W*0.04, ry+42);
      ctx.fillText('3번째부터는 y와 무관한 잡음 변수입니다', W*0.04, ry+60);

      var px0=W*0.50, px1=W*0.97, pTop=40, pBot=234;
      function PXp(pv){ return px0+(pv-1)/8*(px1-px0); }
      function PYr(rv){ return pBot-Math.max(0,rv)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('R²(파랑) vs 조정 R²(초록) — 변수 p=1..9', px0, 14);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(key,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        s.res.forEach(function(r,ri){ var xx=PXp(r.p), yy=PYr(r[key]); if(ri===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke(); }
      drawCurve('r2',BLU); drawCurve('ar2',GRN);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=9;i++){ ctx.fillText(''+i, PXp(i), pBot+16); }
      ctx.strokeStyle=ROSE; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      var cx=PXp(s.p); ctx.beginPath(); ctx.moveTo(cx,pTop); ctx.lineTo(cx,pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(cx,PYr(cur.r2),5,0,7); ctx.fill();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,PYr(cur.ar2),5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('R²는 변수를 더할수록(설령 잡음이라도) 절대 줄지 않지만', px0, pBot+34);
      ctx.fillText('조정 R²는 그 잡음 변수 구간에서 오히려 내려갑니다', px0, pBot+52);

      E.tapHint(W/2, H*0.95, '슬라이더로 잡음 변수를 하나씩 추가하며 두 지표를 비교하세요', true);
      E.big('R²의 진짜 의미와 한계', '표본이 겨우 12건뿐인 데이터에 신호가 되는 변수 2개와, y와 아무 상관 없는 잡음 변수 7개를 하나씩 더하며 R²와 조정 R²를 실제로 계산합니다. R²는 변수를 추가할 때마다 절대 줄지 않습니다 — 잡음 변수라도 훈련 데이터의 우연한 패턴에 맞춰 계수를 조정할 여지가 늘어나기 때문입니다(p=9까지 가면 R²는 0.97 이상으로 치솟습니다). 반면 조정 R²는 변수 수(p)에 대한 벌점이 들어 있어, 진짜 신호 2개를 넘어 잡음 변수를 추가하는 구간부터는 오히려 떨어집니다. R² 하나만 보고 「변수를 늘렸더니 모델이 좋아졌다」고 판단하면 이 함정에 빠지기 쉽습니다.'); }
  },

  // ══════════ 3. 예측 대 관측 그림 ══════════
  { id:'bda16_03',
    enter:function(E){ var self=this; this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var obs=[12,18,9,24,15,30,20,27,11,22,17,26,14,29];
      var states=[
        {name:'좋은 모델 — 편향 거의 없음', pred:obs.map(function(o,i){ var e=[0.6,-0.4,0.8,-0.3,0.5,-0.6,0.4,-0.7,0.3,-0.5,0.6,-0.4,0.5,-0.3][i]; return o+e; })},
        {name:'과소예측 — 큰 값을 줄여서 봄', pred:obs.map(function(o){ return 0.72*o+3.2; })},
        {name:'과대예측 — 전반적으로 부풀림', pred:obs.map(function(o){ return 1.22*o+1.0; })}
      ];
      var code=[
        {t:'plt.scatter(y_true, y_pred)', hl:'y_pred'},
        {t:"plt.plot([lo,hi],[lo,hi],'--')  # 45도선", hl:'45도선'},
        {t:'bias = (y_pred - y_true).mean()', hl:'bias'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'pred_vs_obs.py', 2);
      var cur=states[s.step];
      var bias=0,i2,rmse; var resArr=[];
      for(i2=0;i2<obs.length;i2++){ resArr.push(cur.pred[i2]-obs[i2]); bias+=cur.pred[i2]-obs[i2]; }
      bias/=obs.length; rmse=rmseOf(obs,cur.pred);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText(cur.name, W*0.04, ry);
      ctx.fillStyle=(Math.abs(bias)<1)?GRN:RED; ctx.fillText('평균 편향 = '+(bias>=0?'+':'')+bias.toFixed(2), W*0.04, ry+22);
      ctx.fillStyle=BLU; ctx.fillText('RMSE = '+rmse.toFixed(2), W*0.04, ry+41);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('점이 45도선 위쪽=과대, 아래쪽=과소', W*0.04, ry+64);

      var px0=W*0.50, px1=W*0.965, pTop=30, pBot=250;
      var lo=6, hi=36;
      function PX(v){ return px0+(v-lo)/(hi-lo)*(px1-px0); }
      function PY(v){ return pBot-(v-lo)/(hi-lo)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('예측 대 관측 — 45도 기준선', px0, 16);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.setLineDash([4,3]); ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(PX(lo),PY(lo)); ctx.lineTo(PX(hi),PY(hi)); ctx.stroke(); ctx.setLineDash([]);
      for(i=0;i<obs.length;i++){
        var xx=PX(obs[i]), yy=PY(cur.pred[i]);
        var above=cur.pred[i]>obs[i];
        ctx.fillStyle=above?RED:BLU; ctx.globalAlpha=0.85;
        ctx.beginPath(); ctx.arc(xx,yy,4.5,0,7); ctx.fill(); ctx.globalAlpha=1;
      }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('관측값 →', (px0+px1)/2, pBot+18);
      ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText('예측값 →',0,0); ctx.restore();
      ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 45도선 위=과대예측', px0, pBot+38);
      ctx.fillStyle=BLU; ctx.fillText('● 45도선 아래=과소예측', px0+150, pBot+38);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (좋은 모델 → 과소예측 → 과대예측)', true);
      E.big('예측 대 관측 그림', '같은 14개 관측값에 세 가지 다른 예측 패턴을 겹쳐 45도 기준선과 함께 그립니다. 오차가 무작위로만 흩어진 좋은 모델은 점들이 45도선 양쪽에 고르게 흩어지고 평균 편향이 거의 0(-0.01)입니다. 반면 「과소예측」 패턴(예측=0.72×관측+3.2)은 값이 클수록 점들이 45도선 아래로 계속 처지는 계통적 패턴을 보이며 평균 편향이 -3.4로 뚜렷합니다. 「과대예측」 패턴은 반대로 점들이 선 위쪽에 몰려 평균 편향이 +5.4입니다. RMSE 하나만 보면 이런 계통적 치우침(편향)을 놓치기 쉽지만, 예측 대 관측 그림은 한눈에 드러내 줍니다.'); }
  },

  // ══════════ 4. 분산-편향 트레이드오프 ══════════
  { id:'bda16_04',
    enter:function(E){ var self=this;
      var x=[0,1,2,3,4,5,6,7,8,9];
      function fTrue(xv){ return 3+0.5*xv-0.15*xv*xv+0.01*xv*xv*xv; }
      // 6개의 고정 "세계"(서로 다른 잡음 실현) — 하드코딩된 결정적 잡음 배열
      var noiseWorlds=[
        [0.7,-0.5,0.9,-0.3,0.6,-0.8,0.4,-0.6,0.5,-0.4],
        [-0.6,0.8,-0.4,0.7,-0.9,0.3,-0.5,0.6,-0.3,0.5],
        [0.4,-0.7,0.5,-0.6,0.8,-0.4,0.7,-0.5,0.6,-0.7],
        [-0.8,0.4,-0.6,0.5,-0.3,0.7,-0.4,0.8,-0.6,0.3],
        [0.5,-0.3,0.7,-0.8,0.4,-0.6,0.5,-0.7,0.4,-0.5],
        [-0.4,0.6,-0.5,0.4,-0.7,0.5,-0.6,0.3,-0.8,0.6]
      ];
      var x0=5; // 평가 지점
      var sc=scaleFor(x);
      var degs=[1,2,3,4,5,6];
      var curve=degs.map(function(deg){
        var preds=noiseWorlds.map(function(noise){
          var y=x.map(function(xv,i){ return fTrue(xv)+noise[i]; });
          var w=fitRidge(x.map(sc),y,deg,1e-6);
          return polyPredict(w,sc(x0));
        });
        var mP=mean(preds);
        var bias2=(mP-fTrue(x0))*(mP-fTrue(x0));
        var variance=0; preds.forEach(function(p){ variance+=(p-mP)*(p-mP); }); variance/=preds.length;
        var allNoise=[]; noiseWorlds.forEach(function(nw){ allNoise=allNoise.concat(nw); });
        var noiseVar=sampStd(allNoise)*sampStd(allNoise);
        return {deg:deg, bias2:bias2, variance:variance, noiseVar:noiseVar, total:bias2+variance+noiseVar, preds:preds};
      });
      self.s={deg:1, curve:curve, x0:x0, fTrue:fTrue(x0)};
      E.controls('<div class="ctrl"><label>모델 복잡도 — 다항식 차수</label><input type="range" id="b164d" min="1" max="6" step="1" value="1"><output id="b164do">1</output></div>');
      E.bind('#b164d','input',function(e){ self.s.deg=+e.target.value; document.getElementById('b164do').textContent=self.s.deg; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'preds = [fit(world_i, degree=d).predict(x0)', hl:'.predict('},
        {t:'         for world_i in six_resamples]', dim:true},
        {t:'bias2 = (mean(preds) - f_true(x0))**2', hl:'bias2'},
        {t:'variance = mean((preds - mean(preds))**2)', hl:'variance'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'bias_variance.py', 2);
      var cur=s.curve[s.deg-1];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=RED; ctx.fillText('편향² = '+cur.bias2.toFixed(3), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('분산  = '+cur.variance.toFixed(3), W*0.04, ry+18);
      ctx.fillStyle=DIM; ctx.fillText('잡음σ² = '+cur.noiseVar.toFixed(3), W*0.04, ry+36);
      ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillText('총 MSE = '+cur.total.toFixed(3), W*0.04, ry+58);

      // 스택 막대(현재 차수)
      var bx=W*0.04, bw=W*0.40, by=ry+76, bh=26;
      var totMax=0; s.curve.forEach(function(c){ if(c.total>totMax) totMax=c.total; }); totMax*=1.05;
      var segB=bw*cur.bias2/totMax, segV=bw*cur.variance/totMax, segN=bw*cur.noiseVar/totMax;
      ctx.fillStyle=RED; ctx.fillRect(bx,by,segB,bh);
      ctx.fillStyle=BLU; ctx.fillRect(bx+segB,by,segV,bh);
      ctx.fillStyle=DIM; ctx.fillRect(bx+segB+segV,by,segN,bh);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.strokeRect(bx,by,bw,bh);

      var px0=W*0.50, px1=W*0.965, pTop=44, pBot=246;
      var yMax=0; s.curve.forEach(function(c){ if(c.total>yMax)yMax=c.total; }); yMax*=1.1;
      function PXd(dv){ return px0+(dv-1)/5*(px1-px0); }
      function PYv(vv){ return pBot-(vv/yMax)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('차수별 총 MSE 분해 — 편향²(빨강)+분산(파랑)=U자', px0, 16);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(key,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        s.curve.forEach(function(c,ci){ var xx=PXd(c.deg), yy=PYv(c[key]); if(ci===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke(); }
      drawCurve('bias2',RED); drawCurve('variance',BLU); drawCurve('total',GLD);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=6;i++) ctx.fillText(''+i, PXd(i), pBot+16);
      var cx=PXd(s.deg);
      ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(cx,pTop); ctx.lineTo(cx,pBot); ctx.stroke(); ctx.setLineDash([]);
      ['bias2','variance','total'].forEach(function(key){
        var col=key==='bias2'?RED:(key==='variance'?BLU:GLD);
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,PYv(cur[key]),4,0,7); ctx.fill();
      });
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('낮은 차수=편향 큼, 높은 차수=분산 큼 — 금색(총합)이 그 사이 어딘가에서 최소', px0, pBot+34);

      E.tapHint(W/2, H*0.95, '슬라이더로 차수를 올리며 편향이 줄고 분산이 느는 것을 보세요', true);
      E.big('분산-편향 트레이드오프', '똑같은 참함수에 서로 다른 잡음이 섞인 6개의 「세계」(고정된 잡음 실현)를 만들고, 각 세계에서 같은 차수의 다항식을 적합해 지점 x=5에서의 예측값 6개를 실제로 모읍니다. 차수가 낮으면(예: 1차) 6개의 예측이 서로 비슷하게 모여(분산 작음) 있지만 참값에서 멀리 떨어져(편향² 큼) 있고, 차수가 높으면(예: 6차) 6개의 예측이 세계마다 크게 흩어지며(분산 큼) 평균은 참값에 가까워집니다(편향² 작음). 편향²와 분산, 그리고 데이터 자체의 잡음σ²를 모두 더한 총 MSE는 차수 2~3 부근에서 최소가 되는 U자를 그립니다 — 15장에서 본 과적합의 U자 곡선이 정확히 이 세 조각으로 나뉘어 있었던 것입니다.'); }
  },

  // ══════════ 5. 성능 수치를 신뢰하는 법 ══════════
  { id:'bda16_05',
    enter:function(E){ var self=this;
      var x=[0,1,2,3,4,5,6,7,8,9,10,11];
      var noise=[0.8,-0.6,1.1,-1.3,0.4,-0.9,1.5,-0.3,0.7,-1.1,0.2,-0.5];
      var y=x.map(function(xi,i){ return 3+0.5*xi-0.15*xi*xi+0.01*xi*xi*xi+noise[i]; });
      var N=x.length;
      function foldRmse(deg,offset,K){
        var out=[];
        for(var kf=0;kf<K;kf++){
          var testIdx=[],trainIdx=[];
          for(var j=0;j<N;j++){ if((j+offset)%K===kf) testIdx.push(j); else trainIdx.push(j); }
          var sc=scaleFor(trainIdx.map(function(i2){return x[i2];}));
          var xtr=trainIdx.map(function(i2){return sc(x[i2]);}), ytr=trainIdx.map(function(i2){return y[i2];});
          var xte=testIdx.map(function(i2){return sc(x[i2]);}), yte=testIdx.map(function(i2){return y[i2];});
          var w=fitRidge(xtr,ytr,deg,1e-6);
          out.push(rmseOf(yte, xte.map(function(xv){return polyPredict(w,xv);})));
        }
        return out;
      }
      var rmseA=[], rmseB=[]; // A=차수2(단순), B=차수4(복잡) — 짝지은 4겹×5회
      for(var r=0;r<5;r++){ rmseA=rmseA.concat(foldRmse(2,r,4)); rmseB=rmseB.concat(foldRmse(4,r,4)); }
      var diffs=rmseB.map(function(v,i){ return v-rmseA[i]; });
      var meanDiff=mean(diffs), sdDiff=sampStd(diffs), seDiff=sdDiff/Math.sqrt(diffs.length);
      var distinguishable=Math.abs(meanDiff)>2*seDiff;
      self.s={step:0, rmseA:rmseA, rmseB:rmseB, diffs:diffs, meanDiff:meanDiff, seDiff:seDiff, distinguishable:distinguishable};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'a = cross_val_score(deg2, X, y, cv=RepeatedKFold(5))', hl:'RepeatedKFold'},
        {t:'b = cross_val_score(deg4, X, y, cv=RepeatedKFold(5))', dim:true},
        {t:'diff = b - a          # 폴드마다 짝지어 비교', hl:'diff'},
        {t:'se = diff.std(ddof=1) / sqrt(len(diff))', hl:'.std('}
      ];
      var acti=(s.step===0)?2:3;
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'compare_models.py', acti);
      var caps=['한 폴드만 보면 — 첫 번째 짝지은 비교',
                '20개 폴드 전부의 차이(RMSE_B - RMSE_A)를 봅니다',
                '평균 차이와 표준오차로 「우연인지」 판단합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;
      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('첫 번째 폴드 — 단순(차수2) vs 복잡(차수4)', px0, 30);
        var d0=s.rmseA[0], d1=s.rmseB[0];
        var mx=Math.max(d0,d1)*1.2;
        function bar(y0,label,val,col){
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(label+' RMSE', px0, y0-6);
          var bw=(px1-px0-60)*(val/mx);
          ctx.fillStyle=col+'55'; ctx.strokeStyle=col; ctx.fillRect(px0,y0,bw,24); ctx.strokeRect(px0,y0,bw,24);
          ctx.fillStyle=col; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillText(val.toFixed(3), px0+bw+8, y0+16);
        }
        bar(60,'단순(2차)',d0,BLU); bar(130,'복잡(4차)',d1,GLD);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('이 한 번의 비교만 보면 복잡한 모델이 확연히 나빠 보입니다', px0, 176);
        ctx.fillText('하지만 폴드 하나로 내린 결론은 우연일 위험이 큽니다(15.3장)', px0, 196);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('짝지은 차이(복잡-단순) — 폴드 20개', px0, 26);
        var dMin=Math.min.apply(null,s.diffs), dMax=Math.max.apply(null,s.diffs);
        var lo=Math.min(dMin,0)-0.1, hi=Math.max(dMax,0)+0.1;
        var by=140, bw2=(px1-px0);
        function PXd(v){ return px0+(v-lo)/(hi-lo)*bw2; }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(px0,by); ctx.lineTo(px1,by); ctx.stroke();
        ctx.strokeStyle=DIM; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(PXd(0),by-60); ctx.lineTo(PXd(0),by+60); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('차이=0', PXd(0), by-66);
        s.diffs.forEach(function(d,di){ var yy=by-40+((di%8)*10); ctx.fillStyle=d>0?GLD:BLU; ctx.globalAlpha=0.75;
          ctx.beginPath(); ctx.arc(PXd(d), 60+(di*8)%150, 3.5,0,7); ctx.fill(); ctx.globalAlpha=1; });
        ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(PXd(s.meanDiff),40); ctx.lineTo(PXd(s.meanDiff),210); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('평균 차이='+s.meanDiff.toFixed(3), px0, 232);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('점 20개가 0 주위로 넓게 흩어져 있습니다', px0, 252);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('결론 — 평균 차이 대 표준오차', px0, 30);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('평균 차이 = '+s.meanDiff.toFixed(3), px0, 58);
        ctx.fillStyle=BLU; ctx.fillText('표준오차 = '+s.seDiff.toFixed(3)+' (×2 = '+(2*s.seDiff).toFixed(3)+')', px0, 80);
        ctx.fillStyle=s.distinguishable?RED:GRN;
        ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText(s.distinguishable?'|평균 차이| > 2×표준오차 → 구별 가능':'|평균 차이| < 2×표준오차 → 우연일 수 있음', px0, 106);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText(s.distinguishable?'복잡한 모델이 통계적으로 뚜렷하게 더 나쁩니다':'단 한 번의 시험 점수 차이만으로 「더 낫다」고', px0, 132);
        if(!s.distinguishable) ctx.fillText('단정하기엔 변동폭(표준오차) 대비 차이가 작습니다', px0, 152);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (한 폴드 → 20개 분포 → 통계적 결론)', true);
      E.big('성능 수치를 신뢰하는 법', '같은 데이터를 5회 반복한 4겹 교차검증(폴드 20개)으로 단순(2차)·복잡(4차) 다항회귀를 짝지어 비교합니다. 첫 폴드 하나만 보면 복잡한 모델의 RMSE가 확연히 나빠 보이지만, 20개 폴드 전체의 차이(복잡-단순)를 모으면 평균 '+(s.meanDiff>=0?'+':'')+s.meanDiff.toFixed(3)+'로 0 주위에 넓게 흩어져 있음을 실제로 확인할 수 있습니다. 평균 차이를 표준오차('+s.seDiff.toFixed(3)+', ×2='+(2*s.seDiff).toFixed(3)+')와 비교하면 이 차이가 통계적으로 뚜렷한지, 아니면 「어쩌다 그렇게 보인」 우연의 범위인지 판단할 수 있습니다 — 한 번의 시험 점수로 두 모델의 우열을 단정하면 안 되는 이유가 바로 이 변동폭입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
