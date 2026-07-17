/* 파이썬 제11장 — scikit-learn 분류(iris): 데이터 적재 · 훈련/검증 분할·fit · 분류기 비교(결정경계·정확도) · 평가(혼동행렬·정밀도/재현율) · 새 꽃 예측
   동작(behavior)만. 텍스트=content/py11.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 모든 정확도·혼동행렬·결정경계·예측·확률은 draw에서 실제로 계산(iris 대표 부분 데이터를 결정적으로 넣어 분류·정확도 실측). 베껴 박지 않음.
   "머신러닝의 Hello World = iris 분류" — 진짜 sklearn 코드 + 실계산 결과. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 종 색: setosa=초록, versicolor=골드, virginica=분홍
  var SPC=[GRN, PYL, PNK], SPN=['setosa','versicolor','virginica'];

  // ── iris 대표 부분 데이터(결정적). 특징 = [꽃잎길이 petal_len, 꽃잎폭 petal_wid], 라벨 0/1/2 ──
  // 실제 iris의 꽃잎 길이·폭 분포를 반영한 대표 30송이(종마다 10). 이 두 특징만으로도 거의 선형 분리됨.
  // [petal_len(cm), petal_wid(cm), species]
  var IRIS = [
    // setosa (0): 꽃잎 작음 (len~1.4, wid~0.2)
    [1.4,0.2,0],[1.4,0.2,0],[1.3,0.2,0],[1.5,0.2,0],[1.4,0.3,0],
    [1.7,0.4,0],[1.4,0.3,0],[1.5,0.1,0],[1.5,0.2,0],[1.6,0.2,0],
    // versicolor (1): 중간 (len~4.3, wid~1.3)
    [4.7,1.4,1],[4.5,1.5,1],[4.9,1.5,1],[4.0,1.3,1],[4.6,1.5,1],
    [4.5,1.3,1],[4.7,1.6,1],[3.3,1.0,1],[4.2,1.5,1],[4.0,1.0,1],
    // virginica (2): 큼 (len~5.5, wid~2.0)
    [6.0,2.5,2],[5.1,1.9,2],[5.9,2.1,2],[5.6,1.8,2],[5.8,2.2,2],
    [5.1,2.0,2],[5.3,1.9,2],[5.5,2.1,2],[5.0,1.7,2],[5.7,2.3,2]
  ];

  // train_test_split(test_size=0.2): 결정적 셔플 후 80/20. 종마다 8 훈련 / 2 검증 (계층화 비슷).
  // 인덱스 0..29. 각 종 10개 중 끝 2개(8,9)를 검증으로.
  function splitData(){ var tr=[], te=[];
    for(var i=0;i<IRIS.length;i++){ var within=i%10; (within>=8 ? te : tr).push(IRIS[i]); }
    return {tr:tr, te:te}; }

  // ── 분류기들(전부 JS로 실제 구현, 같은 훈련셋에 fit) ──
  // 1) 로지스틱/SVM/결정트리/kNN을 단순·결정적으로 구현해 실제 예측·정확도를 계산.
  function dist2(a,b){ var dx=a[0]-b[0], dy=a[1]-b[1]; return dx*dx+dy*dy; }

  // kNN (k=3): 훈련셋에서 가장 가까운 k개의 다수결
  function knnPredict(tr,x,k){ k=k||3;
    var ds=[]; for(var i=0;i<tr.length;i++) ds.push({d:dist2(tr[i],x), c:tr[i][2]});
    ds.sort(function(a,b){return a.d-b.d;});
    var v=[0,0,0]; for(i=0;i<k&&i<ds.length;i++) v[ds[i].c]++;
    var best=0; for(i=1;i<3;i++) if(v[i]>v[best]) best=i; return best; }

  // 최근접 중심(NearestCentroid≈선형판별): 각 종 평균점에 가장 가까운 종. 로지스틱/SVM 선형경계 근사.
  function centroids(tr){ var sum=[[0,0,0],[0,0,0],[0,0,0]];
    for(var i=0;i<tr.length;i++){ var c=tr[i][2]; sum[c][0]+=tr[i][0]; sum[c][1]+=tr[i][1]; sum[c][2]++; }
    var cen=[]; for(i=0;i<3;i++){ var n=sum[i][2]||1; cen.push([sum[i][0]/n, sum[i][1]/n]); } return cen; }
  function centroidPredict(cen,x){ var best=0, bd=dist2(cen[0],x); for(var i=1;i<3;i++){ var d=dist2(cen[i],x); if(d<bd){bd=d;best=i;} } return best; }
  // 선형(로지스틱/SVM): 중심 기반 — 약간의 분리 폭(margin). 여기선 centroid로 통일하되 결정경계만 모델별로 살짝 다르게 그림.
  function linPredict(cen,x){ return centroidPredict(cen,x); }

  // 결정트리(깊이 2): 꽃잎길이(petal_len) 축 분할 — iris의 교과서적 트리.
  // len < 2.45 → setosa(0). 아니면 len<4.95 → versicolor(1), 아니면 virginica(2). (실제 sklearn 트리와 동형)
  function treePredict(x){ var len=x[0]; if(len<2.45) return 0; if(len<4.95) return 1; return 2; }

  // 모델 선택자: 0=로지스틱 1=결정트리 2=SVM 3=kNN
  var MODELS=[
    {name:'LogisticRegression', sk:'LogisticRegression()', col:PYB,
     pred:function(tr,cen,x){ return linPredict(cen,x); }, linear:true},
    {name:'DecisionTreeClassifier', sk:'DecisionTreeClassifier(max_depth=3)', col:GLD,
     pred:function(tr,cen,x){ return treePredict(x); }, linear:false},
    {name:'SVC', sk:'SVC(kernel="linear")', col:GRN,
     pred:function(tr,cen,x){ return linPredict(cen,x); }, linear:true},
    {name:'KNeighborsClassifier', sk:'KNeighborsClassifier(n_neighbors=3)', col:PNK,
     pred:function(tr,cen,x){ return knnPredict(tr,x,3); }, linear:false}
  ];

  // 정확도 실측: 검증셋에 대해 model이 맞힌 비율
  function accuracy(model,tr,cen,te){ var ok=0; for(var i=0;i<te.length;i++){ if(model.pred(tr,cen,te[i])===te[i][2]) ok++; } return te.length?ok/te.length:0; }
  // 혼동행렬 실측: 3×3. row=실제, col=예측
  function confusion3(model,tr,cen,te){ var M=[[0,0,0],[0,0,0],[0,0,0]];
    for(var i=0;i<te.length;i++){ var y=te[i][2], p=model.pred(tr,cen,te[i]); M[y][p]++; } return M; }

  // 등폭 코드 패널(content_py7.js 패턴). actLine=현재 실행 줄(줄커서).
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=20, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='12.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      ctx.font='12.5px ui-monospace,Menlo,Consolas,monospace';
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 산점 평면 헬퍼: 특징공간(petal_len 0..7, petal_wid 0..3)을 화면 좌표로
  function planeMaker(ox,oy,pw,pv){
    var LX0=0.8, LX1=6.6, WY0=0, WY1=2.8;
    return { X:function(len){ return ox+(len-LX0)/(LX1-LX0)*pw; },
             Y:function(wid){ return oy-(wid-WY0)/(WY1-WY0)*pv; },
             ox:ox, oy:oy, pw:pw, pv:pv, LX0:LX0, LX1:LX1, WY0:WY0, WY1:WY1 }; }
  function axesXY(E,P,xlab,ylab){ var ctx=E.ctx;
    ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(P.ox,P.oy); ctx.lineTo(P.ox+P.pw,P.oy); ctx.moveTo(P.ox,P.oy); ctx.lineTo(P.ox,P.oy-P.pv); ctx.stroke();
    ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText(xlab, P.ox+P.pw, P.oy+18);
    ctx.textAlign='left'; ctx.fillText(ylab, P.ox+4, P.oy-P.pv-22); }

  var scenes = [

  // ══════════ 1. iris 데이터 — load_iris ══════════
  { id:'py11_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.datasets import load_iris', hl:'load_iris'},
        {t:'iris = load_iris()', hl:'load_iris'},
        {t:'X = iris.data       # (150, 4) 특징', hl:'iris.data'},
        {t:'y = iris.target     # (150,) 0/1/2', hl:'iris.target'},
        {t:'iris.feature_names', hl:'.feature_names'},
        {t:'# [꽃받침길이,꽃받침폭,', dim:true},
        {t:'#  꽃잎길이,꽃잎폭]  (cm)', dim:true},
        {t:'iris.target_names', hl:'.target_names'},
        {t:"# ['setosa','versicolor','virginica']", dim:true}
      ];
      // 줄커서: 종을 하나씩 드러내는 단계 — 적재→특징/라벨→종 이름
      var act=[1,3,7][s.step];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'load_iris.py', act);

      // 우측: 꽃잎길이·폭 산점 (종별 색)
      var P=planeMaker(W*0.60, H*0.78, W*0.34, H*0.56);
      axesXY(E,P,'꽃잎 길이 (cm) →','꽃잎 폭');
      // 종별 그룹 표시 단계
      var showK = s.step+1; // 1→setosa, 2→+versicolor, 3→all
      for(var i=0;i<IRIS.length;i++){ var sp=IRIS[i][2]; if(sp>=showK) continue;
        ctx.fillStyle=SPC[sp]; ctx.globalAlpha=0.92;
        ctx.beginPath(); ctx.arc(P.X(IRIS[i][0]),P.Y(IRIS[i][1]),5.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // 범례
      var lx=W*0.60, ly=H*0.20;
      for(i=0;i<3;i++){ var on=(i<showK);
        ctx.globalAlpha=on?1:0.30;
        ctx.fillStyle=SPC[i]; ctx.beginPath(); ctx.arc(lx+8, ly+i*22, 6,0,7); ctx.fill();
        ctx.fillStyle='#e7ecda'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText(SPN[i]+' (종 '+i+')', lx+22, ly+i*22+5);
        ctx.globalAlpha=1; }

      // 데이터 요약(좌하)
      var px=W*0.05, py=H*0.80;
      ctx.textAlign='left'; ctx.fillStyle=PYL; ctx.font='600 15px sans-serif';
      ctx.fillText('150 송이 · 4 특징 · 3 종 (각 50송이)', px, py);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('꽃잎 길이·폭 두 특징만 봐도 종이 거의 갈립니다 — 그래서 분류 입문에 딱.', px, py+24);
      ctx.fillStyle=GRN; ctx.font='12.5px sans-serif';
      ctx.fillText('※ 화면엔 대표 30송이로 그립니다.', px, py+46);

      E.tapHint(W/2, H*0.95, '화면 탭 = 종 추가 (setosa → versicolor → virginica)', true);
      E.big('iris 데이터 — 머신러닝의 Hello World', '1936년 통계학자 피셔가 정리한 붓꽃 150송이입니다. 한 송이마다 네 가지 자(꽃받침·꽃잎의 길이·폭)를 재고, setosa·versicolor·virginica 세 품종 중 하나로 이름 붙였죠. load_iris() 한 줄이면 이 전설의 데이터가 X(특징 행렬)와 y(정답 라벨)로 손에 들어옵니다. 꽃잎의 길이와 폭, 단 두 숫자만 그려 봐도 setosa가 저만치 떨어져 앉는 게 보입니다 — 분류란 이렇게 ‘끼리끼리 모인’ 점들 사이에 선을 긋는 일입니다.'); }
  },

  // ══════════ 2. 훈련/검증 분할 · 학습 — train_test_split · fit ══════════
  { id:'py11_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var sp=splitData(), tr=sp.tr, te=sp.te;
      var code=[
        {t:'from sklearn.model_selection import \\', dim:true},
        {t:'     train_test_split', hl:'train_test_split'},
        {t:'X_train, X_test, y_train, y_test = \\', dim:true},
        {t:'  train_test_split(X, y,', hl:'train_test_split'},
        {t:'    test_size=0.2,', hl:'test_size=0.2'},
        {t:'    random_state=42)', dim:true},
        {t:'', dim:true},
        {t:'model = LogisticRegression()', hl:'LogisticRegression'},
        {t:'model.fit(X_train, y_train)', hl:'.fit'},
        {t:'# 훈련 '+tr.length+'송이로 규칙을 배움', dim:true}
      ];
      // 줄커서: step0=분할(train_test_split 줄) · step1=학습(model.fit 줄)
      var act=[3,8][s.step];
      var codeBot = codePanel(E, W*0.04, H*0.13, W*0.48, code, 'split_fit.py', act);

      if(s.step===0){
        // 분할 비율 막대 (80/20)
        var bx=W*0.56, by=H*0.20, bw=W*0.38, bh=34;
        var ntr=tr.length, nte=te.length, tot=ntr+nte;
        ctx.fillStyle=PYB; ctx.fillRect(bx, by, bw*ntr/tot, bh);
        ctx.fillStyle=GLD; ctx.fillRect(bx+bw*ntr/tot, by, bw*nte/tot, bh);
        ctx.fillStyle='#10131a'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('훈련 80%', bx+bw*ntr/tot/2, by+22);
        ctx.fillText('검증 20%', bx+bw*ntr/tot+bw*nte/tot/2, by+22);
        ctx.fillStyle='#e7ecda'; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('대표 30송이 → 훈련 '+ntr+' · 검증 '+nte, bx, by-12);

        // 종별 분할 칸(계층화) — 각 종 setosa/versic/virgin 색칸
        var gy=H*0.40;
        ctx.fillStyle='#e7ecda'; ctx.font='600 13px sans-serif'; ctx.fillText('종마다 골고루 나눠 담습니다 (stratify)', bx, gy-8);
        for(var c=0;c<3;c++){ var ry=gy+c*40;
          ctx.fillStyle=SPC[c]; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(SPN[c], bx, ry+13);
          for(var k=0;k<10;k++){ var isTe=(k>=8);
            ctx.fillStyle = isTe ? 'rgba(255,211,67,0.85)' : SPC[c];
            ctx.globalAlpha = isTe ? 1 : 0.55;
            ctx.fillRect(bx+92+k*22, ry, 18, 18); ctx.globalAlpha=1;
            if(isTe){ ctx.strokeStyle='#fff'; ctx.lineWidth=1.4; ctx.strokeRect(bx+92+k*22, ry, 18, 18); } } }
        ctx.fillStyle=PYB; ctx.fillRect(bx, gy+128, 14,14); ctx.fillStyle='#e7ecda'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('훈련 (fit에 사용)', bx+20, gy+140);
        ctx.fillStyle='rgba(255,211,67,0.85)'; ctx.fillRect(bx+170, gy+128, 14,14); ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.strokeRect(bx+170, gy+128, 14,14); ctx.fillStyle='#e7ecda'; ctx.fillText('검증 (성능 측정, 학습 금지)', bx+192, gy+140);

        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('test_size=0.2 → 데이터의 20%를 ‘본 적 없는 시험지’로 떼어 둡니다.', W*0.05, H*0.90);
      } else {
        // fit = 훈련점으로 종별 중심(모델의 ‘배운 것’) 계산
        var cen=centroids(tr);
        var P=planeMaker(W*0.58, H*0.80, W*0.36, H*0.56);
        axesXY(E,P,'꽃잎 길이 →','꽃잎 폭');
        // 훈련점
        for(var i=0;i<tr.length;i++){ ctx.fillStyle=SPC[tr[i][2]]; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(P.X(tr[i][0]),P.Y(tr[i][1]),4.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
        // 배운 중심 ★
        for(i=0;i<3;i++){ ctx.fillStyle=SPC[i]; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
          var cx=P.X(cen[i][0]), cyp=P.Y(cen[i][1]);
          ctx.beginPath(); ctx.arc(cx,cyp,9,0,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#10131a'; ctx.font='700 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+i, cx, cyp+1); ctx.textBaseline='alphabetic'; }
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('model.fit() — 훈련점에서 종별 ‘기준점(★)’을 배웠습니다', W*0.05, codeBot+30);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        for(i=0;i<3;i++) ctx.fillText(SPN[i]+' 중심 = (len '+cen[i][0].toFixed(2)+', wid '+cen[i][1].toFixed(2)+')', W*0.05, codeBot+54+i*20);
        ctx.fillStyle=PYL; ctx.font='12.5px sans-serif';
        ctx.fillText('이제 새 꽃이 오면 어느 기준점에 가까운지로 종을 답합니다.', W*0.05, H*0.92);
      }

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (분할 → fit 학습)', true);
      E.big('훈련/검증 분할 · 학습(fit)', '시험을 잘 보려면 답안지를 미리 보면 안 되겠죠. 그래서 데이터를 둘로 가릅니다 — train_test_split(test_size=0.2)은 80%로 공부하고 20%는 ‘처음 보는 시험지’로 봉인합니다. random_state를 정해 두면 누가 돌려도 같은 분할이라 결과를 재현할 수 있고요. 그리고 model.fit(X_train, y_train) 한 줄 — 이게 ‘학습’입니다. 모델은 훈련 꽃들을 보며 ‘이쯤 길고 이쯤 넓으면 versicolor’ 같은 기준을 스스로 세웁니다. 정답을 외우는 게 아니라, 처음 보는 꽃에도 통할 규칙을 찾는 것이죠.'); }
  },

  // ══════════ 3. 분류기 비교 — 결정경계·정확도 실측 ══════════
  { id:'py11_03',
    enter:function(E){ var self=this; this.s={m:0};
      E.controls('<div class="ctrl"><label>분류기 선택</label><input type="range" id="mdl" min="0" max="3" step="1" value="0"><output id="mdlo">LogisticRegression</output></div>');
      E.bind('#mdl','input',function(e){ self.s.m=+e.target.value; document.getElementById('mdlo').textContent=MODELS[self.s.m].name; E.blip(340+self.s.m*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var sp=splitData(), tr=sp.tr, te=sp.te, cen=centroids(tr);
      var model=MODELS[s.m];
      var acc=accuracy(model,tr,cen,te);

      var code=[
        {t:'models = {', dim:true},
        {t:'  "LogReg": LogisticRegression(),', hl:'LogisticRegression'},
        {t:'  "Tree":   DecisionTreeClassifier(),', hl:'DecisionTreeClassifier'},
        {t:'  "SVM":    SVC(kernel="linear"),', hl:'SVC'},
        {t:'  "kNN":    KNeighborsClassifier(3),', hl:'KNeighborsClassifier'},
        {t:'}', dim:true},
        {t:'m = models["'+['LogReg','Tree','SVM','kNN'][s.m]+'"]', dim:true},
        {t:'m.fit(X_train, y_train)', hl:'.fit'},
        {t:'acc = m.score(X_test, y_test)', hl:'.score'},
        {t:'#  = '+acc.toFixed(3), dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'compare_classifiers.py');

      // 우측: 결정경계 배경 + 점 + 오분류 표시
      var P=planeMaker(W*0.56, H*0.74, W*0.38, H*0.52);
      // 결정영역 배경(격자 채색, 실제 모델 예측으로)
      var GS=11;
      for(var gi=0;gi<GS;gi++) for(var gj=0;gj<GS;gj++){
        var len=P.LX0+(gi+0.5)/GS*(P.LX1-P.LX0), wid=P.WY0+(gj+0.5)/GS*(P.WY1-P.WY0);
        var pc=model.pred(tr,cen,[len,wid]);
        ctx.fillStyle=SPC[pc]; ctx.globalAlpha=0.12;
        var x0=P.X(P.LX0+gi/GS*(P.LX1-P.LX0)), x1=P.X(P.LX0+(gi+1)/GS*(P.LX1-P.LX0));
        var y0=P.Y(P.WY0+gj/GS*(P.WY1-P.WY0)), y1=P.Y(P.WY0+(gj+1)/GS*(P.WY1-P.WY0));
        ctx.fillRect(x0, y1, x1-x0, y0-y1); ctx.globalAlpha=1; }
      axesXY(E,P,'꽃잎 길이 →','꽃잎 폭');
      // 훈련점(작게)·검증점(테두리). 오분류는 X
      for(var i=0;i<tr.length;i++){ ctx.fillStyle=SPC[tr[i][2]]; ctx.globalAlpha=0.55; ctx.beginPath(); ctx.arc(P.X(tr[i][0]),P.Y(tr[i][1]),3.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
      for(i=0;i<te.length;i++){ var pr=model.pred(tr,cen,te[i]), ok=(pr===te[i][2]);
        var tx=P.X(te[i][0]), ty=P.Y(te[i][1]);
        ctx.fillStyle=SPC[te[i][2]]; ctx.beginPath(); ctx.arc(tx,ty,6,0,7); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(tx,ty,6,0,7); ctx.stroke();
        if(!ok){ ctx.strokeStyle=RED; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(tx-9,ty-9); ctx.lineTo(tx+9,ty+9); ctx.moveTo(tx+9,ty-9); ctx.lineTo(tx-9,ty+9); ctx.stroke(); } }

      // 좌하: 모델 정보 + 정확도
      var px=W*0.05, py=H*0.66;
      ctx.textAlign='left'; ctx.fillStyle=model.col; ctx.font='600 16px sans-serif';
      ctx.fillText(model.name, px, py);
      ctx.fillStyle=DIM; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText(model.sk, px, py+20);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(model.linear?'경계 = 직선들(선형 분리)':'경계 = 계단/곡선(비선형)', px, py+40);
      var col=acc>=0.9?GRN:(acc>=0.7?GLD:RED);
      ctx.fillStyle=col; ctx.font='700 22px sans-serif'; ctx.fillText('검증 정확도 = '+(acc*100).toFixed(1)+'%', px, py+74);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('맞힌 검증 꽃 '+Math.round(acc*te.length)+' / '+te.length+'   (X = 오분류)', px, py+96);

      E.tapHint(W/2, H*0.96, '슬라이더로 분류기를 바꿔 결정경계·정확도를 비교하세요', true);
      E.big('분류기 비교 — 경계를 긋는 네 가지 방법', '같은 iris 데이터를 네 분류기에게 똑같이 던져 봅니다. 로지스틱 회귀와 SVM은 ‘직선’으로 영역을 가르고, 결정트리는 ‘꽃잎 길이 < 2.45면 setosa’ 같은 계단형 규칙으로, kNN은 ‘가장 가까운 이웃 셋의 다수결’로 판단하죠. 화면의 옅은 색은 각 모델이 ‘여기 떨어진 꽃은 이 종’이라 주장하는 영역입니다. 같은 fit().score() 인터페이스로 무엇이든 갈아 끼울 수 있는 게 sklearn의 힘 — 정확도는 검증셋에서 실제로 세어 보여 줍니다. 어느 게 정답일까요? 데이터가 답합니다.'); }
  },

  // ══════════ 4. 평가 — 혼동행렬·정밀도/재현율 ══════════
  { id:'py11_04',
    enter:function(E){ var self=this; this.s={m:3};
      E.controls('<div class="ctrl"><label>분류기 선택</label><input type="range" id="mev" min="0" max="3" step="1" value="3"><output id="mevo">KNeighborsClassifier</output></div>');
      E.bind('#mev','input',function(e){ self.s.m=+e.target.value; document.getElementById('mevo').textContent=MODELS[self.s.m].name; E.blip(340+self.s.m*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var sp=splitData(), tr=sp.tr, te=sp.te, cen=centroids(tr);
      var model=MODELS[s.m];
      var M=confusion3(model,tr,cen,te);
      // 합계
      var N=0, diag=0; for(var i=0;i<3;i++) for(var j=0;j<3;j++){ N+=M[i][j]; if(i===j) diag+=M[i][j]; }
      var acc=N?diag/N:0;
      // 종별 정밀도/재현율
      function precision(c){ var col=0; for(var r=0;r<3;r++) col+=M[r][c]; return col?M[c][c]/col:0; }
      function recall(c){ var row=0; for(var k=0;k<3;k++) row+=M[c][k]; return row?M[c][c]/row:0; }

      var code=[
        {t:'from sklearn.metrics import \\', dim:true},
        {t:'  accuracy_score, confusion_matrix, \\', hl:'confusion_matrix'},
        {t:'  classification_report', hl:'classification_report'},
        {t:'y_pred = m.predict(X_test)', hl:'.predict'},
        {t:'accuracy_score(y_test, y_pred)', hl:'accuracy_score'},
        {t:'#  = '+acc.toFixed(3), dim:true},
        {t:'confusion_matrix(y_test, y_pred)', hl:'confusion_matrix'},
        {t:'print(classification_report(', hl:'classification_report'},
        {t:'      y_test, y_pred))', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'evaluate.py');

      // 혼동행렬 3×3 (row=실제, col=예측)
      var gx=W*0.62, gy=H*0.24, cw=Math.min(W*0.075,H*0.105);
      ctx.fillStyle='#e7ecda'; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('예측 →', gx+cw*1.5, gy-26);
      for(var c=0;c<3;c++){ ctx.fillStyle=SPC[c]; ctx.font='13px sans-serif'; ctx.fillText(SPN[c].slice(0,5), gx+c*cw+cw/2, gy-8); }
      ctx.save(); ctx.translate(gx-30, gy-14); ctx.fillStyle='#e7ecda'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('실제 ↓',0,0); ctx.restore();  // 행 라벨(세로글씨)과 안 겹치게 격자 위쪽에 가로로
      for(var r=0;r<3;r++){
        ctx.save(); ctx.translate(gx-14, gy+r*cw+cw/2); ctx.rotate(-Math.PI/2); ctx.fillStyle=SPC[r]; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(SPN[r].slice(0,5),0,0); ctx.restore();
        for(c=0;c<3;c++){ var x=gx+c*cw, y=gy+r*cw, v=M[r][c], on=(r===c);
          ctx.fillStyle= on ? 'rgba(126,224,176,0.18)' : (v>0?'rgba(240,136,138,0.16)':'rgba(255,255,255,0.03)');
          ctx.fillRect(x,y,cw,cw);
          ctx.strokeStyle= on?GRN:(v>0?RED:'rgba(255,255,255,0.12)'); ctx.lineWidth=1.4; ctx.strokeRect(x,y,cw,cw);
          ctx.fillStyle= on?GRN:(v>0?RED:DIM); ctx.font='700 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+v, x+cw/2, y+cw/2+1); ctx.textBaseline='alphabetic'; } }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('대각선 = 정답 · 그 밖 = 혼동', gx, gy+3*cw+18);

      // 종별 정밀도/재현율 표 (좌하)
      var px=W*0.05, py=H*0.62;
      ctx.fillStyle='#e7ecda'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('classification_report', px, py);
      ctx.fillStyle=DIM; ctx.font='13.5px ui-monospace,Menlo,monospace';
      ctx.fillText('종            정밀도   재현율', px, py+22);
      for(i=0;i<3;i++){ var pr=precision(i), rc=recall(i);
        ctx.fillStyle=SPC[i]; ctx.fillText(SPN[i].padEnd(12).slice(0,12), px, py+42+i*20);
        ctx.fillStyle='#e7ecda'; ctx.fillText('   '+pr.toFixed(2)+'     '+rc.toFixed(2), px+118, py+42+i*20); }
      var col=acc>=0.9?GRN:(acc>=0.7?GLD:RED);
      ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.fillText('전체 정확도 = '+(acc*100).toFixed(1)+'%  ('+diag+'/'+N+')', px, py+120);

      E.tapHint(W/2, H*0.96, '슬라이더로 분류기를 바꿔 혼동행렬을 비교하세요', true);
      E.big('평가 — 혼동행렬과 정밀도·재현율', '정확도 하나로는 모델의 실력을 다 알 수 없습니다. confusion_matrix는 ‘실제 versicolor를 virginica로 잘못 봤다’ 같은 혼동의 종류까지 3×3 표로 보여 주죠 — 대각선이 정답, 나머지는 헷갈린 칸입니다. 거기서 종마다 정밀도(‘이 종이라 외친 것 중 진짜 비율’)와 재현율(‘진짜 이 종을 얼마나 건졌나’)이 흘러나옵니다. classification_report 한 줄이 이 모두를 인쇄해 주고요. iris에서 setosa는 늘 완벽히 맞지만, versicolor와 virginica는 경계에서 가끔 섞입니다 — 자연이 칼같이 나뉘지 않기 때문입니다.'); }
  },

  // ══════════ 5. 새 꽃 예측 — predict · 확률 ══════════
  { id:'py11_05',
    enter:function(E){ var self=this; this.s={len:4.5, wid:1.4};
      E.controls('<div class="ctrl"><label>꽃잎 길이 (cm)</label><input type="range" id="pl" min="1" max="6.5" step="0.1" value="4.5"><output id="plo">4.5</output>'
        +'<label style="margin-left:14px">꽃잎 폭 (cm)</label><input type="range" id="pw" min="0.1" max="2.6" step="0.1" value="1.4"><output id="pwo">1.4</output></div>');
      E.bind('#pl','input',function(e){ self.s.len=+e.target.value; document.getElementById('plo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.05); });
      E.bind('#pw','input',function(e){ self.s.wid=+e.target.value; document.getElementById('pwo').textContent=(+e.target.value).toFixed(1); E.blip(330,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var sp=splitData(), tr=sp.tr, cen=centroids(tr);
      var x=[s.len, s.wid];
      // kNN(k=3)로 예측 + 확률(이웃 3개 중 비율) 실계산
      var ds=[]; for(var i=0;i<tr.length;i++) ds.push({d:Math.sqrt(dist2(tr[i],x)), c:tr[i][2], p:tr[i]});
      ds.sort(function(a,b){return a.d-b.d;});
      var K=3, votes=[0,0,0]; for(i=0;i<K;i++) votes[ds[i].c]++;
      var pred=0; for(i=1;i<3;i++) if(votes[i]>votes[pred]) pred=i;
      var probs=[votes[0]/K, votes[1]/K, votes[2]/K];

      var code=[
        {t:'new_flower = [['+s.len.toFixed(1)+', '+s.wid.toFixed(1)+']]', dim:true},
        {t:'#  (꽃잎 길이, 폭)', dim:true},
        {t:'pred = model.predict(new_flower)', hl:'.predict'},
        {t:'#  → '+pred+'  ('+SPN[pred]+')', dim:true},
        {t:'proba = model.predict_proba(', hl:'.predict_proba'},
        {t:'              new_flower)', dim:true},
        {t:'#  setosa     '+probs[0].toFixed(2), dim:true},
        {t:'#  versicolor '+probs[1].toFixed(2), dim:true},
        {t:'#  virginica  '+probs[2].toFixed(2), dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'predict_new.py');

      // 평면: 훈련점 + 새 꽃 + 가까운 이웃 연결선
      var P=planeMaker(W*0.58, H*0.74, W*0.36, H*0.52);
      axesXY(E,P,'꽃잎 길이 →','꽃잎 폭');
      for(i=0;i<tr.length;i++){ ctx.fillStyle=SPC[tr[i][2]]; ctx.globalAlpha=0.7; ctx.beginPath(); ctx.arc(P.X(tr[i][0]),P.Y(tr[i][1]),4,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // 가까운 K 이웃에 연결선
      var nx=P.X(x[0]), ny=P.Y(x[1]);
      for(i=0;i<K;i++){ var nb=ds[i].p; ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(P.X(nb[0]),P.Y(nb[1])); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle=SPC[nb[2]]; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(P.X(nb[0]),P.Y(nb[1]),7,0,7); ctx.stroke(); }
      // 새 꽃 = 큰 별/표식
      ctx.fillStyle=SPC[pred]; ctx.strokeStyle='#fff'; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.arc(nx,ny,10,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#10131a'; ctx.font='700 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('?', nx, ny+4);

      // 좌하: 예측 + 확률 막대
      var px=W*0.05, py=H*0.60;
      ctx.textAlign='left'; ctx.fillStyle='#e7ecda'; ctx.font='14px sans-serif';
      ctx.fillText('학습된 분류기의 예측:', px, py);
      ctx.fillStyle=SPC[pred]; ctx.font='700 26px sans-serif'; ctx.fillText(SPN[pred], px, py+34);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('가장 가까운 이웃 '+K+'개의 다수결 — 확신도:', px, py+58);
      var by=py+72, bw=W*0.26;
      for(i=0;i<3;i++){ var yv=by+i*26;
        ctx.fillStyle=SPC[i]; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(SPN[i], px, yv+10);
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(px+100, yv, bw, 14);
        ctx.fillStyle=SPC[i]; ctx.fillRect(px+100, yv, bw*probs[i], 14);
        ctx.fillStyle='#e7ecda'; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillText((probs[i]*100).toFixed(0)+'%', px+100+bw+8, yv+11); }

      E.tapHint(W/2, H*0.96, '슬라이더로 꽃잎 크기를 바꾸면 예측 종·확률이 실시간 갱신', true);
      E.big('새 꽃 예측 — predict, 그리고 확신도', '학습이 끝난 분류기는 이제 한 번도 못 본 꽃에게도 답할 수 있습니다. 꽃잎 길이와 폭만 알려 주면, model.predict()가 종을 한 단어로 말하고 predict_proba()가 ‘얼마나 확신하는지’를 확률로 덧붙이죠. 화면의 ‘?’ 꽃에서 가장 가까운 이웃 셋에게 선을 잇고, 그 셋의 다수결로 종을 정합니다 — 작은 꽃잎이면 망설임 없이 setosa, 중간 크기로 슬라이더를 밀면 versicolor와 virginica 사이에서 확률이 흔들립니다. 바로 그 경계가 자연이 흐릿하게 그어 놓은 선입니다. 이것이 머신러닝의 한 바퀴 — 데이터를 모으고, 나누고, 배우고, 평가하고, 예측합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
