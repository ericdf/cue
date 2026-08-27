export interface EquipmentRequirement {
  categoryId: string
  /** Optional specific configuration, e.g. "mid-height" for a suspension trainer. */
  configurationId?: string
  note?: string
}

export interface ExerciseMedia {
  image: string | null
  audio: string | null
  video: string | null
}

export interface ExerciseInstructions {
  text: string
  /** Present for rep-based exercises, e.g. "6 repetitions on each side". */
  reps?: string
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
