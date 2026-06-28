import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

export default function RequireAdmin({ children }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  if (!user) {
    return (
      <div className="rc-page">
        <p>Loading admin panel...</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
