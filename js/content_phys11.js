/* 물리학 제11장 전기장 — 쿨롱 법칙, 전기장 E, 균일장 속 운동(PhysLab uniformE), 전위, 축전기
   전하 운동은 PhysLab 쿨롱 힘·uniformE(qE)로 매 프레임 적분 — 진짜 엔진 시뮬.
   골든룰: 표시 수치는 전부 현재 상태/전기식에서 실시간 계산.
   텍스트=content/phys11.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var POS='#ff8a6b', NEG='#6ba8ff';   // +전하 붉음, −전하 푸름
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  function charge(E,x,y,r,q,label){ var ctx=E.ctx; ctx.fillStyle=q>=0?POS:NEG; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(x-r*0.5,y); ctx.lineTo(x+r*0.5,y); if(q>=0){ ctx.moveTo(x,y-r*0.5); ctx.lineTo(x,y+r*0.5); } ctx.stroke(); }

  var scenes=[

  // ══════════ 11.1 쿨롱 법칙 F = kq₁q₂/r² ══════════
  { id:'phys11_01',
    enter:function(E){ var self=this; this.s={r:3,q2:1};
      E.controls('<div class="ctrl"><label>거리 r</label><input type="range" id="rr" min="1" max="6" step="0.25" value="3"><output id="rro">3.0</output>'
        +'<label style="margin-left:14px">전하2 부호·크기</label><input type="range" id="qq" min="-2" max="2" step="1" value="1"><output id="qqo">+1</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(2); E.blip(500-self.s.r*40,0.07); });
      E.bind('#qq','input',function(e){ self.s.q2=+e.target.value; document.getElementById('qqo').textContent=(self.s.q2>0?'+':'')+self.s.q2; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, q1=1;
      var F=k*q1*s.q2/(s.r*s.r), repel=(q1*s.q2)>0, cy=H*0.40, x0=W*0.22, scale=(W*0.5)/6, x1=x0+s.r*scale;
      charge(E,x0,cy,18,q1,'q1'); if(s.q2!==0) charge(E,x1,cy,12,s.q2,'q2');
      // 거리선
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,cy+34); ctx.lineTo(x1,cy+34); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('r = '+s.r.toFixed(2), (x0+x1)/2, cy+50);
      // 힘 화살표(척력=바깥, 인력=안쪽)
      if(s.q2!==0){ var al=Math.min(70,Math.abs(F)*7), d=repel?1:-1;
        arrow(E,x1- (repel?-12:12),cy, x1 + d*al,cy, repel?ORA:GRN, 3);
        arrow(E,x0+ (repel?18:-18),cy, x0 - d*al,cy, repel?ORA:GRN, 3); }
      // 1/r² 곡선
      var gx0=W*0.62, gx1=W*0.93, gy0=H*0.84, gh=H*0.42;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('|F|',gx0+3,gy0-gh+4); ctx.fillText('r',gx1-8,gy0+14);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(var kk=0;kk<=60;kk++){ var rr=1+kk/60*5, ff=k*1*Math.max(1,Math.abs(s.q2))/(rr*rr), x=gx0+(rr-1)/5*(gx1-gx0), y=gy0-Math.min(gh,ff/18*gh); if(kk===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      E.tapHint(W/2, H*0.93, 'A/D로 거리 · F/H로 전하2 부호 — 같으면 밀고, 다르면 당김', true);
      E.big('쿨롱 힘 F = k·q₁q₂/r² = '+F.toFixed(2)+'  ('+(s.q2===0?'전하 없음':(repel?'척력':'인력'))+')', '전하 사이의 힘은 중력과 똑같은 1/r² 꼴 — <b>쿨롱 법칙 F=kq₁q₂/r²</b>. 다만 부호가 있어 <b>같은 부호는 밀고(척력), 다른 부호는 당깁니다(인력)</b>. 중력보다 훨씬 강하지만(전자-양성자 간 ~10⁴⁰배) 양·음이 상쇄돼 일상에선 중성. k = 9×10⁹ N·m²/C².'); }
  },

  // ══════════ 11.2 전기장 — 공간에 새겨진 힘 (드래그 시험전하) ══════════
  { id:'phys11_02',
    enter:function(E){ var self=this; this.s={Q:1,grab:false};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var src=w.add({x:0,y:0,m:1,r:0.3,q:1,fixed:true,color:POS}); this.s.src=src;
      var t=w.add({x:3,y:1.5,m:0.4,r:0.18,q:0.3,color:GRN}); this.s.t=t;
      w.force(function(){ var dx=t.x-src.x, dy=t.y-src.y, r2=dx*dx+dy*dy, r=Math.sqrt(r2)||0.3; var F=9*src.q*t.q/Math.max(0.3,r2); t.fx+=F*dx/r; t.fy+=F*dy/r; });
      E.controls('<div class="ctrl"><label>중심전하 Q 부호</label><input type="range" id="qq" min="-1" max="1" step="2" value="1"><output id="qqo">+</output></div>');
      E.bind('#qq','input',function(e){ self.s.Q=+e.target.value; self.s.src.q=self.s.Q; document.getElementById('qqo').textContent=(self.s.Q>0?'+':'−'); self.reset(); E.blip(360,0.07); });
      E.setOn([]); },
    reset:function(){ var s=this.s; s.t.x=3; s.t.y=1.5; s.t.vx=0; s.t.vy=0; },
    down:function(E,cx,cy){ var s=this.s,v=s.view; if(!v)return; var wx=v.wx(cx),wy=v.wy(cy);
      if(Math.hypot(s.t.x-wx,s.t.y-wy)<0.6){ s.t.held=true; s.grab=true; } else { s.t.x=wx; s.t.y=wy; s.t.vx=0; s.t.vy=0; } },
    move:function(E,cx,cy){ var s=this.s; if(s.grab&&s.view){ s.t.x=s.view.wx(cx); s.t.y=s.view.wy(cy); s.t.vx=0; s.t.vy=0; } },
    up:function(E){ var s=this.s; if(s.grab){ s.t.held=false; s.grab=false; } },
    draw:function(E){ var s=this.s, w=s.w, ctx=E.ctx, W=E.W, H=E.H;
      if(!s.grab) w.step(1/60,6);
      var ox=W*0.42, sc=Math.min(W*0.06,H*0.085), oy=H*0.46, v=PhysLab.view(ox,oy,sc); s.view=v;
      // 전기장 화살표(격자)
      for(var gx=-5;gx<=5;gx+=1.4){ for(var gy=-4;gy<=4;gy+=1.4){ var dx=gx, dy=gy, r=Math.hypot(dx,dy); if(r<0.6)continue;
        var E0=2.2/(r*r), ux=dx/r*s.Q, uy=dy/r*s.Q, len=Math.min(16,E0*10);
        var px=v.X(gx), py=v.Y(gy); arrow(E,px,py,px+ux/Math.abs(s.Q)*len*Math.sign(s.Q||1),py-uy/Math.abs(s.Q)*len*Math.sign(s.Q||1),'rgba(122,184,255,0.45)',1.2); } }
      // 중심전하
      charge(E,v.X(0),v.Y(0),16,s.Q,'Q');
      // 시험전하 + 받는 힘
      var t=s.t, px=v.X(t.x), py=v.Y(t.y);
      var dx2=t.x, dy2=t.y, r2=Math.hypot(dx2,dy2)||0.3, Fm=9*s.src.q*t.q/(r2*r2), fl=Math.min(40,Math.abs(Fm)*8)*Math.sign(Fm);
      arrow(E,px,py,px+dx2/r2*fl,py-dy2/r2*fl,ORA,2.5);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill();
      E.tapHint(W/2, H*0.92, '시험전하(초록)를 끌어 놓기 · F/H로 Q 부호', true);
      E.big('전기장 E — 시험전하가 받는 힘 F = qE', '전하는 주변 공간에 <b>전기장 E</b>를 만듭니다 — 보이지 않지만 공간 곳곳에 새겨진 "힘의 지도"(파란 화살표). 그 자리에 전하 q를 놓으면 <b>F = qE</b>의 힘을 받습니다. +전하의 장은 바깥으로, −전하는 안으로 향합니다. 시험전하(초록)를 끌어 놓으면 장을 따라 밀려납니다. E = kQ/r².'); }
  },

  // ══════════ 11.3 균일 전기장 속 운동 — 전기적 포물선(uniformE) ══════════
  { id:'phys11_03',
    enter:function(E){ var self=this; this.s={Efield:3,q:1,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:0.5,y:5,m:1,r:0.2,q:1,vx:3.5,color:POS}); this.s.b=b;
      w.force(PhysLab.F.uniformE(0, -self.s.Efield));   // 아래로 향하는 균일장, F=qE
      this.s.fapply=function(){ w.clearForces(); w.force(PhysLab.F.uniformE(0,-self.s.Efield*(self.s.q>=0?1:1))); };
      E.controls('<div class="ctrl"><label>전기장 세기 E</label><input type="range" id="ee" min="0" max="8" step="0.5" value="3"><output id="eeo">3.0</output>'
        +'<label style="margin-left:14px">전하 q</label><input type="range" id="qq" min="-2" max="2" step="1" value="1"><output id="qqo">+1</output></div>');
      E.bind('#ee','input',function(e){ self.s.Efield=+e.target.value; self.refield(); document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#qq','input',function(e){ self.s.q=+e.target.value; self.s.b.q=self.s.q; document.getElementById('qqo').textContent=(self.s.q>0?'+':'')+self.s.q; self.relaunch(); E.blip(320,0.07); });
      E.setOn([]); },
    refield:function(){ var s=this.s; s.w.clearForces(); s.w.force(PhysLab.F.uniformE(0,-s.Efield)); },
    relaunch:function(){ var s=this.s, b=s.b; b.x=0.5; b.y=5; b.vx=3.5; b.vy=0; s.trail=[]; },
    tap:function(E){ this.relaunch(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); if(b.x>10||b.y<0.2||b.y>9.8) this.relaunch();
      var ox=W*0.08, sc=Math.min(W*0.08,H*0.085), oy=H*0.92, v=PhysLab.view(ox,oy,sc); s.view=v;
      // 평행판(축전기) + 균일장 화살표
      ctx.strokeStyle=POS; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(8.5)); ctx.lineTo(v.X(10),v.Y(8.5)); ctx.stroke();
      ctx.strokeStyle=NEG; ctx.beginPath(); ctx.moveTo(v.X(0),v.Y(1.5)); ctx.lineTo(v.X(10),v.Y(1.5)); ctx.stroke();
      ctx.fillStyle=POS; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('+ + + +', v.X(0.3),v.Y(8.5)-6);
      ctx.fillStyle=NEG; ctx.fillText('− − − −', v.X(0.3),v.Y(1.5)+16);
      for(var gx=1;gx<10;gx+=1.5){ arrow(E,v.X(gx),v.Y(8.3),v.X(gx),v.Y(1.7),'rgba(122,184,255,0.25)',1); }
      // 자취
      s.trail.push([b.x,b.y]); if(s.trail.length>200) s.trail.shift();
      ctx.strokeStyle='rgba(255,138,107,0.5)'; ctx.lineWidth=1.5; ctx.beginPath();
      s.trail.forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke();
      charge(E,v.X(b.x),v.Y(b.y),9,b.q,'');
      var a=s.q*s.Efield/b.m;
      E.tapHint(W/2, H*0.96, '화면 탭=재발사 · A/D·F/H로 전기장·전하', true);
      E.big('전기력 F = qE → 포물선 운동 (a = qE/m = '+a.toFixed(2)+')', '균일한 전기장(평행판 사이) 속 전하는 일정한 힘 F=qE를 받아 — 마치 중력 속 포물선처럼 — 휘어 날아갑니다(엔진이 uniformE를 적분). 1장의 포물선 운동과 똑같은 수학! 전하 부호를 바꾸면 휘는 방향이 반대가 됩니다. 이것이 오래된 브라운관(CRT) TV가 전자빔을 휘어 화면을 그린 원리.'); }
  },

  // ══════════ 11.4 전위 V = kQ/r — 전기적 높이 ══════════
  { id:'phys11_04',
    enter:function(E){ var self=this; this.s={r:2.5};
      E.controls('<div class="ctrl"><label>중심에서 거리 r</label><input type="range" id="rr" min="0.8" max="5" step="0.2" value="2.5"><output id="rro">2.5</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-self.s.r*40,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, Q=1;
      var cx=W*0.38, cy=H*0.46, scale=Math.min(W*0.06,H*0.085);
      // 등전위선(동심원)
      [1,2,3,4].forEach(function(rr){ var V=k*Q/rr; ctx.strokeStyle='rgba(122,184,255,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,rr*scale,0,7); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('V='+V.toFixed(1), cx, cy-rr*scale-3); });
      // 중심전하
      charge(E,cx,cy,15,Q,'Q');
      // 거리 r 위치의 시험점
      var px=cx+s.r*scale, V=k*Q/s.r;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(px,cy,7,0,7); ctx.fill();
      // V(r) 곡선
      var gx0=W*0.62, gx1=W*0.93, gy0=H*0.82, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('V',gx0+3,gy0-gh+4); ctx.fillText('r',gx1-8,gy0+14);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=60;i++){ var rr2=0.8+i/60*4.2, vv=k*Q/rr2, x=gx0+(rr2-0.8)/4.2*(gx1-gx0), y=gy0-Math.min(gh,vv/12*gh); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      var mx=gx0+(s.r-0.8)/4.2*(gx1-gx0), my=gy0-Math.min(gh,V/12*gh); ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.93, 'A/D로 거리 — 가까울수록 전위 높음', true);
      E.big('전위 V = kQ/r = '+V.toFixed(2)+' V', '전위는 전기장의 "높이"입니다 — 단위 전하가 갖는 위치에너지(V=kQ/r). +전하 둘레는 높은 언덕, 다른 +전하는 언덕 아래로 굴러 내려가듯 밀려납니다. 등전위선(파란 원)은 같은 높이 — 그 위에서 움직이면 일이 0. 전기위치E U = qV. 1/r²인 힘(장)과 달리 전위는 1/r로 더 완만합니다(전기장은 전위의 기울기).'); }
  },

  // ══════════ 11.5 축전기 — 전기장에 에너지를 저장 ══════════
  { id:'phys11_05',
    enter:function(E){ var self=this; this.s={V:6,d:2};
      E.controls('<div class="ctrl"><label>전압 V</label><input type="range" id="vv" min="1" max="10" step="1" value="6"><output id="vvo">6</output>'
        +'<label style="margin-left:14px">판 간격 d</label><input type="range" id="dd" min="1" max="4" step="0.5" value="2"><output id="ddo">2.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.V=+e.target.value; document.getElementById('vvo').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, eps=1, A=4;
      var Cap=eps*A/s.d, Q=Cap*s.V, Efield=s.V/s.d, U=0.5*Cap*s.V*s.V;
      var cx=W*0.38, cyT=H*0.24, cyB=cyT+s.d*H*0.10, pw=W*0.36;
      // 평행판
      ctx.strokeStyle=POS; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx-pw/2,cyT); ctx.lineTo(cx+pw/2,cyT); ctx.stroke();
      ctx.strokeStyle=NEG; ctx.beginPath(); ctx.moveTo(cx-pw/2,cyB); ctx.lineTo(cx+pw/2,cyB); ctx.stroke();
      ctx.fillStyle=POS; ctx.font='13px sans-serif'; ctx.textAlign='center';
      var nq=Math.round(Q); for(var i=0;i<Math.min(12,Math.max(2,nq));i++){ var x=cx-pw/2+pw*(i+0.5)/Math.min(12,Math.max(2,nq)); ctx.fillStyle=POS; ctx.fillText('+',x,cyT-6); ctx.fillStyle=NEG; ctx.fillText('−',x,cyB+16); }
      // 균일장 화살표
      for(var gx=-pw/2+20;gx<pw/2;gx+=34){ arrow(E,cx+gx,cyT+6,cx+gx,cyB-6,'rgba(122,184,255,0.4)',1.5); }
      // 에너지 막대
      var bx=W*0.74, baseY=H*0.74, bh=H*0.46, mx=0.5*(eps*A/1)*100;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,46,bh);
      ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,U/mx)*bh,46,Math.min(1,U/mx)*bh); ctx.globalAlpha=1;
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('저장E', bx+23, baseY+16);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('C = '+Cap.toFixed(2), W*0.10, H*0.86); ctx.fillText('Q = CV = '+Q.toFixed(1), W*0.30, H*0.86); ctx.fillText('E장 = V/d = '+Efield.toFixed(1), W*0.52, H*0.86);
      E.tapHint(W/2, H*0.93, 'A/D·F/H로 전압·판 간격', true);
      E.big('축전기 저장 에너지 U = ½CV² = '+U.toFixed(1), '축전기는 두 판에 +·− 전하를 모아 <b>전기장의 형태로 에너지를 저장</b>합니다. 전하량 Q=CV, 판 사이 균일장 E=V/d, 저장 에너지 U=½CV²=½QV. 전압을 올리면 더 많은 전하·에너지가 쌓이고(에너지는 전압의 제곱!), 판 간격을 좁히면 전기용량 C가 커집니다(C=εA/d). 카메라 플래시·전자회로의 에너지 buffer.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
