import { ReactNode, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { haptics } from '../lib/haptics';
import { useI18n } from '../lib/i18n';
import { ModalPortal, useBodyScrollLock } from './ModalPortal';

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  accentBorderClass?: string;
  closeAriaLabel?: string;
  children: ReactNode;
}

export function GlassModal({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  accentBorderClass = 'border-white/15',
  closeAriaLabel,
  children,
}: GlassModalProps) {
  const { t, uiTheme, performance } = useI18n();
  const isMaterialYou = uiTheme === 'material-you';
  const disableBlur = performance.noBlur || uiTheme === 'ubuntu-yaru' || isMaterialYou;
  const disableAnim = performance.noAnimations;
  const backdropMouseDownRef = useRef(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: disableAnim ? 0 : 0.16 }}
            onMouseDown={(e) => {
              backdropMouseDownRef.current = e.target === e.currentTarget;
            }}
            onClick={(e) => {
              if (backdropMouseDownRef.current && e.target === e.currentTarget) {
                onClose();
              }
              backdropMouseDownRef.current = false;
            }}
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
              disableBlur ? 'bg-black/82' : 'bg-black/75 backdrop-blur-md'
            }`}
          >
            <motion.div
              initial={disableAnim ? false : { opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={disableAnim ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: disableAnim ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`glass-surface flex max-h-[min(88dvh,calc(100dvh-2rem))] w-full flex-col overflow-hidden border shadow-2xl ${
                isMaterialYou ? 'rounded-[28px]' : 'rounded-2xl'
              } ${maxWidthClass} ${accentBorderClass}`}
              style={
                isMaterialYou
                  ? { backgroundColor: 'var(--md-sys-color-surface-container-high)' }
                  : undefined
              }
            >
              {/* Sticky Glass Header */}
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#F4F5F7]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeAriaLabel || t('Tutup pop-up', 'Close popup')}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center border transition-all duration-150 active:scale-95 ${
                    isMaterialYou
                      ? 'rounded-full border-md-outline-variant bg-md-surface-highest text-md-on-surface-variant hover:border-md-outline hover:text-md-on-surface'
                      : 'rounded-xl border-white/12 bg-[#1A1E26]/80 text-[#9CA3AF] hover:border-white/25 hover:text-[#F4F5F7]'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  itemName: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  itemName,
  description,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDeleteError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    haptics.destructive();
    setDeleting(true);
    setDeleteError(null);
    try {
      await onConfirm();
      onCancel();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : t('Gagal menghapus item. Coba lagi.', 'Failed to delete item. Please try again.')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidthClass="max-w-sm"
      accentBorderClass="border-[#DC2626]/45"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DC2626]/35 bg-[#DC2626]/15 text-[#FCA5A5]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#F4F5F7]">{itemName}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#D1D5DB]">{description}</p>
          </div>
        </div>

        {deleteError && (
          <p className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/15 px-3 py-2 text-xs font-medium text-[#FCA5A5]">
            {deleteError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-[#1A1E26]/80 px-4 py-2 text-xs font-bold text-[#D1D5DB] transition-all duration-150 hover:bg-[#232935] active:scale-[0.98]"
          >
            {t('Batal', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? t('Menghapus...', 'Deleting...') : t('Ya, Hapus', 'Yes, Delete')}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
