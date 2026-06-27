/* 제12장 이차곡선 — 12.1 포물선·타원·쌍곡선 · 12.2 직선과의 관계 · 12.3 평행이동·회전
   동작(behavior)만. 텍스트는 content/ch12.json  (회전 정확하도록 range 1.5) */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 12.1 이차곡선 ══════════
  // 12.1a 포물선 — 초점과 준선
  { id:'ch12_01',
    enter:function(E){ this.s={p:1}; E.Plot.range(-6,6,-2,6).lab('x','y');
      E.controls('<div class="ctrl"><label>초점거리 p</label><input type="range" id="pp" min="0.5" max="2" step="0.5" value="1"><output id="ppo">1</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value); E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, p=this.s.p, ctx=E.ctx; P.axes();
      P.curve(function(x){ return x*x/(4*p); }, '#7ab8ff');
      // 준선 y=-p
      ctx.strokeStyle='rgba(244,160,192,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(-6),P.Y(-p)); ctx.lineTo(P.X(6),P.Y(-p)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#f4a0c0'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('준선 y = −'+p, P.X(3), P.Y(-p)-6);
      // 초점
      P.dot(0,p,'#ffb27a','초점 F');
      // 같은 거리 시연: 점 Px=3
      var px=3, py=px*px/(4*p);
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(0),P.Y(p)); ctx.stroke();
      ctx.strokeStyle='rgba(143,227,181,0.9)'; ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(px),P.Y(-p)); ctx.stroke();
      P.dot(px,py,'#fff');
      E.big('x² = 4·'+p+'·y', '포물선 = 초점과 준선에서 거리가 같은 점들 (주황=초록 길이)'); }
  },

  // 12.1b 타원 — 두 초점 거리의 합
  { id:'ch12_02',
    enter:function(E){ this.s={a:4,b:2}; E.Plot.range(-6,6,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>가로 a</label><input type="range" id="ea" min="2" max="5" step="1" value="4"><output id="eao">4</output><label style="margin-left:14px">세로 b</label><input type="range" id="eb" min="1" max="3" step="1" value="2"><output id="ebo">2</output></div>');
      var self=this;
      E.bind('#ea','input',function(e){ self.s.a=+e.target.value; document.getElementById('eao').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#eb','input',function(e){ self.s.b=+e.target.value; document.getElementById('ebo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, a=s.a, b=s.b, big=Math.max(a,b), sm=Math.min(a,b), c=Math.sqrt(big*big-sm*sm); P.axes();
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=120;i++){ var t=TAU*i/120, x=a*Math.cos(t), y=b*Math.sin(t); var X=P.X(x),Y=P.Y(y); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 초점 (a>b 가정시 x축, 아니면 y축)
      var f1,f2; if(a>=b){ f1=[-c,0]; f2=[c,0]; } else { f1=[0,-c]; f2=[0,c]; }
      P.dot(f1[0],f1[1],'#ffb27a','F₁'); P.dot(f2[0],f2[1],'#ffb27a','F₂');
      // 한 점에서 두 초점까지
      var px=a*Math.cos(0.9), py=b*Math.sin(0.9);
      ctx.strokeStyle='rgba(143,227,181,0.85)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(f1[0]),P.Y(f1[1])); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(f2[0]),P.Y(f2[1])); ctx.stroke();
      P.dot(px,py,'#fff');
      E.big('x²/'+(a*a)+' + y²/'+(b*b)+' = 1', '타원 = 두 초점까지 거리의 합이 일정 (초록 두 선의 합 = 2×'+big+')'); }
  },

  // 12.1c 쌍곡선 — 두 초점 거리의 차
  { id:'ch12_03',
    enter:function(E){ this.s={a:2,b:2}; E.Plot.range(-6,6,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>a</label><input type="range" id="ha" min="1" max="3" step="1" value="2"><output id="hao">2</output><label style="margin-left:14px">b</label><input type="range" id="hb" min="1" max="3" step="1" value="2"><output id="hbo">2</output></div>');
      var self=this;
      E.bind('#ha','input',function(e){ self.s.a=+e.target.value; document.getElementById('hao').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#hb','input',function(e){ self.s.b=+e.target.value; document.getElementById('hbo').textContent=e.target.value; E.blip(420,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, ctx=E.ctx, a=s.a, b=s.b; P.axes();
      // 점근선 y=±(b/a)x
      ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      [b/a,-b/a].forEach(function(m){ ctx.beginPath(); ctx.moveTo(P.X(-6),P.Y(-6*m)); ctx.lineTo(P.X(6),P.Y(6*m)); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5;
      [1,-1].forEach(function(sgn){ ctx.beginPath(); var on=false;
        for(var i=-30;i<=30;i++){ var tau=i/10, x=sgn*a*Math.cosh(tau), y=b*Math.sinh(tau); if(Math.abs(x)>7||Math.abs(y)>6){on=false;continue;} var X=P.X(x),Y=P.Y(y); if(on)ctx.lineTo(X,Y); else{ctx.moveTo(X,Y);on=true;} } ctx.stroke(); });
      var c=Math.sqrt(a*a+b*b); P.dot(-c,0,'#ffb27a','F₁'); P.dot(c,0,'#ffb27a','F₂');
      var sl=b/a, slT=(sl===1?'':(sl%1===0?sl:sl.toFixed(2)));
      E.big('x²/'+(a*a)+' − y²/'+(b*b)+' = 1', '쌍곡선 = 두 초점까지 거리의 차가 일정 · 점근선 y = ±'+slT+'x'); }
  },

  // ══════════ 12.2 통일: 이심률 ══════════
  // ★이심률 e 하나로 타원→포물선→쌍곡선 morph
  { id:'ch12_04',
    enter:function(E){ this.s={e:0.6}; E.Plot.range(-7,5,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>이심률 e</label><input type="range" id="ec" min="0.3" max="1.8" step="0.1" value="0.6"><output id="eco">0.6</output></div>');
      var self=this; E.bind('#ec','input',function(e){ self.s.e=+e.target.value; document.getElementById('eco').textContent=(+e.target.value).toFixed(1); E.blip(420+self.s.e*200,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ee=this.s.e, ctx=E.ctx, l=2.2; P.axes();
      P.dot(0,0,'#ffb27a','초점');
      // 극형식 r = l/(1+e cosθ)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); var on=false;
      for(var i=0;i<=360;i++){ var th=TAU*i/360, den=1+ee*Math.cos(th); if(Math.abs(den)<0.05){on=false;continue;} var r=l/den; if(r<0||r>14){on=false;continue;}
        var x=r*Math.cos(th), y=r*Math.sin(th); if(Math.abs(x)>8||Math.abs(y)>6){on=false;continue;} var X=P.X(x),Y=P.Y(y); if(on)ctx.lineTo(X,Y); else{ctx.moveTo(X,Y);on=true;} } ctx.stroke();
      var kind = ee<0.95?'타원 (e < 1)' : ee<1.05?'포물선 (e = 1)' : '쌍곡선 (e > 1)';
      E.big('이심률 e = '+ee.toFixed(1)+'  →  '+kind, '★하나의 정의(초점거리/준선거리 = e)로 세 곡선이 연결! e만 바꿔보세요'); }
  },

  // ══════════ 12.3 회전 ══════════
  // 타원을 회전 → xy 항 등장 (10장 복소수 회전 회수)
  { id:'ch12_05',
    enter:function(E){ this.s={deg:0}; E.Plot.range(-6,6,-4,4).lab('x','y');
      E.controls('<div class="ctrl"><label>회전각 φ</label><input type="range" id="rt" min="0" max="90" step="15" value="0"><output id="rto">0°</output></div>');
      var self=this; E.bind('#rt','input',function(e){ self.s.deg=+e.target.value; document.getElementById('rto').textContent=e.target.value+'°'; E.blip(440,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, a=3.5, b=1.6, phi=this.s.deg*Math.PI/180, cs=Math.cos(phi), sn=Math.sin(phi); P.axes();
      // 원래 타원 옅게
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var i=0;i<=120;i++){ var t=TAU*i/120; var X=P.X(a*Math.cos(t)),Y=P.Y(b*Math.sin(t)); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 회전 타원
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var j=0;j<=120;j++){ var u=TAU*j/120, x0=a*Math.cos(u), y0=b*Math.sin(u), x=x0*cs-y0*sn, y=x0*sn+y0*cs; var X2=P.X(x),Y2=P.Y(y); if(j===0)ctx.moveTo(X2,Y2); else ctx.lineTo(X2,Y2); } ctx.stroke();
      // 장축 방향
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(-a*cs),P.Y(-a*sn)); ctx.lineTo(P.X(a*cs),P.Y(a*sn)); ctx.stroke();
      E.big('φ = '+this.s.deg+'° 회전', this.s.deg===0?'축에 나란한 표준형 (xy 항 없음)':'기울면 식에 xy 항 등장 — 회전변환(10장)으로 표준형 복원'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
