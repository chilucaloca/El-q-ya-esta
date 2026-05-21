/* ======================================================
   MAIN.JS — Game Engine, State Management, Game Loop
   ====================================================== */

const Game = {
    // --- State ---
    state: 'MENU',
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    mouse: { x: 0, y: 0, canvasX: 0, canvasY: 0, down: false, clicked: false, rightClicked: false },
    dt: 0,
    lastTime: 0,
    coins: 100,
    currentLevelIndex: -1,
    score: 0,
    cleaningScore: 0,
    diagnosisScore: 0,
    timeBonus: 0,
    elapsedTime: 0,
    completedLevels: {},   // { levelIndex: { stars: 3, bestScore: 100 } }
    ownedItems: ['glove-blue'],
    equippedItems: { gloves: 'glove-blue' },
    soundEnabled: true,
    modalCallback: null,
    animFrame: null,
    gameStartTime: 0,

    // --- Initialization ---
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        // Touch events
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.onTouchMove(e); }, { passive: false });
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.onTouchStart(e); }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => { this.onTouchEnd(e); });

        // Also handle mouse on diagnosis canvas
        const dc = document.getElementById('diagnosisCanvas');
        if (dc) {
            dc.addEventListener('click', (e) => {
                if (this.state === 'DIAGNOSIS') DiagnosisSystem.handleClick(e);
            });
            dc.addEventListener('mousemove', (e) => {
                if (this.state === 'DIAGNOSIS') DiagnosisSystem.handleMouseMove(e);
            });
        }

        // Load saved data
        this.load();

        // Init subsystems (with error handling)
        const systems = [
            ['AudioSystem', AudioSystem],
            ['ParticleSystem', ParticleSystem],
            ['TeethSystem', TeethSystem],
            ['MouthRenderer', MouthRenderer],
            ['InstrumentSystem', InstrumentSystem],
            ['LevelSystem', LevelSystem],
            ['ShopSystem', ShopSystem],
            ['DiagnosisSystem', DiagnosisSystem],
        ];
        systems.forEach(([name, sys]) => {
            try {
                if (name === 'MouthRenderer') sys.init(this.canvas);
                else sys.init();
                console.log(`✅ ${name} initialized`);
            } catch (e) {
                console.error(`❌ ${name} failed to initialize:`, e);
            }
        });

        // Create menu particles
        this.createMenuParticles();

        // Update UI
        this.updateCoinDisplays();

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    },

    // --- Canvas Resize ---
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // Also resize diagnosis canvas if visible
        const dc = document.getElementById('diagnosisCanvas');
        if (dc) {
            dc.width = Math.min(this.width - 40, 800);
            dc.height = Math.min(this.height * 0.55, 500);
        }
        // Recalculate teeth positions on resize during gameplay
        if (this.state === 'GAMEPLAY' && window.MouthRenderer) {
            MouthRenderer.getTeethLayout(this.width, this.height);
        }
    },

    // --- Mouse Handling ---
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.canvasX = e.clientX - rect.left;
        this.mouse.canvasY = e.clientY - rect.top;
    },

    onMouseDown(e) {
        if (e.button === 0) {
            this.mouse.down = true;
            this.mouse.clicked = true;
        }
    },

    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.down = false;
        }
    },

    onTouchMove(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;
        this.mouse.canvasX = touch.clientX - rect.left;
        this.mouse.canvasY = touch.clientY - rect.top;
    },

    onTouchStart(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;
        this.mouse.canvasX = touch.clientX - rect.left;
        this.mouse.canvasY = touch.clientY - rect.top;
        this.mouse.down = true;
        this.mouse.clicked = true;
    },

    onTouchEnd(e) {
        this.mouse.down = false;
    },

    // --- State Management ---
    setState(newState) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));

        this.state = newState;
        AudioSystem.play('click');

        switch (newState) {
            case 'MENU':
                document.getElementById('screen-menu').classList.add('active');
                this.canvas.style.display = 'none';
                break;

            case 'LEVEL_SELECT':
                document.getElementById('screen-level-select').classList.add('active');
                this.canvas.style.display = 'none';
                LevelSystem.renderLevelSelect();
                break;

            case 'GAMEPLAY':
                document.getElementById('screen-gameplay').classList.add('active');
                this.canvas.style.display = 'block';
                this.startLevel();
                break;

            case 'DIAGNOSIS':
                document.getElementById('screen-diagnosis').classList.add('active');
                this.canvas.style.display = 'none';
                DiagnosisSystem.start(TeethSystem.teeth, LevelSystem.getCurrentLevel());
                break;

            case 'RESULTS':
                document.getElementById('screen-results').classList.add('active');
                this.canvas.style.display = 'none';
                this.showResults();
                break;

            case 'SHOP':
                document.getElementById('screen-shop').classList.add('active');
                this.canvas.style.display = 'none';
                ShopSystem.renderShop();
                break;
        }

        this.updateCoinDisplays();
    },

    // --- Level Management ---
    startLevel() {
        const level = LevelSystem.getLevel(this.currentLevelIndex);
        if (!level) return;

        TeethSystem.setupForLevel(level);
        MouthRenderer.getTeethLayout(this.width, this.height);
        InstrumentSystem.setupForLevel(level);
        MouthRenderer.reset();
        ParticleSystem.clear();

        this.score = 0;
        this.cleaningScore = 0;
        this.elapsedTime = 0;
        this.gameStartTime = performance.now();

        // Update HUD
        document.getElementById('hud-patient-name').textContent = level.patientName;
        document.getElementById('hud-level-label').textContent = `Nivel ${this.currentLevelIndex + 1}`;
        document.getElementById('hud-score').textContent = '0';
        document.getElementById('hud-timer').textContent = '0:00';
        document.getElementById('btn-finish').style.display = 'none';

        // Show gameplay UI
        document.getElementById('intensity-gauge').classList.add('visible');
        document.getElementById('progress-container').classList.add('visible');
    },

    selectLevel(index) {
        this.currentLevelIndex = index;
        this.setState('GAMEPLAY');
    },

    finishCleaning() {
        // Calculate cleaning score
        this.cleaningScore = TeethSystem.getCleaningProgress();
        this.elapsedTime = (performance.now() - this.gameStartTime) / 1000;

        // Hide gameplay UI
        document.getElementById('intensity-gauge').classList.remove('visible');
        document.getElementById('progress-container').classList.remove('visible');
        document.getElementById('btn-finish').style.display = 'none';

        // Go to diagnosis
        this.setState('DIAGNOSIS');
    },

    submitDiagnosis() {
        this.diagnosisScore = DiagnosisSystem.getScore();
        this.setState('RESULTS');
    },

    showResults() {
        const level = LevelSystem.getLevel(this.currentLevelIndex);
        const maxTime = level ? level.timeTarget : 120;

        // Time bonus: max 100 if done in half the target time
        this.timeBonus = Math.max(0, Math.round(100 * (1 - this.elapsedTime / maxTime)));

        const totalScore = Math.round(
            this.cleaningScore * 0.5 +
            this.diagnosisScore * 0.3 +
            this.timeBonus * 0.2
        );

        const coinsEarned = Math.round(totalScore * 0.5) + 10;

        // Stars
        let stars = 0;
        if (totalScore >= 30) stars = 1;
        if (totalScore >= 60) stars = 2;
        if (totalScore >= 85) stars = 3;

        // Save completion
        const prev = this.completedLevels[this.currentLevelIndex];
        if (!prev || totalScore > prev.bestScore) {
            this.completedLevels[this.currentLevelIndex] = { stars, bestScore: totalScore };
        }
        this.coins += coinsEarned;
        this.save();

        // Update UI
        document.getElementById('result-cleaning').textContent = Math.round(this.cleaningScore);
        document.getElementById('result-diagnosis').textContent = Math.round(this.diagnosisScore);
        document.getElementById('result-time').textContent = this.timeBonus;
        document.getElementById('result-total').textContent = totalScore;
        document.getElementById('result-coins').textContent = `+${coinsEarned}`;

        const starEls = document.querySelectorAll('#results-stars .star');
        starEls.forEach((el, i) => {
            el.textContent = i < stars ? '★' : '☆';
            el.classList.toggle('earned', i < stars);
        });

        AudioSystem.play('levelComplete');
        this.updateCoinDisplays();
    },

    retryLevel() {
        this.setState('GAMEPLAY');
    },

    confirmExit() {
        this.showModal(
            '¿Salir del paciente?',
            'Perderás el progreso actual.',
            () => {
                document.getElementById('intensity-gauge').classList.remove('visible');
                document.getElementById('progress-container').classList.remove('visible');
                this.setState('LEVEL_SELECT');
            }
        );
    },

    // --- Modal ---
    showModal(title, text, callback) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-text').textContent = text;
        document.getElementById('modal-overlay').style.display = 'flex';
        this.modalCallback = callback;
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        this.modalCallback = null;
    },

    confirmModal() {
        if (this.modalCallback) this.modalCallback();
        this.closeModal();
    },

    // --- Sound Toggle ---
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('sound-icon').textContent = this.soundEnabled ? '🔊' : '🔇';
        if (this.soundEnabled) AudioSystem.unmute();
        else AudioSystem.mute();
    },

    // --- Game Loop ---
    gameLoop(timestamp) {
        this.dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        if (this.state === 'GAMEPLAY') {
            this.updateGameplay();
            this.renderGameplay();
        }

        this.mouse.clicked = false;
        this.animFrame = requestAnimationFrame((t) => this.gameLoop(t));
    },

    updateGameplay() {
        const dt = this.dt;

        // Update elapsed time
        this.elapsedTime = (performance.now() - this.gameStartTime) / 1000;
        const mins = Math.floor(this.elapsedTime / 60);
        const secs = Math.floor(this.elapsedTime % 60);
        document.getElementById('hud-timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Update instrument (hand position, intensity)
        InstrumentSystem.update(dt, this.mouse);

        // Check if instrument is being used on a tooth
        const hoveredTooth = TeethSystem.getToothAt(this.mouse.canvasX, this.mouse.canvasY);

        // Update tooth tooltip
        this.updateToothTooltip(hoveredTooth);

        // Apply instrument effect
        if (this.mouse.down && hoveredTooth && InstrumentSystem.currentInstrument) {
            const effect = InstrumentSystem.getEffect();
            if (effect && hoveredTooth.problems[effect.type] > 0) {
                const cleaned = hoveredTooth.clean(effect.type, effect.amount * dt);
                if (cleaned > 0) {
                    // Emit particles
                    ParticleSystem.emit(
                        hoveredTooth.x + hoveredTooth.width / 2,
                        hoveredTooth.y + hoveredTooth.height / 2,
                        effect.type,
                        Math.ceil(effect.amount * dt * 2)
                    );
                    this.score += cleaned * 0.5;
                }
            }
            // Check for over-intensity damage
            if (InstrumentSystem.intensity > 85) {
                const dmg = (InstrumentSystem.intensity - 85) * 0.05 * dt;
                if (hoveredTooth) {
                    hoveredTooth.damage(dmg);
                    ParticleSystem.emit(
                        hoveredTooth.x + hoveredTooth.width / 2,
                        hoveredTooth.y + hoveredTooth.height / 2,
                        'damage',
                        1
                    );
                }
            }
        }

        // Update teeth animations
        TeethSystem.update(dt);

        // Update particles
        ParticleSystem.update(dt);

        // Update HUD
        document.getElementById('hud-score').textContent = Math.round(this.score);

        // Update progress
        const progress = TeethSystem.getCleaningProgress();
        document.getElementById('progress-fill').style.height = progress + '%';
        document.getElementById('progress-value').textContent = Math.round(progress) + '%';

        // Update intensity gauge
        const intensity = InstrumentSystem.intensity;
        const gaugeFill = document.getElementById('gauge-fill');
        gaugeFill.style.height = intensity + '%';
        gaugeFill.classList.remove('warning', 'danger');
        if (intensity > 85) gaugeFill.classList.add('danger');
        else if (intensity > 65) gaugeFill.classList.add('warning');
        document.getElementById('gauge-value').textContent = Math.round(intensity) + '%';

        // Show finish button when progress > 50%
        const finishBtn = document.getElementById('btn-finish');
        if (progress >= 50 && finishBtn.style.display === 'none') {
            finishBtn.style.display = 'block';
        }

        // Update coin display
        document.getElementById('gp-coin-amount').textContent = this.coins;
    },

    updateToothTooltip(tooth) {
        const tooltip = document.getElementById('tooth-tooltip');
        if (tooth) {
            tooltip.classList.add('visible');
            tooltip.style.left = (this.mouse.x + 15) + 'px';
            tooltip.style.top = (this.mouse.y - 40) + 'px';
            document.getElementById('tooltip-name').textContent = tooth.displayName;

            let statusParts = [];
            if (tooth.problems.plaque > 1) statusParts.push(`Placa: ${Math.round(tooth.problems.plaque)}%`);
            if (tooth.problems.tartar > 1) statusParts.push(`Sarro: ${Math.round(tooth.problems.tartar)}%`);
            if (tooth.problems.cavity > 1) statusParts.push(`Caries: ${Math.round(tooth.problems.cavity)}%`);
            if (statusParts.length === 0) statusParts.push('✓ Limpio');
            document.getElementById('tooltip-status').textContent = statusParts.join(' | ');
        } else {
            tooltip.classList.remove('visible');
        }
    },

    renderGameplay() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        try {
            // Render mouth background, gums, tongue
            MouthRenderer.render(ctx, this.width, this.height);

            // Apply teeth layout if not yet positioned
            if (TeethSystem.teeth && TeethSystem.teeth.length > 0 && TeethSystem.teeth[0].x === 0) {
                MouthRenderer.getTeethLayout(this.width, this.height);
            }

            // Render teeth
            TeethSystem.render(ctx);

            // Render particles
            ParticleSystem.render(ctx);

            // Render instrument and hand
            InstrumentSystem.render(ctx, this.mouse);
        } catch (e) {
            if (!this._renderErrorLogged) {
                console.error('Render error:', e);
                this._renderErrorLogged = true;
            }
        }
    },

    // --- Coin Display Updates ---
    updateCoinDisplays() {
        const ids = ['menu-coin-amount', 'ls-coin-amount', 'gp-coin-amount', 'shop-coin-amount'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = this.coins;
        });
    },

    // --- Save / Load ---
    save() {
        const data = {
            coins: this.coins,
            completedLevels: this.completedLevels,
            ownedItems: this.ownedItems,
            equippedItems: this.equippedItems,
            soundEnabled: this.soundEnabled
        };
        localStorage.setItem('dentalAdventure_save', JSON.stringify(data));
    },

    load() {
        try {
            const raw = localStorage.getItem('dentalAdventure_save');
            if (raw) {
                const data = JSON.parse(raw);
                this.coins = data.coins ?? 100;
                this.completedLevels = data.completedLevels ?? {};
                this.ownedItems = data.ownedItems ?? ['glove-blue'];
                this.equippedItems = data.equippedItems ?? { gloves: 'glove-blue' };
                this.soundEnabled = data.soundEnabled ?? true;
            }
        } catch (e) {
            console.warn('Failed to load save:', e);
        }
    },

    // --- Menu Particles ---
    createMenuParticles() {
        const container = document.getElementById('menuParticles');
        if (!container) return;
        const colors = ['#00d4ff', '#4ade80', '#ff6b9d', '#fbbf24', '#a78bfa'];
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'menu-particle';
            const size = 4 + Math.random() * 8;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            container.appendChild(p);
        }
    }
};

// --- Start ---
window.addEventListener('DOMContentLoaded', () => Game.init());
