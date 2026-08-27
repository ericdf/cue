import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { EquipmentData } from '../types/equipment'
import type { Exercise } from '../types/exercise'
import type { ExerciseStatus, Phase, SequenceEntry, WorkoutFeedback } from '../types/workout'
import { loadAll } from '../services/dataLoader'
import { appendHistory, loadSelectedEquipment, saveSelectedEquipment } from '../services/storage'
import { optimizeSequence, transitionNote } from '../services/sequenceOptimizer'
import { listTemplates, saveTemplate } from '../services/templateManager'
import type { WorkoutTemplate } from '../types/template'

interface WorkoutContextValue {
  loading: boolean
  loadError: string | null
  equipmentData: EquipmentData | null
  exercises: Exercise[]

  phase: Phase
  goToPhase: (phase: Phase) => void

  equipmentSelected: Record<string, string[]>
  toggleEquipment: (categoryId: string, equipmentId: string, single: boolean) => void

  targetFocus: string[]
  toggleTarget: (target: string) => void

  selectedExerciseIds: string[]
  toggleExercise: (exerciseId: string) => void

  sequence: SequenceEntry[]
  buildSequence: () => void
  reorderSequence: (from: number, to: number) => void
  customizeEntry: (exerciseId: string, changes: { reps?: number; sets?: number }) => void

  templates: WorkoutTemplate[]
  refreshTemplates: () => void
  applyTemplate: (template: WorkoutTemplate) => void
  saveCurrentAsTemplate: (name: string, notes?: string) => void
  savedTemplateName: string | null

  currentExerciseIndex: number
  currentEntry: SequenceEntry | null
  currentExercise: Exercise | null
  /** Advance one set; completes the exercise when the last set is done. */
  completeSet: () => void
  exerciseById: (id: string) => Exercise | undefined

