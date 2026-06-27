/* 제17장 미분 — 17.1 극한 · 17.2 연속 · 17.3 도함수 · 17.4 미분법 · 17.5 여러 함수
   동작(behavior)만. 텍스트는 content/ch17.json */
(function(){
  function tangentLine(P,ctx,a,fa,slope,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath();
    var x1=P.xmin, x2=P.xmax, y1=fa+slope*(x1-a), y2=fa+slope*(x2-a);
    ctx.moveTo(P.X(x1),P.Y(y1)); ctx.lineTo(P.X(x2),P.Y(y2)); ctx.stroke(); }

  var scenes=[

  // ══════════ 17.1 평균변화율 → 순간변화율 ══════════
  { id:'ch17_01',
    enter:function(E){ this.s={h:2}; E.Plot.range(-1,4,-1,8).lab('x','y');
      E.controls('<div class="ctrl"><label>간격 h (→ 0)</label><input type="range" id="hh" min="0.1" max="2.5" step="0.1" value="2"><output id="hho">2.0</output></div>');
      var self=this; E.bind('#hh','input',function(e){ self.s.h=+e.target.value; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); E.blip(700-self.s.h*120,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, h=this.s.h, ctx=E.ctx, a=1, fa=a*a, b=a+h, fb=b*b, slope=(fb-fa)/h; P.axes();
      P.curve(function(x){return x*x;}, '#7ab8ff');
      // 접선(극한, 옅게)
      tangentLine(P,ctx,a,fa,2,'rgba(143,227,181,0.45)');
      // 할선
      var sl=(fb-fa)/(b-a); ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(P.X(a-0.5),P.Y(fa-sl*0.5)); ctx.lineTo(P.X(b+0.3),P.Y(fb+sl*0.3)); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('할선 (기울기 '+slope.toFixed(2)+')', P.X(b+0.3)+4, P.Y(fb+sl*0.3));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('접선 (기울기 2)', P.X(2.4), P.Y(fa+2*(2.4-a)));
      // Δx, Δy
      ctx.strokeStyle='rgba(244,160,192,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(fa)); ctx.lineTo(P.X(b),P.Y(fa)); ctx.lineTo(P.X(b),P.Y(fb)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('Δx = '+h.toFixed(1), P.X((a+b)/2), P.Y(fa)+16);
      ctx.textAlign='left'; ctx.fillText('Δy = '+(fb-fa).toFixed(2), P.X(b)+6, P.Y((fa+fb)/2));
      P.dot(a,fa,'#7ab8ff','A'); P.dot(b,fb,'#ffb27a','B');
      E.big('평균변화율 = Δy/Δx = '+slope.toFixed(2)+'  → (h→0) → 2', 'h = 두 점 A·B 사이의 가로 간격(Δx = b−a). h를 0으로 줄이면 할선(주황)이 접선(초록)이 됩니다 = 순간변화율'); }
  },

  // ══════════ 17.2 연속성 ══════════
  { id:'ch17_02',
    enter:function(E){ this.s={mode:0}; E.Plot.range(-1,5,-1,5).lab('x','y'); E.setOn([]); },
    tap:function(E){ this.s.mode=(this.s.mode+1)%3; E.blip(440+this.s.mode*60,0.15); },
    draw:function(E){ var P=E.Plot, m=this.s.mode, ctx=E.ctx; P.axes();
      if(m===0){ P.curve(function(x){return 0.6*x+1;}, '#7ab8ff'); E.big('연속 — 끊김 없음', '한 붓으로 그릴 수 있습니다. 극한값 = 함숫값.'); }
      else if(m===1){ // 점프
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(P.X(-1),P.Y(0.4)); ctx.lineTo(P.X(2),P.Y(1.6)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(P.X(2),P.Y(3.2)); ctx.lineTo(P.X(5),P.Y(4.4)); ctx.stroke();
        P.dot(2,1.6,'#7ab8ff'); ctx.fillStyle='#0b0b10'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(P.X(2),P.Y(3.2),6,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x = 2 에서 도약', P.X(2)+10, P.Y(2.4));
        E.big('불연속 — 점프(도약)', '좌극한 ≠ 우극한. x=2에서 뚝 끊깁니다.'); }
      else { P.curve(function(x){return 0.6*x+1;}, '#7ab8ff');
        ctx.fillStyle='#0b0b10'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(P.X(2),P.Y(2.2),6,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x = 2 에서 구멍', P.X(2)+10, P.Y(2.2)+2);
        E.big('불연속 — 구멍(제거 가능)', '극한은 있지만 그 점의 값이 없습니다/다릅니다 (14장 #84).'); }
      E.tapHint(E.W/2, P.geom().bot+40, '▶ 연속 / 점프 / 구멍', true); }
  },

  // ══════════ 17.3 도함수 = 기울기 함수 ══════════
  { id:'ch17_03',
    enter:function(E){ this.s={a:1}; E.Plot.range(-3,3,-3,6).lab('x','y');
      E.controls('<div class="ctrl"><label>접점 위치 a</label><input type="range" id="aa" min="-2.5" max="2.5" step="0.5" value="1"><output id="aao">1</output></div>');
      var self=this; E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, a=this.s.a, ctx=E.ctx, fa=a*a, slope=2*a; P.axes();
      P.curve(function(x){return x*x;}, '#7ab8ff');         // f
      P.curve(function(x){return 2*x;}, '#8fe3b5');          // f'
      tangentLine(P,ctx,a,fa,slope,'rgba(255,178,122,0.9)');
      P.dot(a,fa,'#7ab8ff','접점');
      ctx.globalAlpha=E.blink(); P.dot(a,slope,'#8fe3b5',"기울기 "+slope); ctx.globalAlpha=1;
      // 기울기→f' 높이 연결
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(fa)); ctx.lineTo(P.X(a),P.Y(slope)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x)=x²', P.X(1.7), P.Y(4.4));
      ctx.fillStyle='#8fe3b5'; ctx.fillText("f '(x)=2x", P.X(1.6), P.Y(2.0));
      E.big("f(x)=x²  →  f '(x) = 2x", '각 점의 접선 기울기(2a)를 모으면 새 함수 = 도함수! (초록점 = 기울기 높이)'); }
  },

  // ══════════ 17.4 멱법칙 ══════════
  { id:'ch17_04',
    enter:function(E){ this.s={n:2}; E.Plot.range(-2,2,-4,5).lab('x','y');
      E.controls('<div class="ctrl"><label>지수 n</label><input type="range" id="nn" min="1" max="4" step="1" value="2"><output id="nno">2</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, n=this.s.n, ctx=E.ctx; P.axes();
      P.curve(function(x){return Math.pow(x,n);}, '#7ab8ff');
      P.curve(function(x){return n*Math.pow(x,n-1);}, '#8fe3b5');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f = xⁿ', P.X(1.3), P.Y(4.3));
      ctx.fillStyle='#8fe3b5'; ctx.fillText("f ' = n·xⁿ⁻¹", P.X(-1.9), P.Y(4.3));
      // 예시 표기: n=1이면 (x)'=1, 그 외 (xⁿ)'=n·x^(n−1) (지수 1은 생략)
      var sup={1:'',2:'²',3:'³',4:'⁴'}, ex;
      if(n===1){ ex="(x)' = 1"; }
      else { ex="(x"+(sup[n]||'^'+n)+")' = "+n+"x"+(n-1===1?'':(sup[n-1]||'^'+(n-1))); }
      E.big("(xⁿ)' = n·xⁿ⁻¹   (n="+n+")", '멱법칙 — 지수를 앞으로 내리고 지수는 1 줄입니다. 예: '+ex); }
  },

  // ══════════ 17.5 극대·극소 ══════════
  { id:'ch17_05',
    enter:function(E){ this.s={x:0}; E.Plot.range(-2.5,2.5,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>점 x 위치</label><input type="range" id="xx" min="-2" max="2" step="0.25" value="0"><output id="xxo">0</output></div>');
      var self=this; E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value); E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, x=this.s.x, ctx=E.ctx; P.axes();
      function f(t){ return t*t*t-3*t; } var slope=3*x*x-3, fx=f(x);
      P.curve(f, '#7ab8ff');
      // 극대(-1,2) 극소(1,-2)
      P.dot(-1,2,'rgba(255,178,122,0.6)','극대'); P.dot(1,-2,'rgba(143,227,181,0.6)','극소');
      tangentLine(P,ctx,x,fx,slope,'#ffb27a');
      P.dot(x,fx,'#fff');
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText("f '("+x+") = "+slope.toFixed(2), P.X(x)+8, P.Y(fx)-6);
      var st = Math.abs(slope)<0.01?"f '=0 → 극값(수평접선)" : slope>0?"f '>0 → 증가 ↗" : "f '<0 → 감소 ↘";
      E.big("f(x)=x³−3x,  f '("+x+") = "+slope.toFixed(2), st+'  · 기울기 부호가 곧 증가·감소!'); }
  },

  // ══════════ 17 접선의 방정식 ══════════
  { id:'ch17_06',
    enter:function(E){ this.s={a:1}; E.Plot.range(-3,3,-2,8).lab('x','y');
      E.controls('<div class="ctrl"><label>접점 a</label><input type="range" id="ta" min="-2.5" max="2.5" step="0.5" value="1"><output id="tao">1</output></div>');
      var self=this; E.bind('#ta','input',function(e){ self.s.a=+e.target.value; document.getElementById('tao').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, a=this.s.a, ctx=E.ctx, fa=a*a, slope=2*a; P.axes();
      P.curve(function(x){return x*x;}, '#7ab8ff');
      tangentLine(P,ctx,a,fa,slope,'#ffb27a');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x)=x²', P.X(2.2), P.Y(5.5));
      ctx.fillStyle='#ffb27a'; ctx.fillText("기울기 f '(a) = "+slope, P.X(a)+10, P.Y(fa)+22);
      ctx.globalAlpha=E.blink(); P.dot(a,fa,'#ffb27a','('+a+', '+fa+')'); ctx.globalAlpha=1;
      var b=-a*a;
      // 계수 1/−1/0·상수항 0 표기 정리: 1x→x, −1x→−x, 0x→항 생략, + 0→생략, + (음수)→− 양수
      var xt=(slope===0?'':slope===1?'x':slope===-1?'−x':(slope<0?'−'+(-slope):''+slope)+'x');
      var ct=(b===0?'':(xt===''?(b<0?'−'+(-b):''+b):(b>0?' + '+b:' − '+(-b))));
      var rhs=(xt+ct)||'0';
      E.big('접선: y = '+rhs, '접점 ('+a+', '+fa+')에서 기울기 f\'(a)='+slope+' → y−'+fa+' = '+slope+'(x−'+a+')'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
