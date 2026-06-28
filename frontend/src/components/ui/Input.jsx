export default function Input({ label, id, error, ...props }) {
  const inputId = id || props.name
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className="rc-input">
      {label ? <span className="rc-input__label">{label}</span> : null}
      <input
        id={inputId}
        className="rc-input__field"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <span id={errorId} className="rc-input__error">
          {error}
        </span>
      ) : null}
    </label>
  )
}
