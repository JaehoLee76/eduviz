/* 제20장 적분의 응용 — 넓이·부피·길이·미분방정식
   동작(behavior)만. 텍스트는 content/ch20.json */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 20.1 두 곡선 사이 넓이 ══════════
  { id:'ch20_01',
    enter:function(E){ this.s={}; E.Plot.range(-0.5,3,-0.5,5); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      function top(x){return 2*x;} function bot(x){return x*x;}
      // 사이 영역 (교점 0~2)
      ctx.fillStyle='rgba(255,178,122,0.28)'; ctx.beginPath();
      for(var i=0;i<=60;i++){ var t=2*i/60; var px=P.X(t),py=P.Y(top(t)); if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      for(var j=60;j>=0;j--){ var t2=2*j/60; ctx.lineTo(P.X(t2),P.Y(bot(t2))); } ctx.closePath(); ctx.fill();
      P.curve(top,'#8fe3b5'); P.curve(bot,'#7ab8ff');
      P.dot(0,0,'#ffb27a'); P.dot(2,4,'#ffb27a');
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('y=2x (위)', P.X(2.1), P.Y(4.2));
      ctx.fillStyle='#7ab8ff'; ctx.fillText('y=x² (아래)', P.X(2.1), P.Y(3.0));
      E.big('∫₀² (2x − x²) dx = 4/3', '두 곡선 사이 넓이 = ∫(위 − 아래). 교점 사이를 적분합니다'); }
  },

  // ══════════ 20.2 회전체의 부피 (원판법) ══════════
  { id:'ch20_02',
    enter:function(E){ this.s={}; E.Plot.range(-0.3,3.3,-2.5,2.5); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      function f(x){return 0.7*Math.sqrt(x+0.05)+0.3;}
      // 위·아래 윤곽
      P.curve(f,'#7ab8ff'); P.curve(function(x){return -f(x);},'#7ab8ff');
      // 단면 원판(타원)
      var sy=(P.Y(0)-P.Y(1));
      for(var k=1;k<=5;k++){ var x=k*0.55, r=f(x);
        ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.beginPath();
        ctx.ellipse(P.X(x),P.Y(0), Math.max(2,(P.X(x+0.13)-P.X(x))), Math.abs(P.Y(r)-P.Y(0)),0,0,TAU); ctx.stroke();
        ctx.fillStyle='rgba(143,227,181,0.10)'; ctx.fill(); }
      ctx.fillStyle='#9b99a3'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('← x축 둘레로 회전 →', E.W/2, P.Y(-2.1));
      E.big('V = π ∫ₐᵇ [f(x)]² dx', '회전체 부피 = 얇은 원판(반지름 f(x))을 쌓기. 각 원판 넓이 πf² 를 적분'); }
  },

  // ══════════ 20.3 곡선의 길이 ══════════
  { id:'ch20_03',
    enter:function(E){ this.s={n:4}; E.Plot.range(-0.3,3.3,-0.5,5);
      E.controls('<div class="ctrl"><label>선분 개수 n</label><input type="range" id="nn" min="1" max="20" step="1" value="4"><output id="nno">4</output></div>');
      var self=this; E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, n=this.s.n, ctx=E.ctx, a=0, b=3, dx=(b-a)/n; P.axes();
      function f(x){return 0.5*x*x;}
      P.curve(f,'rgba(122,184,255,0.4)');
      // 꺾은선 근사
      var len=0; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=n;i++){ var x=a+i*dx, y=f(x); if(i===0)ctx.moveTo(P.X(x),P.Y(y)); else { ctx.lineTo(P.X(x),P.Y(y)); var px=a+(i-1)*dx; len+=Math.sqrt(dx*dx+(f(x)-f(px))*(f(x)-f(px))); } }
      ctx.stroke();
      for(var k=0;k<=n;k++){ var xx=a+k*dx; P.dot(xx,f(xx),'#ffb27a'); }
      E.big('길이 ≈ '+len.toFixed(3)+'  (선분 '+n+'개)', '곡선 길이 = 미소 빗변 √(Δx²+Δy²)의 합 → ∫√(1+(f\')²)dx (피타고라스!)'); }
  },

  // ══════════ 20.4 미분방정식 ══════════
  { id:'ch20_04',
    enter:function(E){ this.s={k:0.5}; E.Plot.range(-3,3,-0.5,7);
      E.controls('<div class="ctrl"><label>비율 k</label><input type="range" id="kk" min="-1" max="1" step="0.25" value="0.5"><output id="kko">0.5</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.k, ctx=E.ctx; P.axes();
      P.curve(function(x){return Math.exp(k*x);}, '#7ab8ff');
      P.dot(0,1,'#ffb27a','(0, 1)');
      var note = k>0?'k>0 → 지수 성장 (인구·복리·전염)' : k<0?'k<0 → 지수 감쇠 (방사성붕괴·냉각)' : 'k=0 → 변화 없음 (상수)';
      E.big("y' = "+k+"y  →  y = e^("+k+"x)", '미분방정식 — 변화율이 자기 크기에 비례! 해는 지수함수. '+note); }
  },

  // ══════════ 20 물리 응용: 속도 → 거리 ══════════
  { id:'ch20_05',
    enter:function(E){ this.s={t:3}; E.Plot.range(0,5,0,6);
      E.controls('<div class="ctrl"><label>시간 t</label><input type="range" id="tt" min="1" max="5" step="0.5" value="3"><output id="tto">3</output></div>');
      var self=this; E.bind('#tt','input',function(e){ self.s.t=+e.target.value; document.getElementById('tto').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, t=this.s.t, ctx=E.ctx; P.axes();
      function v(x){return x;}  // v(t)=t
      var y0=P.Y(0);
      ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.beginPath(); ctx.moveTo(P.X(0),y0);
      for(var i=0;i<=60;i++){ var s=t*i/60; ctx.lineTo(P.X(s),P.Y(v(s))); } ctx.lineTo(P.X(t),y0); ctx.closePath(); ctx.fill();
      P.curve(v,'#7ab8ff');
      ctx.fillStyle='#7ab8ff'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('속도 v(t)=t', P.X(3.6), P.Y(4.2));
      var dist=t*t/2;
      E.big('이동거리 = ∫₀^'+t+' v dt = '+dist.toFixed(2), '속도 그래프 아래 넓이 = 이동 거리! (거리→미분→속도→적분→거리, 17·19장 한 바퀴)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
