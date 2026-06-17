/* 알고리즘 제8장 설계 패러다임 — VIZ 포맷
   그리디=코드+스텝, 그리디함정·분할정복·P vs NP·피날레=concept. 텍스트는 content/algo8.json. */
(function(){
  var TAU=Math.PI*2, BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0', DIM='#6f6e7a';

  var scenes=[

  // ══════════ 8.1 그리디 — 거스름돈 (코드+스텝) ══════════
  { id:'algo8_01',
    input:'금액 = 780원 ,  동전 = [ 500, 100, 50, 10 ]',
    code:[
      'GREEDY-COINS(amount, coins[]) {   // coins 내림차순',
      '  for each c in coins:',
      '    k = amount / c     // 이 동전 몇 개?',
      '    if (k > 0) use k coins of c',
      '    amount = amount - c*k',
      '  // amount == 0 이면 성공',
      '}'
    ],
    build:function(V){ var amt=780, coins=[500,100,50,10], rem=amt, picks=[], st=[];
      st.push({line:0, cap:'거스름돈 <b>'+amt+'원</b> 을 최소 동전으로 — 큰 동전부터 욕심껏.', picks:[], rem:rem, cur:-1});
      coins.forEach(function(c){
        var k=Math.floor(rem/c);
        st.push({line:2, cap:c+'원: '+rem+' ÷ '+c+' = <b>'+k+'개</b> 쓸 수 있음.', picks:picks.slice(), rem:rem, cur:c});
        if(k>0){ picks.push([c,k]); rem-=c*k;
          st.push({line:3, cap:c+'원 <b>'+k+'개</b> 사용 → 남은 거스름돈 '+rem+'원.', picks:picks.slice(), rem:rem, cur:c, used:c}); }
      });
      var total=picks.reduce(function(s,p){return s+p[1];},0);
      st.push({line:5, cap:'<b>완료!</b> 총 '+total+'개. 한국 동전(10·50·100·500)에선 그리디가 항상 최소 — 단 최적성은 증명 필요.', picks:picks.slice(), rem:0, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx, cx=V.W/2;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('거스름돈 780원을 최소 동전 수로', cx, V.H*0.09);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('큰 동전부터 욕심껏 집기(그리디) — 한국 동전에선 늘 최소', cx, V.H*0.09+20);
      ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=DIM; ctx.fillText('남은 거스름돈', cx, V.H*0.22);
      ctx.fillStyle=f.rem===0?GRN:ORA; ctx.font='600 34px sans-serif'; ctx.fillText(f.rem+'원', cx, V.H*0.27);
      var y=V.H*0.40;
      f.picks.forEach(function(p,i){ var hot=(p[0]===f.used); ctx.fillStyle=hot?ORA:'#cfcdc6'; ctx.font='600 18px sans-serif'; ctx.fillText(p[0]+'원 × '+p[1]+'개', cx, y+i*32); });
      if(f.cur>0&&!f.done){ ctx.fillStyle=PNK; ctx.font='600 15px sans-serif'; ctx.fillText('지금 보는 동전: '+f.cur+'원', cx, V.H*0.74); } }
  },

  // ══════════ 8.1 그리디의 함정 (concept) ══════════
  { id:'algo8_02', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#cfcdc6'; ctx.fillText('동전 [4, 3, 1] 로 6원 거스름돈', cx, E.H*0.30);
      ctx.fillStyle=PNK; ctx.font='600 18px sans-serif'; ctx.fillText('그리디: 4 + 1 + 1  →  3개', cx, E.H*0.46);
      ctx.fillStyle=GRN; ctx.fillText('최적: 3 + 3  →  2개 ✓', cx, E.H*0.56);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('가장 큰 4를 먼저 고른 게 오히려 손해!', cx, E.H*0.68); }
  },

  // ══════════ 8.2 분할정복 (concept) ══════════
  { id:'algo8_03', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,
        L0=[[8,3,5,1,9,2,7,4]], L1=[[8,3,5,1],[9,2,7,4]], L2=[[8,3],[5,1],[9,2],[7,4]],
        merged=[[1,3,5,8],[2,4,7,9]], top=E.H*0.20;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('분할정복 — 반으로 쪼개(분할) 각각 정복한 뒤 합치기(병합)', E.W/2, E.H*0.08);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('병합 정렬의 흐름: 파랑 = 쪼개는 중, 초록 = 정렬되어 합쳐짐', E.W/2, E.H*0.08+20);
      function row(arrs,y,col){ var totalW=arrs.reduce(function(s,a){return s+a.length;},0), gapGroups=arrs.length, cell=Math.min(34,(E.W*0.7)/(totalW+gapGroups)), x=E.W/2-(totalW*cell+(gapGroups-1)*20)/2;
        arrs.forEach(function(a){ a.forEach(function(v){ ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v,x+cell/2,y+cell/2); ctx.textBaseline='alphabetic'; x+=cell; }); x+=20; }); }
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      row(L0, top, BLU); row(L1, top+E.H*0.13, BLU); row(L2, top+E.H*0.26, ORA);
      ctx.fillText('분할 ↓', E.W*0.04, top+E.H*0.15); ctx.fillText('정복·병합 ↑', E.W*0.04, top+E.H*0.43);
      row(merged, top+E.H*0.42, GRN); }
  },

  // ══════════ 8.3 P vs NP (concept) ══════════
  { id:'algo8_04', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.46;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('P vs NP — 빨리 푸는 문제 vs 정답 검산만 빠른 문제', cx, E.H*0.10);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('P ⊆ NP. "P = NP 인가?"는 컴퓨터과학 최대 난제(미해결).', cx, E.H*0.10+20);
      ctx.fillStyle='rgba(244,160,192,0.10)'; ctx.strokeStyle=PNK; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cx,cy,E.W*0.26,E.H*0.22,0,0,TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(143,227,181,0.18)'; ctx.strokeStyle=GRN; ctx.beginPath(); ctx.ellipse(cx-E.W*0.08,cy+E.H*0.02,E.W*0.13,E.H*0.12,0,0,TAU); ctx.fill(); ctx.stroke();
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=GRN; ctx.fillText('P', cx-E.W*0.08, cy+E.H*0.02);
      ctx.fillStyle=PNK; ctx.fillText('NP', cx+E.W*0.12, cy-E.H*0.13);
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('정렬·탐색·최단경로', cx-E.W*0.08, cy+E.H*0.07);
      ctx.fillStyle=PNK; ctx.fillText('외판원·배낭·스도쿠', cx+E.W*0.12, cy+E.H*0.0); }
  },

  // ══════════ 종합 피날레 (concept) ══════════
  { id:'algo8_05', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.46,
        items=['복잡도','배열','연결리스트','스택·큐','해시','정렬','탐색','트리','그래프','DP'], R=Math.min(170,E.H*0.26);
      var pts=items.map(function(s,i){ var t=-Math.PI/2+i*TAU/items.length; return [cx+R*Math.cos(t),cy+R*Math.sin(t),s]; });
      ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var i=0;i<pts.length;i++){ if(i===0)ctx.moveTo(pts[i][0],pts[i][1]); else ctx.lineTo(pts[i][0],pts[i][1]); } ctx.closePath(); ctx.stroke();
      for(var k=0;k<pts.length;k++){ var bl=0.5+0.5*Math.sin(E.frame*0.05+k); ctx.globalAlpha=0.5+0.5*bl;
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(pts[k][0],pts[k][1],5,0,TAU); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(pts[k][2], pts[k][0], pts[k][1]-12); }
      ctx.fillStyle='#bfe0ff'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('{ }', cx, cy+7); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
