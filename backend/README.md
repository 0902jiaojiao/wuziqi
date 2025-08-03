# 🔧 五子棋AI对战 - 后端服务

## 📁 目录说明

这个目录包含后端服务器代码和部署相关文件。

### 📂 文件结构

```
backend/
├── miniprogram.py              # 主服务器文件（Flask）
├── ai_player.py               # AI算法实现
├── game_logic.py              # 五子棋游戏逻辑
├── config.py                  # 配置文件
├── requirements.txt           # Python依赖
├── runtime.txt               # Python版本声明
├── start_server.py           # 服务器启动脚本
├── run.py                    # 简化启动脚本
├── diagnose_game.py          # 游戏诊断工具
├── test_game.py              # 游戏测试文件
├── deploy.sh                 # 本地部署脚本
├── Procfile                  # Railway部署配置
├── railway.json              # Railway配置文件
├── render.yaml               # Render平台配置
├── build.sh                  # Render构建脚本
├── start_render.py           # Render启动脚本
├── render_deploy.sh          # Render一键部署
├── 免费部署一键脚本.sh         # 自动化部署脚本
├── deploy_production.sh      # 生产环境部署
├── nginx_config.conf         # Nginx配置
└── production_config.py      # 生产环境配置
```

### 🚀 快速启动

#### 本地开发
```bash
cd backend
pip install -r requirements.txt
python miniprogram.py
```

#### 使用脚本启动
```bash
cd backend
python start_server.py  # 或者 python run.py
```

### 🌐 API接口

#### 游戏核心接口
- `POST /api/new_game` - 创建新游戏
- `POST /api/make_move` - 玩家落子
- `GET /api/get_board_state` - 获取棋盘状态
- `POST /api/reset_game` - 重置游戏
- `GET /api/ai_hint` - 获取AI提示
- `GET /api/health` - 健康检查

#### 网站路由
- `GET /` - 2D版本首页
- `GET /index3d.html` - 3D版本首页
- `GET /<filename>` - 静态文件服务

### 🤖 AI算法特点

- **算法核心**：Minimax + Alpha-Beta剪枝
- **搜索深度**：动态调整（2-6层）
- **评估函数**：多维度棋型评估
- **优化策略**：
  - 候选位置筛选
  - 威胁检测
  - 获胜路径分析
  - 开局库优化

### 🚀 部署选项

#### 免费云平台
1. **Render** (推荐)
   ```bash
   ./render_deploy.sh
   ```

2. **Railway**
   ```bash
   # 使用 railway.json 配置
   ```

3. **Vercel**
   ```bash
   # 适合Serverless部署
   ```

#### 生产环境
```bash
./deploy_production.sh
```

### ⚙️ 配置说明

#### 环境变量
- `PORT`: 服务器端口（默认5001）
- `FLASK_ENV`: 运行环境（development/production）
- `AI_DIFFICULTY`: 默认AI难度（1-5）

#### 性能优化
- 游戏状态内存缓存
- AI思考时间控制
- 请求并发处理
- 静态文件服务优化