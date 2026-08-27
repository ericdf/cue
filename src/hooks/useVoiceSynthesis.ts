import { useCallback, useEffect, useRef, useState } from 'react'
import { asset } from '../services/dataLoader'

export interface SpeakOptions {
  /** Prerecorded audio path; takes priority over TTS when present. */
  audio?: string | null
  rate?: number
  pitch?: number
  volume?: number
}

export const isSynthesisSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

interface UseVoiceSynthesis {
  speak: (text: string, options?: SpeakOptions) => Promise<void>
  cancel: () => void
  speaking: boolean
  supported: boolean
}

/**
 * Speaks setup text and announcements. Prefers a prerecorded file, falls back to
 * the Web Speech synthesis API, and resolves immediately when neither is
 * available so callers never hang waiting for audio that will not play.
 */
export const useVoiceSynthesis = (): UseVoiceSynthesis => {
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supported = isSynthesisSupported()

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (isSynthesisSupported()) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  // Never leave audio playing after the component goes away.
  useEffect(() => cancel, [cancel])

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}): Promise<void> =>
      new Promise((resolve) => {
        cancel()
        setSpeaking(true)

        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          setSpeaking(false)
          resolve()
        }

        if (options.audio) {
          const audio = new Audio(asset(options.audio))
          audio.volume = options.volume ?? 1
          audioRef.current = audio
          audio.onended = finish
          // A missing or blocked file falls through to TTS rather than stalling.
          audio.onerror = () => {
            audioRef.current = null
            speakWithTts()
          }
          void audio.play().catch(() => {
            audioRef.current = null
            speakWithTts()
          })
          return
        }

        speakWithTts()

        function speakWithTts() {
          if (!isSynthesisSupported() || !text) {
            finish()
            return
          }
          try {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = options.rate ?? 0.95
            utterance.pitch = options.pitch ?? 1
            utterance.volume = options.volume ?? 1
            utterance.onend = finish
            utterance.onerror = finish
            window.speechSynthesis.speak(utterance)
            // Some engines drop an utterance without firing either callback
            // (no voices loaded yet, backgrounded tab). A workout must never
            // deadlock waiting for audio, so bound the wait on the text length.
            const timeoutMs = 4000 + text.length * 90
            window.setTimeout(finish, timeoutMs)
          } catch {
            finish()
          }
        }
      }),
    [cancel],
  )

  return { speak, cancel, speaking, supported }
}
