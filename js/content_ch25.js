/* 제25장 엄밀한 극한 — 25.1 ε-N · 25.2 ε-δ·연속
   동작(behavior)만. 텍스트는 content/ch25.json */
(function(){
  var scenes=[

  // ══════════ 25.1 ε-N 논법 ══════════
  { id:'ch25_01',
    enter:function(E){ this.s={eps:0.4}; E.Plot.range(0,14,0,2.6);
      E.controls('<div class="ctrl"><label>허용오차 ε</label><input type="range" id="ee" min="0.1" max="0.8" step="0.1" value="0.4"><output id="eeo">0.4</output></div>');
      var self=this; E.bind('#ee','input',function(e){ self.s.eps=+e.target.value; document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(700-self.s.eps*300,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, eps=this.s.eps, ctx=E.ctx, L=1; P.axes();
      // ε 밴드
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.fillRect(P.X(0),P.Y(L+eps),P.X(14)-P.X(0),P.Y(L-eps)-P.Y(L+eps));
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(L)); ctx.lineTo(P.X(14),P.Y(L)); ctx.stroke(); ctx.setLineDash([]);
      // N 계산: |1/n| < eps → n > 1/eps
      var N=Math.ceil(1/eps);
      ctx.strokeStyle='rgba(143,227,181,0.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(P.X(N),P.Y(0)); ctx.lineTo(P.X(N),P.Y(2.6)); ctx.stroke();
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('N='+N, P.X(N), P.Y(2.6)+0);
      for(var n=1;n<=13;n++){ var v=1+1/n, inb=(n>=N); P.dot(n,v, inb?'#8fe3b5':'#7ab8ff'); }
      E.big('∀ε>0  ∃N  s.t.  n>N ⟹ |aₙ−1|<ε  ('+'ε='+eps.toFixed(1)+'→N='+N+')', 'ε-N 논법 — 아무리 좁은 ε 띠를 줘도, 그 후 모든 항이 띠 안인 N이 존재! 극한의 엄밀한 정의'); }
  },

  // ══════════ 25.2 ε-δ 논법 ══════════
  { id:'ch25_02',
    enter:function(E){ this.s={eps:1}; E.Plot.range(-1,4,-1,6);
      E.controls('<div class="ctrl"><label>목표오차 ε</label><input type="range" id="ee" min="0.4" max="2" step="0.2" value="1"><output id="eeo">1.0</output></div>');
      var self=this; E.bind('#ee','input',function(e){ self.s.eps=+e.target.value; document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, eps=this.s.eps, ctx=E.ctx, a=1, L=2; P.axes(); // f(x)=2x, lim x→1 =2
      function f(x){return 2*x;}
      // ε 띠(가로) + δ 띠(세로)  δ = eps/2
      var del=eps/2;
      ctx.fillStyle='rgba(255,178,122,0.12)'; ctx.fillRect(P.X(-1),P.Y(L+eps),P.X(4)-P.X(-1),P.Y(L-eps)-P.Y(L+eps));
      ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.fillRect(P.X(a-del),P.Y(6),P.X(a+del)-P.X(a-del),P.Y(-1)-P.Y(6));
      P.curve(f,'#8fe3b5');
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(-1),P.Y(L)); ctx.lineTo(P.X(4),P.Y(L)); ctx.stroke(); ctx.setLineDash([]);
      P.dot(a,L,'#ffb27a','(1, 2)');
      ctx.fillStyle='#ffb27a'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('ε', P.X(3.4), P.Y(L+eps)-4);
      ctx.fillStyle='#7ab8ff'; ctx.fillText('δ', P.X(a+del)+3, P.Y(-0.6));
      E.big('∀ε ∃δ : |x−1|<δ ⟹ |f(x)−2|<ε   (δ='+del.toFixed(1)+')', 'ε-δ 논법 — 출력 오차 ε를 정하면, 그걸 보장하는 입력 폭 δ가 있어요. 함수 극한의 엄밀한 정의'); }
  },

  // ══════════ 25.2 연속의 엄밀한 정의 ══════════
  { id:'ch25_03',
    enter:function(E){ this.s={}; E.Plot.range(-1,4,-1,6); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, a=2; P.axes();
      function f(x){return 0.8*x+0.6;}
      P.curve(f,'#7ab8ff');
      var fa=f(a);
      // 극한값 = 함숫값 = 같은 점
      P.dot(a,fa,'#ffb27a','f(a) = lim');
      ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(0)); ctx.lineTo(P.X(a),P.Y(fa)); ctx.lineTo(P.X(0),P.Y(fa)); ctx.stroke(); ctx.setLineDash([]);
      E.big('연속:  lim(x→a) f(x) = f(a)', '엄밀한 연속 = ε-δ가 모든 점에서 성립 + 극한값이 함숫값과 일치(17장 #98의 정밀판). 빈틈·점프 없음'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
