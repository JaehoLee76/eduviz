/* 물리학 제14장 빛·현대물리 — 전자기파, 반사·굴절(스넬), 이중슬릿 간섭, 광전효과, 시간 팽창
   파동·광학·양자·상대성은 닫힌 형태가 본질(운동학 예외) — 표시 수치는 전부 해당 식에서 실시간 계산.
   골든룰: 화면의 모든 각도·세기·에너지·γ는 식으로 계산(하드코딩 금지).
   텍스트=content/phys14.json. 엔진=js/physlab.js(공유), js/engine.js 공유. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 14.5 시간 팽창 — 특수상대성 ══════════
  { id:'phys14_05',
    enter:function(E){ var self=this; this.s={beta:0.6,t:0};
      E.controls('<div class="ctrl"><label>속도 v (광속의 배수 β)</label><input type="range" id="bb" min="0" max="0.95" step="0.05" value="0.6"><output id="bbo">0.60</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(300+self.s.beta*300,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var gamma=1/Math.sqrt(1-s.beta*s.beta);
      // 정지 광시계(왼쪽): 빛이 두 거울 사이 수직 왕복
      var x1=W*0.22, topY=H*0.22, botY=H*0.50, ph0=(s.t*1.2)%1, ly0=topY+(botY-topY)*(ph0<0.5?ph0*2:2-ph0*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1-26,topY); ctx.lineTo(x1+26,topY); ctx.moveTo(x1-26,botY); ctx.lineTo(x1+26,botY); ctx.stroke();
      ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x1,topY); ctx.lineTo(x1,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(x1,ly0,5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('정지 시계', x1, botY+24);
      // 움직이는 광시계(오른쪽): 빛 경로가 대각선 → 한 틱이 γ배 길어짐
      var ph1=((s.t*1.2/gamma)%1), drift=((s.t*0.4)%1), bx=W*0.45+drift*W*0.4;
      var ly1=topY+(botY-topY)*(ph1<0.5?ph1*2:2-ph1*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx-26,topY); ctx.lineTo(bx+26,topY); ctx.moveTo(bx-26,botY); ctx.lineTo(bx+26,botY); ctx.stroke();
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx-drift*30,topY); ctx.lineTo(bx,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(bx,ly1,5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.fillText('움직이는 시계 (v='+s.beta.toFixed(2)+'c)', bx, botY+24);
      // 틱 카운트
      var t0=Math.floor(s.t*1.2), t1=Math.floor(s.t*1.2/gamma);
      ctx.fillStyle=GRN; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('틱 '+t0, x1, topY-12);
      ctx.fillStyle=BLU; ctx.fillText('틱 '+t1, bx, topY-12);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('γ = '+gamma.toFixed(2)+'배 느림', bx, botY+40);
      E.tapHint(W/2, H*0.86, '속도가 빠를수록 시간이 더 느려집니다', true);
      E.big('시간 팽창 γ = 1/√(1−v²/c²) = '+gamma.toFixed(2)+'배 느리게', '당신이 빛을 향해 달려가든 도망가든 빛 속도는 늘 같다 — 실험으로 확인된 이 한 줄에서 시간이 늘어납니다. 옆으로 움직이는 시계의 빛은 위아래만이 아니라 <b>비스듬한 더 긴 경로</b>를 달려야 하는데, 빛은 더 빨라질 수 없으니 한 번 왕복(1틱)에 더 오래 걸립니다 → <b>움직이는 시계가 느려집니다</b>(γ배). 마법이 아니라 논리의 강제입니다. 빠를수록(β→1) 극적으로 느려져, GPS 위성도 매일 이 보정을 받습니다. 질량조차 잠든 에너지일 뿐 — <b>E=mc²</b>. 시간·공간·질량·에너지가 하나로 얽힌, 우리가 사는 우주의 규칙입니다.'); }
  },

  // ─── 심화: 방사성 붕괴 ───
  { id:'phys14_05_decay', branchOf:'phys14_05', ord:1,
    enter:function(E){ var self=this; this.s={half:3,t:0};
      E.controls('<div class="ctrl"><label>반감기 T½ (초)</label><input type="range" id="hh" min="1" max="6" step="0.5" value="3"><output id="hho">3.0</output></div>');
      E.bind('#hh','input',function(e){ self.s.half=+e.target.value; self.s.t=0; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ if(!E.frozen)s.t+=1/60; if(s.t>s.half*5) s.t=0; }
      var frac=Math.pow(0.5, s.t/s.half), N0=64, N=N0*frac;
      // 핵 격자(남은 것 채색)
      var ox=W*0.10, oy=H*0.22, cols2=8;
      for(var i=0;i<64;i++){ var r=Math.floor(i/cols2), c=i%cols2, x=ox+c*22, y=oy+r*22;
        // 결정적으로 "남은" N개를 채움(앞에서부터 빠짐: 해시 순서)
        var alive = i >= (64-Math.round(N));
        ctx.fillStyle=alive?GRN:'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); }
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('남은 핵 N = '+Math.round(N)+' / '+N0, ox, oy-12);
      // 붕괴 곡선
      var gx0=W*0.50, gx1=W*0.93, gy0=H*0.78, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('N',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=60;k++){ var tt=k/60*s.half*5, f2=Math.pow(0.5,tt/s.half), x=gx0+(tt/(s.half*5))*(gx1-gx0), y=gy0-f2*gh; if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 반감기 표시(절반 지점)
      for(var hcnt=1;hcnt<=4;hcnt++){ var th=hcnt*s.half; if(th>s.half*5)break; var x=gx0+(th/(s.half*5))*(gx1-gx0), y=gy0-Math.pow(0.5,hcnt)*gh; ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x,gy0); ctx.lineTo(x,y); ctx.lineTo(gx0,y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(255,178,122,0.7)'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(hcnt+'T½', x, gy0+12); }
      // 현재 점
      var mx=gx0+(Math.min(s.t,s.half*5)/(s.half*5))*(gx1-gx0), my=gy0-frac*gh; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.92, '화면 탭=초기화 · 반감기마다 절반으로 줄어듦', true);
      E.big('방사성 붕괴 N = N₀·(½)^(t/T½) — 남은 핵 '+Math.round(N)+'/'+N0+'  (t='+s.t.toFixed(1)+'s)', '핵 하나에게 \'언제 깨질래?\' 물으면 우주 누구도 모릅니다 — 완벽한 무작위입니다. 그런데 수십억 개를 모으면 거짓말처럼 정확해져, 매 <b>반감기 T½</b>마다 어김없이 <b>딱 절반</b>이 사라집니다. N = N₀·(½)^(t/T½) = N₀·e^(−λt). 개별은 예측 불가, 집단은 시계처럼 정확 — 양자 통계의 마법이죠. 반감기는 원소 고유(탄소-14 5730년, 우라늄-238 45억년). 이 멈추지 않는 리듬이 <b>방사성 연대측정</b>(화석·유물·암석 나이)의 시계가 됩니다. 핵에너지·의료 방사선의 바탕입니다.'); }
  },

  // ─── 심화: 휘어진 시공간 (일반상대성) — 인트로 훅의 본편 ───
  { id:'phys14_05_gr', branchOf:'phys14_05', ord:1,
    enter:function(E){ var self=this; this.s={M:1.2};
      E.controls('<div class="ctrl"><label>질량 M (시공간 굴곡)</label><input type="range" id="mm" min="0" max="2.5" step="0.1" value="1.2"><output id="mmo">1.2</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.M*100,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, fr=E.frame;
      var cx=W*0.40, cy=H*0.44, gw=Math.min(W*0.30,H*0.42), warp=s.M;
      function dip(dx,dy){ var rr=(dx*dx+dy*dy)/(gw*gw*0.08); return warp*(gw*0.6)/(1+rr); }
      function P(u,v){ var bx=u*gw,by=v*gw*0.5,d=dip(bx,by),r=Math.hypot(bx,by)||1,pull=d*0.34; return [cx+bx-(bx/r)*pull, cy+by+d]; }
      // 시공간 격자(휘어진 우물)
      var N=13;
      for(var iy=0;iy<=N;iy++){ var v=iy/N*2-1; ctx.strokeStyle='rgba(95,214,168,'+(0.09+0.15*(1-Math.abs(v))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(var ix=0;ix<=N;ix++){ var p=P(ix/N*2-1,v); if(ix===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
      for(ix=0;ix<=N;ix++){ var u=ix/N*2-1; ctx.strokeStyle='rgba(122,184,255,'+(0.07+0.12*(1-Math.abs(u))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(iy=0;iy<=N;iy++){ var p2=P(u,iy/N*2-1); if(iy===0)ctx.moveTo(p2[0],p2[1]); else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); }
      // 중심 질량
      var my=cy+dip(0,0); var grd=ctx.createRadialGradient(cx,my,2,cx,my,18+warp*12); grd.addColorStop(0,'rgba(255,244,210,0.95)'); grd.addColorStop(1,'rgba(255,178,90,0)'); ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,my,18+warp*12,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,my,3+warp*4,0,7); ctx.fill();
      // 빛(별빛)이 질량 곁을 지나며 휘어짐 — 중력렌즈
      var beamY=cy-gw*0.42, bx0=cx-gw*1.3; ctx.strokeStyle='#ffe06a'; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=80;k++){ var X=bx0+k/80*(gw*2.6), rel=(X-cx), defl=warp*1400/((rel*rel)+gw*gw*0.4); var Y=beamY + defl*(rel>0?-0: 0) + defl;  // 질량 쪽으로 당겨짐
        Y=beamY + warp* (gw*0.5) * Math.exp(-(rel*rel)/(gw*gw*0.5)) ;   // 가까울수록 아래로 휨
        if(k===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      ctx.fillStyle='#ffe06a'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('별빛', bx0, beamY-6);
      // 시간 느려짐: 멀리·가까이 두 시계
      function clock(px,py,rate,lab){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,12,0,7); ctx.stroke(); var a=-Math.PI/2 + (fr*0.04*rate)%(2*Math.PI); ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+9*Math.cos(a),py+9*Math.sin(a)); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,px,py+26); }
      var rateNear=1/Math.sqrt(1+warp*0.8);   // 질량 근처 시계가 느리게(개념적)
      clock(cx+gw*0.35, cy+gw*0.34, rateNear, '질량 근처(느림)');
      clock(W*0.88, H*0.30, 1, '먼 곳(빠름)');
      E.tapHint(W/2, H*0.93, '질량을 키우면 시공간이 더 휘고 빛도 더 꺾입니다', true);
      E.big('일반상대성 — 중력은 휘어진 시공간이다', '뉴턴은 "왜 끌어당기지?"에 답하지 못했습니다. 아인슈타인의 답: <b>끌어당기는 게 아니다 — 질량이 시공간을 휘게 하고, 모든 것은 그 휜 길을 따라갈 뿐</b>이다. 무거울수록 우물이 깊어지죠. 놀랍게도 <b>빛조차 휩니다</b>(별빛이 태양 곁에서 꺾이는 것을 1919년 일식 때 확인 — 아인슈타인은 하룻밤 새 유명해졌습니다). 질량 근처에서는 <b>시간도 느려집니다</b>(그래서 GPS는 매일 보정). 우물이 너무 깊어 빛조차 못 나오면 블랙홀, 시공간이 출렁이면 중력파(2015 직접 관측). 인트로에서 본 그 휘어진 무대 — 바로 우리가 사는 우주의 진짜 모습입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
