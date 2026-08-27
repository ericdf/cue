import { useWorkoutState } from '../../hooks/useWorkoutState'
import { describePrescription } from '../../types/exercise'
import { describeRequirements } from '../../services/exerciseFilter'

export const SequenceOptimizer = () => {
  const {
    sequence,
    exerciseById,
    reorderSequence,
    goToPhase,
    equipmentData,
    equipmentSelected,
  } = useWorkoutState()

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
          const requirements = equipmentData
            ? describeRequirements(exercise, equipmentSelected, equipmentData)
            : []

          return (
            <li key={entry.exerciseId} className="sequence__item">
              {/* The transition belongs to the gap before this exercise. */}
              {entry.transitionNote ? (
                <p className="sequence__transition">
                  <span aria-hidden="true">⚠ </span>
                  {entry.transitionNote}
                </p>
              ) : (
                index > 0 && (
                  <p className="sequence__no-change">
                    <span aria-hidden="true">✓ </span>No change needed
                  </p>
                )
              )}

              <div className="sequence__row">
                <span className="sequence__index">{index + 1}</span>
                <div className="sequence__details">
                  <span className="sequence__name">{exercise.name}</span>
                  <span className="sequence__meta">
                    {describePrescription({ ...exercise.instructions, reps: entry.reps })}
                    {entry.sets > 1 && ` · ${entry.sets} sets`}
                  </span>
                  {requirements.length > 0 && (
                    <ul className="sequence__equipment">
                      {requirements.map((requirement) => (
                        <li
                          key={`${requirement.label}-${requirement.optional}`}
                          className={`sequence__equipment-item${
                            requirement.satisfied ? '' : ' is-missing'
                          }`}
                        >
                          <span aria-hidden="true">{requirement.satisfied ? '✓' : '!'}</span>
                          <span>
                            {requirement.label}
                            {requirement.optional && ' (optional)'}
                            {requirement.satisfiedBy && (
                              <span className="sequence__equipment-has">
                                {' '}
                                — you have {requirement.satisfiedBy}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
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
