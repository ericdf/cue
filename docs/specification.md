# Cue: Voice-Driven Workout Companion
## Complete Technical Specification for Claude Code

---

## Executive Summary

**Cue** is a client-side React web app that guides workouts through voice interaction. Users plan workouts via screen (selecting equipment, targets, exercises), then execute via voice commands and listening. Three phases: pre-workout (planning), workout (execution), post-workout (feedback).

**Tech Stack:**
- React + TypeScript
- Web Speech API (recognition + synthesis)
- WakeLock API (prevent screen sleep)
- Vite (build)
- GitHub Pages (hosting)
- JSON + media files in repo

**Hosting:** GitHub Pages at `https://yourusername.github.io/cue`

---

## Phase 1: Pre-Workout (Screen-Based Planning)

### 1.1 Equipment Declaration
User selects available equipment by category.

**Flow:**
1. Landing page: "What equipment do you have?"
2. Display all equipment categories from `data/equipment.json`
3. Each category: multiselect or single-select (user declares what they have)
4. Save selection to browser localStorage (`equipment-selected`)

**Example categories:**
- `padded-knee-surface` (mat, pillow, towel, block)
- `handheld-weight-8lbs` (dumbbell, medicine ball, kettlebell, jug)
- `suspension-trainer` (with sub-configs: floor, mid, high)
- `stability-ball`
- `resistance-band` (light, medium, heavy)

### 1.2 Target Selection
User selects workout focus (may be multiple).

**Flow:**
1. "What's the focus of your workout today?"
2. Display all target muscle groups / goals from exercises (e.g., "arms," "balance," "core," "endurance")
3. Multiselect; save to state

### 1.3 Exercise Recommendation & Selection
System presents 3–5 exercises matching targets + available equipment.

**Algorithm:**
1. Filter `exercises.json` by:
   - All required equipment matches user's declared equipment
   - At least one target matches selected focus
2. Rank by relevance (TBD feedback loop; for MVP: alphabetical or frequency)
3. Display exercise card with:
   - Name
   - Target muscles
   - Position (standing, floor, etc.)
   - Image (if available)
   - Brief description
4. User taps to add to workout sequence
5. User repeats for 3–7 exercises (typical workout load)

### 1.4 Sequence Optimization
System optimizes exercise order to minimize setup transitions.

**Algorithm:**
1. Group exercises by equipment configuration (e.g., "suspension trainer at mid-height")
2. Compute transition "cost" between groups
3. Reorder to minimize total cost
4. Display proposed sequence with transition notes (e.g., "Adjust suspension trainer from mid to high")
5. User can manually reorder or lock in

**Example:**
```
[Bird Dog] → [Half-Moon Hinge]     (no transition, both floor)
[ADJUST SUSPENSION TRAINER MID → HIGH]
[Suspension Row] → [Suspension Fly]  (same config)
[ADJUST SUSPENSION TRAINER MID]
[Single-Leg Paloff Press]            (requires cable/band, no transition)
```

### 1.5 Confirmation & Lock-In
Display final sequence on screen. User confirms "Start Workout."

**Save to state:**
- Selected equipment
- Target focus
- Exercise sequence (locked order)
- Timestamp

---

## Phase 2: Workout (Voice-Driven Execution)

### 2.1 Exercise Setup
For each exercise in sequence:

**Flow:**
1. Display exercise card (image, name, equipment needed)
2. Play audio setup instructions (or text-to-speech fallback)
3. User listens; can say:
   - "Repeat" → replay audio
   - "Next" → proceed to rep phase
   - "Skip" → skip this exercise, move to next
4. No interaction needed; system waits for voice command (~10 second timeout, then auto-proceeds)

**Audio playback:**
- Priority: prerecorded audio (`media.audio`) 
- Fallback: text-to-speech (`setup.text`)
- Pause system output while listening for voice commands

### 2.2 Rep Counting & Timing
Once setup is confirmed, user performs exercise.

