/* 산업위생관리기술사 제3장 — 작업환경 측정과 평가(측정 설계·시료채취·LOD/LOQ·통계 판정·활용).
   동작만. 텍스트=content/hyg3.json. 모든 표시 수치는 draw에서 실계산(골든룰). */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 결정적 의사난수(Math.random 금지)
  function hsh(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
  // 표준정규 누적분포 Φ(z) — Abramowitz-Stegun erf 근사
  function erf(x){ var s=x<0?-1:1; x=Math.abs(x);
    var t=1/(1+0.3275911*x);
    var y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
    return s*y; }
  function Phi(z){ return 0.5*(1+erf(z/Math.SQRT2)); }

  var scenes=[

  // 3.1 측정의 설계 — 누구를, 어디서, 얼마나 (tap 단계 4)
  { id:'hyg3_01',
    enter:function(E){ this.s={step:0, t:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H, st=s.step; s.t++;
      // 작업장 평면도(위에서 내려다본 도면) — 실제 폭 12m × 깊이 8m
      var Wm=12, Hm=8;
      var px0=64, py0=96, pw=W-320, ph=H-224;
      var mapX=function(fx){ return px0+fx*pw; }, mapY=function(fy){ return py0+fy*ph; };
      // 공정(발생원) — fraction 좌표
      var src=[{fx:0.20,fy:0.28,n:'용접부',c:BLU},{fx:0.72,fy:0.24,n:'도장부',c:PNK},{fx:0.46,fy:0.74,n:'연삭부',c:GRN}];
      // 근로자 — seg = 소속 공정 index
      var wk=[{fx:0.14,fy:0.40,seg:0,id:'A1'},{fx:0.28,fy:0.20,seg:0,id:'A2'},
              {fx:0.66,fy:0.36,seg:1,id:'B1'},{fx:0.80,fy:0.14,seg:1,id:'B2'},
              {fx:0.38,fy:0.66,seg:2,id:'C1'},{fx:0.56,fy:0.80,seg:2,id:'C2'}];
      var segC=[BLU,PNK,GRN];
      // 각 근로자→소속 공정 발생원 실거리(m) 계산
      wk.forEach(function(w){ var S=src[w.seg];
        var dx=(w.fx-S.fx)*Wm, dy=(w.fy-S.fy)*Hm; w.d=Math.sqrt(dx*dx+dy*dy); });
      // 공정별 최고노출근로자(= 발생원 최근접) 실계산
      var top=[null,null,null];
      wk.forEach(function(w){ if(!top[w.seg]||w.d<top[w.seg].d) top[w.seg]=w; });
      // 도면 외곽
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=2; ctx.strokeRect(px0,py0,pw,ph);
      ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fillRect(px0,py0,pw,ph);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('단위작업장소 평면도 (12m × 8m)', px0+6, py0-8);
      // SEG 그룹 배경(step0 이상)
      if(st>=0){ for(var g=0;g<3;g++){ var xs=[],ys=[];
        wk.forEach(function(w){ if(w.seg===g){ xs.push(mapX(w.fx)); ys.push(mapY(w.fy)); } });
        xs.push(mapX(src[g].fx)); ys.push(mapY(src[g].fy));
        var cx=xs.reduce(function(a,b){return a+b;},0)/xs.length, cy=ys.reduce(function(a,b){return a+b;},0)/ys.length;
        var rad=0; for(var i=0;i<xs.length;i++){ var dd=Math.hypot(xs[i]-cx,ys[i]-cy); if(dd>rad)rad=dd; }
        ctx.strokeStyle=segC[g]; ctx.globalAlpha=0.55; ctx.setLineDash([6,4]); ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(cx,cy,rad+22,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha=1; ctx.fillStyle=segC[g]; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('SEG '+(g+1)+' · '+src[g].n, cx, cy-rad-28); } }
      // 발생원
      src.forEach(function(S){ var x=mapX(S.fx), y=mapY(S.fy);
        ctx.fillStyle=S.c; ctx.globalAlpha=0.28; ctx.fillRect(x-20,y-14,40,28); ctx.globalAlpha=1;
        ctx.strokeStyle=S.c; ctx.lineWidth=1.6; ctx.strokeRect(x-20,y-14,40,28);
        ctx.fillStyle=S.c; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(S.n, x, y+4); });
      // 근로자
      wk.forEach(function(w){ var x=mapX(w.fx), y=mapY(w.fy);
        var isTop=(top[w.seg]===w), hi=(st===2&&isTop);
        // step1: 대표 근로자(각 SEG 최고노출)에 개인시료 호흡영역 표시
        if(st===1 && isTop){ // 호흡영역 반경 30cm(도면 스케일)
          var r30=0.30/Wm*pw;
          ctx.strokeStyle=ORA; ctx.lineWidth=1.6; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.arc(x,y,Math.max(10,r30),0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('호흡영역', x, y-Math.max(10,r30)-4); }
        ctx.fillStyle=hi?ORA:segC[w.seg];
        ctx.beginPath(); ctx.arc(x,y,hi?8:6,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=TXT; ctx.font=(hi?'600 ':'')+'12px sans-serif'; ctx.textAlign='center'; ctx.fillText(w.id, x, y+18);
        // step2: 최고노출근로자 거리선 + 값
        if(st===2 && isTop){ var S=src[w.seg];
          ctx.strokeStyle=ORA; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(mapX(S.fx),mapY(S.fy)); ctx.stroke();
          ctx.fillStyle=ORA; ctx.font='12px sans-serif';
          ctx.fillText(w.d.toFixed(2)+' m', (x+mapX(S.fx))/2, (y+mapY(S.fy))/2-4); } });
      // step1: 지역시료 삼각대(공정 사이 배경 위치)
      if(st===1){ var ax=mapX(0.46), ay=mapY(0.46);
        ctx.strokeStyle=BLU; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(ax,ay-10); ctx.lineTo(ax-8,ay+8); ctx.moveTo(ax,ay-10); ctx.lineTo(ax+8,ay+8); ctx.moveTo(ax,ay-10); ctx.lineTo(ax,ay+8); ctx.stroke();
        ctx.beginPath(); ctx.arc(ax,ay-14,4,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle=BLU; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('지역시료(고정)', ax, ay+22); }
      // ── 우측 설명 패널
      var qx=W-236, qy=py0+6, qw=210;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(242,189,85,0.30)'; ctx.lineWidth=1;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(qx,qy,qw,ph-12,8);ctx.fill();ctx.stroke();}else{ctx.strokeRect(qx,qy,qw,ph-12);}
      ctx.textAlign='left';
      var head=['① 유사노출군(SEG)','② 개인시료 vs 지역시료','③ 최고노출근로자','④ 측정 주기'][st];
      ctx.fillStyle=AMB; ctx.font='600 13px sans-serif'; ctx.fillText(head, qx+14, qy+24);
      ctx.fillStyle=TXT; ctx.font='13.5px sans-serif';
      var lines=[
        ['같은 유해인자에','통계적으로 비슷한','수준으로 노출되는','근로자를 한 군으로.','조직→공정→작업→','동일인자 그룹→업무','순으로 세분합니다.','대표자만 측정해도','군 전체를 추정.'],
        ['개인시료: 호흡위치','(반경 30cm 반구)에서','채취 — 노출평가의','원칙입니다.','지역시료: 작업범위에','고정, 배경농도·시간','변화 평가·개선효과.','개인시료 곤란 시','보조로만 사용.'],
        ['SEG마다 발생원에','가장 가까운(가장','많이 노출되는)','근로자를 대표로','선정합니다.','거리를 실측해 최근접','근로자를 고른 결과:','A2·B1·C1이 각 군','최고노출근로자.'],
        ['정기: 6개월에 1회','발암성·기준 2배 초과:','3개월에 1회로 단축','2회 연속 기준 미만+','공정 변경 없음:','1년에 1회로 완화','공정·물질·설비','변경 시 30일 이내','측정(변경 측정).']
      ][st];
      for(var i=0;i<lines.length;i++) ctx.fillText(lines[i], qx+14, qy+48+i*20);
      E.tapHint(0,0,'다음 단계',true);
      var big=['측정의 설계 — SEG로 근로자를 묶습니다','개인시료가 원칙, 지역시료는 보조','대표는 최고노출근로자 — 거리를 실측합니다','언제 다시 재는가 — 측정 주기'][st];
      var sub=['한 사람 한 사람을 다 잴 수 없으니, 같은 노출을 받는 근로자를 유사노출군으로 묶어 대표를 측정합니다',
        '노출을 평가하려면 코와 입 주변(반경 30cm)에서 재야 합니다 — 지역시료는 배경·경향 파악용입니다',
        '군에서 가장 위험한 사람이 기준을 통과하면 나머지는 안전합니다 — 그래서 발생원 최근접자를 고릅니다',
        '정기 6개월, 위험하면 3개월로 조이고, 안정적이면 1년으로 풉니다 — 공정이 바뀌면 곧바로 다시 잽니다'][st];
      E.big(big, sub); }
  },

  // 3.2 시료채취의 산수 — 공기량이 분모다 (슬라이더)
  { id:'hyg3_02',
    enter:function(E){ var self=this; this.s={q:0.2, t:240, m:1.0};
      E.controls(
        '<div class="ctrl"><label>펌프 유량 Q (L/min)</label><input type="range" id="q2" min="0.05" max="3" step="0.05" value="0.2"><output id="q2o">0.2</output></div>'+
        '<div class="ctrl"><label>채취 시간 t (min)</label><input type="range" id="t2" min="10" max="480" step="10" value="240"><output id="t2o">240</output></div>'+
        '<div class="ctrl"><label>분석된 질량 m (mg)</label><input type="range" id="m2" min="0.1" max="5" step="0.1" value="1.0"><output id="m2o">1.0</output></div>');
      E.bind('#q2','input',function(e){ self.s.q=+e.target.value; document.getElementById('q2o').textContent=e.target.value; });
      E.bind('#t2','input',function(e){ self.s.t=+e.target.value; document.getElementById('t2o').textContent=e.target.value; });
      E.bind('#m2','input',function(e){ self.s.m=+e.target.value; document.getElementById('m2o').textContent=(+e.target.value).toFixed(1); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var Q=s.q, t=s.t, m=s.m;
      var V_L=Q*t;                 // 채취 공기량(L)
      var V_m3=V_L/1000;           // m³
      var C=m/V_m3;                // 농도 mg/m³ (실계산)
      var top=80, bot=H-150;
      // ── 좌: 채취 열차(공기 → 채취매체 → 펌프) + 누적 공기량 기둥
      var lx=80, lw=W*0.30;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('시료채취 열차', lx+lw/2, top-8);
      // 공기 유입 화살표
      ctx.strokeStyle=BLU; ctx.lineWidth=1.8;
      var ay=top+40;
      ctx.beginPath(); ctx.moveTo(lx,ay); ctx.lineTo(lx+42,ay); ctx.lineTo(lx+34,ay-5); ctx.moveTo(lx+42,ay); ctx.lineTo(lx+34,ay+5); ctx.stroke();
      ctx.fillStyle=BLU; ctx.fillText('공기', lx+20, ay-10);
      // 채취매체(카세트/흡착관)
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.strokeRect(lx+48,ay-14,44,28);
      ctx.fillStyle='rgba(143,227,181,0.15)'; ctx.fillRect(lx+48,ay-14,44,28);
      ctx.fillStyle=GRN; ctx.fillText('채취매체', lx+70, ay+30);
      // 펌프
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(lx+118,ay,15,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('펌프', lx+118, ay+30); ctx.fillText(Q.toFixed(2)+' L/min', lx+118, ay-20);
      // 누적 공기량 기둥(V, 최대 표시 720L 기준)
      var colx=lx+20, colw=64, coly0=ay+56, coly1=bot;
      ctx.strokeStyle='rgba(219,238,251,0.4)'; ctx.lineWidth=1.4; ctx.strokeRect(colx,coly0,colw,coly1-coly0);
      var Vfrac=Math.min(1, V_L/720);
      ctx.fillStyle='rgba(122,184,255,0.45)'; ctx.fillRect(colx, coly1-(coly1-coly0)*Vfrac, colw, (coly1-coly0)*Vfrac);
      ctx.fillStyle=BLU; ctx.font='600 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('V = '+V_L.toFixed(0)+' L', colx+colw/2, coly1-(coly1-coly0)*Vfrac-8);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('채취 공기량', colx+colw/2, coly1+16);
      ctx.fillText('= '+V_m3.toFixed(4)+' m³', colx+colw/2, coly1+30);
      // ── 우: 농도 = 질량 / 공기량 (막대 나눗셈 시각화)
      var rx=W*0.46, rw=W*0.44;
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('농도 = 분석 질량 ÷ 공기량', rx+rw/2, top-8);
      // 질량(분자) 상자
      var mbx=rx+30, mby=top+24, mbw=rw-120;
      ctx.fillStyle='rgba(244,160,192,0.25)'; ctx.fillRect(mbx,mby,mbw*Math.min(1,m/5),34);
      ctx.strokeStyle=PNK; ctx.lineWidth=1.6; ctx.strokeRect(mbx,mby,mbw,34);
      ctx.fillStyle=PNK; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('질량 m = '+m.toFixed(1)+' mg', mbx+8, mby+22);
      // 나눗셈 바
      ctx.strokeStyle=TXT; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(mbx,mby+48); ctx.lineTo(mbx+mbw,mby+48); ctx.stroke();
      // 공기량(분모) 상자
      ctx.fillStyle='rgba(122,184,255,0.22)'; ctx.fillRect(mbx,mby+58,mbw*Math.min(1,V_m3/0.72),34);
      ctx.strokeStyle=BLU; ctx.strokeRect(mbx,mby+58,mbw,34);
      ctx.fillStyle=BLU; ctx.fillText('공기량 V = '+V_m3.toFixed(4)+' m³', mbx+8, mby+80);
      // 결과 게이지
      var gy=mby+130, gw=mbw;
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('C = '+C.toFixed(1)+' mg/m³', mbx+gw/2, gy);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('공기량이 커질수록(오래·빠르게 채취) 같은 질량도 낮은 농도로 읽힙니다', mbx+gw/2, gy+22);
      // 유량 보정(비누거품미터) 인셋
      var bx=rx+30, by=gy+44, bw2=rw-120, bh=54;
      ctx.strokeStyle='rgba(242,189,85,0.4)'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw2,bh);
      ctx.fillStyle=AMB; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('유량 보정 — 비누거품미터(1차 표준, ±1%)', bx+8, by+16);
      // 뷰렛 + 거품
      var tvx=bx+16, tvy0=by+22, tvy1=by+46;
      ctx.strokeStyle=BLU; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tvx,tvy0); ctx.lineTo(tvx,tvy1); ctx.moveTo(tvx+10,tvy0); ctx.lineTo(tvx+10,tvy1); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.beginPath(); ctx.arc(tvx+5,(tvy0+tvy1)/2,5,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('거품이 눈금 부피를 지나는 시간으로 실제 유량을 확인 — 채취 전·후 보정(전후 ±10% 이내)', bx+34, by+40);
      E.big('C = m / (Q×t) = '+m.toFixed(1)+' mg ÷ ('+Q.toFixed(2)+'×'+t+'/1000) m³ = '+C.toFixed(1)+' mg/m³',
        '분모는 채취한 공기의 부피입니다 — 유량과 시간을 정확히 알아야 농도가 정확해집니다'); }
  },

  // 3.3 LOD와 LOQ — 볼 수 있는 것의 한계 (슬라이더)
  { id:'hyg3_03',
    enter:function(E){ var self=this; this.s={sd:0.025, c:100, q:0.2};
      E.controls(
        '<div class="ctrl"><label>바탕신호 표준편차 σ (mg)</label><input type="range" id="sd" min="0.005" max="0.1" step="0.005" value="0.025"><output id="sdo">0.025</output></div>'+
        '<div class="ctrl"><label>추정 노출농도 C (mg/m³)</label><input type="range" id="c3" min="5" max="300" step="5" value="100"><output id="c3o">100</output></div>'+
        '<div class="ctrl"><label>펌프 유량 Q (L/min)</label><input type="range" id="q3" min="0.05" max="3" step="0.05" value="0.2"><output id="q3o">0.2</output></div>');
      E.bind('#sd','input',function(e){ self.s.sd=+e.target.value; document.getElementById('sdo').textContent=(+e.target.value).toFixed(3); });
      E.bind('#c3','input',function(e){ self.s.c=+e.target.value; document.getElementById('c3o').textContent=e.target.value; });
      E.bind('#q3','input',function(e){ self.s.q=+e.target.value; document.getElementById('q3o').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var sd=s.sd, C=s.c, Q=s.q;
      var LOD=3*sd, LOQ=10*sd;               // NIOSH: 3σ / 10σ
      var Vmin_m3=LOQ/C, Vmin_L=Vmin_m3*1000;// 최소 채취 공기량
      var tmin=Vmin_L/Q;                     // 최소 채취 시간
      var top=76, bot=H-150;
      // ── 바탕신호 정규분포 곡선(x = 분석신호 질량 mg)
      var gx0=80, gx1=W-90, gy0=top+18, gy1=bot;
      var xmax=12*sd;                        // 0~12σ
      function GX(x){ return gx0+x/xmax*(gx1-gx0); }
      function pdf(x){ return Math.exp(-x*x/(2*sd*sd)); } // 정규(peak 1로 정규화)
      // 축
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy1); ctx.lineTo(gx1,gy1); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('분석신호(질량, mg) →', (gx0+gx1)/2, gy1+34);
      // ND(불검출) 영역 음영: x < LOD
      ctx.fillStyle='rgba(155,153,163,0.14)'; ctx.fillRect(gx0, gy0, GX(LOD)-gx0, gy1-gy0);
      // 곡선
      ctx.strokeStyle=BLU; ctx.lineWidth=2.4; ctx.beginPath();
      for(var x=0;x<=xmax;x+=xmax/160){ var yy=gy1-pdf(x)*(gy1-gy0)*0.92;
        if(x===0) ctx.moveTo(GX(x),yy); else ctx.lineTo(GX(x),yy); }
      ctx.stroke();
      ctx.fillStyle=BLU; ctx.textAlign='left'; ctx.font='13px sans-serif'; ctx.fillText('바탕(공시료) 신호 분포 σ='+sd.toFixed(3), GX(0.3*sd), gy0+4);
      // LOD 선(3σ)
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(GX(LOD),gy0-6); ctx.lineTo(GX(LOD),gy1); ctx.stroke();
      // LOQ 선(10σ)
      ctx.strokeStyle=GRN; ctx.beginPath(); ctx.moveTo(GX(LOQ),gy0-6); ctx.lineTo(GX(LOQ),gy1); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.textAlign='center'; ctx.font='600 12px sans-serif';
      ctx.fillText('LOD=3σ', GX(LOD), gy0-12); ctx.font='13px sans-serif'; ctx.fillText(LOD.toFixed(3)+' mg', GX(LOD), gy1+16);
      ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.fillText('LOQ=10σ', GX(LOQ), gy0-12); ctx.font='13px sans-serif'; ctx.fillText(LOQ.toFixed(3)+' mg', GX(LOQ), gy1+16);
      // 구간 라벨
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('불검출(ND) — 못 봄', gx0+(GX(LOD)-gx0)/2, gy0+56);
      ctx.fillStyle=ORA; ctx.fillText('검출 O·정량 X', (GX(LOD)+GX(LOQ))/2, gy0+56);
      ctx.fillStyle=GRN; ctx.fillText('정량 가능', (GX(LOQ)+gx1)/2, gy0+56);
      // ── 우하: 최소 채취 공기량/시간 패널
      var qx=gx1-244, qy=gy0+70, qw=236, qh=96;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(242,189,85,0.30)'; ctx.lineWidth=1;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(qx,qy,qw,qh,8);ctx.fill();ctx.stroke();}else{ctx.strokeRect(qx,qy,qw,qh);}
      ctx.textAlign='left'; ctx.fillStyle=AMB; ctx.font='600 12px sans-serif'; ctx.fillText('정량하려면 얼마나 채취?', qx+12, qy+20);
      ctx.fillStyle=TXT; ctx.font='13.5px sans-serif';
      ctx.fillText('최소공기량 = LOQ ÷ 추정농도', qx+12, qy+42);
      ctx.fillStyle=GRN; ctx.font='600 12px sans-serif';
      ctx.fillText('= '+LOQ.toFixed(3)+' ÷ '+C+' = '+Vmin_L.toFixed(2)+' L', qx+12, qy+62);
      ctx.fillStyle=TXT; ctx.font='13.5px sans-serif';
      ctx.fillText('최소시간 = 공기량 ÷ 유량', qx+12, qy+80);
      ctx.fillStyle=ORA; ctx.font='600 12px sans-serif';
      ctx.fillText('= '+Vmin_L.toFixed(2)+' ÷ '+Q.toFixed(2)+' = '+tmin.toFixed(1)+' min', qx+112, qy+80);
      E.big('LOD = 3σ = '+LOD.toFixed(3)+' mg · LOQ = 10σ = '+LOQ.toFixed(3)+' mg → 최소 채취 '+tmin.toFixed(0)+'분',
        '불검출은 "없다"가 아니라 "이 방법으로는 못 본다"입니다 — 정량하려면 최소 공기량 이상을 채취해야 합니다'); }
  },

  // 3.4 노출 평가 판정 — 기하평균과 대수정규분포 (슬라이더)
  { id:'hyg3_04',
    enter:function(E){ var self=this; this.s={gm:30, gsd:2.0, oel:50};
      E.controls(
        '<div class="ctrl"><label>기하평균 GM (ppm)</label><input type="range" id="gm" min="5" max="200" step="1" value="30"><output id="gmo">30</output></div>'+
        '<div class="ctrl"><label>기하표준편차 GSD</label><input type="range" id="gs" min="1.2" max="4" step="0.05" value="2.0"><output id="gso">2.0</output></div>'+
        '<div class="ctrl"><label>노출기준 OEL (ppm)</label><input type="range" id="oe" min="10" max="300" step="5" value="50"><output id="oeo">50</output></div>');
      E.bind('#gm','input',function(e){ self.s.gm=+e.target.value; document.getElementById('gmo').textContent=e.target.value; });
      E.bind('#gs','input',function(e){ self.s.gsd=+e.target.value; document.getElementById('gso').textContent=(+e.target.value).toFixed(2); });
      E.bind('#oe','input',function(e){ self.s.oel=+e.target.value; document.getElementById('oeo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var GM=s.gm, GSD=s.gsd, OEL=s.oel;
      var lnGM=Math.log(GM), lnGSD=Math.log(GSD);
      var AM=Math.exp(lnGM+0.5*lnGSD*lnGSD);            // 산술평균(항상 GM보다 큼)
      var z=(Math.log(OEL)-lnGM)/lnGSD;                 // 표준화값
      var Pex=1-Phi(z);                                  // 노출기준 초과 확률
      var X95=GM*Math.pow(GSD,1.645);                   // 95 백분위수
      // 판정: 95백분위<OEL 양호 / GM<OEL≤95백분위 주의 / OEL≤GM 초과
      var verd, vcol;
      if(X95<=OEL){ verd='양호(허용)'; vcol=GRN; }
      else if(OEL>GM){ verd='주의(추가관리)'; vcol=ORA; }
      else { verd='초과(개선필요)'; vcol=RED; }
      var top=74, bot=H-150;
      var gx0=80, gx1=W-90, gy0=top+16, gy1=bot;
      var xmax=Math.max(OEL, X95, AM)*1.7;
      function GX(x){ return gx0+x/xmax*(gx1-gx0); }
      // 대수정규 pdf(peak 1로 정규화)
      var mode=Math.exp(lnGM-lnGSD*lnGSD);              // 최빈값
      // 곡선은 샘플 최댓값으로 정규화(peak 1)
      var peak=0, samp=[];
      for(var i=0;i<=200;i++){ var x=xmax*i/200; var v=(x<=0)?0:(1/x)*Math.exp(-Math.pow(Math.log(x)-lnGM,2)/(2*lnGSD*lnGSD)); samp.push(v); if(v>peak)peak=v; }
      // 축
      ctx.strokeStyle='rgba(219,238,251,0.32)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy1); ctx.lineTo(gx1,gy1); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('농도 (ppm) →', (gx0+gx1)/2, gy1+34);
      for(var xt=0;xt<=xmax;xt+=Math.max(20,Math.round(xmax/6/10)*10)) ctx.fillText(xt.toFixed(0), GX(xt), gy1+16);
      // 초과영역(x>OEL) 음영
      ctx.fillStyle='rgba(240,136,138,0.22)'; ctx.beginPath(); ctx.moveTo(GX(OEL),gy1);
      for(var j=0;j<=200;j++){ var x2=xmax*j/200; if(x2<OEL) continue; ctx.lineTo(GX(x2), gy1-samp[j]/peak*(gy1-gy0)*0.92); }
      ctx.lineTo(GX(xmax),gy1); ctx.closePath(); ctx.fill();
      // 분포 곡선
      ctx.strokeStyle=BLU; ctx.lineWidth=2.4; ctx.beginPath();
      for(var k=0;k<=200;k++){ var xx=xmax*k/200, yy=gy1-samp[k]/peak*(gy1-gy0)*0.92;
        if(k===0) ctx.moveTo(GX(0),gy1); else ctx.lineTo(GX(xx),yy); }
      ctx.stroke();
      ctx.fillStyle=BLU; ctx.textAlign='left'; ctx.font='13px sans-serif'; ctx.fillText('대수정규분포(측정값의 자연스러운 모양)', GX(mode)+6, gy0+40);
      // 세로선: GM(중앙값), AM(산술평균), OEL
      function vline(x,c,lab,yo){ ctx.strokeStyle=c; ctx.lineWidth=1.8; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(GX(x),gy0-6); ctx.lineTo(GX(x),gy1); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=c; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab, GX(x), gy0-10+yo); }
      vline(GM, GRN, 'GM '+GM, 0);
      vline(AM, PNK, 'AM '+AM.toFixed(0), 16);
      vline(OEL, RED, 'OEL '+OEL, 0);
      // 판정 패널
      var qx=gx1-250, qy=gy0+8, qw=242, qh=110;
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=vcol; ctx.lineWidth=1.4;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(qx,qy,qw,qh,8);ctx.fill();ctx.stroke();}else{ctx.strokeRect(qx,qy,qw,qh);}
      ctx.textAlign='left';
      ctx.fillStyle=vcol; ctx.font='600 15px sans-serif'; ctx.fillText('판정: '+verd, qx+12, qy+24);
      ctx.fillStyle=TXT; ctx.font='13.5px sans-serif';
      ctx.fillText('초과확률 P(X>OEL) = '+(Pex*100).toFixed(1)+' %', qx+12, qy+46);
      ctx.fillText('표준화값 Z = (lnOEL−lnGM)/lnGSD', qx+12, qy+64);
      ctx.fillStyle=ORA; ctx.font='600 13.5px sans-serif'; ctx.fillText('= '+z.toFixed(2), qx+220, qy+64);
      ctx.fillStyle=TXT; ctx.font='13.5px sans-serif';
      ctx.fillText('95 백분위수 = GM·GSD^1.645 = '+X95.toFixed(0), qx+12, qy+82);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('GM='+GM+' < AM='+AM.toFixed(0)+' — 산술평균은 소수의 고농도에 끌려', qx+12, qy+100);
      E.big('GM='+GM+' · GSD='+GSD.toFixed(2)+' · OEL='+OEL+' → 초과확률 '+(Pex*100).toFixed(1)+'% → '+verd,
        '측정값은 대수정규분포입니다 — 대표값은 큰 값에 끌려가는 산술평균이 아니라 기하평균으로 봅니다'); }
  },

  // 3.5 측정 결과의 활용 — 판정에서 개선까지 (tap 단계 5)
  { id:'hyg3_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      var boxes=[], arrows=[];
      // 흐름 상자(좌표=화면비율)
      boxes.push({x:0.30,y:0.20,w:0.40,h:0.095,c:BLU,t:'① 측정 자료 정리 · TWA 산출',s:'시간가중평균 = ΣCᵢTᵢ / ΣTᵢ'});
      if(st>=1){ boxes.push({x:0.30,y:0.335,w:0.40,h:0.095,c:GRN,t:'② 노출기준과 비교',s:'초과 근무 시 보정: 보정기준 = RF × TLV'});
        arrows.push({x1:0.50,y1:0.295,x2:0.50,y2:0.335,c:'rgba(223,238,251,0.5)'}); }
      if(st>=2){ boxes.push({x:0.30,y:0.47,w:0.40,h:0.095,c:AMB,t:'③ 판정',s:'95% 신뢰 하한 > 1 → 초과'});
        arrows.push({x1:0.50,y1:0.43,x2:0.50,y2:0.47,c:'rgba(223,238,251,0.5)'}); }
      if(st>=3){ boxes.push({x:0.06,y:0.615,w:0.42,h:0.125,c:RED,t:'④ 초과 시 조치',s:'시설개선·보호구·재측정 / 30일내 결과+개선계획서 보고'});
        boxes.push({x:0.52,y:0.615,w:0.42,h:0.125,c:GRN,t:'④\' 미만 시',s:'현 상태 유지 · 정기측정 지속'});
        arrows.push({x1:0.44,y1:0.565,x2:0.27,y2:0.615,c:RED,dash:true});
        arrows.push({x1:0.56,y1:0.565,x2:0.73,y2:0.615,c:GRN,dash:true}); }
      if(st>=4){ boxes.push({x:0.22,y:0.80,w:0.56,h:0.10,c:PNK,t:'⑤ 문서화 · 근로자 알림',s:'게시판 부착·사보·집합교육·설명회 / 서류 보존'});
        arrows.push({x1:0.27,y1:0.74,x2:0.45,y2:0.80,c:'rgba(244,160,192,0.6)'});
        arrows.push({x1:0.73,y1:0.74,x2:0.55,y2:0.80,c:'rgba(244,160,192,0.6)'}); }
      // 측정 주기(하단 calc — 법정 상수)
      var calc=[];
      if(st>=2){ calc=[{k:'정기',v:'6개월 1회',c:GRN},{k:'발암성·기준2배 초과',v:'3개월 1회',c:RED},{k:'2회연속 미만+공정무변경',v:'1년 1회',c:BLU}]; }
      window.HygDoc(E,{ boxes:boxes, arrows:arrows, calc:calc,
        note: st>=2? '측정 주기 — 위험할수록 자주, 안정적일수록 드물게' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['측정으로 끝이 아닙니다 — 판정에서 개선까지','기준과 비교 — 근무시간이 길면 기준을 보정합니다','판정 — 오차를 감안한 95% 신뢰 하한으로','초과했다면 — 개선하고 다시 잽니다','결과는 반드시 근로자에게 알립니다'][st];
      var sub=['측정치는 시간가중평균(TWA)으로 요약해 노출기준과 견줍니다 — D키로 흐름을 이어 보세요',
        '하루 8시간을 넘겨 일하면 노출·회복 시간이 달라지므로 보정계수(RF)로 기준을 낮춰 적용합니다',
        '측정에는 오차가 있으므로 표준화값에서 오차를 뺀 하한이 1을 넘을 때만 초과로 판정합니다',
        '초과 사업장은 시설 개선·보호구·재측정을 하고, 결과보고서에 개선계획서를 붙여 30일 이내 보고합니다',
        '측정은 근로자의 알 권리입니다 — 게시·교육·설명회로 알리고 서류를 보존하며, 주기에 맞춰 반복합니다'][st];
      E.big(big, sub); }
  },

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
