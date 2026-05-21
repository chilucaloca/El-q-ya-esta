/**
 * teeth.js — Dental Adventure: Teeth System
 * 
 * Manages all 32 teeth in a realistic dental arch layout.
 * Each tooth type has a distinct bezier-curve shape, gradient shading,
 * and can display plaque, tartar, and cavity overlays.
 * 
 * Usage:
 *   window.TeethSystem.init();
 *   window.TeethSystem.setupForLevel(levelData);
 *   window.TeethSystem.update(dt);
 *   window.TeethSystem.render(ctx);
 */
window.TeethSystem = (function () {
  'use strict';

  // ─── Tooth Type Definitions ───────────────────────────────────────
  // Each type defines a bezier path builder, default dimensions, and cusp info.
  const TOOTH_TYPES = {
    'central-incisor': {
      baseWidth: 38,
      baseHeight: 58,
      displayNameUpper: { right: 'Incisivo Central Sup. Der.', left: 'Incisivo Central Sup. Izq.' },
      displayNameLower: { right: 'Incisivo Central Inf. Der.', left: 'Incisivo Central Inf. Izq.' },
      cusps: 0,
      /** Wide rectangular, flat biting edge, wider at crown */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          // Root tip (top, narrower)
          ctx.moveTo(-hw * 0.25, -hh);
          ctx.bezierCurveTo(-hw * 0.3, -hh * 0.7, -hw * 0.55, -hh * 0.5, -hw * 0.6, -hh * 0.2);
          // Left side, crown widens
          ctx.bezierCurveTo(-hw * 0.7, hh * 0.1, -hw * 0.85, hh * 0.4, -hw * 0.9, hh * 0.7);
          // Flat biting edge (bottom)
          ctx.bezierCurveTo(-hw * 0.85, hh * 0.95, -hw * 0.4, hh, -hw * 0.05, hh);
          ctx.lineTo(hw * 0.05, hh);
          ctx.bezierCurveTo(hw * 0.4, hh, hw * 0.85, hh * 0.95, hw * 0.9, hh * 0.7);
          // Right side
          ctx.bezierCurveTo(hw * 0.85, hh * 0.4, hw * 0.7, hh * 0.1, hw * 0.6, -hh * 0.2);
          // Back to root
          ctx.bezierCurveTo(hw * 0.55, -hh * 0.5, hw * 0.3, -hh * 0.7, hw * 0.25, -hh);
          ctx.bezierCurveTo(hw * 0.1, -hh * 1.05, -hw * 0.1, -hh * 1.05, -hw * 0.25, -hh);
        } else {
          // Lower: root at bottom, crown at top
          ctx.moveTo(-hw * 0.25, hh);
          ctx.bezierCurveTo(-hw * 0.3, hh * 0.7, -hw * 0.55, hh * 0.5, -hw * 0.6, hh * 0.2);
          ctx.bezierCurveTo(-hw * 0.7, -hh * 0.1, -hw * 0.85, -hh * 0.4, -hw * 0.9, -hh * 0.7);
          // Flat biting edge (top)
          ctx.bezierCurveTo(-hw * 0.85, -hh * 0.95, -hw * 0.4, -hh, -hw * 0.05, -hh);
          ctx.lineTo(hw * 0.05, -hh);
          ctx.bezierCurveTo(hw * 0.4, -hh, hw * 0.85, -hh * 0.95, hw * 0.9, -hh * 0.7);
          ctx.bezierCurveTo(hw * 0.85, -hh * 0.4, hw * 0.7, -hh * 0.1, hw * 0.6, hh * 0.2);
          ctx.bezierCurveTo(hw * 0.55, hh * 0.5, hw * 0.3, hh * 0.7, hw * 0.25, hh);
          ctx.bezierCurveTo(hw * 0.1, hh * 1.05, -hw * 0.1, hh * 1.05, -hw * 0.25, hh);
        }
        ctx.closePath();
      }
    },

    'lateral-incisor': {
      baseWidth: 32,
      baseHeight: 55,
      displayNameUpper: { right: 'Incisivo Lateral Sup. Der.', left: 'Incisivo Lateral Sup. Izq.' },
      displayNameLower: { right: 'Incisivo Lateral Inf. Der.', left: 'Incisivo Lateral Inf. Izq.' },
      cusps: 0,
      /** Narrower than central, slightly rounded biting edge */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          ctx.moveTo(-hw * 0.2, -hh);
          ctx.bezierCurveTo(-hw * 0.25, -hh * 0.65, -hw * 0.5, -hh * 0.4, -hw * 0.55, -hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.65, hh * 0.15, -hw * 0.75, hh * 0.45, -hw * 0.8, hh * 0.65);
          // Slightly rounded biting edge
          ctx.bezierCurveTo(-hw * 0.75, hh * 0.9, -hw * 0.35, hh * 1.02, 0, hh * 1.02);
          ctx.bezierCurveTo(hw * 0.35, hh * 1.02, hw * 0.75, hh * 0.9, hw * 0.8, hh * 0.65);
          ctx.bezierCurveTo(hw * 0.75, hh * 0.45, hw * 0.65, hh * 0.15, hw * 0.55, -hh * 0.15);
          ctx.bezierCurveTo(hw * 0.5, -hh * 0.4, hw * 0.25, -hh * 0.65, hw * 0.2, -hh);
          ctx.bezierCurveTo(hw * 0.08, -hh * 1.05, -hw * 0.08, -hh * 1.05, -hw * 0.2, -hh);
        } else {
          ctx.moveTo(-hw * 0.2, hh);
          ctx.bezierCurveTo(-hw * 0.25, hh * 0.65, -hw * 0.5, hh * 0.4, -hw * 0.55, hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.65, -hh * 0.15, -hw * 0.75, -hh * 0.45, -hw * 0.8, -hh * 0.65);
          ctx.bezierCurveTo(-hw * 0.75, -hh * 0.9, -hw * 0.35, -hh * 1.02, 0, -hh * 1.02);
          ctx.bezierCurveTo(hw * 0.35, -hh * 1.02, hw * 0.75, -hh * 0.9, hw * 0.8, -hh * 0.65);
          ctx.bezierCurveTo(hw * 0.75, -hh * 0.45, hw * 0.65, -hh * 0.15, hw * 0.55, hh * 0.15);
          ctx.bezierCurveTo(hw * 0.5, hh * 0.4, hw * 0.25, hh * 0.65, hw * 0.2, hh);
          ctx.bezierCurveTo(hw * 0.08, hh * 1.05, -hw * 0.08, hh * 1.05, -hw * 0.2, hh);
        }
        ctx.closePath();
      }
    },

    'canine': {
      baseWidth: 34,
      baseHeight: 65,
      displayNameUpper: { right: 'Canino Sup. Der.', left: 'Canino Sup. Izq.' },
      displayNameLower: { right: 'Canino Inf. Der.', left: 'Canino Inf. Izq.' },
      cusps: 1,
      /** Pointed/triangular tip, longer, prominent */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          // Root (top), thicker root for canine
          ctx.moveTo(-hw * 0.15, -hh);
          ctx.bezierCurveTo(-hw * 0.2, -hh * 0.7, -hw * 0.45, -hh * 0.45, -hw * 0.55, -hh * 0.15);
          // Left shoulder widens
          ctx.bezierCurveTo(-hw * 0.7, hh * 0.1, -hw * 0.85, hh * 0.35, -hw * 0.8, hh * 0.55);
          // Left slope to pointed tip
          ctx.bezierCurveTo(-hw * 0.7, hh * 0.75, -hw * 0.4, hh * 0.9, -hw * 0.1, hh * 1.0);
          // Pointed cusp tip
          ctx.lineTo(0, hh * 1.08);
          ctx.lineTo(hw * 0.1, hh * 1.0);
          // Right slope from tip
          ctx.bezierCurveTo(hw * 0.4, hh * 0.9, hw * 0.7, hh * 0.75, hw * 0.8, hh * 0.55);
          ctx.bezierCurveTo(hw * 0.85, hh * 0.35, hw * 0.7, hh * 0.1, hw * 0.55, -hh * 0.15);
          ctx.bezierCurveTo(hw * 0.45, -hh * 0.45, hw * 0.2, -hh * 0.7, hw * 0.15, -hh);
          ctx.bezierCurveTo(hw * 0.05, -hh * 1.06, -hw * 0.05, -hh * 1.06, -hw * 0.15, -hh);
        } else {
          ctx.moveTo(-hw * 0.15, hh);
          ctx.bezierCurveTo(-hw * 0.2, hh * 0.7, -hw * 0.45, hh * 0.45, -hw * 0.55, hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.7, -hh * 0.1, -hw * 0.85, -hh * 0.35, -hw * 0.8, -hh * 0.55);
          ctx.bezierCurveTo(-hw * 0.7, -hh * 0.75, -hw * 0.4, -hh * 0.9, -hw * 0.1, -hh * 1.0);
          ctx.lineTo(0, -hh * 1.08);
          ctx.lineTo(hw * 0.1, -hh * 1.0);
          ctx.bezierCurveTo(hw * 0.4, -hh * 0.9, hw * 0.7, -hh * 0.75, hw * 0.8, -hh * 0.55);
          ctx.bezierCurveTo(hw * 0.85, -hh * 0.35, hw * 0.7, -hh * 0.1, hw * 0.55, hh * 0.15);
          ctx.bezierCurveTo(hw * 0.45, hh * 0.45, hw * 0.2, hh * 0.7, hw * 0.15, hh);
          ctx.bezierCurveTo(hw * 0.05, hh * 1.06, -hw * 0.05, hh * 1.06, -hw * 0.15, hh);
        }
        ctx.closePath();
      }
    },

    'premolar-1': {
      baseWidth: 36,
      baseHeight: 55,
      displayNameUpper: { right: 'Primer Premolar Sup. Der.', left: 'Primer Premolar Sup. Izq.' },
      displayNameLower: { right: 'Primer Premolar Inf. Der.', left: 'Primer Premolar Inf. Izq.' },
      cusps: 2,
      /** Two cusps, pentagonal body */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          // Root
          ctx.moveTo(-hw * 0.15, -hh);
          ctx.bezierCurveTo(-hw * 0.22, -hh * 0.7, -hw * 0.5, -hh * 0.45, -hw * 0.6, -hh * 0.2);
          // Left side — pentagonal angle
          ctx.bezierCurveTo(-hw * 0.75, hh * 0.05, -hw * 0.9, hh * 0.3, -hw * 0.88, hh * 0.5);
          // Left shoulder
          ctx.lineTo(-hw * 0.85, hh * 0.65);
          // Two-cusp biting surface
          ctx.bezierCurveTo(-hw * 0.7, hh * 0.88, -hw * 0.35, hh * 0.95, -hw * 0.12, hh * 0.85);
          // Valley between cusps
          ctx.bezierCurveTo(-hw * 0.04, hh * 0.78, hw * 0.04, hh * 0.78, hw * 0.12, hh * 0.85);
          ctx.bezierCurveTo(hw * 0.35, hh * 0.95, hw * 0.7, hh * 0.88, hw * 0.85, hh * 0.65);
          // Right shoulder
          ctx.lineTo(hw * 0.88, hh * 0.5);
          ctx.bezierCurveTo(hw * 0.9, hh * 0.3, hw * 0.75, hh * 0.05, hw * 0.6, -hh * 0.2);
          ctx.bezierCurveTo(hw * 0.5, -hh * 0.45, hw * 0.22, -hh * 0.7, hw * 0.15, -hh);
          ctx.bezierCurveTo(hw * 0.05, -hh * 1.05, -hw * 0.05, -hh * 1.05, -hw * 0.15, -hh);
        } else {
          ctx.moveTo(-hw * 0.15, hh);
          ctx.bezierCurveTo(-hw * 0.22, hh * 0.7, -hw * 0.5, hh * 0.45, -hw * 0.6, hh * 0.2);
          ctx.bezierCurveTo(-hw * 0.75, -hh * 0.05, -hw * 0.9, -hh * 0.3, -hw * 0.88, -hh * 0.5);
          ctx.lineTo(-hw * 0.85, -hh * 0.65);
          ctx.bezierCurveTo(-hw * 0.7, -hh * 0.88, -hw * 0.35, -hh * 0.95, -hw * 0.12, -hh * 0.85);
          ctx.bezierCurveTo(-hw * 0.04, -hh * 0.78, hw * 0.04, -hh * 0.78, hw * 0.12, -hh * 0.85);
          ctx.bezierCurveTo(hw * 0.35, -hh * 0.95, hw * 0.7, -hh * 0.88, hw * 0.85, -hh * 0.65);
          ctx.lineTo(hw * 0.88, -hh * 0.5);
          ctx.bezierCurveTo(hw * 0.9, -hh * 0.3, hw * 0.75, -hh * 0.05, hw * 0.6, hh * 0.2);
          ctx.bezierCurveTo(hw * 0.5, hh * 0.45, hw * 0.22, hh * 0.7, hw * 0.15, hh);
          ctx.bezierCurveTo(hw * 0.05, hh * 1.05, -hw * 0.05, hh * 1.05, -hw * 0.15, hh);
        }
        ctx.closePath();
      }
    },

    'premolar-2': {
      baseWidth: 34,
      baseHeight: 52,
      displayNameUpper: { right: 'Segundo Premolar Sup. Der.', left: 'Segundo Premolar Sup. Izq.' },
      displayNameLower: { right: 'Segundo Premolar Inf. Der.', left: 'Segundo Premolar Inf. Izq.' },
      cusps: 2,
      /** Two rounded cusps, slightly smaller than premolar-1 */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          ctx.moveTo(-hw * 0.18, -hh);
          ctx.bezierCurveTo(-hw * 0.25, -hh * 0.68, -hw * 0.48, -hh * 0.4, -hw * 0.58, -hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.72, hh * 0.1, -hw * 0.85, hh * 0.35, -hw * 0.82, hh * 0.55);
          // Rounded two-cusp surface
          ctx.bezierCurveTo(-hw * 0.78, hh * 0.75, -hw * 0.55, hh * 0.92, -hw * 0.3, hh * 0.95);
          ctx.bezierCurveTo(-hw * 0.12, hh * 0.9, -hw * 0.04, hh * 0.82, 0, hh * 0.8);
          ctx.bezierCurveTo(hw * 0.04, hh * 0.82, hw * 0.12, hh * 0.9, hw * 0.3, hh * 0.95);
          ctx.bezierCurveTo(hw * 0.55, hh * 0.92, hw * 0.78, hh * 0.75, hw * 0.82, hh * 0.55);
          ctx.bezierCurveTo(hw * 0.85, hh * 0.35, hw * 0.72, hh * 0.1, hw * 0.58, -hh * 0.15);
          ctx.bezierCurveTo(hw * 0.48, -hh * 0.4, hw * 0.25, -hh * 0.68, hw * 0.18, -hh);
          ctx.bezierCurveTo(hw * 0.06, -hh * 1.04, -hw * 0.06, -hh * 1.04, -hw * 0.18, -hh);
        } else {
          ctx.moveTo(-hw * 0.18, hh);
          ctx.bezierCurveTo(-hw * 0.25, hh * 0.68, -hw * 0.48, hh * 0.4, -hw * 0.58, hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.72, -hh * 0.1, -hw * 0.85, -hh * 0.35, -hw * 0.82, -hh * 0.55);
          ctx.bezierCurveTo(-hw * 0.78, -hh * 0.75, -hw * 0.55, -hh * 0.92, -hw * 0.3, -hh * 0.95);
          ctx.bezierCurveTo(-hw * 0.12, -hh * 0.9, -hw * 0.04, -hh * 0.82, 0, -hh * 0.8);
          ctx.bezierCurveTo(hw * 0.04, -hh * 0.82, hw * 0.12, -hh * 0.9, hw * 0.3, -hh * 0.95);
          ctx.bezierCurveTo(hw * 0.55, -hh * 0.92, hw * 0.78, -hh * 0.75, hw * 0.82, -hh * 0.55);
          ctx.bezierCurveTo(hw * 0.85, -hh * 0.35, hw * 0.72, -hh * 0.1, hw * 0.58, hh * 0.15);
          ctx.bezierCurveTo(hw * 0.48, hh * 0.4, hw * 0.25, hh * 0.68, hw * 0.18, hh);
          ctx.bezierCurveTo(hw * 0.06, hh * 1.04, -hw * 0.06, hh * 1.04, -hw * 0.18, hh);
        }
        ctx.closePath();
      }
    },

    'molar-1': {
      baseWidth: 44,
      baseHeight: 55,
      displayNameUpper: { right: 'Primer Molar Sup. Der.', left: 'Primer Molar Sup. Izq.' },
      displayNameLower: { right: 'Primer Molar Inf. Der.', left: 'Primer Molar Inf. Izq.' },
      cusps: 4,
      /** Large, 4 cusps, widest tooth */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          // Root area (can hint at two roots)
          ctx.moveTo(-hw * 0.3, -hh);
          ctx.bezierCurveTo(-hw * 0.35, -hh * 0.65, -hw * 0.6, -hh * 0.4, -hw * 0.72, -hh * 0.15);
          // Wide body
          ctx.bezierCurveTo(-hw * 0.88, hh * 0.1, -hw * 0.95, hh * 0.35, -hw * 0.92, hh * 0.52);
          // Four-cusp biting surface
          ctx.bezierCurveTo(-hw * 0.9, hh * 0.72, -hw * 0.7, hh * 0.88, -hw * 0.5, hh * 0.93);
          // Cusp valley 1
          ctx.bezierCurveTo(-hw * 0.35, hh * 0.87, -hw * 0.2, hh * 0.83, -hw * 0.08, hh * 0.85);
          // Central groove
          ctx.bezierCurveTo(-hw * 0.02, hh * 0.8, hw * 0.02, hh * 0.8, hw * 0.08, hh * 0.85);
          // Cusp valley 2
          ctx.bezierCurveTo(hw * 0.2, hh * 0.83, hw * 0.35, hh * 0.87, hw * 0.5, hh * 0.93);
          ctx.bezierCurveTo(hw * 0.7, hh * 0.88, hw * 0.9, hh * 0.72, hw * 0.92, hh * 0.52);
          ctx.bezierCurveTo(hw * 0.95, hh * 0.35, hw * 0.88, hh * 0.1, hw * 0.72, -hh * 0.15);
          ctx.bezierCurveTo(hw * 0.6, -hh * 0.4, hw * 0.35, -hh * 0.65, hw * 0.3, -hh);
          // Root closure (hint at bifurcation)
          ctx.bezierCurveTo(hw * 0.15, -hh * 1.04, hw * 0.05, -hh * 0.95, 0, -hh * 0.92);
          ctx.bezierCurveTo(-hw * 0.05, -hh * 0.95, -hw * 0.15, -hh * 1.04, -hw * 0.3, -hh);
        } else {
          ctx.moveTo(-hw * 0.3, hh);
          ctx.bezierCurveTo(-hw * 0.35, hh * 0.65, -hw * 0.6, hh * 0.4, -hw * 0.72, hh * 0.15);
          ctx.bezierCurveTo(-hw * 0.88, -hh * 0.1, -hw * 0.95, -hh * 0.35, -hw * 0.92, -hh * 0.52);
          ctx.bezierCurveTo(-hw * 0.9, -hh * 0.72, -hw * 0.7, -hh * 0.88, -hw * 0.5, -hh * 0.93);
          ctx.bezierCurveTo(-hw * 0.35, -hh * 0.87, -hw * 0.2, -hh * 0.83, -hw * 0.08, -hh * 0.85);
          ctx.bezierCurveTo(-hw * 0.02, -hh * 0.8, hw * 0.02, -hh * 0.8, hw * 0.08, -hh * 0.85);
          ctx.bezierCurveTo(hw * 0.2, -hh * 0.83, hw * 0.35, -hh * 0.87, hw * 0.5, -hh * 0.93);
          ctx.bezierCurveTo(hw * 0.7, -hh * 0.88, hw * 0.9, -hh * 0.72, hw * 0.92, -hh * 0.52);
          ctx.bezierCurveTo(hw * 0.95, -hh * 0.35, hw * 0.88, -hh * 0.1, hw * 0.72, hh * 0.15);
          ctx.bezierCurveTo(hw * 0.6, hh * 0.4, hw * 0.35, hh * 0.65, hw * 0.3, hh);
          ctx.bezierCurveTo(hw * 0.15, hh * 1.04, hw * 0.05, hh * 0.95, 0, hh * 0.92);
          ctx.bezierCurveTo(-hw * 0.05, hh * 0.95, -hw * 0.15, hh * 1.04, -hw * 0.3, hh);
        }
        ctx.closePath();
      }
    },

    'molar-2': {
      baseWidth: 40,
      baseHeight: 52,
      displayNameUpper: { right: 'Segundo Molar Sup. Der.', left: 'Segundo Molar Sup. Izq.' },
      displayNameLower: { right: 'Segundo Molar Inf. Der.', left: 'Segundo Molar Inf. Izq.' },
      cusps: 4,
      /** Similar to molar-1 but slightly smaller, rounder */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          ctx.moveTo(-hw * 0.28, -hh);
          ctx.bezierCurveTo(-hw * 0.32, -hh * 0.62, -hw * 0.55, -hh * 0.38, -hw * 0.68, -hh * 0.12);
          ctx.bezierCurveTo(-hw * 0.82, hh * 0.12, -hw * 0.9, hh * 0.38, -hw * 0.88, hh * 0.55);
          // Rounded four-cusp surface
          ctx.bezierCurveTo(-hw * 0.85, hh * 0.75, -hw * 0.65, hh * 0.9, -hw * 0.42, hh * 0.94);
          ctx.bezierCurveTo(-hw * 0.25, hh * 0.88, -hw * 0.1, hh * 0.82, 0, hh * 0.8);
          ctx.bezierCurveTo(hw * 0.1, hh * 0.82, hw * 0.25, hh * 0.88, hw * 0.42, hh * 0.94);
          ctx.bezierCurveTo(hw * 0.65, hh * 0.9, hw * 0.85, hh * 0.75, hw * 0.88, hh * 0.55);
          ctx.bezierCurveTo(hw * 0.9, hh * 0.38, hw * 0.82, hh * 0.12, hw * 0.68, -hh * 0.12);
          ctx.bezierCurveTo(hw * 0.55, -hh * 0.38, hw * 0.32, -hh * 0.62, hw * 0.28, -hh);
          ctx.bezierCurveTo(hw * 0.12, -hh * 1.03, -hw * 0.12, -hh * 1.03, -hw * 0.28, -hh);
        } else {
          ctx.moveTo(-hw * 0.28, hh);
          ctx.bezierCurveTo(-hw * 0.32, hh * 0.62, -hw * 0.55, hh * 0.38, -hw * 0.68, hh * 0.12);
          ctx.bezierCurveTo(-hw * 0.82, -hh * 0.12, -hw * 0.9, -hh * 0.38, -hw * 0.88, -hh * 0.55);
          ctx.bezierCurveTo(-hw * 0.85, -hh * 0.75, -hw * 0.65, -hh * 0.9, -hw * 0.42, -hh * 0.94);
          ctx.bezierCurveTo(-hw * 0.25, -hh * 0.88, -hw * 0.1, -hh * 0.82, 0, -hh * 0.8);
          ctx.bezierCurveTo(hw * 0.1, -hh * 0.82, hw * 0.25, -hh * 0.88, hw * 0.42, -hh * 0.94);
          ctx.bezierCurveTo(hw * 0.65, -hh * 0.9, hw * 0.85, -hh * 0.75, hw * 0.88, -hh * 0.55);
          ctx.bezierCurveTo(hw * 0.9, -hh * 0.38, hw * 0.82, -hh * 0.12, hw * 0.68, hh * 0.12);
          ctx.bezierCurveTo(hw * 0.55, hh * 0.38, hw * 0.32, hh * 0.62, hw * 0.28, hh);
          ctx.bezierCurveTo(hw * 0.12, hh * 1.03, -hw * 0.12, hh * 1.03, -hw * 0.28, hh);
        }
        ctx.closePath();
      }
    },

    'molar-3': {
      baseWidth: 36,
      baseHeight: 48,
      displayNameUpper: { right: 'Tercer Molar Sup. Der.', left: 'Tercer Molar Sup. Izq.' },
      displayNameLower: { right: 'Tercer Molar Inf. Der.', left: 'Tercer Molar Inf. Izq.' },
      cusps: 3,
      /** Smallest molar, slightly irregular shape (wisdom tooth) */
      buildPath: function (ctx, w, h, isUpper) {
        var hw = w / 2, hh = h / 2;
        ctx.beginPath();
        if (isUpper) {
          ctx.moveTo(-hw * 0.22, -hh);
          ctx.bezierCurveTo(-hw * 0.3, -hh * 0.6, -hw * 0.52, -hh * 0.35, -hw * 0.62, -hh * 0.1);
          // Slightly asymmetric/irregular body
          ctx.bezierCurveTo(-hw * 0.78, hh * 0.15, -hw * 0.88, hh * 0.4, -hw * 0.82, hh * 0.58);
          // Irregular three-cusp surface
          ctx.bezierCurveTo(-hw * 0.78, hh * 0.78, -hw * 0.55, hh * 0.92, -hw * 0.32, hh * 0.88);
          ctx.bezierCurveTo(-hw * 0.15, hh * 0.82, -hw * 0.05, hh * 0.78, hw * 0.05, hh * 0.82);
          ctx.bezierCurveTo(hw * 0.22, hh * 0.9, hw * 0.5, hh * 0.85, hw * 0.7, hh * 0.78);
          ctx.bezierCurveTo(hw * 0.85, hh * 0.65, hw * 0.88, hh * 0.4, hw * 0.78, hh * 0.15);
          ctx.bezierCurveTo(hw * 0.65, -hh * 0.1, hw * 0.5, -hh * 0.35, hw * 0.35, -hh * 0.6);
          ctx.bezierCurveTo(hw * 0.28, -hh * 0.8, hw * 0.18, -hh * 0.95, hw * 0.12, -hh);
          ctx.bezierCurveTo(hw * 0.04, -hh * 1.02, -hw * 0.1, -hh * 1.02, -hw * 0.22, -hh);
        } else {
          ctx.moveTo(-hw * 0.22, hh);
          ctx.bezierCurveTo(-hw * 0.3, hh * 0.6, -hw * 0.52, hh * 0.35, -hw * 0.62, hh * 0.1);
          ctx.bezierCurveTo(-hw * 0.78, -hh * 0.15, -hw * 0.88, -hh * 0.4, -hw * 0.82, -hh * 0.58);
          ctx.bezierCurveTo(-hw * 0.78, -hh * 0.78, -hw * 0.55, -hh * 0.92, -hw * 0.32, -hh * 0.88);
          ctx.bezierCurveTo(-hw * 0.15, -hh * 0.82, -hw * 0.05, -hh * 0.78, hw * 0.05, -hh * 0.82);
          ctx.bezierCurveTo(hw * 0.22, -hh * 0.9, hw * 0.5, -hh * 0.85, hw * 0.7, -hh * 0.78);
          ctx.bezierCurveTo(hw * 0.85, -hh * 0.65, hw * 0.88, -hh * 0.4, hw * 0.78, -hh * 0.15);
          ctx.bezierCurveTo(hw * 0.65, hh * 0.1, hw * 0.5, hh * 0.35, hw * 0.35, hh * 0.6);
          ctx.bezierCurveTo(hw * 0.28, hh * 0.8, hw * 0.18, hh * 0.95, hw * 0.12, hh);
          ctx.bezierCurveTo(hw * 0.04, hh * 1.02, -hw * 0.1, hh * 1.02, -hw * 0.22, hh);
        }
        ctx.closePath();
      }
    }
  };

  // ─── Dental Arch Layout ───────────────────────────────────────────
  // Ordered from left to right as viewer sees them.
  // Upper arch: right-side → left-side (viewer's left = patient's right)
  var UPPER_ARCH_ORDER = [
    { quadrant: 'upper-right', type: 'molar-3' },
    { quadrant: 'upper-right', type: 'molar-2' },
    { quadrant: 'upper-right', type: 'molar-1' },
    { quadrant: 'upper-right', type: 'premolar-2' },
    { quadrant: 'upper-right', type: 'premolar-1' },
    { quadrant: 'upper-right', type: 'canine' },
    { quadrant: 'upper-right', type: 'lateral-incisor' },
    { quadrant: 'upper-right', type: 'central-incisor' },
    { quadrant: 'upper-left', type: 'central-incisor' },
    { quadrant: 'upper-left', type: 'lateral-incisor' },
    { quadrant: 'upper-left', type: 'canine' },
    { quadrant: 'upper-left', type: 'premolar-1' },
    { quadrant: 'upper-left', type: 'premolar-2' },
    { quadrant: 'upper-left', type: 'molar-1' },
    { quadrant: 'upper-left', type: 'molar-2' },
    { quadrant: 'upper-left', type: 'molar-3' }
  ];

  var LOWER_ARCH_ORDER = [
    { quadrant: 'lower-right', type: 'molar-3' },
    { quadrant: 'lower-right', type: 'molar-2' },
    { quadrant: 'lower-right', type: 'molar-1' },
    { quadrant: 'lower-right', type: 'premolar-2' },
    { quadrant: 'lower-right', type: 'premolar-1' },
    { quadrant: 'lower-right', type: 'canine' },
    { quadrant: 'lower-right', type: 'lateral-incisor' },
    { quadrant: 'lower-right', type: 'central-incisor' },
    { quadrant: 'lower-left', type: 'central-incisor' },
    { quadrant: 'lower-left', type: 'lateral-incisor' },
    { quadrant: 'lower-left', type: 'canine' },
    { quadrant: 'lower-left', type: 'premolar-1' },
    { quadrant: 'lower-left', type: 'premolar-2' },
    { quadrant: 'lower-left', type: 'molar-1' },
    { quadrant: 'lower-left', type: 'molar-2' },
    { quadrant: 'lower-left', type: 'molar-3' }
  ];

  // ─── Module State ─────────────────────────────────────────────────
  var teeth = [];

  // ─── Helper: Build a tooth ID ─────────────────────────────────────
  function buildId(quadrant, type) {
    return quadrant + '-' + type;
  }

  // ─── Helper: Get Spanish display name ─────────────────────────────
  function getDisplayName(type, quadrant) {
    var def = TOOTH_TYPES[type];
    var isUpper = quadrant.indexOf('upper') === 0;
    var side = quadrant.indexOf('right') !== -1 ? 'right' : 'left';
    var names = isUpper ? def.displayNameUpper : def.displayNameLower;
    return names[side];
  }

  // ─── Create a single tooth object ─────────────────────────────────
  function createTooth(quadrant, type) {
    var def = TOOTH_TYPES[type];
    return {
      id: buildId(quadrant, type),
      type: type,
      quadrant: quadrant,
      displayName: getDisplayName(type, quadrant),
      x: 0,
      y: 0,
      width: def.baseWidth,
      height: def.baseHeight,
      rotation: 0,
      problems: { plaque: 0, tartar: 0, cavity: 0 },
      health: 100,
      isHovered: false,
      isSelected: false,
      glowAnim: 0,

      /**
       * Reduce a specific problem by `amount`.
       * @param {string} problemType — 'plaque', 'tartar', or 'cavity'
       * @param {number} amount — how much to clean
       * @returns {number} actual amount cleaned
       */
      clean: function (problemType, amount) {
        var current = this.problems[problemType];
        if (current <= 0) return 0;
        var cleaned = Math.min(current, amount);
        this.problems[problemType] = Math.max(0, current - cleaned);
        return cleaned;
      },

      /**
       * Reduce health by `amount` (clamped to 0).
       * @param {number} amount
       */
      damage: function (amount) {
        this.health = Math.max(0, this.health - amount);
      }
    };
  }

  // ─── Default arch layout (fallback if MouthRenderer hasn't set positions) ──
  function applyDefaultLayout() {
    var cx = 400; // assume 800px canvas width
    var cy = 340; // assume 680px canvas height
    var archWidth = 320;
    var upperBaseY = cy - 80;  // upper arch center Y
    var lowerBaseY = cy + 80;  // lower arch center Y
    var gap = 60; // half gap between arches

    for (var i = 0; i < 16; i++) {
      // Normalized position along half-arch: 0 = center, 1 = edge
      var t = (i < 8) ? (7 - i) / 7 : (i - 8) / 7;
      var sign = (i < 8) ? -1 : 1;
      var xOff = sign * t * archWidth * 0.5;
      // U-shape curve: teeth at center are further from mouth center
      var archCurve = t * t * 55;

      var upper = teeth[i];
      upper.x = cx + xOff;
      upper.y = upperBaseY - archCurve;
      upper.rotation = sign * t * 0.15; // slight tilt for back teeth

      var lower = teeth[16 + i];
      lower.x = cx + xOff;
      lower.y = lowerBaseY + archCurve;
      lower.rotation = -sign * t * 0.15;
    }
  }

  // ─── Rendering Helpers ────────────────────────────────────────────

  /**
   * Draw the base tooth shape with creamy white gradient and 3D shading.
   */
  function renderToothBase(ctx, tooth) {
    var def = TOOTH_TYPES[tooth.type];
    var isUpper = tooth.quadrant.indexOf('upper') === 0;
    var w = tooth.width;
    var h = tooth.height;

    ctx.save();
    ctx.translate(tooth.x, tooth.y);
    if (tooth.rotation) ctx.rotate(tooth.rotation);

    // — Root suggestion (partial visibility behind gum line) —
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.scale(1, 1);
    def.buildPath(ctx, w * 0.5, h * 0.35, isUpper);
    ctx.fillStyle = '#ddd5c4';
    ctx.fill();
    ctx.restore();

    // — Main tooth body path —
    def.buildPath(ctx, w, h, isUpper);

    // Creamy white gradient (light from top-left)
    var gx = -w * 0.3;
    var gy = -h * 0.3;
    var grad = ctx.createRadialGradient(gx, gy, 2, 0, 0, Math.max(w, h) * 0.9);
    grad.addColorStop(0, '#f8f4ee');   // bright highlight
    grad.addColorStop(0.3, '#f5f0e8'); // main creamy white
    grad.addColorStop(0.7, '#ede5d5'); // mid tone
    grad.addColorStop(1, '#e8dcc8');   // edge shadow
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle outline
    ctx.strokeStyle = '#d4c8b0';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // — Health-based tinting —
    if (tooth.health < 50) {
      def.buildPath(ctx, w, h, isUpper);
      var redAlpha = ((50 - tooth.health) / 50) * 0.2;
      ctx.fillStyle = 'rgba(200, 60, 60, ' + redAlpha + ')';
      ctx.fill();
    }

    // — Crack lines for very damaged teeth —
    if (tooth.health < 20) {
      ctx.save();
      ctx.strokeStyle = 'rgba(80, 40, 20, 0.5)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      // Random-ish cracks based on tooth id hash
      var seed = tooth.id.length * 7 + tooth.health;
      ctx.moveTo(-w * 0.1, -h * 0.15);
      ctx.lineTo(-w * 0.05 + (seed % 5), h * 0.1);
      ctx.lineTo(w * 0.08, h * 0.25);
      ctx.moveTo(w * 0.05, -h * 0.1);
      ctx.lineTo(w * 0.12 - (seed % 3), h * 0.05);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw cusp/groove surface details for premolars and molars.
   */
  function renderSurfaceDetails(ctx, tooth) {
    var def = TOOTH_TYPES[tooth.type];
    if (def.cusps < 2) return; // only premolars and molars

    var isUpper = tooth.quadrant.indexOf('upper') === 0;
    var w = tooth.width;
    var h = tooth.height;
    var bitingSide = isUpper ? 1 : -1; // +1 = biting edge at bottom, -1 = at top

    ctx.save();
    ctx.translate(tooth.x, tooth.y);
    if (tooth.rotation) ctx.rotate(tooth.rotation);

    ctx.strokeStyle = 'rgba(180, 170, 150, 0.4)';
    ctx.lineWidth = 0.6;

    if (def.cusps === 2) {
      // Premolar groove — single central line
      ctx.beginPath();
      ctx.moveTo(-w * 0.15, bitingSide * h * 0.2);
      ctx.quadraticCurveTo(0, bitingSide * h * 0.15, w * 0.15, bitingSide * h * 0.2);
      ctx.stroke();
    } else if (def.cusps >= 3) {
      // Molar grooves — cross-shaped fissure pattern
      ctx.beginPath();
      // Horizontal groove
      ctx.moveTo(-w * 0.28, bitingSide * h * 0.22);
      ctx.quadraticCurveTo(0, bitingSide * h * 0.17, w * 0.28, bitingSide * h * 0.22);
      ctx.stroke();

      ctx.beginPath();
      // Vertical groove
      ctx.moveTo(0, bitingSide * h * 0.08);
      ctx.quadraticCurveTo(w * 0.02, bitingSide * h * 0.2, 0, bitingSide * h * 0.32);
      ctx.stroke();

      // Additional cusp highlights — small arcs
      for (var ci = 0; ci < def.cusps; ci++) {
        var angle = (ci / def.cusps) * Math.PI * 2;
        var radius = w * 0.15;
        var ccx = Math.cos(angle) * radius * 0.6;
        var ccy = bitingSide * (h * 0.2 + Math.sin(angle) * radius * 0.3);
        ctx.beginPath();
        ctx.arc(ccx, ccy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 245, 0.25)';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Draw problem overlays: plaque, tartar, cavities.
   */
  function renderProblems(ctx, tooth) {
    var def = TOOTH_TYPES[tooth.type];
    var isUpper = tooth.quadrant.indexOf('upper') === 0;
    var w = tooth.width;
    var h = tooth.height;

    ctx.save();
    ctx.translate(tooth.x, tooth.y);
    if (tooth.rotation) ctx.rotate(tooth.rotation);

    // — Plaque overlay: semi-transparent yellow-green wash —
    if (tooth.problems.plaque > 0) {
      var plaqueAlpha = (tooth.problems.plaque / 100) * 0.5;
      def.buildPath(ctx, w * 0.92, h * 0.88, isUpper);
      ctx.fillStyle = 'rgba(180, 170, 50, ' + plaqueAlpha.toFixed(3) + ')';
      ctx.fill();
    }

    // — Tartar: brown crusty patches at gum line —
    if (tooth.problems.tartar > 0) {
      var tartarIntensity = tooth.problems.tartar / 100;
      var gumSide = isUpper ? -1 : 1; // gum line is at root side
      var patches = Math.ceil(tartarIntensity * 4);
      var seed = tooth.id.length * 13;

      for (var ti = 0; ti < patches; ti++) {
        var px = -w * 0.3 + (((seed + ti * 37) % 100) / 100) * w * 0.6;
        var py = gumSide * h * (0.3 + (((seed + ti * 23) % 100) / 100) * 0.15);
        var pw = 4 + tartarIntensity * 8 + (((seed + ti * 11) % 100) / 100) * 4;
        var ph = 3 + tartarIntensity * 5;

        ctx.beginPath();
        // Irregular blob shape
        ctx.moveTo(px - pw / 2, py);
        ctx.bezierCurveTo(
          px - pw / 2, py - ph / 2,
          px - pw * 0.1, py - ph * 0.7,
          px + pw * 0.2, py - ph / 2
        );
        ctx.bezierCurveTo(
          px + pw / 2, py - ph * 0.3,
          px + pw / 2, py + ph * 0.3,
          px + pw * 0.3, py + ph / 2
        );
        ctx.bezierCurveTo(
          px, py + ph * 0.7,
          px - pw * 0.3, py + ph * 0.4,
          px - pw / 2, py
        );
        ctx.closePath();

        ctx.fillStyle = 'rgba(139, 115, 50, ' + (0.4 + tartarIntensity * 0.5).toFixed(3) + ')';
        ctx.fill();
      }
    }

    // — Cavities: dark brown-black spots —
    if (tooth.problems.cavity > 0) {
      var cavIntensity = tooth.problems.cavity / 100;
      var bitingSide = isUpper ? 1 : -1;
      var spots = Math.ceil(cavIntensity * 3);
      var cavSeed = tooth.id.length * 29;

      for (var ci = 0; ci < spots; ci++) {
        var cx2 = -w * 0.15 + (((cavSeed + ci * 41) % 100) / 100) * w * 0.3;
        var cy2 = bitingSide * h * (0.05 + (((cavSeed + ci * 19) % 100) / 100) * 0.2);
        var cr = 2 + cavIntensity * 4 + (((cavSeed + ci * 7) % 100) / 100) * 2;

        ctx.beginPath();
        ctx.ellipse(cx2, cy2, cr, cr * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(42, 26, 8, ' + (0.5 + cavIntensity * 0.45).toFixed(3) + ')';
        ctx.fill();

        // Dark center
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 8, 2, ' + (0.6 + cavIntensity * 0.35).toFixed(3) + ')';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Draw hover glow outline around a tooth.
   */
  function renderHoverGlow(ctx, tooth) {
    if (tooth.glowAnim <= 0) return;

    var def = TOOTH_TYPES[tooth.type];
    var isUpper = tooth.quadrant.indexOf('upper') === 0;

    ctx.save();
    ctx.translate(tooth.x, tooth.y);
    if (tooth.rotation) ctx.rotate(tooth.rotation);

    // Outer glow
    ctx.shadowColor = 'rgba(0, 212, 255, ' + (tooth.glowAnim * 0.7).toFixed(3) + ')';
    ctx.shadowBlur = 12 + tooth.glowAnim * 6;
    ctx.strokeStyle = 'rgba(0, 212, 255, ' + (tooth.glowAnim * 0.8).toFixed(3) + ')';
    ctx.lineWidth = 2;

    def.buildPath(ctx, tooth.width, tooth.height, isUpper);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw selection indicator.
   */
  function renderSelection(ctx, tooth) {
    if (!tooth.isSelected) return;

    var def = TOOTH_TYPES[tooth.type];
    var isUpper = tooth.quadrant.indexOf('upper') === 0;

    ctx.save();
    ctx.translate(tooth.x, tooth.y);
    if (tooth.rotation) ctx.rotate(tooth.rotation);

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);

    def.buildPath(ctx, tooth.width + 4, tooth.height + 4, isUpper);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }


  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════
  return {
    /** Array of all 32 tooth objects */
    teeth: teeth,

    /**
     * Initialize the 32-tooth array with default positions.
     */
    init: function () {
      teeth = [];

      // Build upper arch
      for (var u = 0; u < UPPER_ARCH_ORDER.length; u++) {
        var uSpec = UPPER_ARCH_ORDER[u];
        teeth.push(createTooth(uSpec.quadrant, uSpec.type));
      }

      // Build lower arch
      for (var l = 0; l < LOWER_ARCH_ORDER.length; l++) {
        var lSpec = LOWER_ARCH_ORDER[l];
        teeth.push(createTooth(lSpec.quadrant, lSpec.type));
      }

      this.teeth = teeth;
      applyDefaultLayout();
    },

    /**
     * Configure teeth problems for a given level.
     * @param {Object} level — must have `teethProblems` array:
     *   [{ toothId, plaque, tartar, cavity }]
     */
    setupForLevel: function (level) {
      // Reset all problems
      for (var i = 0; i < teeth.length; i++) {
        teeth[i].problems.plaque = 0;
        teeth[i].problems.tartar = 0;
        teeth[i].problems.cavity = 0;
        teeth[i].health = 100;
      }

      if (!level || !level.teethProblems) return;

      for (var p = 0; p < level.teethProblems.length; p++) {
        var prob = level.teethProblems[p];
        var tooth = this.getToothById(prob.toothId);
        if (tooth) {
          if (prob.plaque !== undefined) tooth.problems.plaque = prob.plaque;
          if (prob.tartar !== undefined) tooth.problems.tartar = prob.tartar;
          if (prob.cavity !== undefined) tooth.problems.cavity = prob.cavity;
        }
      }
    },

    /**
     * Hit-test: find the tooth at canvas coordinates (x, y).
     * Uses bounding-box check with the tooth's dimensions.
     * @param {number} x — canvas X
     * @param {number} y — canvas Y
     * @returns {Object|null} tooth object or null
     */
    getToothAt: function (x, y) {
      // Iterate in reverse so top-rendered teeth are checked first
      for (var i = teeth.length - 1; i >= 0; i--) {
        var t = teeth[i];
        var hw = t.width * 0.55;  // slightly generous hitbox
        var hh = t.height * 0.55;
        if (x >= t.x - hw && x <= t.x + hw &&
            y >= t.y - hh && y <= t.y + hh) {
          return t;
        }
      }
      return null;
    },

    /**
     * Get a tooth by its unique ID string.
     * @param {string} id
     * @returns {Object|null}
     */
    getToothById: function (id) {
      for (var i = 0; i < teeth.length; i++) {
        if (teeth[i].id === id) return teeth[i];
      }
      return null;
    },

    /**
     * Update hover glow animations.
     * @param {number} dt — delta time in seconds
     */
    update: function (dt) {
      for (var i = 0; i < teeth.length; i++) {
        var t = teeth[i];
        if (t.isHovered) {
          t.glowAnim = Math.min(1, t.glowAnim + dt * 4);
        } else {
          t.glowAnim = Math.max(0, t.glowAnim - dt * 3);
        }
      }
    },

    /**
     * Render all 32 teeth onto the provided canvas context.
     * Draw order: base → surface details → problems → hover → selection.
     * @param {CanvasRenderingContext2D} ctx
     */
    render: function (ctx) {
      for (var i = 0; i < teeth.length; i++) {
        var t = teeth[i];
        renderToothBase(ctx, t);
        renderSurfaceDetails(ctx, t);
        renderProblems(ctx, t);
        renderHoverGlow(ctx, t);
        renderSelection(ctx, t);
      }
    },

    /**
     * Calculate overall cleaning progress (0–100).
     * Represents what percentage of all initial problems have been cleaned.
     * @returns {number}
     */
    getCleaningProgress: function () {
      var totalMaxProblems = 0;
      var totalRemaining = 0;

      for (var i = 0; i < teeth.length; i++) {
        var probs = teeth[i].problems;
        var remaining = probs.plaque + probs.tartar + probs.cavity;
        totalRemaining += remaining;
        // Max possible per tooth is 300 (100 each), but we only count actual
        totalMaxProblems += 300;
      }

      if (totalMaxProblems === 0) return 100;

      // Progress = how much has been cleaned
      var cleaned = totalMaxProblems - totalRemaining;
      return Math.round((cleaned / totalMaxProblems) * 100);
    },

    /**
     * Get teeth that still have significant problems (any problem > 10).
     * @returns {Array} array of tooth objects
     */
    getProblematicTeeth: function () {
      var result = [];
      for (var i = 0; i < teeth.length; i++) {
        var probs = teeth[i].problems;
        if (probs.plaque > 10 || probs.tartar > 10 || probs.cavity > 10) {
          result.push(teeth[i]);
        }
      }
      return result;
    }
  };
})();
