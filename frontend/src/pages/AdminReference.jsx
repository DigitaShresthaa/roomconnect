import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Placeholder from './Placeholder'
import { useAuth } from '../contexts/AuthContext'
import { apiDeleteAuth, apiGetAuth, apiPostAuth } from '../lib/api'

const sections = [
  { key: 'categories', label: 'Categories' },
  { key: 'provinces', label: 'Provinces' },
  { key: 'districts', label: 'Districts' },
  { key: 'localities', label: 'Localities' },
]

export default function AdminReference() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState([])
  const [name, setName] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '', success: '' })

  const active = useMemo(() => {
    const requestedSection = searchParams.get('section')
    if (sections.some((section) => section.key === requestedSection)) {
      return requestedSection
    }
    return 'categories'
  }, [searchParams])

  const load = async (section) => {
    setStatus({ loading: true, error: '', success: '' })
    try {
      const result = await apiGetAuth(`/api/v1/reference/${section}`)
      setData(result)
      setStatus({ loading: false, error: '', success: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' })
    }
  }

  const loadParentOptions = async () => {
    try {
      const [provinceData, districtData] = await Promise.all([
        apiGetAuth('/api/v1/reference/provinces'),
        apiGetAuth('/api/v1/reference/districts'),
      ])
      setProvinces(provinceData)
      setDistricts(districtData)
    } catch {
      setProvinces([])
      setDistricts([])
    }
  }

  const localityDistrictOptions = useMemo(() => {
    if (!provinceId) {
      return []
    }
    return districts.filter((district) => String(district.province_id) === provinceId)
  }, [districts, provinceId])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    if (!searchParams.get('section')) {
      setSearchParams({ section: 'categories' }, { replace: true })
      return
    }
    load(active)
    if (active === 'districts' || active === 'localities') {
      loadParentOptions()
    }
  }, [active, isAuthenticated, navigate, searchParams, setSearchParams])

  useEffect(() => {
    if (active !== 'localities') {
      return
    }
    if (districtId && !localityDistrictOptions.some((district) => String(district.id) === districtId)) {
      setDistrictId('')
    }
  }, [active, districtId, localityDistrictOptions])

  const handleCreate = async () => {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        setStatus({ loading: false, error: 'Name is required.', success: '' })
        return
      }

      const payload = { name: trimmedName, is_active: true }
      if (active === 'districts') {
        if (!provinceId) {
          setStatus({ loading: false, error: 'Please select a province.', success: '' })
          return
        }
        payload.province_id = Number(provinceId)
      }
      if (active === 'localities') {
        if (!provinceId) {
          setStatus({ loading: false, error: 'Please select a province.', success: '' })
          return
        }
        if (!districtId) {
          setStatus({ loading: false, error: 'Please select a district.', success: '' })
          return
        }
        payload.district_id = Number(districtId)
      }
      await apiPostAuth(`/api/v1/reference/${active}`, payload)
      setName('')
      setProvinceId('')
      setDistrictId('')
      load(active)
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiDeleteAuth(`/api/v1/reference/${active}/${id}`)
      load(active)
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' })
    }
  }

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Reference data</h2>
          <p>Manage the core lookup data for listings.</p>
        </div>
      </div>
      <div className="rc-tabs">
        {sections.map((section) => (
          <button
            key={section.key}
            className={`rc-tab${active === section.key ? ' active' : ''}`}
            onClick={() => setSearchParams({ section: section.key })}
          >
            {section.label}
          </button>
        ))}
      </div>
      <Card className="rc-card">
        <div className="rc-form rc-form--inline">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {active === 'districts' || active === 'localities' ? (
            <Select
              label="Province"
              name="province_id"
              value={provinceId}
              onChange={(event) => setProvinceId(event.target.value)}
            >
              <option value="">Select province</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </Select>
          ) : null}
          {active === 'localities' ? (
            <Select
              label="District"
              name="district_id"
              value={districtId}
              onChange={(event) => setDistrictId(event.target.value)}
              disabled={!provinceId}
            >
              <option value="">{provinceId ? 'Select district' : 'Select province first'}</option>
              {localityDistrictOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
        </div>
        {status.loading ? <p>Loading...</p> : null}
        {status.error ? <p className="rc-error">{status.error}</p> : null}
        {!status.loading && !status.error && data.length === 0 ? (
          <Placeholder
            title="No entries yet"
            message="Add reference data to help listing filters and forms."
          />
        ) : null}
        {data.length > 0 ? (
          <div className="rc-table">
            {data.map((item) => (
              <div key={item.id} className="rc-table__row">
                <span>{item.name}</span>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
