# GitHub Pages Setup for Static Gomoku AI

## 🚀 Automatic Deployment Setup

I've created a GitHub Action that will automatically deploy your static Gomoku AI game to GitHub Pages whenever you push changes to the `static-website/` folder.

## 📋 Setup Steps

### 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"** (not "Deploy from a branch")
5. Click **Save**

### 2. Push the GitHub Action

```bash
# Add the new workflow file
git add .github/workflows/deploy-static.yml
git add GITHUB_PAGES_SETUP.md
git commit -m "Add GitHub Actions workflow for static site deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to **Actions** tab in your repository
2. You'll see the "Deploy Static Gomoku to GitHub Pages" workflow running
3. Click on it to see the deployment progress
4. Once complete, your site will be live!

## 🌐 Your Site URL

Your static Gomoku AI will be available at:
```
https://YOUR_USERNAME.github.io/wuziqi/
```

For example, if your GitHub username is `johndoe`:
```
https://johndoe.github.io/wuziqi/
```

## ⚡ Automatic Features

### What triggers deployment:
- ✅ Push to `main` branch with changes in `static-website/` folder
- ✅ Manual trigger from Actions tab
- ✅ Only deploys when static website files change (efficient)

### What the action does:
- 📁 Copies all files from `static-website/` to deployment
- 🔄 Creates a 404 redirect to handle direct access
- 🚫 Bypasses Jekyll processing (`.nojekyll` file)
- 🌐 Deploys to GitHub Pages with proper permissions

## 🛠️ Customization Options

### Custom Domain (Optional)
1. In repository settings → Pages
2. Add your custom domain
3. Configure DNS with your domain provider

### Path-based Deployment
The current setup deploys to `/wuziqi/` path. If you want root domain:
1. Rename repository to `YOUR_USERNAME.github.io`
2. Update the 404.html redirect path in the workflow

## 🔧 Troubleshooting

### Common Issues:

**Deployment fails:**
- Check that Pages source is set to "GitHub Actions"
- Verify repository is public (or you have GitHub Pro)

**404 errors:**
- Wait 5-10 minutes for DNS propagation
- Check the deployment URL in Actions tab

**JavaScript errors:**
- All paths are relative, so should work automatically
- Check browser console for any remaining issues

**Updates not showing:**
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Check if new deployment completed in Actions tab

## 📱 Features of Deployed Site

Your deployed static Gomoku AI includes:
- ✅ Full AI functionality (no backend needed)
- ✅ 5 difficulty levels
- ✅ Responsive design for mobile
- ✅ Offline capability after first load
- ✅ Beautiful 3D game pieces
- ✅ Hint system and undo functionality
- ✅ HTTPS automatically enabled

## 🎯 Next Steps

1. Set up the GitHub Pages as described above
2. Push the workflow file to trigger first deployment
3. Share your game URL with friends!
4. Monitor the Actions tab for deployment status

Your static Gomoku AI game will be accessible worldwide for free! 🎮