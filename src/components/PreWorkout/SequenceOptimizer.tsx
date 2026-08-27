import { useWorkoutState } from '../../hooks/useWorkoutState'
import { describePrescription } from '../../types/exercise'

export const SequenceOptimizer = () => {
  const { sequence, exerciseById, reorderSequence, goToPhase } = useWorkoutState()

  const transitionCount = sequence.filter((entry) => entry.transitionNote).length

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Your sequence</h1>
        <p className="screen__subtitle">
          Ordered to minimize equipment changes.{' '}
          {transitionCount === 0
            ? 'No setup changes needed.'
            : `${transitionCount} setup change${transitionCount === 1 ? '' : 's'} along the way.`}
        </p>
      </header>

      <ol className="sequence">
        {sequence.map((entry, index) => {
          const exercise = exerciseById(entry.exerciseId)
          if (!exercise) return null
          return (
            <li key={entry.exerciseId} className="sequence__item">
              {entry.transitionNote && (
                <p className="sequence__transition">{entry.transitionNote}</p>
              )}
              <div className="sequence__row">
                <span className="sequence__index">{index + 1}</span>
                <div className="sequence__details">
                  <span className="sequence__name">{exercise.name}</span>
                  <span className="sequence__meta">
                    {describePrescription({ ...exercise.instructions, reps: entry.reps })}
                    {entry.sets > 1 && ` · ${entry.sets} sets`}
                  </span>
                </div>
                <div className="sequence__controls">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => reorderSequence(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move ${exercise.name} earlier`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => reorderSequence(index, index + 1)}
                    disabled={index === sequence.length - 1}
                    aria-label={`Move ${exercise.name} later`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <footer className="screen__footer screen__footer--sticky">
        <div className="button-row">
          <button type="button" className="button" onClick={() => goToPhase('customize')}>
            Back
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => goToPhase('confirm')}
          >
            Review
          </button>
        </div>
      </footer>
    </section>
  )
}
