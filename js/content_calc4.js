/* 미적분학 4장 — 미분법 (Stewart Ch.3)
   4.1 곱의 법칙 · 4.2 몫의 법칙 · 4.3 연쇄법칙 · 4.4 음함수 미분 · 4.5 선형근사
   동작만. 텍스트=content/calc4.json. 보라 테마. 골든룰=실측 vs 공식 검산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }

  var scenes = [

  // 4.1 곱의 법칙  (fg)′ = f′g + fg′   f=x, g=sin x
  { id:'calc4_01',
    enter:function(E){ this.s={a:1}; E.Plot.range(-6.5,6.5,-5,5).lab('x','y');
      E.controls('<div class="ctrl"><label>점 a</label><input type="range" id="pa" min="-6" max="6" step="0.1" value="1"><output id="pao">1.0</output></div>');
      var self=this; E.bind('#pa','input',function(e){ self.s.a=+e.target.value; document.getElementById('pao').textContent=(+e.target.value).toFixed(1); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function f(x){return x;} function g(x){return Math.sin(x);} function p(x){return f(x)*g(x);}
      P.axes(); P.curve(p, VIO);
      var num=ndf(p,a), form=ndf(f,a)*g(a)+f(a)*ndf(g,a);   // 실측 vs 곱법칙
      P.dot(a,p(a),GRN,"(fg)′(a) ≈ "+num.toFixed(2));
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText("f′g+fg′ = "+form.toFixed(3)+"  ≈  "+num.toFixed(3), E.W*0.52, E.H*0.18);
      E.big("(x·sin x)′ = sin x + x·cos x", '곱의 미분 = (앞 미분)×뒤 + 앞×(뒤 미분)'); }
  },

  // 4.2 몫의 법칙  (f/g)′ = (f′g − fg′)/g²   f=x, g=x²+1
  { id:'calc4_02',
    enter:function(E){ this.s={a:0.6}; E.Plot.range(-5,5,-1.2,1.2).lab('x','y');
      E.controls('<div class="ctrl"><label>점 a</label><input type="range" id="qa" min="-4.5" max="4.5" step="0.1" value="0.6"><output id="qao">0.6</output></div>');
      var self=this; E.bind('#qa','input',function(e){ self.s.a=+e.target.value; document.getElementById('qao').textContent=(+e.target.value).toFixed(1); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function f(x){return x;} function g(x){return x*x+1;} function q(x){return f(x)/g(x);}
      P.axes(); P.curve(q, VIO);
      var num=ndf(q,a), form=(ndf(f,a)*g(a)-f(a)*ndf(g,a))/(g(a)*g(a));
      P.dot(a,q(a),GRN,null);
      var g42=P.geom();
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText("(f/g)′(a) ≈ "+num.toFixed(2), g42.left+8, g42.top+16);  // 축 눈금과 안 겹치게 플롯 좌상단 고정
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText("(f′g−fg′)/g² = "+form.toFixed(3)+"  ≈  "+num.toFixed(3), g42.left+8, g42.top+34);
      E.big("(x / (x²+1))′ = (1 − x²)/(x²+1)²", '몫의 미분 = (위미분×아래 − 위×아래미분) ÷ 아래²'); }
  },

  // 4.3 연쇄법칙  (f∘g)′ = f′(g)·g′   sin(x²)
  { id:'calc4_03',
    enter:function(E){ this.s={a:1}; E.Plot.range(-3.2,3.2,-1.4,1.4).lab('x','y');
      E.controls('<div class="ctrl"><label>점 a</label><input type="range" id="ca" min="-3" max="3" step="0.05" value="1"><output id="cao">1.00</output></div>');
      var self=this; E.bind('#ca','input',function(e){ self.s.a=+e.target.value; document.getElementById('cao').textContent=(+e.target.value).toFixed(2); E.blip(460,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function h(x){return Math.sin(x*x);}   // 겉 sin, 속 x²
      P.axes(); P.curve(h, VIO);
      var num=ndf(h,a), form=Math.cos(a*a)*(2*a);   // f′(g)·g′ = cos(x²)·2x
      var fa=h(a);
      ctx.strokeStyle='rgba(255,210,122,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(a-0.6),P.Y(fa+num*(-0.6))); ctx.lineTo(P.X(a+0.6),P.Y(fa+num*(0.6))); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText("기울기 = h′(a) ≈ "+num.toFixed(2), P.X(a)+10, P.Y(fa)-10);
      P.dot(a,fa,GRN,null);
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText("h(a) ≈ "+fa.toFixed(2), P.X(a), P.Y(fa)+22);  // 접선 라벨과 안 겹치게 점 아래쪽에
      var g43=P.geom();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText("cos(x²)·2x = "+form.toFixed(3)+"  ≈  "+num.toFixed(3), g43.left+8, g43.top+16);  // 축 눈금(y)과 안 겹치게 플롯 좌상단 고정
      E.big("(sin x²)′ = cos x² · 2x", '연쇄법칙: 겉함수 미분 × 속함수 미분 (양파 까듯)'); }
  },

  // 4.4 음함수 미분 — 원 x²+y²=4, 접선 기울기 dy/dx = −x/y
  { id:'calc4_04',
    enter:function(E){ this.s={th:0.9}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>각도 θ</label><input type="range" id="ith" min="0.1" max="6.1" step="0.05" value="0.9"><output id="itho">0.90</output></div>');
      var self=this; E.bind('#ith','input',function(e){ self.s.th=+e.target.value; document.getElementById('itho').textContent=(+e.target.value).toFixed(2); E.blip(440,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th, R=2;
      P.axes();
      // 원
      ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var t=0;t<=6.30;t+=0.05){ var px=P.X(R*Math.cos(t)), py=P.Y(R*Math.sin(t)); if(t===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.stroke();
      var x=R*Math.cos(th), y=R*Math.sin(th);
      var m = Math.abs(y)<1e-6 ? 9999 : -x/y;            // dy/dx = −x/y (음함수 미분 결과)
      ctx.fillStyle=VIO; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x²+y²=4', P.X(R*Math.cos(0.78))+6, P.Y(R*Math.sin(0.78))-6);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      if(m>9000){ ctx.moveTo(P.X(x),P.Y(-3)); ctx.lineTo(P.X(x),P.Y(3)); }
      else { ctx.moveTo(P.X(x-2),P.Y(y+m*(-2))); ctx.lineTo(P.X(x+2),P.Y(y+m*(2))); } ctx.stroke();
      ctx.fillStyle=GLD; ctx.fillText('접선 dy/dx = '+(m>9000?'∞':m.toFixed(2)), P.X(x)+10, P.Y(y)-14);
      P.dot(x,y,GRN,null);
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('('+x.toFixed(2)+', '+y.toFixed(2)+')', P.X(x)+12, P.Y(y)+26);  // 점 아래·오른쪽으로 — x축 눈금 열과 안 겹치게 수평으로도 이격
      E.big('dy/dx = −x/y = '+(m>9000?'∞ (수직)':m.toFixed(2)),
        'y를 x의 함수로 풀지 않고도, 연쇄법칙으로 접선을 구합니다'); }
  },

  // 4.5 선형근사 — 가까이선 곡선이 직선  f(x)=√x
  { id:'calc4_05',
    enter:function(E){ this.s={a:4}; E.Plot.range(0,9,-0.5,3.5).lab('x','y');
      E.controls('<div class="ctrl"><label>기준 a</label><input type="range" id="la" min="1" max="8" step="0.5" value="4"><output id="lao">4.0</output></div>');
      var self=this; E.bind('#la','input',function(e){ self.s.a=+e.target.value; document.getElementById('lao').textContent=(+e.target.value).toFixed(1); E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      function f(x){return Math.sqrt(x);}
      P.axes(); P.curve(f, VIO);
      var fa=f(a), m=ndf(f,a);
      // 선형근사 L(x)=f(a)+f′(a)(x−a)
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath();
      ctx.moveTo(P.X(0),P.Y(fa+m*(0-a))); ctx.lineTo(P.X(9),P.Y(fa+m*(9-a))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('L(x)=f(a)+f′(a)(x−a)', P.X(7), P.Y(fa+m*(7-a))-8);
      ctx.fillStyle=VIO; ctx.fillText('f(x)=√x', P.X(7.5), P.Y(f(7.5))+16);
      P.dot(a,fa,GRN,'기준 a='+a.toFixed(1));
      // a+1 에서 근사 vs 실제 오차
      var xt=a+1, approx=fa+m*(xt-a), real=f(xt);
      P.dot(xt,real,VIO,null);
      ctx.fillStyle=VIO; ctx.font='600 14px sans-serif'; ctx.textAlign='right';
      ctx.fillText('실제 √x = '+real.toFixed(2), P.X(xt)-10, P.Y(real)-10);
      P.dot(xt,approx,GLD,null);
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('근사 L = '+approx.toFixed(2), P.X(xt)+10, P.Y(approx)+20);  // 실제값 라벨과 좌우·상하로 분리
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('x=a+1: 근사 '+approx.toFixed(3)+' vs 실제 '+real.toFixed(3)+' (오차 '+Math.abs(approx-real).toFixed(3)+')', E.W*0.40, E.H*0.18);
      E.big('√x ≈ √a + (x−a)/(2√a)', '기준점 근처에선 접선(금색)이 곡선을 거의 완벽히 대신합니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
