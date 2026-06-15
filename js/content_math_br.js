/* 수학 — 분기(세부) 장면. 뼈대에서 branchOf로 갈라짐. 수학독본 수준의 심화/증명 반영.
   동작(behavior)만. 텍스트는 content/math_br.json. engine.js 공유(E.Plot 등). */
(function(){
  var TAU=Math.PI*2, D2R=Math.PI/180;
  // 단계 텍스트 박스(증명용)
  function steps(E, lines, opts){ opts=opts||{}; var ctx=E.ctx, cx=E.W/2, y0=opts.y0||E.H*0.30, lh=opts.lh||E.H*0.075;
    lines.forEach(function(ln,i){ var y=y0+i*lh; ctx.fillStyle=ln.c||'#cfcdc6'; ctx.font=(ln.b?'600 ':'')+(ln.fs||18)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText(ln.t, cx, y); }); }

  var scenes=[

  // ══════ 무리수 √2(ch1_05) ▸ √2가 무리수임의 증명 ══════
  { id:'math_br_sqrt2', branchOf:'ch1_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'가정: √2 = p/q (더 약분 안 되는 기약분수)', c:'#ffb27a', b:true},
      {t:'양변 제곱 →  2 = p²/q²  →  p² = 2q²', c:'#cfcdc6'},
      {t:'p²이 짝수 → p도 짝수 → p = 2k', c:'#7ab8ff'},
      {t:'2q² = (2k)² = 4k²  →  q² = 2k²  →  q도 짝수', c:'#7ab8ff'},
      {t:'p, q 둘 다 짝수 = 약분 가능 → 기약분수 가정에 모순!', c:'#f4a0c0', b:true},
      {t:'∴ √2는 분수로 쓸 수 없다 = 무리수  ∎', c:'#8fe3b5', b:true, fs:20}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('√2 는 무리수 — 귀류법 증명', '"분수로 쓸 수 있다"고 가정하면 모순이 나와요. 피타고라스 학파를 충격에 빠뜨린 증명 — 수직선에 분수로 못 채우는 구멍이 있다!'); }
  },

  // ══════ 완전제곱식(ch3_03) ▸ 근의 공식 유도 ══════
  { id:'math_br_quadformula', branchOf:'ch3_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'ax² + bx + c = 0', c:'#ffb27a', b:true, fs:20},
      {t:'양변 ÷ a →  x² + (b/a)x + c/a = 0', c:'#cfcdc6'},
      {t:'완전제곱식(#21):  (x + b/2a)² = b²/4a² − c/a', c:'#7ab8ff'},
      {t:'우변 통분 →  (x + b/2a)² = (b² − 4ac) / 4a²', c:'#7ab8ff'},
      {t:'양변 √ →  x + b/2a = ±√(b²−4ac) / 2a', c:'#cfcdc6'},
      {t:'x = ( −b ± √(b²−4ac) ) / 2a', c:'#8fe3b5', b:true, fs:22}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('근의 공식 유도 — 완전제곱식으로', '외우는 공식이 어디서 왔을까? 완전제곱식(#21)으로 x를 \"가둬\" 풀면 근의 공식이 나와요. √ 안의 b²−4ac가 바로 판별식(#22)!'); }
  },

  // ══════ 판별식(ch3_05) ▸ 근과 계수의 관계 (비에트) ══════
  { id:'math_br_vieta', branchOf:'ch3_05',
    enter:function(E){ this.s={b:-1,c:-6}; E.Plot.range(-5,5,-8,6);
      E.controls('<div class="ctrl"><label>b</label><input type="range" id="vb" min="-4" max="4" step="1" value="-1"><output id="vbo">-1</output><label style="margin-left:14px">c</label><input type="range" id="vc" min="-6" max="2" step="1" value="-6"><output id="vco">-6</output></div>');
      var self=this; E.bind('#vb','input',function(e){ self.s.b=+e.target.value; document.getElementById('vbo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#vc','input',function(e){ self.s.c=+e.target.value; document.getElementById('vco').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, b=this.s.b, c=this.s.c, ctx=E.ctx, D=b*b-4*c; P.axes();
      P.curve(function(x){return x*x+b*x+c;}, '#7ab8ff');
      if(D>=0){ var r1=(-b-Math.sqrt(D))/2, r2=(-b+Math.sqrt(D))/2; P.dot(r1,0,'#ffb27a'); P.dot(r2,0,'#ffb27a');
        ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('두 근 합 = '+(r1+r2).toFixed(1)+' = −b('+(-b)+')  ·  곱 = '+(r1*r2).toFixed(1)+' = c('+c+')', E.W/2, E.H*0.80); }
      else { ctx.fillStyle='#f4a0c0'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('D<0 (실근 없음) — 그래도 두 복소근의 합=−b, 곱=c', E.W/2, E.H*0.80); }
      E.big('x²+('+b+')x+('+c+')  →  합=−b, 곱=c', '근과 계수의 관계(비에트) — 근을 직접 안 구해도 두 근의 합(−b/a)·곱(c/a)을 계수로 즉시! 인수분해·방정식 세우기의 핵심'); }
  },

  // ══════ 덧셈정리(ch8_04) ▸ 2배각 공식 ══════
  { id:'math_br_double', branchOf:'ch8_04',
    enter:function(E){ this.s={deg:30}; E.setOn([]);
      E.controls('<div class="ctrl"><label>각 θ</label><input type="range" id="dd" min="10" max="80" step="5" value="30"><output id="ddo">30°</output></div>');
      var self=this; E.bind('#dd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('ddo').textContent=e.target.value+'°'; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, t=this.s.deg*D2R, cx=E.W/2, cy=E.H*0.46, R=Math.min(E.H*0.24,E.W*0.18);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-R*1.3,cy); ctx.lineTo(cx+R*1.3,cy); ctx.moveTo(cx,cy-R*1.3); ctx.lineTo(cx,cy+R*1.3); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      function ray(ang,col){ var px=cx+R*Math.cos(ang),py=cy-R*Math.sin(ang); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,5,0,TAU); ctx.fill(); }
      ray(t,'#7ab8ff'); ray(2*t,'#ffb27a');
      var s2=Math.sin(2*t), chk=2*Math.sin(t)*Math.cos(t);
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('파랑 θ, 주황 2θ', cx, cy+R*1.4);
      E.big('sin 2θ = 2 sin θ cos θ   ('+s2.toFixed(3)+' = '+chk.toFixed(3)+')', '2배각 공식 — 덧셈정리(#55)에서 α=β=θ로! sin(θ+θ)=sinθcosθ+cosθsinθ=2sinθcosθ. cos2θ=cos²θ−sin²θ도 마찬가지. 적분·물리에 필수'); }
  },

  // ══════ 멱법칙(ch17_04) ▸ 미분의 여러 법칙 ══════
  { id:'math_br_difrules', branchOf:'ch17_04',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'상수배:  (c·f)′ = c·f′', c:'#7ab8ff'},
      {t:'합·차:  (f ± g)′ = f′ ± g′', c:'#7ab8ff'},
      {t:'곱:  (f·g)′ = f′g + f g′', c:'#ffb27a', b:true},
      {t:'몫:  (f/g)′ = (f′g − f g′) / g²', c:'#ffb27a'},
      {t:'연쇄법칙:  ( f(g(x)) )′ = f′(g(x)) · g′(x)', c:'#8fe3b5', b:true, fs:20},
      {t:'예) (sin(x²))′ = cos(x²) · 2x', c:'#cfcdc6'}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('미분의 법칙 — 복잡한 함수도 조립', '멱법칙(#100)만으론 부족해요. 곱·몫·연쇄법칙으로 어떤 함수든 분해해 미분! 특히 연쇄법칙은 "겹친 함수"의 핵심 — 신경망 역전파의 토대'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
