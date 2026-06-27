/* 알고리즘 제2장 자료구조 — 2.1 배열 · 2.2 연결리스트 · 2.3 스택·큐 · 2.4 해시
   동작(behavior)만. 텍스트는 content/algo2.json. AV(algo_helpers.js) 사용. */
(function(){
  var TAU=Math.PI*2;

  var scenes=[

  // ══════════ 2.1 배열 — 인덱스 접근 O(1) ══════════
  { id:'algo2_01', concept:true,
    enter:function(E){ this.s={i:2}; E.setOn([]); this.A=[42,17,8,99,23,4];
      E.controls('<div class="ctrl"><label>인덱스 i 접근</label><input type="range" id="ix" min="0" max="5" step="1" value="2"><output id="ixo">2</output></div>');
      var self=this; E.bind('#ix','input',function(e){ self.s.i=+e.target.value; document.getElementById('ixo').textContent=e.target.value; E.blip(440,0.08); }); },
    draw:function(E){ var s=this.s, ctx=E.ctx;
      var g=AV.arr(E, this.A, { y:E.H*0.40, idx:true, hl:function(i){ return i===s.i?{fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'arr['+i+']'}:null; } });
      // 메모리 주소 표시
      ctx.fillStyle='#6f6e7a'; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='center';
      for(var i=0;i<this.A.length;i++){ var b=g.boxes[i]; ctx.fillText('100'+(i*4), b.cx, g.y+g.bw+34); }
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('주소 = 시작(1000) + '+s.i+'×4 = 100'+(s.i*4)+' → 즉시 도착!', E.W/2, E.H*0.62);
      E.big('arr['+s.i+'] = '+this.A[s.i]+'  (O(1) 접근)', '배열 — 값들이 메모리에 연속 저장. 주소를 계산해 바로 점프 → 어느 칸이든 똑같이 빠름(O(1))'); }
  },

  // ══════════ 2.2 연결 리스트 — 포인터로 잇기 ══════════
  { id:'algo2_02', concept:true,
    enter:function(E){ this.s={cur:0,play:false}; E.setOn([]); this.A=[7,3,9,5]; },
    tap:function(E){ var s=this.s; if(s.cur>=this.A.length-1) s.cur=0; else s.cur++; E.blip(480+s.cur*40,0.1); },
    draw:function(E){ var s=this.s, ctx=E.ctx, n=this.A.length, y=E.H*0.42, bw=78, gap=46, total=n*(bw+gap)-gap, x0=E.W/2-total/2;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), on=(i===s.cur);
        // 노드: [값 | next]
        ctx.fillStyle=on?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,46,8);ctx.fill();ctx.stroke();}else{ctx.fillRect(x,y,bw,46);ctx.strokeRect(x,y,bw,46);}
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(x+bw*0.6,y); ctx.lineTo(x+bw*0.6,y+46); ctx.stroke();
        ctx.fillStyle=on?'#ffb27a':'#dfeefb'; ctx.font='600 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(this.A[i], x+bw*0.3, y+23);
        ctx.fillStyle='#6f6e7a'; ctx.font='11px sans-serif'; ctx.fillText('next', x+bw*0.8, y+23); ctx.textBaseline='alphabetic';
        ctx.fillStyle=on?'#ffb27a':'#6f6e7a'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('node['+i+']', x+bw/2, y+46+18);
        if(on) AV.pointer(E, x+bw*0.3, y-14, 'cur', '#ffb27a');
        // 포인터 화살표
        if(i<n-1) AV.arrow(ctx, x+bw+4, y+23, x+bw+gap-4, y+23, '#8fe3b5', 2);
        else { ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='left'; ctx.fillText('null', x+bw+10, y+27); }
      }
      E.tapHint(E.W/2, E.H*0.60, '▶ 다음 노드로 (포인터 따라가기)', true);
      E.big(s.cur+1+'번째 노드 도달 ('+(s.cur+1)+'단계)', '연결 리스트 — 노드(값+다음 주소)를 화살표로 연결. i번째 접근은 처음부터 따라가야 함(O(n)). 대신 삽입·삭제는 O(1)'); }
  },

  // ══════════ 2.3 스택 — LIFO ══════════
  { id:'algo2_03', concept:true,
    enter:function(E){ this.s={stack:[3,7]}; E.setOn([]); this.cnt=8; },
    keys:[
      {code:'KeyE', key:'E', label:'쌓기 (push)', act:function(E){ var s=this.s; if(s.stack.length<6){ s.stack.push(this.cnt++); E.blip(560,0.1);} }},
      {code:'KeyC', key:'C', label:'꺼내기 (pop)', act:function(E){ var s=this.s; if(s.stack.length) s.stack.pop(); E.blip(300,0.12); }} ],
    tap:function(E,x,y){ var s=this.s; if(y && y>E.H*0.7){ if(s.stack.length) s.stack.pop(); E.blip(300,0.12); } else { if(s.stack.length<6){ s.stack.push(this.cnt++); E.blip(560,0.1);} } },
    draw:function(E){ var s=this.s, ctx=E.ctx, bw=120, bh=42, cx=E.W/2, baseY=E.H*0.62;
      for(var i=0;i<s.stack.length;i++){ var y=baseY-i*(bh+4), top=(i===s.stack.length-1);
        ctx.fillStyle=top?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.14)'; ctx.strokeStyle=top?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(cx-bw/2,y-bh,bw,bh,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(cx-bw/2,y-bh,bw,bh);
        ctx.fillStyle=top?'#ffb27a':'#dfeefb'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.stack[i], cx, y-bh/2); ctx.textBaseline='alphabetic';
        if(top) AV.pointer(E, cx+bw/2+18, y-bh-2, 'top', '#ffb27a'); }
      // 바닥선
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-bw/2-8,baseY+2); ctx.lineTo(cx+bw/2+8,baseY+2); ctx.stroke();
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('▲ 위쪽 눌러 push (쌓기)', cx, E.H*0.22); ctx.fillStyle='#f4a0c0'; ctx.fillText('▼ 아래쪽 눌러 pop (꺼내기)', cx, E.H*0.74);
      E.big('스택 (Stack) — LIFO', '나중에 넣은 게 먼저 나옵니다(Last In First Out). 접시 쌓기·실행취소(Undo)·함수 호출·괄호 검사'); }
  },

  // ══════════ 2.3 큐 — FIFO ══════════
  { id:'algo2_04', concept:true,
    enter:function(E){ this.cap=7; this.s={ a:[5,2,8,null,null,null,null], f:0, r:3 }; E.setOn([]); this.cnt=9; },
    keys:[
      {code:'KeyE', key:'E', label:'넣기 (enqueue, 뒤에)', act:function(E){ var s=this.s, cap=this.cap;
        if(s.r-s.f>=cap){ E.blip(200,0.12); return; }                                           // 가득
        if(s.r>=cap){ for(var i=s.f;i<s.r;i++) s.a[i-s.f]=s.a[i]; s.r-=s.f; s.f=0; for(var j=s.r;j<cap;j++) s.a[j]=null; }  // 오른쪽 끝 도달 → 앞으로 당김(컴팩트)
        s.a[s.r]=this.cnt++; s.r++; E.blip(560,0.1); }},
      {code:'KeyC', key:'C', label:'빼기 (dequeue, 앞에서)', act:function(E){ var s=this.s; if(s.f<s.r){ s.a[s.f]=null; s.f++; E.blip(300,0.12); if(s.f===s.r){ s.f=0; s.r=0; } } }} ],
    tap:function(E,x){ if(x && x>E.W/2) this.keys[0].act.call(this,E); else this.keys[1].act.call(this,E); },
    draw:function(E){ var s=this.s, ctx=E.ctx, cap=this.cap, bw=Math.min(62,(E.W*0.74)/cap), gap=8, total=cap*bw+(cap-1)*gap, x0=E.W/2-total/2, y=E.H*0.42;
      ctx.textAlign='center'; ctx.fillStyle='#dfeefb'; ctx.font='600 16px sans-serif';
      ctx.fillText('큐 — 뒤(rear)로 들어와 앞(front)에서 나간다 (FIFO)', E.W/2, E.H*0.16);
      ctx.fillStyle='#8a8893'; ctx.font='13px sans-serif';
      ctx.fillText('칸은 제자리 고정. dequeue = front 칸이 빠지고 front 포인터만 → 전진 (rear는 그대로)', E.W/2, E.H*0.16+22);
      for(var i=0;i<cap;i++){ var x=x0+i*(bw+gap), active=(i>=s.f&&i<s.r), gone=(i<s.f), isFront=(i===s.f), isRear=(i===s.r-1);
        if(active){ ctx.setLineDash([]); ctx.fillStyle=isFront?'rgba(244,160,192,0.28)':isRear?'rgba(143,227,181,0.24)':'rgba(122,184,255,0.16)'; ctx.strokeStyle=isFront?'#f4a0c0':isRear?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2; }
        else { ctx.setLineDash([3,3]); ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.strokeStyle='rgba(255,255,255,0.13)'; ctx.lineWidth=1; }
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw); ctx.setLineDash([]);
        if(active){ ctx.fillStyle='#dfeefb'; ctx.font='600 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.a[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic'; }
        else if(gone){ ctx.fillStyle='#555a66'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('나감', x+bw/2, y+bw/2+4); }
        if(isFront&&active) AV.pointer(E, x+bw/2, y-14, 'front', '#f4a0c0');
        if(isRear&&active) AV.pointer(E, x+bw/2, y+bw+4, 'rear', '#8fe3b5'); }
      if(s.f>=s.r){ ctx.fillStyle='#8a8893'; ctx.font='15px sans-serif'; ctx.textAlign='center'; ctx.fillText('(비어 있음)', E.W/2, y+bw/2+5); } }
  },

  // ══════════ 2.4 해시 테이블 — O(1) 조회 ══════════
  { id:'algo2_05', concept:true,
    M:5, keyList:['cat','dog','fox','owl','bee'],
    enter:function(E){ this.s={n:1, flash:0}; E.setOn([]);
      var self=this;
      // ★단축키: E=다음 키 삽입, C=처음으로 (this.keys = 엔진 키바인딩 형식)
      this.keys=[
        {code:'KeyE', key:'E', label:'다음 키 삽입', act:function(EE){ if(self.s.n<self.keyList.length){ self.s.n++; self.s.flash=18; EE.blip(self._hash(self.keyList[self.s.n-1])%self.M ? 560:440, 0.12); } else EE.blip(220,0.08); }},
        {code:'KeyC', key:'C', label:'처음으로', act:function(EE){ self.s.n=1; self.s.flash=10; EE.blip(330,0.1); }}
      ]; },
    _hash:function(str){ var h=0; for(var i=0;i<str.length;i++) h+=str.charCodeAt(i); return h; },
    draw:function(E){ var s=this.s, ctx=E.ctx, M=this.M, self=this;
      if(s.flash>0) s.flash--;
      var cur=this.keyList[s.n-1];                       // 방금 삽입한 키
      var sum=this._hash(cur), idx=sum%M;
      // ── 왼쪽: 해시 계산 과정을 단계로 ──
      var lx=E.W*0.06;
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif'; ctx.fillText('삽입 중인 키', lx, E.H*0.20);
      // 키 글자 + 각 글자의 문자코드
      var cw=42, gy=E.H*0.26;
      for(var i=0;i<cur.length;i++){ var gx=lx+i*cw;
        ctx.fillStyle=s.flash>0?'rgba(255,178,122,0.4)':'rgba(255,178,122,0.22)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(gx,gy,cw-6,38,6);ctx.fill();ctx.stroke();}else ctx.strokeRect(gx,gy,cw-6,38);
        ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(cur[i], gx+(cw-6)/2, gy+25);
        ctx.fillStyle='#8fe3b5'; ctx.font='11px monospace'; ctx.fillText(cur.charCodeAt(i), gx+(cw-6)/2, gy+54); }
      ctx.textAlign='left'; ctx.fillStyle='#6f6e7a'; ctx.font='10px sans-serif'; ctx.fillText('각 글자의 아스키 코드', lx, gy+72);
      // 합 → %M = idx (계단식)
      ctx.fillStyle='#dfeefb'; ctx.font='600 15px monospace';
      ctx.fillText('합 = '+cur.split('').map(function(c){return c.charCodeAt(0);}).join(' + ')+' = '+sum, lx, E.H*0.50);
      ctx.fillStyle='#ffb27a'; ctx.font='600 17px monospace';
      ctx.fillText(sum+'  %  '+M+'  =  '+idx, lx, E.H*0.50+30);
      ctx.fillStyle='#8a8893'; ctx.font='12px sans-serif';
      ctx.fillText('→ 버킷 ['+idx+']에 저장', lx, E.H*0.50+54);
      // 화살표
      AV.arrow(ctx, E.W*0.40, E.H*0.45, E.W*0.50, E.H*0.45, '#8fe3b5', 2);
      // ── 오른쪽: 버킷 배열 + 체이닝 ──
      // 각 버킷에 들어간 키들(삽입순)
      var buckets=[]; for(var b=0;b<M;b++) buckets.push([]);
      for(var j=0;j<s.n;j++){ var kk=this.keyList[j]; buckets[this._hash(kk)%M].push(kk); }
      var bx=E.W*0.54, by=E.H*0.13, bw=70, bh=40, gap=8;
      for(var i=0;i<M;i++){ var y=by+i*(bh+gap), on=(i===idx);
        ctx.fillStyle=on&&s.flash>0?'rgba(255,178,122,0.28)':'rgba(122,184,255,0.10)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=on?2.5:1.6;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw,bh,6);ctx.fill();ctx.stroke();}else ctx.strokeRect(bx,y,bw,bh);
        ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText('['+i+']', bx-6, y+bh/2);
        // 체인(연결 리스트)
        var chain=buckets[i];
        for(var c=0;c<chain.length;c++){ var ex=bx+bw+14+c*86;
          if(c===0){ AV.arrow(ctx, bx+bw, y+bh/2, ex-2, y+bh/2, '#7ab8ff', 1.6); }
          else { AV.arrow(ctx, ex-86+72, y+bh/2, ex-2, y+bh/2, '#ff8d8d', 2); }
          var nf=(chain[c]===cur&&s.flash>0);
          ctx.fillStyle=nf?'rgba(255,178,122,0.35)':(c>0?'rgba(255,141,141,0.18)':'rgba(143,227,181,0.16)'); ctx.strokeStyle=c>0?'#ff8d8d':'#8fe3b5'; ctx.lineWidth=2;
          if(ctx.roundRect){ctx.beginPath();ctx.roundRect(ex,y+5,72,bh-10,6);ctx.fill();ctx.stroke();}else ctx.strokeRect(ex,y+5,72,bh-10);
          ctx.fillStyle='#dfeefb'; ctx.font='600 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('"'+chain[c]+'"', ex+36, y+bh/2); }
        if(chain.length>1){ ctx.fillStyle='#ff8d8d'; ctx.font='600 11px sans-serif'; ctx.textAlign='left'; ctx.fillText('← 충돌! 같은 칸을 사슬로 연결(체이닝)', bx+bw+14+chain.length*86-6, y+bh/2); }
      }
      ctx.textBaseline='alphabetic';
      var collided=buckets[idx].length>1;
      E.big('"'+cur+'" → 버킷 ['+idx+']'+(collided?'  ⚠충돌→체이닝':'  (O(1))'),
        '해시 테이블 — 키를 해시함수(문자코드 합 % M)로 버킷 번호로 바꿔 즉시 저장·조회(평균 O(1)). E=다음 키 삽입 / C=처음으로. fox·owl이 같은 버킷[3]에 모이는 충돌을 사슬(연결 리스트)로 해결하는 걸 직접 보세요.'); }
  },

  // ══════════ 정수론·수론 — 심화 섹션 지도 (concept) ══════════
  { id:'algo2_06', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ window.AlgoMap(E, {
      title:'정수론·수론 — 알고리즘 속 수학',
      sub:'암호·해싱·조합의 토대가 되는 수의 도구들. ↓ 심화학습에서 아래 순서대로.',
      stages:[
        {c:'#8fe3b5', t:'① 소수',        items:['에라토스테네스 체','선형 체']},
        {c:'#ffb27a', t:'② GCD·합동',    items:['이진 GCD','확장 유클리드','모듈러 역원','중국인 나머지(CRT)']},
        {c:'#f4a0c0', t:'③ 곱셈적 함수', items:['오일러 φ','뫼비우스 μ']},
        {c:'#7ab8ff', t:'④ 판정·인수분해', items:['밀러-라빈','폴라드 로']},
        {c:'#ffd9bd', t:'⑤ 고급 모듈러', items:['몽고메리 곱','르장드르 기호','토넬리-샹크스','이산 로그','RSA 암호']}
      ],
      foot:'소수를 거르고 → gcd·합동으로 나눗셈을 곱셈으로 → 곱셈적 함수로 세고 → 소수를 판정·분해해 → RSA 암호로' }); }
  },

  // ══════════ 계산기하 — 심화 섹션 지도 (concept) ══════════
  { id:'algo2_07', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ window.AlgoMap(E, {
      title:'계산기하 — 점·선·다각형의 알고리즘',
      sub:'좌표 위 도형을 다루는 도구들. ↓ 심화학습에서 아래 순서대로.',
      stages:[
        {c:'#8fe3b5', t:'① 볼록 껍질',   items:['볼록 껍질','회전 캘리퍼스']},
        {c:'#ffb27a', t:'② 선분·다각형', items:['선분 교차(CCW)','스위프라인 교차','신발끈·Pick','점-다각형 포함']},
        {c:'#f4a0c0', t:'③ 점 집합',     items:['가장 가까운 점쌍','최소 외접원','들로네·보로노이']},
        {c:'#7ab8ff', t:'④ 영역·충돌',   items:['반평면 교차','민코프스키 합','분리축(충돌)','3D 볼록껍질']},
        {c:'#ffd9bd', t:'⑤ 공간 색인',   items:['k-d 트리','사분 트리']}
      ],
      foot:'껍질로 외곽을 잡고 → 선분·다각형의 기본 질의 → 점 집합의 구조 → 볼록 영역·충돌 → 공간을 색인' }); }
  },

  // ══════════ 고급 자료구조 — 심화 섹션 지도 (concept) ══════════
  { id:'algo2_08', concept:true,
    enter:function(E){ this.s={}; E.setOn([]); },
    draw:function(E){ window.AlgoMap(E, {
      title:'고급 자료구조 — 구간 질의의 도구',
      sub:'배열 위 구간을 빠르게 묻고 고치는 구조들. ↓ 심화학습에서 아래 순서대로.',
      stages:[
        {c:'#8fe3b5', t:'① 전처리',   items:['좌표 압축','희소 테이블']},
        {c:'#ffb27a', t:'② 펜윅(BIT)', items:['펜윅 트리','펜윅 구간 갱신','2D 펜윅']},
        {c:'#f4a0c0', t:'③ 세그먼트 트리', items:['세그먼트 트리','Lazy 전파','세그 빔즈','2D 세그','머지소트 트리']},
        {c:'#7ab8ff', t:'④ 영속·웨이블릿', items:['영속 세그','웨이블릿 트리','웨이블릿 행렬']},
        {c:'#ffd9bd', t:'⑤ 비트',     items:['비트셋 가속','비트 트릭']}
      ],
      foot:'좌표를 줄이고 → BIT로 누적합 → 세그트리로 구간 질의·갱신 → 영속·웨이블릿으로 확장 → 비트로 가속' }); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
