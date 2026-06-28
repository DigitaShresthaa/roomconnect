import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiPatchAuth, apiPostAuth } from '../lib/api'

export default function Profile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setUser } = useAuth()
  const [status, setStatus] = useState('')
  const [ratingSummary, setRatingSummary] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', role: 'seeker' })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    if (!user) return
    apiGet(`/api/v1/reviews/users/${user.id}/summary`)
      .then(setRatingSummary)
      .catch(() => setRatingSummary(null))
    setForm({
      full_name: user.full_name || '',
      role: user.role === 'owner' ? 'owner' : 'seeker',
    })
    setFieldErrors({})
    setIsEditing(false)
  }, [isAuthenticated, navigate, user])

  const canEditRole = user?.role === 'owner' || user?.role === 'seeker'

  const handleVerification = async () => {
    setStatus('Sending verification email...')
    try {
      const result = await apiPostAuth('/api/v1/auth/request-verification')
      if (result.status === 'already_verified') {
        setStatus('Your email is already verified.')
      } else {
        setStatus('Verification email sent. Check your inbox.')
      }
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setStatus('')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.full_name.trim()) {
      nextErrors.full_name = 'Name is required.'
    }
    if (!['owner', 'seeker'].includes(form.role)) {
      nextErrors.role = 'Role must be seeker or owner.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setStatus('')
    try {
      const updatedUser = await apiPatchAuth('/api/v1/auth/me', {
        full_name: form.full_name.trim(),
        role: form.role,
      })
      setUser(updatedUser)
      setStatus('Profile updated successfully.')
      setIsEditing(false)
    } catch (error) {
      const validationErrors = Array.isArray(error.payload?.detail)
        ? error.payload.detail.reduce((accumulator, item) => {
            if (item?.loc?.includes?.('full_name')) {
              accumulator.full_name = item.msg
            }
            if (item?.loc?.includes?.('role')) {
              accumulator.role = item.msg
            }
            return accumulator
          }, {})
        : {}
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors)
      } else {
        setStatus(error.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCancel = () => {
    setForm({
      full_name: user.full_name || '',
      role: user.role === 'owner' ? 'owner' : 'seeker',
    })
    setFieldErrors({})
    setStatus('')
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="rc-page">
      <div className="rc-profile-layout">
        <Card className="rc-profile-hero">
          <div className="rc-profile-hero__top">
            <div>
              <p className="rc-profile-kicker">Account overview</p>
              <h2>{user.full_name}</h2>
              <p className="rc-muted">Manage your account details and verification status.</p>
            </div>
            <div className="rc-profile-badges">
              <Badge tone="accent">{user.role}</Badge>
              <Badge tone={user.is_verified ? 'accent' : 'neutral'}>
                {user.is_verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>

          <div className="rc-profile-metrics">
            <div className="rc-profile-metric">
              <span className="rc-label">Your rating</span>
              <strong>
                {ratingSummary?.average_rating
                  ? `${ratingSummary.average_rating.toFixed(1)} / 5`
                  : 'New'}
              </strong>
              <span className="rc-muted">
                {ratingSummary?.review_count
                  ? `${ratingSummary.review_count} review${ratingSummary.review_count === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </span>
            </div>
            <div className="rc-profile-metric">
              <span className="rc-label">Verification</span>
              <strong>{user.is_verified ? 'Email verified' : 'Verification pending'}</strong>
              <span className="rc-muted">
                {user.is_verified ? 'Your account is fully active.' : 'Please verify to unlock full trust signals.'}
              </span>
            </div>
          </div>

          <div className="rc-profile-actions">
            {canEditRole ? (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing((current) => !current)}>
                {isEditing ? 'Close editor' : 'Edit Profile'}
              </Button>
            ) : null}
            {!user.is_verified ? (
              <Button size="sm" variant="secondary" onClick={handleVerification}>
                Send verification email
              </Button>
            ) : null}
            {status ? <p className="rc-muted" role="status">{status}</p> : null}
          </div>

          {isEditing && canEditRole ? (
            <form className="rc-profile-edit" onSubmit={handleEditSubmit}>
              <h3>Edit profile</h3>
              <div className="rc-profile-edit__grid">
                <Input
                  label="Name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleEditChange}
                  error={fieldErrors.full_name}
                />
                <Select
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={handleEditChange}
                  error={fieldErrors.role}
                >
                  <option value="seeker">Seeker</option>
                  <option value="owner">Owner</option>
                </Select>
              </div>
              <div className="rc-profile-edit__actions">
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={handleEditCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </Card>

        <Card className="rc-profile-details">
          <h3>Account details</h3>
          <div className="rc-profile-detail-grid">
            <div className="rc-profile-detail-item">
              <span className="rc-label">Name</span>
              <span>{user.full_name}</span>
            </div>
            <div className="rc-profile-detail-item">
              <span className="rc-label">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="rc-profile-detail-item">
              <span className="rc-label">Phone</span>
              <span>{user.phone}</span>
            </div>
            <div className="rc-profile-detail-item">
              <span className="rc-label">Role</span>
              <span>{user.role}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
