#!/bin/bash
# 五子棋微信小程序部署脚本

echo "=== 五子棋微信小程序部署脚本 ==="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: Python3 未安装"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装Python依赖包..."
pip install -r requirements.txt

# 设置环境变量
export FLASK_ENV=production
export SECRET_KEY=$(openssl rand -base64 32)

echo "=== 部署完成 ==="
echo "启动服务器请运行: source venv/bin/activate && python run.py"
echo "或使用Gunicorn: source venv/bin/activate && gunicorn -w 4 -b 0.0.0.0:5000 miniprogram:app"