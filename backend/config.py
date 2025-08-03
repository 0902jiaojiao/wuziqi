"""
配置文件
"""
import os

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DEBUG = False
    
    # 游戏配置
    DEFAULT_BOARD_SIZE = 15
    DEFAULT_DIFFICULTY = 3
    MAX_GAME_SESSIONS = 1000
    SESSION_TIMEOUT = 3600  # 1小时
    
    # 跨域配置
    CORS_ORIGINS = ["*"]  # 生产环境应该限制具体域名

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    HOST = '127.0.0.1'
    PORT = 5000

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 5000))

# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}