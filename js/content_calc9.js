/* 미적분학 9장 — 미분방정식 (Stewart Ch.9)
   9.1 기울기장 · 9.2 오일러법 · 9.3 지수 성장·감쇠 · 9.4 로지스틱 · 9.5 뉴턴 냉각
   동작만. 텍스트=content/calc9.json. 보라 테마. 골든룰=해곡선은 전부 오일러법 실적분. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';

  var scenes = [

  // 9.1 기울기장 — dy/dx = x − y, 화살표를 따라 흐르는 해곡선
  { id:'calc9_01',
    enter:function(E){ this.s={y0:1}; E.Plot.range(-4,4,-4,4);
      E.controls('<div class="ctrl"><label>초기값 y₀</label><input type="range" id="y0" min="-3" max="3" step="0.2" value="1"><output id="y0o">1.0</output></div>');
      var self=this; E.bind('#y0','input',function(e){ self.s.y0=+e.target.value; document.getElementById('y0o').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s;
      function f(x,y){ return x - y; }
      P.axes();
      // 기울기장(작은 선분)
      ctx.strokeStyle='rgba(185,156,255,0.45)'; ctx.lineWidth=1;
      for(var gx=-3.5;gx<=3.5;gx+=1){ for(var gy=-3.5;gy<=3.5;gy+=1){ var m=f(gx,gy), L=0.34, n=Math.sqrt(1+m*m), dx=L/n, dy=L*m/n;
        ctx.beginPath(); ctx.moveTo(P.X(gx-dx),P.Y(gy-dy)); ctx.lineTo(P.X(gx+dx),P.Y(gy+dy)); ctx.stroke(); } }
      // 해곡선(오일러 적분, 초기값 (-4,y0))
      var x=-4, y=s.y0, h=0.02; ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(y));
      while(x<4){ y+=f(x,y)*h; x+=h; ctx.lineTo(P.X(x),P.Y(Math.max(-5,Math.min(5,y)))); } ctx.stroke();
      P.dot(-4,s.y0,GRN);
      E.big('dy/dx = x − y', '기울기장(화살표)은 각 점에서 해가 가야 할 방향. 초기값 y₀가 경로 하나를 고릅니다'); }
  },

  // 9.2 오일러법 — 근사 vs 참값  y'=y, y(0)=1 → eˣ
  { id:'calc9_02',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.2,2.2,-0.3,8);
      E.controls('<div class="ctrl"><label>스텝 수 n</label><input type="range" id="en" min="2" max="40" step="1" value="4"><output id="eno">4</output></div>');
      var self=this; E.bind('#en','input',function(e){ self.s.n=+e.target.value; document.getElementById('eno').textContent=e.target.value; E.blip(360+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=0, b=2;
      P.axes(); P.curve(function(x){return Math.exp(x);}, VIO);   // 참값 eˣ
      // 오일러 절선
      var h=(b-a)/n, x=a, y=1; ctx.strokeStyle=GLD; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(y));
      for(var k=0;k<n;k++){ y+=y*h; x+=h; ctx.lineTo(P.X(x),P.Y(y)); P.dot(x,y,'rgba(255,210,122,0.7)'); } ctx.stroke();
      var err=Math.abs(y-Math.exp(2));
      E.big('오일러 y(2) ≈ '+y.toFixed(3)+'   (참값 e² ≈ 7.389)', '접선 방향으로 한 걸음씩 — 스텝 n을 늘리면 참값 eˣ에 수렴 (오차 '+err.toFixed(3)+')'); }
  },

  // 9.3 지수 성장·감쇠  y'=ky → y=y₀eᵏᵗ
  { id:'calc9_03',
    enter:function(E){ this.s={k:0.6}; E.Plot.range(-0.2,5.2,-0.3,7);
      E.controls('<div class="ctrl"><label>비율 k</label><input type="range" id="ek" min="-1" max="1" step="0.05" value="0.6"><output id="eko">0.60</output></div>');
      var self=this; E.bind('#ek','input',function(e){ self.s.k=+e.target.value; document.getElementById('eko').textContent=(+e.target.value).toFixed(2); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, k=s.k;
      P.axes();
      // 오일러 적분 y'=ky, y0=1
      var t=0, y=1, h=0.01; ctx.strokeStyle=VIO; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(1));
      while(t<5){ y+=k*y*h; t+=h; ctx.lineTo(P.X(t),P.Y(Math.min(7,y))); } ctx.stroke();
      P.dot(0,1,GRN);
      var y5=Math.exp(k*5);
      E.big('dy/dt = '+k.toFixed(2)+'y   →   y = e^('+k.toFixed(2)+'t)', k>0.02?'k>0: 현재 크기에 비례해 증가 — 인구·복리·전염 초기':k<-0.02?'k<0: 비례해 감소 — 방사성 붕괴·약물 농도':'k≈0: 거의 일정'); }
  },

  // 9.4 로지스틱 — dy/dt = k·y·(1−y/M)  S자 곡선, 수용한계 M
  { id:'calc9_04',
    enter:function(E){ this.s={y0:0.4}; E.Plot.range(-0.2,8.2,-0.3,7);
      E.controls('<div class="ctrl"><label>초기 개체수 y₀</label><input type="range" id="ly" min="0.2" max="6.5" step="0.1" value="0.4"><output id="lyo">0.4</output></div>');
      var self=this; E.bind('#ly','input',function(e){ self.s.y0=+e.target.value; document.getElementById('lyo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, k=1.4, M=6;
      P.axes();
      // 수용한계선
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(M)); ctx.lineTo(P.X(8),P.Y(M)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('수용한계 M='+M, P.X(6.1), P.Y(M)-6);
      // 오일러 적분
      var t=0, y=s.y0, h=0.01; ctx.strokeStyle=VIO; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(y));
      while(t<8){ y+=k*y*(1-y/M)*h; t+=h; ctx.lineTo(P.X(t),P.Y(y)); } ctx.stroke();
      P.dot(0,s.y0,GLD);
      E.big('dy/dt = k·y·(1 − y/M)', '처음엔 지수처럼 폭발, 한계 M에 다가가면 멈춤 — 현실의 성장은 S자입니다'); }
  },

  // 9.5 뉴턴 냉각  dT/dt = −k(T − T_env)  커피 식기
  { id:'calc9_05',
    enter:function(E){ this.s={env:20}; E.Plot.range(-0.3,8.3,-5,95);
      E.controls('<div class="ctrl"><label>주변온도 T_env</label><input type="range" id="te" min="0" max="40" step="1" value="20"><output id="teo">20</output></div>');
      var self=this; E.bind('#te','input',function(e){ self.s.env=+e.target.value; document.getElementById('teo').textContent=e.target.value; E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, env=s.env, k=0.6;
      P.axes();
      // 주변온도선
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(env)); ctx.lineTo(P.X(8),P.Y(env)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('주변 '+env+'°', P.X(6.4), P.Y(env)-6);
      // 오일러 적분 T0=90
      var t=0, T=90, h=0.01; ctx.strokeStyle=VIO; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(90));
      while(t<8){ T+=-k*(T-env)*h; t+=h; ctx.lineTo(P.X(t),P.Y(T)); } ctx.stroke();
      P.dot(0,90,GLD);
      var Tend=env+(90-env)*Math.exp(-k*8);
      E.big('dT/dt = −k(T − '+env+'°)', '온도차에 비례해 식습니다 — 빠르게 식다가 주변온도('+env+'°)에 다가가며 느려집니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
