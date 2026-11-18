import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import gymArenaBackdrop from '../assets/images/gym_arena_backdrop_1794848258829.jpg';
import { useI18n } from '../lib/i18n';
import { PWAInstallCard } from './PWAInstallBanner';

interface AuthGateProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
}

export function AuthGate({ onSignIn, authError }: AuthGateProps) {
  const { lang, setLang, t } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onSignIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[var(--ip-canvas-bg)] text-[#F4F5F7]">
      {/* Backdrop Image with Fallback */}
      <div className="absolute inset-0 z-0">
        {!imgFailed ? (
          <img
            src={gymArenaBackdrop}
            alt={t(
              'Suasana ruang latihan beban modern bernuansa gelap',
              'Dark atmospheric modern strength training gym'
            )}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover opacity-50"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#13161C] via-[#0A0B0E] to-[#1A1E26]">
            <Dumbbell className="h-24 w-24 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/85 to-[#0A0B0E]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-transparent to-[#0A0B0E]/60" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <span className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7] whitespace-nowrap">
          IronPulse
        </span>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-white/15 bg-[#13161C]/80 p-1">
            <button
              type="button"
              onClick={() => setLang('id')}
              className={`min-h-[28px] rounded-lg px-2.5 text-[11px] font-bold transition-colors ${
                lang === 'id' ? 'bg-pulse text-pulse-fg' : 'text-[#9CA3AF]'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`min-h-[28px] rounded-lg px-2.5 text-[11px] font-bold transition-colors ${
                lang === 'en' ? 'bg-pulse text-pulse-fg' : 'text-[#9CA3AF]'
              }`}
            >
              EN
            </button>
          </div>
          <span className="hidden sm:inline text-xs font-medium text-[#9CA3AF] whitespace-nowrap">
            {t('Sinkronisasi Cloud Aktif', 'Cloud Sync Ready')}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-12 sm:px-8">
        <div className="max-w-2xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pulse">
            {t('Gym Reminder & Pelacak Latihan', 'Gym Reminder & Workout Tracker')}
          </p>

          <h1
            className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#F4F5F7] sm:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            {t(
              'Disiplin Jadwal Latihan, Ringtone Pilihan Sendiri, dan Catatan Progres Nyata.',
              'Disciplined Training Schedules, Custom Ringtones, and Real Set Tracking.'
            )}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#B5BCC9]">
            {t(
              'Atur hari gym Anda dari Senin hingga Minggu, unggah ringtone pengingat favorit Anda, pantau daftar gerakan hari ini, catat beban dan repetisi tiap set, serta jalankan timer istirahat otomatis dalam satu ruang kerja.',
              'Configure your weekly training days Monday through Sunday, upload custom reminder ringtones, track today’s exercises with weight and reps, and run automatic rest timers in one focused workspace.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9CA3AF]">
            <span>{t('Jadwal Hari Kustom', 'Custom Weekly Days')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('Upload MP3/WAV Ringtone', 'Custom MP3/WAV Ringtones')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('Catatan Set & Beban', 'Set & Load Logging')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('Timer Istirahat', 'Rest Timer')}</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleLogin}
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-pulse px-6 py-3 text-sm font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse"
            >
              {loading
                ? t('Menghubungkan Akun...', 'Connecting Account...')
                : t('Masuk dengan Akun Google', 'Sign in with Google')}
            </button>
            {authError && (
              <p className="mt-3 text-sm font-medium text-[#F87171]">{authError}</p>
            )}
          </div>

          <div className="max-w-sm pt-2">
            <PWAInstallCard />
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 text-xs text-[#6B7280] sm:px-8">
        {t(
          'Data jadwal latihan, daftar gerakan, dan catatan set tersimpan aman di akun Cloud Anda.',
          'Your schedules, exercise routines, and workout logs are securely synced to your Cloud account.'
        )}
      </footer>
    </div>
  );
}
