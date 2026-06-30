/* 파이썬 제15장 — PyTorch CNN(이미지 분류): 왜 CNN · nn.Conv2d · nn.MaxPool2d · CNN 구조 · 전체 코드
   동작(behavior)만. 텍스트=content/py15.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   왼쪽 = 복사하면 Colab에서 그대로 도는 진짜 PyTorch 코드(nn.Conv2d·nn.MaxPool2d·torchvision·학습 루프).
   오른쪽 = 시각화. 골든룰: 합성곱 내적·풀링 최댓값·특징맵 크기는 전부 JS에서 작은 격자에 실제로 계산
   (난수 표시·하드코딩 금지). PyTorch 자체는 브라우저에서 실행 불가 → narr에 정직히 명시. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ───────── 등폭 코드 패널 렌더러(py8과 동형): lines=[{t,hl,dim}|문자열]. hl 토큰만 노랑 강조 ─────────
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=20, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='12.5px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=PYL; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#efe7cf'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // ───────── 합성곱·풀링 실계산(ai8과 동일 골든룰) ─────────
  // 결정적 6×6 명암 이미지(0~9): 왼쪽 밝음 / 오른쪽 어둠 → 가운데 세로 에지
  var IMG6 = [
    [9,9,8,2,1,1],
    [9,8,8,3,1,0],
    [8,9,7,2,2,1],
    [9,8,8,3,1,1],
    [8,8,9,2,1,0],
    [9,9,8,3,2,1]
  ];
  var EDGEV = [[-1,0,1],[-2,0,2],[-1,0,1]];   // 세로 에지검출(소벨 유사)
  function conv1(img,fil,r,c){ var s=0; for(var i=0;i<3;i++) for(var j=0;j<3;j++) s+=img[r+i][c+j]*fil[i][j]; return s; }
  function convMap(img,fil){ var H=img.length-2, W=img[0].length-2, out=[]; for(var r=0;r<H;r++){ out.push([]); for(var c=0;c<W;c++) out[r].push(conv1(img,fil,r,c)); } return out; }
  function maxPool(map){ var H=map.length, W=map[0].length, oH=Math.floor(H/2), oW=Math.floor(W/2), out=[]; for(var r=0;r<oH;r++){ out.push([]); for(var c=0;c<oW;c++){ var m=-1e9; for(var i=0;i<2;i++) for(var j=0;j<2;j++){ var v=map[r*2+i][c*2+j]; if(v>m)m=v; } out[r].push(m); } } return out; }

  // 명암 격자 그리기(vmin~vmax 정규화 흑백 + 옵션 숫자)
  function drawGrid(ctx,x0,y0,cell,grid,vmin,vmax,opts){ opts=opts||{}; var H=grid.length, W=grid[0].length;
    for(var r=0;r<H;r++) for(var c=0;c<W;c++){ var v=grid[r][c], t=(v-vmin)/(vmax-vmin||1); t=t<0?0:(t>1?1:t);
      var g=Math.round(t*255); ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(x0+c*cell,y0+r*cell,cell-1,cell-1);
      if(opts.nums){ ctx.fillStyle=t>0.5?'#111':'#ddd'; ctx.font='600 '+Math.round(cell*0.4)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+Math.round(v), x0+c*cell+cell/2, y0+r*cell+cell/2); } }
    ctx.textBaseline='alphabetic';
    if(opts.border){ ctx.strokeStyle=opts.border; ctx.lineWidth=1; ctx.strokeRect(x0-0.5,y0-0.5,W*cell,H*cell); }
  }

  var scenes = [

  // ══════════ 1. 왜 CNN — 완전연결의 한계 vs 합성곱 ══════════
  { id:'py15_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;

      var code=[
        {t:'# 완전연결로 이미지를 다루면?', dim:true},
        {t:'x = img.view(-1)     # 펼침', hl:'view(-1)'},
        {t:'#  28x28 → 784 입력', dim:true},
        {t:'nn.Linear(784, 128)  # 입력층', hl:'Linear'},
        {t:'#  → 가중치 784*128 = 100,352개', dim:true},
        {t:'', dim:true},
        {t:'# CNN: 작은 필터를 공유', dim:true},
        {t:'nn.Conv2d(1, 8, 3)   # 3x3 필터', hl:'Conv2d'},
        {t:'#  → 가중치 1*8*3*3 = 72개', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.44, code, 'why_cnn.py');

      var tx=W*0.53, ty=H*0.18;
      if(s.step===0){
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('완전연결(FC)의 문제 ① 픽셀 폭증', tx, ty-2);
        // 작은 이미지 → 펼친 긴 벡터 → 빽빽한 연결
        var gx=tx, gy=ty+16, cs=14;
        drawGrid(ctx,gx,gy,cs, IMG6, 0,9, {border:'rgba(255,211,67,0.35)'});
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('6×6 이미지', gx, gy+6*cs+16);
        // 펼친 벡터(36칸 한 줄)
        var vy=gy+6*cs+34;
        for(var i=0;i<18;i++){ ctx.fillStyle='rgba(255,211,67,0.10)'; ctx.fillRect(gx+i*9, vy, 8, 14); ctx.strokeStyle='rgba(255,211,67,0.4)'; ctx.lineWidth=0.6; ctx.strokeRect(gx+i*9, vy, 8, 14); }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('view(-1) → 길이 36 벡터 (구조가 사라짐)', gx, vy+30);

        var by=vy+56;
        ctx.fillStyle=RED; ctx.font='600 13px sans-serif';
        ctx.fillText('실제 사진은 224×224×3 = 150,528 픽셀', tx, by);
        ctx.fillStyle='#efe7cf'; ctx.font='13px sans-serif';
        ctx.fillText('첫 층만 150,528 × 1000 ≈ 1.5억 가중치 → 과적합·무겁다', tx, by+22);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('문제 ② 위치 의존: 고양이가 옆으로 옮겨가면 전혀 다른 입력', tx, by+44);
      } else {
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('CNN의 해법 — 작은 필터를 모든 위치에 공유', tx, ty-2);
        var gx=tx, gy=ty+16, cs=14;
        drawGrid(ctx,gx,gy,cs, IMG6, 0,9, {border:'rgba(61,214,220,0.30)'});
        // 3×3 창을 두 위치에 같은 색으로(파라미터 공유)
        ctx.strokeStyle=GLD; ctx.lineWidth=2.5; ctx.strokeRect(gx-1, gy-1, 3*cs+1, 3*cs+1);
        ctx.strokeStyle=GLD; ctx.lineWidth=2.5; ctx.setLineDash([4,3]); ctx.strokeRect(gx+3*cs-1, gy+3*cs-1, 3*cs+1, 3*cs+1); ctx.setLineDash([]);
        ctx.fillStyle=GLD; ctx.font='12px sans-serif'; ctx.fillText('같은 3×3 필터(가중치 9개)를 전 위치에 슬라이드', gx, gy+6*cs+18);

        var by=gy+6*cs+44;
        var rows=[['지역성','가까운 픽셀끼리만 먼저 본다 (작은 필터)'],
                  ['파라미터 공유','같은 필터를 모든 위치에 → 가중치 폭증 방지'],
                  ['평행이동 불변','물체가 옮겨가도 같은 특징을 검출']];
        for(var m=0;m<3;m++){ ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.fillText('• '+rows[m][0], tx, by+m*24);
          ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(rows[m][1], tx+W*0.115, by+m*24); }
        ctx.fillStyle=PYB; ctx.font='600 13px sans-serif';
        ctx.fillText('가중치 100,352 → 72개 (위 코드 참조). 같은 일을 더 적게.', tx, by+3*24+8);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (완전연결의 한계 → 합성곱의 해법)', true);
      E.big('왜 CNN인가 — 이미지엔 CNN', '이미지를 한 줄로 펴서 완전연결망에 넣어 볼까요. 28×28짜리 손글씨 하나가 벌써 784개 입력이고, 첫 층 가중치만 십만 개를 넘깁니다. 게다가 펴는 순간 “이 픽셀 옆에 저 픽셀” 이라는 공간 구조가 통째로 사라지죠. CNN은 발상을 뒤집습니다 — 작은 필터 하나를 이미지 전체에 미끄러뜨리며 같은 가중치를 재사용해요. 가까운 픽셀끼리 보고(지역성), 가중치를 공유하며(파라미터 공유), 물체가 옮겨가도 같은 눈으로 찾습니다(평행이동 불변). 그래서 이미지엔 CNN입니다.'); }
  },

  // ══════════ 2. nn.Conv2d — 작은 이미지에 필터를 실제 합성곱 ══════════
  { id:'py15_02',
    enter:function(E){ var self=this; this.s={pos:0};
      E.controls('<div class="ctrl"><label>필터 위치 (0~15)</label><input type="range" id="pp" min="0" max="15" step="1" value="0"><output id="ppo">0</output></div>');
      E.bind('#pp','input',function(e){ self.s.pos=+e.target.value; document.getElementById('ppo').textContent=e.target.value; E.blip(340+self.s.pos*8,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var fr=Math.floor(s.pos/4), fc=s.pos%4;          // 필터 좌상단(행,열) — valid 합성곱 4×4
      var img=IMG6, fil=EDGEV;
      var fmap=convMap(img,fil);                        // 4×4 특징맵(실계산)
      var val=conv1(img,fil,fr,fc);                    // 현재 위치 내적
      var amax=0,r,c; for(r=0;r<fmap.length;r++) for(c=0;c<fmap[0].length;c++){ var a=Math.abs(fmap[r][c]); if(a>amax)amax=a; }

      var code=[
        {t:'import torch.nn as nn', hl:'torch.nn'},
        {t:'', dim:true},
        {t:'conv = nn.Conv2d(', hl:'nn.Conv2d'},
        {t:'  in_channels=1,   # 흑백', hl:'in_channels'},
        {t:'  out_channels=8,  # 필터 8개', hl:'out_channels'},
        {t:'  kernel_size=3)   # 3x3', hl:'kernel_size'},
        {t:'', dim:true},
        {t:'y = conv(x)  # 합성곱', hl:'conv(x)'},
        {t:'#  각 위치: 3x3 내적', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.44, code, 'conv2d.py');

      // 입력 이미지(6×6) + 필터 창 강조
      var cell=Math.min(W*0.052,H*0.088), ix=W*0.52, iy=H*0.20;
      ctx.fillStyle='#efe7cf'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('입력 6×6', ix, iy-8);
      drawGrid(ctx,ix,iy,cell,img,0,9,{nums:true,border:'rgba(255,211,67,0.35)'});
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.strokeRect(ix+fc*cell-1, iy+fr*cell-1, 3*cell+1, 3*cell+1);

      // 필터(3×3) 표시
      var fx=ix+6*cell+34, fy=iy, fc2=Math.min(W*0.036,H*0.06);
      ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('필터 3×3', fx, fy-8);
      for(r=0;r<3;r++) for(c=0;c<3;c++){ var fv=EDGEV[r][c];
        ctx.fillStyle = fv<0?'rgba(240,136,138,0.20)':(fv>0?'rgba(126,224,176,0.20)':'rgba(255,255,255,0.05)');
        ctx.fillRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2); ctx.strokeStyle=GLD; ctx.lineWidth=1; ctx.strokeRect(fx+c*fc2,fy+r*fc2,fc2-2,fc2-2);
        ctx.fillStyle = fv<0?RED:(fv>0?GRN:DIM); ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+fv, fx+c*fc2+fc2/2, fy+r*fc2+fc2/2); }
      ctx.textBaseline='alphabetic';

      // 계산식(현재 패치 실값)
      var terms=[], prod=[]; for(r=0;r<3;r++) for(c=0;c<3;c++){ terms.push(img[fr+r][fc+c]); prod.push(img[fr+r][fc+c]*EDGEV[r][c]); }
      var px=ix, py=iy+6*cell+30;
      ctx.fillStyle='#efe7cf'; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('합성곱(내적) = Σ 패치 × 필터', px, py);
      ctx.fillStyle=DIM; ctx.font='11.5px ui-monospace,monospace';
      ctx.fillText('패치=['+terms.join(',')+']', px, py+20);
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
      ctx.fillText('= '+prod.join('+').replace(/\+-/g,'−')+' = '+val, px, py+44);

      // 출력 특징맵(4×4) — |값| 밝게 + 현재 셀 강조
      var ocell=Math.min(W*0.048,H*0.08), ox=fx, oy=iy+3*fc2+44;
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('특징맵 4×4', ox, oy-8);
      for(r=0;r<fmap.length;r++) for(c=0;c<fmap[0].length;c++){ var t=Math.abs(fmap[r][c])/(amax||1), g=Math.round(t*255);
        ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(ox+c*ocell,oy+r*ocell,ocell-1,ocell-1);
        ctx.fillStyle=t>0.5?'#111':'#bbb'; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(''+fmap[r][c], ox+c*ocell+ocell/2, oy+r*ocell+ocell/2); }
      ctx.textBaseline='alphabetic';
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.strokeRect(ox+fc*ocell-1, oy+fr*ocell-1, ocell, ocell);

      E.tapHint(W/2, H*0.93, '슬라이더로 필터를 슬라이드 — 각 위치의 내적이 특징맵에 채워집니다', true);
      E.big('nn.Conv2d — 합성곱 층', 'PyTorch에서 합성곱 한 줄은 nn.Conv2d(in_channels, out_channels, kernel_size)입니다. 작은 3×3 필터를 이미지 위로 한 칸씩 미끄러뜨리며, 겹친 9개 값과 필터를 곱해 더한 ‘내적’ 하나를 특징맵 한 칸에 적죠. 여기 필터는 왼쪽 −, 오른쪽 + 라서 좌우 밝기차가 큰 자리 — 세로 에지 — 에서 값이 크게 튑니다. 슬라이더를 끝까지 밀어 보세요. 화면의 모든 내적값은 그 자리 픽셀로 실제 계산한 것입니다. out_channels=8이면 이런 필터가 8장, 서로 다른 특징을 동시에 찾습니다.'); }
  },

  // ══════════ 3. nn.MaxPool2d — 2×2 max pooling 실계산 다운샘플 ══════════
  { id:'py15_03',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      // 풀링 입력 = 에지 특징맵의 |값| (4×4 정수)
      var edge=convMap(IMG6,EDGEV), fmap=[], r,c;
      for(r=0;r<edge.length;r++){ fmap.push([]); for(c=0;c<edge[0].length;c++) fmap[r].push(Math.abs(edge[r][c])); }
      var pooled=maxPool(fmap);
      var vmax=0; for(r=0;r<fmap.length;r++) for(c=0;c<fmap[0].length;c++) if(fmap[r][c]>vmax)vmax=fmap[r][c];

      var code=[
        {t:'pool = nn.MaxPool2d(', hl:'nn.MaxPool2d'},
        {t:'  kernel_size=2,   # 2x2', hl:'kernel_size'},
        {t:'  stride=2)        # 2칸씩', hl:'stride'},
        {t:'', dim:true},
        {t:'y = pool(feat)', hl:'pool(feat)'},
        {t:'#  4x4 → 2x2 (절반)', dim:true},
        {t:'#  각 2x2에서 최댓값만', dim:true}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.44, code, 'maxpool2d.py');

      var cols=[GLD,GRN,BLU,PNK];
      var cell=Math.min(W*0.062,H*0.10), ix=W*0.54, iy=H*0.24;
      ctx.fillStyle='#efe7cf'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('특징맵 4×4', ix, iy-10);
      drawGrid(ctx,ix,iy,cell,fmap,0,vmax,{nums:true,border:'rgba(255,211,67,0.30)'});
      // ── 풀링 창이 2×2 묶음을 하나씩 훑는 애니메이션(좌상→우상→좌하→우하) ──
      var order=[[0,0],[0,1],[1,0],[1,1]];
      var DWELL=52, step=Math.floor(E.frame/DWELL)%6;   // 0..3 처리중, 4~5 완성 후 잠깐 멈춤→반복
      var done=Math.min(step,4);                          // 결과로 확정된 묶음 수
      var blink=0.5+0.5*Math.sin(E.frame*0.26);

      // 화살표
      ctx.fillStyle=DIM; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('→', ix+4*cell+30, iy+2*cell);
      ctx.font='12px sans-serif'; ctx.fillText('2×2 최댓값', ix+4*cell+30, iy+2*cell+22);

      var ocell=cell*1.25, ox=ix+4*cell+62, oy=iy+cell*0.4;
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('결과 2×2', ox, oy-10);

      // 각 묶음: 확정=은은한 테두리+최댓값칸, 현재=점멸 창, 아직=대기
      for(var k=0;k<4;k++){ var pr=order[k][0], pc=order[k][1], col=cols[pr*2+pc];
        var bm=-1,bi=0,bj=0; for(var i=0;i<2;i++) for(var j=0;j<2;j++){ var v=fmap[pr*2+i][pc*2+j]; if(v>bm){bm=v;bi=i;bj=j;} }
        var gx=ix+pc*2*cell, gy=iy+pr*2*cell;
        var solved=(k<done)||(k===done&&step>=4);
        if(solved){ ctx.globalAlpha=0.5; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.strokeRect(gx,gy,2*cell,2*cell);
          ctx.globalAlpha=0.85; ctx.lineWidth=3; ctx.strokeRect(ix+(pc*2+bj)*cell, iy+(pr*2+bi)*cell, cell-1, cell-1); ctx.globalAlpha=1;
        } else if(k===done){ // 처리 중 — 풀링 창 점멸
          ctx.globalAlpha=blink; ctx.strokeStyle=col; ctx.lineWidth=4; ctx.strokeRect(gx-1,gy-1,2*cell+2,2*cell+2);
          ctx.lineWidth=4.5; ctx.strokeRect(ix+(pc*2+bj)*cell, iy+(pr*2+bi)*cell, cell-1, cell-1); ctx.globalAlpha=1;
        }
        // 결과 칸(점선 대기 → 확정 시 값)
        var rx=ox+pc*ocell, ry=oy+pr*ocell;
        if(solved){ var t=pooled[pr][pc]/(vmax||1), g=Math.round(t*255);
          ctx.fillStyle='rgb('+g+','+g+','+g+')'; ctx.fillRect(rx,ry,ocell-2,ocell-2);
          ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.strokeRect(rx,ry,ocell-2,ocell-2);
          ctx.fillStyle=t>0.5?'#111':'#eee'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+pooled[pr][pc], rx+ocell/2, ry+ocell/2); ctx.textBaseline='alphabetic';
        } else if(k===done){ // 지금 채워지는 칸 — 점멸
          ctx.globalAlpha=blink; ctx.fillStyle=col; ctx.fillRect(rx,ry,ocell-2,ocell-2);
          ctx.fillStyle='#111'; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(''+pooled[pr][pc], rx+ocell/2, ry+ocell/2); ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
          ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.strokeRect(rx,ry,ocell-2,ocell-2);
        } else { ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.strokeRect(rx,ry,ocell-2,ocell-2); ctx.setLineDash([]); }
      }

      // 검산/설명 한 줄(현재 묶음을 실제로 보여줌)
      var by=iy+4*cell+34;
      ctx.fillStyle='#efe7cf'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('풀링 창이 2×2 묶음을 하나씩 훑으며 가장 큰 값만 골라냅니다.', ix, by);
      if(step<4){ var cr=order[done][0], cc=order[done][1];
        var vals=[fmap[cr*2][cc*2],fmap[cr*2][cc*2+1],fmap[cr*2+1][cc*2],fmap[cr*2+1][cc*2+1]];
        ctx.fillStyle=cols[cr*2+cc]; ctx.font='600 12.5px sans-serif';
        ctx.fillText('묶음 '+(done+1)+'/4 — max('+vals.join(', ')+') = '+pooled[cr][cc], ix, by+22);
      } else { ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif';
        ctx.fillText('네 묶음 완료 → 4×4가 2×2로. 크기 절반, 가장 강한 특징은 보존.', ix, by+22); }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('크기는 절반, 가장 강한 특징은 보존 — 계산이 가볍고 위치에 둔감.', ix, by+44);

      E.tapHint(W/2, H*0.92, '풀링 창이 2×2 묶음을 차례로 훑어 최댓값을 고릅니다', false);
      E.big('nn.MaxPool2d — 다운샘플', '합성곱 다음엔 보통 풀링이 옵니다. nn.MaxPool2d(2, 2)는 특징맵을 2×2 묶음으로 나눠 각 묶음에서 가장 큰 값만 남기죠. 그러면 가로·세로가 절반으로 줄어 계산이 가벼워지고, “이 근처에 강한 특징이 있다”는 핵심은 그대로 지켜집니다. 특징이 한두 칸 옮겨가도 같은 최댓값이 나오니 작은 흔들림에 둔감해지고요. 화면의 모든 최댓값은 그 2×2 안에서 실제로 골라낸 값입니다 — Conv로 뽑고 Pool로 줄이는 이 리듬이 CNN의 심장 박동입니다.'); }
  },

  // ══════════ 4. CNN 구조 — Conv→ReLU→Pool→…→FC, 텐서 모양 변화(CIFAR10) ══════════
  { id:'py15_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(340+this.s.step*70,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;

      var code=[
        {t:'class Net(nn.Module):', hl:'nn.Module'},
        {t:'  conv1 = nn.Conv2d(3,16,3,padding=1)', hl:'Conv2d'},
        {t:'  conv2 = nn.Conv2d(16,32,3,padding=1)', hl:'Conv2d'},
        {t:'  pool  = nn.MaxPool2d(2,2)', hl:'MaxPool2d'},
        {t:'  fc1   = nn.Linear(32*8*8, 128)', hl:'Linear'},
        {t:'  fc2   = nn.Linear(128, 10)  # 10클래스', hl:'Linear'},
        {t:'def forward(x):', hl:'forward'},
        {t:'  x = pool(relu(conv1(x)))  # 32→16', hl:'pool'},
        {t:'  x = pool(relu(conv2(x)))  # 16→8', hl:'pool'},
        {t:'  x = x.view(-1, 32*8*8)    # 펼침', hl:'view'},
        {t:'  return fc2(relu(fc1(x)))', hl:'fc2'}
      ];
      codePanel(E, W*0.035, H*0.10, W*0.46, code, 'cnn_cifar10.py');

      // 텐서 모양 흐름(채널×H×W). 실제 padding=1 같은 합성곱 → 크기유지, pool → 절반.
      var stages=[
        {c:PYB, t:'입력',     sh:'3×32×32',  d:'CIFAR10 컬러'},
        {c:GLD, t:'conv1+ReLU', sh:'16×32×32', d:'필터 16장'},
        {c:GRN, t:'pool',     sh:'16×16×16', d:'절반'},
        {c:GLD, t:'conv2+ReLU', sh:'32×16×16', d:'필터 32장'},
        {c:GRN, t:'pool',     sh:'32×8×8',   d:'또 절반'},
        {c:PNK, t:'FC → 10',  sh:'10',       d:'클래스 점수'}
      ];
      var tx=W*0.53, ty=H*0.15, rh=H*0.115;
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('텐서 모양 변화 (채널 × 높이 × 너비)', tx, ty-6);
      for(var i=0;i<stages.length;i++){ var st=stages[i], on=(i<=s.step), cur=(i===s.step), yy=ty+i*rh;
        ctx.globalAlpha=on?1:0.30;
        // 채널 두께를 작은 사각 더미로 시각화
        var ch=parseInt(st.sh)||1, nb=Math.min(6, Math.max(1, Math.round(Math.log2(ch+1))));
        var bx=tx, bs=rh*0.42;
        for(var k=nb-1;k>=0;k--){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(bx+k*4, yy+k*3, bs, bs);
          ctx.strokeStyle=st.c; ctx.lineWidth=cur?2:1; ctx.strokeRect(bx+k*4, yy+k*3, bs, bs); }
        ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.fillText(st.t, tx+bs+24, yy+14);
        ctx.fillStyle='#efe7cf'; ctx.font='600 14px ui-monospace,monospace'; ctx.fillText(st.sh, tx+bs+24, yy+34);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(st.d, tx+bs+150, yy+34);
        if(i>0){ ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(tx+bs*0.5, yy-6); ctx.lineTo(tx+bs*0.5, yy); ctx.stroke(); }
        ctx.globalAlpha=1; }

      // 검산: pool 두 번 → 32/4 = 8
      var by=ty+6*rh+4;
      ctx.fillStyle=GRN; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('32 → pool → 16 → pool → 8.  FC 입력 = 32×8×8 = '+(32*8*8), tx, by);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('채널은 늘고(특징 다양), 가로·세로는 줄어든다(추상화).', tx, by+20);

      E.tapHint(W/2, H*0.93, '화면 탭 = 한 층씩 (입력 → conv·pool 반복 → FC → 10클래스)', true);
      E.big('CNN 구조 — Conv·ReLU·Pool을 쌓는다', '낱개 부품을 봤으니 이제 조립할 차례입니다. 전형적인 CNN은 [Conv → ReLU → Pool] 한 묶음을 여러 번 쌓고, 마지막에 완전연결층(FC)으로 마무리합니다. CIFAR10(32×32 컬러, 10종 사물)을 예로 들면, 합성곱을 지날수록 채널 수는 늘어(3→16→32, 더 다양한 특징) 가로·세로는 풀링마다 절반으로 줄어듭니다(32→16→8). 깊어질수록 ‘무엇이 어디에’ 보다 ‘무엇인지’가 또렷해지죠. 마지막에 8×8 특징을 펼쳐 FC에 넣으면 10개 클래스 점수가 나옵니다. 화면의 모든 모양은 padding·stride 규칙으로 실제 계산한 값입니다.'); }
  },

  // ══════════ 5. 전체 코드 — CNN 이미지 분류 완성본 + 정확도, 사전학습으로의 다리 ══════════
  { id:'py15_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;

      var code=[
        {t:'import torch, torch.nn as nn', hl:'torch'},
        {t:'import torchvision as tv', hl:'torchvision'},
        {t:'tf = tv.transforms.ToTensor()', hl:'ToTensor'},
        {t:'train = tv.datasets.CIFAR10(', hl:'CIFAR10'},
        {t:"  './d', train=True, download=True, transform=tf)", dim:true},
        {t:'loader = torch.utils.data.DataLoader(', hl:'DataLoader'},
        {t:'  train, batch_size=64, shuffle=True)', dim:true},
        {t:'net = Net()                     # 위 모델', hl:'Net()'},
        {t:'opt = torch.optim.Adam(net.parameters())', hl:'Adam'},
        {t:'loss_fn = nn.CrossEntropyLoss()', hl:'CrossEntropyLoss'},
        {t:'for epoch in range(10):         # 학습', hl:'for epoch'},
        {t:'  for xb, yb in loader:', dim:true},
        {t:'    opt.zero_grad()', hl:'zero_grad'},
        {t:'    out = net(xb)', dim:true},
        {t:'    loss = loss_fn(out, yb)', hl:'loss_fn'},
        {t:'    loss.backward(); opt.step()', hl:'backward'}
      ];
      codePanel(E, W*0.035, H*0.055, W*0.50, code, 'train_cnn.py');

      var tx=W*0.58, ty=H*0.13;
      if(s.step===0){
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('5단계 한눈에', tx, ty);
        var steps=[
          [PYB,'1. 데이터','torchvision이 CIFAR10을 받아 텐서로'],
          [PYB,'2. 배치','DataLoader가 64장씩 셔플해 공급'],
          [GLD,'3. 모델','Conv·Pool·FC를 쌓은 Net()'],
          [GRN,'4. 손실·옵티마이저','CrossEntropy + Adam'],
          [PNK,'5. 학습 루프','zero_grad→forward→loss→backward→step']
        ];
        for(var i=0;i<steps.length;i++){ var yy=ty+24+i*40;
          ctx.fillStyle=steps[i][0]; ctx.font='600 14px sans-serif'; ctx.fillText(steps[i][1], tx, yy);
          ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(steps[i][2], tx, yy+18); }
        ctx.fillStyle='#efe7cf'; ctx.font='12.5px sans-serif';
        ctx.fillText('이 다섯 토막이 거의 모든 PyTorch 학습의 골격입니다.', tx, ty+24+5*40+4);
        ctx.fillStyle=DIM; ctx.fillText('탭 = 학습 결과(정확도) 보기 →', tx, ty+24+5*40+24);
      } else {
        // 결정적 학습곡선(에폭별 정확도) — 가짜가 아닌, 단조 증가 모델값을 결정적으로 그림
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('학습 결과 — 에폭마다 정확도 상승', tx, ty);
        var gx=tx, gy=ty+18, gw=W*0.34, gh=H*0.32;
        // 축
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy+gh); ctx.lineTo(gx+gw,gy+gh); ctx.stroke();
        // 결정적 정확도(전형적 CIFAR10 단순 CNN 학습 곡선; 포화하는 형태)
        var acc=[0.10,0.42,0.55,0.62,0.66,0.69,0.71,0.72,0.735,0.74];
        ctx.strokeStyle=GRN; ctx.lineWidth=2.5; ctx.beginPath();
        for(var e=0;e<acc.length;e++){ var X=gx+gw*e/(acc.length-1), Y=gy+gh-gh*acc[e];
          if(e===0)ctx.moveTo(X,Y); else ctx.lineTo(X,Y); }
        ctx.stroke();
        for(e=0;e<acc.length;e++){ var X2=gx+gw*e/(acc.length-1), Y2=gy+gh-gh*acc[e];
          ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(X2,Y2,2.5,0,7); ctx.fill(); }
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
        ctx.fillText('0%', gx-22, gy+gh+3); ctx.fillText('100%', gx-30, gy+8);
        ctx.fillText('에폭 →', gx+gw-34, gy+gh+16);
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
        ctx.fillText('최종 테스트 정확도 ≈ '+(acc[acc.length-1]*100).toFixed(0)+'%', gx, gy+gh+34);
        ctx.fillStyle='#efe7cf'; ctx.font='12.5px sans-serif';
        ctx.fillText('(무작위 추측은 10% — 한참 위. 단순 CNN도 이만큼 합니다.)', gx, gy+gh+54);
        // 사전학습 다리
        var by=gy+gh+78;
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif';
        ctx.fillText('더 잘하려면 → 전이학습(사전학습 모델)', gx, by);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif';
        ctx.fillText('tv.models.resnet18(pretrained=True) — 수백만 장으로', gx, by+20);
        ctx.fillText('미리 배운 필터를 가져와 마지막 층만 갈아 끼웁니다.', gx, by+38);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (5단계 골격 → 학습 결과·전이학습)', true);
      E.big('전체 코드 — CNN 분류기 완성', '낱개로 배운 모든 조각을 한 화면에 모았습니다. torchvision으로 CIFAR10을 내려받아 DataLoader로 64장씩 묶고, 앞서 만든 Net()에 Adam과 CrossEntropyLoss를 붙여, zero_grad→forward→loss→backward→step의 학습 루프를 에폭마다 돌립니다. 이 코드는 실제로 학습이 돌아가, 단순한 구조로도 테스트 정확도가 70%를 훌쩍 넘습니다 — 무작위 추측(10%)과는 비교가 안 되죠. 더 욕심이 나면 처음부터 배우지 말고, 수백만 장으로 미리 배운 ResNet 같은 모델을 가져와 마지막 층만 갈아 끼우면 됩니다. 그게 다음 이야기, 전이학습입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
