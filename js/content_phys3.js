/* 물리학 제3장 일·에너지 — PhysLab 엔진 위에서 에너지를 실시간 계산
   일 W=∫F·dx, 운동E ½mv², 위치E mgh 를 매 프레임 시뮬 상태에서 산출(공식 베끼기 X).
   일-에너지 정리(W=ΔKE)·역학적 에너지 보존·마찰 소산·일률을 엔진으로 '증명'.
   텍스트=content/phys3.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', GREF=9.8;

  // ── 에너지 막대 헬퍼: items=[{label,val,color}] 를 maxv 기준으로 세로 막대 ──
  function ebars(E, x0, items, maxv){ var ctx=E.ctx, H=E.H, baseY=H*0.74, bh=H*0.42, bw=46, gap=26;
    ctx.textAlign='center';
    ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.fillText('에너지 (J)', x0+((items.length*(bw+gap))-gap)/2, baseY-bh-22);
    items.forEach(function(it,i){ var x=x0+i*(bw+gap), h=Math.max(0,Math.min(1,it.val/maxv))*bh;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,bw,bh);
      ctx.fillStyle=it.color; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-h,bw,h); ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.strokeRect(x,baseY-bh,bw,bh);
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.fillText(it.val.toFixed(1), x+bw/2, baseY-h-6);
      ctx.fillStyle=it.color; ctx.font='12px sans-serif'; ctx.fillText(it.label, x+bw/2, baseY+18);
    });
  }
  function track(E,v,x0,x1){ var ctx=E.ctx; ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(v.X(x0),v.Y(0)+20); ctx.lineTo(v.X(x1),v.Y(0)+20); ctx.stroke(); }
  function block(E,v,b,m,col){ var ctx=E.ctx, px=v.X(b.x), base=v.Y(0)+20, sz=14+m*4;
    ctx.fillStyle=col; ctx.globalAlpha=0.25; ctx.fillRect(px-sz/2,base-sz,sz,sz); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(px-sz/2,base-sz,sz,sz);
    ctx.fillStyle=col; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(m+' kg', px, base-sz/2+4);
    return {px:px, top:base-sz/2, sz:sz}; }
  function farrow(E,fromX,y,len,col,label){ var ctx=E.ctx; if(Math.abs(len)<2)return;
    var dir=len>0?1:-1, L=Math.abs(len); ctx.strokeStyle=col; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(fromX,y); ctx.lineTo(fromX+len,y); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(fromX+len,y); ctx.lineTo(fromX+len-9*dir,y-5); ctx.lineTo(fromX+len-9*dir,y+5); ctx.fill();
    ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, fromX+len/2, y-10); }

  var scenes=[

  // ══════════ 3.1 일 W = F·d — 엔진이 미는 거리를 적분 ══════════
  { id:'phys3_01',
    enter:function(E){ var self=this; this.s={F:8};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0,y:0,m:2,r:0.3,color:GRN}); this.s.b=b;
      w.force(function(){ b.fx += self.s.F; });
      E.controls('<div class="ctrl"><label>힘 F (N)</label><input type="range" id="ff" min="0" max="16" step="1" value="8"><output id="ffo">8</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.b.x=0; this.s.b.vx=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H;
      w.step(1/60,6); if(b.x>10){ b.x=0; b.vx=0; }
      var v=PhysLab.view(W*0.10, H*0.50, (W*0.50)/10); s.view=v;
      track(E,v,0,10); var bk=block(E,v,b,2,GRN);
      farrow(E, bk.px+bk.sz/2, bk.top, s.F*7, ORA, 'F='+s.F+' N');
      // 변위 표시(시작→현재)
      var ctx=E.ctx; ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)+38); ctx.lineTo(v.X(b.x),v.Y(0)+38); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('d = '+b.x.toFixed(2)+' m', (v.X(0)+v.X(b.x))/2, v.Y(0)+54);
      var Wk=s.F*b.x;   // 일 = 힘 × (엔진이 만든 변위)
      ebars(E, W*0.70, [{label:'일 W',val:Wk,color:ORA}], 160);
      E.tapHint(W/2, H*0.90, '화면 탭 = 처음으로', true);
      E.big('일 W = F·d = '+Wk.toFixed(1)+' J', '일 = 힘 × 그 방향으로 움직인 거리. 힘과 이동이 함께 있어야 일이 생깁니다. 1 J = 1 N·m. 힘이 0이면 아무리 멀리 굴러가도 일은 0!'); }
  },

  // ══════════ 3.2 일-에너지 정리 W = ΔKE — 엔진으로 수치 증명 ══════════
  { id:'phys3_02',
    enter:function(E){ var self=this; this.s={F:8,m:2};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0,y:0,m:2,r:0.3,color:GRN}); this.s.b=b;
      w.force(function(){ b.fx += self.s.F; });
      E.controls('<div class="ctrl"><label>힘 F (N)</label><input type="range" id="ff" min="2" max="16" step="1" value="8"><output id="ffo">8</output>'
        +'<label style="margin-left:14px">질량 m (kg)</label><input type="range" id="mm" min="1" max="5" step="1" value="2"><output id="mmo">2</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=e.target.value; E.blip(300,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.b.x=0; this.s.b.vx=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H;
      b.m=s.m; w.step(1/60,6); if(b.x>10){ b.x=0; b.vx=0; }
      var v=PhysLab.view(W*0.10, H*0.50, (W*0.50)/10); s.view=v;
      track(E,v,0,10); var bk=block(E,v,b,s.m,GRN);
      farrow(E, bk.px+bk.sz/2, bk.top, s.F*7, ORA, 'F = '+s.F+' N');
      var Wk=s.F*b.x, KE=0.5*b.m*b.vx*b.vx;   // 둘 다 시뮬 상태에서 계산
      ebars(E, W*0.66, [{label:'일 W',val:Wk,color:ORA},{label:'운동E',val:KE,color:GRN}], 160);
      E.tapHint(W/2, H*0.90, '화면 탭 = 처음으로', true);
      E.big('W = '+Wk.toFixed(1)+' J  =  ΔKE = ½mv² = '+KE.toFixed(1)+' J', '일-에너지 정리: 알짜힘이 한 일은 운동에너지 변화와 같다. 두 막대가 늘 같은 높이 — 내가 넣어준 일만큼 정확히 빨라집니다. 정지에서 출발했으므로 ΔKE = ½mv².'); }
  },

  // ══════════ 3.3 역학적 에너지 보존 — 떨어지는 공의 PE↔KE (드래그) ══════════
  { id:'phys3_03',
    enter:function(E){ var self=this; this.s={grab:false,E0:null};
      var w=PhysLab.world({g:9.8, floor:0.35, rest:1, linDrag:0}); this.s.w=w;   // rest=1 완전탄성(보존)
      var b=w.add({x:5,y:6,m:1,r:0.35,color:GRN}); this.s.b=b;
      E.setOn([]); },
    down:function(E,cx,cy){ var s=this.s, v=s.view; if(!v)return; var b=s.b, wy=v.wy(cy), wx=v.wx(cx);
      if(Math.hypot(b.x-wx,b.y-wy)<b.r+0.6){ b.held=true; b.vx=0; b.vy=0; s.grab=true; }   // 공 근처=잡기
      else { b.x=5; b.y=6; b.vx=0; b.vy=0; s.E0=null; E.blip(360,0.12); } },                // 빈 곳=초기화
    move:function(E,cx,cy){ var s=this.s; if(s.grab&&s.view){ var b=s.b, wy=s.view.wy(cy); b.y=Math.max(b.r+0.4,Math.min(9,wy)); b.vy=0; b.vx=0; } },
    up:function(E){ var s=this.s; if(s.grab){ s.b.held=false; s.grab=false; s.E0=null; } },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      var v=PhysLab.view(W*0.12, H*0.82, (H*0.62)/10); s.view=v;
      if(!s.grab) w.step(1/60,6);
      var floor=0.35, h=b.y-floor;                     // 바닥 위 높이
      var PE=b.m*GREF*h, KE=0.5*b.m*(b.vx*b.vx+b.vy*b.vy), tot=PE+KE;
      if(s.E0==null) s.E0=tot;
      // 바닥 + 기둥
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(v.X(2),v.Y(floor)); ctx.lineTo(v.X(8),v.Y(floor)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('바닥 (h = 0)', v.X(5), v.Y(floor)+16);
      // 높이 표시선
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(v.X(b.x),v.Y(floor)); ctx.lineTo(v.X(b.x),v.Y(b.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('h='+h.toFixed(2)+' m', v.X(b.x)+8, (v.Y(floor)+v.Y(b.y))/2);
      // 공
      var px=v.X(b.x), py=v.Y(b.y), pr=b.r*v.s;
      ctx.fillStyle=GRN; ctx.globalAlpha=0.85; ctx.beginPath(); ctx.arc(px,py,pr,0,7); ctx.fill(); ctx.globalAlpha=1;
      if(b.held){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,pr+3,0,7); ctx.stroke(); }
      ebars(E, W*0.60, [{label:'위치E',val:PE,color:BLU},{label:'운동E',val:KE,color:GRN},{label:'합계',val:tot,color:ORA}], Math.max(s.E0*1.15,1));
      E.tapHint(W/2, H*0.93, '공을 끌어 높이 조절 → 놓으면 낙하 · 빈 곳 탭=초기화', true);
      E.big('PE + KE = '+tot.toFixed(1)+' J  (일정)', '역학적 에너지 보존: 위치E(mgh)와 운동E(½mv²)는 서로 바뀌지만 마찰이 없으면 합은 일정합니다. 떨어질수록 파란 막대→초록 막대로 옮겨가고 주황(합계)은 그대로. 완전탄성(e=1)이라 영원히 같은 높이로 튐.'); }
  },

  // ══════════ 3.4 마찰과 에너지 소산 — KE → 열(비보존력) ══════════
  { id:'phys3_04',
    enter:function(E){ var self=this; this.s={mu:0.3,heat:0,v0:7};
      var w=PhysLab.world({g:0}); this.s.w=w;            // 수평면: 수직운동 없음
      var b=w.add({x:0.5,y:0,m:2,r:0.3,vx:7,color:ORA}); this.s.b=b;
      w.force(function(){ var sp=Math.abs(b.vx); if(sp>1e-4){ b.fx -= self.s.mu*b.m*GREF*(b.vx>0?1:-1); } });
      E.controls('<div class="ctrl"><label>마찰계수 μ</label><input type="range" id="mu" min="0.05" max="0.8" step="0.05" value="0.3"><output id="muo">0.30</output></div>');
      E.bind('#mu','input',function(e){ self.s.mu=+e.target.value; document.getElementById('muo').textContent=(+e.target.value).toFixed(2); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ var b=this.s.b; b.x=0.5; b.vx=this.s.v0; this.s.heat=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      var px0=b.x; w.step(1/60,6);
      if(Math.abs(b.vx)<0.04){ b.vx=0; } else { s.heat += s.mu*b.m*GREF*Math.abs(b.x-px0); }  // 열 = 마찰력 × 거리
      if(b.x>9.6){ b.x=9.6; b.vx=0; }
      var v=PhysLab.view(W*0.10, H*0.52, (W*0.52)/10); s.view=v;
      // 거친 바닥(빗금)
      track(E,v,0,10); ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      for(var gx=0;gx<=10;gx+=0.5){ ctx.beginPath(); ctx.moveTo(v.X(gx),v.Y(0)+20); ctx.lineTo(v.X(gx)-6,v.Y(0)+28); ctx.stroke(); }
      var bk=block(E,v,b,2,ORA);
      var ffric=s.mu*b.m*GREF;
      if(Math.abs(b.vx)>0.04) farrow(E, bk.px-bk.sz/2, bk.top, -ffric*2.2, PNK, 'f = μmg = '+ffric.toFixed(1)+' N');
      E.ctx.fillStyle=DIM; E.ctx.font='11px sans-serif'; E.ctx.textAlign='left'; E.ctx.fillText('거친 바닥 (μ = '+s.mu.toFixed(2)+')', v.X(0), v.Y(0)+40);
      var KE=0.5*b.m*b.vx*b.vx, tot=KE+s.heat;
      ebars(E, W*0.66, [{label:'운동E',val:KE,color:GRN},{label:'열',val:s.heat,color:PNK},{label:'합계',val:tot,color:ORA}], 0.5*2*7*7*1.1);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 밀기', true);
      E.big('운동E '+KE.toFixed(1)+' J  →  열 '+s.heat.toFixed(1)+' J', '마찰은 비보존력: 운동에너지를 열로 바꿉니다. 초록(운동E)이 줄며 분홍(열)으로 옮겨가고 — 합계(주황)는 보존! 에너지는 사라지지 않고 형태만 바뀝니다. μ가 클수록 빨리 멈춥니다.'); }
  },

  // ══════════ 3.5 일률(Power) P = F·v — 엔진 속도로 실시간 ══════════
  { id:'phys3_05',
    enter:function(E){ var self=this; this.s={F:8};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0,y:0,m:2,r:0.3,color:GRN}); this.s.b=b;
      w.force(function(){ b.fx += self.s.F; });
      E.controls('<div class="ctrl"><label>힘 F (N)</label><input type="range" id="ff" min="2" max="16" step="1" value="8"><output id="ffo">8</output></div>');
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(380,0.07); });
      E.setOn([]); this.s.hist=[]; },
    tap:function(E){ var b=this.s.b; b.x=0; b.vx=0; this.s.w.t=0; this.s.hist=[]; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); if(b.x>10){ b.x=0; b.vx=0; w.t=0; s.hist=[]; }
      var P=s.F*b.vx, avg=w.t>0.05?(s.F*b.x)/w.t:0;       // 순간일률 F·v, 평균 W/t
      s.hist.push(P); if(s.hist.length>120) s.hist.shift();
      var v=PhysLab.view(W*0.10, H*0.34, (W*0.50)/10); s.view=v;
      track(E,v,0,10); var bk=block(E,v,b,2,GRN);
      farrow(E, bk.px+bk.sz/2, bk.top, s.F*7, ORA, 'F = '+s.F+' N');
      // v 화살표(속도)
      farrow(E, bk.px, bk.top+26, b.vx*9, BLU, 'v = '+b.vx.toFixed(1)+' m/s');
      // P-t 그래프(아래)
      var gx0=W*0.12, gx1=W*0.88, gy0=H*0.86, gh=H*0.32, Pmax=16*6*1.05;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('일률 P (W)', gx0+58, gy0-gh+8); ctx.textAlign='left'; ctx.fillText('시간 t', gx1-30, gy0+14);
      ctx.strokeStyle=PNK; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(p,i){ var x=gx0+(gx1-gx0)*i/120, y=gy0-Math.min(1,p/Pmax)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      ctx.fillStyle=PNK; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('P = F·v', gx1-60, gy0-gh+8);
      E.tapHint(W/2, H*0.955, '화면 탭 = 처음으로', true);
      E.big('순간 일률 P = F·v = '+P.toFixed(1)+' W', '일률 = 단위시간당 한 일 = 힘 × 속도. 속도가 빨라질수록 같은 힘이라도 일률이 커집니다(분홍 곡선↑). 평균 일률 W/t = '+avg.toFixed(1)+' W. 1 W = 1 J/s.'); }
  },

  // ─── 심화: 용수철 발사 (탄성PE→운동E→포물선) ───
  { id:'phys3_01_spring', branchOf:'phys3_01', ord:1,
    enter:function(E){ var self=this; this.s={x:1.5,ang:45};
      var w=PhysLab.world({g:9.8,floor:0}); this.s.w=w; this.s.b=null; this.s.trail=[]; this.s.k=20; this.s.m=1;
      E.controls('<div class="ctrl"><label>압축량 x</label><input type="range" id="xx" min="0.5" max="2.5" step="0.1" value="1.5"><output id="xxo">1.5</output>'
        +'<label style="margin-left:14px">발사각 (도)</label><input type="range" id="ag" min="20" max="80" step="5" value="45"><output id="ago">45</output></div>');
      E.bind('#xx','input',function(e){ self.s.x=+e.target.value; self.launch(); document.getElementById('xxo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; self.launch(); document.getElementById('ago').textContent=e.target.value; E.blip(380,0.07); });
      this.launch(); E.setOn([]); },
    launch:function(){ var s=this.s; var v=Math.sqrt(s.k*s.x*s.x/s.m), th=s.ang*Math.PI/180;   // ½kx²=½mv² → v=√(k/m)·x
      s.w.reset(); var b=s.w.add({x:0.5,y:0.3,m:s.m,r:0.2,vx:v*Math.cos(th),vy:v*Math.sin(th),color:GRN}); s.b=b; s.trail=[]; s.v0=v; },
    tap:function(E){ this.launch(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); if(b.y<0.2 && b.vy<0){ b.y=0.2; b.vy=0; b.vx=0; }
      var ox=W*0.10, oy=H*0.86, sc=Math.min(W*0.07,H*0.07), v=PhysLab.view(ox,oy,sc); s.view=v;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(0)); ctx.lineTo(v.X(12),v.Y(0)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('지면', v.X(12), v.Y(0)+15);
      // 용수철(왼쪽 아래)
      ctx.strokeStyle=DIM; ctx.lineWidth=2; var sx=v.X(0); for(var i=0;i<6;i++){ ctx.beginPath(); ctx.moveTo(sx+i*4,v.Y(0)-4); ctx.lineTo(sx+i*4+2,v.Y(0)-12); ctx.stroke(); }
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('v₀ = '+s.v0.toFixed(1)+' m/s, θ = '+s.ang+'°', sx, v.Y(0)-20);
      s.trail.push([b.x,b.y]); if(s.trail.length>200)s.trail.shift();
      ctx.strokeStyle='rgba(95,214,168,0.45)'; ctx.lineWidth=1.5; ctx.beginPath(); s.trail.forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(v.X(b.x),v.Y(b.y),7,0,7); ctx.fill();
      var PEs=0.5*s.k*s.x*s.x, range=s.v0*s.v0*Math.sin(2*s.ang*Math.PI/180)/9.8;
      E.tapHint(W/2, H*0.93, '압축량·발사각을 바꿔 사거리를 보세요', true);
      E.big('탄성PE ½kx² = '+PEs.toFixed(1)+' J → 운동E → 사거리 '+range.toFixed(1)+' m', '용수철에 저장된 탄성위치에너지 ½kx²가 발사 순간 모두 운동에너지 ½mv²로 바뀝니다(에너지 보존) → 발사 속력 v=√(k/m)·x. 그 뒤는 1장의 포물선 운동! 더 많이 압축할수록(x↑) 빠르게 나가고, 45°에서 사거리가 최대. 새총·석궁·핀볼·스프링 발사대가 모두 이 변환(탄성E→운동E→포물선)입니다.'); }
  },

  // ─── 심화: 롤러코스터 (언덕마다 속도 = 에너지 보존) ───
  { id:'phys3_03_coaster', branchOf:'phys3_03', ord:1,
    enter:function(E){ this.s={x:0,H0:5}; E.setOn([]);
      var self=this; E.controls('<div class="ctrl"><label>출발 높이 H₀</label><input type="range" id="hh" min="3" max="6" step="0.5" value="5"><output id="hho">5.0</output></div>');
      E.bind('#hh','input',function(e){ self.s.H0=+e.target.value; self.s.x=0; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); }); },
    track:function(x){ return 1 + 2.0*Math.pow(Math.cos(x*0.55),2)*Math.exp(-x*0.12); },  // 점점 낮아지는 언덕들
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8;
      var ox=W*0.10, oy=H*0.82, sc=Math.min(W*0.072,H*0.10), v=PhysLab.view(ox,oy,sc); s.view=v;
      var yhere=this.track(s.x), speed=Math.sqrt(Math.max(0,2*g*(s.H0-yhere)));   // 에너지 보존 v=√(2g(H0−y))
      s.x += speed*(1/60)*0.5; if(s.x>11 || this.track(s.x)>s.H0){ s.x=0; }
      // 트랙
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=120;i++){ var xu=i/120*11, X=v.X(xu), Y=v.Y(this.track(xu)); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // 출발 높이선
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(s.H0)); ctx.lineTo(v.X(11),v.Y(s.H0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('출발 높이 H₀(에너지 한계)', v.X(0)+4, v.Y(s.H0)-4);
      // 차
      var cx=v.X(s.x), cy=v.Y(yhere); ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,cy-6,7,0,7); ctx.fill();
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('v = '+speed.toFixed(1)+' m/s', cx, cy-18);
      // 에너지 막대
      var PE=g*yhere, KE=0.5*speed*speed, tot=PE+KE;
      var bx=W*0.74, baseY=H*0.74, bh=H*0.4, mx=g*s.H0*1.1;
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('단위질량당 에너지 (J/kg)', bx+57, baseY-bh-12);
      [['위치E',PE,BLU],['운동E',KE,GRN],['합',tot,ORA]].forEach(function(it,i){ var x=bx+i*52, hh=Math.min(1,it[1]/mx)*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,38,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,38,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(1),x+19,baseY-hh-5); ctx.fillStyle=it[2]; ctx.fillText(it[0],x+19,baseY+16); });
      E.tapHint(W/2, H*0.92, '출발 높이를 바꿔 보세요 — 더 높은 언덕은 못 넘음', true);
      E.big('롤러코스터 — 높이마다 v = √(2g(H₀−y)) = '+speed.toFixed(1)+' m/s', '동력 없는 롤러코스터는 에너지 보존으로 달립니다. 낮은 곳(골)에서 빠르고(운동E 최대), 높은 언덕에서 느려집니다(위치E로 전환). 어떤 언덕도 <b>출발 높이 H₀보다 높으면 못 넘습니다</b> — 에너지가 부족하니까(마찰 없을 때). 막대에서 위치E(파랑)↔운동E(초록)가 주고받지만 합(주황)은 일정. 첫 언덕이 항상 가장 높은 이유.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
