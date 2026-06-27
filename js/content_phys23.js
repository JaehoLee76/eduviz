/* 물리학 「가우스 법칙」 — 닫힌 면을 뚫는 전기선속은 갇힌 전하에만 비례한다(맥스웰 1법칙).
   전기선속·가우스법칙·구대칭·무한평면·도체차폐. 전기장(앞)과 전위(뒤)를 잇는 정전기학의 기둥.
   골든룰: 선속 Φ=EAcosθ·Φ=Q/ε₀, 구/평면/도체 전기장을 가우스 대칭으로 실시간 계산.
   동작=이 파일, 텍스트=content/phys23.json. 가우스법칙 장면은 phys11에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  var POS='#ff8a6b', NEG='#6ba8ff';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }
  function charge(E,x,y,r,q){ var ctx=E.ctx; ctx.fillStyle=q>=0?POS:NEG; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-r*0.5,y); ctx.lineTo(x+r*0.5,y); if(q>=0){ ctx.moveTo(x,y-r*0.5); ctx.lineTo(x,y+r*0.5); } ctx.stroke(); }

  var scenes=[

  // ══════════ 1. 전기선속 Φ = E·A·cosθ ══════════
  { id:'phys23_01',
    enter:function(E){ var self=this; this.s={th:0,Efield:3};
      E.controls('<div class="ctrl"><label>면 기울기 θ (도)</label><input type="range" id="tt" min="0" max="90" step="5" value="0"><output id="tto">0</output>'
        +'<label style="margin-left:14px">전기장 E</label><input type="range" id="ee" min="1" max="5" step="0.5" value="3"><output id="eeo">3.0</output></div>');
      E.bind('#tt','input',function(e){ self.s.th=+e.target.value; document.getElementById('tto').textContent=e.target.value; E.blip(300+self.s.th*4,0.06); });
      E.bind('#ee','input',function(e){ self.s.Efield=+e.target.value; document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var A=1, th=s.th*Math.PI/180, flux=s.Efield*A*Math.cos(th);   // Φ=E·A·cosθ (골든룰)
      var cx=W*0.42, cy=H*0.44, R=Math.min(W*0.13,H*0.19);
      // 균일 전기장(가로 →)
      ctx.strokeStyle='rgba(255,178,122,0.4)'; for(var ly=cy-R*1.5; ly<=cy+R*1.5; ly+=24){ arrow(E,cx-R*1.7,ly,cx+R*1.7,ly,'rgba(255,178,122,0.4)',1.4); }
      ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('전기장 E →', cx-R*1.7, cy-R*1.3);
      // 면(기울기 θ → 가로로 본 폭이 cosθ)
      var wFace=R*Math.cos(th);
      ctx.strokeStyle=BLU; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-wFace, cy-R); ctx.lineTo(cx+wFace, cy+R); ctx.stroke();
      // 법선
      var nx=Math.cos(th), ny=Math.sin(th); arrow(E,cx,cy,cx+nx*R*1.1,cy+ny*R*1.1,GRN,2); ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.fillText('법선', cx+nx*R*1.1+4, cy+ny*R*1.1);
      // 면을 뚫는 선 강조
      ctx.strokeStyle='rgba(143,227,181,0.7)'; for(var hy=cy-R*0.8; hy<cy+R*0.8; hy+=18){ arrow(E,cx-wFace-10,hy,cx+wFace+10,hy,'rgba(143,227,181,0.7)',1.6); }
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('전기선속 Φ = E·A·cosθ = '+s.Efield.toFixed(1)+'×1×cos'+s.th+'° = '+flux.toFixed(2), W/2, H*0.74);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(s.th===0?'면이 장에 수직 → 최대 선속(가장 많은 선 통과)':s.th>=90?'면이 장과 나란 → 선속 0':'기울일수록 통과 선이 cosθ로 줄어듦', W/2, H*0.82);
      E.tapHint(W/2, H*0.92, '면을 기울이면 통과하는 전기선속이 cosθ로 줄어듭니다', true);
      E.big('전기선속 Φ = E·A·cosθ — 면을 뚫는 전기장의 양', '면을 통과하는 전기력선의 수입니다.'); }
  },

  // ══════════ 2. 가우스 법칙 Φ = Q/ε₀ ══════════
  { id:'phys23_02',
    enter:function(E){ var self=this; this.s={r:2.5,Q:2};
      E.controls('<div class="ctrl"><label>가우스면 반지름 r</label><input type="range" id="rr" min="1.5" max="4" step="0.25" value="2.5"><output id="rro">2.5</output>'
        +'<label style="margin-left:14px">전하 Q</label><input type="range" id="qq" min="1" max="4" step="1" value="2"><output id="qqo">2</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(2); E.blip(360,0.07); });
      E.bind('#qq','input',function(e){ self.s.Q=+e.target.value; document.getElementById('qqo').textContent=e.target.value; E.blip(380,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.40, cy=H*0.46, sc=Math.min(W*0.07,H*0.095);
      var nlines=s.Q*8;
      for(var i=0;i<nlines;i++){ var a=i/nlines*6.2832; ctx.strokeStyle='rgba(122,184,255,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx+12*Math.cos(a),cy+12*Math.sin(a)); ctx.lineTo(cx+sc*4*Math.cos(a),cy+sc*4*Math.sin(a)); ctx.stroke(); }
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(cx,cy,s.r*sc,0,7); ctx.stroke(); ctx.setLineDash([]);
      charge(E,cx,cy,14,s.Q);
      ctx.fillStyle=POS; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('Q = +'+s.Q, cx, cy+26);
      ctx.fillStyle=ORA; ctx.fillText('가우스면 (반지름 r='+s.r.toFixed(1)+')', cx, cy-s.r*sc-8);
      ctx.fillStyle='rgba(122,184,255,0.8)'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('전기력선 '+nlines+'개 (∝ Q)', cx+sc*4*0.7, cy-sc*4*0.7);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('선속 Φ = Q/ε₀ — 면을 뚫는 선 수 = '+nlines+'개 (반지름 r 무관!)', W/2, H*0.84);
      E.tapHint(W/2, H*0.92, '반지름을 바꿔도 면을 뚫는 선속은 일정 — 갇힌 전하 Q에만 비례', true);
      E.big('가우스 법칙: Φ = Q/ε₀ — 갇힌 전하만이 선속을 정한다', '닫힌 면을 뚫는 선속은 안의 전하에만 비례.'); }
  },

  // ══════════ 3. 구 대칭 — 가우스로 전기장 구하기 ══════════
  { id:'phys23_03',
    enter:function(E){ var self=this; this.s={r:2.6};
      E.controls('<div class="ctrl"><label>측정 거리 r (껍질 반지름 R=2)</label><input type="range" id="rr" min="0.4" max="5" step="0.1" value="2.6"><output id="rro">2.6</output></div>');
      E.bind('#rr','input',function(e){ self.s.r=+e.target.value; document.getElementById('rro').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, k=9, Q=4, R=2;
      // 대전된 구껍질: r<R 내부 E=0, r>R 외부 E=kQ/r² (가우스 대칭) (골든룰)
      var Efield = s.r<R ? 0 : k*Q/(s.r*s.r);
      var cx=W*0.34, cy=H*0.46, sc=Math.min(W*0.05,H*0.07);
      // 구껍질
      ctx.strokeStyle='rgba(255,178,122,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,R*sc,0,7); ctx.stroke();
      ctx.fillStyle='rgba(255,138,107,0.10)'; ctx.beginPath(); ctx.arc(cx,cy,R*sc,0,7); ctx.fill();
      ctx.fillStyle=POS; ctx.font='11px sans-serif'; ctx.textAlign='center'; for(var a=0;a<12;a++){ var th=a/12*6.28; ctx.fillText('+', cx+R*sc*Math.cos(th), cy+R*sc*Math.sin(th)+4); }
      ctx.fillStyle=DIM; ctx.fillText('대전 구껍질 R=2', cx, cy+R*sc+22);
      // 가우스면(측정 r)
      ctx.strokeStyle=GRN; ctx.lineWidth=1.8; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(cx,cy,s.r*sc,0,7); ctx.stroke(); ctx.setLineDash([]);
      // E 화살표(외부만)
      if(Efield>0){ var px=cx+s.r*sc; arrow(E,px,cy,px+Math.min(40,Efield*5),cy,GRN,2.5); }
      // E(r) 곡선
      var gx0=W*0.60, gx1=W*0.94, gy0=H*0.78, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('E',gx0+3,gy0-gh+4); ctx.fillText('r',gx1-8,gy0+14);
      var Emax=k*Q/(R*R);
      ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath();
      for(var rr=0.1;rr<=5;rr+=0.05){ var e2=rr<R?0:k*Q/(rr*rr), x=gx0+(rr/5)*(gx1-gx0), y=gy0-Math.min(gh,e2/Emax*gh); if(rr<=0.1)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // R 경계선
      var Rx=gx0+(R/5)*(gx1-gx0); ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(Rx,gy0); ctx.lineTo(Rx,gy0-gh); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('R', Rx, gy0+12);
      var mx=gx0+(s.r/5)*(gx1-gx0), my=gy0-Math.min(gh,Efield/Emax*gh); ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.r<R?'내부(r<R): E = 0 (갇힌 전하 0!)':'외부(r>R): E = kQ/r² = '+Efield.toFixed(1), W/2, H*0.88);
      E.tapHint(W/2, H*0.94, '구껍질 내부는 E=0, 외부는 점전하처럼 kQ/r² (가우스 대칭)', true);
      E.big('구 대칭 — 가우스로 적분 없이: 내부 E=0, 외부 kQ/r²', '대칭이면 가우스가 전기장을 단숨에 줍니다.'); }
  },

  // ══════════ 4. 무한 평면 — 거리와 무관한 균일장 ══════════
  { id:'phys23_04',
    enter:function(E){ var self=this; this.s={sigma:3};
      E.controls('<div class="ctrl"><label>면전하밀도 σ</label><input type="range" id="ss" min="1" max="5" step="0.5" value="3"><output id="sso">3.0</output></div>');
      E.bind('#ss','input',function(e){ self.s.sigma=+e.target.value; document.getElementById('sso').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, eps=1;
      var Efield = s.sigma/(2*eps);   // 무한 평면: E=σ/2ε₀ (거리 무관!) (골든룰)
      var px=W*0.42, cy=H*0.46;
      // 대전 평면(세로)
      ctx.strokeStyle='rgba(255,178,122,0.9)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(px,cy-H*0.30); ctx.lineTo(px,cy+H*0.30); ctx.stroke();
      ctx.fillStyle=POS; ctx.font='12px sans-serif'; ctx.textAlign='center'; for(var y=cy-H*0.26;y<cy+H*0.28;y+=30){ ctx.fillText('+', px, y); }
      ctx.fillStyle=DIM; ctx.fillText('무한 대전 평면 σ='+s.sigma.toFixed(1), px, cy+H*0.34);
      // 균일장(양쪽, 평행·등간격 = 거리 무관)
      var alen=Math.min(70,Efield*16);
      for(var yy=cy-H*0.24; yy<=cy+H*0.24; yy+=30){
        arrow(E,px+10,yy,px+10+alen,yy,GRN,2);   // 오른쪽
        arrow(E,px-10,yy,px-10-alen,yy,GRN,2);    // 왼쪽
      }
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('E = σ/2ε₀ = '+Efield.toFixed(2)+'  (양쪽 모두, 평면에서 멀어져도 일정!)', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('점전하는 1/r²로 약해지지만, 무한 평면의 장은 거리와 무관 — 균일장', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '화살표 길이(전기장)가 거리와 상관없이 일정합니다 (가우스)', true);
      E.big('무한 평면 — E = σ/2ε₀ (거리와 무관한 균일장)', '평면이 만드는 장은 어디서나 같습니다.'); }
  },

  // ══════════ 5. 도체 차폐 — 내부 E=0 (패러데이 새장) ══════════
  { id:'phys23_05',
    enter:function(E){ var self=this; this.s={Eext:3};
      E.controls('<div class="ctrl"><label>외부 전기장 E</label><input type="range" id="ee" min="0" max="5" step="0.5" value="3"><output id="eeo">3.0</output></div>');
      E.bind('#ee','input',function(e){ self.s.Eext=+e.target.value; document.getElementById('eeo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var cx=W*0.44, cy=H*0.46, R=Math.min(W*0.13,H*0.20);
      // 외부 균일장(왼→오), 도체 만나면 멈춤
      var alen=Math.min(60,s.Eext*14);
      for(var yy=cy-H*0.26; yy<=cy+H*0.26; yy+=26){ var insideBand = Math.abs(yy-cy)<R*0.95;
        if(insideBand){ // 도체에 닿아 멈춤(왼쪽까지만)
          arrow(E,W*0.10,yy,cx-R-4,yy,'rgba(143,227,181,0.7)',1.8);
          // 도체 표면 유도전하
        } else { arrow(E,W*0.10,yy,W*0.10+alen+W*0.5,yy,'rgba(143,227,181,0.5)',1.6); }
      }
      // 도체(원)
      ctx.fillStyle='rgba(180,190,210,0.18)'; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
      ctx.strokeStyle='rgba(200,210,230,0.8)'; ctx.lineWidth=2.5; ctx.stroke();
      // 유도전하(왼쪽 −, 오른쪽 +)
      ctx.font='13px sans-serif'; ctx.textAlign='center';
      for(var a=-1;a<=1;a+=0.5){ ctx.fillStyle=NEG; ctx.fillText('−', cx-R*Math.cos(a*0.6), cy+R*Math.sin(a*0.9)); ctx.fillStyle=POS; ctx.fillText('+', cx+R*Math.cos(a*0.6), cy+R*Math.sin(a*0.9)); }
      // 내부 E=0
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('내부 E = 0', cx, cy);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('도체', cx, cy+R+20);
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('도체 속 자유전자가 재배치 → 외부장을 정확히 상쇄 → 내부 E=0', W/2, H*0.82);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('패러데이 새장: 자동차·비행기가 번개에 안전한 이유, 전자기 차폐', W/2, H*0.89);
      E.tapHint(W/2, H*0.94, '외부 장을 키워도 도체 내부 전기장은 항상 0 (차폐)', true);
      E.big('도체 차폐 — 내부 E=0 (패러데이 새장)', '도체가 내부를 전기장에서 지킵니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
