import type { Equipment, EquipmentData } from '../types/equipment'
import type { Exercise } from '../types/exercise'

/**
 * A stable description of the equipment an exercise is set up on, e.g.
 * "suspension-trainer:mid-height|padded-knee-surface". Two exercises sharing a
 * key need no reconfiguration between them.
 */
export const configKey = (exercise: Exercise): string =>
  exercise.requiredEquipment
    .map((req) => (req.configurationId ? `${req.categoryId}:${req.configurationId}` : req.categoryId))
    .sort()
    .join('|') || 'none'

const configurationCost = (
  equipment: Equipment[],
  categoryId: string,
  configurationId: string,
): number => {
  const item = equipment.find(
    (candidate) => candidate.category === categoryId && candidate.configurations?.length,
  )
  const config = item?.configurations?.find((candidate) => candidate.id === configurationId)
  // Unknown configurations still cost something — an unlisted adjustment is
  // still an adjustment.
  return config?.adjustmentCost ?? 2
}

/**
 * Effort to go from one exercise's setup to the next: adjusting an adjustable
 * piece costs its listed adjustmentCost, and bringing out or putting away a
 * piece of gear costs a flat 1.
 */
export const transitionCost = (from: Exercise, to: Exercise, data: EquipmentData): number => {
  if (configKey(from) === configKey(to)) return 0

  const fromConfigs = new Map(from.requiredEquipment.map((r) => [r.categoryId, r.configurationId]))
  const toConfigs = new Map(to.requiredEquipment.map((r) => [r.categoryId, r.configurationId]))
  let cost = 0

  for (const [categoryId, configurationId] of toConfigs) {
    if (!fromConfigs.has(categoryId)) {
      // New piece of gear to set up.
      cost += configurationId
        ? configurationCost(data.equipment, categoryId, configurationId)
        : 1
    } else if (fromConfigs.get(categoryId) !== configurationId && configurationId) {
      // Same gear, different setting — this is the expensive case.
      cost += configurationCost(data.equipment, categoryId, configurationId)
    }
  }

  // Gear that has to come out of the way.
  for (const categoryId of fromConfigs.keys()) {
    if (!toConfigs.has(categoryId)) cost += 1
  }

  return cost
}

const totalCost = (order: Exercise[], data: EquipmentData): number =>
  order.reduce(
    (sum, exercise, index) =>
      index === 0 ? 0 : sum + transitionCost(order[index - 1], exercise, data),
    0,
  )

/**
 * Reorder to minimize total setup churn. Typical workouts are 3–7 exercises, so
 * we brute-force every permutation up to 7 and fall back to a greedy
 * nearest-neighbour pass beyond that.
 */
export const optimizeSequence = (exercises: Exercise[], data: EquipmentData): Exercise[] => {
  if (exercises.length < 3) return [...exercises]
  return exercises.length <= 7
    ? bruteForce(exercises, data)
    : greedy(exercises, data)
}

const bruteForce = (exercises: Exercise[], data: EquipmentData): Exercise[] => {
  let best = [...exercises]
  let bestCost = totalCost(best, data)

  const permute = (remaining: Exercise[], current: Exercise[]): void => {
    if (remaining.length === 0) {
      const cost = totalCost(current, data)
      if (cost < bestCost) {
        bestCost = cost
        best = [...current]
      }
      return
    }
    for (let i = 0; i < remaining.length; i += 1) {
      const next = remaining[i]
      permute([...remaining.slice(0, i), ...remaining.slice(i + 1)], [...current, next])
    }
  }

  permute(exercises, [])
  return best
}

const greedy = (exercises: Exercise[], data: EquipmentData): Exercise[] => {
  const remaining = [...exercises]
  const order = [remaining.shift() as Exercise]

  while (remaining.length > 0) {
    const last = order[order.length - 1]
    let bestIndex = 0
    let bestCost = Infinity
    remaining.forEach((candidate, index) => {
      const cost = transitionCost(last, candidate, data)
      if (cost < bestCost) {
        bestCost = cost
        bestIndex = index
      }
    })
    order.push(remaining.splice(bestIndex, 1)[0])
  }

  return order
}

/**
 * A spoken instruction for the gear change before an exercise, or null when the
 * setup is unchanged from the previous one.
 */
export const transitionNote = (
  from: Exercise | undefined,
  to: Exercise,
  data: EquipmentData,
): string | null => {
  if (!from) return null
  if (configKey(from) === configKey(to)) return null

  const categoryName = (categoryId: string) =>
    data.categories.find((c) => c.id === categoryId)?.name ?? categoryId
  const configName = (categoryId: string, configurationId: string) => {
    const item = data.equipment.find(
      (candidate) => candidate.category === categoryId && candidate.configurations?.length,
    )
    return item?.configurations?.find((c) => c.id === configurationId)?.name ?? configurationId
  }

  const fromConfigs = new Map(from.requiredEquipment.map((r) => [r.categoryId, r.configurationId]))
  const toConfigs = new Map(to.requiredEquipment.map((r) => [r.categoryId, r.configurationId]))
  const notes: string[] = []

  for (const [categoryId, configurationId] of toConfigs) {
    if (!fromConfigs.has(categoryId)) {
      notes.push(
        configurationId
          ? `Set up your ${categoryName(categoryId)} at ${configName(categoryId, configurationId)}`
          : `Get your ${categoryName(categoryId)} ready`,
      )
    } else if (fromConfigs.get(categoryId) !== configurationId && configurationId) {
      notes.push(`Adjust your ${categoryName(categoryId)} to ${configName(categoryId, configurationId)}`)
    }
  }

  for (const categoryId of fromConfigs.keys()) {
    if (!toConfigs.has(categoryId)) notes.push(`Set aside your ${categoryName(categoryId)}`)
  }

  return notes.length > 0 ? `${notes.join('. ')}.` : null
}

export const sequenceCost = totalCost
