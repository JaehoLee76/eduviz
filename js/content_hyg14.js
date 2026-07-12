/* 산업위생기술사 제14장 — 실내환경과 환기·집진 심화 (동작만. 텍스트=content/hyg14.json)
   실내공기질 필요환기량·다중이용시설 관리기준·송풍기 상사법칙·공기동력/효율·집진장치 효율.
   골든룰: 화면 표시 수치는 전부 draw에서 실계산(하드코딩 금지). */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  // 글자 크기·간격 = H 비례 + 클램프(낮은 뷰포트에서 겹침·잘림 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,H*frac)); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
  function fit(ctx,txt,weight,base,mn,maxW){ var f=base; ctx.font=weight+f+'px sans-serif';
    while(f>mn && ctx.measureText(txt).width>maxW){ f--; ctx.font=weight+f+'px sans-serif'; } return f; }

  var scenes=[

  /* ── 14.1 실내공기질 필요환기량 (CO₂ 기준) ───────────── */
  { id:'hyg14_01',
    enter:function(E){ var self=this; this.s={N:30, M:0.021};
      E.controls('<div class="ctrl"><label>재실 인원 N (명)</label><input type="range" id="a1" min="5" max="60" step="1" value="30"><output id="a1o">30</output></div>'
        +'<div class="ctrl"><label>1인 CO₂ 발생량 M (m³/hr·인)</label><input type="range" id="a2" min="0.012" max="0.030" step="0.001" value="0.021"><output id="a2o">0.021</output></div>');
      E.bind('#a1','input',function(e){ self.s.N=+e.target.value; document.getElementById('a1o').textContent=e.target.value; });
      E.bind('#a2','input',function(e){ self.s.M=+e.target.value; document.getElementById('a2o').textContent=(+e.target.value).toFixed(3); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var C=0.1, Co=0.03;                       // 실내허용 0.1%(1000ppm) · 외기 0.03%(300ppm) 고정
      var denom=(C-Co)/100;                      // 농도차(분율)
      var per=s.M/denom;                         // 1인당 필요환기량 m³/hr
      var total=s.N*per;                         // 총 필요환기량 m³/hr
      var y0=H*0.285, fx=W*0.07, fs=FS(H,0.030,13,17);
      T(ctx,'필요환기량  Q = 1인 CO₂ 발생량 M ÷ (실내허용 C − 외기 Co)',fx,y0,TXT,FS(H,0.032,13,18),'left','700');
      T(ctx,'1인당 Q = '+s.M.toFixed(3)+' ÷ (0.1−0.03)/100 = '+s.M.toFixed(3)+' ÷ '+denom.toFixed(4)+' = '+per.toFixed(1)+' m³/hr·인',fx,y0+FS(H,0.052,19,29),BLU,fs,'left','600');
      T(ctx,'총 필요환기량 = '+s.N+'명 × '+per.toFixed(1)+' = '+total.toFixed(0)+' m³/hr',fx,y0+FS(H,0.100,36,56),GRN,FS(H,0.036,15,21),'left','700');
      // 방 다이어그램 — 재실 인원 점 + 급기 화살표(폭 ∝ 총환기량)
      var rx=W*0.09, rw=W*0.58, ry=H*0.50, rh=Math.min(H*0.32, H*0.86-H*0.50);
      ctx.fillStyle='rgba(122,184,255,0.06)'; ctx.strokeStyle='rgba(122,184,255,0.5)'; ctx.lineWidth=1.6; RR(ctx,rx,ry,rw,rh,10); ctx.fill(); ctx.stroke();
      T(ctx,'실내 CO₂ ≤ 0.1% 유지',rx+rw/2,ry+FS(H,0.035,14,19),DIM,FS(H,0.026,11,14),'center');
      // 인원 점(그리드)
      var cols=Math.ceil(Math.sqrt(s.N)), rows=Math.ceil(s.N/cols), cnt=0;
      var gx0=rx+rw*0.10, gy0=ry+rh*0.30, gw=rw*0.80, gh=rh*0.55;
      var dr=Math.max(3,Math.min(9, gw/cols*0.28));
      for(var r2=0;r2<rows;r2++){ for(var c2=0;c2<cols && cnt<s.N;c2++){ cnt++;
        var dx=gx0+(cols>1?gw*c2/(cols-1||1):gw/2), dy=gy0+(rows>1?gh*r2/(rows-1||1):gh/2);
        ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(dx,dy,dr,0,7); ctx.fill(); } }
      // 급기 화살표(왼쪽 → 방), 두께 ∝ 총환기량
      var aw=Math.max(6,Math.min(rh*0.5, total/1800*rh*0.5)), acy=ry+rh*0.5, ax0=rx-W*0.055;
      ctx.fillStyle='rgba(143,227,181,0.85)';
      ctx.beginPath(); ctx.moveTo(ax0,acy-aw/2); ctx.lineTo(rx-2,acy-aw/2); ctx.lineTo(rx-2,acy-aw); ctx.lineTo(rx+W*0.02,acy); ctx.lineTo(rx-2,acy+aw); ctx.lineTo(rx-2,acy+aw/2); ctx.lineTo(ax0,acy+aw/2); ctx.closePath(); ctx.fill();
      T(ctx,'급기 '+total.toFixed(0),ax0-4,acy-aw-FS(H,0.012,4,8),GRN,FS(H,0.026,11,14),'left','600');
      T(ctx,'m³/hr',ax0-4,acy-aw+FS(H,0.02,8,13),GRN,FS(H,0.024,10,13),'left');
      // 우측 요약 패널
      var px=W*0.71, py=H*0.52, lh=FS(H,0.06,22,32);
      var st=[['재실 인원',s.N+' 명',PNK],['1인 발생 M',s.M.toFixed(3)+' m³/hr',BLU],['1인당 Q',per.toFixed(1)+' m³/hr',AMB],['총 필요환기량',total.toFixed(0)+' m³/hr',GRN]];
      for(var i=0;i<st.length;i++){ var yy=py+lh*i; T(ctx,st[i][0],px,yy,DIM,FS(H,0.026,11,14),'left'); T(ctx,st[i][1],px,yy+FS(H,0.032,13,18),st[i][2],FS(H,0.032,13,19),'left','700'); }
      E.tapHint(0,0,'슬라이더로 인원·CO₂ 발생량 조절',true);
      E.big('1인당 '+per.toFixed(1)+' m³/hr · 총 '+total.toFixed(0)+' m³/hr',
            'CO₂를 허용농도 이하로 희석하는 데 필요한 바깥공기량 — 인원이 늘면 그만큼 더 넣어야 합니다.'); }
  },

  /* ── 14.2 다중이용시설 관리기준·새집증후군 (탭 단계·커스텀 표) ── */
  { id:'hyg14_02',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, W=E.W, H=E.H, ctx=E.ctx;
      function head(txt,col){ T(ctx,txt,W/2,H*0.245,col||AMB,FS(H,0.034,15,20),'center','700'); }
      function table(rows,colTitles,top){
        var x=W*0.08, w=W*0.84, n=rows.length, rowH=Math.min(FS(H,0.075,26,40),(H*0.86-top)/(n+1));
        var cx=[x+w*0.02, x+w*0.42, x+w*0.68];
        // 헤더
        ctx.fillStyle='rgba(242,189,85,0.14)'; RR(ctx,x,top,w,rowH,7); ctx.fill();
        for(var h=0;h<3;h++) T(ctx,colTitles[h],cx[h],top+rowH*0.66,AMB,FS(H,0.026,11,15),'left','700');
        for(var i=0;i<n;i++){ var y=top+rowH*(i+1);
          if(i%2) { ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,x,y,w,rowH,5); ctx.fill(); }
          var f0=fit(ctx,rows[i][0],'600 ',FS(H,0.028,12,16),9,w*0.38);
          T(ctx,rows[i][0],cx[0],y+rowH*0.66,TXT,f0,'left','600');
          T(ctx,rows[i][1],cx[1],y+rowH*0.66,GRN,FS(H,0.028,12,16),'left','700');
          var f2=fit(ctx,rows[i][2],'',FS(H,0.024,10,14),8,w*0.30);
          T(ctx,rows[i][2],cx[2],y+rowH*0.66,DIM,f2,'left'); }
      }
      function panel(lines,top){ var x=W*0.09, w=W*0.82;
        var h=Math.min(H*0.86-top, lines.length*FS(H,0.062,22,34)+FS(H,0.04,14,22));
        ctx.fillStyle='rgba(122,184,255,0.06)'; ctx.strokeStyle='rgba(122,184,255,0.45)'; ctx.lineWidth=1.5; RR(ctx,x,top,w,h,10); ctx.fill(); ctx.stroke();
        for(var i=0;i<lines.length;i++){ var f=fit(ctx,lines[i][0],'',FS(H,0.028,12,16),10,w-W*0.06);
          T(ctx,lines[i][0],x+W*0.03,top+FS(H,0.055,20,30)*(i+1),lines[i][1]||TXT,f,'left',lines[i][2]||''); } }
      var big, sub;
      if(st===0){ head('실내공기질 — 유지기준과 권고기준',AMB);
        panel([['유지기준 = 반드시 지켜야 하는 법적 기준(위반 시 개선명령·과태료)',TXT,'600'],
               ['  · 다중이용시설: 지하역사·대합실·의료·보육·도서관 등',DIM,''],
               ['권고기준 = 권장 목표치(자율 관리 유도, 미세관리 항목)',TXT,'600'],
               ['  · 실내공기질 관리법이 시설군별로 기준을 규정합니다',DIM,'']], H*0.30);
        big='두 겹의 기준 — 유지기준과 권고기준'; sub='유지기준은 반드시 지켜야 하는 법적 한계이고, 권고기준은 더 나은 공기질을 위한 권장 목표입니다. D키(또는 화면 탭)로 항목별 기준을 보세요.'; }
      else if(st===1){ head('유지기준 (반드시 준수) — 다중이용시설',GRN);
        table([['미세먼지 PM10','100 µg/m³','호흡성 분진'],
               ['초미세먼지 PM2.5','50 µg/m³','폐 깊이 침투'],
               ['이산화탄소 CO₂','1,000 ppm','환기 상태 지표'],
               ['폼알데하이드 HCHO','100 µg/m³','새집·발암성'],
               ['총부유세균','800 CFU/m³','의료·보육시설'],
               ['일산화탄소 CO','10 ppm','연소·질식 위험']], ['오염물질','유지기준(이하)','의미'], H*0.29);
        big='유지기준 — 여섯 항목의 상한선'; sub='PM10 100·PM2.5 50 µg/m³, CO₂ 1,000 ppm, HCHO 100 µg/m³, 총부유세균 800 CFU/m³, CO 10 ppm. CO₂ 1,000 ppm은 "환기가 충분한가"의 핵심 지표입니다.'; }
      else if(st===2){ head('권고기준 (권장 목표) — 미세관리 항목',BLU);
        table([['이산화질소 NO₂','0.1 ppm','연소가스'],
               ['라돈 Rn','148 Bq/m³','자연방사성·폐암'],
               ['총휘발성유기화합물 TVOC','500 µg/m³','건축자재 방출'],
               ['곰팡이','500 CFU/m³','습도 관리']], ['오염물질','권고기준(이하)','의미'], H*0.30);
        big='권고기준 — 라돈·TVOC·곰팡이'; sub='NO₂ 0.1 ppm, 라돈 148 Bq/m³, TVOC 500 µg/m³, 곰팡이 500 CFU/m³. 라돈은 지하·화강암 지반에서, TVOC는 건축자재·가구에서 주로 나옵니다.'; }
      else if(st===3){ head('새집증후군 — 신축이 뿜는 화학물질',ORA);
        panel([['신축·리모델링 직후 건축자재·접착제·마감재에서',TXT,'600'],
               ['HCHO(폼알데하이드)·VOC가 다량 방출됩니다.',ORA,'700'],
               ['증상: 눈·코·목 자극, 두통, 현기증, 아토피·천식 악화',DIM,''],
               ['방출량은 시공 초기에 크고, 온도가 높을수록 늘어납니다',DIM,''],
               ['→ 온도↑ 는 방출을 "빨리" 끝내는 데 이용할 수 있습니다',GRN,'600']], H*0.30);
        big='새집증후군 — 자재가 뿜는 HCHO·VOC'; sub='신축 건물의 자재·접착제에서 폼알데하이드와 휘발성유기화합물이 방출되어 눈·코 자극, 두통, 아토피를 일으킵니다. 온도가 높을수록 방출이 빨라집니다.'; }
      else { head('대책 — 베이크아웃과 환기',GRN);
        panel([['베이크아웃(Bake-out): 입주 전, 창을 닫고 난방으로',TXT,'600'],
               ['실내온도를 33~38℃로 5~6시간 유지 → 창을 열어 환기',ORA,'700'],
               ['이 가열–환기를 여러 번 반복해 VOC 방출을 가속·배출',DIM,''],
               ['일상 관리: 충분한 환기, 저방출(친환경) 자재 선택,',TXT,'600'],
               ['습도 40~60% 유지로 곰팡이·집먼지진드기 억제',DIM,'']], H*0.30);
        big='베이크아웃 — 미리 데워서 빼낸다'; sub='입주 전 실내를 33~38℃로 데워 자재 속 VOC 방출을 앞당긴 뒤 환기로 배출하는 방법입니다. 면접에서는 "저방출 자재 선택 + 환기"의 병행을 강조하면 좋습니다.'; }
      E.tapHint(0,0,'다음 단계',true);
      E.big(big, sub); }
  },

  /* ── 14.3 송풍기 상사법칙 (풍량∝N · 정압∝N² · 동력∝N³) ── */
  { id:'hyg14_03',
    enter:function(E){ var self=this; this.s={r:1.3};
      E.controls('<div class="ctrl"><label>회전수비 N₂/N₁</label><input type="range" id="c1" min="0.5" max="1.5" step="0.05" value="1.3"><output id="c1o">1.30</output></div>');
      E.bind('#c1','input',function(e){ self.s.r=+e.target.value; document.getElementById('c1o').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, r=s.r;
      var Q1=30, P1=50, L1=0.5;                  // 1,000rpm 기준값
      var Q2=Q1*r, P2=P1*r*r, L2=L1*r*r*r;       // 상사법칙 실계산
      // 곡선 플롯 — 배율 f=r^k (k=1,2,3), 세로 정규화
      var px=W*0.09, py=H*0.32, pw=W*0.56, ph=Math.min(H*0.44, H*0.80-H*0.32);
      var rmin=0.5, rmax=1.5, fmax=Math.pow(rmax,3);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+ph); ctx.lineTo(px+pw,py+ph); ctx.stroke();
      T(ctx,'배율',px,py-FS(H,0.012,4,9),DIM,FS(H,0.024,10,13),'left');
      T(ctx,'N₂/N₁',px+pw,py+ph+FS(H,0.03,12,17),DIM,FS(H,0.024,10,13),'right');
      // N=1 기준 세로선
      var x1=px+pw*(1-rmin)/(rmax-rmin);
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x1,py); ctx.lineTo(x1,py+ph); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'1.0',x1,py+ph+FS(H,0.03,12,17),DIM,FS(H,0.022,10,12),'center');
      var cols=[ORA,BLU,GRN], labs=['풍량 ∝ N','정압 ∝ N²','동력 ∝ N³'];
      for(var k=1;k<=3;k++){ ctx.strokeStyle=cols[k-1]; ctx.lineWidth=2.4; ctx.beginPath();
        for(var t=0;t<=40;t++){ var rr=rmin+(rmax-rmin)*t/40, f=Math.pow(rr,k);
          var X=px+pw*(rr-rmin)/(rmax-rmin), Y=py+ph-ph*(f/fmax);
          if(t===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
        // 현재 점
        var fc=Math.pow(r,k), Xc=px+pw*(r-rmin)/(rmax-rmin), Yc=py+ph-ph*(fc/fmax);
        ctx.fillStyle=cols[k-1]; ctx.beginPath(); ctx.arc(Xc,Yc,FS(H,0.01,4,6),0,7); ctx.fill();
        T(ctx,labs[k-1],px+pw*0.04,py+FS(H,0.045,16,24)*k,cols[k-1],FS(H,0.026,11,15),'left','600'); }
      // 우측 계산 패널
      var qx=W*0.70, qy=H*0.36, lh=FS(H,0.072,26,40);
      T(ctx,'회전수비 r = '+r.toFixed(2),qx,qy-FS(H,0.02,8,13),TXT,FS(H,0.03,13,17),'left','700');
      var st=[['풍량  Q₂ = Q₁·r',Q1+'×'+r.toFixed(2)+' = '+Q2.toFixed(1)+' m³/min',ORA],
              ['정압  P₂ = P₁·r²',P1+'×'+(r*r).toFixed(3)+' = '+P2.toFixed(1)+' mmAq',BLU],
              ['동력  L₂ = L₁·r³',L1+'×'+(r*r*r).toFixed(3)+' = '+L2.toFixed(2)+' kW',GRN]];
      for(var i=0;i<st.length;i++){ var yy=qy+lh*i+FS(H,0.05,18,26);
        T(ctx,st[i][0],qx,yy,DIM,FS(H,0.026,11,15),'left');
        T(ctx,st[i][1],qx,yy+FS(H,0.033,14,19),st[i][2],FS(H,0.03,13,18),'left','700'); }
      E.tapHint(0,0,'슬라이더로 회전수비를 바꿔 세 곡선 비교',true);
      E.big('r='+r.toFixed(2)+' → 풍량 '+Q2.toFixed(1)+' · 정압 '+P2.toFixed(1)+' · 동력 '+L2.toFixed(2),
            '회전수를 조금만 올려도 동력은 세제곱으로 뛴다 — 에너지 관리의 핵심입니다.'); }
  },

  /* ── 14.4 송풍기 공기동력·소요동력·효율 ── */
  { id:'hyg14_04',
    enter:function(E){ var self=this; this.s={Q:300, P:120};
      E.controls('<div class="ctrl"><label>풍량 Q (m³/min)</label><input type="range" id="d1" min="50" max="600" step="10" value="300"><output id="d1o">300</output></div>'
        +'<div class="ctrl"><label>유효전압 Ptf (mmH₂O)</label><input type="range" id="d2" min="20" max="250" step="10" value="120"><output id="d2o">120</output></div>');
      E.bind('#d1','input',function(e){ self.s.Q=+e.target.value; document.getElementById('d1o').textContent=e.target.value; });
      E.bind('#d2','input',function(e){ self.s.P=+e.target.value; document.getElementById('d2o').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var eta=0.60;                              // 송풍기 효율(예시 고정)
      var air=s.Q*s.P/6120;                      // 공기동력 kW
      var fan=air/eta;                           // 송풍기 소요동력 kW
      var y0=H*0.30, fx=W*0.07, fs=FS(H,0.030,13,17);
      T(ctx,'공기동력(kW) = Q(m³/min) × Ptf(mmH₂O) ÷ 6,120',fx,y0,TXT,FS(H,0.032,13,18),'left','700');
      T(ctx,'= '+s.Q+' × '+s.P+' ÷ 6,120 = '+air.toFixed(2)+' kW',fx,y0+FS(H,0.05,18,28),GRN,FS(H,0.034,14,20),'left','700');
      T(ctx,'송풍기 소요동력 = 공기동력 ÷ 효율(η='+eta.toFixed(2)+') = '+air.toFixed(2)+' ÷ 0.6 = '+fan.toFixed(2)+' kW',fx,y0+FS(H,0.10,36,56),ORA,fs,'left','700');
      // 막대 비교 — 공기동력 vs 소요동력(효율 손실이 눈에 보이게)
      var bx=W*0.09, bw=W*0.72, by=H*0.52, bh=FS(H,0.075,26,40), gap=FS(H,0.10,36,54);
      var mx=Math.max(fan,0.001)*1.12;
      function bar(y,val,col,lab){ ctx.fillStyle='#1c2433'; RR(ctx,bx,y,bw,bh,7); ctx.fill();
        ctx.fillStyle=col; RR(ctx,bx,y,bw*val/mx,bh,7); ctx.fill();
        T(ctx,lab,bx,y-FS(H,0.012,5,9),DIM,FS(H,0.026,11,14),'left');
        T(ctx,val.toFixed(2)+' kW',bx+bw*val/mx+10,y+bh*0.68,col,FS(H,0.032,13,19),'left','700'); }
      bar(by,air,GRN,'공기동력(공기에 전달된 유효 동력)');
      bar(by+gap,fan,ORA,'송풍기 소요동력(모터가 내야 하는 동력)');
      T(ctx,'차이 '+(fan-air).toFixed(2)+' kW = 효율 손실(축·베어링·누기 등) — η가 낮을수록 소요동력↑',bx,by+gap+bh+FS(H,0.05,18,26),DIM,FS(H,0.026,11,14),'left');
      E.tapHint(0,0,'슬라이더로 풍량·유효전압 조절',true);
      E.big('공기동력 '+air.toFixed(2)+' kW · 소요동력 '+fan.toFixed(2)+' kW',
            '공기에 실제로 전달되는 힘이 공기동력, 여기에 효율을 나눈 것이 모터가 내야 할 소요동력입니다.'); }
  },

  /* ── 14.5 집진장치 — 원리와 효율(단·직렬·집진방식 비교) ── */
  { id:'hyg14_05',
    enter:function(E){ var self=this; this.s={e1:80, e2:90};
      E.controls('<div class="ctrl"><label>1차 집진효율 η₁ (%)</label><input type="range" id="e1" min="50" max="99" step="1" value="80"><output id="e1o">80</output></div>'
        +'<div class="ctrl"><label>2차 집진효율 η₂ (%)</label><input type="range" id="e2" min="50" max="99" step="1" value="90"><output id="e2o">90</output></div>');
      E.bind('#e1','input',function(e){ self.s.e1=+e.target.value; document.getElementById('e1o').textContent=e.target.value; });
      E.bind('#e2','input',function(e){ self.s.e2=+e.target.value; document.getElementById('e2o').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Ci=1000;                                  // 입구 농도 기준(mg/m³)
      var a1=Ci*(1-s.e1/100);                       // 1차 통과 후
      var a2=a1*(1-s.e2/100);                        // 2차 통과 후(최종)
      var tot=(Ci-a2)/Ci*100;                        // 총집진효율(직렬)
      var y0=H*0.285, fx=W*0.07;
      T(ctx,'집진효율 η = (입구농도 − 출구농도) ÷ 입구농도 × 100',fx,y0,TXT,FS(H,0.030,13,17),'left','700');
      T(ctx,'총집진효율(직렬) = 1 − (1−η₁)(1−η₂) = 1 − '+(1-s.e1/100).toFixed(2)+'×'+(1-s.e2/100).toFixed(2)+' = '+tot.toFixed(1)+' %',fx,y0+FS(H,0.05,18,28),GRN,FS(H,0.032,13,19),'left','700');
      // 직렬 2단 농도 막대(입구→1차→최종)
      var by=H*0.42, bh=FS(H,0.05,18,26), bx=W*0.09, seg=W*0.27;
      var vals=[['입구',Ci,PNK],['1차 통과',a1,ORA],['최종',a2,GRN]];
      var mx=Ci*1.05;
      for(var i=0;i<3;i++){ var x=bx+seg*i;
        ctx.fillStyle='#1c2433'; RR(ctx,x,by,seg*0.82,bh,6); ctx.fill();
        ctx.fillStyle=vals[i][2]; RR(ctx,x,by,seg*0.82*vals[i][1]/mx,bh,6); ctx.fill();
        T(ctx,vals[i][0],x,by-FS(H,0.012,5,9),DIM,FS(H,0.024,10,13),'left');
        T(ctx,vals[i][1].toFixed(0)+' mg/m³',x,by+bh+FS(H,0.03,12,16),vals[i][2],FS(H,0.026,11,15),'left','700');
        if(i<2){ T(ctx,'→',x+seg*0.86,by+bh*0.7,DIM,FS(H,0.04,16,22),'left'); } }
      T(ctx,'포집률 η₁='+s.e1+'% · η₂='+s.e2+'% → 최종 '+a2.toFixed(0)+' mg/m³ 만 빠져나감(총 '+tot.toFixed(1)+'% 제거)',bx,by+bh+FS(H,0.075,28,40),DIM,FS(H,0.026,11,14),'left');
      // 집진방식 비교 표(적용 입경)
      var tx=W*0.07, tw=W*0.86, ty=H*0.62, n=5, rh=Math.min(FS(H,0.052,18,26),(H*0.86-ty)/(n+1));
      var meth=[['중력식 침강실','> 50 µm','낮음·전처리'],
                ['관성력식','> 10 µm','방향 급전환'],
                ['원심력식(사이클론)','3~10 µm','cut size로 평가'],
                ['여과식(백필터)','0.1 µm~','고효율·건식'],
                ['전기집진기(ESP)','0.05~1 µm','초고효율·저손실']];
      T(ctx,'집진방식',tx+tw*0.02,ty+rh*0.68,AMB,FS(H,0.026,11,15),'left','700');
      T(ctx,'유효 입경',tx+tw*0.42,ty+rh*0.68,AMB,FS(H,0.026,11,15),'left','700');
      T(ctx,'특징',tx+tw*0.66,ty+rh*0.68,AMB,FS(H,0.026,11,15),'left','700');
      for(i=0;i<n;i++){ var yy=ty+rh*(i+1); if(i%2){ ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,tx,yy,tw,rh,4); ctx.fill(); }
        T(ctx,meth[i][0],tx+tw*0.02,yy+rh*0.68,TXT,FS(H,0.025,11,14),'left','600');
        T(ctx,meth[i][1],tx+tw*0.42,yy+rh*0.68,BLU,FS(H,0.025,11,14),'left','700');
        T(ctx,meth[i][2],tx+tw*0.66,yy+rh*0.68,DIM,FS(H,0.023,10,13),'left'); }
      E.tapHint(0,0,'슬라이더로 1·2차 효율을 바꿔 총효율 보기',true);
      E.big('총집진효율 '+tot.toFixed(1)+' %  (η₁='+s.e1+'% · η₂='+s.e2+'%)',
            '직렬로 달면 "통과율의 곱"만 빠져나가 총효율이 각 단보다 높아집니다 — cut size는 50% 잡히는 입경입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
