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
└── script3d.js            # 3D版本逻辑（Three.js）
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