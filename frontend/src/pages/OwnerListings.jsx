import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Placeholder from './Placeholder'
import { useAuth } from '../contexts/AuthContext'
import { apiDeleteAuth, apiPatchAuth, apiPostAuth, apiGetAuth, apiPutAuth } from '../lib/api'
import { getListingCoverUrl } from '../components/listings/media'

export default function OwnerListings() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', data: [] })

  const loadListings = () => {
    apiGetAuth('/api/v1/listings/owner')
      .then((data) => setState({ loading: false, error: '', data }))
      .catch((error) => setState({ loading: false, error: error.message, data: [] }))
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    loadListings()
  }, [isAuthenticated, navigate])

  const toggleAvailability = async (listing) => {
    await apiPutAuth(`/api/v1/listings/${listing.id}`, {
      is_available: !listing.is_available,
    })
    loadListings()
  }

  const toggleHidden = async (listing) => {
    await apiPatchAuth(`/api/v1/listings/${listing.id}/hide`, {
      is_hidden: !listing.is_hidden,
    })
    loadListings()
  }

  const deleteListing = async (listing) => {
    const confirmed = window.confirm(`Delete "${listing.title}"? This cannot be undone.`)
    if (!confirmed) return

    await apiDeleteAuth(`/api/v1/listings/${listing.id}`)
    loadListings()
  }

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Your listings</h2>
          <p>Manage availability, media, and pricing.</p>
        </div>
        <Link to="/owner/listings/new">
          <Button>Create listing</Button>
        </Link>
      </div>
      {state.loading ? <p>Loading listings...</p> : null}
      {state.error ? <p className="rc-error">{state.error}</p> : null}
      {!state.loading && !state.error && state.data.length === 0 ? (
        <Placeholder
          title="No listings yet"
          message="Create your first listing to start receiving inquiries."
        />
      ) : null}
      <div className="rc-owner-grid">
        {state.data.map((listing) => (
          <Card key={listing.id} className="rc-owner-card">
            <Link className="rc-owner-card__view" to={`/listings/${listing.id}`} aria-label={`View ${listing.title}`}>
              <div className="rc-listing-card__cover">
                {getListingCoverUrl(listing) ? (
                  <img src={getListingCoverUrl(listing)} alt={listing.title} loading="lazy" />
                ) : (
                  <div className="rc-listing-card__cover-placeholder">No image yet</div>
                )}
              </div>
              <h3>{listing.title}</h3>
              <p className="rc-muted">{listing.description || 'No description.'}</p>
            </Link>
            <div className="rc-owner-card__actions">
              <Link to={`/owner/listings/${listing.id}/edit`}>
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => toggleAvailability(listing)}>
                {listing.is_available ? 'Mark unavailable' : 'Mark available'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleHidden(listing)}>
                {listing.is_hidden ? 'Unhide' : 'Hide'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteListing(listing)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
