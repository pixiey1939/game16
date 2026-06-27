#!/usr/bin/env bash
# 打包相册原图为 asset/photo.zip（部署前运行）
# zip 为生成产物，不入 git（见 .gitignore），由本脚本从 asset/photo/ 下原图生成
set -euo pipefail

# 切到项目根目录（本脚本位于 scripts/ 下）
cd "$(dirname "$0")/.."

if [ ! -d asset/photo ]; then
  echo "✗ 找不到 asset/photo 目录" >&2
  exit 1
fi

# 用 find 统计图片，避免 glob 无匹配时 pipefail 触发退出
count=$(find asset/photo -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) | wc -l | tr -d ' ')
if [ "$count" -eq 0 ]; then
  echo "✗ asset/photo 下没有 jpg 图片" >&2
  exit 1
fi

# jpg 已压缩，用 -0 (store) 模式；-X 排除 macOS 资源 fork / __MACOSX 噪声
# 内部路径保持 photo/<file>.jpg，与原 zip 一致
rm -f asset/photo.zip
cd asset
find photo -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -print0 \
  | xargs -0 zip -0 -q -X photo.zip

echo "✓ 已生成 asset/photo.zip ($(du -h photo.zip | cut -f1)，含 $count 张图片)"
