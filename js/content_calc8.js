/* 미적분학 8장 — 적분기법 (Stewart Ch.7)
   8.1 치환적분 · 8.2 부분적분 · 8.3 부분분수 · 8.4 이상적분(수렴/발산) · 8.5 수치적분
   동작만. 텍스트=content/calc8.json. 보라 테마. 골든룰=넓이 전부 적분 실계산·공식 검산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function integ(f,a,b){ var n=3000,h=(b-a)/n,s=0; for(var i=0;i<n;i++) s+=f(a+(i+0.5)*h)*h; return s; }

  var scenes = [

  // 8.1 치환적분 — 연쇄법칙의 역  ∫2x·cos(x²)dx = sin(x²)
  { id:'calc8_01',
    enter:function(E){ this.s={b:1.4}; E.Plot.range(-0.3,2.6,-3,3);
      E.controls('<div class="ctrl"><label>윗끝 b</label><input type="range" id="sb" min="0.2" max="2.5" step="0.02" value="1.4"><output id="sbo">1.40</output></div>');
      var self=this; E.bind('#sb','input',function(e){ self.s.b=+e.target.value; document.getElementById('sbo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b;
      function f(x){return 2*x*Math.cos(x*x);}
      var n=200,h=b/n; for(var k=0;k<n;k++){ var xm=h*(k+0.5), fm=f(xm); ctx.fillStyle=fm>=0?'rgba(126,224,176,0.22)':'rgba(240,136,138,0.22)'; ctx.fillRect(P.X(k*h),P.Y(Math.max(0,fm)),P.X((k+1)*h)-P.X(k*h),Math.abs(P.Y(fm)-P.Y(0))); }
      P.axes(); P.curve(f, VIO);
      var area=integ(f,0,b), formula=Math.sin(b*b);   // u=x² → ∫cos u du = sin(x²)
      E.big('∫₀ᵇ 2x·cos(x²) dx = sin(b²) = '+formula.toFixed(3), '실측 넓이 '+area.toFixed(3)+' — u=x² 치환으로 ∫cos u du 가 됩니다'); }
  },

  // 8.2 부분적분  ∫x·eˣ dx = (x−1)eˣ
  { id:'calc8_02',
    enter:function(E){ this.s={b:1.5}; E.Plot.range(-0.3,2.3,-1,8);
      E.controls('<div class="ctrl"><label>윗끝 b</label><input type="range" id="pb" min="0.2" max="2" step="0.02" value="1.5"><output id="pbo">1.50</output></div>');
      var self=this; E.bind('#pb','input',function(e){ self.s.b=+e.target.value; document.getElementById('pbo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b;
      function f(x){return x*Math.exp(x);}
      var n=200,h=b/n; for(var k=0;k<n;k++){ var xm=h*(k+0.5); ctx.fillStyle='rgba(185,156,255,0.20)'; ctx.fillRect(P.X(k*h),P.Y(f(xm)),P.X((k+1)*h)-P.X(k*h),P.Y(0)-P.Y(f(xm))); }
      P.axes(); P.curve(f, VIO);
      var area=integ(f,0,b), formula=(b-1)*Math.exp(b)-(0-1)*Math.exp(0);   // [(x−1)eˣ]₀ᵇ
      E.big('∫₀ᵇ x·eˣ dx = [(x−1)eˣ] = '+formula.toFixed(3), '실측 '+area.toFixed(3)+' — u=x, dv=eˣdx: ∫u dv = uv − ∫v du'); }
  },

  // 8.3 부분분수  1/((x−3)(x+1)) = ¼/(x−3) − ¼/(x+1)
  { id:'calc8_03',
    enter:function(E){ this.s={show:1}; E.Plot.range(-4,5,-1.5,1.5);
      E.controls('<div class="ctrl"><label>조각 보기(0원본·1분해)</label><input type="range" id="sh" min="0" max="1" step="1" value="1"><output id="sho">1</output></div>');
      var self=this; E.bind('#sh','input',function(e){ self.s.show=+e.target.value; document.getElementById('sho').textContent=e.target.value; E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s;
      function f(x){ return 1/((x-3)*(x+1)); }
      function A(x){ return 0.25/(x-3); } function B(x){ return -0.25/(x+1); }
      P.axes();
      // 점근선 근처 끊김 방지: curve가 알아서 큰 값은 클립
      if(s.show===1){ P.curve(A, GLD); P.curve(B, BLU); }
      P.curve(f, VIO);
      E.big('1/((x−3)(x+1)) = ¼·1/(x−3) − ¼·1/(x+1)', s.show?'복잡한 분수를 더하기 쉬운 두 조각으로 쪼갭니다 (금색+파랑 = 보라)':'분해하면 각 조각은 ∫1/(x−a)dx = ln|x−a| 로 바로 적분'); }
  },

  // 8.4 이상적분 — 수렴 vs 발산  ∫₁^∞ x^(−p)
  { id:'calc8_04',
    enter:function(E){ this.s={p:2}; E.Plot.range(0,9,-0.2,1.6);
      E.controls('<div class="ctrl"><label>지수 p</label><input type="range" id="pp" min="0.5" max="2.5" step="0.1" value="2"><output id="ppo">2.0</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, p=s.p;
      function f(x){ return Math.pow(x,-p); }
      // 1..화면끝 넓이 색칠
      var a=1, bv=9, n=200, h=(bv-a)/n; for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h; ctx.fillStyle='rgba(185,156,255,0.18)'; ctx.fillRect(P.X(a+k*h),P.Y(f(xm)),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(0)-P.Y(f(xm))); }
      P.axes(); P.curve(f, VIO);
      var big=integ(f,1,2000);   // 1..아주 먼 곳까지 실제 누적 → 수렴이면 유한, 발산이면 큼
      var conv = p>1;
      var limit = conv? 1/(p-1) : Infinity;
      E.big('∫₁^∞ x^(−'+p.toFixed(1)+') dx = '+(conv?limit.toFixed(3)+' (수렴)':'∞ (발산)'),
        conv?'p>1: 꼬리가 충분히 빨리 0으로 가 넓이가 유한합니다 (≈'+big.toFixed(2)+')':'p≤1: 꼬리가 너무 두꺼워 넓이가 무한대로 커집니다'); }
  },

  // 8.5 수치적분 — 사다리꼴 vs 심슨  ∫₀^π sin x dx = 2
  { id:'calc8_05',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.3,3.5,-0.2,1.3);
      E.controls('<div class="ctrl"><label>구간 수 n</label><input type="range" id="nn" min="2" max="20" step="2" value="4"><output id="nno">4</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(380+self.s.n*10,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=0, b=Math.PI;
      function f(x){return Math.sin(x);}
      var h=(b-a)/n;
      // 사다리꼴 시각화 + 합
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; var trap=0;
      for(var k=0;k<n;k++){ var x0=a+k*h, x1=a+(k+1)*h; ctx.fillStyle='rgba(255,210,122,0.14)';
        ctx.beginPath(); ctx.moveTo(P.X(x0),P.Y(0)); ctx.lineTo(P.X(x0),P.Y(f(x0))); ctx.lineTo(P.X(x1),P.Y(f(x1))); ctx.lineTo(P.X(x1),P.Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
        trap += (f(x0)+f(x1))/2*h; }
      P.axes(); P.curve(f, VIO);
      // 심슨(실계산)
      var simp=f(a)+f(b); for(var i=1;i<n;i++) simp += (i%2?4:2)*f(a+i*h); simp*=h/3;
      E.big('사다리꼴 '+trap.toFixed(4)+'  ·  심슨 '+simp.toFixed(4), '참값 2 — 심슨법(포물선 근사)이 같은 n에서 훨씬 정확합니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
