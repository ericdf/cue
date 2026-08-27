interface Props {
  reps: string
  onDone: () => void
}

/**
 * Rep-based work: the app stays quiet while the user counts aloud, and waits for
 * "done". The button is the fallback when speech recognition isn't available.
 */
export const RepCounter = ({ reps, onDone }: Props) => (
  <div className="rep-counter">
    <p className="rep-counter__prescription">{reps}</p>
    <p className="rep-counter__hint">Say “done” when you finish the set.</p>
    <button type="button" className="button button--primary button--large" onClick={onDone}>
      Done
    </button>
  </div>
)
