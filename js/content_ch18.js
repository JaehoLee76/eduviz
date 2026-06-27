/* 제18장 미분의 응용 — 평균값정리·요철·개형·최적화·테일러
   동작(behavior)만. 텍스트는 content/ch18.json */
(function(){
  function fact(n){ var f=1; for(var i=2;i<=n;i++) f*=i; return f; }
  function tline(P,ctx,a,fa,slope,col,dash){ ctx.strokeStyle=col; ctx.lineWidth=2; if(dash)ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(P.X(P.xmin),P.Y(fa+slope*(P.xmin-a))); ctx.lineTo(P.X(P.xmax),P.Y(fa+slope*(P.xmax-a))); ctx.stroke(); if(dash)ctx.setLineDash([]); }

  var scenes=[

  // ══════════ 18.1 평균값 정리 ══════════
  { id:'ch18_01',
    enter:function(E){ this.s={b:3}; E.Plot.range(-0.5,4,-1,9).lab('x','y');
      E.controls('<div class="ctrl"><label>끝점 b</label><input type="range" id="bb" min="1.5" max="3.5" step="0.5" value="3"><output id="bbo">3</output></div>');
      var self=this; E.bind('#bb','input',function(e){ self.s.b=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, b=this.s.b, ctx=E.ctx, a=0, fa=0, fb=b*b, sl=(fb-fa)/(b-a), c=b/2; P.axes();
      P.curve(function(x){return x*x;}, '#7ab8ff');
      // 할선(평균기울기)
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(fa)); ctx.lineTo(P.X(b),P.Y(fb)); ctx.stroke();
      P.dot(a,fa,'#ffb27a'); P.dot(b,fb,'#ffb27a');
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('할선 기울기 = '+sl.toFixed(2), P.X((a+b)/2)+6, P.Y((fa+fb)/2)-8);
      // c에서 접선(할선과 평행)
      tline(P,ctx,c,c*c,sl,'#8fe3b5');
      ctx.fillStyle='#8fe3b5'; ctx.fillText("접선 f'(c) = "+sl.toFixed(2), P.X(c)+8, P.Y(c*c)+24);
      ctx.globalAlpha=E.blink(); P.dot(c,c*c,'#8fe3b5','c='+c); ctx.globalAlpha=1;
      E.big('평균기울기 = '+sl.toFixed(2)+' = f\'(c),  c = '+c, '평균값 정리 — 평균기울기(주황)와 똑같은 접선(초록)을 갖는 점 c가 반드시 존재'); }
  },

  // ══════════ 18.2 요철·변곡점 (2계도함수) ══════════
  { id:'ch18_02',
    enter:function(E){ this.s={x:-1}; E.Plot.range(-2.5,2.5,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>점 x</label><input type="range" id="xx" min="-2" max="2" step="0.25" value="-1"><output id="xxo">-1</output></div>');
      var self=this; E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value); E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, x=this.s.x, ctx=E.ctx; P.axes();
      function f(t){return t*t*t;} var f2=6*x;
      P.curve(f, '#7ab8ff');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x)=x³', P.X(1.7), P.Y(3.6));
      P.dot(0,0,'rgba(255,178,122,0.7)','변곡점');
      tline(P,ctx,x,f(x),3*x*x,'#8fe3b5');
      ctx.fillStyle='#8fe3b5'; ctx.fillText("접선 f'("+x+")="+(3*x*x).toFixed(2), P.X(x)+8, P.Y(f(x))-8);
      P.dot(x,f(x),'#fff');
      var st = Math.abs(f2)<0.01?"f''=0 → 변곡점(휨 방향 바뀜)" : f2>0?"f''>0 → 아래로 볼록 (∪)" : "f''<0 → 위로 볼록 (∩)";
      E.big("f(x)=x³,  f''("+x+") = "+f2.toFixed(1), st+' · 2계도함수 부호 = 곡선의 휨(요철)'); }
  },

  // ══════════ 18.3 곡선의 개형 ══════════
  { id:'ch18_03',
    enter:function(E){ this.s={b:-3}; E.Plot.range(-2.5,2.5,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>계수 b  (y = x³ + b·x)</label><input type="range" id="bc" min="-4" max="2" step="0.5" value="-3"><output id="bco">-3</output></div>');
      var self=this; E.bind('#bc','input',function(e){ self.s.b=+e.target.value; document.getElementById('bco').textContent=(+e.target.value); E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, b=this.s.b, ctx=E.ctx; P.axes();
      function f(t){return t*t*t + b*t;}
      P.curve(f, '#7ab8ff');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = f(x)', P.X(1.6), P.Y(f(1.6))+(b<0?0.5:-0.5));
      // f'(x)=3x²+b=0 → x=±√(−b/3) : b<0 일 때만 극값 두 개 (실계산)
      var disc = -b/3, capExtra;
      if(disc > 1e-9){
        var xc = Math.sqrt(disc);           // 임계점 |x|
        var xmax = -xc, ymax = f(xmax);     // f''=6x<0 → 극대 (왼쪽)
        var xmin =  xc, ymin = f(xmin);     // f''=6x>0 → 극소 (오른쪽)
        P.dot(xmax, ymax, '#ffb27a', '극대('+xmax.toFixed(2)+', '+ymax.toFixed(2)+')');
        P.dot(xmin, ymin, '#8fe3b5', '극소('+xmin.toFixed(2)+', '+ymin.toFixed(2)+')');
        // 증감 화살표 (극대 왼쪽 ↗, 사이 ↘, 극소 오른쪽 ↗)
        ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#9b99a3';
        ctx.fillText('↗', P.X(xmax-0.7), P.Y(f(xmax-0.7)+0.4));
        ctx.fillText('↘', P.X(0), P.Y(f(0)+0.6));
        ctx.fillText('↗', P.X(xmin+0.7), P.Y(f(xmin+0.7)-0.4));
        capExtra = '극값: x=±'+xc.toFixed(3)+' (f\'=3x²+b=0)';
      } else {
        // f'=3x²+b≥0 항상 → 단조증가 (극값 없음)
        ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#9b99a3';
        ctx.fillText('↗', P.X(-1.5), P.Y(f(-1.5)+0.4)); ctx.fillText('↗', P.X(1.5), P.Y(f(1.5)-0.4));
        capExtra = '극값 없음 — f\'=3x²+b≥0 이라 단조증가';
      }
      // 변곡점 f''(x)=6x=0 → x=0 (실계산)
      var xi=0, yi=f(xi); P.dot(xi, yi, 'rgba(244,160,192,0.9)', '변곡('+xi.toFixed(2)+', '+yi.toFixed(2)+')');
      // 계수 b 표기: 0→항 생략, 1→+ x, −1→− x, 그 외 + b·x / − |b|·x
      var bt=(b===0?'':b===1?' + x':b===-1?' − x':b>0?' + '+b+'·x':' − '+(-b)+'·x');
      E.big('f(x) = x³'+bt+' 의 개형', '미분 종합 — f\'으로 증감(극대·극소), f\'\'으로 요철(변곡)을 알면 그래프 완성! '+capExtra); }
  },

  // ══════════ 18.4 최적화 ══════════
  { id:'ch18_04',
    enter:function(E){ this.s={w:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>가로 w (둘레 20 고정)</label><input type="range" id="ww" min="1" max="9" step="1" value="3"><output id="wwo">3</output></div>');
      var self=this; E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, w=this.s.w, h=10-w, area=w*h, scale=18, cx=E.W*0.30, cy=E.H*0.46;
      // 직사각형
      var pw=w*scale, ph=h*scale;
      ctx.fillStyle='rgba(122,184,255,0.2)'; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2;
      ctx.fillRect(cx-pw/2,cy-ph/2,pw,ph); ctx.strokeRect(cx-pw/2,cy-ph/2,pw,ph);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('w='+w, cx, cy+ph/2+18); ctx.save(); ctx.translate(cx-pw/2-14,cy); ctx.rotate(-Math.PI/2); ctx.fillText('h='+h,0,0); ctx.restore();
      // 넓이-w 그래프(작게)
      var gx=E.W*0.62, gy0=E.H*0.62, gw=E.W*0.28, gh=E.H*0.32;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,gy0); ctx.lineTo(gx+gw,gy0); ctx.moveTo(gx,gy0); ctx.lineTo(gx,gy0-gh); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2; ctx.beginPath();
      for(var ww=0;ww<=10;ww+=0.2){ var ar=ww*(10-ww), px=gx+(ww/10)*gw, py=gy0-(ar/25)*gh; if(ww===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      var px=gx+(w/10)*gw, py=gy0-(area/25)*gh; ctx.fillStyle=(w===5)?'#ffb27a':'#fff'; ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.fill();
      ctx.fillStyle=(w===5)?'#ffb27a':'#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('A='+area, px, py-9);
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('넓이 A vs w', gx+gw/2, gy0+18);
      E.big('넓이 = w(10−w) = '+area+(w===5?'  ← 최대!':''), '최적화 — 둘레 고정시 넓이 최대는 정사각형(w=5). f\'=10−2w=0 → w=5'); }
  },

  // ══════════ 18.5 테일러 근사 ══════════
  { id:'ch18_05',
    enter:function(E){ this.s={N:1}; E.Plot.range(-4,4,-2.5,2.5).lab('x','y');
      E.controls('<div class="ctrl"><label>항 개수 N</label><input type="range" id="tn" min="1" max="5" step="1" value="1"><output id="tno">1</output></div>');
      var self=this; E.bind('#tn','input',function(e){ self.s.N=+e.target.value; document.getElementById('tno').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, N=this.s.N, ctx=E.ctx; P.axes();
      // 진짜 sin
      P.curve(Math.sin, 'rgba(255,255,255,0.4)');
      // 테일러 다항식 (sin: x - x³/6 + x⁵/120 - ...)
      P.curve(function(x){ var s=0; for(var k=0;k<N;k++){ var p=2*k+1, sign=(k%2===0)?1:-1; s+= sign*Math.pow(x,p)/fact(p); } return s; }, '#7ab8ff');
      var degs=[1,3,5,7,9];
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('진짜 sin x', P.X(2.2), P.Y(1.3));
      ctx.fillStyle='#7ab8ff'; ctx.fillText('테일러 '+N+'항 (최고차 '+degs[N-1]+'차)', P.X(-3.9), P.Y(-1.7));
      E.big('sin x ≈ '+N+'항 (최고차 '+degs[N-1]+'차)', '테일러 근사 — 다항식으로 곡선 흉내! 항을 더할수록 더 넓게 sin과 겹칩니다 (17장 접선근사의 확장)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
