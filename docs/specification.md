# Cue: Voice-Driven Workout Companion
## Complete Technical Specification

---

## Executive Summary

**Cue** is a client-side React web app that guides workouts through a three-phase model:
- **Phase 1 (Pre-workout):** Screen-based planning — select equipment, targets, exercises, customize reps/sets
- **Phase 2 (Workout):** Voice-driven execution — setup instructions, rep counting, timing, voice commands
- **Phase 3 (Post-workout):** Screen-based feedback — summary, rating, excluded equipment, save/load workout templates

**Tech Stack:**
- React + TypeScript
- Web Speech API (synthesis + recognition, Phase 2 only)
- WakeLock API (prevent screen sleep during Phase 2)
- Vite (build)
- GitHub Pages (hosting at `https://ericdf.github.io/cue/`)
- localStorage (equipment selection, saved workout templates)

---

## Phase 1: Pre-Workout (Screen-Based Planning)

### 1.1 Equipment Declaration
User selects available equipment by checking all items they have. **All categories use checkboxes (multi-select).** Selections are cached to localStorage in real-time.

**Flow:**
1. Landing screen: "What equipment do you have today?"
2. Display all equipment categories from `data/equipment.json`
3. Each category shows checkboxes; user checks **all items they own/have access to**
4. As user selects items, **immediately save to localStorage** (no "save" button needed)
5. User can return to this screen anytime to adjust (useful when equipment changes by location)

**Example:**
```
Padded Surface for Floor Work:
  ☑ Mat
  ☑ Pillow
  ☐ Folded towel

Handheld Weights:
  ☑ Dumbbell
  ☑ Kettlebell
  ☐ Medicine ball
  ☑ Laundry jug
```

**Key behavior:**
- Selections persist across sessions (stored in localStorage with key `equipment-selected`)
- User declares **all available equipment** (multi-select)
- User can edit equipment at any time during Phase 1 (go back to this screen)
- Equipment availability can differ by location or session (e.g., home vs. gym)

### 1.2 Target Selection
User selects workout focus (may be multiple).

**Flow:**
1. Screen: "What's the focus of your workout today?"
2. Display all target muscle groups / goals from exercises (e.g., "arms," "balance," "core," "endurance")
3. Multiselect checkboxes
4. User taps targets, proceeds

### 1.3 Exercise Recommendation & Selection
System presents 3–5 exercises matching targets + available equipment.

**Algorithm:**
1. Filter `exercises.json` by:
   - **For each `requiredEquipment` item:**
     - If `type: "category"` → User must have **at least one item** from that category
     - If `type: "specific"` → User must have **that exact equipment item**
   - At least one target matches selected focus
2. Rank by relevance (MVP: alphabetical; future: feedback loop)
3. Display exercise cards with:
   - Name
   - Target muscles (tags)
   - Position (standing, floor, etc.)
   - Image (if available)
   - Default reps/sets from schema
4. User taps to add to workout sequence
5. Repeat for 3–7 exercises (typical workout load)

### 1.4 Customize Reps/Sets (Per Exercise)
After adding each exercise, user can override defaults **on-screen**.

**Flow:**
1. When exercise added to sequence, display edit UI:
   ```
   Bird Dog
   Default: 6 reps each side
   [---6---] reps  [---2---] sets
   ```
2. User adjusts values via +/- buttons or text input
3. Value persists for this session only
4. If user later loads a saved template, can re-adjust for current session

### 1.5 Sequence Optimization
System optimizes exercise order to minimize setup transitions.

**Algorithm:**
1. Group exercises by equipment configuration (e.g., "suspension trainer at mid-height")
2. Compute transition "cost" between groups (based on `adjustmentCost` in equipment schema)
3. Reorder to minimize total cost
4. Display proposed sequence with transition notes:
   ```
   [Bird Dog] → [Half-Moon Hinge]     (same floor setup)
   ⚠ ADJUST SUSPENSION TRAINER MID → HIGH
   [Suspension Row] → [Suspension Fly]  (same config)
   ```
5. User can **manually reorder** by dragging or tapping arrows, or accept proposed order

### 1.6 Confirmation & Lock-In
Display final sequence on screen with all customizations.

**UI:**
- List of exercises in order with custom reps/sets
- "Start Workout" button (large, prominent)
- Save option (see Phase 3)

### 1.7 Pre-Workout Confirmation (New Screen)
Before Phase 2 starts, show a final confirmation screen.

