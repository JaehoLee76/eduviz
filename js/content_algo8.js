/* 알고리즘 제8장 설계 패러다임 — 8.1 그리디 · 8.2 분할정복 · 8.3 P vs NP · 종합
   동작(behavior)만. 텍스트는 content/algo8.json. AV 사용. */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 8.1 그리디 ══════════
  { id:'algo8_01',
    enter:function(E){ this.s={amt:780}; this.coins=[500,100,50,10]; E.setOn([]);
      E.controls('<div class="ctrl"><label>거스름돈</label><input type="range" id="aa" min="10" max="990" step="10" value="780"><output id="aao">780</output></div>');
      var self=this; E.bind('#aa','input',function(e){ self.s.amt=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, amt=this.s.amt, rem=amt, picks=[], cx=E.W/2;
      this.coins.forEach(function(c){ var k=Math.floor(rem/c); if(k>0){ picks.push([c,k]); rem-=c*k; } });
      ctx.font='600 17px sans-serif'; ctx.textAlign='center'; var y=E.H*0.34, total=0;
      picks.forEach(function(p,i){ ctx.fillStyle='#ffb27a'; ctx.fillText(p[0]+'원 × '+p[1]+'개', cx, y+i*34); total+=p[1]; });
      ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif'; ctx.fillText('총 '+total+'개 동전', cx, y+picks.length*34+20);
      E.big(amt+'원 = 동전 '+total+'개', '그리디 — 매 순간 가장 큰 동전부터! 한국 동전(10·50·100·500)에선 항상 최소 개수. 단순·빠름, 되돌아보지 않음'); }
  },

  // ══════════ 8.1 그리디의 함정 ══════════
  { id:'algo8_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2;
      ctx.font='15px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#cfcdc6'; ctx.fillText('동전 [4, 3, 1] 로 6원 거스름돈', cx, E.H*0.24);
      ctx.fillStyle='#f4a0c0'; ctx.font='600 17px sans-serif'; ctx.fillText('그리디: 4 + 1 + 1  →  3개', cx, E.H*0.40);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('최적: 3 + 3  →  2개 ✓', cx, E.H*0.50);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('가장 큰 4를 먼저 고른 게 오히려 손해!', cx, E.H*0.62);
      E.big('그리디 ≠ 항상 최적', '그리디는 빠르지만 매번 옳진 않아요. 이 경우 DP(7장)가 진짜 최적(2개)을 보장. 그리디는 "최적성 증명"이 필요'); }
  },

  // ══════════ 8.2 분할정복 ══════════
  { id:'algo8_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,
        L0=[[8,3,5,1,9,2,7,4]], L1=[[8,3,5,1],[9,2,7,4]], L2=[[8,3],[5,1],[9,2],[7,4]],
        merged=[[1,3,5,8],[2,4,7,9]], top=E.H*0.16;
      function row(arrs,y,col){ var totalW=arrs.reduce(function(s,a){return s+a.length;},0), gapGroups=arrs.length, cell=Math.min(34,(E.W*0.7)/(totalW+gapGroups)), x=E.W/2-(totalW*cell+(gapGroups-1)*20)/2;
        arrs.forEach(function(a){ a.forEach(function(v){ ctx.fillStyle=col.replace(')',',0.16)').replace('#','rgba('); ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.fillRect(x,y,cell-2,cell-2); ctx.strokeRect(x,y,cell-2,cell-2);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(v,x+cell/2,y+cell/2); ctx.textBaseline='alphabetic'; x+=cell; }); x+=20; }); }
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='right';
      row(L0, top, '#7ab8ff'); row(L1, top+E.H*0.12, '#7ab8ff'); row(L2, top+E.H*0.24, '#ffb27a');
      ctx.fillText('분할 ↓', E.W*0.12, top+E.H*0.14); ctx.textAlign='right'; ctx.fillText('정복·병합 ↑', E.W*0.12, top+E.H*0.40);
      row(merged, top+E.H*0.40, '#8fe3b5');
      E.big('분할 정복 (Divide & Conquer)', '문제를 반으로 쪼개 → 각각 정복 → 합치기. 병합정렬·퀵정렬(3장)·이분탐색(4장)이 모두 이 전략! O(n log n)'); }
  },

  // ══════════ 8.3 P vs NP ══════════
  { id:'algo8_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.42;
      // NP 큰 원, P 작은 원 (P ⊆ NP)
      ctx.fillStyle='rgba(244,160,192,0.10)'; ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cx,cy,E.W*0.22,E.H*0.20,0,0,TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(143,227,181,0.18)'; ctx.strokeStyle='#8fe3b5'; ctx.beginPath(); ctx.ellipse(cx-E.W*0.07,cy+E.H*0.02,E.W*0.11,E.H*0.11,0,0,TAU); ctx.fill(); ctx.stroke();
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#8fe3b5'; ctx.fillText('P', cx-E.W*0.07, cy+E.H*0.02);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('NP', cx+E.W*0.10, cy-E.H*0.12);
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
      ctx.fillText('정렬·탐색·최단경로', cx-E.W*0.07, cy+E.H*0.06);
      ctx.fillStyle='#f4a0c0'; ctx.fillText('외판원·배낭·스도쿠', cx+E.W*0.10, cy+E.H*0.0);
      E.big('P vs NP — 계산의 한계', 'P=빠르게 푸는 문제. NP=답을 빠르게 검증하는 문제. P=NP? (풀기도 쉬울까?) 100만 달러 미해결 난제!'); }
  },

  // ══════════ 종합 피날레 ══════════
  { id:'algo8_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.44,
        items=['복잡도','배열','연결리스트','스택·큐','해시','정렬','탐색','트리','그래프','DP'], R=Math.min(160,E.H*0.24);
      var pts=items.map(function(s,i){ var t=-Math.PI/2+i*TAU/items.length; return [cx+R*Math.cos(t),cy+R*Math.sin(t),s]; });
      ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var i=0;i<pts.length;i++){ if(i===0)ctx.moveTo(pts[i][0],pts[i][1]); else ctx.lineTo(pts[i][0],pts[i][1]); } ctx.closePath(); ctx.stroke();
      for(var k=0;k<pts.length;k++){ var bl=0.5+0.5*Math.sin(E.frame*0.05+k); ctx.globalAlpha=0.5+0.5*bl;
        ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(pts[k][0],pts[k][1],5,0,TAU); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='#cfcdc6'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(pts[k][2], pts[k][0], pts[k][1]-12); }
      ctx.fillStyle='#bfe0ff'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('{ }', cx, cy+7);
      E.big('알고리즘의 여정 — 완주!', '복잡도→자료구조→정렬→탐색→트리→그래프→DP. 모두 "효율"이라는 하나의 질문으로 연결돼요. 수학과 함께, 이해의 세계 완성!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
