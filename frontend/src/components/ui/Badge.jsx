export default function Badge({ children, tone = 'neutral' }) {
  return <span className={`rc-badge rc-badge--${tone}`}>{children}</span>
}
