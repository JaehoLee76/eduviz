/* 물리학 제3장 일·에너지 — PhysLab 엔진 위에서 에너지를 실시간 계산
   일 W=∫F·dx, 운동E ½mv², 위치E mgh 를 매 프레임 시뮬 상태에서 산출(공식 베끼기 X).
   일-에너지 정리(W=ΔKE)·역학적 에너지 보존·마찰 소산·일률을 엔진으로 '증명'.
   텍스트=content/phys3.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', GREF=9.8;

  // ── 에너지 막대 헬퍼: items=[{label,val,color}] 를 maxv 기준으로 세로 막대 ──
  function ebars(E, x0, items, maxv){ var ctx=E.ctx, H=E.H, baseY=H*0.74, bh=H*0.42, bw=46, gap=26;
    ctx.textAlign='center';
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
      E.big('일 W = F·d = '+Wk.toFixed(1)+' J', '일 = 힘 × 그 방향으로 움직인 거리. d는 엔진이 F=ma로 적분해 만든 실제 변위입니다. 1 J = 1 N·m. 힘이 0이면 아무리 움직여도 일은 0!'); }
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
      farrow(E, bk.px+bk.sz/2, bk.top, s.F*7, ORA, 'F');
      var Wk=s.F*b.x, KE=0.5*b.m*b.vx*b.vx;   // 둘 다 시뮬 상태에서 계산
      ebars(E, W*0.66, [{label:'일 W',val:Wk,color:ORA},{label:'운동E',val:KE,color:GRN}], 160);
      E.tapHint(W/2, H*0.90, '화면 탭 = 처음으로', true);
      E.big('W = '+Wk.toFixed(1)+' J  =  ΔKE = ½mv² = '+KE.toFixed(1)+' J', '일-에너지 정리: 알짜힘이 한 일은 운동에너지 변화와 같다. 두 막대가 늘 같은 높이 — 엔진이 적분으로 만든 v로 검산한 것(공식 베끼기 아님). 정지에서 출발했으므로 ΔKE = ½mv².'); }
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
      if(Math.abs(b.vx)>0.04) farrow(E, bk.px-bk.sz/2, bk.top, -(s.mu*b.m*GREF)*2.2, PNK, '마찰');
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
      farrow(E, bk.px+bk.sz/2, bk.top, s.F*7, ORA, 'F');
      // v 화살표(속도)
      farrow(E, bk.px, bk.top+26, b.vx*9, BLU, 'v='+b.vx.toFixed(1));
      // P-t 그래프(아래)
      var gx0=W*0.12, gx1=W*0.88, gy0=H*0.86, gh=H*0.32, Pmax=16*6*1.05;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('P', gx0-6, gy0-gh+8); ctx.textAlign='left'; ctx.fillText('t', gx1-8, gy0+14);
      ctx.strokeStyle=PNK; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(p,i){ var x=gx0+(gx1-gx0)*i/120, y=gy0-Math.min(1,p/Pmax)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      E.tapHint(W/2, H*0.955, '화면 탭 = 처음으로', true);
      E.big('순간 일률 P = F·v = '+P.toFixed(1)+' W', '일률 = 단위시간당 한 일 = 힘 × 속도. 속도가 빨라질수록 같은 힘이라도 일률이 커집니다(분홍 곡선↑). 평균 일률 W/t = '+avg.toFixed(1)+' W. 1 W = 1 J/s.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
