import { useState } from 'react'
import { describePrescription, type Exercise } from '../../types/exercise'
import type { EquipmentData } from '../../types/equipment'
import { asset } from '../../services/dataLoader'

interface Props {
  exercise: Exercise
  equipmentData: EquipmentData | null
  selected?: boolean
  onToggle?: () => void
  compact?: boolean
}

const categoryName = (data: EquipmentData | null, categoryId: string): string =>
  data?.categories.find((category) => category.id === categoryId)?.name ?? categoryId

export const ExerciseCard = ({ exercise, equipmentData, selected, onToggle, compact }: Props) => {
  // Images are optional in the data set; hide the frame entirely if one 404s.
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(exercise.media.image) && !imageFailed
  const interactive = Boolean(onToggle)

  const body = (
    <>
      {showImage && !compact && (
        <img
          className="exercise-card__image"
          src={asset(exercise.media.image as string)}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="exercise-card__body">
        <div className="exercise-card__heading">
          <h3 className="exercise-card__name">{exercise.name}</h3>
          {selected && <span className="badge badge--selected">Added</span>}
        </div>
        <p className="exercise-card__description">{exercise.description}</p>
        <ul className="tag-list" aria-label="Target areas">
          {exercise.targetMuscles.map((target) => (
            <li key={target} className="tag">
              {target}
            </li>
          ))}
        </ul>
        {!compact && (
          <p className="exercise-card__meta">
            {describePrescription(exercise.instructions)}
            {exercise.requiredEquipment.length > 0 && (
              <>
                {' · '}
                {exercise.requiredEquipment
                  .map((req) => categoryName(equipmentData, req.categoryId))
                  .join(', ')}
              </>
            )}
          </p>
        )}
      </div>
    </>
  )

  if (!interactive) return <article className="exercise-card">{body}</article>

  return (
    <button
      type="button"
      className={`exercise-card exercise-card--button${selected ? ' is-selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {body}
    </button>
  )
}
