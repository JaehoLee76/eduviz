/* 인공지능 제13장 — 정렬과 프롬프트: 지시튜닝 · RLHF · 프롬프트 엔지니어링 · 온도/샘플링 · 환각과 한계
   동작(behavior)만. 텍스트=content/ai13.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 보상·정답률·Softmax 온도 분포·환각 확률은 전부 draw()에서 실계산(결정적). 베껴 그리기·난수표시 금지. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  function softmax(arr,T){ T=T||1; var m=-1e9,i; for(i=0;i<arr.length;i++) if(arr[i]>m)m=arr[i];
    var e=[],s=0; for(i=0;i<arr.length;i++){ var v=Math.exp((arr[i]-m)/T); e.push(v); s+=v; }
    for(i=0;i<e.length;i++) e[i]/=s; return e; }
  // 결정적 해시(난수 대용)
  function h01(i){ return ((Math.sin(i*12.9898+4.233)*43758.5453)%1+1)%1; }

  var scenes = [

  // ══════════ 1. 지시 튜닝 (Instruction Tuning) ══════════
  { id:'ai13_01',
    enter:function(E){ var self=this; this.s={mode:0};
      E.controls('<div class="ctrl"><label>모델 단계</label><input type="range" id="md" min="0" max="1" step="1" value="0"><output id="mdo">사전학습</output></div>');
      E.bind('#md','input',function(e){ self.s.mode=+e.target.value; document.getElementById('mdo').textContent=['사전학습','지시튜닝'][self.s.mode]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, tuned=(s.mode===1);
      var prompt='프랑스의 수도를 알려줘.';
      // 사전학습 모델: 다음 단어만 이어붙임(지시 못 따름). 지시튜닝: 지시-응답으로 답함.
      var preCont='프랑스의 면적은 약 64만 km²이고, 인구는 약 6800만 명이며, 독일과 스페인과 국경을 …';
      var tunedAns='프랑스의 수도는 파리(Paris)입니다.';
      // 프롬프트 박스
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('사용자 지시(프롬프트)', W*0.10, H*0.18);
      ctx.fillStyle='rgba(122,184,255,0.14)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(W*0.10,H*0.21,W*0.80,H*0.10,10);ctx.fill();}
      ctx.fillStyle=BLU; ctx.font='15px sans-serif'; ctx.fillText('"'+prompt+'"', W*0.13, H*0.27);
      // 화살표
      ctx.fillStyle=tuned?GRN:GLD; ctx.font='600 22px sans-serif'; ctx.textAlign='center'; ctx.fillText('↓', W*0.50, H*0.37);
      ctx.fillStyle=tuned?GRN:GLD; ctx.font='600 14px sans-serif'; ctx.fillText(tuned?'지시튜닝 모델':'사전학습 모델(다음 단어만)', W*0.50, H*0.405);
      // 응답 박스
      ctx.textAlign='left';
      ctx.fillStyle=tuned?'rgba(126,224,176,0.13)':'rgba(255,210,122,0.10)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(W*0.10,H*0.45,W*0.80,H*0.20,10);ctx.fill();}
      ctx.fillStyle=tuned?GRN:GLD; ctx.font='600 14px sans-serif'; ctx.fillText('모델 출력', W*0.13, H*0.50);
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif';
      var ans=tuned?tunedAns:preCont, words=ans.split(' '), line='', yy=H*0.55;
      for(var wi=0;wi<words.length;wi++){ var test=line+words[wi]+' ';
        if(ctx.measureText(test).width>W*0.74){ ctx.fillText(line, W*0.13, yy); line=words[wi]+' '; yy+=24; } else line=test; }
      ctx.fillText(line, W*0.13, yy);
      // 판정
      ctx.fillStyle=tuned?GRN:RED; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(tuned?'✔ 지시를 이해하고 정확히 답함':'✘ 그럴듯하게 이어 쓸 뿐, 질문에 답하지 않음', W*0.50, H*0.72);
      // 데이터 흐름 요약
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText(tuned?'학습 데이터: (지시, 좋은 응답) 쌍 수만~수십만 개로 미세조정':'학습 데이터: 인터넷 텍스트 — 목표는 오직 "다음 단어 확률"', W*0.50, H*0.80);
      E.tapHint(W/2, H*0.93, '슬라이더로 사전학습 ↔ 지시튜닝을 비교해 보세요', true);
      E.big('지시 튜닝 — "다음 단어 기계"를 "지시 따르는 비서"로', '사전학습만 끝낸 모델은 인터넷 글의 다음 단어를 잘 맞힐 뿐, “알려줘”라는 <b>지시를 따르지</b> 않습니다. 그래서 (지시, 모범 응답) 쌍 수만 개로 <b>미세조정(fine-tuning)</b>해 “질문엔 답을, 요청엔 수행을” 하도록 가르칩니다. 같은 모델, 같은 질문인데 행동이 완전히 달라지죠.'); }
  },

  // ══════════ 2. RLHF — 사람 선호로 정렬 ══════════
  { id:'ai13_02',
    enter:function(E){ var self=this; this.s={step:0,auto:false};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%3; E.blip(360+this.s.step*100,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 3단계 파이프라인. 보상모델 점수는 결정적 특징 가중합으로 실계산.
      var stages=[ {t:'① 지시튜닝(SFT)', d:'사람이 쓴 모범 응답으로 기본기 학습', c:BLU},
        {t:'② 보상모델 학습', d:'사람이 A>B로 매긴 선호 비교로 "점수 매기는 법" 학습', c:GLD},
        {t:'③ 강화학습(PPO)', d:'보상모델 점수를 최대화하도록 정책 최적화', c:GRN} ];
      // 파이프라인 노드
      var n=3, x0=W*0.18, gap=W*0.32, ny=H*0.20;
      for(var i=0;i<n;i++){ var cx=x0+i*gap, on=(i<=s.step);
        ctx.globalAlpha=on?1:0.32;
        ctx.fillStyle=on?stages[i].c:'rgba(255,255,255,0.08)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-W*0.13,ny-22,W*0.26,44,10);ctx.fill();}
        ctx.fillStyle=on?'#0a1417':DIM; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(stages[i].t, cx, ny+5);
        if(i<n-1){ ctx.strokeStyle=(i<s.step)?stages[i].c:DIM; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx+W*0.13,ny); ctx.lineTo(cx+gap-W*0.13,ny); ctx.stroke();
          ctx.fillStyle=(i<s.step)?stages[i].c:DIM; ctx.fillText('→', cx+gap*0.5, ny-6); }
        ctx.globalAlpha=1; }
      ctx.fillStyle='#dfeef0'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText(stages[s.step].d, W*0.50, H*0.32);

      // 단계별 디테일
      if(s.step===0){
        // 모범 응답(사람)
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.textAlign='center';
        ctx.fillText('사람이 직접 쓴 "이렇게 답해야 해" 시범을 흉내 내 배웁니다.', W*0.50, H*0.42);
        ctx.fillStyle=BLU; ctx.font='600 15px sans-serif'; ctx.fillText('지시 → (사람의 모범 응답) → 모델이 모방', W*0.50, H*0.50);
      } else {
        // 보상모델: 두 응답 A,B의 특징(도움성·정직성·안전성·간결성) 가중합 = 점수(실계산)
        var Wt=[0.42,0.31,0.20,0.07];  // 보상모델이 배운 가중치(결정적)
        var fnames=['도움됨','정직함','안전함','간결함'];
        // 결정적 특징(0~1)
        var A=[0.86,0.78,0.92,0.55], B=[0.49,0.71,0.40,0.83];
        function rew(f){ var r=0; for(var k=0;k<4;k++) r+=Wt[k]*f[k]; return r; }
        var rA=rew(A), rB=rew(B);
        // 선호 확률 P(A>B)=sigmoid(rA-rB) (Bradley-Terry)
        var pAB=1/(1+Math.exp(-(rA-rB)*6));
        var bx=W*0.14, by=H*0.40, bw=W*0.34;
        function card(x,name,f,r,col,best){
          ctx.fillStyle=best?'rgba(126,224,176,0.13)':'rgba(255,255,255,0.05)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,by,bw,H*0.40,10);ctx.fill();}
          ctx.fillStyle=col; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText(name+(best?'  ✔ 사람이 선호':''), x+14, by+24);
          for(var k=0;k<4;k++){ var yy=by+48+k*30;
            ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText(fnames[k], x+14, yy+4);
            ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(x+70, yy-9, bw*0.42, 13);
            ctx.fillStyle=col; ctx.fillRect(x+70, yy-9, bw*0.42*f[k], 13);
            ctx.fillStyle='#cfe6e8'; ctx.font='11px sans-serif'; ctx.fillText((f[k]).toFixed(2), x+70+bw*0.42+8, yy+2); }
          ctx.fillStyle=col; ctx.font='600 16px sans-serif'; ctx.fillText('보상 r = '+r.toFixed(3), x+14, by+H*0.40-12);
        }
        card(bx,'응답 A',A,rA,GRN,rA>=rB); card(bx+bw+W*0.04,'응답 B',B,rB,PNK,rB>rA);
        ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
        ctx.fillText('r = Σ wₖ·특징ₖ  (실계산)   ·   P(A≻B)=σ(6·Δr) = '+(pAB*100).toFixed(1)+'%', W*0.50, H*0.86);
      }
      if(s.step===2){
        // 정책 점수를 보상으로 끌어올림(결정적 수렴 곡선)
        ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.textAlign='center'; ctx.fillText('보상모델이 매긴 점수를 보상으로, 정책을 점점 끌어올립니다', W*0.50, H*0.42);
        var gx=W*0.22, gy=H*0.78, gw=W*0.56, gh=H*0.30;
        ctx.strokeStyle='rgba(61,214,220,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,gy);ctx.lineTo(gx+gw,gy);ctx.moveTo(gx,gy);ctx.lineTo(gx,gy-gh); ctx.stroke();
        ctx.strokeStyle=GRN; ctx.lineWidth=2.4; ctx.beginPath();
        for(var t=0;t<=1.0001;t+=0.02){ var r=1-Math.exp(-3.2*t); var px=gx+t*gw, py=gy-r*gh; if(t===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText('보상↑', gx-2, gy-gh-4); ctx.textAlign='right'; ctx.fillText('학습 스텝 →', gx+gw, gy+16);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('※ 원본에서 너무 멀어지지 않게 KL 페널티로 제어', W*0.50, gy+H*0.04);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 단계 (SFT → 보상모델 → 강화학습)', true);
      E.big('RLHF — 사람의 선호로 모델을 "정렬"한다', '지시튜닝만으론 "좋은 답"의 미묘한 기준(도움됨·정직함·안전함)을 다 못 가르칩니다. 그래서 ①모범 응답으로 기본기를 잡고 ②사람이 두 답을 <b>A&gt;B</b>로 비교한 선호로 “점수 매기는 <b>보상모델</b>”을 학습한 뒤 ③그 점수를 최대화하도록 <b>강화학습</b>합니다. 화면의 보상 r은 특징 가중합으로 실제 계산한 값입니다.'); }
  },

  // ══════════ 3. 프롬프트 엔지니어링 — zero/few-shot/CoT ══════════
  { id:'ai13_03',
    enter:function(E){ var self=this; this.s={mode:0};
      E.controls('<div class="ctrl"><label>프롬프트 방식</label><input type="range" id="pm" min="0" max="2" step="1" value="0"><output id="pmo">Zero-shot</output></div>');
      E.bind('#pm','input',function(e){ self.s.mode=+e.target.value; document.getElementById('pmo').textContent=['Zero-shot','Few-shot','Chain-of-Thought'][self.s.mode]; E.blip(340+self.s.mode*60,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, m=s.mode;
      // 같은 문제(여러 단계 추론 산수)에 3가지 방식. 정답률은 결정적으로 부여(연구 경향 반영).
      var acc=[0.41, 0.63, 0.88][m];   // zero<few<CoT (실측 막대 높이로 사용)
      var names=['Zero-shot','Few-shot','Chain-of-Thought'];
      var cols=[PNK,GLD,GRN];
      // 왼쪽: 프롬프트 구성
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('모델에 주는 프롬프트', W*0.08, H*0.16);
      var bx=W*0.08, by=H*0.20, bw=W*0.50, bh=H*0.58;
      ctx.fillStyle='rgba(255,255,255,0.04)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();}
      ctx.font='13px sans-serif';
      var lines;
      if(m===0){ lines=[['Q: 사과 3개에 2개 더, 5개 먹으면 몇 개?',CYA],['',null],['(예시 없음 · 곧장 답하라)',DIM]];
      } else if(m===1){ lines=[['Q: 2+3은? A: 5',DIM],['Q: 4+1은? A: 5',DIM],['Q: 7−2는? A: 5',DIM],['',null],['Q: 사과 3개에 2개 더, 5개 먹으면? A:',CYA]];
      } else { lines=[['Q: 사과 3개에 2개 더, 5개 먹으면 몇 개?',CYA],['',null],['단계적으로 생각해 보자:',GLD],['· 3 + 2 = 5 (지금 5개)',GLD],['· 5 − 5 = 0',GLD],['따라서 답은 0개.',GRN]]; }
      for(var i=0;i<lines.length;i++){ if(lines[i][1]===null)continue; ctx.fillStyle=lines[i][1]; ctx.fillText(lines[i][0], bx+16, by+30+i*26); }
      // 오른쪽: 정답률 막대(실측 높이) + 모델 답
      var gx=W*0.66, gy=H*0.74, gw=W*0.04, scl=H*0.50;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('다단계 추론 정답률', W*0.78, H*0.16);
      for(i=0;i<3;i++){ var x=gx+i*W*0.085, hh=acc===null?0:[0.41,0.63,0.88][i]*scl, on=(i===m);
        ctx.globalAlpha=on?1:0.32; ctx.fillStyle=cols[i]; ctx.fillRect(x,gy-hh,gw,hh);
        ctx.fillStyle=cols[i]; ctx.font='600 13px sans-serif'; ctx.fillText(([41,63,88][i])+'%', x+gw/2, gy-hh-6);
        ctx.fillStyle=on?'#dfeef0':DIM; ctx.font='11px sans-serif'; ctx.fillText(['zero','few','CoT'][i], x+gw/2, gy+16); ctx.globalAlpha=1; }
      // 현재 방식 모델 답
      ctx.fillStyle=cols[m]; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
      var modelAns=[ '답: 5개 ✘ (성급히 틀림)', '답: 5개 ✘ (형식만 흉내, 5 패턴에 휩쓸림)', '답: 0개 ✔ (과정을 풀어 정답)' ][m];
      ctx.fillText(names[m], W*0.78, gy+H*0.10);
      ctx.fillStyle=(m===2)?GRN:RED; ctx.font='14px sans-serif'; ctx.fillText(modelAns, W*0.78, gy+H*0.10+24);
      E.tapHint(W/2, H*0.93, '슬라이더로 zero-shot → few-shot → CoT 비교', true);
      E.big('프롬프트 엔지니어링 — 묻는 법이 답을 바꾼다', '모델 가중치는 그대로인데, <b>어떻게 묻느냐</b>로 정답률이 크게 달라집니다. 예시 없이 곧장 묻는 <b>zero-shot</b>, 본보기 몇 개를 보여 주는 <b>few-shot</b>, “단계적으로 생각해 보자”로 풀이 과정을 끌어내는 <b>Chain-of-Thought</b> — 특히 추론 문제에서 CoT가 정답률을 크게 올립니다.'); }
  },

  // ══════════ 4. 온도(temperature)·샘플링 ══════════
  { id:'ai13_04',
    enter:function(E){ var self=this; this.s={T:0.8};
      E.controls('<div class="ctrl"><label>온도 T</label><input type="range" id="tp" min="0.1" max="2.0" step="0.05" value="0.8"><output id="tpo">0.80</output></div>');
      E.bind('#tp','input',function(e){ self.s.T=+e.target.value; document.getElementById('tpo').textContent=(+e.target.value).toFixed(2); E.blip(280+self.s.T*200,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, T=s.T;
      // 다음 단어 후보 + 결정적 로짓 → softmax(T). 실제 분포 계산.
      var toks=['하늘','바다','구름','새','용','피아노'];
      var logits=[3.2, 2.4, 1.9, 1.1, 0.3, -0.8];   // 결정적
      var p=softmax(logits,T);
      // 엔트로피(실계산) = 분포의 "퍼짐" 척도
      var ent=0; for(var i=0;i<p.length;i++){ if(p[i]>1e-9) ent-=p[i]*Math.log2(p[i]); }
      var entMax=Math.log2(toks.length);
      // 막대 그래프
      var n=toks.length, gx=W*0.14, gy=H*0.74, gw=W*0.64, bw=gw/n*0.62, gap=gw/n;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('「파란 ___」 다음 단어 확률 분포  (T='+T.toFixed(2)+')', gx, H*0.16);
      var mx=0; for(i=1;i<n;i++) if(p[i]>p[mx])mx=i;
      for(i=0;i<n;i++){ var x=gx+i*gap+gap*0.19, hh=p[i]*H*0.50;
        ctx.fillStyle=(i===mx)?CYA:'rgba(61,214,220,0.4)'; ctx.fillRect(x, gy-hh, bw, hh);
        ctx.fillStyle=(i===mx)?CYA:'#cfe6e8'; ctx.font='600 13px sans-serif'; ctx.textAlign='center'; ctx.fillText((p[i]*100).toFixed(1)+'%', x+bw/2, gy-hh-7);
        ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText(toks[i], x+bw/2, gy+18);
        ctx.fillStyle=DIM; ctx.font='10.5px sans-serif'; ctx.fillText('logit '+logits[i].toFixed(1), x+bw/2, gy+34); }
      ctx.strokeStyle='rgba(61,214,220,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(gx,gy);ctx.lineTo(gx+gw,gy); ctx.stroke();
      // 온도 해석 게이지
      var px=W*0.50, py=H*0.84;
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
      var mood = T<0.4?'날카로움 — 거의 항상 최빈 단어(결정적·보수적)' : T>1.3?'평평함 — 다양·창의적이지만 엉뚱해지기 쉬움':'균형 — 일관성과 다양성의 절충';
      ctx.fillText('엔트로피 H = '+ent.toFixed(2)+' / '+entMax.toFixed(2)+' bit   ·   '+mood, px, py);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('pᵢ = softmax(logitᵢ / T)   —  T↓ 분포 뾰족, T↑ 분포 평평 (실계산)', px, py+22);
      E.tapHint(W/2, H*0.93, '온도 T를 움직여 분포가 뾰족↔평평해지는 것을 보세요', true);
      E.big('온도 — 분포를 뾰족하게, 평평하게', 'LLM은 다음 단어의 <b>확률 분포</b>를 내놓고 거기서 하나를 뽑습니다. <b>온도 T</b>는 로짓을 T로 나눠 분포를 조절합니다 — <b>T가 작으면</b> 최고 확률 단어가 더 도드라져(뾰족·보수적), <b>T가 크면</b> 후보들이 비슷해져(평평·다양·창의적) 뽑힙니다. 화면의 확률·엔트로피는 모두 실제 softmax로 계산한 값입니다.'); }
  },

  // ══════════ 5. 환각(Hallucination)과 한계 ══════════
  { id:'ai13_05',
    enter:function(E){ var self=this; this.s={rag:0};
      E.controls('<div class="ctrl"><label>근거 자료(RAG)</label><input type="range" id="rg" min="0" max="1" step="1" value="0"><output id="rgo">없음</output></div>');
      E.bind('#rg','input',function(e){ self.s.rag=+e.target.value; document.getElementById('rgo').textContent=['없음','검색 근거 제공'][self.s.rag]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, rag=(s.rag===1);
      var prompt='“2019년 노벨 가상문학상 수상자는?” (사실: 그런 상은 없음)';
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('함정 질문', W*0.08, H*0.15);
      ctx.fillStyle=BLU; ctx.font='14px sans-serif'; ctx.fillText(prompt, W*0.08, H*0.19);
      // 후보 답의 "그럴듯함(언어 확률)" vs "사실 여부" — 결정적
      var cand=[ {t:'홍길동', plaus:0.34, real:false},
                 {t:'이몽룡', plaus:0.41, real:false},
                 {t:'(그런 상은 존재하지 않습니다)', plaus:0.09, real:true} ];
      // RAG가 있으면 사실 후보의 언어확률을 끌어올림(근거가 확률 재배치)
      var logitBoost = rag? 2.6 : 0;
      var lg = cand.map(function(c){ return Math.log(c.plaus+1e-3) + (c.real?logitBoost:0); });
      var p = softmax(lg,1);
      var pickedReal = (p[2]>=p[0] && p[2]>=p[1]);
      // 막대
      var gx=W*0.12, gy=H*0.62, gw=W*0.50;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.fillText('모델이 고를 확률(언어적 그럴듯함 기반)', gx, H*0.28);
      for(var i=0;i<cand.length;i++){ var yy=H*0.33+i*H*0.10;
        var real=cand[i].real;
        ctx.fillStyle=real?GRN:RED; ctx.font='13.5px sans-serif'; ctx.textAlign='left'; ctx.fillText(cand[i].t, gx, yy-8);
        ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(gx, yy, gw, 16);
        ctx.fillStyle=real?GRN:'rgba(240,136,138,0.85)'; ctx.fillRect(gx, yy, gw*p[i], 16);
        ctx.fillStyle='#dfeef0'; ctx.font='600 12px sans-serif'; ctx.fillText((p[i]*100).toFixed(1)+'%', gx+gw*p[i]+8, yy+13); }
      // 판정
      ctx.fillStyle=pickedReal?GRN:RED; ctx.font='600 16px sans-serif'; ctx.textAlign='left';
      ctx.fillText(pickedReal? '✔ 모르는 것을 "모른다/존재하지 않는다"고 답함' : '✘ 환각 — 없는 사실을 그럴듯하게 지어냄', gx, H*0.78);
      // 오른쪽: 왜/완화
      var rx=W*0.66, ry=H*0.30;
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.fillText('왜 환각이 생기나', rx, ry);
      ctx.fillStyle='#cfe6e8'; ctx.font='12.5px sans-serif';
      ['모델은 "사실"이 아니라','"가장 그럴듯한 다음 단어"를 고른다.','진실 ≠ 언어적 그럴듯함.','→ 빈칸을 자신 있게 메운다.'].forEach(function(t,j){ ctx.fillText(t, rx, ry+24+j*20); });
      ctx.fillStyle=GRN; ctx.font='600 15px sans-serif'; ctx.fillText('완화법', rx, ry+H*0.26);
      ['· RAG: 검색으로 근거 문서 제공','· 출처 인용·검증 요구','· "모르면 모른다" 학습(정렬)','· 사실 도구·계산기 연결'].forEach(function(t,j){ ctx.fillStyle=(j===0&&rag)?GRN:DIM; ctx.font='12.5px sans-serif'; ctx.fillText(t, rx, ry+H*0.26+24+j*20); });
      E.tapHint(W/2, H*0.93, '슬라이더로 근거(RAG)를 주면 사실 답의 확률이 오릅니다', true);
      E.big('환각 — 그럴듯하지만 틀린 답', 'LLM은 진실을 “아는” 게 아니라 <b>가장 그럴듯한 다음 단어</b>를 고를 뿐입니다. 그래서 모르는 것도 빈칸을 자신 있게 메워 <b>환각(hallucination)</b>이 생깁니다 — 언어적 그럴듯함과 사실은 다른 축이니까요. 완화법은 <b>RAG</b>(검색 근거 제공)·출처 검증·“모르면 모른다” 정렬입니다. 화면에서 근거를 주면 사실 답의 확률이 실제로 재배치됩니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
