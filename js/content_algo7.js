/* 알고리즘 제7장 동적 계획법 — VIZ 포맷
   타뷸레이션·격자DP=코드+스텝, 피보나치재귀·메모·DP조건=concept. 텍스트는 content/algo7.json. */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0', DIM='#6f6e7a';
  // fib(4) 호출 트리 (concept용)
  var FT=[
    {x:.50,y:0,l:'F4'},
    {x:.30,y:1,l:'F3',p:0},{x:.74,y:1,l:'F2',p:0,dup:true},
    {x:.18,y:2,l:'F2',p:1,dup:true},{x:.42,y:2,l:'F1',p:1},{x:.66,y:2,l:'F1',p:2},{x:.84,y:2,l:'F0',p:2},
    {x:.12,y:3,l:'F1',p:3},{x:.26,y:3,l:'F0',p:3}
  ];
  function ftpos(E,nd){ return [E.W*0.10+nd.x*E.W*0.80, E.H*0.22+nd.y*E.H*0.165]; }
  // 호출 순서(DFS 전위): F4→F3→F2→F1→F0→F1→F2→F1→F0
  var DFS=[0,1,3,7,8,4,2,5,6];
  // memo 모드에서 "캐시 적중"으로 가지치기되는 노드(이미 그 F값을 계산함): 둘째 F2(idx2)와 그 자식(5,6), 둘째 F1(4)
  var CACHED={2:true,5:true,6:true,4:true};
  function childrenOf(i){ var out=[]; FT.forEach(function(nd,j){ if(nd.p===i) out.push(j); }); return out; }
  // shown = DFS 단계로 드러난 호출 수(1..9). memo=true면 캐시적중 노드는 자식 펼침 생략.
  function drawFT(E, shown, memo){ var ctx=E.ctx;
    // 어떤 노드가 보이는지: DFS 순서로 shown개. memo면 캐시 노드의 자식은 숨김.
    var vis={}; var count=0;
    for(var s=0;s<DFS.length && count<shown; s++){ var idx=DFS[s];
      // memo: 부모가 캐시적중이면 이 노드는 안 펼침
      if(memo){ var par=FT[idx].p; if(par!=null && CACHED[par]) continue; }
      vis[idx]=true; count++;
    }
    var lastIdx=null, c2=0; for(var s2=0;s2<DFS.length;s2++){ var id=DFS[s2]; if(vis[id]){ c2++; if(c2===shown) lastIdx=id; } }
    // 간선
    FT.forEach(function(nd,i){ if(nd.p!=null && vis[i] && vis[nd.p]){ var a=ftpos(E,FT[nd.p]), b=ftpos(E,nd); ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); } });
    // 노드
    FT.forEach(function(nd,i){ if(!vis[i]) return; var p=ftpos(E,nd);
      var cached=memo&&CACHED[i], dup=nd.dup, cur=(i===lastIdx);
      AV.node(E, p[0], p[1], nd.l, { r:18, fs:13,
        fill: cur?'rgba(255,178,122,0.38)':(cached?'rgba(143,227,181,0.18)':(dup?'rgba(244,160,192,0.22)':'rgba(122,184,255,0.16)')),
        stroke: cur?ORA:(cached?GRN:(dup?PNK:BLU)),
        text:'#dfeefb', tag: cur?'호출!':(cached?'캐시 적중→생략':(dup?'또 계산':null)) }); });
    return {visibleCalls:count, totalDFS:DFS.length};
  }

  var scenes=[

  // ══════════ 7.1 피보나치 순진한 재귀 (concept, 단계 펼치기) ══════════
  { id:'algo7_01', concept:true,
    enter:function(E){ this.s={shown:1}; E.setOn([]); var self=this;
      this.keys=[
        {code:'KeyE', key:'E', label:'다음 호출 펼치기', act:function(EE){ if(self.s.shown<9){ self.s.shown++; EE.blip(420+self.s.shown*30,0.1);} else EE.blip(220,0.08); }},
        {code:'KeyC', key:'C', label:'처음으로', act:function(EE){ self.s.shown=1; EE.blip(330,0.1); }} ]; },
    tap:function(E){ if(this.s.shown<9){ this.s.shown++; E.blip(420+this.s.shown*30,0.1);} else this.s.shown=1; },
    draw:function(E){ var ctx=E.ctx, s=this.s;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('피보나치를 순진하게 재귀로 — F(n)=F(n−1)+F(n−2)', E.W/2, E.H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('E(또는 클릭)로 호출을 하나씩 펼쳐 보세요. 같은 작은 문제가 또 불립니다.', E.W/2, E.H*0.09+18);
      var r=drawFT(E, s.shown, false);
      // 호출 횟수 카운터
      ctx.textAlign='center'; ctx.fillStyle=ORA; ctx.font='600 15px sans-serif';
      ctx.fillText('지금까지 호출 횟수: '+s.shown+(s.shown>=9?'  (F4 하나에 9번!)':''), E.W/2, E.H*0.86);
      ctx.fillStyle=PNK; ctx.font='12px sans-serif';
      ctx.fillText('분홍 = 같은 F2/F1/F0를 또 계산(중복). n이 커지면 호출이 φⁿ로 폭발 → 지수 시간', E.W/2, E.H*0.86+20);
      E.big('피보나치 재귀: '+s.shown+'/9 호출', '순진한 재귀는 같은 작은 문제를 수없이 다시 푼다(중복 부분문제). 호출 트리가 지수로 커진다 → 이걸 저장으로 없애는 게 메모이제이션·DP.'); }
  },

  // ══════════ 7.1 메모이제이션 (concept, 캐시로 가지치기) ══════════
  { id:'algo7_02', concept:true,
    enter:function(E){ this.s={shown:1}; E.setOn([]); var self=this;
      this.keys=[
        {code:'KeyE', key:'E', label:'다음 호출 펼치기', act:function(EE){ if(self.s.shown<9){ self.s.shown++; EE.blip(420+self.s.shown*30,0.1);} else EE.blip(220,0.08); }},
        {code:'KeyC', key:'C', label:'처음으로', act:function(EE){ self.s.shown=1; EE.blip(330,0.1); }} ]; },
    tap:function(E){ if(this.s.shown<9){ this.s.shown++; E.blip(420+this.s.shown*30,0.1);} else this.s.shown=1; },
    draw:function(E){ var ctx=E.ctx, s=this.s;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('메모이제이션 — 한 번 푼 답은 저장해 두고 꺼내 쓰기', E.W/2, E.H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('E(또는 클릭)로 펼치면, 이미 계산한 F는 "캐시 적중"으로 가지를 통째로 건너뜁니다.', E.W/2, E.H*0.09+18);
      var r=drawFT(E, s.shown, true);
      ctx.textAlign='center'; ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
      ctx.fillText('실제 계산한 호출: '+r.visibleCalls+'개  (재귀는 5번이면 끝 → O(n))', E.W/2, E.H*0.86);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('초록 = 저장값 재사용(가지 제거). 지수(9+) → 선형(5)으로 줄었습니다', E.W/2, E.H*0.86+20);
      E.big('메모이제이션: 캐시로 가지치기', '겹치는 부분문제를 저장하면 같은 호출을 두 번 안 한다 → 지수 시간이 선형으로. 위→아래 저장이 메모이제이션, 아래→위 표 채우기가 타뷸레이션(다음 화면).'); }
  },

  // ══════════ 7.1 타뷸레이션 (코드+스텝, bottom-up) ══════════
  { id:'algo7_03',
    input:'n = 9  (F(0)=0, F(1)=1 에서 시작해 dp 표를 채움)',
    code:[
      'FIB-TAB(n) {',
      '  dp[0] = 0;  dp[1] = 1',
      '  for (i = 2; i <= n; i++)',
      '    dp[i] = dp[i-1] + dp[i-2]',
      '  return dp[n]',
      '}'
    ],
    build:function(V){ var n=9, dp=[0,1], st=[];
      st.push({line:1, cap:'기저값: dp[0]=0, dp[1]=1.', dp:dp.slice(), cur:1});
      for(var i=2;i<=n;i++){ dp[i]=dp[i-1]+dp[i-2];
        st.push({line:3, cap:'dp['+i+'] = dp['+(i-1)+']('+dp[i-1]+') + dp['+(i-2)+']('+dp[i-2]+') = <b>'+dp[i]+'</b>', dp:dp.slice(), cur:i, add:[i-1,i-2]}); }
      st.push({line:4, cap:'<b>완료!</b> F('+n+')='+dp[n]+'. 작은 답부터 쌓아 O(n), 재귀 없음.', dp:dp.slice(), cur:n, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('타뷸레이션 — 작은 답부터 표(dp)에 차곡차곡 채우기', V.W/2, V.H*0.20);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('dp[i] = dp[i−1] + dp[i−2] (초록 두 칸을 더해 주황 칸을 채움, 재귀 없음)', V.W/2, V.H*0.20+22);
      AV.arr(V, f.dp, { y:V.H*0.44, bw:52, gap:8, idx:true, hl:function(i){
      if(i===f.cur) return {fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'방금 채움'};
      if(f.add&&(i===f.add[0]||i===f.add[1])) return {fill:'rgba(143,227,181,0.22)',stroke:GRN,text:GRN,tag:'더함'}; return null; } }); }
  },

  // ══════════ 7.2 DP의 두 조건 (concept, quiz) ══════════
  { id:'algo7_04', concept:true,
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'동적 계획법(DP)을 쓸 수 있는 핵심 조건 2가지 중 하나가 아닌 것은?', choices:['겹치는 부분 문제','최적 부분 구조','정렬되어 있어야 함','(둘 다 필요)'], answer:2, explain:'DP의 두 조건 = ①겹치는 부분문제 ②최적 부분구조. 정렬은 무관.'}); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.20;
      function card(y,t,d,col){ ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText(t, cx, y);
        ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText(d, cx, y+22); }
      card(y0, '① 겹치는 부분 문제', '같은 작은 문제를 여러 번 → 저장해 재사용', BLU);
      card(y0+E.H*0.15, '② 최적 부분 구조', '작은 문제의 최적해로 큰 문제의 최적해 구성', GRN); }
  },

  // ══════════ 7.2 격자 경로 DP (코드+스텝) ══════════
  { id:'algo7_05',
    input:'4 × 4 격자  (왼쪽 위 → 오른쪽 아래, 오른쪽·아래로만 이동)',
    code:[
      'GRID-PATHS(R, C) {',
      '  for each cell (i, j):',
      '    if (i==0 || j==0)',
      '      dp[i][j] = 1          // 가장자리',
      '    else',
      '      dp[i][j] = dp[i-1][j] + dp[i][j-1]',
      '  return dp[R-1][C-1]',
      '}'
    ],
    build:function(V){ var R=4,C=4, dp=[], st=[], cnt=0;
      for(var i=0;i<R;i++){dp[i]=[];for(var j=0;j<C;j++)dp[i][j]=0;}
      function copy(){ return dp.map(function(r){return r.slice();}); }
      st.push({line:0, cap:'왼쪽 위 → 오른쪽 아래 경로 수 세기 (오른쪽·아래로만 이동).', R:R,C:C,dp:copy(),cnt:0});
      for(i=0;i<R;i++)for(var j=0;j<C;j++){
        if(i===0||j===0){ dp[i][j]=1; cnt++; st.push({line:3, cap:'가장자리 ('+i+','+j+') = 1 (외길).', R:R,C:C,dp:copy(),cnt:cnt,cur:[i,j]}); }
        else { dp[i][j]=dp[i-1][j]+dp[i][j-1]; cnt++; st.push({line:5, cap:'('+i+','+j+') = 위('+dp[i-1][j]+') + 왼쪽('+dp[i][j-1]+') = <b>'+dp[i][j]+'</b>', R:R,C:C,dp:copy(),cnt:cnt,cur:[i,j],add:[[i-1,j],[i,j-1]]}); }
      }
      st.push({line:6, cap:'<b>총 경로 수 = '+dp[R-1][C-1]+'!</b> (사실 조합 = 파스칼 삼각형)', R:R,C:C,dp:copy(),cnt:R*C,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, R=f.R,C=f.C, cell=Math.min(78,V.H*0.16), x0=V.W/2-C*cell/2, y0=V.H*0.24;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('격자 경로 세기 — 왼쪽 위에서 오른쪽 아래까지', V.W/2, V.H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('오른쪽·아래로만 이동. 각 칸 숫자 = 그 칸까지 오는 경로의 수 (위+왼쪽).', V.W/2, V.H*0.10+22);
      for(var i=0;i<R;i++)for(var j=0;j<C;j++){ var ord=i*C+j, shown=ord<f.cnt, x=x0+j*cell, y=y0+i*cell;
        var cur=f.cur&&f.cur[0]===i&&f.cur[1]===j;
        var add=f.add&&f.add.some(function(c){return c[0]===i&&c[1]===j;});
        ctx.fillStyle=cur?'rgba(255,178,122,0.3)':add?'rgba(143,227,181,0.22)':shown?'rgba(122,184,255,0.14)':'rgba(255,255,255,0.03)';
        ctx.strokeStyle=cur?ORA:add?GRN:shown?BLU:'rgba(255,255,255,0.12)'; ctx.lineWidth=2;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        if(shown){ ctx.fillStyle=cur?ORA:'#dfeefb'; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(f.dp[i][j], x+cell/2-1, y+cell/2-1); ctx.textBaseline='alphabetic'; } } }
  },

  // ══════════ 고급 DP — 상태와 기법 (concept) ══════════
  { id:'algo7_06', concept:true, enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ window.AlgoMap(E, {
      title:'고급 DP — 상태와 기법',
      sub:'무엇을 상태로 잡느냐가 전부. ↓ 심화학습에서 순서대로.',
      stages:[
        {c:'#8fe3b5', t:'① 고전 격자/수열', items:['LCS','편집 거리','0/1 배낭','LIS','행렬 연쇄','카데인']},
        {c:'#ffb27a', t:'② 그리디 반례',  items:['동전 교환','회문 분할']},
        {c:'#f4a0c0', t:'③ 비트마스크·상태', items:['비트마스크 DP','윤곽선 DP','스타이너 트리']},
        {c:'#7ab8ff', t:'④ 자릿수·집합·확률', items:['자릿수 DP','SOS DP','기댓값 DP','다중 배낭']}
      ],
      foot:'표를 채우는 고전 DP → 그리디가 틀리는 곳 → 상태를 비트로 압축 → 자릿수·부분집합·확률로 확장' }); }
  },

  // ══════════ DP 최적화·수열 (concept) ══════════
  { id:'algo7_07', concept:true, enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ window.AlgoMap(E, {
      title:'DP 최적화 · 수열·조합',
      sub:'O(n²) DP를 O(n log n)으로, 점화식을 로그시간으로. ↓ 심화학습에서 순서대로.',
      stages:[
        {c:'#8fe3b5', t:'① 전이 최적화', items:['CHT','리 차오 트리','분할정복 최적화','크누스 최적화','SMAWK']},
        {c:'#ffb27a', t:'② 볼록·제약',  items:['슬로프 트릭','Aliens 트릭']},
        {c:'#f4a0c0', t:'③ 선형 점화 가속', items:['행렬 거듭제곱','키타마사','벨캄프-매시']},
        {c:'#7ab8ff', t:'④ 수열·조합',  items:['뤼카','카탈란','정수 분할','스털링·벨','최장 교대']}
      ],
      foot:'직선/단조성으로 전이 가속 → 볼록·k제약 → 점화식을 로그시간에 → 세는 수열·조합' }); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
