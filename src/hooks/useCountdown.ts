import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Seconds remaining at which to fire an announcement, e.g. [20, 10, 5]. */
  announceAt?: number[]
  onAnnounce?: (secondsRemaining: number) => void
  onComplete?: () => void
}

/**
 * A one-second countdown that announces at set marks and fires once on
 * completion. Restarts whenever `seconds` changes and `running` is true.
 */
export const useCountdown = (
  seconds: number,
  running: boolean,
  { announceAt = [], onAnnounce, onComplete }: Options = {},
) => {
  const [remaining, setRemaining] = useState(seconds)
  const announcedRef = useRef<Set<number>>(new Set())
  const completedRef = useRef(false)
  // Latest callbacks without resetting the interval each render.
  const onAnnounceRef = useRef(onAnnounce)
  const onCompleteRef = useRef(onComplete)
  onAnnounceRef.current = onAnnounce
  onCompleteRef.current = onComplete

  useEffect(() => {
    setRemaining(seconds)
    announcedRef.current = new Set()
    completedRef.current = false
  }, [seconds])

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setRemaining((previous) => {
        const next = Math.max(0, previous - 1)
        if (announceAt.includes(next) && next > 0 && !announcedRef.current.has(next)) {
          announcedRef.current.add(next)
          onAnnounceRef.current?.(next)
        }
        if (next === 0 && !completedRef.current) {
          completedRef.current = true
          onCompleteRef.current?.()
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(interval)
    // announceAt is a literal array at the call site; join it so a new array
    // with the same marks doesn't restart the timer.
  }, [running, announceAt.join(',')])

  return remaining
}
