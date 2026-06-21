/* 물리학 제1장 운동학 — 위치·속도·가속도·등가속도·자유낙하·포물선
   동작(behavior)만. 텍스트는 content/phys1.json. 엔진(js/engine.js) 공유.
   골든룰: 화면 표시 수치는 전부 실제 운동학 식으로 계산. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', G=9.8;

  var scenes=[

  // ══════════ 1.1 위치·변위·거리 ══════════
  { id:'phys1_01',
    enter:function(E){ this.s={p:0.5}; E.NL.range(0,10);
      E.controls('<div class="ctrl"><label>진행</label><input type="range" id="pp" min="0" max="1" step="0.02" value="0.5"><output id="ppo">0.50</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(2); E.blip(360+self.s.p*200,0.08); }); E.setOn([]); },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    draw:function(E){ var p=this.s.p, ctx=E.ctx, y=E.NL.yy();
      // 경로: 0→8 (전반) → 8→3 (후반)
      var x, dist; if(p<=0.5){ x=16*p; dist=16*p; } else { x=8-10*(p-0.5); dist=8+10*(p-0.5); }
      // 지나온 경로(가장 오른쪽 도달점까지 옅게)
      var reached=Math.min(8, p<=0.5?16*p:8);
      ctx.strokeStyle='rgba(95,214,168,0.25)'; ctx.lineWidth=10; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(E.NL.px(0),y); ctx.lineTo(E.NL.px(reached),y); ctx.stroke(); ctx.lineCap='butt';
      // 변위 화살표 (시작 0 → 현재 x)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(E.NL.px(0),y-30); ctx.lineTo(E.NL.px(x),y-30); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(E.NL.px(x),y-30); ctx.lineTo(E.NL.px(x)-9,y-35); ctx.lineTo(E.NL.px(x)-9,y-25); ctx.fill();
      ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('변위', (E.NL.px(0)+E.NL.px(x))/2, y-38);
      // 주자(현재 위치)
      E.NL.dot(x,GRN,9);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('시작', E.NL.px(0), y+30);
      E.big('변위 = '+x.toFixed(1)+' m,   거리 = '+dist.toFixed(1)+' m', '변위(주황)=시작→끝 직선(부호·방향 O). 거리=실제 지나온 길이. 8까지 갔다 3으로 오면 거리 13, 변위는 3!'); }
  },

  // ══════════ 1.2 속도 = x-t 그래프의 기울기 (미분 연결) ══════════
  { id:'phys1_02',
    enter:function(E){ this.s={t:1.5}; E.Plot.range(0,3.2,0,10);
      E.controls('<div class="ctrl"><label>시각 t (초)</label><input type="range" id="tt" min="0.3" max="3" step="0.1" value="1.5"><output id="tto">1.5</output></div>');
      var self=this; E.bind('#tt','input',function(e){ self.s.t=+e.target.value; document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(400+self.s.t*80,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.t; P.axes();
      function x(tt){ return tt*tt; }          // 위치 x(t)=t²  → 속도 2t
      P.curve(x,BLU);
      var xt=x(t), vinst=2*t, vavg=xt/t;        // 순간속도(접선)·평균속도(원점에서의 할선)
      // 평균속도 할선(원점→점)
      ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(t),P.Y(xt)); ctx.stroke(); ctx.setLineDash([]);
      // 순간속도 접선(기울기 2t)
      var dt=1.0; ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(t-dt),P.Y(xt-vinst*dt)); ctx.lineTo(P.X(t+dt),P.Y(xt+vinst*dt)); ctx.stroke();
      P.dot(t,xt,GRN);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('x='+xt.toFixed(2)+' m', P.X(t)+8, P.Y(xt)-6);
      E.big('순간속도 v = '+vinst.toFixed(2)+' m/s  (= 접선 기울기)', 'x-t 그래프에서 기울기가 곧 속도. 주황 접선=순간속도(dx/dt=2t), 초록 할선=평균속도 '+vavg.toFixed(2)+' m/s. 이것이 14장 미분!'); }
  },

  // ══════════ 1.3 가속도 = v-t 그래프의 기울기 ══════════
  { id:'phys1_03',
    enter:function(E){ this.s={a:2}; E.Plot.range(0,5,-2,12);
      E.controls('<div class="ctrl"><label>가속도 a (m/s²)</label><input type="range" id="aa" min="-2" max="4" step="0.5" value="2"><output id="aao">2</output></div>');
      var self=this; E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value); E.blip(360+(self.s.a+2)*60,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, a=this.s.a, v0=2; P.axes();
      function v(t){ return v0+a*t; }
      P.curve(v,BLU);
      // 기울기 삼각형(가속도)
      var t1=1, t2=3, vy1=v(t1), vy2=v(t2);
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(P.X(t1),P.Y(vy1)); ctx.lineTo(P.X(t2),P.Y(vy1)); ctx.lineTo(P.X(t2),P.Y(vy2)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Δt='+(t2-t1), (P.X(t1)+P.X(t2))/2, P.Y(vy1)+16);
      ctx.textAlign='left'; ctx.fillText('Δv='+((vy2-vy1)).toFixed(1), P.X(t2)+6, (P.Y(vy1)+P.Y(vy2))/2);
      P.dot(0,v0,GRN);
      E.big('가속도 a = Δv/Δt = '+a.toFixed(1)+' m/s²', 'v-t 그래프의 기울기 = 가속도. a>0이면 빨라지고, a<0이면 느려지며, a=0이면 등속. (v₀='+v0+' m/s)'); }
  },

  // ══════════ 1.4 등가속도 운동 — v-t 넓이 = 변위 ══════════
  { id:'phys1_04',
    enter:function(E){ this.s={t:3}; E.Plot.range(0,6,0,14);
      E.controls('<div class="ctrl"><label>경과 시간 t (초)</label><input type="range" id="et" min="0" max="6" step="0.2" value="3"><output id="eto">3.0</output></div>');
      var self=this; E.bind('#et','input',function(e){ self.s.t=+e.target.value; document.getElementById('eto').textContent=(+e.target.value).toFixed(1); E.blip(400+self.s.t*40,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.t, v0=2, a=2; P.axes();
      function v(tt){ return v0+a*tt; }
      // v-t 아래 넓이(0..t) = 변위 — 사다리꼴 채움
      ctx.fillStyle='rgba(95,214,168,0.25)'; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0));
      for(var k=0;k<=40;k++){ var tk=t*k/40; ctx.lineTo(P.X(tk),P.Y(v(tk))); }
      ctx.lineTo(P.X(t),P.Y(0)); ctx.closePath(); ctx.fill();
      P.curve(v,BLU);
      var disp=v0*t+0.5*a*t*t, vt=v(t);
      // 넓이 = 변위 검산(사다리꼴)
      var area=(v0+vt)/2*t;
      P.dot(t,vt,GRN);
      // 트랙 위 물체(상단)
      var trkY=E.H*0.16, x0=P.X(0), x1=P.X(6), bx=x0+(x1-x0)*(disp/ (v0*6+0.5*a*36));
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,trkY); ctx.lineTo(x1,trkY); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(bx,trkY,7,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('이동한 물체 (변위 '+disp.toFixed(1)+' m)', (x0+x1)/2, trkY-12);
      E.big('변위 x = v₀t + ½at² = '+disp.toFixed(1)+' m', 'v-t 그래프 아래 넓이(초록) = 변위. 사다리꼴 넓이 '+area.toFixed(1)+' m 와 식이 일치 ✓ (v₀=2, a=2). 이것이 19장 적분!'); }
  },

  // ══════════ 1.5 자유낙하 — 질량 무관, g로 떨어진다 ══════════
  { id:'phys1_05',
    enter:function(E){ this.s={t:0.8}; E.setOn([]);
      E.controls('<div class="ctrl"><label>낙하 시간 t (초)</label><input type="range" id="ft" min="0" max="1.8" step="0.05" value="0.8"><output id="fto">0.80</output></div>');
      var self=this; E.bind('#ft','input',function(e){ self.s.t=+e.target.value; document.getElementById('fto').textContent=(+e.target.value).toFixed(2); E.blip(500-self.s.t*120,0.08); }); },
    draw:function(E){ var ctx=E.ctx, t=this.s.t, W=E.W, H=E.H, h0=15;   // 15 m 높이
      var y=h0-0.5*G*t*t, v=G*t; if(y<0){ y=0; }
      var topY=H*0.20, botY=H*0.78, scale=(botY-topY)/h0;
      // 두 공(가벼운 것·무거운 것) 같은 높이 — 질량 무관
      [[W*0.40,'가벼운 공',GRN],[W*0.60,'무거운 공',ORA]].forEach(function(b){
        var px=b[0], py=topY+(h0-y)*scale;
        // 자취
        ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(px,topY); ctx.lineTo(px,py); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=b[2]; ctx.beginPath(); ctx.arc(px,py,b===null?8: (b[1]==='무거운 공'?12:8),0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(b[1], px, topY-10);
      });
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.28,botY); ctx.lineTo(W*0.72,botY); ctx.stroke();
      E.big('높이 '+y.toFixed(1)+' m,  속력 '+v.toFixed(1)+' m/s', '진공에서는 질량과 무관하게 같은 가속도 g='+G+' m/s²로 떨어집니다. y = h₀ − ½gt², v = gt. 두 공이 늘 같은 높이!'); }
  },

  // ══════════ 1.6 포물선 운동 — 발사각과 사거리 ══════════
  { id:'phys1_06',
    enter:function(E){ this.s={ang:45}; E.setOn([]);
      E.controls('<div class="ctrl"><label>발사각 θ (도)</label><input type="range" id="ag" min="15" max="75" step="5" value="45"><output id="ago">45</output></div>');
      var self=this; E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=(+e.target.value); E.blip(360+self.s.ang*4,0.08); }); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, ang=this.s.ang*Math.PI/180, v0=20;
      var R=v0*v0*Math.sin(2*ang)/G, Hmax=v0*v0*Math.sin(ang)*Math.sin(ang)/(2*G), T=2*v0*Math.sin(ang)/G;
      var Rmax=v0*v0/G;   // 45도 최대 사거리
      var ox=W*0.14, oy=H*0.74, sx=(W*0.72)/Rmax, sy=(H*0.5)/(Rmax/4);
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ox-10,oy); ctx.lineTo(ox+Rmax*sx+10,oy); ctx.stroke();
      // 45도 기준 자취(옅게)
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath();
      for(var k=0;k<=40;k++){ var a45=Math.PI/4, tk=k/40*(2*v0*Math.sin(a45)/G), xk=v0*Math.cos(a45)*tk, yk=v0*Math.sin(a45)*tk-0.5*G*tk*tk; if(k===0)ctx.moveTo(ox+xk*sx,oy-yk*sy); else ctx.lineTo(ox+xk*sx,oy-yk*sy); } ctx.stroke();
      // 현재 각도 자취
      ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath();
      for(var k2=0;k2<=40;k2++){ var tk2=k2/40*T, xk2=v0*Math.cos(ang)*tk2, yk2=v0*Math.sin(ang)*tk2-0.5*G*tk2*tk2; if(k2===0)ctx.moveTo(ox+xk2*sx,oy-yk2*sy); else ctx.lineTo(ox+xk2*sx,oy-yk2*sy); } ctx.stroke();
      // 발사 벡터
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(ang)*40,oy-Math.sin(ang)*40); ctx.stroke();
      // 착지점
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ox+R*sx,oy,6,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('사거리 '+R.toFixed(1)+' m', ox+R*sx, oy+20);
      E.big('θ='+this.s.ang+'°  →  사거리 R = '+R.toFixed(1)+' m,  최고 '+Hmax.toFixed(1)+' m', 'R = v₀²·sin2θ/g. θ=45°에서 사거리 최대('+Rmax.toFixed(1)+' m)! 45°에서 멀어질수록 짧아집니다. (v₀=20 m/s)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