**Flow:**
1. User taps "Start Workout"
2. Confirmation screen displays:
   - **Selected Equipment** (editable):
     ```
     ✓ Pillow
     ✓ Dumbbell
     
     [Edit Equipment]
     ```
   - **Exercise Sequence** (read-only):
     ```
     1. Bird Dog (6 reps × 2 sets)
     2. Half-Moon Hinge (6 reps × 2 sets)
     3. Kneel to Stand (6 reps × 2 sets)
     ```
   - **Start Workout** button (green, large)

3. User can tap **"Edit Equipment"** to go back to 1.1 (multi-select screen) and adjust
4. Once user confirms "Start Workout", enter Phase 2 and enable WakeLock

**Purpose:** Double-check that equipment is correct before voice-driven Phase 2 starts (can't easily edit during Phase 2)

---

## Phase 2: Workout (Voice-Driven Execution)

### 2.1 Setup Instructions
For each exercise in sequence:

**Flow:**
1. Display exercise card (image, name, equipment needed) — **no interaction needed**
2. Play setup audio (prerecorded priority, TTS fallback)
3. User listens passively
4. User can say:
   - **"Next"** → proceed to rep/timing phase
   - **"Repeat"** → replay setup audio
   - **"Skip"** → skip setup, go straight to reps (inferred: user knows this exercise)
5. System waits for voice command (~10 second timeout, then auto-proceeds to reps)

**Audio playback:**
- Priority: prerecorded audio (`media.audio`)
- Fallback: text-to-speech of `setup.text`
- No simultaneous playback (sequential: speak → listen → command → speak)

### 2.2 Rep Counting & Timing

**For rep-based exercises:**
1. System announces: "Bird Dog: 6 reps each side. Start when ready."
2. User counts aloud; system listens **silently** (no interruption)
3. User says **"Done"** when finished (or "Next" to skip early)
4. System confirms and moves to rest

**For timed holds:**
1. System announces: "30-second hold. Starting now."
2. System counts down aloud at intervals (every 10 sec: "20 seconds left," "10 seconds," "Done")
3. User can say **"Done"** to finish early or **"Skip"** to skip remainder

**For work/rest intervals:**
1. System announces: "30 seconds work, 30 seconds rest. Starting work."
2. Counts interval changes aloud
3. Auto-proceeds when timer ends

### 2.3 Rest & Recovery Between Exercises
Between exercises or sets:

**Flow:**
1. System announces: "30-second rest."
2. Countdown at intervals (every 10 sec)
3. User can say **"Skip"** to move to next exercise immediately
4. Auto-proceeds when timer ends

### 2.4 Transition Notifications
When switching equipment configuration:

**Flow:**
1. Before next exercise, system announces: "Next exercise uses suspension trainer at high height. Adjust now."
2. User has 30 seconds to reconfigure (optional countdown)
3. System then starts setup audio for next exercise

### 2.5 Voice Commands (Context-Inferred)

During Phase 2, user can say:

| Command | Context | Behavior |
|---------|---------|----------|
| "Next" | During setup | Skip setup, go to reps |
| "Next" | During reps | Complete this exercise, go to next |
| "Next" | During rest | Skip rest, start next exercise |
| "Repeat" | During setup | Replay setup audio |
| "Done" | During timed hold / reps | Finish early, proceed to rest |
| "Skip" | During setup | Skip setup, go straight to reps |
| "Skip" | During exercise/timing | Skip this exercise, go to next |
| "Skip" | During set | If multi-set, skip remaining sets, go to next exercise |

**System infers intent based on current phase.**

---

## Phase 3: Post-Workout (Screen-Based Feedback)

### 3.1 Workout Summary
Display:
- List of exercises completed (with checkmarks)
- Exercises skipped (with reason: "skipped setup," "skipped exercise," "skipped sets")
- Total workout time
- Time per exercise

### 3.2 Workout Rating
Simple 1–5 star rating UI.

**Save to state for later analytics (future).**

### 3.3 Excluded Equipment Discovery
Show exercises that were *not* presented because equipment wasn't available:

**Example:**
```
You don't have these items. Consider adding them to your gym:

💪 Medicine Ball (8 lbs)     → Unlocks 12 exercises
  [Add to equipment?]

🪢 Suspension Trainer       → Unlocks 8 exercises
  [Learn more]
```

User can tap to preview exercises or dismiss.

### 3.4 Save Workout Template (NEW)
Post-workout, user can save the workout sequence for later reuse.

**Flow:**
1. Display "Save this workout?" prompt
2. User enters name (e.g., "Swimming Dryland - Balance Focus")
3. Save to localStorage with:
   - Template name
   - Exercise list (IDs)
   - User's reps/sets customizations for each exercise
   - Timestamp
   - Optional notes
4. User can tap "Saved!" to confirm

**Data structure (localStorage):**
```json
{
  "workoutTemplates": {
    "template-id-1": {
      "name": "Swimming Dryland - Balance Focus",
      "exercises": [
        {
          "exerciseId": "bird-dog",
          "reps": 8,
          "sets": 2
        },
        {
          "exerciseId": "half-moon-hinge",
          "reps": 6,
          "sets": 2
        }
      ],
      "createdAt": 1693046400000,
      "notes": "Great balance work"
    }
  }
}
```

### 3.5 Load Workout Template (NEW)
In Phase 1, before equipment/target selection, offer option to load a saved template.

**Flow:**
1. Early Phase 1 screen: "Start fresh or load a saved workout?"
2. Display list of saved templates:
   ```
   ✅ Swimming Dryland - Balance Focus (saved 2 days ago)
   ✅ Quick Gym Session (saved 1 week ago)
   ```
3. User taps template → loads exercises + previous reps/sets
4. User can then:
   - Modify reps/sets for today's session (doesn't change saved template)
   - Adjust equipment if different today
   - Proceed to Phase 2
