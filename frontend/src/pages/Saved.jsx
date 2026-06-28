import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ListingCard from '../components/listings/ListingCard'
import { apiGet, apiGetAuth } from '../lib/api'
import Placeholder from './Placeholder'
import { useAuth } from '../contexts/AuthContext'

export default function Saved() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', data: [] })
  const [categories, setCategories] = useState([])
  const categoryById = Object.fromEntries(categories.map((category) => [category.id, category.name]))

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    apiGetAuth('/api/v1/saved')
      .then((data) => setState({ loading: false, error: '', data }))
      .catch((error) => setState({ loading: false, error: error.message, data: [] }))
  }, [isAuthenticated, navigate])

  useEffect(() => {
    apiGet('/api/v1/reference/public/categories')
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Saved listings</h2>
          <p>Quick access to the rooms you bookmarked.</p>
        </div>
      </div>
      {state.loading ? <p>Loading saved listings...</p> : null}
      {state.error ? <p className="rc-error">{state.error}</p> : null}
      {!state.loading && !state.error && state.data.length === 0 ? (
        <Placeholder
          title="No saved listings yet"
          message="Save a listing to keep it handy for later."
        />
      ) : null}
      <div className="rc-listing-grid">
        {state.data.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            categoryName={categoryById[listing.category_id]}
            onView={() => navigate(`/listings/${listing.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
