import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { useVoiceSynthesis } from '../../hooks/useVoiceSynthesis'
import { useWakeLock } from '../../hooks/useWakeLock'
import { useCountdown } from '../../hooks/useCountdown'
import { describePrescription, isTimedExercise } from '../../types/exercise'
import type { VoiceCommandName } from '../../types/workout'
import { ExerciseSetup } from './ExerciseSetup'
import { RepCounter } from './RepCounter'
import { TimerDisplay } from './TimerDisplay'
import { VoiceOutput } from '../Common/VoiceOutput'
import { WakeLockNotice } from '../Common/WakeLockNotice'

/** Stages within a single exercise. */
type Stage = 'transition' | 'setup' | 'work' | 'rest' | 'set-rest'

const REST_SECONDS = 30
const SET_REST_SECONDS = 30
const TRANSITION_SECONDS = 30
/** Marks at which a countdown speaks the remaining time. */
const ANNOUNCE_MARKS = [20, 10, 5]

export const VoiceController = () => {
  const {
    currentExercise,
    currentEntry,
    currentExerciseIndex,
    sequence,
    completeCurrent,
    completeSet,
  } = useWorkoutState()

  const [stage, setStage] = useState<Stage>('setup')
  // A timed hold runs on wall time once the opening announcement finishes; the
  // interval announcements at 20/10/5 must not stop the clock.
  const [holdRunning, setHoldRunning] = useState(false)
  const [spokenText, setSpokenText] = useState('')
  const { speak, cancel, speaking } = useVoiceSynthesis()
  const wakeLock = useWakeLock(true)
  // Guards the announce-then-listen cycle so a re-render can't replay audio.
  const announcedForRef = useRef<string>('')

  const isLast = currentExerciseIndex >= sequence.length - 1

  /** Speak a line and mirror it on screen for the text fallback. */
  const say = useCallback(
    async (text: string, audio?: string | null) => {
      setSpokenText(text)
      await speak(text, { audio })
    },
    [speak],
  )

  const advance = useCallback(
    (status: 'completed' | 'skipped') => {
      cancel()
      setHoldRunning(false)
      completeCurrent(status)
      // The next exercise starts at its transition or setup stage.
      setStage('setup')
    },
    [cancel, completeCurrent],
  )

  /**
   * One set is done. Rest and repeat while sets remain; otherwise finish the
   * exercise and move on.
   */
  const finishWork = useCallback(async () => {
    setHoldRunning(false)
    if (!currentEntry) return

    const setsDone = currentEntry.setsCompleted + 1
    completeSet()

    if (setsDone < currentEntry.sets) {
      setStage('set-rest')
      return
    }

    if (isLast) {
      await say('That was your last exercise. Nice work.')
      advance('completed')
      return
    }
    setStage('rest')
  }, [currentEntry, completeSet, isLast, say, advance])

  /** Skip any sets still owed and move to the next exercise. */
  const skipRemainingSets = useCallback(() => {
    setHoldRunning(false)
    advance('completed')
  }, [advance])

  // --- Stage entry: announce transition, then setup instructions. -----------
  useEffect(() => {
    if (!currentExercise || !currentEntry) return
    const key = `${currentExerciseIndex}:${currentExercise.id}`
    if (announcedForRef.current === key) return
    announcedForRef.current = key

    let cancelled = false
    const run = async () => {
      if (currentEntry.transitionNote) {
        setStage('transition')
        await say(`Next up: ${currentExercise.name}. ${currentEntry.transitionNote}`)
        if (cancelled) return
        // The transition timer takes over from here and calls into setup.
        return
      }
      setStage('setup')
      await say(`${currentExercise.name}. ${currentExercise.setup.text}`, currentExercise.setup.audio)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [currentExercise, currentEntry, currentExerciseIndex, say])

  const beginSetup = useCallback(async () => {
    if (!currentExercise) return
    setStage('setup')
    await say(`${currentExercise.name}. ${currentExercise.setup.text}`, currentExercise.setup.audio)
  }, [currentExercise, say])

  const beginWork = useCallback(async () => {
    if (!currentExercise) return
    setStage('work')
    setHoldRunning(false)
    const setNumber = (currentEntry?.setsCompleted ?? 0) + 1
    const totalSets = currentEntry?.sets ?? 1
    const setPrefix = totalSets > 1 ? `Set ${setNumber} of ${totalSets}. ` : ''

    if (isTimedExercise(currentExercise)) {
      await say(
        `${setPrefix}${currentExercise.instructions.durationSeconds} second hold. Starting now.`,
      )
      setHoldRunning(true)
    } else {
      const prescription = describePrescription({
        ...currentExercise.instructions,
        reps: currentEntry?.reps,
      })
      await say(
        `${setPrefix}${currentExercise.name}: ${prescription}. Start when ready. Say done when you finish.`,
      )
    }
  }, [currentExercise, currentEntry, say])

  // --- Timers ---------------------------------------------------------------
  const transitionRemaining = useCountdown(TRANSITION_SECONDS, stage === 'transition' && !speaking, {
    onComplete: () => void beginSetup(),
  })

  const holdSeconds = currentExercise?.instructions.durationSeconds ?? 0
  const holdRemaining = useCountdown(
    holdSeconds,
    stage === 'work' && holdSeconds > 0 && holdRunning,
    {
      announceAt: ANNOUNCE_MARKS,
      onAnnounce: (remaining) => void say(`${remaining} seconds left.`),
      onComplete: () => {
        setHoldRunning(false)
        void (async () => {
          await say('Done.')
          await finishWork()
        })()
      },
    },
  )

  const setRestRemaining = useCountdown(SET_REST_SECONDS, stage === 'set-rest', {
    announceAt: [10],
    onAnnounce: (remaining) => void say(`${remaining} seconds.`),
    onComplete: () => void beginWork(),
  })

  const restRemaining = useCountdown(REST_SECONDS, stage === 'rest', {
    announceAt: [10],
    onAnnounce: (remaining) => void say(`${remaining} seconds.`),
    onComplete: () => advance('completed'),
  })

  // Announce each rest period once when it starts.
  useEffect(() => {
    if (stage !== 'rest') return
    void say(`${REST_SECONDS} second rest. You're doing great.`)
  }, [stage, say])

  useEffect(() => {
    if (stage !== 'set-rest' || !currentEntry) return
    const remainingSets = currentEntry.sets - currentEntry.setsCompleted
    void say(
      `Set complete. ${SET_REST_SECONDS} second rest, then ${remainingSets} more set${
        remainingSets === 1 ? '' : 's'
      }.`,
    )
  }, [stage, currentEntry, say])

  // --- Voice commands -------------------------------------------------------
  /**
   * Commands are interpreted against the current stage, per spec 2.5. Notably
   * "skip" during setup means "I know this one, get to the reps" — it only
   * abandons the exercise once the work has started.
   */
  const handleCommand = useCallback(
    (command: VoiceCommandName) => {
      switch (command) {
        case 'next':
        case 'start':
          if (stage === 'transition') void beginSetup()
          else if (stage === 'setup') void beginWork()
          else if (stage === 'work') void finishWork()
          else if (stage === 'set-rest') void beginWork()
          else if (stage === 'rest') advance('completed')
          break
        case 'repeat':
          if (stage === 'setup' && currentExercise) {
            void say(currentExercise.setup.text, currentExercise.setup.audio)
          } else if (spokenText) {
            void say(spokenText)
          }
          break
        case 'done':
          if (stage === 'work') void finishWork()
          else if (stage === 'setup') void beginWork()
          else if (stage === 'set-rest') void beginWork()
          break
        case 'skip':
          // During setup: jump to the reps rather than losing the exercise.
          if (stage === 'setup' || stage === 'transition') void beginWork()
          // Mid-exercise or between sets: drop any sets still owed.
          else if (stage === 'work') advance('skipped')
          else if (stage === 'set-rest') skipRemainingSets()
          else if (stage === 'rest') advance('completed')
          break
        case 'pause':
          cancel()
          break
      }
    },
    [
      stage,
      beginSetup,
      beginWork,
      finishWork,
      advance,
      skipRemainingSets,
      currentExercise,
      say,
      spokenText,
      cancel,
    ],
  )

  // Only listen while we're silent — the app must never hear its own voice.
  const recognition = useVoiceRecognition(({ command }) => handleCommand(command), !speaking)

  if (!currentExercise || !currentEntry) return null

  const timed = isTimedExercise(currentExercise)

  return (
    <section className="screen screen--workout">
      <WakeLockNotice active={wakeLock.active} supported={wakeLock.supported} />

      {stage === 'transition' && currentEntry.transitionNote ? (
        <div className="workout-transition">
          <p className="workout-transition__label">Adjust your setup</p>
          <p className="workout-transition__note">{currentEntry.transitionNote}</p>
          <TimerDisplay
            secondsRemaining={transitionRemaining}
            totalSeconds={TRANSITION_SECONDS}
            label="until setup instructions"
          />
        </div>
      ) : stage === 'set-rest' ? (
        <div className="workout-rest">
          <h2 className="workout-rest__title">Set complete</h2>
          <TimerDisplay
            secondsRemaining={setRestRemaining}
            totalSeconds={SET_REST_SECONDS}
            label={`until set ${currentEntry.setsCompleted + 1} of ${currentEntry.sets}`}
          />
        </div>
      ) : stage === 'rest' ? (
        <div className="workout-rest">
          <h2 className="workout-rest__title">Rest</h2>
          <TimerDisplay
            secondsRemaining={restRemaining}
            totalSeconds={REST_SECONDS}
            label="until the next exercise"
          />
        </div>
      ) : (
        <>
          <ExerciseSetup
            exercise={currentExercise}
            position={currentExerciseIndex}
            total={sequence.length}
            reps={currentEntry.reps}
            set={currentEntry.setsCompleted + 1}
            sets={currentEntry.sets}
          />
          {stage === 'work' &&
            (timed ? (
              <TimerDisplay
                secondsRemaining={holdRemaining}
                totalSeconds={holdSeconds}
                label="remaining in the hold"
              />
            ) : (
              <RepCounter
                prescription={describePrescription({
                  ...currentExercise.instructions,
                  reps: currentEntry.reps,
                })}
                set={currentEntry.setsCompleted + 1}
                sets={currentEntry.sets}
                onDone={() => void finishWork()}
              />
            ))}
        </>
      )}

      <VoiceOutput
        text={spokenText}
        speaking={speaking}
        listening={recognition.listening}
        recognitionSupported={recognition.supported}
      />

      {/* Always-present tap fallback: iOS recognition is unreliable. */}
      <div className="voice-controls">
        {stage === 'setup' && (
          <>
            <button type="button" className="button" onClick={() => handleCommand('repeat')}>
              Repeat
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => handleCommand('next')}
            >
              Next
            </button>
          </>
        )}
        {/* During setup "skip" means "go straight to the reps", so the button
            that abandons the exercise is labelled explicitly to avoid clashing
            with the voice command's meaning. */}
        {stage === 'transition' && (
          <button
            type="button"
            className="button button--primary"
            onClick={() => handleCommand('next')}
          >
            Ready
          </button>
        )}
        {stage === 'work' && !timed && null}
        {stage === 'work' && timed && (
          <button type="button" className="button" onClick={() => handleCommand('done')}>
            Done early
          </button>
        )}
        {stage === 'rest' && (
          <button type="button" className="button" onClick={() => handleCommand('skip')}>
            Skip rest
          </button>
        )}
        {stage === 'set-rest' && (
          <>
            <button type="button" className="button" onClick={() => handleCommand('next')}>
              Next set
            </button>
            <button type="button" className="button" onClick={skipRemainingSets}>
              Skip remaining sets
            </button>
          </>
        )}
        {stage !== 'set-rest' && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => advance('skipped')}
          >
            {stage === 'setup' ? 'Skip this exercise entirely' : 'Skip exercise'}
          </button>
        )}
      </div>
    </section>
  )
}
