# Cue: Claude Code Development Notes

## Overview

Cue is a voice-driven workout companion. See **[`docs/specification.md`](docs/specification.md)** for the complete technical specification.

## Quick Start for Claude Code

1. Read [`docs/specification.md`](docs/specification.md) fully
2. Build components in order:
   - Pre-workout (equipment, targets, exercise selection, sequence optimization)
   - Workout (setup, reps, timing, voice control)
   - Post-workout (summary, excluded equipment, feedback)
3. Follow the **Component Checklist** in the spec
4. Test on mobile

## Key Architecture Points

- **Framework:** React + TypeScript + Vite
- **Hosting:** GitHub Pages, `/cue/` subdirectory
- **Data:** JSON files in `public/data/` (equipment.json, exercises.json)
- **Voice:** Web Speech API (recognition + synthesis), TTS fallback
- **Screen:** WakeLock API to prevent sleep during workout
- **Storage:** localStorage for equipment selection + workout history

## File Structure

```
cue/
├── docs/specification.md       ← READ THIS FIRST
├── CLAUDE.md                   ← You are here
├── src/
│   ├── components/             ← Build these (see spec checklist)
│   ├── hooks/
│   ├── services/
│   └── types/
├── public/
│   ├── data/
│   │   ├── equipment.json      ← Existing; may extend
│   │   └── exercises.json      ← Existing; may extend
│   └── images/                 ← Exercise images
└── vite.config.ts
```

## Data Ingest (for future PDF processing)

When Eric sends a PDF with new exercises:

1. Extract exercises (name, setup, instructions, reps, targets)
2. Analyze images for position, equipment, implied gear
3. Map equipment to existing categories in `equipment.json` or propose new ones
4. Generate JSON entries for `exercises.json`
5. Guide Eric to:
   - Save images to `public/images/{exercise-id}.jpg`
   - Record audio (optional) to `audio/{exercise-id}-setup.mp3`
   - Commit and push

## Key Hooks to Implement

- **`useVoiceRecognition`** — Web Speech API wrapper; emit commands ("next", "repeat", "done", "skip")
- **`useVoiceSynthesis`** — Play prerecorded audio or TTS; pause while listening
- **`useWakeLock`** — Request screen wake lock on workout start
- **`useWorkoutState`** — Global state (equipment, targets, current exercise, etc.)

## Voice Interaction Flow

```
Setup Audio (prerecorded or TTS)
  ↓
User listens (system is silent)
  ↓
User says "next" / "repeat" / "skip"
  ↓
System recognizes command, advances (or replays)
  ↓
[Repeat for next exercise]
```

**No simultaneous audio playback.** Sequential: speak → listen → command → speak.

## Vite Config

```typescript
export default {
  base: '/cue/',  // Subdirectory path
  build: {
    outDir: 'dist'
  }
}
```

## Production URL

https://ericdf.github.io/cue/

Update README.md with this URL at the top once deployed.

## Testing

- Test on real mobile device (iOS Safari, Android Chrome)
- Verify WakeLock works (screen stays on)
- Check voice recognition on iOS (provide on-screen fallback buttons)
- Confirm GitHub Pages deployment works

## Questions?

Refer to `docs/specification.md` for detailed sections on:
- Phase-by-phase flows (Pre-Workout, Workout, Post-Workout)
- Complete data schema (equipment.json, exercises.json)
- Component checklist with descriptions
- Sequence optimization algorithm
- Deployment process
- Known limitations and future enhancements
