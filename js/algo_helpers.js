/* 알고리즘 트랙 공용 시각화 헬퍼 (window.AV) — 전 장(2~8장) 재사용
   engine.js 다음, content_algoN.js 이전에 로드. 캔버스 그리기 원자(배열·노드·화살표·포인터·막대). */
(function(global){
  var TAU=Math.PI*2;

  function roundRect(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);} else { ctx.beginPath(); ctx.rect(x,y,w,h); } }

  // 배열 박스: vals 배열, opts.hl(i)→{fill,stroke,text,tag} 강조 콜백
  function arr(E, vals, opts){ opts=opts||{}; var ctx=E.ctx, n=vals.length,
      bw=Math.min(opts.bw||60, (E.W*0.82)/n), gap=opts.gap!=null?opts.gap:8,
      total=n*bw+(n-1)*gap, x0=(opts.cx||E.W/2)-total/2, y=opts.y||E.H*0.42, boxes=[];
    for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), hl=opts.hl&&opts.hl(i); boxes.push({x:x,cx:x+bw/2,y:y,bw:bw});
      ctx.fillStyle=hl&&hl.fill?hl.fill:'rgba(122,184,255,0.14)'; ctx.strokeStyle=hl&&hl.stroke?hl.stroke:'#7ab8ff'; ctx.lineWidth=2;
      roundRect(ctx,x,y,bw,bw,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=hl&&hl.text?hl.text:'#dfeefb'; ctx.font='600 '+Math.round(bw*0.34)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(vals[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
      if(opts.idx){ ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText((opts.idxBase||0)+i, x+bw/2, y+bw+16); }
      if(hl&&hl.tag){ ctx.fillStyle=hl.stroke||'#7ab8ff'; ctx.font='600 12px sans-serif'; ctx.fillText(hl.tag, x+bw/2, y-10); }
    }
    return {x0:x0,y:y,bw:bw,gap:gap,boxes:boxes,right:x0+total};
  }

  // 화살표 (픽셀 좌표)
  function arrow(ctx,x1,y1,x2,y2,col,w){ ctx.strokeStyle=col; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-11*Math.cos(a-0.4),y2-11*Math.sin(a-0.4)); ctx.lineTo(x2-11*Math.cos(a+0.4),y2-11*Math.sin(a+0.4)); ctx.fill(); }

  // 원형 노드 (트리·그래프·연결리스트)
  function node(E,x,y,val,opts){ opts=opts||{}; var ctx=E.ctx, r=opts.r||22;
    ctx.fillStyle=opts.fill||'rgba(122,184,255,0.18)'; ctx.strokeStyle=opts.stroke||'#7ab8ff'; ctx.lineWidth=opts.lw||2;
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); ctx.stroke();
    if(val!=null){ ctx.fillStyle=opts.text||'#dfeefb'; ctx.font='600 '+(opts.fs||16)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(val,x,y); ctx.textBaseline='alphabetic'; }
    if(opts.tag){ ctx.fillStyle=opts.stroke||'#7ab8ff'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(opts.tag, x, y-r-8); } }

  // 포인터 라벨 (▲ + 글자)
  function pointer(E,x,y,label,col){ var ctx=E.ctx; col=col||'#ffb27a';
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-7,y+11); ctx.lineTo(x+7,y+11); ctx.closePath(); ctx.fill();
    ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(label, x, y+26); }

  // 막대 (정렬용): vals, opts.hl(i)→col
  function bars(E, vals, opts){ opts=opts||{}; var ctx=E.ctx, n=vals.length, maxV=Math.max.apply(null,vals),
      bw=Math.min(opts.bw||40,(E.W*0.8)/n), gap=opts.gap!=null?opts.gap:6, total=n*bw+(n-1)*gap,
      x0=(opts.cx||E.W/2)-total/2, baseY=opts.baseY||E.H*0.66, maxH=opts.maxH||E.H*0.38;
    for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), h=vals[i]/maxV*maxH, col=(opts.hl&&opts.hl(i))||'#7ab8ff';
      ctx.fillStyle=col.replace? col : '#7ab8ff'; ctx.globalAlpha=0.45; ctx.fillRect(x,baseY-h,bw,h); ctx.globalAlpha=1;
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(x,baseY-h,bw,h);
      if(opts.label){ ctx.fillStyle='#9b99a3'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(vals[i], x+bw/2, baseY+14); } }
    return {x0:x0,baseY:baseY,bw:bw,gap:gap}; }

  global.AV = { arr:arr, arrow:arrow, node:node, pointer:pointer, bars:bars, TAU:TAU };
})(window);
