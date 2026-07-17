/* 물리학 「원자와 핵」 — 원자 한가운데, 어마어마한 에너지가 잠든 곳.
   핵의 구성·결합에너지·방사성 붕괴·핵분열·핵융합. 별과 원자폭탄과 원자력의 바탕.
   골든룰: 질량수 A=Z+N, 결합에너지 곡선(실측 데이터), 반감기 N=N₀(½)^(t/T), 연쇄반응 2ⁿ, E=Δmc²로 실시간 계산.
   동작=이 파일, 텍스트=content/phys20.json. 방사성 붕괴는 phys14에서 옮김. */
(function(){
  var GRN='#5fd6a8', BLU='#7ab8ff', ORA='#ffb27a', PNK='#f4a0c0', DIM='#9b99a3', NRED='#ff7a6b';
  var PROT='#ff7a6b', NEUT='#9aa4b2';   // 양성자 붉음, 중성자 회색
  function arrow(E,x1,y1,x2,y2,col,lw){ var ctx=E.ctx; ctx.strokeStyle=col; ctx.lineWidth=lw||2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4)); ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.fill(); }
  var ELEM=['중성자','수소 H','헬륨 He','리튬 Li','베릴륨 Be','붕소 B','탄소 C','질소 N','산소 O','플루오린 F','네온 Ne'];

  var scenes=[

  // ══════════ 1. 핵의 구성 — 양성자·중성자, A = Z + N ══════════
  { id:'phys20_01',
    enter:function(E){ var self=this; this.s={Z:6,N:6};
      E.controls('<div class="ctrl"><label>양성자 Z (원소 결정)</label><input type="range" id="zz" min="1" max="10" step="1" value="6"><output id="zzo">6</output>'
        +'<label style="margin-left:14px">중성자 N</label><input type="range" id="nn" min="0" max="12" step="1" value="6"><output id="nno">6</output></div>');
      E.bind('#zz','input',function(e){ self.s.Z=+e.target.value; document.getElementById('zzo').textContent=e.target.value; E.blip(300+self.s.Z*30,0.06); });
      E.bind('#nn','input',function(e){ self.s.N=+e.target.value; document.getElementById('nno').textContent=e.target.value; E.blip(280,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, A=s.Z+s.N;   // 질량수 A=Z+N (골든룰)
      var cx=W*0.36, cy=H*0.44, total=A, R=Math.min(W*0.14,H*0.20)*Math.sqrt(total/12);
      // 핵자 배치(나선형, 결정적)
      for(var i=0;i<total;i++){ var ang=i*2.399, rad=R*Math.sqrt((i+0.5)/total); var x=cx+rad*Math.cos(ang), y=cy+rad*Math.sin(ang);
        ctx.fillStyle = i<s.Z?PROT:NEUT; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); }
      // 전자(궤도) 암시
      ctx.strokeStyle='rgba(122,184,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R+30,0,7); ctx.stroke();
      // 수치
      ctx.fillStyle=PROT; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 양성자 Z = '+s.Z+' (원소를 결정)', W*0.62, H*0.34);
      ctx.fillStyle=NEUT; ctx.fillText('● 중성자 N = '+s.N, W*0.62, H*0.42);
      ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.fillText('질량수 A = Z + N = '+A, W*0.62, H*0.52);
      ctx.fillStyle=ORA; ctx.font='600 18px sans-serif'; ctx.fillText('원소: '+(ELEM[s.Z]||'?')+' -'+A, W*0.62, H*0.62);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('Z가 같고 N만 다르면 = 동위원소', W*0.62, H*0.70);
      E.tapHint(W/2, H*0.92, '양성자 수가 원소를 정합니다. 중성자만 바꾸면 동위원소', true);
      E.big('핵의 구성 — A = Z + N  ('+(ELEM[s.Z]||'?')+'-'+A+')', '원자 질량의 거의 전부가 핵에.'); }
  },

  // ══════════ 2. 핵력과 결합에너지 — 철에서 가장 안정 ══════════
  { id:'phys20_02',
    enter:function(E){ var self=this; this.s={A:56};
      E.controls('<div class="ctrl"><label>질량수 A</label><input type="range" id="aa" min="2" max="238" step="2" value="56"><output id="aao">56</output></div>');
      E.bind('#aa','input',function(e){ self.s.A=+e.target.value; document.getElementById('aao').textContent=e.target.value; E.blip(200+self.s.A*1.5,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 결합에너지/핵자 곡선(실측 근사 데이터, MeV/핵자) — 철(A~56)서 최대 ~8.8
      var data=[[2,1.1],[4,7.1],[6,5.3],[12,7.7],[16,8.0],[20,8.0],[40,8.6],[56,8.8],[80,8.7],[100,8.5],[140,8.3],[180,8.0],[200,7.9],[238,7.6]];
      function ba(A){ for(var i=0;i<data.length-1;i++){ if(A<=data[i+1][0]){ var t=(A-data[i][0])/(data[i+1][0]-data[i][0]); return data[i][1]+t*(data[i+1][1]-data[i][1]); } } return data[data.length-1][1]; }
      var gx0=W*0.12, gx1=W*0.92, gy0=H*0.76, gh=H*0.54;
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('결합E/핵자 (MeV)', gx0+4,gy0-gh+2); ctx.textAlign='right'; ctx.fillText('질량수 A →', gx1, gy0+16);
      // 곡선
      ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath();
      for(var A2=2;A2<=238;A2+=2){ var v=ba(A2), x=gx0+(A2/238)*(gx1-gx0), y=gy0-(v/9)*gh; if(A2===2)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      // 철 peak 표시
      var fx=gx0+(56/238)*(gx1-gx0), fy=gy0-(8.8/9)*gh; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(fx,fy,4,0,7); ctx.fill(); ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('철 Fe-56 (가장 안정)', fx, fy-10);
      // 융합/분열 방향 화살표
      ctx.fillStyle='rgba(122,184,255,0.8)'; ctx.font='13px sans-serif'; ctx.fillText('← 핵융합(가벼운 핵 합침)', gx0+W*0.13, gy0-gh*0.3); ctx.fillText('핵분열(무거운 핵 쪼갬) →', gx1-W*0.14, gy0-gh*0.2);
      // 현재 A
      var mx=gx0+(s.A/238)*(gx1-gx0), my=gy0-(ba(s.A)/9)*gh; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(mx,gy0); ctx.lineTo(mx,my); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('A='+s.A+' → 결합E/핵자 ≈ '+ba(s.A).toFixed(1)+' MeV', W/2, H*0.86);
      E.tapHint(W/2, H*0.93, '철보다 가벼우면 융합, 무거우면 분열이 에너지를 냅니다', true);
      E.big('핵 결합에너지 — 철(Fe-56)에서 최대', '두 방향 모두 철로 가면 에너지가 나옵니다.'); }
  },

  // ══════════ 3. 방사성 붕괴 — 반감기 ══════════
  { id:'phys20_03',
    enter:function(E){ var self=this; this.s={half:3,t:0};
      E.controls('<div class="ctrl"><label>반감기 T½ (초)</label><input type="range" id="hh" min="1" max="6" step="0.5" value="3"><output id="hho">3.0</output></div>');
      E.bind('#hh','input',function(e){ self.s.half=+e.target.value; self.s.t=0; document.getElementById('hho').textContent=(+e.target.value).toFixed(1); E.blip(360,0.07); });
      E.setOn([]); },
    tap:function(E){ this.s.t=0; E.blip(360,0.12); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen){ s.t+=1/60; if(s.t>s.half*5) s.t=0; }
      var frac=Math.pow(0.5, s.t/s.half), N0=64, N=N0*frac;
      var ox=W*0.10, oy=H*0.22, cols2=8;
      for(var i=0;i<64;i++){ var r=Math.floor(i/cols2), c=i%cols2, x=ox+c*22, y=oy+r*22; var alive = i >= (64-Math.round(N));
        ctx.fillStyle=alive?GRN:'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); }
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('남은 핵 N = '+Math.round(N)+' / '+N0, ox, oy-12);
      var gx0=W*0.50, gx1=W*0.93, gy0=H*0.78, gh=H*0.5;
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx0,gy0); ctx.lineTo(gx1,gy0); ctx.moveTo(gx0,gy0); ctx.lineTo(gx0,gy0-gh); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('N',gx0+3,gy0-gh+4); ctx.fillText('t',gx1-8,gy0+14);
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      for(var k=0;k<=60;k++){ var tt=k/60*s.half*5, f2=Math.pow(0.5,tt/s.half), x=gx0+(tt/(s.half*5))*(gx1-gx0), y=gy0-f2*gh; if(k===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke();
      for(var hcnt=1;hcnt<=4;hcnt++){ var th=hcnt*s.half; if(th>s.half*5)break; var x=gx0+(th/(s.half*5))*(gx1-gx0), y=gy0-Math.pow(0.5,hcnt)*gh; ctx.strokeStyle='rgba(255,178,122,0.4)'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x,gy0); ctx.lineTo(x,y); ctx.lineTo(gx0,y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle='rgba(255,178,122,0.7)'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(hcnt+'T½', x, gy0+12); }
      var mx=gx0+(Math.min(s.t,s.half*5)/(s.half*5))*(gx1-gx0), my=gy0-frac*gh; ctx.fillStyle=ORA; ctx.beginPath(); ctx.arc(mx,my,5,0,7); ctx.fill();
      E.tapHint(W/2, H*0.92, '화면 탭=초기화 · 반감기마다 절반으로 줄어듦', true);
      E.big('방사성 붕괴 N = N₀·(½)^(t/T½) — 남은 핵 '+Math.round(N)+'/'+N0, '집단은 시계처럼 정확히 반으로 줄어듭니다.'); }
  },

  // ══════════ 4. 핵분열 — 쪼개지며 터지는 연쇄반응 ══════════
  { id:'phys20_04',
    enter:function(E){ var self=this; this.s={gen:3};
      E.controls('<div class="ctrl"><label>연쇄반응 세대 수</label><input type="range" id="gg" min="0" max="6" step="1" value="3"><output id="ggo">3</output></div>');
      E.bind('#gg','input',function(e){ self.s.gen=+e.target.value; document.getElementById('ggo').textContent=e.target.value; E.blip(300+self.s.gen*60,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      // 세대마다 분열 핵 2배(2ⁿ), 핵 1개 분열 ≈ 200 MeV (골든룰: 총E=핵수×200MeV)
      var gens=s.gen, totalFiss=Math.pow(2,gens+1)-1, lastGen=Math.pow(2,gens), energy=lastGen*200;
      var x0=W*0.12, dx=(W*0.62)/Math.max(1,gens+0.5), cy=H*0.44;
      // 세대별 핵 트리
      for(var g=0;g<=gens;g++){ var cnt=Math.pow(2,g), gx=x0+g*dx, sp=Math.min(H*0.5/cnt, 40);
        for(var i=0;i<cnt && i<16;i++){ var gy=cy+(i-(Math.min(cnt,16)-1)/2)*sp;
          ctx.fillStyle=NRED; ctx.beginPath(); ctx.arc(gx,gy,Math.max(4,9-g),0,7); ctx.fill();
          if(g<gens){ // 중성자가 다음 세대 둘로
            ctx.strokeStyle='rgba(143,227,181,0.4)'; ctx.lineWidth=1; for(var c=0;c<2;c++){ var ny=cy+((2*i+c)-(Math.min(2*cnt,16)-1)/2)*Math.min(H*0.5/(2*cnt),40); ctx.beginPath(); ctx.moveTo(gx+6,gy); ctx.lineTo(gx+dx-6,ny); ctx.stroke(); } } } }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('U-235 + 중성자 → 쪼개짐 + 중성자 2~3개 → 다음 핵...', W*0.40, H*0.82);
      ctx.fillStyle=ORA; ctx.font='600 15px sans-serif'; ctx.fillText('총 분열 '+totalFiss+'개 → 에너지 ≈ '+energy.toLocaleString()+' MeV  (E=Δmc²)', W/2, H*0.89);
      E.tapHint(W/2, H*0.94, '세대를 늘리면 분열이 2배씩 폭발적으로 늘어납니다(연쇄반응)', true);
      E.big('핵분열 — 무거운 핵이 쪼개지며 연쇄반응', '하나가 둘을, 둘이 넷을 터뜨립니다.'); }
  },

  // ══════════ 5. 핵융합 — 별이 빛나는 이유 ══════════
  { id:'phys20_05',
    enter:function(E){ var self=this; this.s={T:5,t:0};
      E.controls('<div class="ctrl"><label>온도 T (쿨롱 장벽 극복)</label><input type="range" id="tt" min="1" max="10" step="0.5" value="5"><output id="tto">5.0</output></div>');
      E.bind('#tt','input',function(e){ self.s.T=+e.target.value; document.getElementById('tto').textContent=(+e.target.value).toFixed(1); E.blip(200+self.s.T*70,0.06); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx; if(!E.frozen)s.t+=1/60;
      var fuse=s.T>=6, cy=H*0.44;   // 온도가 충분해야 양전하 반발(쿨롱 장벽) 넘어 융합
      // 두 수소핵이 접근
      var sep = fuse ? Math.max(14, 70-((s.t*40)%70)) : 70;
      var x1=W*0.40-sep, x2=W*0.40+sep;
      ctx.fillStyle=PROT; ctx.beginPath(); ctx.arc(x1,cy,11,0,7); ctx.fill(); ctx.arc(x2,cy,11,0,7); ctx.fill();
      ctx.fillStyle='#10141a'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('H',x1,cy+3); ctx.fillText('H',x2,cy+3);
      // 반발(쿨롱) 또는 융합
      if(!fuse){ arrow(E,x1-14,cy,x1-34,cy,'#ff7a7a',2); arrow(E,x2+14,cy,x2+34,cy,'#ff7a7a',2); ctx.fillStyle='#ff8a8a'; ctx.font='13px sans-serif'; ctx.fillText('서로 밀어냄 (쿨롱 장벽) — 온도 부족', W*0.40, cy+50); }
      else if(sep<=16){ // 융합 → 헬륨 + 에너지
        var g=ctx.createRadialGradient(W*0.40,cy,2,W*0.40,cy,40); g.addColorStop(0,'rgba(255,245,200,0.95)'); g.addColorStop(1,'rgba(255,200,90,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(W*0.40,cy,40,0,7); ctx.fill();
        ctx.fillStyle=ORA; ctx.font='600 14px sans-serif'; ctx.fillText('융합! → 헬륨 + 에너지', W*0.40, cy+56); }
      ctx.fillStyle='#dfeefb'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('가벼운 핵(수소)이 합쳐 무거운 핵(헬륨) → 질량 일부가 에너지로 (E=Δmc²)', W/2, H*0.74);
      ctx.fillStyle=fuse?GRN:'#ff8a8a'; ctx.font='600 14px sans-serif'; ctx.fillText(fuse?'✓ 융합 진행 (T 충분)':'✗ 온도 부족 — 핵이 못 붙음', W/2, H*0.82);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('태양은 1초에 6억 톤의 수소를 헬륨으로 — 그 에너지가 햇빛', W/2, H*0.88);
      E.tapHint(W/2, H*0.93, '온도를 충분히 올리면 두 핵이 반발을 이기고 융합합니다', true);
      E.big('핵융합 — 별이 빛나는 이유 (E=Δmc²)', '가벼운 핵이 합쳐 빛을 냅니다.'); }
  }

  ];
  if(window.Engine&&Engine.addScenes) Engine.addScenes(scenes);
})();
