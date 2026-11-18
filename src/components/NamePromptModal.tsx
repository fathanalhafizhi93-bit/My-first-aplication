import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, UserCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../lib/i18n';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

interface NamePromptModalProps {
  open: boolean;
  initialName: string;
  onSaveName: (name: string) => Promise<void>;
}

export function NamePromptModal({
  open,
  initialName,
  onSaveName,
}: NamePromptModalProps) {
  const { t } = useI18n();
  const [nameInput, setNameInput] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      setNameInput(initialName);
      setErrorMsg(null);
    }
  }, [open, initialName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) {
      setErrorMsg(
        t('Masukkan nama panggilanmu terlebih dahulu.', 'Please enter your name first.')
      );
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await onSaveName(cleaned.slice(0, 100));
    } catch {
      setErrorMsg(
        t('Gagal menyimpan nama. Coba lagi.', 'Failed to save name. Please try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="name-prompt-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass-surface max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-pulse/35 p-6 shadow-2xl sm:p-7"
            >
            {/* Friendly Circular Mascot Orb */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <motion.span
                  aria-hidden="true"
                  animate={{ scale: [0.96, 1.2, 0.96], opacity: [0.45, 0.1, 0.45] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border-2 border-pulse"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-pulse bg-[#0A0B0E]"
                >
                  <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
                    <circle cx="17.5" cy="20" r="2.4" fill="#F4F5F7" />
                    <circle cx="30.5" cy="20" r="2.4" fill="#F4F5F7" />
                    <path
                      d="M18 27C20.5 29.8 27.5 29.8 30 27"
                      stroke="var(--ip-accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <motion.path
                      d="M36 11C38.5 13 39.5 15.5 39 18"
                      stroke="var(--ip-accent)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      animate={{ rotate: [0, 14, -8, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                      style={{ originX: '36px', originY: '15px' }}
                    />
                  </svg>
                </motion.div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pulse">
                  {t('Kenalan dengan Maskot', 'Meet Your Companion')}
                </p>
                <h2
                  id="name-prompt-title"
                  className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]"
                >
                  {t('Siapa nama panggilanmu?', 'What should I call you?')}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#D1D5DB]">
              {t(
                'Karakter penyemangat akan menyapamu dengan nama ini setiap kali kamu membuka IronPulse. Kamu bisa menggantinya kapan saja di tab Setting.',
                'Your workout companion will greet you by this name every time you open IronPulse. You can change it anytime in Settings.'
              )}
            </p>

            <div className="mt-5">
              <label
                htmlFor="onboarding-display-name"
                className="mb-1.5 block text-xs font-semibold text-[#D1D5DB]"
              >
                {t('Nama Panggilan', 'Nickname / Display Name')}
              </label>
              <input
                id="onboarding-display-name"
                type="text"
                autoFocus
                maxLength={100}
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={t('Contoh: Fathan', 'e.g. Alex')}
                className="h-12 w-full rounded-xl border border-white/15 bg-[#0A0B0E] px-3.5 text-sm font-semibold text-[#F4F5F7] placeholder:text-[#6B7280] focus:border-pulse focus:outline-none"
              />
              {errorMsg && (
                <p className="mt-1.5 text-xs font-medium text-[#FCA5A5]">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-pulse px-5 py-3 text-sm font-bold text-pulse-fg transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              <UserCheck className="h-4 w-4" />
              <span>
                {saving
                  ? t('Menyimpan...', 'Saving...')
                  : t('Simpan & Lanjutkan', 'Save & Continue')}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
