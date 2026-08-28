// ============================================================
// useSessionWarning — Hook برای مدیریت هشدار نشست موازی
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { loginApi } from './api';
import { API_BASE_URL, TOKEN_STRING } from '@/src/shared-constants';
import { networkObserver } from '@/src/shared-utils';
import type { WarningInfo } from './types';

// وقفهٔ اتصال مجدد بعد از خطای شبکه (نه بعد از بستن عادیِ استریم توسط سرور)
const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_MAX_DELAY_MS = 15000;

/**
 * دنبال کردن هشدارهای نشست موازی از طریق SSE (Server-Sent Events) به جای polling.
 * @param enabled - Whether the subscription is active (e.g., user is authenticated)
 */
export function useSessionWarning(enabled: boolean) {
  const [pendingWarning, setPendingWarning] = useState<WarningInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPendingWarning(null);
      return;
    }

    let stopped = false;
    let reconnectDelay = RECONNECT_BASE_DELAY_MS;

    const applyWarnings = (warnings: WarningInfo[]) => {
      setPendingWarning(warnings.length > 0 ? warnings[0] : null);
    };

    const connectOnce = async (): Promise<'closed' | 'unauthorized' | 'error'> => {
      const token = localStorage.getItem(TOKEN_STRING);
      if (!token) return 'unauthorized';

      const controller = new AbortController();
      abortRef.current = controller;

      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/session-warnings/pending-stream`, {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
      } catch {
        if (!controller.signal.aborted) networkObserver.reportApiFailure();
        return 'error';
      }

      if (response.status === 401 || response.status === 403) return 'unauthorized';
      if (!response.ok || !response.body) return 'error';

      networkObserver.reportApiSuccess();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const dataLine = frame
              .split('\n')
              .find((line) => line.startsWith('data:'));
            if (!dataLine) continue; // e.g. ": ping" keep-alive comments

            try {
              const parsed = JSON.parse(dataLine.slice(5).trim());
              applyWarnings(parsed.data ?? []);
            } catch {
              // ignore malformed frame
            }
          }
        }
      } catch {
        if (controller.signal.aborted) return 'closed';
        networkObserver.reportApiFailure();
        return 'error';
      }

      return 'closed';
    };

    const loop = async () => {
      while (!stopped) {
        const result = await connectOnce();
        if (stopped) return;

        if (result === 'unauthorized') return; // نشست منقضی — دیگر تلاش نکن

        if (result === 'closed') {
          // بستن عادی توسط سرور (پس از ~۵۵ ثانیه) — بلافاصله دوباره وصل شو
          reconnectDelay = RECONNECT_BASE_DELAY_MS;
          continue;
        }

        // خطای شبکه — با backoff دوباره تلاش کن
        await new Promise((resolve) => {
          reconnectTimerRef.current = setTimeout(resolve, reconnectDelay);
        });
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS);
      }
    };

    loop();

    return () => {
      stopped = true;
      abortRef.current?.abort();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [enabled]);

  // Respond to a warning
  const respondToWarning = useCallback(async (warningId: number, status: 'accepted' | 'rejected') => {
    setIsLoading(true);
    try {
      await loginApi.respondToWarning(warningId, status);
      setPendingWarning(null);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pendingWarning, setPendingWarning, isLoading, respondToWarning };
}
