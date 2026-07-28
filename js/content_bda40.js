/* 빅데이터 분석 제40장 — 군집 분석 (K-means 반복계산·엘보우/실루엣·계층적 군집(덴드로그램)·DBSCAN)
   동작(behavior)만. 텍스트=content/bda40.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(SSE·실루엣·병합 높이·핵심점/경계점/잡음점 개수·후보 등)는 아래 고정
   데이터로부터 이 파일 로드 시 실제 계산(하드코딩 금지). K-means 반복(할당·중심갱신)·실루엣·
   계층적 병합(단일/완전/평균 연결)·DBSCAN 이웃탐색은 실제 알고리즘을 그대로 구현한다.
   난수(Math.random) 절대 금지 — 좌표 생성·초기 중심은 고정 시드 LCG. */
(function(){
  var ROSE='#ff7ab8', GRN='#7ee0b0', BLU='#7ab8ff', GLD='#ffd27a', DIM='#9b99a3', RED='#f0888a', TXT='#eadfe8', PUR='#c79dff', ORG='#ffb27a';
  var CLUS_COL=[GRN,BLU,GLD,PUR,ORG,ROSE];

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
      if(actLine!=null && ((typeof actLine==='number'&&i===actLine)||(actLine.indexOf&&actLine.indexOf(i)>=0))){ ctx.fillStyle='rgba(255,122,184,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=ROSE; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  function LCG(seed){ var s=seed>>>0; return function(){ s=(1103515245*s+12345)>>>0; return s/4294967296; }; }

  // ══════════ 고정 데이터: 2차원 지표(x1,x2) 40개 — 잠재 집단 4개(2개는 서로 가깝게 겹침) ══════════
  var G40 = [
    {cx:2.4, cy:6.6, n:8,  r:0.75, seed:111},
    {cx:3.4, cy:4.2, n:8,  r:0.7,  seed:222},
    {cx:7.6, cy:7.0, n:15, r:1.55, seed:333},
    {cx:7.0, cy:1.9, n:9,  r:0.7,  seed:444}
  ];
  var PX40=[], PY40=[], GID40=[];
  (function(){
    G40.forEach(function(g,gi){
      var rng=LCG(g.seed);
      for(var i=0;i<g.n;i++){
        var ang=rng()*2*Math.PI, rad=Math.sqrt(rng())*g.r;
        PX40.push(+(g.cx+Math.cos(ang)*rad).toFixed(2));
        PY40.push(+(g.cy+Math.sin(ang)*rad).toFixed(2));
        GID40.push(gi);
      }
    });
  })();
  var N40=PX40.length; // 40

  // ── 일반 K-means / 실루엣 도구(2차원 점 배열 X,Y,N을 받는 범용 함수) ──────────────────────
  function dist2G(X,Y,i,cx,cy){ var dx=X[i]-cx, dy=Y[i]-cy; return dx*dx+dy*dy; }
  function farthestInitG(X,Y,N,k,startIdx){
    var centers=[[X[startIdx],Y[startIdx]]];
    while(centers.length<k){
      var bestI=-1,bestD=-1;
      for(var i=0;i<N;i++){
        var md=Infinity;
        centers.forEach(function(c){ var d=dist2G(X,Y,i,c[0],c[1]); if(d<md) md=d; });
        if(md>bestD){ bestD=md; bestI=i; }
      }
      centers.push([X[bestI],Y[bestI]]);
    }
    return centers;
  }
  function kmeansRunG(X,Y,N,k,initCenters,maxIter){
    var centers=initCenters.map(function(c){return c.slice();});
    var assign=new Array(N).fill(0), it;
    for(it=0; it<maxIter; it++){
      var changed=false;
      for(var i=0;i<N;i++){
        var bd=Infinity,bj=0;
        for(var j=0;j<k;j++){ var d=dist2G(X,Y,i,centers[j][0],centers[j][1]); if(d<bd){bd=d;bj=j;} }
        if(assign[i]!==bj){ changed=true; assign[i]=bj; }
      }
      var sx=new Array(k).fill(0), sy=new Array(k).fill(0), cnt=new Array(k).fill(0);
      for(i=0;i<N;i++){ sx[assign[i]]+=X[i]; sy[assign[i]]+=Y[i]; cnt[assign[i]]++; }
      for(j=0;j<k;j++){ if(cnt[j]>0) centers[j]=[sx[j]/cnt[j], sy[j]/cnt[j]]; }
      if(!changed && it>0) break;
    }
    var sse=0; for(i=0;i<N;i++) sse+=dist2G(X,Y,i,centers[assign[i]][0],centers[assign[i]][1]);
    return {centers:centers, assign:assign, sse:sse, iters:it};
  }
  function kmeansTraceG(X,Y,N,k,initCenters,maxIter){
    var centers=initCenters.map(function(c){return c.slice();});
    var assign=new Array(N).fill(-1), frames=[];
    frames.push({type:'init', centers:centers.map(function(c){return c.slice();}), assign:assign.slice(), iter:0});
    for(var it=0; it<maxIter; it++){
      var changed=false;
      for(var i=0;i<N;i++){
        var bd=Infinity,bj=0;
        for(var j=0;j<k;j++){ var d=dist2G(X,Y,i,centers[j][0],centers[j][1]); if(d<bd){bd=d;bj=j;} }
        if(assign[i]!==bj) changed=true;
        assign[i]=bj;
      }
      var sse1=0; for(i=0;i<N;i++) sse1+=dist2G(X,Y,i,centers[assign[i]][0],centers[assign[i]][1]);
      frames.push({type:'assign', centers:centers.map(function(c){return c.slice();}), assign:assign.slice(), iter:it, sse:sse1});
      var sx=new Array(k).fill(0), sy=new Array(k).fill(0), cnt=new Array(k).fill(0);
      for(i=0;i<N;i++){ sx[assign[i]]+=X[i]; sy[assign[i]]+=Y[i]; cnt[assign[i]]++; }
      for(j=0;j<k;j++){ if(cnt[j]>0) centers[j]=[sx[j]/cnt[j], sy[j]/cnt[j]]; }
      var sse2=0; for(i=0;i<N;i++) sse2+=dist2G(X,Y,i,centers[assign[i]][0],centers[assign[i]][1]);
      frames.push({type:'update', centers:centers.map(function(c){return c.slice();}), assign:assign.slice(), iter:it, sse:sse2});
      if(!changed && it>0) break;
    }
    return frames;
  }
  function silhouetteG(X,Y,N,assign,k){
    var sTotal=0;
    for(var i=0;i<N;i++){
      var ci=assign[i], sameSum=0, sameCnt=0;
      var otherSum=new Array(k).fill(0), otherCnt=new Array(k).fill(0);
      for(var j=0;j<N;j++){
        if(j===i) continue;
        var d=Math.sqrt(dist2G(X,Y,i,X[j],Y[j]));
        if(assign[j]===ci){ sameSum+=d; sameCnt++; } else { otherSum[assign[j]]+=d; otherCnt[assign[j]]++; }
      }
      var a=sameCnt>0?sameSum/sameCnt:0, b=Infinity;
      for(var cc=0;cc<k;cc++){ if(cc!==ci && otherCnt[cc]>0){ var m=otherSum[cc]/otherCnt[cc]; if(m<b) b=m; } }
      sTotal += (sameCnt===0)?0:(b-a)/Math.max(a,b);
    }
    return sTotal/N;
  }
  function dbscanG(X,Y,N,eps,minPts){
    var neigh=[]; for(var i=0;i<N;i++){ var out=[]; for(var j=0;j<N;j++){ var dx=X[i]-X[j],dy=Y[i]-Y[j]; if(Math.sqrt(dx*dx+dy*dy)<=eps) out.push(j); } neigh.push(out); }
    var isCore=neigh.map(function(nb){ return nb.length>=minPts; });
    var labels=new Array(N).fill(-2), cluster=0;
    for(i=0;i<N;i++){
      if(labels[i]!==-2) continue;
      if(!isCore[i]){ labels[i]=-1; continue; }
      labels[i]=cluster;
      var seeds=neigh[i].slice().filter(function(x){return x!==i;});
      for(var qi=0; qi<seeds.length; qi++){
        var q=seeds[qi];
        if(labels[q]===-1) labels[q]=cluster;
        if(labels[q]!==-2) continue;
        labels[q]=cluster;
        if(isCore[q]) neigh[q].forEach(function(x){ if(seeds.indexOf(x)<0) seeds.push(x); });
      }
      cluster++;
    }
    var nNoise=0; labels.forEach(function(l){ if(l===-1) nNoise++; });
    return {labels:labels, isCore:isCore, nClusters:cluster, nNoise:nNoise};
  }

  // ── 40.1: 분류 대비용 훈련/검증 분할 + 최근접 중심 분류기 ──────────────────────────────
  var TE40=[]; for(var _t=4;_t<N40;_t+=5) TE40.push(_t);
  var TR40=[]; for(var _i=0;_i<N40;_i++) if(TE40.indexOf(_i)<0) TR40.push(_i);
  var CLASS_CENTERS40=(function(){
    var cc=[];
    for(var gi=0; gi<G40.length; gi++){
      var idxs=TR40.filter(function(i){return GID40[i]===gi;});
      var sx=0,sy=0; idxs.forEach(function(i){sx+=PX40[i];sy+=PY40[i];});
      cc.push([sx/idxs.length, sy/idxs.length]);
    }
    return cc;
  })();
  var CLASS_CORRECT40=(function(){
    var c=0;
    TE40.forEach(function(i){
      var bd=Infinity,bj=0;
      for(var j=0;j<CLASS_CENTERS40.length;j++){ var d=dist2G(PX40,PY40,i,CLASS_CENTERS40[j][0],CLASS_CENTERS40[j][1]); if(d<bd){bd=d;bj=j;} }
      if(bj===GID40[i]) c++;
    });
    return c;
  })();
  var CLASS_ACC40=CLASS_CORRECT40/TE40.length;

  // ── 40.1/40.2 기본 군집 결과(k=4, 결정적 초기화) ──────────────────────────────────────
  var INIT4_GOOD=farthestInitG(PX40,PY40,N40,4,0);
  var KM4=kmeansRunG(PX40,PY40,N40,4,INIT4_GOOD,50);

  // ── 40.2 초기값 민감도: 같은 무리(집단2) 안에서만 4점을 뽑은 나쁜 초기화 ─────────────
  var BADIDX40=[16,19,23,27];
  var INIT4_BAD=BADIDX40.map(function(i){ return [PX40[i],PY40[i]]; });
  var KM4_BAD=kmeansRunG(PX40,PY40,N40,4,INIT4_BAD,50);

  // ── 40.3 엘보우/실루엣 스윕 ────────────────────────────────────────────────────
  var K_SWEEP40=[1,2,3,4,5,6,7];
  var ELBOW_CURVE40=K_SWEEP40.map(function(k){
    var init=farthestInitG(PX40,PY40,N40,k,0);
    var r=kmeansRunG(PX40,PY40,N40,k,init,50);
    return {k:k, sse:r.sse, sil:(k>1?silhouetteG(PX40,PY40,N40,r.assign,k):null)};
  });
  function detectElbow40(curve){
    var ks=curve.map(function(c){return c.k;}), ss=curve.map(function(c){return c.sse;});
    var kmin=ks[0],kmax=ks[ks.length-1], smin=Math.min.apply(null,ss), smax=Math.max.apply(null,ss);
    var nx=ks.map(function(k){return (k-kmin)/(kmax-kmin);}), ny=ss.map(function(s){return (s-smin)/(smax-smin);});
    var x1=nx[0],y1=ny[0],x2=nx[nx.length-1],y2=ny[ny.length-1];
    var dx=x2-x1,dy=y2-y1,norm=Math.sqrt(dx*dx+dy*dy);
    var bestI=0,bestD=-1;
    nx.forEach(function(x,i){ var y=ny[i]; var d=Math.abs(dy*x-dx*y+x2*y1-y2*x1)/norm; if(d>bestD){bestD=d;bestI=i;} });
    return ks[bestI];
  }
  var ELBOW_K40=detectElbow40(ELBOW_CURVE40);
  var BEST_SIL_K40=(function(){
    var bi=1; for(var i=2;i<ELBOW_CURVE40.length;i++){ if(ELBOW_CURVE40[i].sil>ELBOW_CURVE40[bi].sil) bi=i; }
    return ELBOW_CURVE40[bi].k;
  })();

  // ── 40.4 계층적 군집: 8점 부표본 + 3연결법 ────────────────────────────────────
  var SUBIDX40=[0,4,8,12,16,22,31,36];
  var SX40=SUBIDX40.map(function(i){return PX40[i];}), SY40=SUBIDX40.map(function(i){return PY40[i];});
  var NS40=SX40.length;
  function subDist(i,j){ var dx=SX40[i]-SX40[j], dy=SY40[i]-SY40[j]; return Math.sqrt(dx*dx+dy*dy); }
  function agglomerative40(linkage){
    var clusters=[]; for(var i=0;i<NS40;i++) clusters.push({members:[i], id:i});
    var nextId=NS40, merges=[];
    function cDist(a,b){
      var ds=[];
      a.members.forEach(function(ai){ b.members.forEach(function(bi){ ds.push(subDist(ai,bi)); }); });
      if(linkage==='single') return Math.min.apply(null,ds);
      if(linkage==='complete') return Math.max.apply(null,ds);
      return ds.reduce(function(s,v){return s+v;},0)/ds.length;
    }
    while(clusters.length>1){
      var bi=-1,bj=-1,bd=Infinity;
      for(var a=0;a<clusters.length;a++){ for(var b=a+1;b<clusters.length;b++){ var d=cDist(clusters[a],clusters[b]); if(d<bd){bd=d;bi=a;bj=b;} } }
      var merged={members:clusters[bi].members.concat(clusters[bj].members), id:nextId};
      merges.push({a:clusters[bi].id, b:clusters[bj].id, h:bd, id:nextId});
      nextId++;
      var nc=[]; for(a=0;a<clusters.length;a++){ if(a!==bi&&a!==bj) nc.push(clusters[a]); }
      nc.push(merged); clusters=nc;
    }
    return merges;
  }
  var LINK_NAMES40=['single','complete','average'];
  var LINK_LABEL40=['단일 연결(최소거리)','완전 연결(최대거리)','평균 연결(평균거리)'];
  var MERGES40=LINK_NAMES40.map(function(lk){ return agglomerative40(lk); });
  function dendroNodes(merges){
    var nodes={};
    for(var i=0;i<NS40;i++) nodes[i]={id:i, h:0, leaf:true};
    merges.forEach(function(m){ nodes[m.id]={id:m.id, h:m.h, left:m.a, right:m.b, leaf:false}; });
    return nodes;
  }
  function leafOrder(nodes, rootId){
    var order=[];
    (function rec(id){ var nd=nodes[id]; if(nd.leaf){ order.push(id); return; } rec(nd.left); rec(nd.right); })(rootId);
    return order;
  }
  function computeX(nodes, rootId, xOf){
    (function rec(id){
      var nd=nodes[id];
      if(nd.leaf) return xOf[id];
      var lx=rec(nd.left), rx=rec(nd.right);
      xOf[id]=(lx+rx)/2; return xOf[id];
    })(rootId);
    return xOf;
  }
  var DENDRO40=LINK_NAMES40.map(function(lk,li){
    var merges=MERGES40[li], nodes=dendroNodes(merges), rootId=NS40*2-2;
    var order=leafOrder(nodes,rootId), xOf={};
    order.forEach(function(id,i){ xOf[id]=i; });
    computeX(nodes,rootId,xOf);
    var maxH=merges[merges.length-1].h;
    return {merges:merges, nodes:nodes, rootId:rootId, order:order, xOf:xOf, maxH:maxH};
  });
  // 단일연결과 완전연결의 첫 번째 병합 순서 차이 지점(실제 비교)
  var FIRST_DIFF40=(function(){
    var mS=MERGES40[0], mC=MERGES40[1];
    for(var i=0;i<mS.length;i++){
      var keyS=[mS[i].a,mS[i].b].sort().join('+'), keyC=[mC[i].a,mC[i].b].sort().join('+');
      if(keyS!==keyC) return i+1;
    }
    return -1;
  })();

  // ── 40.5 DBSCAN: 두 초승달 + 잡음 4점 ─────────────────────────────────────
  var MX40=[], MY40=[];
  (function(){
    var rng=LCG(778899);
    var n1=17,n2=17;
    for(var i=0;i<n1;i++){
      var t=Math.PI*(i/(n1-1));
      MX40.push(+(5+Math.cos(t)*3.2+(rng()-0.5)*0.28).toFixed(2));
      MY40.push(+(6.2+Math.sin(t)*2.6+(rng()-0.5)*0.28).toFixed(2));
    }
    for(i=0;i<n2;i++){
      var t2=Math.PI*(i/(n2-1));
      MX40.push(+(5+3.2-Math.cos(t2)*3.2+(rng()-0.5)*0.28).toFixed(2));
      MY40.push(+(6.2-1.3-Math.sin(t2)*2.6+(rng()-0.5)*0.28).toFixed(2));
    }
    var nzX=[0.5,9.7,5.0,1.0], nzY=[0.7,9.5,0.5,9.7];
    nzX.forEach(function(x,ii){ MX40.push(x); MY40.push(nzY[ii]); });
  })();
  var NM40=MX40.length; // 38
  var MOON_KM2=kmeansRunG(MX40,MY40,NM40,2,farthestInitG(MX40,MY40,NM40,2,0),50);
  var MOON_SPLIT=(function(){
    var c1={},c2={};
    for(var i=0;i<17;i++) c1[MOON_KM2.assign[i]]=(c1[MOON_KM2.assign[i]]||0)+1;
    for(i=17;i<34;i++) c2[MOON_KM2.assign[i]]=(c2[MOON_KM2.assign[i]]||0)+1;
    return {moon1:c1, moon2:c2};
  })();

  // ── 공용 헬퍼 ──────────────────────────────────────────
  function frame40(px0,px1,pTop,pBot,xlab,ylab){
    return function(ctx){
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,pBot); ctx.lineTo(px1,pBot); ctx.moveTo(px0,pTop); ctx.lineTo(px0,pBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      ctx.fillText(xlab, (px0+px1)/2, pBot+18);
      ctx.save(); ctx.translate(px0-22,(pTop+pBot)/2); ctx.rotate(-Math.PI/2); ctx.fillText(ylab,0,0); ctx.restore();
    };
  }

  var scenes = [

  // ══════════ 1. 지도학습과 무엇이 다른가 ══════════
  { id:'bda40_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code0=[
        {t:'from sklearn.neighbors import NearestCentroid', hl:'NearestCentroid'},
        {t:'clf = NearestCentroid().fit(X_train, y_train)', hl:'.fit(X_train, y_train)'},
        {t:'accuracy_score(y_test, clf.predict(X_test))', hl:'accuracy_score'}
      ];
      var code1=[
        {t:'from sklearn.cluster import KMeans', hl:'KMeans'},
        {t:'km = KMeans(n_clusters=4).fit(X)  # y 없음', hl:'# y 없음'},
        {t:'km.inertia_   # 군집 내 거리제곱합(SSE)', hl:'inertia_'}
      ];
      var code=(s.step<=1)?code0:code1;
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, (s.step<=1?'nearest_centroid.py':'kmeans_unsup.py'), s.step===0?null:2);
      var caps=['같은 구매 데이터 40건을 두 지표(x1,x2) 위에 놓았습니다 — 색은 원래 알고 있던 네 무리(잠재 집단)입니다',
                '「분류」로 보면: 정답(무리 번호)을 훈련에 쓰고, 따로 떼어둔 검증 8건으로 정확도를 실제로 잽니다',
                '「군집」으로 보면: 정답을 아예 지우고 데이터의 구조만으로 무리를 찾습니다 — 맞고 틀림을 잴 정답 자체가 없습니다'];
      ctx.textAlign='left'; ctx.font='12px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText(caps[s.step], W*0.04, codeBot+20);
      var ry=codeBot+42;
      ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
      if(s.step===1){
        ctx.fillStyle=GRN; ctx.fillText('분류 정확도 = '+CLASS_CORRECT40+'/'+TE40.length+' = '+CLASS_ACC40.toFixed(3), W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('훈련 32건으로 각 무리의 중심을 구하고, 검증 8건을 가장 가까운 중심에 배정', W*0.04, ry+20);
      } else if(s.step===2){
        ctx.fillStyle=GLD; ctx.fillText('군집 SSE(응집도) = '+KM4.sse.toFixed(2)+'  (정확도 개념 없음 — 비교할 정답이 없습니다)', W*0.04, ry);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('k=4로 실제 반복계산(할당→중심갱신)해 수렴한 결과 — 색은 「찾아낸」 무리이지, 원래 라벨이 아닙니다', W*0.04, ry+20);
      } else {
        ctx.fillStyle=TXT; ctx.fillText('같은 40건, 같은 두 지표', W*0.04, ry);
      }

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232, x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      frame40(px0,px1,pTop,pBot,'구매 빈도 지표(x1)','평균 구매액 지표(x2)')(ctx);
      for(var i=0;i<N40;i++){
        var col;
        if(s.step===0) col=CLUS_COL[GID40[i]];
        else if(s.step===1) col=CLUS_COL[GID40[i]];
        else col=CLUS_COL[KM4.assign[i]];
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(PX(PX40[i]),PY(PY40[i]),3,0,7); ctx.fill();
        if(s.step===1 && TE40.indexOf(i)>=0){ ctx.strokeStyle=TXT; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(PX(PX40[i]),PY(PY40[i]),5.5,0,7); ctx.stroke(); }
      }
      if(s.step===2){
        KM4.centers.forEach(function(c,ci){
          var cx=PX(c[0]), cy=PY(c[1]);
          ctx.strokeStyle=CLUS_COL[ci]; ctx.lineWidth=2.2;
          ctx.beginPath(); ctx.moveTo(cx-6,cy-6); ctx.lineTo(cx+6,cy+6); ctx.moveTo(cx+6,cy-6); ctx.lineTo(cx-6,cy+6); ctx.stroke();
        });
      }
      if(s.step===1){
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('굵은 테두리 = 검증 8건', px0+6, pTop+13);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (원래 라벨 → 분류로 풀기 → 군집으로 풀기)', true);
      E.big('지도학습과 무엇이 다른가', '같은 40건의 구매 데이터를 두 가지 방식으로 볼 수 있습니다. <b>분류</b>는 정답(무리 번호)을 알고 있다는 전제 아래, 훈련 32건으로 각 무리의 중심을 실제로 계산하고 검증 8건을 가장 가까운 중심에 배정합니다 — 정확도 '+CLASS_ACC40.toFixed(3)+'('+CLASS_CORRECT40+'/'+TE40.length+')로 「맞았다·틀렸다」를 정답과 대조해 잴 수 있습니다. <b>군집</b>은 정답을 아예 쓰지 않습니다. k=4로 K-평균을 실제로 반복계산해 수렴시키면 SSE(군집 내 거리제곱합, 응집도) '+KM4.sse.toFixed(2)+'를 얻지만, 이 숫자는 「얼마나 정답을 맞혔는가」가 아니라 「같은 무리로 묶인 점들이 서로 얼마나 가까운가」를 잴 뿐입니다. 지도학습은 정답 대비 정확도로, 군집분석은 정답 없이 응집도로 스스로를 평가합니다 — 이것이 이번 장부터 다루는 <b>비지도학습</b>의 근본적인 차이입니다.'); }
  },

  // ══════════ 2. K-means — 중심이 옮겨가며 수렴 ══════════
  { id:'bda40_02',
    enter:function(E){ var self=this;
      self.s={k:4, fi:0, trace:null};
      function rebuild(){ var init=farthestInitG(PX40,PY40,N40,self.s.k,0); self.s.trace=kmeansTraceG(PX40,PY40,N40,self.s.k,init,50); if(self.s.fi>=self.s.trace.length) self.s.fi=self.s.trace.length-1; }
      rebuild();
      E.controls('<div class="ctrl"><label>군집 수 k</label><input type="range" id="b402k" min="2" max="6" step="1" value="4"><output id="b402ko">4</output></div>'
               +'<div class="ctrl"><label>반복 단계</label><input type="range" id="b402i" min="0" max="9" step="1" value="0"><output id="b402io">초기화</output></div>');
      E.bind('#b402k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b402ko').textContent=self.s.k; self.s.fi=0; rebuild(); document.getElementById('b402io').textContent='초기화'; document.getElementById('b402i').value=0; });
      E.bind('#b402i','input',function(e){ self.s.fi=Math.min(+e.target.value, self.s.trace.length-1); var f=self.s.trace[self.s.fi]; document.getElementById('b402io').textContent=(f.type==='init'?'초기화':(f.type==='assign'?'할당 '+(f.iter+1)+'회':'중심갱신 '+(f.iter+1)+'회')); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var f=s.trace[s.fi];
      var code=[
        {t:'km = KMeans(n_clusters=k, init=seed).fit(X)', hl:'KMeans'},
        {t:'for i in range(max_iter):', dim:true},
        {t:'    label = argmin(||x - center||)  # 할당', hl:'argmin'},
        {t:'    center = mean(x for x in label)  # 갱신', hl:'mean'}
      ];
      var act=(f.type==='init')?1:(f.type==='assign'?2:3);
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'kmeans_iter.py', act);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('k='+s.k+'  '+(f.type==='init'?'초기 중심 배치':(f.type==='assign'?'할당(assign) '+(f.iter+1)+'회차':'중심 갱신(update) '+(f.iter+1)+'회차')), W*0.04, ry);
      ctx.fillStyle=(f.sse!=null)?BLU:DIM; ctx.fillText('SSE = '+(f.sse!=null?f.sse.toFixed(2):'(할당 전)'), W*0.04, ry+20);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('반복 단계 슬라이더로 할당→갱신 과정을 실제로 한 걸음씩 재생합니다', W*0.04, ry+40);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+62, bh=80;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('초기값 민감도(예시: k=4, 나무 실측)', bx0, by0-6);
      var iv=[{name:'좋은 초기화\n(퍼진 시작점)',v:KM4.sse,col:GRN},{name:'나쁜 초기화\n(한 무리 안 4점)',v:KM4_BAD.sse,col:RED}];
      var maxv=Math.max(iv[0].v,iv[1].v), bw=(bx1-bx0)/2*0.5;
      iv.forEach(function(v,vi){
        var xk=bx0+vi*(bx1-bx0)/2+(bx1-bx0)/2*0.25-bw/2;
        var hh=(v.v/maxv)*bh;
        ctx.fillStyle=v.col; ctx.fillRect(xk, by0+bh-hh, bw, hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        var lines=v.name.split('\n');
        ctx.fillText(lines[0], xk+bw/2, by0+bh+13);
        ctx.fillText(lines[1], xk+bw/2, by0+bh+25);
        ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=v.col;
        ctx.fillText('SSE='+v.v.toFixed(1), xk+bw/2, by0+bh-hh-6);
      });

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232, x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      frame40(px0,px1,pTop,pBot,'구매 빈도 지표(x1)','평균 구매액 지표(x2)')(ctx);
      for(var i=0;i<N40;i++){
        var a=f.assign[i];
        ctx.fillStyle=(a<0)?'rgba(155,153,163,0.6)':CLUS_COL[a];
        ctx.beginPath(); ctx.arc(PX(PX40[i]),PY(PY40[i]),3,0,7); ctx.fill();
      }
      f.centers.forEach(function(c,ci){
        var cx=PX(c[0]), cy=PY(c[1]);
        ctx.strokeStyle=CLUS_COL[ci]; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(cx-7,cy-7); ctx.lineTo(cx+7,cy+7); ctx.moveTo(cx+7,cy-7); ctx.lineTo(cx-7,cy+7); ctx.stroke();
      });

      E.tapHint(W/2, H*0.95, '슬라이더로 k와 반복 단계를 바꿔 할당·중심·SSE가 실제로 재계산되는 것을 보세요', true);
      E.big('K-means — 중심이 옮겨가며 수렴', 'K-평균은 두 단계를 실제로 번갈아 반복합니다: <b>할당</b>(각 점을 가장 가까운 중심에 배정)과 <b>중심 갱신</b>(배정된 점들의 평균으로 중심을 옮김). k='+s.k+'일 때 반복 단계 슬라이더를 끝까지 밀면 SSE가 더 이상 줄지 않는 지점(수렴)에 도달합니다. 그런데 <b>초기 중심을 어디서 시작하느냐가 결과를 바꿉니다</b> — k=4에서 퍼진 시작점으로 출발하면 SSE '+KM4.sse.toFixed(2)+'에 수렴하지만, 한 무리 안에서만 4개 초기 중심을 고르면(한 무리를 둘로 쪼개고 다른 두 무리를 하나로 묶어버려) SSE '+KM4_BAD.sse.toFixed(2)+'라는 훨씬 나쁜 국소최적에 갇힙니다 — 같은 데이터, 같은 k, 오직 시작점만 다른데 결과가 이렇게 벌어집니다. 실전에서는 이 문제를 피하려고 여러 초기값으로 여러 번 돌려 SSE가 가장 낮은 결과를 채택합니다.'); }
  },

  // ══════════ 3. 몇 개로 나눌 것인가 ══════════
  { id:'bda40_03',
    enter:function(E){ var self=this; self.s={k:4};
      E.controls('<div class="ctrl"><label>군집 수 k (커서)</label><input type="range" id="b403k" min="1" max="7" step="1" value="4"><output id="b403ko">4</output></div>');
      E.bind('#b403k','input',function(e){ self.s.k=+e.target.value; document.getElementById('b403ko').textContent=self.s.k; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'for k in range(1, 8):', dim:true},
        {t:'    km = KMeans(n_clusters=k).fit(X)', hl:'KMeans'},
        {t:'    sse.append(km.inertia_)', hl:'inertia_'},
        {t:'    sil.append(silhouette_score(X, km.labels_))', hl:'silhouette_score'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'elbow_silhouette.py', 3);
      var row=ELBOW_CURVE40[s.k-1];
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12.5px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('k='+s.k+'  SSE='+row.sse.toFixed(2)+'  실루엣='+(row.sil!=null?row.sil.toFixed(3):'(k=1 정의불가)'), W*0.04, ry);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('엘보우(꺾이는 지점, 실제 거리 계산)가 가리키는 k = '+ELBOW_K40+'  ·  실루엣이 가리키는 최적 k = '+BEST_SIL_K40, W*0.04, ry+22);
      ctx.fillStyle=(ELBOW_K40!==BEST_SIL_K40)?RED:GRN;
      ctx.fillText(ELBOW_K40!==BEST_SIL_K40?'두 기준이 서로 다른 k를 가리킵니다 — 정답은 하나가 아닙니다':'이 데이터에서는 두 기준이 일치합니다', W*0.04, ry+42);

      var rx0=W*0.49, rx1=W*0.965, rTop=26, rMid=132, rBot=232;
      // 위: SSE 곡선
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rx0,rMid-8); ctx.lineTo(rx1,rMid-8); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('SSE (엘보우)', rx0, rTop-8);
      var maxSSE=Math.max.apply(null,ELBOW_CURVE40.map(function(r){return r.sse;}));
      function sx(k){ return rx0+((k-1)/6)*(rx1-rx0); }
      function sy1(v){ return rTop+(1-v/maxSSE)*((rMid-8)-rTop); }
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      ELBOW_CURVE40.forEach(function(r,ri){ var x=sx(r.k),y=sy1(r.sse); if(ri===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      ELBOW_CURVE40.forEach(function(r){ ctx.fillStyle=(r.k===ELBOW_K40)?RED:BLU; ctx.beginPath(); ctx.arc(sx(r.k),sy1(r.sse),(r.k===ELBOW_K40)?4.2:2.4,0,7); ctx.fill(); });
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(sx(s.k),rTop); ctx.lineTo(sx(s.k),rMid-8); ctx.stroke(); ctx.setLineDash([]);

      // 아래: 실루엣 곡선
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1,rBot); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('실루엣 계수 (클수록 좋음)', rx0, rMid+16);
      var sils=ELBOW_CURVE40.filter(function(r){return r.sil!=null;});
      var maxSil=Math.max.apply(null,sils.map(function(r){return r.sil;}));
      function sy2(v){ return (rMid+24)+(1-v/maxSil)*(rBot-(rMid+24)); }
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      sils.forEach(function(r,ri){ var x=sx(r.k),y=sy2(r.sil); if(ri===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      sils.forEach(function(r){ ctx.fillStyle=(r.k===BEST_SIL_K40)?RED:GRN; ctx.beginPath(); ctx.arc(sx(r.k),sy2(r.sil),(r.k===BEST_SIL_K40)?4.2:2.4,0,7); ctx.fill(); });
      ctx.strokeStyle=GLD; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(sx(s.k),rMid+24); ctx.lineTo(sx(s.k),rBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
      for(var kk=1;kk<=7;kk++) ctx.fillText(''+kk, sx(kk), rBot+13);

      E.tapHint(W/2, H*0.95, '슬라이더로 k를 훑어 SSE·실루엣 값을 실제로 확인하세요', true);
      E.big('몇 개로 나눌 것인가', '군집 수 k는 알고리즘이 정해주지 않습니다. <b>엘보우 방법</b>은 k를 1부터 늘려가며 SSE가 「더 이상 크게 줄지 않는」 꺾이는 지점을 찾습니다 — 실제로 각 k에서 K-평균을 수렴시켜 SSE 곡선을 그리고, 시작점과 끝점을 잇는 직선에서 가장 멀리 벗어난 점을 찾는 방식으로 계산하면 k='+ELBOW_K40+'을 가리킵니다. <b>실루엣 계수</b>는 각 점이 「자기 군집과는 얼마나 가깝고 남의 군집과는 얼마나 먼가」(b−a)/max(a,b)를 실제로 재서 평균 낸 값으로, k='+BEST_SIL_K40+'에서 최고점('+ELBOW_CURVE40[BEST_SIL_K40-1].sil.toFixed(3)+')을 찍습니다. '+(ELBOW_K40!==BEST_SIL_K40?'이 데이터에서는 두 기준이 서로 다른 k를 가리킵니다 — SSE는 군집을 더 잘게 쪼갤수록 항상(단조롭게) 줄어들기 때문에 「어디서 멈출까」는 판단이 필요하지만, 실루엣은 자체적으로 상한이 있어 더 원칙적인 비교가 가능합니다.':'이 데이터에서는 두 기준이 우연히 일치합니다.')+' 실전에서는 두 지표가 갈릴 때 도메인 지식(무리를 나눈 뒤 실제로 활용 가능한가)으로 최종 k를 정합니다.'); }
  },

  // ══════════ 4. 계층적 군집과 덴드로그램 ══════════
  { id:'bda40_04',
    enter:function(E){ var self=this; self.s={link:0, cut:2.0};
      E.controls('<div class="ctrl"><label>연결법</label><input type="range" id="b404l" min="0" max="2" step="1" value="0"><output id="b404lo">단일 연결</output></div>'
               +'<div class="ctrl"><label>자르는 높이</label><input type="range" id="b404c" min="0" max="7" step="0.1" value="2.0"><output id="b404co">2.0</output></div>');
      E.bind('#b404l','input',function(e){ self.s.link=+e.target.value; document.getElementById('b404lo').textContent=LINK_LABEL40[self.s.link]; });
      E.bind('#b404c','input',function(e){ self.s.cut=+e.target.value; document.getElementById('b404co').textContent=self.s.cut.toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.cluster import AgglomerativeClustering', hl:'AgglomerativeClustering'},
        {t:"model = AgglomerativeClustering(linkage='"+LINK_NAMES40[s.link]+"',", hl:"linkage='"+LINK_NAMES40[s.link]+"'"},
        {t:'                                 distance_threshold='+s.cut.toFixed(1)+')', hl:'distance_threshold'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'hier_dendro.py', 1);
      var D=DENDRO40[s.link];
      var appliedMerges=D.merges.filter(function(m){return m.h<=s.cut;}).length;
      var nClusters=NS40-appliedMerges;
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText(LINK_LABEL40[s.link]+' · 자르는 높이='+s.cut.toFixed(1), W*0.04, ry);
      ctx.fillStyle=BLU; ctx.fillText('이 높이에서 잘리는 군집 수 = '+nClusters, W*0.04, ry+19);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      var wrap1='단일·완전 연결은 '+FIRST_DIFF40+'번째 병합부터 순서가 실제로 달라집니다', wrap2='(가장 먼 점 하나를 기준으로 재는가, 평균으로 재는가의 차이)';
      ctx.fillText(wrap1, W*0.04, ry+42);
      ctx.fillText(wrap2, W*0.04, ry+60);
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillStyle=TXT;
      var my=ry+82;
      D.merges.slice(0,4).forEach(function(m,mi){
        var nm=function(id){ return id<NS40? ('점'+id) : ('군'+id); };
        ctx.fillText((mi+1)+') '+nm(m.a)+'+'+nm(m.b)+' → h='+m.h.toFixed(2), W*0.04, my+mi*15);
      });

      var rx0=W*0.50, rx1=W*0.965, rTop=26, rBot=220;
      var leafY=rBot;
      function hx(x){ return rx0+((x+0.5)/NS40)*(rx1-rx0); }
      function hy(h){ return rBot-(h/(D.maxH*1.08))*(rBot-rTop); }
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rx0,rBot); ctx.lineTo(rx1,rBot); ctx.stroke();
      // draw merges as U-shapes
      ctx.strokeStyle=BLU; ctx.lineWidth=1.6;
      D.merges.forEach(function(m){
        var y=hy(m.h), xa=hx(D.xOf[m.a]), xb=hx(D.xOf[m.b]);
        var ya=(m.a<NS40)?leafY:hy(D.nodes[m.a].h), yb=(m.b<NS40)?leafY:hy(D.nodes[m.b].h);
        ctx.strokeStyle=(m.h<=s.cut)?BLU:'rgba(122,184,255,0.35)';
        ctx.beginPath(); ctx.moveTo(xa,ya); ctx.lineTo(xa,y); ctx.lineTo(xb,y); ctx.lineTo(xb,yb); ctx.stroke();
      });
      // leaf labels
      ctx.font='11px ui-monospace,Menlo,monospace'; ctx.textAlign='center';
      D.order.forEach(function(id){
        ctx.fillStyle=TXT; ctx.beginPath(); ctx.arc(hx(D.xOf[id]),leafY,2.6,0,7); ctx.fill();
        ctx.fillText(''+id, hx(D.xOf[id]), leafY+15);
      });
      // cut line
      if(s.cut<=D.maxH*1.08){
        ctx.strokeStyle=GLD; ctx.setLineDash([4,3]); ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(rx0,hy(s.cut)); ctx.lineTo(rx1,hy(s.cut)); ctx.stroke(); ctx.setLineDash([]);
        ctx.font='11px sans-serif'; ctx.fillStyle=GLD; ctx.textAlign='left';
        ctx.fillText('자르는 높이 h='+s.cut.toFixed(1), rx0+4, hy(s.cut)-5);
      }
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('세로축 = 병합 높이(거리)', rx0, rTop-8);

      E.tapHint(W/2, H*0.95, '연결법·자르는 높이 슬라이더로 병합 순서·군집 수가 실제로 바뀌는 것을 보세요', true);
      E.big('계층적 군집과 덴드로그램', '계층적 군집은 가장 가까운 두 개체(또는 무리)부터 하나씩 실제로 병합해 나갑니다. 「가까움」을 재는 방식이 <b>연결법</b>입니다 — 단일 연결은 두 무리 사이 가장 가까운 점끼리의 거리, 완전 연결은 가장 먼 점끼리의 거리, 평균 연결은 모든 쌍의 평균 거리를 씁니다. 8개 점으로 세 연결법을 모두 실제로 계산해 보면, 처음 네 번의 병합(뚜렷하게 가까운 쌍)은 방식과 무관하게 같지만 <b>'+FIRST_DIFF40+'번째 병합부터 단일 연결과 완전 연결의 순서가 실제로 달라집니다</b> — 어느 무리를 먼저 합칠지에 대한 판단이 갈리는 것입니다. 다 병합된 결과는 <b>덴드로그램</b>(나무 그림)으로 남는데, 이 나무를 어느 <b>높이에서 자르느냐</b>가 곧 최종 군집 수를 정합니다 — 높이를 슬라이더로 낮추면 더 잘게, 높이면 더 굵게 묶입니다. K-means와 달리 k를 미리 정하지 않고 나무를 다 그린 뒤에 원하는 세밀도로 잘라볼 수 있는 것이 계층적 군집의 강점입니다.'); }
  },

  // ══════════ 5. 밀도로 묶다 — DBSCAN ══════════
  { id:'bda40_05',
    enter:function(E){ var self=this; self.s={eps:0.9, minPts:3};
      E.controls('<div class="ctrl"><label>이웃 반경 eps</label><input type="range" id="b405e" min="0.4" max="1.6" step="0.05" value="0.9"><output id="b405eo">0.90</output></div>'
               +'<div class="ctrl"><label>최소 이웃 수 minPts</label><input type="range" id="b405m" min="2" max="6" step="1" value="3"><output id="b405mo">3</output></div>');
      E.bind('#b405e','input',function(e){ self.s.eps=+e.target.value; document.getElementById('b405eo').textContent=self.s.eps.toFixed(2); });
      E.bind('#b405m','input',function(e){ self.s.minPts=+e.target.value; document.getElementById('b405mo').textContent=self.s.minPts; });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.cluster import DBSCAN', hl:'DBSCAN'},
        {t:'db = DBSCAN(eps='+s.eps.toFixed(2)+', min_samples='+s.minPts+').fit(X)', hl:'DBSCAN'},
        {t:'labels = db.labels_    # -1은 잡음(noise)', hl:'-1'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.42, code, 'dbscan_moons.py', 1);
      var R=dbscanG(MX40,MY40,NM40,s.eps,s.minPts);
      var nCore=0,nBorder=0,nNoise=0;
      for(var i=0;i<NM40;i++){ if(R.labels[i]===-1) nNoise++; else if(R.isCore[i]) nCore++; else nBorder++; }
      var ry=codeBot+18;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('eps='+s.eps.toFixed(2)+'  minPts='+s.minPts+'  →  군집 '+R.nClusters+'개', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('핵심점 '+nCore+'개', W*0.04, ry+19);
      ctx.fillStyle=BLU; ctx.fillText('경계점 '+nBorder+'개', W*0.04+90, ry+19);
      ctx.fillStyle=RED; ctx.fillText('잡음점 '+nNoise+'개', W*0.04+180, ry+19);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('핵심점=반경 안 이웃≥minPts, 경계점=핵심점 이웃이지만 자신은 부족, 잡음=어디에도 못 낌', W*0.04, ry+40);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+58, bh=80;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('참고: K-means(k=2)는 이 모양을 못 푼다', bx0, by0-6);
      var m1=MOON_SPLIT.moon1, m2=MOON_SPLIT.moon2;
      var keys=Object.keys(Object.assign({},m1,m2));
      var maxv=17;
      keys.forEach(function(k,ki){
        var v1=m1[k]||0, v2=m2[k]||0;
        var xk=bx0+ki*((bx1-bx0)/keys.length);
        var bw2=((bx1-bx0)/keys.length)*0.38;
        ctx.fillStyle=CLUS_COL[+k]; ctx.globalAlpha=0.55;
        ctx.fillRect(xk+4, by0+bh-(v1/maxv)*bh, bw2, (v1/maxv)*bh);
        ctx.globalAlpha=1;
        ctx.fillStyle=CLUS_COL[+k];
        ctx.fillRect(xk+4+bw2+4, by0+bh-(v2/maxv)*bh, bw2, (v2/maxv)*bh);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='center';
        ctx.fillText('km군집'+k, xk+4+bw2, by0+bh+12);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('(연한=초승달1 유래, 진한=초승달2 유래 — 한 K-means 군집에 두 초승달이 섞임)', bx0, by0+bh+26);

      var px0=W*0.49, px1=W*0.965, pTop=28, pBot=232, x1max=10.2, x2max=10.2;
      function PX(v){ return px0+(v/x1max)*(px1-px0); }
      function PY(v){ return pBot-(v/x2max)*(pBot-pTop); }
      frame40(px0,px1,pTop,pBot,'x1','x2')(ctx);
      for(var j=0;j<NM40;j++){
        var lab=R.labels[j];
        if(lab===-1){ ctx.strokeStyle=RED; ctx.lineWidth=1.4; var xx=PX(MX40[j]),yy=PY(MY40[j]); ctx.beginPath(); ctx.moveTo(xx-3.5,yy-3.5); ctx.lineTo(xx+3.5,yy+3.5); ctx.moveTo(xx+3.5,yy-3.5); ctx.lineTo(xx-3.5,yy+3.5); ctx.stroke(); }
        else {
          var col=CLUS_COL[lab%CLUS_COL.length];
          ctx.fillStyle=col;
          if(R.isCore[j]){ ctx.beginPath(); ctx.arc(PX(MX40[j]),PY(MY40[j]),3.2,0,7); ctx.fill(); }
          else { ctx.strokeStyle=col; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(PX(MX40[j]),PY(MY40[j]),3.6,0,7); ctx.stroke(); }
        }
      }

      E.tapHint(W/2, H*0.95, '슬라이더로 eps·minPts를 바꿔 핵심점·경계점·잡음점 개수가 실제로 재계산되는 것을 보세요', true);
      E.big('밀도로 묶다 — DBSCAN', 'K-means는 항상 중심으로부터의 거리로 나누기 때문에 초승달처럼 휘어진 모양은 가운데를 가로질러 잘못 잘라버립니다 — 실제로 이 데이터에 K-means(k=2)를 돌리면 한 군집에 초승달1의 점 '+m1[Object.keys(m1)[0]]+'개와 초승달2의 점이 뒤섞입니다. <b>DBSCAN</b>은 거리 대신 <b>밀도</b>로 접근합니다: 반경 eps 안에 이웃이 minPts개 이상이면 <b>핵심점</b>, 핵심점의 이웃이지만 자신은 이웃이 부족하면 <b>경계점</b>, 어느 핵심점과도 연결되지 않으면 <b>잡음점</b>으로 실제로 분류합니다. eps='+s.eps.toFixed(2)+', minPts='+s.minPts+'에서는 핵심점 '+nCore+'개·경계점 '+nBorder+'개가 서로 연결되어 초승달 모양 그대로 군집 '+R.nClusters+'개를 찾아내고, 일부러 섞어둔 동떨어진 점 4개는 잡음점 '+nNoise+'개로 자동으로 걸러집니다. eps를 너무 작게 하면 이웃이 부족해 거의 다 잡음이 되고, minPts를 너무 크게 해도 마찬가지입니다 — 슬라이더로 직접 그 붕괴 지점을 확인할 수 있습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
