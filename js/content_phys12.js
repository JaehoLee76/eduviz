/* 물리학 제12장 회로 — 전류, 옴의 법칙 V=IR, 직렬·병렬, 전력 P=VI, RC 회로(ODE 적분)
   RC 충·방전은 dQ/dt=(V-Q/C)/R를 매 프레임 적분 — 지수 곡선을 '생성'(진짜 엔진 시뮬).
   골든룰: 표시 수치는 전부 회로식/적분 상태에서 실시간 계산.
   텍스트=content/phys12.json. 엔진=js/physlab.js(공유), js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  // 직사각 회로 둘레 매개변수 t∈[0,1) → 화면점
  function perim(t,x,y,w,h){ t=((t%1)+1)%1; var P=2*(w+h), d=t*P;
    if(d<w) return [x+d,y]; d-=w; if(d<h) return [x+w,y+d]; d-=h; if(d<w) return [x+w-d,y+h]; d-=w; return [x,y+h-d]; }
  function wire(E,x,y,w,h){ var ctx=E.ctx; ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2.5; ctx.strokeRect(x,y,w,h); }
  function battery(E,x,y){ var ctx=E.ctx; ctx.strokeStyle=ORA; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x,y-14); ctx.lineTo(x,y+14); ctx.stroke();
    ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+8,y-8); ctx.lineTo(x+8,y+8); ctx.stroke();
    ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('＋', x-6, y-20); ctx.fillText('－', x+14, y-20); }
  function resistor(E,x,y,horiz,col){ var ctx=E.ctx; ctx.strokeStyle=col||GRN; ctx.lineWidth=2.5; ctx.beginPath();
    if(horiz){ ctx.moveTo(x-24,y); for(var i=0;i<6;i++) ctx.lineTo(x-24+i*8+4, y+(i%2?7:-7)); ctx.lineTo(x+24,y); } else { ctx.moveTo(x,y-24); for(var j=0;j<6;j++) ctx.lineTo(x+(j%2?7:-7),y-24+j*8+4); ctx.lineTo(x,y+24); }
    ctx.stroke(); }
  function flow(E,phase,x,y,w,h,n,col){ var ctx=E.ctx; for(var i=0;i<n;i++){ var p=perim(phase+i/n,x,y,w,h); ctx.fillStyle=col||BLU; ctx.beginPath(); ctx.arc(p[0],p[1],3.5,0,7); ctx.fill(); } }

  var scenes=[

  // ══════════ 12.1 전류 — 전하의 흐름 ══════════
  { id:'phys12_01',
    enter:function(E){ var self=this; this.s={V:6,ph:0};
      E.controls('<div class="ctrl"><label>전압 V</label><input type="range" id="vv" min="1" max="12" step="1" value="6"><output id="vvo">6</output></div>');
      E.bind('#vv','input',function(e){ self.s.V=+e.target.value; document.getElementById('vvo').textContent=e.target.value; E.blip(300+self.s.V*30,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, R=3;
      var I=s.V/R; s.ph+=I*0.0012;
      var x=W*0.24, y=H*0.30, w=W*0.5, h=H*0.34;
      wire(E,x,y,w,h); battery(E,x,y+h/2); resistor(E,x+w,y+h/2,false,GRN);
      flow(E,s.ph,x,y,w,h,Math.round(8+s.V),BLU);
      // 전류 방향 표시
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('전류 I →', x+w/2, y-10);
      E.tapHint(W/2, H*0.90, 'A/D로 전압 — 전하가 더 빨리·많이 흐름', true);
      E.big('전류 I = Q/t = '+I.toFixed(2)+' A — 전하의 흐름', '전류는 <b>전하가 흐르는 양</b>입니다 — 1초에 어떤 단면을 지나는 전하량(I = Q/t, 단위 암페어 A = C/s). 전지가 만든 전압이 전하(금속 속 자유전자)를 밀어 회로를 돕니다. 전압을 올리면 전하가 더 빠르고 많이 흐릅니다(전류↑). 실제 전자는 −극에서 나오지만, 관례상 전류는 +극에서 나오는 방향으로 표시합니다.'); }
  },

  // ══════════ 12.2 옴의 법칙 V = IR ══════════
  { id:'phys12_02',
    enter:function(E){ var self=this; this.s={V:6,R:3,ph:0};
      E.controls('<div class="ctrl"><label>전압 V</label><input type="range" id="vv" min="1" max="12" step="1" value="6"><output id="vvo">6</output>'
        +'<label style="margin-left:14px">저항 R (Ω)</label><input type="range" id="rr" min="1" max="12" step="1" value="3"><output id="rro">3</output></div>');
      E.bind('#vv','input',function(e){ self.s.V=+e.target.value; document.getElementById('vvo').textContent=e.target.value; E.blip(320,0.07); });
      E.bind('#rr','input',function(e){ self.s.R=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=s.V/s.R; s.ph+=I*0.0016;
      var x=W*0.22, y=H*0.28, w=W*0.46, h=H*0.34;
      wire(E,x,y,w,h); battery(E,x,y+h/2);
      // 저항(클수록 지그재그 크게)
      resistor(E,x+w,y+h/2,false,GRN); ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('R='+s.R+'Ω', x+w+16, y+h/2);
      flow(E,s.ph,x,y,w,h,Math.max(4,Math.round(I*3)),BLU);
      // 전구 밝기(전력)
      var P=s.V*I, br=Math.min(1,P/30); ctx.fillStyle='rgba(255,220,120,'+br+')'; ctx.beginPath(); ctx.arc(x+w/2,y,12+br*10,0,7); ctx.fill();
      ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x+w/2,y,12,0,7); ctx.stroke();
      E.tapHint(W/2, H*0.90, 'A/D·F/H로 전압·저항 — I=V/R', true);
      E.big('옴의 법칙: I = V/R = '+s.V+'/'+s.R+' = '+I.toFixed(2)+' A', '전류는 전압에 비례하고 저항에 반비례합니다 — <b>옴의 법칙 V = IR</b>. 전압(미는 힘)을 올리면 전류↑, 저항(흐름 방해)을 올리면 전류↓. 저항은 전자가 원자와 부딪혀 받는 방해 — 가늘고 긴 전선일수록, 뜨거울수록 커집니다. 전구가 전류(=전력)에 따라 밝아지는 것을 보세요.'); }
  },

  // ══════════ 12.3 직렬 vs 병렬 저항 ══════════
  { id:'phys12_03',
    enter:function(E){ var self=this; this.s={mode:0,R1:4,R2:4,ph:0,V:6};
      E.controls('<div class="ctrl"><label>연결 (0 직렬 / 1 병렬)</label><input type="range" id="mm" min="0" max="1" step="1" value="0"><output id="mmo">직렬</output>'
        +'<label style="margin-left:14px">R₂ (Ω)</label><input type="range" id="r2" min="2" max="10" step="1" value="4"><output id="r2o">4</output></div>');
      E.bind('#mm','input',function(e){ self.s.mode=+e.target.value; document.getElementById('mmo').textContent=self.s.mode?'병렬':'직렬'; E.blip(360,0.08); });
      E.bind('#r2','input',function(e){ self.s.R2=+e.target.value; document.getElementById('r2o').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Rtot = s.mode? 1/(1/s.R1+1/s.R2) : (s.R1+s.R2), I=s.V/Rtot; s.ph+=I*0.002;
      var x=W*0.20, y=H*0.26, w=W*0.5, h=H*0.36;
      wire(E,x,y,w,h); battery(E,x,y+h/2);
      if(!s.mode){ // 직렬: 두 저항 위쪽에 나란히
        resistor(E,x+w*0.33,y,true,GRN); resistor(E,x+w*0.66,y,true,PNK);
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('R₁='+s.R1, x+w*0.33,y-16); ctx.fillStyle=PNK; ctx.fillText('R₂='+s.R2, x+w*0.66,y-16);
        flow(E,s.ph,x,y,w,h,Math.max(4,Math.round(I*4)),BLU);
      } else { // 병렬: 두 갈래
        var midY=y+h/2; ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x+w*0.5,y); ctx.lineTo(x+w*0.5,y+h); ctx.stroke();
        resistor(E,x+w*0.72,y+h*0.25,true,GRN); resistor(E,x+w*0.72,y+h*0.75,true,PNK);
        ctx.beginPath(); ctx.moveTo(x+w*0.5,y+h*0.25); ctx.lineTo(x+w,y+h*0.25); ctx.lineTo(x+w,y+h*0.75); ctx.lineTo(x+w*0.5,y+h*0.75); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('R₁='+s.R1, x+w*0.72,y+h*0.25-12); ctx.fillStyle=PNK; ctx.fillText('R₂='+s.R2, x+w*0.72,y+h*0.75+20);
        flow(E,s.ph,x,y,w,h,Math.max(4,Math.round(I*3)),BLU);
      }
      E.tapHint(W/2, H*0.90, 'A/D로 직렬↔병렬 · F/H로 R₂', true);
      E.big((s.mode?'병렬':'직렬')+': 합성저항 R = '+Rtot.toFixed(2)+'Ω,  전류 '+I.toFixed(2)+' A',
        s.mode? '<b>병렬</b>: 1/R = 1/R₁ + 1/R₂ → 합성저항이 가장 작은 저항보다도 작아집니다(길이 여러 개). 전압은 같고 전류가 갈라집니다. 집안 콘센트가 병렬(하나 꺼도 나머지 작동).'
              : '<b>직렬</b>: R = R₁ + R₂ → 합성저항이 커집니다. 같은 전류가 두 저항을 차례로 지나고, 전압은 저항 비로 나뉩니다(전압 분배). 하나 끊기면 전체 차단(옛 전구 줄).'); }
  },

  // ══════════ 12.4 전력 P = VI ══════════
  { id:'phys12_04',
    enter:function(E){ var self=this; this.s={V:6,R:4,ph:0};
      E.controls('<div class="ctrl"><label>전압 V</label><input type="range" id="vv" min="1" max="12" step="1" value="6"><output id="vvo">6</output>'
        +'<label style="margin-left:14px">저항 R (Ω)</label><input type="range" id="rr" min="1" max="10" step="1" value="4"><output id="rro">4</output></div>');
      E.bind('#vv','input',function(e){ self.s.V=+e.target.value; document.getElementById('vvo').textContent=e.target.value; E.blip(320,0.07); });
      E.bind('#rr','input',function(e){ self.s.R=+e.target.value; document.getElementById('rro').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=s.V/s.R, P=s.V*I; s.ph+=I*0.0016;
      var x=W*0.22, y=H*0.28, w=W*0.42, h=H*0.32;
      wire(E,x,y,w,h); battery(E,x,y+h/2); resistor(E,x+w,y+h/2,false,GRN);
      flow(E,s.ph,x,y,w,h,Math.max(4,Math.round(I*3)),BLU);
      // 전구(밝기·후광 ∝ P)
      var br=Math.min(1,P/36), cx=x+w/2, cy=y;
      var grd=ctx.createRadialGradient(cx,cy,2,cx,cy,18+br*34); grd.addColorStop(0,'rgba(255,230,150,'+(0.4+br*0.6)+')'); grd.addColorStop(1,'rgba(255,200,100,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,18+br*34,0,7); ctx.fill();
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,13,0,7); ctx.stroke();
      // 전력 막대
      var bx=W*0.74, baseY=H*0.70, bh=H*0.42, mx=12*12/1*0.5+50;
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,baseY-bh,46,bh); ctx.fillStyle=ORA; ctx.globalAlpha=0.85; ctx.fillRect(bx,baseY-Math.min(1,P/40)*bh,46,Math.min(1,P/40)*bh); ctx.globalAlpha=1;
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('전력', bx+23, baseY+16);
      E.tapHint(W/2, H*0.90, 'A/D·F/H로 전압·저항 — 밝기 ∝ 전력', true);
      E.big('전력 P = VI = I²R = '+P.toFixed(1)+' W', '전력은 단위시간당 전기에너지 소비 — <b>P = VI = I²R = V²/R</b>(단위 와트 W). 전구·히터는 이 전력이 빛·열로 나옵니다. 전압을 올리면 전류도 함께 커져 전력은 <b>제곱</b>으로 급증(전구가 확 밝아짐). 전기요금의 kWh = 전력 × 시간 = 소비한 에너지. 송전선을 고전압으로 보내는 건 같은 전력을 작은 전류로 보내 I²R 손실을 줄이려는 것.'); }
  },

  // ══════════ 12.5 RC 회로 — 지수 충·방전(ODE 적분) ══════════
  { id:'phys12_05',
    enter:function(E){ var self=this; this.s={R:3,C:2,V:8,Q:0,t:0,charging:true,hist:[]};
      E.controls('<div class="ctrl"><label>저항 R</label><input type="range" id="rr" min="1" max="6" step="0.5" value="3"><output id="rro">3.0</output>'
        +'<label style="margin-left:14px">전기용량 C</label><input type="range" id="cc" min="1" max="5" step="0.5" value="2"><output id="cco">2.0</output></div>');
      E.bind('#rr','input',function(e){ self.s.R=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); self.reset(); E.blip(360,0.07); });
      E.bind('#cc','input',function(e){ self.s.C=+e.target.value; document.getElementById('cco').textContent=(+e.target.value).toFixed(1); self.reset(); E.blip(340,0.07); });
      E.setOn([]); },
    reset:function(){ this.s.Q=0; this.s.t=0; this.s.charging=true; this.s.hist=[]; },
    tap:function(E){ var s=this.s; s.charging=!s.charging; s.t=0; s.hist=[]; E.blip(s.charging?440:240,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // RC ODE 적분: 충전 dQ/dt=(V-Q/C)/R, 방전 dQ/dt=-(Q/C)/R
      var h=1/60/6; for(var i=0;i<6;i++){ var Vc=s.Q/s.C; var dQ = s.charging? (s.V-Vc)/s.R : -Vc/s.R; s.Q += dQ*h; if(s.Q<0)s.Q=0; }
      s.t+=1/60;
      var Vc=s.Q/s.C, I=(s.charging?(s.V-Vc):-Vc)/s.R, tau=s.R*s.C;
      s.hist.push(Vc); if(s.hist.length>300) s.hist.shift();
      // 회로
      var x=W*0.14, y=H*0.20, w=W*0.34, hh=H*0.30;
      wire(E,x,y,w,hh); battery(E,x,y+hh/2); resistor(E,x+w*0.5,y,true,GRN);
      // 축전기(오른쪽 변)
      ctx.strokeStyle=BLU; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+w-10,y+hh/2-12); ctx.lineTo(x+w+10,y+hh/2-12); ctx.moveTo(x+w-10,y+hh/2+12); ctx.lineTo(x+w+10,y+hh/2+12); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('C', x+w+16, y+hh/2);
      // Vc-t 그래프
      var gx0=W*0.56, gx1=W*0.93, gy0=H*0.80, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('Vc',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      // V 최대 기준선
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([4,3]); var vy=gy0-(s.V/s.V)*gh*0.92; ctx.beginPath(); ctx.moveTo(gx0,vy); ctx.lineTo(gx1,vy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.fillText('V='+s.V, gx1-30, vy-4);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(v,i){ var X=gx0+(gx1-gx0)*i/300, Y=gy0-(v/s.V)*gh*0.92; if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); }); ctx.stroke();
      E.tapHint(W/2, H*0.92, '화면 탭=충전↔방전 · A/D·F/H로 R·C(시정수 τ=RC)', true);
      E.big((s.charging?'충전 중':'방전 중')+' — Vc = '+Vc.toFixed(2)+' V,  τ = RC = '+tau.toFixed(1)+' s', '축전기는 저항을 통해 <b>지수적으로</b> 충전·방전됩니다 — 엔진이 dQ/dt=(V−Q/C)/R를 적분해 곡선을 만듭니다(공식 베끼기 아님). 처음엔 빠르게, 차오를수록 느리게(전압차가 줄어드니까). <b>시정수 τ=RC</b>가 속도를 정함 — τ 동안 약 63% 도달. R·C를 키우면 느려집니다. 카메라 플래시 충전, 신호 필터, 타이머 회로의 핵심.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
