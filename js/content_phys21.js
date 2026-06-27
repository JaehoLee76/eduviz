/* 물리학 「특수상대성」 — 빛 속도가 모두에게 같다는 한 줄에서 시간·공간·질량이 뒤집힌다.
   시간 팽창·길이 수축·E=mc²·동시성의 상대성·일반상대성(휘어진 시공간). 인트로 훅의 본편(피날레).
   골든룰: γ=1/√(1−β²), 모든 시간·길이·에너지·동시성 어긋남은 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys21.json. 시간팽창·일반상대성은 phys14에서 옮김. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }

  var scenes=[

  // ══════════ 1. 시간 팽창 — 움직이는 시계가 느려진다 ══════════
  { id:'phys21_01',
    enter:function(E){ var self=this; this.s={beta:0.6,t:0};
      E.controls('<div class="ctrl"><label>속도 v (광속의 배수 β)</label><input type="range" id="bb" min="0" max="0.95" step="0.05" value="0.6"><output id="bbo">0.60</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(300+self.s.beta*300,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var gamma=1/Math.sqrt(1-s.beta*s.beta);
      var x1=W*0.22, topY=H*0.22, botY=H*0.50, ph0=(s.t*1.2)%1, ly0=topY+(botY-topY)*(ph0<0.5?ph0*2:2-ph0*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x1-26,topY); ctx.lineTo(x1+26,topY); ctx.moveTo(x1-26,botY); ctx.lineTo(x1+26,botY); ctx.stroke();
      ctx.strokeStyle=ORA; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x1,topY); ctx.lineTo(x1,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(x1,ly0,5,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('정지 시계', x1, botY+24);
      var ph1=((s.t*1.2/gamma)%1), drift=((s.t*0.4)%1), bx=W*0.45+drift*W*0.4;
      var ly1=topY+(botY-topY)*(ph1<0.5?ph1*2:2-ph1*2);
      ctx.strokeStyle=DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx-26,topY); ctx.lineTo(bx+26,topY); ctx.moveTo(bx-26,botY); ctx.lineTo(bx+26,botY); ctx.stroke();
      ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx-drift*30,topY); ctx.lineTo(bx,botY); ctx.stroke();
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(bx,ly1,5,0,7); ctx.fill();
      ctx.fillStyle=BLU; ctx.fillText('움직이는 시계 (v='+s.beta.toFixed(2)+'c)', bx, botY+24);
      var t0=Math.floor(s.t*1.2), t1=Math.floor(s.t*1.2/gamma);
      ctx.fillStyle=GRN; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('틱 '+t0, x1, topY-12);
      ctx.fillStyle=BLU; ctx.fillText('틱 '+t1, bx, topY-12);
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.fillText('γ = '+gamma.toFixed(2)+'배 느림', bx, botY+40);
      E.tapHint(W/2, H*0.86, '속도가 빠를수록 시간이 더 느려집니다', true);
      E.big('시간 팽창 γ = 1/√(1−v²/c²) = '+gamma.toFixed(2)+'배 느리게', '움직이는 시계가 느려집니다.'); }
  },

  // ══════════ 2. 길이 수축 — 움직이는 자가 짧아진다 ══════════
  { id:'phys21_02',
    enter:function(E){ var self=this; this.s={beta:0.6};
      E.controls('<div class="ctrl"><label>속도 v (광속의 배수 β)</label><input type="range" id="bb" min="0" max="0.95" step="0.05" value="0.6"><output id="bbo">0.60</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); E.blip(300+self.s.beta*300,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var gamma=1/Math.sqrt(1-s.beta*s.beta), L0=W*0.42, L=L0/gamma;   // 길이수축 L=L₀/γ=L₀√(1−β²) (골든룰)
      // 정지 우주선
      var cx=W*0.5, y1=H*0.30; ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.fillRect(cx-L0/2,y1-16,L0,32);
      ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.strokeRect(cx-L0/2,y1-16,L0,32);
      ctx.beginPath(); ctx.moveTo(cx+L0/2,y1-16); ctx.lineTo(cx+L0/2+22,y1); ctx.lineTo(cx+L0/2,y1+16); ctx.fillStyle='rgba(122,184,255,0.18)'; ctx.fill(); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('정지 길이 L₀', cx, y1-26);
      // 움직이는 우주선(수축)
      var y2=H*0.56; ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.fillRect(cx-L/2,y2-16,L,32);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.strokeRect(cx-L/2,y2-16,L,32);
      ctx.beginPath(); ctx.moveTo(cx+L/2,y2-16); ctx.lineTo(cx+L/2+22,y2); ctx.lineTo(cx+L/2,y2+16); ctx.fillStyle='rgba(255,178,122,0.18)'; ctx.fill(); ctx.stroke();
      arrow(E,cx+L/2+30,y2,cx+L/2+60,y2,GRN,2);
      ctx.fillStyle=ORA; ctx.fillText('v='+s.beta.toFixed(2)+'c 로 달리는 같은 우주선', cx, y2+30);
      // 비교선
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(cx-L0/2,y1+16); ctx.lineTo(cx-L0/2,y2-16); ctx.moveTo(cx+L0/2,y1+16); ctx.lineTo(cx+L0/2,y2-16); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('길이 수축 L = L₀/γ = L₀ × '+(1/gamma).toFixed(2)+'  (진행 방향으로만)', W/2, H*0.78);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('빠를수록 짧아짐 — 빛 속도에 가까우면 종잇장처럼', W/2, H*0.85);
      E.tapHint(W/2, H*0.92, '속도를 올리면 진행 방향 길이가 줄어듭니다(폭은 그대로)', true);
      E.big('길이 수축 L = L₀√(1−v²/c²) = L₀ × '+(1/gamma).toFixed(2), '움직이는 자가 짧아집니다.'); }
  },

  // ══════════ 3. E = mc² — 질량은 잠든 에너지 ══════════
  { id:'phys21_03',
    enter:function(E){ var self=this; this.s={m:1};
      E.controls('<div class="ctrl"><label>질량 m (그램)</label><input type="range" id="mm" min="0.1" max="10" step="0.1" value="1"><output id="mmo">1.0</output></div>');
      E.bind('#mm','input',function(e){ self.s.m=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.m*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, c=3e8;
      var E_J=(s.m/1000)*c*c;   // E=mc² (m을 kg로) (골든룰)
      var tnt=E_J/4.18e9;       // TNT 톤 환산(1톤 TNT=4.18e9 J)
      var homes=E_J/(3.6e6*30*10);  // 가정 월 사용량(~300kWh=1.08e9J) 대비 (대략 가구·달)
      // 작은 질량 그림
      var cx=W*0.24, cy=H*0.40; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,cy,8+s.m*2,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('질량 m = '+s.m.toFixed(1)+' g', cx, cy+36);
      arrow(E,cx+24,cy,W*0.44,cy,GRN,2.5);
      // 거대 에너지 폭발 표현
      var ex=W*0.62, g=ctx.createRadialGradient(ex,cy,4,ex,cy,50+s.m*4); g.addColorStop(0,'rgba(255,245,200,0.95)'); g.addColorStop(1,'rgba(255,160,60,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ex,cy,50+s.m*4,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='600 14px sans-serif'; ctx.fillText('어마어마한 에너지!', ex, cy);
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('E = mc² = '+E_J.toExponential(2)+' J', W/2, H*0.66);
      ctx.fillStyle=ORA; ctx.font='14px sans-serif'; ctx.fillText('≈ TNT '+tnt.toFixed(0).toLocaleString()+' 톤   ·   가정 '+Math.round(homes).toLocaleString()+'가구·달 분', W/2, H*0.74);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('c²이 어마어마하게 커서, 손톱만 한 질량도 도시를 날릴 에너지', W/2, H*0.82);
      ctx.fillText('핵분열·핵융합·태양이 바로 이 질량→에너지 변환', W/2, H*0.88);
      E.tapHint(W/2, H*0.93, '아주 작은 질량도 c²을 곱하면 천문학적 에너지가 됩니다', true);
      E.big('E = mc² — 질량은 잠든 에너지', '질량과 에너지는 같은 것의 두 얼굴.'); }
  },

  // ══════════ 4. 동시성의 상대성 — '동시'는 보는 사람마다 다르다 ══════════
  { id:'phys21_04',
    enter:function(E){ var self=this; this.s={beta:0.5,t:0};
      E.controls('<div class="ctrl"><label>기차 속도 β</label><input type="range" id="bb" min="0.2" max="0.8" step="0.05" value="0.5"><output id="bbo">0.50</output></div>');
      E.bind('#bb','input',function(e){ self.s.beta=+e.target.value; document.getElementById('bbo').textContent=(+e.target.value).toFixed(2); self.s.t=0; E.blip(300+self.s.beta*200,0.06); });
      E.setOn([]); },
    tap:function(E){ this.s.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ s.t+=1/60; if(s.t>3.2) s.t=0; }
      var cy=H*0.42, x0=W*0.16, x1=W*0.84, mid=(x0+x1)/2, t=s.t, sp=W*0.16;   // 빛 퍼지는 속도(화면)
      // 기차(중앙 관찰자, β로 오른쪽 이동)
      var trainMid=mid+s.beta*sp*t*0.6;
      ctx.fillStyle='rgba(122,184,255,0.12)'; ctx.fillRect(x0,cy-22,x1-x0,44); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(x0,cy-22,x1-x0,44);
      // 양 끝 번개(동시 발생, 플랫폼 기준)
      ctx.fillStyle='#ffe06a'; ctx.font='18px sans-serif'; ctx.textAlign='center'; if(t<0.3){ ctx.fillText('⚡', x0, cy-28); ctx.fillText('⚡', x1, cy-28); }
      // 빛 파면(양 끝에서 퍼짐)
      var rL=sp*t; ctx.strokeStyle='rgba(255,224,106,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(x0,cy,rL,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(x1,cy,rL,0,7); ctx.stroke();
      // 플랫폼 관찰자(고정 중앙)
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(mid,cy+40,7,0,7); ctx.fill(); ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('플랫폼 관찰자', mid, cy+62);
      var reachPlat = rL>=(mid-x0);
      // 기차 관찰자(이동 중앙)
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(trainMid,cy,6,0,7); ctx.fill(); ctx.fillStyle=ORA; ctx.fillText('기차 관찰자', trainMid, cy+16);
      var reachFront = rL>=Math.abs(x1-trainMid), reachBack = rL>=Math.abs(trainMid-x0);
      // 판정
      ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillStyle=GRN; ctx.fillText('플랫폼: 두 빛이 '+(reachPlat?'동시 도착 ✓ → 두 번개는 동시':'…도착 중'), W*0.10, H*0.74);
      ctx.fillStyle=ORA; ctx.fillText('기차: '+(reachFront&&!reachBack?'앞 번개 먼저! → 동시가 아님':reachFront&&reachBack?'둘 다 도착(앞이 먼저였음)':'…'), W*0.10, H*0.82);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('같은 두 사건이 한 사람에겐 동시, 다른 사람에겐 시간차 — \'동시\'는 절대적이지 않다', W*0.10, H*0.89);
      E.tapHint(W/2, H*0.94, '화면 탭=다시 · 기차는 앞으로 가니 앞 번개 빛을 먼저 만남', true);
      E.big('동시성의 상대성 — \'동시\'는 보는 사람마다 다르다', '시간 순서조차 절대적이지 않습니다.'); }
  },

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
