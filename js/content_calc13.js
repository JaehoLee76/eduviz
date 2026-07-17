/* 미적분학 13장 — 다변수 미분 (Stewart Ch.13~14)
   13.1 다변수함수(등고선) · 13.2 편도함수 · 13.3 기울기벡터 · 13.4 극값 · 13.5 라그랑주 승수
   동작만. 텍스트=content/calc13.json. 보라 테마. 골든룰=값·편도·기울기 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function arrow(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  // 3D 회전 투영: yaw(수직축 회전) 후 pitch(수평축 기울임). pitch~PI/2 = 위(등고선뷰, z성분 소멸)
  // pitch~0 = 옆(단면뷰, y1이 화면수직으로 접혀 z만 순수 높이축). front=카메라쪽 깊이(화가 알고리즘 정렬용)
  function proj3(p, yaw, pitch, cx, cy, scale){
    var x=p[0], y=p[1], z=p[2];
    var cyw=Math.cos(yaw), syw=Math.sin(yaw);
    var x1 = x*cyw - y*syw, y1 = x*syw + y*cyw;
    var cp=Math.cos(pitch), sp=Math.sin(pitch);
    var depth = y1*sp + z*cp;   // 화면 수직 성분(pitch에 따라 z<->y1 섞임)
    var front = y1*cp - z*sp;   // 카메라 쪽 깊이(정렬용, 화면엔 안 씀)
    return [ cx + x1*scale, cy - depth*scale*0.85, front ];
  }
  // 3D 곡면(와이어프레임+색채움 격자). f=높이함수, yaw/pitch=시점각, (cx,cy)=화면중심, scale=xy축척, zscale=높이축척
  function surface3(E, f, yaw, pitch, cx, cy, scale, zscale, xlo, xhi, ylo, yhi){
    var ctx=E.ctx, N=24;
    var pts=[]; // pts[i][j] = [x,y,z, sx,sy, front]
    for(var i=0;i<=N;i++){ pts[i]=[];
      var wx=xlo+(xhi-xlo)*i/N;
      for(var j=0;j<=N;j++){
        var wy=ylo+(yhi-ylo)*j/N;
        var wz=f(wx,wy);
        var pr=proj3([wx,wy,wz*zscale/scale], yaw, pitch, cx, cy, scale);
        pts[i][j]=[wx,wy,wz,pr[0],pr[1],pr[2]];
      }
    }
    // 색상(heat와 동일 팔레트: 낮음=파랑, 높음=금)
    function colOf(t){ t=t<0?0:t>1?1:t; var r,g,b;
      if(t<0.5){ var u=t*2; r=Math.round(40+u*(139-40)); g=Math.round(60+u*(111-60)); b=Math.round(120+u*(214-120)); }
      else { var u2=(t-0.5)*2; r=Math.round(139+u2*(255-139)); g=Math.round(111+u2*(210-111)); b=Math.round(214+u2*(122-214)); }
      return 'rgb('+r+','+g+','+b+')'; }
    // 격자 셀(사각형 폴리곤)을 화가 알고리즘으로 뒤(카메라에서 먼 것부터)에서 앞 순서로 정렬해 그림
    var cells=[];
    for(var i=0;i<N;i++){ for(var j=0;j<N;j++){
      var p00=pts[i][j], p10=pts[i+1][j], p11=pts[i+1][j+1], p01=pts[i][j+1];
      var avgFront=(p00[5]+p10[5]+p11[5]+p01[5])/4;
      var avgZ=(p00[2]+p10[2]+p11[2]+p01[2])/4;
      cells.push({p:[p00,p10,p11,p01], front:avgFront, z:avgZ});
    } }
    cells.sort(function(a,b){ return a.front-b.front; }); // 먼 것(front 작음)부터 = 화가 알고리즘
    for(var k=0;k<cells.length;k++){ var c=cells[k], p=c.p;
      ctx.beginPath(); ctx.moveTo(p[0][3],p[0][4]);
      for(var m=1;m<4;m++) ctx.lineTo(p[m][3],p[m][4]);
      ctx.closePath();
      ctx.fillStyle=colOf((c.z+1)/2); ctx.fill();
      ctx.strokeStyle='rgba(20,20,30,0.35)'; ctx.lineWidth=0.6; ctx.stroke();
    }
    return pts;
  }
  // 히트맵: f값을 색으로(낮음 파랑→중간 보라→높음 금)
  function heat(E,f,lo,hi){ var ctx=E.ctx, P=E.Plot, nx=46, ny=34;
    var x0=P.X(P.xmin), x1=P.X(P.xmax), y0=P.Y(P.ymax), y1=P.Y(P.ymin);
    var cw=(x1-x0)/nx, ch=(y1-y0)/ny;
    for(var i=0;i<nx;i++){ for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin), wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin);
      var t=(f(wx,wy)-lo)/(hi-lo); t=t<0?0:t>1?1:t; var r,g,b;
      if(t<0.5){ var u=t*2; r=Math.round(40+u*(139-40)); g=Math.round(60+u*(111-60)); b=Math.round(120+u*(214-120)); }
      else { var u2=(t-0.5)*2; r=Math.round(139+u2*(255-139)); g=Math.round(111+u2*(210-111)); b=Math.round(214+u2*(122-214)); }
      ctx.fillStyle='rgb('+r+','+g+','+b+')'; ctx.fillRect(x0+i*cw, y0+j*ch, cw+1, ch+1); } } }
  function grad(f,x,y){ var e=1e-3; return [ (f(x+e,y)-f(x-e,y))/(2*e), (f(x,y+e)-f(x,y-e))/(2*e) ]; }
  function F(x,y){ return Math.sin(x)*Math.cos(y); }   // 공통 풍경

  var scenes = [

  // 13.1 다변수함수 — 3D 곡면(드래그 회전), 점의 높이 z=f(x,y)
  { id:'calc13_01',
    enter:function(E){ this.s={x:1,y:0.5,yaw:0.6,pitch:0.7,drag:null}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="px" min="-3" max="3" step="0.1" value="1"><output id="pxo">1.0</output><label style="margin-left:12px">y</label><input type="range" id="py" min="-3" max="3" step="0.1" value="0.5"><output id="pyo">0.5</output></div>'
        +'<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">'
        +'<button id="vpDefault" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">사선(기본)</button>'
        +'<button id="vpTop" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">위=등고선</button>'
        +'<button id="vpSide" style="background:transparent;border:1px solid #b99cff;color:#b99cff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer">측면=단면</button>'
        +'</div>');
      var self=this;
      E.bind('#px','input',function(e){ self.s.x=+e.target.value; document.getElementById('pxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#py','input',function(e){ self.s.y=+e.target.value; document.getElementById('pyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); });
      E.bind('#vpDefault','click',function(){ self.s.yaw=0.6; self.s.pitch=0.7; E.blip(500,0.05); });
      E.bind('#vpTop','click',function(){ self.s.yaw=0.6; self.s.pitch=1.45; E.blip(600,0.05); });
      E.bind('#vpSide','click',function(){ self.s.yaw=0; self.s.pitch=0.05; E.blip(400,0.05); });
      E.setOn([]); },
    down:function(E,cx,cy){ this.s.drag={x:cx,y:cy}; },
    move:function(E,cx,cy){ var s=this.s; if(!s.drag) return; var dx=cx-s.drag.x, dy=cy-s.drag.y;
      s.yaw += dx*0.01; s.pitch += dy*0.01;
      if(s.pitch>1.45) s.pitch=1.45; if(s.pitch<-0.1) s.pitch=-0.1;
      s.drag={x:cx,y:cy}; },
    up:function(E){ this.s.drag=null; },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cx=W*0.5, cy=H*0.5, scale=Math.min(W,H)*0.135, zscale=Math.min(W,H)*0.12;
      surface3(E,F,s.yaw,s.pitch,cx,cy,scale,zscale,-3,3,-3,3);
      var z=F(s.x,s.y);
      var pTop=proj3([s.x,s.y,z*zscale/scale], s.yaw, s.pitch, cx, cy, scale);
      var pBase=proj3([s.x,s.y,-1*zscale/scale], s.yaw, s.pitch, cx, cy, scale);
      // 수직 기준선(관찰점의 xy평면 위치 ↔ 곡면 높이 연결, 입체감)
      ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.setLineDash([3,3]); ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(pBase[0],pBase[1]); ctx.lineTo(pTop[0],pTop[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(pTop[0],pTop[1],5,0,7); ctx.fill();
      ctx.strokeStyle='#241f33'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#ffffff'; ctx.font='13px sans-serif'; ctx.fillText('f='+z.toFixed(2), pTop[0]+8, pTop[1]-8);
      // 축 라벨(입체감 보조)
      var ax=proj3([3.3,0,-1*zscale/scale],s.yaw,s.pitch,cx,cy,scale);
      var ay=proj3([0,3.3,-1*zscale/scale],s.yaw,s.pitch,cx,cy,scale);
      var az=proj3([-3,-3,1*zscale/scale],s.yaw,s.pitch,cx,cy,scale);
      ctx.font='13px sans-serif'; ctx.fillStyle=DIM;
      ctx.fillText('x', ax[0], ax[1]); ctx.fillText('y', ay[0], ay[1]); ctx.fillText('z', az[0], az[1]);
      E.tapHint(W/2, H*0.95, '드래그 = 회전 · 버튼 = 각도 바로가기', false);
      E.big('f(x, y) = sin x · cos y = '+z.toFixed(3), '두 입력(x,y)에 높이 하나(z) — 드래그해서 돌려보면 산맥처럼 입체적인 곡면입니다'); }
  },

  // 13.2 편도함수 — 한 방향만 미분
  { id:'calc13_02',
    enter:function(E){ this.s={x:0.6,y:0.4}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="qx" min="-3" max="3" step="0.1" value="0.6"><output id="qxo">0.6</output><label style="margin-left:12px">y</label><input type="range" id="qy" min="-3" max="3" step="0.1" value="0.4"><output id="qyo">0.4</output></div>');
      var self=this; E.bind('#qx','input',function(e){ self.s.x=+e.target.value; document.getElementById('qxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#qy','input',function(e){ self.s.y=+e.target.value; document.getElementById('qyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      var g=grad(F,s.x,s.y);
      // x방향(빨강)·y방향(초록) 선
      ctx.strokeStyle=RED; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(s.x-1),P.Y(s.y)); ctx.lineTo(P.X(s.x+1),P.Y(s.y)); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(P.X(s.x),P.Y(s.y-1)); ctx.lineTo(P.X(s.x),P.Y(s.y+1)); ctx.stroke();
      P.dot(s.x,s.y,'#ffffff');
      ctx.font='12px sans-serif';
      ctx.fillStyle=RED; ctx.fillText('∂f/∂x='+g[0].toFixed(2), P.X(s.x+1)+4, P.Y(s.y)+4);
      ctx.fillStyle=GRN; ctx.fillText('∂f/∂y='+g[1].toFixed(2), P.X(s.x)+6, P.Y(s.y+1)-6);
      E.big('∂f/∂x = '+g[0].toFixed(2)+'   ·   ∂f/∂y = '+g[1].toFixed(2), '한 변수만 변화시키고 나머지는 고정 — 빨강=x방향 기울기, 초록=y방향 기울기'); }
  },

  // 13.3 기울기 벡터 ∇f — 가장 가파른 오르막
  { id:'calc13_03',
    enter:function(E){ this.s={x:0.8,y:0.6}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="gx" min="-3" max="3" step="0.1" value="0.8"><output id="gxo">0.8</output><label style="margin-left:12px">y</label><input type="range" id="gy" min="-3" max="3" step="0.1" value="0.6"><output id="gyo">0.6</output></div>');
      var self=this; E.bind('#gx','input',function(e){ self.s.x=+e.target.value; document.getElementById('gxo').textContent=(+e.target.value).toFixed(1); E.blip(420,0.05); });
      E.bind('#gy','input',function(e){ self.s.y=+e.target.value; document.getElementById('gyo').textContent=(+e.target.value).toFixed(1); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      // 기울기장(작은 화살표 샘플)
      for(var gx=-2.5;gx<=2.5;gx+=1){ for(var gy=-2.5;gy<=2.5;gy+=1){ var gg=grad(F,gx,gy), L=0.35, n=Math.hypot(gg[0],gg[1])||1;
        arrow(ctx,P.X(gx),P.Y(gy),P.X(gx+gg[0]/n*L),P.Y(gy+gg[1]/n*L),'rgba(255,255,255,0.4)',1); } }
      var g=grad(F,s.x,s.y), mag=Math.hypot(g[0],g[1]);
      arrow(ctx,P.X(s.x),P.Y(s.y),P.X(s.x+g[0]*0.6),P.Y(s.y+g[1]*0.6),GLD,3);
      P.dot(s.x,s.y,'#ffffff');
      ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.fillText('∇f, |∇f|='+mag.toFixed(2), P.X(s.x+g[0]*0.6)+6, P.Y(s.y+g[1]*0.6)-4);
      E.big('∇f = (∂f/∂x, ∂f/∂y)   ·   |∇f| = '+mag.toFixed(2), '기울기 벡터는 가장 가파르게 오르는 방향 — 등고선과 수직(금색 화살표)'); }
  },

  // 13.4 극값 — ∇f=0 인 곳(봉우리·골짜기·안장)
  { id:'calc13_04',
    enter:function(E){ this.s={x:0.5,y:0.5}; E.Plot.range(-3,3,-3,3).lab('x','y');
      E.controls('<div class="ctrl"><label>x</label><input type="range" id="ex" min="-3" max="3" step="0.05" value="0.5"><output id="exo">0.5</output><label style="margin-left:12px">y</label><input type="range" id="ey" min="-3" max="3" step="0.05" value="0.5"><output id="eyo">0.5</output></div>');
      var self=this; E.bind('#ex','input',function(e){ self.s.x=+e.target.value; document.getElementById('exo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.05); });
      E.bind('#ey','input',function(e){ self.s.y=+e.target.value; document.getElementById('eyo').textContent=(+e.target.value).toFixed(2); E.blip(400,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s; heat(E,F,-1,1); P.axes();
      // 임계점 표시(sin x cos y: 봉우리 (π/2,0), 골 (π/2,π) 등)
      var crit=[[Math.PI/2,0,'봉우리'],[ -Math.PI/2,0,'골짜기'],[Math.PI/2,Math.PI,'골짜기'],[0,Math.PI/2,'안장']];
      ctx.font='13px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.7)';
      for(var c=0;c<crit.length;c++){ P.dot(crit[c][0],crit[c][1],'rgba(255,255,255,0.5)'); ctx.fillText(crit[c][2], P.X(crit[c][0])+6, P.Y(crit[c][1])-6); }
      var g=grad(F,s.x,s.y), mag=Math.hypot(g[0],g[1]), flat=mag<0.06;
      var gg=grad(F,s.x,s.y); arrow(ctx,P.X(s.x),P.Y(s.y),P.X(s.x+gg[0]*0.6),P.Y(s.y+gg[1]*0.6),flat?GRN:GLD,3);
      P.dot(s.x,s.y,'#ffffff');
      ctx.fillStyle=flat?GRN:GLD; ctx.font='12px sans-serif'; ctx.fillText('|∇f|='+mag.toFixed(2), P.X(s.x)+8, P.Y(s.y)+16);
      E.big('|∇f| = '+mag.toFixed(3)+(flat?'  ← 임계점!':''), flat?'기울기 0 — 봉우리·골짜기 또는 안장점입니다':'기울기 벡터가 0이 되는 곳을 찾으면 극값 후보'); }
  },

  // 13.5 라그랑주 승수 — 제약 위에서 최적화  f=x+y, g: x²+y²=1
  { id:'calc13_05',
    enter:function(E){ this.s={th:0.5}; E.Plot.range(-2,2,-2,2).lab('x','y');
      E.controls('<div class="ctrl"><label>원 위 위치 θ</label><input type="range" id="lt" min="0" max="6.28" step="0.03" value="0.5"><output id="lto">0.50</output></div>');
      var self=this; E.bind('#lt','input',function(e){ self.s.th=+e.target.value; document.getElementById('lto').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, th=s.th;
      P.axes();
      // f=x+y 등위선(여러 평행선)
      ctx.strokeStyle='rgba(185,156,255,0.30)'; ctx.lineWidth=1;
      for(var cval=-2;cval<=2;cval+=0.5){ ctx.beginPath(); ctx.moveTo(P.X(-2),P.Y(cval+2)); ctx.lineTo(P.X(2),P.Y(cval-2)); ctx.stroke(); }
      // 제약 원 x²+y²=1
      ctx.strokeStyle=BLU; ctx.lineWidth=2.2; ctx.beginPath();
      for(var a=0;a<=6.30;a+=0.05){ var x=Math.cos(a),y=Math.sin(a); if(a===0)ctx.moveTo(P.X(x),P.Y(y)); else ctx.lineTo(P.X(x),P.Y(y)); } ctx.closePath(); ctx.stroke();
      var px=Math.cos(th), py=Math.sin(th), fval=px+py;
      // ∇f=(1,1) (금), ∇g=(2x,2y) 방사(초록)
      arrow(ctx,P.X(px),P.Y(py),P.X(px+0.5),P.Y(py+0.5),GLD,2.5);
      arrow(ctx,P.X(px),P.Y(py),P.X(px+px*0.6),P.Y(py+py*0.6),GRN,2);
      var aligned=Math.abs(px-py)<0.05 && px>0;
      P.dot(px,py,'#ffffff');
      ctx.font='12px sans-serif';
      ctx.fillStyle=GLD; ctx.fillText('∇f', P.X(px+0.5)+4, P.Y(py+0.5));
      ctx.fillStyle=GRN; ctx.fillText('∇g', P.X(px+px*0.6)+4, P.Y(py+py*0.6)+10);
      ctx.fillStyle=BLU; ctx.fillText('제약 g: x²+y²=1', P.X(-1.9), P.Y(-1.7));
      E.big('f = x + y = '+fval.toFixed(3)+(aligned?'  ← 최댓값 √2!':''), aligned?'∇f와 ∇g가 나란 — 등위선이 제약곡선에 접할 때 최적':'두 기울기(금=∇f, 초록=∇g)가 나란해지는 곳을 찾으세요'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
