# 🚀 GitHub Pages 部署完整指南

## 📋 **部署流程概述**

### 🎯 **部署策略**
1. **前端**: 部署到GitHub Pages（完全免费）
2. **后端**: 部署到免费云平台（Render/Vercel等）
3. **配置**: 自动环境检测，无需手动切换

## 📚 **详细步骤**

### 1️⃣ **准备GitHub仓库**

```bash
# 如果还没有推送到GitHub
git remote add origin https://github.com/你的用户名/wuziqi.git
git branch -M main
git push -u origin main
```

### 2️⃣ **启用GitHub Pages**

1. 进入GitHub仓库页面
2. 点击 **Settings** 选项卡
3. 滚动到 **Pages** 部分
4. 选择 **Source**: `GitHub Actions`
5. 保存设置

### 3️⃣ **配置后端API**

#### 选择后端部署平台：

**🌟 推荐：Render（免费）**
```bash
# 使用项目中的一键部署脚本
cd backend
./render_deploy.sh
```

**或者：Vercel（免费）**
```bash
cd backend
npm i -g vercel
vercel --prod
```

#### 获取后端URL后，修改配置：
```javascript
// 编辑 website/config.js
PROD_API_URL: 'https://你的后端域名.render.com'
```

### 4️⃣ **推送代码触发部署**

```bash
# 提交配置更改
git add .
git commit -m "🚀 配置GitHub Pages部署"
git push origin main
```

### 5️⃣ **查看部署状态**

1. 进入GitHub仓库的 **Actions** 选项卡
2. 查看部署进度
3. 部署完成后访问: `https://你的用户名.github.io/wuziqi/`

## 🔧 **高级配置**

### 🌐 **自定义域名（可选）**

1. 在仓库根目录创建 `CNAME` 文件：
```bash
echo "yourdomain.com" > CNAME
git add CNAME
git commit -m "添加自定义域名"
git push origin main
```

2. 在域名提供商处配置DNS：
```
CNAME记录: www -> 你的用户名.github.io
A记录: @ -> 185.199.108.153
A记录: @ -> 185.199.109.153  
A记录: @ -> 185.199.110.153
A记录: @ -> 185.199.111.153
```

### 🔒 **HTTPS配置**

GitHub Pages自动提供HTTPS，无需额外配置。

### 📊 **环境变量配置**

如果需要使用环境变量，可以在GitHub仓库的 **Settings > Secrets and variables > Actions** 中添加：

```yaml
# .github/workflows/deploy.yml 中使用
- name: Set API URL
  run: |
    sed -i 's|PROD_API_URL:.*|PROD_API_URL: "${{ secrets.API_URL }}",|' ./website/config.js
```

## 🎯 **访问地址**

部署完成后，你的五子棋游戏将在以下地址可用：

### 📱 **游戏地址**
- **2D版本**: `https://你的用户名.github.io/wuziqi/`
- **3D版本**: `https://你的用户名.github.io/wuziqi/index3d.html`

### 🔗 **分享链接**
可以直接分享给朋友，无需安装任何软件！

## 🐛 **常见问题排除**

### ❌ **部署失败**
1. 检查GitHub Actions日志
2. 确保 `.github/workflows/deploy.yml` 文件存在
3. 验证仓库名称和分支名称正确

### ❌ **API连接失败**  
1. 检查后端是否正常运行
2. 验证 `config.js` 中的API地址
3. 确保后端支持CORS跨域请求

### ❌ **页面空白**
1. 检查浏览器控制台错误
2. 验证所有文件路径正确
3. 确保JavaScript文件正常加载

### ❌ **3D版本不显示**
1. 检查Three.js CDN连接
2. 确保浏览器支持WebGL
3. 验证script3d.js文件完整

## 📈 **性能优化建议**

### 🚀 **加载速度优化**
1. 启用GitHub Pages的CDN（自动）
2. 压缩图片和资源文件
3. 使用浏览器缓存策略

### 🔄 **更新流程**
```bash
# 修改代码后
git add .
git commit -m "更新游戏功能"
git push origin main
# GitHub Actions会自动重新部署
```

## 🎊 **部署完成！**

恭喜！你的五子棋AI对战游戏现在已经可以在全世界访问了！

**🎮 立即体验**: `https://你的用户名.github.io/wuziqi/`

**📤 分享给朋友**: 直接发送链接，无需下载安装！

**🔄 持续更新**: 推送代码到GitHub，网站自动更新！