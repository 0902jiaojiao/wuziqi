# 📁 项目结构说明

## 🎯 目录重新组织

为了更好的项目管理和开发，我们将项目重新组织为以下结构：

```
wuziqi/
├── 📱 wechat-miniprogram/    # 微信小程序版本
│   ├── app.js               # 小程序入口
│   ├── app.json             # 小程序配置
│   ├── pages/               # 页面目录
│   │   └── game/           # 游戏页面
│   └── utils/              # 工具函数
│
├── 🌐 website/              # 网站版本
│   ├── index.html          # 2D版本首页
│   ├── style.css           # 2D版本样式
│   ├── script.js           # 2D版本逻辑
│   ├── index3d.html        # 3D版本首页
│   ├── style3d.css         # 3D版本样式
│   └── script3d.js         # 3D版本逻辑
│
├── 🔧 backend/              # 后端服务器
│   ├── miniprogram.py      # Flask主服务器
│   ├── ai_player.py        # AI算法实现
│   ├── game_logic.py       # 游戏逻辑
│   ├── requirements.txt    # Python依赖
│   └── 部署相关文件...       # 各种部署脚本
│
├── 📚 免费部署方案.md         # 部署指南
├── 📖 五子棋小程序完整说明文档.md # 完整文档
└── 📄 README.md             # 项目总览
```

## 🚀 快速开始

### 1. 后端服务器
```bash
cd backend
pip install -r requirements.txt
python miniprogram.py
```

### 2. 网站版本
```bash
# 后端启动后访问：
http://localhost:5001/          # 2D版本
http://localhost:5001/index3d.html  # 3D版本
```

### 3. 微信小程序
```bash
# 使用微信开发者工具打开 wechat-miniprogram 目录
# 记得配置后端服务器地址
```

## 📦 版本特点

### 📱 微信小程序版
- 原生小程序体验
- 完整游戏功能
- 适配移动端操作

### 🌐 网站2D版  
- Canvas 2D渲染
- 响应式设计
- 专业简洁界面

### 🎮 网站3D版
- Three.js 3D引擎
- 真实物理效果
- 可交互3D场景

## 🔄 迁移说明

从原来的项目结构迁移到新结构，主要变更：

1. **静态文件** `static/` → `website/`
2. **小程序文件** `miniprogram/` → `wechat-miniprogram/`  
3. **后端文件** 根目录 → `backend/`
4. **部署文件** 根目录 → `backend/`

## 🎯 优势

✅ **清晰分离**：前端和后端代码完全分离  
✅ **易于维护**：每个部分独立开发和部署  
✅ **团队协作**：不同开发者可专注不同模块  
✅ **版本管理**：更好的Git分支管理策略  
✅ **部署独立**：前端和后端可独立部署