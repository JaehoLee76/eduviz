/* 물리학 제6장 중력 — PhysLab pointGravity(1/r²)로 실제 궤도를 적분
   만유인력 F=GMm/r², 중력가속도 g=GM/R², 궤도(원/타원), 케플러 2법칙(면적속도), 탈출속도.
   궤도는 닫힌 공식을 베끼지 않고 매 프레임 1/r² 힘을 적분해 '생성'.
   골든룰: 표시 수치는 전부 현재 상태(r,v,에너지)에서 실시간 계산.
   텍스트=content/phys6.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var GM=30, R0=4, VC=Math.sqrt(GM/R0);   // 중심중력 세기, 기준 반지름, 원궤도 속력

  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2.5;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-10*Math.cos(a-0.4),y2-10*Math.sin(a-0.4)); ctx.lineTo(x2-10*Math.cos(a+0.4),y2-10*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 6.1 만유인력 F = GMm/r² (역제곱) ══════════
  { id:'phys6_01',
    enter:function(E){ var self=this; this.s={r:3};
      E.controls('<div class="ctrl"><label>거리 r (단위)</label><input type="range" id="rr" min="1" max="6" step="0.25" value="3"><output id="rro">3.0</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(2); E.blip(500-self.s.r*40,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, Gc=1, M=10, m=1;
      var F=Gc*M*m/(s.r*s.r);
      var cy=H*0.40, x0=W*0.20, scale=(W*0.52)/6, x1=x0+s.r*scale;
      // 두 질량
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(x0,cy,20,0,7); ctx.fill();
      ctx.fillStyle='#10141a'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('M', x0, cy); ctx.textBaseline='alphabetic';
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(x1,cy,10,0,7); ctx.fill();
      ctx.fillStyle='#10141a'; ctx.textBaseline='middle'; ctx.fillText('m', x1, cy); ctx.textBaseline='alphabetic';
      // 거리선
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x0,cy+30); ctx.lineTo(x1,cy+30); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('r = '+s.r.toFixed(2), (x0+x1)/2, cy+46);
      // 인력 화살표(서로 끌림, 길이 ∝ F)
      var al=Math.min(70,F*14);
      arrow(E,x1-12,cy,x1-12-al,cy,GRN,3); arrow(E,x0+22,cy,x0+22+al,cy,GRN,3);
      // 1/r² 곡선
      var gx0=W*0.62, gx1=W*0.93, gy0=H*0.86, gh=H*0.42;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('F', gx0+4, gy0-gh+4); ctx.fillText('r', gx1-8, gy0+14);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=60;k++){ var rr=1+k/60*5, ff=Gc*M*m/(rr*rr), x=gx0+(rr-1)/5*(gx1-gx0), y=gy0-Math.min(gh,ff/10*gh*0.9); if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      var mx=gx0+(s.r-1)/5*(gx1-gx0), my=gy0-Math.min(gh,F/10*gh*0.9);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.93, '거리 r을 바꿔 1/r² 관계를 보세요', true);
      E.big('만유인력 F = G·M·m / r² = '+F.toFixed(2), '모든 질량은 서로 당깁니다 — 힘은 두 질량의 곱에 비례, 거리의 <b>제곱에 반비례</b>. r을 2배 하면 F는 ¼로 급감(역제곱 곡선). 같은 법칙이 사과를 떨어뜨리고 달을 붙잡습니다 — 뉴턴의 위대한 통합.'); }
  },

  // ══════════ 6.2 중력가속도 g = GM/R² ══════════
  { id:'phys6_02',
    enter:function(E){ var self=this; this.s={M:1,R:1};
      var w=PhysLab.world({g:9.8, floor:0, rest:0.4}); this.s.w=w;
      var b=w.add({x:0,y:5,m:1,r:0.3,color:GRN}); this.s.b=b;
      E.controls('<div class="ctrl"><label>행성 질량 M (지구=1)</label><input type="range" id="mm" min="0.1" max="5" step="0.1" value="1"><output id="mmo">1.0</output>'
        +'<label style="margin-left:14px">행성 반지름 R (지구=1)</label><input type="range" id="rr" min="0.4" max="3" step="0.1" value="1"><output id="rro">1.0</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.bind('#rr','input',function(e){ self.s.R=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.b.y=5; this.s.b.vy=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      var g=9.8*s.M/(s.R*s.R); w.g=g; w.step(1/60,6); if(b.y<=0.3&&Math.abs(b.vy)<0.3){ b.y=5; b.vy=0; }
      var topY=H*0.18, botY=H*0.74, scale=(botY-topY)/5.2, cx=W*0.42;
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-90,botY); ctx.lineTo(cx+90,botY); ctx.stroke();
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.fillRect(cx-90,botY,180,40);
      // 공
      var py=botY-b.y*scale;
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(cx,botY-5*scale); ctx.lineTo(cx,py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,py,9,0,7); ctx.fill();
      // g 막대(지구 대비)
      var bx=W*0.72, baseY=H*0.74, bh=H*0.46, ratio=g/9.8;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,40,bh);
      ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,ratio/3)*bh,40,Math.min(1,ratio/3)*bh); ctx.globalAlpha=1;
      // 지구 기준선(ratio=1)
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.setLineDash([4,3]); var ey=baseY-(1/3)*bh; ctx.beginPath(); ctx.moveTo(bx-8,ey); ctx.lineTo(bx+48,ey); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('지구 g', bx+52, ey+4);
      ctx.fillStyle=ORA; ctx.textAlign='center'; ctx.fillText('g', bx+20, baseY+16);
      E.tapHint(W/2, H*0.90, '화면 탭 = 다시 떨어뜨리기', true);
      E.big('중력가속도 g = GM/R² = '+g.toFixed(2)+' m/s²  (지구의 '+(g/9.8).toFixed(2)+'배)', '행성 표면 중력은 질량 M에 비례, 반지름 R의 제곱에 반비례. 달은 질량이 작아 g≈1.6(지구의 1/6), 목성은 커서 ~2.5배. 같은 공이 행성마다 다른 속도로 떨어집니다 — 질량 자체와는 무관(자유낙하).'); }
  },

  // ══════════ 6.3 궤도 운동 — 1/r² 힘이 만드는 원·타원 ══════════
  { id:'phys6_03',
    enter:function(E){ var self=this; this.s={vf:1.0,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var sun=w.add({x:0,y:0,m:1000,r:0.5,fixed:true,color:ORA}); this.s.sun=sun;
      var p=w.add({x:R0,y:0,m:1,r:0.22,vx:0,vy:VC,color:BLU}); this.s.p=p;
      w.force(PhysLab.F.pointGravity(sun, GM));
      E.controls('<div class="ctrl"><label>발사 속력 (원궤도=1.00)</label><input type="range" id="vf" min="0.75" max="1.41" step="0.01" value="1.00"><output id="vfo">1.00</output></div>');
      E.bind('#vf','input',function(e){ self.s.vf=+e.target.value; document.getElementById('vfo').textContent=(+e.target.value).toFixed(2); self.relaunch(); E.blip(380,0.07); });
      E.setOn([]); },
    relaunch:function(){ var s=this.s, p=s.p; p.x=R0; p.y=0; p.vx=0; p.vy=s.vf*VC; s.trail=[]; },
    tap:function(E){ this.relaunch(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, p=s.p, sun=s.sun, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6);
      var r=Math.hypot(p.x,p.y), v=Math.hypot(p.vx,p.vy);
      if(r<sun.r+p.r+0.05 || r>16) this.relaunch();
      var sc=Math.min(W*0.30,H*0.40)/8, ox=W*0.42, oy=H*0.46, view=PhysLab.view(ox,oy,sc); s.view=view;
      s.trail.push([p.x,p.y]); if(s.trail.length>600) s.trail.shift();
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath();
      s.trail.forEach(function(q,i){ if(i===0)ctx.moveTo(view.X(q[0]),view.Y(q[1])); else ctx.lineTo(view.X(q[0]),view.Y(q[1])); }); ctx.stroke();
      // 태양
      ctx.fillStyle=ORA; ctx.globalAlpha=0.9; ctx.beginPath(); ctx.arc(ox,oy,12,0,7); ctx.fill(); ctx.globalAlpha=1;
      // 행성 + 속도
      var px=view.X(p.x), py=view.Y(p.y);
      arrow(E,px,py,px+p.vx*sc*0.5,py-p.vy*sc*0.5,GRN,2);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill();
      var e=0.5*v*v-GM/r, type=Math.abs(s.vf-1)<0.015?'원궤도':(e<-0.02?(s.vf<1?'타원(여기가 원일점)':'타원(여기가 근일점)'):'탈출 궤도');
      E.tapHint(W/2, H*0.92, '화면 탭 = 재발사', true);
      E.big(type+' — r = '+r.toFixed(2)+', v = '+v.toFixed(2), '행성은 끈에 매여 있지 않습니다 — 오직 1/r² 중력만으로 휘어 도는 것(엔진이 매 프레임 적분). 정확히 v=√(GM/r)면 원궤도, 그보다 느리거나 빠르면 타원. 너무 빠르면(√2배) 영영 탈출. 궤도의 한 초점에 태양이 있습니다(케플러 1법칙).'); }
  },

  // ══════════ 6.4 케플러 2법칙 — 같은 시간, 같은 면적 ══════════
  { id:'phys6_04',
    enter:function(E){ var self=this; this.s={trail:[],sweep:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var sun=w.add({x:0,y:0,m:1000,r:0.5,fixed:true,color:ORA}); this.s.sun=sun;
      var p=w.add({x:R0,y:0,m:1,r:0.22,vx:0,vy:0.78*VC,color:BLU}); this.s.p=p;   // 타원(여기가 원일점, 안쪽으로 떨어짐)
      w.force(PhysLab.F.pointGravity(sun, GM));
      E.setOn([]); },
    tap:function(E){ var s=this.s, p=s.p; p.x=R0; p.y=0; p.vx=0; p.vy=0.78*VC; s.trail=[]; s.sweep=[]; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, p=s.p, sun=s.sun, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6);
      var r=Math.hypot(p.x,p.y), v=Math.hypot(p.vx,p.vy);
      if(r<sun.r+p.r+0.05 || r>16){ p.x=R0; p.y=0; p.vx=0; p.vy=0.78*VC; s.trail=[]; s.sweep=[]; }
      var sc=Math.min(W*0.26,H*0.34)/9, ox=W*0.40, oy=H*0.46, view=PhysLab.view(ox,oy,sc); s.view=view;
      s.trail.push([p.x,p.y]); if(s.trail.length>1200) s.trail.shift();
      // 궤도 자취
      ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.2; ctx.beginPath();
      s.trail.forEach(function(q,i){ if(i===0)ctx.moveTo(view.X(q[0]),view.Y(q[1])); else ctx.lineTo(view.X(q[0]),view.Y(q[1])); }); ctx.stroke();
      // 면적속도(케플러2) = ½|x·vy − y·vx| = 일정
      var areal=0.5*Math.abs(p.x*p.vy-p.y*p.vx);
      // 최근 0.5초 동안 쓸어낸 부채꼴(짧게-넓게 / 길게-좁게, 면적 동일) 보존
      s.sweep.push([p.x,p.y]); if(s.sweep.length>30) s.sweep.shift();
      ctx.fillStyle='rgba(95,214,168,0.30)'; ctx.beginPath(); ctx.moveTo(ox,oy);
      s.sweep.forEach(function(q){ ctx.lineTo(view.X(q[0]),view.Y(q[1])); }); ctx.closePath(); ctx.fill();
      // 태양·행성·반지름선
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(view.X(p.x),view.Y(p.y)); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(ox,oy,11,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(view.X(p.x),view.Y(p.y),7,0,7); ctx.fill();
      // 면적속도 막대
      var bx=W*0.80, baseY=H*0.72, bh=H*0.4;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,40,bh);
      ctx.fillStyle=GRN; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,areal/4)*bh,40,Math.min(1,areal/4)*bh); ctx.globalAlpha=1;
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('dA/dt', bx+20, baseY+16);
      E.tapHint(W/2, H*0.92, '화면 탭=재시작 — 근일점(빠름)·원일점(느림)', true);
      E.big('면적속도 dA/dt = '+areal.toFixed(2)+'  (어디서나 일정)', '케플러 2법칙: 태양–행성 선분이 <b>같은 시간에 같은 넓이</b>를 쓸어냅니다. 태양에 가까우면(근일점) 빠르게, 멀면(원일점) 느리게 돌아 부채꼴 넓이가 늘 똑같습니다(초록). 이는 각운동량 보존의 결과 — 5장의 L=Iω와 한 뿌리!'); }
  },

  // ══════════ 6.5 탈출속도 — 묶일까, 벗어날까(에너지) ══════════
  { id:'phys6_05',
    enter:function(E){ var self=this; this.s={vf:1.0,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var sun=w.add({x:0,y:0,m:1000,r:0.5,fixed:true,color:ORA}); this.s.sun=sun;
      var p=w.add({x:R0,y:0,m:1,r:0.22,vx:0,vy:VC,color:BLU}); this.s.p=p;
      w.force(PhysLab.F.pointGravity(sun, GM));
      E.controls('<div class="ctrl"><label>발사 속력 (탈출=√2≈1.41)</label><input type="range" id="vf" min="0.6" max="1.6" step="0.01" value="1.00"><output id="vfo">1.00</output></div>');
      E.bind('#vf','input',function(e){ self.s.vf=+e.target.value; document.getElementById('vfo').textContent=(+e.target.value).toFixed(2); self.relaunch(); E.blip(380,0.07); });
      E.setOn([]); },
    relaunch:function(){ var s=this.s, p=s.p; p.x=R0; p.y=0; p.vx=0; p.vy=s.vf*VC; s.trail=[]; },
    tap:function(E){ this.relaunch(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, p=s.p, sun=s.sun, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6);
      var r=Math.hypot(p.x,p.y), v=Math.hypot(p.vx,p.vy);
      if(r<sun.r+p.r+0.05 || r>22) this.relaunch();
      var sc=Math.min(W*0.24,H*0.32)/10, ox=W*0.36, oy=H*0.46, view=PhysLab.view(ox,oy,sc); s.view=view;
      s.trail.push([p.x,p.y]); if(s.trail.length>700) s.trail.shift();
      ctx.strokeStyle='rgba(122,184,255,0.35)'; ctx.lineWidth=1.3; ctx.beginPath();
      s.trail.forEach(function(q,i){ if(i===0)ctx.moveTo(view.X(q[0]),view.Y(q[1])); else ctx.lineTo(view.X(q[0]),view.Y(q[1])); }); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(ox,oy,11,0,7); ctx.fill();
      var px=view.X(p.x), py=view.Y(p.y);
      arrow(E,px,py,px+p.vx*sc*0.5,py-p.vy*sc*0.5,GRN,2);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(px,py,6,0,7); ctx.fill();
      // 에너지: KE=½v², PE=-GM/r, total
      var KE=0.5*v*v, PE=-GM/r, tot=KE+PE, vesc=Math.SQRT2*VC, bound=tot<0;
      var bx=W*0.66, baseY=H*0.56, bh=H*0.20, mx=0.5*vesc*vesc*1.2;   // 0 기준 위=+, 아래=−
      ['KE','PE','합'].forEach(function(lab,i){ var val=(i===0?KE:i===1?PE:tot), x=bx+i*70, hh=val/mx*bh;
        ctx.fillStyle=(i===0?GRN:i===1?PNK:(bound?BLU:ORA)); ctx.globalAlpha=0.85;
        if(hh>=0) ctx.fillRect(x,baseY-hh,46,hh); else ctx.fillRect(x,baseY,46,-hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(val.toFixed(1), x+23, val>=0?baseY-hh-5:baseY-hh+13);
        ctx.fillStyle=DIM; ctx.fillText(lab, x+23, baseY+bh+14); });
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx-10,baseY); ctx.lineTo(bx+220,baseY); ctx.stroke();
      E.tapHint(W/2, H*0.93, '화면 탭 = 재발사', true);
      E.big('v = '+v.toFixed(2)+'  vs  탈출속도 '+vesc.toFixed(2)+'  →  '+(bound?'묶임(궤도로 되돌아옴)':'탈출!(영영 떠남)'), '총 역학적 에너지 E = KE + PE(=−GM/r)의 <b>부호</b>가 운명을 가릅니다. E<0이면 묶여 타원궤도(파랑), E≥0이면 탈출(주황). 탈출속도 v=√(2GM/r)에서 E=0 — 무한히 멀리서 속도 0. 로켓·우주탐사선·블랙홀 탈출 불가가 모두 이 에너지 부호 이야기.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
