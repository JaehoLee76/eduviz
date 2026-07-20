/* 빅데이터 분석 제13장 — 예측 모델링 과정 훑어보기 (사례: 연비 예측)
   동작(behavior)만. 텍스트=content/bda13.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(평균·상관계수·기울기·RMSE·R²·잔차·차수별 성능)는 전부 아래 고정 배열로부터
   draw/build에서 실제 계산(하드코딩 금지). 회귀는 정규방정식(가우스 소거)을 직접 구현, 다항식 차수도 실제 적합.
   난수 금지 — 24대 차량은 고정 배열, 잡음도 손으로 정한 고정 지그재그값. */
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
  function sd(a){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; s+=d*d; } return Math.sqrt(s/a.length); }
  function rmseFn(y,yh){ var s=0,i; for(i=0;i<y.length;i++){ var d=y[i]-yh[i]; s+=d*d; } return Math.sqrt(s/y.length); }
  function r2Fn(y,yh){ var m=mean(y), ssr=0, sst=0, i; for(i=0;i<y.length;i++){ ssr+=(y[i]-yh[i])*(y[i]-yh[i]); sst+=(y[i]-m)*(y[i]-m); } return 1-ssr/sst; }
  function pearsonR(x,y){ var n=x.length,i,xbar=mean(x),ybar=mean(y),sxy=0,sxx=0,syy=0;
    for(i=0;i<n;i++){ sxy+=(x[i]-xbar)*(y[i]-ybar); sxx+=(x[i]-xbar)*(x[i]-xbar); syy+=(y[i]-ybar)*(y[i]-ybar); }
    return sxy/Math.sqrt(sxx*syy); }

  function simpleReg(x,y){
    var n=x.length, i, xbar=mean(x), ybar=mean(y), sxy=0, sxx=0;
    for(i=0;i<n;i++){ sxy+=(x[i]-xbar)*(y[i]-ybar); sxx+=(x[i]-xbar)*(x[i]-xbar); }
    var b=sxy/sxx, a=ybar-b*xbar, sse=0;
    for(i=0;i<n;i++){ var e=y[i]-(a+b*x[i]); sse+=e*e; }
    var sst=0; for(i=0;i<n;i++) sst+=(y[i]-ybar)*(y[i]-ybar);
    return {a:a,b:b,r2:1-sse/sst};
  }
  function predSimple(a,b,xs){ return xs.map(function(x){ return a+b*x; }); }

  function solveLinSys(Ain,bin){
    var n=Ain.length, i,j,k;
    var M=[]; for(i=0;i<n;i++) M.push(Ain[i].slice().concat([bin[i]]));
    for(i=0;i<n;i++){
      var piv=i; for(k=i+1;k<n;k++) if(Math.abs(M[k][i])>Math.abs(M[piv][i])) piv=k;
      var tmp=M[i]; M[i]=M[piv]; M[piv]=tmp;
      for(k=i+1;k<n;k++){ var f=M[k][i]/M[i][i]; for(j=i;j<=n;j++) M[k][j]-=f*M[i][j]; }
    }
    var x=new Array(n);
    for(i=n-1;i>=0;i--){ var s=M[i][n]; for(j=i+1;j<n;j++) s-=M[i][j]*x[j]; x[i]=s/M[i][i]; }
    return x;
  }
  function olsFitM(Xrows,y){
    var n=Xrows.length, p=Xrows[0].length+1, i,j,k;
    var Xd=[]; for(i=0;i<n;i++) Xd.push([1].concat(Xrows[i]));
    var XtX=[]; for(j=0;j<p;j++){ var row=[]; for(k=0;k<p;k++){ var s=0; for(i=0;i<n;i++) s+=Xd[i][j]*Xd[i][k]; row.push(s); } XtX.push(row); }
    var Xty=[]; for(j=0;j<p;j++){ var s=0; for(i=0;i<n;i++) s+=Xd[i][j]*y[i]; Xty.push(s); }
    return solveLinSys(XtX,Xty);
  }
  function olsPredictM(beta,Xrows){ return Xrows.map(function(r){ var yy=beta[0]; for(var j=0;j<r.length;j++) yy+=beta[j+1]*r[j]; return yy; }); }
  function polyRows(xs,deg){ return xs.map(function(x){ var row=[]; for(var d=1;d<=deg;d++) row.push(Math.pow(x,d)); return row; }); }

  // ── 고정 데이터(난수 금지) — 차량 24대: 엔진 배기량(L) · 고속도로 연비(mpg) ──
  var DISP=[1.0,1.2,1.4,1.6,1.8,2.0,2.2,2.4,2.5,2.7,3.0,3.2,3.4,3.5,3.6,3.8,4.0,4.2,4.6,5.0,5.3,5.7,6.0,6.2];
  var MPG =[39.9,38.3,37.1,36.4,34.9,34.3,33.1,32.6,31.8,31.4,29.8,29.3,28.4,28.5,27.7,27.5,26.7,26.5,25.3,25.0,24.1,24.1,23.7,23.9];
  var N_C=24;
  var TEST_C=[], TRAIN_C=[]; (function(){ for(var i=0;i<N_C;i++){ if(i%4===0) TEST_C.push(i); else TRAIN_C.push(i); } })();
  function pick(arr,idxs){ return idxs.map(function(i){ return arr[i]; }); }

  var scenes = [

  // ══════════ 1. 사례 소개와 데이터 첫인상 ══════════
  { id:'bda13_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"df = pd.read_csv('mpg.csv')", dim:true},
        {t:'df.shape', hl:'df.shape'},
        {t:"df.plot.scatter('disp','mpg')", hl:'.scatter('},
        {t:"df[['disp','mpg']].corr()", hl:'.corr()'},
        {t:'# 관계의 모양을 눈으로 먼저', dim:true}
      ];
      var acti=[1,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'explore.py', acti);
      var caps=['배기량으로 연비를 예측하려 합니다',
                '산점도로 관계를 먼저 봅니다',
                '초반과 후반, 기울기가 다릅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var ay0=44, ay1=250, aMin=0.5,aMax=6.7,mMin=22,mMax=42;
      function PX(x){ return px0+(x-aMin)/(aMax-aMin)*(px1-px0); }
      function PY(m){ return ay1-(m-mMin)/(mMax-mMin)*(ay1-ay0); }

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
        ctx.fillText(N_C+'행 × 2열', px0, 30);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('차량 '+N_C+'대의 기록 — 엔진 배기량(disp, L)으로 고속도로 연비(mpg)를 예측합니다', px0, 50);
        var cy=88;
        ['disp — 엔진 배기량(L)','mpg — 고속도로 연비(예측할 목표)'].forEach(function(lbl,idx){
          ctx.fillStyle= idx===1 ? 'rgba(126,224,176,0.14)':'rgba(255,122,184,0.12)';
          ctx.strokeStyle= idx===1 ? GRN:ROSE; ctx.lineWidth=1;
          roundRect(ctx,px0,cy+idx*36,px1-px0,28,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=TXT; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText(lbl, px0+10, cy+idx*36+18);
        });
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('배기량 최솟값 '+Math.min.apply(null,DISP).toFixed(1)+'L ~ 최댓값 '+Math.max.apply(null,DISP).toFixed(1)+'L,', px0, cy+100);
        ctx.fillText('연비 평균 '+mean(MPG).toFixed(1)+'mpg (표준편차 '+sd(MPG).toFixed(1)+')', px0, cy+120);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('배기량 vs 연비 — 차량 '+N_C+'대', px0, 24);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ay1); ctx.lineTo(px1,ay1); ctx.moveTo(px0,ay0); ctx.lineTo(px0,ay1); ctx.stroke();
        for(i=0;i<N_C;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(DISP[i]),PY(MPG[i]),3.6,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        [1,2,3,4,5,6].forEach(function(v){ ctx.fillText(v+'L', PX(v), ay1+16); });
        ctx.textAlign='right';
        [25,30,35,40].forEach(function(v){ ctx.fillText(v, px0-6, PY(v)+4); });
        var r=pearsonR(DISP,MPG);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('상관계수 r = '+r.toFixed(3)+' — 배기량이 클수록 연비가 뚜렷하게 낮아집니다', px0, ay1+42);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('그런데 점들이 완전한 직선이 아니라 살짝 휘어 있는 것도 보입니다', px0, ay1+64);
      } else {
        var early=TRAIN_C.filter(function(i){ return DISP[i]<=2.5; });
        var late=TRAIN_C.filter(function(i){ return DISP[i]>=4.0; });
        var regE=simpleReg(pick(DISP,early), pick(MPG,early));
        var regL=simpleReg(pick(DISP,late), pick(MPG,late));
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('구간별 기울기 — 정말 휘어 있을까요', px0, 24);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ay1); ctx.lineTo(px1,ay1); ctx.stroke();
        for(i=0;i<N_C;i++){ var col=(DISP[i]<=2.5)?GRN:(DISP[i]>=4.0?ROSE:DIM);
          ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(DISP[i]),PY(MPG[i]),3.4,0,7); ctx.fill(); }
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(PX(1.0),PY(regE.a+regE.b*1.0)); ctx.lineTo(PX(2.5),PY(regE.a+regE.b*2.5)); ctx.stroke();
        ctx.strokeStyle=ROSE; ctx.beginPath();
        ctx.moveTo(PX(4.0),PY(regL.a+regL.b*4.0)); ctx.lineTo(PX(6.2),PY(regL.a+regL.b*6.2)); ctx.stroke();
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=GRN; ctx.fillText('1.0~2.5L 구간 기울기 = '+regE.b.toFixed(2)+' mpg/L', px0, ay1+24);
        ctx.fillStyle=ROSE; ctx.fillText('4.0~6.2L 구간 기울기 = '+regL.b.toFixed(2)+' mpg/L', px0, ay1+46);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('작은 배기량 구간에서 훨씬 가파르게 떨어집니다 — 직선 하나로는 이 굽음을 못 담습니다', px0, ay1+68);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (행·열 → 산점도 → 구간별 기울기)', true);
      E.big('사례 소개와 데이터 첫인상', '11장에서 배운 다섯 단계 — 문제정의부터 최종 해석까지 — 를 이번엔 회귀 문제 하나로 처음부터 끝까지 따라갑니다. 차량 24대의 엔진 배기량으로 고속도로 연비를 예측하는 사례입니다. 산점도를 그려보면 상관계수가 매우 큰 음수로 나와 배기량이 클수록 연비가 뚜렷하게 낮아진다는 걸 보여주지만, 배기량 1.0~2.5L 구간과 4.0~6.2L 구간의 기울기를 각각 따로 구해 비교하면 두 값이 꽤 다릅니다 — 데이터가 곧게 뻗은 직선이 아니라 완만하게 휘어 있다는 첫 단서입니다.'); }
  },

  // ══════════ 2. 훈련·시험 분할과 기준 모델 ══════════
  { id:'bda13_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'X_train, X_test, y_train, y_test =', dim:true},
        {t:'  train_test_split(X, y, test_size=0.25)', hl:'train_test_split'},
        {t:'baseline = y_train.mean()', hl:'.mean()'},
        {t:'rmse(y_test, [baseline]*len(y_test))', hl:'rmse'},
        {t:'# 이걸 이겨야 진짜 학습입니다', dim:true}
      ];
      var acti=[1,1,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'split.py', acti);
      var caps=['훈련·시험을 재현 가능하게 나눕니다',
                '두 집단이 비슷한 분포인지 봅니다',
                '아무것도 안 배운 기준선의 오차'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('훈련 '+TRAIN_C.length+'대 / 시험 '+TEST_C.length+'대로 나눕니다', px0, 32);
        var ay=70, aMin=0.5,aMax=6.7;
        function PX(x){ return px0+(x-aMin)/(aMax-aMin)*(px1-px0); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ay); ctx.lineTo(px1,ay); ctx.stroke();
        for(i=0;i<N_C;i++){ var isTest=(i%4===0);
          ctx.fillStyle=isTest?ROSE:BLU;
          ctx.beginPath(); ctx.arc(PX(DISP[i]),ay,4,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        [1,2,3,4,5,6].forEach(function(v){ ctx.fillText(v+'L', PX(v), ay+20); });
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('파랑 = 훈련('+TRAIN_C.length+'대) — 모델을 만드는 데 씁니다', px0, ay+50);
        ctx.fillStyle=ROSE; ctx.fillText('분홍 = 시험('+TEST_C.length+'대) — 끝까지 채점에만 씁니다', px0, ay+72);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('4대 중 1대꼴로 고정된 규칙(4번째마다)으로 뽑아 항상 같은 결과가 재현됩니다', px0, ay+100);
        ctx.fillText('배기량 전 범위에 골고루 퍼지도록 나뉘어 있는지도 함께 확인해 둡니다', px0, ay+122);
      } else if(s.step===1){
        var mTr=mean(pick(MPG,TRAIN_C)), mTe=mean(pick(MPG,TEST_C));
        var sTr=sd(pick(MPG,TRAIN_C)), sTe=sd(pick(MPG,TEST_C));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('두 집단의 연비 분포 — 비슷해야 공정합니다', px0, 32);
        var by=54, bh=34, bw=(px1-px0-20)/2;
        function box(x,label,m,s,col){
          roundRect(ctx,x,by,bw,bh*2+16,8); ctx.fillStyle=col+'14'; ctx.strokeStyle=col; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(label, x+10, by+20);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
          ctx.fillText('평균 '+m.toFixed(2)+' mpg', x+10, by+44);
          ctx.fillText('표준편차 '+s.toFixed(2), x+10, by+64);
        }
        box(px0,'훈련('+TRAIN_C.length+'대)',mTr,sTr,BLU);
        box(px0+bw+20,'시험('+TEST_C.length+'대)',mTe,sTe,ROSE);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        var gap=Math.abs(mTr-mTe);
        ctx.fillText('평균 차이 = '+gap.toFixed(2)+'mpg — 두 집단이 크게 다르지 않아 비교가 공정합니다', px0, by+bh*2+40);
        ctx.fillText('만약 시험 집단만 유독 큰 차만 몰려 있었다면 채점 자체가 왜곡됐을 것입니다', px0, by+bh*2+62);
      } else {
        var base=mean(pick(MPG,TRAIN_C));
        var predB=TEST_C.map(function(){ return base; });
        var rmseB=rmseFn(pick(MPG,TEST_C), predB);
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('기준 모델 — "무조건 평균으로 찍는다"', px0, 32);
        ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('baseline = '+base.toFixed(2)+' mpg (훈련 평균)', px0, 60);
        var ay=88, ay1b=240, aMin=0.5,aMax=6.7,mMin=22,mMax=42;
        function PX(x){ return px0+(x-aMin)/(aMax-aMin)*(px1-px0); }
        function PY(m){ return ay1b-(m-mMin)/(mMax-mMin)*(ay1b-ay); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ay1b); ctx.lineTo(px1,ay1b); ctx.stroke();
        ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(px0,PY(base)); ctx.lineTo(px1,PY(base)); ctx.stroke(); ctx.setLineDash([]);
        for(i=0;i<TEST_C.length;i++){ var j=TEST_C[i];
          ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(PX(DISP[j]),PY(MPG[j]),4.2,0,7); ctx.fill();
          ctx.strokeStyle='rgba(240,136,138,0.55)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(PX(DISP[j]),PY(MPG[j])); ctx.lineTo(PX(DISP[j]),PY(base)); ctx.stroke(); }
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('시험 RMSE = '+rmseB.toFixed(2)+' mpg', px0, ay1b+22);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('배기량을 아예 무시하고 평균만 찍었을 때의 오차입니다', px0, ay1b+44);
        ctx.fillText('앞으로 만들 어떤 모델이든 이 값보다 나아야 "진짜 배웠다"고 할 수 있습니다', px0, ay1b+64);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (분할 → 분포비교 → 기준선 오차)', true);
      E.big('훈련·시험 분할과 기준 모델', '어떤 모델을 만들기 전에 먼저 잣대부터 세웁니다. 차량 24대를 4대 중 1대꼴로 시험 6대와 훈련 18대로 재현 가능하게 나누고, 두 집단의 연비 평균·표준편차가 비슷한지 확인해 비교가 공정한지 점검합니다. 그리고 배기량을 아예 무시하고 훈련 평균만 찍는 가장 단순한 "기준 모델"의 시험 오차를 먼저 계산해 둡니다 — 이후 어떤 정교한 모델을 만들든 이 숫자를 이기지 못하면 배기량 정보는 아무 쓸모가 없었다는 뜻이 됩니다.'); }
  },

  // ══════════ 3. 단순한 모델부터 ══════════
  { id:'bda13_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var reg=simpleReg(pick(DISP,TRAIN_C), pick(MPG,TRAIN_C));
      var predTr=predSimple(reg.a,reg.b,pick(DISP,TRAIN_C));
      var predTe=predSimple(reg.a,reg.b,pick(DISP,TEST_C));
      var rmseTr=rmseFn(pick(MPG,TRAIN_C),predTr), rmseTe=rmseFn(pick(MPG,TEST_C),predTe);
      var r2Tr=r2Fn(pick(MPG,TRAIN_C),predTr);
      var code=[
        {t:'model = LinearRegression()', hl:'LinearRegression'},
        {t:'model.fit(X_train, y_train)', hl:'.fit('},
        {t:'model.coef_, model.intercept_', hl:'.coef_'},
        {t:'resid = y_train - model.predict(X_train)', hl:'resid'},
        {t:'plt.scatter(disp, resid)', hl:'.scatter('}
      ];
      var acti=[1,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'linear.py', acti);
      var caps=['선형회귀를 훈련 데이터에 맞춥니다',
                '기준선을 이겼는지 실제로 재봅니다',
                '잔차에 남은 무늬를 봅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var ayT=44, ayB=250, aMin=0.5,aMax=6.7,mMin=22,mMax=42;
      function PX(x){ return px0+(x-aMin)/(aMax-aMin)*(px1-px0); }
      function PY(m){ return ayB-(m-mMin)/(mMax-mMin)*(ayB-ayT); }

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('직선 하나로 적합 — 훈련 '+TRAIN_C.length+'대', px0, 24);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,ayB); ctx.lineTo(px1,ayB); ctx.stroke();
        for(i=0;i<TRAIN_C.length;i++){ var j=TRAIN_C[i]; ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(DISP[j]),PY(MPG[j]),3.4,0,7); ctx.fill(); }
        ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
        ctx.moveTo(PX(1.0),PY(reg.a+reg.b*1.0)); ctx.lineTo(PX(6.2),PY(reg.a+reg.b*6.2)); ctx.stroke();
        ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('mpg = '+reg.a.toFixed(2)+' + ('+reg.b.toFixed(2)+') × disp', px0, ayB+26);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('배기량이 1L 늘 때마다 연비가 약 '+Math.abs(reg.b).toFixed(2)+'mpg씩 줄어든다는 뜻입니다', px0, ayB+48);
      } else if(s.step===1){
        var base=mean(pick(MPG,TRAIN_C));
        var rmseBase=rmseFn(pick(MPG,TEST_C), TEST_C.map(function(){return base;}));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('기준선을 이겼을까 — 실제로 재봅니다', px0, 32);
        var rows=[['기준(평균)', rmseBase, DIM],['선형회귀 훈련', rmseTr, BLU],['선형회귀 시험', rmseTe, GRN]];
        var by0=54, rh=46, bw=(px1-px0-140), mx=rmseBase*1.15;
        for(i=0;i<rows.length;i++){
          var y=by0+i*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(rows[i][0], px0, y-4);
          ctx.fillStyle=rows[i][2]+'40'; ctx.strokeStyle=rows[i][2]; ctx.lineWidth=1.3;
          ctx.fillRect(px0+140,y,bw*rows[i][1]/mx,18); ctx.strokeRect(px0+140,y,bw*rows[i][1]/mx,18);
          ctx.fillStyle=rows[i][2]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText(rows[i][1].toFixed(2)+' mpg', px0+140+bw*rows[i][1]/mx+8, y+14);
        }
        ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('R²(훈련) = '+r2Tr.toFixed(3)+' — 연비 변동의 '+(r2Tr*100).toFixed(0)+'%를 배기량으로 설명', px0, by0+3*rh+12);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('기준선보다 훨씬 낮은 오차 — 배기량 정보가 확실히 도움이 됩니다', px0, by0+3*rh+34);
      } else {
        var resid=[]; for(i=0;i<TRAIN_C.length;i++) resid.push(pick(MPG,TRAIN_C)[i]-predTr[i]);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('잔차 — 모델이 놓친 부분', px0, 24);
        var ay0r=44, ay1r=230, rMin=-2.5,rMax=2.5;
        function PYr(r){ return ay0r+(ay1r-ay0r)/2-(r/rMax)*((ay1r-ay0r)/2); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,PYr(0)); ctx.lineTo(px1,PYr(0)); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.moveTo(px0,ay0r); ctx.lineTo(px0,ay1r); ctx.stroke();
        for(i=0;i<TRAIN_C.length;i++){ var j=TRAIN_C[i];
          ctx.fillStyle=(DISP[j]<=2.2||DISP[j]>=4.6)?RED:BLU;
          ctx.beginPath(); ctx.arc(PX(DISP[j]),PYr(resid[i]),3.6,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        [1,2,3,4,5,6].forEach(function(v){ ctx.fillText(v+'L', PX(v), ay1r+16); });
        ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=RED;
        ctx.fillText('양 끝(붉은 점)에서 잔차가 한쪽으로 몰려 있는 무늬가 보입니다', px0, ay1r+38);
        ctx.fillStyle=DIM;
        ctx.fillText('직선이 담지 못한 굽은 패턴 — 1장면에서 본 구간별 기울기 차이와 같은 신호입니다', px0, ay1r+58);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (직선적합 → 기준선비교 → 잔차)', true);
      E.big('단순한 모델부터', '가장 단순한 선형회귀로 시작합니다. 훈련 18대에 직선을 맞추면 배기량 1L가 늘 때마다 연비가 일정하게 줄어든다는 식이 나오고, 시험 오차는 앞서 정한 기준선(평균 찍기)보다 훨씬 낮아 배기량 정보가 분명히 도움이 됩니다. 그런데 잔차(실제값−예측값)를 배기량별로 그려보면 양 끝 구간에서 한쪽으로 몰리는 무늬가 남습니다 — 직선 하나가 담지 못한 굽은 관계가 여전히 남아 있다는 신호이고, 이는 1장면에서 구간별 기울기가 서로 달랐던 것과 같은 이야기입니다.'); }
  },

  // ══════════ 4. 더 유연한 모델과 비교 ══════════
  { id:'bda13_04',
    enter:function(E){ var self=this;
      var trainC=[], testC=[], degs=[1,2,3,4], d, best=null;
      degs.forEach(function(d){
        var betaTr=olsFitM(polyRows(pick(DISP,TRAIN_C),d), pick(MPG,TRAIN_C));
        var predTr=olsPredictM(betaTr, polyRows(pick(DISP,TRAIN_C),d));
        var predTe=olsPredictM(betaTr, polyRows(pick(DISP,TEST_C),d));
        var rTr=rmseFn(pick(MPG,TRAIN_C),predTr), rTe=rmseFn(pick(MPG,TEST_C),predTe);
        trainC.push(rTr); testC.push(rTe);
        if(best===null || rTe<best.val-1e-9) best={deg:d, val:rTe};
      });
      self.s={deg:2, trainC:trainC, testC:testC, best:best};
      E.controls('<div class="ctrl"><label>다항식 차수(모델의 유연함)</label><input type="range" id="b134d" min="1" max="4" step="1" value="2"><output id="b134do">2</output></div>');
      E.bind('#b134d','input',function(e){ self.s.deg=+e.target.value; document.getElementById('b134do').textContent=self.s.deg; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"poly = PolynomialFeatures(degree)", hl:'PolynomialFeatures'},
        {t:'Xp = poly.fit_transform(X_train)', dim:true},
        {t:'model = LinearRegression().fit(Xp,y)', hl:'.fit('},
        {t:'rmse(y_train,·), rmse(y_test,·)', hl:'rmse'},
        {t:'# 차수가 오를수록 유연해집니다', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'flex.py', 2);

      var dIdx=s.deg-1, trR=s.trainC[dIdx], teR=s.testC[dIdx], gap=teR-trR;
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('차수='+s.deg+' → 훈련 RMSE='+trR.toFixed(2)+'mpg', W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('시험 RMSE='+teR.toFixed(2)+'mpg', W*0.04, ry+19);
      ctx.fillStyle=(gap>0.5)?RED:GRN;
      ctx.fillText('격차='+gap.toFixed(2)+'mpg'+(gap>0.5?' (과적합 신호)':' (안정적)'), W*0.04, ry+38);
      ctx.fillStyle=GLD; ctx.fillText('최적 차수 = '+s.best.deg+' (시험 RMSE '+s.best.val.toFixed(2)+')', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('차수가 낮으면(1) 굽은 관계를 못 담고, 높으면(4) 훈련점을', W*0.04, ry+80);
      ctx.fillText('억지로 통과하려다 시험에서 흔들립니다 — 유연할수록 좋은 게 아닙니다', W*0.04, ry+100);

      var px0=W*0.47, px1=W*0.965, pTop=42, pBot=250;
      var allVals=s.trainC.concat(s.testC), yMin=Math.max(0,Math.min.apply(null,allVals)-0.3), yMax=Math.max.apply(null,allVals)+0.4;
      function PXd(d){ return px0+(d-1)/3*(px1-px0); }
      function PYv(v){ return pBot-(v-yMin)/(yMax-yMin)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('훈련 RMSE(금) vs 시험 RMSE(파랑) — 차수 1~4', px0, 14);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        for(var d2=1;d2<=4;d2++){ var x=PXd(d2), y=PYv(arr[d2-1]); if(d2===1) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke(); }
      drawCurve(s.trainC, GLD); drawCurve(s.testC, BLU);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=4;i++){ ctx.fillText(''+i, PXd(i), pBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(PXd(i),pBot); ctx.lineTo(PXd(i),pBot+4); ctx.stroke(); }
      ctx.strokeStyle=GRN; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(PXd(s.best.deg),pTop); ctx.lineTo(PXd(s.best.deg),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('최적='+s.best.deg, PXd(s.best.deg), pTop-10);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXd(s.deg),PYv(trR),5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PXd(s.deg),PYv(teR),5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PXd(s.deg),PYv(trR)); ctx.lineTo(PXd(s.deg),PYv(teR)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('점선 = 현재 슬라이더 위치에서 훈련·시험의 격차', px0, pBot+34);

      E.tapHint(W/2, H*0.95, '슬라이더로 차수를 바꿔 훈련·시험 오차가 갈리는 지점을 찾아보세요', true);
      E.big('더 유연한 모델과 비교', '직선(1차)이 놓친 굽은 관계를 담기 위해 배기량의 제곱, 세제곱 항까지 넣어 더 유연한 다항회귀를 시도합니다. 슬라이더로 차수를 1부터 4까지 움직이면 훈련·시험 오차가 실시간으로 다시 계산됩니다 — 2차로 올리면 두 오차가 함께 뚝 떨어지지만, 4차까지 밀어붙이면 훈련 오차는 계속 낮아져도 시험 오차는 오히려 벌어집니다. 유연한 모델일수록 좋은 것이 아니라, 훈련 데이터의 굴곡까지 외워버리는 과적합의 위험이 커진다는 뜻입니다.'); }
  },

  // ══════════ 5. 선택과 마무리 ══════════
  { id:'bda13_05',
    enter:function(E){ var self=this;
      var base=mean(pick(MPG,TRAIN_C));
      var rmseBase=rmseFn(pick(MPG,TEST_C), TEST_C.map(function(){return base;}));
      var reg1=simpleReg(pick(DISP,TRAIN_C), pick(MPG,TRAIN_C));
      var rmse1=rmseFn(pick(MPG,TEST_C), predSimple(reg1.a,reg1.b,pick(DISP,TEST_C)));
      var beta2=olsFitM(polyRows(pick(DISP,TRAIN_C),2), pick(MPG,TRAIN_C));
      var rmse2=rmseFn(pick(MPG,TEST_C), olsPredictM(beta2, polyRows(pick(DISP,TEST_C),2)));
      var beta4=olsFitM(polyRows(pick(DISP,TRAIN_C),4), pick(MPG,TRAIN_C));
      var rmse4tr=rmseFn(pick(MPG,TRAIN_C), olsPredictM(beta4, polyRows(pick(DISP,TRAIN_C),4)));
      var rmse4=rmseFn(pick(MPG,TEST_C), olsPredictM(beta4, polyRows(pick(DISP,TEST_C),4)));
      self.s={step:0, rows:[
        ['기준(평균)',rmseBase,null,DIM],
        ['선형(1차)',rmse1,r2Fn(pick(MPG,TRAIN_C),predSimple(reg1.a,reg1.b,pick(DISP,TRAIN_C))),BLU],
        ['이차(2차)',rmse2,r2Fn(pick(MPG,TRAIN_C),olsPredictM(beta2,polyRows(pick(DISP,TRAIN_C),2))),GRN],
        ['4차(과적합)',rmse4,r2Fn(pick(MPG,TRAIN_C),olsPredictM(beta4,polyRows(pick(DISP,TRAIN_C),4))),RED]
      ]};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'final = LinearRegression()', hl:'LinearRegression'},
        {t:'final.fit(poly2.fit_transform(X_train), y)', hl:'.fit('},
        {t:'rmse(y_test, final.predict(X_test))', hl:'rmse'},
        {t:'# 정확도·단순함 둘 다 만족', dim:true},
        {t:'# 이 다섯 단계, 20장 내내 반복됩니다', dim:true}
      ];
      var acti=[2,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'final.py', acti);
      var caps=['네 후보를 한 표에 모읍니다',
                '왜 이차 모델을 고르는가',
                '이 사례가 앞으로도 반복됩니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('네 후보 — 시험 RMSE로 나란히', px0, 30);
        var by0=50, rh=54, bw=(px1-px0-150), mx=Math.max.apply(null,s.rows.map(function(r){return r[1];}))*1.15;
        for(i=0;i<s.rows.length;i++){
          var r=s.rows[i], y=by0+i*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(r[0], px0, y-4);
          ctx.fillStyle=r[3]+'40'; ctx.strokeStyle=r[3]; ctx.lineWidth=1.3;
          ctx.fillRect(px0+150,y,bw*r[1]/mx,18); ctx.strokeRect(px0+150,y,bw*r[1]/mx,18);
          ctx.fillStyle=r[3]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText(r[1].toFixed(2)+'mpg'+(r[2]!=null?'  R²='+r[2].toFixed(2):''), px0+150+bw*r[1]/mx+8, y+14);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('4차는 훈련 R²는 가장 높지만 시험 오차는 이차보다 나쁩니다 — 과적합입니다', px0, by0+s.rows.length*rh+6);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('왜 하필 이차 모델인가', px0, 30);
        var lin=s.rows[1], quad=s.rows[2], quart=s.rows[3];
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('선형: 굽은 관계를 못 담아 오차 '+lin[1].toFixed(2)+'mpg', px0, 58);
        ctx.fillStyle=GRN; ctx.fillText('이차: 굽음을 담아 오차 '+quad[1].toFixed(2)+'mpg로 개선', px0, 82);
        ctx.fillStyle=RED; ctx.fillText('4차: 오차 '+quart[1].toFixed(2)+'mpg — 이차보다 오히려 나쁨', px0, 106);
        ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif';
        ctx.fillText('이차가 "충분히 유연하면서도 가장 단순한" 지점입니다', px0, 140);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('같은 시험 오차라면 더 단순한 모델을 고르는 것이 안전합니다(오컴의 면도날)', px0, 170);
        ctx.fillText('여기선 이차가 정확도와 단순함 둘 다에서 앞섭니다', px0, 192);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('이 다섯 단계가 20장 내내 반복됩니다', px0, 32);
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('데이터 첫인상(1) → 훈련/시험 분할과 기준선(2) → 단순한 모델(3)', px0, 62);
        ctx.fillText('→ 더 유연한 모델과 비교(4) → 선택과 마무리(5)', px0, 82);
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('다음 14장부터는 이 다섯 단계 중 "데이터 준비"를 더 깊이 파고듭니다', px0, 116);
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif';
        ctx.fillText('중심화·척도화·왜도 변형·이상치·PCA — 세포 분할 사례로 이어집니다', px0, 150);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('모델이 더 복잡해지고 데이터가 더 커져도, 이 다섯 단계의 뼈대는 그대로입니다', px0, 182);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (네 후보 비교 → 선택이유 → 예고)', true);
      E.big('선택과 마무리', '기준(평균 찍기)·선형·이차·4차, 네 후보를 같은 시험 6대로 나란히 채점합니다. 4차 모델은 훈련 데이터에는 가장 잘 맞지만 시험 오차는 이차보다 오히려 나쁘고, 이차 모델은 배기량과 연비 사이의 굽은 관계를 충분히 담으면서도 4차보다 훨씬 단순합니다 — 같은 성능이라면 더 단순한 쪽을 고르는 것이 안전하다는 원칙에 따라 이차를 최종으로 선택합니다. 데이터를 만나고, 잣대를 세우고, 단순한 모델부터 시작해 더 유연한 후보와 비교하고, 마지막에 성능과 단순함을 함께 저울질하는 이 다섯 단계는 앞으로 20개 장 내내 형태만 바뀐 채 반복됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
