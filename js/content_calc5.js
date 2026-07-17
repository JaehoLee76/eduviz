/* 미적분학 5장 — 미분의 응용 (Stewart Ch.4)
   5.1 극값과 임계점 · 5.2 평균값 정리 · 5.3 최적화 · 5.4 뉴턴 방법 · 5.5 관련 변화율
   동작만. 텍스트=content/calc5.json. 보라 테마. 골든룰=전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }

  var scenes = [

  // 5.1 극값 — f′=0 인 곳  f(x)=x³−3x (극대 x=−1, 극소 x=1)
  { id:'calc5_01',
    enter:function(E){ this.s={a:-1.8}; E.Plot.range(-2.5,2.5,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>점 a</label><input type="range" id="ea" min="-2.2" max="2.2" step="0.05" value="-1.8"><output id="eao">-1.80</output></div>');
      var self=this; E.bind('#ea','input',function(e){ self.s.a=+e.target.value; document.getElementById('eao').textContent=(+e.target.value).toFixed(2); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function f(x){return x*x*x-3*x;}
      P.axes(); P.curve(f, VIO);
      var fa=f(a), m=ndf(f,a), flat=Math.abs(m)<0.06;
      ctx.strokeStyle=flat?GRN:GLD; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(a-1),P.Y(fa+m*(-1))); ctx.lineTo(P.X(a+1),P.Y(fa+m*(1))); ctx.stroke();
      ctx.fillStyle=flat?GRN:GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("f '(a) ≈ "+m.toFixed(2), P.X(a)+10, P.Y(fa)-10);
      P.dot(a,fa,flat?GRN:VIO);
      // 임계점 표시
      P.dot(-1,f(-1),'rgba(126,224,176,0.5)','극댓값 = '+f(-1).toFixed(2)); P.dot(1,f(1),'rgba(126,224,176,0.5)','극솟값 = '+f(1).toFixed(2));
      E.big("f '("+a.toFixed(2)+") = "+m.toFixed(2)+(flat?'  ← 극점!':''),
        flat?(a<0?'기울기 0 = 극대(언덕 꼭대기)':'기울기 0 = 극소(골짜기 바닥)'):'접선이 수평(기울기 0)이 되는 곳이 극대·극소'); }
  },

  // 5.2 평균값 정리 — 할선과 평행한 접선이 존재  f(x)=0.4x³−x on [−2,2]
  { id:'calc5_02',
    enter:function(E){ this.s={c:-1.5}; E.Plot.range(-2.5,2.5,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>점 c</label><input type="range" id="mc" min="-2" max="2" step="0.02" value="-1.5"><output id="mco">-1.50</output></div>');
      var self=this; E.bind('#mc','input',function(e){ self.s.c=+e.target.value; document.getElementById('mco').textContent=(+e.target.value).toFixed(2); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, c=s.c, A=-2, B=2;
      function f(x){return 0.4*x*x*x-x;}
      P.axes(); P.curve(f, VIO);
      var sec=(f(B)-f(A))/(B-A);                          // 할선 기울기(평균변화율)
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(P.X(A),P.Y(f(A))); ctx.lineTo(P.X(B),P.Y(f(B))); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('할선 기울기 = '+sec.toFixed(2), P.X(0)+6, P.Y((f(A)+f(B))/2)-8);
      P.dot(A,f(A),BLU); P.dot(B,f(B),BLU);
      var mc=ndf(f,c), match=Math.abs(mc-sec)<0.05;
      ctx.strokeStyle=match?GRN:GLD; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(c-1),P.Y(f(c)+mc*(-1))); ctx.lineTo(P.X(c+1),P.Y(f(c)+mc*(1))); ctx.stroke();
      ctx.fillStyle=match?GRN:GLD; ctx.fillText("접선 f '(c) = "+mc.toFixed(2), P.X(c)+10, P.Y(f(c))-10);
      P.dot(c,f(c),match?GRN:VIO);
      E.big('할선 '+sec.toFixed(2)+' vs 접선 f′(c) '+mc.toFixed(2)+(match?'  ← 일치!':''),
        '구간 어딘가엔 평균변화율과 똑같은 순간변화율이 반드시 있습니다'); }
  },

  // 5.3 최적화 — 둘레 20인 직사각형 최대 넓이  넓이=w(10−w)
  { id:'calc5_03',
    enter:function(E){ this.s={w:2}; E.Plot.range(0,10,0,28).lab('w','A');
      E.controls('<div class="ctrl"><label>가로 w</label><input type="range" id="ow" min="0.5" max="9.5" step="0.1" value="2"><output id="owo">2.0</output></div>');
      var self=this; E.bind('#ow','input',function(e){ self.s.w=+e.target.value; document.getElementById('owo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, w=s.w, h=10-w, area=w*h;
      P.axes(); P.curve(function(x){return x*(10-x);}, VIO);   // 넓이 함수
      P.dot(w, area, area>24.9?GRN:GLD,'넓이 A = '+area.toFixed(1));
      P.dot(5,25,'rgba(126,224,176,0.45)','최댓값 A = 25 (w=5)');  // 최댓값(미분=0)
      // 실제 직사각형 미리보기(좌상단)
      var ox=E.W*0.10, oy=E.H*0.30, sc=10;
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.strokeRect(ox, oy-h*sc*0.5, w*sc*0.7, h*sc*0.5);
      ctx.fillStyle='rgba(255,210,122,0.12)'; ctx.fillRect(ox, oy-h*sc*0.5, w*sc*0.7, h*sc*0.5);
      E.big('가로 '+w.toFixed(1)+' × 세로 '+h.toFixed(1)+' = 넓이 '+area.toFixed(2),
        (area>24.9?'정사각형(5×5)일 때 넓이가 최대! ':'')+'넓이 함수의 꼭대기(미분 0)가 최적해'); }
  },

  // 5.4 뉴턴 방법 — 접선으로 근 찾기  f(x)=x²−2 → √2, 반복 n
  { id:'calc5_04',
    enter:function(E){ this.s={n:0}; E.Plot.range(0,3,-2.5,7).lab('x','y');
      E.controls('<div class="ctrl"><label>반복 n</label><input type="range" id="nn" min="0" max="6" step="1" value="0"><output id="nno">0</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(420+self.s.n*40,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n;
      function f(x){return x*x-2;} function fp(x){return 2*x;}
      P.axes(); P.curve(f, VIO);
      var x=2.0;                                            // x0=2
      for(var k=0;k<n;k++){ var xn=x - f(x)/fp(x);          // 뉴턴 반복(실계산)
        ctx.strokeStyle='rgba(255,210,122,0.8)'; ctx.lineWidth=1.6; ctx.beginPath();
        ctx.moveTo(P.X(x),P.Y(f(x))); ctx.lineTo(P.X(xn),P.Y(0)); ctx.stroke();   // 접선이 x축 만나는 점
        ctx.strokeStyle='rgba(155,153,163,0.4)'; ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(f(x))); ctx.lineTo(P.X(x),P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(155,153,163,0.7)'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('x'+k+'='+x.toFixed(3), P.X(x), P.Y(0)+16);
        P.dot(x,f(x),'rgba(185,156,255,0.6)'); x=xn; }
      P.dot(x,0,GRN,'x'+n+' = '+x.toFixed(4));
      if(n>0){ ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('xₙ₊₁ = xₙ − f/f′ = '+x.toFixed(6), E.W*0.42, E.H*0.18); }
      E.big('x'+n+' = '+x.toFixed(6), '√2 = 1.414214… 접선을 타고 내려가면 단 몇 번에 수렴'); }
  },

  // 5.5 관련 변화율 — 미끄러지는 사다리  길이5, 바닥 x, 벽 y=√(25−x²)
  { id:'calc5_05',
    enter:function(E){ this.s={x:1.5}; E.Plot.range(-0.5,5.5,-0.5,5.5).lab('x','y');
      E.controls('<div class="ctrl"><label>바닥거리 x</label><input type="range" id="lx" min="0.3" max="4.9" step="0.05" value="1.5"><output id="lxo">1.50</output></div>');
      var self=this; E.bind('#lx','input',function(e){ self.s.x=+e.target.value; document.getElementById('lxo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, x=s.x, L=5;
      var y=Math.sqrt(L*L-x*x);                             // 벽 높이
      // 벽·바닥
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(5.3)); ctx.lineTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(5.3),P.Y(0)); ctx.stroke();
      // 사다리
      ctx.strokeStyle=VIO; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(0)); ctx.lineTo(P.X(0),P.Y(y)); ctx.stroke();
      ctx.fillStyle=VIO; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('사다리 L = '+L, P.X(x/2)+8, P.Y(y/2)-6);
      P.dot(x,0,GLD,'바닥 x = '+x.toFixed(2)); P.dot(0,y,GRN,'벽 y = '+y.toFixed(2));
      // dx/dt=1 가정 → dy/dt = −x/y
      var dydt = -x/y;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('바닥 x = '+x.toFixed(2)+'  ·  벽 y = '+y.toFixed(2), E.W*0.55, E.H*0.26);
      ctx.fillStyle=GLD; ctx.fillText('바닥이 1m/s로 밀릴 때', E.W*0.55, E.H*0.26+22);
      ctx.fillStyle=GRN; ctx.fillText('꼭대기 낙하속도 dy/dt = '+dydt.toFixed(2)+' m/s', E.W*0.55, E.H*0.26+42);
      E.big('dy/dt = −(x/y)·dx/dt = '+dydt.toFixed(2),
        '바닥이 벽에서 멀어질수록 꼭대기는 점점 더 빨리 떨어집니다 (x²+y²=L² 미분)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
