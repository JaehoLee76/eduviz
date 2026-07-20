/* 빅데이터 분석 제10장 — 분류 알고리즘 (로지스틱회귀·의사결정나무·kNN·SVM·앙상블)
   동작(behavior)만. 텍스트=content/bda10.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(확률·지니·거리·마진·정확도)는 JS로 실제 계산(하드코딩 금지).
   분류기는 결과를 베끼지 않고 직접 구현해 계산 — 로지스틱=경사하강법, 나무=지니 그리디분할,
   kNN=거리+다수결, SVM=투영-임계값 탐색(최대마진), 앙상블=붓스트랩+다수결.
   난수 금지 — 붓스트랩 표본 인덱스는 고정 시드 결정적 LCG(선형합동생성기)로 사전계산. */
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

  // ── 수치 도구 ──────────────────────────────
  function mean(a){ var s=0,i; for(i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function sd(a,ddof){ var m=mean(a), s=0,i; for(i=0;i<a.length;i++) s+=(a[i]-m)*(a[i]-m); return Math.sqrt(s/(a.length-(ddof||0))); }
  function sigmoid(z){ if(z>30)z=30; if(z<-30)z=-30; return 1/(1+Math.exp(-z)); }

  // ── 고정 데이터(난수 금지) — 32명의 고객, 이용개월수(X1)·월평균 이용시간(X2)·이탈여부(Y=1) ──
  var DATA=[
    [20,85,0],[22,90,0],[18,75,0],[16,68,0],[14,72,0],[19,60,0],[21,55,0],[17,50,0],[15,45,0],[23,95,0],
    [20,40,0],[13,58,0],[24,80,0],[12,66,0],
    [2,10,1],[3,15,1],[1,5,1],[4,22,1],[5,18,1],[3,8,1],[6,30,1],[2,25,1],[7,12,1],[4,35,1],
    [8,20,1],[1,40,1],[9,15,1],[6,45,1],
    [18,72,1],[3,12,0],[19,65,0],[5,25,1]
  ];
  var N=DATA.length;
  var X1=DATA.map(function(d){return d[0];}), X2=DATA.map(function(d){return d[1];}), Y=DATA.map(function(d){return d[2];});
  var M1=mean(X1), M2=mean(X2), S1=sd(X1,0), S2=sd(X2,0);
  var ZX1=X1.map(function(v){return (v-M1)/S1;}), ZX2=X2.map(function(v){return (v-M2)/S2;});
  var ALLIDX=[]; for(var _ii=0;_ii<N;_ii++) ALLIDX.push(_ii);
  var PXMIN=0, PXMAX=25, PYMIN=0, PYMAX=100;

  function fillGrid(ctx,sx0,sx1,sTop,sBot,classifyFn,cols,rows){
    var cw=(sx1-sx0)/cols, ch=(sBot-sTop)/rows, i,j;
    for(i=0;i<cols;i++){
      for(j=0;j<rows;j++){
        var cx=PXMIN+(i+0.5)/cols*(PXMAX-PXMIN);
        var cyS=sTop+j*ch+ch/2;
        var cy=PYMIN+(sBot-cyS)/(sBot-sTop)*(PYMAX-PYMIN);
        var cls=classifyFn(cx,cy);
        ctx.fillStyle=cls===1?'rgba(255,122,184,0.17)':'rgba(122,184,255,0.15)';
        ctx.fillRect(sx0+i*cw, sTop+j*ch, cw+0.7, ch+0.7);
      }
    }
  }
  function axisXY(ctx,sx0,sx1,sTop,sBot){
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(sx0,sBot); ctx.lineTo(sx1,sBot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx0,sTop); ctx.lineTo(sx0,sBot); ctx.stroke();
    ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
    var xt=[0,10,20], i;
    for(i=0;i<xt.length;i++){ var xx=sx0+(xt[i]-PXMIN)/(PXMAX-PXMIN)*(sx1-sx0);
      ctx.fillText(''+xt[i],xx,sBot+14);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(xx,sBot); ctx.lineTo(xx,sBot+4); ctx.stroke(); }
  }
  function PXd(x,sx0,sx1){ return sx0+(x-PXMIN)/(PXMAX-PXMIN)*(sx1-sx0); }
  function PYd(y,sTop,sBot){ return sBot-(y-PYMIN)/(PYMAX-PYMIN)*(sBot-sTop); }
  function plotPts(ctx,sx0,sx1,sTop,sBot,markFn){
    var i; for(i=0;i<N;i++){
      var px=PXd(X1[i],sx0,sx1), py=PYd(X2[i],sTop,sBot);
      ctx.fillStyle=Y[i]===1?ROSE:BLU; ctx.beginPath(); ctx.arc(px,py,4,0,7); ctx.fill();
      if(markFn) markFn(i,px,py);
    }
  }

  // ══════════ 1. 로지스틱 회귀 — 확률로 분류하다 ══════════
  function fitLogisticStd(iters,lr){
    var w1=0,w2=0,i,t;
    for(t=0;t<iters;t++){
      var g1=0,g2=0;
      for(i=0;i<N;i++){ var z=w1*ZX1[i]+w2*ZX2[i], p=sigmoid(z), err=p-Y[i]; g1+=err*ZX1[i]; g2+=err*ZX2[i]; }
      w1-=lr*g1/N; w2-=lr*g2/N;
    }
    return {w1z:w1,w2z:w2, w1:w1/S1, w2:w2/S2};
  }
  var LR_FIT=fitLogisticStd(400,0.3);
  function lrEval(w1,w2){
    var loss=0,acc=0,i;
    for(i=0;i<N;i++){ var xc1=X1[i]-M1, xc2=X2[i]-M2, z=w1*xc1+w2*xc2, p=sigmoid(z), pc=Math.min(Math.max(p,1e-9),1-1e-9);
      loss+=-(Y[i]*Math.log(pc)+(1-Y[i])*Math.log(1-pc));
      if((p>=0.5?1:0)===Y[i]) acc++;
    }
    return {loss:loss/N, acc:acc/N};
  }

  // ══════════ 2. 의사결정나무 — 질문을 이어 붙이다 ══════════
  function giniOf(idx){ if(idx.length===0) return 0; var c0=0,c1=0,i; for(i=0;i<idx.length;i++){ if(Y[idx[i]]===0)c0++; else c1++; }
    var p0=c0/idx.length, p1=c1/idx.length; return 1-p0*p0-p1*p1; }
  function majority(idx){ var c0=0,c1=0,i; for(i=0;i<idx.length;i++){ if(Y[idx[i]]===0)c0++; else c1++; } return c1>c0?1:0; }
  function bestSplit(idx){
    var giniParent=giniOf(idx), best=null, f,i;
    for(f=0;f<2;f++){
      var F=(f===0)?X1:X2;
      var vals=idx.map(function(i2){return F[i2];}).sort(function(a,b){return a-b;});
      var uniq=[]; for(i=0;i<vals.length;i++){ if(i===0||vals[i]!==vals[i-1]) uniq.push(vals[i]); }
      for(i=0;i<uniq.length-1;i++){
        var thr=(uniq[i]+uniq[i+1])/2, L=[],R=[],j;
        for(j=0;j<idx.length;j++){ if(F[idx[j]]<=thr) L.push(idx[j]); else R.push(idx[j]); }
        if(L.length===0||R.length===0) continue;
        var gL=giniOf(L), gR=giniOf(R), wgini=(L.length*gL+R.length*gR)/idx.length, gain=giniParent-wgini;
        if(!best||gain>best.gain){ best={feat:f,thr:thr,gain:gain,giniParent:giniParent,giniL:gL,giniR:gR,L:L,R:R}; }
      }
    }
    return best;
  }
  function buildTree(idx,depth,maxDepth){
    var node={n:idx.length, gini:giniOf(idx), cls:majority(idx), leaf:true};
    if(depth>=maxDepth || node.gini<1e-9 || idx.length<2) return node;
    var sp=bestSplit(idx);
    if(!sp || sp.gain<=1e-9) return node;
    node.leaf=false; node.feat=sp.feat; node.thr=sp.thr; node.gain=sp.gain;
    node.left=buildTree(sp.L,depth+1,maxDepth); node.right=buildTree(sp.R,depth+1,maxDepth);
    return node;
  }
  function predTree(node,x1,x2){ while(!node.leaf){ var v=(node.feat===0)?x1:x2; node=(v<=node.thr)?node.left:node.right; } return node.cls; }
  function treeAcc(node){ var c=0,i; for(i=0;i<N;i++){ if(predTree(node,X1[i],X2[i])===Y[i]) c++; } return c/N; }
  var ROOT_SPLIT=bestSplit(ALLIDX);

  // ══════════ 3. kNN ══════════
  function knnPredict(qx1,qx2,k,scaled,excludeIdx){
    var d=[],i;
    for(i=0;i<N;i++){ if(i===excludeIdx) continue;
      var dx,dy;
      if(scaled){ dx=(qx1-M1)/S1-ZX1[i]; dy=(qx2-M2)/S2-ZX2[i]; } else { dx=qx1-X1[i]; dy=qx2-X2[i]; }
      d.push({dist:Math.sqrt(dx*dx+dy*dy), y:Y[i], idx:i});
    }
    d.sort(function(a,b){return a.dist-b.dist;});
    var c0=0,c1=0; for(i=0;i<k && i<d.length;i++){ if(d[i].y===0)c0++; else c1++; }
    return {pred:(c1>c0?1:0), c0:c0, c1:c1, neigh:d.slice(0,Math.min(k,d.length))};
  }
  function loocvAcc(k,scaled){ var c=0,i; for(i=0;i<N;i++){ if(knnPredict(X1[i],X2[i],k,scaled,i).pred===Y[i]) c++; } return c/N; }

  // ══════════ 4. SVM — 여백을 최대로 ══════════
  var CX=M1, CY=M2;
  function projAll(theta){ var rad=theta*Math.PI/180, nx=Math.cos(rad), ny=Math.sin(rad), out=[],i;
    for(i=0;i<N;i++) out.push({p:nx*(X1[i]-CX)+ny*(X2[i]-CY), y:Y[i], idx:i});
    return out; }
  function directionSign(theta){
    var arr=projAll(theta), s0=0,c0=0,s1=0,c1=0,i;
    for(i=0;i<arr.length;i++){ if(arr[i].y===0){s0+=arr[i].p;c0++;} else {s1+=arr[i].p;c1++;} }
    return (s1/c1 < s0/c0) ? 1 : -1;
  }
  function svmClassify(theta,d,sign){ var rad=theta*Math.PI/180, nx=Math.cos(rad), ny=Math.sin(rad);
    return function(x1,x2){ var p=nx*(x1-CX)+ny*(x2-CY); var below=p<d; if(sign===1) return below?1:0; return below?0:1; }; }
  function countErrors(theta,d,sign){ var arr=projAll(theta), cls=svmClassify(theta,d,sign), e=0,i;
    for(i=0;i<arr.length;i++){ if(cls(X1[arr[i].idx],X2[arr[i].idx])!==Y[arr[i].idx]) e++; } return e; }
  function bestForTheta(theta){
    var sign=directionSign(theta), arr=projAll(theta).slice().sort(function(a,b){return a.p-b.p;});
    var i, bestErr=Infinity, errsAt=[], gaps=[];
    for(i=0;i<arr.length-1;i++){
      var dmid=(arr[i].p+arr[i+1].p)/2, e=countErrors(theta,dmid,sign);
      errsAt.push(e); gaps.push(arr[i+1].p-arr[i].p);
      if(e<bestErr) bestErr=e;
    }
    var bestLo=null,bestHi=null,bestW=-1;
    for(i=0;i<errsAt.length;i++){ if(errsAt[i]===bestErr && gaps[i]>bestW){ bestW=gaps[i]; bestLo=arr[i].p; bestHi=arr[i+1].p; } }
    var dOpt=(bestLo+bestHi)/2, margin=(bestHi-bestLo)/2;
    return {theta:theta,sign:sign,err:bestErr,d:dOpt,margin:margin,lo:bestLo,hi:bestHi};
  }
  var SVM_OPT=(function(){ var best=null,t; for(t=0;t<180;t+=2){ var r=bestForTheta(t); if(!best||r.err<best.err||(r.err===best.err&&r.margin>best.margin)) best=r; } return best; })();
  // 커널 트릭 미니 예제: 1차원에서 안쪽/바깥쪽 그룹은 직선 하나로 못 가르지만 x²로 옮기면 갈립니다
  var KX=[-6,-5,-4,-3.5,-3, 3,3.5,4,5,6, -1.5,-1,-0.5,0,0.5,1,1.5];
  var KY=[1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0,0,0];
  var KSTAT=(function(){
    var maxInner=-Infinity, minOuter=Infinity, i;
    for(i=0;i<KX.length;i++){ var v=KX[i]*KX[i]; if(KY[i]===0){ if(v>maxInner) maxInner=v; } else { if(v<minOuter) minOuter=v; } }
    return {maxInner:maxInner,minOuter:minOuter, t:(maxInner+minOuter)/2, margin:(minOuter-maxInner)/2};
  })();

  // ══════════ 5. 앙상블 ══════════
  function lcgSeq(seed,count,mod){ var x=seed, out=[],i; for(i=0;i<count;i++){ x=(48271*x)%2147483647; out.push(x%mod); } return out; }
  var BOOT_SEEDS=[78901,12345,23456,34567,45678,56789,67890,89012];
  var BOOT_SETS=BOOT_SEEDS.map(function(s){ return lcgSeq(s,24,N); });
  var TREES=BOOT_SETS.map(function(idx){ return buildTree(idx,0,2); });
  function predEnsemble(x1,x2,n){ var c0=0,c1=0,b; for(b=0;b<n;b++){ if(predTree(TREES[b],x1,x2)===0)c0++; else c1++; } return {pred:(c1>c0?1:0),c0:c0,c1:c1}; }
  function ensembleAcc(n){ var c=0,i; for(i=0;i<N;i++){ if(predEnsemble(X1[i],X2[i],n).pred===Y[i]) c++; } return c/N; }

  var scenes = [

  // ══════════ 1. 확률로 분류하다 — 로지스틱 회귀 ══════════
  { id:'bda10_01',
    enter:function(E){ var self=this; this.s={w1:-0.15, w2:0.05};
      E.controls('<div class="ctrl"><label>가중치 w1 (개월수)</label><input type="range" id="b101a" min="-1" max="1" step="0.02" value="-0.15"><output id="b101ao">-0.15</output></div>'
                +'<div class="ctrl"><label>가중치 w2 (이용시간)</label><input type="range" id="b101b" min="-0.3" max="0.3" step="0.005" value="0.05"><output id="b101bo">0.050</output></div>');
      E.bind('#b101a','input',function(e){ self.s.w1=+e.target.value; document.getElementById('b101ao').textContent=self.s.w1.toFixed(2); });
      E.bind('#b101b','input',function(e){ self.s.w2=+e.target.value; document.getElementById('b101bo').textContent=self.s.w2.toFixed(3); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, w1=s.w1, w2=s.w2, i;
      var cur=lrEval(w1,w2), opt=lrEval(LR_FIT.w1,LR_FIT.w2);

      var code=[
        {t:'from sklearn.linear_model import \\', dim:true},
        {t:'    LogisticRegression', dim:true},
        {t:'z = w1*tenure_c + w2*usage_c', hl:'w1*tenure_c + w2*usage_c'},
        {t:'p = 1 / (1 + np.exp(-z))', hl:'1 / (1 + np.exp(-z))'},
        {t:'pred = (p >= 0.5).astype(int)', hl:'p >= 0.5'},
        {t:'log_loss(y, p)', hl:'log_loss'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'logistic.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('현재  w1='+w1.toFixed(2)+' · w2='+w2.toFixed(3), W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('로그손실='+cur.loss.toFixed(3)+' · 정확도='+(cur.acc*100).toFixed(1)+'%', W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('경사하강법 최적  w1*='+LR_FIT.w1.toFixed(3)+' · w2*='+LR_FIT.w2.toFixed(3), W*0.04, ry+38);
      ctx.fillText('최적 로그손실='+opt.loss.toFixed(3)+' · 정확도='+(opt.acc*100).toFixed(1)+'%', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('w1이 w2보다 훨씬 큰 이유 — 개월수·이용시간의 단위 크기가 다르기 때문입니다', W*0.04, ry+80);

      // 우측 상단: 산점도 + 결정경계
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=200;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=BLU; ctx.fillText('● 유지', sx0, 24);
      ctx.fillStyle=ROSE; ctx.fillText('● 이탈', sx0+58, 24);
      ctx.fillStyle=GLD; ctx.fillText('― 결정경계(현재)', sx0+118, 24);
      axisXY(ctx,sx0,sx1,sTop,sBot);
      // 결정경계: w1*(x1-M1)+w2*(x2-M2)=0
      ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath();
      if(Math.abs(w2)>0.003){
        var y0l=M2-(w1/w2)*(PXMIN-M1), y1l=M2-(w1/w2)*(PXMAX-M1);
        y0l=Math.max(PYMIN,Math.min(PYMAX,y0l)); y1l=Math.max(PYMIN,Math.min(PYMAX,y1l));
        ctx.moveTo(PXd(PXMIN,sx0,sx1),PYd(y0l,sTop,sBot)); ctx.lineTo(PXd(PXMAX,sx0,sx1),PYd(y1l,sTop,sBot));
      } else {
        ctx.moveTo(PXd(M1,sx0,sx1),sTop); ctx.lineTo(PXd(M1,sx0,sx1),sBot);
      }
      ctx.stroke();
      plotPts(ctx,sx0,sx1,sTop,sBot,function(i2,px,py){
        var xc1=X1[i2]-M1, xc2=X2[i2]-M2, p=sigmoid(w1*xc1+w2*xc2), pred=(p>=0.5)?1:0;
        if(pred!==Y[i2]){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.stroke(); }
      });

      // 우측 하단: 시그모이드 곡선 — z(신호)에 따른 확률
      var by0=224, bTop=234, bBot=326;
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('시그모이드 — 신호 z가 클수록 이탈 확률이 높아집니다', sx0, by0);
      var zs=[]; for(i=0;i<N;i++){ zs.push(w1*(X1[i]-M1)+w2*(X2[i]-M2)); }
      var zMin=Math.min.apply(null,zs), zMax=Math.max.apply(null,zs);
      var pad=Math.max(1,(zMax-zMin)*0.15); zMin-=pad; zMax+=pad;
      function PXz(z){ return sx0+(z-zMin)/(zMax-zMin)*(sx1-sx0); }
      function PYp(p){ return bBot-p*(bBot-bTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,bBot); ctx.lineTo(sx1,bBot); ctx.stroke();
      if(zMin<0 && zMax>0){ ctx.strokeStyle='rgba(255,210,122,0.6)'; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(PXz(0),bTop); ctx.lineTo(PXz(0),bBot); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<=60;i++){ var zz=zMin+(zMax-zMin)*i/60, pp=sigmoid(zz);
        if(i===0) ctx.moveTo(PXz(zz),PYp(pp)); else ctx.lineTo(PXz(zz),PYp(pp)); }
      ctx.stroke();
      for(i=0;i<N;i++){ ctx.fillStyle=Y[i]===1?ROSE:BLU; ctx.beginPath(); ctx.arc(PXz(zs[i]),PYp(sigmoid(zs[i])),3.6,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('점선 z=0이 곧 결정경계 — 그 지점에서 확률이 정확히 0.5입니다', sx0, bBot+18);

      E.tapHint(W/2, H*0.95, '슬라이더로 w1·w2를 바꿔 로그손실이 최소에 가까워지는지 보세요', true);
      E.big('확률로 분류하다 — 로지스틱 회귀', '직선을 그대로 0/1 예측에 쓰면 값이 1을 넘거나 음수가 되는 이상한 일이 생깁니다. 그래서 직선의 출력(신호 z)을 시그모이드 함수에 통과시켜 항상 0과 1 사이의 값 — 확률 — 로 눌러 줍니다. z=0인 지점이 확률 정확히 0.5, 곧 결정경계입니다. 슬라이더로 w1·w2를 바꾸면 그 경계선과 예측 확률이 실제로 다시 계산됩니다. 최적의 가중치는 로그손실(예측 확률이 실제 정답과 얼마나 다른지)을 가장 작게 만드는 값 — 경사하강법으로 직접 찾습니다.'); }
  },

  // ══════════ 2. 질문을 이어 붙이다 — 의사결정나무 ══════════
  { id:'bda10_02',
    enter:function(E){ var self=this; this.s={depth:2};
      E.controls('<div class="ctrl"><label>나무 깊이(max_depth)</label><input type="range" id="b102d" min="1" max="6" step="1" value="2"><output id="b102do">2</output></div>');
      E.bind('#b102d','input',function(e){ self.s.depth=+e.target.value; document.getElementById('b102do').textContent=self.s.depth; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, depth=s.depth, i;
      var tree=buildTree(ALLIDX,0,depth), acc=treeAcc(tree);
      var featName=ROOT_SPLIT.feat===0?'개월수':'이용시간';

      var code=[
        {t:'from sklearn.tree import \\', dim:true},
        {t:'    DecisionTreeClassifier', dim:true},
        {t:'m = DecisionTreeClassifier(', hl:'DecisionTreeClassifier'},
        {t:'    max_depth=depth, criterion="gini")', hl:'max_depth=depth'},
        {t:'m.fit(X, y)', hl:'m.fit'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'tree.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('루트 분할  '+featName+' ≤ '+ROOT_SPLIT.thr.toFixed(1), W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('지니(부모)='+ROOT_SPLIT.giniParent.toFixed(3)+' → 가중지니='+(ROOT_SPLIT.giniParent-ROOT_SPLIT.gain).toFixed(3), W*0.04, ry+19);
      ctx.fillText('정보이득(지니 감소량)='+ROOT_SPLIT.gain.toFixed(3), W*0.04, ry+38);
      ctx.fillStyle=GRN; ctx.fillText('현재 깊이='+depth+' · 훈련 정확도='+(acc*100).toFixed(1)+'%', W*0.04, ry+57);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('깊이를 늘리면 경계가 잘게 쪼개져 훈련자료를 통째로 외워 버립니다', W*0.04, ry+80);

      // 우측 상단: 결정영역 raster + 산점도
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=200;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('결정영역 — depth='+depth, sx0, 24);
      fillGrid(ctx,sx0,sx1,sTop,sBot,function(x1,x2){ return predTree(tree,x1,x2); },26,13);
      axisXY(ctx,sx0,sx1,sTop,sBot);
      plotPts(ctx,sx0,sx1,sTop,sBot,function(i2,px,py){
        if(predTree(tree,X1[i2],X2[i2])!==Y[i2]){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.stroke(); }
      });

      // 우측 하단: 깊이별 훈련정확도 곡선(과적합)
      var by0=224, bTop=234, bBot=326;
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('깊이가 늘수록 훈련정확도는 결국 100%에 닿습니다 — 과적합 신호', sx0, by0);
      var accs=[]; for(i=1;i<=6;i++) accs.push(treeAcc(buildTree(ALLIDX,0,i)));
      function PXdd(dv){ return sx0+(dv-1)/(6-1)*(sx1-sx0); }
      function PYaa(av){ return bBot-(av-0.8)/(1.0-0.8)*(bBot-bTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,bBot); ctx.lineTo(sx1,bBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<6;i++){ var xx=PXdd(i+1), yy=PYaa(accs[i]); if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke();
      for(i=0;i<6;i++){ ctx.fillStyle=(i+1===depth)?GLD:BLU; ctx.beginPath(); ctx.arc(PXdd(i+1),PYaa(accs[i]),(i+1===depth)?5:3.5,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=6;i++) ctx.fillText(''+i, PXdd(i), bBot+14);
      ctx.textAlign='left'; ctx.fillText('가로축=깊이 · 세로축=훈련정확도(80~100%) · 노란점=현재', sx0, bBot+30);

      E.tapHint(W/2, H*0.95, '슬라이더로 깊이를 늘려 보세요 — 경계가 잘게 쪼개집니다', true);
      E.big('질문을 이어 붙이다 — 의사결정나무', '나무는 "가장 잘 나누는 질문"을 하나씩 골라 이어 붙입니다. 좋은 질문의 기준은 지니 불순도 — 한 무리 안에 서로 다른 클래스가 얼마나 섞여 있는지를 재는 값입니다. 나눈 뒤 양쪽의 지니(가중평균)가 나누기 전보다 얼마나 줄었는지가 정보이득이고, 모든 후보 임계값 중 이득이 가장 큰 지점을 선택합니다. 깊이를 슬라이더로 늘리면 이 과정이 반복되며 경계가 점점 잘게 쪼개지고, 어느 순간부터는 훈련자료의 잡음까지 통째로 외워 버리는 과적합이 시작됩니다.'); }
  },

  // ══════════ 3. 가장 가까운 이웃에게 묻다 — kNN ══════════
  { id:'bda10_03',
    enter:function(E){ var self=this; this.s={k:5, scale:0};
      E.controls('<div class="ctrl"><label>이웃 수 k</label><input type="range" id="b103k" min="1" max="15" step="1" value="5"><output id="b103ko">5</output></div>'
                +'<div class="ctrl"><label>거리 기준 (0=원본 · 1=표준화)</label><input type="range" id="b103s" min="0" max="1" step="1" value="0"><output id="b103so">원본</output></div>');
      E.bind('#b103k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b103ko').textContent=self.s.k; });
      E.bind('#b103s','input',function(e){ self.s.scale=+e.target.value; document.getElementById('b103so').textContent=self.s.scale?'표준화':'원본'; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, k=s.k, scaled=!!s.scale, i;
      var QX=10, QY=50;
      var q=knnPredict(QX,QY,k,scaled,-1);
      var loocv=loocvAcc(k,scaled);

      var code=[
        {t:'from sklearn.preprocessing import \\', dim:true},
        {t:'    StandardScaler', dim:true},
        {t:'Xs = StandardScaler().fit_transform(X)', hl:'StandardScaler()'},
        {t:'from sklearn.neighbors import \\', dim:true},
        {t:'    KNeighborsClassifier', dim:true},
        {t:'KNeighborsClassifier(n_neighbors=k)', hl:'n_neighbors=k'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'knn.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('신규 고객(개월10·시간50)의 k='+k+' 이웃 다수결', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('유지표='+q.c0+' · 이탈표='+q.c1+' → 판정: '+(q.pred===1?'이탈':'유지'), W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('교차검증(LOOCV) 정확도 = '+(loocv*100).toFixed(1)+'%  ['+(scaled?'표준화':'원본')+' 거리]', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('원본 거리는 이용시간(0~100)이 개월수(0~24)보다 폭이 넓어 더 크게 반영됩니다', W*0.04, ry+61);
      ctx.fillText('k가 커질수록 표준화 거리 쪽이 더 안정적인 성능을 보입니다(우하단 비교)', W*0.04, ry+80);

      // 우측 상단: 결정영역 + 이웃 연결선
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=200;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('★ 신규 고객과 k개의 가장 가까운 이웃', sx0, 24);
      fillGrid(ctx,sx0,sx1,sTop,sBot,function(x1,x2){ return knnPredict(x1,x2,k,scaled,-1).pred; },24,12);
      axisXY(ctx,sx0,sx1,sTop,sBot);
      var qpx=PXd(QX,sx0,sx1), qpy=PYd(QY,sTop,sBot);
      ctx.strokeStyle='rgba(255,210,122,0.55)'; ctx.lineWidth=1.2; ctx.setLineDash([3,3]);
      for(i=0;i<q.neigh.length;i++){ var pj=q.neigh[i].idx; ctx.beginPath(); ctx.moveTo(qpx,qpy); ctx.lineTo(PXd(X1[pj],sx0,sx1),PYd(X2[pj],sTop,sBot)); ctx.stroke(); }
      ctx.setLineDash([]);
      plotPts(ctx,sx0,sx1,sTop,sBot,null);
      ctx.fillStyle=GLD; ctx.beginPath();
      ctx.moveTo(qpx,qpy-7); ctx.lineTo(qpx+7,qpy); ctx.lineTo(qpx,qpy+7); ctx.lineTo(qpx-7,qpy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();

      // 우측 하단: k별 LOOCV 정확도 — 원본 vs 표준화
      var by0=224, bTop=234, bBot=326;
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('k에 따른 LOOCV 정확도 — 파랑=원본 거리 · 초록=표준화 거리', sx0, by0);
      var ks=[1,3,5,7,9,11,13,15];
      function PXk(kv){ return sx0+(kv-1)/(15-1)*(sx1-sx0); }
      function PYa(av){ return bBot-(av-0.7)/(1.0-0.7)*(bBot-bTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,bBot); ctx.lineTo(sx1,bBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.beginPath();
      for(i=0;i<ks.length;i++){ var xx=PXk(ks[i]), yy=PYa(loocvAcc(ks[i],false)); if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=1.8; ctx.beginPath();
      for(i=0;i<ks.length;i++){ var xx2=PXk(ks[i]), yy2=PYa(loocvAcc(ks[i],true)); if(i===0) ctx.moveTo(xx2,yy2); else ctx.lineTo(xx2,yy2); }
      ctx.stroke();
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(PXk(k),PYa(loocv),4.5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=15;i+=2) ctx.fillText(''+i, PXk(i), bBot+14);

      E.tapHint(W/2, H*0.95, '슬라이더로 k와 거리 기준을 바꿔 판정과 정확도를 비교해 보세요', true);
      E.big('가장 가까운 이웃에게 묻다 — kNN', '새 고객이 어느 쪽에 가까울까요? kNN의 답은 단순합니다 — 가장 가까운 k명의 실제 이웃을 찾아 그들의 다수결로 정합니다. 그런데 "가깝다"를 어떻게 잴지가 중요합니다. 이용시간(0~100)은 개월수(0~24)보다 값의 폭이 훨씬 넓어서, 원본 거리를 그대로 쓰면 이용시간 혼자 판정을 좌우해 버립니다 — 9장에서 다룬 표준화가 왜 필요한지 여기서 직접 드러납니다. k를 키우면 한두 이웃의 잡음에 덜 흔들리지만 너무 키우면 지역적인 패턴을 놓칩니다.'); }
  },

  // ══════════ 4. 여백을 최대로 — 서포트 벡터 ══════════
  { id:'bda10_04',
    enter:function(E){ var self=this; this.s={theta:60, d:0};
      E.controls('<div class="ctrl"><label>경계선 방향 θ(도)</label><input type="range" id="b104t" min="0" max="179" step="1" value="60"><output id="b104to">60</output></div>'
                +'<div class="ctrl"><label>경계선 위치 d</label><input type="range" id="b104d" min="-50" max="50" step="1" value="0"><output id="b104do">0</output></div>');
      E.bind('#b104t','input',function(e){ self.s.theta=+e.target.value; document.getElementById('b104to').textContent=self.s.theta; });
      E.bind('#b104d','input',function(e){ self.s.d=+e.target.value; document.getElementById('b104do').textContent=self.s.d; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, theta=s.theta, d=s.d, i;
      var sign=directionSign(theta), err=countErrors(theta,d,sign), bft=bestForTheta(theta);

      var code=[
        {t:'from sklearn.svm import SVC', dim:true},
        {t:'m = SVC(kernel="linear", C=1.0)', hl:'kernel="linear"'},
        {t:'m.fit(X, y)', hl:'m.fit'},
        {t:'m.support_vectors_  # 마진 위의 점', hl:'support_vectors_'},
        {t:'# 안 갈리면: SVC(kernel="rbf")', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'svm.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('현재 θ='+theta+'° · d='+d+'  → 오분류 '+err+'개', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('이 방향(θ='+theta+'°)의 최대 마진 = '+bft.margin.toFixed(2)+' (오분류 '+bft.err+'개)', W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('전역 최적  θ*='+SVM_OPT.theta+'° · 마진*='+SVM_OPT.margin.toFixed(2)+' (오분류 '+SVM_OPT.err+'개)', W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('두 고객은 어떤 직선으로도 못 가릅니다 — 이런 예외를 허용하는 것이 소프트마진입니다', W*0.04, ry+61);
      ctx.fillText('θ를 슬라이더로 돌려 최적 방향(약 '+SVM_OPT.theta+'°)에 가까워지는지 보세요', W*0.04, ry+80);

      // 우측 상단: 산점도 + 현재선 + 최적선(+마진)
      var sx0=W*0.47, sx1=W*0.965, sTop=26, sBot=172;
      ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('― 현재', sx0, 20);
      ctx.fillStyle=GRN; ctx.fillText('┄ 최적(+마진 폭)', sx0+56, 20);
      axisXY(ctx,sx0,sx1,sTop,sBot);
      function drawLine(th,dd,col,dash,lw){
        var rad=th*Math.PI/180, nx=Math.cos(rad), ny=Math.sin(rad);
        // 직선: nx*(x1-CX)+ny*(x2-CY) = dd  →  x2 = CY + (dd - nx*(x1-CX))/ny  (ny≈0이면 수직선)
        ctx.strokeStyle=col; ctx.lineWidth=lw; if(dash) ctx.setLineDash(dash); ctx.beginPath();
        if(Math.abs(ny)>0.02){
          var y0l=CY+(dd-nx*(PXMIN-CX))/ny, y1l=CY+(dd-nx*(PXMAX-CX))/ny;
          y0l=Math.max(PYMIN,Math.min(PYMAX,y0l)); y1l=Math.max(PYMIN,Math.min(PYMAX,y1l));
          ctx.moveTo(PXd(PXMIN,sx0,sx1),PYd(y0l,sTop,sBot)); ctx.lineTo(PXd(PXMAX,sx0,sx1),PYd(y1l,sTop,sBot));
        } else {
          var xv=CX+dd/nx; ctx.moveTo(PXd(xv,sx0,sx1),sTop); ctx.lineTo(PXd(xv,sx0,sx1),sBot);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      drawLine(SVM_OPT.theta, SVM_OPT.lo, 'rgba(126,224,176,0.55)', [3,3], 1.4);
      drawLine(SVM_OPT.theta, SVM_OPT.hi, 'rgba(126,224,176,0.55)', [3,3], 1.4);
      drawLine(SVM_OPT.theta, SVM_OPT.d, GRN, [6,3], 1.8);
      drawLine(theta, d, GLD, null, 2.4);
      plotPts(ctx,sx0,sx1,sTop,sBot,function(i2,px,py){
        var cls=svmClassify(theta,d,sign);
        if(cls(X1[i2],X2[i2])!==Y[i2]){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.stroke(); }
      });

      // 우측 하단: 커널 트릭 미니 예제(고정)
      var by0=204, mTop=214, mBot=326;
      var mx0=sx0, mx1=sx0+(sx1-sx0)*0.42, nx0=sx0+(sx1-sx0)*0.56, nx1=sx1;
      ctx.fillStyle=TXT; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('직선 하나로 못 가르면? — 특징을 하나 더 만들어 봅니다', sx0, by0);
      // 왼쪽: 1차원 수직선
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('원래 1차원: x', mx0, mTop+10);
      var kxMin=-7,kxMax=7;
      function PXk1(x){ return mx0+(x-kxMin)/(kxMax-kxMin)*(mx1-mx0); }
      var lineY=mTop+50;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(mx0,lineY); ctx.lineTo(mx1,lineY); ctx.stroke();
      for(i=0;i<KX.length;i++){ ctx.fillStyle=KY[i]===1?ROSE:BLU; ctx.beginPath(); ctx.arc(PXk1(KX[i]),lineY,3.6,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('가운데=안쪽 그룹, 양끝=바깥쪽 그룹 → 경계 1개로 못 가릅니다', mx0, mTop+70);
      // 오른쪽: (x, x^2) 변환
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('φ(x)=(x, x²)로 옮기면:', nx0, mTop+10);
      var kyMin=0, kyMax=40;
      function PXk2(x){ return nx0+(x-kxMin)/(kxMax-kxMin)*(nx1-nx0); }
      function PYk2(v){ return mTop+90-(v-kyMin)/(kyMax-kyMin)*70; }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(nx0,mTop+90); ctx.lineTo(nx1,mTop+90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx0,mTop+20); ctx.lineTo(nx0,mTop+90); ctx.stroke();
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(nx0,PYk2(KSTAT.t)); ctx.lineTo(nx1,PYk2(KSTAT.t)); ctx.stroke(); ctx.setLineDash([]);
      for(i=0;i<KX.length;i++){ ctx.fillStyle=KY[i]===1?ROSE:BLU; ctx.beginPath(); ctx.arc(PXk2(KX[i]),PYk2(KX[i]*KX[i]),3.6,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('가로선 하나로 완전히 갈립니다 (마진='+KSTAT.margin.toFixed(2)+')', nx0, mTop+108);

      E.tapHint(W/2, H*0.95, '슬라이더로 θ·d를 바꿔 가장 넓은 길을 찾아보세요', true);
      E.big('여백을 최대로 — 서포트 벡터', '두 무리를 가르는 직선은 무수히 많습니다. 그 중 SVM이 고르는 것은 "가장 넓은 길"을 내는 직선 — 양쪽 클래스에서 가장 가까운 점까지의 거리(마진)를 최대로 만드는 직선입니다. 그 마진의 경계에 걸쳐 있는 점들이 서포트 벡터입니다. 그런데 실제 데이터에는 어느 직선으로도 갈라지지 않는 예외가 있을 수 있습니다 — 그런 예외를 약간 허용하는 것이 소프트마진이고, 아예 직선으로 안 갈리는 모양(안쪽/바깥쪽처럼)이라면 특징을 새로 만들어(커널) 그 새 공간에서 직선으로 가르는 것이 커널 트릭의 핵심 발상입니다.'); }
  },

  // ══════════ 5. 여럿이 모이면 강해진다 — 앙상블 ══════════
  { id:'bda10_05',
    enter:function(E){ var self=this; this.s={n:1};
      E.controls('<div class="ctrl"><label>나무 개수(n_estimators)</label><input type="range" id="b105n" min="1" max="8" step="1" value="1"><output id="b105no">1</output></div>');
      E.bind('#b105n','input',function(e){ self.s.n=+e.target.value; document.getElementById('b105no').textContent=self.s.n; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, n=s.n, i;
      var acc=ensembleAcc(n), acc1=ensembleAcc(1);
      // 점(3,12,label=0, 딥인트루전)에 대한 현재 n그루의 투표 분포
      var wi=DATA.findIndex(function(d){return d[0]===3&&d[1]===12;});
      var votes=[]; for(i=0;i<n;i++) votes.push(predTree(TREES[i],X1[wi],X2[wi]));
      var v1=votes.filter(function(v){return v===1;}).length, v0=votes.length-v1;

      var code=[
        {t:'from sklearn.ensemble import \\', dim:true},
        {t:'    RandomForestClassifier', dim:true},
        {t:'m = RandomForestClassifier(', hl:'RandomForestClassifier'},
        {t:'    n_estimators=n, max_depth=2)', hl:'n_estimators=n'},
        {t:'# 부스팅: GradientBoostingClassifier', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'ensemble.py', null);

      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=BLU; ctx.fillText('나무 1그루  훈련정확도 = '+(acc1*100).toFixed(1)+'%', W*0.04, ry);
      ctx.fillStyle=GLD; ctx.fillText('나무 '+n+'그루 다수결  훈련정확도 = '+(acc*100).toFixed(1)+'%', W*0.04, ry+19);
      ctx.fillStyle=GRN; ctx.fillText('예시 고객(개월3·시간12)  '+n+'그루 중 유지'+v0+'표·이탈'+v1+'표 → '+(v1>v0?'이탈':'유지'), W*0.04, ry+38);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('배깅(랜덤포레스트)은 나무들이 각자 독립적으로 배우고 표를 모읍니다', W*0.04, ry+61);
      ctx.fillText('부스팅은 앞 나무가 틀린 자리에 다음 나무가 집중해서 순서대로 보완합니다', W*0.04, ry+80);

      // 우측 상단: 결정영역(다수결) + 산점도
      var sx0=W*0.47, sx1=W*0.965, sTop=30, sBot=200;
      ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=TXT; ctx.fillText('결정영역 — 나무 '+n+'그루 다수결', sx0, 24);
      fillGrid(ctx,sx0,sx1,sTop,sBot,function(x1,x2){ return predEnsemble(x1,x2,n).pred; },26,13);
      axisXY(ctx,sx0,sx1,sTop,sBot);
      plotPts(ctx,sx0,sx1,sTop,sBot,function(i2,px,py){
        if(predEnsemble(X1[i2],X2[i2],n).pred!==Y[i2]){ ctx.strokeStyle=RED; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.stroke(); }
        if(i2===wi){ ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,9,0,7); ctx.stroke(); }
      });

      // 우측 하단: n별 정확도 곡선
      var by0=224, bTop=234, bBot=326;
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('나무를 늘릴수록 다수결 정확도가 안정됩니다', sx0, by0);
      var accs=[]; for(i=1;i<=8;i++) accs.push(ensembleAcc(i));
      function PXn(nv){ return sx0+(nv-1)/(8-1)*(sx1-sx0); }
      function PYa2(av){ return bBot-(av-0.75)/(1.0-0.75)*(bBot-bTop); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx0,bBot); ctx.lineTo(sx1,bBot); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(i=0;i<8;i++){ var xx=PXn(i+1), yy=PYa2(accs[i]); if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke();
      for(i=0;i<8;i++){ ctx.fillStyle=(i+1===n)?GLD:BLU; ctx.beginPath(); ctx.arc(PXn(i+1),PYa2(accs[i]),(i+1===n)?5:3.5,0,7); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      for(i=1;i<=8;i++) ctx.fillText(''+i, PXn(i), bBot+14);

      E.tapHint(W/2, H*0.95, '슬라이더로 나무 개수를 늘려 정확도가 어떻게 바뀌는지 보세요', true);
      E.big('여럿이 모이면 강해진다 — 앙상블', '나무 한 그루는 자료를 조금만 바꿔도 결과가 크게 흔들립니다 — 훈련자료를 다르게 복원추출(붓스트랩)해서 여러 그루를 기르고 다수결로 합치면(랜덤포레스트) 한 그루의 실수를 다른 그루들이 상쇄해 결과가 안정됩니다. 슬라이더로 나무 수를 늘리며 정확도가 어떻게 바뀌는지, 그리고 특정 고객에 대한 표가 몇 대 몇으로 갈리는지 직접 확인해 보세요. 부스팅은 다른 전략입니다 — 나무를 동시에 독립적으로 기르지 않고, 앞 나무가 틀린 자리에 다음 나무가 순서대로 더 집중하며 실수를 보완해 나갑니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
