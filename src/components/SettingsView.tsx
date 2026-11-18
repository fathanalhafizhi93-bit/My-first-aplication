import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Clock,
  Globe,
  HelpCircle,
  Hexagon,
  Layers,
  LogOut,
  Moon,
  Music,
  Palette,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Sunrise,
  User,
  Volume2,
} from 'lucide-react';
import { formatClockTime } from '../lib/dateUtils';
import {
  ACCENT_COLOR_PRESETS,
  computeContrastForeground,
  DayTimeMode,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MATERIAL_TINT_BY_THEME,
  MATERIAL_TINT_PRESETS,
  UiTheme,
  useI18n,
} from '../lib/i18n';
import {
  AndroidAlarmDiagnostics,
  getAndroidAlarmDiagnostics,
  isNativeAndroid,
  openAndroidExactAlarmSettings,
  requestAndroidNotificationPermission,
  scheduleAndroidTestNotification,
} from '../lib/nativeAlarmBridge';
import { UserProfile } from '../types/gym';

interface SettingsViewProps {
  now: Date;
  profile: UserProfile;
  embeddedInModal?: boolean;
  onUpdateProfile: (
    patch: Partial<
      Pick<
        UserProfile,
        | 'displayName'
        | 'volume'
        | 'notificationsEnabled'
        | 'snoozeMinutes'
        | 'autoStartRestTimer'
      >
    >
  ) => Promise<void>;
  onOpenRingtones: () => void;
  onOpenTutorial: () => void;
  onSignOut: () => Promise<void>;
}

