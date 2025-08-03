#!/usr/bin/env python3
"""
Render平台启动脚本
自动检测端口并启动Flask应用
"""

import os
import sys
from miniprogram import app

if __name__ == '__main__':
    # Render会自动设置PORT环境变量
    port = int(os.environ.get('PORT', 10000))
    
    print(f"🚀 在Render平台启动五子棋AI服务器...")
    print(f"📍 监听端口: {port}")
    print(f"🌍 环境: {os.environ.get('FLASK_ENV', 'production')}")
    print("="*50)
    print("API接口说明:")
    print("- POST /api/new_game - 创建新游戏")
    print("- POST /api/make_move - 玩家落子")
    print("- GET /api/get_board_state - 获取棋盘状态")
    print("- POST /api/reset_game - 重置游戏")
    print("- GET /api/ai_hint - 获取AI提示")
    print("- GET /api/health - 健康检查")
    print("="*50)
    
    # 在生产环境中运行
    app.run(host='0.0.0.0', port=port, debug=False)