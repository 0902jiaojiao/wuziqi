#!/bin/bash

# 🚀 五子棋小程序生产环境部署脚本

echo "========================================="
echo "🎮 五子棋小程序生产环境部署开始"
echo "========================================="

# 检查Python版本
python3 --version || {
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
}

# 检查pip
pip3 --version || {
    echo "❌ pip3 未安装，请先安装pip3"
    exit 1
}

echo "✅ Python环境检查通过"

# 创建必要目录
echo "📁 创建目录结构..."
sudo mkdir -p /var/log/gomoku
sudo mkdir -p /var/www/gomoku
sudo chown $USER:$USER /var/log/gomoku
sudo chown $USER:$USER /var/www/gomoku

# 复制文件到生产目录
echo "📋 复制应用文件..."
cp -r . /var/www/gomoku/
cd /var/www/gomoku

# 安装依赖
echo "📦 安装Python依赖..."
pip3 install -r requirements.txt
pip3 install gunicorn

# 设置环境变量
echo "🔧 配置环境变量..."
export FLASK_ENV=production
export SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "gunicorn.*miniprogram" 2>/dev/null || echo "没有发现运行中的服务"

# 启动生产服务
echo "🚀 启动生产服务..."
nohup gunicorn \
    --workers 4 \
    --bind 0.0.0.0:5000 \
    --timeout 30 \
    --keep-alive 5 \
    --max-requests 1000 \
    --preload \
    --log-level info \
    --access-logfile /var/log/gomoku/access.log \
    --error-logfile /var/log/gomoku/error.log \
    miniprogram:app > /var/log/gomoku/gunicorn.log 2>&1 &

# 等待服务启动
sleep 3

# 检查服务状态
if pgrep -f "gunicorn.*miniprogram" > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 服务地址: http://localhost:5000"
    echo "📝 日志位置: /var/log/gomoku/"
else
    echo "❌ 服务启动失败！"
    echo "请检查日志: /var/log/gomoku/error.log"
    exit 1
fi

# 测试服务
echo "🧪 测试服务健康状态..."
response=$(curl -s -w "%{http_code}" http://localhost:5000/api/health -o /dev/null)

if [ "$response" = "200" ]; then
    echo "✅ 服务健康检查通过！"
else
    echo "⚠️ 服务健康检查失败，状态码: $response"
fi

echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo "📊 服务信息:"
echo "   - 进程ID: $(pgrep -f 'gunicorn.*miniprogram')"
echo "   - 端口: 5000"
echo "   - 工作进程: 4个"
echo "   - 日志目录: /var/log/gomoku/"
echo ""
echo "🔧 管理命令:"
echo "   启动: $0"
echo "   停止: pkill -f 'gunicorn.*miniprogram'"
echo "   重启: pkill -f 'gunicorn.*miniprogram' && $0"
echo "   日志: tail -f /var/log/gomoku/error.log"
echo ""
echo "📋 下一步:"
echo "1. 配置Nginx反向代理（推荐）"
echo "2. 设置SSL证书"
echo "3. 配置防火墙规则"
echo "4. 更新微信小程序域名配置"
echo "========================================="