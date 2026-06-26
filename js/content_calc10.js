/* 미적분학 10장 — 매개변수와 극좌표 (Stewart Ch.10)
   10.1 매개변수 곡선(사이클로이드) · 10.2 매개변수 미분 · 10.3 극좌표 · 10.4 장미곡선 · 10.5 극좌표 넓이
   동작만. 텍스트=content/calc10.json. 보라 테마. 골든룰=좌표·기울기·넓이 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', DIM='#9b99a3';

  var scenes = [

  // 10.1 매개변수 곡선 — 사이클로이드(굴러가는 바퀴 위 한 점)
  { id:'calc10_01',
    enter:function(E){ this.s={t:3}; E.Plot.range(-0.5,12.8,-0.5,3);
      E.controls('<div class="ctrl"><label>매개변수 t</label><input type="range" id="ct" min="0" max="12.5" step="0.05" value="3"><output id="cto">3.00</output></div>');
      var self=this; E.bind('#ct','input',function(e){ self.s.t=+e.target.value; document.getElementById('cto').textContent=(+e.target.value).toFixed(2); E.blip(380,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t;
      function px(u){ return u-Math.sin(u); } function py(u){ return 1-Math.cos(u); }
      // 땅
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(P.X(-0.5),P.Y(0)); ctx.lineTo(P.X(12.8),P.Y(0)); ctx.stroke();
      // 자취(0..t)
      ctx.strokeStyle=VIO; ctx.lineWidth=2.4; ctx.beginPath();
      for(var u=0;u<=t+1e-9;u+=0.04){ var X=P.X(px(u)),Y=P.Y(py(u)); if(u===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 굴러가는 바퀴(중심 (t,1), 반지름 1)
      ctx.strokeStyle='rgba(126,224,176,0.6)'; ctx.lineWidth=1.6; ctx.beginPath();
      for(var a=0;a<=6.30;a+=0.1){ var wx=P.X(t+Math.cos(a)), wy=P.Y(1+Math.sin(a)); if(a===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.closePath(); ctx.stroke();
      // 바퀴살 + 점
      ctx.strokeStyle='rgba(255,210,122,0.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(P.X(t),P.Y(1)); ctx.lineTo(P.X(px(t)),P.Y(py(t))); ctx.stroke();
      P.dot(t,1,DIM); P.dot(px(t),py(t),GLD);
      E.big('x = t − sin t,   y = 1 − cos t', '바퀴 테두리의 한 점이 그리는 길 — 시간 t로 x와 y를 따로 적는 매개변수 표현'); }
  },

  // 10.2 매개변수 미분  dy/dx = (dy/dt)/(dx/dt)  타원 x=2cos t, y=sin t
  { id:'calc10_02',
    enter:function(E){ this.s={t:0.7}; E.Plot.range(-3,3,-2,2);
      E.controls('<div class="ctrl"><label>매개변수 t</label><input type="range" id="pt" min="0" max="6.28" step="0.04" value="0.7"><output id="pto">0.70</output></div>');
      var self=this; E.bind('#pt','input',function(e){ self.s.t=+e.target.value; document.getElementById('pto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t;
      function X(u){return 2*Math.cos(u);} function Y(u){return Math.sin(u);}
      ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var u=0;u<=6.30;u+=0.04){ var x=P.X(X(u)),y=P.Y(Y(u)); if(u===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      var dxdt=(X(t+1e-4)-X(t-1e-4))/2e-4, dydt=(Y(t+1e-4)-Y(t-1e-4))/2e-4, m=dydt/dxdt;
      var x0=X(t), y0=Y(t);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(x0-1.3),P.Y(y0+m*(-1.3))); ctx.lineTo(P.X(x0+1.3),P.Y(y0+m*(1.3))); ctx.stroke();
      P.dot(x0,y0,GRN);
      E.big('dy/dx = (dy/dt)/(dx/dt) = '+(Math.abs(dxdt)<1e-3?'∞':m.toFixed(2)), '매개변수 곡선의 기울기 = 세로 변화율 ÷ 가로 변화율'); }
  },

  // 10.3 극좌표 — (r, θ)로 점 찍기, 심장형 r=1+cos θ
  { id:'calc10_03',
    enter:function(E){ this.s={th:1.0}; E.Plot.range(-1.5,2.7,-2.1,2.1);
      E.controls('<div class="ctrl"><label>각 θ</label><input type="range" id="pth" min="0" max="6.28" step="0.04" value="1.0"><output id="ptho">1.00</output></div>');
      var self=this; E.bind('#pth','input',function(e){ self.s.th=+e.target.value; document.getElementById('ptho').textContent=(+e.target.value).toFixed(2); E.blip(400,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      function r(a){ return 1+Math.cos(a); }
      // 심장형 자취(0..th)
      ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var a=0;a<=th+1e-9;a+=0.03){ var R=r(a), x=P.X(R*Math.cos(a)), y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      var R=r(th), px=R*Math.cos(th), py=R*Math.sin(th);
      // 반지름선 + 각호
      ctx.strokeStyle='rgba(255,210,122,0.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(px),P.Y(py)); ctx.stroke();
      P.dot(px,py,GLD);
      E.big('r = 1 + cos θ   ·   (r, θ) = ('+R.toFixed(2)+', '+th.toFixed(2)+')', '원점에서의 거리 r과 각 θ로 위치를 적는 극좌표 — (x,y)=(r cosθ, r sinθ)'); }
  },

  // 10.4 장미곡선  r = cos(kθ), 꽃잎 수
  { id:'calc10_04',
    enter:function(E){ this.s={k:3}; E.Plot.range(-1.4,1.4,-1.4,1.4);
      E.controls('<div class="ctrl"><label>k (꽃잎 결정)</label><input type="range" id="rk" min="1" max="6" step="1" value="3"><output id="rko">3</output></div>');
      var self=this; E.bind('#rk','input',function(e){ self.s.k=+e.target.value; document.getElementById('rko').textContent=e.target.value; E.blip(360+self.s.k*40,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, k=s.k;
      ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath();
      for(var a=0;a<=2*Math.PI*2+0.01;a+=0.01){ var R=Math.cos(k*a), x=P.X(R*Math.cos(a)), y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      var petals = (k%2===1)? k : 2*k;
      E.big('r = cos('+(k===1?'':k)+'θ)   ·   꽃잎 '+petals+'장', 'k가 홀수면 꽃잎 k장, 짝수면 2k장 — 극좌표가 그리는 아름다운 패턴'); }
  },

  // 10.5 극좌표 넓이  A = ½∫r² dθ  심장형
  { id:'calc10_05',
    enter:function(E){ this.s={th:2.0}; E.Plot.range(-1.5,2.7,-2.1,2.1);
      E.controls('<div class="ctrl"><label>각 θ</label><input type="range" id="ath" min="0.1" max="6.28" step="0.04" value="2.0"><output id="atho">2.00</output></div>');
      var self=this; E.bind('#ath','input',function(e){ self.s.th=+e.target.value; document.getElementById('atho').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      function r(a){ return 1+Math.cos(a); }
      // 부채꼴 넓이 색칠(원점에서 삼각형 조각들)
      var n=160, h=th/n; ctx.fillStyle='rgba(185,156,255,0.22)';
      for(var k=0;k<n;k++){ var a0=k*h, a1=(k+1)*h; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(r(a0)*Math.cos(a0)),P.Y(r(a0)*Math.sin(a0))); ctx.lineTo(P.X(r(a1)*Math.cos(a1)),P.Y(r(a1)*Math.sin(a1))); ctx.closePath(); ctx.fill(); }
      // 곡선
      ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var a=0;a<=2*Math.PI+0.01;a+=0.03){ var R=r(a), x=P.X(R*Math.cos(a)), y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 넓이 = ½∫r²dθ (실계산)
      var area=0, m=2000, hh=th/m; for(var i=0;i<m;i++){ var aa=(i+0.5)*hh; area+=0.5*r(aa)*r(aa)*hh; }
      E.big('A = ½∫₀^θ r² dθ ≈ '+area.toFixed(3), '극좌표 넓이는 가느다란 부채꼴(½r²dθ)을 쓸어 더합니다 (전체 심장형 = 3π/2)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
