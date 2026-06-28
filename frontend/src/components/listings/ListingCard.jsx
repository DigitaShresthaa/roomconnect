import { useEffect, useState } from 'react'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { getListingCoverUrl } from './media'

export default function ListingCard({ listing, onView, onSave, saved, categoryName }) {
  const [imageOpen, setImageOpen] = useState(false)
  const price = `Rs. ${listing.price_amount} / ${listing.price_period}`
  const coverUrl = getListingCoverUrl(listing)
  const ratingLabel = listing.owner_rating_count
    ? `${listing.owner_rating_avg?.toFixed(1)} / 5`
    : 'New'
  const categoryLabel = categoryName || listing.category_name || (listing.category_id ? `Category #${listing.category_id}` : null)

  useEffect(() => {
    if (!imageOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setImageOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageOpen])

  return (
    <>
      <Card className="rc-listing-card">
        <button
          type="button"
          className="rc-listing-card__cover rc-listing-card__cover--button"
          onClick={() => coverUrl && setImageOpen(true)}
          aria-label={coverUrl ? `Open larger image for ${listing.title}` : `No image for ${listing.title}`}
          disabled={!coverUrl}
        >
        {coverUrl ? (
          <img src={coverUrl} alt={listing.title} loading="lazy" />
        ) : (
          <div className="rc-listing-card__cover-placeholder">No image yet</div>
        )}
        </button>
        <div className="rc-listing-card__header">
          <Badge tone={listing.is_available ? 'accent' : 'neutral'}>
            {listing.is_available ? 'Available' : 'Unavailable'}
          </Badge>
          {categoryLabel ? <Badge>{categoryLabel}</Badge> : null}
        </div>
        <h3>{listing.title}</h3>
        <p className="rc-listing-card__meta">{price}</p>
        <div className="rc-listing-card__facts">
          <span>{`${listing.bedrooms} bed`}</span>
          <span>{`${listing.bathrooms} bath`}</span>
          {listing.halls ? <span>{`${listing.halls} hall`}</span> : null}
          {listing.kitchens ? <span>{`${listing.kitchens} kitchen`}</span> : null}
          {listing.size_value ? <span>{`${listing.size_value} sq ft`}</span> : null}
        </div>
        <div className="rc-rating">
          <span className="rc-rating__label">Owner rating</span>
          <span className="rc-rating__value">
            {ratingLabel}
            {listing.owner_rating_count ? ` (${listing.owner_rating_count})` : ''}
          </span>
        </div>
        <p className="rc-listing-card__desc">{listing.description || 'No description yet.'}</p>
        <div className="rc-listing-card__actions">
          <Button size="sm" onClick={onView}>
            View details
          </Button>
          {onSave ? (
            <Button size="sm" variant="secondary" onClick={onSave}>
              {saved ? 'Unsave' : 'Save'}
            </Button>
          ) : null}
        </div>
      </Card>

      {imageOpen && coverUrl ? (
        <div className="rc-lightbox" role="dialog" aria-modal="true" aria-label={listing.title} onClick={() => setImageOpen(false)}>
          <button type="button" className="rc-lightbox__close" onClick={() => setImageOpen(false)} aria-label="Close image preview">
            Close
          </button>
          <img
            src={coverUrl}
            alt={listing.title}
            className="rc-lightbox__image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
