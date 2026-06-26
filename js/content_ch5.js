/* 제5장 함수 — 5.1 함수와 그래프 · 5.2 이차함수 · 5.3 분수·무리함수
   동작(behavior)만. 텍스트(title/narr/more/문제)는 content/ch5.json */
(function(){
  function fmtLin(a,b){
    var ax=(a===0?'':(a===1?'x':a===-1?'−x':a+'x'));
    var bp=(b===0?(a===0?'0':''):(a===0?(b>0?''+b:'−'+(-b)):(b>0?' + '+b:' − '+(-b))));
    return 'y = '+ax+bp;
  }

  var scenes=[

  // 5.1a 함수란 — 입력→출력 상자
  { id:'ch5_01',
    enter:function(E){ this.s={x:1}; E.setOn([]);
      E.controls('<div class="ctrl"><label>입력 x</label><input type="range" id="fx" min="-3" max="3" step="1" value="1"><output id="fo">1</output></div>');
      var self=this; E.bind('#fx','input',function(e){ self.s.x=+e.target.value; document.getElementById('fo').textContent=e.target.value; E.blip(420+self.s.x*40,0.1); }); },
    draw:function(E){ var ctx=E.ctx, s=this.s, x=s.x, fx=2*x+1, cx=E.W/2, cy=E.H*0.46;
      function node(nx,val,col){ ctx.globalAlpha=0.18; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(nx,cy,30,0,7); ctx.fill(); ctx.globalAlpha=1;
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(nx,cy,30,0,7); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(val,nx,cy); ctx.textBaseline='alphabetic'; }
      var bw=190, bh=84;
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-bw/2,cy-bh/2,bw,bh,12);ctx.fill();ctx.stroke();}else{ctx.fillRect(cx-bw/2,cy-bh/2,bw,bh);ctx.strokeRect(cx-bw/2,cy-bh/2,bw,bh);}
      ctx.fillStyle='#ffb27a'; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('f(x) = 2x + 1', cx, cy); ctx.textBaseline='alphabetic';
      function arrow(x1,x2){ ctx.strokeStyle=E.COL.txt; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1,cy); ctx.lineTo(x2,cy); ctx.stroke(); ctx.fillStyle=E.COL.txt; ctx.beginPath(); ctx.moveTo(x2,cy); ctx.lineTo(x2-9,cy-5); ctx.lineTo(x2-9,cy+5); ctx.fill(); }
      node(cx-205,x,'#7ab8ff'); arrow(cx-172,cx-bw/2-6);
      arrow(cx+bw/2+6,cx+172); node(cx+205,fx,'#8fe3b5');
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('입력 (input)',cx-205,cy+52); ctx.fillText('출력 (output)',cx+205,cy+52);
      E.big('f('+x+') = 2·'+x+' + 1 = '+fx, '입력 x = '+x+' → 출력 '+fx); }
  },

  // 5.1b 일차함수 그래프
  { id:'ch5_02',
    enter:function(E){ this.s={a:1,b:1}; E.Plot.range(-5,5,-5,5);
      E.controls('<div class="ctrl"><label>기울기 a</label><input type="range" id="la" min="-2" max="2" step="1" value="1"><output id="lao">1</output><label style="margin-left:14px">y절편 b</label><input type="range" id="lb" min="-3" max="3" step="1" value="1"><output id="lbo">1</output></div>');
      var self=this; E.bind('#la','input',function(e){ self.s.a=+e.target.value; document.getElementById('lao').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#lb','input',function(e){ self.s.b=+e.target.value; document.getElementById('lbo').textContent=e.target.value; E.blip(400,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, a=s.a, b=s.b; P.axes();
      P.curve(function(x){return a*x+b;}, '#7ab8ff');
      P.dot(0,b,'#ffb27a'); var bl=E.blink(); E.ctx.globalAlpha=bl; P.dot(1,a+b,'#8fe3b5','(1, '+(a+b)+')'); E.ctx.globalAlpha=1;
      E.big(fmtLin(a,b), '기울기 a = '+a+' · y절편 b = '+b); }
  },

  // 5.2a 이차함수
  { id:'ch5_03',
    enter:function(E){ this.s={a:1,b:0,c:-2}; E.Plot.range(-5,5,-6,8);
      E.controls('<div class="ctrl"><label>a</label><input type="range" id="qa" min="-2" max="2" step="0.5" value="1"><output id="qao">1</output><label style="margin-left:12px">b</label><input type="range" id="qb" min="-4" max="4" step="1" value="0"><output id="qbo">0</output><label style="margin-left:12px">c</label><input type="range" id="qc" min="-4" max="4" step="1" value="-2"><output id="qco">-2</output></div>');
      var self=this;
      E.bind('#qa','input',function(e){ self.s.a=+e.target.value; document.getElementById('qao').textContent=e.target.value; E.blip(480,0.1); });
      E.bind('#qb','input',function(e){ self.s.b=+e.target.value; document.getElementById('qbo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#qc','input',function(e){ self.s.c=+e.target.value; document.getElementById('qco').textContent=e.target.value; E.blip(400,0.1); });
      var el=document.getElementById('qc'); if(el) el.value='-2'; E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, a=s.a, b=s.b, c=s.c; P.axes();
      P.curve(function(x){return a*x*x+b*x+c;}, '#7ab8ff');
      if(a!==0){ var h=-b/(2*a), k=c-b*b/(4*a); E.ctx.globalAlpha=E.blink(); P.dot(h,k,'#8fe3b5','꼭짓점'); E.ctx.globalAlpha=1; }
      var aL=(a===0?'0':a===1?'':a===-1?'−':a);
      var bx=(b?((b>0?' + '+(b===1?'':b):' − '+(b===-1?'':(-b)))+'x'):'');
      E.big('y = '+aL+'x²'+bx+(c?(c>0?' + '+c:' − '+(-c)):''), a===0?'a = 0 이면 직선! (이차함수 아님)':'a: 폭·방향 · c: 상하 이동'); }
  },

  // 5.2b 꼭짓점·축
  { id:'ch5_04',
    enter:function(E){ this.s={p:1,q:-2}; E.Plot.range(-5,5,-6,6);
      E.controls('<div class="ctrl"><label>p (가로)</label><input type="range" id="vp" min="-3" max="3" step="1" value="1"><output id="vpo">1</output><label style="margin-left:14px">q (세로)</label><input type="range" id="vq" min="-4" max="4" step="1" value="-2"><output id="vqo">-2</output></div>');
      var self=this; E.bind('#vp','input',function(e){ self.s.p=+e.target.value; document.getElementById('vpo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#vq','input',function(e){ self.s.q=+e.target.value; document.getElementById('vqo').textContent=e.target.value; E.blip(400,0.1); });
      var el=document.getElementById('vq'); if(el) el.value='-2'; E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, p=s.p, q=s.q, ctx=E.ctx; P.axes();
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(p),P.Y(6)); ctx.lineTo(P.X(p),P.Y(-6)); ctx.stroke(); ctx.setLineDash([]);
      P.curve(function(x){return (x-p)*(x-p)+q;}, '#7ab8ff');
      E.ctx.globalAlpha=E.blink(); P.dot(p,q,'#8fe3b5','꼭짓점 ('+p+', '+q+')'); E.ctx.globalAlpha=1;
      E.big('y = (x − '+p+')² + ('+q+')', '꼭짓점 ('+p+', '+q+') · 축 x = '+p); }
  },

  // 5.3a 분수함수
  { id:'ch5_05',
    enter:function(E){ this.s={k:2}; E.Plot.range(-5,5,-5,5);
      E.controls('<div class="ctrl"><label>k</label><input type="range" id="rk" min="-4" max="4" step="1" value="2"><output id="rko">2</output></div>');
      var self=this; E.bind('#rk','input',function(e){ self.s.k=+e.target.value; document.getElementById('rko').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, k=s.k; P.axes();
      P.curve(function(x){ return Math.abs(x)<0.0001? (1/0) : k/x; }, '#7ab8ff');
      E.big('y = '+k+' / x', k===0?'k = 0 이면 y = 0':'점근선(asymptote): x축, y축'); }
  },

  // 5.3b 무리함수
  { id:'ch5_06',
    enter:function(E){ this.s={p:0}; E.Plot.range(-2,8,-1,5);
      E.controls('<div class="ctrl"><label>가로 이동 p</label><input type="range" id="sp" min="0" max="4" step="1" value="0"><output id="spo">0</output></div>');
      var self=this; E.bind('#sp','input',function(e){ self.s.p=+e.target.value; document.getElementById('spo').textContent=e.target.value; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, p=s.p; P.axes();
      P.curve(function(x){ return x>=p? Math.sqrt(x-p): (0/0); }, '#7ab8ff');
      E.ctx.globalAlpha=E.blink(); P.dot(p,0,'#8fe3b5','시작 ('+p+', 0)'); E.ctx.globalAlpha=1;
      E.big('y = √(x − '+p+')', '정의역: x ≥ '+p+' 에서만'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
