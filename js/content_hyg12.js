/* 산업위생기술사 제12장 — 필수 계산 유형 완성 (동작만. 텍스트=content/hyg12.json)
   필기 빈출 계산: 재해통계·근로생리(RMR)·인간공학(NIOSH)·분진침강(스토크스)·산업위생 통계.
   골든룰: 표시 수치는 전부 draw에서 실계산. */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  function lg(x){ return Math.log(x)/Math.LN10; }

  var scenes=[

  /* ── 12.1 산업재해 통계 ───────────────────────────── */
  { id:'hyg12_01',
    enter:function(E){ var self=this; this.s={n:4, L:7500, P:1300};
      E.controls('<div class="ctrl"><label>재해자수 (건/년)</label><input type="range" id="h1a" min="1" max="20" step="1" value="4"><output id="h1ao">4</output></div>'
        +'<div class="ctrl"><label>근로손실일수 (일)</label><input type="range" id="h1b" min="100" max="12000" step="100" value="7500"><output id="h1bo">7500</output></div>'
        +'<div class="ctrl"><label>평균 근로자수 (명)</label><input type="range" id="h1c" min="100" max="3000" step="50" value="1300"><output id="h1co">1300</output></div>');
      E.bind('#h1a','input',function(e){ self.s.n=+e.target.value; document.getElementById('h1ao').textContent=e.target.value; });
      E.bind('#h1b','input',function(e){ self.s.L=+e.target.value; document.getElementById('h1bo').textContent=e.target.value; });
      E.bind('#h1c','input',function(e){ self.s.P=+e.target.value; document.getElementById('h1co').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var hours=s.P*2400;                          // 1인 연 2,400시간 가정
      var FR=s.n/hours*1e6;                        // 도수율(빈도율)
      var SR=s.L/hours*1e3;                        // 강도율
      var yeon=s.n/s.P*1000;                       // 연천인율(재해자수 기준)
      var FSI=Math.sqrt(FR*SR);                    // 종합재해지수
      var y0=H*0.34, lh=FS(H,0.058,20,30), fx=W*0.10, fs=FS(H,0.030,13,17);
      T(ctx,'연근로총시간 = '+s.P.toLocaleString()+'명 × 2,400h = '+hours.toLocaleString()+' h',fx,y0,DIM,FS(H,0.028,12,15),'left');
      var rows=[
        ['도수율 (FR) = 재해건수 ÷ 연근로시간 × 10⁶', FR.toFixed(2), ORA],
        ['강도율 (SR) = 근로손실일수 ÷ 연근로시간 × 10³', SR.toFixed(2), BLU],
        ['연천인율 = 재해자수 ÷ 근로자수 × 1,000', yeon.toFixed(2), PNK],
        ['종합재해지수 (FSI) = √(FR × SR)', FSI.toFixed(2), GRN]];
      for(var i=0;i<rows.length;i++){ var yy=y0+lh*(i+1.1);
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,fx-6,yy-lh*0.62,W*0.80,lh*0.86,7); ctx.fill();
        T(ctx,rows[i][0],fx,yy,TXT,fs,'left');
        T(ctx,rows[i][1],fx+W*0.72,yy,rows[i][2],FS(H,0.036,14,20),'right','700'); }
      T(ctx,'도수율 ≈ 연천인율 ÷ 2.4 (환산 관계) — 지금 '+(yeon/2.4).toFixed(2)+' ≈ 도수율 '+FR.toFixed(2),fx,y0+lh*5.5,DIM,FS(H,0.026,13,14),'left');
      E.tapHint(0,0,'슬라이더로 재해·손실일·인원 조절',true);
      E.big('도수율 '+FR.toFixed(2)+' · 강도율 '+SR.toFixed(2)+' · 종합재해지수 '+FSI.toFixed(2),
            '같은 회사끼리 재해를 비교하는 세 지표 — 빈도(도수율)·크기(강도율)·종합(FSI)입니다.'); }
  },

  /* ── 12.2 근로생리 — RMR·실동률·계속작업 한계시간 ── */
  { id:'hyg12_02',
    enter:function(E){ var self=this; this.s={rmr:10};
      E.controls('<div class="ctrl"><label>에너지대사율 RMR</label><input type="range" id="h2a" min="0.5" max="10" step="0.5" value="10"><output id="h2ao">10</output></div>');
      E.bind('#h2a','input',function(e){ self.s.rmr=+e.target.value; document.getElementById('h2ao').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, r=s.rmr;
      var duty=Math.max(0,85-5*r);                       // 실동률(%) 사이토·오시마
      var logT=3.724-3.25*lg(r);                         // log(계속작업 한계시간[분])
      var Tlim=Math.pow(10,logT);
      // 작업강도 분류
      var grades=[['경작업',0,1,GRN],['중등작업',1,2,BLU],['강작업',2,4,AMB],['격심작업',4,7,ORA],['최격심',7,99,RED]];
      var gname=''; for(var i=0;i<grades.length;i++){ if(r>grades[i][1]&&r<=grades[i][2]) gname=grades[i][0]; }
      if(r<=1) gname='경작업';
      var y0=H*0.34, fs=FS(H,0.032,14,19);
      // 실동률 막대
      var bx=W*0.10, bw=W*0.62, by=y0, bh=FS(H,0.05,18,26);
      T(ctx,'실동률(%) = 85 − 5 × RMR',bx,by-8,DIM,FS(H,0.028,12,15),'left');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,by,bw,bh,6); ctx.fill();
      ctx.fillStyle=BLU; RR(ctx,bx,by,bw*duty/100,bh,6); ctx.fill();
      T(ctx,duty.toFixed(0)+' %',bx+bw+10,by+bh*0.72,BLU,fs,'left','700');
      // 계속작업 한계시간
      var y2=by+bh+FS(H,0.09,30,52);
      T(ctx,'log(계속작업 한계시간) = 3.724 − 3.25 × log(RMR)',bx,y2-8,DIM,FS(H,0.028,12,15),'left');
      T(ctx,'계속작업 한계시간 = 10^'+logT.toFixed(3)+' = '+Tlim.toFixed(2)+' 분',bx,y2+FS(H,0.03,14,19),ORA,fs,'left','700');
      // 작업강도 밴드
      var y3=y2+FS(H,0.12,40,66), gx=bx, gw=W*0.72/5;
      T(ctx,'작업강도 분류 (RMR 기준) — 현재: '+gname,bx,y3-8,DIM,FS(H,0.028,12,15),'left');
      for(i=0;i<grades.length;i++){ var on=(grades[i][0]===gname);
        ctx.fillStyle=on?grades[i][3]:'rgba(255,255,255,0.05)'; RR(ctx,gx+gw*i,y3,gw-6,FS(H,0.05,18,26),6); ctx.fill();
        T(ctx,grades[i][0],gx+gw*i+(gw-6)/2,y3+FS(H,0.033,14,18),on?'#0b1220':DIM,FS(H,0.024,13,15),'center','600'); }
      E.tapHint(0,0,'RMR을 올려 실동률·한계시간 변화 보기',true);
      E.big('RMR '+r.toFixed(1)+' → 실동률 '+duty.toFixed(0)+'% · 계속작업 한계 '+Tlim.toFixed(2)+'분',
            '일이 힘들수록(RMR↑) 계속 일할 수 있는 시간이 급격히 줄어듭니다.'); }
  },

  /* ── 12.3 인간공학 — NIOSH 들기지수 ── */
  { id:'hyg12_03',
    enter:function(E){ var self=this; this.s={w:10, hh:40};
      E.controls('<div class="ctrl"><label>물체 무게 W (kg)</label><input type="range" id="h3a" min="3" max="30" step="1" value="10"><output id="h3ao">10</output></div>'
        +'<div class="ctrl"><label>수평거리 H (cm)</label><input type="range" id="h3b" min="25" max="63" step="1" value="40"><output id="h3bo">40</output></div>');
      E.bind('#h3a','input',function(e){ self.s.w=+e.target.value; document.getElementById('h3ao').textContent=e.target.value; });
      E.bind('#h3b','input',function(e){ self.s.hh=+e.target.value; document.getElementById('h3bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var LC=23;                          // 부하상수
      var HM=Math.min(1,25/s.hh);         // 수평 승수
      var VM=1, DM=0.91, AM=1, FM=0.45, CM=0.95;   // 예시 고정 승수(V=75·D=50·A=0·5회/분·손잡이 보통)
      var RWL=LC*HM*VM*DM*AM*FM*CM;
      var LI=s.w/RWL;
      var risk=LI>1;
      var y0=H*0.33, fx=W*0.09, fs=FS(H,0.030,13,17);
      T(ctx,'RWL = LC × HM × VM × DM × AM × FM × CM',fx,y0,TXT,FS(H,0.033,14,18),'left','700');
      var mult=[['LC 부하상수',LC.toFixed(0)],['HM = 25/H = 25/'+s.hh, HM.toFixed(3)],['VM(수직)',VM.toFixed(2)],['DM(이동)',DM.toFixed(2)],['AM(비틀림)',AM.toFixed(2)],['FM(빈도)',FM.toFixed(2)],['CM(손잡이)',CM.toFixed(2)]];
      var lh=FS(H,0.045,15,22);
      for(var i=0;i<mult.length;i++){ var yy=y0+lh*(i+1);
        T(ctx,mult[i][0],fx,yy,DIM,FS(H,0.026,13,14),'left'); T(ctx,mult[i][1],fx+W*0.28,yy,BLU,FS(H,0.028,12,15),'right','600'); }
      var rx=W*0.52, ry=y0+lh;
      T(ctx,'권장무게한계',rx,ry,DIM,fs,'left'); T(ctx,'RWL = '+RWL.toFixed(2)+' kg',rx,ry+FS(H,0.035,15,20),GRN,FS(H,0.038,15,21),'left','700');
      T(ctx,'들기지수  LI = W / RWL = '+s.w+' / '+RWL.toFixed(2),rx,ry+lh*2.4,DIM,fs,'left');
      T(ctx,'LI = '+LI.toFixed(2),rx,ry+lh*2.4+FS(H,0.04,16,23),risk?RED:GRN,FS(H,0.05,20,30),'left','700');
      ctx.fillStyle=risk?'rgba(240,136,138,0.16)':'rgba(143,227,181,0.16)'; RR(ctx,rx,ry+lh*3.6,W*0.36,FS(H,0.06,22,32),8); ctx.fill();
      T(ctx,risk?'LI > 1 — 요통 위험, 개선 필요':'LI ≤ 1 — 대부분 근로자에게 안전',rx+W*0.18,ry+lh*3.6+FS(H,0.04,16,22),risk?RED:GRN,fs,'center','600');
      E.tapHint(0,0,'무게·수평거리를 바꿔 LI 판정 보기',true);
      E.big('RWL '+RWL.toFixed(2)+' kg · 들기지수 LI = '+LI.toFixed(2),
            'LI가 1을 넘으면 그 들기 작업은 상당수 근로자에게 요통 위험입니다.'); }
  },

  /* ── 12.4 분진의 물리 — 스토크스 침강·공기역학직경 ── */
  { id:'hyg12_04',
    enter:function(E){ var self=this; this.s={d:30, rho:1.5};
      E.controls('<div class="ctrl"><label>입경 d (µm)</label><input type="range" id="h4a" min="1" max="100" step="1" value="30"><output id="h4ao">30</output></div>'
        +'<div class="ctrl"><label>밀도 ρ (g/cm³)</label><input type="range" id="h4b" min="0.5" max="8" step="0.1" value="1.5"><output id="h4bo">1.5</output></div>');
      E.bind('#h4a','input',function(e){ self.s.d=+e.target.value; document.getElementById('h4ao').textContent=e.target.value; });
      E.bind('#h4b','input',function(e){ self.s.rho=+e.target.value; document.getElementById('h4bo').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var V=0.003*s.rho*s.d*s.d;            // 종말침강속도 cm/s (상온 공기 간이 스토크스)
      var dae=s.d*Math.sqrt(s.rho);         // 공기역학직경
      var resp=(s.d<=10);                   // 흡입성/호흡성 대략
      var y0=H*0.33, fx=W*0.09, fs=FS(H,0.033,14,19);
      T(ctx,'스토크스 종말침강속도  V = 0.003 × ρ × d²',fx,y0,TXT,FS(H,0.033,14,18),'left','700');
      T(ctx,'V = 0.003 × '+s.rho.toFixed(1)+' × '+s.d+'² = '+V.toFixed(3)+' cm/s',fx,y0+FS(H,0.05,18,26),GRN,fs,'left','700');
      T(ctx,'공기역학직경  d_ae = d × √ρ = '+s.d+' × √'+s.rho.toFixed(1)+' = '+dae.toFixed(1)+' µm',fx,y0+FS(H,0.10,36,52),BLU,fs,'left','700');
      // 낙하 입자 시각화(속도 비례 화살표)
      var px=W*0.72, top=H*0.40, bot=H*0.86;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,top); ctx.lineTo(px,bot); ctx.stroke();
      var pr=Math.max(4,Math.min(26,s.d*0.5));
      ctx.fillStyle=resp?PNK:AMB; ctx.beginPath(); ctx.arc(px,top+FS(H,0.06,20,34),pr,0,7); ctx.fill();
      // 속도 화살표(길이 ∝ V, 로그 압축)
      var alen=Math.min(bot-top-30, 18+Math.log(1+V)*FS(H,0.06,20,40));
      ctx.strokeStyle=GRN; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px,top+FS(H,0.06,20,34)+pr); ctx.lineTo(px,top+FS(H,0.06,20,34)+pr+alen); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); var ay=top+FS(H,0.06,20,34)+pr+alen; ctx.moveTo(px,ay+7); ctx.lineTo(px-5,ay-2); ctx.lineTo(px+5,ay-2); ctx.fill();
      T(ctx,'낙하 ∝ V',px+14,top+FS(H,0.06,20,34)+pr+alen*0.6,DIM,FS(H,0.026,13,14),'left');
      T(ctx,resp?'d ≤ 10 µm — 호흡기 도달(호흡성 영역)':'d > 10 µm — 대부분 상기도서 걸러짐',fx,y0+FS(H,0.16,58,86),resp?PNK:DIM,FS(H,0.028,12,15),'left');
      E.tapHint(0,0,'입경·밀도를 바꿔 침강속도 보기',true);
      E.big('침강속도 V = '+V.toFixed(3)+' cm/s · 공기역학직경 '+dae.toFixed(1)+' µm',
            '입자가 클수록(d²) 빨리 가라앉습니다 — 작은 입자만 공기 중에 오래 떠 폐에 닿습니다.'); }
  },

  /* ── 12.5 산업위생 통계 — 대표값·산포 직접계산 ── */
  { id:'hyg12_05',
    enter:function(E){ var self=this; this.s={last:190};
      E.controls('<div class="ctrl"><label>10번째 측정치 (ppm)</label><input type="range" id="h5a" min="100" max="300" step="5" value="190"><output id="h5ao">190</output></div>');
      E.bind('#h5a','input',function(e){ self.s.last=+e.target.value; document.getElementById('h5ao').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var data=[51,53,61,67,72,122,75,110,93,s.last], n=data.length;
      var sum=0,i; for(i=0;i<n;i++) sum+=data[i]; var mean=sum/n;
      var ss=0; for(i=0;i<n;i++) ss+=(data[i]-mean)*(data[i]-mean); var SD=Math.sqrt(ss/(n-1));
      var CV=SD/mean*100;
      var slog=0; for(i=0;i<n;i++) slog+=Math.log(data[i]); var GM=Math.exp(slog/n);
      var sl2=0, mlog=slog/n; for(i=0;i<n;i++){ var dv=Math.log(data[i])-mlog; sl2+=dv*dv; } var GSD=Math.exp(Math.sqrt(sl2/(n-1)));
      // 막대
      var bx=W*0.08, bw=W*0.60, by=H*0.62, bh=H*0.26, mx=Math.max.apply(null,data)*1.05;
      T(ctx,'측정치 10개 (ppm) — 파랑=측정값 · 금선=산술평균 · 초록선=기하평균',bx,by-bh-FS(H,0.02,10,14),DIM,FS(H,0.026,13,14),'left');
      var cw=bw/n;
      for(i=0;i<n;i++){ var hh=data[i]/mx*bh; ctx.fillStyle=BLU; RR(ctx,bx+cw*i+2,by-hh,cw-5,hh,3); ctx.fill();
        T(ctx,''+data[i],bx+cw*i+cw/2,by+FS(H,0.028,12,15),DIM,FS(H,0.022,12,14),'center'); }
      function lineAt(v,col,lab){ var yy=by-v/mx*bh; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(bx,yy); ctx.lineTo(bx+bw,yy); ctx.stroke(); ctx.setLineDash([]); T(ctx,lab,bx+bw+6,yy+4,col,FS(H,0.026,13,14),'left','600'); }
      lineAt(mean,AMB,'M '+mean.toFixed(1)); lineAt(GM,GRN,'GM '+GM.toFixed(1));
      // 통계값 패널
      var px=W*0.72, py=H*0.40, lh=FS(H,0.05,18,26);
      var st=[['산술평균 M',mean.toFixed(1),AMB],['표준편차 SD',SD.toFixed(1),BLU],['기하평균 GM',GM.toFixed(1),GRN],['기하표준편차 GSD',GSD.toFixed(2),PNK],['변이계수 CV(%)',CV.toFixed(1),ORA]];
      for(i=0;i<st.length;i++){ var yy=py+lh*i; T(ctx,st[i][0],px,yy,DIM,FS(H,0.026,13,14),'left'); T(ctx,st[i][1],px+W*0.24,yy,st[i][2],FS(H,0.034,14,19),'right','700'); }
      T(ctx,'GM('+GM.toFixed(1)+') < M('+mean.toFixed(1)+') — 대수정규분포의 특징',px,py+lh*5.3,DIM,FS(H,0.024,12,15),'left');
      E.tapHint(0,0,'10번째 값을 바꿔 통계량 변화 보기',true);
      E.big('M '+mean.toFixed(1)+' · SD '+SD.toFixed(1)+' · GM '+GM.toFixed(1)+' · GSD '+GSD.toFixed(2),
            '노출 자료는 대수정규분포라, 대표값은 산술평균이 아니라 기하평균으로 봅니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
