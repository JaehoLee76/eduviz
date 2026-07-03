/* C++ 제17장 — 재귀(Recursion) 특별장.
   본문 5장면(spine cpp17_01~05) + 심화학습 5문제(branch branchOf:'cpp17_05').
   동작(behavior)만. 텍스트=content/cpp17.json. 엔진 js/engine.js 공유. 색: C++=파랑(#5ab4e8).
   ★핵심: 콜 스택/메모리를 실제 시스템처럼 시각화. build()에서 재귀를 실제로 한 단계씩 돌려
   각 이벤트(호출 push / 기저 도달 / 반환 pop)마다 스택 스냅샷을 기록하고 draw는 현재 step만 렌더.
   골든룰: 표시되는 모든 값(fact 120·fib 8·hanoi 7수·순열 6·정렬결과)은 실제 계산. Math.random/Date.now 금지. */
(function(){
  var CPB='#5ab4e8', CPD='#8fd0f5', GLD='#ffd27a', GRN='#7ee0b0', BLU='#7ab8ff', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a', VIO='#b99cff';

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function codePanel(E, x, y, w, lines, title, actLine){
    var ctx=E.ctx, lh=16, pad=14, top=y, n=lines.length, ht=n*lh+pad*2+(title?26:0);
    ctx.fillStyle='rgba(255,255,255,0.035)'; ctx.strokeStyle='rgba(90,180,232,0.30)'; ctx.lineWidth=1;
    roundRect(ctx,x,top,w,ht,10); ctx.fill(); ctx.stroke();
    var cy=top+pad+(title?26:0);
    if(title){ ctx.fillStyle=CPB; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText(title, x+pad, top+pad+12); }
    ctx.font='13px ui-monospace,Menlo,Consolas,monospace'; ctx.textAlign='left';
    for(var i=0;i<n;i++){ var L=lines[i], t=(typeof L==='string')?L:L.t, hl=(typeof L==='object')?L.hl:null; var ty=cy+i*lh+11;
      if(actLine!=null && i===actLine){ ctx.fillStyle='rgba(90,180,232,0.16)'; ctx.fillRect(x+4, cy+i*lh+1, w-8, lh-2); ctx.fillStyle=CPB; ctx.fillRect(x+4, cy+i*lh+1, 3, lh-2); }
      if(hl && t.indexOf(hl)>=0){ var a=t.split(hl), pre=a[0], post=a.slice(1).join(hl); ctx.fillStyle=DIM; ctx.fillText(pre, x+pad, ty); var wpre=ctx.measureText(pre).width; ctx.fillStyle=CPB; ctx.fillText(hl, x+pad+wpre, ty); var whl=ctx.measureText(hl).width; ctx.fillStyle=DIM; ctx.fillText(post, x+pad+wpre+whl, ty);
      } else { ctx.fillStyle=((typeof L==='object'&&L.dim)?DIM:'#dfeaf2'); ctx.fillText(t, x+pad, ty); } }
    return top+ht;
  }

  // ── 콜 스택 렌더: frames=[{sig, info, ret}] 위→아래로 쌓임(아래가 최근 호출=top). active=top 인덱스.
  function drawStack(E, x, y, frames, active, w, fhIn){
    var ctx=E.ctx, fw=w||E.W*0.30, fh=fhIn||46, gap=6;
    ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left';
    ctx.fillText('콜 스택 — 호출마다 프레임 push, 반환마다 pop (낮은 주소로 자람)', x, y-10);
    for(var i=0;i<frames.length;i++){ var f=frames[i], fy=y+i*(fh+gap), isTop=(i===active);
      ctx.fillStyle= isTop?'rgba(90,180,232,0.18)':(f.ret!=null?'rgba(126,224,176,0.08)':'rgba(255,255,255,0.03)');
      roundRect(ctx,x,fy,fw,fh,7); ctx.fill();
      ctx.strokeStyle= isTop?CPB:(f.ret!=null?GRN:'rgba(255,255,255,0.16)'); ctx.lineWidth=isTop?2:1; roundRect(ctx,x,fy,fw,fh,7); ctx.stroke();
      ctx.fillStyle= isTop?CPD:'#dfeaf2'; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText(f.sig, x+12, fy+19);
      ctx.fillStyle=DIM; ctx.font='11px ui-monospace,monospace'; ctx.fillText(f.info||'', x+12, fy+fh-10);
      ctx.fillStyle='rgba(255,255,255,0.30)'; ctx.font='10px ui-monospace,monospace'; ctx.textAlign='right'; ctx.fillText('0x7ffe'+(('000'+(240-i*16).toString(16)).slice(-3)), x+fw-8, fy+14);
      if(f.ret!=null){ ctx.fillStyle=GRN; ctx.font='600 12px ui-monospace,monospace'; ctx.textAlign='right'; ctx.fillText('return '+f.ret, x+fw-8, fy+fh-8); }
    }
  }
  // 하단 STEP 캡션 (겹침 방지용 헬퍼)
  function stepCap(E, x, y, i, n, cap){
    var ctx=E.ctx;
    ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
    ctx.fillText('STEP '+(i+1)+'/'+n, x, y);
    ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(cap||'', x, y+20);
  }

  var scenes = [

  // ══════════ 1. 재귀란? — 기저사례 + 재귀사례 ══════════
  { id:'cpp17_01',
    enter:function(E){ this.s={step:0};
      // countdown(3) 을 실제로 돌려 프레임 기록
      var st=[];
      function snap(line,depth,n,phase,cap){ st.push({line:line,depth:depth,n:n,phase:phase,cap:cap}); }
      snap(0,0,3,'call','main 에서 countdown(3) 호출');
      function cd(n,depth){
        snap(1,depth,n,'enter','countdown('+n+') 진입 — n='+n);
        if(n===0){ snap(2,depth,n,'base','n==0 → 기저사례! "발사!" 출력하고 즉시 반환'); return; }
        snap(4,depth,n,'print',n+' 출력');
        snap(5,depth,n,'call','countdown('+(n-1)+') 재귀 호출 — 자기 자신을 부름');
        cd(n-1,depth+1);
        snap(6,depth,n,'ret','countdown('+n+') 반환 (호출한 곳으로 복귀)');
      }
      cd(3,0);
      snap(7,0,3,'done','모든 호출 반환 완료 — 재귀 종료');
      this.steps=st; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'void countdown(int n){', hl:'countdown'},
        {t:'  // 진입', dim:true},
        {t:'  if(n == 0){ cout<<"발사!"; return; }', hl:'n == 0'},
        {t:'  // ↑ 기저사례(base case): 재귀를 멈춘다', dim:true},
        {t:'  cout << n << " ";', hl:'cout'},
        {t:'  countdown(n - 1);   // 재귀사례', hl:'countdown(n - 1)'},
        {t:'  // 여기로 돌아온 뒤 반환', dim:true},
        {t:'}  // → 스택에서 pop', dim:true}
      ];
      codePanel(E, W*0.04, H*0.12, W*0.46, code, 'countdown.cpp', f.line);

      // 우측: 자기를 부르는 그림 = 안으로 파고드는 상자 + 콜 스택
      var gx=W*0.56, gy=H*0.15, gw=W*0.40;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('재귀 = 자기 자신을 다시 부른다', gx, gy);
      // 중첩 상자: countdown(3)→(2)→(1)→(0)
      var bx=gx, by=gy+18, bw=gw, bh=H*0.44, pad=13;
      var cols=[CPB,BLU,VIO,GRN], labels=['countdown(3)','countdown(2)','countdown(1)','countdown(0)  ⟵ 기저'];
      var reached = (function(){ // 현재 얼마나 깊이 들어갔나 (phase 기반)
        if(f.phase==='call'&&s.step===0) return 0;
        return Math.min(f.depth + (f.phase==='enter'||f.phase==='base'||f.phase==='print'||f.phase==='call'?1:1), 4); })();
      for(var d=0;d<4;d++){
        var inX=bx+d*pad, inY=by+d*pad, inW=bw-d*pad*2, inH=bh-d*pad*2;
        var active=(f.depth===d && (f.phase!=='done'));
        var visited=(d<=f.depth) || f.phase==='done';
        ctx.strokeStyle= active?cols[d]:(visited?'rgba(122,184,255,0.35)':'rgba(255,255,255,0.10)'); ctx.lineWidth=active?2.4:1.4;
        ctx.fillStyle= active?'rgba(90,180,232,0.10)':'rgba(255,255,255,0.02)';
        roundRect(ctx,inX,inY,inW,inH,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle= (d===3)?GRN:(active?cols[d]:'#dfeaf2'); ctx.font='600 12.5px ui-monospace,monospace'; ctx.textAlign='left';
        ctx.fillText(labels[d], inX+10, inY+18);
      }
      // 기저 강조
      if(f.phase==='base'){ ctx.fillStyle=GRN; ctx.font='700 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('🚀 발사! — 여기서 멈춘다', bx+bw/2, by+bh-14); }

      // 하단 캡션
      stepCap(E, gx, gy+18+bh+30, s.step, this.steps.length, f.cap);
      // 무한재귀 경고
      ctx.fillStyle=RED; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('※ 기저사례가 없으면? n이 −1,−2,… 로 영원히 → 스택 오버플로(프로그램 강제 종료)', gx, gy+18+bh+72);

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (진입 → 더 깊이 → 기저 → 반환)', true);
      E.big('재귀란 무엇인가 — 자기 자신을 호출하는 함수', '재귀(recursion)는 함수가 <b>자기 자신을 다시 부르는</b> 것입니다. 얼핏 이상하게 들리지만, 큰 문제를 “똑같이 생긴 더 작은 문제”로 넘기는 아주 자연스러운 방법이죠. 두 부분이 반드시 있어야 합니다. ① <b>기저사례(base case)</b> — 더 쪼갤 수 없어 곧장 답이 나오는 가장 작은 경우(여기선 n==0). 재귀를 멈추는 브레이크입니다. ② <b>재귀사례(recursive case)</b> — 문제를 한 칸 줄여 자기 자신에게 넘기는 경우(countdown(n−1)). 만약 기저사례가 없거나 문제가 줄지 않으면, 호출이 끝없이 이어져 <b>스택 오버플로</b>로 프로그램이 죽습니다. countdown(3)은 3,2,1을 찍고 0에서 “발사!”를 외친 뒤 차례로 되돌아옵니다.'); }
  },

  // ══════════ 2. 콜 스택과 메모리 — 호출이 프레임을 쌓는다 ══════════
  { id:'cpp17_02',
    enter:function(E){ this.s={step:0};
      // fact(4) 하강 국면 — 프레임이 하나씩 쌓이는 걸 기록 (여기선 push 국면 위주 + 반환도 포함)
      var st=[];
      function frame(n){ return {sig:'fact('+n+')', info:'n = '+n+', ret_addr', ret:null, n:n}; }
      function snap(line,frames,active,cap){ st.push({line:line, frames:frames.map(function(x){return {sig:x.sig,info:x.info,ret:x.ret};}), active:active, cap:cap}); }
      var stack=[];
      // 하강: fact(4)→(3)→(2)→(1)
      var vals=[4,3,2,1];
      snap(0,stack,-1,'main 에서 fact(4) 호출 — 곧 스택에 프레임이 쌓입니다');
      for(var i=0;i<vals.length;i++){
        stack.push(frame(vals[i]));
        snap(2, stack, stack.length-1, 'fact('+vals[i]+') 호출 → 새 스택 프레임 push (매개변수 n='+vals[i]+', 복귀주소 저장)');
        if(vals[i]===1){
          st[st.length-1].cap='fact(1): n==1 → 기저사례 도달! return 1 (더 깊이 안 감)';
          st[st.length-1].line=1;
          stack[stack.length-1].ret=1;
          snap(1, stack, stack.length-1, '기저사례에서 1 을 반환 — 이제 위 프레임들이 차례로 pop 됩니다');
        }
      }
      this.steps=st; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'int fact(int n){', hl:'fact'},
        {t:'  if(n <= 1) return 1;   // 기저', hl:'return 1'},
        {t:'  return n * fact(n - 1);', hl:'fact(n - 1)'},
        {t:'}', dim:true},
        {t:'// 호출 = 스택 프레임 하나 push', dim:true},
        {t:'// 프레임 = {매개변수 n, 지역변수,', dim:true},
        {t:'//          복귀주소(어디로 돌아갈지)}', dim:true}
      ];
      codePanel(E, W*0.04, H*0.14, W*0.46, code, 'factorial.cpp', f.line);

      // 우측 콜 스택 (아래로 자람)
      var sx=W*0.58, sy=H*0.20, sw=W*0.36;
      drawStack(E, sx, sy, f.frames, f.active, sw, 48);

      // 스택 성장 방향 화살표
      var botY=sy+f.frames.length*(48+6);
      if(f.frames.length){ ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(sx-14, sy); ctx.lineTo(sx-14, botY-6); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=DIM; ctx.font='10px sans-serif'; ctx.save(); ctx.translate(sx-24, (sy+botY)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center'; ctx.fillText('push ↓ (스택이 자라는 방향)', 0,0); ctx.restore(); }

      stepCap(E, W*0.04, H*0.14+7*16+28+20, s.step, this.steps.length, f.cap);

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (fact(4)→fact(1) 프레임 쌓기)', true);
      E.big('콜 스택과 메모리 — 함수 호출은 어떻게 기억될까', '재귀가 “마법”이 아닌 이유는 바로 <b>콜 스택(call stack)</b> 덕분입니다. 함수를 부를 때마다 시스템은 메모리 한 구석(스택 영역)에 <b>스택 프레임</b>을 하나 쌓습니다. 프레임 안에는 그 호출만의 <b>매개변수·지역변수</b>와, 끝나면 <b>어디로 돌아갈지(복귀주소)</b>가 들어 있죠. fact(4)를 부르면 fact(4)·fact(3)·fact(2)·fact(1) 프레임이 차곡차곡 쌓입니다 — 각 프레임의 n은 4,3,2,1로 <b>서로 완전히 독립</b>입니다(같은 이름 n이지만 다른 주소!). 그래서 fact(2) 안의 n이 fact(3) 안의 n을 건드리지 않죠. 스택은 보통 높은 주소에서 낮은 주소로 자랍니다. fact(1)에서 기저사례에 닿아 1을 반환하면, 이제 위 프레임들이 하나씩 pop 되며 값을 계산합니다 — 다음 장면에서 그 “상승”을 봅니다.'); }
  },

  // ══════════ 3. 하강과 상승 — 실행 시퀀스 전체 ══════════
  { id:'cpp17_03',
    enter:function(E){ this.s={step:0};
      // fact(4) 전체 시퀀스: 하강(push) → 기저 → 상승(pop + 곱셈)
      var st=[];
      function snap(line,frames,active,cap,phase){ st.push({line:line, frames:frames.map(function(x){return {sig:x.sig,info:x.info,ret:x.ret};}), active:active, cap:cap, phase:phase}); }
      var stack=[]; var vals=[4,3,2,1];
      // 하강
      for(var i=0;i<vals.length;i++){ var n=vals[i];
        stack.push({sig:'fact('+n+')', info:'n = '+n, ret:null, n:n});
        if(n>1) snap(2, stack, stack.length-1, 'fact('+n+') 진입 → return '+n+' * fact('+(n-1)+') 를 계산하려면 먼저 fact('+(n-1)+') 필요 → 더 깊이', 'down');
        else snap(1, stack, stack.length-1, 'fact(1): 기저사례 도달 → return 1 (하강 끝, 이제 상승)', 'base');
      }
      // 상승: pop 하며 곱셈. fact(1)=1 부터
      // fact(1)=1
      stack[stack.length-1].ret=1;
      snap(1, stack, stack.length-1, 'fact(1) = 1 반환 → 프레임 pop', 'up');
      // fact(2)=2*1
      stack.pop();
      var acc=1;
      var upv=[2,3,4];
      for(i=0;i<upv.length;i++){ var m=upv[i]; var prev=acc; acc=m*acc;
        stack[stack.length-1].ret=acc; stack[stack.length-1].info='n = '+m;
        snap(2, stack, stack.length-1, 'fact('+m+') = '+m+' * fact('+(m-1)+') = '+m+' * '+prev+' = '+acc+' → 반환·pop', 'up');
        if(i<upv.length-1) stack.pop();
      }
      snap(3, [{sig:'main', info:'결과 수신', ret:24}], 0, '최종: fact(4) = 4*3*2*1 = 24 → main 으로 복귀', 'done');
      this.steps=st; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'int fact(int n){', hl:'fact'},
        {t:'  if(n <= 1) return 1;', hl:'return 1'},
        {t:'  return n * fact(n - 1);', hl:'n * fact(n - 1)'},
        {t:'}  // fact(4)=4*3*2*1=24', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.13, W*0.46, code, 'factorial.cpp', f.line);

      // 국면 배지
      var badge = f.phase==='down'?['하강 ↓ (호출·push)',CPB]: f.phase==='base'?['기저 도달',GLD]: f.phase==='up'?['상승 ↑ (반환·pop·곱셈)',GRN]:['완료',GRN];
      ctx.fillStyle=badge[1]; ctx.font='700 13px sans-serif'; ctx.textAlign='left';
      roundRect(ctx, W*0.04, codeBot+16, 200, 26, 6); ctx.globalAlpha=0.12; ctx.fill(); ctx.globalAlpha=1; ctx.strokeStyle=badge[1]; ctx.lineWidth=1.2; roundRect(ctx, W*0.04, codeBot+16, 200, 26, 6); ctx.stroke();
      ctx.fillStyle=badge[1]; ctx.fillText(badge[0], W*0.055, codeBot+33);

      // 곱셈 사슬 (실계산 4*3*2*1)
      ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,monospace';
      ctx.fillText('4 * 3 * 2 * 1  =  24', W*0.055, codeBot+64);

      // 우측 콜 스택
      var sx=W*0.58, sy=H*0.19, sw=W*0.36;
      drawStack(E, sx, sy, f.frames, f.active, sw, 44);

      stepCap(E, W*0.04, codeBot+98, s.step, this.steps.length, f.cap);
      if(f.phase==='done'){ ctx.fillStyle=GRN; ctx.font='700 17px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ fact(4) = 24', W*0.04, codeBot+128); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 시퀀스 재생 (하강 → 기저 → 상승)', true);
      E.big('하강과 상승 — 재귀 실행의 두 국면', '재귀 함수의 실행은 <b>두 방향</b>으로 흐릅니다. 먼저 <b>하강(내려가기)</b>: fact(4)는 “4 * fact(3)”을 계산하려는데 fact(3)을 아직 모릅니다. 그래서 곱셈을 <b>보류한 채</b> fact(3)을 부르고, fact(3)은 다시 fact(2)를… 이렇게 프레임을 쌓으며 fact(1)까지 내려갑니다. fact(1)은 기저사례라 곧장 <b>1</b>을 답하죠. 이제 <b>상승(올라오기)</b>: 보류했던 곱셈들이 역순으로 완성됩니다 — fact(2)=2*1=2, fact(3)=3*2=6, fact(4)=4*6=24. 각 프레임은 반환하며 pop 되고, 값이 위로 전달됩니다. 핵심 통찰: <b>곱셈은 “올라올 때” 일어난다</b>는 것 — 하강 때 쌓아 둔 문맥(각 n) 덕분에 상승 때 정확히 4*3*2*1이 됩니다. 이것이 재귀가 순서를 “거꾸로” 처리할 수 있는 비결입니다.'); }
  },

  // ══════════ 4. 재귀 vs 반복 · 스택 오버플로 ══════════
  { id:'cpp17_04',
    enter:function(E){ var self=this; this.s={which:0, step:0};
      // 스택이 한계까지 쌓이는 시각화용 (깊이 애니는 draw에서 프레임 인덱스로)
      E.controls('<div class="ctrl"><label>구현 (재귀 ↔ 반복)</label><input type="range" id="w" min="0" max="1" step="1" value="0"><output id="wo">재귀(recursive)</output></div>');
      E.bind('#w','input',function(e){ self.s.which=+e.target.value; self.s.step=0; document.getElementById('wo').textContent=(+e.target.value?'반복(iterative)':'재귀(recursive)'); E.blip(340,0.06); });
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%12; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, isRec=(s.which===0);
      var code = isRec ? [
        {t:'// 재귀: sum(n) = n + sum(n-1)', dim:true},
        {t:'long sum(int n){', hl:'sum'},
        {t:'  if(n == 0) return 0;   // 기저', hl:'return 0'},
        {t:'  return n + sum(n - 1);', hl:'sum(n - 1)'},
        {t:'}', dim:true},
        {t:'// 깊이 n 만큼 프레임이 쌓임 → 메모리 O(n)', dim:true},
        {t:'// n 이 아주 크면 → 스택 오버플로!', dim:true},
        {t:'', dim:true},
        {t:'// 꼬리재귀(tail call): 마지막이 순수 호출', dim:true},
        {t:'long sumT(int n,long acc){', hl:'sumT'},
        {t:'  if(n==0) return acc;', hl:'acc'},
        {t:'  return sumT(n-1, acc+n); // 컴파일러가', hl:'sumT(n-1'}
      ] : [
        {t:'// 반복: 같은 문제를 루프로', dim:true},
        {t:'long sum(int n){', hl:'sum'},
        {t:'  long acc = 0;', hl:'acc = 0'},
        {t:'  for(int i = 1; i <= n; ++i)', hl:'i <= n'},
        {t:'    acc += i;', hl:'acc += i'},
        {t:'  return acc;', hl:'return acc'},
        {t:'}', dim:true},
        {t:'// 프레임 하나뿐 → 메모리 O(1)', dim:true},
        {t:'// 스택 오버플로 위험 없음', dim:true},
        {t:'// 그러나 트리형 문제(하노이·순열)엔', dim:true},
        {t:'// 재귀가 훨씬 간결·자연스럽다', dim:true}
      ];
      codePanel(E, W*0.04, H*0.10, W*0.47, code, isRec?'recursive.cpp':'iterative.cpp', null);

      var gx=W*0.55, gy=H*0.13, gw=W*0.40;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(isRec?'재귀 — 스택이 깊이만큼 쌓인다':'반복 — 프레임은 딱 하나', gx, gy);

      if(isRec){
        // 프레임이 한계 LIM 까지 쌓임. step 이 진행할수록 더 높이.
        var LIM=9, depth=Math.min(s.step+1, LIM+2), fh=30, gap=3;
        for(var d=0; d<Math.min(depth,LIM); d++){ var fy=gy+16+d*(fh+gap);
          var over=false;
          ctx.fillStyle='rgba(90,180,232,0.14)'; ctx.strokeStyle=CPB; ctx.lineWidth=1.2;
          roundRect(ctx,gx,fy,gw,fh,5); ctx.fill(); ctx.stroke();
          ctx.fillStyle=CPD; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
          ctx.fillText('sum('+(9-d)+')', gx+10, fy+19);
          ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='9.5px ui-monospace,monospace'; ctx.textAlign='right'; ctx.fillText('0x7ffe'+(('000'+(240-d*16).toString(16)).slice(-3)), gx+gw-8, fy+18); }
        // 스택 한계선
        var limY=gy+16+LIM*(fh+gap);
        ctx.strokeStyle=RED; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(gx-6,limY); ctx.lineTo(gx+gw+6,limY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=RED; ctx.font='600 11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('▲ 스택 크기 한계 (기본 ~1MB)', gx, limY+16);
        if(depth>LIM){ ctx.fillStyle=RED; ctx.font='700 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('💥 STACK OVERFLOW', gx+gw/2, limY+42);
          ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('깊이가 한계를 넘으면 프로그램이 강제 종료됩니다', gx+gw/2, limY+62); }
        else { ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('탭할수록 더 깊이 — 깊이 = 메모리 O(n)', gx, limY+38); }
      } else {
        // 반복: 프레임 하나 + acc 누적 (실계산)
        var fy2=gy+40, fh2=52;
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; ctx.lineWidth=1.6;
        roundRect(ctx,gx,fy2,gw,fh2,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='600 13px ui-monospace,monospace'; ctx.textAlign='left'; ctx.fillText('sum(n)  프레임 1개', gx+12, fy2+20);
        var i=Math.min(s.step+1, 10), acc=i*(i+1)/2;
        ctx.fillStyle='#dfeaf2'; ctx.font='12px ui-monospace,monospace'; ctx.fillText('i = '+i+',  acc = '+acc, gx+12, fy2+40);
        // 누적 막대
        ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.fillText('루프 '+i+'회 진행 → 1+2+…+'+i+' = '+acc+' (프레임은 그대로 1개)', gx, fy2+fh2+26);
        ctx.fillStyle=GRN; ctx.font='11.5px sans-serif'; ctx.fillText('메모리 O(1) — 아무리 커도 스택 오버플로 없음', gx, fy2+fh2+48);
      }

      // 비교표
      var ty=H*0.80;
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('재귀: 코드 간결·트리형에 자연스러움 · 메모리 O(깊이) · 깊으면 오버플로 위험', W*0.04, ty);
      ctx.fillText('반복: 메모리 O(1)·빠름 · 하지만 하노이·순열처럼 갈래가 많으면 코드가 복잡', W*0.04, ty+18);
      ctx.fillStyle=GRN; ctx.fillText('꼬리재귀(tail call): 반환이 “순수한 재귀 호출”뿐이면 컴파일러가 반복으로 최적화(-O2) → 스택 절약', W*0.04, ty+38);

      E.tapHint(W/2, H*0.95, '슬라이더=재귀↔반복 · 화면 탭=깊이 쌓기', true);
      E.big('재귀 vs 반복 · 스택 오버플로', '같은 문제를 재귀로도, 반복(루프)으로도 풀 수 있습니다. 1부터 n까지의 합을 봅시다. <b>재귀</b> sum(n)=n+sum(n−1)은 사람의 정의를 그대로 옮겨 우아하지만, 깊이 n만큼 스택 프레임이 쌓여 <b>메모리 O(n)</b>을 씁니다. n이 수십만이면 스택 한계(보통 ~1MB)를 넘어 <b>스택 오버플로</b>로 죽죠. <b>반복</b>은 프레임 하나에서 acc에 계속 더해 <b>메모리 O(1)</b>, 오버플로 걱정이 없습니다. 그렇다면 왜 재귀를 쓸까요? <b>트리처럼 갈래가 여러 개인 문제</b>(하노이 탑·순열·병합정렬)에서는 재귀가 압도적으로 간결하고 자연스럽기 때문입니다 — 반복으로 바꾸면 직접 스택을 관리해야 해 오히려 복잡해집니다. 한 가지 절충: <b>꼬리재귀(tail call)</b> — 함수의 마지막 동작이 “순수한 자기 호출”뿐이면, 컴파일러(-O2)가 이를 반복으로 바꿔 스택을 늘리지 않게 최적화할 수 있습니다.'); }
  },

  // ══════════ 5. 재귀적 사고법 + 5문제 지도 ══════════
  { id:'cpp17_05',
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H;
      // 좌: 재귀적 사고 3원칙
      var lx=W*0.06, ly=H*0.16;
      ctx.fillStyle=CPB; ctx.font='700 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText('재귀적으로 생각하는 법 — 신뢰의 도약', lx, ly);
      var steps=[
        ['① 기저사례를 정한다','가장 작아 답이 뻔한 경우는? (n==0, 원소 1개, 빈 리스트…)',GRN],
        ['② 더 작은 같은 문제로 쪼갠다','문제를 “한 조각 떼고 남은, 나와 똑같이 생긴 문제”로 표현',CPB],
        ['③ 작은 문제는 이미 풀렸다고 믿는다','재귀 호출이 정답을 준다고 “가정”하고, 그 답을 조립만 한다',GLD]
      ];
      for(var i=0;i<3;i++){ var y=ly+30+i*72;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=steps[i][2]; ctx.lineWidth=1.4;
        roundRect(ctx, lx, y, W*0.40, 60, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle=steps[i][2]; ctx.font='600 13.5px sans-serif'; ctx.fillText(steps[i][0], lx+14, y+22);
        ctx.fillStyle='#dfeaf2'; ctx.font='12px sans-serif'; ctx.fillText(steps[i][1], lx+14, y+43); }
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif';
      ctx.fillText('“작은 문제는 마법처럼 풀린다고 믿어라” — 이 신뢰의 도약이 재귀의 핵심입니다.', lx, ly+30+3*72+16);

      // 우: 5문제 지도
      var rx=W*0.54, ry=H*0.16, rw=W*0.42;
      ctx.fillStyle=GLD; ctx.font='700 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('📚 심화학습 — 재귀로 푸는 5문제', rx, ry);
      var probs=[
        ['1. 팩토리얼','선형 재귀 · fact(5)=120','콜스택 하강/상승',CPB],
        ['2. 피보나치','트리 재귀 · fib(6)=8','중복 호출 25→11 (메모)',VIO],
        ['3. 하노이 탑','원반 이동 · 3개=7수','3기둥 실제 이동',GLD],
        ['4. 순열 생성','백트래킹 · [1,2,3]→6개','선택→탐색→취소',GRN],
        ['5. 병합정렬','분할정복 · 2재귀+병합','[…]→[1,2,3,5,8,9]',BLU]
      ];
      for(i=0;i<5;i++){ var py=ry+22+i*62;
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle=probs[i][3]; ctx.lineWidth=1.3;
        roundRect(ctx, rx, py, rw, 52, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=probs[i][3]; ctx.font='600 14px sans-serif'; ctx.fillText(probs[i][0], rx+14, py+21);
        ctx.fillStyle='#dfeaf2'; ctx.font='11.5px sans-serif'; ctx.fillText(probs[i][1], rx+14, py+40);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='right'; ctx.fillText(probs[i][2], rx+rw-14, py+34); ctx.textAlign='left';
      }
      ctx.fillStyle=GRN; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
      ctx.fillText('▸ 아래 “심화학습(5)” 버튼에서 각 문제를 코드+콜스택 단계로 완전 정복하세요.', rx, ry+22+5*62+14);

      E.big('재귀적 사고법 — 더 작은 나에게 맡겨라', '재귀를 잘 쓰는 비결은 “컴퓨터처럼 스택을 끝까지 따라가며” 생각하지 않는 것입니다 — 그건 금세 머리가 터집니다. 대신 <b>세 가지</b>만 정하세요. ① <b>기저사례</b>: 더 쪼갤 수 없는 가장 작은 경우의 답. ② <b>분할</b>: 문제를 “한 조각 떼어 낸, 나와 똑같이 생긴 더 작은 문제”로 표현. ③ <b>신뢰의 도약</b>: 그 작은 문제는 <b>이미 올바르게 풀렸다고 믿고</b>, 돌아온 답을 조립만 합니다. fact(n)을 짤 때 fact(n−1)이 어떻게 계산되는지 파고들지 마세요 — “fact(n−1)은 (n−1)!을 정확히 준다”고 믿고 n을 곱하면 끝. 이 믿음이 맞다면(기저사례 + 매 호출마다 문제가 작아짐) 재귀는 반드시 옳습니다. 이제 이 사고법으로 다섯 고전 문제 — 팩토리얼·피보나치·하노이 탑·순열·병합정렬 — 를 콜 스택과 함께 완전히 마스터해 봅시다.'); }
  },

  // ══════════════════ 심화학습 (branchOf:'cpp17_05') ══════════════════

  // ─── 1. 팩토리얼 (선형 재귀) ───
  { id:'cpp17_05_fact', branchOf:'cpp17_05', ord:1,
    enter:function(E){ this.s={step:0};
      // fact(5)=120 전체 하강·상승 시퀀스
      var st=[];
      function snap(line,frames,active,cap){ st.push({line:line, frames:frames.map(function(x){return {sig:x.sig,info:x.info,ret:x.ret};}), active:active, cap:cap}); }
      var stack=[], vals=[5,4,3,2,1];
      for(var i=0;i<vals.length;i++){ var n=vals[i]; stack.push({sig:'fact('+n+')', info:'n='+n, ret:null});
        if(n>1) snap(2, stack, stack.length-1, 'fact('+n+') 호출 → fact('+(n-1)+') 필요 (하강·push)');
        else snap(1, stack, stack.length-1, 'fact(1): 기저사례 → return 1'); }
      stack[stack.length-1].ret=1;
      snap(1, stack, stack.length-1, 'fact(1)=1 반환·pop');
      var acc=1, upv=[2,3,4,5];
      for(i=0;i<upv.length;i++){ stack.pop(); var m=upv[i], prev=acc; acc=m*acc;
        stack[stack.length-1].ret=acc;
        snap(2, stack, stack.length-1, 'fact('+m+')='+m+'*'+prev+'='+acc+' 반환·pop'); }
      snap(3, [{sig:'main', info:'', ret:120}], 0, '최종 fact(5) = 5*4*3*2*1 = 120');
      this.steps=st; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'int fact(int n){', hl:'fact'},
        {t:'  if(n <= 1) return 1;', hl:'return 1'},
        {t:'  return n * fact(n - 1);', hl:'n * fact(n - 1)'},
        {t:'}  // fact(5) = 120', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.14, W*0.46, code, 'factorial.cpp', f.line);
      ctx.fillStyle=DIM; ctx.font='12.5px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('5 * 4 * 3 * 2 * 1  =  120', W*0.055, codeBot+30);
      var sx=W*0.58, sy=H*0.16, sw=W*0.36;
      drawStack(E, sx, sy, f.frames, f.active, sw, 42);
      stepCap(E, W*0.04, codeBot+64, s.step, this.steps.length, f.cap);
      if(f.frames.length===1 && f.frames[0].sig==='main'){ ctx.fillStyle=GRN; ctx.font='700 18px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ fact(5) = 120', W*0.04, codeBot+96); }
      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (하강 → 기저 → 상승)', true);
      E.big('심화 1 · 팩토리얼 — 가장 순수한 선형 재귀', 'fact(n) = n × fact(n−1), 기저 fact(1)=1. 한 호출이 <b>정확히 하나</b>의 재귀 호출을 낳는 <b>선형 재귀</b>입니다. 스택 깊이는 n, 상승할 때 곱셈이 하나씩 완성돼 5*4*3*2*1 = <b>120</b>. 콜 스택이 한 줄로 곧게 쌓였다 곧게 풀리는 — 재귀의 가장 깨끗한 표본입니다.'); }
  },

  // ─── 2. 피보나치 (트리 재귀 + 메모이제이션) ───
  { id:'cpp17_05_fib', branchOf:'cpp17_05', ord:2,
    enter:function(E){ var self=this; this.s={memo:0, step:0};
      // fib(6): 호출 트리 전체를 실제로 돌려 노드·호출횟수 계산
      var idc=0;
      function buildTree(n){ var node={n:n, id:idc++, children:[], val:null};
        if(n<2){ node.val=n; return node; }
        node.children.push(buildTree(n-1)); node.children.push(buildTree(n-2));
        node.val=node.children[0].val+node.children[1].val; return node; }
      this.tree=buildTree(6); // fib(6)=8
      // 순수 재귀 호출 횟수 (중복 포함)
      function count(n){ return n<2?1:1+count(n-1)+count(n-2); }
      this.naiveCalls=count(6); // = 25
      // 메모 호출 횟수: 각 서로 다른 인자를 1번씩만 실제 계산 + 나머진 표조회
      // fib(6) 메모: 실제 계산 노드 수 = 서로다른 n(0..6)=7, 표조회(재방문)까지 포함한 호출 수는 11
      this.memoCalls=11;
      E.controls('<div class="ctrl"><label>방식 (순수 ↔ 메모이제이션)</label><input type="range" id="m" min="0" max="1" step="1" value="0"><output id="mo">순수 재귀</output></div>');
      E.bind('#m','input',function(e){ self.s.memo=+e.target.value; document.getElementById('mo').textContent=(+e.target.value?'메모이제이션':'순수 재귀'); E.blip(340,0.06); });
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%2; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, memo=(s.memo===1);
      var code = memo ? [
        {t:'// 메모이제이션 — 답을 표에 저장', dim:true},
        {t:'int memo[N]; // -1로 초기화', dim:true},
        {t:'int fib(int n){', hl:'fib'},
        {t:'  if(n < 2) return n;', hl:'return n'},
        {t:'  if(memo[n] != -1) return memo[n];', hl:'memo[n]'},
        {t:'  return memo[n] = fib(n-1)+fib(n-2);', hl:'memo[n] ='},
        {t:'}  // 각 n 딱 한 번만 계산', dim:true}
      ] : [
        {t:'// 순수 재귀 — 트리처럼 두 갈래', dim:true},
        {t:'int fib(int n){', hl:'fib'},
        {t:'  if(n < 2) return n;   // 기저', hl:'return n'},
        {t:'  return fib(n-1) + fib(n-2);', hl:'fib(n-1) + fib(n-2)'},
        {t:'}  // 같은 값을 몇 번씩 다시 계산!', dim:true}
      ];
      codePanel(E, W*0.04, H*0.10, W*0.46, code, memo?'fib_memo.cpp':'fib_naive.cpp', memo?5:3);

      // 우: 호출 트리
      var gx=W*0.52, gy=H*0.12, gw=W*0.46, gh=H*0.52;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('fib(6) 호출 트리 — fib(n)=fib(n-1)+fib(n-2)', gx, gy);
      // 트리 레이아웃 (레벨별 x 분산)
      var tree=this.tree, maxDepth=6;
      // 각 노드 위치 계산 (in-order x 배치)
      var leafX=0, positions={};
      (function place(node,depth){
        if(node.children.length===0){ node._x=leafX++; }
        else { node.children.forEach(function(c){ place(c,depth+1); }); node._x=(node.children[0]._x+node.children[node.children.length-1]._x)/2; }
        node._d=depth;
      })(tree,0);
      var totLeaf=leafX;
      var seen={}; // 메모 모드: 처음 만난 n=계산색, 재방문=표조회색
      function drawNode(node){
        var nx=gx+18+ (node._x/(totLeaf-1))*(gw-36);
        var ny=gy+22+ node._d*((gh-30)/maxDepth);
        // 자식 선
        node.children.forEach(function(c){ var cxp=gx+18+(c._x/(totLeaf-1))*(gw-36), cyp=gy+22+c._d*((gh-30)/maxDepth);
          ctx.strokeStyle='rgba(122,184,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(cxp,cyp); ctx.stroke(); });
        node.children.forEach(drawNode);
        var dup = seen[node.n]!==undefined;
        var col = memo ? (dup? PNK : GRN) : (dup? RED : CPB);
        if(!memo) col = dup? RED : CPB;
        ctx.fillStyle= memo&&dup ? 'rgba(244,160,192,0.20)' : (!memo&&dup?'rgba(240,136,138,0.18)':'rgba(90,180,232,0.15)');
        ctx.strokeStyle=col; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(nx,ny,12,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#dfeaf2'; ctx.font='10px ui-monospace,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(node.n, nx, ny+1); ctx.textBaseline='alphabetic';
        seen[node.n]=true;
      }
      drawNode(tree);
      // 범례 + 호출 수 비교
      var ny=gy+gh+6;
      if(memo){ ctx.fillStyle=GRN; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 처음 계산', gx, ny); ctx.fillStyle=PNK; ctx.fillText('● 표에서 즉시 조회(재계산 안 함)', gx+80, ny); }
      else { ctx.fillStyle=CPB; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('● 계산', gx, ny); ctx.fillStyle=RED; ctx.fillText('● 이미 계산한 값을 또 계산(낭비!)', gx+56, ny); }
      ctx.fillStyle='#dfeaf2'; ctx.font='600 13px sans-serif';
      ctx.fillText('순수 재귀 호출 수: '+this.naiveCalls+'회   vs   메모: '+this.memoCalls+'회', gx, ny+24);
      ctx.fillStyle=GRN; ctx.font='700 15px sans-serif'; ctx.fillText('fib(6) = 8', gx, ny+48);

      E.tapHint(W/2, H*0.95, '슬라이더 = 순수 재귀 ↔ 메모이제이션', true);
      E.big('심화 2 · 피보나치 — 트리 재귀와 중복의 함정', 'fib(n)=fib(n−1)+fib(n−2)는 한 호출이 <b>두 개</b>의 재귀 호출을 낳는 <b>트리 재귀</b>입니다. 그런데 함정이 있습니다 — fib(4)를 계산하며 fib(2)를 여러 번, fib(1)을 훨씬 더 여러 번 <b>똑같이 다시</b> 계산하죠. fib(6)의 순수 재귀 호출은 무려 <b>25회</b>, n이 커지면 O(2ⁿ)로 폭발합니다(빨간 노드가 중복). 해법은 <b>메모이제이션</b>: 한 번 구한 fib(n)을 표에 적어 두고, 다시 필요하면 계산 대신 <b>표에서 즉시 꺼냅니다</b>. 그러면 각 n을 딱 한 번만 계산해 호출이 <b>11회</b>로 줄고 O(n)이 됩니다. 결과는 물론 같은 <b>fib(6)=8</b> — 하지만 재귀 + 표 하나로 지수 시간이 선형 시간이 됩니다.'); }
  },

  // ─── 3. 하노이 탑 ───
  { id:'cpp17_05_hanoi', branchOf:'cpp17_05', ord:3,
    enter:function(E){ this.s={step:0};
      // hanoi(3, A, C, B) 실제 이동 시퀀스 + 콜스택 기록
      var moves=[], st=[]; var pegs={A:[3,2,1], B:[], C:[]}; // 큰 원반이 아래(3,2,1: 위가 1)
      function snapMove(from,to,disk,frames,active,cap){
        st.push({pegs:{A:pegs.A.slice(),B:pegs.B.slice(),C:pegs.C.slice()}, move:[from,to,disk], frames:frames.slice(), active:active, cap:cap, line:6}); }
      function snapCall(frames,active,cap,line){ st.push({pegs:{A:pegs.A.slice(),B:pegs.B.slice(),C:pegs.C.slice()}, move:null, frames:frames.slice(), active:active, cap:cap, line:line}); }
      var stack=[];
      function hanoi(n,from,to,aux){
        stack.push('hanoi('+n+','+from+'→'+to+')');
        if(n===1){ snapCall(stack.slice(),stack.length-1,'hanoi(1): 원반 1을 '+from+'→'+to+' (기저)',2);
          var d=pegs[from].pop(); pegs[to].push(d);
          snapMove(from,to,d,stack.slice(),stack.length-1,'원반 '+d+' : '+from+' → '+to);
          stack.pop(); return; }
        snapCall(stack.slice(),stack.length-1,'hanoi('+n+'): 먼저 위 '+(n-1)+'개를 '+from+'→'+aux,4);
        hanoi(n-1,from,aux,to);
        // 큰 원반 이동
        snapCall(stack.slice(),stack.length-1,'hanoi('+n+'): 가장 큰 원반 '+n+'을 '+from+'→'+to,5);
        var dd=pegs[from].pop(); pegs[to].push(dd);
        snapMove(from,to,dd,stack.slice(),stack.length-1,'원반 '+dd+' : '+from+' → '+to);
        snapCall(stack.slice(),stack.length-1,'hanoi('+n+'): 마지막 '+(n-1)+'개를 '+aux+'→'+to,6);
        hanoi(n-1,aux,to,from);
        stack.pop();
      }
      hanoi(3,'A','C','B');
      st.push({pegs:{A:pegs.A.slice(),B:pegs.B.slice(),C:pegs.C.slice()}, move:null, frames:[], active:-1, cap:'완료! 원반 3개를 정확히 2³−1 = 7수만에 옮겼습니다', line:7, done:true});
      this.steps=st;
      this.moveCount=st.filter(function(x){return x.move;}).length; // =7
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'void hanoi(int n,char from,char to,char aux){', hl:'hanoi'},
        {t:'  if(n == 1){', hl:'n == 1'},
        {t:'    move(from, to); return;   // 기저', hl:'move'},
        {t:'  }', dim:true},
        {t:'  hanoi(n-1, from, aux, to);  // ①위 n-1개', hl:'hanoi(n-1, from, aux'},
        {t:'  move(from, to);             // ②큰 원반', hl:'move(from, to)'},
        {t:'  hanoi(n-1, aux, to, from);  // ③다시 n-1개', hl:'hanoi(n-1, aux, to'},
        {t:'}', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.10, W*0.46, code, 'hanoi.cpp', f.line);

      // 세 기둥 + 원반
      var gx=W*0.52, gy=H*0.12, gw=W*0.46, baseY=gy+H*0.30, pegW=gw/3;
      var names=['A','B','C'], cols={1:GRN,2:GLD,3:PNK};
      for(var p=0;p<3;p++){ var cx=gx+pegW*p+pegW/2;
        // 기둥
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,baseY); ctx.lineTo(cx,gy+20); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(gx+pegW*p+8, baseY, pegW-16, 6);
        ctx.fillStyle=CPB; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText(names[p], cx, baseY+22);
        // 원반들
        var stackp=f.pegs[names[p]]; // 아래→위
        for(var k=0;k<stackp.length;k++){ var disk=stackp[k], dw=14+disk*16, dh=15, dx=cx-dw/2, dy=baseY-6-(k+1)*dh;
          var moving = f.move && f.move[2]===disk && (f.move[1]===names[p]);
          ctx.fillStyle= moving?'rgba(255,255,255,0.9)':cols[disk]; ctx.globalAlpha= moving?1:0.85;
          roundRect(ctx,dx,dy,dw,dh,4); ctx.fill(); ctx.globalAlpha=1;
          ctx.strokeStyle= moving?'#fff':'rgba(0,0,0,0.3)'; ctx.lineWidth=1; roundRect(ctx,dx,dy,dw,dh,4); ctx.stroke();
          ctx.fillStyle='#0b1016'; ctx.font='700 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(disk, cx, dy+dh/2); ctx.textBaseline='alphabetic'; }
      }
      // 이동 화살표 표시
      if(f.move){ ctx.fillStyle=GLD; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText('원반 '+f.move[2]+' :  '+f.move[0]+' → '+f.move[1], gx+gw/2, gy+16); }

      // 콜 스택 (간략, 텍스트 목록)
      var sx=gx, sy=baseY+40;
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('콜 스택 (재귀 호출 중첩):', sx, sy);
      for(var i=0;i<f.frames.length;i++){ var fy=sy+8+i*17, isTop=(i===f.active);
        ctx.fillStyle= isTop?CPD:DIM; ctx.font=(isTop?'600 ':'')+'11.5px ui-monospace,monospace';
        ctx.fillText('  '.repeat(i)+'▸ '+f.frames[i], sx+4, fy+12); }

      // 이동 카운터
      var doneMoves=this.steps.slice(0,s.step+1).filter(function(x){return x.move;}).length;
      ctx.fillStyle=GRN; ctx.font='600 13px sans-serif'; ctx.textAlign='right'; ctx.fillText('이동 수: '+doneMoves+' / '+this.moveCount, gx+gw, gy+16);

      stepCap(E, W*0.04, codeBot+24, s.step, this.steps.length, f.cap);
      if(f.done){ ctx.fillStyle=GRN; ctx.font='700 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ 최소 이동 수 = 2³ − 1 = 7', W*0.04, codeBot+50); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 수씩 (호출·이동)', true);
      E.big('심화 3 · 하노이 탑 — 재귀가 빛나는 순간', '기둥 A의 원반 3개(작은 게 위)를 C로 옮기되, ① 한 번에 하나씩 ② 큰 원반을 작은 원반 위에 놓지 못한다는 규칙. 반복으로 짜면 머리가 아프지만 재귀로는 <b>세 줄</b>이면 끝납니다. 통찰: “n개를 A→C로 옮기기”는 곧 ① 위 <b>n−1개를 A→B</b>로(재귀) → ② <b>가장 큰 원반을 A→C</b>로 → ③ <b>n−1개를 B→C</b>로(재귀). 작은 문제(n−1개 옮기기)가 이미 풀린다고 <b>믿기만</b> 하면 되죠 — 이것이 신뢰의 도약입니다. 원반 3개는 정확히 <b>2³−1 = 7수</b>가 필요하고(수학적 최소), 화면의 이동은 실제 재귀를 돌려 만든 그 7수입니다. 콜 스택이 깊어졌다 얕아지는 리듬을 보세요.'); }
  },

  // ─── 4. 순열 생성 (백트래킹) ───
  { id:'cpp17_05_perm', branchOf:'cpp17_05', ord:4,
    enter:function(E){ this.s={step:0};
      // permute([1,2,3]) 백트래킹 전체 기록: 선택/탐색/취소 + 완성된 순열 수집
      var st=[], results=[]; var used=[false,false,false], path=[]; var arr=[1,2,3];
      function snap(line,cap,type){ st.push({path:path.slice(), used:used.slice(), results:results.slice(), line:line, cap:cap, type:type}); }
      function go(depth){
        if(depth===3){ results.push(path.slice()); snap(2,'경로 완성 → 순열 ['+path.join(',')+'] 저장 ('+results.length+'/6)','found'); return; }
        for(var i=0;i<3;i++){ if(used[i]) continue;
          used[i]=true; path.push(arr[i]);
          snap(5,'선택: '+arr[i]+' → 경로 ['+path.join(',')+']','choose');
          go(depth+1);
          used[i]=false; path.pop();
          snap(7,'취소(백트래킹): '+arr[i]+' 되돌림 → ['+(path.length?path.join(','):'∅')+']','undo');
        }
      }
      snap(1,'permute([1,2,3]) 시작 — 빈 경로에서 출발','start');
      go(0);
      snap(9,'완료 — 서로 다른 순열 '+results.length+'개 모두 생성','done');
      this.steps=st; this.results=results; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'void permute(vector<int>& path){', hl:'permute'},
        {t:'  if(path.size() == n){', hl:'path.size() == n'},
        {t:'    results.push_back(path); return;', hl:'push_back'},
        {t:'  }', dim:true},
        {t:'  for(int i=0;i<n;++i){', hl:'i<n'},
        {t:'    if(used[i]) continue;', hl:'used[i]'},
        {t:'    used[i]=1; path.push_back(a[i]); // 선택', hl:'push_back(a[i])'},
        {t:'    permute(path);                  // 탐색', hl:'permute(path)'},
        {t:'    used[i]=0; path.pop_back();      // 취소', hl:'pop_back'},
        {t:'  }', dim:true}
      ];
      codePanel(E, W*0.04, H*0.10, W*0.46, code, 'permute.cpp', f.line);

      var gx=W*0.52, gy=H*0.13, gw=W*0.44;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('[1,2,3]의 순열 — 선택 → 탐색 → 취소', gx, gy);

      // 현재 경로 (선택된 것/후보)
      var py=gy+22;
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('현재 경로:', gx, py+16);
      for(var k=0;k<3;k++){ var bx=gx+80+k*44, has=(k<f.path.length);
        ctx.fillStyle= has?(f.type==='found'?'rgba(126,224,176,0.22)':'rgba(90,180,232,0.18)'):'rgba(255,255,255,0.03)';
        ctx.strokeStyle= has?(f.type==='found'?GRN:CPB):'rgba(255,255,255,0.14)'; ctx.lineWidth=1.4;
        roundRect(ctx,bx,py,36,36,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle= has?'#dfeaf2':DIM; ctx.font='700 16px ui-monospace,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(has?f.path[k]:'·', bx+18, py+19); ctx.textBaseline='alphabetic'; }
      // 사용 가능 후보
      ctx.fillStyle=DIM; ctx.font='11.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('남은 후보:', gx, py+62);
      for(k=0;k<3;k++){ var av=!f.used[k], cx2=gx+80+k*30;
        ctx.fillStyle= av?BLU:'rgba(255,255,255,0.10)'; ctx.font='13px ui-monospace,monospace'; ctx.textAlign='center';
        ctx.fillText(av?[1,2,3][k]:'✗', cx2, py+66); }

      // 수집된 순열 (실제 결과)
      var ry=py+92;
      ctx.fillStyle=GLD; ctx.font='600 12.5px sans-serif'; ctx.textAlign='left'; ctx.fillText('생성된 순열 ('+f.results.length+'/6):', gx, ry);
      for(k=0;k<f.results.length;k++){ var rrx=gx+(k%3)*100, rry=ry+18+Math.floor(k/3)*28;
        ctx.fillStyle='rgba(126,224,176,0.12)'; ctx.strokeStyle=GRN; ctx.lineWidth=1; roundRect(ctx,rrx,rry,88,22,5); ctx.fill(); ctx.stroke();
        ctx.fillStyle=GRN; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='center'; ctx.fillText('['+f.results[k].join(',')+']', rrx+44, rry+15); }

      // 이벤트 타입 배지
      var tb = f.type==='choose'?['▸ 선택',CPB]: f.type==='undo'?['◂ 취소',PNK]: f.type==='found'?['✓ 완성',GRN]:['',DIM];
      if(tb[0]){ ctx.fillStyle=tb[1]; ctx.font='700 12px sans-serif'; ctx.textAlign='right'; ctx.fillText(tb[0], gx+gw, gy); }

      stepCap(E, W*0.04, H*0.10+10*16+28+14, s.step, this.steps.length, f.cap);

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (선택→탐색→취소)', true);
      E.big('심화 4 · 순열 생성 — 백트래킹의 정석', '[1,2,3]으로 만들 수 있는 순서(순열)는 몇 개일까요? 3! = <b>6개</b>입니다. 재귀 + <b>백트래킹</b>으로 하나도 빠짐없이, 중복 없이 만듭니다. 규칙은 세 박자: ① <b>선택</b> — 아직 안 쓴 수 하나를 골라 경로에 넣고 “썼다” 표시. ② <b>탐색</b> — 그 상태에서 재귀로 나머지 자리를 채운다. ③ <b>취소(back-track)</b> — 돌아온 뒤 방금 넣은 수를 <b>빼고</b> 표시를 지워, 다음 선택지를 시도할 수 있게 원상복구. 경로 길이가 3에 닿으면 완성된 순열을 저장하죠. 핵심은 ③ — 재귀가 “한 갈래를 다 파 본 뒤 반드시 원래 상태로 되돌린다”는 점입니다. 이 되돌림 덕에 결정 트리의 모든 가지를 깔끔히 훑어 정확히 <b>6개</b>가 나옵니다. N-Queens·미로·스도쿠가 전부 이 백트래킹 뼈대입니다.'); }
  },

  // ─── 5. 병합정렬 (분할정복) ───
  { id:'cpp17_05_merge', branchOf:'cpp17_05', ord:5,
    enter:function(E){ this.s={step:0};
      // mergesort([5,2,8,1,9,3]) 전체를 실제로 돌려 분할·병합 이벤트 기록
      var input=[5,2,8,1,9,3], st=[];
      var a=input.slice();
      function snap(line,segs,active,cap,type){ st.push({line:line, segs:segs, active:active, cap:cap, type:type, snapshot:a.slice()}); }
      // 분할 트리 시각화를 위해 각 구간 [lo,hi] 을 이벤트로
      function ms(lo,hi,depth){
        if(lo>=hi){ snap(1,[[lo,hi,depth,'base']],[lo,hi],'구간 ['+lo+']=['+a[lo]+'] 원소 1개 → 이미 정렬(기저)','base'); return; }
        var mid=(lo+hi)>>1;
        snap(2,[[lo,hi,depth,'split']],[lo,hi],'['+lo+'..'+hi+'] → 반으로 분할 (mid='+mid+')','split');
        ms(lo,mid,depth+1); ms(mid+1,hi,depth+1);
        // 병합
        var tmp=[], p=lo, q=mid+1;
        while(p<=mid&&q<=hi){ if(a[p]<=a[q]) tmp.push(a[p++]); else tmp.push(a[q++]); }
        while(p<=mid) tmp.push(a[p++]); while(q<=hi) tmp.push(a[q++]);
        for(var k=0;k<tmp.length;k++) a[lo+k]=tmp[k];
        snap(4,[[lo,hi,depth,'merge']],[lo,hi],'['+lo+'..'+mid+'] + ['+(mid+1)+'..'+hi+'] 병합 → ['+a.slice(lo,hi+1).join(',')+']','merge');
      }
      snap(0,[[0,5,0,'start']],[0,5],'mergesort([5,2,8,1,9,3]) 시작','start');
      ms(0,5,0);
      snap(5,[[0,5,0,'done']],[0,5],'완료 → 정렬 결과 ['+a.join(',')+']','done');
      this.steps=st; this.input=input; this.sorted=a.slice();
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%this.steps.length; E.blip(360,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, f=this.steps[Math.min(s.step,this.steps.length-1)];
      var code=[
        {t:'void msort(int a[],int lo,int hi){', hl:'msort'},
        {t:'  if(lo >= hi) return;    // 기저: 1개', hl:'lo >= hi'},
        {t:'  int mid = (lo+hi)/2;', hl:'mid'},
        {t:'  msort(a, lo, mid);      // 왼쪽 절반', hl:'msort(a, lo, mid)'},
        {t:'  msort(a, mid+1, hi);    // 오른쪽 절반', hl:'msort(a, mid+1, hi)'},
        {t:'  merge(a, lo, mid, hi);  // 두 정렬본 병합', hl:'merge'},
        {t:'}  // → [1,2,3,5,8,9]', dim:true}
      ];
      var codeBot=codePanel(E, W*0.04, H*0.14, W*0.46, code, 'mergesort.cpp',
        f.type==='base'?1: f.type==='split'?2: f.type==='merge'?5: f.type==='done'?6:0);

      var gx=W*0.53, gy=H*0.16, gw=W*0.44;
      ctx.fillStyle=CPB; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText('분할정복 — 반으로 쪼갰다가 정렬하며 병합', gx, gy);

      // 현재 배열 상태 (막대/셀) — 활성 구간 강조
      var arr=f.snapshot, n=arr.length, cw=Math.min(gw/n, 52), ay=gy+22, ch=40;
      var act=f.active;
      for(var i=0;i<n;i++){ var inSeg=(act && i>=act[0] && i<=act[1]);
        var fill = f.type==='merge'&&inSeg?'rgba(126,224,176,0.20)': f.type==='split'&&inSeg?'rgba(90,180,232,0.20)': inSeg?'rgba(255,210,122,0.16)':'rgba(255,255,255,0.03)';
        var stroke = f.type==='merge'&&inSeg?GRN: f.type==='split'&&inSeg?CPB: inSeg?GLD:'rgba(255,255,255,0.12)';
        ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=inSeg?1.8:1;
        roundRect(ctx,gx+i*cw+2,ay,cw-4,ch,5); ctx.fill(); ctx.stroke();
        ctx.fillStyle= inSeg?'#dfeaf2':DIM; ctx.font='700 15px ui-monospace,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(arr[i], gx+i*cw+cw/2, ay+ch/2); ctx.textBaseline='alphabetic';
        ctx.fillStyle=DIM; ctx.font='9.5px sans-serif'; ctx.fillText(i, gx+i*cw+cw/2, ay+ch+12); }

      // 활성 구간 브래킷
      if(act){ var bx0=gx+act[0]*cw+2, bx1=gx+(act[1]+1)*cw-2, by=ay+ch+22;
        ctx.strokeStyle= f.type==='merge'?GRN:(f.type==='split'?CPB:GLD); ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(bx0,by); ctx.lineTo(bx0,by+5); ctx.lineTo(bx1,by+5); ctx.lineTo(bx1,by); ctx.stroke();
        var lab = f.type==='split'?'분할':(f.type==='merge'?'병합(정렬)':(f.type==='base'?'1개=정렬됨':''));
        ctx.fillStyle= f.type==='merge'?GRN:(f.type==='split'?CPB:GLD); ctx.font='600 11px sans-serif'; ctx.textAlign='center';
        ctx.fillText(lab, (bx0+bx1)/2, by+18); }

      // 원본 vs 결과
      var oy=ay+ch+52;
      ctx.fillStyle=DIM; ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
      ctx.fillText('입력:  ['+this.input.join(', ')+']', gx, oy);
      ctx.fillStyle=GRN; ctx.fillText('정렬:  ['+this.sorted.join(', ')+']', gx, oy+20);

      stepCap(E, W*0.04, codeBot+22, s.step, this.steps.length, f.cap);
      if(f.type==='done'){ ctx.fillStyle=GRN; ctx.font='700 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('✓ 정렬 완료 · 항상 O(n log n)', W*0.04, codeBot+48); }

      E.tapHint(W/2, H*0.95, '화면 탭 = 한 단계 (분할 → 기저 → 병합)', true);
      E.big('심화 5 · 병합정렬 — 분할정복의 정수', '병합정렬은 <b>분할정복(divide & conquer)</b>의 교과서입니다. ① <b>분할</b>: 배열을 반으로 쪼갠다 → 두 번의 재귀 호출. ② 계속 쪼개다 <b>원소가 1개</b>가 되면 그건 이미 정렬된 상태(기저사례). ③ <b>정복·병합</b>: 정렬된 두 조각을 <b>지퍼처럼 맞물려</b> 하나의 정렬된 조각으로 합친다(양쪽 앞을 비교해 작은 것부터 뽑기). [5,2,8,1,9,3]이 낱개까지 흩어졌다가 [1,2,3,5,8,9]로 되맞춰집니다. 핵심 통찰: <b>병합은 “올라올 때(상승)” 일어난다</b> — 하강 때 쪼개기만 하고, 상승 때 정렬하며 합칩니다(팩토리얼의 곱셈이 상승 때 일어난 것과 같은 리듬!). 매 단계 절반씩 log n 층, 각 층 병합에 n → <b>항상 O(n log n)</b>, 입력이 아무리 고약해도 보장됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
