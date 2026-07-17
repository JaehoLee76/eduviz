/* 산업위생기술사 제15장 — 소음·분석 계산 마무리 (동작만. 텍스트=content/hyg15.json)
   남은 필기 유형: 청력보호구 차음(NRR)·흡음 감음량·옥타브밴드·채취분석 정량·PWC 작업생리.
   골든룰: 표시 수치는 전부 draw에서 실계산. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  function lg(x){ return Math.log(x)/Math.LN10; }

  var scenes=[

  /* ── 15.1 청력보호구 차음 — NRR ───────────────────── */
  { id:'hyg15_01',
    enter:function(E){ var self=this; this.s={L:95, nrr:19};
      E.controls('<div class="ctrl"><label>작업장 음압 L (dB(A))</label><input type="range" id="n1a" min="80" max="115" step="1" value="95"><output id="n1ao">95</output></div>'
        +'<div class="ctrl"><label>차음평가수 NRR (dB)</label><input type="range" id="n1b" min="10" max="33" step="1" value="19"><output id="n1bo">19</output></div>');
      E.bind('#n1a','input',function(e){ self.s.L=+e.target.value; document.getElementById('n1ao').textContent=e.target.value; });
      E.bind('#n1b','input',function(e){ self.s.nrr=+e.target.value; document.getElementById('n1bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var eff=(s.nrr-7)*0.5;                       // 실효 차음효과 (OSHA 50% 보정)
      var Lp=s.L-eff;                              // 착용 후 노출
      var ok=Lp<90;
      var dbMin=60, dbMax=120, top=H*0.37, base=H*0.86;
      function dbY(d){ return base-(d-dbMin)/(dbMax-dbMin)*(base-top); }
      var fs=FS(H,0.028,12,15), d, y;
      // 눈금
      for(d=dbMin;d<=dbMax;d+=10){ y=dbY(d);
        ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(W*0.11,y); ctx.lineTo(W*0.55,y); ctx.stroke();
        T(ctx,d+'',W*0.10,y+4,DIM,FS(H,0.023,12,15),'right'); }
      // 노출기준 90 dB 선
      y=dbY(90); ctx.strokeStyle=RED; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(W*0.11,y); ctx.lineTo(W*0.55,y); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'노출기준 90 dB(A)/8h',W*0.11,y-6,RED,FS(H,0.024,13,15),'left','600');
      // 막대 1: 작업장
      var bw=W*0.11, bx1=W*0.17, bx2=W*0.40;
      ctx.fillStyle=ORA; RR(ctx,bx1,dbY(s.L),bw,base-dbY(s.L),6); ctx.fill();
      T(ctx,s.L+' dB(A)',bx1+bw/2,dbY(s.L)-8,ORA,fs,'center','700');
      T(ctx,'작업장',bx1+bw/2,base+FS(H,0.034,14,19),DIM,fs,'center');
      // 막대 2: 착용 후
      ctx.fillStyle=ok?GRN:RED; RR(ctx,bx2,dbY(Lp),bw,base-dbY(Lp),6); ctx.fill();
      T(ctx,Lp.toFixed(1)+' dB(A)',bx2+bw/2,dbY(Lp)-8,ok?GRN:RED,fs,'center','700');
      T(ctx,'착용 후',bx2+bw/2,base+FS(H,0.034,14,19),DIM,fs,'center');
      // 차음 화살표
      ctx.strokeStyle=BLU; ctx.beginPath(); ctx.moveTo(bx1+bw+8,dbY(s.L)); ctx.lineTo(bx2-8,dbY(Lp)); ctx.stroke();
      T(ctx,'−'+eff.toFixed(1)+' dB',(bx1+bw+bx2)/2,(dbY(s.L)+dbY(Lp))/2-8,BLU,fs,'center','600');
      // 우측 계산 패널
      var rx=W*0.60, ry=H*0.42, lh=FS(H,0.062,22,32);
      var rows=[
        ['실효 차음 = (NRR − 7) × 0.5','('+s.nrr+' − 7) × 0.5 = '+eff.toFixed(1)+' dB',BLU],
        ['착용 후 = L − 실효 차음',s.L+' − '+eff.toFixed(1)+' = '+Lp.toFixed(1)+' dB(A)',ok?GRN:RED],
        ['판정 (기준 90 dB(A))',ok?'기준 미만 — 적합':'기준 이상 — 추가 대책 필요',ok?GRN:RED]];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-8,yy-lh*0.42,W*0.36,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy-FS(H,0.006,4,6),DIM,FS(H,0.024,13,15),'left');
        T(ctx,rows[i][1],rx,yy+FS(H,0.028,12,16),rows[i][2],FS(H,0.028,12,16),'left','700'); }
      E.tapHint(0,0,'슬라이더로 음압·NRR 조절',true);
      E.big('NRR '+s.nrr+' → 실효 차음 '+eff.toFixed(1)+' dB · 착용 후 '+Lp.toFixed(1)+' dB(A)',
            '포장에 적힌 NRR을 그대로 믿지 않고 (NRR−7)×0.5로 깎아서 실제 보호 효과를 봅니다.'); }
  },

  /* ── 15.2 흡음 처리 감음량 NR ─────────────────────── */
  { id:'hyg15_02',
    enter:function(E){ var self=this; this.s={a1:50, a2:200};
      E.controls('<div class="ctrl"><label>처리 전 흡음력 A₁ (m²)</label><input type="range" id="n2a" min="10" max="250" step="5" value="50"><output id="n2ao">50</output></div>'
        +'<div class="ctrl"><label>처리 후 흡음력 A₂ (m²)</label><input type="range" id="n2b" min="10" max="500" step="10" value="200"><output id="n2bo">200</output></div>');
      E.bind('#n2a','input',function(e){ self.s.a1=+e.target.value; document.getElementById('n2ao').textContent=e.target.value; });
      E.bind('#n2b','input',function(e){ self.s.a2=+e.target.value; document.getElementById('n2bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var NR=10*lg(s.a2/s.a1);                     // 감음량
      var Ssum=500;                                // 실내 전체 표면적 가정 (m²)
      var al1=s.a1/Ssum, al2=s.a2/Ssum;            // 평균흡음률
      var fs=FS(H,0.028,12,15), y0=H*0.36, lh=FS(H,0.058,20,30);
      T(ctx,'흡음력 A = Σ(Sᵢ × αᵢ)  ·  평균흡음률 ᾱ = A ÷ ΣS  (ΣS = '+Ssum+' m² 가정)',W*0.10,y0,DIM,FS(H,0.026,13,14),'left');
      // 흡음력 막대 2개
      var bx=W*0.10, bw=W*0.50, bh=FS(H,0.05,18,26), by1=y0+lh*0.8, by2=by1+lh*1.5;
      T(ctx,'처리 전 A₁',bx,by1-8,DIM,FS(H,0.024,13,15),'left');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,by1,bw,bh,6); ctx.fill();
      ctx.fillStyle=ORA; RR(ctx,bx,by1,bw*s.a1/500,bh,6); ctx.fill();
      T(ctx,s.a1+' m² (ᾱ='+al1.toFixed(2)+')',bx+bw+10,by1+bh*0.72,ORA,fs,'left','700');
      T(ctx,'처리 후 A₂',bx,by2-8,DIM,FS(H,0.024,13,15),'left');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,by2,bw,bh,6); ctx.fill();
      ctx.fillStyle=GRN; RR(ctx,bx,by2,bw*s.a2/500,bh,6); ctx.fill();
      T(ctx,s.a2+' m² (ᾱ='+al2.toFixed(2)+')',bx+bw+10,by2+bh*0.72,GRN,fs,'left','700');
      // NR 게이지
      var gy=by2+lh*1.7, gmax=17;
      T(ctx,'감음량 NR = 10 log(A₂/A₁) = 10 log('+s.a2+'/'+s.a1+')',bx,gy-8,DIM,FS(H,0.026,13,14),'left');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,gy,bw,bh,6); ctx.fill();
      var frac=Math.max(0,Math.min(1,NR/gmax));
      ctx.fillStyle=NR>=0?BLU:RED; RR(ctx,bx,gy,bw*frac,bh,6); ctx.fill();
      T(ctx,NR.toFixed(2)+' dB',bx+bw+10,gy+bh*0.72,NR>=0?BLU:RED,FS(H,0.036,14,20),'left','700');
      // 체감 주석: 3dB=2배, 10dB=10배
      var note=(NR>=10)?'흡음력 10배 이상 — 감음 10 dB 이상 (에너지 1/10)':(NR>=3)?'흡음력 2배 이상 — 감음 3 dB 이상 (에너지 1/2)':(NR>=0)?'흡음력 증가폭이 작아 감음이 미미합니다':'A₂가 A₁보다 작으면 오히려 시끄러워집니다';
      T(ctx,note,bx,gy+bh+FS(H,0.045,18,26),DIM,FS(H,0.026,13,14),'left');
      E.tapHint(0,0,'슬라이더로 처리 전후 흡음력 조절',true);
      E.big('A₁ '+s.a1+' → A₂ '+s.a2+' m² : 감음량 NR = '+NR.toFixed(2)+' dB',
            '흡음재를 붙여 흡음력이 몇 배가 됐는지가 전부입니다 — 10 log(배수)만큼 조용해집니다.'); }
  },

  /* ── 15.3 옥타브밴드 분석 — 1/1·1/3 ──────────────── */
  { id:'hyg15_03',
    enter:function(E){ var self=this; this.s={fi:4, band:1};
      E.controls('<div class="ctrl"><label>중심주파수 fc (단계)</label><input type="range" id="n3a" min="0" max="7" step="1" value="4"><output id="n3ao">1000 Hz</output></div>'
        +'<div class="ctrl"><label>밴드 종류 (1=1/1 · 3=1/3)</label><input type="range" id="n3b" min="1" max="3" step="2" value="1"><output id="n3bo">1/1</output></div>');
      var FR=[63,125,250,500,1000,2000,4000,8000];
      E.bind('#n3a','input',function(e){ self.s.fi=+e.target.value; document.getElementById('n3ao').textContent=FR[self.s.fi].toLocaleString()+' Hz'; });
      E.bind('#n3b','input',function(e){ self.s.band=+e.target.value; document.getElementById('n3bo').textContent=(self.s.band===1?'1/1':'1/3'); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var FR=[63,125,250,500,1000,2000,4000,8000];
      var fc=FR[s.fi];
      var k=(s.band===1)?Math.SQRT2:Math.pow(2,1/6);   // f2/f1 = 2 (1/1) 또는 2^(1/3) (1/3) → 반폭 √
      var f1=fc/k, f2=fc*k, bwHz=f2-f1;
      var fs=FS(H,0.028,12,15);
      function fmt(v){ return v>=1000? Math.round(v).toLocaleString() : (Math.round(v*10)/10)+''; }
      // 로그 주파수 축
      var x0=W*0.10, x1=W*0.90, ax=H*0.60, fmin=40, fmax=12000;
      function X(f){ return x0+(lg(f)-lg(fmin))/(lg(fmax)-lg(fmin))*(x1-x0); }
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x0,ax); ctx.lineTo(x1,ax); ctx.stroke();
      for(var i=0;i<FR.length;i++){ var tx=X(FR[i]);
        ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(tx,ax-5); ctx.lineTo(tx,ax+5); ctx.stroke();
        T(ctx,FR[i]>=1000?(FR[i]/1000)+'k':FR[i]+'',tx,ax+FS(H,0.033,14,18),i===s.fi?AMB:DIM,FS(H,0.023,12,15),'center',i===s.fi?'700':''); }
      T(ctx,'Hz (log)',x1+6,ax+4,DIM,FS(H,0.022,12,14),'left');
      // 밴드 사각형
      var bt=H*0.42, bb=ax-4;
      ctx.fillStyle='rgba(242,189,85,0.18)'; ctx.fillRect(X(f1),bt,X(f2)-X(f1),bb-bt);
      ctx.strokeStyle=AMB; ctx.strokeRect(X(f1),bt,X(f2)-X(f1),bb-bt);
      ctx.strokeStyle=ORA; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(X(fc),bt-H*0.02); ctx.lineTo(X(fc),bb); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'fc '+fmt(fc),X(fc),bt-H*0.03,ORA,fs,'center','700');
      T(ctx,'f₁ '+fmt(f1),X(f1),bt-H*0.005,BLU,FS(H,0.024,13,15),'center','600');
      T(ctx,'f₂ '+fmt(f2),X(f2),bt-H*0.005,PNK,FS(H,0.024,13,15),'center','600');
      // 계산 행
      var ry=H*0.70, lh=FS(H,0.052,18,27), rx=W*0.10;
      var rows=[
        ['fc = √(f₁·f₂) = √('+fmt(f1)+' × '+fmt(f2)+')', fmt(Math.sqrt(f1*f2))+' Hz', ORA],
        ['f₁ = fc ÷ '+(s.band===1?'√2':'√1.26')+'  ·  f₂ = fc × '+(s.band===1?'√2':'√1.26'), fmt(f1)+' / '+fmt(f2)+' Hz', BLU],
        ['밴드폭 b = f₂ − f₁ = fc × '+(bwHz/fc).toFixed(3), fmt(bwHz)+' Hz', GRN],
        ['상하한비 f₂/f₁ = '+(s.band===1?'2':'2^(1/3)'), (f2/f1).toFixed(3), PNK]];
      for(i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-6,yy-lh*0.6,W*0.80,lh*0.85,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy,TXT,FS(H,0.026,13,14),'left');
        T(ctx,rows[i][1],rx+W*0.74,yy,rows[i][2],FS(H,0.030,13,17),'right','700'); }
      E.tapHint(0,0,'슬라이더로 중심주파수·밴드 종류 조절',true);
      E.big((s.band===1?'1/1':'1/3')+' 옥타브 fc '+fmt(fc)+' Hz → f₁ '+fmt(f1)+' · f₂ '+fmt(f2)+' · 폭 '+fmt(bwHz)+' Hz',
            '중심주파수는 산술평균이 아니라 기하평균 √(f₁·f₂)입니다 — 소리는 log 세상이기 때문입니다.'); }
  },

  /* ── 15.4 채취·분석 정량 — 흡광광도법 + 석면 계수 ── */
  { id:'hyg15_04',
    enter:function(E){ var self=this; this.s={A:0.31, V:150};
      E.controls('<div class="ctrl"><label>시료 흡광도 A</label><input type="range" id="n4a" min="0.05" max="1" step="0.01" value="0.31"><output id="n4ao">0.31</output></div>'
        +'<div class="ctrl"><label>채취공기량 V (L)</label><input type="range" id="n4b" min="30" max="480" step="10" value="150"><output id="n4bo">150</output></div>');
      E.bind('#n4a','input',function(e){ self.s.A=+e.target.value; document.getElementById('n4ao').textContent=(+e.target.value).toFixed(2); });
      E.bind('#n4b','input',function(e){ self.s.V=+e.target.value; document.getElementById('n4bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var m=0.050, b=0.010;                        // 검량선 y = 0.050x + 0.010
      var x=Math.max(0,(s.A-b)/m);                 // 시료액 농도 (µg/mL)
      var vol=10;                                  // 탈착·용해액 부피 (mL)
      var mass=x*vol;                              // 분석량 (µg)
      var C=mass/s.V;                              // µg/L = mg/m³
      var fs=FS(H,0.026,13,14);
      // 검량선 그래프 (좌측)
      var px0=W*0.10, px1=W*0.46, py0=H*0.82, py1=H*0.36, xmax=22, ymax=1.15;
      function PX(v){ return px0+v/xmax*(px1-px0); }
      function PY(v){ return py0-v/ymax*(py0-py1); }
      ctx.strokeStyle='rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(px0,py1-6); ctx.lineTo(px0,py0); ctx.lineTo(px1+6,py0); ctx.stroke();
      T(ctx,'농도 x (µg/mL)',(px0+px1)/2,py0+FS(H,0.036,15,20),DIM,FS(H,0.022,12,14),'center');
      ctx.save(); ctx.translate(px0-FS(H,0.045,18,26),(py0+py1)/2); ctx.rotate(-Math.PI/2); T(ctx,'흡광도 A',0,0,DIM,FS(H,0.022,12,14),'center'); ctx.restore();
      // 검량선 직선
      ctx.strokeStyle=BLU; ctx.beginPath(); ctx.moveTo(PX(0),PY(b)); ctx.lineTo(PX(xmax),PY(b+m*xmax)); ctx.stroke();
      T(ctx,'y = 0.050x + 0.010',px1-4,py1+FS(H,0.03,12,17),BLU,FS(H,0.023,12,15),'right','600');
      // 시료점 + 안내선
      ctx.strokeStyle=ORA; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(px0,PY(s.A)); ctx.lineTo(PX(x),PY(s.A)); ctx.lineTo(PX(x),py0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(PX(Math.min(x,xmax)),PY(s.A),FS(H,0.008,5,7),0,Math.PI*2); ctx.fill();
      T(ctx,'A='+s.A.toFixed(2),px0+4,PY(s.A)-6,ORA,FS(H,0.022,12,14),'left');
      T(ctx,'x='+x.toFixed(1),PX(Math.min(x,xmax)),py0-6,ORA,FS(H,0.022,12,14),'center');
      // 우측 계산 행
      var rx=W*0.54, ry=H*0.40, lh=FS(H,0.062,22,32);
      var rows=[
        ['① 검량선 역산  x = (A − 절편)/기울기','('+s.A.toFixed(2)+' − 0.010)/0.050 = '+x.toFixed(1)+' µg/mL',BLU],
        ['② 분석량 = x × 시료액 '+vol+' mL',mass.toFixed(1)+' µg',ORA],
        ['③ 농도 = 분석량 ÷ 채취공기량',mass.toFixed(1)+' µg ÷ '+s.V+' L = '+C.toFixed(3)+' mg/m³',GRN]];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-8,yy-lh*0.42,W*0.42,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy-FS(H,0.005,4,6),DIM,FS(H,0.023,12,15),'left');
        T(ctx,rows[i][1],rx,yy+FS(H,0.028,12,16),rows[i][2],FS(H,0.027,12,15),'left','700'); }
      // 석면 계수법 띠 (고정 예시 — 실계산)
      var N=120, Nb=2, nF=100, Af=0.00785, Ae=385, Va=240;   // 섬유수/바탕/시야수/시야면적/유효여과면적/공기량(L)
      var fcc=((N-Nb)/nF)*(Ae/Af)/(Va*1000);
      var sy=H*0.865;
      ctx.fillStyle='rgba(244,160,192,0.10)'; RR(ctx,W*0.08,sy-FS(H,0.03,12,17),W*0.84,FS(H,0.075,28,42),8); ctx.fill();
      T(ctx,'참고 · 석면(위상차현미경): 농도 = (섬유 '+N+'−바탕 '+Nb+')/'+nF+'시야 × (여과면적 '+Ae+'/시야면적 '+Af+') ÷ 공기량 '+(Va*1000).toLocaleString()+' cc = '+fcc.toFixed(2)+' f/cc',
        W*0.10,sy+FS(H,0.012,6,10),PNK,FS(H,0.021,12,14),'left');
      E.tapHint(0,0,'슬라이더로 흡광도·공기량 조절',true);
      E.big('A '+s.A.toFixed(2)+' → 분석량 '+mass.toFixed(1)+' µg → 농도 '+C.toFixed(3)+' mg/m³',
            '분석기기는 농도를 직접 말해주지 않습니다 — 검량선으로 역산하고 공기량으로 나눠야 농도입니다.'); }
  },

  /* ── 15.5 작업생리 — PWC와 작업·휴식 배분 ────────── */
  { id:'hyg15_05',
    enter:function(E){ var self=this; this.s={pwc:16, et:7};
      E.controls('<div class="ctrl"><label>육체적작업능력 PWC (kcal/min)</label><input type="range" id="n5a" min="8" max="20" step="0.5" value="16"><output id="n5ao">16</output></div>'
        +'<div class="ctrl"><label>작업 대사량 E작업 (kcal/min)</label><input type="range" id="n5b" min="2" max="12" step="0.5" value="7"><output id="n5bo">7</output></div>');
      E.bind('#n5a','input',function(e){ self.s.pwc=+e.target.value; document.getElementById('n5ao').textContent=(+e.target.value).toFixed(1); });
      E.bind('#n5b','input',function(e){ self.s.et=+e.target.value; document.getElementById('n5bo').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Eok=s.pwc/3;                             // 연속작업 적정 대사량 = PWC의 1/3
      var Erest=1.5;                               // 휴식 대사량 가정
      var over=s.et>Eok;
      var ratio=over?Math.max(0,Math.min(1,(s.et-Eok)/(s.et-Erest))):0;   // Trest/Ttotal
      var restMin=60*ratio;
      var fs=FS(H,0.028,12,15);
      // 좌측: 대사량 세로 막대 (PWC 눈금 + 1/3선 + E작업 마커)
      var top=H*0.37, base=H*0.84, vmax=20;
      function vy(v){ return base-v/vmax*(base-top); }
      var bx=W*0.15, bw=W*0.10;
      ctx.fillStyle='#1c2433'; RR(ctx,bx,vy(s.pwc),bw,base-vy(s.pwc),6); ctx.fill();
      T(ctx,'PWC '+s.pwc.toFixed(1),bx+bw/2,vy(s.pwc)-8,DIM,FS(H,0.024,13,15),'center','600');
      // 1/3 적정선
      ctx.strokeStyle=GRN; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(bx-14,vy(Eok)); ctx.lineTo(bx+bw+14,vy(Eok)); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'적정 = PWC/3 = '+Eok.toFixed(1),bx+bw+18,vy(Eok)+4,GRN,FS(H,0.024,13,15),'left','600');
      // E작업 채움
      ctx.fillStyle=over?RED:BLU; RR(ctx,bx,vy(s.et),bw,base-vy(s.et),6); ctx.fill();
      T(ctx,'E작업 '+s.et.toFixed(1),bx+bw/2,vy(s.et)+(over?-8:FS(H,0.032,13,18)),over?RED:'#0b1220',FS(H,0.024,13,15),'center','700');
      T(ctx,'kcal/min',bx+bw/2,base+FS(H,0.034,14,19),DIM,FS(H,0.022,12,14),'center');
      // 우측: 60분 작업·휴식 배분 막대
      var gx=W*0.46, gw=W*0.44, gy=H*0.46, gh=FS(H,0.06,22,32);
      T(ctx,'시간당 배분  Trest/Ttotal = (E작업 − E적정)/(E작업 − E휴식'+Erest.toFixed(1)+')',gx,gy-10,DIM,FS(H,0.024,13,15),'left');
      ctx.fillStyle=BLU; RR(ctx,gx,gy,gw*(1-ratio),gh,6); ctx.fill();
      if(ratio>0){ ctx.fillStyle=GRN; RR(ctx,gx+gw*(1-ratio),gy,gw*ratio,gh,6); ctx.fill(); }
      T(ctx,'작업 '+(60-restMin).toFixed(1)+'분',gx+gw*(1-ratio)/2,gy+gh*0.65,'#0b1220',FS(H,0.026,13,14),'center','700');
      if(ratio>0.08) T(ctx,'휴식 '+restMin.toFixed(1)+'분',gx+gw*(1-ratio)+gw*ratio/2,gy+gh*0.65,'#0b1220',FS(H,0.026,13,14),'center','700');
      // 계산 행
      var ry=gy+gh+FS(H,0.08,30,46), lh=FS(H,0.056,20,30);
      var rows=[
        ['연속작업 적정 대사량 = PWC × 1/3',Eok.toFixed(2)+' kcal/min',GRN],
        over?['휴식 비율 = ('+s.et.toFixed(1)+' − '+Eok.toFixed(2)+')/('+s.et.toFixed(1)+' − '+Erest.toFixed(1)+')',(ratio*100).toFixed(1)+' %',ORA]
            :['E작업 ≤ 적정 — 휴식 배분 불필요','연속작업 가능',BLU],
        over?['시간당 휴식 = 60분 × '+(ratio*100).toFixed(1)+'%',restMin.toFixed(1)+' 분',PNK]
            :['여유 = 적정 − E작업',(Eok-s.et).toFixed(2)+' kcal/min',DIM]];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,gx-8,yy-lh*0.6,gw+8,lh*0.85,7); ctx.fill();
        T(ctx,rows[i][0],gx,yy,TXT,FS(H,0.023,12,15),'left');
        T(ctx,rows[i][1],gx+gw-8,yy,rows[i][2],FS(H,0.028,12,16),'right','700'); }
      E.tapHint(0,0,'슬라이더로 PWC·작업 대사량 조절',true);
      E.big('PWC '+s.pwc.toFixed(1)+' → 적정 '+Eok.toFixed(1)+' kcal/min'+(over?' · 시간당 휴식 '+restMin.toFixed(1)+'분':' · 연속작업 가능'),
            over?'작업이 적정 수준을 넘으면 넘는 만큼을 휴식으로 되돌려 줘야 합니다.':'하루 8시간 계속 일하려면 자기 능력의 1/3 이하로 일해야 합니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