**For rep-based exercises:**
1. System announces: "Bird Dog: 6 reps each side. Start when ready."
2. User counts aloud; system listens silently (no interruption)
3. User says "Done" or "Next" when finished
4. System confirms and moves to rest

**For timed holds:**
1. System announces: "30-second hold. Starting now."
2. System counts down aloud at intervals (every 10 seconds: "20 seconds left," "10 seconds," "Done")
3. User can say "Done early" to skip ahead

**For work/rest intervals:**
1. System announces: "30 seconds work, 30 seconds rest. Starting work."
2. Counts interval changes aloud

### 2.3 Rest & Recovery
Between exercises:

**Flow:**
1. System announces: "30-second rest. You're doing great."
2. Optional: Play upbeat audio cue
3. Countdown at intervals (similar to timed holds)
4. User can say "Skip" to move to next exercise immediately
5. Auto-proceeds when timer ends

### 2.4 Transition Notifications
When switching equipment configuration:

**Flow:**
1. Before next exercise, system announces: "Next exercise uses suspension trainer at high height. Adjust now."
2. User has 30 seconds to reconfigure
3. System then starts setup audio

---

## Phase 3: Post-Workout (Feedback & Discovery)

### 3.1 Workout Summary
Display:
- Exercises completed (with checkmarks)
- Exercises skipped (with reason if available)
- Total workout time
- Option to rate workout (1–5 stars)

### 3.2 Excluded Equipment Discovery
Show exercises that were *not* presented because equipment wasn't available:

**Example:**
```
You don't have these items. Consider adding them to your gym:
- Medicine Ball (8 lbs) → Unlocks 12 exercises
- Suspension Trainer → Unlocks 8 exercises
```

Tappable to preview exercises.

### 3.3 Feedback Loop (MVP Placeholder)
- User rates workout
- Save to localStorage (future: send to analytics or allow download as CSV)
- Placeholder for future relevance tuning

---

## Data Schema

