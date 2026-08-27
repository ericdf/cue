interface Props {
  active: boolean
  supported: boolean
}

/** Tells the user to keep the screen on when the browser won't do it for us. */
export const WakeLockNotice = ({ active, supported }: Props) =>
  supported && active ? null : (
    <p className="notice notice--subtle">
      {supported
        ? 'Screen lock could not be held — keep your screen awake manually.'
        : 'This browser cannot keep the screen awake. Set your auto-lock longer before starting.'}
    </p>
  )
