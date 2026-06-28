import { Link } from 'react-router-dom'

import Button from '../components/ui/Button'
import Placeholder from './Placeholder'

export default function NotFound() {
  return (
    <Placeholder
      title="Page not found"
      message="The page you are looking for does not exist."
    >
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </Placeholder>
  )
}
