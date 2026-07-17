/* 물리학 「전자기파」 — 자기(13장)와 빛(14장)을 잇는 다리.
   맥스웰의 종합: 변하는 E가 B를, 변하는 B가 E를 만들어 스스로 퍼져나가는 파동 = 빛.
   골든룰: 화면의 모든 값(파동 모양·c·λ·세기·복사압)은 파동식·실식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys15.json. 엔진=engine.js, 수동적분은 E.frozen 가드(일시정지 호환). */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var ERED='#ff8a6b';   // 전기장 E = 붉음
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 전자기파의 탄생 — 맥스웰의 종합 ══════════
  { id:'phys15_01',
    enter:function(E){ var self=this; this.s={f:1.4,t:0,auto:false};
      E.controls('<div class="ctrl"><label>진동수 f</label><input type="range" id="ff" min="0.6" max="2.6" step="0.1" value="1.4"><output id="ffo">1.4</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(220+self.s.f*120,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen) s.t+=1/60;
      var axY=H*0.46, x0=W*0.10, x1=W*0.92, amp=H*0.20, k=s.f*1.7, om=s.f*2.4, c=om/k;
      // 진행 방향 축(x = 빛이 나아가는 방향)
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x0,axY); ctx.lineTo(x1,axY); ctx.stroke();
      arrow(E, x1-30,axY, x1+6,axY, 'rgba(255,255,255,0.5)', 2);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('진행 방향 (빛의 속력 c)', x1-186, axY-8);
      // 전기장 E (세로, 붉음) — E(x,t)=amp·sin(kx−ωt)
      ctx.strokeStyle=ERED; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=x0;x<=x1;x+=3){ var ph=k*(x-x0)/60 - om*s.t, ey=axY - amp*Math.sin(ph); if(x===x0)ctx.moveTo(x,ey); else ctx.lineTo(x,ey); } ctx.stroke();
      // E 벡터 표본(세로 화살표)
      for(var xv=x0+24;xv<x1;xv+=Math.max(40,90/s.f)){ var ph2=k*(xv-x0)/60-om*s.t, ey2=axY-amp*Math.sin(ph2); arrow(E,xv,axY,xv,ey2,'rgba(255,138,107,0.85)',2); }
      // 자기장 B (E에 수직인 평면 = 화면 안쪽으로, 원근으로 비스듬히 그려 '수직'을 표현) — B는 E와 위상 같음, 크기 B=E/c
      var bsx=0.46, bsy=0.30;   // 지면 속으로 향하는 원근 축
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath();
      for(var x2=x0;x2<=x1;x2+=3){ var ph3=k*(x2-x0)/60-om*s.t, bz=amp*0.78*Math.sin(ph3); if(x2===x0)ctx.moveTo(x2+bz*bsx,axY+bz*bsy); else ctx.lineTo(x2+bz*bsx,axY+bz*bsy); } ctx.stroke();
      // B 벡터 표본(비스듬한 화살표)
      for(var xb=x0+24;xb<x1;xb+=Math.max(40,90/s.f)){ var ph4=k*(xb-x0)/60-om*s.t, bz2=amp*0.78*Math.sin(ph4); arrow(E,xb,axY,xb+bz2*bsx,axY+bz2*bsy,'rgba(122,184,255,0.7)',1.6); }
      // 범례
      ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=ERED; ctx.fillText('■ 전기장 E (세로)', x0, H*0.16);
      ctx.fillStyle=BLU;  ctx.fillText('■ 자기장 B (E에 수직인 평면, B=E/c)', x0, H*0.16+20);
      ctx.fillStyle=DIM;  ctx.fillText('E와 B는 서로 수직 · 진행 방향과도 수직 (횡파)', x0, H*0.16+40);
      E.tapHint(W/2, H*0.93, '진동수 f를 바꾸면 파장 λ가 변합니다 (c=fλ는 일정)', true);
      E.big('전자기파 — 스스로 퍼져나가는 빛  (c = f·λ 일정)', '맥스웰의 종합입니다.'); }
  },

  // ══════════ 2. 빛의 속력 c = 1/√(μ₀ε₀) ══════════
  { id:'phys15_02',
    enter:function(E){ var self=this; this.s={d:384,t:0,auto:false};   // d = 거리(천 km), 지구-달 ≈ 384,000 km
      E.controls('<div class="ctrl"><label>거리 (천 km)</label><input type="range" id="dd" min="40" max="800" step="10" value="384"><output id="ddo">384</output></div>');
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=e.target.value; E.blip(300,0.06); self.s.t=0; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, c=3.0e5;   // c = 3.00×10^5 km/s
      var distKm=s.d*1000, travel=distKm/c;   // 빛이 걸리는 시간(초) = d/c  (골든룰)
      if(!E.frozen) s.t+=1/60; var prog=Math.min(1,(s.t%(travel+0.8))/travel);   // 애니: 빛 펄스가 d를 prog만큼
      var ax=W*0.12, bx=W*0.88, ay=H*0.42;
      // 출발(지구)·도착(목표)
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(ax,ay,16,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('출발', ax, ay+34);
      ctx.fillStyle='#c9c7c0'; ctx.beginPath(); ctx.arc(bx,ay,12,0,7); ctx.fill(); ctx.fillText('도착', bx, ay+32);
      // 경로 + 빛 펄스
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,ay); ctx.stroke();
      var px=ax+(bx-ax)*prog; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(px,ay,7,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(px,ay); ctx.stroke();
      // 상수 → c 유도
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('μ₀ = 4π×10⁻⁷,   ε₀ = 8.85×10⁻¹²   →   c = 1/√(μ₀ε₀) = 3.00×10⁸ m/s', W/2, H*0.70);
      ctx.fillStyle=ORA; ctx.font='600 15px sans-serif'; ctx.fillText('걸리는 시간 = 거리 ÷ c = '+s.d+'천km ÷ c = '+travel.toFixed(2)+' 초', W/2, H*0.78);
      E.tapHint(W/2, H*0.93, '거리를 바꿔 빛이 도달하는 시간을 보세요', true);
      E.big('빛의 속력 c = 1/√(μ₀ε₀) = 3.00×10⁸ m/s', '두 전기 상수만으로 빛의 속력이 나옵니다.'); }
  },

  // ══════════ 3. 전자기 스펙트럼 — 전파부터 감마선까지 모두 빛 ══════════
  { id:'phys15_03',
    enter:function(E){ var self=this; this.s={p:0.583};   // p: 0(전파)~1(감마), log(f). 기본=가시광
      E.controls('<div class="ctrl"><label>파장 ↔ 진동수 (로그)</label><input type="range" id="pp" min="0" max="1" step="0.005" value="0.583"><output id="ppo">가시광</output></div>');
      E.bind('#pp','input',function(e){ self.s.p=+e.target.value; E.blip(200+self.s.p*900,0.05); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, c=3.0e8, h=6.63e-34;
      // log f: 전파 ~10^6 Hz ... 감마 ~10^21 Hz
      var logf=6+s.p*15, f=Math.pow(10,logf), lam=c/f, Eph=h*f/1.6e-19;   // λ=c/f, 광자에너지 E=hf (골든룰)
      var bx=W*0.10, bw=W*0.80, by=H*0.40, bh=44;
      // 스펙트럼 띠(전파→가시→감마, 색상 그라데이션 근사)
      var bands=[['전파',0,0.20,'#3a6ea5'],['적외선',0.20,0.575,'#a5532a'],['가시광',0.575,0.592,'#9b6bff'],['자외선',0.592,0.733,'#6b3aa5'],['X선',0.733,0.867,'#4a9b8f'],['감마선',0.867,1,'#9b3a5a']];
      for(var i=0;i<bands.length;i++){ var b=bands[i]; ctx.fillStyle=b[3]; ctx.globalAlpha=0.55; ctx.fillRect(bx+bw*b[1], by, bw*(b[2]-b[1]), bh); ctx.globalAlpha=1;
        if(b[0]!=='가시광'){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(b[0], bx+bw*(b[1]+b[2])/2, by-8); } }
      // 가시광 무지개 강조(매핑상 아주 좁은 한 칸 — 화살표로 가리킴)
      var visA=0.575, visB=0.592, visG=ctx.createLinearGradient(bx+bw*visA,0,bx+bw*visB,0); visG.addColorStop(0,'#ff4444'); visG.addColorStop(0.5,'#44ff44'); visG.addColorStop(1,'#6644ff');
      ctx.fillStyle=visG; ctx.fillRect(bx+bw*visA,by,bw*(visB-visA),bh);
      ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('가시광', bx+bw*(visA+visB)/2, by-8);
      // 지시자
      var ix=bx+bw*s.p; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ix,by-14); ctx.lineTo(ix,by+bh+14); ctx.stroke();
      arrow(E,ix,by+bh+26,ix,by+bh+14,'#fff',2);
      // 수치
      ctx.fillStyle='#f4f3ee'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('진동수 f ≈ '+f.toExponential(1)+' Hz', W/2, H*0.66);
      ctx.fillText('파장 λ = c/f ≈ '+(lam>=1?lam.toExponential(1)+' m':(lam*1e9).toExponential(1)+' nm'), W/2, H*0.72);
      ctx.fillStyle=ORA; ctx.fillText('광자 에너지 E = hf ≈ '+Eph.toExponential(1)+' eV', W/2, H*0.78);
      // 가시광 라벨
      var lab=s.p<0.20?'전파 — 라디오·와이파이':s.p<0.575?'적외선 — 열·리모컨':s.p<0.592?'가시광 — 눈에 보이는 빛':s.p<0.733?'자외선 — 햇볕·살균':s.p<0.867?'X선 — 투과 촬영':'감마선 — 핵·우주';
      document.getElementById('ppo').textContent=lab.split(' —')[0];
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(lab, W/2, H*0.86);
      E.tapHint(W/2, H*0.93, '슬라이더로 전파→감마선까지 — 전부 같은 전자기파입니다', true);
      E.big('전자기 스펙트럼 — 전파도 X선도 모두 빛 (c = f·λ)', '진동수만 다를 뿐 본질은 하나.'); }
  },

  // ══════════ 4. 빛이 나르는 에너지와 복사압 ══════════
  { id:'phys15_04',
    enter:function(E){ var self=this; this.s={I:6,t:0,vx:0,x:0};   // I = 빛 세기(상대), 돛을 미는 복사압
      E.controls('<div class="ctrl"><label>빛 세기 I</label><input type="range" id="ii" min="1" max="12" step="1" value="6"><output id="iio">6</output></div>');
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(300,0.06); });
      E.setOn([]); },
    reset:function(){ this.s.x=0; this.s.vx=0; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, c=3e8;
      // 복사압 P=I/c, 힘 F=P·A → 돛 가속(상대 단위로 시뮬). 골든룰: 압력·가속 실식.
      var P=s.I/c, a=s.I*0.012;   // 가속도 ∝ 세기 (P=I/c 비례)
      if(!E.frozen){ s.vx+=a; s.x+=s.vx*0.016; if(s.x>W*0.55){ s.x=0; s.vx=0; } }
      var sailX=W*0.30+s.x, cy=H*0.44;
      // 광원(왼쪽) + 빛살
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(W*0.08,cy,18,0,7); ctx.fill();
      for(var r=0;r<s.I;r++){ var yy=cy-30+r*60/s.I; ctx.strokeStyle='rgba(255,200,120,0.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.10,yy); ctx.lineTo(sailX-14,yy); ctx.stroke(); }
      // 태양돛
      ctx.fillStyle='rgba(180,200,230,0.85)'; ctx.fillRect(sailX-6,cy-44,7,88);
      ctx.strokeStyle='#cdd6e6'; ctx.lineWidth=2; ctx.strokeRect(sailX-6,cy-44,7,88);
      // 미는 힘 화살표
      arrow(E,sailX+4,cy,sailX+24+s.I*3,cy,GRN,3);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('태양돛', sailX, cy+62);
      ctx.fillStyle=ORA; ctx.font='600 14px sans-serif';
      ctx.fillText('복사압 P = I / c   (빛은 운동량도 나른다)', W/2, H*0.74);
      ctx.fillStyle=GRN; ctx.fillText('세기 I = '+s.I+' → 돛 속도 '+(s.vx*60).toFixed(1)+' (상대)', W/2, H*0.81);
      E.tapHint(W/2, H*0.93, '빛 세기를 키우면 돛이 더 세게 밀립니다 (복사압)', true);
      E.big('빛은 에너지와 운동량을 나른다 — 복사압 P = I/c', '빛이 물체를 밀 수 있습니다.'); }
  },

  // ══════════ 5. 편광 — 빛의 진동 방향과 말뤼스 법칙 ══════════
  { id:'phys15_05',
    enter:function(E){ var self=this; this.s={th:30,t:0};   // th = 편광판 각도(도)
      E.controls('<div class="ctrl"><label>편광판 각도 θ</label><input type="range" id="tt" min="0" max="90" step="5" value="30"><output id="tto">30°</output></div>');
      E.bind('#tt','input',function(e){ self.s.th=+e.target.value; document.getElementById('tto').textContent=e.target.value+'°'; E.blip(300+self.s.th*4,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen) s.t+=1/60;
      var th=s.th*Math.PI/180, I=Math.cos(th)*Math.cos(th);   // 말뤼스 법칙 I=I₀cos²θ (골든룰)
      var ax=W*0.12, polX=W*0.50, bx=W*0.90, cy=H*0.44, amp=H*0.16;
      // 입사광(수직 편광) — 세로 진동
      ctx.strokeStyle=ERED; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=ax;x<polX;x+=3){ var ph=(x-ax)/26 - s.t*4, ey=cy-amp*Math.sin(ph); if(x===ax)ctx.moveTo(x,ey); else ctx.lineTo(x,ey); } ctx.stroke();
      // 편광판(각도 θ 슬릿)
      ctx.save(); ctx.translate(polX,cy); ctx.rotate(th);
      ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=2; for(var g=-44;g<=44;g+=8){ ctx.beginPath(); ctx.moveTo(g,-50); ctx.lineTo(g,50); ctx.stroke(); }
      ctx.strokeStyle='rgba(150,200,255,0.9)'; ctx.lineWidth=3; ctx.strokeRect(-48,-52,96,104); ctx.restore();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('편광판 θ='+s.th+'°', polX, cy+76);
      // 투과광 — 진폭 cosθ로 줄어든 채 진동(편광판 축 방향)
      var outAmp=amp*Math.cos(th);
      ctx.strokeStyle='rgba(255,138,107,'+(0.35+0.6*I)+')'; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x2=polX;x2<bx;x2+=3){ var ph2=(x2-ax)/26 - s.t*4, ey2=cy-outAmp*Math.sin(ph2); if(x2===polX)ctx.moveTo(x2,ey2); else ctx.lineTo(x2,ey2); } ctx.stroke();
      // 세기 막대
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('말뤼스 법칙:  I = I₀·cos²θ = cos²('+s.th+'°) = '+(I*100).toFixed(0)+'%', W/2, H*0.74);
      var barW=W*0.30, bxx=W/2-barW/2, byy=H*0.80;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.strokeRect(bxx,byy,barW,16);
      ctx.fillStyle=ORA; ctx.fillRect(bxx,byy,barW*I,16);
      E.tapHint(W/2, H*0.93, '편광판을 90°로 돌리면 빛이 완전히 차단됩니다 (cos²90°=0)', true);
      E.big('편광 — 빛의 진동 방향 · 말뤼스 법칙 I = I₀cos²θ', '빛은 어느 방향으로 진동할까요.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
