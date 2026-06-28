export default function Textarea({
  label,
  id,
  error,
  wrapperClassName = '',
  className = '',
  ...props
}) {
  const inputId = id || props.name
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className={`rc-input ${wrapperClassName}`.trim()}>
      {label ? <span className="rc-input__label">{label}</span> : null}
      <textarea
        id={inputId}
        className={`rc-input__field rc-input__field--textarea ${className}`.trim()}
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
