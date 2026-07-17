/* 미적분학 12장 — 공간벡터 (Stewart Ch.12)
   12.1 3차원 벡터 · 12.2 벡터 덧셈 · 12.3 내적 · 12.4 외적 · 12.5 평면과 법선
   동작만. 텍스트=content/calc12.json. 보라 테마. 골든룰=크기·각·내적·외적 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  // 간단 3D 투영(방위각 az로 회전, z=위)
  function P3(x,y,z,az,cx,cy,sc){ var c=Math.cos(az), s=Math.sin(az), rx=x*c-y*s, ry=x*s+y*c; return [cx+rx*sc, cy-z*sc+ry*sc*0.42]; }
  // 마우스 드래그 3D 회전용 투영: yaw(z축 기준)→pitch(회전된 x'축 기준) 표준 오일러 회전 후 직교투영
  function proj3(p, yaw, pitch, cx, cy, scale){
    var x=p[0], y=p[1], z=p[2];
    var cyv=Math.cos(yaw), syv=Math.sin(yaw);
    var x1 = x*cyv - y*syv, y1 = x*syv + y*cyv;   // yaw: z축 둘레 회전
    var cp=Math.cos(pitch), sp=Math.sin(pitch);
    var y2 = y1*cp - z*sp, z2 = y1*sp + z*cp;      // pitch: 회전된 x'축 둘레 회전
    return [cx + x1*scale, cy - z2*scale];          // 화면 X=x1, 화면 Y=-z2(위가 +)
  }
  function arrow(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-10*Math.cos(a-0.4),y2-10*Math.sin(a-0.4)); ctx.lineTo(x2-10*Math.cos(a+0.4),y2-10*Math.sin(a+0.4)); ctx.fill(); }

  var scenes = [

  // 12.1 3차원 벡터 — 회전하는 좌표축 + 벡터 v=(2,2,3)
  { id:'calc12_01',
    enter:function(E){ this.s={yaw:0.6,pitch:0.5}; E.setOn([]);
      E.controls('<div class="ctrl"><label>좌우 회전(yaw)</label><input type="range" id="az" min="0" max="6.28" step="0.04" value="0.6"><output id="azo">0.60</output></div>'
        +'<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">'
        +'<button class="v3btn" id="vpDefault" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">사선(기본)</button>'
        +'<button class="v3btn" id="vpFront" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">정면 x-z</button>'
        +'<button class="v3btn" id="vpSide" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">측면 y-z</button>'
        +'<button class="v3btn" id="vpTop" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">위 x-y</button>'
        +'</div>');
      var self=this;
      function syncSlider(){ var az=self.s.yaw; document.getElementById('az').value=az; document.getElementById('azo').textContent=az.toFixed(2); }
      E.bind('#az','input',function(e){ self.s.yaw=+e.target.value; document.getElementById('azo').textContent=(+e.target.value).toFixed(2); E.blip(380,0.05); });
      E.bind('#vpDefault','click',function(){ self.s.yaw=0.6; self.s.pitch=0.5; syncSlider(); E.blip(380,0.05); });
      E.bind('#vpFront','click',function(){ self.s.yaw=0.0; self.s.pitch=0.12; syncSlider(); E.blip(380,0.05); });
      E.bind('#vpSide','click',function(){ self.s.yaw=1.5708; self.s.pitch=0.12; syncSlider(); E.blip(380,0.05); });
      E.bind('#vpTop','click',function(){ self.s.yaw=0.3; self.s.pitch=1.45; syncSlider(); E.blip(380,0.05); }); },
    down:function(E,cx,cy){ this.s.drag={x:cx,y:cy}; },
    move:function(E,cx,cy){ var s=this.s; if(!s.drag) return; var dx=cx-s.drag.x, dy=cy-s.drag.y;
      s.yaw += dx*0.01; s.pitch += dy*0.01;
      if(s.pitch>1.4) s.pitch=1.4; if(s.pitch<-1.4) s.pitch=-1.4;
      s.drag={x:cx,y:cy};
      var azEl=document.getElementById('az'), azoEl=document.getElementById('azo');
      if(azEl){ azEl.value=s.yaw; } if(azoEl){ azoEl.textContent=s.yaw.toFixed(2); } },
    up:function(E){ this.s.drag=null; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, cx=W*0.46, cy=H*0.60, sc=Math.min(W,H)*0.095;
      function pt(x,y,z){ return proj3([x,y,z], s.yaw, s.pitch, cx, cy, sc); }
      var O=pt(0,0,0);
      arrow(ctx,O[0],O[1],pt(3.5,0,0)[0],pt(3.5,0,0)[1],'rgba(240,136,138,0.7)',1.5);   // x
      arrow(ctx,O[0],O[1],pt(0,3.5,0)[0],pt(0,3.5,0)[1],'rgba(126,224,176,0.7)',1.5);   // y
      arrow(ctx,O[0],O[1],pt(0,0,3.5)[0],pt(0,0,3.5)[1],'rgba(122,184,255,0.7)',1.5);   // z
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; var xl=pt(3.7,0,0),yl=pt(0,3.7,0),zl=pt(0,0,3.7);
      ctx.fillText('x',xl[0],xl[1]); ctx.fillText('y',yl[0],yl[1]); ctx.fillText('z',zl[0],zl[1]);
      var v=[2,2,3], V=pt(v[0],v[1],v[2]);
      // 보조 점선(바닥 투영)
      var Vf=pt(v[0],v[1],0); ctx.strokeStyle='rgba(185,156,255,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(Vf[0],Vf[1]); ctx.lineTo(V[0],V[1]); ctx.stroke(); ctx.setLineDash([]);
      arrow(ctx,O[0],O[1],V[0],V[1],VIO,3);
      var mag=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      ctx.fillStyle=VIO; ctx.font='13px sans-serif'; ctx.fillText('v=(2,2,3)', V[0]+8, V[1]-4);
      E.tapHint(W/2, H*0.95, '드래그 = 회전 · 버튼 = 각도 바로가기', false);
      E.big('v = (2, 2, 3)   ·   |v| = √(2²+2²+3²) = '+mag.toFixed(3), '공간의 벡터는 세 성분 — 크기는 √(x²+y²+z²) (피타고라스의 3D판). 드래그하거나 버튼으로 시점을 돌려 보세요'); }
  },

  // 12.2 벡터 덧셈 — 평행사변형 법칙 (2D)
  { id:'calc12_02',
    enter:function(E){ this.s={th:1.0}; E.Plot.range(-1,6,-1,5).lab('x','y');
      E.controls('<div class="ctrl"><label>v 방향 θ</label><input type="range" id="vt" min="0" max="3.14" step="0.04" value="1.0"><output id="vto">1.00</output></div>');
      var self=this; E.bind('#vt','input',function(e){ self.s.th=+e.target.value; document.getElementById('vto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      var u=[3,1], v=[2.4*Math.cos(th),2.4*Math.sin(th)], w=[u[0]+v[0],u[1]+v[1]];
      function S(p){ return [P.X(p[0]),P.Y(p[1])]; } var O=[P.X(0),P.Y(0)];
      P.axes();
      // 평행사변형 보조변
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); var Su=S(u),Sv=S(v),Sw=S(w); ctx.moveTo(Su[0],Su[1]); ctx.lineTo(Sw[0],Sw[1]); ctx.moveTo(Sv[0],Sv[1]); ctx.lineTo(Sw[0],Sw[1]); ctx.stroke(); ctx.setLineDash([]);
      arrow(ctx,O[0],O[1],Su[0],Su[1],BLU,2.5);
      arrow(ctx,O[0],O[1],Sv[0],Sv[1],GLD,2.5);
      arrow(ctx,O[0],O[1],Sw[0],Sw[1],VIO,3);
      ctx.font='13px sans-serif';
      ctx.fillStyle=BLU; ctx.fillText('u', Su[0]+8, Su[1]+4);
      ctx.fillStyle=GLD; ctx.fillText('v', Sv[0]-4, Sv[1]-8);
      ctx.fillStyle=VIO; ctx.fillText('u+v', Sw[0]+8, Sw[1]-4);
      E.big('u + v = ('+w[0].toFixed(2)+', '+w[1].toFixed(2)+')', '두 벡터를 이어 붙이면 합 — 평행사변형의 대각선 (성분끼리 더하기)'); }
  },

  // 12.3 내적  u·v = |u||v|cosθ  (사영)
  { id:'calc12_03',
    enter:function(E){ this.s={th:0.7}; E.Plot.range(-3,4,-2.5,3).lab('x','y');
      E.controls('<div class="ctrl"><label>사잇각 θ</label><input type="range" id="dt" min="0" max="3.14" step="0.03" value="0.7"><output id="dto">0.70</output></div>');
      var self=this; E.bind('#dt','input',function(e){ self.s.th=+e.target.value; document.getElementById('dto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      var u=[3,0], v=[2.5*Math.cos(th),2.5*Math.sin(th)];
      function S(p){ return [P.X(p[0]),P.Y(p[1])]; } var O=[P.X(0),P.Y(0)];
      P.axes();
      var dot=u[0]*v[0]+u[1]*v[1], proj=dot/3;  // v의 u방향 사영 길이
      // 사영(초록)
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); var Sv=S(v),Sp=S([proj,0]); ctx.beginPath(); ctx.moveTo(Sv[0],Sv[1]); ctx.lineTo(Sp[0],Sp[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=GRN; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(Sp[0],Sp[1]); ctx.stroke();
      arrow(ctx,O[0],O[1],S(u)[0],S(u)[1],BLU,2.5);
      arrow(ctx,O[0],O[1],Sv[0],Sv[1],GLD,2.5);
      ctx.font='13px sans-serif';
      ctx.fillStyle=BLU; ctx.fillText('u', S(u)[0]+8, S(u)[1]+4);
      ctx.fillStyle=GLD; ctx.fillText('v', Sv[0]+6, Sv[1]-6);
      ctx.fillStyle=GRN; ctx.fillText('사영 '+proj.toFixed(2), (O[0]+Sp[0])/2-18, O[1]+18);
      var sign = dot>0.05?'양수 (예각)':dot<-0.05?'음수 (둔각)':'0 (수직!)';
      E.big('u · v = |u||v|cosθ = '+dot.toFixed(2)+'  ('+sign+')', '내적 = 한 벡터를 다른 벡터에 사영한 길이(초록)×크기. 수직이면 0'); }
  },

  // 12.4 외적  |u×v| = |u||v|sinθ = 평행사변형 넓이
  { id:'calc12_04',
    enter:function(E){ this.s={th:1.0}; E.Plot.range(-1,5,-1,4).lab('x','y');
      E.controls('<div class="ctrl"><label>사잇각 θ</label><input type="range" id="ct" min="0.05" max="3.1" step="0.03" value="1.0"><output id="cto">1.00</output></div>');
      var self=this; E.bind('#ct','input',function(e){ self.s.th=+e.target.value; document.getElementById('cto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      var u=[3,0], v=[2.6*Math.cos(th),2.6*Math.sin(th)], w=[u[0]+v[0],u[1]+v[1]];
      function S(p){ return [P.X(p[0]),P.Y(p[1])]; } var O=[P.X(0),P.Y(0)];
      // 평행사변형 채움
      ctx.fillStyle='rgba(185,156,255,0.20)'; ctx.beginPath(); var a=S([0,0]),b=S(u),c=S(w),d=S(v); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.lineTo(d[0],d[1]); ctx.closePath(); ctx.fill();
      P.axes();
      arrow(ctx,O[0],O[1],S(u)[0],S(u)[1],BLU,2.5);
      arrow(ctx,O[0],O[1],S(v)[0],S(v)[1],GLD,2.5);
      var cross=Math.abs(u[0]*v[1]-u[1]*v[0]);   // |u×v| = 넓이
      ctx.font='13px sans-serif';
      ctx.fillStyle=BLU; ctx.fillText('u', S(u)[0]+8, S(u)[1]+4);
      ctx.fillStyle=GLD; ctx.fillText('v', S(v)[0]+6, S(v)[1]-6);
      var Sc=S([(w[0]+0)/2,(w[1]+0)/2]); ctx.fillStyle=VIO; ctx.textAlign='center'; ctx.fillText('넓이 |u×v|='+cross.toFixed(2), Sc[0], Sc[1]); ctx.textAlign='left';
      E.big('|u × v| = |u||v|sinθ = '+cross.toFixed(3), '외적의 크기 = 두 벡터가 만드는 평행사변형 넓이. 나란하면 0, 수직이면 최대'); }
  },

  // 12.5 평면과 법선벡터 (3D)
  { id:'calc12_05',
    enter:function(E){ this.s={az:0.7}; E.setOn([]);
      E.controls('<div class="ctrl"><label>시점 회전</label><input type="range" id="pz" min="0" max="6.28" step="0.04" value="0.7"><output id="pzo">0.70</output></div>');
      var self=this; E.bind('#pz','input',function(e){ self.s.az=+e.target.value; document.getElementById('pzo').textContent=(+e.target.value).toFixed(2); E.blip(380,0.05); }); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, az=s.az, cx=W*0.46, cy=H*0.56, sc=Math.min(W,H)*0.12;
      function pt(x,y,z){ return P3(x,y,z,az,cx,cy,sc); }
      // 평면 z=0 패치(법선 (0,0,1))
      var c1=pt(-2,-2,0),c2=pt(2,-2,0),c3=pt(2,2,0),c4=pt(-2,2,0);
      ctx.fillStyle='rgba(185,156,255,0.18)'; ctx.strokeStyle='rgba(185,156,255,0.6)'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(c1[0],c1[1]); ctx.lineTo(c2[0],c2[1]); ctx.lineTo(c3[0],c3[1]); ctx.lineTo(c4[0],c4[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      var O=pt(0,0,0), N=pt(0,0,2.6);
      arrow(ctx,O[0],O[1],N[0],N[1],GLD,3);   // 법선
      ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('법선 n=(0,0,1)', N[0]+6, N[1]);
      var pc=pt(-1.4,1.4,0); ctx.fillStyle=VIO; ctx.fillText('평면', pc[0], pc[1]);
      E.big('평면: n · (r − r₀) = 0', '평면은 한 점과 그에 수직인 법선벡터 n으로 완전히 정해집니다 — 시점을 돌려 보세요'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
