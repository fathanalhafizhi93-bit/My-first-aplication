import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  History,
  Music,
  PlayCircle,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppTab } from '../types/gym';

interface TutorialStep {
  id: AppTab;
  title: string;
  tabLabel: string;
  summary: string;
  tips: string[];
  Icon: typeof PlayCircle;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'today',
    title: 'Catat Latihan Hari Ini',
    tabLabel: 'Tab Hari Ini',
    summary:
      'Halaman utama saat berada di gym. Langsung isi beban (kg) dan jumlah repetisi untuk setiap set latihan hari ini.',
    tips: [
      'Tekan tombol centang hijau saat satu set selesai dikerjakan.',
      'Timer istirahat otomatis berjalan setelah set dicentang selesai.',
      'Gunakan tombol + Tambah Set jika Anda menambah set ekstra.',
    ],
    Icon: PlayCircle,
  },
  {
    id: 'schedule',
    title: 'Atur Hari Gym & Jam Alarm',
    tabLabel: 'Tab Jadwal',
    summary:
      'Pilih hari apa saja Anda berlatih dari Senin sampai Minggu, lengkap dengan jam alarm pengingat dan fokus otot.',
    tips: [
      'Ubah status hari menjadi Hari Gym atau Rest Day dengan satu ketukan.',
      'Setel jam pengingat dan aktifkan ikon lonceng untuk tiap hari.',
      'Di APK Android, jadwal alarm otomatis tersinkron ke sistem perangkat.',
    ],
    Icon: CalendarDays,
  },
  {
    id: 'exercises',
    title: 'Kelola Daftar & Pustaka Gerakan',
    tabLabel: 'Tab Gerakan',
    summary:
      'Susun variasi gerakan untuk masing-masing hari latihan menggunakan pustaka siap pakai atau buat gerakan sendiri.',
    tips: [
      'Pilih hari di bagian atas untuk mengatur daftar gerakan hari tersebut.',
      'Gunakan pencarian cepat di Pustaka Gerakan lalu tekan + Tambah.',
      'Atur target set, repetisi, beban awal, dan durasi istirahat tiap gerakan.',
    ],
    Icon: Dumbbell,
  },
  {
    id: 'history',
    title: 'Pantau Kalender & Grafik Beban',
    tabLabel: 'Tab Riwayat',
    summary:
      'Lihat konsistensi mingguan Anda di kalender bulanan serta pantau kenaikan beban maksimal dari minggu ke minggu.',
    tips: [
      'Ketuk tanggal mana pun di kalender untuk membuka rincian set yang sudah tercatat.',
      'Pilih gerakan pada Grafik Progres untuk melihat rekor terbaik (PR) Anda.',
      'Ganti tampilan antara Beban Maks (kg) dan Total Volume sesuai kebutuhan.',
    ],
    Icon: History,
  },
  {
    id: 'ringtones',
    title: 'Ringtone & Optimasi Alarm Android',
    tabLabel: 'Tab Ringtone',
    summary:
      'Sesuaikan nada dering alarm gym, suara selesai istirahat, serta pastikan alarm tetap berbunyi di background APK Android.',
    tips: [
      'Pilih nada bawaan IronPulse atau unggah file audio Anda sendiri.',
      'Gunakan tombol Tes Alarm di pojok kanan atas untuk mengecek suara.',
      'Jika memakai APK Android, cek status Exact Alarm dan jalankan Uji Notifikasi 5 Detik.',
    ],
    Icon: Music,
  },
];

interface FeatureTutorialModalProps {
  open: boolean;
  onComplete: () => void;
  onJumpToTab: (tab: AppTab) => void;
}

export function FeatureTutorialModal({
  open,
  onComplete,
  onJumpToTab,
}: FeatureTutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setConfirmSkip(false);
    }
  }, [open]);

  if (!open) return null;

  const step = TUTORIAL_STEPS[stepIndex];
  const StepIcon = step.Icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1));
  };

  const handlePrev = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0E]/85 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#13161C] p-6 shadow-2xl"
      >
        {!confirmSkip ? (
          <>
            {/* Top Step Progress & Skip */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold tabular-nums text-[#C8FF2E]">
                <span>
                  Langkah {stepIndex + 1} / {TUTORIAL_STEPS.length}
                </span>
                <span className="text-[#6B7280]">·</span>
                <span className="text-[#9CA3AF]">{step.tabLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSkip(true)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-[#F4F5F7]"
              >
                Lewati
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 5-Segment Progress Bar */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {TUTORIAL_STEPS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Buka langkah ${idx + 1}: ${item.title}`}
                  onClick={() => setStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx <= stepIndex ? 'bg-[#C8FF2E]' : 'bg-white/10 hover:bg-white/25'
                  }`}
                />
              ))}
            </div>

            {/* Step Body */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C8FF2E]/30 bg-[#C8FF2E]/10 text-[#C8FF2E]">
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="tutorial-modal-title"
                    className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                    style={{ textWrap: 'balance' }}
                  >
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#D1D5DB]">
                    {step.summary}
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 border-t border-white/10 pt-4">
                {step.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-[#D1D5DB]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C8FF2E]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Controls */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  onJumpToTab(step.id);
                  onComplete();
                }}
                className="min-h-[44px] rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-xs font-semibold text-[#D1D5DB] hover:border-[#C8FF2E]/40 hover:text-[#C8FF2E]"
              >
                Buka {step.tabLabel}
              </button>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#1A1E26] px-4 text-xs font-semibold text-[#F4F5F7] hover:bg-[#242B37]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#C8FF2E] px-5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
                >
                  {isLast ? 'Selesai & Mulai' : 'Lanjut'}
                  {!isLast && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
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
                  Lewati Panduan Fitur?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#D1D5DB]">
                  Tidak apa-apa jika Anda ingin langsung masuk dan mencoba sendiri. Namun kalau
                  nanti bingung mencari letak pengaturan jadwal, gerakan, atau alarm, Anda selalu
                  bisa membuka ulang panduan ini lewat tombol{' '}
                  <span className="font-semibold text-[#C8FF2E]">Panduan Fitur</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmSkip(false)}
                className="min-h-[44px] rounded-xl bg-[#C8FF2E] px-5 text-xs font-bold text-[#0A0B0E] hover:brightness-105"
              >
                Kembali ke Panduan
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="min-h-[44px] rounded-xl border border-white/15 bg-[#1A1E26] px-4 text-xs font-semibold text-[#D1D5DB] hover:bg-[#242B37] hover:text-[#F4F5F7]"
              >
                Ya, Lewati Sekarang
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
