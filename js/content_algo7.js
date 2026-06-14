/* 알고리즘 제7장 동적 계획법 — 7.1 메모이제이션 · 7.2 최적 부분 구조
   동작(behavior)만. 텍스트는 content/algo7.json. AV 사용. */
(function(){
  var TAU=Math.PI*2;
  // fib(4) 호출 트리 (중복 보이기)
  var FT=[
    {x:.50,y:0,l:'F4'},
    {x:.30,y:1,l:'F3',p:0},{x:.74,y:1,l:'F2',p:0,dup:true},
    {x:.18,y:2,l:'F2',p:1,dup:true},{x:.42,y:2,l:'F1',p:1},{x:.66,y:2,l:'F1',p:2},{x:.84,y:2,l:'F0',p:2},
    {x:.12,y:3,l:'F1',p:3},{x:.26,y:3,l:'F0',p:3}
  ];
  function ftpos(E,nd){ return [E.W*0.10+nd.x*E.W*0.80, E.H*0.18+nd.y*E.H*0.15]; }
  function drawFT(E, memo){ var ctx=E.ctx;
    FT.forEach(function(nd){ if(nd.p!=null){ var a=ftpos(E,FT[nd.p]), b=ftpos(E,nd); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); } });
    FT.forEach(function(nd,i){ var p=ftpos(E,nd), cached=memo&&nd.dup&&i===2;
      AV.node(E, p[0], p[1], nd.l, { r:18, fs:13,
        fill: cached?'rgba(255,255,255,0.04)':(nd.dup?'rgba(244,160,192,0.22)':'rgba(122,184,255,0.16)'),
        stroke: cached?'rgba(255,255,255,0.3)':(nd.dup?'#f4a0c0':'#7ab8ff'),
        text: cached?'#6f6e7a':'#dfeefb', tag: cached?'저장됨!':null }); });
  }

  var scenes=[

  // ══════════ 7.1 피보나치 — 순진한 재귀 ══════════
  { id:'algo7_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawFT(E, false);
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('분홍 = F2 가 두 번 계산됨 (중복!)', E.W/2, E.H*0.82);
      E.big('순진한 피보나치 = O(2ⁿ) 폭발', 'F(n)=F(n−1)+F(n−2)를 그대로 재귀하면 같은 값을 수없이 다시 계산해요. F(50)은 수십억 번! (13장 수열)'); }
  },

  // ══════════ 7.1 메모이제이션 ══════════
  { id:'algo7_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx; drawFT(E, true);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('이미 계산한 F2 는 저장값을 꺼내 씀 → 가지 통째로 제거', E.W/2, E.H*0.82);
      E.big('메모이제이션 → O(n)', '계산한 결과를 표에 저장(메모)하고 재사용! 중복 계산이 사라져 O(2ⁿ)이 O(n)으로. 위에서 아래로(top-down) 재귀+캐시'); }
  },

  // ══════════ 7.1 타뷸레이션 (bottom-up) ══════════
  { id:'algo7_03',
    enter:function(E){ this.s={k:2}; E.setOn([]); this.dp=[0,1];
      E.controls('<div class="ctrl"><label>채운 칸 수</label><input type="range" id="kk" min="2" max="10" step="1" value="2"><output id="kko">2</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, k=this.s.k, dp=[0,1]; for(var i=2;i<k;i++) dp[i]=dp[i-1]+dp[i-2];
      AV.arr(E, dp, { y:E.H*0.42, bw:54, idx:true, hl:function(i){ return i===k-1?{fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'방금 채움'}:(i>=k-3&&i<k-1?{fill:'rgba(143,227,181,0.22)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'더함'}:null); } });
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('dp[i] = dp[i−1] + dp[i−2]  (앞의 두 칸을 더해 채움)', E.W/2, E.H*0.60);
      E.big('타뷸레이션 (bottom-up) — F('+(k-1)+') = '+dp[k-1], '아래에서 위로 표를 채워요. 작은 답부터 쌓아 큰 답으로! 재귀 없이 반복문, O(n)·메모리 O(1)도 가능'); }
  },

  // ══════════ 7.2 DP의 두 조건 ══════════
  { id:'algo7_04',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'동적 계획법(DP)을 쓸 수 있는 핵심 조건 2가지 중 하나가 아닌 것은?', choices:['겹치는 부분 문제','최적 부분 구조','정렬되어 있어야 함','(둘 다 필요)'], answer:2, explain:'DP의 두 조건 = ①겹치는 부분문제(같은 계산 반복) ②최적 부분구조(작은 최적해로 큰 최적해 구성). 정렬은 무관.'}); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, y0=E.H*0.22;
      function card(y,t,d,col){ ctx.fillStyle=col; ctx.font='600 17px sans-serif'; ctx.textAlign='center'; ctx.fillText(t, cx, y);
        ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.fillText(d, cx, y+24); }
      card(y0, '① 겹치는 부분 문제', '같은 작은 문제를 여러 번 계산 → 저장해 재사용', '#7ab8ff');
      card(y0+E.H*0.16, '② 최적 부분 구조', '작은 문제의 최적해로 큰 문제의 최적해를 구성', '#8fe3b5');
      E.big('DP가 통하는 두 조건', '동적계획법 = 분할정복(8장)에 "저장(메모)"을 더한 것. 두 조건이 맞으면 지수시간이 다항시간으로!'); }
  },

  // ══════════ 7.2 격자 경로 DP ══════════
  { id:'algo7_05',
    enter:function(E){ this.s={step:1}; this.R=4; this.C=4; E.setOn([]); },
    tap:function(E){ var s=this.s, tot=this.R*this.C; if(s.step>=tot){ s.step=1; E.blip(340,0.12);} else { s.step++; E.blip(480+s.step*20,0.1);} },
    draw:function(E){ var s=this.s, ctx=E.ctx, R=this.R, C=this.C, cell=Math.min(70,E.H*0.13), x0=E.W/2-C*cell/2, y0=E.H*0.20;
      // dp 계산
      var dp=[]; for(var i=0;i<R;i++){ dp[i]=[]; for(var j=0;j<C;j++){ dp[i][j]=(i===0||j===0)?1:dp[i-1][j]+dp[i][j-1]; } }
      var shown=0;
      for(var i=0;i<R;i++)for(var j=0;j<C;j++){ var ord=i*C+j; var x=x0+j*cell, y=y0+i*cell, on=ord<s.step, latest=ord===s.step-1;
        ctx.fillStyle=on?(latest?'rgba(255,178,122,0.3)':'rgba(122,184,255,0.14)'):'rgba(255,255,255,0.03)';
        ctx.strokeStyle=on?(latest?'#ffb27a':'#7ab8ff'):'rgba(255,255,255,0.12)'; ctx.lineWidth=2;
        ctx.fillRect(x,y,cell-3,cell-3); ctx.strokeRect(x,y,cell-3,cell-3);
        if(on){ ctx.fillStyle=latest?'#ffb27a':'#dfeefb'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(dp[i][j], x+cell/2-1, y+cell/2-1); ctx.textBaseline='alphabetic'; } }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('각 칸 = 위 칸 + 왼쪽 칸 (오른쪽·아래로만 이동)', E.W/2, y0+R*cell+24);
      E.tapHint(E.W/2, y0+R*cell+50, s.step>=R*C?'↻ 다시':'▶ 다음 칸 채우기', true);
      E.big('격자 경로 수 = '+(s.step>=R*C?dp[R-1][C-1]:'…'), '격자 DP — 왼쪽 위→오른쪽 아래 경로 수. dp[i][j]=위+왼쪽. (사실 조합 = 수학 15장 파스칼!)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
