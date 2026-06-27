/* 물리학 제1장 운동학 — 위치·속도·가속도·등가속도·자유낙하·포물선
   동작(behavior)만. 텍스트는 content/phys1.json. 엔진(js/engine.js) 공유.
   골든룰: 화면 표시 수치는 전부 실제 운동학 식으로 계산. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', G=9.8;

  var scenes=[

  // ══════════ 1.1 위치·변위·거리 ══════════
  { id:'phys1_01',
    enter:function(E){ this.s={p:0.5}; E.NL.range(0,10);
      E.controls('<div class="ctrl"><label>진행</label><input type="range" id="pp" min="0" max="1" step="0.02" value="0.5"><output id="ppo">0.50</output></div>');
      var self=this; E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(2); E.blip(360+self.s.p*200,0.08); }); E.setOn([]); },
    back:function(E){ E.NL.step(); E.NL.draw({integers:true}); },
    draw:function(E){ var p=this.s.p, ctx=E.ctx, y=E.NL.yy(); var OUT=8, BACK=3;
      // 실제 경로: 0→8(전반) → 8→3(후반). 거리=걸은 총길이, 변위=시작→현재 직선(전부 실측)
      var x, dist;
      if(p<=0.5){ x=OUT*(p/0.5); dist=x; }
      else { x=OUT-(OUT-BACK)*((p-0.5)/0.5); dist=OUT+(OUT-x); }
      var gone = p<=0.5 ? x : OUT;                 // 오른쪽으로 간 최대 지점
      function head(px,yy,dir,col){ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(px,yy); ctx.lineTo(px-10*dir,yy-5); ctx.lineTo(px-10*dir,yy+5); ctx.fill(); }
      // ── 갈 때(윗줄, 초록 ▶): 0 → gone ──
      var yo=y-17;
      ctx.strokeStyle=GRN; ctx.lineWidth=7; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(E.NL.px(0),yo); ctx.lineTo(E.NL.px(gone),yo); ctx.stroke(); ctx.lineCap='butt';
      if(gone>0.2){ head(E.NL.px(gone),yo,1,GRN); ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('갈 때 '+gone.toFixed(1)+' m', (E.NL.px(0)+E.NL.px(gone))/2, yo-8); }
      // ── 올 때(아랫줄, 파랑 ◀): 8 → x  (되돌아올 때만) ──
      if(p>0.5){ var yb=y+17;
        ctx.strokeStyle=BLU; ctx.lineWidth=7; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(E.NL.px(OUT),yb); ctx.lineTo(E.NL.px(x),yb); ctx.stroke(); ctx.lineCap='butt';
        head(E.NL.px(x),yb,-1,BLU); ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('올 때 '+(OUT-x).toFixed(1)+' m', (E.NL.px(OUT)+E.NL.px(x))/2, yb+18); }
      // ── 변위(주황 직선, 시작→현재): 맨 위 ──
      var ya=y-46;
      ctx.strokeStyle=ORA; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(E.NL.px(0),ya); ctx.lineTo(E.NL.px(x),ya); ctx.stroke();
      head(E.NL.px(x),ya,(x>=0?1:-1),ORA); ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('변위 '+(x>=0?'+':'')+x.toFixed(1)+' m', (E.NL.px(0)+E.NL.px(x))/2, ya-7);
      // ── 시작점 · 주자 ──
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('시작', E.NL.px(0), y+40);
      E.NL.dot(x,GRN,9);
      E.big('걸은 거리 = '+dist.toFixed(1)+' m,   변위 = '+(x>=0?'+':'')+x.toFixed(1)+' m', '초록=갈 때 길, 파랑=올 때 길 — 둘을 더한 실제 걸은 길이가 거리. 주황 직선(시작→현재)이 변위. 8까지 갔다 3으로 오면 거리는 13 m라도 변위는 +3 m!'); }
  },

  // ══════════ 1.2 속도 = x-t 그래프의 기울기 (미분 연결) ══════════
  { id:'phys1_02',
    enter:function(E){ this.s={t:1.5}; E.Plot.range(0,3.2,0,10).lab('t (초)','x (m)');
      E.controls('<div class="ctrl"><label>시각 t (초)</label><input type="range" id="tt" min="0.3" max="3" step="0.1" value="1.5"><output id="tto">1.5</output></div>');
      var self=this; E.bind('#tt','input',function(e){ self.s.t=+e.target.value; document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(400+self.s.t*80,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.t; P.axes();
      function x(tt){ return tt*tt; }          // 위치 x(t)=t²  → 속도 2t
      P.curve(x,BLU);
      var xt=x(t), vinst=2*t, vavg=xt/t;        // 순간속도(접선)·평균속도(원점에서의 할선)
      // 평균속도 할선(원점→점)
      ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(t),P.Y(xt)); ctx.stroke(); ctx.setLineDash([]);
      // 순간속도 접선(기울기 2t)
      var dt=1.0; ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(t-dt),P.Y(xt-vinst*dt)); ctx.lineTo(P.X(t+dt),P.Y(xt+vinst*dt)); ctx.stroke();
      P.dot(t,xt,GRN);
      // 접선을 따라다니는 v 계산식(수식 + 실제 대입값 + 결과)
      var g=P.geom(), ax=P.X(t), ay=P.Y(xt), rightSpace=g.right-ax;
      var le=rightSpace>210; ctx.textAlign=le?'left':'right'; var ox=le?12:-12;
      ctx.fillStyle=ORA; ctx.font='600 13px sans-serif';
      ctx.fillText('v = dx/dt = 2t = 2·'+t.toFixed(1)+' = '+vinst.toFixed(2)+' m/s', ax+ox, ay-24);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('x = '+xt.toFixed(2)+' m', ax+ox, ay-8);
      E.big('순간속도 v = '+vinst.toFixed(2)+' m/s  (= 접선 기울기)', '속도계가 가리키는 \'지금\'의 빠르기 = x-t 그래프의 기울기. 주황 접선이 순간속도(dx/dt=2t), 초록 할선이 평균속도 '+vavg.toFixed(2)+' m/s. 두 점을 한없이 붙이는 이 묘기가 바로 미분!'); }
  },

  // ══════════ 1.3 가속도 = v-t 그래프의 기울기 ══════════
  { id:'phys1_03',
    enter:function(E){ this.s={a:2}; E.Plot.range(0,5,-2,12).lab('t (초)','v (m/s)');
      E.controls('<div class="ctrl"><label>가속도 a (m/s²)</label><input type="range" id="aa" min="-2" max="4" step="0.5" value="2"><output id="aao">2</output></div>');
      var self=this; E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value); E.blip(360+(self.s.a+2)*60,0.1); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, a=this.s.a, v0=2; P.axes();
      function v(t){ return v0+a*t; }
      P.curve(v,BLU);
      // 기울기 삼각형(가속도)
      var t1=1, t2=3, vy1=v(t1), vy2=v(t2);
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.moveTo(P.X(t1),P.Y(vy1)); ctx.lineTo(P.X(t2),P.Y(vy1)); ctx.lineTo(P.X(t2),P.Y(vy2)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Δt='+(t2-t1), (P.X(t1)+P.X(t2))/2, P.Y(vy1)+16);
      ctx.textAlign='left'; ctx.fillText('Δv='+((vy2-vy1)).toFixed(1), P.X(t2)+6, (P.Y(vy1)+P.Y(vy2))/2);
      P.dot(0,v0,GRN);
      E.big('가속도 a = Δv/Δt = '+a.toFixed(1)+' m/s²', '출발할 때 등이 눌리는 그 느낌 = v-t 그래프의 기울기. a>0이면 빨라지고, a<0이면 느려지며, a=0이면 아무 느낌 없는 등속. (v₀='+v0+' m/s)'); }
  },

  // ══════════ 1.4 등가속도 운동 — v-t 넓이 = 변위 ══════════
  { id:'phys1_04',
    enter:function(E){ this.s={t:3}; E.Plot.range(0,6,0,14).lab('t (초)','v (m/s)');
      E.controls('<div class="ctrl"><label>경과 시간 t (초)</label><input type="range" id="et" min="0" max="6" step="0.2" value="3"><output id="eto">3.0</output></div>');
      var self=this; E.bind('#et','input',function(e){ self.s.t=+e.target.value; document.getElementById('eto').textContent=(+e.target.value).toFixed(1); E.blip(400+self.s.t*40,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, ctx=E.ctx, t=this.s.t, v0=2, a=2; P.axes();
      function v(tt){ return v0+a*tt; }
      // v-t 아래 넓이(0..t) = 변위 — 사다리꼴 채움
      ctx.fillStyle='rgba(95,214,168,0.25)'; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0));
      for(var k=0;k<=40;k++){ var tk=t*k/40; ctx.lineTo(P.X(tk),P.Y(v(tk))); }
      ctx.lineTo(P.X(t),P.Y(0)); ctx.closePath(); ctx.fill();
      P.curve(v,BLU);
      var disp=v0*t+0.5*a*t*t, vt=v(t);
      // 넓이 = 변위 검산(사다리꼴)
      var area=(v0+vt)/2*t;
      P.dot(t,vt,GRN);
      // 트랙 위 물체(상단)
      var trkY=E.H*0.16, x0=P.X(0), x1=P.X(6), bx=x0+(x1-x0)*(disp/ (v0*6+0.5*a*36));
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,trkY); ctx.lineTo(x1,trkY); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(bx,trkY,7,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('이동한 물체 (변위 '+disp.toFixed(1)+' m)', (x0+x1)/2, trkY-12);
      E.big('변위 x = v₀t + ½at² = '+disp.toFixed(1)+' m', '시간을 잘게 썰어 \'속도×짧은시간\'을 다 더한 것 = v-t 그래프 아래 넓이(초록) = 변위. 사다리꼴 넓이 '+area.toFixed(1)+' m 와 식이 딱 일치 ✓ (v₀=2, a=2). 이 더하기가 바로 적분!'); }
  },

  // ══════════ 1.5 자유낙하 — 질량 무관, g로 떨어진다 ══════════
  { id:'phys1_05',
    enter:function(E){ this.s={t:0.8}; E.setOn([]);
      E.controls('<div class="ctrl"><label>낙하 시간 t (초)</label><input type="range" id="ft" min="0" max="1.8" step="0.05" value="0.8"><output id="fto">0.80</output></div>');
      var self=this; E.bind('#ft','input',function(e){ self.s.t=+e.target.value; document.getElementById('fto').textContent=(+e.target.value).toFixed(2); E.blip(500-self.s.t*120,0.08); }); },
    draw:function(E){ var ctx=E.ctx, t=this.s.t, W=E.W, H=E.H, h0=15;   // 15 m 높이
      var y=h0-0.5*G*t*t, v=G*t; if(y<0){ y=0; }
      var topY=H*0.20, botY=H*0.78, scale=(botY-topY)/h0;
      // 두 공(가벼운 것·무거운 것) 같은 높이 — 질량 무관
      [[W*0.40,'가벼운 공',GRN],[W*0.60,'무거운 공',ORA]].forEach(function(b){
        var px=b[0], py=topY+(h0-y)*scale;
        // 자취
        ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(px,topY); ctx.lineTo(px,py); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=b[2]; ctx.beginPath(); ctx.arc(px,py,b===null?8: (b[1]==='무거운 공'?12:8),0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(b[1], px, topY-10);
      });
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.28,botY); ctx.lineTo(W*0.72,botY); ctx.stroke();
      E.big('높이 '+y.toFixed(1)+' m,  속력 '+v.toFixed(1)+' m/s', '공기를 빼면 볼링공도 깃털도 똑같이 떨어집니다 — 무게와 상관없이 같은 가속도 g='+G+' m/s². y = h₀ − ½gt², v = gt. 두 공이 늘 나란히!'); }
  },

  // ══════════ 1.6 포물선 운동 — 발사각과 사거리 ══════════
  { id:'phys1_06',
    enter:function(E){ this.s={ang:45}; E.setOn([]);
      E.controls('<div class="ctrl"><label>발사각 θ (도)</label><input type="range" id="ag" min="15" max="75" step="5" value="45"><output id="ago">45</output></div>');
      var self=this; E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=(+e.target.value); E.blip(360+self.s.ang*4,0.08); }); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, ang=this.s.ang*Math.PI/180, v0=20;
      var R=v0*v0*Math.sin(2*ang)/G, Hmax=v0*v0*Math.sin(ang)*Math.sin(ang)/(2*G), T=2*v0*Math.sin(ang)/G;
      var Rmax=v0*v0/G;   // 45도 최대 사거리
      var ox=W*0.14, oy=H*0.74, sx=(W*0.72)/Rmax, sy=(H*0.5)/(Rmax/4);
      // 지면
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ox-10,oy); ctx.lineTo(ox+Rmax*sx+10,oy); ctx.stroke();
      // 45도 기준 자취(옅게)
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath();
      for(var k=0;k<=40;k++){ var a45=Math.PI/4, tk=k/40*(2*v0*Math.sin(a45)/G), xk=v0*Math.cos(a45)*tk, yk=v0*Math.sin(a45)*tk-0.5*G*tk*tk; if(k===0)ctx.moveTo(ox+xk*sx,oy-yk*sy); else ctx.lineTo(ox+xk*sx,oy-yk*sy); } ctx.stroke();
      // 현재 각도 자취
      ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath();
      for(var k2=0;k2<=40;k2++){ var tk2=k2/40*T, xk2=v0*Math.cos(ang)*tk2, yk2=v0*Math.sin(ang)*tk2-0.5*G*tk2*tk2; if(k2===0)ctx.moveTo(ox+xk2*sx,oy-yk2*sy); else ctx.lineTo(ox+xk2*sx,oy-yk2*sy); } ctx.stroke();
      // 발사 벡터
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(ang)*40,oy-Math.sin(ang)*40); ctx.stroke();
      // 착지점
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ox+R*sx,oy,6,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('사거리 '+R.toFixed(1)+' m', ox+R*sx, oy+20);
      E.big('θ='+this.s.ang+'°  →  사거리 R = '+R.toFixed(1)+' m,  최고 '+Hmax.toFixed(1)+' m', '가로는 등속, 세로는 자유낙하 — 둘은 서로 간섭하지 않습니다. R = v₀²·sin2θ/g, θ=45°에서 가장 멀리('+Rmax.toFixed(1)+' m)! (v₀=20 m/s)'); }
  },

  // ─── 심화: 상대속도 (강 건너는 보트) ───
  { id:'phys1_01_relv', branchOf:'phys1_01', ord:1,
    enter:function(E){ var self=this; this.s={vc:1.2,ang:90,y:0}; var vb=2;
      E.controls('<div class="ctrl"><label>물살 속도 vc</label><input type="range" id="cc" min="0" max="3" step="0.2" value="1.2"><output id="cco">1.2</output>'
        +'<label style="margin-left:14px">뱃머리 각도 (도)</label><input type="range" id="ag" min="40" max="140" step="5" value="90"><output id="ago">90</output></div>');
      E.bind('#cc','input',function(e){ self.s.vc=+e.target.value; document.getElementById('cco').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=e.target.value; E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, vb=2, th=s.ang*Math.PI/180, width=6;
      var vx=vb*Math.cos(th)+s.vc, vy=vb*Math.sin(th);
      if(vy>0.05){ s.y += vy*(1/60); } if(s.y>width){ s.y=0; s.x0=undefined; }
      var ox=W*0.16, oy=H*0.80, sc=Math.min(W*0.10,H*0.085);
      // 강(양안)
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.fillRect(ox,oy-width*sc,W*0.6,width*sc);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+W*0.6,oy); ctx.moveTo(ox,oy-width*sc); ctx.lineTo(ox+W*0.6,oy-width*sc); ctx.stroke();
      // 물살 화살표
      for(var gx=1;gx<6;gx+=1.2){ ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1.5; var ay=oy-gx/6*width*sc; ctx.beginPath(); ctx.moveTo(ox+40,ay); ctx.lineTo(ox+40+s.vc*16,ay); ctx.stroke(); }
      // 보트 위치(drift = vx 누적)
      var driftRate=vx/Math.max(0.01,vy), bx=ox+W*0.18+ (s.y*driftRate)*sc, by=oy-s.y*sc;
      ctx.fillStyle=ORA; ctx.fillRect(bx-8,by-5,16,10);
      // 속도벡터(뱃머리·물살·합)
      function arr(x1,y1,dx,dy,col){ ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1+dx,y1+dy); ctx.stroke(); var a=Math.atan2(dy,dx); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x1+dx,y1+dy); ctx.lineTo(x1+dx-8*Math.cos(a-0.4),y1+dy-8*Math.sin(a-0.4)); ctx.lineTo(x1+dx-8*Math.cos(a+0.4),y1+dy-8*Math.sin(a+0.4)); ctx.fill(); }
      arr(bx,by, vb*Math.cos(th)*18, -vb*Math.sin(th)*18, GRN);
      arr(bx,by, s.vc*18, 0, BLU);
      arr(bx,by, vx*18, -vy*18, ORA);
      var crossT=vy>0.05?width/vy:Infinity, drift=vy>0.05?vx*crossT:0;
      E.tapHint(W/2, H*0.92, '뱃머리 각도·물살을 바꿔 합속도를 보세요', true);
      E.big('합속도 = 뱃머리 + 물살 (건너기 '+ (isFinite(crossT)?crossT.toFixed(1)+'s, 떠내려감 '+drift.toFixed(1):'∞')+')', '정면을 보고 저어도 강물이 보트를 통째로 실어 나릅니다. 속도는 <b>벡터</b>라 더할 때 방향까지 함께 더하니까요. 실제 속도(주황) = 뱃머리 속도(초록) + 물살(파랑)의 <b>벡터 합</b>. 곧장 건너려면 상류로 비스듬히 저어 물살을 미리 상쇄 — 바람 속 비행기가 기수를 트는 것과 똑같은 이야기.'); }
  },

  // ─── 심화: 종단속도 (공기저항, 엔진 적분) ───
  { id:'phys1_05_drag', branchOf:'phys1_05', ord:1,
    enter:function(E){ var self=this; this.s={c:0.5};
      var w=PhysLab.world({g:9.8}); this.s.w=w;
      var b=w.add({x:0,y:14,m:1,r:0.3,color:GRN}); this.s.b=b;
      w.force(PhysLab.F.drag(b,self.s.c)); this.s.hist=[];
      E.controls('<div class="ctrl"><label>공기저항 계수 c</label><input type="range" id="cc" min="0.2" max="2" step="0.1" value="0.5"><output id="cco">0.5</output></div>');
      E.bind('#cc','input',function(e){ self.s.c=+e.target.value; w.clearForces(); w.force(PhysLab.F.drag(b,self.s.c)); b.y=14; b.vy=0; self.s.hist=[]; document.getElementById('cco').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, w=s.w, b=s.b, ctx=E.ctx, W=E.W, H=E.H;
      w.step(1/60,6); if(b.y<0.3){ b.y=14; b.vy=0; s.hist=[]; }
      var spd=-b.vy, vt=1*9.8/s.c;   // 종단속도 mg/c
      s.hist.push(spd); if(s.hist.length>220) s.hist.shift();
      var topY=H*0.16, botY=H*0.80, scale=(botY-topY)/15, cx=W*0.22;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-40,botY); ctx.lineTo(cx+40,botY); ctx.stroke();
      var py=botY-b.y*scale; ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx,py,9,0,7); ctx.fill();
      // 저항(위)·중력(아래) 화살표
      ctx.strokeStyle=PNK; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx,py); ctx.lineTo(cx,py-Math.min(40,s.c*spd*8)); ctx.stroke();
      ctx.strokeStyle=ORA; ctx.beginPath(); ctx.moveTo(cx,py); ctx.lineTo(cx,py+30); ctx.stroke();
      // v-t 그래프 + 종단속도 점근선
      var gx0=W*0.50, gx1=W*0.93, gy0=H*0.78, gh=H*0.5, vmax=1*9.8/0.2;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('v',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.setLineDash([5,4]); var vty=gy0-(vt/vmax)*gh; ctx.beginPath(); ctx.moveTo(gx0,vty); ctx.lineTo(gx1,vty); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.fillText('종단속도 '+vt.toFixed(1), gx1-90, vty-4);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      s.hist.forEach(function(vv,i){ var x=gx0+(gx1-gx0)*i/220, y=gy0-(vv/vmax)*gh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      E.tapHint(W/2, H*0.92, '저항을 키우면 종단속도가 낮아집니다', true);
      E.big('종단속도 v_t = mg/c = '+vt.toFixed(1)+' m/s  (현재 v='+spd.toFixed(1)+')', '구름에서 떨어진 빗방울이 사람을 다치게 하지 않는 이유. 떨어지는 물체엔 속도에 비례해 위로 미는 <b>공기저항(−cv)</b>이 붙습니다. 처음엔 중력이 이겨 가속하지만, 빨라질수록 저항이 세져 어느 순간 <b>중력=저항</b>으로 팽팽해지면 더는 안 빨라집니다 — 그 일정 속도가 <b>종단속도 v_t=mg/c</b>. 저항이 클수록(낙하산) 종단속도가 낮습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
