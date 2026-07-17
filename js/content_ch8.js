/* 제8장 삼각함수 — 8.1 일반각·삼각함수 · 8.2 덧셈정리 · 8.3 삼각함수와 삼각형
   동작(behavior)만. 텍스트는 content/ch8.json
   ※ 단위원은 Plot을 쓰지 않고 직접 그려 항상 정확한 원으로 표시(픽셀 반지름 고정) */
(function(){
  var TAU=Math.PI*2, D2R=Math.PI/180;
  function axesXY(ctx,cx,cy,R){ ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-R*1.4,cy); ctx.lineTo(cx+R*1.4,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-R*1.4); ctx.lineTo(cx,cy+R*1.4); ctx.stroke(); }

  var scenes=[

  // ══════════ 8.1 단위원과 삼각함수 ══════════
  // 8.1a 단위원 — sin·cos는 좌표
  { id:'ch8_01',
    enter:function(E){ this.s={deg:30}; E.setOn([]);
      E.controls('<div class="ctrl"><label>각 θ (도)</label><input type="range" id="th" min="0" max="360" step="15" value="30"><output id="tho">30°</output></div>');
      var self=this; E.bind('#th','input',function(e){ self.s.deg=+e.target.value; document.getElementById('tho').textContent=e.target.value+'°'; E.blip(360+self.s.deg,0.08); }); },
    draw:function(E){ var ctx=E.ctx, deg=this.s.deg, t=deg*D2R, cx=E.W/2, cy=E.H*0.46, R=Math.min(E.H*0.26,E.W*0.20);
      axesXY(ctx,cx,cy,R);
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      var px=cx+R*Math.cos(t), py=cy-R*Math.sin(t);
      // 각 호
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R*0.28,0,-t,true); ctx.stroke();
      var lt=(deg/2)*D2R; ctx.fillStyle='#ffb27a'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('θ='+deg+'°', cx+R*0.50*Math.cos(lt), cy-R*0.50*Math.sin(lt)); ctx.textBaseline='alphabetic';
      // cos(가로), sin(세로)
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,cy); ctx.stroke();
      ctx.strokeStyle='#8fe3b5'; ctx.beginPath(); ctx.moveTo(px,cy); ctx.lineTo(px,py); ctx.stroke();
      // 반지름
      ctx.strokeStyle='rgba(255,217,189,0.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(px,py,6,0,TAU); ctx.fill();
      ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#7ab8ff'; ctx.fillText('cos θ', (cx+px)/2, cy+(py>cy?-10:18));
      ctx.fillStyle='#8fe3b5'; ctx.textAlign='left'; ctx.fillText('sin θ', px+(px<cx?-44:8), (cy+py)/2);
      E.big('cos '+deg+'° = '+Math.cos(t).toFixed(3)+',  sin '+deg+'° = '+Math.sin(t).toFixed(3), '단위원 위 점의 좌표 = (cos θ, sin θ)'); }
  },

  // 8.2 사인·코사인 그래프 — 원이 펴져 파동이 된다
  { id:'ch8_02',
    enter:function(E){ this.s={deg:90}; E.setOn([]);
      E.controls('<div class="ctrl"><label>각 θ (도)</label><input type="range" id="tw" min="0" max="360" step="5" value="90"><output id="two">90°</output></div>');
      var self=this; E.bind('#tw','input',function(e){ self.s.deg=+e.target.value; document.getElementById('two').textContent=e.target.value+'°'; E.blip(360+self.s.deg,0.06); }); },
    draw:function(E){ var ctx=E.ctx, deg=this.s.deg, t=deg*D2R, A=Math.min(E.H*0.16,E.W*0.10);
      var ccx=E.W*0.24, ccy=E.H*0.42, R=A;
      // 왼쪽 단위원
      axesXY(ctx,ccx,ccy,R);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(ccx,ccy,R,0,TAU); ctx.stroke();
      var px=ccx+R*Math.cos(t), py=ccy-R*Math.sin(t);
      ctx.strokeStyle='rgba(255,217,189,0.8)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(ccx,ccy); ctx.lineTo(px,py); ctx.stroke();
      // 오른쪽 파동 영역
      var wx0=E.W*0.40, wx1=E.W*0.93, wmid=ccy;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(wx0,wmid); ctx.lineTo(wx1,wmid); ctx.stroke();
      function wX(ang){ return wx0+(ang/TAU)*(wx1-wx0); }
      // sin 곡선(초록)
      ctx.strokeStyle='#8fe3b5'; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=200;i++){ var a=t*i/200; var X=wX(a),Y=wmid-A*Math.sin(a); if(i===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      // cos 곡선(파랑, 옅게 전체)
      ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=1.8; ctx.beginPath();
      for(var j=0;j<=200;j++){ var a2=TAU*j/200; var X2=wX(a2),Y2=wmid-A*Math.cos(a2); if(j===0)ctx.moveTo(X2,Y2); else ctx.lineTo(X2,Y2); } ctx.stroke();
      // 연결선: 원의 높이 → 파동 끝
      var wpx=wX(t), wpy=wmid-A*Math.sin(t);
      ctx.strokeStyle='rgba(143,227,181,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(wpx,wpy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#8fe3b5'; ctx.beginPath(); ctx.arc(wpx,wpy,5,0,TAU); ctx.fill();
      ctx.fillStyle='#ffb27a'; ctx.beginPath(); ctx.arc(px,py,5,0,TAU); ctx.fill();
      ctx.fillStyle=E.COL.txt; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('0', wx0, wmid+18); ctx.fillText('π', wX(Math.PI), wmid+18); ctx.fillText('2π', wx1, wmid+18);
      ctx.fillStyle='#8fe3b5'; ctx.textAlign='left'; ctx.fillText('y = sin θ', wx1-70, wmid-A-8);
      E.big('sin '+deg+'° = '+Math.sin(t).toFixed(3), '단위원의 높이(sin)를 펼치면 → 파동! 원운동 = 진동'); }
  },

  // 8.3 라디안 — 호의 길이로 각을 잰다
  { id:'ch8_03',
    enter:function(E){ this.s={deg:57.3}; E.setOn([]);
      E.controls('<div class="ctrl"><label>각 θ (도)</label><input type="range" id="rd" min="0" max="360" step="1" value="57"><output id="rdo">57°</output></div>');
      var self=this; E.bind('#rd','input',function(e){ self.s.deg=+e.target.value; document.getElementById('rdo').textContent=e.target.value+'°'; E.blip(360+self.s.deg,0.06); }); },
    draw:function(E){ var ctx=E.ctx, deg=this.s.deg, t=deg*D2R, cx=E.W/2, cy=E.H*0.46, R=Math.min(E.H*0.26,E.W*0.20);
      axesXY(ctx,cx,cy,R);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      // 호(라디안 길이) 강조
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(cx,cy,R,0,-t,true); ctx.stroke();
      var mt=(deg/2)*D2R; ctx.fillStyle='#ffb27a'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('호 = '+t.toFixed(2), cx+R*1.30*Math.cos(mt), cy-R*1.30*Math.sin(mt)); ctx.textBaseline='alphabetic';
      // 반지름선 2개
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R,cy); ctx.stroke();
      var px=cx+R*Math.cos(t), py=cy-R*Math.sin(t);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
      // 반지름 길이 표시
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('반지름 = 1', cx+R/2, cy+18);
      var rad=t;
      E.big(deg+'° = '+rad.toFixed(3)+' rad', '호의 길이 = 라디안. 한 바퀴 360° = 2π rad ≈ 6.28'); }
  },

  // 8.4 덧셈정리 — sin(α+β)
  { id:'ch8_04',
    enter:function(E){ this.s={a:30,b:45}; E.setOn([]);
      E.controls('<div class="ctrl"><label>α</label><input type="range" id="aa" min="0" max="90" step="15" value="30"><output id="aao">30°</output><label style="margin-left:14px">β</label><input type="range" id="bb" min="0" max="90" step="15" value="45"><output id="bbo">45°</output></div>');
      var self=this;
      E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=e.target.value+'°'; E.blip(440,0.08); });
      E.bind('#bb','input',function(e){ self.s.b=+e.target.value; document.getElementById('bbo').textContent=e.target.value+'°'; E.blip(420,0.08); }); },
    draw:function(E){ var ctx=E.ctx, a=this.s.a*D2R, b=this.s.b*D2R, cx=E.W/2, cy=E.H*0.48, R=Math.min(E.H*0.25,E.W*0.19);
      axesXY(ctx,cx,cy,R);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      function ray(ang,col,lab){ var px=cx+R*Math.cos(ang), py=cy-R*Math.sin(ang); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,5,0,TAU); ctx.fill();
        if(lab){ ctx.font='600 14px sans-serif'; ctx.textAlign=px<cx?'right':'left'; ctx.fillText(lab, px+(px<cx?-8:8), py+(py<cy?-6:14)); } }
      ray(a,'#7ab8ff','α='+this.s.a+'°'); ray(a+b,'#ffb27a','α+β='+(this.s.a+this.s.b)+'°');
      var lhs=Math.sin(a+b), rhs=Math.sin(a)*Math.cos(b)+Math.cos(a)*Math.sin(b);
      ctx.fillStyle=E.COL.txt; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('파랑 = α, 주황 = α+β', cx, cy+R*1.35);
      E.big('sin(α+β) = sinα·cosβ + cosα·sinβ', 'sin('+this.s.a+'°+'+this.s.b+'°) = '+lhs.toFixed(3)+' = '+rhs.toFixed(3)+' ✓'); }
  },

  // 8.5 사인법칙 — a/sinA = 2R
  { id:'ch8_05',
    enter:function(E){ this.s={va:100}; E.setOn([]);
      E.controls('<div class="ctrl"><label>꼭짓점 A 위치</label><input type="range" id="va" min="60" max="160" step="2" value="100"><output id="vao">100°</output></div>');
      var self=this; E.bind('#va','input',function(e){ self.s.va=+e.target.value; document.getElementById('vao').textContent=e.target.value+'°'; E.blip(440,0.08); }); },
    draw:function(E){ var ctx=E.ctx, cx=E.W/2, cy=E.H*0.40, R=Math.min(E.H*0.20,E.W*0.16);
      // 외접원
      ctx.strokeStyle='rgba(122,184,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.stroke();
      ctx.fillStyle='rgba(122,184,255,0.5)'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('외접원 (반지름 R)', cx, cy-R-10);
      // 삼각형 꼭짓점(원 위) — A만 슬라이더로 이동, B·C 고정
      var angs=[this.s.va,210,330]; var pts=angs.map(function(d){ var t=d*D2R; return [cx+R*Math.cos(t), cy-R*Math.sin(t)]; });
      ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[1][0],pts[1][1]); ctx.lineTo(pts[2][0],pts[2][1]); ctx.closePath(); ctx.stroke();
      var labs=['A','B','C'];
      for(var i=0;i<3;i++){ ctx.fillStyle='#ffd9bd'; ctx.beginPath(); ctx.arc(pts[i][0],pts[i][1],5,0,TAU); ctx.fill();
        ctx.font='600 15px sans-serif'; ctx.fillText(labs[i], pts[i][0]+(pts[i][0]<cx?-16:16), pts[i][1]); }
      // 실제 변 길이(픽셀 → 화면단위는 R로 정규화: 픽셀거리 그대로 사용)
      function dist(p,q){ return Math.hypot(p[0]-q[0],p[1]-q[1]); }
      var a=dist(pts[1],pts[2]), b=dist(pts[0],pts[2]), c=dist(pts[0],pts[1]);  // a=BC, b=CA, c=AB
      // 마주각: 원에 내접하므로 내접각 = 반대편 호의 절반. 각 꼭짓점의 내각을 좌표로 실계산
      function ang(v,p1,p2){ var u1=[p1[0]-v[0],p1[1]-v[1]], u2=[p2[0]-v[0],p2[1]-v[1]];
        var d=(u1[0]*u2[0]+u1[1]*u2[1])/(Math.hypot(u1[0],u1[1])*Math.hypot(u2[0],u2[1])); return Math.acos(Math.max(-1,Math.min(1,d))); }
      var A=ang(pts[0],pts[1],pts[2]), B=ang(pts[1],pts[0],pts[2]), C=ang(pts[2],pts[0],pts[1]);
      // 꼭짓점 각도(실계산) — 이름 옆에 작게 표시
      var angDeg=[A,B,C].map(function(r){ return (r/D2R).toFixed(0); });
      ctx.fillStyle='rgba(255,217,189,0.75)'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      for(var k=0;k<3;k++){ ctx.fillText('('+angDeg[k]+'°)', pts[k][0]+(pts[k][0]<cx?-16:16), pts[k][1]+(pts[k][1]<cy?-22:30)); }
      // 변 라벨
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif';
      ctx.fillText('a', (pts[1][0]+pts[2][0])/2, (pts[1][1]+pts[2][1])/2+16);
      ctx.fillText('b', (pts[0][0]+pts[2][0])/2+14, (pts[0][1]+pts[2][1])/2);
      ctx.fillText('c', (pts[0][0]+pts[1][0])/2-14, (pts[0][1]+pts[1][1])/2);
      // a/sinA, b/sinB, c/sinC, 2R 실계산 표시(픽셀 단위; 2R = 2*R 픽셀)
      var rA=a/Math.sin(A), rB=b/Math.sin(B), rC=c/Math.sin(C);
      ctx.fillStyle='#cfcdc6'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      var ty=cy+R+34;
      ctx.fillText('a/sinA = '+rA.toFixed(1)+'   b/sinB = '+rB.toFixed(1)+'   c/sinC = '+rC.toFixed(1), cx, ty);
      ctx.fillStyle='#ffb27a'; ctx.fillText('= 2R = '+(2*R).toFixed(1)+' (모두 일치 ✓)', cx, ty+22);
      E.big('a/sin A = b/sin B = c/sin C = 2R', '사인법칙 — 변과 마주보는 각의 sin 비율은 외접원 지름 2R로 일정. A를 움직여도 세 비가 모두 같습니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
