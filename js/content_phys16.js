/* 물리학 「전위와 전기용량」 — 전기장(앞 장)과 회로(뒤 장)를 잇는 다리.
   전위 = 전기적 '높이'(단위 전하의 위치에너지). 축전기 = 전기장에 에너지를 저장.
   골든룰: 전위·에너지·전기용량 전부 V=kQ/r, U=qV, C=κε₀A/d, U=½CV² 실식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys16.json. 일부 장면은 phys11(전기장)에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var POS='#ff8a6b', NEG='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }
  function charge(E,x,y,r,q){ var ctx=E.ctx; ctx.fillStyle=q>=0?POS:NEG; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(x-r*0.5,y); ctx.lineTo(x+r*0.5,y); if(q>=0){ ctx.moveTo(x,y-r*0.5); ctx.lineTo(x,y+r*0.5); } ctx.stroke(); }

  var scenes=[

  // ══════════ 1. 전위 = 전기적 높이 (U = qV) ══════════
  { id:'phys16_01',
    enter:function(E){ var self=this; this.s={r:2.4,q:1};
      E.controls('<div class="ctrl"><label>시험전하 위치 r</label><input type="range" id="rr" min="0.8" max="4.5" step="0.1" value="2.4"><output id="rro">2.4</output>'
        +'<label style="margin-left:14px">시험전하 q</label><input type="range" id="qq" min="1" max="3" step="1" value="1"><output id="qqo">1</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(440-self.s.r*50,0.07); });
      E.bind('#qq','input',function(e){ self.s.q=+e.target.value; document.getElementById('qqo').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, Q=1;
      var V=k*Q/s.r, U=s.q*V;   // V=kQ/r(전위), U=qV(위치에너지) — 골든룰
      // 1/r '언덕' 단면: x=거리, y=높이(전위). +Q는 솟은 언덕.
      var gx0=W*0.12, gx1=W*0.78, gy0=H*0.70, hScale=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.stroke();
      // 언덕 채우기(전위 곡선 아래)
      ctx.beginPath(); ctx.moveTo(gx0,gy0);
      for(var i=0;i<=80;i++){ var rr=0.6+i/80*4.2, vv=k*Q/rr, x=gx0+(rr-0.6)/4.2*(gx1-gx0), y=gy0-Math.min(hScale,vv/15*hScale); ctx.lineTo(x,y); }
      ctx.lineTo(gx1,gy0); ctx.closePath(); ctx.fillStyle='rgba(255,138,107,0.13)'; ctx.fill();
      ctx.strokeStyle=ORA; ctx.lineWidth=2.4; ctx.beginPath();
      for(var i2=0;i2<=80;i2++){ var rr2=0.6+i2/80*4.2, vv2=k*Q/rr2, x2=gx0+(rr2-0.6)/4.2*(gx1-gx0), y2=gy0-Math.min(hScale,vv2/15*hScale); if(i2===0)ctx.moveTo(x2,y2); else ctx.lineTo(x2,y2); } ctx.stroke();
      // +Q 원천(언덕 꼭대기 = 가까운 쪽)
      charge(E, gx0, gy0-12, 11, Q);
      ctx.fillStyle=POS; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('+Q', gx0+14, gy0-6);
      // 시험전하 공(언덕 위 r 위치)
      var bx=gx0+(s.r-0.6)/4.2*(gx1-gx0), by=gy0-Math.min(hScale,V/15*hScale);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(bx,by-8,9,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('+'+s.q, bx, by-4);
      arrow(E, bx+14,by-8, bx+38,by-8+ (gy0-by)*0.25, GRN, 2);   // 굴러내려갈 방향(바깥=낮은 전위)
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('낮은 전위로 밀려남 →', bx+50, by-22);
      // 수치
      ctx.fillStyle=ORA; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('전위  V = kQ/r = '+V.toFixed(2)+' V', W*0.80, H*0.40);
      ctx.fillText('위치E  U = qV = '+U.toFixed(2)+' J', W*0.80, H*0.48);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(가까울수록 높다)', W*0.80, H*0.55);
      E.tapHint(W/2, H*0.93, '시험전하를 안쪽으로 옮기면 전위(높이)·에너지가 커집니다', true);
      E.big('전위 = 전기적 높이  ·  위치에너지 U = qV', '전위는 전기의 높이입니다.'); }
  },

  // ══════════ 2. 점전하의 전위 V = kQ/r (등전위 원) ══════════
  { id:'phys16_02',
    enter:function(E){ var self=this; this.s={r:2.5};
      E.controls('<div class="ctrl"><label>중심에서 거리 r</label><input type="range" id="rr" min="0.8" max="5" step="0.2" value="2.5"><output id="rro">2.5</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-self.s.r*40,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, Q=1;
      var cx=W*0.38, cy=H*0.46, scale=Math.min(W*0.06,H*0.085);
      [1,2,3,4].forEach(function(rr){ var V=k*Q/rr; ctx.strokeStyle='rgba(122,184,255,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,rr*scale,0,7); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('V='+V.toFixed(1), cx, cy-rr*scale-3); });
      charge(E,cx,cy,15,Q);
      ctx.fillStyle=POS; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('Q=+1', cx, cy+28);
      var px=cx+s.r*scale, V=k*Q/s.r;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('r='+s.r.toFixed(1), (cx+px)/2, cy+15);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(px,cy,7,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('V = '+V.toFixed(1)+' V', px, cy-14);
      var gx0=W*0.62, gx1=W*0.93, gy0=H*0.82, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('V',gx0+3,gy0-gh+4); ctx.fillText('r',gx1-8,gy0+14);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=60;i++){ var rr2=0.8+i/60*4.2, vv=k*Q/rr2, x=gx0+(rr2-0.8)/4.2*(gx1-gx0), y=gy0-Math.min(gh,vv/12*gh); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      var mx=gx0+(s.r-0.8)/4.2*(gx1-gx0), my=gy0-Math.min(gh,V/12*gh); ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.93, '중심에 가까울수록 전위가 높습니다 (V는 1/r)', true);
      E.big('전위 V = kQ/r = '+V.toFixed(2)+' V', '점전하 둘레의 전위 지도.'); }
  },

  // ══════════ 3. 등전위면 ⊥ 전기장 (E = −ΔV/Δr) ══════════
  { id:'phys16_03',
    enter:function(E){ var self=this; this.s={r:2.2};
      E.controls('<div class="ctrl"><label>두 등전위면 사이 위치 r</label><input type="range" id="rr" min="1" max="4" step="0.1" value="2.2"><output id="rro">2.2</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(400,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, Q=1;
      var cx=W*0.42, cy=H*0.48, scale=Math.min(W*0.075,H*0.10);
      // 전기장선(방사상 화살표) — 바깥쪽(높은→낮은 전위)
      for(var a=0;a<8;a++){ var th=a/8*2*Math.PI; arrow(E, cx+Math.cos(th)*scale*0.7, cy+Math.sin(th)*scale*0.7, cx+Math.cos(th)*scale*4.3, cy+Math.sin(th)*scale*4.3, 'rgba(255,178,122,0.5)', 1.6); }
      // 등전위면(원) — 전기장선과 수직
      [1,2,3,4].forEach(function(rr){ ctx.strokeStyle='rgba(122,184,255,0.55)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(cx,cy,rr*scale,0,7); ctx.stroke(); });
      charge(E,cx,cy,13,Q);
      // 선택된 두 등전위면(r 양옆) — 전위차로 E 계산
      var r1=Math.floor(s.r), r2=r1+1, V1=k*Q/r1, V2=k*Q/r2, dV=V1-V2, Efield=dV/(r2-r1);   // E≈−ΔV/Δr (골든룰)
      ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(cx,cy,r1*scale,0,7); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,r2*scale,0,7); ctx.stroke();
      // 현재 위치 점 + 국소 E(반지름 방향, 등전위면에 수직)
      var px=cx+s.r*scale, py=cy; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(px,py,6,0,7); ctx.fill();
      arrow(E, px,py, px+34,py, ORA, 2.5);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('E ⊥ 등전위면', px+24, py-12);
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('등전위면 V₁='+V1.toFixed(1)+'  V₂='+V2.toFixed(1), W*0.04, H*0.84);
      ctx.fillText('전위차 ΔV = '+dV.toFixed(2), W*0.40, H*0.84);
      ctx.fillStyle=ORA; ctx.fillText('전기장 E = −ΔV/Δr = '+Efield.toFixed(2), W*0.62, H*0.84);
      E.tapHint(W/2, H*0.93, '전기장은 등전위면에 수직 · 전위가 급변할수록 강합니다', true);
      E.big('등전위면 ⊥ 전기장  ·  E = −ΔV/Δr', '전기장은 전위의 비탈(기울기)입니다.'); }
  },

  // ══════════ 4. 축전기 C = Q/V, 저장 에너지 U = ½CV² ══════════
  { id:'phys16_04',
    enter:function(E){ var self=this; this.s={V:6,d:2};
      E.controls('<div class="ctrl"><label>전압 V</label><input type="range" id="vv" min="1" max="10" step="1" value="6"><output id="vvo">6</output>'
        +'<label style="margin-left:14px">판 간격 d</label><input type="range" id="dd" min="1" max="4" step="0.5" value="2"><output id="ddo">2.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.V=+e.target.value; document.getElementById('vvo').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, eps=1, A=4;
      var Cap=eps*A/s.d, Q=Cap*s.V, Efield=s.V/s.d, U=0.5*Cap*s.V*s.V;
      var cx=W*0.38, cyT=H*0.24, cyB=cyT+s.d*H*0.10, pw=W*0.36;
      ctx.strokeStyle=POS; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx-pw/2,cyT); ctx.lineTo(cx+pw/2,cyT); ctx.stroke();
      ctx.strokeStyle=NEG; ctx.beginPath(); ctx.moveTo(cx-pw/2,cyB); ctx.lineTo(cx+pw/2,cyB); ctx.stroke();
      ctx.font='13px sans-serif'; ctx.textAlign='center';
      var nq=Math.round(Q); var ncol=Math.min(12,Math.max(2,nq)); for(var i=0;i<ncol;i++){ var x=cx-pw/2+pw*(i+0.5)/ncol; ctx.fillStyle=POS; ctx.fillText('+',x,cyT-6); ctx.fillStyle=NEG; ctx.fillText('−',x,cyB+16); }
      for(var gx=-pw/2+20;gx<pw/2;gx+=34){ arrow(E,cx+gx,cyT+6,cx+gx,cyB-6,'rgba(122,184,255,0.4)',1.5); }
      ctx.fillStyle='rgba(122,184,255,0.85)'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('E', cx+pw/2-16, (cyT+cyB)/2);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-pw/2-14,cyT); ctx.lineTo(cx-pw/2-14,cyB); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText('d='+s.d.toFixed(1), cx-pw/2-18, (cyT+cyB)/2);
      var bx=W*0.74, baseY=H*0.74, bh=H*0.46, mx=0.5*(eps*A/1)*100;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,46,bh);
      var uh=Math.min(1,U/mx)*bh; ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-uh,46,uh); ctx.globalAlpha=1;
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('U = '+U.toFixed(1), bx+23, baseY-uh-6);
      ctx.fillStyle=ORA; ctx.fillText('저장E', bx+23, baseY+16);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('C = εA/d = '+Cap.toFixed(2), W*0.08, H*0.86); ctx.fillText('Q = CV = '+Q.toFixed(1), W*0.32, H*0.86); ctx.fillText('E = V/d = '+Efield.toFixed(1), W*0.52, H*0.86);
      E.tapHint(W/2, H*0.93, '전압·판 간격을 바꿔 보세요 (에너지는 전압의 제곱)', true);
      E.big('축전기 저장 에너지 U = ½CV² = '+U.toFixed(1), '전기장에 에너지를 가둡니다.'); }
  },

  // ══════════ 5. 유전체 — 전기용량을 키우다 (C = κε₀A/d) ══════════
  { id:'phys16_05',
    enter:function(E){ var self=this; this.s={ins:0.5,kappa:4};
      E.controls('<div class="ctrl"><label>유전체 삽입 정도</label><input type="range" id="ii" min="0" max="1" step="0.05" value="0.5"><output id="iio">50%</output>'
        +'<label style="margin-left:14px">유전상수 κ</label><input type="range" id="kk" min="1" max="8" step="1" value="4"><output id="kko">4</output></div>');
      E.bind('#ii','input',function(e){ self.s.ins=+e.target.value; document.getElementById('iio').textContent=Math.round(self.s.ins*100)+'%'; E.blip(360,0.06); });
      E.bind('#kk','input',function(e){ self.s.kappa=+e.target.value; document.getElementById('kko').textContent=e.target.value; E.blip(380,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, C0=2, V=6;
      // 부분 삽입: 유효 κ = 1 + (κ−1)·삽입비, C=κ_eff·C0, Q=CV (V 고정) — 골든룰
      var kEff=1+(s.kappa-1)*s.ins, Cap=kEff*C0, Q=Cap*V;
      var cx=W*0.40, cyT=H*0.26, cyB=H*0.56, pw=W*0.40, plx=cx-pw/2;
      // 평행판
      ctx.strokeStyle=POS; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(plx,cyT); ctx.lineTo(plx+pw,cyT); ctx.stroke();
      ctx.strokeStyle=NEG; ctx.beginPath(); ctx.moveTo(plx,cyB); ctx.lineTo(plx+pw,cyB); ctx.stroke();
      // 유전체 슬래브(왼쪽에서 ins만큼 삽입)
      var sw=pw*s.ins; if(sw>4){ ctx.fillStyle='rgba(143,227,181,0.18)'; ctx.fillRect(plx,cyT+3,sw,cyB-cyT-6);
        ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=2; ctx.strokeRect(plx,cyT+3,sw,cyB-cyT-6);
        // 분극(유전체 면에 유도전하 +/−, 장 반대 방향)
        ctx.fillStyle='rgba(255,138,107,0.8)'; ctx.font='12px sans-serif'; ctx.textAlign='center';
        for(var p=0;p<Math.min(6,Math.round(sw/26));p++){ var xx=plx+10+p*26; ctx.fillStyle=NEG; ctx.fillText('−',xx,cyT+16); ctx.fillStyle=POS; ctx.fillText('+',xx,cyB-8); }
        ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('유전체 κ='+s.kappa, plx+sw/2, (cyT+cyB)/2); }
      // 판 전하(전체) — Q가 커지면 더 빽빽
      var ncol=Math.min(16,Math.max(2,Math.round(Q))); ctx.font='12px sans-serif';
      for(var i=0;i<ncol;i++){ var x=plx+pw*(i+0.5)/ncol; ctx.fillStyle=POS; ctx.fillText('+',x,cyT-6); ctx.fillStyle=NEG; ctx.fillText('−',x,cyB+16); }
      // 전기장 화살표
      for(var gx=12;gx<pw;gx+=36){ arrow(E,plx+gx,cyT+6,plx+gx,cyB-6,'rgba(122,184,255,0.35)',1.4); }
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('유효 유전상수 κ_eff = '+kEff.toFixed(2)+'   →   C = κ_eff·C₀ = '+Cap.toFixed(2), W/2, H*0.70);
      ctx.fillStyle=ORA; ctx.fillText('같은 전압 V='+V+'에서  Q = CV = '+Q.toFixed(1)+'  (전하 더 저장!)', W/2, H*0.78);
      E.tapHint(W/2, H*0.93, '유전체를 더 밀어넣으면 전기용량 C와 저장 전하 Q가 커집니다', true);
      E.big('유전체 — 전기용량을 κ배로  ·  C = κε₀A/d', '틈을 채워 더 많은 전하를.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
