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
  completed: boolean;
}

export interface WorkoutLogEntry {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
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

export type AppTab = 'today' | 'schedule' | 'history' | 'exercises' | 'ringtones' | 'about';
