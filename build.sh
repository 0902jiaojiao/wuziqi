#!/usr/bin/env bash
# build.sh - Render Build Script

set -o errexit  # exit on error

echo "🚀 开始Render构建过程..."

# 安装Python依赖
echo "📦 安装Python依赖..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ 构建完成！"