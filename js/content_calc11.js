/* 미적분학 11장 — 수열과 급수 (Stewart Ch.11)
   11.1 수열의 극한 · 11.2 기하급수 · 11.3 수렴 판정(p-급수) · 11.4 테일러급수 eˣ · 11.5 테일러 sin
   동작만. 텍스트=content/calc11.json. 보라 테마. 골든룰=부분합·근사 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function fact(n){ var f=1; for(var i=2;i<=n;i++) f*=i; return f; }

  var scenes = [

  // 11.1 수열의 극한  aₙ=(1+1/n)ⁿ → e
  { id:'calc11_01',
    enter:function(E){ this.s={n:5}; E.Plot.range(0,30,1.5,3);
      E.controls('<div class="ctrl"><label>항 번호 n</label><input type="range" id="sn" min="1" max="30" step="1" value="5"><output id="sno">5</output></div>');
      var self=this; E.bind('#sn','input',function(e){ self.s.n=+e.target.value; document.getElementById('sno').textContent=e.target.value; E.blip(380+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, N=s.n;
      P.axes();
      // 극한선 e
      ctx.strokeStyle='rgba(126,224,176,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(Math.E)); ctx.lineTo(P.X(30),P.Y(Math.E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('극한 e ≈ 2.718', P.X(22), P.Y(Math.E)-6);
      var aN=1;
      for(var n=1;n<=30;n++){ var a=Math.pow(1+1/n,n); ctx.fillStyle=(n<=N)?VIO:'rgba(185,156,255,0.25)'; ctx.beginPath(); ctx.arc(P.X(n),P.Y(a),(n===N?5:3),0,7); ctx.fill(); if(n===N)aN=a; }
      E.big('a₍'+N+'₎ = (1 + 1/'+N+')^'+N+' = '+aN.toFixed(4), 'n이 커질수록 점들이 극한 e에 다가갑니다 — 수열의 극한'); }
  },

  // 11.2 기하급수  Σ rᵏ → 1/(1−r)  (|r|<1)
  { id:'calc11_02',
    enter:function(E){ this.s={r:0.6}; E.Plot.range(-0.5,13,-0.2,3.2);
      E.controls('<div class="ctrl"><label>공비 r</label><input type="range" id="gr" min="-0.95" max="0.95" step="0.05" value="0.6"><output id="gro">0.60</output></div>');
      var self=this; E.bind('#gr','input',function(e){ self.s.r=+e.target.value; document.getElementById('gro').textContent=(+e.target.value).toFixed(2); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, r=s.r;
      P.axes();
      // 부분합 누적(계단)
      var sum=0; ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0));
      for(var k=0;k<=12;k++){ sum+=Math.pow(r,k); ctx.lineTo(P.X(k),P.Y(sum)); ctx.lineTo(P.X(k+1),P.Y(sum)); P.dot(k,sum,'rgba(185,156,255,0.7)'); } ctx.stroke();
      var lim=1/(1-r);
      ctx.strokeStyle='rgba(126,224,176,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(lim)); ctx.lineTo(P.X(13),P.Y(lim)); ctx.stroke(); ctx.setLineDash([]);
      E.big('Σ rᵏ = 1/(1−r) = '+lim.toFixed(3), '부분합이 1/(1−r)로 수렴 (|r|<1). 무한히 더해도 유한한 합!'); }
  },

  // 11.3 수렴 판정 — p급수  Σ1/nᵖ, p>1 수렴·p≤1 발산
  { id:'calc11_03',
    enter:function(E){ this.s={p:2}; E.Plot.range(0,60,0,6);
      E.controls('<div class="ctrl"><label>지수 p</label><input type="range" id="pp" min="0.5" max="2.5" step="0.1" value="2"><output id="ppo">2.0</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, p=s.p;
      P.axes();
      var sum=0; ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var n=1;n<=60;n++){ sum+=1/Math.pow(n,p); var y=Math.min(6,sum); if(n===1)ctx.moveTo(P.X(n),P.Y(y)); else ctx.lineTo(P.X(n),P.Y(y)); } ctx.stroke();
      // 더 멀리(수렴값 가늠)
      var far=0; for(var m=1;m<=100000;m++) far+=1/Math.pow(m,p);
      var conv=p>1;
      E.big('Σ 1/nᵖ  (p='+p.toFixed(1)+')  →  '+(conv?'수렴 ≈ '+far.toFixed(3):'발산 ∞'),
        conv?'p>1: 부분합이 평평해지며 유한값에 수렴':'p≤1: 부분합이 천천히, 그러나 끝없이 증가(발산)'); }
  },

  // 11.4 테일러 급수  eˣ ≈ Σ xᵏ/k!
  { id:'calc11_04',
    enter:function(E){ this.s={d:1}; E.Plot.range(-3.5,3,-1,8);
      E.controls('<div class="ctrl"><label>차수 d</label><input type="range" id="td" min="0" max="8" step="1" value="1"><output id="tdo">1</output></div>');
      var self=this; E.bind('#td','input',function(e){ self.s.d=+e.target.value; document.getElementById('tdo').textContent=e.target.value; E.blip(380+self.s.d*30,0.07); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, d=s.d;
      P.axes(); P.curve(function(x){return Math.exp(x);}, VIO);
      P.curve(function(x){ var sum=0; for(var k=0;k<=d;k++) sum+=Math.pow(x,k)/fact(k); return sum; }, GLD);  // 테일러 다항식
      var terms='1'; for(var k=1;k<=d;k++) terms+=' + x'+(k===1?'':'^'+k)+(k>1?'/'+k+'!':'');
      E.big('eˣ ≈ '+terms, '차수를 올릴수록 다항식(금색)이 eˣ(보라)를 더 넓게 끌어안습니다'); }
  },

  // 11.5 테일러 급수  sin x ≈ x − x³/3! + x⁵/5! − …
  { id:'calc11_05',
    enter:function(E){ this.s={m:1}; E.Plot.range(-7,7,-2.2,2.2);
      E.controls('<div class="ctrl"><label>항 수 m</label><input type="range" id="tm" min="1" max="7" step="1" value="1"><output id="tmo">1</output></div>');
      var self=this; E.bind('#tm','input',function(e){ self.s.m=+e.target.value; document.getElementById('tmo').textContent=e.target.value; E.blip(380+self.s.m*30,0.07); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, m=s.m;
      P.axes(); P.curve(function(x){return Math.sin(x);}, VIO);
      P.curve(function(x){ var sum=0; for(var j=0;j<m;j++){ var k=2*j+1; sum += (j%2?-1:1)*Math.pow(x,k)/fact(k); } return sum; }, GLD);
      var deg=2*m-1;
      E.big('sin x ≈ '+deg+'차 테일러 다항식  ('+m+'항)', '항을 더할수록 다항식이 sin의 물결을 점점 멀리까지 따라갑니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
