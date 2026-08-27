import { useWorkoutState } from '../../hooks/useWorkoutState'
import { describePrescription, isTimedExercise } from '../../types/exercise'

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  suffix?: string
}

const Stepper = ({ label, value, min, max, onChange, suffix }: StepperProps) => (
  <div className="stepper">
    <span className="stepper__label">{label}</span>
    <div className="stepper__controls">
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <span className="stepper__value" aria-live="polite">
        {value}
        {suffix && <span className="stepper__suffix">{suffix}</span>}
      </span>
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  </div>
)

/**
 * Per-exercise reps and sets for this session. Changes never touch a saved
 * template — the user saves a new one afterwards if they want to keep them.
 */
export const RepSetsCustomizer = () => {
  const { sequence, exerciseById, customizeEntry, goToPhase, buildSequence } = useWorkoutState()

  const handleContinue = () => {
    buildSequence()
    goToPhase('sequence')
  }

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Reps and sets</h1>
        <p className="screen__subtitle">
          Two sets to start. Bump it to three as your balance improves.
        </p>
      </header>

      <div className="card-list">
        {sequence.map((entry) => {
          const exercise = exerciseById(entry.exerciseId)
          if (!exercise) return null
          const timed = isTimedExercise(exercise)
          const defaultText = describePrescription(exercise.instructions)

          return (
            <article key={entry.exerciseId} className="customize-card">
              <div className="customize-card__heading">
                <h2 className="customize-card__name">{exercise.name}</h2>
                <p className="customize-card__default">Default: {defaultText}</p>
              </div>
              <div className="customize-card__controls">
                {timed ? (
                  <p className="customize-card__timed">
                    {exercise.instructions.durationSeconds}-second hold
                  </p>
                ) : (
                  <Stepper
                    label="Reps"
                    value={entry.reps ?? exercise.instructions.reps ?? 1}
                    min={1}
                    max={99}
                    onChange={(reps) => customizeEntry(entry.exerciseId, { reps })}
                    suffix={exercise.instructions.repsPerSide ? '/side' : undefined}
                  />
                )}
                <Stepper
                  label="Sets"
                  value={entry.sets}
                  min={1}
                  max={10}
                  onChange={(sets) => customizeEntry(entry.exerciseId, { sets })}
                />
              </div>
            </article>
          )
        })}
      </div>

      <footer className="screen__footer screen__footer--sticky">
        <div className="button-row">
          <button type="button" className="button" onClick={() => goToPhase('exercises')}>
            Back
          </button>
          <button type="button" className="button button--primary" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </footer>
    </section>
  )
}
