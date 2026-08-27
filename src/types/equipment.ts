export type SelectType = 'radio' | 'checkbox'

/** A height or tension setting that costs effort to change mid-workout. */
export interface EquipmentConfiguration {
  id: string
  name: string
  /** Relative effort to switch into this configuration; used by the sequence optimizer. */
  adjustmentCost: number
}

export interface Equipment {
  id: string
  name: string
  category: string
  description?: string
  selectType?: 'single' | 'multiple'
  configurations?: EquipmentConfiguration[]
}

export interface EquipmentCategory {
  id: string
  name: string
  description?: string
  /** radio = pick one item you own; checkbox = own it or not. */
  selectType: SelectType
}

export interface EquipmentData {
  categories: EquipmentCategory[]
  equipment: Equipment[]
}
