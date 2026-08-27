import { useEffect, useState } from 'react'

interface UseWakeLock {
  active: boolean
  supported: boolean
}

/**
 * Holds a screen wake lock while `enabled`, so the phone doesn't sleep mid-set.
 * Browsers drop the lock when the tab is backgrounded, so we reacquire it when
 * the page becomes visible again.
 */
export const useWakeLock = (enabled: boolean): UseWakeLock => {
  const [active, setActive] = useState(false)
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  useEffect(() => {
    if (!enabled || !supported) {
      setActive(false)
      return
    }

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        sentinel = (await navigator.wakeLock?.request('screen')) ?? null
        if (cancelled) {
          void sentinel?.release()
          return
        }
        setActive(Boolean(sentinel))
        sentinel?.addEventListener('release', () => setActive(false))
      } catch {
        // Denied or unsupported on this device; the UI warns the user instead.
        setActive(false)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      void sentinel?.release().catch(() => undefined)
      setActive(false)
    }
  }, [enabled, supported])

  return { active, supported }
}
