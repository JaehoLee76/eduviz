/* 제7장 지수·로그 — 7.1 지수의 확장 · 7.2 지수·로그함수 · 7.3 로그의 성질
   동작(behavior)만. 텍스트는 content/ch7.json */
(function(){
  function lg(x,b){ return Math.log(x)/Math.log(b); }

  var scenes=[

  // ══════════ 7.1 지수의 확장 ══════════
  { id:'ch7_01',
    enter:function(E){ this.s={n:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>지수 n (밑 2)</label><input type="range" id="en" min="-3" max="3" step="0.5" value="3"><output id="eno">3</output></div>');
      var self=this; E.bind('#en','input',function(e){ self.s.n=+e.target.value; document.getElementById('eno').textContent=(+e.target.value); E.blip(360+self.s.n*60,0.1); }); },
    draw:function(E){ var ctx=E.ctx, n=this.s.n, v=Math.pow(2,n), cx=E.W/2, baseY=E.H*0.66;
      // 막대: 높이 ∝ 2^n (로그 스케일 느낌 방지 위해 선형, 최대 8 기준)
      var maxH=E.H*0.34, h=Math.min(v,8)/8*maxH, bw=80;
      ctx.fillStyle='rgba(122,184,255,0.25)'; ctx.fillRect(cx-bw/2, baseY-h, bw, h);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(cx-bw/2, baseY-h, bw, h);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx-160,baseY); ctx.lineTo(cx+160,baseY); ctx.stroke();
      ctx.fillStyle='#8fe3b5'; ctx.font='600 20px sans-serif'; ctx.textAlign='center'; ctx.fillText('2^'+n+' = '+(v%1===0?v:v.toFixed(3)), cx, baseY-h-16);
      var note = n<0?'음의 지수 → 역수 (1/2^'+(-n)+')' : n===0?'0 지수 → 항상 1' : (n%1!==0?'분수 지수 → 거듭제곱근 (1장에서 다룸)':'양의 정수 → 거듭 곱하기');
      E.big('2ⁿ,  n = '+n, note); }
  },

  // ══════════ 7.2 지수함수 · 로그함수 ══════════
  // 7.2a 지수함수 y=a^x
  { id:'ch7_02',
    enter:function(E){ this.s={a:2}; E.Plot.range(-3,3,-1,8).lab('x','y');
      E.controls('<div class="ctrl"><label>밑 a</label><input type="range" id="ea" min="0.5" max="3" step="0.5" value="2"><output id="eao">2</output></div>');
      var self=this; E.bind('#ea','input',function(e){ self.s.a=+e.target.value; document.getElementById('eao').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, a=this.s.a, ctx=E.ctx; P.axes();
      P.curve(function(x){ return Math.pow(a,x); }, '#7ab8ff');
      ctx.fillStyle='#7ab8ff'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = '+a+'ˣ', P.X(1.4), P.Y(Math.min(Math.pow(a,1.4),7.2)));
      E.ctx.globalAlpha=E.blink(); P.dot(0,1,'#ffb27a','(0, 1)'); E.ctx.globalAlpha=1;
      E.big('y = '+a+'ˣ', a>1?'밑 > 1 → 증가 (폭발적 성장)':a<1?'밑 < 1 → 감소 (지수 감쇠)':'밑 = 1 → 상수'); }
  },

  // 7.2b 로그 = 지수의 역함수 (y=x 대칭)
  { id:'ch7_03',
    enter:function(E){ this.s={t:1}; E.Plot.range(-3,6,-3,6).lab('x','y');
      E.controls('<div class="ctrl"><label>지수 위 점의 x 좌표</label><input type="range" id="tx" min="-2" max="2.5" step="0.5" value="1"><output id="txo">1</output></div>');
      var self=this; E.bind('#tx','input',function(e){ self.s.t=+e.target.value; document.getElementById('txo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx; P.axes();
      // y = x (대칭축)
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(P.X(-3),P.Y(-3)); ctx.lineTo(P.X(6),P.Y(6)); ctx.stroke(); ctx.setLineDash([]);
      P.curve(function(x){ return Math.pow(2,x); }, '#7ab8ff');         // 지수
      P.curve(function(x){ return x>0? lg(x,2): NaN; }, '#8fe3b5');     // 로그
      ctx.fillStyle='#7ab8ff'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = 2ˣ', P.X(1.7), P.Y(5));
      ctx.fillStyle='#8fe3b5'; ctx.fillText('y = log₂x', P.X(4), P.Y(2.4));
      // 지수 위 점 (x, 2^x) — 슬라이더로 이동
      var ex=s.t, ey=Math.pow(2,ex);
      // y=x 대칭점 = 좌표 교환 (ey, ex) — 로그 곡선 위
      var lx=ey, ly=ex;
      // 거울 연결선(점선)
      ctx.strokeStyle='rgba(255,178,122,0.55)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(ex),P.Y(ey)); ctx.lineTo(P.X(lx),P.Y(ly)); ctx.stroke(); ctx.setLineDash([]);
      function f(v){ return v%1===0?v:v.toFixed(2); }
      P.dot(ex,ey,'#7ab8ff','('+f(ex)+', '+f(ey)+')');
      P.dot(lx,ly,'#8fe3b5','('+f(lx)+', '+f(ly)+')');
      E.big('지수 ('+f(ex)+', '+f(ey)+')  ↔  로그 ('+f(lx)+', '+f(ly)+')', '좌표 (x, y) ↔ (y, x) 교환 — y = x 에 대칭(거울)'); }
  },

  // 7.2c 로그함수 그래프
  { id:'ch7_04',
    enter:function(E){ this.s={a:2}; E.Plot.range(-1,8,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>밑 a</label><input type="range" id="la" min="2" max="5" step="1" value="2"><output id="lao">2</output></div>');
      var self=this; E.bind('#la','input',function(e){ self.s.a=+e.target.value; document.getElementById('lao').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, a=this.s.a, ctx=E.ctx; P.axes();
      // 점근선 x=0
      ctx.strokeStyle='rgba(244,160,192,0.4)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(-4)); ctx.lineTo(P.X(0),P.Y(4)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(244,160,192,0.85)'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('점근선 x = 0', P.X(0)+6, P.geom().top+34);
      var sub=(a===2?'₂':a===3?'₃':a===4?'₄':'₅');
      P.curve(function(x){ return x>0? lg(x,a): NaN; }, '#8fe3b5');
      ctx.fillStyle='#8fe3b5'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('y = log'+sub+' x', P.X(a*1.5), P.Y(lg(a*1.5,a)+0.4));
      E.ctx.globalAlpha=E.blink(); P.dot(1,0,'#ffb27a','(1, 0)'); E.ctx.globalAlpha=1;
      E.big('y = log'+(a===2?'₂':a===3?'₃':a===4?'₄':'₅')+' x', '정의역 x > 0 · 항상 (1, 0)을 지납니다'); }
  },

  // ══════════ 7.3 로그의 성질 ══════════
  // 곱 → 합:  log(xy) = log x + log y
  { id:'ch7_05',
    enter:function(E){ this.s={x:2,y:4}; E.setOn([]);
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="px" min="1" max="8" step="1" value="2"><output id="pxo">2</output><label style="margin-left:14px">y</label><input type="range" id="py" min="1" max="8" step="1" value="4"><output id="pyo">4</output></div>');
      var self=this;
      E.bind('#px','input',function(e){ self.s.x=+e.target.value; document.getElementById('pxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#py','input',function(e){ self.s.y=+e.target.value; document.getElementById('pyo').textContent=e.target.value; E.blip(420,0.1); }); },
    draw:function(E){ var ctx=E.ctx, x=this.s.x, y=this.s.y, lx=lg(x,2), ly=lg(y,2), lxy=lg(x*y,2);
      var left=E.W/2-200, baseY=E.H*0.40, unit=44, bh=30, gap=58;
      function bar(yy,len,col,label){ ctx.fillStyle=col.replace('1)','0.28)'); ctx.fillRect(left, yy, len*unit, bh);
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(left, yy, len*unit, bh);
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(label, left+len*unit+10, yy+bh/2); ctx.textBaseline='alphabetic'; }
      bar(baseY, lx, 'rgba(122,184,255,1)', 'log₂'+x+' = '+lx.toFixed(2));
      bar(baseY+gap, ly, 'rgba(143,227,181,1)', 'log₂'+y+' = '+ly.toFixed(2));
      // 합 = 이어붙이기
      ctx.fillStyle='rgba(122,184,255,0.28)'; ctx.fillRect(left, baseY+gap*2, lx*unit, bh);
      ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.fillRect(left+lx*unit, baseY+gap*2, ly*unit, bh);
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.strokeRect(left, baseY+gap*2, lxy*unit, bh);
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('log₂('+x+'×'+y+') = log₂'+(x*y)+' = '+lxy.toFixed(2), left+lxy*unit+10, baseY+gap*2+bh/2); ctx.textBaseline='alphabetic';
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('두 막대를 이어붙이면(합) = 곱의 로그 막대와 같은 길이', E.W/2, baseY+gap*2+bh+34);
      E.big('log₂(xy) = log₂x + log₂y', '곱셈이 덧셈으로! ('+lx.toFixed(2)+' + '+ly.toFixed(2)+' = '+lxy.toFixed(2)+')'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
