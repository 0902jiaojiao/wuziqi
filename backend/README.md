# 🐍 Backend - 五子棋AI对战服务器

## 📁 目录说明

这个目录包含五子棋游戏的后端服务器代码，提供智能AI对弈功能。

### 📂 文件结构

```
backend/
├── miniprogram.py          # 主服务器文件 (Flask应用)
├── game_logic.py          # 游戏逻辑核心
├── ai_player.py           # AI算法实现
├── requirements.txt       # Python依赖包
└── README.md             # 说明文档
```

### 🎯 核心文件说明

#### 🚀 miniprogram.py
- **作用**: Flask后端服务器主文件
- **功能**: 
  - 提供6个核心API接口
  - 静态文件服务 (为网页版提供HTML/CSS/JS)
  - 游戏会话管理
  - CORS跨域支持

#### 🎮 game_logic.py  
- **作用**: 五子棋游戏规则实现
- **功能**:
  - 棋盘状态管理
  - 移动验证
  - 胜负判断
  - 游戏状态序列化

#### 🤖 ai_player.py
- **作用**: AI智能算法核心
- **功能**:
  - Minimax算法 + Alpha-Beta剪枝
  - 局面评估函数
  - 威胁检测 (活三、活四、连五)
  - 多难度级别支持

#### 📦 requirements.txt
- **作用**: Python依赖包清单
- **内容**: Flask, Flask-CORS, Gunicorn

## 🚀 本地运行

### 📋 环境要求
- Python 3.8+
- pip

### 🔧 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### ▶️ 启动服务器
```bash
python miniprogram.py
```

### 🌐 访问地址
- **API健康检查**: http://localhost:5001/api/health
- **2D网页版**: http://localhost:5001/
- **3D网页版**: http://localhost:5001/index3d.html

## 🔗 API接口文档

### 🎮 游戏接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/new_game` | POST | 创建新游戏 |
| `/api/make_move` | POST | 玩家落子 + AI回应 |
| `/api/get_board_state` | GET | 获取棋盘状态 |
| `/api/reset_game` | POST | 重置游戏 |
| `/api/ai_hint` | GET | 获取AI提示 |
| `/api/health` | GET | 健康检查 |

### 📤 请求示例

#### 创建新游戏
```bash
curl -X POST http://localhost:5001/api/new_game \
  -H "Content-Type: application/json" \
  -d '{"difficulty": 3}'
```

#### 玩家落子
```bash
curl -X POST http://localhost:5001/api/make_move \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "your-game-id",
    "row": 7,
    "col": 7,
    "ai_speed": 2
  }'
```

## 🤖 AI算法特点

### 🧠 智能程度
- **5个难度等级**: 简单到专家
- **动态搜索深度**: 根据难度调整
- **威胁识别**: 活三、活四、直接获胜

### ⚡ 性能优化
- **Alpha-Beta剪枝**: 大幅减少搜索节点
- **候选移动优化**: 智能筛选有效位置
- **评估函数缓存**: 避免重复计算

### 🎯 策略特点
- **攻守平衡**: 既考虑进攻也重视防守
- **位置价值**: 中心位置权重更高
- **连子奖励**: 优先形成连续棋子

## 🔧 开发说明

### 📝 代码结构
- **模块化设计**: 游戏逻辑与AI算法分离
- **RESTful API**: 标准HTTP接口
- **错误处理**: 完善的异常捕获和响应

### 🐛 调试模式
服务器默认运行在调试模式，支持:
- 代码热重载
- 详细错误信息
- 调试器集成

### 📊 性能监控
- 游戏会话数量追踪
- API响应时间统计
- 内存使用监控

## 🌟 特色功能

- ✅ **智能AI**: 专业级五子棋算法
- ✅ **多难度**: 5个级别适应不同水平
- ✅ **实时响应**: 快速API响应
- ✅ **状态管理**: 完善的游戏会话处理
- ✅ **跨域支持**: 支持网页版调用
- ✅ **错误恢复**: 网络异常自动恢复