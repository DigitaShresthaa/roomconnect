import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ListingCard from '../components/listings/ListingCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Placeholder from './Placeholder'
import Select from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { apiDeleteAuth, apiGet, apiGetAuth, apiPostAuth } from '../lib/api'

export default function Listings() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const initialFilters = {
    q: '',
    min_price: '',
    max_price: '',
    min_size: '',
    max_size: '',
    category_id: '',
    province_id: '',
    district_id: '',
    locality_id: '',
  }
  const [filters, setFilters] = useState(initialFilters)
  const [state, setState] = useState({ loading: true, error: '', data: [] })
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedIds, setSavedIds] = useState([])
  const [saveNotice, setSaveNotice] = useState('')
  const canNext = state.data.length === 12
  const [categories, setCategories] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [localities, setLocalities] = useState([])
  const categoryById = Object.fromEntries(categories.map((category) => [category.id, category.name]))

  const syncFiltersToQuery = (nextFilters, nextPage = 1) => {
    const params = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })
    params.set('page', String(nextPage))
    params.set('page_size', '12')
    return params
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const nextFilters = { ...initialFilters }
    Object.keys(nextFilters).forEach((key) => {
      const value = params.get(key)
      if (value !== null) {
        nextFilters[key] = value
      }
    })
    const nextPage = Number(params.get('page') || '1')
    setFilters(nextFilters)
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1)
  }, [location.search])

  const fetchListings = async (targetPage = 1, filterOverrides = null) => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    const params = new URLSearchParams()
    const useFilters = filterOverrides ?? filters
    Object.entries(useFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set('page', String(targetPage))
    params.set('page_size', '12')
    try {
      const data = await apiGet(`/api/v1/listings?${params.toString()}`)
      setState({ loading: false, error: '', data })
      setPage(targetPage)
    } catch (error) {
      setState({ loading: false, error: error.message, data: [] })
    }
  }

  useEffect(() => {
    fetchListings(page, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters])

  useEffect(() => {
    apiGet('/api/v1/reference/public/categories').then(setCategories).catch(() => setCategories([]))
    apiGet('/api/v1/reference/public/provinces').then(setProvinces).catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    if (!filters.province_id) {
      setDistricts([])
      setLocalities([])
      return
    }
    apiGet(`/api/v1/reference/public/districts?province_id=${filters.province_id}`)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [filters.province_id])

  useEffect(() => {
    if (!filters.district_id) {
      setLocalities([])
      return
    }
    apiGet(`/api/v1/reference/public/localities?district_id=${filters.district_id}`)
      .then(setLocalities)
      .catch(() => setLocalities([]))
  }, [filters.district_id])

  useEffect(() => {
    if (!isAuthenticated) return
    apiGetAuth('/api/v1/saved')
      .then((data) => setSavedIds(data.map((item) => item.id)))
      .catch(() => setSavedIds([]))
  }, [isAuthenticated])

  const handleChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    navigate('/listings', { replace: true })
    fetchListings(1, initialFilters)
  }

  const applyFilters = () => {
    navigate(`/listings?${syncFiltersToQuery(filters, 1).toString()}`, { replace: true })
  }

  const gotoPage = (targetPage) => {
    navigate(`/listings?${syncFiltersToQuery(filters, targetPage).toString()}`)
  }

  const handleSave = async (listingId) => {
    if (!isAuthenticated) {
      setSaveNotice('Please log in to save listings.')
      return
    }
    setSaveNotice('')
    if (savedIds.includes(listingId)) {
      await apiDeleteAuth(`/api/v1/saved/${listingId}`)
      setSavedIds((prev) => prev.filter((id) => id !== listingId))
    } else {
      await apiPostAuth(`/api/v1/saved/${listingId}`)
      setSavedIds((prev) => [...prev, listingId])
    }
  }

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Listings</h2>
          <p>Browse available rooms with clear pricing and availability.</p>
        </div>
        <div className="rc-page__actions">
          <Button
            variant="ghost"
            size="sm"
            className="rc-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="listing-filters"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            {filtersOpen ? 'Hide filters' : 'Filters'}
          </Button>
          <Button variant="secondary" onClick={() => fetchListings(page)}>
            Refresh
          </Button>
        </div>
      </div>

      <Card
        id="listing-filters"
        className={`rc-filter rc-filter-panel${filtersOpen ? ' is-open' : ''}`}
      >
        <Input
          label="Keyword"
          name="q"
          value={filters.q}
          onChange={handleChange}
          placeholder="Search by title or description"
        />
        <Input
          label="Min price"
          name="min_price"
          value={filters.min_price}
          onChange={handleChange}
          type="number"
        />
        <Input
          label="Max price"
          name="max_price"
          value={filters.max_price}
          onChange={handleChange}
          type="number"
        />
        <Input
          label="Min size"
          name="min_size"
          value={filters.min_size}
          onChange={handleChange}
          type="number"
        />
        <Input
          label="Max size"
          name="max_size"
          value={filters.max_size}
          onChange={handleChange}
          type="number"
        />
        <Select label="Category" name="category_id" value={filters.category_id} onChange={handleChange}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select label="Province" name="province_id" value={filters.province_id} onChange={handleChange}>
          <option value="">All provinces</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </Select>
        <Select label="District" name="district_id" value={filters.district_id} onChange={handleChange}>
          <option value="">All districts</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </Select>
        <Select label="Locality" name="locality_id" value={filters.locality_id} onChange={handleChange}>
          <option value="">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>
              {locality.name}
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button size="sm" variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      </Card>

      {state.loading ? <p>Loading listings...</p> : null}
      {state.error ? <p className="rc-error">{state.error}</p> : null}
      {!state.loading && !state.error && state.data.length === 0 ? (
        <Placeholder
          title="No listings yet"
          message="Try adjusting filters or check back later."
        />
      ) : null}

      <div className="rc-listing-grid">
        {state.data.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            categoryName={categoryById[listing.category_id]}
            onView={() => navigate(`/listings/${listing.id}`)}
              onSave={() => handleSave(listing.id)}
            saved={savedIds.includes(listing.id)}
          />
        ))}
        {saveNotice ? <p className="rc-muted" role="status">{saveNotice}</p> : null}
      </div>
      <div className="rc-pagination">
        <Button size="sm" variant="secondary" onClick={() => gotoPage(page - 1)} disabled={page === 1}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button size="sm" variant="secondary" onClick={() => gotoPage(page + 1)} disabled={!canNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