5. After workout, if user wants to keep changes, must save as **new template** (original stays unchanged)

---

## Data Schema

### Equipment (`data/equipment.json`)

```json
{
  "equipment": [
    {
      "id": "mat",
      "name": "Exercise Mat or Yoga Mat",
      "category": "padded-knee-surface",
      "description": "Cushioning for floor work and joint protection",
      "selectType": "single"
    },
    {
      "id": "suspension-trainer",
      "name": "Suspension Trainer (TRX or equivalent)",
      "category": "suspension-trainer",
      "configurations": [
        {
          "id": "floor-height",
          "name": "Floor Height",
          "adjustmentCost": 2
        },
        {
          "id": "mid-height",
          "name": "Mid Height",
          "adjustmentCost": 3
        }
      ]
    }
  ],
  "categories": [
    {
      "id": "padded-knee-surface",
      "name": "Padded Surface for Floor Work",
      "selectType": "radio"
    }
  ]
}
```

### Exercises (`data/exercises.json`)

```json
{
  "exercises": [
    {
      "id": "bird-dog",
      "name": "Bird Dog",
      "description": "Core stability and balance challenge",
      "targetMuscles": ["balance", "core", "stability"],
      "position": "hands-and-knees",
      "requiredEquipment": [
        {
          "type": "category",
          "categoryId": "padded-knee-surface",
          "note": "Any padded surface works (mat, pillow, towel)"
        }
      ],
      "setup": {
        "text": "Start on your hands and knees with your spine in a neutral position."
      },
      "instructions": {
        "text": "Slowly reach one arm forward while extending the opposite leg behind you...",
        "reps": "6",
        "repsPerSide": true,
        "sets": 2
      },
      "cues": "Move slowly and focus on control rather than speed.",
      "notes": "This exercise challenges your balance and coordination...",
      "media": {
        "image": "/images/bird-dog.jpg",
        "audio": null,
        "video": null
      }
    },
    {
      "id": "example-specific-equipment",
      "name": "Example with Specific Equipment",
      "requiredEquipment": [
        {
          "type": "specific",
          "equipmentId": "mat",
          "note": "Must be a mat; pillow will not work"
        }
      ]
    }
  ]
}
```

**Equipment Requirement Types:**
- **`type: "category"`** — User must have **any item** from the category (e.g., mat OR pillow OR towel)
- **`type: "specific"`** — User must have **this exact equipment item** (e.g., must be mat, not pillow)

### Workout Template (localStorage)

See Phase 3.4 above.

---

## Technical Architecture

### Project Structure

