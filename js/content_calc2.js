/* 미적분학 2장 — 극한과 연속 (Stewart Ch.2)
   2.1 극한의 직관(구멍) · 2.2 좌·우극한 · 2.3 접선=할선의 극한 · 2.4 ε-δ · 2.5 연속성
   동작만. 텍스트=content/calc2.json. 보라 테마. 골든룰=표시값 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3', HOLE='#0c0c12';

  var scenes = [

  // 2.1 극한의 직관 — 구멍이 있어도 극한은 존재  f(x)=(x²−1)/(x−1)=x+1, x=1에 구멍
  { id:'calc2_01',
    enter:function(E){ this.s={x:1.7}; E.Plot.range(-1,3,-1,5).lab('x','y');
      E.controls('<div class="ctrl"><label>x →</label><input type="range" id="lx" min="0" max="2" step="0.02" value="1.7"><output id="lxo">1.70</output></div>');
      var self=this; E.bind('#lx','input',function(e){ self.s.x=+e.target.value; document.getElementById('lxo').textContent=(+e.target.value).toFixed(2); E.blip(380+self.s.x*60,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, x=s.x;
      P.axes(); P.curve(function(t){return t+1;}, VIO);            // (x²−1)/(x−1) = x+1
      ctx.fillStyle=VIO; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x) = (x²−1)/(x−1)', P.X(2.0),P.Y(3.3));
      ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('극한 L = 2', P.X(2.3),P.Y(2)-8);
      // x=1 구멍(빈 동그라미)
      var hx=P.X(1), hy=P.Y(2); ctx.fillStyle=HOLE; ctx.beginPath(); ctx.arc(hx,hy,5,0,7); ctx.fill();
      ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(hx,hy,5,0,7); ctx.stroke();
      var fx = Math.abs(x-1)<1e-9 ? NaN : (x*x-1)/(x-1);          // 실제 계산
      if(!isNaN(fx)){ ctx.strokeStyle='rgba(126,224,176,0.45)'; ctx.lineWidth=1.2; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(P.X(x),P.Y(0)); ctx.lineTo(P.X(x),P.Y(fx)); ctx.lineTo(P.X(0),P.Y(fx)); ctx.stroke(); ctx.setLineDash([]);
        P.dot(x,fx,GRN); }
      // 목표 극한선 L=2
      ctx.strokeStyle='rgba(255,210,122,0.5)'; ctx.lineWidth=1; ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(P.X(-1),P.Y(2)); ctx.lineTo(P.X(3),P.Y(2)); ctx.stroke(); ctx.setLineDash([]);
      E.big('f('+x.toFixed(2)+') = '+(isNaN(fx)?'정의 안 됨 (구멍)':fx.toFixed(3)), 'x→1 이면 f(x)→2 — 그 점에 구멍이 있어도 극한은 존재합니다'); }
  },

  // 2.2 좌극한·우극한 — 점프면 극한 없음  f(x)= x<1? x : x+1.5
  { id:'calc2_02',
    enter:function(E){ this.s={x:0.5}; E.Plot.range(-1,3,-1,5).lab('x','y');
      E.controls('<div class="ctrl"><label>x →</label><input type="range" id="jx" min="0" max="2" step="0.02" value="0.5"><output id="jxo">0.50</output></div>');
      var self=this; E.bind('#jx','input',function(e){ self.s.x=+e.target.value; document.getElementById('jxo').textContent=(+e.target.value).toFixed(2); E.blip(360+self.s.x*80,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, x=s.x;
      P.axes();
      P.curve(function(t){ return t<1? t : NaN; }, VIO);          // 왼쪽 조각 y=x (x<1)
      P.curve(function(t){ return t>=1? t+1.5 : NaN; }, BLU);     // 오른쪽 조각 y=x+1.5 (x≥1)
      ctx.textAlign='left'; ctx.font='12px sans-serif';
      ctx.fillStyle=VIO; ctx.fillText('y = x', P.X(0.1),P.Y(0.1)-8);
      ctx.fillStyle=BLU; ctx.fillText('y = x + 1.5', P.X(2.05),P.Y(3.55));
      // x=1 좌(닫힘/빈)·우 표시: 좌극한 1, 우극한 2.5
      var lx=P.X(1); ctx.fillStyle=HOLE; ctx.beginPath(); ctx.arc(lx,P.Y(1),5,0,7); ctx.fill(); ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(lx,P.Y(1),5,0,7); ctx.stroke();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(lx,P.Y(2.5),5,0,7); ctx.fill();
      var fx = x<1? x : x+1.5;                                    // 실제 조각값
      P.dot(x, fx, x<1?VIO:BLU);
      ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillStyle=VIO; ctx.fillText('좌극한 x→1⁻ : 1.0', E.W*0.66, E.H*0.30);
      ctx.fillStyle=BLU; ctx.fillText('우극한 x→1⁺ : 2.5', E.W*0.66, E.H*0.30+22);
      E.big('좌극한 1 ≠ 우극한 2.5', '양쪽이 다르면 극한은 없습니다 (DNE) — 점프 불연속'); }
  },

  // 2.3 접선 = 할선의 극한  f(x)=0.5x², a=1, 슬라이더 h→0
  { id:'calc2_03',
    enter:function(E){ this.s={h:1.2}; E.Plot.range(-1,4,-1,5).lab('x','y');
      E.controls('<div class="ctrl"><label>간격 h</label><input type="range" id="th" min="-1.5" max="1.5" step="0.05" value="1.2"><output id="tho">1.20</output></div>');
      var self=this; E.bind('#th','input',function(e){ self.s.h=+e.target.value; document.getElementById('tho').textContent=(+e.target.value).toFixed(2); E.blip(420,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, h=s.h, a=1;
      function f(t){ return 0.5*t*t; }
      P.axes(); P.curve(f, VIO);
      ctx.fillStyle=VIO; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x) = 0.5x²', P.X(2.55),P.Y(f(2.55))-6);
      var slope = Math.abs(h)<1e-9 ? a : (f(a+h)-f(a))/h;        // 할선 기울기(실측), h→0 이면 f'(1)=1
      var fa=f(a), near=Math.abs(h)<1e-9;
      // 할선(또는 접선)
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(-1), P.Y(fa+slope*(-1-a))); ctx.lineTo(P.X(4), P.Y(fa+slope*(4-a))); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='12px sans-serif';
      ctx.fillText((near?'접선':'할선')+' 기울기 = '+slope.toFixed(3), P.X(-0.9),P.Y(fa+slope*(-1-a))-6);
      P.dot(a, fa, GRN, '(1, 0.5)');                              // 고정점 (1, 0.5)
      if(Math.abs(h)>=1e-9){ P.dot(a+h, f(a+h), GLD); }          // 움직이는 두 번째 점
      E.big('할선 기울기 = '+slope.toFixed(3)+'   (h = '+h.toFixed(2)+')',
        'h를 0으로 보내면 할선이 접선이 되고, 기울기는 f′(1)=1 로 수렴합니다'); }
  },

  // 2.4 ε-δ 엄밀한 정의  f(x)=2x, a=1, L=2, δ=ε/2
  { id:'calc2_04',
    enter:function(E){ this.s={eps:1.2}; E.Plot.range(-0.5,2.5,-0.5,4.5).lab('x','y');
      E.controls('<div class="ctrl"><label>허용오차 ε</label><input type="range" id="ep" min="0.2" max="1.6" step="0.05" value="1.2"><output id="epo">1.20</output></div>');
      var self=this; E.bind('#ep','input',function(e){ self.s.eps=+e.target.value; document.getElementById('epo').textContent=(+e.target.value).toFixed(2); E.blip(440,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, eps=s.eps, a=1, L=2;
      var delta = eps/2;                                          // f=2x 기울기 2 → δ=ε/2 (실측 보장)
      // ε 가로 띠 (L±ε)
      ctx.fillStyle='rgba(255,210,122,0.13)'; ctx.fillRect(P.X(-0.5), P.Y(L+eps), P.X(2.5)-P.X(-0.5), P.Y(L-eps)-P.Y(L+eps));
      // δ 세로 띠 (a±δ)
      ctx.fillStyle='rgba(126,224,176,0.15)'; ctx.fillRect(P.X(a-delta), P.Y(4.5), P.X(a+delta)-P.X(a-delta), P.Y(-0.5)-P.Y(4.5));
      P.axes(); P.curve(function(t){return 2*t;}, VIO);
      ctx.fillStyle=VIO; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText('f(x) = 2x', P.X(1.7),P.Y(2*1.7)-6);
      P.dot(a, L, GRN, '(1, 2)');
      ctx.textAlign='left'; ctx.font='12px sans-serif';
      ctx.fillStyle=GLD; ctx.fillText('ε = '+eps.toFixed(2)+' (세로 허용)', E.W*0.66, E.H*0.24);
      ctx.fillStyle=GRN; ctx.fillText('δ = '+delta.toFixed(2)+' (가로 보장)', E.W*0.66, E.H*0.24+20);
      E.big('ε = '+eps.toFixed(2)+'  →  δ = '+delta.toFixed(2),
        '아무리 작은 ε를 줘도, 맞는 δ를 찾을 수 있으면 — 그것이 극한의 엄밀한 정의'); }
  },

  // 2.5 연속성 — 끊지 않고 그릴 수 있는가  f(x)= x<1? x+1 : x+c
  { id:'calc2_05',
    enter:function(E){ this.s={c:0.3}; E.Plot.range(-0.5,3,-0.5,5).lab('x','y');
      E.controls('<div class="ctrl"><label>오른쪽 조각 c</label><input type="range" id="cc" min="-1" max="3" step="0.1" value="0.3"><output id="cco">0.3</output></div>');
      var self=this; E.bind('#cc','input',function(e){ self.s.c=+e.target.value; document.getElementById('cco').textContent=(+e.target.value).toFixed(1); E.blip(400,0.08); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, c=s.c;
      P.axes();
      P.curve(function(t){ return t<1? t+1 : NaN; }, VIO);        // 왼쪽 x+1 → 2
      P.curve(function(t){ return t>=1? t+c : NaN; }, GLD);       // 오른쪽 x+c, x=1에서 1+c
      ctx.textAlign='left'; ctx.font='12px sans-serif';
      ctx.fillStyle=VIO; ctx.fillText('y = x + 1', P.X(-0.4),P.Y(0.7));
      ctx.fillStyle=GLD; ctx.fillText('y = x + c', P.X(2.05),P.Y(2.05+c));
      var left=2, right=1+c, gap=Math.abs(left-right), cont=gap<0.05;
      // x=1 두 끝점
      ctx.fillStyle=cont?GRN:VIO; ctx.beginPath(); ctx.arc(P.X(1),P.Y(left),5,0,7); ctx.fill();
      ctx.fillStyle=cont?GRN:GLD; ctx.beginPath(); ctx.arc(P.X(1),P.Y(right),5,0,7); ctx.fill();
      if(!cont){ ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(1),P.Y(left)); ctx.lineTo(P.X(1),P.Y(right)); ctx.stroke(); ctx.setLineDash([]); }
      E.big(cont?'연속! 펜을 떼지 않고 그릴 수 있습니다':'불연속 — 틈 '+gap.toFixed(2),
        '왼쪽 극한 = 2, 오른쪽 시작 = 1+c. 둘이 같아야(c=1) 연속입니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
