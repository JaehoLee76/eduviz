/* 물리학 제5장 회전운동 — 회전 EOM을 매 프레임 적분(병진 PhysLab의 회전판)
   각속도/각가속도, 토크 τ=Iα, 관성모멘트 I, 각운동량 보존 L=Iω, 구심력(스프링 끈).
   회전은 ω,θ를 반암시적 오일러로 직접 적분(엔진 시뮬레이션 정신). 구심력은 PhysLab 스프링으로.
   골든룰: 표시 수치는 전부 현재 상태(θ,ω,I,v,r)에서 실시간 계산.
   텍스트=content/phys5.json. 엔진=js/physlab.js, js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';

  // 회전 반암시적 오일러 적분(서브스텝)
  function spin(s, alpha){ var h=1/60/6; for(var i=0;i<6;i++){ s.om += alpha*h; s.th += s.om*h; } }
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2.5;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-10*Math.cos(a-0.4),y2-10*Math.sin(a-0.4)); ctx.lineTo(x2-10*Math.cos(a+0.4),y2-10*Math.sin(a+0.4)); ctx.fill(); }
  function disk(E,cx,cy,R,col){ var ctx=E.ctx; ctx.fillStyle=col; ctx.globalAlpha=0.14; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke(); }

  var scenes=[

  // ══════════ 5.1 각속도·각가속도 — v = rω ══════════
  { id:'phys5_01',
    enter:function(E){ var self=this; this.s={alpha:1.2,th:0,om:0,r:2};
      E.controls('<div class="ctrl"><label>각가속도 α (rad/s²)</label><input type="range" id="aa" min="0" max="3" step="0.2" value="1.2"><output id="aao">1.2</output></div>');
      E.bind('#aa','input',function(e){ self.s.alpha=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      if(!E.frozen){ spin(s, s.alpha); if(s.om>7){ s.om=0; } }
      var cx=W*0.40, cy=H*0.46, R=Math.min(W*0.22,H*0.30), v=s.r*s.om;
      disk(E,cx,cy,R,BLU);
      // 회전 표시 반경선 + 점들
      for(var k=0;k<6;k++){ var a=s.th+k*Math.PI/3; ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a)); ctx.stroke(); }
      var rx=cx+R*Math.cos(s.th), ry=cy+R*Math.sin(s.th);
      arrow(E,cx,cy,rx,ry,ORA,3);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('r='+s.r+' m', cx+R*0.5*Math.cos(s.th)-12, cy+R*0.5*Math.sin(s.th)-8);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(rx,ry,8,0,7); ctx.fill();
      // 접선 속도 벡터(반경에 수직)
      var tx=-Math.sin(s.th), ty=Math.cos(s.th), vl=v*16;
      arrow(E,rx,ry,rx+tx*vl,ry+ty*vl,GRN,2.5);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('v=rω='+v.toFixed(1), rx+tx*vl+6, ry+ty*vl);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('ω='+s.om.toFixed(2)+' rad/s', cx, cy-R-10);
      E.tapHint(W/2, H*0.88, '화면 탭 = 멈춤·재가속', true);
      E.big('ω = '+s.om.toFixed(2)+' rad/s,   v = rω = '+v.toFixed(2)+' m/s', '도는 물체는 각도로 이야기합니다: 각가속도 α가 각속도 ω를 키우고(ω=∫α dt), 그 ω가 각도 θ를 늘립니다 — 직선운동의 a→v→x와 한 글자도 다르지 않은 구조죠. 가장자리 한 점이 실제로 내달리는 속력은 v=rω, 중심에서 멀수록 빠릅니다(r='+s.r+' m). 회전목마 바깥 자리가 더 신나는 이유입니다.'); }
  },

  // ══════════ 5.2 토크 τ = r·F — 회전의 '힘' ══════════
  { id:'phys5_02',
    enter:function(E){ var self=this; this.s={r:1.5,F:4,th:-0.4,om:0,I:2};
      E.controls('<div class="ctrl"><label>지렛대 r (m)</label><input type="range" id="rr" min="0.5" max="2.5" step="0.1" value="1.5"><output id="rro">1.5</output>'
        +'<label style="margin-left:14px">힘 F (N)</label><input type="range" id="ff" min="1" max="8" step="0.5" value="4"><output id="ffo">4.0</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.F=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=-0.4; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var tau=s.r*s.F, alpha=tau/s.I; if(!E.frozen){ spin(s, alpha); if(s.om>7){ s.om=0; } }
      var cx=W*0.40, cy=H*0.48, scale=Math.min(W*0.13,H*0.18);
      // 피벗
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,6,0,7); ctx.fill();
      // 지렛대 막대(길이 r)
      var ex=cx+s.r*scale*Math.cos(s.th), ey=cy+s.r*scale*Math.sin(s.th);
      ctx.strokeStyle=BLU; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke();
      // 끝에 수직 힘(접선 방향)
      var tx=-Math.sin(s.th), ty=Math.cos(s.th);
      arrow(E,ex,ey,ex+tx*s.F*10,ey+ty*s.F*10,ORA,3);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('F='+s.F.toFixed(1)+' N', ex+tx*s.F*10+6, ey+ty*s.F*10);
      ctx.fillStyle=DIM; ctx.fillText('r='+s.r.toFixed(1)+' m', (cx+ex)/2+6, (cy+ey)/2-6);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('τ=r·F='+tau.toFixed(1)+' N·m', cx, cy+scale*0.7+18);
      E.tapHint(W/2, H*0.88, '화면 탭 = 정지', true);
      E.big('토크 τ = r·F = '+tau.toFixed(1)+' N·m  →  α = τ/I = '+alpha.toFixed(2)+' rad/s²', '토크는 "돌리는 능력" = 힘 × 지렛대 길이. 같은 힘이라도 멀리(r↑) 작용하면 토크가 커집니다 — 손잡이가 경첩에서 먼 자리에 달린 이유죠. 그리고 토크는 곧 각가속도가 됩니다: τ = Iα (회전 세계의 F=ma). I='+s.I+' kg·m².'); }
  },

  // ══════════ 5.3 관성모멘트 I — 질량 분포가 회전 저항 ══════════
  { id:'phys5_03',
    enter:function(E){ var self=this; this.s={d:1.5,th:0,om:0,tau:6,m:1};
      E.controls('<div class="ctrl"><label>질량 위치 d (m)</label><input type="range" id="dd" min="0.4" max="2.4" step="0.1" value="1.5"><output id="ddo">1.5</output></div>');
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; this.s.om=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=2*s.m*s.d*s.d, alpha=s.tau/I; if(!E.frozen){ spin(s, alpha); if(s.om>7){ s.om=0; } }
      var cx=W*0.40, cy=H*0.46, scale=Math.min(W*0.15,H*0.20);
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,5,0,7); ctx.fill();
      // 막대(축) 양끝에 질량
      var tx=Math.cos(s.th), ty=Math.sin(s.th), L=s.d*scale;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-tx*L,cy-ty*L); ctx.lineTo(cx+tx*L,cy+ty*L); ctx.stroke();
      [1,-1].forEach(function(sgn){ var mx=cx+sgn*tx*L, my=cy+sgn*ty*L; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,12,0,7); ctx.fill();
        ctx.fillStyle='#10141a'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('m', mx, my); ctx.textBaseline='alphabetic'; });
      // 거리 d 라벨(중심→한쪽 질량)
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('d='+s.d.toFixed(1)+' m', cx+tx*L*0.5, cy+ty*L*0.5-8);
      ctx.fillStyle=BLU; ctx.fillText('I = 2m·d² = '+I.toFixed(2)+' kg·m²', cx, cy-scale-12);
      E.tapHint(W/2, H*0.88, '화면 탭 = 정지', true);
      E.big('I = 2m·d² = '+I.toFixed(2)+' kg·m²  →  같은 토크에 α = '+alpha.toFixed(2)+' rad/s²', '관성모멘트 I = 회전의 "고집"(돌려지지 않으려는 정도) = Σmr². 같은 토크('+s.tau+' N·m)라도 질량이 바깥(d↑)에 있으면 I가 불어나 굼뜨게 돕니다. 곡예사가 긴 장대를 드는 이유, 팽이 가장자리가 묵직한 이유 — 전부 질량을 어디 뒀느냐의 문제!'); }
  },

  // ══════════ 5.4 각운동량 보존 L = Iω — 피겨 스핀 ══════════
  { id:'phys5_04',
    enter:function(E){ var self=this; this.s={r:1.8,th:0,Icore:0.4,m:1,L0:null};
      // 초기 L 고정: I0 = Icore + 2 m r0² , ω0 = 2  →  L0
      var I0=0.4+2*1*1.8*1.8; this.s.L0=I0*2.0;
      E.controls('<div class="ctrl"><label>팔 길이 r (m)</label><input type="range" id="rr" min="0.3" max="2.2" step="0.1" value="1.8"><output id="rro">1.8</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(420-(+e.target.value)*40,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.th=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var I=s.Icore+2*s.m*s.r*s.r, om=s.L0/I;        // 각운동량 보존: ω = L0 / I
      var h=1/60/6; if(!E.frozen)for(var i=0;i<6;i++){ s.th += om*h; }
      var cx=W*0.40, cy=H*0.46, scale=Math.min(W*0.13,H*0.18);
      // 몸통
      disk(E,cx,cy,18,BLU);
      // 두 팔(질량)
      var tx=Math.cos(s.th), ty=Math.sin(s.th), L=s.r*scale;
      [1,-1].forEach(function(sgn){ var mx=cx+sgn*tx*L, my=cy+sgn*ty*L;
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(mx,my); ctx.stroke();
        ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(mx,my,10,0,7); ctx.fill(); });
      // 팔 길이 r 라벨
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('r='+s.r.toFixed(1)+' m', cx+tx*L*0.5, cy+ty*L*0.5-8);
      // 막대 그래프: L(보존)·I·ω
      var baseY=H*0.80, bh=H*0.32, items=[['L (kg·m²/s)',s.L0,GRN],['I (kg·m²)',I,BLU],['ω (rad/s)',om,ORA]], mx2=Math.max(s.L0,I,om,1)*1.15;
      items.forEach(function(it,i){ var x=W*0.66+i*64, hh=it[1]/mx2*bh;
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,baseY-bh,44,bh); ctx.fillStyle=it[2]; ctx.globalAlpha=0.85; ctx.fillRect(x,baseY-hh,44,hh); ctx.globalAlpha=1;
        ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(it[1].toFixed(2), x+22, baseY-hh-6);
        ctx.fillStyle=it[2]; ctx.font='9px sans-serif'; ctx.fillText(it[0], x+22, baseY+16); });
      E.tapHint(W/2, H*0.90, '팔을 당기면(r↓) 회전이 빨라집니다', true);
      E.big('L = Iω = '+s.L0.toFixed(2)+' (보존)   ω = '+om.toFixed(2)+' rad/s', '각운동량 L=Iω는 밖에서 비트는 토크가 없으면 끝까지 변하지 않습니다. 피겨 선수가 팔을 당기면(r↓) I가 줄고, L을 지키려고 ω가 솟아 더 빨리 돌죠 — L은 미동도 없습니다(초록 막대 고정). 다이빙 회전·고양이 착지·중성자별의 무서운 자전이 전부 이 한 줄의 약속!'); }
  },

  // ══════════ 5.5 구심력·원운동 — 줄을 끊으면 직선으로(엔진) ══════════
  { id:'phys5_05',
    enter:function(E){ var self=this; this.s={v0:3.2,r0:2.4,cut:false,trail:[]};
      var w=PhysLab.world({g:0}); this.s.w=w;
      var b=w.add({x:2.4,y:0,m:1,r:0.3,vx:0,vy:3.2,color:GRN}); this.s.b=b;
      this.setSpring(); E.setOn([]);
      E.controls('<div class="ctrl"><label>속력 v (m/s)</label><input type="range" id="vv" min="1.5" max="5" step="0.5" value="3.2"><output id="vvo">3.2</output></div>');
      E.bind('#vv','input',function(e){ self.s.v0=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); self.relaunch(); E.blip(380,0.07); });
    },
    setSpring:function(){ var s=this.s, b=s.b; s.w.clearForces();
      if(!s.cut){ var k=b.m*s.v0*s.v0/(s.r0*s.r0); s.w.force(PhysLab.F.spring(b,0,0,k,0)); } },   // 원궤도: k=mv²/r²
    relaunch:function(){ var s=this.s, b=s.b; b.x=s.r0; b.y=0; b.vx=0; b.vy=s.v0; s.cut=false; s.trail=[]; this.setSpring(); },
    tap:function(E){ var s=this.s; if(!s.cut){ s.cut=true; this.setSpring(); E.blip(240,0.16); } else { this.relaunch(); E.blip(420,0.12); } },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, W=E.W, H=E.H, ctx=E.ctx;
      w.step(1/60,6);
      var cx=W*0.42, cy=H*0.48, scale=Math.min(W*0.12,H*0.16);
      var v=PhysLab.view(cx,cy,scale); s.view=v;
      // 자취
      s.trail.push([b.x,b.y]); if(s.trail.length>140) s.trail.shift();
      ctx.strokeStyle='rgba(95,214,168,0.35)'; ctx.lineWidth=1.5; ctx.beginPath();
      s.trail.forEach(function(p,i){ if(i===0)ctx.moveTo(v.X(p[0]),v.Y(p[1])); else ctx.lineTo(v.X(p[0]),v.Y(p[1])); }); ctx.stroke();
      // 중심
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx,cy,5,0,7); ctx.fill();
      var px=v.X(b.x), py=v.Y(b.y), r=Math.hypot(b.x,b.y), sp=Math.hypot(b.vx,b.vy);
      // 줄(or 끊김)
      var Fc=b.m*sp*sp/r, om=sp/r;
      if(!s.cut){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
        // 구심력 화살표(공→중심 방향, 길이 ∝ F)
        var Fmag=b.m*sp*sp/r, ux=(cx-px), uy=(cy-py), ud=Math.hypot(ux,uy)||1, fl=Math.min(ud*0.85, Fmag*7);
        arrow(E,px,py,px+ux/ud*fl,py+uy/ud*fl,ORA,2.5);
        ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('F='+Fc.toFixed(1)+' N', px+ux/ud*fl+4, py+uy/ud*fl);
      }
      // 속도 화살표(접선)
      arrow(E,px,py,px+b.vx*scale*0.5,py-b.vy*scale*0.5,BLU,2.5);
      ctx.fillStyle=BLU; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('v='+sp.toFixed(1), px+b.vx*scale*0.5+4, py-b.vy*scale*0.5);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px,py,8,0,7); ctx.fill();
      E.tapHint(W/2, H*0.90, s.cut?'화면 탭=줄 다시 매기':'화면을 눌러 줄 끊기', true);
      if(s.cut) E.big('줄을 끊으면 직선으로! (관성)', '당겨 주던 힘이 사라지자 공은 바깥이 아니라 가던 방향, 즉 접선으로 곧장 날아갑니다 — 뉴턴 1법칙. 원운동 내내 "안으로 끌어당기는 힘"이 줄곧 필요했던 것이죠. 원심력은 가짜 힘, 진짜 주인공은 중심으로 당기는 구심력입니다.');
      else E.big('구심력 F = mv²/r = '+Fc.toFixed(2)+' N (중심 방향)', '속력이 한결같은 원운동도 엄연한 "가속" 운동입니다 — 크기는 그대로여도 속도의 방향이 한순간도 안 쉬고 바뀌니까요. 그 방향을 휘어 주는 힘이 구심력 F=mv²/r, 언제나 중심을 향합니다. v='+sp.toFixed(2)+' m/s, ω=v/r='+om.toFixed(2)+' rad/s. 줄을 끊어 보세요!'); }
  },

  // ─── 심화: 굴림운동 경주 (관성모멘트가 결정) ───
  { id:'phys5_03_rolling', branchOf:'phys5_03', ord:1,
    enter:function(E){ this.s={ang:25,d:[0,0,0],v:[0,0,0]}; E.setOn([]);
      var self=this; E.controls('<div class="ctrl"><label>경사각 θ (도)</label><input type="range" id="ag" min="10" max="40" step="5" value="25"><output id="ago">25</output></div>');
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; self.s.d=[0,0,0]; self.s.v=[0,0,0]; document.getElementById('ago').textContent=e.target.value; E.blip(360,0.07); }); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8, th=s.ang*Math.PI/180;
      // I/mr² : 속이 꽉 찬 구 0.4, 원판 0.5, 고리 1.0 → a = g sinθ/(1+I/mr²)
      var objs=[['속이 꽉 찬 구',0.4,GRN],['원판',0.5,ORA],['고리',1.0,PNK]];
      var dx=Math.cos(th), dy=Math.sin(th), nx=-Math.sin(th), ny=Math.cos(th);   // 진행·법선 방향
      var ox=W*0.14, oy=H*0.42, L=Math.min(W*0.52,H*0.40), laneV=Math.min(H*0.10,58), R=11, fin=L/40;
      objs.forEach(function(o,i){
        var lx=ox, ly=oy+i*laneV;                                   // 평행 레인(같은 기울기·수직 분리 → 겹치지 않음)
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+dx*L,ly+dy*L); ctx.stroke();
        if(!E.frozen){ var a=g*Math.sin(th)/(1+o[1]); s.v[i]+=a*(1/60); s.d[i]+=s.v[i]*(1/60); }
        if(s.d[i]>fin) s.d[i]=fin;
        var f=s.d[i]/fin, px=lx+dx*L*f, py=ly+dy*L*f, cx=px-nx*R, cy=py-ny*R, done=s.d[i]>=fin;   // 공은 경사면 위에 얹힘
        ctx.strokeStyle=o[2]; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
        if(o[1]<0.6){ ctx.fillStyle=o[2]; ctx.globalAlpha=0.28; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.globalAlpha=1; }
        ctx.fillStyle=o[2]; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(o[0]+' (a='+(g*Math.sin(th)/(1+o[1])).toFixed(2)+')'+(done?'  ✓ 도착':''), lx-2, ly-7); });
      E.tapHint(W/2, H*0.92, '경사각을 바꿔 보세요 — 속이 꽉 찬 구가 항상 1등', true);
      E.big('굴림운동: a = g·sinθ/(1+I/mr²) — 관성모멘트가 순위를 정함', '경사면을 굴러 내려오는 물체의 가속도는 <b>질량도 반지름도 상관없이</b> 오직 <b>I/mr²(질량을 어디 뒀느냐)</b>로 정해집니다 — a = g sinθ/(1+I/mr²). 질량이 한가운데 모인 <b>속이 꽉 찬 구</b>(I/mr²=0.4)가 1등, 원판(0.5)이 그다음, 무게가 가장자리로 빠진 <b>고리</b>(1.0)가 꼴찌. 꼭대기의 위치에너지가 내려오는 병진운동E와 빙글빙글 회전운동E로 나뉘는데, I가 클수록 회전 쪽에 더 많이 새 나가 앞으로 나아가는 속도가 처진 거죠. 갈릴레오 빗면 실험의 회전 버전입니다.'); }
  },

  // ─── 심화: 토크 평형 (정역학·시소) ───
  { id:'phys5_02_torqeq', branchOf:'phys5_02', ord:1,
    enter:function(E){ var self=this; this.s={m1:3,d1:2,m2:2};
      E.controls('<div class="ctrl"><label>왼쪽 추 m₁ 위치 d₁</label><input type="range" id="d1" min="1" max="3" step="0.5" value="2"><output id="d1o">2.0</output>'
        +'<label style="margin-left:14px">오른쪽 추 m₂</label><input type="range" id="m2" min="1" max="5" step="1" value="2"><output id="m2o">2</output></div>');
      E.bind('#d1','input',function(e){ self.s.d1=+e.target.value; document.getElementById('d1o').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#m2','input',function(e){ self.s.m2=+e.target.value; document.getElementById('m2o').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // d2는 m1·d1 = m2·d2 평형 위치. 불균형이면 기울기 표시
      var tau1=s.m1*s.d1, d2fix=2.5, tau2=s.m2*d2fix, net=tau2-tau1, ang=Math.max(-0.25,Math.min(0.25,net*0.03));
      var cx=W*0.42, cy=H*0.46, sc=Math.min(W*0.07,H*0.10);
      // 받침대
      ctx.fillStyle=DIM; ctx.beginPath(); ctx.moveTo(cx-14,cy+40); ctx.lineTo(cx+14,cy+40); ctx.lineTo(cx,cy+6); ctx.fill();
      // 막대(기울기 ang)
      var c=Math.cos(ang), sn=Math.sin(ang);
      function pt(dx){ return [cx+dx*sc*c, cy - dx*sc*sn]; }
      var lp=pt(-3.5), rp=pt(3.5); ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(lp[0],lp[1]); ctx.lineTo(rp[0],rp[1]); ctx.stroke();
      // 추(왼쪽 m1 at d1, 오른쪽 m2 at d2fix)
      function wt(dx,m,col,dlab){ var p=pt(dx), sz=12+m*4; ctx.fillStyle=col; ctx.globalAlpha=0.3; ctx.fillRect(p[0]-sz/2,p[1]-sz,sz,sz); ctx.globalAlpha=1; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(p[0]-sz/2,p[1]-sz,sz,sz); ctx.fillStyle=col; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(m+'kg',p[0],p[1]-sz/2);
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.fillText('d='+dlab.toFixed(1)+'m',p[0],p[1]+14); }
      // 받침점 라벨
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('받침점 O', cx, cy+54);
      wt(-s.d1,s.m1,GRN,s.d1); wt(d2fix,s.m2,ORA,d2fix);
      var bal=Math.abs(net)<0.01;
      E.tapHint(W/2, H*0.90, '왼쪽 위치·오른쪽 질량을 바꿔 평형을 맞춰 보세요', true);
      E.big('토크 평형: m₁d₁ = '+tau1.toFixed(1)+' vs m₂d₂ = '+tau2.toFixed(1)+(bal?'  → 평형!':(net>0?'  → 오른쪽으로 기욺':'  → 왼쪽으로 기욺')), '회전이 멈춰 가만히 있으려면 <b>양쪽이 돌리려는 토크가 똑같아야</b> 합니다(정역학). 시소는 무게×거리(m·d, 토크)가 맞아떨어질 때 균형 — 무거운 사람은 받침점 가까이 다가앉아 거리를 줄여야 가벼운 사람과 평형이 되죠. 알짜 토크도 0, 알짜 힘도 0이면 물체는 가만히 멈춰 있습니다. 다리·건물·크레인, 그리고 똑바로 선 우리 몸뚱이가 무너지지 않는 것이 전부 이 힘과 토크의 줄다리기 — 정역학입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
