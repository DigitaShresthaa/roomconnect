export default function Select({ label, id, error, children, ...props }) {
  const inputId = id || props.name
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className="rc-input">
      {label ? <span className="rc-input__label">{label}</span> : null}
      <select
        id={inputId}
        className="rc-input__field"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span id={errorId} className="rc-input__error">
          {error}
        </span>
      ) : null}
    </label>
  )
}
