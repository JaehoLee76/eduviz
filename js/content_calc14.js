/* 미적분학 14장 — 다중적분 (Stewart Ch.15)
   14.1 이중적분=부피 · 14.2 반복적분 · 14.3 극좌표 이중적분 · 14.4 무게중심 · 14.5 삼중적분
   동작만. 텍스트=content/calc14.json. 보라 테마. 골든룰=부피·넓이·무게중심 전부 합으로 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', DIM='#9b99a3';
  function heat(E,f,lo,hi){ var ctx=E.ctx, P=E.Plot, nx=44, ny=40;
    var x0=P.X(P.xmin), y0=P.Y(P.ymax), cw=(P.X(P.xmax)-x0)/nx, ch=(P.Y(P.ymin)-y0)/ny;
    for(var i=0;i<nx;i++)for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin), wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin), t=(f(wx,wy)-lo)/(hi-lo); t=t<0?0:t>1?1:t;
      var r=Math.round(40+t*215), g=Math.round(55+t*155), b=Math.round(120+t*60); ctx.fillStyle='rgb('+r+','+g+','+b+')'; ctx.fillRect(x0+i*cw,y0+j*ch,cw+1,ch+1); } }

  var scenes = [

  // 14.1 이중적분 = 부피  z=f(x,y) 아래 부피, n×n 리만
  { id:'calc14_01',
    enter:function(E){ this.s={n:4}; E.Plot.range(-2,2,-2,2);
      E.controls('<div class="ctrl"><label>격자 n×n</label><input type="range" id="vn" min="1" max="24" step="1" value="4"><output id="vno">4</output></div>');
      var self=this; E.bind('#vn','input',function(e){ self.s.n=+e.target.value; document.getElementById('vno').textContent=e.target.value; E.blip(360+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, a=-2, b=2;
      function f(x,y){ return 2 - (x*x+y*y)/4; }   // 돔(>0)
      heat(E,f,0,2);
      // n×n 격자 + 셀 중심점
      var h=(b-a)/n, vol=0; ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.8;
      for(var i=0;i<n;i++)for(var j=0;j<n;j++){ var xm=a+(i+0.5)*h, ym=a+(j+0.5)*h; vol+=f(xm,ym)*h*h;
        ctx.strokeRect(P.X(a+i*h),P.Y(a+(j+1)*h),P.X(a+(i+1)*h)-P.X(a+i*h),P.Y(a+j*h)-P.Y(a+(j+1)*h)); }
      P.axes();
      // 참값(고운 합)
      var tv=0,m=300,hh=(b-a)/m; for(var p=0;p<m;p++)for(var q=0;q<m;q++) tv+=f(a+(p+0.5)*hh,a+(q+0.5)*hh)*hh*hh;
      E.big('∬ f dA ≈ '+vol.toFixed(3)+'   ('+n+'×'+n+'칸)', '곡면 아래 부피 = 작은 기둥(f·ΔA)을 모두 더한 것 (참값 '+tv.toFixed(3)+')'); }
  },

  // 14.2 반복적분 — 안쪽 적분(단면) → 바깥 적분(누적)
  { id:'calc14_02',
    enter:function(E){ this.s={y:-1.8}; E.Plot.range(-2,2,-2,2);
      E.controls('<div class="ctrl"><label>현재 y</label><input type="range" id="iy" min="-2" max="2" step="0.04" value="-1.8"><output id="iyo">-1.80</output></div>');
      var self=this; E.bind('#iy','input',function(e){ self.s.y=+e.target.value; document.getElementById('iyo').textContent=(+e.target.value).toFixed(2); E.blip(420,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, y=s.y, a=-2, b=2;
      function f(x,yy){ return 2 - (x*x+yy*yy)/4; }
      heat(E,f,0,2);
      // 현재 y의 단면선(안쪽 적분 대상)
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(P.X(-2),P.Y(y)); ctx.lineTo(P.X(2),P.Y(y)); ctx.stroke();
      // 누적된 영역(아래 ~ y) 표시
      ctx.fillStyle='rgba(126,224,176,0.18)'; ctx.fillRect(P.X(-2),P.Y(y),P.X(2)-P.X(-2),P.Y(-2)-P.Y(y));
      P.axes();
      // 안쪽 적분 A(y)=∫f dx, 바깥 누적 ∫_{-2}^{y} A dy
      function A(yy){ var s2=0,m=200,h=4/m; for(var i=0;i<m;i++) s2+=f(-2+(i+0.5)*h,yy)*h; return s2; }
      var Ay=A(y), acc=0,m2=200,h2=(y+2)/m2; for(var k=0;k<m2;k++) acc+=A(-2+(k+0.5)*h2)*h2;
      E.big('안쪽 A(y)='+Ay.toFixed(2)+'  ·  누적 ∫A dy='+acc.toFixed(3), '먼저 x로 적분해 단면넓이 A(y)를 얻고, 그걸 다시 y로 적분 (푸비니 정리)'); }
  },

  // 14.3 극좌표 이중적분 — dA = r dr dθ
  { id:'calc14_03',
    enter:function(E){ this.s={n:5}; E.Plot.range(-2.4,2.4,-2.4,2.4);
      E.controls('<div class="ctrl"><label>분할 n</label><input type="range" id="pn" min="2" max="14" step="1" value="5"><output id="pno">5</output></div>');
      var self=this; E.bind('#pn','input',function(e){ self.s.n=+e.target.value; document.getElementById('pno').textContent=e.target.value; E.blip(360+self.s.n*10,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, R=2;
      // 원반 = 쐐기·고리 격자(바깥일수록 셀이 큼 → r 인자)
      ctx.strokeStyle='rgba(185,156,255,0.55)'; ctx.lineWidth=1;
      for(var ri=1;ri<=n;ri++){ var rr=R*ri/n; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(rr*Math.cos(a)),yv=P.Y(rr*Math.sin(a)); if(a===0)ctx.moveTo(x,yv); else ctx.lineTo(x,yv); } ctx.closePath(); ctx.stroke(); }
      for(var ti=0;ti<2*n;ti++){ var th=ti/(2*n)*2*Math.PI; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(0)); ctx.lineTo(P.X(R*Math.cos(th)),P.Y(R*Math.sin(th))); ctx.stroke(); }
      P.axes();
      // 넓이 = Σ r ΔrΔθ (실계산) → πR²
      var area=0, dr=R/n, dth=2*Math.PI/(2*n); for(var i=0;i<n;i++)for(var j=0;j<2*n;j++){ var rmid=(i+0.5)*dr; area+=rmid*dr*dth; }
      E.big('∬ dA = ∬ r dr dθ ≈ '+area.toFixed(3), '극좌표 셀은 바깥일수록 넓습니다 — 넓이에 r이 곱해지는 이유 (원 넓이 πR²='+(Math.PI*4).toFixed(3)+')'); }
  },

  // 14.4 무게중심 — ∬ρ dA, 반원판의 중심
  { id:'calc14_04',
    enter:function(E){ this.s={R:1.6}; E.Plot.range(-2.2,2.2,-0.6,2.4);
      E.controls('<div class="ctrl"><label>반지름 R</label><input type="range" id="cr" min="0.8" max="2" step="0.05" value="1.6"><output id="cro">1.60</output></div>');
      var self=this; E.bind('#cr','input',function(e){ self.s.R=+e.target.value; document.getElementById('cro').textContent=(+e.target.value).toFixed(2); E.blip(420,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, R=s.R;
      // 반원판 채움
      ctx.fillStyle='rgba(185,156,255,0.30)'; ctx.beginPath(); ctx.moveTo(P.X(-R),P.Y(0));
      for(var a=Math.PI;a>=0;a-=0.04){ ctx.lineTo(P.X(R*Math.cos(a)),P.Y(R*Math.sin(a))); } ctx.closePath(); ctx.fill();
      ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.stroke();
      P.axes();
      // 무게중심 ȳ = (∬y dA)/(∬dA) — 반원판은 (0, 4R/3π)
      var cy=4*R/(3*Math.PI);
      P.dot(0,cy,GLD,'무게중심 (0, '+cy.toFixed(3)+')');
      E.big('ȳ = (∬ y dA)/(∬ dA) = 4R/3π = '+cy.toFixed(3), '무게중심 = 영역을 한 점으로 균형 잡는 자리 (좌표를 넓이로 가중평균)'); }
  },

  // 14.5 삼중적분 — 구의 부피, 얇은 원판 적층  V=∫π r(z)² dz
  { id:'calc14_05',
    enter:function(E){ this.s={n:6}; E.Plot.range(-2.4,2.4,-2.4,2.4);
      E.controls('<div class="ctrl"><label>층 수 n</label><input type="range" id="tn" min="2" max="30" step="1" value="6"><output id="tno">6</output></div>');
      var self=this; E.bind('#tn','input',function(e){ self.s.n=+e.target.value; document.getElementById('tno').textContent=e.target.value; E.blip(360+self.s.n*8,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, P=E.Plot, s=this.s, n=s.n, R=2;
      // 구를 z축으로 얇은 원판 적층(단면 반지름 √(R²−z²))
      var h=2*R/n, vol=0;
      for(var k=0;k<n;k++){ var z=-R+(k+0.5)*h, rr=Math.sqrt(Math.max(0,R*R-z*z)); vol+=Math.PI*rr*rr*h;  // 원판 부피 합
        var yTop=-R+(k+1)*h, yBot=-R+k*h;
        ctx.fillStyle='rgba(185,156,255,0.16)'; ctx.strokeStyle='rgba(185,156,255,0.5)'; ctx.lineWidth=0.8;
        ctx.fillRect(P.X(-rr),P.Y(yTop),P.X(rr)-P.X(-rr),P.Y(yBot)-P.Y(yTop)); ctx.strokeRect(P.X(-rr),P.Y(yTop),P.X(rr)-P.X(-rr),P.Y(yBot)-P.Y(yTop)); }
      // 구 윤곽
      ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(R*Math.cos(a)),yv=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,yv); else ctx.lineTo(x,yv); } ctx.closePath(); ctx.stroke();
      P.axes();
      E.big('V = ∭ dV ≈ '+vol.toFixed(3)+'   ('+n+'층)', '입체를 얇은 층으로 쪼개 부피를 더합니다 (구 (4/3)πR³='+(4/3*Math.PI*8).toFixed(3)+')'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
