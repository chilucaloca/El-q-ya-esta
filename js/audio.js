/**
 * ============================================================
 *  AudioSystem — Dental Adventure
 * ============================================================
 *  Procedural sound synthesis via the Web Audio API.
 *  No external audio files — all sounds are generated from
 *  oscillators and noise buffers.
 * ============================================================
 */
window.AudioSystem = (function () {

  /* --------------------------------------------------------
   *  Sound definitions
   * ------------------------------------------------------ */
  const SOUNDS = {
    'click': {
      type: 'sine', freq: 800, duration: 0.08, volume: 0.3
    },
    'brush': {
      type: 'noise', duration: 0.15, volume: 0.2,
      filter: 'highpass', filterFreq: 2000
    },
    'scrape': {
      type: 'sawtooth', freq: 200, duration: 0.12, volume: 0.15,
      slide: -100
    },
    'drill': {
      type: 'square', freq: 400, duration: 0.1, volume: 0.1,
      vibrato: 20
    },
    'water': {
      type: 'noise', duration: 0.2, volume: 0.15,
      filter: 'bandpass', filterFreq: 1000
    },
    'suction': {
      type: 'noise', duration: 0.15, volume: 0.12,
      filter: 'lowpass', filterFreq: 500
    },
    'coin': {
      type: 'sine', freq: 1200, duration: 0.15, volume: 0.3,
      slide: 400
    },
    'error': {
      type: 'square', freq: 200, duration: 0.3, volume: 0.2
    },
    'levelComplete': {
      type: 'sine', freq: 523, duration: 0.8, volume: 0.3,
      arpeggio: [523, 659, 784, 1047]
    },
  };

  /* --------------------------------------------------------
   *  State
   * ------------------------------------------------------ */
  let audioCtx   = null;
  let masterGain = null;
  let masterVol  = 0.7;
  let isMuted    = false;
  let contextCreated = false;

  /* --------------------------------------------------------
   *  Noise buffer cache
   * ------------------------------------------------------ */
  let noiseBuffer = null;

  /**
   * Create a mono white-noise AudioBuffer (1 second).
   */
  function createNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate; // 1 second
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return noiseBuffer;
  }

  /* --------------------------------------------------------
   *  Internal: create / resume AudioContext on user gesture
   * ------------------------------------------------------ */
  function ensureContext() {
    if (!audioCtx) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = isMuted ? 0 : masterVol;
        masterGain.connect(audioCtx.destination);
        contextCreated = true;
      } catch (e) {
        console.warn('[AudioSystem] Web Audio API not available:', e);
        return false;
      }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return true;
  }

  /* --------------------------------------------------------
   *  ADSR envelope helper
   *  Attack: 5% of duration
   *  Decay:  15% of duration
   *  Sustain: 70% at 0.7× volume
   *  Release: 10% of duration (fade to 0)
   * ------------------------------------------------------ */
  function applyEnvelope(gainNode, volume, duration, startTime) {
    const g = gainNode.gain;
    const attackEnd  = startTime + duration * 0.05;
    const decayEnd   = startTime + duration * 0.20;
    const sustainEnd = startTime + duration * 0.85;
    const releaseEnd = startTime + duration;

    g.setValueAtTime(0, startTime);
    g.linearRampToValueAtTime(volume, attackEnd);          // Attack
    g.linearRampToValueAtTime(volume * 0.7, decayEnd);     // Decay
    g.setValueAtTime(volume * 0.7, sustainEnd);            // Sustain
    g.linearRampToValueAtTime(0, releaseEnd);              // Release
  }

  /* --------------------------------------------------------
   *  Play a noise-based sound with optional filter
   * ------------------------------------------------------ */
  function playNoise(def, startTime) {
    const buf = createNoiseBuffer();
    const src = audioCtx.createBufferSource();
    src.buffer = buf;

    const gain = audioCtx.createGain();
    applyEnvelope(gain, def.volume, def.duration, startTime);

    if (def.filter && def.filterFreq) {
      const filt = audioCtx.createBiquadFilter();
      filt.type = def.filter;
      filt.frequency.value = def.filterFreq;
      filt.Q.value = 1;
      src.connect(filt);
      filt.connect(gain);
    } else {
      src.connect(gain);
    }

    gain.connect(masterGain);
    src.start(startTime);
    src.stop(startTime + def.duration);
  }

  /* --------------------------------------------------------
   *  Play an oscillator-based sound
   * ------------------------------------------------------ */
  function playOscillator(def, freq, startTime, duration) {
    const osc = audioCtx.createOscillator();
    osc.type = def.type;
    osc.frequency.setValueAtTime(freq, startTime);

    const gain = audioCtx.createGain();
    const vol = def.volume || 0.3;
    const dur = duration || def.duration;
    applyEnvelope(gain, vol, dur, startTime);

    // Frequency slide
    if (def.slide) {
      osc.frequency.linearRampToValueAtTime(
        freq + def.slide,
        startTime + dur
      );
    }

    // Vibrato (LFO)
    if (def.vibrato) {
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 12; // LFO rate
      lfoGain.gain.value = def.vibrato;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + dur);
    }

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.01);
  }

  /* --------------------------------------------------------
   *  Play arpeggio (sequence of tones)
   * ------------------------------------------------------ */
  function playArpeggio(def, startTime) {
    const notes = def.arpeggio;
    if (!notes || notes.length === 0) return;
    const noteDur = def.duration / notes.length;

    notes.forEach((freq, i) => {
      const noteStart = startTime + i * noteDur;
      playOscillator(
        { ...def, slide: 0, vibrato: 0 },
        freq,
        noteStart,
        noteDur
      );
    });
  }

  /* --------------------------------------------------------
   *  Public API
   * ------------------------------------------------------ */
  return {
    /* -------------------------------------------------------
     *  init — lazy: real context creation on first play()
     * ----------------------------------------------------- */
    init() {
      // Context will be created on first user-triggered play()
      // to comply with autoplay policies.
    },

    /* -------------------------------------------------------
     *  play — synthesize and play a sound by ID
     * ----------------------------------------------------- */
    play(soundId) {
      // Respect Game.soundEnabled flag
      if (typeof Game !== 'undefined' && Game.soundEnabled === false) return;

      // Ensure AudioContext exists
      if (!ensureContext()) return;

      const def = SOUNDS[soundId];
      if (!def) {
        console.warn(`[AudioSystem] Unknown sound: ${soundId}`);
        return;
      }

      const now = audioCtx.currentTime;

      // Arpeggio takes priority if defined
      if (def.arpeggio && def.arpeggio.length > 0) {
        playArpeggio(def, now);
        return;
      }

      // Noise-based sounds
      if (def.type === 'noise') {
        playNoise(def, now);
        return;
      }

      // Oscillator-based sounds (sine, square, sawtooth, triangle)
      playOscillator(def, def.freq, now, def.duration);
    },

    /* -------------------------------------------------------
     *  setVolume — set master volume (0–1)
     * ----------------------------------------------------- */
    setVolume(v) {
      masterVol = Math.max(0, Math.min(1, v));
      if (masterGain && !isMuted) {
        masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);
      }
    },

    /* -------------------------------------------------------
     *  mute / unmute — toggle master volume
     * ----------------------------------------------------- */
    mute() {
      isMuted = true;
      if (masterGain) {
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      }
    },

    unmute() {
      isMuted = false;
      if (masterGain) {
        masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);
      }
    },

    /* -------------------------------------------------------
     *  ensureContext — public: force context creation
     *  (e.g. call on first user click)
     * ----------------------------------------------------- */
    ensureContext() {
      return ensureContext();
    },

    /* -------------------------------------------------------
     *  Expose sound definitions for external inspection
     * ----------------------------------------------------- */
    get SOUNDS() { return SOUNDS; }
  };
})();
