import { useMemo, useState } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { missingEquipmentOpportunities } from '../../services/exerciseFilter'

export const ExcludedEquipment = () => {
  const { exercises, equipmentData, equipmentSelected } = useWorkoutState()
  const [expanded, setExpanded] = useState<string | null>(null)

  const opportunities = useMemo(
    () => missingEquipmentOpportunities(exercises, equipmentSelected),
    [exercises, equipmentSelected],
  )

  if (opportunities.length === 0) return null

  const categoryName = (categoryId: string) =>
    equipmentData?.categories.find((category) => category.id === categoryId)?.name ?? categoryId

  return (
    <section className="panel">
      <h2 className="panel__title">Expand your gym</h2>
      <p className="panel__subtitle">
        These would unlock exercises we couldn't suggest today.
      </p>
      <ul className="unlock-list">
        {opportunities.map((opportunity) => {
          const isOpen = expanded === opportunity.categoryId
          return (
            <li key={opportunity.categoryId} className="unlock">
              <button
                type="button"
                className="unlock__header"
                onClick={() => setExpanded(isOpen ? null : opportunity.categoryId)}
                aria-expanded={isOpen}
              >
                <span className="unlock__name">{categoryName(opportunity.categoryId)}</span>
                <span className="unlock__count">
                  Unlocks {opportunity.unlockedCount} exercise
                  {opportunity.unlockedCount === 1 ? '' : 's'}
                </span>
              </button>
              {isOpen && (
                <ul className="unlock__exercises">
                  {opportunity.exercises.map((exercise) => (
                    <li key={exercise.id}>
                      <strong>{exercise.name}</strong> — {exercise.description}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
