/* 파이썬 제13장 — PyTorch 텐서·자동미분: 텐서 · 텐서연산 · autograd · 경사하강 직접 · 미니 선형회귀
   동작(behavior)만. 텍스트=content/py13.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 텐서값·그래디언트·손실·학습된 직선은 전부 JS에서 실제 계산(PyTorch가 내놓을 값과 일치).
   PyTorch는 브라우저서 못 도니 왼쪽=복사하면 Colab서 그대로 도는 진짜 코드, 오른쪽=같은 계산을 실측 재현.
   "PyTorch = NumPy + 자동미분 + GPU — 딥러닝의 엔진". */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 수치미분(중심차분) — autograd가 내놓을 그래디언트를 실측 재현
  function ndf(f,x){ return (f(x+1e-4)-f(x-1e-4))/2e-4; }

  // ── 등폭 코드 패널: lines=[{t,hl}|문자열]. hl 토큰만 골드 강조. (py7.js 패턴) ──
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=20, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
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
        ctx.fillStyle=(L.dim?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#e7ecda'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }
  function fmt(v){ if(typeof v!=='number') return v; if(Math.abs(v-Math.round(v))<1e-9) return ''+Math.round(v); return v.toFixed(2); }
  // 대괄호 친 행렬 격자. M=2D배열. opt:{hiR,hiC,hiCell:[r,c],col,cw,ch,fs}
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
    var w=C*cw, h=R*ch;
    ctx.strokeStyle=opt.bracket||'rgba(255,255,255,0.45)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(x-4,y-2); ctx.lineTo(x-7,y-2); ctx.lineTo(x-7,y+h+2); ctx.lineTo(x-4,y+h+2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w+4,y-2); ctx.lineTo(x+w+7,y-2); ctx.lineTo(x+w+7,y+h+2); ctx.lineTo(x+w+4,y+h+2); ctx.stroke();
    return {w:w,h:h};
  }

  var scenes = [

  // ══════════ 1. 텐서 — torch.tensor · shape · dtype · GPU ══════════
  { id:'py13_01',
    enter:function(E){ var self=this; this.s={dev:0};
      E.controls('<div class="ctrl"><label>장치</label><input type="range" id="dv" min="0" max="1" step="1" value="0"><output id="dvo">cpu</output></div>');
      E.bind('#dv','input',function(e){ self.s.dev=+e.target.value; document.getElementById('dvo').textContent=self.s.dev?"cuda (GPU)":"cpu"; E.blip(self.s.dev?520:360,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, gpu=s.dev===1;
      var code=[
        {t:'import torch', hl:'torch'},
        {t:'x = torch.tensor([[1., 2., 3.],', hl:'torch.tensor'},
        {t:'                  [4., 5., 6.]])', dim:true},
        {t:'x.shape    # torch.Size([2, 3])', hl:'.shape'},
        {t:'x.dtype    # torch.float32', hl:'.dtype'},
        gpu ? {t:"x = x.to('cuda')   # → GPU 메모리", hl:".to('cuda')"}
            : {t:"# x = x.to('cuda')  # GPU로 보내기", dim:true},
        {t:'x.device   # '+(gpu?'cuda:0':'cpu'), hl:'.device'}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.45, code, 'tensor.py');

      // 텐서 격자 (2×3, 실제 값)
      var M=[[1,2,3],[4,5,6]];
      var ax=W*0.60, ay=H*0.22, cw=46, ch=36;
      ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText('텐서 x  (shape 2×3)', ax+cw*1.5, ay-14);
      matrix(ctx, ax, ay, M, {col:gpu?GRN:PYB, cw:cw, ch:ch, fs:15, bracket:gpu?'rgba(126,224,176,0.6)':'rgba(255,255,255,0.45)'});

      // 장치 칩
      var chx=ax, chy=ay+ch*2+30;
      ctx.fillStyle=gpu?'rgba(126,224,176,0.18)':'rgba(108,182,232,0.16)';
      roundRect(ctx,chx,chy,cw*3,32,8); ctx.fill();
      ctx.strokeStyle=gpu?GRN:PYB; ctx.lineWidth=1.4; ctx.stroke();
      ctx.fillStyle=gpu?GRN:PYB; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText(gpu?'⚡ device = cuda:0 (GPU)':'device = cpu', chx+cw*1.5, chy+21);

      // dtype / shape 주석
      ctx.textAlign='left'; ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('dtype = float32   ·   ndim = 2   ·   numel = 6', ax, chy+58);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif';
      ctx.fillText(gpu?'GPU에 올리면 수천 코어가 행렬을 동시에 계산':'NumPy의 ndarray와 거의 똑같은 다차원 배열', ax, chy+82);

      E.tapHint(W/2, H*0.95, '슬라이더로 cpu ↔ cuda(GPU) 를 바꿔 보세요', true);
      E.big('텐서 — PyTorch의 기본 자료형', 'PyTorch의 텐서(tensor)는 NumPy의 ndarray와 거의 같은 다차원 배열입니다. 차이는 단 둘 — ① .to(\'cuda\')로 GPU에 올려 수천 코어로 병렬 계산하고, ② 곧 볼 자동미분(autograd)으로 기울기를 스스로 구합니다. 화면 코드는 Colab에서 그대로 돌아가고, 오른쪽 격자는 그 텐서를 같은 값으로 재현한 것입니다.'); }
  },

  // ══════════ 2. 텐서 연산 — + · * · @(행렬곱) · reshape ══════════
  { id:'py13_02',
    enter:function(E){ var self=this; this.s={op:0};
      E.controls('<div class="ctrl"><label>연산</label><input type="range" id="op" min="0" max="3" step="1" value="0"><output id="opo">a + b</output></div>');
      E.bind('#op','input',function(e){ self.s.op=+e.target.value; document.getElementById('opo').textContent=['a + b','a * b','A @ B','A.reshape(3,2)'][self.s.op]; E.blip(360+self.s.op*70,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, op=s.op;
      // 고정 텐서
      var a=[[1,2,3],[4,5,6]], b=[[10,20,30],[40,50,60]];   // 같은 모양 → +, *
      var B2=[[1,0],[0,1],[1,1]];                            // (3,2) → A @ B2 = (2,2)
      var code, R, label, col=PYB;
      if(op===0){ // a + b
        code=[ {t:'a = torch.tensor([[1.,2.,3.],[4.,5.,6.]])', hl:'torch.tensor'},
               {t:'b = torch.tensor([[10.,20.,30.],',dim:true},{t:'                  [40.,50.,60.]])',dim:true},
               {t:'a + b      # 원소별 덧셈 (broadcast)', hl:'+'},
               {t:'# NumPy처럼 같은 위치끼리 더함', dim:true} ];
        R=[[a[0][0]+b[0][0],a[0][1]+b[0][1],a[0][2]+b[0][2]],[a[1][0]+b[1][0],a[1][1]+b[1][1],a[1][2]+b[1][2]]];
        label='a + b  (2×3)'; col=PYB;
      } else if(op===1){ // a * b
        code=[ {t:'a = torch.tensor([[1.,2.,3.],[4.,5.,6.]])', hl:'torch.tensor'},
               {t:'b = torch.tensor([[10.,20.,30.],',dim:true},{t:'                  [40.,50.,60.]])',dim:true},
               {t:'a * b      # 원소별 곱 (Hadamard)', hl:'*'},
               {t:'# @ 와 달리 같은 위치끼리 곱함', dim:true} ];
        R=[[a[0][0]*b[0][0],a[0][1]*b[0][1],a[0][2]*b[0][2]],[a[1][0]*b[1][0],a[1][1]*b[1][1],a[1][2]*b[1][2]]];
        label='a * b  (2×3)'; col=GLD;
      } else if(op===2){ // A @ B2
        code=[ {t:'A = torch.tensor([[1.,2.,3.],[4.,5.,6.]])', hl:'torch.tensor'},
               {t:'B = torch.tensor([[1.,0.],[0.,1.],[1.,1.]])',dim:true},
               {t:'A @ B      # 행렬곱 (2,3)@(3,2)=(2,2)', hl:'@'},
               {t:'# 신경망의 한 층 = 바로 이 행렬곱', dim:true} ];
        R=[[0,0],[0,0]]; for(var r=0;r<2;r++) for(var c=0;c<2;c++){ var sm=0; for(var k=0;k<3;k++) sm+=a[r][k]*B2[k][c]; R[r][c]=sm; }
        label='A @ B  (2×2)'; col=GRN;
      } else { // reshape
        code=[ {t:'A = torch.tensor([[1.,2.,3.],[4.,5.,6.]])', hl:'torch.tensor'},
               {t:'A.reshape(3, 2)   # 모양만 바꿈', hl:'.reshape'},
               {t:'# 데이터 6개는 그대로, 배치만 (3,2)', dim:true},
               {t:'A.shape   # (2,3) → (3,2)', hl:'.shape'} ];
        R=[[1,2],[3,4],[5,6]];
        label='A.reshape(3,2)'; col=PNK;
      }
      codePanel(E, W*0.04, H*0.14, W*0.45, code, 'ops.py');

      // 좌항/우항 + 결과 격자
      var cw=40, ch=30, ax=W*0.55, ay=H*0.20;
      ctx.fillStyle=DIM; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      if(op<2){
        ctx.fillText('a', ax, ay-8); matrix(ctx, ax, ay, a, {col:PYB, cw:cw, ch:ch});
        ctx.fillText('b', ax+W*0.20, ay-8); matrix(ctx, ax+W*0.20, ay, b, {col:PYB, cw:cw, ch:ch});
      } else if(op===2){
        ctx.fillText('A (2×3)', ax, ay-8); matrix(ctx, ax, ay, a, {col:PYB, cw:cw, ch:ch});
        ctx.fillText('B (3×2)', ax+W*0.22, ay-8); matrix(ctx, ax+W*0.22, ay, B2, {col:PYB, cw:cw, ch:ch});
      } else {
        ctx.fillText('A (2×3)', ax, ay-8); matrix(ctx, ax, ay, a, {col:PYB, cw:cw, ch:ch});
      }
      // 결과
      var ry=H*0.62;
      ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('= '+label, ax, ry-10);
      matrix(ctx, ax+10, ry, R, {col:col, cw:46, ch:34, fs:15, bracket:'rgba(126,224,176,0.55)'});

      E.tapHint(W/2, H*0.95, '슬라이더로 +, *, @(행렬곱), reshape 를 골라 결과를 보세요', true);
      E.big('텐서 연산 — NumPy 그대로, 더하기 자동미분', '+ 와 * 는 같은 위치끼리(원소별)이고, @ 는 행렬곱입니다. 신경망의 한 층은 결국 입력에 가중치 행렬을 @ 로 곱하는 일 — 그래서 텐서 연산이 곧 딥러닝의 계산입니다. reshape 는 데이터를 그대로 둔 채 모양만 바꾸죠. 오른쪽 결과 격자는 모두 실제로 계산한 값입니다.'); }
  },

  // ══════════ 3. autograd — y=x**2, x.grad = 2x ══════════
  { id:'py13_03',
    enter:function(E){ var self=this; this.s={x:3.0};
      E.controls('<div class="ctrl"><label>x (requires_grad=True)</label><input type="range" id="xx" min="-4" max="4" step="0.1" value="3.0"><output id="xxo">3.0</output></div>');
      E.bind('#xx','input',function(e){ self.s.x=+e.target.value; document.getElementById('xxo').textContent=(+e.target.value).toFixed(1); E.blip(360,0.06); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, x=s.x;
      function f(t){ return t*t; }
      var y=f(x), grad=ndf(f,x);   // autograd가 내놓을 dy/dx = 2x (실측)
      var code=[
        {t:'x = torch.tensor('+x.toFixed(1)+', requires_grad=True)', hl:'requires_grad=True'},
        {t:'y = x ** 2          # y = '+y.toFixed(2), hl:'x ** 2'},
        {t:'y.backward()        # 역전파 — 기울기 계산', hl:'.backward()'},
        {t:'x.grad              # dy/dx = 2x = '+grad.toFixed(1), hl:'.grad'},
        {t:'# 사람이 미분식 안 짜도 PyTorch가 자동으로!', dim:true}
      ];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'autograd.py');

      // ── 계산 그래프: x → (제곱) → y, 역방향 grad ──
      var nx=W*0.62, ny1=H*0.22, ny2=H*0.40;
      function node(X,Y,col,lab,val){ ctx.fillStyle='rgba(20,30,40,0.9)'; ctx.strokeStyle=col; ctx.lineWidth=2.4;
        ctx.beginPath(); ctx.arc(X,Y,30,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=col; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(lab,X,Y-2);
        ctx.fillStyle='#dfeef0'; ctx.font='12px sans-serif'; ctx.fillText(val,X,Y+15); }
      // 순전파 화살표 (x → y)
      ctx.strokeStyle=PYB; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(nx,ny1+30); ctx.lineTo(nx,ny2-30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx,ny2-30); ctx.lineTo(nx-5,ny2-37); ctx.lineTo(nx+5,ny2-37); ctx.closePath(); ctx.fillStyle=PYB; ctx.fill();
      ctx.fillStyle=PYB; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('순전파 ( )²', nx+38, (ny1+ny2)/2-4);
      // 역전파 화살표 (y → x, grad)
      ctx.strokeStyle=PNK; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(nx+70,ny2-22); ctx.lineTo(nx+70,ny1+22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx+70,ny1+22); ctx.lineTo(nx+65,ny1+29); ctx.lineTo(nx+75,ny1+29); ctx.closePath(); ctx.fillStyle=PNK; ctx.fill();
      ctx.fillStyle=PNK; ctx.font='12px sans-serif'; ctx.fillText('← backward', nx+78, (ny1+ny2)/2+4);
      node(nx,ny1,PYL,'x',x.toFixed(1));
      node(nx,ny2,GRN,'y=x²',y.toFixed(2));

      // ── grad 큰 표시 + 검산 ──
      var gx=W*0.10, gy=H*0.62;
      ctx.textAlign='left'; ctx.fillStyle='#dffafa'; ctx.font='600 16px sans-serif';
      ctx.fillText('x.grad  =  dy/dx', gx, gy);
      ctx.fillStyle=PNK; ctx.font='700 30px sans-serif'; ctx.fillText(grad.toFixed(1), gx, gy+40);
      ctx.fillStyle=DIM; ctx.font='14px sans-serif';
      ctx.fillText('검산 — 손으로 미분하면 dy/dx = 2x = 2 × '+x.toFixed(1)+' = '+(2*x).toFixed(1), gx, gy+72);
      ctx.fillStyle=Math.abs(grad-2*x)<1e-2?GRN:RED; ctx.font='13px sans-serif';
      ctx.fillText('autograd 결과 '+grad.toFixed(2)+'  =  공식 2x  ✓ 일치', gx, gy+96);

      // 미니 곡선 y=x² + 접선(기울기 grad)
      var ox=W*0.60, oy=H*0.90, pw=W*0.34, pv=H*0.40, X0=-4, X1=4;
      function SX(t){ return ox+(t-X0)/(X1-X0)*pw; }
      function SY(v){ return oy - v/16*pv; }
      ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(SX(0),oy); ctx.lineTo(SX(0),oy-pv); ctx.stroke();
      ctx.strokeStyle=GRN; ctx.lineWidth=2; ctx.beginPath();
      for(var t=X0;t<=X1;t+=0.05){ var p=SY(f(t)); if(t===X0)ctx.moveTo(SX(t),p); else ctx.lineTo(SX(t),p); } ctx.stroke();
      var dxv=1.3; ctx.strokeStyle=PNK; ctx.lineWidth=1.6; ctx.beginPath();
      ctx.moveTo(SX(x-dxv),SY(y-grad*dxv)); ctx.lineTo(SX(x+dxv),SY(y+grad*dxv)); ctx.stroke();
      ctx.fillStyle=PYL; ctx.beginPath(); ctx.arc(SX(x),SY(y),5,0,7); ctx.fill();

      E.tapHint(W/2, H*0.965, 'x를 옮기면 x.grad = 2x 가 따라 바뀝니다 (x=3 → 6.0)', true);
      E.big('자동미분(autograd) — 기울기를 스스로 구한다', 'requires_grad=True 를 붙이면 PyTorch는 그 텐서로 한 모든 계산을 몰래 기록해 둡니다(계산 그래프). y.backward() 한 줄이면 연쇄법칙을 거꾸로 따라가 x.grad 에 dy/dx 를 채워 줍니다. y=x² 이면 x.grad = 2x — x=3 일 때 정확히 6.0 입니다. 사람이 미분식을 손으로 짤 필요가 없죠. 이것이 딥러닝을 가능케 한 엔진입니다.'); }
  },

  // ══════════ 4. 경사하강 직접 — loss=(w·x−y)² 를 w로 backward → w -= lr·w.grad ══════════
  { id:'py13_04',
    enter:function(E){ var self=this; this.s={step:0};
      E.controls('<div class="ctrl"><label>학습 스텝</label><input type="range" id="st" min="0" max="30" step="1" value="0"><output id="sto">0</output></div>');
      E.bind('#st','input',function(e){ self.s.step=+e.target.value; document.getElementById('sto').textContent=e.target.value; E.blip(320+self.s.step*8,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 데이터 한 점: x=2, 목표 y=6 → 최적 w = 3. loss(w)=(w·x−y)²
      var X=2, Y=6, lr=0.04, w0=-1.0, N=30;
      function loss(w){ var e=w*X-Y; return e*e; }
      // 진짜 경사하강 루프 — w.grad = 2·(w·x−y)·x (autograd 결과와 동일)
      var path=[w0], w=w0;
      for(var k=0;k<N;k++){ var g=2*(w*X-Y)*X; w = w - lr*g; path.push(w); }
      var wNow=path[s.step], gNow=2*(wNow*X-Y)*X, lNow=loss(wNow);

      var code=[
        {t:'w = torch.tensor('+wNow.toFixed(2)+', requires_grad=True)', hl:'requires_grad=True'},
        {t:'x, y = torch.tensor(2.), torch.tensor(6.)', dim:true},
        {t:'loss = (w*x - y) ** 2      # = '+lNow.toFixed(3), hl:'loss'},
        {t:'loss.backward()            # w.grad = '+gNow.toFixed(2), hl:'.backward()'},
        {t:'with torch.no_grad():', hl:'torch.no_grad()'},
        {t:'    w -= 0.04 * w.grad     # 한 스텝 갱신', hl:'w.grad'},
        {t:'    w.grad.zero_()         # 기울기 초기화', hl:'.zero_()'},
        {t:'# (optimizer.step() 이 이걸 대신 해줌)', dim:true}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.47, code, 'gd_step.py');

      // ── 손실곡선 loss(w) + 현재 w 공 ──
      var X0=-1.6, X1=7.0, ox=W*0.58, pw=W*0.37, oy=H*0.62, pv=H*0.40;
      var LMAX=Math.max(loss(X0),loss(X1));
      function SX(v){ return ox+(v-X0)/(X1-X0)*pw; }
      function SY(v){ return oy - v/LMAX*pv; }
      ctx.strokeStyle='rgba(255,211,67,0.20)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      ctx.strokeStyle=PYL; ctx.lineWidth=2.4; ctx.beginPath();
      for(var v=X0;v<=X1;v+=0.04){ var p=SY(loss(v)); if(v===X0)ctx.moveTo(SX(v),p); else ctx.lineTo(SX(v),p); } ctx.stroke();
      // 최적 w=3 점선
      ctx.strokeStyle='rgba(126,224,176,0.45)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(SX(3),oy); ctx.lineTo(SX(3),SY(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('최적 w=3', SX(3), oy+15);
      // 발자국
      for(k=0;k<=s.step;k++){ var a=k/Math.max(1,s.step); ctx.fillStyle='rgba(255,211,67,'+(0.18+0.5*a)+')';
        ctx.beginPath(); ctx.arc(SX(path[k]),SY(loss(path[k])),3,0,7); ctx.fill(); }
      // 현재 공 + 기울기 접선
      ctx.strokeStyle=PNK; ctx.lineWidth=1.6; var dd=0.9;
      ctx.beginPath(); ctx.moveTo(SX(wNow-dd),SY(lNow-gNow*dd)); ctx.lineTo(SX(wNow+dd),SY(lNow+gNow*dd)); ctx.stroke();
      ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(wNow),SY(lNow),7,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('loss(w)', ox+pw-30, SY(LMAX)+12);

      // ── 수치 패널 ──
      var px=W*0.06, py=H*0.66;
      ctx.textAlign='left'; ctx.fillStyle='#dffafa'; ctx.font='600 15px sans-serif';
      ctx.fillText('스텝 '+s.step+' / '+N, px, py);
      ctx.fillStyle=PYB; ctx.font='14px sans-serif'; ctx.fillText('w = '+wNow.toFixed(3), px, py+26);
      ctx.fillStyle=PNK; ctx.fillText('w.grad = 2(w·x−y)·x = '+gNow.toFixed(3), px, py+48);
      ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.fillText('loss = '+lNow.toFixed(4), px, py+74);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('시작 loss '+loss(w0).toFixed(2)+'  →  현재 '+lNow.toFixed(4)+(s.step>0?'  ('+( (1-lNow/loss(w0))*100 ).toFixed(1)+'% 감소)':''), px, py+96);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.fillText('갱신식: w ← w − η·w.grad   (η='+lr+')', px, py+118);

      E.tapHint(W/2, H*0.96, '스텝을 늘리면 w가 3으로, 손실이 0으로 내려갑니다', true);
      E.big('경사하강 — backward 와 w.grad 로 직접', 'loss.backward() 가 w.grad 에 ∂loss/∂w 를 채우면, w ← w − η·w.grad 로 손실이 줄어드는 방향으로 한 걸음 갑니다. 여기 데이터는 x=2, y=6 이라 최적은 w=3 — 스텝을 늘리면 공이 정확히 거기로 굴러 내려갑니다. w.grad.zero_() 로 매번 기울기를 비워 줘야 누적되지 않죠. 이 세 줄을 optimizer.step() 한 줄이 대신해 줍니다.'); }
  },

  // ══════════ 5. 미니 선형회귀 — w,b 학습 (forward·loss·backward·step) ══════════
  { id:'py13_05',
    enter:function(E){ var self=this; this.s={ep:0};
      E.controls('<div class="ctrl"><label>에폭 (학습 반복)</label><input type="range" id="ep" min="0" max="60" step="1" value="0"><output id="epo">0</output></div>');
      E.bind('#ep','input',function(e){ self.s.ep=+e.target.value; document.getElementById('epo').textContent=e.target.value; E.blip(320+self.s.ep*5,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 결정적 데이터: 참 직선 y = 2x + 1 + 약간의 잡음
      function noise(i){ return ((Math.sin(i*12.9898)*43758.5453)%1+1)%1 - 0.5; }
      var DATA=(function(){ var a=[],Nn=10; for(var i=0;i<Nn;i++){ var x=-1.8+i*0.4; a.push([x, 2*x+1 + noise(i)*0.6]); } return a; })();
      var Np=DATA.length;
      // 미니배치 전체 경사하강(MSE) — autograd가 줄 그래디언트를 닫힌식으로 실측
      var lr=0.03, EP=60;
      function mse(w,b){ var s2=0,i; for(i=0;i<Np;i++){ var e=(w*DATA[i][0]+b)-DATA[i][1]; s2+=e*e; } return s2/Np; }
      var w=0, b=0, hist=[mse(0,0)];
      var W_=[0], B_=[0];
      for(var k=0;k<EP;k++){
        var gw=0, gb=0;
        for(var i=0;i<Np;i++){ var e=(w*DATA[i][0]+b)-DATA[i][1]; gw+=2*e*DATA[i][0]/Np; gb+=2*e/Np; }
        w -= lr*gw; b -= lr*gb; hist.push(mse(w,b)); W_.push(w); B_.push(b);
      }
      var ep=s.ep, wN=W_[ep], bN=B_[ep], lossN=hist[ep];

      var code=[
        {t:'w = torch.zeros(1, requires_grad=True)', hl:'requires_grad=True'},
        {t:'b = torch.zeros(1, requires_grad=True)', dim:true},
        {t:'opt = torch.optim.SGD([w,b], lr=0.03)', hl:'optim.SGD'},
        {t:'for epoch in range(60):', hl:'for'},
        {t:'    yhat = w*x + b              # 순전파', hl:'w*x + b'},
        {t:'    loss = ((yhat - y)**2).mean()  # MSE', hl:'loss'},
        {t:'    loss.backward()             # 기울기', hl:'.backward()'},
        {t:'    opt.step(); opt.zero_grad() # 갱신', hl:'opt.step()'}
      ];
      codePanel(E, W*0.035, H*0.10, W*0.47, code, 'linreg.py');

      // ── 산점도 + 학습된 직선 ──
      var ox=W*0.57, oy=H*0.55, pw=W*0.39, pv=H*0.40, dX0=-2.2, dX1=2.2, dY0=-4, dY1=6;
      function SX(x){ return ox+(x-dX0)/(dX1-dX0)*pw; }
      function SY(y){ return oy - (y-dY0)/(dY1-dY0)*pv; }
      ctx.strokeStyle='rgba(255,211,67,0.18)'; ctx.lineWidth=1; ctx.beginPath();
      ctx.moveTo(SX(dX0),SY(0)); ctx.lineTo(SX(dX1),SY(0)); ctx.moveTo(SX(0),SY(dY0)); ctx.lineTo(SX(0),SY(dY1)); ctx.stroke();
      // 데이터 점
      for(i=0;i<Np;i++){ ctx.fillStyle=PYB; ctx.beginPath(); ctx.arc(SX(DATA[i][0]),SY(DATA[i][1]),4,0,7); ctx.fill(); }
      // 학습된 직선
      ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath();
      ctx.moveTo(SX(dX0),SY(wN*dX0+bN)); ctx.lineTo(SX(dX1),SY(wN*dX1+bN)); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('데이터 ● · 학습 직선 ━', SX(dX0)+4, SY(dY1)+12);

      // ── 손실 곡선 ──
      var lx=W*0.57, ly=H*0.96, lw=W*0.39, lv=H*0.16, LMAX=hist[0];
      function LX(e){ return lx+e/EP*lw; }
      function LY(v){ return ly - v/LMAX*lv; }
      ctx.strokeStyle='rgba(255,211,67,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(lx+lw,ly); ctx.moveTo(lx,ly); ctx.lineTo(lx,ly-lv); ctx.stroke();
      ctx.strokeStyle=PYL; ctx.lineWidth=1.8; ctx.beginPath();
      for(var e=0;e<=ep;e++){ var p=LY(hist[e]); if(e===0)ctx.moveTo(LX(e),p); else ctx.lineTo(LX(e),p); } ctx.stroke();
      ctx.fillStyle=PNK; ctx.beginPath(); ctx.arc(LX(ep),LY(lossN),4,0,7); ctx.fill();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('손실 ↓ (에폭)', lx+4, ly-lv-2);

      // ── 학습 파라미터 패널 ──
      var px=W*0.04, py=H*0.62;
      ctx.textAlign='left'; ctx.fillStyle='#dffafa'; ctx.font='600 15px sans-serif';
      ctx.fillText('에폭 '+ep+' / '+EP, px, py);
      ctx.fillStyle=GRN; ctx.font='14px sans-serif';
      ctx.fillText('학습된  ŷ = '+wN.toFixed(2)+'·x + '+bN.toFixed(2), px, py+26);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(참값 y = 2x + 1 — 거의 회복!)', px, py+46);
      ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.fillText('손실 MSE = '+lossN.toFixed(4), px, py+72);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('시작 '+hist[0].toFixed(3)+'  →  '+lossN.toFixed(4)+(ep>0?'  ('+((1-lossN/hist[0])*100).toFixed(1)+'%↓)':''), px, py+92);

      E.tapHint(W/2, H*0.965, '에폭을 늘리면 직선이 데이터에 맞아 가고 손실이 떨어집니다', true);
      E.big('미니 선형회귀 — PyTorch 학습의 전체 모습', '이 여덟 줄이 모든 딥러닝의 축소판입니다 — ① 순전파로 ŷ=w·x+b 예측, ② loss 로 오차 측정, ③ backward() 로 기울기, ④ optimizer.step() 으로 갱신. 이 고리를 60번 돌리면 w·b 가 참값 2·1 로 스스로 수렴하고 손실이 바닥으로 내려갑니다. 화면의 직선·파라미터·손실은 같은 경사하강을 실제로 돌려 얻은 값입니다. 층을 수십 개 쌓고 파라미터를 수십억 개로 늘리면 그것이 바로 GPT입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
