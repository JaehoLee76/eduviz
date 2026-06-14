/* 알고리즘 제3장 정렬 — 3.1 기초정렬(버블·선택·삽입) · 3.2 병합 · 3.3 퀵
   동작(behavior)만. 텍스트는 content/algo3.json. AV 사용. 모두 tap으로 한 단계씩 실행. */
(function(){
  function barsHL(E, a, colorOf){ AV.bars(E, a, { baseY:E.H*0.64, maxH:E.H*0.40, label:true, bw:46, gap:10, hl:colorOf }); }

  var scenes=[

  // ══════════ 3.1a 버블 정렬 ══════════
  { id:'algo3_01',
    enter:function(E){ this.s={a:[5,2,8,1,9,3],i:0,j:0,done:false,swapped:false}; E.setOn([]); },
    tap:function(E){ var s=this.s, a=s.a, n=a.length; if(s.done){ this.enter(E); return; }
      if(a[s.j]>a[s.j+1]){ var t=a[s.j]; a[s.j]=a[s.j+1]; a[s.j+1]=t; s.swapped=true; E.blip(420,0.1);} else { s.swapped=false; E.blip(560,0.08);}
      s.j++; if(s.j>=n-1-s.i){ s.j=0; s.i++; if(s.i>=n-1) s.done=true; } },
    draw:function(E){ var s=this.s, a=s.a, n=a.length;
      barsHL(E, a, function(k){ if(s.done) return '#8fe3b5'; if(k>=n-s.i) return '#8fe3b5'; if(k===s.j||k===s.j+1) return '#ffb27a'; return '#7ab8ff'; });
      E.tapHint(E.W/2, E.H*0.74, s.done?'↻ 다시':'▶ 인접 비교·교환', true);
      E.big(s.done?'정렬 완료!':('비교: '+a[s.j]+' ↔ '+a[s.j+1]), '버블 정렬 — 이웃끼리 비교해 큰 값을 뒤로 "거품처럼" 밀어요. 한 바퀴마다 최댓값 확정. O(n²)'); }
  },

  // ══════════ 3.1b 선택 정렬 ══════════
  { id:'algo3_02',
    enter:function(E){ this.s={a:[5,2,8,1,9,3],i:0,j:1,min:0,done:false}; E.setOn([]); },
    tap:function(E){ var s=this.s, a=s.a, n=a.length; if(s.done){ this.enter(E); return; }
      if(s.j<n){ if(a[s.j]<a[s.min]) s.min=s.j; s.j++; E.blip(520,0.08); }
      if(s.j>=n){ var t=a[s.i]; a[s.i]=a[s.min]; a[s.min]=t; E.blip(420,0.1); s.i++; s.min=s.i; s.j=s.i+1; if(s.i>=n-1) s.done=true; } },
    draw:function(E){ var s=this.s, a=s.a, n=a.length;
      barsHL(E, a, function(k){ if(s.done||k<s.i) return '#8fe3b5'; if(k===s.min) return '#ffb27a'; if(k===s.j) return '#f4a0c0'; return '#7ab8ff'; });
      E.tapHint(E.W/2, E.H*0.74, s.done?'↻ 다시':'▶ 최솟값 찾기', true);
      E.big(s.done?'정렬 완료!':('현재 최소: '+a[s.min]+' (앞으로 보낼 후보)'), '선택 정렬 — 남은 것 중 최솟값을 찾아 맨 앞에 배치. 교환 횟수가 적음(O(n)). 비교는 O(n²)'); }
  },

  // ══════════ 3.1c 삽입 정렬 ══════════
  { id:'algo3_03',
    enter:function(E){ this.s={a:[5,2,8,1,9,3],i:1,j:1,done:false}; E.setOn([]); },
    tap:function(E){ var s=this.s, a=s.a, n=a.length; if(s.done){ this.enter(E); return; }
      if(s.j>0 && a[s.j-1]>a[s.j]){ var t=a[s.j]; a[s.j]=a[s.j-1]; a[s.j-1]=t; s.j--; E.blip(420,0.1);} else { s.i++; s.j=s.i; E.blip(560,0.08); if(s.i>=n) s.done=true; } },
    draw:function(E){ var s=this.s, a=s.a;
      barsHL(E, a, function(k){ if(s.done) return '#8fe3b5'; if(k<s.i && k!==s.j) return '#8fe3b5'; if(k===s.j) return '#ffb27a'; return '#7ab8ff'; });
      E.tapHint(E.W/2, E.H*0.74, s.done?'↻ 다시':'▶ 제자리에 끼워넣기', true);
      E.big(s.done?'정렬 완료!':('정렬된 앞부분에 '+a[s.j]+' 삽입 중'), '삽입 정렬 — 카드 정리처럼 하나씩 꺼내 앞쪽 정렬된 곳의 제자리에 끼워요. 거의 정렬된 데이터엔 빠름(O(n))'); }
  },

  // ══════════ 3.2 병합 정렬 — 분할정복 ══════════
  { id:'algo3_04',
    enter:function(E){ this.s={L:[2,5,8],R:[1,3,9],li:0,ri:0,out:[],done:false}; E.setOn([]); },
    tap:function(E){ var s=this.s; if(s.done){ this.enter(E); return; }
      if(s.li<s.L.length && (s.ri>=s.R.length || s.L[s.li]<=s.R[s.ri])){ s.out.push(s.L[s.li++]); } else if(s.ri<s.R.length){ s.out.push(s.R[s.ri++]); }
      if(s.li>=s.L.length && s.ri>=s.R.length) s.done=true; E.blip(500,0.1); },
    draw:function(E){ var s=this.s, ctx=E.ctx;
      // 두 정렬된 반쪽
      AV.arr(E, s.L, { cx:E.W*0.30, y:E.H*0.26, bw:50, hl:function(i){ return i===s.li&&!s.done?{fill:'rgba(255,178,122,0.3)',stroke:'#ffb27a',text:'#ffb27a',tag:'L'}:(i<s.li?{fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}:null); } });
      AV.arr(E, s.R, { cx:E.W*0.70, y:E.H*0.26, bw:50, hl:function(i){ return i===s.ri&&!s.done?{fill:'rgba(143,227,181,0.3)',stroke:'#8fe3b5',text:'#8fe3b5',tag:'R'}:(i<s.ri?{fill:'rgba(255,255,255,0.04)',stroke:'rgba(255,255,255,0.2)',text:'#6f6e7a'}:null); } });
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText('정렬된 왼쪽', E.W*0.30, E.H*0.22); ctx.fillText('정렬된 오른쪽', E.W*0.70, E.H*0.22);
      // 결과
      if(s.out.length) AV.arr(E, s.out, { cx:E.W/2, y:E.H*0.50, bw:50, hl:function(){ return {fill:'rgba(122,184,255,0.22)',stroke:'#7ab8ff',text:'#dfeefb'}; } });
      ctx.fillStyle='#ffb27a'; ctx.font='13px sans-serif'; ctx.fillText('병합 결과 (작은 것부터)', E.W/2, E.H*0.46);
      E.tapHint(E.W/2, E.H*0.62, s.done?'↻ 다시':'▶ 두 앞을 비교해 작은 것 가져오기', true);
      E.big(s.done?'병합 완료!':'두 정렬된 줄의 앞을 비교 → 작은 것을 결과로', '병합 정렬 — 반으로 쪼개 각각 정렬한 뒤 합쳐요(분할정복). 분할 log n층 × 병합 n = O(n log n)! (1장 O(log n) 회수)'); }
  },

  // ══════════ 3.3 퀵 정렬 — 피벗 분할 ══════════
  { id:'algo3_05',
    enter:function(E){ this.s={a:[3,7,1,8,2,5],i:0,j:0,done:false,pivot:5}; this.s.pivot=this.s.a[this.s.a.length-1]; E.setOn([]); },
    tap:function(E){ var s=this.s, a=s.a, n=a.length, p=a[n-1]; if(s.done){ this.enter(E); return; }
      if(s.j<n-1){ if(a[s.j]<p){ var t=a[s.i]; a[s.i]=a[s.j]; a[s.j]=t; s.i++; E.blip(420,0.1);} else E.blip(540,0.08); s.j++; }
      else { var t2=a[s.i]; a[s.i]=a[n-1]; a[n-1]=t2; s.done=true; E.blip(640,0.12); } },
    draw:function(E){ var s=this.s, a=s.a, n=a.length, p=a[n-1];
      barsHL(E, a, function(k){ if(k===n-1) return '#f4a0c0'; if(s.done&&k===s.i) return '#f4a0c0'; if(k===s.j&&!s.done) return '#ffb27a'; if(k<s.i) return '#8fe3b5'; return '#7ab8ff'; });
      E.tapHint(E.W/2, E.H*0.74, s.done?'↻ 다시':'▶ 피벗보다 작으면 왼쪽으로', true);
      E.big(s.done?('피벗 '+p+' 제자리! 왼쪽=작은값, 오른쪽=큰값'):('피벗 = '+p+' 와 비교'), '퀵 정렬 — 피벗(분홍)을 기준으로 작은 값은 왼쪽, 큰 값은 오른쪽으로 분할. 평균 O(n log n), 실전 최강 속도'); }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
