/* 파이썬 제14장 — PyTorch 신경망(MNIST 손글씨 분류): nn.Module · 데이터 로드 · 학습 루프 · 평가 · 전체 코드
   동작(behavior)만. 텍스트=content/py14.json. 엔진 js/engine.js 공유. 색: Python=골드(#ffd343).
   골든룰: 화면의 구조·순전파·손실곡선·정확도는 전부 draw()에서 축소판 신경망을 실제 경사하강시켜 계산
   (베껴 박지 않음). PyTorch는 브라우저에서 못 도므로 "코드는 Colab/GPU에서, 화면은 같은 원리의 축소판 실측".
   왼쪽=복사하면 Colab에서 그대로 도는 진짜 PyTorch 코드, 오른쪽=그 원리를 작은 신경망으로 시각화. */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ───────── 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok', dim:true}|문자열]. hl 토큰만 노랑 강조 ─────────
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=20, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
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
        ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#e7ecda'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht;
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function relu(z){ return z>0?z:0; }
  // 안정적 소프트맥스
  function softmax(z){ var m=Math.max.apply(null,z), s=0, o=[]; for(var i=0;i<z.length;i++){ o[i]=Math.exp(z[i]-m); s+=o[i]; } for(i=0;i<z.length;i++) o[i]/=s; return o; }

  // ──────────────────────────────────────────────────────────────────────────
  //  축소판 "MNIST" — 10×10 픽셀 격자로 그린 3종 숫자(0,1,7)의 대표 패턴.
  //  진짜 28×28 6만장 대신, 결정적으로 만든 작은 데이터셋을 브라우저에서 실제 학습시킨다.
  //  입력 100차원 → 은닉 16(ReLU) → 출력 3(softmax). 교차엔트로피 + 경사하강(전부 실계산).
  // ──────────────────────────────────────────────────────────────────────────
  var GW=10, GH=10, NIN=GW*GH, NH=16, NOUT=3;

  // 3개의 기준 글리프(10×10). 1=칠해짐. 손글씨처럼 보이는 단순 패턴.
  var GLYPH = {
    0:[ "..######..","..#....#..",".#......#.",".#......#.",".#......#.",
        ".#......#.",".#......#.",".#......#.","..#....#..","..######.." ],
    1:[ "....##....","...###....","..#.##....","....##....","....##....",
        "....##....","....##....","....##....","...####...","..######.." ],
    7:[ ".#######..",".......#..","......#...",".....#....","....#.....",
        "...##.....","...#......","..#.......","..#.......","..#......." ]
  };
  var DIGITS=[0,1,7];
  function glyphVec(d){ var rows=GLYPH[d], v=[]; for(var r=0;r<GH;r++) for(var c=0;c<GW;c++) v.push(rows[r].charAt(c)==='#'?1:0); return v; }

  // 결정적 의사난수(시드) — Math.random 금지(골든룰). 노이즈 있는 학습/시험 표본 생성용.
  function rng(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

  // 한 표본 = 기준 글리프 + 약간의 픽셀 노이즈(손글씨 변형 흉내). 결정적.
  function sample(d, seed){ var base=glyphVec(d), R=rng(seed), v=[];
    for(var i=0;i<NIN;i++){ var p=base[i]; if(R()<0.06) p=1-p; v.push(p); } return v; }

  // 결정적 초기 가중치(작은 값). 시드 기반.
  function initNet(){ var R=rng(20240614);
    var W1=[], b1=[], W2=[], b2=[];
    for(var j=0;j<NH;j++){ W1.push([]); for(var i=0;i<NIN;i++) W1[j].push((R()-0.5)*0.30); b1.push(0); }
    for(var k=0;k<NOUT;k++){ W2.push([]); for(j=0;j<NH;j++) W2[k].push((R()-0.5)*0.30); b2.push(0); }
    return {W1:W1,b1:b1,W2:W2,b2:b2};
  }
  // 순전파 — 입력 x(100) → 은닉 h(16,ReLU) → 로짓 z(3) → 확률 p(3,softmax)
  function forward(net,x){
    var h=[], hz=[];
    for(var j=0;j<NH;j++){ var z=net.b1[j], W=net.W1[j]; for(var i=0;i<NIN;i++) z+=W[i]*x[i]; hz[j]=z; h[j]=relu(z); }
    var zo=[]; for(var k=0;k<NOUT;k++){ var s=net.b2[k], Wk=net.W2[k]; for(j=0;j<NH;j++) s+=Wk[j]*h[j]; zo[k]=s; }
    var p=softmax(zo);
    return {h:h,hz:hz,z:zo,p:p};
  }
  function argmax(a){ var m=0; for(var i=1;i<a.length;i++) if(a[i]>a[m]) m=i; return m; }

  // 미니배치 한 번에 대한 역전파 + 경사하강 1스텝(교차엔트로피). 전부 실제 미분식.
  function trainStep(net, batch, lr){
    // 그래디언트 누적
    var gW1=[], gb1=[], gW2=[], gb2=[], j,i,k;
    for(j=0;j<NH;j++){ gW1.push(new Array(NIN).fill(0)); gb1.push(0); }
    for(k=0;k<NOUT;k++){ gW2.push(new Array(NH).fill(0)); gb2.push(0); }
    var loss=0, B=batch.length;
    for(var s=0;s<B;s++){ var x=batch[s].x, y=batch[s].y;        // y = 정답 클래스 인덱스(0..2)
      var f=forward(net,x), p=f.p, h=f.h, hz=f.hz;
      loss += -Math.log(Math.max(p[y],1e-12));
      // 출력층: dL/dz = p - onehot(y)  (softmax+CE의 깔끔한 식)
      var dz=[]; for(k=0;k<NOUT;k++) dz[k]=p[k]-(k===y?1:0);
      // 은닉으로 역전파
      var dh=new Array(NH).fill(0);
      for(k=0;k<NOUT;k++){ gb2[k]+=dz[k]; var W2k=net.W2[k];
        for(j=0;j<NH;j++){ gW2[k][j]+=dz[k]*h[j]; dh[j]+=dz[k]*W2k[j]; } }
      for(j=0;j<NH;j++){ var dz1=(hz[j]>0?dh[j]:0); gb1[j]+=dz1;
        var W1j=gW1[j]; for(i=0;i<NIN;i++) W1j[i]+=dz1*x[i]; }
    }
    // 평균 그래디언트로 갱신
    var inv=1/B;
    for(j=0;j<NH;j++){ net.b1[j]-=lr*gb1[j]*inv; var nW1=net.W1[j], g1=gW1[j]; for(i=0;i<NIN;i++) nW1[i]-=lr*g1[i]*inv; }
    for(k=0;k<NOUT;k++){ net.b2[k]-=lr*gb2[k]*inv; var nW2=net.W2[k], g2=gW2[k]; for(j=0;j<NH;j++) nW2[j]-=lr*g2[j]*inv; }
    return loss*inv;
  }

  // 훈련셋(클래스당 8장)·시험셋(클래스당 6장) — 결정적으로 미리 생성(seed로 재현 가능)
  function makeSet(perClass, seedBase){ var set=[];
    for(var c=0;c<DIGITS.length;c++) for(var n=0;n<perClass;n++)
      set.push({ x:sample(DIGITS[c], seedBase+c*1000+n*7+1), y:c, d:DIGITS[c] });
    return set;
  }
  var TRAIN = makeSet(8, 7000);
  var TEST  = makeSet(6, 90000);

  // 전체 학습 곡선을 한 번 실제로 돌려 캐시(에폭별 손실·훈련정확도·시험정확도). 결정적이라 매번 동일.
  function evalAcc(net, set){ var ok=0; for(var i=0;i<set.length;i++){ var f=forward(net,set[i].x); if(argmax(f.p)===set[i].y) ok++; } return ok/set.length; }
  var CURVE=null;
  function computeCurve(){ if(CURVE) return CURVE;
    var net=initNet(), EPOCHS=30, lr=0.5;
    var loss=[], tr=[], te=[];
    // 에폭 0 (학습 전)
    loss.push(meanLoss(net,TRAIN)); tr.push(evalAcc(net,TRAIN)); te.push(evalAcc(net,TEST));
    for(var e=0;e<EPOCHS;e++){
      // 한 에폭 = 전체 훈련셋을 미니배치(크기 6)로 훑기
      for(var b=0;b<TRAIN.length;b+=6) trainStep(net, TRAIN.slice(b,b+6), lr);
      loss.push(meanLoss(net,TRAIN)); tr.push(evalAcc(net,TRAIN)); te.push(evalAcc(net,TEST));
    }
    CURVE={loss:loss,tr:tr,te:te,EPOCHS:EPOCHS, finalNet:net};
    return CURVE;
  }
  function meanLoss(net,set){ var L=0; for(var i=0;i<set.length;i++){ var f=forward(net,set[i].x); L+=-Math.log(Math.max(f.p[set[i].y],1e-12)); } return L/set.length; }
  // 특정 에폭까지만 학습한 net을 재구성(결정적 리플레이) — 학습 루프 장면의 슬라이더용
  function netAtEpoch(ep){ var net=initNet(), lr=0.5;
    for(var e=0;e<ep;e++) for(var b=0;b<TRAIN.length;b+=6) trainStep(net, TRAIN.slice(b,b+6), lr);
    return net;
  }

  // 10×10 글리프 미니 렌더
  function drawGlyph(ctx, x, y, px, vec, on, off){
    for(var r=0;r<GH;r++) for(var c=0;c<GW;c++){
      var v=vec[r*GW+c];
      ctx.fillStyle = v? (on||'#ffe9a8') : (off||'rgba(255,255,255,0.05)');
      ctx.fillRect(x+c*px, y+r*px, px-0.6, px-0.6);
    }
    ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1; ctx.strokeRect(x-1,y-1,GW*px+1,GH*px+1);
  }

  var scenes = [

  // ══════════ 1. nn.Module — 신경망 클래스 정의 ══════════
  { id:'py14_01',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var code=[
        {t:'import torch', hl:'torch'},
        {t:'import torch.nn as nn', hl:'torch.nn'},
        {t:'', dim:true},
        {t:'class Net(nn.Module):', hl:'nn.Module'},
        {t:'    def __init__(self):', hl:'__init__'},
        {t:'        super().__init__()', dim:true},
        {t:'        self.fc1 = nn.Linear(784, 128)', hl:'nn.Linear'},
        {t:'        self.fc2 = nn.Linear(128, 10)', hl:'nn.Linear'},
        {t:'    def forward(self, x):', hl:'forward'},
        {t:'        x = x.view(-1, 784)   # 평탄화', hl:'view'},
        {t:'        x = torch.relu(self.fc1(x))', hl:'relu'},
        {t:'        return self.fc2(x)    # 로짓 10개', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'model.py');

      // 우측: 구조도 784 → 128 → 10
      var cx=W*0.74;
      ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('한 장의 손글씨가 신경망을 통과하는 길', cx, H*0.14);

      // 28×28 입력 이미지 미니 표현 (대표 '7' 글리프 — 10×10 축소판으로 그림)
      var imx=W*0.56, imy=H*0.22, px=8;
      drawGlyph(ctx, imx, imy, px, glyphVec(7), '#ffe9a8');
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('28×28 픽셀', imx+GW*px/2, imy+GH*px+18);

      // 층 막대 — 노드 수에 비례한 칸
      var layers=[ {n:'입력 784', c:784, col:PYB, sub:'28×28 펼침'},
                   {n:'은닉 128', c:128, col:GLD, sub:'Linear+ReLU'},
                   {n:'출력 10', c:10, col:GRN, sub:'숫자 0~9'} ];
      var bx=W*0.56, bw=W*0.40, by=H*0.50, bh=46, gap=18;
      for(var i=0;i<3;i++){ var y=by+i*(bh+gap), L=layers[i];
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=L.col; ctx.lineWidth=1.6; roundRect(ctx,bx,y,bw,bh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=L.col; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText(L.n, bx+14, y+20);
        ctx.fillStyle='#cfe6d8'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText(L.sub, bx+14, y+36);
        if(i<2){ ctx.strokeStyle=DIM; ctx.lineWidth=1.4; var ay=y+bh, my=ay+gap/2-1;
          ctx.beginPath(); ctx.moveTo(bx+bw/2, ay); ctx.lineTo(bx+bw/2, y+bh+gap); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx+bw/2, y+bh+gap); ctx.lineTo(bx+bw/2-5, y+bh+gap-6); ctx.lineTo(bx+bw/2+5, y+bh+gap-6); ctx.closePath(); ctx.fillStyle=DIM; ctx.fill(); }
      }
      // 파라미터 수 실측
      var params = 784*128 + 128 + 128*10 + 10;
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='center';
      ctx.fillText('학습할 가중치 = 784·128 + 128·10 + 편향 = '+params.toLocaleString()+'개', W*0.5, H*0.92);

      E.tapHint(W/2, H*0.97, 'nn.Module을 상속해 층을 정의하고 forward에 흐름을 적습니다', false);
      E.big('nn.Module — 신경망을 클래스로 정의', 'PyTorch에서 신경망은 nn.Module을 상속한 클래스 하나입니다. __init__에 어떤 층을 쓸지(여기선 Linear 두 개)를 적어 두고, forward에 입력이 그 층들을 어떤 순서로 통과하는지를 적습니다 — 28×28 손글씨를 784개 숫자로 펼치고, 은닉층(ReLU)을 지나, 마지막에 0~9를 가리키는 10개의 점수를 냅니다. 역전파는 PyTorch가 알아서 해 주니, 우리는 ‘앞으로 가는 길’만 적으면 됩니다.'); }
  },

  // ══════════ 2. 데이터 로드 — datasets.MNIST + DataLoader ══════════
  { id:'py14_02',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, fr=E.frame;
      var code=[
        {t:'from torchvision import datasets, transforms', hl:'datasets'},
        {t:'from torch.utils.data import DataLoader', hl:'DataLoader'},
        {t:'', dim:true},
        {t:'tf = transforms.ToTensor()', hl:'ToTensor'},
        {t:'train = datasets.MNIST(".", train=True,', hl:'MNIST'},
        {t:'            download=True, transform=tf)', dim:true},
        {t:'test  = datasets.MNIST(".", train=False,', hl:'MNIST'},
        {t:'            download=True, transform=tf)', dim:true},
        {t:'', dim:true},
        {t:'loader = DataLoader(train, batch_size=64,', hl:'DataLoader'},
        {t:'                    shuffle=True)', hl:'shuffle'},
        {t:'# 6만 장을 64장씩 묶어 한 묶음씩 꺼냄', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'data.py');

      // 우측: 손글씨 숫자 미니 격자 (대표 글리프 9장)
      ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('MNIST — 손으로 쓴 숫자 7만 장', W*0.74, H*0.14);
      var px=4, gw=GW*px, gh=GH*px, gap=10;
      var samples=[ {d:0,s:1},{d:1,s:2},{d:7,s:3},{d:0,s:11},{d:1,s:12},{d:7,s:13},{d:0,s:21},{d:1,s:22},{d:7,s:23} ];
      var ox=W*0.56, oy=H*0.20;
      // 배치 강조: 흐르는 하이라이트로 64장 묶음 개념 표현
      var hi=Math.floor((fr*0.03))%9;
      for(var i=0;i<9;i++){ var col=i%3, row=(i/3|0);
        var x=ox+col*(gw+gap), y=oy+row*(gh+22);
        drawGlyph(ctx, x, y, px, sample(samples[i].d, samples[i].s+500), i===hi?'#fff3c4':'#ffe9a8');
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('라벨 '+samples[i].d, x+gw/2, y+gh+13);
      }

      // 배치 개념 박스
      var bx=W*0.56, by=H*0.66, bw=W*0.40;
      ctx.fillStyle='rgba(108,182,232,0.10)'; ctx.strokeStyle=PYB; ctx.lineWidth=1.4; roundRect(ctx,bx,by,bw,80,9); ctx.fill(); ctx.stroke();
      ctx.fillStyle=PYB; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('배치(batch) = 한 번에 처리하는 묶음', bx+14, by+22);
      ctx.fillStyle='#dfeef0'; ctx.font='12.5px sans-serif';
      ctx.fillText('6만 장을 한꺼번에? 메모리가 터집니다.', bx+14, by+44);
      ctx.fillText('64장씩 잘라(미니배치) 한 묶음마다 한 번씩 가중치를 고칩니다.', bx+14, by+62);

      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('train=True → 학습용 6만 장,  train=False → 시험용 1만 장 (서로 안 겹침)', W*0.5, H*0.93);

      E.tapHint(W/2, H*0.97, 'datasets.MNIST가 자동으로 받고, DataLoader가 배치로 잘라 줍니다', false);
      E.big('데이터 로드 — MNIST를 배치로 흘려보내기', 'torchvision의 datasets.MNIST는 손글씨 숫자 7만 장(학습 6만·시험 1만)을 한 줄로 내려받아 줍니다. 그런데 6만 장을 한꺼번에 신경망에 넣을 순 없죠 — DataLoader가 이를 64장짜리 ‘배치’로 잘라, 한 묶음씩 꺼내 줍니다. 묶음마다 가중치를 한 번씩 고치면 메모리도 아끼고 학습도 안정됩니다. shuffle=True는 매번 순서를 섞어 모델이 순서를 외우지 못하게 합니다.'); }
  },

  // ══════════ 3. 학습 루프 — forward→loss→backward→step ══════════
  { id:'py14_03',
    enter:function(E){ var self=this; this.s={epoch:0};
      E.controls('<div class="ctrl"><label>학습 에폭(epoch)</label><input type="range" id="ep" min="0" max="30" step="1" value="0"><output id="epo">0</output></div>');
      E.bind('#ep','input',function(e){ self.s.epoch=+e.target.value; document.getElementById('epo').textContent=e.target.value; E.blip(320+self.s.epoch*8,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var curve=computeCurve();
      var ep=s.epoch;
      var code=[
        {t:'model = Net()', hl:'Net'},
        {t:'loss_fn = nn.CrossEntropyLoss()', hl:'CrossEntropyLoss'},
        {t:'opt = torch.optim.SGD(model.parameters(),', hl:'SGD'},
        {t:'                      lr=0.1)', dim:true},
        {t:'', dim:true},
        {t:'for epoch in range(5):', hl:'for'},
        {t:'  for x, y in loader:', hl:'for'},
        {t:'    pred = model(x)          # ① 순전파', hl:'model(x)'},
        {t:'    loss = loss_fn(pred, y)   # ② 손실', hl:'loss_fn'},
        {t:'    loss.backward()          # ③ 역전파', hl:'backward'},
        {t:'    opt.step()               # ④ 한 걸음', hl:'step'},
        {t:'    opt.zero_grad()          # ⑤ 초기화', hl:'zero_grad'}
      ];
      codePanel(E, W*0.04, H*0.11, W*0.46, code, 'train_loop.py');

      // 우측: 손실 감소 곡선 (실측)
      var ox=W*0.57, oy=H*0.62, pw=W*0.38, pv=H*0.42;
      var Lmax=Math.max.apply(null,curve.loss)*1.05;
      function SX(e){ return ox + e/curve.EPOCHS*pw; }
      function SY(L){ return oy - L/Lmax*pv; }
      // 축
      ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('에폭 →', ox+pw-16, oy+18);
      ctx.save(); ctx.translate(ox-12, oy-pv/2); ctx.rotate(-Math.PI/2); ctx.fillText('손실', 0,0); ctx.restore();
      // 전체 곡선(흐림) + 현재까지(진하게)
      ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1.6; ctx.beginPath();
      for(var e=0;e<=curve.EPOCHS;e++){ var p=SY(curve.loss[e]); if(e===0)ctx.moveTo(SX(e),p); else ctx.lineTo(SX(e),p); } ctx.stroke();
      ctx.strokeStyle=PYL; ctx.lineWidth=2.6; ctx.beginPath();
      for(e=0;e<=ep;e++){ var p2=SY(curve.loss[e]); if(e===0)ctx.moveTo(SX(e),p2); else ctx.lineTo(SX(e),p2); } ctx.stroke();
      // 현재 점
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(SX(ep),SY(curve.loss[ep]),6,0,7); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.stroke();

      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('손실 곡선 (실제 학습)', ox+pw, oy-pv-8);

      // 5단계 라벨
      var px=W*0.04, py=H*0.74;
      var steps=[ ['① 순전파', '입력→예측 pred', PYB],
                  ['② 손실', 'CrossEntropy(pred, 정답)', GLD],
                  ['③ 역전파', 'backward()로 기울기 계산', PNK],
                  ['④ 한 걸음', 'step()으로 가중치 갱신', GRN],
                  ['⑤ 초기화', 'zero_grad()로 기울기 비움', DIM] ];
      for(var i=0;i<5;i++){ var yy=py+i*18; ctx.fillStyle=steps[i][2]; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText(steps[i][0], px, yy); ctx.fillStyle='#cfd6c8'; ctx.font='12px sans-serif'; ctx.fillText('— '+steps[i][1], px+62, yy); }

      // 실측 수치 패널
      var qx=W*0.57, qy=H*0.16;
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('에폭 '+ep+'  ·  손실 = '+curve.loss[ep].toFixed(4), qx, qy);
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif';
      ctx.fillText('훈련 정확도 = '+(curve.tr[ep]*100).toFixed(1)+'%', qx, qy+22);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      var drop = curve.loss[0]-curve.loss[ep];
      ctx.fillText('시작 손실 '+curve.loss[0].toFixed(3)+'  →  현재 '+curve.loss[ep].toFixed(3)+(drop>0?'  ('+drop.toFixed(3)+'↓)':''), qx, qy+42);

      E.tapHint(W/2, H*0.96, '슬라이더로 에폭을 늘리면 손실이 실제로 줄어듭니다', true);
      E.big('학습 루프 — 다섯 줄이 전부입니다', '신경망 학습의 심장은 이 다섯 줄의 반복입니다. ①순전파로 예측을 내고, ②CrossEntropyLoss로 ‘얼마나 틀렸나’를 재고, ③loss.backward()가 모든 가중치의 기울기를 한 번에 구하고, ④opt.step()이 그 반대로 한 걸음 내려가고, ⑤zero_grad()로 기울기를 비웁니다(안 비우면 쌓입니다). 이 묶음을 수만 번 돌리면 손실이 뚝뚝 떨어지죠 — 오른쪽 곡선은 같은 원리의 축소판 신경망을 브라우저에서 실제로 경사하강시켜 그린 것입니다.'); }
  },

  // ══════════ 4. 평가·정확도 — torch.no_grad() + argmax ══════════
  { id:'py14_04',
    enter:function(E){ var self=this; this.s={idx:0};
      E.controls('<div class="ctrl"><label>시험 표본 번호</label><input type="range" id="ix" min="0" max="17" step="1" value="0"><output id="ixo">0</output></div>');
      E.bind('#ix','input',function(e){ self.s.idx=+e.target.value; document.getElementById('ixo').textContent=e.target.value; E.blip(360,0.05); });
      E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var curve=computeCurve();
      var net=curve.finalNet;
      var code=[
        {t:'model.eval()', hl:'eval'},
        {t:'correct = 0', dim:true},
        {t:'with torch.no_grad():     # 기울기 끔', hl:'no_grad'},
        {t:'  for x, y in test_loader:', hl:'for'},
        {t:'    pred = model(x)', hl:'model'},
        {t:'    guess = pred.argmax(1)   # 최댓값', hl:'argmax'},
        {t:'    correct += (guess == y).sum()', hl:'sum'},
        {t:'', dim:true},
        {t:'acc = correct / len(test)', hl:'acc'},
        {t:'print(f"정확도: {acc:.2%}")', hl:'print'}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'evaluate.py');

      // 우측: 한 시험 표본 + 예측 확률 막대
      var samp = TEST[s.idx % TEST.length];
      var f = forward(net, samp.x);
      var guess = argmax(f.p);
      var correct = (guess===samp.y);

      ctx.fillStyle=PYL; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('한 번도 못 본 시험 숫자를 맞혀 봅니다', W*0.73, H*0.13);

      // 글리프
      var px=9, imx=W*0.56, imy=H*0.20;
      drawGlyph(ctx, imx, imy, px, samp.x, '#ffe9a8');
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('정답 = '+DIGITS[samp.y], imx+GW*px/2, imy+GH*px+18);

      // 확률 막대 (softmax 실측)
      var bx=W*0.74, by=H*0.20, bw=W*0.20, bh=20, gap=8;
      for(var k=0;k<NOUT;k++){ var y=by+k*(bh+gap), prob=f.p[k];
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,y,bw,bh);
        var isMax=(k===guess);
        ctx.fillStyle = isMax? (correct?GRN:RED) : 'rgba(108,182,232,0.7)';
        ctx.fillRect(bx, y, bw*prob, bh);
        ctx.fillStyle='#e7ecda'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.textAlign='left';
        ctx.fillText('숫자 '+DIGITS[k], bx-58, y+14);
        ctx.fillStyle=isMax?'#0a0f12':'#cfe6d8'; ctx.textAlign='right'; ctx.fillText((prob*100).toFixed(1)+'%', bx+bw-4, y+14);
      }
      // 예측 판정
      ctx.textAlign='left'; ctx.font='600 16px sans-serif';
      ctx.fillStyle = correct?GRN:RED;
      ctx.fillText('argmax → 예측 '+DIGITS[guess]+'  '+(correct?'✓ 정답':'✗ 오답'), W*0.56, H*0.62);

      // 전체 시험 정확도 (실측)
      var acc=curve.te[curve.EPOCHS];
      ctx.fillStyle=PYL; ctx.font='600 18px sans-serif'; ctx.textAlign='left';
      ctx.fillText('시험셋 전체 정확도 = '+(acc*100).toFixed(1)+'%', W*0.06, H*0.78);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('('+TEST.length+'개 시험 표본 중 '+Math.round(acc*TEST.length)+'개를 맞힘 — 학습에 안 쓴 데이터)', W*0.06, H*0.78+22);
      ctx.fillStyle='#cfd6c8'; ctx.font='12px sans-serif';
      ctx.fillText('no_grad()로 기울기 계산을 꺼 더 빠르고 가볍게 평가합니다.', W*0.06, H*0.78+44);

      E.tapHint(W/2, H*0.96, '슬라이더로 시험 숫자를 넘기며 예측을 확인하세요', true);
      E.big('평가 — 본 적 없는 숫자로 정직하게 채점', '학습이 끝나면 한 번도 못 본 시험 데이터로 실력을 잽니다. 신경망은 각 숫자에 점수(로짓)를 매기고, softmax로 확률로 바꾼 뒤 argmax로 가장 높은 것을 답으로 고릅니다. (guess == y)가 맞은 개수를 세어 정확도를 냅니다. torch.no_grad()는 평가 중엔 기울기가 필요 없으니 그 계산을 꺼 메모리·속도를 아끼는 장치죠 — 진짜 MNIST에선 이렇게 보통 97~98%가 나옵니다.'); }
  },

  // ══════════ 5. 전체 코드 — 20줄로 손글씨를 알아보는 신경망 ══════════
  { id:'py14_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      var curve=computeCurve();
      var code=[
        {t:'import torch, torch.nn as nn', hl:'torch'},
        {t:'from torchvision import datasets, transforms', dim:true},
        {t:'from torch.utils.data import DataLoader', dim:true},
        {t:'', dim:true},
        {t:'tf = transforms.ToTensor()', dim:true},
        {t:'tr = datasets.MNIST(".",train=True,download=True,transform=tf)', hl:'MNIST'},
        {t:'ld = DataLoader(tr, batch_size=64, shuffle=True)', hl:'DataLoader'},
        {t:'', dim:true},
        {t:'model = nn.Sequential(nn.Flatten(),', hl:'Sequential'},
        {t:'          nn.Linear(784,128), nn.ReLU(),', hl:'Linear'},
        {t:'          nn.Linear(128,10))', hl:'Linear'},
        {t:'opt = torch.optim.SGD(model.parameters(), lr=0.1)', hl:'SGD'},
        {t:'loss_fn = nn.CrossEntropyLoss()', hl:'CrossEntropyLoss'},
        {t:'', dim:true},
        {t:'for epoch in range(5):', hl:'for'},
        {t:'  for x, y in ld:', dim:true},
        {t:'    loss = loss_fn(model(x), y)', hl:'loss_fn'},
        {t:'    loss.backward(); opt.step(); opt.zero_grad()', hl:'backward'}
      ];
      codePanel(E, W*0.04, H*0.06, W*0.52, code, 'mnist.py');

      // 우측 결과 요약 카드
      var bx=W*0.60, bw=W*0.36;
      ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('결과 요약', bx+bw/2, H*0.12);

      var rows=[
        {k:'데이터', v:'MNIST 손글씨 7만 장', c:PYB},
        {k:'구조', v:'784 → 128(ReLU) → 10', c:GLD},
        {k:'손실', v:'CrossEntropyLoss', c:PNK},
        {k:'최적화', v:'SGD 경사하강', c:BLU},
        {k:'코드 길이', v:'약 18줄', c:GRN},
        {k:'정확도', v:'~97% (실제 MNIST)', c:GRN}
      ];
      var ry=H*0.18, rh=42, gap=10;
      for(var i=0;i<rows.length;i++){ var y=ry+i*(rh+gap), R=rows[i];
        ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=R.c; ctx.lineWidth=1.4; roundRect(ctx,bx,y,bw,rh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=R.c; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(R.k, bx+14, y+18);
        ctx.fillStyle='#e7ecda'; ctx.font='13px ui-monospace,Menlo,monospace'; ctx.fillText(R.v, bx+14, y+34);
      }

      // 축소판 실측 한 줄 — 정직 고지
      var acc=curve.te[curve.EPOCHS];
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('(이 사이트의 축소판 신경망 실측 시험 정확도: '+(acc*100).toFixed(0)+'% — 같은 원리, 작은 데이터)', W*0.5, H*0.95);

      E.tapHint(W/2, H*0.985, '왼쪽 18줄이 손글씨를 배우는 신경망 전부입니다', false);
      E.big('완성 — 20줄로 손글씨를 알아보는 신경망', '여기까지가 전부입니다. 데이터를 받고, 층을 쌓고, 손실과 옵티마이저를 고르고, 다섯 줄짜리 학습 루프를 돌리면 — 사람이 한 자도 규칙을 적지 않았는데 컴퓨터가 스스로 손글씨를 97% 넘게 알아봅니다. PyTorch는 우리가 ‘앞으로 가는 길(forward)’만 적으면 역전파·기울기·갱신을 모두 대신해 주죠. 진짜 학습은 Colab의 GPU에서 돌지만, 그 안에서 벌어지는 일은 여러분이 이 장에서 직접 본 그 곱·합·경사하강의 반복, 바로 그것입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
