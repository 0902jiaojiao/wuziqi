# 生产环境配置
import os

class ProductionConfig:
    """生产环境配置"""
    
    # 基本配置
    DEBUG = False
    TESTING = False
    
    # 服务器配置
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 5000))
    
    # 跨域配置
    CORS_ORIGINS = [
        'https://servicewechat.com',  # 微信小程序域名
        'https://*.servicewechat.com'
    ]
    
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    
    # 数据库配置（如果需要）
    # DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # 日志配置
    LOG_LEVEL = 'INFO'
    LOG_FILE = '/var/log/gomoku/app.log'
    
    # 游戏配置
    MAX_GAMES = 1000  # 最大同时游戏数
    GAME_TIMEOUT = 3600  # 游戏超时时间（秒）
    
    # AI配置
    AI_MAX_THINKING_TIME = 10  # AI最大思考时间
    
    @staticmethod
    def init_app(app):
        """初始化应用配置"""
        # 配置日志
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug:
            # 确保日志目录存在
            log_dir = os.path.dirname(ProductionConfig.LOG_FILE)
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            # 设置日志处理器
            file_handler = RotatingFileHandler(
                ProductionConfig.LOG_FILE,
                maxBytes=10240000,  # 10MB
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info('五子棋应用启动')

# 环境变量示例
# export SECRET_KEY=your-very-secret-key
# export PORT=5000
# export FLASK_ENV=production