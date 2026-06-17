/* 알고리즘 제6장 그래프 — VIZ 포맷
   소개·표현=concept, BFS·DFS·다익스트라=코드+스텝. 텍스트는 content/algo6.json. */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0', DIM='#6f6e7a';
  var POS=[[0.5,0.16],[0.28,0.42],[0.72,0.42],[0.16,0.74],[0.5,0.70],[0.84,0.74]];
  var NAME=['A','B','C','D','E','F'];
  var ADJ=[[1,2],[0,3,4],[0,4,5],[1],[1,2,5],[2,4]];
  var EDGES=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[4,5]];
  var WT={ '0-1':4,'0-2':2,'1-3':5,'1-4':1,'2-4':8,'2-5':3,'4-5':6 };
  function wt(a,b){ return WT[Math.min(a,b)+'-'+Math.max(a,b)]; }
  function px(E,i){ return [E.W*0.16 + POS[i][0]*E.W*0.68, E.H*0.16 + POS[i][1]*E.H*0.50]; }

  function drawGraph(E, opts){ opts=opts||{}; var ctx=E.ctx;
    EDGES.forEach(function(e){ var a=px(E,e[0]), b=px(E,e[1]); var eh=opts.edgeHl&&opts.edgeHl(e[0],e[1]);
      ctx.strokeStyle=eh||'rgba(255,255,255,0.20)'; ctx.lineWidth=eh?4:2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
      if(opts.weights){ ctx.fillStyle='#8a8893'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(wt(e[0],e[1]), (a[0]+b[0])/2, (a[1]+b[1])/2-5); } });
    for(var i=0;i<POS.length;i++){ var p=px(E,i), h=opts.hl&&opts.hl(i);
      AV.node(E, p[0], p[1], opts.labelOf?opts.labelOf(i):NAME[i], { r:opts.r||23, fill:h&&h.fill?h.fill:'rgba(122,184,255,0.18)', stroke:h&&h.stroke?h.stroke:'#7ab8ff', text:h&&h.text?h.text:'#dfeefb', tag:h&&h.tag, fs:15 }); }
  }
  // 색(W/G/B) 기반 정점 강조
  function ghl(f,i){ if(i===f.cur) return {fill:'rgba(255,178,122,0.34)',stroke:ORA,text:ORA,tag:f.curTag||'처리중'};
    var c=f.col&&f.col[i]; if(c==='B') return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN};
    if(c==='G') return {fill:'rgba(122,184,255,0.30)',stroke:BLU,text:'#bfe0ff',tag:'발견'};
    if(f.done&&f.done[i]) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN};
    return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.18)',text:DIM}; }

  var scenes=[

  // ══════════ 6.1 그래프란 (concept) ══════════
  { id:'algo6_01', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawGraph(E, {});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('● 정점(vertex)   —   선 = 간선(edge)', E.W/2, E.H*0.82); }
  },

  // ══════════ 6.1 그래프 표현 (concept, 인터랙티브) ══════════
  { id:'algo6_02', concept:true,
    enter:function(E){ this.s={sel:0}; E.setOn([]);
      E.controls('<div class="ctrl"><label>정점 선택</label><input type="range" id="ss" min="0" max="5" step="1" value="0"><output id="sso">A</output></div>');
      var self=this; E.bind('#ss','input',function(e){ self.s.sel=+e.target.value; document.getElementById('sso').textContent=NAME[self.s.sel]; E.blip(440,0.1); }); },
    draw:function(E){ var s=this.s, ctx=E.ctx;
      drawGraph(E, { r:20, hl:function(i){ if(i===s.sel) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA};
        if(ADJ[s.sel].indexOf(i)>=0) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN}; return null; },
        edgeHl:function(a,b){ if(a===s.sel||b===s.sel) return GRN; return null; } });
      ctx.fillStyle=ORA; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('인접 리스트  '+NAME[s.sel]+' → ['+ADJ[s.sel].map(function(i){return NAME[i];}).join(', ')+']', E.W/2, E.H*0.82); }
  },

  // ══════════ 6.2 BFS — 너비 우선 탐색 (코드+스텝) ══════════
  { id:'algo6_03',
    input:'그래프: 정점 A~F, 간선 7개 ·  출발 = A',
    code:[
      'BFS(G, s) {',
      '  for each u in V: u.color = WHITE   // 미발견',
      '  s.color = GRAY; s.d = 0; ENQUEUE(Q, s)',
      '  while (Q ≠ ∅) {',
      '    u = DEQUEUE(Q)',
      '    for each v in Adj[u]:',
      '      if (v.color == WHITE) {',
      '        v.color = GRAY; v.d = u.d + 1',
      '        ENQUEUE(Q, v)',
      '      }',
      '    u.color = BLACK   // 방문 완료',
      '  }',
      '}'
    ],
    build:function(V){ var n=6, col=[], d=[], Q=[], st=[], cur=-1;
      for(var i=0;i<n;i++){ col.push('W'); d.push(null); }
      function snap(line,cap,ex){ st.push({line:line,cap:cap,col:col.slice(),d:d.slice(),q:Q.slice(),cur:cur,ex:ex||null}); }
      snap(1,'모든 정점을 <b>WHITE</b>(미발견)로 초기화합니다.');
      col[0]='G'; d[0]=0; Q.push(0); cur=0;
      snap(2,'출발점 <b>A</b> 를 GRAY(발견)·거리 0 으로, 큐에 넣습니다.');
      cur=-1;
      while(Q.length){
        var u=Q.shift(); cur=u;
        snap(4,'큐에서 <b>'+NAME[u]+'</b> 를 꺼내(DEQUEUE) 이웃을 살핍니다.');
        ADJ[u].forEach(function(v){
          snap(6,'이웃 <b>'+NAME[v]+'</b> 검사 — 아직 WHITE 인가?',[u,v]);
          if(col[v]==='W'){ col[v]='G'; d[v]=d[u]+1; Q.push(v);
            snap(8,'<b>'+NAME[v]+'</b> 처음 발견! GRAY·거리 '+d[v]+'(=A에서 '+d[v]+'칸), 큐에 추가.',[u,v]); }
        });
        col[u]='B';
        snap(10,'<b>'+NAME[u]+'</b> 의 이웃을 다 봄 → BLACK(완료).');
      }
      cur=-1; snap(12,'<b>완료!</b> 각 정점의 거리 = A에서 최소 간선 수. 큐로 가까운 곳부터 = O(V+E).');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('BFS — 출발 A에서 가까운 정점부터 너비로 (최단 간선 수)', V.W/2, V.H*0.085);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('회색=미발견 · 파랑=발견(큐 대기) · 초록=완료 · 주황=처리 중 · 라벨 뒤 숫자=A에서 거리', V.W/2, V.H*0.105);
      drawGraph(V, { r:23, labelOf:function(i){ return NAME[i]+(f.d[i]!=null?':'+f.d[i]:''); },
        hl:function(i){ return ghl(f,i); },
        edgeHl:function(a,b){ if(f.ex&&((a===f.ex[0]&&b===f.ex[1])||(a===f.ex[1]&&b===f.ex[0]))) return ORA; return null; } });
      ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=BLU; ctx.fillText('큐 (Queue, FIFO): ['+f.q.map(function(i){return NAME[i];}).join(', ')+']', V.W/2, V.H*0.84); }
  },

  // ══════════ 6.2 DFS — 깊이 우선 탐색 (코드+스텝, 발견/종료 시간) ══════════
  { id:'algo6_04',
    input:'그래프: 정점 A~F, 간선 7개 ·  시작 = A',
    code:[
      'DFS(G) {',
      '  for each u in V: u.color = WHITE; time = 0',
      '  for each u in V:',
      '    if (u.color == WHITE) DFS-VISIT(G, u)',
      '}',
      'DFS-VISIT(G, u) {',
      '  time = time+1; u.d = time   // 발견 시간',
      '  u.color = GRAY',
      '  for each v in Adj[u]:',
      '    if (v.color == WHITE) DFS-VISIT(G, v)',
      '  u.color = BLACK',
      '  time = time+1; u.f = time   // 종료 시간',
      '}'
    ],
    build:function(V){ var n=6, col=[], d=[], fin=[], st=[], time=0, cur=-1, stack=[];
      for(var i=0;i<n;i++){ col.push('W'); d.push(null); fin.push(null); }
      function snap(line,cap,ex,tag){ st.push({line:line,cap:cap,col:col.slice(),d:d.slice(),fin:fin.slice(),cur:cur,ex:ex||null,curTag:tag,stack:stack.slice()}); }
      snap(1,'모든 정점 WHITE, 시간 0 으로 초기화.');
      function visit(u){ cur=u; stack.push(u); time++; d[u]=time; col[u]='G';
        snap(6,'<b>'+NAME[u]+'</b> 진입 — 발견시간 '+d[u]+', GRAY 로.',null,'진입 d='+d[u]);
        ADJ[u].forEach(function(v){ cur=u;
          snap(8,NAME[u]+' 의 이웃 <b>'+NAME[v]+'</b> 검사 — WHITE 면 더 깊이 파고듭니다.',[u,v]);
          if(col[v]==='W') visit(v);
        });
        col[u]='B'; time++; fin[u]=time; cur=u;
        snap(10,'<b>'+NAME[u]+'</b> 의 모든 이웃 처리 끝 → BLACK, 종료시간 '+fin[u]+'. 되돌아갑니다.',null,'종료 f='+fin[u]);
        stack.pop();
      }
      visit(0);
      cur=-1; snap(12,'<b>완료!</b> 한 길 끝까지 파고든 뒤 되돌아옴. 발견/종료 시간으로 간선 분류·위상정렬·SCC가 가능 = O(V+E).');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('DFS — 한 길을 끝까지 깊이 판 뒤 되돌아오기', V.W/2, V.H*0.085);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('회색=미발견 · 파랑=발견 · 초록=완료 · 주황=처리 중', V.W/2, V.H*0.105);
      drawGraph(V, { r:23, labelOf:function(i){ return NAME[i]+(f.d[i]!=null?' '+f.d[i]+'/'+(f.fin[i]!=null?f.fin[i]:'·'):''); },
        hl:function(i){ return ghl(f,i); },
        edgeHl:function(a,b){ if(f.ex&&((a===f.ex[0]&&b===f.ex[1])||(a===f.ex[1]&&b===f.ex[0]))) return ORA; return null; } });
      ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=PNK; ctx.fillText('재귀 스택(현재 경로): ['+f.stack.map(function(i){return NAME[i];}).join(' → ')+']', V.W/2, V.H*0.84);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('정점 라벨 = 발견시간 / 종료시간', V.W/2, V.H*0.885); }
  },

  // ══════════ 6.3 다익스트라 — 최단 경로 (코드+스텝) ══════════
  { id:'algo6_05',
    input:'가중 그래프: 정점 A~F, 간선 가중치 ·  출발 = A',
    code:[
      'DIJKSTRA(G, w, s) {',
      '  INITIALIZE: s.d = 0, 나머지 = ∞',
      '  S = ∅;  Q = 모든 정점',
      '  while (Q ≠ ∅) {',
      '    u = EXTRACT-MIN(Q)   // 가장 가까운 미확정',
      '    S = S ∪ {u}          // u 거리 확정',
      '    for each v in Adj[u]:',
      '      RELAX(u, v, w):',
      '        if (v.d > u.d + w(u,v))',
      '          v.d = u.d + w(u,v)   // 완화',
      '  }',
      '}'
    ],
    build:function(V){ var n=6, dist=[0,Infinity,Infinity,Infinity,Infinity,Infinity], done={}, st=[], cur=-1;
      function L(x){ return x===Infinity?'∞':x; }
      function snap(line,cap,ex){ st.push({line:line,cap:cap,dist:dist.slice(),done:Object.assign({},done),cur:cur,ex:ex||null}); }
      snap(1,'출발 <b>A</b> 거리 0, 나머지 모두 <b>∞</b> 로 초기화.');
      for(var it=0;it<n;it++){
        var u=-1,best=Infinity; for(var i=0;i<n;i++) if(!done[i]&&dist[i]<best){best=dist[i];u=i;}
        if(u<0) break; cur=u;
        snap(4,'미확정 중 가장 가까운 <b>'+NAME[u]+'</b>(거리 '+L(dist[u])+') 를 꺼냄(EXTRACT-MIN).');
        done[u]=true;
        snap(5,'<b>'+NAME[u]+'</b> 의 최단거리 '+dist[u]+' <b>확정</b>. 이제 이웃을 완화합니다.');
        ADJ[u].forEach(function(v){ if(done[v]) return; var nd=dist[u]+wt(u,v);
          snap(8,'간선 '+NAME[u]+'→'+NAME[v]+'(w='+wt(u,v)+') 완화: '+dist[u]+'+'+wt(u,v)+'='+nd+' < 현재 '+L(dist[v])+' ?',[u,v]);
          if(nd<dist[v]){ dist[v]=nd; snap(9,'더 짧음! <b>'+NAME[v]+'</b> 거리를 <b>'+nd+'</b> 로 갱신.',[u,v]); }
        });
      }
      cur=-1; snap(11,'<b>완료!</b> A에서 모든 정점까지 최단거리. 우선순위 큐(힙)로 O(E log V).');
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('다익스트라 — A에서 모든 정점까지 최단 거리', V.W/2, V.H*0.085);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('매번 가장 가까운 미확정 정점을 확정하고 이웃 거리를 줄여나갑니다.', V.W/2, V.H*0.105);
      drawGraph(V, { weights:true, r:24,
        labelOf:function(i){ return NAME[i]+':'+(f.dist[i]===Infinity?'∞':f.dist[i]); },
        hl:function(i){ if(i===f.cur) return {fill:'rgba(255,178,122,0.34)',stroke:ORA,text:ORA,tag:'확정중'};
          if(f.done[i]) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN}; return null; },
        edgeHl:function(a,b){ if(f.ex&&((a===f.ex[0]&&b===f.ex[1])||(a===f.ex[1]&&b===f.ex[0]))) return ORA; return null; } });
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('정점 라벨 = A로부터 현재 최단거리, 간선 숫자 = 가중치', V.W/2, V.H*0.86); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
