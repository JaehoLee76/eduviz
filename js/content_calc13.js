/* 미적분학 13장 — 다변수 미분 (Stewart Ch.13~14)
   13.1 다변수함수(등고선) · 13.2 편도함수 · 13.3 기울기벡터 · 13.4 극값 · 13.5 라그랑주 승수
   동작만. 텍스트=content/calc13.json. 보라 테마. 골든룰=값·편도·기울기 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function arrow(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  // 히트맵: f값을 색으로(낮음 파랑→중간 보라→높음 금)
  function heat(E,f,lo,hi){ var ctx=E.ctx, P=E.Plot, nx=46, ny=34;
    var x0=P.X(P.xmin), x1=P.X(P.xmax), y0=P.Y(P.ymax), y1=P.Y(P.ymin);
    var cw=(x1-x0)/nx, ch=(y1-y0)/ny;
    for(var i=0;i<nx;i++){ for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin), wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin);
      var t=(f(wx,wy)-lo)/(hi-lo); t=t<0?0:t>1?1:t; var r,g,b;
      if(t<0.5){ var u=t*2; r=Math.round(40+u*(139-40)); g=Math.round(60+u*(111-60)); b=Math.round(120+u*(214-120)); }
      else { var u2=(t-0.5)*2; r=Math.round(139+u2*(255-139)); g=Math.round(111+u2*(210-111)); b=Math.round(214+u2*(122-214)); }
      ctx.fillStyle='rgb('+r+','+g+','+b+')'; ctx.fillRect(x0+i*cw, y0+j*ch, cw+1, ch+1); } } }
  function grad(f,x,y){ var e=1e-3; return [ (f(x+e,y)-f(x-e,y))/(2*e), (f(x,y+e)-f(x,y-e))/(2*e) ]; }
  function F(x,y){ return Math.sin(x)*Math.cos(y); }   // 공통 풍경

  var scenes = [

  // 13.1 다변수함수 — 등고선/색 지도, 점의 높이 z=f(x,y)
  { id:'calc13_01',
    enter:function(E){ this.s={x:1,y:0.5}; E.Plot.range(-3,3,-3,3);
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="px" min="-3" max="3" step="0.1" value="1"><output id="pxo">1.0</output><label style="margin-left:12px">y</label><input type="range" id="py" min="-3" max="3" step="0.1" value="0.5"><output id="pyo">0.5</output></div>');
      var self=this; E.bind('#px','input',function(e){ self.s.x=+e.target.value; document.getElementById('pxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#py','input',function(e){ self.s.y=+e.target.value; document.getElementById('pyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      P.dot(s.x,s.y,'#ffffff'); var z=F(s.x,s.y);
      E.big('f(x, y) = sin x · cos y = '+z.toFixed(3), '두 입력(x,y)에 높이 하나(z) — 색이 높이입니다(밝을수록 높음). 산맥 같은 풍경'); }
  },

  // 13.2 편도함수 — 한 방향만 미분
  { id:'calc13_02',
    enter:function(E){ this.s={x:0.6,y:0.4}; E.Plot.range(-3,3,-3,3);
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="qx" min="-3" max="3" step="0.1" value="0.6"><output id="qxo">0.6</output><label style="margin-left:12px">y</label><input type="range" id="qy" min="-3" max="3" step="0.1" value="0.4"><output id="qyo">0.4</output></div>');
      var self=this; E.bind('#qx','input',function(e){ self.s.x=+e.target.value; document.getElementById('qxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#qy','input',function(e){ self.s.y=+e.target.value; document.getElementById('qyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      var g=grad(F,s.x,s.y);
      // x방향(빨강)·y방향(초록) 선
      ctx.strokeStyle=RED; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(s.x-1),P.Y(s.y)); ctx.lineTo(P.X(s.x+1),P.Y(s.y)); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(s.x),P.Y(s.y-1)); ctx.lineTo(P.X(s.x),P.Y(s.y+1)); ctx.stroke();
      P.dot(s.x,s.y,'#ffffff');
      E.big('∂f/∂x = '+g[0].toFixed(2)+'   ·   ∂f/∂y = '+g[1].toFixed(2), '한 변수만 변화시키고 나머지는 고정 — 빨강=x방향 기울기, 초록=y방향 기울기'); }
  },

  // 13.3 기울기 벡터 ∇f — 가장 가파른 오르막
  { id:'calc13_03',
    enter:function(E){ this.s={x:0.8,y:0.6}; E.Plot.range(-3,3,-3,3);
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="gx" min="-3" max="3" step="0.1" value="0.8"><output id="gxo">0.8</output><label style="margin-left:12px">y</label><input type="range" id="gy" min="-3" max="3" step="0.1" value="0.6"><output id="gyo">0.6</output></div>');
      var self=this; E.bind('#gx','input',function(e){ self.s.x=+e.target.value; document.getElementById('gxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#gy','input',function(e){ self.s.y=+e.target.value; document.getElementById('gyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      // 기울기장(작은 화살표 샘플)
      for(var gx=-2.5;gx<=2.5;gx+=1){ for(var gy=-2.5;gy<=2.5;gy+=1){ var gg=grad(F,gx,gy), L=0.35, n=Math.hypot(gg[0],gg[1])||1;
        arrow(ctx,P.X(gx),P.Y(gy),P.X(gx+gg[0]/n*L),P.Y(gy+gg[1]/n*L),'rgba(255,255,255,0.4)',1); } }
      var g=grad(F,s.x,s.y), mag=Math.hypot(g[0],g[1]);
      arrow(ctx,P.X(s.x),P.Y(s.y),P.X(s.x+g[0]*0.6),P.Y(s.y+g[1]*0.6),GLD,3);
      P.dot(s.x,s.y,'#ffffff');
      E.big('∇f = (∂f/∂x, ∂f/∂y)   ·   |∇f| = '+mag.toFixed(2), '기울기 벡터는 가장 가파르게 오르는 방향 — 등고선과 수직(금색 화살표)'); }
  },

  // 13.4 극값 — ∇f=0 인 곳(봉우리·골짜기·안장)
  { id:'calc13_04',
    enter:function(E){ this.s={x:0.5,y:0.5}; E.Plot.range(-3,3,-3,3);
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="ex" min="-3" max="3" step="0.05" value="0.5"><output id="exo">0.5</output><label style="margin-left:12px">y</label><input type="range" id="ey" min="-3" max="3" step="0.05" value="0.5"><output id="eyo">0.5</output></div>');
      var self=this; E.bind('#ex','input',function(e){ self.s.x=+e.target.value; document.getElementById('exo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.05); });
      E.bind('#ey','input',function(e){ self.s.y=+e.target.value; document.getElementById('eyo').textContent=(+e.target.value).toFixed(2); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      // 임계점 표시(sin x cos y: 봉우리 (π/2,0), 골 (π/2,π) 등)
      var crit=[[Math.PI/2,0,'봉우리'],[ -Math.PI/2,0,'골짜기'],[Math.PI/2,Math.PI,'골짜기'],[0,Math.PI/2,'안장']];
      for(var c=0;c<crit.length;c++){ P.dot(crit[c][0],crit[c][1],'rgba(255,255,255,0.5)'); }
      var g=grad(F,s.x,s.y), mag=Math.hypot(g[0],g[1]), flat=mag<0.06;
      var gg=grad(F,s.x,s.y); arrow(ctx,P.X(s.x),P.Y(s.y),P.X(s.x+gg[0]*0.6),P.Y(s.y+gg[1]*0.6),flat?GRN:GLD,3);
      P.dot(s.x,s.y,'#ffffff');
      E.big('|∇f| = '+mag.toFixed(3)+(flat?'  ← 임계점!':''), flat?'기울기 0 — 봉우리·골짜기 또는 안장점입니다':'기울기 벡터가 0이 되는 곳을 찾으면 극값 후보'); }
  },

  // 13.5 라그랑주 승수 — 제약 위에서 최적화  f=x+y, g: x²+y²=1
  { id:'calc13_05',
    enter:function(E){ this.s={th:0.5}; E.Plot.range(-2,2,-2,2);
      E.controls('<div class="ctrl"><label>원 위 위치 θ</label><input type="range" id="lt" min="0" max="6.28" step="0.03" value="0.5"><output id="lto">0.50</output></div>');
      var self=this; E.bind('#lt','input',function(e){ self.s.th=+e.target.value; document.getElementById('lto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      P.axes();
      // f=x+y 등위선(여러 평행선)
      ctx.strokeStyle='rgba(185,156,255,0.30)'; ctx.lineWidth=1;
      for(var cval=-2;cval<=2;cval+=0.5){ ctx.beginPath(); ctx.moveTo(P.X(-2),P.Y(cval+2)); ctx.lineTo(P.X(2),P.Y(cval-2)); ctx.stroke(); }
      // 제약 원 x²+y²=1
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath();
      for(var a=0;a<=6.30;a+=0.05){ var x=Math.cos(a),y=Math.sin(a); if(a===0)ctx.moveTo(P.X(x),P.Y(y)); else ctx.lineTo(P.X(x),P.Y(y)); } ctx.closePath(); ctx.stroke();
      var px=Math.cos(th), py=Math.sin(th), fval=px+py;
      // ∇f=(1,1) (금), ∇g=(2x,2y) 방사(초록)
      arrow(ctx,P.X(px),P.Y(py),P.X(px+0.5),P.Y(py+0.5),GLD,2.5);
      arrow(ctx,P.X(px),P.Y(py),P.X(px+px*0.6),P.Y(py+py*0.6),GRN,2);
      var aligned=Math.abs(px-py)<0.05 && px>0;
      P.dot(px,py,'#ffffff');
      E.big('f = x + y = '+fval.toFixed(3)+(aligned?'  ← 최댓값 √2!':''), aligned?'∇f와 ∇g가 나란 — 등위선이 제약곡선에 접할 때 최적':'두 기울기(금=∇f, 초록=∇g)가 나란해지는 곳을 찾으세요'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
