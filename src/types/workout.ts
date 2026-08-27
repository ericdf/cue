import type { Exercise } from './exercise'

export type Phase = 'equipment' | 'targets' | 'exercises' | 'sequence' | 'workout' | 'summary'

export type ExerciseStatus = 'pending' | 'in-progress' | 'completed' | 'skipped'

export interface SequenceEntry {
  exerciseId: string
  position: number
  status: ExerciseStatus
  completedAt?: number
  notes?: string
  /** Human-readable equipment change to announce before this exercise. */
  transitionNote?: string
}

export interface WorkoutFeedback {
  rating: number
  notes?: string
  completedAt: number
}

export interface WorkoutState {
  /** categoryId -> selected equipment ids. */
  equipmentSelected: Record<string, string[]>
  targetFocus: string[]
  exerciseSequence: SequenceEntry[]
  currentExerciseIndex: number
  startTime: number | null
  workoutComplete: boolean
  feedback?: WorkoutFeedback
}

export type VoiceCommandName = 'next' | 'repeat' | 'done' | 'skip' | 'start' | 'pause'

export interface VoiceCommand {
  command: VoiceCommandName
  confidence: number
  transcript: string
}

/** One completed workout, as stored in localStorage history. */
export interface WorkoutHistoryEntry {
  startedAt: number
  completedAt: number
  durationMs: number
  targetFocus: string[]
  exercises: { exerciseId: string; name: string; status: ExerciseStatus }[]
  feedback?: WorkoutFeedback
}

export interface ExerciseWithConfig {
  exercise: Exercise
  /** Stable key describing the equipment setup, e.g. "suspension-trainer:mid-height". */
  configKey: string
}