```
cue/
├── README.md                    (maintain production URL at top)
├── CLAUDE.md                    (Claude Code notes)
├── docs/
│   └── specification.md         ← You are here
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── PreWorkout/
│   │   │   ├── EquipmentSelector.tsx
│   │   │   ├── TargetSelector.tsx
│   │   │   ├── ExerciseRecommender.tsx
│   │   │   ├── RepSetsCustomizer.tsx
│   │   │   ├── SequenceOptimizer.tsx
│   │   │   └── TemplateLoader.tsx
│   │   ├── Workout/
│   │   │   ├── ExerciseSetup.tsx
│   │   │   ├── RepCounter.tsx
│   │   │   ├── TimerDisplay.tsx
│   │   │   └── VoiceController.tsx
│   │   ├── PostWorkout/
│   │   │   ├── WorkoutSummary.tsx
│   │   │   ├── RatingUI.tsx
│   │   │   ├── ExcludedEquipment.tsx
│   │   │   ├── SaveTemplate.tsx
│   │   │   └── TemplateInfo.tsx
│   │   └── Common/
│   │       ├── VoiceOutput.tsx
│   │       ├── WakeLock.tsx
│   │       └── ExerciseCard.tsx
│   ├── hooks/
│   │   ├── useVoiceRecognition.ts
│   │   ├── useVoiceSynthesis.ts
│   │   ├── useWakeLock.ts
│   │   └── useWorkoutState.ts
│   ├── services/
│   │   ├── dataLoader.ts
│   │   ├── exerciseFilter.ts
│   │   ├── sequenceOptimizer.ts
│   │   ├── storage.ts
│   │   └── templateManager.ts
│   ├── types/
│   │   ├── equipment.ts
│   │   ├── exercise.ts
│   │   ├── workout.ts
│   │   └── template.ts
│   └── styles/
│       └── App.css
├── public/
│   ├── data/
│   │   ├── equipment.json
│   │   └── exercises.json
│   └── images/
│       ├── bird-dog.jpg
│       └── ...
└── vite.config.ts
```

### GitHub Pages Setup

- Repository: `ericdf/cue` (public)
- GitHub Pages: Main branch → `/cue/` subdirectory
- Production URL: `https://ericdf.github.io/cue/`

**Vite config:**
```typescript
export default {
  base: '/cue/',
  build: {
    outDir: 'dist'
  }
}
```

---

## Voice Interaction (Phase 2 Only)

### Web Speech API

**Recognition:**
- Listen for user commands: "next", "repeat", "done", "skip"
- Use `window.webkitSpeechRecognition` (Chrome, Edge, Android)
- Fallback: `window.SpeechRecognition` (Firefox)
- iOS: Graceful degradation (on-screen button fallbacks)

**Synthesis:**
1. Prerecorded audio (`media.audio`) preferred
2. Fallback to Web Speech Synthesis API (`window.speechSynthesis`)
3. Text-to-speech for setup, instructions, timers, feedback

**Hook: `useVoiceRecognition.ts`**
```typescript
interface VoiceCommand {
  command: "next" | "repeat" | "done" | "skip";
  confidence: number;
}

const useVoiceRecognition = (
  onCommand: (cmd: VoiceCommand) => void,
  enabled: boolean
) => {
  // Implementation
}
```

**Sequential Audio Flow (no simultaneous playback):**
1. Play setup audio
2. Pause recognition while speaking
3. Audio ends → enable recognition
4. Listen for voice command
5. On command → stop recognition, process, continue

---

## WakeLock Implementation

**Hook: `useWakeLock.ts`**
```typescript
const useWakeLock = (enabled: boolean) => {
  // Request WakeLock when Phase 2 starts
  // Release when Phase 2 ends
  // Fallback: warn user if unsupported
}
```

**Behavior:**
- Request on "Start Workout" (Phase 2 entry)
- Release on Phase 2 completion
- Graceful fallback for unsupported browsers

---

## Storage

### localStorage Keys

```
equipment-selected          → user's declared equipment
workout-templates          → saved workout templates (JSON)
workout-history            → (future) workout completions
feedback-ratings           → (future) workout ratings
```

### API

**Provide service: `storage.ts`**
```typescript
// Equipment
const saveEquipment = (equipment: Record<string, string[]>) => {}
const getEquipment = () => Record<string, string[]>

// Templates
const saveTemplate = (template: WorkoutTemplate) => {}
const loadTemplate = (templateId: string) => WorkoutTemplate
const listTemplates = () => WorkoutTemplate[]
const deleteTemplate = (templateId: string) => {}
```

---

## Component Checklist for Claude Code

### Phase 1: Pre-Workout (Screen)
- [ ] EquipmentSelector: Display all equipment as checkboxes (multi-select). Cache to localStorage in real-time. User declares all items they have.
- [ ] TargetSelector: Multiselect for muscle groups
- [ ] ExerciseRecommender: Filter + display 3–5 exercises
- [ ] RepSetsCustomizer: Edit UI for reps/sets per exercise
- [ ] SequenceOptimizer: Reorder exercises, show transitions, manual drag/reorder
- [ ] TemplateLoader: Load saved templates, adjust for today
- [ ] PreWorkoutConfirmation: Show selected equipment (editable), exercise sequence, "Start Workout" button
  - Allow user to tap "Edit Equipment" and go back to EquipmentSelector
  - Enable WakeLock when "Start Workout" tapped

