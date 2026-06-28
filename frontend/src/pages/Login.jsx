import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPost } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })
    try {
      const tokenResponse = await apiPost('/api/v1/auth/login', form)
      login(tokenResponse.access_token)
      const profile = await apiGetAuth('/api/v1/auth/me')
      login(tokenResponse.access_token, profile)
      setStatus({ loading: false, error: '', success: 'Logged in.' })
      navigate(profile?.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' })
    }
  }

  return (
    <div className="rc-page rc-auth">
      <Card className="rc-card rc-card--narrow">
        <h2>Welcome back</h2>
        <p className="rc-muted">Log in to manage listings or message owners.</p>
        <form className="rc-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {status.error ? <p className="rc-error">{status.error}</p> : null}
          {status.success ? <p className="rc-success">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>
            {status.loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="rc-muted">
          New here? <Link to="/auth/register">Create an account</Link>
        </p>
      </Card>
    </div>
  )
}
