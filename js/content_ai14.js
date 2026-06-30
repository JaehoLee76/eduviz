/* 인공지능 제14장 — RAG·벡터 검색: 임베딩 검색 · 벡터 공간/벡터DB · RAG 파이프라인 · 청킹·인덱싱 · RAG vs 파인튜닝
   동작(behavior)만. 텍스트=content/ai14.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 유사도(코사인)·검색 순위·청크 점수는 전부 draw()에서 실측(결정적 임베딩, 하드코딩·난수표시 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // ── 벡터 헬퍼(공통) ──
  function dot(a,b){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
  function vlen(a){ return Math.sqrt(dot(a,a))||1e-9; }
  function cos(a,b){ return dot(a,b)/(vlen(a)*vlen(b)); }   // 코사인 유사도

  // ── 결정적 2D 문서 임베딩(난수 없음) — 의미가 가까운 문서끼리 모이도록 손배치 ──
  // 두 의미 축: x = "동물성", y = "음료/음식성" (직관용 라벨)
  var DOCS = [
    { t:'고양이는 야옹 운다',   e:[ 0.92,  0.30] },
    { t:'강아지가 멍멍 짖는다', e:[ 0.80,  0.55] },
    { t:'사자는 초원의 왕',    e:[ 0.70, -0.20] },
    { t:'커피는 쓴 음료다',    e:[-0.65,  0.85] },
    { t:'녹차에는 카페인',     e:[-0.80,  0.62] },
    { t:'자동차는 빠르다',     e:[-0.55, -0.78] },
    { t:'비행기는 하늘을 난다', e:[-0.30, -0.95] }
  ];

  var scenes = [

  // ══════════ 1. 임베딩 검색 — 코사인 유사도 → top-k 순위 ══════════
  { id:'ai14_01',
    enter:function(E){ var self=this; this.s={ang:35};
      E.controls('<div class="ctrl"><label>쿼리 방향 (도)</label><input type="range" id="qa" min="-120" max="120" step="5" value="35"><output id="qao">35</output></div>');
      E.bind('#qa','input',function(e){ self.s.ang=+e.target.value; document.getElementById('qao').textContent=e.target.value; E.blip(320+(+e.target.value),0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var cx=W*0.30, cy=H*0.52, R=Math.min(W*0.20,H*0.34);
      var qa=s.ang*Math.PI/180, q=[Math.cos(qa),Math.sin(qa)];
      // 좌표 원·축
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
      ctx.strokeStyle='rgba(61,214,220,0.18)'; ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
      ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText('의미 공간(2D)', cx-R, cy-R-8);
      // 각 문서의 코사인 유사도 실측 → 순위
      var sims = DOCS.map(function(d,i){ return {i:i, s:cos(q,d.e)}; });
      var ranked = sims.slice().sort(function(a,b){ return b.s-a.s; });
      var rankOf={}; for(var r=0;r<ranked.length;r++) rankOf[ranked[r].i]=r;   // 0=top
      // 문서 벡터 그리기
      for(var i=0;i<DOCS.length;i++){ var d=DOCS[i], L=vlen(d.e);
        var ux=d.e[0]/L, uy=d.e[1]/L, px=cx+ux*R*0.92, py=cy-uy*R*0.92;
        var rk=rankOf[i], top=(rk<3);
        ctx.strokeStyle=top?CYA:'rgba(122,184,255,0.30)'; ctx.lineWidth=top?2.2:1.2;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
        ctx.fillStyle=top?CYA:'rgba(122,184,255,0.55)'; ctx.beginPath(); ctx.arc(px,py,top?6:4,0,7); ctx.fill();
        if(rk===0){ ctx.fillStyle=GLD; ctx.font='600 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('① 최근접', px, py-12); }
      }
      // 쿼리 벡터(금색)
      ctx.strokeStyle=GLD; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+q[0]*R,cy-q[1]*R); ctx.stroke();
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('쿼리', cx+q[0]*R+6, cy-q[1]*R);
      // top-k 순위표(실측 코사인)
      var px2=W*0.60, py2=H*0.22;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('검색 결과 (코사인 유사도순)', px2, py2);
      for(r=0;r<ranked.length;r++){ var o=ranked[r], yy=py2+30+r*30, top2=(r<3);
        ctx.fillStyle=top2?(r===0?GLD:CYA):DIM; ctx.font=(top2?'600 ':'')+'13px sans-serif';
        ctx.fillText((r+1)+'. '+DOCS[o.i].t, px2, yy);
        // 유사도 막대
        var bw=Math.max(0,(o.s+1)/2)*W*0.10;
        ctx.fillStyle=top2?(r===0?GLD:CYA):'rgba(155,153,163,0.5)'; ctx.fillRect(px2+W*0.20, yy-11, bw, 13);
        ctx.fillStyle='#dfeef0'; ctx.font='12px sans-serif'; ctx.fillText(o.s.toFixed(3), px2+W*0.20+bw+6, yy);
      }
      ctx.fillStyle=DIM; ctx.font='12px sans-serif';
      ctx.fillText('top-3(시안)을 LLM에 넘겨 답을 만듭니다.', px2, py2+30+ranked.length*30+8);
      E.tapHint(W/2, H*0.95, '쿼리를 돌려 보세요 — 가장 가까운 문서(top-k)가 바뀝니다', true);
      E.big('임베딩 검색 — 쿼리에 가장 가까운 문서 찾기', '검색의 핵심은 단어가 아니라 <b>의미</b>로 찾는 것입니다. 쿼리와 문서를 같은 <b>임베딩 벡터</b>로 바꾸고, 둘 사이 <b>코사인 유사도</b>(방향이 가까울수록 1에 가까움)를 재 가장 가까운 <b>top-k</b>를 고릅니다. 화면의 유사도·순위는 전부 실제 코사인 계산값입니다.'); }
  },

  // ══════════ 2. 벡터 공간·벡터DB — 의미가 가까우면 가까이 ══════════
  { id:'ai14_02',
    enter:function(E){ var self=this; this.s={sel:0};
      E.controls('<div class="ctrl"><label>기준 문서 선택</label><input type="range" id="sl" min="0" max="6" step="1" value="0"><output id="slo">고양이</output></div>');
      E.bind('#sl','input',function(e){ self.s.sel=+e.target.value; document.getElementById('slo').textContent=['고양이','강아지','사자','커피','녹차','자동차','비행기'][self.s.sel]; E.blip(360,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var ox=W*0.14, oy=H*0.50, sc=Math.min(W*0.20,H*0.34);   // [-1,1]→화면
      function SX(x){ return ox+W*0.24 + x*sc; } function SY(y){ return oy - y*sc; }
      // 축
      ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(SX(-1.1),SY(0)); ctx.lineTo(SX(1.1),SY(0)); ctx.moveTo(SX(0),SY(-1.1)); ctx.lineTo(SX(0),SY(1.1)); ctx.stroke();
      var base=DOCS[s.sel];
      // 기준과의 코사인으로 색·근접 강조
      var nearest=-1, best=-2;
      for(var i=0;i<DOCS.length;i++){ if(i===s.sel) continue; var c=cos(base.e,DOCS[i].e); if(c>best){best=c;nearest=i;} }
      // 점 + 라벨
      for(i=0;i<DOCS.length;i++){ var d=DOCS[i], px=SX(d.e[0]), py=SY(d.e[1]);
        var isBase=(i===s.sel), isNear=(i===nearest);
        if(isBase){ ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(px,py,9,0,7); ctx.fill(); }
        else if(isNear){ ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px,py,7,0,7); ctx.fill();
          ctx.strokeStyle='rgba(126,224,176,0.7)'; ctx.lineWidth=1.6; ctx.setLineDash([4,4]);
          ctx.beginPath(); ctx.moveTo(SX(base.e[0]),SY(base.e[1])); ctx.lineTo(px,py); ctx.stroke(); ctx.setLineDash([]); }
        else { ctx.fillStyle='rgba(122,184,255,0.7)'; ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.fill(); }
        ctx.fillStyle=isBase?GLD:(isNear?GRN:'#cfe6e8'); ctx.font=(isBase||isNear?'600 ':'')+'12px sans-serif'; ctx.textAlign='left';
        ctx.fillText(d.t, px+9, py+4);
      }
      // 설명 패널
      var px2=W*0.66, py2=H*0.26;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('의미 공간 = 벡터DB', px2, py2);
      ctx.fillStyle=GLD; ctx.beginPath(); ctx.arc(px2+7,py2+28,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.fillText('기준: '+base.t, px2+20, py2+33);
      ctx.fillStyle=GRN; ctx.beginPath(); ctx.arc(px2+7,py2+52,6,0,7); ctx.fill(); ctx.fillStyle='#dfeef0'; ctx.fillText('최근접: '+DOCS[nearest].t, px2+20, py2+57);
      ctx.fillStyle=GRN; ctx.font='600 14px sans-serif'; ctx.fillText('코사인 = '+best.toFixed(3), px2+20, py2+78);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('비슷한 의미(동물끼리, 음료끼리)는', px2, py2+108);
      ctx.fillStyle=DIM; ctx.fillText('공간에서 가까이 모입니다.', px2, py2+126);
      ctx.fillStyle=DIM; ctx.fillText('벡터DB = 이 점들을 저장하고', px2, py2+150);
      ctx.fillStyle=DIM; ctx.fillText('최근접 이웃(ANN)을 빠르게 찾는 DB.', px2, py2+168);
      E.tapHint(W/2, H*0.95, '기준 문서를 바꿔 가장 가까운 이웃(초록)을 확인하세요', true);
      E.big('벡터 공간 · 벡터DB — 의미가 가까우면 가까이', '임베딩은 문장을 의미가 비슷할수록 <b>가까이</b> 놓이는 공간의 점으로 만듭니다 — 동물 문장끼리, 음료 문장끼리 자연히 모이죠. <b>벡터DB</b>는 이 점 수백만 개를 저장하고, 쿼리 점에 가장 가까운 이웃을 <b>근사 최근접 탐색(ANN)</b>으로 순식간에 찾아 줍니다. 화면의 최근접·코사인은 실측값입니다.'); }
  },

  // ══════════ 3. RAG 파이프라인 — 질문→임베딩→검색→증강→생성 ══════════
  { id:'ai14_03',
    enter:function(E){ var self=this; this.s={step:0,auto:false};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*60,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 고정 쿼리 임베딩(결정적) — "커피에 카페인 있나요?" → 음료 축 근처
      var qEmb=[-0.72, 0.80];
      var sims=DOCS.map(function(d,i){ return {i:i, s:cos(qEmb,d.e)}; }).sort(function(a,b){return b.s-a.s;});
      var topk=sims.slice(0,2);
      var stages=[
        {t:'① 질문', c:GLD, d:'"커피에 카페인 있나요?"'},
        {t:'② 임베딩', c:CYA, d:'질문 → 벡터 [-0.72, 0.80]'},
        {t:'③ 검색(top-k)', c:BLU, d:'벡터DB에서 가장 가까운 문서'},
        {t:'④ 증강', c:PNK, d:'찾은 문서를 프롬프트에 끼워넣기'},
        {t:'⑤ 생성', c:GRN, d:'LLM이 근거 보고 답 작성'}
      ];
      var n=stages.length, bx=W*0.10, bw=W*0.16, by=H*0.20, bh=H*0.13, gap=(W*0.80-bw)/(n-1);
      for(var i=0;i<n;i++){ var x=bx+i*gap, on=(i<=s.step), st=stages[i];
        ctx.globalAlpha=on?1:0.30;
        ctx.fillStyle='rgba(255,255,255,0.05)'; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,by,bw,bh,10);ctx.fill();}else ctx.fillRect(x,by,bw,bh);
        ctx.strokeStyle=st.c; ctx.lineWidth=(i===s.step?2.6:1.4); if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,by,bw,bh,10);ctx.stroke();}
        ctx.fillStyle=st.c; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(st.t, x+bw/2, by+24);
        ctx.fillStyle='#cfe6e8'; ctx.font='11px sans-serif';
        // 줄바꿈 간단 처리
        var words=st.d, line=by+44;
        ctx.fillText(words.length>14?words.slice(0,14):words, x+bw/2, line);
        if(words.length>14) ctx.fillText(words.slice(14), x+bw/2, line+15);
        ctx.globalAlpha=1;
        if(i<n-1){ ctx.strokeStyle=on?st.c:'rgba(155,153,163,0.3)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(x+bw, by+bh/2); ctx.lineTo(x+gap, by+bh/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x+gap-7, by+bh/2-5); ctx.lineTo(x+gap, by+bh/2); ctx.lineTo(x+gap-7, by+bh/2+5); ctx.stroke(); }
      }
      // 단계별 상세 패널(실제 검색 점수)
      var dy=H*0.48;
      ctx.textAlign='left';
      if(s.step>=2){
        ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.fillText('검색된 top-2 문서 (코사인 실측)', W*0.12, dy);
        for(i=0;i<topk.length;i++){ var o=topk[i], yy=dy+30+i*32;
          ctx.fillStyle=BLU; ctx.font='600 14px sans-serif'; ctx.fillText('• '+DOCS[o.i].t, W*0.12, yy);
          ctx.fillStyle=GRN; ctx.font='13px sans-serif'; ctx.fillText('cos = '+o.s.toFixed(3), W*0.50, yy);
        }
      }
      if(s.step>=3){
        ctx.fillStyle=PNK; ctx.font='13px sans-serif';
        ctx.fillText('증강 프롬프트: "[근거: '+DOCS[topk[0].i].t+', '+DOCS[topk[1].i].t+'] 질문: 커피에 카페인 있나요?"', W*0.12, dy+30+topk.length*32+10);
      }
      if(s.step>=4){
        ctx.fillStyle=GRN; ctx.font='600 14px sans-serif';
        ctx.fillText('LLM 답: "네 — 커피·녹차 모두 카페인을 함유합니다. (근거 문서 인용)"', W*0.12, dy+30+topk.length*32+40);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 단계 (질문 → … → 생성)', true);
      E.big('RAG 파이프라인 — 검색해서 답하기', 'LLM은 모르는 사실은 그럴듯하게 지어냅니다(환각). <b>RAG</b>(검색 증강 생성)는 답하기 전에 <b>관련 문서를 먼저 검색</b>해 프롬프트에 끼워넣고, LLM이 그 <b>근거를 읽고</b> 답하게 합니다. 질문→임베딩→검색(top-k)→증강→생성 — 화면의 검색 점수는 실제 코사인 계산값입니다. 최신 지식·사내 문서·출처 표시가 가능해집니다.'); }
  },

  // ══════════ 4. 청킹·인덱싱 — 긴 문서를 청크로 쪼개 색인 ══════════
  { id:'ai14_04',
    enter:function(E){ var self=this; this.s={size:4};
      E.controls('<div class="ctrl"><label>청크 크기 (문장 수)</label><input type="range" id="cz" min="1" max="8" step="1" value="4"><output id="czo">4</output></div>');
      E.bind('#cz','input',function(e){ self.s.size=+e.target.value; document.getElementById('czo').textContent=e.target.value; E.blip(300+(+e.target.value)*30,0.05); }); E.setOn([]); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 긴 문서 = 16개 문장. 각 문장에 결정적 "주제 좌표"(1D)
      var NS=16;
      function topic(i){ return ((Math.sin(i*1.7)*43758.5453)%1+1)%1; }   // 0~1 결정적 주제값
      var size=s.size, nChunks=Math.ceil(NS/size);
      // 한 청크의 임베딩 = 평균 주제(요약). 청크가 클수록 주제가 섞여 흐려짐.
      var ox=W*0.10, oy=H*0.22, cellW=W*0.80/NS, rowH=H*0.12;
      ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.textAlign='left'; ctx.fillText('긴 문서 ('+NS+' 문장)', ox, oy-12);
      // 문장 칸 + 청크 묶음
      var spread=[];   // 청크별 주제 분산(섞임 정도)
      for(var c=0;c<nChunks;c++){ var s0=c*size, s1=Math.min(NS,s0+size);
        var mean=0,cnt=0; for(var i=s0;i<s1;i++){ mean+=topic(i); cnt++; } mean/=cnt;
        var vary=0; for(i=s0;i<s1;i++){ var dd=topic(i)-mean; vary+=dd*dd; } vary=Math.sqrt(vary/cnt);
        spread.push(vary);
        // 청크 배경 박스
        var bx=ox+s0*cellW, bw=(s1-s0)*cellW;
        ctx.fillStyle='rgba(61,214,220,'+(0.10+0.06*(c%2)).toFixed(3)+')';
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx+1,oy,bw-2,rowH,6);ctx.fill();}else ctx.fillRect(bx+1,oy,bw-2,rowH);
        ctx.strokeStyle=CYA; ctx.lineWidth=1.4; if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx+1,oy,bw-2,rowH,6);ctx.stroke();}
        ctx.fillStyle=CYA; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('청크'+(c+1), bx+bw/2, oy+rowH+16);
      }
      // 문장 칸(주제색)
      for(i=0;i<NS;i++){ var tp=topic(i), px=ox+i*cellW;
        ctx.fillStyle='hsl('+(tp*280|0)+',55%,55%)';
        ctx.fillRect(px+2, oy+rowH*0.25, cellW-4, rowH*0.5);
      }
      // 트레이드오프 패널(실측 평균 분산)
      var avgVary=0; for(c=0;c<spread.length;c++) avgVary+=spread[c]; avgVary/=spread.length;
      var px2=W*0.12, py2=H*0.56;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.textAlign='left'; ctx.fillText('청크 크기 트레이드오프', px2, py2);
      ctx.fillStyle=CYA; ctx.font='14px sans-serif'; ctx.fillText('청크 수: '+nChunks+'개  ·  청크당 '+size+'문장', px2, py2+28);
      // 주제 섞임(작을수록 한 주제로 또렷) = 검색 정밀도
      ctx.fillStyle=GLD; ctx.font='14px sans-serif';
      ctx.fillText('주제 섞임도(평균): '+avgVary.toFixed(3), px2, py2+52);
      // 막대: 정밀도 vs 맥락
      function gauge(x,y,label,val,col){ ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.textAlign='left'; ctx.fillText(label, x, y-6);
        ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(x, y, W*0.24, 12);
        ctx.fillStyle=col; ctx.fillRect(x, y, W*0.24*Math.max(0.04,Math.min(1,val)), 12); }
      var precision = 1 - Math.min(1, avgVary*2.2);      // 작은 청크 = 한 주제 = 높은 정밀도
      var context   = Math.min(1, size/8);               // 큰 청크 = 풍부한 맥락
      gauge(px2, py2+86, '검색 정밀도 (작은 청크 유리)', precision, GRN);
      gauge(px2+W*0.34, py2+86, '맥락 풍부함 (큰 청크 유리)', context, BLU);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='left';
      ctx.fillText('너무 작으면 맥락이 끊기고, 너무 크면 한 청크에 여러 주제가 섞여', px2, py2+128);
      ctx.fillText('검색이 부정확해집니다. 보통 겹침(overlap)을 두어 절충합니다.', px2, py2+148);
      E.tapHint(W/2, H*0.95, '청크 크기를 바꿔 정밀도↔맥락 트레이드오프를 보세요', true);
      E.big('청킹 · 인덱싱 — 문서를 조각내 색인', '책 한 권을 통째로 임베딩하면 의미가 뭉개집니다. 그래서 긴 문서를 <b>청크(조각)</b>로 쪼개 각각 임베딩·색인합니다. 청크가 <b>작으면</b> 한 주제로 또렷해 검색이 정밀하지만 맥락이 끊기고, <b>크면</b> 맥락은 풍부하나 여러 주제가 섞여 검색이 흐려집니다 — 화면의 섞임도는 실제 분산 계산값입니다. 보통 청크끼리 살짝 겹쳐(overlap) 절충합니다.'); }
  },

  // ══════════ 5. RAG vs 파인튜닝 — 언제 무엇을 ══════════
  { id:'ai14_05',
    enter:function(E){ var self=this; this.s={step:0,auto:false};
      E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*40,0.06); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      var rows=[
        {k:'최신/변하는 지식', rag:'강함 — 문서만 갱신', ft:'약함 — 재학습 필요'},
        {k:'출처·인용 표시',    rag:'가능 — 검색 근거 제시', ft:'어려움 — 어디서 왔는지 불명'},
        {k:'말투·스타일 내재화', rag:'약함 — 프롬프트 의존', ft:'강함 — 가중치에 각인'},
        {k:'새 능력/형식 학습',  rag:'약함', ft:'강함 — 예시로 능력 습득'},
        {k:'비용·운영',         rag:'문서 인덱싱(저렴·즉시)', ft:'GPU 재학습(비싸·느림)'}
      ];
      var lx=W*0.10, cx1=W*0.40, cx2=W*0.70, top=H*0.20, rh=H*0.115;
      // 헤더
      ctx.font='600 16px sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#dfeef0'; ctx.fillText('기준', lx+W*0.12, top-14);
      ctx.fillStyle=CYA; ctx.fillText('RAG (검색 증강)', cx1+W*0.12, top-14);
      ctx.fillStyle=GLD; ctx.fillText('파인튜닝 (미세조정)', cx2+W*0.12, top-14);
      for(var i=0;i<rows.length;i++){ var yy=top+i*rh, on=(i<=s.step), r=rows[i];
        ctx.globalAlpha=on?1:0.28;
        // 구분선
        ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(lx,yy+rh-8); ctx.lineTo(W*0.90,yy+rh-8); ctx.stroke();
        ctx.textAlign='left';
        ctx.fillStyle='#dfeef0'; ctx.font='600 14px sans-serif'; ctx.fillText(r.k, lx, yy+rh*0.5);
        // RAG/FT 어느 쪽이 강한지 강조
        var ragStrong=/강함|가능|저렴/.test(r.rag), ftStrong=/강함|습득/.test(r.ft);
        ctx.fillStyle=ragStrong?GRN:'#cfe6e8'; ctx.font=(ragStrong?'600 ':'')+'13px sans-serif'; ctx.fillText(r.rag, cx1, yy+rh*0.5);
        ctx.fillStyle=ftStrong?GLD:'#cfe6e8'; ctx.font=(ftStrong?'600 ':'')+'13px sans-serif'; ctx.fillText(r.ft, cx2, yy+rh*0.5);
        ctx.globalAlpha=1;
      }
      // 결론
      if(s.step>=4){
        ctx.fillStyle=PNK; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText('정리: 무엇을 아는가(지식) → RAG · 어떻게 말하나(능력·스타일) → 파인튜닝 · 둘은 함께 쓸 수 있음', W/2, top+rows.length*rh+18);
      }
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 비교 항목', true);
      E.big('RAG vs 파인튜닝 — 언제 무엇을', '둘은 경쟁이 아니라 역할이 다릅니다. <b>RAG</b>는 모델 밖 문서를 그때그때 검색해 <b>최신 지식·출처</b>를 줍니다 — 문서만 갈아끼우면 끝. <b>파인튜닝</b>은 가중치를 다시 학습해 <b>말투·형식·새 능력</b>을 모델 안에 각인시킵니다. “무엇을 아는가”는 RAG로, “어떻게 행동하나”는 파인튜닝으로 — 실무에선 둘을 <b>함께</b> 씁니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
