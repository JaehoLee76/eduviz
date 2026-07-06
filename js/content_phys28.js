/* 물리학 「일반상대성과 우주론」 — 중력은 휘어진 시공간. 블랙홀·중력파·빅뱅으로 우주 전체를 본다(대미).
   등가원리·휘어진 시공간·블랙홀·중력파·우주 팽창(허블). 특수상대성(앞)의 시공간을 중력·우주로 확장.
   골든룰: 탈출속도 √(2GM/r)·사건지평선 r_s=2GM/c²·허블 v=H₀d 모두 식에서 실시간 계산.
   동작=이 파일, 텍스트=content/phys28.json. 휘어진 시공간은 phys21에서 옮김. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3';
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(Math.hypot(x2-x1,y2-y1)<3) return; var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-8*Math.cos(a-0.45),y2-8*Math.sin(a-0.45)); ctx.lineTo(x2-8*Math.cos(a+0.45),y2-8*Math.sin(a+0.45)); ctx.fill(); }
  // 3D 투영(x,y=공전평면, z=시간축). yaw:x-z평면 회전, pitch:y축 기울이기.
  // yaw=0,pitch=0 → x-y 평면이 그대로 정면(원운동=완벽한 원, "시간축에서 보기").
  // yaw=PI/2,pitch=0 → z(시간)가 가로축, y가 세로축("측면=파형").
  function proj3(p, yaw, pitch, cx, cy, scale){
    var x=p[0], y=p[1], z=p[2];
    var cyw=Math.cos(yaw), syw=Math.sin(yaw);
    var x1 = x*cyw - z*syw, z1 = x*syw + z*cyw;
    var cp=Math.cos(pitch), sp=Math.sin(pitch);
    var y2 = y*cp - z1*sp;
    return [cx + x1*scale, cy - y2*scale];
  }

  var scenes=[

  // ══════════ 1. 등가원리 — 중력과 가속은 구별할 수 없다 ══════════
  { id:'phys28_01',
    enter:function(E){ var self=this; this.s={a:9.8,t:0};
      E.controls('<div class="ctrl"><label>로켓 가속도 a (m/s²)</label><input type="range" id="aa" min="0" max="20" step="0.2" value="9.8"><output id="aao">9.8</output></div>');
      E.bind('#aa','input',function(e){ self.s.a=+e.target.value; document.getElementById('aao').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.a*15,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, g=9.8; if(!E.frozen)s.t+=1/60;
      var same=Math.abs(s.a-g)<0.3;
      // 왼쪽: 우주의 가속 로켓 / 오른쪽: 지구 위 정지 방
      function room(cx,label,acc,isRocket){ var rw=W*0.16, rh=H*0.34, ry=H*0.24;
        ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.strokeRect(cx-rw/2,ry,rw,rh);
        // 떨어지는 공(같은 가속이면 같은 운동)
        var fall=((s.t*1.0)%1), by=ry+20+fall*fall*(rh-50)*(acc/9.8);
        ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,by,8,0,7); ctx.fill();
        // 사람(바닥에 서서 무게 느낌)
        ctx.fillStyle=GRN; ctx.fillRect(cx-5,ry+rh-26,10,22);
        // 가속/중력 화살표
        arrow(E,cx+rw/2+12,ry+rh*0.5,cx+rw/2+12,ry+rh*0.5+acc*2.5,PNK,2);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, cx, ry-10);
        ctx.fillStyle=PNK; ctx.font='11px sans-serif'; ctx.fillText((isRocket?'가속 a=':'중력 g=')+acc.toFixed(1), cx+rw/2+30, ry+rh*0.5);
        if(isRocket){ for(var f=0;f<3;f++){ ctx.fillStyle='rgba(255,140,90,0.6)'; ctx.beginPath(); ctx.moveTo(cx-10+f*10,ry+rh); ctx.lineTo(cx-6+f*10,ry+rh+18); ctx.lineTo(cx-2+f*10,ry+rh); ctx.fill(); } }
      }
      room(W*0.28,'우주의 로켓 (가속 a)',s.a,true);
      room(W*0.66,'지구 위 방 (중력 g)',g,false);
      ctx.fillStyle=same?GRN:'#dfeefb'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(same?'★ a = g → 안에서는 둘을 전혀 구별할 수 없다 (등가원리)':'가속 a='+s.a.toFixed(1)+' vs 중력 g=9.8 — a를 g에 맞춰 보세요', W/2, H*0.70);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('"중력과 가속은 같다" — 아인슈타인의 가장 행복한 생각, 일반상대성의 출발점', W/2, H*0.78);
      E.tapHint(W/2, H*0.92, '로켓 가속을 9.8로 맞추면 지구 중력과 똑같아집니다', true);
      E.big('등가원리 — 중력 = 가속 (구별 불가)', '창문 없는 방에선 중력과 가속을 못 가립니다.'); }
  },

  // ══════════ 2. 휘어진 시공간 — 중력의 정체 ══════════
  { id:'phys28_02',
    enter:function(E){ var self=this; this.s={M:1.2};
      E.controls('<div class="ctrl"><label>질량 M (시공간 굴곡)</label><input type="range" id="mm" min="0" max="2.5" step="0.1" value="1.2"><output id="mmo">1.2</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.M*100,0.07); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, fr=E.frame;
      var cx=W*0.40, cy=H*0.44, gw=Math.min(W*0.30,H*0.42), warp=s.M;
      function dip(dx,dy){ var rr=(dx*dx+dy*dy)/(gw*gw*0.08); return warp*(gw*0.6)/(1+rr); }
      function P(u,v){ var bx=u*gw,by=v*gw*0.5,d=dip(bx,by),r=Math.hypot(bx,by)||1,pull=d*0.34; return [cx+bx-(bx/r)*pull, cy+by+d]; }
      var N=13;
      for(var iy=0;iy<=N;iy++){ var v=iy/N*2-1; ctx.strokeStyle='rgba(95,214,168,'+(0.09+0.15*(1-Math.abs(v))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(var ix=0;ix<=N;ix++){ var p=P(ix/N*2-1,v); if(ix===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
      for(ix=0;ix<=N;ix++){ var u=ix/N*2-1; ctx.strokeStyle='rgba(122,184,255,'+(0.07+0.12*(1-Math.abs(u))).toFixed(3)+')'; ctx.lineWidth=1; ctx.beginPath(); for(iy=0;iy<=N;iy++){ var p2=P(u,iy/N*2-1); if(iy===0)ctx.moveTo(p2[0],p2[1]); else ctx.lineTo(p2[0],p2[1]); } ctx.stroke(); }
      var my=cy+dip(0,0); var grd=ctx.createRadialGradient(cx,my,2,cx,my,18+warp*12); grd.addColorStop(0,'rgba(255,244,210,0.95)'); grd.addColorStop(1,'rgba(255,178,90,0)'); ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,my,18+warp*12,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,my,3+warp*4,0,7); ctx.fill();
      var beamY=cy-gw*0.42, bx0=cx-gw*1.3; ctx.strokeStyle='#ffe06a'; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=80;k++){ var X=bx0+k/80*(gw*2.6), rel=(X-cx); var Y=beamY + warp*(gw*0.5)*Math.exp(-(rel*rel)/(gw*gw*0.5)); if(k===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke();
      ctx.fillStyle='#ffe06a'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('별빛(휘어짐)', bx0, beamY-6);
      function clock(px,py,rate,lab){ ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,12,0,7); ctx.stroke(); var a=-Math.PI/2 + (fr*0.04*rate)%(2*Math.PI); ctx.strokeStyle=ORA; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+9*Math.cos(a),py+9*Math.sin(a)); ctx.stroke(); ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,px,py+26); }
      var rateNear=1/Math.sqrt(1+warp*0.8);
      clock(cx+gw*0.35, cy+gw*0.34, rateNear, '질량 근처(느림)');
      clock(W*0.88, H*0.30, 1, '먼 곳(빠름)');
      E.tapHint(W/2, H*0.93, '질량을 키우면 시공간이 더 휘고 빛도 더 꺾입니다(중력렌즈)', true);
      E.big('일반상대성 — 중력은 휘어진 시공간이다', '질량이 시공간을 휘게 하고, 만물은 그 길을 따릅니다.'); }
  },

  // ══════════ 3. 블랙홀 — 빛조차 못 나오는 곳 ══════════
  { id:'phys28_03',
    enter:function(E){ var self=this; this.s={M:3};
      E.controls('<div class="ctrl"><label>질량 M (압축 정도)</label><input type="range" id="mm" min="1" max="12" step="0.5" value="3"><output id="mmo">3.0</output></div>');
      E.bind('#mm','input',function(e){ self.s.M=+e.target.value; document.getElementById('mmo').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.M*40,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, c=10, R=2;
      var vesc=Math.sqrt(2*s.M/R)*4.1;   // 탈출속도 √(2GM/R) (상대). M≈6서 c=10 넘어 블랙홀 (골든룰)
      var isBH=vesc>=c;   // 사건지평선 r_s=2GM/c²(텍스트 설명) · 블랙홀 판정
      var cx=W*0.34, cy=H*0.44, bodyR=Math.min(70,30+s.M*4);
      // 천체 또는 블랙홀
      if(isBH){ ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(cx,cy,bodyR,0,7); ctx.fill(); ctx.strokeStyle=ORA; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(cx,cy,bodyR,0,7); ctx.stroke();
        // 강착원반
        ctx.strokeStyle='rgba(255,178,122,0.5)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(cx,cy,bodyR+24,(bodyR+24)*0.3,0,0,7); ctx.stroke();
        ctx.fillStyle=ORA; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('사건지평선', cx, cy+bodyR+18);
      } else { var g=ctx.createRadialGradient(cx,cy,4,cx,cy,bodyR); g.addColorStop(0,'#ffe6a0'); g.addColorStop(1,'rgba(255,150,60,0.3)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,bodyR,0,7); ctx.fill(); ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('천체', cx, cy+bodyR+18); }
      // 탈출 시도하는 빛/물체
      var canEscape=!isBH;
      ctx.strokeStyle=canEscape?GRN:'#ff6a6a'; ctx.lineWidth=2;
      for(var a=0;a<6;a++){ var th=a/6*6.2832, len=canEscape?70:30; arrow(E,cx+Math.cos(th)*bodyR,cy+Math.sin(th)*bodyR,cx+Math.cos(th)*(bodyR+len),cy+Math.sin(th)*(bodyR+len),canEscape?GRN:'#ff6a6a',2); }
      // 수치
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('탈출속도 v_esc = √(2GM/R) = '+vesc.toFixed(1), W*0.56, H*0.36);
      ctx.fillStyle=isBH?'#ff6a6a':GRN; ctx.fillText('빛의 속력 c = '+c, W*0.56, H*0.44);
      ctx.fillStyle=isBH?'#ff6a6a':GRN; ctx.font='600 15px sans-serif'; ctx.fillText(isBH?'v_esc ≥ c → 빛도 못 나옴 = 블랙홀!':'v_esc < c → 빛은 탈출 가능', W*0.56, H*0.54);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('사건지평선 r_s = 2GM/c² (이 안은 우주와 단절)', W*0.56, H*0.62);
      E.tapHint(W/2, H*0.92, '질량을 충분히 압축하면 탈출속도가 c를 넘어 블랙홀이 됩니다', true);
      E.big(isBH?'블랙홀 — 탈출속도 > 빛의 속력':'천체 — 탈출속도 < 빛', '충분히 압축하면 빛조차 가둡니다.'); }
  },

  // ══════════ 4. 중력파 — 시공간의 출렁임 (3D 나선: x-y=공전, z=시간) ══════════
  { id:'phys28_04',
    enter:function(E){ var self=this; this.s={t:0, yaw:0.55, pitch:0.32, hist:[]};
      E.controls('<div class="ctrl"><div style="display:flex;gap:6px;flex-wrap:wrap">'
        +'<button id="vpSpiral" style="background:transparent;border:1px solid #7ab8ff;color:#7ab8ff;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer">사선=나선(기본)</button>'
        +'<button id="vpTime" style="background:transparent;border:1px solid #7ab8ff;color:#7ab8ff;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer">시간축에서 보기</button>'
        +'<button id="vpSide" style="background:transparent;border:1px solid #7ab8ff;color:#7ab8ff;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer">측면(파형)</button>'
        +'</div></div>');
      E.bind('#vpSpiral','click',function(){ self.s.yaw=0.55; self.s.pitch=0.32; });
      E.bind('#vpTime','click',function(){ self.s.yaw=0; self.s.pitch=0; });
      E.bind('#vpSide','click',function(){ self.s.yaw=Math.PI/2; self.s.pitch=0; });
      E.setOn([]); },
    down:function(E,cx,cy){ this.s.drag={x:cx,y:cy}; },
    move:function(E,cx,cy){ var s=this.s; if(!s.drag) return; var dx=cx-s.drag.x, dy=cy-s.drag.y;
      s.yaw += dx*0.01; s.pitch += dy*0.01;
      if(s.pitch>1.4) s.pitch=1.4; if(s.pitch<-1.4) s.pitch=-1.4;
      s.drag={x:cx,y:cy}; },
    up:function(E){ this.s.drag=null; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var cx=W*0.42, cy=H*0.40, cyc=(s.t*0.25)%1;   // 0→1 나선 안쪽으로
      var r=Math.max(8,(1-cyc)*W*0.13), om=2/Math.max(0.1,r)*40, ang=s.t*om;
      var scl=1, zscale=W*0.11;   // 시간축 화면 스케일
      // 두 천체의 3D 좌표: x=r cosθ, y=r sinθ, z=시간(상대). 화면좌표는 proj3 경유(골든룰: r/ang/cyc는 실계산, 좌표변환만 3D화)
      var zt = s.t*zscale;
      var P1=[r*Math.cos(ang), r*Math.sin(ang), zt], P2=[-r*Math.cos(ang), -r*Math.sin(ang), zt];
      // 궤적 히스토리 누적(상대 z 계산용으로 절대 t를 같이 저장)
      if(!E.frozen){ s.hist.push({t:s.t, p1:P1, p2:P2}); if(s.hist.length>200) s.hist.shift(); }
      var yaw=s.yaw, pitch=s.pitch;
      function toScreen(p3){ var zrel = p3[2] - zt; return proj3([p3[0],p3[1],zrel], yaw, pitch, cx, cy, scl); }
      // 중력파 잔물결(공전평면 위 타원, x-y 평면 기준으로 그린 뒤 3D 투영은 생략하고 근사 타원 유지 — 배경 장식)
      for(var w=0;w<5;w++){ var rr=((s.t*1.2+w*0.5)%2.5); var amp=(1-cyc)*0.3+0.1; ctx.strokeStyle='rgba(122,184,255,'+(amp*(0.6-rr*0.2))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cx,cy,40+rr*W*0.16,(40+rr*W*0.16)*0.6,0,0,7); ctx.stroke(); }
      // 궤적(나선) — 오래된 점일수록 흐리게, 두 천체 각각 색
      for(var hi=1; hi<s.hist.length; hi++){
        var h0=s.hist[hi-1], h1=s.hist[hi];
        var age = hi/s.hist.length;   // 0(오래됨)→1(최근)
        var a1=toScreen([h0.p1[0],h0.p1[1], h0.t*zscale]), b1=toScreen([h1.p1[0],h1.p1[1], h1.t*zscale]);
        var a2=toScreen([h0.p2[0],h0.p2[1], h0.t*zscale]), b2=toScreen([h1.p2[0],h1.p2[1], h1.t*zscale]);
        ctx.strokeStyle='rgba(255,178,122,'+(age*0.55)+')'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(b1[0],b1[1]); ctx.stroke();
        ctx.strokeStyle='rgba(122,184,255,'+(age*0.55)+')'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(a2[0],a2[1]); ctx.lineTo(b2[0],b2[1]); ctx.stroke();
      }
      // 두 천체(현재 위치, z상대=0)
      var s1=toScreen([P1[0],P1[1],zt]), s2=toScreen([P2[0],P2[1],zt]);
      ctx.fillStyle='#000'; ctx.strokeStyle=ORA; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(s1[0],s1[1],9,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#000'; ctx.strokeStyle=BLU; ctx.beginPath(); ctx.arc(s2[0],s2[1],9,0,7); ctx.fill(); ctx.stroke();
      // 축 라벨(x,y,t) — proj3로 투영, 학습자가 z=시간축임을 알 수 있게
      var axLen=W*0.10;
      var ox=toScreen([0,0,zt]);
      var ax=toScreen([axLen,0,zt]), ay=toScreen([0,axLen,zt]), at=toScreen([0,0,zt-axLen]);
      arrow(E,ox[0],ox[1],ax[0],ax[1],'rgba(223,238,251,0.55)',1.3);
      arrow(E,ox[0],ox[1],ay[0],ay[1],'rgba(223,238,251,0.55)',1.3);
      arrow(E,ox[0],ox[1],at[0],at[1],'rgba(255,214,122,0.75)',1.6);
      ctx.font='11px sans-serif'; ctx.fillStyle='rgba(223,238,251,0.7)'; ctx.textAlign='center';
      ctx.fillText('x', ax[0], ax[1]-4); ctx.fillText('y', ay[0], ay[1]-4);
      ctx.fillStyle='#ffd67a'; ctx.fillText('t(시간)', at[0], at[1]-4);
      // 병합 섬광
      if(cyc>0.92){ var g=ctx.createRadialGradient(s1[0],s1[1],2,s1[0],s1[1],60); g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(122,184,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s1[0],s1[1],60,0,7); ctx.fill(); }
      // 처프 파형(주파수 상승)
      var gx0=W*0.10, gx1=W*0.92, gy=H*0.80;
      ctx.strokeStyle=GRN; ctx.lineWidth=1.8; ctx.beginPath();
      for(var x=gx0;x<=gx1;x+=2){ var p=(x-gx0)/(gx1-gx0), freq=2+p*p*30, amp2=(8+p*p*40); var y=gy-Math.sin(p*freq*3)*amp2*(p*0.8+0.2); if(x===gx0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('처프: 두 블랙홀이 나선으로 합쳐지며 주파수·진폭 상승 → 병합', W/2, H*0.90);
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.fillText('가속하는 질량이 시공간에 잔물결을 — 중력파 (LIGO 2015년 직접 관측)', W/2, H*0.71);
      E.tapHint(W/2, H*0.965, '드래그 = 회전 · 버튼 = 각도 바로가기(원운동+시간=나선)', false);
      E.big('중력파 — 시공간의 잔물결 (LIGO 2015)', '질량이 출렁이면 시공간도 출렁입니다.'); }
  },

  // ══════════ 5. 빅뱅과 우주 팽창 — 허블 법칙 ══════════
  { id:'phys28_05',
    enter:function(E){ var self=this; this.s={scale:1.5};
      E.controls('<div class="ctrl"><label>우주 나이(팽창 척도)</label><input type="range" id="ss" min="1" max="4" step="0.1" value="1.5"><output id="sso">1.5</output></div>');
      E.bind('#ss','input',function(e){ self.s.scale=+e.target.value; document.getElementById('sso').textContent=(+e.target.value).toFixed(1); E.blip(300+self.s.scale*60,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, H0=1;
      // 우리 은하 기준, 다른 은하들이 거리 d에 비례한 속도 v=H₀d로 멀어짐(허블) (골든룰)
      var cx=W*0.5, cy=H*0.42, a=s.scale;
      var gals=[[-3,-1],[-2,1.2],[-1,-1.8],[1,1.5],[2,-1],[3,1],[-1.5,0.5],[2.5,0.3]];
      // 우리 은하(중심)
      ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(cx,cy,7,0,7); ctx.fill(); ctx.fillStyle=ORA; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('우리 은하', cx, cy+20);
      gals.forEach(function(G){ var d0=Math.hypot(G[0],G[1]); var x=cx+G[0]*a*W*0.045, y=cy+G[1]*a*H*0.07;
        var d=d0*a, v=H0*d;   // 허블 법칙 v=H₀d
        ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(x,y,5,0,7); ctx.fill();
        // 후퇴 속도 화살표(중심에서 바깥, 길이 ∝ v=H₀d)
        var ux=(x-cx)/(Math.hypot(x-cx,y-cy)||1), uy=(y-cy)/(Math.hypot(x-cx,y-cy)||1);
        arrow(E,x,y,x+ux*v*8,y+uy*v*8,'rgba(122,184,255,0.7)',1.6);
      });
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('허블 법칙 v = H₀·d — 먼 은하일수록 더 빨리 멀어진다(긴 화살표)', W/2, H*0.80);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('우주 자체가 팽창 중(은하가 공간 속을 나는 게 아니라 공간이 늘어남). 거꾸로 감으면 한 점 = 빅뱅', W/2, H*0.87);
      E.tapHint(W/2, H*0.93, '시간을 키우면 모든 은하가 멀어지고, 먼 것일수록 빠릅니다(팽창)', true);
      E.big('빅뱅과 우주 팽창 — 허블 법칙 v = H₀·d', '우주는 팽창하고 있고, 시작이 있었습니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
