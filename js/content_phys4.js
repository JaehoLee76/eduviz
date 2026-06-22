/* 물리학 제4장 운동량 — PhysLab 충돌 엔진으로 운동량 보존을 '증명'
   p=mv, 충격량 J=Δp, 충돌 전후 운동량 보존(엔진 collide), 탄성/비탄성, 반동.
   골든룰: 표시 수치는 전부 엔진 상태(질량·속도)에서 실시간 계산.
   텍스트=content/phys4.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  function ball(E,v,b,label){ var ctx=E.ctx, px=v.X(b.x), py=v.Y(b.y), pr=b.r*v.s;
    ctx.fillStyle=b.color; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(px,py,pr,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle='#10141a'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(label, px, py); ctx.textBaseline='alphabetic';
    ctx.fillStyle=b.color; ctx.font='11px sans-serif'; ctx.fillText(b.m.toFixed(1)+' kg', px, py-pr-6); return {px:px,py:py,pr:pr}; }
  // 부호 있는 수평 화살표(운동량·속도): cx에서 시작, len(px) 방향
  function harrow(E,cx,cy,len,col,label){ var ctx=E.ctx; if(Math.abs(len)<3){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy,3,0,7); ctx.fill(); return; }
    var dir=len>0?1:-1; ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+len,cy); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(cx+len,cy); ctx.lineTo(cx+len-9*dir,cy-5); ctx.lineTo(cx+len-9*dir,cy+5); ctx.fill();
    if(label){ ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, cx+len/2, cy-9); } }

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
      E.big('운동량 p = m·v = '+p.toFixed(1)+' kg·m/s', '운동량은 "운동의 양" — 질량 × 속도. 무거울수록, 빠를수록 큽니다. 같은 속도라도 트럭(큰 m)은 자전거보다 운동량이 훨씬 커서 멈추기 어렵죠. 벡터라서 방향(부호)도 가집니다.'); }
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
      E.big('충격량 J = F·t = '+J.toFixed(1)+' = Δp = mΔv = '+dp.toFixed(1), '충격량 정리: 힘 × 작용시간 = 운동량 변화. 두 막대가 늘 같음 — 엔진의 v로 검산한 결과(공식 베끼기 아님). 같은 운동량 변화라도 시간을 길게 하면(에어백) 힘이 작아집니다.'); }
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
      var ka=ball(E,v,A,'A'), kb=ball(E,v,B,'B');
      harrow(E, ka.px, ka.py-ka.pr-16, A.vx*16, ORA, '');
      harrow(E, kb.px, kb.py-kb.pr-16, B.vx*16, ORA, '');
      var p1=A.m*A.vx, p2=B.m*B.vx, ptot=p1+p2, KE=0.5*A.m*A.vx*A.vx+0.5*B.m*B.vx*B.vx;
      // 총 운동량 화살표(중앙 하단)
      var cy=H*0.74; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('총 운동량', W*0.34, cy+4);
      harrow(E, W*0.36, cy, ptot*18, GRN, '');
      ctx.fillStyle=GRN; ctx.textAlign='left'; ctx.fillText(ptot.toFixed(2)+' kg·m/s', W*0.36+Math.abs(ptot*18)+14, cy+4);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 충돌', true);
      E.big('총 운동량 = '+ptot.toFixed(2)+' kg·m/s  (충돌해도 일정)', '운동량 보존: 외력이 없으면 충돌 전·중·후 총 운동량(p₁+p₂)이 변하지 않습니다. A가 B에 준 충격량 = B가 A에 준 충격량(작용-반작용). 완전탄성이라 운동E도 보존(현재 '+KE.toFixed(1)+' J). m₂를 바꿔 보세요.'); }
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
      harrow(E, ka.px, ka.py-ka.pr-16, A.vx*16, ORA, '');
      harrow(E, kb.px, kb.py-kb.pr-16, B.vx*16, ORA, '');
      var ptot=A.m*A.vx+B.m*B.vx, KE=0.5*A.m*A.vx*A.vx+0.5*B.m*B.vx*B.vx;
      var baseY=H*0.80, bh=H*0.32, mx=Math.max(Math.abs(ptot),s.KE0,1)*1.15;
      [['총 운동량',Math.abs(ptot),GRN,ptot],['총 운동E',KE,BLU,KE]].forEach(function(it,i){ var x=W*0.64+i*78, hh=it[1]/mx*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,52,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,52,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[3].toFixed(1), x+26, baseY-hh-6);
        ctx.fillStyle=it[2]; ctx.fillText(it[0], x+26, baseY+18); });
      // KE0 기준선
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.setLineDash([4,3]); var y0=baseY-s.KE0/mx*bh; ctx.beginPath(); ctx.moveTo(W*0.64+78,y0); ctx.lineTo(W*0.64+78+52,y0); ctx.stroke(); ctx.setLineDash([]);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 충돌  (e=1 탄성, e=0 완전비탄성)', true);
      var lost=s.KE0-KE;
      E.big('운동량 보존 · 운동E '+(s.e>=1?'보존':'손실 '+lost.toFixed(1)+' J'), '어떤 충돌이든 총 운동량(초록)은 항상 보존됩니다. 하지만 운동에너지(파랑)는 e<1이면 열·소리·변형으로 손실 — e=1만 완전탄성(운동E도 보존). e=0이면 두 공이 붙어 함께 움직입니다(완전비탄성). 점선=충돌 전 운동E.'); }
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
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(v.X(5),v.Y(0)+30); ctx.lineTo(v.X(5),v.Y(0)-60); ctx.stroke(); ctx.setLineDash([]);
      var ka=ball(E,v,A,''), kb=ball(E,v,B,'');
      harrow(E, ka.px, ka.py-ka.pr-16, A.vx*16, BLU, 'v='+A.vx.toFixed(1));
      harrow(E, kb.px, kb.py-kb.pr-16, B.vx*16, BLU, 'v='+B.vx.toFixed(1));
      var pA=A.m*A.vx, pB=B.m*B.vx, ptot=pA+pB;
      // 운동량 화살표(부호 반대, 길이 같음)
      var cy=H*0.74; harrow(E, W*0.50, cy, pA*16, GRN, 'pA='+pA.toFixed(1)); harrow(E, W*0.50, cy, pB*16, ORA, 'pB='+pB.toFixed(1));
      E.tapHint(W/2, H*0.88, '화면 탭 = 다시 발사  (질량 바꾸면 즉시 발사)', true);
      E.big('총 운동량 = pA + pB = '+ptot.toFixed(2)+' ≈ 0  (반동)', '정지(총 운동량 0)에서 서로 밀면, 두 운동량은 크기 같고 방향 반대 → 합은 여전히 0. 가벼운 쪽이 더 빠릅니다(|v|=I/m). 총·대포 반동, 로켓 추진, 헤엄의 원리. 작용-반작용(뉴턴 3법칙)의 운동량 표현.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
