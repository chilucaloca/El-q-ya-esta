/**
 * ============================================================
 *  ShopSystem — Dental Adventure
 * ============================================================
 *  Manages the cosmetic shop: categories, buying, equipping,
 *  and rendering the shop UI.
 * ============================================================
 */
window.ShopSystem = (function () {

  /* --------------------------------------------------------
   *  Shop item categories
   * ------------------------------------------------------ */
  const CATEGORIES = [
    {
      id: 'gloves',
      name: '🧤 Guantes',
      items: [
        { id: 'glove-blue',  name: 'Azul Clásico',    color: '#4488dd', price: 0   },
        { id: 'glove-pink',  name: 'Rosa',             color: '#dd66aa', price: 75  },
        { id: 'glove-black', name: 'Negro Elegante',   color: '#333344', price: 100 },
        { id: 'glove-gold',  name: 'Dorado Premium',   color: '#ddaa33', price: 200 },
        { id: 'glove-neon',  name: 'Neón',             color: '#33ffaa', price: 150 },
      ]
    },
    {
      id: 'brushColor',
      name: '🪥 Color Cepillo',
      items: [
        { id: 'brush-default', name: 'Azul Estándar',  color: '#4488ff', price: 0   },
        { id: 'brush-pink',    name: 'Rosa Chicle',     color: '#ff66aa', price: 50  },
        { id: 'brush-green',   name: 'Verde Menta',     color: '#44ddaa', price: 50  },
        { id: 'brush-purple',  name: 'Morado Real',     color: '#aa66ff', price: 80  },
        { id: 'brush-rainbow', name: 'Arcoíris',        color: 'rainbow', price: 200 },
        { id: 'brush-gold',    name: 'Oro',              color: '#ffcc00', price: 250 },
      ]
    },
    {
      id: 'instrumentSkin',
      name: '⚙️ Skin Instrumentos',
      items: [
        { id: 'skin-default',    name: 'Clásico',     color: '#aaaaaa', price: 0   },
        { id: 'skin-futuristic', name: 'Futurista',   color: '#00ccff', price: 150 },
        { id: 'skin-retro',      name: 'Retro',       color: '#cc8844', price: 120 },
        { id: 'skin-diamond',    name: 'Diamante',    color: '#88ddff', price: 300 },
        { id: 'skin-neon',       name: 'Neón Rosa',   color: '#ff44aa', price: 200 },
      ]
    },
    {
      id: 'effects',
      name: '✨ Efectos',
      items: [
        { id: 'effect-none',    name: 'Sin Efecto',       color: '#666666', price: 0   },
        { id: 'effect-sparkle', name: 'Destellos',        color: '#ffdd44', price: 200 },
        { id: 'effect-rainbow', name: 'Estela Arcoíris',  color: 'rainbow', price: 400 },
        { id: 'effect-stars',   name: 'Estrellas',        color: '#ffffff', price: 250 },
      ]
    },
    {
      id: 'background',
      name: '🏥 Consultorio',
      items: [
        { id: 'bg-default',  name: 'Clásico',     color: '#1a2040', price: 0   },
        { id: 'bg-modern',   name: 'Moderno',     color: '#0a1628', price: 150 },
        { id: 'bg-space',    name: 'Espacial',    color: '#0a0020', price: 250 },
        { id: 'bg-tropical', name: 'Tropical',    color: '#0a2820', price: 200 },
        { id: 'bg-sunset',   name: 'Atardecer',   color: '#281020', price: 200 },
      ]
    }
  ];

  /* --------------------------------------------------------
   *  Internal state
   * ------------------------------------------------------ */
  let selectedCategory = 'gloves';

  /* --------------------------------------------------------
   *  Helpers
   * ------------------------------------------------------ */

  /** Find the category an item belongs to */
  function findCategory(itemId) {
    for (const cat of CATEGORIES) {
      if (cat.items.find(i => i.id === itemId)) return cat;
    }
    return null;
  }

  /** Find an item by ID across all categories */
  function findItem(itemId) {
    for (const cat of CATEGORIES) {
      const item = cat.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  /** Build a CSS background for a color — handles 'rainbow' */
  function colorToCSS(color) {
    if (color === 'rainbow') {
      return 'linear-gradient(135deg, #ff4444, #ffaa33, #ffff44, #44ff44, #4488ff, #aa44ff)';
    }
    return color;
  }

  /* --------------------------------------------------------
   *  Public API
   * ------------------------------------------------------ */
  return {
    /** Expose categories (read-only) */
    get categories() { return CATEGORIES; },

    /* -------------------------------------------------------
     *  init — set default owned/equipped from Game state
     * ----------------------------------------------------- */
    init() {
      // Ensure Game has ownedItems and equippedItems initialized
      if (typeof Game !== 'undefined') {
        if (!Game.ownedItems) {
          Game.ownedItems = [];
        }
        if (!Game.equippedItems) {
          Game.equippedItems = {};
        }
        // All free items are owned by default
        CATEGORIES.forEach(cat => {
          cat.items.forEach(item => {
            if (item.price === 0) {
              if (Game.ownedItems.indexOf(item.id) === -1) {
                Game.ownedItems.push(item.id);
              }
              // Equip default free items if nothing equipped yet
              if (!Game.equippedItems[cat.id]) {
                Game.equippedItems[cat.id] = item.id;
              }
            }
          });
        });
      }
      selectedCategory = 'gloves';
    },

    /* -------------------------------------------------------
     *  renderShop — render category tabs and items grid
     * ----------------------------------------------------- */
    renderShop() {
      this._renderCategoryTabs();
      this._renderItems();
    },

    /* -------------------------------------------------------
     *  selectCategory — switch visible category
     * ----------------------------------------------------- */
    selectCategory(catId) {
      selectedCategory = catId;
      this.renderShop();
    },

    /* -------------------------------------------------------
     *  buyItem — purchase an item with coins
     * ----------------------------------------------------- */
    buyItem(itemId) {
      const item = findItem(itemId);
      if (!item) return false;
      if (typeof Game === 'undefined') return false;

      if (Game.coins < item.price) {
        // Not enough coins
        if (typeof AudioSystem !== 'undefined') AudioSystem.play('error');
        return false;
      }

      // Deduct coins
      Game.coins -= item.price;
      if (Game.ownedItems.indexOf(itemId) === -1) {
        Game.ownedItems.push(itemId);
      }

      // Auto-equip upon purchase
      const cat = findCategory(itemId);
      if (cat) {
        Game.equippedItems[cat.id] = itemId;
      }

      // Play purchase sound
      if (typeof AudioSystem !== 'undefined') AudioSystem.play('coin');

      // Persist and re-render
      if (Game.save) Game.save();
      this.renderShop();

      // Update coins display
      if (Game.updateCoinsDisplay) Game.updateCoinsDisplay();

      return true;
    },

    /* -------------------------------------------------------
     *  equipItem — equip an owned item
     * ----------------------------------------------------- */
    equipItem(itemId) {
      if (typeof Game === 'undefined') return;
      if (!Game.ownedItems || Game.ownedItems.indexOf(itemId) === -1) return;

      const cat = findCategory(itemId);
      if (!cat) return;

      Game.equippedItems[cat.id] = itemId;

      if (typeof AudioSystem !== 'undefined') AudioSystem.play('click');
      if (Game.save) Game.save();
      this.renderShop();
    },

    /* -------------------------------------------------------
     *  handleItemClick — buy or equip depending on status
     * ----------------------------------------------------- */
    handleItemClick(itemId) {
      if (!this.isOwned(itemId)) {
        this.buyItem(itemId);
      } else if (!this.isEquipped(itemId)) {
        this.equipItem(itemId);
      }
      // If already equipped, do nothing
    },

    /* -------------------------------------------------------
     *  isOwned — check if the player owns the item
     * ----------------------------------------------------- */
    isOwned(itemId) {
      if (typeof Game === 'undefined' || !Game.ownedItems) return false;
      return Game.ownedItems.indexOf(itemId) !== -1;
    },

    /* -------------------------------------------------------
     *  isEquipped — check if the item is currently equipped
     * ----------------------------------------------------- */
    isEquipped(itemId) {
      if (typeof Game === 'undefined' || !Game.equippedItems) return false;
      const cat = findCategory(itemId);
      if (!cat) return false;
      return Game.equippedItems[cat.id] === itemId;
    },

    /* -------------------------------------------------------
     *  getEquippedColor — get the color of the equipped item
     *  in a given category
     * ----------------------------------------------------- */
    getEquippedColor(category) {
      if (typeof Game === 'undefined' || !Game.equippedItems) return null;
      const equippedId = Game.equippedItems[category];
      if (!equippedId) return null;
      const item = findItem(equippedId);
      return item ? item.color : null;
    },

    /* -------------------------------------------------------
     *  _renderCategoryTabs (private)
     * ----------------------------------------------------- */
    _renderCategoryTabs() {
      const container = document.getElementById('shop-categories');
      if (!container) return;

      container.innerHTML = '';
      CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'shop-cat-btn';
        if (cat.id === selectedCategory) btn.classList.add('active');
        btn.textContent = cat.name;
        btn.onclick = () => this.selectCategory(cat.id);
        container.appendChild(btn);
      });
    },

    /* -------------------------------------------------------
     *  _renderItems (private)
     * ----------------------------------------------------- */
    _renderItems() {
      const grid = document.getElementById('shop-items-grid');
      if (!grid) return;

      grid.innerHTML = '';

      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (!cat) return;

      cat.items.forEach(item => {
        const owned = this.isOwned(item.id);
        const equipped = this.isEquipped(item.id);

        const card = document.createElement('div');
        card.className = 'shop-item';
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');

        // Color preview circle
        const preview = document.createElement('div');
        preview.className = 'shop-item-preview';
        if (item.color === 'rainbow') {
          preview.style.background = colorToCSS('rainbow');
        } else {
          preview.style.backgroundColor = item.color;
        }

        // Item name
        const nameEl = document.createElement('div');
        nameEl.className = 'shop-item-name';
        nameEl.textContent = item.name;

        // Status / price badge
        const badge = document.createElement('div');
        if (equipped) {
          badge.className = 'shop-item-badge status-equipped';
          badge.textContent = '✓ Equipado';
        } else if (owned) {
          badge.className = 'shop-item-badge status-owned';
          badge.textContent = 'Comprado';
        } else {
          badge.className = 'shop-item-badge shop-item-price';
          badge.textContent = `🪙 ${item.price}`;
        }

        card.appendChild(preview);
        card.appendChild(nameEl);
        card.appendChild(badge);

        card.onclick = () => this.handleItemClick(item.id);

        grid.appendChild(card);
      });
    }
  };
})();
