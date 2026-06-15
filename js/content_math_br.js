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
  },

  // ══════ 사인법칙(ch8_05) ▸ 코사인법칙 ══════
  { id:'math_br_coslaw', branchOf:'ch8_05',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.55, A=[cx-150,cy+60], B=[cx+150,cy+60], C=[cx-30,cy-130];
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.lineTo(C[0],C[1]); ctx.closePath(); ctx.stroke();
      ctx.fillStyle='#ffd9bd'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('A',A[0]-14,A[1]+6); ctx.fillText('B',B[0]+14,B[1]+6); ctx.fillText('C',C[0]-2,C[1]-12);
      ctx.fillStyle='#8fe3b5'; ctx.font='14px sans-serif';
      ctx.fillText('c',(A[0]+B[0])/2,(A[1]+B[1])/2+20); ctx.fillText('b',(A[0]+C[0])/2-16,(A[1]+C[1])/2); ctx.fillText('a',(B[0]+C[0])/2+16,(B[1]+C[1])/2);
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.fillText('c² = a² + b² − 2ab·cos C', cx, E.H*0.80);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.fillText('C = 90°이면 cos C = 0 → c² = a² + b² (피타고라스!)', cx, E.H*0.85);
      E.big('코사인법칙 — 피타고라스의 일반화', '직각이 아닌 삼각형에도! c²=a²+b²−2ab cosC. 각 C가 직각이면 보정항(−2ab cosC)이 사라져 1장 피타고라스가 됨. 두 변과 낀 각으로 나머지 변을 구해요'); }
  },

  // ══════ 복소수 곱셈(ch10_04) ▸ 드무아브르 정리 ══════
  { id:'math_br_demoivre', branchOf:'ch10_04',
    enter:function(E){ this.s={n:2}; E.Plot.range(-6,6,-4,4);
      E.controls('<div class="ctrl"><label>거듭제곱 n</label><input type="range" id="dn" min="1" max="4" step="1" value="2"><output id="dno">2</output></div>');
      var self=this; E.bind('#dn','input',function(e){ self.s.n=+e.target.value; document.getElementById('dno').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, n=this.s.n, ctx=E.ctx, r=1.25, t=35*Math.PI/180; P.axes();
      function ph(rr,ang,col,lab){ var x=rr*Math.cos(ang),y=rr*Math.sin(ang); ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(P.X(x),P.Y(y),5,0,7); ctx.fill(); if(lab){ctx.font='600 13px sans-serif';ctx.textAlign='left';ctx.fillText(lab,P.X(x)+6,P.Y(y));} }
      ph(r,t,'rgba(122,184,255,0.5)','z');
      ph(Math.pow(r,n),n*t,'#ffb27a','zⁿ');
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('크기 r → rⁿ, 각 θ → nθ', E.W/2, E.H*0.80);
      E.big('zⁿ = rⁿ(cos nθ + i sin nθ)  (n='+n+')', '드무아브르 정리 — 복소수 거듭제곱 = 크기는 n제곱, 각은 n배! 곱셈=각의 합(#65)을 반복한 결과. 단위근(1의 n제곱근)·FFT의 토대'); }
  },

  // ══════ 등비수열(ch13_02) ▸ 합 공식 유도 ══════
  { id:'math_br_geomsum', branchOf:'ch13_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'S = a + ar + ar² + … + arⁿ⁻¹', c:'#ffb27a', b:true, fs:19},
      {t:'양변 × r →  rS = ar + ar² + … + arⁿ', c:'#cfcdc6'},
      {t:'두 식 빼기 (S − rS):  거의 다 상쇄!', c:'#7ab8ff'},
      {t:'S(1 − r) = a − arⁿ = a(1 − rⁿ)', c:'#7ab8ff'},
      {t:'S = a(1 − rⁿ) / (1 − r)   (r ≠ 1)', c:'#8fe3b5', b:true, fs:21},
      {t:'|r|<1 이고 n→∞ 면 rⁿ→0 →  S = a/(1−r)  (#80 무한급수!)', c:'#f4a0c0'}
    ], {y0:E.H*0.26, lh:E.H*0.085});
      E.big('등비수열의 합 — 밀어서 빼기', 'S와 rS를 빼면 가운데가 다 상쇄돼 깔끔한 공식이! S=a(1−rⁿ)/(1−r). |r|<1로 무한히 가면 #80 무한등비급수 a/(1−r)가 바로 나와요'); }
  },

  // ══════ 로그(ch7_03) ▸ 밑변환과 자연로그 ══════
  { id:'math_br_logbase', branchOf:'ch7_03',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'밑변환 공식:  logₐ x = (log_b x) / (log_b a)', c:'#ffb27a', b:true, fs:19},
      {t:'→ 어떤 밑이든 계산기의 한 밑(보통 e나 10)으로 변환', c:'#cfcdc6'},
      {t:'자연로그 ln = 밑이 e (≈2.718) 인 로그', c:'#7ab8ff'},
      {t:'(ln x)′ = 1/x,  (eˣ)′ = eˣ  — 미적분에서 가장 깔끔!', c:'#8fe3b5', b:true},
      {t:'그래서 미적분·과학·통계의 기본 밑은 e (#86 자연상수)', c:'#9b99a3', fs:15}
    ], {y0:E.H*0.30, lh:E.H*0.09});
      E.big('로그의 밑변환 & 자연로그 ln', '어떤 밑의 로그도 log_b x / log_b a 로 바꿔요. 미적분에선 밑 e가 특별 — ln의 미분이 1/x로 가장 단순! 14장 e(#86)가 왜 중요한지의 답'); }
  },

  // ══════ 공간벡터(ch11_02) ▸ 벡터의 외적 ══════
  { id:'math_br_cross', branchOf:'ch11_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, O=[E.W*0.4,E.H*0.62], a=[E.W*0.66,E.H*0.52], b=[E.W*0.5,E.H*0.32];
      // 평행사변형
      var d=[a[0]+b[0]-O[0], a[1]+b[1]-O[1]];
      ctx.fillStyle='rgba(143,227,181,0.14)'; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(a[0],a[1]); ctx.lineTo(d[0],d[1]); ctx.lineTo(b[0],b[1]); ctx.closePath(); ctx.fill();
      function vec(p,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(p[0],p[1]); ctx.stroke(); var ang=Math.atan2(p[1]-O[1],p[0]-O[0]); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0]-12*Math.cos(ang-0.4),p[1]-12*Math.sin(ang-0.4)); ctx.lineTo(p[0]-12*Math.cos(ang+0.4),p[1]-12*Math.sin(ang+0.4)); ctx.fill(); ctx.font='600 15px sans-serif'; ctx.fillText(lab,p[0]+8,p[1]); }
      vec(a,'#7ab8ff','a'); vec(b,'#8fe3b5','b');
      // 수직 결과(위로)
      var nx=O[0], ny=O[1]-90; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=3; ctx.setLineDash([5,3]); ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(nx,ny); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.fillText('a×b (평면에 수직)',nx+8,ny+4);
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('|a×b| = |a||b|sinθ = 평행사변형 넓이', E.W/2, E.H*0.80);
      E.big('벡터의 외적 a×b — 평면 밖으로', '내적(#60)이 "수(스칼라)"였다면, 외적은 두 벡터에 수직인 "벡터"! 크기=평행사변형 넓이=|a||b|sinθ. 법선·회전력(토크)·3D 그래픽의 핵심(3차원 전용)'); }
  },

  // ══════ 부정적분(ch19_02) ▸ 치환·부분적분 ══════
  { id:'math_br_inttech', branchOf:'ch19_02',
    enter:function(E){ E.setOn([]); },
    draw:function(E){ steps(E, [
      {t:'치환적분 (연쇄법칙의 역):', c:'#ffb27a', b:true},
      {t:'∫ f(g(x))·g′(x) dx = ∫ f(u) du   (u = g(x))', c:'#7ab8ff'},
      {t:'예) ∫ 2x·cos(x²) dx = sin(x²) + C', c:'#9b99a3', fs:15},
      {t:'부분적분 (곱 미분의 역):', c:'#ffb27a', b:true},
      {t:'∫ u dv = uv − ∫ v du', c:'#8fe3b5', b:true, fs:20},
      {t:'예) ∫ x·eˣ dx = x·eˣ − ∫ eˣ dx = (x−1)eˣ + C', c:'#9b99a3', fs:15}
    ], {y0:E.H*0.24, lh:E.H*0.082});
      E.big('적분의 기술 — 치환 & 부분적분', '미분은 규칙대로지만 적분은 "기술"이 필요해요. 치환적분=연쇄법칙(#100.1) 거꾸로, 부분적분=곱 미분 거꾸로. 미분 법칙을 뒤집으면 적분 도구가 돼요!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
