#!/usr/bin/env python3
"""
五子棋微信小程序启动脚本
"""
import os
import sys
from miniprogram import app
from config import config

def main():
    # 获取运行环境
    env = os.environ.get('FLASK_ENV', 'development')
    config_obj = config.get(env, config['default'])
    
    print(f"启动环境: {env}")
    print(f"调试模式: {config_obj.DEBUG}")
    print(f"监听地址: {config_obj.HOST}:{config_obj.PORT}")
    
    # 启动应用
    app.run(
        debug=config_obj.DEBUG,
        host=config_obj.HOST,
        port=config_obj.PORT,
        threaded=True
    )

if __name__ == '__main__':
    main()