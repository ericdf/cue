import { isSpecificRequirement, type Exercise, type EquipmentRequirement } from '../types/exercise'

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
