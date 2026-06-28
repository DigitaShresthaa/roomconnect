import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Placeholder from './Placeholder'
import { useAuth } from '../contexts/AuthContext'
import { apiDeleteAuth, apiGetAuth, apiPatchAuth } from '../lib/api'
import { getListingCoverUrl } from '../components/listings/media'

export default function AdminListings() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', data: [] })

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      const data = await apiGetAuth('/api/v1/listings/admin/all')
      setState({ loading: false, error: '', data })
    } catch (error) {
      setState({ loading: false, error: error.message, data: [] })
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    load()
  }, [isAuthenticated, navigate])

  const toggleHidden = async (listing) => {
    await apiPatchAuth(`/api/v1/listings/${listing.id}/hide`, {
      is_hidden: !listing.is_hidden,
    })
    await load()
  }

  const removeListing = async (listing) => {
    await apiDeleteAuth(`/api/v1/listings/${listing.id}`)
    await load()
  }

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Listings moderation</h2>
          <p>Hide or remove listings that violate guidelines.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>
      {state.loading ? <p>Loading listings...</p> : null}
      {state.error ? <p className="rc-error">{state.error}</p> : null}
      {!state.loading && !state.error && state.data.length === 0 ? (
        <Placeholder
          title="No listings to review"
          message="New listings will appear here for moderation."
        />
      ) : null}
      <div className="rc-listing-grid">
        {state.data.map((listing) => (
          <Card key={listing.id} className="rc-listing-card">
            <div className="rc-listing-card__cover">
              {getListingCoverUrl(listing) ? (
                <img src={getListingCoverUrl(listing)} alt={listing.title} loading="lazy" />
              ) : (
                <div className="rc-listing-card__cover-placeholder">No image yet</div>
              )}
            </div>
            <div className="rc-listing-card__header">
              <Badge tone={listing.is_available ? 'accent' : 'neutral'}>
                {listing.is_available ? 'Available' : 'Unavailable'}
              </Badge>
              <Badge tone={listing.is_hidden ? 'neutral' : 'accent'}>
                {listing.is_hidden ? 'Hidden' : 'Visible'}
              </Badge>
            </div>
            <h3>{listing.title}</h3>
            <p className="rc-muted">Owner #{listing.owner_id}</p>
            <div className="rc-listing-card__actions">
              <Button size="sm" variant="secondary" onClick={() => toggleHidden(listing)}>
                {listing.is_hidden ? 'Unhide' : 'Hide'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => removeListing(listing)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
