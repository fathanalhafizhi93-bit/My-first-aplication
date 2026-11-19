import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Globe,
  History,
  Music,
  PlayCircle,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppLanguage, useI18n } from '../lib/i18n';
import { AppTab } from '../types/gym';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

interface TutorialStep {
  id: AppTab;
  titleId: string;
  titleEn: string;
  tabLabelId: string;
  tabLabelEn: string;
  summaryId: string;
  summaryEn: string;
  tipsId: string[];
  tipsEn: string[];
  Icon: typeof PlayCircle;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'today',
    titleId: 'Catat Latihan Hari Ini',
    titleEn: "Log Today's Workout",
    tabLabelId: 'Tab Hari Ini',
    tabLabelEn: 'Today Tab',
    summaryId:
      'Ruang utama saat di gym dengan Timer Istirahat di bawah hero, suasana Pagi/Siang/Malam, maskot penyemangat, serta pengaman salah klik 30 detik.',
    summaryEn:
      'Your gym-floor screen with the Rest Timer right below the hero, Morning/Day/Night themes, companion orb, and a 30s anti-misclick guard.',
    tipsId: [
      'Gunakan Timer Istirahat di bawah hero untuk menghitung waktu pemulihan antar set secara akurat.',
      'Pengaman 30 detik mencegah salah klik atau ketukan beruntun; pakai Tetap Centang jika memang butuh cepat.',
      'Maskot bulat menyapamu dengan namamu saat aplikasi dibuka dan bertepuk tangan setiap set selesai.',
    ],
    tipsEn: [
      'Use the Rest Timer right below the hero to track your between-set recovery accurately.',
      'The 30s tap guard prevents accidental double-clicks; use Confirm Anyway whenever needed.',
      'The circular companion greets you by name when opening the app and claps on every completed set.',
    ],
    Icon: PlayCircle,
  },
  {
    id: 'schedule',
    titleId: 'Atur Hari Gym & Jam Alarm',
    titleEn: 'Weekly Days & Alarm Times',
    tabLabelId: 'Tab Jadwal',
    tabLabelEn: 'Schedule Tab',
    summaryId:
      'Pilih hari latihan dari Senin sampai Minggu, atur jam pengingat harian, fokus otot, dan nada alarm khusus.',
    summaryEn:
      'Pick your active gym days Monday through Sunday, set alarm times, muscle focus, and custom ringtones.',
    tipsId: [
      'Ubah status tiap hari menjadi Hari Gym atau Rest Day dengan satu ketukan.',
      'Setel jam pengingat dan aktifkan ikon lonceng untuk hari yang dipilih.',
      'Di APK Android, alarm mingguan otomatis tersinkron ke sistem perangkat.',
    ],
    tipsEn: [
      'Toggle any day between Gym Day and Rest Day in one tap.',
      'Set the reminder time and toggle the bell icon for active days.',
      'On the Android APK, weekly alarms sync automatically to device notifications.',
    ],
    Icon: CalendarDays,
  },
  {
    id: 'exercises',
    titleId: 'Kelola Daftar & Pustaka Gerakan',
    titleEn: 'Manage Exercises & Library',
    tabLabelId: 'Tab Gerakan',
    tabLabelEn: 'Exercises Tab',
    summaryId:
      'Susun daftar gerakan tiap hari dari pustaka siap pakai atau buat gerakan kustom beserta target set dan istirahat.',
    summaryEn:
      'Build each day’s exercise list from the built-in library or add custom movements with set & rest targets.',
    tipsId: [
      'Pilih hari di bagian atas untuk mengatur daftar gerakan hari tersebut.',
      'Cari gerakan di Pustaka lalu tekan + Tambah untuk memasukkannya ke jadwal.',
      'Atur target set, repetisi, beban awal, serta catatan teknik gerakan.',
    ],
    tipsEn: [
      'Select a day at the top to edit its planned exercises.',
      'Search the Exercise Library and tap + Add to add movements quickly.',
      'Customize target sets, reps, starting weight, and form notes.',
    ],
    Icon: Dumbbell,
  },
  {
    id: 'history',
    titleId: 'Pantau Kalender & Detail Sesi',
    titleEn: 'Consistency Calendar & Logs',
    tabLabelId: 'Tab Riwayat',
    tabLabelEn: 'History Tab',
    summaryId:
      'Lihat streak mingguan, total volume bulanan, dan buka kembali catatan beban serta set dari tanggal-tanggal sebelumnya.',
    summaryEn:
      'Track your weekly streak, monthly volume, and review logged weights and sets from past training dates.',
    tipsId: [
      'Tanggal hijau menandakan sesi selesai penuh, biru menandakan sebagian set selesai.',
      'Ketuk tanggal mana pun di kalender untuk membuka Detail Sesi di bawahnya.',
      'Semua riwayat tersimpan otomatis ke akun Cloud Anda.',
    ],
    tipsEn: [
      'Lime dates mark fully completed sessions; blue dates mark partial sessions.',
      'Tap any date on the calendar to inspect its full Session Detail below.',
      'Every logged session stays safely synced to your Cloud account.',
    ],
    Icon: History,
  },
  {
    id: 'settings',
    titleId: 'Pengaturan Alarm, Ringtone & Tema',
    titleEn: 'Alarms, Ringtones & Theme Settings',
    tabLabelId: 'Halaman Pengaturan',
    tabLabelEn: 'Settings Page',
    summaryId:
      'Atur tema antarmuka, nada dering alarm gym, suara selesai istirahat, unggah audio sendiri, serta cek izin Exact Alarm di sub-tab Alarm.',
    summaryEn:
      'Customize themes, alarm and rest tones, upload your own audio, and verify Android Exact Alarm background settings inside the Alarm tab.',
    tipsId: [
      'Buka ikon Pengaturan di pojok kanan atas lalu pilih sub-tab Alarm & Audio untuk memilih atau mengunggah MP3/WAV/OGG.',
      'Gunakan tombol Tes Alarm di pojok kanan atas untuk mencoba suara alarm.',
      'Di APK Android, cek status Exact Alarm dan jalankan Uji Notifikasi 5 Detik di sub-tab Alarm.',
    ],
    tipsEn: [
      'Open the Settings icon at top right and go to Alarm & Audio to select or upload MP3/WAV/OGG ringtones.',
      'Tap Test Alarm in the top right to preview the full-screen gym alert.',
      'On Android APK, check Exact Alarm permission and run the 5s Notification Test in the Alarm tab.',
    ],
    Icon: Music,
  },
];

