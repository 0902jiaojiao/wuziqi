# 🎮 五子棋AI对战微信小程序

> **📚 完整说明文档**：[五子棋小程序完整说明文档.md](./五子棋小程序完整说明文档.md)  
> **🆓 免费部署指南**：[免费部署方案.md](./免费部署方案.md)

一个功能完整的五子棋AI对战微信小程序，支持智能AI、多难度等级、免费云部署。

## 项目特性

- 🎮 **智能AI对战**: 使用Minimax算法配合Alpha-Beta剪枝的高水平AI
- 📱 **微信小程序**: 原生微信小程序界面，流畅体验  
- 🎯 **多难度选择**: 5个难度等级，适合不同水平玩家
- 💡 **AI提示功能**: 可获取AI建议的最佳落子位置
- 🎨 **美观界面**: 仿真木纹棋盘，棋子带阴影效果
- ⚡ **实时对战**: 玩家落子后AI立即响应

## 项目结构

```
wuziqi/
├── miniprogram.py          # Flask后端服务器主文件
├── game_logic.py           # 五子棋游戏核心逻辑
├── ai_player.py            # AI算法实现
├── config.py               # 配置文件
├── run.py                  # 启动脚本
├── deploy.sh               # 部署脚本
├── requirements.txt        # Python依赖
└── miniprogram/            # 微信小程序前端
    ├── app.js              # 小程序主逻辑
    ├── app.json            # 小程序配置
    └── pages/game/         # 游戏页面
        ├── game.js         # 游戏逻辑
        ├── game.wxml       # 页面结构
        └── game.wxss       # 页面样式
```

## 快速开始

### 1. 后端部署

```bash
# 克隆项目
git clone <your-repo-url>
cd wuziqi

# 运行部署脚本
./deploy.sh

# 启动服务器
source venv/bin/activate
python run.py
```

或使用Gunicorn（生产环境推荐）：
```bash
source venv/bin/activate
gunicorn -w 4 -b 0.0.0.0:5000 miniprogram:app
```

### 2. 微信小程序配置

1. 在微信开发者工具中导入 `miniprogram` 文件夹
2. 修改 `miniprogram/app.js` 中的 `serverUrl` 为你的后端地址
3. 编译并运行小程序

## API接口说明

### 创建新游戏
- **URL**: `POST /api/new_game`
- **参数**: 
  ```json
  {
    "difficulty": 3,      // 难度1-5
    "board_size": 15      // 棋盘大小
  }
  ```

### 玩家落子
- **URL**: `POST /api/make_move`
- **参数**: 
  ```json
  {
    "game_id": "uuid",
    "row": 7,
    "col": 7
  }
  ```

### 其他接口
- `GET /api/get_board_state` - 获取棋盘状态
- `POST /api/reset_game` - 重置游戏  
- `GET /api/ai_hint` - 获取AI提示
- `GET /api/health` - 健康检查

## AI算法说明

本项目使用Minimax算法配合Alpha-Beta剪枝实现AI：

- **Minimax算法**: 通过递归搜索游戏树寻找最优解
- **Alpha-Beta剪枝**: 大幅减少搜索节点，提高运算效率
- **启发式评估**: 智能评估棋局价值，优先考虑关键位置
- **动态难度**: 根据难度等级调整搜索深度

## 开发环境

- Python 3.7+
- Flask 2.3.3
- 微信开发者工具

## 生产部署建议

1. **服务器配置**: 推荐使用云服务器，配置HTTPS
2. **域名配置**: 在微信小程序后台配置服务器域名白名单
3. **性能优化**: 使用Gunicorn + Nginx部署
4. **监控日志**: 添加日志记录和性能监控

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！