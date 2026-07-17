/* 산업위생기술사 제4장 — 소음과 진동: 데시벨의 산수 (동작만. 텍스트=content/hyg4.json) */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', DIM='#9b99a3', TXT='#dfeefb';
  function lg(x){ return Math.log(x)/Math.LN10; }
  function TX(ctx,t,x,y,c,fs,al,wt){ ctx.save(); ctx.fillStyle=c||TXT; ctx.font=(wt||'500')+' '+(fs||13)+'px Pretendard,"Malgun Gothic",sans-serif'; ctx.textAlign=al||'left'; ctx.textBaseline='middle'; ctx.fillText(t,x,y); ctx.restore(); }
  function LN(ctx,x1,y1,x2,y2,c,w,dash){ ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=w||1.5; ctx.setLineDash(dash||[]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
  function BX(ctx,x,y,w,h,fill,alpha,stroke){ ctx.save(); ctx.globalAlpha=(alpha==null?1:alpha); ctx.fillStyle=fill; ctx.fillRect(x,y,w,h); if(stroke){ ctx.globalAlpha=1; ctx.strokeStyle=stroke; ctx.lineWidth=1.2; ctx.strokeRect(x,y,w,h); } ctx.restore(); }
  function DOT(ctx,x,y,r,c){ ctx.save(); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); ctx.restore(); }
  function fnum(v){ if(v>=1000) return Math.round(v).toLocaleString('en-US'); if(v>=100) return String(Math.round(v)); if(v>=10) return v.toFixed(1); return v.toFixed(2); }
  function sup(s){ var m={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','.':'·','-':'⁻'}; var r='',i; for(i=0;i<s.length;i++) r+=(m[s.charAt(i)]||s.charAt(i)); return r; }
  function pow10str(exp,val){ return (val>=10000) ? '10'+sup(exp.toFixed(1)) : fnum(val); }
  /* 허용노출시간(고용노동부): 90dB=8h, 5dB 교환율 */
  function permT(l){ return 8/Math.pow(2,(l-90)/5); }
  function tstr(t){ if(t>=1){ return (Math.abs(t-Math.round(t))<0.005? String(Math.round(t)) : t.toFixed(1))+'시간'; } return Math.round(t*60)+'분'; }
  var scenes=[
  { id:'hyg4_01',
    enter:function(E){ var self=this; this.s={ex:1.5};
      E.controls('<div class="ctrl"><label>음압 배율 P/P₀ = 10^x 의 지수 x</label><input type="range" id="h401x" min="0" max="6" step="0.05" value="1.5"><output id="h401xo">×31.6</output></div>');
      E.bind('#h401x','input',function(e){ self.s.ex=+e.target.value; var r=Math.pow(10,self.s.ex); document.getElementById('h401xo').textContent='×'+fnum(r); });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var ratio=Math.pow(10,s.ex), spl=20*lg(ratio), energy=ratio*ratio;
      var top=H*0.36, bot=H*0.88, ax=W*0.26, d, i, y;
      function Y(db){ return bot-(db/120)*(bot-top); }
      /* dB 사다리(로그 자) */
      TX(ctx,'소리 사다리 — dB 눈금 하나하나가 "배율 한 칸"',W*0.07,top-22,AMB,13,'left','700');
      LN(ctx,ax,top-8,ax,bot,DIM,1.5);
      for(d=0; d<=120; d+=20){ LN(ctx,ax-5,Y(d),ax+5,Y(d),DIM,1); TX(ctx,String(d),ax-12,Y(d),DIM,11,'right'); }
      var refs=[[0,'들릴락 말락 — 기준음압 P₀=20μPa'],[30,'속삭임'],[60,'일상 대화'],[90,'공장 소음 — 8시간 노출기준'],[110,'착암기']];
      for(i=0;i<refs.length;i++){ y=Y(refs[i][0]); DOT(ctx,ax,y,3.2,BLU); LN(ctx,ax+5,y,ax+16,y,BLU,1.2); TX(ctx,refs[i][1],ax+22,y,(refs[i][0]===90?GRN:TXT),12); }
      LN(ctx,ax-24,Y(115),ax+130,Y(115),RED,1.5,[5,4]); TX(ctx,'115dB(A) 상한 — 초과 금지',ax+138,Y(115),RED,11,'left','600');
      /* 현재 위치 마커 */
      var cy=Y(Math.min(spl,120));
      LN(ctx,ax-30,cy,ax+16,cy,ORA,2);
      DOT(ctx,ax,cy,6,ORA);
      TX(ctx,spl.toFixed(1)+' dB ▶',ax-40,cy,ORA,13,'right','700');
      /* 우측: 압력/에너지 로그 막대 */
      var px=W*0.62, pw=W*0.30, by=H*0.44, bh=20;
      var by2=by+bh+54;
      TX(ctx,'같은 소리, 두 가지 배율 (한 칸 = ×10)',px,by-26,AMB,13,'left','700');
      for(i=0;i<=12;i++){ var tx=px+(i/12)*pw; LN(ctx,tx,by-4,tx,by2+bh+4,DIM,(i%2===0?1:0.5),[2,3]); }
      TX(ctx,'압력 ×'+pow10str(s.ex,ratio),px,by-8,BLU,12,'left','700');
      BX(ctx,px,by,(s.ex/12)*pw,bh,BLU,0.85,BLU);
      TX(ctx,'→ 20 log = +'+spl.toFixed(1)+' dB',px,by+bh+16,BLU,12,'left','600');
      TX(ctx,'에너지 ×'+pow10str(2*s.ex,energy),px,by2-8,PNK,12,'left','700');
      BX(ctx,px,by2,(2*s.ex/12)*pw,bh,PNK,0.85,PNK);
      TX(ctx,'→ 10 log = +'+(10*lg(energy)).toFixed(1)+' dB',px,by2+bh+16,PNK,12,'left','600');
      TX(ctx,'에너지 = 압력² → 로그 칸 수가 2배, 그래서 계수가 20',px,by2+bh+42,DIM,12);
      TX(ctx,'압력 ×10 = +20dB · ×2 = +'+(20*lg(2)).toFixed(1)+'dB',px,by2+bh+64,TXT,12);
      TX(ctx,'에너지 ×10 = +10dB · ×2 = +'+(10*lg(2)).toFixed(1)+'dB',px,by2+bh+86,TXT,12);
      TX(ctx,'P₀ = 2×10⁻⁵ N/m² = 20μPa (1,000Hz 최소가청음압 실효치)',px,by2+bh+114,GRN,11.5);
      E.big('SPL = 20 log(P/P₀) = '+spl.toFixed(1)+' dB','압력 ×'+pow10str(s.ex,ratio)+' · 에너지 ×'+pow10str(2*s.ex,energy)+' — 귀는 배율을 로그로 셉니다'); } },
  { id:'hyg4_02',
    enter:function(E){ var self=this; this.s={l1:90,l2:90};
      E.controls('<div class="ctrl"><label>기계 1 소음 L₁ (dB)</label><input type="range" id="h402a" min="60" max="110" step="1" value="90"><output id="h402ao">90 dB</output></div>'
        +'<div class="ctrl"><label>기계 2 소음 L₂ (dB)</label><input type="range" id="h402b" min="60" max="110" step="1" value="90"><output id="h402bo">90 dB</output></div>');
      E.bind('#h402a','input',function(e){ self.s.l1=+e.target.value; document.getElementById('h402ao').textContent=e.target.value+' dB'; });
      E.bind('#h402b','input',function(e){ self.s.l2=+e.target.value; document.getElementById('h402bo').textContent=e.target.value+' dB'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var e1=Math.pow(10,s.l1/10), e2=Math.pow(10,s.l2/10), es=e1+e2;
      var ls=10*lg(es), mx=Math.max(s.l1,s.l2), inc=ls-mx, diff=Math.abs(s.l1-s.l2);
      var bot=H*0.84, hmax=H*0.42, bw=Math.max(56,W*0.075);
      var x1=W*0.14, x2=x1+bw+W*0.055, x3=x2+bw+W*0.09;
      var h1=Math.max(2,(e1/es)*hmax), h2=Math.max(2,(e2/es)*hmax);
      TX(ctx,'dB는 그대로 못 더합니다 — 에너지(10^(L/10))로 바꿔 더한 뒤 다시 로그',W*0.07,H*0.33,AMB,13,'left','700');
      /* 기계 1, 2 에너지 막대 */
      BX(ctx,x1,bot-h1,bw,h1,BLU,0.85,BLU);
      TX(ctx,'L₁ = '+s.l1+' dB',x1+bw/2,bot-h1-14,BLU,13,'center','700');
      TX(ctx,'기계 1',x1+bw/2,bot+16,DIM,12,'center');
      TX(ctx,'+',x1+bw+(x2-x1-bw)/2,bot-hmax*0.35,TXT,22,'center','700');
      BX(ctx,x2,bot-h2,bw,h2,PNK,0.85,PNK);
      TX(ctx,'L₂ = '+s.l2+' dB',x2+bw/2,bot-h2-14,PNK,13,'center','700');
      TX(ctx,'기계 2',x2+bw/2,bot+16,DIM,12,'center');
      TX(ctx,'=',x2+bw+(x3-x2-bw)/2,bot-hmax*0.35,TXT,22,'center','700');
      /* 합성 막대(에너지 스택) */
      BX(ctx,x3,bot-h1,bw,h1,BLU,0.85,BLU);
      BX(ctx,x3,bot-h1-h2,bw,h2,PNK,0.85,PNK);
      if(h1>18) TX(ctx,(e1/es*100).toFixed(0)+'%',x3+bw/2,bot-h1/2,'#0b1220',11,'center','700');
      if(h2>18) TX(ctx,(e2/es*100).toFixed(0)+'%',x3+bw/2,bot-h1-h2/2,'#0b1220',11,'center','700');
      TX(ctx,'L합성 = '+ls.toFixed(1)+' dB',x3+bw/2,bot-h1-h2-16,ORA,14,'center','700');
      TX(ctx,'합성',x3+bw/2,bot+16,DIM,12,'center');
      LN(ctx,x1-14,bot,x3+bw+14,bot,DIM,1.5);
      /* 우측: 차이→증가분 규칙(전부 실계산) */
      var px=W*0.62, py=H*0.40, incOf=function(d){ return 10*lg(1+Math.pow(10,-d/10)); };
      TX(ctx,'레벨 차이가 말해 주는 것',px,py-6,AMB,13,'left','700');
      TX(ctx,'지금 차이 |L₁−L₂| = '+diff+' dB',px,py+22,TXT,12.5);
      TX(ctx,'→ 큰 쪽 '+mx+' dB에 +'+inc.toFixed(2)+' dB',px,py+44,ORA,13,'left','700');
      TX(ctx,'차이  0 dB → +'+incOf(0).toFixed(1)+' dB (같은 기계 2대)',px,py+76,GRN,12);
      TX(ctx,'차이  5 dB → +'+incOf(5).toFixed(1)+' dB',px,py+98,TXT,12);
      TX(ctx,'차이 10 dB → +'+incOf(10).toFixed(1)+' dB',px,py+120,TXT,12);
      TX(ctx,'차이 15 dB → +'+incOf(15).toFixed(1)+' dB',px,py+142,DIM,12);
      TX(ctx,(diff>=10?'차이 10dB 이상 — 사실상 큰 쪽 값만 취해도 됩니다':'두 소리 모두 합성에 실질 기여 중입니다'),px,py+176,(diff>=10?GRN:BLU),12,'left','600');
      TX(ctx,'기계를 1대 → 2대로 늘리면 에너지 2배 = +3dB',px,py+204,DIM,11.5);
      E.big('L = 10 log(10^(L₁/10)+10^(L₂/10)) = '+ls.toFixed(1)+' dB','큰 쪽 '+mx+' dB보다 +'+inc.toFixed(1)+' dB — 90+90은 180이 아니라 93입니다'); } },
  { id:'hyg4_03',
    enter:function(E){ var self=this; this.s={r:2,l:95};
      E.controls('<div class="ctrl"><label>음원과의 거리 r (m)</label><input type="range" id="h403r" min="1" max="32" step="0.5" value="2"><output id="h403ro">2 m</output></div>'
        +'<div class="ctrl"><label>작업 위치 소음 L (dB(A))</label><input type="range" id="h403l" min="85" max="115" step="1" value="95"><output id="h403lo">95 dB</output></div>');
      E.bind('#h403r','input',function(e){ self.s.r=+e.target.value; document.getElementById('h403ro').textContent=e.target.value+' m'; });
      E.bind('#h403l','input',function(e){ self.s.l=+e.target.value; document.getElementById('h403lo').textContent=e.target.value+' dB'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i, r, l;
      var L0=110; /* 1m 지점 110dB인 점음원 */
      var splr=L0-20*lg(s.r), T=permT(s.l);
      var top=H*0.40, bot=H*0.84;
      /* 좌: 점음원 거리감쇠 */
      var ax0=W*0.08, ax1=W*0.45;
      function Xr(rr){ return ax0+((rr-1)/31)*(ax1-ax0); }
      function Yd(db){ return bot-((db-78)/34)*(bot-top); }
      TX(ctx,'점음원 거리감쇠 SPL = 110 − 20 log r (1m에서 110dB)',ax0,top-26,AMB,12.5,'left','700');
      LN(ctx,ax0,bot,ax1,bot,DIM,1.5); LN(ctx,ax0,bot,ax0,top-8,DIM,1.5);
      TX(ctx,'거리 r (m)',ax1,bot+30,DIM,11,'right');
      TX(ctx,'dB',ax0-8,top-8,DIM,11,'right');
      ctx.save(); ctx.strokeStyle=BLU; ctx.lineWidth=2; ctx.beginPath();
      for(r=1;r<=32;r+=0.25){ var xx=Xr(r), yy=Yd(L0-20*lg(r)); if(r===1)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); }
      ctx.stroke(); ctx.restore();
      var dbl=[1,2,4,8,16,32];
      for(i=0;i<dbl.length;i++){ var dv=L0-20*lg(dbl[i]); DOT(ctx,Xr(dbl[i]),Yd(dv),3.5,GRN); TX(ctx,dv.toFixed(0),Xr(dbl[i])+2,Yd(dv)-13,GRN,10.5,'center'); TX(ctx,String(dbl[i]),Xr(dbl[i]),bot+16,DIM,10.5,'center'); }
      TX(ctx,'거리 2배 = −'+(20*lg(2)).toFixed(1)+' dB (역2승법칙)',ax1,top+14,GRN,11.5,'right','600');
      DOT(ctx,Xr(s.r),Yd(splr),6,ORA);
      TX(ctx,s.r+'m · '+splr.toFixed(1)+'dB',Xr(s.r)+10,Yd(splr)-2,ORA,12,'left','700');
      /* 우: 허용노출시간 곡선 */
      var bx0=W*0.56, bx1=W*0.93;
      function Xl(ll){ return bx0+((ll-85)/30)*(bx1-bx0); }
      function Yt(t){ return bot-(t/16)*(bot-top); }
      TX(ctx,'허용시간 T = 8 / 2^((L−90)/5) — 5dB 교환율',bx0,top-26,AMB,12.5,'left','700');
      LN(ctx,bx0,bot,bx1,bot,DIM,1.5); LN(ctx,bx0,bot,bx0,top-8,DIM,1.5);
      TX(ctx,'L (dB(A))',bx1,bot+30,DIM,11,'right');
      TX(ctx,'T (h)',bx0-8,top-8,DIM,11,'right');
      ctx.save(); ctx.strokeStyle=PNK; ctx.lineWidth=2; ctx.beginPath();
      for(l=85;l<=115;l+=0.5){ var xx2=Xl(l), yy2=Yt(Math.min(16,permT(l))); if(l===85)ctx.moveTo(xx2,yy2); else ctx.lineTo(xx2,yy2); }
      ctx.stroke(); ctx.restore();
      var tab=[90,95,100,105,110,115];
      for(i=0;i<tab.length;i++){ var tv=permT(tab[i]); DOT(ctx,Xl(tab[i]),Yt(tv),3.5,GRN); TX(ctx,tstr(tv),Xl(tab[i])+3,Yt(tv)-13,GRN,10.5,'center'); TX(ctx,String(tab[i]),Xl(tab[i]),bot+16,DIM,10.5,'center'); }
      LN(ctx,Xl(115),bot,Xl(115),top,RED,1.5,[5,4]);
      TX(ctx,'115dB(A) 초과 금지',Xl(115)-6,top+12,RED,11,'right','600');
      DOT(ctx,Xl(s.l),Yt(Math.min(16,T)),6,ORA);
      TX(ctx,s.l+'dB → '+tstr(T),Xl(s.l)-14,Math.max(top+14,Yt(Math.min(16,T))-26),ORA,12,'right','700');
      TX(ctx,'+5dB = 허용시간 절반 · 90dB일 때 8시간',bx0+16,bot-14,DIM,11.5);
      E.big('T = 8/2^((L−90)/5) → '+s.l+'dB(A)는 '+tstr(T),'거리 '+s.r+'m에서 '+splr.toFixed(1)+'dB — 두 배 물러서면 −6dB, 5dB 오르면 시간 절반'); } },
  { id:'hyg4_04',
    enter:function(E){ var self=this; this.s={l1:90,c1:5,l2:95,c2:3};
      E.controls('<div class="ctrl"><label>구간1 레벨 L₁ (dB(A))</label><input type="range" id="h404a" min="80" max="110" step="1" value="90"><output id="h404ao">90 dB</output></div>'
        +'<div class="ctrl"><label>구간1 시간 C₁ (h)</label><input type="range" id="h404b" min="0" max="8" step="0.5" value="5"><output id="h404bo">5.0 h</output></div>'
        +'<div class="ctrl"><label>구간2 레벨 L₂ (dB(A))</label><input type="range" id="h404c" min="80" max="110" step="1" value="95"><output id="h404co">95 dB</output></div>'
        +'<div class="ctrl"><label>구간2 시간 C₂ (h)</label><input type="range" id="h404d" min="0" max="8" step="0.5" value="3"><output id="h404do">3.0 h</output></div>');
      E.bind('#h404a','input',function(e){ self.s.l1=+e.target.value; document.getElementById('h404ao').textContent=e.target.value+' dB'; });
      E.bind('#h404b','input',function(e){ self.s.c1=+e.target.value; document.getElementById('h404bo').textContent=(+e.target.value).toFixed(1)+' h'; });
      E.bind('#h404c','input',function(e){ self.s.l2=+e.target.value; document.getElementById('h404co').textContent=e.target.value+' dB'; });
      E.bind('#h404d','input',function(e){ self.s.c2=+e.target.value; document.getElementById('h404do').textContent=(+e.target.value).toFixed(1)+' h'; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx;
      var t1=permT(s.l1), t2=permT(s.l2);
      var d1=(s.c1/t1)*100, d2=(s.c2/t2)*100, D=d1+d2;
      var twa=(D>0)? 16.61*lg(D/100)+90 : null;
      var x0=W*0.08, x1=W*0.58;
      /* 상단: 하루 타임라인(높이=레벨) */
      var base=H*0.60, hTop=H*0.37, total=Math.max(8,s.c1+s.c2), wU=(x1-x0)/total;
      function hgt(l){ return ((l-78)/34)*(base-hTop); }
      TX(ctx,'하루의 소음 이력 — 막대 폭=시간 C, 높이=레벨 L',x0,hTop-14,AMB,12.5,'left','700');
      LN(ctx,x0,base,x1,base,DIM,1.5);
      var y90=base-hgt(90);
      LN(ctx,x0,y90,x1,y90,GRN,1.2,[4,4]); TX(ctx,'90dB',x1+6,y90,GRN,10.5);
      if(s.c1>0){ BX(ctx,x0,base-hgt(s.l1),s.c1*wU,hgt(s.l1),BLU,0.8,BLU); TX(ctx,s.l1+'dB',x0+s.c1*wU/2,base-hgt(s.l1)+12,'#0b1220',11,'center','700'); TX(ctx,s.c1.toFixed(1)+'h',x0+s.c1*wU/2,base+13,BLU,11,'center'); }
      if(s.c2>0){ BX(ctx,x0+s.c1*wU,base-hgt(s.l2),s.c2*wU,hgt(s.l2),PNK,0.8,PNK); TX(ctx,s.l2+'dB',x0+s.c1*wU+s.c2*wU/2,base-hgt(s.l2)+12,'#0b1220',11,'center','700'); TX(ctx,s.c2.toFixed(1)+'h',x0+s.c1*wU+s.c2*wU/2,base+13,PNK,11,'center'); }
      LN(ctx,x0+8*wU,base+4,x0+8*wU,hTop,DIM,1.2,[3,4]); TX(ctx,'8h',x0+8*wU,hTop-4,DIM,10.5,'center');
      /* 중단: D 게이지 */
      var gy=Math.max(H*0.72, base+40), gh=Math.min(22,H*0.05), gmax=Math.max(160,D*1.25);
      TX(ctx,'노출량 게이지 D = C₁/T₁ + C₂/T₂ (×100%)',x0,gy-16,AMB,12.5,'left','700');
      BX(ctx,x0,gy,(x1-x0),gh,'#1c2433',1);
      if(d1>0) BX(ctx,x0,gy,(d1/gmax)*(x1-x0),gh,BLU,0.85);
      if(d2>0) BX(ctx,x0+(d1/gmax)*(x1-x0),gy,(d2/gmax)*(x1-x0),gh,PNK,0.85);
      var x100=x0+(100/gmax)*(x1-x0);
      LN(ctx,x100,gy-8,x100,gy+gh+8,RED,2);
      TX(ctx,'100%',x100,gy+gh+20,RED,11,'center','700');
      TX(ctx,'D = '+D.toFixed(1)+'%',x0+(Math.min(D,gmax)/gmax)*(x1-x0)+10,gy+gh/2,(D>100?RED:GRN),13,'left','700');
      /* 우측: 계산 패널(전부 실계산) */
      var px=W*0.66, py=H*0.36, lh=Math.min(22,H*0.052);
      TX(ctx,'노출량계의 셈법',px,py-6,AMB,13,'left','700');
      TX(ctx,'T₁ = 8/2^(('+s.l1+'−90)/5) = '+tstr(t1),px,py+lh,BLU,12);
      TX(ctx,'C₁/T₁ = '+s.c1.toFixed(1)+'/'+t1.toFixed(2)+' = '+(d1/100).toFixed(3),px,py+lh*2,BLU,12);
      TX(ctx,'T₂ = 8/2^(('+s.l2+'−90)/5) = '+tstr(t2),px,py+lh*3.3,PNK,12);
      TX(ctx,'C₂/T₂ = '+s.c2.toFixed(1)+'/'+t2.toFixed(2)+' = '+(d2/100).toFixed(3),px,py+lh*4.3,PNK,12);
      TX(ctx,'D = '+(d1/100).toFixed(3)+' + '+(d2/100).toFixed(3)+' = '+(D/100).toFixed(3)+' → '+D.toFixed(1)+'%',px,py+lh*5.7,ORA,12.5,'left','700');
      TX(ctx,(D>100?'기준 초과 — 공학적 대책·작업관리 필요':'기준 이내 (D ≤ 100%)'),px,py+lh*6.8,(D>100?RED:GRN),12.5,'left','700');
      TX(ctx,'TWA = 16.61 log(D/100) + 90',px,py+lh*8.2,TXT,12);
      TX(ctx,(twa===null?'= — (노출 없음)':'= '+twa.toFixed(1)+' dB(A)'),px,py+lh*9.2,(twa!==null&&twa>90?RED:GRN),13,'left','700');
      TX(ctx,'설정: Criteria 90dB · 교환율 5dB · Threshold 80dB',px,py+lh*10.5,DIM,11);
      TX(ctx,'(80dB 미만은 노출량 계산에서 제외)',px,py+lh*11.3,DIM,11);
      E.big('D = Σ(C/T)×100 = '+D.toFixed(1)+'%',(twa===null?'노출이 없습니다':'TWA = '+twa.toFixed(1)+' dB(A) — 100%·90dB이 하루의 한도입니다')); } },
  { id:'hyg4_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; },
    draw:function(E){ var s=this.s, W=E.W, H=E.H, ctx=E.ctx, i, j;
      E.tapHint(0,0,'다음 단계',true);
      /* 진행 칩 */
      var names=['① 소음성 난청','② 청력보존 프로그램','③ 진동'], cw=W*0.26;
      var big1='', big2='';
      if(s.step===0){
        var fx0=W*0.10, fx1=W*0.56, fy0=H*0.42, fy1=H*0.86;
        var fr=[500,1000,2000,3000,4000,6000,8000];
        function Xf(f){ return fx0+(lg(f/500)/lg(16))*(fx1-fx0); }
        function Yh(v){ return fy0+(v/80)*(fy1-fy0); } /* 청력도: 아래로 갈수록 나쁨 */
        function loss(f,yr){ var d=Math.log(f/4000)/Math.LN2; var dip=Math.exp(-(d*d)/0.9); return Math.min(75, 3+yr*0.3+yr*2.4*dip); }
        TX(ctx,'청력도(오디오그램) — 아래로 내려갈수록 안 들립니다',fx0,fy0-24,AMB,12.5,'left','700');
        LN(ctx,fx0,fy0,fx1,fy0,DIM,1.5); LN(ctx,fx0,fy0,fx0,fy1,DIM,1.5);
        for(i=0;i<fr.length;i++){ TX(ctx,(fr[i]>=1000?(fr[i]/1000)+'k':String(fr[i])),Xf(fr[i]),fy1+14,DIM,10.5,'center'); LN(ctx,Xf(fr[i]),fy0,Xf(fr[i]),fy1,DIM,0.5,[2,4]); }
        for(i=0;i<=80;i+=20){ TX(ctx,String(i),fx0-10,Yh(i),DIM,10.5,'right'); }
        TX(ctx,'역치(dB HL)',fx0-10,fy0-14,DIM,10.5,'right');
        var yrs=[[3,BLU,'3년'],[10,ORA,'10년'],[25,RED,'25년']];
        for(j=0;j<yrs.length;j++){ ctx.save(); ctx.strokeStyle=yrs[j][1]; ctx.lineWidth=2; ctx.beginPath();
          for(i=0;i<fr.length;i++){ var xx=Xf(fr[i]), yy=Yh(loss(fr[i],yrs[j][0])); if(i===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); DOT(ctx,xx,yy,3,yrs[j][1]); }
          ctx.stroke(); ctx.restore();
          TX(ctx,'노출 '+yrs[j][2],fx1+10,Yh(loss(8000,yrs[j][0])),yrs[j][1],11,'left','600'); }
        LN(ctx,Xf(4000),fy0,Xf(4000),fy1,RED,1.3,[5,4]);
        TX(ctx,'C5-dip · 4,000Hz(C5:4,096Hz)',Xf(4000),fy1+30,RED,11.5,'center','700');
        var tx=W*0.70, ty=H*0.42;
        TX(ctx,'소음성 난청의 특징',tx,ty-4,AMB,12.5,'left','700');
        TX(ctx,'· 내이 모세포 손상 — 감각신경성',tx,ty+22,TXT,12);
        TX(ctx,'· 거의 항상 양측성',tx,ty+44,TXT,12);
        TX(ctx,'· 4,000Hz에서 시작 → 전 영역 파급',tx,ty+66,TXT,12);
        TX(ctx,'· 고음역 손실 10~15년에 최고치',tx,ty+88,TXT,12);
        TX(ctx,'· 회화 영역(500~2,000Hz)이 멀쩡한',tx,ty+110,GRN,12);
        TX(ctx,'  초기엔 본인이 모릅니다 → 청력검사',tx,ty+130,GRN,12);
        big1='소음성 난청 — 4,000Hz부터 조용히 무너집니다'; big2='초기엔 대화가 멀쩡해서 모릅니다 — 그래서 정기 청력검사입니다';
      } else if(s.step===1){
        window.HygDoc(E,{ title:'청력보존 프로그램(HCP) — 잃기 전에 지킨다',
          sub:'1일 8시간 기준 85dB(A) 이상 소음 발생 시 수립·시행하는 종합 계획',
          boxes:[
            {x:0.03,y:0.42,w:0.17,h:0.18,c:BLU,t:'① 측정·평가',s:'정기 소음측정\n80dB 연속음\n120dB 충격음'},
            {x:0.225,y:0.42,w:0.17,h:0.18,c:GRN,t:'② 공학적 대책',s:'저소음 기계\n방음커버·흡음\n차음벽'},
            {x:0.42,y:0.42,w:0.17,h:0.18,c:AMB,t:'③ 작업관리·보호구',s:'노출시간 저감\n순환근무\n귀마개·귀덮개'},
            {x:0.615,y:0.42,w:0.17,h:0.18,c:PNK,t:'④ 청력검사·사후관리',s:'배치 시+정기\n표준역치변동\n(2·3·4kHz 3분법)'},
            {x:0.81,y:0.42,w:0.17,h:0.18,c:ORA,t:'⑤ 교육·기록·평가',s:'유해성 교육\n문서·기록 관리\n정기 평가·보완'} ],
          arrows:[
            {x1:0.20,y1:0.51,x2:0.225,y2:0.51,c:DIM},
            {x1:0.395,y1:0.51,x2:0.42,y2:0.51,c:DIM},
            {x1:0.59,y1:0.51,x2:0.615,y2:0.51,c:DIM},
            {x1:0.785,y1:0.51,x2:0.81,y2:0.51,c:DIM} ],
          calc:[
            {k:'시행 기준',v:'8h 85dB(A) 이상',c:AMB},
            {k:'귀마개 감음',v:'25~35dB',c:BLU},
            {k:'귀덮개 감음',v:'35~45dB',c:BLU},
            {k:'동시 착용',v:'+3~5dB (50dB 이상 감음 불가)',c:GRN} ],
          note:'90dB(A) 초과 사업장·소음성 난청 유소견자 발생 사업장은 매년 청력검사' });
        big1='청력보존 프로그램 — 측정에서 기록까지 한 바퀴'; big2='공학적 대책이 먼저, 보호구는 마지막 방어선입니다';
      } else {
        var vx0=W*0.10, vx1=W*0.88, vy=H*0.44;
        function Xv(f){ return vx0+(lg(f)/lg(2000))*(vx1-vx0); }
        TX(ctx,'진동의 주파수 지도 (log 눈금)',vx0,vy-32,AMB,12.5,'left','700');
        LN(ctx,vx0,vy+92,vx1,vy+92,DIM,1.5);
        var tk=[1,10,100,1000];
        for(i=0;i<tk.length;i++){ LN(ctx,Xv(tk[i]),vy+88,Xv(tk[i]),vy+96,DIM,1); TX(ctx,tk[i]+'Hz',Xv(tk[i]),vy+108,DIM,10.5,'center'); }
        /* 전신진동 1~90Hz */
        BX(ctx,Xv(1),vy,Xv(90)-Xv(1),26,BLU,0.75,BLU);
        TX(ctx,'전신진동 1~90Hz',Xv(1)+8,vy+13,'#0b1220',12,'left','700');
        BX(ctx,Xv(4),vy,Xv(8)-Xv(4),26,RED,0.85);
        TX(ctx,'공명 4~8Hz(수직)',Xv(8)+8,vy+13,RED,11,'left','600');
        /* 국소진동 8~1,500Hz */
        BX(ctx,Xv(8),vy+40,Xv(1500)-Xv(8),26,PNK,0.75,PNK);
        TX(ctx,'국소진동 8~1,500Hz',Xv(8)+8,vy+53,'#0b1220',12,'left','700');
        BX(ctx,Xv(100),vy+40,Xv(250)-Xv(100),26,RED,0.85);
        TX(ctx,'공명 100~250Hz',Xv(250)+8,vy+53,RED,11,'left','600');
        var ty2=vy+140;
        TX(ctx,'국소진동(손·팔) → 레이노 현상(white finger·dead finger)',vx0,ty2,PNK,12.5,'left','700');
        TX(ctx,'· 착암기·해머 등 압축공기 진동공구 장기 사용 → 손가락 창백·저림',vx0,ty2+22,TXT,12);
        TX(ctx,'· 한랭 작업조건에서 증상 악화 · 발증까지 약 5년',vx0,ty2+44,TXT,12);
        TX(ctx,'전신진동 → 순환기 영향(혈압·맥박)·위장장애·척추 부담',vx0,ty2+72,BLU,12.5,'left','700');
        TX(ctx,'· 수평·수직 진동이 동시에 오면 자각 2배 · 최소진동역치 55±5dB',vx0,ty2+94,TXT,12);
        TX(ctx,'· 대책: 방진 장갑·방진 시트, 공구 정비, 노출시간 관리, 보온',vx0,ty2+116,GRN,12);
        big1='진동 — 몸이 흡수하는 파동'; big2='전신 1~90Hz · 국소 8~1,500Hz — 공명 대역을 피하는 것이 설계의 핵심입니다';
      }
      for(i=0;i<3;i++){ var cx=W*0.10+i*cw; BX(ctx,cx,H*0.30,cw-14,4,(i===s.step?ORA:'#2a3244'),1); TX(ctx,names[i],cx,H*0.30+16,(i===s.step?ORA:DIM),11.5,'left',(i===s.step?'700':'500')); }
      E.big(big1,big2); } },
  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
