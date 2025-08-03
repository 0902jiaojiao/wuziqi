# 🎮 五子棋AI对战 - 微信小程序

## 📁 目录说明

这个目录包含微信小程序的前端代码。

### 📂 文件结构

```
wechat-miniprogram/
├── app.js                     # 小程序入口文件
├── app.json                   # 小程序配置文件
├── app.production.js          # 生产环境配置
├── project.config.json        # 项目配置文件
├── project.private.config.json # 私有配置文件
├── project.config.production.json # 生产环境项目配置
├── pages/                     # 页面目录
│   └── game/                 # 游戏页面
│       ├── game.js           # 游戏逻辑
│       ├── game.wxml         # 页面结构
│       └── game.wxss         # 页面样式
└── utils/                    # 工具函数目录
    └── util.js              # 通用工具函数
```

### 🚀 开发说明

1. **开发环境**：使用微信开发者工具
2. **后端地址**：需要在 `app.js` 中配置后端服务器地址
3. **调试模式**：记得开启"不校验合法域名"和"启用调试"

### 🔧 配置修改

**本地开发**：
```javascript
// app.js 中的 serverUrl
serverUrl: 'http://localhost:5001'
```

**生产部署**：
```javascript
// app.production.js 中的 serverUrl  
serverUrl: 'https://your-domain.com'
```

### 📱 功能特点

- ✅ 人机对战五子棋
- ✅ 多种AI难度等级
- ✅ AI思考速度调节
- ✅ 游戏状态同步
- ✅ 提示功能（每局一次）
- ✅ 游戏重置和重新开始