/* 제3장 방정식 — 3.1 해법 · 3.2 이차방정식 · 3.3 고차 · 3.4 연립 · 3.5 등식의 증명
   저울, 완전제곱식(정사각형 완성), 판별식, x절편, 두 직선 교점, (a+b)² 항등식
*/
(function(){
  function ez(p){ p=Math.max(0,Math.min(1,p)); return p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; }
  function box(ctx,x,y,w,h,col,label,fs){
    ctx.globalAlpha=0.16; ctx.fillStyle=col; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h);
    if(label!=null && w>16 && h>14){ ctx.fillStyle=col; ctx.font='600 '+(fs||14)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x+w/2,y+h/2); ctx.textBaseline='alphabetic'; }
  }
  function drawBalance(E,leftT,rightT){
    var ctx=E.ctx, cx=E.W/2, cy=E.H*0.42, bw=Math.min(440,E.W*0.5);
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-24,cy+66); ctx.lineTo(cx+24,cy+66); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffb27a'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(cx-bw/2,cy); ctx.lineTo(cx+bw/2,cy); ctx.stroke();
    function pan(px,txt){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,cy); ctx.lineTo(px,cy+30); ctx.stroke();
      ctx.fillStyle='rgba(122,184,255,0.14)'; ctx.beginPath(); ctx.ellipse(px,cy+44,58,15,0,0,7); ctx.fill();
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(px,cy+44,58,15,0,0,7); ctx.stroke();
      ctx.fillStyle='#ece9e0'; ctx.font='600 24px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt,px,cy+44); ctx.textBaseline='alphabetic'; }
    pan(cx-bw/2,leftT); pan(cx+bw/2,rightT);
    ctx.fillStyle=E.COL.txt; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('=',cx,cy+50);
  }

  var scenes = [

  // ══════════ 3.1 방정식과 해법 ══════════
  { id:'ch3_01',
    enter:function(E){ this.s={step:0}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(this.s.step?520:400,0.15); },
    draw:function(E){ var s=this.s, ctx=E.ctx, cx=E.W/2, cy=E.H*0.42;
      var L=['2x + 1','2x','x'][s.step], R=['5','4','2'][s.step], op=['','양변에서 1을 빼기','양변을 2로 나누기'][s.step];
      drawBalance(E,L,R);
      if(op){ ctx.fillStyle='#7ab8ff'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('↓ '+op, cx, cy-44); }
      if(s.step>=2){ ctx.globalAlpha=E.blink(); ctx.fillStyle='#ffb27a'; ctx.font='700 20px sans-serif'; ctx.textAlign='center'; ctx.fillText('x = 2', cx, cy-74); ctx.globalAlpha=1; }
      E.tapHint(cx, cy+102, s.step<2?'▶ 다음 단계':'↻ 처음부터', s.step<2);
      E.big(s.step<2?'2x + 1 = 5':'x = 2', s.step<2?'양변에 똑같이 — 균형 유지':'해를 찾았습니다 ✓'); }
  },

  { id:'ch3_02',
    enter:function(E){ E.setOn([]); E.big('3x − 4 = 11', '양변 +4 → 3x = 15 → ÷3');
      E.quiz({q:'3x − 4 = 11 의 해 x는?', choices:['3','5','7','15'], answer:1, explain:'양변 +4 → 3x = 15, ÷3 → x = 5'}); },
    draw:function(E){}
  },

  // ══════════ 3.2 이차방정식 ══════════
  { id:'ch3_03',
    enter:function(E){ this.s={p:0,play:false}; E.setOn([]); },
    tap:function(E){ if(this.s.play)return; if(this.s.p>=1){ this.s.p=0; E.blip(340,0.12); } else { this.s.play=true; E.blip(540,0.15); } },
    draw:function(E){ var s=this.s, ctx=E.ctx; if(s.play){ s.p+=0.012; if(s.p>=1){s.p=1;s.play=false;} }
      var mp=ez(s.p), u=Math.min(30,E.H*0.046), xl=4*u, t=3*u, big=xl+t, ox=E.W/2-big/2, oy=E.H*0.34;
      ctx.textAlign='center';
      box(ctx,ox,oy,xl,xl,'#7ab8ff','x²',16);
      box(ctx,ox+xl,oy,t,xl,'#8fe3b5','3x');
      box(ctx,ox,oy+xl,xl,t,'#8fe3b5','3x');
      if(mp<0.02){ ctx.setLineDash([5,4]); ctx.strokeStyle='rgba(244,160,192,0.8)'; ctx.lineWidth=1.5; ctx.strokeRect(ox+xl,oy+xl,t,t); ctx.setLineDash([]);
        ctx.fillStyle='#f4a0c0'; ctx.font='700 24px sans-serif'; ctx.textBaseline='middle'; ctx.fillText('?',ox+xl+t/2,oy+xl+t/2); ctx.textBaseline='alphabetic'; }
      else { var dy=(1-mp)*70, ca=mp;
        ctx.globalAlpha=ca*0.18; ctx.fillStyle='#ffb27a'; ctx.fillRect(ox+xl,oy+xl-dy,t,t);
        ctx.globalAlpha=ca; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=1.5; ctx.strokeRect(ox+xl,oy+xl-dy,t,t);
        var la=(s.p>=1)?E.blink():ca; ctx.globalAlpha=la; ctx.fillStyle='#ffb27a'; ctx.font='700 16px sans-serif'; ctx.textBaseline='middle'; ctx.fillText('+9',ox+xl+t/2,oy+xl-dy+t/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      if(s.p>=1){ var sl=E.blink(); ctx.fillStyle='#ffb27a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.globalAlpha=sl; ctx.fillText('x', ox+xl/2, oy-12); ctx.fillText('3', ox+xl+t/2, oy-12);
        ctx.globalAlpha=sl*0.6; ctx.fillText('+', ox+xl, oy-12); ctx.globalAlpha=sl;
        ctx.save();ctx.translate(ox-14, oy+xl/2);ctx.rotate(-Math.PI/2);ctx.fillText('x',0,0);ctx.restore();
        ctx.save();ctx.translate(ox-14, oy+xl+t/2);ctx.rotate(-Math.PI/2);ctx.fillText('3',0,0);ctx.restore();
        ctx.globalAlpha=sl*0.6;ctx.save();ctx.translate(ox-14, oy+xl);ctx.rotate(-Math.PI/2);ctx.fillText('+',0,0);ctx.restore();
        ctx.globalAlpha=1; }
      ctx.textAlign='center';
      if(s.p===0&&!s.play) E.tapHint(ox+big/2, oy+big+40, '▶ 빈 모서리(?)를 채워 정사각형 완성 → 풀기', true);
      else if(s.p>=1&&!s.play) E.tapHint(ox+big/2, oy+big+40, '↻ 다시 보기', false);
      var bigN, bigW;
      if(s.p<0.02){ bigN='x² + 6x = 7 을 풀자'; bigW='왼쪽을 (x+□)² 정사각형으로 만들면 √로 풀린다 — 한 귀퉁이(?)가 비었다'; }
      else if(s.p<1){ bigN='빈 모서리를 채우는 중…'; bigW='6x = 3x + 3x 를 두 변에 붙이면 → 빈 곳은 3 × 3 = 9'; }
      else { bigN='(x + 3)² 완성  →  x = 1 또는 −7'; bigW='9 = (6의 절반)² 를 양변에 더해 정사각형 완성 → √ → 해!'; }
      E.big(bigN, bigW); }
  },

  { id:'ch3_04',
    enter:function(E){ this.s={b:-2}; E.Plot.range(-5,5,-7,7);
      E.controls('<div class="ctrl"><label>x의 계수 b</label><input type="range" id="sbq" min="-4" max="4" step="1" value="-2"><output id="obq">-2</output></div>');
      var self=this; E.bind('#sbq','input',function(e){ self.s.b=+e.target.value; document.getElementById('obq').textContent=e.target.value; E.blip(360+(self.s.b+4)*36,0.1); });
      var sl=document.getElementById('sbq'); if(sl) sl.value='-2'; E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot, b=s.b; P.axes();
      P.curve(function(x){return -3-x*x;}, 'rgba(255,255,255,0.28)', 1.5);   // 꼭짓점 자취
      P.curve(function(x){return x*x+b*x-3;}, '#7ab8ff');
      var h=-b/2, k=-3-b*b/4, sq=Math.sqrt(b*b+12)/2;
      var bl=E.blink(); E.ctx.globalAlpha=bl; P.dot(-b/2-sq,0,'#ffb27a'); P.dot(-b/2+sq,0,'#ffb27a'); E.ctx.globalAlpha=1;
      P.dot(h,k,'#8fe3b5','꼭짓점 x=−b/2='+h.toFixed(1));
      E.big('y = x² '+(b>=0?'+ '+b:'− '+(-b))+'x − 3', 'b'+(b>=0?'=+'+b:'='+b)+' → 꼭짓점 x = −b/2 = '+h.toFixed(1)+'  (b 키울수록 왼쪽)'); }
  },

  { id:'ch3_05',
    enter:function(E){ this.s={c:-3}; E.Plot.range(-4,6,-5,7);
      E.controls('<div class="ctrl"><label>상수 c</label><input type="range" id="sc" min="-3" max="3" step="1" value="-3"><output id="oc">-3</output></div>');
      var self=this; E.bind('#sc','input',function(e){ self.s.c=+e.target.value; document.getElementById('oc').textContent=e.target.value; E.blip(360+(self.s.c+3)*40,0.1); });
      var sl=document.getElementById('sc'); if(sl) sl.value='-3'; E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot, c=s.c; P.axes();
      P.curve(function(x){return x*x-2*x+c;}, '#7ab8ff');
      var disc=1-c, nroots;
      if(disc>1e-9){ var sq=Math.sqrt(disc); P.dot(1-sq,0,'#ffb27a'); P.dot(1+sq,0,'#ffb27a'); nroots='실근 2개'; }
      else if(disc>-1e-9){ P.dot(1,0,'#ffb27a'); nroots='중근 1개'; }
      else nroots='실근 0개 → 복소수(허근)';
      E.big('x² − 2x + ('+c+') = 0', '판별식 D = '+(4-4*c)+' → '+nroots); }
  },

  { id:'ch3_06',
    enter:function(E){ this.s={c:0}; E.Plot.range(-3,5,-3,3);
      E.controls('<div class="ctrl"><label>상수 c</label><input type="range" id="sc2" min="0" max="4" step="1" value="0"><output id="oc2">0</output></div>');
      var self=this; E.bind('#sc2','input',function(e){ self.s.c=+e.target.value; document.getElementById('oc2').textContent=e.target.value; E.blip(380+self.s.c*45,0.1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot, ctx=E.ctx, c=s.c, D=4-4*c; P.axes();
      ctx.fillStyle=E.COL.txt; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('실수부 Re', P.X(3.1), P.Y(0)-8); ctx.fillText('허수부 Im', P.X(0)+8, P.Y(2.7));
      ctx.globalAlpha=E.blink();
      if(D>=0){ var sq=Math.sqrt(D)/2; P.dot(1-sq,0,'#ffb27a'); P.dot(1+sq,0,'#ffb27a'); }
      else { var im=Math.sqrt(-D)/2; P.dot(1,im,'#f4a0c0'); P.dot(1,-im,'#f4a0c0'); }
      ctx.globalAlpha=1;
      var big2, sub;
      if(D>0){ big2='x = 1 ± '+(Math.sqrt(D)/2).toFixed(2)+'  (실근 2개)'; sub='실수축 위의 두 점'; }
      else if(D===0){ big2='x = 1  (중근)'; sub='실수축 한 점에서 만남'; }
      else { big2='x = 1 ± '+(Math.sqrt(-D)/2).toFixed(2)+'i  (허근)'; sub='i²=−1 · 평면 위·아래로 갈라짐'; }
      E.big(big2, sub); }
  },

  // ══════════ 3.3 고차방정식 ══════════
  { id:'ch3_07',
    enter:function(E){ this.s={n:1}; E.Plot.range(-4,5,-8,8); E.setOn([]); },
    tap:function(E){ this.s.n=this.s.n%3+1; E.blip(420+this.s.n*60,0.15); },
    draw:function(E){ var s=this.s, P=E.Plot, n=s.n; P.axes();
      var fns=[ function(x){return (x+2);}, function(x){return (x+2)*(x-1);}, function(x){return (x+2)*(x-1)*(x-3)/2;} ];
      var roots=[ [-2], [-2,1], [-2,1,3] ];
      P.curve(fns[n-1], '#7ab8ff');
      E.ctx.globalAlpha=E.blink(); roots[n-1].forEach(function(r){ P.dot(r,0,'#ffb27a'); }); E.ctx.globalAlpha=1;
      E.tapHint(E.W/2, P.geom().bot+40, n<3?'▶ 인수 추가':'↻ 처음부터', n<3);
      var turns=['0번 꺾임','1번 꺾임','2번 꺾임'][n-1];
      E.big(['y = (x+2)','y = (x+2)(x−1)','y = (x+2)(x−1)(x−3)'][n-1], '차수 '+n+' · 근 '+n+'개 · '+turns); }
  },
  { id:'ch3_08',
    enter:function(E){ this.s={}; E.Plot.range(-4,5,-8,8); E.setOn([]);
      E.quiz({q:'(x+1)(x−2)(x−4) = 0 의 해는?', choices:['−1, 2, 4','1, −2, 4','1, 2, 4','−1, −2, −4'], answer:0, explain:'인수 3개가 각각 0: x+1=0→−1, x−2=0→2, x−4=0→4. 3차라 근도 3개.'}); },
    draw:function(E){ var P=E.Plot; P.axes();
      P.curve(function(x){return (x+2)*(x-1)*(x-3)/2;}, '#7ab8ff');
      var bl=E.blink(); E.ctx.globalAlpha=bl; [-2,1,3].forEach(function(r){ P.dot(r,0,'#ffb27a','x='+r); }); E.ctx.globalAlpha=1; }
  },

  { id:'ch3_09',
    enter:function(E){ this.s={b:-3}; E.Plot.range(-3,3,-9,9);
      E.controls('<div class="ctrl"><label>계수 b</label><input type="range" id="sb3" min="-4" max="4" step="1" value="-3"><output id="ob3">-3</output></div>');
      var self=this; E.bind('#sb3','input',function(e){ self.s.b=+e.target.value; document.getElementById('ob3').textContent=e.target.value; E.blip(360+(self.s.b+4)*36,0.1); });
      var sl=document.getElementById('sb3'); if(sl) sl.value='-3'; E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot, b=s.b; P.axes();
      P.curve(function(x){return x*x*x+b*x;}, '#7ab8ff');
      var roots=(b<0)?[-Math.sqrt(-b),0,Math.sqrt(-b)]:[0];
      E.ctx.globalAlpha=E.blink(); roots.forEach(function(rt){ P.dot(rt,0,'#ffb27a'); }); E.ctx.globalAlpha=1;
      if(b<0){ var t=Math.sqrt(-b/3); // 봉우리(극대)=(-t,f(-t)), 골(극소)=(t,f(t))
        P.dot(-t,(-t)*(-t)*(-t)+b*(-t),'#8fe3b5','봉우리'); P.dot(t,t*t*t+b*t,'#8fe3b5','골'); }
      E.big('y = x³ '+(b>=0?'+ '+b:'− '+(-b))+'x', b<0?'꺾임 2번 (S자) · 근 3개':(b===0?'y = x³ · 꺾임 없음 · 근 1개':'단조 증가 · 꺾임 없음 · 근 1개')); }
  },

  // ══════════ 3.4 연립방정식 ══════════
  { id:'ch3_10',
    enter:function(E){ this.s={m:1}; E.Plot.range(-5,5,-5,5);
      E.controls('<div class="ctrl"><label>파란선 기울기 m</label><input type="range" id="sm" min="-2" max="2" step="0.5" value="1"><output id="om">1</output></div>');
      var self=this; E.bind('#sm','input',function(e){ self.s.m=+e.target.value; document.getElementById('om').textContent=e.target.value; E.blip(420,0.1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, P=E.Plot; P.axes();
      P.curve(function(x){return s.m*x+1;}, '#7ab8ff');
      P.curve(function(x){return -x+3;}, '#8fe3b5');
      if(Math.abs(s.m+1)>1e-6){ var ix=2/(s.m+1), iy=-ix+3;
        E.ctx.globalAlpha=E.blink(); P.dot(ix,iy,'#ffb27a','('+ix.toFixed(1)+', '+iy.toFixed(1)+')'); E.ctx.globalAlpha=1; }
      var sys='<span style="display:inline-flex;align-items:center;gap:10px;font-size:30px;font-weight:400">'
        +'<span style="font-size:58px;font-weight:200;line-height:0.7">{</span>'
        +'<span style="display:inline-flex;flex-direction:column;line-height:1.45;text-align:left"><span>y = mx + 1</span><span>y = −x + 3</span></span></span>';
      E.big(sys, Math.abs(s.m+1)<1e-6?'평행 — 교점 없음 (해 없음)':'교점 (x, y) = 연립방정식의 해'); }
  },

  // ══════════ 3.5 등식의 증명 ══════════
  { id:'ch3_11',
    enter:function(E){ this.s={p:0,play:false}; E.setOn([]); },
    tap:function(E){ if(this.s.play)return; if(this.s.p>=1){ this.s.p=0; E.blip(340,0.12); } else { this.s.play=true; E.blip(540,0.15); } },
    draw:function(E){ var s=this.s, ctx=E.ctx; if(s.play){ s.p+=0.012; if(s.p>=1){s.p=1;s.play=false;} }
      var p=s.p, u=Math.min(40,E.H*0.06), a=3*u, b=2*u, big=a+b, ox=E.W/2-big/2, oy=E.H*0.30;
      ctx.globalAlpha=0.16; ctx.fillStyle='#7ab8ff'; ctx.fillRect(ox,oy,big,big); ctx.globalAlpha=1;
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(ox,oy,big,big);
      if(p>0.02){ ctx.globalAlpha=p*0.16; ctx.fillStyle='#8fe3b5'; ctx.fillRect(ox+a,oy,b,a); ctx.fillRect(ox,oy+a,a,b);
        ctx.globalAlpha=p*0.16; ctx.fillStyle='#ffb27a'; ctx.fillRect(ox+a,oy+a,b,b);
        ctx.globalAlpha=p; ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ox+a,oy); ctx.lineTo(ox+a,oy+big); ctx.moveTo(ox,oy+a); ctx.lineTo(ox+big,oy+a); ctx.stroke(); ctx.globalAlpha=1;
        var la=(s.p>=1)?E.blink():Math.max(0,(p-0.4)/0.6); ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.globalAlpha=Math.min(1,p*1.6); ctx.fillStyle='#7ab8ff'; ctx.font='600 15px sans-serif'; ctx.fillText('a²',ox+a/2,oy+a/2);
        ctx.globalAlpha=la; ctx.fillStyle='#8fe3b5'; ctx.fillText('ab',ox+a+b/2,oy+a/2); ctx.fillText('ab',ox+a/2,oy+a+b/2);
        ctx.fillStyle='#ffb27a'; ctx.fillText('b²',ox+a+b/2,oy+a+b/2); ctx.globalAlpha=1; ctx.textBaseline='alphabetic'; }
      // 변을 칸별로 분해 라벨 — 위: a | b, 왼쪽: a | b  → 한 변 a+b 직관
      ctx.fillStyle=E.COL.txt; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('a',ox+a/2,oy-10); ctx.fillText('b',ox+a+b/2,oy-10);
      ctx.globalAlpha=0.6; ctx.fillText('+',ox+a,oy-10); ctx.globalAlpha=1;
      ctx.save();ctx.translate(ox-13,oy+a/2);ctx.rotate(-Math.PI/2);ctx.fillText('a',0,0);ctx.restore();
      ctx.save();ctx.translate(ox-13,oy+a+b/2);ctx.rotate(-Math.PI/2);ctx.fillText('b',0,0);ctx.restore();
      ctx.globalAlpha=0.6;ctx.save();ctx.translate(ox-13,oy+a);ctx.rotate(-Math.PI/2);ctx.fillText('+',0,0);ctx.restore();ctx.globalAlpha=1;
      if(s.p===0&&!s.play) E.tapHint(ox+big/2, oy+big+46, '▶ 눌러서 네 칸으로', true);
      else if(s.p>=1&&!s.play) E.tapHint(ox+big/2, oy+big+46, '↻ 다시 보기', false);
      E.big('(a+b)² = a² + 2ab + b²', s.p<1?'정사각형을 네 칸으로':'가운데 두 칸 = 2ab ✓'); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
