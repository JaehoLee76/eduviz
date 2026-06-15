#!/bin/bash
# EduViz → GitHub Pages 배포. 사령관님이 'gh auth login' 한 번 한 뒤 실행.
set -e
cd "$(dirname "$0")"
REPO="${1:-eduviz}"   # 저장소 이름(기본 eduviz). 다른 이름 원하면: ./deploy.sh 원하는이름

echo "1) GitHub 인증 확인..."
gh auth status >/dev/null 2>&1 || { echo "먼저 'gh auth login' 을 실행해 GitHub에 로그인하세요."; exit 1; }

USER=$(gh api user -q .login)
echo "   사용자: $USER"

echo "2) 저장소 생성 + push (public)..."
gh repo create "$REPO" --public --source=. --remote=origin --push

echo "3) GitHub Pages 활성화 (main 브랜치 루트)..."
gh api -X POST "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || gh api -X PUT "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || echo "   (Pages는 저장소 Settings→Pages에서 main/root로 켜도 됩니다)"

echo ""
echo "✅ 완료! 1~2분 후 접속:"
echo "   https://$USER.github.io/$REPO/home.html"
