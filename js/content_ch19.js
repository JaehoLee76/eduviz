/* 제19장 적분 — 19.1 정적분의 정의 · 19.2 부정적분 · 19.3 정적분의 계산
   동작(behavior)만. 텍스트는 content/ch19.json */
(function(){

  var scenes=[

  // ══════════ 19.1 정적분 = 넓이 (리만 합) ══════════
  { id:'ch19_01',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.3,3.3,-0.5,10);
      E.controls('<div class="ctrl"><label>직사각형 개수 n</label><input type="range" id="nn" min="1" max="40" step="1" value="4"><output id="nno">4</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(420+self.s.n*6,0.06); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, n=this.s.n, ctx=E.ctx, a=0, b=3, dx=(b-a)/n; P.axes();
      function f(x){return x*x;} var sum=0, y0=P.Y(0);
      for(var i=0;i<n;i++){ var xm=a+(i+0.5)*dx, h=f(xm); sum+=h*dx;
        var px=P.X(a+i*dx), pw=P.X(a+dx)-P.X(a), ph=y0-P.Y(h);
        ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.fillRect(px, P.Y(h), pw, ph);
        ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1; ctx.strokeRect(px, P.Y(h), pw, ph); }
      P.curve(f, '#7ab8ff');
      E.big('직사각형 합 = '+sum.toFixed(3)+'  → (n→∞) → 9', '정적분 = 잘게 쪼갠 직사각형 넓이의 합의 극한 = 곡선 아래 넓이'); }
  },

  // ══════════ 19.2 부정적분 = 미분의 역 ══════════
  { id:'ch19_02',
    enter:function(E){ this.s={c:0}; E.Plot.range(-3,3,-3,7);
      E.controls('<div class="ctrl"><label>적분상수 C</label><input type="range" id="cc" min="-2" max="3" step="1" value="0"><output id="cco">0</output></div>');
      var self=this; E.bind('#cc','input',function(e){ self.s.c=+e.target.value; document.getElementById('cco').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, c=this.s.c, ctx=E.ctx; P.axes();
      // 여러 C의 곡선 옅게 (같은 기울기 = 같은 도함수)
      for(var cc=-2;cc<=3;cc++){ if(cc===c) continue; P.curve(function(x){return x*x+cc;}, 'rgba(122,184,255,0.18)'); }
      P.curve(function(x){return x*x+c;}, '#7ab8ff');
      E.big('∫ 2x dx = x² + C   (C = '+c+')', '부정적분 = 미분의 역연산. 도함수가 2x인 함수는 x²+C (상수 C는 미분하면 0이라 못 구별)'); }
  },

  // ══════════ 19.3 미적분의 기본정리 ══════════
  { id:'ch19_03',
    enter:function(E){ this.s={x:2}; E.Plot.range(-0.3,4,-0.5,4.5);
      E.controls('<div class="ctrl"><label>윗끝 x</label><input type="range" id="xx" min="0.5" max="3.5" step="0.25" value="2"><output id="xxo">2</output></div>');
      var self=this; E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, x=this.s.x, ctx=E.ctx; P.axes();
      function f(t){return t;} var area=x*x/2, y0=P.Y(0);
      // 누적 넓이(삼각형)
      ctx.fillStyle='rgba(255,178,122,0.25)'; ctx.beginPath(); ctx.moveTo(P.X(0),y0); ctx.lineTo(P.X(x),y0); ctx.lineTo(P.X(x),P.Y(f(x))); ctx.closePath(); ctx.fill();
      P.curve(f, '#7ab8ff');
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(P.X(x),y0); ctx.lineTo(P.X(x),P.Y(f(x))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(t)=t', P.X(3.2), P.Y(3.4));
      ctx.fillStyle='#ffb27a'; ctx.fillText("넓이 높이 f(x)="+x, P.X(x)+6, P.Y(f(x))-6);
      E.big('A(x) = ∫₀ˣ t dt = x²/2 = '+area.toFixed(2)+',  A\'(x) = x = f(x)', '★미적분 기본정리 — 넓이의 변화율 = 원래 함수! 적분과 미분은 역연산'); }
  },

  // ══════════ 19.3 정적분 계산 (F(b)−F(a)) ══════════
  { id:'ch19_04',
    enter:function(E){ this.s={b:2}; E.Plot.range(-0.3,3.3,-0.5,10);
      E.controls('<div class="ctrl"><label>윗끝 b (아랫끝 1)</label><input type="range" id="bb" min="1" max="3" step="0.5" value="2"><output id="bbo">2</output></div>');
      var self=this; E.bind('#bb','input',function(e){ self.s.b=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, b=this.s.b, ctx=E.ctx, a=1; P.axes();
      function f(x){return x*x;} var y0=P.Y(0), val=b*b*b/3 - a*a*a/3;
      // a~b 넓이
      ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.beginPath(); ctx.moveTo(P.X(a),y0);
      for(var i=0;i<=60;i++){ var t=a+(b-a)*i/60; ctx.lineTo(P.X(t),P.Y(f(t))); } ctx.lineTo(P.X(b),y0); ctx.closePath(); ctx.fill();
      P.curve(f, '#7ab8ff');
      ctx.fillStyle='#8fe3b5'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('a=1', P.X(a), y0+16); ctx.fillText('b='+b, P.X(b), y0+16);
      E.big('∫₁^'+b+' x² dx = [x³/3]₁^'+b+' = '+val.toFixed(3), '정적분 계산 = 부정적분 F의 양끝 차이 F(b)−F(a) (기본정리의 선물!)'); }
  },

  // ══════════ 19.3 부호 있는 넓이 ══════════
  { id:'ch19_05',
    enter:function(E){ this.s={}; E.Plot.range(-2.4,2.4,-3,3); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      function f(x){return x*x*x*0.6;} var y0=P.Y(0);
      // 음수부(빨강) / 양수부(초록)
      for(var i=0;i<=120;i++){ var t=-2+4*i/120, t2=-2+4*(i+1)/120, v=f(t);
        if(t2>2) break; ctx.fillStyle = v>=0?'rgba(143,227,181,0.3)':'rgba(226,75,74,0.3)';
        ctx.beginPath(); ctx.moveTo(P.X(t),y0); ctx.lineTo(P.X(t),P.Y(v)); ctx.lineTo(P.X(t2),P.Y(f(t2))); ctx.lineTo(P.X(t2),y0); ctx.closePath(); ctx.fill(); }
      P.curve(f, '#7ab8ff');
      ctx.fillStyle='#e24b4a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('− (축 아래)', P.X(-1.3), P.Y(-1.2));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('+ (축 위)', P.X(1.3), P.Y(1.2));
      E.big('∫₋₂² (0.6x³) dx = 0', '정적분은 부호 있는 넓이 — 축 아래는 음수. 홀함수는 대칭이라 합이 0!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
