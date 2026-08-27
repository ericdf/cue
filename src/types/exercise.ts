/**
 * Most requirements are satisfied by any item in a category (a mat, pillow, or
 * towel all count as a padded surface). A few need one exact item.
 */
export interface CategoryRequirement {
  type?: 'category'
  categoryId: string
  /** Optional specific configuration, e.g. "mid-height" for a suspension trainer. */
  configurationId?: string
  note?: string
}

export interface SpecificRequirement {
  type: 'specific'
  equipmentId: string
  /** The category this item belongs to, for transition and display purposes. */
  categoryId: string
  configurationId?: string
  note?: string
}

export type EquipmentRequirement = CategoryRequirement | SpecificRequirement

export const isSpecificRequirement = (
  requirement: EquipmentRequirement,
): requirement is SpecificRequirement => requirement.type === 'specific'

export interface ExerciseMedia {
  image: string | null
  audio: string | null
  video: string | null
}

export interface ExerciseInstructions {
  text: string
  /** Rep count for rep-based exercises; absent on timed holds. */
  reps?: number
  /** When true, `reps` is per side and the total work is doubled. */
  repsPerSide?: boolean
  /** Default number of sets. The spec starts everyone at two. */
  sets?: number
  /** Present for timed holds; the app counts these down aloud. */
  durationSeconds?: number
}

export interface Exercise {
  id: string
  name: string
  description: string
  targetMuscles: string[]
  position: string
  requiredEquipment: EquipmentRequirement[]
  optionalEquipment: EquipmentRequirement[]
  setup: { text: string; audio?: string | null }
  instructions: ExerciseInstructions
  cues?: string
  notes?: string
  media: ExerciseMedia
}

export interface ExerciseData {
  exercises: Exercise[]
}

export const isTimedExercise = (exercise: Exercise): boolean =>
  typeof exercise.instructions.durationSeconds === 'number'

/** How an exercise's prescription reads on screen and aloud. */
export const describePrescription = (
  instructions: Pick<ExerciseInstructions, 'reps' | 'repsPerSide' | 'durationSeconds'>,
): string => {
  if (typeof instructions.durationSeconds === 'number') {
    return `${instructions.durationSeconds}-second hold`
  }
  if (typeof instructions.reps !== 'number') return ''
  const unit = instructions.reps === 1 ? 'rep' : 'reps'
  return instructions.repsPerSide
    ? `${instructions.reps} ${unit} each side`
    : `${instructions.reps} ${unit}`
}
