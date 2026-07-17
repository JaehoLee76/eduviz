/* 산업위생기술사 제18장 — 기출 계산 은행 Ⅱ : 송풍기·덕트 (동작만. 텍스트=content/hyg18.json)
   출처: 실제 기출 송풍기·덕트 계산문제(제119회 이내, 항목 7·10~19)를 대표 예시로 재구성. 풀이(해설·시각화)는 신규 작성.
   골든룰: 표시 수치는 전부 draw에서 실계산(슬라이더값으로부터 매 프레임). 검산값은 각 블록 주석 참조.
   hyg17(계산은행Ⅰ) 패턴을 그대로 이어감. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다. lh 고정값 대신 실제 폰트높이+최소여백에서
     블록높이를 계산해 캔버스가 작아도 라벨·값이 겹치지 않는다(여백은 겹침 방지에 필요한
     최소치만 — 과도한 패딩은 표준 캔버스 높이(hygiene.html 프리뷰 기준 CSS ~235px)에서
     하단 콘텐츠가 캔버스 밖으로 밀려나는 역효과를 냄, 2026-07-16 발견·교정).
     반환값 = 소비한 총 세로높이(마지막 rowGap 제외) → 호출부가 y+=ROW(...)로 커서 이동. */
  function ROW(ctx,W,H,x,y,w,rows){
    var labelFs=FS(H,0.022,11,14), valueFs=FS(H,0.028,13,15);
    var gap=FS(H,0.008,4,6), rowGap=FS(H,0.010,5,7);
    var blockH=labelFs+gap+valueFs, cy=y;
    for(var i=0;i<rows.length;i++){
      ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,x-8,cy-3,w,blockH+6,7); ctx.fill();
      T(ctx,rows[i][0],x,cy+labelFs,DIM,labelFs,'left');
      T(ctx,rows[i][1],x,cy+labelFs+gap+valueFs,rows[i][2],valueFs,'left','700');
      cy+=blockH+rowGap;
    }
    return cy-y-rowGap;
  }

  var scenes=[

  /* ── 18.1 송풍기 상사법칙(Fan Affinity Laws) ──
     Q∝N, SP∝N², kW∝N³
     검산① N1=3000→N2=3600(Q1=100): ratio=1.2 → Qr=1.2·SPr=1.44·kWr=1.728(유지비 72.8%↑)
     검산② N1=1000→N2=1300: ratio=1.3 → Q×1.3·SP×1.69·kW×2.197 */
  { id:'hyg18_01',
    enter:function(E){ var self=this; this.s={N1:3000,N2:3600,Q1:100,SP1:100};
      E.controls('<div class="ctrl"><label>기준 회전수 N₁ (rpm)</label><input type="range" id="s1a" min="500" max="4000" step="50" value="3000"><output id="s1ao">3000</output></div>'
        +'<div class="ctrl"><label>변경 회전수 N₂ (rpm)</label><input type="range" id="s1b" min="500" max="4000" step="50" value="3600"><output id="s1bo">3600</output></div>'
        +'<div class="ctrl"><label>기준 송풍량 Q₁ (m³/min)</label><input type="range" id="s1c" min="20" max="300" step="5" value="100"><output id="s1co">100</output></div>'
        +'<div class="ctrl"><label>기준 정압 SP₁ (mmH₂O)</label><input type="range" id="s1d" min="20" max="300" step="5" value="100"><output id="s1do">100</output></div>');
      E.bind('#s1a','input',function(e){ self.s.N1=+e.target.value; document.getElementById('s1ao').textContent=e.target.value; });
      E.bind('#s1b','input',function(e){ self.s.N2=+e.target.value; document.getElementById('s1bo').textContent=e.target.value; });
      E.bind('#s1c','input',function(e){ self.s.Q1=+e.target.value; document.getElementById('s1co').textContent=e.target.value; });
      E.bind('#s1d','input',function(e){ self.s.SP1=+e.target.value; document.getElementById('s1do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ratio=s.N2/s.N1, Qr=ratio, SPr=ratio*ratio, kWr=ratio*ratio*ratio;
      var Q2=s.Q1*Qr, SP2=s.SP1*SPr, powerPct=(kWr-1)*100;
      var y=H*0.24;
      T(ctx,'상사법칙: Q ∝ N  ·  SP ∝ N²  ·  동력(kW) ∝ N³   (회전수비 N₂/N₁ = '+ratio.toFixed(3)+')',W*0.08,y,DIM,FS(H,0.024,12,15),'left');
      y+=FS(H,0.05,16,26);
      var cw=W*0.28, ch=FS(H,0.07,24,38), cx1=W*0.08, cx2=W*0.42;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; RR(ctx,cx1,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,s.N1+' rpm',cx1+cw/2,y+ch*0.6,BLU,FS(H,0.032,14,18),'center','700');
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx1+cw+8,y+ch/2); ctx.lineTo(cx2-8,y+ch/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(cx2-8,y+ch/2); ctx.lineTo(cx2-16,y+ch/2-5); ctx.lineTo(cx2-16,y+ch/2+5); ctx.fill();
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=ORA; RR(ctx,cx2,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,s.N2+' rpm',cx2+cw/2,y+ch*0.6,ORA,FS(H,0.032,14,18),'center','700');
      y+=ch+FS(H,0.04,12,20);
      var rows=[
        ['① 송풍량 Q ∝ N   (×'+Qr.toFixed(3)+')', s.Q1.toFixed(0)+' → '+Q2.toFixed(1)+' m³/min', GRN],
        ['② 정압 SP ∝ N²   (×'+SPr.toFixed(3)+')', s.SP1.toFixed(0)+' → '+SP2.toFixed(1)+' mmH₂O', BLU],
        ['③ 동력 kW ∝ N³   (×'+kWr.toFixed(3)+')', '유지비(전력) '+powerPct.toFixed(1)+' % 증가', RED]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.03,10,16);
      T(ctx,'검산: N₂/N₁='+s.N2+'/'+s.N1+'='+ratio.toFixed(3)+' → kW비='+ratio.toFixed(3)+'³='+kWr.toFixed(3),W*0.08,y,DIM,FS(H,0.022,11,14),'left');
      E.tapHint(0,0,'슬라이더로 회전수·기준 송풍량·정압 조절',true);
      E.big('N '+s.N1+'→'+s.N2+'rpm → 동력×'+kWr.toFixed(2)+'(유지비 '+powerPct.toFixed(1)+'%↑)',
            '기출 빈출유형: 팬을 더 빨리 돌리면 바람은 회전수만큼(1배), 압력은 회전수의 제곱만큼, 전기값은 회전수의 세제곱만큼 늘어납니다 — 조금만 더 돌려도 전기요금이 확 뛰는 이유입니다.'); }
  },

  /* ── 18.2 송풍기 정압(FSP) ──
     FSP = (SP_out − SP_in) − VP_in,  VP=(V/4.043)²
     검산(SPin=-70,SPout=20,Vin=13.5): VPin=(13.5/4.043)²≈11.15, FSP=(20-(-70))-11.15≈78.85 mmH2O */
  { id:'hyg18_02',
    enter:function(E){ var self=this; this.s={SPin:-70,SPout:20,Vin:13.5};
      E.controls('<div class="ctrl"><label>흡인구 정압 SP_in (mmH₂O)</label><input type="range" id="s2a" min="-150" max="0" step="5" value="-70"><output id="s2ao">-70</output></div>'
        +'<div class="ctrl"><label>배출구 정압 SP_out (mmH₂O)</label><input type="range" id="s2b" min="-20" max="100" step="5" value="20"><output id="s2bo">20</output></div>'
        +'<div class="ctrl"><label>흡입측 반송속도 V_in (m/s)</label><input type="range" id="s2c" min="3" max="25" step="0.5" value="13.5"><output id="s2co">13.5</output></div>');
      E.bind('#s2a','input',function(e){ self.s.SPin=+e.target.value; document.getElementById('s2ao').textContent=e.target.value; });
      E.bind('#s2b','input',function(e){ self.s.SPout=+e.target.value; document.getElementById('s2bo').textContent=e.target.value; });
      E.bind('#s2c','input',function(e){ self.s.Vin=+e.target.value; document.getElementById('s2co').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var VPin=Math.pow(s.Vin/4.043,2);
      var FSP=(s.SPout-s.SPin)-VPin;
      var fs=FS(H,0.026,13,14);
      var y=H*0.24;
      T(ctx,'FSP = (SP_out − SP_in) − VP_in    [VP=(V/4.043)², 산업환기 표준상태]',W*0.08,y,DIM,FS(H,0.024,12,15),'left');
      y+=FS(H,0.06,22,32);
      // 덕트 흐름 다이어그램
      var dy=y+FS(H,0.02,8,12), dh=FS(H,0.08,28,40), dx1=W*0.10, dx2=W*0.62, dw=W*0.24;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; RR(ctx,dx1,dy,dw,dh,7); ctx.fill(); ctx.stroke();
      T(ctx,'흡인구 SP_in',dx1+dw/2,dy+dh*0.4,BLU,fs,'center','600');
      T(ctx,s.SPin+' mmH₂O',dx1+dw/2,dy+dh*0.75,BLU,fs,'center','700');
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=ORA; RR(ctx,dx2,dy,dw,dh,7); ctx.fill(); ctx.stroke();
      T(ctx,'배출구 SP_out',dx2+dw/2,dy+dh*0.4,ORA,fs,'center','600');
      T(ctx,s.SPout+' mmH₂O',dx2+dw/2,dy+dh*0.75,ORA,fs,'center','700');
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(dx1+dw+6,dy+dh/2); ctx.lineTo(dx2-6,dy+dh/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(dx2-6,dy+dh/2); ctx.lineTo(dx2-14,dy+dh/2-5); ctx.lineTo(dx2-14,dy+dh/2+5); ctx.fill();
      T(ctx,'송풍기(V_in='+s.Vin.toFixed(1)+'m/s)',(dx1+dw+dx2)/2,dy+dh/2-10,GRN,FS(H,0.02,11,14),'center');
      y=dy+dh+FS(H,0.06,22,30);
      var rows=[
        ['① 흡입 속도압 VP_in = (V_in/4.043)²', VPin.toFixed(3)+' mmH₂O', BLU],
        ['② 정압차 SP_out − SP_in = '+s.SPout+' − ('+s.SPin+')', (s.SPout-s.SPin).toFixed(1)+' mmH₂O', ORA],
        ['③ 송풍기 정압 FSP = ②−①', FSP.toFixed(2)+' mmH₂O', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.045,16,22);
      // FSP 게이지
      var gx=W*0.08, gw=W*0.84, gh=FS(H,0.065,22,30), gmax=150;
      ctx.fillStyle='#1c2433'; RR(ctx,gx,y,gw,gh,6); ctx.fill();
      var frac=Math.max(0,Math.min(1,FSP/gmax));
      ctx.fillStyle=GRN; RR(ctx,gx,y,gw*frac,gh,6); ctx.fill();
      T(ctx,'FSP '+FSP.toFixed(2)+' mmH₂O',gx+gw*frac+10,y+gh*0.65,GRN,FS(H,0.028,12,16),'left','700');
      E.tapHint(0,0,'슬라이더로 흡인구·배출구 정압·유속 조절',true);
      E.big('SPin '+s.SPin+'·SPout '+s.SPout+'·V '+s.Vin.toFixed(1)+' → FSP '+FSP.toFixed(2)+'mmH₂O',
            '기출 빈출유형: 송풍기 정압은 입구와 출구의 압력차에서, 입구 공기를 가속하는 데 이미 쓰인 속도압만큼을 다시 빼줍니다 — 그 속도압은 송풍기가 아니라 덕트가 만든 것이기 때문입니다.'); }
  },

  /* ── 18.3 확대관 손실·정압회복 ──
     연속식 V∝1/d², VP∝1/d⁴ → VP2=VP1×(d1/d2)⁴
     검산(d1=100mm,d2=150mm,VP1=13.8): VP2=13.8×(100/150)⁴≈2.73 mmH2O */
  { id:'hyg18_03',
    enter:function(E){ var self=this; this.s={d1:100,d2:150,VP1:13.8,R:0.75};
      E.controls('<div class="ctrl"><label>작은 덕트 직경 d₁ (mm)</label><input type="range" id="s3a" min="50" max="200" step="5" value="100"><output id="s3ao">100</output></div>'
        +'<div class="ctrl"><label>큰 덕트 직경 d₂ (mm)</label><input type="range" id="s3b" min="100" max="300" step="5" value="150"><output id="s3bo">150</output></div>'
        +'<div class="ctrl"><label>작은 덕트 속도압 VP₁ (mmH₂O)</label><input type="range" id="s3c" min="5" max="30" step="0.5" value="13.8"><output id="s3co">13.8</output></div>'
        +'<div class="ctrl"><label>압력회복계수 R (가정치)</label><input type="range" id="s3d" min="0.5" max="0.95" step="0.05" value="0.75"><output id="s3do">0.75</output></div>');
      E.bind('#s3a','input',function(e){ self.s.d1=+e.target.value; document.getElementById('s3ao').textContent=e.target.value; });
      E.bind('#s3b','input',function(e){ self.s.d2=+e.target.value; document.getElementById('s3bo').textContent=e.target.value; });
      E.bind('#s3c','input',function(e){ self.s.VP1=+e.target.value; document.getElementById('s3co').textContent=(+e.target.value).toFixed(1); });
      E.bind('#s3d','input',function(e){ self.s.R=+e.target.value; document.getElementById('s3do').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var VP2=s.VP1*Math.pow(s.d1/s.d2,4);
      var theo=s.VP1-VP2, actual=s.R*theo, loss=(1-s.R)*theo;
      var fs=FS(H,0.026,13,14);
      var y=H*0.22;
      T(ctx,'연속식 V∝1/d² → VP∝1/d⁴  ⇒  VP₂=VP₁×(d₁/d₂)⁴',W*0.08,y,DIM,FS(H,0.024,12,15),'left');
      y+=FS(H,0.05,18,26);
      // 확대관 다이어그램 (작은 원→큰 원)
      var ccy=y+FS(H,0.09,32,44), r1=FS(H,0.05,16,24)*(s.d1/200), r2=FS(H,0.05,16,24)*(s.d2/300)+FS(H,0.02,9,12);
      var cx1=W*0.16, cx2=W*0.46;
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx1,ccy-r1); ctx.lineTo(cx2,ccy-r2); ctx.moveTo(cx1,ccy+r1); ctx.lineTo(cx2,ccy+r2); ctx.stroke();
      ctx.strokeStyle=BLU; ctx.beginPath(); ctx.moveTo(cx1,ccy-r1); ctx.lineTo(cx1,ccy+r1); ctx.stroke();
      ctx.strokeStyle=ORA; ctx.beginPath(); ctx.moveTo(cx2,ccy-r2); ctx.lineTo(cx2,ccy+r2); ctx.stroke();
      ctx.lineWidth=1;
      T(ctx,'d₁='+s.d1+'mm',cx1,ccy+r1+18,BLU,fs,'center','600');
      T(ctx,'VP₁='+s.VP1.toFixed(1),cx1,ccy+r1+36,DIM,FS(H,0.02,11,14),'center');
      T(ctx,'d₂='+s.d2+'mm',cx2,ccy+r2+18,ORA,fs,'center','600');
      T(ctx,'VP₂='+VP2.toFixed(2),cx2,ccy+r2+36,DIM,FS(H,0.02,11,14),'center');
      // 계산 패널 (우측)
      var rx=W*0.58, ry=y-FS(H,0.02,8,12);
      var rows=[
        ['VP₂=VP₁×(d₁/d₂)⁴='+s.VP1.toFixed(1)+'×('+s.d1+'/'+s.d2+')⁴',VP2.toFixed(3)+' mmH₂O',ORA],
        ['이론정압회복=VP₁−VP₂',theo.toFixed(3)+' mmH₂O',BLU],
        ['실제회복=R×이론회복 (R='+s.R.toFixed(2)+')',actual.toFixed(3)+' mmH₂O',GRN],
        ['손실계수 손실=(1−R)×이론회복',loss.toFixed(3)+' mmH₂O',RED]
      ];
      var rowsH=ROW(ctx,W,H,rx,ry,W*0.36,rows);
      y=ccy+r1+55+rowsH;
      // 비교 막대: 이론 vs 실제회복 vs 손실
      var bx=W*0.08, bw=W*0.84, bh=FS(H,0.06,20,28), bmax=Math.max(theo,0.001)*1.2;
      T(ctx,'이론회복 대비 실제회복·손실 비교',bx,y-6,TXT,FS(H,0.022,11,15),'left','600');
      ctx.fillStyle=GRN; RR(ctx,bx,y,bw*Math.min(1,actual/bmax),bh*0.42,5); ctx.fill();
      T(ctx,'실제회복 '+actual.toFixed(2),bx+bw*Math.min(1,actual/bmax)+6,y+bh*0.3,GRN,FS(H,0.02,11,14),'left','600');
      ctx.fillStyle=RED; RR(ctx,bx,y+bh*0.5,bw*Math.min(1,loss/bmax),bh*0.42,5); ctx.fill();
      T(ctx,'손실 '+loss.toFixed(2),bx+bw*Math.min(1,loss/bmax)+6,y+bh*0.8,RED,FS(H,0.02,11,14),'left','600');
      E.tapHint(0,0,'슬라이더로 두 직경·속도압·압력회복계수 조절',true);
      E.big('d₁'+s.d1+'→d₂'+s.d2+'mm → VP₂ '+VP2.toFixed(2)+'mmH₂O(회복 '+actual.toFixed(2)+')',
            '기출 빈출유형: 덕트가 갑자기 넓어지면 유속이 줄어 속도압 일부가 정압으로 되돌아오는데, 완벽히 되돌아오지 못하고(압력회복계수 R, 여기선 가정치) 그만큼은 소용돌이로 흩어져 손실됩니다.'); }
  },

  /* ── 18.4 장방형 덕트 치수 ──
     A=Q/V, a:b=1:k → a=√(A/k)·b=k·a, De=1.3(ab)^0.625/(a+b)^0.25
     검산(Q=45㎥/min,V=15m/s): A=0.05㎡. k=1→a=b≈0.224m. k=3→a≈0.129·b≈0.387m */
  { id:'hyg18_04',
    enter:function(E){ var self=this; this.s={Q:45,V:15,k:1};
      E.controls('<div class="ctrl"><label>배출량 Q (m³/min)</label><input type="range" id="s4a" min="20" max="150" step="5" value="45"><output id="s4ao">45</output></div>'
        +'<div class="ctrl"><label>반송속도 V (m/s)</label><input type="range" id="s4b" min="5" max="25" step="0.5" value="15"><output id="s4bo">15</output></div>'
        +'<div class="ctrl"><label>측변비 a:b = 1:k</label><input type="range" id="s4c" min="1" max="5" step="1" value="1"><output id="s4co">1</output></div>');
      E.bind('#s4a','input',function(e){ self.s.Q=+e.target.value; document.getElementById('s4ao').textContent=e.target.value; });
      E.bind('#s4b','input',function(e){ self.s.V=+e.target.value; document.getElementById('s4bo').textContent=(+e.target.value).toFixed(1); });
      E.bind('#s4c','input',function(e){ self.s.k=+e.target.value; document.getElementById('s4co').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var A=(s.Q/60)/s.V;
      var a=Math.sqrt(A/s.k), b=s.k*a;
      var De=1.3*Math.pow(a*b,0.625)/Math.pow(a+b,0.25);
      var fs=FS(H,0.026,13,14);
      var y=H*0.22;
      T(ctx,'A = Q(m³/s) ÷ V   ·   a=√(A/k)·b=k·a (a:b=1:k)   ·   De=1.3(ab)^0.625/(a+b)^0.25',W*0.08,y,DIM,FS(H,0.021,11,14),'left');
      y+=FS(H,0.05,18,26);
      // 단면 사각형 다이어그램 (a,b 비율로 시각화)
      var maxSide=FS(H,0.24,70,120);
      var scale = maxSide/Math.max(a,b,0.05);
      var rw=a*scale, rh=b*scale, rcx=W*0.20, rcy=y+FS(H,0.16,50,80);
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=2;
      RR(ctx,rcx-rw/2,rcy-rh/2,rw,rh,4); ctx.fill(); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'a = '+a.toFixed(3)+' m',rcx,rcy-rh/2-10,BLU,fs,'center','600');
      T(ctx,'b = '+b.toFixed(3)+' m',rcx+rw/2+10+FS(H,0.02,8,12),rcy,ORA,fs,'left','600');
      // 계산 패널
      var rx=W*0.46, ry=y-FS(H,0.02,8,12);
      var rows=[
        ['단면적 A = ('+s.Q+'/60)÷'+s.V.toFixed(1), A.toFixed(4)+' m²', BLU],
        ['변 a = √(A/k) = √('+A.toFixed(4)+'/'+s.k+')', a.toFixed(3)+' m', ORA],
        ['변 b = k×a = '+s.k+'×'+a.toFixed(3), b.toFixed(3)+' m', GRN],
        ['상당직경 De=1.3(ab)^0.625/(a+b)^0.25', De.toFixed(3)+' m', PNK]
      ];
      var rowsH=ROW(ctx,W,H,rx,ry,W*0.48,rows);
      y=rcy+rh/2+55+rowsH;
      T(ctx,'측변비 1:'+s.k+' — 정사각형(k=1)에 가까울수록 둘레가 짧아 마찰손실이 작고, 길쭉할수록(k↑) 설치공간에는 유리합니다.',W*0.08,y,DIM,FS(H,0.022,11,15),'left');
      E.tapHint(0,0,'슬라이더로 풍량·반송속도·측변비 조절',true);
      E.big('Q'+s.Q+'·V'+s.V.toFixed(0)+'·비1:'+s.k+' → a'+a.toFixed(3)+'m·b'+b.toFixed(3)+'m',
            '기출 빈출유형: 원하는 풍량을 원하는 반송속도로 흘리려면 단면적이 정해집니다 — 그 단면적을 어떤 가로세로 비율(측변비)로 나눌지가 실제 덕트 모양을 결정합니다.'); }
  },

  /* ── 18.5 송풍기 소요동력 ──
     kW = Q(m³/min)×SP(mmH2O) / (6120×η)
     검산(Q=100,SP=100,η=0.6): kW=100×100/(6120×0.6)≈2.72kW */
  { id:'hyg18_05',
    enter:function(E){ var self=this; this.s={Q:100,SP:100,eta:0.6,alpha:1.15};
      E.controls('<div class="ctrl"><label>송풍량 Q (m³/min)</label><input type="range" id="s5a" min="20" max="300" step="5" value="100"><output id="s5ao">100</output></div>'
        +'<div class="ctrl"><label>정압 SP (mmH₂O)</label><input type="range" id="s5b" min="10" max="300" step="5" value="100"><output id="s5bo">100</output></div>'
        +'<div class="ctrl"><label>송풍기 효율 η</label><input type="range" id="s5c" min="0.3" max="0.9" step="0.05" value="0.6"><output id="s5co">0.60</output></div>'
        +'<div class="ctrl"><label>여유율 α</label><input type="range" id="s5d" min="1.0" max="1.5" step="0.05" value="1.15"><output id="s5do">1.15</output></div>');
      E.bind('#s5a','input',function(e){ self.s.Q=+e.target.value; document.getElementById('s5ao').textContent=e.target.value; });
      E.bind('#s5b','input',function(e){ self.s.SP=+e.target.value; document.getElementById('s5bo').textContent=e.target.value; });
      E.bind('#s5c','input',function(e){ self.s.eta=+e.target.value; document.getElementById('s5co').textContent=(+e.target.value).toFixed(2); });
      E.bind('#s5d','input',function(e){ self.s.alpha=+e.target.value; document.getElementById('s5do').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var kW=(s.Q*s.SP)/(6120*s.eta);
      var motorKW=kW*s.alpha;
      var y=H*0.25;
      T(ctx,'kW = Q(m³/min) × SP(mmH₂O) ÷ (6120 × η)   ·   전동기 용량 = kW × 여유율 α',W*0.08,y,DIM,FS(H,0.024,12,15),'left');
      y+=FS(H,0.06,22,32);
      var rows=[
        ['① 송풍기 축동력 = ('+s.Q+'×'+s.SP+') ÷ (6120×'+s.eta.toFixed(2)+')', kW.toFixed(3)+' kW', BLU],
        ['② 전동기 소요동력 = 축동력 × α('+s.alpha.toFixed(2)+')', motorKW.toFixed(3)+' kW', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.06,20,28);
      // 동력 게이지
      var gx=W*0.08, gw=W*0.84, gh=FS(H,0.075,26,38), gmax=Math.max(motorKW,1)*1.3;
      T(ctx,'전동기 소요동력 게이지',gx,y-8,TXT,FS(H,0.024,12,14),'left','600');
      ctx.fillStyle='#1c2433'; RR(ctx,gx,y,gw,gh,6); ctx.fill();
      var frac1=Math.min(1,kW/gmax), frac2=Math.min(1,motorKW/gmax);
      ctx.fillStyle=BLU; RR(ctx,gx,y,gw*frac1,gh,6); ctx.fill();
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx+gw*frac2,y-3); ctx.lineTo(gx+gw*frac2,y+gh+3); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'축동력 '+kW.toFixed(2)+'kW → 전동기 '+motorKW.toFixed(2)+'kW',gx+gw*frac2+10,y+gh*0.65,GRN,FS(H,0.025,12,14),'left','700');
      y+=gh+FS(H,0.05,18,24);
      T(ctx,'검산: '+s.Q+'×'+s.SP+'÷(6120×'+s.eta.toFixed(2)+')='+kW.toFixed(3)+'kW',gx,y,DIM,FS(H,0.022,11,14),'left');
      E.tapHint(0,0,'슬라이더로 송풍량·정압·효율·여유율 조절',true);
      E.big('Q'+s.Q+'·SP'+s.SP+'·η'+s.eta.toFixed(2)+' → '+kW.toFixed(2)+'kW(여유율 적용 '+motorKW.toFixed(2)+'kW)',
            '기출 빈출유형: 공기를 옮기는 일의 양(풍량×압력)을 효율로 나누면 축동력이 나오고, 실제 전동기는 변동·마모를 감안해 그보다 여유율만큼 더 큰 것을 고릅니다.'); }
  },

  /* ── 18.6 송풍기 성능곡선·동작점 ──
     시스템곡선 SP=k·Q² · 팬곡선 SP=SPmax−c·Q² → 교점 Qop=√(SPmax/(k+c))·SPop=k·Qop²
     검산(SPmax=100,c=0.01,k=0.02): Qop=√(100/0.03)≈57.74, SPop≈66.67 mmH2O */
  { id:'hyg18_06',
    enter:function(E){ var self=this; this.s={k:0.02,SPmax:100,c:0.01,Qdesign:70};
      E.controls('<div class="ctrl"><label>시스템 저항계수 k (댐퍼 조임)</label><input type="range" id="s6a" min="0.005" max="0.1" step="0.005" value="0.02"><output id="s6ao">0.020</output></div>'
        +'<div class="ctrl"><label>송풍기 최대정압 SPmax</label><input type="range" id="s6b" min="50" max="200" step="10" value="100"><output id="s6bo">100</output></div>'
        +'<div class="ctrl"><label>팬곡선 하강계수 c</label><input type="range" id="s6c" min="0.005" max="0.05" step="0.005" value="0.01"><output id="s6co">0.010</output></div>'
        +'<div class="ctrl"><label>설계 기대풍량 Qdesign</label><input type="range" id="s6d" min="30" max="120" step="5" value="70"><output id="s6do">70</output></div>');
      E.bind('#s6a','input',function(e){ self.s.k=+e.target.value; document.getElementById('s6ao').textContent=(+e.target.value).toFixed(3); });
      E.bind('#s6b','input',function(e){ self.s.SPmax=+e.target.value; document.getElementById('s6bo').textContent=e.target.value; });
      E.bind('#s6c','input',function(e){ self.s.c=+e.target.value; document.getElementById('s6co').textContent=(+e.target.value).toFixed(3); });
      E.bind('#s6d','input',function(e){ self.s.Qdesign=+e.target.value; document.getElementById('s6do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Qop=Math.sqrt(s.SPmax/(s.k+s.c));
      var SPop=s.k*Qop*Qop;
      var Qfanzero=Math.sqrt(s.SPmax/s.c);           // 팬곡선이 0이 되는 풍량(참고 스케일용)
      var Qaxis=Math.max(Qfanzero,s.Qdesign)*1.1;
      var SPaxis=s.SPmax*1.15;
      var deficit=s.Qdesign-Qop, deficitPct=(deficit/s.Qdesign)*100;
      var y=H*0.20;
      T(ctx,'시스템곡선 SP=k·Q²   ·   팬곡선 SP=SPmax−c·Q²   ·   교점(동작점) SP가 같아지는 지점',W*0.08,y,DIM,FS(H,0.022,11,15),'left');
      y+=FS(H,0.04,14,20);
      // 플롯 영역
      var px0=W*0.10, py0=y+FS(H,0.02,8,12), pw=W*0.62, ph=FS(H,0.40,150,240);
      function px(q){ return px0+Math.min(q,Qaxis)/Qaxis*pw; }
      function py(sp){ return py0+ph-Math.max(0,Math.min(sp,SPaxis))/SPaxis*ph; }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,py0); ctx.lineTo(px0,py0+ph); ctx.lineTo(px0+pw,py0+ph); ctx.stroke();
      T(ctx,'Q (m³/min) →',px0+pw*0.5,py0+ph+FS(H,0.035,14,20),DIM,FS(H,0.02,11,14),'center');
      // 시스템곡선 (댐퍼 조임) — SPaxis를 넘으면 clamp로 평평해 보이는 착시를 막기 위해 정확한 교차점에서 선을 끊음
      ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.beginPath();
      for(var q=0;q<=Qaxis;q+=Qaxis/60){ var sp=s.k*q*q;
        if(sp>SPaxis){ var qCross=Math.sqrt(SPaxis/s.k); ctx.lineTo(px(qCross),py0); break; }
        var xx=px(q),yy=py(sp); if(q===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke();
      // 팬 성능곡선
      ctx.strokeStyle=BLU; ctx.beginPath();
      for(q=0;q<=Qaxis;q+=Qaxis/60){ var spf=s.SPmax-s.c*q*q; if(spf<0)break; var xx2=px(q),yy2=py(spf); if(q===0)ctx.moveTo(xx2,yy2); else ctx.lineTo(xx2,yy2); }
      ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'팬 성능곡선',px0+pw*0.78,py(s.SPmax-s.c*Math.pow(Qaxis*0.78,2))-8,BLU,FS(H,0.02,11,14),'left','600');
      T(ctx,'시스템곡선(댐퍼)',px0+pw*0.42,py(s.k*Math.pow(Qaxis*0.42,2))+16,RED,FS(H,0.02,11,14),'left','600');
      // 동작점
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px(Qop),py(SPop),FS(H,0.012,6,9),0,Math.PI*2); ctx.fill();
      T(ctx,'동작점',px(Qop)+10,py(SPop)-8,GRN,FS(H,0.023,12,15),'left','700');
      // 설계 기대풍량 점선
      ctx.strokeStyle=AMB; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(px(s.Qdesign),py0); ctx.lineTo(px(s.Qdesign),py0+ph); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'설계기대 Q='+s.Qdesign,px(s.Qdesign),py0-6,AMB,FS(H,0.02,11,14),'center');
      // 계산 패널 (우측)
      var rx=W*0.76, ry=py0+FS(H,0.02,8,12);
      var rows=[
        ['동작점 Qop=√(SPmax/(k+c))',Qop.toFixed(1)+' m³/min',GRN],
        ['동작점 SPop=k×Qop²',SPop.toFixed(1)+' mmH₂O',GRN],
        ['설계기대 대비 부족분',deficit.toFixed(1)+' m³/min ('+deficitPct.toFixed(1)+'%)',RED]
      ];
      ROW(ctx,W,H,rx,ry,W*0.30,rows);
      y=py0+ph+FS(H,0.09,32,44);
      T(ctx,'댐퍼를 조일수록(k↑) 시스템곡선이 가팔라져 동작점이 좌상향(풍량↓·정압↑) — 저항을 과소평가하면 실제 송풍량이 설계보다 부족해집니다.',W*0.08,y,DIM,FS(H,0.022,11,15),'left');
      E.tapHint(0,0,'슬라이더로 저항계수·최대정압·하강계수·설계풍량 조절',true);
      E.big('k'+s.k.toFixed(3)+' → 동작점 Q'+Qop.toFixed(1)+'·SP'+SPop.toFixed(1)+'(부족 '+deficitPct.toFixed(0)+'%)',
            '기출 빈출유형: 송풍기가 낼 수 있는 곡선과 배관이 요구하는 곡선이 만나는 단 한 점에서만 실제로 동작합니다 — 배관 저항을 과소평가해 설계하면 실제 풍량은 늘 예상보다 적게 나옵니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
