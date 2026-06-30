/* 파이썬 제10장 — scikit-learn 회귀: 워크플로(fit/predict/score) · 선형회귀 학습 · R²·MSE 평가 · 다중특징·과적합 · 실전 예측
   동작(behavior)만. 텍스트=content/py10.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 모든 계수 w·b, R², MSE, 예측값은 JS에서 실제 최소제곱/실측으로 계산(베껴 박지 않음).
   왼쪽=Colab서 바로 도는 진짜 sklearn 코드, 오른쪽=그 코드의 실제 결과 시각화. "fit→predict→score 3박자". */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 등폭 코드 패널: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 골드 강조. dim:true=흐림.
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=20, pad=13, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='12.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(typeof L==='object'&&L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function plotAxes(E,ox,oy,pw,pv){ var ctx=E.ctx; ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke(); }

  // ── 결정적 데이터셋 (난수 금지: sin 해시) — sklearn make_regression 한 특징을 모사 ──
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
  // 진짜 관계 y = 3.2·x + 1.5 + 잡음. x∈[0,1] (정규화 가정). 결정적 16점.
  var DATA = (function(){ var a=[], N=16; for(var i=0;i<N;i++){ var x=0.04+i/(N-1)*0.92; var y=3.2*x+1.5+noise(i*5+1)*0.9; a.push([x,y]); } return a; })();

  // 단순 최소제곱(1특징): ŷ = w·x + b. 닫힌식 정규방정식.
  function fitLine(pts){ var n=pts.length, sx=0,sy=0,sxx=0,sxy=0,i;
    for(i=0;i<n;i++){ sx+=pts[i][0]; sy+=pts[i][1]; sxx+=pts[i][0]*pts[i][0]; sxy+=pts[i][0]*pts[i][1]; }
    var w=(n*sxy-sx*sy)/(n*sxx-sx*sx), b=(sy-w*sx)/n; return {w:w,b:b}; }
  // R² = 1 − SS_res/SS_tot,  MSE = mean(잔차²)
  function evalLine(pts,w,b){ var n=pts.length, ybar=0,i; for(i=0;i<n;i++) ybar+=pts[i][1]; ybar/=n;
    var ssr=0, sst=0; for(i=0;i<n;i++){ var yh=w*pts[i][0]+b, e=pts[i][1]-yh; ssr+=e*e; var d=pts[i][1]-ybar; sst+=d*d; }
    return {mse:ssr/n, r2:1-ssr/sst, ssr:ssr, sst:sst, ybar:ybar}; }

  // 다항회귀(과적합 장면): 정규방정식 + 가우스 소거. x를 [-1,1]로 스케일.
  function gsolve(A,bb){ var n=bb.length,i,j,k; A=A.map(function(r){return r.slice();}); bb=bb.slice();
    for(i=0;i<n;i++){ var p=i; for(k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[p][i])) p=k;
      var t=A[i];A[i]=A[p];A[p]=t; var tb=bb[i];bb[i]=bb[p];bb[p]=tb;
      var piv=A[i][i]||1e-9; for(k=i+1;k<n;k++){ var f=A[k][i]/piv; for(j=i;j<n;j++) A[k][j]-=f*A[i][j]; bb[k]-=f*bb[i]; } }
    var x=new Array(n); for(i=n-1;i>=0;i--){ var s=bb[i]; for(j=i+1;j<n;j++) s-=A[i][j]*x[j]; x[i]=s/(A[i][i]||1e-9); } return x; }
  function polyfit(pts,deg){ var n=deg+1, ATA=[], ATy=[], r,c,i;
    for(r=0;r<n;r++){ ATA.push(new Array(n).fill(0)); ATy.push(0); }
    for(i=0;i<pts.length;i++){ var xs=2*pts[i][0]-1, pw=[], v=1, j; for(j=0;j<n;j++){ pw.push(v); v*=xs; }
      for(r=0;r<n;r++){ for(c=0;c<n;c++) ATA[r][c]+=pw[r]*pw[c]; ATy[r]+=pw[r]*pts[i][1]; } }
    for(r=0;r<n;r++) ATA[r][r]+=1e-7; return gsolve(ATA,ATy); }
  function polyval(co,x){ var xs=2*x-1, v=0, j; for(j=co.length-1;j>=0;j--) v=v*xs+co[j]; return v; }
  function pmse(pts,co){ var s=0,i; for(i=0;i<pts.length;i++){ var e=polyval(co,pts[i][0])-pts[i][1]; s+=e*e; } return s/pts.length; }
  // 과적합용 곡선 데이터 + 훈련/검증 분할
  function gfn(x){ return 1.0 + 0.7*Math.sin(2.6*x+0.3); }
  var TR=[], TE=[];
  (function(){ var N=18; for(var i=0;i<N;i++){ var x=0.04+i/(N-1)*0.92, y=gfn(x)+noise(i*7+3)*0.16; (i%2?TE:TR).push([x,y]); } })();

  var scenes = [

  // ══════════ 1. sklearn 워크플로 — 5단계 (load→X,y→model→fit→score) ══════════
  { id:'py10_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.datasets import load_diabetes', hl:'sklearn.datasets'},
        {t:'from sklearn.linear_model import LinearRegression', hl:'LinearRegression'},
        {t:'from sklearn.model_selection import train_test_split', hl:'train_test_split'},
        {t:'', dim:true},
        {t:'X, y = load_diabetes(return_X_y=True)   # 1.데이터', hl:'load_diabetes'},
        {t:'Xtr,Xte,ytr,yte = train_test_split(X, y)  # 2.분할', hl:'train_test_split'},
        {t:'model = LinearRegression()              # 3.모델', hl:'LinearRegression'},
        {t:'model.fit(Xtr, ytr)                     # 4.학습', hl:'fit'},
        {t:'pred  = model.predict(Xte)              # 5.예측', hl:'predict'},
        {t:'score = model.score(Xte, yte)  # R² 평가', hl:'score'}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'sklearn_workflow.py');

      // 우측: 5단계 파이프라인 카드 (현재 step 강조)
      var steps=[
        {t:'① 데이터 로드', d:'load_diabetes() →  X(특징), y(라벨)', c:PYB},
        {t:'② 훈련/검증 분할', d:'train_test_split — 시험지를 숨겨 둠', c:BLU},
        {t:'③ 모델 만들기', d:'model = LinearRegression()', c:GLD},
        {t:'④ 학습 (fit)', d:'model.fit(X, y) — 계수를 맞춤', c:PNK},
        {t:'⑤ 예측·평가', d:'predict(X) · score(X,y)=R²', c:GRN}
      ];
      var bx=W*0.58, bw=W*0.38, bh=46, gap=12, by=H*0.18;
      for(var i=0;i<steps.length;i++){ var y=by+i*(bh+gap), it=steps[i], on=(i<=s.step), cur=(i===s.step);
        ctx.globalAlpha=on?1:0.32;
        ctx.fillStyle=cur?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=it.c; ctx.lineWidth=cur?2.4:1.3;
        roundRect(ctx,bx,y,bw,bh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=it.c; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(it.t, bx+12, y+19);
        ctx.fillStyle='#e7ecda'; ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillText(it.d, bx+12, y+36);
        ctx.globalAlpha=1;
        // 단계 사이 화살표
        if(i<steps.length-1){ ctx.fillStyle=on?it.c:DIM; ctx.globalAlpha=(i<s.step)?1:0.3; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('▼', bx+bw/2, y+bh+9); ctx.globalAlpha=1; }
      }
      // 하단: fit/predict/score 3박자 강조
      ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
      ctx.fillText('어떤 모델이든 똑같은 3박자: fit → predict → score', W*0.06, H*0.90);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('SVM·랜덤포레스트·신경망까지 — sklearn은 모두 이 동일한 API로 씁니다.', W*0.06, H*0.90+22);

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 단계 (load → split → model → fit → score)', true);
      E.big('scikit-learn 워크플로 — fit·predict·score 3박자', 'sklearn으로 머신러닝을 하는 흐름은 언제나 똑같습니다. 데이터를 불러 X(특징)와 y(라벨)로 나누고, 시험용을 따로 숨겨 두고(train_test_split), 모델을 하나 만들어 fit으로 학습시킨 뒤, predict로 예측하고 score로 채점합니다. 왼쪽 코드는 Colab에 그대로 붙여 넣으면 진짜 당뇨 데이터셋으로 도는 코드예요 — 모델만 바꾸면 어떤 알고리즘이든 같은 세 줄로 씁니다.'); }
  },

  // ══════════ 2. 선형회귀 학습 — 최소제곱으로 직선 적합 + 잔차 ══════════
  { id:'py10_02',
    enter:function(E){ var self=this; this.s={t:1};
      E.controls('<div class="ctrl"><label>fit 진행 (학습 정도)</label><input type="range" id="ft" min="0" max="1" step="0.02" value="1"><output id="fto">100%</output></div>');
      E.bind('#ft','input',function(e){ self.s.t=+e.target.value; document.getElementById('fto').textContent=Math.round(self.s.t*100)+'%'; E.blip(340+self.s.t*120,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 진짜 최소제곱 해(학습 완료) — 골든룰
      var fit=fitLine(DATA), W_=fit.w, B_=fit.b;
      // fit 진행: 평균선(t=0, w=0,b=ybar)에서 최적해(t=1)로 보간 — 학습 과정 시각화
      var ybar=0,i; for(i=0;i<DATA.length;i++) ybar+=DATA[i][1]; ybar/=DATA.length;
      var w = s.t*W_, b = (1-s.t)*ybar + s.t*B_;

      var code=[
        {t:'from sklearn.linear_model import LinearRegression', hl:'LinearRegression'},
        {t:'import numpy as np', hl:'numpy'},
        {t:'', dim:true},
        {t:'X = np.array([...]).reshape(-1, 1)  # 특징', dim:true},
        {t:'y = np.array([...])                # 라벨', dim:true},
        {t:'model = LinearRegression()', hl:'LinearRegression'},
        {t:'model.fit(X, y)        # 최소제곱으로 계수 찾기', hl:'fit'},
        {t:'model.coef_       # = ['+W_.toFixed(3)+']  (기울기 w)', hl:'coef_'},
        {t:'model.intercept_  # = '+B_.toFixed(3)+'   (절편 b)', hl:'intercept_'}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'linear_fit.py');

      // 우측 산점도 + 회귀선 + 잔차
      var ox=W*0.58, oy=H*0.78, pw=W*0.36, pv=H*0.56;
      function SX(x){ return ox+x*pw; } function SY(yy){ return oy-(yy/5.2)*pv; }
      plotAxes(E,ox,oy,pw,pv);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('y', ox+4, oy-pv-4); ctx.textAlign='right'; ctx.fillText('x →', ox+pw, oy+16);
      // 잔차(현재 직선 기준 실측)
      for(i=0;i<DATA.length;i++){ var yh=w*DATA[i][0]+b;
        ctx.strokeStyle='rgba(244,160,192,0.55)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(SX(DATA[i][0]),SY(DATA[i][1])); ctx.lineTo(SX(DATA[i][0]),SY(yh)); ctx.stroke();
        ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(DATA[i][0]),SY(DATA[i][1]),4.5,0,7); ctx.fill(); }
      // 회귀선
      ctx.strokeStyle=GLD; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(SX(0),SY(b)); ctx.lineTo(SX(1),SY(w+b)); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('ŷ = w·x + b', SX(0.55),SY(w*0.55+b)-8);
      // 현재 MSE(실측)
      var m=0; for(i=0;i<DATA.length;i++){ var e=(w*DATA[i][0]+b)-DATA[i][1]; m+=e*e; } m/=DATA.length;

      // 패널
      var px=W*0.06, py=H*0.74;
      ctx.textAlign='left'; ctx.fillStyle=PYL; ctx.font='600 16px sans-serif';
      ctx.fillText('학습된 계수 (실측 최소제곱):', px, py);
      ctx.fillStyle=GLD; ctx.font='600 17px ui-monospace,Menlo,monospace';
      ctx.fillText('w = '+w.toFixed(3)+'    b = '+b.toFixed(3), px, py+26);
      ctx.fillStyle=(s.t>=0.99?GRN:CYAorDim(s.t)); ctx.font='600 15px sans-serif';
      ctx.fillText('손실 MSE = '+m.toFixed(4)+(s.t>=0.99?'  ★ 최소 — fit 완료!':'   (fit 더 진행 →)'), px, py+52);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('fit()은 분홍 잔차(세로 오차)의 제곱합을 최소로 만드는 직선을 찾습니다.', px, py+76);

      E.tapHint(W/2, H*0.95, '슬라이더로 fit 진행 — 직선이 데이터에 들어맞고 MSE가 최소로', true);
      E.big('선형회귀 학습 — fit()이 하는 일', 'fit(X, y)을 호출하면 sklearn은 점들과 직선의 세로 거리(잔차, 분홍선)를 제곱해 모두 더한 값이 가장 작아지는 기울기 w와 절편 b를 찾습니다. 이게 ‘최소제곱법’이죠. 학습이 끝나면 그 두 숫자가 model.coef_와 model.intercept_에 들어 있습니다 — 화면의 w·b·MSE는 전부 실제로 계산한 값입니다.'); }
  },

  // ══════════ 3. 평가 R²·MSE — 결정계수와 좋은 적합 판정 ══════════
  { id:'py10_03',
    enter:function(E){ var self=this; this.s={spread:1};
      E.controls('<div class="ctrl"><label>데이터 흩어짐 (잡음 크기)</label><input type="range" id="sp" min="0" max="3" step="0.05" value="1"><output id="spo">1.00</output></div>');
      E.bind('#sp','input',function(e){ self.s.spread=+e.target.value; document.getElementById('spo').textContent=(+e.target.value).toFixed(2); E.blip(340,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 흩어짐을 키운 데이터(잡음 ×spread) — 결정적
      var pts=[]; for(var i=0;i<DATA.length;i++){ pts.push([DATA[i][0], 3.2*DATA[i][0]+1.5 + noise(i*5+1)*0.9*s.spread]); }
      var fit=fitLine(pts), ev=evalLine(pts, fit.w, fit.b);

      var code=[
        {t:'from sklearn.metrics import r2_score, mean_squared_error', hl:'sklearn.metrics'},
        {t:'', dim:true},
        {t:'pred = model.predict(X)', hl:'predict'},
        {t:'r2  = r2_score(y, pred)', hl:'r2_score'},
        {t:'mse = mean_squared_error(y, pred)', hl:'mean_squared_error'},
        {t:'', dim:true},
        {t:'# R² = 1 − SS_res / SS_tot', dim:true},
        {t:'#  = 1 − '+ev.ssr.toFixed(2)+' / '+ev.sst.toFixed(2)+' = '+ev.r2.toFixed(3), dim:true},
        {t:'# R²=1 완벽 · 0 평균선 수준 · 음수 더 나쁨', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'evaluate.py');

      // 우측 산점도: 평균선(SS_tot)·회귀선(SS_res) 둘 다
      var ox=W*0.58, oy=H*0.74, pw=W*0.36, pv=H*0.50;
      function SX(x){ return ox+x*pw; } function SY(yy){ return oy-(yy/6.2)*pv; }
      plotAxes(E,ox,oy,pw,pv);
      // 평균선(빨강 점선) — SS_tot 기준
      ctx.strokeStyle='rgba(240,136,138,0.55)'; ctx.lineWidth=1.6; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(SX(0),SY(ev.ybar)); ctx.lineTo(SX(1),SY(ev.ybar)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=RED; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('평균 ȳ (R²=0 기준)', SX(0.02), SY(ev.ybar)-4);
      // 회귀선
      ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(SX(0),SY(fit.b)); ctx.lineTo(SX(1),SY(fit.w+fit.b)); ctx.stroke();
      for(i=0;i<pts.length;i++){ ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(pts[i][0]),SY(pts[i][1]),4.2,0,7); ctx.fill(); }

      // 게이지: R²
      var gx=W*0.06, gy=H*0.66, gw=W*0.30, gh=18;
      ctx.fillStyle='rgba(255,255,255,0.06)'; roundRect(ctx,gx,gy,gw,gh,9); ctx.fill();
      var frac=Math.max(0,Math.min(1,ev.r2));
      var gcol = ev.r2>=0.85?GRN : ev.r2>=0.5?GLD : RED;
      ctx.fillStyle=gcol; roundRect(ctx,gx,gy,gw*frac,gh,9); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; roundRect(ctx,gx,gy,gw,gh,9); ctx.stroke();

      // 수치 패널
      var px=W*0.06, py=H*0.78;
      ctx.textAlign='left'; ctx.fillStyle=gcol; ctx.font='600 26px sans-serif';
      ctx.fillText('R² = '+ev.r2.toFixed(3), px, py);
      ctx.fillStyle='#e7ecda'; ctx.font='600 16px ui-monospace,Menlo,monospace';
      ctx.fillText('MSE = '+ev.mse.toFixed(4), px+W*0.22, py-4);
      var verdict = ev.r2>=0.85?'좋은 적합 — 분산의 대부분을 설명' : ev.r2>=0.5?'보통 — 어느 정도 설명' : '나쁜 적합 — 평균선과 다를 바 없음';
      ctx.fillStyle=gcol; ctx.font='600 14px sans-serif'; ctx.fillText(verdict, px, py+26);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('R²는 ‘모델이 y의 변동 중 몇 %를 설명하나’ — 1에 가까울수록 좋습니다.', px, py+50);

      E.tapHint(W/2, H*0.95, '슬라이더로 흩어짐을 키워 보세요 — R²↓ MSE↑ (적합이 나빠짐)', true);
      E.big('평가 — R²와 MSE', 'fit만 하고 끝이 아닙니다. score(X,y)는 결정계수 R²를 돌려주는데, R² = 1 − (잔차제곱합)/(평균선 기준 제곱합)이에요. 1이면 완벽, 0이면 그냥 평균을 찍는 것과 같고, 음수면 평균보다도 못합니다. MSE는 오차의 평균 크기죠. 데이터가 흩어질수록 같은 모델이라도 R²가 내려가는 걸 직접 보세요 — 두 수치 모두 실제로 계산해 보여 줍니다.'); }
  },

  // ══════════ 4. 다중 특징·과적합 — 다항회귀 차수↑ 훈련↓검증↑ ══════════
  { id:'py10_04',
    enter:function(E){ var self=this; this.s={deg:3};
      E.controls('<div class="ctrl"><label>다항식 차수 (모델 복잡도)</label><input type="range" id="dg" min="1" max="9" step="1" value="3"><output id="dgo">3</output></div>');
      E.bind('#dg','input',function(e){ self.s.deg=+e.target.value; document.getElementById('dgo').textContent=e.target.value; E.blip(300+self.s.deg*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var co=polyfit(TR,s.deg);
      var etr=pmse(TR,co), ete=pmse(TE,co); // 실측 훈련/검증 MSE

      var code=[
        {t:'from sklearn.preprocessing import PolynomialFeatures', hl:'PolynomialFeatures'},
        {t:'from sklearn.pipeline import make_pipeline', hl:'make_pipeline'},
        {t:'', dim:true},
        {t:'model = make_pipeline(', hl:'make_pipeline'},
        {t:'    PolynomialFeatures(degree='+s.deg+'),', hl:'degree='+s.deg},
        {t:'    LinearRegression())', hl:'LinearRegression'},
        {t:'model.fit(Xtr, ytr)', hl:'fit'},
        {t:'# 훈련 MSE = '+etr.toFixed(4), dim:true},
        {t:'# 검증 MSE = '+ete.toFixed(4)+(ete>etr*2.2?'  ⚠ 과적합!':''), dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'overfit.py');

      // 우측: 적합 곡선 + 훈련/검증 점
      var ox=W*0.58, oy=H*0.70, pw=W*0.36, pv=H*0.46;
      function SX(x){ return ox+x*pw; } function SY(yy){ return oy-((yy)/2.2)*pv; }
      plotAxes(E,ox,oy,pw,pv);
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=0;x<=1.0001;x+=0.005){ var y=polyval(co,x), py=SY(y); if(py<H*0.14)py=H*0.14; if(py>oy+4)py=oy+4; if(x===0)ctx.moveTo(SX(x),py); else ctx.lineTo(SX(x),py); } ctx.stroke();
      var i; for(i=0;i<TR.length;i++){ ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(TR[i][0]),SY(TR[i][1]),4.2,0,7); ctx.fill(); }
      for(i=0;i<TE.length;i++){ ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(SX(TE[i][0]),SY(TE[i][1]),4.2,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.4; ctx.stroke(); }
      ctx.fillStyle=PYB; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 훈련', ox, oy-pv-4); ctx.fillStyle=PNK; ctx.fillText('◯ 검증(흰테)', ox+58, oy-pv-4);

      // 오차 막대(실측)
      var bx=W*0.10, by=H*0.74, bw=W*0.07, scl=H*0.30/Math.max(0.4,Math.max(etr,ete));
      function bar(x,v,c,lab){ var h=Math.max(2,v*scl); ctx.fillStyle=c; roundRect(ctx,x,by-h,bw,h,4); ctx.fill();
        ctx.fillStyle=c; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(v.toFixed(4), x+bw/2, by-h-6);
        ctx.fillStyle='#e7ecda'; ctx.font='12.5px sans-serif'; ctx.fillText(lab, x+bw/2, by+18); }
      bar(bx, etr, PYB, '훈련오차'); bar(bx+W*0.13, ete, PNK, '검증오차');
      var verdict = s.deg<=2 ? '과소적합 — 너무 단순' : (ete>etr*2.2 ? '과적합 — 훈련만 잘함' : '적당 — 잘 일반화');
      ctx.fillStyle = s.deg<=2?GLD : (ete>etr*2.2?RED:GRN); ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText(verdict, W*0.06, H*0.40);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('특징을 늘리거나(다항·다중) 차수를 올리면 모델이 복잡해집니다.', W*0.06, H*0.94);

      E.tapHint(W/2, H*0.96, '차수를 올려 보세요 — 훈련오차↓ 인데 검증오차↑ 되는 순간이 과적합', true);
      E.big('다중 특징·과적합 — 복잡할수록 좋을까', '특징을 여러 개 넣거나 다항식 차수를 올리면 모델이 데이터를 더 구불구불 따라갑니다. 훈련 데이터는 점점 완벽히 통과하지만(훈련오차↓), 못 본 검증 데이터에서는 오히려 오차가 치솟아요(검증오차↑) — 잡음까지 외운 겁니다. 이게 과적합입니다. 화면의 두 오차는 매 차수마다 실제 최소제곱으로 계산한 값이니, 검증오차가 다시 솟는 ‘그 지점’을 직접 찾아 보세요.'); }
  },

  // ══════════ 5. 실전 예측 — 새 입력 슬라이더 → 학습된 모델로 예측 + 전체 코드 ══════════
  { id:'py10_05',
    enter:function(E){ var self=this; this.s={x:0.5};
      E.controls('<div class="ctrl"><label>새 입력 x (예측할 값)</label><input type="range" id="xi" min="0" max="1" step="0.01" value="0.5"><output id="xio">0.50</output></div>');
      E.bind('#xi','input',function(e){ self.s.x=+e.target.value; document.getElementById('xio').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var fit=fitLine(DATA), w=fit.w, b=fit.b, ev=evalLine(DATA,w,b);
      var yh=w*s.x+b; // 학습된 모델 예측 (실계산)

      var code=[
        {t:'# ── 전체 코드 한 화면 ──', dim:true},
        {t:'from sklearn.linear_model import LinearRegression', hl:'LinearRegression'},
        {t:'import numpy as np', hl:'numpy'},
        {t:'model = LinearRegression().fit(X, y)', hl:'fit'},
        {t:'', dim:true},
        {t:'x_new = np.array([['+s.x.toFixed(2)+']])   # 새 입력', dim:true},
        {t:'y_pred = model.predict(x_new)', hl:'predict'},
        {t:'print(y_pred)   # → ['+yh.toFixed(3)+']', dim:true},
        {t:'# w='+w.toFixed(3)+'  b='+b.toFixed(3)+'  R²='+ev.r2.toFixed(3), dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.50, code, 'predict.py');

      // 우측: 학습된 직선 + 새 입력 점선 투영
      var ox=W*0.58, oy=H*0.78, pw=W*0.36, pv=H*0.58;
      function SX(x){ return ox+x*pw; } function SY(yy){ return oy-(yy/5.2)*pv; }
      plotAxes(E,ox,oy,pw,pv);
      var i; for(i=0;i<DATA.length;i++){ ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(DATA[i][0]),SY(DATA[i][1]),4.2,0,7); ctx.fill(); }
      ctx.strokeStyle=GLD; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(SX(0),SY(b)); ctx.lineTo(SX(1),SY(w+b)); ctx.stroke();
      // 새 입력 투영
      ctx.strokeStyle='rgba(126,224,176,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(SX(s.x),oy); ctx.lineTo(SX(s.x),SY(yh)); ctx.lineTo(SX(0),SY(yh)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(SX(s.x),SY(yh),7,0,7); ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(SX(s.x),SY(yh),11,0,7); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='center'; ctx.fillText('x='+s.x.toFixed(2), SX(s.x), oy+15);

      // 패널: 예측 결과 크게
      var px=W*0.06, py=H*0.74;
      ctx.textAlign='left'; ctx.fillStyle='#e7ecda'; ctx.font='15px sans-serif';
      ctx.fillText('학습된 모델 ŷ = '+w.toFixed(3)+'·x + '+b.toFixed(3), px, py);
      ctx.fillStyle=GRN; ctx.font='600 30px sans-serif';
      ctx.fillText('predict('+s.x.toFixed(2)+') = '+yh.toFixed(3), px, py+40);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('학습이 끝난 모델은 새 입력에 w·b를 곧바로 적용해 답합니다(추론).', px, py+66);
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif';
      ctx.fillText('이 한 화면이 sklearn 회귀의 전부 — fit → predict → score.', px, py+90);

      E.tapHint(W/2, H*0.95, '슬라이더로 새 입력 x를 바꿔 — 학습된 모델의 예측이 실시간 계산', true);
      E.big('실전 예측 — 학습된 모델을 쓰다', '학습이 끝나면 모델은 ‘쓰는’ 단계입니다. predict에 새 입력 x를 넣으면, 학습으로 찾은 w·b를 곧바로 적용해 ŷ를 계산해 답하죠(추론). 슬라이더로 x를 옮길 때마다 화면의 예측값은 실제 계수로 계산된 진짜 출력입니다. 왼쪽은 데이터 로드부터 예측까지를 한 화면에 줄인 전체 코드 — 이게 scikit-learn 회귀의 전부입니다. fit으로 배우고, predict로 답하고, score로 채점한다.'); }
  }

  ];

  // 보조: fit 진행도에 따른 색
  function CYAorDim(t){ return t>0.6?'#7ee0b0':'#9b99a3'; }

  if(window.Engine) window.Engine.addScenes(scenes);
})();
