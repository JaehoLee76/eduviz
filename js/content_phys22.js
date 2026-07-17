/* 물리학 「전자기 유도」 — 변하는 자기장이 전기를 낳는다. 발전기·변압기·무선충전의 심장.
   자기선속·패러데이/렌츠 법칙·발전기·변압기·인덕턴스. 자기(앞 장)와 전자기파(뒤 장)를 잇는다.
   골든룰: 자기선속 Φ=BAcosθ, 유도기전력 ε=−dΦ/dt, 변압 Vs/Vp=Ns/Np, 인덕터 에너지 ½LI²로 실시간 계산.
   동작=이 파일, 텍스트=content/phys22.json. 패러데이·발전기·변압기는 phys13(자기)에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var NRED='#ff7a6b', SBLU='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 자기선속 Φ = B·A·cosθ ══════════
  { id:'phys22_01',
    enter:function(E){ var self=this; this.s={th:0,B:3};
      E.controls('<div class="ctrl"><label>코일 기울기 θ (도)</label><input type="range" id="tt" min="0" max="90" step="5" value="0"><output id="tto">0</output>'
        +'<label style="margin-left:14px">자기장 B</label><input type="range" id="bb" min="1" max="5" step="0.5" value="3"><output id="bbo">3.0</output></div>');
      E.bind('#tt','input',function(e){ self.s.th=+e.target.value; document.getElementById('tto').textContent=e.target.value; E.blip(300+self.s.th*4,0.06); });
      E.bind('#bb','input',function(e){ self.s.B=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var A=1, th=s.th*Math.PI/180, flux=s.B*A*Math.cos(th);   // Φ=B·A·cosθ (골든룰)
      var cx=W*0.42, cy=H*0.44, R=Math.min(W*0.14,H*0.20);
      // 균일 자기장(세로 위로 향하는 장선)
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1.5;
      for(var lx=cx-R*1.6; lx<=cx+R*1.6; lx+=24){ arrow(E,lx,cy+R*1.5,lx,cy-R*1.5,'rgba(122,184,255,0.4)',1.4); }
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('자기장 B (위로)', cx+R*1.7, cy-R);
      // 코일(타원, 기울기 θ → 가로폭이 cosθ로 줄어듦 = 장이 통과하는 단면)
      var wEll=R*Math.cos(th);
      ctx.strokeStyle=ORA; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(cx,cy,Math.max(2,wEll),R,0,0,7); ctx.stroke();
      // 법선
      var nx=Math.sin(th), ny=-Math.cos(th); arrow(E,cx,cy,cx+nx*R*1.1,cy+ny*R*1.1,GRN,2); ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('법선', cx+nx*R*1.1+4, cy+ny*R*1.1);
      // 통과하는 장선 강조(코일 안)
      ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=2; for(var gx=cx-wEll+4; gx<cx+wEll; gx+=18){ arrow(E,gx,cy+R*0.8,gx,cy-R*0.8,'rgba(143,227,181,0.7)',1.8); }
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('자기선속 Φ = B·A·cosθ = '+s.B.toFixed(1)+'×1×cos'+s.th+'° = '+flux.toFixed(2), W/2, H*0.74);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(s.th===0?'장에 수직 → 최대 선속(가장 많은 장선 통과)':s.th>=90?'장과 나란 → 선속 0(장선이 통과 못 함)':'기울일수록 통과하는 장선이 줄어듦', W/2, H*0.82);
      E.tapHint(W/2, H*0.92, '코일을 기울이면 통과하는 자기장(선속)이 cosθ로 줄어듭니다', true);
      E.big('자기선속 Φ = B·A·cosθ — 코일을 뚫는 자기장의 양', '코일을 통과하는 자기장의 총량입니다.'); }
  },

  // ══════════ 2. 패러데이·렌츠 법칙 — 변화가 전기를 낳는다 ══════════
  { id:'phys22_02',
    enter:function(E){ var self=this; this.s={mx:-3,vmag:2,dir:1,t:0};
      E.controls('<div class="ctrl"><label>자석 속도</label><input type="range" id="vv" min="0" max="4" step="0.5" value="2"><output id="vvo">2.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.vmag=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      if(!E.frozen){ s.mx += s.dir*s.vmag*(1/60); if(s.mx>2){ s.mx=2; s.dir=-1; } if(s.mx<-5){ s.mx=-5; s.dir=1; } }
      var cx=W*0.5, cy=H*0.42, sc=Math.min(W*0.06,H*0.09);
      function X(x){return cx+x*sc;}
      var coilX=X(0); ctx.strokeStyle=DIM; ctx.lineWidth=2.5;
      for(var i=0;i<6;i++){ ctx.beginPath(); ctx.ellipse(coilX+i*10,cy,10,34,0,0,7); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('코일', coilX+25, cy-44);
      var magX=X(s.mx); ctx.fillStyle=NRED; ctx.fillRect(magX,cy-16,34,32); ctx.fillStyle=SBLU; ctx.fillRect(magX-34,cy-16,34,32);
      ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('N',magX+17,cy); ctx.fillText('S',magX-17,cy); ctx.textBaseline='alphabetic';
      var dist=Math.abs(s.mx), prox=Math.exp(-dist*dist/4), emf=s.dir*s.vmag*prox*(s.mx<0.5?1:0.3);
      var gx=W*0.78, gy=H*0.42; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(gx,gy,40,Math.PI,0); ctx.stroke();
      var ang=Math.PI/2 - Math.max(-1.2,Math.min(1.2,emf*0.6)); ctx.strokeStyle=ORA; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+38*Math.cos(Math.PI+ang),gy-38*Math.sin(ang)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('검류계', gx, gy+24);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('유도 EMF ∝ '+(Math.abs(emf)<0.05?'0 (정지)':(emf>0?'+':'−')+Math.abs(emf).toFixed(1)), gx, gy+40);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(coilX+55,cy+34); ctx.lineTo(gx-40,gy+40); ctx.moveTo(coilX+55,cy-34); ctx.lineTo(gx+40,gy+40); ctx.stroke();
      E.tapHint(W/2, H*0.90, '자석이 빠를수록 큰 기전력 · 정지하면 0(변화가 핵심)', true);
      E.big('패러데이 법칙 EMF = −N·dΦ/dt (변화가 전기를 낳는다)', '자속이 변할 때만 전류가 흐릅니다.'); }
  },

  // ══════════ 3. 발전기 — 회전이 만드는 교류 ══════════
  { id:'phys22_03',
    enter:function(E){ var self=this; this.s={w:2,th:0,hist:[]};
      E.controls('<div class="ctrl"><label>회전 속도 ω</label><input type="range" id="ww" min="0.5" max="5" step="0.5" value="2"><output id="wwo">2.0</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.w*60,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      if(!E.frozen) s.th += s.w*(1/60);
      var cx=W*0.30, cy=H*0.42, R=Math.min(W*0.11,H*0.17);
      ctx.fillStyle='rgba(255,122,107,0.15)'; ctx.fillRect(cx-R*1.5,cy-R*1.4,R*3,R*0.4);
      ctx.fillStyle='rgba(107,168,255,0.15)'; ctx.fillRect(cx-R*1.5,cy+R,R*3,R*0.4);
      ctx.fillStyle=NRED; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('N', cx-R*1.7, cy-R*1.1);
      ctx.fillStyle=SBLU; ctx.fillText('S', cx-R*1.7, cy+R*1.3);
      var c=Math.cos(s.th), w2=Math.abs(c)*R*1.3+3;
      ctx.strokeStyle=ORA; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(cx,cy,w2,R,0,0,7); ctx.stroke();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('회전 코일 (ω='+s.w.toFixed(1)+')', cx, cy+R*1.6);
      ctx.fillStyle=c>0?GRN:DIM; ctx.beginPath(); ctx.arc(cx+w2,cy,5,0,7); ctx.fill();
      var emf=s.w*Math.sin(s.th); if(!E.frozen){ s.hist.push(emf); if(s.hist.length>240) s.hist.shift(); }
      var gx0=W*0.52, gx1=W*0.95, gy0=H*0.44, gh=H*0.30;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0-gh); ctx.lineTo(gx0,gy0+gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('EMF', gx0+3, gy0-gh+2); ctx.fillText('t', gx1-8, gy0+14);
      ctx.fillStyle=ORA; ctx.fillText('EMF = '+emf.toFixed(2), gx0+34, gy0-gh+2);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(v,i){ var x=gx0+(gx1-gx0)*i/240, y=gy0-(v/5)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      E.tapHint(W/2, H*0.90, '빠르게 돌릴수록 큰 교류가 나옵니다', true);
      E.big('발전기 — 코일 회전이 교류(AC)를 만든다  EMF ∝ ω·sin(ωt)', '돌리면 교류가 나옵니다.'); }
  },

  // ══════════ 4. 변압기 — 전압을 올리고 내린다 ══════════
  { id:'phys22_04',
    enter:function(E){ var self=this; this.s={Np:4,Ns:8,Vp:10,t:0};
      E.controls('<div class="ctrl"><label>1차 감은 수 Np</label><input type="range" id="np" min="2" max="10" step="1" value="4"><output id="npo">4</output>'
        +'<label style="margin-left:14px">2차 감은 수 Ns</label><input type="range" id="ns" min="2" max="12" step="1" value="8"><output id="nso">8</output></div>');
      E.bind('#np','input',function(e){ self.s.Np=+e.target.value; document.getElementById('npo').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#ns','input',function(e){ self.s.Ns=+e.target.value; document.getElementById('nso').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var Vs=s.Vp*s.Ns/s.Np, cy=H*0.44;
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=6; ctx.strokeRect(W*0.40,cy-60,W*0.16,120);
      var px=W*0.38; ctx.strokeStyle=BLU; ctx.lineWidth=2.5; for(var i=0;i<s.Np;i++){ var y=cy-50+i*(100/(s.Np-1||1)); ctx.beginPath(); ctx.ellipse(px,y,10,6,0,0,7); ctx.stroke(); }
      var sx=W*0.58; ctx.strokeStyle=ORA; for(i=0;i<s.Ns;i++){ var y2=cy-50+i*(100/(s.Ns-1||1)); ctx.beginPath(); ctx.ellipse(sx,y2,10,6,0,0,7); ctx.stroke(); }
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('변하는 자속 Φ', W*0.48, cy-70);
      ctx.fillStyle=BLU; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('1차 Vp='+s.Vp+'V (Np='+s.Np+')', px, cy+80);
      ctx.fillStyle=ORA; ctx.fillText('2차 Vs='+Vs.toFixed(1)+'V (Ns='+s.Ns+')', sx, cy+80);
      var type = s.Ns>s.Np?'승압':(s.Ns<s.Np?'강압':'1:1');
      E.tapHint(W/2, H*0.90, '감은 수 비를 바꿔 전압을 올리고 내리세요', true);
      E.big('변압기('+type+'): Vs/Vp = Ns/Np → Vs = '+Vs.toFixed(1)+' V', '감은 수 비로 전압을 바꿉니다.'); }
  },

  // ══════════ 5. 인덕턴스 — 코일이 변화를 거부한다 (½LI²) ══════════
  { id:'phys22_05',
    enter:function(E){ var self=this; this.s={L:3,t:0,I:0,target:1,dir:1};
      E.controls('<div class="ctrl"><label>인덕턴스 L</label><input type="range" id="ll" min="1" max="6" step="0.5" value="3"><output id="llo">3.0</output></div>');
      E.bind('#ll','input',function(e){ self.s.L=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 전류를 목표값까지 천천히 올림(인덕터가 변화 거부 → L 클수록 느리게). 역기전력 ε=−L·dI/dt
      var rate = 1/s.L, dI=0;
      if(!E.frozen){ dI=(s.target-s.I)*rate*0.06; s.I += dI; if(Math.abs(s.target-s.I)<0.02){ s.t+=1/60; if(s.t>1.2){ s.target = s.target>0.5?0:1; s.t=0; } } }
      var emf = -s.L*dI*60;   // 역기전력 ∝ L·dI/dt (골든룰)
      var energy = 0.5*s.L*s.I*s.I;   // 저장 에너지 ½LI²
      var cx=W*0.30, cy=H*0.40;
      // 인덕터(코일)
      ctx.strokeStyle=ORA; ctx.lineWidth=3; for(var i=0;i<6;i++){ ctx.beginPath(); ctx.arc(cx-50+i*20,cy,11,Math.PI,0,true); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('인덕터 L='+s.L.toFixed(1), cx, cy+34);
      // 전류 흐름(굵기 ∝ I)
      ctx.strokeStyle=GRN; ctx.lineWidth=Math.max(1,s.I*5); ctx.beginPath(); ctx.moveTo(cx-90,cy); ctx.lineTo(cx-72,cy); ctx.moveTo(cx+50,cy); ctx.lineTo(cx+80,cy); ctx.stroke();
      arrow(E,cx+60,cy,cx+90,cy,GRN,2);
      // 전류 막대 + 목표
      var bx=W*0.55, by=H*0.30, bw=W*0.32;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(bx,by,bw,18); ctx.fillStyle=GRN; ctx.fillRect(bx,by,bw*s.I,18);
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(bx+bw*s.target,by-4); ctx.lineTo(bx+bw*s.target,by+22); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('전류 I = '+s.I.toFixed(2)+' (목표로 서서히)', bx, by-8);
      // 역기전력 + 에너지
      ctx.fillStyle=NRED; ctx.font='13px sans-serif'; ctx.fillText('역기전력 ε = −L·dI/dt = '+emf.toFixed(2)+' (변화를 거부)', bx, by+44);
      ctx.fillStyle=ORA; ctx.fillText('저장 에너지 U = ½LI² = '+energy.toFixed(2), bx, by+66);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('L이 클수록 전류가 더 천천히 변합니다(관성처럼)', bx, by+92);
      E.tapHint(W/2, H*0.92, 'L을 키우면 전류가 더 느리게 변합니다(코일은 변화를 싫어함)', true);
      E.big('인덕턴스 — 코일은 전류 변화를 거부한다 (U = ½LI²)', '코일은 전류의 관성입니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
