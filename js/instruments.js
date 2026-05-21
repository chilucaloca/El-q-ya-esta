/**
 * ============================================================
 *  InstrumentSystem — Dental Adventure
 * ============================================================
 *  Manages dental instruments, hand rendering, intensity,
 *  and the instrument selection bar UI.
 * ============================================================
 */
window.InstrumentSystem = (function () {

  /* --------------------------------------------------------
   *  Polyfill for ctx.roundRect (not available in all browsers)
   * ------------------------------------------------------ */
  if (typeof CanvasRenderingContext2D !== 'undefined' &&
      !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      var r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
      r = Math.min(r, w / 2, h / 2);
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
      return this;
    };
  }

  /* --------------------------------------------------------
   *  Instrument definitions
   * ------------------------------------------------------ */
  const INSTRUMENTS = [
    { id: 'brush',    name: 'Cepillo',   icon: '🪥', effectType: 'plaque',  power: 25, color: '#4488ff', unlockLevel: 0 },
    { id: 'scraper',  name: 'Raspador',  icon: '🔧', effectType: 'tartar',  power: 20, color: '#cc8844', unlockLevel: 1 },
    { id: 'mirror',   name: 'Espejo',    icon: '🔍', effectType: null,      power: 0,  color: '#aaaacc', unlockLevel: 0 },
    { id: 'syringe',  name: 'Jeringa',   icon: '💉', effectType: 'plaque',  power: 15, color: '#44aaff', unlockLevel: 2 },
    { id: 'drill',    name: 'Fresa',     icon: '⚙️', effectType: 'cavity',  power: 18, color: '#888888', unlockLevel: 2 },
    { id: 'suction',  name: 'Succión',   icon: '🌀', effectType: 'tartar',  power: 12, color: '#66cc88', unlockLevel: 3 },
  ];

  /* --------------------------------------------------------
   *  Internal state
   * ------------------------------------------------------ */
  let currentInstrument = null;
  let handX  = 0, handY  = 0;   // smoothed (rendered) position
  let targetX = 0, targetY = 0; // raw mouse position
  let intensity = 0;            // 0–100
  let availableInstruments = [];
  let drillAngle = 0;           // animated rotation for drill tip

  /* --------------------------------------------------------
   *  Helpers
   * ------------------------------------------------------ */

  /** Linear interpolation */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /** Clamp value between min and max */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /** Get the color for the currently equipped glove from the shop */
  function getGloveColor() {
    if (typeof ShopSystem !== 'undefined' && ShopSystem.getEquippedColor) {
      return ShopSystem.getEquippedColor('gloves') || '#4488dd';
    }
    return '#4488dd';
  }

  /** Get the equipped instrument skin color */
  function getSkinColor() {
    if (typeof ShopSystem !== 'undefined' && ShopSystem.getEquippedColor) {
      return ShopSystem.getEquippedColor('instrumentSkin') || null;
    }
    return null;
  }

  /** Darken a hex color by a factor (0-1, 0 = black) */
  function darken(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  }

  /** Lighten a hex color toward white */
  function lighten(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r + (255 - r) * factor)}, ${Math.floor(g + (255 - g) * factor)}, ${Math.floor(b + (255 - b) * factor)})`;
  }

  /* --------------------------------------------------------
   *  Hand & Instrument Drawing
   * ------------------------------------------------------ */

  /**
   * Draw the gloved hand on the canvas.
   * The hand is oriented so the instrument points roughly downward
   * toward the center of the mouth area.
   */
  function drawHand(ctx, x, y, gloveColor) {
    ctx.save();
    ctx.translate(x, y);

    const palmW = 36, palmH = 44;

    // --- Shadow ---
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(4, 6, palmW * 0.55, palmH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Palm (rounded rect via bezier) ---
    const baseColor = gloveColor;
    const grad = ctx.createLinearGradient(-palmW / 2, -palmH / 2, palmW / 2, palmH / 2);
    grad.addColorStop(0, lighten(baseColor, 0.2));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, darken(baseColor, 0.7));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-palmW / 2 + 8, -palmH / 2);
    ctx.quadraticCurveTo(palmW / 2, -palmH / 2 - 2, palmW / 2, -palmH / 2 + 14);
    ctx.lineTo(palmW / 2 - 2, palmH / 2 - 6);
    ctx.quadraticCurveTo(palmW / 2 - 4, palmH / 2 + 4, 0, palmH / 2 + 2);
    ctx.quadraticCurveTo(-palmW / 2 + 2, palmH / 2 + 2, -palmW / 2, palmH / 2 - 10);
    ctx.lineTo(-palmW / 2, -palmH / 2 + 10);
    ctx.quadraticCurveTo(-palmW / 2, -palmH / 2, -palmW / 2 + 8, -palmH / 2);
    ctx.closePath();
    ctx.fill();

    // --- Fingers (grouped, holding instrument) ---
    ctx.fillStyle = baseColor;
    // Index finger
    ctx.beginPath();
    ctx.moveTo(4, palmH / 2 - 2);
    ctx.quadraticCurveTo(8, palmH / 2 + 18, 2, palmH / 2 + 24);
    ctx.quadraticCurveTo(-4, palmH / 2 + 20, -2, palmH / 2 - 2);
    ctx.closePath();
    ctx.fill();
    // Middle finger
    ctx.beginPath();
    ctx.moveTo(12, palmH / 2 - 4);
    ctx.quadraticCurveTo(16, palmH / 2 + 14, 12, palmH / 2 + 20);
    ctx.quadraticCurveTo(6, palmH / 2 + 16, 8, palmH / 2 - 4);
    ctx.closePath();
    ctx.fill();
    // Ring + pinky area
    ctx.beginPath();
    ctx.moveTo(-8, palmH / 2 - 2);
    ctx.quadraticCurveTo(-6, palmH / 2 + 14, -10, palmH / 2 + 16);
    ctx.quadraticCurveTo(-16, palmH / 2 + 12, -14, palmH / 2 - 4);
    ctx.closePath();
    ctx.fill();

    // --- Thumb ---
    ctx.fillStyle = lighten(baseColor, 0.1);
    ctx.beginPath();
    ctx.moveTo(-palmW / 2 + 2, -6);
    ctx.quadraticCurveTo(-palmW / 2 - 16, -2, -palmW / 2 - 14, 14);
    ctx.quadraticCurveTo(-palmW / 2 - 10, 22, -palmW / 2 + 4, 16);
    ctx.quadraticCurveTo(-palmW / 2 + 6, 10, -palmW / 2 + 2, -6);
    ctx.closePath();
    ctx.fill();

    // --- Knuckle highlights ---
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(3, palmH / 2 - 4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, palmH / 2 - 5, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-8, palmH / 2 - 4, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /**
   * Draw the currently selected instrument extending from the hand.
   */
  function drawInstrument(ctx, x, y, inst, intensityVal) {
    if (!inst) return;
    ctx.save();
    ctx.translate(x, y + 42); // offset below hand

    const skinColor = getSkinColor();
    const instColor = skinColor || inst.color;

    switch (inst.id) {
      case 'brush':
        drawBrush(ctx, instColor, intensityVal);
        break;
      case 'scraper':
        drawScraper(ctx, instColor, intensityVal);
        break;
      case 'mirror':
        drawMirror(ctx, instColor, intensityVal);
        break;
      case 'syringe':
        drawSyringe(ctx, instColor, intensityVal);
        break;
      case 'drill':
        drawDrill(ctx, instColor, intensityVal);
        break;
      case 'suction':
        drawSuction(ctx, instColor, intensityVal);
        break;
    }

    ctx.restore();
  }

  /** Brush: elongated handle + bristle head */
  function drawBrush(ctx, color, intens) {
    // Handle
    const handleGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    handleGrad.addColorStop(0, lighten(color, 0.3));
    handleGrad.addColorStop(0.5, color);
    handleGrad.addColorStop(1, darken(color, 0.7));
    ctx.fillStyle = handleGrad;
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, 50, 3);
    ctx.fill();

    // Neck
    ctx.fillStyle = darken(color, 0.8);
    ctx.beginPath();
    ctx.roundRect(-3, 48, 6, 10, 2);
    ctx.fill();

    // Bristle head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-8, 56, 16, 14, 3);
    ctx.fill();

    // Individual bristles
    ctx.strokeStyle = '#ddeeff';
    ctx.lineWidth = 1;
    for (let bx = -6; bx <= 6; bx += 3) {
      for (let by = 58; by <= 66; by += 4) {
        const wobble = intens > 0 ? (Math.random() - 0.5) * (intens / 50) * 2 : 0;
        ctx.beginPath();
        ctx.moveTo(bx + wobble, by);
        ctx.lineTo(bx + wobble, by + 3);
        ctx.stroke();
      }
    }

    // Glow when active
    if (intens > 10) {
      ctx.save();
      ctx.globalAlpha = intens / 300;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 + intens / 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-10, 54, 20, 18, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Scraper: thin metal handle + curved hook tip */
  function drawScraper(ctx, color, intens) {
    // Handle
    const hGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    hGrad.addColorStop(0, lighten(color, 0.4));
    hGrad.addColorStop(0.5, color);
    hGrad.addColorStop(1, darken(color, 0.6));
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 55, 2);
    ctx.fill();

    // Curved hook tip
    ctx.strokeStyle = '#ccccdd';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 55);
    ctx.quadraticCurveTo(12, 62, 8, 72);
    ctx.stroke();

    // Shiny edge
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(1, 55);
    ctx.quadraticCurveTo(10, 61, 7, 70);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (intens > 10) {
      ctx.save();
      ctx.globalAlpha = intens / 250;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10 + intens / 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 55);
      ctx.quadraticCurveTo(12, 62, 8, 72);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Mirror: handle + circular mirror with reflection */
  function drawMirror(ctx, color, _intens) {
    // Handle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 45, 2);
    ctx.fill();

    // Neck bend
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 45);
    ctx.quadraticCurveTo(-4, 52, 0, 56);
    ctx.stroke();

    // Mirror circle
    ctx.fillStyle = '#dde8f0';
    ctx.beginPath();
    ctx.arc(0, 66, 10, 0, Math.PI * 2);
    ctx.fill();

    // Mirror frame
    ctx.strokeStyle = darken(color, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 66, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Reflection gradient
    const mirGrad = ctx.createRadialGradient(-3, 63, 1, 0, 66, 10);
    mirGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    mirGrad.addColorStop(0.5, 'rgba(200,220,240,0.2)');
    mirGrad.addColorStop(1, 'rgba(150,180,220,0.1)');
    ctx.fillStyle = mirGrad;
    ctx.beginPath();
    ctx.arc(0, 66, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Syringe: cylindrical body + needle */
  function drawSyringe(ctx, color, intens) {
    // Barrel body
    const bGrad = ctx.createLinearGradient(-5, 0, 5, 0);
    bGrad.addColorStop(0, lighten(color, 0.4));
    bGrad.addColorStop(0.4, 'rgba(200,230,255,0.9)');
    bGrad.addColorStop(1, darken(color, 0.7));
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(-5, 0, 10, 40, 3);
    ctx.fill();

    // Plunger handle
    ctx.fillStyle = darken(color, 0.5);
    ctx.beginPath();
    ctx.roundRect(-7, -4, 14, 6, 2);
    ctx.fill();

    // Plunger rod
    ctx.fillStyle = '#aabbcc';
    ctx.fillRect(-1.5, -2, 3, 20);

    // Fluid inside
    ctx.fillStyle = 'rgba(100,200,255,0.4)';
    ctx.beginPath();
    ctx.roundRect(-4, 18, 8, 20, 2);
    ctx.fill();

    // Tip / needle
    ctx.fillStyle = '#ccccdd';
    ctx.beginPath();
    ctx.roundRect(-2, 40, 4, 8, 1);
    ctx.fill();
    ctx.strokeStyle = '#aaaacc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(0, 62);
    ctx.stroke();

    if (intens > 10) {
      // Droplet at tip
      ctx.save();
      ctx.globalAlpha = intens / 150;
      ctx.fillStyle = 'rgba(100,200,255,0.7)';
      ctx.beginPath();
      ctx.arc(0, 64, 2 + intens / 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Drill: handle + rotating tip */
  function drawDrill(ctx, color, intens) {
    // Body / grip
    const dGrad = ctx.createLinearGradient(-5, 0, 5, 0);
    dGrad.addColorStop(0, lighten(color, 0.3));
    dGrad.addColorStop(0.5, color);
    dGrad.addColorStop(1, darken(color, 0.6));
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.roundRect(-5, 0, 10, 36, 3);
    ctx.fill();

    // Grip texture lines
    ctx.strokeStyle = darken(color, 0.5);
    ctx.lineWidth = 0.5;
    for (let gy = 6; gy < 34; gy += 4) {
      ctx.beginPath();
      ctx.moveTo(-4, gy);
      ctx.lineTo(4, gy);
      ctx.stroke();
    }

    // Collar
    ctx.fillStyle = '#888899';
    ctx.beginPath();
    ctx.roundRect(-4, 36, 8, 6, 1);
    ctx.fill();

    // Rotating bur tip
    ctx.save();
    ctx.translate(0, 50);
    ctx.rotate(drillAngle);

    ctx.fillStyle = '#aab0bb';
    // Draw 4-pointed star-like bur
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, -8);
      ctx.lineTo(0, -10);
      ctx.lineTo(2, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    if (intens > 10) {
      ctx.save();
      ctx.globalAlpha = intens / 200;
      ctx.shadowColor = '#ffaa44';
      ctx.shadowBlur = 8 + intens / 10;
      ctx.fillStyle = '#ffaa44';
      ctx.beginPath();
      ctx.arc(0, 50, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Suction: tube shape + wider tip */
  function drawSuction(ctx, color, intens) {
    // Tube body
    const sGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    sGrad.addColorStop(0, lighten(color, 0.3));
    sGrad.addColorStop(0.5, 'rgba(200,240,220,0.8)');
    sGrad.addColorStop(1, darken(color, 0.6));
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, 48, 3);
    ctx.fill();

    // Wider tip / nozzle
    ctx.fillStyle = lighten(color, 0.15);
    ctx.beginPath();
    ctx.moveTo(-4, 48);
    ctx.lineTo(-8, 62);
    ctx.quadraticCurveTo(-8, 66, 0, 66);
    ctx.quadraticCurveTo(8, 66, 8, 62);
    ctx.lineTo(4, 48);
    ctx.closePath();
    ctx.fill();

    // Suction hole
    ctx.fillStyle = darken(color, 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 64, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (intens > 10) {
      // Suction swirl effect
      ctx.save();
      ctx.globalAlpha = intens / 200;
      ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
      ctx.lineWidth = 1.5;
      const time = Date.now() / 200;
      for (let i = 0; i < 3; i++) {
        const angle = time + (i * Math.PI * 2) / 3;
        const radius = 4 + i * 2;
        ctx.beginPath();
        ctx.arc(0, 64, radius, angle, angle + 1.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /**
   * Draw motion lines / vibration effect at the instrument tip
   * when intensity > 0.
   */
  function drawIntensityEffect(ctx, x, y, inst, intensityVal) {
    if (intensityVal < 5 || !inst) return;
    ctx.save();

    const tipY = y + 42 + 60; // approximate tip position
    const alpha = intensityVal / 200;

    // Motion lines radiating from tip
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    const numLines = Math.floor(intensityVal / 15) + 2;
    for (let i = 0; i < numLines; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.8 + Math.PI / 2;
      const len = 6 + Math.random() * intensityVal / 8;
      const ox = (Math.random() - 0.5) * 10;
      ctx.beginPath();
      ctx.moveTo(x + ox, tipY);
      ctx.lineTo(
        x + ox + Math.cos(angle) * len,
        tipY + Math.sin(angle) * len
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  /* --------------------------------------------------------
   *  Public API
   * ------------------------------------------------------ */
  return {
    /** All instrument definitions (read-only reference) */
    INSTRUMENTS: INSTRUMENTS,

    /** Currently selected instrument */
    get currentInstrument() { return currentInstrument; },

    /** Current smoothed hand position */
    get handX() { return handX; },
    get handY() { return handY; },

    /** Current intensity (0-100) */
    get intensity() { return intensity; },

    /** Available instruments for current level */
    get availableInstruments() { return availableInstruments; },

    /* -------------------------------------------------------
     *  init — populate instrument bar container
     * ----------------------------------------------------- */
    init() {
      // Set default instrument
      currentInstrument = INSTRUMENTS[0];
      intensity = 0;
      availableInstruments = [];
    },

    /* -------------------------------------------------------
     *  setupForLevel — configure available instruments
     * ----------------------------------------------------- */
    setupForLevel(level) {
      const ids = level.instruments || [];
      availableInstruments = ids
        .map(id => INSTRUMENTS.find(inst => inst.id === id))
        .filter(Boolean);

      // Select first available instrument
      if (availableInstruments.length > 0) {
        currentInstrument = availableInstruments[0];
      }

      // Reset intensity
      intensity = 0;

      // Render the instrument bar
      this._renderBar();
    },

    /* -------------------------------------------------------
     *  selectInstrument — change the current instrument
     * ----------------------------------------------------- */
    selectInstrument(id) {
      const inst = INSTRUMENTS.find(i => i.id === id);
      if (!inst) return;

      // Check if the instrument is available for this level
      if (!availableInstruments.find(i => i.id === id)) return;

      currentInstrument = inst;
      intensity = 0; // reset on switch

      // Play selection sound
      if (typeof AudioSystem !== 'undefined') {
        AudioSystem.play('click');
      }

      // Update button active states
      this._updateActiveButton();
    },

    /* -------------------------------------------------------
     *  update — smooth hand position & intensity
     * ----------------------------------------------------- */
    update(dt, mouse) {
      if (!mouse) return;

      targetX = mouse.x;
      targetY = mouse.y;

      // Smooth hand movement via lerp
      const smoothing = 0.15;
      handX = lerp(handX, targetX, smoothing);
      handY = lerp(handY, targetY, smoothing);

      // Intensity ramp
      if (mouse.down) {
        intensity = clamp(intensity + 40 * dt, 0, 100);
      } else {
        intensity = clamp(intensity - 60 * dt, 0, 100);
      }

      // Animate drill rotation
      if (currentInstrument && currentInstrument.id === 'drill') {
        drillAngle += dt * (5 + intensity / 10);
      }
    },

    /* -------------------------------------------------------
     *  getEffect — returns cleaning effect for current state
     * ----------------------------------------------------- */
    getEffect() {
      if (!currentInstrument || !currentInstrument.effectType) return null;
      return {
        type: currentInstrument.effectType,
        amount: currentInstrument.power * (intensity / 100)
      };
    },

    /* -------------------------------------------------------
     *  render — draw hand + instrument on canvas
     * ----------------------------------------------------- */
    render(ctx, mouse) {
      if (!currentInstrument) return;

      const gloveColor = getGloveColor();

      // Draw intensity effect first (behind hand)
      drawIntensityEffect(ctx, handX, handY, currentInstrument, intensity);

      // Draw instrument (below hand)
      drawInstrument(ctx, handX, handY, currentInstrument, intensity);

      // Draw gloved hand
      drawHand(ctx, handX, handY, gloveColor);
    },

    /* -------------------------------------------------------
     *  _renderBar — build instrument bar HTML
     * ----------------------------------------------------- */
    _renderBar() {
      const bar = document.getElementById('instrument-bar');
      if (!bar) return;

      bar.innerHTML = '';

      // Build a button for every known instrument
      INSTRUMENTS.forEach(inst => {
        const isAvailable = !!availableInstruments.find(a => a.id === inst.id);
        const btn = document.createElement('button');
        btn.className = 'instrument-btn';
        if (!isAvailable) btn.classList.add('locked');
        if (currentInstrument && currentInstrument.id === inst.id) btn.classList.add('active');

        btn.innerHTML = `<span class="inst-icon">${inst.icon}</span><span>${inst.name}</span>`;
        btn.onclick = () => {
          if (isAvailable) this.selectInstrument(inst.id);
        };

        bar.appendChild(btn);
      });
    },

    /* -------------------------------------------------------
     *  _updateActiveButton — refresh .active class on buttons
     * ----------------------------------------------------- */
    _updateActiveButton() {
      const bar = document.getElementById('instrument-bar');
      if (!bar) return;
      const buttons = bar.querySelectorAll('.instrument-btn');
      buttons.forEach((btn, i) => {
        if (i < INSTRUMENTS.length) {
          btn.classList.toggle('active', INSTRUMENTS[i].id === currentInstrument?.id);
        }
      });
    }
  };
})();
