/* 알고리즘 제5장 트리 — 5.1 이진트리·순회 · 5.2 BST · 5.3 힙
   동작(behavior)만. 텍스트는 content/algo5.json. AV 사용.
   트리는 완전이진트리 배열 인덱싱: 노드 i의 자식 = 2i+1, 2i+2 */
(function(){
  var TAU=Math.PI*2;
  // arr: 값 배열(null=빈 자리). hl(i)→{fill,stroke,text} | null
  function drawTree(E, arr, hl, opts){ opts=opts||{}; var ctx=E.ctx, top=opts.top||E.H*0.30, levelGap=opts.lg||E.H*0.13,
      W=E.W, r=opts.r||22, left=opts.left||W*0.12, right=opts.right||W*0.88;
    function pos(i){ var L=Math.floor(Math.log2(i+1)), cnt=Math.pow(2,L), pil=i-(cnt-1);
      var x=left+(right-left)*((pil+0.5)/cnt), y=top+L*levelGap; return [x,y]; }
    // 간선 먼저
    for(var i=0;i<arr.length;i++){ if(arr[i]==null) continue; var p=pos(i);
      [2*i+1,2*i+2].forEach(function(c){ if(c<arr.length && arr[c]!=null){ var cp=pos(c);
        ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(cp[0],cp[1]); ctx.stroke(); } }); }
    // 노드
    for(var j=0;j<arr.length;j++){ if(arr[j]==null) continue; var q=pos(j), h=hl&&hl(j);
      AV.node(E, q[0], q[1], arr[j], { r:r, fill:h&&h.fill?h.fill:'rgba(122,184,255,0.18)', stroke:h&&h.stroke?h.stroke:'#7ab8ff', text:h&&h.text?h.text:'#dfeefb', tag:h&&h.tag, fs:16 }); }
    return pos;
  }

  var BST=[8,3,10,1,6,null,14]; // 중위순회 = 1,3,6,8,10,14 (정렬)

  var scenes=[

  // ══════════ 5.1 이진 트리 ══════════
  { id:'algo5_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTree(E, BST, function(i){ if(i===0) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'루트'};
        if(i===3||i===4||i===6) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'리프'}; return null; });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('각 노드는 자식이 최대 2개', E.W*0.62, E.H*0.62);
      E.big('이진 트리 (Binary Tree)', '계층 구조 — 맨 위 루트, 아래로 가지치며, 끝은 리프(자식 없음). 각 노드 자식 최대 2개. 깊이 = 층 수'); }
  },

  // ══════════ 5.1 트리 순회 (중위) ══════════
  { id:'algo5_02',
    enter:function(E){ this.s={order:[],done:false};
      // 중위순회 순서 계산
      var seq=[]; (function go(i){ if(i>=BST.length||BST[i]==null) return; go(2*i+1); seq.push(i); go(2*i+2); })(0);
      this.seq=seq; this.s.step=0; E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.step>=this.seq.length){ s.step=0; E.blip(340,0.12); } else { s.step++; E.blip(500+s.step*40,0.1); } },
    draw:function(E){ var s=this.s, ctx=E.ctx, self=this, visited=this.seq.slice(0,s.step);
      drawTree(E, BST, function(i){ var k=visited.indexOf(i);
        if(k===visited.length-1 && k>=0) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a'};
        if(k>=0) return {fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5'}; return null; });
      ctx.fillStyle='#8fe3b5'; ctx.font='600 20px sans-serif'; ctx.textAlign='center';
      ctx.fillText(visited.map(function(i){return BST[i];}).join('  →  ')||'(시작)', E.W/2, E.H*0.66);
      E.tapHint(E.W/2, E.H*0.72, s.step>=this.seq.length?'↻ 다시':'▶ 다음 방문 (중위순회)', true);
      E.big('중위순회 (In-order)', '왼쪽 → 자신 → 오른쪽 순서로 방문. BST에선 결과가 정렬된 순서! (1,3,6,8,10,14)'); }
  },

  // ══════════ 5.2 이진 탐색 트리 (BST) ══════════
  { id:'algo5_03',
    enter:function(E){ this.s={t:6}; this.targets=[1,6,10,14]; E.setOn([]);
      E.controls('<div class="ctrl"><label>찾는 값</label><input type="range" id="tt" min="0" max="3" step="1" value="1"><output id="tto">6</output></div>');
      var self=this; E.bind('#tt','input',function(e){ self.s.t=self.targets[+e.target.value]; document.getElementById('tto').textContent=self.s.t; E.blip(440,0.1); }); },
    draw:function(E){ var s=this.s, ctx=E.ctx, path=[], i=0;
      while(i<BST.length && BST[i]!=null){ path.push(i); if(BST[i]===s.t) break; i = s.t<BST[i] ? 2*i+1 : 2*i+2; }
      drawTree(E, BST, function(k){ var onPath=path.indexOf(k)>=0, isTarget=(BST[k]===s.t);
        if(isTarget&&onPath) return {fill:'rgba(143,227,181,0.35)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'찾음'};
        if(onPath) return {fill:'rgba(255,178,122,0.28)',stroke:'#ffb27a',text:'#ffb27a'}; return null; });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('규칙: 왼쪽 자식 < 부모 < 오른쪽 자식', E.W/2, E.H*0.64);
      E.big('BST 탐색: '+s.t+' ('+path.length+'단계)', '이진 탐색 트리 — 왼쪽<부모<오른쪽 규칙. 한 번 비교로 절반을 버려요 = 트리로 만든 이분 탐색(O(log n))'); }
  },

  // ══════════ 5.3 힙 ══════════
  { id:'algo5_04',
    enter:function(E){ this.heap=[42,28,35,12,18,9,30]; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, H=this.heap;
      drawTree(E, H, function(i){ if(i===0) return {fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'최대=루트'}; return null; }, {top:E.H*0.28,lg:E.H*0.12});
      // 배열 표현
      AV.arr(E, H, { y:E.H*0.66, bw:44, idx:true, hl:function(i){ return i===0?{fill:'rgba(255,178,122,0.25)',stroke:'#ffb27a',text:'#ffb27a'}:null; } });
      ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('배열로 저장: 노드 i의 자식 = 2i+1, 2i+2', E.W/2, E.H*0.62);
      E.big('힙 (Heap) — 부모 ≥ 자식', '완전이진트리 + 부모가 자식보다 큼(최대 힙). 최댓값이 항상 루트 → 우선순위 큐를 O(log n)으로!'); }
  },

  // ══════════ 5.3 균형의 중요성 ══════════
  { id:'algo5_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      // 균형 트리 (왼쪽)
      drawTree(E, [4,2,6,1,3,5,7], function(){ return {fill:'rgba(143,227,181,0.2)',stroke:'#8fe3b5',text:'#8fe3b5'}; }, {top:E.H*0.30,lg:E.H*0.12,left:E.W*0.04,right:E.W*0.48,r:18});
      // 편향 트리 (오른쪽) — 일렬
      drawTree(E, [1,null,2,null,null,null,3,null,null,null,null,null,null,null,4], function(){ return {fill:'rgba(244,160,192,0.2)',stroke:'#f4a0c0',text:'#f4a0c0'}; }, {top:E.H*0.30,lg:E.H*0.11,left:E.W*0.52,right:E.W*0.96,r:18});
      ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#8fe3b5'; ctx.fillText('균형 트리 → 깊이 log n → O(log n)', E.W*0.26, E.H*0.74);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('편향 트리 → 깊이 n → O(n) ✗', E.W*0.74, E.H*0.74);
      E.big('균형이 전부다', 'BST도 한쪽으로 치우치면 연결 리스트처럼 O(n)이 돼요. AVL·레드블랙 트리가 자동으로 균형을 맞춰 O(log n) 보장'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