  startTime: number | null
  startWorkout: () => void
  completeCurrent: (status: Extract<ExerciseStatus, 'completed' | 'skipped'>) => void
  finishWorkout: () => void
  submitFeedback: (feedback: Omit<WorkoutFeedback, 'completedAt'>) => void
  feedback: WorkoutFeedback | undefined
  resetWorkout: () => void
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [equipmentData, setEquipmentData] = useState<EquipmentData | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])

  // With no saved templates there is nothing to choose between, so go straight
  // to equipment selection.
  const [phase, setPhase] = useState<Phase>(() =>
    listTemplates().length > 0 ? 'start' : 'equipment',
  )
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => listTemplates())
  const [savedTemplateName, setSavedTemplateName] = useState<string | null>(null)
  const [equipmentSelected, setEquipmentSelected] = useState<Record<string, string[]>>(() =>
    loadSelectedEquipment(),
  )
  const [targetFocus, setTargetFocus] = useState<string[]>([])
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const [sequence, setSequence] = useState<SequenceEntry[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<WorkoutFeedback | undefined>()

  useEffect(() => {
    loadAll()
      .then(({ equipment, exercises: loadedExercises }) => {
        setEquipmentData(equipment)
        setExercises(loadedExercises)
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Failed to load workout data')
      })
      .finally(() => setLoading(false))
  }, [])

  // Equipment selection is the one thing worth remembering between sessions.
  useEffect(() => {
    saveSelectedEquipment(equipmentSelected)
  }, [equipmentSelected])

  const toggleEquipment = useCallback(
    (categoryId: string, equipmentId: string, single: boolean) => {
      setEquipmentSelected((previous) => {
        const current = previous[categoryId] ?? []
        if (current.includes(equipmentId)) {
          return { ...previous, [categoryId]: current.filter((id) => id !== equipmentId) }
        }
        // Radio categories hold one item; checkbox categories accumulate.
        return { ...previous, [categoryId]: single ? [equipmentId] : [...current, equipmentId] }
      })
    },
    [],
  )

  const toggleTarget = useCallback((target: string) => {
    setTargetFocus((previous) =>
      previous.includes(target) ? previous.filter((t) => t !== target) : [...previous, target],
    )
  }, [])

  const toggleExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseIds((previous) =>
      previous.includes(exerciseId)
        ? previous.filter((id) => id !== exerciseId)
        : [...previous, exerciseId],
    )
  }, [])

  const exerciseById = useCallback(
    (id: string) => exercises.find((exercise) => exercise.id === id),
    [exercises],
  )

  /** Annotate an ordered exercise list with the gear change before each entry. */
  const toEntries = useCallback(
    (ordered: Exercise[], data: EquipmentData, previous: SequenceEntry[] = []): SequenceEntry[] =>
      ordered.map((exercise, index) => {
        // Preserve any numbers the user already customized for this exercise.
        const existing = previous.find((entry) => entry.exerciseId === exercise.id)
        return {
          exerciseId: exercise.id,
          position: index,
          status: 'pending' as const,
          transitionNote: transitionNote(ordered[index - 1], exercise, data) ?? undefined,
          reps: existing?.reps ?? exercise.instructions.reps,
          sets: existing?.sets ?? exercise.instructions.sets ?? 2,
          setsCompleted: 0,
        }
      }),
    [],
  )

  const buildSequence = useCallback(() => {
    if (!equipmentData) return
    const chosen = selectedExerciseIds
      .map((id) => exercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
    const ordered = optimizeSequence(chosen, equipmentData)
    setSequence((previous) => toEntries(ordered, equipmentData, previous))
  }, [equipmentData, exercises, selectedExerciseIds, toEntries])

  const reorderSequence = useCallback(
    (from: number, to: number) => {
      if (!equipmentData) return
      setSequence((previous) => {
        if (to < 0 || to >= previous.length) return previous
        const reordered = [...previous]
        const [moved] = reordered.splice(from, 1)
        reordered.splice(to, 0, moved)
        // Transition notes describe neighbours, so they're recomputed after a move.
        const asExercises = reordered
          .map((entry) => exercises.find((exercise) => exercise.id === entry.exerciseId))
          .filter((exercise): exercise is Exercise => Boolean(exercise))
        return toEntries(asExercises, equipmentData, previous)
      })
    },
    [equipmentData, exercises, toEntries],
  )

  const customizeEntry = useCallback(
    (exerciseId: string, changes: { reps?: number; sets?: number }) => {
      setSequence((previous) =>
        previous.map((entry) =>
          entry.exerciseId === exerciseId
            ? {
                ...entry,
                // Clamp so the workout can never be zero-length or absurd.
                ...(changes.reps !== undefined
                  ? { reps: Math.max(1, Math.min(99, changes.reps)) }
                  : {}),
                ...(changes.sets !== undefined
                  ? { sets: Math.max(1, Math.min(10, changes.sets)) }
                  : {}),
              }
            : entry,
        ),
      )
    },
    [],
  )

  const refreshTemplates = useCallback(() => setTemplates(listTemplates()), [])

  /** Load a saved template: its exercises and the numbers saved with them. */
  const applyTemplate = useCallback(
    (template: WorkoutTemplate) => {
      if (!equipmentData) return
      const ordered = template.exercises
        .map((item) => exercises.find((exercise) => exercise.id === item.exerciseId))
        .filter((exercise): exercise is Exercise => Boolean(exercise))

      setSelectedExerciseIds(ordered.map((exercise) => exercise.id))
      // Keep the template's saved order rather than re-optimizing it.
      setSequence(
        ordered.map((exercise, index) => {
          const saved = template.exercises.find((item) => item.exerciseId === exercise.id)
          return {
            exerciseId: exercise.id,
            position: index,
            status: 'pending' as const,
            transitionNote:
              transitionNote(ordered[index - 1], exercise, equipmentData) ?? undefined,
            reps: saved?.reps ?? exercise.instructions.reps,
            sets: saved?.sets ?? exercise.instructions.sets ?? 2,
            setsCompleted: 0,
          }
        }),
      )
      setPhase('customize')
    },
    [equipmentData, exercises],
  )

  const startWorkout = useCallback(() => {
    setStartTime(Date.now())
    setCurrentExerciseIndex(0)
    setSequence((previous) =>
      previous.map((entry, index) => ({
        ...entry,
        status: index === 0 ? 'in-progress' : 'pending',
        setsCompleted: 0,
      })),
    )
    setPhase('workout')
  }, [])

  const currentEntry = sequence[currentExerciseIndex] ?? null
  const currentExercise = currentEntry ? exerciseById(currentEntry.exerciseId) ?? null : null

  const finishWorkout = useCallback(() => {
    setPhase('summary')
  }, [])

  const completeCurrent = useCallback(
    (status: Extract<ExerciseStatus, 'completed' | 'skipped'>) => {
      setSequence((previous) =>
        previous.map((entry, index) =>
          index === currentExerciseIndex
            ? { ...entry, status, completedAt: Date.now() }
            : index === currentExerciseIndex + 1
              ? { ...entry, status: 'in-progress' }
              : entry,
        ),
      )
      if (currentExerciseIndex + 1 >= sequence.length) {
        finishWorkout()
      } else {
        setCurrentExerciseIndex((index) => index + 1)
      }
    },
    [currentExerciseIndex, sequence.length, finishWorkout],
  )

  /**
   * Marks one set done. Returns the exercise to the caller unchanged until the
   * final set, at which point the exercise itself completes.
   */
  const completeSet = useCallback(() => {
    setSequence((previous) =>
      previous.map((entry, index) =>
        index === currentExerciseIndex
          ? { ...entry, setsCompleted: entry.setsCompleted + 1 }
          : entry,
      ),
    )
  }, [currentExerciseIndex])

  const saveCurrentAsTemplate = useCallback(
    (name: string, notes?: string) => {
      const saved = saveTemplate(
        {
          name,
          notes,
          exercises: sequence.map((entry) => ({
            exerciseId: entry.exerciseId,
            reps: entry.reps,
            sets: entry.sets,
          })),
        },
        Date.now(),
      )
      setTemplates(listTemplates())
      setSavedTemplateName(saved.name)
    },
    [sequence],
  )

  const submitFeedback = useCallback(
    (partial: Omit<WorkoutFeedback, 'completedAt'>) => {
      const completedAt = Date.now()
      const entry: WorkoutFeedback = { ...partial, completedAt }
      setFeedback(entry)
      appendHistory({
        startedAt: startTime ?? completedAt,
        completedAt,
        durationMs: completedAt - (startTime ?? completedAt),
        targetFocus,
        exercises: sequence.map((item) => ({
          exerciseId: item.exerciseId,
          name: exerciseById(item.exerciseId)?.name ?? item.exerciseId,
          status: item.status,
        })),
        feedback: entry,
      })
    },
    [startTime, targetFocus, sequence, exerciseById],
  )

  const resetWorkout = useCallback(() => {
    setTargetFocus([])
    setSelectedExerciseIds([])
    setSequence([])
    setCurrentExerciseIndex(0)
    setStartTime(null)
    setFeedback(undefined)
    setSavedTemplateName(null)
    const saved = listTemplates()
    setTemplates(saved)
    setPhase(saved.length > 0 ? 'start' : 'equipment')
  }, [])

  const value = useMemo<WorkoutContextValue>(
    () => ({
      loading,
      loadError,
      equipmentData,
      exercises,
      phase,
      goToPhase: setPhase,
      equipmentSelected,
      toggleEquipment,
      targetFocus,
      toggleTarget,
      selectedExerciseIds,
      toggleExercise,
      sequence,
      buildSequence,
      reorderSequence,
      customizeEntry,
      templates,
      refreshTemplates,
      applyTemplate,
      saveCurrentAsTemplate,
      savedTemplateName,
      currentExerciseIndex,
      currentEntry,
      currentExercise,
      completeSet,
      exerciseById,
      startTime,
      startWorkout,
      completeCurrent,
      finishWorkout,
      submitFeedback,
      feedback,
      resetWorkout,
    }),
    [
      loading,
      loadError,
      equipmentData,
      exercises,
      phase,
      equipmentSelected,
      toggleEquipment,
      targetFocus,
      toggleTarget,
      selectedExerciseIds,
      toggleExercise,
      sequence,
      buildSequence,
      reorderSequence,
      customizeEntry,
      templates,
      refreshTemplates,
      applyTemplate,
      saveCurrentAsTemplate,
      savedTemplateName,
      currentExerciseIndex,
      currentEntry,
      currentExercise,
      completeSet,
      exerciseById,
      startTime,
      startWorkout,
      completeCurrent,
      finishWorkout,
      submitFeedback,
      feedback,
      resetWorkout,
    ],
  )

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
}

export const useWorkoutState = (): WorkoutContextValue => {
  const context = useContext(WorkoutContext)
  if (!context) throw new Error('useWorkoutState must be used inside a WorkoutProvider')
  return context
}
