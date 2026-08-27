import type { WorkoutHistoryEntry } from '../types/workout'

const EQUIPMENT_KEY = 'equipment-selected'
const HISTORY_KEY = 'workout-history'

/** localStorage throws in private mode and some embedded browsers; never let that break a workout. */
const safeRead = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const safeWrite = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable or full — the session still works, it just won't persist.
  }
}

export const loadSelectedEquipment = (): Record<string, string[]> =>
  safeRead<Record<string, string[]>>(EQUIPMENT_KEY, {})

export const saveSelectedEquipment = (selection: Record<string, string[]>): void =>
  safeWrite(EQUIPMENT_KEY, selection)

export const loadHistory = (): WorkoutHistoryEntry[] =>
  safeRead<WorkoutHistoryEntry[]>(HISTORY_KEY, [])

export const appendHistory = (entry: WorkoutHistoryEntry): void => {
  const history = loadHistory()
  history.push(entry)
  // Keep the tail; unbounded growth would eventually hit the storage quota.
  safeWrite(HISTORY_KEY, history.slice(-50))
}
