import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { apiGet, apiPost } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'seeker',
    locality_id: '',
  })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })
  const [errors, setErrors] = useState({})
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [localities, setLocalities] = useState([])
  const [selectedProvinceId, setSelectedProvinceId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')

  useEffect(() => {
    apiGet('/api/v1/reference/public/provinces')
      .then(setProvinces)
      .catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    setSelectedDistrictId('')
    setDistricts([])
    setLocalities([])
    setForm((prev) => ({ ...prev, locality_id: '' }))
    if (!selectedProvinceId) return
    apiGet(`/api/v1/reference/public/districts?province_id=${selectedProvinceId}`)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [selectedProvinceId])

  useEffect(() => {
    setLocalities([])
    setForm((prev) => ({ ...prev, locality_id: '' }))
    if (!selectedDistrictId) return
    apiGet(`/api/v1/reference/public/localities?district_id=${selectedDistrictId}`)
      .then(setLocalities)
      .catch(() => setLocalities([]))
  }, [selectedDistrictId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleProvinceChange = (event) => {
    setSelectedProvinceId(event.target.value)
  }

  const handleDistrictChange = (event) => {
    setSelectedDistrictId(event.target.value)
  }

  const handleLocalityChange = (event) => {
    setForm((prev) => ({ ...prev, locality_id: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })
    setErrors({})

    const nextErrors = {}
    const nameVal = form.full_name?.trim() || ''
    if (!nameVal) {
      nextErrors.full_name = 'Please enter your full name.'
    } else if (!/^[A-Za-z ]+$/.test(nameVal)) {
      nextErrors.full_name = 'Name may contain letters and spaces only.'
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    const phoneVal = form.phone?.trim() || ''
    if (!/^[0-9]{10}$/.test(phoneVal)) {
      nextErrors.phone = 'Phone must be exactly 10 digits.'
    } else if (!/^9[0-9]{9}$/.test(phoneVal)) {
      nextErrors.phone = 'Phone number must start with 9.'
    }
    const pwd = form.password || ''
    if (pwd.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    } else if (!/[A-Z]/.test(pwd) || !/\d/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
      nextErrors.password = 'Password must include at least one uppercase letter, one number, and one special character.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setStatus((s) => ({ ...s, loading: false }))
      setErrors(nextErrors)
      return
    }
    const payload = {
      ...form,
      locality_id: form.locality_id ? Number(form.locality_id) : null,
    }
    try {
      await apiPost('/api/v1/auth/register', payload)
      setStatus({ loading: false, error: '', success: 'Account created. Check email to verify.' })
      navigate('/auth/login')
    } catch (error) {
      setStatus((s) => ({ ...s, loading: false }))
      if (error.payload && Array.isArray(error.payload.detail)) {
        const fieldErrors = {}
        error.payload.detail.forEach((item) => {
          const loc = item.loc || []
          const field = loc.length > 0 ? loc[loc.length - 1] : null
          if (field && typeof field === 'string') {
            fieldErrors[field] = item.msg || item.message || String(item)
          }
        })
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          return
        }
      }
      const msg = error.message || ''
      if (/email/i.test(msg)) {
        setErrors({ email: msg })
        return
      }
      if (/phone/i.test(msg)) {
        setErrors({ phone: msg })
        return
      }
      setStatus({ loading: false, error: msg, success: '' })
    }
  }

  return (
    <div className="rc-page rc-auth">
      <Card className="rc-card rc-card--narrow">
        <h2>Create your RoomConnect account</h2>
        <p className="rc-muted">Verification is optional and can be done later.</p>
        <form className="rc-form" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            error={errors.full_name}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <Select label="Role" name="role" value={form.role} onChange={handleChange}>
            <option value="seeker">Room seeker</option>
            <option value="owner">Property owner</option>
          </Select>
          <Select label="Province" name="province" value={selectedProvinceId} onChange={handleProvinceChange}>
            <option value="">-- Select province --</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select label="District" name="district" value={selectedDistrictId} onChange={handleDistrictChange} disabled={!selectedProvinceId}>
            <option value="">-- Select district --</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select label="Locality" name="locality_id" value={form.locality_id} onChange={handleLocalityChange} disabled={!selectedDistrictId}>
            <option value="">-- Select locality --</option>
            {localities.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
          {status.error ? <p className="rc-error">{status.error}</p> : null}
          {status.success ? <p className="rc-success">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>
            {status.loading ? 'Creating...' : 'Create account'}
          </Button>
        </form>
        <p className="rc-muted">
          Already have an account? <Link to="/auth/login">Login</Link>
        </p>
      </Card>
    </div>
  )
}
