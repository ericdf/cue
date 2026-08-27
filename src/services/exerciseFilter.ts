import { isSpecificRequirement, type Exercise, type EquipmentRequirement } from '../types/exercise'
import type { EquipmentData } from '../types/equipment'

export type Selection = Record<string, string[]>

/** A category counts as available when the user picked at least one item in it. */
export const hasCategory = (selection: Selection, categoryId: string): boolean =>
  (selection[categoryId]?.length ?? 0) > 0

/** Whether the user declared one exact piece of equipment. */
export const hasSpecific = (selection: Selection, equipmentId: string): boolean =>
  Object.values(selection).some((items) => items.includes(equipmentId))

/**
 * A category requirement is met by any item in that category; a specific
 * requirement needs that exact item (a pillow will not do when a mat is named).
 */
export const meetsRequirement = (
  requirement: EquipmentRequirement,
  selection: Selection,
): boolean =>
  isSpecificRequirement(requirement)
    ? hasSpecific(selection, requirement.equipmentId)
    : hasCategory(selection, requirement.categoryId)

export const hasAllRequiredEquipment = (exercise: Exercise, selection: Selection): boolean =>
  exercise.requiredEquipment.every((req) => meetsRequirement(req, selection))

export const matchesTargets = (exercise: Exercise, targets: string[]): boolean =>
  targets.length === 0 || exercise.targetMuscles.some((target) => targets.includes(target))

/** Exercises the user can actually do, matching at least one selected target. */
export const filterExercises = (
  exercises: Exercise[],
  selection: Selection,
  targets: string[],
): Exercise[] =>
  exercises
    .filter((exercise) => hasAllRequiredEquipment(exercise, selection))
    .filter((exercise) => matchesTargets(exercise, targets))
    .sort((a, b) => {
      // Rank by how many selected targets an exercise hits; MVP stand-in for a
      // real relevance model. Alphabetical breaks ties so ordering is stable.
      const score = (e: Exercise) => e.targetMuscles.filter((t) => targets.includes(t)).length
      return score(b) - score(a) || a.name.localeCompare(b.name)
    })

/** Every target that appears anywhere in the catalog, for the target picker. */
export const allTargets = (exercises: Exercise[]): string[] =>
  [...new Set(exercises.flatMap((exercise) => exercise.targetMuscles))].sort()

export interface RequirementStatus {
  /** e.g. "Suspension Trainer @ Mid Height" */
  label: string
  /** Whether the user declared something that satisfies this requirement. */
  satisfied: boolean
  /** Which of the user's items covers it, for the "(has: Pillow)" hint. */
  satisfiedBy?: string
  optional: boolean
  note?: string
}

export interface MissingEquipmentSummary {
  categoryId: string
  unlockedCount: number
  exercises: Exercise[]
}

/**
 * Exercises excluded purely for missing gear, grouped by the category that blocked
 * them. Powers the post-workout "consider adding this to your gym" list.
 */
export const missingEquipmentOpportunities = (
  exercises: Exercise[],
  selection: Selection,
): MissingEquipmentSummary[] => {
  const grouped = new Map<string, Exercise[]>()

  for (const exercise of exercises) {
    if (hasAllRequiredEquipment(exercise, selection)) continue
    const missing = exercise.requiredEquipment.filter(
      (req) => !meetsRequirement(req, selection),
    )
    // Attribute the exercise to each category still standing in its way.
    for (const req of missing) {
      const list = grouped.get(req.categoryId) ?? []
      list.push(exercise)
      grouped.set(req.categoryId, list)
    }
  }

  return [...grouped.entries()]
    .map(([categoryId, list]) => ({
      categoryId,
      unlockedCount: list.length,
      exercises: list,
    }))
    .sort((a, b) => b.unlockedCount - a.unlockedCount)
}

/**
 * Describes each piece of equipment an exercise needs, and whether the user has
 * it, for the sequence screen's per-exercise detail.
 */
export const describeRequirements = (
  exercise: Exercise,
  selection: Selection,
  data: EquipmentData,
): RequirementStatus[] => {
  const categoryName = (categoryId: string) =>
    data.categories.find((category) => category.id === categoryId)?.name ?? categoryId
  const itemName = (equipmentId: string) =>
    data.equipment.find((item) => item.id === equipmentId)?.name ?? equipmentId
  const configName = (categoryId: string, configurationId: string) => {
    const owner = data.equipment.find(
      (item) => item.category === categoryId && item.configurations?.length,
    )
    return owner?.configurations?.find((c) => c.id === configurationId)?.name ?? configurationId
  }

  const describe = (requirement: EquipmentRequirement, optional: boolean): RequirementStatus => {
    const satisfied = meetsRequirement(requirement, selection)
    const base = isSpecificRequirement(requirement)
      ? itemName(requirement.equipmentId)
      : categoryName(requirement.categoryId)
    const label = requirement.configurationId
      ? `${base} @ ${configName(requirement.categoryId, requirement.configurationId)}`
      : base

    // For a category requirement, name the item the user actually has.
    const owned = selection[requirement.categoryId]?.[0]
    return {
      label,
      satisfied,
      satisfiedBy:
        satisfied && !isSpecificRequirement(requirement) && owned ? itemName(owned) : undefined,
      optional,
      note: requirement.note,
    }
  }

  return [
    ...exercise.requiredEquipment.map((requirement) => describe(requirement, false)),
    ...(exercise.optionalEquipment ?? []).map((requirement) => describe(requirement, true)),
  ]
}
