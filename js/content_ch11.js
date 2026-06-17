/* 제11장 공간도형 — 11.1 점·직선·평면 · 11.2 공간벡터 · 11.3 직선·평면·구
   동작(behavior)만. 텍스트는 content/ch11.json
   ※ 3D는 등각투영(isometric)으로 2D 캔버스에 그림 */
(function(){
  var COSP=0.866, SINP=0.5, TAU=Math.PI*2;
  function view(E){ return { cx:E.W/2, cy:E.H*0.50, S:Math.min(E.H,E.W)*0.052 }; }
  // 3D(x: 우앞, y: 좌앞, z: 위) → 화면
  function p3(v,x,y,z){ return [ v.cx+(x-y)*v.S*COSP, v.cy+(x+y)*v.S*SINP - z*v.S ]; }
  function line(ctx,a,b,col,w,dash){ ctx.strokeStyle=col; ctx.lineWidth=w||2; if(dash)ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); if(dash)ctx.setLineDash([]); }
  function axes(ctx,v,L){
    var o=p3(v,0,0,0);
    line(ctx,o,p3(v,L,0,0),'rgba(122,184,255,0.7)',2); // x
    line(ctx,o,p3(v,0,L,0),'rgba(143,227,181,0.7)',2); // y
    line(ctx,o,p3(v,0,0,L),'rgba(255,178,122,0.7)',2); // z
    ctx.font='600 14px sans-serif'; ctx.textAlign='center';
    ctx.fillStyle='#7ab8ff'; var px=p3(v,L+0.4,0,0); ctx.fillText('x',px[0],px[1]);
    ctx.fillStyle='#8fe3b5'; var py=p3(v,0,L+0.4,0); ctx.fillText('y',py[0],py[1]);
    ctx.fillStyle='#ffb27a'; var pz=p3(v,0,0,L+0.4); ctx.fillText('z',pz[0],pz[1]);
  }
  function arrow3(ctx,v,x,y,z,col){ var o=p3(v,0,0,0), p=p3(v,x,y,z);
    line(ctx,o,p,col,3); var ang=Math.atan2(p[1]-o[1],p[0]-o[0]);
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(p[0],p[1]);
    ctx.lineTo(p[0]-13*Math.cos(ang-0.4),p[1]-13*Math.sin(ang-0.4));
    ctx.lineTo(p[0]-13*Math.cos(ang+0.4),p[1]-13*Math.sin(ang+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 11.1 공간좌표 ══════════
  { id:'ch11_01',
    enter:function(E){ this.s={z:3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>높이 z</label><input type="range" id="pz" min="0" max="4" step="1" value="3"><output id="pzo">3</output></div>');
      var self=this; E.bind('#pz','input',function(e){ self.s.z=+e.target.value; document.getElementById('pzo').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, v=view(E), x=3,y=2,z=this.s.z; axes(ctx,v,5);
      var base=p3(v,x,y,0), top=p3(v,x,y,z), o=p3(v,0,0,0);
      // 바닥 투영 경로
      line(ctx,o,p3(v,x,0,0),'rgba(244,160,192,0.5)',1.5,[4,4]);
      line(ctx,p3(v,x,0,0),base,'rgba(244,160,192,0.5)',1.5,[4,4]);
      line(ctx,base,top,'rgba(244,160,192,0.7)',2,[4,4]);
      ctx.fillStyle='rgba(244,160,192,0.8)'; ctx.beginPath(); ctx.arc(base[0],base[1],4,0,TAU); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(top[0],top[1],6,0,TAU); ctx.fill();
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(top[0],top[1],6,0,TAU); ctx.stroke();
      ctx.fillStyle='#f4f3ee'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('P('+x+', '+y+', '+z+')', top[0]+10, top[1]-6);
      E.big('P = (3, 2, '+z+')', '공간의 점은 좌표 3개 (x, y, z) — 평면(2개)에 높이가 하나 더'); }
  },

  // ══════════ 11.2 공간벡터 ══════════
  { id:'ch11_02',
    enter:function(E){ this.s={z:2}; E.setOn([]);
      E.controls('<div class="ctrl"><label>z 성분</label><input type="range" id="vz" min="0" max="4" step="1" value="2"><output id="vzo">2</output></div>');
      var self=this; E.bind('#vz','input',function(e){ self.s.z=+e.target.value; document.getElementById('vzo').textContent=e.target.value; E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, v=view(E), x=3,y=2,z=this.s.z, mag=Math.sqrt(x*x+y*y+z*z); axes(ctx,v,5);
      // 바닥 그림자 벡터
      line(ctx,p3(v,0,0,0),p3(v,x,y,0),'rgba(255,255,255,0.25)',2,[4,4]);
      line(ctx,p3(v,x,y,0),p3(v,x,y,z),'rgba(255,255,255,0.25)',1.5,[4,4]);
      arrow3(ctx,v,x,y,z,'#7ab8ff');
      var p=p3(v,x,y,z); ctx.fillStyle='#7ab8ff'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('v', p[0]+8, p[1]-8);
      E.big('v = (3, 2, '+z+'),  |v| = √(9+4+'+(z*z)+') = '+mag.toFixed(2), '공간벡터 — 9장의 모든 것이 z 하나 추가로 그대로! |v|=√(x²+y²+z²)'); }
  },

  // 11.2b 공간벡터 내적
  { id:'ch11_03',
    enter:function(E){ this.s={}; E.setOn([]);
      E.quiz({q:'a=(1, 2, 2), b=(2, 0, −1) 의 내적 a·b 는?', choices:['0','4','2','6'], answer:0, explain:'1·2 + 2·0 + 2·(−1) = 2 + 0 − 2 = 0 → 수직!'}); },
    draw:function(E){ var ctx=E.ctx, v=view(E); axes(ctx,v,4);
      arrow3(ctx,v,1,2,2,'#7ab8ff'); arrow3(ctx,v,2,0,-1,'#8fe3b5');
      var pa=p3(v,1,2,2), pb=p3(v,2,0,-1);
      ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('a', pa[0]+8, pa[1]); ctx.fillStyle='#8fe3b5'; ctx.fillText('b', pb[0]+8, pb[1]);
      E.big('a · b = 1·2 + 2·0 + 2·(−1) = 0', '내적도 성분 하나 추가 (9장 그대로) · 0이면 공간에서도 수직'); }
  },

  // ══════════ 11.3 구의 방정식 ══════════
  { id:'ch11_04',
    enter:function(E){ this.s={r:2.5}; E.setOn([]);
      E.controls('<div class="ctrl"><label>반지름 r</label><input type="range" id="sr" min="1" max="3" step="0.5" value="2.5"><output id="sro">2.5</output></div>');
      var self=this; E.bind('#sr','input',function(e){ self.s.r=+e.target.value; document.getElementById('sro').textContent=(+e.target.value); E.blip(440,0.1); }); },
    draw:function(E){ var ctx=E.ctx, v=view(E), r=this.s.r; axes(ctx,v,4);
      var o=p3(v,0,0,0);
      // 윤곽(구의 정투영 = 원)
      ctx.strokeStyle='rgba(122,184,255,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(o[0],o[1], r*v.S, 0, TAU); ctx.stroke();
      // 적도(z=0 원) → 타원
      ctx.strokeStyle='rgba(143,227,181,0.7)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var i=0;i<=60;i++){ var th=TAU*i/60, p=p3(v,r*Math.cos(th),r*Math.sin(th),0); if(i===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke();
      // 자오선(x-z 평면 원)
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.5; ctx.beginPath();
      for(var j=0;j<=60;j++){ var ph=TAU*j/60, q=p3(v,r*Math.cos(ph),0,r*Math.sin(ph)); if(j===0)ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]); } ctx.stroke();
      // 반지름선
      line(ctx,o,p3(v,r,0,0),'rgba(255,255,255,0.6)',1.5);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(o[0],o[1],3,0,TAU); ctx.fill();
      E.big('x² + y² + z² = '+(r*r), '구 = 중심에서 거리 r인 점들 (6장 원의 3차원판, 거리공식 z 추가)'); }
  },

  // 11.3b 평면과 법선
  { id:'ch11_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, v=view(E); axes(ctx,v,4);
      // 평면 z = 1.5 (사각형 패치)
      var h=1.5, c=[[ -2,-2],[2,-2],[2,2],[-2,2] ].map(function(p){ return p3(v,p[0],p[1],h); });
      ctx.fillStyle='rgba(122,184,255,0.16)'; ctx.strokeStyle='rgba(122,184,255,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(c[0][0],c[0][1]); for(var i=1;i<4;i++)ctx.lineTo(c[i][0],c[i][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 법선 벡터 (평면 중심에서 위로)
      var ctr=p3(v,0,0,h), ntop=p3(v,0,0,h+1.8);
      line(ctx,ctr,ntop,'#ffb27a',3);
      var ang=Math.atan2(ntop[1]-ctr[1],ntop[0]-ctr[0]); ctx.fillStyle='#ffb27a';
      ctx.beginPath(); ctx.moveTo(ntop[0],ntop[1]); ctx.lineTo(ntop[0]-12*Math.cos(ang-0.4),ntop[1]-12*Math.sin(ang-0.4)); ctx.lineTo(ntop[0]-12*Math.cos(ang+0.4),ntop[1]-12*Math.sin(ang+0.4)); ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('법선 n', ntop[0]+8, ntop[1]);
      ctx.fillStyle='#7ab8ff'; ctx.fillText('평면', c[2][0]-30, c[2][1]+4);
      E.big('평면: ax + by + cz = d', '평면은 법선벡터 n=(a,b,c) 하나로 방향이 정해집니다 (내적으로 정의)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
