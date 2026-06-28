import Card from '../components/ui/Card'

export default function Placeholder({ title, message, children }) {
  return (
    <Card className="rc-placeholder">
      <h2>{title}</h2>
      <p>{message}</p>
      {children ? <div className="rc-placeholder__actions">{children}</div> : null}
    </Card>
  )
}
