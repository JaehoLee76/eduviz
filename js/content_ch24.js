/* 제24장 집합론 — 24.1~24.5 농도·가산·비가산
   동작(behavior)만. 텍스트는 content/ch24.json */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 24.1 일대일 대응 = 크기 비교 ══════════
  { id:'ch24_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, A=['🍎','🍊','🍐','🍇'], B=['1','2','3','4'], lx=E.W*0.36, rx=E.W*0.60, y0=E.H*0.26, gap=E.H*0.10;
      ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var i=0;i<4;i++){ var y=y0+i*gap;
        ctx.strokeStyle='rgba(143,227,181,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(lx+20,y); ctx.lineTo(rx-20,y); ctx.stroke();
        ctx.fillStyle='#7ab8ff'; ctx.fillText(A[i], lx, y); ctx.fillStyle='#ffb27a'; ctx.font='600 20px sans-serif'; ctx.fillText(B[i], rx, y); ctx.font='22px sans-serif'; }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.fillText('집합 A', lx, y0-30); ctx.fillText('집합 B', rx, y0-30);
      E.big('A ↔ B : 일대일 대응', '두 집합의 크기가 같다 = 빠짐·겹침 없이 짝지을 수 있다. 세지 않고 비교!'); }
  },

  // ══════════ 24.2 가산무한 — 부분이 전체와 같다 ══════════
  { id:'ch24_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, n=6, x0=E.W*0.16, gap=(E.W*0.68)/n, yN=E.H*0.32, yE=E.H*0.52;
      ctx.font='600 17px sans-serif'; ctx.textAlign='center';
      for(var i=1;i<=n;i++){ var x=x0+(i-1)*gap;
        ctx.fillStyle='#7ab8ff'; ctx.fillText(i, x, yN); ctx.fillStyle='#8fe3b5'; ctx.fillText(2*i, x, yE);
        ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x,yN+8); ctx.lineTo(x,yE-14); ctx.stroke(); }
      ctx.fillStyle='#9b99a3'; ctx.font='14px sans-serif'; ctx.textAlign='right';
      ctx.fillText('자연수 ℕ', x0-16, yN); ctx.fillText('짝수', x0-16, yE);
      ctx.textAlign='center'; ctx.fillText('… ∞', x0+n*gap, yN); ctx.fillText('… ∞', x0+n*gap, yE);
      E.big('ℕ ↔ 짝수 :  n ↔ 2n  (같은 크기!)', '★무한의 역설 — 짝수는 자연수의 절반? 아니에요! 일대일 대응이 되니 크기 같음(ℵ₀, 가산무한)'); }
  },

  // ══════════ 24.3 유리수도 가산 (대각선 나열) ══════════
  { id:'ch24_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, N=5, x0=E.W*0.30, y0=E.H*0.20, cell=Math.min(54,E.H*0.10);
      ctx.font='15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var p=1;p<=N;p++)for(var q=1;q<=N;q++){ var x=x0+(q-1)*cell, y=y0+(p-1)*cell;
        ctx.fillStyle='#8a8893'; ctx.fillText(p+'/'+q, x, y); }
      ctx.textBaseline='alphabetic';
      // 대각선 지그재그 경로
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=2; ctx.beginPath();
      var order=[[1,1],[1,2],[2,1],[3,1],[2,2],[1,3],[1,4],[2,3],[3,2],[4,1]];
      for(var k=0;k<order.length;k++){ var px=x0+(order[k][1]-1)*cell, py=y0+(order[k][0]-1)*cell; if(k===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      ctx.fillStyle='#ffb27a'; var s=x0+(order[0][1]-1)*cell, sy=y0; ctx.beginPath(); ctx.arc(x0,y0,5,0,TAU); ctx.fill();
      E.big('유리수도 가산무한 (ℵ₀)', '분수를 격자로 늘어놓고 대각선으로 지그재그 세면 → 자연수와 일대일! 분수가 무한히 빽빽해도 셀 수 있어요'); }
  },

  // ══════════ 24.4 실수는 비가산 (칸토어 대각선) ══════════
  { id:'ch24_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, x0=E.W*0.30, y0=E.H*0.22, rh=Math.min(40,E.H*0.07);
      var L=['0. 1 4 2 8 …','0. 3 3 3 3 …','0. 7 1 8 2 …','0. 9 0 0 5 …','0. 2 7 1 8 …'];
      ctx.font='16px ui-monospace, monospace'; ctx.textAlign='left';
      for(var i=0;i<5;i++){ var y=y0+i*rh; ctx.fillStyle='#8a8893'; ctx.fillText((i+1)+':  '+L[i], x0, y);
        // 대각선 숫자 강조
        var dx=x0+ctx.measureText((i+1)+':  0. ').width + i*ctx.measureText('0 ').width;
        ctx.fillStyle='#ffb27a'; ctx.fillRect(dx-2, y-15, 14, 20); }
      ctx.fillStyle='#8fe3b5'; ctx.font='15px ui-monospace, monospace';
      ctx.fillText('새 수 = 0. 2 4 2 6 9 …  (각 대각선 숫자 +1)', x0, y0+5*rh+24);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('→ 목록의 어느 수와도 적어도 한 자리가 달라요 → 목록에 없음!', x0, y0+5*rh+48);
      E.big('실수는 비가산 — 더 큰 무한!', '★칸토어 대각선논법 — 실수를 다 나열해도, 대각선을 바꾼 새 수는 목록에 없어요. 무한에도 크기가 여러 개!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
