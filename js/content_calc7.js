/* 미적분학 7장 — 적분의 응용 (Stewart Ch.6)
   7.1 곡선 사이 넓이 · 7.2 회전체 부피 · 7.3 평균값 · 7.4 일(Work) · 7.5 호의 길이
   동작만. 텍스트=content/calc7.json. 보라 테마. 골든룰=넓이·부피·일 전부 적분 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  function integ(f,a,b){ var n=2000,h=(b-a)/n,s=0; for(var i=0;i<n;i++) s+=f(a+(i+0.5)*h)*h; return s; }

  var scenes = [

  // 7.1 곡선 사이의 넓이  위 y=x+2, 아래 y=x²  (교점 −1, 2)
  { id:'calc7_01',
    enter:function(E){ this.s={b:2}; E.Plot.range(-2.5,3,-1,5.5).lab('x','y');
      E.controls('<div class="ctrl"><label>오른쪽 끝 b</label><input type="range" id="ab" min="-1" max="2" step="0.05" value="2"><output id="abo">2.00</output></div>');
      var self=this; E.bind('#ab','input',function(e){ self.s.b=+e.target.value; document.getElementById('abo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b, a=-1;
      function top(x){return x+2;} function bot(x){return x*x;}
      var n=160,h=(b-a)/n; for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h; ctx.fillStyle='rgba(185,156,255,0.22)'; ctx.fillRect(P.X(a+k*h),P.Y(top(xm)),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(bot(xm))-P.Y(top(xm))); }
      P.axes(); P.curve(top, GLD); P.curve(bot, BLU);
      var ar=integ(function(x){return top(x)-bot(x);}, a, b);
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('y = x+2 (위)', P.X(1.1), P.Y(top(1.1))-8);
      ctx.fillStyle=BLU; ctx.fillText('y = x² (아래)', P.X(-2.2), P.Y(bot(-2.2))-6);
      ctx.fillStyle=VIO; ctx.fillText('넓이 ≈ '+ar.toFixed(3), P.X(0.2), P.Y(1.4));
      E.big('넓이 = ∫(위 − 아래) dx = '+ar.toFixed(3), '두 곡선 사이 넓이 = (위 함수 − 아래 함수)의 적분'); }
  },

  // 7.2 회전체 부피(원판)  y=√x, x축 회전, V=∫πf² dx
  { id:'calc7_02',
    enter:function(E){ this.s={n:6}; E.Plot.range(-0.3,4.3,-2.2,2.2).lab('x','y');
      E.controls('<div class="ctrl"><label>원판 수 n</label><input type="range" id="vn" min="2" max="40" step="1" value="6"><output id="vno">6</output></div>');
      var self=this; E.bind('#vn','input',function(e){ self.s.n=+e.target.value; document.getElementById('vno').textContent=e.target.value; E.blip(360+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=0, b=4;
      function f(x){return Math.sqrt(x);}
      var h=(b-a)/n, vol=0;
      for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h, r=f(xm); vol+=Math.PI*r*r*h;     // 원판 부피 Σπr²h(실계산)
        ctx.fillStyle='rgba(185,156,255,0.16)'; ctx.strokeStyle='rgba(185,156,255,0.5)'; ctx.lineWidth=0.8;
        ctx.fillRect(P.X(a+k*h),P.Y(r),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(-r)-P.Y(r));
        ctx.strokeRect(P.X(a+k*h),P.Y(r),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(-r)-P.Y(r)); }
      P.axes(); P.curve(f, GLD); P.curve(function(x){return -f(x);}, 'rgba(255,210,122,0.5)');
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('y = √x', P.X(3.4), P.Y(f(3.4))-8);
      ctx.fillStyle=VIO; ctx.fillText('Σ π r²Δx ≈ '+vol.toFixed(3), P.X(0.2), P.Y(1.9));
      E.big('부피 = ∫π[f(x)]² dx ≈ '+vol.toFixed(3), '회전체를 얇은 원판으로 쪼개 πr²×두께를 더합니다 (참값 8π≈25.13)'); }
  },

  // 7.3 평균값  f(x)=1+sin x on [0,b], 평균 = (1/b)∫f
  { id:'calc7_03',
    enter:function(E){ this.s={b:4}; E.Plot.range(-0.4,6.6,-0.4,2.4).lab('x','y');
      E.controls('<div class="ctrl"><label>구간 끝 b</label><input type="range" id="vb" min="1" max="6.28" step="0.04" value="4"><output id="vbo">4.00</output></div>');
      var self=this; E.bind('#vb','input',function(e){ self.s.b=+e.target.value; document.getElementById('vbo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b;
      function f(x){return 1+Math.sin(x);}
      var avg=integ(f,0,b)/b;
      // f 아래 넓이
      var n=160,h=b/n; for(var k=0;k<n;k++){ var xm=h*(k+0.5); ctx.fillStyle='rgba(185,156,255,0.16)'; ctx.fillRect(P.X(k*h),P.Y(f(xm)),P.X((k+1)*h)-P.X(k*h),P.Y(0)-P.Y(f(xm))); }
      // 평균 높이 직사각형(같은 넓이)
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(avg)); ctx.lineTo(P.X(b),P.Y(avg)); ctx.stroke(); ctx.setLineDash([]);
      P.axes(); P.curve(f, VIO);
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=VIO; ctx.fillText('y = 1+sin x', P.X(b*0.45), P.Y(f(b*0.45))+14);
      ctx.fillStyle=GRN; ctx.fillText('평균값 = '+avg.toFixed(3), P.X(0.1), P.Y(avg)-6);
      E.big('평균값 = (1/b)∫f dx = '+avg.toFixed(3), '곡선 아래 넓이를 같은 넓이의 직사각형으로 펴면, 그 높이가 평균입니다'); }
  },

  // 7.4 일(Work) — 늘어나는 용수철  F=kx, W=∫F dx=½kd²
  { id:'calc7_04',
    enter:function(E){ this.s={d:1.5}; E.Plot.range(-0.3,3.2,-0.5,7).lab('x','F');
      E.controls('<div class="ctrl"><label>늘인 길이 d</label><input type="range" id="wd" min="0.2" max="3" step="0.05" value="1.5"><output id="wdo">1.50</output></div>');
      var self=this; E.bind('#wd','input',function(e){ self.s.d=+e.target.value; document.getElementById('wdo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, d=s.d, k=2;
      function F(x){return k*x;}
      var n=120,h=d/n; for(var i=0;i<n;i++){ var xm=h*(i+0.5); ctx.fillStyle='rgba(255,210,122,0.22)'; ctx.fillRect(P.X(i*h),P.Y(F(xm)),P.X((i+1)*h)-P.X(i*h),P.Y(0)-P.Y(F(xm))); }
      P.axes(); P.curve(F, VIO);
      var work=integ(F,0,d);
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=VIO; ctx.fillText('F = kx', P.X(d*0.6), P.Y(F(d*0.6))-8);
      ctx.fillStyle=GLD; ctx.fillText('일 W = ∫F dx ≈ '+work.toFixed(3)+' J', P.X(0.15), P.Y(F(d)*0.45));
      // 용수철 그림(상단)
      var sy=E.H*0.13, x0=E.W*0.12, len=E.W*0.18+d*E.W*0.09;
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,sy);
      for(var c=0;c<=20;c++){ var px=x0+len*c/20, py=sy+(c%2?8:-8); ctx.lineTo(px,py); } ctx.lineTo(x0+len,sy); ctx.stroke();
      ctx.fillStyle=GLD; ctx.fillRect(x0+len,sy-10,16,20);
      E.big('일 W = ∫F dx = ½kd² = '+work.toFixed(3)+' J', '힘이 변하면 일 = 힘-거리 그래프 아래 넓이 (용수철은 ½kd²)'); }
  },

  // 7.5 호의 길이  f(x)=0.5x² on [0,2], n조각 근사 → ∫√(1+f'²)
  { id:'calc7_05',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.3,2.5,-0.4,2.6).lab('x','y');
      E.controls('<div class="ctrl"><label>조각 수 n</label><input type="range" id="sn" min="1" max="30" step="1" value="4"><output id="sno">4</output></div>');
      var self=this; E.bind('#sn','input',function(e){ self.s.n=+e.target.value; document.getElementById('sno').textContent=e.target.value; E.blip(380+self.s.n*10,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=0, b=2;
      function f(x){return 0.5*x*x;}
      P.axes(); P.curve(f, VIO);
      // n개 선분 근사(실측 길이 합)
      var h=(b-a)/n, len=0; ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=n;k++){ var x=a+k*h, px=P.X(x), py=P.Y(f(x)); if(k===0)ctx.moveTo(px,py); else { ctx.lineTo(px,py); var dx=h, dy=f(a+k*h)-f(a+(k-1)*h); len+=Math.sqrt(dx*dx+dy*dy); } }
      ctx.stroke();
      for(var j=0;j<=n;j++){ var xj=a+j*h; P.dot(xj,f(xj),GRN); }
      var exact=integ(function(x){var d=x;return Math.sqrt(1+d*d);},a,b);  // ∫√(1+f'²), f'=x
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=VIO; ctx.fillText('y = ½x²', P.X(1.7), P.Y(f(1.7))-8);
      ctx.fillStyle=GLD; ctx.fillText('Σ√(Δx²+Δy²) ≈ '+len.toFixed(4), P.X(0.15), P.Y(2.3));
      E.big('호의 길이 ≈ '+len.toFixed(4)+'  ('+n+'조각)', '곡선을 잘게 선분으로 잇고 길이를 더하면 ∫√(1+(f′)²) dx (참값 '+exact.toFixed(4)+')'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
