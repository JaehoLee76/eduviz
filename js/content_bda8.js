/* 빅데이터 분석 제8장 — 선형 회귀 (단순회귀·계수해석·적합도·다중공선성·회귀진단)
   동작(behavior)만. 텍스트=content/bda8.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(SSE·R²·계수·상관·VIF·레버리지·Cook's D)는 JS로 실제 계산(하드코딩 금지).
   회귀는 정규방정식(최소제곱)을 직접 풀어 계산 — statsmodels/sklearn 결과를 베끼지 않음.
   난수 금지 — 모든 표본은 파일 상단 고정 배열. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 등폭 코드 패널: lines=[{t,hl?,dim?}|문자열]. hl 토큰만 로즈 강조. 반환=패널 하단 y.
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

  // ── 수치 도구 (골든룰의 심장) ──────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sd(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m);
    return Math.sqrt(s/(a.length-(ddof||0))); }
  function corr(X,Y){ var mx=mean(X), my=mean(Y), sxy=0,sxx=0,syy=0,i;
    for(i=0;i<X.length;i++){ var dx=X[i]-mx, dy=Y[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; }
    return sxy/Math.sqrt(sxx*syy); }

  // 단순회귀 최소제곱해(정규방정식 폐형): b1=Sxy/Sxx, b0=ybar-b1*xbar
  function olsSimple(X,Y){
    var n=X.length, mx=mean(X), my=mean(Y), sxx=0,sxy=0,i;
    for(i=0;i<n;i++){ var dx=X[i]-mx; sxx+=dx*dx; sxy+=dx*(Y[i]-my); }
    var b1=sxy/sxx, b0=my-b1*mx, fitted=[], resid=[], sse=0, sst=0;
    for(i=0;i<n;i++){ var f=b0+b1*X[i]; fitted.push(f); var e=Y[i]-f; resid.push(e); sse+=e*e; sst+=(Y[i]-my)*(Y[i]-my); }
    return {b0:b0,b1:b1,fitted:fitted,resid:resid,sse:sse,sst:sst,r2:1-sse/sst,n:n,mx:mx,my:my,sxx:sxx};
  }

  // 가우스 소거(부분피벗) — 정규방정식 X'Xβ=X'Y 를 직접 풀어 다중회귀 계수를 구함
  function solveLinear(Ain,bin){
    var n=bin.length, A=[], b=bin.slice(), i,j,k;
    for(i=0;i<n;i++) A.push(Ain[i].slice());
    for(k=0;k<n;k++){
      var piv=k, mx=Math.abs(A[k][k]);
      for(i=k+1;i<n;i++){ if(Math.abs(A[i][k])>mx){ mx=Math.abs(A[i][k]); piv=i; } }
      if(piv!==k){ var tmpA=A[k]; A[k]=A[piv]; A[piv]=tmpA; var tmpb=b[k]; b[k]=b[piv]; b[piv]=tmpb; }
      for(i=k+1;i<n;i++){ var f=A[i][k]/A[k][k]; for(j=k;j<n;j++) A[i][j]-=f*A[k][j]; b[i]-=f*b[k]; }
    }
    var x=new Array(n);
    for(i=n-1;i>=0;i--){ var s=b[i]; for(j=i+1;j<n;j++) s-=A[i][j]*x[j]; x[i]=s/A[i][i]; }
    return x;
  }
  // 다중회귀: cols=[X1배열,X2배열,...] (절편 자동 포함) → 정규방정식 직접 조립·소거
  function olsMulti(cols,Y){
    var n=Y.length, p=cols.length+1, i,j,r;
    var XtX=[], XtY=[];
    for(i=0;i<p;i++){ XtX.push(new Array(p).fill(0)); XtY.push(0); }
    for(r=0;r<n;r++){
      var row=[1]; for(j=0;j<cols.length;j++) row.push(cols[j][r]);
      for(i=0;i<p;i++){ XtY[i]+=row[i]*Y[r]; for(j=0;j<p;j++) XtX[i][j]+=row[i]*row[j]; }
    }
    var beta=solveLinear(XtX,XtY), fitted=[], resid=[], sse=0, my=mean(Y), sst=0;
    for(r=0;r<n;r++){ var f=beta[0]; for(j=0;j<cols.length;j++) f+=beta[j+1]*cols[j][r]; fitted.push(f); var e=Y[r]-f; resid.push(e); sse+=e*e; sst+=(Y[r]-my)*(Y[r]-my); }
    return {beta:beta, fitted:fitted, resid:resid, sse:sse, sst:sst, r2:1-sse/sst, n:n};
  }

  // ── 고정 데이터(난수 금지) ──────────────────────────────
  var STUDY_X=[1,2,3,3,4,5,6,6,7,8];           // 공부시간
  var STUDY_Y=[52,55,59,61,64,68,70,73,75,80];  // 시험점수
  var CURV_X=[1,2,3,4,5,6,7,8,9,10];
  var CURV_Y=[43,53,61,69,75,80,84,86,88,88];   // 체감형(위로 볼록) — R²는 높지만 선형적합에 패턴이 남음
  var EXP=[1,2,3,4,5,6,7,8,9,10];               // 경력(년)
  var X2BASE=[5,3,8,2,9,4,7,1,6,10];            // 독립에 가까운 보조 변수(기저)
  var SAL=[32,35,41,38,47,44,53,50,58,61];      // 연봉(백만원 단위 축소)

  var scenes = [

  // ══════════ 1. 직선 하나로 설명하기 — 단순 회귀 ══════════
  { id:'bda8_01',
    enter:function(E){ var self=this; this.s={b0:45, b1:2};
      E.controls('<div class="ctrl"><label>절편 b0</label><input type="range" id="b81a" min="35" max="60" step="1" value="45"><output id="b81ao">45</output></div>'
                +'<div class="ctrl"><label>기울기 b1</label><input type="range" id="b81b" min="0" max="6" step="0.1" value="2"><output id="b81bo">2.0</output></div>');
      E.bind('#b81a','input',function(e){ self.s.b0=+e.target.value; document.getElementById('b81ao').textContent=self.s.b0; });
      E.bind('#b81b','input',function(e){ self.s.b1=+e.target.value; document.getElementById('b81bo').textContent=self.s.b1.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, b0=s.b0, b1=s.b1, i;
      var ols=olsSimple(STUDY_X,STUDY_Y);
      // ★실계산: 현재 슬라이더 (b0,b1)의 SSE
      var sseCur=0; for(i=0;i<STUDY_X.length;i++){ var e=STUDY_Y[i]-(b0+b1*STUDY_X[i]); sseCur+=e*e; }
      var ratio=sseCur/ols.sse;

      var code=[
        {t:'import statsmodels.formula.api as smf', dim:true},
        {t:'m = smf.ols("score~hours", df).fit()', hl:'smf.ols'},
        {t:'b0, b1 = m.params', hl:'m.params'},
        {t:'pred = b0 + b1*hours', hl:'b0 + b1*hours'},
        {t:'resid = score - pred', hl:'resid'},
        {t:'SSE = (resid**2).sum()', hl:'SSE'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ols_fit.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('현재  b0='+b0.toFixed(0)+' · b1='+b1.toFixed(1), W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('SSE(현재) = '+sseCur.toFixed(1), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('SSE(최소) = '+ols.sse.toFixed(1)+'  (b0*='+ols.b0.toFixed(1)+', b1*='+ols.b1.toFixed(2)+')', W*0.04, ry+38);
      ctx.fillStyle=(ratio<1.03)?GRN:DIM;
      ctx.fillText(ratio<1.03?'최소제곱해에 도달했습니다!':(ratio<3?'최소의 '+ratio.toFixed(2)+'배 큽니다':'최소의 '+ratio.toFixed(0)+'배 큽니다'), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('SSE가 가장 작아지는 지점 — 그것이 최소제곱해(OLS)입니다', W*0.04, ry+80);

      // 우측 상단: 산점도 + 현재 직선 + 잔차제곱(정사각형)
      var sx0=W*0.47, sx1=W*0.965, sTop=44, sBot=200, xMin=0,xMax=9, yMin=20,yMax=125;
      function PX(x){ return sx0+(x-xMin)/(xMax-xMin)*(sx1-sx0); }
      function PY(y){ return sBot-(y-yMin)/(yMax-yMin)*(sBot-sTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('● 자료(공부시간→점수)', sx0, 26);
      ctx.fillStyle=ROSE; ctx.fillText('― 현재 직선', sx0+150, 26);
      ctx.fillStyle=RED; ctx.fillText('▨ 잔차의 제곱', sx0+236, 26);
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,sBot); ctx.lineTo(sx1,sBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx0,sTop); ctx.lineTo(sx0,sBot); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=0;i<=9;i+=3){ ctx.fillText(''+i, PX(i), sBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),sBot); ctx.lineTo(PX(i),sBot+4); ctx.stroke(); }
      // 잔차 제곱(먼저 그려 점 아래 깔림)
      for(i=0;i<STUDY_X.length;i++){
        var yd=STUDY_Y[i], pr=b0+b1*STUDY_X[i];
        var py1=PY(yd), py2=PY(pr), side=Math.abs(py1-py2);
        var avail=sx1-(PX(STUDY_X[i])+3);
        side=Math.min(side, avail, 40);
        if(side>1.5){
          ctx.fillStyle='rgba(240,136,138,0.30)'; ctx.strokeStyle=RED; ctx.lineWidth=1;
          var topY=Math.min(py1,py2);
          ctx.fillRect(PX(STUDY_X[i])+3, topY, side, side); ctx.strokeRect(PX(STUDY_X[i])+3, topY, side, side);
        }
        ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(PX(STUDY_X[i]),py1); ctx.lineTo(PX(STUDY_X[i]),py2); ctx.stroke(); ctx.setLineDash([]);
      }
      // 현재 직선(범위 클램프)
      ctx.strokeStyle=ROSE; ctx.lineWidth=2.5; ctx.beginPath();
      var y0c=Math.max(yMin,Math.min(yMax,b0+b1*xMin)), y1c=Math.max(yMin,Math.min(yMax,b0+b1*xMax));
      ctx.moveTo(PX(xMin),PY(y0c)); ctx.lineTo(PX(xMax),PY(y1c)); ctx.stroke();
      // 자료점
      for(i=0;i<STUDY_X.length;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(STUDY_X[i]),PY(STUDY_Y[i]),4,0,7); ctx.fill(); }

      // 우측 하단: SSE(b1) 미니 곡선 (현재 b0에서, b1을 훑을 때) — 최소를 찾는다는 것의 시각화
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('SSE(b1) — 절편을 b0='+b0.toFixed(0)+'로 고정했을 때', sx0, 234);
      var pTop=244, pBot=326, b1Min=0, b1Max=6, i2, grid=[], gmax=0;
      for(i2=0;i2<=60;i2++){ var bb=b1Min+(b1Max-b1Min)*i2/60, se=0;
        for(i=0;i<STUDY_X.length;i++){ var ee=STUDY_Y[i]-(b0+bb*STUDY_X[i]); se+=ee*ee; }
        grid.push(se); if(se>gmax) gmax=se; }
      // 정확한 꼭짓점(도함수=0): b1v = Σx(y-b0)/Σx²
      var num=0, den=0;
      for(i=0;i<STUDY_X.length;i++){ num+=STUDY_X[i]*(STUDY_Y[i]-b0); den+=STUDY_X[i]*STUDY_X[i]; }
      var b1v=num/den, seV=0; for(i=0;i<STUDY_X.length;i++){ var ev=STUDY_Y[i]-(b0+b1v*STUDY_X[i]); seV+=ev*ev; }
      function PXb(x){ return sx0+(x-b1Min)/(b1Max-b1Min)*(sx1-sx0); }
      function PYb(v){ return pBot-(v/(gmax*1.05))*(pBot-pTop); }
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,pBot); ctx.lineTo(sx1,pBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i2=0;i2<=60;i2++){ var bx=b1Min+(b1Max-b1Min)*i2/60; if(i2===0) ctx.moveTo(PXb(bx),PYb(grid[i2])); else ctx.lineTo(PXb(bx),PYb(grid[i2])); }
      ctx.stroke();
      // 전역 OLS b1* 참조선
      if(ols.b1>=b1Min && ols.b1<=b1Max){
        ctx.strokeStyle=GRN; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(PXb(ols.b1),pTop); ctx.lineTo(PXb(ols.b1),pBot); ctx.stroke(); ctx.setLineDash([]);
      }
      // 이 b0에서의 꼭짓점
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PXb(b1v),PYb(seV),4.5,0,7); ctx.fill();
      // 현재 슬라이더 위치(곡선 위에 정확히 놓임)
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXb(b1),PYb(sseCur),5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i2=0;i2<=6;i2+=2){ ctx.fillText(''+i2, PXb(i2), pBot+14);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PXb(i2),pBot); ctx.lineTo(PXb(i2),pBot+3); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('노랑=현재 · 초록점=이 b0에서 최적 b1='+b1v.toFixed(2)+' · 초록선=전역 최적 b1*', sx0, 358);

      E.tapHint(W/2, H*0.95, '슬라이더로 b0·b1을 바꿔 SSE가 가장 작아지는 지점을 찾아보세요', true);
      E.big('직선 하나로 설명하기 — 단순 회귀', '산점도에 가장 잘 맞는 직선을 긋는다는 것은, 모든 점에서 직선까지의 수직 거리(잔차)를 제곱해 더한 값 — 잔차제곱합(SSE) — 을 가장 작게 만드는 직선을 찾는다는 뜻입니다. 슬라이더로 절편·기울기를 움직이면 SSE가 실제로 다시 계산됩니다. 이 최소를 찾는 일이 바로 미적분에서 배운 "도함수가 0이 되는 지점 찾기"이고, 그 답이 최소제곱해(OLS)입니다.'); }
  },

  // ══════════ 2. 계수는 무엇을 말하는가 ══════════
  { id:'bda8_02',
    enter:function(E){ var self=this; this.s={k:1};
      E.controls('<div class="ctrl"><label>단위 배율 k (시간 → k배 단위)</label><input type="range" id="b82k" min="0.5" max="4" step="0.1" value="1"><output id="b82ko">1.0</output></div>');
      E.bind('#b82k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b82ko').textContent=self.s.k.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, k=s.k, i;
      var ols=olsSimple(STUDY_X,STUDY_Y);
      var Xk=[]; for(i=0;i<STUDY_X.length;i++) Xk.push(STUDY_X[i]*k);
      var olsK=olsSimple(Xk,STUDY_Y);
      var sx=sd(STUDY_X,1), sy=sd(STUDY_Y,1);
      var beta=ols.b1*sx/sy;
      var r=corr(STUDY_X,STUDY_Y);

      var code=[
        {t:'b0, b1 = m.params  # 원래 계수', hl:'m.params'},
        {t:'Xk = hours * k        # 단위 변환', hl:'* k'},
        {t:'b1_k = smf.ols("y~Xk",df).fit()', hl:'smf.ols'},
        {t:'      .params["Xk"]  # b1 / k', dim:true},
        {t:'beta = b1 * x.std()/y.std()', hl:'beta'},
        {t:'r, _ = pearsonr(x, y)  # beta==r', hl:'pearsonr'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'interpret.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('원래 계수 b1 = '+ols.b1.toFixed(3)+' 점/시간', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('k='+k.toFixed(1)+'배 단위 → b1_k = '+olsK.b1.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=DIM; ctx.fillText('검산: b1_k × k = '+(olsK.b1*k).toFixed(3)+' (원래 b1과 같아야 함)', W*0.04, ry+38);
      ctx.fillStyle=GRN; ctx.fillText('표준화계수 β = '+beta.toFixed(4)+'  ·  상관계수 r = '+r.toFixed(4), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('절편 b0='+ols.b0.toFixed(1)+'은 단위를 바꿔도 그대로입니다(원점의 의미는 안 변함)', W*0.04, ry+80);

      // 우측 상단: b1'(k) = b1/k 반비례 곡선
      var sx0=W*0.47, sx1=W*0.965, pTop=44, pBot=170, kMin=0.5, kMax=4;
      var yMaxV=Math.max(ols.b1/kMin*1.08, 1);
      function PXk(x){ return sx0+(x-kMin)/(kMax-kMin)*(sx1-sx0); }
      function PYv(v){ return pBot-(v/yMaxV)*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('단위를 k배로 바꾸면 계수는 1/k로 줄어듭니다 (b1_k = b1/k)', sx0, 26);
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,pBot); ctx.lineTo(sx1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx0,pTop); ctx.lineTo(sx0,pBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=70;i++){ var kk=kMin+(kMax-kMin)*i/70, vv=ols.b1/kk;
        if(i===0) ctx.moveTo(PXk(kk),PYv(vv)); else ctx.lineTo(PXk(kk),PYv(vv)); }
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXk(k),PYv(olsK.b1),5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=4;i++){ ctx.fillText(''+i, PXk(i), pBot+14);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PXk(i),pBot); ctx.lineTo(PXk(i),pBot+3); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('가로축 k · 세로축 b1_k (노란 점 = 현재)', sx0, pBot+30);

      // 우측 하단: β vs r 막대 비교
      var by0=224, bw=sx1-sx0-140, scale=bw;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('표준화계수 β 와 상관계수 r — 단순회귀에서는 같은 값입니다', sx0, by0);
      var w1=Math.max(2, Math.abs(beta)*scale);
      ctx.fillStyle='rgba(126,224,176,0.4)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2;
      ctx.fillRect(sx0+70, by0+14, w1, 18); ctx.strokeRect(sx0+70, by0+14, w1, 18);
      ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      ctx.fillText('β='+beta.toFixed(3), sx0, by0+28);
      var w2=Math.max(2, Math.abs(r)*scale);
      ctx.fillStyle='rgba(122,184,255,0.4)'; ctx.strokeStyle=BLU;
      ctx.fillRect(sx0+70, by0+40, w2, 18); ctx.strokeRect(sx0+70, by0+40, w2, 18);
      ctx.fillStyle=BLU; ctx.fillText('r='+r.toFixed(3), sx0, by0+54);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('단위를 바꿔도(k 슬라이더) β와 r은 변하지 않습니다 — 표준화가 단위를 지웁니다', sx0, by0+80);
      ctx.fillText('서로 다른 단위의 변수들을 비교할 때는 원래 계수 대신 β를 씁니다', sx0, by0+100);

      E.tapHint(W/2, H*0.95, '슬라이더로 단위 배율 k를 바꿔 보세요 — 계수는 변해도 β·r은 그대로입니다', true);
      E.big('계수는 무엇을 말하는가', '기울기 b1은 "다른 조건이 같을 때, X가 1단위 늘 때 Y가 얼마나 느는가"입니다. 그런데 그 크기는 단위에 종속적이죠 — 시간을 분으로 재면 계수는 60분의 1이 됩니다. 단위에 흔들리지 않는 값이 표준화계수 β(=b1×표준편차 비율)이고, 단순회귀에서는 놀랍게도 상관계수 r과 정확히 같습니다.'); }
  },

  // ══════════ 3. 얼마나 잘 맞는가 — R²와 잔차 ══════════
  { id:'bda8_03',
    enter:function(E){ var self=this; this.s={sel:0};
      E.controls('<div class="ctrl"><label>데이터셋 (0=선형 A · 1=곡선형 B)</label><input type="range" id="b83s" min="0" max="1" step="1" value="0"><output id="b83so">A</output></div>');
      E.bind('#b83s','input',function(e){ self.s.sel=+e.target.value; document.getElementById('b83so').textContent=self.s.sel?'B':'A'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var olsA=olsSimple(STUDY_X,STUDY_Y), olsB=olsSimple(CURV_X,CURV_Y);
      var sel=s.sel, cur=sel?olsB:olsA, X=sel?CURV_X:CURV_X, XX=sel?CURV_X:STUDY_X;
      // ★실계산: 곡률 상관 — 잔차와 (적합값-평균)² 의 상관(0에 가까우면 무작위, 크면 U자 패턴)
      function curvature(o){ var mfit=mean(o.fitted), dev2=[], i2;
        for(i2=0;i2<o.fitted.length;i2++) dev2.push((o.fitted[i2]-mfit)*(o.fitted[i2]-mfit));
        return corr(dev2,o.resid); }
      var curvA=curvature(olsA), curvB=curvature(olsB);
      var curSel=sel?curvB:curvA;

      var code=[
        {t:'from sklearn.metrics import r2_score', dim:true},
        {t:'pred = m.predict(X)', hl:'predict'},
        {t:'r2_score(y, pred)   # 설명한 비율', hl:'r2_score'},
        {t:'resid = y - pred', hl:'resid'},
        {t:'plot(pred, resid)   # 패턴 있나?', hl:'plot(pred, resid)'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'fit_check.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('데이터 A(선형)   R² = '+olsA.r2.toFixed(4), W*0.04, ry);
      ctx.fillStyle=ROSE; ctx.fillText('데이터 B(곡선형) R² = '+olsB.r2.toFixed(4), W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.fillText('현재 선택: 데이터 '+(sel?'B':'A'), W*0.04, ry+38);
      ctx.fillStyle=(Math.abs(curSel)>0.3)?RED:GRN;
      ctx.fillText('곡률 상관 = '+curSel.toFixed(3)+(Math.abs(curSel)>0.3?'  (패턴 있음!)':'  (거의 무작위)'), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('R²가 높아도 잔차에 곡선 패턴이 남으면', W*0.04, ry+80);
      ctx.fillText('직선 모형이 놓친 게 있다는 신호입니다', W*0.04, ry+96);

      // 우측: 잔차 대 적합값(선택된 데이터셋)
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=210;
      var fmin=Math.min.apply(null,cur.fitted), fmax=Math.max.apply(null,cur.fitted);
      var rmax=0; for(i=0;i<cur.resid.length;i++) if(Math.abs(cur.resid[i])>rmax) rmax=Math.abs(cur.resid[i]);
      rmax*=1.25; if(rmax<1) rmax=1;
      function PXf(f){ return sx0+(f-fmin)/((fmax-fmin)||1)*(sx1-sx0); }
      function PYf(r2){ return sTop+(sBot-sTop)/2-(r2/rmax)*((sBot-sTop)/2); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('잔차 대 적합값 — 데이터 '+(sel?'B(곡선형)':'A(선형)'), sx0, 26);
      // 0선
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([5,4]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,PYf(0)); ctx.lineTo(sx1,PYf(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(sx0,sTop); ctx.lineTo(sx0,sBot); ctx.stroke();
      // 적합값 순서로 정렬해 완만한 추세선(3점 이동평균)도 함께
      var order=[]; for(i=0;i<cur.fitted.length;i++) order.push(i);
      order.sort(function(a,b){ return cur.fitted[a]-cur.fitted[b]; });
      var smoothed=[];
      for(i=0;i<order.length;i++){ var lo=Math.max(0,i-1), hi=Math.min(order.length-1,i+1), sN=0,sC=0,j2;
        for(j2=lo;j2<=hi;j2++){ sN+=cur.resid[order[j2]]; sC++; } smoothed.push(sN/sC); }
      ctx.strokeStyle=GLD; ctx.lineWidth=1.8; ctx.beginPath();
      for(i=0;i<order.length;i++){ var xx=PXf(cur.fitted[order[i]]), yy=PYf(smoothed[i]);
        if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke();
      // 점
      for(i=0;i<cur.fitted.length;i++){ ctx.fillStyle=sel?ROSE:BLU; ctx.beginPath(); ctx.arc(PXf(cur.fitted[i]),PYf(cur.resid[i]),4.5,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('노란 선 = 이동평균(패턴이 있으면 곡선이 됩니다) · 점선 = 잔차 0', sx0, sBot+20);

      // 하단: R² 비교 막대
      var by0=248, scale=sx1-sx0-140;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('R² 비교 — 두 데이터셋 모두 높지만, 잔차 패턴이 다릅니다', sx0, by0);
      var w1=Math.max(2, olsA.r2*scale);
      ctx.fillStyle='rgba(122,184,255,0.4)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.2;
      ctx.fillRect(sx0+90, by0+14, w1, 18); ctx.strokeRect(sx0+90, by0+14, w1, 18);
      ctx.fillStyle=BLU; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillText('A '+olsA.r2.toFixed(3), sx0, by0+28);
      var w2=Math.max(2, olsB.r2*scale);
      ctx.fillStyle='rgba(255,122,184,0.4)'; ctx.strokeStyle=ROSE;
      ctx.fillRect(sx0+90, by0+40, w2, 18); ctx.strokeRect(sx0+90, by0+40, w2, 18);
      ctx.fillStyle=ROSE; ctx.fillText('B '+olsB.r2.toFixed(3), sx0, by0+54);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('곡률상관  A='+curvA.toFixed(2)+'  B='+curvB.toFixed(2)+' — B는 R²는 높아도 곡선 패턴이 뚜렷합니다', sx0, by0+76);

      E.tapHint(W/2, H*0.95, '슬라이더로 데이터셋을 바꿔 잔차의 모양을 비교해 보세요', true);
      E.big('얼마나 잘 맞는가 — R²와 잔차', 'R²는 전체 변동 중 모형이 설명한 비율입니다(1 − SSE/SST). 그런데 R²가 높다고 다 좋은 모형은 아닙니다 — 잔차를 적합값에 대해 그려 보면, 진짜 좋은 모형은 특별한 무늬 없이 흩어지고, 직선으로 곡선 관계를 억지로 맞춘 모형은 잔차에 U자 패턴이 남습니다. R² 하나만 보지 말고 잔차 그림을 꼭 함께 보세요.'); }
  },

  // ══════════ 4. 여러 변수를 함께 — 다중 회귀와 다중공선성 ══════════
  { id:'bda8_04',
    enter:function(E){ var self=this; this.s={a:0};
      E.controls('<div class="ctrl"><label>공선성 강도 α (X2를 경력에 가깝게)</label><input type="range" id="b84a" min="0" max="0.95" step="0.05" value="0"><output id="b84ao">0.00</output></div>');
      E.bind('#b84a','input',function(e){ self.s.a=+e.target.value; document.getElementById('b84ao').textContent=self.s.a.toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, a=s.a, i;
      var X2=[]; for(i=0;i<EXP.length;i++) X2.push((1-a)*X2BASE[i]+a*EXP[i]);
      var m2=olsMulti([EXP,X2],SAL);
      var r12=corr(EXP,X2);
      // VIF: X2를 EXP에 회귀했을 때의 R² 로 계산 — 1/(1-R²)
      var aux=olsSimple(EXP,X2);
      var vif=1/(1-aux.r2);

      var code=[
        {t:'X = df[["exp","x2"]]', hl:'df[["exp","x2"]]'},
        {t:'m = sm.OLS(y, sm.add_constant(X)).fit()', hl:'sm.OLS'},
        {t:'m.params        # b1(exp), b2(x2)', hl:'m.params'},
        {t:'X.corr()        # 상관행렬', hl:'X.corr()'},
        {t:'1/(1-r2_x2_on_x1)  # VIF', hl:'VIF'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'mreg.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('b1(경력)  = '+m2.beta[1].toFixed(2), W*0.04, ry);
      ctx.fillStyle=ROSE; ctx.fillText('b2(X2)    = '+m2.beta[2].toFixed(2), W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.fillText('상관(경력,X2) = '+r12.toFixed(3), W*0.04, ry+38);
      ctx.fillStyle=(vif>5)?RED:GRN;
      ctx.fillText('VIF = '+vif.toFixed(2)+(vif>5?'  (심각한 공선성)':(vif>2?'  (주의)':'  (양호)')), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('α를 올려 X2를 경력과 가깝게 만들어 보세요 — 계수가 요동칩니다', W*0.04, ry+80);

      // 우측 상단: X1 vs X2 산점도(공선성 시각화)
      var sx0=W*0.47, sx1=W*0.965, pTop=30, pBot=170, axMin=0, axMax=11;
      function PXs(v){ return sx0+(v-axMin)/(axMax-axMin)*(sx1-sx0); }
      function PYs(v){ return pBot-(v-axMin)/(axMax-axMin)*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('경력(X1) vs X2 — 점들이 대각선에 붙을수록 공선성이 강합니다', sx0, 26);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,pBot); ctx.lineTo(sx1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx0,pTop); ctx.lineTo(sx0,pBot); ctx.stroke();
      for(i=0;i<EXP.length;i++){ ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXs(EXP[i]),PYs(X2[i]),4,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=0;i<=10;i+=5){ ctx.fillText(''+i, PXs(i), pBot+14);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PXs(i),pBot); ctx.lineTo(PXs(i),pBot+3); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('r(X1,X2) = '+r12.toFixed(3), sx0, pBot+30);

      // 우측 하단: 계수 막대(0 기준, 부호 반전 가능)
      var by0=224, bBot=326, midY=(by0+bBot)/2+10, zx=sx0+120;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('회귀계수 b1·b2 (0 기준선) — 공선성이 강할수록 값이 크게 흔들립니다', sx0, by0);
      var maxAbs=Math.max(Math.abs(m2.beta[1]),Math.abs(m2.beta[2]),3);
      var barScale=(sx1-zx-20)/maxAbs;
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(zx,by0+10); ctx.lineTo(zx,bBot); ctx.stroke();
      function hbar(val,y,col,lab){
        var w=Math.min(Math.abs(val)*barScale, sx1-zx-10);
        ctx.fillStyle=col+'66'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
        var x0b=(val>=0)?zx:zx-w;
        ctx.fillRect(x0b,y,w,20); ctx.strokeRect(x0b,y,w,20);
        ctx.fillStyle=col; ctx.font='600 12px ui-monospace,Menlo,monospace';
        var labText=lab+' '+val.toFixed(2), tw=ctx.measureText(labText).width;
        // 라벨이 캔버스 우측 경계를 넘으면 막대 안쪽으로 우측정렬(넘침 방지)
        if(val>=0 && zx+w+6+tw>sx1-4){ ctx.textAlign='right'; ctx.fillText(labText, sx1-4, y+14); }
        else { ctx.textAlign='left'; ctx.fillText(labText, (val>=0? zx+w+6 : zx-w+6), y+14); }
      }
      hbar(m2.beta[1], by0+22, BLU, 'b1');
      hbar(m2.beta[2], by0+50, ROSE, 'b2');
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('α=0일 땐 X2가 독립적이라 계수가 안정적이고, α→0.95로 갈수록 부호가 뒤집히거나 커집니다', sx0, by0+90);

      E.tapHint(W/2, H*0.95, '슬라이더로 α를 올려 보세요 — X2가 경력과 닮을수록 계수가 불안정해집니다', true);
      E.big('여러 변수를 함께 — 다중 회귀와 다중공선성', '변수를 하나 더 넣으면 "다른 변수를 고정했을 때"라는 조건이 붙어 계수의 의미가 미묘해집니다. 그런데 두 변수가 서로 강하게 상관되어 있으면(다중공선성) 데이터가 둘의 개별 효과를 구분할 정보를 주지 못해 계수가 크게 흔들리고 부호까지 뒤집힐 수 있습니다. VIF(분산팽창지수)가 5를 넘으면 위험 신호로 봅니다.'); }
  },

  // ══════════ 5. 모델을 진단하다 ══════════
  { id:'bda8_05',
    enter:function(E){ var self=this; this.s={y11:80};
      E.controls('<div class="ctrl"><label>새 점(경력15년)의 연봉 지표 y11</label><input type="range" id="b85y" min="20" max="160" step="2" value="80"><output id="b85yo">80</output></div>');
      E.bind('#b85y','input',function(e){ self.s.y11=+e.target.value; document.getElementById('b85yo').textContent=self.s.y11; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, y11=s.y11, i;
      var X0=STUDY_X.slice(), Y0=STUDY_Y.slice();
      var base=olsSimple(X0,Y0);
      var X2=X0.concat([15]), Y2=Y0.concat([y11]);
      var full=olsSimple(X2,Y2);
      var n=X2.length, p=2;
      // 레버리지 h_11 = 1/n + (x11-xbar)^2/Sxx (전체 데이터 기준)
      var mx=mean(X2), sxx=0; for(i=0;i<n;i++) sxx+=(X2[i]-mx)*(X2[i]-mx);
      var h11=1/n+(15-mx)*(15-mx)/sxx;
      var levThresh=2*p/n;
      // Cook's D_11 = e11²/(p·MSE) · h11/(1-h11)²
      var mse=full.sse/(n-p);
      var e11=full.resid[full.resid.length-1];
      var cooksD=(e11*e11)/(p*mse)*(h11/((1-h11)*(1-h11)));
      var cookThresh=4/n;
      var db1=full.b1-base.b1;

      var code=[
        {t:'y11 = slider   # 새 점의 지표', hl:'slider'},
        {t:'X2 = hours+[15]; Y2 = score+[y11]', hl:'+ [y11]'},
        {t:'m2 = smf.ols("y~x", d2).fit()', hl:'smf.ols'},
        {t:'h = get_influence().hat_matrix', hl:'hat_matrix'},
        {t:'get_influence().cooks_distance', hl:'cooks_distance'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'diagnose.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=DIM; ctx.fillText('기존 10개  b0='+base.b0.toFixed(1)+' · b1='+base.b1.toFixed(2), W*0.04, ry);
      ctx.fillStyle=ROSE; ctx.fillText('11개(점 추가) b0='+full.b0.toFixed(1)+' · b1='+full.b1.toFixed(2)+'  (Δb1='+db1.toFixed(2)+')', W*0.04, ry+19);
      ctx.fillStyle=GLD; ctx.fillText('레버리지 h = '+h11.toFixed(3)+'  (기준 2p/n='+levThresh.toFixed(3)+')', W*0.04, ry+38);
      ctx.fillStyle=(cooksD>cookThresh)?RED:GRN;
      ctx.fillText("Cook's D = "+cooksD.toFixed(3)+'  (기준 4/n='+cookThresh.toFixed(3)+')'+(cooksD>cookThresh?' → 영향점!':' → 양호'), W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('점 하나가 회귀선을 얼마나 끌고 가는지, 진단 없이 결과를 믿지 마세요', W*0.04, ry+80);

      // 우측 상단: 산점도 + 두 회귀선(있음/없음)
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=210, xMin=0,xMax=17, yMin=20,yMax=170;
      function PX(x){ return sx0+(x-xMin)/(xMax-xMin)*(sx1-sx0); }
      function PY(y){ return sBot-(y-yMin)/(yMax-yMin)*(sBot-sTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('● 기존 10개', sx0, 26);
      ctx.fillStyle=RED; ctx.fillText('★ 새 점(경력15)', sx0+96, 26);
      ctx.fillStyle=DIM; ctx.fillText('┄ 없을 때', sx0+220, 26);
      ctx.fillStyle=ROSE; ctx.fillText('― 있을 때', sx0+300, 26);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,sBot); ctx.lineTo(sx1,sBot); ctx.stroke();
      // 없을 때 회귀선(점선)
      ctx.strokeStyle=DIM; ctx.setLineDash([5,4]); ctx.lineWidth=1.6;
      var by0v=Math.max(yMin,Math.min(yMax,base.b0+base.b1*xMin)), by1v=Math.max(yMin,Math.min(yMax,base.b0+base.b1*xMax));
      ctx.beginPath(); ctx.moveTo(PX(xMin),PY(by0v)); ctx.lineTo(PX(xMax),PY(by1v)); ctx.stroke(); ctx.setLineDash([]);
      // 있을 때 회귀선(실선)
      ctx.strokeStyle=ROSE; ctx.lineWidth=2.5;
      var fy0=Math.max(yMin,Math.min(yMax,full.b0+full.b1*xMin)), fy1=Math.max(yMin,Math.min(yMax,full.b0+full.b1*xMax));
      ctx.beginPath(); ctx.moveTo(PX(xMin),PY(fy0)); ctx.lineTo(PX(xMax),PY(fy1)); ctx.stroke();
      // 자료점
      for(i=0;i<X0.length;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(X0[i]),PY(Y0[i]),4,0,7); ctx.fill(); }
      // 새 점(별 모양 근사=다이아몬드)
      var nx=PX(15), ny=PY(y11);
      ctx.fillStyle=RED; ctx.beginPath();
      ctx.moveTo(nx,ny-7); ctx.lineTo(nx+7,ny); ctx.lineTo(nx,ny+7); ctx.lineTo(nx-7,ny); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=0;i<=15;i+=5){ ctx.fillText(''+i, PX(i), sBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),sBot); ctx.lineTo(PX(i),sBot+4); ctx.stroke(); }
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('점 하나가 경력 15에서 멀찍이 떨어져 있어 지렛대가 큽니다(레버리지)', sx0, sBot+34);

      // 우측 하단: 레버리지·Cook's D 게이지(기준선 대비)
      var gy0=254, gw=sx1-sx0-170;
      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('레버리지 h', sx0, gy0);
      var hScale=Math.max(h11,levThresh)*1.3;
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx0+110,gy0-12,gw,16);
      ctx.fillStyle=(h11>levThresh)?'rgba(240,136,138,0.55)':'rgba(126,224,176,0.55)';
      ctx.fillRect(sx0+110,gy0-12,gw*Math.min(1,h11/hScale),16);
      var hx=sx0+110+gw*Math.min(1,levThresh/hScale);
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(hx,gy0-16); ctx.lineTo(hx,gy0+8); ctx.stroke();
      ctx.fillStyle=TXT; ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillText(h11.toFixed(3), sx0+110+gw+8, gy0);

      ctx.fillStyle=TXT; ctx.font='12.5px sans-serif'; ctx.fillText("Cook's D", sx0, gy0+34);
      var cScale=Math.max(cooksD,cookThresh)*1.3;
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx0+110,gy0+22,gw,16);
      ctx.fillStyle=(cooksD>cookThresh)?'rgba(240,136,138,0.55)':'rgba(126,224,176,0.55)';
      ctx.fillRect(sx0+110,gy0+22,gw*Math.min(1,cooksD/cScale),16);
      var cx=sx0+110+gw*Math.min(1,cookThresh/cScale);
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx,gy0+18); ctx.lineTo(cx,gy0+42); ctx.stroke();
      ctx.fillStyle=TXT; ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillText(cooksD.toFixed(3), sx0+110+gw+8, gy0+34);

      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('노란 눈금 = 경고 기준선(레버리지 2p/n · Cook 4/n) — 막대가 넘으면 영향점 의심', sx0, gy0+62);

      E.tapHint(W/2, H*0.95, '슬라이더로 새 점의 값을 극단으로 옮겨 보세요 — 회귀선이 통째로 끌려갑니다', true);
      E.big('모델을 진단하다', '적합도 하나만 믿고 회귀 결과를 발표하면 위험합니다. 경력이 15년으로 유별난 점 하나를 슬라이더로 움직여 보세요 — 값이 극단으로 갈수록 레버리지와 Cook 거리가 커지고, 회귀선 전체가 그 점 쪽으로 끌려갑니다. 진단 없이 계수를 믿는 것은, 지도 없이 낯선 길을 걷는 것과 같습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
