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
    if (!file.type.startsWith('audio/')) {
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
      const finalize = (duration: number) => {
        // Firestore limit per doc is 1MB; keep <= 550,000 chars for cloud sync
        const storageMode = dataUrl.length <= 550000 ? 'cloud' : 'local_idb';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 80) || 'Ringtone Kustom';
        resolve({
          name: cleanName,
          mimeType: file.type || 'audio/mpeg',
          sizeBytes: file.size,
          durationSeconds: Number.isFinite(duration) ? Math.round(duration) : 0,
          storageMode,
          dataUrl,
        });
      };

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
  private activeOscillators: OscillatorNode[] = [];
  private unlocked = false;

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
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
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
    const volume = Math.max(0, Math.min(1, options.volume));

    const custom = options.customRingtones?.find((r) => r.id === ringtoneId);
    if (custom) {
      let sourceUrl = custom.audioDataUrl;
      if (!sourceUrl && custom.storageMode === 'local_idb') {
        sourceUrl = (await getAudioFromIndexedDB(custom.id)) || '';
      }

      if (sourceUrl) {
        const audio = new Audio(sourceUrl);
        audio.volume = volume;
        audio.loop = Boolean(options.loop);
        audio.onended = () => {
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
          // Fallback to built-in tone if browser blocked playback or blob unavailable
        }
      }
    }

    // Play built-in synthesized tone
    this.playSynthBurst(ringtoneId, volume);
    if (options.loop) {
      this.loopTimer = window.setInterval(() => {
        this.playSynthBurst(ringtoneId, volume);
      }, 1500);
    } else {
      window.setTimeout(() => {
        options.onEnded?.();
      }, 1300);
    }
  }
}

export const audioEngine = new GymAudioEngine();
