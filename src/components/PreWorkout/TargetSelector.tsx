import { useMemo } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { allTargets, filterExercises } from '../../services/exerciseFilter'

export const TargetSelector = () => {
  const { exercises, targetFocus, toggleTarget, goToPhase, equipmentSelected } = useWorkoutState()

  const targets = useMemo(() => allTargets(exercises), [exercises])
  const matchCount = useMemo(
    () => filterExercises(exercises, equipmentSelected, targetFocus).length,
    [exercises, equipmentSelected, targetFocus],
  )

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>What's the focus today?</h1>
        <p className="screen__subtitle">Choose one or more. Leave blank to see everything.</p>
      </header>

      <div className="option-grid option-grid--chips">
        {targets.map((target) => {
          const isSelected = targetFocus.includes(target)
          return (
            <button
              key={target}
              type="button"
              className={`chip${isSelected ? ' is-selected' : ''}`}
              onClick={() => toggleTarget(target)}
              aria-pressed={isSelected}
            >
              {target}
            </button>
          )
        })}
      </div>

      <footer className="screen__footer">
        <p className="screen__note">
          {matchCount} exercise{matchCount === 1 ? '' : 's'} match your equipment and focus.
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => goToPhase('equipment')}>
            Back
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => goToPhase('exercises')}
            disabled={matchCount === 0}
          >
            Continue
          </button>
        </div>
      </footer>
    </section>
  )
}
