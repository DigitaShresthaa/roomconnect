import { Navigate, Route, Routes } from 'react-router-dom'

import SiteFooter from './components/layout/SiteFooter'
import SiteHeader from './components/layout/SiteHeader'
import AdminPanelLayout from './components/layout/AdminPanelLayout'
import RequireAdmin from './components/auth/RequireAdmin'
import './App.css'
import AdminAuditLogs from './pages/AdminAuditLogs'
import AdminListings from './pages/AdminListings'
import AdminReference from './pages/AdminReference'
import AdminUsers from './pages/AdminUsers'
import Error500 from './pages/Error500'
import Home from './pages/Home'
import Inbox from './pages/Inbox'
import ListingDetail from './pages/ListingDetail'
import ListingForm from './pages/ListingForm'
import Listings from './pages/Listings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import OwnerListings from './pages/OwnerListings'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Saved from './pages/Saved'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  return (
    <div className="rc-app">
      <SiteHeader />
      <main className="rc-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/owner/listings" element={<OwnerListings />} />
          <Route path="/owner/listings/new" element={<ListingForm />} />
          <Route path="/owner/listings/:id/edit" element={<ListingForm />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPanelLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="reference?section=categories" replace />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="reference" element={<AdminReference />} />
          </Route>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/error" element={<Error500 />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
