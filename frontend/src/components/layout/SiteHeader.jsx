import { NavLink } from 'react-router-dom'

import Button from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export default function SiteHeader() {
  const { isAuthenticated, user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const profileLabel = user?.full_name?.trim() || 'Profile'
  const initial = user?.full_name?.charAt(0)?.toUpperCase() || '?'

  return (
    <header className="rc-header">
      <div className="rc-header__brand">
        <span className="rc-logo">RC</span>
        <div>
          <p className="rc-header__title">RoomConnect</p>
          <p className="rc-header__subtitle">Find rooms faster in Nepal</p>
        </div>
      </div>
      <nav className="rc-header__nav">
        {!isAdmin ? (
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rc-nav-link${isActive ? ' active' : ''}`
            }
          >
            Home
          </NavLink>
        ) : null}
        {user?.role === 'seeker' ? (
          <NavLink
            to="/listings"
            className={({ isActive }) =>
              `rc-nav-link rc-nav-link--seeker${isActive ? ' active' : ''}`
            }
          >
            Listings
          </NavLink>
        ) : (
          <NavLink
            to="/listings"
            className={({ isActive }) =>
              `rc-nav-link${isActive ? ' active' : ''}`
            }
          >
            Listings
          </NavLink>
        )}
        {isAuthenticated ? (
          <>
            {user?.role !== 'admin' ? (
              <>
                <NavLink
                  to="/saved"
                  className={({ isActive }) =>
                    `rc-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  Saved
                </NavLink>
                <NavLink
                  to="/inbox"
                  className={({ isActive }) =>
                    `rc-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  Inbox
                </NavLink>
              </>
            ) : null}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rc-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="rc-nav-avatar">{initial}</span>
              {profileLabel}
            </NavLink>
            {user?.role === 'owner' ? (
              <NavLink
                to="/owner/listings"
                className={({ isActive }) =>
                  `rc-nav-link rc-nav-link--owner${isActive ? ' active' : ''}`
                }
              >
                My listings
              </NavLink>
            ) : null}
            {user?.role === 'admin' ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rc-nav-link${isActive ? ' active' : ''}`
                }
              >
                Admin panel
              </NavLink>
            ) : null}
            <button className="rc-nav-link rc-nav-link--logout" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/auth/login"
              className={({ isActive }) =>
                `rc-nav-link${isActive ? ' active' : ''}`
              }
            >
              Login
            </NavLink>
            <NavLink to="/auth/register">
              <Button variant="ghost" size="sm">
                Get Started
              </Button>
            </NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
