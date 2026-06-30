/* 인공지능 제12장 — 사전학습과 LLM: BPE 토큰화 · 다음 토큰 예측(자기지도) · 사전학습→미세조정 · Scaling Law · BERT vs GPT
   동작(behavior)만. 텍스트=content/ai12.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 토큰 병합 빈도·Softmax 확률·멱법칙 손실곡선은 전부 draw()에서 실측/실계산(베껴 그리기·난수표시 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function softmax(arr){ var m=-1e9,i; for(i=0;i<arr.length;i++) if(arr[i]>m)m=arr[i];
    var e=[],s=0; for(i=0;i<arr.length;i++){ var v=Math.exp(arr[i]-m); e.push(v); s+=v; }
    for(i=0;i<e.length;i++) e[i]/=s; return e; }

  // ── BPE: 결정적 코퍼스(단어=문자 시퀀스, 끝에 _). 가장 빈번한 인접쌍을 k번 병합 ──
  // 빈도 가중 단어 사전 (영어 low/lower/newest/widest 류의 고전 BPE 예시)
  var BPE_WORDS = [ {w:['l','o','w','_'], f:5}, {w:['l','o','w','e','r','_'], f:2},
                    {w:['n','e','w','e','s','t','_'], f:6}, {w:['w','i','d','e','s','t','_'], f:3} ];
  // k번 병합을 결정적으로 수행 → 각 단계 상태 반환
  function bpeRun(kmax){
    var words = BPE_WORDS.map(function(o){ return {w:o.w.slice(), f:o.f}; });
    var merges = [];   // 각 병합: {pair:[a,b], joined, count}
    for(var k=0;k<kmax;k++){
      var cnt = {};   // 인접쌍 빈도(빈도 가중)
      for(var i=0;i<words.length;i++){ var s=words[i].w; for(var j=0;j<s.length-1;j++){
        var key=s[j]+''+s[j+1]; cnt[key]=(cnt[key]||0)+words[i].f; } }
      // 최빈쌍 선택(동률이면 사전순 — 결정적)
      var best=null, bc=-1; for(var key in cnt){ var c=cnt[key]; if(c>bc || (c===bc && key<best)){ bc=c; best=key; } }
      if(best===null || bc<=0) break;
      var pa=best.split(''), a=pa[0], b=pa[1], joined=a+b;
      merges.push({a:a,b:b,joined:joined,count:bc});
      // 모든 단어에서 a,b 인접쌍을 joined로 병합
      for(i=0;i<words.length;i++){ var t=words[i].w, out=[]; for(j=0;j<t.length;j++){
        if(j<t.length-1 && t[j]===a && t[j+1]===b){ out.push(joined); j++; } else out.push(t[j]); } words[i].w=out; }
    }
    return {words:words, merges:merges};
  }
  var BPE_MAX = bpeRun(10);   // 최대 병합수(어휘 수렴 관찰용)

  function rrect(ctx,x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);} else {ctx.beginPath();ctx.rect(x,y,w,h);} }

  var scenes = [

  // ══════════ 1. BPE 토큰화 — 글자에서 서브워드로 ══════════
  { id:'ai12_01',
    enter:function(E){ var self=this; this.s={k:4};
      E.controls('<div class="ctrl"><label>병합 횟수 k</label><input type="range" id="mk" min="0" max="10" step="1" value="4"><output id="mko">4</output></div>');
      E.bind('#mk','input',function(e){ self.s.k=+e.target.value; document.getElementById('mko').textContent=e.target.value; E.blip(300+self.s.k*40,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var R = bpeRun(s.k);   // k번 병합을 실제 수행(결정적, 빈도 실측)
      // 좌측: 단어들이 토큰 조각으로 어떻게 쪼개지는가
      var x0=W*0.10, y0=H*0.20, rowH=H*0.115;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('코퍼스의 단어 → 현재 토큰 조각', x0, y0-18);
      for(var i=0;i<R.words.length;i++){ var seg=R.words[i].w, f=R.words[i].f, yy=y0+i*rowH, cx=x0;
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('×'+f, x0, yy+30);
        cx = x0+34;
        for(var j=0;j<seg.length;j++){ var tk=seg[j], merged=(tk.length>1), label=tk.replace('_','·');
          ctx.font='600 14px sans-serif'; var tw=ctx.measureText(label).width+18;
          ctx.fillStyle = merged ? 'rgba(255,210,122,0.22)' : 'rgba(61,214,220,0.14)';
          rrect(ctx,cx,yy+12,tw,26,7); ctx.fill();
          ctx.strokeStyle = merged ? GLD : CYA; ctx.lineWidth=1.4; ctx.stroke();
          ctx.fillStyle = merged ? GLD : '#dfeef0'; ctx.textAlign='center'; ctx.fillText(label, cx+tw/2, yy+30);
          cx += tw+7; } }
      // 우측: 병합 규칙(병합 순서·빈도 실측)
      var px=W*0.62, py=H*0.18;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('학습된 병합 규칙 (최빈쌍 순)', px, py-2);
      if(R.merges.length===0){ ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('아직 병합 없음 — 모두 한 글자 토큰', px, py+28); }
      for(i=0;i<R.merges.length;i++){ var m=R.merges[i], yy2=py+24+i*23;
        ctx.fillStyle=(i===R.merges.length-1)?GLD:DIM; ctx.font='13px sans-serif'; ctx.textAlign='left';
        ctx.fillText((i+1)+'. ‘'+m.a.replace('_','·')+'’+‘'+m.b.replace('_','·')+'’ → ‘'+m.joined.replace('_','·')+'’  (빈도 '+m.count+')', px, yy2); }
      // 어휘 크기(고유 토큰 수, 실측)
      var vocab={}; for(i=0;i<R.words.length;i++) for(j=0;j<R.words[i].w.length;j++) vocab[R.words[i].w[j]]=1;
      var vn=0; for(var kk in vocab) vn++;
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('어휘 = '+vn+'개 토큰  ·  병합 '+R.merges.length+'회', px, H*0.84);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('병합할수록 자주 쓰이는 덩어리(est·low)가 한 토큰이 됩니다.', px, H*0.84+22);
      E.tapHint(W/2, H*0.95, '병합 횟수 k를 올려 보세요 — 자주 붙는 글자쌍이 한 토큰으로', true);
      E.big('토크나이저 (BPE) — 글자에서 서브워드로', '모델은 글자도 단어도 아닌 <b>토큰</b>으로 글을 읽습니다. <b>BPE</b>는 처음엔 모든 글자를 따로 두고, 코퍼스에서 <b>가장 자주 붙어 나오는 글자쌍</b>을 하나로 합치기를 반복합니다. 화면의 병합 순서·빈도는 실제 코퍼스에서 센 값 — k를 올리면 ‘est’, ‘low’ 같은 흔한 조각이 한 토큰으로 자라죠.'); }
  },

  // ══════════ 2. 다음 토큰 예측 — 자기지도 사전학습 ══════════
  { id:'ai12_02',
    enter:function(E){ var self=this; this.s={T:1.0};
      E.controls('<div class="ctrl"><label>온도 T (Softmax)</label><input type="range" id="tp" min="0.3" max="2.0" step="0.1" value="1.0"><output id="tpo">1.0</output></div>');
      E.bind('#tp','input',function(e){ self.s.T=+e.target.value; document.getElementById('tpo').textContent=(+e.target.value).toFixed(1); E.blip(320,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 어휘별 결정적 로짓(문맥 "나는 학교에 ___"에 어울릴수록 큼). 베껴넣은 확률 아님 — 로짓→Softmax 실계산.
      var vocab=[ {w:'간다', g:3.2}, {w:'갔다', g:2.6}, {w:'가요', g:2.0}, {w:'있다', g:1.3},
                  {w:'사과', g:-0.6}, {w:'바나나', g:-1.4}, {w:'달린다', g:0.7}, {w:'먹는다', g:-0.2} ];
      var logits=vocab.map(function(o){ return o.g/s.T; });
      var p=softmax(logits);
      // 문맥 문장
      ctx.fillStyle='#dfeef0'; ctx.font='600 22px sans-serif'; ctx.textAlign='center';
      ctx.fillText('“나는  학교에  ___ ”', W*0.5, H*0.16);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('빈칸에 올 다음 토큰의 확률 = Softmax(로짓 / 온도)', W*0.5, H*0.16+26);
      // 막대그래프(확률 실계산, 내림차순 정렬)
      var idx=vocab.map(function(_,i){return i;}).sort(function(a,b){return p[b]-p[a];});
      var bx=W*0.20, by=H*0.32, bw=W*0.60, rowH=H*0.058, mx=p[idx[0]];
      for(var r=0;r<idx.length;r++){ var i=idx[r], yy=by+r*rowH, frac=p[i]/mx, len=frac*bw;
        var top=(r===0);
        ctx.fillStyle=top?GLD:'rgba(61,214,220,0.55)'; rrect(ctx,bx,yy,Math.max(3,len),rowH*0.62,5); ctx.fill();
        ctx.fillStyle=top?GLD:'#dfeef0'; ctx.font=(top?'600 ':'')+'15px sans-serif'; ctx.textAlign='right'; ctx.fillText(vocab[i].w, bx-10, yy+rowH*0.46);
        ctx.fillStyle=top?'#06222a':'#dfeef0'; ctx.font='600 12px sans-serif'; ctx.textAlign='left';
        var pct=(p[i]*100).toFixed(1)+'%'; if(len>52) ctx.fillText(pct, bx+8, yy+rowH*0.43); else { ctx.fillStyle=DIM; ctx.fillText(pct, bx+len+8, yy+rowH*0.43); } }
      // 정답·손실(교차엔트로피, 실계산). 정답 토큰 = '간다'
      var ans=0, loss=-Math.log(p[ans]);
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText('정답 토큰 “간다”  ·  교차엔트로피 손실 −log p = '+loss.toFixed(3), W*0.5, H*0.90);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('학습 = 정답 토큰의 확률을 키워 이 손실을 줄이는 일. 라벨은 그냥 ‘다음 글자’ — 사람이 안 답니다(자기지도).', W*0.5, H*0.90+22);
      E.tapHint(W/2, H*0.965, '온도 T를 바꿔 보세요 — 낮으면 1등에 뾰족, 높으면 평평', true);
      E.big('다음 토큰 예측 — 자기지도 사전학습', 'LLM 사전학습의 과제는 단 하나: <b>다음 토큰 맞히기</b>. “나는 학교에” 다음에 무엇이 올지 어휘 전체에 확률을 매기고(Softmax), 실제 다음 글자와 비교해 틀린 만큼 줄입니다. 정답(라벨)이 텍스트 안에 이미 들어 있어 사람이 라벨을 달 필요가 없죠 — 그래서 <b>자기지도</b>, 인터넷 전체를 교재로 쓸 수 있는 비결입니다.'); }
  },

  // ══════════ 3. 사전학습 → 미세조정 (전이학습) ══════════
  { id:'ai12_03',
    enter:function(E){ var self=this; this.s={ft:1};   // 0=사전학습만, 1=미세조정 후
      E.controls('<div class="ctrl"><label>단계</label><input type="range" id="ph" min="0" max="1" step="1" value="1"><output id="pho">미세조정 후</output></div>');
      E.bind('#ph','input',function(e){ self.s.ft=+e.target.value; document.getElementById('pho').textContent=['사전학습만','미세조정 후'][self.s.ft]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 데이터량 대비(로그 스케일 막대): 사전학습 코퍼스 vs 과제별 라벨 데이터. 실수치(토큰 수).
      var pre=3e11, fine=2e4;   // 300B 토큰 vs 20K 예시
      var bx=W*0.10, by=H*0.30, bw=W*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('데이터량 비교 (로그 스케일)', bx, by-16);
      function logbar(y,val,c,lab){ var lg=Math.log10(val), frac=lg/Math.log10(pre), len=frac*bw;   // 실제 log10 비율
        ctx.fillStyle=c; rrect(ctx,bx,y,Math.max(6,len),28,7); ctx.fill();
        ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText(lab, bx, y-6);
        var human = val>=1e9 ? (val/1e9).toFixed(0)+'B 토큰' : (val>=1e3?(val/1e3).toFixed(0)+'K 예시':val+'개');
        ctx.fillStyle=c; ctx.font='600 13px sans-serif'; ctx.fillText(human, bx+Math.max(6,len)+8, y+19); }
      logbar(by, pre, BLU, '① 사전학습 코퍼스 (언어 일반)');
      logbar(by+H*0.16, fine, GLD, '② 미세조정 데이터 (과제 특화)');
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('사전학습은 미세조정보다 ~'+Math.round(pre/fine/1e6)+'백만 배 많은 텍스트를 봅니다.', bx, by+H*0.16+58);
      // 우측: 전이학습 흐름도 — 일반 표현 → 과제 머리
      var fx=W*0.56, fy=H*0.26, fw=W*0.34;
      // 사전학습 몸통
      ctx.fillStyle='rgba(122,184,255,0.16)'; rrect(ctx,fx,fy,fw,H*0.20,12); ctx.fill();
      ctx.strokeStyle=BLU; ctx.lineWidth=1.6; ctx.stroke();
      ctx.fillStyle=BLU; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('사전학습 본체', fx+fw/2, fy+24);
      ctx.fillStyle='#cfe6e8'; ctx.font='12.5px sans-serif'; ctx.fillText('언어의 일반 지식 (문법·상식·세계)', fx+fw/2, fy+46);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('가중치 대부분 고정/공유', fx+fw/2, fy+66);
      // 과제 머리(미세조정 단계에만 강조)
      var hy=fy+H*0.24, on=(s.ft===1);
      ctx.globalAlpha = on?1:0.35;
      ctx.fillStyle='rgba(255,210,122,0.18)'; rrect(ctx,fx+fw*0.25,hy,fw*0.5,H*0.11,10); ctx.fill();
      ctx.strokeStyle=GLD; ctx.lineWidth=1.6; ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('과제 머리', fx+fw/2, hy+24);
      ctx.fillStyle='#cfe6e8'; ctx.font='12px sans-serif'; ctx.fillText('감성분류 / 번역 / QA', fx+fw/2, hy+44);
      // 연결 화살표
      ctx.strokeStyle = on?GLD:DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(fx+fw/2, fy+H*0.20); ctx.lineTo(fx+fw/2, hy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx+fw/2-5, hy-7); ctx.lineTo(fx+fw/2,hy); ctx.lineTo(fx+fw/2+5,hy-7); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.fillStyle = on?GRN:DIM; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      ctx.fillText(on?'소량 데이터로 과제 머리만 빠르게 적응 ✓':'아직 일반 언어 능력만 보유', fx+fw/2, hy+H*0.11+28);
      E.tapHint(W/2, H*0.95, '단계를 바꿔 사전학습→미세조정 전이를 보세요', true);
      E.big('사전학습 → 미세조정 (전이학습)', '한 모델을 처음부터 과제별로 키우는 건 비쌉니다. 그래서 <b>대규모 사전학습</b>으로 언어의 일반 지식을 한 번 쌓고(인터넷 규모), 그 위에 <b>소량의 과제 데이터</b>로 살짝 다듬습니다(미세조정). 큰 공부는 한 번, 응용은 값싸게 — 사전학습이 미세조정보다 수백만 배 많은 텍스트를 보는 이 비대칭이 LLM 시대를 열었습니다.'); }
  },

  // ══════════ 4. Scaling Law — 멱법칙 손실 ══════════
  { id:'ai12_04',
    enter:function(E){ var self=this; this.s={exp:9};   // 10^exp 파라미터 수
      E.controls('<div class="ctrl"><label>모델 크기 N = 10^?</label><input type="range" id="sc" min="6" max="12" step="0.5" value="9"><output id="sco">9.0</output></div>');
      E.bind('#sc','input',function(e){ self.s.exp=+e.target.value; document.getElementById('sco').textContent=(+e.target.value).toFixed(1); E.blip(300+(self.s.exp-6)*60,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 멱법칙: L(N) = L∞ + a·N^(-b). 전부 실계산. log-log에서 직선처럼.
      var Linf=1.7, a=24.0, b=0.095;
      function loss(exp){ var N=Math.pow(10,exp); return Linf + a*Math.pow(N,-b); }
      var ox=W*0.12, oy=H*0.78, pw=W*0.56, pv=H*0.54, e0=6, e1=12;
      // 축
      ctx.strokeStyle='rgba(61,214,220,0.22)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+pw,oy); ctx.moveTo(ox,oy); ctx.lineTo(ox,oy-pv); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('손실 L', ox+4, oy-pv-6);
      ctx.textAlign='right'; ctx.fillText('모델 크기 log₁₀N →', ox+pw, oy+18);
      // y 범위
      var ymax=loss(e0), ymin=Linf;
      function SX(e){ return ox + (e-e0)/(e1-e0)*pw; }
      function SY(L){ return oy - (L-ymin)/(ymax-ymin)*pv; }
      // x축 눈금
      for(var e=e0;e<=e1;e++){ ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText(e+'', SX(e), oy+16); ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(SX(e),oy); ctx.lineTo(SX(e),oy-pv); ctx.stroke(); }
      // 곡선(실계산)
      ctx.strokeStyle=GLD; ctx.lineWidth=2.6; ctx.beginPath();
      for(e=e0;e<=e1+1e-6;e+=0.05){ var L=loss(e), px=SX(e), py=SY(L); if(e===e0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
      // 점근선 L∞
      ctx.strokeStyle='rgba(126,224,176,0.5)'; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(ox,SY(Linf)); ctx.lineTo(ox+pw,SY(Linf)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('줄일 수 없는 손실 L∞='+Linf.toFixed(1), ox+6, SY(Linf)-6);
      // 현재 점
      var cL=loss(s.exp), cx=SX(s.exp), cy=SY(cL);
      ctx.strokeStyle='rgba(255,210,122,0.4)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(cx,oy); ctx.lineTo(cx,cy); ctx.lineTo(ox,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(cx,cy,6,0,7); ctx.fill();
      // 우측 수치 패널
      var px2=W*0.74, py2=H*0.30, N=Math.pow(10,s.exp);
      var human = N>=1e12?(N/1e12).toFixed(1)+'조':N>=1e9?(N/1e9).toFixed(1)+'B':N>=1e6?(N/1e6).toFixed(0)+'M':N.toFixed(0);
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('현재 규모', px2, py2);
      ctx.fillStyle=GLD; ctx.font='600 18px sans-serif'; ctx.fillText('N ≈ '+human+' 파라미터', px2, py2+28);
      ctx.fillStyle=GRN; ctx.font='600 16px sans-serif'; ctx.fillText('손실 L = '+cL.toFixed(4), px2, py2+58);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('L = L∞ + a·N⁻ᵇ', px2, py2+86);
      ctx.fillStyle=DIM; ctx.fillText('(b='+b+' — 크기 10배마다', px2, py2+106);
      ctx.fillText(' 손실이 일정 비율로 감소)', px2, py2+124);
      E.tapHint(W/2, H*0.95, '모델 크기 N을 키워 손실이 멱법칙으로 매끄럽게 내려가는 걸 보세요', true);
      E.big('Scaling Law — 크기를 키우면 손실이 내려간다', '놀랍게도 LLM의 성능은 변덕스럽지 않습니다. 모델·데이터·계산을 키우면 손실이 <b>멱법칙 L = L∞ + a·N⁻ᵇ</b>을 따라 <b>예측 가능하게</b> 내려가죠(화면은 실제 멱법칙 계산). 작은 모델 몇 개로 곡선을 그려 큰 모델의 성능을 미리 점칠 수 있다는 뜻 — 다만 줄일 수 없는 바닥 L∞이 있고, 두 배 좋아지려면 훨씬 더 많은 자원이 듭니다.'); }
  },

  // ══════════ 5. BERT vs GPT — 인코더 vs 디코더 ══════════
  { id:'ai12_05',
    enter:function(E){ var self=this; this.s={mode:0};   // 0=BERT(양방향), 1=GPT(자기회귀)
      E.controls('<div class="ctrl"><label>모델</label><input type="range" id="md" min="0" max="1" step="1" value="0"><output id="mdo">BERT (인코더)</output></div>');
      E.bind('#md','input',function(e){ self.s.mode=+e.target.value; document.getElementById('mdo').textContent=['BERT (인코더)','GPT (디코더)'][self.s.mode]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, bert=(s.mode===0);
      var toks=['나는','학교','에','___','갔다'];   // BERT: 4번째가 [MASK]
      var focus = bert ? 3 : 3;   // 예측 대상 토큰(BERT=마스크 위치, GPT=다음 토큰 자리)
      // 토큰 줄
      var n=toks.length, gx=W*0.16, gap=W*0.14, ty=H*0.30, bw=W*0.105, bh=H*0.10;
      ctx.fillStyle=bert?CYA:GLD; ctx.font='600 17px sans-serif'; ctx.textAlign='left';
      ctx.fillText(bert?'BERT — 인코더 · 양방향 · 빈칸 채우기(MLM)':'GPT — 디코더 · 자기회귀 · 다음 단어', gx, ty-30);
      for(var i=0;i<n;i++){ var cx=gx+i*gap;
        var isMask = bert && i===focus;
        var visible = bert ? true : (i<focus);   // GPT: 예측 시 미래 토큰은 마스킹(안 보임)
        var label = isMask ? '[MASK]' : toks[i];
        ctx.globalAlpha = visible ? 1 : 0.25;
        ctx.fillStyle = isMask ? 'rgba(244,160,192,0.25)' : (i===focus&&!bert ? 'rgba(255,210,122,0.20)' : 'rgba(61,214,220,0.12)');
        rrect(ctx,cx,ty,bw,bh,9); ctx.fill();
        ctx.strokeStyle = isMask?PNK:(i===focus&&!bert?GLD:CYA); ctx.lineWidth=1.6; ctx.stroke();
        ctx.fillStyle = isMask?PNK:'#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText(label, cx+bw/2, ty+bh*0.6);
        ctx.globalAlpha=1; }
      // 어텐션 방향 화살표: BERT=양방향(focus↔모두), GPT=과거→현재(좌측만)
      var fy0=ty+bh+6, fcx=gx+focus*gap+bw/2;
      for(i=0;i<n;i++){ if(i===focus) continue; var icx=gx+i*gap+bw/2;
        var allowed = bert ? true : (i<focus);   // GPT는 과거 토큰만 본다(causal mask)
        if(!allowed) continue;
        ctx.strokeStyle = bert ? 'rgba(61,214,220,0.55)' : 'rgba(255,210,122,0.6)'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(icx, fy0+6); var midy=fy0+H*0.10;
        ctx.quadraticCurveTo((icx+fcx)/2, midy, fcx, fy0+6); ctx.stroke();
        // 화살촉(focus 쪽)
        var dir = fcx>icx?-1:1; ctx.fillStyle = bert?CYA:GLD;
        ctx.beginPath(); ctx.moveTo(fcx,fy0+6); ctx.lineTo(fcx+dir*7, fy0+1); ctx.lineTo(fcx+dir*7, fy0+11); ctx.fill(); }
      ctx.fillStyle=bert?CYA:GLD; ctx.font='12.5px sans-serif'; ctx.textAlign='center';
      ctx.fillText(bert?'마스크 토큰은 양쪽(과거+미래) 문맥을 모두 본다':'각 토큰은 자기 앞(과거) 토큰만 본다 (인과 마스킹)', W*0.5, fy0+H*0.155);
      // 예측 결과(결정적 로짓 → Softmax 실계산). 정답 '갔다'
      var cands = bert ? [ {w:'갔다',g:3.0},{w:'간다',g:1.8},{w:'있다',g:0.9},{w:'없다',g:-0.5} ]
                       : [ {w:'갔다',g:2.7},{w:'간다',g:2.1},{w:'다녔다',g:1.0},{w:'있다',g:0.2} ];
      var p=softmax(cands.map(function(o){return o.g;}));
      var qx=W*0.30, qy=H*0.62, qw=W*0.40;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(bert?'[MASK] 자리 예측 (양방향 문맥)':'다음 토큰 예측 (왼쪽 문맥만)', qx, qy-8);
      for(i=0;i<cands.length;i++){ var yy=qy+i*H*0.052, len=p[i]*qw, top=(i===0);
        ctx.fillStyle=top?(bert?CYA:GLD):'rgba(255,255,255,0.10)'; rrect(ctx,qx+72,yy,Math.max(3,len),H*0.034,5); ctx.fill();
        ctx.fillStyle=top?(bert?CYA:GLD):'#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='right'; ctx.fillText(cands[i].w, qx+64, yy+H*0.026);
        ctx.fillStyle='#dfeef0'; ctx.font='600 12px sans-serif'; ctx.textAlign='left'; ctx.fillText((p[i]*100).toFixed(0)+'%', qx+72+Math.max(3,len)+6, yy+H*0.026); }
      E.tapHint(W/2, H*0.95, '모델을 바꿔 마스킹 방식의 차이를 보세요', true);
      E.big('BERT vs GPT — 인코더 vs 디코더', '같은 Transformer 블록이 두 갈래로 갈립니다. <b>BERT(인코더)</b>는 문장 일부를 [MASK]로 가리고 <b>앞뒤 양쪽</b> 문맥으로 빈칸을 채웁니다 — 이해(분류·검색)에 강하죠. <b>GPT(디코더)</b>는 <b>인과 마스킹</b>으로 미래를 가린 채 왼쪽 문맥만 보고 다음 단어를 잇습니다 — 생성에 강합니다. 마스킹 방향 하나가 ‘읽는 모델’과 ‘쓰는 모델’을 가릅니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
