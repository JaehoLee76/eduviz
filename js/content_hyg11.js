/* 산업위생관리기술사 제11장 — 최신 동향과 공정별 심화(시대가 바뀌면 위험도 바뀐다). 동작만. 텍스트=content/hyg11.json */
(function(){
  var AMB='#f2bd55', ORA='#ffb27a', GRN='#8fe3b5', BLU='#7ab8ff', PNK='#f4a0c0', RED='#f0888a', TXT='#dfeefb', DIM='#9b99a3';
  // 글자 크기·간격 = H 비례 + 클램프(낮은 뷰포트에서 겹침·잘림 방지)
  function FS(H,frac,mn,mx){ return Math.max(mn, Math.min(mx, H*frac)); }
  function RR(ctx,x,y,w,h,r){ if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); } else { ctx.beginPath(); ctx.rect(x,y,w,h); } }
  // 상자 + 제목/부제(폭 자동 맞춤 — 절대 밖으로 안 나가게)
  function BX(ctx,H,x,y,w,h,c,t,s){
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=c; ctx.lineWidth=1.6; RR(ctx,x,y,w,h,8); ctx.fill(); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    function fit(txt,weight,base,mn){ var f=base; ctx.font=weight+f+'px sans-serif';
      while(f>mn && ctx.measureText(txt).width>w-12){ f--; ctx.font=weight+f+'px sans-serif'; } return f; }
    var tf=fit(t,'600 ',FS(H,0.023,12,14),8);
    ctx.fillStyle=c; ctx.font='600 '+tf+'px sans-serif';
    ctx.fillText(t, x+w/2, s? (y+h*0.42+tf*0.28) : (y+h/2+tf*0.36));
    if(s){ var sf=fit(s,'',FS(H,0.019,10,13.5),7);
      ctx.fillStyle=DIM; ctx.font=sf+'px sans-serif';
      ctx.fillText(s, x+w/2, Math.min(y+h-5, y+h*0.78+sf*0.30)); } }
  function ARROW(ctx,x1,y1,x2,y2,col){ col=col||'rgba(223,238,251,0.5)';
    ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var an=Math.atan2(y2-y1,x2-x1); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x2,y2);
    ctx.lineTo(x2-9*Math.cos(an-0.4),y2-9*Math.sin(an-0.4)); ctx.lineTo(x2-9*Math.cos(an+0.4),y2-9*Math.sin(an+0.4)); ctx.fill(); }
  // 큰 수 표기: 1,234 / 1.5×10⁶ (표시값은 전부 호출부에서 실계산)
  var SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
  function fmtN(x){ if(x>=1e6){ var e=Math.floor(Math.log(x)/Math.LN10), m=x/Math.pow(10,e);
      if(m>=9.95){ m=1; e++; } var es=''+e, su=''; for(var i=0;i<es.length;i++) su+=SUP.charAt(+es.charAt(i));
      return m.toFixed(1)+'×10'+su; }
    if(x>=1000) return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
    return (Math.round(x*10)/10)+''; }

  var scenes=[

  // 11.1 중대재해처벌법 — 경영책임자에게 묻는다 (탭 단계 · HygDoc 비교 다이어그램)
  { id:'hyg11_01',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], arrows=[], calc=[];
      // 두 법의 자리(항상 표시) — 왼쪽 산안법 축, 오른쪽 중처법 축
      boxes.push({x:0.03,y:0.31,w:0.44,h:0.105,c:BLU,t:'산업안전보건법',s:'사업주 — 현장의 구체적 안전·보건 조치의무'});
      boxes.push({x:0.53,y:0.31,w:0.44,h:0.105,c:RED,t:'중대재해처벌법',s:'경영책임자 — 안전보건 확보의무(체계)'});
      if(st>=1){ // 안전보건 확보의무 4가지(오른쪽 축)
        boxes.push({x:0.53,y:0.44,w:0.44,h:0.078,c:AMB,t:'① 안전보건관리체계 구축·이행',s:'인력·예산·전담조직·위험성평가'});
        boxes.push({x:0.53,y:0.528,w:0.44,h:0.078,c:AMB,t:'② 재해 재발방지 대책 수립·이행'});
        boxes.push({x:0.53,y:0.616,w:0.44,h:0.078,c:AMB,t:'③ 행정기관 개선·시정명령 이행'});
        boxes.push({x:0.53,y:0.704,w:0.44,h:0.078,c:AMB,t:'④ 관계 법령 의무이행의 관리상 조치',s:'점검·전문인력 배치·교육 확인'});
        arrows.push({x1:0.75,y1:0.415,x2:0.75,y2:0.44,c:'rgba(240,136,138,0.6)'}); }
      if(st>=2){ // 중대산업재해 정의 3요건(왼쪽 축)
        boxes.push({x:0.03,y:0.44,w:0.44,h:0.082,c:RED,t:'① 사망자 1명 이상'});
        boxes.push({x:0.03,y:0.532,w:0.44,h:0.082,c:ORA,t:'② 부상자 2명 이상',s:'동일 사고 · 6개월 이상 치료 필요'});
        boxes.push({x:0.03,y:0.624,w:0.44,h:0.082,c:PNK,t:'③ 직업성 질병자 3명 이상',s:'동일 유해요인 · 1년 이내 · 급성중독 등'});
        arrows.push({x1:0.25,y1:0.415,x2:0.25,y2:0.44,c:'rgba(122,184,255,0.6)'}); }
      if(st>=3){ // 처벌(하단 전폭)
        boxes.push({x:0.03,y:0.80,w:0.94,h:0.105,c:RED,t:'처벌 — 사망 시 경영책임자 1년 이상 징역 또는 10억원 이하 벌금',s:'법인 50억원 이하 벌금 · 부상·직업성 질병은 7년 이하 징역 또는 1억원 이하 벌금'}); }
      if(st>=4){ arrows.push({x1:0.47,y1:0.363,x2:0.53,y2:0.363,c:'rgba(143,227,181,0.7)',dash:true});
        calc.push({k:'적용',v:'상시 근로자 5인 미만 제외',c:BLU});
        calc.push({k:'확대',v:'2024.1.27부터 50인 미만도 적용',c:AMB});
        calc.push({k:'관계',v:'산안법=행위 규범 · 중처법=체계 규범',c:GRN}); }
      window.HygDoc(E,{ boxes:boxes, arrows:arrows, calc:calc,
        note: st>=4? '현장의 조치와 경영의 체계 — 두 겹의 방어선이 함께 갑니다' : '' });
      E.tapHint(0,0,'다음 단계',true);
      var big=['두 법은 겨누는 곳이 다릅니다','경영책임자의 의무는 네 가지입니다','중대산업재해 — 결과가 문턱을 정합니다','처벌은 경영책임자 개인에게 닿습니다','두 법은 경쟁이 아니라 이중 방어선입니다'][st];
      var sub=['산업안전보건법은 현장의 구체적 안전·보건 조치(사업주 의무)를, 중대재해처벌법은 경영책임자의 안전보건 확보의무(체계 구축)를 묻습니다. D키로 이어 보세요',
        '①안전보건관리체계 구축·이행(인력·예산·위험성평가) ②재해 재발방지 대책 ③행정기관 개선·시정명령 이행 ④안전보건 관계 법령 의무이행의 관리상 조치 — 모두 "체계"에 관한 의무입니다',
        '사망자 1명 이상, 동일 사고로 6개월 이상 치료가 필요한 부상자 2명 이상, 동일 유해요인으로 급성중독 등 직업성 질병자가 1년 이내 3명 이상 — 이 중 하나면 중대산업재해입니다',
        '사망자 발생 시 경영책임자는 1년 이상 징역 또는 10억원 이하 벌금(법인은 50억원 이하), 부상·직업성 질병은 7년 이하 징역 또는 1억원 이하 벌금입니다 — 급성중독 직업병도 처벌 대상입니다',
        '산업안전보건법이 현장의 행위를, 중대재해처벌법이 경영의 체계를 지키게 합니다 — 면접에서는 "처벌 회피가 아니라 체계 구축이 목적"이라는 균형 잡힌 견해가 좋은 평가를 받습니다'][st];
      E.big(big, sub); }
  },

  // 11.2 반도체·디스플레이 직업병 — 공정→노출→건강영향→관리 (탭 단계 · 커스텀 흐름도)
  { id:'hyg11_02',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%4; },
    draw:function(E){ var s=this.s, st=s.step, ctx=E.ctx, W=E.W, H=E.H;
      ctx.textBaseline='alphabetic';
      var rows=[
        {y:0.315, c:BLU, hdr:'공정', items:[
          ['포토','감광액·현상액'],['식각','반응성 가스'],['증착','특수가스류'],['세정','유기용제·산']]},
        {y:0.475, c:ORA, hdr:'노출 특성', items:[
          ['미량·복합','수많은 물질 동시 취급'],['부산물','반응 중 새 물질 생성'],['유지보수','설비 개방 때 노출 증가']]},
        {y:0.635, c:RED, hdr:'역학의 어려움', items:[
          ['긴 잠복기','발병까지 수년~수십 년'],['노출 재구성','과거 농도 자료 부족'],['정보 제한','영업비밀로 성분 확인 곤란']]},
        {y:0.795, c:GRN, hdr:'관리 방향', items:[
          ['정보 파악·공개','전 과정 화학물질 목록화'],['노출 최소화','밀폐·자동화·정비 절차'],['건강 추적','장기 관찰·건강 감시']]}
      ];
      var bh=H*0.105, x0=W*0.145, x1=W*0.97, hdF=FS(H,0.022,12,15);
      for(var r=0;r<rows.length && r<=st;r++){ var R=rows[r], y=R.y*H, n=R.items.length;
        var gap=W*0.015, bw=(x1-x0-(n-1)*gap)/n;
        ctx.fillStyle=R.c; ctx.font='600 '+hdF+'px sans-serif'; ctx.textAlign='left';
        ctx.fillText(R.hdr, W*0.025, y+bh*0.5+hdF*0.35);
        for(var k=0;k<n;k++){ BX(ctx,H, x0+k*(bw+gap), y, bw, bh, R.c, R.items[k][0], R.items[k][1]); }
        if(r>0){ var py=rows[r-1].y*H+bh; ARROW(ctx,(x0+x1)/2, py+2, (x0+x1)/2, y-3); }
      }
      if(st>=3){ ctx.fillStyle=DIM; ctx.font=FS(H,0.020,11,14)+'px sans-serif'; ctx.textAlign='center';
        ctx.fillText('인과가 불확실할수록 관리는 더 보수적으로 — 사전예방 원칙입니다', W/2, H*0.955); }
      E.tapHint(0,0,'다음 고리',true);
      var big=['첨단 공정 뒤에는 수많은 화학물질이 있습니다','노출은 미량이지만 복합적이고, 정비 때 커집니다','인과를 밝히기가 유난히 어렵습니다','그래서 관리는 사전예방으로 갑니다'][st];
      var sub=['반도체·디스플레이는 포토(감광액)·식각(반응성 가스)·증착(특수가스)·세정(유기용제·산) 공정에서 다양한 화학물질을 씁니다. D키로 노출의 고리를 따라가 보세요',
        '평상시엔 밀폐·자동화로 농도가 낮지만, 여러 물질에 동시에 조금씩 노출되고 공정 반응 중 부산물이 생기며, 설비를 여는 유지보수 작업에서 노출이 커집니다',
        '발병까지 잠복기가 길고, 과거 노출 농도를 되짚을 자료가 부족하며, 영업비밀로 성분 확인이 어려워 역학조사가 힘듭니다 — 일부 질병은 업무상 재해로 인정된 사례가 있습니다',
        '인과가 불확실하다고 방치하지 않고, 전 과정 화학물질을 파악·공개하고 노출을 최소화하며 건강을 장기 추적합니다 — 불확실성 아래에서는 보수적으로 관리하는 것이 원칙입니다'][st];
      E.big(big, sub); }
  },

  // 11.3 건설·조선 공정 심화 — 다변하는 현장 (탭 단계 · HygDoc 2열 비교)
  { id:'hyg11_03',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], calc=[];
      boxes.push({x:0.03,y:0.31,w:0.44,h:0.08,c:AMB,t:'건설 현장',s:'옥외 · 이동 · 다수 공종'});
      boxes.push({x:0.53,y:0.31,w:0.44,h:0.08,c:BLU,t:'조선 현장',s:'대형 구조물 · 블록 조립'});
      // 건설 유해인자
      boxes.push({x:0.03,y:0.41,w:0.44,h:0.075,c:ORA,t:'분진',s:'시멘트·용접 · 석면 해체(허가 작업)'});
      boxes.push({x:0.03,y:0.495,w:0.44,h:0.075,c:ORA,t:'소음·진동',s:'브레이커·항타·절단'});
      boxes.push({x:0.03,y:0.58,w:0.44,h:0.075,c:ORA,t:'근골격계',s:'중량물 · 반복 · 불편한 자세'});
      boxes.push({x:0.03,y:0.665,w:0.44,h:0.075,c:RED,t:'밀폐공간',s:'맨홀·정화조 — 질식 위험'});
      if(st>=1){ boxes.push({x:0.03,y:0.765,w:0.44,h:0.09,c:GRN,t:'관리',s:'습식·밀폐, 보호구, 공정별 위험성평가'}); }
      if(st>=2){ // 조선 유해인자
        boxes.push({x:0.53,y:0.41,w:0.44,h:0.075,c:PNK,t:'용접흄',s:'금속 흄·가스 — IARC 1군 발암물질'});
        boxes.push({x:0.53,y:0.495,w:0.44,h:0.075,c:PNK,t:'도장',s:'혼합 유기용제 — 스프레이 고농도'});
        boxes.push({x:0.53,y:0.58,w:0.44,h:0.075,c:RED,t:'밀폐블록',s:'환기 곤란 — 질식·화재·폭발'});
        boxes.push({x:0.53,y:0.665,w:0.44,h:0.075,c:PNK,t:'근골격계',s:'협소 공간 · 쪼그림·위보기 자세'}); }
      if(st>=3){ boxes.push({x:0.53,y:0.765,w:0.44,h:0.09,c:GRN,t:'관리',s:'밀폐공간 프로그램·강제 환기, 송기·방독 보호구'}); }
      if(st>=4){ calc.push({k:'공통 난점',v:'현장이 계속 바뀜 · 다수 공종 혼재 · 원하청 혼재',c:RED});
        calc.push({k:'열쇠',v:'작업 전 위험성평가 + 혼재작업 조정',c:GRN}); }
      window.HygDoc(E,{ boxes:boxes, calc:calc,
        note: st>=4? '고정된 공장이 아니라 매일 달라지는 현장 — 관리도 매일 갱신되어야 합니다' : '' });
      E.tapHint(0,0,'다음 현장',true);
      var big=['건설 — 하늘 아래에서 매일 바뀌는 작업장','건설의 관리 — 물과 덮개, 그리고 계획','조선 — 강철 블록 속의 위험','조선의 관리 — 공기를 넣고, 불씨를 끊는다','두 현장의 공통 난점은 "변화와 혼재"입니다'][st];
      var sub=['건설은 분진(시멘트·석면 해체)·소음·진동·근골격계에 맨홀 질식까지 겹치는 복합 현장입니다. 구조물이 올라갈수록 작업 내용도 바뀝니다. D키로 이어 보세요',
        '분진은 물을 뿌리는 습식과 밀폐로 줄이고, 석면 해체는 허가·자격 작업으로 격리하며, 공종이 바뀔 때마다 위험성평가를 다시 합니다',
        '조선은 용접흄(IARC 1군 발암물질)·도장 유기용제·밀폐블록이 삼중으로 겹칩니다 — 블록 안은 환기가 어려워 흄과 용제 증기가 고이고, 산소결핍·폭발 위험도 있습니다',
        '밀폐블록은 작업 전 산소·가스 측정과 감시인 배치(밀폐공간 프로그램), 강제 급배기, 도장 중 화기 차단, 송기마스크·방독마스크로 지킵니다',
        '두 현장 모두 장소가 계속 바뀌고 여러 공종·원하청이 한 공간에서 일합니다 — 한 회사의 관리만으론 부족하므로 작업 전 위험성평가와 혼재작업 조정·정보 공유가 열쇠입니다'][st];
      E.big(big, sub); }
  },

  // 11.4 새로운 유해인자 — 나노물질(입자 크기 슬라이더 · 표면적 실계산) + 직무스트레스·감정노동
  { id:'hyg11_04',
    enter:function(E){ var self=this; this.s={d:200};
      E.controls('<div class="ctrl"><label>입자 지름 d (nm)</label><input type="range" id="nd" min="10" max="1000" step="10" value="200"><output id="ndo">200</output></div>');
      E.bind('#nd','input',function(e){ self.s.d=+e.target.value; document.getElementById('ndo').textContent=e.target.value; });
      E.setOn([]); },
    draw:function(E){ var s=this.s, ctx=E.ctx, W=E.W, H=E.H;
      var d=s.d, d0=10000;                       // 기준: 지름 10 μm(=10000 nm) 입자 1개
      var saR=d0/d;                              // 같은 질량일 때 총 표면적 배율 = d0/d (구, 비표면적∝1/d)
      var nR=Math.pow(d0/d,3);                   // 같은 질량일 때 입자 수 배율 = (d0/d)³
      ctx.textBaseline='alphabetic';
      var R0=Math.min(W,H)*0.105, cy=H*0.44;
      var lbF=FS(H,0.021,11,15), smF=FS(H,0.019,10,13.5);
      // 왼쪽: 기준 입자 1개(10 μm)
      var lx=W*0.20;
      ctx.fillStyle='rgba(122,184,255,0.25)'; ctx.strokeStyle=BLU; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(lx,cy,R0,0,6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 '+lbF+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('지름 10 μm · 1개', lx, cy+R0+FS(H,0.032,15,20));
      // 가운데 화살표(같은 질량으로 쪼갬)
      ARROW(ctx, W*0.335, cy, W*0.415, cy, 'rgba(223,238,251,0.55)');
      ctx.fillStyle=DIM; ctx.font=smF+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('같은 질량', W*0.375, cy-FS(H,0.02,11,15));
      // 오른쪽: 같은 질량을 지름 d nm 입자로 — 개수 nR 중 최대 324개만 대표 표시(수치는 실계산 표기)
      var rx0=W*0.46, rx1=W*0.92, ry0=cy-R0*1.1, ry1=cy+R0*1.1;
      var show=Math.min(324, Math.round(nR)), cols=Math.ceil(Math.sqrt(show*(rx1-rx0)/(ry1-ry0)));
      var rowsN=Math.ceil(show/cols);
      var pr=Math.max(1.2, R0*d/d0*3);           // 표시 반지름(가시성 하한 — 개수·표면적 수치가 실값)
      ctx.fillStyle='rgba(255,178,122,0.85)';
      for(var i=0;i<show;i++){ var c=i%cols, r=Math.floor(i/cols);
        var px=rx0+(cols<2?0.5:(c+0.5)/cols)*(rx1-rx0), py=ry0+(rowsN<2?0.5:(r+0.5)/rowsN)*(ry1-ry0);
        ctx.beginPath(); ctx.arc(px,py,pr,0,6.29); ctx.fill(); }
      ctx.fillStyle=ORA; ctx.font='600 '+lbF+'px sans-serif'; ctx.textAlign='center';
      ctx.fillText('지름 '+d+' nm · '+fmtN(nR)+'개'+(nR>324?' (일부만 표시)':''), (rx0+rx1)/2, ry1+FS(H,0.032,15,20));
      // 표면적 게이지(로그 눈금 ×1~×1000) — 값은 실계산
      var gy=H*0.665, gx0=W*0.08, gx1=W*0.92, gh=FS(H,0.022,12,14);
      ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(gx0,gy,gx1-gx0,gh);
      var frac=Math.min(1, Math.log(saR)/Math.log(1000));
      ctx.fillStyle=saR>=100? RED : (saR>=30? AMB : GRN);
      ctx.fillRect(gx0,gy,(gx1-gx0)*frac,gh);
      ctx.fillStyle=DIM; ctx.font=smF+'px sans-serif'; ctx.textAlign='left';
      ctx.fillText('총 표면적 ×1', gx0, gy-FS(H,0.012,7,10));
      ctx.textAlign='right'; ctx.fillText('×1000 (로그 눈금)', gx1, gy-FS(H,0.012,7,10));
      ctx.textAlign='center'; ctx.fillStyle=TXT; ctx.font='600 '+lbF+'px sans-serif';
      ctx.fillText('표면적 ×'+fmtN(saR)+' — 반응할 수 있는 "겉면"이 이만큼 늘어납니다', W/2, gy+gh+FS(H,0.030,14,19));
      // 하단: 전통 인자를 넘어선 세 갈래
      var by=H*0.795, bh=H*0.115, bw=W*0.30, gap=W*0.015, bx0=W*0.035;
      BX(ctx,H, bx0,           by, bw, bh, ORA, '나노물질',   '질량만으론 부족 — 수·표면적 지표');
      BX(ctx,H, bx0+bw+gap,    by, bw, bh, BLU, '직무스트레스·근골격계', '과로·야간작업 — 뇌심혈관 부담');
      BX(ctx,H, bx0+2*(bw+gap),by, bw, bh, PNK, '감정노동',   '고객응대 보호 조치 — 법정 의무');
      E.big('지름 '+d+' nm → 같은 질량인데 입자 '+fmtN(nR)+'배 · 표면적 '+fmtN(saR)+'배',
        '입자가 작아질수록 같은 질량이라도 표면적이 지름에 반비례해 커져 반응성이 높아지고, 수가 세제곱으로 늘어 질량농도만으로는 노출을 놓칩니다 — 슬라이더로 지름을 줄여 보세요'); }
  },

  // 11.5 기술사의 시야 — 사후 대응에서 사전 예방으로 (탭 단계 · HygDoc 패러다임 전환)
  { id:'hyg11_05',
    enter:function(E){ this.s={step:0, auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; },
    draw:function(E){ var s=this.s, st=s.step;
      var boxes=[], arrows=[], calc=[];
      boxes.push({x:0.06,y:0.315,w:0.38,h:0.125,c:RED,t:'사후 대응',s:'사고가 난 뒤 조사·처벌·보상'});
      boxes.push({x:0.56,y:0.315,w:0.38,h:0.125,c:GRN,t:'사전 예방',s:'위험을 미리 찾아 줄인다'});
      arrows.push({x1:0.455,y1:0.378,x2:0.545,y2:0.378,c:'rgba(143,227,181,0.8)'});
      var pil=[
        {c:AMB,t:'위험성평가',s:'찾고 → 줄이고 → 기록'},
        {c:BLU,t:'ISO 45001',s:'PDCA 경영시스템 · 리더십'},
        {c:ORA,t:'데이터 기반',s:'측정·건진·아차사고 신호'},
        {c:PNK,t:'근로자 참여',s:'현장을 아는 사람의 눈'}
      ];
      for(var i=0;i<pil.length && i<st;i++){
        boxes.push({x:0.03+i*0.24, y:0.55, w:0.215, h:0.16, c:pil[i].c, t:pil[i].t, s:pil[i].s});
        arrows.push({x1:0.75,y1:0.44,x2:0.138+i*0.24,y2:0.55,c:'rgba(223,238,251,0.30)',dash:true}); }
      if(st>=4){ calc.push({k:'패러다임',v:'처벌 회피가 아니라 위험 감소가 목적',c:AMB});
        calc.push({k:'관통 원칙',v:'예측 → 측정 → 평가 → 관리',c:GRN}); }
      window.HygDoc(E,{ boxes:boxes, arrows:arrows, calc:calc,
        note: st>=4? '측정하고, 평가하고, 관리한다 — 열한 개 장을 관통한 예방의 문법입니다' : '' });
      E.tapHint(0,0,'다음 기둥',true);
      var big=['무게중심이 "사고 뒤"에서 "사고 전"으로 옮겨 갑니다','첫째 기둥 — 위험성평가','둘째 기둥 — 안전보건경영시스템','셋째 기둥 — 데이터가 위험을 먼저 말합니다','넷째 기둥 — 현장을 아는 사람이 참여해야 합니다'][st];
      var sub=['사고가 난 뒤 처벌·보상하는 체계만으로는 생명을 되돌릴 수 없습니다 — 제도의 무게중심이 사전 예방으로 이동해 왔습니다. D키로 네 기둥을 세워 보세요',
        '위험성평가는 유해·위험요인을 찾아 가능성과 중대성으로 평가하고, 감소대책을 실행한 뒤 기록하는 상시 순환입니다 — 사전 예방의 출발점이자 법적 의무입니다',
        'ISO 45001은 안전보건경영시스템의 국제표준으로, 최고경영자의 리더십 아래 계획(P)–실행(D)–점검(C)–개선(A)을 순환시킵니다 — 일회성 점검이 아니라 경영의 일부로 만듭니다',
        '작업환경측정·건강진단·아차사고 보고가 쌓이면 사고가 나기 전에 위험의 신호가 보입니다 — 데이터를 모으고 추세를 읽는 것이 예방의 눈입니다',
        '위험을 가장 잘 아는 사람은 그 일을 매일 하는 근로자입니다 — 의견 청취와 참여 없는 체계는 서류로만 남습니다. 예측하고, 측정하고, 평가하고, 관리한다 — 이것이 산업위생의 문법입니다'][st];
      E.big(big, sub); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
