import Button from '../components/ui/Button'
import Placeholder from './Placeholder'

export default function Error500() {
  return (
    <Placeholder
      title="Something went wrong"
      message="We hit an unexpected error. Try refreshing the page."
    >
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </Placeholder>
  )
}
