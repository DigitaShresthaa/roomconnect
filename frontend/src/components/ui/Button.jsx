export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`rc-button rc-button--${variant} rc-button--${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
