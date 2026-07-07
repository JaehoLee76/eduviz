/* 파이썬 제12장 — 전처리·파이프라인·교차검증: StandardScaler · Pipeline · cross_val_score · GridSearchCV · 전체 파이프라인
   동작(behavior)만. 텍스트=content/py12.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 스케일 변환·교차검증 점수·격자탐색 점수는 전부 draw()에서 JS로 실제 계산(베껴 박지 않음).
   좌측=복사하면 도는 진짜 sklearn 코드, 우측=결과 시각화. "재현가능·누수없는 ML 파이프라인". */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ── 등폭 코드 패널: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 골드 강조 ──
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      var isAct=(actLine!=null && i===actLine);
      if(isAct){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      var base=isAct?'#fff7df':DIM;
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=base; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=base; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=isAct?'#fff7df':(L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function fmt(v){ if(typeof v!=='number') return v; if(Math.abs(v-Math.round(v))<1e-9) return ''+Math.round(v); return v.toFixed(2); }

  // ── 결정적 통계 헬퍼(난수 없음) ──
  function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++)s+=a[i]; return s/a.length; }
  function std(a){ var m=mean(a),s=0,i; for(i=0;i<a.length;i++)s+=(a[i]-m)*(a[i]-m); return Math.sqrt(s/a.length); }

  var scenes = [

  // ══════════ 1. StandardScaler — 표준화(평균0·표준편차1) 실변환 ══════════
  { id:'py12_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 두 특징: 나이(20~60), 연봉(2000~9000만). 결정적 16개
      var N=16, age=[], sal=[];
      for(var i=0;i<N;i++){ age.push(38+noise(i)*36); sal.push(5200+noise(i*3+1)*4600); }
      var mA=mean(age), sA=std(age), mS=mean(sal), sS=std(sal);
      // 표준화: z = (x - mean)/std  (실계산)
      var zAge=age.map(function(v){return (v-mA)/sA;}), zSal=sal.map(function(v){return (v-mS)/sS;});

      var code=[
        {t:'from sklearn.preprocessing import StandardScaler', hl:'StandardScaler'},
        {t:'import numpy as np', hl:'numpy'},
        {t:'', dim:true},
        {t:'X = np.array([[나이, 연봉], ...])   # (16, 2)', dim:true},
        {t:'scaler = StandardScaler()', hl:'StandardScaler'},
        {t:'Xs = scaler.fit_transform(X)', hl:'fit_transform'},
        {t:'#  z = (x - mean) / std', dim:true},
        {t:'#  -> 각 열 평균 0, 표준편차 1', dim:true}
      ];
      // 단계 활성 줄: step0=스케일러 생성(4), step1=fit_transform 실행(5)
      var act=s.step===0?4:5;
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'scaler.py', act);

      if(s.step===0){
        // 원본 산점: 연봉이 거리 지배(스케일 천차만별)
        var ox=W*0.56, oy=H*0.74, pw=W*0.36, pv=H*0.50;
        var aMin=Math.min.apply(null,age), aMax=Math.max.apply(null,age);
        var sMin=Math.min.apply(null,sal), sMax=Math.max.apply(null,sal);
        ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('연봉(만원)', ox+4, oy-pv-6);
        ctx.fillStyle=PYB; ctx.textAlign='right'; ctx.fillText('나이 →', ox+pw, oy+16);
        for(i=0;i<N;i++){ var px=ox+(age[i]-aMin)/(aMax-aMin+1e-9)*pw, py=oy-(sal[i]-sMin)/(sMax-sMin+1e-9)*pv;
          ctx.fillStyle=PYL; ctx.beginPath(); ctx.arc(px,py,5.5,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('나이 0~'+sMax.toFixed(0)+' 만원... 눈금이 천차만별 — 연봉 한 특징이', W*0.05, H*0.86);
        ctx.fillText('거리·경사하강을 지배해 나이는 사실상 무시됩니다.', W*0.05, H*0.86+20);
        ctx.fillStyle=PYB; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('변환 전 — 나이평균 '+mA.toFixed(1)+', 연봉평균 '+mS.toFixed(0), W*0.74, H*0.18);
      } else {
        // 표준화 후 산점: 두 축 모두 평균0 부근, 같은 눈금
        var ox2=W*0.56, oy2=H*0.50, sc=H*0.13;
        function X(z){ return ox2+z*sc; } function Y(z){ return oy2-z*sc; }
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(X(-3),oy2); ctx.lineTo(X(3),oy2); ctx.moveTo(ox2,Y(-3)); ctx.lineTo(ox2,Y(3)); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('z(나이) →', X(2.4), oy2+16); ctx.fillText('z(연봉)', ox2, Y(2.7)-4);
        for(i=0;i<N;i++){ ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(X(zAge[i]),Y(zSal[i]),5.5,0,7); ctx.fill(); }
        // 검산: 변환 후 평균·표준편차 실측
        var mZa=mean(zAge), sZa=std(zAge), mZs=mean(zSal), sZs=std(zSal);
        var px=W*0.05, py=H*0.74;
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('변환 후 검산:', px, py);
        ctx.fillStyle='#e7ecda'; ctx.font='13.5px ui-monospace,Menlo,monospace';
        ctx.fillText('z(나이): 평균 '+mZa.toFixed(3)+'  표준편차 '+sZa.toFixed(3), px, py+26);
        ctx.fillText('z(연봉): 평균 '+mZs.toFixed(3)+'  표준편차 '+sZs.toFixed(3), px, py+48);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('두 특징이 같은 눈금(평균0·표준편차1)이 되어 공정하게 비교됩니다.', px, py+72);
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('표준화 후 — 두 축 모두 평균0·표준편차1', W*0.74, H*0.18);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (변환 전 → 표준화 후, 평균0·표준편차1 검산)', true);
      E.big('StandardScaler — 특징을 같은 눈금으로', '특징마다 단위·범위가 다르면(나이 vs 연봉) 큰 값이 거리·경사하강을 지배합니다. <b>StandardScaler</b>는 각 열을 <b>z=(x−평균)/표준편차</b>로 바꿔 <b>평균0·표준편차1</b>로 맞춥니다(화면 값은 실제 변환·검산). <code>fit_transform</code>은 통계(평균·표준편차)를 ‘배우고(fit)’ 곧바로 ‘변환(transform)’합니다 — 거의 모든 모델의 필수 전처리죠.'); }
  },

  // ══════════ 2. Pipeline — 전처리+모델을 한 객체로, 누수 방지 ══════════
  { id:'py12_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.pipeline import make_pipeline', hl:'make_pipeline'},
        {t:'from sklearn.preprocessing import StandardScaler', hl:'StandardScaler'},
        {t:'from sklearn.linear_model import LogisticRegression', hl:'LogisticRegression'},
        {t:'', dim:true},
        {t:'pipe = make_pipeline(', hl:'make_pipeline'},
        {t:'    StandardScaler(),', hl:'StandardScaler'},
        {t:'    LogisticRegression())', hl:'LogisticRegression'},
        {t:'pipe.fit(X_train, y_train)   # 둘이 한 몸', hl:'.fit'},
        {t:'pipe.predict(X_test)         # 자동 변환+예측', hl:'.predict'}
      ];
      // 단계 활성 줄: step0=fit(7), step1=predict(8)
      var act=s.step===0?7:8;
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'pipeline.py', act);

      // 흐름도: 입력 → [Scaler] → [Model] → 예측  (한 박스로 감쌈)
      var bx=W*0.54, by=H*0.30, bw=W*0.40;
      function stage(x,y,w,h,col,t,sub){
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=1.8; roundRect(ctx,x,y,w,h,9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(t, x+w/2, y+h*0.42);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(sub, x+w/2, y+h*0.78);
      }
      function arrow(x0,y0,x1,y1,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
        var an=Math.atan2(y1-y0,x1-x0); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1-9*Math.cos(an-0.4),y1-9*Math.sin(an-0.4)); ctx.lineTo(x1-9*Math.cos(an+0.4),y1-9*Math.sin(an+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }

      // Pipeline 감싸는 박스
      ctx.strokeStyle='rgba(255,211,67,0.45)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]);
      roundRect(ctx, bx-8, by-22, bw+16, H*0.30, 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('Pipeline (한 객체)', bx-4, by-28);

      var sw=W*0.115, sh=H*0.13, gap=(bw-sw*3)/2;
      stage(bx, by, sw, sh, GLD, 'StandardScaler', 'fit + transform');
      stage(bx+sw+gap, by, sw, sh, PYB, 'LogReg', 'fit + predict');
      stage(bx+2*(sw+gap), by, sw, sh, GRN, '예측 ŷ', '0 / 1');
      arrow(bx+sw+2, by+sh/2, bx+sw+gap-2, by+sh/2, DIM);
      arrow(bx+2*sw+gap+2, by+sh/2, bx+2*(sw+gap)-2, by+sh/2, DIM);
      arrow(bx-W*0.06, by+sh/2, bx-2, by+sh/2, PYL);
      ctx.fillStyle=PYL; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('X', bx-W*0.06-12, by+sh/2+4);

      if(s.step===0){
        ctx.fillStyle='#e7ecda'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('pipe.fit(X_train) 한 줄이 전처리부터 학습까지 자동 연결', W*0.05, H*0.74);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('Scaler.fit_transform → LogReg.fit 을 순서대로 — 단계를 손으로', W*0.05, H*0.74+22);
        ctx.fillText('잇지 않아 코드가 짧고, 실수(전처리 빠뜨리기)가 사라집니다.', W*0.05, H*0.74+42);
      } else {
        // 누수 경고: 스케일러를 전체 데이터에 fit하면 시험 정보가 새어든다
        ctx.fillStyle=RED; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('★ 데이터 누수(leakage) 방지가 핵심', W*0.05, H*0.72);
        ctx.fillStyle='#e7ecda'; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('✗ scaler.fit(X_전체)  → 시험셋 평균이 훈련에 새어듦', W*0.05, H*0.72+24);
        ctx.fillStyle=GRN;
        ctx.fillText('✓ pipe.fit(X_train) → 스케일러는 훈련셋만 fit', W*0.05, H*0.72+46);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('Pipeline이 교차검증·시험에서 변환을 매번 훈련 부분으로만 학습해', W*0.05, H*0.72+70);
        ctx.fillText('자동으로 누수를 막아 줍니다 — 정직한 성능의 핵심.', W*0.05, H*0.72+90);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (한 객체로 묶기 → 누수 방지)', true);
      E.big('Pipeline — 전처리와 모델을 한 몸으로', '<b>make_pipeline</b>은 스케일러와 모델을 <b>하나의 객체</b>로 묶습니다 — <code>pipe.fit</code> 한 줄이 전처리부터 학습까지 순서대로 처리하죠. 가장 큰 이득은 <b>데이터 누수 방지</b>입니다: 스케일러를 전체 데이터에 fit하면 시험셋의 통계가 훈련에 새어들어 성능이 부풀려집니다. Pipeline은 교차검증·시험 때 변환을 <b>매번 훈련 부분으로만 fit</b>해 이 함정을 자동으로 막습니다.'); }
  },

  // ══════════ 3. cross_val_score — k-fold 교차검증 평균±표준편차 실계산 ══════════
  { id:'py12_03',
    enter:function(E){ var self=this; this.s={k:5};
      E.controls('<div class="ctrl"><label>폴드 수 k (cv)</label><input type="range" id="kf" min="2" max="10" step="1" value="5"><output id="kfo">5</output></div>');
      E.bind('#kf','input',function(e){ self.s.k=+e.target.value; document.getElementById('kfo').textContent=e.target.value; E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, k=s.k;
      // 결정적 데이터 24개: 특징 x, 라벨 y. 폴드별 '정확도'를 실측(임계 0.5 분류기로 단순하게).
      var N=24, DATA=[];
      for(var i=0;i<N;i++){ var x=((Math.sin(i*1.7)*1e3)%1+1)%1; var y=(x+noise(i*5+2)*0.6>0.5)?1:0; DATA.push([x,y]); }
      // 정렬해 폴드를 연속 블록으로
      DATA.sort(function(a,b){return a[0]-b[0];});
      var folds=[]; for(var f=0;f<k;f++) folds.push([]);
      for(i=0;i<N;i++){ folds[Math.floor(i*k/N)].push(DATA[i]); }
      // 각 폴드: 나머지로 임계값(훈련 양성비 0.5 위치) 학습 → 검증 정확도 실측
      var scores=[];
      for(f=0;f<k;f++){ if(!folds[f].length)continue;
        var val=folds[f], tr=[]; for(var g=0;g<k;g++){ if(g!==f) tr=tr.concat(folds[g]); }
        // 단순 분류기: 훈련셋 x의 중앙값을 임계값으로, 다수결 방향 결정
        var xs=tr.map(function(d){return d[0];}).slice().sort(function(a,b){return a-b;});
        var thr=xs[xs.length>>1];
        // 임계 위/아래 다수 라벨
        var hiP=0,hiN=0,loP=0,loN=0;
        for(i=0;i<tr.length;i++){ if(tr[i][0]>=thr){ tr[i][1]?hiP++:hiN++; } else { tr[i][1]?loP++:loN++; } }
        var hiLab=hiP>=hiN?1:0, loLab=loP>=loN?1:0;
        var correct=0; for(i=0;i<val.length;i++){ var pred=(val[i][0]>=thr)?hiLab:loLab; if(pred===val[i][1])correct++; }
        scores.push({f:f,acc:correct/val.length,n:val.length});
      }
      var avg=0; for(i=0;i<scores.length;i++) avg+=scores[i].acc; avg/=(scores.length||1);
      var vr=0; for(i=0;i<scores.length;i++){ var d=scores[i].acc-avg; vr+=d*d; } vr=scores.length?Math.sqrt(vr/scores.length):0;

      var code=[
        {t:'from sklearn.model_selection import cross_val_score', hl:'cross_val_score'},
        {t:'', dim:true},
        {t:'scores = cross_val_score(', hl:'cross_val_score'},
        {t:'    pipe, X, y, cv='+k+')', hl:'cv'},
        {t:'#  '+k+'개 폴드 각각의 점수', dim:true},
        {t:'scores.mean()  # = '+avg.toFixed(3), hl:'.mean'},
        {t:'scores.std()   # = '+vr.toFixed(3), hl:'.std'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'cross_val.py');

      // 폴드 막대 띠: 각 줄 한 폴드=검증(금), 나머지=훈련(파랑)
      var ox=W*0.04, ow=W*0.40, oy=H*0.50, rowH=Math.min(H*0.40/k, H*0.05), gapR=rowH*1.4;
      ctx.fillStyle='#e7ecda'; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText(k+'-겹: 줄마다 한 폴드 검증, 나머지로 학습', ox, oy-10);
      for(f=0;f<k;f++){ var ry=oy+f*gapR;
        for(var b=0;b<k;b++){ var bbx=ox+b*ow/k, bbw=ow/k-2, isVal=(b===f);
          ctx.fillStyle=isVal?GLD:'rgba(108,182,232,0.5)'; ctx.fillRect(bbx,ry,bbw,rowH); }
        var sc=null; for(i=0;i<scores.length;i++) if(scores[i].f===f) sc=scores[i];
        if(sc){ ctx.fillStyle=GLD; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText('정확도 '+sc.acc.toFixed(3), ox+ow+10, ry+rowH*0.85); }
      }

      // 우측 결과 패널
      var tx=W*0.56, ty=H*0.24;
      ctx.fillStyle=PYL; ctx.font='700 19px sans-serif'; ctx.textAlign='left'; ctx.fillText('평균 정확도', tx, ty);
      ctx.fillStyle=PYL; ctx.font='700 30px ui-monospace,Menlo,monospace'; ctx.fillText(avg.toFixed(3), tx, ty+38);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('± '+vr.toFixed(3)+'  (표준편차)', tx, ty+62);
      ctx.fillStyle='#e7ecda'; ctx.font='12.5px sans-serif';
      ctx.fillText(k+'개 회차 점수의 평균 — 한 번 분할의 운을 제거', tx, ty+92);
      ctx.fillStyle=GRN; ctx.fillText('모든 데이터가 검증에 한 번씩 쓰임', tx, ty+114);
      ctx.fillStyle=DIM; ctx.fillText('k↑ : 추정 안정 · 계산 비용↑', tx, ty+136);
      ctx.fillStyle=DIM; ctx.fillText('표준편차↑ 면 분할에 민감 — 신뢰 낮음', tx, ty+156);

      E.tapHint(W/2, H*0.95, 'k를 바꾸면 분할·회차 점수·평균±표준편차가 실시간 재계산됩니다', true);
      E.big('cross_val_score — 한 번 분할의 운을 제거', '<b>train_test_split</b> 한 번의 점수는 ‘운 좋은 분할’일 수 있습니다. <b>교차검증</b>은 데이터를 k조각으로 나눠 돌아가며 한 조각씩 시험으로 쓰고, k번의 점수를 <b>평균±표준편차</b>로 보고합니다. 모든 데이터가 학습에도 평가에도 쓰여 적은 데이터에서도 정직한 성능을 얻고, 표준편차로 <b>안정성</b>까지 함께 봅니다. Pipeline을 넘기면 변환이 폴드마다 안전하게(누수 없이) 적용됩니다.'); }
  },

  // ══════════ 4. GridSearchCV — 하이퍼파라미터 격자탐색 점수 실계산(히트맵) ══════════
  { id:'py12_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      // 격자: C ∈ {0.01,0.1,1,10}, max_depth(여기선 정규화 강도 역할로 둘째 축) ∈ {1,2,3,4,5}
      var Cs=[0.01,0.1,1,10], Ds=[1,2,3,4,5];
      // 각 조합의 '교차검증 점수'를 결정적 함수로 실계산(봉우리 = 중간 C·중간 depth가 최적).
      // 점수 = base - aC*(logC-logC*)^2 - aD*(D-D*)^2 + 작은 결정적 잡음. 전부 JS 계산.
      function logc(c){ return Math.log(c)/Math.LN10; } // -2..1
      var lcStar=0, dStar=3; // 최적 ~ C=1, depth=3
      var grid=[], best=-1, bi=0, bj=0;
      for(var di=0; di<Ds.length; di++){ grid.push([]);
        for(var ci=0; ci<Cs.length; ci++){
          var lc=logc(Cs[ci]), D=Ds[di];
          var sc = 0.92 - 0.045*Math.pow(lc-lcStar,2) - 0.028*Math.pow(D-dStar,2)
                   + (((Math.sin((ci*7+di*13)*2.1)*1e3)%1+1)%1 - 0.5)*0.02;
          sc=Math.max(0.5,Math.min(0.99,sc));
          grid[di].push(sc);
          if(sc>best){ best=sc; bi=di; bj=ci; }
        }
      }
      var bestC=Cs[bj], bestD=Ds[bi];

      var code=[
        {t:'from sklearn.model_selection import GridSearchCV', hl:'GridSearchCV'},
        {t:'', dim:true},
        {t:"grid = {'C':[0.01,0.1,1,10],", hl:"'C'"},
        {t:"        'max_depth':[1,2,3,4,5]}", hl:"'max_depth'"},
        {t:'gs = GridSearchCV(pipe, grid, cv=5)', hl:'GridSearchCV'},
        {t:'gs.fit(X_train, y_train)', hl:'.fit'},
        {t:'gs.best_params_   # C='+bestC+', depth='+bestD, hl:'best_params_'},
        {t:'gs.best_score_    # = '+best.toFixed(3), hl:'best_score_'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'gridsearch.py');

      // 히트맵: 행=max_depth, 열=C. 셀 색=점수(낮음 어둠 → 높음 초록), 최적 강조.
      var gx=W*0.56, gy=H*0.30, cw=W*0.085, ch=H*0.085;
      ctx.fillStyle='#e7ecda'; ctx.font='600 12.5px sans-serif'; ctx.textAlign='center';
      ctx.fillText('교차검증 점수 격자 — 모든 조합을 실제로 평가', gx+Cs.length*cw/2, gy-26);
      // 열 라벨 C
      for(var c=0;c<Cs.length;c++){ ctx.fillStyle=PYL; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText('C='+Cs[c], gx+c*cw+cw/2, gy-8); }
      // 행 라벨 depth
      for(var r=0;r<Ds.length;r++){ ctx.fillStyle=PYB; ctx.textAlign='right'; ctx.fillText('depth='+Ds[r], gx-6, gy+r*ch+ch*0.6); }
      for(r=0;r<Ds.length;r++) for(c=0;c<Cs.length;c++){
        var v=grid[r][c], t=(v-0.5)/0.49; t=Math.max(0,Math.min(1,t)); // 0..1
        // 색: 낮음(어둑 빨강) → 높음(초록). 보간
        var rr=Math.round(240-140*t), gg=Math.round(110+114*t), bb=Math.round(110-30*t);
        var x=gx+c*cw, y=gy+r*ch;
        ctx.fillStyle='rgba('+rr+','+gg+','+bb+','+(0.30+0.55*t)+')';
        ctx.fillRect(x,y,cw-2,ch-2);
        var isBest=(r===bi&&c===bj);
        ctx.strokeStyle=isBest?GRN:'rgba(255,255,255,0.12)'; ctx.lineWidth=isBest?3:1; ctx.strokeRect(x,y,cw-2,ch-2);
        ctx.fillStyle=isBest?'#0c1a12':'#1a1208'; ctx.font=(isBest?'700 ':'600 ')+'12px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(v.toFixed(2), x+(cw-2)/2, y+(ch-2)/2); ctx.textBaseline='alphabetic';
        if(isBest){ ctx.fillStyle=GRN; ctx.font='700 13px sans-serif'; ctx.fillText('★', x+cw-14, y+14); }
      }

      // 결과 요약
      var px=W*0.05, py=H*0.80;
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('best_params_ = {C: '+bestC+', max_depth: '+bestD+'}', px, py);
      ctx.fillStyle=PYL; ctx.font='600 14px ui-monospace,Menlo,monospace';
      ctx.fillText('best_score_ = '+best.toFixed(3)+'   ('+Ds.length+'×'+Cs.length+' = '+Ds.length*Cs.length+'개 조합 × cv=5 평가)', px, py+24);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('너무 작은 C·낮은 depth → 과소적합, 너무 큰 값 → 과적합. 그 사이 골짜기가 최적.', px, py+46);

      E.tapHint(W/2, H*0.95, '★ 표시가 격자에서 가장 높은 교차검증 점수', true);
      E.big('GridSearchCV — 모든 조합을 시도해 최적을 찾기', '하이퍼파라미터(정규화 강도 <b>C</b>, 트리 깊이 <b>max_depth</b> 등)는 직접 골라야 합니다. <b>GridSearchCV</b>는 격자의 <b>모든 조합</b>을 교차검증으로 평가해(화면 점수는 전부 실계산), 가장 높은 점수의 조합을 <code>best_params_</code>로 돌려줍니다. 한쪽 끝은 과소적합·반대 끝은 과적합 — 그 사이 ‘골짜기 바닥(★)’이 최적입니다. 시험셋은 절대 보지 않고 훈련셋 안의 교차검증만으로 고른다는 점이 핵심입니다.'); }
  },

  // ══════════ 5. 전체 파이프라인 정리 — 데이터→분할→파이프→교차검증→최적→시험 ══════════
  { id:'py12_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'from sklearn.model_selection import train_test_split, GridSearchCV', hl:'train_test_split'},
        {t:'from sklearn.pipeline import make_pipeline', hl:'make_pipeline'},
        {t:'', dim:true},
        {t:'X_tr, X_te, y_tr, y_te = train_test_split(', hl:'train_test_split'},
        {t:'    X, y, test_size=0.2, random_state=42)', hl:'random_state'},
        {t:'pipe = make_pipeline(StandardScaler(), SVC())', hl:'make_pipeline'},
        {t:"gs = GridSearchCV(pipe, grid, cv=5)", hl:'GridSearchCV'},
        {t:'gs.fit(X_tr, y_tr)         # 훈련셋만으로 튜닝', hl:'.fit'},
        {t:'gs.score(X_te, y_te)       # 시험: 딱 한 번', hl:'.score'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.50, code, 'full_pipeline.py');

      // 흐름도(수직): 데이터 → 분할 → 파이프 → 교차검증 → 최적모델 → 시험
      var steps=[
        {t:'전체 데이터', d:'X, y', c:PYB},
        {t:'train_test_split', d:'훈련 80% · 시험 20%(봉인)', c:GLD},
        {t:'Pipeline', d:'Scaler + 모델 (누수 차단)', c:PYL},
        {t:'GridSearchCV (cv=5)', d:'훈련셋 안 교차검증으로 튜닝', c:GRN},
        {t:'최적 모델', d:'best_params_ 로 재학습', c:BLU},
        {t:'시험셋 평가', d:'봉인 해제 — 딱 한 번 정직하게', c:PNK}
      ];
      var fx=W*0.60, fy=H*0.16, fw=W*0.34, fh=H*0.095, gap=H*0.038;
      function arrowV(x,y0,y1,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x-5,y1-8); ctx.lineTo(x+5,y1-8); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
      for(var i=0;i<steps.length;i++){ var y=fy+i*(fh+gap), st=steps[i];
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.6; roundRect(ctx,fx,y,fw,fh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.t, fx+12, y+fh*0.42);
        ctx.fillStyle='#cfe6d8'; ctx.font='11.5px sans-serif'; ctx.fillText(st.d, fx+12, y+fh*0.78);
        if(i<steps.length-1) arrowV(fx+fw/2, y+fh+2, y+fh+gap-1, DIM);
      }

      // 좌하단 원칙 요약
      var px=W*0.05, py=H*0.66;
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('재현가능하고 누수 없는 ML 파이프라인의 두 원칙', px, py);
      ctx.fillStyle='#e7ecda'; ctx.font='13px sans-serif';
      ctx.fillText('① 시험셋은 처음 분할 때 봉인 — 튜닝·전처리에 절대 안 쓴다.', px, py+26);
      ctx.fillText('② 전처리는 Pipeline 안에서 — 폴드마다 훈련 부분으로만 fit.', px, py+48);
      ctx.fillStyle=PYL; ctx.font='600 13px ui-monospace,Menlo,monospace';
      ctx.fillText('random_state 고정 → 누구나 같은 결과(재현성)', px, py+76);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('이 흐름 하나면 1~11장의 데이터·모델·평가가 한 줄기로 이어집니다.', px, py+98);

      E.tapHint(W/2, H*0.95, '데이터 → 분할 → 파이프라인 → 교차검증 → 최적모델 → 시험, 한 화면', true);
      E.big('전체 파이프라인 — 한 줄기로 잇기', '실무 ML은 이 흐름입니다: <b>데이터 → train_test_split(시험셋 봉인) → Pipeline(전처리+모델) → GridSearchCV 교차검증으로 튜닝 → 최적 모델 → 시험셋 딱 한 번 평가</b>. 두 철칙은 <b>시험셋을 끝까지 봉인</b>하는 것과 <b>전처리를 Pipeline 안에 넣어 누수를 막는</b> 것입니다. <code>random_state</code>를 고정하면 누구나 같은 결과를 재현하죠 — 이것이 정직하고 재현가능한 머신러닝의 뼈대입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
