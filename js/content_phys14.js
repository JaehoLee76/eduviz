/* 물리학 제14장 빛·현대물리 — 전자기파, 반사·굴절(스넬), 이중슬릿 간섭, 광전효과, 시간 팽창
   파동·광학·양자·상대성은 닫힌 형태가 본질(운동학 예외) — 표시 수치는 전부 해당 식에서 실시간 계산.
   골든룰: 화면의 모든 각도·세기·에너지·γ는 식으로 계산(하드코딩 금지).
   텍스트=content/phys14.json. 엔진=js/physlab.js(공유), js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 14.1 빛 = 전자기파 ══════════
  { id:'phys14_01',
    enter:function(E){ var self=this; this.s={t:0,f:5};
      E.controls('<div class="ctrl"><label>진동수 (스펙트럼 위치)</label><input type="range" id="ff" min="1" max="9" step="1" value="5"><output id="ffo">가시광</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; var names=['','전파','마이크로파','적외선','가시광(적)','가시광','가시광(자)','자외선','X선','감마선']; document.getElementById('ffo').textContent=names[self.s.f]; E.blip(200+self.s.f*80,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var x0=W*0.10, x1=W*0.90, midY=H*0.36, A=H*0.13, k=0.6+s.f*0.25, w=3;
      // E 필드(세로 사인, 초록)
      ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath();
      for(var i=0;i<=200;i++){ var xu=i/200*12, X=x0+(x1-x0)*i/200, y=midY-A*Math.sin(k*xu-w*s.t); if(i===0)ctx.moveTo(X,y); else ctx.lineTo(X,y); } ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('전기장 E', x0, midY-A-8);
      // B 필드(원근 표현: 같은 위상, 옅은 파랑, 가로로 눕힘)
      ctx.strokeStyle='rgba(122,184,255,0.6)'; ctx.lineWidth=2; ctx.beginPath();
      for(var j=0;j<=200;j++){ var xu2=j/200*12, X2=x0+(x1-x0)*j/200, off=A*0.5*Math.sin(k*xu2-w*s.t); var y2=midY+off*0.5; if(j===0)ctx.moveTo(X2,y2); else ctx.lineTo(X2,y2); } ctx.stroke();
      ctx.fillStyle=BLU; ctx.fillText('자기장 B (⊥)', x0, midY+A+18);
      arrow(E,x1-60,midY,x1-10,midY,ORA,2); ctx.fillStyle=ORA; ctx.fillText('c', x1-40, midY-8);
      // 스펙트럼 바
      var sy=H*0.72, sx0=W*0.12, sx1=W*0.88; var cols=['#7a5cff','#5c8cff','#5cd0ff','#e2503a','#ff8a3a','#ffd23a','#b06bff','#9b6bff','#c83a8a'];
      var names=['전파','마이크로','적외선','적','녹','자','자외선','X선','감마'];
      for(var b=0;b<9;b++){ var bx=sx0+(sx1-sx0)*b/9, bw=(sx1-sx0)/9; ctx.fillStyle=cols[b]; ctx.globalAlpha=0.5; ctx.fillRect(bx,sy,bw,26); ctx.globalAlpha=1; }
      var mx=sx0+(sx1-sx0)*(s.f-0.5)/9; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(mx,sy-6); ctx.lineTo(mx,sy+32); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('낮은 진동수·긴 파장', sx0, sy+46); ctx.textAlign='right'; ctx.fillText('높은 진동수·짧은 파장', sx1, sy+46);
      var lam=(10/(0.6+s.f*0.25)).toFixed(2);
      E.tapHint(W/2, H*0.92, 'A/D로 진동수 — 스펙트럼을 따라 이동', true);
      E.big('빛 = 전기장·자기장의 진동 (c = fλ)', '빛은 <b>전기장과 자기장이 서로 수직으로 진동하며 퍼지는 전자기파</b>입니다 — 매질 없이 진공도 통과(c=3×10⁸ m/s). 전파·마이크로파·적외선·가시광·자외선·X선·감마선은 모두 같은 전자기파이며 <b>진동수(파장)만 다릅니다</b>. 진동수가 높을수록 파장이 짧고 에너지가 큽니다(c=fλ 일정). 우리 눈은 그 좁은 가시광 띠만 봅니다. 맥스웰이 전기·자기 통합으로 예언했습니다.'); }
  },

  // ══════════ 14.2 반사·굴절 — 스넬의 법칙 ══════════
  { id:'phys14_02',
    enter:function(E){ var self=this; this.s={th1:40,n2:1.5};
      E.controls('<div class="ctrl"><label>입사각 θ₁ (도)</label><input type="range" id="aa" min="5" max="85" step="5" value="40"><output id="aao">40</output>'
        +'<label style="margin-left:14px">아래 매질 n₂</label><input type="range" id="nn" min="1" max="2.5" step="0.1" value="1.5"><output id="nno">1.5</output></div>');
      E.bind('#aa','input',function(e){ self.s.th1=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(300+self.s.th1*4,0.07); });
      E.bind('#nn','input',function(e){ self.s.n2=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, n1=1;
      var cx=W*0.45, cy=H*0.46, L=Math.min(W*0.28,H*0.36);
      // 경계면
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.fillRect(cx-W*0.35,cy,W*0.7,H*0.4);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-W*0.35,cy); ctx.lineTo(cx+W*0.35,cy); ctx.stroke();
      // 법선
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx,cy-L); ctx.lineTo(cx,cy+L); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('n₁=1 (공기)', cx-W*0.34, cy-12); ctx.fillText('n₂='+s.n2.toFixed(1), cx-W*0.34, cy+20);
      var t1=s.th1*Math.PI/180;
      // 입사광
      arrow(E,cx-Math.sin(t1)*L,cy-Math.cos(t1)*L,cx,cy,ORA,2.5);
      // 반사광
      arrow(E,cx,cy,cx+Math.sin(t1)*L*0.8,cy-Math.cos(t1)*L*0.8,'rgba(255,178,122,0.45)',1.5);
      // 굴절광(스넬: sinθ2=(n1/n2)sinθ1)
      var s2=n1/s.n2*Math.sin(t1);
      if(s2<=1){ var t2=Math.asin(s2); arrow(E,cx,cy,cx+Math.sin(t2)*L,cy+Math.cos(t2)*L,GRN,2.5);
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('θ₂='+(t2*180/Math.PI).toFixed(0)+'°', cx+Math.sin(t2)*L*0.6+8, cy+Math.cos(t2)*L*0.6);
        E.big('굴절 — 스넬의 법칙 n₁sinθ₁ = n₂sinθ₂ (θ₂='+(t2*180/Math.PI).toFixed(0)+'°)', '빛이 다른 매질로 들어가면 속도가 달라져 <b>경로가 꺾입니다</b>(굴절). 빽빽한 매질(n 큼)에선 느려지고 법선 쪽으로 꺾입니다 — <b>스넬의 법칙 n₁sinθ₁=n₂sinθ₂</b>. 물속 빨대가 꺾여 보이는 것, 렌즈가 상을 맺는 것, 무지개·신기루가 모두 굴절. 굴절률 n=c/v(매질 속 빛 속도비).'); }
      else { // 전반사
        arrow(E,cx,cy,cx+Math.sin(t1)*L,cy-Math.cos(t1)*L,'#ff5a5a',2.5);
        ctx.fillStyle='#ff8a8a'; ctx.font='13px sans-serif'; ctx.fillText('전반사!', cx+30, cy+40);
        E.big('전반사 — 빛이 빠져나가지 못한다', '입사각이 <b>임계각</b>을 넘으면 빛이 굴절하지 못하고 <b>전부 반사</b>됩니다(전반사). 빽빽한 매질(n₂<n₁ 쪽으로 갈 때)에서만 일어납니다. 광섬유가 빛을 가두어 멀리 보내는 원리, 다이아몬드가 반짝이는 이유. 임계각 sinθc=n₂/n₁.'); }
      E.tapHint(W/2, H*0.92, 'A/D로 입사각 · F/H로 굴절률 — 큰 각이면 전반사', true);
    }
  },

  // ══════════ 14.3 이중슬릿 — 빛의 간섭 ══════════
  { id:'phys14_03',
    enter:function(E){ var self=this; this.s={d:3,lam:1};
      E.controls('<div class="ctrl"><label>슬릿 간격 d</label><input type="range" id="dd" min="1.5" max="5" step="0.5" value="3"><output id="ddo">3.0</output>'
        +'<label style="margin-left:14px">파장 λ</label><input type="range" id="ll" min="0.5" max="2" step="0.1" value="1"><output id="llo">1.0</output></div>');
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ll','input',function(e){ self.s.lam=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.lam*120,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var slitX=W*0.22, scrX=W*0.80, cy=H*0.44, Lsep=s.d*18;
      // 슬릿 벽
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(slitX,H*0.14); ctx.lineTo(slitX,cy-Lsep/2-6); ctx.moveTo(slitX,cy-Lsep/2+6); ctx.lineTo(slitX,cy+Lsep/2-6); ctx.moveTo(slitX,cy+Lsep/2+6); ctx.lineTo(slitX,H*0.74); ctx.stroke();
      var s1y=cy-Lsep/2, s2y=cy+Lsep/2;
      // 동심 파면(두 슬릿에서)
      [s1y,s2y].forEach(function(sy){ for(var r=1;r<14;r++){ ctx.strokeStyle='rgba(122,184,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(slitX,sy,r*s.lam*16,-1,1); ctx.stroke(); } });
      // 스크린 + 간섭무늬(세기 I=cos²(π d sinθ/λ))
      var L=(scrX-slitX)/18;   // 슬릿-스크린 거리(단위)
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(scrX,H*0.14); ctx.lineTo(scrX,H*0.74); ctx.stroke();
      for(var py=-H*0.28;py<=H*0.28;py+=3){ var yu=py/18, theta=Math.atan2(yu, L), I=Math.pow(Math.cos(Math.PI*s.d*Math.sin(theta)/s.lam),2);
        ctx.fillStyle='rgba(255,210,120,'+I+')'; ctx.fillRect(scrX+4, cy+py-1.5, 26, 3); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('스크린', scrX+17, H*0.80); ctx.fillText('이중슬릿', slitX, H*0.80);
      E.tapHint(W/2, H*0.90, 'A/D·F/H로 슬릿간격·파장 — 무늬 간격 변화', true);
      E.big('이중슬릿 간섭 — 빛은 파동이다 (밝고 어두운 줄무늬)', '두 슬릿을 지난 빛이 겹치면 <b>밝고 어두운 줄무늬</b>(간섭무늬)가 생깁니다 — 두 경로의 차이가 파장의 정수배면 보강(밝음), 반파장 어긋나면 상쇄(어둠). 입자라면 두 줄만 생길 텐데 줄무늬가 생긴다는 건 <b>빛이 파동</b>이라는 결정적 증거(영, 1801). 슬릿 간격을 좁히거나 파장을 늘리면 무늬가 넓어집니다(밝은 무늬 간격 ≈ λL/d). 그런데 다음 장면에선 빛이 입자이기도 합니다...'); }
  },

  // ══════════ 14.4 광전효과 — 빛은 입자(광자)이기도 ══════════
  { id:'phys14_04',
    enter:function(E){ var self=this; this.s={f:6,t:0,W:3};
      E.controls('<div class="ctrl"><label>빛 진동수 f (광자 에너지 ∝ f)</label><input type="range" id="ff" min="1" max="10" step="1" value="6"><output id="ffo">6</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(200+self.s.f*70,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var Eph=s.f, KE=Eph-s.W, emit=KE>0, plateX=W*0.46, cy=H*0.44;
      // 금속판
      ctx.fillStyle='rgba(180,180,200,0.25)'; ctx.fillRect(plateX,H*0.18,30,H*0.5);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(plateX,H*0.18,30,H*0.5);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('금속', plateX+15, H*0.74);
      // 광자(왼쪽에서 날아옴) — 진동수 높을수록 푸른/보라
      var ph=(s.t*2)%1; for(var i=0;i<4;i++){ var px=W*0.08+((ph+i*0.25)%1)*(plateX-W*0.08), py=cy-40+i*26;
        var col=s.f<4?'#e2503a':s.f<7?'#5cd0ff':'#9b6bff'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); for(var w=0;w<20;w++){ var wx=px+w, wy=py+Math.sin(w*0.8+s.t*10)*4; if(w===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); }
      // 전자 방출 여부
      if(emit){ var ep=(s.t*1.5)%1; for(var k=0;k<3;k++){ var ex=plateX+30+((ep+k*0.33)%1)*(W*0.4), ey=cy-20+k*20-((ep+k*0.33))*30;
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ex,ey,5,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.font='bold 9px sans-serif'; ctx.fillText('e', ex, ey+3); }
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('전자 방출! KE = hf − W = '+KE.toFixed(1), W*0.6, H*0.24);
      } else { ctx.fillStyle='#ff7a7a'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('✗ 전자 방출 없음 (hf < W)', W*0.66, H*0.30); }
      // 에너지 막대
      var bx=W*0.10, baseY=H*0.92; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('광자에너지 hf='+Eph+' vs 일함수 W='+s.W+(emit?' → KE='+KE.toFixed(1):' → 부족'), bx, baseY);
      E.tapHint(W/2, H*0.84, 'A/D로 진동수 — 문턱 넘어야 전자 방출(밝기 무관)', true);
      E.big('광전효과 — 빛은 알갱이(광자), E = hf', '금속에 빛을 쪼이면 전자가 튀어나옵니다(광전효과). 그런데 충격적인 사실: <b>아무리 밝아도 진동수가 문턱보다 낮으면 전자가 안 나오고</b>, 문턱을 넘으면 약한 빛이라도 즉시 나옵니다. 빛이 파동이라면 설명 불가 — 빛은 <b>에너지 E=hf의 알갱이(광자)</b> 다발이라, 광자 하나가 전자 하나를 때려야 하기 때문입니다(아인슈타인, 노벨상). 빛은 파동이자 입자 — 양자역학의 문.'); }
  },

  // ══════════ 14.5 시간 팽창 — 특수상대성 ══════════
  { id:'phys14_05',
    enter:function(E){ var self=this; this.s={beta:0.6,t:0};
      E.controls('<div class="ctrl"><label>속도 v (광속의 배수 β)</label><input type="range" id="bb" min="0" max="0.95" step="0.05" value="0.6"><output id="bbo">0.60</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(300+self.s.beta*300,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; s.t+=1/60;
      var gamma=1/Math.sqrt(1-s.beta*s.beta);
      // 정지 광시계(왼쪽): 빛이 두 거울 사이 수직 왕복
      var x1=W*0.22, topY=H*0.22, botY=H*0.50, ph0=(s.t*1.2)%1, ly0=topY+(botY-topY)*(ph0<0.5?ph0*2:2-ph0*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1-26,topY); ctx.lineTo(x1+26,topY); ctx.moveTo(x1-26,botY); ctx.lineTo(x1+26,botY); ctx.stroke();
      ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x1,topY); ctx.lineTo(x1,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(x1,ly0,5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('정지 시계', x1, botY+24);
      // 움직이는 광시계(오른쪽): 빛 경로가 대각선 → 한 틱이 γ배 길어짐
      var ph1=((s.t*1.2/gamma)%1), drift=((s.t*0.4)%1), bx=W*0.45+drift*W*0.4;
      var ly1=topY+(botY-topY)*(ph1<0.5?ph1*2:2-ph1*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx-26,topY); ctx.lineTo(bx+26,topY); ctx.moveTo(bx-26,botY); ctx.lineTo(bx+26,botY); ctx.stroke();
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx-drift*30,topY); ctx.lineTo(bx,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(bx,ly1,5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.fillText('움직이는 시계 (v='+s.beta.toFixed(2)+'c)', bx, botY+24);
      // 틱 카운트
      var t0=Math.floor(s.t*1.2), t1=Math.floor(s.t*1.2/gamma);
      ctx.fillStyle=GRN; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('틱 '+t0, x1, topY-12);
      ctx.fillStyle=BLU; ctx.fillText('틱 '+t1, bx, topY-12);
      E.tapHint(W/2, H*0.86, 'A/D로 속도 — 빠를수록 시간이 더 느려짐', true);
      E.big('시간 팽창 γ = 1/√(1−v²/c²) = '+gamma.toFixed(2)+'배 느리게', '빛의 속도는 누구에게나 같다 — 이 한 가지 사실에서 시간이 늘어납니다. 움직이는 시계의 빛은 <b>대각선의 긴 경로</b>를 가야 해서, 한 번 왕복(1틱)에 더 오래 걸립니다 → <b>움직이는 시계가 느리게 갑니다</b>(시간 팽창, γ배). 빠를수록(β→1) 극적으로 느려집니다. GPS 위성도 이 보정을 합니다. 질량도 에너지의 한 형태 — <b>E=mc²</b>. 시간·공간·질량·에너지가 하나로 얽힌 아인슈타인의 세계입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
