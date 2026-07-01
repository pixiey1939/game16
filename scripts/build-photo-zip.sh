#!/usr/bin/env bash
# 构建相册 zip 文件（部署前运行）
# 从 asset/photo/ 和 asset/secretphoto/ 下的原图生成 zip
# zip 为构建产物，不入 git（见 .gitignore）
set -e

cd "$(dirname "$0")/.."

build_zip() {
  local src="$1"
  local dst="$2"

  if [ ! -d "$src" ]; then
    echo "✗ 找不到 $src 目录" >&2
    return 1
  fi

  rm -f "$dst"

  find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -print0 \
    | xargs -0 zip -0 -q -X "$dst"

  local count
  count=$(find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) | wc -l | tr -d ' ')
  echo "✓ 已生成 $dst（含 $count 张图片）"
}

build_zip asset/photo asset/photo.zip
echo ""
build_zip asset/secretphoto asset/secretphoto/secret_photos.zip
