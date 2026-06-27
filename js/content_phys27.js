/* 물리학 「자기장의 원천」 — 전류가 자기장을 만든다. 앙페르 법칙(자기의 가우스).
   직선전류 자기장·앙페르 법칙·솔레노이드·평행전류 힘·자성체. 자기(앞)와 전자기유도(뒤)를 잇는다.
   골든룰: B=μ₀I/2πr·∮B·dl=μ₀I·B=μ₀nI·F/L=μ₀I₁I₂/2πd 모두 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys27.json. 솔레노이드는 phys13에서 옮김. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b', SBLU='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 직선 전류의 자기장 — B = μ₀I/2πr ══════════
  { id:'phys27_01',
    enter:function(E){ var self=this; this.s={I:4,r:2.5};
      E.controls('<div class="ctrl"><label>전류 I</label><input type="range" id="ii" min="1" max="8" step="1" value="4"><output id="iio">4</output>'
        +'<label style="margin-left:14px">거리 r</label><input type="range" id="rr" min="1" max="5" step="0.5" value="2.5"><output id="rro">2.5</output></div>');
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(360,0.06); });
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var B=2*s.I/s.r;   // B=μ₀I/2πr (상대단위), 거리 멀수록 약함 (골든룰)
      var cx=W*0.40, cy=H*0.46, sc=Math.min(W*0.06,H*0.085);
      // 전류(화면 밖으로 나오는 ⊙)
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,cy,10,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.beginPath(); ctx.arc(cx,cy,3,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('전류 I (나옴 ⊙)', cx, cy+sc*4.6);
      // 동심원 자기장선(반시계, 오른손 법칙) — 굵기 ∝ B(가까울수록 강)
      [1,2,3,4].forEach(function(rr){ var bb=2*s.I/rr; ctx.strokeStyle='rgba(122,184,255,'+Math.min(0.7,0.15+bb*0.05)+')'; ctx.lineWidth=Math.max(1,bb*0.4); ctx.beginPath(); ctx.arc(cx,cy,rr*sc,0,7); ctx.stroke();
        // 방향 화살(반시계)
        ctx.fillStyle='rgba(122,184,255,0.6)'; var ax=cx+rr*sc, ay=cy; arrow(E,ax,ay+6,ax,ay-6,'rgba(122,184,255,0.6)',1.4); });
      // 측정점 r + B 화살표(접선)
      var px=cx+s.r*sc; arrow(E,px,cy,px,cy-Math.min(40,B*5),GRN,2.5);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('B(접선)', px+24, cy-10);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('B = μ₀I/2πr = '+B.toFixed(2)+'  (전류↑ 강, 거리↑ 약 — 1/r)', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('오른손 엄지=전류 방향 → 감은 네 손가락=자기장 방향(동심원)', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '전류는 둘레에 동심원 자기장을 만듭니다 (1/r로 약해짐)', true);
      E.big('직선 전류의 자기장 B = μ₀I/2πr', '전류가 둘레에 동심원 자기장을 만듭니다.'); }
  },

  // ══════════ 2. 앙페르 법칙 — ∮B·dl = μ₀I (자기의 가우스) ══════════
  { id:'phys27_02',
    enter:function(E){ var self=this; this.s={r:2.5,I:4};
      E.controls('<div class="ctrl"><label>앙페르 고리 반지름 r</label><input type="range" id="rr" min="1.5" max="4.5" step="0.25" value="2.5"><output id="rro">2.5</output>'
        +'<label style="margin-left:14px">전류 I</label><input type="range" id="ii" min="1" max="8" step="1" value="4"><output id="iio">4</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var sc=Math.min(W*0.07,H*0.095), cx=W*0.40, cy=H*0.46;
      var B=2*s.I/s.r, circ=B*2*Math.PI*s.r;   // ∮B·dl = B·(2πr) = μ₀I (반지름 무관!) (골든룰)
      // 전류
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,cy,9,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.beginPath(); ctx.arc(cx,cy,3,0,7); ctx.fill();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('I='+s.I, cx, cy+24);
      // 앙페르 고리(점선 원)
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(cx,cy,s.r*sc,0,7); ctx.stroke(); ctx.setLineDash([]);
      // 고리 위 B(접선) 화살표들
      for(var a=0;a<8;a++){ var th=a/8*6.2832, x=cx+s.r*sc*Math.cos(th), y=cy+s.r*sc*Math.sin(th); var tx=-Math.sin(th), ty=Math.cos(th); arrow(E,x,y,x+tx*16,y+ty*16,BLU,1.6); }
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('앙페르 고리 r='+s.r.toFixed(1), cx, cy-s.r*sc-8);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('∮B·dl = B×(2πr) = '+circ.toFixed(1)+' = μ₀·I  (반지름 r 무관!)', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('가우스(전기)의 자기 짝 — 닫힌 고리 적분 = 갇힌 전류. 대칭이면 B를 단숨에', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '고리를 키워도 ∮B·dl은 μ₀I로 일정 (갇힌 전류에만 의존)', true);
      E.big('앙페르 법칙 ∮B·dl = μ₀·I_enc', '닫힌 고리의 자기장 적분 = 갇힌 전류.'); }
  },

  // ══════════ 3. 솔레노이드 — 균일 자기장 (전자석) ══════════
  { id:'phys27_03',
    enter:function(E){ var self=this; this.s={I:4,N:8};
      E.controls('<div class="ctrl"><label>전류 I</label><input type="range" id="ii" min="1" max="8" step="1" value="4"><output id="iio">4</output>'
        +'<label style="margin-left:14px">감은 수 N</label><input type="range" id="nn" min="4" max="14" step="1" value="8"><output id="nno">8</output></div>');
      E.bind('#ii','input',function(e){ self.s.I=+e.target.value; document.getElementById('iio').textContent=e.target.value; E.blip(360,0.07); });
      E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.42, cy=H*0.44, L=W*0.4, x0=cx-L/2, x1=cx+L/2;
      ctx.strokeStyle=ORA; ctx.lineWidth=2.5;
      for(var i=0;i<s.N;i++){ var x=x0+L*i/(s.N-1); ctx.beginPath(); ctx.ellipse(x,cy,8,40,0,0,7); ctx.stroke(); }
      var B=s.N*s.I; var nl=Math.max(2,Math.round(B/8));
      for(var k=0;k<nl;k++){ var yy=cy-20+k*(40/(nl-1||1)); arrow(E,x0+6,yy,x1-6,yy,'rgba(122,184,255,0.6)',2); }
      ctx.fillStyle=NRED; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('N', x1+24, cy+5);
      ctx.fillStyle=SBLU; ctx.fillText('S', x0-24, cy+5);
      E.tapHint(W/2, H*0.90, '전류·감은 수를 키우면 내부 자기장이 강해집니다', true);
      E.big('솔레노이드: 내부 균일 자기장 B = μ₀·n·I  (N·I = '+B+')', '촘촘히 감으면 막대자석 같은 전자석.'); }
  },

  // ══════════ 4. 평행 전류 사이의 힘 — 암페어의 정의 ══════════
  { id:'phys27_04',
    enter:function(E){ var self=this; this.s={I2:3,d:3};
      E.controls('<div class="ctrl"><label>전류2 방향·크기</label><input type="range" id="ii" min="-4" max="4" step="1" value="3"><output id="iio">+3</output>'
        +'<label style="margin-left:14px">간격 d</label><input type="range" id="dd" min="1.5" max="5" step="0.5" value="3"><output id="ddo">3.0</output></div>');
      E.bind('#ii','input',function(e){ self.s.I2=+e.target.value; document.getElementById('iio').textContent=(self.s.I2>=0?'+':'')+self.s.I2; E.blip(360,0.06); });
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(340,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, I1=3;
      var FL = 2*I1*s.I2/s.d;   // F/L=μ₀I₁I₂/2πd (상대). 같은 방향(곱>0)=인력, 반대=척력 (골든룰)
      var attract=(I1*s.I2)>0, cy=H*0.44, sc=W*0.05, cx=W*0.42;
      var x1=cx-s.d*sc/2, x2=cx+s.d*sc/2;
      // 두 도선(세로)
      [[x1,I1,'I₁=+3'],[x2,s.I2,'I₂='+(s.I2>=0?'+':'')+s.I2]].forEach(function(L){
        ctx.strokeStyle=ORA; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(L[0],cy-H*0.26); ctx.lineTo(L[0],cy+H*0.26); ctx.stroke();
        // 전류 방향 화살(위/아래)
        var dir=L[1]>=0?-1:1; arrow(E,L[0],cy,L[0],cy+dir*40,GRN,2);
        ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(L[2], L[0], cy-H*0.28);
      });
      // 힘 화살표(인력=마주, 척력=등짐)
      if(s.I2!==0){ var fl=Math.min(50,Math.abs(FL)*6);
        var d1=attract?1:-1; arrow(E,x1-(attract?0:6),cy+70,x1+d1*fl,cy+70, attract?GRN:NRED,3);
        arrow(E,x2+(attract?0:6),cy+70,x2-d1*fl,cy+70, attract?GRN:NRED,3);
      }
      ctx.fillStyle=attract?GRN:NRED; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText((s.I2===0?'전류2 없음':(attract?'같은 방향 → 인력(서로 당김)':'반대 방향 → 척력(서로 밂)')), W/2, H*0.78);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('F/L = μ₀I₁I₂/2πd = '+Math.abs(FL).toFixed(2)+'  (전류 곱↑·간격↓일수록 강) — 1A의 정의', W/2, H*0.86);
      E.tapHint(W/2, H*0.93, '같은 방향 전류는 당기고, 반대 방향은 밉니다', true);
      E.big('평행 전류의 힘 F/L = μ₀I₁I₂/2πd', '두 전류가 서로 당기거나 밉니다.'); }
  },

  // ══════════ 5. 자성체 — 자기구역의 정렬 ══════════
  { id:'phys27_05',
    enter:function(E){ var self=this; this.s={B:0};
      E.controls('<div class="ctrl"><label>외부 자기장 B</label><input type="range" id="bb" min="0" max="10" step="0.5" value="0"><output id="bbo">0.0</output></div>');
      E.bind('#bb','input',function(e){ self.s.B=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.B*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 자기구역(작은 화살표 격자). B 클수록 더 많이 오른쪽으로 정렬. 정렬도 ∝ B
      var align=Math.min(1,s.B/8);   // 정렬 비율 (골든룰: 자화 M ∝ 정렬도)
      var ox=W*0.22, oy=H*0.26, cols=7, rows=5, cell=Math.min(W*0.07,H*0.10);
      function hash(i){ var x=Math.sin(i*12.9898)*43758.5; return x-Math.floor(x); }
      for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){ var i=r*cols+c; var cxx=ox+c*cell+cell/2, cyy=oy+r*cell+cell/2;
        var rand=(hash(i)*2-1)*Math.PI;   // 무작위 방향(결정적)
        var ang=rand*(1-align) + 0*align;   // align→0(오른쪽 0rad)로 수렴
        ctx.strokeStyle=Math.abs(ang)<0.3?GRN:'rgba(200,200,210,0.6)'; ctx.lineWidth=2.5;
        var dx=Math.cos(ang)*cell*0.32, dy=Math.sin(ang)*cell*0.32; arrow(E,cxx-dx,cyy-dy,cxx+dx,cyy+dy,Math.abs(ang)<0.3?GRN:'rgba(200,200,210,0.6)',2); }
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.strokeRect(ox,oy,cols*cell,rows*cell);
      // 외부장 표시
      if(s.B>0){ for(var k=0;k<3;k++){ var yy=oy-30+k*0; arrow(E,ox-40,oy+rows*cell/2-20+k*20,ox-10,oy+rows*cell/2-20+k*20,BLU,2); } ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('외부 B', ox-44, oy+rows*cell/2); }
      // 자화 막대
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('자화 M (정렬도)', W*0.5, H*0.80);
      var bx=W*0.30, by=H*0.83, bw=W*0.40; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(bx,by,bw,16); ctx.fillStyle=GRN; ctx.fillRect(bx,by,bw*align,16);
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.fillText(s.B===0?'외부장 0 → 구역이 제멋대로 → 자성 없음':(align>0.9?'강하게 정렬 → 강한 자석!':'외부장이 구역을 정렬시키는 중'), W/2, H*0.90);
      E.tapHint(W/2, H*0.95, '외부 자기장이 자기구역을 한 방향으로 정렬시켜 자석이 됩니다', true);
      E.big('자성체 — 자기구역이 정렬하면 자석이 된다', '작은 자석(구역)들이 줄을 맞춥니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
