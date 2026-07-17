/* 제9장 평면벡터 — 9.1 벡터와 계산 · 9.2 벡터의 응용
   동작(behavior)만. 텍스트는 content/ch9.json */
(function(){
  // Plot 좌표 위에 화살표(벡터) 그리기
  function vec(P,ctx,ox,oy,x,y,col,lab){
    var X0=P.X(ox),Y0=P.Y(oy),X1=P.X(x),Y1=P.Y(y);
    ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X1,Y1); ctx.stroke();
    var ang=Math.atan2(Y1-Y0,X1-X0);
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(X1,Y1);
    ctx.lineTo(X1-13*Math.cos(ang-0.4),Y1-13*Math.sin(ang-0.4));
    ctx.lineTo(X1-13*Math.cos(ang+0.4),Y1-13*Math.sin(ang+0.4)); ctx.fill();
    if(lab){ ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText(lab, X1+8, Y1-8); }
  }

  var scenes=[

  // ══════════ 9.1 벡터와 계산 ══════════
  // 9.1a 벡터란 — 크기와 방향
  { id:'ch9_01',
    enter:function(E){ this.s={x:3,y:4}; E.Plot.range(-2,6,-2,6).lab('x','y');
      E.controls('<div class="ctrl"><label>x 성분</label><input type="range" id="vx" min="-1" max="5" step="1" value="3"><output id="vxo">3</output><label style="margin-left:14px">y 성분</label><input type="range" id="vy" min="-1" max="5" step="1" value="4"><output id="vyo">4</output></div>');
      var self=this;
      E.bind('#vx','input',function(e){ self.s.x=+e.target.value; document.getElementById('vxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#vy','input',function(e){ self.s.y=+e.target.value; document.getElementById('vyo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, x=s.x, y=s.y, mag=Math.sqrt(x*x+y*y); P.axes();
      // 성분 점선
      ctx.strokeStyle='rgba(244,160,192,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(x),P.Y(0)); ctx.lineTo(P.X(x),P.Y(y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('x='+x, (P.X(0)+P.X(x))/2, P.Y(0)+18);
      ctx.textAlign='left'; ctx.fillText('y='+y, P.X(x)+6, (P.Y(0)+P.Y(y))/2);
      vec(P,ctx,0,0,x,y,'#7ab8ff','v');
      E.big('v = ('+x+', '+y+'),  |v| = √('+(x*x)+'+'+(y*y)+') = '+(mag%1===0?mag:mag.toFixed(2)), '벡터 = 크기 + 방향 (성분으로 표현, 크기는 거리공식)'); }
  },

  // 9.1b 벡터의 덧셈 — 삼각형/평행사변형 법칙
  { id:'ch9_02',
    enter:function(E){ this.s={bx:1,by:3}; E.Plot.range(-1,7,-1,6).lab('x','y');
      E.controls('<div class="ctrl"><label>b의 x</label><input type="range" id="bx" min="-1" max="4" step="1" value="1"><output id="bxo">1</output><label style="margin-left:14px">b의 y</label><input type="range" id="by" min="-1" max="4" step="1" value="3"><output id="byo">3</output></div>');
      var self=this;
      E.bind('#bx','input',function(e){ self.s.bx=+e.target.value; document.getElementById('bxo').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#by','input',function(e){ self.s.by=+e.target.value; document.getElementById('byo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, ax=3,ay=1, bx=s.bx,by=s.by, sx2=ax+bx, sy2=ay+by; P.axes();
      // 평행사변형 점선
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(P.X(ax),P.Y(ay)); ctx.lineTo(P.X(sx2),P.Y(sy2)); ctx.moveTo(P.X(bx),P.Y(by)); ctx.lineTo(P.X(sx2),P.Y(sy2)); ctx.stroke(); ctx.setLineDash([]);
      vec(P,ctx,0,0,ax,ay,'#7ab8ff','a');
      vec(P,ctx,ax,ay,sx2,sy2,'#8fe3b5','b');   // b를 a 끝에 (삼각형법칙)
      vec(P,ctx,0,0,sx2,sy2,'#ffb27a','a+b');
      E.big('a + b = ('+ax+'+'+bx+', '+ay+'+'+by+') = ('+sx2+', '+sy2+')', '성분끼리 더하기 = 화살표 이어붙이기(삼각형 법칙)'); }
  },

  // 9.1c 실수배 — 스칼라 곱
  { id:'ch9_03',
    enter:function(E){ this.s={k:2}; E.Plot.range(-5,5,-4,5).lab('x','y');
      E.controls('<div class="ctrl"><label>실수배 k</label><input type="range" id="kk" min="-2" max="2" step="0.5" value="2"><output id="kko">2</output></div>');
      var self=this; E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=(+e.target.value); E.blip(420+self.s.k*60,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, k=this.s.k, ctx=E.ctx, ax=2,ay=1.5; P.axes();
      // 원본 옅게
      ctx.globalAlpha=0.4; vec(P,ctx,0,0,ax,ay,'#7ab8ff','a'); ctx.globalAlpha=1;
      if(k!==0) vec(P,ctx,0,0,k*ax,k*ay,'#ffb27a','('+k+')a');
      var note = k<0?'음수 → 방향 반대 + 크기 '+Math.abs(k)+'배' : k===0?'0배 → 영벡터(점)' : k<1?'0~1 → 같은 방향, 짧아짐' : '1보다 큼 → 같은 방향, 길어짐';
      E.big(k+' · a = ('+(k*ax)+', '+(k*ay)+')', note+'  (방향은 그대로/반대, 크기만 '+Math.abs(k)+'배)'); }
  },

  // ══════════ 9.2 벡터의 응용 ══════════
  // 9.2a 내적 — a·b = |a||b|cosθ
  { id:'ch9_04',
    enter:function(E){ this.s={deg:60}; E.Plot.range(-4,5,-3,5).lab('x','y');
      E.controls('<div class="ctrl"><label>b의 방향 θ (도)</label><input type="range" id="bt" min="0" max="180" step="15" value="60"><output id="bto">60°</output></div>');
      var self=this; E.bind('#bt','input',function(e){ self.s.deg=+e.target.value; document.getElementById('bto').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, ax=4,ay=0, R=3, t=this.s.deg*Math.PI/180, bx=R*Math.cos(t), by=R*Math.sin(t); P.axes();
      var dot=ax*bx+ay*by, ma=Math.sqrt(ax*ax+ay*ay), mb=R, perp=Math.abs(dot)<0.001;
      // 사이각 θ 호
      ctx.strokeStyle='rgba(255,178,122,0.85)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(P.X(0),P.Y(0),24,0,-t,true); ctx.stroke();
      var mt=t/2; ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('θ='+this.s.deg+'°', P.X(0)+34*Math.cos(mt), P.Y(0)-34*Math.sin(mt)); ctx.textBaseline='alphabetic';
      vec(P,ctx,0,0,ax,ay,'#7ab8ff',null);
      ctx.fillStyle='#7ab8ff'; ctx.font='600 16px sans-serif'; ctx.textAlign='right';
      ctx.fillText('a  |a|='+ma.toFixed(0), P.X(ax)-10, P.Y(ay)+22);
      vec(P,ctx,0,0,bx,by,'#8fe3b5','b  |b|='+mb.toFixed(0));
      if(perp){ ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.strokeRect(P.X(0),P.Y(0)-16,16,16); }
      E.big('a · b = '+dot.toFixed(2)+'  ( = |a||b|cos'+this.s.deg+'° )', perp?'θ=90° → 내적 = 0 → 수직! (6장 #44에서 다룸)':'내적 = 성분곱의 합 = |a||b|cosθ'); }
  },

  // 9.2b 응용 — 내적으로 수직 판정
  { id:'ch9_05',
    enter:function(E){ this.s={deg:117}; E.Plot.range(-4,4,-3,4).lab('x','y');
      // a=(2,1)의 방향각 ≈ 26.57°. b를 a기준 +90°(=116.57°)로 두면 수직.
      E.controls('<div class="ctrl"><label>b의 방향 θ (도)</label><input type="range" id="bt" min="0" max="180" step="9" value="117"><output id="bto">117°</output></div>');
      var self=this; E.bind('#bt','input',function(e){ self.s.deg=+e.target.value; document.getElementById('bto').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx; P.axes();
      var ax=2, ay=1, mb=Math.sqrt(5), t=this.s.deg*Math.PI/180;
      var bx=mb*Math.cos(t), by=mb*Math.sin(t);          // |b| = |a| = √5
      var dot=ax*bx+ay*by;                                // 실계산 내적
      var perp=Math.abs(dot)<0.15;
      vec(P,ctx,0,0,ax,ay,'#7ab8ff','a=(2,1)');
      vec(P,ctx,0,0,bx,by,'#8fe3b5','b=('+bx.toFixed(1)+', '+by.toFixed(1)+')');
      // 두 벡터 사이 호(angle) — 화면 y축 반전이므로 각도 부호 음수
      var aA=Math.atan2(ay,ax), bA=Math.atan2(by,bx);
      ctx.strokeStyle=perp?'rgba(255,178,122,0.9)':'rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(P.X(0),P.Y(0),22,-aA,-bA,true); ctx.stroke();
      // 사이각 θ 라벨(두 벡터 사이 실측각)
      var thBetween=Math.abs((bA-aA)/Math.PI*180), mA=(aA+bA)/2;
      ctx.fillStyle=perp?'#ffb27a':'rgba(223,238,251,0.9)'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('θ='+thBetween.toFixed(0)+'°', P.X(0)+34*Math.cos(mA), P.Y(0)-34*Math.sin(mA)); ctx.textBaseline='alphabetic';
      if(perp){ // 직각기호(작은 사각형) — a·b=0 일 때만
        ctx.save(); ctx.translate(P.X(0),P.Y(0)); ctx.scale(1,-1); ctx.rotate(aA);
        ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.strokeRect(0,0,15,15); ctx.restore(); }
      E.big('a · b = 2·('+bx.toFixed(1)+') + 1·('+by.toFixed(1)+') = '+dot.toFixed(2), perp?'내적 ≈ 0  →  두 벡터 수직(직교)! ⊥':'내적 = 성분곱의 합 = |a||b|cosθ'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
