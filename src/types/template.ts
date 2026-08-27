/** One exercise inside a saved template, with the user's own numbers. */
export interface TemplateExercise {
  exerciseId: string
  /** Absent for timed holds. */
  reps?: number
  sets: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  exercises: TemplateExercise[]
  createdAt: number
  notes?: string
}
