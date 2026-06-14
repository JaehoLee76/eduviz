/* 알고리즘 제6장 그래프 — 6.1 표현 · 6.2 BFS·DFS · 6.3 최단경로
   동작(behavior)만. 텍스트는 content/algo6.json. AV 사용. */
(function(){
  var TAU=Math.PI*2;
  // 그래프: 정점 위치(0~1) + 인접 리스트
  var POS=[[0.5,0.16],[0.28,0.42],[0.72,0.42],[0.16,0.70],[0.5,0.66],[0.84,0.70]];
  var NAME=['A','B','C','D','E','F'];
  var ADJ=[[1,2],[0,3,4],[0,4,5],[1],[1,2,5],[2,4]];
  var EDGES=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[4,5]];
  var WT={ '0-1':4,'0-2':2,'1-3':5,'1-4':1,'2-4':8,'2-5':3,'4-5':6 };

  function px(E,i){ return [E.W*0.18 + POS[i][0]*E.W*0.64, E.H*0.14 + POS[i][1]*E.H*0.52]; }
  function drawGraph(E, opts){ opts=opts||{}; var ctx=E.ctx;
    EDGES.forEach(function(e){ var a=px(E,e[0]), b=px(E,e[1]); var eh=opts.edgeHl&&opts.edgeHl(e[0],e[1]);
      ctx.strokeStyle=eh||'rgba(255,255,255,0.22)'; ctx.lineWidth=eh?3:2; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
      if(opts.weights){ var w=WT[e[0]+'-'+e[1]]; ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(w, (a[0]+b[0])/2, (a[1]+b[1])/2-4); } });
    for(var i=0;i<POS.length;i++){ var p=px(E,i), h=opts.hl&&opts.hl(i);
      AV.node(E, p[0], p[1], opts.labelOf?opts.labelOf(i):NAME[i], { r:opts.r||22, fill:h&&h.fill?h.fill:'rgba(122,184,255,0.18)', stroke:h&&h.stroke?h.stroke:'#7ab8ff', text:h&&h.text?h.text:'#dfeefb', tag:h&&h.tag }); }
  }

  var scenes=[

  // ══════════ 6.1 그래프란 ══════════
  { id:'algo6_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawGraph(E, {});
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('● 정점(vertex)   — 선 = 간선(edge)', E.W/2, E.H*0.80);
      E.big('그래프 (Graph) — 점과 선의 연결망', '정점(점)을 간선(선)으로 이은 구조. 지도·SNS 친구·인터넷·지하철 노선이 모두 그래프. 트리는 그래프의 특수형!'); }
  },

  // ══════════ 6.1 그래프 표현 ══════════
  { id:'algo6_02',
    enter:function(E){ this.s={sel:0}; E.setOn([]);
      E.controls('<div class="ctrl"><label>정점 선택</label><input type="range" id="ss" min="0" max="5" step="1" value="0"><output id="sso">A</output></div>');
      var self=this; E.bind('#ss','input',function(e){ self.s.sel=+e.target.value; document.getElementById('sso').textContent=NAME[self.s.sel]; E.blip(440,0.1); }); },
    draw:function(E){ var s=this.s, ctx=E.ctx;
      drawGraph(E, { r:18, hl:function(i){ if(i===s.sel) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a'};
        if(ADJ[s.sel].indexOf(i)>=0) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'}; return null; },
        edgeHl:function(a,b){ if(a===s.sel||b===s.sel) return '#8fe3b5'; return null; } });
      ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('인접 리스트  '+NAME[s.sel]+' → ['+ADJ[s.sel].map(function(i){return NAME[i];}).join(', ')+']', E.W/2, E.H*0.80);
      E.big(NAME[s.sel]+'의 이웃 = '+ADJ[s.sel].length+'개', '표현법 — 인접 리스트(각 정점의 이웃 목록, 희소 그래프에 효율) vs 인접 행렬(n×n 표, 조밀 그래프·빠른 확인)'); }
  },

  // ══════════ 6.2 BFS ══════════
  { id:'algo6_03',
    enter:function(E){ this.q=[0]; this.inq={0:true}; this.visited={}; this.order=[]; this.cur=-1; E.setOn([]); },
    tap:function(E){ if(this.q.length===0){ this.enter(E); E.blip(340,0.12); return; }
      var v=this.q.shift(); this.visited[v]=true; this.order.push(v); this.cur=v;
      ADJ[v].forEach(function(nb){ if(!this.inq[nb]){ this.q.push(nb); this.inq[nb]=true; } }, this); E.blip(520,0.1); },
    draw:function(E){ var ctx=E.ctx, self=this;
      drawGraph(E, { r:20, hl:function(i){ if(i===self.cur) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'방문'};
        if(self.visited[i]) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'};
        if(self.q.indexOf(i)>=0) return {fill:'rgba(122,184,255,0.28)',stroke:'#7ab8ff',text:'#bfe0ff',tag:'대기'}; return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}; } });
      ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('큐(Queue): ['+self.q.map(function(i){return NAME[i];}).join(', ')+']', E.W/2, E.H*0.78);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('방문 순서: '+self.order.map(function(i){return NAME[i];}).join(' → '), E.W/2, E.H*0.83);
      E.tapHint(E.W/2, E.H*0.71, self.q.length?'▶ 큐에서 꺼내 방문':'↻ 다시', true);
      E.big('BFS — 너비 우선 탐색', '가까운 곳부터 물결처럼 퍼져요. 큐(2장)로 구현 — 먼저 발견한 걸 먼저 방문. 최단 경로(간선 수)에 강함'); }
  },

  // ══════════ 6.2 DFS ══════════
  { id:'algo6_04',
    enter:function(E){ this.st=[0]; this.visited={}; this.order=[]; this.cur=-1; E.setOn([]); },
    tap:function(E){ if(this.st.length===0){ this.enter(E); E.blip(340,0.12); return; }
      var v; while(this.st.length){ v=this.st.pop(); if(!this.visited[v]) break; v=null; }
      if(v==null){ E.blip(340,0.12); return; }
      this.visited[v]=true; this.order.push(v); this.cur=v;
      for(var k=ADJ[v].length-1;k>=0;k--){ var nb=ADJ[v][k]; if(!this.visited[nb]) this.st.push(nb); } E.blip(480,0.1); },
    draw:function(E){ var ctx=E.ctx, self=this;
      drawGraph(E, { r:20, hl:function(i){ if(i===self.cur) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'방문'};
        if(self.visited[i]) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'};
        if(self.st.indexOf(i)>=0) return {fill:'rgba(244,160,192,0.25)',stroke:'#f4a0c0',text:'#f4a0c0',tag:'스택'}; return {fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}; } });
      ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#f4a0c0'; ctx.fillText('스택(Stack): ['+self.st.map(function(i){return NAME[i];}).join(', ')+']', E.W/2, E.H*0.78);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('방문 순서: '+self.order.map(function(i){return NAME[i];}).join(' → '), E.W/2, E.H*0.83);
      E.tapHint(E.W/2, E.H*0.71, self.st.length?'▶ 스택에서 꺼내 방문':'↻ 다시', true);
      E.big('DFS — 깊이 우선 탐색', '한 길을 끝까지 파고든 뒤 되돌아와요. 스택/재귀(2장)로 구현. 미로 풀기·사이클 탐지·위상정렬에 강함'); }
  },

  // ══════════ 6.3 최단 경로 (다익스트라) ══════════
  { id:'algo6_05',
    enter:function(E){ this.dist=[0,Infinity,Infinity,Infinity,Infinity,Infinity]; this.done={}; this.cur=-1;
      this.steps=this.computeSteps(); this.k=0; E.setOn([]); },
    computeSteps:function(){ // 다익스트라 스냅샷들
      var dist=[0,Infinity,Infinity,Infinity,Infinity,Infinity], done={}, snaps=[];
      for(var it=0;it<6;it++){ var u=-1, best=Infinity;
        for(var i=0;i<6;i++) if(!done[i] && dist[i]<best){ best=dist[i]; u=i; }
        if(u<0) break; done[u]=true;
        ADJ[u].forEach(function(v){ var key=Math.min(u,v)+'-'+Math.max(u,v), w=WT[key]; if(dist[u]+w<dist[v]) dist[v]=dist[u]+w; });
        snaps.push({dist:dist.slice(), done:Object.assign({},done), cur:u}); }
      return snaps; },
    tap:function(E){ if(this.k>=this.steps.length){ this.enter(E); E.blip(340,0.12); return; }
      var s=this.steps[this.k]; this.dist=s.dist; this.done=s.done; this.cur=s.cur; this.k++; E.blip(500+this.k*30,0.1); },
    draw:function(E){ var ctx=E.ctx, self=this;
      drawGraph(E, { weights:true, r:22,
        labelOf:function(i){ return self.dist[i]===Infinity?NAME[i]+':∞':NAME[i]+':'+self.dist[i]; },
        hl:function(i){ if(i===self.cur) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'확정'};
          if(self.done[i]) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'}; return null; } });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('A에서 출발 — 각 정점까지 최단 거리(숫자=간선 가중치)', E.W/2, E.H*0.80);
      E.tapHint(E.W/2, E.H*0.73, self.k>=self.steps.length?'↻ 다시':'▶ 가장 가까운 미확정 정점 확정', true);
      E.big('다익스트라 — 최단 경로', '가중치 그래프에서 최단 거리! 가장 가까운 정점을 확정하며 이웃 거리를 갱신(완화). 우선순위 큐(5장 힙)로 O(E log V)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
