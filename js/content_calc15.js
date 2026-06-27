/* 미적분학 15장 — 벡터미적분 (Stewart Ch.16)
   15.1 벡터장 · 15.2 선적분 · 15.3 보존장 · 15.4 발산과 회전 · 15.5 그린 정리
   동작만. 텍스트=content/calc15.json. 보라 테마. 골든룰=선적분·발산·회전 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function arr(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||1.4; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1), L=7; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-L*Math.cos(a-0.5),y2-L*Math.sin(a-0.5)); ctx.lineTo(x2-L*Math.cos(a+0.5),y2-L*Math.sin(a+0.5)); ctx.fill(); }
  function field(E,P,Pf,Qf,col,scale){ var ctx=E.ctx;
    for(var gx=-2.5;gx<=2.5;gx+=0.7){ for(var gy=-2.5;gy<=2.5;gy+=0.7){ var u=Pf(gx,gy), v=Qf(gx,gy), n=Math.hypot(u,v)||1, L=Math.min(0.32, n*0.12)/n*scale;
      arr(ctx, P.X(gx),P.Y(gy), P.X(gx+u*L),P.Y(gy+v*L), col||'rgba(185,156,255,0.7)', 1.3); } } }

  var FIELDS=[
    {name:'회전장 F=(−y, x)', P:function(x,y){return -y;}, Q:function(x,y){return x;}},
    {name:'발산원 F=(x, y)',   P:function(x,y){return x;},  Q:function(x,y){return y;}},
    {name:'수렴장 F=(−x, −y)', P:function(x,y){return -x;}, Q:function(x,y){return -y;}},
    {name:'층밀림 F=(y, 0)',   P:function(x,y){return y;},  Q:function(x,y){return 0;}}
  ];

  var scenes = [

  // 15.1 벡터장 — 평면의 각 점에 화살표
  { id:'calc15_01',
    enter:function(E){ this.s={t:0}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>장 종류</label><input type="range" id="ft" min="0" max="3" step="1" value="0"><output id="fto">0</output></div>');
      var self=this; E.bind('#ft','input',function(e){ self.s.t=+e.target.value; document.getElementById('fto').textContent=e.target.value; E.blip(380+self.s.t*60,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, F=FIELDS[s.t]; P.axes();
      field(E,P,F.P,F.Q,'rgba(185,156,255,0.8)',1);
      E.big(F.name, '벡터장: 공간의 모든 점에 벡터(화살표) 하나 — 바람·물살·전기력·중력장이 모두 벡터장입니다'); }
  },

  // 15.2 선적분 — 경로를 따라 장이 한 일  ∮F·dr  (회전장, 원)
  { id:'calc15_02',
    enter:function(E){ this.s={t:1.5}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>경로 진행</label><input type="range" id="lt" min="0" max="6.28" step="0.04" value="1.5"><output id="lto">1.50</output></div>');
      var self=this; E.bind('#lt','input',function(e){ self.s.t=+e.target.value; document.getElementById('lto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, t=s.t, R=2, F=FIELDS[0];
      field(E,P,F.P,F.Q,'rgba(185,156,255,0.35)',1);
      // 원 경로
      ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=1.4; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(R*Math.cos(a)),y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      // 지나온 경로(금색) + 선적분 누적
      var W=0, m=200, h=t/m; ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath();
      for(var k=0;k<=m;k++){ var th=k*h, x=R*Math.cos(th), y=R*Math.sin(th); var sx=P.X(x),sy=P.Y(y); if(k===0)ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
        if(k>0){ var dx=-R*Math.sin(th)*h, dy=R*Math.cos(th)*h; W+=F.P(x,y)*dx+F.Q(x,y)*dy; } } ctx.stroke();
      var px=R*Math.cos(t), py=R*Math.sin(t); P.dot(px,py,GRN);
      arr(ctx,P.X(px),P.Y(py),P.X(px+F.P(px,py)*0.18),P.Y(py+F.Q(px,py)*0.18),GLD,2);
      E.big('∫F·dr = '+W.toFixed(3)+'   (한 바퀴면 '+(2*Math.PI*R*R).toFixed(2)+')', '선적분 = 경로를 따라 장이 한 일의 합. 회전장은 도는 방향으로 +일을 쌓습니다'); }
  },

  // 15.3 보존장 — 경로 무관(퍼텐셜)  F=∇f, f=x²+y²
  { id:'calc15_03',
    enter:function(E){ this.s={bend:0.5}; E.Plot.range(-1,4,-1,4).lab('x','y');
      E.controls('<div class="ctrl"><label>경로 휘기</label><input type="range" id="bd" min="-1.5" max="1.5" step="0.05" value="0.5"><output id="bdo">0.50</output></div>');
      var self=this; E.bind('#bd','input',function(e){ self.s.bend=+e.target.value; document.getElementById('bdo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, bend=s.bend;
      function Pf(x,y){return 2*x;} function Qf(x,y){return 2*y;}   // ∇(x²+y²)
      field(E,P,Pf,Qf,'rgba(185,156,255,0.30)',0.8);
      // 시작 A(0,0) 끝 B(3,3), 휘는 경로
      var A=[0,0], B=[3,3], W=0, m=200;
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath();
      for(var k=0;k<=m;k++){ var u=k/m, x=A[0]+(B[0]-A[0])*u + bend*Math.sin(Math.PI*u)*2, y=A[1]+(B[1]-A[1])*u - bend*Math.sin(Math.PI*u)*2;
        var sx=P.X(x),sy=P.Y(y); if(k===0)ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
        if(k>0){ var pu=(k-1)/m, px=A[0]+(B[0]-A[0])*pu+bend*Math.sin(Math.PI*pu)*2, py=A[1]+(B[1]-A[1])*pu-bend*Math.sin(Math.PI*pu)*2; W+=Pf(px,py)*(x-px)+Qf(px,py)*(y-py); } } ctx.stroke();
      P.dot(0,0,GRN,'A'); P.dot(3,3,GLD,'B');
      E.big('∫F·dr = f(B) − f(A) = '+W.toFixed(2)+'  (경로 무관!)', '보존장에선 일이 시작·끝점에만 달림 — 길을 휘어도 값은 18로 같습니다 (선적분 기본정리)'); }
  },

  // 15.4 발산과 회전
  { id:'calc15_04',
    enter:function(E){ this.s={t:0}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>장 종류</label><input type="range" id="dt" min="0" max="3" step="1" value="0"><output id="dto">0</output></div>');
      var self=this; E.bind('#dt','input',function(e){ self.s.t=+e.target.value; document.getElementById('dto').textContent=e.target.value; E.blip(380+self.s.t*60,0.08); }); E.setOn([]); },
    draw:function(E){ var P=E.Plot, s=this.s, F=FIELDS[s.t]; P.axes();
      field(E,P,F.P,F.Q,'rgba(185,156,255,0.7)',1);
      var e=1e-3, x=0.0001, y=0.0001;
      var div=(F.P(x+e,y)-F.P(x-e,y))/(2*e) + (F.Q(x,y+e)-F.Q(x,y-e))/(2*e);
      var curl=(F.Q(x+e,y)-F.Q(x-e,y))/(2*e) - (F.P(x,y+e)-F.P(x,y-e))/(2*e);
      E.big('div F = '+div.toFixed(2)+'   ·   curl F = '+curl.toFixed(2),
        '발산=퍼져나가는 정도(샘/싱크) · 회전=소용돌이치는 정도. 회전장은 div=0·curl=2, 발산원은 div=2·curl=0'); }
  },

  // 15.5 그린 정리  ∮F·dr = ∬(Qx − Py) dA
  { id:'calc15_05',
    enter:function(E){ this.s={R:1.8}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>영역 반지름 R</label><input type="range" id="gr" min="0.6" max="2.6" step="0.05" value="1.8"><output id="gro">1.80</output></div>');
      var self=this; E.bind('#gr','input',function(e){ self.s.R=+e.target.value; document.getElementById('gro').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, R=s.R, F=FIELDS[0];
      // 영역 채움 + 회전(curl=2) 색
      ctx.fillStyle='rgba(185,156,255,0.16)'; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(R*Math.cos(a)),y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.fill();
      field(E,P,F.P,F.Q,'rgba(185,156,255,0.5)',0.9);
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); for(var a2=0;a2<=6.30;a2+=0.04){ var x=P.X(R*Math.cos(a2)),y=P.Y(R*Math.sin(a2)); if(a2===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      // 경계 선적분(실계산)
      var circ=0,m=400,h=2*Math.PI/m; for(var k=0;k<m;k++){ var th=k*h, x=R*Math.cos(th),y=R*Math.sin(th), dx=-R*Math.sin(th)*h, dy=R*Math.cos(th)*h; circ+=F.P(x,y)*dx+F.Q(x,y)*dy; }
      var dblint=2*Math.PI*R*R;  // ∬curl dA = ∬2 dA = 2·πR²
      E.big('∮F·dr = '+circ.toFixed(2)+'  =  ∬curl dA = '+dblint.toFixed(2),
        '경계를 도는 총 순환 = 내부 회전(curl)의 총합 — 그린 정리가 선적분과 이중적분을 잇습니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
