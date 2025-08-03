#!/bin/bash

echo "🆓 五子棋小程序免费部署脚本"
echo "=================================="

# 检查Git是否已初始化
if [ ! -d ".git" ]; then
    echo "📦 初始化Git仓库..."
    git init
    git branch -M main
else
    echo "✅ Git仓库已存在"
fi

# 检查是否有远程仓库
if ! git remote | grep -q "origin"; then
    echo "⚠️  请先在GitHub创建仓库，然后运行："
    echo "   git remote add origin https://github.com/yourusername/yourrepo.git"
    echo ""
    read -p "是否已创建GitHub仓库并想继续？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请先创建GitHub仓库后再运行此脚本"
        exit 1
    fi
fi

echo "🔧 检查部署配置文件..."

# 检查必要文件
files_created=0

if [ ! -f "Procfile" ]; then
    echo "web: gunicorn --bind 0.0.0.0:\$PORT miniprogram:app" > Procfile
    echo "✅ 创建 Procfile"
    files_created=$((files_created + 1))
fi

if [ ! -f "railway.json" ]; then
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
    echo "✅ 创建 railway.json"
    files_created=$((files_created + 1))
fi

# 检查requirements.txt中是否有gunicorn
if ! grep -q "gunicorn" requirements.txt; then
    echo "gunicorn==21.2.0" >> requirements.txt
    echo "✅ 添加 gunicorn 到 requirements.txt"
    files_created=$((files_created + 1))
fi

# 创建.gitignore（如果不存在）
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
.DS_Store
EOF
    echo "✅ 创建 .gitignore"
    files_created=$((files_created + 1))
fi

if [ $files_created -gt 0 ]; then
    echo "📝 已创建 $files_created 个配置文件"
fi

echo ""
echo "🚀 提交代码到GitHub..."

# 添加所有文件
git add .

# 检查是否有更改需要提交
if git diff --staged --quiet; then
    echo "📋 没有新的更改需要提交"
else
    # 提交更改
    git commit -m "添加免费部署配置文件

- 添加Procfile用于Railway部署
- 添加railway.json配置
- 更新requirements.txt包含gunicorn
- 支持PORT环境变量
- 准备免费云平台部署"

    echo "✅ 代码已提交"
fi

# 推送到GitHub
echo "📤 推送到GitHub..."
if git push origin main; then
    echo "✅ 代码已推送到GitHub"
else
    echo "❌ 推送失败，请检查GitHub仓库配置"
    echo "运行: git remote -v 查看远程仓库配置"
    exit 1
fi

echo ""
echo "🎉 准备完成！现在可以进行免费部署："
echo ""
echo "┌─ Railway部署（推荐）─────────────────┐"
echo "│ 1. 访问 https://railway.app/        │"
echo "│ 2. 用GitHub账号登录                  │"
echo "│ 3. 点击 'New Project'                │"
echo "│ 4. 选择 'Deploy from GitHub repo'    │"
echo "│ 5. 选择你的仓库                       │"
echo "│ 6. 等待自动部署完成！                 │"
echo "└────────────────────────────────────┘"
echo ""
echo "┌─ 其他免费选项──────────────────────┐"
echo "│ • Vercel: https://vercel.com/       │"
echo "│ • Render: https://render.com/       │"
echo "│ • Netlify: https://netlify.com/     │"
echo "└────────────────────────────────────┘"
echo ""
echo "📱 部署完成后："
echo "1. 获取你的免费域名（如：yourapp.railway.app）"
echo "2. 更新微信小程序中的serverUrl"
echo "3. 在微信公众平台配置域名"
echo "4. 发布你的小程序！"
echo ""
echo "💡 提示：Railway提供每月500小时免费额度，完全够用！"