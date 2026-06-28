import { useCallback, useEffect, useState } from 'react'
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
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({ full_name: '', role: 'seeker', locality_id: '' })
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [localities, setLocalities] = useState([])
  const [selectedProvinceId, setSelectedProvinceId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [localityName, setLocalityName] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    if (!user) return

    apiGet(`/api/v1/reviews/users/${user.id}/summary`)
      .then(setRatingSummary)
      .catch(() => setRatingSummary(null))

    apiGet('/api/v1/reference/public/provinces')
      .then(setProvinces)
      .catch(() => setProvinces([]))

    if (user.locality_id) {
      apiGet(`/api/v1/reference/public/localities/${user.locality_id}`)
        .then((loc) => setLocalityName(loc.name))
        .catch(() => setLocalityName(''))
    } else {
      setLocalityName('')
    }

    resetForm()
  }, [isAuthenticated, navigate, user])

  const resetForm = useCallback(() => {
    setForm({
      full_name: user?.full_name || '',
      role: user?.role === 'owner' ? 'owner' : 'seeker',
      locality_id: user?.locality_id ? String(user.locality_id) : '',
    })
    setSelectedProvinceId('')
    setSelectedDistrictId('')
    setDistricts([])
    setLocalities([])
    setFieldErrors({})
    setStatus('')
  }, [user])

  const startEditing = async () => {
    resetForm()
    if (user?.locality_id) {
      try {
        const locality = await apiGet(`/api/v1/reference/public/localities/${user.locality_id}`)
        if (!locality) return
        const did = String(locality.district_id)
        const allDistricts = await apiGet('/api/v1/reference/public/districts')
        const district = allDistricts.find((d) => d.id === locality.district_id)
        if (!district) return
        const pid = String(district.province_id)
        setSelectedProvinceId(pid)
        setDistricts(allDistricts.filter((d) => d.province_id === district.province_id))
        setSelectedDistrictId(did)
        setLocalities(await apiGet(`/api/v1/reference/public/localities?district_id=${locality.district_id}`))
      } catch {
        /* user can re-select from scratch */
      }
    }
    setIsEditing(true)
  }

  const handleProvinceChange = (e) => {
    const pid = e.target.value
    setSelectedProvinceId(pid)
    setSelectedDistrictId('')
    setLocalities([])
    setForm((prev) => ({ ...prev, locality_id: '' }))
    if (pid) {
      apiGet(`/api/v1/reference/public/districts?province_id=${pid}`)
        .then(setDistricts)
        .catch(() => setDistricts([]))
    } else {
      setDistricts([])
    }
  }

  const handleDistrictChange = (e) => {
    const did = e.target.value
    setSelectedDistrictId(did)
    setLocalities([])
    setForm((prev) => ({ ...prev, locality_id: '' }))
    if (did) {
      apiGet(`/api/v1/reference/public/localities?district_id=${did}`)
        .then(setLocalities)
        .catch(() => setLocalities([]))
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setStatus('')
  }

  const canEditRole = user?.role === 'owner' || user?.role === 'seeker'

  const handleVerification = async () => {
    setStatus('Sending verification email…')
    try {
      const result = await apiPostAuth('/api/v1/auth/request-verification')
      setStatus(result.status === 'already_verified'
        ? 'Your email is already verified.'
        : 'Verification email sent. Check your inbox.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!form.full_name.trim()) nextErrors.full_name = 'Name is required.'
    if (!['owner', 'seeker'].includes(form.role)) nextErrors.role = 'Role must be seeker or owner.'
    if (Object.keys(nextErrors).length > 0) { setFieldErrors(nextErrors); return }

    setIsSaving(true)
    setStatus('')
    try {
      const updatedUser = await apiPatchAuth('/api/v1/auth/me', {
        full_name: form.full_name.trim(),
        role: form.role,
        locality_id: form.locality_id ? Number(form.locality_id) : null,
      })
      setUser(updatedUser)
      setStatus('Profile updated.')
      setIsEditing(false)
    } catch (error) {
      const validationErrors = Array.isArray(error.payload?.detail)
        ? error.payload.detail.reduce((acc, item) => {
            if (item?.loc?.includes?.('full_name')) acc.full_name = item.msg
            if (item?.loc?.includes?.('role')) acc.role = item.msg
            return acc
          }, {})
        : {}
      Object.keys(validationErrors).length > 0 ? setFieldErrors(validationErrors) : setStatus(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => { resetForm(); setIsEditing(false) }

  if (!user) return null

  return (
    <div className="rc-page">
      <div className="rc-profile">
        <Card>
          <div className="rc-profile-header">
            <div className="rc-profile-avatar">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="rc-profile-header__info">
              <h2>{user.full_name}</h2>
              <p className="rc-profile-header__email">{user.email}</p>
              <div className="rc-profile-header__badges">
                <Badge tone="accent">{user.role}</Badge>
                <Badge tone={user.is_verified ? 'accent' : 'neutral'}>
                  {user.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            <div className="rc-profile-header__actions">
              {canEditRole ? (
                <Button size="sm" variant="secondary" onClick={isEditing ? handleCancel : startEditing}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              ) : null}
              {!user.is_verified ? (
                <Button size="sm" variant="secondary" onClick={handleVerification}>
                  Verify
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rc-profile-stats">
            <div className="rc-profile-stat">
              <span className="rc-profile-stat__label">Rating</span>
              <span className="rc-profile-stat__value">
                {ratingSummary?.average_rating ? `${ratingSummary.average_rating.toFixed(1)} / 5` : 'New'}
              </span>
              <span className="rc-profile-stat__sub">
                {ratingSummary?.review_count
                  ? `${ratingSummary.review_count} review${ratingSummary.review_count === 1 ? '' : 's'}`
                  : 'No reviews yet'}
              </span>
            </div>
            <div className="rc-profile-stat">
              <span className="rc-profile-stat__label">Phone</span>
              <span className="rc-profile-stat__value">{user.phone}</span>
              <span className="rc-profile-stat__sub">Contact number</span>
            </div>
            <div className="rc-profile-stat">
              <span className="rc-profile-stat__label">Verification</span>
              <span className="rc-profile-stat__value">
                {user.is_verified ? 'Email verified' : 'Pending'}
              </span>
              <span className="rc-profile-stat__sub">
                {user.is_verified ? 'Fully active' : 'Verify to unlock trust signals'}
              </span>
            </div>
          </div>

          {status ? <p className="rc-profile-status" role="status">{status}</p> : null}
        </Card>

        <Card className="rc-profile-details">
          {isEditing && canEditRole ? (
            <form className="rc-profile-edit" onSubmit={handleEditSubmit}>
              <h3>Edit profile</h3>

              <div className="rc-profile-edit__grid">
                <Input
                  label="Full name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleEditChange}
                  error={fieldErrors.full_name}
                />
                <Select label="Role" name="role" value={form.role} onChange={handleEditChange} error={fieldErrors.role}>
                  <option value="seeker">Seeker</option>
                  <option value="owner">Owner</option>
                </Select>
              </div>

              <div className="rc-profile-edit__section">
                <span className="rc-profile-edit__section-title">Location</span>
                <div className="rc-profile-edit__location-grid">
                  <Select label="Province" name="province" value={selectedProvinceId} onChange={handleProvinceChange}>
                    <option value="">— Select —</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  <Select
                    label="District"
                    name="district"
                    value={selectedDistrictId}
                    onChange={handleDistrictChange}
                    disabled={!selectedProvinceId}
                  >
                    <option value="">— Select —</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                  <Select
                    label="Locality"
                    name="locality_id"
                    value={form.locality_id}
                    onChange={handleEditChange}
                    disabled={!selectedDistrictId}
                  >
                    <option value="">— Select —</option>
                    {localities.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </Select>
                </div>
                {(user.locality_id || form.locality_id) && (
                  <button type="button" className="rc-btn-link rc-profile-edit__clear" onClick={() => {
                    setForm((prev) => ({ ...prev, locality_id: '' }))
                    setSelectedProvinceId('')
                    setSelectedDistrictId('')
                    setDistricts([])
                    setLocalities([])
                  }}>
                    Clear location
                  </button>
                )}
              </div>

              <div className="rc-profile-edit__actions">
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h3>Account details</h3>
              <div className="rc-profile-detail-grid">
                <div className="rc-profile-detail-item">
                  <span className="rc-label">Full name</span>
                  <span className="rc-profile-detail-item__value">{user.full_name}</span>
                </div>
                <div className="rc-profile-detail-item">
                  <span className="rc-label">Email</span>
                  <span className="rc-profile-detail-item__value">{user.email}</span>
                </div>
                <div className="rc-profile-detail-item">
                  <span className="rc-label">Phone</span>
                  <span className="rc-profile-detail-item__value">{user.phone}</span>
                </div>
                <div className="rc-profile-detail-item">
                  <span className="rc-label">Role</span>
                  <span className="rc-profile-detail-item__value">{user.role}</span>
                </div>
                <div className="rc-profile-detail-item">
                  <span className="rc-label">Location</span>
                  <span className="rc-profile-detail-item__value">
                    {localityName || 'Not set'}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
