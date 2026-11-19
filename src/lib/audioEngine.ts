import { CustomRingtone } from '../types/gym';

export interface BuiltInRingtone {
  id: string;
  name: string;
  description: string;
  patternLabel: string;
}

export const BUILTIN_RINGTONES: BuiltInRingtone[] = [
  {
    id: 'builtin_athletic_bell',
    name: 'Athletic Bell',
    description: 'Denting bel sasana tinju & angkat beban yang tegas.',
    patternLabel: '3 Nada · Tegas',
  },
  {
    id: 'builtin_arena_horn',
    name: 'Arena Horn',
    description: 'Sinyal pembuka arena berenergi tinggi untuk sesi pagi.',
    patternLabel: 'Brass Synth · Keras',
  },
  {
    id: 'builtin_digital_pulse',
    name: 'Digital Pulse',
    description: 'Bip kronometer presisi cepat untuk fokus interval.',
    patternLabel: 'Pulsa Cepat · Presisi',
  },
  {
    id: 'builtin_kettlebell_chime',
    name: 'Kettlebell Chime',
    description: 'Lonceng logam jernih yang ideal untuk akhir waktu istirahat.',
    patternLabel: 'Lonceng Jernih · Sedang',
  },
  {
    id: 'builtin_sprint_interval',
    name: 'Sprint Interval',
    description: 'Arpeggio naik progresif untuk memacu adrenalin.',
    patternLabel: 'Progresif · Dinamis',
  },
];

// IndexedDB helper for large user-uploaded ringtones (> 450 KB)
const IDB_NAME = 'ironpulse_ringtones_db';
const IDB_STORE = 'audio_blobs';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioToIndexedDB(id: string, dataUrl: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAudioFromIndexedDB(id: string): Promise<string | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteAudioFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore cleanup failure
  }
}

export interface ParsedAudioFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  storageMode: 'cloud' | 'local_idb';
  dataUrl: string;
}

export function readUploadedAudioFile(file: File): Promise<ParsedAudioFile> {
  return new Promise((resolve, reject) => {
    const hasAudioMime = file.type.startsWith('audio/');
    const hasAudioExt = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name);
    if (!hasAudioMime && !hasAudioExt) {
      reject(new Error('Format file harus berupa audio (.mp3, .wav, .ogg, .m4a).'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Ukuran file maksimal 15 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file audio dari perangkat.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const tempAudio = new Audio(dataUrl);
      let settled = false;

      const finalize = (duration: number) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(metaTimeout);
        tempAudio.onloadedmetadata = null;
        tempAudio.onerror = null;
        tempAudio.src = '';

        // Firestore limit per doc is 1MB; keep <= 550,000 chars for cloud sync
        const storageMode = dataUrl.length <= 550000 ? 'cloud' : 'local_idb';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 80) || 'Ringtone Kustom';
        const clampedDuration = Number.isFinite(duration)
          ? Math.max(0, Math.min(3600, Math.round(duration)))
          : 0;

        resolve({
          name: cleanName,
          mimeType: (file.type || 'audio/mpeg').slice(0, 60),
          sizeBytes: file.size,
          durationSeconds: clampedDuration,
          storageMode,
          dataUrl,
        });
      };

      const metaTimeout = window.setTimeout(() => finalize(0), 4000);
      tempAudio.onloadedmetadata = () => finalize(tempAudio.duration);
      tempAudio.onerror = () => finalize(0);
    };
    reader.readAsDataURL(file);
  });
}

