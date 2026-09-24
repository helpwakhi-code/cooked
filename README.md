# 🍳 Cooked - Delicious Recipes

A beautiful, responsive web application featuring 25 curated recipes with search, filtering, and a rich interactive interface.

![Cooked App](https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200)

## ✨ Features

- 📝 **25 Curated Recipes** - A diverse collection of breakfast, main dishes, desserts, and more
- 🔍 **Smart Search** - Search by name, ingredients, or tags
- 🏷 **Category Filtering** - Filter by Breakfast, Main Dishes, Soups & Salads, Desserts & Baking, Drinks & Snacks
- ⭐ **Favorites System** - Save your favorite recipes (persisted in localStorage)
- 🎯 **Difficulty & Time Filters** - Sort by difficulty level or cooking time
- 🖨 **Print/PDF Ready** - Professional print layout for recipes
- 📱 **Fully Responsive** - Beautiful on desktop, tablet, and mobile
- 🎨 **Modern Design** - Clean, modern interface with smooth animations
- 💡 **Chef's Tips** - Learn from professional cooking tips

## 🍵 Categories

- **Breakfast** - Start your day right with morning classics
- **Main Dishes** - Hearty meals for dinner and lunch
- **Soups & Salads** - Fresh and healthy options
- **Desserts & Baking** - Sweet treats and baked goods
- **Drinks & Snacks** - Refreshing drinks and quick bites

## 🚀 Quick Start

1. **Download or Clone**
   ```bash
   git clone https://github.com/your-username/cooked.git
   cd cooked
   ```

2. **Open in Browser**
   Simply open `index.html` in any modern web browser.

3. **That's it!** No build process, no dependencies - just open and start cooking!

## 📂 File Structure

```
cooked/
├── index.html          # Main application file
├── recipes.js          # All 25 recipes data
├── app.js              # Application logic and interactivity
├── style.css           # Modern responsive styling
└── README.md          # This file
```

## 🛠️ How to Deploy to GitHub Pages

### Option 1: GitHub Pages (Recommended)

1. **Initialize Git (if you haven't already)**
   ```bash
   cd cooked
   git init
   ```

2. **Create a new repository on GitHub** at https://github.com/new

3. **Add remote and push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Build and deployment** → **Branch**, select `main` folder and click **Save**
   - Wait a few minutes - your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

### Option 2: Netlify (Free, Easy)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   netlify deploy --prod
   ```

   Follow the prompts - Netlify will give you a live link instantly!

### Option 3: Vercel (Free, Fast)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

   Vercel will build and deploy your app instantly!

## 🎨 Customization

### Adding New Recipes

Edit `recipes.js` to add new recipes:

```javascript
{
  id: 26,
  title: "Your Recipe Name",
  tags: ["category", "keywords"],
  prepTime: 15,
  cookTime: 30,
  totalTime: 45,
  difficulty: "Easy",
  category: "breakfast",
  description: "Brief recipe description",
  image: "https://source.unsplash.com/...",
  ingredients: ["ingredient 1", "ingredient 2"],
  instructions: ["Step 1", "Step 2"],
  tip: "Pro tip here!"
}
```

### Changing Colors

Edit `style.css` variables in the `:root` section:

```css
:root {
  --primary: #f97316;      /* Main brand color */
  --secondary: #10b981;    /* Secondary accent */
  --background: #fff7ed;   /* Page background */
}
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Feel free to fork this project, add your own recipes, and submit pull requests!

## 📄 License

This project is open source and available for personal and commercial use.

## 🙏 Credits

- Recipe images from Unsplash
- CSS framework based on custom clean design
- Icons from standard SVG library

---

Made with ❤️ by [Your Name]

**Enjoy cooking with Cooked! 🍳✨**