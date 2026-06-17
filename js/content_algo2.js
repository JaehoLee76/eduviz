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
    enter:function(E){ this.s={q:[5,2,8]}; E.setOn([]); this.cnt=9; },
    keys:[
      {code:'KeyE', key:'E', label:'넣기 (enqueue)', act:function(E){ var s=this.s; if(s.q.length<6){ s.q.push(this.cnt++); E.blip(560,0.1);} }},
      {code:'KeyC', key:'C', label:'빼기 (dequeue)', act:function(E){ var s=this.s; if(s.q.length) s.q.shift(); E.blip(300,0.12); }} ],
    tap:function(E,x){ var s=this.s; if(x && x>E.W/2){ if(s.q.length<6){ s.q.push(this.cnt++); E.blip(560,0.1);} } else { if(s.q.length) s.q.shift(); E.blip(300,0.12); } },
    draw:function(E){ var s=this.s, ctx=E.ctx, bw=64, gap=8, n=s.q.length, total=n*bw+(n-1)*gap, x0=E.W/2-total/2, y=E.H*0.44;
      for(var i=0;i<n;i++){ var x=x0+i*(bw+gap), front=(i===0), rear=(i===n-1);
        ctx.fillStyle=front?'rgba(244,160,192,0.25)':rear?'rgba(143,227,181,0.22)':'rgba(122,184,255,0.14)';
        ctx.strokeStyle=front?'#f4a0c0':rear?'#8fe3b5':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,bw,bw,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(x,y,bw,bw);
        ctx.fillStyle='#dfeefb'; ctx.font='600 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s.q[i], x+bw/2, y+bw/2); ctx.textBaseline='alphabetic';
        if(front) AV.pointer(E, x+bw/2, y-14, 'front', '#f4a0c0');
        if(rear && n>1) AV.pointer(E, x+bw/2, y+bw+4, 'rear', '#8fe3b5'); }
      ctx.fillStyle='#f4a0c0'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('◀ 왼쪽 눌러 dequeue (앞에서 빼기)', E.W*0.28, E.H*0.66);
      ctx.fillStyle='#8fe3b5'; ctx.fillText('오른쪽 눌러 enqueue (뒤에 넣기) ▶', E.W*0.72, E.H*0.66);
      E.big('큐 (Queue) — FIFO', '먼저 넣은 게 먼저 나옵니다(First In First Out). 줄 서기·프린터 대기열·그래프 BFS(곧 배웁니다)'); }
  },

  // ══════════ 2.4 해시 테이블 — O(1) 조회 ══════════
  { id:'algo2_05', concept:true,
    enter:function(E){ this.s={k:'cat'}; E.setOn([]);
      E.controls('<div class="ctrl"><label>키</label><input type="range" id="kk" min="0" max="3" step="1" value="0"><output id="kko">cat</output></div>');
      var self=this; this.keys=['cat','dog','fox','owl'];
      E.bind('#kk','input',function(e){ self.s.k=self.keys[+e.target.value]; document.getElementById('kko').textContent=self.s.k; E.blip(440,0.1); }); },
    draw:function(E){ var s=this.s, ctx=E.ctx, M=5;
      function hash(str){ var h=0; for(var i=0;i<str.length;i++) h+=str.charCodeAt(i); return h%M; }
      var idx=hash(s.k);
      // 키 박스
      ctx.fillStyle='rgba(255,178,122,0.25)'; ctx.strokeStyle='#ffb27a'; ctx.lineWidth=2;
      var kx=E.W*0.18, ky=E.H*0.40;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(kx-44,ky-22,88,44,8);ctx.fill();ctx.stroke();}else ctx.strokeRect(kx-44,ky-22,88,44);
      ctx.fillStyle='#ffb27a'; ctx.font='600 18px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('"'+s.k+'"', kx, ky); ctx.textBaseline='alphabetic';
      // 해시함수
      ctx.fillStyle='#8fe3b5'; ctx.font='13px sans-serif'; ctx.fillText('hash() % '+M, E.W*0.40, ky-6); ctx.fillText('= '+idx, E.W*0.40, ky+14);
      AV.arrow(ctx, kx+50, ky, E.W*0.40-44, ky, '#8fe3b5', 2);
      AV.arrow(ctx, E.W*0.40+44, ky, E.W*0.58, ky, '#8fe3b5', 2);
      // 버킷 배열
      var bx=E.W*0.62, by=E.H*0.22, bw=140, bh=42;
      for(var i=0;i<M;i++){ var y=by+i*(bh+6), on=(i===idx);
        ctx.fillStyle=on?'rgba(255,178,122,0.25)':'rgba(122,184,255,0.10)'; ctx.strokeStyle=on?'#ffb27a':'#7ab8ff'; ctx.lineWidth=2;
        if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,y,bw,bh,6);ctx.fill();ctx.stroke();}else ctx.strokeRect(bx,y,bw,bh);
        ctx.fillStyle='#6f6e7a'; ctx.font='12px sans-serif'; ctx.textAlign='right'; ctx.fillText('['+i+']', bx-8, y+bh/2+4);
        if(on){ ctx.fillStyle='#ffb27a'; ctx.font='600 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('"'+s.k+'"', bx+bw/2, y+bh/2); ctx.textBaseline='alphabetic'; } }
      E.big('"'+s.k+'" → 버킷 ['+idx+']  (O(1))', '해시 테이블 — 키를 해시함수로 버킷 번호로 변환해 즉시 저장·조회(평균 O(1)). 충돌 시 같은 칸에 묶습니다'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
