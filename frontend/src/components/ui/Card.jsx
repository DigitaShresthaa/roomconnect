export default function Card({ children, className = '' }) {
  return <div className={`rc-card ${className}`}>{children}</div>
}
