interface Props {
  text: string
  speaking: boolean
  listening: boolean
  recognitionSupported: boolean
}

/**
 * The on-screen transcript of whatever the app is saying. Doubles as the
 * accessible fallback when speech synthesis is unavailable, and shows whether
 * the app is currently talking or listening.
 */
export const VoiceOutput = ({ text, speaking, listening, recognitionSupported }: Props) => (
  <div className="voice-output">
    <div className="voice-output__status">
      {speaking ? (
        <span className="pill pill--speaking">Speaking…</span>
      ) : listening ? (
        <span className="pill pill--listening">Listening…</span>
      ) : recognitionSupported ? (
        <span className="pill">Ready</span>
      ) : (
        <span className="pill pill--muted">Use the buttons below</span>
      )}
    </div>
    <p className="voice-output__text" aria-live="polite">
      {text}
    </p>
  </div>
)
