interface Props {
  prescription: string
  set: number
  sets: number
  onDone: () => void
}

/**
 * Rep-based work: the app stays quiet while the user counts aloud, and waits for
 * "done". The button is the fallback when speech recognition isn't available.
 */
export const RepCounter = ({ prescription, set, sets, onDone }: Props) => (
  <div className="rep-counter">
    <p className="rep-counter__prescription">{prescription}</p>
    <p className="rep-counter__hint">
      {sets > 1 ? `Set ${set} of ${sets}. ` : ''}Say “done” when you finish the set.
    </p>
    <button type="button" className="button button--primary button--large" onClick={onDone}>
      Done
    </button>
  </div>
)
