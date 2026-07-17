/* 미적분학 — 심화학습(분기) 모음. 각 spine 장면에 branchOf로 매달림 → 엔진이 "📚 심화학습" 버튼 생성.
   동작만. 텍스트=content/calc_br.json. 보라 테마. 골든룰=표시값 전부 실계산. 반드시 content_calc*.js 뒤 로드. */
(function(){
  var VIO='#b99cff', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', RED='#f0888a', DIM='#9b99a3';
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }
  function integ(f,a,b){ var n=2000,h=(b-a)/n,s=0; for(var i=0;i<n;i++) s+=f(a+(i+0.5)*h)*h; return s; }
  function arr(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1),L=9; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-L*Math.cos(a-0.45),y2-L*Math.sin(a-0.45)); ctx.lineTo(x2-L*Math.cos(a+0.45),y2-L*Math.sin(a+0.45)); ctx.fill(); }
  function sld(E,html,id,fmt,set){ E.controls(html); E.bind('#'+id,'input',function(e){ set(+e.target.value); var o=document.getElementById(id+'o'); if(o)o.textContent=fmt(+e.target.value); E.blip(420,0.06); }); }
  function ctrl(label,id,min,max,step,val){ return '<div class="ctrl"><label>'+label+'</label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"><output id="'+id+'o">'+val+'</output></div>'; }
  // 캔버스 위 작은 이름표(축 라벨과 별개 — 곡선·요소 식별용). 골든룰: 값 인자는 호출부에서 실계산해 넘김.
  function tag(ctx,px,py,txt,col,align){ ctx.save(); ctx.font='600 12px sans-serif'; ctx.textAlign=align||'left'; ctx.textBaseline='alphabetic'; ctx.fillStyle=col; ctx.fillText(txt,px,py); ctx.restore(); }

  var scenes = [

  // ── ch1 합성함수 (branchOf calc1_05) ──
  { id:'calc1_05_comp', branchOf:'calc1_05', ord:1,
    enter:function(E){ var s=this.s={x:1}; E.Plot.range(-3,3,-2,8).lab('x','f(g(x))'); sld(E,ctrl('입력 x','cmx',-2.5,2.5,0.1,1),'cmx',function(v){return v.toFixed(1);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x; function g(t){return t+1;} function f(t){return t*t;}
      P.axes(); P.curve(function(t){return f(g(t));}, VIO);
      var gx=g(x), fgx=f(gx); P.dot(x,fgx,GRN,'f(g(x))');
      tag(ctx,P.X(2.2),P.Y(f(g(2.2)))-6,'y=f(g(x))=(x+1)²',VIO,'right');
      E.big('f(g('+x.toFixed(1)+')) = f('+gx.toFixed(1)+') = '+fgx.toFixed(2), '함수를 사슬처럼 — g가 먼저, 그 결과를 f가 받습니다'); }
  },

  // ── ch2 끼임정리 (branchOf calc2_01) ──  cos x ≤ sin x / x ≤ 1
  { id:'calc2_01_squeeze', branchOf:'calc2_01', ord:1,
    enter:function(E){ var s=this.s={x:1.5}; E.Plot.range(-4,4,-0.5,1.4).lab('x','sin x / x'); sld(E,ctrl('x →','sqx',0.05,4,0.03,1.5),'sqx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x;
      P.curve(function(t){return Math.cos(t);}, 'rgba(122,184,255,0.8)');
      ctx.strokeStyle='rgba(126,224,176,0.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(P.X(-4),P.Y(1)); ctx.lineTo(P.X(4),P.Y(1)); ctx.stroke();
      P.curve(function(t){ return Math.abs(t)<1e-6?1:Math.sin(t)/t; }, VIO);
      P.axes(); var val=Math.abs(x)<1e-6?1:Math.sin(x)/x; P.dot(x,val,GLD);
      tag(ctx,P.X(-3.9),P.Y(1)-6,'y=1 (위 울타리)',GRN);
      tag(ctx,P.X(2.1),P.Y(Math.cos(2.1))-6,'y=cos x (아래 울타리)',BLU);
      tag(ctx,P.X(x),P.Y(val)+18,'sin x/x',VIO,'center');
      E.big('sin x / x = '+val.toFixed(4)+'  (x→0 이면 → 1)', '아래 cos x와 위 1 사이에 갇혀, x→0에서 둘 다 1 — 따라서 sin x/x도 1'); }
  },

  // ── ch3 미분가능성·첨점 (branchOf calc3_02) ──  f=|x|
  { id:'calc3_02_corner', branchOf:'calc3_02', ord:1,
    enter:function(E){ var s=this.s={x:1}; E.Plot.range(-3,3,-1,3).lab('x','|x|'); sld(E,ctrl('점 x','cnx',-2.5,2.5,0.05,1),'cnx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x; function f(t){return Math.abs(t);}
      P.axes(); P.curve(f, VIO);
      tag(ctx,P.X(2.4),P.Y(2.4)-6,'y=|x|',VIO,'right');
      var near0=Math.abs(x)<0.08, m=x>0?1:x<0?-1:0;
      if(!near0){ ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(x-1),P.Y(f(x)-m)); ctx.lineTo(P.X(x+1),P.Y(f(x)+m)); ctx.stroke();
        tag(ctx,P.X(x+1),P.Y(f(x)+m)-6,"접선 기울기 f '="+m,GLD); }
      else { tag(ctx,P.X(0)+10,P.Y(0)+20,'첨점 (미분 불가)',RED); }
      P.dot(x,f(x),near0?RED:GRN);
      E.big(near0?"x=0: 좌도함수 −1 ≠ 우도함수 +1 → 미분 불가!":"f '("+x.toFixed(2)+") = "+m,
        near0?'뾰족한 첨점에선 접선이 하나로 정해지지 않습니다 — 연속이어도 미분 불가':'매끈한 곳에선 기울기 ±1로 일정'); }
  },

  // ── ch4 로그미분법 (branchOf calc4_03) ──  y=x^x
  { id:'calc4_03_logdiff', branchOf:'calc4_03', ord:1,
    enter:function(E){ var s=this.s={x:1.2}; E.Plot.range(0,2.6,-1,5).lab('x','xˣ'); sld(E,ctrl('x','lgx',0.2,2.5,0.05,1.2),'lgx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x; function f(t){return Math.pow(t,t);}
      P.axes(); P.curve(f, VIO);
      tag(ctx,P.X(2.45),P.Y(f(2.45))-6,'y=xˣ',VIO,'right');
      var y=f(x), form=y*(Math.log(x)+1), num=ndf(f,x);
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(P.X(x-0.6),P.Y(y+form*(-0.6))); ctx.lineTo(P.X(x+0.6),P.Y(y+form*0.6)); ctx.stroke();
      tag(ctx,P.X(x+0.6),P.Y(y+form*0.6)-6,"y′="+form.toFixed(2),GLD);
      P.dot(x,y,GRN,'(x, xˣ)');
      E.big("(xˣ)′ = xˣ(ln x + 1) = "+form.toFixed(3), '지수·밑에 동시에 x가 있어 평범한 법칙이 안 통함 → 양변에 ln을 씌워 미분 ('+num.toFixed(3)+')'); }
  },

  // ── ch5 로피탈 정리 (branchOf calc5_01) ──  (eˣ−1)/x → 1
  { id:'calc5_01_lhopital', branchOf:'calc5_01', ord:1,
    enter:function(E){ var s=this.s={x:1.5}; E.Plot.range(-2,2.5,-1,4).lab('x','y'); sld(E,ctrl('x →','lhx',0.04,2.2,0.02,1.5),'lhx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x; function f(t){return Math.exp(t)-1;} function g(t){return t;}
      P.axes(); P.curve(f, VIO); P.curve(g, BLU);
      var ratio=Math.abs(x)<1e-6?1:f(x)/g(x), dratio=Math.exp(x)/1;
      P.dot(x,f(x),VIO); P.dot(x,g(x),BLU);
      tag(ctx,P.X(x)+8,P.Y(f(x))-6,'분자 f=eˣ−1',VIO);
      tag(ctx,P.X(x)+8,P.Y(g(x))+16,'분모 g=x',BLU);
      E.big('(eˣ−1)/x = '+ratio.toFixed(4)+'   →   f′/g′ = eˣ/1', 'x→0에서 0/0 꼴 — 분자·분모를 각각 미분한 비로 극한을 구합니다 (→ 1)'); }
  },

  // ── ch6 우함수·기함수 적분 대칭 (branchOf calc6_01) ──
  { id:'calc6_01_symmetry', branchOf:'calc6_01', ord:1,
    enter:function(E){ var s=this.s={odd:0}; E.Plot.range(-2.4,2.4,-3,3).lab('x','f(x)'); sld(E,ctrl('우(0)·기(1)','sym',0,1,1,0),'sym',function(v){return v?'기함수':'우함수';},function(v){s.odd=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,a=2; var f=s.odd?function(t){return 0.6*t*t*t;}:function(t){return t*t-0.5;};
      var n=200,h=2*a/n; for(var k=0;k<n;k++){ var xm=-a+(k+0.5)*h, fm=f(xm); ctx.fillStyle=fm>=0?'rgba(126,224,176,0.28)':'rgba(240,136,138,0.28)'; ctx.fillRect(P.X(-a+k*h),P.Y(Math.max(0,fm)),P.X(-a+(k+1)*h)-P.X(-a+k*h),Math.abs(P.Y(fm)-P.Y(0))); }
      P.axes(); P.curve(f, VIO);
      tag(ctx,P.X(2.3),P.Y(f(2.3))-6,s.odd?'f(x)=0.6x³ (기함수)':'f(x)=x²−0.5 (우함수)',VIO,'right');
      if(s.odd){ tag(ctx,P.X(-1.3),P.Y(-1.6),'−넓이',RED,'center'); tag(ctx,P.X(1.3),P.Y(1.6),'+넓이',GRN,'center'); }
      else { tag(ctx,P.X(-1.4),P.Y(1.6),'좌',GRN,'center'); tag(ctx,P.X(1.4),P.Y(1.6),'= 우',GRN,'center'); }
      var val=integ(f,-a,a);
      E.big('∫₋₂² '+(s.odd?'(기함수)':'(우함수)')+' dx = '+val.toFixed(3), s.odd?'기함수: 좌우 부호가 반대라 정확히 상쇄 → 0':'우함수: 좌우 대칭 → 절반의 2배 (대칭으로 계산 단축)'); }
  },

  // ── ch7 회전체 껍질법 (branchOf calc7_02) ──  y축 회전 V=∫2πx f dx
  { id:'calc7_02_shells', branchOf:'calc7_02', ord:1,
    enter:function(E){ var s=this.s={n:6}; E.Plot.range(-0.3,3.3,-0.3,2.4).lab('x','f(x)'); sld(E,ctrl('껍질 수 n','shn',2,40,1,6),'shn',function(v){return ''+v;},function(v){s.n=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,n=s.n,a=0,b=3; function f(t){return 2-t*t/4.5;}
      var h=(b-a)/n, vol=0, hk=Math.min(n-1,Math.floor(n*0.55)); for(var k=0;k<n;k++){ var xm=a+(k+0.5)*h, fm=f(xm); vol+=2*Math.PI*xm*fm*h;
        var hi=(k===hk); ctx.fillStyle=hi?'rgba(126,224,176,0.32)':'rgba(185,156,255,0.18)'; ctx.strokeStyle=hi?GRN:'rgba(185,156,255,0.5)'; ctx.lineWidth=hi?1.4:0.8;
        ctx.fillRect(P.X(a+k*h),P.Y(fm),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(0)-P.Y(fm)); ctx.strokeRect(P.X(a+k*h),P.Y(fm),P.X(a+(k+1)*h)-P.X(a+k*h),P.Y(0)-P.Y(fm)); }
      P.axes(); P.curve(f, GLD);
      var xh=a+(hk+0.5)*h, fh=f(xh);
      tag(ctx,P.X(2.9),P.Y(f(2.9))-6,'y=f(x)',GLD,'right');
      tag(ctx,P.X(xh),P.Y(fh)-10,'껍질 2π·'+xh.toFixed(2)+'·'+fh.toFixed(2)+'·Δx',GRN,'center');
      E.big('V = ∫2πx·f(x) dx ≈ '+vol.toFixed(3), 'y축 회전체를 ‘원통 껍질’로 쪼갬 — 껍질 하나 = 둘레(2πx)×높이(f)×두께'); }
  },

  // ── ch8 가우스 적분 (branchOf calc8_04) ──  ∫e^(−x²) → √π
  { id:'calc8_04_gauss', branchOf:'calc8_04', ord:1,
    enter:function(E){ var s=this.s={b:1}; E.Plot.range(-3.2,3.2,-0.2,1.2).lab('x','e^(−x²)'); sld(E,ctrl('범위 ±b','gsb',0.3,3,0.05,1),'gsb',function(v){return v.toFixed(2);},function(v){s.b=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,b=s.b; function f(t){return Math.exp(-t*t);}
      var n=200,h=2*b/n; for(var k=0;k<n;k++){ var xm=-b+(k+0.5)*h; ctx.fillStyle='rgba(185,156,255,0.22)'; ctx.fillRect(P.X(-b+k*h),P.Y(f(xm)),P.X(-b+(k+1)*h)-P.X(-b+k*h),P.Y(0)-P.Y(f(xm))); }
      P.axes(); P.curve(f, VIO);
      tag(ctx,P.X(2.0),P.Y(f(2.0))+18,'y=e^(−x²)',VIO,'center');
      tag(ctx,P.X(0),P.Y(0.34),'넓이 '+integ(f,-b,b).toFixed(3),VIO,'center');
      var val=integ(f,-b,b);
      E.big('∫₋ᵇ^ᵇ e^(−x²) dx = '+val.toFixed(4)+'   (→ √π ≈ 1.7725)', '부정적분이 없는데도 전 구간 넓이는 정확히 √π — 극좌표 트릭(14장 심화)으로 증명'); }
  },

  // ── ch9 감쇠진동 (branchOf calc9_05) ──  mx''+cx'+kx=0
  { id:'calc9_05_damped', branchOf:'calc9_05', ord:1,
    enter:function(E){ var s=this.s={c:0.4}; E.Plot.range(0,12,-2,2).lab('t','x'); sld(E,ctrl('감쇠 c','dmc',0,3,0.05,0.4),'dmc',function(v){return v.toFixed(2);},function(v){s.c=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,c=s.c,k=4,m=1;
      P.axes();
      var t=0,x=1.6,v=0,h=0.004; ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(P.X(0),P.Y(x));
      while(t<12){ var aacc=(-k*x-c*v)/m; v+=aacc*h; x+=v*h; t+=h; ctx.lineTo(P.X(t),P.Y(x)); } ctx.stroke();
      var crit=2*Math.sqrt(k*m), kind=c<crit-0.05?'미흡감쇠(진동하며 잦아듦)':c>crit+0.05?'과감쇠(천천히)':'임계감쇠(가장 빨리 안정)';
      tag(ctx,P.X(0.2),P.Y(1.6)-8,'x(t)',VIO);
      tag(ctx,P.X(11.5),P.Y(0)-6,'평형 x=0',DIM,'right');
      tag(ctx,P.X(6),P.Y(-1.7),'임계 cᵪ=2√km='+crit.toFixed(2)+' · 현재 c='+c.toFixed(2),GLD,'center');
      E.big('mx″ + cx′ + kx = 0  ·  '+kind, '용수철+마찰: 감쇠 c가 작으면 출렁이며, 임계값(2√km)에서 가장 빨리 멈춥니다'); }
  },

  // ── ch10 원뿔곡선(이심률) (branchOf calc10_03) ──  r = ed/(1+e cosθ)
  { id:'calc10_03_conic', branchOf:'calc10_03', ord:1,
    enter:function(E){ var s=this.s={e:0.5}; E.Plot.range(-5,3,-3,3).lab('x','y'); sld(E,ctrl('이심률 e','cce',0,1.8,0.05,0.5),'cce',function(v){return v.toFixed(2);},function(v){s.e=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,e=s.e,L=1.6;   // L=반직현(고정) → e=0이면 반지름 L의 원
      ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath(); var started=false;
      for(var th=-Math.PI;th<=Math.PI;th+=0.01){ var den=1+e*Math.cos(th); if(den<0.05){started=false;continue;} var r=L/den; if(r<0||r>12){started=false;continue;}
        var x=P.X(r*Math.cos(th)),y=P.Y(r*Math.sin(th)); if(!started){ctx.moveTo(x,y);started=true;} else ctx.lineTo(x,y); } ctx.stroke();
      P.axes(); P.dot(0,0,GLD,'초점');
      var kind=e<0.02?'원':e<0.98?'타원':e<1.02?'포물선':'쌍곡선';
      tag(ctx,P.X(-4.8),P.Y(2.6),'r = l/(1+e cosθ),  '+kind+' (e='+e.toFixed(2)+')',VIO);
      E.big('e = '+e.toFixed(2)+'  →  '+kind, '이심률 하나로 모든 원뿔곡선이 이어집니다 — e<1 타원·e=1 포물선·e>1 쌍곡선 (행성·혜성 궤도)'); }
  },

  // ── ch11 비판정법·수렴반경 (branchOf calc11_03) ──  Σ xⁿ/n
  { id:'calc11_03_ratio', branchOf:'calc11_03', ord:1,
    enter:function(E){ var s=this.s={x:0.7}; E.Plot.range(0,40,-3,3).lab('n','부분합'); sld(E,ctrl('x','rtx',-1.4,1.4,0.05,0.7),'rtx',function(v){return v.toFixed(2);},function(v){s.x=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,x=s.x;
      P.axes();
      var sum=0,lastY=0; ctx.strokeStyle=VIO; ctx.lineWidth=2.2; ctx.beginPath();
      for(var n=1;n<=40;n++){ sum+=Math.pow(x,n)/n; var y=Math.max(-3,Math.min(3,sum)); lastY=y; if(n===1)ctx.moveTo(P.X(n),P.Y(y)); else ctx.lineTo(P.X(n),P.Y(y)); } ctx.stroke();
      var L=Math.abs(x), conv=L<1;
      tag(ctx,P.X(40),P.Y(lastY)+(lastY>0?-8:16),'Sₙ='+sum.toFixed(2),VIO,'right');
      tag(ctx,P.X(2),P.Y(2.7),'Σ xⁿ/n  부분합 Sₙ  ('+(conv?'수렴':'발산')+')',VIO);
      E.big('비 |aₙ₊₁/aₙ| → |x| = '+L.toFixed(2)+'  ('+(conv?'<1 수렴':'≥1 발산')+')', '연속한 항의 비의 극한 L: L<1이면 수렴 — 수렴반경 1 (|x|<1)'); }
  },

  // ── ch11 오일러 공식 (branchOf calc11_04) ──  e^{iθ} = cosθ + i sinθ
  { id:'calc11_04_euler', branchOf:'calc11_04', ord:1,
    enter:function(E){ var s=this.s={th:1.0}; E.Plot.range(-1.6,1.6,-1.5,1.5).lab('Re','Im'); sld(E,ctrl('각 θ','eut',0,6.28,0.02,1.0),'eut',function(v){return v.toFixed(2);},function(v){s.th=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,th=s.th; var O=[P.X(0),P.Y(0)];
      ctx.strokeStyle='rgba(185,156,255,0.5)'; ctx.lineWidth=1.6; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(Math.cos(a)),y=P.Y(Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      P.axes(); var c=Math.cos(th),sn=Math.sin(th);
      // 사영(cos=Re, sin=Im)
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(P.X(c),P.Y(sn)); ctx.lineTo(P.X(c),P.Y(0)); ctx.moveTo(P.X(c),P.Y(sn)); ctx.lineTo(P.X(0),P.Y(sn)); ctx.stroke(); ctx.setLineDash([]);
      arr(ctx,O[0],O[1],P.X(c),P.Y(sn),GLD,2.5); P.dot(c,sn,GRN);
      tag(ctx,P.X(c)+(c>=0?8:-8),P.Y(sn)+(sn>=0?-8:16),'e^{iθ}',GLD,c>=0?'left':'right');
      tag(ctx,P.X(c),P.Y(0)+(sn>=0?30:-20),'Re=cos θ='+c.toFixed(2),GRN,'center');  // x축 눈금 행(y0+14)과 안 겹치게 더 멀리
      tag(ctx,P.X(0)+(c>=0?-8:8),P.Y(sn),'Im=sin θ='+sn.toFixed(2),GRN,c>=0?'right':'left');
      var atPi=Math.abs(th-Math.PI)<0.06;
      E.big(atPi?'e^{iπ} = −1   →   e^{iπ} + 1 = 0':'e^{iθ} = cos θ + i sin θ = ('+c.toFixed(2)+', '+sn.toFixed(2)+')',
        atPi?'세상에서 가장 아름다운 식 — 오일러 항등식(e·i·π·1·0 한 줄에)':'허수 지수는 단위원 위의 회전 — 실부=cos, 허부=sin'); }
  },

  // ── ch12 스칼라 삼중적=평행육면체 부피 (branchOf calc12_04) ──
  { id:'calc12_04_triple', branchOf:'calc12_04', ord:1,
    enter:function(E){ var s=this.s={az:0.7}; E.setOn([]); sld(E,ctrl('시점 회전','trz',0,6.28,0.04,0.7),'trz',function(v){return v.toFixed(2);},function(v){s.az=v;}); },
    draw:function(E){ var ctx=E.ctx,W=E.W,H=E.H,s=this.s,az=s.az,cx=W*0.46,cy=H*0.56,sc=Math.min(W,H)*0.12;
      function P3(x,y,z){ var c=Math.cos(az),si=Math.sin(az),rx=x*c-y*si,ry=x*si+y*c; return [cx+rx*sc,cy-z*sc+ry*sc*0.42]; }
      var u=[2,0.3,0.2],v=[0.4,2,0.3],w=[0.3,0.5,2];
      function L(a,b,col,wd){ var A=P3(a[0],a[1],a[2]),B=P3(b[0],b[1],b[2]); ctx.strokeStyle=col;ctx.lineWidth=wd||1.5; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke(); }
      var O=[0,0,0]; function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
      // 평행육면체 12모서리(간단히 주요 모서리)
      L(O,u,'rgba(240,136,138,0.8)',2); L(O,v,'rgba(126,224,176,0.8)',2); L(O,w,'rgba(122,184,255,0.8)',2);
      var Pu=P3(u[0],u[1],u[2]),Pv=P3(v[0],v[1],v[2]),Pw=P3(w[0],w[1],w[2]);
      tag(ctx,Pu[0]+4,Pu[1]-4,'u',RED); tag(ctx,Pv[0]+4,Pv[1]-4,'v',GRN); tag(ctx,Pw[0]+4,Pw[1]-4,'w',BLU);
      L(u,add(u,v),DIM); L(v,add(u,v),DIM); L(u,add(u,w),DIM); L(w,add(u,w),DIM); L(v,add(v,w),DIM); L(w,add(v,w),DIM);
      L(add(u,v),add(add(u,v),w),DIM); L(add(u,w),add(add(u,v),w),DIM); L(add(v,w),add(add(u,v),w),DIM);
      var det=u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]);
      E.big('부피 = |u · (v × w)| = '+Math.abs(det).toFixed(3), '스칼라 삼중적 = 세 벡터가 만드는 평행육면체 부피 (행렬식). 0이면 한 평면에 깔림'); }
  },

  // ── ch13 방향도함수 (branchOf calc13_03) ──  D_u f = ∇f·u
  { id:'calc13_03_dir', branchOf:'calc13_03', ord:1,
    enter:function(E){ var s=this.s={th:0.5}; E.Plot.range(-3,3,-3,3).lab('x','y'); sld(E,ctrl('방향 θ','ddt',0,6.28,0.03,0.5),'ddt',function(v){return v.toFixed(2);},function(v){s.th=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,th=s.th; function F(x,y){return Math.sin(x)*Math.cos(y);}
      // 등고선 히트맵
      var nx=44,ny=40,x0=P.X(P.xmin),y0=P.Y(P.ymax),cw=(P.X(P.xmax)-x0)/nx,ch=(P.Y(P.ymin)-y0)/ny;
      for(var i=0;i<nx;i++)for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin),wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin),t=(F(wx,wy)+1)/2; var r=40+t*215,g=55+t*155,b=120+t*60; ctx.fillStyle='rgb('+(r|0)+','+(g|0)+','+(b|0)+')'; ctx.fillRect(x0+i*cw,y0+j*ch,cw+1,ch+1); }
      P.axes(); var px=0.8,py=0.6, gx=(F(px+1e-3,py)-F(px-1e-3,py))/2e-3, gy=(F(px,py+1e-3)-F(px,py-1e-3))/2e-3;
      var ux=Math.cos(th),uy=Math.sin(th), Du=gx*ux+gy*uy, gmag=Math.hypot(gx,gy);
      arr(ctx,P.X(px),P.Y(py),P.X(px+gx*0.5),P.Y(py+gy*0.5),GLD,3);   // ∇f
      arr(ctx,P.X(px),P.Y(py),P.X(px+ux*0.7),P.Y(py+uy*0.7),'#ffffff',2);  // u
      tag(ctx,P.X(px+gx*0.5)+6,P.Y(py+gy*0.5),'∇f (최대증가)',GLD);
      tag(ctx,P.X(px+ux*0.7)+6,P.Y(py+uy*0.7),'방향 u','#ffffff');
      E.big('Dᵤf = ∇f · u = '+Du.toFixed(2)+'   (최대 |∇f| = '+gmag.toFixed(2)+')', '방향 u로의 변화율 = 기울기를 u에 사영. u가 ∇f(금색)와 나란할 때 최대'); }
  },

  // ── ch14 2D 가우스적분 = π (branchOf calc14_03) ──  ∬e^{−r²} = π
  { id:'calc14_03_gauss2d', branchOf:'calc14_03', ord:1,
    enter:function(E){ var s=this.s={R:1}; E.Plot.range(-3,3,-3,3).lab('x','y'); sld(E,ctrl('반지름 R','g2r',0.2,3,0.05,1),'g2r',function(v){return v.toFixed(2);},function(v){s.R=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,R=s.R; function f(x,y){return Math.exp(-(x*x+y*y));}
      var nx=44,ny=40,x0=P.X(P.xmin),y0=P.Y(P.ymax),cw=(P.X(P.xmax)-x0)/nx,ch=(P.Y(P.ymin)-y0)/ny;
      for(var i=0;i<nx;i++)for(var j=0;j<ny;j++){ var wx=P.xmin+(i+0.5)/nx*(P.xmax-P.xmin),wy=P.ymax-(j+0.5)/ny*(P.ymax-P.ymin),t=f(wx,wy); var r=40+t*215,g=55+t*155,b=120+t*60; ctx.fillStyle='rgb('+(r|0)+','+(g|0)+','+(b|0)+')'; ctx.fillRect(x0+i*cw,y0+j*ch,cw+1,ch+1); }
      ctx.strokeStyle=GLD; ctx.lineWidth=2; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(R*Math.cos(a)),y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      P.axes(); var vol=Math.PI*(1-Math.exp(-R*R));   // ∬_{r<R} e^{-r²} r dr dθ = π(1−e^{−R²})
      tag(ctx,P.X(R*0.71),P.Y(R*0.71)+4,'r=R='+R.toFixed(2),GLD);
      E.big('∬ e^(−r²) dA = π(1−e^(−R²)) = '+vol.toFixed(4)+'  (→ π)', '극좌표로 풀면 전 평면 부피 = π. 그래서 (∫e^(−x²)dx)² = π → ∫ = √π (8장 연결)'); }
  },

  // ── ch15 발산 정리(2D 선속형) (branchOf calc15_05) ──  ∮F·n ds = ∬div F dA
  { id:'calc15_05_divthm', branchOf:'calc15_05', ord:1,
    enter:function(E){ var s=this.s={R:1.6}; E.Plot.range(-3,3,-3,3).lab('x','y'); sld(E,ctrl('영역 반지름 R','dvr',0.6,2.6,0.05,1.6),'dvr',function(v){return v.toFixed(2);},function(v){s.R=v;}); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx,P=E.Plot,s=this.s,R=s.R; function Pf(x,y){return x;} function Qf(x,y){return y;}  // F=(x,y), div=2
      for(var gx=-2.5;gx<=2.5;gx+=0.7)for(var gy=-2.5;gy<=2.5;gy+=0.7){ var u=Pf(gx,gy),v=Qf(gx,gy),nn=Math.hypot(u,v)||1,Ln=Math.min(0.3,nn*0.12)/nn; arr(ctx,P.X(gx),P.Y(gy),P.X(gx+u*Ln),P.Y(gy+v*Ln),'rgba(185,156,255,0.55)',1.1); }
      ctx.fillStyle='rgba(185,156,255,0.14)'; ctx.beginPath(); for(var a=0;a<=6.30;a+=0.05){ var x=P.X(R*Math.cos(a)),y=P.Y(R*Math.sin(a)); if(a===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.fill();
      ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); for(var a2=0;a2<=6.30;a2+=0.04){ var x=P.X(R*Math.cos(a2)),y=P.Y(R*Math.sin(a2)); if(a2===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();
      P.axes();
      tag(ctx,P.X(2.55),P.Y(2.55),'F=(x,y), div F=2',VIO,'right');
      tag(ctx,P.X(R*0.71),P.Y(R*0.71)+4,'경계 ∂D (r=R)',GLD);
      var flux=0,m=400,h=2*Math.PI/m; for(var k=0;k<m;k++){ var th=k*h,x=R*Math.cos(th),y=R*Math.sin(th); flux+=(Pf(x,y)*Math.cos(th)+Qf(x,y)*Math.sin(th))*R*h; }
      var dbl=2*Math.PI*R*R;
      E.big('∮F·n ds = '+flux.toFixed(2)+'  =  ∬div F dA = '+dbl.toFixed(2), '경계를 빠져나가는 알짜 선속 = 내부 발산(샘)의 총합 — 발산 정리(가우스). 전자기·유체의 핵심'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
