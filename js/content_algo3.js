/* 알고리즘 제3장 정렬 — VIZ 포맷(코드 + 애니메이션 + 단계 컨트롤)
   각 장면: code[](오른쪽 코드 패널) + build(V)→frames(시뮬레이션) + draw(V, frame)(현재 프레임 렌더).
   frame = {line:현재코드줄, cap:설명, a:배열스냅샷, ...강조상태}. 텍스트(title/narr/more)는 content/algo3.json. */
(function(){
  var BLU='#7ab8ff', ORA='#ffb27a', GRN='#8fe3b5', PNK='#f4a0c0';
  function bars(V, a, hl){ AV.bars(V, a, { baseY:V.H*0.70, maxH:V.H*0.46, label:true,
    bw:Math.min(58,(V.W*0.66)/a.length), gap:12, hl:hl }); }

  var scenes=[

  // ══════════ 3.1a 버블 정렬 ══════════
  { id:'algo3_01',
    code:[
      'void bubbleSort(int a[], int n) {',
      '  for (int i = 0; i < n-1; i++) {',
      '    for (int j = 0; j < n-1-i; j++) {',
      '      if (a[j] > a[j+1]) {',
      '        swap(a[j], a[j+1]);',
      '      }',
      '    }',
      '  }',
      '}'
    ],
    build:function(V){ var a=[5,2,8,1,9,3], n=a.length, st=[];
      st.push({line:0, cap:'배열을 오름차순 정렬합니다: <b>['+a.join(', ')+']</b>', a:a.slice(), sorted:n});
      for(var i=0;i<n-1;i++){
        st.push({line:1, cap:(i+1)+'번째 바퀴 시작 — 가장 큰 값을 뒤로 밀어냅니다.', a:a.slice(), sorted:n-i});
        for(var j=0;j<n-1-i;j++){
          st.push({line:3, cap:'비교: a['+j+']=<b>'+a[j]+'</b> 와 a['+(j+1)+']=<b>'+a[j+1]+'</b>', a:a.slice(), cmp:[j,j+1], sorted:n-i});
          if(a[j]>a[j+1]){ var t=a[j]; a[j]=a[j+1]; a[j+1]=t;
            st.push({line:4, cap:a[j+1]+' > '+a[j]+' 이므로 <b>교환</b> → ['+a.join(', ')+']', a:a.slice(), swap:[j,j+1], sorted:n-i}); }
        }
        st.push({line:1, cap:'한 바퀴 끝 — <b>'+a[n-1-i]+'</b> 이(가) 뒷자리에 확정됐습니다.', a:a.slice(), sorted:n-1-i});
      }
      st.push({line:8, cap:'<b>정렬 완료!</b> ['+a.join(', ')+'] — 비교 횟수가 많아 O(n²).', a:a.slice(), sorted:0, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; bars(V, f.a, function(k){ if(f.done)return GRN; if(f.sorted!=null&&k>=f.sorted)return GRN;
      if(f.swap&&(k===f.swap[0]||k===f.swap[1]))return PNK; if(f.cmp&&(k===f.cmp[0]||k===f.cmp[1]))return ORA; return BLU; }); }
  },

  // ══════════ 3.1b 선택 정렬 ══════════
  { id:'algo3_02',
    code:[
      'void selectionSort(int a[], int n) {',
      '  for (int i = 0; i < n-1; i++) {',
      '    int min = i;',
      '    for (int j = i+1; j < n; j++) {',
      '      if (a[j] < a[min])',
      '        min = j;',
      '    }',
      '    swap(a[i], a[min]);',
      '  }',
      '}'
    ],
    build:function(V){ var a=[5,2,8,1,9,3], n=a.length, st=[];
      st.push({line:0, cap:'남은 부분에서 <b>최솟값</b>을 찾아 맨 앞에 놓기를 반복합니다.', a:a.slice(), sortedTo:0});
      for(var i=0;i<n-1;i++){
        var min=i;
        st.push({line:2, cap:'최솟값 후보를 a['+i+']=<b>'+a[i]+'</b> 로 두고 시작.', a:a.slice(), cur:i, min:min, sortedTo:i});
        for(var j=i+1;j<n;j++){
          st.push({line:4, cap:'비교: a['+j+']=<b>'+a[j]+'</b> < 현재 최소 '+a[min]+' ?', a:a.slice(), cur:i, min:min, scan:j, sortedTo:i});
          if(a[j]<a[min]){ min=j;
            st.push({line:5, cap:'더 작습니다 → 최솟값 후보를 a['+j+']=<b>'+a[j]+'</b> 로 갱신.', a:a.slice(), cur:i, min:min, scan:j, sortedTo:i}); }
        }
        var t=a[i]; a[i]=a[min]; a[min]=t;
        st.push({line:7, cap:'최솟값 <b>'+a[i]+'</b> 을 '+i+'번 자리로 교환 → 앞부분 확정.', a:a.slice(), swap:[i,min], sortedTo:i+1});
      }
      st.push({line:9, cap:'<b>정렬 완료!</b> 교환은 적지만(O(n)) 비교는 O(n²).', a:a.slice(), sortedTo:n, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; bars(V, f.a, function(k){ if(f.done)return GRN; if(f.sortedTo!=null&&k<f.sortedTo)return GRN;
      if(f.swap&&(k===f.swap[0]||k===f.swap[1]))return PNK; if(k===f.min)return ORA; if(k===f.scan)return PNK; return BLU; }); }
  },

  // ══════════ 3.1c 삽입 정렬 ══════════
  { id:'algo3_03',
    code:[
      'void insertionSort(int a[], int n) {',
      '  for (int i = 1; i < n; i++) {',
      '    int key = a[i], j = i-1;',
      '    while (j >= 0 && a[j] > key) {',
      '      a[j+1] = a[j];',
      '      j--;',
      '    }',
      '    a[j+1] = key;',
      '  }',
      '}'
    ],
    build:function(V){ var a=[5,2,8,1,9,3], n=a.length, st=[];
      st.push({line:0, cap:'카드 정리처럼 하나씩 꺼내 <b>앞쪽 정렬된 곳</b>의 제자리에 끼웁니다.', a:a.slice(), sortedTo:1});
      for(var i=1;i<n;i++){
        var key=a[i], j=i-1;
        st.push({line:2, cap:'꺼낸 값 key=<b>'+key+'</b> (a['+i+']) 을 앞쪽에 끼울 차례.', a:a.slice(), key:i, sortedTo:i});
        while(j>=0 && a[j]>key){
          st.push({line:3, cap:'a['+j+']=<b>'+a[j]+'</b> > key '+key+' → 한 칸 오른쪽으로 밀기.', a:a.slice(), cmp:j, keyVal:key, hole:j+1, sortedTo:i});
          a[j+1]=a[j]; j--;
        }
        a[j+1]=key;
        st.push({line:7, cap:'제자리 발견 → key <b>'+key+'</b> 을 '+(j+1)+'번에 삽입. ['+a.join(', ')+']', a:a.slice(), placed:j+1, sortedTo:i+1});
      }
      st.push({line:9, cap:'<b>정렬 완료!</b> 거의 정렬된 데이터엔 매우 빠름(O(n)).', a:a.slice(), sortedTo:n, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; bars(V, f.a, function(k){ if(f.done)return GRN;
      if(k===f.placed)return PNK; if(f.sortedTo!=null&&k<f.sortedTo&&k!==f.key)return GRN;
      if(k===f.key)return PNK; if(k===f.cmp)return ORA; return BLU; }); }
  },

  // ══════════ 3.2 병합 정렬 — 분할정복 (merge 단계) ══════════
  { id:'algo3_04',
    code:[
      'void merge(int L[], int R[], int out[]) {',
      '  int li = 0, ri = 0, k = 0;',
      '  while (li < L.len && ri < R.len) {',
      '    if (L[li] <= R[ri])',
      '      out[k++] = L[li++];',
      '    else',
      '      out[k++] = R[ri++];',
      '  }',
      '  // 남은 원소 복사',
      '}'
    ],
    build:function(V){ var L=[2,5,8], R=[1,3,9], li=0, ri=0, out=[], st=[];
      st.push({line:0, cap:'<b>이미 정렬된</b> 두 줄 L, R 을 하나로 병합합니다.', L:L.slice(), R:R.slice(), out:[], li:0, ri:0});
      while(li<L.length && ri<R.length){
        st.push({line:2, cap:'두 앞을 비교: L['+li+']=<b>'+L[li]+'</b> vs R['+ri+']=<b>'+R[ri]+'</b>', L:L.slice(), R:R.slice(), out:out.slice(), li:li, ri:ri, cmp:true});
        if(L[li]<=R[ri]){ out.push(L[li]); st.push({line:4, cap:L[li]+' ≤ '+R[ri]+' → 왼쪽 <b>'+L[li]+'</b> 을 결과로.', L:L.slice(), R:R.slice(), out:out.slice(), li:li, ri:ri, took:'L'}); li++; }
        else { out.push(R[ri]); st.push({line:6, cap:R[ri]+' < '+L[li]+' → 오른쪽 <b>'+R[ri]+'</b> 을 결과로.', L:L.slice(), R:R.slice(), out:out.slice(), li:li, ri:ri, took:'R'}); ri++; }
      }
      while(li<L.length){ out.push(L[li++]); }
      while(ri<R.length){ out.push(R[ri++]); }
      st.push({line:8, cap:'<b>병합 완료!</b> ['+out.join(', ')+'] — 분할 log n층 × 병합 n = O(n log n).', L:L.slice(), R:R.slice(), out:out.slice(), li:L.length, ri:R.length, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      ctx.fillStyle='#6f6e7a'; ctx.font='13px sans-serif'; ctx.textAlign='center';
      ctx.fillText('정렬된 왼쪽 L', V.W*0.28, V.H*0.16); ctx.fillText('정렬된 오른쪽 R', V.W*0.72, V.H*0.16);
      AV.arr(V, f.L, { cx:V.W*0.28, y:V.H*0.20, bw:48, hl:function(i){ return (i===f.li&&!f.done)?{fill:'rgba(255,178,122,0.3)',stroke:ORA,text:ORA,tag:'▲'}:(i<f.li?{fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.18)',text:'#5a5f6b'}:null); } });
      AV.arr(V, f.R, { cx:V.W*0.72, y:V.H*0.20, bw:48, hl:function(i){ return (i===f.ri&&!f.done)?{fill:'rgba(143,227,181,0.3)',stroke:GRN,text:GRN,tag:'▲'}:(i<f.ri?{fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.18)',text:'#5a5f6b'}:null); } });
      ctx.fillStyle=ORA; ctx.font='13px sans-serif'; ctx.fillText('병합 결과 (작은 것부터)', V.W/2, V.H*0.52);
      if(f.out.length) AV.arr(V, f.out, { cx:V.W/2, y:V.H*0.56, bw:48, hl:function(i){ return (i===f.out.length-1&&(f.took))?{fill:'rgba(244,160,192,0.25)',stroke:PNK,text:PNK}:{fill:'rgba(122,184,255,0.2)',stroke:BLU,text:'#dfeefb'}; } }); }
  },

  // ══════════ 3.3 퀵 정렬 — 피벗 분할(Lomuto) ══════════
  { id:'algo3_05',
    code:[
      'int partition(int a[], int lo, int hi) {',
      '  int pivot = a[hi];',
      '  int i = lo;',
      '  for (int j = lo; j < hi; j++) {',
      '    if (a[j] < pivot) {',
      '      swap(a[i], a[j]); i++;',
      '    }',
      '  }',
      '  swap(a[i], a[hi]);',
      '  return i;',
      '}'
    ],
    build:function(V){ var a=[3,7,1,8,2,5], n=a.length, hi=n-1, pivot=a[hi], i=0, st=[];
      st.push({line:1, cap:'맨 끝 값을 <b>피벗</b>으로: pivot=<b>'+pivot+'</b> (분홍).', a:a.slice(), pivot:hi, i:i});
      st.push({line:2, cap:'경계 i='+i+' — 이 왼쪽엔 피벗보다 작은 값만 모읍니다.', a:a.slice(), pivot:hi, i:i, bound:i});
      for(var j=0;j<hi;j++){
        st.push({line:4, cap:'비교: a['+j+']=<b>'+a[j]+'</b> < 피벗 '+pivot+' ?', a:a.slice(), pivot:hi, i:i, scan:j, bound:i});
        if(a[j]<pivot){ var t=a[i]; a[i]=a[j]; a[j]=t;
          st.push({line:5, cap:'작음 → a['+i+']↔a['+j+'] 교환 후 경계 i를 '+(i+1)+'로.', a:a.slice(), pivot:hi, i:i, swap:[i,j], scan:j}); i++; }
      }
      var t2=a[i]; a[i]=a[hi]; a[hi]=t2;
      st.push({line:8, cap:'피벗을 경계 i='+i+' 자리로 → <b>피벗이 제자리</b>! 왼쪽<피벗<오른쪽.', a:a.slice(), pivotFinal:i, swap:[i,hi]});
      st.push({line:9, cap:'<b>분할 완료.</b> 양쪽을 재귀로 같은 방식 정렬 → 평균 O(n log n), 실전 최강.', a:a.slice(), pivotFinal:i, done:true});
      return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx;
      bars(V, f.a, function(k){ if(k===f.pivot)return PNK; if(k===f.pivotFinal)return GRN;
        if(f.swap&&(k===f.swap[0]||k===f.swap[1]))return PNK; if(k===f.scan)return ORA;
        if(f.bound!=null&&k<f.bound)return GRN; return BLU; });
      if(f.bound!=null&&!f.done){ var bx=AV; ctx.fillStyle=GRN; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('← 피벗보다 작은 영역', V.W*0.5, V.H*0.80); } }
  }

  ];
  if(window.Engine) window.Engine.addScenes(scenes);
})();
