#!/usr/bin/env python3
"""학습자–교사 토론 전 기계 훑기. 사용: python3 sweep.py <html 또는 json 파일...>
뽑는 것: 1) 본문 속 소수·퍼센트 리터럴(하드코딩 후보) 2) §N·편 번호 참조(실존 대조용)
3) 인용 밖 '-다.' 반말 끝맺음 4) 괄호 영어 병기로 처음 정의된 용어 목록(정의 전 등장 대조용).
코드(<pre>·<script>·<style>)는 제외. 판정은 사람/Advisor 가 한다 — 후보 목록일 뿐."""
import re, sys, json, collections

def body_text(path):
    s = open(path, encoding='utf-8').read()
    if path.endswith('.json'):
        try:
            d = json.loads(s)
            out = []
            def walk(o):
                if isinstance(o, dict):
                    for k, v in o.items():
                        if k in ('title', 'narr', 'more', 'problem', 'sec', 'hint') and isinstance(v, str): out.append(v)
                        else: walk(v)
                elif isinstance(o, list):
                    for v in o: walk(v)
            walk(d); s = '\n'.join(out)
        except Exception:
            pass
    s = re.sub(r'<(script|style|pre)\b.*?</\1>', ' ', s, flags=re.S)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'&[a-z]+;', ' ', s)
    return re.sub(r'[ \t]+', ' ', s)

for p in sys.argv[1:]:
    t = body_text(p)
    nums = collections.Counter(re.findall(r'(?<![\w.])\d+\.\d+%?|(?<![\w.])\d+%', t))
    refs = collections.Counter(re.findall(r'§\s?\d+|(?<![\d.])0\d{3}(?![\d.])|#\d+', t))
    banmal = [m.group(0) for m in re.finditer(r'[가-힣]{1,6}다\.(?=\s|$)', t) if not m.group(0).endswith(('니다.', '습니다.'))]
    terms = re.findall(r'([가-힣A-Za-z·\- ]{2,20})\s?\(([A-Za-z][A-Za-z \-]{2,40})\)', t)
    print(f'=== {p}')
    print('숫자 리터럴(빈도):', ', '.join(f'{k}×{v}' for k, v in nums.most_common(40)) or '없음')
    print('참조:', ', '.join(f'{k}×{v}' for k, v in sorted(refs.items())) or '없음')
    print('반말 끝맺음 후보:', banmal[:15] or '없음')
    seen = []
    for ko, en in terms:
        ko = ko.strip()
        if ko not in seen: seen.append(ko)
    print('영어 병기 정의 순서:', ' / '.join(seen[:40]) or '없음')
    for ko in seen:
        first_def = t.find(ko + ' (') if (ko + ' (') in t else t.find(ko + '(')
        first_use = t.find(ko)
        if 0 <= first_use < first_def:
            print(f'  정의 전 등장 후보: 「{ko}」 (처음 등장 {first_use}자, 정의 {first_def}자)')
