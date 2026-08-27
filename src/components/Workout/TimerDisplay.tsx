interface Props {
  secondsRemaining: number
  totalSeconds: number
  label: string
}

export const TimerDisplay = ({ secondsRemaining, totalSeconds, label }: Props) => {
  const progress = totalSeconds > 0 ? 1 - secondsRemaining / totalSeconds : 0
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60

  return (
    <div className="timer" role="timer" aria-live="off">
      <div className="timer__ring" style={{ '--progress': progress } as React.CSSProperties}>
        <span className="timer__value">
          {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : seconds}
        </span>
      </div>
      <p className="timer__label">{label}</p>
    </div>
  )
}
