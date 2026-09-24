// App Controller - Recipe App Logic
document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentFilter = 'all';
  let searchQuery = '';
  let favorites = JSON.parse(localStorage.getItem('cookedFavorites')) || [];

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const difficultySelect = document.getElementById('difficulty-select');
  const timeSelect = document.getElementById('time-select');
  const recipesGrid = document.getElementById('recipes-grid');
  const noResults = document.getElementById('no-results');
  const randomBtn = document.getElementById('random-recipe-btn');
  const recipeModal = document.getElementById('recipe-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalContent = document.getElementById('modal-content');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');

  // Initialize
  init();
  updateCounts();
  updateFavoriteCounts();

  function init() {
    setupEventListeners();
    renderRecipes();
    showRandomTip();
  }

  function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        currentFilter = item.dataset.filter;
        searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderRecipes();
      });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      if (searchQuery) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderRecipes();
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      renderRecipes();
    });

    // Filters
    difficultySelect.addEventListener('change', renderRecipes);
    timeSelect.addEventListener('change', renderRecipes);

    // Random recipe
    randomBtn.addEventListener('click', renderRandomRecipe);

    // Modal
    modalCloseBtn.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', (e) => {
      if (e.target === recipeModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !recipeModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Print deck support
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.print-deck-btn')) {
        e.preventDefault();
        const recipeId = e.target.closest('.print-deck-btn').dataset.id;
        openRecipeModal(recipeId);
      }
    });
  }

  function getFilteredRecipes() {
    const difficulty = difficultySelect.value;
    const time = parseInt(timeSelect.value) || Infinity;

    return recipes.filter(recipe => {
      // Filter by category
      if (currentFilter === 'favorites') {
        if (!favorites.includes(recipe.id)) return false;
      } else if (currentFilter !== 'all') {
        if (recipe.category !== currentFilter) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const searchMatch = recipe.title.toLowerCase().includes(searchQuery) ||
          recipe.description.toLowerCase().includes(searchQuery) ||
          recipe.tags.some(tag => tag.includes(searchQuery)) ||
          recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery));
        if (!searchMatch) return false;
      }

      // Filter by difficulty
      if (difficulty !== 'all' && recipe.difficulty !== difficulty) {
        return false;
      }

      // Filter by time
      if (recipe.totalTime > time) return false;

      return true;
    });
  }

  function renderRecipes() {
    const filtered = getFilteredRecipes();
    updateSectionHeader(filtered);

    recipesGrid.innerHTML = '';
    noResults.classList.add('hidden');

    if (filtered.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }

    filtered.forEach(recipe => {
      const card = createRecipeCard(recipe);
      recipesGrid.appendChild(card);
    });

    // Update hero stats
    updateHeroStats();
  }

  function updateSectionHeader(filteredRecipes) {
    const filterNames = {
      'all': 'All Recipes',
      'breakfast': 'Breakfast',
      'main': 'Main Dishes',
      'soup-salad': 'Soups & Salads',
      'dessert': 'Desserts & Baking',
      'drinks': 'Drinks & Snacks',
      'favorites': 'Favorites'
    };

    sectionTitle.textContent = filterNames[currentFilter] || 'Recipes';
    sectionSubtitle.textContent = `Showing ${filteredRecipes.length} delicious recipe${filteredRecipes.length !== 1 ? 's' : ''}`;
  }

  function updateHeroStats() {
    // Keep the current stats but could update dynamically
  }

  function createRecipeCard(recipe) {
    const isFavorite = favorites.includes(recipe.id);
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <div class="recipe-card-image-wrapper ${isFavorite ? 'favorited' : ''}">
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe-card-image" loading="lazy">
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${isFavorite ? '#ef4444' : 'none'}" stroke="${isFavorite ? '#ef4444' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div class="recipe-overlay">
          <div class="recipe-badge recipe-badge-${getDifficultyColor(recipe.difficulty)}">
            ${recipe.difficulty}
          </div>
        </div>
      </div>
      <div class="recipe-card-content">
        <h3 class="recipe-card-title">${recipe.title}</h3>
        <p class="recipe-card-description">${recipe.description}</p>
        <div class="recipe-card-meta">
          <span class="meta-item">⏱ ${recipe.totalTime} min</span>
          <span class="meta-item">🏷 ${recipe.category}</span>
        </div>
        <div class="recipe-card-tags">
          ${recipe.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <button class="btn btn-view-details" data-id="${recipe.id}">
          View Recipe →
        </button>
      </div>
    `;

    // Add event listeners
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(recipe.id);
    });

    card.querySelector('.btn-view-details').addEventListener('click', () => {
      openRecipeModal(recipe.id);
    });

    return card;
  }

  function getDifficultyColor(difficulty) {
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'yellow';
      case 'Hard': return 'red';
      default: return 'gray';
    }
  }

  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
      favorites.push(id);
    } else {
      favorites.splice(index, 1);
    }

    localStorage.setItem('cookedFavorites', JSON.stringify(favorites));

    // Update UI
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      if (parseInt(btn.dataset.id) === id) {
        btn.classList.toggle('active');
        btn.querySelector('svg').setAttribute('fill', btn.classList.contains('active') ? '#ef4444' : 'none');
        btn.querySelector('svg').setAttribute('stroke', btn.classList.contains('active') ? '#ef4444' : 'currentColor');
      }
    });

    updateFavoriteCounts();
  }

  function updateFavoriteCounts() {
    document.getElementById('count-fav').textContent = favorites.length;
  }

  function updateCounts() {
    // Update initial counts based on recipes
    document.getElementById('count-all').textContent = recipes.length;

    recipes.forEach(recipe => {
      const countEl = document.getElementById(`count-${recipe.category}`);
      if (countEl) {
        const current = parseInt(countEl.textContent) || 0;
        countEl.textContent = current + 1;

        // Update main category as well
        if (recipe.category === 'main' && !document.getElementById('count-main')) {
          document.getElementById('count-main').textContent = current + 1;
        }
      }
    });
  }

  function openRecipeModal(id) {
    const recipe = recipes.find(r => r.id === parseInt(id));
    if (!recipe) return;

    const isFavorite = favorites.includes(recipe.id);
    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="modal-image-wrapper">
          <img src="${recipe.image}" alt="${recipe.title}" class="modal-image">
        </div>
        <div class="modal-header-info">
          <div class="modal-badges">
            <span class="modal-badge modal-badge-${getDifficultyColor(recipe.difficulty)}">${recipe.difficulty}</span>
            <span class="modal-tag">${recipe.category}</span>
          </div>
          <h2 class="modal-title">${recipe.title}</h2>
          <p class="modal-description">${recipe.description}</p>
          <div class="modal-timings">
            <span class="timing-item">⏱ ${recipe.prepTime} min prep</span>
            <span class="timing-item">🔥 ${recipe.cookTime} min cook</span>
            <span class="timing-item">⏳ ${recipe.totalTime} min total</span>
          </div>
          <div class="modal-actions">
            <button class="btn btn-favorite ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="${isFavorite ? '#ef4444' : 'none'}" stroke="${isFavorite ? '#ef4444' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>${isFavorite ? 'Saved' : 'Save Recipe'}</span>
            </button>
            <button class="btn btn-print" onclick="window.print()">
              🖨 Print/PDF
            </button>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="section-section">
          <h3 class="section-title">Ingredients</h3>
          <div class="ingredients-checklist ${getDifficultyColor(recipe.difficulty)}">
            ${recipe.ingredients.map(ingredient => `
              <label class="ingredient-item">
                <input type="checkbox">
                <span>${ingredient}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="section-section">
          <h3 class="section-title">Instructions</h3>
          <div class="instructions-list">
            ${recipe.instructions.map((step, index) => `
              <div class="instruction-item">
                <span class="instruction-number">${index + 1}</span>
                <p>${step}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section-section chef-tip-section">
          <h3 class="section-title">💡 Chef's Secret Tip</h3>
          <p class="chef-tip-text">${recipe.tip}</p>
        </div>
      </div>
    `;

    recipeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Re-attach event listeners
    modalHeaderActions();
  }

  function modalHeaderActions() {
    const favoriteBtn = document.querySelector('.btn-favorite');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        const id = parseInt(favoriteBtn.dataset.id);
        toggleFavorite(id);
        favoriteBtn.classList.toggle('active');
        favoriteBtn.querySelector('svg').setAttribute('fill', favoriteBtn.classList.contains('active') ? '#ef4444' : 'none');
        favoriteBtn.querySelector('svg').setAttribute('stroke', favoriteBtn.classList.contains('active') ? '#ef4444' : 'currentColor');
        favoriteBtn.querySelector('span').textContent = favoriteBtn.classList.contains('active') ? 'Saved' : 'Save Recipe';
      });
    }
  }

  function closeModal() {
    recipeModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderRandomRecipe() {
    const allRecipes = currentFilter === 'all' || currentFilter === 'favorites'
      ? recipes.filter(r => currentFilter === 'favorites' ? favorites.includes(r.id) : true)
      : recipes.filter(r => r.category === currentFilter);

    if (allRecipes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * allRecipes.length);
    openRecipeModal(allRecipes[randomIndex].id);
  }

  let tips = [
    "Season in layers: add salt at different stages of cooking, not just at the end!",
    "Let meat rest for 5-10 minutes after cooking to retain juices.",
    "Use room temperature ingredients (eggs, butter) for better results.",
    "Freshly ground spices make a huge difference in flavor.",
    "Your knife is your best friend - sharp knives are safer than dull ones.",
    "Prep everything before you start cooking - mise en place.",
    "Always taste before seasoning!",
    "Season pasta water generously, it should taste like seasoned soup.",
    "Add fat to make bland flavors pop.",
    "Browning (carmelization) is cooking's magic ingredient."
  ];

  function showRandomTip() {
    const tipEl = document.getElementById('daily-tip');
    if (tipEl) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      tipEl.textContent = randomTip;

      // Rotate tips periodically
      setInterval(() => {
        const newTip = tips[Math.floor(Math.random() * tips.length)];
        tipEl.textContent = newTip;
      }, 60000);
    }
  }
});