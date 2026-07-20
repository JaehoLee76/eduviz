/* 빅데이터 분석 제15장 — 과적합과 모델 튜닝 (고급 파트의 심장)
   동작(behavior)만. 텍스트=content/bda15.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(훈련·시험 오차, 격자점수, 재표본 평균·표준오차, 정확도)는
   아래 고정 배열로부터 draw/build에서 실제 계산(하드코딩 금지). 다항회귀는 정규방정식을
   가우스 소거법으로 직접 구현. 부트스트랩 인덱스는 고정 시드 선형합동생성기(LCG)로 사전계산.
   난수(Math.random) 절대 금지. */
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

  // 다항회귀(능형): 정규방정식을 가우스 소거법으로 직접 풂
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
  function rmseOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++){ var d=ys[i]-preds[i]; s+=d*d; } return Math.sqrt(s/ys.length); }
  function mseOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++){ var d=ys[i]-preds[i]; s+=d*d; } return s/ys.length; }
  function scaleFor(xsAbs){ var xmin=Math.min.apply(null,xsAbs), xmax=Math.max.apply(null,xsAbs);
    return function(xv){ return 2*(xv-xmin)/(xmax-xmin)-1; }; }

  // 분류용: 표준화·로지스틱회귀·kNN
  function standardizeTrTe(Xtr,Xte){
    var ncol=Xtr[0].length, means=[], sds=[],c,r;
    for(c=0;c<ncol;c++){ var s=0; for(r=0;r<Xtr.length;r++)s+=Xtr[r][c]; var m=s/Xtr.length;
      var v=0; for(r=0;r<Xtr.length;r++){var d=Xtr[r][c]-m; v+=d*d;} v/=Xtr.length;
      means.push(m); sds.push(v>1e-9?Math.sqrt(v):1); }
    function tr(X){ return X.map(function(row){ return row.map(function(x,c2){ return (x-means[c2])/sds[c2]; }); }); }
    return {trS:tr(Xtr), teS:tr(Xte)};
  }
  function logisticFit(Xs,Ytr,iters,lr){
    var ncol=Xs[0].length, n=Xs.length, w=[],b=0,c,i,it;
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
  function predictStd(w,b,Xstd){ return Xstd.map(function(row){ var z=b; for(var c=0;c<w.length;c++) z+=w[c]*row[c]; return 1/(1+Math.exp(-z))>=0.5?1:0; }); }
  function knnPred(Xtr,Ytr,Xte,k){
    return Xte.map(function(xte){
      var d=Xtr.map(function(xtr,j){ var s=0; for(var c=0;c<xte.length;c++){ var df=xte[c]-xtr[c]; s+=df*df; } return [s,Ytr[j]]; });
      d.sort(function(a,b){return a[0]-b[0];});
      var sum=0; for(var m=0;m<k;m++) sum+=d[m][1];
      return sum*2>=k?1:0;
    });
  }
  function accOf(y,p){ var c=0; for(var i=0;i<y.length;i++) if(y[i]===p[i]) c++; return c/y.length; }
  // 고정 시드 선형합동생성기(LCG) — 부트스트랩 인덱스를 결정적으로 사전계산
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  var scenes = [

  // ══════════ 1. 과적합이란 무엇인가 ══════════
  { id:'bda15_01',
    enter:function(E){ var self=this;
      var x=[0,1,2,3,4,5,6,7,8,9,10,11];
      var noise=[0.8,-0.6,1.1,-1.3,0.4,-0.9,1.5,-0.3,0.7,-1.1,0.2,-0.5];
      var y=x.map(function(xi,i){ return 3+0.5*xi-0.15*xi*xi+0.01*xi*xi*xi+noise[i]; });
      var testIdx=[2,5,8,11], trainIdx=[0,1,3,4,6,7,9,10];
      var sc=scaleFor(trainIdx.map(function(i){return x[i];}));
      var ytr=trainIdx.map(function(i){return y[i];}), yte=testIdx.map(function(i){return y[i];});
      var xtrS=trainIdx.map(function(i){return sc(x[i]);}), xteS=testIdx.map(function(i){return sc(x[i]);});
      var trainC=[], testC=[], deg;
      for(deg=1; deg<=7; deg++){
        var w=fitRidge(xtrS,ytr,deg,1e-6);
        trainC.push(rmseOf(ytr, xtrS.map(function(xv){return polyPredict(w,xv);})));
        testC.push(rmseOf(yte, xteS.map(function(xv){return polyPredict(w,xv);})));
      }
      var best=null;
      for(deg=1; deg<=7; deg++){ if(best===null || testC[deg-1]<best.v) best={deg:deg, v:testC[deg-1]}; }
      self.s={deg:1, x:x, y:y, trainIdx:trainIdx, testIdx:testIdx, sc:sc, trainC:trainC, testC:testC, best:best};
      E.controls('<div class="ctrl"><label>모델 복잡도 — 다항식 차수</label><input type="range" id="b151d" min="1" max="7" step="1" value="1"><output id="b151do">1</output></div>');
      E.bind('#b151d','input',function(e){ self.s.deg=+e.target.value; document.getElementById('b151do').textContent=self.s.deg; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'poly = PolynomialFeatures(degree=d)', hl:'PolynomialFeatures'},
        {t:'Xp = poly.fit_transform(X_train)', hl:'.fit_transform('},
        {t:'model = LinearRegression().fit(Xp, y_train)', hl:'LinearRegression'},
        {t:'rmse(y_train, model.predict(Xp))   # 훈련', hl:'y_train'},
        {t:'rmse(y_test, model.predict(Xtp))   # 시험', hl:'y_test'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'overfit_demo.py', 2);

      var d=s.deg, dIdx=d-1, trR=s.trainC[dIdx], teR=s.testC[dIdx];
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('차수='+d+'  훈련 RMSE = '+trR.toFixed(3), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('시험 RMSE = '+teR.toFixed(3), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('최적 차수* = '+s.best.deg+' (시험 RMSE='+s.best.v.toFixed(3)+')', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('차수를 올릴수록 훈련 오차는 계속 줄지만,', W*0.04, ry+60);
      ctx.fillText('시험 오차는 어느 지점부터 다시 커집니다', W*0.04, ry+80);

      var px0=W*0.47, px1=W*0.965, pTop=42, pBot=234;
      var yMaxAll=Math.max.apply(null,s.testC.concat(s.trainC));
      var yMax=Math.min(yMaxAll, 6)+0.3;
      function PXd(dv){ return px0+(dv-1)/6*(px1-px0); }
      function PYr(rv){ return pBot-(Math.min(rv,yMax)/yMax)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('훈련 RMSE(금) vs 시험 RMSE(파랑) — 차수 1..7', px0, 14);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      function drawCurve(arr,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
        for(var dv=1; dv<=7; dv++){ var xx=PXd(dv), yy=PYr(arr[dv-1]); if(dv===1) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); } ctx.stroke(); }
      drawCurve(s.trainC, GLD); drawCurve(s.testC, BLU);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=7;i++){ ctx.fillText(''+i, PXd(i), pBot+16);
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(PXd(i),pBot); ctx.lineTo(PXd(i),pBot+4); ctx.stroke(); }
      ctx.strokeStyle=GRN; ctx.setLineDash([4,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(PXd(s.best.deg),pTop); ctx.lineTo(PXd(s.best.deg),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('차수*='+s.best.deg, PXd(s.best.deg), pTop-10);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXd(d),PYr(trR),5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(PXd(d),PYr(teR),5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PXd(d),PYr(trR)); ctx.lineTo(PXd(d),PYr(teR)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('점선 = 현재 슬라이더 위치의 훈련·시험 격차 (RMSE 6 이상은 그래프 상단에서 잘림)', px0, pBot+34);

      E.tapHint(W/2, H*0.95, '슬라이더로 차수를 올려 훈련·시험 오차가 갈라지는 지점을 찾아보세요', true);
      E.big('과적합이란 무엇인가', '작은 관측 12건에 다항식을 맞춰 봅니다. 차수를 슬라이더로 올릴수록(모델이 복잡해질수록) 훈련 오차는 차수 7에서 거의 0까지 계속 줄어듭니다 — 8개 훈련점에 7차식은 사실상 모든 점을 그대로 통과할 수 있기 때문입니다. 하지만 한 번도 보지 않은 시험 데이터에 대한 오차는 차수 1~2에서 가장 낮고(RMSE≈0.92) 그 뒤로는 오히려 커집니다. 훈련 오차만 보고 모델을 고르면 이 U자 곡선의 반대편, 즉 데이터를 외워버린 지점을 "최고의 모델"로 착각하게 됩니다 — 이것이 과적합입니다.'); }
  },

  // ══════════ 2. 튜닝 파라미터 — 격자 지형 ══════════
  { id:'bda15_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i,j;
      var x=[0,1,2,3,4,5,6,7,8,9,10,11];
      var noise=[0.8,-0.6,1.1,-1.3,0.4,-0.9,1.5,-0.3,0.7,-1.1,0.2,-0.5];
      var y=x.map(function(xi,idx){ return 3+0.5*xi-0.15*xi*xi+0.01*xi*xi*xi+noise[idx]; });
      var N=x.length, degs=[1,2,3,4,5,6], lambdas=[0,0.01,0.1,1,10];
      function cvMSE(deg,lambda,K){
        var errs=[];
        for(var kf=0;kf<K;kf++){
          var testIdx=[],trainIdx=[];
          for(var j2=0;j2<N;j2++){ if(j2%K===kf) testIdx.push(j2); else trainIdx.push(j2); }
          var sc=scaleFor(trainIdx.map(function(i2){return x[i2];}));
          var xtr=trainIdx.map(function(i2){return sc(x[i2]);}), ytr=trainIdx.map(function(i2){return y[i2];});
          var xte=testIdx.map(function(i2){return sc(x[i2]);}), yte=testIdx.map(function(i2){return y[i2];});
          var w=fitRidge(xtr,ytr,deg,lambda||1e-6);
          errs.push(mseOf(yte, xte.map(function(xv){return polyPredict(w,xv);})));
        }
        return mean(errs);
      }
      var grid=[], best=null;
      degs.forEach(function(dg){
        var row=lambdas.map(function(lm){ var e=cvMSE(dg,lm,4); return e; });
        grid.push(row);
        row.forEach(function(e,li){ if(best===null||e<best.e) best={deg:dg,lam:lambdas[li],e:e,di:degs.indexOf(dg),li:li}; });
      });

      var code=[
        {t:"grid = {'poly__degree':[1,2,3,4,5,6],", hl:'degree'},
        {t:"        'ridge__alpha':[0,.01,.1,1,10]}", hl:'alpha'},
        {t:'gs = GridSearchCV(pipe, grid, cv=4,', hl:'GridSearchCV'},
        {t:"     scoring='neg_mean_squared_error')", dim:true},
        {t:'gs.best_params_, gs.best_score_', hl:'best_params_'}
      ];
      var acti=(s.step===0)?null:(s.step===1?3:4);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'grid_search.py', acti);
      var caps=['사람이 정해줘야 하는 값 두 가지 — 차수와 규제강도',
                '격자의 모든 칸에서 점수를 실제로 계산합니다',
                '가장 낮은 오차 칸이 최종 선택됩니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('튜닝 파라미터 두 가지', px0, 30);
        var bw=(px1-px0-16)/2, bh=118, by=48;
        roundRect(ctx,px0,by,bw,bh,8); ctx.fillStyle='rgba(255,122,184,0.10)'; ctx.strokeStyle=ROSE; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
        ctx.fillStyle=ROSE; ctx.font='600 12.5px sans-serif'; ctx.fillText('다항식 차수 (1~6)', px0+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('모델이 얼마나 구불구불할지', px0+10, by+44);
        ctx.fillText('15.1에서 본 그 복잡도 다이얼', px0+10, by+62);
        var bx2=px0+bw+16;
        roundRect(ctx,bx2,by,bw,bh,8); ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.strokeStyle=GRN; ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.fillText('규제강도 α (0~10)', bx2+10, by+22);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('계수가 커지는 것을 얼마나', bx2+10, by+44);
        ctx.fillText('억누를지(능형회귀 벌점)', bx2+10, by+62);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('두 값을 격자로 조합해 30개 후보를 만들고, 각 칸의 점수를 4겹 교차검증으로 실제 계산합니다', px0, by+bh+30);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('격자 지형 — 4겹 CV 평균 MSE (실측)', px0, 26);
        var gx0=px0+70, gy0=44, cw=(px1-px0-70)/5, ch=28;
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        lambdas.forEach(function(lm,li){ ctx.fillStyle=DIM; ctx.fillText('α='+lm, gx0+cw*(li+0.5), gy0-8); });
        var eMax=0; grid.forEach(function(row){ row.forEach(function(e){ if(e<50&&e>eMax) eMax=e; }); });
        degs.forEach(function(dg,di){
          ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='right';
          ctx.fillText('차수'+dg, gx0-8, gy0+ch*di+ch/2+4);
          grid[di].forEach(function(e,li){
            var capped=Math.min(e,eMax);
            var t=capped/eMax;
            var isBest=(s.step===2 && di===best.di && li===best.li);
            var col = isBest ? GRN : ('rgba('+Math.round(120+120*t)+','+Math.round(120-60*t)+','+Math.round(160-60*t)+',0.55)');
            ctx.fillStyle=col; ctx.fillRect(gx0+cw*li, gy0+ch*di, cw-2, ch-2);
            ctx.strokeStyle=isBest?'#eafff2':'rgba(0,0,0,0.25)'; ctx.lineWidth=isBest?2:1; ctx.strokeRect(gx0+cw*li, gy0+ch*di, cw-2, ch-2);
            ctx.fillStyle=isBest?'#0c1710':'#1a1420'; ctx.font=(isBest?'600 ':'')+'11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
            ctx.fillText(e>=50?'99+':e.toFixed(1), gx0+cw*li+(cw-2)/2, gy0+ch*di+(ch-2)/2+3.5);
          });
        });
        var gridBot=gy0+ch*degs.length;
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
        if(s.step===1){
          ctx.fillText('규제가 없는(α=0) 고차식은 값이 폭발합니다(차수6·α=0 → MSE 99+)', px0, gridBot+22);
          ctx.fillText('규제를 조금만 줘도(α=0.1~1) 고차식이 다시 안정됩니다', px0, gridBot+42);
        } else {
          ctx.fillStyle=GRN; ctx.font='600 11.5px ui-monospace,Menlo,monospace';
          ctx.fillText('최적 칸 = 차수'+best.deg+' · α='+best.lam+'  (MSE='+best.e.toFixed(3)+')', px0, gridBot+22);
          ctx.fillStyle=DIM; ctx.font='11px sans-serif';
          ctx.fillText('가장 단순한 차수(1)에, 아주 약한 규제(0.1)만으로 최저점에 도달했습니다', px0, gridBot+42);
        }
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (두 파라미터 → 격자 계산 → 최적점)', true);
      E.big('튜닝 파라미터 — 격자 지형', '사람이 미리 정해줘야 하는 값(하이퍼파라미터)이 하나가 아니라 여러 개일 때는, 후보들을 격자로 촘촘히 늘어놓고 각 칸의 점수를 전부 실제로 계산해야 합니다. 다항식 차수(1~6)와 능형회귀 규제강도(0~10)를 격자로 조합해 4겹 교차검증 MSE를 실측하면, 규제 없는 고차식(차수6·α=0)은 값이 폭발하지만 같은 차수라도 규제를 조금만 주면 다시 안정됩니다. 이번 데이터에서는 가장 단순한 차수1에 약한 규제(α=0.1)를 더한 조합이 격자 전체에서 최저 오차를 기록했습니다.'); }
  },

  // ══════════ 3. 리샘플링 — 성능을 정직하게 재는 법 ══════════
  { id:'bda15_03',
    enter:function(E){ var self=this;
      var f1=[2.1,3.4,1.2,4.5,2.8,3.9,1.5,4.1,2.3,3.6,1.8,4.3,2.6,3.2,1.1,4.7,2.9,3.7,1.4,4.0];
      var f2=[5.2,3.1,6.8,2.4,4.9,3.3,6.1,2.9,5.5,3.5,6.4,2.6,4.6,3.8,7.0,2.2,4.7,3.4,6.5,3.0];
      var y=f1.map(function(v){ return v>2.7?1:0; });
      [4,8,12].forEach(function(i){ y[i]=1-y[i]; });
      var N=20;
      function buildX(idxs){ return idxs.map(function(i){ return [f1[i],f2[i]]; }); }
      function fitEval(trainIdx,testIdx){
        var Xtr=buildX(trainIdx), Xte=buildX(testIdx);
        var Ytr=trainIdx.map(function(i){return y[i];}), Yte=testIdx.map(function(i){return y[i];});
        var std=standardizeTrTe(Xtr,Xte);
        var fit=logisticFit(std.trS,Ytr,300,0.5);
        var preds=predictStd(fit.w,fit.b,std.teS);
        return accOf(Yte,preds);
      }
      function kfold(offset,K){
        var accs=[];
        for(var kf=0;kf<K;kf++){
          var testIdx=[],trainIdx=[];
          for(var j=0;j<N;j++){ if((j+offset)%K===kf) testIdx.push(j); else trainIdx.push(j); }
          accs.push(fitEval(trainIdx,testIdx));
        }
        return accs;
      }
      var cv5=kfold(0,5);
      var rep=[]; for(var r=0;r<4;r++) rep=rep.concat(kfold(r,5));
      var rng=LCG(20260720), B=15, bootAcc=[];
      for(var b=0;b<B;b++){
        var trainIdx=[]; for(var i=0;i<N;i++) trainIdx.push(Math.floor(rng()*N));
        var inBag={}; trainIdx.forEach(function(ii){ inBag[ii]=true; });
        var testIdx=[]; for(i=0;i<N;i++) if(!inBag[i]) testIdx.push(i);
        if(testIdx.length<2) continue;
        bootAcc.push(fitEval(trainIdx,testIdx));
      }
      self.s={step:0, cv5:cv5, rep:rep, boot:bootAcc};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'cross_val_score(pipe, X, y, cv=5)', hl:'cross_val_score'},
        {t:'RepeatedKFold(n_splits=5, n_repeats=4)', hl:'RepeatedKFold'},
        {t:'for b in range(15):', dim:true},
        {t:'    idx = rng.choice(n, n, replace=True)', hl:'replace=True'},
        {t:'    oob = set(range(n)) - set(idx)', hl:'oob'}
      ];
      var acti=(s.step===0)?[0,1][0]:3;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'resampling.py', s.step===0?0:3);
      var caps=['5겹 교차검증 vs 반복 5겹(4회) — 흩어짐을 비교합니다',
                '부트스트랩(out-of-bag)까지 더해 세 방법을 나란히 봅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        var m5=mean(s.cv5), sd5=sampStd(s.cv5);
        var mR=mean(s.rep), sdR=sampStd(s.rep);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('한 번의 5겹 vs 반복 5겹(4회, 20개 점수)', px0, 30);
        function dotrow(y0,label,accs,col,mm,sd){
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(label, px0, y0-6);
          var bw=(px1-px0-40);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,y0+16); ctx.lineTo(px1,y0+16); ctx.stroke();
          for(var i2=0;i2<accs.length;i2++){ ctx.fillStyle=col; ctx.globalAlpha=0.75; ctx.beginPath(); ctx.arc(px0+bw*accs[i2], y0+16, 4,0,7); ctx.fill(); ctx.globalAlpha=1; }
          ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px0+bw*mm, y0+4); ctx.lineTo(px0+bw*mm, y0+28); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 11.5px ui-monospace,Menlo,monospace';
          ctx.fillText('평균='+mm.toFixed(3)+'  표준편차='+sd.toFixed(3), px0+bw+10>px1-10?px0:px0, y0+46);
        }
        dotrow(56,'5겹 (점 5개)', s.cv5, BLU, m5, sd5);
        dotrow(150,'반복 5겹×4회 (점 20개)', s.rep, GLD, mR, sdR);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('평균은 둘 다 비슷하지만, 점 5개짜리는 표준편차가 더 크게 흔들립니다', px0, 226);
        ctx.fillText('반복해서 더 많은 점수를 모으면 추정치의 불확실성이 줄어듭니다', px0, 246);
      } else {
        var mB=mean(s.boot), sdB=sampStd(s.boot);
        var m5=mean(s.cv5), sd5=sampStd(s.cv5);
        var mR=mean(s.rep), sdR=sampStd(s.rep);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세 재표본 방법의 추정치와 변동폭', px0, 26);
        var groups=[{name:'5겹(n=5)',accs:s.cv5,col:BLU,m:m5,sd:sd5},{name:'반복5겹×4(n=20)',accs:s.rep,col:GLD,m:mR,sd:sdR},{name:'부트스트랩(n='+s.boot.length+')',accs:s.boot,col:GRN,m:mB,sd:sdB}];
        var by0=48, rh=54, bw=(px1-px0-200);
        groups.forEach(function(g,gi){
          var y0=by0+gi*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(g.name, px0, y0-6);
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,y0+14); ctx.lineTo(px1,y0+14); ctx.stroke();
          for(var i2=0;i2<g.accs.length;i2++){ ctx.fillStyle=g.col; ctx.globalAlpha=0.7; ctx.beginPath(); ctx.arc(px0+bw*g.accs[i2], y0+14, 3.4,0,7); ctx.fill(); ctx.globalAlpha=1; }
          ctx.strokeStyle=g.col; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(px0+bw*g.m, y0+2); ctx.lineTo(px0+bw*g.m, y0+26); ctx.stroke();
          ctx.fillStyle=g.col; ctx.font='600 11px ui-monospace,Menlo,monospace';
          ctx.fillText('평균 '+g.m.toFixed(3)+' · 표준편차 '+g.sd.toFixed(3), px0+bw+8, y0+18);
        });
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세 방법의 평균이 조금씩 다른 것 자체가 "한 번의 분할을 믿으면 안 되는" 이유입니다', px0, by0+3*rh+8);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (5겹 vs 반복5겹 → 부트스트랩까지 3방법 비교)', true);
      E.big('리샘플링 — 성능을 정직하게 재는 법', '같은 데이터 20건에 같은 모델을 세 가지 다른 방식으로 재표본해 성능을 실제로 추정합니다. 5겹 교차검증(점수 5개)은 평균 0.900이지만 표준편차 0.137로 크게 흔들리고, 이를 4번 반복해 20개 점수로 늘리면 평균은 비슷해도(0.900) 표준편차가 0.126으로 줄어듭니다. 고정 시드 LCG로 사전계산한 15회 부트스트랩(out-of-bag 평가)은 평균 0.855·표준편차 0.101로 또 다른 추정치를 내놓습니다 — 세 숫자가 서로 다르다는 사실 자체가, 데이터를 "딱 한 번" 나눠서 얻은 점수 하나를 성능의 정답처럼 믿으면 안 되는 이유입니다.'); }
  },

  // ══════════ 4. 모델 선택 — 최고점만 좇지 않기 ══════════
  { id:'bda15_04',
    enter:function(E){ var self=this;
      var f1=[2.1,3.4,1.2,4.5,2.8,3.9,1.5,4.1,2.3,3.6,1.8,4.3,2.6,3.2,1.1,4.7,2.9,3.7,1.4,4.0];
      var f2=[5.2,3.1,6.8,2.4,4.9,3.3,6.1,2.9,5.5,3.5,6.4,2.6,4.6,3.8,7.0,2.2,4.7,3.4,6.5,3.0];
      var y=f1.map(function(v){ return v>2.7?1:0; });
      [4,8,12].forEach(function(i){ y[i]=1-y[i]; });
      var N=20, K=5, ks=[1,3,5,7,9,11];
      function buildX(idxs){ return idxs.map(function(i){ return [f1[i],f2[i]]; }); }
      function cvAccK(k){
        var accs=[];
        for(var kf=0;kf<K;kf++){
          var testIdx=[],trainIdx=[];
          for(var j=0;j<N;j++){ if(j%K===kf) testIdx.push(j); else trainIdx.push(j); }
          var Xtr=buildX(trainIdx), Xte=buildX(testIdx);
          var Ytr=trainIdx.map(function(i){return y[i];}), Yte=testIdx.map(function(i){return y[i];});
          var std=standardizeTrTe(Xtr,Xte);
          accs.push(accOf(Yte, knnPred(std.trS,Ytr,std.teS,k)));
        }
        return accs;
      }
      var res=ks.map(function(k){ var accs=cvAccK(k); var m=mean(accs), se=sampStd(accs)/Math.sqrt(K); return {k:k, mean:m, se:se}; });
      var naive=res[0]; res.forEach(function(r){ if(r.mean>naive.mean) naive=r; });
      var band=naive.mean-naive.se;
      var chosen=null; res.forEach(function(r){ if(r.mean>=band && (chosen===null||r.k>chosen.k)) chosen=r; });
      self.s={step:0, res:res, naive:naive, band:band, chosen:chosen};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'for k in [1,3,5,7,9,11]:', dim:true},
        {t:'    accs = cross_val_score(knn(k), X, y, cv=5)', hl:'cross_val_score'},
        {t:'    se = accs.std(ddof=1) / sqrt(5)', hl:'.std('},
        {t:'best = max(scores, key=mean)', hl:'max('},
        {t:'pick = simplest(score >= best.mean - se)', hl:'simplest'}
      ];
      var acti=(s.step===0)?1:4;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'one_se_rule.py', acti);
      var caps=['k별 평균 정확도와 표준오차를 실제로 계산합니다',
                '1-표준오차 규칙 — 통계적으로 안 다르면 단순한 쪽을 고릅니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965, pTop=44, pBot=250;
      var yMin=0.65, yMax=1.02;
      function PXk(k){ return px0+(k-1)/10*(px1-px0); }
      function PYa(a){ return pBot-(a-yMin)/(yMax-yMin)*(pBot-pTop); }
      ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('k별 5겹 CV 평균 정확도 ± 표준오차', px0, 16);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();

      if(s.step===1){
        var by=PYa(s.band);
        ctx.fillStyle='rgba(126,224,176,0.10)'; ctx.fillRect(px0, PYa(1.02+0.02), px1-px0, by-PYa(1.02+0.02));
        ctx.strokeStyle=GRN; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(px0,by); ctx.lineTo(px1,by); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('1-SE 경계 = '+s.band.toFixed(3), px0+4, by-6);
      }
      s.res.forEach(function(r){
        var x2=PXk(r.k), yTop=PYa(Math.min(yMax,r.mean+r.se)), yBot=PYa(Math.max(yMin,r.mean-r.se)), yM=PYa(r.mean);
        ctx.strokeStyle=DIM; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x2,yTop); ctx.lineTo(x2,yBot); ctx.stroke();
        var isNaive=(s.step>=0 && r.k===s.naive.k);
        var isChosen=(s.step===1 && r.k===s.chosen.k);
        var col = isChosen?GRN:(isNaive?GLD:BLU);
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x2,yM,isNaive||isChosen?6:4,0,7); ctx.fill();
      });
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      s.res.forEach(function(r){ ctx.fillText('k='+r.k, PXk(r.k), pBot+16); });
      if(s.step>=0){
        ctx.fillStyle=GLD; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('naive최고', PXk(s.naive.k), PYa(s.naive.mean+s.naive.se)-10);
      }
      if(s.step===1){
        ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('1-SE 선택', PXk(s.chosen.k), PYa(s.chosen.mean+s.chosen.se)-10);
      }

      var ry=pBot+40;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('naive 최고 = k='+s.naive.k+' (평균 '+s.naive.mean.toFixed(3)+', 표준오차 '+s.naive.se.toFixed(3)+')', px0, ry);
      if(s.step===1){
        ctx.fillStyle=GRN; ctx.fillText('1-SE 선택 = k='+s.chosen.k+' (평균 '+s.chosen.mean.toFixed(3)+', 더 단순함)', px0, ry+19);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('두 k의 평균이 완전히 같아 통계적으로 구분되지 않으므로,', px0, ry+40);
        ctx.fillText('k가 더 큰(더 단순·안정적인) 쪽을 고릅니다', px0, ry+58);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (naive 최고 → 1-표준오차 규칙 적용)', true);
      E.big('모델 선택 — 최고점만 좇지 않기', 'k-최근접 이웃의 이웃 수 k를 1부터 11까지 바꿔가며 5겹 교차검증 평균 정확도와 표준오차를 실제로 계산합니다. 단순히 최고점만 보면 k=7(평균 0.900)이 선택되지만, k=9도 평균이 정확히 0.900으로 동률입니다 — 두 후보는 표준오차 범위 안에서 통계적으로 구분되지 않습니다. "점수가 비슷하면 더 단순한 모델을 고른다"는 1-표준오차 규칙을 적용하면, naive 최고 k=7 대신 이웃을 더 많이 보는(더 완만하고 안정적인) k=9가 최종 선택됩니다.'); }
  },

  // ══════════ 5. 사례: 신용 평가 ══════════
  { id:'bda15_05',
    enter:function(E){ var self=this;
      var debt=[0.62,0.31,0.45,0.72,0.28,0.55,0.38,0.65,0.22,0.48,0.58,0.35,0.42,0.68,0.25,0.51,0.33,0.60,0.29,0.44,0.70,0.26,0.39,0.63,0.31,0.47,0.56,0.24,0.66,0.36];
      var income=[280,410,350,240,460,300,390,260,520,340,290,400,360,250,480,320,420,270,470,355,235,490,380,285,415,345,310,505,255,395];
      var emp=[2,7,4,1,9,3,6,2,11,5,2,8,4,1,10,3,7,2,9,5,1,10,6,2,8,4,3,12,2,7];
      var y=[0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1];
      var N=30;
      var testIdx=[0,5,10,15,20,25], trainIdx=[];
      for(var i=0;i<N;i++) if(testIdx.indexOf(i)<0) trainIdx.push(i);
      function buildFull(idxs){ return idxs.map(function(i2){ return [debt[i2],income[i2],emp[i2]]; }); }
      function build1(idxs){ return idxs.map(function(i2){ return [debt[i2]]; }); }
      function majorityPreds(Ytr,n){ var s=0; for(var i2=0;i2<Ytr.length;i2++)s+=Ytr[i2]; var maj=(s>=Ytr.length/2)?1:0; var o=[]; for(i2=0;i2<n;i2++)o.push(maj); return o; }
      var K=4;
      function cvMajority(){
        var accs=[];
        for(var kf=0;kf<K;kf++){
          var testI=[],trainI=[];
          for(var j=0;j<trainIdx.length;j++){ if(j%K===kf) testI.push(trainIdx[j]); else trainI.push(trainIdx[j]); }
          var Ytr=trainI.map(function(i2){return y[i2];}), Yte=testI.map(function(i2){return y[i2];});
          accs.push(accOf(Yte, majorityPreds(Ytr,testI.length)));
        }
        return accs;
      }
      function cvLogistic(buildFn){
        var accs=[];
        for(var kf=0;kf<K;kf++){
          var testI=[],trainI=[];
          for(var j=0;j<trainIdx.length;j++){ if(j%K===kf) testI.push(trainIdx[j]); else trainI.push(trainIdx[j]); }
          var Ytr=trainI.map(function(i2){return y[i2];}), Yte=testI.map(function(i2){return y[i2];});
          var Xtr=buildFn(trainI), Xte=buildFn(testI);
          var std=standardizeTrTe(Xtr,Xte);
          var fit=logisticFit(std.trS,Ytr,400,0.4);
          accs.push(accOf(Yte, predictStd(fit.w,fit.b,std.teS)));
        }
        return accs;
      }
      var accMaj=cvMajority(), accFull=cvLogistic(buildFull), acc1=cvLogistic(build1);
      var models=[
        {name:'다수결 기준선', accs:accMaj, feat:0},
        {name:'로지스틱(특징 3개)', accs:accFull, feat:3},
        {name:'로지스틱(특징 1개)', accs:acc1, feat:1}
      ];
      models.forEach(function(m){ m.mean=mean(m.accs); m.se=sampStd(m.accs)/Math.sqrt(K); });
      var naive=models[1]; models.forEach(function(m){ if(m.mean>naive.mean) naive=m; });
      var band=naive.mean-naive.se;
      var chosen=naive;
      models.forEach(function(m){ if(m.mean>=band && m.feat>0 && m.feat<chosen.feat) chosen=m; });
      // 최종 모델(chosen)을 훈련 전체(24)로 다시 적합, held-out(6)에서 평가
      var buildChosen = (chosen.feat===1) ? build1 : buildFull;
      var Xtr=buildChosen(trainIdx), Xte=buildChosen(testIdx);
      var Ytr=trainIdx.map(function(i2){return y[i2];}), Yte=testIdx.map(function(i2){return y[i2];});
      var std=standardizeTrTe(Xtr,Xte);
      var fit=logisticFit(std.trS,Ytr,400,0.4);
      var preds=predictStd(fit.w,fit.b,std.teS);
      var TP=0,FP=0,FN=0,TN=0;
      for(i=0;i<Yte.length;i++){
        if(Yte[i]===1&&preds[i]===1)TP++; else if(Yte[i]===0&&preds[i]===1)FP++; else if(Yte[i]===1&&preds[i]===0)FN++; else TN++;
      }
      self.s={step:0, models:models, naive:naive, band:band, chosen:chosen, testN:testIdx.length,
        TP:TP,FP:FP,FN:FN,TN:TN, goodN:y.reduce(function(a,b){return a+b;},0), N:N};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'accs = cross_val_score(pipe, X, y, cv=4)', hl:'cross_val_score'},
        {t:'se = accs.std(ddof=1) / sqrt(4)', hl:'.std('},
        {t:'pick = one_se_rule(candidates)', hl:'one_se_rule'},
        {t:'final = pick.fit(X_train, y_train)', hl:'.fit('},
        {t:'confusion_matrix(y_test, final.predict(X_test))', hl:'confusion_matrix'}
      ];
      var acti=[null,0,2,4][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'credit_case.py', acti);
      var caps=['신청자 '+s.N+'명 — 좋음/나쁨이 어떻게 나뉘어 있나',
                '후보 세 모델을 같은 4겹 교차검증으로 재봅니다',
                '1-표준오차 규칙으로 더 단순한 후보를 고릅니다',
                '한 번도 안 쓴 '+s.testN+'명으로 최종 채점합니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.47, px1=W*0.965;

      if(s.step===0){
        var badN=s.N-s.goodN;
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('신용 평가 신청자 '+s.N+'명', px0, 40);
        var by=60, bh=36, w0=(px1-px0)*(s.goodN/s.N), w1=(px1-px0)*(badN/s.N);
        ctx.fillStyle='rgba(126,224,176,0.32)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.2;
        ctx.fillRect(px0,by,w0,bh); ctx.strokeRect(px0,by,w0,bh);
        ctx.fillStyle='rgba(240,136,138,0.32)'; ctx.strokeStyle=RED;
        ctx.fillRect(px0+w0,by,w1,bh); ctx.strokeRect(px0+w0,by,w1,bh);
        ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
        ctx.fillStyle=GRN; ctx.fillText('좋음 '+s.goodN+'명 ('+(100*s.goodN/s.N).toFixed(0)+'%)', px0+w0/2, by+22);
        ctx.fillStyle=RED; ctx.fillText('나쁨 '+badN+'명 ('+(100*badN/s.N).toFixed(0)+'%)', px0+w0+w1/2, by+22);
        ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
        ctx.fillText('"무조건 좋음" 예측기의 정확도 = '+(100*s.goodN/s.N).toFixed(1)+'%', px0, by+bh+32);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('11장에서 본 그 함정이 여기서도 그대로 적용됩니다', px0, by+bh+54);
        ctx.fillText('연체비율·소득·근속연수 3개 특징으로 대출 상환 여부를 예측합니다', px0, by+bh+76);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('4겹 교차검증 평균 정확도 — 후보 3개', px0, 26);
        var by0=48, rh=54, bw=(px1-px0-170-165);
        s.models.forEach(function(m,mi){
          var y0=by0+mi*rh;
          ctx.font='12px sans-serif'; ctx.fillStyle=TXT; ctx.fillText(m.name, px0, y0-4);
          var col=mi===0?DIM:(mi===1?BLU:GLD);
          ctx.fillStyle=col+'40'; ctx.strokeStyle=col; ctx.lineWidth=1.3;
          ctx.fillRect(px0+170,y0,bw*m.mean,20); ctx.strokeRect(px0+170,y0,bw*m.mean,20);
          for(var k=0;k<m.accs.length;k++){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px0+170+bw*m.accs[k], y0+10, 2.6,0,7); ctx.fill(); }
          ctx.fillStyle=col; ctx.font='600 11.5px ui-monospace,Menlo,monospace';
          ctx.fillText('평균='+m.mean.toFixed(3)+' 표준오차='+m.se.toFixed(3), px0+170+bw+8, y0+15);
        });
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('특징 3개짜리와 1개(연체비율)짜리 로지스틱회귀가 평균·표준오차까지 완전히 같습니다', px0, by0+3*rh+8);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('1-표준오차 규칙 적용', px0, 30);
        ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('naive 최고 = '+s.naive.name+' (평균 '+s.naive.mean.toFixed(3)+')', px0, 58);
        ctx.fillStyle=GRN; ctx.fillText('1-SE 경계 = '+s.band.toFixed(3)+' (naive평균 - 표준오차)', px0, 80);
        ctx.fillStyle=GLD; ctx.fillText('선택 = '+s.chosen.name, px0, 106);
        ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('특징 1개짜리도 경계 안(평균 '+s.chosen.mean.toFixed(3)+' ≥ '+s.band.toFixed(3)+')에 들어오므로,', px0, 132);
        ctx.fillText('특징을 3개나 쓸 필요 없이 연체비율 하나로 충분하다고 판단합니다', px0, 152);
        ctx.fillStyle=GRN; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('→ 해석·배포가 더 쉬운 단순 모델이 최종 후보로 결정', px0, 182);
      } else {
        var acc=(s.TP+s.TN)/s.testN;
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('최종 모델 — held-out '+s.testN+'명 채점', px0, 30);
        var gx=px0, gy=50, cw=80, rh2=32, lw=66;
        ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle=DIM; ctx.fillText('실제 좋음', gx+lw+cw/2, gy); ctx.fillText('실제 나쁨', gx+lw+cw+cw/2, gy);
        var cells=[[s.TP,s.FP],[s.FN,s.TN]], labels=[['TP','FP'],['FN','TN']], rlab=['예측 좋음','예측 나쁨'];
        for(var r=0;r<2;r++){
          var ry2=gy+16+r*rh2;
          ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
          ctx.fillText(rlab[r], gx, ry2+rh2/2+4);
          for(var c=0;c<2;c++){
            var cx=gx+lw+c*cw;
            var col=(labels[r][c]==='TP'||labels[r][c]==='TN')?GRN:RED;
            ctx.fillStyle=col+'26'; ctx.strokeStyle=col; ctx.lineWidth=1.2;
            ctx.fillRect(cx,ry2,cw-4,rh2-4); ctx.strokeRect(cx,ry2,cw-4,rh2-4);
            ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
            ctx.fillText(labels[r][c]+'='+cells[r][c], cx+(cw-4)/2, ry2+rh2/2+5);
          }
        }
        ctx.textAlign='left'; ctx.fillStyle=GLD; ctx.font='600 12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('정확도 = ('+s.TP+'+'+s.TN+')/'+s.testN+' = '+(acc*100).toFixed(1)+'%', px0, gy+16+2*rh2+28);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('특징 1개만 쓴 단순 모델이 특징 3개짜리와 재표본 단계에서 동률이었고,', px0, gy+16+2*rh2+50);
        ctx.fillText('held-out 시험에서도 그 성능을 그대로 재현했습니다', px0, gy+16+2*rh2+70);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (기준선 → 후보비교 → 1-SE선택 → 최종채점)', true);
      E.big('사례: 신용 평가', '14장의 세포 분할 사례가 전처리를 마무리했다면, 이번엔 이 장에서 배운 리샘플링과 모델 선택을 신용 평가 문제에 그대로 적용합니다. 신청자 '+s.N+'명 중 '+s.goodN+'명(70%)이 "좋음"으로, 다수결 기준선(정확도 70%)의 함정부터 확인합니다. 특징 3개짜리 로지스틱회귀와 특징 1개(연체비율)짜리가 4겹 교차검증에서 평균·표준오차까지 완전히 동률(0.958)로 나오자, 1-표준오차 규칙에 따라 더 단순한 1특징 모델을 최종 후보로 선택합니다. 이 최종 모델을 한 번도 쓰지 않은 '+s.testN+'명으로 채점하면 '+((s.TP+s.TN)/s.testN*100).toFixed(0)+'%를 정확히 맞혀, 재표본 단계의 판단이 옳았음을 held-out 데이터로 재확인합니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