### 2.1 Equipment (`data/equipment.json`)

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
      "id": "pillow",
      "name": "Pillow or Cushion",
      "category": "padded-knee-surface",
      "description": "Household alternative to mat",
      "selectType": "single"
    },
    {
      "id": "suspension-trainer",
      "name": "Suspension Trainer (TRX or equivalent)",
      "category": "suspension-trainer",
      "description": "Adjustable straps for bodyweight exercises",
      "selectType": "single",
      "configurations": [
        {
          "id": "floor-height",
          "name": "Floor Height (Straps Nearly Touching Ground)",
          "adjustmentCost": 2
        },
        {
          "id": "mid-height",
          "name": "Mid Height (Straps at Waist Level)",
          "adjustmentCost": 3
        },
        {
          "id": "high-height",
          "name": "High Height (Straps at Shoulder Level)",
          "adjustmentCost": 2
        }
      ]
    },
    {
      "id": "dumbbell-8",
      "name": "Dumbbell (8 lbs)",
      "category": "handheld-weight-8lbs",
      "selectType": "single"
    },
    {
      "id": "medicine-ball-8",
      "name": "Medicine Ball (8 lbs)",
      "category": "handheld-weight-8lbs",
      "selectType": "single"
    },
    {
      "id": "laundry-jug",
      "name": "Jug of Laundry Detergent or Water (8 lbs equivalent)",
      "category": "handheld-weight-8lbs",
      "selectType": "single"
    }
  ],
  "categories": [
    {
      "id": "padded-knee-surface",
      "name": "Padded Surface for Floor Work",
      "description": "Mat, pillow, or equivalent",
      "selectType": "radio"
    },
    {
      "id": "handheld-weight-8lbs",
      "name": "8 lb Handheld Weight",
      "description": "Dumbbell, medicine ball, or household item",
      "selectType": "radio"
    },
    {
      "id": "suspension-trainer",
      "name": "Suspension Trainer",
      "description": "TRX or equivalent",
      "selectType": "checkbox"
    }
  ]
}
```

### 2.2 Exercises (`data/exercises.json`)

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
          "categoryId": "padded-knee-surface",
          "note": "Reduces joint stress"
        }
      ],
      "optionalEquipment": [],
      "setup": {
        "text": "Start on your hands and knees with your spine in a neutral position."
      },
      "instructions": {
        "text": "Slowly reach one arm forward while extending the opposite leg behind you. Pause briefly, focusing on keeping your hips level and your torso still. Return to the starting position and repeat on the opposite side.",
        "reps": "6 repetitions on each side"
      },
      "cues": "Move slowly and focus on control rather than speed.",
      "notes": "This exercise challenges your balance and coordination by teaching you to stabilize your core while your limbs work independently.",
      "media": {
        "image": "/images/bird-dog.jpg",
        "audio": null,
        "video": null
      }
    },
    {
      "id": "kneel-stand-medicine",
      "name": "Kneel to Stand With Medicine Ball",
      "description": "Balance and streamline stability",
      "targetMuscles": ["balance", "stability", "strength"],
      "position": "kneeling-to-standing",
      "requiredEquipment": [
        {
          "categoryId": "handheld-weight-8lbs",
          "note": "Held overhead"
        }
      ],
      "optionalEquipment": [],
      "setup": {
        "text": "Start in a tall kneeling position with a weight held overhead. Keep your arms in line with your ears and your torso straight."
      },
      "instructions": {
        "text": "Step one foot forward into a lunge position, then drive through your front leg to stand. Keep the weight overhead and your upper body steady throughout the movement. Reverse the motion to return to the starting position.",
        "reps": "6 repetitions on each side"
      },
      "cues": "Maintain steady core; don't lean forward.",
      "notes": "This challenges balance and stability while reinforcing the strength needed to hold a tight streamline.",
      "media": {
        "image": "/images/kneel-stand-medicine.jpg",
        "audio": null,
        "video": null
      }
    },
    {
      "id": "stability-ball-plank-rollout",
      "name": "Stability Ball Plank Rollout",
      "description": "Core control and body alignment",
      "targetMuscles": ["core", "stability", "control"],
      "position": "plank",
      "requiredEquipment": [
        {
          "categoryId": "stability-ball",
          "note": "Standard size (65 cm)"
        }
      ],
      "optionalEquipment": [],
      "setup": {
        "text": "Begin in a plank position with your forearms on a stability ball and your body forming a straight line from head to heel."
      },
      "instructions": {
        "text": "Slowly roll the ball forward by extending your arms, maintaining a rigid torso throughout the movement. Roll out as far as you can while keeping good alignment, then pull the ball back to the starting position.",
        "reps": "12 repetitions"
      },
      "cues": "Keep your core tight; don't let your hips sag or pike.",
      "notes": "This exercise challenges your ability to resist unwanted movement and helps improve overall body control.",
      "media": {
        "image": "/images/stability-ball-plank.jpg",
        "audio": null,
        "video": null
      }
    }
  ]
}
```

### 2.3 Workout State (Runtime)

```typescript
interface WorkoutState {
  equipmentSelected: Record<string, string[]>; // categoryId → selected equipment IDs
  targetFocus: string[]; // e.g., ["balance", "core"]
  exerciseSequence: {
    exerciseId: string;
    position: number;
    status: "pending" | "in-progress" | "completed" | "skipped";
    completedAt?: number;
    notes?: string;
  }[];
  currentExerciseIndex: number;
  startTime: number;
  workoutComplete: boolean;
  feedback?: {
    rating: number; // 1–5
    completedAt: number;
  };
}
```

---

## Technical Architecture

### 3.1 Project Structure

