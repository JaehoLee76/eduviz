/* 물리학 「기하광학」 — 전자기파(빛, 앞 장)가 어떻게 휘고·모이고·갈라지는가.
   빛을 '광선'으로 다룬다: 반사·굴절(스넬)·전반사·렌즈·거울·분산.
   골든룰: 모든 각도·상의 위치·색의 갈라짐은 스넬 법칙·렌즈/거울 식·n(λ)에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys17.json. 일부 장면은 phys14(빛·현대물리)에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 반사와 굴절 — 스넬의 법칙 ══════════
  { id:'phys17_01',
    enter:function(E){ var self=this; this.s={th1:40,n2:1.5};
      E.controls('<div class="ctrl"><label>입사각 θ₁ (도)</label><input type="range" id="aa" min="5" max="85" step="5" value="40"><output id="aao">40</output>'
        +'<label style="margin-left:14px">아래 매질 n₂</label><input type="range" id="nn" min="1" max="2.5" step="0.1" value="1.5"><output id="nno">1.5</output></div>');
      E.bind('#aa','input',function(e){ self.s.th1=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.th1*4,0.07); });
      E.bind('#nn','input',function(e){ self.s.n2=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, n1=1;
      var cx=W*0.45, cy=H*0.46, L=Math.min(W*0.28,H*0.36);
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.fillRect(cx-W*0.35,cy,W*0.7,H*0.4);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-W*0.35,cy); ctx.lineTo(cx+W*0.35,cy); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy-L); ctx.lineTo(cx,cy+L); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('n₁=1 (공기)', cx-W*0.34, cy-12); ctx.fillText('n₂='+s.n2.toFixed(1), cx-W*0.34, cy+20);
      var t1=s.th1*Math.PI/180;
      arrow(E,cx-Math.sin(t1)*L,cy-Math.cos(t1)*L,cx,cy,ORA,2.5);
      arrow(E,cx,cy,cx+Math.sin(t1)*L*0.8,cy-Math.cos(t1)*L*0.8,'rgba(255,178,122,0.45)',1.5);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('입사 θ₁='+s.th1+'°', cx-Math.sin(t1)*L*0.6-70, cy-Math.cos(t1)*L*0.6);
      var s2=n1/s.n2*Math.sin(t1), t2=Math.asin(Math.min(1,s2));   // 스넬: n₁sinθ₁=n₂sinθ₂
      arrow(E,cx,cy,cx+Math.sin(t2)*L,cy+Math.cos(t2)*L,GRN,2.5);
      ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('굴절 θ₂='+(t2*180/Math.PI).toFixed(0)+'°', cx+Math.sin(t2)*L*0.6+8, cy+Math.cos(t2)*L*0.6);
      E.tapHint(W/2, H*0.92, '입사각·아래 매질 굴절률을 바꿔 보세요 (빽빽할수록 더 꺾임)', true);
      E.big('스넬의 법칙 n₁sinθ₁ = n₂sinθ₂ (θ₂='+(t2*180/Math.PI).toFixed(0)+'°)', '빛이 느려지며 길을 꺾습니다.'); }
  },

  // ══════════ 2. 전반사 — 빛을 가두다 (광섬유) ══════════
  { id:'phys17_02',
    enter:function(E){ var self=this; this.s={th1:50,n1:1.5};
      E.controls('<div class="ctrl"><label>입사각 θ₁ (도)</label><input type="range" id="aa" min="10" max="85" step="2" value="50"><output id="aao">50</output>'
        +'<label style="margin-left:14px">유리 n₁</label><input type="range" id="nn" min="1.2" max="2.4" step="0.1" value="1.5"><output id="nno">1.5</output></div>');
      E.bind('#aa','input',function(e){ self.s.th1=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.th1*4,0.07); });
      E.bind('#nn','input',function(e){ self.s.n1=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, n2=1;   // 유리(아래)→공기(위)
      var cx=W*0.42, cy=H*0.42, L=Math.min(W*0.26,H*0.34);
      var thc=Math.asin(n2/s.n1)*180/Math.PI;   // 임계각 θc=arcsin(n₂/n₁) (골든룰)
      // 유리(아래) 음영
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.fillRect(cx-W*0.34,cy,W*0.68,H*0.42);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-W*0.34,cy); ctx.lineTo(cx+W*0.34,cy); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy-L); ctx.lineTo(cx,cy+L); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('공기 n₂=1', cx-W*0.33, cy-12); ctx.fillText('유리 n₁='+s.n1.toFixed(1), cx-W*0.33, cy+20);
      var t1=s.th1*Math.PI/180, s2=s.n1/n2*Math.sin(t1);   // 아래(유리)서 위(공기)로
      // 입사광(유리 속, 아래에서)
      arrow(E,cx-Math.sin(t1)*L,cy+Math.cos(t1)*L,cx,cy,ORA,2.5);
      if(s2<=1){ var t2=Math.asin(s2); // 굴절 통과
        arrow(E,cx,cy,cx+Math.sin(t2)*L,cy-Math.cos(t2)*L,GRN,2.5);
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('빠져나감 θ₂='+(t2*180/Math.PI).toFixed(0)+'°', cx+10, cy-L*0.6);
        E.big('굴절 통과 (θ₁ < 임계각 '+thc.toFixed(1)+'°)', '아직은 빠져나갑니다.'); }
      else { // 전반사
        arrow(E,cx,cy,cx+Math.sin(t1)*L,cy+Math.cos(t1)*L,'#ff6a6a',2.8);
        ctx.fillStyle='#ff8a8a'; ctx.font='600 14px sans-serif'; ctx.fillText('전반사! 빛이 갇힘', cx+14, cy+L*0.55);
        E.big('전반사 (θ₁ > 임계각 '+thc.toFixed(1)+'°) — 빛이 갇힌다', '빠져나갈 길이 사라졌습니다.'); }
      // 임계각 표시
      ctx.fillStyle=ORA; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('임계각 θc = arcsin(n₂/n₁) = '+thc.toFixed(1)+'°', W/2, H*0.86);
      // 광섬유 미니 그림(전반사로 빛 나르기)
      var fx=W*0.74, fy=H*0.18, fw=W*0.20, fh=26;
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1.5; ctx.strokeRect(fx,fy,fw,fh);
      ctx.strokeStyle=ORA; ctx.lineWidth=1.6; ctx.beginPath(); var zx=fx;
      for(var z=0;z<6;z++){ var nx=fx+fw*(z+1)/6, ny=fy+(z%2===0?fh-4:4); if(z===0)ctx.moveTo(fx,fy+4); ctx.lineTo(nx,ny); } ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('광섬유: 전반사로 빛을 나른다', fx+fw/2, fy-6);
      E.tapHint(W/2, H*0.93, '입사각을 임계각보다 크게 하면 빛이 전부 되튕깁니다', true); }
  },

  // ══════════ 3. 렌즈 — 상의 형성 (1/f = 1/do + 1/di) ══════════
  { id:'phys17_03',
    enter:function(E){ var self=this; this.s={do_:5,f:2};
      E.controls('<div class="ctrl"><label>물체 거리 do</label><input type="range" id="dd" min="1" max="8" step="0.5" value="5"><output id="ddo">5.0</output>'
        +'<label style="margin-left:14px">초점거리 f</label><input type="range" id="ff" min="1" max="3.5" step="0.5" value="2"><output id="ffo">2.0</output></div>');
      E.bind('#dd','input',function(e){ self.s.do_=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.5, axisY=H*0.46, sc=W*0.075, ho=1.2;
      var di=1/(1/s.f-1/s.do_), m=-di/s.do_, hi=m*ho;
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W*0.06,axisY); ctx.lineTo(W*0.94,axisY); ctx.stroke();
      ctx.strokeStyle='rgba(122,184,255,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,axisY-70); ctx.lineTo(cx,axisY+70); ctx.stroke();
      ctx.font='11px sans-serif'; ctx.textAlign='center';
      [-1,1].forEach(function(sg){ ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx+sg*s.f*sc,axisY,3,0,7); ctx.fill(); ctx.fillText('F', cx+sg*s.f*sc, axisY+16); });
      var ox=cx-s.do_*sc; arrow(E,ox,axisY,ox,axisY-ho*sc,GRN,2.5);
      var topO=axisY-ho*sc;
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(cx,topO); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(cx,axisY); ctx.stroke();
      var realimg = di>0;
      if(realimg){ var ix=cx+di*sc, topI=axisY-hi*sc;
        ctx.beginPath(); ctx.moveTo(cx,topO); ctx.lineTo(ix,topI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,axisY); ctx.lineTo(ix,topI); ctx.stroke();
        arrow(E,ix,axisY,ix,topI,PNK,2.5); ctx.fillStyle=PNK; ctx.fillText('상(실상,거꾸로)', ix, axisY+ (hi<0?-8: 18)); }
      else { var ix2=cx+di*sc, topI2=axisY-hi*sc; ctx.setLineDash([4,3]); ctx.strokeStyle='rgba(244,160,192,0.6)';
        ctx.beginPath(); ctx.moveTo(ix2,topI2); ctx.lineTo(cx,topO); ctx.stroke(); ctx.setLineDash([]);
        arrow(E,ix2,axisY,ix2,topI2,PNK,2.5); ctx.fillStyle=PNK; ctx.fillText('상(허상,바로)', ix2, axisY+18); }
      E.tapHint(W/2, H*0.92, '물체 거리·초점거리를 바꿔 상의 위치·크기를 보세요', true);
      E.big('렌즈식 1/f = 1/do + 1/di → di = '+di.toFixed(1)+', 배율 m = '+m.toFixed(2), '빛을 한 점에 모아 상을 맺습니다.'); }
  },

  // ══════════ 4. 거울 — 오목 거울의 상 ══════════
  { id:'phys17_04',
    enter:function(E){ var self=this; this.s={do_:5,f:2.2};
      E.controls('<div class="ctrl"><label>물체 거리 do</label><input type="range" id="dd" min="1" max="8" step="0.5" value="5"><output id="ddo">5.0</output>'
        +'<label style="margin-left:14px">초점거리 f (=R/2)</label><input type="range" id="ff" min="1.5" max="3.5" step="0.5" value="2.2"><output id="ffo">2.2</output></div>');
      E.bind('#dd','input',function(e){ self.s.do_=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var mx=W*0.74, axisY=H*0.46, sc=W*0.072, ho=1.1;
      var di=1/(1/s.f-1/s.do_), m=-di/s.do_, hi=m*ho;   // 거울식 1/f=1/do+1/di, f=R/2 (골든룰)
      // 광축
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W*0.08,axisY); ctx.lineTo(mx+10,axisY); ctx.stroke();
      // 오목 거울(호) — 곡률중심 C=2f 왼쪽
      var R=2*s.f*sc; ctx.strokeStyle='rgba(122,184,255,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(mx-R, axisY, R, -0.5, 0.5); ctx.stroke();
      // F, C 표시
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.beginPath(); ctx.arc(mx-s.f*sc,axisY,3,0,7); ctx.fill(); ctx.fillText('F', mx-s.f*sc, axisY+16);
      ctx.beginPath(); ctx.arc(mx-2*s.f*sc,axisY,3,0,7); ctx.fill(); ctx.fillText('C', mx-2*s.f*sc, axisY+16);
      // 물체
      var ox=mx-s.do_*sc, topO=axisY-ho*sc; arrow(E,ox,axisY,ox,topO,GRN,2.5);
      // 주요 광선: ①축평행→반사 후 F 통과 ②F 통과→반사 후 축평행
      var Fx=mx-s.f*sc;
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(mx,topO); ctx.stroke();   // 평행 입사(거울까지)
      var realimg=di>0;
      if(realimg){ var ix=mx-di*sc, topI=axisY-hi*sc;   // 실상: 같은 쪽(앞)
        ctx.beginPath(); ctx.moveTo(mx,topO); ctx.lineTo(ix,topI); ctx.stroke();   // 평행광선 반사 → 초점 거쳐 상점
        ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(mx,axisY); ctx.lineTo(ix,topI); ctx.stroke();   // 꼭짓점 광선 → 대칭 반사 → 상점
        arrow(E,ix,axisY,ix,topI,PNK,2.5); ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.fillText('실상(거꾸로)', ix, axisY+ (hi<0?-8:18)); }
      else { var ix2=mx-di*sc, topI2=axisY-hi*sc;   // 허상: 거울 뒤(di<0 → ix2 오른쪽)
        ctx.setLineDash([4,3]); ctx.strokeStyle='rgba(244,160,192,0.6)';
        ctx.beginPath(); ctx.moveTo(mx,topO); ctx.lineTo(ix2,topI2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(mx,axisY); ctx.lineTo(ix2,topI2); ctx.stroke(); ctx.setLineDash([]);
        arrow(E,ix2,axisY,ix2,topI2,PNK,2.5); ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.fillText('허상(바로,확대)', ix2, axisY+18); }
      E.tapHint(W/2, H*0.92, '물체를 초점 안/밖으로 옮겨 실상↔허상을 보세요', true);
      E.big('오목 거울 1/f = 1/do + 1/di → di = '+di.toFixed(1)+', 배율 m = '+m.toFixed(2), '거울도 같은 식으로 상을 맺습니다.'); }
  },

  // ══════════ 5. 분산 — 프리즘이 무지개를 만든다 ══════════
  { id:'phys17_05',
    enter:function(E){ var self=this; this.s={th1:50};
      E.controls('<div class="ctrl"><label>입사각 θ₁ (도)</label><input type="range" id="aa" min="30" max="70" step="2" value="50"><output id="aao">50</output></div>');
      E.bind('#aa','input',function(e){ self.s.th1=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.th1*5,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 정삼각 프리즘(꼭지각 A=60°). 입사면 법선 기준 θ1 입사 → 색마다 n 달라 갈라짐.
      var px=W*0.46, py=H*0.40, size=Math.min(W*0.22,H*0.30);
      var ax=px, ay=py-size*0.6, bx=px-size*0.55, by=py+size*0.5, cxp=px+size*0.55, cyp=py+size*0.5;
      // 프리즘 삼각형
      ctx.fillStyle='rgba(180,200,230,0.10)'; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.lineTo(cxp,cyp); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=2; ctx.stroke();
      // 입사 백색광 → 왼쪽 면 중앙
      var hitX=(ax+bx)/2, hitY=(ay+by)/2;
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(hitX-90,hitY-20); ctx.lineTo(hitX,hitY); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('백색광', hitX-92, hitY-22);
      // 색마다 n(λ): 보라 큰 n → 더 꺾임. 근사값으로 출사 방향을 펴서 표현(골든룰: n으로 편향각 계산)
      var cols=[['빨강',1.513,'#ff5555'],['주황',1.517,'#ff9944'],['노랑',1.520,'#ffe23a'],['초록',1.524,'#55dd66'],['파랑',1.529,'#4499ff'],['보라',1.535,'#9b66ff']];
      var A=60*Math.PI/180, t1=s.th1*Math.PI/180, ex=cxp, ey=(ay+cyp)/2, len=W*0.22, devR=null;
      for(var i=0;i<cols.length;i++){ var n=cols[i][1];
        // 두 면에서 스넬 2회: 첫 면 굴절 r1, 둘째 면 입사 r2=A−r1, 출사각 t2. 총편향 δ=θ1+t2−A (골든룰: n으로 실제 계산)
        var r1=Math.asin(Math.sin(t1)/n), r2=A-r1, sin_t2=n*Math.sin(r2), t2=(Math.abs(sin_t2)<=1)?Math.asin(sin_t2):Math.PI/2;
        var dev=t1+t2-A; if(i===0) devR=dev;
        var dirA=0.30 + (dev-devR)*9;   // 빨강(최소 편향) 기준, 실제 편향차 δ−δ_red 에 비례한 부채
        ctx.strokeStyle=cols[i][2]; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.moveTo(hitX,hitY); ctx.lineTo(ex,ey); ctx.moveTo(ex,ey); ctx.lineTo(ex+len*Math.cos(dirA), ey+len*Math.sin(dirA)); ctx.stroke();
        ctx.fillStyle=cols[i][2]; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText(cols[i][0]+' (n='+n.toFixed(3)+', δ='+(dev*180/Math.PI).toFixed(1)+'°)', ex+len*Math.cos(dirA)+6, ey+len*Math.sin(dirA)+4);
      }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('굴절률 n은 색(파장)마다 다르다 → 보라가 가장 많이 꺾임', W/2, H*0.88);
      E.tapHint(W/2, H*0.93, '백색광이 무지개로 갈라집니다 (분산) — 입사각을 바꿔 보세요', true);
      E.big('분산 — 프리즘이 무지개를 만든다 (n은 색마다 다르다)', '하나의 빛이 무지개로 갈라집니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
