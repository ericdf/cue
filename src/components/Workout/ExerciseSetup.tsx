import { useState } from 'react'
import { describePrescription, type Exercise } from '../../types/exercise'
import { asset } from '../../services/dataLoader'

interface Props {
  exercise: Exercise
  position: number
  total: number
  /** This session's reps, which may differ from the exercise default. */
  reps?: number
  set: number
  sets: number
}

/** The exercise card shown during the workout: big text, readable at arm's length. */
export const ExerciseSetup = ({ exercise, position, total, reps, set, sets }: Props) => {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(exercise.media.image) && !imageFailed

  return (
    <div className="workout-exercise">
      <p className="workout-exercise__counter">
        Exercise {position + 1} of {total}
      </p>
      <h1 className="workout-exercise__name">{exercise.name}</h1>
      {showImage && (
        <img
          className="workout-exercise__image"
          src={asset(exercise.media.image as string)}
          alt=""
          onError={() => setImageFailed(true)}
        />
      )}
      <p className="workout-exercise__prescription">
        {describePrescription({ ...exercise.instructions, reps })}
      </p>
      {sets > 1 && (
        <p className="workout-exercise__sets">
          Set {set} of {sets}
        </p>
      )}
      {exercise.cues && <p className="workout-exercise__cue">{exercise.cues}</p>}
    </div>
  )
}
