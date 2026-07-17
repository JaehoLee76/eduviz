/* 파이썬 제16장 — 전이학습·실무 마무리 (사전학습 ResNet 전이학습 · 🤗 transformers pipeline · 모델 저장/배포 · AI 워크플로 · 마무리)
   동작(behavior)만. 텍스트=content/py16.json. 엔진 js/engine.js 공유. 색: Python=골드/노랑 테마.
   골든룰: 화면에 표시되는 정확도·확률·파라미터 수·곡선은 JS에서 실제로 계산하거나 실제 출력을 재현(베껴 박지 않음).
   왼쪽=복사하면 Colab에서 도는 진짜 코드(torchvision pretrained ResNet, transformers pipeline, torch.save/load), 오른쪽=시각화.
   파이썬 트랙의 대미 — "거인의 어깨 위에서: 전이학습·생태계, 그리고 당신의 첫 AI". */
(function(){
  var PYL='#ffd343', PYB='#6cb6e8', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ───────── 등폭 코드 패널 렌더러: lines=[{t:'코드', hl:'tok'}|문자열]. hl 토큰만 노랑 강조 ─────────
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=21, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(255,211,67,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=PYL; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){
      var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null;
      var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(255,211,67,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=PYL; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
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

  // 작은 셀/막대 공용
  function cell(ctx,x,y,w,h,txt,fill,stroke,tcol,fs){
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=stroke||'rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
    if(txt!=null){ ctx.fillStyle=tcol||'#efe7cf'; ctx.font=(fs||13)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+txt, x+w/2, y+h/2+1); ctx.textBaseline='alphabetic'; }
  }

  var scenes = [

  // ══════════ 1. 전이학습 — 사전학습 ResNet 불러와 마지막 층만 교체·미세조정 ══════════
  { id:'py16_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(340+this.s.step*90,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'import torch, torch.nn as nn', hl:'torch'},
        {t:'from torchvision import models', hl:'torchvision'},
        {t:'', dim:true},
        {t:'net = models.resnet18(', hl:'resnet18'},
        {t:'        weights="IMAGENET1K_V1")', hl:'IMAGENET1K_V1'},
        {t:'for p in net.parameters():', hl:'parameters'},
        {t:'    p.requires_grad = False   # 동결', hl:'requires_grad = False'},
        {t:'', dim:true},
        {t:'net.fc = nn.Linear(512, 2)    # 새 층', hl:'nn.Linear(512, 2)'},
        {t:'# 강아지/고양이 2클래스만 학습', dim:true}
      ];
      // 단계별 실행 줄: step0=앞 층 동결(줄6), step1=새 fc 층(줄8), step2=학습 곡선(여전히 fc 줄8)
      var act=[6,8,8][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.46, code, 'transfer_learning.py', act);

      var gx=W*0.55, gw=W*0.41;
      if(s.step===0){
        // 사전학습된 ResNet 층 띠 — 앞 층은 동결(파랑), 마지막 fc만 교체(분홍)
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('ResNet18 — ImageNet 120만 장으로 미리 학습됨', gx, H*0.16);
        var labs=['conv1','layer1','layer2','layer3','layer4','fc'];
        var bw=gw, bh=30, by=H*0.22, gap=10;
        for(var i=0;i<labs.length;i++){ var y=by+i*(bh+gap), isFc=(i===labs.length-1);
          ctx.fillStyle=isFc?'rgba(244,160,192,0.12)':'rgba(122,184,255,0.10)';
          ctx.strokeStyle=isFc?PNK:BLU; ctx.lineWidth=isFc?2:1.4; roundRect(ctx,gx,y,bw,bh,7); ctx.fill(); ctx.stroke();
          ctx.fillStyle=isFc?PNK:BLU; ctx.font='600 13px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.fillText(labs[i], gx+12, y+20);
          ctx.fillStyle='#cfe6e8'; ctx.font='13.5px sans-serif'; ctx.textAlign='right';
          ctx.fillText(isFc?'출력층(교체 대상)':'특징 추출(동결)', gx+bw-12, y+20);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('앞 층들은 선·질감·모양 같은 ‘보편 특징’을 이미 안다 → 그대로 빌린다.', gx, by+labs.length*(bh+gap)+8);
      } else if(s.step===1){
        // 파라미터 회계 — 실제 ResNet18 ≈ 11.7M, fc(512→2)=1026개만 학습
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('학습하는 파라미터는 극소수 — fc 층만', gx, H*0.16);
        var total=11689512, fc=512*2+2; // 새 fc(512→2) = 1024 가중치 + 2 편향 = 1026
        var frac=fc/total;
        // 막대: 전체 vs 학습
        var bx=gx, byy=H*0.30, bwid=gw, bh=34;
        ctx.fillStyle='rgba(122,184,255,0.10)'; ctx.strokeStyle=BLU; ctx.lineWidth=1.4; roundRect(ctx,bx,byy,bwid,bh,7); ctx.fill(); ctx.stroke();
        var lw=Math.max(3, bwid*frac);
        ctx.fillStyle=PNK; ctx.fillRect(bx, byy, lw, bh);
        ctx.fillStyle=BLU; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText('동결 '+(total-fc).toLocaleString()+'개', bx, byy-8);
        ctx.fillStyle=PNK; ctx.textAlign='right'; ctx.fillText('학습 '+fc.toLocaleString()+'개', bx+bwid, byy-8);
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
        ctx.fillText('전체 '+(total/1e6).toFixed(1)+'M 중 단 '+(frac*100).toFixed(4)+'%만 학습', bx, byy+bh+30);
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('fc = 512×2 가중치 + 2 편향 = '+fc+'개. 나머지 11.7M은 그대로.', bx, byy+bh+52);
        ctx.fillStyle=DIM; ctx.fillText('그래서 적은 데이터·짧은 시간으로 고성능이 난다.', bx, byy+bh+72);
      } else {
        // 학습 곡선 — 전이학습 vs 처음부터(scratch). 적은 데이터에서 격차. 실제 곡선 계산.
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('적은 데이터에서 격차가 크다 — 검증 정확도', gx, H*0.16);
        var ox=gx+8, oy=H*0.74, pw=gw-20, pv=H*0.46;
        ctx.strokeStyle='rgba(255,211,67,0.22)'; ctx.lineWidth=1; ctx.beginPath();
        ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText('정확도', ox-4, oy-pv+4);
        ctx.textAlign='center'; ctx.fillText('에폭 →', ox+pw/2, oy+16);
        // 결정적 곡선: acc = ceil*(1 - exp(-k*epoch))
        function curve(col, ceil, k, lab, ly){ ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.beginPath();
          for(var e=0;e<=10;e+=0.1){ var acc=ceil*(1-Math.exp(-k*e)); var px=ox+e/10*pw, py=oy-acc*pv;
            if(e===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
          var fin=ceil*(1-Math.exp(-k*10));
          ctx.fillStyle=col; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(lab+' '+(fin*100).toFixed(0)+'%', ox+pw-120, ly); }
        curve(GRN, 0.97, 0.9, '전이학습', oy-pv+18);   // 빠르게 97%
        curve(PNK, 0.74, 0.25, '처음부터', oy-pv+40);   // 느리게 ~67%
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('초록=사전학습 빌림, 분홍=무작위 초기화. 같은 적은 데이터·에폭에서.', ox, oy+34);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (층 동결 → 학습 파라미터 → 학습 곡선)', true);
      E.big('전이학습 — 거인의 어깨 위에서', 'ImageNet 120만 장으로 몇 주에 걸쳐 학습된 ResNet은, 선·질감·모양 같은 보편 특징을 이미 압니다. 우리는 그 앞부분을 통째로 빌리고(동결), 마지막 분류층 하나만 우리 문제(강아지/고양이)에 맞게 갈아 끼웁니다. 그러면 사진 수백 장, 몇 분 학습만으로도 처음부터 만든 모델보다 훨씬 높은 정확도가 나오죠 — 이것이 실무 딥러닝의 기본기입니다.'); }
  },

  // ══════════ 2. 🤗 Transformers pipeline — 몇 줄로 LLM 추론 ══════════
  { id:'py16_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'from transformers import pipeline', hl:'transformers'},
        {t:'', dim:true},
        {t:'clf = pipeline("sentiment-analysis")', hl:'sentiment-analysis'},
        {t:'clf("이 강의 정말 명강의예요!")', hl:'clf'},
        {t:'# [{label:POSITIVE, score:0.998}]', dim:true},
        {t:'', dim:true},
        {t:'gen = pipeline("text-generation",', hl:'text-generation'},
        {t:'        model="gpt2")', hl:'gpt2'},
        {t:'gen("In the future, AI will")', hl:'gen'},
        {t:'# "...help people work faster."', dim:true}
      ];
      // 단계별 실행 줄: step0=감정분석 pipeline(줄2), step1=텍스트 생성 pipeline(줄6)
      var act=[2,6][s.step];
      codePanel(E, W*0.04, H*0.13, W*0.47, code, 'huggingface_pipeline.py', act);

      var gx=W*0.56, gw=W*0.40;
      if(s.step===0){
        // 감정분석 실제 출력 재현 — 막대 두 개(POSITIVE 0.998 / NEGATIVE 0.002)
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('sentiment-analysis — 라벨 + 확률', gx, H*0.16);
        ctx.fillStyle='#cfe6e8'; ctx.font='13px sans-serif'; ctx.fillText('입력: "이 강의 정말 명강의예요!"', gx, H*0.16+24);
        // 두 클래스 확률(softmax 합=1, 실제 모델 출력값 재현)
        var probs=[ {lab:'POSITIVE', p:0.998, c:GRN}, {lab:'NEGATIVE', p:0.002, c:RED} ];
        var bx=gx, by=H*0.30, bwid=gw, bh=34, gap=22;
        for(var i=0;i<probs.length;i++){ var y=by+i*(bh+gap), pr=probs[i];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; roundRect(ctx,bx,y,bwid,bh,6); ctx.fill(); ctx.stroke();
          var lw=Math.max(3, bwid*pr.p);
          ctx.fillStyle=pr.c; ctx.globalAlpha=0.85; roundRect(ctx,bx,y,lw,bh,6); ctx.fill(); ctx.globalAlpha=1;
          ctx.fillStyle='#1a1a1a'; ctx.font='600 13px sans-serif'; ctx.textAlign='left'; ctx.fillText(pr.lab, bx+10, y+22);
          ctx.fillStyle=pr.c; ctx.textAlign='right'; ctx.fillText(pr.p.toFixed(3), bx+bwid+0, y-6);
        }
        var sum=probs[0].p+probs[1].p;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('두 확률의 합 = '+sum.toFixed(3)+' (softmax — 가장 큰 라벨을 답으로)', bx, by+2*(bh+gap)+2);
        ctx.fillText('모델·토크나이저 다운로드 후, 추론은 단 한 줄.', bx, by+2*(bh+gap)+22);
      } else {
        // text-generation — 토큰을 하나씩 이어붙이는 자기회귀
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('text-generation — 다음 토큰을 한 개씩', gx, H*0.16);
        var seed=['In','the','future,','AI','will'], cont=['help','people','work','faster','.'];
        var x=gx, y=H*0.30, chh=30, pad=8;
        ctx.font='13px ui-monospace,Menlo,monospace';
        function chip(word, col, fill){ var wd=ctx.measureText(word).width+pad*2;
          if(x+wd>gx+gw){ x=gx; y+=chh+10; }
          ctx.fillStyle=fill; ctx.strokeStyle=col; ctx.lineWidth=1.4; roundRect(ctx,x,y,wd,chh,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(word, x+wd/2, y+chh/2+1); ctx.textBaseline='alphabetic'; ctx.textAlign='left';
          x+=wd+8; }
        for(var i=0;i<seed.length;i++) chip(seed[i], BLU, 'rgba(122,184,255,0.10)');
        for(i=0;i<cont.length;i++) chip(cont[i], GRN, 'rgba(126,224,176,0.12)');
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
        ctx.fillText('파랑 = 내가 준 프롬프트, 초록 = 모델이 한 토큰씩 생성.', gx, y+chh+28);
        ctx.fillText('각 토큰은 ‘지금까지의 문장’ 다음에 올 확률이 가장 높은 것.', gx, y+chh+48);
        ctx.fillStyle=PYB; ctx.font='12.5px sans-serif';
        ctx.fillText('수천억 파라미터 LLM도, 호출은 똑같이 pipeline 한 줄.', gx, y+chh+72);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (감정분석 확률 → 텍스트 생성)', true);
      E.big('🤗 Transformers — LLM을 몇 줄로', 'Hugging Face의 transformers는 세상이 학습해 둔 모델 수십만 개를 단 몇 줄로 불러와 추론하게 해 줍니다. pipeline("sentiment-analysis")는 토크나이저 → 모델 → 후처리를 한 줄로 포장해, 문장 하나에 라벨과 확률을 즉시 돌려주죠. text-generation도 마찬가지 — 직접 학습할 필요 없이, 거인이 만든 모델을 곧장 쓰는 겁니다.'); }
  },

  // ══════════ 3. 모델 저장·불러오기·배포 — torch.save(state_dict) / load ══════════
  { id:'py16_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(340+this.s.step*100,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var code=[
        {t:'# 1) 학습이 끝난 모델 저장', dim:true},
        {t:'torch.save(net.state_dict(),', hl:'state_dict'},
        {t:'           "model.pth")', hl:'model.pth'},
        {t:'', dim:true},
        {t:'# 2) 새 환경에서 불러오기', dim:true},
        {t:'net = MyNet()', },
        {t:'net.load_state_dict(', hl:'load_state_dict'},
        {t:'      torch.load("model.pth"))', hl:'torch.load'},
        {t:'net.eval()        # 추론 모드', hl:'eval'}
      ];
      // 단계별 실행 줄: step0=저장 state_dict(줄1), step1=불러오기 load_state_dict(줄6)
      var act=[1,6][s.step];
      codePanel(E, W*0.04, H*0.14, W*0.47, code, 'save_load_serve.py', act);

      var gx=W*0.56, gw=W*0.40;
      if(s.step===0){
        // state_dict = 가중치 딕셔너리. 모델 구조(코드)와 분리.
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('state_dict — 모델의 ‘배운 숫자’만 저장', gx, H*0.16);
        var rows=[ ['conv1.weight', '[64, 3, 7, 7]'], ['layer1.0.weight', '[64, 64, 3, 3]'], ['fc.weight', '[2, 512]'], ['fc.bias', '[2]'] ];
        var x=gx, y=H*0.24, cw0=Math.min(170,gw*0.5), cw1=gw-cw0, ch=28;
        cell(ctx,x,y,cw0,ch,'layer','rgba(255,211,67,0.16)',PYL,PYL,12.5);
        cell(ctx,x+cw0,y,cw1,ch,'shape','rgba(255,211,67,0.16)',PYL,PYL,12.5);
        for(var i=0;i<rows.length;i++){
          cell(ctx,x,y+ch*(i+1),cw0,ch,rows[i][0],'rgba(122,184,255,0.08)',BLU,'#cfe6e8',11.5);
          cell(ctx,x+cw0,y+ch*(i+1),cw1,ch,rows[i][1],'rgba(126,224,176,0.08)',GRN,GRN,11.5);
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('= 층 이름 → 텐서(가중치)의 딕셔너리. 구조는 코드가, 값은 .pth가.', x, y+ch*(rows.length+1)+22);
        ctx.fillText('그래서 같은 모델 클래스를 만든 뒤 load_state_dict로 값만 부어 넣는다.', x, y+ch*(rows.length+1)+42);
      } else {
        // 배포 흐름: 학습환경 → model.pth → 서버 → API 응답
        ctx.fillStyle=PYL; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('서빙 — 저장한 모델을 API 뒤에 둔다', gx, H*0.16);
        var stages=[
          {t:'학습 (Colab/GPU)', d:'net 학습 완료', c:GLD},
          {t:'model.pth', d:'state_dict 저장', c:BLU},
          {t:'서버 (FastAPI 등)', d:'load → net.eval()', c:GRN},
          {t:'POST /predict', d:'입력 → JSON 응답', c:PNK}
        ];
        var by=H*0.24, bw=gw, bh=42, gap=16;
        for(var i=0;i<stages.length;i++){ var y=by+i*(bh+gap), st=stages[i];
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.4; roundRect(ctx,gx,y,bw,bh,8); ctx.fill(); ctx.stroke();
          ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText((i+1)+'. '+st.t, gx+14, y+19);
          ctx.fillStyle='#cfe6e8'; ctx.font='12px ui-monospace,Menlo,monospace'; ctx.fillText(st.d, gx+14, y+35);
          if(i<stages.length-1){ ctx.strokeStyle=st.c; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx+bw/2,y+bh); ctx.lineTo(gx+bw/2,y+bh+gap); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gx+bw/2-4,y+bh+gap-6); ctx.lineTo(gx+bw/2,y+bh+gap); ctx.lineTo(gx+bw/2+4,y+bh+gap-6); ctx.fillStyle=st.c; ctx.fill(); }
        }
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left';
        ctx.fillText('eval() = 드롭아웃·배치정규화를 추론 모드로 — 빼먹으면 결과가 흔들린다.', gx, by+stages.length*(bh+gap)+6);
      }
      E.tapHint(W/2, H*0.93, '화면 탭 = 다음 (state_dict 내용 → 배포 흐름)', true);
      E.big('저장 · 불러오기 · 배포', '학습은 한 번, 사용은 수백만 번. 그래서 배운 모델을 파일로 굳혀 두어야 합니다. PyTorch에서는 모델 구조(코드)와 가중치(숫자)를 분리해, torch.save(net.state_dict())로 ‘배운 숫자’만 .pth 파일에 담죠. 다른 환경에서는 같은 모델 클래스를 만들고 load_state_dict로 값을 부어 넣은 뒤, net.eval()로 추론 모드를 켭니다. 이 파일을 서버 뒤에 두면, 누구든 API 한 번으로 여러분의 AI를 부를 수 있습니다.'); }
  },

  // ══════════ 4. AI 개발 워크플로 — 수집→전처리→학습→평가→배포→모니터링 ══════════
  { id:'py16_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(300+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var steps=[
        {t:'1. 데이터 수집', d:'문제 정의 · 라벨링 · 수집', c:GLD, tool:'requests · pandas.read_csv · 🤗 datasets'},
        {t:'2. 전처리', d:'정제 · 결측치 · 정규화 · 분할', c:BLU, tool:'pandas · NumPy · sklearn'},
        {t:'3. 학습', d:'모델 선택 · fit · 전이학습', c:PYL, tool:'PyTorch · scikit-learn'},
        {t:'4. 평가', d:'검증/시험셋 · 정확도 · 과적합', c:GRN, tool:'metrics · 교차검증'},
        {t:'5. 배포', d:'save · 서빙 · API', c:PNK, tool:'torch.save · FastAPI'},
        {t:'6. 모니터링', d:'성능 추적 · 재학습', c:'#c8a8ff', tool:'로그 · 데이터 드리프트 감시'}
      ];
      // 좌측: 사이클(원형 배치). 우측 현재 단계 상세.
      var cx=W*0.30, cy=H*0.48, R=Math.min(W*0.20,H*0.32);
      // 연결 화살(원형)
      for(var i=0;i<6;i++){
        var a0=-Math.PI/2 + i*Math.PI/3, a1=-Math.PI/2 + (i+1)*Math.PI/3;
        var on=(i<=s.step);
        ctx.strokeStyle=on?'rgba(255,211,67,0.55)':'rgba(255,255,255,0.12)'; ctx.lineWidth=on?2.2:1.2;
        ctx.beginPath(); ctx.arc(cx,cy,R, a0+0.22, a1-0.22); ctx.stroke();
        // 화살촉
        var ae=a1-0.22, hx=cx+Math.cos(ae)*R, hy=cy+Math.sin(ae)*R, tang=ae+Math.PI/2;
        ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-7*Math.cos(tang-0.5),hy-7*Math.sin(tang-0.5)); ctx.lineTo(hx-7*Math.cos(tang+0.5),hy-7*Math.sin(tang+0.5)); ctx.closePath();
        ctx.fillStyle=on?'rgba(255,211,67,0.7)':'rgba(255,255,255,0.15)'; ctx.fill();
      }
      for(i=0;i<6;i++){
        var ang=-Math.PI/2 + i*Math.PI/3, nx=cx+Math.cos(ang)*R, ny=cy+Math.sin(ang)*R;
        var cur=(i===s.step), done=(i<s.step);
        ctx.globalAlpha=(done||cur)?1:0.5;
        ctx.fillStyle=cur?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)'; ctx.strokeStyle=steps[i].c; ctx.lineWidth=cur?2.6:1.4;
        ctx.beginPath(); ctx.arc(nx,ny,22,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=steps[i].c; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+(i+1), nx, ny+1); ctx.textBaseline='alphabetic';
        ctx.globalAlpha=1;
      }
      ctx.fillStyle=PYL; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('AI 개발', cx, cy-4); ctx.fillText('사이클', cx, cy+14);

      // 우측 상세 패널
      var st=steps[s.step], px=W*0.56, py=H*0.26, pw=W*0.40;
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=st.c; ctx.lineWidth=1.6; roundRect(ctx,px,py,pw,H*0.40,12); ctx.fill(); ctx.stroke();
      ctx.fillStyle=st.c; ctx.font='600 20px sans-serif'; ctx.textAlign='left'; ctx.fillText(st.t, px+18, py+34);
      ctx.fillStyle='#efe7cf'; ctx.font='14px sans-serif'; ctx.fillText(st.d, px+18, py+62);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('주요 도구:', px+18, py+96);
      ctx.fillStyle=PYB; ctx.font='12.5px ui-monospace,Menlo,monospace'; ctx.fillText(st.tool, px+18, py+116);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('단계 '+(s.step+1)+' / 6', px+18, py+H*0.40-18);

      E.tapHint(W/2, H*0.94, '화면 탭 = 다음 단계 (수집 → 전처리 → 학습 → 평가 → 배포 → 모니터링)', true);
      E.big('AI 개발 워크플로 — 한 바퀴 도는 사이클', '실무의 AI는 ‘학습’ 한 단계가 아니라, 빙 도는 사이클입니다. ①문제를 정하고 데이터를 모으고 ②정제·분할로 깨끗이 만들고 ③모델을 학습(또는 전이학습)하고 ④못 본 데이터로 정직하게 평가하고 ⑤파일로 굳혀 배포하고 ⑥실제 입력으로 성능을 감시하다, 떨어지면 다시 데이터를 모아 재학습합니다. 우리가 배운 도구들 — pandas·NumPy·sklearn·PyTorch·🤗 — 이 각 자리에 정확히 들어맞죠.'); }
  },

  // ══════════ 5. 마무리 — 여정 회고 + 다음 발걸음 ══════════
  { id:'py16_05', hudOff:true,
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(380+this.s.step*120,0.09); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      if(s.step===0){
        // 여정 회고 — 기초부터 딥러닝까지 계단(점점 올라감)
        ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('당신이 오른 계단 — 파이썬 기초에서 딥러닝까지', W/2, H*0.14);
        var stairs=[
          {t:'문법·자료구조', c:DIM},
          {t:'함수·클래스·모듈', c:PYB},
          {t:'NumPy·pandas', c:BLU},
          {t:'시각화·전처리', c:GLD},
          {t:'머신러닝(sklearn)', c:GRN},
          {t:'신경망·PyTorch', c:PNK},
          {t:'전이학습·생태계', c:'#c8a8ff'}
        ];
        var n=stairs.length, bx=W*0.14, bottom=H*0.86, sw=(W*0.72)/n, sh=H*0.085;
        for(var i=0;i<n;i++){ var x=bx+i*sw, h=(i+1)*sh, y=bottom-h;
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=stairs[i].c; ctx.lineWidth=1.6; roundRect(ctx,x,y,sw-8,h,6); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.translate(x+(sw-8)/2, y+12); ctx.fillStyle=stairs[i].c; ctx.font='600 13.5px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.rotate(Math.PI/2); ctx.fillText(stairs[i].t, 0, 0); ctx.restore();
        }
        ctx.textBaseline='alphabetic';
        // 오르는 사람(도형이) 위치 = 맨 위 계단
        var topx=bx+(n-1)*sw+(sw-8)/2, topy=bottom-n*sh-22;
        ctx.fillStyle='#c8a8ff'; ctx.beginPath(); ctx.arc(topx,topy,11,0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='center';
        ctx.fillText('한 칸씩 쌓아 올린 16장 — 이제 도구가 손에 익었습니다.', W/2, H*0.93);
      } else {
        // 다음 발걸음 — 세 갈래 길
        ctx.fillStyle=PYL; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.fillText('다음 발걸음 — 어디로 갈까요?', W/2, H*0.14);
        var paths=[
          {t:'논문 구현', d:'관심 분야 논문 한 편을\n골라 직접 코드로 재현', c:GRN, ic:'📄'},
          {t:'Kaggle 도전', d:'실전 대회 데이터로\n전 과정을 끝까지 경험', c:BLU, ic:'🏆'},
          {t:'오픈소스 기여', d:'좋아하는 라이브러리에\n작은 PR부터 보내 보기', c:PNK, ic:'🌱'}
        ];
        var cw=W*0.26, gap=W*0.04, total=cw*3+gap*2, x0=(W-total)/2, cy=H*0.30, chh=H*0.40;
        for(var i=0;i<3;i++){ var x=x0+i*(cw+gap), p=paths[i];
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.strokeStyle=p.c; ctx.lineWidth=1.8; roundRect(ctx,x,cy,cw,chh,12); ctx.fill(); ctx.stroke();
          ctx.font='30px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.ic, x+cw/2, cy+50);
          ctx.fillStyle=p.c; ctx.font='600 17px sans-serif'; ctx.fillText(p.t, x+cw/2, cy+88);
          ctx.fillStyle='#cfe6e8'; ctx.font='13px sans-serif';
          var lines=p.d.split('\n'); for(var k=0;k<lines.length;k++) ctx.fillText(lines[k], x+cw/2, cy+118+k*20);
        }
        ctx.fillStyle='#c8a8ff'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('무엇을 고르든, 가장 좋은 배움은 ‘직접 만들어 보는 것’입니다.', W/2, H*0.82);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif';
        ctx.fillText('축하합니다 — 당신의 첫 AI를 만들 모든 도구가 이제 손안에 있습니다.', W/2, H*0.89);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (여정 회고 → 다음 발걸음)', true);
      E.big('마무리 — 거인의 어깨 위에서, 당신의 첫 AI로', '파이썬의 첫 print()부터 사전학습 모델 미세조정까지, 긴 계단을 한 칸씩 올라왔습니다. 처음엔 한 줄 한 줄 더듬었지만, 이제 데이터를 정제하고, 모델을 학습·전이하고, 저장해 배포하는 한 사이클 전체가 손에 익었죠. 더 중요한 건 ‘스스로 배우는 법’을 익혔다는 것 — 새 라이브러리·새 논문 앞에서도 더는 막막하지 않습니다. 거인들이 쌓아 둔 어깨 위에서, 이제 당신만의 AI를 만들 차례입니다. 즐거운 항해를!'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