### Phase 2: Workout (Voice)
- [ ] ExerciseSetup: Display exercise, play setup audio, listen for "next"/"repeat"/"skip"
- [ ] RepCounter: User counts; listen for "done" or auto-timeout
- [ ] TimerDisplay: Countdown for timed holds / rest, announce intervals
- [ ] VoiceController: Central voice I/O orchestration
- [ ] TransitionAlerts: Announce equipment reconfigurations
- [ ] PhaseWakeLock: Prevent screen sleep during Phase 2

### Phase 3: Post-Workout (Screen)
- [ ] WorkoutSummary: Exercises completed, skipped, time, per-exercise timing
- [ ] RatingUI: 1–5 star rating
- [ ] ExcludedEquipment: Show locked exercises
- [ ] SaveTemplate: Prompt for template name, save to localStorage
- [ ] TemplateInfo: Display template details (exercises, reps, date created)

### Common
- [ ] VoiceOutput: Play audio or TTS
- [ ] ExerciseCard: Reusable exercise display card
- [ ] Navigation: Move between phases smoothly

### Hooks
- [ ] useVoiceRecognition: Web Speech API wrapper
- [ ] useVoiceSynthesis: TTS + prerecorded audio fallback
- [ ] useWakeLock: Screen wake lock control
- [ ] useWorkoutState: Global workout state

### Services
- [ ] dataLoader: Fetch equipment.json, exercises.json
- [ ] exerciseFilter: Filter by targets + equipment
- [ ] sequenceOptimizer: Reorder exercises by transition cost
- [ ] storage: localStorage helpers
- [ ] templateManager: Save/load/list/delete templates

### Types
- [ ] equipment.ts
- [ ] exercise.ts
- [ ] workout.ts
- [ ] template.ts

---

## Testing Checklist

- [ ] Equipment selector: all items display as checkboxes (multi-select)
- [ ] Equipment selector: user can check all items they have available
- [ ] Equipment selector: persists to localStorage immediately as user selects (no "save" button)
- [ ] Equipment selector: user can return anytime to adjust selections
- [ ] Equipment selector: selections cached across sessions
- [ ] Pre-workout confirmation: displays selected equipment (editable)
- [ ] Pre-workout confirmation: displays exercise sequence (read-only)
- [ ] Pre-workout confirmation: "Edit Equipment" button returns to EquipmentSelector
- [ ] Pre-workout confirmation: "Start Workout" enables WakeLock and enters Phase 2
- [ ] Target selector filters exercises correctly
- [ ] Exercise recommender displays 3–5 matching exercises
- [ ] Exercise recommender: filters correctly for category-based requirements (user needs any item from category)
- [ ] Exercise recommender: filters correctly for specific equipment requirements (user needs exact item)
- [ ] Reps/sets customizer updates values
- [ ] Sequence optimizer minimizes transitions
- [ ] Manual reordering works (drag or arrows)
- [ ] Template loader shows saved templates, allows load + modify
- [ ] Phase 2 start locks screen wake
- [ ] Setup audio plays (or TTS fallback)
- [ ] Voice recognition works for "next", "repeat", "skip", "done"
- [ ] Timers countdown and announce intervals
- [ ] Transition alerts display before equipment changes
- [ ] Phase 3 summary shows correct exercises/times
- [ ] Save template UI prompts for name, saves to localStorage
- [ ] Load template retrieves exercises + previous customizations
- [ ] Mobile UX: large touch targets, readable text, voice feedback clear
- [ ] iOS fallback buttons present for voice (if recognition limited)

---

## Production Deployment

1. Ensure `docs/specification.md` and `CLAUDE.md` in repo
2. Ensure `public/data/equipment.json` and `public/data/exercises.json` exist
3. Run `npm run build`
4. Commit `dist/` and push to main
5. GitHub Pages auto-deploys to `https://ericdf.github.io/cue/`

---

## Future Enhancements

1. Workout history analytics (reps, times, PRs)
2. Spaced repetition of excluded exercises in Phase 3
3. Custom workout templates with audio cues
4. Social / community template sharing
5. Advanced voice recognition (custom models)
6. Dark mode
7. Accessibility (larger fonts, high contrast)
8. Offline support (service worker)

---

End of Specification
