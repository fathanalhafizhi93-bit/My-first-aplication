import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { PWAInstallCard } from './PWAInstallBanner';

interface AuthGateProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
}

export function AuthGate({ onSignIn, authError }: AuthGateProps) {
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
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#0A0B0E] text-[#F4F5F7]">
      {/* Backdrop Image with Fallback */}
      <div className="absolute inset-0 z-0">
        {!imgFailed ? (
          <img
            src="/src/assets/images/gym_arena_backdrop_1794848258829.jpg"
            alt="Suasana ruang latihan beban modern bernuansa gelap"
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
        <span className="text-xs font-medium text-[#9CA3AF] whitespace-nowrap">
          Sinkronisasi Cloud Aktif
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-12 sm:px-8">
        <div className="max-w-2xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8FF2E]">
            Gym Reminder &amp; Pelacak Latihan
          </p>

          <h1
            className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#F4F5F7] sm:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            Disiplin Jadwal Latihan, Ringtone Pilihan Sendiri, dan Catatan Progres Nyata.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#B5BCC9]">
            Atur hari gym Anda dari Senin hingga Minggu, unggah ringtone pengingat favorit Anda,
            pantau daftar gerakan hari ini, catat beban dan repetisi tiap set, serta jalankan timer
            istirahat otomatis dalam satu ruang kerja.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9CA3AF]">
            <span>Jadwal Hari Kustom</span>
            <span aria-hidden="true">·</span>
            <span>Upload MP3/WAV Ringtone</span>
            <span aria-hidden="true">·</span>
            <span>Catatan Set &amp; Beban</span>
            <span aria-hidden="true">·</span>
            <span>Timer Istirahat</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleLogin}
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-[#C8FF2E] px-6 py-3 text-sm font-bold text-[#0A0B0E] transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF2E]"
            >
              {loading ? 'Menghubungkan Akun...' : 'Masuk dengan Akun Google'}
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
        Data jadwal latihan, daftar gerakan, dan catatan set tersimpan aman di akun Cloud Anda.
      </footer>
    </div>
  );
}
