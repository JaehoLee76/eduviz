/* 인공지능 제8장 — CNN(합성곱 신경망): 합성곱·필터(특징검출)·풀링·특징 계층·전체 흐름
   동작(behavior)만. 텍스트=content/ai8.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 합성곱 내적·풀링 최댓값·특징맵·에지맵 값은 전부 draw()에서 실제로 계산
   (작은 결정적 격자 이미지에 필터를 실제로 합성곱). 난수 표시·하드코딩 금지. */
(function(){
  var CYA='#3dd6dc', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ── 결정적 6×6 명암 이미지(0~9). 왼쪽 밝음 / 오른쪽 어둠 → 가운데 세로 에지가 보임 ──
  var IMG6 = [
    [9,9,8,2,1,1],
    [9,8,8,3,1,0],
    [8,9,7,2,2,1],
    [9,8,8,3,1,1],
    [8,8,9,2,1,0],
    [9,9,8,3,2,1]
  ];
  // ── ai8_01용 3×3 평균/블러 필터(특징 추출 합성곱 시연) ──
  var BOX3 = [[1,1,1],[1,1,1],[1,1,1]]; // 합=9 → 평균
  // ── 세로 에지검출(소벨 유사) 필터 ──
  var EDGEV = [[-1,0,1],[-2,0,2],[-1,0,1]];

  // 한 위치에서의 합성곱(내적) — 실제 계산
  function conv1(img,fil,r,c){ var s=0; for(var i=0;i<3;i++) for(var j=0;j<3;j++) s+=img[r+i][c+j]*fil[i][j]; return s; }
  // valid 합성곱 전체 맵 (img:6×6, 3×3필터 → 4×4)
  function convMap(img,fil,div){ var H=img.length-2, W=img[0].length-2, out=[]; for(var r=0;r<H;r++){ out.push([]); for(var c=0;c<W;c++){ var v=conv1(img,fil,r,c); if(div)v/=div; out[r].push(v); } } return out; }
  // 2×2 max pooling (stride 2) — 실제 최댓값
  function maxPool(map){ var H=map.length, W=map[0].length, oH=Math.floor(H/2), oW=Math.floor(W/2), out=[]; for(var r=0;r<oH;r++){ out.push([]); for(var c=0;c<oW;c++){ var m=-1e9; for(var i=0;i<2;i++) for(var j=0;j<2;j++){ var v=map[r*2+i][c*2+j]; if(v>m)m=v; } out[r].push(m); } } return out; }

  // 격자 그리기(명암 셀) — vmax로 정규화해 흑백
  function drawGrid(ctx,x0,y0,cell,grid,vmin,vmax,opts){ opts=opts||{}; var H=grid.length, W=grid[0].length;
    for(var r=0;r<H;r++) for(var c=0;c<W;c++){ var v=grid[r][c], t=(v-vmin)/(vmax-vmin||1); t=t<0?0:(t>1?1:t);
      var g=Math.round(t*255); ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(x0+c*cell,y0+r*cell,cell-1,cell-1);
      if(opts.nums){ ctx.fillStyle=t>0.5?'#111':'#ddd'; ctx.font='600 '+Math.round(cell*0.4)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(opts.fixed?v.toFixed(0):(''+Math.round(v)), x0+c*cell+cell/2, y0+r*cell+cell/2); } }
    ctx.textBaseline='alphabetic';
    if(opts.border){ ctx.strokeStyle=opts.border; ctx.lineWidth=1; ctx.strokeRect(x0-0.5,y0-0.5,W*cell,H*cell); }
  }

  var scenes = [

  // ══════════ 1. 합성곱 — 필터를 슬라이드하며 내적 ══════════
  { id:'ai8_01',
    enter:function(E){ var self=this; this.s={pos:0};
      // 4×4 = 16 위치. 슬라이더로 0..15
      E.controls('<div class="ctrl"><label>필터 위치 (0~15)</label><input type="range" id="pp" min="0" max="15" step="1" value="0"><output id="ppo">0</output></div>');
      E.bind('#pp','input',function(e){ self.s.pos=+e.target.value; document.getElementById('ppo').textContent=e.target.value; E.blip(340+self.s.pos*8,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var fr=Math.floor(s.pos/4), fc=s.pos%4;            // 필터 좌상단 (행,열)
      var img=IMG6, fil=BOX3, div=9;                      // 평균(블러) 필터
      var fmap=convMap(img,fil,div);                      // 4×4 특징맵(실계산)
      var val=conv1(img,fil,fr,fc)/div;                   // 현재 위치 내적/9

      // 입력 이미지(6×6)
      var cell=Math.min(W*0.06,H*0.10), ix=W*0.08, iy=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('입력 이미지 6×6', ix, iy-12);
      drawGrid(ctx,ix,iy,cell,img,0,9,{nums:true,border:'rgba(61,214,220,0.35)'});
      // 필터 창(3×3) 강조 + 패치 값 곱셈 표시
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.strokeRect(ix+fc*cell-1, iy+fr*cell-1, 3*cell+1, 3*cell+1);

      // 필터(3×3) 별도 표시
      var fx=W*0.50, fy=H*0.24, fc2=Math.min(W*0.045,H*0.075);
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.fillText('필터 3×3 (평균)', fx, fy-12);
      for(var r=0;r<3;r++) for(var c=0;c<3;c++){ ctx.fillStyle='rgba(255,210,122,0.14)'; ctx.fillRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2);
        ctx.strokeStyle=GLD; ctx.lineWidth=1; ctx.strokeRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2);
        ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('1/9', fx+c*fc2+fc2/2, fy+r*fc2+fc2/2); }
      ctx.textBaseline='alphabetic';

      // 계산식(실제 패치 값으로)
      var terms=[], px=fx, py=fy+3*fc2+34; for(r=0;r<3;r++) for(c=0;c<3;c++) terms.push(img[fr+r][fc+c]);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('합성곱 = (패치 합)/9', px, py);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('= ('+terms.join('+')+') / 9', px, py+22);
      var sum=terms.reduce(function(a,b){return a+b;},0);
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif';
      ctx.fillText('= '+sum+' / 9 = '+val.toFixed(2), px, py+46);

      // 출력 특징맵(4×4) — 현재 셀 강조
      var ocell=Math.min(W*0.055,H*0.09), ox=W*0.74, oy=H*0.30;
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('특징맵 4×4', ox, oy-12);
      drawGrid(ctx,ox,oy,ocell,fmap,0,9,{nums:true,border:'rgba(126,224,176,0.35)'});
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.strokeRect(ox+fc*ocell-1, oy+fr*ocell-1, ocell, ocell);

      E.tapHint(W/2, H*0.93, '슬라이더로 필터를 슬라이드 — 각 위치의 합성곱값이 특징맵에 채워집니다', true);
      E.big('합성곱(Convolution) — 필터를 슬라이드', '작은 필터(3×3)를 이미지 위로 한 칸씩 미끄러뜨리며, 겹친 9개 값의 가중합(내적)을 구해 특징맵 한 칸에 적습니다. 16번 미끄러지면 4×4 특징맵이 완성되죠. 같은 필터를 모든 위치에 쓰는 것 — 이것이 ‘파라미터 공유’입니다.'); }
  },

  // ══════════ 2. 필터 = 특징 검출(에지검출) ══════════
  { id:'ai8_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var img=IMG6, edge=convMap(img,EDGEV,1);            // 세로 에지맵(실계산, 음수 가능)
      // 절댓값으로 에지 세기 시각화
      var amax=0,r,c; for(r=0;r<edge.length;r++) for(c=0;c<edge[0].length;c++){ var a=Math.abs(edge[r][c]); if(a>amax)amax=a; }

      var cell=Math.min(W*0.058,H*0.095), iy=H*0.30;
      // 원본
      var ix=W*0.08;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('원본 이미지 6×6', ix, iy-12);
      drawGrid(ctx,ix,iy,cell,img,0,9,{border:'rgba(61,214,220,0.35)'});

      // 필터
      var fx=W*0.40, fy=H*0.30, fc2=Math.min(W*0.05,H*0.082);
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('세로 에지 필터', fx, fy-12);
      for(r=0;r<3;r++) for(c=0;c<3;c++){ var fv=EDGEV[r][c]; ctx.fillStyle = fv<0?'rgba(240,136,138,0.22)':(fv>0?'rgba(126,224,176,0.22)':'rgba(255,255,255,0.05)');
        ctx.fillRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2); ctx.strokeStyle=GLD; ctx.lineWidth=1; ctx.strokeRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2);
        ctx.fillStyle = fv<0?RED:(fv>0?GRN:DIM); ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+fv, fx+c*fc2+fc2/2, fy+r*fc2+fc2/2); }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('왼쪽 − , 오른쪽 +', fx+1.5*fc2, fy+3*fc2+20);
      ctx.fillText('→ 좌우 밝기차 측정', fx+1.5*fc2, fy+3*fc2+38);

      // ⊗ 표시
      ctx.fillStyle=DIM; ctx.font='600 24px sans-serif'; ctx.textAlign='center'; ctx.fillText('⊗', W*0.345, iy+3*cell);

      // 에지맵(4×4) — |값| 밝게
      var ox=W*0.70, oy=H*0.30, ocell=cell;
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('에지맵 4×4', ox, oy-12);
      for(r=0;r<edge.length;r++) for(c=0;c<edge[0].length;c++){ var t=Math.abs(edge[r][c])/(amax||1), g=Math.round(t*255);
        ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(ox+c*ocell,oy+r*ocell,ocell-1,ocell-1);
        ctx.fillStyle=t>0.5?'#111':'#bbb'; ctx.font='600 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+Math.round(edge[r][c]), ox+c*ocell+ocell/2, oy+r*ocell+ocell/2); }
      ctx.textBaseline='alphabetic';
      ctx.strokeStyle='rgba(126,224,176,0.35)'; ctx.lineWidth=1; ctx.strokeRect(ox-0.5,oy-0.5,edge[0].length*ocell,edge.length*ocell);

      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('밝기가 급변하는 세로선 자리(가운데)에서 값이 크게 튑니다 = 에지 검출!', W/2, H*0.78);

      E.tapHint(W/2, H*0.90, '같은 필터를 전 위치에 합성곱 → 그 필터가 찾는 특징(여기선 세로 에지)이 드러납니다', false);
      E.big('필터 = 특징 검출기', '필터의 숫자 패턴이 곧 ‘무엇을 찾을지’입니다. 왼쪽 −, 오른쪽 + 인 이 필터는 좌우 밝기차가 큰 곳 — 세로 에지 — 에서 큰 값을 냅니다. 학습이란 이 필터 숫자들을 데이터로부터 알아서 정하는 일이죠. 사람이 정하지 않습니다.'); }
  },

  // ══════════ 3. 풀링 — 2×2 max pooling ══════════
  { id:'ai8_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      // 특징맵 = 에지맵의 |값| (4×4, 정수). 풀링 입력
      var edge=convMap(IMG6,EDGEV,1), fmap=[], r,c;
      for(r=0;r<edge.length;r++){ fmap.push([]); for(c=0;c<edge[0].length;c++) fmap[r].push(Math.abs(edge[r][c])); }
      var pooled=maxPool(fmap);                            // 2×2 → 2×2 (실측 최댓값)
      var vmax=0; for(r=0;r<fmap.length;r++) for(c=0;c<fmap[0].length;c++) if(fmap[r][c]>vmax)vmax=fmap[r][c];

      var cell=Math.min(W*0.066,H*0.11), ix=W*0.10, iy=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('특징맵 4×4', ix, iy-12);
      drawGrid(ctx,ix,iy,cell,fmap,0,vmax,{nums:true,border:'rgba(61,214,220,0.30)'});
      // 2×2 풀 영역 색칠 테두리 + 각 영역 최댓값 셀 강조
      var cols=[GLD,GRN,BLU,PNK];
      for(var pr=0;pr<2;pr++) for(var pc=0;pc<2;pc++){ var col=cols[pr*2+pc];
        ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.strokeRect(ix+pc*2*cell, iy+pr*2*cell, 2*cell, 2*cell);
        // 최댓값 위치 찾아 채움
        var bm=-1,bi=0,bj=0; for(var i=0;i<2;i++) for(var j=0;j<2;j++){ var v=fmap[pr*2+i][pc*2+j]; if(v>bm){bm=v;bi=i;bj=j;} }
        ctx.strokeStyle=col; ctx.lineWidth=3; ctx.strokeRect(ix+(pc*2+bj)*cell, iy+(pr*2+bi)*cell, cell-1, cell-1);
      }

      // 화살표
      ctx.fillStyle=DIM; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('→', W*0.55, iy+2*cell);
      ctx.font='12px sans-serif'; ctx.fillText('2×2 최댓값', W*0.55, iy+2*cell+22);

      // 풀링 결과(2×2)
      var ox=W*0.66, oy=iy+cell*0.5, ocell=cell*1.3;
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('풀링 결과 2×2', ox, oy-12);
      for(pr=0;pr<2;pr++) for(pc=0;pc<2;pc++){ var col2=cols[pr*2+pc], t=pooled[pr][pc]/(vmax||1), g=Math.round(t*255);
        ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(ox+pc*ocell,oy+pr*ocell,ocell-2,ocell-2);
        ctx.strokeStyle=col2; ctx.lineWidth=2.5; ctx.strokeRect(ox+pc*ocell,oy+pr*ocell,ocell-2,ocell-2);
        ctx.fillStyle=t>0.5?'#111':'#eee'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+pooled[pr][pc], ox+pc*ocell+ocell/2, oy+pr*ocell+ocell/2); }
      ctx.textBaseline='alphabetic';

      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('각 2×2 묶음에서 가장 큰 값만 남겨 — 크기는 절반, 가장 강한 특징은 보존', W/2, H*0.80);

      E.tapHint(W/2, H*0.90, '4×4 → 2×2 다운샘플: 같은 색 묶음의 최댓값(굵은 테두리)이 결과로 갑니다', false);
      E.big('풀링(Pooling) — 다운샘플링', '특징맵을 작은 묶음(2×2)으로 나눠 각 묶음의 최댓값만 남깁니다(max pooling). 크기가 절반으로 줄어 계산이 가볍고, ‘이 근처에 강한 특징이 있다’는 핵심은 지켜집니다. 특징이 한두 칸 옮겨가도 같은 결과 — 작은 평행이동에 둔감해지죠.'); }
  },

  // ══════════ 4. 특징 계층 — 저수준→중수준→고수준 ══════════
  { id:'ai8_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*90,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, fr=E.frame;
      var layers=[
        {c:GLD, t:'저수준 (얕은 층)', d:'에지·점·색 경계', ex:'─ │ ╱ ╲ 같은 작은 조각'},
        {c:GRN, t:'중수준 (중간 층)', d:'에지의 조합 = 질감·무늬·모서리', ex:'곡선·코너·격자무늬'},
        {c:BLU, t:'고수준 (깊은 층)', d:'부분의 조합 = 눈·바퀴·얼굴 부위', ex:'눈 → 얼굴, 바퀴 → 자동차'}
      ];
      var cx=[W*0.22,W*0.5,W*0.78], cy=H*0.42, R=Math.min(W*0.11,H*0.17);
      // 흐름 화살표
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=2;
      for(var a=0;a<2;a++){ ctx.beginPath(); ctx.moveTo(cx[a]+R*1.0, cy); ctx.lineTo(cx[a+1]-R*1.0, cy); ctx.stroke();
        ctx.fillStyle=DIM; ctx.beginPath(); ctx.moveTo(cx[a+1]-R*1.0,cy); ctx.lineTo(cx[a+1]-R*1.0-8,cy-5); ctx.lineTo(cx[a+1]-R*1.0-8,cy+5); ctx.fill(); }

      for(var i=0;i<3;i++){ var L=layers[i], on=(i<=s.step), cur=(i===s.step);
        ctx.globalAlpha=on?1:0.30;
        ctx.beginPath(); ctx.arc(cx[i],cy,R,0,7); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill();
        ctx.strokeStyle=L.c; ctx.lineWidth=cur?3:1.6; ctx.stroke();
        // 미니 도식
        ctx.strokeStyle=L.c; ctx.lineWidth=2;
        if(i===0){ // 에지 조각들
          ctx.beginPath(); ctx.moveTo(cx[i]-R*0.45,cy-R*0.3); ctx.lineTo(cx[i]+R*0.45,cy-R*0.3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx[i]-R*0.2,cy-R*0.05); ctx.lineTo(cx[i]-R*0.2,cy+R*0.45); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx[i]+R*0.1,cy-R*0.05); ctx.lineTo(cx[i]+R*0.5,cy+R*0.4); ctx.stroke();
        } else if(i===1){ // 곡선·코너
          ctx.beginPath(); ctx.arc(cx[i]-R*0.15,cy+R*0.1,R*0.35,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx[i]+R*0.25,cy-R*0.35); ctx.lineTo(cx[i]+R*0.25,cy+R*0.25); ctx.lineTo(cx[i]+R*0.55,cy+R*0.25); ctx.stroke();
        } else { // 부분(눈+얼굴)
          ctx.beginPath(); ctx.arc(cx[i],cy+R*0.05,R*0.5,0,7); ctx.stroke();
          ctx.fillStyle=BLU; ctx.beginPath(); ctx.arc(cx[i]-R*0.2,cy-R*0.1,R*0.08,0,7); ctx.fill();
          ctx.beginPath(); ctx.arc(cx[i]+R*0.2,cy-R*0.1,R*0.08,0,7); ctx.fill();
          ctx.strokeStyle=BLU; ctx.beginPath(); ctx.arc(cx[i],cy+R*0.25,R*0.2,0.2,Math.PI-0.2); ctx.stroke();
        }
        ctx.fillStyle=L.c; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(L.t, cx[i], cy-R-14);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('층 '+(i+1), cx[i], cy+R+22);
        ctx.globalAlpha=1; }

      // 현재 층 설명 패널
      var cu=layers[s.step], px=W*0.30, py=H*0.74;
      ctx.fillStyle=cu.c; ctx.font='600 18px sans-serif'; ctx.textAlign='left'; ctx.fillText(cu.t, px, py);
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif'; ctx.fillText(cu.d, px, py+28);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('예: '+cu.ex, px, py+52);

      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 층 (저수준 → 중수준 → 고수준)', true);
      E.big('특징의 계층 — 단순 → 복잡', '깊이 들어갈수록 필터가 보는 것이 풍부해집니다. 첫 층은 에지·색 같은 작은 조각, 다음 층은 그 조각을 모은 질감·코너, 더 깊은 층은 눈·바퀴 같은 ‘부분’, 마지막엔 얼굴·자동차 같은 ‘물체’. 사람이 단계를 짜 준 게 아니라, 학습이 알아서 이 계층을 만들어 냅니다.'); }
  },

  // ══════════ 5. CNN 전체 흐름 — 입력→Conv→Pool→…→FC→분류 ══════════
  { id:'ai8_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(340+this.s.step*70,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var stages=[
        {c:CYA, t:'입력', d:'이미지(픽셀 격자)'},
        {c:GLD, t:'Conv', d:'필터 합성곱 → 특징맵'},
        {c:GRN, t:'Pool', d:'다운샘플(절반)'},
        {c:GLD, t:'Conv·Pool 반복', d:'특징이 깊고 추상적으로'},
        {c:BLU, t:'FC(완전연결)', d:'특징을 펼쳐 종합'},
        {c:PNK, t:'분류', d:'고양이? 개? 확률 출력'}
      ];
      var n=stages.length, gap=W*0.84/n, x0=W*0.10, cy=H*0.40, bw=gap*0.66, bh=H*0.20;
      for(var i=0;i<n;i++){ var st=stages[i], cx=x0+gap*i+gap*0.17, on=(i<=s.step), cur=(i===s.step);
        ctx.globalAlpha=on?1:0.28;
        // 연결 화살표
        if(i>0){ ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-gap*0.17, cy); ctx.lineTo(cx, cy); ctx.stroke();
          ctx.fillStyle=DIM; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-8,cy-5); ctx.lineTo(cx-8,cy+5); ctx.fill(); }
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(cx, cy-bh/2, bw, bh);
        ctx.strokeStyle=st.c; ctx.lineWidth=cur?3:1.6; ctx.strokeRect(cx, cy-bh/2, bw, bh);
        ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(st.t, cx+bw/2, cy-bh/2-10);
        ctx.fillStyle='#dfeef0'; ctx.font='11.5px sans-serif';
        var words=st.d.split(' '); for(var k=0;k<words.length;k++) ctx.fillText(words[k], cx+bw/2, cy-6+k*15);
        ctx.globalAlpha=1; }

      // 분류 결과(마지막 단계 도달 시) — 결정적 점수
      if(s.step>=5){ var labels=['고양이','개','새'], logits=[2.1,0.4,-0.8], ex=logits.map(function(z){return Math.exp(z);});
        var sm=ex.reduce(function(a,b){return a+b;},0), py=H*0.62;
        ctx.fillStyle=PNK; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('소프트맥스 출력(확률):', W*0.34, py-8);
        for(var j=0;j<3;j++){ var p=ex[j]/sm, bw2=W*0.22*p, yy=py+12+j*26;
          ctx.fillStyle = j===0?GRN:DIM; ctx.fillRect(W*0.40, yy-11, bw2, 16);
          ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText(labels[j], W*0.385, yy+1);
          ctx.fillStyle = j===0?GRN:DIM; ctx.textAlign='left'; ctx.fillText((p*100).toFixed(0)+'%', W*0.40+bw2+8, yy+1); }
      }

      // 왜 이미지에 강한가(3대 이유)
      var rx=W*0.10, ry=H*0.80; ctx.textAlign='left';
      var reasons=[['지역성', '가까운 픽셀끼리 먼저 본다(작은 필터)'],
                   ['파라미터 공유', '같은 필터를 전 위치에 → 적은 가중치'],
                   ['평행이동 불변', '물체가 옮겨가도 같은 특징을 검출']];
      ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.fillText('왜 이미지에 강한가:', rx, ry);
      for(var m=0;m<3;m++){ ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('• '+reasons[m][0], rx, ry+22+m*22);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(reasons[m][1], rx+W*0.13, ry+22+m*22); }

      E.tapHint(W/2, H*0.94, '화면 탭 = 파이프라인 한 단계씩 (입력 → Conv → Pool → … → 분류)', true);
      E.big('CNN 전체 흐름 — 픽셀에서 분류까지', '이미지가 들어오면 Conv로 특징을 뽑고 Pool로 압축하기를 반복하며 점점 추상적인 특징을 만들고, 마지막에 완전연결층이 그것을 종합해 ‘고양이일 확률’ 같은 답을 냅니다. CNN이 이미지에 강한 비결은 셋 — 지역성, 파라미터 공유, 평행이동 불변입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
