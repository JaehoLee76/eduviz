/* 산업위생관리기술사 제2장 — 산업환기(전체환기·국소배기·후드·덕트·압력손실). 동작만. 텍스트=content/hyg2.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 결정적 의사난수(Math.random 금지 — 고정 해시)
  function hsh(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }

  var scenes=[

  // 2.1 환기의 두 전략 — 전체환기 vs 국소배기 (tap 단계)
  { id:'hyg2_01',
    enter:function(E){ this.s={step:0, t:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H, st=s.step; s.t++;
      var mL=64, mR=64, top=84, fl=H-118;
      var rx0=mL, rx1=W-mR, rw=rx1-rx0;
      // 공장 단면(벽·바닥·천장)
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=2;
      ctx.strokeRect(rx0, top, rw, fl-top);
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(rx0, top, rw, fl-top);
      // 좌측 벽 급기창(루버)
      var wy=top+(fl-top)*0.30;
      ctx.strokeStyle=BLU; ctx.lineWidth=2;
      for(var li=0;li<4;li++){ ctx.beginPath(); ctx.moveTo(rx0-10, wy+li*12); ctx.lineTo(rx0+10, wy+li*12+6); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('급기창', rx0, wy-12);
      // 우측 벽 배기팬(날개 회전)
      var fx=rx1, fy=top+(fl-top)*0.24, fr=16;
      ctx.strokeStyle=(st===1)?ORA:DIM; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(fx,fy,fr,0,Math.PI*2); ctx.stroke();
      var rot=(st===1)? s.t*0.15 : s.t*0.02;
      for(var b=0;b<3;b++){ var a=rot+b*Math.PI*2/3;
        ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx+Math.cos(a)*fr*0.85, fy+Math.sin(a)*fr*0.85); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('배기팬', fx, fy-fr-8);
      // 오염원(도장 작업대)
      var sx=rx0+rw*0.30, sy=fl-34;
      ctx.fillStyle='rgba(244,160,192,0.25)'; ctx.fillRect(sx-34, fl-30, 68, 30);
      ctx.strokeStyle=PNK; ctx.lineWidth=1.6; ctx.strokeRect(sx-34, fl-30, 68, 30);
      ctx.fillStyle=PNK; ctx.fillText('오염원(도장 작업)', sx, fl+16);
      // 근로자(머리·몸·호흡영역)
      var wx=rx0+rw*0.70, hy2=fl-58;
      ctx.strokeStyle=TXT; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(wx,hy2,9,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx,hy2+9); ctx.lineTo(wx,fl-22); ctx.moveTo(wx-11,fl-44); ctx.lineTo(wx+11,fl-44);
      ctx.moveTo(wx,fl-22); ctx.lineTo(wx-9,fl); ctx.moveTo(wx,fl-22); ctx.lineTo(wx+9,fl); ctx.stroke();
      ctx.fillStyle=DIM; ctx.fillText('근로자', wx, fl+16);
      // 국소배기 후드(단계2 이상에서 등장)
      var hdy=fl-118;
      if(st===2){ ctx.strokeStyle=GRN; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.moveTo(sx-42,hdy); ctx.lineTo(sx+42,hdy); ctx.lineTo(sx+16,hdy-30); ctx.lineTo(sx-16,hdy-30);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx-10,hdy-30); ctx.lineTo(sx-10,top); ctx.moveTo(sx+10,hdy-30); ctx.lineTo(sx+10,top); ctx.stroke();
        ctx.fillStyle=GRN; ctx.fillText('후드 → 덕트', sx, hdy-40); }
      // 전체환기 기류 화살표(단계1)
      if(st===1){ ctx.strokeStyle='rgba(122,184,255,0.7)'; ctx.lineWidth=1.6;
        for(var ai=0;ai<3;ai++){ var ay=top+40+ai*46, off=(s.t*2+ai*40)%60;
          ctx.setLineDash([10,8]); ctx.lineDashOffset=-off;
          ctx.beginPath(); ctx.moveTo(rx0+12,ay); ctx.quadraticCurveTo((rx0+rx1)/2, ay-14, rx1-14, fy+ (ay-top)*0.2); ctx.stroke(); }
        ctx.setLineDash([]); ctx.lineDashOffset=0; }
      // 오염 입자(결정적 해시 경로) + 호흡영역 도달 수 실측
      var N=40, cnt=0;
      if(st<3){ for(var i=0;i<N;i++){
        var spd=0.0016*(0.5+hsh(i)), ph=(s.t*spd + hsh(i*3+1))%1, px,py,al;
        if(st===0){ var ang=-Math.PI/2+(hsh(i+11)-0.5)*2.8, r=ph*260;
          px=sx+Math.cos(ang)*r*1.25; py=sy-24-Math.abs(Math.sin(ang))*r*0.75; al=0.85*(1-ph*0.7); }
        else if(st===1){ px=sx+ph*(fx-18-sx); py=sy-40-hsh(i+5)*70-Math.sin(ph*Math.PI)*46+(ph)*(fy-(sy-70))*0.9; al=0.7*(1-ph*0.8);
          if(i%2===0) continue; } // 희석 — 밀도 절반
        else { px=sx+(hsh(i+2)-0.5)*46*(1-ph); py=sy-24-ph*(sy-24-(hdy-14)); al=0.9*(1-ph*0.4);
          if(i%4===0) continue; }
        px=Math.max(rx0+6,Math.min(rx1-6,px)); py=Math.max(top+6,Math.min(fl-4,py));
        var dx=px-wx, dy=py-hy2; if(dx*dx+dy*dy<38*38) cnt++;
        ctx.fillStyle='rgba(244,160,192,'+al.toFixed(2)+')';
        ctx.beginPath(); ctx.arc(px,py,2.4,0,Math.PI*2); ctx.fill(); }
        // 호흡영역 오염 지표(입자 실측 카운트)
        var frac=cnt/N, gx=rx0, gy=top-26, gw=180;
        ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(gx,gy,gw,10);
        ctx.fillStyle=frac>0.12?RED:(frac>0.04?ORA:GRN); ctx.fillRect(gx,gy,gw*Math.min(1,frac*4),10);
        ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.font='13px sans-serif';
        ctx.fillText('호흡영역 오염 지표(입자 '+cnt+'/'+N+')', gx+gw+10, gy+9); }
      // 단계3 — 선택 기준 비교표
      if(st===3){ ctx.globalAlpha=0.25; ctx.fillStyle='#000'; ctx.fillRect(rx0+2,top+2,rw-4,fl-top-4); ctx.globalAlpha=1;
        var bw=rw*0.44, bx1=rx0+rw*0.04, bx2=rx0+rw*0.52, by=top+22, bh=fl-top-58;
        function panel(bx,c,tt,items){ ctx.strokeStyle=c; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
          ctx.fillStyle=c; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(tt, bx+bw/2, by+24);
          ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
          for(var k=0;k<items.length;k++) ctx.fillText('· '+items[k], bx+14, by+50+k*24); }
        panel(bx1,BLU,'전체환기(희석)',['독성이 낮다(노출기준 높음)','발생원이 분산·이동한다','발생량이 적고 비교적 일정','근로자가 발생원에서 멀다','국소배기 설치가 곤란한 곳']);
        panel(bx2,GRN,'국소배기(포집)',['독성이 높다·발암성 물질','발생원이 고정되어 있다','발생량이 많거나 변동 큼','관리대상 물질 — 법이 요구','필요풍량이 적어 경제적']);
        ctx.fillStyle=AMB; ctx.textAlign='center'; ctx.font='12px sans-serif';
        ctx.fillText('원칙: 국소배기 우선 검토 → 곤란할 때 전체환기 보완', rx0+rw/2, fl-14); }
      E.tapHint(0,0,'다음 단계',true);
      var big=['유해물질이 방 전체로 퍼집니다','전략 1 · 전체환기(희석환기)','전략 2 · 국소배기(발생원 포집)','무엇을 쓸 것인가 — 독성과 발생원이 답을 정합니다'][st];
      var sub=['도장 작업대에서 증기가 피어올라 호흡영역까지 도달합니다 — D키로 전략을 하나씩 적용해 보세요',
        '급기창으로 새 공기, 배기팬으로 배출 — 방 전체를 갈아 농도를 낮추지만 완전히 없애지는 못합니다',
        '발생원 바로 위에서 포집 — 퍼지기 전에 잡으므로 적은 풍량으로 호흡영역이 가장 깨끗해집니다',
        '독성 낮고 발생원 분산이면 전체환기, 독성 높고 발생원 고정이면 국소배기 — 국소배기 우선이 원칙입니다'][st];
      E.big(big, sub); }
  },

  // 2.2 필요환기량 Q = G/C × K (슬라이더)
  { id:'hyg2_02',
    enter:function(E){ var self=this; this.s={g:30, tlv:200, k:3};
      E.controls(
        '<div class="ctrl"><label>발생량 G (L/hr)</label><input type="range" id="gg" min="5" max="120" step="5" value="30"><output id="ggo">30</output></div>'+
        '<div class="ctrl"><label>노출기준 TLV (ppm)</label><input type="range" id="tv" min="25" max="500" step="25" value="200"><output id="tvo">200</output></div>'+
        '<div class="ctrl"><label>안전계수 K</label><input type="range" id="kk" min="1" max="10" step="0.5" value="3"><output id="kko">3</output></div>');
      E.bind('#gg','input',function(e){ self.s.g=+e.target.value; document.getElementById('ggo').textContent=e.target.value; });
      E.bind('#tv','input',function(e){ self.s.tlv=+e.target.value; document.getElementById('tvo').textContent=e.target.value; });
      E.bind('#kk','input',function(e){ self.s.k=+e.target.value; document.getElementById('kko').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var G=s.g, TLV=s.tlv, K=s.k;
      var Qe=G*1000/TLV;          // 유효환기량 m³/hr (G L/hr → mL/hr, ppm=mL/m³)
      var Q=Qe*K;                 // 실제환기량 m³/hr
      var Qmin=Q/60;              // m³/min
      var Ceq=TLV/K;              // 평형농도 = TLV/K (K배 환기의 의미)
      var top=76, bot=H-128;
      // ── 좌: 작업장 상자(입자 밀도 = 평형농도/TLV = 1/K)
      var rx0=70, rx1=W*0.44, ry0=top+8, ry1=bot;
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=2; ctx.strokeRect(rx0,ry0,rx1-rx0,ry1-ry0);
      var nd=Math.round(48/K);
      for(var i=0;i<nd;i++){ var px=rx0+8+hsh(i+1)*(rx1-rx0-16), py=ry0+8+hsh(i*5+2)*(ry1-ry0-16);
        ctx.fillStyle='rgba(244,160,192,0.75)'; ctx.beginPath(); ctx.arc(px,py,2.6,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('작업장 — 환기 평형 상태', (rx0+rx1)/2, ry0-8);
      ctx.fillStyle=PNK; ctx.fillText('발생 G='+G+' L/hr', rx0+70, ry1-10);
      ctx.fillStyle=BLU; ctx.fillText('배기 Q →', rx1-44, ry0+22);
      // ── 중: 평형농도 게이지(TLV 대비 1/K)
      var gx=W*0.50, gw=54, gy0=top+8, gy1=bot;
      ctx.strokeStyle='rgba(219,238,251,0.35)'; ctx.lineWidth=1.4; ctx.strokeRect(gx,gy0,gw,gy1-gy0);
      var fh=(gy1-gy0)/K;         // 채움 = TLV의 1/K
      ctx.fillStyle='rgba(143,227,181,0.5)'; ctx.fillRect(gx, gy1-fh, gw, fh);
      ctx.strokeStyle=RED; ctx.setLineDash([6,4]); ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(gx-8,gy0); ctx.lineTo(gx+gw+8,gy0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=RED; ctx.textAlign='left'; ctx.fillText('TLV '+TLV+' ppm', gx+gw+12, gy0+4);
      // K=1이면 평형선(gy1-fh)이 TLV선(gy0)과 같은 높이가 되어 두 라벨이 겹치므로 최소 간격을 확보
      var ceqY=Math.max(gy1-fh+2, gy0+26);
      ctx.fillStyle=GRN; ctx.fillText('C평형 = TLV/K', gx+gw+12, ceqY);
      ctx.fillText('= '+Ceq.toFixed(1)+' ppm', gx+gw+12, ceqY+16);
      ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('농도 게이지', gx+gw/2, gy0-8);
      // ── 우: 유효 vs 실제 환기량 막대
      var bx=W*0.74, bw=64, base=bot, maxbar=bot-top-16;
      var hQ=maxbar, hQe=maxbar/K;   // 비율 = 1:K
      ctx.fillStyle='rgba(122,184,255,0.35)'; ctx.fillRect(bx, base-hQe, bw, hQe);
      ctx.strokeStyle=BLU; ctx.strokeRect(bx, base-hQe, bw, hQe);
      ctx.fillStyle='rgba(255,178,122,0.35)'; ctx.fillRect(bx+bw+34, base-hQ, bw, hQ);
      ctx.strokeStyle=ORA; ctx.strokeRect(bx+bw+34, base-hQ, bw, hQ);
      ctx.fillStyle=BLU; ctx.textAlign='center'; ctx.font='13px sans-serif';
      ctx.fillText('유효 Q\'', bx+bw/2, base+16);
      ctx.fillText((Qe/60).toFixed(1)+' m³/min', bx+bw/2, base-hQe-8);
      ctx.fillStyle=ORA; ctx.fillText('실제 Q=Q\'×K', bx+bw+34+bw/2, base+16);
      ctx.fillText(Qmin.toFixed(1)+' m³/min', bx+bw+34+bw/2, base-hQ-8);
      ctx.strokeStyle=AMB; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(bx+bw+4, base-hQe/2); ctx.lineTo(bx+bw+30, base-hQe/2); ctx.stroke();
      ctx.fillStyle=AMB; ctx.fillText('×K='+K, bx+bw+17, base-hQe/2-8);
      ctx.fillStyle=DIM; ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillText('K=1 완전혼합 · 2 보통 · 3 불완전 · 5~10 사각지대(불량)', 70, H-108);
      E.big('Q = G/C × K = '+G+'×1,000/'+TLV+' × '+K+' = '+Q.toFixed(0)+' m³/hr = '+Qmin.toFixed(1)+' m³/min',
        '환기량을 K배 늘리면 평형농도는 TLV의 1/K = '+Ceq.toFixed(1)+' ppm까지 내려갑니다'); }
  },

  // 2.3 후드와 제어풍속 — Q = 60·Vc(10X²+A) (슬라이더)
  { id:'hyg2_03',
    enter:function(E){ var self=this; this.s={x:30, vc:0.5, fl:0};
      E.controls(
        '<div class="ctrl"><label>후드-발생원 거리 X (cm)</label><input type="range" id="xx" min="10" max="60" step="5" value="30"><output id="xxo">30</output></div>'+
        '<div class="ctrl"><label>제어풍속 Vc (m/s)</label><input type="range" id="vc" min="0.25" max="2" step="0.05" value="0.5"><output id="vco">0.5</output></div>'+
        '<div class="ctrl"><label>플랜지 (0=없음 1=부착)</label><input type="range" id="fg" min="0" max="1" step="1" value="0"><output id="fgo">없음</output></div>');
      E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=e.target.value; });
      E.bind('#vc','input',function(e){ self.s.vc=+e.target.value; document.getElementById('vco').textContent=e.target.value; });
      E.bind('#fg','input',function(e){ self.s.fl=+e.target.value; document.getElementById('fgo').textContent=(+e.target.value?'부착':'없음'); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var A=0.1;                          // 개구면적 0.5m×0.2m = 0.1 m² (고정 예시)
      var Xm=s.x/100, Vc=s.vc, fl=s.fl;
      var base=10*Xm*Xm+A;
      var Q0=60*Vc*base;                  // 플랜지 없음 (Dalla Valle)
      var Qf=60*0.75*Vc*base;             // 플랜지 부착 — 25% 절감
      var Qsel=fl?Qf:Q0;
      var r2=(10*(2*Xm)*(2*Xm)+A)/base;   // 거리 2배 시 풍량 배수(실계산)
      var top=80, bot=H-132;
      // ── 좌: 후드·등속도선 다이어그램
      var hx=110, hyc=(top+bot)/2, hh=84;
      var scale=(W*0.50-hx-30)/0.62;      // 0.62 m 시야
      ctx.strokeStyle=AMB; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(hx,hyc-hh/2); ctx.lineTo(hx,hyc+hh/2); ctx.stroke();
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(hx,hyc-hh/2); ctx.lineTo(hx-46,hyc-16); ctx.lineTo(hx-46,hyc+16); ctx.lineTo(hx,hyc+hh/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-46,hyc-16); ctx.lineTo(hx-96,hyc-16); ctx.moveTo(hx-46,hyc+16); ctx.lineTo(hx-96,hyc+16); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('덕트', hx-72, hyc-24);
      if(fl){ ctx.strokeStyle=GRN; ctx.lineWidth=4;
        ctx.beginPath(); ctx.moveTo(hx,hyc-hh/2); ctx.lineTo(hx,hyc-hh/2-34); ctx.moveTo(hx,hyc+hh/2); ctx.lineTo(hx,hyc+hh/2+34); ctx.stroke();
        ctx.fillStyle=GRN; ctx.fillText('플랜지(폭 ≥ √A)', hx, hyc-hh/2-42);
        ctx.fillStyle=RED; ctx.font='bold 12px sans-serif'; ctx.fillText('후방 기류 차단', hx-58, hyc+hh/2+30); }
      else { ctx.strokeStyle='rgba(155,153,163,0.6)'; ctx.lineWidth=1.4;
        for(var bi=0;bi<2;bi++){ var by=hyc-hh/2-16+bi*(hh+32);
          ctx.beginPath(); ctx.moveTo(hx-40,by); ctx.quadraticCurveTo(hx+16,by,hx+7,hyc+(bi?18:-18)); ctx.stroke(); }
        ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('후방에서도 빨아들임(낭비)', hx-24, hyc-hh/2-24); }
      // 등속도선: V(x)=Vc·(10X²+A)/(10x²+A) → V=f·Vc 인 반경 실계산
      var fr=[1,0.5,0.25], fc=[ORA,BLU,DIM];
      for(var k=0;k<3;k++){ var rr=Math.sqrt(Math.max(0,(base/fr[k]-A)/10));
        var pr=rr*scale; if(pr>W*0.46-hx) continue;
        ctx.strokeStyle=fc[k]; ctx.lineWidth=k===0?2.2:1.4; ctx.setLineDash(k===0?[]:[5,4]);
        ctx.beginPath(); ctx.arc(hx,hyc,pr,-Math.PI*0.44,Math.PI*0.44); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=fc[k]; ctx.textAlign='left'; ctx.font='13px sans-serif';
        ctx.fillText((fr[k]*Vc).toFixed(2)+' m/s', hx+pr*Math.cos(0.35)+4, hyc+pr*Math.sin(0.35)+12); }
      // 발생원 점(거리 X)
      var sxp=hx+Xm*scale;
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(sxp,hyc,6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=PNK; ctx.textAlign='center'; ctx.fillText('발생원', sxp, hyc+22);
      ctx.strokeStyle='rgba(244,160,192,0.5)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(hx,hyc+hh/2+12); ctx.lineTo(sxp,hyc+hh/2+12); ctx.stroke();
      ctx.fillStyle=DIM; ctx.fillText('X = '+s.x+' cm', (hx+sxp)/2, hyc+hh/2+28);
      // ── 우: Q(X) 곡선(플랜지 유/무)
      var px0=W*0.55, px1=W-56, py0=top, py1=bot;
      var ymax=60*Vc*(10*0.36+A)*1.1;
      function PX(xm){ return px0+xm/0.6*(px1-px0); }
      function PY(q){ return py1-(q/ymax)*(py1-py0); }
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,py0); ctx.lineTo(px0,py1); ctx.lineTo(px1,py1); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      for(var xc=0;xc<=60;xc+=20) ctx.fillText(xc+'cm', PX(xc/100), py1+16);
      ctx.textAlign='right';
      ctx.fillText(ymax.toFixed(0), px0-6, py0+8); ctx.fillText('0', px0-6, py1+4);
      ctx.save(); ctx.translate(px0-34, (py0+py1)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center';
      ctx.fillText('필요송풍량 Q (m³/min)',0,0); ctx.restore();
      ctx.lineWidth=2.2;
      for(var mode=0;mode<2;mode++){ ctx.strokeStyle=mode?GRN:ORA; ctx.setLineDash(mode?[6,4]:[]);
        ctx.beginPath();
        for(var xm=0;xm<=0.6001;xm+=0.02){ var q=60*(mode?0.75:1)*Vc*(10*xm*xm+A);
          if(xm===0) ctx.moveTo(PX(xm),PY(q)); else ctx.lineTo(PX(xm),PY(q)); }
        ctx.stroke(); } ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.textAlign='left'; ctx.fillText('플랜지 없음', px1-96, PY(60*Vc*(10*0.33+A))-8);
      ctx.fillStyle=GRN; ctx.fillText('플랜지 부착(×0.75)', px1-130, PY(60*0.75*Vc*(10*0.36+A))+18);
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(PX(Xm),PY(Q0),5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(PX(Xm),PY(Qf),5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('Q(플랜지 없음) = '+Q0.toFixed(1)+' m³/min', px0+12, py0+18);
      ctx.fillText('Q(플랜지 부착) = '+Qf.toFixed(1)+' m³/min (−25%)', px0+12, py0+36);
      ctx.fillStyle=AMB; ctx.fillText('거리 2배(X→2X)면 풍량 ×'+r2.toFixed(2), px0+12, py0+54);
      E.big('Q = '+(fl?'0.75·':'')+'60·Vc·(10X²+A) = 60×'+(fl?'0.75×':'')+Vc.toFixed(2)+'×(10×'+Xm.toFixed(2)+'² + '+A+') = '+Qsel.toFixed(1)+' m³/min',
        '일반식에 제어풍속 Vc·제어거리 X·개구면적 A를 대입한 값입니다 — 흡인력은 거리 제곱으로 죽습니다'); }
  },

  // 2.4 덕트와 반송속도 — V = Q/A (슬라이더)
  { id:'hyg2_04',
    enter:function(E){ var self=this; this.s={q:40, d:21, m:4, t:0};
      var nm=['가스·증기','흄(용접)','미세·가벼운 분진','건조 분진·분말','일반 산업분진','무거운 분진','무겁고 습한 분진'];
      E.controls(
        '<div class="ctrl"><label>풍량 Q (m³/min)</label><input type="range" id="qq" min="10" max="120" step="2" value="40"><output id="qqo">40</output></div>'+
        '<div class="ctrl"><label>덕트 직경 d (cm)</label><input type="range" id="dd" min="10" max="40" step="1" value="21"><output id="ddo">21</output></div>'+
        '<div class="ctrl"><label>이송 물질</label><input type="range" id="mm" min="0" max="6" step="1" value="4"><output id="mmo">일반 산업분진</output></div>');
      E.bind('#qq','input',function(e){ self.s.q=+e.target.value; document.getElementById('qqo').textContent=e.target.value; });
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=e.target.value; });
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=nm[+e.target.value]; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H; s.t++;
      // KOSHA GUIDE 반송속도 기준(m/s)
      var bands=[[5,10],[10,12.5],[12.5,15],[15,20],[17.5,20],[20,22.5],[22.5,30]];
      var names=['가스·증기·연기 (5~10)','흄 — 용접·아연·산화알루미늄 (10~12.5)','미세하고 가벼운 분진 — 면·목·종이 (12.5~15)','건조한 분진·분말 — 고무·가죽·동물털 (15~20)','일반 산업분진 — 그라인더·실리카·주물 (17.5~20)','무거운 분진 — 샌드블라스트·주철보링·납 (20~22.5)','무겁고 습한 분진 — 습한 시멘트·석면덩어리 (22.5 이상)'];
      var mi=Math.max(0,Math.min(6,Math.round(s.m)));
      var lo=bands[mi][0], hi=bands[mi][1];
      var A=Math.PI*Math.pow(s.d/100,2)/4;   // m²
      var V=s.q/60/A;                        // m/s 실계산
      var stt=V<lo?0:(V<=hi?1:2);            // 0 퇴적 1 적정 2 과속
      var stc=[RED,GRN,ORA][stt];
      // ── 덕트 측면도(높이 ∝ d)
      var x0=90, x1=W-90, dh=Math.max(30,s.d*3.4), yc=H*0.36;
      ctx.strokeStyle='rgba(219,238,251,0.45)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x0,yc-dh/2); ctx.lineTo(x1,yc-dh/2); ctx.moveTo(x0,yc+dh/2); ctx.lineTo(x1,yc+dh/2); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('d = '+s.d+' cm', x1+8, yc+4);
      ctx.textAlign='center'; ctx.fillText('풍량 Q = '+s.q+' m³/min →', (x0+x1)/2, yc-dh/2-12);
      // 입자(속도 ∝ V, 상태별 거동)
      var M=26, def=Math.max(0,(lo-V)/lo);
      for(var i=0;i<M;i++){ var ph=((s.t*V*0.0011)*(0.7+hsh(i)*0.6)+hsh(i*3+1))%1;
        var px=x0+8+ph*(x1-x0-16), py, al=0.9;
        if(stt===0){ var sink=Math.min(1, ph*(1.2+def*3));
          py=yc-dh/2+6+(dh-12)*(0.25+0.75*sink)*Math.min(1,0.3+hsh(i+9)*0.2+sink);
          py=Math.min(py, yc+dh/2-3); }
        else py=yc+(hsh(i*7+3)-0.5)*(dh-12);
        ctx.fillStyle='rgba(244,160,192,'+al+')';
        if(stt===2){ ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.moveTo(px-Math.min(26,V*0.9),py); ctx.lineTo(px,py); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(px,py,2.6,0,Math.PI*2); ctx.fill(); }
      // 퇴적 더미(부족분 ∝ 높이 — 실계산 def)
      if(stt===0){ var pileH=def*(dh*0.55);
        ctx.fillStyle='rgba(240,136,138,0.55)';
        ctx.beginPath(); ctx.moveTo(x0+40,yc+dh/2);
        for(var xp=x0+40;xp<=x1-30;xp+=14) ctx.lineTo(xp, yc+dh/2-pileH*(0.6+0.4*hsh(xp)));
        ctx.lineTo(x1-30,yc+dh/2); ctx.closePath(); ctx.fill();
        ctx.fillStyle=RED; ctx.textAlign='center'; ctx.font='bold 12px sans-serif';
        ctx.fillText('퇴적! 덕트 막힘 → 화재·성능저하', (x0+x1)/2, yc+dh/2+22); }
      if(stt===2){ ctx.fillStyle=ORA; ctx.textAlign='center'; ctx.font='12px sans-serif';
        ctx.fillText('과속 — 압력손실(∝V²)·마모·소음 증가', (x0+x1)/2, yc+dh/2+22); }
      // ── 속도 게이지(0~32 m/s, 적정 대역 표시)
      var gy=H*0.62, gx0=110, gx1=W-110, gmax=32;
      function GX(v){ return gx0+Math.min(v,gmax)/gmax*(gx1-gx0); }
      ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(gx0,gy,gx1-gx0,16);
      ctx.fillStyle='rgba(143,227,181,0.4)'; ctx.fillRect(GX(lo),gy,GX(Math.min(hi,gmax))-GX(lo),16);
      ctx.strokeStyle=GRN; ctx.lineWidth=1.2; ctx.strokeRect(GX(lo),gy,GX(Math.min(hi,gmax))-GX(lo),16);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      for(var tv=0;tv<=gmax;tv+=8) ctx.fillText(tv, GX(tv), gy+32);
      ctx.fillStyle=GRN; ctx.fillText('적정 '+lo+'~'+hi+' m/s', (GX(lo)+GX(Math.min(hi,gmax)))/2, gy-8);
      ctx.fillStyle=stc; ctx.beginPath();
      ctx.moveTo(GX(V),gy-4); ctx.lineTo(GX(V)-6,gy-14); ctx.lineTo(GX(V)+6,gy-14); ctx.closePath(); ctx.fill();
      ctx.font='bold 12px sans-serif'; ctx.fillText('V='+V.toFixed(1), GX(V), gy-20);
      ctx.fillStyle=TXT; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText(names[mi], W/2, gy+56);
      var msg=['반송속도 부족 — 직경을 줄이거나 풍량을 키우세요','적정 — 퇴적 없이 이송하면서 압력손실도 과하지 않습니다','기준 초과 — 이송은 되지만 에너지·마모 비용을 치릅니다'][stt];
      E.big('V = Q/A = '+s.q+'/60 ÷ '+A.toFixed(4)+' = '+V.toFixed(1)+' m/s',
        msg); }
  },

  // 2.5 압력손실과 운전점 — VP=(V/4.043)², ΔP=F·VP, 시스템곡선∩송풍기곡선 (슬라이더)
  { id:'hyg2_05',
    enter:function(E){ var self=this; this.s={q:60, L:20, n:2};
      E.controls(
        '<div class="ctrl"><label>탐색 풍량 Q (m³/min)</label><input type="range" id="qq" min="10" max="150" step="5" value="60"><output id="qqo">60</output></div>'+
        '<div class="ctrl"><label>덕트 길이 L (m)</label><input type="range" id="ll" min="5" max="60" step="1" value="20"><output id="llo">20</output></div>'+
        '<div class="ctrl"><label>곡관(엘보) 수</label><input type="range" id="nn" min="0" max="8" step="1" value="2"><output id="nno">2</output></div>');
      E.bind('#qq','input',function(e){ self.s.q=+e.target.value; document.getElementById('qqo').textContent=e.target.value; });
      E.bind('#ll','input',function(e){ self.s.L=+e.target.value; document.getElementById('llo').textContent=e.target.value; });
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var D=0.3, A=Math.PI*D*D/4;             // 덕트 직경 0.3m 고정 예시
      var Fh=0.4, lam=0.02, Fel=0.27;         // 후드 유입손실·마찰계수·곡관 손실계수(예시 상수)
      var Ftot=(1+Fh)+lam*s.L/D+Fel*s.n;      // 가속(1)+후드+직관+곡관 — 전부 VP의 배수
      var k1=Math.pow(1/(60*A*4.043),2);      // ΔP = k1·Ftot·Q²  (VP=(V/4.043)², V=Q/60A)
      var c=k1*Ftot;
      var P0=120, Qm=160;                     // 송풍기 곡선 P=P0(1-(Q/Qm)²) 예시
      var opQ=Math.sqrt(P0/(c+P0/(Qm*Qm)));   // 운전점(교점) 실계산
      var opV=opQ/60/A, opVP=Math.pow(opV/4.043,2), opDP=c*opQ*opQ;
      var q=s.q, pV=q/60/A, pVP=Math.pow(pV/4.043,2), pDP=c*q*q;
      // ── 그래프
      var mLx=86, mRx=250, top=76, bot=H-140;
      var px0=mLx, px1=W-mRx, py0=top, py1=bot, xmax=160, ymax=140;
      function PX(x){ return px0+x/xmax*(px1-px0); }
      function PY(y){ return py1-Math.min(y,ymax)/ymax*(py1-py0); }
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px0,py0); ctx.lineTo(px0,py1); ctx.lineTo(px1,py1); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      for(var xt=0;xt<=xmax;xt+=40) ctx.fillText(xt, PX(xt), py1+16);
      ctx.fillText('풍량 Q (m³/min)', (px0+px1)/2, py1+34);
      ctx.textAlign='right';
      for(var yt=0;yt<=ymax;yt+=35) ctx.fillText(yt, px0-6, PY(yt)+4);
      ctx.save(); ctx.translate(px0-46,(py0+py1)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center';
      ctx.fillText('압력 (mmH₂O)',0,0); ctx.restore();
      // 송풍기 곡선
      ctx.strokeStyle=BLU; ctx.lineWidth=2.4; ctx.beginPath();
      for(var qx=0;qx<=xmax;qx+=4){ var pf=P0*(1-(qx/Qm)*(qx/Qm));
        if(qx===0) ctx.moveTo(PX(qx),PY(pf)); else ctx.lineTo(PX(qx),PY(pf)); }
      ctx.stroke();
      ctx.fillStyle=BLU; ctx.textAlign='left'; ctx.fillText('송풍기 성능곡선', PX(6), PY(P0)-8);
      // 시스템 곡선(∝Q²)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.4; ctx.beginPath();
      for(qx=0;qx<=xmax;qx+=4){ var ps=c*qx*qx; if(ps>ymax){ ctx.lineTo(PX(qx),PY(ymax)); break; }
        if(qx===0) ctx.moveTo(PX(qx),PY(ps)); else ctx.lineTo(PX(qx),PY(ps)); }
      ctx.stroke();
      ctx.fillStyle=ORA;
      var lbq=Math.min(Math.sqrt(ymax*0.85/c), xmax*0.9);
      ctx.fillText('시스템 곡선 ΔP∝Q²', PX(lbq)-120, PY(c*lbq*lbq)-10);
      // 탐색점(핑크)·운전점(초록 별)
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(PX(q),PY(pDP),5.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=PNK; ctx.textAlign='left'; ctx.font='13px sans-serif';
      ctx.fillText('탐색점 Q='+q, PX(q)+8, PY(pDP)+4);
      var ox=PX(opQ), oy=PY(opDP);
      ctx.strokeStyle=GRN; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(ox,oy,7,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox-11,oy); ctx.lineTo(ox+11,oy); ctx.moveTo(ox,oy-11); ctx.lineTo(ox,oy+11); ctx.stroke();
      ctx.fillStyle=GRN; ctx.font='bold 12px sans-serif';
      ctx.fillText('운전점 Q*='+opQ.toFixed(0), ox+12, oy-10);
      // ── 우측: 운전점 손실 내역(누적 막대 — 전부 VP 배수 실계산)
      var comp=[(1+Fh)*opVP, lam*s.L/D*opVP, Fel*s.n*opVP];
      var cn=['후드정압 VP(1+F)','직관 마찰 λL/D·VP','곡관 F·VP×n'], cc=[GRN,ORA,PNK];
      var bx=W-mRx+46, bw=54, bb=bot, sc=(bot-top)/ymax, yacc=bb;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('운전점 손실 내역', bx+bw/2, top-6);
      for(var ci=0;ci<3;ci++){ var hgt=comp[ci]*sc;
        ctx.fillStyle=cc[ci]; ctx.globalAlpha=0.45; ctx.fillRect(bx,yacc-hgt,bw,hgt); ctx.globalAlpha=1;
        ctx.strokeStyle=cc[ci]; ctx.strokeRect(bx,yacc-hgt,bw,hgt);
        ctx.fillStyle=cc[ci]; ctx.textAlign='left'; ctx.font='13px sans-serif';
        ctx.fillText(cn[ci]+' = '+comp[ci].toFixed(1), bx+bw+8, yacc-hgt/2+4);
        yacc-=hgt; }
      ctx.fillStyle=TXT; ctx.textAlign='left';
      ctx.fillText('합계 ΔP* = '+opDP.toFixed(1)+' mmH₂O', bx, yacc-10);
      ctx.fillStyle=DIM;
      ctx.fillText('V*='+opV.toFixed(1)+' m/s · VP*=(V/4.043)²='+opVP.toFixed(1), bx, bb+18);
      ctx.fillStyle=PNK;
      ctx.fillText('탐색점: V='+pV.toFixed(1)+' · VP='+pVP.toFixed(1)+' · ΔP='+pDP.toFixed(1), bx, bb+36);
      E.big('운전점 = 시스템 곡선 ∩ 송풍기 곡선 → Q* = '+opQ.toFixed(0)+' m³/min · ΔP* = '+opDP.toFixed(0)+' mmH₂O',
        '덕트를 늘리거나 곡관을 더하면 시스템 곡선이 일어서고 운전점 풍량이 줄어듭니다'); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
