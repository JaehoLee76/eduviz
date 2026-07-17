/* 제10장 복소평면 — 10.1 복소평면 · 10.2 복소수와 평면기하
   동작(behavior)만. 텍스트는 content/ch10.json
   ※ 회전이 정확히 보이도록 모든 range 가로:세로 = 1.5 (픽셀 정사각형) */
(function(){
  var D2R=Math.PI/180, TAU=Math.PI*2;
  function reim(P,ctx){ ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif';
    ctx.textAlign='right'; ctx.fillText('Re', P.X(P.xmax)-4, P.Y(0)-6);
    ctx.textAlign='left'; ctx.fillText('Im', P.X(0)+6, P.Y(P.ymax)+12); }
  function phasor(P,ctx,x,y,col,lab){ var X0=P.X(0),Y0=P.Y(0),X1=P.X(x),Y1=P.Y(y);
    ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X1,Y1); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(X1,Y1,6,0,TAU); ctx.fill();
    if(lab){ ctx.font='600 15px sans-serif';
      // x<0(음의 실수축 쪽)이면 라벨을 왼쪽으로 펼쳐 y축 눈금열과 안 겹치게, 세로도 넉넉히 띄워 x축 눈금 행과 안 겹치게
      ctx.textAlign = x>=0 ? 'left' : 'right';
      ctx.fillText(lab, X1+(x>=0?8:-8), Y1-14); } }

  var scenes=[

  // ══════════ 10.1 복소평면 ══════════
  // 10.1a 복소수 = 평면의 점
  { id:'ch10_01',
    enter:function(E){ this.s={a:3,b:2}; E.Plot.range(-6,6,-4,4).lab('Re','Im');
      E.controls('<div class="ctrl"><label>실수부 a</label><input type="range" id="ca" min="-4" max="4" step="1" value="3"><output id="cao">3</output><label style="margin-left:14px">허수부 b</label><input type="range" id="cb" min="-3" max="3" step="1" value="2"><output id="cbo">2</output></div>');
      var self=this;
      E.bind('#ca','input',function(e){ self.s.a=+e.target.value; document.getElementById('cao').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#cb','input',function(e){ self.s.b=+e.target.value; document.getElementById('cbo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, a=s.a, b=s.b; P.axes(); reim(P,ctx);
      ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(a),P.Y(0)); ctx.lineTo(P.X(a),P.Y(b)); ctx.lineTo(P.X(0),P.Y(b)); ctx.stroke(); ctx.setLineDash([]);
      phasor(P,ctx,a,b,'#7ab8ff','z');
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('('+a+', '+b+')', P.X(a)+8, P.Y(b)+16);
      var bs=(b===0?'':(b<0?' − '+(b===-1?'':(-b)):' + '+(b===1?'':b))+'i');
      var zS=(a===0?(b===0?'0':(b<0?'−'+(b===-1?'':(-b)):(b===1?'':b))+'i'):a+bs);
      E.big('z = '+zS, '복소수 a + bi = 평면의 점 (a, b) — 가로 실수, 세로 허수'); }
  },

  // 10.1b 복소수의 덧셈 = 벡터 덧셈
  { id:'ch10_02',
    enter:function(E){ this.s={bx:-1,by:2}; E.Plot.range(-6,6,-4,4).lab('Re','Im');
      E.controls('<div class="ctrl"><label>w 실수부</label><input type="range" id="wx" min="-3" max="3" step="1" value="-1"><output id="wxo">-1</output><label style="margin-left:14px">w 허수부</label><input type="range" id="wy" min="-2" max="3" step="1" value="2"><output id="wyo">2</output></div>');
      var self=this;
      E.bind('#wx','input',function(e){ self.s.bx=+e.target.value; document.getElementById('wxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#wy','input',function(e){ self.s.by=+e.target.value; document.getElementById('wyo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, ax=3,ay=1, wx=s.bx,wy=s.by, sx2=ax+wx, sy2=ay+wy; P.axes(); reim(P,ctx);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(sx2),P.Y(sy2)); ctx.moveTo(P.X(wx),P.Y(wy)); ctx.lineTo(P.X(sx2),P.Y(sy2)); ctx.stroke(); ctx.setLineDash([]);
      phasor(P,ctx,ax,ay,'#7ab8ff','z=3+i');
      phasor(P,ctx,wx,wy,'#8fe3b5','w');
      phasor(P,ctx,sx2,sy2,'#ffb27a','z+w');
      var reSum=ax+(wx<0?' − '+(-wx):' + '+wx), imSum=ay+(wy<0?' − '+(-wy):' + '+wy);
      var imCo=(sy2===1?'':sy2===-1?'−':sy2);   // 허수부 계수 (1·i→i, −1·i→−i)
      var sumS=(sx2===0?(sy2===0?'0':imCo+'i'):(sy2===0?''+sx2:sx2+(sy2<0?' − '+(sy2===-1?'':(-sy2)):' + '+(sy2===1?'':sy2))+'i'));
      E.big('z + w = ('+reSum+') + ('+imSum+')i = '+sumS, '복소수 덧셈 = 벡터 덧셈 (9장에서 다룸) — 실수·허수부끼리'); }
  },

  // ══════════ 10.2 복소수와 평면기하 ══════════
  // 10.2a 절댓값과 편각 (극형식)
  { id:'ch10_03',
    enter:function(E){ this.s={r:3,deg:45}; E.Plot.range(-6,6,-4,4).lab('Re','Im');
      E.controls('<div class="ctrl"><label>크기 r</label><input type="range" id="pr" min="1" max="3.5" step="0.5" value="3"><output id="pro">3</output><label style="margin-left:14px">편각 θ</label><input type="range" id="pd" min="0" max="180" step="15" value="45"><output id="pdo">45°</output></div>');
      var self=this;
      E.bind('#pr','input',function(e){ self.s.r=+e.target.value; document.getElementById('pro').textContent=(+e.target.value); E.blip(440,0.1); });
      E.bind('#pd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('pdo').textContent=e.target.value+'°'; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, r=s.r, t=s.deg*D2R, x=r*Math.cos(t), y=r*Math.sin(t); P.axes(); reim(P,ctx);
      // 편각 호
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(P.X(0),P.Y(0), 30, 0, -t, true); ctx.stroke();
      phasor(P,ctx,x,y,'#7ab8ff','z');
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('θ='+s.deg+'°', P.X(0)+34, P.Y(0)-8);
      E.big('z = '+r+'(cos'+s.deg+'° + i·sin'+s.deg+'°)', '극형식: 크기 |z|='+r+' (8장 단위원!) · 편각 θ='+s.deg+'°'); }
  },

  // 10.2b ★복소수의 곱셈 = 회전 + 확대 (각도 합·크기 곱)
  { id:'ch10_04',
    enter:function(E){ this.s={deg:30}; E.Plot.range(-6,6,-4,4).lab('Re','Im');
      E.controls('<div class="ctrl"><label>w의 편각 (×)</label><input type="range" id="md" min="0" max="150" step="30" value="30"><output id="mdo">30°</output></div>');
      var self=this; E.bind('#md','input',function(e){ self.s.deg=+e.target.value; document.getElementById('mdo').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, r1=2.2, t1=40*D2R, r2=1.4, t2=this.s.deg*D2R; P.axes(); reim(P,ctx);
      var z=[r1*Math.cos(t1),r1*Math.sin(t1)], w=[r2*Math.cos(t2),r2*Math.sin(t2)];
      var pr=r1*r2, pt=t1+t2, p=[pr*Math.cos(pt),pr*Math.sin(pt)];
      phasor(P,ctx,z[0],z[1],'#7ab8ff','z (40°)');
      phasor(P,ctx,w[0],w[1],'#8fe3b5','w ('+this.s.deg+'°)');
      phasor(P,ctx,p[0],p[1],'#ffb27a','z·w');
      E.big('z·w :  크기 '+r1+'×'+r2+' = '+pr.toFixed(1)+',  각 40°+'+this.s.deg+'° = '+(40+this.s.deg)+'°', '복소수 곱셈 = 크기는 곱하고, 각도는 더한다 (8장 덧셈정리!)'); }
  },

  // 10.2c i 곱하기 = 90° 회전 (i² = −1)
  { id:'ch10_05',
    enter:function(E){ this.s={n:0}; E.Plot.range(-3,3,-2,2).lab('Re','Im'); E.setOn([]); },
    tap:function(E){ this.s.n=(this.s.n+1)%4; E.blip(440+this.s.n*60,0.15); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, n=this.s.n, r=1.5; P.axes(); reim(P,ctx);
      // 단위원(궤도)
      var g=P.geom(), sx=g.w/(P.xmax-P.xmin), sy=g.h/(P.ymax-P.ymin);
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(P.X(0),P.Y(0), r*sx, r*sy, 0,0,TAU); ctx.stroke();
      // 이전 자취(옅게)
      for(var k=0;k<=n;k++){ var t=k*90*D2R, x=r*Math.cos(t), y=r*Math.sin(t);
        var labs0=['1','i','−1','−i'];
        ctx.globalAlpha=(k===n)?1:0.25; phasor(P,ctx,x,y,(k===n)?'#ffb27a':'#7ab8ff', (k===n)?('i^'+k+' = '+labs0[k]):null); ctx.globalAlpha=1; }
      var labs=['1','i','−1','−i'], cur=labs[n];
      E.tapHint(E.W/2, P.geom().bot+40, '▶ i 곱하기 (90° 회전)', true);
      E.big('1 → i → −1 → −i → …   지금: i^'+n+' = '+cur, 'i 곱하기 = 90° 회전! i² = −1 (두 번 = 180° = 반대)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
