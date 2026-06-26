/* 미적분학 1장 — 함수와 모델 (Stewart Ch.1)
   1.1 함수의 네 표현 · 1.2 수학적 모델 · 1.3 함수 변환 · 1.4 지수함수 · 1.5 역함수와 로그
   동작만. 텍스트=content/calc1.json. 색: 보라 테마. 골든룰=표시값 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', DIM='#9b99a3';

  var scenes = [

  // 1.1 함수의 네 가지 표현 — 식·표·그래프·말 (입력 x 슬라이더)
  { id:'calc1_01',
    enter:function(E){ this.s={x:2}; E.Plot.range(-3.2,3.2,-1,9.5);
      E.controls('<div class="ctrl"><label>입력 x</label><input type="range" id="cx" min="-3" max="3" step="1" value="2"><output id="cxo">2</output></div>');
      var self=this; E.bind('#cx','input',function(e){ self.s.x=+e.target.value; document.getElementById('cxo').textContent=e.target.value; E.blip(420+self.s.x*30,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, x=s.x, y=x*x;
      P.axes(); P.curve(function(t){return t*t;}, VIO);
      ctx.globalAlpha=E.blink(); P.dot(x,y,GRN,'('+x+', '+y+')'); ctx.globalAlpha=1;
      // 수치적 표현(표) — 우측
      ctx.textAlign='left'; var tx=E.W*0.74, ty=E.H*0.22;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('수치적 표현 (표)', tx, ty-16);
      ctx.font='13px ui-monospace, monospace'; ctx.fillStyle='#8a8893';
      ctx.fillText('  x', tx, ty); ctx.fillText('f(x)', tx+58, ty);
      for(var i=-3;i<=3;i++){ var yy=ty+20+(i+3)*19, on=(i===x);
        ctx.fillStyle=on?GRN:'#bcbab2'; ctx.font=(on?'600 ':'')+'13px ui-monospace, monospace';
        ctx.fillText((i<0?'':' ')+i, tx, yy); ctx.fillText((i*i<10?' ':'')+(i*i), tx+62, yy); }
      E.big('f('+x+') = '+x+'² = '+y, '하나의 함수, 네 가지 얼굴 — 식 · 표 · 그래프 · 말'); }
  },

  // 1.2 수학적 모델 — 선형 vs 거듭제곱 vs 지수 (성장 경주)
  { id:'calc1_02',
    enter:function(E){ this.s={t:3}; E.Plot.range(0,6,0,40);
      E.controls('<div class="ctrl"><label>시간 t</label><input type="range" id="mt" min="0" max="6" step="0.25" value="3"><output id="mto">3</output></div>');
      var self=this; E.bind('#mt','input',function(e){ self.s.t=+e.target.value; document.getElementById('mto').textContent=(+e.target.value).toFixed(2); E.blip(360+self.s.t*30,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t;
      P.axes();
      P.curve(function(x){return 5*x;}, BLU);          // 선형
      P.curve(function(x){return x*x;}, GLD);          // 거듭제곱
      P.curve(function(x){return Math.pow(2,x);}, VIO);// 지수
      var L=5*t, Q=t*t, Ex=Math.pow(2,t);
      P.dot(t,Math.min(L,40),BLU); P.dot(t,Math.min(Q,40),GLD); P.dot(t,Math.min(Ex,40),VIO);
      ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillStyle=BLU; ctx.fillText('선형 5t = '+L.toFixed(1), E.W*0.70, E.H*0.30);
      ctx.fillStyle=GLD; ctx.fillText('거듭제곱 t² = '+Q.toFixed(1), E.W*0.70, E.H*0.30+22);
      ctx.fillStyle=VIO; ctx.fillText('지수 2ᵗ = '+Ex.toFixed(1), E.W*0.70, E.H*0.30+44);
      var lead = Ex>=Q&&Ex>=L?'지수':Q>=L?'거듭제곱':'선형';
      E.big('t = '+t.toFixed(2)+' 에서 1등: '+lead, '느리게 시작한 지수가 결국 모두를 앞지릅니다'); }
  },

  // 1.3 함수 변환 — y = a·f(x − c) + d  (기본함수 f=sin)
  { id:'calc1_03',
    enter:function(E){ this.s={a:1,c:0,d:0}; E.Plot.range(-6.5,6.5,-4,4);
      E.controls('<div class="ctrl"><label>세로배율 a</label><input type="range" id="va" min="-2" max="2" step="0.5" value="1"><output id="vao">1</output><label style="margin-left:12px">좌우이동 c</label><input type="range" id="vc" min="-3" max="3" step="0.5" value="0"><output id="vco">0</output><label style="margin-left:12px">상하이동 d</label><input type="range" id="vd" min="-2" max="2" step="0.5" value="0"><output id="vdo">0</output></div>');
      var self=this;
      E.bind('#va','input',function(e){ self.s.a=+e.target.value; document.getElementById('vao').textContent=e.target.value; E.blip(460,0.08); });
      E.bind('#vc','input',function(e){ self.s.c=+e.target.value; document.getElementById('vco').textContent=e.target.value; E.blip(420,0.08); });
      E.bind('#vd','input',function(e){ self.s.d=+e.target.value; document.getElementById('vdo').textContent=e.target.value; E.blip(380,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, a=s.a, c=s.c, d=s.d;
      P.axes();
      P.curve(function(x){return Math.sin(x);}, 'rgba(155,153,163,0.5)');   // 기본 f(x)=sin x (흐림)
      P.curve(function(x){return a*Math.sin(x-c)+d;}, VIO);                 // 변환된 함수
      function num(v){ return v<0? '−'+(-v) : ''+v; }
      var coef=(a===1?'':a===-1?'−':num(a)+'·');   // a=1→계수·점 생략, a=−1→−f, 그 외 a·f
      E.big('y = '+coef+'f(x'+(c>0?' − '+c:c<0?' + '+(-c):'')+')'+(d>0?' + '+d:d<0?' − '+(-d):''),
        '흐린 곡선 = 원본 f(x) = sin x · a=세로배율 · c=좌우이동 · d=상하이동'); }
  },

  // 1.4 지수함수와 배가시간 — y = bˣ
  { id:'calc1_04',
    enter:function(E){ this.s={b:2}; E.Plot.range(-3,5,-0.5,16);
      E.controls('<div class="ctrl"><label>밑 b</label><input type="range" id="eb" min="1.1" max="3" step="0.1" value="2"><output id="ebo">2.0</output></div>');
      var self=this; E.bind('#eb','input',function(e){ self.s.b=+e.target.value; document.getElementById('ebo').textContent=(+e.target.value).toFixed(1); E.blip(380+self.s.b*60,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, b=s.b;
      P.axes(); P.curve(function(x){return Math.pow(b,x);}, VIO);
      P.dot(0,1,GRN);                                  // 모든 지수함수는 (0,1) 통과
      var Td=Math.log(2)/Math.log(b);                  // 배가시간(2배 되는 데 걸리는 x)
      // 배가 구간 표시
      ctx.strokeStyle='rgba(255,210,122,0.6)'; ctx.lineWidth=1.4; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(Td),P.Y(0)); ctx.lineTo(P.X(Td),P.Y(2)); ctx.lineTo(P.X(0),P.Y(2)); ctx.stroke(); ctx.setLineDash([]);
      P.dot(Td,2,GLD,'2배');
      E.big('y = '+b.toFixed(1)+'ˣ', '배가시간(2배 되는 데): Δx = ln2/ln b = '+Td.toFixed(2)); }
  },

  // 1.5 역함수와 로그 — f=bˣ 와 f⁻¹=log_b, y=x 대칭
  { id:'calc1_05',
    enter:function(E){ this.s={a:1}; E.Plot.range(-4,8,-4,8);
      E.controls('<div class="ctrl"><label>점 a</label><input type="range" id="ra" min="-2" max="2.5" step="0.25" value="1"><output id="rao">1.00</output></div>');
      var self=this; E.bind('#ra','input',function(e){ self.s.a=+e.target.value; document.getElementById('rao').textContent=(+e.target.value).toFixed(2); E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, a=s.a;
      P.axes();
      // y=x 대칭축
      ctx.strokeStyle='rgba(155,153,163,0.45)'; ctx.lineWidth=1.2; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.moveTo(P.X(-4),P.Y(-4)); ctx.lineTo(P.X(8),P.Y(8)); ctx.stroke(); ctx.setLineDash([]);
      P.curve(function(x){return Math.pow(2,x);}, VIO);                       // f = 2ˣ
      P.curve(function(x){return x>0?Math.log(x)/Math.log(2):NaN;}, GLD);     // f⁻¹ = log₂
      var fy=Math.pow(2,a);                            // (a, 2^a)
      P.dot(a,fy,VIO,'('+a.toFixed(2)+', '+fy.toFixed(2)+')');
      P.dot(fy,a,GLD,'('+fy.toFixed(2)+', '+a.toFixed(2)+')');  // 거울 반사: 좌표 뒤바뀜
      // 두 점을 잇는 대칭선
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1.2; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(fy)); ctx.lineTo(P.X(fy),P.Y(a)); ctx.stroke(); ctx.setLineDash([]);
      E.big('2^'+a.toFixed(2)+' = '+fy.toFixed(2)+'  ⇔  log₂'+fy.toFixed(2)+' = '+a.toFixed(2),
        '역함수는 y=x에 대한 거울상 — 좌표 (a,b)가 (b,a)로 뒤집힙니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
