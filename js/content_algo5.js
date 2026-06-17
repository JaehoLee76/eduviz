/* 알고리즘 제5장 트리 — VIZ 포맷
   중위순회·BST탐색=코드+스텝, 이진트리·힙·균형=concept. 텍스트는 content/algo5.json.
   완전이진트리 배열 인덱싱: 노드 i의 자식 = 2i+1, 2i+2 */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0', DIM='#6f6e7a';
  // arr: 값 배열(null=빈자리). hl(i)→{fill,stroke,text,tag}|null
  function drawTree(E, arr, hl, opts){ opts=opts||{}; var ctx=E.ctx, top=opts.top||E.H*0.26, levelGap=opts.lg||E.H*0.18,
      W=E.W, r=opts.r||22, left=opts.left||W*0.12, right=opts.right||W*0.88, eh=opts.edgeHl;
    function pos(i){ var L=Math.floor(Math.log2(i+1)), cnt=Math.pow(2,L), pil=i-(cnt-1);
      var x=left+(right-left)*((pil+0.5)/cnt), y=top+L*levelGap; return [x,y]; }
    for(var i=0;i<arr.length;i++){ if(arr[i]==null) continue; var p=pos(i);
      [2*i+1,2*i+2].forEach(function(c){ if(c<arr.length && arr[c]!=null){ var cp=pos(c);
        var on=eh&&eh(i,c); ctx.strokeStyle=on||'rgba(255,255,255,0.22)'; ctx.lineWidth=on?4:2; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(cp[0],cp[1]); ctx.stroke(); } }); }
    for(var j=0;j<arr.length;j++){ if(arr[j]==null) continue; var q=pos(j), h=hl&&hl(j);
      AV.node(E, q[0], q[1], arr[j], { r:r, fill:h&&h.fill?h.fill:'rgba(122,184,255,0.18)', stroke:h&&h.stroke?h.stroke:'#7ab8ff', text:h&&h.text?h.text:'#dfeefb', tag:h&&h.tag, fs:16 }); }
    return pos;
  }
  var BST=[8,3,10,1,6,null,14]; // 중위순회 = 1,3,6,8,10,14

  var scenes=[

  // ══════════ 5.1 이진 트리 (concept) ══════════
  { id:'algo5_01', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTree(E, BST, function(i){ if(i===0) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'루트'};
        if(i===3||i===4||i===6) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN,tag:'리프'}; return null; });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('각 노드는 자식이 최대 2개', E.W/2, E.H*0.86); }
  },

  // ══════════ 5.1 중위순회 (코드+스텝, 재귀) ══════════
  { id:'algo5_02',
    input:'BST = [ 8, 3, 10, 1, 6, ·, 14 ]  (왼쪽 < 부모 < 오른쪽)',
    code:[
      'INORDER(x) {',
      '  if (x == NIL) return',
      '  INORDER(x.left)    // ① 왼쪽',
      '  visit(x)           // ② 자신 출력',
      '  INORDER(x.right)   // ③ 오른쪽',
      '}'
    ],
    build:function(V){ var T=BST, st=[], out=[], vidx=[];
      function snap(line,cap,cur,extra){ var f={line:line,cap:cap,cur:cur,out:out.slice(),vidx:vidx.slice(),edge:null}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); }
      function vis(i){ if(i>=T.length||T[i]==null) return; var L=2*i+1, R=2*i+2;
        if(L<T.length&&T[L]!=null){ snap(2,'노드 '+T[i]+' → 왼쪽 자식 '+T[L]+' 로 내려갑니다.', i,{edge:[i,L]}); vis(L); }
        out.push(T[i]); vidx.push(i); snap(3,'노드 <b>'+T[i]+'</b> 방문(출력). 지금까지: '+out.join(', '), i,{visit:i});
        if(R<T.length&&T[R]!=null){ snap(4,'노드 '+T[i]+' → 오른쪽 자식 '+T[R]+' 로 내려갑니다.', i,{edge:[i,R]}); vis(R); }
      }
      snap(0,'중위순회: <b>왼쪽 → 자신 → 오른쪽</b>. BST에선 결과가 정렬됩니다.', -1);
      vis(0);
      snap(0,'<b>완료!</b> 방문 순서 = '+out.join(', ')+' (오름차순 정렬!).', -1,{done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('중위순회 — 왼쪽 → 자신 → 오른쪽 순서로 방문', V.W/2, V.H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('BST를 이 순서로 돌면 방문 결과가 오름차순으로 정렬됩니다.', V.W/2, V.H*0.10+20);
      drawTree(V, BST, function(i){ if(i===f.cur) return {fill:'rgba(255,178,122,0.32)',stroke:ORA,text:ORA};
        if(f.vidx.indexOf(i)>=0) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN}; return null; },
        {edgeHl:function(a,b){ if(f.edge&&((a===f.edge[0]&&b===f.edge[1])||(a===f.edge[1]&&b===f.edge[0]))) return ORA; return null; }});
      ctx.fillStyle=GRN; ctx.font='600 19px sans-serif'; ctx.textAlign='center'; ctx.fillText(f.out.join('  →  ')||'(시작)', V.W/2, V.H*0.88); }
  },

  // ══════════ 5.2 BST 탐색 (코드+스텝, 반복) ══════════
  { id:'algo5_03',
    input:'위 BST에서  찾는 값 = 6',
    code:[
      'TREE-SEARCH(x, k) {        // x=루트',
      '  while (x != NIL && k != x.key)',
      '    if (k < x.key)',
      '      x = x.left           // 왼쪽 절반',
      '    else',
      '      x = x.right          // 오른쪽 절반',
      '  return x',
      '}'
    ],
    build:function(V){ var T=BST, k=6, i=0, path=[], st=[];
      function snap(line,cap,cur,extra){ var f={line:line,cap:cap,cur:cur,path:path.slice()}; if(extra)for(var x in extra)f[x]=extra[x]; st.push(f); }
      snap(0,'BST에서 <b>'+k+'</b> 찾기 — 루트부터 시작.', 0);
      while(i<T.length && T[i]!=null){
        path.push(i);
        snap(1,'현재 노드 <b>'+T[i]+'</b> 와 '+k+' 비교.', i);
        if(T[i]===k){ snap(6,'<b>찾음!</b> '+k+' ('+path.length+'단계). 한 비교로 절반을 버림 = O(log n).', i,{found:i}); return st; }
        if(k<T[i]){ snap(3,k+' < '+T[i]+' → <b>왼쪽</b>으로.', i); i=2*i+1; }
        else { snap(5,k+' > '+T[i]+' → <b>오른쪽</b>으로.', i); i=2*i+2; }
      }
      snap(6,'NIL 도달 — 없음.', -1,{done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('정렬된 BST에서  찾는 값 6  탐색', V.W/2, V.H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('한 번 비교마다 한쪽 가지를 통째로 버립니다 (O(log n))', V.W/2, V.H*0.10+20);
      drawTree(V, BST, function(j){ if(j===f.found) return {fill:'rgba(143,227,181,0.35)',stroke:GRN,text:GRN,tag:'찾음'};
        if(j===f.cur) return {fill:'rgba(255,178,122,0.32)',stroke:ORA,text:ORA};
        if(f.path.indexOf(j)>=0) return {fill:'rgba(255,178,122,0.18)',stroke:ORA,text:ORA}; return null; });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('규칙: 왼쪽 자식 < 부모 < 오른쪽 자식', V.W/2, V.H*0.88); }
  },

  // ══════════ 5.3 힙 (concept) ══════════
  { id:'algo5_04', concept:true,
    enter:function(E){ this.heap=[42,28,35,12,18,9,30]; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, H=this.heap;
      drawTree(E, H, function(i){ if(i===0) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'최대=루트'}; return null; }, {top:E.H*0.24,lg:E.H*0.17});
      AV.arr(E, H, { y:E.H*0.72, bw:44, idx:true, hl:function(i){ return i===0?{fill:'rgba(255,178,122,0.25)',stroke:ORA,text:ORA}:null; } });
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('배열로 저장: 노드 i의 자식 = 2i+1, 2i+2', E.W/2, E.H*0.68); }
  },

  // ══════════ 5.3 균형의 중요성 (concept) ══════════
  { id:'algo5_05', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx;
      drawTree(E, [4,2,6,1,3,5,7], function(){ return {fill:'rgba(143,227,181,0.2)',stroke:GRN,text:GRN}; }, {top:E.H*0.28,lg:E.H*0.16,left:E.W*0.04,right:E.W*0.48,r:18});
      drawTree(E, [1,null,2,null,null,null,3,null,null,null,null,null,null,null,4], function(){ return {fill:'rgba(244,160,192,0.2)',stroke:PNK,text:PNK}; }, {top:E.H*0.28,lg:E.H*0.15,left:E.W*0.52,right:E.W*0.96,r:18});
      ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=GRN; ctx.fillText('균형 → 깊이 log n → O(log n)', E.W*0.26, E.H*0.86);
      ctx.fillStyle=PNK; ctx.fillText('편향 → 깊이 n → O(n) ✗', E.W*0.74, E.H*0.86); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
