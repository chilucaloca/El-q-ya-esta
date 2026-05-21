/**
 * mouth.js — Dental Adventure: Mouth Renderer
 *
 * Renders the mouth background behind the teeth:
 * consultorio backdrop, mouth opening, lips, gums, tongue, uvula,
 * and moisture highlights. Also provides teeth layout (arch positions).
 *
 * Usage:
 *   window.MouthRenderer.init(canvas);
 *   window.MouthRenderer.render(ctx, width, height);
 *   var layout = window.MouthRenderer.getTeethLayout(width, height);
 */
window.MouthRenderer = (function () {
  'use strict';

  var canvas = null;

  // ─── Internal rendering helpers ───────────────────────────────────

  /**
   * Draw the dark consultorio (dental office) background.
   * Clean medical-themed gradient with subtle atmosphere.
   */
  function renderBackground(ctx, w, h) {
    // Dark blue-gray gradient background
    var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0d1520');
    bgGrad.addColorStop(0.5, '#111d2a');
    bgGrad.addColorStop(1, '#0a1018');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial light from above (overhead dental lamp feel)
    var lampGrad = ctx.createRadialGradient(w * 0.5, h * 0.05, 10, w * 0.5, h * 0.3, h * 0.6);
    lampGrad.addColorStop(0, 'rgba(180, 210, 240, 0.08)');
    lampGrad.addColorStop(0.4, 'rgba(120, 160, 200, 0.03)');
    lampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lampGrad;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Draw the mouth opening (dark oval throat).
   */
  function renderMouthOpening(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    // Outer throat darkness with soft edge
    var throatGrad = ctx.createRadialGradient(cx, cy, mouthW * 0.1, cx, cy, mouthW * 0.58);
    throatGrad.addColorStop(0, '#0a0202');
    throatGrad.addColorStop(0.6, '#1a0505');
    throatGrad.addColorStop(0.85, '#200808');
    throatGrad.addColorStop(1, '#0a0202');

    ctx.beginPath();
    ctx.ellipse(cx, cy, mouthW * 0.52, mouthH * 0.52, 0, 0, Math.PI * 2);
    ctx.fillStyle = throatGrad;
    ctx.fill();

    // Ambient occlusion — darker ring at edges
    ctx.beginPath();
    ctx.ellipse(cx, cy, mouthW * 0.54, mouthH * 0.54, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(5, 0, 0, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw the lips — outer ring around the mouth opening.
   */
  function renderLips(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var outerRx = mouthW * 0.58;
    var outerRy = mouthH * 0.58;
    var innerRx = mouthW * 0.48;
    var innerRy = mouthH * 0.48;

    // — Upper lip —
    ctx.beginPath();
    // Outer edge of upper lip
    ctx.ellipse(cx, cy - mouthH * 0.02, outerRx, outerRy, 0, Math.PI + 0.15, -0.15);
    // Cupid's bow dip
    ctx.quadraticCurveTo(cx + innerRx * 0.3, cy - innerRy * 0.06, cx + innerRx * 0.15, cy - innerRy * 0.02);
    ctx.quadraticCurveTo(cx, cy - innerRy * 0.08, cx - innerRx * 0.15, cy - innerRy * 0.02);
    ctx.quadraticCurveTo(cx - innerRx * 0.3, cy - innerRy * 0.06, cx - outerRx * 0.97, cy + outerRy * 0.05);
    ctx.closePath();

    var upperLipGrad = ctx.createLinearGradient(cx, cy - outerRy, cx, cy);
    upperLipGrad.addColorStop(0, '#a84550');
    upperLipGrad.addColorStop(0.3, '#c4616b');
    upperLipGrad.addColorStop(0.7, '#b55560');
    upperLipGrad.addColorStop(1, '#8a3a42');
    ctx.fillStyle = upperLipGrad;
    ctx.fill();

    // Upper lip highlight (shine)
    ctx.beginPath();
    ctx.ellipse(cx - mouthW * 0.08, cy - outerRy * 0.65, outerRx * 0.25, outerRy * 0.08, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 200, 0.18)';
    ctx.fill();

    // — Lower lip —
    ctx.beginPath();
    ctx.ellipse(cx, cy + mouthH * 0.02, outerRx * 0.95, outerRy * 0.95, 0, 0.12, Math.PI - 0.12);
    ctx.quadraticCurveTo(cx - innerRx * 0.5, cy + innerRy * 0.1, cx - innerRx * 0.95, cy + innerRy * 0.02);
    ctx.closePath();

    var lowerLipGrad = ctx.createLinearGradient(cx, cy, cx, cy + outerRy);
    lowerLipGrad.addColorStop(0, '#8a3a42');
    lowerLipGrad.addColorStop(0.4, '#c06068');
    lowerLipGrad.addColorStop(0.7, '#c96e75');
    lowerLipGrad.addColorStop(1, '#a04a52');
    ctx.fillStyle = lowerLipGrad;
    ctx.fill();

    // Lower lip highlight
    ctx.beginPath();
    ctx.ellipse(cx + mouthW * 0.04, cy + outerRy * 0.55, outerRx * 0.3, outerRy * 0.06, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 210, 210, 0.15)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw the upper gums — pink curved band above upper teeth.
   */
  function renderUpperGums(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var gumTop = cy - mouthH * 0.42;
    var gumBottom = cy - mouthH * 0.18;
    var gumWidth = mouthW * 0.46;

    ctx.beginPath();
    // Top edge following lip curve
    ctx.moveTo(cx - gumWidth, gumTop + 15);
    ctx.bezierCurveTo(
      cx - gumWidth * 0.7, gumTop - 5,
      cx - gumWidth * 0.3, gumTop - 10,
      cx, gumTop - 8
    );
    ctx.bezierCurveTo(
      cx + gumWidth * 0.3, gumTop - 10,
      cx + gumWidth * 0.7, gumTop - 5,
      cx + gumWidth, gumTop + 15
    );
    // Bottom scalloped edge (tooth sockets)
    ctx.bezierCurveTo(
      cx + gumWidth * 0.85, gumBottom - 5,
      cx + gumWidth * 0.5, gumBottom + 5,
      cx + gumWidth * 0.25, gumBottom
    );
    ctx.bezierCurveTo(
      cx + gumWidth * 0.1, gumBottom + 3,
      cx - gumWidth * 0.1, gumBottom + 3,
      cx - gumWidth * 0.25, gumBottom
    );
    ctx.bezierCurveTo(
      cx - gumWidth * 0.5, gumBottom + 5,
      cx - gumWidth * 0.85, gumBottom - 5,
      cx - gumWidth, gumTop + 15
    );
    ctx.closePath();

    var gumGrad = ctx.createLinearGradient(cx, gumTop - 10, cx, gumBottom + 10);
    gumGrad.addColorStop(0, '#c74b5a');
    gumGrad.addColorStop(0.3, '#d86878');
    gumGrad.addColorStop(0.6, '#e88a90');
    gumGrad.addColorStop(1, '#d07080');
    ctx.fillStyle = gumGrad;
    ctx.fill();

    // 3D depth highlight
    ctx.beginPath();
    ctx.moveTo(cx - gumWidth * 0.6, gumTop + 8);
    ctx.quadraticCurveTo(cx, gumTop - 2, cx + gumWidth * 0.6, gumTop + 8);
    ctx.strokeStyle = 'rgba(255, 180, 185, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw the lower gums — pink curved band below lower teeth.
   */
  function renderLowerGums(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var gumTop = cy + mouthH * 0.18;
    var gumBottom = cy + mouthH * 0.42;
    var gumWidth = mouthW * 0.46;

    ctx.beginPath();
    // Top scalloped edge (tooth sockets)
    ctx.moveTo(cx - gumWidth, gumBottom - 15);
    ctx.bezierCurveTo(
      cx - gumWidth * 0.85, gumTop + 5,
      cx - gumWidth * 0.5, gumTop - 5,
      cx - gumWidth * 0.25, gumTop
    );
    ctx.bezierCurveTo(
      cx - gumWidth * 0.1, gumTop - 3,
      cx + gumWidth * 0.1, gumTop - 3,
      cx + gumWidth * 0.25, gumTop
    );
    ctx.bezierCurveTo(
      cx + gumWidth * 0.5, gumTop - 5,
      cx + gumWidth * 0.85, gumTop + 5,
      cx + gumWidth, gumBottom - 15
    );
    // Bottom edge following lip curve
    ctx.bezierCurveTo(
      cx + gumWidth * 0.7, gumBottom + 5,
      cx + gumWidth * 0.3, gumBottom + 10,
      cx, gumBottom + 8
    );
    ctx.bezierCurveTo(
      cx - gumWidth * 0.3, gumBottom + 10,
      cx - gumWidth * 0.7, gumBottom + 5,
      cx - gumWidth, gumBottom - 15
    );
    ctx.closePath();

    var gumGrad = ctx.createLinearGradient(cx, gumTop - 10, cx, gumBottom + 10);
    gumGrad.addColorStop(0, '#d07080');
    gumGrad.addColorStop(0.4, '#e88a90');
    gumGrad.addColorStop(0.7, '#d86878');
    gumGrad.addColorStop(1, '#c74b5a');
    ctx.fillStyle = gumGrad;
    ctx.fill();

    // 3D depth highlight at bottom
    ctx.beginPath();
    ctx.moveTo(cx - gumWidth * 0.6, gumBottom - 5);
    ctx.quadraticCurveTo(cx, gumBottom + 5, cx + gumWidth * 0.6, gumBottom - 5);
    ctx.strokeStyle = 'rgba(255, 180, 185, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw the tongue — visible between upper and lower teeth arches.
   */
  function renderTongue(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var tongueW = mouthW * 0.32;
    var tongueH = mouthH * 0.18;
    var tongueY = cy + mouthH * 0.04; // slightly below center

    // Main tongue body
    ctx.beginPath();
    ctx.moveTo(cx - tongueW, tongueY + tongueH * 0.1);
    ctx.bezierCurveTo(
      cx - tongueW * 0.8, tongueY - tongueH * 0.7,
      cx - tongueW * 0.3, tongueY - tongueH * 0.95,
      cx, tongueY - tongueH * 0.9
    );
    ctx.bezierCurveTo(
      cx + tongueW * 0.3, tongueY - tongueH * 0.95,
      cx + tongueW * 0.8, tongueY - tongueH * 0.7,
      cx + tongueW, tongueY + tongueH * 0.1
    );
    // Bottom curve
    ctx.bezierCurveTo(
      cx + tongueW * 0.7, tongueY + tongueH * 0.8,
      cx + tongueW * 0.3, tongueY + tongueH,
      cx, tongueY + tongueH * 0.95
    );
    ctx.bezierCurveTo(
      cx - tongueW * 0.3, tongueY + tongueH,
      cx - tongueW * 0.7, tongueY + tongueH * 0.8,
      cx - tongueW, tongueY + tongueH * 0.1
    );
    ctx.closePath();

    // Tongue gradient — 3D rounded surface
    var tongueGrad = ctx.createRadialGradient(
      cx - tongueW * 0.15, tongueY - tongueH * 0.2, 2,
      cx, tongueY, Math.max(tongueW, tongueH) * 1.1
    );
    tongueGrad.addColorStop(0, '#e08a92');
    tongueGrad.addColorStop(0.35, '#d47a82');
    tongueGrad.addColorStop(0.7, '#c56a72');
    tongueGrad.addColorStop(1, '#b85a62');
    ctx.fillStyle = tongueGrad;
    ctx.fill();

    // Central groove / median sulcus
    ctx.beginPath();
    ctx.moveTo(cx, tongueY - tongueH * 0.75);
    ctx.bezierCurveTo(
      cx - 1, tongueY - tongueH * 0.3,
      cx + 1, tongueY + tongueH * 0.2,
      cx, tongueY + tongueH * 0.7
    );
    ctx.strokeStyle = 'rgba(150, 60, 70, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle papillae texture (small bumps)
    ctx.fillStyle = 'rgba(220, 140, 145, 0.2)';
    for (var row = 0; row < 3; row++) {
      for (var col = -2; col <= 2; col++) {
        var bx = cx + col * tongueW * 0.18;
        var by = tongueY - tongueH * 0.3 + row * tongueH * 0.3;
        ctx.beginPath();
        ctx.arc(bx + (row % 2) * tongueW * 0.09, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Moisture highlight
    ctx.beginPath();
    ctx.ellipse(cx - tongueW * 0.2, tongueY - tongueH * 0.4, tongueW * 0.3, tongueH * 0.15, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 225, 0.12)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw a uvula hint at the back of the throat (top center).
   */
  function renderUvula(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var uvulaX = cx;
    var uvulaY = cy - mouthH * 0.32;
    var uvulaW = 8;
    var uvulaH = 18;

    ctx.beginPath();
    ctx.moveTo(uvulaX - uvulaW * 0.3, uvulaY - uvulaH * 0.3);
    ctx.bezierCurveTo(
      uvulaX - uvulaW * 0.6, uvulaY,
      uvulaX - uvulaW * 0.5, uvulaY + uvulaH * 0.7,
      uvulaX, uvulaY + uvulaH
    );
    ctx.bezierCurveTo(
      uvulaX + uvulaW * 0.5, uvulaY + uvulaH * 0.7,
      uvulaX + uvulaW * 0.6, uvulaY,
      uvulaX + uvulaW * 0.3, uvulaY - uvulaH * 0.3
    );
    ctx.closePath();

    var uvulaGrad = ctx.createLinearGradient(uvulaX - uvulaW, uvulaY, uvulaX + uvulaW, uvulaY + uvulaH);
    uvulaGrad.addColorStop(0, '#c86070');
    uvulaGrad.addColorStop(0.5, '#d47882');
    uvulaGrad.addColorStop(1, '#b05060');
    ctx.fillStyle = uvulaGrad;
    ctx.fill();

    // Tiny highlight
    ctx.beginPath();
    ctx.ellipse(uvulaX - 1, uvulaY + uvulaH * 0.2, 2, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 210, 0.3)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw subtle saliva/moisture reflective highlights on gums and surfaces.
   */
  function renderMoistureHighlights(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();
    ctx.globalAlpha = 0.08;

    // Upper gum moisture streaks
    var highlights = [
      { x: cx - mouthW * 0.2, y: cy - mouthH * 0.32, rx: 18, ry: 3, rot: -0.1 },
      { x: cx + mouthW * 0.15, y: cy - mouthH * 0.3, rx: 14, ry: 2.5, rot: 0.15 },
      { x: cx - mouthW * 0.08, y: cy + mouthH * 0.3, rx: 16, ry: 3, rot: 0.05 },
      { x: cx + mouthW * 0.22, y: cy + mouthH * 0.32, rx: 12, ry: 2, rot: -0.1 },
      // Inner mouth moisture
      { x: cx - mouthW * 0.12, y: cy - mouthH * 0.08, rx: 20, ry: 2, rot: 0.1 },
      { x: cx + mouthW * 0.1, y: cy + mouthH * 0.12, rx: 15, ry: 2.5, rot: -0.05 }
    ];

    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < highlights.length; i++) {
      var hl = highlights[i];
      ctx.beginPath();
      ctx.ellipse(hl.x, hl.y, hl.rx, hl.ry, hl.rot, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw a vignette effect at the mouth opening edges.
   */
  function renderVignette(ctx, cx, cy, mouthW, mouthH) {
    ctx.save();

    var vignetteGrad = ctx.createRadialGradient(cx, cy, mouthW * 0.3, cx, cy, mouthW * 0.6);
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

    ctx.beginPath();
    ctx.ellipse(cx, cy, mouthW * 0.6, mouthH * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = vignetteGrad;
    ctx.fill();

    ctx.restore();
  }


  // ─── Teeth Layout Calculator ──────────────────────────────────────

  /**
   * Tooth ordering for layout (left-to-right as viewer sees it).
   * Matches the order in TeethSystem.
   */
  var ARCH_TYPES_UPPER = [
    'molar-3', 'molar-2', 'molar-1', 'premolar-2', 'premolar-1',
    'canine', 'lateral-incisor', 'central-incisor',
    'central-incisor', 'lateral-incisor', 'canine',
    'premolar-1', 'premolar-2', 'molar-1', 'molar-2', 'molar-3'
  ];

  var ARCH_QUADRANTS_UPPER = [
    'upper-right', 'upper-right', 'upper-right', 'upper-right', 'upper-right',
    'upper-right', 'upper-right', 'upper-right',
    'upper-left', 'upper-left', 'upper-left',
    'upper-left', 'upper-left', 'upper-left', 'upper-left', 'upper-left'
  ];

  var ARCH_QUADRANTS_LOWER = [
    'lower-right', 'lower-right', 'lower-right', 'lower-right', 'lower-right',
    'lower-right', 'lower-right', 'lower-right',
    'lower-left', 'lower-left', 'lower-left',
    'lower-left', 'lower-left', 'lower-left', 'lower-left', 'lower-left'
  ];

  /** Base widths per tooth type (for layout spacing) */
  var TYPE_WIDTHS = {
    'molar-3': 34, 'molar-2': 38, 'molar-1': 42,
    'premolar-2': 33, 'premolar-1': 35,
    'canine': 33, 'lateral-incisor': 30, 'central-incisor': 36
  };

  /** Base heights per tooth type */
  var TYPE_HEIGHTS = {
    'molar-3': 46, 'molar-2': 50, 'molar-1': 53,
    'premolar-2': 50, 'premolar-1': 53,
    'canine': 62, 'lateral-incisor': 52, 'central-incisor': 55
  };


  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════
  return {
    /**
     * Store a reference to the game canvas.
     * @param {HTMLCanvasElement} canvasEl
     */
    init: function (canvasEl) {
      canvas = canvasEl;
    },

    /**
     * Reset any internal renderer state.
     */
    reset: function () {
      // Currently stateless per-frame; placeholder for future animations
    },

    /**
     * Render the full mouth background (call BEFORE rendering teeth).
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w — canvas width
     * @param {number} h — canvas height
     */
    render: function (ctx, w, h) {
      var cx = w / 2;
      var cy = h / 2;
      // Mouth dimensions — 70-80% of canvas
      var mouthW = w * 0.75;
      var mouthH = h * 0.75;

      renderBackground(ctx, w, h);
      renderMouthOpening(ctx, cx, cy, mouthW, mouthH);
      renderTongue(ctx, cx, cy, mouthW, mouthH);
      renderUvula(ctx, cx, cy, mouthW, mouthH);
      renderUpperGums(ctx, cx, cy, mouthW, mouthH);
      renderLowerGums(ctx, cx, cy, mouthW, mouthH);
      renderLips(ctx, cx, cy, mouthW, mouthH);
      renderMoistureHighlights(ctx, cx, cy, mouthW, mouthH);
      renderVignette(ctx, cx, cy, mouthW, mouthH);
    },

    /**
     * Calculate and return positions for all 32 teeth in a dental arch.
     * Also applies positions directly to TeethSystem.teeth if available.
     *
     * @param {number} w — canvas width
     * @param {number} h — canvas height
     * @returns {Array<Object>} array of { id, x, y, width, height, rotation }
     */
    getTeethLayout: function (w, h) {
      var cx = w / 2;
      var cy = h / 2;
      var layout = [];

      // Scale factor so the arch fits well in the canvas
      var scale = Math.min(w / 800, h / 680);

      // Arch parameters
      var archRadiusX = 260 * scale;  // horizontal spread
      var archRadiusY = 100 * scale;  // vertical depth of curve
      var upperCenterY = cy - 65 * scale; // upper arch center
      var lowerCenterY = cy + 65 * scale; // lower arch center
      var gap = 130 * scale; // vertical space between arches

      // Perspective: back teeth slightly smaller
      function perspectiveScale(t) {
        // t = 0 at center, 1 at edges; reduce size toward edges
        return 1.0 - t * 0.12;
      }

      // Compute cumulative X positions for natural spacing
      function computeArchPositions(types, isUpper, quadrants) {
        var positions = [];
        var n = types.length;
        var halfN = n / 2;

        for (var i = 0; i < n; i++) {
          var type = types[i];
          // Normalized distance from center (0 = center, 1 = edge)
          var fromCenter = Math.abs(i - (halfN - 0.5)) / halfN;

          // Angle along the arch (semi-ellipse)
          // Map teeth index to angle: center teeth near π/2 (bottom of ellipse)
          var angle;
          if (isUpper) {
            // Upper arch: center at bottom of U
            angle = Math.PI * (0.15 + (i / (n - 1)) * 0.7);
          } else {
            // Lower arch: center at top of U, mirrored
            angle = Math.PI * (0.15 + (i / (n - 1)) * 0.7);
          }

          var archX = cx - archRadiusX * Math.cos(angle);
          var archY;
          if (isUpper) {
            archY = upperCenterY - archRadiusY * Math.sin(angle) * 0.5;
          } else {
            archY = lowerCenterY + archRadiusY * Math.sin(angle) * 0.5;
          }

          var pScale = perspectiveScale(fromCenter);
          var tw = TYPE_WIDTHS[type] * scale * pScale;
          var th = TYPE_HEIGHTS[type] * scale * pScale;

          // Rotation: teeth on the sides tilt outward
          var rot = 0;
          var sideSign = (i < halfN) ? -1 : 1;
          rot = sideSign * fromCenter * 0.18;

          var id = quadrants[i] + '-' + type;

          positions.push({
            id: id,
            x: archX,
            y: archY,
            width: tw,
            height: th,
            rotation: rot
          });
        }

        return positions;
      }

      var upperPositions = computeArchPositions(ARCH_TYPES_UPPER, true, ARCH_QUADRANTS_UPPER);
      var lowerPositions = computeArchPositions(ARCH_TYPES_UPPER, false, ARCH_QUADRANTS_LOWER);

      layout = upperPositions.concat(lowerPositions);

      // Apply to TeethSystem if available
      if (window.TeethSystem && window.TeethSystem.teeth) {
        var teethArr = window.TeethSystem.teeth;
        for (var li = 0; li < layout.length && li < teethArr.length; li++) {
          var pos = layout[li];
          teethArr[li].x = pos.x;
          teethArr[li].y = pos.y;
          teethArr[li].width = pos.width;
          teethArr[li].height = pos.height;
          teethArr[li].rotation = pos.rotation;
        }
      }

      return layout;
    }
  };
})();
