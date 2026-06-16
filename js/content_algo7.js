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
  function ftpos(E,nd){ return [E.W*0.10+nd.x*E.W*0.80, E.H*0.20+nd.y*E.H*0.17]; }
  function drawFT(E, memo){ var ctx=E.ctx;
    FT.forEach(function(nd){ if(nd.p!=null){ var a=ftpos(E,FT[nd.p]), b=ftpos(E,nd); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); } });
    FT.forEach(function(nd,i){ var p=ftpos(E,nd), cached=memo&&nd.dup&&i===2;
      AV.node(E, p[0], p[1], nd.l, { r:18, fs:13,
        fill: cached?'rgba(255,255,255,0.04)':(nd.dup?'rgba(244,160,192,0.22)':'rgba(122,184,255,0.16)'),
        stroke: cached?'rgba(255,255,255,0.3)':(nd.dup?PNK:BLU),
        text: cached?DIM:'#dfeefb', tag: cached?'저장됨!':null }); });
  }

  var scenes=[

  // ══════════ 7.1 피보나치 순진한 재귀 (concept) ══════════
  { id:'algo7_01', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawFT(E, false);
      ctx.fillStyle=PNK; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('분홍 = F2 가 두 번 계산됨 (중복!)', E.W/2, E.H*0.88); }
  },

  // ══════════ 7.1 메모이제이션 (concept) ══════════
  { id:'algo7_02', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawFT(E, true);
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('이미 계산한 F2 는 저장값을 꺼내 씀 → 가지 통째로 제거', E.W/2, E.H*0.88); }
  },

  // ══════════ 7.1 타뷸레이션 (코드+스텝, bottom-up) ══════════
  { id:'algo7_03',
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
    draw:function(V,f){ if(!f)return; AV.arr(V, f.dp, { y:V.H*0.44, bw:52, gap:8, idx:true, hl:function(i){
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
      st.push({line:6, cap:'<b>총 경로 수 = '+dp[R-1][C-1]+'!</b> (사실 조합 = 수학 15장 파스칼)', R:R,C:C,dp:copy(),cnt:R*C,done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, R=f.R,C=f.C, cell=Math.min(78,V.H*0.16), x0=V.W/2-C*cell/2, y0=V.H*0.20;
      for(var i=0;i<R;i++)for(var j=0;j<C;j++){ var ord=i*C+j, shown=ord<f.cnt, x=x0+j*cell, y=y0+i*cell;
        var cur=f.cur&&f.cur[0]===i&&f.cur[1]===j;
        var add=f.add&&f.add.some(function(c){return c[0]===i&&c[1]===j;});
        ctx.fillStyle=cur?'rgba(255,178,122,0.3)':add?'rgba(143,227,181,0.22)':shown?'rgba(122,184,255,0.14)':'rgba(255,255,255,0.03)';
        ctx.strokeStyle=cur?ORA:add?GRN:shown?BLU:'rgba(255,255,255,0.12)'; ctx.lineWidth=2;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        if(shown){ ctx.fillStyle=cur?ORA:'#dfeefb'; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(f.dp[i][j], x+cell/2-1, y+cell/2-1); ctx.textBaseline='alphabetic'; } } }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
