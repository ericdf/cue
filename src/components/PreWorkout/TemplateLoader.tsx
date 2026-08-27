import { useMemo } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { relativeTime } from '../../services/templateManager'
import { describePrescription } from '../../types/exercise'

/**
 * The entry screen: start fresh, or pick up a workout saved earlier. Skipped
 * entirely when nothing has been saved yet.
 */
export const TemplateLoader = () => {
  const { templates, applyTemplate, goToPhase, exerciseById } = useWorkoutState()
  const now = useMemo(() => Date.now(), [])

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Ready to train?</h1>
        <p className="screen__subtitle">
          {templates.length > 0
            ? 'Start fresh, or load a workout you saved before.'
            : 'Let’s build your workout.'}
        </p>
      </header>

      <button
        type="button"
        className="button button--primary button--large"
        onClick={() => goToPhase('equipment')}
      >
        Start fresh
      </button>

      {templates.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">Saved workouts</h2>
          <ul className="template-list">
            {templates.map((template) => {
              const names = template.exercises
                .map((item) => exerciseById(item.exerciseId)?.name)
                .filter(Boolean)
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    className="template"
                    onClick={() => applyTemplate(template)}
                  >
                    <span className="template__name">{template.name}</span>
                    <span className="template__meta">
                      {template.exercises.length} exercise
                      {template.exercises.length === 1 ? '' : 's'} · saved{' '}
                      {relativeTime(template.createdAt, now)}
                    </span>
                    <span className="template__exercises">{names.join(' · ')}</span>
                    {template.notes && <span className="template__notes">{template.notes}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </section>
  )
}

/** Shown on the summary screen; keeps the save form next to the workout. */
export const templatePrescription = describePrescription
