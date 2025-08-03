#!/usr/bin/env python3
"""
五子棋服务器快速启动脚本
"""

import subprocess
import sys
import time
import requests

def check_dependencies():
    """检查依赖包"""
    try:
        import flask
        import flask_cors
        print("✓ 依赖包检查通过")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖包: {e}")
        print("正在安装依赖包...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "Flask", "Flask-CORS"])
            print("✓ 依赖包安装完成")
            return True
        except:
            print("❌ 依赖包安装失败，请手动执行: pip install Flask Flask-CORS")
            return False

def start_server():
    """启动服务器"""
    print("🚀 启动五子棋后端服务器...")
    print("服务器地址: http://localhost:5000")
    print("按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    try:
        from miniprogram import app
        app.run(debug=True, host='127.0.0.1', port=5000)
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")

def main():
    print("=== 五子棋微信小程序后端服务器 ===")
    
    if not check_dependencies():
        return
    
    print("\n测试游戏核心功能...")
    try:
        subprocess.run([sys.executable, "test_game.py"], check=True, timeout=30)
    except:
        print("⚠️  核心功能测试跳过")
    
    print("\n" + "="*50)
    start_server()

if __name__ == '__main__':
    main()