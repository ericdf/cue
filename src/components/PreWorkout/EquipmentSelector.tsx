import { useWorkoutState } from '../../hooks/useWorkoutState'

interface Props {
  /** When set, the screen was opened from the confirmation step. */
  returnTo?: 'confirm'
}

export const EquipmentSelector = ({ returnTo }: Props) => {
  const { equipmentData, equipmentSelected, toggleEquipment, goToPhase } = useWorkoutState()
  if (!equipmentData) return null

  const selectedCount = Object.values(equipmentSelected).reduce(
    (total, items) => total + items.length,
    0,
  )

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>What equipment do you have?</h1>
        <p className="screen__subtitle">
          Check everything you own or can get to — you can pick more than one per group. We'll
          only suggest exercises you can actually do.
        </p>
      </header>

      {equipmentData.categories.map((category) => {
        const items = equipmentData.equipment.filter((item) => item.category === category.id)
        const selected = equipmentSelected[category.id] ?? []

        return (
          <fieldset key={category.id} className="option-group">
            <legend className="option-group__legend">
              {category.name}
              {category.description && (
                <span className="option-group__hint">{category.description}</span>
              )}
            </legend>
            <div className="option-grid">
              {items.map((item) => {
                const isSelected = selected.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => toggleEquipment(category.id, item.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                  >
                    <span className="option__check" aria-hidden="true">
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="option__text">
                      <span className="option__name">{item.name}</span>
                      {item.description && (
                        <span className="option__description">{item.description}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      <footer className="screen__footer screen__footer--sticky">
        <p className="screen__note">
          {selectedCount > 0
            ? `${selectedCount} item${selectedCount === 1 ? '' : 's'} saved to this device.`
            : 'No equipment? You can still continue: some exercises need nothing at all.'}
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => goToPhase(returnTo === 'confirm' ? 'confirm' : 'targets')}
        >
          {returnTo === 'confirm' ? 'Done' : 'Continue'}
        </button>
      </footer>
    </section>
  )
}
