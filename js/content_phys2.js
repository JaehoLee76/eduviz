/* 물리학 제2장 뉴턴의 운동 법칙 — PhysLab 엔진 위에서 실시간 시뮬레이션
   F=ma를 매 프레임 적분(닫힌 공식 베끼기 X). 학습자가 슬라이더·드래그로 조작.
   텍스트=content/phys2.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  var scenes=[

  // ══════════ 2.1 뉴턴 제2법칙 — a = F/m 실시간 적분 ══════════
  { id:'phys2_01',
    enter:function(E){ var self=this; this.s={F:6,m:2};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0,y:0,m:2,r:0.3,color:GRN}); this.s.b=b;
      w.force(function(){ b.fx += self.s.F; });           // 일정한 힘 F(오른쪽) — 엔진이 이걸 적분
      E.controls('<div class="ctrl"><label>힘 F (N)</label><input type="range" id="ff" min="0" max="16" step="1" value="6"><output id="ffo">6</output>'
        +'<label style="margin-left:14px">질량 m (kg)</label><input type="range" id="mm" min="1" max="6" step="1" value="2"><output id="mmo">2</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=e.target.value; E.blip(300,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.b.x=0; this.s.b.vx=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      b.m=s.m; w.step(1/60,6);
      if(b.x>10){ b.x=0; b.vx=0; }                         // 끝에 닿으면 재출발(반복 시연)
      var v=PhysLab.view(W*0.12, H*0.50, (W*0.76)/10); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+20); ctx.lineTo(v.X(10),v.Y(0)+20); ctx.stroke();
      var px=v.X(b.x), base=v.Y(0)+20, sz=12+s.m*5;
      ctx.fillStyle='rgba(95,214,168,0.25)'; ctx.fillRect(px-sz/2, base-sz, sz, sz);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.strokeRect(px-sz/2, base-sz, sz, sz);
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.m+' kg', px, base-sz/2+4);
      var aL=s.F*7, ay=base-sz/2;                          // 힘 화살표
      if(s.F>0){ ctx.strokeStyle=ORA; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px+sz/2, ay); ctx.lineTo(px+sz/2+aL, ay); ctx.stroke();
        ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(px+sz/2+aL,ay); ctx.lineTo(px+sz/2+aL-9,ay-5); ctx.lineTo(px+sz/2+aL-9,ay+5); ctx.fill();
        ctx.font='12px sans-serif'; ctx.fillText('F='+s.F+' N', px+sz/2+aL/2, ay-10); }
      E.tapHint(W/2, H*0.76, '화면 탭 = 처음으로', true);
      E.big('a = F/m = '+(s.F/s.m).toFixed(2)+' m/s²    v = '+b.vx.toFixed(2)+' m/s', '엔진이 매 프레임 a=F/m을 적분해 v·x를 만듭니다(공식 베끼기 아님). 같은 힘이라도 질량이 크면 천천히 가속 — 뉴턴 제2법칙.'); }
  },

  // ══════════ 2.2 실시간 물리 엔진 — 중력·충돌 모래상자 (드래그) ══════════
  { id:'phys2_02',
    enter:function(E){ var self=this; this.s={grab:null,spawn:0};
      var w=PhysLab.world({g:9.8, rest:0.72, floor:0, bounds:[0,10]}); this.s.w=w;
      [[3,6,GRN],[5,8,ORA],[7,6,BLU]].forEach(function(p){ w.add({x:p[0],y:p[1],r:0.45,m:1,color:p[2]}); });
      E.controls('<div class="ctrl"><label>중력 g</label><input type="range" id="gg" min="0" max="20" step="0.5" value="9.8"><output id="ggo">9.8</output>'
        +'<label style="margin-left:14px">반발 e</label><input type="range" id="ee" min="0" max="0.95" step="0.05" value="0.7"><output id="eeo">0.70</output></div>');
      E.bind('#gg','input',function(e){ w.g=+e.target.value; document.getElementById('ggo').textContent=(+e.target.value).toFixed(1); });
      E.bind('#ee','input',function(e){ w.rest=+e.target.value; document.getElementById('eeo').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    down:function(E,cx,cy){ var s=this.s, v=s.view, w=s.w; if(!v)return; var wx=v.wx(cx), wy=v.wy(cy), best=null, bd=1e9;
      w.bodies.forEach(function(b){ var d=Math.hypot(b.x-wx,b.y-wy); if(d<b.r+0.5 && d<bd){ bd=d; best=b; } });
      if(best){ best.held=true; best.vx=0; best.vy=0; s.grab=best; }                          // 공 근처=잡기
      else if(w.bodies.length<9){ var cols=[GRN,ORA,BLU,PNK];                                  // 빈 곳=그 자리에 공 추가
        wx=Math.max(0.5,Math.min(9.5,wx)); wy=Math.max(0.5,Math.min(9,wy)); s.spawn++;
        w.add({x:wx,y:wy,r:0.4,m:1,color:cols[w.bodies.length%4]}); E.blip(520,0.12); } },
    move:function(E,cx,cy){ var s=this.s; if(s.grab && s.view){ var v=s.view, wx=v.wx(cx), wy=v.wy(cy); s.grab.vx=(wx-s.grab.x)*12; s.grab.vy=(wy-s.grab.y)*12; s.grab.x=wx; s.grab.y=wy; } },
    up:function(E){ var s=this.s; if(s.grab){ s.grab.held=false; s.grab=null; } },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      var v=PhysLab.view(W*0.13, H*0.80, (W*0.74)/10); s.view=v;
      w.step(1/60,6); w.collide();
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)); ctx.lineTo(v.X(10),v.Y(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)); ctx.lineTo(v.X(0),v.Y(9)); ctx.moveTo(v.X(10),v.Y(0)); ctx.lineTo(v.X(10),v.Y(9)); ctx.stroke();
      w.bodies.forEach(function(b){ var px=v.X(b.x), py=v.Y(b.y), pr=b.r*v.s;
        ctx.fillStyle=b.color; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(px,py,pr,0,7); ctx.fill(); ctx.globalAlpha=1;
        if(b.held){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,pr+3,0,7); ctx.stroke(); } });
      E.tapHint(W/2, H*0.92, '공을 끌어 던지기 · 빈 곳을 탭하면 공 추가', true);
      E.big('실시간 물리 엔진 — 끌어서 던져 보세요', '중력으로 떨어지고 바닥·벽·서로 부딪혀 튑니다. 전부 F=ma 적분과 충돌(운동량 보존)의 결과 — 공식이 아니라 시뮬레이션입니다. g와 반발 e를 바꿔 보세요.'); }
  },

  // ─── 심화: 경사면과 마찰 ───
  { id:'phys2_01_incline', branchOf:'phys2_01', ord:1,
    enter:function(E){ var self=this; this.s={ang:25,mu:0.3,d:0,v:0};
      E.controls('<div class="ctrl"><label>경사각 θ (도)</label><input type="range" id="ag" min="5" max="60" step="5" value="25"><output id="ago">25</output>'
        +'<label style="margin-left:14px">마찰계수 μ</label><input type="range" id="mu" min="0" max="1" step="0.05" value="0.3"><output id="muo">0.30</output></div>');
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; self.s.d=0; self.s.v=0; document.getElementById('ago').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#mu','input',function(e){ self.s.mu=+e.target.value; self.s.d=0; self.s.v=0; document.getElementById('muo').textContent=(+e.target.value).toFixed(2); E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8, th=s.ang*Math.PI/180;
      var sliding = Math.tan(th) > s.mu, a = sliding ? g*(Math.sin(th)-s.mu*Math.cos(th)) : 0;
      s.v += a*(1/60); s.d += s.v*(1/60); if(s.d>5){ s.d=0; s.v=0; }
      // 경사면 삼각형
      var ox=W*0.16, oy=H*0.74, L=Math.min(W*0.5,H*0.55), ex=ox+L*Math.cos(th), ey=oy-L*Math.sin(th);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ex,ey); ctx.lineTo(ex,oy); ctx.closePath(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('θ='+s.ang+'°', ox+30, oy-6);
      // 블록(경사 위, 위→아래로 미끄러짐: 꼭대기에서 d만큼 내려옴)
      var f=Math.max(0,1-s.d/5), bx=ox+(ex-ox)*(0.15+0.7*(1-f)), by=oy-(oy-ey)*(0.15+0.7*(1-f));
      var nx=Math.sin(th), ny=Math.cos(th);  // 경사 수직(법선) 방향(바깥)
      ctx.save(); ctx.translate(bx,by); ctx.rotate(-th); ctx.fillStyle=ORA; ctx.globalAlpha=0.3; ctx.fillRect(-16,-28,32,28); ctx.globalAlpha=1; ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.strokeRect(-16,-28,32,28); ctx.restore();
      // 힘 화살표: 중력(아래)·경사방향성분
      function arr(dx,dy,col){ ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(bx,by-14); ctx.lineTo(bx+dx,by-14+dy); ctx.stroke(); var a2=Math.atan2(dy,dx); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(bx+dx,by-14+dy); ctx.lineTo(bx+dx-8*Math.cos(a2-0.4),by-14+dy-8*Math.sin(a2-0.4)); ctx.lineTo(bx+dx-8*Math.cos(a2+0.4),by-14+dy-8*Math.sin(a2+0.4)); ctx.fill(); }
      arr(0, g*4, PNK);  // 중력 mg
      arr(Math.cos(th)*g*Math.sin(th)*5, Math.sin(th)*g*Math.sin(th)*5, GRN);  // 경사방향 성분 g sinθ
      E.tapHint(W/2, H*0.90, '각도·마찰을 바꿔 미끄러지는 조건을 보세요', true);
      E.big((sliding?'미끄러짐 — 경사방향 가속도 a = g(sinθ−μcosθ) = '+a.toFixed(2):'정지 — 마찰이 충분(tanθ ≤ μ)'), '경사면 위 물체엔 중력을 <b>경사 방향(g sinθ)</b>과 <b>수직 방향(g cosθ)</b>으로 나눠 봅니다. 미끄러지려면 경사 성분이 최대정지마찰(μ·g cosθ)을 이겨야 하므로 조건은 <b>tanθ > μ</b>. 미끄러질 때 가속도는 a = g(sinθ − μcosθ). 각도를 올리거나 마찰을 줄이면 미끄러집니다. 스키·미끄럼틀·사면 안정성의 기본.'); }
  },

  // ─── 심화: 도르래 (애트우드 기계) ───
  { id:'phys2_02_pulley', branchOf:'phys2_02', ord:1,
    enter:function(E){ var self=this; this.s={m1:1,m2:2,y:0,v:0};
      E.controls('<div class="ctrl"><label>왼쪽 질량 m₁</label><input type="range" id="m1" min="1" max="5" step="1" value="1"><output id="m1o">1</output>'
        +'<label style="margin-left:14px">오른쪽 질량 m₂</label><input type="range" id="m2" min="1" max="5" step="1" value="2"><output id="m2o">2</output></div>');
      E.bind('#m1','input',function(e){ self.s.m1=+e.target.value; self.s.y=0; self.s.v=0; document.getElementById('m1o').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#m2','input',function(e){ self.s.m2=+e.target.value; self.s.y=0; self.s.v=0; document.getElementById('m2o').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8;
      var a=(s.m2-s.m1)*g/(s.m1+s.m2), T=2*s.m1*s.m2*g/(s.m1+s.m2);
      s.v += a*(1/60); s.y += s.v*(1/60); if(Math.abs(s.y)>2.5){ s.y=0; s.v=0; }   // m2 양수=내려감
      var cx=W*0.40, topY=H*0.22, sc=Math.min(W*0.05,H*0.07);
      // 도르래
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,topY,16,0,7); ctx.stroke();
      var lx=cx-40, rx=cx+40;
      var y1=topY+ (3 - s.y)*sc, y2=topY + (3 + s.y)*sc;   // m1 올라가고 m2 내려감(y>0)
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(lx,topY); ctx.lineTo(lx,y1); ctx.moveTo(rx,topY); ctx.lineTo(rx,y2); ctx.stroke();
      // 추
      function box(x,y,m,col){ var sz=14+m*4; ctx.fillStyle=col; ctx.globalAlpha=0.3; ctx.fillRect(x-sz/2,y,sz,sz); ctx.globalAlpha=1; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(x-sz/2,y,sz,sz); ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(m+'kg',x,y+sz/2+4); }
      box(lx,y1,s.m1,GRN); box(rx,y2,s.m2,ORA);
      E.tapHint(W/2, H*0.90, '두 질량을 바꿔 가속도·장력을 보세요', true);
      E.big('애트우드: a = (m₂−m₁)g/(m₁+m₂) = '+a.toFixed(2)+',  장력 T = '+T.toFixed(1)+' N', '도르래로 두 물체를 잇고 한 줄로 묶으면, 무거운 쪽이 내려가고 가벼운 쪽이 올라갑니다. 계 전체에 뉴턴 2법칙을 적용하면 가속도 <b>a = (m₂−m₁)g/(m₁+m₂)</b> — 질량 차가 클수록 빠르고, 같으면(m₁=m₂) 평형(a=0). 줄의 장력 T는 두 추의 무게 사이 값. 엘리베이터 평형추, 도르래 기계의 원리.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
