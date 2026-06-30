/* 인공지능 제15장 — 에이전트 AI: 도구 사용 · ReAct · 계획·실행 · 멀티 에이전트 · 도구 연결(MCP)
   동작(behavior)만. 텍스트=content/ai15.json. 엔진 js/engine.js 공유. 색: AI=시안.
   골든룰: 화면의 계산값(23×47 등)·작업 진행률·메시지 수·검증 통과수는 전부 draw()에서 실계산.
   에이전트 루프는 탭 단계 애니로 인터랙티브하게(난수·하드코딩 금지). */
(function(){
  var CYA='#3dd6dc', BLU='#7ab8ff', GLD='#ffd27a', GRN='#7ee0b0', PNK='#f4a0c0', DIM='#9b99a3', RED='#f0888a';

  // 둥근 박스 헬퍼
  function rbox(ctx,x,y,w,h,col,fill){ ctx.strokeStyle=col; ctx.lineWidth=1.8;
    ctx.fillStyle=fill||'rgba(255,255,255,0.04)';
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,10); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h); } }
  // 화살표
  function arrow(ctx,x1,y1,x2,y2,col){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.fillStyle=col;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var a=Math.atan2(y2-y1,x2-x1); ctx.beginPath();
    ctx.moveTo(x2,y2); ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4));
    ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4)); ctx.closePath(); ctx.fill(); }

  var scenes = [

  // ══════════ 1. 도구 사용(Tool Use) — 23×47=? ══════════
  { id:'ai15_01',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(360+this.s.step*60,0.08); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 골든룰: 곱은 실제로 계산
      var A=23, B=47, PROD=A*B;                       // 1081
      var GUESS=1100;                                 // LLM이 패턴으로 '대충' 낸 그럴듯한 오답(고정)
      var steps=[
        {who:'사용자', col:GLD, txt:'"'+A+' × '+B+' = ?"', sub:'정확한 답이 필요한 질문'},
        {who:'LLM(혼자)', col:RED, txt:'음… 대략 '+GUESS+'?', sub:'언어 패턴으로 추측 → 자릿수 계산은 자주 틀림'},
        {who:'LLM', col:CYA, txt:'tool_call: calc("'+A+'*'+B+'")', sub:'스스로 못 하는 일은 외부 도구에 넘긴다'},
        {who:'계산기(도구)', col:GRN, txt:'결과 = '+PROD, sub:'정확히 실행 → 관측(Observation)'},
        {who:'LLM', col:GRN, txt:'"답은 '+PROD+'입니다."', sub:'도구 결과를 받아 최종 답 작성'}
      ];
      ctx.textAlign='left';
      var x0=W*0.12, y0=H*0.20, rw=W*0.50, rh=H*0.105, gap=H*0.025;
      for(var i=0;i<steps.length;i++){ var on=(i<=s.step), o=steps[i], yy=y0+i*(rh+gap);
        ctx.globalAlpha=on?1:0.22;
        rbox(ctx,x0,yy,rw,rh,o.col, i===s.step?'rgba(61,214,220,0.08)':'rgba(255,255,255,0.03)');
        ctx.fillStyle=o.col; ctx.font='600 13px sans-serif'; ctx.fillText(o.who, x0+14, yy+22);
        ctx.fillStyle='#eef6f7'; ctx.font='600 16px sans-serif'; ctx.fillText(o.txt, x0+14, yy+46);
        ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText(o.sub, x0+14, yy+68);
        if(on && i<steps.length-1) arrow(ctx, x0+rw*0.5, yy+rh, x0+rw*0.5, yy+rh+gap, 'rgba(61,214,220,0.6)');
        ctx.globalAlpha=1; }
      // 우측 비교 패널 — 실측으로 정오 표시
      var px=W*0.68, py=H*0.24;
      ctx.fillStyle='#dfeef0'; ctx.font='600 15px sans-serif'; ctx.fillText('정답 검산', px, py);
      ctx.fillStyle=DIM; ctx.font='13px sans-serif';
      ctx.fillText(A+' × '+B+' = '+PROD, px, py+28);
      var err=Math.abs(GUESS-PROD);
      ctx.fillStyle=RED; ctx.fillText('혼자 추측 '+GUESS+' → '+err+' 만큼 틀림', px, py+52);
      ctx.fillStyle=GRN; ctx.fillText('도구 호출 '+PROD+' → 오차 0', px, py+76);
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
      ctx.fillText('LLM은 ‘그럴듯한 말’엔 강해도', px, py+108);
      ctx.fillText('정확한 산수·최신 정보엔 약합니다.', px, py+128);
      ctx.fillText('→ 약점은 도구에게 맡기는 게 에이전트.', px, py+148);
      E.tapHint(W/2, H*0.95, '화면 탭 = 다음 (질문→추측→도구호출→관측→답)', true);
      E.big('도구 사용(Tool Use) — 모르면 연장을 든다',
        'LLM 혼자서는 큰 수의 곱셈이나 오늘 날씨처럼 ‘정확한 사실’을 자주 틀립니다 — 말의 패턴으로 추측하니까요. 똑똑한 사람이 암산 대신 계산기를 집어 들듯, 에이전트는 자기 약점을 알고 <b>외부 도구</b>(계산기·검색·코드 실행)를 호출해 정확한 결과를 받아옵니다. 화면의 '+ (23*47) +'은 실제로 계산한 값이고, 추측값과의 오차도 실측입니다.'); }
  },

  // ══════════ 2. ReAct — Thought → Action → Observation 루프 ══════════
  { id:'ai15_02',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; E.blip(340+this.s.step*40,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 문제: "에펠탑 높이(330 m)의 2배는 몇 m?" — 도구로 검색→계산, 실측
      var H_EIFFEL=330, ANS=H_EIFFEL*2;               // 660
      var log=[
        {k:'Thought',  col:GLD, t:'에펠탑 높이를 모른다 → 먼저 찾아보자.'},
        {k:'Action',   col:CYA, t:'search("에펠탑 높이")'},
        {k:'Observation', col:GRN, t:'관측: 약 '+H_EIFFEL+' m'},
        {k:'Thought',  col:GLD, t:'이제 2배만 곱하면 된다.'},
        {k:'Action',   col:CYA, t:'calc("'+H_EIFFEL+' * 2")'},
        {k:'Observation', col:GRN, t:'관측: '+ANS},
        {k:'Answer',   col:PNK, t:'최종 답: '+ANS+' m'}
      ];
      // 좌측: 단계 로그
      ctx.textAlign='left'; var x0=W*0.10, y0=H*0.18, rw=W*0.50, rh=H*0.085, gap=H*0.018;
      for(var i=0;i<log.length;i++){ var on=(i<=s.step), o=log[i], yy=y0+i*(rh+gap);
        ctx.globalAlpha=on?1:0.20;
        rbox(ctx,x0,yy,rw,rh,o.col, i===s.step?'rgba(61,214,220,0.08)':'rgba(255,255,255,0.03)');
        ctx.fillStyle=o.col; ctx.font='600 12px sans-serif'; ctx.fillText(o.k, x0+14, yy+20);
        ctx.fillStyle='#eef6f7'; ctx.font='15px sans-serif'; ctx.fillText(o.t, x0+14, yy+44);
        ctx.globalAlpha=1; }
      // 우측: 순환 다이어그램 — 현재 단계 강조
      var cx=W*0.80, cy=H*0.42, R=Math.min(W*0.13,H*0.20);
      var nodes=[ {a:-Math.PI/2, c:GLD, t:'생각'}, {a:-Math.PI/2+2.094, c:CYA, t:'행동'}, {a:-Math.PI/2+4.188, c:GRN, t:'관측'} ];
      // 현재 단계가 셋 중 어느 노드인지(생각/행동/관측 순환)
      var phaseMap=[0,1,2,0,1,2,0]; var cur=phaseMap[s.step];
      for(i=0;i<3;i++){ var nx=cx+Math.cos(nodes[i].a)*R, ny=cy+Math.sin(nodes[i].a)*R, hl=(i===cur && s.step<6);
        // 화살표(다음 노드로)
        var j=(i+1)%3, jx=cx+Math.cos(nodes[j].a)*R, jy=cy+Math.sin(nodes[j].a)*R;
        var mx=(nx+jx)/2, my=(ny+jy)/2;
        arrow(ctx, nx+(jx-nx)*0.28, ny+(jy-ny)*0.28, nx+(jx-nx)*0.72, ny+(jy-ny)*0.72, 'rgba(122,184,255,0.45)');
        ctx.beginPath(); ctx.arc(nx,ny,hl?30:24,0,7);
        ctx.fillStyle=hl?nodes[i].c:'rgba(255,255,255,0.05)'; ctx.fill();
        ctx.strokeStyle=nodes[i].c; ctx.lineWidth=hl?3:1.6; ctx.stroke();
        ctx.fillStyle=hl?'#0a1417':nodes[i].c; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
        ctx.fillText(nodes[i].t, nx, ny+5); }
      ctx.fillStyle=DIM; ctx.font='12.5px sans-serif'; ctx.textAlign='center';
      ctx.fillText('루프를 돌며', cx, cy+R+34);
      ctx.fillText('답에 다가간다', cx, cy+R+52);
      if(s.step>=6){ ctx.fillStyle=PNK; ctx.font='600 17px sans-serif'; ctx.fillText('답: '+ANS+' m', cx, cy+R+82); }
      E.tapHint(W/2, H*0.95, '화면 탭 = 한 스텝씩 (생각→행동→관측 반복→답)', true);
      E.big('ReAct — 추론(Reason)과 행동(Act)을 번갈아',
        'ReAct는 에이전트가 <b>생각(Thought)</b>으로 다음 할 일을 정하고, <b>행동(Action)</b>으로 도구를 부르고, <b>관측(Observation)</b>으로 결과를 받는 일을 답이 나올 때까지 반복합니다. 생각만 하면 환각에 빠지고, 행동만 하면 길을 잃죠 — 둘을 엮어야 합니다. 화면의 '+(330)+' m와 그 2배 '+(330*2)+'는 단계별로 실제 계산한 값입니다.'); }
  },

  // ══════════ 3. 계획·실행(Plan-Execute) — 작업 그래프 ══════════
  { id:'ai15_03',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%7; E.blip(320+this.s.step*45,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 목표를 6개 하위작업으로 분해. step0=계획만, step1..6=작업 순차 완료
      var tasks=[
        {t:'1. 주제 자료 수집', dep:[]},
        {t:'2. 핵심 논점 정리', dep:[0]},
        {t:'3. 데이터 분석',   dep:[0]},
        {t:'4. 초안 작성',     dep:[1,2]},
        {t:'5. 사실 검증',     dep:[3]},
        {t:'6. 최종 다듬기',   dep:[4]}
      ];
      var done=s.step;                                 // 완료된 작업 수(실측 진행률)
      // 목표 박스
      ctx.textAlign='center';
      rbox(ctx, W*0.30, H*0.07, W*0.40, H*0.075, GLD, 'rgba(255,210,122,0.10)');
      ctx.fillStyle=GLD; ctx.font='600 16px sans-serif'; ctx.fillText('목표: “보고서 한 편 완성”', W*0.50, H*0.12);
      // 작업 노드 위치(2열 그래프)
      var pos=[ [0.20,0.34],[0.20,0.56],[0.20,0.78],[0.50,0.45],[0.72,0.45],[0.86,0.66] ];
      // 의존 화살표 먼저
      for(var i=0;i<tasks.length;i++){ for(var d=0;d<tasks[i].dep.length;d++){ var p=tasks[i].dep[d];
        arrow(ctx, W*pos[p][0]+W*0.06, H*pos[p][1], W*pos[i][0]-W*0.06, H*pos[i][1], 'rgba(122,184,255,0.4)'); } }
      // 노드
      for(i=0;i<tasks.length;i++){ var bx=W*pos[i][0]-W*0.075, by=H*pos[i][1]-H*0.045, bw=W*0.15, bh=H*0.09;
        var fin=(i<done), act=(i===done && s.step>0);
        var col = fin?GRN : (act?CYA : DIM);
        rbox(ctx, bx, by, bw, bh, col, fin?'rgba(126,224,176,0.12)':(act?'rgba(61,214,220,0.10)':'rgba(255,255,255,0.03)'));
        ctx.fillStyle=col; ctx.font='600 13px sans-serif'; ctx.textAlign='center';
        ctx.fillText(tasks[i].t, W*pos[i][0], H*pos[i][1]+2);
        ctx.font='15px sans-serif';
        ctx.fillText(fin?'✓ 완료':(act?'▶ 실행 중':'… 대기'), W*pos[i][0], H*pos[i][1]+24); }
      // 진행률 막대(실측)
      var pct=Math.round(done/tasks.length*100);
      var bx2=W*0.12, by2=H*0.92, bw2=W*0.50;
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(bx2,by2,bw2,12);
      ctx.fillStyle=GRN; ctx.fillRect(bx2,by2, bw2*done/tasks.length, 12);
      ctx.fillStyle='#dfeef0'; ctx.font='600 13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('진행률 '+pct+'%  ('+done+'/'+tasks.length+' 작업)', bx2, by2-8);
      if(s.step===0){ ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.textAlign='right';
        ctx.fillText('① 먼저 전체 계획을 세운다 →', W*0.66, H*0.92); }
      E.tapHint(W/2, H*0.965, '화면 탭 = 작업을 하나씩 순차 실행', true);
      E.big('계획·실행(Plan-and-Execute) — 큰 일을 쪼갠다',
        '복잡한 목표는 한 번에 풀리지 않습니다. 먼저 <b>계획자</b>가 목표를 작은 <b>하위 작업</b>들로 쪼개고 의존 관계(무엇이 먼저인지)를 정한 뒤, <b>실행자</b>가 순서대로 처리합니다 — 마치 요리 레시피처럼요. 한 걸음씩 매 단계 결과를 확인하니, 길을 잃지 않고 큰 일도 끝까지 해냅니다. 진행률은 실제 완료 작업 수로 계산합니다.'); }
  },

  // ══════════ 4. 멀티 에이전트 — 역할 분담 협업 ══════════
  { id:'ai15_04',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%6; E.blip(330+this.s.step*50,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 세 역할 + 오케스트레이터. 메시지가 한 단계씩 흐른다.
      var agents=[
        {t:'연구원', sub:'자료를 찾는다', col:BLU,  x:0.22, y:0.30},
        {t:'검증자', sub:'사실을 확인', col:GLD,  x:0.22, y:0.70},
        {t:'작성자', sub:'글로 엮는다', col:PNK,  x:0.78, y:0.50}
      ];
      var orch={t:'오케스트레이터', col:CYA, x:0.50, y:0.50};
      // 메시지 흐름(보내는이→받는이, 내용)
      var msgs=[
        {f:'orch', to:0, t:'주제 조사해 줘', col:BLU},
        {f:0, to:'orch', t:'자료 5건 수집', col:BLU},
        {f:'orch', to:1, t:'사실 확인해 줘', col:GLD},
        {f:1, to:'orch', t:'4/5건 검증 통과', col:GLD},
        {f:'orch', to:2, t:'검증본으로 작성', col:PNK}
      ];
      function P(id){ if(id==='orch') return [W*orch.x,H*orch.y]; return [W*agents[id].x,H*agents[id].y]; }
      // 연결선(흐릿)
      for(var i=0;i<3;i++){ var p=P(i); ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(W*orch.x,H*orch.y); ctx.lineTo(p[0],p[1]); ctx.stroke(); }
      // 활성 메시지 화살표(현재 단계까지)
      ctx.textAlign='center';
      for(i=0;i<msgs.length && i<=s.step-1;i++){ var m=msgs[i], a=P(m.f), b=P(m.to);
        var act=(i===s.step-1);
        ctx.globalAlpha=act?1:0.35;
        arrow(ctx, a[0]+(b[0]-a[0])*0.18, a[1]+(b[1]-a[1])*0.18, a[0]+(b[0]-a[0])*0.82, a[1]+(b[1]-a[1])*0.82, m.col);
        if(act){ var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
          ctx.fillStyle=m.col; ctx.font='600 13px sans-serif';
          var tw=ctx.measureText(m.t).width;
          rbox(ctx, mx-tw/2-8, my-14, tw+16, 24, m.col, 'rgba(10,20,23,0.9)');
          ctx.fillStyle=m.col; ctx.fillText(m.t, mx, my+3); }
        ctx.globalAlpha=1; }
      // 오케스트레이터 노드
      ctx.beginPath(); ctx.arc(W*orch.x,H*orch.y,34,0,7); ctx.fillStyle='rgba(61,214,220,0.14)'; ctx.fill();
      ctx.strokeStyle=CYA; ctx.lineWidth=2.2; ctx.stroke();
      ctx.fillStyle=CYA; ctx.font='600 12px sans-serif'; ctx.fillText('지휘', W*orch.x, H*orch.y-2);
      ctx.font='11px sans-serif'; ctx.fillText('(조율)', W*orch.x, H*orch.y+14);
      // 역할 노드
      for(i=0;i<3;i++){ var o=agents[i], px=W*o.x, py=H*o.y, hl=(s.step>0 && (msgs[s.step-1] && (msgs[s.step-1].f===i||msgs[s.step-1].to===i)));
        ctx.beginPath(); ctx.arc(px,py,hl?34:28,0,7);
        ctx.fillStyle=hl?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)'; ctx.fill();
        ctx.strokeStyle=o.col; ctx.lineWidth=hl?3:1.8; ctx.stroke();
        ctx.fillStyle=o.col; ctx.font='600 14px sans-serif'; ctx.fillText(o.t, px, py+2);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(o.sub, px, py+(o.y<0.5?-40:46)); }
      // 진행 설명(실측: 메시지 수)
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif'; ctx.textAlign='left';
      ctx.fillText('주고받은 메시지: '+Math.max(0,s.step)+' / '+msgs.length, W*0.10, H*0.95);
      E.tapHint(W/2, H*0.92, '화면 탭 = 메시지 흐름 한 단계씩', true);
      E.big('멀티 에이전트 — 한 명이 다 하지 않는다',
        '어려운 일은 <b>역할을 나눈 팀</b>이 더 잘합니다. <b>연구원</b>이 자료를 모으고, <b>검증자</b>가 사실을 확인하고, <b>작성자</b>가 글로 엮죠 — 가운데 <b>오케스트레이터</b>가 일을 배분하고 결과를 모읍니다. 각자가 전문 도구·프롬프트를 갖고, 한 에이전트의 실수를 다른 에이전트가 잡아냅니다. 회사가 부서를 나누는 것과 같은 이치입니다.'); }
  },

  // ══════════ 5. 도구 연결(MCP)·실무 — 안전·검증 ══════════
  { id:'ai15_05',
    enter:function(E){ this.s={step:0,auto:false}; E.setOn([]); },
    tap:function(E){ this.s.step=(this.s.step+1)%5; E.blip(340+this.s.step*55,0.07); },
    draw:function(E){ var ctx=E.ctx, W=E.W, H=E.H, s=this.s;
      // 에이전트 ── (MCP) ── 외부 리소스. + 위험한 호출은 가드가 막는다(실측 통과/차단 수).
      ctx.textAlign='center';
      // 에이전트
      var ax=W*0.18, ay=H*0.45;
      rbox(ctx, ax-W*0.08, ay-H*0.06, W*0.16, H*0.12, CYA, 'rgba(61,214,220,0.10)');
      ctx.fillStyle=CYA; ctx.font='600 15px sans-serif'; ctx.fillText('에이전트', ax, ay-4);
      ctx.fillStyle=DIM; ctx.font='12px sans-serif'; ctx.fillText('(LLM)', ax, ay+16);
      // MCP 게이트(중앙)
      var gx=W*0.45, gy=H*0.45;
      rbox(ctx, gx-W*0.055, gy-H*0.20, W*0.11, H*0.40, GLD, 'rgba(255,210,122,0.06)');
      ctx.fillStyle=GLD; ctx.font='600 14px sans-serif'; ctx.fillText('MCP', gx, gy-H*0.13);
      ctx.font='11px sans-serif'; ctx.fillStyle=DIM; ctx.fillText('표준', gx, gy-H*0.13+18);
      ctx.fillText('연결규약', gx, gy-H*0.13+34);
      // 가드 표시
      ctx.fillStyle=(s.step>=3)?GRN:DIM; ctx.font='600 12px sans-serif';
      ctx.fillText('🛡 안전가드', gx, gy+H*0.14);
      // 외부 리소스들
      var res=[ {t:'파일', sub:'read/write', y:0.18, col:BLU, danger:false},
                {t:'API', sub:'외부 서비스', y:0.45, col:GRN, danger:false},
                {t:'DB', sub:'질의/수정', y:0.72, col:PNK, danger:true} ];
      for(var i=0;i<res.length;i++){ var o=res[i], rx=W*0.80, ry=H*o.y, lit=(s.step>=1 && i<=s.step-1);
        // 연결선(에이전트→MCP→리소스)
        if(i===0 && s.step>=1){ arrow(ctx, ax+W*0.08, ay, gx-W*0.055, gy, 'rgba(255,210,122,0.6)'); }
        ctx.globalAlpha=lit?1:0.30;
        if(lit) arrow(ctx, gx+W*0.055, gy, rx-W*0.06, ry, o.col);
        rbox(ctx, rx-W*0.06, ry-H*0.05, W*0.12, H*0.10, o.col, lit?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)');
        ctx.fillStyle=o.col; ctx.font='600 15px sans-serif'; ctx.fillText(o.t, rx, ry-2);
        ctx.fillStyle=DIM; ctx.font='11px sans-serif'; ctx.fillText(o.sub, rx, ry+16);
        ctx.globalAlpha=1; }
      // 마지막 단계: 위험한 DB 삭제 시도 → 가드가 차단(실측 카운트)
      var connected=Math.max(0, Math.min(3, s.step));     // 연결된 리소스 수
      var blocked=(s.step>=4)?1:0;                          // 차단된 위험 호출 수
      var allowed=connected - blocked;
      var px=W*0.10, py=H*0.86;
      ctx.textAlign='left';
      ctx.fillStyle='#dfeef0'; ctx.font='13px sans-serif';
      ctx.fillText('연결 '+connected+'/3 · 허용 '+Math.max(0,allowed)+' · 차단 '+blocked, px, py);
      if(s.step>=4){ ctx.fillStyle=RED; ctx.font='600 14px sans-serif';
        ctx.fillText('⚠ "DROP TABLE" 같은 위험 호출 → 가드가 차단', px, py+24); }
      else { ctx.fillStyle=DIM; ctx.font='12.5px sans-serif';
        ctx.fillText('실무에선 위험 명령(삭제·송금)에 사람 승인·권한 제한 필수', px, py+24); }
      E.tapHint(W/2, H*0.96, '화면 탭 = 도구를 하나씩 연결, 마지막엔 위험 호출 차단', true);
      E.big('도구 연결(MCP)과 실무 — 힘에는 안전이 따른다',
        '에이전트가 진짜 일을 하려면 <b>파일·API·데이터베이스</b>에 연결돼야 합니다. <b>MCP(Model Context Protocol)</b>는 그 연결을 위한 <b>표준 규약</b> — USB-C처럼 어떤 도구든 같은 방식으로 꽂습니다. 다만 쓰기 권한은 위험합니다: 잘못된 한 줄이 파일을 지우거나 돈을 보낼 수 있죠. 그래서 <b>권한 제한·사람 승인·결과 검증</b>이 에이전트 실무의 핵심입니다. 화면의 허용/차단 수는 실제로 센 값입니다.'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
