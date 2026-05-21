/**
 * ============================================================
 *  LevelSystem — Dental Adventure
 * ============================================================
 *  Stores level / patient data, handles level unlocking,
 *  and renders the level-select grid UI.
 * ============================================================
 */
window.LevelSystem = (function () {

  /* --------------------------------------------------------
   *  Level definitions
   * ------------------------------------------------------ */
  const LEVELS = [
    {
      id: 0,
      patientName: 'Sofía',
      patientAvatar: '👧',
      patientAge: 8,
      description: 'Primera visita de Sofía. Tiene algo de placa en los dientes frontales.',
      difficulty: 1,
      timeTarget: 120,
      instruments: ['brush', 'mirror'],
      teethProblems: [
        { toothId: 'upper-right-central-incisor', plaque: 60, tartar: 0, cavity: 0 },
        { toothId: 'upper-left-central-incisor',  plaque: 55, tartar: 0, cavity: 0 },
        { toothId: 'upper-right-lateral-incisor',  plaque: 40, tartar: 0, cavity: 0 },
        { toothId: 'lower-left-central-incisor',   plaque: 45, tartar: 0, cavity: 0 },
      ],
      diagnosisAnswer: [
        'upper-right-central-incisor',
        'upper-left-central-incisor',
        'upper-right-lateral-incisor',
        'lower-left-central-incisor'
      ]
    },
    {
      id: 1,
      patientName: 'Carlos',
      patientAvatar: '👦',
      patientAge: 15,
      description: 'Carlos no se ha cepillado bien. Tiene sarro y placa en varias zonas.',
      difficulty: 2,
      timeTarget: 150,
      instruments: ['brush', 'scraper', 'mirror'],
      teethProblems: [
        { toothId: 'upper-right-molar-1',        plaque: 30, tartar: 50, cavity: 0 },
        { toothId: 'upper-left-molar-1',          plaque: 25, tartar: 45, cavity: 0 },
        { toothId: 'lower-right-premolar-1',      plaque: 50, tartar: 30, cavity: 0 },
        { toothId: 'lower-left-canine',           plaque: 40, tartar: 20, cavity: 0 },
        { toothId: 'lower-right-central-incisor', plaque: 35, tartar: 25, cavity: 0 },
        { toothId: 'upper-right-canine',          plaque: 20, tartar: 40, cavity: 0 },
      ],
      diagnosisAnswer: [
        'upper-right-molar-1', 'upper-left-molar-1',
        'lower-right-premolar-1', 'lower-left-canine',
        'lower-right-central-incisor', 'upper-right-canine'
      ]
    },
    {
      id: 2,
      patientName: 'María',
      patientAvatar: '👩',
      patientAge: 34,
      description: 'María tiene caries en dos molares y sarro acumulado. Necesita limpieza profunda.',
      difficulty: 3,
      timeTarget: 180,
      instruments: ['brush', 'scraper', 'drill', 'syringe', 'mirror'],
      teethProblems: [
        { toothId: 'lower-right-molar-1',    plaque: 20, tartar: 40, cavity: 60 },
        { toothId: 'lower-left-molar-2',     plaque: 15, tartar: 35, cavity: 55 },
        { toothId: 'upper-right-premolar-2', plaque: 45, tartar: 50, cavity: 0  },
        { toothId: 'upper-left-premolar-1',  plaque: 40, tartar: 45, cavity: 0  },
        { toothId: 'lower-right-canine',     plaque: 30, tartar: 25, cavity: 0  },
      ],
      diagnosisAnswer: [
        'lower-right-molar-1', 'lower-left-molar-2',
        'upper-right-premolar-2', 'upper-left-premolar-1',
        'lower-right-canine'
      ]
    },
    {
      id: 3,
      patientName: 'Don Roberto',
      patientAvatar: '👴',
      patientAge: 65,
      description: 'Don Roberto lleva años sin ir al dentista. Caso severo de sarro, placa y caries múltiples.',
      difficulty: 4,
      timeTarget: 240,
      instruments: ['brush', 'scraper', 'drill', 'syringe', 'suction', 'mirror'],
      teethProblems: [
        { toothId: 'upper-right-molar-2',       plaque: 50, tartar: 70, cavity: 40 },
        { toothId: 'upper-left-molar-1',         plaque: 40, tartar: 60, cavity: 50 },
        { toothId: 'lower-right-molar-1',        plaque: 35, tartar: 55, cavity: 45 },
        { toothId: 'lower-left-molar-2',         plaque: 45, tartar: 65, cavity: 35 },
        { toothId: 'upper-right-premolar-1',     plaque: 55, tartar: 40, cavity: 0  },
        { toothId: 'lower-left-premolar-2',      plaque: 50, tartar: 45, cavity: 0  },
        { toothId: 'upper-left-canine',          plaque: 30, tartar: 35, cavity: 25 },
        { toothId: 'lower-right-lateral-incisor', plaque: 25, tartar: 30, cavity: 0  },
      ],
      diagnosisAnswer: [
        'upper-right-molar-2', 'upper-left-molar-1',
        'lower-right-molar-1', 'lower-left-molar-2',
        'upper-right-premolar-1', 'lower-left-premolar-2',
        'upper-left-canine', 'lower-right-lateral-incisor'
      ]
    },
    {
      id: 4,
      patientName: 'El Gran Desafío',
      patientAvatar: '🦷',
      patientAge: null,
      description: '¡El desafío final! Una boca con todo tipo de problemas. ¿Podrás dejarla perfecta?',
      difficulty: 5,
      timeTarget: 180,
      instruments: ['brush', 'scraper', 'drill', 'syringe', 'suction', 'mirror'],
      teethProblems: [
        { toothId: 'upper-right-central-incisor', plaque: 40, tartar: 20, cavity: 30 },
        { toothId: 'upper-left-molar-1',          plaque: 60, tartar: 70, cavity: 50 },
        { toothId: 'upper-right-molar-2',         plaque: 55, tartar: 65, cavity: 45 },
        { toothId: 'lower-left-molar-1',          plaque: 50, tartar: 60, cavity: 55 },
        { toothId: 'lower-right-molar-2',         plaque: 45, tartar: 55, cavity: 40 },
        { toothId: 'upper-left-premolar-1',       plaque: 50, tartar: 40, cavity: 20 },
        { toothId: 'lower-right-premolar-2',      plaque: 55, tartar: 45, cavity: 15 },
        { toothId: 'upper-right-canine',          plaque: 35, tartar: 30, cavity: 25 },
        { toothId: 'lower-left-canine',           plaque: 40, tartar: 35, cavity: 20 },
        { toothId: 'lower-left-lateral-incisor',  plaque: 30, tartar: 25, cavity: 10 },
      ],
      diagnosisAnswer: [
        'upper-right-central-incisor', 'upper-left-molar-1',
        'upper-right-molar-2', 'lower-left-molar-1',
        'lower-right-molar-2', 'upper-left-premolar-1',
        'lower-right-premolar-2', 'upper-right-canine',
        'lower-left-canine', 'lower-left-lateral-incisor'
      ]
    }
  ];

  /* --------------------------------------------------------
   *  Internal state
   * ------------------------------------------------------ */
  let currentLevelIndex = 0;

  /* --------------------------------------------------------
   *  Helper — difficulty dots (★ filled, ☆ empty)
   * ------------------------------------------------------ */
  function difficultyDots(level) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="diff-dot ${i <= level ? 'filled' : ''}">${i <= level ? '●' : '○'}</span>`;
    }
    return html;
  }

  /** Generate star display for completed level results */
  function starsHTML(levelId) {
    if (typeof Game === 'undefined') return '';
    const result = Game.completedLevels ? Game.completedLevels[levelId] : null;
    if (!result) return '';
    const stars = result.stars || 0;
    let html = '<div class="level-stars">';
    for (let i = 1; i <= 3; i++) {
      html += i <= stars ? '⭐' : '☆';
    }
    html += '</div>';
    return html;
  }

  /* --------------------------------------------------------
   *  Public API
   * ------------------------------------------------------ */
  return {
    /** Expose levels array (read-only reference) */
    get levels() { return LEVELS; },

    /** Current level index */
    get currentLevelIndex() { return currentLevelIndex; },
    set currentLevelIndex(v) { currentLevelIndex = v; },

    /* -------------------------------------------------------
     *  init — store levels (already embedded above)
     * ----------------------------------------------------- */
    init() {
      currentLevelIndex = 0;
    },

    /* -------------------------------------------------------
     *  getLevel — return level data by index
     * ----------------------------------------------------- */
    getLevel(index) {
      if (index < 0 || index >= LEVELS.length) return null;
      return LEVELS[index];
    },

    /* -------------------------------------------------------
     *  getCurrentLevel — return current level
     * ----------------------------------------------------- */
    getCurrentLevel() {
      return LEVELS[currentLevelIndex] || null;
    },

    /* -------------------------------------------------------
     *  isLevelUnlocked — check unlock status
     * ----------------------------------------------------- */
    isLevelUnlocked(index) {
      // Level 0 is always unlocked
      if (index === 0) return true;
      // For others: previous level must be completed
      if (typeof Game !== 'undefined' && Game.completedLevels) {
        return !!Game.completedLevels[index - 1];
      }
      return false;
    },

    /* -------------------------------------------------------
     *  renderLevelSelect — populate #levels-grid
     * ----------------------------------------------------- */
    renderLevelSelect() {
      const grid = document.getElementById('levels-grid');
      if (!grid) return;

      grid.innerHTML = '';

      LEVELS.forEach((level, idx) => {
        const unlocked = this.isLevelUnlocked(idx);
        const completed = typeof Game !== 'undefined' && Game.completedLevels
          ? !!Game.completedLevels[idx]
          : false;

        const card = document.createElement('div');
        card.className = 'level-card';
        if (completed) card.classList.add('completed');
        if (!unlocked) card.classList.add('locked');

        const ageText = level.patientAge !== null
          ? `<span class="patient-age">${level.patientAge} años</span>`
          : '';

        card.innerHTML = `
          <div class="level-number">Nivel ${idx + 1}</div>
          <div class="patient-avatar">${unlocked ? level.patientAvatar : '🔒'}</div>
          <div class="patient-name">${unlocked ? level.patientName : '???'}</div>
          ${unlocked ? ageText : ''}
          <p class="level-desc">${unlocked ? level.description : 'Completa el nivel anterior para desbloquear.'}</p>
          <div class="level-difficulty">${difficultyDots(level.difficulty)}</div>
          ${completed ? starsHTML(idx) : ''}
        `;

        if (unlocked) {
          card.onclick = () => {
            if (typeof Game !== 'undefined' && Game.selectLevel) {
              Game.selectLevel(idx);
            }
          };
        }

        grid.appendChild(card);
      });
    }
  };
})();
