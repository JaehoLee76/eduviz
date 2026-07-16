/* 산업위생기술사 제17장 — 기출 계산 은행 Ⅰ : 농도·환기·후드 (동작만. 텍스트=content/hyg17.json)
   출처: 실제 기출 계산문제(제119회 이내) 6개 유형을 대표 예시로 재구성. 풀이(해설·시각화)는 신규 작성.
   골든룰: 표시 수치는 전부 draw에서 실계산(슬라이더값으로부터 매 프레임). 검산값은 각 블록 주석 참조. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }

  var scenes=[

  /* ── 17.1 농도 단위환산 — mg/m³ ↔ ppm ↔ ppb ↔ ppt ↔ % ──
     검산(기본값 190mg/m³, M=92 톨루엔): ppm=190×24.45/92≈50.49 */
  { id:'hyg17_01',
    enter:function(E){ var self=this; this.s={mgm3:190, M:92};
      E.controls('<div class="ctrl"><label>공기 중 농도 (mg/m³)</label><input type="range" id="r1a" min="20" max="800" step="5" value="190"><output id="r1ao">190</output></div>'
        +'<div class="ctrl"><label>분자량 M (g/mol)</label><input type="range" id="r1b" min="20" max="300" step="1" value="92"><output id="r1bo">92</output></div>');
      E.bind('#r1a','input',function(e){ self.s.mgm3=+e.target.value; document.getElementById('r1ao').textContent=e.target.value; });
      E.bind('#r1b','input',function(e){ self.s.M=+e.target.value; document.getElementById('r1bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ppm=s.mgm3*24.45/s.M, pct=ppm/10000, ppb=ppm*1000, ppt=ppm*1e6;
      var fs=FS(H,0.027,11,15), y=H*0.25;                 // 누적 커서
      T(ctx,'ppm = mg/m³ × 24.45 ÷ M  (25℃ · 1atm 표준상태, 몰부피 24.45 L/mol)',W*0.08,y,DIM,FS(H,0.025,11,14),'left');
      y+=FS(H,0.055,20,30);
      // 입력 카드 → ppm 카드
      var cw=W*0.30, ch=FS(H,0.085,32,48), cx1=W*0.08, cx2=W*0.42;
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; RR(ctx,cx1,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,s.mgm3+' mg/m³',cx1+cw/2,y+ch*0.42,BLU,FS(H,0.03,13,17),'center','700');
      T(ctx,'M='+s.M+' g/mol',cx1+cw/2,y+ch*0.72,DIM,FS(H,0.021,9,12),'center');
      // 화살표
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx1+cw+8,y+ch/2); ctx.lineTo(cx2-8,y+ch/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(cx2-8,y+ch/2); ctx.lineTo(cx2-16,y+ch/2-5); ctx.lineTo(cx2-16,y+ch/2+5); ctx.fill();
      T(ctx,'×24.45÷M',(cx1+cw+cx2)/2,y+ch/2-10,ORA,FS(H,0.02,9,12),'center');
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=ORA; RR(ctx,cx2,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,ppm.toFixed(2)+' ppm',cx2+cw/2,y+ch*0.42,ORA,FS(H,0.032,14,18),'center','700');
      T(ctx,'기체상 부피비',cx2+cw/2,y+ch*0.72,DIM,FS(H,0.021,9,12),'center');
      y+=ch+FS(H,0.06,22,32);
      // 하위 3단위 카드 (ppm 기준 배율)
      var cards=[ ['%','÷ 10,000',pct.toExponential(3)+' %',GRN], ['ppb','× 1,000',ppb.toFixed(1)+' ppb',PNK], ['ppt','× 1,000,000',ppt.toLocaleString(undefined,{maximumFractionDigits:0})+' ppt',AMB] ];
      var gw=W*0.27, gap=W*0.02, gx=W*0.08;
      for(var i=0;i<3;i++){ var bx=gx+i*(gw+gap), bh=FS(H,0.09,32,48);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=cards[i][3]; RR(ctx,bx,y,gw,bh,8); ctx.fill(); ctx.stroke();
        T(ctx,cards[i][0]+' ( '+cards[i][1]+' )',bx+gw/2,y+bh*0.32,DIM,FS(H,0.02,9,12),'center');
        T(ctx,cards[i][2],bx+gw/2,y+bh*0.68,cards[i][3],FS(H,0.026,11,15),'center','700'); }
      y+=FS(H,0.09,32,48)+FS(H,0.045,16,24);
      T(ctx,'검산: '+s.mgm3+' × 24.45 ÷ '+s.M+' = '+ppm.toFixed(3)+' ppm',W*0.08,y,DIM,FS(H,0.023,10,13),'left');
      E.tapHint(0,0,'슬라이더로 농도·분자량 조절',true);
      E.big(s.mgm3+' mg/m³ (M='+s.M+') → '+ppm.toFixed(2)+' ppm',
            '기출 유형(빈출): 실험실은 무게(mg/m³)로 재지만 법령 노출기준은 대부분 부피비(ppm)로 적혀 있습니다 — 분자량이 다르면 같은 무게도 다른 ppm이 됩니다.'); }
  },

  /* ── 17.2 전체환기량(희석환기) ──
     검산(G=100g/hr, C=1ppm, M=78 벤젠, K=3): Q0≈522.4 m³/min, Q(K=3)≈1567.3 m³/min */
  { id:'hyg17_02',
    enter:function(E){ var self=this; this.s={G:100, C:1, M:78, K:3};
      E.controls('<div class="ctrl"><label>증기 발생량 G (g/hr)</label><input type="range" id="r2a" min="20" max="300" step="5" value="100"><output id="r2ao">100</output></div>'
        +'<div class="ctrl"><label>유지농도 C (ppm)</label><input type="range" id="r2b" min="0.5" max="10" step="0.5" value="1"><output id="r2bo">1</output></div>'
        +'<div class="ctrl"><label>분자량 M (g/mol)</label><input type="range" id="r2c" min="40" max="150" step="1" value="78"><output id="r2co">78</output></div>'
        +'<div class="ctrl"><label>안전계수 K</label><input type="range" id="r2d" min="1" max="10" step="1" value="3"><output id="r2do">3</output></div>');
      E.bind('#r2a','input',function(e){ self.s.G=+e.target.value; document.getElementById('r2ao').textContent=e.target.value; });
      E.bind('#r2b','input',function(e){ self.s.C=+e.target.value; document.getElementById('r2bo').textContent=e.target.value; });
      E.bind('#r2c','input',function(e){ self.s.M=+e.target.value; document.getElementById('r2co').textContent=e.target.value; });
      E.bind('#r2d','input',function(e){ self.s.K=+e.target.value; document.getElementById('r2do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Gmgmin=s.G*1000/60;                       // g/hr → mg/min
      var Cmg=s.C*s.M/24.45;                         // ppm → mg/m³
      var Q0=Gmgmin/Cmg;                              // 안전계수 미적용 필요환기량
      var Q=Q0*s.K;                                   // 안전계수 적용
      var fs=FS(H,0.027,11,15), y=H*0.26;
      T(ctx,'Q(m³/min) = G(mg/min) ÷ C(mg/m³)   [C = ppm × M ÷ 24.45]',W*0.08,y,DIM,FS(H,0.025,11,14),'left');
      y+=FS(H,0.06,22,32);
      var rows=[
        ['① G = '+s.G+' g/hr = '+s.G+'×1000÷60', Gmgmin.toFixed(1)+' mg/min', BLU],
        ['② C = '+s.C+' ppm × '+s.M+' ÷ 24.45', Cmg.toFixed(3)+' mg/m³', BLU],
        ['③ 필요환기량 Q₀ = G ÷ C (안전계수 미적용)', Q0.toFixed(1)+' m³/min', ORA],
        ['④ 실제 환기량 Q = Q₀ × 안전계수 K('+s.K+')', Q.toFixed(1)+' m³/min', GRN]
      ];
      var lh=FS(H,0.062,22,32);
      for(var i=0;i<rows.length;i++){ var yy=y+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,W*0.08-8,yy-lh*0.42,W*0.84,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],W*0.08,yy-FS(H,0.006,2,4),DIM,FS(H,0.023,10,13),'left');
        T(ctx,rows[i][1],W*0.08,yy+FS(H,0.028,12,16),rows[i][2],FS(H,0.028,12,16),'left','700'); }
      y+=lh*rows.length+FS(H,0.05,18,26);
      // Q0 vs Q 막대 비교
      var bx=W*0.08, bw=W*0.84, bh=FS(H,0.075,26,38), qmax=Math.max(Q,Q0)*1.15;
      function qx(v){ return bx+Math.min(v,qmax)/qmax*bw; }
      T(ctx,'필요환기량 비교 (K배 안전계수 적용 전후)',bx,y-8,TXT,FS(H,0.024,10,14),'left','600');
      ctx.fillStyle=ORA; RR(ctx,bx,y,qx(Q0)-bx,bh*0.42,5); ctx.fill();
      T(ctx,'Q₀ '+Q0.toFixed(1),qx(Q0)+6,y+bh*0.3,ORA,FS(H,0.022,10,13),'left','600');
      ctx.fillStyle=GRN; RR(ctx,bx,y+bh*0.5,qx(Q)-bx,bh*0.42,5); ctx.fill();
      T(ctx,'Q '+Q.toFixed(1),Math.min(qx(Q)+6,bx+bw-2),y+bh*0.8,GRN,FS(H,0.022,10,13),'left','600');
      E.tapHint(0,0,'슬라이더로 발생량·농도·분자량·안전계수 조절',true);
      E.big('G '+s.G+'g/hr·C '+s.C+'ppm → Q₀ '+Q0.toFixed(1)+' m³/min (K='+s.K+'배 시 '+Q.toFixed(1)+')',
            '기출 유형(빈출): 오염물질이 나오는 속도(질량/시간)를 원하는 농도(부피비)로 나누면, 그 농도를 유지하기 위해 매분 갈아치워야 할 공기량이 나옵니다.'); }
  },

  /* ── 17.3 시간당 공기치환(ACH) ──
     검산(V=400㎥,N=30,Ci=0.07%,Co=0.03%,1인 21L/hr): Q=1575㎥/hr, ACH≈3.94회 */
  { id:'hyg17_03',
    enter:function(E){ var self=this; this.s={N:30, V:400, Ci:0.07, Co:0.03};
      E.controls('<div class="ctrl"><label>재실 인원 N (명)</label><input type="range" id="r3a" min="10" max="60" step="1" value="30"><output id="r3ao">30</output></div>'
        +'<div class="ctrl"><label>실용적 V (m³)</label><input type="range" id="r3b" min="100" max="1000" step="10" value="400"><output id="r3bo">400</output></div>'
        +'<div class="ctrl"><label>CO₂ 서한도 Ci (%)</label><input type="range" id="r3c" min="0.05" max="0.15" step="0.01" value="0.07"><output id="r3co">0.07</output></div>'
        +'<div class="ctrl"><label>외기 CO₂ Co (%)</label><input type="range" id="r3d" min="0.01" max="0.05" step="0.01" value="0.03"><output id="r3do">0.03</output></div>');
      E.bind('#r3a','input',function(e){ self.s.N=+e.target.value; document.getElementById('r3ao').textContent=e.target.value; });
      E.bind('#r3b','input',function(e){ self.s.V=+e.target.value; document.getElementById('r3bo').textContent=e.target.value; });
      E.bind('#r3c','input',function(e){ self.s.Ci=+e.target.value; document.getElementById('r3co').textContent=(+e.target.value).toFixed(2); });
      E.bind('#r3d','input',function(e){ self.s.Co=+e.target.value; document.getElementById('r3do').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var perCap=21;                                  // 1인당 CO2 배출량 L/hr (표준값)
      var G_L=s.N*perCap, G_m3=G_L/1000;
      var diff=(s.Ci-s.Co)/100;
      var over = diff>0;
      var Q = over? G_m3/diff : 0;
      var ACH = over? Q/s.V : 0;
      var y=H*0.25;
      T(ctx,'Q(m³/hr) = 발생량 G ÷ (Ci−Co)   ·   ACH(회/hr) = Q ÷ V',W*0.08,y,DIM,FS(H,0.025,11,14),'left');
      y+=FS(H,0.055,20,30);
      var rows=[
        ['① CO₂ 발생량 G = '+s.N+'명 × '+perCap+'L/hr÷1000', G_m3.toFixed(3)+' m³/hr', BLU],
        ['② 서한도차 Ci−Co = '+s.Ci.toFixed(2)+'% − '+s.Co.toFixed(2)+'%', diff.toFixed(4)+' (분율)', BLU],
        ['③ 필요환기량 Q = G ÷ (Ci−Co)', over? Q.toFixed(1)+' m³/hr' : '서한도 이하 — 환기 불필요', over?ORA:RED],
        ['④ 시간당 공기치환 ACH = Q ÷ V('+s.V+'m³)', over? ACH.toFixed(2)+' 회/hr' : '—', over?GRN:RED]
      ];
      var lh=FS(H,0.062,22,32);
      for(var i=0;i<rows.length;i++){ var yy=y+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,W*0.08-8,yy-lh*0.42,W*0.84,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],W*0.08,yy-FS(H,0.006,2,4),DIM,FS(H,0.023,10,13),'left');
        T(ctx,rows[i][1],W*0.08,yy+FS(H,0.028,12,16),rows[i][2],FS(H,0.028,12,16),'left','700'); }
      y+=lh*rows.length+FS(H,0.055,20,28);
      // ACH 게이지
      var bx=W*0.08, bw=W*0.84, bh=FS(H,0.08,28,40), achMax=12;
      T(ctx,'시간당 공기치환 횟수 게이지 (참고: 사무공간 통상 4~10회/hr)',bx,y-8,TXT,FS(H,0.024,10,14),'left','600');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,y,bw,bh,6); ctx.fill();
      var frac=Math.max(0,Math.min(1,ACH/achMax));
      ctx.fillStyle=over?(ACH>=4?GRN:RED):DIM; RR(ctx,bx,y,bw*frac,bh,6); ctx.fill();
      T(ctx,over? ACH.toFixed(2)+' 회/hr' : '0 회/hr',bx+bw*frac+10,y+bh*0.65,over?(ACH>=4?GRN:RED):DIM,FS(H,0.032,13,18),'left','700');
      E.tapHint(0,0,'슬라이더로 인원·용적·서한도 조절',true);
      E.big('N '+s.N+'명·V '+s.V+'m³ → Q '+(over?Q.toFixed(1):'0')+'m³/hr · ACH '+(over?ACH.toFixed(2):'0')+'회',
            '기출 유형(빈출): 사람이 내뿜는 CO₂ 발생량을, 실내외 농도차가 흡수할 수 있는 만큼 나누면 필요한 환기량이 나오고, 그걸 방 부피로 나누면 시간당 몇 번 공기를 바꿔야 하는지가 나옵니다.'); }
  },

  /* ── 17.4 슬롯후드 필요환기량 · 속도압 ──
     검산(L=110cm,W=15cm,V=1.2m/s,X=30cm, 플랜지 부착): Q≈61.78 m³/min, VP≈2.38 mmH2O */
  { id:'hyg17_04',
    enter:function(E){ var self=this; this.s={Lcm:110, Wcm:15, Vc:1.2, Xcm:30};
      E.controls('<div class="ctrl"><label>슬롯 길이 L (cm)</label><input type="range" id="r4a" min="50" max="200" step="5" value="110"><output id="r4ao">110</output></div>'
        +'<div class="ctrl"><label>슬롯 폭 W (cm)</label><input type="range" id="r4b" min="5" max="40" step="1" value="15"><output id="r4bo">15</output></div>'
        +'<div class="ctrl"><label>제어풍속 V (m/s)</label><input type="range" id="r4c" min="0.3" max="3" step="0.1" value="1.2"><output id="r4co">1.2</output></div>'
        +'<div class="ctrl"><label>제어거리 X (cm)</label><input type="range" id="r4d" min="10" max="80" step="5" value="30"><output id="r4do">30</output></div>');
      E.bind('#r4a','input',function(e){ self.s.Lcm=+e.target.value; document.getElementById('r4ao').textContent=e.target.value; });
      E.bind('#r4b','input',function(e){ self.s.Wcm=+e.target.value; document.getElementById('r4bo').textContent=e.target.value; });
      E.bind('#r4c','input',function(e){ self.s.Vc=+e.target.value; document.getElementById('r4co').textContent=(+e.target.value).toFixed(1); });
      E.bind('#r4d','input',function(e){ self.s.Xcm=+e.target.value; document.getElementById('r4do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var L=s.Lcm/100, Wd=s.Wcm/100, X=s.Xcm/100;      // m 환산
      var Q = 60*2.6*L*s.Vc*X;                          // 플랜지 부착 슬롯: Q(m³/min)=60×2.6×L×V×X
      var Vslot = (Q/60)/(L*Wd);                        // 슬롯 내 유속
      var VP = Math.pow(Vslot/4.043,2);                 // 속도압 mmH2O
      var fs=FS(H,0.026,11,14);
      // 후드 다이어그램 (좌측)
      var wallX=W*0.30, wallY0=H*0.28, wallY1=H*0.60;
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(wallX,wallY0); ctx.lineTo(wallX,wallY1); ctx.stroke(); ctx.lineWidth=1;
      var slotY0=(wallY0+wallY1)/2-FS(H,0.03,10,16), slotY1=(wallY0+wallY1)/2+FS(H,0.03,10,16);
      ctx.fillStyle=AMB; ctx.fillRect(wallX-5,slotY0,10,slotY1-slotY0);
      T(ctx,'슬롯 L='+s.Lcm+'cm·W='+s.Wcm+'cm',wallX,wallY0-14,AMB,FS(H,0.021,9,12),'center');
      // 플랜지(벽 상하 돌출)
      ctx.strokeStyle=DIM; ctx.beginPath(); ctx.moveTo(wallX-W*0.05,wallY0); ctx.lineTo(wallX,wallY0); ctx.moveTo(wallX-W*0.05,wallY1); ctx.lineTo(wallX,wallY1); ctx.stroke();
      T(ctx,'플랜지',wallX-W*0.05,wallY1+FS(H,0.03,12,17),DIM,FS(H,0.02,9,11),'left');
      // 오염원까지 거리 X
      var srcX=wallX+W*0.16;
      ctx.strokeStyle=BLU; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(wallX,(slotY0+slotY1)/2); ctx.lineTo(srcX,(slotY0+slotY1)/2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(srcX,(slotY0+slotY1)/2,FS(H,0.01,4,7),0,Math.PI*2); ctx.fill();
      T(ctx,'X='+s.Xcm+'cm',(wallX+srcX)/2,(slotY0+slotY1)/2-10,BLU,fs,'center','600');
      T(ctx,'제어풍속 V='+s.Vc.toFixed(1)+'m/s',srcX,(slotY0+slotY1)/2+22,GRN,fs,'center','600');
      // 계산 패널 (우측/하단, 누적커서)
      var rx=W*0.60, ry=H*0.30, lh=FS(H,0.058,20,28);
      var rows=[
        ['필요환기량 Q=60×2.6×L×V×X','Q='+Q.toFixed(2)+' m³/min',ORA],
        ['슬롯유속 Vs=(Q/60)÷(L×W)',Vslot.toFixed(2)+' m/s',BLU],
        ['속도압 VP=(Vs/4.043)²',VP.toFixed(3)+' mmH₂O',GRN]
      ];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-8,yy-lh*0.42,W*0.34,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy-FS(H,0.005,2,4),DIM,FS(H,0.021,9,12),'left');
        T(ctx,rows[i][1],rx,yy+FS(H,0.026,11,15),rows[i][2],FS(H,0.026,11,15),'left','700'); }
      // 하단 전체 폭 요약 행
      var by=H*0.72, bh=FS(H,0.06,22,30);
      T(ctx,'2.6 = 플랜지 부착 슬롯형 계수(플랜지 없으면 3.7) · 60 = m³/s→m³/min 환산',W*0.08,by,DIM,FS(H,0.022,10,13),'left');
      E.tapHint(0,0,'슬라이더로 길이·폭·풍속·거리 조절',true);
      E.big('L'+s.Lcm+'·V'+s.Vc.toFixed(1)+'·X'+s.Xcm+' → Q '+Q.toFixed(1)+'m³/min · VP '+VP.toFixed(2)+'mmH₂O',
            '기출 유형(빈출): 슬롯 후드는 좁고 긴 틈이 공기를 빨아들이는 선(線) 흡인원 — 플랜지가 뒤쪽 공기를 막아주는 만큼 계수 2.6(무플랜지 3.7)으로 필요환기량이 줄어듭니다.'); }
  },

  /* ── 17.5 후드 정압 · 유입손실 ──
     검산(Q=10㎥/min,d=200mm,F=0.40): Vd≈5.31m/s, VP≈1.72, He≈0.69, SP≈2.41 mmH2O */
  { id:'hyg17_05',
    enter:function(E){ var self=this; this.s={Q:10, dmm:200, F:0.40};
      E.controls('<div class="ctrl"><label>소요풍량 Q (m³/min)</label><input type="range" id="r5a" min="5" max="30" step="1" value="10"><output id="r5ao">10</output></div>'
        +'<div class="ctrl"><label>덕트 직경 d (mm)</label><input type="range" id="r5b" min="100" max="400" step="10" value="200"><output id="r5bo">200</output></div>'
        +'<div class="ctrl"><label>유입손실계수 F</label><input type="range" id="r5c" min="0.1" max="1.0" step="0.05" value="0.40"><output id="r5co">0.40</output></div>');
      E.bind('#r5a','input',function(e){ self.s.Q=+e.target.value; document.getElementById('r5ao').textContent=e.target.value; });
      E.bind('#r5b','input',function(e){ self.s.dmm=+e.target.value; document.getElementById('r5bo').textContent=e.target.value; });
      E.bind('#r5c','input',function(e){ self.s.F=+e.target.value; document.getElementById('r5co').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var d=s.dmm/1000;                                 // m
      var A=Math.PI*Math.pow(d/2,2);                     // 단면적 m²
      var Vd=(s.Q/60)/A;                                  // 덕트유속 m/s
      var VP=Math.pow(Vd/4.043,2);                        // 속도압
      var He=s.F*VP;                                       // 유입손실
      var SP=VP+He;                                        // 후드정압
      var fs=FS(H,0.026,11,14);
      // 덕트 단면 원 (반지름은 슬라이더 d 비례, 화면상 시각적 스케일)
      var ccx=W*0.20, ccy=H*0.40, rMax=FS(H,0.14,45,70), rr=rMax*(s.dmm/400);
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(ccx,ccy,rr,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'d='+s.dmm+'mm',ccx,ccy+rMax+FS(H,0.035,14,20),BLU,fs,'center','600');
      T(ctx,'A='+A.toFixed(4)+'m²',ccx,ccy+rMax+FS(H,0.06,22,30),DIM,FS(H,0.021,9,12),'center');
      // 유속 화살표
      ctx.strokeStyle=GRN; ctx.beginPath(); ctx.moveTo(ccx-rMax-W*0.02,ccy); ctx.lineTo(ccx+rMax+W*0.02,ccy); ctx.stroke();
      T(ctx,'Vd='+Vd.toFixed(2)+'m/s',ccx,ccy-rMax-10,GRN,fs,'center','600');
      // 계산 패널
      var rx=W*0.44, ry=H*0.28, lh=FS(H,0.058,20,28);
      var rows=[
        ['단면적 A=π(d/2)² = π×('+s.dmm+'/2mm)²',A.toFixed(4)+' m²',BLU],
        ['덕트유속 Vd=(Q/60)÷A = ('+s.Q+'/60)÷'+A.toFixed(4),Vd.toFixed(2)+' m/s',GRN],
        ['속도압 VP=(Vd/4.043)²',VP.toFixed(3)+' mmH₂O',ORA],
        ['후드유입손실 He=F×VP = '+s.F.toFixed(2)+'×'+VP.toFixed(3),He.toFixed(3)+' mmH₂O',PNK],
        ['후드정압 SP=VP+He',SP.toFixed(3)+' mmH₂O',RED]
      ];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-8,yy-lh*0.42,W*0.48,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy-FS(H,0.005,2,4),DIM,FS(H,0.021,9,12),'left');
        T(ctx,rows[i][1],rx,yy+FS(H,0.026,11,15),rows[i][2],FS(H,0.026,11,15),'left','700'); }
      // SP 게이지
      var gy=H*0.80, gx=W*0.08, gw=W*0.84, gh=FS(H,0.065,22,30), spMax=6;
      ctx.fillStyle='#1c2433'; RR(ctx,gx,gy,gw,gh,6); ctx.fill();
      var frac=Math.max(0,Math.min(1,SP/spMax));
      ctx.fillStyle=RED; RR(ctx,gx,gy,gw*frac,gh,6); ctx.fill();
      T(ctx,'후드정압(SP) '+SP.toFixed(2)+' mmH₂O — 송풍기가 이겨내야 할 압력',gx+gw*frac+10,gy+gh*0.65,RED,FS(H,0.026,11,15),'left','700');
      E.tapHint(0,0,'슬라이더로 풍량·직경·손실계수 조절',true);
      E.big('Q'+s.Q+'·d'+s.dmm+'mm·F'+s.F.toFixed(2)+' → SP '+SP.toFixed(2)+' mmH₂O',
            '기출 유형(빈출): 덕트가 좁을수록 유속이 빨라져 속도압이 커지고, 후드 입구에서 그중 일부(F배)를 손실로 잃습니다 — 이 둘을 더한 값이 송풍기가 감당해야 할 후드정압입니다.'); }
  },

  /* ── 17.6 누적오차 · 최소 시료채취시간 ──
     검산(3/2/5/12%): √(3²+2²+5²+12²)≈13.49% | (C=0.05,LOQ=0.01,Q=2.5L/min): t≈80분 */
  { id:'hyg17_06',
    enter:function(E){ var self=this; this.s={e1:3,e2:2,e3:5,e4:12,C:0.05,LOQ:0.01};
      E.controls('<div class="ctrl"><label>전처리 오차 (%)</label><input type="range" id="r6a" min="0" max="20" step="1" value="3"><output id="r6ao">3</output></div>'
        +'<div class="ctrl"><label>표준액 오차 (%)</label><input type="range" id="r6b" min="0" max="20" step="1" value="2"><output id="r6bo">2</output></div>'
        +'<div class="ctrl"><label>분석 오차 (%)</label><input type="range" id="r6c" min="0" max="20" step="1" value="5"><output id="r6co">5</output></div>'
        +'<div class="ctrl"><label>시료포집 오차 (%)</label><input type="range" id="r6d" min="0" max="20" step="1" value="12"><output id="r6do">12</output></div>'
        +'<div class="ctrl"><label>노출농도 C (mg/m³)</label><input type="range" id="r6e" min="0.01" max="0.2" step="0.01" value="0.05"><output id="r6eo">0.05</output></div>'
        +'<div class="ctrl"><label>정량한계 LOQ (mg)</label><input type="range" id="r6f" min="0.005" max="0.05" step="0.005" value="0.01"><output id="r6fo">0.01</output></div>');
      E.bind('#r6a','input',function(e){ self.s.e1=+e.target.value; document.getElementById('r6ao').textContent=e.target.value; });
      E.bind('#r6b','input',function(e){ self.s.e2=+e.target.value; document.getElementById('r6bo').textContent=e.target.value; });
      E.bind('#r6c','input',function(e){ self.s.e3=+e.target.value; document.getElementById('r6co').textContent=e.target.value; });
      E.bind('#r6d','input',function(e){ self.s.e4=+e.target.value; document.getElementById('r6do').textContent=e.target.value; });
      E.bind('#r6e','input',function(e){ self.s.C=+e.target.value; document.getElementById('r6eo').textContent=(+e.target.value).toFixed(2); });
      E.bind('#r6f','input',function(e){ self.s.LOQ=+e.target.value; document.getElementById('r6fo').textContent=(+e.target.value).toFixed(3); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var totErr=Math.sqrt(s.e1*s.e1+s.e2*s.e2+s.e3*s.e3+s.e4*s.e4);
      var Qpump=2.5;                                    // 호흡성분진 사이클론 표준 채취유량 L/min (가정)
      var Vmin=s.LOQ/s.C*1000;                            // L
      var tmin=Vmin/Qpump;                                 // min
      var y=H*0.24;
      T(ctx,'① 누적오차 = √(e₁²+e₂²+e₃²+e₄²)',W*0.08,y,TXT,FS(H,0.027,11,15),'left','600');
      y+=FS(H,0.045,16,22);
      // 4개 오차 막대
      var bx=W*0.08, bw=W*0.84, bh=FS(H,0.032,11,16), emax=20;
      var errs=[['전처리',s.e1,BLU],['표준액',s.e2,GRN],['분석',s.e3,ORA],['포집',s.e4,PNK]];
      for(var i=0;i<4;i++){ var yy=y+i*(bh+6);
        T(ctx,errs[i][0],bx,yy+bh*0.75,DIM,FS(H,0.02,9,11.5),'left');
        ctx.fillStyle='#1c2433'; RR(ctx,bx+W*0.09,yy,bw-W*0.09,bh,4); ctx.fill();
        ctx.fillStyle=errs[i][2]; RR(ctx,bx+W*0.09,yy,(bw-W*0.09)*Math.min(1,errs[i][1]/emax),bh,4); ctx.fill();
        T(ctx,errs[i][1]+'%',bx+W*0.09+(bw-W*0.09)*Math.min(1,errs[i][1]/emax)+6,yy+bh*0.78,errs[i][2],FS(H,0.02,9,11.5),'left','700'); }
      y+=4*(bh+6)+FS(H,0.02,8,12);
      ctx.fillStyle='rgba(255,255,255,0.04)'; RR(ctx,bx-6,y,bw+12,FS(H,0.045,16,22),7); ctx.fill();
      T(ctx,'√('+s.e1+'²+'+s.e2+'²+'+s.e3+'²+'+s.e4+'²) = '+totErr.toFixed(2)+' %',bx+bw/2,y+FS(H,0.032,12,16),RED,FS(H,0.028,12,16),'center','700');
      y+=FS(H,0.045,16,22)+FS(H,0.05,18,26);

      T(ctx,'② 최소 시료채취시간 (호흡성분진, 채취유량 '+Qpump+' L/min 가정)',bx,y,TXT,FS(H,0.027,11,15),'left','600');
      y+=FS(H,0.05,18,26);
      var rows=[
        ['최소 채취공기량 Vmin = LOQ÷C×1000 = '+s.LOQ.toFixed(3)+'÷'+s.C.toFixed(2)+'×1000',Vmin.toFixed(1)+' L',BLU],
        ['최소 채취시간 t = Vmin÷Qpump = '+Vmin.toFixed(1)+'÷'+Qpump,tmin.toFixed(1)+' 분',GRN]
      ];
      var lh=FS(H,0.055,20,26);
      for(i=0;i<rows.length;i++){ var yy2=y+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,bx-8,yy2-lh*0.42,bw+16,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],bx,yy2-FS(H,0.005,2,4),DIM,FS(H,0.021,9,12),'left');
        T(ctx,rows[i][1],bx,yy2+FS(H,0.028,12,16),rows[i][2],FS(H,0.028,12,16),'left','700'); }
      E.tapHint(0,0,'슬라이더로 오차·노출농도·정량한계 조절',true);
      E.big('누적오차 '+totErr.toFixed(1)+'% · 최소 채취시간 '+tmin.toFixed(1)+'분',
            '기출 유형(빈출): 여러 단계 오차는 더하지 않고 제곱합의 제곱근(합성표준불확도)으로 합칩니다. 채취시간은 실험실이 잴 수 있는 최소량(LOQ)을 채우는 데 필요한 시간입니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
