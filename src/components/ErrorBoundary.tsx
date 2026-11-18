import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('IronPulse UI Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ip-canvas-bg)] px-6 text-[#F4F5F7]">
          <div className="glass-surface w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#F4F5F7]">
              Terjadi Gangguan Koneksi / Sesi
            </h1>
            <p className="text-sm leading-relaxed text-[#9CA3AF]">
              IronPulse mengalami kendala saat memuat data. Coba muat ulang aplikasi atau periksa
              koneksi internet Anda.
            </p>
            {this.state.errorMessage && (
              <p className="rounded-lg bg-[#0A0B0E] p-3 font-mono text-xs text-[#FCA5A5] break-all">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] w-full rounded-xl bg-pulse px-4 py-2.5 text-sm font-bold text-pulse-fg hover:brightness-105"
            >
              Muat Ulang IronPulse
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
