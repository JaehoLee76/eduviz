/* 산업위생기술사 제13장 — 산업역학 (동작만. 텍스트=content/hyg13.json)
   원인을 통계로 밝힌다: 상대위험비 RR·교차비 OR·기여위험도 AR/AF·스크리닝(민감도·특이도·예측도)·표준화사망비 SMR + 힐의 인과성 기준.
   골든룰: 표시 수치는 전부 draw에서 실계산. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR_(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }

  // 2×2 표 그리기(라벨·값 실계산). cells=[[좌상,우상],[좌하,우하]] 값 문자열, rowLab/colLab 배열
  function grid2x2(ctx,x,y,w,h,colLab,rowLab,cells,W,H,hl){
    var cw=w/2, ch=h/2;
    // 열 머리글
    T(ctx,colLab[0],x+cw*0.5,y-FS(H,0.016,7,10),DIM,FS(H,0.024,10,13),'center','600');
    T(ctx,colLab[1],x+cw*1.5,y-FS(H,0.016,7,10),DIM,FS(H,0.024,10,13),'center','600');
    for(var r=0;r<2;r++)for(var c=0;c<2;c++){
      var cx=x+c*cw, cy=y+r*ch, on=(hl&&hl(r,c));
      ctx.fillStyle=on? (hl(r,c)===2?'rgba(122,184,255,0.18)':'rgba(255,178,122,0.18)') : 'rgba(255,255,255,0.04)';
      RR_(ctx,cx+2,cy+2,cw-4,ch-4,7); ctx.fill();
      ctx.strokeStyle=on? (hl(r,c)===2?BLU:ORA):'rgba(255,255,255,0.18)'; ctx.lineWidth=on?2:1; RR_(ctx,cx+2,cy+2,cw-4,ch-4,7); ctx.stroke();
      T(ctx,cells[r][c],cx+cw*0.5,cy+ch*0.5+FS(H,0.018,7,10),on?(hl(r,c)===2?BLU:ORA):TXT,FS(H,0.038,15,22),'center','700');
    }
    // 행 라벨(왼쪽 바깥)
    T(ctx,rowLab[0],x-FS(H,0.012,5,8),y+ch*0.5+FS(H,0.014,6,9),DIM,FS(H,0.024,10,13),'right','600');
    T(ctx,rowLab[1],x-FS(H,0.012,5,8),y+ch*1.5+FS(H,0.014,6,9),DIM,FS(H,0.024,10,13),'right','600');
  }

  var scenes=[

  /* ── 13.1 상대위험비 RR (코호트) ─────────────────── */
  { id:'hyg13_01',
    enter:function(E){ var self=this; this.s={ie:20, io:5};
      E.controls('<div class="ctrl"><label>노출군 발생률 Iₑ (/1,000)</label><input type="range" id="r1a" min="1" max="60" step="1" value="20"><output id="r1ao">20</output></div>'
        +'<div class="ctrl"><label>비노출군 발생률 I₀ (/1,000)</label><input type="range" id="r1b" min="1" max="60" step="1" value="5"><output id="r1bo">5</output></div>');
      E.bind('#r1a','input',function(e){ self.s.ie=+e.target.value; document.getElementById('r1ao').textContent=e.target.value; });
      E.bind('#r1b','input',function(e){ self.s.io=+e.target.value; document.getElementById('r1bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var RRv=s.ie/s.io, verdict, vcol;
      if(RRv>1.05){ verdict='RR > 1 — 노출이 위험을 높임(위험요인)'; vcol=RED; }
      else if(RRv<0.95){ verdict='RR < 1 — 노출이 위험을 낮춤(보호요인)'; vcol=GRN; }
      else { verdict='RR ≈ 1 — 노출과 질병은 무관'; vcol=DIM; }
      var y0=H*0.30, fx=W*0.07, fs=FS(H,0.030,13,17);
      T(ctx,'상대위험비  RR = 노출군 발생률 Iₑ ÷ 비노출군 발생률 I₀',fx,y0,TXT,FS(H,0.032,14,18),'left','700');
      // 발생률 막대
      var bx=fx, bw=W*0.42, bh=FS(H,0.05,17,26), mx=60;
      var by=y0+FS(H,0.065,24,36);
      T(ctx,'노출군 Iₑ = '+s.ie+' /1,000',bx,by-FS(H,0.012,5,8),ORA,fs,'left');
      ctx.fillStyle='#1c2433'; RR_(ctx,bx,by,bw,bh,6); ctx.fill();
      ctx.fillStyle=ORA; RR_(ctx,bx,by,bw*s.ie/mx,bh,6); ctx.fill();
      var by2=by+bh+FS(H,0.075,26,42);
      T(ctx,'비노출군 I₀ = '+s.io+' /1,000',bx,by2-FS(H,0.012,5,8),BLU,fs,'left');
      ctx.fillStyle='#1c2433'; RR_(ctx,bx,by2,bw,bh,6); ctx.fill();
      ctx.fillStyle=BLU; RR_(ctx,bx,by2,bw*s.io/mx,bh,6); ctx.fill();
      // RR 결과
      var ry=by2+bh+FS(H,0.10,34,56);
      T(ctx,'RR = '+s.ie+' / '+s.io+' =',bx,ry,DIM,FS(H,0.034,14,19),'left');
      T(ctx,RRv.toFixed(2),bx+W*0.22,ry,vcol,FS(H,0.058,24,38),'left','700');
      ctx.fillStyle='rgba('+(vcol===RED?'240,136,138':vcol===GRN?'143,227,181':'155,153,163')+',0.15)';
      RR_(ctx,bx,ry+FS(H,0.03,12,18),W*0.48,FS(H,0.06,22,34),8); ctx.fill();
      T(ctx,verdict,bx+W*0.24,ry+FS(H,0.03,12,18)+FS(H,0.04,17,24),vcol,fs,'center','600');
      // 2×2 코호트 개념표(각 군 1,000명 가정)
      var gx=W*0.62, gy=H*0.40, gw=W*0.30, gh=H*0.30;
      var a=s.ie, b=1000-s.ie, c=s.io, d=1000-s.io;
      T(ctx,'코호트 2×2 (각 군 1,000명 가정)',gx+gw*0.5,gy-FS(H,0.045,18,26),DIM,FS(H,0.026,11,14),'center');
      grid2x2(ctx,gx,gy,gw,gh,['발병','비발병'],['노출','비노출'],
        [[''+a,''+b],[''+c,''+d]],W,H,function(r,cc){ return (cc===0)?1:0; });
      T(ctx,'Iₑ='+a+'/1,000, I₀='+c+'/1,000 → RR='+RRv.toFixed(2),gx+gw*0.5,gy+gh+FS(H,0.05,20,28),DIM,FS(H,0.024,10,13),'center');
      E.tapHint(0,0,'슬라이더로 두 군 발생률 조절',true);
      E.big('상대위험비 RR = '+RRv.toFixed(2),
            '코호트 연구 — 노출군이 비노출군보다 몇 배 더 잘 걸리는가를 발생률의 비로 봅니다.'); }
  },

  /* ── 13.2 교차비 OR (환자-대조) ─────────────────── */
  { id:'hyg13_02',
    enter:function(E){ var self=this; this.s={a:30,b:15,c:10,d:45};
      E.controls('<div class="ctrl"><label>a 노출·환자 (명)</label><input type="range" id="o2a" min="1" max="80" step="1" value="30"><output id="o2ao">30</output></div>'
        +'<div class="ctrl"><label>b 노출·대조 (명)</label><input type="range" id="o2b" min="1" max="80" step="1" value="15"><output id="o2bo">15</output></div>'
        +'<div class="ctrl"><label>c 비노출·환자 (명)</label><input type="range" id="o2c" min="1" max="80" step="1" value="10"><output id="o2co">10</output></div>'
        +'<div class="ctrl"><label>d 비노출·대조 (명)</label><input type="range" id="o2d" min="1" max="80" step="1" value="45"><output id="o2do">45</output></div>');
      E.bind('#o2a','input',function(e){ self.s.a=+e.target.value; document.getElementById('o2ao').textContent=e.target.value; });
      E.bind('#o2b','input',function(e){ self.s.b=+e.target.value; document.getElementById('o2bo').textContent=e.target.value; });
      E.bind('#o2c','input',function(e){ self.s.c=+e.target.value; document.getElementById('o2co').textContent=e.target.value; });
      E.bind('#o2d','input',function(e){ self.s.d=+e.target.value; document.getElementById('o2do').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var OR=(s.a*s.d)/(s.b*s.c);
      var vcol=OR>1.05?RED:(OR<0.95?GRN:DIM);
      var y0=H*0.28, fx=W*0.07;
      T(ctx,'교차비  OR = (a × d) ÷ (b × c)',fx,y0,TXT,FS(H,0.034,15,19),'left','700');
      // 2×2 표(대각 a·d 주황 강조, b·c 파랑)
      var gx=W*0.20, gy=H*0.40, gw=W*0.30, gh=H*0.30;
      T(ctx,'환자-대조 2×2',gx+gw*0.5,gy-FS(H,0.045,18,26),DIM,FS(H,0.026,11,14),'center');
      grid2x2(ctx,gx,gy,gw,gh,['환자(case)','대조(control)'],['노출','비노출'],
        [[''+s.a,''+s.b],[''+s.c,''+s.d]],W,H,function(r,cc){ return ((r===0&&cc===0)||(r===1&&cc===1))?1:2; });
      T(ctx,'주황 대각 a·d = '+(s.a*s.d)+'   파랑 대각 b·c = '+(s.b*s.c),gx+gw*0.5,gy+gh+FS(H,0.05,20,28),DIM,FS(H,0.024,10,13),'center');
      // 계산·결과
      var rx=W*0.60, ry=H*0.42, lh=FS(H,0.055,20,30);
      T(ctx,'OR = (a×d) / (b×c)',rx,ry,DIM,FS(H,0.030,13,17),'left');
      T(ctx,'   = ('+s.a+'×'+s.d+') / ('+s.b+'×'+s.c+')',rx,ry+lh,DIM,FS(H,0.030,13,17),'left');
      T(ctx,'   = '+(s.a*s.d)+' / '+(s.b*s.c),rx,ry+lh*2,DIM,FS(H,0.030,13,17),'left');
      T(ctx,'OR = '+OR.toFixed(2),rx,ry+lh*3.4,vcol,FS(H,0.06,24,38),'left','700');
      T(ctx,OR>1.05?'노출과 질병의 관련성 있음':(OR<0.95?'노출이 보호적':'관련성 뚜렷하지 않음'),rx,ry+lh*4.4,vcol,FS(H,0.028,12,16),'left','600');
      E.tapHint(0,0,'네 칸 a·b·c·d를 조절',true);
      E.big('교차비 OR = '+OR.toFixed(2),
            '환자-대조 연구 — 발생률을 못 구하므로 노출 오즈의 비(OR)로 위험을 근사합니다.'); }
  },

  /* ── 13.3 기여위험도 AR·기여위험분율 AF ───────────── */
  { id:'hyg13_03',
    enter:function(E){ var self=this; this.s={ie:20, io:5};
      E.controls('<div class="ctrl"><label>노출군 발생률 Iₑ (/1,000)</label><input type="range" id="a3a" min="2" max="60" step="1" value="20"><output id="a3ao">20</output></div>'
        +'<div class="ctrl"><label>비노출군 발생률 I₀ (/1,000)</label><input type="range" id="a3b" min="1" max="40" step="1" value="5"><output id="a3bo">5</output></div>');
      E.bind('#a3a','input',function(e){ self.s.ie=Math.max(+e.target.value,self.s.io); document.getElementById('a3ao').textContent=e.target.value; });
      E.bind('#a3b','input',function(e){ self.s.io=Math.min(+e.target.value,self.s.ie); document.getElementById('a3bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ie=Math.max(s.ie,s.io), io=Math.min(s.io,s.ie);
      var AR=ie-io, AF=ie>0?(ie-io)/ie*100:0;
      var y0=H*0.30, fx=W*0.07, fs=FS(H,0.030,13,17);
      T(ctx,'기여위험도 AR = Iₑ − I₀      기여위험분율 AF = (Iₑ − I₀) / Iₑ × 100',fx,y0,TXT,FS(H,0.030,13,17),'left','700');
      // 노출군 막대 = 배경위험(I₀) + 기여분(AR) 적층
      var bx=fx, bw=W*0.52, bh=FS(H,0.07,26,40), mx=60;
      var by=y0+FS(H,0.09,32,48);
      T(ctx,'노출군 발생률 Iₑ = '+ie+' /1,000',bx,by-FS(H,0.014,6,9),TXT,fs,'left');
      ctx.fillStyle='#1c2433'; RR_(ctx,bx,by,bw,bh,6); ctx.fill();
      var wIo=bw*io/mx, wAR=bw*AR/mx;
      ctx.fillStyle=BLU; RR_(ctx,bx,by,wIo,bh,6); ctx.fill();          // 배경위험 I₀
      ctx.fillStyle=ORA; ctx.fillRect(bx+wIo,by,wAR,bh);              // 기여분 AR
      T(ctx,'I₀ '+io,bx+4,by+bh*0.62,'#0b1220',FS(H,0.026,11,14),'left','700');
      if(wAR>FS(H,0.05,20,30)) T(ctx,'AR '+AR,bx+wIo+4,by+bh*0.62,'#0b1220',FS(H,0.026,11,14),'left','700');
      // 결과 3줄
      var ry=by+bh+FS(H,0.10,34,54), lh=FS(H,0.06,22,32);
      T(ctx,'기여위험도  AR = '+ie+' − '+io+' = '+AR+' /1,000',bx,ry,ORA,FS(H,0.034,14,20),'left','700');
      T(ctx,'기여위험분율  AF = '+AR+' / '+ie+' × 100 = '+AF.toFixed(1)+' %',bx,ry+lh,GRN,FS(H,0.034,14,20),'left','700');
      T(ctx,'→ 노출군 환자 100명 중 약 '+Math.round(AF)+'명은 노출 탓, 노출을 없애면 그만큼 줄어듭니다.',bx,ry+lh*2,DIM,FS(H,0.026,11,15),'left');
      T(ctx,'배경위험(I₀)은 노출과 무관하게 원래 있던 위험 — RR이 \'몇 배\'라면 AR·AF는 \'얼마나·몇 %\'입니다.',bx,ry+lh*2.9,DIM,FS(H,0.024,10,14),'left');
      E.tapHint(0,0,'두 군 발생률로 AR·AF 변화',true);
      E.big('기여위험도 AR = '+AR+'/1,000 · 기여위험분율 AF = '+AF.toFixed(1)+'%',
            '노출로 늘어난 절대 위험(AR)과 노출군 환자 중 노출 탓 비율(AF)입니다.'); }
  },

  /* ── 13.4 스크리닝 — 민감도·특이도·예측도 ─────────── */
  { id:'hyg13_04',
    enter:function(E){ var self=this; this.s={A:90, B:10, C:10, D:90};
      E.controls('<div class="ctrl"><label>A 진양성 (질병O·검사+)</label><input type="range" id="s4a" min="10" max="100" step="1" value="90"><output id="s4ao">90</output></div>'
        +'<div class="ctrl"><label>B 위양성 (질병X·검사+)</label><input type="range" id="s4b" min="0" max="100" step="1" value="10"><output id="s4bo">10</output></div>');
      E.bind('#s4a','input',function(e){ self.s.A=+e.target.value; document.getElementById('s4ao').textContent=e.target.value; });
      E.bind('#s4b','input',function(e){ self.s.B=+e.target.value; document.getElementById('s4bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var A=s.A, B=s.B, C=s.C, D=s.D;              // C 위음성·D 진음성 고정
      var sens=A/(A+C)*100, spec=D/(B+D)*100, ppv=(A+B>0)?A/(A+B)*100:0;
      var y0=H*0.28, fx=W*0.07;
      T(ctx,'민감도 = A/(A+C) · 특이도 = D/(B+D) · 양성예측도 = A/(A+B)',fx,y0,TXT,FS(H,0.030,13,17),'left','700');
      // 2×2 표: 행=검사결과(+/−), 열=질병(유/무)
      var gx=W*0.20, gy=H*0.40, gw=W*0.30, gh=H*0.30;
      T(ctx,'질병 유무 × 검사결과 (C·D 고정)',gx+gw*0.5,gy-FS(H,0.045,18,26),DIM,FS(H,0.026,11,14),'center');
      grid2x2(ctx,gx,gy,gw,gh,['질병 있음','질병 없음'],['검사 +','검사 −'],
        [['A '+A,'B '+B],['C '+C,'D '+D]],W,H,null);
      // 결과 패널
      var rx=W*0.58, ry=H*0.40, lh=FS(H,0.06,22,32);
      var rows=[['민감도 (질병자를 +로)',sens.toFixed(1)+' %',ORA],
                ['특이도 (건강자를 −로)',spec.toFixed(1)+' %',BLU],
                ['양성예측도 (+가 실제 환자)',ppv.toFixed(1)+' %',GRN]];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        T(ctx,rows[i][0],rx,yy,DIM,FS(H,0.026,11,15),'left');
        T(ctx,rows[i][1],rx+W*0.34,yy,rows[i][2],FS(H,0.04,16,23),'right','700'); }
      T(ctx,'민감도↑ = 놓치지 않음(선별에 유리)',rx,ry+lh*3.4,DIM,FS(H,0.024,10,14),'left');
      T(ctx,'양성예측도는 유병률에 크게 좌우됨',rx,ry+lh*4.1,DIM,FS(H,0.024,10,14),'left');
      E.tapHint(0,0,'진양성 A·위양성 B를 조절',true);
      E.big('민감도 '+sens.toFixed(1)+'% · 특이도 '+spec.toFixed(1)+'% · 양성예측도 '+ppv.toFixed(1)+'%',
            '좋은 검사는 환자를 놓치지 않고(민감도) 건강자를 잘못 잡지 않습니다(특이도).'); }
  },

  /* ── 13.5 표준화사망비 SMR · 힐의 인과성 기준 ──────── */
  { id:'hyg13_05',
    enter:function(E){ var self=this; this.s={O:14, Ex:8};
      E.controls('<div class="ctrl"><label>관찰 사망자수 O (명)</label><input type="range" id="m5a" min="0" max="30" step="1" value="14"><output id="m5ao">14</output></div>'
        +'<div class="ctrl"><label>기대 사망자수 E (명)</label><input type="range" id="m5b" min="1" max="30" step="1" value="8"><output id="m5bo">8</output></div>');
      E.bind('#m5a','input',function(e){ self.s.O=+e.target.value; document.getElementById('m5ao').textContent=e.target.value; });
      E.bind('#m5b','input',function(e){ self.s.Ex=+e.target.value; document.getElementById('m5bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var SMR=s.O/s.Ex*100, vcol=SMR>105?RED:(SMR<95?GRN:DIM);
      var y0=H*0.27, fx=W*0.07;
      T(ctx,'표준화사망비  SMR = (관찰 사망자수 O ÷ 기대 사망자수 E) × 100',fx,y0,TXT,FS(H,0.030,13,17),'left','700');
      T(ctx,'SMR = ('+s.O+' / '+s.Ex+') × 100 = '+SMR.toFixed(0),fx,y0+FS(H,0.055,20,30),vcol,FS(H,0.04,16,23),'left','700');
      // SMR 게이지(100 기준선), 0~300 스케일
      var bx=fx, bw=W*0.52, bh=FS(H,0.06,22,32), by=y0+FS(H,0.10,36,52), mx=300;
      ctx.fillStyle='#1c2433'; RR_(ctx,bx,by,bw,bh,6); ctx.fill();
      ctx.fillStyle=vcol; RR_(ctx,bx,by,bw*Math.min(SMR,mx)/mx,bh,6); ctx.fill();
      var mk=bx+bw*100/mx;                          // 100 기준선
      ctx.strokeStyle=TXT; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(mk,by-4); ctx.lineTo(mk,by+bh+4); ctx.stroke();
      T(ctx,'100 (표준집단)',mk,by+bh+FS(H,0.03,12,17),DIM,FS(H,0.024,10,13),'center');
      T(ctx,SMR>105?'SMR>100 — 표준집단보다 사망 많음(초과사망)':(SMR<95?'SMR<100 — 표준집단보다 사망 적음':'SMR≈100 — 표준집단과 비슷'),
        bx,by-FS(H,0.016,6,10),vcol,FS(H,0.026,11,15),'left','600');
      // 힐(Hill)의 인과성 판단 기준 3×3
      var hy=H*0.62, hx=W*0.07, hw=W*0.86;
      T(ctx,'힐(Hill)의 인과성 판단 기준 — 통계적 연관을 인과로 볼 수 있는가',hx,hy-FS(H,0.02,8,12),AMB,FS(H,0.028,12,16),'left','600');
      var hills=['연관의 강도','일관성','특이성','시간성(원인이 먼저)','용량-반응 관계','생물학적 개연성','정합성','실험적 근거','유추'];
      var cols=3, cw=hw/cols, ch=FS(H,0.055,20,30), gapy=FS(H,0.012,5,8);
      for(var i=0;i<hills.length;i++){ var r=Math.floor(i/cols), c=i%cols;
        var x=hx+c*cw, yy=hy+r*(ch+gapy);
        var key=(i===3||i===4);                     // 시간성·용량반응 강조
        ctx.fillStyle=key?'rgba(242,189,85,0.14)':'rgba(255,255,255,0.04)';
        RR_(ctx,x,yy,cw-8,ch,7); ctx.fill();
        ctx.strokeStyle=key?AMB:'rgba(255,255,255,0.16)'; ctx.lineWidth=key?1.6:1; RR_(ctx,x,yy,cw-8,ch,7); ctx.stroke();
        T(ctx,hills[i],x+(cw-8)/2,yy+ch*0.62,key?AMB:TXT,FS(H,0.026,11,15),'center','600'); }
      E.tapHint(0,0,'관찰·기대 사망자수로 SMR 확인',true);
      E.big('표준화사망비 SMR = '+SMR.toFixed(0),
            '연령구조가 다른 집단의 사망을 표준집단(=100)에 맞춰 비교합니다 — 100 초과면 초과사망.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
