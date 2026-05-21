/**
 * ============================================================
 *  DiagnosisSystem — Dental Adventure
 * ============================================================
 *  Renders an interactive dental chart for the diagnosis phase.
 *  Players select teeth they believe have problems; scoring
 *  compares their choices with the correct answer.
 * ============================================================
 */
window.DiagnosisSystem = (function () {

  /* --------------------------------------------------------
   *  Full dental chart — 32 teeth (16 upper, 16 lower)
   *  Arranged by quadrant:
   *    Upper-Right (patient's right = viewer's left)
   *    Upper-Left  (patient's left  = viewer's right)
   *    Lower-Left  (patient's left  = viewer's right)
   *    Lower-Right (patient's right = viewer's left)
   *
   *  IDs follow: <arch>-<side>-<type>[-number]
   * ------------------------------------------------------ */
  const DENTAL_CHART = [
    // ── Upper arch (from patient's right to left) ──
    // Upper Right quadrant (viewer's left side)
    { id: 'upper-right-molar-3',           label: 'Molar 3 Sup.Der.',     quadrant: 'upper-right', type: 'molar',    archRow: 'upper', index: 0 },
    { id: 'upper-right-molar-2',           label: 'Molar 2 Sup.Der.',     quadrant: 'upper-right', type: 'molar',    archRow: 'upper', index: 1 },
    { id: 'upper-right-molar-1',           label: 'Molar 1 Sup.Der.',     quadrant: 'upper-right', type: 'molar',    archRow: 'upper', index: 2 },
    { id: 'upper-right-premolar-2',        label: 'Premolar 2 Sup.Der.',  quadrant: 'upper-right', type: 'premolar', archRow: 'upper', index: 3 },
    { id: 'upper-right-premolar-1',        label: 'Premolar 1 Sup.Der.',  quadrant: 'upper-right', type: 'premolar', archRow: 'upper', index: 4 },
    { id: 'upper-right-canine',            label: 'Canino Sup.Der.',      quadrant: 'upper-right', type: 'canine',   archRow: 'upper', index: 5 },
    { id: 'upper-right-lateral-incisor',   label: 'Lat.Incisivo Sup.Der.',quadrant: 'upper-right', type: 'incisor',  archRow: 'upper', index: 6 },
    { id: 'upper-right-central-incisor',   label: 'Cent.Incisivo Sup.Der.',quadrant: 'upper-right',type: 'incisor',  archRow: 'upper', index: 7 },
    // Upper Left quadrant (viewer's right side)
    { id: 'upper-left-central-incisor',    label: 'Cent.Incisivo Sup.Izq.',quadrant: 'upper-left', type: 'incisor',  archRow: 'upper', index: 8 },
    { id: 'upper-left-lateral-incisor',    label: 'Lat.Incisivo Sup.Izq.',quadrant: 'upper-left',  type: 'incisor',  archRow: 'upper', index: 9 },
    { id: 'upper-left-canine',             label: 'Canino Sup.Izq.',      quadrant: 'upper-left',  type: 'canine',   archRow: 'upper', index: 10 },
    { id: 'upper-left-premolar-1',         label: 'Premolar 1 Sup.Izq.',  quadrant: 'upper-left',  type: 'premolar', archRow: 'upper', index: 11 },
    { id: 'upper-left-premolar-2',         label: 'Premolar 2 Sup.Izq.',  quadrant: 'upper-left',  type: 'premolar', archRow: 'upper', index: 12 },
    { id: 'upper-left-molar-1',            label: 'Molar 1 Sup.Izq.',     quadrant: 'upper-left',  type: 'molar',    archRow: 'upper', index: 13 },
    { id: 'upper-left-molar-2',            label: 'Molar 2 Sup.Izq.',     quadrant: 'upper-left',  type: 'molar',    archRow: 'upper', index: 14 },
    { id: 'upper-left-molar-3',            label: 'Molar 3 Sup.Izq.',     quadrant: 'upper-left',  type: 'molar',    archRow: 'upper', index: 15 },

    // ── Lower arch (from patient's left to right — mirror of upper) ──
    // Lower Left quadrant (viewer's right side)
    { id: 'lower-left-molar-3',            label: 'Molar 3 Inf.Izq.',     quadrant: 'lower-left',  type: 'molar',    archRow: 'lower', index: 0 },
    { id: 'lower-left-molar-2',            label: 'Molar 2 Inf.Izq.',     quadrant: 'lower-left',  type: 'molar',    archRow: 'lower', index: 1 },
    { id: 'lower-left-molar-1',            label: 'Molar 1 Inf.Izq.',     quadrant: 'lower-left',  type: 'molar',    archRow: 'lower', index: 2 },
    { id: 'lower-left-premolar-2',         label: 'Premolar 2 Inf.Izq.',  quadrant: 'lower-left',  type: 'premolar', archRow: 'lower', index: 3 },
    { id: 'lower-left-premolar-1',         label: 'Premolar 1 Inf.Izq.',  quadrant: 'lower-left',  type: 'premolar', archRow: 'lower', index: 4 },
    { id: 'lower-left-canine',             label: 'Canino Inf.Izq.',      quadrant: 'lower-left',  type: 'canine',   archRow: 'lower', index: 5 },
    { id: 'lower-left-lateral-incisor',    label: 'Lat.Incisivo Inf.Izq.',quadrant: 'lower-left',  type: 'incisor',  archRow: 'lower', index: 6 },
    { id: 'lower-left-central-incisor',    label: 'Cent.Incisivo Inf.Izq.',quadrant: 'lower-left', type: 'incisor',  archRow: 'lower', index: 7 },
    // Lower Right quadrant (viewer's left side)
    { id: 'lower-right-central-incisor',   label: 'Cent.Incisivo Inf.Der.',quadrant: 'lower-right',type: 'incisor',  archRow: 'lower', index: 8 },
    { id: 'lower-right-lateral-incisor',   label: 'Lat.Incisivo Inf.Der.',quadrant: 'lower-right', type: 'incisor',  archRow: 'lower', index: 9 },
    { id: 'lower-right-canine',            label: 'Canino Inf.Der.',      quadrant: 'lower-right', type: 'canine',   archRow: 'lower', index: 10 },
    { id: 'lower-right-premolar-1',        label: 'Premolar 1 Inf.Der.',  quadrant: 'lower-right', type: 'premolar', archRow: 'lower', index: 11 },
    { id: 'lower-right-premolar-2',        label: 'Premolar 2 Inf.Der.',  quadrant: 'lower-right', type: 'premolar', archRow: 'lower', index: 12 },
    { id: 'lower-right-molar-1',           label: 'Molar 1 Inf.Der.',     quadrant: 'lower-right', type: 'molar',    archRow: 'lower', index: 13 },
    { id: 'lower-right-molar-2',           label: 'Molar 2 Inf.Der.',     quadrant: 'lower-right', type: 'molar',    archRow: 'lower', index: 14 },
    { id: 'lower-right-molar-3',           label: 'Molar 3 Inf.Der.',     quadrant: 'lower-right', type: 'molar',    archRow: 'lower', index: 15 },
  ];

  /* --------------------------------------------------------
   *  State
   * ------------------------------------------------------ */
  let selectedTeeth = new Set();
  let teeth       = null;   // reference to TeethSystem.teeth
  let level       = null;   // current level data
  let diagCanvas  = null;
  let diagCtx     = null;
  let hoveredToothId = null;

  /** Cached hit-test rectangles: { id, x, y, w, h } */
  let toothRects = [];

  /* --------------------------------------------------------
   *  Layout constants
   * ------------------------------------------------------ */
  const TOOTH_SIZES = {
    molar:    { w: 28, h: 30 },
    premolar: { w: 22, h: 26 },
    canine:   { w: 18, h: 28 },
    incisor:  { w: 16, h: 24 },
  };

  const ARCH_GAP     = 60;  // vertical gap between upper and lower arches
  const TOOTH_PAD    = 4;   // horizontal padding between teeth
  const LABEL_OFFSET = 18;  // space for quadrant labels

  /* --------------------------------------------------------
   *  Compute positions for all 32 teeth
   * ------------------------------------------------------ */
  function computeLayout(canvasW, canvasH) {
    toothRects = [];

    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    // Separate teeth by arch
    const upperTeeth = DENTAL_CHART.filter(t => t.archRow === 'upper');
    const lowerTeeth = DENTAL_CHART.filter(t => t.archRow === 'lower');

    // Layout helper: arrange teeth in a row centered horizontally
    function layoutRow(teethList, baseY, archCurve) {
      // Calculate total width
      let totalW = 0;
      teethList.forEach(t => {
        totalW += TOOTH_SIZES[t.type].w + TOOTH_PAD;
      });
      totalW -= TOOTH_PAD;

      let curX = centerX - totalW / 2;
      teethList.forEach((t, i) => {
        const size = TOOTH_SIZES[t.type];
        // Slight arch curve — teeth near center are higher/lower
        const normalizedPos = (i - teethList.length / 2) / (teethList.length / 2);
        const curveOffset = archCurve * normalizedPos * normalizedPos;
        const y = baseY + curveOffset;

        toothRects.push({
          id: t.id,
          x: curX,
          y: y,
          w: size.w,
          h: size.h,
          type: t.type,
          label: t.label,
          quadrant: t.quadrant
        });
        curX += size.w + TOOTH_PAD;
      });
    }

    // Upper arch curves downward at edges
    layoutRow(upperTeeth, centerY - ARCH_GAP / 2 - 30, 20);
    // Lower arch curves upward at edges (negative curve)
    layoutRow(lowerTeeth, centerY + ARCH_GAP / 2 + 5, -20);
  }

  /* --------------------------------------------------------
   *  Drawing helpers
   * ------------------------------------------------------ */

  /** Get problem severity for a tooth (from TeethSystem or level data) */
  function getToothProblemSeverity(toothId) {
    // Try TeethSystem first (runtime state)
    if (teeth) {
      const t = teeth.find(t => t.id === toothId);
      if (t) {
        return (t.plaque || 0) + (t.tartar || 0) + (t.cavity || 0);
      }
    }
    // Fallback: check level data
    if (level && level.teethProblems) {
      const prob = level.teethProblems.find(p => p.toothId === toothId);
      if (prob) return prob.plaque + prob.tartar + prob.cavity;
    }
    return 0;
  }

  /** Draw a single tooth shape */
  function drawTooth(ctx, rect, isSelected, isHovered) {
    const { x, y, w, h, type, id } = rect;

    const severity = getToothProblemSeverity(id);
    const hasProblem = severity > 0;

    // Base tooth color — slight discoloration if problems remain
    let baseColor;
    if (hasProblem) {
      const t = Math.min(severity / 150, 1);
      const r = Math.floor(255 - t * 30);
      const g = Math.floor(250 - t * 50);
      const b = Math.floor(240 - t * 60);
      baseColor = `rgb(${r},${g},${b})`;
    } else {
      baseColor = '#f5f0e8'; // healthy cream
    }

    ctx.save();

    // Selected glow
    if (isSelected) {
      ctx.shadowColor = '#00ddff';
      ctx.shadowBlur = 14;
    }

    // Tooth shape based on type
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = isSelected ? '#00ddff' : (isHovered ? '#88ccff' : '#aaa');
    ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1);

    ctx.beginPath();
    if (type === 'molar') {
      // Wider, more square shape with bumpy top
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + w - 4, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + 4);
      ctx.lineTo(x + w, y + h - 6);
      ctx.quadraticCurveTo(x + w, y + h, x + w - 6, y + h);
      ctx.lineTo(x + 6, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - 6);
      ctx.lineTo(x, y + 4);
      ctx.quadraticCurveTo(x, y, x + 4, y);
    } else if (type === 'premolar') {
      // Slightly narrower molar
      ctx.roundRect(x, y, w, h, 5);
    } else if (type === 'canine') {
      // Pointed/tapered shape
      ctx.moveTo(x + w / 2, y);
      ctx.quadraticCurveTo(x + w + 2, y + h * 0.3, x + w - 2, y + h * 0.7);
      ctx.quadraticCurveTo(x + w / 2, y + h + 2, x + 2, y + h * 0.7);
      ctx.quadraticCurveTo(x - 2, y + h * 0.3, x + w / 2, y);
    } else {
      // Incisor: narrow rectangle with rounded top
      ctx.roundRect(x, y, w, h, [6, 6, 3, 3]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner shine highlight
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.4, y + h * 0.3, w * 0.25, h * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Problem indicators (small colored dots)
    if (hasProblem && level) {
      const prob = level.teethProblems.find(p => p.toothId === id);
      if (prob) {
        let dotX = x + w - 6;
        let dotY = y + 4;
        if (prob.plaque > 0) {
          ctx.fillStyle = '#ffcc44';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
          dotY += 8;
        }
        if (prob.tartar > 0) {
          ctx.fillStyle = '#cc8844';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
          dotY += 8;
        }
        if (prob.cavity > 0) {
          ctx.fillStyle = '#444444';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Selected checkmark
    if (isSelected) {
      ctx.fillStyle = '#00ddff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', x + w / 2, y - 4);
    }

    ctx.restore();
  }

  /** Draw quadrant labels */
  function drawQuadrantLabels(ctx, canvasW, canvasH) {
    ctx.save();
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(150,180,220,0.7)';
    ctx.textAlign = 'center';

    const cx = canvasW / 2;
    const cy = canvasH / 2;

    ctx.fillText('Superior Derecho', cx - canvasW * 0.25, cy - ARCH_GAP / 2 - 54);
    ctx.fillText('Superior Izquierdo', cx + canvasW * 0.25, cy - ARCH_GAP / 2 - 54);
    ctx.fillText('Inferior Izquierdo', cx + canvasW * 0.25, cy + ARCH_GAP / 2 + 60);
    ctx.fillText('Inferior Derecho', cx - canvasW * 0.25, cy + ARCH_GAP / 2 + 60);

    // Divider lines
    ctx.strokeStyle = 'rgba(100,140,200,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(cx, cy - ARCH_GAP / 2 - 50);
    ctx.lineTo(cx, cy + ARCH_GAP / 2 + 50);
    ctx.stroke();

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(cx - canvasW * 0.42, cy);
    ctx.lineTo(cx + canvasW * 0.42, cy);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  /** Draw mouth outline */
  function drawMouthOutline(ctx, canvasW, canvasH) {
    ctx.save();
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const rx = canvasW * 0.42;
    const ry = canvasH * 0.40;

    ctx.strokeStyle = 'rgba(255,150,150,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner gum line hint
    ctx.strokeStyle = 'rgba(255,120,120,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.85, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /** Hit-test: find which tooth rect contains (mx, my) */
  function hitTest(mx, my) {
    for (const rect of toothRects) {
      if (
        mx >= rect.x && mx <= rect.x + rect.w &&
        my >= rect.y && my <= rect.y + rect.h
      ) {
        return rect;
      }
    }
    return null;
  }

  /* --------------------------------------------------------
   *  Public API
   * ------------------------------------------------------ */
  return {
    /** Expose chart definition */
    get DENTAL_CHART() { return DENTAL_CHART; },

    /** Currently selected teeth */
    get selectedTeeth() { return selectedTeeth; },

    /** Currently hovered tooth */
    get hoveredToothId() { return hoveredToothId; },

    /* -------------------------------------------------------
     *  init — get canvas reference
     * ----------------------------------------------------- */
    init() {
      diagCanvas = document.getElementById('diagnosis-canvas');
      if (diagCanvas) {
        diagCtx = diagCanvas.getContext('2d');
      }
    },

    /* -------------------------------------------------------
     *  start — begin diagnosis phase
     * ----------------------------------------------------- */
    start(teethData, levelData) {
      teeth = teethData;
      level = levelData;
      selectedTeeth = new Set();
      hoveredToothId = null;

      if (!diagCanvas) this.init();
      if (!diagCanvas) return;

      // Compute layout based on canvas size
      computeLayout(diagCanvas.width, diagCanvas.height);

      // Bind event listeners
      this._bindEvents();

      // Initial render
      this.render();
      this.updateSelectionList();
    },

    /* -------------------------------------------------------
     *  render — draw the full diagnosis chart
     * ----------------------------------------------------- */
    render() {
      if (!diagCtx || !diagCanvas) return;

      const ctx = diagCtx;
      const cw = diagCanvas.width;
      const ch = diagCanvas.height;

      // Clear
      ctx.clearRect(0, 0, cw, ch);

      // Background
      ctx.fillStyle = '#0d1520';
      ctx.fillRect(0, 0, cw, ch);

      // Mouth outline
      drawMouthOutline(ctx, cw, ch);

      // Quadrant labels
      drawQuadrantLabels(ctx, cw, ch);

      // Draw each tooth
      toothRects.forEach(rect => {
        const isSelected = selectedTeeth.has(rect.id);
        const isHovered = hoveredToothId === rect.id;
        drawTooth(ctx, rect, isSelected, isHovered);
      });

      // Hover label tooltip
      if (hoveredToothId) {
        const rect = toothRects.find(r => r.id === hoveredToothId);
        if (rect) {
          const labelX = rect.x + rect.w / 2;
          const labelY = rect.archRow === 'upper'
            ? rect.y - 16
            : rect.y + rect.h + 20;

          // Background pill
          ctx.font = '11px "Inter", sans-serif';
          const textW = ctx.measureText(rect.label).width;
          ctx.fillStyle = 'rgba(0,20,40,0.85)';
          ctx.beginPath();
          ctx.roundRect(labelX - textW / 2 - 6, labelY - 10, textW + 12, 18, 4);
          ctx.fill();

          ctx.fillStyle = '#aaccff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(rect.label, labelX, labelY);
        }
      }
    },

    /* -------------------------------------------------------
     *  handleClick — toggle tooth selection
     * ----------------------------------------------------- */
    handleClick(e) {
      if (!diagCanvas) return;
      const canvasRect = diagCanvas.getBoundingClientRect();
      const scaleX = diagCanvas.width / canvasRect.width;
      const scaleY = diagCanvas.height / canvasRect.height;
      const mx = (e.clientX - canvasRect.left) * scaleX;
      const my = (e.clientY - canvasRect.top) * scaleY;

      const hit = hitTest(mx, my);
      if (hit) {
        if (selectedTeeth.has(hit.id)) {
          selectedTeeth.delete(hit.id);
        } else {
          selectedTeeth.add(hit.id);
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.play('click');
        this.render();
        this.updateSelectionList();
      }
    },

    /* -------------------------------------------------------
     *  handleMouseMove — update hover state
     * ----------------------------------------------------- */
    handleMouseMove(e) {
      if (!diagCanvas) return;
      const canvasRect = diagCanvas.getBoundingClientRect();
      const scaleX = diagCanvas.width / canvasRect.width;
      const scaleY = diagCanvas.height / canvasRect.height;
      const mx = (e.clientX - canvasRect.left) * scaleX;
      const my = (e.clientY - canvasRect.top) * scaleY;

      const hit = hitTest(mx, my);
      const newHoverId = hit ? hit.id : null;

      if (newHoverId !== hoveredToothId) {
        hoveredToothId = newHoverId;
        diagCanvas.style.cursor = newHoverId ? 'pointer' : 'default';
        this.render();
      }
    },

    /* -------------------------------------------------------
     *  getScore — compare selection with answer
     * ----------------------------------------------------- */
    getScore() {
      if (!level || !level.diagnosisAnswer) return 0;

      const answer = new Set(level.diagnosisAnswer);
      const totalProblems = answer.size;
      if (totalProblems === 0) return 100;

      let correctSelections = 0;   // correctly selected teeth with problems
      let wrongSelections = 0;     // selected teeth that are fine
      let missedProblems = 0;      // teeth with problems that weren't selected

      // Check what the player selected
      selectedTeeth.forEach(id => {
        if (answer.has(id)) {
          correctSelections++;
        } else {
          wrongSelections++;
        }
      });

      // Check what the player missed
      answer.forEach(id => {
        if (!selectedTeeth.has(id)) {
          missedProblems++;
        }
      });

      // Score calculation
      const pointsPerCorrect = 100 / totalProblems;
      let score = correctSelections * pointsPerCorrect;
      score -= wrongSelections * (pointsPerCorrect * 0.5);  // penalty for false positives
      score -= missedProblems * (pointsPerCorrect * 0.5);   // penalty for misses

      return Math.max(0, Math.min(100, Math.round(score)));
    },

    /* -------------------------------------------------------
     *  updateSelectionList — update DOM list of selected teeth
     * ----------------------------------------------------- */
    updateSelectionList() {
      const list = document.getElementById('diagnosis-list');
      if (!list) return;

      list.innerHTML = '';

      if (selectedTeeth.size === 0) {
        const li = document.createElement('li');
        li.className = 'diag-empty';
        li.textContent = 'Haz clic en los dientes con problemas';
        list.appendChild(li);
        return;
      }

      selectedTeeth.forEach(id => {
        const toothInfo = DENTAL_CHART.find(t => t.id === id);
        const li = document.createElement('li');
        li.textContent = toothInfo ? toothInfo.label : id;
        // Allow clicking to deselect
        li.onclick = () => {
          selectedTeeth.delete(id);
          if (typeof AudioSystem !== 'undefined') AudioSystem.play('click');
          this.render();
          this.updateSelectionList();
        };
        list.appendChild(li);
      });
    },

    /* -------------------------------------------------------
     *  reset — clear all selections
     * ----------------------------------------------------- */
    reset() {
      selectedTeeth = new Set();
      hoveredToothId = null;
      if (diagCanvas) {
        this.render();
        this.updateSelectionList();
      }
    },

    /* -------------------------------------------------------
     *  _bindEvents (private) — attach canvas event listeners
     * ----------------------------------------------------- */
    _bindEvents() {
      if (!diagCanvas) return;

      // Remove old listeners by replacing canvas event handlers
      // (simplistic approach — in production we'd use AbortController)
      diagCanvas.onclick = (e) => this.handleClick(e);
      diagCanvas.onmousemove = (e) => this.handleMouseMove(e);
    }
  };
})();
