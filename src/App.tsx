import { WorkoutProvider, useWorkoutState } from './hooks/useWorkoutState'
import { TemplateLoader } from './components/PreWorkout/TemplateLoader'
import { EquipmentSelector } from './components/PreWorkout/EquipmentSelector'
import { RepSetsCustomizer } from './components/PreWorkout/RepSetsCustomizer'
import { PreWorkoutConfirmation } from './components/PreWorkout/PreWorkoutConfirmation'
import { TargetSelector } from './components/PreWorkout/TargetSelector'
import { ExerciseRecommender } from './components/PreWorkout/ExerciseRecommender'
import { SequenceOptimizer } from './components/PreWorkout/SequenceOptimizer'
import { VoiceController } from './components/Workout/VoiceController'
import { WorkoutSummary } from './components/PostWorkout/WorkoutSummary'
import './styles/App.css'

const Router = () => {
  const { phase, loading, loadError, editingFromConfirm } = useWorkoutState()

  if (loading) {
    return (
      <div className="screen screen--centered">
        <p className="notice">Loading your exercises…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="screen screen--centered">
        <p className="notice notice--error">{loadError}</p>
      </div>
    )
  }

  switch (phase) {
    case 'start':
      return <TemplateLoader />
    case 'equipment':
      return <EquipmentSelector returnTo={editingFromConfirm ? 'confirm' : undefined} />
    case 'targets':
      return <TargetSelector />
    case 'exercises':
      return <ExerciseRecommender />
    case 'customize':
      return <RepSetsCustomizer />
    case 'sequence':
      return <SequenceOptimizer />
    case 'confirm':
      return <PreWorkoutConfirmation />
    case 'workout':
      return <VoiceController />
    case 'summary':
      return <WorkoutSummary />
  }
}

export const App = () => (
  <WorkoutProvider>
    <main className="app">
      <Router />
    </main>
  </WorkoutProvider>
)

export default App
