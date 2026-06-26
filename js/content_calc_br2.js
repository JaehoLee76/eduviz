/* 미적분학 — 심화학습(분기) 2차. 각 장의 두 번째 핵심 심화. content_calc*.js 뒤 로드.
   텍스트=content/calc_br2.json. 보라 테마. 골든룰=표시값 전부 실계산. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }
  function integ(f,a,b){ var n=2000,h=(b-a)/n,s=0; for(var i=0;i<n;i++) s+=f(a+(i+0.5)*h)*h; return s; }
  function arr(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1),L=9; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-L*Math.cos(a-0.45),y2-L*Math.sin(a-0.45)); ctx.lineTo(x2-L*Math.cos(a+0.45),y2-L*Math.sin(a+0.45)); ctx.fill(); }
  function sld(E,html,id,fmt,set){ E.controls(html); E.bind('#'+id,'input',function(e){ set(+e.target.value); var o=document.getElementById(id+'o'); if(o)o.textContent=fmt(+e.target.value); E.blip(420,0.06); }); }
  function ctrl(label,id,min,max,step,val){ return '<div class="ctrl"><label>'+label+'</label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"><output id="'+id+'o">'+val+'</output></div>'; }
  function heat(E,f,lo,hi){ var ctx=E.ctx,P=E.Plot,nx=44,ny=40,x0=P.X(P.xmin),y0=P.Y(P.ymax),cw=(P.X(P.xmax)-x0)/nx,ch=(P.Y(P.ymin)-y0)/ny;
    for(var i=0;i<nx;i++)for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin),wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin),t=(f(wx,wy)-lo)/(hi-lo); t=t<0?0:t>1?1:t; ctx.fillStyle='rgb('+((40+t*215)|0)+','+((55+t*155)|0)+','+((120+t*60)|0)+')'; ctx.fillRect(x0+i*cw,y0+j*ch,cw+1,ch+1); } }

  var scenes = [

  // ── ch1 연속복리와 e (branchOf calc1_04) ──
  { id:'calc1_04_compound', branchOf:'calc1_04', ord:1,
    enter:function(E){ var s=this.s={n:1}; E.Plot.range(0,50,0.8,3); sld(E,ctrl('나누는 횟수 n','cpn',1,48,1,1),'cpn',function(v){return ''+v;},function(v){s.n=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,N=s.n;
      ctx.strokeStyle='rgba(126,224,176,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(Math.E)); ctx.lineTo(P.X(50),P.Y(Math.E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('e ≈ 2.718', P.X(40),P.Y(Math.E)-6);
      var A=1; for(var k=1;k<=48;k++){ var a=Math.pow(1+1/k,k); ctx.fillStyle=k<=N?VIO:'rgba(185,156,255,0.25)'; ctx.beginPath(); ctx.arc(P.X(k),P.Y(a),k===N?5:3,0,7); ctx.fill(); if(k===N)A=a; }
      P.axes();
      E.big('원금 1을 '+N+'번 나눠 복리 → '+A.toFixed(4), '연 100% 이자를 잘게 나눠 받을수록 (1+1/n)ⁿ → e. ‘연속복리’의 극한이 e입니다'); }
  },

  // ── ch2 중간값정리 (branchOf calc2_02) ──
  { id:'calc2_02_ivt', branchOf:'calc2_02', ord:1,
    enter:function(E){ var s=this.s={y0:0.3}; E.Plot.range(-2,2,-3,3); sld(E,ctrl('목표값 y','ivy',-2.5,2.5,0.05,0.3),'ivy',function(v){return v.toFixed(2);},function(v){s.y0=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,y0=s.y0; function f(x){return x*x*x-2*x+0.3;}
      P.axes(); P.curve(f, VIO);
      ctx.strokeStyle=GLD; ctx.lineWidth=1.8; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(P.X(-2),P.Y(y0)); ctx.lineTo(P.X(2),P.Y(y0)); ctx.stroke(); ctx.setLineDash([]);
      // f(x)=y0 인 c 찾기(부호변화 스캔)
      var prev=f(-2)-y0, cfound=null; for(var x=-2;x<=2;x+=0.005){ var cur=f(x)-y0; if(prev*cur<=0){ cfound=x; P.dot(x,y0,GRN); } prev=cur; }
      E.big(cfound!=null?'f(c) = '+y0.toFixed(2)+' 인 c 가 존재 (c≈'+cfound.toFixed(2)+')':'이 구간 범위 밖',
        '연속함수는 두 끝값 사이의 모든 값을 적어도 한 번 지납니다 — 중간값정리(근의 존재 보장)'); }
  },

  // ── ch3 일반 지수의 도함수 (branchOf calc3_05) ──  (aˣ)′ = aˣ ln a
  { id:'calc3_05_genexp', branchOf:'calc3_05', ord:1,
    enter:function(E){ var s=this.s={a:2}; E.Plot.range(-2,2.2,-0.5,6); sld(E,ctrl('밑 a','gea',1.2,4,0.1,2),'gea',function(v){return v.toFixed(1);},function(v){s.a=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,a=s.a; function f(t){return Math.pow(a,t);}
      P.axes(); P.curve(f, VIO); var x0=0.6, y=f(x0), m=y*Math.log(a), num=ndf(f,x0);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(x0-1.2),P.Y(y+m*(-1.2))); ctx.lineTo(P.X(x0+1.2),P.Y(y+m*1.2)); ctx.stroke(); P.dot(x0,y,GRN);
      E.big('(aˣ)′ = aˣ·ln a   ·   기울기 = '+m.toFixed(3), 'eˣ만 (eˣ)′=eˣ로 깔끔한 건 ln e=1이기 때문 — 다른 밑은 ln a 배가 붙습니다 (실측 '+num.toFixed(3)+')'); }
  },

  // ── ch4 역함수의 미분 (branchOf calc4_02) ──  (f⁻¹)′ = 1/f′
  { id:'calc4_02_invderiv', branchOf:'calc4_02', ord:1,
    enter:function(E){ var s=this.s={a:0.6}; E.Plot.range(-2,5,-2,5); sld(E,ctrl('점 a','ida',-1.5,1.5,0.05,0.6),'ida',function(v){return v.toFixed(2);},function(v){s.a=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,a=s.a;
      ctx.strokeStyle='rgba(155,153,163,0.45)'; ctx.lineWidth=1.2; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(P.X(-2),P.Y(-2)); ctx.lineTo(P.X(5),P.Y(5)); ctx.stroke(); ctx.setLineDash([]);
      P.curve(function(x){return Math.exp(x);}, VIO);
      P.curve(function(x){return x>0?Math.log(x):NaN;}, GLD);
      var ea=Math.exp(a), fp=ea, gp=1/ea;
      P.dot(a,ea,VIO); P.dot(ea,a,GLD);
      E.big("f′("+a.toFixed(2)+") = "+fp.toFixed(2)+"   ·   (f⁻¹)′("+ea.toFixed(2)+") = "+gp.toFixed(3),
        '거울상(y=x 대칭)이라 대응점의 기울기는 서로 역수 — (f⁻¹)′(b) = 1/f′(a)'); }
  },

  // ── ch5 오목·볼록과 변곡점 (branchOf calc5_01, ord:2) ──
  { id:'calc5_01_concave', branchOf:'calc5_01', ord:2,
    enter:function(E){ var s=this.s={x:-1}; E.Plot.range(-2.5,2.5,-4,4); sld(E,ctrl('점 x','cvx',-2.2,2.2,0.05,-1),'cvx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x; function f(t){return t*t*t-3*t;}
      P.axes(); P.curve(f, VIO);
      P.dot(0,0,'rgba(255,210,122,0.5)');  // 변곡점 x=0
      var f2=(f(x+1e-3)-2*f(x)+f(x-1e-3))/1e-6, infl=Math.abs(f2)<0.3;
      P.dot(x,f(x),infl?GLD:GRN);
      E.big('f″('+x.toFixed(2)+') = '+f2.toFixed(2)+(infl?'  ← 변곡점!':''),
        infl?'2계도함수 부호가 바뀌는 곳 = 변곡점(오목↔볼록 전환)':f2>0?'f″>0: 아래로 볼록(컵 ∪)':'f″<0: 위로 오목(돔 ∩)'); }
  },

  // ── ch6 적분의 평균값 정리 (branchOf calc6_03) ──
  { id:'calc6_03_mvt', branchOf:'calc6_03', ord:1,
    enter:function(E){ var s=this.s={c:1}; E.Plot.range(-0.3,4.3,-0.4,2.4); sld(E,ctrl('점 c','imc',0.1,4,0.04,1),'imc',function(v){return v.toFixed(2);},function(v){s.c=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,c=s.c,b=4; function f(t){return 1+Math.sin(t);}
      var m=integ(f,0,b)/b;
      var n=160,h=b/n; for(var k=0;k<n;k++){ var xm=h*(k+0.5); ctx.fillStyle='rgba(185,156,255,0.16)'; ctx.fillRect(P.X(k*h),P.Y(f(xm)),P.X((k+1)*h)-P.X(k*h),P.Y(0)-P.Y(f(xm))); }
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(m)); ctx.lineTo(P.X(b),P.Y(m)); ctx.stroke(); ctx.setLineDash([]);
      P.axes(); P.curve(f, VIO);
      var match=Math.abs(f(c)-m)<0.03; P.dot(c,f(c),match?GLD:VIO);
      E.big('평균 = '+m.toFixed(3)+'  ·  f(c) = '+f(c).toFixed(3)+(match?'  ← 일치!':''),
        '구간 어딘가에 ‘함숫값 = 평균값’인 점 c가 반드시 있습니다 — 적분의 평균값 정리'); }
  },

  // ── ch7 워셔법(구멍 뚫린 회전체) (branchOf calc7_02, ord:2) ──
  { id:'calc7_02_washer', branchOf:'calc7_02', ord:2,
    enter:function(E){ var s=this.s={n:6}; E.Plot.range(-0.3,2.3,-0.3,2.4); sld(E,ctrl('고리 수 n','wsn',2,30,1,6),'wsn',function(v){return ''+v;},function(v){s.n=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,n=s.n,a=0,b=2; function R(t){return 2;} function r(t){return t*t/2;}
      var h=(b-a)/n, vol=0; for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h, Ro=R(xm), ri=r(xm); vol+=Math.PI*(Ro*Ro-ri*ri)*h;
        ctx.fillStyle='rgba(185,156,255,0.18)'; ctx.fillRect(P.X(a+k*h),P.Y(Ro),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(ri)-P.Y(Ro));
        ctx.strokeStyle='rgba(185,156,255,0.45)'; ctx.lineWidth=0.7; ctx.strokeRect(P.X(a+k*h),P.Y(Ro),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(ri)-P.Y(Ro)); }
      P.axes(); P.curve(R, BLU); P.curve(r, GLD);
      E.big('V = ∫π(R² − r²) dx ≈ '+vol.toFixed(3), '두 곡선 사이를 회전 → 도넛 단면(고리). 바깥 원판에서 안쪽 구멍을 뺍니다'); }
  },

  // ── ch8 삼각치환 (branchOf calc8_01) ──  ∫√(1−x²)
  { id:'calc8_01_trigsub', branchOf:'calc8_01', ord:1,
    enter:function(E){ var s=this.s={b:0.6}; E.Plot.range(-0.2,1.15,-0.2,1.2); sld(E,ctrl('윗끝 b','tsb',0.05,1,0.02,0.6),'tsb',function(v){return v.toFixed(2);},function(v){s.b=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,b=s.b; function f(t){return Math.sqrt(Math.max(0,1-t*t));}
      var n=160,h=b/n; for(var k=0;k<n;k++){ var xm=h*(k+0.5); ctx.fillStyle='rgba(185,156,255,0.22)'; ctx.fillRect(P.X(k*h),P.Y(f(xm)),P.X((k+1)*h)-P.X(k*h),P.Y(0)-P.Y(f(xm))); }
      P.axes(); P.curve(f, VIO);
      var val=integ(f,0,b);
      E.big('∫₀ᵇ √(1−x²) dx = '+val.toFixed(4)+'  (b=1 → π/4 ≈ 0.785)', 'x=sin θ 치환 → √(1−x²)=cos θ. 뿌리(√) 적분이 삼각함수로 풀립니다 (사분원 넓이)'); }
  },

  // ── ch9 단진동(무마찰) (branchOf calc9_03) ──  mx''+kx=0
  { id:'calc9_03_shm', branchOf:'calc9_03', ord:1,
    enter:function(E){ var s=this.s={k:4}; E.Plot.range(0,12,-2,2); sld(E,ctrl('탄성 k','shk',1,9,0.2,4),'shk',function(v){return v.toFixed(1);},function(v){s.k=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,k=s.k,m=1;
      P.axes();
      var t=0,x=1.6,v=0,h=0.003; ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(x));
      while(t<12){ v+=(-k/m*x)*h; x+=v*h; t+=h; ctx.lineTo(P.X(t),P.Y(x)); } ctx.stroke();
      var w=Math.sqrt(k/m), T=2*Math.PI/w;
      E.big('ω = √(k/m) = '+w.toFixed(2)+'   ·   주기 T = '+T.toFixed(2), '마찰이 없으면 진폭 그대로 영원히 — 에너지 보존 단진동 (감쇠 c=0인 경우)'); }
  },

  // ── ch10 매개변수 호의 길이(사이클로이드) (branchOf calc10_01) ──
  { id:'calc10_01_arclen', branchOf:'calc10_01', ord:1,
    enter:function(E){ var s=this.s={t:3}; E.Plot.range(-0.5,7,-0.5,2.6); sld(E,ctrl('매개변수 t','alt',0,6.28,0.04,3),'alt',function(v){return v.toFixed(2);},function(v){s.t=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,t=s.t; function px(u){return u-Math.sin(u);} function py(u){return 1-Math.cos(u);}
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(P.X(-0.5),P.Y(0)); ctx.lineTo(P.X(7),P.Y(0)); ctx.stroke();
      ctx.strokeStyle=VIO; ctx.lineWidth=2.4; ctx.beginPath(); for(var u=0;u<=t+1e-9;u+=0.03){ var X=P.X(px(u)),Y=P.Y(py(u)); if(u===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      P.dot(px(t),py(t),GLD);
      var L=integ(function(u){return Math.sqrt((1-Math.cos(u))*(1-Math.cos(u))+Math.sin(u)*Math.sin(u));},0,t);
      E.big('호의 길이 = ∫√(x′² + y′²) dt = '+L.toFixed(3)+'  (한 아치 = 8)', '매개변수 곡선의 길이도 속도의 크기를 시간으로 적분 — 사이클로이드 한 아치는 정확히 8'); }
  },

  // ── ch11 라이프니츠 π 급수 (branchOf calc11_02) ──
  { id:'calc11_02_leibniz', branchOf:'calc11_02', ord:1,
    enter:function(E){ var s=this.s={N:5}; E.Plot.range(0,60,2.4,4); sld(E,ctrl('항 수 N','lbn',1,60,1,5),'lbn',function(v){return ''+v;},function(v){s.N=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,N=s.N;
      ctx.strokeStyle='rgba(126,224,176,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(Math.PI)); ctx.lineTo(P.X(60),P.Y(Math.PI)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('π ≈ 3.14159', P.X(46),P.Y(Math.PI)-6);
      var sum=0; ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<60;k++){ sum+=(k%2?-1:1)/(2*k+1); var y=4*sum; if(k===0)ctx.moveTo(P.X(k+1),P.Y(y)); else ctx.lineTo(P.X(k+1),P.Y(y)); if(k<N){} }
      ctx.stroke();
      var ssum=0; for(var j=0;j<N;j++) ssum+=(j%2?-1:1)/(2*j+1); var approx=4*ssum; P.dot(N,approx,GLD);
      P.axes();
      E.big('4·(1 − ⅓ + ⅕ − ⅐ + …) = '+approx.toFixed(5)+'  (→ π)', '교대급수로 π를 — 위아래로 진동하며 수렴하지만 매우 느립니다(정밀도엔 비효율)'); }
  },

  // ── ch12 벡터 정사영 (branchOf calc12_03) ──
  { id:'calc12_03_proj', branchOf:'calc12_03', ord:1,
    enter:function(E){ var s=this.s={th:0.8}; E.Plot.range(-2,5,-2,3); sld(E,ctrl('v 방향 θ','prt',0,3.14,0.03,0.8),'prt',function(v){return v.toFixed(2);},function(v){s.th=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,th=s.th; var u=[3,0], v=[3*Math.cos(th),3*Math.sin(th)]; var O=[P.X(0),P.Y(0)];
      P.axes();
      var d=(v[0]*u[0]+v[1]*u[1])/(u[0]*u[0]+u[1]*u[1]), pjx=d*u[0], pjy=d*u[1];
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(v[0]),P.Y(v[1])); ctx.lineTo(P.X(pjx),P.Y(pjy)); ctx.stroke(); ctx.setLineDash([]);
      arr(ctx,O[0],O[1],P.X(u[0]),P.Y(u[1]),BLU,2.5);
      arr(ctx,O[0],O[1],P.X(v[0]),P.Y(v[1]),GLD,2.5);
      ctx.strokeStyle=GRN; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(P.X(pjx),P.Y(pjy)); ctx.stroke();
      E.big('proj_u v = (v·u / |u|²) u   ·   길이 = '+(d*3).toFixed(2), 'v를 u 방향으로 비춘 그림자(정사영, 초록) — 힘의 분해·최소제곱법의 기초'); }
  },

  // ── ch13 접평면 (branchOf calc13_01) ──  곡면의 선형근사
  { id:'calc13_01_tangplane', branchOf:'calc13_01', ord:1,
    enter:function(E){ var s=this.s={d:0.4}; E.Plot.range(-3,3,-3,3); sld(E,ctrl('떨어진 거리 d','tpd',0,1.6,0.04,0.4),'tpd',function(v){return v.toFixed(2);},function(v){s.d=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,d=s.d; function F(x,y){return Math.sin(x)*Math.cos(y);}
      heat(E,F,-1,1); P.axes();
      var px=0.6,py=0.5, fx=(F(px+1e-3,py)-F(px-1e-3,py))/2e-3, fy=(F(px,py+1e-3)-F(px,py-1e-3))/2e-3;
      var qx=px+d*0.707, qy=py+d*0.707, approx=F(px,py)+fx*(qx-px)+fy*(qy-py), actual=F(qx,qy);
      P.dot(px,py,'#ffffff'); P.dot(qx,qy,GLD);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(px),P.Y(py)); ctx.lineTo(P.X(qx),P.Y(qy)); ctx.stroke(); ctx.setLineDash([]);
      E.big('접평면 근사 '+approx.toFixed(3)+'  vs  실제 '+actual.toFixed(3)+'  (오차 '+Math.abs(approx-actual).toFixed(3)+')',
        '곡면도 한 점 근처에선 평평한 ‘접평면’으로 근사 — z ≈ f + fₓ·Δx + f_y·Δy (다변수 선형근사)'); }
  },

  // ── ch14 야코비안(변수변환 넓이배율) (branchOf calc14_01) ──
  { id:'calc14_01_jacobian', branchOf:'calc14_01', ord:1,
    enter:function(E){ var s=this.s={ax:1.5}; E.Plot.range(-0.6,3.4,-0.6,3.4); sld(E,ctrl('가로 늘이기 a','jba',0.5,2.5,0.1,1.5),'jba',function(v){return v.toFixed(2);},function(v){s.ax=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s; var a=s.ax,c=0.4,d=1.5;  // a=가로 배율(슬라이더), c=고정 전단, e1=(a,0), e2=(c,d)
      P.axes();
      // 원래 단위정사각형(흐림)
      ctx.strokeStyle='rgba(155,153,163,0.5)'; ctx.lineWidth=1.4; ctx.strokeRect(P.X(0),P.Y(1),P.X(1)-P.X(0),P.Y(0)-P.Y(1));
      // 변환된 평행사변형
      function M(u,v){ return [a*u+c*v, d*v]; }
      var c00=M(0,0),c10=M(1,0),c11=M(1,1),c01=M(0,1);
      ctx.fillStyle='rgba(185,156,255,0.22)'; ctx.strokeStyle=VIO; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(P.X(c00[0]),P.Y(c00[1])); ctx.lineTo(P.X(c10[0]),P.Y(c10[1])); ctx.lineTo(P.X(c11[0]),P.Y(c11[1])); ctx.lineTo(P.X(c01[0]),P.Y(c01[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
      var det=a*d-0*c;
      E.big('넓이 배율 = |J| = |ad − bc| = '+Math.abs(det).toFixed(3), '좌표변환은 작은 넓이를 |야코비안| 배로 늘립니다 — ∬f dA에서 dA→|J| du dv (극좌표의 r도 이 J)'); }
  },

  // ── ch15 보존장 판정 (branchOf calc15_03) ──  curl=0 ⇔ 퍼텐셜 존재
  { id:'calc15_03_conservative', branchOf:'calc15_03', ord:1,
    enter:function(E){ var s=this.s={t:0}; E.Plot.range(-3,3,-3,3); sld(E,ctrl('장 (0보존·1회전)','cst',0,1,1,0),'cst',function(v){return v?'회전장':'보존장';},function(v){s.t=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s; var Pf,Qf;
      if(s.t){ Pf=function(x,y){return -y;}; Qf=function(x,y){return x;}; } else { Pf=function(x,y){return 2*x;}; Qf=function(x,y){return 2*y;}; }
      // 보존장이면 등위선(퍼텐셜 x²+y²)
      if(!s.t){ ctx.strokeStyle='rgba(126,224,176,0.35)'; ctx.lineWidth=1; for(var R=0.6;R<=2.8;R+=0.6){ ctx.beginPath(); for(var aa=0;aa<=6.30;aa+=0.06){ var x=P.X(R*Math.cos(aa)),y=P.Y(R*Math.sin(aa)); if(aa===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke(); } }
      for(var gx=-2.5;gx<=2.5;gx+=0.7)for(var gy=-2.5;gy<=2.5;gy+=0.7){ var u=Pf(gx,gy),v=Qf(gx,gy),nn=Math.hypot(u,v)||1,Ln=Math.min(0.3,nn*0.1)/nn; arr(ctx,P.X(gx),P.Y(gy),P.X(gx+u*Ln),P.Y(gy+v*Ln),'rgba(185,156,255,0.7)',1.1); }
      P.axes();
      var e=1e-3, curl=(Qf(0.3+e,0.3)-Qf(0.3-e,0.3))/(2*e) - (Pf(0.3,0.3+e)-Pf(0.3,0.3-e))/(2*e);
      E.big('curl F = ∂Q/∂x − ∂P/∂y = '+curl.toFixed(2)+(Math.abs(curl)<0.01?'  = 0 → 보존장!':'  ≠ 0 → 비보존'),
        Math.abs(curl)<0.01?'회전이 0이면 퍼텐셜 f가 존재(F=∇f) — 등위선(초록) 수직으로 흐름, 폐곡선 일=0':'회전이 0이 아니면 퍼텐셜이 없습니다(폐곡선 일≠0)'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
