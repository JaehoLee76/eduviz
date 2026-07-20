/* 빅데이터 분석 제12장 — 예측 모델링의 세계 (고급 파트의 문을 연다)
   동작(behavior)만. 텍스트=content/bda12.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(계수·표준오차·t값·R²·RMSE·연산량·비용·최적임계값)는 전부 아래 고정 배열로부터
   draw/build에서 실제 계산(하드코딩 금지). 회귀는 정규방정식(가우스 소거)을 직접 구현.
   난수 금지 — 모든 표본은 파일 상단 고정 배열, 잡음도 손으로 정한 고정 지그재그값. */
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
  function rmseFn(y,yh){ var s=0,i; for(i=0;i<y.length;i++){ var d=y[i]-yh[i]; s+=d*d; } return Math.sqrt(s/y.length); }
  function r2Fn(y,yh){ var m=mean(y), ssr=0, sst=0, i; for(i=0;i<y.length;i++){ ssr+=(y[i]-yh[i])*(y[i]-yh[i]); sst+=(y[i]-m)*(y[i]-m); } return 1-ssr/sst; }

  // 단순회귀(폐형): 기울기·절편·표준오차·t값·R² 전부 실계산
  function simpleReg(x,y){
    var n=x.length, i, xbar=mean(x), ybar=mean(y), sxy=0, sxx=0;
    for(i=0;i<n;i++){ sxy+=(x[i]-xbar)*(y[i]-ybar); sxx+=(x[i]-xbar)*(x[i]-xbar); }
    var b=sxy/sxx, a=ybar-b*xbar, sse=0, resid=[];
    for(i=0;i<n;i++){ var e=y[i]-(a+b*x[i]); resid.push(e); sse+=e*e; }
    var sigma2=sse/(n-2), se=Math.sqrt(sigma2/sxx), t=b/se;
    var sst=0; for(i=0;i<n;i++) sst+=(y[i]-ybar)*(y[i]-ybar);
    return {a:a,b:b,se:se,t:t,r2:1-sse/sst,resid:resid};
  }
  function predSimple(a,b,xs){ return xs.map(function(x){ return a+b*x; }); }
  function pearsonR(x,y){ var n=x.length,i,xbar=mean(x),ybar=mean(y),sxy=0,sxx=0,syy=0;
    for(i=0;i<n;i++){ sxy+=(x[i]-xbar)*(y[i]-ybar); sxx+=(x[i]-xbar)*(x[i]-xbar); syy+=(y[i]-ybar)*(y[i]-ybar); }
    return sxy/Math.sqrt(sxx*syy); }

  // 다중회귀: 정규방정식(X'X)b=X'y를 가우스 소거로 직접 풂(사이킷런 결과 베끼기 아님)
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

  function standardize(Xtr,Xte){
    var ncol=Xtr[0].length, means=[], sds=[], c,r;
    for(c=0;c<ncol;c++){ var s=0; for(r=0;r<Xtr.length;r++) s+=Xtr[r][c]; var m=s/Xtr.length;
      var v=0; for(r=0;r<Xtr.length;r++){ var d=Xtr[r][c]-m; v+=d*d; } v/=Xtr.length;
      means.push(m); sds.push(v>1e-9?Math.sqrt(v):1); }
    function tr(X){ var out=[],r2,c2; for(r2=0;r2<X.length;r2++){ var row=[]; for(c2=0;c2<ncol;c2++) row.push((X[r2][c2]-means[c2])/sds[c2]); out.push(row); } return out; }
    return {trS:tr(Xtr), teS:tr(Xte)};
  }
  function knnRegPredict(Xtr,Ytr,Xte,k){
    var out=[]; for(var t=0;t<Xte.length;t++){ var d=[]; for(var j=0;j<Xtr.length;j++){ var s=0; for(var c=0;c<Xte[t].length;c++){ var df=Xte[t][c]-Xtr[j][c]; s+=df*df; } d.push([s,Ytr[j]]); }
      d.sort(function(a,b){ return a[0]-b[0]; }); var sum=0; for(var m=0;m<k;m++) sum+=d[m][1]; out.push(sum/k); }
    return out;
  }

  // ── 고정 데이터(난수 금지) — 아파트 20채: 평수·연식·우편번호끝자리(무관)·가격(억원) ──
  var SIZE =[18,20,22,24,25,27,28,30,31,33,34,36,38,40,42,44,45,47,49,52];
  var AGE  =[18,15,20,10,3,17,8,12,1,19,5,9,22,2,14,4,21,6,3,16];
  var ZIP  =[3,7,1,9,4,6,2,8,5,0,3,7,1,9,4,6,2,8,5,0]; // 가격과 무관한 고정값(예측을 망치는 것 실험용)
  var PRICE=[5.84,6.02,6.37,6.69,7.23,7.21,7.41,7.83,8.10,8.24,8.45,8.84,8.71,9.66,9.59,10.24,9.91,10.71,10.92,11.24];
  var N_H=20;
  var TEST_H=[], TRAIN_H=[]; (function(){ for(var i=0;i<N_H;i++){ if(i%4===0) TEST_H.push(i); else TRAIN_H.push(i); } })();
  function pick(arr,idxs){ return idxs.map(function(i){ return arr[i]; }); }
  function rowsSize(idxs){ return idxs.map(function(i){ return [SIZE[i]]; }); }
  function rowsSizeAge(idxs){ return idxs.map(function(i){ return [SIZE[i],AGE[i]]; }); }
  function rowsSizeAgeZip(idxs){ return idxs.map(function(i){ return [SIZE[i],AGE[i],ZIP[i]]; }); }

  // ── 고정 데이터 — 위험점수 12건(사기 탐지형 이진 문제, 12_5용) ──
  var SCORE=[0.08,0.15,0.22,0.31,0.38,0.44,0.52,0.59,0.66,0.74,0.82,0.91];
  var LABEL=[0,0,0,1,0,1,0,1,1,0,1,1];
  var N_F=12;
  function confAt(th){ var TP=0,FP=0,FN=0,TN=0,i; for(i=0;i<N_F;i++){ var p=(SCORE[i]>=th)?1:0;
      if(LABEL[i]===1&&p===1)TP++; else if(LABEL[i]===0&&p===1)FP++; else if(LABEL[i]===1&&p===0)FN++; else TN++; }
    return {TP:TP,FP:FP,FN:FN,TN:TN, acc:(TP+TN)/N_F, prec:(TP+FP>0)?TP/(TP+FP):0, rec:(TP+FN>0)?TP/(TP+FN):0, cost:FN*10+FP*1}; }

  // ── 로드맵(12_4) — 20장을 5단계로 묶은 고정 분류표 ──
  var CHAPTERS=[
    {n:12,name:'예측세계',stage:0},{n:13,name:'과정훑기',stage:0},
    {n:14,name:'전처리',stage:1},
    {n:15,name:'과적합·튜닝',stage:2},{n:16,name:'회귀성능',stage:2},{n:17,name:'선형·이웃',stage:2},{n:18,name:'비선형회귀',stage:2},{n:19,name:'회귀트리',stage:2},{n:20,name:'용해도정리',stage:2},{n:21,name:'콘크리트',stage:2},
    {n:22,name:'분류성능',stage:3},{n:23,name:'판별분석',stage:3},{n:24,name:'비선형분류',stage:3},{n:25,name:'분류트리',stage:3},{n:26,name:'보조금종합',stage:3},{n:27,name:'불균형',stage:3},{n:28,name:'작업스케줄',stage:3},
    {n:29,name:'변수중요도',stage:4},{n:30,name:'특징선택',stage:4},{n:31,name:'영향요인',stage:4}
  ];
  var STAGE_NAME=['문제정의','데이터준비','모델후보·튜닝','평가','해석·전달'];

  var scenes = [

  // ══════════ 1. 예측이란 무엇인가 ══════════
  { id:'bda12_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"X = df[['size']]; y = df['price']", dim:true},
        {t:"sm.OLS(y, sm.add_constant(X)).fit()", hl:'OLS'},
        {t:'# 계수가 믿을 만한가?', dim:true},
        {t:'model.fit(X_train, y_train)', hl:'.fit('},
        {t:'# 새 집값을 얼마나 맞히는가?', dim:true}
      ];
      var acti=[0,1,3,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'goal.py', acti);
      var caps=['같은 표로 다른 두 질문을 던져 봅니다',
                '설명 모델 — 계수가 믿을 만한가',
                '예측 모델 — 새 집값을 얼마나 맞히는가',
                '같은 데이터, 갈라지는 두 선택'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('아파트 '+N_H+'채 — 평수와 가격', px0, 32);
        var axL=px0, axR=px1, ay0=52, ay1=228, aMin=15,aMax=55,pMin=5,pMax=12;
        function PX(x){ return axL+(x-aMin)/(aMax-aMin)*(axR-axL); }
        function PY(p){ return ay1-(p-pMin)/(pMax-pMin)*(ay1-ay0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axL,ay1); ctx.lineTo(axR,ay1); ctx.moveTo(axL,ay0); ctx.lineTo(axL,ay1); ctx.stroke();
        for(i=0;i<N_H;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(SIZE[i]),PY(PRICE[i]),3.4,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        [20,30,40,50].forEach(function(v){ ctx.fillText(v+'평', PX(v), ay1+16); });
        ctx.textAlign='right';
        [5,8,11].forEach(function(v){ ctx.fillText(v+'억', axL-6, PY(v)+4); });
        var r=pearsonR(SIZE,PRICE);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('평균 '+mean(SIZE).toFixed(1)+'평, 평균 '+mean(PRICE).toFixed(2)+'억, 상관계수 r='+r.toFixed(2), px0, ay1+42);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('이 표 하나로 "왜 비싼가"와 "얼마일까"를 둘 다 물을 수 있습니다', px0, ay1+66);
      } else if(s.step===1){
        var reg=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('설명 모델 — 평수만으로 계수를 본다', px0, 32);
        ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('가격 = '+reg.a.toFixed(2)+' + '+reg.b.toFixed(3)+' × 평수', px0, 58);
        ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('표준오차(SE) = '+reg.se.toFixed(4)+',  t = '+reg.t.toFixed(2), px0, 82);
        ctx.fillStyle=(Math.abs(reg.t)>=2)?GRN:RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('|t| = '+Math.abs(reg.t).toFixed(1)+(Math.abs(reg.t)>=2?' ≥ 2 → 우연으로 보기 어렵습니다':' < 2 → 우연일 수 있습니다'), px0, 106);
        ctx.fillStyle=BLU; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('훈련 적합도 R² = '+reg.r2.toFixed(3), px0, 130);
        var axL=px0, axR=px1, ay0=152, ay1=280, aMin=15,aMax=55,pMin=5,pMax=12;
        function PX(x){ return axL+(x-aMin)/(aMax-aMin)*(axR-axL); }
        function PY(p){ return ay1-(p-pMin)/(pMax-pMin)*(ay1-ay0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axL,ay1); ctx.lineTo(axR,ay1); ctx.stroke();
        for(i=0;i<TRAIN_H.length;i++){ var j=TRAIN_H[i]; ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(SIZE[j]),PY(PRICE[j]),3.2,0,7); ctx.fill(); }
        ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(PX(15),PY(reg.a+reg.b*15)); ctx.lineTo(PX(55),PY(reg.a+reg.b*55)); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('설명의 목적 = 계수 하나(기울기)가 말이 되는지를 재는 것', px0, ay1+18);
      } else if(s.step===2){
        var regA=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
        var predA=predSimple(regA.a,regA.b, pick(SIZE,TEST_H));
        var rmseA=rmseFn(pick(PRICE,TEST_H), predA);
        var betaB=olsFitM(rowsSizeAge(TRAIN_H), pick(PRICE,TRAIN_H));
        var predB=olsPredictM(betaB, rowsSizeAge(TEST_H));
        var rmseB=rmseFn(pick(PRICE,TEST_H), predB);
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('예측 모델 — 평수+연식, 새 집값을 얼마나 맞히는가', px0, 32);
        var by=54, bh=28, bw=(px1-px0-190);
        var mx=Math.max(rmseA,rmseB)*1.15;
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('설명모델(평수만)', px0, by-6);
        ctx.fillStyle='rgba(122,184,255,0.35)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.2;
        ctx.fillRect(px0+190,by,bw*rmseA/mx,bh); ctx.strokeRect(px0+190,by,bw*rmseA/mx,bh);
        ctx.fillStyle=BLU; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('RMSE='+rmseA.toFixed(3)+'억', px0+196, by+19);
        var by2=by+bh+30;
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('예측모델(평수+연식)', px0, by2-6);
        ctx.fillStyle='rgba(126,224,176,0.35)'; ctx.strokeStyle=GRN;
        ctx.fillRect(px0+190,by2,bw*rmseB/mx,bh); ctx.strokeRect(px0+190,by2,bw*rmseB/mx,bh);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('RMSE='+rmseB.toFixed(3)+'억', px0+196, by2+19);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        var diff=rmseA-rmseB;
        ctx.fillText('시험 오차가 '+Math.abs(diff).toFixed(3)+'억 '+(diff>0?'줄었습니다':'늘었습니다'), px0, by2+bh+28);
        ctx.fillText('그런데 계수가 둘(평수·연식)로 늘어 "한 문장 설명"은 더 어려워졌습니다', px0, by2+bh+48);
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif';
        ctx.fillText('예측의 목적 = 새 데이터에서의 오차를 최소화하는 것', px0, by2+bh+74);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('같은 데이터, 갈라지는 두 선택', px0, 30);
        var bw=(px1-px0-16)/2, bh=180, by=46;
        roundRect(ctx,px0,by,bw,bh,8); ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 12.5px sans-serif'; ctx.fillText('설명(explain)', px0+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('질문: 왜 비싼가?', px0+10, by+46);
        ctx.fillText('잣대: 계수의 부호·크기·t값', px0+10, by+66);
        ctx.fillText('변수: 이해하기 쉬운 것 위주', px0+10, by+86);
        ctx.fillText('이번 결과: t='+simpleReg(pick(SIZE,TRAIN_H),pick(PRICE,TRAIN_H)).t.toFixed(1)+' → 믿을 만함', px0+10, by+106);
        var bx2=px0+bw+16;
        roundRect(ctx,bx2,by,bw,bh,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('예측(predict)', bx2+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('질문: 다음엔 얼마일까?', bx2+10, by+46);
        ctx.fillText('잣대: held-out 오차(RMSE)', bx2+10, by+66);
        ctx.fillText('변수: 도움만 되면 무엇이든', bx2+10, by+86);
        ctx.fillText('이번 결과: 변수 추가로 오차 감소', bx2+10, by+106);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('같은 데이터라도 목적에 따라 변수 선택과 채점 방법이 달라집니다', px0, by+bh+26);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (산점도 → 설명모델 → 예측모델 → 요약)', true);
      E.big('예측이란 무엇인가', '11장에서 승객 40명의 생존을 처음부터 끝까지 예측해 봤습니다. 이제 그 여정을 지탱하는 원리를 하나씩 짚어보는 고급 파트가 시작됩니다. 같은 아파트 데이터로 "왜 비싼가"(설명)와 "다음 집은 얼마일까"(예측)라는 서로 다른 두 질문을 던져 보면, 설명은 계수 하나의 크기·부호·통계적 믿음직함을 재고, 예측은 한 번도 보지 못한 데이터에서의 오차만을 잣대로 삼습니다. 변수를 몇 개 쓸지, 어떤 변수를 쓸지도 이 목적에 따라 완전히 달라집니다.'); }
  },

  // ══════════ 2. 좋은 예측 모델의 조건 ══════════
  { id:'bda12_02',
    enter:function(E){ var self=this;
      var regA=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
      var rmseA=rmseFn(pick(PRICE,TEST_H), predSimple(regA.a,regA.b,pick(SIZE,TEST_H)));
      var betaB=olsFitM(rowsSizeAge(TRAIN_H), pick(PRICE,TRAIN_H));
      var rmseB=rmseFn(pick(PRICE,TEST_H), olsPredictM(betaB, rowsSizeAge(TEST_H)));
      var std=standardize(rowsSizeAge(TRAIN_H), rowsSizeAge(TEST_H));
      var predC=knnRegPredict(std.trS, pick(PRICE,TRAIN_H), std.teS, 3);
      var rmseC=rmseFn(pick(PRICE,TEST_H), predC);
      var opsA=2*1+1, opsB=2*2+1, opsC=TRAIN_H.length*(3*2-1)+3;
      self.s={step:0, rmse:[rmseA,rmseB,rmseC], ops:[opsA,opsB,opsC], coef:[2,3,0]};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"cands = {'linear':LinearRegression(),", hl:'LinearRegression'},
        {t:"  'linear2':LinearRegression(),", dim:true},
        {t:"  'knn3':KNeighborsRegressor(3)}", hl:'KNeighborsRegressor'},
        {t:'for name, m in cands.items():', dim:true},
        {t:'    rmse(y_test, m.predict(X_test))', hl:'rmse'}
      ];
      var acti=[0,4,4,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'tradeoff.py', acti);
      var caps=['세 후보 모델을 나란히 세웁니다',
                '정확도(시험 RMSE)만 보면',
                '해석가능성과 연산비용을 함께 보면',
                '무엇을 우선할지는 상황에 달렸습니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var names=['평수만','평수+연식','k-최근접(3)'], cols=[BLU,GRN,GLD];

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세 후보 — 같은 시험 5채로 채점합니다', px0, 32);
        var by=54, bh=76, gap=10, bw=(px1-px0-2*gap)/3;
        var desc=[['입력 1개','수식 하나로','계산 매우 가벼움'],
                  ['입력 2개','계수 둘로 요약','여전히 가벼움'],
                  ['입력 저장 필요','계수 없음','이웃 15채와 매번 비교']];
        for(i=0;i<3;i++){
          var bx=px0+i*(bw+gap);
          roundRect(ctx,bx,by,bw,bh,8); ctx.fillStyle=cols[i]+'18'; ctx.strokeStyle=cols[i]; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
          ctx.fillStyle=cols[i]; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
          ctx.fillText(names[i], bx+8, by+18);
          ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
          for(var k=0;k<3;k++) ctx.fillText(desc[i][k], bx+8, by+38+k*16);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('훈련 '+TRAIN_H.length+'채로 배우고, 처음 보는 '+TEST_H.length+'채로 셋 다 채점합니다', px0, by+bh+30);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('시험 RMSE(억원) — 낮을수록 정확', px0, 32);
        var by0=52, rh=56, bw=(px1-px0-160-92), mx=Math.max.apply(null,s.rmse)*1.15;
        for(i=0;i<3;i++){
          var y=by0+i*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(names[i], px0, y-4);
          ctx.fillStyle=cols[i]+'40'; ctx.strokeStyle=cols[i]; ctx.lineWidth=1.3;
          ctx.fillRect(px0+160,y,bw*s.rmse[i]/mx,20); ctx.strokeRect(px0+160,y,bw*s.rmse[i]/mx,20);
          ctx.fillStyle=cols[i]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText('RMSE='+s.rmse[i].toFixed(3), px0+160+bw+8, y+15);
        }
        var best=0; for(i=1;i<3;i++) if(s.rmse[i]<s.rmse[best]) best=i;
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif';
        ctx.fillText('정확도만 보면 "'+names[best]+'"가 이깁니다 — 그런데 그게 전부일까요?', px0, by0+3*rh+16);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('해석가능성(계수 수)과 연산비용(예측 1건당)', px0, 32);
        var cy=54, rh2=30;
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('모델', px0, cy); ctx.fillText('계수 수', px0+150, cy); ctx.fillText('연산(회)', px0+280, cy);
        for(i=0;i<3;i++){
          var y2=cy+22+i*rh2;
          ctx.fillStyle=cols[i]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText(names[i], px0, y2);
          ctx.fillStyle=TXT; ctx.font='12px ui-monospace,Menlo,monospace';
          ctx.fillText(s.coef[i]===0?'없음':(''+s.coef[i]), px0+150, y2);
          ctx.fillText(''+s.ops[i], px0+280, y2);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('k-최근접은 예측할 때마다 훈련 '+TRAIN_H.length+'채 전부와 거리를 재야 합니다', px0, cy+22+3*rh2+8);
        ctx.fillText('그만큼 계산이 무겁고, "왜 이 값이 나왔는지" 한 문장으로 답하기도 어렵습니다', px0, cy+22+3*rh2+28);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('무엇을 우선할지는 상황에 달렸습니다', px0, 32);
        var rows=[
          ['실시간 서비스(초당 수천 건)','연산비용 최우선', BLU],
          ['금융·의료처럼 규제가 있는 곳','해석가능성 최우선', GRN],
          ['하루 한 번 배치로 돌리는 보고서','정확도 최우선', GLD]
        ];
        var ry=56;
        for(i=0;i<rows.length;i++){
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText('• '+rows[i][0], px0, ry+i*46);
          ctx.fillStyle=rows[i][2]; ctx.font='600 12px sans-serif';
          ctx.fillText('→ '+rows[i][1], px0+16, ry+i*46+20);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('"가장 정확한 모델"이 항상 "가장 좋은 모델"은 아닙니다', px0, ry+rows.length*46+14);
        ctx.fillText('정확도·일반화·해석가능성·계산비용·운영가능성 — 다섯 축을 함께 봐야 합니다', px0, ry+rows.length*46+34);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (후보소개 → 정확도 → 비용·해석 → 종합판단)', true);
      E.big('좋은 예측 모델의 조건', '오차가 가장 작은 모델이 무조건 최선은 아닙니다. 평수만 쓰는 모델, 평수와 연식을 함께 쓰는 모델, k-최근접처럼 이웃을 뒤지는 모델을 같은 시험 데이터로 채점하면 정확도의 순위가 나오지만, 계수 수로 가늠한 해석가능성과 예측 1건당 실제 연산 횟수까지 함께 보면 그림이 달라집니다. 실시간 서비스인지, 규제가 있는 분야인지, 하루 한 번 도는 보고서인지에 따라 정확도·일반화·해석가능성·계산비용·운영가능성 다섯 축의 우선순위가 바뀝니다.'); }
  },

  // ══════════ 3. 예측을 망치는 것들 ══════════
  { id:'bda12_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'X_small = X_train.sample(5)', hl:'.sample(5)'},
        {t:'X_dirty = pd.concat([X_train, out])', hl:'concat'},
        {t:"X_noise = X_train.assign(zip=zip5)", hl:'zip5'},
        {t:'stat = X_all.median()   # 누수!', hl:'X_all'},
        {t:'stat = X_train.median() # 정직함', hl:'X_train'}
      ];
      var acti=[0,1,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ruin.py', acti);
      var caps=['표본이 작으면 계수가 흔들립니다',
                '극단값 하나가 선을 밀어냅니다',
                '무관한 변수는 도움이 안 됩니다',
                '검증 데이터를 미리 들여다보면(누수)'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        var full=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
        var g1=TRAIN_H.slice(0,5), g2=TRAIN_H.slice(5,10);
        var r1=simpleReg(pick(SIZE,g1), pick(PRICE,g1));
        var r2=simpleReg(pick(SIZE,g2), pick(PRICE,g2));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('작은 표본 — 5채씩 두 묶음의 기울기', px0, 32);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('전체 훈련('+TRAIN_H.length+'채) 기울기 b = '+full.b.toFixed(3), px0, 58);
        ctx.fillStyle=BLU; ctx.fillText('5채 묶음A 기울기 b = '+r1.b.toFixed(3)+'  (오차 '+(100*Math.abs(r1.b-full.b)/full.b).toFixed(0)+'%)', px0, 82);
        ctx.fillStyle=ROSE; ctx.fillText('5채 묶음B 기울기 b = '+r2.b.toFixed(3)+'  (오차 '+(100*Math.abs(r2.b-full.b)/full.b).toFixed(0)+'%)', px0, 106);
        var axL=px0, axR=px1, ay0=130, ay1=270, aMin=15,aMax=55,pMin=5,pMax=12;
        function PX(x){ return axL+(x-aMin)/(aMax-aMin)*(axR-axL); }
        function PY(p){ return ay1-(p-pMin)/(pMax-pMin)*(ay1-ay0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axL,ay1); ctx.lineTo(axR,ay1); ctx.stroke();
        function line(reg,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(PX(15),PY(reg.a+reg.b*15)); ctx.lineTo(PX(55),PY(reg.a+reg.b*55)); ctx.stroke(); }
        line(full,GLD); line(r1,BLU); line(r2,ROSE);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('금색=전체 훈련, 파랑=묶음A, 분홍=묶음B — 표본이 작을수록 선이 크게 흔들립니다', px0, ay1+20);
      } else if(s.step===1){
        var clean=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
        var dirtyX=pick(SIZE,TRAIN_H).concat([30]), dirtyY=pick(PRICE,TRAIN_H).concat([20.0]);
        var dirty=simpleReg(dirtyX, dirtyY);
        var rmseClean=rmseFn(pick(PRICE,TEST_H), predSimple(clean.a,clean.b,pick(SIZE,TEST_H)));
        var rmseDirty=rmseFn(pick(PRICE,TEST_H), predSimple(dirty.a,dirty.b,pick(SIZE,TEST_H)));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('극단값 1건 — 30평인데 20억짜리 펜트하우스', px0, 32);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GRN; ctx.fillText('정상 '+TRAIN_H.length+'채: 기울기='+clean.b.toFixed(3)+', R²='+clean.r2.toFixed(3), px0, 58);
        ctx.fillStyle=RED; ctx.fillText('+극단값 1건: 기울기='+dirty.b.toFixed(3)+', R²='+dirty.r2.toFixed(3), px0, 82);
        ctx.fillStyle=(rmseDirty>rmseClean)?RED:GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('시험 RMSE: '+rmseClean.toFixed(3)+'억 → '+rmseDirty.toFixed(3)+'억', px0, 106);
        var axL=px0, axR=px1, ay0=130, ay1=270, aMin=15,aMax=55,pMin=5,pMax=21;
        function PX(x){ return axL+(x-aMin)/(aMax-aMin)*(axR-axL); }
        function PY(p){ return ay1-(p-pMin)/(pMax-pMin)*(ay1-ay0); }
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axL,ay1); ctx.lineTo(axR,ay1); ctx.stroke();
        for(i=0;i<TRAIN_H.length;i++){ var j=TRAIN_H[i]; ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(SIZE[j]),PY(PRICE[j]),3,0,7); ctx.fill(); }
        ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(PX(30),PY(20.0),5,0,7); ctx.fill();
        ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(PX(15),PY(clean.a+clean.b*15)); ctx.lineTo(PX(55),PY(clean.a+clean.b*55)); ctx.stroke();
        ctx.strokeStyle=RED; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(PX(15),PY(dirty.a+dirty.b*15)); ctx.lineTo(PX(55),PY(dirty.a+dirty.b*55)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('점 하나(붉은 점)가 선 전체(점선)를 밀어 올립니다', px0, ay1+18);
      } else if(s.step===2){
        var betaClean=olsFitM(rowsSizeAge(TRAIN_H), pick(PRICE,TRAIN_H));
        var rmseClean2=rmseFn(pick(PRICE,TEST_H), olsPredictM(betaClean, rowsSizeAge(TEST_H)));
        var betaNoisy=olsFitM(rowsSizeAgeZip(TRAIN_H), pick(PRICE,TRAIN_H));
        var rmseNoisy=rmseFn(pick(PRICE,TEST_H), olsPredictM(betaNoisy, rowsSizeAgeZip(TEST_H)));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('무관한 변수 — 우편번호 끝자리를 넣으면?', px0, 32);
        var by=54, bh=28, bw=(px1-px0-210), mx=Math.max(rmseClean2,rmseNoisy)*1.2;
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('평수+연식(2개)', px0, by-6);
        ctx.fillStyle='rgba(126,224,176,0.35)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2;
        ctx.fillRect(px0+210,by,bw*rmseClean2/mx,bh); ctx.strokeRect(px0+210,by,bw*rmseClean2/mx,bh);
        ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('RMSE='+rmseClean2.toFixed(3), px0+216, by+19);
        var by2=by+bh+30;
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('+우편번호끝자리(3개)', px0, by2-6);
        ctx.fillStyle='rgba(240,136,138,0.35)'; ctx.strokeStyle=RED;
        ctx.fillRect(px0+210,by2,bw*rmseNoisy/mx,bh); ctx.strokeRect(px0+210,by2,bw*rmseNoisy/mx,bh);
        ctx.fillStyle=RED; ctx.font='600 12px ui-monospace,Menlo,monospace';
        ctx.fillText('RMSE='+rmseNoisy.toFixed(3), px0+216, by2+19);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        var chg=rmseNoisy-rmseClean2;
        ctx.fillText('무관한 변수를 더했더니 오차가 '+(chg>=0?Math.abs(chg).toFixed(3)+'억 늘었습니다':Math.abs(chg).toFixed(3)+'억 줄었지만 우연일 뿐입니다'), px0, by2+bh+26);
        ctx.fillText('우편번호 끝자리는 가격 생성 방식과 아무 관계 없이 고정한 값입니다', px0, by2+bh+46);
      } else {
        var known=pick(SIZE,TRAIN_H).length;
        var honest=simpleReg(pick(SIZE,TRAIN_H), pick(PRICE,TRAIN_H));
        var rmseHonest=rmseFn(pick(PRICE,TEST_H), predSimple(honest.a,honest.b,pick(SIZE,TEST_H)));
        var cheat=simpleReg(SIZE, PRICE); // 시험 6채까지 포함해 미리 계산(누수)
        var rmseCheat=rmseFn(pick(PRICE,TEST_H), predSimple(cheat.a,cheat.b,pick(SIZE,TEST_H)));
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('누수 — 시험 데이터를 미리 들여다보면', px0, 32);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GRN; ctx.fillText('정직: 훈련 '+TRAIN_H.length+'채로만 학습 → 시험 RMSE='+rmseHonest.toFixed(3)+'억', px0, 58);
        ctx.fillStyle=RED; ctx.fillText('누수: '+N_H+'채(시험 포함) 전체로 학습 → 시험 RMSE='+rmseCheat.toFixed(3)+'억', px0, 84);
        ctx.fillStyle=(rmseCheat<rmseHonest)?GLD:DIM; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('누수 버전이 '+Math.abs(rmseHonest-rmseCheat).toFixed(3)+'억 더 "좋아" 보이지만 그건 반칙입니다', px0, 110);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('시험 데이터의 정답을 학습에 몰래 섞으면,', px0, 138);
        ctx.fillText('모델은 이미 답을 알고 있는 문제를 푸는 셈입니다', px0, 158);
        ctx.fillText('9·11장에서 배운 그 경고 — "훈련 폴드 안에서만', px0, 182);
        ctx.fillText('통계를 계산하라"가 여기서도 그대로 적용됩니다', px0, 202);
        ctx.fillStyle=GLD; ctx.font='600 12px sans-serif';
        ctx.fillText('작은 표본·이상치·무관한 변수·누수 — 넷 다', px0, 232);
        ctx.fillText('"실제보다 좋아 보이게" 만듭니다', px0, 252);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (작은표본 → 이상치 → 무관변수 → 누수)', true);
      E.big('예측을 망치는 것들', '정확한 예측을 방해하는 요인들은 대개 겉으로는 잘 드러나지 않습니다. 5채씩 두 묶음으로만 기울기를 다시 구하면 전체 훈련과 크게 어긋나 표본이 작을수록 결과가 흔들리고, 30평에 20억짜리 극단값 하나를 끼워 넣으면 회귀선 전체가 밀립니다. 가격과 아무 관계 없는 우편번호 끝자리를 변수로 더해도 시험 오차는 나아지지 않고, 시험 데이터의 정보를 학습에 미리 섞는 누수는 겉보기 성능만 부풀립니다. 넷 다 방향은 다르지만 결과는 같습니다 — 모델이 실제보다 더 잘한다고 착각하게 만드는 것입니다.'); }
  },

  // ══════════ 4. 모델링 여정의 지도 ══════════
  { id:'bda12_04',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'prepare_data(df)', hl:'prepare_data'},
        {t:'candidates = [lin, tree, svm, ...]', hl:'candidates'},
        {t:'best = tune(pipe, grid, cv=5)', hl:'tune'},
        {t:'score = evaluate(best, X_test)', hl:'evaluate'},
        {t:'deploy(best)  # 숫자를 말로', hl:'deploy'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'roadmap.py', s.step);
      var caps=['1단계 · 데이터 준비','2단계 · 모델 후보','3단계 · 튜닝','4단계 · 평가','5단계 · 전달'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step]+' — 이 단계에는 몇 개 장이 있을까요', W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var group=CHAPTERS.filter(function(c){ return c.stage===s.step; });
      var stageCols=[ROSE,GLD,BLU,GRN,'#c9a0ff'];
      ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(STAGE_NAME[s.step]+' — 20장 중 '+group.length+'장', px0, 32);

      // 5단계 진행바(전체 지도)
      var barY=52, barH=22, bw=(px1-px0-4*8)/5;
      for(i=0;i<5;i++){
        var bx=px0+i*(bw+8);
        ctx.fillStyle=(i===s.step)?stageCols[i]:'rgba(255,255,255,0.06)';
        ctx.strokeStyle=stageCols[i]; ctx.lineWidth=(i===s.step)?2:1;
        roundRect(ctx,bx,barY,bw,barH,5); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(i===s.step)?'#241522':stageCols[i]; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillText(STAGE_NAME[i], bx+bw/2, barY+15);
      }

      // 해당 단계의 장 칩들
      var cx=px0, cy=112, rowH=30;
      ctx.font='11.5px ui-monospace,Menlo,monospace';
      for(i=0;i<group.length;i++){
        var lbl=group[i].n+'장 '+group[i].name;
        var wchip=ctx.measureText(lbl).width+16;
        if(cx+wchip>px1){ cx=px0; cy+=rowH; }
        var cur=(group[i].n===12||group[i].n===13);
        ctx.fillStyle= cur ? stageCols[s.step]+'40' : stageCols[s.step]+'16';
        ctx.strokeStyle=stageCols[s.step]; ctx.lineWidth=cur?2:1;
        roundRect(ctx,cx,cy-15,wchip,24,6); ctx.fill(); ctx.stroke();
        ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(lbl, cx+8, cy+2);
        cx+=wchip+8;
      }
      var bottomY=cy+rowH+14;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      if(s.step===0) ctx.fillText('지금 여기 있습니다 — 12·13장이 이 문 자체를 엽니다', px0, bottomY);
      else if(s.step===2) ctx.fillText('이 파트에서 가장 두꺼운 구간 — 회귀·분류 모델 후보가 여기 다 모입니다', px0, bottomY);
      else if(s.step===4) ctx.fillText('마지막 3장 — 무엇이 왜 중요한지 사람의 말로 옮깁니다', px0, bottomY);
      else ctx.fillText('20장 전체가 이 다섯 단계 중 하나에 속합니다', px0, bottomY);

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 단계 (준비 → 후보 → 튜닝 → 평가 → 전달)', true);
      E.big('모델링 여정의 지도', '20장이나 되는 고급 파트를 장별로 하나씩 외울 필요는 없습니다. 모든 예측 모델링은 결국 데이터 준비 → 모델 후보 만들기 → 튜닝 → 평가 → 전달이라는 다섯 단계를 돈다는 것만 기억하면 됩니다. 지금 여러분이 서 있는 12·13장은 이 지도 자체를 그리는 문 앞이고, 14장은 데이터 준비, 15장부터 21장까지는 모델 후보를 만들고 다듬는 가장 두꺼운 구간, 22장부터 28장까지는 평가, 마지막 29~31장은 결과를 해석해 전달하는 단계입니다.'); }
  },

  // ══════════ 5. 성공을 정의하는 법 ══════════
  { id:'bda12_05',
    enter:function(E){ var self=this;
      var best=null, bestAcc=null;
      var grid=SCORE.slice().sort(function(a,b){return a-b;});
      grid.forEach(function(th){
        var c=confAt(th);
        if(best===null || c.cost<best.cost) best={th:th, c:c};
        if(bestAcc===null || c.acc>bestAcc.c.acc) bestAcc={th:th, c:bestAcc?bestAcc.c:c};
        if(c.acc>=(bestAcc?bestAcc.c.acc:0)) bestAcc={th:th, c:c};
      });
      self.s={th:0.5, bestCost:best, bestAcc:bestAcc};
      E.controls('<div class="ctrl"><label>판정 임계값</label><input type="range" id="b125th" min="0.05" max="0.95" step="0.01" value="0.5"><output id="b125tho">0.50</output></div>');
      E.bind('#b125th','input',function(e){ self.s.th=+e.target.value; document.getElementById('b125tho').textContent=self.s.th.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'pred = (score >= threshold)', hl:'threshold'},
        {t:'cost = FN*10 + FP*1', hl:'cost'},
        {t:'# 사기 1건 놓침 = 오탐 10건 몫', dim:true},
        {t:'best_th = argmin(cost_by_threshold)', hl:'argmin'},
        {t:'# vs argmax(accuracy) — 다를 수 있음', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'threshold.py', 1);
      var c=confAt(s.th);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('임계값 t='+s.th.toFixed(2)+' → 정확도='+(c.acc*100).toFixed(0)+'%, 재현율='+(c.rec*100).toFixed(0)+'%', W*0.04, ry);
      ctx.fillStyle=(c.cost<=s.bestCost.c.cost)?GRN:RED;
      ctx.fillText('비용(FN×10+FP×1) = '+c.cost, W*0.04, ry+19);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif';
      ctx.fillText('정확도 최댓값 임계값 = '+s.bestAcc.th.toFixed(2)+' (정확도 '+(s.bestAcc.c.acc*100).toFixed(0)+'%, 비용 '+s.bestAcc.c.cost+')', W*0.04, ry+42);
      ctx.fillStyle=GRN;
      ctx.fillText('비용 최소값 임계값 = '+s.bestCost.th.toFixed(2)+' (정확도 '+(s.bestCost.c.acc*100).toFixed(0)+'%, 비용 '+s.bestCost.c.cost+')', W*0.04, ry+62);

      var px0=W*0.47, px1=W*0.965, ay0=42, ay1=210;
      function PX(x){ return px0+x*(px1-px0); }
      ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('위험점수 '+N_F+'건 — 초록=사기 아님, 빨강=사기', px0, 24);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,ay1); ctx.lineTo(px1,ay1); ctx.stroke();
      for(i=0;i<N_F;i++){
        var y=ay0+((i%2)?0:14)+((i*173)%40);
        var yy=ay1-30-(i%3)*22;
        ctx.fillStyle=(LABEL[i]===1)?RED:GRN;
        ctx.beginPath(); ctx.arc(PX(SCORE[i]),yy,4.2,0,7); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
      }
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(PX(s.th),ay0); ctx.lineTo(PX(s.th),ay1); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('t='+s.th.toFixed(2), PX(s.th), ay0-6);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      [0,0.5,1].forEach(function(v){ ctx.fillText(v.toFixed(1), PX(v), ay1+16); });

      var ty=ay1+42;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('TP='+c.TP+' FP='+c.FP+' FN='+c.FN+' TN='+c.TN, px0, ty);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('오른쪽 이동 = 판정을 까다롭게(재현율↓ 정밀도↑), 왼쪽 = 후하게', px0, ty+22);
      ctx.fillText('정확도가 최고인 임계값과 비용이 최저인 임계값이 다를 수 있습니다', px0, ty+42);

      E.tapHint(W/2, H*0.95, '슬라이더로 임계값을 움직여 정확도·비용이 갈리는 지점을 찾아보세요', true);
      E.big('성공을 정의하는 법', '정확도 하나만 성공의 기준으로 삼으면 위험합니다. 사기 탐지처럼 "놓치면 훨씬 비싼"(FN 비용이 FP의 10배) 문제에서는 정확도가 가장 높은 임계값과 실제 비용이 가장 낮은 임계값이 서로 다른 지점에서 나타납니다. 슬라이더로 판정 기준을 움직이면 재현율과 정밀도, 그리고 놓친 사기 1건과 헛짚은 의심거래 1건의 비용 차이가 실시간으로 계산됩니다 — 문제마다 "잘했다"의 정의가 다르면 최적 모델도, 최적 설정도 함께 달라집니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
