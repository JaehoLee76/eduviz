/* 산업위생기술사 제6장 — 물리적 유해인자(열·압력·빛) (동작만. 텍스트=content/hyg6.json) */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';

  function T(ctx,txt,x,y,col,size,align,bold){
    ctx.fillStyle=col; ctx.font=(bold?'700 ':'')+size+'px system-ui,-apple-system,sans-serif';
    ctx.textAlign=align||'left'; ctx.textBaseline='alphabetic'; ctx.fillText(txt,x,y);
  }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  var scenes=[

  /* ── 6.1 WBGT ─────────────────────────────────────────── */
  { id:'hyg6_01',
    enter:function(E){ var self=this; this.s={nwb:28,gt:34,db:32};
      E.controls(
        '<div class="ctrl"><label>자연습구온도 NWB (℃)</label><input type="range" id="nwb" min="15" max="35" step="0.5" value="28"><output id="nwbo">28</output></div>'+
        '<div class="ctrl"><label>흑구온도 GT (℃)</label><input type="range" id="gt" min="20" max="55" step="0.5" value="34"><output id="gto">34</output></div>'+
        '<div class="ctrl"><label>건구온도 DB (℃)</label><input type="range" id="db" min="20" max="45" step="0.5" value="32"><output id="dbo">32</output></div>');
      E.bind('#nwb','input',function(e){ self.s.nwb=+e.target.value; document.getElementById('nwbo').textContent=e.target.value; });
      E.bind('#gt','input',function(e){ self.s.gt=+e.target.value; document.getElementById('gto').textContent=e.target.value; });
      E.bind('#db','input',function(e){ self.s.db=+e.target.value; document.getElementById('dbo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var NWB=s.nwb, GT=s.gt, DB=s.db;
      var cN=0.7*NWB, cG_out=0.2*GT, cD=0.1*DB;          // 옥외 기여
      var out=cN+cG_out+cD;                               // 옥외 WBGT
      var ind=0.7*NWB+0.3*GT;                             // 옥내 WBGT
      // ── 기여 막대(옥외): 세 성분이 최종 WBGT에서 차지하는 몫 ──
      var bx=W*0.09, bw=W*0.82, by=H*0.32, bh=Math.min(26,H*0.07);
      T(ctx,'옥외 WBGT 구성 (0.7·NWB + 0.2·GT + 0.1·DB)',bx,by-12,DIM,13,'left');
      var parts=[[cN,ORA,'습구 70%'],[cG_out,RED,'흑구 20%'],[cD,BLU,'건구 10%']];
      var xx=bx;
      for(var i=0;i<parts.length;i++){ var seg=bw*parts[i][0]/out;
        ctx.fillStyle=parts[i][1]; rr(ctx,xx,by,seg-2,bh,5); ctx.fill();
        if(seg>62){ T(ctx,parts[i][2],xx+seg/2,by+17,'#0d1b2a',12,'center',true); }
        xx+=seg; }
      T(ctx,'자연습구온도가 가중치 0.7을 갖는 이유 — 땀 증발(습도)이 체열 방출의 핵심이기 때문',
        bx,by+bh+Math.min(20,H*0.05),DIM,Math.min(12,H*0.032),'left');
      // ── 옥내/옥외 WBGT 수치 카드 ──
      var cy=by+bh+Math.min(38,H*0.095), cw=(bw-16)/2, ch=Math.min(44,H*0.115);
      ctx.fillStyle='rgba(122,184,255,0.10)'; rr(ctx,bx,cy,cw,ch,8); ctx.fill();
      T(ctx,'옥외(태양)',bx+12,cy+18,DIM,12,'left');
      T(ctx,out.toFixed(1)+' ℃',bx+cw-12,cy+30,ORA,22,'right',true);
      ctx.fillStyle='rgba(143,227,181,0.10)'; rr(ctx,bx+cw+16,cy,cw,ch,8); ctx.fill();
      T(ctx,'옥내(무일사) 0.7·NWB+0.3·GT',bx+cw+28,cy+18,DIM,12,'left');
      T(ctx,ind.toFixed(1)+' ℃',bx+cw*2+4,cy+30,GRN,22,'right',true);
      // ── 노출기준표(℃ WBGT): 실측 WBGT(옥외)와 셀 비교 판정 ──
      var ty=cy+ch+Math.min(22,H*0.055), tx=bx;
      var regimes=['계속작업','75%작업·25%휴식','50%작업·50%휴식','25%작업·75%휴식'];
      var TAB=[[30.0,26.7,25.0],[30.6,28.0,25.9],[31.4,29.4,27.9],[32.2,31.1,30.0]];
      var cols=['경작업','중등작업','중작업'];
      var colW=(bw-W*0.24)/3, rowH=Math.max(15,(H-ty-8)/5), labW=W*0.24;
      var hf=Math.min(13,rowH*0.58), cf=Math.min(14,rowH*0.62), rf=Math.min(12,rowH*0.52);
      T(ctx,'작업강도별 고온 노출기준 (초록=측정 WBGT '+out.toFixed(1)+'℃ 허용 · 빨강=기준 초과)',tx,ty-8,DIM,12,'left');
      // 헤더
      for(var c=0;c<3;c++){ T(ctx,cols[c],tx+labW+colW*c+colW/2,ty+rowH*0.62,TXT,hf,'center',true); }
      for(var r=0;r<4;r++){ var ry=ty+rowH*(r+1);
        T(ctx,regimes[r],tx+labW-8,ry+rowH*0.62,TXT,rf,'right');
        for(var c2=0;c2<3;c2++){ var v=TAB[r][c2]; var ok=out<=v;
          var cxp=tx+labW+colW*c2+4;
          ctx.fillStyle= ok?'rgba(143,227,181,0.18)':'rgba(240,136,138,0.18)';
          rr(ctx,cxp,ry+2,colW-8,rowH-4,6); ctx.fill();
          T(ctx,v.toFixed(1),cxp+(colW-8)/2,ry+rowH*0.64,ok?GRN:RED,cf,'center',true); }
      }
      E.big('WBGT '+out.toFixed(1)+'℃', '옥외 = 0.7×'+NWB.toFixed(1)+' + 0.2×'+GT.toFixed(1)+' + 0.1×'+DB.toFixed(1));
    } },

  /* ── 6.2 고열장해 스펙트럼 ────────────────────────────── */
  { id:'hyg6_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); E.tapHint(0,0,'장해 유형',true); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx,step=s.step;
      // 체온 축(왼쪽 세로): 정상 37 → 열사병 43
      var ax=W*0.16, aTop=H*0.36, aBot=H*0.94, tMin=36, tMax=44;
      function yT(t){ return aBot-(t-tMin)/(tMax-tMin)*(aBot-aTop); }
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax,aTop-6); ctx.lineTo(ax,aBot); ctx.stroke();
      var marks=[[37,'정상 37℃',GRN],[39,'열탈진 ~39℃',AMB],[40,'열사병 40℃↑',RED],[43,'사망역 41~43℃',RED]];
      for(var m=0;m<marks.length;m++){ var yy=yT(marks[m][0]);
        ctx.strokeStyle=marks[m][2]; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ax-7,yy); ctx.lineTo(ax+7,yy); ctx.stroke();
        T(ctx,marks[m][1],ax-12,yy+4,marks[m][2],11,'right'); }
      T(ctx,'심부(직장)온도',ax,aTop-16,DIM,12,'center');
      // 카드 3종 (열경련·열탈진·열사병) — step에 따라 강조
      var data=[
        {t:'열경련(heat cramp)',c:ORA,ax:37,cause:'염분(Cl⁻) 손실 — 물만 보충',sym:'수의근 유통성 경련(사용 근육)',cure:'0.1% 식염수, 중증 시 생리식염수 1~2 L 정맥',key:'혈중 Cl⁻ 현저히 감소'},
        {t:'열탈진·열피로(heat exhaustion)',c:AMB,ax:39,cause:'과다 발한 → 수분·염분 손실, 혈장량↓',sym:'현기증·두통·구토, 맥박↑ 혈압↓',cure:'휴식·5% 포도당 정맥, 그늘 이동',key:'체온 39℃ 정도, 혈중 염소 정상'},
        {t:'열사병(heat stroke)',c:RED,ax:41,cause:'체온조절중추 상실 — 발한 정지',sym:'의식장애·경련·건조 고온 피부',cure:'응급! 얼음물로 39℃까지 급속 냉각',key:'직장온도 40℃↑, 치명률 40%'}
      ];
      var d=data[step===0?0:step-1];
      var cardOn = step>0;
      var bx=W*0.30, bw=W*0.62;
      if(step===0){
        T(ctx,'고열장해(열중증) — 체온 축으로 읽는 응급도',bx,H*0.42,TXT,16,'left',true);
        var lines=['땀(증발)으로 못 버티면 심부온도가 오릅니다.',
                   '체온이 정상권이면 → 염분 문제(열경련) 또는 순환 문제(열탈진),',
                   '체온조절 자체가 무너져 40℃를 넘으면 → 열사병(응급).',
                   'D키(또는 화면 탭)로 세 유형을 차례로 확인하세요.'];
        for(var l=0;l<lines.length;l++) T(ctx,lines[l],bx,H*0.52+l*26,l===3?AMB:TXT,13,'left');
      } else {
        // 해당 체온 위치 강조 점
        var yy2=yT(d.ax); ctx.fillStyle=d.c; ctx.beginPath(); ctx.arc(ax,yy2,7,0,7); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,bx,H*0.38,bw,H*0.54,12); ctx.fill();
        T(ctx,d.t,bx+18,H*0.45,d.c,18,'left',true);
        var rows=[['원인',d.cause],['증상',d.sym],['응급·치료',d.cure],['감별 포인트',d.key]];
        for(var rI=0;rI<rows.length;rI++){ var yy3=H*0.53+rI*H*0.095;
          T(ctx,rows[rI][0],bx+18,yy3,DIM,12,'left');
          T(ctx,rows[rI][1],bx+18,yy3+20,TXT,13.5,'left'); }
        T(ctx,'('+(step)+'/3)',bx+bw-14,H*0.45,DIM,12,'right');
      }
      E.big('고열장해', step===0?'열경련 · 열탈진 · 열사병':d.t);
    } },

  /* ── 6.3 이상기압·감압병 ─────────────────────────────── */
  { id:'hyg6_03',
    enter:function(E){ var self=this; this.s={depth:20,rate:10};
      E.controls(
        '<div class="ctrl"><label>수심 (m)</label><input type="range" id="dep" min="0" max="40" step="1" value="20"><output id="depo">20</output></div>'+
        '<div class="ctrl"><label>상승 속도 (m/분)</label><input type="range" id="rt" min="2" max="30" step="1" value="10"><output id="rto">10</output></div>');
      E.bind('#dep','input',function(e){ self.s.depth=+e.target.value; document.getElementById('depo').textContent=e.target.value; });
      E.bind('#rt','input',function(e){ self.s.rate=+e.target.value; document.getElementById('rto').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var dep=s.depth, rate=s.rate;
      var Pabs=1+dep/10.336;          // 절대압(atm)
      var Pgauge=Pabs-1;              // 작용(게이지)압
      var N2=Pabs;                    // 헨리 법칙: 용해 질소량 ∝ 절대압(1atm 기준 상대배수)
      var safe=rate<=10;              // 안전 기준: 1분 10m 이하
      // 위험지수: 용해 질소 초과분 × 상승속도 초과비
      var risk=(N2-1)*(rate/10);
      // ── 수중 단면 ──
      var wx=W*0.10, ww=W*0.40, wTop=H*0.34, wBot=H*0.95;
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.fillRect(wx,wTop,ww,wBot-wTop);
      T(ctx,'수면 0 m',wx,wTop-6,DIM,11,'left');
      // 수심 눈금
      for(var g=10;g<=40;g+=10){ var gy=wTop+(g/40)*(wBot-wTop);
        if(gy<=wBot){ ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(wx,gy); ctx.lineTo(wx+ww,gy); ctx.stroke();
        T(ctx,g+' m',wx+4,gy-3,DIM,10,'left'); } }
      // 다이버 위치
      var dy=wTop+(dep/40)*(wBot-wTop);
      ctx.fillStyle=safe?GRN:RED; ctx.beginPath(); ctx.arc(wx+ww*0.55,dy,10,0,7); ctx.fill();
      // 상승 기포: 크기 ∝ risk, 색 = 안전여부
      var nb=Math.max(3,Math.round(3+risk*4));
      for(var b=0;b<nb;b++){ var frac=b/nb;
        var by=dy-frac*(dy-wTop)*0.9; var brad=2+risk*3*(0.5+frac);
        ctx.fillStyle= safe?'rgba(143,227,181,0.55)':'rgba(240,136,138,0.6)';
        ctx.beginPath(); ctx.arc(wx+ww*0.55+Math.sin(b*1.7)*8,by,Math.min(brad,14),0,7); ctx.fill(); }
      // ── 우측 수치 패널 ──
      var px=W*0.56, pw=W*0.36;
      var rowsN=[['절대압 P',Pabs.toFixed(2)+' atm',BLU],['작용(게이지)압',Pgauge.toFixed(2)+' atm',TXT],
                 ['용해 질소량(∝P)',N2.toFixed(2)+' 배',ORA],['상승 속도',rate+' m/분',safe?GRN:RED]];
      for(var n=0;n<rowsN.length;n++){ var ny=H*0.40+n*H*0.11;
        ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,px,ny-24,pw,H*0.095,8); ctx.fill();
        T(ctx,rowsN[n][0],px+12,ny-4,DIM,12,'left');
        T(ctx,rowsN[n][1],px+pw-12,ny+2,rowsN[n][2],18,'right',true); }
      var jy=H*0.40+4*H*0.11;
      ctx.fillStyle= safe?'rgba(143,227,181,0.15)':'rgba(240,136,138,0.18)'; rr(ctx,px,jy-24,pw,H*0.10,8); ctx.fill();
      T(ctx, safe?'안전 감압(≤10 m/분)':'급상승 위험 — 감압병(기포)!',px+pw/2,jy+4,safe?GRN:RED,14,'center',true);
      T(ctx,'헨리 법칙: 압력↑ → 용해 질소↑. 급감압 시 과포화 질소가 기포로.',px,jy+H*0.10-6,DIM,11.5,'left');
      E.big('절대압 '+Pabs.toFixed(2)+' atm', '수심 '+dep+' m = 1 + '+dep+'/10.336 · 용해 N₂ '+N2.toFixed(2)+'배');
    } },

  /* ── 6.4 전자기 스펙트럼: 전리/비전리 경계 ────────────── */
  { id:'hyg6_04',
    enter:function(E){ var self=this; this.s={ex:15};
      E.controls(
        '<div class="ctrl"><label>주파수 log₁₀ f (Hz)</label><input type="range" id="ex" min="12" max="21" step="0.05" value="15"><output id="exo">15.0</output></div>');
      E.bind('#ex','input',function(e){ self.s.ex=+e.target.value; document.getElementById('exo').textContent=(+e.target.value).toFixed(2); });
      E.setOn([]); },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx;
      var ex=s.ex, f=Math.pow(10,ex);
      var Eev=4.136e-15*f;             // E = h·f  (h=4.136e-15 eV·s)
      var lam_nm=3e17/f;               // λ = c/f  (nm)
      var ion=Eev>=12;                 // 전리 경계 = 12 eV
      // 스펙트럼 축 (12~21 로그)
      var ax0=W*0.09, ax1=W*0.91, ay=H*0.44, ah=30;
      function xE(e){ return ax0+(e-12)/(21-12)*(ax1-ax0); }
      // 영역 색 그라디언트 표시
      var bands=[[12,15.46,'비전리(RF·IR·가시광선)','rgba(122,184,255,0.20)'],
                 [15.46,21,'전리(자외선C↑·X선·γ선)','rgba(240,136,138,0.20)']];
      for(var i=0;i<bands.length;i++){ var x0=xE(bands[i][0]),x1=xE(bands[i][1]);
        ctx.fillStyle=bands[i][3]; rr(ctx,x0,ay,x1-x0,ah,4); ctx.fill();
        T(ctx,bands[i][2],(x0+x1)/2,ay+ah+18,i===0?BLU:RED,12,'center'); }
      // 경계선 12eV
      var xb=xE(15.46); ctx.strokeStyle=AMB; ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.moveTo(xb,ay-10); ctx.lineTo(xb,ay+ah+10); ctx.stroke(); ctx.setLineDash([]);
      T(ctx,'전리 경계 12 eV (≈100 nm)',xb,ay-14,AMB,11,'center');
      // 눈금 라벨
      var ticks=[[12,'MW/IR'],[14,'가시광선'],[16,'UV'],[18,'X선'],[20,'γ선']];
      for(var t=0;t<ticks.length;t++){ var tx=xE(ticks[t][0]);
        T(ctx,ticks[t][1],tx,ay-2,DIM,10,'center'); }
      // 포인터
      var pxp=xE(ex); ctx.fillStyle=ion?RED:BLU; ctx.beginPath();
      ctx.moveTo(pxp,ay-4); ctx.lineTo(pxp-6,ay-14); ctx.lineTo(pxp+6,ay-14); ctx.closePath(); ctx.fill();
      // 수치 카드
      var eStr = Eev>=1e6? (Eev/1e6).toFixed(2)+' MeV' : Eev>=1e3? (Eev/1e3).toFixed(2)+' keV' : Eev.toFixed(2)+' eV';
      var lStr = lam_nm>=1e6? (lam_nm/1e6).toFixed(2)+' mm' : lam_nm>=1e3? (lam_nm/1e3).toFixed(2)+' µm' : lam_nm.toFixed(1)+' nm';
      var cy=H*0.62, cw=(ax1-ax0-24)/3;
      var cards=[['주파수 f',f.toExponential(2)+' Hz',TXT],['광자에너지 E=hf',eStr,ion?RED:BLU],['파장 λ',lStr,GRN]];
      for(var c=0;c<3;c++){ var cx=ax0+c*(cw+12);
        ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,cx,cy,cw,52,8); ctx.fill();
        T(ctx,cards[c][0],cx+12,cy+20,DIM,12,'left');
        T(ctx,cards[c][1],cx+cw-12,cy+40,cards[c][2],17,'right',true); }
      // 생체영향 설명
      var eff = ion? '전리: 분자·DNA 이온화 → 암·유전영향(X선 비파괴검사·γ선 조사).'
                   : '비전리: 열·광화학 작용 → UV 광각막염·피부암, IR 초자공 백내장, RF 온열.';
      T(ctx,eff,ax0,cy+78,ion?RED:BLU,13,'left');
      E.big(eStr, ion?'전리방사선 — 이온화 능력 있음':'비전리방사선 — 이온화 못함');
    } },

  /* ── 6.5 한랭·조명·공통 관리 ─────────────────────────── */
  { id:'hyg6_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); E.tapHint(0,0,'주제 전환',true); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s,W=E.W,H=E.H,ctx=E.ctx,step=s.step;
      var bx=W*0.09, bw=W*0.82;
      T(ctx,['① 한랭 — 저체온·동상','② 조명 — 조도 기준','③ 물리적 인자 공통 관리 틀'][step],bx,H*0.36,AMB,17,'left',true);

      if(step===0){
        // 풍속냉각(등가냉각온도) 실계산 — 예: 기온 -10℃, 풍속 30 km/h
        var Ta=-10, V=30;
        var Vp=Math.pow(V,0.16);
        var Twc=13.12+0.6215*Ta-11.37*Vp+0.3965*Ta*Vp;   // 체감(등가냉각)온도 근사식
        ctx.fillStyle='rgba(122,184,255,0.10)'; rr(ctx,bx,H*0.40,bw*0.48,H*0.30,10); ctx.fill();
        T(ctx,'풍속냉각(체감온도)',bx+16,H*0.44,DIM,12,'left');
        T(ctx,'기온 '+Ta+'℃ · 풍속 '+V+' km/h',bx+16,H*0.485,TXT,13,'left');
        T(ctx,'→ 체감 '+Twc.toFixed(1)+' ℃',bx+16,H*0.54,BLU,22,'left',true);
        T(ctx,'바람이 열을 앗아 실제 기온보다 훨씬 춥게 느낍니다.',bx+16,H*0.58,DIM,11.5,'left');
        T(ctx,'저체온증(심부<35℃)·동상·참호족 위험.',bx+16,H*0.62,TXT,12.5,'left');
        T(ctx,'1 Clo = 5.55 kcal/m²·hr 보온효과',bx+16,H*0.66,GRN,12,'left');
        // 한랭 노출기준표(4시간 교대, 연속작업 한도 분)
        var tx=bx+bw*0.52, tw=bw*0.48;
        T(ctx,'한랭 노출기준 (연속작업 한도, 분)',tx,H*0.44,DIM,12,'left');
        var CT=[['등가냉각 -10~-25℃','경 50 / 중등 60'],['-26~-40℃','경 30 / 중등 45'],['-41~-55℃','경 20 / 중등 30']];
        for(var r=0;r<3;r++){ var ry=H*0.47+r*H*0.075;
          ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,tx,ry,tw,H*0.065,7); ctx.fill();
          T(ctx,CT[r][0],tx+12,ry+H*0.03,TXT,12,'left');
          T(ctx,CT[r][1],tx+tw-12,ry+H*0.03,AMB,13,'right',true); }
        T(ctx,'예방: 방한복(Clo↑)·순환근무·4℃↓ 보호복·따뜻한 휴게실·젖은 옷 즉시 교체.',bx,H*0.72,DIM,12,'left');
      }
      else if(step===1){
        // 조도 거리 반비례 실계산: E = I / r²
        var I=2000, rr1=2, r2=4;
        var E1=I/(rr1*rr1), E2=I/(r2*r2);
        ctx.fillStyle='rgba(242,189,85,0.10)'; rr(ctx,bx,H*0.40,bw*0.48,H*0.34,10); ctx.fill();
        T(ctx,'거리의 제곱에 반비례  E = I / r²',bx+16,H*0.44,DIM,12,'left');
        T(ctx,'광도 I = '+I+' cd',bx+16,H*0.485,TXT,13,'left');
        T(ctx,'r = '+rr1+' m → '+E1.toFixed(0)+' lux',bx+16,H*0.525,GRN,15,'left',true);
        T(ctx,'r = '+r2+' m → '+E2.toFixed(0)+' lux',bx+16,H*0.565,ORA,15,'left',true);
        T(ctx,'거리 2배 → 조도 1/4. 국소조명이 거리에 민감한 이유.',bx+16,H*0.61,DIM,11.5,'left');
        T(ctx,'전체조명은 국부조명의 1/10~1/5. 측정: 바닥 85 cm.',bx+16,H*0.66,TXT,12,'left');
        // 조도 기준표
        var tx=bx+bw*0.52, tw=bw*0.48;
        T(ctx,'작업별 조도 기준',tx,H*0.44,DIM,12,'left');
        var LX=[['초정밀작업','750 lux 이상',RED],['정밀작업','300 lux 이상',ORA],['보통작업','150 lux 이상',AMB],['단순·일반작업','75 lux 이상',GRN]];
        for(var l=0;l<4;l++){ var ly=H*0.47+l*H*0.065;
          ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,tx,ly,tw,H*0.056,7); ctx.fill();
          T(ctx,LX[l][0],tx+12,ly+H*0.026,TXT,12.5,'left');
          T(ctx,LX[l][1],tx+tw-12,ly+H*0.026,LX[l][2],13,'right',true); }
        T(ctx,'조명 부족 → 안정피로·근시·안구진탕 / 과잉 → 눈부심·시야협착.',bx,H*0.76,DIM,12,'left');
      }
      else {
        // 공통 관리 틀 4열 + 방사선 3원칙
        var cols=[['시간','노출시간 단축·교대·휴식비율',BLU],['거리','발생원에서 멀리(E∝1/r²)',GRN],
                  ['차폐','차열판·차광보호구·연벽 차폐',AMB],['보호구','방열복·방한복·차광안경·귀마개',ORA]];
        var cw=(bw-24)/4;
        for(var c=0;c<4;c++){ var cx=bx+c*(cw+8);
          ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,cx,H*0.41,cw,H*0.22,10); ctx.fill();
          T(ctx,cols[c][0],cx+cw/2,H*0.47,cols[c][2],16,'center',true);
          // 줄바꿈 간단 처리
          var words=cols[c][1].split('·'); for(var w2=0;w2<words.length;w2++)
            T(ctx,words[w2],cx+cw/2,H*0.51+w2*18,TXT,11,'center'); }
        ctx.fillStyle='rgba(240,136,138,0.12)'; rr(ctx,bx,H*0.67,bw,H*0.20,10); ctx.fill();
        T(ctx,'방사선 방호 3원칙 = 시간(짧게) · 거리(멀리) · 차폐(막기)',bx+16,H*0.72,RED,14,'left',true);
        T(ctx,'열·압력·빛·방사선 — 물리적 인자는 모두 이 공통 문법으로 관리합니다.',bx+16,H*0.77,TXT,12.5,'left');
        T(ctx,'공학적 대책(밀폐·차폐·환기)을 우선, 보호구는 최후 수단.',bx+16,H*0.815,DIM,12,'left');
      }
      E.big('물리적 인자 관리', ['한랭','조명','공통 관리 틀'][step]);
    } }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
