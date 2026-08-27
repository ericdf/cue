import { useState } from 'react'
import { useWorkoutState } from '../../hooks/useWorkoutState'

/**
 * Offers to keep the workout — including this session's reps and sets — as a
 * reusable template. Saving always creates a new template; loading one never
 * modifies it.
 */
export const SaveTemplate = () => {
  const { sequence, saveCurrentAsTemplate, savedTemplateName, targetFocus } = useWorkoutState()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  if (savedTemplateName) {
    return (
      <p className="notice notice--success">Saved “{savedTemplateName}” — load it any time.</p>
    )
  }

  // A focus-based suggestion beats making the user think of a name.
  const suggestion =
    targetFocus.length > 0
      ? `${targetFocus.map((t) => t[0].toUpperCase() + t.slice(1)).join(' + ')} workout`
      : 'My workout'

  return (
    <section className="panel">
      <h2 className="panel__title">Save this workout?</h2>
      <p className="panel__subtitle">
        Keeps these {sequence.length} exercises with your reps and sets.
      </p>
      <input
        className="text-input"
        type="text"
        placeholder={suggestion}
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Template name"
      />
      <textarea
        className="text-input"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
      />
      <button
        type="button"
        className="button button--primary"
        onClick={() => saveCurrentAsTemplate(name.trim() || suggestion, notes.trim() || undefined)}
      >
        Save workout
      </button>
    </section>
  )
}
