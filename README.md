# Cue: Voice-Driven Workout Companion

**Production URL:** https://ericdf.github.io/cue/

Plan your workout on screen, then run it hands-free by voice.

---

## What it does

**Pre-workout (screen).** Declare the equipment you have, pick a focus, choose
from exercises you can actually do, and get a sequence ordered to minimize
equipment changes.

**Workout (voice).** The app reads each setup aloud, waits for you, counts timed
holds down, and runs rest periods. Say **next**, **repeat**, **done**, or
**skip** — or tap the on-screen equivalent.

**Post-workout.** A summary of what you finished, a star rating, and a list of
gear that would unlock exercises you couldn't do today.

## Voice commands

| Say | Effect |
| --- | --- |
| `next` / `start` | Advance to the next stage |
| `repeat` | Replay the last thing spoken |
| `done` / `finished` | Finish the current set or hold |
| `skip` | Skip the exercise (or the rest period) |
| `pause` | Stop the current speech |

Every command has a button too — iOS speech recognition is unreliable, so the
app never depends on it.

## Development

```bash
npm install
npm run dev        # http://localhost:5173/cue/
npm run build      # typecheck + production build into dist/
npm run typecheck  # types only
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. `dist/` is not committed.

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment** and set **Source** to **GitHub Actions**.

## Data

Content lives in `public/data/`, so adding exercises needs no code changes:

- `equipment.json` — categories and the items that satisfy them. Exercises
  require a *category* (`handheld-weight-8lbs`), not a specific item, so a jug of
  detergent substitutes for a dumbbell.
- `exercises.json` — setup text, instructions, targets, and required equipment.
  Give an exercise `instructions.reps` for a rep-based set or
  `instructions.durationSeconds` for a timed hold.

Images go in `public/images/{exercise-id}.jpg`; optional setup recordings go in
`audio/{exercise-id}-setup.mp3` and take priority over text-to-speech. Both are
optional — a missing image is hidden and missing audio falls back to TTS.

## Browser support

- **Speech recognition:** Chrome, Edge, Android Chrome. iOS Safari is limited —
  use the buttons.
- **Speech synthesis:** everywhere current.
- **Wake lock:** Chrome, Edge, Safari 16.4+. The app warns when it can't hold one.

## Docs

- [`docs/specification.md`](docs/specification.md) — full technical spec
- [`CLAUDE.md`](CLAUDE.md) — notes for Claude Code
