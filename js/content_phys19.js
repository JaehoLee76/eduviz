/* 물리학 「양자물리」 — 빛은 입자이기도, 입자는 파동이기도.
   파동광학(빛=파동)을 뒤집는다: 광전효과·흑체복사·물질파·불확정성·보어 원자.
   골든룰: 모든 에너지·파장·세기·불확정성 곱은 E=hf·플랑크식·λ=h/p·ΔxΔp≥ℏ/2·E_n=−13.6/n²에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys19.json. 광전효과·보어는 phys14에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 광전효과 — 빛은 알갱이(광자) E = hf ══════════
  { id:'phys19_01',
    enter:function(E){ var self=this; this.s={f:6,t:0,W:3};
      E.controls('<div class="ctrl"><label>빛 진동수 f (광자 에너지 ∝ f)</label><input type="range" id="ff" min="1" max="10" step="1" value="6"><output id="ffo">6</output></div>');
      E.bind('#ff','input',function(e){ self.s.f=+e.target.value; document.getElementById('ffo').textContent=e.target.value; E.blip(200+self.s.f*70,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var Eph=s.f, KE=Eph-s.W, emit=KE>0, plateX=W*0.46, cy=H*0.44;
      ctx.fillStyle='rgba(180,180,200,0.25)'; ctx.fillRect(plateX,H*0.18,30,H*0.5);
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(plateX,H*0.18,30,H*0.5);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('금속', plateX+15, H*0.74);
      var ph=(s.t*2)%1; for(var i=0;i<4;i++){ var px=W*0.08+((ph+i*0.25)%1)*(plateX-W*0.08), py=cy-40+i*26;
        var col=s.f<4?'#e2503a':s.f<7?'#5cd0ff':'#9b6bff'; ctx.strokeStyle=col; ctx.lineWidth=2;
        ctx.beginPath(); for(var w=0;w<20;w++){ var wx=px+w, wy=py+Math.sin(w*0.8+s.t*10)*4; if(w===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('광자 (E=hf='+Eph+')', W*0.07, cy-58);
      if(emit){ var ep=(s.t*1.5)%1; for(var k=0;k<3;k++){ var ex=plateX+30+((ep+k*0.33)%1)*(W*0.4), ey=cy-20+k*20-((ep+k*0.33))*30;
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ex,ey,5,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.font='bold 9px sans-serif'; ctx.fillText('e', ex, ey+3); }
        ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('전자 방출! KE = hf − W = '+KE.toFixed(1), W*0.6, H*0.24);
      } else { ctx.fillStyle='#ff7a7a'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('✗ 전자 방출 없음 (hf < W)', W*0.66, H*0.30); }
      var bx=W*0.10, baseY=H*0.92; ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('광자에너지 hf='+Eph+' vs 일함수 W='+s.W+(emit?' → KE='+KE.toFixed(1):' → 부족'), bx, baseY);
      E.tapHint(W/2, H*0.84, '진동수가 문턱을 넘어야 전자 방출 (밝기는 무관)', true);
      E.big('광전효과 — 빛은 알갱이(광자), E = hf', '빛이 알갱이로 전자를 때립니다.'); }
  },

  // ══════════ 2. 흑체복사 — 양자의 탄생 (자외선 파탄) ══════════
  { id:'phys19_02',
    enter:function(E){ var self=this; this.s={T:4};
      E.controls('<div class="ctrl"><label>온도 T (상대)</label><input type="range" id="tt" min="2" max="8" step="0.5" value="4"><output id="tto">4.0</output></div>');
      E.bind('#tt','input',function(e){ self.s.T=+e.target.value; document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.T*80,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var gx0=W*0.14, gx1=W*0.90, gy0=H*0.78, gh=H*0.56, T=s.T;
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('세기', gx0+4,gy0-gh+4); ctx.textAlign='right'; ctx.fillText('파장 λ →', gx1, gy0+16);
      // 플랑크 곡선: I ∝ 1/λ^5 / (exp(c2/(λT))−1).  자외선(작은 λ)서 0으로 떨어짐(파탄 없음)
      function planck(lam){ var x=2.4/(lam*T); return (1/Math.pow(lam,5))/(Math.exp(x)-1); }
      // 정규화 위해 최대값
      var mx=0, peakLam=0; for(var l=0.15;l<=2;l+=0.01){ var v=planck(l); if(v>mx){mx=v; peakLam=l;} }
      // 고전(레일리-진스): I ∝ T/λ^4 → 작은 λ서 발산(자외선 파탄)
      ctx.strokeStyle='rgba(255,90,90,0.7)'; ctx.lineWidth=1.8; ctx.setLineDash([5,4]); ctx.beginPath();
      for(var l2=0.15;l2<=2;l2+=0.01){ var vc=(T/Math.pow(l2,4))*0.02, x=gx0+(l2/2)*(gx1-gx0), y=gy0-Math.min(gh,vc/mx*gh); if(l2===0.15)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,90,90,0.8)'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('고전 예측 → ∞ (자외선 파탄!)', gx0+W*0.04, gy0-gh+20);
      // 플랑크 곡선(실측 일치)
      ctx.strokeStyle=ORA; ctx.lineWidth=2.6; ctx.beginPath();
      for(var l3=0.15;l3<=2;l3+=0.01){ var v3=planck(l3), x=gx0+(l3/2)*(gx1-gx0), y=gy0-Math.min(gh,v3/mx*gh); if(l3===0.15)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      ctx.fillStyle=ORA; ctx.fillText('플랑크: E=hf 양자화 → 관측과 일치', gx0+W*0.04, gy0-gh+38);
      // 피크(빈 변위)
      var pkx=gx0+(peakLam/2)*(gx1-gx0); ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(pkx,gy0); ctx.lineTo(pkx,gy0-gh*0.95); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#dfeefb'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('피크 λmax ∝ 1/T = '+peakLam.toFixed(2)+' (뜨거울수록 파랑 쪽)', W/2, H*0.88);
      E.tapHint(W/2, H*0.93, '온도를 올리면 피크가 짧은 파장(파랑) 쪽으로 이동합니다(빈 변위)', true);
      E.big('흑체복사 — 플랑크의 양자 가설 E = hf', '에너지가 알갱이로 끊어져 있었습니다.'); }
  },

  // ══════════ 3. 물질파 — 입자도 파동이다 (드브로이 λ=h/p) ══════════
  { id:'phys19_03',
    enter:function(E){ var self=this; this.s={p:4,t:0};
      E.controls('<div class="ctrl"><label>운동량 p (속도)</label><input type="range" id="pp" min="1" max="10" step="0.5" value="4"><output id="ppo">4.0</output></div>');
      E.bind('#pp','input',function(e){ self.s.p=+e.target.value; document.getElementById('ppo').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.p*80,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var lam=14/s.p*16;   // λ = h/p (h를 상대단위로) — 운동량 클수록 파장 짧음 (골든룰)
      var cy=H*0.42, x0=W*0.12, x1=W*0.90;
      // 움직이는 전자(입자) + 따라다니는 물질파
      var ex=x0+((s.t*0.18*s.p)%1)*(x1-x0);
      // 파동
      ctx.strokeStyle='rgba(122,184,255,0.7)'; ctx.lineWidth=2; ctx.beginPath();
      for(var x=x0;x<=x1;x+=3){ var ph=(x-ex)/lam*2*Math.PI - s.t*4, env=Math.exp(-Math.pow((x-ex)/(W*0.12),2)); var y=cy-Math.sin(ph)*40*env; if(x===x0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 입자
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(ex,cy,7,0,7); ctx.fill(); ctx.fillStyle='#10141a'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillText('e',ex,cy+3);
      // 파장 표시
      ctx.strokeStyle='rgba(255,178,122,0.6)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(ex,cy+50); ctx.lineTo(ex+lam,cy+50); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('λ = h/p', ex+lam/2, cy+66);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('드브로이 파장 λ = h/p  (운동량 p='+s.p.toFixed(1)+' → λ '+(s.p>5?'짧음':'김')+')', W/2, H*0.70);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('전자도 이중슬릿서 간섭무늬를 만든다 — 입자가 곧 파동', W/2, H*0.78);
      ctx.fillText('야구공은? p가 거대 → λ가 원자보다 작아 파동성 안 보임', W/2, H*0.85);
      E.tapHint(W/2, H*0.93, '운동량을 키우면 물질파 파장이 짧아집니다 (λ=h/p)', true);
      E.big('물질파 — 입자도 파동이다 (λ = h/p)', '전자도 물결처럼 퍼집니다.'); }
  },

  // ══════════ 4. 불확정성 원리 — Δx·Δp ≥ ℏ/2 ══════════
  { id:'phys19_04',
    enter:function(E){ var self=this; this.s={dx:1.4};
      E.controls('<div class="ctrl"><label>위치 정밀도 Δx</label><input type="range" id="xx" min="0.5" max="3" step="0.1" value="1.4"><output id="xxo">1.4</output></div>');
      E.bind('#xx','input',function(e){ self.s.dx=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value).toFixed(1); E.blip(300,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var dx=s.dx, dp=0.5/dx;   // ΔxΔp ≥ ℏ/2 (ℏ=1 상대단위) → Δp = (ℏ/2)/Δx (골든룰: 곱 일정)
      // 위치 분포(왼쪽 종형) — 좁을수록 뾰족
      var lx=W*0.27, cy=H*0.42, sc=W*0.16;
      function bell(cx,sig,scale,col,label){ ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath();
        for(var t=-3;t<=3;t+=0.06){ var x=cx+t*scale, y=cy+60-Math.exp(-t*t/(2*sig*sig))*110; if(t===-3)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
        ctx.fillStyle=col; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, cx, cy+80); }
      bell(lx, dx*0.5, sc/3, BLU, '위치 분포 Δx='+dx.toFixed(1));
      bell(W*0.72, dp*0.5*2, sc/3, ORA, '운동량 분포 Δp='+dp.toFixed(2));
      // 화살표(반비례)
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('위치를 좁히면 → 운동량이 퍼진다 (반대도)', W/2, H*0.20);
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText('Δx · Δp = '+(dx*dp).toFixed(2)+' ≥ ℏ/2  (항상 일정 이상)', W/2, H*0.82);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('둘 다 동시에 정확히 알 수 없다 — 자연의 근본 한계(하이젠베르크)', W/2, H*0.89);
      E.tapHint(W/2, H*0.94, '위치를 좁히면 운동량 분포가 넓어집니다 (곱은 일정)', true);
      E.big('불확정성 원리 — Δx·Δp ≥ ℏ/2', '위치와 운동량을 동시에 못 박습니다.'); }
  },

  // ══════════ 5. 보어 원자 — 양자화된 에너지 준위 ══════════
  { id:'phys19_05',
    enter:function(E){ var self=this; this.s={ni:3,nf:2,t:0,phase:0};
      E.controls('<div class="ctrl"><label>전이: 높은 준위 n</label><input type="range" id="ni" min="2" max="5" step="1" value="3"><output id="nio">3</output>'
        +'<label style="margin-left:14px">낮은 준위 n</label><input type="range" id="nf" min="1" max="3" step="1" value="2"><output id="nfo">2</output></div>');
      E.bind('#ni','input',function(e){ self.s.ni=+e.target.value; document.getElementById('nio').textContent=e.target.value; self.s.phase=0; E.blip(360,0.07); });
      E.bind('#nf','input',function(e){ self.s.nf=+e.target.value; document.getElementById('nfo').textContent=e.target.value; self.s.phase=0; E.blip(340,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ s.t+=1/60; s.phase=(s.phase+1/60*0.4)%1; }
      var ni=Math.max(s.ni,s.nf+1), nf=Math.min(s.nf,ni-1);
      var cx=W*0.32, cy=H*0.46, sc=Math.min(W*0.04,H*0.06);
      ctx.fillStyle=NRED; ctx.beginPath(); ctx.arc(cx,cy,8,0,7); ctx.fill();
      for(var n=1;n<=5;n++){ ctx.strokeStyle=(n===ni||n===nf)?'rgba(255,178,122,0.7)':'rgba(255,255,255,0.15)'; ctx.lineWidth=(n===ni||n===nf)?2:1; ctx.beginPath(); ctx.arc(cx,cy,n*n*sc*0.6,0,7); ctx.stroke(); }
      var rn=(ni-(ni-nf)*s.phase), rr=rn*rn*sc*0.6, a=s.t*2;
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(cx+rr*Math.cos(a),cy+rr*Math.sin(a),5,0,7); ctx.fill();
      var E_i=-13.6/(ni*ni), E_f=-13.6/(nf*nf), dE=Math.abs(E_i-E_f);
      var col=dE>3?'#9b6bff':dE>2.5?'#5c8cff':dE>1.9?'#5cd0ff':'#e2503a';
      if(s.phase>0.5){ for(var k=0;k<4;k++){ var px=cx+60+((s.phase-0.5)*2*W*0.3+k*12), py=cy-60; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); for(var w2=0;w2<14;w2++){ var wx=px+w2, wy=py+Math.sin(w2*0.9+s.t*10)*4; if(w2===0)ctx.moveTo(wx,wy); else ctx.lineTo(wx,wy); } ctx.stroke(); } }
      var gx=W*0.66, gy0=H*0.74, gh=H*0.5;
      for(var n2=1;n2<=5;n2++){ var En=-13.6/(n2*n2), y=gy0-(1+En/13.6)*gh; ctx.strokeStyle=(n2===ni||n2===nf)?ORA:'rgba(255,255,255,0.25)'; ctx.lineWidth=(n2===ni||n2===nf)?2:1; ctx.beginPath(); ctx.moveTo(gx,y); ctx.lineTo(gx+W*0.2,y); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillText('n='+n2+' ('+En.toFixed(1)+'eV)', gx+W*0.21, y+3); }
      var yi=gy0-(1+E_i/13.6)*gh, yf=gy0-(1+E_f/13.6)*gh; arrow(E,gx+W*0.1,yi,gx+W*0.1,yf,col,2);
      E.tapHint(W/2, H*0.90, '전이 준위를 바꿔 방출 광자(색)를 보세요', true);
      E.big('보어 원자: n='+ni+'→'+nf+' 전이로 광자 방출 (E=hf='+dE.toFixed(1)+' eV)', '전자가 정해진 칸 사이를 건너뜁니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
