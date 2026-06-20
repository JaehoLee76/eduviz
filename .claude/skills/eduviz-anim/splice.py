#!/usr/bin/env python3
"""EduViz 분기 애니메이션 splice 도구.
/tmp/scene_algo_br_<id>.txt 의 완성 장면을 js/content_algo_br.js 에 끼워넣는다.
- 첫 줄 들여쓰기 normalize, 끝 빈줄 제거
- 같은 id가 여러 블록(교차배치 중복)이면 모든 occurrence 치환, 각자의 branchOf 보존
- 백업 후 node --check, 실패 시 자동 복원
사용:  python3 splice.py <id_without_prefix> [<id> ...]
  예:  python3 splice.py kmp zfunc manacher
"""
import re, os, sys, subprocess, shutil

ROOT = '/Users/quantcommander/EduViz'
PATH = os.path.join(ROOT, 'js/content_algo_br.js')

def main(argv):
    ids = argv[1:]
    if not ids:
        print('usage: python3 splice.py <id> [<id> ...]'); return 1
    os.chdir(ROOT)
    bak = '/tmp/algo_br_backup.js'
    shutil.copy(PATH, bak)

    # normalize each scene file
    for sid in ids:
        f = '/tmp/scene_algo_br_%s.txt' % sid
        if not os.path.exists(f):
            print('MISSING', sid); continue
        L = open(f, encoding='utf-8').read().split('\n')
        L[0] = '  ' + L[0].lstrip()
        while L and L[-1].strip() == '':
            L.pop()
        open(f, 'w', encoding='utf-8').write('\n'.join(L))

    lines = open(PATH, encoding='utf-8').read().split('\n')

    def all_blocks(fid):
        res = []
        for i, l in enumerate(lines):
            if re.match(r"^  \{ id:'" + re.escape(fid) + r"'", l):
                for j in range(i + 1, len(lines)):
                    if lines[j] == '  },':
                        res.append((i, j)); break
        return res

    edits = []   # (start, end, newtext)
    for sid in ids:
        fid = 'algo_br_' + sid
        fp = '/tmp/scene_%s.txt' % fid
        if not os.path.exists(fp):
            continue
        new = open(fp, encoding='utf-8').read().rstrip('\n')
        if not new.rstrip().endswith('},'):
            print('SKIP no-comma', fid); continue
        blocks = all_blocks(fid)
        if not blocks:
            print('NO BLOCK in file', fid); continue
        for (s, e) in blocks:
            orig_bo = re.search(r"branchOf:'([a-z0-9_]+)'", lines[s])
            nl = new.split('\n')
            if orig_bo:
                nl[0] = re.sub(r"branchOf:'[a-z0-9_]+'",
                               "branchOf:'%s'" % orig_bo.group(1), nl[0])
            edits.append((s, e, '\n'.join(nl)))

    edits.sort(key=lambda x: -x[0])   # bottom-to-top
    for s, e, txt in edits:
        lines[s:e + 1] = txt.split('\n')
    open(PATH, 'w', encoding='utf-8').write('\n'.join(lines))
    print('block replacements:', len(edits), 'for', len(ids), 'ids')

    r = subprocess.run(['node', '--check', PATH], capture_output=True, text=True)
    if r.returncode == 0:
        print('NODE_CHECK_OK')
        return 0
    print('NODE_CHECK_FAIL — reverting\n', r.stderr[:400])
    shutil.copy(bak, PATH)
    return 2

if __name__ == '__main__':
    sys.exit(main(sys.argv))
