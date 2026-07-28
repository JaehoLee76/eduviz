/* 빅데이터 분석 제45장 — 다변량 분석 심화(요인분석·요인회전·다차원척도법·정준상관·기법 선택 지도)
   동작(behavior)만. 텍스트=content/bda45.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 상관행렬은 하드코딩하지 않고 잠재요인 2개+잡음으로부터 LCG로 생성한 원자료(70명×6문항)를
   실제 표준화·상관계산해서 만든다. 요인적재량(주축분해)·회전(배리맥스 각도 탐색)·MDS(이중중심화+
   야코비 고유분해)·정준상관(3×3 역행렬+거듭제곱법)은 모두 실제 계산이다(하드코딩 금지).
   난수(Math.random) 절대 금지 — 전부 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=19, pad=12, top=y, n=lines.length, ht=n*lh+pad*2+(title?24:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,122,184,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?24:0);
    if(title){ ctx.fillStyle=ROSE; ctx.font='600 11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+11); }
    ctx.font='12px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && (actLine===i || (Array.isArray(actLine)&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  // ── 선형대수 헬퍼(공용) ──────────────────────────────────────────────
  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }
  function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
  function jacobiEigen(Ain){
    var n=Ain.length; var A=Ain.map(function(r){return r.slice();});
    var V=[]; for(var i=0;i<n;i++){ V.push(new Array(n).fill(0)); V[i][i]=1; }
    for(var sweep=0; sweep<100; sweep++){
      var off=0;
      for(var p=0;p<n;p++) for(var q=p+1;q<n;q++) off+=A[p][q]*A[p][q];
      if(off<1e-20) break;
      for(p=0;p<n;p++){ for(q=p+1;q<n;q++){
        if(Math.abs(A[p][q])<1e-15) continue;
        var theta=(A[q][q]-A[p][p])/(2*A[p][q]);
        var sgn=theta>=0?1:-1;
        var t=sgn/(Math.abs(theta)+Math.sqrt(theta*theta+1));
        var c=1/Math.sqrt(t*t+1), s=t*c;
        var app=A[p][p], aqq=A[q][q], apq=A[p][q];
        A[p][p]=c*c*app-2*s*c*apq+s*s*aqq;
        A[q][q]=s*s*app+2*s*c*apq+c*c*aqq;
        A[p][q]=0; A[q][p]=0;
        for(var i2=0;i2<n;i2++){ if(i2!==p&&i2!==q){
          var aip=A[i2][p], aiq=A[i2][q];
          A[i2][p]=c*aip-s*aiq; A[p][i2]=A[i2][p];
          A[i2][q]=s*aip+c*aiq; A[q][i2]=A[i2][q];
        } }
        for(i2=0;i2<n;i2++){ var vip=V[i2][p], viq=V[i2][q]; V[i2][p]=c*vip-s*viq; V[i2][q]=s*vip+c*viq; }
      } }
    }
    var vals=[]; for(i=0;i<n;i++) vals.push(A[i][i]);
    var order=vals.map(function(v,ix){return ix;}).sort(function(a,b){return vals[b]-vals[a];});
    var svals=order.map(function(ix){return vals[ix];});
    var svecs=[]; for(i=0;i<n;i++){ var row=[]; order.forEach(function(oi){row.push(V[i][oi]);}); svecs.push(row); }
    return {values:svals, vectors:svecs};
  }
  function inv3(A){
    var a=A[0][0],b=A[0][1],c=A[0][2], d=A[1][0],e=A[1][1],f=A[1][2], g=A[2][0],h=A[2][1],ii=A[2][2];
    var det=a*(e*ii-f*h)-b*(d*ii-f*g)+c*(d*h-e*g), inv=1/det;
    return [[(e*ii-f*h)*inv,(c*h-b*ii)*inv,(b*f-c*e)*inv],[(f*g-d*ii)*inv,(a*ii-c*g)*inv,(c*d-a*f)*inv],[(d*h-e*g)*inv,(b*g-a*h)*inv,(a*e-b*d)*inv]];
  }
  function matMul(A,B){ var n=A.length,m=B[0].length,k=B.length,C=[]; for(var i=0;i<n;i++){var row=[];for(var j=0;j<m;j++){var s=0;for(var t=0;t<k;t++)s+=A[i][t]*B[t][j];row.push(s);}C.push(row);} return C; }
  function matT(A){ var n=A.length,m=A[0].length,T=[]; for(var j=0;j<m;j++){var row=[];for(var i=0;i<n;i++)row.push(A[i][j]);T.push(row);} return T; }
  function powerIterGeneral(M,n){
    var x=new Array(n).fill(1);
    for(var it=0; it<500; it++){
      var y=new Array(n).fill(0);
      for(var i=0;i<n;i++) for(var j=0;j<n;j++) y[i]+=M[i][j]*x[j];
      var norm=Math.sqrt(y.reduce(function(s,v){return s+v*v;},0));
      if(norm<1e-14) break;
      x=y.map(function(v){return v/norm;});
    }
    var Mx=new Array(n).fill(0);
    for(var i2=0;i2<n;i2++) for(var j2=0;j2<n;j2++) Mx[i2]+=M[i2][j2]*x[j2];
    var num=0,den=0; for(i2=0;i2<n;i2++){ num+=x[i2]*Mx[i2]; den+=x[i2]*x[i2]; }
    return {lambda:num/den, vec:x};
  }

  // ══════════ 고정 원자료: 직원 설문 6문항 × 70명(잠재요인 2개+잡음에서 생성) ══════════
  var N45=70;
  var VLAB6=['이해도','업무흥미','성과체감','조직몰입','동료신뢰','잔류의향'];
  var rngD=LCG(451001);
  function nrand(){ var u1=Math.max(rngD(),1e-9), u2=rngD(); return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); }
  var F1=[], F2=[];
  for(var oi=0;oi<N45;oi++){ F1.push(nrand()); F2.push(nrand()); }
  var LOAD_TRUE=[[0.78,0], [0.72,0], [0.65,0], [0,0.75], [0,0.70], [0,0.62]]; // 문항별 참 요인 부하(생성용, 화면 표시는 안 함)
  var NOISESD=[0.55,0.60,0.65,0.55,0.60,0.65];
  var RAWV=[]; // RAWV[var][obs]
  for(var vi=0;vi<6;vi++){
    var col=[];
    for(oi=0;oi<N45;oi++){ col.push(LOAD_TRUE[vi][0]*F1[oi]+LOAD_TRUE[vi][1]*F2[oi]+NOISESD[vi]*nrand()); }
    RAWV.push(col);
  }
  function zscore(a){ var m=mean(a), ssq=a.reduce(function(s,x){return s+(x-m)*(x-m);},0), sd=Math.sqrt(ssq/(a.length-1)); return a.map(function(x){return (x-m)/sd;}); } // 표본표준편차(N-1)로 나눠 대각이 정확히 1인 상관행렬이 되도록
  var Z45=RAWV.map(zscore); // Z45[var][obs], 표준화됨
  var R45=[]; // 상관행렬(6×6), 표준화 데이터의 실제 내적으로 계산
  for(vi=0;vi<6;vi++){ var row=[]; for(var vj=0;vj<6;vj++){ var s=0; for(oi=0;oi<N45;oi++) s+=Z45[vi][oi]*Z45[vj][oi]; row.push(s/(N45-1)); } R45.push(row); }

  // ── PCA(전체 상관행렬 그대로 고유분해) ──────────────────────────────────────────────
  var PCA_EIG=jacobiEigen(R45);
  var PCA_TOTVAR=PCA_EIG.values.reduce(function(a,b){return a+b;},0); // = 6(대각합)
  var PCA_LOAD=[]; // 6×2
  for(vi=0;vi<6;vi++){ PCA_LOAD.push([ PCA_EIG.vectors[vi][0]*Math.sqrt(Math.max(0,PCA_EIG.values[0])), PCA_EIG.vectors[vi][1]*Math.sqrt(Math.max(0,PCA_EIG.values[1])) ]); }
  var PCA_VAREXPL=(PCA_EIG.values[0]+PCA_EIG.values[1])/PCA_TOTVAR;

  // ── 주축 요인분석(2요인, 축소상관행렬 반복) ──────────────────────────────────────────────
  function principalAxisFA(R,nIter){
    var n=R.length;
    var h=[]; for(vi=0;vi<n;vi++){ var mx=0; for(var vj=0;vj<n;vj++){ if(vj!==vi) mx=Math.max(mx,Math.abs(R[vi][vj])); } h.push(mx*mx); }
    var loadings=null, hist=[];
    for(var it=0; it<nIter; it++){
      var Rstar=R.map(function(row,i){ return row.map(function(v,j){ return i===j? h[i] : v; }); });
      var eig=jacobiEigen(Rstar);
      loadings=[]; for(vi=0;vi<n;vi++){ loadings.push([ eig.vectors[vi][0]*Math.sqrt(Math.max(0,eig.values[0])), eig.vectors[vi][1]*Math.sqrt(Math.max(0,eig.values[1])) ]); }
      h=loadings.map(function(row){ return row[0]*row[0]+row[1]*row[1]; });
      hist.push(h.slice());
    }
    return {loadings:loadings, communality:h, hist:hist};
  }
  var FA45=principalAxisFA(R45,10);

  // ── 요인 회전(배리맥스: 회전각 탐색으로 단순구조 최대화) ──────────────────────────────────────────────
  function varimaxCrit(L){
    var n=L.length, v1=0,v2=0;
    for(var i=0;i<n;i++){ v1+=Math.pow(L[i][0],4); v2+=Math.pow(L[i][1],4); }
    var m1=0,m2=0; for(i=0;i<n;i++){ m1+=L[i][0]*L[i][0]; m2+=L[i][1]*L[i][1]; }
    return (v1/n-(m1/n)*(m1/n)) + (v2/n-(m2/n)*(m2/n));
  }
  function rotateLoadings(L,thetaDeg){
    var th=thetaDeg*Math.PI/180, c=Math.cos(th), s=Math.sin(th);
    return L.map(function(row){ return [ row[0]*c+row[1]*s, -row[0]*s+row[1]*c ]; });
  }
  var BEST_THETA=0, BEST_CRIT=-Infinity;
  for(var deg=0; deg<90; deg+=0.5){
    var crit=varimaxCrit(rotateLoadings(FA45.loadings,deg));
    if(crit>BEST_CRIT){ BEST_CRIT=crit; BEST_THETA=deg; }
  }
  var FA45_ROT=rotateLoadings(FA45.loadings,BEST_THETA);
  var COMM_BEFORE=FA45.loadings.map(function(r){return r[0]*r[0]+r[1]*r[1];});
  var COMM_AFTER=FA45_ROT.map(function(r){return r[0]*r[0]+r[1]*r[1];});

  // ══════════ MDS용 고정 데이터: 원두 7종 × 속성 4가지(0~10) ══════════
  var ITEMS45=['A','B','C','D','E','F','G'];
  var rngC=LCG(778001);
  var ATTR45=[]; for(var ci=0;ci<7;ci++){ var row=[]; for(var ai=0;ai<4;ai++) row.push(+(rngC()*10).toFixed(2)); ATTR45.push(row); }
  var D45=[]; for(ci=0;ci<7;ci++){ var drow=[]; for(var cj=0;cj<7;cj++){ var s=0; for(ai=0;ai<4;ai++){ var d=ATTR45[ci][ai]-ATTR45[cj][ai]; s+=d*d; } drow.push(Math.sqrt(s)); } D45.push(drow); }
  function classicalMDS(D,k){
    var n=D.length, D2=D.map(function(row){return row.map(function(v){return v*v;});});
    var rowMean=D2.map(mean), grand=mean(rowMean);
    var B=[]; for(var i=0;i<n;i++){ var row=[]; for(var j=0;j<n;j++){ row.push(-0.5*(D2[i][j]-rowMean[i]-rowMean[j]+grand)); } B.push(row); }
    var eig=jacobiEigen(B);
    var coords=[]; for(i=0;i<n;i++){ var row=[]; for(var f=0;f<k;f++){ var lam=Math.max(0,eig.values[f]); row.push(eig.vectors[i][f]*Math.sqrt(lam)); } coords.push(row); }
    return {coords:coords, eigvals:eig.values};
  }
  function reconDist(coords){ var n=coords.length,R=[]; for(var i=0;i<n;i++){var row=[];for(var j=0;j<n;j++){var s=0;for(var f=0;f<coords[0].length;f++){var d=coords[i][f]-coords[j][f];s+=d*d;}row.push(Math.sqrt(s));}R.push(row);} return R; }
  function stress45(Dorig,Drecon){
    var num=0,den=0,n=Dorig.length;
    for(var i=0;i<n;i++) for(var j=i+1;j<n;j++){ var diff=Dorig[i][j]-Drecon[i][j]; num+=diff*diff; den+=Dorig[i][j]*Dorig[i][j]; }
    return Math.sqrt(num/den);
  }
  var MDS_KMAX=4;
  var MDS_CURVE=[]; for(var kk=1;kk<=MDS_KMAX;kk++){ var m=classicalMDS(D45,kk); var rd=reconDist(m.coords); MDS_CURVE.push({k:kk, stress:stress45(D45,rd), coords:m.coords}); }

  // ── 정준상관(문항1~3 대 문항4~6) ──────────────────────────────────────────────
  var Rxx=[[R45[0][0],R45[0][1],R45[0][2]],[R45[1][0],R45[1][1],R45[1][2]],[R45[2][0],R45[2][1],R45[2][2]]];
  var Ryy=[[R45[3][3],R45[3][4],R45[3][5]],[R45[4][3],R45[4][4],R45[4][5]],[R45[5][3],R45[5][4],R45[5][5]]];
  var Rxy=[[R45[0][3],R45[0][4],R45[0][5]],[R45[1][3],R45[1][4],R45[1][5]],[R45[2][3],R45[2][4],R45[2][5]]];
  var Ryx=matT(Rxy);
  var CCA_M=matMul(matMul(matMul(inv3(Rxx),Rxy),inv3(Ryy)),Ryx);
  var CCA_RES=powerIterGeneral(CCA_M,3);
  var CCA_RHO=Math.sqrt(Math.max(0,CCA_RES.lambda));
  var CCA_XW=CCA_RES.vec;
  var CCA_AVG_SIMPLE=(function(){ var s=0,c=0; for(var i=0;i<3;i++) for(var j=0;j<3;j++){ s+=Math.abs(Rxy[i][j]); c++; } return s/c; })();

  // ── 공용 헬퍼: 가로 막대(적재량·정확도 등) ──────────────────────────────────────────────
  function hbar(ctx,x,y,w,h,val,maxv,col,label){
    var ww=Math.max(1,(Math.abs(val)/maxv)*w);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=col; ctx.fillRect(x, y, ww, h);
    ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='left';
    if(label) ctx.fillText(label, x+w+8, y+h-2);
  }

  var scenes = [

  // ══════════ 1. 변수 뒤에 숨은 요인 ══════════
  { id:'bda45_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.decomposition import FactorAnalysis', hl: s.step===0?'FactorAnalysis':null},
        {t:'fa = FactorAnalysis(n_components=2).fit(X)', hl: s.step===0?'.fit(X)':null},
        {t:'from sklearn.decomposition import PCA', hl: s.step===1?'PCA':null},
        {t:'pca = PCA(n_components=2).fit(X)', hl: s.step===1?'.fit(X)':null}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'factor_vs_pca.py', s.step===0?[0,1]:[2,3]);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(s.step===0?'요인분석(주축분해, 2요인) 적재량':'PCA(2성분) 적재량 — 비교용', W*0.04, ry);
      var L = s.step===0? FA45.loadings : PCA_LOAD;
      var maxv=1;
      var by=ry+18, rh=20;
      VLAB6.forEach(function(lb,vi2){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(lb, W*0.04, by+vi2*rh+14);
        hbar(ctx, W*0.04+58, by+vi2*rh, W*0.14, 8, L[vi2][0], maxv, BLU, null);
        hbar(ctx, W*0.04+58, by+vi2*rh+9, W*0.14, 8, L[vi2][1], maxv, GRN, null);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText(L[vi2][0].toFixed(2)+' / '+L[vi2][1].toFixed(2), W*0.04+58+W*0.14+6, by+vi2*rh+16);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=BLU; ctx.fillText('■요인1/성분1', W*0.04, by+6*rh+16);
      ctx.fillStyle=GRN; ctx.fillText('■요인2/성분2', W*0.04+90, by+6*rh+16);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
      if(s.step===0){
        var avgComm=mean(FA45.communality);
        ctx.fillText('평균 공통성(설명된 공통분산 비율) = '+avgComm.toFixed(3), W*0.04, by+6*rh+38);
      } else {
        ctx.fillText('2개 성분이 설명하는 전체 분산 비율 = '+(PCA_VAREXPL*100).toFixed(1)+'%', W*0.04, by+6*rh+38);
      }

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('상관행렬 R (6×6, 원자료 '+N45+'명에서 실제 표준화·계산)', px0, pTop+12);
      var cell=Math.min((px1-px0-40)/7,(pBot-pTop-40)/7,30);
      var mx0=px0+10, my0=pTop+30;
      for(var i=0;i<6;i++){
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText(VLAB6[i].slice(0,2), mx0+(i+1)*cell+cell/2, my0-6);
        ctx.textAlign='right'; ctx.fillText(VLAB6[i].slice(0,2), mx0+cell-4, my0+i*cell+cell/2+4);
        for(var j=0;j<6;j++){
          var v=R45[i][j];
          var a=Math.min(1,Math.abs(v));
          ctx.fillStyle = v>=0 ? 'rgba(126,224,176,'+(0.10+a*0.35)+')' : 'rgba(240,136,138,'+(0.10+a*0.35)+')';
          ctx.fillRect(mx0+(j+1)*cell, my0+i*cell, cell-1, cell-1);
          ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT; ctx.textAlign='center';
          ctx.fillText(v.toFixed(2), mx0+(j+1)*cell+cell/2, my0+i*cell+cell/2+4);
        }
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('앞 3문항끼리, 뒤 3문항끼리 상관이 높은 두 덩어리가 보입니다', mx0, my0+6*cell+20);

      E.tapHint(W/2, H*0.95, '화면 탭 = 요인분석 ↔ PCA 적재량 전환', true);
      E.big('변수 뒤에 숨은 요인', '6개 문항이 사실은 <b>소수의 공통 요인</b>으로 설명된다는 발상이 요인분석입니다. 상관행렬을 실제로 표준화된 원자료('+N45+'명)에서 계산하면 앞 3문항(이해도·흥미·성과체감)끼리, 뒤 3문항(몰입·신뢰·잔류의향)끼리 상관이 뚜렷이 높은 두 덩어리가 보입니다. <b>주축분해</b>(공통성을 반복 갱신하며 축소상관행렬을 고유분해)로 2요인 적재량을 실제로 계산하면, 두 덩어리의 흔적은 남아 있지만 아직 여러 문항이 두 요인에 비스듬히 걸쳐 있어 한눈에 해석하기는 어렵습니다 — 이 애매함을 정리하는 것이 다음 장면의 <b>회전</b>입니다. <b>PCA와의 차이</b>: PCA는 <b>전체 분산</b>(고유값 합=6)을 최대한 압축해 요약하는 것이 목적이고, 요인분석은 변수들이 공유하는 <b>공통분산</b>만 소수 요인으로 <b>설명</b>하는 것이 목적입니다 — 그래서 PCA의 적재량과 요인분석의 적재량은 계산 방식부터 다릅니다.'); }
  },

  // ══════════ 2. 요인을 해석 가능하게 — 회전 ══════════
  { id:'bda45_02',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from scipy.linalg import svd', hl: s.step===0?null:'svd'},
        {t:'# 배리맥스: 회전각 θ를 탐색해 단순구조를 최대화', dim:true},
        {t:'L_rot = L @ rotation_matrix(theta)', hl: s.step===1?'rotation_matrix':null}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'varimax_rotate.py', s.step===0?0:2);
      var L = s.step===0? FA45.loadings : FA45_ROT;
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(s.step===0? '회전 전 적재량' : '회전 후 적재량 (θ='+BEST_THETA.toFixed(1)+'° 실제 탐색)', W*0.04, ry);
      var by=ry+18, rh=20;
      VLAB6.forEach(function(lb,vi2){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText(lb, W*0.04, by+vi2*rh+14);
        hbar(ctx, W*0.04+58, by+vi2*rh, W*0.14, 8, L[vi2][0], 1, BLU, null);
        hbar(ctx, W*0.04+58, by+vi2*rh+9, W*0.14, 8, L[vi2][1], 1, GRN, null);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=DIM;
        ctx.fillText(L[vi2][0].toFixed(2)+' / '+L[vi2][1].toFixed(2), W*0.04+58+W*0.14+6, by+vi2*rh+16);
      });
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=(s.step===0?DIM:GRN); ctx.textAlign='left';
      var comm = s.step===0? COMM_BEFORE : COMM_AFTER;
      ctx.fillText('공통성 합(회전 불변) = '+comm.reduce(function(a,b){return a+b;},0).toFixed(3), W*0.04, by+6*rh+20);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.08, pBot=H*0.85;
      var cx=(px0+px1)/2, cy=(pTop+pBot)/2, R=Math.min(px1-px0,pBot-pTop)/2-20;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('요인1', cx+R-24, cy-6); ctx.fillText('요인2', cx+6, cy-R+12);
      var pts45=L.map(function(row,vi2){ return { vi:vi2, px:cx+row[0]*R*0.9, py:cy-row[1]*R*0.9, side: (cx+row[0]*R*0.9)>=cx }; });
      pts45.forEach(function(p){
        ctx.strokeStyle= p.vi<3? BLU : GRN; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(p.px,p.py); ctx.stroke();
        ctx.fillStyle= p.vi<3? BLU : GRN; ctx.beginPath(); ctx.arc(p.px,p.py,3.2,0,7); ctx.fill();
      });
      // 라벨 겹침 방지: 같은 쪽(좌/우) 점들을 y순으로 정렬해 최소 간격(14px)을 강제로 벌린다
      ['L','R'].forEach(function(side){
        var grp = pts45.filter(function(p){ return side==='R'? p.side : !p.side; }).sort(function(a,b){ return a.py-b.py; });
        var lastY=-1e9;
        grp.forEach(function(p){
          var ly = p.py + (p.py<cy?-4:12);
          if(ly-lastY<14) ly=lastY+14;
          lastY=ly;
          p.labelY=ly;
        });
      });
      pts45.forEach(function(p){
        ctx.font='11px sans-serif'; ctx.textAlign= p.side?'left':'right';
        ctx.fillStyle= p.vi<3? BLU : GRN;
        ctx.fillText(VLAB6[p.vi], p.px+(p.side?6:-6), p.labelY);
      });
      ctx.textAlign='left';
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT;
      ctx.fillText(s.step===0?'회전 전: 화살표가 두 축 사이에 비스듬히 걸쳐 있습니다':'회전 후: 화살표가 축에 더 가깝게(한 요인에 크게) 정렬됩니다', px0, pBot+22);

      E.tapHint(W/2, H*0.95, '화면 탭 = 회전 전 ↔ 회전 후(θ='+BEST_THETA.toFixed(1)+'°) 비교', true);
      E.big('요인을 해석 가능하게 — 회전', '회전 전 적재량은 여러 문항이 두 요인에 <b>비스듬히</b> 걸쳐 있어 해석이 애매합니다. <b>배리맥스 회전</b>은 회전각 θ를 0°~90° 사이에서 실제로 탐색해(단순구조 기준을 최대화하는 각도), 각 문항이 한 요인에만 크게 싣도록 좌표축을 돌립니다 — 이번 데이터에서 실제로 찾은 최적 각도는 θ='+BEST_THETA.toFixed(1)+'°입니다. 회전 후에는 이해도·흥미·성과체감이 한 요인에, 몰입·신뢰·잔류의향이 다른 한 요인에 뚜렷이 갈라져 실립니다(각 문항이 나머지 요인에는 거의 싣지 않습니다). 중요한 점: 회전 전 공통성 합('+COMM_BEFORE.reduce(function(a,b){return a+b;},0).toFixed(3)+')과 회전 후 공통성 합('+COMM_AFTER.reduce(function(a,b){return a+b;},0).toFixed(3)+')이 <b>실제로 거의 같습니다</b> — 회전은 정보를 더하거나 빼지 않고, 같은 정보를 <b>더 해석하기 쉬운 각도</b>로 다시 보여줄 뿐입니다.'); }
  },

  // ══════════ 3. 거리를 지도로 — 다차원척도법 ══════════
  { id:'bda45_03',
    enter:function(E){ var self=this; self.s={k:2};
      E.controls('<div class="ctrl"><label>MDS 차원 수 k</label><input type="range" id="b453k" min="1" max="'+MDS_KMAX+'" step="1" value="2"><output id="b453ko">2</output></div>');
      E.bind('#b453k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b453ko').textContent=self.s.k; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.manifold import MDS', hl:'MDS'},
        {t:"mds = MDS(n_components=k, dissimilarity='precomputed')", hl:'n_components=k'},
        {t:'coords = mds.fit_transform(D); mds.stress_', hl:'stress_'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'mds_stress.py', 1);
      var cur=MDS_CURVE[s.k-1];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('k='+s.k+'차원으로 배치', W*0.04, ry);
      ctx.fillStyle=(cur.stress<0.1)?GRN:(cur.stress<0.25?BLU:RED);
      ctx.fillText('스트레스 = '+cur.stress.toFixed(4)+' (작을수록 원래 거리 보존 잘 됨)', W*0.04, ry+20);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+46, bh=100, bw=(bx1-bx0)/MDS_KMAX;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('차원 수에 따른 스트레스', bx0, by0-8);
      var maxS=Math.max.apply(null,MDS_CURVE.map(function(c){return c.stress;}));
      MDS_CURVE.forEach(function(c,ci){
        var xk=bx0+ci*bw, hh=Math.max(2,(c.stress/maxS)*(bh-18)); // 최댓값 막대라도 값 라벨이 위 제목과 안 겹치게 18px 여유
        ctx.fillStyle= c.k===s.k? GLD : DIM;
        ctx.fillRect(xk+bw*0.2, by0+bh-hh, bw*0.6, hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText('k='+c.k, xk+bw/2, by0+bh+14);
        ctx.fillText(c.stress.toFixed(3), xk+bw/2, by0+bh-hh-6);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('원래 속성 공간은 4차원 — k가 4에 가까워질수록 스트레스가 줄어듭니다', bx0, by0+bh+34);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.10, pBot=H*0.85;
      if(s.k===1){
        var xs=cur.coords.map(function(c){return c[0];});
        var mn=Math.min.apply(null,xs), mx=Math.max.apply(null,xs);
        var midY=(pTop+pBot)/2;
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,midY); ctx.lineTo(px1,midY); ctx.stroke();
        // 1차원에 투영하면 점끼리 너무 가까워질 수 있어(겹침), x순 정렬 후 가까운 점은 지그재그로 위/아래 살짝 벌린다
        var order1=ITEMS45.map(function(lb,ii){ return {lb:lb, px:px0+((xs[ii]-mn)/(mx-mn+1e-9))*(px1-px0)}; }).sort(function(a,b){return a.px-b.px;});
        var lastPx=-1e9, zig=0;
        order1.forEach(function(p){ if(p.px-lastPx<20){ zig=(zig===0)?1:(zig===1?-1:0); } else { zig=0; } lastPx=p.px; p.yy=midY+zig*16; });
        order1.forEach(function(p){
          ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(p.px,p.yy,7,0,7); ctx.fill();
          ctx.fillStyle='#241926'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.lb,p.px,p.yy+0.5);
        });
        ctx.textBaseline='alphabetic';
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('1차원 배치 (원두 7종)', (px0+px1)/2, pTop-4);
      } else {
        var xs2=cur.coords.map(function(c){return c[0];}), ys2=cur.coords.map(function(c){return c[1];});
        var mnx=Math.min.apply(null,xs2), mxx=Math.max.apply(null,xs2), mny=Math.min.apply(null,ys2), mxy=Math.max.apply(null,ys2);
        var pad=30;
        function PX2(v){ return px0+pad+((v-mnx)/(mxx-mnx+1e-9))*(px1-px0-2*pad); }
        function PY2(v){ return pBot-pad-((v-mny)/(mxy-mny+1e-9))*(pBot-pTop-2*pad); }
        ITEMS45.forEach(function(lb,ii){
          var px=PX2(xs2[ii]), py=PY2(ys2[ii]);
          ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px,py,8,0,7); ctx.fill();
          ctx.fillStyle='#241926'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lb,px,py+0.5);
        });
        ctx.textBaseline='alphabetic';
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('2차원 배치(요인1,2 투영, 원두 7종)', (px0+px1)/2, pTop-4);
      }

      E.tapHint(W/2, H*0.95, '슬라이더로 k를 바꿔 스트레스가 실제로 줄어드는 것을 보세요', true);
      E.big('거리를 지도로 — 다차원척도법', '원두 7종은 원래 <b>4가지 속성</b>(산미·바디감 등)으로 표현되지만, 대상 간 <b>거리(비유사도)</b>만 안다면 이를 가장 잘 보존하는 저차원 배치를 찾을 수 있습니다. <b>이중중심화</b>한 거리제곱행렬을 실제로 고유분해해 k차원 좌표를 계산하고, 그 좌표에서 다시 잰 거리와 원래 거리의 차이를 <b>스트레스</b>로 실제 계산합니다. k=1(스트레스 '+MDS_CURVE[0].stress.toFixed(3)+')에서 k=2(스트레스 '+MDS_CURVE[1].stress.toFixed(3)+')로 차원을 늘리면 스트레스가 줄어들고, k가 원래 차원(4)에 가까워질수록 점점 0에 가까워집니다 — <b>더 많은 차원을 허용할수록 원래 거리를 더 정확히 보존</b>할 수 있다는 트레이드오프를 슬라이더로 직접 확인하는 것입니다.'); }
  },

  // ══════════ 4. 두 변수 묶음의 관계 — 정준상관 ══════════
  { id:'bda45_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'from sklearn.cross_decomposition import CCA', hl:'CCA'},
        {t:'cca = CCA(n_components=1).fit(X_set, Y_set)', hl:'.fit(X_set'},
        {t:'rho = corrcoef(cca.x_scores_.T, cca.y_scores_.T)', hl:'corrcoef'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'canonical_corr.py', [0,1,2]);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('집단X={이해도,흥미,성과체감}  집단Y={몰입,신뢰,잔류의향}', W*0.04, ry);
      ctx.fillStyle=GRN;
      ctx.fillText('정준상관계수 ρ₁ = '+CCA_RHO.toFixed(3), W*0.04, ry+22);
      ctx.fillStyle=DIM;
      ctx.fillText('참고: 두 집단 사이 개별 상관의 평균 |r| = '+CCA_AVG_SIMPLE.toFixed(3), W*0.04, ry+42);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+64, bh=90, bw=(bx1-bx0)/2*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('정준상관 vs 개별 상관 평균', bx0, by0-6);
      var vals=[{n:'정준상관ρ₁',v:CCA_RHO,c:GRN},{n:'개별 |r| 평균',v:CCA_AVG_SIMPLE,c:DIM}];
      var mx=Math.max(vals[0].v,vals[1].v);
      vals.forEach(function(vv,vi2){
        var xk=bx0+vi2*(bx1-bx0)/2+(bx1-bx0)/2*0.25-bw/2, hh=(vv.v/mx)*(bh-18); // 최댓값 막대 라벨이 위 제목과 안 겹치게 여유
        ctx.fillStyle=vv.c; ctx.fillRect(xk,by0+bh-hh,bw,hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText(vv.n, xk+bw/2, by0+bh+14);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=vv.c;
        ctx.fillText(vv.v.toFixed(3), xk+bw/2, by0+bh-hh-6);
      });
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=BLU; ctx.textAlign='left';
      var xw=CCA_XW;
      ctx.fillText('X 결합 가중치: 이해도×'+xw[0].toFixed(2)+' + 흥미×'+xw[1].toFixed(2)+' + 성과체감×'+xw[2].toFixed(2), bx0, by0+bh+40);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.10, pBot=H*0.82;
      var cx0=px0+30, cy0=pTop+10, cw=(px1-px0)/2-50, ch=pBot-pTop-30;
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
      ctx.fillText('집단X', cx0+cw/2, cy0-2);
      ['이해도','업무흥미','성과체감'].forEach(function(lb,ii){
        var yy=cy0+20+ii*((ch-20)/3);
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.roundRect? ctx.roundRect(cx0,yy,cw,26,6): roundRect(ctx,cx0,yy,cw,26,6); ctx.fill();
        ctx.fillStyle='#241926'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lb,cx0+cw/2,yy+13);
      });
      var cx1=px0+cw+90, cy1=cy0;
      ctx.textBaseline='alphabetic'; ctx.fillStyle=TXT; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('집단Y', cx1+cw/2, cy1-2);
      ['조직몰입','동료신뢰','잔류의향'].forEach(function(lb,ii){
        var yy=cy1+20+ii*((ch-20)/3);
        ctx.fillStyle=GRN; roundRect(ctx,cx1,yy,cw,26,6); ctx.fill();
        ctx.fillStyle='#241926'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lb,cx1+cw/2,yy+13);
      });
      ctx.textBaseline='alphabetic';
      var midx=(cx0+cw+cx1)/2, midy=cy0+ch/2+10;
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.moveTo(cx0+cw,cy0+ch/2+10); ctx.lineTo(cx1,cy1+ch/2+10); ctx.stroke();
      ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD; ctx.textAlign='center';
      ctx.fillText('ρ₁='+CCA_RHO.toFixed(3), midx, midy-6);

      E.big('두 변수 묶음의 관계 — 정준상관', '집단X(이해도·흥미·성과체감)와 집단Y(몰입·신뢰·잔류의향)처럼 <b>변수 묶음 두 개</b> 사이의 관계를 알고 싶을 때, 개별 변수쌍의 상관을 하나씩 보는 대신 <b>정준상관분석</b>은 각 집단 안에서 변수들을 <b>가장 상관이 높아지도록</b> 선형결합해 비교합니다. 3×3 상관 부분행렬들로 실제 행렬 역산·거듭제곱법을 계산하면 정준상관계수 ρ₁='+CCA_RHO.toFixed(3)+'이 나오는데, 이는 두 집단의 개별 변수쌍 상관의 평균(|r|='+CCA_AVG_SIMPLE.toFixed(3)+')보다 뚜렷이 <b>높습니다</b> — 정준상관은 정의상 「두 집단 사이에서 뽑아낼 수 있는 가장 강한 선형 관계」이므로, 아무 한 쌍의 개별 상관보다 크거나 같을 수밖에 없습니다.'); }
  },

  // ══════════ 5. 언제 무엇을 쓸 것인가 ══════════
  { id:'bda45_05',
    enter:function(E){ this.s={q:0}; E.setOn([]); },
    tap:function(E){ this.s.q=(this.s.q+1)%Q45MAP.length; E.blip(360+this.s.q*40,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'def choose_method(question):', hl:'choose_method'},
        {t:'    if question == "'+Q45MAP[s.q].q.slice(0,14)+'…":', hl:null},
        {t:'        return "'+Q45MAP[s.q].tech+'"', hl:Q45MAP[s.q].tech}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'choose_method.py', 2);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('질문: '+Q45MAP[s.q].q, W*0.04, ry, W*0.42);
      ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
      ctx.fillText('→ '+Q45MAP[s.q].tech, W*0.04, ry+26);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('탭으로 다른 질문·기법 쌍을 확인하세요 ('+(s.q+1)+'/'+Q45MAP.length+')', W*0.04, ry+50);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      var n=Q45MAP.length, rh=(pBot-pTop)/n;
      Q45MAP.forEach(function(item,qi){
        var yy=pTop+qi*rh;
        var active=(qi===s.q);
        ctx.fillStyle= active? 'rgba(255,122,184,0.22)' : 'rgba(255,255,255,0.035)';
        roundRect(ctx, px0, yy+3, px1-px0, rh-8, 7); ctx.fill();
        if(active){ ctx.strokeStyle=ROSE; ctx.lineWidth=1.6; roundRect(ctx, px0, yy+3, px1-px0, rh-8, 7); ctx.stroke(); }
        ctx.font=(active?'600 ':'')+'11.5px sans-serif'; ctx.fillStyle= active? GLD : TXT; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(item.tech, px0+12, yy+rh/2-6);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        var qtxt=item.q.length>30? item.q.slice(0,30)+'…' : item.q;
        ctx.fillText(qtxt, px0+12, yy+rh/2+9);
      });
      ctx.textBaseline='alphabetic';

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 질문·기법 순환', true);
      E.big('언제 무엇을 쓸 것인가', '40장부터 이 장까지 <b>정답 라벨 없이(또는 라벨과 무관하게) 데이터의 구조 자체</b>를 살피는 기법들을 다뤘습니다 — 비슷한 대상을 묶는 <b>군집</b>, 동시에 일어나는 일을 찾는 <b>연관규칙</b>, 시간 흐름을 다루는 <b>시계열</b>, 글에서 패턴을 뽑는 <b>텍스트마이닝</b>, 관계 구조를 보는 <b>연결망분석</b>, 변수 뒤 숨은 구조를 보는 <b>다변량분석</b>(요인분석·MDS·정준상관)입니다. 무엇을 고를지는 <b>데이터의 형태</b>(표·거래·시간축·텍스트·관계·상관행렬)와 <b>질문의 성격</b>에 달려 있습니다. 그리고 이 모든 기법은, 1~31장에서 다룬 <b>예측 모델링</b>(정답 라벨을 실제로 맞히는 것)과 대립하지 않습니다 — 오히려 군집으로 찾은 무리, 요인분석으로 압축한 변수, 연결망에서 잰 중심성은 그 자체로 예측 모델의 <b>새로운 입력 변수</b>가 되어, 두 세계가 서로를 강화합니다.'); }
  }

  ];
  var Q45MAP=[
    {q:'정답 라벨 없이 비슷한 대상을 묶고 싶다', tech:'군집(clustering)'},
    {q:'무엇을 살 때 무엇을 같이 사는지 알고 싶다', tech:'연관규칙'},
    {q:'시간에 따라 변하는 값의 다음 값을 예측하고 싶다', tech:'시계열'},
    {q:'글(리뷰·문서)에서 의미 있는 패턴을 뽑고 싶다', tech:'텍스트마이닝'},
    {q:'누가 누구와 관계 맺는지 그 구조가 궁금하다', tech:'연결망분석'},
    {q:'여러 변수 뒤에 숨은 공통 요인이 궁금하다', tech:'다변량분석(요인·MDS·정준상관)'},
    {q:'정답(라벨) 있는 데이터로 미래 값을 맞히고 싶다', tech:'예측모델링(1~31장)'}
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
