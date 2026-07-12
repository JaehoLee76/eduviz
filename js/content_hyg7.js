/* 산업위생기술사 제7장 — 산업독성학(용량이 독을 만든다) (동작만. 텍스트=content/hyg7.json) */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';

  function T(ctx,txt,x,y,col,size,align,bold){
    ctx.fillStyle=col; ctx.font=(bold?'700 ':'')+size+'px system-ui,-apple-system,sans-serif';
    ctx.textAlign=align||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(txt,x,y);
  }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function L10(v){ return Math.log(v)/Math.LN10; }
  // 로지스틱 반응률(%) : 용량 d 에서 반응하는 개체 비율
  function logi(x,x50,k){ return 100/(1+Math.exp(-k*(x-x50))); }
  // 반응률 p(%)를 주는 로그용량 : x = x50 - ln((100-p)/p)/k
  function invLog(p,x50,k){ return x50 - Math.log((100-p)/p)/k; }

  var scenes=[

  /* ── 7.1 용량-반응 관계 (S자 곡선·역치) ─────────────────── */
  { id:'hyg7_01',
    enter:function(E){ var self=this; this.s={dose:20};
      E.controls('<div class="ctrl"><label>노출 용량 (mg/kg, 로그축)</label><input type="range" id="dz" min="-1" max="3" step="0.02" value="1.30"><output id="dzo">20</output></div>');
      E.bind('#dz','input',function(e){ self.s.dose=Math.pow(10,+e.target.value); document.getElementById('dzo').textContent=self.s.dose<10?self.s.dose.toFixed(2):Math.round(self.s.dose); });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var ED50=50, k=3.0, x50=L10(ED50), d=s.dose, xd=L10(d);
      var resp=logi(xd,x50,k);
      var noaelX=invLog(2.5,x50,k), loaelX=invLog(10,x50,k);
      var NOAEL=Math.pow(10,noaelX), LOAEL=Math.pow(10,loaelX);
      // 그래프 영역 (H*0.30 아래)
      var gx0=W*0.12, gx1=W*0.94, gTop=H*0.34, gBot=H*0.86, xmin=-1, xmax=3;
      function X(lx){ return gx0+(lx-xmin)/(xmax-xmin)*(gx1-gx0); }
      function Y(p){ return gBot-p/100*(gBot-gTop); }
      // 축
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(gx0,gTop-6); ctx.lineTo(gx0,gBot); ctx.lineTo(gx1,gBot); ctx.stroke();
      var af=Math.min(12,H*0.030);
      T(ctx,'반응률 %',gx0-6,gTop-12,DIM,af,'left');
      // y 눈금
      [0,50,100].forEach(function(p){ var yy=Y(p); ctx.strokeStyle='rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(gx0,yy); ctx.lineTo(gx1,yy); ctx.stroke();
        T(ctx,p+'',gx0-8,yy+4,DIM,af,'right'); });
      // x 눈금 (로그 용량)
      [[-1,'0.1'],[0,'1'],[1,'10'],[2,'100'],[3,'1000']].forEach(function(t){ var xx=X(t[0]);
        T(ctx,t[1],xx,gBot+Math.min(16,H*0.04),DIM,af,'center'); });
      T(ctx,'용량 (mg/kg)',gx1,gBot+Math.min(16,H*0.04),DIM,af,'right');
      // S자 곡선
      ctx.strokeStyle=ORA; ctx.lineWidth=2.4; ctx.beginPath();
      for(var i=0;i<=120;i++){ var lx=xmin+(xmax-xmin)*i/120; var px=X(lx), py=Y(logi(lx,x50,k));
        if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      // NOAEL·LOAEL·ED50 마커
      function vmark(lx,lab,col){ var xx=X(lx); ctx.strokeStyle=col; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(xx,gTop); ctx.lineTo(xx,gBot); ctx.stroke(); ctx.setLineDash([]);
        T(ctx,lab,xx,gTop-4,col,Math.min(11,H*0.028),'center'); }
      // 역치 이하 안전영역 음영
      ctx.fillStyle='rgba(143,227,181,0.10)'; ctx.fillRect(gx0,gTop,X(noaelX)-gx0,gBot-gTop);
      T(ctx,'역치 이하 = 무영향(안전)',(gx0+X(noaelX))/2,Y(0)-8,GRN,Math.min(11,H*0.028),'center');
      vmark(noaelX,'NOAEL',GRN); vmark(loaelX,'LOAEL',AMB); vmark(x50,'ED50',PNK);
      // 현재 용량 지시선 + 점
      var cx=X(xd), cy=Y(resp);
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8; ctx.setLineDash([2,3]);
      ctx.beginPath(); ctx.moveTo(cx,gBot); ctx.lineTo(cx,cy); ctx.lineTo(gx0,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(cx,cy,6,0,7); ctx.fill();
      // 수치 카드
      var cw=Math.min(W*0.26,W*0.30), chh=Math.min(58,H*0.15);
      var boxCol = d<NOAEL?GRN : d<LOAEL?AMB : RED;
      ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,gx1-cw,gTop,cw,chh,8); ctx.fill();
      T(ctx,'용량 '+(d<10?d.toFixed(1):Math.round(d))+' mg/kg',gx1-cw+10,gTop+Math.min(20,H*0.05),DIM,Math.min(12,H*0.030),'left');
      T(ctx,'반응률 '+resp.toFixed(1)+'%',gx1-12,gTop+Math.min(44,H*0.11),boxCol,Math.min(20,H*0.050),'right',true);
      E.big('반응률 '+resp.toFixed(1)+'%', 'NOAEL '+NOAEL.toFixed(1)+' · LOAEL '+LOAEL.toFixed(1)+' · ED50 50 mg/kg');
    } },

  /* ── 7.2 LD50 · 치료지수(안전역) ────────────────────────── */
  { id:'hyg7_02',
    enter:function(E){ var self=this; this.s={ed:20,ld:400};
      E.controls(
        '<div class="ctrl"><label>ED50 유효량 (mg/kg)</label><input type="range" id="ed" min="5" max="100" step="1" value="20"><output id="edo">20</output></div>'+
        '<div class="ctrl"><label>LD50 치사량 (mg/kg)</label><input type="range" id="ld" min="40" max="2000" step="10" value="400"><output id="ldo">400</output></div>');
      E.bind('#ed','input',function(e){ self.s.ed=+e.target.value; document.getElementById('edo').textContent=e.target.value; });
      E.bind('#ld','input',function(e){ self.s.ld=+e.target.value; document.getElementById('ldo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var ED=Math.min(s.ed,s.ld-10), LD=Math.max(s.ld,s.ed+10);
      var TI=LD/ED;                          // 치료지수(안전역)
      var eX=L10(ED), lX=L10(LD), k=3.2;
      var gx0=W*0.10, gx1=W*0.94, gTop=H*0.34, gBot=H*0.80, xmin=0, xmax=3.4;
      function X(lx){ return gx0+(lx-xmin)/(xmax-xmin)*(gx1-gx0); }
      function Y(p){ return gBot-p/100*(gBot-gTop); }
      var af=Math.min(12,H*0.030);
      ctx.strokeStyle=DIM; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(gx0,gTop-6); ctx.lineTo(gx0,gBot); ctx.lineTo(gx1,gBot); ctx.stroke();
      [[0,'1'],[1,'10'],[2,'100'],[3,'1000']].forEach(function(t){ var xx=X(t[0]);
        T(ctx,t[1],xx,gBot+Math.min(16,H*0.04),DIM,af,'center'); });
      T(ctx,'용량 (mg/kg)',gx1,gBot+Math.min(16,H*0.04),DIM,af,'right');
      [0,50,100].forEach(function(p){ var yy=Y(p); T(ctx,p+'',gx0-8,yy+4,DIM,af,'right'); });
      // 안전역 음영(효과곡선과 치사곡선 사이)
      ctx.fillStyle='rgba(143,227,181,0.10)'; ctx.fillRect(X(eX),gTop,Math.max(0,X(lX)-X(eX)),gBot-gTop);
      // 효과(초록)·치사(빨강) 곡선
      function curve(x50,col){ ctx.strokeStyle=col; ctx.lineWidth=2.3; ctx.beginPath();
        for(var i=0;i<=120;i++){ var lx=xmin+(xmax-xmin)*i/120; var px=X(lx), py=Y(logi(lx,x50,k));
          if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke(); }
      curve(eX,GRN); curve(lX,RED);
      // 50% 표식
      function dot(x50,col,lab){ var xx=X(x50),yy=Y(50); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(xx,yy,5,0,7); ctx.fill();
        ctx.strokeStyle=col; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx,gBot); ctx.stroke(); ctx.setLineDash([]);
        T(ctx,lab,xx,gTop-4,col,Math.min(12,H*0.030),'center'); }
      dot(eX,GRN,'ED50 '+ED); dot(lX,RED,'LD50 '+LD);
      T(ctx,'효과(치료·반응) 곡선',X(eX),Y(50)-10,GRN,af,'center');
      T(ctx,'치사(독성) 곡선',X(lX),Y(50)-10,RED,af,'center');
      T(ctx,'← 안전역(치료 창) →',(X(eX)+X(lX))/2,Y(78),GRN,Math.min(12,H*0.030),'center');
      // TI 카드
      var grade = TI>=10?'넓음(안전)':TI>=3?'보통(주의)':'좁음(위험)';
      var gcol = TI>=10?GRN:TI>=3?AMB:RED;
      var cw=Math.min(W*0.30,W*0.34), chh=Math.min(60,H*0.16);
      ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,gx0,gTop,cw,chh,8); ctx.fill();
      T(ctx,'치료지수 TI = LD50/ED50',gx0+10,gTop+Math.min(20,H*0.05),DIM,Math.min(12,H*0.030),'left');
      T(ctx,TI.toFixed(1)+'  ('+grade+')',gx0+cw-12,gTop+Math.min(46,H*0.12),gcol,Math.min(19,H*0.048),'right',true);
      E.big('TI = '+TI.toFixed(1), 'LD50 '+LD+' ÷ ED50 '+ED+' → 안전역 '+grade);
    } },

  /* ── 7.3 NOAEL → 안전계수 → ADI → 안전농도 ─────────────── */
  { id:'hyg7_03',
    enter:function(E){ var self=this; this.s={noael:10,uf:100};
      E.controls(
        '<div class="ctrl"><label>NOAEL (mg/kg/day)</label><input type="range" id="no" min="0.5" max="50" step="0.5" value="10"><output id="noo">10</output></div>'+
        '<div class="ctrl"><label>안전계수 UF (불확실성)</label><input type="range" id="uf" min="10" max="1000" step="10" value="100"><output id="ufo">100</output></div>');
      E.bind('#no','input',function(e){ self.s.noael=+e.target.value; document.getElementById('noo').textContent=e.target.value; });
      E.bind('#uf','input',function(e){ self.s.uf=+e.target.value; document.getElementById('ufo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var NOAEL=s.noael, UF=s.uf, BW=70, T8=8, V=0.98, R=1.0;
      var ADI=NOAEL/UF;                 // mg/kg/day
      var SHD=ADI*BW;                   // mg/day (성인 70 kg)
      var Cair=SHD/(T8*V*R);            // mg/m³ (8시간·호흡률 0.98 m³/hr·잔류율 1.0)
      // 사다리 4단 (H 비례)
      var bx=W*0.09, bw=W*0.82, top=H*0.32, gap=Math.min(H*0.155,(H*0.60)/4);
      var bh=Math.min(gap*0.62,H*0.10);
      var lf=Math.min(13,H*0.032), vf=Math.min(22,H*0.052), sf=Math.min(11.5,H*0.028);
      var steps=[
        {t:'NOAEL — 악영향이 관찰되지 않는 최대 용량',v:NOAEL.toFixed(2)+' mg/kg/day',c:BLU,op:''},
        {t:'÷ 안전계수 UF ('+UF+') → ADI(1일 섭취허용량)',v:ADI.toFixed(4)+' mg/kg/day',c:AMB,op:'÷ '+UF},
        {t:'× 체중 70 kg → SHD(안전 인체용량)',v:SHD.toFixed(3)+' mg/day',c:ORA,op:'× 70'},
        {t:'÷ (노출 8h · 호흡률 0.98 · 잔류 1.0) → 공기 중 안전농도',v:Cair.toFixed(4)+' mg/m³',c:GRN,op:'÷ (8·0.98·1.0)'}
      ];
      for(var i=0;i<4;i++){ var y=top+i*gap, st=steps[i];
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.5; rr(ctx,bx,y,bw,bh,9); ctx.fill(); ctx.stroke();
        T(ctx,st.t,bx+14,y+bh*0.42,DIM,lf,'left');
        T(ctx,st.v,bx+bw-14,y+bh*0.78,st.c,vf,'right',true);
        if(i<3){ // 화살표 + 연산 라벨
          var ay=y+bh+ (gap-bh)/2, axc=bx+bw*0.30;
          ctx.strokeStyle=DIM; ctx.lineWidth=1.8; ctx.beginPath();
          ctx.moveTo(axc,y+bh+2); ctx.lineTo(axc,ay+ (gap-bh)/2 -2); ctx.stroke();
          var an=y+gap-2; ctx.beginPath(); ctx.moveTo(axc,an); ctx.lineTo(axc-5,an-7); ctx.lineTo(axc+5,an-7); ctx.closePath(); ctx.fillStyle=DIM; ctx.fill();
          T(ctx,steps[i+1].op,axc+12,y+bh+(gap-bh)/2+4,steps[i+1].c,sf,'left');
        }
      }
      E.big('안전농도 '+Cair.toFixed(4)+' mg/m³', 'ADI = '+NOAEL+' ÷ '+UF+' = '+ADI.toFixed(4)+' mg/kg/day');
    } },

  /* ── 7.4 흡수 → 분포 → 대사 → 배설 (독물동태) ──────────── */
  { id:'hyg7_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); E.tapHint(0,0,'단계 전환',true); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx,step=s.step;
      // 상단 파이프라인 4단
      var names=['흡수','분포','대사','배설'], cols=[ORA,BLU,PNK,GRN];
      var px0=W*0.08, pw=W*0.84, cw=(pw-3*12)/4, py=H*0.32, ch=Math.min(46,H*0.11);
      for(var i=0;i<4;i++){ var x=px0+i*(cw+12); var on=i===step;
        ctx.fillStyle= on?'rgba(255,255,255,0.09)':'rgba(255,255,255,0.03)';
        ctx.strokeStyle=cols[i]; ctx.lineWidth=on?2.4:1.2; rr(ctx,x,py,cw,ch,9); ctx.fill(); ctx.stroke();
        T(ctx,names[i],x+cw/2,py+ch*0.62,on?cols[i]:DIM,Math.min(16,H*0.040),'center',true);
        if(i<3){ T(ctx,'→',x+cw+6,py+ch*0.62,DIM,Math.min(16,H*0.040),'center'); } }
      // 상세 패널
      var dx=W*0.09, dw=W*0.82, dy=py+ch+Math.min(28,H*0.06), lh=Math.min(24,H*0.058);
      var detail=[
        {ttl:'흡수 — 세 관문의 흡수율',c:ORA,rows:[
          ['호흡기(폐)','가장 주요 경로 · 흡수율 30~85%. 폐포 도달 입자 0.5~5 µm, 수용성이 축적을 좌우'],
          ['피부','접촉면적 1.6~1.9 m² · 전 호흡량의 약 15%. 지용성·비이온화 물질이 빠르게 침투'],
          ['소화기','흡수율 10~15% · 위 pH·통과속도에 좌우. 납은 Ca·Fe 부족 시 흡수 증가']]},
        {ttl:'분포 — 혈류를 타고 표적으로',c:BLU,rows:[
          ['이동','흡수된 독물은 혈액을 거쳐 각 장기로 분포'],
          ['축적','간·신장에 고농도 축적. 무기납은 뇌혈관장벽을 통과 못함'],
          ['표적장기','독물이 선택적으로 작용하는 장기(납=조혈·신경·신장)']]},
        {ttl:'대사 — 간의 생체변환(1상·2상)',c:PNK,rows:[
          ['1상(P-450)','산화·환원·가수분해로 반응기 부착. 사이토크롬 P-450이 핵심 산화효소'],
          ['2상(포합)','글루쿠론산·글루타티온·황산 포합으로 극성↑ → 배설 용이'],
          ['활성화 주의','일부 물질은 대사로 오히려 독성↑(대사적 활성화)']]},
        {ttl:'배설 — 몸 밖으로',c:GRN,rows:[
          ['신장(소변)','주 배설로. 극성 대사물을 여과·배출'],
          ['담즙(대변)','간→담즙→장으로. 유기수은은 담즙 배설·장간순환'],
          ['반감기','납 뼈 10~20년, 카드뮴 수년~30년 — 축적성 금속은 배설이 느림']]}
      ][step];
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=detail.c; ctx.lineWidth=1.4;
      rr(ctx,dx,dy,dw,Math.min(H*0.44,lh*4.4),10); ctx.fill(); ctx.stroke();
      T(ctx,detail.ttl,dx+16,dy+Math.min(26,H*0.06),detail.c,Math.min(16,H*0.040),'left',true);
      for(var r=0;r<detail.rows.length;r++){ var ry=dy+Math.min(50,H*0.115)+r*lh;
        T(ctx,detail.rows[r][0],dx+16,ry,detail.c,Math.min(13,H*0.032),'left',true);
        T(ctx,detail.rows[r][1],dx+W*0.19,ry,TXT,Math.min(12.5,H*0.031),'left'); }
      T(ctx,'('+(step+1)+'/4) D키(또는 화면 탭)로 다음 단계',dx+16,dy+Math.min(H*0.44,lh*4.4)-8,DIM,Math.min(11.5,H*0.028),'left');
      E.big('독물동태 ADME', names[step]+' 단계');
    } },

  /* ── 7.5 중금속 3대장 — 혈중 납 용량반응 + 수은·카드뮴 ──── */
  { id:'hyg7_05',
    enter:function(E){ var self=this; this.s={pb:35};
      E.controls('<div class="ctrl"><label>혈중 납 PbB (µg/dL)</label><input type="range" id="pb" min="5" max="120" step="1" value="35"><output id="pbo">35</output></div>');
      E.bind('#pb','input',function(e){ self.s.pb=+e.target.value; document.getElementById('pbo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var pb=s.pb, mgmt=30;                 // 혈중 납 관리기준 30 µg/dL
      var ratio=pb/mgmt;                    // 관리기준 대비 배수
      // 좌측 세로 게이지 (영향 밴드)
      var gx=W*0.18, gTop=H*0.33, gBot=H*0.92, vmin=5, vmax=120;
      function Y(v){ return gBot-(v-vmin)/(vmax-vmin)*(gBot-gTop); }
      var bands=[
        [5,25,'rgba(143,227,181,0.16)','축적 진행 · ALA-D 부분 억제',GRN],
        [25,40,'rgba(242,189,85,0.16)','규칙적 노출 · 말초신경 전도 저하(>30)',AMB],
        [40,80,'rgba(255,178,122,0.18)','ALA-U·코프로피린 증가 · 증상 진행',ORA],
        [80,120,'rgba(240,136,138,0.20)','빈혈·산통·뇌증 위험',RED]];
      var gw=Math.min(W*0.13,W*0.16);
      for(var b=0;b<bands.length;b++){ var y1=Y(bands[b][1]), y2=Y(bands[b][0]);
        ctx.fillStyle=bands[b][2]; rr(ctx,gx,y1,gw,y2-y1,4); ctx.fill();
        T(ctx,bands[b][0]+'–'+bands[b][1],gx-8,(y1+y2)/2+4,DIM,Math.min(11,H*0.027),'right');
        T(ctx,bands[b][3],gx+gw+10,(y1+y2)/2+4,bands[b][4],Math.min(11.5,H*0.028),'left'); }
      // 관리기준선 30
      var y30=Y(mgmt); ctx.strokeStyle=TXT; ctx.lineWidth=1.4; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(gx-4,y30); ctx.lineTo(gx+gw+4,y30); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'관리 30',gx+gw/2,y30-4,TXT,Math.min(10.5,H*0.026),'center');
      // 현재 PbB 마커
      var yp=Y(pb); var mc = pb<25?GRN:pb<40?AMB:pb<80?ORA:RED;
      ctx.fillStyle=mc; ctx.beginPath(); ctx.moveTo(gx-6,yp); ctx.lineTo(gx-14,yp-6); ctx.lineTo(gx-14,yp+6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=mc; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx,yp); ctx.lineTo(gx+gw,yp); ctx.stroke();
      // 상단 수치
      T(ctx,'PbB '+pb+' µg/dL = 관리기준의 '+ratio.toFixed(1)+'배',gx,gTop-Math.min(14,H*0.035),mc,Math.min(14,H*0.034),'left',true);
      // 우측 3금속 요약 카드
      var cx=W*0.55, cwd=W*0.40, cy0=H*0.33, chh=Math.min(H*0.175,(H*0.58)/3), cf=Math.min(12.5,H*0.030);
      var metals=[
        {n:'납 Pb',c:ORA,tgt:'조혈(ALA-D↓·빈혈)·신경·신장',bio:'혈중 납 30 · ZPP 100µg/dL · ALA-U 5mg/L'},
        {n:'수은 Hg',c:BLU,tgt:'중추신경·신장(메틸수은=미나마타병)',bio:'소변 수은 · 유기수은은 대변 배설'},
        {n:'카드뮴 Cd',c:PNK,tgt:'신장(β2-MG)·폐·뼈(이타이이타이병)',bio:'요중 Cd 5µg/g·cr · 혈중 Cd 5µg/L'}];
      for(var m=0;m<3;m++){ var y=cy0+m*(chh+Math.min(10,H*0.02));
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=metals[m].c; ctx.lineWidth=1.5; rr(ctx,cx,y,cwd,chh,9); ctx.fill(); ctx.stroke();
        T(ctx,metals[m].n,cx+14,y+chh*0.30,metals[m].c,Math.min(15,H*0.036),'left',true);
        T(ctx,'표적: '+metals[m].tgt,cx+14,y+chh*0.60,TXT,cf,'left');
        T(ctx,'지표: '+metals[m].bio,cx+14,y+chh*0.86,DIM,Math.min(11.5,H*0.028),'left'); }
      E.big('PbB '+pb+' µg/dL', pb<25?'축적 진행':pb<40?'말초신경 전도 저하':pb<80?'증상 진행':'빈혈·뇌증 위험');
    } }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
