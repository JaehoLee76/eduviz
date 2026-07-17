/* 산업위생기술사 제16장 — KOSHA 지침과 최신 법령(2026 개정) (동작만. 텍스트=content/hyg16.json)
   범위: KOSHA CODE/GUIDE 체계, 밀폐공간(H-80), 사무실 공기관리 지침, 보건관리 지침 묶음(H-22/H-67/H-9/W-12/W-17),
         측정·분석 지침(W-23/H-56/A-57), 2026 개정법령(안전보건 현황공시·위험성평가 제재).
   골든룰: 표시 수치는 전부 draw에서 실계산(슬라이더값 또는 명시된 예시 상수로부터 매 프레임 재계산). */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function FS(H,frac,mn,mx){ return Math.max(mn,Math.min(mx,Math.round(H*frac))); }
  function T(ctx,s,x,y,col,fs,al,w){ ctx.fillStyle=col; ctx.font=(w?w+' ':'')+fs+'px sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(s,x,y); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }

  // 16.3 사무실 공기관리 지침 — 관리기준(고용노동부 고시 표준값, 원문 표 평문화로 뭉개져 표준값 사용)
  var POLL=[
    {name:'미세먼지 PM10', std:100, unit:'µg/m³', dec:0},
    {name:'초미세먼지 PM2.5', std:50, unit:'µg/m³', dec:0},
    {name:'이산화탄소 CO₂', std:1000, unit:'ppm', dec:0},
    {name:'일산화탄소 CO', std:10, unit:'ppm', dec:1},
    {name:'이산화질소 NO₂', std:0.1, unit:'ppm', dec:2},
    {name:'폼알데하이드 HCHO', std:100, unit:'µg/m³', dec:0},
    {name:'총부유세균', std:800, unit:'CFU/m³', dec:0},
    {name:'라돈', std:148, unit:'Bq/m³', dec:0}
  ];

  // 16.6 2026 개정법령 — 위험성평가 3단 제재(과태료 상한액)
  var VIOL=[
    {name:'안전보건 현황공시 미이행·거짓공시', fine:1000},
    {name:'위험성평가 미실시', fine:1000},
    {name:'위험성평가 근로자 미참여·결과미공유', fine:500},
    {name:'위험성평가 기록·보존 미이행', fine:300}
  ];

  var scenes=[

  /* ── 16.1 KOSHA CODE/GUIDE 체계 지도 ─────────────────── */
  { id:'hyg16_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){
      var stages=[
        {c:BLU, t:'CODE (자율기준)', items:['사업장 자율 예방체계','법적 구속력 없음(권고)','실무 표준의 뼈대']},
        {c:GRN, t:'GUIDE · H (보건)', items:['H-80 밀폐공간 보건작업','H-22 교대작업자 보건관리','H-67 직무스트레스요인 측정','H-9 근골격계 유해요인조사','H-56 순음청력검사']},
        {c:PNK, t:'GUIDE · W (작업환경)', items:['W-12 고열작업환경관리','W-17 한랭작업환경관리','W-23 소음측정 및 평가']},
        {c:AMB, t:'GUIDE · A (분석측정)', items:['A-57 포름알데히드(GC법)']}
      ];
      var nH=stages[1].items.length, nW=stages[2].items.length, nA=stages[3].items.length, tot=nH+nW+nA;
      window.HygMap(E,{ title:'KOSHA CODE · GUIDE 체계 지도', sub:'번호 앞 알파벳이 분야를 말해줍니다', stages:stages,
        foot:'H '+nH+'종 · W '+nW+'종 · A '+nA+'종 = 총 '+tot+'개 대표 GUIDE (CODE는 강제력 없는 사업장 자율기준)' });
      E.tapHint(0,0,'다음 장면 → 밀폐공간 산소농도 실측',true);
    }
  },

  /* ── 16.2 밀폐공간 보건작업 프로그램 — 적정공기 판정 ── */
  { id:'hyg16_02',
    enter:function(E){ var self=this; this.s={o2:19.5, h2s:5};
      E.controls('<div class="ctrl"><label>측정 산소농도 (%)</label><input type="range" id="p2a" min="14" max="25" step="0.1" value="19.5"><output id="p2ao">19.5</output></div>'
        +'<div class="ctrl"><label>측정 황화수소 (ppm)</label><input type="range" id="p2b" min="0" max="30" step="1" value="5"><output id="p2bo">5</output></div>');
      E.bind('#p2a','input',function(e){ self.s.o2=+e.target.value; document.getElementById('p2ao').textContent=(+e.target.value).toFixed(1); });
      E.bind('#p2b','input',function(e){ self.s.h2s=+e.target.value; document.getElementById('p2bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var okO2=(s.o2>=18 && s.o2<23.5), okH2S=(s.h2s<10), overall=okO2&&okH2S;
      var o2State = s.o2<18?'산소결핍':(s.o2>=23.5?'산소과잉(화재위험)':'적정');
      var fs=FS(H,0.026,13,14);
      var bx=W*0.09, bw=W*0.66, bh=FS(H,0.058,20,30);

      // 게이지 1: 산소농도
      var y1=H*0.30;
      T(ctx,'측정 산소농도',bx,y1-8,DIM,fs,'left');
      var o2min=14,o2max=25;
      function XO(v){ return bx+(v-o2min)/(o2max-o2min)*bw; }
      ctx.fillStyle='rgba(240,136,138,0.22)'; ctx.fillRect(XO(14),y1,XO(18)-XO(14),bh);
      ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.fillRect(XO(18),y1,XO(23.5)-XO(18),bh);
      ctx.fillStyle='rgba(240,136,138,0.22)'; ctx.fillRect(XO(23.5),y1,XO(25)-XO(23.5),bh);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.strokeRect(bx,y1,bw,bh);
      [18,23.5].forEach(function(v){ ctx.strokeStyle=RED; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(XO(v),y1-4); ctx.lineTo(XO(v),y1+bh+4); ctx.stroke(); ctx.setLineDash([]);
        T(ctx,v+'%',XO(v),y1+bh+FS(H,0.026,13,15),RED,FS(H,0.021,11,14),'center'); });
      var mx1=Math.max(o2min,Math.min(o2max,s.o2));
      ctx.strokeStyle=okO2?GRN:RED; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(XO(mx1),y1-8); ctx.lineTo(XO(mx1),y1+bh+8); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,s.o2.toFixed(1)+'%',XO(mx1),y1-12,okO2?GRN:RED,fs,'center','700');

      // 게이지 2: 황화수소
      var y2=H*0.47;
      T(ctx,'측정 황화수소(H₂S)',bx,y2-8,DIM,fs,'left');
      var hmin=0,hmax=30;
      function XH(v){ return bx+(v-hmin)/(hmax-hmin)*bw; }
      ctx.fillStyle='rgba(143,227,181,0.28)'; ctx.fillRect(XH(0),y2,XH(10)-XH(0),bh);
      ctx.fillStyle='rgba(240,136,138,0.22)'; ctx.fillRect(XH(10),y2,XH(30)-XH(10),bh);
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.strokeRect(bx,y2,bw,bh);
      ctx.strokeStyle=RED; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(XH(10),y2-4); ctx.lineTo(XH(10),y2+bh+4); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'10ppm',XH(10),y2+bh+FS(H,0.026,13,15),RED,FS(H,0.021,11,14),'center');
      var mx2=Math.max(hmin,Math.min(hmax,s.h2s));
      ctx.strokeStyle=okH2S?GRN:RED; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(XH(mx2),y2-8); ctx.lineTo(XH(mx2),y2+bh+8); ctx.stroke(); ctx.lineWidth=1;
      T(ctx,s.h2s+'ppm',XH(mx2),y2-12,okH2S?GRN:RED,fs,'center','700');

      // 계산 패널
      var ry=H*0.63, lh=FS(H,0.056,20,28);
      var rows=[
        ['판정 · 산소농도 (18%~23.5% 미만 적정)', s.o2.toFixed(1)+'% → '+o2State, okO2?GRN:RED],
        ['판정 · 황화수소 (10ppm 미만 적정)', s.h2s+'ppm → '+(okH2S?'기준 미만(안전)':'10ppm 이상(위험)'), okH2S?GRN:RED],
        ['종합판정', overall?'적정공기 — 출입 가능':'유해공기 — 환기 후 재측정', overall?GRN:RED]
      ];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,bx-8,yy-lh*0.6,bw+16,lh*0.85,7); ctx.fill();
        T(ctx,rows[i][0],bx,yy,TXT,FS(H,0.023,12,15),'left');
        T(ctx,rows[i][1],bx+bw-2,yy,rows[i][2],FS(H,0.027,12,15),'right','700'); }

      // 참고 기준 밴드 (탄산가스·CO·LEL — 산업안전보건기준에 관한 규칙 별표 적정공기 정의 포함)
      var lelCH4=5.0, lelLimit=lelCH4*0.10;
      var sy=H*0.885;
      ctx.fillStyle='rgba(242,189,85,0.10)'; RR(ctx,W*0.06,sy-FS(H,0.03,12,17),W*0.88,FS(H,0.075,30,44),8); ctx.fill();
      T(ctx,'참고(산업안전보건기준에 관한 규칙 · 적정공기): 탄산가스 1.5% 미만 · 일산화탄소 30ppm 미만 · 가연성가스는 폭발하한(LEL)의 10% 이하',
        W*0.10,sy+FS(H,0.006,4,7),AMB,FS(H,0.021,11,14),'left');
      T(ctx,'(예 메탄 LEL '+lelCH4.toFixed(1)+'% × 10% = '+lelLimit.toFixed(2)+'% 초과 시 위험)',
        W*0.10,sy+FS(H,0.03,13,18),DIM,FS(H,0.021,11,14),'left');

      E.tapHint(0,0,'슬라이더로 산소농도·황화수소 조절',true);
      E.big(overall?'적정공기 확인 — 산소 '+s.o2.toFixed(1)+'% · H₂S '+s.h2s+'ppm':'유해공기 — 즉시 환기·대피',
            overall?'출입 전 반드시 재확인하고, 개인 휴대용 측정기로 작업 중에도 수시로 측정합니다.':'휴대용 측정기구 경보가 울리면 즉시 밀폐공간을 벗어나야 합니다.'); }
  },

  /* ── 16.3 사무실 공기관리 지침 — 관리기준 대조 ───────── */
  { id:'hyg16_03',
    enter:function(E){ var self=this; this.s={idx:2, pct:80};
      E.controls('<div class="ctrl"><label>오염물질 선택</label><input type="range" id="p3a" min="0" max="7" step="1" value="2"><output id="p3ao">이산화탄소 CO₂</output></div>'
        +'<div class="ctrl"><label>기준 대비 측정비율 (%)</label><input type="range" id="p3b" min="40" max="200" step="5" value="80"><output id="p3bo">80</output></div>');
      E.bind('#p3a','input',function(e){ self.s.idx=+e.target.value; document.getElementById('p3ao').textContent=POLL[self.s.idx].name; });
      E.bind('#p3b','input',function(e){ self.s.pct=+e.target.value; document.getElementById('p3bo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cur=POLL[s.idx];
      var measured=cur.std*s.pct/100;
      var over=measured>cur.std;
      var overRatio=measured/cur.std*100;
      var xmax=cur.std*2.2;
      var bx=W*0.09, bw=W*0.68, by=H*0.36, bh=FS(H,0.07,26,38);
      function X(v){ return bx+Math.min(v,xmax)/xmax*bw; }
      var fs=FS(H,0.026,13,14);
      T(ctx,cur.name+' — 관리기준 대조',bx,by-14,TXT,FS(H,0.03,13,17),'left','600');
      ctx.fillStyle='#1c2433'; RR(ctx,bx,by,bw,bh,6); ctx.fill();
      ctx.fillStyle=over?RED:GRN; RR(ctx,bx,by,X(measured)-bx,bh,6); ctx.fill();
      ctx.strokeStyle=AMB; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(X(cur.std),by-6); ctx.lineTo(X(cur.std),by+bh+6); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'기준 '+cur.std+' '+cur.unit,X(cur.std),by-10,AMB,FS(H,0.022,12,15),'center','600');
      T(ctx,measured.toFixed(cur.dec)+' '+cur.unit,bx+8,by+bh*0.68,'#0b1220',fs,'left','700');

      var ry=by+bh+FS(H,0.08,30,46), lh=FS(H,0.058,20,29);
      var rows=[
        ['측정값 = 기준 × 비율 = '+cur.std+' × '+s.pct+'%', measured.toFixed(cur.dec)+' '+cur.unit, over?RED:GRN],
        ['관리기준', cur.std+' '+cur.unit, BLU],
        ['초과율 = 측정÷기준×100', overRatio.toFixed(1)+'%', over?RED:GRN],
        ['판정', over?'관리기준 초과':'관리기준 이내', over?RED:GRN]
      ];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,bx-8,yy-lh*0.6,bw+16,lh*0.85,7); ctx.fill();
        T(ctx,rows[i][0],bx,yy,TXT,FS(H,0.023,12,15),'left');
        T(ctx,rows[i][1],bx+bw-2,yy,rows[i][2],FS(H,0.027,12,15),'right','700'); }

      if(s.idx===2){
        var M=0.022, Co=400, Cs=cur.std;
        var Q=M/((Cs-Co)*1e-6);
        var ny=ry+lh*rows.length+FS(H,0.03,12,18);
        ctx.fillStyle='rgba(122,184,255,0.10)'; RR(ctx,bx-8,ny-FS(H,0.028,13,16),bw+16,FS(H,0.075,30,44),8); ctx.fill();
        T(ctx,'참고(CO₂ 전용) 요구환기량 Q = M÷(Cs−Co) = '+M+' ÷ (('+Cs+'−'+Co+')×10⁻⁶) ≈ '+Q.toFixed(1)+' m³/h·인',
          bx,ny,BLU,FS(H,0.022,12,15),'left');
        T(ctx,'(M=1인당 CO₂ 발생량 0.022 m³/h 표준값, Co=외기 배경농도 400ppm 표준값)',
          bx,ny+FS(H,0.03,12,17),DIM,FS(H,0.02,11,13),'left');
      }

      E.tapHint(0,0,'슬라이더로 오염물질·측정비율 조절',true);
      E.big(cur.name+' '+measured.toFixed(cur.dec)+' '+cur.unit+' ('+(over?'초과':'기준 이내')+')',
            over?'관리기준을 넘으면 환기량을 늘리거나 오염원 자체를 관리해야 합니다.':'사무실 공기관리 지침의 관리기준 이내로 유지되고 있습니다.'); }
  },

  /* ── 16.4 보건관리 지침 묶음 — 교대·직무스트레스·근골격계·고열한랭 ── */
  { id:'hyg16_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s;
      var TOPICS=['① 교대작업 (H-22-2011)','② 직무스트레스요인 (H-67-2012)','③ 근골격계부담작업 (H-9-2016)','④ 고열 W-12 · 한랭 W-17'];
      var hl=function(i,base){ return s.step===i? ORA : base; };
      var calc, note;
      if(s.step===0){
        var shiftH=8, teams=24/shiftH, teamsAdj=teams*(7/5);
        calc=[
          {k:'24시간 연속가동 필요조 수 = 24시간 ÷ '+shiftH+'시간', v:teams.toFixed(0)+'개조', c:BLU},
          {k:'주 7일 가동·주 5일 근무 보정 = '+teams.toFixed(0)+' × (7/5)', v:teamsAdj.toFixed(1)+' → 실무는 5조3교대', c:GRN}
        ];
        note='교대는 주간→저녁→야간의 정방향 순환이 권장되고 연속 야간근무를 최소화하며, 야간작업자는 주간작업자보다 연간 휴무일이 더 많아야 합니다.';
      } else if(s.step===1){
        var nItem=3, scale=4, raw=9, maxScore=nItem*scale;
        var conv=(raw-nItem)/(maxScore-nItem)*100;
        calc=[
          {k:'측정도구', v:'43문항 · 8개영역(물리적환경·직무요구·직무자율·관계갈등 등)', c:BLU},
          {k:'환산점수 = (원점수합−문항수)×100÷(예상최고점−문항수) 예(물리적환경 '+nItem+'문항)', v:'('+raw+'−'+nItem+')×100÷('+maxScore+'−'+nItem+') = '+conv.toFixed(1)+'점', c:ORA}
        ];
        note='환산점수를 한국 근로자 성별 중앙값과 비교해 상대적 노출 수준을 판단합니다 — 절대 이상치가 아니라 상대비교가 핵심입니다.';
      } else if(s.step===2){
        var bendH=2, workH=8, bendRatio=bendH/workH*100;
        calc=[
          {k:'정기 유해요인조사 주기', v:'3년마다(수시조사: 질환자 발생·신규작업 도입·작업환경 변경 시)', c:BLU},
          {k:'부담작업 판단 예시: 하루 총 '+bendH+'시간 이상 목·허리 구부림 ÷ 근무 '+workH+'시간', v:bendRatio.toFixed(1)+'%', c:ORA},
          {k:'조사표 문서 보존기간', v:'5년', c:GRN}
        ];
        note='유해요인조사 결과는 근골격계질환 이환을 긍정·부정하는 증거로 쓸 수 없고, 개선 우선순위 결정에만 사용합니다.';
      } else {
        var wbIn=0.7*28+0.3*32, wbOut=0.7*28+0.2*32+0.1*30;
        calc=[
          {k:'옥내(태양광 없음) WBGT = 0.7×자연습구+0.3×흑구 (예 습구28·흑구32℃)', v:wbIn.toFixed(1)+'℃', c:BLU},
          {k:'옥외(태양광 있음) WBGT = 0.7×자연습구+0.2×흑구+0.1×건구 (예 습구28·흑구32·건구30℃)', v:wbOut.toFixed(1)+'℃', c:ORA}
        ];
        note='한랭작업(W-17)은 반대로 전신저체온증·동상을 예방 대상으로 하며, 6개월 1회 이상 정기적으로 온도·기류를 측정합니다.';
      }
      window.HygDoc(E,{
        title:'보건관리 지침 묶음', sub:TOPICS[s.step]+'  ('+(s.step+1)+'/4)',
        boxes:[
          {x:0.05,y:0.30,w:0.20,h:0.20,c:hl(0,BLU),t:'① 교대작업',s:'H-22-2011'},
          {x:0.285,y:0.30,w:0.20,h:0.20,c:hl(1,GRN),t:'② 직무스트레스',s:'H-67-2012'},
          {x:0.52,y:0.30,w:0.20,h:0.20,c:hl(2,PNK),t:'③ 근골격계',s:'H-9-2016'},
          {x:0.755,y:0.30,w:0.20,h:0.20,c:hl(3,AMB),t:'④ 고열·한랭',s:'W-12 · W-17'}
        ],
        calc:calc,
        note:note
      });
      E.tapHint(0,0,'화면 탭 = 다음 지침',true);
    }
  },

  /* ── 16.5 측정·분석 기술지침 — 등가소음·청력검사·GC법 ── */
  { id:'hyg16_05',
    enter:function(E){ var self=this; this.s={L:95};
      E.controls('<div class="ctrl"><label>노출 소음수준 L (dB(A))</label><input type="range" id="p5a" min="80" max="115" step="1" value="95"><output id="p5ao">95</output></div>');
      E.bind('#p5a','input',function(e){ self.s.L=+e.target.value; document.getElementById('p5ao').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var T8=8/Math.pow(2,(s.L-90)/5);
      var dose=Math.pow(2,(s.L-90)/5)*100;
      var over=dose>100;
      var dbMin=75,dbMax=118, top=H*0.30, base=H*0.66;
      function dbY(d){ return base-(d-dbMin)/(dbMax-dbMin)*(base-top); }
      var fs=FS(H,0.024,12,15), d,y;
      for(d=dbMin;d<=dbMax;d+=10){ y=dbY(d);
        ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(W*0.10,y); ctx.lineTo(W*0.46,y); ctx.stroke();
        T(ctx,d+'',W*0.09,y+4,DIM,fs,'right'); }
      y=dbY(90); ctx.strokeStyle=RED; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(W*0.10,y); ctx.lineTo(W*0.46,y); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'노출기준 90 dB(A)/8h',W*0.10,y-6,RED,FS(H,0.022,12,14),'left','600');
      var bw=W*0.12, bxp=W*0.24;
      ctx.fillStyle=over?RED:GRN; RR(ctx,bxp,dbY(s.L),bw,base-dbY(s.L),6); ctx.fill();
      T(ctx,s.L+' dB(A)',bxp+bw/2,dbY(s.L)-8,over?RED:GRN,FS(H,0.026,12,15),'center','700');

      var rx=W*0.52, ry=H*0.33, lh=FS(H,0.062,22,32);
      var rows=[
        ['교환율(Exchange Rate) 5dB — 국내·미국OSHA 기준','5dB 오를 때마다 허용시간 절반',BLU],
        ['허용노출시간 T = 8 ÷ 2^((L−90)/5)','8÷2^(('+s.L+'−90)/5) = '+T8.toFixed(2)+'시간',ORA],
        ['일일 노출량 = 2^((L−90)/5) × 100%','= '+dose.toFixed(1)+'%',over?RED:GRN],
        ['판정 (100% 기준)',over?'초과 — 청력보호구 필수':'기준 이내',over?RED:GRN]
      ];
      for(var i=0;i<rows.length;i++){ var yy=ry+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,rx-8,yy-lh*0.42,W*0.42,lh*0.84,7); ctx.fill();
        T(ctx,rows[i][0],rx,yy-FS(H,0.006,4,6),DIM,FS(H,0.021,11,14),'left');
        T(ctx,rows[i][1],rx,yy+FS(H,0.028,12,16),rows[i][2],FS(H,0.026,13,14),'left','700'); }

      var spike=10, recover=9.5, deseff=recover/spike*100;
      var sy=H*0.78;
      ctx.fillStyle='rgba(244,160,192,0.10)'; RR(ctx,W*0.08,sy-FS(H,0.026,12,15),W*0.84,FS(H,0.098,36,54),8); ctx.fill();
      T(ctx,'H-56 순음청력검사: 5dB 상승·10dB 하강 규칙(역치결정) · 정밀보정 3년 1회 · 출력음압 허용오차 500~3,000Hz 3dB · 4,000Hz 4dB · 6,000·8,000Hz 5dB',
        W*0.10,sy+FS(H,0.006,4,7),PNK,FS(H,0.02,11,13.5),'left');
      T(ctx,'A-57 포름알데히드(GC법): 2,4-DNPH 흡착관 채취 → 아세토니트릴 탈착 → GC 정량. 탈착효율 예시 = 회수 '+recover+'÷첨가 '+spike+'×100 = '+deseff.toFixed(1)+'%',
        W*0.10,sy+FS(H,0.033,14,19),PNK,FS(H,0.02,11,13.5),'left');

      E.tapHint(0,0,'슬라이더로 노출 소음수준 조절',true);
      E.big('L '+s.L+'dB(A) → 허용시간 '+T8.toFixed(2)+'시간 · 노출량 '+dose.toFixed(1)+'%',
            over?'허용시간을 넘겨 일하면 노출량이 100%를 넘습니다 — 그 순간부터는 작업시간 자체를 줄여야 합니다.':'5dB 오르면 허용시간이 절반이 된다는 교환율의 의미를 슬라이더로 느껴보세요.'); }
  },

  /* ── 16.6 ★2026 개정 법령 — 안전보건 현황공시 + 위험성평가 제재 ── */
  { id:'hyg16_06',
    enter:function(E){ var self=this; this.s={workers:700, vIdx:0};
      E.controls('<div class="ctrl"><label>사업장 상시 근로자 수</label><input type="range" id="p6a" min="100" max="2000" step="50" value="700"><output id="p6ao">700</output></div>'
        +'<div class="ctrl"><label>위반 유형</label><input type="range" id="p6b" min="0" max="3" step="1" value="0"><output id="p6bo">'+VIOL[0].name+'</output></div>');
      E.bind('#p6a','input',function(e){ self.s.workers=+e.target.value; document.getElementById('p6ao').textContent=e.target.value; });
      E.bind('#p6b','input',function(e){ self.s.vIdx=+e.target.value; document.getElementById('p6bo').textContent=VIOL[self.s.vIdx].name; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var disc=s.workers>=500;
      var v=VIOL[s.vIdx];
      var bx=W*0.09, bw=W*0.82, fmax=1000;
      var y=H*0.21;   // 누적 커서 — 블록마다 실측 높이만큼 내려가므로 캔버스 크기가 달라져도 겹치지 않는다

      // 공시 6항목
      T(ctx,'안전보건 현황공시(제10조의2) — 공시항목 6종',bx,y,TXT,FS(H,0.027,13,15),'left','600');
      y+=FS(H,0.04,14,20);
      var ITEMS=['① 안전보건관리체제','② 산업재해 발생현황','③ 전년도 안전보건활동 실적','④ 해당연도 안전보건활동 계획','⑤ 안전보건 투자현황','⑥ 재발방지대책 및 이행계획'];
      var cw=bw*0.5, rowh=FS(H,0.03,13,15);
      for(var i=0;i<ITEMS.length;i++){ var col=Math.floor(i/3), row=i%3;
        T(ctx,ITEMS[i], bx+col*cw, y+row*rowh, DIM, FS(H,0.02,11,13.5), 'left'); }
      y+=rowh*3+FS(H,0.032,12,18);

      // 근로자수 → 공시대상
      var boxH=FS(H,0.065,22,32);
      ctx.fillStyle='rgba(122,184,255,0.08)'; RR(ctx,bx,y,bw,boxH,8); ctx.fill();
      T(ctx,'근로자 '+s.workers+'인 → '+(disc?'공시의무 대상권 진입(500인 이상, 대통령령 확정 전 "예정")':'공시의무 규모 미만(하위법령 확정 대기)'),
        bx+W*0.02,y+boxH*0.65,disc?GRN:DIM,FS(H,0.022,12,15),'left','600');
      y+=boxH+FS(H,0.034,13,19);

      // 위반유형 → 과태료 막대
      T(ctx,'위험성평가 제재 — 위반유형별 과태료 상한',bx,y,TXT,FS(H,0.024,12,14),'left','600');
      y+=FS(H,0.045,17,22);
      var barMaxH=FS(H,0.13,42,64), barBottom=y+barMaxH;
      var n=VIOL.length, gap=8, bw1=(bw-gap*(n-1))/n;
      for(i=0;i<n;i++){ var vx=bx+i*(bw1+gap), vh=VIOL[i].fine/fmax*barMaxH;
        var sel=(i===s.vIdx);
        ctx.fillStyle=sel?ORA:'rgba(255,255,255,0.10)'; RR(ctx,vx,barBottom-vh,bw1,vh,5); ctx.fill();
        if(sel){ ctx.strokeStyle=ORA; ctx.lineWidth=1.6; RR(ctx,vx,barBottom-vh,bw1,vh,5); ctx.stroke(); ctx.lineWidth=1; }
        T(ctx,VIOL[i].fine+'만',vx+bw1/2,barBottom-vh-6,sel?ORA:DIM,FS(H,0.02,11,13.5),'center','700'); }
      y=barBottom+FS(H,0.036,14,20);

      var lh=FS(H,0.044,16,22);
      var rows=[
        ['선택 위반유형', v.name, ORA],
        ['과태료 상한', v.fine+'만원 이하', RED]
      ];
      for(i=0;i<rows.length;i++){ var yy=y+lh*i;
        ctx.fillStyle='rgba(255,255,255,0.03)'; RR(ctx,bx-8,yy-lh*0.6,bw+16,lh*0.85,7); ctx.fill();
        T(ctx,rows[i][0],bx,yy,TXT,FS(H,0.02,11,13.5),'left');
        T(ctx,rows[i][1],bx+bw-2,yy,rows[i][2],FS(H,0.023,12,15),'right','700'); }
      y+=lh*rows.length+FS(H,0.026,12,15);

      T(ctx,'시행 2026.6.1 · 공시개시 2026.8.1 · 매년 4.30까지 공시. 위험성평가 제재는 상시 50인 이상 2027.1.1부터, 50인 미만 2028.1.1부터 단계 적용.',
        bx,y,DIM,FS(H,0.019,10.5,13),'left');

      E.tapHint(0,0,'슬라이더로 근로자수·위반유형 조절',true);
      E.big('선택 위반유형 → '+v.fine+'만원 이하',
            v.name+' — 공시는 투명성, 위험성평가는 참여가 핵심입니다.'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