```
cue/
├── README.md                    (maintain production URL at top)
├── CLAUDE.md                    (Claude Code notes; see section 4.1)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── PreWorkout/
│   │   │   ├── EquipmentSelector.tsx
│   │   │   ├── TargetSelector.tsx
│   │   │   ├── ExerciseRecommender.tsx
│   │   │   └── SequenceOptimizer.tsx
│   │   ├── Workout/
│   │   │   ├── ExerciseSetup.tsx
│   │   │   ├── RepCounter.tsx
│   │   │   ├── TimerDisplay.tsx
│   │   │   └── VoiceController.tsx
│   │   ├── PostWorkout/
│   │   │   ├── WorkoutSummary.tsx
│   │   │   └── ExcludedEquipment.tsx
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
│   │   ├── dataLoader.ts        (fetch JSON from repo)
│   │   ├── exerciseFilter.ts
│   │   ├── sequenceOptimizer.ts
│   │   └── storage.ts           (localStorage)
│   ├── types/
│   │   ├── equipment.ts
│   │   ├── exercise.ts
│   │   └── workout.ts
│   └── styles/
│       └── App.css
├── public/
│   ├── data/
│   │   ├── equipment.json
│   │   └── exercises.json
│   └── images/
│       ├── bird-dog.jpg
│       ├── kneel-stand-medicine.jpg
│       └── ...
├── audio/
│   ├── bird-dog-setup.mp3
│   └── ... (user-recorded, optional for MVP)
└── dist/                        (build output, served by GitHub Pages)
```

### 3.2 GitHub Pages Setup

**Repository:**
- `yourusername/cue` (public)
- GitHub Pages enabled, source: `/dist` (or `/` if using `docs/`)

**Vite config:**
```typescript
export default {
  base: '/cue/',
  build: {
    outDir: 'dist',
  }
}
```

**Deploy:**
```bash
npm run build
git add dist/
git commit -m "Deploy to GitHub Pages"
git push
```

**Production URL:** `https://yourusername.github.io/cue`

---

## Voice Interaction Implementation

### 4.1 Speech Recognition

**Use Web Speech API:**
- `window.webkitSpeechRecognition` (Chrome, Edge, Android)
- Fallback: `window.SpeechRecognition` (Firefox)
- iOS: Graceful degradation (show on-screen buttons)

**Hook: `useVoiceRecognition.ts`**
```typescript
interface VoiceCommand {
  command: "next" | "repeat" | "done" | "skip" | "start" | string;
  confidence: number;
}

const useVoiceRecognition = (
  onCommand: (cmd: VoiceCommand) => void,
  enabled: boolean
) => {
  // Implement recognition, handle errors, emit commands
}
```

**Commands during workout:**
- "Next" → proceed to next exercise
- "Repeat" → replay audio
- "Done" → complete exercise early
- "Skip" → skip exercise
- "Start" → begin workout
- "Pause" → pause (future feature)

### 4.2 Text-to-Speech

**Priority order:**
1. Prerecorded audio file (if available)
2. Web Speech Synthesis API (`window.speechSynthesis`)
3. On-screen text fallback

**Hook: `useVoiceSynthesis.ts`**
```typescript
const useVoiceSynthesis = (text: string, options?: SpeechOptions) => {
  // Speak text; handle pause/cancel
  // Emit events when started/ended
}
```

**Quality settings:**
- Rate: 0.95 (slightly slower, clearer)
- Pitch: 1.0
- Volume: 1.0

### 4.3 Audio Mixing Strategy

**Sequential flow** (avoid simultaneous playback):
1. Play setup audio (or TTS)
2. Pause recognition while speaking
3. When audio ends, enable recognition
4. Listen for "next" / "repeat" / "skip"
5. On command, stop recognition, proceed

---

## WakeLock Implementation

**Hook: `useWakeLock.ts`**
```typescript
const useWakeLock = (enabled: boolean) => {
  // Request WakeLock when workout starts
  // Release when workout ends
  // Fallback: warn user to keep screen on
}
```

