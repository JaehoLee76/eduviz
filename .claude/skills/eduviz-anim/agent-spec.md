# EduViz 분기 애니메이션 전환 — 에이전트 작업 규범

정적 `concept:true` 장면을 `code+build+draw` 코드동기 애니메이션으로 전환한다. 작업폴더 **/Users/quantcommander/EduViz**(cd 먼저). 각 담당 id를 `/tmp/scene_<id>.txt`에 쓴다. 엔진이 단계마다 `code[f.line]`을 자동 하이라이트한다.

## 1단계 — 골드 예제 정독 (배포 검증된 본보기)
```bash
cd /Users/quantcommander/EduViz && python3 - <<'PY'
import re; js=open('js/content_algo_br.js',encoding='utf-8').read()
for sid in ['algo_br_huffman','algo_br_nqueens','algo_br_gauss','algo_br_bellman','algo_br_mst']:
    m=re.search(r"\{ id:'"+sid+r"'",js); e=js.find('\n  },',m.start()); print(js[m.start():e+4]); print('\n----\n')
PY
```
huffman=트리병합+우선순위큐칩 / nqueens=백트래킹 보드 / gauss=행렬 실연산 / bellman=가중그래프+거리표(gedge) / mst=그래프+유니온파인드.

## 2단계 — 담당 id의 도메인 콘텐츠 확보 (알고리즘·impl을 충실히 반영)
```bash
python3 - <<'PY'
import json; d=json.load(open('content/algo_br.json',encoding='utf-8'))
for sid in [ <YOUR_IDS_QUOTED> ]:
    print('=====',sid,'====='); print(json.dumps(d.get(sid,{}),ensure_ascii=False,indent=1))
PY
```
각 id의 현재 블록을 `js/content_algo_br.js`에서 grep해 `id`/`branchOf`를 그대로 복사.

## 장면 형식 (huffman과 동일)
```
  { id:'<동일 id>', branchOf:'<동일 branchOf>',
    code:[ '<의사코드 줄0>', '<줄1>', ... ],
    build:function(V){ var st=[]; function snap(line,cap,extra){ var f={line:line,cap:cap}; if(extra)for(var k in extra)f[k]=extra[k]; st.push(f); } /* 알고리즘 실제 실행하며 단계마다 snap */ return st; },
    draw:function(V,f){ if(!f)return; var ctx=V.ctx,W=V.W,H=V.H; /* f 상태 렌더 */ } },
```

## 절대 규칙 (위반 시 사이트 전체 깨짐)
1. 파일은 정확히 두 칸 들여쓰기 `  { id:'...'` 로 시작, **마지막 줄이 정확히 `  },`**(두칸·중괄호·쉼표). 뒤에 빈 줄 금지.
2. 모든 `line`은 `code` 인덱스(정수/정수배열), 범위 밖 절대 금지.
3. 각 프레임이 draw에 필요한 모든 상태(위치/값 배열)를 담는다. draw는 **`f`에서만** 읽음(build 종료 후 변하는 클로저 변수 참조 금지).
4. draw는 `if(!f)return;`로 시작. `V.ctx/V.W/V.H` 사용. textAlign/textBaseline 변경 후 복구.
5. 10~24 단계. 각 단계=의미있는 한 동작 + 존댓말 한국어 캡션(`<b>` 허용). 반말 금지.
6. `concept:true` 포함 금지. `title/narr/more/impl/problem` 재정의 금지(JSON에서 id로 자동 머지).
7. 색상: `#ffb27a`활성 `#8fe3b5`완료 `#7ab8ff`중립 `#f4a0c0`특수/스왑 `#dfeefb`텍스트 `#9b99a3`흐림.
8. 같은 파일 스코프 헬퍼 사용 가능: `gedge(E,a,b,col,w,wt)`·`uedge(...)`(a/b=[x,y] 픽셀), `drawTreeB(E,arr,hlFn,opts)`, `AV.node(E,x,y,val,{r,fill,stroke,text,tag,fs})`, `AV.arrow(ctx,x1,y1,x2,y2,col,w)`.
9. 작은 고정 예제(n≈4~8, 하드코딩)로 가독·결정적. **`Math.random()`/`Date.now()` 금지**(난수는 고정 배열로 사전계산).
10. 골든룰(절대): build() 안에서 알고리즘이 **실제로 정확히 동작**해야 한다. 표시되는 모든 수/위치는 진짜 계산값. 가짜·손대충 금지.

## 3단계 — 각 파일 구문검증
```bash
for sid in <YOUR_IDS_SPACE_SEP>; do printf 'var AV={node:function(){},arrow:function(){}};var drawTreeB=function(){},gedge=function(){},uedge=function(){};var _=[' > /tmp/chk_$sid.js; cat /tmp/scene_$sid.txt >> /tmp/chk_$sid.js; printf '\n];\n' >> /tmp/chk_$sid.js; node --check /tmp/chk_$sid.js && echo "$sid OK" || echo "$sid FAIL"; done
```
전부 OK여야 함. FAIL 원인 대부분: 끝 `  },` 누락, 따옴표 미이스케이프, line 범위초과.

## 출력
각 장면을 `/tmp/scene_<id>.txt`에 쓴다. `js/content_algo_br.js`는 절대 수정하지 않음(메인이 splice). OK 목록 + 각 애니메이션 한 줄 설명 보고.
