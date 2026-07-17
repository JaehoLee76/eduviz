/* 물리학 제4장 운동량 — PhysLab 충돌 엔진으로 운동량 보존을 '증명'
   p=mv, 충격량 J=Δp, 충돌 전후 운동량 보존(엔진 collide), 탄성/비탄성, 반동.
   골든룰: 표시 수치는 전부 엔진 상태(질량·속도)에서 실시간 계산.
   텍스트=content/phys4.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  function ball(E,v,b,label,sc){ sc=sc||1; var ctx=E.ctx, px=v.X(b.x), py=v.Y(b.y), pr=b.r*v.s;
    ctx.fillStyle=b.color; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(px,py,pr,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle='#10141a'; ctx.font='bold '+(12*sc)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(label, px, py); ctx.textBaseline='alphabetic';
    ctx.fillStyle=b.color; ctx.font=(11*sc)+'px sans-serif'; ctx.fillText(b.m.toFixed(1)+' kg', px, py-pr-7*sc); return {px:px,py:py,pr:pr}; }
  // 부호 있는 수평 화살표(운동량·속도): cx에서 시작, len(px) 방향
  function harrow(E,cx,cy,len,col,label,sc){ sc=sc||1; var ctx=E.ctx; if(Math.abs(len)<3){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy,3,0,7); ctx.fill(); return; }
    var dir=len>0?1:-1; ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+len,cy); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(cx+len,cy); ctx.lineTo(cx+len-9*dir,cy-5); ctx.lineTo(cx+len-9*dir,cy+5); ctx.fill();
    if(label){ ctx.font=(11*sc)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, cx+len/2, cy-8*sc); } }

  var scenes=[

  // ══════════ 4.1 운동량 p = mv ══════════
  { id:'phys4_01',
    enter:function(E){ var self=this; this.s={m:2,v:3};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:1,y:0,m:2,r:0.4,vx:3,color:GRN}); this.s.b=b;
      E.controls('<div class="ctrl"><label>질량 m (kg)</label><input type="range" id="mm" min="1" max="5" step="1" value="2"><output id="mmo">2</output>'
        +'<label style="margin-left:14px">속도 v (m/s)</label><input type="range" id="vv" min="1" max="6" step="0.5" value="3"><output id="vvo">3.0</output></div>');
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; self.s.b.m=self.s.m; document.getElementById('mmo').textContent=e.target.value; E.blip(300,0.07); });
      E.bind('#vv','input',function(e){ self.s.v=+e.target.value; self.s.b.vx=self.s.v; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.b.x=1; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H;
      b.vx=s.v; w.step(1/60,6); if(b.x>10){ b.x=1; }
      var v=PhysLab.view(W*0.08, H*0.42, (W*0.84)/11); s.view=v;
      var ctx=E.ctx; ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+24); ctx.lineTo(v.X(11),v.Y(0)+24); ctx.stroke();
      var bk=ball(E,v,b,'');
      harrow(E, bk.px, bk.py-bk.pr-22, b.vx*14, BLU, 'v='+s.v.toFixed(1));
      var p=s.m*s.v;
      harrow(E, bk.px, bk.py+bk.pr+22, p*9, ORA, 'p='+p.toFixed(1));
      E.tapHint(W/2, H*0.86, '화면 탭 = 처음으로', true);
      E.big('운동량 p = m·v = '+p.toFixed(1)+' kg·m/s', '운동량은 "얼마나 세게 움직이는가" — 질량 × 속도입니다. 무거울수록, 빠를수록 커지죠. 속도가 같아도 트럭(큰 m)은 자전거보다 운동량이 훨씬 커서 멈춰 세우기가 그만큼 힘듭니다. 방향까지 가진 벡터라 왼쪽으로 가면 부호가 음수가 됩니다.'); }
  },

  // ══════════ 4.2 충격량 J = FΔt = Δp ══════════
  { id:'phys4_02',
    enter:function(E){ var self=this; this.s={F:6,m:2};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:1,y:0,m:2,r:0.4,vx:0,color:GRN}); this.s.b=b;
      w.force(function(){ b.fx += self.s.F; });
      E.controls('<div class="ctrl"><label>힘 F (N)</label><input type="range" id="ff" min="2" max="12" step="1" value="6"><output id="ffo">6</output>'
        +'<label style="margin-left:14px">질량 m (kg)</label><input type="range" id="mm" min="1" max="4" step="1" value="2"><output id="mmo">2</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=e.target.value; E.blip(300,0.07); });
      E.setOn([]); },
    tap:function(E){ var b=this.s.b; b.x=1; b.vx=0; this.s.w.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H;
      b.m=s.m; w.step(1/60,6); if(b.x>10){ b.x=1; b.vx=0; w.t=0; }
      var v=PhysLab.view(W*0.08, H*0.40, (W*0.50)/11); s.view=v;
      var ctx=E.ctx; ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+24); ctx.lineTo(v.X(11),v.Y(0)+24); ctx.stroke();
      var bk=ball(E,v,b,'');
      harrow(E, bk.px+bk.pr, bk.py, s.F*7, ORA, 'F='+s.F);
      var J=s.F*w.t, dp=b.m*b.vx;     // 충격량 = F·t,  Δp = mΔv  (둘 다 시뮬에서)
      // 막대 두 개
      var baseY=H*0.80, bh=H*0.34, mx=Math.max(J,dp,1)*1.15;
      [['충격량 J',J,PNK],['Δ운동량',dp,GRN]].forEach(function(it,i){ var x=W*0.66+i*72, hh=it[1]/mx*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,48,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,48,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(1), x+24, baseY-hh-6);
        ctx.fillStyle=it[2]; ctx.fillText(it[0], x+24, baseY+18); });
      E.tapHint(W/2, H*0.90, '화면 탭 = 처음으로', true);
      E.big('충격량 J = F·t = '+J.toFixed(1)+' = Δp = mΔv = '+dp.toFixed(1), '충격량 정리: 힘 × 작용 시간 = 운동량 변화. 두 막대 키가 늘 똑같죠 — 한쪽은 가한 힘과 시간으로, 다른 쪽은 실제로 빨라진 정도로 따로 잰 값인데도 정확히 맞습니다. 같은 운동량 변화라도 시간을 길게 끌면(에어백) 받는 힘이 작아집니다.'); }
  },

  // ══════════ 4.3 운동량 보존 — 충돌 전후 총 운동량 일정 ══════════
  { id:'phys4_03',
    enter:function(E){ var self=this; this.s={m2:2};
      var w=PhysLab.world({g:0, rest:1}); this.s.w=w;      // rest=1 완전탄성
      var A=w.add({x:2.5,y:0,m:1,r:0.4,vx:2.6,color:GRN});
      var B=w.add({x:8,y:0,m:2,r:0.5,vx:-1.4,color:BLU}); this.s.A=A; this.s.B=B;
      E.controls('<div class="ctrl"><label>파란 공 질량 m₂ (kg)</label><input type="range" id="m2" min="1" max="4" step="1" value="2"><output id="m2o">2</output></div>');
      E.bind('#m2','input',function(e){ self.s.m2=+e.target.value; self.reset(); document.getElementById('m2o').textContent=e.target.value; E.blip(320,0.07); });
      E.setOn([]); },
    reset:function(){ var s=this.s; s.A.x=2.5; s.A.vx=2.6; s.A.m=1; s.A.r=0.4; s.B.x=8; s.B.vx=-1.4; s.B.m=s.m2; s.B.r=0.4+s.m2*0.05; },
    tap:function(E){ this.reset(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, A=s.A, B=s.B, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6); w.collide();
      if(A.x<0.3||A.x>10.7||B.x<0.3||B.x>10.7) this.reset();
      var v=PhysLab.view(W*0.06, H*0.40, (W*0.88)/11); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+30); ctx.lineTo(v.X(11),v.Y(0)+30); ctx.stroke();
      var p1=A.m*A.vx, p2=B.m*B.vx, ptot=p1+p2, KE=0.5*A.m*A.vx*A.vx+0.5*B.m*B.vx*B.vx;
      var ka=ball(E,v,A,'A'), kb=ball(E,v,B,'B');
      harrow(E, ka.px, ka.py-ka.pr-16, A.vx*16, ORA, 'p₁='+p1.toFixed(1));
      harrow(E, kb.px, kb.py-kb.pr-16, B.vx*16, ORA, 'p₂='+p2.toFixed(1));
      // 총 운동량 화살표(중앙 하단)
      var cy=H*0.74; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('총 운동량 Σp', W*0.34, cy+4);
      harrow(E, W*0.36, cy, ptot*18, GRN, '');
      ctx.fillStyle=GRN; ctx.textAlign='left'; ctx.fillText('p₁+p₂ = '+ptot.toFixed(2)+' kg·m/s', W*0.36+Math.abs(ptot*18)+14, cy+4);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 충돌', true);
      E.big('총 운동량 = '+ptot.toFixed(2)+' kg·m/s  (충돌해도 일정)', '운동량 보존: 밖에서 미는 힘이 없으면 충돌 전·중·후 총 운동량(p₁+p₂)이 변하지 않습니다. A가 B를 민 만큼 B도 A를 되밀거든요(작용-반작용). 지금은 완전탄성이라 운동E도 그대로 보존됩니다(현재 '+KE.toFixed(1)+' J). m₂를 바꿔 보세요.'); }
  },

  // ══════════ 4.4 탄성 vs 비탄성 충돌 — 운동량은 늘, 운동E는? ══════════
  { id:'phys4_04',
    enter:function(E){ var self=this; this.s={e:1};
      var w=PhysLab.world({g:0, rest:1}); this.s.w=w;
      var A=w.add({x:2.5,y:0,m:2,r:0.45,vx:2.4,color:GRN});
      var B=w.add({x:8,y:0,m:2,r:0.45,vx:-1.2,color:PNK}); this.s.A=A; this.s.B=B;
      this.s.KE0=0.5*2*2.4*2.4+0.5*2*1.2*1.2;
      E.controls('<div class="ctrl"><label>반발계수 e</label><input type="range" id="ee" min="0" max="1" step="0.1" value="1"><output id="eeo">1.0</output></div>');
      E.bind('#ee','input',function(e){ self.s.e=+e.target.value; self.s.w.rest=self.s.e; self.reset(); document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    reset:function(){ var s=this.s; s.A.x=2.5; s.A.vx=2.4; s.B.x=8; s.B.vx=-1.2; },
    tap:function(E){ this.reset(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, A=s.A, B=s.B, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6); w.collide();
      if(A.x<0.3||A.x>10.7||B.x<0.3||B.x>10.7||(Math.abs(A.vx)<0.02&&Math.abs(B.vx)<0.02&&A.x>3)) this.reset();
      var v=PhysLab.view(W*0.06, H*0.38, (W*0.50)/11); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+30); ctx.lineTo(v.X(11),v.Y(0)+30); ctx.stroke();
      var ka=ball(E,v,A,'A'), kb=ball(E,v,B,'B');
      harrow(E, ka.px, ka.py-ka.pr-16, A.vx*16, ORA, 'v='+A.vx.toFixed(1));
      harrow(E, kb.px, kb.py-kb.pr-16, B.vx*16, ORA, 'v='+B.vx.toFixed(1));
      var ptot=A.m*A.vx+B.m*B.vx, KE=0.5*A.m*A.vx*A.vx+0.5*B.m*B.vx*B.vx;
      var baseY=H*0.80, bh=H*0.32, mx=Math.max(Math.abs(ptot),s.KE0,1)*1.15;
      [['Σp (kg·m/s)',Math.abs(ptot),GRN,ptot],['ΣKE (J)',KE,BLU,KE]].forEach(function(it,i){ var x=W*0.64+i*78, hh=it[1]/mx*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,52,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,52,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[3].toFixed(1), x+26, baseY-hh-6);
        ctx.fillStyle=it[2]; ctx.fillText(it[0], x+26, baseY+18); });
      // KE0 기준선
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.setLineDash([4,3]); var y0=baseY-s.KE0/mx*bh; ctx.beginPath(); ctx.moveTo(W*0.64+78,y0); ctx.lineTo(W*0.64+78+52,y0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(122,184,255,0.7)'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('충돌 전 KE₀='+s.KE0.toFixed(1), W*0.64+78+52+8, y0+4);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 충돌  (e=1 탄성, e=0 완전비탄성)', true);
      var lost=s.KE0-KE;
      E.big('운동량 보존 · 운동E '+(s.e>=1?'보존':'손실 '+lost.toFixed(1)+' J'), '어떤 충돌이든 총 운동량(초록)은 끄떡없이 보존됩니다. 하지만 운동에너지(파랑)는 e<1이면 열·소리·찌그러짐으로 새어 나갑니다 — 운동E까지 온전한 건 e=1 완전탄성뿐. e=0이면 두 공이 들러붙어 한 덩어리로 갑니다(완전비탄성). 점선은 충돌 전 운동E라 얼마나 줄었는지 보입니다.'); }
  },

  // ══════════ 4.5 반동 — 총 운동량 0에서 밀어내기(작용-반작용) ══════════
  { id:'phys4_05',
    enter:function(E){ var self=this; this.s={mA:1,mB:3,fired:false};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var A=w.add({x:5,y:0,m:1,r:0.4,color:GRN});
      var B=w.add({x:5.9,y:0,m:3,r:0.55,color:ORA}); this.s.A=A; this.s.B=B;
      E.controls('<div class="ctrl"><label>왼쪽 질량 mA</label><input type="range" id="ma" min="1" max="4" step="1" value="1"><output id="mao">1</output>'
        +'<label style="margin-left:14px">오른쪽 질량 mB</label><input type="range" id="mb" min="1" max="4" step="1" value="3"><output id="mbo">3</output></div>');
      E.bind('#ma','input',function(e){ self.s.mA=+e.target.value; document.getElementById('mao').textContent=e.target.value; self.fire(); E.blip(320,0.07); });
      E.bind('#mb','input',function(e){ self.s.mB=+e.target.value; document.getElementById('mbo').textContent=e.target.value; self.fire(); E.blip(360,0.07); });
      E.setOn([]); },
    fire:function(){ var s=this.s, I=4; s.A.m=s.mA; s.B.m=s.mB; s.A.r=0.3+s.mA*0.07; s.B.r=0.3+s.mB*0.07;
      s.A.x=4.6; s.B.x=4.6+s.A.r+s.B.r; s.A.vx=-I/s.mA; s.B.vx=I/s.mB; s.fired=true; },   // 총 운동량 = -I + I = 0
    tap:function(E){ this.fire(); E.blip(420,0.14); },
    draw:function(E){ var s=this.s, w=s.w, A=s.A, B=s.B, W=E.W, H=E.H, ctx=E.ctx;
      if(!s.fired){ this.fire(); }
      w.step(1/60,6);
      if(A.x<0.3||B.x>10.7){ A.vx=0; B.vx=0; }
      var v=PhysLab.view(W*0.06, H*0.42, (W*0.88)/11); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+30); ctx.lineTo(v.X(11),v.Y(0)+30); ctx.stroke();
      // 폭발 지점 표시
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(v.X(5),v.Y(0)+78); ctx.lineTo(v.X(5),v.Y(0)-58); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText('출발점 (Σp=0)', v.X(5), H*0.60+40);
      var ka=ball(E,v,A,'',2), kb=ball(E,v,B,'',2);
      harrow(E, ka.px, ka.py-ka.pr-44, A.vx*16, BLU, 'v='+A.vx.toFixed(1), 2);
      harrow(E, kb.px, kb.py-kb.pr-44, B.vx*16, BLU, 'v='+B.vx.toFixed(1), 2);
      var pA=A.m*A.vx, pB=B.m*B.vx, ptot=pA+pB;
      // 운동량 화살표(공통점에서 반대 방향, 크기 같음) — 라벨은 양 끝으로 분리(겹침 방지)
      var cy=H*0.60, mc=W*0.50; harrow(E, mc, cy, pA*16, GRN, '', 2); harrow(E, mc, cy, pB*16, ORA, '', 2);
      ctx.font='22px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle=GRN; ctx.fillText('pA = '+pA.toFixed(1), mc+pA*16-46, cy-12);
      ctx.fillStyle=ORA; ctx.fillText('pB = '+pB.toFixed(1), mc+pB*16+46, cy-12);
      E.tapHint(W/2, H*0.88, '화면 탭 = 다시 발사  (질량 바꾸면 즉시 발사)', true);
      E.big('총 운동량 = pA + pB = '+ptot.toFixed(2)+' ≈ 0  (반동)', '멈춰 있던(총 운동량 0) 둘이 서로 밀면, 두 운동량은 크기 같고 방향만 반대 → 합은 여전히 0. 가벼운 쪽이 더 빨리 튕깁니다(|v|=I/m). 총의 반동, 로켓 추진, 헤엄이 전부 이 원리 — 작용-반작용(뉴턴 3법칙)을 운동량으로 말한 것입니다.'); }
  },

  // ─── 심화: 2차원 충돌 (당구, 엔진 collide) ───
  { id:'phys4_03_2d', branchOf:'phys4_03', ord:1,
    enter:function(E){ var self=this; this.s={off:0.3};
      var w=PhysLab.world({g:0, rest:1}); this.s.w=w;
      this.reset(); E.controls('<div class="ctrl"><label>충돌 엇갈림(임팩트 파라미터)</label><input type="range" id="of" min="0" max="0.8" step="0.1" value="0.3"><output id="ofo">0.3</output></div>');
      E.bind('#of','input',function(e){ self.s.off=+e.target.value; self.reset(); document.getElementById('ofo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    reset:function(){ var s=this.s, w=s.w; w.reset();
      s.A=w.add({x:1,y:5,m:1,r:0.45,vx:3,vy:0,color:GRN});
      s.B=w.add({x:6,y:5+s.off,m:1,r:0.45,vx:0,vy:0,color:ORA}); s.tA=[]; s.tB=[]; },
    tap:function(E){ this.reset(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, A=s.A, B=s.B, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); w.collide();
      if(A.x>11||B.x>11||A.x<-1||B.x<-1) this.reset();
      var ox=W*0.08, sc=Math.min(W*0.075,H*0.075), oy=H*0.84, v=PhysLab.view(ox,oy,sc); s.view=v;
      s.tA.push([A.x,A.y]); s.tB.push([B.x,B.y]); if(s.tA.length>120){s.tA.shift();s.tB.shift();}
      [['rgba(95,214,168,0.4)',s.tA],['rgba(255,178,122,0.4)',s.tB]].forEach(function(t){ ctx.strokeStyle=t[0]; ctx.lineWidth=1.5; ctx.beginPath(); t[1].forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke(); });
      [[A,'A'],[B,'B']].forEach(function(bl){ var b=bl[0]; ctx.fillStyle=b.color; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),b.r*sc,0,7); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='#10141a'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(bl[1],v.X(b.x),v.Y(b.y)); ctx.textBaseline='alphabetic';
        ctx.strokeStyle=b.color; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(b.x),v.Y(b.y)); ctx.lineTo(v.X(b.x)+b.vx*sc*0.4,v.Y(b.y)-b.vy*sc*0.4); ctx.stroke();
        var sp=Math.hypot(b.vx,b.vy); if(sp>0.05){ ctx.fillStyle=b.color; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('v='+sp.toFixed(1), v.X(b.x)+b.vx*sc*0.4+4, v.Y(b.y)-b.vy*sc*0.4); } });
      var px=A.m*A.vx+B.m*B.vx, py=A.m*A.vy+B.m*B.vy;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('총 운동량 p=(Σpₓ, Σpᵧ)=('+px.toFixed(2)+', '+py.toFixed(2)+') kg·m/s — 벡터로 보존', W*0.1, H*0.20);
      E.tapHint(W/2, H*0.93, '엇갈림을 바꿔 — 빗맞으면 V자로 갈라집니다', true);
      E.big('2차원 충돌 — 운동량은 벡터로 보존', '정면이 아니라 빗맞으면 두 공이 V자로 <b>갈라집니다</b>. 이때도 운동량은 <b>좌우(x)·위아래(y) 성분이 서로 간섭 없이 각각 따로 보존</b>됩니다(벡터 보존). 같은 질량끼리 완전탄성으로 빗맞으면 두 공은 충돌 뒤 늘 <b>정확히 직각으로</b> 흩어집니다 — 당구 고수가 몸으로 아는 각도죠! 빗맞는 정도(임팩트 파라미터)가 클수록 더 비스듬히 갈라집니다. 입자 충돌 실험도, 기체 분자가 부딪치는 것도 같은 벡터 보존입니다.'); }
  },

  // ─── 심화: 로켓 추진 (변질량) ───
  { id:'phys4_05_rocket', branchOf:'phys4_05', ord:1,
    enter:function(E){ var self=this; this.s={ve:3,t:0,m:5,v:0,y:0,hist:[]};
      E.controls('<div class="ctrl"><label>분사 속도 ve</label><input type="range" id="ve" min="1" max="6" step="0.5" value="3"><output id="veo">3.0</output></div>');
      E.bind('#ve','input',function(e){ self.s.ve=+e.target.value; self.reset(); document.getElementById('veo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      this.reset(); E.setOn([]); },
    reset:function(){ var s=this.s; s.t=0; s.m=5; s.v=0; s.y=0; s.hist=[]; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, burn=0.6, m0=5, mdry=1.5;
      // 연료 소모 + 추력: dv = ve·(−dm/m), 엔진식 적분
      if(!E.frozen && s.m>mdry){ var dm=burn*(1/60); var dv=s.ve*(dm/s.m); s.v+=dv; s.m-=dm; }
      if(!E.frozen){ s.y+=s.v*(1/60); s.t+=1/60; if(s.y>8){ this.reset(); } }
      if(!E.frozen){ s.hist.push(s.v); if(s.hist.length>200)s.hist.shift(); }
      var cx=W*0.26, botY=H*0.84, topY=H*0.14, py=botY-(s.y/8)*(botY-topY);
      // 로켓
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(cx,py-22); ctx.lineTo(cx-9,py+10); ctx.lineTo(cx+9,py+10); ctx.closePath(); ctx.fill();
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('v='+s.v.toFixed(2)+' m/s', cx+14, py-6);
      ctx.fillStyle=DIM; ctx.fillText('m='+s.m.toFixed(2)+' kg', cx+14, py+8);
      // 분사 화염(연료 남았을 때)
      if(s.m>mdry){ ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(cx-6,py+10); ctx.lineTo(cx+6,py+10); ctx.lineTo(cx,py+10+12+s.ve*3); ctx.closePath(); ctx.fill(); }
      // 연료 게이지
      var frac=(s.m-mdry)/(m0-mdry); ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(W*0.42,topY,24,botY-topY);
      ctx.fillStyle=PNK; ctx.fillRect(W*0.42,botY-frac*(botY-topY),24,frac*(botY-topY)); ctx.fillStyle=PNK; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('연료', W*0.42+12, botY+16);
      // v-t 그래프
      var gx0=W*0.56, gx1=W*0.93, gy0=H*0.78, gh=H*0.5, vmax=6*Math.log(m0/mdry)*1.1;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('v',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      var dvmax=s.ve*Math.log(m0/mdry);
      // Δv_max 점근선(치올코프스키 최종 속도)
      var yMax=gy0-(dvmax/vmax)*gh; ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(gx0,yMax); ctx.lineTo(gx1,yMax); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('Δv_max='+dvmax.toFixed(2), gx0+4, yMax-4);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); s.hist.forEach(function(vv,i){ var x=gx0+(gx1-gx0)*i/200, y=gy0-(vv/vmax)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      E.tapHint(W/2, H*0.92, '분사 속도를 바꿔 최종 속도를 보세요', true);
      E.big('로켓 — Δv = ve·ln(m₀/m) (현재 v='+s.v.toFixed(2)+', 최대 '+dvmax.toFixed(2)+')', '로켓은 연료를 뒤로 세게 뿜은 운동량만큼 앞으로 운동량을 얻습니다(반동의 연속). 게다가 연료를 태울수록 자기가 가벼워져, 같은 힘으로도 갈수록 더 잘 가속되죠. 최종 속도 변화는 <b>치올코프스키 로켓 방정식 Δv = ve·ln(m₀/m)</b> — 분사 속도 ve가 빠르고, 연료질량비(m₀/m_dry)가 클수록 멀리 갑니다. 다단 로켓이 빈 연료통을 떼어 버리는 이유가 바로 이것입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
