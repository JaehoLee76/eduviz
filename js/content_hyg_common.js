/* 산업위생기술사 — 공용 렌더러 (HygMap: 학습 지도 / HygDoc: 해설·코드·다이어그램·계산값)
   알고리즘 트랙의 AlgoMap/AlgoDoc과 동일 설계의 독립 버전(hygiene.html 전용 로드).
   모든 표시 수치는 호출부 draw에서 실제 계산해 넘긴다. */
(function(){
  var DIM='#9b99a3';

  // 학습 지도: cfg = { title, sub, stages:[{c,t,items:[]}], foot }
  window.HygMap = function(E, cfg){ var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
    function rr(x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle='#dfeefb'; ctx.font='600 19px sans-serif'; ctx.fillText(cfg.title, cx, H*0.11);
    if(cfg.sub){ ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif'; ctx.fillText(cfg.sub, cx, H*0.11+22); }
    var st=cfg.stages, n=st.length, x0=W*0.05, colW=W*0.90/n, top=H*0.25;
    var maxItems=0; for(var q=0;q<n;q++) maxItems=Math.max(maxItems, st[q].items.length);
    var rowH=Math.min(38, (H*0.58)/Math.max(1,maxItems));
    for(var i=0;i<n;i++){ var s=st[i], cxi=x0+i*colW+colW*0.5;
      ctx.fillStyle=s.c; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.t, cxi, top);
      if(i<n-1){ var ax=x0+(i+1)*colW-colW*0.03; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(ax-12, top-5); ctx.lineTo(ax-2, top-5); ctx.lineTo(ax-7, top-9); ctx.moveTo(ax-2,top-5); ctx.lineTo(ax-7,top-1); ctx.stroke(); }
      for(var k=0;k<s.items.length;k++){ var y=top+20+k*rowH, bw=colW*0.86, bx=cxi-bw/2;
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=s.c; ctx.lineWidth=1.5; rr(bx,y,bw,rowH-8,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeefb'; ctx.font='12.5px sans-serif'; ctx.textAlign='center'; ctx.fillText(s.items[k], cxi, y+(rowH-8)/2+4); } }
    if(cfg.foot){ ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(cfg.foot, cx, H*0.95); } };

  // 해설 장면: cfg = { title, sub, code:[..], actLine, codeTitle, boxes:[{x,y,w,h,c,t,s}], arrows:[{x1,y1,x2,y2,c,dash}], calc:[{k,v,c}], note }
  // 좌표는 화면 비율(0~1). calc 값은 반드시 draw에서 실계산한 문자열.
  window.HygDoc = function(E, cfg){ var ctx=E.ctx, W=E.W, H=E.H, TXT='#dfeefb', DM='#9b99a3';
    function RR(x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}else{ctx.beginPath();ctx.rect(x,y,w,h);} }
    ctx.textBaseline='alphabetic';
    if(cfg.title){ ctx.fillStyle=TXT; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(cfg.title, W/2, H*0.155); }   // 상단 DOM 제목바 아래로
    if(cfg.sub){ ctx.fillStyle=DM; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(cfg.sub, W/2, H*0.155+21); }
    var topY=H*0.22;
    if(cfg.code && cfg.code.length){
      var cx=W*0.05, cw=(cfg.boxes||cfg.calc)?W*0.45:W*0.90, lh=Math.min(21,(H*0.66)/cfg.code.length), pad=12;
      var ch=cfg.code.length*lh+pad*2+(cfg.codeTitle?22:0);
      ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(242,189,85,0.30)'; ctx.lineWidth=1;
      RR(cx,topY,cw,ch,8); ctx.fill(); ctx.stroke();
      var yy=topY+pad+(cfg.codeTitle?22:0)+11;
      if(cfg.codeTitle){ ctx.fillStyle='#f2bd55'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(cfg.codeTitle, cx+pad, topY+pad+11); }
      ctx.font=Math.max(10,Math.min(13,lh-8))+'px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
      for(var i=0;i<cfg.code.length;i++){
        if(i===cfg.actLine){ ctx.fillStyle='rgba(255,178,122,0.16)'; ctx.fillRect(cx+3, yy+i*lh-lh+5, cw-6, lh-2); ctx.fillStyle='#ffb27a'; ctx.fillRect(cx+3, yy+i*lh-lh+5, 3, lh-2); }
        ctx.fillStyle=(i===cfg.actLine)?'#ffd27a':'#cfd8e6'; ctx.fillText(cfg.code[i], cx+pad, yy+i*lh);
      }
    }
    if(cfg.boxes){
      // 글자 자동 맞춤: 상자 폭·높이에 맞춰 가능한 크게, 절대 밖으로 안 나가게
      function fitFont(txt, weight, base, min, maxW){ if(!txt) return base; var f=base;
        ctx.font=weight+f+'px sans-serif';
        while(f>min && ctx.measureText(txt).width>maxW){ f--; ctx.font=weight+f+'px sans-serif'; }
        return f; }
      for(var b=0;b<cfg.boxes.length;b++){ var B=cfg.boxes[b], x=B.x*W, y=B.y*H, w=B.w*W, h=B.h*H, c=B.c||'#7ab8ff';
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=c; ctx.lineWidth=1.6; RR(x,y,w,h,8); ctx.fill(); ctx.stroke();
        ctx.textAlign='center';
        var maxW=w-14;
        var tBase=Math.min(16, Math.max(11, Math.floor(h*(B.s?0.34:0.42))));   // 상자 높이 비례(크게 시작)
        var sBase=Math.min(13, Math.max(9,  Math.floor(h*0.26)));
        var tf=fitFont(B.t, '600 ', tBase, 9, maxW);
        ctx.fillStyle=c; ctx.font='600 '+tf+'px sans-serif';
        ctx.fillText(B.t||'', x+w/2, B.s? (y+h*0.42+tf*0.28) : (y+h/2+tf*0.36));
        if(B.s){ var sf=fitFont(B.s, '', sBase, 8, maxW);
          ctx.fillStyle=DM; ctx.font=sf+'px sans-serif';
          ctx.fillText(B.s, x+w/2, Math.min(y+h-5, y+h*0.78+sf*0.30)); } } }
    if(cfg.arrows){ for(var a=0;a<cfg.arrows.length;a++){ var A=cfg.arrows[a], x1=A.x1*W,y1=A.y1*H,x2=A.x2*W,y2=A.y2*H, col=A.c||'rgba(223,238,251,0.5)';
      ctx.strokeStyle=col; ctx.lineWidth=1.8; if(A.dash)ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
      var an=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(an-0.4),y2-9*Math.sin(an-0.4)); ctx.lineTo(x2-9*Math.cos(an+0.4),y2-9*Math.sin(an+0.4)); ctx.fill(); } }
    if(cfg.calc && cfg.calc.length){ ctx.textBaseline='alphabetic';
      var lf='13px sans-serif', vf='600 13px ui-monospace,Menlo,Consolas,monospace';
      var segs=cfg.calc.map(function(K){ ctx.font=lf; var lw=ctx.measureText(K.k+' ').width; ctx.font=vf; var vw=ctx.measureText(K.v).width; return {K:K, lw:lw, w:lw+vw+20}; });
      var maxW=W*0.92, lines=[[]], acc=0;
      segs.forEach(function(sg){ if(acc+sg.w>maxW && lines[lines.length-1].length){ lines.push([]); acc=0; } lines[lines.length-1].push(sg); acc+=sg.w; });
      var lineH=21, y0=H*0.90-(lines.length-1)*lineH;
      lines.forEach(function(ln,li){ var tot=0; ln.forEach(function(sg){tot+=sg.w;}); var x=(W-tot)/2, y=y0+li*lineH;
        ln.forEach(function(sg){ ctx.textAlign='left'; ctx.font=lf; ctx.fillStyle=DM; ctx.fillText(sg.K.k+' ', x, y);
          ctx.font=vf; ctx.fillStyle=sg.K.c||'#7ee0b0'; ctx.fillText(sg.K.v, x+sg.lw, y); x+=sg.w; }); }); }
    if(cfg.note){ ctx.fillStyle=DM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(cfg.note, W/2, H*0.955); }
  };
})();
