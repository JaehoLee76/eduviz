/* 제14장 극한 — 14.1 수렴·발산 · 14.2 극한의 계산 · 14.3 무한급수
   동작(behavior)만. 텍스트는 content/ch14.json */
(function(){

  var scenes=[

  // ══════════ 14.1 수렴·발산 ══════════
  // 14.1a 수열의 수렴
  { id:'ch14_01',
    enter:function(E){ this.s={N:6}; E.Plot.range(0,13,0,3).lab('n','aₙ');
      E.controls('<div class="ctrl"><label>항의 개수 N</label><input type="range" id="nn" min="2" max="12" step="1" value="6"><output id="nno">6</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(420+self.s.N*20,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, N=this.s.N, ctx=E.ctx; P.axes();
      // 극한선 y=1 + ε밴드
      var eps=0.15; ctx.fillStyle='rgba(255,178,122,0.12)'; ctx.fillRect(P.X(0),P.Y(1+eps),P.X(13)-P.X(0),P.Y(1-eps)-P.Y(1+eps));
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(1)); ctx.lineTo(P.X(13),P.Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('극한 L = 1', P.X(10), P.Y(1)-8);
      for(var n=1;n<=N;n++){ var v=1+1/n; P.dot(n,v,'#7ab8ff'); }
      var last=1+1/N;
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('aₙ = 1 + 1/n', P.X(1)+8, P.Y(2)-2);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('a'+N+' = '+last.toFixed(3), P.X(N)+8, P.Y(last)+4);
      E.big('aₙ = 1 + 1/n → 1', 'n이 커질수록 항이 극한 1에 한없이 가까워집니다 (현재 a'+N+'='+last.toFixed(3)+') = 수렴'); }
  },

  // 14.1b 발산 · 진동
  { id:'ch14_02',
    enter:function(E){ this.s={mode:0}; E.Plot.range(0,13,-2,5).lab('n','aₙ'); E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%2; E.blip(this.s.mode?300:520,0.15); },
    draw:function(E){ var P=E.Plot, m=this.s.mode, ctx=E.ctx; P.axes();
      for(var n=1;n<=12;n++){ var v = m===0 ? n/3 : (n%2===0?1:-1);
        if(v>=P.ymin&&v<=P.ymax) P.dot(n,v, m===0?'#f4a0c0':'#8fe3b5'); }
      ctx.fillStyle=m===0?'#f4a0c0':'#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText(m===0?'aₙ = n/3':'aₙ = (−1)ⁿ', P.X(m===0?7:8)+6, m===0? P.Y(7/3)-6 : P.Y(1)-10);
      E.tapHint(E.W/2, P.geom().bot+40, '▶ 발산 / 진동 바꾸기', true);
      E.big(m===0?'aₙ = n/3 → ∞  (발산)':'aₙ = (−1)ⁿ  (진동)', m===0?'한없이 커져 한 값에 머물지 않습니다 = 발산':'두 값 사이를 오가 극한이 없습니다 = 진동(발산)'); }
  },

  // ══════════ 14.2 극한의 계산 ══════════
  // 14.2a 함수의 극한 — 0/0 구멍
  { id:'ch14_03',
    enter:function(E){ this.s={d:0.8}; E.Plot.range(-2,4,-1,5).lab('x','y');
      E.controls('<div class="ctrl"><label>1에서 거리 d</label><input type="range" id="ld" min="0.02" max="1.5" step="0.02" value="0.8"><output id="ldo">0.80</output></div>');
      var self=this; E.bind('#ld','input',function(e){ self.s.d=+e.target.value; document.getElementById('ldo').textContent=(+e.target.value).toFixed(2); E.blip(700-self.s.d*300,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, d=this.s.d; P.axes();
      P.curve(function(x){ return x+1; }, '#7ab8ff');   // (x²−1)/(x−1) = x+1 (x≠1)
      var xl=1-d, xr=1+d, yl=xl+1, yr=xr+1;   // f = x+1 실계산
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
      [[xl,yl],[xr,yr]].forEach(function(p){ ctx.beginPath(); ctx.moveTo(P.X(p[0]),P.Y(0)); ctx.lineTo(P.X(p[0]),P.Y(p[1])); ctx.lineTo(P.X(-2),P.Y(p[1])); ctx.stroke(); }); ctx.setLineDash([]);
      P.dot(xl,yl,'#8fe3b5'); P.dot(xr,yr,'#8fe3b5');
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('f = '+yl.toFixed(2), P.X(xl)+8, P.Y(yl)+4); ctx.fillText('f = '+yr.toFixed(2), P.X(xr)+8, P.Y(yr)+4);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.fillStyle='#0b0b10'; ctx.beginPath(); ctx.arc(P.X(1),P.Y(2),6,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x) = (x²−1)/(x−1) = x+1', P.X(2.1), P.Y(3.1));
      ctx.fillStyle='#ffb27a'; ctx.textAlign='right'; ctx.fillText('구멍 (x=1, 0/0)', P.X(1)-12, P.Y(2)-8);
      E.big('x = 1 ± '+d.toFixed(2)+'  →  f = '+yl.toFixed(2)+' ,  '+yr.toFixed(2), 'd를 0으로 줄여 보세요 — 양쪽 f가 모두 2로 수렴! x=1은 0/0(구멍)이지만 극한은 2'); }
  },

  // 14.2b lim x→∞  (1/x → 0)
  { id:'ch14_04',
    enter:function(E){ this.s={x:2}; E.Plot.range(0,10,-0.5,4).lab('x','y');
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="lx" min="1" max="10" step="0.5" value="2"><output id="lxo">2</output></div>');
      var self=this; E.bind('#lx','input',function(e){ self.s.x=+e.target.value; document.getElementById('lxo').textContent=e.target.value; E.blip(360+self.s.x*28,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, x=this.s.x; P.axes();
      P.curve(function(t){ return t>0.1? 1/t : 99; }, '#7ab8ff');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = 1/x', P.X(1.5), P.Y(1/1.5)-6);
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(10),P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.fillText('점근선 y = 0', P.X(6.5), P.Y(0)-8);
      var y=1/x;
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.lineTo(P.X(0),P.Y(y)); ctx.stroke(); ctx.setLineDash([]);
      P.dot(x,y,'#8fe3b5');
      ctx.fillStyle='#8fe3b5'; ctx.fillText('1/x = '+y.toFixed(3), P.X(x)+8, P.Y(y)-4);
      E.big('x = '+x+'  →  1/x = '+y.toFixed(3), 'x를 키울수록 1/x는 0에 한없이 가까워집니다 (x→∞이면 0, 닿지는 않음)'); }
  },

  // ══════════ 14.3 e의 정의 ══════════
  { id:'ch14_05',
    enter:function(E){ this.s={k:1}; E.Plot.range(0,7,0,3.2).lab('n','aₙ');
      E.controls('<div class="ctrl"><label>n = 2^</label><input type="range" id="ek" min="0" max="7" step="1" value="1"><output id="eko">2</output></div>');
      var self=this; E.bind('#ek','input',function(e){ self.s.k=+e.target.value; document.getElementById('eko').textContent=Math.pow(2,self.s.k); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.k, ctx=E.ctx; P.axes();
      // 극한선 e
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(Math.E)); ctx.lineTo(P.X(7),P.Y(Math.E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('e ≈ 2.718', P.X(4.5), P.Y(Math.E)-8);
      for(var j=0;j<=k;j++){ var n=Math.pow(2,j), v=Math.pow(1+1/n,n); P.dot(j+0.5,v,'#7ab8ff'); }
      var n=Math.pow(2,k), val=Math.pow(1+1/n,n);
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('aₙ = (1+1/n)ⁿ', P.X(0.5)+8, P.Y(1.6));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('a'+n+' = '+val.toFixed(4), P.X(k+0.5)+8, P.Y(val)+4);
      E.big('(1 + 1/'+n+')^'+n+' = '+val.toFixed(4), 'n→∞이면 (1+1/n)ⁿ → e ≈ 2.71828… (자연상수, 7장 지수·17장 미분의 핵심)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
