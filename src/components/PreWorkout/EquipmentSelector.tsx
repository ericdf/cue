import { useWorkoutState } from '../../hooks/useWorkoutState'

export const EquipmentSelector = () => {
  const { equipmentData, equipmentSelected, toggleEquipment, goToPhase } = useWorkoutState()
  if (!equipmentData) return null

  const anySelected = Object.values(equipmentSelected).some((items) => items.length > 0)

  return (
    <section className="screen">
      <header className="screen__header">
        <h1>What equipment do you have?</h1>
        <p className="screen__subtitle">
          Pick what's within reach. We'll only suggest exercises you can actually do.
        </p>
      </header>

      {equipmentData.categories.map((category) => {
        const items = equipmentData.equipment.filter((item) => item.category === category.id)
        const selected = equipmentSelected[category.id] ?? []
        const single = category.selectType === 'radio'

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
                    onClick={() => toggleEquipment(category.id, item.id, single)}
                    aria-pressed={isSelected}
                  >
                    <span className="option__name">{item.name}</span>
                    {item.description && (
                      <span className="option__description">{item.description}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      <footer className="screen__footer">
        <p className="screen__note">
          {anySelected
            ? 'Saved to this device — you only pick this once.'
            : 'No equipment? You can still continue: some exercises need nothing at all.'}
        </p>
        <button type="button" className="button button--primary" onClick={() => goToPhase('targets')}>
          Continue
        </button>
      </footer>
    </section>
  )
}
