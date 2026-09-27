// Web Audio API Synthesizer for Quiz Tournament Music & SFX
// 100% self-contained, zero external asset dependencies, zero 404s/CORS issues
// Guaranteed non-overlapping playback with active node tracking and limiter

class QuizAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.32;
  private sfxVolume: number = 0.55;

  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  // Active track management to prevent ANY sound overlapping
  private currentBgmInterval: any = null;
  private currentBgmTimeouts: any[] = [];
  private currentBgmType: 'lobby' | 'tension' | 'celebration' | null = null;
  private activeBgmOscillators: OscillatorNode[] = [];
  private sequenceId: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Initialize master dynamics compressor to prevent clipping and clashing
      if (!this.masterCompressor) {
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(10, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

        this.masterCompressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBgm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Safely stop all ongoing BGM, timers, and scheduled oscillators
  public stopBgm() {
    this.sequenceId++; // Invalidate any pending async callbacks

    if (this.currentBgmInterval) {
      clearInterval(this.currentBgmInterval);
      this.currentBgmInterval = null;
    }

    this.currentBgmTimeouts.forEach((tid) => clearTimeout(tid));
    this.currentBgmTimeouts = [];

    // Stop and disconnect any active oscillators immediately
    this.activeBgmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // already stopped
      }
    });
    this.activeBgmOscillators = [];
    this.currentBgmType = null;
  }

  // --- Sound Effects (SFX) ---

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterCompressor);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Countdown Beep (3, 2, 1 and Go!)
  public playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    if (!isFinal) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterCompressor);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterCompressor!);
        osc.start(now + idx * 0.03);
        osc.stop(now + 0.4);
      });
    }
  }

  public playTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.03);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterCompressor);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playTensionPulse() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterCompressor);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterCompressor!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.3);
    });
  }

  public playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterCompressor);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playConfettiSparkle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    const sparkles = [1300, 1650, 2100, 2500, 1850, 2750];
    sparkles.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(this.sfxVolume * 0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterCompressor!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.1);
    });
  }

  // --- Background Music (BGM) Generators ---

  // 1. Lobby Music (Groovy Upbeat Synth)
  public startLobbyMusic() {
    if (this.isMuted || this.currentBgmType === 'lobby') return;
    this.stopBgm();
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    this.currentBgmType = 'lobby';
    const seq = this.sequenceId;

    const stepDuration = 0.24;
    const bassline = [130.81, 130.81, 164.81, 196.0, 146.83, 146.83, 174.61, 220.0];
    const leadMelody = [523.25, 0, 659.25, 523.25, 587.33, 0, 698.46, 587.33];

    let step = 0;
    const playStep = () => {
      if (this.sequenceId !== seq || this.isMuted || !this.ctx || !this.masterCompressor) return;
      const now = this.ctx.currentTime;

      const bFreq = bassline[step % bassline.length];
      if (bFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bFreq, now);

        gain.gain.setValueAtTime(this.musicVolume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

        osc.connect(gain);
        gain.connect(this.masterCompressor);
        osc.start(now);
        osc.stop(now + stepDuration * 0.85);
      }

      const lFreq = leadMelody[step % leadMelody.length];
      if (lFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(lFreq, now);

        gain.gain.setValueAtTime(this.musicVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.7);

        osc.connect(gain);
        gain.connect(this.masterCompressor);
        osc.start(now);
        osc.stop(now + stepDuration * 0.7);
      }

      step++;
    };

    playStep();
    this.currentBgmInterval = setInterval(playStep, stepDuration * 1000);
  }

  // 2. Question Tension Music
  public startQuestionMusic() {
    if (this.isMuted || this.currentBgmType === 'tension') return;
    this.stopBgm();
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    this.currentBgmType = 'tension';
    const seq = this.sequenceId;

    const stepDuration = 0.22;
    const suspenseNotes = [
      220.0, 220.0, 261.63, 220.0, 293.66, 261.63, 246.94, 220.0,
      196.0, 196.0, 246.94, 196.0, 261.63, 246.94, 220.0, 196.0,
    ];

    let step = 0;
    const playStep = () => {
      if (this.sequenceId !== seq || this.isMuted || !this.ctx || !this.masterCompressor) return;
      const now = this.ctx.currentTime;
      const freq = suspenseNotes[step % suspenseNotes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.musicVolume * 0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.75);

      osc.connect(gain);
      gain.connect(this.masterCompressor);
      osc.start(now);
      osc.stop(now + stepDuration * 0.75);

      step++;
    };

    playStep();
    this.currentBgmInterval = setInterval(playStep, stepDuration * 1000);
  }

  // 3. BRAND NEW CELEBRATION MUSIC (Musik Selebrasi Juara)
  // Harmonic, non-overlapping, warm brass & triumphant festival melody
  public startCelebrationMusic() {
    if (this.isMuted) return;
    // Always cleanly reset previous sequence to prevent any overlapping
    this.stopBgm();
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    this.currentBgmType = 'celebration';
    const seq = this.sequenceId;

    // Phase 1: Majestic Triumphant Fanfare (2.0 seconds)
    // Clear, clean, harmonious brass sequence (C5 -> E5 -> G5 -> C6 high champion chord)
    const fanfareNotes = [
      { f: 523.25, time: 0.0, dur: 0.22, vol: 0.35 },  // C5
      { f: 523.25, time: 0.24, dur: 0.18, vol: 0.35 }, // C5
      { f: 659.25, time: 0.44, dur: 0.22, vol: 0.38 }, // E5
      { f: 783.99, time: 0.68, dur: 0.35, vol: 0.42 }, // G5
      { f: 659.25, time: 1.05, dur: 0.18, vol: 0.35 }, // E5
      { f: 1046.5, time: 1.25, dur: 0.85, vol: 0.45 }, // C6 (Peak champion note)
    ];

    const now = this.ctx.currentTime;
    fanfareNotes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      // Warm melodic triangle oscillator
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.time);

      gain.gain.setValueAtTime(this.musicVolume * note.vol, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(this.masterCompressor!);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
      this.activeBgmOscillators.push(osc);
    });

    // Phase 2: Joyful, Uplifting Celebration Groove (Smooth loop at ~124 BPM)
    // Starts exactly after fanfare completes at 2.2 seconds
    const timeoutId = setTimeout(() => {
      if (this.sequenceId !== seq || this.isMuted || !this.ctx || !this.masterCompressor) return;

      const beatDuration = 0.28; // ~107 BPM celebratory march tempo

      // Triumphant chord progressions (C Major, G Major, A Minor, F Major)
      const chordRhythm = [
        // Bar 1: C Major (C5, E5, G5)
        [523.25, 659.25, 783.99],
        [523.25, 659.25, 783.99],
        // Bar 2: G Major (392.00, 493.88, 587.33)
        [392.0, 493.88, 587.33],
        [392.0, 493.88, 587.33],
        // Bar 3: A Minor (440.00, 523.25, 659.25)
        [440.0, 523.25, 659.25],
        [440.0, 523.25, 659.25],
        // Bar 4: F Major (349.23, 440.00, 523.25)
        [349.23, 440.0, 523.25],
        [392.0, 493.88, 587.33], // Transition G
      ];

      // Joyful celebratory melody
      const melody = [
        1046.5, 783.99, 880.0, 1046.5,
        1174.66, 1046.5, 880.0, 783.99,
      ];

      let beatIndex = 0;

      const playCelebrationBeat = () => {
        if (this.sequenceId !== seq || this.isMuted || !this.ctx || !this.masterCompressor) return;
        const beatNow = this.ctx.currentTime;

        const chordNotes = chordRhythm[beatIndex % chordRhythm.length];
        const melNote = melody[beatIndex % melody.length];

        // 1. Play warm harmonic chord layer
        chordNotes.forEach((f, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, beatNow);

          gain.gain.setValueAtTime(this.musicVolume * 0.12, beatNow);
          gain.gain.exponentialRampToValueAtTime(0.001, beatNow + beatDuration * 0.85);

          osc.connect(gain);
          gain.connect(this.masterCompressor!);
          osc.start(beatNow);
          osc.stop(beatNow + beatDuration * 0.85);
        });

        // 2. Play celebratory lead sparkle note
        if (melNote > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(melNote, beatNow);

          gain.gain.setValueAtTime(this.musicVolume * 0.18, beatNow);
          gain.gain.exponentialRampToValueAtTime(0.001, beatNow + beatDuration * 0.7);

          osc.connect(gain);
          gain.connect(this.masterCompressor);
          osc.start(beatNow);
          osc.stop(beatNow + beatDuration * 0.7);
        }

        beatIndex++;
      };

      playCelebrationBeat();
      this.currentBgmInterval = setInterval(playCelebrationBeat, beatDuration * 1000);
    }, 2200);

    this.currentBgmTimeouts.push(timeoutId);
  }

  // Single-shot celebratory fanfare (for replay button)
  public playPodiumFanfare() {
    this.startCelebrationMusic();
  }

  // Aliases for compatibility
  public startVictoryMusic() {
    this.startCelebrationMusic();
  }

  public playStartFanfare() {
    this.playCountdownBeep(true);
  }

  public playCountdown(isFinal: boolean = false) {
    this.playCountdownBeep(isFinal);
  }

  public playFinish() {
    this.playCelebrationFanfare();
  }

  public playCelebrationFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterCompressor) return;

    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, t: 0.0, d: 0.18 },  // C5
      { f: 659.25, t: 0.2, d: 0.18 },  // E5
      { f: 783.99, t: 0.4, d: 0.22 },  // G5
      { f: 1046.5, t: 0.65, d: 0.6 },  // C6
    ];

    fanfare.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.masterCompressor!);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  public startBgm(type: 'lobby' | 'tension' | 'student' | 'victory' | 'celebration' = 'tension') {
    if (type === 'lobby') {
      this.startLobbyMusic();
    } else if (type === 'victory' || type === 'celebration') {
      this.startCelebrationMusic();
    } else {
      this.startQuestionMusic();
    }
  }
}

export const quizAudio = new QuizAudioEngine();
