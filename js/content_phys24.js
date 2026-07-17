/* 물리학 「교류 회로」 — 출렁이는 전기. 실효값·리액턴스·임피던스·공명·LC진동.
   전자기유도(앞)의 인덕터·축전기가 교류에서 어떻게 어울리나 → 라디오 동조의 원리.
   골든룰: V_rms=V₀/√2, X_C=1/ωC, X_L=ωL, Z=√(R²+(X_L−X_C)²), 공명 ω₀=1/√(LC), LC진동 모두 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys24.json. 수동적분 장면은 E.frozen 가드. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', RED='#ff7a6b';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 교류와 실효값(RMS) ══════════
  { id:'phys24_01',
    enter:function(E){ var self=this; this.s={V0:4,t:0};
      E.controls('<div class="ctrl"><label>최대 전압 V₀</label><input type="range" id="vv" min="2" max="6" step="0.5" value="4"><output id="vvo">4.0</output></div>');
      E.bind('#vv','input',function(e){ self.s.V0=+e.target.value; document.getElementById('vvo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var Vrms=s.V0/Math.SQRT2;   // 실효값 = V₀/√2 (골든룰)
      var gx0=W*0.10, gx1=W*0.90, cy=H*0.42, amp=H*0.22;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,cy); ctx.lineTo(gx1,cy); ctx.stroke();
      // 사인파 V=V₀sin(ωt) (스크롤)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.6; ctx.beginPath();
      for(var x=gx0;x<=gx1;x+=2){ var ph=(x-gx0)/40 - s.t*3, v=Math.sin(ph)*s.V0; var y=cy-v/6*amp; if(x===gx0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // V₀, Vrms 선
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.setLineDash([5,4]);
      [['V₀',s.V0,'#fff'],['Vrms',Vrms,GRN],['−V₀',-s.V0,'#fff']].forEach(function(L){ var y=cy-L[1]/6*amp; ctx.strokeStyle=L[2]; ctx.beginPath(); ctx.moveTo(gx0,y); ctx.lineTo(gx1,y); ctx.stroke(); ctx.fillStyle=L[2]; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText(L[0], gx1+2, y+3); });
      ctx.setLineDash([]);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('실효값 Vrms = V₀/√2 = '+s.V0.toFixed(1)+'/√2 = '+Vrms.toFixed(2)+' V', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('교류는 +−로 출렁여 평균 0 — \'실효값\'이 같은 일을 하는 직류 전압(콘센트 220V=실효값)', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '교류 전압의 실효값은 최대값의 1/√2 (≈0.707배)입니다', true);
      E.big('교류 — 실효값 Vrms = V₀/√2', '출렁이는 전압의 \'유효한\' 크기.'); }
  },

  // ══════════ 2. 리액턴스 — R·C·L의 교류 응답 ══════════
  { id:'phys24_02',
    enter:function(E){ var self=this; this.s={w:3};
      E.controls('<div class="ctrl"><label>각진동수 ω</label><input type="range" id="ww" min="0.5" max="6" step="0.25" value="3"><output id="wwo">3.0</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.w*90,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, R=3, C=0.5, L=0.5;
      var Xc=1/(s.w*C), Xl=s.w*L;   // 용량 리액턴스 1/ωC, 유도 리액턴스 ωL (골든룰)
      var gx0=W*0.12, gx1=W*0.90, gy0=H*0.72, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('리액턴스(저항)', gx0+4,gy0-gh+2); ctx.textAlign='right'; ctx.fillText('진동수 ω →', gx1, gy0+16);
      var mxv=8;
      // 저항 R(수평선)
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); var yR=gy0-R/mxv*gh; ctx.moveTo(gx0,yR); ctx.lineTo(gx1,yR); ctx.stroke(); ctx.fillStyle=DIM; ctx.fillText('R (일정)', gx1-60, yR-4);
      // Xc=1/ωC (감소)
      ctx.strokeStyle=BLU; ctx.lineWidth=2.4; ctx.beginPath(); for(var w=0.5;w<=6;w+=0.05){ var xc=1/(w*C), x=gx0+(w-0.5)/5.5*(gx1-gx0), y=gy0-Math.min(gh,xc/mxv*gh); if(w<=0.5)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // Xl=ωL (증가)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.4; ctx.beginPath(); for(var w2=0.5;w2<=6;w2+=0.05){ var xl=w2*L, x=gx0+(w2-0.5)/5.5*(gx1-gx0), y=gy0-Math.min(gh,xl/mxv*gh); if(w2<=0.5)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 현재 ω
      var mx=gx0+(s.w-0.5)/5.5*(gx1-gx0); ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(mx,gy0); ctx.lineTo(mx,gy0-gh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('축전기 Xc=1/ωC='+Xc.toFixed(2)+' (전류가 전압보다 앞섬)', W*0.10, H*0.80);
      ctx.fillStyle=ORA; ctx.fillText('인덕터 Xl=ωL='+Xl.toFixed(2)+' (전류가 전압보다 뒤짐)', W*0.10, H*0.87);
      E.tapHint(W/2, H*0.93, 'ω↑: 축전기는 잘 통하고(Xc↓), 인덕터는 막습니다(Xl↑)', true);
      E.big('리액턴스 — Xc=1/ωC (감소) · Xl=ωL (증가)', '주파수에 따라 다르게 반응합니다.'); }
  },

  // ══════════ 3. RLC 임피던스 Z ══════════
  { id:'phys24_03',
    enter:function(E){ var self=this; this.s={w:3,R:3};
      E.controls('<div class="ctrl"><label>각진동수 ω</label><input type="range" id="ww" min="0.5" max="6" step="0.25" value="3"><output id="wwo">3.0</output>'
        +'<label style="margin-left:14px">저항 R</label><input type="range" id="rr" min="1" max="6" step="0.5" value="3"><output id="rro">3.0</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.w*90,0.06); });
      E.bind('#rr','input',function(e){ self.s.R=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, C=0.5, L=0.5, V=6;
      var Xc=1/(s.w*C), Xl=s.w*L, X=Xl-Xc, Z=Math.sqrt(s.R*s.R+X*X), I=V/Z;   // 임피던스 Z=√(R²+(Xl−Xc)²) (골든룰)
      // 임피던스 삼각형
      var ox=W*0.26, oy=H*0.62, sc=18;
      ctx.strokeStyle=DIM; ctx.lineWidth=2.5; arrow(E,ox,oy,ox+s.R*sc,oy,DIM,2.5); ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('R='+s.R.toFixed(1), ox+s.R*sc/2, oy+18);
      var vy=oy-X*sc; ctx.strokeStyle=X>=0?ORA:BLU; arrow(E,ox+s.R*sc,oy,ox+s.R*sc,vy,X>=0?ORA:BLU,2.5);
      ctx.fillStyle=X>=0?ORA:BLU; ctx.fillText('Xl−Xc='+X.toFixed(1), ox+s.R*sc+44, (oy+vy)/2);
      ctx.strokeStyle=GRN; ctx.lineWidth=2.8; arrow(E,ox,oy,ox+s.R*sc,vy,GRN,2.8); ctx.fillStyle=GRN; ctx.fillText('Z='+Z.toFixed(2), ox+s.R*sc/2-30, vy-6);
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Xc=1/ωC='+Xc.toFixed(2)+'   Xl=ωL='+Xl.toFixed(2), W*0.58, H*0.40);
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('임피던스 Z = √(R²+(Xl−Xc)²) = '+Z.toFixed(2), W*0.58, H*0.50);
      ctx.fillStyle=ORA; ctx.fillText('전류 I = V/Z = '+I.toFixed(2)+' A', W*0.58, H*0.58);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(Math.abs(X)<0.3?'Xl≈Xc → 임피던스 최소 = 공명!':'리액턴스가 전류를 제한', W*0.58, H*0.66);
      E.tapHint(W/2, H*0.92, 'ω를 바꾸면 Z가 변합니다 — Xl=Xc일 때 Z 최소(전류 최대)', true);
      E.big('RLC 임피던스 Z = √(R²+(Xl−Xc)²) = '+Z.toFixed(2), '교류의 \'총 저항\'은 벡터 합입니다.'); }
  },

  // ══════════ 4. 공명 — 라디오가 한 방송을 고르는 법 ══════════
  { id:'phys24_04',
    enter:function(E){ var self=this; this.s={w:2.5};
      E.controls('<div class="ctrl"><label>주파수 ω (동조 다이얼)</label><input type="range" id="ww" min="0.5" max="6" step="0.1" value="2.5"><output id="wwo">2.5</output></div>');
      E.bind('#ww','input',function(e){ self.s.w=+e.target.value; document.getElementById('wwo').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.w*100,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, R=1, C=0.5, L=0.5, V=6;
      var w0=1/Math.sqrt(L*C);   // 공명 각진동수 ω₀=1/√(LC) (골든룰)
      function curI(w){ var X=w*L-1/(w*C); return V/Math.sqrt(R*R+X*X); }
      var Imax=V/R;
      var gx0=W*0.12, gx1=W*0.90, gy0=H*0.74, gh=H*0.52;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('전류 I', gx0+4,gy0-gh+2); ctx.textAlign='right'; ctx.fillText('주파수 ω →', gx1, gy0+16);
      // I(ω) 공명 곡선
      ctx.strokeStyle=GRN; ctx.lineWidth=2.6; ctx.beginPath(); for(var w=0.5;w<=6;w+=0.03){ var x=gx0+(w-0.5)/5.5*(gx1-gx0), y=gy0-curI(w)/Imax*gh; if(w<=0.5)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 공명 ω₀ 선
      var w0x=gx0+(w0-0.5)/5.5*(gx1-gx0); ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(w0x,gy0); ctx.lineTo(w0x,gy0-gh); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('ω₀='+w0.toFixed(2), w0x, gy0-gh-2);
      // 현재 ω
      var mx=gx0+(s.w-0.5)/5.5*(gx1-gx0), my=gy0-curI(s.w)/Imax*gh; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(mx,gy0); ctx.lineTo(mx,my); ctx.stroke(); ctx.setLineDash([]);
      var onRes=Math.abs(s.w-w0)<0.2;
      ctx.fillStyle=onRes?GRN:'#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(onRes?'★ 공명! ω≈ω₀ → 전류 최대 (이 방송이 잡힘)':'ω₀에서 벗어남 → 전류 작음 (잡음)', W/2, H*0.84);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('라디오 동조: LC를 조절해 ω₀를 원하는 방송 주파수에 맞춤', W/2, H*0.90);
      E.tapHint(W/2, H*0.95, '다이얼(ω)을 ω₀에 맞추면 전류가 치솟습니다 — 그 방송만 선택', true);
      E.big('공명 ω₀ = 1/√(LC) — 한 주파수만 크게 (라디오 동조)', 'LC가 고른 주파수에서 크게 울립니다.'); }
  },

  // ══════════ 5. LC 진동 — 전기의 진자 ══════════
  { id:'phys24_05',
    enter:function(E){ var self=this; this.s={L:1,C:1,t:0};
      E.controls('<div class="ctrl"><label>인덕턴스 L</label><input type="range" id="ll" min="0.5" max="3" step="0.5" value="1"><output id="llo">1.0</output>'
        +'<label style="margin-left:14px">전기용량 C</label><input type="range" id="cc" min="0.5" max="3" step="0.5" value="1"><output id="cco">1.0</output></div>');
      E.bind('#ll','input',function(e){ self.s.L=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.bind('#cc','input',function(e){ self.s.C=+e.target.value; document.getElementById('cco').textContent=(+e.target.value).toFixed(1); E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var w0=1/Math.sqrt(s.L*s.C), f=w0/(2*Math.PI);   // LC 진동 주파수 f=1/(2π√(LC)) (골든룰)
      var q=Math.cos(w0*s.t*2), I=-Math.sin(w0*s.t*2);   // 전하 q(t), 전류 I(t) (90° 위상차)
      var Uc=0.5*q*q, Ul=0.5*I*I;   // 축전기 에너지 ∝q², 인덕터 에너지 ∝I² (합 일정)
      var cx=W*0.28, cy=H*0.40;
      // 축전기(위)
      ctx.strokeStyle=RED; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(cx-30,cy-50); ctx.lineTo(cx+30,cy-50); ctx.moveTo(cx-30,cy-38); ctx.lineTo(cx+30,cy-38); ctx.stroke();
      ctx.fillStyle=RED; ctx.font='12px sans-serif'; ctx.textAlign='center';
      // 전하 표시(q 크기·부호)
      var nq=Math.round(Math.abs(q)*6); for(var i=0;i<nq;i++){ var x=cx-25+i*50/Math.max(1,nq); ctx.fillStyle=q>0?RED:BLU; ctx.fillText(q>0?'+':'−',x,cy-54); ctx.fillStyle=q>0?BLU:RED; ctx.fillText(q>0?'−':'+',x,cy-30); }
      ctx.fillStyle=DIM; ctx.fillText('축전기 (전기장 에너지)', cx, cy-66);
      // 인덕터(아래, 코일)
      ctx.strokeStyle=ORA; ctx.lineWidth=Math.max(1.5,Math.abs(I)*4); for(var k=0;k<5;k++){ ctx.beginPath(); ctx.arc(cx-40+k*20,cy+40,10,Math.PI,0,true); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('인덕터 (자기장 에너지)', cx, cy+66);
      // 연결선 + 전류 방향
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx-30,cy-44); ctx.lineTo(cx-55,cy-44); ctx.lineTo(cx-55,cy+40); ctx.lineTo(cx-40,cy+40); ctx.moveTo(cx+30,cy-44); ctx.lineTo(cx+55,cy-44); ctx.lineTo(cx+55,cy+40); ctx.lineTo(cx+40,cy+40); ctx.stroke();
      if(Math.abs(I)>0.1){ var dir=I>0?1:-1; arrow(E,cx+55,cy,cx+55,cy+dir*16,GRN,2); }
      // 에너지 막대(축전기 ↔ 인덕터 시소)
      var bx=W*0.58, by=H*0.30, bw=W*0.30;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('전기장 에너지 (축전기)', bx, by-6); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(bx,by,bw,16); ctx.fillStyle=RED; ctx.fillRect(bx,by,bw*Uc,16);
      ctx.fillStyle=DIM; ctx.fillText('자기장 에너지 (인덕터)', bx, by+38); ctx.strokeRect(bx,by+44,bw,16); ctx.fillStyle=ORA; ctx.fillRect(bx,by+44,bw*Ul,16);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('합 = 일정 (에너지 보존, 마찰 없으면 영원히 진동)', bx, by+80);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('진동 주파수 f = 1/(2π√(LC)) = '+f.toFixed(3), W/2, H*0.84);
      E.tapHint(W/2, H*0.92, '에너지가 축전기↔인덕터를 오갑니다 — 진자처럼(전기 진동)', true);
      E.big('LC 진동 — 전기의 진자  f = 1/(2π√(LC))', '에너지가 두 소자 사이를 출렁입니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
