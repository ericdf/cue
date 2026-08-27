# Cue: Claude Code Development Notes

## Overview

Cue is a voice-driven workout companion with three distinct phases:
- **Phase 1 (Pre-Workout):** Screen-only. Select equipment, targets, exercises. Customize reps/sets. Load saved templates.
- **Phase 2 (Workout):** Voice-only. Setup audio, voice commands (context-inferred), rep counting, timing.
- **Phase 3 (Post-Workout):** Screen-only. Summary, rating, excluded equipment, save/load workout templates.

See **[`docs/specification.md`](docs/specification.md)** for the complete technical specification.

## Quick Start for Claude Code

1. Read [`docs/specification.md`](docs/specification.md) fully
2. Understand the phase model:
   - **Phase 1 = Screen UI** (no voice)
   - **Phase 2 = Voice Only** (minimal screen)
   - **Phase 3 = Screen UI** (no voice)
3. Build components in order:
   - Phase 1: Equipment, targets, exercise selection, reps/sets customization, sequence optimization, template loader
   - Phase 2: Setup, voice control, rep/timing, transitions
   - Phase 3: Summary, rating, excluded equipment, save/load templates
4. Follow the **Component Checklist** in the spec
5. Test on mobile (iOS + Android)

## Key Architecture Points

- **Framework:** React + TypeScript + Vite
- **Hosting:** GitHub Pages, `/cue/` subdirectory
- **Production URL:** https://ericdf.github.io/cue/
- **Data:** JSON files in `public/data/` (equipment.json, exercises.json)
- **Voice (Phase 2 only):** Web Speech API (synthesis + recognition), TTS fallback
- **Screen Wake:** WakeLock API prevents sleep during Phase 2
- **Storage:** localStorage for equipment selection + saved workout templates

## Phase Model

### Phase 1: Pre-Workout (Screen Only)
- Equipment selector (radio/checkbox)
- Target muscle group selector (multiselect)
- Exercise recommender (filter by targets + equipment)
- Reps/sets customizer per exercise
- Sequence optimizer (minimize equipment transitions)
- Template loader (load saved workouts, adjust reps/sets for today)
- Start workout confirmation

### Phase 2: Workout (Voice Only)
- Setup instructions (audio)
- Voice command listener: "next", "repeat", "skip", "done"
- Context-inferred skip (skip setup, skip exercise, skip set)
- Rep counter (user counts, system listens)
- Timed holds (system counts down)
- Rest periods (auto or skip)
- Transition alerts (equipment changes)
- WakeLock enabled (screen stays on)

### Phase 3: Post-Workout (Screen Only)
- Workout summary (exercises, times, skipped)
- 1–5 star rating UI
- Excluded equipment suggestions
- Save template: prompt for name, save to localStorage
- Template info display (exercises, reps, date)

## Voice Interaction (Phase 2 Only)

**Commands (context-inferred):**
- "Next" → Skip setup / Skip exercise / Skip rest (depending on current phase)
- "Repeat" → Replay setup audio
- "Done" → Finish rep counting / timed hold early
- "Skip" → Skip setup / Skip exercise / Skip remaining sets

**No simultaneous audio playback.** Sequential: system speaks → system listens → user speaks → system processes.

## Data / Storage

### localStorage Keys
```
equipment-selected          → user's current equipment (radio/checkbox choices)
workout-templates          → saved workout templates (JSON array)
```

### Saved Template Structure
```json
{
  "name": "Swimming Dryland - Balance Focus",
  "exercises": [
    { "exerciseId": "bird-dog", "reps": 8, "sets": 2 },
    { "exerciseId": "half-moon-hinge", "reps": 6, "sets": 2 }
  ],
  "createdAt": 1693046400000,
  "notes": "Great balance work"
}
```

## File Structure

```
cue/
├── docs/specification.md       ← Full spec (read this first)
├── CLAUDE.md                   ← You are here
├── src/
│   ├── components/
│   │   ├── PreWorkout/         ← Phase 1 screens
│   │   ├── Workout/            ← Phase 2 (voice)
│   │   └── PostWorkout/        ← Phase 3 screens
│   ├── hooks/
│   │   ├── useVoiceRecognition
│   │   ├── useVoiceSynthesis
│   │   ├── useWakeLock
│   │   └── useWorkoutState
│   ├── services/
│   │   ├── storage.ts
│   │   └── templateManager.ts
│   └── types/
│       ├── template.ts
│       └── ...
├── public/
│   ├── data/
│   │   ├── equipment.json
│   │   └── exercises.json
│   └── images/
├── vite.config.ts
└── package.json
```

## Build & Deploy

```bash
npm run build
git add dist/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Deploys to: https://ericdf.github.io/cue/

## Component Checklist

See **Component Checklist** section in `docs/specification.md` for full list.

**Key difference from previous projects:**
- Phase 1 & 3 are screen-heavy (forms, cards, buttons)
- Phase 2 is minimal screen, voice-driven (listening, speaking, counting)
- Voice is only active during Phase 2; Phase 1 and 3 have zero voice interaction

## Testing Priority

1. **Mobile first** (iOS Safari, Android Chrome)
2. Phase 1: Equipment/target selection, template loading, reps/sets customization
3. Phase 2: Setup audio, voice commands, timers
4. Phase 3: Summary, save/load templates
5. WakeLock (keep screen on during Phase 2)

## Notes for Claude Code

- Read the spec thoroughly before starting
- Each phase is distinct; plan component boundaries accordingly
- localStorage is your only persistence mechanism (no server/API)
- Voice is Phase 2 only; don't add voice to Phase 1 or Phase 3
- Test on real mobile devices (simulator doesn't always reflect real behavior)

---

**Production URL:** https://ericdf.github.io/cue/

Update README.md with this once deployed.
