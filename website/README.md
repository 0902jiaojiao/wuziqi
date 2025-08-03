# 🌐 五子棋AI对战 - 网站版本

## 📁 目录说明

这个目录包含网站版本的前端代码，包括2D和3D两个版本。

### 📂 文件结构

```
website/
├── index.html              # 2D版本首页
├── style.css              # 2D版本样式
├── script.js              # 2D版本逻辑
├── index3d.html           # 3D版本首页 
├── style3d.css            # 3D版本样式
├── script3d.js            # 3D版本逻辑（Three.js）
├── config.js              # 配置文件（API地址等）
└── README.md              # 说明文档
```

### 🎯 版本说明

#### 🎨 2D版本 (`index.html`)
- **技术栈**：HTML + CSS + JavaScript + Canvas 2D
- **特点**：
  - 经典2D界面
  - Canvas绘制棋盘和棋子
  - 优雅的动画效果
  - 响应式设计
  - 立体感棋子渲染

#### 🎮 3D版本 (`index3d.html`)  
- **技术栈**：HTML + CSS + JavaScript + Three.js
- **特点**：
  - 真实3D场景
  - 可旋转、缩放、移动视角
  - 扁平真实棋子设计
  - 物理阴影效果
  - 多种预设视角

### 🚀 本地运行

```bash
# 在项目根目录运行后端服务器
cd backend
python miniprogram.py

# 访问网站
http://localhost:5001/          # 2D版本
http://localhost:5001/index3d.html  # 3D版本
```

### 🌐 GitHub Pages 部署

#### 部署到GitHub Pages：

1. **Fork或clone此项目**
2. **在GitHub仓库设置中启用Pages**
3. **配置后端API地址**：
   ```javascript
   // 修改 config.js 中的 PROD_API_URL
   PROD_API_URL: 'https://your-backend-url.render.com'
   ```
4. **推送到main分支**，GitHub Actions会自动部署

#### 后端部署推荐：
- **Render** (免费): https://render.com
- **Vercel** (免费): https://vercel.com  
- **Railway** (免费额度): https://railway.app

### 🔧 配置说明

#### API配置 (`config.js`)
```javascript
const GAME_CONFIG = {
    DEV_API_URL: 'http://localhost:5001',     // 开发环境
    PROD_API_URL: 'https://your-backend.com', // 生产环境
    // 自动根据域名切换环境
}
```

#### 环境检测
- **本地开发**: 自动使用 `localhost:5001`
- **GitHub Pages**: 自动使用生产环境API
- **支持自定义域名**: 自动适配

### 🎨 UI特点

- ✅ **专业简洁**：去除表情符号，界面更专业
- ✅ **颜色优化**：柔和的棋盘色彩，白色标题
- ✅ **响应式设计**：适配不同屏幕尺寸
- ✅ **交互友好**：即时反馈，优化用户体验

### 🔧 技术细节

#### 2D版本技术要点：
- Canvas 2D API 绘制
- 优雅的CSS动画
- 实时游戏状态更新
- 乐观更新机制

#### 3D版本技术要点：
- Three.js 3D引擎
- WebGL渲染
- OrbitControls 相机控制
- Raycaster 点击检测
- 物理材质和光照

### 🌟 在线体验

部署后可通过以下地址访问：
- **2D版本**: `https://username.github.io/wuziqi/`
- **3D版本**: `https://username.github.io/wuziqi/index3d.html`

（请将 `username` 替换为你的GitHub用户名）