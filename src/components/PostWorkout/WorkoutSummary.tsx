import { useState } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'
import { ExcludedEquipment } from './ExcludedEquipment'

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 1) return 'under a minute'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export const WorkoutSummary = () => {
  const { sequence, exerciseById, startTime, submitFeedback, feedback, resetWorkout } =
    useWorkoutState()

  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  const completed = sequence.filter((entry) => entry.status === 'completed')
  const skipped = sequence.filter((entry) => entry.status === 'skipped')
  const duration = startTime ? Date.now() - startTime : 0

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>Workout complete</h1>
        <p className="screen__subtitle">
          {completed.length} of {sequence.length} exercises · {formatDuration(duration)}
        </p>
      </header>

      <ul className="summary-list">
        {sequence.map((entry) => {
          const exercise = exerciseById(entry.exerciseId)
          if (!exercise) return null
          return (
            <li key={entry.exerciseId} className={`summary-item summary-item--${entry.status}`}>
              <span className="summary-item__mark" aria-hidden="true">
                {entry.status === 'completed' ? '✓' : entry.status === 'skipped' ? '–' : '·'}
              </span>
              <span className="summary-item__name">{exercise.name}</span>
              <span className="summary-item__status">{entry.status}</span>
            </li>
          )
        })}
      </ul>

      {skipped.length > 0 && (
        <p className="screen__note">
          {skipped.length} skipped — no problem, they'll come around again.
        </p>
      )}

      {feedback ? (
        <p className="notice notice--success">Thanks — saved to this device.</p>
      ) : (
        <section className="panel">
          <h2 className="panel__title">How was it?</h2>
          <div className="rating" role="group" aria-label="Rate this workout">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`rating__star${value <= rating ? ' is-active' : ''}`}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                aria-pressed={value <= rating}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="text-input"
            placeholder="Anything worth remembering? (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
          <button
            type="button"
            className="button button--primary"
            onClick={() => submitFeedback({ rating, notes: notes.trim() || undefined })}
            disabled={rating === 0}
          >
            Save feedback
          </button>
        </section>
      )}

      <ExcludedEquipment />

      <footer className="screen__footer">
        <button type="button" className="button button--primary" onClick={resetWorkout}>
          Start another workout
        </button>
      </footer>
    </section>
  )
}
