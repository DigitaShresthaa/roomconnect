import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Card from '../components/ui/Card'
import { apiPost } from '../lib/api'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState({ loading: true, error: '', success: '' })

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus({ loading: false, error: 'Missing token.', success: '' })
      return
    }
    apiPost('/api/v1/auth/verify-email', { token })
      .then(() =>
        setStatus({ loading: false, error: '', success: 'Email verified.' })
      )
      .catch((error) =>
        setStatus({ loading: false, error: error.message, success: '' })
      )
  }, [params])

  return (
    <div className="rc-page">
      <Card className="rc-card rc-card--narrow">
        <h2>Email verification</h2>
        {status.loading ? <p>Verifying...</p> : null}
        {status.error ? <p className="rc-error">{status.error}</p> : null}
        {status.success ? <p className="rc-success">{status.success}</p> : null}
      </Card>
    </div>
  )
}
