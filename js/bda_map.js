/* EduViz — 빅데이터 트랙 공용 '개념 체계도' 렌더러
   © 2026 JaehoLee76. 무단 복제·재배포·스크래핑·AI 학습 사용 금지. [WM:JHL2026-7a3f9c]

   ADP 필기 이론에는 계산할 수치가 없고 '분류·정의·용어'만 있는 대목이 많습니다.
   그런 개념은 억지로 애니메이션을 붙이는 대신 이 렌더러로 구조를 보여 줍니다.

   window.BdaMap(E, cfg)
     cfg = {
       title : '상단 제목',
       sub   : '부제(선택)',
       cols  : [ { t:'상위 개념', c:'#색', items:[ {t:'항목명', s:'한 줄 구분점'}, ... ] }, ... ],
       focus : 정수 | -1     // 강조할 열 인덱스. -1이면 전체 균등
       foot  : '하단 한 줄(선택)'
     }
   - focus를 tap으로 돌리면 열 하나씩 짚어 갈 수 있습니다(장면 쪽에서 s.step으로 관리).
   - 글자는 상자 폭에 맞춰 자동으로 줄지만 11px 밑으로는 내려가지 않습니다(전 트랙 규칙).
   - 항목이 많아 자리가 모자라면 부제(s)를 먼저 접고, 그래도 모자라면 행 높이를 줄입니다.
*/
(function(){
  var TXT='#dfeefb', DIM='#9b99a3', MINF=11;

  function rr(ctx,x,y,w,h,r){
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
    else { ctx.beginPath(); ctx.rect(x,y,w,h); }
  }
  // 폭에 맞게 폰트를 줄이되 11px 미만으로는 내려가지 않습니다. 그래도 넘치면 말줄임.
  function fit(ctx,txt,weight,base,maxW){
    var f=base; ctx.font=weight+f+'px sans-serif';
    // f가 11.5처럼 소수일 때 그냥 1씩 빼면 10.5로 내려가 하한을 뚫습니다.
    // 한 걸음마다 MINF로 잘라 주고, 하한에 닿으면 멈춥니다(모자라면 말줄임으로 처리).
    while(f>MINF && ctx.measureText(txt).width>maxW){
      f=Math.max(MINF, f-1); ctx.font=weight+f+'px sans-serif';
      if(f<=MINF) break;
    }
    return f;
  }
  function clip(ctx,txt,maxW){
    if(ctx.measureText(txt).width<=maxW) return txt;
    var s=txt;
    while(s.length>1 && ctx.measureText(s+'…').width>maxW) s=s.slice(0,-1);
    return s+'…';
  }

  window.BdaMap = function(E, cfg){
    var ctx=E.ctx, W=E.W, H=E.H, cx=W/2;
    var cols=cfg.cols||[], n=cols.length; if(!n) return;
    var focus=(typeof cfg.focus==='number')? cfg.focus : -1;

    ctx.textBaseline='alphabetic'; ctx.textAlign='center';
    var tf=fit(ctx,cfg.title||'','600 ',18,W*0.92);
    ctx.fillStyle=TXT; ctx.font='600 '+tf+'px sans-serif';
    ctx.fillText(cfg.title||'', cx, H*0.11);
    var top=H*0.11;
    if(cfg.sub){
      var sf=fit(ctx,cfg.sub,'',13,W*0.92);
      ctx.fillStyle=DIM; ctx.font=sf+'px sans-serif';
      ctx.fillText(clip(ctx,cfg.sub,W*0.92), cx, top+20); top+=20;
    }

    var headY=top+30;
    var botLimit=H*(cfg.foot? 0.88 : 0.95);
    var avail=botLimit-headY-14;

    // 가장 항목이 많은 열을 기준으로 행 높이를 정합니다.
    var maxItems=1, i, k;
    for(i=0;i<n;i++) maxItems=Math.max(maxItems, cols[i].items.length);
    var withSub=false;
    for(i=0;i<n;i++) for(k=0;k<cols[i].items.length;k++) if(cols[i].items[k].s) withSub=true;

    var rowH=avail/maxItems;
    // 부제까지 넣으려면 한 행에 최소 34px은 필요합니다. 모자라면 부제를 접습니다.
    if(withSub && rowH<34) withSub=false;
    rowH=Math.max(20, Math.min(withSub?44:30, rowH));

    var x0=W*0.04, colW=(W*0.92)/n;

    for(i=0;i<n;i++){
      var col=cols[i], c=col.c||'#ff7ab8';
      var on=(focus<0 || focus===i);
      var cxi=x0+i*colW+colW*0.5;

      ctx.globalAlpha = on? 1 : 0.34;

      // 열 제목
      var hf=fit(ctx,col.t,'600 ',15,colW*0.94);
      ctx.fillStyle=c; ctx.font='600 '+hf+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText(clip(ctx,col.t,colW*0.94), cxi, headY);

      // 열 사이 구분선
      if(i<n-1){
        ctx.globalAlpha=0.18; ctx.strokeStyle=TXT; ctx.lineWidth=1;
        var sx=x0+(i+1)*colW;
        ctx.beginPath(); ctx.moveTo(sx, headY-14); ctx.lineTo(sx, headY+Math.min(avail, cols[i].items.length*rowH)+4); ctx.stroke();
        ctx.globalAlpha = on? 1 : 0.34;
      }

      for(k=0;k<col.items.length;k++){
        var it=col.items[k];
        var y=headY+12+k*rowH, bw=colW*0.90, bx=cxi-bw/2, bh=rowH-8;
        if(y+bh>botLimit) break;

        ctx.fillStyle= on? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)';
        ctx.strokeStyle=c; ctx.lineWidth= on? 1.5 : 1;
        rr(ctx,bx,y,bw,bh,7); ctx.fill(); ctx.stroke();

        var mw=bw-12;
        if(withSub && it.s){
          var f1=fit(ctx,it.t,'600 ',13,mw);
          ctx.fillStyle=TXT; ctx.font='600 '+f1+'px sans-serif';
          ctx.fillText(clip(ctx,it.t,mw), cxi, y+bh*0.44);
          var f2=fit(ctx,it.s,'',11,mw);
          ctx.fillStyle=DIM; ctx.font=f2+'px sans-serif';
          ctx.fillText(clip(ctx,it.s,mw), cxi, y+bh*0.82);
        } else {
          var f3=fit(ctx,it.t,'',12.5,mw);
          ctx.fillStyle=TXT; ctx.font=f3+'px sans-serif';
          ctx.fillText(clip(ctx,it.t,mw), cxi, y+bh/2+f3*0.35);
        }
      }
      ctx.globalAlpha=1;
    }

    if(cfg.foot){
      var ff=fit(ctx,cfg.foot,'',12,W*0.92);
      ctx.fillStyle=DIM; ctx.font=ff+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText(clip(ctx,cfg.foot,W*0.92), cx, H*0.95);
    }
  };
})();
