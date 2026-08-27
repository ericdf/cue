import { useMemo } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { filterExercises } from '../../services/exerciseFilter'
import { ExerciseCard } from '../Common/ExerciseCard'

const MIN_EXERCISES = 3
const SUGGESTED_MAX = 7

export const ExerciseRecommender = () => {
  const {
    exercises,
    equipmentData,
    equipmentSelected,
    targetFocus,
    selectedExerciseIds,
    toggleExercise,
    goToPhase,
    buildSequence,
  } = useWorkoutState()

  const matches = useMemo(
    () => filterExercises(exercises, equipmentSelected, targetFocus),
    [exercises, equipmentSelected, targetFocus],
  )

  const count = selectedExerciseIds.length
  const canContinue = count >= MIN_EXERCISES

  const handleContinue = () => {
    buildSequence()
    goToPhase('customize')
  }

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Build your workout</h1>
        <p className="screen__subtitle">
          Tap to add exercises. Three to seven makes a good session.
        </p>
      </header>

      <div className="card-list">
        {matches.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            equipmentData={equipmentData}
            selected={selectedExerciseIds.includes(exercise.id)}
            onToggle={() => toggleExercise(exercise.id)}
          />
        ))}
      </div>

      <footer className="screen__footer screen__footer--sticky">
        <p className="screen__note">
          {count} added
          {count > 0 && count < MIN_EXERCISES && ` — add ${MIN_EXERCISES - count} more`}
          {count > SUGGESTED_MAX && ' — that’s a long session'}
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => goToPhase('targets')}>
            Back
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue
          </button>
        </div>
      </footer>
    </section>
  )
}
