/* 물리학 제14장 빛·현대물리 — 전자기파, 반사·굴절(스넬), 이중슬릿 간섭, 광전효과, 시간 팽창
   파동·광학·양자·상대성은 닫힌 형태가 본질(운동학 예외) — 표시 수치는 전부 해당 식에서 실시간 계산.
   골든룰: 화면의 모든 각도·세기·에너지·γ는 식으로 계산(하드코딩 금지).
   텍스트=content/phys14.json. 엔진=js/physlab.js(공유), js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b';
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
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
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
      ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('λ ∝ '+lam+' (상대값)', mx, sy-10);
      E.tapHint(W/2, H*0.92, '진동수를 바꿔 스펙트럼을 거닐어 보세요', true);
      E.big('빛 = 전기장·자기장의 떨림 (c = fλ)', '빛은 물질이 아니라 <b>전기장과 자기장이 서로를 만들어내며 퍼지는 떨림</b>입니다 — 아무것도 붙잡지 않고 텅 빈 진공도 통과(c=3×10⁸ m/s). 전파·적외선·가시광·X선·감마선은 모두 같은 떨림이고 <b>빠르게 떨리냐 천천히 떨리냐(진동수)만 다릅니다</b>. 진동수가 높을수록 파장이 짧고 에너지가 큽니다(c=fλ 일정). 우리 눈은 햇빛이 가장 센 그 손톱만 한 가시광 창문만 봅니다. 맥스웰이 종이 위에서 이 떨림을 먼저 발견했고, 그 속도가 빛과 똑같았습니다.'); }
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
        E.big('굴절 — 스넬의 법칙 n₁sinθ₁ = n₂sinθ₂ (θ₂='+(t2*180/Math.PI).toFixed(0)+'°)', '빛이 빽빽한 매질에 닿으면 그쪽 가장자리가 먼저 <b>느려져 길을 꺾습니다</b>(굴절) — 잔디밭에서 진흙으로 비스듬히 뛰어든 사람이 돌아가듯이요. 빽빽할수록(n 큼) 법선 쪽으로 더 꺾입니다 — <b>스넬의 법칙 n₁sinθ₁=n₂sinθ₂</b>. 물속 빨대가 꺾여 보이고, 렌즈가 상을 맺고, 무지개·신기루가 생기는 것 — 모두 빛이 느려지며 꺾이는 한 가지 이야기입니다. 굴절률 n=c/v(매질 속에서 빛이 얼마나 느려지나).'); }
      else { // 전반사
        arrow(E,cx,cy,cx+Math.sin(t1)*L,cy-Math.cos(t1)*L,'#ff5a5a',2.5);
        ctx.fillStyle='#ff8a8a'; ctx.font='13px sans-serif'; ctx.fillText('전반사!', cx+30, cy+40);
        E.big('전반사 — 빛이 갇혀 버린다', '빛을 너무 비스듬히 보내 입사각이 <b>임계각</b>을 넘으면, 빠져나갈 각도가 아예 사라져 <b>전부 되튕깁니다</b>(전반사). 빽빽→성긴 매질(n₂<n₁) 쪽으로 갈 때만 일어납니다. 머리카락보다 가는 유리실(광섬유)이 이렇게 갇힌 빛을 수천 km 나르고, 다이아몬드가 빛을 가두어 반짝입니다. 임계각 sinθc=n₂/n₁.'); }
      E.tapHint(W/2, H*0.92, '입사각·굴절률을 바꿔 보세요 (너무 비스듬하면 전반사)', true);
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
      ctx.fillStyle='rgba(255,210,120,0.9)'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('밝기 I=cos²(πd·sinθ/λ)', scrX+17, H*0.13);
      var fr=(s.lam*L/s.d).toFixed(1); ctx.fillStyle=DIM; ctx.fillText('무늬 간격 ≈ λL/d = '+fr, scrX+17, H*0.86);
      E.tapHint(W/2, H*0.90, '틈 간격·파장을 바꿔 무늬가 벌어지는 걸 보세요', true);
      E.big('이중슬릿 간섭 — 빛은 파동이다 (밝고 어두운 줄무늬)', '빛이 총알 같은 알갱이라면 틈 두 개에 <b>밝은 줄 두 개</b>만 찍혀야 합니다. 그런데 실제로는 <b>밝고 어두운 줄무늬가 여러 개</b> 생깁니다 — 두 틈에서 나온 물결이 겹쳐 마루끼리 만나면 더 밝고(보강), 마루와 골이 만나면 서로 지워지기(상쇄) 때문이죠. 알갱이로는 설명 불가 — <b>빛은 파동</b>이라는 결정적 증거(영, 1801). 틈을 좁히거나 파장을 늘리면 무늬가 벌어집니다(밝은 무늬 간격 ≈ λL/d). 마음의 준비를 — 다음 장면에서 이 빛이 알갱이라고 우깁니다...'); }
  },

  // ══════════ 14.4 광전효과 — 빛은 입자(광자)이기도 ══════════
  { id:'phys14_04',
    enter:function(E){ var self=this; this.s={f:6,t:0,W:3};
      E.controls('<div class="ctrl"><label>빛 진동수 f (광자 에너지 ∝ f)</label><input type="range" id="ff" min="1" max="10" step="1" value="6"><output id="ffo">6</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(200+self.s.f*70,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var Eph=s.f, KE=Eph-s.W, emit=KE>0, plateX=W*0.46, cy=H*0.44;
      // 금속판
      ctx.fillStyle='rgba(180,180,200,0.25)'; ctx.fillRect(plateX,H*0.18,30,H*0.5);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(plateX,H*0.18,30,H*0.5);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('금속', plateX+15, H*0.74);
      // 광자(왼쪽에서 날아옴) — 진동수 높을수록 푸른/보라
      var ph=(s.t*2)%1; for(var i=0;i<4;i++){ var px=W*0.08+((ph+i*0.25)%1)*(plateX-W*0.08), py=cy-40+i*26;
        var col=s.f<4?'#e2503a':s.f<7?'#5cd0ff':'#9b6bff'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); for(var w=0;w<20;w++){ var wx=px+w, wy=py+Math.sin(w*0.8+s.t*10)*4; if(w===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('광자 (E=hf='+Eph+')', W*0.07, cy-58);
      // 전자 방출 여부
      if(emit){ var ep=(s.t*1.5)%1; for(var k=0;k<3;k++){ var ex=plateX+30+((ep+k*0.33)%1)*(W*0.4), ey=cy-20+k*20-((ep+k*0.33))*30;
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ex,ey,5,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.font='bold 9px sans-serif'; ctx.fillText('e', ex, ey+3); }
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('전자 방출! KE = hf − W = '+KE.toFixed(1), W*0.6, H*0.24);
      } else { ctx.fillStyle='#ff7a7a'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('✗ 전자 방출 없음 (hf < W)', W*0.66, H*0.30); }
      // 에너지 막대
      var bx=W*0.10, baseY=H*0.92; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('광자에너지 hf='+Eph+' vs 일함수 W='+s.W+(emit?' → KE='+KE.toFixed(1):' → 부족'), bx, baseY);
      E.tapHint(W/2, H*0.84, '진동수가 문턱을 넘어야 전자 방출 (밝기는 무관)', true);
      E.big('광전효과 — 빛은 알갱이(광자), E = hf', '상식대로면 빛을 <b>밝게</b> 쪼일수록 전자가 잘 나와야겠죠. 그런데 붉은빛은 눈부시게 밝혀도 전자가 한 개도 안 나오고, 푸른빛은 희미해도 즉시 튀어나옵니다 — 밝기가 아니라 색(진동수)이 문제입니다. 부드러운 파동으로는 설명 불가. 빛은 <b>에너지 E=hf짜리 알갱이(광자)</b>가 우박처럼 쏟아지는 것이라, 한 알이 충분히 세게 때려야만 전자가 떨어집니다(아인슈타인, 노벨상). 약한 광자는 아무리 많아도 소용없죠. 빛은 파동이자 알갱이 — 양자역학의 문이 열립니다.'); }
  },

  // ══════════ 14.5 시간 팽창 — 특수상대성 ══════════
  { id:'phys14_05',
    enter:function(E){ var self=this; this.s={beta:0.6,t:0};
      E.controls('<div class="ctrl"><label>속도 v (광속의 배수 β)</label><input type="range" id="bb" min="0" max="0.95" step="0.05" value="0.6"><output id="bbo">0.60</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(300+self.s.beta*300,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
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
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('γ = '+gamma.toFixed(2)+'배 느림', bx, botY+40);
      E.tapHint(W/2, H*0.86, '속도가 빠를수록 시간이 더 느려집니다', true);
      E.big('시간 팽창 γ = 1/√(1−v²/c²) = '+gamma.toFixed(2)+'배 느리게', '당신이 빛을 향해 달려가든 도망가든 빛 속도는 늘 같다 — 실험으로 확인된 이 한 줄에서 시간이 늘어납니다. 옆으로 움직이는 시계의 빛은 위아래만이 아니라 <b>비스듬한 더 긴 경로</b>를 달려야 하는데, 빛은 더 빨라질 수 없으니 한 번 왕복(1틱)에 더 오래 걸립니다 → <b>움직이는 시계가 느려집니다</b>(γ배). 마법이 아니라 논리의 강제입니다. 빠를수록(β→1) 극적으로 느려져, GPS 위성도 매일 이 보정을 받습니다. 질량조차 잠든 에너지일 뿐 — <b>E=mc²</b>. 시간·공간·질량·에너지가 하나로 얽힌, 우리가 사는 우주의 규칙입니다.'); }
  },

  // ─── 심화: 렌즈 결상(기하광학) ───
  { id:'phys14_02_lens', branchOf:'phys14_02', ord:1,
    enter:function(E){ var self=this; this.s={do_:5,f:2};
      E.controls('<div class="ctrl"><label>물체 거리 do</label><input type="range" id="dd" min="1" max="8" step="0.5" value="5"><output id="ddo">5.0</output>'
        +'<label style="margin-left:14px">초점거리 f</label><input type="range" id="ff" min="1" max="3.5" step="0.5" value="2"><output id="ffo">2.0</output></div>');
      E.bind('#dd','input',function(e){ self.s.do_=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.5, axisY=H*0.46, sc=W*0.075, ho=1.2;
      var di=1/(1/s.f-1/s.do_), m=-di/s.do_, hi=m*ho;
      // 광축·렌즈
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W*0.06,axisY); ctx.lineTo(W*0.94,axisY); ctx.stroke();
      ctx.strokeStyle='rgba(122,184,255,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,axisY-70); ctx.lineTo(cx,axisY+70); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
      [-1,1].forEach(function(sg){ ctx.fillStyle=DIM; ctx.beginPath(); ctx.arc(cx+sg*s.f*sc,axisY,3,0,7); ctx.fill(); ctx.fillText('F', cx+sg*s.f*sc, axisY+16); });
      // 물체(왼쪽 화살표)
      var ox=cx-s.do_*sc; arrow(E,ox,axisY,ox,axisY-ho*sc,GRN,2.5);
      // 주요 광선 2개: ①축평행→초점 ②중심 직진
      var topO=axisY-ho*sc;
      ctx.strokeStyle='rgba(255,178,122,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(cx,topO); ctx.stroke();   // 평행
      ctx.beginPath(); ctx.moveTo(ox,topO); ctx.lineTo(cx,axisY); ctx.stroke();   // 중심
      var realimg = di>0;
      if(realimg){ var ix=cx+di*sc, topI=axisY-hi*sc;
        ctx.beginPath(); ctx.moveTo(cx,topO); ctx.lineTo(ix,topI); ctx.stroke();   // 평행→상점
        ctx.beginPath(); ctx.moveTo(cx,axisY); ctx.lineTo(ix,topI); ctx.stroke();
        arrow(E,ix,axisY,ix,topI,PNK,2.5); ctx.fillStyle=PNK; ctx.fillText('상(실상,거꾸로)', ix, axisY+ (hi<0?-8: 18)); }
      else { // 허상(같은쪽)
        var ix2=cx+di*sc, topI2=axisY-hi*sc; ctx.setLineDash([4,3]); ctx.strokeStyle='rgba(244,160,192,0.6)';
        ctx.beginPath(); ctx.moveTo(ix2,topI2); ctx.lineTo(cx,topO); ctx.stroke(); ctx.setLineDash([]);
        arrow(E,ix2,axisY,ix2,topI2,PNK,2.5); ctx.fillStyle=PNK; ctx.fillText('상(허상,바로)', ix2, axisY+18); }
      E.tapHint(W/2, H*0.92, '물체 거리·초점거리를 바꿔 상의 위치·크기를 보세요', true);
      E.big('렌즈식 1/f = 1/do + 1/di → di = '+di.toFixed(1)+', 배율 m = '+m.toFixed(2), '볼록렌즈는 흩어지던 빛을 한 점에 다시 모아 <b>상</b>을 맺습니다 — <b>1/f = 1/do + 1/di</b>(렌즈 방정식), 배율 m = −di/do. 두 줄기만 따라가면 끝: 축과 나란히 온 빛은 초점으로 꺾이고, 한가운데로 온 빛은 곧장 통과 — 둘이 만나는 곳이 상점입니다. 물체가 초점 밖(do>f)이면 거꾸로 뒤집힌 <b>실상</b>(카메라·당신의 망막), 초점 안(do<f)이면 똑바로 커진 <b>허상</b>(돋보기). 갈릴레오의 망원경과 당신의 안경이 똑같은 이 한 식을 따릅니다.'); }
  },

  // ─── 심화: 단일슬릿 회절 ───
  { id:'phys14_03_diffraction', branchOf:'phys14_03', ord:1,
    enter:function(E){ var self=this; this.s={a:2,lam:1};
      E.controls('<div class="ctrl"><label>슬릿 폭 a</label><input type="range" id="aa" min="1" max="5" step="0.5" value="2"><output id="aao">2.0</output>'
        +'<label style="margin-left:14px">파장 λ</label><input type="range" id="ll" min="0.5" max="2" step="0.1" value="1"><output id="llo">1.0</output></div>');
      E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ll','input',function(e){ self.s.lam=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.lam*120,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var slitX=W*0.30, scrX=W*0.82, cy=H*0.44, aw=s.a*14;
      // 슬릿 벽
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(slitX,H*0.14); ctx.lineTo(slitX,cy-aw/2); ctx.moveTo(slitX,cy+aw/2); ctx.lineTo(slitX,H*0.74); ctx.stroke();
      // 입사 평면파
      for(var w=0;w<4;w++){ ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.12+w*14,cy-aw/2); ctx.lineTo(W*0.12+w*14,cy+aw/2); ctx.stroke(); }
      // 스크린 + 회절 무늬 I=sinc²(πa sinθ/λ)
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(scrX,H*0.12); ctx.lineTo(scrX,H*0.76); ctx.stroke();
      var Ld=(scrX-slitX)/14;
      for(var py=-H*0.30;py<=H*0.30;py+=2){ var yu=py/14, theta=Math.atan2(yu,Ld), beta=Math.PI*s.a*Math.sin(theta)/s.lam, I=beta===0?1:Math.pow(Math.sin(beta)/beta,2);
        ctx.fillStyle='rgba(255,210,120,'+I.toFixed(3)+')'; ctx.fillRect(scrX+4, cy+py-1, 28, 2); }
      var width=2*s.lam/s.a;   // 중앙 극대 각폭 ∝ λ/a
      ctx.fillStyle='rgba(255,210,120,0.9)'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('밝기 I=sinc²(πa·sinθ/λ)', scrX+18, H*0.10);
      ctx.fillStyle=DIM; ctx.fillText('중앙폭 ∝ 2λ/a = '+width.toFixed(2), scrX+18, H*0.80); ctx.textAlign='center'; ctx.fillText('단일슬릿', slitX, H*0.80);
      E.tapHint(W/2, H*0.90, '틈이 좁을수록 회절이 넓게 퍼집니다(폭 ∝ λ/a)', true);
      E.big('단일슬릿 회절 — 중앙 밝은 무늬 폭 ∝ λ/a', '직선으로만 가야 할 빛이 좁은 틈을 지나는 순간 <b>부채처럼 퍼집니다</b> — 회절. 틈 자체가 새로운 물결의 출발점이 되기 때문이죠. 스크린에 가운데 밝은 무늬와 양옆의 희미한 무늬가 보입니다. <b>틈이 좁을수록(a↓), 파장이 길수록(λ↑) 더 넓게 퍼집니다</b>(중앙폭 ∝ λ/a). 첫 어두운 무늬는 a·sinθ=λ. 이 작은 퍼짐 때문에 우주 어떤 망원경·현미경도 흐릿함을 완전히 못 피하고(회절한계), 벽 뒤 목소리도 들립니다(파장 긴 소리는 모퉁이를 잘 돎).'); }
  },

  // ─── 심화: 보어 원자모형 ───
  { id:'phys14_04_bohr', branchOf:'phys14_04', ord:1,
    enter:function(E){ var self=this; this.s={ni:3,nf:2,t:0,phase:0};
      E.controls('<div class="ctrl"><label>전이: 높은 준위 n</label><input type="range" id="ni" min="2" max="5" step="1" value="3"><output id="nio">3</output>'
        +'<label style="margin-left:14px">낮은 준위 n</label><input type="range" id="nf" min="1" max="3" step="1" value="2"><output id="nfo">2</output></div>');
      E.bind('#ni','input',function(e){ self.s.ni=+e.target.value; document.getElementById('nio').textContent=e.target.value; self.s.phase=0; E.blip(360,0.07); });
      E.bind('#nf','input',function(e){ self.s.nf=+e.target.value; document.getElementById('nfo').textContent=e.target.value; self.s.phase=0; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ if(!E.frozen)s.t+=1/60; s.phase=(s.phase+1/60*0.4)%1; }
      var ni=Math.max(s.ni,s.nf+1), nf=Math.min(s.nf,ni-1);
      var cx=W*0.32, cy=H*0.46, sc=Math.min(W*0.04,H*0.06);
      // 핵
      ctx.fillStyle=NRED; ctx.beginPath(); ctx.arc(cx,cy,8,0,7); ctx.fill();
      // 궤도 n=1..5 (반지름 ∝ n²)
      for(var n=1;n<=5;n++){ ctx.strokeStyle=(n===ni||n===nf)?'rgba(255,178,122,0.7)':'rgba(255,255,255,0.15)'; ctx.lineWidth=(n===ni||n===nf)?2:1; ctx.beginPath(); ctx.arc(cx,cy,n*n*sc*0.6,0,7); ctx.stroke(); }
      // 전자: ni→nf로 떨어지는 애니메이션
      var rn = (ni - (ni-nf)*s.phase); var rr=rn*rn*sc*0.6, a=s.t*2;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx+rr*Math.cos(a),cy+rr*Math.sin(a),5,0,7); ctx.fill();
      // 방출 광자(전이 시) — 색은 에너지(파장)
      var E_i=-13.6/(ni*ni), E_f=-13.6/(nf*nf), dE=E_i-E_f<0? E_f-E_i : E_i-E_f; dE=Math.abs(E_i-E_f);
      var col = dE>3?'#9b6bff': dE>2.5?'#5c8cff': dE>1.9?'#5cd0ff':'#e2503a';
      if(s.phase>0.5){ for(var k=0;k<4;k++){ var px=cx+60+((s.phase-0.5)*2*W*0.3+k*12), py=cy-60; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); for(var w2=0;w2<14;w2++){ var wx=px+w2, wy=py+Math.sin(w2*0.9+s.t*10)*4; if(w2===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); } }
      // 에너지 준위 막대
      var gx=W*0.66, gy0=H*0.74, gh=H*0.5;
      for(var n2=1;n2<=5;n2++){ var En=-13.6/(n2*n2), y=gy0-(1+En/13.6)*gh; ctx.strokeStyle=(n2===ni||n2===nf)?ORA:'rgba(255,255,255,0.25)'; ctx.lineWidth=(n2===ni||n2===nf)?2:1; ctx.beginPath(); ctx.moveTo(gx,y); ctx.lineTo(gx+W*0.2,y); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillText('n='+n2+' ('+En.toFixed(1)+'eV)', gx+W*0.21, y+3); }
      // 전이 화살표
      var yi=gy0-(1+E_i/13.6)*gh, yf=gy0-(1+E_f/13.6)*gh; ctx.strokeStyle=col; ctx.lineWidth=2; arrow(E,gx+W*0.1,yi,gx+W*0.1,yf,col,2);
      E.tapHint(W/2, H*0.90, '전이 준위를 바꿔 방출 광자(색)를 보세요', true);
      E.big('보어 원자: 전자가 n='+ni+'→'+nf+' 떨어지며 광자 방출 (E=hf='+dE.toFixed(1)+' eV)', '보어는 전자가 사다리 칸처럼 <b>정해진 궤도(에너지 준위)에만</b> 설 수 있다고 했습니다 — 에너지가 양자화(E_n=−13.6/n² eV). 전자가 높은 칸에서 낮은 칸으로 뚝 떨어질 때, 두 칸의 <b>에너지 차이가 광자 한 알로 튀어나옵니다</b>(E=hf=E_i−E_f). 크게 떨어질수록 큰 에너지=보라빛, 살짝 떨어지면 붉은빛. 이 칸 간격이 원소마다 달라 고유한 <b>선 스펙트럼</b>을 만들고 — 덕분에 한 번도 못 간 별빛만 보고 그 성분을 압니다(분광학). 14.4의 광자가 원자 속으로 들어온 것입니다.'); }
  },

  // ─── 심화: 방사성 붕괴 ───
  { id:'phys14_05_decay', branchOf:'phys14_05', ord:1,
    enter:function(E){ var self=this; this.s={half:3,t:0};
      E.controls('<div class="ctrl"><label>반감기 T½ (초)</label><input type="range" id="hh" min="1" max="6" step="0.5" value="3"><output id="hho">3.0</output></div>');
      E.bind('#hh','input',function(e){ self.s.half=+e.target.value; self.s.t=0; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ if(!E.frozen)s.t+=1/60; if(s.t>s.half*5) s.t=0; }
      var frac=Math.pow(0.5, s.t/s.half), N0=64, N=N0*frac;
      // 핵 격자(남은 것 채색)
      var ox=W*0.10, oy=H*0.22, cols2=8;
      for(var i=0;i<64;i++){ var r=Math.floor(i/cols2), c=i%cols2, x=ox+c*22, y=oy+r*22;
        // 결정적으로 "남은" N개를 채움(앞에서부터 빠짐: 해시 순서)
        var alive = i >= (64-Math.round(N));
        ctx.fillStyle=alive?GRN:'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); }
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('남은 핵 N = '+Math.round(N)+' / '+N0, ox, oy-12);
      // 붕괴 곡선
      var gx0=W*0.50, gx1=W*0.93, gy0=H*0.78, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('N',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=60;k++){ var tt=k/60*s.half*5, f2=Math.pow(0.5,tt/s.half), x=gx0+(tt/(s.half*5))*(gx1-gx0), y=gy0-f2*gh; if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 반감기 표시(절반 지점)
      for(var hcnt=1;hcnt<=4;hcnt++){ var th=hcnt*s.half; if(th>s.half*5)break; var x=gx0+(th/(s.half*5))*(gx1-gx0), y=gy0-Math.pow(0.5,hcnt)*gh; ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x,gy0); ctx.lineTo(x,y); ctx.lineTo(gx0,y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(255,178,122,0.7)'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(hcnt+'T½', x, gy0+12); }
      // 현재 점
      var mx=gx0+(Math.min(s.t,s.half*5)/(s.half*5))*(gx1-gx0), my=gy0-frac*gh; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.92, '화면 탭=초기화 · 반감기마다 절반으로 줄어듦', true);
      E.big('방사성 붕괴 N = N₀·(½)^(t/T½) — 남은 핵 '+Math.round(N)+'/'+N0+'  (t='+s.t.toFixed(1)+'s)', '핵 하나에게 \'언제 깨질래?\' 물으면 우주 누구도 모릅니다 — 완벽한 무작위입니다. 그런데 수십억 개를 모으면 거짓말처럼 정확해져, 매 <b>반감기 T½</b>마다 어김없이 <b>딱 절반</b>이 사라집니다. N = N₀·(½)^(t/T½) = N₀·e^(−λt). 개별은 예측 불가, 집단은 시계처럼 정확 — 양자 통계의 마법이죠. 반감기는 원소 고유(탄소-14 5730년, 우라늄-238 45억년). 이 멈추지 않는 리듬이 <b>방사성 연대측정</b>(화석·유물·암석 나이)의 시계가 됩니다. 핵에너지·의료 방사선의 바탕입니다.'); }
  },

  // ─── 심화: 휘어진 시공간 (일반상대성) — 인트로 훅의 본편 ───
  { id:'phys14_05_gr', branchOf:'phys14_05', ord:1,
    enter:function(E){ var self=this; this.s={M:1.2};
      E.controls('<div class="ctrl"><label>질량 M (시공간 굴곡)</label><input type="range" id="mm" min="0" max="2.5" step="0.1" value="1.2"><output id="mmo">1.2</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.M*100,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, fr=E.frame;
      var cx=W*0.40, cy=H*0.44, gw=Math.min(W*0.30,H*0.42), warp=s.M;
      function dip(dx,dy){ var rr=(dx*dx+dy*dy)/(gw*gw*0.08); return warp*(gw*0.6)/(1+rr); }
      function P(u,v){ var bx=u*gw,by=v*gw*0.5,d=dip(bx,by),r=Math.hypot(bx,by)||1,pull=d*0.34; return [cx+bx-(bx/r)*pull, cy+by+d]; }
      // 시공간 격자(휘어진 우물)
      var N=13;
      for(var iy=0;iy<=N;iy++){ var v=iy/N*2-1; ctx.strokeStyle='rgba(95,214,168,'+(0.09+0.15*(1-Math.abs(v))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(var ix=0;ix<=N;ix++){ var p=P(ix/N*2-1,v); if(ix===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
      for(ix=0;ix<=N;ix++){ var u=ix/N*2-1; ctx.strokeStyle='rgba(122,184,255,'+(0.07+0.12*(1-Math.abs(u))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(iy=0;iy<=N;iy++){ var p2=P(u,iy/N*2-1); if(iy===0)ctx.moveTo(p2[0],p2[1]); else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); }
      // 중심 질량
      var my=cy+dip(0,0); var grd=ctx.createRadialGradient(cx,my,2,cx,my,18+warp*12); grd.addColorStop(0,'rgba(255,244,210,0.95)'); grd.addColorStop(1,'rgba(255,178,90,0)'); ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,my,18+warp*12,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,my,3+warp*4,0,7); ctx.fill();
      // 빛(별빛)이 질량 곁을 지나며 휘어짐 — 중력렌즈
      var beamY=cy-gw*0.42, bx0=cx-gw*1.3; ctx.strokeStyle='#ffe06a'; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=80;k++){ var X=bx0+k/80*(gw*2.6), rel=(X-cx), defl=warp*1400/((rel*rel)+gw*gw*0.4); var Y=beamY + defl*(rel>0?-0: 0) + defl;  // 질량 쪽으로 당겨짐
        Y=beamY + warp* (gw*0.5) * Math.exp(-(rel*rel)/(gw*gw*0.5)) ;   // 가까울수록 아래로 휨
        if(k===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      ctx.fillStyle='#ffe06a'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('별빛', bx0, beamY-6);
      // 시간 느려짐: 멀리·가까이 두 시계
      function clock(px,py,rate,lab){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,12,0,7); ctx.stroke(); var a=-Math.PI/2 + (fr*0.04*rate)%(2*Math.PI); ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+9*Math.cos(a),py+9*Math.sin(a)); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,px,py+26); }
      var rateNear=1/Math.sqrt(1+warp*0.8);   // 질량 근처 시계가 느리게(개념적)
      clock(cx+gw*0.35, cy+gw*0.34, rateNear, '질량 근처(느림)');
      clock(W*0.88, H*0.30, 1, '먼 곳(빠름)');
      E.tapHint(W/2, H*0.93, '질량을 키우면 시공간이 더 휘고 빛도 더 꺾입니다', true);
      E.big('일반상대성 — 중력은 휘어진 시공간이다', '뉴턴은 "왜 끌어당기지?"에 답하지 못했습니다. 아인슈타인의 답: <b>끌어당기는 게 아니다 — 질량이 시공간을 휘게 하고, 모든 것은 그 휜 길을 따라갈 뿐</b>이다. 무거울수록 우물이 깊어지죠. 놀랍게도 <b>빛조차 휩니다</b>(별빛이 태양 곁에서 꺾이는 것을 1919년 일식 때 확인 — 아인슈타인은 하룻밤 새 유명해졌습니다). 질량 근처에서는 <b>시간도 느려집니다</b>(그래서 GPS는 매일 보정). 우물이 너무 깊어 빛조차 못 나오면 블랙홀, 시공간이 출렁이면 중력파(2015 직접 관측). 인트로에서 본 그 휘어진 무대 — 바로 우리가 사는 우주의 진짜 모습입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
