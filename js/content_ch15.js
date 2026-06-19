/* 제15장 순열·조합 — 15.1 순열 · 15.2 조합 · 15.3 이항정리
   동작(behavior)만. 텍스트는 content/ch15.json */
(function(){
  function fact(n){ var f=1; for(var i=2;i<=n;i++) f*=i; return f; }
  function nPr(n,r){ return fact(n)/fact(n-r); }
  function nCr(n,r){ return nPr(n,r)/fact(r); }

  var scenes=[

  // ══════════ 15.1 경우의 수·순열 ══════════
  // 15.1a 곱의 법칙 (나무그림)
  { id:'ch15_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, rootX=E.W*0.22, rootY=E.H*0.58, tops=['셔츠A','셔츠B'], bots=['청바지','반바지','치마'];
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(rootX,rootY,8,0,7); ctx.fill();
      ctx.font='13px sans-serif'; ctx.textAlign='left';
      var midX=E.W*0.45, leafX=E.W*0.66, cnt=0;
      for(var i=0;i<2;i++){ var ty=rootY+(i-0.5)*E.H*0.24;
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(rootX,rootY); ctx.lineTo(midX,ty); ctx.stroke();
        ctx.fillStyle='#7ab8ff'; ctx.beginPath(); ctx.arc(midX,ty,6,0,7); ctx.fill(); ctx.fillText(tops[i], midX-58, ty+4);
        for(var j=0;j<3;j++){ var ly=ty+(j-1)*E.H*0.075;
          ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(midX,ty); ctx.lineTo(leafX,ly); ctx.stroke();
          ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(leafX,ly,5,0,7); ctx.fill();
          ctx.fillStyle='#cfcdc6'; ctx.fillText(tops[i].slice(-1)+'+'+bots[j], leafX+10, ly+4); cnt++; } }
      E.big('2 × 3 = 6 가지', '곱의 법칙 — 상의 2가지 각각에 하의 3가지 → 모든 조합은 곱'); }
  },

  // 15.1b 순열 nPr (순서 있음)
  { id:'ch15_02',
    enter:function(E){ this.s={r:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>뽑는 수 r (4명 중)</label><input type="range" id="rr" min="1" max="4" step="1" value="2"><output id="rro">2</output></div>');
      var self=this; E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, r=this.s.r, n=4, bw=80, gap=24, totalW=r*bw+(r-1)*gap, x0=E.W/2-totalW/2, y=E.H*0.46;
      var choices=[]; for(var i=0;i<r;i++){ var c=n-i;
        ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
        var x=x0+i*(bw+gap); ctx.fillRect(x,y,bw,70); ctx.strokeRect(x,y,bw,70);
        ctx.fillStyle='#7ab8ff'; ctx.font='600 26px sans-serif'; ctx.textAlign='center'; ctx.fillText(c, x+bw/2, y+44);
        ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText((i+1)+'번 자리', x+bw/2, y+90); choices.push(c);
        if(i<r-1){ ctx.fillStyle='#ffb27a'; ctx.font='600 22px sans-serif'; ctx.fillText('×', x+bw+gap/2, y+44); } }
      E.big('₄P'+r+' = '+choices.join('×')+' = '+nPr(n,r), '순열 = 순서 있게 뽑기. 칸을 채울수록 선택지가 하나씩 줄어듭니다 (n!/(n−r)!)'); }
  },

  // ══════════ 15.2 조합 ══════════
  { id:'ch15_03',
    enter:function(E){ this.s={r:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>뽑는 수 r (4명 중)</label><input type="range" id="cr" min="0" max="4" step="1" value="2"><output id="cro">2</output></div>');
      var self=this; E.bind('#cr','input',function(e){ self.s.r=+e.target.value; document.getElementById('cro').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, r=this.s.r, n=4, cx=E.W/2, cy=E.H*0.40, R=90, names=['A','B','C','D'];
      // 4명을 원형 배치, 선택된 r명(앞쪽) 강조 — 대표 한 조합 표시
      for(var i=0;i<n;i++){ var t=-Math.PI/2 + i*Math.PI*2/n, x=cx+R*Math.cos(t), y=cy+R*Math.sin(t), sel=i<r;
        ctx.fillStyle=sel?'rgba(255,178,122,0.85)':'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(x,y,24,0,7); ctx.fill();
        ctx.strokeStyle=sel?'#ffb27a':'rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,24,0,7); ctx.stroke();
        ctx.fillStyle=sel?'#1a1a22':'#cfcdc6'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(names[i],x,y); ctx.textBaseline='alphabetic'; }
      E.big('₄C'+r+' = ₄P'+r+' / '+r+'! = '+nCr(n,r), '조합 = 순서 없이 뽑기. 순열을 같은 묶음의 순서 r!로 나눕니다 (대표 한 조합 표시)'); }
  },

  // ══════════ 15.3 파스칼·이항정리 ══════════
  // 15.3a 파스칼의 삼각형
  { id:'ch15_04',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, rows=7, cell=Math.min(46,E.H*0.072), topY=E.H*0.34, cx=E.W/2, rad=Math.min(17,cell*0.37);
      ctx.font='600 '+Math.round(Math.min(16,cell*0.35))+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(var r=0;r<rows;r++){ var y=topY+r*cell, x0=cx-r*cell/2;
        for(var k=0;k<=r;k++){ var x=x0+k*cell, v=nCr(r,k);
          var hot=(r===4&&(k===1||k===2)) , res=(r===5&&k===2);
          ctx.fillStyle= res?'rgba(255,178,122,0.85)':hot?'rgba(122,184,255,0.5)':'rgba(122,184,255,0.16)';
          ctx.beginPath(); ctx.arc(x,y,rad,0,7); ctx.fill();
          ctx.fillStyle= res?'#1a1a22':'#dfeefb'; ctx.fillText(v,x,y); } }
      // "위 두 수의 합" 화살표 (4행 1,2 → 5행 2)
      var ax=cx-4*cell/2+1*cell, bx=cx-4*cell/2+2*cell, sy=topY+4*cell, dx=cx-5*cell/2+2*cell, dy=topY+5*cell;
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(ax,sy+12); ctx.lineTo(dx,dy-12); ctx.moveTo(bx,sy+12); ctx.lineTo(dx,dy-12); ctx.stroke();
      ctx.textBaseline='alphabetic';
      E.big('파스칼의 삼각형', '각 수 = 바로 위 두 수의 합 (예: 4 + 6 = 10) · 양 끝은 항상 1 · n번째 줄 = ₙCᵣ'); }
  },

  // 15.3b 이항정리
  { id:'ch15_05',
    enter:function(E){ this.s={n:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>지수 n</label><input type="range" id="bn" min="1" max="5" step="1" value="3"><output id="bno">3</output></div>');
      var self=this; E.bind('#bn','input',function(e){ self.s.n=+e.target.value; document.getElementById('bno').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, cx=E.W/2, y=E.H*0.42;
      // 계수(파스칼 n행)
      var coefs=[]; for(var k=0;k<=n;k++) coefs.push(nCr(n,k));
      ctx.font='600 18px sans-serif'; ctx.textAlign='center';
      var cw=58, total=(n+1)*cw, x0=cx-total/2;
      for(var i=0;i<=n;i++){ var x=x0+i*cw+cw/2;
        ctx.fillStyle='rgba(255,178,122,0.85)'; ctx.beginPath(); ctx.arc(x,y,18,0,7); ctx.fill();
        ctx.fillStyle='#1a1a22'; ctx.textBaseline='middle'; ctx.fillText(coefs[i],x,y); ctx.textBaseline='alphabetic';
        ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; var p=n-i;
        var aP=(p>1?'a^'+p:p===1?'a':''), bP=(i>1?'b^'+i:i===1?'b':''); ctx.fillText((aP+bP)||'1', x, y+38); ctx.font='600 18px sans-serif'; }
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('↑ 계수 = 파스칼 '+n+'번째 줄', cx, y-36);
      E.big('(a + b)^'+n+'  계수: '+coefs.join(', '), '이항정리 — 전개 계수가 곧 ₙCᵣ (파스칼 줄). 3장 (a+b)²(#33)의 일반화!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