**Behavior:**
- Request WakeLock on "Start Workout"
- Release on "End Workout" or app exit
- Catch errors gracefully (some browsers/devices don't support)

---

## Sequence Optimization Algorithm

### 5.1 Transition Cost Model

**Input:** List of exercises with equipment + configuration.

**Output:** Reordered sequence minimizing total transition cost.

```typescript
interface ExerciseWithConfig {
  exerciseId: string;
  equipmentConfigs: {
    equipmentId: string;
    configurationId?: string; // e.g., "mid-height"
  }[];
}

function optimizeSequence(
  exercises: ExerciseWithConfig[],
  equipment: Equipment[]
): ExerciseWithConfig[] {
  // 1. Group by (equipment, configuration)
  // 2. Compute transition cost between groups
  // 3. Use greedy or brute-force reordering (small N allows brute-force)
  // 4. Return reordered sequence
}
```

**Cost matrix example:**
```
Bird Dog (mat) → Half-Moon Hinge (mat): cost 0 (same)
Half-Moon Hinge (mat) → Suspension Row (suspension, mid): cost 3 (adjust suspension)
Suspension Row (suspension, mid) → Suspension Fly (suspension, mid): cost 0 (same)
Suspension Fly (suspension, mid) → Paloff Press (band): cost 2 (remove suspension)
```

---

## Data Ingest Process

### 6.1 PDF → JSON Workflow

**When user sends Eric a PDF with new exercises:**

1. **Claude Code receives PDF**
2. **Extract exercises:**
   - Name, setup text, instructions, reps/timing
   - Analyze images for position, equipment, cushioning needs
   - Identify target muscle groups from article context
   - Note equipment explicitly mentioned + implied (e.g., "hands and knees" → mat needed)
3. **Prompt user to clarify:**
   - Equipment categories (map to existing categories or create new ones)
   - Target muscles (multi-select from existing list)
   - Any substitutes or variations
4. **Generate JSON entries** and add to `data/exercises.json`
5. **Instructions to Eric:**
   - Save extracted images to `public/images/` (filename convention: `{exercise-id}.jpg`)
   - Record audio setup if desired (save to `audio/{exercise-id}-setup.mp3`)
   - Commit and push to repo

### 6.2 CLAUDE.md Notes

**Create `CLAUDE.md` in repo root:**

```markdown
# Cue: Development Notes for Claude Code

## Ingest Workflow

When processing a new PDF with exercises:

1. Extract all exercises with clear text (setup, instructions, reps/timing)
2. Analyze associated images for:
   - Position (standing, floor, kneeling, etc.)
   - Equipment implied by image (mat under knees, cable attachment, etc.)
   - Muscle groups targeted
3. Cross-reference with existing equipment.json categories
4. If new category needed, propose new entry with description
5. Generate JSON entries conforming to data/exercises.json schema
6. Provide images and audio guidance to user

## Image Handling

- Extract images from PDF and save as `public/images/{exercise-id}.jpg`
- Optimize for mobile (compress to ~150KB max)
- Use descriptive filenames matching exercise IDs

## Audio Setup (Future)

- User records voice guidance for setup (e.g., "Start on your hands and knees...")
- Save to `audio/{exercise-id}-setup.mp3`
- App prioritizes prerecorded over TTS

## PR Process

- User can manually edit data/exercises.json or request Claude Code to update
- Always validate schema before commit
- Update README.md production URL if changed

---

## README.md Template

**Maintain at top of README.md:**

```markdown
# Cue: Voice-Driven Workout Companion

**Production URL:** https://yourusername.github.io/cue

---

[Rest of README...]
```

---

## Component Checklist for Claude Code

### Pre-Workout
- [ ] EquipmentSelector: Radio/checkbox UI for equipment categories
- [ ] TargetSelector: Multiselect for muscle groups / focus areas
- [ ] ExerciseRecommender: Filter + display 3–5 exercises
- [ ] SequenceOptimizer: Reorder exercises, show transitions
- [ ] Confirmation screen with "Start Workout" button

### Workout
- [ ] ExerciseSetup: Display exercise, play setup audio, listen for "next"/"repeat"
- [ ] RepCounter: User counts aloud; listen for "done" (or manual entry fallback)
- [ ] TimerDisplay: Countdown for timed holds / rest periods
- [ ] VoiceController: Central voice I/O orchestration
- [ ] Transition alerts: Announce equipment reconfiguration

### Post-Workout
- [ ] WorkoutSummary: Exercises completed, time, rating UI
- [ ] ExcludedEquipment: Show exercises skipped due to missing gear
- [ ] Feedback form (star rating, optional notes)

### Common
- [ ] VoiceOutput: Play audio or TTS
- [ ] WakeLock: Request/release screen wake lock
- [ ] ExerciseCard: Reusable card with image, name, targets

### Hooks
- [ ] useVoiceRecognition: Web Speech API wrapper
- [ ] useVoiceSynthesis: TTS + prerecorded audio fallback
- [ ] useWakeLock: Screen wake lock request/release
- [ ] useWorkoutState: Global workout state (Redux-light)

### Services
- [ ] dataLoader: Fetch equipment.json and exercises.json from public/
- [ ] exerciseFilter: Filter exercises by targets + available equipment
- [ ] sequenceOptimizer: Reorder exercises by transition cost
- [ ] storage: localStorage helpers for equipment selection + workout history

### Types
- [ ] equipment.ts: Equipment, Category, Configuration types
- [ ] exercise.ts: Exercise, Media, Instructions types
- [ ] workout.ts: WorkoutState, VoiceCommand types

---

## Deployment Checklist

- [ ] Vite config: base path = '/cue/'
- [ ] GitHub Pages enabled on repo
- [ ] data/equipment.json and exercises.json in public/
- [ ] Images in public/images/
- [ ] npm run build works
- [ ] dist/ artifacts committed (or auto-deploy via GitHub Actions)
- [ ] README.md has production URL
- [ ] Test on mobile browser (iPhone Safari, Android Chrome)

---

## Known Limitations (MVP)

- **iOS speech recognition:** Limited; show on-screen buttons as fallback
- **Audio mixing:** Sequential playback only (no simultaneous)
- **Substitutions:** Handled via category abstraction, not explicit rules
- **Analytics:** Feedback stored locally; no server sync
- **Accessibility:** Voice-first, but on-screen fallbacks provided

---

## Future Enhancements

1. **Spaced repetition of excluded exercises** (post-workout discovery)
2. **Personal records tracking** (reps, times, PRs by exercise)
3. **Workout templates** (save favorite sequences)
4. **Social/community exercises** (import shared routines)
5. **Advanced analytics** (volume, intensity, trends)
6. **Offline support** (service worker caching)
7. **Dark mode**
```

---

## Build & Deploy Instructions

### 7.1 Local Setup

```bash
git clone https://github.com/yourusername/cue.git
cd cue
npm install
npm run dev        # Local dev server on http://localhost:5173
```

### 7.2 Build & Deploy

```bash
npm run build       # Creates dist/
git add dist/
git commit -m "Deploy v1.0"
git push origin main
```

**GitHub Pages will auto-publish to** `https://yourusername.github.io/cue`

### 7.3 GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` to auto-build on push:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Testing Checklist

- [ ] Equipment selector: Can select/deselect items, saves to localStorage
- [ ] Target selector: Multiselect works, filters exercises correctly
- [ ] Exercise recommender: Displays 3–5 exercises matching targets + equipment
- [ ] Sequence optimizer: Reorders exercises, shows transitions, allows manual reorder
- [ ] Setup audio: Plays prerecorded or TTS; "repeat" replays; "next" advances
- [ ] Rep counter: User speaks; system listens; "done" confirms
- [ ] Timer: Counts down, announces intervals, can be skipped
- [ ] Rest periods: Auto-advance or manual skip
- [ ] Transition alerts: Display and audio announce equipment changes
- [ ] Post-workout: Summary, excluded equipment, rating UI
- [ ] WakeLock: Screen doesn't sleep during workout (test on real device)
- [ ] Mobile UX: Touch targets large enough, text readable during workout
- [ ] Voice on iOS: Fallback buttons present and functional
- [ ] Dark mode: Works if implemented

---

## Production URL Maintenance

**Eric:** After deployment, update README.md top line:

```markdown
# Cue: Voice-Driven Workout Companion

**Production URL:** https://yourusername.github.io/cue

**Live now!** Start your voice-guided workout.
```

---

End of Specification
```