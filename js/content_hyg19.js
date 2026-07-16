/* 산업위생기술사 제19장 — 기출 계산 은행 Ⅲ : 소음·측정 (동작만. 텍스트=content/hyg19.json)
   출처: 실제 기출 소음·측정 계산문제(항목 24~30)를 대표 예시로 재구성. 풀이(해설·시각화)는 신규 작성.
   골든룰: 표시 수치는 전부 draw에서 실계산(슬라이더값으로부터 매 프레임). 검산값은 각 블록 주석 참조.
   hyg17·hyg18(계산은행Ⅰ·Ⅱ) 패턴을 그대로 이어감. hyg15_01(NRR 개념)·hyg16_05(단일소음 허용시간)와는
   기출 풀이 관점·복수노출 확장·시각구성으로 차별화(각 블록 주석 참조). */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  function lg(x){ return Math.log(x)/Math.LN10; }
  /* 라벨(위)+값(아래) 2줄 카드를 누적커서로 쌓는다(hyg18 ROW 그대로 이식). 반환값=소비한 세로높이. */
  function ROW(ctx,W,H,x,y,w,rows){
    var labelFs=FS(H,0.022,9,12), valueFs=FS(H,0.028,11,15);
    var gap=FS(H,0.008,2,4), rowGap=FS(H,0.010,3,5);
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

  /* ── 19.1 음력수준(PWL) — 자유음장 점음원 ──
     Lw = Lp + 20·log₁₀(r) + c   (c=11 자유음장 / c=8 반자유음장·바닥반사)
     검산(r=20m, Lp=90dB, 자유음장): 90 + 20·log₁₀(20) + 11 = 90+26.02+11 = 127.0 dB */
  { id:'hyg19_01',
    enter:function(E){ var self=this; this.s={r:20, Lp:90, env:0};
      E.controls('<div class="ctrl"><label>측정거리 r (m)</label><input type="range" id="w1a" min="1" max="100" step="1" value="20"><output id="w1ao">20</output></div>'
        +'<div class="ctrl"><label>측정 음압수준 Lp (dB)</label><input type="range" id="w1b" min="50" max="130" step="1" value="90"><output id="w1bo">90</output></div>'
        +'<div class="ctrl"><label>설치조건</label><input type="range" id="w1c" min="0" max="1" step="1" value="0"><output id="w1co">자유음장(c=11)</output></div>');
      E.bind('#w1a','input',function(e){ self.s.r=+e.target.value; document.getElementById('w1ao').textContent=e.target.value; });
      E.bind('#w1b','input',function(e){ self.s.Lp=+e.target.value; document.getElementById('w1bo').textContent=e.target.value; });
      E.bind('#w1c','input',function(e){ self.s.env=+e.target.value; document.getElementById('w1co').textContent=self.s.env?'반자유음장(c=8)':'자유음장(c=11)'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var c=s.env?8:11;
      var distTerm=20*lg(s.r);
      var Lw=s.Lp+distTerm+c;
      var fs=FS(H,0.026,11,14);
      var y=H*0.20;
      T(ctx,'자유공간 점음원: Lw = Lp + 20·log₁₀(r) + c   [c=11 자유음장 · c=8 반자유음장(바닥반사)]',W*0.08,y,DIM,FS(H,0.022,9,13),'left');
      y+=FS(H,0.045,16,24);
      // 음원 → 측정점 개념도(개념도, 축척 아님) — 파형 확산
      var sy=y+FS(H,0.10,36,52), sx=W*0.16, mx=W*0.52;
      var rad=FS(H,0.014,5,8);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(sx,sy,rad,0,Math.PI*2); ctx.fill();
      for(var i=1;i<=3;i++){ ctx.strokeStyle='rgba(255,178,122,'+(0.5-i*0.12)+')'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(sx,sy,rad+i*FS(H,0.026,9,14),-0.5,0.5); ctx.stroke(); }
      ctx.lineWidth=1;
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(mx,sy); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'r = '+s.r+' m',(sx+mx)/2,sy-FS(H,0.02,7,11),TXT,fs,'center','600');
      var bw1=FS(H,0.13,46,64), bh1=FS(H,0.075,26,34), by1=sy-bh1/2;
      ctx.fillStyle=BLU; RR(ctx,mx,by1,bw1,bh1,6); ctx.fill();
      T(ctx,'Lp='+s.Lp+'dB',mx+bw1/2,by1+bh1/2+fs*0.32,'#0c1420',fs,'center','700');   // 박스 안=한 줄만(겹침 방지)
      T(ctx,'음원',sx,sy+FS(H,0.038,13,19),DIM,FS(H,0.02,9,12),'center');
      T(ctx,(s.env?'반자유음장(c=8)':'자유음장(c=11)'),mx+bw1/2,by1+bh1+FS(H,0.05,18,24),DIM,FS(H,0.02,9,12),'center');   // 박스 '밖'에 별도 배치
      y=by1+bh1+FS(H,0.11,38,50);
      var rows=[
        ['① 거리항 20·log₁₀(r) = 20·log₁₀('+s.r+')', distTerm.toFixed(2)+' dB', BLU],
        ['② 환경상수 c ('+(s.env?'반자유음장':'자유음장')+')', c+' dB', ORA],
        ['③ 음력수준 Lw = Lp + ① + ②', Lw.toFixed(2)+' dB', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.03,8,16);
      T(ctx,'검산: '+s.Lp+'+20log₁₀('+s.r+')+'+c+' = '+s.Lp+'+'+distTerm.toFixed(2)+'+'+c+' = '+Lw.toFixed(2)+' dB',W*0.08,y,DIM,FS(H,0.022,9,12),'left');
      E.tapHint(0,0,'슬라이더로 거리·음압·설치조건 조절',true);
      E.big('r'+s.r+'m·Lp'+s.Lp+'dB → 음력수준 Lw '+Lw.toFixed(1)+'dB',
            '기출 빈출유형: 음원 자체가 내는 절대적인 힘(음력수준)은 멀리서 잰 소리(음압수준)에 거리로 퍼지며 약해진 만큼을 다시 더해줘야 나옵니다.'); }
  },

  /* ── 19.2 거리감쇠 — 점음원 자유음장 ──
     ΔL = 20·log₁₀(r₁/r₂),  L₂ = L₁ + ΔL   (거리 2배마다 −6dB)
     검산(r1=12m,r2=4m,L1=104dB(A)): 104 + 20·log₁₀(12/4) = 104+9.54 = 113.5 dB(A) */
  { id:'hyg19_02',
    enter:function(E){ var self=this; this.s={r1:12, r2:4, L1:104};
      E.controls('<div class="ctrl"><label>측정거리 r₁ (m)</label><input type="range" id="w2a" min="1" max="50" step="1" value="12"><output id="w2ao">12</output></div>'
        +'<div class="ctrl"><label>추정거리 r₂ (m)</label><input type="range" id="w2b" min="1" max="50" step="1" value="4"><output id="w2bo">4</output></div>'
        +'<div class="ctrl"><label>r₁ 지점 소음수준 L₁ (dB(A))</label><input type="range" id="w2c" min="60" max="130" step="1" value="104"><output id="w2co">104</output></div>');
      E.bind('#w2a','input',function(e){ self.s.r1=+e.target.value; document.getElementById('w2ao').textContent=e.target.value; });
      E.bind('#w2b','input',function(e){ self.s.r2=+e.target.value; document.getElementById('w2bo').textContent=e.target.value; });
      E.bind('#w2c','input',function(e){ self.s.L1=+e.target.value; document.getElementById('w2co').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ratio=s.r1/s.r2;
      var dL=20*lg(ratio);
      var L2=s.L1+dL;
      var fs=FS(H,0.028,12,15);
      var y=H*0.22;
      T(ctx,'점음원 자유음장: ΔL = 20·log₁₀(r₁/r₂)   ·   L₂ = L₁ + ΔL   (거리 2배마다 −6dB)',W*0.08,y,DIM,FS(H,0.024,10,13),'left');
      y+=FS(H,0.05,18,26);
      var cw=W*0.26, ch=FS(H,0.07,26,36), cx1=W*0.08, cx2=W*0.44;
      var lblFs=FS(H,0.02,9,12);
      T(ctx,'r₁='+s.r1+'m',cx1+cw/2,y-FS(H,0.014,4,7),BLU,lblFs,'center','600');   // 라벨은 박스 '밖'(위)에 배치(겹침 방지)
      ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; RR(ctx,cx1,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,s.L1+' dB(A)',cx1+cw/2,y+ch/2+fs*0.32,BLU,fs,'center','700');   // 박스 안=값 한 줄만
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx1+cw+8,y+ch/2); ctx.lineTo(cx2-8,y+ch/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(cx2-8,y+ch/2); ctx.lineTo(cx2-16,y+ch/2-5); ctx.lineTo(cx2-16,y+ch/2+5); ctx.fill();
      T(ctx,(dL>=0?'+':'')+dL.toFixed(2)+'dB',(cx1+cw+cx2)/2,y-FS(H,0.014,4,7),ORA,lblFs,'center','600');
      T(ctx,'r₂='+s.r2+'m',cx2+cw/2,y-FS(H,0.014,4,7),ORA,lblFs,'center','600');
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=ORA; RR(ctx,cx2,y,cw,ch,8); ctx.fill(); ctx.stroke();
      T(ctx,L2.toFixed(1)+' dB(A)',cx2+cw/2,y+ch/2+fs*0.32,ORA,fs,'center','700');
      y+=ch+FS(H,0.055,18,26);
      var rows=[
        ['① 거리비 r₁/r₂ = '+s.r1+'/'+s.r2, ratio.toFixed(3), BLU],
        ['② 감쇠(증가)량 ΔL=20·log₁₀(r₁/r₂)', dL.toFixed(2)+' dB', ORA],
        ['③ 추정 소음수준 L₂=L₁+ΔL', L2.toFixed(2)+' dB(A)', GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.03,8,16);
      T(ctx,'검산: '+s.L1+'+20log₁₀('+s.r1+'/'+s.r2+')='+s.L1+'+'+dL.toFixed(2)+'='+L2.toFixed(2)+' dB(A)',W*0.08,y,DIM,FS(H,0.022,9,12),'left');
      E.tapHint(0,0,'슬라이더로 두 거리·기준 소음수준 조절',true);
      E.big('r₁'+s.r1+'→r₂'+s.r2+'m·L₁'+s.L1+' → L₂ '+L2.toFixed(1)+'dB(A)',
            '기출 빈출유형: 자유음장 점음원은 거리가 절반이 될 때마다 소음이 6dB씩 커집니다 — 반대로 멀어지면 6dB씩 작아집니다.'); }
  },

  /* ── 19.3 소음노출지수(허용기준 초과판단) — 복수 노출수준 합산 ──
     16장(단일 소음수준 허용시간)을 여러 소음수준이 섞인 하루로 확장: Tᵢ=8/2^((Lᵢ−90)/5), D=Σ(Cᵢ/Tᵢ), D>1 초과
     검산(96dB 2h·91dB 4h·84dB 2h, 우리나라 90dB/8h·5dB 교환율):
     T(96)=8/2^1.2≈3.48 · T(91)=8/2^0.2≈6.96 · T(84)=8/2^-1.2≈18.38
     D=2/3.48+4/6.96+2/18.38 ≈ 0.574+0.574+0.109 ≈ 1.26 > 1 초과 */
  { id:'hyg19_03',
    enter:function(E){ var self=this; this.s={L1:96, L2:91, L3:84};
      E.controls('<div class="ctrl"><label>소음수준 L₁ (2시간 노출, dB(A))</label><input type="range" id="w3a" min="80" max="115" step="1" value="96"><output id="w3ao">96</output></div>'
        +'<div class="ctrl"><label>소음수준 L₂ (4시간 노출, dB(A))</label><input type="range" id="w3b" min="80" max="115" step="1" value="91"><output id="w3bo">91</output></div>'
        +'<div class="ctrl"><label>소음수준 L₃ (2시간 노출, dB(A))</label><input type="range" id="w3c" min="80" max="115" step="1" value="84"><output id="w3co">84</output></div>');
      E.bind('#w3a','input',function(e){ self.s.L1=+e.target.value; document.getElementById('w3ao').textContent=e.target.value; });
      E.bind('#w3b','input',function(e){ self.s.L2=+e.target.value; document.getElementById('w3bo').textContent=e.target.value; });
      E.bind('#w3c','input',function(e){ self.s.L3=+e.target.value; document.getElementById('w3co').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var C1=2, C2=4, C3=2;    // 시간은 기출 원 문제 고정값(대표 슬라이더는 소음수준 3개)
      function Ti(L){ return 8/Math.pow(2,(L-90)/5); }
      var T1=Ti(s.L1), T2=Ti(s.L2), T3=Ti(s.L3);
      var D=C1/T1+C2/T2+C3/T3;
      var over=D>1;
      var fs=FS(H,0.024,10,13);
      var y=H*0.19;
      T(ctx,'16장 단일수준 Tᵢ=8/2^((Lᵢ−90)/5)을 하루 전체로 확장: 소음노출지수 D=Σ(Cᵢ/Tᵢ), D>1이면 초과 (시간 C는 기출 고정값 2h·4h·2h)',W*0.08,y,DIM,FS(H,0.02,9,12),'left');
      y+=FS(H,0.045,16,22);
      var cols=[['L₁',s.L1,C1,T1],['L₂',s.L2,C2,T2],['L₃',s.L3,C3,T3]];
      var cw=W*0.26, cx0=W*0.08, gap=W*0.03;
      for(var i=0;i<3;i++){ var cx=cx0+i*(cw+gap);
        ctx.fillStyle='rgba(122,184,255,0.08)'; ctx.strokeStyle=BLU; RR(ctx,cx,y,cw,FS(H,0.20,72,110),8); ctx.fill(); ctx.stroke();
        var iy=y+FS(H,0.03,10,16);
        T(ctx,cols[i][0]+' = '+cols[i][1]+' dB(A), '+cols[i][2]+'시간',cx+cw/2,iy,TXT,fs,'center','600'); iy+=FS(H,0.045,16,22);
        T(ctx,'Tᵢ=8/2^(('+cols[i][1]+'−90)/5)',cx+cw/2,iy,DIM,FS(H,0.02,9,12),'center'); iy+=FS(H,0.036,13,18);
        T(ctx,'= '+cols[i][3].toFixed(2)+' h',cx+cw/2,iy,ORA,FS(H,0.028,12,16),'center','700'); iy+=FS(H,0.044,15,20);
        T(ctx,'Cᵢ/Tᵢ = '+cols[i][2]+'/'+cols[i][3].toFixed(2),cx+cw/2,iy,DIM,FS(H,0.02,9,12),'center'); iy+=FS(H,0.036,13,18);
        T(ctx,'= '+(cols[i][2]/cols[i][3]).toFixed(3),cx+cw/2,iy,GRN,FS(H,0.026,11,14),'center','700');
      }
      y+=FS(H,0.20,72,110)+FS(H,0.05,18,24);
      var rows=[
        ['소음노출지수 D = ΣCᵢ/Tᵢ', D.toFixed(3), over?RED:GRN],
        ['판정 (D>1 초과)', over?'허용기준 초과 — 청력보호 대책 필요':'허용기준 이내', over?RED:GRN]
      ];
      var rowsH=ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      y+=rowsH+FS(H,0.028,8,15);
      T(ctx,'검산: '+C1+'/'+T1.toFixed(2)+'+'+C2+'/'+T2.toFixed(2)+'+'+C3+'/'+T3.toFixed(2)+' = '+D.toFixed(3),W*0.08,y,DIM,FS(H,0.02,9,11),'left');
      E.tapHint(0,0,'슬라이더로 세 소음수준 조절(시간은 기출 고정값)',true);
      E.big('D = '+D.toFixed(2)+' ('+(over?'기준 초과':'기준 이내')+')',
            '기출 빈출유형: 하루에 여러 세기의 소음을 겪었다면 각 소음이 "허용시간 대비 몇 %를 썼는지"를 다 더해서 100%(=1)를 넘는지 봅니다.'); }
  },

  /* ── 19.4 옥타브밴드·1/3옥타브밴드 주파수 범위 ──
     옥타브: 하한=fc/√2, 상한=fc·√2.  1/3옥타브: 하한=fc/2^(1/6), 상한=fc·2^(1/6)
     검산(fc=1000Hz): 옥타브 707.1~1414.2Hz · 1/3옥타브 890.9~1122.5Hz */
  { id:'hyg19_04',
    enter:function(E){ var self=this; this.s={fc:1000};
      E.controls('<div class="ctrl"><label>중심주파수 fc (Hz)</label><input type="range" id="w4a" min="63" max="8000" step="1" value="1000"><output id="w4ao">1000</output></div>');
      E.bind('#w4a','input',function(e){ self.s.fc=+e.target.value; document.getElementById('w4ao').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var lo=s.fc/Math.SQRT2, hi=s.fc*Math.SQRT2;
      var k3=Math.pow(2,1/6);
      var lo3=s.fc/k3, hi3=s.fc*k3;
      var fs=FS(H,0.026,11,14);
      var y=H*0.20;
      T(ctx,'옥타브밴드: 하한=fc/√2 · 상한=fc·√2   ·   1/3옥타브밴드: 하한=fc/2^(1/6) · 상한=fc·2^(1/6)',W*0.08,y,DIM,FS(H,0.021,9,12),'left');
      y+=FS(H,0.035,12,18);
      // 로그 주파수축(20~10000Hz)
      var fMin=20, fMax=10000;
      var px0=W*0.08, pw=W*0.84;
      function px(f){ return px0+(lg(f)-lg(fMin))/(lg(fMax)-lg(fMin))*pw; }
      var axY=y+FS(H,0.055,20,28), axH=FS(H,0.075,24,34);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(px0,axY+axH); ctx.lineTo(px0+pw,axY+axH); ctx.stroke();
      var ticks=[20,50,100,200,500,1000,2000,5000,10000];
      for(var i=0;i<ticks.length;i++){ var xx=px(ticks[i]);
        ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(xx,axY+axH); ctx.lineTo(xx,axY+axH+5); ctx.stroke();
        T(ctx,ticks[i]+'',xx,axY+axH+FS(H,0.028,11,16),DIM,FS(H,0.019,8,11),'center'); }
      // 옥타브밴드(넓은 띠, 아래) · 1/3옥타브밴드(좁은 띠, 위 겹침)
      ctx.fillStyle='rgba(122,184,255,0.30)'; ctx.fillRect(px(lo),axY+axH*0.5,px(hi)-px(lo),axH*0.48);
      ctx.fillStyle='rgba(143,227,181,0.55)'; ctx.fillRect(px(lo3),axY,px(hi3)-px(lo3),axH*0.46);
      var fcx=px(s.fc);
      ctx.strokeStyle=AMB; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(fcx,axY-6); ctx.lineTo(fcx,axY+axH+6); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,'fc='+s.fc+'Hz',fcx,axY-FS(H,0.018,7,11),AMB,FS(H,0.021,9,12),'center','700');
      T(ctx,'1/3옥타브',px0-FS(H,0.005,2,4),axY+axH*0.23,GRN,FS(H,0.019,8,11),'right');
      T(ctx,'옥타브',px0-FS(H,0.005,2,4),axY+axH*0.74,BLU,FS(H,0.019,8,11),'right');
      y=axY+axH+FS(H,0.045,15,20);
      var rows=[
        ['옥타브밴드 범위 = fc/√2 ~ fc×√2', lo.toFixed(1)+' ~ '+hi.toFixed(1)+' Hz', BLU],
        ['1/3옥타브밴드 범위 = fc/2^(1/6) ~ fc×2^(1/6)', lo3.toFixed(1)+' ~ '+hi3.toFixed(1)+' Hz', GRN]
      ];
      ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      E.tapHint(0,0,'슬라이더로 중심주파수 조절',true);
      E.big('fc'+s.fc+'Hz → 옥타브 '+lo.toFixed(0)+'~'+hi.toFixed(0)+'Hz · 1/3옥타브 '+lo3.toFixed(0)+'~'+hi3.toFixed(0)+'Hz',
            '기출 빈출유형: "옥타브"는 위아래로 2배씩(√2배) 벌어지고, "1/3옥타브"는 그 폭을 세 등분(2^(1/6)배)한 좁은 밴드입니다.'); }
  },

  /* ── 19.5 실내 총 흡음량(sabin) — 두 지점 실측으로 실정수 R 역산 ──
     실내식 Lp=Lw+10log₁₀(Q/(4πr²)+4/R), Q=1(무지향 가정). 두 지점 차를 연립해 R을 대수적으로 직접 해석(closed-form).
     x=4/R이라 두면 (D1+x)/(D2+x)=10^((Lp1−Lp2)/10) → x=(D1−ratio·D2)/(ratio−1), R=4/x. 총흡음량 A≈R(ᾱ 작을 때 근사).
     검산(r1=10m,r2=20m,Lp1=100dB,Lp2=97.5dB): D1=1/(4π·10²)≈7.958e-4·D2≈1.989e-4·ratio=10^0.25≈1.7783
     → R≈4×0.7783/(7.958e-4−1.7783×1.989e-4)≈7043 m²(sabin) → A≈7043 sabin, Lw≈128.6dB(검산: 두 식 모두 역대입 일치) */
  { id:'hyg19_05',
    enter:function(E){ var self=this; this.s={r1:10, r2:20, Lp1:100, Lp2:97.5};
      E.controls('<div class="ctrl"><label>측정거리 r₁ (m)</label><input type="range" id="w5a" min="2" max="30" step="1" value="10"><output id="w5ao">10</output></div>'
        +'<div class="ctrl"><label>측정거리 r₂ (m)</label><input type="range" id="w5b" min="5" max="50" step="1" value="20"><output id="w5bo">20</output></div>'
        +'<div class="ctrl"><label>r₁ 음압수준 Lp₁ (dB)</label><input type="range" id="w5c" min="70" max="120" step="0.5" value="100"><output id="w5co">100.0</output></div>'
        +'<div class="ctrl"><label>r₂ 음압수준 Lp₂ (dB)</label><input type="range" id="w5d" min="70" max="120" step="0.5" value="97.5"><output id="w5do">97.5</output></div>');
      E.bind('#w5a','input',function(e){ self.s.r1=+e.target.value; document.getElementById('w5ao').textContent=e.target.value; });
      E.bind('#w5b','input',function(e){ self.s.r2=+e.target.value; document.getElementById('w5bo').textContent=e.target.value; });
      E.bind('#w5c','input',function(e){ self.s.Lp1=+e.target.value; document.getElementById('w5co').textContent=(+e.target.value).toFixed(1); });
      E.bind('#w5d','input',function(e){ self.s.Lp2=+e.target.value; document.getElementById('w5do').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var D1=1/(4*Math.PI*s.r1*s.r1), D2=1/(4*Math.PI*s.r2*s.r2);
      var ratio=Math.pow(10,(s.Lp1-s.Lp2)/10);
      var den=D1-ratio*D2, num=4*(ratio-1);
      var stable = Math.abs(den)>1e-9 && (num/den)>0;
      var r1u=s.r1, r2u=s.r2, Lp1u=s.Lp1, Lp2u=s.Lp2;
      if(!stable){ r1u=10; r2u=20; Lp1u=100; Lp2u=97.5;   // 대표값(기출 원본 수치)로 대체 계산
        D1=1/(4*Math.PI*r1u*r1u); D2=1/(4*Math.PI*r2u*r2u);
        ratio=Math.pow(10,(Lp1u-Lp2u)/10); den=D1-ratio*D2; num=4*(ratio-1); }
      var R=num/den, x=4/R;
      var A=R;   // 근사: ᾱ(평균흡음률)가 작을 때 A=Sᾱ/(1−ᾱ)≈R
      var W1=Math.pow(10,Lp1u/10)/(D1+x);
      var Lw=10*lg(W1);
      var fs=FS(H,0.023,10,13);
      var y=H*0.16;
      T(ctx,'실내식: Lp=Lw+10log₁₀(Q/(4πr²)+4/R), Q=1(무지향 가정) — 두 지점 차로 R을 대수적으로 직접 해석',W*0.08,y,DIM,FS(H,0.02,9,12),'left');
      y+=FS(H,0.032,11,15);
      if(!stable){ T(ctx,'⚠ 현재 조합은 해가 불안정(비물리적) → 대표값(r₁10m·r₂20m·100dB·97.5dB)으로 계산',W*0.08,y,RED,FS(H,0.019,8,11),'left'); }
      y+=FS(H,0.032,11,15);
      var rows=[
        ['① 직접음항 D₁=1/(4πr₁²), D₂=1/(4πr₂²)', D1.toExponential(3)+' , '+D2.toExponential(3), BLU],
        ['② 음압차 비 ratio=10^((Lp₁−Lp₂)/10)', ratio.toFixed(4), ORA],
        ['③ 실정수 R=4(ratio−1)/(D₁−ratio·D₂) ≈ 총흡음량 A(ᾱ작을때 근사)', R.toFixed(1)+' m² (sabin)', GRN],
        ['④ 역산 음력수준 Lw', Lw.toFixed(2)+' dB', PNK]
      ];
      ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      E.tapHint(0,0,'슬라이더로 두 지점 거리·음압수준 조절',true);
      E.big('r₁'+r1u+'·r₂'+r2u+'m → 실정수 R '+R.toFixed(0)+'m²(≈총흡음량 A)',
            '기출 빈출유형: 같은 음원을 두 거리에서 재면, 가까운 곳은 직접음이 세고 먼 곳은 반사음(잔향)이 더 크게 남습니다 — 그 차이로 방이 얼마나 소리를 흡수하는지를 거꾸로 계산합니다.'); }
  },

  /* ── 19.6 청력보호구 NRR 차음 — OSHA 계산법 기출 풀이 (15장 개념과 달리 실전 답안 흐름 강조) ──
     OSHA: 실효차음=(NRR−7)/2, 노출음압=Lp−실효차음
     검산(Lp=95dB(A), NRR=19): (19−7)/2=6dB → 95−6=89dB(A) */
  { id:'hyg19_06',
    enter:function(E){ var self=this; this.s={Lp:95, nrr:19};
      E.controls('<div class="ctrl"><label>작업장 음압수준 Lp (dB(A))</label><input type="range" id="w6a" min="80" max="115" step="1" value="95"><output id="w6ao">95</output></div>'
        +'<div class="ctrl"><label>차음평가수 NRR (dB)</label><input type="range" id="w6b" min="10" max="33" step="1" value="19"><output id="w6bo">19</output></div>');
      E.bind('#w6a','input',function(e){ self.s.Lp=+e.target.value; document.getElementById('w6ao').textContent=e.target.value; });
      E.bind('#w6b','input',function(e){ self.s.nrr=+e.target.value; document.getElementById('w6bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var eff=(s.nrr-7)/2;
      var exposed=s.Lp-eff;
      var fs=FS(H,0.027,12,15);
      var y=H*0.18;
      T(ctx,'OSHA 계산법(기출 답안 흐름): 실효차음 = (NRR − 7) ÷ 2   →   노출음압 = Lp − 실효차음',W*0.08,y,DIM,FS(H,0.023,10,13),'left');
      y+=FS(H,0.05,18,26);
      // 답안 파이프라인: Lp박스 -> [OSHA 50%보정]화살표 -> eff박스 -> [차감]화살표 -> exposed박스
      var bw=W*0.22, bh=FS(H,0.09,32,44), bx1=W*0.06, bx2=W*0.40, bx3=W*0.74, by=y;
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.strokeStyle=BLU; RR(ctx,bx1,by,bw,bh,8); ctx.fill(); ctx.stroke();
      T(ctx,'NRR='+s.nrr+'dB',bx1+bw/2,by+bh*0.42,BLU,fs,'center','700');
      T(ctx,'(포장 표기값)',bx1+bw/2,by+bh*0.75,DIM,FS(H,0.019,8,11),'center');
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx1+bw+6,by+bh/2); ctx.lineTo(bx2-6,by+bh/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.moveTo(bx2-6,by+bh/2); ctx.lineTo(bx2-14,by+bh/2-5); ctx.lineTo(bx2-14,by+bh/2+5); ctx.fill();
      T(ctx,'−7, ÷2',(bx1+bw+bx2)/2,by-FS(H,0.014,5,9),ORA,FS(H,0.02,9,12),'center','600');
      ctx.fillStyle='rgba(255,178,122,0.14)'; ctx.strokeStyle=ORA; RR(ctx,bx2,by,bw,bh,8); ctx.fill(); ctx.stroke();
      T(ctx,eff.toFixed(1)+' dB',bx2+bw/2,by+bh*0.42,ORA,fs,'center','700');
      T(ctx,'실효 차음효과',bx2+bw/2,by+bh*0.75,DIM,FS(H,0.019,8,11),'center');
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx2+bw+6,by+bh/2); ctx.lineTo(bx3-6,by+bh/2); ctx.stroke(); ctx.lineWidth=1;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.moveTo(bx3-6,by+bh/2); ctx.lineTo(bx3-14,by+bh/2-5); ctx.lineTo(bx3-14,by+bh/2+5); ctx.fill();
      T(ctx,'Lp−실효차음',(bx2+bw+bx3)/2,by-FS(H,0.014,5,9),GRN,FS(H,0.02,9,12),'center','600');
      var ok=exposed<90;
      ctx.fillStyle=ok?'rgba(143,227,181,0.16)':'rgba(240,136,138,0.16)'; ctx.strokeStyle=ok?GRN:RED; RR(ctx,bx3,by,bw,bh,8); ctx.fill(); ctx.stroke();
      T(ctx,exposed.toFixed(1)+' dB(A)',bx3+bw/2,by+bh*0.42,ok?GRN:RED,fs,'center','700');
      T(ctx,'실제 노출음압',bx3+bw/2,by+bh*0.75,DIM,FS(H,0.019,8,11),'center');
      y=by+bh+FS(H,0.07,24,32);
      var rows=[
        ['1단계) 실효 차음 = (NRR−7)÷2 = ('+s.nrr+'−7)÷2', eff.toFixed(1)+' dB', BLU],
        ['2단계) 노출음압 = Lp−실효차음 = '+s.Lp+'−'+eff.toFixed(1), exposed.toFixed(1)+' dB(A)', ok?GRN:RED],
        ['3단계) 판정(관리대상 노출기준 90dB(A) 대비)', ok?'90dB(A) 미만 — 착용상태 적합':'90dB(A) 이상 — 보호구 재선정 필요', ok?GRN:RED]
      ];
      ROW(ctx,W,H,W*0.08,y,W*0.84,rows);
      E.tapHint(0,0,'슬라이더로 음압·NRR 조절',true);
      E.big('NRR'+s.nrr+' → OSHA 실효차음 '+eff.toFixed(1)+'dB → 노출 '+exposed.toFixed(1)+'dB(A)',
            '기출 빈출유형: 포장에 적힌 NRR 숫자를 그대로 믿지 않고, 미국 OSHA 계산법대로 7을 빼고 반으로 줄인 값만이 실제 현장에서 기대할 수 있는 차음효과입니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
