/* 미적분학 6장 — 적분 (Stewart Ch.5)
   6.1 리만합과 넓이 · 6.2 정적분(부호넓이) · 6.3 미적분의 기본정리 · 6.4 거리=속도적분 · 6.5 부정적분
   동작만. 텍스트=content/calc6.json. 보라 테마. 골든룰=넓이는 전부 리만합 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }
  function area(f,a,b){ var n=2000,h=(b-a)/n,s=0; for(var i=0;i<n;i++){ s+=f(a+(i+0.5)*h)*h; } return s; }  // 정밀 적분(중점합)

  var scenes = [

  // 6.1 리만합 — 직사각형으로 넓이 근사  f(x)=0.5x²+0.5 on [0,3], 참값 6
  { id:'calc6_01',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.3,3.3,-0.5,6).lab('x','y');
      E.controls('<div class="ctrl"><label>칸 수 n</label><input type="range" id="rn" min="1" max="50" step="1" value="4"><output id="rno">4</output></div>');
      var self=this; E.bind('#rn','input',function(e){ self.s.n=+e.target.value; document.getElementById('rno').textContent=e.target.value; E.blip(360+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=0, b=3;
      function f(x){return 0.5*x*x+0.5;}
      var h=(b-a)/n, sum=0;
      for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h, fm=f(xm); sum+=fm*h;     // 중점합(실계산)
        var rx=P.X(a+k*h), rw=P.X(a+(k+1)*h)-rx, ry=P.Y(fm), rh=P.Y(0)-ry;
        ctx.fillStyle='rgba(185,156,255,0.18)'; ctx.fillRect(rx,ry,rw,rh);
        ctx.strokeStyle='rgba(185,156,255,0.55)'; ctx.lineWidth=0.8; ctx.strokeRect(rx,ry,rw,rh); }
      P.axes(); P.curve(f, VIO);
      ctx.fillStyle=VIO; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('y = f(x)', P.X(2.3), P.Y(f(2.3))-8);
      ctx.fillStyle=DIM; ctx.fillText('Σ f(xᵢ)Δx ≈ '+sum.toFixed(3)+'   (Δx = '+h.toFixed(3)+')', E.W*0.50, E.H*0.18);
      E.big('리만합 = '+sum.toFixed(3)+'  ('+n+'칸)', '칸을 잘게 쪼갤수록 참값 ∫ = 6 에 수렴합니다 (오차 '+Math.abs(sum-6).toFixed(3)+')'); }
  },

  // 6.2 정적분 = 부호 있는 넓이  f(x)=sin x on [0,b]
  { id:'calc6_02',
    enter:function(E){ this.s={b:2.0}; E.Plot.range(-0.4,6.6,-1.4,1.4).lab('x','y');
      E.controls('<div class="ctrl"><label>윗끝 b</label><input type="range" id="ub" min="0.2" max="6.28" step="0.04" value="2.0"><output id="ubo">2.00</output></div>');
      var self=this; E.bind('#ub','input',function(e){ self.s.b=+e.target.value; document.getElementById('ubo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b;
      function f(x){return Math.sin(x);}
      // 부호 넓이 색칠
      var n=240, h=b/n;
      for(var k=0;k<n;k++){ var x0=k*h, fm=f(x0+h/2); var rx=P.X(x0), rw=P.X(x0+h)-rx, ry=P.Y(Math.max(0,fm)), rh=Math.abs(P.Y(fm)-P.Y(0));
        ctx.fillStyle=fm>=0?'rgba(126,224,176,0.30)':'rgba(240,136,138,0.30)'; ctx.fillRect(rx, fm>=0?P.Y(fm):P.Y(0), rw, rh); }
      P.axes(); P.curve(f, VIO);
      var val=area(f,0,b);   // 1−cos b
      ctx.fillStyle=VIO; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('y = sin x', P.X(b+0.15), P.Y(f(b+0.15)));
      ctx.fillStyle=DIM; ctx.fillText('부호넓이 ∫₀ᵇ sin x dx = '+val.toFixed(3), E.W*0.50, E.H*0.16);
      E.big('∫₀^'+b.toFixed(2)+' sin x dx = '+val.toFixed(3), 'x축 위는 +(초록), 아래는 −(분홍). 정적분은 그 합(부호넓이)입니다'); }
  },

  // 6.3 미적분의 기본정리 — 넓이누적함수 A(x)의 기울기 = f(x)
  { id:'calc6_03',
    enter:function(E){ this.s={x:1.2}; E.Plot.range(-0.3,4.3,-1.5,4).lab('x','y');
      E.controls('<div class="ctrl"><label>윗끝 x</label><input type="range" id="fx" min="0.1" max="4" step="0.05" value="1.2"><output id="fxo">1.20</output></div>');
      var self=this; E.bind('#fx','input',function(e){ self.s.x=+e.target.value; document.getElementById('fxo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, x=s.x;
      function f(t){return 0.6+0.9*Math.sin(0.9*t);}      // 피적분함수
      function A(t){return area(f,0,t);}                  // 넓이누적함수(실적분)
      // f 아래 넓이 색칠 [0,x]
      var n=200,h=x/n; for(var k=0;k<n;k++){ var x0=k*h, fm=f(x0+h/2); ctx.fillStyle='rgba(255,210,122,0.22)'; ctx.fillRect(P.X(x0),P.Y(fm),P.X(x0+h)-P.X(x0),P.Y(0)-P.Y(fm)); }
      P.axes();
      P.curve(f, GLD);                                    // f (금색)
      P.curve(A, VIO);                                    // A (보라, 누적넓이)
      var Ax=A(x), slope=ndf(A,x), fx=f(x);
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('f(x)', P.X(3.6), P.Y(f(3.6))-6);
      ctx.fillStyle=VIO; ctx.fillText('A(x) = ∫₀ˣ f', P.X(3.4), P.Y(A(3.4))+14);
      P.dot(x,Ax,VIO);
      // A의 접선(기울기=f(x)임을 보임)
      ctx.strokeStyle='rgba(185,156,255,0.8)'; ctx.lineWidth=1.6; ctx.beginPath();
      ctx.moveTo(P.X(x-0.9),P.Y(Ax+slope*(-0.9))); ctx.lineTo(P.X(x+0.9),P.Y(Ax+slope*(0.9))); ctx.stroke();
      P.dot(x,fx,GLD);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText("A'(x) = "+slope.toFixed(3)+"   =   f(x) = "+fx.toFixed(3), E.W*0.50, E.H*0.18);
      E.big("d/dx ∫₀ˣ f = f(x)", '넓이를 쌓는 함수 A를 미분하면 원래 함수 f — 미분과 적분은 역!'); }
  },

  // 6.4 거리 = 속도의 적분  v(t)=2+1.5·sin(0.8t)
  { id:'calc6_04',
    enter:function(E){ this.s={t:2}; E.Plot.range(-0.3,8.3,-0.5,4).lab('t','v');
      E.controls('<div class="ctrl"><label>시간 t</label><input type="range" id="vt" min="0.1" max="8" step="0.05" value="2"><output id="vto">2.00</output></div>');
      var self=this; E.bind('#vt','input',function(e){ self.s.t=+e.target.value; document.getElementById('vto').textContent=(+e.target.value).toFixed(2); E.blip(380,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t;
      function v(x){return 2+1.5*Math.sin(0.8*x);}
      var n=200,h=t/n; for(var k=0;k<n;k++){ var x0=k*h, vm=v(x0+h/2); ctx.fillStyle='rgba(126,224,176,0.25)'; ctx.fillRect(P.X(x0),P.Y(vm),P.X(x0+h)-P.X(x0),P.Y(0)-P.Y(vm)); }
      P.axes(); P.curve(v, VIO);
      var dist=area(v,0,t);
      ctx.fillStyle=VIO; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('v(t)', P.X(t*0.5), P.Y(v(t*0.5))+14);
      ctx.fillStyle=GRN; ctx.fillText('넓이 = 거리 = '+dist.toFixed(2), P.X(0.2), P.Y(0.3));
      // 차 트랙
      var trackY=E.H*0.12, x0=E.W*0.12, x1=E.W*0.55, far=area(v,0,8);
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x0,trackY); ctx.lineTo(x1,trackY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(x0+(dist/far)*(x1-x0),trackY,8,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('s = '+dist.toFixed(2), x0+(dist/far)*(x1-x0)-10, trackY-12);
      E.big('이동거리 = ∫₀^'+t.toFixed(2)+' v dt = '+dist.toFixed(2), '속도곡선 아래 넓이가 곧 달린 거리입니다 (속도×시간의 합)'); }
  },

  // 6.5 부정적분 — 같은 도함수를 갖는 함수 가족  F(x)=x²+C
  { id:'calc6_05',
    enter:function(E){ this.s={C:0}; E.Plot.range(-3,3,-3,6).lab('x','y');
      E.controls('<div class="ctrl"><label>적분상수 C</label><input type="range" id="ic" min="-2" max="3" step="0.5" value="0"><output id="ico">0.0</output></div>');
      var self=this; E.bind('#ic','input',function(e){ self.s.C=+e.target.value; document.getElementById('ico').textContent=(+e.target.value).toFixed(1); E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, C=s.C;
      P.axes();
      P.curve(function(x){return 2*x;}, GLD);            // f = 2x
      // 가족(흐림)
      for(var c=-2;c<=3;c+=0.5){ if(Math.abs(c-C)<0.01)continue; P.curve(function(x){return x*x+c;}, 'rgba(185,156,255,0.22)'); }
      P.curve(function(x){return x*x+C;}, VIO);          // 선택된 F=x²+C
      ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GLD; ctx.fillText('f = 2x', P.X(1.4), P.Y(2*1.4)-6);
      ctx.fillStyle=VIO; ctx.fillText('F = x² + C', P.X(1.6), P.Y(1.6*1.6+C)+6);
      // 같은 x에서 기울기 = f 확인
      var xc=1, m=ndf(function(x){return x*x+C;},xc);
      P.dot(xc, xc*xc+C, VIO);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('x=1 기울기 = '+m.toFixed(2)+' = f(1)=2 (C와 무관)', E.W*0.50, E.H*0.18);
      E.big('∫ 2x dx = x² + C', '미분하면 사라지는 상수 C 때문에, 부정적분은 평행이동한 곡선 가족입니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
