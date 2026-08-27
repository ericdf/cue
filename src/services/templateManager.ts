import type { WorkoutTemplate } from '../types/template'

const TEMPLATES_KEY = 'workout-templates'

const safeRead = (): Record<string, WorkoutTemplate> => {
  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, WorkoutTemplate>) : {}
  } catch {
    return {}
  }
}

const safeWrite = (templates: Record<string, WorkoutTemplate>): void => {
  try {
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  } catch {
    // Storage unavailable or full — saving is best-effort.
  }
}

/** Newest first, so the most recently saved workout is easiest to reach. */
export const listTemplates = (): WorkoutTemplate[] =>
  Object.values(safeRead()).sort((a, b) => b.createdAt - a.createdAt)

export const loadTemplate = (templateId: string): WorkoutTemplate | undefined =>
  safeRead()[templateId]

export const saveTemplate = (
  template: Omit<WorkoutTemplate, 'id' | 'createdAt'>,
  createdAt: number,
): WorkoutTemplate => {
  const templates = safeRead()
  // Loading a template and saving again creates a new one, per the spec: the
  // original is never modified in place.
  const id = `template-${createdAt}-${Object.keys(templates).length}`
  const saved: WorkoutTemplate = { ...template, id, createdAt }
  templates[id] = saved
  safeWrite(templates)
  return saved
}

export const deleteTemplate = (templateId: string): void => {
  const templates = safeRead()
  delete templates[templateId]
  safeWrite(templates)
}

/** "2 days ago" style label for the template list. */
export const relativeTime = (timestamp: number, now: number): string => {
  const days = Math.floor((now - timestamp) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  return months <= 1 ? '1 month ago' : `${months} months ago`
}
