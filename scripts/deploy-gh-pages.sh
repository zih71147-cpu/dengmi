#!/usr/bin/env bash
# 一键发布到 GitHub Pages（gh-pages 分支）—— macOS / Linux 版本
# 用法：bash scripts/deploy-gh-pages.sh [远程地址] [分支]
set -euo pipefail

REMOTE_URL="${1:-https://github.com/zih71147-cpu/dengmi.git}"
BRANCH="${2:-gh-pages}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[1/4] 构建静态产物（npm run build）..."
npm run build

if [ ! -d "dist" ]; then
  echo "未找到 dist 目录，构建失败" >&2
  exit 1
fi

echo "[2/4] 准备发布目录..."
TMP="$(mktemp -d)"
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"

echo "[3/4] 提交到 ${BRANCH} 分支..."
cd "$TMP"
git init -b "$BRANCH" -q
git add -A
git -c user.name=deploy-bot -c user.email=deploy-bot@users.noreply.github.com commit -q -m "deploy: publish dist to gh-pages"

echo "[4/4] 推送 dist 到 ${REMOTE_URL} ..."
git push -f "$REMOTE_URL" "${BRANCH}:${BRANCH}"

cd "$ROOT"
rm -rf "$TMP"

echo "发布成功！若尚未开启 Pages：仓库 Settings → Pages → Source 选择 ${BRANCH} 分支（只需一次）。"
