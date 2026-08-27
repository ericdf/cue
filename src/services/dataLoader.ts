import type { EquipmentData } from '../types/equipment'
import type { ExerciseData } from '../types/exercise'

/** Resolve a path against Vite's base so it works at /cue/ on GitHub Pages. */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(asset(path))
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export const loadEquipment = () => fetchJson<EquipmentData>('data/equipment.json')

export const loadExercises = () => fetchJson<ExerciseData>('data/exercises.json')

export const loadAll = async () => {
  const [equipment, exercises] = await Promise.all([loadEquipment(), loadExercises()])
  return { equipment: equipment, exercises: exercises.exercises }
}
