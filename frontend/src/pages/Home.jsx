import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import ListingCard from '../components/listings/ListingCard'
import OnboardingTips from '../components/ui/OnboardingTips'
import { useAuth } from '../contexts/AuthContext'
import { apiGet } from '../lib/api'

const stats = [
  { label: 'Listings ready', value: '1.2k+' },
  { label: 'Avg. response', value: '2 hrs' },
  { label: 'Cities covered', value: '25+' },
]

const browseLink = '/listings'
const listLink = '/owner/listings/new'

const highlights = [
  {
    title: 'Verified owners, clearer listings',
    detail:
      'Structured listings, availability status, and direct messaging reduce noise.',
  },
  {
    title: 'Filters that fit Nepal localities',
    detail: 'Province, district, and locality filtering for precise results.',
  },
  {
    title: 'Saved rooms and instant follow-up',
    detail: 'Keep your shortlist and continue the conversation anytime.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState({ keyword: '', min_price: '', max_price: '' })
  const [recommended, setRecommended] = useState(null)
  const [recommendedLoading, setRecommendedLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'seeker' && user?.locality_id) {
      setRecommendedLoading(true)
      apiGet(`/api/v1/listings/recommended?locality_id=${user.locality_id}`)
        .then(setRecommended)
        .catch(() => setRecommended([]))
        .finally(() => setRecommendedLoading(false))
    } else {
      setRecommended(null)
    }
  }, [user])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (search.keyword.trim()) {
      params.set('q', search.keyword.trim())
    }
    const minPrice = search.min_price.trim()
    const maxPrice = search.max_price.trim()
    if (minPrice) {
      params.set('min_price', minPrice)
    }
    if (maxPrice) {
      params.set('max_price', maxPrice)
    }
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleSearchChange = (event) => {
    const { name, value } = event.target
    setSearch((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="rc-home">
      <section className="rc-hero">
        <div className="rc-hero__content">
          <h1>Find and list rental rooms with less friction.</h1>
          <p>
            A structured marketplace for Nepal rental rooms. Browse verified listings,
            shortlist what fits, and manage conversations in one place.
          </p>
          {!user ? (
            <div className="rc-hero__actions">
              <Link to={browseLink}>
                <Button>Browse listings</Button>
              </Link>
              <Link to={listLink}>
                <Button variant="secondary">List your room</Button>
              </Link>
            </div>
          ) : null}
          {!user ? (
            <div className="rc-hero__stats">
              {stats.map((stat) => (
                <div key={stat.label} className="rc-stat">
                  <p className="rc-stat__value">{stat.value}</p>
                  <p className="rc-stat__label">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rc-hero__panel">
          <Card className="rc-panel-card">
            <h3>Find a room</h3>
            <p className="rc-muted">
              Search by keyword and price range, then continue with the full filter page.
            </p>
            <form className="rc-home-search" onSubmit={handleSearchSubmit}>
              <Input
                label="Keyword"
                name="keyword"
                value={search.keyword}
                onChange={handleSearchChange}
                placeholder="Title, amenity, or description"
              />
              <div className="rc-home-search__price-grid">
                <Input
                  label="Min price"
                  name="min_price"
                  value={search.min_price}
                  onChange={handleSearchChange}
                  type="number"
                  placeholder="8000"
                />
                <Input
                  label="Max price"
                  name="max_price"
                  value={search.max_price}
                  onChange={handleSearchChange}
                  type="number"
                  placeholder="15000"
                />
              </div>
              <div className="rc-home-search__actions">
                <Button size="sm" type="submit">
                  Search listings
                </Button>
                <Link to={browseLink}>
                  <Button size="sm" variant="ghost">
                    View all
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </section>

      {recommended !== null && recommended.length > 0 ? (
        <section>
          <div className="rc-section-header">
            <h2>Recommended for you</h2>
            <Link to="/listings" className="rc-link">View all &rarr;</Link>
          </div>
          <div className="rc-listing-grid">
            {recommended.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => navigate(`/listings/${listing.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {recommendedLoading ? (
        <section>
          <div className="rc-section-header">
            <h2>Recommended for you</h2>
          </div>
          <p className="rc-muted">Loading recommendations…</p>
        </section>
      ) : null}

      <OnboardingTips />

      {!user ? (
        <section className="rc-grid">
          {highlights.map((item) => (
            <Card key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </Card>
          ))}
        </section>
      ) : null}

      {!user ? (
        <section className="rc-home__links">
          <Card>
            <h3>Quick links</h3>
            <div className="rc-home__link-row">
              <Link className="rc-home__link" to={browseLink}>Browse listings</Link>
              <Link className="rc-home__link" to="/auth/register">Create account</Link>
              <Link className="rc-home__link" to="/auth/login">Sign in</Link>
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
