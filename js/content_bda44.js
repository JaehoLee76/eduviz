/* 빅데이터 분석 제44장 — 사회 연결망 분석(노드·엣지·인접행렬·네 가지 중심성·매개 중심성의 다리 역할·
   커뮤니티 탐지(모듈성)·네트워크 성격(밀도·군집계수·평균경로·좁은세상))
   동작(behavior)만. 텍스트=content/bda44.json. 엔진 js/engine.js 공유. 색: BDA=로즈 마젠타 테마.
   골든룰: 화면의 모든 수(엣지 수·밀도·중심성 네 가지·평균 경로 길이·모듈성·군집계수)는 아래
   고정 네트워크(노드 13개)로부터 이 파일 로드 시 BFS/Brandes 매개중심성/거듭제곱법 위세중심성/
   모듈성 공식을 실제로 계산한다(하드코딩 금지). 노드 배치 좌표만 시각화용 고정 레이아웃(수치가
   아니라 그림 위치이므로 골든룰 대상 아님). 난수(Math.random) 절대 금지. */
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

  // ══════════ 고정 데이터: 협업 네트워크 — 노드 13명(성씨 한 글자), 엣지 19개 ══════════
  var N44=13;
  var LAB44=['김','이','박','최','정','강','조','윤','장','임','한','오','신'];
  // 0김·1이·2박·3최·4정 = A모임(5명, 촘촘) / 5강·6조·7윤·8장·9임 = B모임(5명, 촘촘)
  // 10한 = 두 모임을 잇는 최단 다리(짧은 지름길) / 11오·12신 = A·B에 각각 매달린 주변인(긴 우회로)
  var EDGES44=[
    [0,1],[0,2],[0,3],[1,2],[1,4],[2,3],[3,4],           // A모임 내부(7)
    [5,6],[5,7],[6,8],[6,9],[7,8],[7,9],[8,9],           // B모임 내부(7)
    [4,10],[10,5],                                        // 다리(한): 짧은 지름길(2)
    [2,11],[11,12],[12,6]                                 // 주변인 경로: 긴 우회로(3)
  ];
  var POS44=[ // 시각화 배치 좌표(0~1 비율). 수치 데이터 아님 — 겹침 없는 고정 레이아웃.
    [0.07,0.26],[0.22,0.08],[0.05,0.58],[0.23,0.78],[0.27,0.44], // 0~4
    [0.66,0.42],[0.90,0.26],[0.75,0.08],[0.93,0.60],[0.72,0.80], // 5~9
    [0.47,0.50],[0.03,0.92],[0.97,0.92]                           // 10한·11오·12신
  ];
  var ADJ44=[]; for(var _i=0;_i<N44;_i++) ADJ44.push([]);
  EDGES44.forEach(function(e){ ADJ44[e[0]].push(e[1]); ADJ44[e[1]].push(e[0]); });
  var DEG44=ADJ44.map(function(a){return a.length;});
  var M44=EDGES44.length;
  var DENSITY44=2*M44/(N44*(N44-1));
  var AMAT44=[]; for(_i=0;_i<N44;_i++){ var row=[]; for(var _j=0;_j<N44;_j++) row.push(0); AMAT44.push(row); }
  EDGES44.forEach(function(e){ AMAT44[e[0]][e[1]]=1; AMAT44[e[1]][e[0]]=1; });

  // ── 방향·가중 대비용 소규모 예시(4명: 김·이·박·최의 실제 메시지 왕래 횟수) ──
  var MSGW=[[0,5,3,0],[2,0,6,0],[0,1,0,4],[1,0,0,0]]; // MSGW[i][j] = i→j 메시지 수
  var DIR_EDGES=0; for(var di=0;di<4;di++) for(var dj=0;dj<4;dj++){ if(di!==dj && MSGW[di][dj]>0) DIR_EDGES++; }
  var DIR_DENSITY=DIR_EDGES/(4*3);
  var UND_THRESH=4;
  var UND_EDGES4=0, UND_PAIRS4=[];
  for(var pi=0;pi<4;pi++) for(var pj=pi+1;pj<4;pj++){ if(MSGW[pi][pj]+MSGW[pj][pi]>=UND_THRESH){ UND_EDGES4++; UND_PAIRS4.push([pi,pj]); } }
  var UND_DENSITY4=2*UND_EDGES4/(4*3);

  // ── BFS 최단경로 ──────────────────────────────────────────────
  function bfsDist(src,adj,nodes){
    var dist={}; nodes.forEach(function(v){dist[v]=-1;});
    dist[src]=0; var q=[src];
    while(q.length){
      var u=q.shift();
      (adj[u]||[]).forEach(function(v){ if(dist[v]===-1){ dist[v]=dist[u]+1; q.push(v); } });
    }
    return dist;
  }
  function avgPathLen(adj,nodes){
    var total=0,cnt=0;
    nodes.forEach(function(s){
      var d=bfsDist(s,adj,nodes);
      nodes.forEach(function(t){ if(t!==s && d[t]>=0){ total+=d[t]; cnt++; } });
    });
    return {avg: total/cnt, pairs: cnt};
  }
  var FULLNODES=[]; for(_i=0;_i<N44;_i++) FULLNODES.push(_i);
  var AVGPATH_FULL=avgPathLen(ADJ44,FULLNODES).avg;

  // ── 근접 중심성 ──────────────────────────────────────────────
  function closeness44(){
    return FULLNODES.map(function(i){
      var d=bfsDist(i,ADJ44,FULLNODES); var s=0; FULLNODES.forEach(function(j){ if(j!==i) s+=d[j]; });
      return (N44-1)/s;
    });
  }
  // ── 매개 중심성(Brandes) ──────────────────────────────────────────────
  function betweenness44(){
    var C=new Array(N44).fill(0);
    for(var s=0;s<N44;s++){
      var S=[], P=[]; for(_i=0;_i<N44;_i++) P.push([]);
      var sigma=new Array(N44).fill(0); sigma[s]=1;
      var d=new Array(N44).fill(-1); d[s]=0;
      var Q=[s];
      while(Q.length){
        var v=Q.shift(); S.push(v);
        ADJ44[v].forEach(function(w){
          if(d[w]<0){ Q.push(w); d[w]=d[v]+1; }
          if(d[w]===d[v]+1){ sigma[w]+=sigma[v]; P[w].push(v); }
        });
      }
      var delta=new Array(N44).fill(0);
      while(S.length){
        var w=S.pop();
        P[w].forEach(function(v){ delta[v]+=(sigma[v]/sigma[w])*(1+delta[w]); });
        if(w!==s) C[w]+=delta[w];
      }
    }
    return C.map(function(x){return x/2;}); // 무방향: 양방향 중복 계산 보정
  }
  // ── 위세(고유벡터) 중심성: 거듭제곱법 ──────────────────────────────────────────────
  function eigenCentrality44(){
    var x=new Array(N44).fill(1);
    for(var it=0; it<300; it++){
      var y=new Array(N44).fill(0);
      for(_i=0;_i<N44;_i++){ ADJ44[_i].forEach(function(j){ y[_i]+=x[j]; }); }
      var norm=Math.sqrt(y.reduce(function(s,v){return s+v*v;},0));
      if(norm<1e-12) break;
      x=y.map(function(v){return v/norm;});
    }
    return x;
  }
  function degreeCentrality44(){ return DEG44.map(function(d){return d/(N44-1);}); }

  var DEGC44=degreeCentrality44(), CLOC44=closeness44(), BETC44=betweenness44(), EIGC44=eigenCentrality44();
  function top3(vals){
    var idx=FULLNODES.slice().sort(function(a,b){return vals[b]-vals[a];});
    return idx.slice(0,3);
  }
  var METRICS44=[
    {name:'연결 중심성', key:'deg', vals:DEGC44, fn:'nx.degree_centrality(G)', desc:'이웃이 몇 명인가'},
    {name:'근접 중심성', key:'clo', vals:CLOC44, fn:'nx.closeness_centrality(G)', desc:'모두에게 얼마나 가까운가'},
    {name:'매개 중심성', key:'bet', vals:BETC44, fn:'nx.betweenness_centrality(G)', desc:'최단경로 위에 얼마나 놓이는가'},
    {name:'위세 중심성', key:'eig', vals:EIGC44, fn:'nx.eigenvector_centrality(G)', desc:'중요한 이웃을 얼마나 뒀는가'}
  ];

  // ── 10(한) 제거 후 재계산 ──────────────────────────────────────────────
  var NODES_NO10=FULLNODES.filter(function(i){return i!==10;});
  var EDGES_NO10=EDGES44.filter(function(e){return e[0]!==10 && e[1]!==10;});
  var ADJ_NO10=[]; for(_i=0;_i<N44;_i++) ADJ_NO10.push([]);
  EDGES_NO10.forEach(function(e){ ADJ_NO10[e[0]].push(e[1]); ADJ_NO10[e[1]].push(e[0]); });
  var AVGPATH_NO10=avgPathLen(ADJ_NO10,NODES_NO10).avg;
  var PATH_4_5_BEFORE=bfsDist(4,ADJ44,FULLNODES)[5];
  var PATH_4_5_AFTER=bfsDist(4,ADJ_NO10,NODES_NO10)[5];
  function tracePath44(src,tgt,adj,nodes){
    var d=bfsDist(src,adj,nodes), prev={}; prev[src]=null;
    var q=[src], seen={}; seen[src]=true;
    while(q.length){ var u=q.shift(); (adj[u]||[]).forEach(function(v){ if(!seen[v]){ seen[v]=true; prev[v]=u; q.push(v); } }); }
    if(!(tgt in prev)) return null;
    var path=[tgt]; var cur=tgt; while(prev[cur]!==null && prev[cur]!==undefined){ cur=prev[cur]; path.push(cur); }
    return path.reverse();
  }
  var PATH_BEFORE=tracePath44(4,5,ADJ44,FULLNODES);
  var PATH_AFTER=tracePath44(4,5,ADJ_NO10,NODES_NO10);

  // ── 모듈성(커뮤니티 탐지) ──────────────────────────────────────────────
  function modularity44(comm){
    var Q=0, twoM=2*M44;
    for(var i=0;i<N44;i++) for(var j=0;j<N44;j++){
      if(comm[i]===comm[j]) Q += (AMAT44[i][j] - (DEG44[i]*DEG44[j])/twoM);
    }
    return Q/twoM;
  }
  var PART44=[
    {name:'무작위 절반', comm:FULLNODES.map(function(i){return i%2;})},
    {name:'A+한 / B+신', comm:[0,0,0,0,0,1,1,1,1,1,0,0,1]},
    {name:'A / B+한+신', comm:[0,0,0,0,0,1,1,1,1,1,1,0,1]},
    {name:'A / B / 다리셋', comm:[0,0,0,0,0,1,1,1,1,1,2,2,2]}
  ];
  PART44.forEach(function(p){ p.Q=modularity44(p.comm); });
  var BEST_PART44=PART44.reduce(function(best,p){ return p.Q>best.Q?p:best; }, PART44[0]);

  // ── 군집 계수·전체 밀도·랜덤 그래프 대비 ──────────────────────────────────────────────
  function clusteringCoef44(){
    var sum=0,cnt=0;
    for(var i=0;i<N44;i++){
      var nb=ADJ44[i], k=nb.length; if(k<2){ cnt++; continue; }
      var links=0;
      for(var a=0;a<nb.length;a++) for(var b=a+1;b<nb.length;b++){ if(AMAT44[nb[a]][nb[b]]) links++; }
      sum += links/(k*(k-1)/2); cnt++;
    }
    return sum/cnt;
  }
  var CLUST44=clusteringCoef44();
  var AVGDEG44=2*M44/N44;
  var RAND_PATH44=Math.log(N44)/Math.log(AVGDEG44);
  var DEGHIST44=(function(){ var h={}; DEG44.forEach(function(d){ h[d]=(h[d]||0)+1; }); return h; })();
  var DEGVALS44=Object.keys(DEGHIST44).map(Number).sort(function(a,b){return a-b;});

  // ── 공용 네트워크 그리기 ──────────────────────────────────────────────
  function drawNetwork44(ctx,x0,y0,w,h,opts){
    opts=opts||{};
    var edgeSet=opts.edges||EDGES44;
    var nodeColor=opts.nodeColor||function(){return BLU;};
    var nodeR=opts.nodeR||function(){return 12;};
    var hl=opts.highlight||[];
    var pathSet=opts.pathEdges||[];
    function PX(i){ return x0+POS44[i][0]*w; }
    function PY(i){ return y0+POS44[i][1]*h; }
    ctx.lineWidth=1.3;
    edgeSet.forEach(function(e){
      var onPath=pathSet.some(function(pe){ return (pe[0]===e[0]&&pe[1]===e[1])||(pe[0]===e[1]&&pe[1]===e[0]); });
      ctx.strokeStyle = onPath ? GLD : 'rgba(255,255,255,0.26)';
      ctx.lineWidth = onPath ? 2.6 : 1.3;
      ctx.beginPath(); ctx.moveTo(PX(e[0]),PY(e[0])); ctx.lineTo(PX(e[1]),PY(e[1])); ctx.stroke();
    });
    for(var i=0;i<N44;i++){
      var r=nodeR(i);
      ctx.fillStyle=nodeColor(i);
      ctx.beginPath(); ctx.arc(PX(i),PY(i),r,0,7); ctx.fill();
      if(hl.indexOf(i)>=0){ ctx.strokeStyle=RED; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(PX(i),PY(i),r+3,0,7); ctx.stroke(); }
      ctx.fillStyle='#241926'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(LAB44[i], PX(i), PY(i)+0.5);
    }
    ctx.textBaseline='alphabetic';
  }

  var scenes = [

  // ══════════ 1. 점과 선으로 세상을 그리다 ══════════
  { id:'bda44_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import networkx as nx', hl:'networkx'},
        {t:'G = nx.Graph()', hl:'nx.Graph'},
        {t:'G.add_edges_from(edges)', hl:'add_edges_from'},
        {t:'nx.density(G)', hl:'nx.density'}
      ];
      var actLine=s.step===0?[0,1,2]:3;
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'social_graph.py', actLine);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText('노드 '+N44+'명 · 엣지 '+M44+'개', W*0.04, ry);
      ctx.fillStyle=BLU;
      ctx.fillText('밀도 = 2×엣지/(N×(N−1)) = '+DENSITY44.toFixed(3), W*0.04, ry+20);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var expl=['협업 관계 13명을 그림(노드·엣지)으로 나타냅니다','같은 관계를 인접행렬(0/1 표)로도 나타낼 수 있습니다 — 두 표현은 같은 정보입니다','방향·가중을 살리면 정보가 더 많습니다: 메시지 왕래 예시로 비교합니다'];
      ctx.fillText(expl[s.step], W*0.04, ry+42);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;

      if(s.step===0){
        drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {nodeColor:function(){return BLU;}});
      } else if(s.step===1){
        var n=N44, cell=Math.min((px1-px0-40)/(n+1), (pBot-pTop-40)/(n+1), 21);
        var mx0=px0+34, my0=pTop+30;
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('인접행렬 A['+n+'×'+n+'] (1=엣지 있음)', px0, pTop+12);
        for(var i=0;i<n;i++){
          ctx.fillStyle=DIM; ctx.textAlign='center';
          ctx.fillText(LAB44[i], mx0+(i+1)*cell+cell/2, my0-6);
          ctx.textAlign='right'; ctx.fillText(LAB44[i], mx0+cell-4, my0+i*cell+cell/2+4);
          for(var j=0;j<n;j++){
            var v=AMAT44[i][j];
            ctx.fillStyle = v? 'rgba(126,224,176,0.30)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(mx0+(j+1)*cell, my0+i*cell, cell-1, cell-1);
            if(v){ ctx.fillStyle=GRN; ctx.textAlign='center'; ctx.font='11px ui-monospace,Menlo,monospace'; ctx.fillText('1', mx0+(j+1)*cell+cell/2, my0+i*cell+cell/2+4); }
          }
        }
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
        ctx.fillText('행렬의 1 개수를 절반으로 나누면(무방향은 대칭) 엣지 수 '+M44+'개와 정확히 같습니다', px0, my0+n*cell+22);
      } else {
        ctx.font='11.5px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left';
        ctx.fillText('예시: 김·이·박·최 4명의 실제 메시지 왕래 횟수(방향·가중 있음)', px0, pTop+14);
        var cell2=44, mx2=px0+50, my2=pTop+40, labs4=['김','이','박','최'];
        for(var a=0;a<4;a++){
          ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.font='11px sans-serif';
          ctx.fillText(labs4[a], mx2+(a+1)*cell2+cell2/2, my2-8);
          ctx.textAlign='right'; ctx.fillText(labs4[a]+'→', mx2+cell2-6, my2+a*cell2+cell2/2+4);
          for(var b=0;b<4;b++){
            var w=MSGW[a][b];
            ctx.fillStyle = w>0 ? 'rgba(255,122,184,0.22)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(mx2+(b+1)*cell2, my2+a*cell2, cell2-1, cell2-1);
            ctx.fillStyle= w>0? ROSE : DIM; ctx.textAlign='center'; ctx.font='11px ui-monospace,Menlo,monospace';
            ctx.fillText(String(w), mx2+(b+1)*cell2+cell2/2, my2+a*cell2+cell2/2+4);
          }
        }
        var ry3=my2+4*cell2+28;
        ctx.font='11.5px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillStyle=ROSE; ctx.fillText('방향·가중 그대로: 화살 '+DIR_EDGES+'개, 밀도='+DIR_DENSITY.toFixed(3), px0, ry3);
        ctx.fillStyle=BLU; ctx.fillText('무방향·비가중(왕래 합≥'+UND_THRESH+'만 연결): 엣지 '+UND_EDGES4+'개, 밀도='+UND_DENSITY4.toFixed(3), px0, ry3+20);
        ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('같은 넷 명 사이 관계인데도 어떻게 표현하느냐에 따라 엣지 수·밀도가 달라집니다', px0, ry3+42);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 그림 → 인접행렬 → 방향·가중 비교', true);
      E.big('점과 선으로 세상을 그리다', '사회 연결망은 <b>노드(사람·조직)</b>와 <b>엣지(관계)</b>로 세상을 단순화합니다. 협업 관계 13명을 그림으로 나타내면 노드 '+N44+'개·엣지 '+M44+'개이고, 같은 정보를 <b>인접행렬</b>(각 칸이 두 노드 사이 연결 여부)로도 똑같이 나타낼 수 있습니다 — 두 표현에서 실제로 센 엣지 수는 항상 같습니다. 관계는 <b>방향</b>이 있을 수도(누가 누구에게 말을 거는가), <b>가중치</b>가 있을 수도(얼마나 자주) 있습니다. 김·이·박·최 네 명의 실제 메시지 왕래 횟수로 보면, 방향·가중을 살렸을 때는 화살 '+DIR_EDGES+'개(밀도 '+DIR_DENSITY.toFixed(3)+')였던 관계가, 방향·가중을 지우고 「왕래가 충분히 많을 때만 연결」로 단순화하면 엣지 '+UND_EDGES4+'개(밀도 '+UND_DENSITY4.toFixed(3)+')로 줄어듭니다 — <b>밀도</b>(전체 가능한 관계 중 실제로 존재하는 비율)는 어떤 표현을 쓰느냐에 따라 실측값이 달라집니다.'); }
  },

  // ══════════ 2. 누가 중심인가 — 네 개의 답 ══════════
  { id:'bda44_02',
    enter:function(E){ this.s={m:0}; E.setOn([]); },
    tap:function(E){ this.s.m=(this.s.m+1)%4; E.blip(360+this.s.m*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var met=METRICS44[s.m];
      var code=[
        {t:'nx.degree_centrality(G)', hl: s.m===0?'nx.degree_centrality':null},
        {t:'nx.closeness_centrality(G)', hl: s.m===1?'nx.closeness_centrality':null},
        {t:'nx.betweenness_centrality(G)', hl: s.m===2?'nx.betweenness_centrality':null},
        {t:'nx.eigenvector_centrality(G)', hl: s.m===3?'nx.eigenvector_centrality':null}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'four_centralities.py', s.m);
      var ranks=top3(met.vals);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillStyle=GLD;
      ctx.fillText(met.name+' — '+met.desc, W*0.04, ry);
      ctx.font='12px ui-monospace,Menlo,monospace';
      ranks.forEach(function(idx,ri){
        ctx.fillStyle= ri===0? GRN : TXT;
        ctx.fillText((ri+1)+'위 '+LAB44[idx]+'  '+met.vals[idx].toFixed(3), W*0.04, ry+22+ri*20);
      });
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      var note = (met.key==='deg') ? '이웃 수가 가장 많은 사람'
               : (met.key==='clo') ? '모두에게 도달하는 평균 거리가 가장 짧은 사람'
               : (met.key==='bet') ? '다른 사람들의 최단 경로가 가장 자주 통과하는 사람'
               : '중요한(중심적인) 이웃을 많이 둔 사람';
      ctx.fillText(note, W*0.04, ry+22+3*20+18);
      var allTop1=METRICS44.map(function(m){return top3(m.vals)[0];});
      var uniq={}; allTop1.forEach(function(t){uniq[t]=true;});
      ctx.fillStyle= Object.keys(uniq).length>1 ? GLD : DIM;
      ctx.fillText('네 지표의 1위: '+allTop1.map(function(t){return LAB44[t];}).join(' · ')+(Object.keys(uniq).length>1?' — 서로 다릅니다!':' — 같습니다'), W*0.04, ry+22+3*20+38);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      var mn=Math.min.apply(null,met.vals), mx=Math.max.apply(null,met.vals);
      drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {
        nodeColor:function(i){ return ranks.indexOf(i)===0?GLD:(ranks.indexOf(i)>=0?GRN:BLU); },
        nodeR:function(i){ var t=(met.vals[i]-mn)/(mx-mn+1e-9); return 9+t*10; },
        highlight:[ranks[0]]
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 연결→근접→매개→위세 중심성 전환', true);
      E.big('누가 중심인가 — 네 개의 답', '「가장 중심적인 사람이 누구인가」는 질문 자체가 애매합니다 — 무엇을 「중심」이라 부르는지에 따라 답이 달라지기 때문입니다. <b>연결 중심성</b>(이웃 수), <b>근접 중심성</b>(모두에게 가까운 정도), <b>매개 중심성</b>(최단경로 위에 놓이는 정도), <b>위세 중심성</b>(중요한 이웃을 둔 정도, 거듭제곱법으로 실제 계산)을 이 협업망 13명 전원에 대해 실제로 계산해 비교하면, 네 지표의 1위가 '+allTop1.map(function(t){return LAB44[t];}).join('·')+ '로 '+(Object.keys(uniq).length>1?'서로 다릅니다':'우연히 같습니다')+' — <b>지표마다 「중심」의 정의가 다르므로 1등도 다를 수 있다</b>는 것을 실측으로 확인하는 것입니다.'); }
  },

  // ══════════ 3. 다리 역할의 힘 — 매개 중심성 ══════════
  { id:'bda44_03',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'nx.betweenness_centrality(G)[\'한\']', hl:'betweenness_centrality'},
        {t:"G2 = G.copy(); G2.remove_node('한')", hl:'remove_node'},
        {t:'nx.average_shortest_path_length(G2)', hl:'average_shortest_path_length'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'bridge_removal.py', s.step===0?0:[1,2]);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('한(10)의 연결 수 = '+DEG44[10]+' (13명 중 최소권)', W*0.04, ry);
      ctx.fillStyle=ROSE; ctx.fillText('한(10)의 매개 중심성 = '+BETC44[10].toFixed(3)+' (13명 중 최고 근처)', W*0.04, ry+20);
      ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('연결은 적어도, A모임↔B모임을 잇는 유일한 지름길에 서 있기 때문입니다', W*0.04, ry+42);

      var ry2=ry+68;
      if(s.step===0){
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=GRN;
        ctx.fillText('정 →(한을 거쳐)→ 강 : 최단 거리 = '+PATH_4_5_BEFORE+'칸', W*0.04, ry2);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('경로: '+PATH_BEFORE.map(function(i){return LAB44[i];}).join(' → '), W*0.04, ry2+20);
        ctx.fillText('네트워크 전체 평균 최단경로 = '+AVGPATH_FULL.toFixed(3)+'칸', W*0.04, ry2+42);
      } else {
        ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillStyle=RED;
        ctx.fillText('한 제거 후, 정 → 강 : 최단 거리 = '+PATH_4_5_AFTER+'칸 (긴 우회로만 남음)', W*0.04, ry2);
        ctx.font='11.5px sans-serif'; ctx.fillStyle=DIM;
        ctx.fillText('경로: '+PATH_AFTER.map(function(i){return LAB44[i];}).join(' → '), W*0.04, ry2+20);
        ctx.fillStyle=(AVGPATH_NO10>AVGPATH_FULL)?RED:GRN;
        ctx.fillText('전체 평균 최단경로 = '+AVGPATH_NO10.toFixed(3)+'칸 ('+(AVGPATH_NO10>AVGPATH_FULL?'+':'')+(AVGPATH_NO10-AVGPATH_FULL).toFixed(3)+' 증가)', W*0.04, ry2+42);
      }

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      if(s.step===0){
        drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {
          nodeColor:function(i){ return i===10?RED:BLU; },
          nodeR:function(i){ return i===10?15:11; },
          highlight:[10],
          pathEdges:PATH_BEFORE.slice(0,-1).map(function(v,i2){ return [v,PATH_BEFORE[i2+1]]; })
        });
      } else {
        drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {
          edges:EDGES_NO10,
          nodeColor:function(i){ return i===10?'rgba(240,136,138,0.15)':BLU; },
          nodeR:function(i){ return i===10?7:11; },
          pathEdges:PATH_AFTER.slice(0,-1).map(function(v,i2){ return [v,PATH_AFTER[i2+1]]; })
        });
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다리(한) 제거 전후 비교', true);
      E.big('다리 역할의 힘 — 매개 중심성', '한(10)은 연결 수(연결 중심성)가 13명 중 가장 적은 축(2명)입니다. 그런데도 <b>매개 중심성</b>(최단 경로를 실제로 모두 탐색해 각 노드가 몇 번이나 지나가는지 센 값)은 '+BETC44[10].toFixed(3)+'로 매우 높습니다 — A모임과 B모임을 잇는 <b>유일한 지름길</b>이기 때문입니다. 실제로 정(4)에서 강(5)까지 최단 거리는 한을 거쳐 '+PATH_4_5_BEFORE+'칸이지만, 한을 네트워크에서 <b>제거</b>하면 남은 유일한 우회로(오→신)를 타고 돌아가야 해 '+PATH_4_5_AFTER+'칸으로 늘어납니다. 네트워크 전체의 <b>평균 최단경로</b>도 '+AVGPATH_FULL.toFixed(3)+'칸에서 '+AVGPATH_NO10.toFixed(3)+'칸으로 실제로 늘어납니다 — 연결이 적어도 「다리」 자리에 있는 노드 하나가 전체 네트워크의 효율을 좌우한다는 것이 숫자로 드러납니다.'); }
  },

  // ══════════ 4. 무리를 찾다 — 커뮤니티 탐지 ══════════
  { id:'bda44_04',
    enter:function(E){ this.s={p:1}; E.setOn([]); },
    tap:function(E){ this.s.p=(this.s.p+1)%PART44.length; E.blip(360+this.s.p*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cur=PART44[s.p];
      var code=[
        {t:'from networkx.algorithms.community import modularity', hl:'modularity'},
        {t:'modularity(G, [community0, community1, ...])', hl:'community0'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'community_modularity.py', 1);
      var ry=codeBot+22;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle= cur===BEST_PART44 ? GRN : GLD;
      ctx.fillText('분할안: '+cur.name+'  →  모듈성 Q = '+cur.Q.toFixed(4), W*0.04, ry);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+30, bh=100, bw=(bx1-bx0)/PART44.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('분할안별 모듈성 Q (탭으로 전환)', bx0, by0-8);
      var maxQ=Math.max.apply(null,PART44.map(function(p){return Math.abs(p.Q);}));
      PART44.forEach(function(p,pi){
        var xk=bx0+pi*bw;
        var hh=Math.max(2,(Math.abs(p.Q)/maxQ)*(bh-18)); // 최댓값 막대 라벨이 위 제목과 안 겹치게 여유
        var col= p===BEST_PART44 ? GRN : (p===cur?GLD:DIM);
        ctx.fillStyle=col; ctx.fillRect(xk+bw*0.15, by0+bh-hh, bw*0.7, hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=col; ctx.textAlign='center';
        ctx.fillText('Q='+p.Q.toFixed(2), xk+bw/2, by0+bh-hh-6);
        if(p===cur){ ctx.strokeStyle=RED; ctx.lineWidth=1.5; ctx.strokeRect(xk+1, by0-2, bw-2, bh+6); }
      });
      ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=DIM;
      PART44.forEach(function(p,pi){ ctx.fillText((pi+1)+'.'+p.name, bx0, by0+bh+18+pi*14); });
      ctx.fillStyle=GRN; ctx.fillText('★최고: '+BEST_PART44.name+' (Q='+BEST_PART44.Q.toFixed(4)+')', bx0, by0+bh+18+PART44.length*14+4);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      var colset=[BLU,GRN,PUR];
      drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {
        nodeColor:function(i){ return colset[cur.comm[i]%colset.length]; }
      });

      E.tapHint(W/2, H*0.95, '화면 탭 = 분할안 전환, 모듈성이 실제로 다시 계산됩니다', true);
      E.big('무리를 찾다 — 커뮤니티 탐지', '좋은 커뮤니티 분할은 「그룹 안은 촘촘하고 그룹 사이는 성긴」 구조입니다. 이를 숫자로 재는 것이 <b>모듈성(modularity) Q</b>입니다 — 각 분할안에 대해 「그룹 안의 실제 엣지 수」와 「무작위로 연결했다면 기대되는 엣지 수」의 차이를 실제로 계산해 합산합니다. 네 가지 분할안(무작위 절반·한을 A쪽에 포함·한을 B쪽에 포함·다리를 독립 그룹으로)의 모듈성을 전부 실제로 계산해 비교하면, <b>「'+BEST_PART44.name+'」</b>가 Q='+BEST_PART44.Q.toFixed(4)+'로 가장 높습니다 — 겉보기 후보들 중에서 실제로 가장 「안은 촘촘 밖은 성긴」 분할을 데이터가 스스로 골라낸 것입니다.'); }
  },

  // ══════════ 5. 네트워크의 성격 ══════════
  { id:'bda44_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'nx.density(G)', hl:'density'},
        {t:'nx.average_clustering(G)', hl:'average_clustering'},
        {t:'nx.average_shortest_path_length(G)', hl:'average_shortest_path_length'}
      ];
      var codeBot=codePanel(E, W*0.04, 12, W*0.43, code, 'network_profile.py', [0,1,2]);
      var ry=codeBot+20;
      ctx.textAlign='left'; ctx.font='12px ui-monospace,Menlo,monospace';
      ctx.fillStyle=GLD; ctx.fillText('밀도 = '+DENSITY44.toFixed(3)+' (가능한 관계 중 '+(DENSITY44*100).toFixed(1)+'%만 실제 연결)', W*0.04, ry);
      ctx.fillStyle=GRN; ctx.fillText('평균 군집 계수 = '+CLUST44.toFixed(3)+' (이웃끼리도 서로 아는 정도)', W*0.04, ry+20);
      ctx.fillStyle=BLU; ctx.fillText('평균 최단경로 = '+AVGPATH_FULL.toFixed(3)+'칸 (13명 사이 평균 몇 다리)', W*0.04, ry+40);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('무작위로 같은 밀도로 연결했다면 평균 경로 ≈ ln(N)/ln(평균연결수)', W*0.04, ry+62);
      ctx.fillText('= '+RAND_PATH44.toFixed(2)+'칸 — 실측과 비슷한 수준의 「좁은 세상」', W*0.04, ry+79);

      var bx0=W*0.04, bx1=W*0.44, by0=ry+108, bh=90, bw=(bx1-bx0)/DEGVALS44.length;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx0,by0+bh); ctx.lineTo(bx1,by0+bh); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='left'; ctx.fillText('연결 수 분포(치우침 = 허브 존재의 씨앗)', bx0, by0-8);
      var maxCnt=Math.max.apply(null,DEGVALS44.map(function(d){return DEGHIST44[d];}));
      DEGVALS44.forEach(function(d,di){
        var xk=bx0+di*bw, hh=(DEGHIST44[d]/maxCnt)*bh;
        ctx.fillStyle= d===Math.max.apply(null,DEGVALS44) ? GLD : BLU;
        ctx.fillRect(xk+bw*0.2, by0+bh-hh, bw*0.6, hh);
        ctx.font='11px sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='center';
        ctx.fillText('연결'+d+'명 ×'+DEGHIST44[d], xk+bw/2, by0+bh+14);
      });
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.textAlign='left';
      ctx.fillText('최고 연결수('+Math.max.apply(null,DEGVALS44)+')는 최저('+Math.min.apply(null,DEGVALS44)+')의 '+(Math.max.apply(null,DEGVALS44)/Math.min.apply(null,DEGVALS44)).toFixed(1)+'배 — 13명 규모에서도 이미 균등하지 않습니다', bx0, by0+bh+34);

      var px0=W*0.49, px1=W*0.965, pTop=H*0.06, pBot=H*0.90;
      var maxDeg=Math.max.apply(null,DEG44), minDeg=Math.min.apply(null,DEG44);
      drawNetwork44(ctx, px0, pTop, px1-px0, pBot-pTop, {
        nodeColor:function(i){ return DEG44[i]===maxDeg?GLD:BLU; },
        nodeR:function(i){ var t=(DEG44[i]-minDeg)/(maxDeg-minDeg+1e-9); return 9+t*9; }
      });

      E.big('네트워크의 성격', '이 협업망의 <b>밀도</b>는 '+DENSITY44.toFixed(3)+'(가능한 관계 중 '+(DENSITY44*100).toFixed(1)+'%만 실제 연결), <b>군집 계수</b>(내 이웃끼리도 서로 아는 정도의 평균)는 '+CLUST44.toFixed(3)+', <b>평균 최단경로</b>는 '+AVGPATH_FULL.toFixed(3)+'칸입니다. 무작위로 같은 밀도의 그래프를 만들었을 때 기대되는 평균 경로(ln N/ln 평균연결수 ≈ '+RAND_PATH44.toFixed(2)+'칸)와 비슷한 수준으로 짧다는 것이 <b>좁은 세상(small world)</b> 현상의 실측 증거입니다. 연결 수 분포를 보면 최고('+Math.max.apply(null,DEG44)+'명)가 최저('+Math.min.apply(null,DEG44)+'명)의 '+(Math.max.apply(null,DEG44)/Math.min.apply(null,DEG44)).toFixed(1)+'배로, 13명 규모의 작은 망에서도 이미 균등하지 않습니다 — 실제 대규모 네트워크(친구관계·웹링크)에서는 이 치우침이 훨씬 극단으로 커져 소수의 <b>허브</b>가 전체 연결의 상당수를 떠받치는 구조가 됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
