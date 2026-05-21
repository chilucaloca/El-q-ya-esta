/**
 * particles.js — Dental Adventure: Particle System
 *
 * High-performance particle system using object pooling.
 * Supports 6 particle types: plaque, tartar, cavity, water, sparkle, damage.
 * Each type has distinct colors, physics, and visual behavior.
 *
 * Usage:
 *   window.ParticleSystem.init();
 *   window.ParticleSystem.emit(x, y, 'plaque', 10);
 *   window.ParticleSystem.update(dt);
 *   window.ParticleSystem.render(ctx);
 */
window.ParticleSystem = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────
  var POOL_SIZE = 300;

  // ─── Particle Type Configurations ─────────────────────────────────
  var TYPE_CONFIGS = {
    plaque: {
      colors: ['#c4b030', '#a89820', '#d4c040', '#b8a828', '#ccb838'],
      sizeMin: 2, sizeMax: 5,
      maxLife: 1.0,
      gravity: -20,       // drifts upward
      speedMin: 15, speedMax: 40,
      wobble: true,        // side-to-side wobble
      wobbleFreq: 5,
      wobbleAmp: 12,
      shrink: false,
      shape: 'circle'
    },
    tartar: {
      colors: ['#8b7332', '#6b5322', '#a08842', '#7a6428', '#9a7838'],
      sizeMin: 3, sizeMax: 7,
      maxLife: 0.8,
      gravity: 180,        // falls down
      speedMin: 20, speedMax: 50,
      wobble: false,
      shrink: false,
      shape: 'chunk'       // irregular angular shape
    },
    cavity: {
      colors: ['#2a1a08', '#1a0f04', '#3a2a18', '#221508', '#321e10'],
      sizeMin: 1.5, sizeMax: 4,
      maxLife: 0.5,
      gravity: 0,
      speedMin: 60, speedMax: 120,
      wobble: false,
      shrink: true,         // particles shrink as they die
      shape: 'circle'
    },
    water: {
      colors: ['#4488ff', '#66aaff', '#2266dd', '#5599ff', '#3377ee'],
      sizeMin: 2, sizeMax: 5,
      maxLife: 0.6,
      gravity: 120,         // some drip down
      speedMin: 40, speedMax: 90,
      wobble: false,
      shrink: false,
      shape: 'droplet',
      splash: true           // arc-like emission
    },
    sparkle: {
      colors: ['#ffffff', '#00d4ff', '#4ade80', '#c8f0ff', '#80ffc8'],
      sizeMin: 2, sizeMax: 4,
      maxLife: 1.2,
      gravity: -15,          // float upward
      speedMin: 10, speedMax: 30,
      wobble: true,
      wobbleFreq: 3,
      wobbleAmp: 8,
      shrink: false,
      twinkle: true,         // oscillating opacity
      twinkleFreq: 8,
      shape: 'star'          // 4-point star
    },
    damage: {
      colors: ['#ff3333', '#ff0000', '#ff6666', '#ee2222', '#ff4444'],
      sizeMin: 3, sizeMax: 8,
      maxLife: 0.3,
      gravity: 0,
      speedMin: 50, speedMax: 100,
      wobble: false,
      shrink: false,
      expand: true,          // particles grow
      expandRate: 3,
      shake: true,           // random position jitter
      shape: 'circle'
    }
  };

  // ─── Particle Pool ────────────────────────────────────────────────
  var particles = [];

  /**
   * Create a single particle object with all possible properties.
   * @returns {Object}
   */
  function createParticle() {
    return {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      baseSize: 3,
      color: '#ffffff',
      opacity: 1,
      life: 0,
      maxLife: 1,
      gravity: 0,
      type: 'plaque',
      // Extended properties
      wobblePhase: 0,
      wobbleFreq: 0,
      wobbleAmp: 0,
      twinkle: false,
      twinkleFreq: 0,
      expand: false,
      expandRate: 0,
      shrink: false,
      shake: false,
      shapeType: 'circle',
      // For chunk shapes, store random vertex offsets
      chunkVerts: null,
      // Rotation for angular shapes
      rotation: 0,
      rotationSpeed: 0
    };
  }

  /**
   * Get the next available (inactive) particle from the pool.
   * @returns {Object|null} particle or null if pool is exhausted
   */
  function getParticle() {
    for (var i = 0; i < particles.length; i++) {
      if (!particles[i].active) return particles[i];
    }
    return null;
  }

  /**
   * Generate random chunk vertices (for tartar particles).
   * @returns {Array<{x: number, y: number}>}
   */
  function generateChunkVerts() {
    var verts = [];
    var numVerts = 5 + Math.floor(Math.random() * 3); // 5-7 vertices
    for (var i = 0; i < numVerts; i++) {
      var angle = (i / numVerts) * Math.PI * 2;
      var r = 0.6 + Math.random() * 0.4; // radius variation
      verts.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
    return verts;
  }

  // ─── Rendering functions per shape ────────────────────────────────

  /**
   * Draw a circle particle.
   */
  function drawCircle(ctx, p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  /**
   * Draw a 4-point star (sparkle).
   */
  function drawStar(ctx, p) {
    var s = p.size;
    var innerR = s * 0.35;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();

    for (var i = 0; i < 4; i++) {
      var outerAngle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      var innerAngle = outerAngle + Math.PI / 4;

      if (i === 0) {
        ctx.moveTo(Math.cos(outerAngle) * s, Math.sin(outerAngle) * s);
      } else {
        ctx.lineTo(Math.cos(outerAngle) * s, Math.sin(outerAngle) * s);
      }
      ctx.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw an irregular chunk shape (for tartar).
   */
  function drawChunk(ctx, p) {
    if (!p.chunkVerts || p.chunkVerts.length < 3) {
      drawCircle(ctx, p);
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();

    var v = p.chunkVerts;
    ctx.moveTo(v[0].x * p.size, v[0].y * p.size);
    for (var i = 1; i < v.length; i++) {
      ctx.lineTo(v[i].x * p.size, v[i].y * p.size);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw a water droplet shape (teardrop).
   */
  function drawDroplet(ctx, p) {
    var s = p.size;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();

    // Teardrop: pointed top, rounded bottom
    ctx.moveTo(0, -s * 1.2);
    ctx.bezierCurveTo(
      s * 0.5, -s * 0.5,
      s * 0.7, s * 0.2,
      0, s * 0.8
    );
    ctx.bezierCurveTo(
      -s * 0.7, s * 0.2,
      -s * 0.5, -s * 0.5,
      0, -s * 1.2
    );
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    // Tiny specular highlight inside droplet
    ctx.beginPath();
    ctx.arc(-s * 0.15, -s * 0.1, s * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dispatch rendering based on shape type.
   */
  function drawParticle(ctx, p) {
    switch (p.shapeType) {
      case 'star':
        drawStar(ctx, p);
        break;
      case 'chunk':
        drawChunk(ctx, p);
        break;
      case 'droplet':
        drawDroplet(ctx, p);
        break;
      case 'circle':
      default:
        drawCircle(ctx, p);
        break;
    }
  }


  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════
  return {
    /**
     * Pre-allocate the particle pool.
     */
    init: function () {
      particles = [];
      for (var i = 0; i < POOL_SIZE; i++) {
        particles.push(createParticle());
      }
    },

    /**
     * Emit `count` particles of the given type at position (x, y).
     * @param {number} x — canvas X position
     * @param {number} y — canvas Y position
     * @param {string} type — one of: plaque, tartar, cavity, water, sparkle, damage
     * @param {number} count — number of particles to emit
     */
    emit: function (x, y, type, count) {
      var config = TYPE_CONFIGS[type];
      if (!config) {
        console.warn('[ParticleSystem] Unknown particle type:', type);
        return;
      }

      for (var i = 0; i < count; i++) {
        var p = getParticle();
        if (!p) break; // pool exhausted

        p.active = true;
        p.type = type;
        p.x = x + (Math.random() - 0.5) * 6;
        p.y = y + (Math.random() - 0.5) * 6;

        // Random direction
        var angle, speed;
        if (config.splash) {
          // Water: arc pattern (upward hemisphere with spread)
          angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
          speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        } else {
          angle = Math.random() * Math.PI * 2;
          speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        }
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        // Size
        p.baseSize = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        p.size = p.baseSize;

        // Color
        p.color = config.colors[Math.floor(Math.random() * config.colors.length)];

        // Lifetime
        p.maxLife = config.maxLife * (0.8 + Math.random() * 0.4);
        p.life = p.maxLife;
        p.opacity = 1;

        // Physics
        p.gravity = config.gravity;

        // Extended behaviors
        p.wobblePhase = Math.random() * Math.PI * 2;
        p.wobbleFreq = config.wobbleFreq || 0;
        p.wobbleAmp = config.wobbleAmp || 0;
        p.twinkle = config.twinkle || false;
        p.twinkleFreq = config.twinkleFreq || 0;
        p.expand = config.expand || false;
        p.expandRate = config.expandRate || 0;
        p.shrink = config.shrink || false;
        p.shake = config.shake || false;
        p.shapeType = config.shape || 'circle';

        // Rotation
        p.rotation = Math.random() * Math.PI * 2;
        p.rotationSpeed = (Math.random() - 0.5) * 4;

        // Chunk vertices for tartar-type particles
        if (p.shapeType === 'chunk') {
          p.chunkVerts = generateChunkVerts();
        } else {
          p.chunkVerts = null;
        }
      }
    },

    /**
     * Update all active particles.
     * @param {number} dt — delta time in seconds
     */
    update: function (dt) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (!p.active) continue;

        // Decrease lifetime
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }

        // Normalized life progress (1 = just born, 0 = about to die)
        var lifeRatio = p.life / p.maxLife;

        // Apply gravity
        p.vy += p.gravity * dt;

        // Apply velocity
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wobble (side-to-side oscillation) for plaque and sparkle
        if (p.wobbleFreq > 0) {
          p.wobblePhase += p.wobbleFreq * dt * Math.PI * 2;
          p.x += Math.sin(p.wobblePhase) * p.wobbleAmp * dt;
        }

        // Rotation
        p.rotation += p.rotationSpeed * dt;

        // Opacity — fade out toward end of life
        p.opacity = Math.min(1, lifeRatio * 2); // quick fade in, then fade out in second half
        if (lifeRatio < 0.5) {
          p.opacity = lifeRatio * 2;
        }

        // Twinkle — oscillating opacity for sparkle particles
        if (p.twinkle) {
          var twinkleVal = Math.sin(p.wobblePhase * p.twinkleFreq) * 0.4 + 0.6;
          p.opacity *= twinkleVal;
        }

        // Size modifications
        if (p.shrink) {
          // Shrink over lifetime
          p.size = p.baseSize * lifeRatio;
        } else if (p.expand) {
          // Expand over lifetime (damage particles)
          p.size = p.baseSize * (1 + (1 - lifeRatio) * p.expandRate);
        }

        // Shake — random position jitter for damage particles
        if (p.shake) {
          p.x += (Math.random() - 0.5) * 3;
          p.y += (Math.random() - 0.5) * 3;
        }

        // Slow down slightly (drag)
        p.vx *= (1 - dt * 0.8);
        p.vy *= (1 - dt * 0.3);
      }
    },

    /**
     * Render all active particles to the canvas context.
     * @param {CanvasRenderingContext2D} ctx
     */
    render: function (ctx) {
      ctx.save();

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (!p.active) continue;
        if (p.opacity <= 0.01 || p.size <= 0.1) continue;

        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        drawParticle(ctx, p);
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    },

    /**
     * Deactivate all particles (instant clear).
     */
    clear: function () {
      for (var i = 0; i < particles.length; i++) {
        particles[i].active = false;
      }
    },

    /** Expose pool for debugging */
    _pool: particles
  };
})();
