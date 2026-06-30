/* 파이썬 제7장 — NumPy 행렬연산(선형대수): 행렬곱 @ · 전치/차원 · 내적·노름 · 역행렬·연립방정식 · 고유값
   동작(behavior)만. 텍스트=content/py7.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 모든 행렬곱·전치·내적·노름·역행렬·해·고유값/고유벡터는 JS에서 실제로 계산한 값(베껴 박지 않음).
   "딥러닝은 결국 거대한 행렬곱" — AI의 핵심 수학. 좌측=진짜 numpy 코드, 우측=결과 격자 실연산. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 등폭 코드 패널: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 골드 강조.
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
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
        ctx.fillStyle=(L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 행렬/벡터 셀
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#e7ecda'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  // 대괄호 친 행렬 격자. M=2D배열. opt: {hiR,hiC,hiCell:[r,c],col,cw,ch}
  function matrix(ctx,x,y,M,opt){
    opt=opt||{}; var R=M.length, C=M[0].length, cw=opt.cw||40, ch=opt.ch||30, base=opt.col||PYB;
    for(var r=0;r<R;r++) for(var c=0;c<C;c++){
      var fill='rgba(255,255,255,0.04)', strk='rgba(255,255,255,0.12)', tc='#e7ecda';
      var rowHi=(opt.hiR!=null&&opt.hiR===r), colHi=(opt.hiC!=null&&opt.hiC===c);
      var cellHi=(opt.hiCell&&opt.hiCell[0]===r&&opt.hiCell[1]===c);
      if(rowHi||colHi){ fill='rgba('+(base===PYB?'108,182,232':'255,211,67')+',0.16)'; strk=base; }
      if(cellHi){ fill='rgba(126,224,176,0.22)'; strk=GRN; tc=GRN; }
      cell(ctx, x+c*cw, y+r*ch, cw, ch, fmt(M[r][c]), fill, strk, tc, opt.fs||13.5);
    }
    // 대괄호
    var w=C*cw, h=R*ch;
    ctx.strokeStyle=opt.bracket||'rgba(255,255,255,0.45)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(x-4,y-2); ctx.lineTo(x-7,y-2); ctx.lineTo(x-7,y+h+2); ctx.lineTo(x-4,y+h+2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w+4,y-2); ctx.lineTo(x+w+7,y-2); ctx.lineTo(x+w+7,y+h+2); ctx.lineTo(x+w+4,y+h+2); ctx.stroke();
    return {w:w,h:h};
  }
  function fmt(v){ if(typeof v!=='number') return v; if(Math.abs(v-Math.round(v))<1e-9) return ''+Math.round(v); return v.toFixed(2); }

  var scenes = [

  // ══════════ 1. 행렬곱 @ — A @ B (i행·j열 내적) ══════════
  { id:'py7_01',
    enter:function(E){ var self=this; this.s={cell:0,auto:false};
      E.controls('<div class="ctrl"><label>결과 셀 (i,j)</label><input type="range" id="ij" min="0" max="3" step="1" value="0"><output id="ijo">(0,0)</output></div>');
      E.bind('#ij','input',function(e){ self.s.cell=+e.target.value; var i=(self.s.cell/2|0), j=self.s.cell%2; document.getElementById('ijo').textContent='('+i+','+j+')'; E.blip(360+self.s.cell*60,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import numpy as np', hl:'numpy'},
        {t:'A = np.array([[1,2,3],', hl:'np.array'},
        {t:'              [4,5,6]])      # (2,3)', dim:true},
        {t:'B = np.array([[7, 8],', hl:'np.array'},
        {t:'              [9,10],', dim:true},
        {t:'              [11,12]])      # (3,2)', dim:true},
        {t:'C = A @ B        # 행렬곱 (2,2)', hl:'A @ B'},
        {t:'# C[i,j] = A의 i행 · B의 j열 (내적)', dim:true}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.44, code, 'matmul.py');

      var A=[[1,2,3],[4,5,6]], B=[[7,8],[9,10],[11,12]];
      var i=(s.cell/2|0), j=s.cell%2;
      // 실제 행렬곱 전체 계산
      var C=[[0,0],[0,0]]; for(var r=0;r<2;r++) for(var c=0;c<2;c++){ var sm=0; for(var k=0;k<3;k++) sm+=A[r][k]*B[k][c]; C[r][c]=sm; }

      var cw=40, ch=30;
      // 우측 상단: A (i행 강조)
      var ax=W*0.56, ay=H*0.18;
      ctx.fillStyle=PYB; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('A (2×3)', ax, ay-10);
      matrix(ctx, ax, ay, A, {hiR:i, col:PYB, cw:cw, ch:ch});
      // B (j열 강조) — A 오른쪽
      var bx=ax+3*cw+50, by=ay;
      ctx.fillStyle=PYL; ctx.fillText('B (3×2)', bx, by-10);
      matrix(ctx, bx, by, B, {hiC:j, col:PYL, cw:cw, ch:ch});
      // @ 기호
      ctx.fillStyle=DIM; ctx.font='600 20px sans-serif'; ctx.textAlign='center'; ctx.fillText('@', ax+3*cw+24, ay+ch*1+6);

      // 결과 C (선택 셀 강조)
      var ccx=W*0.62, ccy=H*0.50;
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('C = A @ B  (2×2)', ccx, ccy-10);
      matrix(ctx, ccx, ccy, C, {hiCell:[i,j], cw:cw, ch:ch, col:GRN});

      // 내적 계산 식 (실측)
      var terms=[]; for(k=0;k<3;k++) terms.push(A[i][k]+'·'+B[k][j]);
      var prods=[]; for(k=0;k<3;k++) prods.push(A[i][k]*B[k][j]);
      ctx.textAlign='left'; ctx.fillStyle=GRN; ctx.font='600 15px sans-serif';
      ctx.fillText('C['+i+','+j+'] = '+terms.join(' + '), W*0.06, H*0.74);
      ctx.fillStyle='#e7ecda'; ctx.font='15px ui-monospace,Menlo,monospace';
      ctx.fillText('        = '+prods.join(' + ')+' = '+C[i][j], W*0.06, H*0.74+24);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('A의 '+i+'행과 B의 '+j+'열을 짝지어 곱해 더한 값 — 그게 결과의 한 칸.', W*0.06, H*0.74+50);

      E.tapHint(W/2, H*0.95, '슬라이더로 결과 셀 (i,j)를 옮겨 보세요 — 매 칸이 행·열의 내적', true);
      E.big('행렬곱 @ — 딥러닝의 심장', '신경망의 한 층은 결국 입력 벡터에 가중치 행렬을 곱하는 일 — C[i,j]는 ‘A의 i행’과 ‘B의 j열’을 짝지어 곱해 더한 내적입니다. (2,3)@(3,2)처럼 안쪽 차원(3)이 맞아야 곱해지고, 결과는 바깥 차원 (2,2)가 됩니다. GPU가 잘하는 일이 바로 이 거대한 곱셈이죠.'); }
  },

  // ══════════ 2. 전치·차원 — A.T · shape · reshape ══════════
  { id:'py7_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'A = np.array([[1,2,3],', hl:'np.array'},
        {t:'              [4,5,6]])', dim:true},
        {t:'A.shape        # (2, 3)', hl:'.shape'},
        {t:'A.T            # 전치 (3, 2)', hl:'A.T'},
        {t:'#  행 ↔ 열 을 뒤집음', dim:true},
        {t:'', dim:true},
        {t:'A.reshape(3, 2)   # 같은 6개,', hl:'.reshape'},
        {t:'                  # 모양만 재배열', dim:true}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.44, code, 'transpose.py');

      var A=[[1,2,3],[4,5,6]];
      var cw=42, ch=32;
      // A
      var ax=W*0.55, ay=H*0.20;
      ctx.fillStyle=PYB; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('A   shape=(2, 3)', ax, ay-10);
      matrix(ctx, ax, ay, A, {col:PYB, cw:cw, ch:ch});

      if(s.step===0){
        // 전치: A.T[j][i]=A[i][j] — 실제 계산
        var T=[]; for(var c=0;c<3;c++){ T.push([]); for(var r=0;r<2;r++) T[c].push(A[r][c]); }
        var tx=W*0.55, ty=ay+2*ch+50;
        ctx.fillStyle=GLD; ctx.textAlign='left'; ctx.fillText('A.T   shape=(3, 2)   — 행↔열 뒤집힘', tx, ty-10);
        matrix(ctx, tx, ty, T, {col:GLD, cw:cw, ch:ch, bracket:'rgba(255,210,122,0.5)'});
        // 대각선 화살표로 (0,2)→(2,0) 매핑 한 예 표시
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
        ctx.fillText('A[0,2]=3  →  A.T[2,0]=3   (i,j) ↦ (j,i)', W*0.06, H*0.90);
      } else {
        // reshape(3,2): 6개를 행우선으로 다시 채움 — 실제 계산
        var flat=[]; for(var r=0;r<2;r++) for(var c=0;c<3;c++) flat.push(A[r][c]); // [1,2,3,4,5,6]
        var Rs=[]; var idx=0; for(r=0;r<3;r++){ Rs.push([]); for(c=0;c<2;c++) Rs[r].push(flat[idx++]); }
        var rx=W*0.55, ry=ay+2*ch+50;
        ctx.fillStyle=GRN; ctx.textAlign='left'; ctx.fillText('A.reshape(3, 2)   — 같은 순서, 모양만', rx, ry-10);
        matrix(ctx, rx, ry, Rs, {col:GRN, cw:cw, ch:ch, bracket:'rgba(126,224,176,0.5)'});
        ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,Menlo,monospace';
        ctx.fillText('펼치면 [1,2,3,4,5,6] — 6칸을 (3,2)로 다시 담음', W*0.06, H*0.90);
        ctx.fillStyle=PNK; ctx.font='12.5px sans-serif';
        ctx.fillText('※ 전치 A.T 와 reshape 는 다릅니다 — 값의 배열 순서가 달라요.', W*0.06, H*0.90+20);
      }

      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (전치 A.T → reshape)', true);
      E.big('전치·차원 — 행과 열을 자유자재로', 'shape는 텐서의 ‘몸집’입니다 — (2,3)은 2행 3열. 전치 A.T는 행과 열을 맞바꿔 (i,j)를 (j,i)로 보냅니다(역전파에서 가중치 행렬을 거꾸로 곱할 때 필수). reshape는 값은 그대로 둔 채 모양만 재배열하죠. 차원이 맞지 않아 곱이 안 되는 에러는 딥러닝에서 가장 흔한 버그입니다.'); }
  },

  // ══════════ 3. 내적·노름 — np.dot · np.linalg.norm ══════════
  { id:'py7_03',
    enter:function(E){ var self=this; this.s={ax:3,ay:1};
      E.controls('<div class="ctrl"><label>벡터 a 끝점 x</label><input type="range" id="vx" min="-4" max="4" step="1" value="3"><output id="vxo">3</output>'
        +'<label style="margin-left:14px">a 끝점 y</label><input type="range" id="vy" min="-4" max="4" step="1" value="1"><output id="vyo">1</output></div>');
      E.bind('#vx','input',function(e){ self.s.ax=+e.target.value; document.getElementById('vxo').textContent=e.target.value; E.blip(360,0.05); });
      E.bind('#vy','input',function(e){ self.s.ay=+e.target.value; document.getElementById('vyo').textContent=e.target.value; E.blip(330,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var a=[s.ax,s.ay], b=[2,3]; // b 고정
      // 실측: 내적, 노름, 사잇각
      var dot=a[0]*b[0]+a[1]*b[1];
      var na=Math.sqrt(a[0]*a[0]+a[1]*a[1]), nb=Math.sqrt(b[0]*b[0]+b[1]*b[1]);
      var cosA=(na*nb>1e-9)?dot/(na*nb):0; cosA=Math.max(-1,Math.min(1,cosA));
      var ang=Math.acos(cosA)*180/Math.PI;

      var code=[
        {t:'a = np.array(['+a[0]+', '+a[1]+'])', hl:'np.array'},
        {t:'b = np.array([2, 3])', hl:'np.array'},
        {t:'np.dot(a, b)            # 내적', hl:'np.dot'},
        {t:'#  = a·b = '+a[0]+'·2 + '+a[1]+'·3 = '+dot, dim:true},
        {t:'np.linalg.norm(a)       # 길이', hl:'np.linalg.norm'},
        {t:'#  = √('+a[0]*a[0]+'+'+a[1]*a[1]+') = '+na.toFixed(3), dim:true},
        {t:'cosθ = a·b /(|a||b|)', hl:'cos'},
        {t:'#  θ = '+ang.toFixed(1)+'°', dim:true}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'dot_norm.py');

      // 우측: 2D 평면에 두 벡터
      var cx=W*0.72, cy=H*0.52, sc=22;
      function X(x){ return cx+x*sc; } function Y(y){ return cy-y*sc; }
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx-5*sc,cy); ctx.lineTo(cx+5*sc,cy); ctx.moveTo(cx,cy+5*sc); ctx.lineTo(cx,cy-5*sc); ctx.stroke();
      function vec(v,col,lab){ ctx.strokeStyle=col; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(X(v[0]),Y(v[1])); ctx.stroke();
        var an=Math.atan2(-(v[1]),v[0]); // 화면각
        var hx=X(v[0]), hy=Y(v[1]);
        ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-10*Math.cos(an-0.4),hy-10*Math.sin(an-0.4)); ctx.lineTo(hx-10*Math.cos(an+0.4),hy-10*Math.sin(an+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill();
        ctx.fillStyle=col; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(lab, hx+8, hy-4); }
      // 사잇각 호
      if(na>1e-6 && nb>1e-6){ var a1=Math.atan2(b[1],b[0]), a2=Math.atan2(a[1],a[0]);
        ctx.strokeStyle='rgba(126,224,176,0.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,26, -a1, -a2, a2<a1); ctx.stroke(); }
      vec(b,PYB,'b=[2,3]'); vec(a,PYL,'a=['+a[0]+','+a[1]+']');

      // 수치 패널
      var px=W*0.05, py=H*0.72;
      ctx.textAlign='left'; ctx.fillStyle=PYL; ctx.font='600 15px sans-serif';
      ctx.fillText('a·b = '+dot+'   (내적: 같은 자리끼리 곱해 더함)', px, py);
      ctx.fillStyle=GRN; ctx.fillText('|a| = '+na.toFixed(3)+'    |b| = '+nb.toFixed(3)+'   (노름=길이)', px, py+26);
      ctx.fillStyle=(dot>0?GRN:(dot<0?RED:GLD)); ctx.font='600 14px sans-serif';
      ctx.fillText('사잇각 θ = '+ang.toFixed(1)+'°  '+(dot>0?'(예각 — 같은 방향)':(dot<0?'(둔각 — 반대 방향)':'(직각 — 직교!)')), px, py+52);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('내적이 0이면 두 벡터는 수직(직교) — 닮음·유사도의 척도가 됩니다.', px, py+76);

      E.tapHint(W/2, H*0.96, '슬라이더로 a를 돌려 보세요 — 내적·각이 실시간 계산됩니다', true);
      E.big('내적·노름 — 닮음과 길이를 재는 자', '내적 a·b는 두 벡터가 ‘얼마나 같은 방향인가’를 한 숫자로 압축합니다 — 양수면 비슷한 방향, 0이면 직교, 음수면 반대. 노름 ‖a‖는 벡터의 길이(피타고라스)죠. 단어 임베딩의 유사도, 어텐션의 점수가 전부 이 내적 한 번 — 의미의 ‘가까움’을 수로 잰 것입니다.'); }
  },

  // ══════════ 4. 역행렬·연립방정식 — np.linalg.inv · solve(Ax=b) ══════════
  { id:'py7_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // A x = b,  A=[[2,1],[1,3]], b=[5,10] — 실제 닫힌식 계산
      var A=[[2,1],[1,3]], b=[5,10];
      var det=A[0][0]*A[1][1]-A[0][1]*A[1][0]; // = 6-1 = 5
      // 2x2 역행렬 (닫힌식): (1/det)[[d,-b],[-c,a]]
      var inv=[[ A[1][1]/det, -A[0][1]/det],[ -A[1][0]/det, A[0][0]/det]];
      // 해 x = inv @ b
      var x0=inv[0][0]*b[0]+inv[0][1]*b[1], x1=inv[1][0]*b[0]+inv[1][1]*b[1];
      // 검산: A @ x
      var c0=A[0][0]*x0+A[0][1]*x1, c1=A[1][0]*x0+A[1][1]*x1;

      var code=[
        {t:'A = np.array([[2,1],[1,3]])', hl:'np.array'},
        {t:'b = np.array([5, 10])', hl:'np.array'},
        {t:'', dim:true},
        {t:'np.linalg.det(A)     # = '+det, hl:'det'},
        {t:'Ainv = np.linalg.inv(A)', hl:'inv'},
        {t:'', dim:true},
        {t:'x = np.linalg.solve(A, b)', hl:'solve'},
        {t:'#  A x = b 를 직접 풂', dim:true},
        {t:'#  x = ['+fmt(x0)+', '+fmt(x1)+']', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'inverse_solve.py');

      var cw=44, ch=32;
      if(s.step===0){
        // 역행렬 화면
        var ax=W*0.56, ay=H*0.18;
        ctx.fillStyle=PYB; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('A   (det = '+det+')', ax, ay-10);
        matrix(ctx, ax, ay, A, {col:PYB, cw:cw, ch:ch});
        var ix=ax+2*cw+90, iy=ay;
        ctx.fillStyle=GLD; ctx.fillText('A⁻¹ = (1/det)·[[d,−b],[−c,a]]', ix, iy-10);
        matrix(ctx, ix, iy, inv, {col:GLD, cw:cw+8, ch:ch, bracket:'rgba(255,210,122,0.5)'});
        // A @ A⁻¹ = I 검산 (실측)
        var I=[[0,0],[0,0]]; for(var r=0;r<2;r++) for(var c=0;c<2;c++){ var sm=0; for(var k=0;k<2;k++) sm+=A[r][k]*inv[k][c]; I[r][c]=Math.abs(sm)<1e-9?0:sm; }
        var px=W*0.56, py=ay+2*ch+50;
        ctx.fillStyle=GRN; ctx.fillText('검산  A @ A⁻¹ = I (단위행렬)', px, py-10);
        matrix(ctx, px, py, I, {col:GRN, cw:cw, ch:ch, bracket:'rgba(126,224,176,0.5)'});
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('역행렬 A⁻¹ 은 ‘되돌리는’ 행렬 — 곱하면 단위행렬 I 가 됩니다.', W*0.06, H*0.92);
        ctx.fillStyle=PNK; ctx.fillText('det=0 이면 역행렬이 없습니다(특이행렬) — 되돌릴 수 없음.', W*0.06, H*0.92+20);
      } else {
        // 연립방정식 해 — 두 직선의 교점으로 시각화
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
        ctx.fillText('2x + y = 5      x + 3y = 10', W*0.55, H*0.17);
        // 그래프
        var gx=W*0.70, gy=H*0.50, sc=26;
        function GX(x){ return gx+x*sc; } function GY(y){ return gy-y*sc; }
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(gx-4*sc,gy); ctx.lineTo(gx+5*sc,gy); ctx.moveTo(gx,gy+3*sc); ctx.lineTo(gx,gy-5*sc); ctx.stroke();
        // line1: y = 5 - 2x ; line2: y = (10 - x)/3
        function line(f,col){ ctx.strokeStyle=col; ctx.lineWidth=2.2; ctx.beginPath();
          var first=true; for(var xx=-2;xx<=5.01;xx+=0.1){ var yy=f(xx); var py=GY(yy); if(py<gy-5.2*sc||py>gy+3.2*sc){ first=true; continue; } if(first){ ctx.moveTo(GX(xx),py); first=false; } else ctx.lineTo(GX(xx),py); } ctx.stroke(); }
        line(function(x){return 5-2*x;}, PYB);
        line(function(x){return (10-x)/3;}, GLD);
        // 교점 = 해
        ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(GX(x0),GY(x1),6,0,7); ctx.fill();
        ctx.strokeStyle=GRN; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(GX(x0),GY(x1),10,0,7); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText('('+fmt(x0)+', '+fmt(x1)+')', GX(x0)+12, GY(x1)-6);

        var px=W*0.05, py=H*0.74;
        ctx.fillStyle=GRN; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
        ctx.fillText('해  x = '+fmt(x0)+',  y = '+fmt(x1)+'   (두 직선의 교점)', px, py);
        ctx.fillStyle='#e7ecda'; ctx.font='14px ui-monospace,Menlo,monospace';
        ctx.fillText('검산: 2·'+fmt(x0)+'+'+fmt(x1)+' = '+fmt(c0)+',   '+fmt(x0)+'+3·'+fmt(x1)+' = '+fmt(c1), px, py+26);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('solve(A,b)는 x=A⁻¹b 와 같은 답을, 더 빠르고 정확하게 구합니다.', px, py+50);
      }

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (역행렬·검산 → 연립방정식 해)', true);
      E.big('역행렬·연립방정식 — 거꾸로 푸는 법', '‘Ax = b’는 미지수 여러 개의 연립방정식을 행렬 한 줄로 쓴 것 — 역행렬 A⁻¹을 곱하면 x = A⁻¹b로 풀립니다(det가 0이 아닐 때). 실무에선 inv를 직접 구하기보다 solve(A,b)를 씁니다(더 안정·빠름). 회귀의 정규방정식, 물리 시뮬, 그래픽 변환이 전부 이 한 패턴 위에 섭니다.'); }
  },

  // ══════════ 5. 고유값·고유벡터 — np.linalg.eig (왜 중요한가) ══════════
  { id:'py7_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 대칭행렬 A=[[2,1],[1,2]] — 고유값/고유벡터 닫힌식 실계산
      var A=[[2,1],[1,2]];
      var a=A[0][0], b=A[0][1], c=A[1][0], d=A[1][1];
      var tr=a+d, det=a*d-b*c;
      var disc=Math.sqrt(tr*tr-4*det);
      var l1=(tr+disc)/2, l2=(tr-disc)/2; // 3, 1
      // 고유벡터: (A-λI)v=0 → 대칭이라 정규화. λ1=3: v=[1,1]/√2 ; λ2=1: v=[1,-1]/√2
      function eigvec(lam){ // (a-lam)vx + b vy = 0
        var vx, vy;
        if(Math.abs(b)>1e-9){ vx=b; vy=lam-a; } else { vx=1; vy=0; }
        var n=Math.sqrt(vx*vx+vy*vy)||1; return [vx/n, vy/n]; }
      var v1=eigvec(l1), v2=eigvec(l2);

      var code=[
        {t:'A = np.array([[2,1],[1,2]])', hl:'np.array'},
        {t:'vals, vecs = np.linalg.eig(A)', hl:'eig'},
        {t:'#  고유값  λ = ['+fmt(l1)+', '+fmt(l2)+']', dim:true},
        {t:'#  A v = λ v', dim:true},
        {t:'#  (방향 안 바뀌고 λ배만 늘어남)', dim:true},
        {t:'', dim:true},
        {t:'# PCA·신경망·구글 PageRank …', dim:true},
        {t:'# 전부 고유값 분해 위에 섭니다', dim:true}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'eigen.py');

      if(s.step===0){
        // A v = λ v 시각화: 고유벡터 v1은 A를 곱해도 방향 유지, 길이 λ배
        var cx=W*0.72, cy=H*0.50, sc=30;
        function X(x){ return cx+x*sc; } function Y(y){ return cy-y*sc; }
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(cx-4*sc,cy); ctx.lineTo(cx+4*sc,cy); ctx.moveTo(cx,cy+3*sc); ctx.lineTo(cx,cy-3*sc); ctx.stroke();
        // 일반 벡터 u=[1,0] → A u = [2,1] (방향 바뀜)
        var u=[1,0], Au=[A[0][0]*u[0]+A[0][1]*u[1], A[1][0]*u[0]+A[1][1]*u[1]];
        function arr(v,col,lw){ ctx.strokeStyle=col; ctx.lineWidth=lw||2.4; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(X(v[0]),Y(v[1])); ctx.stroke();
          var an=Math.atan2(-(v[1]),v[0]), hx=X(v[0]), hy=Y(v[1]);
          ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-9*Math.cos(an-0.4),hy-9*Math.sin(an-0.4)); ctx.lineTo(hx-9*Math.cos(an+0.4),hy-9*Math.sin(an+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
        // 고유벡터 v1과 A v1 = λ1 v1 (같은 방향)
        var Av1=[l1*v1[0], l1*v1[1]];
        ctx.setLineDash([4,3]); arr(Av1, GRN, 1.6); ctx.setLineDash([]);
        arr(v1, PYL, 2.6);
        // 비교: 일반 벡터 u와 Au (방향 틀어짐)
        ctx.setLineDash([4,3]); arr(Au, PNK, 1.4); ctx.setLineDash([]);
        arr(u, PYB, 2.2);
        ctx.fillStyle=PYL; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('v₁(고유)', X(v1[0])+6, Y(v1[1])-6);
        ctx.fillStyle=GRN; ctx.fillText('A·v₁='+fmt(l1)+'v₁', X(Av1[0])+6, Y(Av1[1])+4);
        ctx.fillStyle=PYB; ctx.fillText('u', X(u[0])+6, Y(u[1])+16);
        ctx.fillStyle=PNK; ctx.fillText('A·u (방향 틀어짐)', X(Au[0])+6, Y(Au[1])-4);

        var px=W*0.05, py=H*0.74;
        ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('λ₁ = '+fmt(l1)+',  v₁ = ['+v1[0].toFixed(2)+', '+v1[1].toFixed(2)+']', px, py);
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
        ctx.fillText('A v₁ = λ₁ v₁ — 방향은 그대로, 길이만 '+fmt(l1)+'배', px, py+24);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('고유벡터 = 행렬을 곱해도 ‘방향이 안 변하는 특별한 축’.', px, py+48);
      } else {
        // 왜 중요한가 — AI 연결 지도
        ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('왜 AI에서 행렬연산이 전부인가', W*0.54, H*0.18);
        var items=[
          {t:'신경망 한 층', d:'y = W·x + b  (행렬곱+덧셈)', c:PYB},
          {t:'학습=역전파', d:'전치 Wᵀ 를 거꾸로 곱함', c:GLD},
          {t:'어텐션', d:'Q·Kᵀ 내적으로 관련도', c:GRN},
          {t:'PCA 차원축소', d:'공분산행렬의 고유벡터', c:PNK},
          {t:'PageRank', d:'링크행렬의 으뜸 고유벡터', c:PYL}
        ];
        var bx=W*0.54, bw=W*0.42, bh=40, gap=12, by=H*0.24;
        for(var i=0;i<items.length;i++){ var y=by+i*(bh+gap), it=items[i];
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=it.c; ctx.lineWidth=1.4; roundRect(ctx,bx,y,bw,bh,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=it.c; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(it.t, bx+12, y+18);
          ctx.fillStyle='#cfe6d8'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText(it.d, bx+12, y+33);
        }
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('딥러닝 = 거대한 행렬곱의 연쇄', W*0.05, H*0.78);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('수십억 파라미터의 학습도, 결국 이 장의 곱·전치·내적·분해의 반복입니다.', W*0.05, H*0.78+24);
      }

      E.tapHint(W/2, H*0.96, '화면 탭 = 다음 (A v = λ v 시각화 → AI 연결 지도)', true);
      E.big('고유값·고유벡터 — 행렬의 ‘속살’', '대부분의 벡터는 행렬을 곱하면 방향이 틀어지지만, 어떤 특별한 벡터(고유벡터)는 방향이 그대로이고 길이만 λ배 늘어납니다 — Av=λv. 이 ‘변하지 않는 축’이 데이터의 본질 방향이죠. PCA는 분산이 가장 큰 고유벡터를 고르고, PageRank는 으뜸 고유벡터로 웹을 줄 세웁니다. 딥러닝은 결국 이런 행렬연산의 거대한 연쇄입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
