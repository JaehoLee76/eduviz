/* 인공지능 제11장 — Transformer: Attention·Q/K/V·Self-Attention·위치인코딩·병렬처리
   출처: 「혁펜하임의 Easy! 딥러닝」 Ch.8 (RNN→Attention→Self-Attention). 「Attention Is All You Need」(Vaswani 외, 2017).
   동작(behavior)만. 텍스트=content/ai11.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 어텐션 가중치는 전부 실제 내적(dot)→Softmax로 계산(베껴 그리기 금지). N×N 셀프어텐션 행렬도 실측. */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';
  function dot(a,b){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
  function softmax(arr){ var m=-1e9,i; for(i=0;i<arr.length;i++) if(arr[i]>m)m=arr[i];
    var e=[],s=0; for(i=0;i<arr.length;i++){ var v=Math.exp(arr[i]-m); e.push(v); s+=v; }
    for(i=0;i<e.length;i++) e[i]/=s; return e; }
  function vlen(a){ return Math.sqrt(dot(a,a)); }

  // 인코더-디코더 어텐션 예시(PDF: "저는 강사 입니다" → "I am an instructor")
  var KIN=[ {t:'저는', k:[1.0,0.25]}, {t:'강사', k:[0.25,1.0]}, {t:'입니다', k:[-0.6,0.45]} ];   // 입력 단어 키(=값)
  var QOUT=[ {t:'I', q:[1.05,0.15]}, {t:'am', q:[-0.5,0.5]}, {t:'an', q:[0.2,1.05]}, {t:'instructor', q:[0.3,1.1]} ];  // 디코더 시점 쿼리

  var scenes = [

  // ══════════ 1. Attention — 어디에 주목할까 ══════════
  { id:'ai11_01',
    enter:function(E){ var self=this; this.s={step:2};
      E.controls('<div class="ctrl"><label>디코더 출력 시점</label><input type="range" id="st" min="0" max="3" step="1" value="2"><output id="sto">an</output></div>');
      E.bind('#st','input',function(e){ self.s.step=+e.target.value; document.getElementById('sto').textContent=QOUT[self.s.step].t; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s, q=QOUT[s.step].q;
      var scores=KIN.map(function(o){ return dot(q,o.k); }), w=softmax(scores);   // 실제 내적→Softmax
      // 입력 토큰 + 주목도 막대
      var n=KIN.length, x0=W*0.16, gap=W*0.20, by=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('입력 문장(인코더)', x0, by-46);
      var mx=0; for(var i=0;i<n;i++) if(w[i]>w[mx]) mx=i;
      for(i=0;i<n;i++){ var cx=x0+i*gap;
        // 주목도 막대(softmax 가중치)
        var bh=w[i]*H*0.34;
        ctx.fillStyle=(i===mx)?CYA:'rgba(61,214,220,0.35)'; ctx.fillRect(cx-26, by-bh, 52, bh);
        ctx.fillStyle=(i===mx)?'#0a1417':'#dfeef0'; ctx.font='600 18px sans-serif'; ctx.textAlign='center';
        // 토큰 박스
        ctx.fillStyle=(i===mx)?CYA:'rgba(255,255,255,0.08)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-30,by+8,60,34,9);ctx.fill();}else ctx.fillRect(cx-30,by+8,60,34);
        ctx.fillStyle=(i===mx)?'#0a1417':'#dfeef0'; ctx.font='600 16px sans-serif'; ctx.fillText(KIN[i].t, cx, by+30);
        ctx.fillStyle=(i===mx)?CYA:DIM; ctx.font='13px sans-serif'; ctx.fillText('주목 '+(w[i]*100).toFixed(0)+'%', cx, by-bh-8); }
      // 디코더 현재 시점(쿼리)
      ctx.fillStyle=GLD; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('지금 만들 단어(쿼리): "'+QOUT[s.step].t+'"', W*0.5, H*0.62);
      ctx.fillStyle='#dfeef0'; ctx.font='15px sans-serif';
      ctx.fillText('→ 입력 중 "'+KIN[mx].t+'"에 '+(w[mx]*100).toFixed(0)+'% 주목 (가장 닮은 단어)', W*0.5, H*0.62+26);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('맥락벡터 = Σ (주목도 × 단어벡터) — 매 시점 다르게 만들어짐', W*0.5, H*0.62+50);
      E.tapHint(W/2, H*0.95, '출력 시점을 바꿔 보세요 — 주목하는 입력 단어가 달라집니다', true);
      E.big('Attention — 시점마다 어디에 주목할까', 'RNN은 문장 전체를 벡터 하나에 욱여넣어 길어지면 정보가 뭉개졌습니다. Attention은 출력 매 시점마다 입력의 <b>어느 단어에 주목할지</b>를 골라 그때그때 다른 맥락벡터를 만듭니다. 주목도는 쿼리와 각 단어의 닮은 정도(내적)를 Softmax로 0~1 분포로 만든 값입니다.'); }
  },

  // ══════════ 2. 내적 = 닮은 정도, Softmax = 주목 분포 ══════════
  { id:'ai11_02',
    enter:function(E){ var self=this; this.s={ang:55};
      E.controls('<div class="ctrl"><label>쿼리 방향 (도)</label><input type="range" id="ag" min="0" max="180" step="5" value="55"><output id="ago">55</output></div>');
      E.bind('#ag','input',function(e){ self.s.ang=+e.target.value; document.getElementById('ago').textContent=e.target.value; E.blip(300+self.s.ang,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cx=W*0.30, cy=H*0.50, R=Math.min(W*0.18,H*0.30);
      var keys=[ {t:'저는', v:[Math.cos(0.18),Math.sin(0.18)]}, {t:'강사', v:[Math.cos(1.25),Math.sin(1.25)]}, {t:'입니다', v:[Math.cos(2.5),Math.sin(2.5)]} ];
      var qa=s.ang*Math.PI/180, q=[Math.cos(qa),Math.sin(qa)];
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      // 키 벡터
      var cols=[BLU,GRN,PNK];
      for(var i=0;i<3;i++){ var kx=cx+keys[i].v[0]*R, ky=cy-keys[i].v[1]*R;
        ctx.strokeStyle=cols[i]; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(kx,ky); ctx.stroke();
        ctx.fillStyle=cols[i]; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(keys[i].t, kx+6, ky); }
      // 쿼리 벡터
      ctx.strokeStyle=GLD; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+q[0]*R,cy-q[1]*R); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.fillText('쿼리', cx+q[0]*R+6, cy-q[1]*R);
      // 내적·softmax 실측
      var scores=keys.map(function(o){ return dot(q,o.v); }), w=softmax(scores.map(function(v){return v*3;}));  // 온도 스케일
      var px=W*0.60, py=H*0.28;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('내적(닮은 정도) → Softmax(주목 분포)', px, py);
      for(i=0;i<3;i++){ var yy=py+34+i*42;
        ctx.fillStyle=cols[i]; ctx.font='14px sans-serif'; ctx.fillText(keys[i].t, px, yy);
        ctx.fillStyle=DIM; ctx.fillText('내적 '+scores[i].toFixed(2), px+66, yy);
        var bw=w[i]*W*0.20; ctx.fillStyle=cols[i]; ctx.fillRect(px+150, yy-12, Math.max(2,bw), 14);
        ctx.fillStyle='#dfeef0'; ctx.font='600 13px sans-serif'; ctx.fillText((w[i]*100).toFixed(0)+'%', px+150+bw+6, yy); }
      ctx.fillStyle=DIM; ctx.font='13px sans-serif'; ctx.fillText('내적 = |a||b|cosθ — 방향이 가까울수록 큼(닮음).', px, py+34+3*42+6);
      E.tapHint(W/2, H*0.95, '쿼리를 돌려 보세요 — 가까운 키일수록 주목도(%)가 커집니다', true);
      E.big('내적 = 닮은 정도, Softmax = 주목 분포', '두 벡터의 <b>내적</b>은 방향이 비슷할수록 커져 ‘닮은 정도(유사도)’를 잽니다. 어텐션은 쿼리와 각 키의 내적으로 점수를 매기고, <b>Softmax</b>로 0~1·합1의 분포로 바꿉니다 — “강사에 70% 주목”처럼 해석되죠.'); }
  },

  // ══════════ 3. Q·K·V — 질문·열쇠·값 ══════════
  { id:'ai11_03',
    enter:function(E){ var self=this; this.s={sel:2};
      E.controls('<div class="ctrl"><label>쿼리(질문) 선택</label><input type="range" id="qq" min="0" max="2" step="1" value="2"><output id="qqo">강사쪽</output></div>');
      E.bind('#qq','input',function(e){ self.s.sel=+e.target.value; document.getElementById('qqo').textContent=['저는쪽','입니다쪽','강사쪽'][self.s.sel]; E.blip(360,0.06); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 값(Value)=2D 위치, 키(Key)=같은 토큰의 또다른 벡터(여기선 키=값 방향). 쿼리는 선택지로 한 키에 기울임.
      var toks=[ {t:'저는', V:[-1.0,0.4]}, {t:'입니다', V:[0.2,1.1]}, {t:'강사', V:[1.0,-0.2]} ];
      var qdir=[[-1.0,0.4],[0.2,1.1],[1.0,-0.2]][s.sel];
      var keys=toks.map(function(o){return o.V;});
      var scores=keys.map(function(k){ return dot(qdir,k); }), w=softmax(scores.map(function(v){return v*1.6;}));
      var cx=W*0.32, cy=H*0.50, R=Math.min(W*0.16,H*0.26);
      // 값 벡터 + 가중치
      var cols=[BLU,GRN,PNK];
      var ctxv=[0,0];
      for(var i=0;i<3;i++){ var vx=cx+toks[i].V[0]*R, vy=cy-toks[i].V[1]*R;
        ctx.strokeStyle=cols[i]; ctx.globalAlpha=0.4+0.6*w[i]; ctx.lineWidth=2+w[i]*6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(vx,vy); ctx.stroke(); ctx.globalAlpha=1;
        ctx.fillStyle=cols[i]; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText(toks[i].t+' ('+(w[i]*100).toFixed(0)+'%)', vx+6, vy);
        ctxv[0]+=w[i]*toks[i].V[0]; ctxv[1]+=w[i]*toks[i].V[1]; }
      // 맥락벡터(가중합) = Σ w·V (실측)
      ctx.strokeStyle=GLD; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+ctxv[0]*R, cy-ctxv[1]*R); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 15px sans-serif'; ctx.fillText('맥락벡터 C', cx+ctxv[0]*R+6, cy-ctxv[1]*R);
      // 설명 패널
      var px=W*0.60, py=H*0.30;
      [['Query (쿼리)','지금 단어가 “무엇에 주목?”이라 묻는 질문 벡터',GLD],
       ['Key (키)','각 입력 단어가 “나는 이런 단어”라 답하는 벡터',BLU],
       ['Value (값)','실제로 가중합되는, 단어 의미를 담은 벡터',PNK]].forEach(function(r,j){ var yy=py+j*54;
        ctx.fillStyle=r[2]; ctx.font='600 16px sans-serif'; ctx.textAlign='left'; ctx.fillText(r[0], px, yy);
        ctx.fillStyle='#cfe6e8'; ctx.font='13px sans-serif'; ctx.fillText(r[1], px, yy+20); });
      ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.fillText('C = Σ Softmax(Q·Kᵢ) · Vᵢ', px, py+3*54+6);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.fillText('Transformer는 Q·K·V를 각각 별도 FC 레이어로 만듭니다.', px, py+3*54+28);
      E.tapHint(W/2, H*0.95, '쿼리를 바꾸면 가중치(굵기)와 맥락벡터 C가 달라집니다', true);
      E.big('Q · K · V — 질문 · 열쇠 · 값', '어텐션의 세 주역: <b>쿼리</b>는 “무엇에 주목할까?”라 묻고, <b>키</b>는 “나는 이런 단어”라 답하며, <b>값</b>은 실제로 섞이는 의미 벡터입니다. 맥락벡터 C는 쿼리·키 내적을 Softmax한 가중치로 값들을 <b>가중합</b>한 것 — 화면의 C는 실제 가중합입니다.'); }
  },

  // ══════════ 4. Self-Attention — 문장이 스스로를 본다 ══════════
  { id:'ai11_04',
    enter:function(E){ var self=this; this.s={focus:1};
      E.controls('<div class="ctrl"><label>주목 주체(토큰)</label><input type="range" id="fc" min="0" max="4" step="1" value="1"><output id="fco">고양이</output></div>');
      E.bind('#fc','input',function(e){ self.s.focus=+e.target.value; document.getElementById('fco').textContent=['그','고양이','가','앉','다'][self.s.focus]; E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var toks=['그','고양이','가','앉','다'];
      // 각 토큰 임베딩(결정적 4D) → Q=K=V(셀프어텐션, 간단화). QKᵀ/√d → 행별 Softmax
      var d=4, emb=toks.map(function(t,i){ var v=[]; for(var j=0;j<d;j++) v.push(Math.sin(i*1.7+j*2.1)+0.3*Math.cos(i*0.9*(j+1))); return v; });
      var n=toks.length, A=[]; for(var i=0;i<n;i++){ var row=[]; for(var j=0;j<n;j++) row.push(dot(emb[i],emb[j])/Math.sqrt(d)); A.push(softmax(row)); }
      // N×N 히트맵
      var gx=W*0.18, gy=H*0.16, cell=Math.min(W*0.085,H*0.13);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('← 주목 대상(Key) →', gx+n*cell/2, gy-10);
      for(i=0;i<n;i++){ ctx.fillStyle=(i===s.focus)?CYA:DIM; ctx.font=(i===s.focus?'600 ':'')+'13px sans-serif';
        ctx.textAlign='right'; ctx.fillText(toks[i], gx-8, gy+i*cell+cell*0.6);   // 행 라벨(쿼리)
        ctx.textAlign='center'; ctx.fillText(toks[i], gx+i*cell+cell/2, gy+n*cell+18); }   // 열 라벨(키)
      for(i=0;i<n;i++) for(var j=0;j<n;j++){ var a=A[i][j], hl=(i===s.focus);
        ctx.fillStyle='rgba(61,214,220,'+(0.08+0.9*a).toFixed(3)+')'; ctx.globalAlpha=hl?1:0.5; ctx.fillRect(gx+j*cell, gy+i*cell, cell-2, cell-2);
        if(hl){ ctx.fillStyle=a>0.4?'#06222a':'#bfeef0'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText((a*100).toFixed(0), gx+j*cell+cell/2, gy+i*cell+cell*0.6); } ctx.globalAlpha=1; }
      // 선택 토큰의 주목 분포 설명
      var row=A[s.focus], mx=0; for(j=1;j<n;j++) if(row[j]>row[mx])mx=j;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left';
      ctx.fillText('"'+toks[s.focus]+'" 토큰이 보는 곳: "'+toks[mx]+'"에 '+(row[mx]*100).toFixed(0)+'% 주목', W*0.16, gy+n*cell+52);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText('모든 토큰이 모든 토큰을 동시에 봅니다 — RNN처럼 순서대로 X, 한 번에 병렬로.', W*0.16, gy+n*cell+76);
      E.tapHint(W/2, H*0.95, '주목 주체 토큰을 바꿔 그 행(주목 분포)을 보세요', true);
      E.big('Self-Attention — 문장이 스스로를 본다', '인코더/디코더가 <b>자기 문장 안의 단어들끼리</b> 어텐션을 합니다. 각 토큰을 쿼리·키·값으로 만들어, 모든 토큰 쌍의 내적을 Softmax한 <b>N×N 주목 행렬</b>을 얻죠(화면은 실제 행렬). RNN과 달리 모든 위치를 <b>동시에 병렬</b>로 처리해 빠르고, ‘멀수록 잊혀짐’도 없습니다.'); }
  },

  // ══════════ 5. 위치 인코딩 + 병렬 처리 (Transformer 전체) ══════════
  { id:'ai11_05',
    enter:function(E){ var self=this; this.s={pos:3};
      E.controls('<div class="ctrl"><label>토큰 위치 pos</label><input type="range" id="ps" min="0" max="7" step="1" value="3"><output id="pso">3</output></div>');
      E.bind('#ps','input',function(e){ self.s.pos=+e.target.value; document.getElementById('pso').textContent=e.target.value; E.blip(300+self.s.pos*40,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 위치 인코딩: PE(pos,2i)=sin(pos/10000^(2i/d)), PE(pos,2i+1)=cos(...). 실제 사인/코사인.
      var d=8, ox=W*0.12, oy=H*0.30, pw=W*0.50, rowH=H*0.04;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('위치 인코딩 PE(pos, ·) — 차원별 사인/코사인', ox, oy-16);
      for(var i=0;i<d;i++){ var freq=1/Math.pow(10000, (2*Math.floor(i/2))/d);
        ctx.strokeStyle='rgba(61,214,220,0.3)'; ctx.lineWidth=1; ctx.beginPath();
        for(var p=0;p<=7;p+=0.05){ var val=(i%2===0)?Math.sin(p*freq*6.283):Math.cos(p*freq*6.283); var px=ox+(p/7)*pw, py=oy+i*rowH+rowH/2 - val*rowH*0.42; if(p===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
        // 현재 pos 값(실측)
        var v=(i%2===0)?Math.sin(s.pos*freq*6.283):Math.cos(s.pos*freq*6.283);
        var dx=ox+(s.pos/7)*pw; ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(dx, oy+i*rowH+rowH/2 - v*rowH*0.42, 3.5,0,7); ctx.fill();
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText('d'+i, ox-22, oy+i*rowH+rowH/2+3); }
      ctx.strokeStyle='rgba(255,210,122,0.5)'; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(ox+(s.pos/7)*pw, oy-4); ctx.lineTo(ox+(s.pos/7)*pw, oy+d*rowH); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=GLD; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('pos='+s.pos, ox+(s.pos/7)*pw, oy+d*rowH+16);
      // RNN(순차) vs Transformer(병렬)
      var bx=W*0.70, by=H*0.30;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('순차(RNN) vs 병렬(Transformer)', bx, by-16);
      for(i=0;i<5;i++){ ctx.fillStyle='rgba(122,184,255,0.6)'; ctx.fillRect(bx+i*30, by, 24, 18);
        if(i<4){ ctx.strokeStyle=BLU; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(bx+i*30+24,by+9); ctx.lineTo(bx+(i+1)*30,by+9); ctx.stroke(); } }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('RNN: 한 칸씩 차례로 (느림)', bx, by+34);
      for(i=0;i<5;i++){ ctx.fillStyle='rgba(61,214,220,0.7)'; ctx.fillRect(bx+i*30, by+54, 24, 18); }
      ctx.strokeStyle=CYA; ctx.lineWidth=1.5; for(i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(bx+i*30+12,by+72); ctx.lineTo(bx+60,by+92); ctx.stroke(); }
      ctx.fillStyle=DIM; ctx.fillText('Transformer: 한 번에 동시 (빠름)', bx, by+106);
      E.tapHint(W/2, H*0.95, 'pos를 바꿔 위치마다 고유한 사인/코사인 지문을 보세요', true);
      E.big('위치 인코딩 + 병렬 처리', 'Self-Attention은 단어를 동시에 보므로 <b>순서 정보가 없습니다</b>. 그래서 위치마다 다른 <b>사인/코사인 패턴(위치 인코딩)</b>을 더해 “몇 번째 단어인지”를 새깁니다(화면은 실제 sin/cos). 순서 의존이 사라지니 RNN과 달리 모든 단어를 <b>병렬</b>로 처리해 학습이 빠릅니다 — 이것이 「Attention Is All You Need」가 연 Transformer입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
