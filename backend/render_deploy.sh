#!/bin/bash

echo "🚀 Render免费部署一键配置脚本"
echo "========================================"

# 检查是否已安装git
if ! command -v git &> /dev/null; then
    echo "❌ 错误：请先安装Git"
    exit 1
fi

echo "✅ 1. 检查部署文件..."

# 检查必需文件
files=("miniprogram.py" "requirements.txt" "render.yaml" "build.sh")
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file 已存在"
    else
        echo "   ❌ $file 缺失"
        exit 1
    fi
done

echo ""
echo "✅ 2. 添加并提交文件到Git..."
git add .
git commit -m "🚀 添加Render部署配置

- 添加render.yaml配置文件
- 添加build.sh构建脚本  
- 添加start_render.py启动脚本
- 更新部署文档，推荐Render免费部署"

echo ""
echo "✅ 3. 推送到GitHub..."
git push origin main

echo ""
echo "🎉 准备完成！现在请按照以下步骤在Render部署："
echo ""
echo "📋 Render部署步骤："
echo "1. 访问 https://render.com/"
echo "2. 使用GitHub账号注册/登录"
echo "3. 点击 'New' → 'Web Service'"
echo "4. 选择你的仓库：0902jiaojiao/wuziqi"
echo "5. 配置设置："
echo "   - Name: wuziqi-ai-game"
echo "   - Environment: Python 3"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: gunicorn --bind 0.0.0.0:\$PORT miniprogram:app"
echo "6. 选择 Free Plan"
echo "7. 点击 'Create Web Service'"
echo ""
echo "⏱️  部署需要2-3分钟，完成后你会获得免费域名："
echo "🌐 https://你的应用名.onrender.com"
echo ""
echo "🔄 获得域名后，记得更新小程序的serverUrl配置！"