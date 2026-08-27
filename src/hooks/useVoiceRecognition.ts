import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoiceCommand, VoiceCommandName } from '../types/workout'

/**
 * Phrases mapped to commands. Order matters: longer, more specific phrases are
 * checked first so "done early" doesn't get swallowed by "done".
 */
const PHRASES: [string, VoiceCommandName][] = [
  ['done early', 'done'],
  ['finished', 'done'],
  ['complete', 'done'],
  ['next', 'next'],
  ['repeat', 'repeat'],
  ['again', 'repeat'],
  ['say that again', 'repeat'],
  ['done', 'done'],
  ['skip', 'skip'],
  ['pass', 'skip'],
  ['start', 'start'],
  ['begin', 'start'],
  ['pause', 'pause'],
]

export const parseCommand = (transcript: string): VoiceCommandName | null => {
  const normalized = transcript.toLowerCase().trim()
  for (const [phrase, command] of PHRASES) {
    if (normalized.includes(phrase)) return command
  }
  return null
}

const getRecognitionCtor = () =>
  typeof window === 'undefined'
    ? undefined
    : window.SpeechRecognition ?? window.webkitSpeechRecognition

export const isRecognitionSupported = (): boolean => getRecognitionCtor() !== undefined

interface UseVoiceRecognition {
  listening: boolean
  supported: boolean
  transcript: string
  error: string | null
}

/**
 * Listens for workout commands while `enabled`. The caller disables this during
 * speech playback so the app never listens to its own voice.
 */
export const useVoiceRecognition = (
  onCommand: (command: VoiceCommand) => void,
  enabled: boolean,
): UseVoiceRecognition => {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const enabledRef = useRef(enabled)
  // Keep the latest callback without restarting recognition on every render.
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand
  enabledRef.current = enabled

  const supported = isRecognitionSupported()

  useEffect(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (!result.isFinal) continue
        const alternative = result[0]
        setTranscript(alternative.transcript)
        const command = parseCommand(alternative.transcript)
        if (command) {
          onCommandRef.current({
            command,
            confidence: alternative.confidence,
            transcript: alternative.transcript,
          })
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are routine during a workout — the user is
      // exercising, not talking. Only surface real failures.
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(event.error)
    }

    recognition.onend = () => {
      setListening(false)
      // Chrome ends recognition on its own after a silence; restart if we still
      // want to be listening.
      if (enabledRef.current) {
        try {
          recognition.start()
        } catch {
          // Already starting; the next onend will retry.
        }
      }
    }

    recognitionRef.current = recognition
    return () => {
      enabledRef.current = false
      recognition.onend = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (enabled) {
      try {
        recognition.start()
      } catch {
        // start() throws if it's already running — harmless.
      }
    } else {
      recognition.stop()
    }
  }, [enabled])

  return { listening, supported, transcript, error }
}

export const useCommandDispatch = () =>
  useCallback((command: VoiceCommandName): VoiceCommand => ({
    command,
    confidence: 1,
    transcript: command,
  }), [])
