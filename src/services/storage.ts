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

/**
 * Equipment ids and the handheld-weight category were renamed when the 8 lb
 * assumption was dropped. Anyone who selected equipment before that has stale
 * ids in localStorage, so map them forward on read.
 */
const ID_MIGRATIONS: Record<string, string> = {
  'dumbbell-8': 'dumbbell',
  'medicine-ball-8': 'medicine-ball',
  'kettlebell-8': 'kettlebell',
  'laundry-jug': 'household-weight',
}
const CATEGORY_MIGRATIONS: Record<string, string> = {
  'handheld-weight-8lbs': 'handheld-weight',
}

export const loadSelectedEquipment = (): Record<string, string[]> => {
  const stored = safeRead<Record<string, string[]>>(EQUIPMENT_KEY, {})
  const migrated: Record<string, string[]> = {}

  for (const [categoryId, items] of Object.entries(stored)) {
    const category = CATEGORY_MIGRATIONS[categoryId] ?? categoryId
    const mapped = items.map((id) => ID_MIGRATIONS[id] ?? id)
    // A category may appear under both its old and new name; merge them.
    migrated[category] = [...new Set([...(migrated[category] ?? []), ...mapped])]
  }

  return migrated
}

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