class GymAudioEngine {
  private ctx: AudioContext | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private loopTimer: number | null = null;
  private endTimer: number | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private unlocked = false;
  private playToken = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a zero-gain 1ms click to satisfy strict browser autoplay gates
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
      this.unlocked = ctx.state === 'running';
      return this.unlocked;
    } catch {
      return false;
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked && this.ctx?.state === 'running';
  }

  public stop(): void {
    this.playToken += 1;
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeOscillators = [];

    if (this.htmlAudio) {
      this.htmlAudio.onended = null;
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
      this.htmlAudio.loop = false;
      this.htmlAudio = null;
    }
  }

  private playSynthBurst(toneId: string, volume: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const masterGain = Math.max(0.05, Math.min(1, volume));

    const triggerNote = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType,
      peakGain: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain * masterGain, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.03);
      this.activeOscillators.push(osc);
    };

    switch (toneId) {
      case 'builtin_arena_horn': {
        triggerNote(220, 0, 0.32, 'sawtooth', 0.35);
        triggerNote(330, 0, 0.32, 'sawtooth', 0.25);
        triggerNote(440, 0.36, 0.55, 'sawtooth', 0.4);
        break;
      }
      case 'builtin_digital_pulse': {
        [0, 0.16, 0.32, 0.6].forEach((offset) => {
          triggerNote(1046.5, offset, 0.11, 'square', 0.25);
        });
        break;
      }
      case 'builtin_kettlebell_chime': {
        triggerNote(880, 0, 0.45, 'sine', 0.45);
        triggerNote(1318.5, 0.08, 0.55, 'triangle', 0.3);
        break;
      }
      case 'builtin_sprint_interval': {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((f, i) => {
          triggerNote(f, i * 0.13, 0.22, 'triangle', 0.38);
        });
        break;
      }
      case 'builtin_athletic_bell':
      default: {
        triggerNote(784, 0, 0.28, 'triangle', 0.48);
        triggerNote(1568, 0, 0.24, 'sine', 0.2);
        triggerNote(784, 0.32, 0.28, 'triangle', 0.48);
        triggerNote(1046.5, 0.64, 0.48, 'triangle', 0.52);
        break;
      }
    }
  }

  public async play(
    ringtoneId: string,
    options: {
      volume: number;
      loop?: boolean;
      customRingtones?: CustomRingtone[];
      onEnded?: () => void;
    }
  ): Promise<void> {
    this.stop();
    const token = this.playToken;
    const volume = Math.max(0, Math.min(1, options.volume));

    const custom = options.customRingtones?.find((r) => r.id === ringtoneId);
    if (custom) {
      let sourceUrl = custom.audioDataUrl;
      if (!sourceUrl && custom.storageMode === 'local_idb') {
        sourceUrl = (await getAudioFromIndexedDB(custom.id)) || '';
      }
      if (token !== this.playToken) return;

      if (sourceUrl) {
        const audio = new Audio(sourceUrl);
        audio.volume = volume;
        audio.loop = Boolean(options.loop);
        audio.onended = () => {
          if (token !== this.playToken) return;
          if (!options.loop) {
            this.htmlAudio = null;
            options.onEnded?.();
          }
        };
        this.htmlAudio = audio;
        try {
          await audio.play();
          return;
        } catch {
          if (token !== this.playToken) return;
          this.htmlAudio = null;
          // Fallback to built-in tone if browser blocked playback or blob unavailable
        }
      }
    }

    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch {
      // ignore resume failure
    }
    if (token !== this.playToken) return;

    // Play built-in synthesized tone
    this.playSynthBurst(ringtoneId, volume);
    if (options.loop) {
      this.loopTimer = window.setInterval(() => {
        if (token !== this.playToken) return;
        this.playSynthBurst(ringtoneId, volume);
      }, 1500);
    } else {
      this.endTimer = window.setTimeout(() => {
        if (token !== this.playToken) return;
        this.endTimer = null;
        options.onEnded?.();
      }, 1300);
    }
  }

  public playMascotChirp(
    variant: 'ready' | 'clap' | 'milestone' | 'celebrate' | 'rest' | 'timerActive' | 'restday' | 'night' = 'ready',
    volume = 0.85
  ): void {
    try {
      const ctx = this.ensureContext();
      const master = Math.max(0.03, Math.min(0.2, volume * 0.14));

      const emitNotes = () => {
        if ((ctx.state as AudioContextState) !== 'running') return;
        const now = ctx.currentTime;

        const chirp = (
          startFreq: number,
          endFreq: number,
          offset: number,
          duration: number,
          wave: OscillatorType = 'triangle',
          gainScale = 1
        ) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = wave;
          osc.frequency.setValueAtTime(startFreq, now + offset);
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(80, endFreq),
            now + offset + duration
          );

          const peak = Math.max(0.004, master * gainScale);
          gain.gain.setValueAtTime(0.0001, now + offset);
          gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + duration + 0.02);
          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch {
              // ignore disconnect errors
            }
          };
        };

        switch (variant) {
          case 'celebrate':
          case 'milestone': {
            chirp(587.33, 659.25, 0, 0.055, 'triangle', 1.0);
            chirp(783.99, 880, 0.065, 0.06, 'triangle', 1.05);
            chirp(1046.5, 1174.66, 0.135, 0.085, 'sine', 1.1);
            break;
          }
          case 'clap': {
            chirp(659.25, 783.99, 0, 0.05, 'triangle', 0.95);
            chirp(880, 987.77, 0.06, 0.07, 'sine', 1.0);
            break;
          }
          case 'rest':
          case 'timerActive': {
            chirp(523.25, 587.33, 0, 0.055, 'sine', 0.85);
            chirp(659.25, 698.46, 0.07, 0.065, 'sine', 0.85);
            break;
          }
          case 'restday':
          case 'night': {
            chirp(440, 493.88, 0, 0.065, 'sine', 0.72);
            chirp(523.25, 554.37, 0.08, 0.075, 'sine', 0.68);
            break;
          }
          case 'ready':
          default: {
            // Cute game-character 3-syllable chatter chirp
            chirp(540, 680, 0, 0.048, 'triangle', 0.9);
            chirp(720, 820, 0.058, 0.045, 'triangle', 0.95);
            chirp(640, 760, 0.115, 0.065, 'sine', 0.85);
            break;
          }
        }
      };

      if (ctx.state === 'running') {
        emitNotes();
      } else {
        void ctx.resume().then(emitNotes).catch(() => {});
      }
    } catch {
      // Ignore Web Audio errors when autoplay is still blocked
    }
  }
}

export const audioEngine = new GymAudioEngine();
