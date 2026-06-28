import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { apiDeleteAuth, apiGet, apiGetAuth, apiPatchAuth, apiPostAuth, apiPutAuth, BASE_URL } from '../lib/api'
import { getFirstImagePath, getListingCoverUrl, getMediaUrl } from '../components/listings/media'

export default function ListingDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [listing, setListing] = useState(null)
  const [media, setMedia] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [localities, setLocalities] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [action, setAction] = useState('')
  const [saved, setSaved] = useState(false)
  const [reviewSummary, setReviewSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: '5', review_text: '' })
  const [reviewStatus, setReviewStatus] = useState('')
  const [myReviewId, setMyReviewId] = useState(null)

  useEffect(() => {
    const load = async () => {
      setStatus({ loading: true, error: '' })
      try {
        const data = await apiGet(`/api/v1/listings/${id}`)
        const mediaData = await apiGet(`/api/v1/listings/${id}/media`)
        setListing(data)
        setMedia(mediaData)
        setStatus({ loading: false, error: '' })
        apiGetAuth('/api/v1/saved')
          .then((savedList) => {
            const isSaved = savedList.some((item) => item.id === Number(id))
            setSaved(isSaved)
          })
          .catch(() => setSaved(false))

        apiGet(`/api/v1/reviews/users/${data.owner_id}/summary`)
          .then(setReviewSummary)
          .catch(() => setReviewSummary(null))
        apiGet(`/api/v1/reviews/users/${data.owner_id}?page=1&page_size=5`)
          .then(setReviews)
          .catch(() => setReviews([]))

        if (isAuthenticated && user?.id && user.id !== data.owner_id) {
          apiGetAuth(`/api/v1/reviews/users/${data.owner_id}/mine`)
            .then((existing) => {
              if (existing) {
                setMyReviewId(existing.id)
                setReviewForm({
                  rating: String(existing.rating),
                  review_text: existing.review_text || '',
                })
              }
            })
            .catch(() => null)
        }
      } catch (error) {
        setStatus({ loading: false, error: error.message })
      }
    }
    load()
  }, [id, isAuthenticated, user])

  useEffect(() => {
    apiGet('/api/v1/reference/public/provinces')
      .then(setProvinces)
      .catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    apiGet('/api/v1/reference/public/categories')
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (lightboxIndex === null) return undefined

    const imageCount = media.filter((item) => item.media_type === 'image').length || (heroImageUrl ? 1 : 0)
    if (imageCount === 0) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null)
      }
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) => (current === null ? current : (current - 1 + imageCount) % imageCount))
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex((current) => (current === null ? current : (current + 1) % imageCount))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, media])

  useEffect(() => {
    if (!listing?.province_id) {
      setDistricts([])
      return
    }
    apiGet(`/api/v1/reference/public/districts?province_id=${listing.province_id}`)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [listing?.province_id])

  useEffect(() => {
    if (!listing?.district_id) {
      setLocalities([])
      return
    }
    apiGet(`/api/v1/reference/public/localities?district_id=${listing.district_id}`)
      .then(setLocalities)
      .catch(() => setLocalities([]))
  }, [listing?.district_id])

  const handleInquiry = async () => {
    if (!isAuthenticated) {
      setAction('Please log in to send inquiries.')
      return
    }
    setAction('Sending inquiry...')
    try {
      const inquiry = await apiPostAuth(`/api/v1/inquiries/${id}`)
      navigate(`/inbox?inquiry=${inquiry.id}`)
    } catch (error) {
      setAction(error.message)
    }
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      setAction('Please log in to save listings.')
      return
    }
    try {
      if (saved) {
        await apiDeleteAuth(`/api/v1/saved/${id}`)
        setSaved(false)
      } else {
        await apiPostAuth(`/api/v1/saved/${id}`)
        setSaved(true)
      }
    } catch (error) {
      setAction(error.message)
    }
  }

  const handleEdit = () => {
    navigate(`/owner/listings/${id}/edit`)
  }

  const handleToggleAvailability = async () => {
    if (!listing) return
    setAction(listing.is_available ? 'Marking unavailable...' : 'Marking available...')
    try {
      await apiPutAuth(`/api/v1/listings/${id}`, {
        is_available: !listing.is_available,
      })
      const updated = await apiGet(`/api/v1/listings/${id}`)
      setListing(updated)
      setAction(listing.is_available ? 'Listing marked unavailable.' : 'Listing marked available.')
    } catch (error) {
      setAction(error.message)
    }
  }

  const handleToggleHidden = async () => {
    if (!listing) return
    setAction(listing.is_hidden ? 'Unhiding listing...' : 'Hiding listing...')
    try {
      await apiPatchAuth(`/api/v1/listings/${id}/hide`, {
        is_hidden: !listing.is_hidden,
      })
      const updated = await apiGet(`/api/v1/listings/${id}`)
      setListing(updated)
      setAction(listing.is_hidden ? 'Listing is now visible.' : 'Listing is now hidden.')
    } catch (error) {
      setAction(error.message)
    }
  }

  const handleDelete = async () => {
    if (!listing) return
    const confirmed = window.confirm(`Delete "${listing.title}"? This cannot be undone.`)
    if (!confirmed) return

    setAction('Deleting listing...')
    try {
      await apiDeleteAuth(`/api/v1/listings/${id}`)
      navigate('/owner/listings')
    } catch (error) {
      setAction(error.message)
    }
  }

  const handleReviewSubmit = async () => {
    if (!listing) return
    setReviewStatus('Submitting review...')
    try {
      const review = await apiPostAuth(`/api/v1/reviews/users/${listing.owner_id}`, {
        rating: Number(reviewForm.rating),
        review_text: reviewForm.review_text || null,
      })
      setMyReviewId(review.id)
      setReviewStatus(myReviewId ? 'Review updated.' : 'Review submitted.')
      apiGet(`/api/v1/reviews/users/${listing.owner_id}/summary`)
        .then(setReviewSummary)
        .catch(() => setReviewSummary(null))
      apiGet(`/api/v1/reviews/users/${listing.owner_id}?page=1&page_size=5`)
        .then(setReviews)
        .catch(() => setReviews([]))
    } catch (error) {
      setReviewStatus(error.message)
    }
  }

  if (status.loading) return <p>Loading listing...</p>
  if (status.error) return <p className="rc-error">{status.error}</p>
  if (!listing) return null
  const heroImageUrl = getMediaUrl(getFirstImagePath(media)) || getListingCoverUrl(listing)
  const isOwner = Boolean(isAuthenticated && user?.id && listing.owner_id === user.id)
  const canSendInquiry = !isOwner
  const imageItems = media
    .filter((item) => item.media_type === 'image')
    .map((item) => ({
      id: item.id,
      src: `${BASE_URL}/${item.file_path}`,
      alt: `${listing.title} image`,
    }))
  const lightboxItems = imageItems.length
    ? imageItems
    : heroImageUrl
      ? [{ id: 'hero', src: heroImageUrl, alt: listing.title }]
      : []
  const imageIndexById = new Map(imageItems.map((item, index) => [item.id, index]))
  const provinceName = provinces.find((province) => province.id === listing.province_id)?.name
  const districtName = districts.find((district) => district.id === listing.district_id)?.name
  const localityName = localities.find((locality) => locality.id === listing.locality_id)?.name
  const categoryName = categories.find((category) => category.id === listing.category_id)?.name
  const locationLabel = [localityName, districtName, provinceName]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <div className="rc-page__header-badges">
            <Badge tone={listing.is_available ? 'accent' : 'neutral'}>
              {listing.is_available ? 'Available' : 'Unavailable'}
            </Badge>
            {categoryName ? <Badge>{categoryName}</Badge> : null}
          </div>
          <h2>{listing.title}</h2>
        </div>
        <div className="rc-price">Rs. {listing.price_amount} / {listing.price_period}</div>
      </div>

      {heroImageUrl ? (
        <Card className="rc-listing-hero">
          <button
            type="button"
            className="rc-listing-hero__button"
            onClick={() => setLightboxIndex(0)}
            aria-label={`Open larger image for ${listing.title}`}
          >
            <img src={heroImageUrl} alt={listing.title} className="rc-listing-hero__image" />
          </button>
        </Card>
      ) : null}

      <div className="rc-media-grid">
        {media.length === 0 ? <p className="rc-muted">No media yet.</p> : null}
        {media.map((item) => (
          <Card key={item.id} className="rc-media-card">
            {item.media_type === 'image' ? (
              <button
                type="button"
                className="rc-media-card__button"
                onClick={() => setLightboxIndex(imageIndexById.get(item.id) ?? 0)}
                aria-label="Open larger listing image"
              >
                <img src={`${BASE_URL}/${item.file_path}`} alt="Listing media" />
              </button>
            ) : (
              <video controls src={`${BASE_URL}/${item.file_path}`} />
            )}
          </Card>
        ))}
      </div>

      {lightboxIndex !== null && lightboxItems.length > 0 ? (
        <div
          className="rc-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItems[lightboxIndex]?.alt || listing.title}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="rc-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close image preview"
          >
            Close
          </button>
          {lightboxItems.length > 1 ? (
            <>
              <button
                type="button"
                className="rc-lightbox__nav rc-lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation()
                  setLightboxIndex((current) => (current === null ? current : (current - 1 + lightboxItems.length) % lightboxItems.length))
                }}
                aria-label="Previous image"
              >
                Prev
              </button>
              <button
                type="button"
                className="rc-lightbox__nav rc-lightbox__nav--next"
                onClick={(event) => {
                  event.stopPropagation()
                  setLightboxIndex((current) => (current === null ? current : (current + 1) % lightboxItems.length))
                }}
                aria-label="Next image"
              >
                Next
              </button>
            </>
          ) : null}
          <img
            src={lightboxItems[lightboxIndex].src}
            alt={lightboxItems[lightboxIndex].alt}
            className="rc-lightbox__image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      <Card className="rc-detail-card">
        <h3>Actions</h3>
        <div className="rc-detail-actions">
          {canSendInquiry ? <Button onClick={handleInquiry}>Send inquiry</Button> : null}
          <Button variant="secondary" onClick={handleSave}>
            {saved ? 'Unsave' : 'Save'}
          </Button>
          {isOwner ? <Button onClick={handleEdit}>Edit</Button> : null}
          {isOwner ? (
            <Button variant="secondary" onClick={handleToggleAvailability}>
              {listing.is_available ? 'Mark unavailable' : 'Mark available'}
            </Button>
          ) : null}
          {isOwner ? (
            <Button variant="ghost" onClick={handleToggleHidden}>
              {listing.is_hidden ? 'Unhide' : 'Hide'}
            </Button>
          ) : null}
          {isOwner ? (
            <Button variant="ghost" onClick={handleDelete}>
              Delete
            </Button>
          ) : null}
        </div>
        {action ? (
          <p className="rc-muted" role="status">
            {action}
          </p>
        ) : null}
      </Card>

      <Card className="rc-detail-card">
        <h3>Details</h3>
        <div className="rc-detail-grid">
          <div>
            <p className="rc-label">Bedrooms</p>
            <p>{listing.bedrooms}</p>
          </div>
          <div>
            <p className="rc-label">Bathrooms</p>
            <p>{listing.bathrooms}</p>
          </div>
          <div>
            <p className="rc-label">Halls</p>
            <p>{listing.halls}</p>
          </div>
          <div>
            <p className="rc-label">Kitchens</p>
            <p>{listing.kitchens}</p>
          </div>
          <div>
            <p className="rc-label">Category</p>
            <p>{categoryName || 'N/A'}</p>
          </div>
          <div>
            <p className="rc-label">Size</p>
            <p>{listing.size_value || 'N/A'} sq ft</p>
          </div>
          <div>
            <p className="rc-label">Location</p>
            <p>{locationLabel || `N/A`}</p>
          </div>
          <div>
            <p className="rc-label">Street</p>
            <p>{listing.street || 'N/A'}</p>
          </div>
          <div className="rc-detail-grid__span-2">
            <p className="rc-label">Description</p>
            <p className="rc-preline">{listing.description || 'No description provided.'}</p>
          </div>
          <div className="rc-detail-grid__triple rc-detail-grid__span-2">
            <div>
              <p className="rc-label">Amenities</p>
              <p className="rc-preline">{listing.amenities_text || 'No amenities listed.'}</p>
            </div>
            <div>
              <p className="rc-label">House rules</p>
              <p className="rc-preline">{listing.house_rules_text || 'No house rules listed.'}</p>
            </div>
            <div>
              <p className="rc-label">Preferred tenant</p>
              <p className="rc-preline">{listing.preferred_tenant_text || 'No tenant preference listed.'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="rc-detail-card">
        <div className="rc-review-header">
          <div>
            <h3>Owner rating</h3>
            <p className="rc-muted">Reviews for this owner.</p>
          </div>
          <div className="rc-rating__summary">
            <span className="rc-rating__value">
              {reviewSummary?.average_rating
                ? reviewSummary.average_rating.toFixed(1)
                : 'New'}
            </span>
            <span className="rc-muted">
              {reviewSummary?.review_count ? `(${reviewSummary.review_count})` : 'No ratings yet'}
            </span>
          </div>
        </div>
        <div className="rc-review-list">
          {reviews.length === 0 ? <p className="rc-muted">No reviews yet.</p> : null}
          {reviews.map((review) => (
            <div key={review.id} className="rc-review-item">
              <div className="rc-review-meta">
                <span>Reviewer #{review.reviewer_id}</span>
                <Badge tone="accent">{review.rating} / 5</Badge>
              </div>
              <p>{review.review_text || 'No comment provided.'}</p>
            </div>
          ))}
        </div>
        {isAuthenticated && user?.id && listing.owner_id !== user.id ? (
          <div className="rc-review-form">
            <h3>{myReviewId ? 'Update your review' : 'Leave a review'}</h3>
            <div className="rc-form rc-form--grid">
              <Select
                label="Rating"
                name="rating"
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((prev) => ({ ...prev, rating: event.target.value }))
                }
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Okay</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Bad</option>
              </Select>
              <Input
                label="Comment"
                name="review_text"
                value={reviewForm.review_text}
                onChange={(event) =>
                  setReviewForm((prev) => ({ ...prev, review_text: event.target.value }))
                }
                placeholder="Share details about your experience"
              />
            </div>
            <Button size="sm" onClick={handleReviewSubmit}>
              {myReviewId ? 'Update review' : 'Submit review'}
            </Button>
            {reviewStatus ? (
              <p className="rc-muted" role="status">
                {reviewStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>
      {listing ? (
        <div className="rc-mobile-cta">
          {canSendInquiry ? <Button onClick={handleInquiry}>Send inquiry</Button> : null}
          <Button variant="secondary" onClick={handleSave}>
            {saved ? 'Unsave' : 'Save'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
