import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const HAPTICS_STORAGE_KEY = 'ironpulse_haptics_enabled';

let hapticsEnabledState: boolean = readStoredHapticsEnabled();
let lastSemanticHapticAt = 0;
let lastRoutineTapAt = 0;

function readStoredHapticsEnabled(): boolean {
  try {
    const val = localStorage.getItem(HAPTICS_STORAGE_KEY);
    if (val === '0' || val === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function getStoredHapticsEnabled(): boolean {
  hapticsEnabledState = readStoredHapticsEnabled();
  return hapticsEnabledState;
}

export function setHapticsEnabledPref(enabled: boolean): void {
  hapticsEnabledState = enabled;
  try {
    localStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabledState;
}

export function isNativeHapticsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function webVibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore unsupported or restricted web vibrate contexts
  }
}

function markSemanticFired(): void {
  lastSemanticHapticAt = nowMs();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runNativeImpact(style: ImpactStyle, webFallbackMs: number): Promise<void> {
  if (!hapticsEnabledState) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
      return;
    } catch {
      // fall through to web vibrate
    }
  }
  webVibrate(webFallbackMs);
}

async function runNativeNotification(
  type: NotificationType,
  webFallbackPattern: number | number[]
): Promise<void> {
  if (!hapticsEnabledState) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type });
      return;
    } catch {
      // fall through to web vibrate
    }
  }
  webVibrate(webFallbackPattern);
}

async function runNativeSelectionTick(webFallbackMs = 8): Promise<void> {
  if (!hapticsEnabledState) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
      return;
    } catch {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      } catch {
        // fall through
      }
    }
  }
  webVibrate(webFallbackMs);
}

export const haptics = {
  /** Subtle light tap for general buttons */
  buttonTap(): void {
    if (!hapticsEnabledState) return;
    const t = nowMs();
    if (t - lastRoutineTapAt < 28) return;
    lastRoutineTapAt = t;
    void runNativeImpact(ImpactStyle.Light, 10);
  },

  /** Crisp selection tick for switching tabs, day chips, or set pills */
  tabSwitch(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeSelectionTick(8);
  },

  /** Light tactile snap for switches, options, and toggles */
  toggle(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeImpact(ImpactStyle.Light, 12);
  },

  /** Rewarding success pulse when checking off a workout set */
  setComplete(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeNotification(NotificationType.Success, [18, 45, 28]);
  },

  /** Soft release tap when unchecking a previously completed set */
  setUncheck(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeImpact(ImpactStyle.Light, 10);
  },

  /** Celebratory multi-pulse burst when finishing all sets of the day */
  workoutComplete(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          await Haptics.notification({ type: NotificationType.Success });
          await delay(120);
          await Haptics.impact({ style: ImpactStyle.Medium });
          await delay(110);
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {
          webVibrate([25, 50, 35, 50, 65]);
        }
      })();
      return;
    }
    webVibrate([25, 50, 35, 50, 65]);
  },

  /** Warning pulse when anti-misclick 30s cooldown blocks rapid check-off */
  cooldownBlocked(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeNotification(NotificationType.Warning, [30, 40, 30]);
  },

  /** Firm medium impact when starting or resuming a rest/exercise timer */
  timerStart(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeImpact(ImpactStyle.Medium, 20);
  },

  /** Soft impact when pausing a running timer */
  timerPause(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeImpact(ImpactStyle.Light, 12);
  },

  /** Quick double-tap when resetting a timer */
  timerReset(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
          await delay(55);
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
          webVibrate([10, 35, 10]);
        }
      })();
      return;
    }
    webVibrate([10, 35, 10]);
  },

  /** Selection tick when adjusting timer +/-15s or picking a quick preset */
  timerAdjust(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeSelectionTick(10);
  },

  /** Subtle cadence pulse for final 3-2-1 countdown seconds */
  timerCountdownTick(): void {
    if (!hapticsEnabledState) return;
    void runNativeImpact(ImpactStyle.Light, 14);
  },

  /** Pronounced completion cadence when rest or timed exercise hits 00:00 */
  timerFinished(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          await Haptics.notification({ type: NotificationType.Success });
          await delay(140);
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {
          webVibrate([40, 70, 80]);
        }
      })();
      return;
    }
    webVibrate([40, 70, 80]);
  },

  /** Strong alert pulse when a gym workout alarm triggers */
  alarmAlert(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          await Haptics.notification({ type: NotificationType.Warning });
          await delay(180);
          await Haptics.vibrate({ duration: 300 });
        } catch {
          webVibrate([120, 80, 120, 80, 200]);
        }
      })();
      return;
    }
    webVibrate([120, 80, 120, 80, 200]);
  },

  /** Error/destructive confirmation pulse for deleting items */
  destructive(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeNotification(NotificationType.Error, [35, 35, 35]);
  },

  /** Subtle magnetic snap for the floating companion orb */
  orbSnap(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    void runNativeImpact(ImpactStyle.Light, 10);
  },

  /** Preview sequence for the Settings "Test Haptics" button */
  testPattern(): void {
    if (!hapticsEnabledState) return;
    markSemanticFired();
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
          await delay(90);
          await Haptics.impact({ style: ImpactStyle.Medium });
          await delay(100);
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          webVibrate([15, 50, 25, 50, 45]);
        }
      })();
      return;
    }
    webVibrate([15, 50, 25, 50, 45]);
  },
};

/**
 * Attaches a global capture-phase click listener so every enabled button
 * receives crisp light tactile feedback automatically, while yielding to
 * richer semantic haptics triggered inside React click handlers.
 */
export function attachGlobalButtonHaptics(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleDocumentClick = (event: MouseEvent) => {
    if (!hapticsEnabledState) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const interactive = target.closest('button, [role="button"]');
    if (!interactive) return;

    if (
      interactive instanceof HTMLButtonElement &&
      interactive.disabled
    ) {
      return;
    }
    if (interactive.getAttribute('aria-disabled') === 'true') return;

    const hapticMode = interactive.getAttribute('data-haptic');
    if (hapticMode === 'none') return;

    const capturedAt = nowMs();

    // Defer to microtask so React's synchronous click handler runs first.
    // If a richer semantic haptic already fired during this click, skip the generic tap.
    queueMicrotask(() => {
      if (!hapticsEnabledState) return;
      if (lastSemanticHapticAt >= capturedAt - 5 || nowMs() - lastSemanticHapticAt < 80) {
        return;
      }
      if (hapticMode === 'medium') {
        void runNativeImpact(ImpactStyle.Medium, 18);
      } else if (hapticMode === 'selection') {
        void runNativeSelectionTick(8);
      } else {
        haptics.buttonTap();
      }
    });
  };

  document.addEventListener('click', handleDocumentClick, true);
  return () => {
    document.removeEventListener('click', handleDocumentClick, true);
  };
}
