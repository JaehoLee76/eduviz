/* 물리학 「파동광학」 — 빛이 파동임을 드러내는 간섭과 회절.
   기하광학(광선)으로는 설명 못 하는 무늬들: 이중슬릿·단일슬릿·회절격자·박막·분해능.
   골든룰: 모든 무늬 세기·각도는 경로차·격자식 d sinθ=mλ·sinc²·레일리식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys18.json. 이중슬릿·회절은 phys14에서 옮겨 확장. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  function lamColor(lamNm){ // 파장(nm)→근사 색
    var l=lamNm; if(l<440)return '#8b5cf6'; if(l<490)return '#4488ff'; if(l<560)return '#33dd55'; if(l<590)return '#ffe23a'; if(l<630)return '#ff9933'; return '#ff4444'; }

  var scenes=[

  // ══════════ 1. 이중슬릿 간섭 — 빛은 파동이다 ══════════
  { id:'phys18_01',
    enter:function(E){ var self=this; this.s={d:3,lam:1};
      E.controls('<div class="ctrl"><label>슬릿 간격 d</label><input type="range" id="dd" min="1.5" max="5" step="0.5" value="3"><output id="ddo">3.0</output>'
        +'<label style="margin-left:14px">파장 λ</label><input type="range" id="ll" min="0.5" max="2" step="0.1" value="1"><output id="llo">1.0</output></div>');
      E.bind('#dd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ll','input',function(e){ self.s.lam=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.lam*120,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var slitX=W*0.22, scrX=W*0.80, cy=H*0.44, Lsep=s.d*18;
      var s1y=cy-Lsep/2, s2y=cy+Lsep/2, lamPx=s.lam*16, top=H*0.19, bot=H*0.78, span=scrX-slitX;
      var key=[s.d,s.lam,Math.round(W),Math.round(H)].join('_');
      if(s.fieldKey!==key){ s.fieldKey=key; if(!s.fc) s.fc=document.createElement('canvas');
        s.fc.width=W; s.fc.height=H; var fx=s.fc.getContext('2d'); fx.clearRect(0,0,W,H); var step=4;
        for(var x=slitX; x<=scrX; x+=step){ var dist=x-slitX, fall=0.52+0.4*(1-dist/span);
          for(var y=top; y<=bot; y+=step){ var r1=Math.hypot(x-slitX,y-s1y), r2=Math.hypot(x-slitX,y-s2y);
            var I=Math.pow(Math.cos(Math.PI*(r2-r1)/lamPx),2);
            if(I>0.06){ fx.fillStyle='rgba(255,214,122,'+(I*I*0.4*fall)+')'; fx.fillRect(x,y,step,step); } } } }
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.drawImage(s.fc,0,0); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation='lighter';
      [s1y,s2y].forEach(function(sy){ for(var rr=lamPx; rr<span+24; rr+=lamPx){ var a=0.34*Math.max(0.25, 1-rr/(span+60));
        ctx.strokeStyle='rgba(150,201,255,'+a+')'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(slitX,sy,rr,-0.95,0.95); ctx.stroke(); } }); ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=3.4; ctx.beginPath();
      ctx.moveTo(slitX,top); ctx.lineTo(slitX,s1y-6); ctx.moveTo(slitX,s1y+6); ctx.lineTo(slitX,s2y-6); ctx.moveTo(slitX,s2y+6); ctx.lineTo(slitX,bot); ctx.stroke();
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(slitX,s1y,3.2,0,7); ctx.arc(slitX,s2y,3.2,0,7); ctx.fill();
      var L=span/18;
      ctx.strokeStyle='rgba(255,255,255,0.42)'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(scrX,top); ctx.lineTo(scrX,bot); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(var py=-(cy-top);py<=bot-cy;py+=2){ var yy=cy+py; var R1=Math.hypot(scrX-slitX,yy-s1y), R2=Math.hypot(scrX-slitX,yy-s2y);
        var Is=Math.pow(Math.cos(Math.PI*(R2-R1)/lamPx),2);
        if(Is>0.04){ ctx.fillStyle='rgba(255,214,128,'+(Is*0.95)+')'; ctx.fillRect(scrX+3, yy-1.4, 34, 3.0);
          if(Is>0.6){ ctx.fillStyle='rgba(255,245,210,'+((Is-0.6)*1.8)+')'; ctx.fillRect(scrX+3, yy-1.4, 34, 3.0); } } } ctx.restore();
      ctx.strokeStyle='rgba(255,224,150,0.85)'; ctx.lineWidth=1.6; ctx.beginPath();
      for(var qy=top; qy<=bot; qy+=2){ var Q1=Math.hypot(scrX-slitX,qy-s1y), Q2=Math.hypot(scrX-slitX,qy-s2y);
        var Iq=Math.pow(Math.cos(Math.PI*(Q2-Q1)/lamPx),2), qx=scrX+42+Iq*40; if(qy===top)ctx.moveTo(qx,qy); else ctx.lineTo(qx,qy); } ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('스크린', scrX+17, bot+18); ctx.fillText('이중슬릿', slitX, bot+18);
      var fr=(s.lam*L/s.d).toFixed(1); ctx.fillStyle=DIM; ctx.fillText('무늬 간격 ≈ λL/d = '+fr, scrX+30, bot+34);
      E.tapHint(W/2, H*0.92, '틈 간격·파장을 바꿔 무늬가 벌어지는 걸 보세요', true);
      E.big('이중슬릿 간섭 — 빛은 파동이다 (밝고 어두운 줄무늬)', '두 물결이 겹쳐 무늬를 만듭니다.'); }
  },

  // ══════════ 2. 단일슬릿 회절 — 빛이 모퉁이를 돈다 ══════════
  { id:'phys18_02',
    enter:function(E){ var self=this; this.s={a:2,lam:1};
      E.controls('<div class="ctrl"><label>슬릿 폭 a</label><input type="range" id="aa" min="1" max="5" step="0.5" value="2"><output id="aao">2.0</output>'
        +'<label style="margin-left:14px">파장 λ</label><input type="range" id="ll" min="0.5" max="2" step="0.1" value="1"><output id="llo">1.0</output></div>');
      E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ll','input',function(e){ self.s.lam=+e.target.value; document.getElementById('llo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.lam*120,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var slitX=W*0.30, scrX=W*0.82, cy=H*0.44, aw=s.a*14;
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(slitX,H*0.14); ctx.lineTo(slitX,cy-aw/2); ctx.moveTo(slitX,cy+aw/2); ctx.lineTo(slitX,H*0.74); ctx.stroke();
      for(var w=0;w<4;w++){ ctx.strokeStyle='rgba(122,184,255,0.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(W*0.12+w*14,cy-aw/2); ctx.lineTo(W*0.12+w*14,cy+aw/2); ctx.stroke(); }
      // 슬릿에서 부채처럼 퍼지는 회절 — 각도별 밝기 ∝ sinc²(중앙 채움)
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(var ang=-62;ang<=62;ang+=3){ var ar=ang*Math.PI/180, b2=Math.PI*s.a*Math.sin(ar)/s.lam, Ia=b2===0?1:Math.pow(Math.sin(b2)/b2,2); if(Ia<0.012) continue;
        ctx.strokeStyle='rgba(255,210,120,'+(Ia*0.5).toFixed(3)+')'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(slitX,cy); ctx.lineTo(slitX+Math.cos(ar)*(scrX-slitX), cy+Math.sin(ar)*(scrX-slitX)); ctx.stroke(); }
      for(var ri=1;ri<=5;ri++){ var rr=ri*(scrX-slitX)/5.5; ctx.strokeStyle='rgba(122,184,255,0.16)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(slitX,cy,rr,-1.12,1.12); ctx.stroke(); } ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(scrX,H*0.12); ctx.lineTo(scrX,H*0.76); ctx.stroke();
      var Ld=(scrX-slitX)/14;
      for(var py=-H*0.30;py<=H*0.30;py+=2){ var yu=py/14, theta=Math.atan2(yu,Ld), beta=Math.PI*s.a*Math.sin(theta)/s.lam, I=beta===0?1:Math.pow(Math.sin(beta)/beta,2);
        ctx.fillStyle='rgba(255,210,120,'+I.toFixed(3)+')'; ctx.fillRect(scrX+4, cy+py-1, 28, 2); }
      var width=2*s.lam/s.a;
      ctx.fillStyle='rgba(255,210,120,0.9)'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('밝기 I=sinc²(πa·sinθ/λ)', scrX+18, H*0.10);
      ctx.fillStyle=DIM; ctx.fillText('중앙폭 ∝ 2λ/a = '+width.toFixed(2), scrX+18, H*0.80); ctx.textAlign='center'; ctx.fillText('단일슬릿', slitX, H*0.80);
      E.tapHint(W/2, H*0.90, '틈이 좁을수록 회절이 넓게 퍼집니다(폭 ∝ λ/a)', true);
      E.big('단일슬릿 회절 — 중앙 밝은 무늬 폭 ∝ λ/a', '좁은 틈이 빛을 부채처럼 퍼뜨립니다.'); }
  },

  // ══════════ 3. 회절격자 — 수많은 틈이 만드는 날카로운 선 ══════════
  { id:'phys18_03',
    enter:function(E){ var self=this; this.s={dmm:1.8,lamNm:550};
      E.controls('<div class="ctrl"><label>격자 간격 d (μm)</label><input type="range" id="dd" min="1" max="4" step="0.2" value="1.8"><output id="ddo">1.8</output>'
        +'<label style="margin-left:14px">파장 λ (nm)</label><input type="range" id="ll" min="400" max="700" step="10" value="550"><output id="llo">550</output></div>');
      E.bind('#dd','input',function(e){ self.s.dmm=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.bind('#ll','input',function(e){ self.s.lamNm=+e.target.value; document.getElementById('llo').textContent=e.target.value; E.blip(300+self.s.lamNm*0.4,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var gx=W*0.16, scrX=W*0.86, cy=H*0.44, col=lamColor(s.lamNm);
      var d=s.dmm*1000, lam=s.lamNm;   // nm 단위. 격자식 sinθ_m = mλ/d (골든룰)
      // 격자(많은 슬릿)
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; for(var g=-50;g<=50;g+=7){ ctx.beginPath(); ctx.moveTo(gx,cy+g); ctx.lineTo(gx,cy+g+4); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('회절격자', gx, cy+76);
      // 입사광
      arrow(E,W*0.06,cy,gx,cy,col,2.2);
      // 스크린
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(scrX,H*0.14); ctx.lineTo(scrX,H*0.76); ctx.stroke();
      var Lg=scrX-gx, info='';
      for(var m=-3;m<=3;m++){ var sinT=m*lam/d; if(Math.abs(sinT)>1) continue; var theta=Math.asin(sinT), yy=cy+Math.tan(theta)*Lg*0.6;
        if(yy<H*0.14||yy>H*0.76) continue;   // 스크린 벗어나는 차수는 표시 안 함(실제로도 스크린을 빗나감)
        // 차수 m 선(날카로운 밝은 선)
        ctx.strokeStyle=col; ctx.lineWidth=m===0?3:2.4; ctx.globalAlpha=m===0?1:0.85; ctx.beginPath(); ctx.moveTo(gx,cy); ctx.lineTo(scrX,yy); ctx.stroke(); ctx.globalAlpha=1;
        ctx.fillStyle=col; ctx.fillRect(scrX+2,yy-2,16,4);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('m='+m+(m!==0?' ('+(theta*180/Math.PI).toFixed(0)+'°)':''), scrX+22, yy+3);
        if(m===1) info=(theta*180/Math.PI).toFixed(1);
      }
      ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('d sinθ = mλ   →   1차 θ = '+info+'°', W/2, H*0.86);
      E.tapHint(W/2, H*0.93, '격자가 촘촘할수록·파장이 길수록 무늬가 크게 벌어집니다', true);
      E.big('회절격자 — d sinθ = mλ (날카로운 색선)', '수천 개의 틈이 색을 정밀하게 가릅니다.'); }
  },

  // ══════════ 4. 박막 간섭 — 비눗방울·기름막의 색 ══════════
  { id:'phys18_04',
    enter:function(E){ var self=this; this.s={t:300,n:1.33};
      E.controls('<div class="ctrl"><label>막 두께 t (nm)</label><input type="range" id="tt" min="100" max="700" step="10" value="300"><output id="tto">300</output>'
        +'<label style="margin-left:14px">막 굴절률 n</label><input type="range" id="nn" min="1.2" max="1.6" step="0.05" value="1.33"><output id="nno">1.33</output></div>');
      E.bind('#tt','input',function(e){ self.s.t=+e.target.value; document.getElementById('tto').textContent=e.target.value; E.blip(300+self.s.t*0.3,0.06); });
      E.bind('#nn','input',function(e){ self.s.n=+e.target.value; document.getElementById('nno').textContent=(+e.target.value).toFixed(2); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 보강 반사 조건(윗면 위상반전): 2 n t = (m+½)λ → λ = 2nt/(m+½). 가시광서 가장 밝은 λ 찾기 (골든룰)
      var bestLam=0, bestM=0;
      for(var m=0;m<5;m++){ var lam=2*s.n*s.t/(m+0.5); if(lam>=400&&lam<=700){ bestLam=lam; bestM=m; break; } }
      var col = bestLam>0 ? lamColor(bestLam) : '#555';
      // 막 단면
      var fx=W*0.20, fw=W*0.42, fyT=H*0.40, fh=Math.max(10,s.t*0.10);
      ctx.fillStyle='rgba(150,200,255,0.12)'; ctx.fillRect(fx,fyT,fw,fh);
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.strokeRect(fx,fyT,fw,fh);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('t='+s.t+'nm', fx-8, fyT+fh/2); ctx.textAlign='left'; ctx.fillText('비눗막 n='+s.n.toFixed(2), fx+fw+8, fyT+fh/2);
      // 입사광 + 두 반사(윗면·아랫면)
      var ix=fx+fw*0.4; arrow(E,ix-70,fyT-60,ix,fyT,'#ffffff',2.2);
      arrow(E,ix,fyT,ix+60,fyT-52,col,2.4);   // 윗면 반사
      arrow(E,ix,fyT,ix+18,fyT+fh,'rgba(255,255,255,0.4)',1.4); arrow(E,ix+18,fyT+fh,ix+78,fyT-44,col,2.0);   // 아랫면 반사
      // 결과 색
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('경로차 2nt = '+(2*s.n*s.t).toFixed(0)+' nm', W/2, H*0.66);
      if(bestLam>0){ ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.fillText('보강 → λ ≈ '+bestLam.toFixed(0)+' nm 반사 (이 색이 보임)', W/2, H*0.73);
        // 색 견본
        ctx.fillStyle=col; ctx.fillRect(W/2-40,H*0.76,80,20); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.strokeRect(W/2-40,H*0.76,80,20);
      } else { ctx.fillStyle=DIM; ctx.fillText('이 두께에선 가시광 보강 없음(어둡거나 다른 차수)', W/2, H*0.73); }
      E.tapHint(W/2, H*0.93, '막 두께를 바꾸면 보강되는 색(보이는 색)이 달라집니다', true);
      E.big('박막 간섭 — 비눗방울이 무지개빛인 이유 (2nt 조건)', '얇은 막의 위·아래 반사가 겹쳐 색을 고릅니다.'); }
  },

  // ══════════ 5. 분해능 — 얼마나 가까운 둘까지 구별하나 (레일리) ══════════
  { id:'phys18_05',
    enter:function(E){ var self=this; this.s={sep:1.6,D:3};
      E.controls('<div class="ctrl"><label>두 별 사이 각 (상대)</label><input type="range" id="ss" min="0.4" max="3" step="0.1" value="1.6"><output id="sso">1.6</output>'
        +'<label style="margin-left:14px">렌즈 지름 D</label><input type="range" id="dd" min="1.5" max="5" step="0.5" value="3"><output id="ddo">3.0</output></div>');
      E.bind('#ss','input',function(e){ self.s.sep=+e.target.value; document.getElementById('sso').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.bind('#dd','input',function(e){ self.s.D=+e.target.value; document.getElementById('ddo').textContent=(+e.target.value).toFixed(1); E.blip(380,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, lam=1;
      // 회절한계 θmin = 1.22 λ/D. 두 별 각 sep와 비교 (골든룰)
      var thMin=1.22*lam/s.D, sep=s.sep, resolved=sep>=thMin;
      var cy=H*0.44, cx=W*0.46, wDisk=140/s.D;   // 에어리 원반 폭 ∝ 1/D
      var y1=cy-sep*40, y2=cy+sep*40;
      // 두 별의 에어리 패턴(가우시안 근사로 표현, 폭=wDisk)
      function airy(yc){ ctx.save(); var g=ctx.createRadialGradient(cx,yc,1,cx,yc,wDisk); g.addColorStop(0,'rgba(255,240,200,0.95)'); g.addColorStop(0.5,'rgba(255,220,150,0.4)'); g.addColorStop(1,'rgba(255,220,150,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,yc,wDisk,0,7); ctx.fill(); ctx.restore(); }
      airy(y1); airy(y2);
      // 합쳐진 세로 세기 프로파일(오른쪽)
      var gx=W*0.66, gw=W*0.26; ctx.strokeStyle='rgba(255,224,150,0.9)'; ctx.lineWidth=2; ctx.beginPath();
      for(var yy=cy-120; yy<=cy+120; yy+=2){ var i1=Math.exp(-Math.pow((yy-y1)/(wDisk*0.6),2)), i2=Math.exp(-Math.pow((yy-y2)/(wDisk*0.6),2)); var I=i1+i2; var xx=gx+I/2*gw; if(yy===cy-120)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); } ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,cy-120); ctx.lineTo(gx,cy+120); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('합친 밝기', gx, cy-128);
      // 판정
      ctx.fillStyle=resolved?GRN:'#ff7a7a'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(resolved?'✓ 둘로 구별됨 (각 ≥ θmin)':'✗ 하나로 뭉개짐 (각 < θmin)', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('회절한계 θmin = 1.22 λ/D = '+thMin.toFixed(2)+' (지름 클수록 더 잘 분해)', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '렌즈 지름을 키우면 더 가까운 둘도 구별됩니다(큰 망원경의 이유)', true);
      E.big('분해능 — 레일리 기준 θmin = 1.22 λ/D', '회절이 망원경·눈의 한계를 정합니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
