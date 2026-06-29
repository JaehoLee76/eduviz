/* 물리학 제7장 진동 — PhysLab spring(후크 F=-kx)으로 단순조화운동을 적분
   SHM x=A cos(ωt), 주기 T=2π√(m/k), 에너지 KE↔PE, 진자(ODE 적분), 공명.
   닫힌 사인 공식을 베끼지 않고 -kx 힘을 매 프레임 적분해 진동을 '생성'.
   골든룰: 표시 수치는 전부 현재 상태(x,v,에너지,측정 진폭)에서 실시간 계산.
   텍스트=content/phys7.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', REST=3;

  function coil(E,x1,y,x2,n,col){ var ctx=E.ctx, dx=(x2-x1)/n; ctx.strokeStyle=col||DIM; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y); for(var i=1;i<n;i++) ctx.lineTo(x1+dx*(i-0.5), y+(i%2?-9:9)); ctx.lineTo(x2,y); ctx.stroke(); }
  function wall(E,x,y,h){ var ctx=E.ctx; ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y-h); ctx.lineTo(x,y+h); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; for(var i=-h;i<h;i+=8){ ctx.beginPath(); ctx.moveTo(x,y+i); ctx.lineTo(x-8,y+i+8); ctx.stroke(); } }
  function massBox(E,cx,cy,s,col,label){ var ctx=E.ctx; ctx.fillStyle=col; ctx.globalAlpha=0.22; ctx.fillRect(cx-s/2,cy-s/2,s,s); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(cx-s/2,cy-s/2,s,s); if(label){ ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(label,cx,cy+4); } }
  function tgraph(E,gx0,gy0,gw,gh,hist,amp,col){ var ctx=E.ctx, half=gh*0.5;
    // ── 축을 뚜렷하게(흰색·굵게·화살촉) ──
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=2.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0+gw+24,gy0); ctx.stroke();                 // X축(시간)
    ctx.beginPath(); ctx.moveTo(gx0,gy0+half); ctx.lineTo(gx0,gy0-half-24); ctx.stroke();          // Y축(변위)
    ctx.lineCap='butt'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(gx0+gw+24,gy0); ctx.lineTo(gx0+gw+12,gy0-7); ctx.lineTo(gx0+gw+12,gy0+7); ctx.closePath(); ctx.fill();   // X 화살촉
    ctx.beginPath(); ctx.moveTo(gx0,gy0-half-24); ctx.lineTo(gx0-7,gy0-half-12); ctx.lineTo(gx0+7,gy0-half-12); ctx.closePath(); ctx.fill();   // Y 화살촉
    // ── 진동 곡선 ──
    ctx.strokeStyle=col; ctx.lineWidth=2.6; ctx.beginPath();
    hist.forEach(function(v,i){ var x=gx0+gw*i/hist.length, y=gy0-(v/amp)*half; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }

  var scenes=[

  // ══════════ 7.1 단순조화운동(SHM) — 용수철의 -kx ══════════
  { id:'phys7_01',
    enter:function(E){ var self=this; this.s={k:8,m:1,hist:[]};
      this.build(); E.setOn([]);
      E.controls('<div class="ctrl"><label>용수철 상수 k</label><input type="range" id="kk" min="2" max="20" step="1" value="8"><output id="kko">8</output>'
        +'<label style="margin-left:14px">질량 m (kg)</label><input type="range" id="mm" min="0.5" max="4" step="0.5" value="1"><output id="mmo">1.0</output></div>');
      E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; self.build(); E.blip(360,0.07); });
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); self.build(); E.blip(300,0.07); }); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0}); s.w=w;
      var b=w.add({x:REST+2,y:0,m:s.m,r:0.3,color:GRN}); s.b=b; s.hist=[];
      w.force(PhysLab.F.spring(b,0,0,s.k,REST)); },
    tap:function(E){ this.s.b.x=REST+2; this.s.b.vx=0; this.s.hist=[]; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var ox=W*0.10, sc=(W*0.46)/6, baseY=H*0.34;
      function X(x){ return ox+x*sc; }
      wall(E,X(0),baseY,42);
      coil(E,X(0),baseY,X(b.x)-14,16,DIM);
      massBox(E,X(b.x),baseY,26,GRN,s.m+'kg');
      // 평형선
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(X(REST),baseY+24); ctx.lineTo(X(REST),baseY+44); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('평형', X(REST), baseY+58);
      // x-t 그래프
      if(!E.frozen){ s.hist.push(b.x-REST); if(s.hist.length>180) s.hist.shift(); }
      tgraph(E, W*0.10, H*0.74, W*0.80, H*0.26, s.hist, 2.3, BLU);
      ctx.fillStyle=BLU; ctx.font='700 30px sans-serif'; ctx.textAlign='left'; ctx.fillText('변위 x', W*0.10+14, H*0.74-H*0.13-12);
      ctx.fillStyle='#dfeefb'; ctx.textAlign='right'; ctx.fillText('시간 t', W-14, H*0.74+12);
      var w0=Math.sqrt(s.k/s.m), T=2*Math.PI/w0;
      E.tapHint(W/2, H*0.95, '화면 탭 = 다시 당기기', true);
      E.big('T = 2π√(m/k) = '+T.toFixed(2)+' s   (ω = '+w0.toFixed(2)+' rad/s)', '용수철은 평형에서 벗어난 만큼 되돌리는 힘 F=−kx를 줍니다(후크). 멀면 세게, 가까우면 약하게 — 이 힘 하나만 있으면 물체는 저절로 매끄러운 <b>사인 곡선</b>(단순조화운동)을 그리며 왕복합니다. k가 클수록(빳빳), m이 작을수록 빨리 떱니다.'); }
  },

  // ══════════ 7.2 주기 T=2π√(m/k) — 무거우면 느리게 ══════════
  { id:'phys7_02',
    enter:function(E){ var self=this; this.s={k:10,m1:1,m2:3};
      this.build(); E.setOn([]);
      E.controls('<div class="ctrl"><label>용수철 상수 k(공통)</label><input type="range" id="kk" min="4" max="20" step="1" value="10"><output id="kko">10</output>'
        +'<label style="margin-left:14px">아래 질량 m₂</label><input type="range" id="m2" min="1" max="6" step="1" value="3"><output id="m2o">3</output></div>');
      E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; self.build(); E.blip(360,0.07); });
      E.bind('#m2','input',function(e){ self.s.m2=+e.target.value; document.getElementById('m2o').textContent=e.target.value; self.build(); E.blip(300,0.07); }); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0}); s.w=w;
      var a=w.add({x:REST+2,y:1,m:s.m1,r:0.3,color:GRN}); var b=w.add({x:REST+2,y:-1,m:s.m2,r:0.3,color:ORA}); s.a=a; s.b=b;
      w.force(PhysLab.F.spring(a,0,1,s.k,REST)); w.force(PhysLab.F.spring(b,0,-1,s.k,REST)); },
    tap:function(E){ var s=this.s; s.a.x=REST+2; s.a.vx=0; s.b.x=REST+2; s.b.vx=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var ox=W*0.10, sc=(W*0.5)/6;
      function X(x){ return ox+x*sc; }
      [[s.a,H*0.32,GRN,s.m1,'위 m₁='+s.m1],[s.b,H*0.56,ORA,s.m2,'아래 m₂='+s.m2]].forEach(function(o){ var b=o[0], y=o[1];
        wall(E,X(0),y,32); coil(E,X(0),y,X(b.x)-14,16,DIM); massBox(E,X(b.x),y,24,o[2],o[3]+'kg');
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(X(REST),y-22); ctx.lineTo(X(REST),y+22); ctx.stroke(); ctx.setLineDash([]); });
      var T1=2*Math.PI*Math.sqrt(s.m1/s.k), T2=2*Math.PI*Math.sqrt(s.m2/s.k);
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('T₁ = '+T1.toFixed(2)+' s', W*0.70, H*0.32);
      ctx.fillStyle=ORA; ctx.fillText('T₂ = '+T2.toFixed(2)+' s', W*0.70, H*0.56);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 당기기', true);
      E.big('T = 2π√(m/k) — 무거울수록 느리게 진동', '같은 용수철(k 동일)이라도 질량이 클수록 주기가 깁니다(T∝√m). 두 추를 같은 폭으로 당겨 놓아도 무거운 쪽(주황)이 느리게 흔들립니다. 놀랍게도 <b>진폭은 주기에 영향을 주지 않습니다</b>(등시성) — 크게 당기든 작게 당기든 한 번 왕복 시간은 같습니다.'); }
  },

  // ══════════ 7.3 SHM 에너지 — KE ↔ 탄성PE ══════════
  { id:'phys7_03',
    enter:function(E){ var self=this; this.s={k:8,m:1};
      this.build(); E.setOn([]);
      E.controls('<div class="ctrl"><label>용수철 상수 k</label><input type="range" id="kk" min="3" max="18" step="1" value="8"><output id="kko">8</output></div>');
      E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; self.build(); E.blip(360,0.07); }); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0}); s.w=w;
      var b=w.add({x:REST+2,y:0,m:s.m,r:0.3,color:GRN}); s.b=b; s.E0=0.5*s.k*4;
      w.force(PhysLab.F.spring(b,0,0,s.k,REST)); },
    tap:function(E){ this.s.b.x=REST+2; this.s.b.vx=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var ox=W*0.08, sc=(W*0.42)/6, baseY=H*0.34;
      function X(x){ return ox+x*sc; }
      wall(E,X(0),baseY,40); coil(E,X(0),baseY,X(b.x)-14,16,DIM); massBox(E,X(b.x),baseY,26,GRN,s.m+'kg');
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(X(REST),baseY+22); ctx.lineTo(X(REST),baseY+42); ctx.stroke(); ctx.setLineDash([]);
      var dx=b.x-REST, PE=0.5*s.k*dx*dx, KE=0.5*b.m*b.vx*b.vx, tot=PE+KE;
      // 막대
      var baseB=H*0.80, bh=H*0.42, mx=Math.max(s.E0,1)*1.1;
      [['운동E',KE,GRN],['탄성PE',PE,BLU],['합계',tot,ORA]].forEach(function(it,i){ var x=W*0.60+i*66, hh=Math.min(1,it[1]/mx)*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseB-bh,46,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseB-hh,46,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(1),x+23,baseB-hh-6); ctx.fillStyle=it[2]; ctx.fillText(it[0],x+23,baseB+18); });
      E.tapHint(W/2, H*0.92, '화면 탭 = 다시 당기기', true);
      E.big('운동E '+KE.toFixed(1)+' ⇄ 탄성PE '+PE.toFixed(1)+'  (합 '+tot.toFixed(1)+' 일정)', '진동하는 동안 에너지가 운동E와 탄성위치E(½kx²) 사이를 끊임없이 오갑니다. 평형점에서 속도 최대(운동E 최대), 양끝에서 순간 정지(탄성PE 최대). 마찰이 없으면 합은 일정 — 3장 에너지 보존이 진동으로 되살아납니다.'); }
  },

  // ══════════ 7.4 진자 — T=2π√(L/g) (진자 ODE 적분) ══════════
  { id:'phys7_04',
    enter:function(E){ var self=this; this.s={L:2,th:0.5,om:0,g:9.8,th0:0.5};
      E.controls('<div class="ctrl"><label>실 길이 L (m)</label><input type="range" id="ll" min="0.5" max="3.5" step="0.25" value="2"><output id="llo">2.00</output></div>');
      E.bind('#ll','input',function(e){ self.s.L=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(2); self.s.th=self.s.th0; self.s.om=0; E.blip(420-self.s.L*60,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=this.s.th0; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var h=1/60/6; if(!E.frozen)for(var i=0;i<6;i++){ s.om += -(s.g/s.L)*Math.sin(s.th)*h; s.th += s.om*h; }   // 진자 ODE: θ'' = -(g/L)sinθ
      var px=W*0.40, py=H*0.16, sc=Math.min(W*0.16,H*0.20), L=s.L*sc;
      var bx=px+L*Math.sin(s.th), by=py+L*Math.cos(s.th);
      // 천장·실·추
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px-40,py); ctx.lineTo(px+40,py); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(bx,by); ctx.stroke();
      // 실 길이 L 라벨
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('L = '+s.L.toFixed(2)+' m', (px+bx)/2+8, (py+by)/2);
      // 수직 기준선 + 각도 호
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+L+10); ctx.stroke(); ctx.setLineDash([]);
      // 각도 θ 호
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,34,Math.PI/2,Math.PI/2-s.th,s.th>0); ctx.stroke();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('θ', px+(s.th>0?22:-22), py+48);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(bx,by,13,0,7); ctx.fill();
      var w0=Math.sqrt(s.g/s.L), T=2*Math.PI/w0;
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 놓기', true);
      E.big('T = 2π√(L/g) = '+T.toFixed(2)+' s   (θ = '+(s.th*180/Math.PI).toFixed(0)+'°)', '진자도 단순조화운동입니다(작은 각). 복원력이 중력의 접선 성분 −mg·sinθ라서, 작은 각에선 sinθ≈θ가 되어 −kx꼴이 됩니다. 주기는 <b>실 길이 L과 중력 g</b>로만 결정 — 추의 질량·진폭과 무관(갈릴레오의 발견). L을 4배로 늘리면 주기는 2배.'); }
  },

  // ══════════ 7.5 공명 — 고유진동수에서 폭발적으로 ══════════
  { id:'phys7_05',
    enter:function(E){ var self=this; this.s={wd:2.0,k:8,m:1,c:0.5,F0:4,amp:0,maxw:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:REST,y:0,m:1,r:0.3,color:GRN}); this.s.b=b;
      w.force(PhysLab.F.spring(b,0,0,self.s.k,REST));
      w.force(PhysLab.F.drag(b,self.s.c));
      w.force(function(ww){ b.fx += self.s.F0*Math.cos(self.s.wd*ww.t); });   // 주기적 구동력
      E.controls('<div class="ctrl"><label>구동 진동수 ωd</label><input type="range" id="wd" min="0.5" max="5" step="0.1" value="2.0"><output id="wdo">2.0</output></div>');
      E.bind('#wd','input',function(e){ self.s.wd=+e.target.value; document.getElementById('wdo').textContent=(+e.target.value).toFixed(1); self.s.maxw=[]; E.blip(300+self.s.wd*60,0.07); });
      E.setOn([]); },
    tap:function(E){ var b=this.s.b; b.x=REST; b.vx=0; this.s.w.t=0; this.s.maxw=[]; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var dx=b.x-REST; s.maxw.push(Math.abs(dx)); if(s.maxw.length>240) s.maxw.shift();
      var amp=Math.max.apply(null,s.maxw);   // 최근 측정 진폭(시뮬에서)
      var ox=W*0.08, sc=(W*0.40)/6, baseY=H*0.30;
      function X(x){ return ox+x*sc; }
      wall(E,X(0),baseY,36); coil(E,X(0),baseY,X(b.x)-14,16,DIM); massBox(E,X(b.x),baseY,24,GRN,'');
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(X(REST),baseY+20); ctx.lineTo(X(REST),baseY+38); ctx.stroke(); ctx.setLineDash([]);
      var w0=Math.sqrt(s.k/s.m);
      // 이론 공명 곡선 A(ωd) = F0/m / √((ω0²-ωd²)²+(c/m·ωd)²)
      var gx0=W*0.56, gx1=W*0.95, gy0=H*0.82, gh=H*0.46;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('진폭', gx0+3, gy0-gh+4); ctx.fillText('ωd', gx1-16, gy0+14);
      function Ath(wd){ var d=(w0*w0-wd*wd), g=(s.c/s.m)*wd; return (s.F0/s.m)/Math.sqrt(d*d+g*g); }
      var Amax=Ath(w0)*1.1;
      ctx.strokeStyle='rgba(122,184,255,0.6)'; ctx.lineWidth=2; ctx.beginPath();
      for(var kx=0;kx<=60;kx++){ var wd=0.5+kx/60*4.5, x=gx0+(wd-0.5)/4.5*(gx1-gx0), y=gy0-Math.min(gh,Ath(wd)/Amax*gh); if(kx===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 고유진동수 표시선
      var w0x=gx0+(w0-0.5)/4.5*(gx1-gx0); ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(w0x,gy0); ctx.lineTo(w0x,gy0-gh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.textAlign='center'; ctx.fillText('ω₀='+w0.toFixed(1), w0x, gy0-gh-2);
      // 현재 ωd 마커(측정 진폭)
      var mxk=gx0+(s.wd-0.5)/4.5*(gx1-gx0), myk=gy0-Math.min(gh,amp/Amax*gh);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(mxk,myk,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.92, '화면 탭 = 초기화  (구동 진동수를 ω₀에 맞춰 보세요)', true);
      E.big('구동 ωd = '+s.wd.toFixed(1)+' vs 고유 ω₀ = '+w0.toFixed(1)+'  → 진폭 '+amp.toFixed(2), '주기적인 힘으로 흔들면, 구동 진동수가 <b>고유진동수 ω₀=√(k/m)</b>에 가까울수록 진폭이 폭발적으로 커집니다 — <b>공명</b>. 박자가 맞으면 미는 힘이 매번 운동을 보태기만 하기 때문이지요. 그네를 타이밍 맞춰 밀면 점점 높이 오르는 것, 와인잔이 소리로 깨지는 것, 다리가 바람에 무너진(타코마) 것이 모두 공명입니다. ωd를 ω₀에 맞춰 보세요.'); }
  },

  // ─── 심화: 감쇠진동 (under/critical/over) ───
  { id:'phys7_01_damp', branchOf:'phys7_01', ord:1,
    enter:function(E){ var self=this; this.s={c:1,k:8,m:1,settle:0};
      this.build(); E.setOn([]);
      E.controls('<div class="ctrl"><label>감쇠 c</label><input type="range" id="cc" min="0" max="9" step="0.5" value="1"><output id="cco">1.0</output></div>');
      E.bind('#cc','input',function(e){ self.s.c=+e.target.value; self.build(); document.getElementById('cco').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); }); },
    build:function(){ var s=this.s; var w=PhysLab.world({g:0}); s.w=w; var b=w.add({x:REST+2,y:0,m:s.m,r:0.3,color:GRN}); s.b=b;
      w.force(PhysLab.F.spring(b,0,0,s.k,REST)); w.force(PhysLab.F.drag(b,s.c)); s.hist=[]; s.settle=0; },
    tap:function(E){ this.build(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6); var dx=b.x-REST;
      if(!E.frozen){ if(Math.abs(dx)<0.04 && Math.abs(b.vx)<0.04){ s.settle++; if(s.settle>90) this.build(); } else s.settle=0;
        s.hist.push(dx); if(s.hist.length>260) s.hist.shift(); }
      // 용수철·질량
      var ox=W*0.10, sc=(W*0.42)/6, baseY=H*0.30; function X(x){return ox+x*sc;}
      wall(E,X(0),baseY,34); coil(E,X(0),baseY,X(b.x)-12,16,DIM); massBox(E,X(b.x),baseY,24,GRN,'');
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(X(REST),baseY+18); ctx.lineTo(X(REST),baseY+34); ctx.stroke(); ctx.setLineDash([]);
      // x-t
      tgraph(E, W*0.10, H*0.72, W*0.82, H*0.30, s.hist, 2.3, BLU);
      ctx.fillStyle=BLU; ctx.font='700 30px sans-serif'; ctx.textAlign='left'; ctx.fillText('변위 x', W*0.10+14, H*0.72-H*0.15-12);
      ctx.fillStyle='#dfeefb'; ctx.textAlign='right'; ctx.fillText('시간 t', W-14, H*0.72+12);
      var ccrit=2*Math.sqrt(s.k*s.m), regime = s.c<ccrit-0.3?'미흡감쇠(진동하며 잦아듦)':(s.c>ccrit+0.3?'과대감쇠(천천히 복귀)':'임계감쇠(가장 빠른 복귀)');
      E.tapHint(W/2, H*0.95, '감쇠 c를 바꿔 세 가지 거동을 보세요', true);
      E.big('감쇠진동 — '+regime+' (임계 c_c=2√(km)='+ccrit.toFixed(1)+')', '저항(−cv)이 있으면 진동은 점점 잦아듭니다. <b>미흡감쇠</b>(c 작음): 진폭이 지수적으로 줄며 진동(자동차 낡은 쇼바). <b>임계감쇠</b>(c=2√(km)): 진동 없이 가장 빠르게 평형 복귀 — 자동차 서스펜션·계측기 바늘의 목표. <b>과대감쇠</b>(c 큼): 진동 없이 느리게 복귀(문 닫힘 장치). 같은 용수철도 감쇠에 따라 거동이 완전히 달라집니다.'); }
  },

  // ─── 심화: 대진폭 진자 (등시성이 깨진다) ───
  { id:'phys7_04_amp', branchOf:'phys7_04', ord:1,
    enter:function(E){ var self=this; this.s={L:2,g:9.8,a:[0.3,2.4],om:[0,0],T:[0,0],pk:[0,0],last:[0,0]};
      E.controls('<div class="ctrl"><label>오른쪽 진자 시작각 (도)</label><input type="range" id="ag" min="20" max="170" step="10" value="137"><output id="ago">137</output></div>');
      E.bind('#ag','input',function(e){ self.s.a[1]=+e.target.value*Math.PI/180; self.reset(); document.getElementById('ago').textContent=e.target.value; E.blip(360,0.07); });
      this.s.a[1]=137*Math.PI/180; this.reset(); E.setOn([]); },
    reset:function(){ var s=this.s; s.th=[s.a[0],s.a[1]]; s.om=[0,0]; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var h=1/60/6; if(!E.frozen)for(var k=0;k<6;k++){ for(var i=0;i<2;i++){ s.om[i]+= -(s.g/s.L)*Math.sin(s.th[i])*h; s.th[i]+=s.om[i]*h; } }
      var L=Math.min(W*0.14,H*0.22)*s.L*0.6;
      [[W*0.30,'작은 각(≈SHM)',GRN,0],[W*0.62,'큰 각',ORA,1]].forEach(function(c){ var px=c[0],py=H*0.18,th=s.th[c[3]];
        var bx=px+L*Math.sin(th), by=py+L*Math.cos(th);
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px-30,py); ctx.lineTo(px+30,py); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+L+6); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(bx,by); ctx.stroke();
        ctx.fillStyle=c[2]; ctx.beginPath(); ctx.arc(bx,by,12,0,7); ctx.fill();
        ctx.fillStyle=c[2]; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(c[1], px, py+L+30); });
      var T0=2*Math.PI*Math.sqrt(s.L/s.g), th0=s.a[1];
      var Tbig=T0*(1+th0*th0/16);   // 대진폭 근사 T≈T0(1+θ0²/16)
      E.tapHint(W/2, H*0.90, '큰 진폭일수록 주기가 길어집니다(등시성 깨짐)', true);
      E.big('대진폭 진자 — 작은각 T₀='+T0.toFixed(2)+'s, 큰각 T≈'+Tbig.toFixed(2)+'s', '작은 각에서는 sinθ≈θ라 주기가 진폭과 무관(등시성). 하지만 <b>큰 진폭에서는 sinθ<θ</b>라 복원력이 약해져 주기가 길어집니다 — 등시성이 깨집니다(T≈T₀(1+θ₀²/16+…)). 두 진자를 같은 순간 놓으면 큰 각 진자(주황)가 점점 뒤처지는 것을 보세요. 정밀 진자시계가 작은 진폭을 쓰는 이유, 하위헌스가 사이클로이드 진자를 고안한 이유입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
