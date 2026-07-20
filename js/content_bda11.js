/* 빅데이터 분석 제11장 — 실전 프로젝트 (배운 것을 하나로: 문제정의→전처리→비교→튜닝→해석)
   동작(behavior)만. 텍스트=content/bda11.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(행·열 수, 목표비율, 결측 수, 집단별 생존율, 교차검증 점수,
   훈련/검증 정확도, 혼동행렬, 정밀도·재현율·F1, 변수 중요도)는 전부 아래 고정 배열(승객 40명)로부터
   draw/build에서 실제 계산(하드코딩 금지). 회귀·분류 모두 정규방정식/경사하강을 직접 구현해 계산.
   난수 금지 — 모든 표본은 파일 상단 고정 배열, 학습(로지스틱 경사하강)도 결정적 초기화·고정 반복횟수. */
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

  // ── 수치 도구 ──────────────────────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function median(a){ var s=a.slice().sort(function(x,y){return x-y;}); var n=s.length;
    return (n%2===1) ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }

  // ── 고정 데이터(난수 금지) — 승객 40명, 특징 5개(성별·객실등급·나이·가족수·요금) ──
  var COLS=['pclass','sex','age','sibsp','parch','fare','survived'];
  var PCLASS=[3,1,2,3,1,1,3,3,1,3,3,3,2,3,1,2,3,1,1,3,3,2,3,3,3,2,3,1,3,3,1,1,3,3,2,3,1,1,2,3];
  var SEX=[0,1,1,0,0,1,0,1,1,1,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,0,0]; // 1=여성
  var AGE=[60,9,null,22,22,23,49,null,30,56,4,5,null,18,19,44,25,null,26,52,78,33,null,7,8,40,21,null,47,76,76,29,null,3,36,61,10,null,43,24];
  var SIBSP=[3,3,0,1,0,0,2,0,0,1,2,0,1,3,0,0,1,0,0,2,0,0,1,3,0,1,0,0,0,2,0,1,2,0,0,1,3,0,1,0];
  var PARCH=[1,0,0,2,2,0,1,0,0,1,0,0,0,2,0,0,2,2,0,1,0,0,1,0,0,0,2,0,1,2,0,0,1,0,0,1,0,0,0,2];
  var FARE=[5.8,46.3,24.2,13.8,54.3,84.9,14.9,8.0,63.3,12.1,16.0,9.2,32.0,6.3,49.7,25.3,14.3,57.7,88.4,15.3,15.4,21.0,12.5,5.7,9.6,33.1,6.7,53.2,10.8,14.7,61.2,91.8,15.7,15.9,22.1,13.0,47.5,78.2,34.2,7.1];
  var SURV=[0,1,1,0,0,1,0,0,1,1,0,1,0,0,0,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,1,1,0,0]; // 1=생존
  var N=40;
  var FAM=[]; (function(){ for(var i=0;i<N;i++) FAM.push(SIBSP[i]+PARCH[i]+1); })();
  // 마지막 준비 단계에서 떼어 둔 순수 홀드아웃(전 과정에서 한 번도 통계에 안 씀) i%4===0, 나머지는 학습/비교용 풀
  var POOL=[], TEST=[]; (function(){ for(var i=0;i<N;i++){ if(i%4===0) TEST.push(i); else POOL.push(i); } })();

  // ── 특징행렬·표준화·모델(전부 실계산, 사이킷런 결과를 베끼지 않음) ──────
  function buildFeatures(idxs, agefill){ // [성별,객실등급,나이,가족수,요금]
    var X=[]; for(var k=0;k<idxs.length;k++){ var i=idxs[k]; var a=(AGE[i]===null)?agefill:AGE[i]; X.push([SEX[i],PCLASS[i],a,FAM[i],FARE[i]]); } return X;
  }
  function standardize(Xtr,Xte){ // 훈련 통계로만 두 세트를 변환(누수 방지)
    var ncol=Xtr[0].length, means=[], sds=[], c,r;
    for(c=0;c<ncol;c++){
      var s=0; for(r=0;r<Xtr.length;r++) s+=Xtr[r][c];
      var m=s/Xtr.length; var v=0; for(r=0;r<Xtr.length;r++){ var d=Xtr[r][c]-m; v+=d*d; } v/=Xtr.length;
      means.push(m); sds.push(v>1e-9?Math.sqrt(v):1);
    }
    function tr(X){ var out=[],r2,c2; for(r2=0;r2<X.length;r2++){ var row=[]; for(c2=0;c2<ncol;c2++) row.push((X[r2][c2]-means[c2])/sds[c2]); out.push(row); } return out; }
    return {trS:tr(Xtr), teS:tr(Xte)};
  }
  function logisticFit(Xtr,Ytr,iters,lr){ // 배치 경사하강으로 정규방정식 대신 직접 최적화(결정적 초기화 0)
    var Xs=standardize(Xtr,Xtr).trS, ncol=Xs[0].length, n=Xs.length, w=[],b=0,c,i,it;
    for(c=0;c<ncol;c++) w.push(0);
    for(it=0;it<iters;it++){
      var gw=[],gb=0; for(c=0;c<ncol;c++) gw.push(0);
      for(i=0;i<n;i++){
        var z=b; for(c=0;c<ncol;c++) z+=w[c]*Xs[i][c];
        var p=1/(1+Math.exp(-z)), err=p-Ytr[i];
        for(c=0;c<ncol;c++) gw[c]+=err*Xs[i][c];
        gb+=err;
      }
      for(c=0;c<ncol;c++) w[c]-=lr*gw[c]/n;
      b-=lr*gb/n;
    }
    return {w:w,b:b};
  }
  function logisticPredictStd(w,b,Xstd){ var out=[]; for(var i=0;i<Xstd.length;i++){ var z=b; for(var c=0;c<w.length;c++) z+=w[c]*Xstd[i][c]; out.push(1/(1+Math.exp(-z))>=0.5?1:0); } return out; }
  function knnPredictStd(Xtr,Ytr,Xte,k){
    var out=[]; for(var t=0;t<Xte.length;t++){ var d=[]; for(var j=0;j<Xtr.length;j++){ var s=0; for(var c=0;c<Xte[t].length;c++){ var df=Xte[t][c]-Xtr[j][c]; s+=df*df; } d.push([s,Ytr[j]]); }
      d.sort(function(a,b){return a[0]-b[0];}); var sum=0; for(var m=0;m<k;m++) sum+=d[m][1]; out.push(sum*2>=k?1:0); } return out;
  }
  function majorityPreds(Ytr,n){ var s=0,i; for(i=0;i<Ytr.length;i++) s+=Ytr[i]; var maj=(s>=Ytr.length/2)?1:0; var o=[]; for(i=0;i<n;i++) o.push(maj); return o; }
  function rulePreds(Xte){ var o=[]; for(var i=0;i<Xte.length;i++) o.push(Xte[i][0]>0.5?1:0); return o; } // 성별 하나만 보는 전통적 휴리스틱
  function f1Stats(yt,yp){ var TP=0,FP=0,FN=0,TN=0,i; for(i=0;i<yt.length;i++){ if(yt[i]===1&&yp[i]===1)TP++; else if(yt[i]===0&&yp[i]===1)FP++; else if(yt[i]===1&&yp[i]===0)FN++; else TN++; }
    var prec=(TP+FP>0)?TP/(TP+FP):0, rec=(TP+FN>0)?TP/(TP+FN):0, f1=(prec+rec>0)?2*prec*rec/(prec+rec):0;
    return {TP:TP,FP:FP,FN:FN,TN:TN,prec:prec,rec:rec,f1:f1,acc:(TP+TN)/yt.length}; }
  function accOf(y,p){ var c=0; for(var i=0;i<y.length;i++) if(y[i]===p[i]) c++; return c/y.length; }

  // K겹 교차검증: pool(절대 인덱스 배열)을 j%K로 접어 폴드마다 훈련폴드 통계로만 결측·표준화(누수 없음)
  function cvF1(pool, K, modelName, kParam){
    var scores=[], kf,j,i;
    for(kf=0; kf<K; kf++){
      var testIdx=[], trainIdx=[];
      for(j=0;j<pool.length;j++){ if(j%K===kf) testIdx.push(pool[j]); else trainIdx.push(pool[j]); }
      var known=[]; for(i=0;i<trainIdx.length;i++) if(AGE[trainIdx[i]]!==null) known.push(AGE[trainIdx[i]]);
      var agefill=median(known);
      var Xtr=buildFeatures(trainIdx,agefill), Xte=buildFeatures(testIdx,agefill);
      var Ytr=[]; for(i=0;i<trainIdx.length;i++) Ytr.push(SURV[trainIdx[i]]);
      var Yte=[]; for(i=0;i<testIdx.length;i++) Yte.push(SURV[testIdx[i]]);
      var preds;
      if(modelName==='majority') preds=majorityPreds(Ytr,Xte.length);
      else if(modelName==='rule') preds=rulePreds(Xte);
      else if(modelName==='logistic'){ var fit=logisticFit(Xtr,Ytr,500,0.3); preds=logisticPredictStd(fit.w,fit.b,standardize(Xtr,Xte).teS); }
      else if(modelName==='knn'){ var std=standardize(Xtr,Xte); preds=knnPredictStd(std.trS,Ytr,std.teS,kParam); }
      scores.push(f1Stats(Yte,preds).f1);
    }
    return scores;
  }

  var scenes = [

  // ══════════ 1. 문제를 정의하고 데이터를 만나다 ══════════
  { id:'bda11_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"df = pd.read_csv('passenger.csv')", dim:true},
        {t:"df.shape                  # 행,열", hl:'df.shape'},
        {t:"df['survived'].value_counts()", hl:'value_counts()'},
        {t:"df.isna().sum()           # 결측 확인", hl:'isna().sum()'},
        {t:"f1_score(y_true, y_pred)  # 우리의 잣대", hl:'f1_score'}
      ];
      var acti=[1,2,3,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'explore.py', acti);
      var caps=['모두 몇 명, 몇 개의 정보를 가지고 시작하는지 봅니다',
                '예측할 목표(survived)가 얼마나 치우쳐 있는지 봅니다',
                '어느 열이 얼마나 비어 있는지 봅니다',
                '무엇을 "성공"이라 부를지 미리 정합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
        ctx.fillText(N+'행 × '+COLS.length+'열', px0, 46);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('승객 '+N+'명의 기록 — 이 40명을 끝까지 하나의 프로젝트로 따라갑니다', px0, 66);
        var cx=px0, cy=98;
        ctx.font='12px ui-monospace,Menlo,monospace';
        for(i=0;i<COLS.length;i++){
          var wcol=ctx.measureText(COLS[i]).width+16;
          if(cx+wcol>px1){ cx=px0; cy+=32; }
          ctx.fillStyle = (COLS[i]==='survived') ? 'rgba(126,224,176,0.16)' : 'rgba(255,122,184,0.12)';
          ctx.strokeStyle = (COLS[i]==='survived') ? GRN : ROSE; ctx.lineWidth=1;
          roundRect(ctx,cx,cy-17,wcol,26,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=TXT; ctx.fillText(COLS[i], cx+8, cy);
          cx+=wcol+10;
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('예측할 목표변수 = survived, 나머지 6개가 예측에 쓸 특징입니다', px0, cy+42);
        ctx.fillText('이 문제의 질문: "이 사람이 살아남았을까?"', px0, cy+62);
      } else if(s.step===1){
        var n1=0; for(i=0;i<N;i++) if(SURV[i]===1) n1++;
        var n0=N-n1, majAcc=n0/N;
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('목표변수(survived) 비율', px0, 40);
        var by=54, bh=34, w0=(px1-px0)*(n0/N), w1=(px1-px0)*(n1/N);
        ctx.fillStyle='rgba(240,136,138,0.32)'; ctx.strokeStyle=RED; ctx.lineWidth=1.2;
        ctx.fillRect(px0,by,w0,bh); ctx.strokeRect(px0,by,w0,bh);
        ctx.fillStyle='rgba(126,224,176,0.32)'; ctx.strokeStyle=GRN;
        ctx.fillRect(px0+w0,by,w1,bh); ctx.strokeRect(px0+w0,by,w1,bh);
        ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillStyle=RED; ctx.fillText('사망 '+n0+'명 ('+(100*n0/N).toFixed(0)+'%)', px0+w0/2, by+21);
        ctx.fillStyle=GRN; ctx.fillText('생존 '+n1+'명 ('+(100*n1/N).toFixed(0)+'%)', px0+w0+w1/2, by+21);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('"무조건 사망" 예측기의 정확도 = '+(majAcc*100).toFixed(1)+'%', px0, by+bh+30);
        ctx.fillStyle=RED;
        ctx.fillText('그런데 생존자 재현율 = 0/'+n1+' = 0.0%', px0, by+bh+50);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('정확도만 보면 그럴듯하지만, 정작 살아남은 사람은 하나도 못 찾아냅니다', px0, by+bh+74);
        ctx.fillText('심하게 치우치진 않았어도(45:55), 정확도 하나만 믿을 순 없습니다', px0, by+bh+94);
      } else if(s.step===2){
        var raws=[PCLASS,SEX,AGE,SIBSP,PARCH,FARE,SURV];
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('열별 결측 현황 (df.isna().sum())', px0, 38);
        var ty=62, rh=24;
        for(i=0;i<COLS.length;i++){
          var miss=0, r; for(r=0;r<N;r++) if(raws[i][r]===null) miss++;
          var pct=100*miss/N;
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=(miss>0)?GLD:DIM;
          ctx.fillText(COLS[i], px0, ty+i*rh);
          var bw=(px1-px0-220)*(pct/100);
          ctx.fillStyle=(miss>0)?'rgba(255,210,122,0.35)':'rgba(255,255,255,0.06)';
          ctx.strokeStyle=(miss>0)?GLD:'rgba(255,255,255,0.2)'; ctx.lineWidth=1;
          ctx.fillRect(px0+130, ty+i*rh-13, Math.max(2,bw), 16); ctx.strokeRect(px0+130, ty+i*rh-13, Math.max(2,bw), 16);
          ctx.fillStyle=(miss>0)?GLD:DIM; ctx.font='11.5px ui-monospace,Menlo,monospace';
          ctx.fillText(miss+'개 ('+pct.toFixed(0)+'%)', px0+130+220-90, ty+i*rh);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('age 열만 '+8+'명분이 비어 있습니다 — 다음 화면에서 이 구멍을 메웁니다', px0, ty+COLS.length*rh+16);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('무엇을 "성공"이라 부를 것인가', px0, 40);
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('생존자를 놓치는 실수(FN)와 사망자를 생존으로 헛짚는 실수(FP)는', px0, 68);
        ctx.fillText('둘 다 이 프로젝트에서 뼈아픕니다 — 어느 한쪽만 편들 이유가 없습니다', px0, 88);
        ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('F1 = 2 × 정밀도 × 재현율 / (정밀도 + 재현율)', px0, 122);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('정밀도(헛짚지 않기)와 재현율(놓치지 않기)을 함께 재는 지표입니다', px0, 146);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('→ 이 장에서는 F1을 성공의 기준으로 고정합니다', px0, 176);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('이 기준은 전처리·모델비교·튜닝·최종평가까지 끝까지 함께 갑니다', px0, 204);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (행·열 → 목표비율 → 결측 → 성공기준)', true);
      E.big('문제를 정의하고 데이터를 만나다', '실전 프로젝트는 코드를 치기 전에 던지는 질문에서 시작합니다 — 무엇을 예측하려 하는가, 그리고 무엇을 "잘했다"고 부를 것인가. 승객 40명의 기록을 열어 행·열 수, 목표변수의 비율, 결측치 현황을 실제로 세어 보고, 정확도 하나만으로는 안심할 수 없는 이유를 확인한 뒤 F1을 이 프로젝트의 성공 기준으로 못박습니다. 여기서 세운 기준이 마지막 장면까지 그대로 이어집니다.'); }
  },

  // ══════════ 2. 전처리와 피처 엔지니어링 ══════════
  { id:'bda11_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"age = age.fillna(age.median())", hl:'fillna'},
        {t:"sex = sex.map({'female':1,'male':0})", hl:'.map('},
        {t:"family = sibsp + parch + 1", hl:'family'},
        {t:"alone = (family == 1).astype(int)", hl:'alone'},
        {t:"age_grp = pd.cut(age,[0,12,60,99])", hl:'pd.cut'}
      ];
      var acti=[0,1,3,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'feature_eng.py', acti);
      var caps=['빈 나이를 무엇으로 채울지 고릅니다',
                '문자가 아니라 숫자라야 모델이 이해합니다',
                '가족 수를 "혼자인가"로 바꿔 봅니다',
                '나이를 구간으로 바꿔 봅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;
      var known=[]; for(i=0;i<N;i++) if(AGE[i]!==null) known.push(AGE[i]);
      var medianAge=median(known), meanAge=mean(known);

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('결측 '+(N-known.length)+'명을 무엇으로 채울까', px0, 38);
        var axL=px0, axR=px1, aMin=0, aMax=90, ay=110;
        function PX(a){ return axL+(a-aMin)/(aMax-aMin)*(axR-axL); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axL,ay); ctx.lineTo(axR,ay); ctx.stroke();
        for(i=0;i<known.length;i++){ ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PX(known[i]),ay,4,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        for(i=0;i<=90;i+=30){ ctx.fillText(''+i, PX(i), ay+18);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(PX(i),ay); ctx.lineTo(PX(i),ay+5); ctx.stroke(); }
        ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(PX(medianAge),ay-30); ctx.lineTo(PX(medianAge),ay+5); ctx.stroke();
        ctx.strokeStyle=ROSE; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(PX(meanAge),ay-30); ctx.lineTo(PX(meanAge),ay+5); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=GLD; ctx.fillText('중앙값 = '+medianAge.toFixed(1)+'세  ← 채울 값으로 선택', px0, ay+40);
        ctx.fillStyle=ROSE; ctx.fillText('평균 = '+meanAge.toFixed(1)+'세  (70대 두 명이 끌어올림)', px0, ay+60);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('평균은 극단값에 잘 흔들리지만 중앙값은 덜 흔들립니다 — 그래서 중앙값을 씁니다', px0, ay+86);
        ctx.fillText('빈 '+(N-known.length)+'명은 모두 '+medianAge.toFixed(1)+'세로 채워집니다(0명 결측)', px0, ay+106);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('문자를 숫자로 — 그런데 방식이 다릅니다', px0, 38);
        var by=56, bw=(px1-px0-16)/2, bh=90;
        roundRect(ctx,px0,by,bw,bh,8); ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='600 12.5px sans-serif'; ctx.fillText('sex — 순서 없음(명목)', px0+12, by+24);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText("{'female':1,'male':0}", px0+12, by+48);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('숫자 크기에 뜻을 두지 않는 단순 표시', px0+12, by+70);
        var bx2=px0+bw+16;
        roundRect(ctx,bx2,by,bw,bh,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('pclass — 순서 있음(서열)', bx2+12, by+24);
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
        ctx.fillText('1등급 < 2등급 < 3등급', bx2+12, by+48);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('이미 숫자 순서가 뜻과 맞아 그대로 사용', bx2+12, by+70);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('9장에서 배운 그 구분 그대로입니다 — 순서 없는 값을 숫자로 억지로 매기면 사고가 납니다', px0, by+bh+30);
        ctx.fillText('sex는 값이 둘뿐이라 원-핫 없이 0/1 하나의 열로 충분합니다', px0, by+bh+50);
      } else if(s.step===2){
        var aloneIdx=[], notIdx=[];
        for(i=0;i<N;i++){ if(FAM[i]===1) aloneIdx.push(i); else notIdx.push(i); }
        function rateOf(idx){ var s2=0; for(var k=0;k<idx.length;k++) s2+=SURV[idx[k]]; return {n:idx.length, s:s2, r:s2/idx.length}; }
        var rA=rateOf(aloneIdx), rB=rateOf(notIdx);
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('파생변수 alone — 정말 쓸모가 있을까?', px0, 38);
        var by=58, bh=32, bw=(px1-px0-140);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('혼자(가족수=1) n='+rA.n, px0, by-6);
        ctx.fillStyle='rgba(126,224,176,0.35)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2;
        ctx.fillRect(px0+140,by,bw*rA.r,bh); ctx.strokeRect(px0+140,by,bw*rA.r,bh);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText((rA.r*100).toFixed(0)+'% 생존 ('+rA.s+'/'+rA.n+')', px0+150, by+21);
        var by2=by+bh+30;
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('동반자 있음 n='+rB.n, px0, by2-6);
        ctx.fillStyle='rgba(240,136,138,0.35)'; ctx.strokeStyle=RED;
        ctx.fillRect(px0+140,by2,bw*rB.r,bh); ctx.strokeRect(px0+140,by2,bw*rB.r,bh);
        ctx.fillStyle=RED; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText((rB.r*100).toFixed(0)+'% 생존 ('+rB.s+'/'+rB.n+')', px0+150, by2+21);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('원래 열(sibsp·parch) 따로는 안 보이던 차이가, 합쳐 만든 alone에서', px0, by2+bh+30);
        ctx.fillText((rA.r*100).toFixed(0)+'%p 대 '+(rB.r*100).toFixed(0)+'%p로 뚜렷하게 드러납니다 — 파생변수가 유용한 이유입니다', px0, by2+bh+50);
      } else {
        var agefillFull=medianAge;
        function grp(a){ if(a<=12) return 0; if(a>=60) return 2; return 1; }
        var buckets=[[],[],[]];
        for(i=0;i<N;i++){ var a=(AGE[i]===null)?agefillFull:AGE[i]; buckets[grp(a)].push(i); }
        var names=['어린이(≤12)','성인(13~59)','고령(≥60)'], cols=[GRN,BLU,GLD];
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('파생변수 age_grp — 나이대별 생존율', px0, 38);
        var by0=56, bh2=30, gap=40, bw2=(px1-px0-150);
        for(i=0;i<3;i++){
          var idx=buckets[i], s2=0; for(var k=0;k<idx.length;k++) s2+=SURV[idx[k]];
          var r=idx.length?s2/idx.length:0, y=by0+i*gap;
          ctx.font='12px sans-serif'; ctx.fillStyle=DIM; ctx.fillText(names[i]+' n='+idx.length, px0, y-6);
          ctx.fillStyle=cols[i]+'55'; ctx.strokeStyle=cols[i]; ctx.lineWidth=1.2;
          ctx.fillRect(px0+150,y,bw2*r,bh2); ctx.strokeRect(px0+150,y,bw2*r,bh2);
          ctx.fillStyle=cols[i]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText((r*100).toFixed(0)+'% ('+s2+'/'+idx.length+')', px0+160, y+20);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('어린이 → 성인 → 고령으로 갈수록 생존율이 뚜렷하게 낮아집니다', px0, by0+3*gap+16);
        ctx.fillText('나이 하나의 숫자보다 이 구간 정보가 모델에 더 곧바로 와닿습니다', px0, by0+3*gap+36);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (결측 → 인코딩 → 혼자여부 → 나이대)', true);
      E.big('전처리와 피처 엔지니어링', '빈 칸을 메우고 문자를 숫자로 바꾸는 일은 시작일 뿐입니다. 진짜 힘은 원래 없던 변수를 새로 만드는 데서 나옵니다 — 가족 수를 "혼자인가"로 압축하니 생존율이 75%대 25%로 갈리고, 나이를 구간으로 나누니 어린이·성인·고령의 생존율이 계단처럼 갈립니다. 두 경우 모두 원래 열 그대로는 보이지 않던 차이가, 파생변수로 바꾸자 실제 숫자로 드러났습니다.'); }
  },

  // ══════════ 3. 여러 모델을 같은 잣대로 비교 ══════════
  { id:'bda11_03',
    enter:function(E){ var self=this;
      var scores={
        majority: cvF1(POOL,5,'majority'),
        rule: cvF1(POOL,5,'rule'),
        logistic: cvF1(POOL,5,'logistic'),
        knn: cvF1(POOL,5,'knn',5)
      };
      self.s={step:0, scores:scores};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'prep = ColumnTransformer([...])', hl:'ColumnTransformer'},
        {t:"pipe = Pipeline([('prep',prep),", hl:'Pipeline'},
        {t:"                ('clf', model)])", dim:true},
        {t:'cross_val_score(pipe, X, y, cv=5,', hl:'cross_val_score'},
        {t:"                scoring='f1')", dim:true}
      ];
      var acti=(s.step===0)?1:3;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'compare.py', acti);
      var caps=['왜 굳이 파이프라인으로 묶을까요',
                '같은 5겹 접기로 4개 모델을 나란히 재봅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('9장의 누수 경고, 여기서도 그대로 적용됩니다', px0, 32);
        var bw=(px1-px0-16)/2, bh=118, by=48;
        roundRect(ctx,px0,by,bw,bh,8); ctx.fillStyle='rgba(240,136,138,0.10)'; ctx.strokeStyle=RED; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
        ctx.fillStyle=RED; ctx.font='600 12.5px sans-serif'; ctx.fillText('✗ 전체로 먼저 통계 계산', px0+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('나이 중앙값·표준화 평균을', px0+10, by+44);
        ctx.fillText('40명 전체로 구한 뒤 나눔', px0+10, by+62);
        ctx.fillText('→ 검증 폴드 정보가 학습에', px0+10, by+84);
        ctx.fillText('   살짝 새어 들어갑니다', px0+10, by+102);
        var bx2=px0+bw+16;
        roundRect(ctx,bx2,by,bw,bh,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('✓ 파이프라인 + 교차검증', bx2+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('훈련 폴드에서만 중앙값·', bx2+10, by+44);
        ctx.fillText('평균을 다시 계산해 적용', bx2+10, by+62);
        ctx.fillText('→ 검증 폴드는 정말 처음', bx2+10, by+84);
        ctx.fillText('   보는 데이터로 남습니다', bx2+10, by+102);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('Pipeline은 fit()마다 전처리 통계를 그 훈련폴드로 새로 계산합니다', px0, by+bh+26);
        ctx.fillText('그래서 5번 접을 때마다 5번 다시 학습됩니다(느슨해 보여도 이게 정직한 검증)', px0, by+bh+46);
      } else {
        var names=['다수결 기준선','성별 규칙','로지스틱회귀','k-최근접(5)'];
        var keys=['majority','rule','logistic','knn'];
        var cols=[DIM,BLU,ROSE,GLD];
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('5겹 교차검증 평균 F1 — 4개 모델 비교', px0, 30);
        var by0=48, rh=52, bw=(px1-px0-150-95);
        for(i=0;i<4;i++){
          var sc=s.scores[keys[i]], m=mean(sc), y=by0+i*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(names[i], px0, y-4);
          ctx.fillStyle=cols[i]+'40'; ctx.strokeStyle=cols[i]; ctx.lineWidth=1.3;
          ctx.fillRect(px0+150,y,bw*m,20); ctx.strokeRect(px0+150,y,bw*m,20);
          // 폴드별 점(흔들림)
          for(var k=0;k<sc.length;k++){ ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.arc(px0+150+bw*sc[k], y+10, 2.6,0,7); ctx.fill(); }
          ctx.fillStyle=cols[i]; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText('F1='+m.toFixed(3), px0+150+bw+8, y+15);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('작은 점 = 폴드 5개 각각의 점수(흩어질수록 운에 좌우) · 막대 = 평균', px0, by0+4*rh+14);
        ctx.fillText('다수결 기준선은 정확도는 높아 보여도 F1은 바닥입니다 — 1장의 그 경고', px0, by0+4*rh+34);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (파이프라인 → 4개 모델 비교)', true);
      E.big('여러 모델을 같은 잣대로 비교', '모델을 하나만 만들어 보고 끝내면 그게 좋은 건지 알 길이 없습니다. 전처리와 모델을 파이프라인 하나로 묶어야 하는 이유는 9장의 그 경고 때문입니다 — 결측치를 메우는 중앙값도, 표준화 평균도 훈련 폴드 안에서만 계산해야 검증 폴드가 정말 "처음 보는 데이터"로 남습니다. 그렇게 같은 5겹 교차검증이라는 잣대 위에 다수결 기준선·성별 규칙·로지스틱회귀·k-최근접을 나란히 세워 비교합니다.'); }
  },

  // ══════════ 4. 모델을 다듬다 — 하이퍼파라미터 탐색 ══════════
  { id:'bda11_04',
    enter:function(E){ var self=this;
      var known=[]; for(var i=0;i<POOL.length;i++) if(AGE[POOL[i]]!==null) known.push(AGE[POOL[i]]);
      var agefillPool=median(known);
      var Xpool=buildFeatures(POOL,agefillPool), Ypool=[]; for(i=0;i<POOL.length;i++) Ypool.push(SURV[POOL[i]]);
      var stdSelf=standardize(Xpool,Xpool);
      function cvAccPool(k){
        var accs=[], kf,j,ii, K=5;
        for(kf=0;kf<K;kf++){
          var testIdx=[], trainIdx=[];
          for(j=0;j<POOL.length;j++){ if(j%K===kf) testIdx.push(POOL[j]); else trainIdx.push(POOL[j]); }
          var kn=[]; for(ii=0;ii<trainIdx.length;ii++) if(AGE[trainIdx[ii]]!==null) kn.push(AGE[trainIdx[ii]]);
          var af=median(kn);
          var Xtr=buildFeatures(trainIdx,af), Xte=buildFeatures(testIdx,af);
          var Ytr=[]; for(ii=0;ii<trainIdx.length;ii++) Ytr.push(SURV[trainIdx[ii]]);
          var Yte=[]; for(ii=0;ii<testIdx.length;ii++) Yte.push(SURV[testIdx[ii]]);
          var std=standardize(Xtr,Xte);
          accs.push(accOf(Yte, knnPredictStd(std.trS,Ytr,std.teS,k)));
        }
        return mean(accs);
      }
      var trainC=[], valC=[], k, best=null;
      for(k=1;k<=15;k++){
        var predAll=knnPredictStd(stdSelf.trS,Ypool,stdSelf.trS,k);
        var trAcc=accOf(Ypool,predAll), valAcc=cvAccPool(k), gap=trAcc-valAcc;
        trainC.push(trAcc); valC.push(valAcc);
        if(best===null || valAcc>best.val+1e-9 || (Math.abs(valAcc-best.val)<1e-9 && gap<best.gap)) best={k:k,val:valAcc,gap:gap};
      }
      self.s={k:5, trainC:trainC, valC:valC, best:best};
      E.controls('<div class="ctrl"><label>이웃 수 k (k-최근접)</label><input type="range" id="b114k" min="1" max="15" step="1" value="5"><output id="b114ko">5</output></div>');
      E.bind('#b114k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b114ko').textContent=self.s.k; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"grid = {'clf__n_neighbors':", hl:'n_neighbors'},
        {t:'        range(1,16)}', dim:true},
        {t:'gs = GridSearchCV(pipe, grid,', hl:'GridSearchCV'},
        {t:"     cv=5, scoring='accuracy')", dim:true},
        {t:'gs.best_params_, gs.best_score_', hl:'best_params_'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'tune.py', 2);

      var kIdx=s.k-1, trA=s.trainC[kIdx], vaA=s.valC[kIdx], gap=trA-vaA;
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('k = '+s.k+'  →  훈련 정확도 = '+(trA*100).toFixed(1)+'%', W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('검증(5겹 CV) 정확도 = '+(vaA*100).toFixed(1)+'%', W*0.04, ry+19);
      ctx.fillStyle=(gap>0.08)?RED:GRN;
      ctx.fillText('격차 = '+(gap*100).toFixed(1)+'%p'+(gap>0.08?'  (과적합 신호)':'  (안정적)'), W*0.04, ry+38);
      ctx.fillStyle=GLD; ctx.fillText('탐색이 찾은 최적 k* = '+s.best.k+'  (검증 '+(s.best.val*100).toFixed(1)+'%)', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('k가 작으면 훈련 데이터를 거의 외워버려 검증과 벌어지고,', W*0.04, ry+80);
      ctx.fillText('k가 너무 크면 둘 다 무뎌집니다 — 그 사이 어딘가가 최적입니다', W*0.04, ry+100);

      var px0=W*0.47, px1=W*0.965, pTop=42, pBot=280;
      var allVals=s.trainC.concat(s.valC), yMin=Math.min.apply(null,allVals)-0.04, yMax=Math.max.apply(null,allVals)+0.04;
      function PXk(k){ return px0+(k-1)/14*(px1-px0); }
      function PYv(v){ return pBot-(v-yMin)/(yMax-yMin)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('훈련 정확도(금) vs 검증 정확도(파랑) — k=1..15', px0, 14);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        for(var k2=1;k2<=15;k2++){ var x=PXk(k2), y=PYv(arr[k2-1]); if(k2===1) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke(); }
      drawCurve(s.trainC, GLD); drawCurve(s.valC, BLU);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=15;i+=2){ ctx.fillText(''+i, PXk(i), pBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(PXk(i),pBot); ctx.lineTo(PXk(i),pBot+4); ctx.stroke(); }
      // 최적 k* 세로 점선
      ctx.strokeStyle=GRN; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(PXk(s.best.k),pTop); ctx.lineTo(PXk(s.best.k),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('k*='+s.best.k, PXk(s.best.k), pTop-10);
      // 현재 슬라이더 위치 점 2개
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXk(s.k),PYv(trA),5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PXk(s.k),PYv(vaA),5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PXk(s.k),PYv(trA)); ctx.lineTo(PXk(s.k),PYv(vaA)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('점선 = 현재 슬라이더 위치에서 훈련·검증의 격차', px0, pBot+34);

      E.tapHint(W/2, H*0.95, '슬라이더로 k를 바꿔 훈련·검증 점수가 벌어지는 지점을 찾아보세요', true);
      E.big('모델을 다듬다 — 하이퍼파라미터 탐색', '모델을 하나 고르고 끝이 아닙니다. k-최근접의 이웃 수 k처럼 사람이 정해줘야 하는 값(하이퍼파라미터)을 격자로 훑으며 검증 점수가 가장 높은 지점을 찾는 과정이 튜닝입니다. 슬라이더로 k를 움직이면 훈련 정확도와 검증 정확도가 실제로 다시 계산됩니다 — 두 곡선이 크게 벌어지는 곳은 훈련 데이터를 외워버린 과적합의 신호이고, 탐색은 그 격차와 성능 사이에서 균형점을 찾아냅니다.'); }
  },

  // ══════════ 5. 결과를 해석하고 전달하다 ══════════
  { id:'bda11_05',
    enter:function(E){ var self=this;
      var known=[]; for(var i=0;i<POOL.length;i++) if(AGE[POOL[i]]!==null) known.push(AGE[POOL[i]]);
      var agefill=median(known);
      var Xtr=buildFeatures(POOL,agefill), Xte=buildFeatures(TEST,agefill);
      var Ytr=[]; for(i=0;i<POOL.length;i++) Ytr.push(SURV[POOL[i]]);
      var Yte=[]; for(i=0;i<TEST.length;i++) Yte.push(SURV[TEST[i]]);
      var fit=logisticFit(Xtr,Ytr,500,0.3);
      var std=standardize(Xtr,Xte);
      var preds=logisticPredictStd(fit.w,fit.b,std.teS);
      var stat=f1Stats(Yte,preds);
      self.s={step:0, w:fit.w, b:fit.b, stat:stat, testN:TEST.length};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:"final = Pipeline([('prep',prep),", hl:'Pipeline'},
        {t:"    ('clf', LogisticRegression())])", dim:true},
        {t:'final.fit(X_train, y_train)', hl:'.fit('},
        {t:'confusion_matrix(y_test, pred)', hl:'confusion_matrix'},
        {t:"final.named_steps['clf'].coef_", hl:'.coef_'}
      ];
      var acti=[3,3,4,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'final.py', acti);
      var caps=['한 번도 안 쓴 '+s.testN+'명으로 최종 채점합니다',
                '숫자를 사람의 말로 옮깁니다',
                '무엇이 생존을 갈랐는지 봅니다',
                '프로젝트를 마무리합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965, st=s.stat;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('혼동행렬 (held-out '+s.testN+'명)', px0, 34);
        var gx=px0, gy=54, cw=76, rh=34, lw=64;
        ctx.font='600 11.5px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle=DIM; ctx.fillText('실제 생존', gx+lw+cw/2, gy);
        ctx.fillText('실제 사망', gx+lw+cw+cw/2, gy);
        var cells=[[st.TP,st.FP],[st.FN,st.TN]], labels=[['TP','FP'],['FN','TN']], rlab=['예측 생존','예측 사망'];
        for(var r=0;r<2;r++){
          var ry2=gy+16+r*rh;
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
          ctx.fillText(rlab[r], gx, ry2+rh/2+4);
          for(var c=0;c<2;c++){
            var cx=gx+lw+c*cw;
            var col=(labels[r][c]==='TP'||labels[r][c]==='TN')?GRN:RED;
            ctx.fillStyle=col+'26'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
            ctx.fillRect(cx,ry2,cw-4,rh-4); ctx.strokeRect(cx,ry2,cw-4,rh-4);
            ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
            ctx.fillText(labels[r][c]+'='+cells[r][c], cx+(cw-4)/2, ry2+rh/2+5);
          }
        }
        ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('맞춘 사람 = TP+TN = '+(st.TP+st.TN)+'명 / '+s.testN+'명', px0, gy+16+2*rh+26);
        ctx.fillText('놓친 생존자(FN) '+st.FN+'명, 헛짚은 사망자(FP) '+st.FP+'명', px0, gy+16+2*rh+46);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('숫자를 사람의 말로', px0, 34);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('정확도 = '+(st.acc*100).toFixed(1)+'%', px0, 60);
        ctx.fillStyle=GLD; ctx.fillText('정밀도 = '+(st.prec*100).toFixed(1)+'%', px0, 82);
        ctx.fillStyle=ROSE; ctx.fillText('재현율 = '+(st.rec*100).toFixed(1)+'%', px0, 104);
        ctx.fillStyle=GRN; ctx.fillText('F1 = '+st.f1.toFixed(3), px0, 126);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('"'+s.testN+'명 중 '+(st.TP+st.TN)+'명을 맞혔고, 놓친 생존자 '+st.FN+'명과', px0, 156);
        ctx.fillText('헛짚은 사망자 '+st.FP+'명이 있었다" — 이게 저 숫자들의 실체입니다', px0, 176);
        ctx.fillText('1장에서 정한 F1 기준으로 이 모델은 '+st.f1.toFixed(2)+'점을 받았습니다', px0, 204);
        ctx.fillText('다수결로만 찍었다면 F1은 0에 가까웠을 것 — 그보다는 훨씬 낫습니다', px0, 224);
      } else if(s.step===2){
        var names=['성별(여성)','객실등급','나이','가족수','요금'];
        var idx=[0,1,2,3,4].slice().sort(function(a,b){ return Math.abs(s.w[b])-Math.abs(s.w[a]); });
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('무엇이 생존을 갈랐는가 (|표준화계수|)', px0, 32);
        var maxAbs=Math.abs(s.w[idx[0]]), by0=50, rh2=44, bw2=(px1-px0-150-150);
        for(i=0;i<5;i++){
          var j=idx[i], val=s.w[j], y=by0+i*rh2;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(names[j], px0, y-4);
          var w2=Math.max(2, Math.abs(val)/maxAbs*bw2);
          var col=(val>=0)?GRN:RED;
          ctx.fillStyle=col+'40'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
          ctx.fillRect(px0+150,y,w2,18); ctx.strokeRect(px0+150,y,w2,18);
          ctx.fillStyle=col; ctx.font='600 12px ui-monospace,Menlo,monospace';
          ctx.fillText((val>=0?'+':'')+val.toFixed(2)+(val>=0?' (생존↑)':' (생존↓)'), px0+150+w2+8, y+14);
        }
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('성별이 압도적입니다 — 표준화된 계수라서 서로 다른 단위끼리도 비교할 수 있습니다', px0, by0+5*rh2+8);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('여기까지 — 문제정의부터 최종해석까지', px0, 34);
        ctx.font='12.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('목표를 정하고(1) → 결측·파생변수를 다듬고(2) → 여러 모델을', px0, 62);
        ctx.fillText('같은 잣대로 비교하고(3) → 하이퍼파라미터를 탐색하고(4) →', px0, 82);
        ctx.fillText('최종 모델을 held-out 데이터로 채점하고 계수를 읽었습니다(5)', px0, 102);
        ctx.fillStyle=GLD; ctx.font='600 13px ui-monospace,Menlo,monospace';
        ctx.fillText('숫자를 사람의 언어로 옮기는 것이 분석의 마지막 일입니다', px0, 138);
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif';
        ctx.fillText('다음 파트 — 고급 예측 모델링(20장)과 실전 사례연구 10건이 이어집니다', px0, 172);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('더 정교한 모델·더 큰 데이터를 만나도 이 다섯 단계는 그대로입니다', px0, 200);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (혼동행렬 → 지표 → 변수중요도 → 마무리)', true);
      E.big('결과를 해석하고 전달하다', '지금까지 한 번도 쓰지 않은 '+s.testN+'명으로 최종 모델을 채점합니다. 혼동행렬을 실제로 채우고 정확도·정밀도·재현율·F1을 계산해, 그 숫자가 "누구를 놓쳤고 누구를 헛짚었는지"를 말해 주는 사람의 언어로 옮깁니다. 마지막으로 계수를 읽어 무엇이 생존을 갈랐는지 설명합니다 — 숫자를 말로 옮기는 것, 그것이 분석의 마지막 일입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
