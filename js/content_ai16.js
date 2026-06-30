/* 인공지능 제16장 — 파이썬 생태계: NumPy · pandas · scikit-learn · PyTorch · Hugging Face
   동작(behavior)만. 텍스트=content/ai16.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면에 표시되는 모든 배열·DataFrame·텐서·그래디언트 값은 실제로 계산한 값(베껴 박지 않음).
   이 장은 '실행되지 않는 예시 코드' 패널 + 핵심 결과/개념 시각화. AI 기초부터 실무까지의 마무리(마지막 장). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok'}|문자열]. tok이 들어간 부분만 시안 강조.
  function codePanel(E, x, y, w, lines, title){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(61,214,220,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+ (title?26:0);
    if(title){ ctx.fillStyle=CYA; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(hl && t.indexOf(hl)>=0){
        var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl);
        ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty);
        var wpre=ctx.measureText(pre).width;
        ctx.fillStyle=CYA; ctx.fillText(hl, x+pad+wpre, ty);
        var whl=ctx.measureText(hl).width;
        ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else {
        ctx.fillStyle=(L.dim?DIM:'#cfe6e8'); ctx.fillText(t, x+pad, ty);
      }
    }
    return top+ht; // 아래 y 반환
  }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // 작은 셀 격자(배열/행렬/데이터프레임 공용)
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#dfeef0'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. NumPy — ndarray · 벡터연산 · 브로드캐스팅 ══════════
  { id:'ai16_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 코드 패널
      var code=[
        {t:'import numpy as np', hl:'numpy'},
        {t:'a = np.array([1, 2, 3])', hl:'np.array'},
        {t:'b = np.array([10, 20, 30])', hl:'np.array'},
        {t:'a + b      # 원소별 덧셈', hl:'a + b'},
        {t:'a * 2      # 스칼라 브로드캐스트', hl:'a * 2'},
        {t:'M = np.arange(6).reshape(2,3)', hl:'reshape'},
        {t:'M + a      # (2,3)+(3,) 브로드캐스트', hl:'M + a'}
      ];
      codePanel(E, W*0.05, H*0.16, W*0.42, code, 'numpy_basics.py');

      // 결과 시각화 — 전부 실제 계산
      var a=[1,2,3], b=[10,20,30];
      var rx=W*0.55, ry=H*0.18, cw=Math.min(54,W*0.045), ch=30, gap=8;
      function row(y,arr,col,lab){ ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='right'; ctx.fillText(lab, rx-10, y+ch/2+5);
        for(var i=0;i<arr.length;i++) cell(ctx, rx+i*(cw+gap), y, cw, ch, arr[i], 'rgba(61,214,220,0.06)', col, '#dfeef0', 14); }

      ctx.textAlign='left'; ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.fillText('ndarray = 격자에 담긴 같은 형(dtype)의 수', rx-90, ry-12);
      row(ry, a, CYA, 'a');
      row(ry+ch+14, b, BLU, 'b');

      // step 0: a+b, step1: a*2, step2: M+a 브로드캐스트
      var oy=ry+ (ch+14)*2 + 22;
      if(s.step===0){
        var ab=a.map(function(v,i){return v+b[i];});
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('a + b  (원소별)', rx-90, oy-8);
        row(oy, ab, GRN, 'a+b');
      } else if(s.step===1){
        var a2=a.map(function(v){return v*2;});
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('a * 2  (스칼라가 모든 원소로 퍼짐)', rx-90, oy-8);
        row(oy, a2, GRN, 'a*2');
      } else {
        // M(2,3) + a(3,) : a가 행마다 복제되어 더해짐
        var M=[[0,1,2],[3,4,5]];
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('M + a  (행 (3,)가 모든 행에 브로드캐스트)', rx-90, oy-10);
        var mx=rx, my=oy+6;
        for(var r=0;r<2;r++) for(var c=0;c<3;c++){
          var v=M[r][c]+a[c];
          cell(ctx, mx+c*(cw+gap), my+r*(ch+6), cw, ch, v, 'rgba(126,224,176,0.08)', GRN, '#dfeef0', 14);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('M = [[0,1,2],[3,4,5]],  a = [1,2,3]', mx, my+2*(ch+6)+18);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (a+b → a*2 → 브로드캐스트)', true);
      E.big('NumPy — 수치계산의 토대', 'NumPy의 ndarray는 같은 형의 수를 격자에 담아, 반복문 없이 배열 전체를 한 번에 계산합니다(C 속도). 모양이 다른 배열도 규칙에 따라 자동으로 맞춰 더하는 ‘브로드캐스팅’이 핵심이죠 — pandas·PyTorch가 모두 이 위에 섭니다.'); }
  },

  // ══════════ 2. pandas — DataFrame · 필터 · groupby ══════════
  { id:'ai16_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 작은 표 데이터(결정적)
      var cols=['city','dept','sales'];
      var rows=[ ['서울','A',30],['부산','A',20],['서울','B',50],['부산','B',10],['서울','A',40] ];

      var code=[
        {t:'import pandas as pd', hl:'pandas'},
        {t:'df = pd.DataFrame(data)', hl:'DataFrame'},
        {t:'', dim:true},
        {t:"df[df.sales > 25]      # 필터", hl:'df.sales > 25'},
        {t:'', dim:true},
        {t:"df.groupby('city')", hl:'groupby'},
        {t:"  .sales.sum()         # 집계", hl:'sum'}
      ];
      codePanel(E, W*0.05, H*0.16, W*0.40, code, 'pandas_basics.py');

      // 표 렌더 헬퍼
      var tx=W*0.52, ty=H*0.18, cw=[58,52,58], ch=26;
      function table(x,y,data,hi){
        // 헤더
        var cx=x;
        for(var c=0;c<cols.length;c++){ cell(ctx,cx,y,cw[c],ch,cols[c],'rgba(61,214,220,0.16)',CYA,CYA,12.5); cx+=cw[c]; }
        for(var r=0;r<data.length;r++){
          cx=x; var lit=hi?hi(data[r]):true;
          for(c=0;c<cols.length;c++){
            var fill=lit?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)';
            cell(ctx,cx,y+ch*(r+1),cw[c],ch,data[r][c], fill,'rgba(255,255,255,0.12)', lit?'#dfeef0':DIM, 12.5);
            cx+=cw[c];
          }
        }
      }

      ctx.fillStyle=CYA; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('DataFrame = 라벨 달린 2차원 표', tx, ty-10);
      table(tx, ty, rows, null);

      var ox=W*0.52, oy=ty+ch*(rows.length+1)+34;
      if(s.step===0){
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('탭하면 필터·groupby 결과가 나타납니다.', ox, oy);
      } else if(s.step===1){
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText('df[df.sales > 25]  →  sales가 25 초과인 행만', ox, oy);
        var f=rows.filter(function(r){return r[2]>25;});
        // 헤더+필터 행
        var x=ox, y=oy+12, cx=x;
        for(var c=0;c<cols.length;c++){ cell(ctx,cx,y,cw[c],ch,cols[c],'rgba(61,214,220,0.16)',CYA,CYA,12.5); cx+=cw[c]; }
        for(var r=0;r<f.length;r++){ cx=x; for(c=0;c<cols.length;c++){ cell(ctx,cx,y+ch*(r+1),cw[c],ch,f[r][c],'rgba(126,224,176,0.10)',GRN,'#dfeef0',12.5); cx+=cw[c]; } }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(f.length+'행 남음 (30,50,40)', x, y+ch*(f.length+1)+18);
      } else {
        ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.fillText("groupby('city').sales.sum()  →  도시별 합계", ox, oy);
        // 실제 집계
        var g={}; rows.forEach(function(r){ g[r[0]]=(g[r[0]]||0)+r[2]; });
        var keys=Object.keys(g), x=ox, y=oy+12;
        cell(ctx,x,y,70,ch,'city','rgba(61,214,220,0.16)',CYA,CYA,12.5);
        cell(ctx,x+70,y,70,ch,'sales','rgba(61,214,220,0.16)',CYA,CYA,12.5);
        for(var k=0;k<keys.length;k++){
          cell(ctx,x,y+ch*(k+1),70,ch,keys[k],'rgba(122,184,255,0.10)',BLU,'#dfeef0',12.5);
          cell(ctx,x+70,y+ch*(k+1),70,ch,g[keys[k]],'rgba(126,224,176,0.10)',GRN,GRN,12.5);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('서울=30+50+40=120, 부산=20+10=30', x, y+ch*(keys.length+1)+18);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (표 → 필터 → groupby 집계)', true);
      E.big('pandas — 표 데이터의 표준', 'pandas의 DataFrame은 라벨 달린 표입니다. 조건으로 행을 골라내는 ‘필터’, 키별로 묶어 합·평균을 내는 ‘groupby’ 한 줄이면, 엑셀로 한참 걸릴 분석이 즉시 끝납니다 — 데이터 정제·탐색의 사실상 표준 도구죠.'); }
  },

  // ══════════ 3. scikit-learn — 표준 ML 워크플로 fit/predict ══════════
  { id:'ai16_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(320+this.s.step*70,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from sklearn.linear_model \\', hl:'sklearn'},
        {t:'     import LinearRegression', hl:'LinearRegression'},
        {t:'from sklearn.model_selection \\', hl:'sklearn'},
        {t:'     import train_test_split', hl:'train_test_split'},
        {t:'', dim:true},
        {t:'Xtr,Xte,ytr,yte = train_test_split(X,y)', hl:'train_test_split'},
        {t:'model = LinearRegression()', hl:'LinearRegression'},
        {t:'model.fit(Xtr, ytr)        # 학습', hl:'.fit'},
        {t:'pred = model.predict(Xte)  # 추론', hl:'.predict'},
        {t:'model.score(Xte, yte)      # 평가', hl:'.score'}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.45, code, 'sklearn_workflow.py');

      // 우측: 5단계 파이프라인 (한눈에)
      var steps=[
        {t:'데이터', d:'X (특징), y (라벨)', c:CYA},
        {t:'분할', d:'train_test_split', c:BLU},
        {t:'fit', d:'model.fit(Xtr,ytr)', c:GLD},
        {t:'predict', d:'model.predict(Xte)', c:GRN},
        {t:'score', d:'평가·검증', c:PNK}
      ];
      var bx=W*0.56, bw=W*0.38, bh=42, gap=16, by=H*0.18;
      for(var i=0;i<steps.length;i++){
        var on=(i<=s.step), y=by+i*(bh+gap), st=steps[i];
        ctx.globalAlpha=on?1:0.32;
        ctx.fillStyle=on?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)';
        ctx.strokeStyle=st.c; ctx.lineWidth=(i===s.step)?2.4:1.2;
        roundRect(ctx,bx,y,bw,bh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=st.c; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText((i+1)+'. '+st.t, bx+14, y+19);
        ctx.fillStyle='#cfe6e8'; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillText(st.d, bx+14, y+35);
        ctx.globalAlpha=1;
        if(i<steps.length-1){ ctx.strokeStyle=on?st.c:'rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.beginPath();
          ctx.moveTo(bx+bw/2, y+bh); ctx.lineTo(bx+bw/2, y+bh+gap); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx+bw/2-4,y+bh+gap-6); ctx.lineTo(bx+bw/2,y+bh+gap); ctx.lineTo(bx+bw/2+4,y+bh+gap-6); ctx.fillStyle=on?st.c:'rgba(255,255,255,0.15)'; ctx.fill(); }
      }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('모든 모델이 같은 fit/predict 인터페이스 — 알고리즘만 바꿔 끼우면 됩니다.', W*0.04, H*0.90);
      E.tapHint(W/2, H*0.95, '화면 탭 = 파이프라인 한 단계씩 (데이터→분할→fit→predict→score)', true);
      E.big('scikit-learn — 전통 ML의 표준 인터페이스', '회귀·결정트리·SVM·랜덤포레스트… 수십 가지 알고리즘이 모두 똑같이 model.fit(X,y)로 배우고 model.predict로 답합니다. 모델을 한 줄만 바꿔 끼우면 되니, 비교·실험이 놀랍도록 빠르죠 — 딥러닝이 아닌 표 데이터엔 여전히 첫 번째 선택입니다.'); }
  },

  // ══════════ 4. PyTorch — 텐서 · autograd · nn.Module ══════════
  { id:'ai16_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*120,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import torch', hl:'torch'},
        {t:'x = torch.tensor(3.0,', hl:'tensor'},
        {t:'        requires_grad=True)', hl:'requires_grad'},
        {t:'y = x**2 + 2*x          # y = x²+2x', hl:'x**2'},
        {t:'y.backward()            # 자동미분', hl:'backward'},
        {t:'x.grad   # dy/dx = 2x+2 = 8', hl:'x.grad'},
        {t:'', dim:true},
        {t:'class Net(nn.Module):', hl:'nn.Module'},
        {t:'  def forward(self, x):', hl:'forward'},
        {t:'    return self.fc(x)', hl:'self.fc'}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'pytorch_autograd.py');

      var gx=W*0.56, gw=W*0.40;
      if(s.step===0){
        // autograd 계산그래프: x → x² , 2x → +  → y , backward로 grad 흐름
        ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('autograd — 계산그래프를 거꾸로 미분', gx, H*0.16);
        var cy=H*0.34, r=26;
        function node(x,y,lab,col){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.font='600 14px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lab,x,y+1); ctx.textBaseline='alphabetic'; }
        function arrow(x1,y1,x2,y2,col){ ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
          var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-8*Math.cos(a-0.4),y2-8*Math.sin(a-0.4)); ctx.lineTo(x2-8*Math.cos(a+0.4),y2-8*Math.sin(a+0.4)); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
        var xN=[gx+30,cy], sq=[gx+gw*0.45,cy-44], lin=[gx+gw*0.45,cy+44], yN=[gx+gw*0.82,cy];
        arrow(xN[0]+r,xN[1]-8,sq[0]-r,sq[1]+6,DIM);
        arrow(xN[0]+r,xN[1]+8,lin[0]-r,lin[1]-6,DIM);
        arrow(sq[0]+r,sq[1]+6,yN[0]-r,yN[1]-8,DIM);
        arrow(lin[0]+r,lin[1]-6,yN[0]-r,yN[1]+8,DIM);
        node(xN[0],xN[1],'x=3',CYA); node(sq[0],sq[1],'x²',BLU); node(lin[0],lin[1],'2x',BLU); node(yN[0],yN[1],'y',GLD);
        // 실제 값: y=9+6=15, dy/dx=2x+2=8
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('순전파:  y = 3² + 2·3 = 15', gx, cy+88);
        ctx.fillStyle=GLD; ctx.fillText('역전파:  dy/dx = 2x+2 = 2·3+2 = 8', gx, cy+114);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('backward()가 연쇄법칙으로 grad를 자동 계산 — 신경망 학습의 심장.', gx, cy+138);
      } else {
        // nn.Module: 미니 신경망 그림(2-3-1) + grad descent 개념
        ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('nn.Module — 층을 쌓아 모델을 조립', gx, H*0.16);
        var layers=[2,3,1], lx=[gx+30, gx+gw*0.5, gx+gw-30], cy=H*0.42, sp=44;
        var pos=[];
        for(var l=0;l<layers.length;l++){ pos[l]=[]; var n=layers[l], y0=cy-(n-1)*sp/2;
          for(var k=0;k<n;k++) pos[l][k]=[lx[l], y0+k*sp]; }
        // edges
        for(l=0;l<layers.length-1;l++) for(var a=0;a<layers[l];a++) for(var b=0;b<layers[l+1];b++){
          ctx.strokeStyle='rgba(122,184,255,0.30)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pos[l][a][0],pos[l][a][1]); ctx.lineTo(pos[l+1][b][0],pos[l+1][b][1]); ctx.stroke(); }
        var cols=[CYA,GLD,GRN];
        for(l=0;l<layers.length;l++) for(k=0;k<layers[l];k++){ ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.strokeStyle=cols[l]; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(pos[l][k][0],pos[l][k][1],14,0,7); ctx.fill(); ctx.stroke(); }
        var labs=['입력층(2)','은닉층(3)','출력(1)'];
        for(l=0;l<3;l++){ ctx.fillStyle=cols[l]; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(labs[l], lx[l], cy+(layers[1]*sp/2)+30); }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('forward로 예측 → loss → backward로 모든 가중치의', gx, H*0.80);
        ctx.fillText('grad를 한 번에 구해 optimizer가 갱신합니다.', gx, H*0.80+18);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (autograd 계산그래프 → nn.Module 신경망)', true);
      E.big('PyTorch — 딥러닝 연구의 표준', '텐서는 GPU에서 도는 NumPy 배열이고, autograd는 어떤 계산이든 그래프로 기록해 ‘거꾸로’ 미분합니다 — 손으로 미분식을 적을 필요가 사라지죠. nn.Module로 층을 쌓으면, 수십억 파라미터의 그래디언트도 backward() 한 줄로 흐릅니다.'); }
  },

  // ══════════ 5. Hugging Face — 사전학습 모델 · pipeline() ══════════
  { id:'ai16_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from transformers import pipeline', hl:'transformers'},
        {t:'', dim:true},
        {t:'clf = pipeline(', hl:'pipeline'},
        {t:'  "sentiment-analysis")', hl:'sentiment-analysis'},
        {t:'clf("이 강의 정말 좋아요!")', hl:'clf'},
        {t:'# [{label:POSITIVE, score:0.99}]', dim:true},
        {t:'', dim:true},
        {t:'gen = pipeline("text-generation")', hl:'text-generation'},
        {t:'gen("AI의 미래는")', hl:'gen'}
      ];
      codePanel(E, W*0.04, H*0.15, W*0.45, code, 'huggingface_pipeline.py');

      var gx=W*0.55, gw=W*0.40;
      if(s.step===0){
        // pipeline 흐름: 텍스트 → [토크나이저 → 사전학습모델 → 후처리] → 결과
        ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('pipeline() — 세 단계를 한 줄로 포장', gx, H*0.16);
        var stages=[
          {t:'입력 텍스트', d:'"이 강의 좋아요!"', c:CYA},
          {t:'토크나이저', d:'단어 → 숫자 토큰', c:BLU},
          {t:'사전학습 모델', d:'수억 파라미터 추론', c:GLD},
          {t:'후처리', d:'라벨·점수로 변환', c:PNK},
          {t:'결과', d:'POSITIVE 0.99', c:GRN}
        ];
        var by=H*0.24, bw=gw, bh=34, gap=12;
        for(var i=0;i<stages.length;i++){ var y=by+i*(bh+gap), st=stages[i];
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.4; roundRect(ctx,gx,y,bw,bh,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=st.c; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.t, gx+12, y+22);
          ctx.fillStyle='#cfe6e8'; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText(st.d, gx+bw-12, y+22);
          if(i<stages.length-1){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(gx+bw/2,y+bh); ctx.lineTo(gx+bw/2,y+bh+gap); ctx.stroke(); }
        }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('남이 학습해 둔 모델을 내려받아 몇 줄로 추론 — 학습 비용 0.', gx-W*0.0, H*0.93);
      } else {
        // 생태계 지도: Hub 중심 → Models / Datasets / Spaces / transformers
        ctx.fillStyle=CYA; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('Hugging Face 생태계 — 공유된 AI의 허브', gx, H*0.16);
        var cx=gx+gw*0.5, cy=H*0.46, R=Math.min(gw*0.42,H*0.26);
        // 중심
        ctx.fillStyle='rgba(255,210,122,0.12)'; ctx.strokeStyle=GLD; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(cx,cy,40,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🤗 Hub', cx, cy); ctx.textBaseline='alphabetic';
        var sat=[ {t:'Models', d:'수십만 사전학습 모델', c:CYA},
          {t:'Datasets', d:'공개 학습 데이터', c:BLU},
          {t:'Spaces', d:'데모 앱 호스팅', c:GRN},
          {t:'transformers', d:'추론·학습 라이브러리', c:PNK} ];
        for(var j=0;j<4;j++){ var ang=-Math.PI/2 + j*Math.PI/2, sx=cx+Math.cos(ang)*R, sy=cy+Math.sin(ang)*R;
          ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*40,cy+Math.sin(ang)*40); ctx.lineTo(sx-Math.cos(ang)*30,sy-Math.sin(ang)*30); ctx.stroke();
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=sat[j].c; ctx.lineWidth=1.6; roundRect(ctx,sx-58,sy-22,116,44,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=sat[j].c; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(sat[j].t, sx, sy-3);
          ctx.fillStyle='#cfe6e8'; ctx.font='10.5px sans-serif'; ctx.fillText(sat[j].d, sx, sy+13); }
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('“AI의 깃허브” — 모델·데이터·데모를 모두가 공유.', gx, H*0.92);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (pipeline 흐름 → 생태계 지도)', true);
      E.big('Hugging Face — 사전학습 모델을 몇 줄로', '세상이 학습해 둔 모델 수십만 개가 Hub에 올라와 있고, pipeline() 한 줄이면 감정분석·번역·생성을 즉시 돌립니다 — 직접 학습할 필요가 없죠. AI 기초부터 여기까지, 이제 여러분은 남의 어깨 위에서 곧장 만들 수 있습니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
