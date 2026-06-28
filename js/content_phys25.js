/* 물리학 「온도와 열」 — 열의 거시적 성질. 열평형·열팽창·비열·잠열(상변화)·열전달.
   기체와 열역학(뒤 장)의 미시적 분자 그림에 앞서, 일상에서 만나는 열을 다룬다.
   골든룰: 열평형 T_eq, 열팽창 ΔL=αLΔT, 비열 ΔT=Q/mc, 상변화 잠열, 열전달률 모두 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys25.json. 열전달은 phys10에서 옮김. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', HOT='#ff6b4a', COLD='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  function tcol(T){ var t=Math.max(0,Math.min(1,T/100)); return 'rgb('+Math.round(100+t*155)+','+Math.round(120-t*50)+','+Math.round(255-t*200)+')'; }

  var scenes=[

  // ══════════ 1. 온도와 열평형 (열역학 제0법칙) ══════════
  { id:'phys25_01',
    enter:function(E){ var self=this; this.s={TA0:90,TB0:10,t:0}; this.reset();
      E.controls('<div class="ctrl"><label>A 초기온도 (°C)</label><input type="range" id="ta" min="50" max="100" step="5" value="90"><output id="tao">90</output>'
        +'<label style="margin-left:14px">B 초기온도 (°C)</label><input type="range" id="tb" min="0" max="50" step="5" value="10"><output id="tbo">10</output></div>');
      E.bind('#ta','input',function(e){ self.s.TA0=+e.target.value; document.getElementById('tao').textContent=e.target.value; self.reset(); E.blip(360,0.06); });
      E.bind('#tb','input',function(e){ self.s.TB0=+e.target.value; document.getElementById('tbo').textContent=e.target.value; self.reset(); E.blip(320,0.06); });
      E.setOn([]); },
    reset:function(){ this.s.t=0; this.s.TA=this.s.TA0; this.s.TB=this.s.TB0; },
    tap:function(E){ this.reset(); E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var Teq=(s.TA0+s.TB0)/2;   // 같은 질량·비열 → 평형온도 = 평균 (골든룰)
      if(!E.frozen){ s.t+=1/60; var k=Math.exp(-s.t*0.5); s.TA=Teq+(s.TA0-Teq)*k; s.TB=Teq+(s.TB0-Teq)*k; }
      var cy=H*0.42, bw=W*0.16, bh=H*0.26;
      // 블록 A(왼)·B(오), 접촉
      var ax=W*0.30, bx=ax+bw;
      ctx.fillStyle=tcol(s.TA); ctx.fillRect(ax-bw,cy-bh/2,bw,bh); ctx.fillStyle=tcol(s.TB); ctx.fillRect(ax,cy-bh/2,bw,bh);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(ax-bw,cy-bh/2,bw*2,bh);
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(ax,cy-bh/2); ctx.lineTo(ax,cy+bh/2); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('A '+s.TA.toFixed(0)+'°C', ax-bw/2, cy); ctx.fillText('B '+s.TB.toFixed(0)+'°C', ax+bw/2, cy);
      // 열 흐름 화살표(고온→저온)
      if(Math.abs(s.TA-s.TB)>1){ var dir=s.TA>s.TB?1:-1; arrow(E,ax-dir*14,cy-bh/2-14,ax+dir*14,cy-bh/2-14,HOT,2.5); ctx.fillStyle=HOT; ctx.font='12px sans-serif'; ctx.fillText('열 흐름 (고온→저온)', ax, cy-bh/2-24); }
      else { ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('열평형 도달! (같은 온도)', ax, cy-bh/2-24); }
      // 온도 그래프
      var gx0=W*0.58, gx1=W*0.94, gy0=H*0.66, gh=H*0.4;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.strokeStyle='rgba(143,227,181,0.4)'; ctx.setLineDash([4,3]); var yeq=gy0-Teq/100*gh; ctx.beginPath(); ctx.moveTo(gx0,yeq); ctx.lineTo(gx1,yeq); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('평형 '+Teq.toFixed(0)+'°', gx1-46, yeq-4);
      [['A',HOT,s.TA0],['B',COLD,s.TB0]].forEach(function(L){ ctx.strokeStyle=L[1]; ctx.lineWidth=2; ctx.beginPath(); for(var tt=0;tt<=4;tt+=0.05){ var T=Teq+(L[2]-Teq)*Math.exp(-tt*0.5), x=gx0+(tt/4)*(gx1-gx0), y=gy0-T/100*gh; if(tt===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke(); });
      var mxp=gx0+Math.min(1,s.t/4)*(gx1-gx0); ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(mxp,gy0); ctx.lineTo(mxp,gy0-gh); ctx.stroke();
      E.tapHint(W/2, H*0.92, '접촉한 두 물체는 열을 주고받아 같은 온도가 됩니다 (화면 탭=다시)', true);
      E.big('열평형 — 접촉하면 같은 온도로 (열은 고온→저온)', '온도가 다르면 열이 흘러 평형에 이릅니다.'); }
  },

  // ══════════ 2. 열팽창 — 데우면 늘어난다 (ΔL = αLΔT) ══════════
  { id:'phys25_02',
    enter:function(E){ var self=this; this.s={dT:50};
      E.controls('<div class="ctrl"><label>온도 변화 ΔT (°C)</label><input type="range" id="dt" min="0" max="100" step="5" value="50"><output id="dto">50</output></div>');
      E.bind('#dt','input',function(e){ self.s.dT=+e.target.value; document.getElementById('dto').textContent=e.target.value; E.blip(300+self.s.dT*3,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 두 금속(α 다름) → 바이메탈처럼 휘어짐. ΔL=αLΔT (골든룰, 시각 과장)
      var a1=2.4e-2, a2=1.2e-2;   // 상대 팽창계수(시각용)
      var L=W*0.42, dL1=a1*L*s.dT/100*4, dL2=a2*L*s.dT/100*4;   // 늘어난 길이
      var bx=W*0.16, cy=H*0.40, th=14;
      // 위 금속(많이 팽창) + 아래 금속(적게)
      ctx.fillStyle=tcol(s.dT); ctx.fillRect(bx,cy-th,L+dL1,th);
      ctx.fillStyle='rgba(150,180,220,0.7)'; ctx.fillRect(bx,cy,L+dL2,th);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.strokeRect(bx,cy-th,L+dL1,th); ctx.strokeRect(bx,cy,L+dL2,th);
      // 원래 길이 기준선
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(bx+L,cy-th-10); ctx.lineTo(bx+L,cy+th+10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('원래 길이', bx+L, cy+th+24);
      // 늘어난 끝
      ctx.fillStyle=HOT; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('팽창 큰 금속(α 큼)', bx, cy-th-12); ctx.fillStyle=BLU; ctx.fillText('팽창 작은 금속(α 작음)', bx, cy+th+24+18);
      arrow(E,bx+L,cy-th-4,bx+L+dL1,cy-th-4,HOT,2);
      // 바이메탈 휨(아래쪽 그림)
      var bcx=W*0.40, bcy=H*0.74, bend=s.dT/100*1.0;
      ctx.strokeStyle=tcol(s.dT); ctx.lineWidth=4; ctx.beginPath(); for(var t=0;t<=1;t+=0.05){ var x=bcx-W*0.14+t*W*0.28, y=bcy - bend*60*t*t; if(t===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('바이메탈: 두 금속이 다르게 팽창 → 휘어짐 (온도조절기)', bcx, bcy+30);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.fillText('ΔL = α·L·ΔT  (ΔT='+s.dT+'°C → 늘어남 '+(dL1).toFixed(0)+'px)', W/2, H*0.55);
      E.tapHint(W/2, H*0.92, '데우면 늘어나고, 금속마다 팽창 정도(α)가 다릅니다', true);
      E.big('열팽창 ΔL = α·L·ΔT — 데우면 늘어난다', '대부분의 물질은 데우면 부풀어요.'); }
  },

  // ══════════ 3. 비열 — 데우기 어려운 정도 (Q = mcΔT) ══════════
  { id:'phys25_03',
    enter:function(E){ var self=this; this.s={Q:5};
      E.controls('<div class="ctrl"><label>가한 열 Q</label><input type="range" id="qq" min="0" max="10" step="0.5" value="5"><output id="qqo">5.0</output></div>');
      E.bind('#qq','input',function(e){ self.s.Q=+e.target.value; document.getElementById('qqo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 같은 열 Q, 같은 질량 → ΔT=Q/(mc). 물 c=4.2(큼, 천천히), 철 c=0.45(작음, 빨리) (골든룰)
      var mats=[['물',4.2,BLU],['철',0.45,'#c98a5a']];
      mats.forEach(function(M,i){ var dT=s.Q/(1*M[1])*10, T=20+Math.min(80,dT);   // 시작 20°C
        var x=W*(0.26+i*0.34), beakerY=H*0.66, bw=W*0.12, bhh=H*0.34;
        // 비커
        ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.strokeRect(x-bw/2,beakerY-bhh,bw,bhh);
        // 채워진 물질(색=온도)
        ctx.fillStyle=tcol(T); ctx.fillRect(x-bw/2+2,beakerY-bhh+2,bw-4,bhh-4);
        // 온도계
        ctx.fillStyle='#fff'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(T.toFixed(0)+'°C', x, beakerY+20);
        ctx.fillStyle=M[2]; ctx.font='13px sans-serif'; ctx.fillText(M[0]+' (c='+M[1]+')', x, beakerY-bhh-10);
        // 불꽃(Q)
        ctx.fillStyle=HOT; ctx.font='16px sans-serif'; for(var f=0;f<Math.round(s.Q/2);f++){ ctx.fillText('🔥', x-bw/2+8+f*14, beakerY+16); }
      });
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('같은 열 Q를 줘도 — 물(비열 큼)은 천천히, 철(비열 작음)은 빨리 데워짐', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('Q = m·c·ΔT  →  ΔT = Q/(mc)  (물의 큰 비열이 바다·인체 온도를 안정시킴)', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '같은 열에도 비열이 작은 철이 더 빨리 뜨거워집니다', true);
      E.big('비열 — Q = m·c·ΔT (데우기 어려운 정도)', '물질마다 데우는 데 드는 열이 달라요.'); }
  },

  // ══════════ 4. 잠열·상변화 — 끓는 동안 온도가 안 오른다 ══════════
  { id:'phys25_04',
    enter:function(E){ var self=this; this.s={Q:3};
      E.controls('<div class="ctrl"><label>가한 열 Q (누적)</label><input type="range" id="qq" min="0" max="10" step="0.1" value="3"><output id="qqo">3.0</output></div>');
      E.bind('#qq','input',function(e){ self.s.Q=+e.target.value; document.getElementById('qqo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.Q*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 가열곡선: 얼음 데우기 → 0°C 녹는 평탄(잠열) → 물 데우기 → 100°C 끓는 평탄(잠열) → 수증기
      // 구간 경계(누적열): 0~1.5 얼음승온, 1.5~3.5 융해평탄, 3.5~6 물승온, 6~9 기화평탄, 9~10 수증기
      function temp(Q){ if(Q<1.5) return -20+Q/1.5*20; if(Q<3.5) return 0; if(Q<6) return (Q-3.5)/2.5*100; if(Q<9) return 100; return 100+(Q-9)/1*30; }
      var T=temp(s.Q), phase = s.Q<1.5?'얼음':s.Q<3.5?'녹는 중(얼음+물)':s.Q<6?'물':s.Q<9?'끓는 중(물+수증기)':'수증기';
      var gx0=W*0.12, gx1=W*0.90, gy0=H*0.74, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('온도(°C)', gx0+3,gy0-gh+2); ctx.textAlign='right'; ctx.fillText('가한 열 Q →', gx1, gy0+16);
      // 0°C·100°C 기준선
      function Ty(t){ return gy0-(t+20)/150*gh; }
      ['0','100'].forEach(function(v){ var y=Ty(+v); ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(gx0,y); ctx.lineTo(gx1,y); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='right'; ctx.fillText(v+'°', gx0-2, y+3); });
      // 가열곡선
      ctx.strokeStyle=ORA; ctx.lineWidth=2.6; ctx.beginPath();
      for(var Q=0;Q<=10;Q+=0.05){ var x=gx0+(Q/10)*(gx1-gx0), y=Ty(temp(Q)); if(Q===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 평탄 구간(잠열) 강조
      ctx.strokeStyle='rgba(122,184,255,0.6)'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(gx0+1.5/10*(gx1-gx0),Ty(0)); ctx.lineTo(gx0+3.5/10*(gx1-gx0),Ty(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx0+6/10*(gx1-gx0),Ty(100)); ctx.lineTo(gx0+9/10*(gx1-gx0),Ty(100)); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('융해 잠열', gx0+2.5/10*(gx1-gx0), Ty(0)+16); ctx.fillText('기화 잠열', gx0+7.5/10*(gx1-gx0), Ty(100)-8);
      // 현재 점
      var mx=gx0+(s.Q/10)*(gx1-gx0), my=Ty(T); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('현재: '+T.toFixed(0)+'°C — '+phase, W/2, H*0.84);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('상변화 중에는 열을 줘도 온도가 안 오름 — 그 열(잠열)이 분자 결합을 끊는 데 쓰임', W/2, H*0.90);
      E.tapHint(W/2, H*0.94, '0°C·100°C 평탄구간: 열을 줘도 온도가 멈춤(녹고·끓는 데 쓰임)', true);
      E.big('잠열·상변화 — 끓는 동안 온도가 멈춘다', '얼음이 녹고 물이 끓을 땐 온도가 안 올라요.'); }
  },

  // ══════════ 5. 열전달 — 전도·대류·복사 ══════════
  { id:'phys25_05',
    enter:function(E){ var self=this; this.s={dT:60,t:0};
      E.controls('<div class="ctrl"><label>온도차 ΔT</label><input type="range" id="dt" min="10" max="100" step="10" value="60"><output id="dto">60</output></div>');
      E.bind('#dt','input',function(e){ self.s.dT=+e.target.value; document.getElementById('dto').textContent=e.target.value; E.blip(360,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var cols=W/3;
      var x0=W*0.06; ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('전도(고체)', x0+cols*0.4, H*0.18);
      var grd=ctx.createLinearGradient(x0,0,x0+cols*0.8,0); grd.addColorStop(0,'#ff6b4a'); grd.addColorStop(1,'#6ba8ff');
      ctx.fillStyle=grd; ctx.fillRect(x0,H*0.4,cols*0.8,30);
      ctx.font='11px sans-serif'; ctx.fillStyle='#ff6b4a'; ctx.textAlign='left'; ctx.fillText('고온', x0, H*0.4-6); ctx.fillStyle='#6ba8ff'; ctx.textAlign='right'; ctx.fillText('저온', x0+cols*0.8, H*0.4-6);
      for(var k=0;k<6;k++){ var px=x0+10+k*(cols*0.8-20)/5, jit=Math.sin(s.t*8+k)*3*(s.dT/60); ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(px+jit,H*0.4+15,3,0,7); ctx.fill(); }
      var x1=W*0.40; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText('대류(유체)', x1+cols*0.4, H*0.18);
      ctx.strokeStyle='rgba(255,107,74,0.3)'; ctx.lineWidth=2; ctx.strokeRect(x1,H*0.32,cols*0.8,H*0.34);
      for(var c=0;c<4;c++){ var cy=H*0.62-((s.t*0.5*(s.dT/60)+c*0.25)%1)*H*0.28, cx=x1+cols*0.2+c*cols*0.15; ctx.fillStyle='rgba(255,140,90,0.7)'; ctx.beginPath(); ctx.arc(cx,cy,4,0,7); ctx.fill(); }
      ctx.fillStyle='#ff6b4a'; ctx.fillRect(x1,H*0.64,cols*0.8,4);
      var x2=W*0.74; ctx.fillStyle=DIM; ctx.fillText('복사(빛)', x2+cols*0.3, H*0.18);
      ctx.fillStyle='#ff6b4a'; ctx.beginPath(); ctx.arc(x2+10,H*0.5,14,0,7); ctx.fill();
      for(var w=0;w<3;w++){ var rr=((s.t*1.5*(s.dT/60)+w*0.6)%2.2); ctx.strokeStyle='rgba(255,178,122,'+(0.6-rr*0.2)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x2+10,H*0.5,18+rr*30,-0.9,0.9); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('열은 고온→저온으로: 전도(접촉)·대류(유체 이동)·복사(전자기파)', W/2, H*0.80);
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.fillText('온도차 ΔT='+s.dT+' 클수록 전달이 빠름 (보온병은 셋 다 차단)', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '온도차를 키우면 세 방식 모두 열전달이 빨라집니다', true);
      E.big('열전달 — 전도·대류·복사 (모두 ΔT에 비례)', '열이 흐르는 세 가지 길.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
