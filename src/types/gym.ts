export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayMeta {
  key: DayKey;
  label: string;
  shortLabel: string;
  jsDayIndex: number; // 0 = Sunday, 1 = Monday, ...
}

export const DAY_LIST: DayMeta[] = [
  { key: 'mon', label: 'Senin', shortLabel: 'SEN', jsDayIndex: 1 },
  { key: 'tue', label: 'Selasa', shortLabel: 'SEL', jsDayIndex: 2 },
  { key: 'wed', label: 'Rabu', shortLabel: 'RAB', jsDayIndex: 3 },
  { key: 'thu', label: 'Kamis', shortLabel: 'KAM', jsDayIndex: 4 },
  { key: 'fri', label: 'Jumat', shortLabel: 'JUM', jsDayIndex: 5 },
  { key: 'sat', label: 'Sabtu', shortLabel: 'SAB', jsDayIndex: 6 },
  { key: 'sun', label: 'Minggu', shortLabel: 'MIN', jsDayIndex: 0 },
];

export type MuscleGroup =
  | 'Dada'
  | 'Punggung'
  | 'Bahu'
  | 'Kaki'
  | 'Lengan'
  | 'Core'
  | 'Kardio';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Dada',
  'Punggung',
  'Bahu',
  'Kaki',
  'Lengan',
  'Core',
  'Kardio',
];

export type ExerciseTrackingMode = 'reps' | 'timer';
export type TimerDirection = 'countdown' | 'countup';

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  targetSets: number;
  targetReps: string;
  targetWeightKg: number;
  restSeconds: number;
  notes: string;
  trackingMode?: ExerciseTrackingMode;
  usesWeight?: boolean;
  timerDirection?: TimerDirection;
  targetDurationSeconds?: number;
}

export interface DaySchedule {
  userId: string;
  dayKey: DayKey;
  isGymDay: boolean;
  alarmEnabled: boolean;
  alarmTime: string; // HH:mm
  focusTitle: string;
  ringtoneId: string; // 'default' or built-in/custom ID
  exercises: ExerciseItem[];
}

export interface WorkoutSetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  durationSeconds?: number;
  completed: boolean;
}

export interface WorkoutLogEntry {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  trackingMode?: ExerciseTrackingMode;
  usesWeight?: boolean;
  timerDirection?: TimerDirection;
  targetDurationSeconds?: number;
  sets: WorkoutSetLog[];
}

export interface WorkoutLog {
  userId: string;
  dateKey: string; // YYYY-MM-DD
  dayKey: DayKey;
  focusTitle: string;
  entries: WorkoutLogEntry[];
  completed: boolean;
}

export function resolveExerciseTrackingMode(
  item?: { trackingMode?: ExerciseTrackingMode } | null
): ExerciseTrackingMode {
  return item?.trackingMode === 'timer' ? 'timer' : 'reps';
}

export function resolveExerciseUsesWeight(
  item?: {
    usesWeight?: boolean;
    trackingMode?: ExerciseTrackingMode;
    targetWeightKg?: number;
    equipment?: string;
  } | null
): boolean {
  if (!item) return true;
  if (typeof item.usesWeight === 'boolean') return item.usesWeight;
  if ((item.targetWeightKg ?? 0) > 0) return true;
  if (item.trackingMode === 'timer') return false;
  const eq = (item.equipment || '').toLowerCase();
  if (
    eq.includes('tanpa alat') ||
    eq.includes('bodyweight') ||
    eq.includes('no equipment')
  ) {
    return false;
  }
  return true;
}

export function resolveTargetDurationSeconds(
  item?: { targetDurationSeconds?: number; targetReps?: string } | null
): number {
  if (
    typeof item?.targetDurationSeconds === 'number' &&
    Number.isFinite(item.targetDurationSeconds) &&
    item.targetDurationSeconds > 0
  ) {
    return Math.max(5, Math.min(10800, Math.round(item.targetDurationSeconds)));
  }
  const raw = (item?.targetReps || '').trim().toLowerCase();
  if (raw) {
    const mmssMatch = raw.match(/^(\d{1,3}):(\d{1,2})$/);
    if (mmssMatch) {
      const m = Number(mmssMatch[1]) || 0;
      const s = Number(mmssMatch[2]) || 0;
      if (m * 60 + s > 0) return Math.min(10800, m * 60 + s);
    }
    const num = parseInt(raw, 10);
    if (Number.isFinite(num) && num > 0) {
      if (raw.includes('menit') || raw.includes('min') || /\bm\b/.test(raw)) {
        return Math.min(10800, num * 60);
      }
      return Math.min(10800, num);
    }
  }
  return 60;
}

export interface CustomRingtone {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  storageMode: 'cloud' | 'local_idb';
  audioDataUrl: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  defaultRingtoneId: string;
  restRingtoneId: string;
  volume: number;
  notificationsEnabled: boolean;
  snoozeMinutes: number;
  autoStartRestTimer: boolean;
}

export type AppTab =
  | 'today'
  | 'workout'
  | 'schedule'
  | 'history'
  | 'exercises'
  | 'settings'
  | 'about';
