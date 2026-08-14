#!/bin/zsh
# EduViz — 화면 겹침 자동 검사 (PC·모바일 두 폭 모두)
#
# 무엇을 하나: 로컬 서버를 띄우고, 헤드리스 크롬으로 각 페이지를 ?uicheck=1 로 열어
#              adp/uicheck.js 가 만든 보고서를 읽어 겹침·가로넘침·11px 미만 글자·화면밖 요소를 잡는다.
# 언제 쓰나:  ADP·실험실 페이지를 만들거나 고친 뒤, 커밋 전에 반드시 한 번.
# 쓰는 법:    zsh tools/ui_check.sh                (기본: adp 전 페이지)
#             zsh tools/ui_check.sh adp/index.html  (특정 페이지만)
#
# 결과: 겹침이 하나라도 있으면 종료코드 1 + 어떤 두 요소가 몇 px² 겹쳤는지 출력.
#       스크린샷은 /tmp/uicheck/ 에 저장되어 눈으로도 확인할 수 있다.

set -e
ROOT="${0:A:h:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8099
OUT=/tmp/uicheck
mkdir -p "$OUT"

if [[ ! -x "$CHROME" ]]; then echo "크롬을 찾을 수 없습니다: $CHROME"; exit 2; fi

if [[ $# -gt 0 ]]; then
  PAGES=("$@")
else
  PAGES=(adp/index.html adp/labs/0001-fuel-economy-workflow.html adp/labs/0002-anova-lab.html adp/labs/0003-real-regression-problem.html)
fi

cd "$ROOT"
python3 -m http.server $PORT >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1

FAIL=0
for page in $PAGES; do
  for size in "1280,900:PC" "390,844:모바일"; do
    dim="${size%%:*}"; label="${size##*:}"
    tag="$(echo "$page" | tr '/.' '__')_${label}"
    dom="$OUT/$tag.html"
    "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
      --window-size="$dim" --virtual-time-budget=6000 \
      --screenshot="$OUT/$tag.png" --dump-dom \
      "http://localhost:$PORT/$page?uicheck=1" > "$dom" 2>/dev/null || true

    if grep -q "UICHECK OK" "$dom"; then
      echo "✅ $label  $page"
    elif grep -q "UICHECK FAIL" "$dom"; then
      echo "❌ $label  $page"
      python3 - "$dom" <<'PY'
import sys, re, json, io
h = io.open(sys.argv[1], encoding='utf-8', errors='replace').read()
m = re.search(r'UICHECK FAIL \d+\n(\{.*?\})</pre>', h, re.S)
if not m:
    print('   (보고서를 읽지 못했습니다)'); raise SystemExit
r = json.loads(m.group(1).replace('&quot;','"').replace('&amp;','&').replace('&lt;','<').replace('&gt;','>'))
for o in r['overlaps'][:12]:
    print('   겹침 %spx²: %s  ↔  %s' % (o['area'], o['a'], o['b']))
if r.get('overflowX'):
    print('   가로 넘침: 내용 %spx > 화면 %spx' % (r['overflowX']['scrollWidth'], r['overflowX']['viewport']))
for t in r['tinyFont'][:8]:
    print('   작은 글자 %.1fpx: %s' % (t['px'], t['el']))
for s in r['offscreen'][:8]:
    print('   화면 밖: %s (left %s, right %s)' % (s['el'], s['left'], s['right']))
PY
      FAIL=1
    else
      echo "⚠️  $label  $page — 검사기가 실행되지 않았습니다(스크립트 연결 확인)"
      FAIL=1
    fi
  done
done

echo "스크린샷: $OUT"
exit $FAIL