export function SettingsView({
  now,
  profile,
  embeddedInModal = false,
  onUpdateProfile,
  onOpenRingtones,
  onOpenTutorial,
  onSignOut,
}: SettingsViewProps) {
  const {
    lang,
    setLang,
    clockFormat,
    setClockFormat,
    todayThemeMode,
    setTodayThemeMode,
    uiTheme,
    setUiTheme,
    accentColor,
    setAccentColor,
    materialTintColor,
    effectiveMaterialTint,
    setMaterialTintColor,
    resetThemeCustomization,
    t,
  } = useI18n();

  const runningNativeAndroid = isNativeAndroid();
  const [androidDiag, setAndroidDiag] = useState<AndroidAlarmDiagnostics | null>(null);
  const [testNotifStatus, setTestNotifStatus] = useState<string | null>(null);
  const [schedulingTest, setSchedulingTest] = useState(false);

  const [nameInput, setNameInput] = useState(profile.displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setNameInput(profile.displayName);
  }, [profile.displayName]);

  const handleSaveDisplayName = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim().slice(0, 100);
    if (!cleaned) {
      setNameStatus({
        type: 'error',
        text: t('Nama panggilan tidak boleh kosong.', 'Nickname cannot be empty.'),
      });
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      await onUpdateProfile({ displayName: cleaned });
      setNameStatus({
        type: 'success',
        text: t(
          `Tersimpan! Maskot akan menyapamu "${cleaned}".`,
          `Saved! Your companion will greet you as "${cleaned}".`
        ),
      });
    } catch {
      setNameStatus({
        type: 'error',
        text: t('Gagal menyimpan nama.', 'Failed to save name.'),
      });
    } finally {
      setSavingName(false);
    }
  };

  const refreshAndroidDiagnostics = useCallback(async () => {
    if (!runningNativeAndroid) return;
    const diag = await getAndroidAlarmDiagnostics();
    setAndroidDiag(diag);
  }, [runningNativeAndroid]);

  useEffect(() => {
    void refreshAndroidDiagnostics();
  }, [refreshAndroidDiagnostics]);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  const handleRequestNotifications = async () => {
    if (runningNativeAndroid) {
      const res = await requestAndroidNotificationPermission();
      await onUpdateProfile({ notificationsEnabled: res === 'granted' });
      await refreshAndroidDiagnostics();
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    await onUpdateProfile({ notificationsEnabled: perm === 'granted' });
  };

  const handleOpenExactSettings = async () => {
    await openAndroidExactAlarmSettings();
    await refreshAndroidDiagnostics();
  };

  const handleScheduleTestNotification = async () => {
    setSchedulingTest(true);
    setTestNotifStatus(null);
    try {
      const res = await scheduleAndroidTestNotification(5);
      if (!res.granted) {
        setTestNotifStatus(
          t(
            'Izin notifikasi Android belum diberikan. Aktifkan izin terlebih dahulu.',
            'Android notification permission has not been granted yet. Please allow it first.'
          )
        );
      } else {
        setTestNotifStatus(
          res.exact
            ? t(
                'Tes alarm dijadwalkan 5 detik lagi (Exact Alarm aktif).',
                'Test alarm scheduled in 5 seconds (Exact Alarm active).'
              )
            : t(
                'Tes notifikasi dijadwalkan 5 detik lagi. Aktifkan Exact Alarm agar selalu tepat waktu.',
                'Test notification scheduled in 5 seconds. Enable Exact Alarm for exact timing.'
              )
        );
      }
      await refreshAndroidDiagnostics();
    } catch (err) {
      setTestNotifStatus(
        err instanceof Error
          ? err.message
          : t('Gagal menjadwalkan tes notifikasi Android.', 'Failed to schedule Android test notification.')
      );
    } finally {
      setSchedulingTest(false);
    }
  };

  const preview24 = formatClockTime(now, '24h', true);
  const preview12 = formatClockTime(now, '12h', true);

  const themeOptions: {
    id: DayTimeMode;
    labelId: string;
    labelEn: string;
    descId: string;
    descEn: string;
    Icon: typeof Sunrise;
  }[] = [
    {
      id: 'auto',
      labelId: 'Auto',
      labelEn: 'Auto',
      descId: 'Ikuti jam lokal',
      descEn: 'Follow device hour',
      Icon: Clock,
    },
    {
      id: 'morning',
      labelId: 'Pagi',
      labelEn: 'Morning',
      descId: '05:00 – 10:59',
      descEn: '5:00 – 10:59 AM',
      Icon: Sunrise,
    },
    {
      id: 'afternoon',
      labelId: 'Siang',
      labelEn: 'Afternoon',
      descId: '11:00 – 17:59',
      descEn: '11:00 AM – 5:59 PM',
      Icon: Sun,
    },
    {
      id: 'night',
      labelId: 'Malam',
      labelEn: 'Night',
      descId: '18:00 – 04:59',
      descEn: '6:00 PM – 4:59 AM',
      Icon: Moon,
    },
  ];

  const isNotifGranted = runningNativeAndroid
    ? androidDiag?.notificationPermission === 'granted'
    : notifPermission === 'granted';

  const isCustomColorActive =
    accentColor !== DEFAULT_ACCENT_COLOR || materialTintColor !== null;

  const uiThemeOptions: {
    id: UiTheme;
    name: string;
    badgeId: string;
    badgeEn: string;
    descId: string;
    descEn: string;
    perfNoteId?: string;
    perfNoteEn?: string;
  }[] = [
    {
      id: 'obsidian',
      name: 'Obsidian Glass',
      badgeId: 'Kaca Gelap Matte',
      badgeEn: 'Matte Dark Glass',
      descId: 'Permukaan obsidian tegas, blur 14px, navigasi menempel rapi.',
      descEn: 'Crisp matte obsidian glass, 14px blur, anchored navigation bar.',
    },
    {
      id: 'midnight-frosted',
      name: 'Midnight Frosted',
      badgeId: 'Kaca Embun Berlapis',
      badgeEn: 'Frosted Liquid Glass',
      descId: 'Kaca embun 28px, kilau tepi spekular, sudut halus & dock melayang.',
      descEn: 'Deep 28px frost blur, specular ice-rim highlight & floating dock.',
      perfNoteId: 'Impact in performance — efek blur berlapis lebih berat di beberapa perangkat.',
      perfNoteEn: 'Impact in performance — heavy multi-layer blur may affect smoothness on some devices.',
    },
    {
      id: 'carbon-forge',
      name: 'Carbon Forge',
      badgeId: 'Serat Karbon Presisi',
      badgeEn: 'Matte Carbon Forge',
      descId: 'Tekstur micro-weave matte, sudut tajam presisi & aksen garis laser.',
      descEn: 'Matte micro-weave carbon weave, crisp corners & laser trim.',
    },
  ];

  const previewContrastFg = computeContrastForeground(accentColor);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embeddedInModal && (
        <div className="border-b border-white/10 pb-5">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F5F7]">
            {t('Pengaturan Aplikasi', 'App Settings')}
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {t(
              'Atur bahasa aplikasi, sistem jam 12 atau 24 jam, tema tampilan Hari Ini, serta preferensi alarm dan istirahat.',
              'Configure app language, 12-hour or 24-hour clock format, Today display theme, and alarm preferences.'
            )}
          </p>
        </div>
      )}

      {/* 0. Mascot Call Name & Profile */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            {t('Nama Panggilan & Sapaan Karakter', 'Nickname & Companion Greeting')}
          </h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {t(
              'Nama ini dipakai oleh karakter maskot untuk menyapamu setiap kali membuka IronPulse.',
              'Your workout companion uses this name to greet you whenever you open IronPulse.'
            )}
          </p>
        </div>

        <form onSubmit={handleSaveDisplayName} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="settings-display-name"
              className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]"
            >
              <User className="h-4 w-4 text-pulse" />
              <span>{t('Nama Panggilan Anda', 'Your Display Name')}</span>
            </label>
            <input
              id="settings-display-name"
              type="text"
              maxLength={100}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (nameStatus) setNameStatus(null);
              }}
              placeholder={t('Masukkan nama panggilanmu', 'Enter your nickname')}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3.5 text-sm font-semibold text-[#F4F5F7] placeholder:text-[#6B7280] focus:border-pulse focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingName || nameInput.trim() === profile.displayName.trim()}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-pulse px-5 py-2.5 text-xs font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {savingName
              ? t('Menyimpan...', 'Saving...')
              : t('Simpan Nama', 'Save Name')}
          </button>
        </form>

        {nameStatus && (
          <p
            className={`text-xs font-medium ${
              nameStatus.type === 'success' ? 'text-pulse' : 'text-[#FCA5A5]'
            }`}
          >
            {nameStatus.text}
          </p>
        )}
      </section>

      {/* 1. Material Theme & Color Studio */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
              {t('Tema Material & Warna Tampilan', 'Material Theme & Color Studio')}
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {t(
                'Pilih karakter material kaca aplikasi serta atur bebas warna tombol dan warna dasar material kaca.',
                'Choose your glass material style and customize button accent & glass surface tint colors.'
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={!isCustomColorActive}
            onClick={resetThemeCustomization}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#0A0B0E]/80 px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] transition-colors hover:border-pulse/50 hover:text-pulse disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('Reset Warna Bawaan', 'Reset Default Colors')}
          </button>
        </div>

        {/* Three Visual Material Theme Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {uiThemeOptions.map((item) => {
            const active = uiTheme === item.id;
            const isFrosted = item.id === 'midnight-frosted';
            const isCarbon = item.id === 'carbon-forge';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setUiTheme(item.id)}
                className={`group flex flex-col justify-start rounded-2xl border p-3.5 text-left transition-all ${
                  active
                    ? 'border-pulse bg-pulse/10 shadow-[0_0_0_1px_rgba(var(--ip-accent-rgb),0.25)]'
                    : 'border-white/12 bg-[#0A0B0E]/70 hover:border-white/25'
                }`}
              >
                {/* Live Miniature Material Preview */}
                <div
                  className={`relative mb-3 h-24 w-full overflow-hidden border border-white/10 p-2.5 ${
                    isCarbon ? 'rounded-lg' : 'rounded-xl'
                  }`}
                  style={{
                    backgroundColor: isFrosted
                      ? '#05070C'
                      : isCarbon
                        ? '#07080A'
                        : '#0A0B0E',
                  }}
                >
                  {/* Ambient glow behind glass (suppressed on matte carbon) */}
                  {!isCarbon && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-4 -top-4 h-16 w-24 rounded-full blur-xl"
                      style={{
                        background: isFrosted
                          ? 'rgba(56, 189, 248, 0.35)'
                          : 'rgba(129, 140, 248, 0.16)',
                      }}
                    />
                  )}
                  {isFrosted && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-3 left-2 h-12 w-20 rounded-full blur-xl"
                      style={{
                        background: 'rgba(var(--ip-accent-rgb), 0.25)',
                      }}
                    />
                  )}

                  {/* Miniature Surface Panel */}
                  <div
                    className="relative flex h-full flex-col justify-between p-2"
                    style={{
                      borderRadius: isFrosted ? '14px' : isCarbon ? '6px' : '10px',
                      backgroundColor: isCarbon ? `${effectiveMaterialTint}EE` : undefined,
                      backgroundImage: isCarbon
                        ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 4px)'
                        : undefined,
                      background: !isCarbon
                        ? isFrosted
                          ? `linear-gradient(145deg, rgba(255,255,255,0.14), ${effectiveMaterialTint}80)`
                          : `${effectiveMaterialTint}D0`
                        : undefined,
                      backdropFilter: isFrosted
                        ? 'blur(18px) saturate(185%)'
                        : isCarbon
                          ? 'none'
                          : 'blur(10px)',
                      boxShadow: isFrosted
                        ? 'inset 0 1px 0 rgba(255,255,255,0.34), inset 1px 0 0 rgba(255,255,255,0.16)'
                        : isCarbon
                          ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.5)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                      border: isFrosted
                        ? '1px solid rgba(255,255,255,0.2)'
                        : isCarbon
                          ? '1px solid rgba(255,255,255,0.14)'
                          : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="h-2 w-10 rounded-full bg-white/25" />
                      <span
                        className={`px-2 py-0.5 text-[9px] font-extrabold ${
                          isFrosted
                            ? 'rounded-full'
                            : isCarbon
                              ? 'rounded-[4px]'
                              : 'rounded-md'
                        }`}
                        style={{
                          backgroundColor: accentColor,
                          color: previewContrastFg,
                        }}
                      >
                        {t('Aksi', 'Action')}
                      </span>
                    </div>

                    {/* Mini Navigation Dock Comparison */}
                    <div
                      className={`flex items-center justify-around px-2 py-1 ${
                        isFrosted
                          ? 'mx-1 rounded-full border border-white/20 bg-white/10'
                          : isCarbon
                            ? 'rounded-[4px] border border-white/12 bg-black/55'
                            : 'rounded-lg border border-white/10 bg-black/35'
                      }`}
                    >
                      <span
                        className={`h-1 w-5 ${isCarbon ? 'rounded-none' : 'rounded-full'}`}
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="h-1 w-4 rounded-full bg-white/25" />
                      <span className="h-1 w-4 rounded-full bg-white/25" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#F4F5F7]">
                      {isFrosted ? (
                        <Sparkles className={`h-4 w-4 shrink-0 ${active ? 'text-pulse' : 'text-[#9CA3AF]'}`} />
                      ) : isCarbon ? (
                        <Hexagon className={`h-4 w-4 shrink-0 ${active ? 'text-pulse' : 'text-[#9CA3AF]'}`} />
                      ) : (
                        <Layers className={`h-4 w-4 shrink-0 ${active ? 'text-pulse' : 'text-[#9CA3AF]'}`} />
                      )}
                      <span className="truncate">{item.name}</span>
                    </span>
                    {active && (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pulse text-pulse-fg">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] font-semibold text-pulse">
                    {t(item.badgeId, item.badgeEn)}
                  </p>
                  <p className="text-xs leading-relaxed text-[#9CA3AF]">
                    {t(item.descId, item.descEn)}
                  </p>
                  {item.perfNoteId && item.perfNoteEn && (
                    <p className="pt-1 text-[11px] font-semibold text-[#FBBF24]">
                      {t(item.perfNoteId, item.perfNoteEn)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Colors: Primary Buttons & Glass Material Tint */}
        <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
          {/* Button & Accent Color Picker */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-[#0A0B0E]/75 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]">
                <Palette className="h-4 w-4 text-pulse" />
                <span>{t('Warna Tombol & Aksen', 'Button & Accent Color')}</span>
              </div>
              <span className="font-mono text-[11px] font-bold uppercase text-pulse">
                {accentColor}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_COLOR_PRESETS.map((preset) => {
                const selected = accentColor.toUpperCase() === preset.hex.toUpperCase();
                const fg = computeContrastForeground(preset.hex);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={t(preset.labelId, preset.labelEn)}
                    aria-label={`${t('Pilih warna tombol', 'Select button color')} ${t(
                      preset.labelId,
                      preset.labelEn
                    )}`}
                    onClick={() => setAccentColor(preset.hex)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
                      selected
                        ? 'border-white ring-2 ring-white/30'
                        : 'border-white/20'
                    }`}
                    style={{ backgroundColor: preset.hex, color: fg }}
                  >
                    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                );
              })}

              <label
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#F4F5F7] hover:border-pulse/60"
                title={t('Pilih warna bebas', 'Pick any custom color')}
              >
                <input
                  type="color"
                  aria-label={t('Pemilih warna kustom tombol', 'Custom button color picker')}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span>{t('Bebas', 'Custom')}</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-[#9CA3AF]">
                {t('Pratinjau tombol:', 'Button preview:')}
              </span>
              <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-pulse px-3 py-1 text-xs font-bold text-pulse-fg">
                <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                {t('Mulai Latihan', 'Start Workout')}
              </span>
            </div>
          </div>

          {/* Glass Material Tint Picker */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-[#0A0B0E]/75 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]">
                <Layers className="h-4 w-4 text-pulse" />
                <span>{t('Warna Material Kaca', 'Glass Material Tint')}</span>
              </div>
              <span className="font-mono text-[11px] font-bold uppercase text-[#D1D5DB]">
                {effectiveMaterialTint}
                {materialTintColor === null ? ` · ${t('Default', 'Default')}` : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {MATERIAL_TINT_PRESETS.map((preset) => {
                const selected =
                  effectiveMaterialTint.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={t(preset.labelId, preset.labelEn)}
                    aria-label={`${t('Pilih warna material kaca', 'Select glass tint')} ${t(
                      preset.labelId,
                      preset.labelEn
                    )}`}
                    onClick={() => setMaterialTintColor(preset.hex)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
                      selected
                        ? 'border-pulse ring-2 ring-pulse/35'
                        : 'border-white/25'
                    }`}
                    style={{ backgroundColor: preset.hex, color: '#FFFFFF' }}
                  >
                    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                );
              })}

              <label
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#F4F5F7] hover:border-pulse/60"
                title={t('Pilih warna kaca bebas', 'Pick any custom glass tint')}
              >
                <input
                  type="color"
                  aria-label={t('Pemilih warna kustom material kaca', 'Custom glass tint picker')}
                  value={effectiveMaterialTint}
                  onChange={(e) => setMaterialTintColor(e.target.value)}
                  className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span>{t('Bebas', 'Custom')}</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-[#9CA3AF]">
                {t(
                  `Default tema: ${DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme]}`,
                  `Theme default: ${DEFAULT_MATERIAL_TINT_BY_THEME[uiTheme]}`
                )}
              </span>
              {materialTintColor !== null && (
                <button
                  type="button"
                  onClick={() => setMaterialTintColor(null)}
                  className="text-[11px] font-semibold text-pulse hover:underline"
                >
                  {t('Ikuti Default Tema', 'Use Theme Default')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Language & Clock System */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
          {t('Bahasa & Sistem Jam', 'Language & Clock System')}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Language Switcher */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]">
              <Globe className="h-4 w-4 text-pulse" />
              <span>{t('Bahasa Antarmuka', 'Interface Language')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang('id')}
                className={`min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  lang === 'id'
                    ? 'border-pulse bg-pulse/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <p className="text-xs font-bold text-[#F4F5F7]">Bahasa Indonesia</p>
                <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">ID · Default</p>
              </button>

              <button
                type="button"
                onClick={() => setLang('en')}
                className={`min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  lang === 'en'
                    ? 'border-pulse bg-pulse/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <p className="text-xs font-bold text-[#F4F5F7]">English</p>
                <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">EN · International</p>
              </button>
            </div>
          </div>

          {/* 12h / 24h Clock System */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D1D5DB]">
              <Clock className="h-4 w-4 text-pulse" />
              <span>{t('Sistem Format Jam', 'Clock Display Format')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClockFormat('24h')}
                className={`min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  clockFormat === '24h'
                    ? 'border-pulse bg-pulse/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <p className="text-xs font-bold text-[#F4F5F7]">
                  {t('24 Jam (00–23)', '24-Hour (00–23)')}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-pulse">
                  {preview24.timeText}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setClockFormat('12h')}
                className={`min-h-[48px] rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  clockFormat === '12h'
                    ? 'border-pulse bg-pulse/12 text-[#F4F5F7]'
                    : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                }`}
              >
                <p className="text-xs font-bold text-[#F4F5F7]">
                  {t('12 Jam (AM / PM)', '12-Hour (AM / PM)')}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-pulse">
                  {preview12.timeText} {preview12.meridiem}
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Display Theme & Tutorial */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
              {t('Tema Suasana Tab Hari Ini', 'Today Tab Time Theme')}
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {t(
                'Default Auto mengikuti jam asli perangkat secara otomatis, atau kunci ke Pagi, Siang, atau Malam.',
                'Auto follows your real device clock by default, or lock Morning, Afternoon, or Night mood.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {themeOptions.map((item) => {
            const active = todayThemeMode === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTodayThemeMode(item.id)}
                className={`flex min-h-[56px] flex-col justify-between rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-pulse bg-pulse/12'
                    : 'border-white/10 bg-[#0A0B0E] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F4F5F7]">
                    {t(item.labelId, item.labelEn)}
                  </span>
                  <Icon
                    className={`h-4 w-4 ${active ? 'text-pulse' : 'text-[#9CA3AF]'}`}
                  />
                </div>
                <span className="mt-1 font-mono text-[11px] text-[#9CA3AF]">
                  {t(item.descId, item.descEn)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#F4F5F7]">
              {t('Panduan Fitur IronPulse', 'IronPulse Feature Guide')}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {t(
                'Buka kembali tur 5 langkah untuk melihat penjelasan tiap tab dan tombol.',
                'Reopen the 5-step interactive tour explaining each tab and control.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border border-pulse/40 bg-pulse/10 px-4 py-2 text-xs font-bold text-pulse hover:bg-pulse hover:text-pulse-fg whitespace-nowrap"
          >
            <HelpCircle className="h-4 w-4" />
            {t('Buka Panduan Fitur', 'Open Feature Guide')}
          </button>
        </div>
      </section>

      {/* 4. Alarm, Timer & Notification Preferences */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-[#F4F5F7]">
            {t('Preferensi Alarm, Timer & Notifikasi', 'Alarm, Timer & Notification Preferences')}
          </h2>
          <button
            type="button"
            onClick={onOpenRingtones}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#0A0B0E] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:border-pulse/50 hover:text-pulse whitespace-nowrap"
          >
            <Music className="h-3.5 w-3.5 text-pulse" />
            {t('Kelola Ringtone', 'Manage Ringtones')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#D1D5DB]">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-pulse" />
                {t('Volume Alarm & Timer', 'Alarm & Timer Volume')}
              </span>
              <span className="font-mono tabular-nums text-pulse">
                {Math.round(profile.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={profile.volume}
              onChange={(e) =>
                onUpdateProfile({ volume: parseFloat(e.target.value) })
              }
              className="h-2 w-full cursor-pointer accent-pulse"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[#D1D5DB]">
              {t('Durasi Tunda Alarm (Snooze)', 'Snooze Duration')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateProfile({ snoozeMinutes: mins })}
                  className={`min-h-[42px] rounded-xl border text-xs font-bold font-mono tabular-nums transition-colors ${
                    profile.snoozeMinutes === mins
                      ? 'border-pulse bg-pulse text-pulse-fg'
                      : 'border-white/10 bg-[#0A0B0E] text-[#9CA3AF] hover:text-[#F4F5F7]'
                  }`}
                >
                  {mins} {t('Menit', 'Min')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">
                {t('Timer Istirahat Otomatis', 'Auto-Start Rest Timer')}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {t(
                  'Mulai hitung mundur saat set dicentang selesai.',
                  'Start rest countdown whenever a set is checked off.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateProfile({ autoStartRestTimer: !profile.autoStartRestTimer })
              }
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
                profile.autoStartRestTimer
                  ? 'bg-pulse text-pulse-fg'
                  : 'border border-white/15 bg-[#1A1E26] text-[#9CA3AF]'
              }`}
            >
              {profile.autoStartRestTimer ? t('Aktif', 'Active') : 'Manual'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3.5">
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">
                {runningNativeAndroid
                  ? t('Notifikasi Perangkat', 'Device Notifications')
                  : t('Notifikasi Desktop', 'Desktop Notifications')}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {isNotifGranted
                  ? t('Izin notifikasi sudah aktif.', 'Notifications are allowed.')
                  : !runningNativeAndroid && notifPermission === 'denied'
                    ? t(
                        'Diblokir browser. Aktifkan izin notifikasi di setelan situs browser Anda.',
                        'Blocked by browser. Enable notifications in your browser site settings.'
                      )
                    : t(
                        'Tampilkan pengingat saat jam latihan tiba.',
                        'Show alert popup when alarm triggers.'
                      )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestNotifications}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
                isNotifGranted
                  ? 'border border-[#16A34A]/50 bg-[#16A34A]/20 text-[#4ADE80]'
                  : 'bg-[#1A1E26] border border-white/15 text-[#F4F5F7] hover:bg-[#252C38]'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              {isNotifGranted ? t('Diizinkan', 'Allowed') : t('Izinkan', 'Allow')}
            </button>
          </div>
        </div>

        {/* Android APK Native Background Alarm Diagnostics */}
        {runningNativeAndroid && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F4F5F7]">
                <Smartphone className="h-4 w-4 text-pulse" />
                <span>{t('Diagnostik Alarm Android', 'Android Alarm Diagnostics')}</span>
              </div>
              {androidDiag && (
                <span className="font-mono text-xs tabular-nums text-pulse">
                  {androidDiag.pendingCount} {t('Jadwal Aktif', 'Pending')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0A0B0E] p-3">
                <div className="flex items-center gap-2 min-w-0">
                  {androidDiag?.exactAlarmPermission === 'granted' ? (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 shrink-0 text-[#FBBF24]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F4F5F7]">Exact Alarm</p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {androidDiag?.exactAlarmPermission === 'granted'
                        ? t('Presisi tepat waktu', 'Exact timing active')
                        : t('Perlu diaktifkan di sistem', 'Enable in system settings')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenExactSettings}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-[#1A1E26] px-2.5 text-xs font-semibold text-[#F4F5F7]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  {t('Atur', 'Settings')}
                </button>
              </div>

              <button
                type="button"
                disabled={schedulingTest}
                onClick={handleScheduleTestNotification}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-pulse px-4 py-2 text-xs font-bold text-pulse-fg hover:brightness-105 disabled:opacity-60"
              >
                <BellRing className="h-4 w-4" />
                {schedulingTest
                  ? t('Menjadwalkan...', 'Scheduling...')
                  : t('Uji Notifikasi 5 Detik', '5s Notification Test')}
              </button>
            </div>

            {testNotifStatus && (
              <p className="text-xs font-medium text-pulse">{testNotifStatus}</p>
            )}
          </div>
        )}
      </section>

      {/* 5. Account & Cloud Session */}
      <section className="glass-surface rounded-2xl border border-white/12 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              {t('Akun Sinkronisasi Cloud', 'Cloud Synced Account')}
            </p>
            <p className="mt-1 truncate text-base font-bold text-[#F4F5F7]">
              {profile.displayName}
            </p>
            <p className="truncate text-xs text-[#9CA3AF]">{profile.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A1E26] px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:border-[#DC2626]/50 hover:text-[#FCA5A5] shrink-0"
          >
            <LogOut className="h-4 w-4" />
            {t('Keluar Akun', 'Sign Out')}
          </button>
        </div>
      </section>
    </div>
  );
}