interface FeatureTutorialModalProps {
  open: boolean;
  startAtLanguageStep?: boolean;
  onComplete: () => void;
  onJumpToTab: (tab: AppTab) => void;
}

export function FeatureTutorialModal({
  open,
  startAtLanguageStep = true,
  onComplete,
  onJumpToTab,
}: FeatureTutorialModalProps) {
  const { lang, setLang, t } = useI18n();
  // -1 = opening language selection step; 0..4 = 5 feature steps
  const [stepIndex, setStepIndex] = useState(startAtLanguageStep ? -1 : 0);
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    if (open) {
      setStepIndex(startAtLanguageStep ? -1 : 0);
      setConfirmSkip(false);
    }
  }, [open, startAtLanguageStep]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmSkip(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const isLanguageStep = stepIndex === -1;
  const step = !isLanguageStep ? TUTORIAL_STEPS[stepIndex] : TUTORIAL_STEPS[0];
  const StepIcon = step.Icon;
  const isFirstFeature = stepIndex === 0;
  const isLastFeature = stepIndex === TUTORIAL_STEPS.length - 1;

  const handleSelectLanguage = (chosen: AppLanguage) => {
    setLang(chosen);
  };

  const handleNext = () => {
    if (isLanguageStep) {
      setStepIndex(0);
      return;
    }
    if (isLastFeature) {
      onComplete();
      return;
    }
    setStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1));
  };

  const handlePrev = () => {
    if (isFirstFeature && startAtLanguageStep) {
      setStepIndex(-1);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0B0E]/85 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass-surface max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-white/15 p-6 shadow-2xl"
        >
        {confirmSkip ? (
          /* Gentle Skip Warning Confirmation */
          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="tutorial-modal-title"
                  className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                >
                  {t('Lewati Panduan Fitur?', 'Skip Feature Guide?')}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#D1D5DB]">
                  {t(
                    'Tidak apa-apa jika Anda ingin langsung masuk dan mencoba sendiri. Namun kalau nanti bingung mencari letak pengaturan jadwal, gerakan, atau alarm, Anda selalu bisa membuka ulang panduan ini lewat tombol ',
                    'That is totally fine if you want to jump right in. If you ever get lost looking for schedule, exercise, or alarm controls, you can always reopen this guide from '
                  )}
                  <span className="font-semibold text-pulse">
                    {t('Panduan Fitur', 'Feature Guide')}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmSkip(false)}
                className="min-h-[44px] rounded-xl bg-pulse px-5 text-xs font-bold text-pulse-fg hover:brightness-105"
              >
                {t('Kembali ke Panduan', 'Back to Guide')}
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="min-h-[44px] rounded-xl border border-white/15 bg-[#1A1E26] px-4 text-xs font-semibold text-[#D1D5DB] hover:bg-[#242B37] hover:text-[#F4F5F7]"
              >
                {t('Ya, Lewati Sekarang', 'Yes, Skip for Now')}
              </button>
            </div>
          </div>
        ) : isLanguageStep ? (
          /* Opening Step: Language Picker (Indonesia & English) */
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-pulse">
                {t('Selamat Datang di IronPulse', 'Welcome to IronPulse')}
              </span>
              <button
                type="button"
                onClick={() => setConfirmSkip(true)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-[#F4F5F7]"
              >
                {t('Lewati', 'Skip')}
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pulse/30 bg-pulse/10 text-pulse">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="tutorial-modal-title"
                  className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                >
                  Pilih Bahasa · Choose Language
                </h2>
                <p className="mt-1 text-sm text-[#D1D5DB]">
                  {t(
                    'Pilih bahasa utama Anda. Bahasa bisa diganti kapan saja di menu Akun.',
                    'Select your preferred language. You can switch it anytime in your Account panel.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage('id')}
                className={`flex min-h-[68px] flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors ${
                  lang === 'id'
                    ? 'border-pulse bg-pulse/15 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25'
                }`}
              >
                <span className="text-sm font-bold">Bahasa Indonesia</span>
                <span className="mt-0.5 text-xs text-[#9CA3AF]">
                  {lang === 'id' ? 'Dipilih · Antarmuka Indonesia' : 'Gunakan Bahasa Indonesia'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`flex min-h-[68px] flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors ${
                  lang === 'en'
                    ? 'border-pulse bg-pulse/15 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#D1D5DB] hover:border-white/25'
                }`}
              >
                <span className="text-sm font-bold">English</span>
                <span className="mt-0.5 text-xs text-[#9CA3AF]">
                  {lang === 'en' ? 'Selected · English Interface' : 'Use English interface'}
                </span>
              </button>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pulse px-5 text-xs font-bold text-pulse-fg hover:brightness-105"
              >
                {t('Mulai Panduan (5 Langkah)', 'Start Guide (5 Steps)')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Feature Steps 1 - 5 */
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold tabular-nums text-pulse">
                <span>
                  {t(
                    `Langkah ${stepIndex + 1} / ${TUTORIAL_STEPS.length}`,
                    `Step ${stepIndex + 1} / ${TUTORIAL_STEPS.length}`
                  )}
                </span>
                <span className="text-[#6B7280]">·</span>
                <span className="text-[#9CA3AF]">
                  {t(step.tabLabelId, step.tabLabelEn)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSkip(true)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-[#F4F5F7]"
              >
                {t('Lewati', 'Skip')}
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {TUTORIAL_STEPS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${t('Langkah', 'Step')} ${idx + 1}: ${t(
                    item.titleId,
                    item.titleEn
                  )}`}
                  onClick={() => setStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx <= stepIndex ? 'bg-pulse' : 'bg-white/10 hover:bg-white/25'
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pulse/30 bg-pulse/10 text-pulse">
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="tutorial-modal-title"
                    className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                    style={{ textWrap: 'balance' }}
                  >
                    {t(step.titleId, step.titleEn)}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#D1D5DB]">
                    {t(step.summaryId, step.summaryEn)}
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 border-t border-white/10 pt-4">
                {(lang === 'en' ? step.tipsEn : step.tipsId).map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-[#D1D5DB]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pulse" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  onJumpToTab(step.id);
                  onComplete();
                }}
                className="min-h-[44px] rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-xs font-semibold text-[#D1D5DB] hover:border-pulse/40 hover:text-pulse"
              >
                {t(`Buka ${step.tabLabelId}`, `Open ${step.tabLabelEn}`)}
              </button>

              <div className="flex items-center gap-2">
                {(!isFirstFeature || startAtLanguageStep) && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#1A1E26] px-4 text-xs font-semibold text-[#F4F5F7] hover:bg-[#242B37]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('Kembali', 'Back')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pulse px-5 text-xs font-bold text-pulse-fg hover:brightness-105"
                >
                  {isLastFeature
                    ? t('Selesai & Mulai', 'Finish & Start')
                    : t('Lanjut', 'Next')}
                  {!isLastFeature && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
        </motion.div>
      </div>
    </ModalPortal>
  );
}
