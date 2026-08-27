import { useWorkoutState } from '../../hooks/useWorkoutState'
import { describePrescription } from '../../types/exercise'

/**
 * The last screen before the voice-driven phase. Equipment is hard to correct
 * once your hands are busy, so it gets one final editable look here.
 */
export const PreWorkoutConfirmation = () => {
  const {
    equipmentData,
    equipmentSelected,
    sequence,
    exerciseById,
    goToPhase,
    startWorkout,
    editEquipmentFromConfirm,
  } = useWorkoutState()

  const selectedItems = equipmentData
    ? equipmentData.equipment.filter((item) =>
        (equipmentSelected[item.category] ?? []).includes(item.id),
      )
    : []

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Ready?</h1>
        <p className="screen__subtitle">
          Check your gear now — once the workout starts, it's voice only.
        </p>
      </header>

      <section className="panel">
        <div className="panel__heading">
          <h2 className="panel__title">Your equipment</h2>
          <button
            type="button"
            className="button button--small"
            onClick={editEquipmentFromConfirm}
          >
            Edit
          </button>
        </div>
        {selectedItems.length > 0 ? (
          <ul className="check-list">
            {selectedItems.map((item) => (
              <li key={item.id} className="check-list__item">
                <span className="check-list__mark" aria-hidden="true">
                  ✓
                </span>
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel__subtitle">
            No equipment declared — bodyweight exercises only.
          </p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Your workout</h2>
        <ol className="confirm-sequence">
          {sequence.map((entry, index) => {
            const exercise = exerciseById(entry.exerciseId)
            if (!exercise) return null
            const prescription = describePrescription({
              ...exercise.instructions,
              reps: entry.reps,
            })
            return (
              <li key={entry.exerciseId} className="confirm-sequence__item">
                <span className="confirm-sequence__index">{index + 1}</span>
                <span className="confirm-sequence__name">{exercise.name}</span>
                <span className="confirm-sequence__meta">
                  {prescription}
                  {entry.sets > 1 && ` × ${entry.sets} sets`}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <footer className="screen__footer screen__footer--sticky">
        <div className="button-row">
          <button type="button" className="button" onClick={() => goToPhase('sequence')}>
            Back
          </button>
          <button
            type="button"
            className="button button--primary button--large"
            onClick={startWorkout}
          >
            Start Workout
          </button>
        </div>
      </footer>
    </section>
  )
}
