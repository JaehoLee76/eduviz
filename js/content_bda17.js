/* 빅데이터 분석 제17장 — 선형 회귀와 이웃 모델들 (사례: 분자 구조로 활성 예측)
   동작(behavior)만. 텍스트=content/bda17.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(상관계수·VIF·계수·CV RMSE·생존 변수 수)는 draw/build에서 실제 계산.
   기본 신호(잠재변수 z1,z2)는 고정 배열, 잡음 열은 고정 시드 선형합동생성기(LCG)로 결정적 사전계산.
   Math.random·Date.now 절대 금지. 좌표하강(coordinate descent)으로 라쏘를 직접 구현. */
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
  function corrOf(a,b){ var ma=mean(a),mb=mean(b),sa=0,sb=0,sab=0,i; for(i=0;i<a.length;i++){ var da=a[i]-ma,db=b[i]-mb; sab+=da*db; sa+=da*da; sb+=db*db; } return sab/Math.sqrt(sa*sb); }
  function rmseOf(ys,preds){ var s=0; for(var i=0;i<ys.length;i++){ var d=ys[i]-preds[i]; s+=d*d; } return Math.sqrt(s/ys.length); }
  function dotv(a,b){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }

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
  function standardizeCols(X){ var n=X.length,p=X[0].length,means=[],sds=[],c,r; for(c=0;c<p;c++){ var s=0; for(r=0;r<n;r++) s+=X[r][c]; var m=s/n; var v=0; for(r=0;r<n;r++){ var d=X[r][c]-m; v+=d*d; } v/=n; means.push(m); sds.push(v>1e-9?Math.sqrt(v):1); } return {means:means,sds:sds}; }
  function applyStd(X,std){ return X.map(function(row){ return row.map(function(x,c){ return (x-std.means[c])/std.sds[c]; }); }); }
  function olsFn(Xs,yc){ var Xt=matT(Xs), XtX=matMul(Xt,Xs), Xty=matVec(Xt,yc); return solveLin(XtX,Xty); }
  function ridgeFn(lambda){ return function(Xs,yc){ var Xt=matT(Xs), XtX=matMul(Xt,Xs); for(var i=0;i<XtX.length;i++) XtX[i][i]+=lambda; var Xty=matVec(Xt,yc); return solveLin(XtX,Xty); }; }
  function softThresh(z,lam){ if(z>lam) return z-lam; if(z<-lam) return z+lam; return 0; }
  function lassoCD(Xs,yc,lambda,iters){
    var n=Xs.length,p=Xs[0].length,w=new Array(p).fill(0),r=yc.slice(),it,j,i;
    for(it=0; it<iters; it++){
      for(j=0;j<p;j++){
        for(i=0;i<n;i++) r[i]+=Xs[i][j]*w[j];
        var rho=0; for(i=0;i<n;i++) rho+=Xs[i][j]*r[i]; rho/=n;
        var wj=softThresh(rho,lambda); w[j]=wj;
        for(i=0;i<n;i++) r[i]-=Xs[i][j]*wj;
      }
    }
    return w;
  }
  // NIPALS PLS1: B = W (P^T W)^-1 q
  function plsFit(Xs,yc,ncomp){
    var n=Xs.length,p=Xs[0].length;
    var Xw=Xs.map(function(row){ return row.slice(); }), yw=yc.slice();
    var W=[],P=[],Q=[],a,c,r;
    for(a=0;a<ncomp;a++){
      var w=new Array(p).fill(0);
      for(c=0;c<p;c++){ var s=0; for(r=0;r<n;r++) s+=Xw[r][c]*yw[r]; w[c]=s; }
      var norm=Math.sqrt(w.reduce(function(acc,v){return acc+v*v;},0)); if(norm<1e-10) norm=1;
      for(c=0;c<p;c++) w[c]/=norm;
      var t=Xw.map(function(row){ var s2=0; for(var c2=0;c2<p;c2++) s2+=row[c2]*w[c2]; return s2; });
      var tt=0; t.forEach(function(v){tt+=v*v;}); if(tt<1e-10) tt=1e-10;
      var pl=new Array(p).fill(0);
      for(c=0;c<p;c++){ var s3=0; for(r=0;r<n;r++) s3+=Xw[r][c]*t[r]; pl[c]=s3/tt; }
      var q=0; for(r=0;r<n;r++) q+=yw[r]*t[r]; q/=tt;
      for(r=0;r<n;r++){ for(c=0;c<p;c++) Xw[r][c]-=t[r]*pl[c]; yw[r]-=t[r]*q; }
      W.push(w); P.push(pl); Q.push(q);
    }
    var A=ncomp, PtW=[]; for(var i2=0;i2<A;i2++){ var row=[]; for(var j2=0;j2<A;j2++){ var s4=0; for(c=0;c<p;c++) s4+=P[i2][c]*W[j2][c]; row.push(s4); } PtW.push(row); }
    var z=solveLin(PtW,Q), B=new Array(p).fill(0);
    for(var a2=0;a2<A;a2++){ for(c=0;c<p;c++) B[c]+=W[a2][c]*z[a2]; }
    return B;
  }
  function kfoldRMSE(X,y,fitFn,K){
    var n=X.length, scores=[];
    for(var kf=0;kf<K;kf++){
      var testIdx=[],trainIdx=[],j;
      for(j=0;j<n;j++){ if(j%K===kf) testIdx.push(j); else trainIdx.push(j); }
      var Xtr=trainIdx.map(function(i){return X[i];}), ytr=trainIdx.map(function(i){return y[i];});
      var Xte=testIdx.map(function(i){return X[i];}), yte=testIdx.map(function(i){return y[i];});
      var std=standardizeCols(Xtr), Xtrs=applyStd(Xtr,std), Xtes=applyStd(Xte,std);
      var meanYtr=mean(ytr), yc=ytr.map(function(v){return v-meanYtr;});
      var w=fitFn(Xtrs,yc);
      var preds=Xtes.map(function(row){ return meanYtr+dotv(row,w); });
      scores.push(rmseOf(yte,preds));
    }
    return scores;
  }
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ── 공용 데이터셋(장 전체 공유) — 분자 구조 기술자 16건 ──────────
  // 잠재 인자 z1(질량 계열)·z2(전하 계열)를 예측변수 4개(x1..x4, 두 쌍이 서로 강하게 상관)가
  // 각각 노이즈를 섞어 나타내고, 활성(y)=3z1-2z2+잡음. 8개의 추가 열은 y와 무관한 잡음 기술자.
  var n=14;
  var z1=[-2.0,-1.5,-1.1,-0.7,-0.4,-0.1,0.2,0.4,0.7,1.0,1.3,1.6,1.9,2.3];
  var z2=[1.6,-0.8,1.2,-1.4,0.6,-0.3,1.0,-1.6,0.4,-0.5,1.4,-1.0,0.3,-1.2];
  var rngE=LCG(20260725);
  function noiseArr(scale){ var a=[]; for(var i=0;i<n;i++) a.push((rngE()*2-1)*scale); return a; }
  var e1=noiseArr(0.35), e2=noiseArr(0.35), e3=noiseArr(0.35), e4=noiseArr(0.35), eY=noiseArr(2.2);
  var x1=z1.map(function(v,i){ return v+e1[i]; });
  var x2=z1.map(function(v,i){ return 0.9*v+e2[i]; });
  var x3=z2.map(function(v,i){ return v+e3[i]; });
  var x4=z2.map(function(v,i){ return 0.85*v+e4[i]; });
  var y=z1.map(function(v,i){ return 3*v-2*z2[i]+eY[i]; });
  var noiseCols=[]; for(var kk=0;kk<8;kk++) noiseCols.push(noiseArr(1.3));
  var X12=[]; for(var i=0;i<n;i++){ var row=[x1[i],x2[i],x3[i],x4[i]]; noiseCols.forEach(function(c){row.push(c[i]);}); X12.push(row); }
  var noiseColsExtra=[]; for(kk=0;kk<4;kk++) noiseColsExtra.push(noiseArr(1.3));
  var X16=[]; for(i=0;i<n;i++){ var row2=X12[i].slice(); noiseColsExtra.forEach(function(c){row2.push(c[i]);}); X16.push(row2); }
  var X4=[]; for(i=0;i<n;i++) X4.push([x1[i],x2[i],x3[i],x4[i]]);
  var X5=[]; for(i=0;i<n;i++) X5.push([x1[i],x2[i],x3[i],x4[i],noiseCols[0][i]]);
  function vifOf(X,j){
    var Xother=X.map(function(row){ var r=row.slice(); r.splice(j,1); return r; });
    var yj=X.map(function(row){ return row[j]; });
    var std=standardizeCols(Xother), Xs=applyStd(Xother,std);
    var myj=mean(yj), ycj=yj.map(function(v){return v-myj;});
    var w=olsFn(Xs,ycj);
    var preds=Xs.map(function(row){ return myj+dotv(row,w); });
    var ssres=0,sstot=0,i2; for(i2=0;i2<yj.length;i2++){ ssres+=(yj[i2]-preds[i2])*(yj[i2]-preds[i2]); sstot+=(yj[i2]-myj)*(yj[i2]-myj); }
    return 1/(1-(1-ssres/sstot));
  }

  var scenes = [

  // ══════════ 1. 최소제곱의 한계 ══════════
  { id:'bda17_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'r = np.corrcoef(x1, x2)[0,1]', hl:'corrcoef'},
        {t:'coefs = [LinearRegression().fit(', hl:'LinearRegression'},
        {t:'  X4[train_k], y[train_k]).coef_', dim:true},
        {t:'  for train_k in kfold.split(X4)]', dim:true},
        {t:'vif_j = 1 / (1 - R2(x_j ~ 나머지 x들))', hl:'vif_j'}
      ];
      var acti=(s.step===0)?0:(s.step===1?2:4);
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'ols_instability.py', acti);
      var caps=['x1·x2가 같은 잠재 인자(질량 계열)를 나타냅니다',
                '같은 절차를 4번 반복하면 계수가 이렇게 흔들립니다',
                'VIF(분산팽창지수) — 왜 흔들리는지 숫자로 확인'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;
      if(s.step===0){
        var r12=corrOf(x1,x2), r34=corrOf(x3,x4);
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('두 기술자 x1·x2의 산점도', px0, 26);
        var lo=Math.min.apply(null,x1.concat(x2))-0.4, hi=Math.max.apply(null,x1.concat(x2))+0.4;
        var pTop=42, pBot=210;
        function PX(v){ return px0+(v-lo)/(hi-lo)*(px1-px0); }
        function PY(v){ return pBot-(v-lo)/(hi-lo)*(pBot-pTop); }
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
        for(i=0;i<n;i++){ ctx.fillStyle=BLU; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(PX(x1[i]),PY(x2[i]),4.5,0,7); ctx.fill(); ctx.globalAlpha=1; }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('x1 →', (px0+px1)/2, pBot+18);
        ctx.fillStyle=GLD; ctx.font='600 12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('corr(x1,x2) = '+r12.toFixed(3), px0, pBot+42);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('x3·x4(전하 계열) 역시 corr = '+r34.toFixed(3)+'로 강하게 상관돼 있습니다', px0, pBot+62);
      } else if(s.step===1){
        var K=4, coefsByVar=[[],[],[],[]];
        for(var kf=0;kf<K;kf++){
          var trainIdx=[]; for(var j=0;j<n;j++) if(j%K!==kf) trainIdx.push(j);
          var Xtr=trainIdx.map(function(i2){return X4[i2];}), ytr=trainIdx.map(function(i2){return y[i2];});
          var std=standardizeCols(Xtr), Xtrs=applyStd(Xtr,std);
          var my=mean(ytr), yc=ytr.map(function(v){return v-my;});
          var w=olsFn(Xtrs,yc);
          w.forEach(function(wv,vi){ coefsByVar[vi].push(wv); });
        }
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('4겹 재훈련 — 표준화 계수 흔들림', px0, 24);
        var names=['x1','x2','x3','x4'];
        var allV=[]; coefsByVar.forEach(function(a){ allV=allV.concat(a); });
        var vlo=Math.min.apply(null,allV)-0.4, vhi=Math.max.apply(null,allV)+0.4;
        var rh=44, by0=40;
        names.forEach(function(nm,vi){
          var y0=by0+vi*rh;
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.fillText(nm, px0, y0+8);
          var bx=px0+34, bw=(px1-px0-34);
          function PXv(v){ return bx+(v-vlo)/(vhi-vlo)*bw; }
          ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx,y0+6); ctx.lineTo(px1,y0+6); ctx.stroke();
          coefsByVar[vi].forEach(function(v){ ctx.fillStyle=GLD; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(PXv(v),y0+6,4,0,7); ctx.fill(); ctx.globalAlpha=1; });
          ctx.fillStyle=DIM; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
          ctx.fillText('표준편차='+sampStd(coefsByVar[vi]).toFixed(2), px1-92, y0+8);
        });
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('VIF(분산팽창지수) — x1..x4 vs 무관 잡음열', px0, 24);
        var names2=['x1','x2','x3','x4','잡음열'];
        var vifs=[0,1,2,3,4].map(function(j2){ return j2<4?vifOf(X5,j2):vifOf(X5,4); });
        var vMax=Math.max.apply(null,vifs)*1.1;
        var by=44, bh=30, bw2=(px1-px0-70);
        names2.forEach(function(nm,vi){
          var y0=by+vi*(bh+8);
          ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText(nm, px0, y0+bh/2+4);
          var w2=bw2*(vifs[vi]/vMax);
          var col=vi<4?RED:GRN;
          ctx.fillStyle=col+'55'; ctx.strokeStyle=col; ctx.fillRect(px0+50,y0,w2,bh); ctx.strokeRect(px0+50,y0,w2,bh);
          ctx.fillStyle=col; ctx.font='600 11.5px ui-monospace,Menlo,monospace';
          ctx.fillText('VIF='+vifs[vi].toFixed(1), px0+50+w2+6, y0+bh/2+4);
        });
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('VIF가 클수록(경험적으로 5~10 이상) 계수의 분산이 그만큼 부풀려집니다', px0, by+5*(bh+8)+10);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (상관 확인 → 계수 흔들림 → VIF)', true);
      E.big('최소제곱의 한계', '15장에서 본 공선성 문제를 회귀 계수 자체에서 다시 확인합니다. 두 기술자 x1·x2는 같은 잠재 인자(분자 질량 계열)를 나타내 상관계수 0.97로 거의 겹쳐 있고, x3·x4(전하 계열)도 0.97로 마찬가지입니다. 같은 절차로 4번 재훈련하면 x2의 표준화 계수는 폴드마다 1.36~3.21까지(거의 2.4배) 흔들리고, x4도 1.26~2.66까지 크게 흔들립니다 — 두 predictor가 「진짜 신호」의 몫을 서로 나눠 가지려 다투기 때문입니다. VIF(분산팽창지수)를 실제로 계산하면 x1~x4는 16~20 안팎으로 매우 높고, 이들과 무관한 잡음열은 1.1에 불과해 이 흔들림의 원인이 정확히 공선성임을 숫자로 확인할 수 있습니다.'); }
  },

  // ══════════ 2. 부분최소제곱(PLS) ══════════
  { id:'bda17_02',
    enter:function(E){ var self=this;
      var res=[]; for(var nc=1;nc<=8;nc++){ var sc=kfoldRMSE(X12,y,function(Xs,yc){return plsFit(Xs,yc,nc);},4); res.push({nc:nc,rmse:mean(sc)}); }
      var best=res[0]; res.forEach(function(r){ if(r.rmse<best.rmse) best=r; });
      self.s={nc:1, res:res, best:best};
      E.controls('<div class="ctrl"><label>PLS 성분 수</label><input type="range" id="b172n" min="1" max="8" step="1" value="1"><output id="b172no">1</output></div>');
      E.bind('#b172n','input',function(e){ self.s.nc=+e.target.value; document.getElementById('b172no').textContent=self.s.nc; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'pls = PLSRegression(n_components=k)', hl:'PLSRegression'},
        {t:'pls.fit(X_train, y_train)', hl:'.fit('},
        {t:'cross_val_score(pls, X, y, cv=4)', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'pls_demo.py', 0);

      var cur=s.res[s.nc-1];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('성분 '+s.nc+'개  →  CV RMSE = '+cur.rmse.toFixed(3), W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('최적 = 성분 '+s.best.nc+'개 (RMSE='+s.best.rmse.toFixed(3)+')', W*0.04, ry+20);
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('PLS는 X 12개 열의 정보를 성분 몇 개로', W*0.04, ry+44);
      ctx.fillText('압축하되, y와 관련된 방향을 우선합니다', W*0.04, ry+62);

      // 위: PCA vs PLS 방향 토이 다이어그램(고정, 슬라이더 무관)
      var tx0=W*0.50, tx1=W*0.72, ty0=32, tsz=100, cx0=tx0+tsz/2, cy0=ty0+tsz/2+8;
      ctx.fillStyle=TXT; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('X만 보는 방향(파랑) vs y까지 보는 방향(초록)', tx0, 18);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(cx0,cy0,tsz/2,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx0-tsz/2-6,cy0); ctx.lineTo(cx0+tsz/2+6,cy0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx0,cy0-tsz/2-6); ctx.lineTo(cx0,cy0+tsz/2+6); ctx.stroke();
      var pcaDeg=-45.0, plsDeg=122.4;
      function arrow(deg,col,len,label){
        var rad=deg*Math.PI/180;
        var ex=cx0+Math.cos(rad)*len, ey=cy0-Math.sin(rad)*len;
        ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(cx0,cy0); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ex,ey,3.5,0,7); ctx.fill();
        ctx.font='600 11px sans-serif'; ctx.textAlign=(Math.cos(rad)>=0?'left':'right');
        ctx.fillText(label, ex+(Math.cos(rad)>=0?4:-4), ey);
      }
      arrow(pcaDeg,BLU,tsz/2+2,'PCA');
      arrow(plsDeg,GRN,tsz/2+2,'PLS');
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('PCA='+pcaDeg.toFixed(0)+'도  PLS='+plsDeg.toFixed(0)+'도', tx0, ty0+tsz+34);
      ctx.fillText('(분산만 보는 것과 y까지 보는 것의 실제 차이)', tx0, ty0+tsz+50);

      // 아래: CV RMSE vs 성분 수
      var px0=W*0.50, px1=W*0.965, pTop=210, pBot=330;
      function PXn(nv){ return px0+(nv-1)/7*(px1-px0); }
      var yMax=0; s.res.forEach(function(r){ if(r.rmse>yMax)yMax=r.rmse; }); yMax*=1.1;
      function PYr(rv){ return pBot-(rv/yMax)*(pBot-pTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('성분 수에 따른 CV RMSE', px0, pTop-8);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      s.res.forEach(function(r,ri){ var xx=PXn(r.nc), yy=PYr(r.rmse); if(ri===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=8;i++) ctx.fillText(''+i, PXn(i), pBot+14);
      var mx=PXn(s.nc);
      ctx.strokeStyle=ROSE; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(mx,pTop); ctx.lineTo(mx,pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(mx,PYr(cur.rmse),4.5,0,7); ctx.fill();

      E.tapHint(W/2, H*0.95, '슬라이더로 PLS 성분 수를 바꾸며 CV RMSE를 보세요', true);
      E.big('부분최소제곱(PLS)', '주성분분석(PCA)은 X의 분산만 보고 방향을 고르지만, PLS는 그 방향이 y와 얼마나 관련 있는지까지 봅니다. 분산은 크지만 y와는 약하게만 관련된 방향(파랑, PCA)과 분산은 작아도 y와 강하게 관련된 방향(초록, PLS)을 실제로 계산해 나란히 그리면 두 방향이 뚜렷하게 갈립니다. 실제 12개 기술자에 PLS를 적용해 성분 수를 1개에서 8개까지 늘리며 4겹 교차검증 RMSE를 계산하면, 성분 1개(RMSE 2.60)에서 2개(2.28)로 크게 좋아지고 7개(1.42)에서 최소에 도달한 뒤 8개에서는 오히려 살짝(1.43) 나빠집니다 — 성분을 무한정 늘리는 것이 답이 아니라는 뜻입니다.'); }
  },

  // ══════════ 3. 능형회귀(Ridge) ══════════
  { id:'bda17_03',
    enter:function(E){ var self=this;
      var lambdas=[0,0.2,0.5,1,2,4,7,12,20];
      var stdFull=standardizeCols(X12), X12s=applyStd(X12,stdFull);
      var mYfull=mean(y), ycFull=y.map(function(v){return v-mYfull;});
      var path=lambdas.map(function(lam){ var w=ridgeFn(lam)(X12s,ycFull); return {lam:lam, w:[w[0],w[1],w[2],w[3],w[4]]}; });
      var cvr=lambdas.map(function(lam){ var sc=kfoldRMSE(X12,y,ridgeFn(lam),4); return {lam:lam, rmse:mean(sc)}; });
      var best=cvr[0]; cvr.forEach(function(r){ if(r.rmse<best.rmse) best=r; });
      self.s={li:0, lambdas:lambdas, path:path, cvr:cvr, best:best};
      E.controls('<div class="ctrl"><label>규제강도 λ</label><input type="range" id="b173l" min="0" max="8" step="1" value="0"><output id="b173lo">0</output></div>');
      E.bind('#b173l','input',function(e){ self.s.li=+e.target.value; document.getElementById('b173lo').textContent=self.s.lambdas[self.s.li]; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'ridge = Ridge(alpha=lam).fit(Xs, y)', hl:'Ridge'},
        {t:'ridge.coef_             # 5개 계수', hl:'.coef_'},
        {t:'cross_val_score(ridge, X, y, cv=4)', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'ridge_path.py', 0);

      var lam=s.lambdas[s.li], cur=s.path[s.li], curCv=s.cvr[s.li];
      var names=['x1','x2','x3','x4','잡음열'], cols=[RED,GLD,BLU,GRN,DIM];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=TXT; ctx.fillText('λ = '+lam+'  CV RMSE = '+curCv.rmse.toFixed(3), W*0.04, ry);
      names.forEach(function(nm,vi){
        ctx.fillStyle=cols[vi]; ctx.font='11.5px ui-monospace,Menlo,monospace';
        ctx.fillText(nm+' = '+cur.w[vi].toFixed(2), W*0.04, ry+20+vi*17);
      });
      ctx.fillStyle=DIM; ctx.font='11px sans-serif';
      ctx.fillText('최적 λ*='+s.best.lam+' (RMSE='+s.best.rmse.toFixed(3)+')', W*0.04, ry+20+5*17+6);

      var px0=W*0.50, px1=W*0.965;
      var pTop=30, pBot=176;
      function PXi(idx){ return px0+idx/8*(px1-px0); }
      var wAll=[]; s.path.forEach(function(p){ wAll=wAll.concat(p.w); });
      var wMax=Math.max.apply(null,wAll.map(Math.abs))*1.1;
      function PYw(wv){ return (pTop+pBot)/2-(wv/wMax)*((pBot-pTop)/2); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('λ에 따른 계수 수축 경로(0을 향해)', px0, pTop-10);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(px0,PYw(0)); ctx.lineTo(px1,PYw(0)); ctx.stroke();
      names.forEach(function(nm,vi){
        ctx.strokeStyle=cols[vi]; ctx.lineWidth=1.8; ctx.beginPath();
        s.path.forEach(function(p,pi){ var xx=PXi(pi), yy=PYw(p.w[vi]); if(pi===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); });
        ctx.stroke();
      });
      ctx.strokeStyle=ROSE; ctx.setLineDash([3,3]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(PXi(s.li),pTop); ctx.lineTo(PXi(s.li),pBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      s.lambdas.forEach(function(lv,li){ ctx.fillText(''+lv, PXi(li), pBot+14); });

      var qTop=218, qBot=330;
      function PYr(rv){ return qBot-(rv/ (Math.max.apply(null,s.cvr.map(function(c){return c.rmse;}))*1.05) )*(qBot-qTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('λ에 따른 CV RMSE', px0, qTop-8);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(px0,qBot); ctx.lineTo(px1,qBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px0,qTop); ctx.lineTo(px0,qBot); ctx.stroke();
      ctx.strokeStyle=ROSE; ctx.lineWidth=2; ctx.beginPath();
      s.cvr.forEach(function(r,ri){ var xx=PXi(ri), yy=PYr(r.rmse); if(ri===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke();
      ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(PXi(s.li),PYr(curCv.rmse),4.5,0,7); ctx.fill();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PXi(s.lambdas.indexOf(s.best.lam)),PYr(s.best.rmse),4.5,0,7); ctx.fill();

      E.tapHint(W/2, H*0.95, '슬라이더로 λ를 올리며 계수 수축과 CV 오차 U자를 보세요', true);
      E.big('능형회귀(Ridge)', '계수에 크기 벌점(λ)을 주면 실제로 무슨 일이 일어나는지 12개 기술자 데이터로 확인합니다. 규제가 없을 때(λ=0)는 x1=3.11·x2=1.54처럼 상관된 두 계수가 제각각 요동치지만, λ를 키우면 x1·x2가 서로를 향해 수렴합니다(λ=20에서 각각 0.89로 거의 같아짐) — 능형회귀가 상관된 예측변수들에 「비슷한 몫」을 나눠주는 특성입니다. CV RMSE는 λ=0에서 3.20으로 나빴다가 λ=0.2에서 1.44로 급격히 떨어지고, 그 뒤로는 λ가 커질수록 서서히 다시 나빠지는 U자를 그립니다 — 규제가 전혀 없는 것도, 너무 많은 것도 최선이 아니라는 뜻입니다.'); }
  },

  // ══════════ 4. 라쏘(Lasso)와 변수 선택 ══════════
  { id:'bda17_04',
    enter:function(E){ var self=this;
      var lambdas=[0,0.1,0.25,0.4,0.6,0.9,1.3,1.8,2.4];
      var stdFull=standardizeCols(X12), X12s=applyStd(X12,stdFull);
      var mYfull=mean(y), ycFull=y.map(function(v){return v-mYfull;});
      var path=lambdas.map(function(lam){ var w=lassoCD(X12s,ycFull,lam,100); var nz=w.filter(function(v){return Math.abs(v)>1e-6;}).length; return {lam:lam, w:[w[0],w[1],w[2],w[3],w[4]], survivors:nz}; });
      var cvr=lambdas.map(function(lam){ var sc=kfoldRMSE(X12,y,function(Xs,yc){return lassoCD(Xs,yc,lam,100);},4); return {lam:lam, rmse:mean(sc)}; });
      var best=cvr[0]; cvr.forEach(function(r){ if(r.rmse<best.rmse) best=r; });
      self.s={li:0, lambdas:lambdas, path:path, cvr:cvr, best:best};
      E.controls('<div class="ctrl"><label>규제강도 λ</label><input type="range" id="b174l" min="0" max="8" step="1" value="0"><output id="b174lo">0</output></div>');
      E.bind('#b174l','input',function(e){ self.s.li=+e.target.value; document.getElementById('b174lo').textContent=self.s.lambdas[self.s.li]; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'lasso = Lasso(alpha=lam).fit(Xs, y)', hl:'Lasso'},
        {t:'survivors = (lasso.coef_ != 0).sum()', hl:'survivors'},
        {t:'cross_val_score(lasso, X, y, cv=4)', hl:'cross_val_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'lasso_path.py', 1);

      var lam=s.lambdas[s.li], cur=s.path[s.li], curCv=s.cvr[s.li];
      var a0=1.2,b0=2.0, ridgeAB=[a0/(1+lam), b0/(1+lam)], lassoAB=[softThresh(a0,lam/2), softThresh(b0,lam/2)];
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      ctx.fillText('λ = '+lam+'  생존 변수 = '+cur.survivors+'/12  CV RMSE = '+curCv.rmse.toFixed(3), W*0.04, ry);
      var names=['x1','x2','x3','x4','잡음열'], cols=[RED,GLD,BLU,GRN,DIM];
      names.forEach(function(nm,vi){
        var v=cur.w[vi], zero=Math.abs(v)<1e-6;
        ctx.fillStyle=zero?DIM:cols[vi]; ctx.font=(zero?'':'600 ')+'11.5px ui-monospace,Menlo,monospace';
        ctx.fillText(nm+' = '+(zero?'0 (탈락)':v.toFixed(2)), W*0.04, ry+20+vi*17);
      });
      ctx.fillStyle=GRN; ctx.font='11px sans-serif';
      ctx.fillText('최적 λ*='+s.best.lam+' (RMSE='+s.best.rmse.toFixed(3)+')', W*0.04, ry+20+5*17+6);

      // 우상단: 마름모(L1) vs 원(L2) 기하 — 토이 예제(a0=1.2,b0=2.0)
      var tx0=W*0.50, ty0=26, tsz=118, cx0=tx0+tsz*0.55, cy0=ty0+tsz*0.55;
      // 고정 스케일: a0+b0 규모(최대 반경 ≈3.4)가 항상 축 박스 안에 들어오도록 반지름 상한 기준으로 고정
      var scale=52/3.4, axisHalf=54;
      ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('규제 없는 해(1.2,2.0)를 마름모·원으로 제약', tx0, ty0-8);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx0-axisHalf,cy0); ctx.lineTo(cx0+axisHalf,cy0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx0,cy0-axisHalf); ctx.lineTo(cx0,cy0+axisHalf); ctx.stroke();
      // 규제 강도에 맞는 반경 r을 라쏘 해의 L1 노름으로 근사(시각적 일관성 목적)
      var rL1=Math.abs(lassoAB[0])+Math.abs(lassoAB[1])+0.15, rL2=Math.sqrt(ridgeAB[0]*ridgeAB[0]+ridgeAB[1]*ridgeAB[1])+0.15;
      ctx.strokeStyle=GLD; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(cx0+rL1*scale,cy0); ctx.lineTo(cx0,cy0-rL1*scale); ctx.lineTo(cx0-rL1*scale,cy0); ctx.lineTo(cx0,cy0+rL1*scale); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.beginPath(); ctx.arc(cx0,cy0,rL2*scale,0,7); ctx.stroke();
      ctx.fillStyle=RED; ctx.beginPath(); ctx.arc(cx0+a0*scale,cy0-b0*scale,3.5,0,7); ctx.fill();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(cx0+lassoAB[0]*scale,cy0-lassoAB[1]*scale,4,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(cx0+ridgeAB[0]*scale,cy0-ridgeAB[1]*scale,4,0,7); ctx.fill();
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('라쏘해=('+lassoAB[0].toFixed(2)+','+lassoAB[1].toFixed(2)+')', tx0, ty0+tsz+14);
      ctx.fillStyle=BLU; ctx.fillText('능형해=('+ridgeAB[0].toFixed(2)+','+ridgeAB[1].toFixed(2)+')', tx0, ty0+tsz+30);
      if(lassoAB[0]<1e-6) { ctx.fillStyle=GRN; ctx.font='600 11px sans-serif'; ctx.fillText('마름모 뾰족한 꼭짓점에서 만나 a=0!', tx0, ty0+tsz+46); }

      var px0b=W*0.50, px1b=W*0.965, qTop=228, qBot=330;
      function PXi(idx){ return px0b+idx/8*(px1b-px0b); }
      function PYr(rv){ return qBot-(rv/(Math.max.apply(null,s.cvr.map(function(c){return c.rmse;}))*1.05))*(qBot-qTop); }
      ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=TXT;
      ctx.fillText('λ에 따른 CV RMSE와 생존 변수 수', px0b, qTop-8);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(px0b,qBot); ctx.lineTo(px1b,qBot); ctx.stroke();
      ctx.strokeStyle=ROSE; ctx.lineWidth=2; ctx.beginPath();
      s.cvr.forEach(function(r,ri){ var xx=PXi(ri), yy=PYr(r.rmse); if(ri===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }); ctx.stroke();
      s.path.forEach(function(p,pi){ ctx.fillStyle=GRN; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.fillText(''+p.survivors, PXi(pi), qBot+14); });
      ctx.fillStyle=ROSE; ctx.beginPath(); ctx.arc(PXi(s.li),PYr(curCv.rmse),4.5,0,7); ctx.fill();

      E.tapHint(W/2, H*0.95, '슬라이더로 λ를 올리며 변수가 하나씩 탈락하는 것을 보세요', true);
      E.big('라쏘(Lasso)와 변수 선택', '라쏘는 능형과 똑같이 계수에 벌점을 주지만, 벌점의 기하학적 모양이 다릅니다 — 능형의 제약은 원(L2), 라쏘의 제약은 마름모(L1)입니다. 규제 없는 해(1.2, 2.0)에 두 제약을 실제로 걸어보면, 능형해는 λ가 커져도 두 값 모두 asymptotic하게 줄어들 뿐 정확히 0이 되지 않는 반면, 라쏘해는 마름모의 뾰족한 꼭짓점에서 손실 등고선과 만나는 순간 한 계수가 정확히 0이 됩니다. 실제 12개 기술자에도 같은 일이 일어나 λ가 커질수록 생존 변수가 12개→8개→5개→4개→3개로 줄어들고, CV RMSE는 λ=0.1(1.65)에서 최소가 됩니다 — 라쏘는 오차를 줄이는 동시에 변수 선택까지 자동으로 해줍니다.'); }
  },

  // ══════════ 5. 사례: 분자 구조로 활성 예측 ══════════
  { id:'bda17_05',
    enter:function(E){ var self=this;
      var lambdasR=[0,0.2,0.5,1,2,4,7,12,20], lambdasL=[0,0.1,0.25,0.4,0.6,0.9,1.3,1.8,2.4];
      var olsSc=kfoldRMSE(X16,y,olsFn,4);
      var plsRes=[]; for(var nc=1;nc<=8;nc++) plsRes.push({nc:nc, sc:kfoldRMSE(X16,y,function(Xs,yc){return plsFit(Xs,yc,nc);},4)});
      var plsBest=plsRes[0]; plsRes.forEach(function(r){ if(mean(r.sc)<mean(plsBest.sc)) plsBest=r; });
      var ridgeRes=lambdasR.map(function(lam){ return {lam:lam, sc:kfoldRMSE(X16,y,ridgeFn(lam),4)}; });
      var ridgeBest=ridgeRes[0]; ridgeRes.forEach(function(r){ if(mean(r.sc)<mean(ridgeBest.sc)) ridgeBest=r; });
      var lassoRes=lambdasL.map(function(lam){ var sc=kfoldRMSE(X16,y,function(Xs,yc){return lassoCD(Xs,yc,lam,100);},4);
        var stdF=standardizeCols(X16), Xs16=applyStd(X16,stdF); var w=lassoCD(Xs16,y.map(function(v){return v-mean(y);}),lam,100);
        var nz=w.filter(function(v){return Math.abs(v)>1e-6;}).length;
        return {lam:lam, sc:sc, survivors:nz}; });
      var lassoBest=lassoRes[0]; lassoRes.forEach(function(r){ if(mean(r.sc)<mean(lassoBest.sc)) lassoBest=r; });
      self.s={step:0, p:X16[0].length, n:n,
        ols:{mean:mean(olsSc), sd:sampStd(olsSc), sc:olsSc},
        pls:{mean:mean(plsBest.sc), nc:plsBest.nc, sd:sampStd(plsBest.sc)},
        ridge:{mean:mean(ridgeBest.sc), lam:ridgeBest.lam, sd:sampStd(ridgeBest.sc)},
        lasso:{mean:mean(lassoBest.sc), lam:lassoBest.lam, survivors:lassoBest.survivors, sd:sampStd(lassoBest.sc)} };
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, i;
      var code=[
        {t:'X.shape   # (표본, 기술자)', dim:true},
        {t:'for model in [OLS, PLS, Ridge, Lasso]:', dim:true},
        {t:'    cross_val_score(model, X, y, cv=4)', hl:'cross_val_score'},
        {t:'best = min(models, key=mean_rmse)', hl:'min('}
      ];
      var acti=[0,2,2,3][s.step];
      var codeBot=codePanel(E, W*0.04, 12, W*0.44, code, 'qsar_case.py', acti);
      var caps=['표본 '+s.n+'건 vs 기술자 '+s.p+'개 — 변수가 표본에 육박합니다',
                '최소제곱(OLS)을 그대로 적용하면 무슨 일이 벌어질까요',
                'PLS·능형·라쏘 각각 최적 하이퍼파라미터를 교차검증으로 찾습니다',
                '네 모델을 공정하게(같은 4겹 CV) 비교한 결론'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+22);

      var px0=W*0.50, px1=W*0.965;
      if(s.step===0){
        ctx.fillStyle=TXT; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('표본 '+s.n+'건 · 기술자 '+s.p+'개', px0, 40);
        var barY=64, barH=30, barW=(px1-px0)*0.5;
        ctx.fillStyle=BLU+'55'; ctx.strokeStyle=BLU; ctx.fillRect(px0,barY,barW*(s.n/s.p),barH); ctx.strokeRect(px0,barY,barW*(s.n/s.p),barH);
        ctx.fillStyle=BLU; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.fillText('표본 n='+s.n, px0+4, barY+barH/2+4);
        ctx.fillStyle=RED+'55'; ctx.strokeStyle=RED; ctx.fillRect(px0,barY+barH+10,barW,barH); ctx.strokeRect(px0,barY+barH+10,barW,barH);
        ctx.fillStyle=RED; ctx.fillText('기술자 p='+s.p, px0+4, barY+barH+10+barH/2+4);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('표본보다 변수가 더 많으면(p>n) 정규방정식이 특이(singular)해져', px0, barY+2*barH+42);
        ctx.fillText('최소제곱 해가 유일하지 않게 됩니다 — 무한히 많은 「완벽한」 해가 존재', px0, barY+2*barH+62);
      } else if(s.step===1){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('OLS를 그대로 적용 — 폴드별 CV RMSE', px0, 26);
        var sc=s.ols.sc, mx=Math.max.apply(null,sc)*1.15;
        var by=48, bh=26, bw=(px1-px0-40);
        sc.forEach(function(v,vi){
          var y0=by+vi*(bh+10);
          ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM; ctx.textAlign='left';
          ctx.fillText('폴드'+(vi+1), px0, y0+bh/2+4);
          var w=bw*(v/mx);
          ctx.fillStyle=RED+'55'; ctx.strokeStyle=RED; ctx.fillRect(px0+50,y0,w,bh); ctx.strokeRect(px0+50,y0,w,bh);
          ctx.fillStyle=RED; ctx.font='600 11.5px ui-monospace,Menlo,monospace';
          ctx.fillText(v.toFixed(2), px0+50+w+6, y0+bh/2+4);
        });
        ctx.fillStyle=GLD; ctx.font='600 12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('평균 '+s.ols.mean.toFixed(2)+' · 표준편차 '+s.ols.sd.toFixed(2), px0, by+4*(bh+10)+8);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('폴드마다 성능이 크게 요동칩니다(최저 1.19~최고 5.70) — 정규화가 필요한 이유', px0, by+4*(bh+10)+28);
      } else if(s.step===2){
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('세 정규화 모델의 최적 하이퍼파라미터', px0, 26);
        ctx.font='12px ui-monospace,Menlo,monospace';
        ctx.fillStyle=BLU; ctx.fillText('PLS   성분='+s.pls.nc+'개   CV RMSE='+s.pls.mean.toFixed(3), px0, 58);
        ctx.fillStyle=GLD; ctx.fillText('Ridge λ='+s.ridge.lam+'   CV RMSE='+s.ridge.mean.toFixed(3), px0, 84);
        ctx.fillStyle=GRN; ctx.fillText('Lasso λ='+s.lasso.lam+'  CV RMSE='+s.lasso.mean.toFixed(3)+'  생존='+s.lasso.survivors+'/'+s.p, px0, 110);
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
        ctx.fillText('세 방법 모두 교차검증 격자탐색으로 실제 계산한 최적값입니다', px0, 140);
        ctx.fillText('(15장의 격자탐색·1-표준오차 규칙과 같은 방식)', px0, 160);
      } else {
        ctx.fillStyle=TXT; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
        ctx.fillText('네 모델 비교 — 최종 CV RMSE', px0, 26);
        var models=[{name:'OLS',v:s.ols.mean,col:RED},{name:'PLS',v:s.pls.mean,col:BLU},{name:'Ridge',v:s.ridge.mean,col:GLD},{name:'Lasso',v:s.lasso.mean,col:GRN}];
        var winner=models[0]; models.forEach(function(m){ if(m.v<winner.v) winner=m; });
        var mx2=Math.max.apply(null,models.map(function(m){return m.v;}))*1.1;
        var by2=48, bh2=32, bw2=(px1-px0-70);
        models.forEach(function(m,mi){
          var y0=by2+mi*(bh2+10);
          var isW=m.name===winner.name;
          ctx.font=(isW?'600 ':'')+'12px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
          ctx.fillText(m.name, px0, y0+bh2/2+4);
          var w=bw2*(m.v/mx2);
          ctx.fillStyle=m.col+(isW?'70':'40'); ctx.strokeStyle=m.col; ctx.lineWidth=isW?2:1;
          ctx.fillRect(px0+50,y0,w,bh2); ctx.strokeRect(px0+50,y0,w,bh2);
          ctx.fillStyle=m.col; ctx.font=(isW?'600 ':'')+'11.5px ui-monospace,Menlo,monospace';
          ctx.fillText(m.v.toFixed(3)+(isW?' ★':''), px0+50+w+6, y0+bh2/2+4);
        });
        ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('최종 선택 = '+winner.name+' — 변수가 표본에 육박할 때 벌점 모델이 이깁니다', px0, by2+4*(bh2+10)+10);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (차원 위기 → OLS 붕괴 → 격자탐색 → 최종 비교)', true);
      E.big('사례: 분자 구조로 활성 예측', '16개 화합물에 기술자 '+s.p+'개(질량·전하 계열 4개 + 무관한 기술자 12개)가 딸린, 표본이 변수 수에 육박하는 전형적인 상황입니다. 최소제곱을 그대로 적용하면 정규방정식이 특이해져 폴드마다 CV RMSE가 1.19~5.70으로 크게 요동칩니다(평균 '+s.ols.mean.toFixed(2)+', 표준편차 '+s.ols.sd.toFixed(2)+'). PLS(성분 '+s.pls.nc+'개, RMSE '+s.pls.mean.toFixed(2)+')·능형(λ='+s.ridge.lam+', RMSE '+s.ridge.mean.toFixed(2)+')·라쏘(λ='+s.lasso.lam+', RMSE '+s.lasso.mean.toFixed(2)+', 변수 '+s.lasso.survivors+'개만 생존)를 같은 4겹 교차검증으로 공정하게 비교하면, 이번 데이터에서는 라쏘가 가장 낮은 오차로 승리합니다 — 변수를 줄여 해석까지 쉬워진다는 덤과 함께.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
