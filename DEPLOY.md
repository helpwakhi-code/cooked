# 🚀 Deployment Instructions - Cooked App

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Enter a repository name (e.g., `cooked` or `cooked-recipes`)
3. Choose public or private
4. Click **Create repository**
5. You'll see a "Quick setup" section with commands

## Step 2: Add your GitHub remote and push

In your terminal/command prompt:

```bash
cd C:\Users\wakhi\cook-app

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your code
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your GitHub username and `YOUR_REPO_NAME` with your repository name.

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository on the web
2. Click **Settings** in the top menu
3. On the left sidebar, click **Pages**
4. Under **Build and deployment** → **Branch**, select the **main** folder
5. Click **Save**
6. Wait 1-3 minutes for GitHub to build your site

## Step 4: Access Your Live Site

Once GitHub Pages is built, your website will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Override an existing repo (if creating new repo)
1. git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
2. git push -u origin main --force
3. Enable GitHub Pages in Settings → Pages

---

## 🔧 Troubleshooting

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### No "main" branch
```bash
git branch -m main
git push -u origin main
```

### Access Denied
- Make sure you're authenticated to GitHub
- Use SSH URL if you have SSH keys set up:
  ```
  git remote set-url origin git@github.com:YOUR-USERNAME/YOUR-REPO.git
  git push -u origin main
  ```

---

## 🌐 Alternative: Free Hosting Options

### Netlify (Easiest)
```bash
npm install -g netlify-cli
cd cooked
netlify deploy --prod
```

### Vercel (Fastest)
```bash
npm install -g vercel
cd cooked
vercel --prod
```

---

**Ready to cook!** Once deployed, you'll have a beautiful, fully functional recipe app live online! 🍳