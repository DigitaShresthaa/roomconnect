export default function Skeleton({ height = 16, width = '100%' }) {
  return (
    <span
      className="rc-skeleton"
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}
