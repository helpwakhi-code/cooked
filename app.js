// Cooked - Ultra 3D Interactive Recipe Experience
// Production-quality Vanilla JS with 3D Tilt, Particle Canvas, Web Audio, and Full Interactivity

const App = {
    state: {
        recipes: (typeof recipes !== 'undefined' ? recipes : (window.recipes || [])),
        filteredRecipes: [],
        favorites: (JSON.parse(localStorage.getItem('cookedFavorites')) || []).map(id => parseInt(id, 10)),
        ratings: JSON.parse(localStorage.getItem('cookedRatings')) || {},
        theme: localStorage.getItem('cookedTheme') || 'dark',
        currentCategory: 'all',
        searchQuery: '',
        difficultyFilter: 'all',
        timeFilter: 'all',
        timerInterval: null,
        timerRemaining: 0,
        timerTotal: 0,
        isTimerRunning: false,
        soundEnabled: false,
        focusedCardIndex: -1,
        particles: []
    },

    elements: {},

    init() {
        if (typeof window !== 'undefined' && !window.recipes && typeof recipes !== 'undefined') {
            window.recipes = recipes;
        }
        if (!this.state.recipes || this.state.recipes.length === 0) {
            if (typeof recipes !== 'undefined') {
                this.state.recipes = recipes;
            } else if (window.recipes) {
                this.state.recipes = window.recipes;
            }
        }

        this.cacheElements();
        this.state.filteredRecipes = [...this.state.recipes];
        
        this.applyTheme(this.state.theme);
        this.setupEventListeners();
        this.setupParticleSystem();
        this.updateNavBadges();
        this.animateCounters();
        this.renderCards(this.state.filteredRecipes);
        this.setupRandomTip();
    },

    cacheElements() {
        this.elements = {
            grid: document.getElementById('recipes-grid'),
            navItems: document.querySelectorAll('.nav-item[data-filter]'),
            searchInput: document.getElementById('search-input'),
            clearSearchBtn: document.getElementById('clear-search'),
            difficultySelect: document.getElementById('difficulty-select'),
            timeSelect: document.getElementById('time-select'),
            resetFiltersBtn: document.getElementById('reset-filters-btn'),
            themeToggle: document.getElementById('theme-toggle') || this.createThemeToggle(),
            soundToggle: document.getElementById('sound-toggle'),
            modal: document.getElementById('recipe-modal'),
            modalDialog: document.querySelector('#recipe-modal .modal-dialog'),
            modalContent: document.getElementById('modal-content') || document.querySelector('#recipe-modal .modal-body'),
            modalCloseBtn: document.getElementById('modal-close-btn') || document.querySelector('#recipe-modal .modal-close'),
            timerModal: document.getElementById('timer-modal'),
            randomBtn: document.getElementById('random-recipe-btn'),
            sidebarToggle: document.getElementById('mobile-menu-btn') || document.getElementById('mobile-sidebar-toggle') || this.createSidebarToggle(),
            sidebar: document.querySelector('.sidebar'),
            canvas: document.getElementById('particle-canvas') || this.createParticleCanvas(),
            sectionTitle: document.getElementById('section-title'),
            sectionSubtitle: document.getElementById('section-subtitle'),
            toastContainer: document.getElementById('toast-container') || this.createToastContainer()
        };
    },

    createThemeToggle() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'icon-btn magnetic-btn';
        btn.innerHTML = '🌙';
        btn.setAttribute('aria-label', 'Toggle Theme');
        const container = document.querySelector('.topbar-actions');
        if (container) container.appendChild(btn);
        else document.body.appendChild(btn);
        return btn;
    },

    createSidebarToggle() {
        const btn = document.createElement('button');
        btn.id = 'mobile-menu-btn';
        btn.className = 'icon-btn magnetic-btn';
        btn.innerHTML = '<span></span><span></span><span></span>';
        btn.setAttribute('aria-label', 'Toggle Menu');
        const layout = document.querySelector('.app-layout');
        if (layout) layout.insertBefore(btn, layout.firstChild);
        return btn;
    },

    createParticleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        document.body.insertBefore(canvas, document.body.firstChild);
        return canvas;
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    setupEventListeners() {
        // Navigation Filtering
        this.elements.navItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = item.getAttribute('data-filter');
                this.elements.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                this.playSound(520, 'sine', 0.08);
                this.handleFilterChange('category', filter);

                // Close mobile sidebar on selection
                if (window.innerWidth <= 1024 && this.elements.sidebar) {
                    this.elements.sidebar.classList.remove('active');
                }
            });
        });

        // Search
        this.elements.searchInput?.addEventListener('input', this.debounce((e) => {
            const query = e.target.value;
            if (this.elements.clearSearchBtn) {
                if (query.trim()) this.elements.clearSearchBtn.classList.remove('hidden');
                else this.elements.clearSearchBtn.classList.add('hidden');
            }
            this.handleFilterChange('search', query);
        }, 200));

        this.elements.clearSearchBtn?.addEventListener('click', () => {
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
                this.elements.clearSearchBtn.classList.add('hidden');
                this.handleFilterChange('search', '');
            }
        });

        // Dropdown Filters
        this.elements.difficultySelect?.addEventListener('change', (e) => {
            this.handleFilterChange('difficulty', e.target.value);
        });

        this.elements.timeSelect?.addEventListener('change', (e) => {
            this.handleFilterChange('time', e.target.value);
        });

        this.elements.resetFiltersBtn?.addEventListener('click', () => this.resetFilters());

        // Theme Toggle
        this.elements.themeToggle?.addEventListener('click', (e) => {
            this.createRipple(e);
            this.toggleTheme();
        });

        // Sound Toggle
        this.elements.soundToggle?.addEventListener('click', (e) => {
            this.createRipple(e);
            this.state.soundEnabled = !this.state.soundEnabled;
            this.elements.soundToggle.innerHTML = this.state.soundEnabled ? '🔊' : '🔇';
            this.showToast(this.state.soundEnabled ? 'Sound enabled 🔊' : 'Sound muted 🔇');
            if (this.state.soundEnabled) this.playSound(600, 'triangle', 0.15);
        });

        // Mobile Sidebar
        this.elements.sidebarToggle?.addEventListener('click', (e) => {
            this.createRipple(e);
            this.elements.sidebar?.classList.toggle('active');
        });

        // Random Recipe ("Surprise Me!")
        this.elements.randomBtn?.addEventListener('click', (e) => {
            this.createRipple(e);
            const pool = this.state.filteredRecipes.length > 0 ? this.state.filteredRecipes : this.state.recipes;
            if (!pool.length) return;
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selected = pool[randomIndex];
            this.showToast(`🎲 Selected: ${selected.title}!`);
            this.playSound(587.33, 'triangle', 0.2);
            this.openModal(selected);
        });

        // Event Delegation for Recipe Grid
        this.elements.grid?.addEventListener('click', (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;
            const recipeId = parseInt(card.dataset.id, 10);
            const recipe = this.state.recipes.find(r => r.id === recipeId);

            if (e.target.closest('.favorite-btn')) {
                e.stopPropagation();
                this.toggleFavorite(recipeId, e);
                return;
            }

            if (e.target.closest('.star')) {
                e.stopPropagation();
                const star = e.target.closest('.star');
                const rating = parseInt(star.dataset.rating, 10);
                this.rateRecipe(recipeId, rating);
                return;
            }

            if (recipe) {
                this.createRipple(e);
                this.openModal(recipe);
            }
        });

        // 3D Card Tilt & Magnetic Buttons
        document.addEventListener('mousemove', (e) => {
            this.handleCardTilt(e);
            this.handleMagneticButtons(e);
        });

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNav(e));
        
        // Modal Close Listeners
        this.elements.modalCloseBtn?.addEventListener('click', () => this.closeModal());
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });
    },

    handleFilterChange(type, value) {
        if (type === 'category') this.state.currentCategory = value;
        if (type === 'search') this.state.searchQuery = (value || '').toLowerCase().trim();
        if (type === 'difficulty') this.state.difficultyFilter = value;
        if (type === 'time') this.state.timeFilter = value;

        this.filterRecipes();
    },

    filterRecipes() {
        if (this.elements.grid) {
            this.elements.grid.style.opacity = '0.3';
            this.elements.grid.style.transform = 'scale(0.98)';
        }

        setTimeout(() => {
            this.state.filteredRecipes = this.state.recipes.filter(recipe => {
                // Category match
                let matchCategory = false;
                if (this.state.currentCategory === 'all') {
                    matchCategory = true;
                } else if (this.state.currentCategory === 'favorites') {
                    matchCategory = this.state.favorites.includes(recipe.id);
                } else {
                    matchCategory = recipe.category === this.state.currentCategory;
                }
                
                // Search match
                let matchSearch = true;
                if (this.state.searchQuery) {
                    const q = this.state.searchQuery;
                    matchSearch = (recipe.title && recipe.title.toLowerCase().includes(q)) ||
                                  (recipe.description && recipe.description.toLowerCase().includes(q)) ||
                                  (recipe.cuisine && recipe.cuisine.toLowerCase().includes(q)) ||
                                  (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(q))) ||
                                  (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(q)));
                }
                                    
                // Difficulty match
                let matchDifficulty = true;
                if (this.state.difficultyFilter !== 'all') {
                    matchDifficulty = recipe.difficulty === this.state.difficultyFilter;
                }
                
                // Time match
                let matchTime = true;
                if (this.state.timeFilter !== 'all') {
                    const time = parseInt(recipe.totalTime, 10);
                    if (this.state.timeFilter === '15') matchTime = time <= 15;
                    else if (this.state.timeFilter === '30') matchTime = time <= 30;
                    else if (this.state.timeFilter === '45') matchTime = time <= 45;
                    else if (this.state.timeFilter === '60') matchTime = time <= 60;
                    else if (this.state.timeFilter === 'quick') matchTime = time <= 30;
                    else if (this.state.timeFilter === 'medium') matchTime = time > 30 && time <= 60;
                    else if (this.state.timeFilter === 'long') matchTime = time > 60;
                    else {
                        const parsedNum = parseInt(this.state.timeFilter, 10);
                        if (!isNaN(parsedNum)) matchTime = time <= parsedNum;
                    }
                }

                return matchCategory && matchSearch && matchDifficulty && matchTime;
            });

            this.updateSectionTitles();
            this.renderCards(this.state.filteredRecipes);
            this.updateNavBadges();

            if (this.elements.grid) {
                this.elements.grid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.elements.grid.style.opacity = '1';
                this.elements.grid.style.transform = 'scale(1)';
            }
        }, 150);
    },

    updateSectionTitles() {
        if (!this.elements.sectionTitle) return;
        const titles = {
            'all': 'All Culinary Creations',
            'breakfast': 'Energizing Breakfasts',
            'main': 'Signature Main Dishes',
            'soup-salad': 'Fresh Soups & Crisp Salads',
            'dessert': 'Artisan Desserts & Pastries',
            'drinks': 'Refreshing Drinks & Smoothies',
            'favorites': 'Your Saved Favorites'
        };

        const count = this.state.filteredRecipes.length;
        this.elements.sectionTitle.textContent = titles[this.state.currentCategory] || 'Curated Recipes';
        if (this.elements.sectionSubtitle) {
            this.elements.sectionSubtitle.textContent = `Showing ${count} exquisite recipe${count !== 1 ? 's' : ''}`;
        }
    },

    renderCards(recipesList) {
        if (!this.elements.grid) return;
        const noResults = document.getElementById('no-results');
        
        if (recipesList.length === 0) {
            this.elements.grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        this.elements.grid.innerHTML = recipesList.map((recipe, index) => this.generateCardHTML(recipe, index)).join('');
        this.setupIntersectionObserver();
    },

    generateCardHTML(recipe, index) {
        const isFav = this.state.favorites.includes(recipe.id);
        const userRating = this.state.ratings[recipe.id] || recipe.rating || 5;
        const roundedRating = Math.round(userRating);
        
        const stars = Array(5).fill(0).map((_, i) => 
            `<span class="star ${i < roundedRating ? 'active' : ''}" data-rating="${i + 1}">★</span>`
        ).join('');
        
        const diffColor = (recipe.difficulty || 'Easy').toLowerCase();
        const cuisine = recipe.cuisine ? `<span class="tag cuisine-tag">🌍 ${recipe.cuisine}</span>` : '';
        const cal = recipe.calories ? `<span class="tag cal-tag">🔥 ${recipe.calories} kcal</span>` : '';

        return `
            <article class="recipe-card" data-id="${recipe.id}" tabindex="0" role="button" aria-label="${recipe.title}" style="--animation-order: ${index % 12};">
                <div class="card-glow"></div>
                <div class="card-image-wrapper recipe-card-image-wrapper">
                    <img src="${recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}" 
                         alt="${recipe.title}" 
                         class="recipe-card-image" 
                         loading="lazy" 
                         onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'">
                    
                    <button class="favorite-btn ${isFav ? 'active' : ''}" aria-label="Toggle Favorite" title="Save to Favorites">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                    
                    <div class="card-badges">
                        <span class="recipe-badge badge difficulty-${diffColor}">
                            ${recipe.difficulty || 'Easy'}
                        </span>
                        <span class="recipe-badge badge time-badge">
                            ⏱ ${recipe.totalTime || 20}m
                        </span>
                    </div>
                </div>
                
                <div class="card-content recipe-card-content">
                    <div class="card-cuisine-meta">
                        ${cuisine}
                        ${cal}
                    </div>
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-card-description">${recipe.description || 'Delicious home-crafted culinary recipe.'}</p>
                    
                    <div class="card-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-value">${Number(userRating).toFixed(1)}</span>
                        ${recipe.ratingCount ? `<span class="rating-count">(${recipe.ratingCount})</span>` : ''}
                    </div>
                    
                    <div class="card-tags tags">
                        ${(recipe.tags || []).slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>

                    <div class="card-footer-action">
                        <span class="view-recipe-link">View Recipe & Cooking Mode →</span>
                    </div>
                </div>
            </article>
        `;
    },

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const order = parseInt(card.style.getPropertyValue('--animation-order') || 0, 10);
                    setTimeout(() => {
                        card.classList.add('card-visible');
                    }, order * 40);
                    observer.unobserve(card);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

        document.querySelectorAll('.recipe-card:not(.card-visible)').forEach(card => observer.observe(card));
    },

    handleCardTilt(e) {
        const card = e.target.closest('.recipe-card');
        if (!card) {
            document.querySelectorAll('.recipe-card.is-tilted').forEach(c => {
                c.classList.remove('is-tilted');
                c.style.transform = '';
                const glow = c.querySelector('.card-glow');
                if (glow) glow.style.background = '';
            });
            return;
        }

        card.classList.add('is-tilted');
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Gentle 3D perspective tilt
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px) scale3d(1.02, 1.02, 1.02)`;
        
        const glow = card.querySelector('.card-glow');
        if (glow) {
            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(249, 115, 22, 0.25) 0%, rgba(139, 92, 246, 0.15) 35%, transparent 70%)`;
        }
    },

    handleMagneticButtons(e) {
        document.querySelectorAll('.magnetic-btn, .btn, .nav-item').forEach(btn => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            
            if (Math.abs(x) < 40 && Math.abs(y) < 40) {
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            } else {
                if (btn.style.transform && btn.style.transform !== 'none') {
                    btn.style.transform = '';
                }
            }
        });
    },

    createRipple(event) {
        const button = event.currentTarget;
        if (!button) return;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const oldRipple = button.querySelector('.ripple');
        if (oldRipple) oldRipple.remove();

        button.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    },

    toggleFavorite(id, event) {
        const numId = parseInt(id, 10);
        const index = this.state.favorites.indexOf(numId);
        
        if (index > -1) {
            this.state.favorites.splice(index, 1);
            this.showToast('Removed from favorites');
            this.playSound(350, 'sine', 0.1);
        } else {
            this.state.favorites.push(numId);
            this.showToast('Saved to favorites! ❤️');
            this.triggerConfetti(event.clientX, event.clientY);
            this.playSound(523.25, 'triangle', 0.25);
        }
        
        localStorage.setItem('cookedFavorites', JSON.stringify(this.state.favorites));
        
        // Update DOM selectively
        const btn = document.querySelector(`.recipe-card[data-id="${numId}"] .favorite-btn`);
        if (btn) {
            btn.classList.toggle('active', index === -1);
            btn.innerHTML = index === -1 ? '❤️' : '🤍';
        }
        
        this.updateNavBadges();
        
        if (this.state.currentCategory === 'favorites') {
            this.filterRecipes();
        }
    },

    rateRecipe(id, rating) {
        const numId = parseInt(id, 10);
        this.state.ratings[numId] = rating;
        localStorage.setItem('cookedRatings', JSON.stringify(this.state.ratings));
        this.showToast(`Rated ${rating} stars! ⭐`);
        this.playSound(659.25, 'sine', 0.15);
        
        const card = document.querySelector(`.recipe-card[data-id="${numId}"]`);
        if (card) {
            const stars = card.querySelectorAll('.star');
            stars.forEach((star, i) => {
                star.classList.toggle('active', i < rating);
            });
            const val = card.querySelector('.rating-value');
            if (val) val.textContent = rating.toFixed(1);
        }
    },

    triggerConfetti(x, y) {
        const posX = x || window.innerWidth / 2;
        const posY = y || window.innerHeight / 2;
        const colors = ['#f97316', '#ea580c', '#8b5cf6', '#10b981', '#fbbf24', '#ec4899'];

        for (let i = 0; i < 35; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = posX + 'px';
            confetti.style.top = posY + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            document.body.appendChild(confetti);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 4 + Math.random() * 9;
            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity - 3;
            let tick = 0;

            const animate = () => {
                tick++;
                vy += 0.35; // gravity
                vx *= 0.98; // drag
                const curX = parseFloat(confetti.style.left) + vx;
                const curY = parseFloat(confetti.style.top) + vy;
                confetti.style.left = curX + 'px';
                confetti.style.top = curY + 'px';
                confetti.style.transform = `rotate(${tick * 12}deg) scale(${Math.max(0.2, 1 - tick / 60)})`;
                
                if (tick < 60) requestAnimationFrame(animate);
                else confetti.remove();
            };
            requestAnimationFrame(animate);
        }
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (this.elements.toastContainer) {
            this.elements.toastContainer.appendChild(toast);
        } else {
            document.body.appendChild(toast);
        }
        
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 3200);
    },

    updateNavBadges() {
        this.elements.navItems?.forEach(item => {
            const filter = item.getAttribute('data-filter');
            let count = 0;
            if (filter === 'all') count = this.state.recipes.length;
            else if (filter === 'favorites') count = this.state.favorites.length;
            else count = this.state.recipes.filter(r => r.category === filter).length;
            
            const badge = item.querySelector('.badge') || item.querySelector('.nav-badge');
            if (badge) {
                badge.textContent = count;
            }
        });

        const favCount = document.getElementById('count-fav');
        if (favCount) favCount.textContent = this.state.favorites.length;
    },

    animateCounters() {
        const statTotal = document.getElementById('total-recipes-stat') || document.querySelector('.hero-stats .stat-num');
        if (statTotal) {
            const target = this.state.recipes.length || 40;
            let count = 0;
            const duration = 1200;
            const stepTime = Math.max(20, Math.floor(duration / target));
            const timer = setInterval(() => {
                count++;
                statTotal.textContent = count;
                if (count >= target) {
                    clearInterval(timer);
                    statTotal.textContent = target;
                }
            }, stepTime);
        }
    },

    // Web Audio Synthesizer
    playSound(frequency, type = 'sine', duration = 0.15) {
        if (!this.state.soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Audio context policy or disabled
        }
    },

    // Theme Toggle
    toggleTheme() {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    },

    applyTheme(theme) {
        this.state.theme = theme;
        localStorage.setItem('cookedTheme', theme);
        document.body.setAttribute('data-theme', theme);
        if (this.elements.themeToggle) {
            this.elements.themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
            this.elements.themeToggle.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        }
    },

    // Ambient Particle Canvas System
    setupParticleSystem() {
        if (!this.elements.canvas) return;
        const ctx = this.elements.canvas.getContext('2d');
        if (!ctx) return;
        
        const emojis = ['🍳', '🍕', '🥗', '🍰', '🥐', '🍝', '🍹', '🥘', '🧁', '🥑', '🍜', '🍓'];
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        this.elements.canvas.width = width;
        this.elements.canvas.height = height;

        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            if (this.elements.canvas) {
                this.elements.canvas.width = width;
                this.elements.canvas.height = height;
            }
        });

        this.state.particles = [];
        const particleCount = Math.min(24, Math.floor(width / 50));
        for (let i = 0; i < particleCount; i++) {
            this.state.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                size: Math.random() * 18 + 14,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.5 - 0.15,
                rotation: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.015,
                opacity: Math.random() * 0.18 + 0.06
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            this.state.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.vrot;

                if (p.y < -40) p.y = height + 40;
                if (p.x < -40) p.x = width + 40;
                if (p.x > width + 40) p.x = -40;

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.font = `${p.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.emoji, 0, 0);
                ctx.restore();
            });

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    // Modal Details View with 3D Entrance & Cooking Timer
    openModal(recipe) {
        if (!this.elements.modal || !recipe) return;
        const targetContainer = this.elements.modalContent || document.getElementById('modal-content') || this.elements.modal.querySelector('.modal-dialog');
        if (!targetContainer) return;

        const isFav = this.state.favorites.includes(recipe.id);
        const calories = recipe.calories ? `${recipe.calories} kcal` : 'N/A';
        const protein = recipe.protein || 'N/A';
        const carbs = recipe.carbs || 'N/A';
        const fat = recipe.fat || 'N/A';

        targetContainer.innerHTML = `
            <div class="modal-inner-wrapper">
                <div class="modal-hero-cover" style="background-image: url('${recipe.image || ''}')">
                    <div class="modal-cover-overlay">
                        <span class="recipe-badge difficulty-${(recipe.difficulty || 'Easy').toLowerCase()}">
                            ${recipe.difficulty || 'Easy'}
                        </span>
                        ${recipe.cuisine ? `<span class="recipe-badge cuisine-badge">🌍 ${recipe.cuisine}</span>` : ''}
                    </div>
                </div>

                <div class="modal-main-content">
                    <div class="modal-header-section">
                        <h2 class="modal-title">${recipe.title}</h2>
                        <p class="modal-desc">${recipe.description || ''}</p>
                        
                        <div class="modal-meta-row">
                            <div class="meta-pill">⏱ Prep: <strong>${recipe.prepTime || 10}m</strong></div>
                            <div class="meta-pill">🔥 Cook: <strong>${recipe.cookTime || 15}m</strong></div>
                            <div class="meta-pill">⏳ Total: <strong>${recipe.totalTime || 25}m</strong></div>
                            <div class="meta-pill">🍽 Servings: <strong>${recipe.servings || 4}</strong></div>
                        </div>

                        <!-- Nutrition Bar -->
                        <div class="nutrition-strip">
                            <div class="nutri-item"><span>Calories</span><strong>${calories}</strong></div>
                            <div class="nutri-item"><span>Protein</span><strong>${protein}</strong></div>
                            <div class="nutri-item"><span>Carbs</span><strong>${carbs}</strong></div>
                            <div class="nutri-item"><span>Fat</span><strong>${fat}</strong></div>
                        </div>
                    </div>

                    <!-- Interactive Cooking Timer -->
                    <div class="cooking-timer-box">
                        <div class="timer-info">
                            <span class="timer-icon">⏱️</span>
                            <div>
                                <h4 style="margin:0; font-size:1rem;">Interactive Kitchen Timer</h4>
                                <small style="color:var(--text-secondary)">Step timer for ${recipe.cookTime || 15} minutes cook phase</small>
                            </div>
                        </div>
                        <div class="timer-interface">
                            <div class="timer-countdown" id="timer-modal-display">${String(recipe.cookTime || 15).padStart(2, '0')}:00</div>
                            <div class="timer-buttons">
                                <button class="btn btn-primary timer-start-btn" id="modal-timer-toggle-btn">Start Timer</button>
                                <button class="btn btn-secondary timer-reset-btn" id="modal-timer-reset-btn">Reset</button>
                            </div>
                        </div>
                    </div>

                    <!-- Grid Layout for Ingredients & Instructions -->
                    <div class="recipe-blueprint-grid">
                        <div class="ingredients-column">
                            <h3>🛒 Ingredients (${(recipe.ingredients || []).length})</h3>
                            <ul class="ingredients-checklist">
                                ${(recipe.ingredients || []).map((ing, idx) => `
                                    <li class="ingredient-row">
                                        <label>
                                            <input type="checkbox" id="ing-${idx}">
                                            <span>${ing}</span>
                                        </label>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="instructions-column">
                            <h3>👨‍🍳 Step-by-Step Instructions</h3>
                            <ol class="instructions-steplist">
                                ${(recipe.instructions || []).map((step, idx) => `
                                    <li class="instruction-step">
                                        <div class="step-num">${idx + 1}</div>
                                        <div class="step-text">${step}</div>
                                    </li>
                                `).join('')}
                            </ol>

                            ${recipe.tip ? `
                                <div class="modal-chef-tip">
                                    <div class="tip-title">💡 Master Chef's Secret</div>
                                    <p>${recipe.tip}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="modal-action-bar">
                        <button class="btn btn-secondary" onclick="window.print()">🖨 Print Recipe Card</button>
                        <button class="btn ${isFav ? 'btn-primary' : 'btn-secondary'} modal-fav-btn" id="modal-save-btn">
                            ${isFav ? '❤️ Saved in Favorites' : '🤍 Save to Favorites'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.elements.modal.classList.add('active', 'show');
        this.elements.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Re-bind modal close button inside dialog if necessary
        const closeBtn = this.elements.modal.querySelector('#modal-close-btn') || this.elements.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        // Timer bindings in modal
        this.initModalTimer(recipe.cookTime || 15);

        // Favorite button inside modal
        const modalFav = document.getElementById('modal-save-btn');
        if (modalFav) {
            modalFav.onclick = (e) => {
                this.toggleFavorite(recipe.id, e);
                const isNowFav = this.state.favorites.includes(recipe.id);
                modalFav.innerHTML = isNowFav ? '❤️ Saved in Favorites' : '🤍 Save to Favorites';
                modalFav.className = `btn ${isNowFav ? 'btn-primary' : 'btn-secondary'} modal-fav-btn`;
            };
        }
    },

    initModalTimer(minutes) {
        clearInterval(this.state.timerInterval);
        this.state.isTimerRunning = false;
        this.state.timerTotal = minutes * 60;
        this.state.timerRemaining = this.state.timerTotal;

        const display = document.getElementById('timer-modal-display');
        const toggleBtn = document.getElementById('modal-timer-toggle-btn');
        const resetBtn = document.getElementById('modal-timer-reset-btn');

        if (!display || !toggleBtn || !resetBtn) return;

        const format = (secs) => {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        display.textContent = format(this.state.timerRemaining);

        toggleBtn.onclick = () => {
            if (this.state.isTimerRunning) {
                // Pause
                clearInterval(this.state.timerInterval);
                this.state.isTimerRunning = false;
                toggleBtn.textContent = 'Resume Timer';
                toggleBtn.className = 'btn btn-primary timer-start-btn';
                this.showToast('Timer paused ⏸');
            } else {
                // Start
                this.state.isTimerRunning = true;
                toggleBtn.textContent = 'Pause Timer';
                toggleBtn.className = 'btn btn-secondary timer-pause-btn';
                this.showToast('Timer started! ⏰');
                this.playSound(600, 'sine', 0.15);

                this.state.timerInterval = setInterval(() => {
                    this.state.timerRemaining--;
                    display.textContent = format(Math.max(0, this.state.timerRemaining));

                    if (this.state.timerRemaining <= 0) {
                        clearInterval(this.state.timerInterval);
                        this.state.isTimerRunning = false;
                        toggleBtn.textContent = 'Start Timer';
                        this.playSound(880, 'square', 0.8);
                        this.showToast('Ding! Cooking timer finished! 🍳✨');
                    }
                }, 1000);
            }
        };

        resetBtn.onclick = () => {
            clearInterval(this.state.timerInterval);
            this.state.isTimerRunning = false;
            this.state.timerRemaining = this.state.timerTotal;
            display.textContent = format(this.state.timerRemaining);
            toggleBtn.textContent = 'Start Timer';
            toggleBtn.className = 'btn btn-primary timer-start-btn';
        };
    },

    closeModal() {
        if (!this.elements.modal) return;
        this.elements.modal.classList.remove('active', 'show');
        this.elements.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        clearInterval(this.state.timerInterval);
        this.state.isTimerRunning = false;
    },

    handleKeyboardNav(e) {
        if (this.elements.modal?.classList.contains('active')) {
            if (e.key === 'Escape') this.closeModal();
            return;
        }

        const cards = Array.from(document.querySelectorAll('.recipe-card'));
        if (!cards.length) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.state.focusedCardIndex = (this.state.focusedCardIndex + 1) % cards.length;
            cards[this.state.focusedCardIndex].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.state.focusedCardIndex = (this.state.focusedCardIndex - 1 + cards.length) % cards.length;
            cards[this.state.focusedCardIndex].focus();
        } else if (e.key === 'Enter') {
            if (this.state.focusedCardIndex >= 0) {
                const card = cards[this.state.focusedCardIndex];
                if (document.activeElement === card) {
                    const id = parseInt(card.dataset.id, 10);
                    const recipe = this.state.recipes.find(r => r.id === id);
                    if (recipe) this.openModal(recipe);
                }
            }
        }
    },

    setupRandomTip() {
        const tipEl = document.getElementById('daily-tip');
        if (!tipEl) return;
        const tips = [
            "Salt in stages throughout cooking, not just at the end!",
            "Rest roasted meats 5-10 minutes before slicing to keep them juicy.",
            "Use room temperature eggs and butter for perfectly fluffy baked goods.",
            "Always dry meat with paper towels before searing for that golden crust.",
            "Save your starchy pasta water - it is liquid gold for silky pasta sauces!",
            "Toast your whole spices in a dry skillet to wake up their aromatic oils.",
            "A sharp chef's knife is vastly safer and more precise than a dull one."
        ];

        let index = Math.floor(Math.random() * tips.length);
        tipEl.textContent = tips[index];

        setInterval(() => {
            index = (index + 1) % tips.length;
            tipEl.style.opacity = '0';
            setTimeout(() => {
                tipEl.textContent = tips[index];
                tipEl.style.opacity = '1';
            }, 300);
        }, 15000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    resetFilters() {
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.clearSearchBtn) this.elements.clearSearchBtn.classList.add('hidden');
        if (this.elements.difficultySelect) this.elements.difficultySelect.value = 'all';
        if (this.elements.timeSelect) this.elements.timeSelect.value = 'all';
        
        this.state.searchQuery = '';
        this.state.difficultyFilter = 'all';
        this.state.timeFilter = 'all';
        this.state.currentCategory = 'all';
        
        this.elements.navItems?.forEach(nav => nav.classList.remove('active'));
        const allNav = Array.from(this.elements.navItems || []).find(n => n.dataset.filter === 'all');
        if (allNav) allNav.classList.add('active');
        
        this.showToast('Filters reset ↺');
        this.filterRecipes();
    }
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => App.init());