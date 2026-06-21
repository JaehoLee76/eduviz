/* 제2장 식 — 2.1 다항식 · 2.2 인수분해 · 2.3 나눗셈·분수식
   핵심 도구: 대수 타일 + 넓이 모델(area model)
*/
(function(){

  // 색이 든 사각형(반투명 채움 + 외곽선 + 라벨)
  function box(ctx,x,y,w,h,col,label,fs){
    ctx.globalAlpha=0.16; ctx.fillStyle=col; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1;
    ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h);
    if(label!=null && w>16 && h>14){ ctx.fillStyle=col; ctx.font='600 '+(fs||14)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label, x+w/2, y+h/2); ctx.textBaseline='alphabetic'; }
  }

  // 변형으로 드러나는 인수를 깜빡여 강조 (E.frame 사용)
  function blinkA(E){ return 0.32 + 0.68*(0.5+0.5*Math.sin(E.frame*0.13)); }

  // "눌러서 보기" 탭 안내 — 클릭 가능함을 쉽게 인지시키는 펄스 버튼
  function tapHint(E, cx, cy, text, pulse){
    var ctx=E.ctx; ctx.save();
    ctx.font='600 15px sans-serif'; ctx.textBaseline='middle';
    var kw=26, gap=10, tw=ctx.measureText(text).width, inner=tw+gap+kw;   // 텍스트 + D 키 배지(단계 진행)
    var w=inner+40, h=40, x=cx-w/2, y=cy-h/2;
    var pa = pulse ? (0.55+0.45*Math.sin(E.frame*0.10)) : 0.85;
    ctx.globalAlpha=pa*0.22; ctx.fillStyle='#d8814a';
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,20); ctx.fill(); } else ctx.fillRect(x,y,w,h);
    ctx.globalAlpha=pa; ctx.strokeStyle='#d8814a'; ctx.lineWidth=1.6;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,20); ctx.stroke(); } else ctx.strokeRect(x,y,w,h);
    var tx=cx-inner/2;
    ctx.textAlign='left'; ctx.fillStyle='#ffb27a'; ctx.fillText(text, tx, cy);
    var kx=tx+tw+gap, ky=cy-11;                                           // D 키 배지(클릭=D)
    ctx.lineWidth=1.3; ctx.strokeStyle='#ffb27a'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(kx,ky,kw,22,5);ctx.stroke();}else ctx.strokeRect(kx,ky,kw,22);
    ctx.font='700 12px sans-serif'; ctx.textAlign='center'; ctx.fillText('D',kx+kw/2,cy+0.5);
    ctx.restore(); ctx.textBaseline='alphabetic'; ctx.textAlign='start';
  }

  // 대수 타일: ax² + bx + c
  function drawTiles(E,a,b,c){
    var ctx=E.ctx, XS=Math.min(60,E.H*0.12), xw=Math.max(16,XS*0.3), gap=12, items=[];
    for(var i=0;i<a;i++) items.push({w:XS,h:XS,c:'#7ab8ff',t:'x²'});
    for(var i=0;i<b;i++) items.push({w:xw,h:XS,c:'#8fe3b5',t:'x'});
    for(var i=0;i<c;i++) items.push({w:xw,h:xw,c:'#ffb27a',t:'1'});
    var tot=0; for(var k=0;k<items.length;k++) tot+=items[k].w+gap; tot-=gap;
    var x=E.W/2-tot/2, cy=E.H*0.50;
    for(var j=0;j<items.length;j++){ var it=items[j]; box(ctx,x,cy-it.h/2,it.w,it.h,it.c,it.t,it.w<24?11:14); x+=it.w+gap; }
  }

  // 넓이 모델: (x+a)(x+b). blink 지정 시 인수(+a,+b) 라벨을 깜빡여 강조.
  function areaModel(E,a,b,sideCol,blink){
    var ctx=E.ctx, xlen=Math.min(120,E.W*0.15), u=Math.min(26,E.W*0.03);
    var W2=xlen+a*u, H2=xlen+b*u, ox=E.W/2-W2/2, oy=E.H*0.52-H2/2;
    box(ctx,ox,oy,xlen,xlen,'#7ab8ff','x²',16);
    box(ctx,ox+xlen,oy,a*u,xlen,'#8fe3b5',(a===1?'x':a+'x'));
    box(ctx,ox,oy+xlen,xlen,b*u,'#8fe3b5',(b===1?'x':b+'x'));
    box(ctx,ox+xlen,oy+xlen,a*u,b*u,'#ffb27a',(a*b));
    var base=sideCol||E.COL.txt; ctx.textAlign='center';
    // 'x' 변 라벨(기본)
    ctx.globalAlpha=1; ctx.fillStyle=base; ctx.font='600 14px sans-serif';
    ctx.fillText('x', ox+xlen/2, oy-10);
    ctx.save(); ctx.translate(ox-14, oy+xlen/2); ctx.rotate(-Math.PI/2); ctx.fillText('x',0,0); ctx.restore();
    // 인수 '+a','+b' — blink 시 강조 깜빡임
    if(blink!=null){ ctx.globalAlpha=blink; ctx.fillStyle='#ffb27a'; ctx.font='700 17px sans-serif'; }
    else { ctx.fillStyle=base; ctx.font='600 14px sans-serif'; }
    ctx.fillText('+'+a, ox+xlen+a*u/2, oy-10);
    ctx.save(); ctx.translate(ox-14, oy+xlen+b*u/2); ctx.rotate(-Math.PI/2); ctx.fillText('+'+b,0,0); ctx.restore();
    ctx.globalAlpha=1;
    return {ox:ox,oy:oy,W2:W2,H2:H2};
  }

  // 넓이모델 공통 기하 (애니메이션용)
  function geo(E,a,b){ var xlen=Math.min(120,E.W*0.15), u=Math.min(26,E.W*0.03);
    var W2=xlen+a*u, H2=xlen+b*u; return {xlen:xlen,u:u,W2:W2,H2:H2,ox:E.W/2-W2/2,oy:E.H*0.50-H2/2}; }
  function ez(p){ p=Math.max(0,Math.min(1,p)); return p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; }
  function clamp(x){ return Math.max(0,Math.min(1,x)); }
  // 색 보간 (통짜 파랑 → 칸별 색)
  function lerpColor(c1,c2,t){ function h(c){ return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]; }
    var a=h(c1), b=h(c2); function p(x){ x=Math.round(x).toString(16); return x.length<2?'0'+x:x; }
    return '#'+p(a[0]+(b[0]-a[0])*t)+p(a[1]+(b[1]-a[1])*t)+p(a[2]+(b[2]-a[2])*t); }

  var scenes = [

  // ══════════ 2.1 정식(다항식) ══════════
  { id:'ch2_01',
    enter:function(E){ this.s={a:2,b:3,c:1}; E.setOn([]);
      E.controls('<div class="ctrl"><label>a (x²)</label><input type="range" id="ta" min="0" max="3" step="1" value="2"><output id="oa">2</output>'
        +'<label style="margin-left:14px">b (x)</label><input type="range" id="tb" min="0" max="4" step="1" value="3"><output id="ob">3</output>'
        +'<label style="margin-left:14px">c</label><input type="range" id="tc" min="0" max="4" step="1" value="1"><output id="oc">1</output></div>');
      var self=this;
      E.bind('#ta','input',function(e){ self.s.a=+e.target.value; document.getElementById('oa').textContent=e.target.value; E.blip(500,0.1); });
      E.bind('#tb','input',function(e){ self.s.b=+e.target.value; document.getElementById('ob').textContent=e.target.value; E.blip(440,0.1); });
      E.bind('#tc','input',function(e){ self.s.c=+e.target.value; document.getElementById('oc').textContent=e.target.value; E.blip(380,0.1); }); },
    draw:function(E){ var s=this.s; drawTiles(E,s.a,s.b,s.c);
      var parts=[]; if(s.a)parts.push((s.a===1?'':s.a)+'x²'); if(s.b)parts.push((s.b===1?'':s.b)+'x'); if(s.c)parts.push(s.c);
      var poly=parts.join(' + ')||'0'; var deg=s.a?2:(s.b?1:0), nterms=(s.a?1:0)+(s.b?1:0)+(s.c?1:0);
      E.big(poly, '차수 '+deg+' · 항 '+nterms+'개'); }
  },

  { id:'ch2_02',
    enter:function(E){ this.s={a:2,b:3,p:0,tgt:0,auto:false}; E.setOn([]);
      E.controls('<div class="ctrl"><label>a</label><input type="range" id="ma" min="1" max="4" step="1" value="2"><output id="oma">2</output>'
        +'<label style="margin-left:16px">b</label><input type="range" id="mb" min="1" max="4" step="1" value="3"><output id="omb">3</output></div>');
      var self=this;
      E.bind('#ma','input',function(e){ self.s.a=+e.target.value; document.getElementById('oma').textContent=e.target.value; self.s.p=0; self.s.tgt=0; self.s.auto=false; E.blip(480,0.1); });
      E.bind('#mb','input',function(e){ self.s.b=+e.target.value; document.getElementById('omb').textContent=e.target.value; self.s.p=0; self.s.tgt=0; self.s.auto=false; E.blip(420,0.1); }); },
    tap:function(E){ var s=this.s; if(s.p>=1){ s.p=0; s.tgt=0; s.auto=false; E.blip(340,0.12); } else { s.tgt=1; s.auto=false; E.blip(520,0.15); } },
    draw:function(E){ var s=this.s, ctx=E.ctx;
      var tgt=s.auto?1:(s.tgt||0); if(s.p<tgt) s.p=Math.min(tgt,s.p+0.012); if(s.auto&&s.p>=1)s.auto=false;
      var g=geo(E,s.a,s.b), ox=g.ox, oy=g.oy, xl=g.xlen, u=g.u, aw=s.a*u, bw=s.b*u, p=s.p;
      // 전체 직사각형 (항상)
      ctx.globalAlpha=0.16; ctx.fillStyle='#7ab8ff'; ctx.fillRect(ox,oy,g.W2,g.H2); ctx.globalAlpha=1;
      ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(ox,oy,g.W2,g.H2);
      // 펼침: 색 채움 + 분할선 (alpha p)
      if(p>0.02){ ctx.globalAlpha=p*0.16; ctx.fillStyle='#8fe3b5'; ctx.fillRect(ox+xl,oy,aw,xl); ctx.fillRect(ox,oy+xl,xl,bw);
        ctx.globalAlpha=p*0.16; ctx.fillStyle='#ffb27a'; ctx.fillRect(ox+xl,oy+xl,aw,bw);
        ctx.globalAlpha=p; ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(ox+xl,oy); ctx.lineTo(ox+xl,oy+g.H2); ctx.moveTo(ox,oy+xl); ctx.lineTo(ox+g.W2,oy+xl); ctx.stroke(); ctx.globalAlpha=1; }
      // 칸 라벨(=네 항): 완성되면 깜빡
      var lbA=(s.p>=1)?blinkA(E):Math.max(0,(p-0.4)/0.6); ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.globalAlpha=Math.min(1,p*1.6); ctx.fillStyle='#7ab8ff'; ctx.font='600 15px sans-serif'; ctx.fillText('x²',ox+xl/2,oy+xl/2);
      ctx.globalAlpha=lbA; ctx.fillStyle='#8fe3b5'; ctx.fillText((s.a===1?'x':s.a+'x'),ox+xl+aw/2,oy+xl/2); ctx.fillText((s.b===1?'x':s.b+'x'),ox+xl/2,oy+xl+bw/2);
      ctx.fillStyle='#ffb27a'; ctx.fillText(s.a*s.b,ox+xl+aw/2,oy+xl+bw/2); ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
      // 변을 칸별로 분해 라벨 (항상) — 위: x | a, 왼쪽: x | b  → x+a, x+b 직관
      ctx.fillStyle=E.COL.txt; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('x',ox+xl/2,oy-10); ctx.fillText(''+s.a,ox+xl+aw/2,oy-10);
      ctx.globalAlpha=0.6; ctx.fillText('+',ox+xl,oy-10); ctx.globalAlpha=1;
      ctx.save();ctx.translate(ox-13,oy+xl/2);ctx.rotate(-Math.PI/2);ctx.fillText('x',0,0);ctx.restore();
      ctx.save();ctx.translate(ox-13,oy+xl+bw/2);ctx.rotate(-Math.PI/2);ctx.fillText(''+s.b,0,0);ctx.restore();
      ctx.globalAlpha=0.6;ctx.save();ctx.translate(ox-13,oy+xl);ctx.rotate(-Math.PI/2);ctx.fillText('+',0,0);ctx.restore();ctx.globalAlpha=1;
      if(s.p<=0) tapHint(E, ox+g.W2/2, oy+g.H2+46, '▶ 펼치기 D · 자동 S', true);
      else if(s.p>=1) tapHint(E, ox+g.W2/2, oy+g.H2+46, '↻ 다시 보기 (D)', false);
      E.big((s.p<1?'(x+'+s.a+')(x+'+s.b+')':'(x+'+s.a+')(x+'+s.b+') = x² + '+(s.a+s.b)+'x + '+(s.a*s.b)), (s.p>=1?'네 칸 = 네 항':'D로 네 칸으로 펼치기')); }
  },

  // ══════════ 2.2 인수분해 ══════════
  { id:'ch2_03',
    enter:function(E){ this.s={p:0,tgt:0,auto:false}; E.setOn([]); },
    tap:function(E){ var s=this.s, B=[0,0.20,0.35,1];   // 설명 단위: 점선 분리 → 실선 → 이동
      if(s.p>=1){ s.p=0; s.tgt=0; s.auto=false; E.blip(340,0.12); return; }
      var base=Math.max(s.p,s.tgt||0), nb=1; for(var i=0;i<B.length;i++){ if(B[i]>base+1e-4){ nb=B[i]; break; } }
      s.tgt=nb; s.auto=false; E.blip(520,0.14); },
    draw:function(E){ var s=this.s, ctx=E.ctx, a=2, b=3;
      var tgt=s.auto?1:(s.tgt||0); if(s.p<tgt) s.p=Math.min(tgt,s.p+0.008); if(s.auto&&s.p>=1)s.auto=false;
      var g=geo(E,a,b), ox=g.ox, oy=g.oy, xl=g.xlen, u=g.u, aw=a*u, bw=b*u;
      var pdash=clamp(s.p/0.20), psolid=clamp((s.p-0.22)/0.13), pmove=ez(clamp((s.p-0.50)/0.50));
      var grid=[ {x:ox,y:oy,w:xl,h:xl,c:'#7ab8ff',t:'x²'},
                 {x:ox+xl,y:oy,w:aw,h:xl,c:'#8fe3b5',t:a+'x'},
                 {x:ox,y:oy+xl,w:xl,h:bw,c:'#8fe3b5',t:b+'x'},
                 {x:ox+xl,y:oy+xl,w:aw,h:bw,c:'#ffb27a',t:(a*b)} ];
      // 왼쪽 한 줄(끝) — 파랑·녹·녹·주황 나란히
      var ts=Math.min(xl,60), gp=10, tot=4*ts+3*gp, rx0=E.W*0.32-tot/2, ry=oy+g.H2/2-ts/2, cy0=oy+g.H2/2;
      for(var i=0;i<4;i++){ var gd=grid[i], rwx=rx0+i*(ts+gp);
        var x=gd.x+(rwx-gd.x)*pmove, y=gd.y+(ry-gd.y)*pmove, w=gd.w+(ts-gd.w)*pmove, h=gd.h+(ts-gd.h)*pmove;
        var col=lerpColor('#7ab8ff', gd.c, pdash);
        ctx.globalAlpha=0.18; ctx.fillStyle=col; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1;
        if(psolid>0.01||pmove>0.01){ ctx.globalAlpha=Math.max(psolid,pmove); ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h); ctx.globalAlpha=1; }
        if(pdash>0.01){ ctx.globalAlpha=pdash; ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(gd.t, x+w/2, y+h/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; } }
      // 통짜 외곽 + 점선 분리선 (이동 전)
      if(pmove<0.02){
        if(psolid<0.99){ ctx.globalAlpha=1-psolid; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(ox,oy,g.W2,g.H2); ctx.globalAlpha=1; }
        var da=pdash*(1-psolid);
        if(da>0.01){ ctx.globalAlpha=da; ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(ox+xl,oy); ctx.lineTo(ox+xl,oy+g.H2); ctx.moveTo(ox,oy+xl); ctx.lineTo(ox+g.W2,oy+xl); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; }
        if(pdash<0.99){ ctx.globalAlpha=1-pdash; ctx.fillStyle='#7ab8ff'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('x²+5x+6', ox+g.W2/2, oy+g.H2/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      }
      // 오른쪽: 인수 (x+2)(x+3) — 모여서 등장(깜빡)
      if(pmove>0.15){ var fa=(s.p>=1)?blinkA(E):clamp((pmove-0.15)/0.85); ctx.globalAlpha=fa; ctx.fillStyle='#ffb27a'; ctx.font='700 30px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('(x+2)(x+3)', E.W*0.68, cy0); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      // = 기호
      if(pmove>0.4){ ctx.globalAlpha=clamp((pmove-0.4)/0.6); ctx.fillStyle=E.COL.txt; ctx.font='600 28px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('=', E.W*0.50, cy0); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      if(s.p<=0) tapHint(E, ox+g.W2/2, oy+g.H2+52, '▶ 다음 단계 D · 자동 S', true);
      else if(s.p>=1) tapHint(E, E.W/2, cy0+ts/2+38, '↻ 다시 보기 (D)', false);
      else if(!s.auto) tapHint(E, E.W/2, cy0+ts/2+38, '▶ 다음 단계 (D)', false);
      var sub = (s.p<=0)?'하나의 직사각형 — D로 한 단계씩':(pdash<1?'점선으로 네 칸 분리…':(psolid<1?'점선이 실선으로…':(pmove<1?'도형은 왼쪽, 인수는 오른쪽으로…':'왼쪽 = x²+5x+6, 오른쪽 = (x+2)(x+3) ✓')));
      E.big('x² + 5x + 6 = (x+2)(x+3)', sub); }
  },

  { id:'ch2_04',
    enter:function(E){ this.s={p:0,tgt:0,auto:false,a:4,b:1.5}; E.setOn([]);
      E.quiz({q:'x² − 9 를 인수분해하면?', choices:['(x+3)(x−3)','(x−3)²','(x+3)²','(x−9)(x+1)'], answer:0, explain:'a²−b²=(a+b)(a−b), 9=3² → (x+3)(x−3)'}); },
    tap:function(E){ var s=this.s, B=[0,0.40,0.58,1];   // 설명 단위: 점선 자르기 → 실선 → 조각 이동
      if(s.p>=1){ s.p=0; s.tgt=0; s.auto=false; E.blip(340,0.12); return; }
      var base=Math.max(s.p,s.tgt||0), nb=1; for(var i=0;i<B.length;i++){ if(B[i]>base+1e-4){ nb=B[i]; break; } }
      s.tgt=nb; s.auto=false; E.blip(560,0.14); },
    draw:function(E){ var ctx=E.ctx, s=this.s;
      var tgt=s.auto?1:(s.tgt||0); if(s.p<tgt) s.p=Math.min(tgt,s.p+0.006); if(s.auto&&s.p>=1)s.auto=false;
      function ez(p){ p=Math.max(0,Math.min(1,p)); return p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; }
      var u=Math.min(64,E.H*0.085), a=s.a, b=s.b;
      var aw=a*u, bw=b*u, abw=(a-b)*u, totalW=(a+b)*u, totalH=abw, sx=E.W/2-totalW/2, sy=E.H*0.30;
      // 단계: 정지(인지) → 점선 자르기 → 실선 → 이동  (인터벌 둠)
      var pDash=Math.max(0,Math.min(1,(s.p-0.18)/0.22)), pSolid=Math.max(0,Math.min(1,(s.p-0.42)/0.16)), mp=ez(Math.max(0,Math.min(1,(s.p-0.58)/0.42)));
      if(mp>0.01){ ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(255,255,255,'+(0.16*mp)+')'; ctx.lineWidth=1.5; ctx.strokeRect(sx,sy,totalW,totalH); ctx.setLineDash([]); }
      // 조각 A 채움
      ctx.globalAlpha=0.18; ctx.fillStyle='#7ab8ff'; ctx.fillRect(sx,sy,aw,abw); ctx.globalAlpha=1;
      // 조각 B 채움 (이동·회전, 이동 시 자체 테두리)
      var bcx=(sx+abw/2)+((sx+aw+bw/2)-(sx+abw/2))*mp, bcy=(sy+abw+bw/2)+((sy+abw/2)-(sy+abw+bw/2))*mp, ang=mp*Math.PI/2;
      ctx.save(); ctx.translate(bcx,bcy); ctx.rotate(ang);
      ctx.globalAlpha=0.20; ctx.fillStyle='#7ab8ff'; ctx.fillRect(-abw/2,-bw/2,abw,bw); ctx.globalAlpha=1;
      if(mp>0.02){ ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(-abw/2,-bw/2,abw,bw); }
      ctx.restore();
      // 떼어낸 b² (점선 빈 칸, 형성되며 사라짐)
      var fb=Math.max(0,1-mp*1.5);
      if(fb>0){ ctx.globalAlpha=fb*0.14; ctx.fillStyle='#e24b4a'; ctx.fillRect(sx+abw,sy+abw,bw,bw);
        ctx.globalAlpha=fb; ctx.strokeStyle='#e24b4a'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.strokeRect(sx+abw,sy+abw,bw,bw); ctx.setLineDash([]);
        ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#e24b4a'; ctx.fillText('b²',sx+abw+bw/2,sy+abw+bw/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1; }
      if(mp<0.02){
        // 정지~자르기: 통합 L 윤곽(구분 없음) + 내부 절단선(점선→실선)
        ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.beginPath();
        ctx.moveTo(sx,sy); ctx.lineTo(sx+aw,sy); ctx.lineTo(sx+aw,sy+abw); ctx.lineTo(sx+abw,sy+abw); ctx.lineTo(sx+abw,sy+abw+bw); ctx.lineTo(sx,sy+abw+bw); ctx.closePath(); ctx.stroke();
        var da=pDash*(1-pSolid);
        if(da>0.01){ ctx.globalAlpha=da; ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(sx,sy+abw); ctx.lineTo(sx+abw,sy+abw); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; }
        if(pSolid>0.01){ ctx.globalAlpha=pSolid; ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(sx,sy+abw); ctx.lineTo(sx+abw,sy+abw); ctx.stroke(); ctx.globalAlpha=1; }
      } else { ctx.strokeStyle='#7ab8ff'; ctx.lineWidth=2; ctx.strokeRect(sx,sy,aw,abw); }
      // 초기 a² 라벨 (이동하며 사라짐)
      ctx.globalAlpha=Math.max(0,1-mp*2.2); ctx.fillStyle='#7ab8ff'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('a²',sx+aw/2,sy+abw/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
      // 최종 치수 라벨 (완성 시 깜빡)
      var lblA=(s.p>=1)?blinkA(E):mp; ctx.globalAlpha=lblA; ctx.fillStyle='#ffb27a'; ctx.font='700 17px sans-serif'; ctx.textAlign='center';
      ctx.fillText('a + b', sx+totalW/2, sy+totalH+24);
      ctx.save(); ctx.translate(sx-18, sy+totalH/2); ctx.rotate(-Math.PI/2); ctx.fillText('a − b',0,0); ctx.restore(); ctx.globalAlpha=1;
      if(s.p<=0) tapHint(E, sx+totalW/2, sy+aw+46, '▶ 다음 단계 D · 자동 S', true);
      else if(s.p>=1) tapHint(E, sx+totalW/2, sy+aw+46, '↻ 다시 보기 (D)', false);
      else if(!s.auto) tapHint(E, sx+totalW/2, sy+aw+46, '▶ 다음 단계 (D)', false);
      var sub; if(s.p<=0) sub='먼저 모양을 살펴보고 — D로 한 단계씩';
      else if(pDash<1&&mp<0.02) sub='자를 위치를 점선으로 표시…';
      else if(pSolid<1&&mp<0.02) sub='점선을 실선으로 — 자르기';
      else if(mp<1) sub='조각을 옮겨 붙이는 중…'; else sub='(a+b)(a−b) 직사각형 완성 ✓';
      E.big('a² − b² = (a+b)(a−b)', sub); }
  },

  // ══════════ 2.3 다항식의 나눗셈·분수식 ══════════
  { id:'ch2_05',
    enter:function(E){ this.s={p:0,tgt:0,auto:false}; E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.p>=1){ s.p=0; s.tgt=0; s.auto=false; E.blip(340,0.12); } else { s.tgt=1; s.auto=false; E.blip(520,0.15); } },
    draw:function(E){ var s=this.s, ctx=E.ctx, a=2, b=3;
      var tgt=s.auto?1:(s.tgt||0); if(s.p<tgt) s.p=Math.min(tgt,s.p+0.012); if(s.auto&&s.p>=1)s.auto=false;
      var mp=Math.max(0,Math.min(1,s.p)), g=geo(E,a,b), ox=g.ox, oy=g.oy, xl=g.xlen, u=g.u, aw=a*u, bw=b*u;
      // 내부 4칸 (넓이 분해: x² · 2x · 3x · 6)
      box(ctx, ox, oy, xl, xl, '#7ab8ff', 'x²', 16);
      box(ctx, ox+xl, oy, aw, xl, '#8fe3b5', '2x');
      box(ctx, ox, oy+xl, xl, bw, '#8fe3b5', '3x');
      box(ctx, ox+xl, oy+xl, aw, bw, '#ffb27a', '6');
      // ── 변을 칸별로 분해 라벨링 (보고 바로 x+2, x+3 읽히게) ──
      // 위(가로 = 나누는 식): x²칸 위 'x', 2x칸 위 '2'  → x + 2
      ctx.textAlign='center'; ctx.font='600 15px sans-serif'; ctx.fillStyle=E.COL.accent;
      ctx.fillText('x', ox+xl/2, oy-11); ctx.fillText('2', ox+xl+aw/2, oy-11);
      ctx.globalAlpha=0.7; ctx.fillText('+', ox+xl, oy-11); ctx.globalAlpha=1;
      // 왼쪽(세로 = 몫): 위 행 'x', 아래 행 '3'  → x + 3 (미리 유추 가능)
      ctx.fillStyle='#ffd9bd';
      ctx.save(); ctx.translate(ox-13, oy+xl/2); ctx.rotate(-Math.PI/2); ctx.fillText('x',0,0); ctx.restore();
      ctx.save(); ctx.translate(ox-13, oy+xl+bw/2); ctx.rotate(-Math.PI/2); ctx.fillText('3',0,0); ctx.restore();
      ctx.globalAlpha=0.7; ctx.save(); ctx.translate(ox-13, oy+xl); ctx.rotate(-Math.PI/2); ctx.fillText('+',0,0); ctx.restore(); ctx.globalAlpha=1;
      // 바깥 측정선 + 몫 전체 ? → x+3 (두 칸 x·3 을 합치면 x+3)
      ctx.strokeStyle=E.COL.accent; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(ox-30,oy); ctx.lineTo(ox-30, oy+g.H2*mp); ctx.stroke();
      ctx.save(); ctx.translate(ox-44, oy+g.H2/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center';
      if(s.p>=1){ ctx.globalAlpha=blinkA(E); ctx.fillStyle='#ffb27a'; ctx.font='700 17px sans-serif'; ctx.fillText('x+3',0,0); ctx.globalAlpha=1; }
      else { ctx.fillStyle=E.COL.txt; ctx.font='700 18px sans-serif'; ctx.fillText('?',0,0); }
      ctx.restore();
      if(s.p<=0) tapHint(E, ox+g.W2/2, oy+g.H2+46, '▶ 나머지 변 찾기 D · 자동 S', true);
      else if(s.p>=1) tapHint(E, ox+g.W2/2, oy+g.H2+46, '↻ 다시 보기 (D)', false);
      E.big('(x² + 5x + 6) ÷ (x+2) = '+(s.p>=1?'x + 3':'?'), s.p<1?'넓이 4칸을 (x+2)로 나누면 나머지 변은?':'4칸 = x²+2x+3x+6 · 나머지 변 = x+3 ✓'); }
  },

  { id:'ch2_06',
    enter:function(E){ this.s={step:0}; E.setOn([]);
      E.quiz({q:'(x²−4)/(x−2) 를 약분하면?', choices:['x+2','x−2','x+4','(x−2)²'], answer:0, explain:'x²−4=(x+2)(x−2), (x−2) 약분 → x+2'}); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(this.s.step?520:400,0.15); },
    draw:function(E){ var s=this.s, ctx=E.ctx, step=s.step, cx=E.W/2;
      var U=Math.min(58,E.H*0.095), W=4*U, H=2*U, ox=cx-W/2, oy=E.H*0.32;   // (x+1)=4칸, (x−1)=2칸 (x=3 수치 검산)
      // 분자 직사각형
      var col=(step>=2)?'#8fe3b5':'#7ab8ff';
      box(ctx,ox,oy,W,H,col, step===0?'x² − 1':null, 16);
      if(step>=1){ ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(step>=2?'x − 1':'(x+1)(x−1)', cx, oy+H/2); ctx.textBaseline='alphabetic';
        // 윗변 = x+1 (분모와 같은 인수), 왼변 = x−1
        ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillStyle=(step>=2?'#6f6e7a':'#ffb27a'); ctx.fillText('x + 1', cx, oy-9);
        ctx.save(); ctx.translate(ox-14, oy+H/2); ctx.rotate(-Math.PI/2); ctx.fillStyle='#8fe3b5'; ctx.fillText('x − 1', 0,0); ctx.restore(); }
      // 분모 막대 (x+1)
      var dy=oy+H+22, dcol=(step>=2)?'#6f6e7a':'#f4a0c0';
      box(ctx,ox,dy,W,U*0.7,dcol,'x + 1',14);
      ctx.fillStyle='#9b99a3'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('분모', ox-30, dy+U*0.35);
      // step2: 공통 (x+1) 약분 취소선
      if(step>=2){ ctx.globalAlpha=E.blink(); ctx.strokeStyle='#f4a0c0'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(cx-30,oy-9); ctx.lineTo(cx+30,oy-9); ctx.stroke();           // 분자 x+1 취소
        ctx.beginPath(); ctx.moveTo(ox+W/2-30,dy+U*0.35); ctx.lineTo(ox+W/2+30,dy+U*0.35); ctx.stroke(); // 분모 x+1 취소
        ctx.globalAlpha=1; }
      E.tapHint(cx, dy+U+34, step<2?'▶ 다음 단계':'↻ 처음부터', step<2);
      var EQ=['(x² − 1) / (x + 1)','= (x+1)(x−1) / (x + 1)','= x − 1'];
      var SB=['분자·분모를 인수분해해 공통 인수를 찾습니다','분자 = (x+1)(x−1). 분모 (x+1)과 똑같은 인수가 보입니다','공통 (x+1) 약분 → x − 1.  (x=3 검산: 8 / 4 = 2 = 3−1 ✓)'];
      E.big(EQ[step], SB[step]); }
  }

  ];

  if(window.Engine) window.Engine.addScenes(scenes);
})();
