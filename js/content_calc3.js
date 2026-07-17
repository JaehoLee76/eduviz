/* 미적분학 3장 — 도함수 (Stewart Ch.2.7~3)
   3.1 도함수=기울기 함수 · 3.2 거듭제곱 법칙 · 3.3 위치·속도·가속도 · 3.4 sin의 도함수 · 3.5 eˣ
   동작만. 텍스트=content/calc3.json. 보라 테마. 골든룰=기울기는 전부 수치미분 실측. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }   // 수치 도함수

  var scenes = [

  // 3.1 도함수 = 기울기 함수  f(x)=0.3x³−x, f′를 점으로 추적
  { id:'calc3_01',
    enter:function(E){ this.s={a:-1.5}; E.Plot.range(-3,3,-3.5,3.5).lab('x','y');
      E.controls('<div class="ctrl"><label>접점 a</label><input type="range" id="da" min="-2.6" max="2.6" step="0.05" value="-1.5"><output id="dao">-1.50</output></div>');
      var self=this; E.bind('#da','input',function(e){ self.s.a=+e.target.value; document.getElementById('dao').textContent=(+e.target.value).toFixed(2); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function f(x){ return 0.3*x*x*x - x; }
      P.axes();
      P.curve(f, VIO);                                   // 원함수
      P.curve(function(x){return ndf(f,x);}, GLD);       // 도함수(실측 기울기로 그린 곡선)
      var fa=f(a), m=ndf(f,a);
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(a-1.3),P.Y(fa+m*(-1.3))); ctx.lineTo(P.X(a+1.3),P.Y(fa+m*(1.3))); ctx.stroke();
      var g31=P.geom();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("접선 기울기 = f '("+a.toFixed(2)+") ≈ "+m.toFixed(2), g31.left+8, g31.top+16);  // 축 눈금과 안 겹치게 플롯 좌상단 고정
      P.dot(a,fa,VIO); P.dot(a,m,GLD,"f '("+a.toFixed(2)+")="+m.toFixed(2));
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("보라 f(x) · 금색 f '(x)", g31.left+8, g31.top+36);
      E.big("f '("+a.toFixed(2)+") = "+m.toFixed(2), '한 점의 기울기를 모으면 새 곡선(도함수)이 됩니다'); }
  },

  // 3.2 거듭제곱 법칙  d/dx xⁿ = n x^(n−1)
  { id:'calc3_02',
    enter:function(E){ this.s={n:2}; E.Plot.range(-2.2,2.2,-3,5).lab('x','y');
      E.controls('<div class="ctrl"><label>지수 n</label><input type="range" id="pn" min="1" max="4" step="1" value="2"><output id="pno">2</output></div>');
      var self=this; E.bind('#pn','input',function(e){ self.s.n=+e.target.value; document.getElementById('pno').textContent=e.target.value; E.blip(420+self.s.n*40,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n;
      function f(x){ return Math.pow(x,n); }
      P.axes(); P.curve(f, VIO);
      P.curve(function(x){return n*Math.pow(x,n-1);}, GLD);   // 공식 도함수
      // 검산: x=1.2에서 수치미분 vs 공식
      var xc=1.2, num=ndf(f,xc), form=n*Math.pow(xc,n-1);
      P.dot(xc,num,GRN,"f '(1.2) ≈ "+num.toFixed(2));
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('x=1.2 검산: 수치미분 '+num.toFixed(2)+' = 공식 '+form.toFixed(2), E.W*0.58, E.H*0.20);
      E.big('d/dx x'+(['','¹','²','³','⁴'][n])+' = '+(n===1?'1':n+'x'+(n-1===1?'':['⁰','¹','²','³'][n-1])),
        '지수를 앞으로 내리고, 지수는 1 줄입니다 (보라=함수, 금색=도함수)'); }
  },

  // 3.3 위치 → 속도 → 가속도  s(t)=t³−6t²+9t (앞뒤로 움직이는 물체)
  { id:'calc3_03',
    enter:function(E){ this.s={t:0.5}; E.Plot.range(0,4.2,-2,6).lab('t','s');
      E.controls('<div class="ctrl"><label>시간 t</label><input type="range" id="mt" min="0" max="4" step="0.05" value="0.5"><output id="mto">0.50</output></div>');
      var self=this; E.bind('#mt','input',function(e){ self.s.t=+e.target.value; document.getElementById('mto').textContent=(+e.target.value).toFixed(2); E.blip(360+self.s.t*40,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t;
      function pos(x){ return x*x*x - 6*x*x + 9*x; }
      P.axes(); P.curve(pos, VIO);
      var sp=pos(t), v=ndf(pos,t), ac=(ndf(pos,t+1e-3)-ndf(pos,t-1e-3))/2e-3;   // s, s′, s″ 실측
      P.dot(t, sp, GRN);
      // 물체 트랙(상단) — 위치 sp를 점으로
      var trackY=E.H*0.12, x0=E.W*0.12, x1=E.W*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,trackY); ctx.lineTo(x1,trackY); ctx.stroke();
      var bx=x0+(sp/6)*(x1-x0); ctx.fillStyle=v>=0?GRN:PNK; ctx.beginPath(); ctx.arc(Math.max(x0,Math.min(x1,bx)),trackY,8,0,7); ctx.fill();
      ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillStyle=VIO; ctx.fillText('위치 s = '+sp.toFixed(2), E.W*0.66, E.H*0.30);
      ctx.fillStyle=GLD; ctx.fillText('속도 s′= '+v.toFixed(2)+(v>=0?' (전진)':' (후진)'), E.W*0.66, E.H*0.30+22);
      ctx.fillStyle=BLU; ctx.fillText('가속도 s″= '+ac.toFixed(2), E.W*0.66, E.H*0.30+44);
      E.big('t = '+t.toFixed(2)+' · v = '+v.toFixed(2), '위치를 미분하면 속도, 또 미분하면 가속도입니다'); }
  },

  // 3.4 sin의 도함수는 cos
  { id:'calc3_04',
    enter:function(E){ this.s={a:0.6}; E.Plot.range(-6.5,6.5,-1.8,1.8).lab('x','y');
      E.controls('<div class="ctrl"><label>접점 a</label><input type="range" id="sa" min="-6" max="6" step="0.1" value="0.6"><output id="sao">0.6</output></div>');
      var self=this; E.bind('#sa','input',function(e){ self.s.a=+e.target.value; document.getElementById('sao').textContent=(+e.target.value).toFixed(1); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      P.axes();
      P.curve(function(x){return Math.sin(x);}, VIO);
      P.curve(function(x){return ndf(Math.sin,x);}, GLD);   // 실측 도함수 = cos
      var fa=Math.sin(a), m=ndf(Math.sin,a);
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(a-1.4),P.Y(fa+m*(-1.4))); ctx.lineTo(P.X(a+1.4),P.Y(fa+m*(1.4))); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("기울기 = cos("+a.toFixed(1)+") ≈ "+m.toFixed(2), P.X(a)+10, P.Y(fa)-12);
      P.dot(a,fa,VIO,"sin x"); P.dot(a,m,GLD,"cos x");
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('보라 sin x · 금색 (sin x)′= cos x', E.W*0.62, E.H*0.18);
      E.big("(sin x)′ = cos x   ·   기울기 = "+m.toFixed(3), 'sin의 기울기 곡선이 정확히 cos과 겹칩니다 (금색)'); }
  },

  // 3.5 eˣ — 자기 자신이 도함수인 함수
  { id:'calc3_05',
    enter:function(E){ this.s={a:0.7}; E.Plot.range(-2,2.2,-0.5,7).lab('x','y');
      E.controls('<div class="ctrl"><label>접점 a</label><input type="range" id="ea" min="-1.8" max="1.9" step="0.05" value="0.7"><output id="eao">0.70</output></div>');
      var self=this; E.bind('#ea','input',function(e){ self.s.a=+e.target.value; document.getElementById('eao').textContent=(+e.target.value).toFixed(2); E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      P.axes(); P.curve(function(x){return Math.exp(x);}, VIO);
      var fa=Math.exp(a), m=ndf(Math.exp,a);                 // 기울기 = e^a = 함숫값
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(a-1.5),P.Y(fa+m*(-1.5))); ctx.lineTo(P.X(a+1.5),P.Y(fa+m*(1.5))); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("기울기 = eˣ ≈ "+m.toFixed(2), P.X(a)+10, P.Y(fa));
      P.dot(a,fa,GRN,null);
      var g35=P.geom();
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText("(a, eᵃ) = ("+a.toFixed(2)+", "+fa.toFixed(2)+")", g35.left+8, g35.top+16);  // 축 눈금과 안 겹치게 플롯 좌상단 고정
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('함숫값 e^a = '+fa.toFixed(3)+'  ·  기울기 = '+m.toFixed(3), E.W*0.50, E.H*0.20);
      E.big("(eˣ)′ = eˣ", '기울기가 언제나 자기 높이와 똑같은 유일한 함수 — 그래서 e가 특별합니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
