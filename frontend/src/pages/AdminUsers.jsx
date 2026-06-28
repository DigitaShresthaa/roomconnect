import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Placeholder from './Placeholder'
import Select from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPatchAuth } from '../lib/api'

const initialFilters = {
  role: '',
  is_active: '',
  is_verified: '',
  q: '',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [state, setState] = useState({ loading: true, error: '', data: [] })
  const [selected, setSelected] = useState(() => new Set())
  const [promotableUsers, setPromotableUsers] = useState([])
  const [promoteUserId, setPromoteUserId] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(pageSize))
    if (appliedFilters.role) {
      params.set('role', appliedFilters.role)
    }
    if (appliedFilters.is_active !== '') {
      params.set('is_active', appliedFilters.is_active)
    }
    if (appliedFilters.is_verified !== '') {
      params.set('is_verified', appliedFilters.is_verified)
    }
    if (appliedFilters.q) {
      params.set('q', appliedFilters.q)
    }
    return params.toString()
  }, [appliedFilters, page, pageSize])

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      const data = await apiGetAuth(`/api/v1/admin/users?${queryString}`)
      setState({ loading: false, error: '', data })
      setSelected(new Set())
    } catch (error) {
      setState({ loading: false, error: error.message, data: [] })
    }
  }

  const loadPromotableUsers = async () => {
    try {
      const [owners, seekers] = await Promise.all([
        apiGetAuth('/api/v1/admin/users?role=owner&page=1&page_size=200'),
        apiGetAuth('/api/v1/admin/users?role=seeker&page=1&page_size=200'),
      ])
      const merged = [...owners, ...seekers]
      const deduped = merged.filter(
        (user, index, all) => all.findIndex((candidate) => candidate.id === user.id) === index
      )
      setPromotableUsers(deduped)
      if (promoteUserId && !deduped.some((user) => String(user.id) === promoteUserId)) {
        setPromoteUserId('')
      }
    } catch {
      setPromotableUsers([])
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    load()
    loadPromotableUsers()
  }, [isAuthenticated, navigate, queryString])

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
  }

  const toggleSelection = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      const allIds = state.data.map((user) => user.id)
      const allSelected = allIds.every((id) => next.has(id))
      if (allSelected) {
        allIds.forEach((id) => next.delete(id))
      } else {
        allIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const applyBulkUpdate = async (payload) => {
    if (selected.size === 0) {
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      await Promise.all(
        [...selected].map((id) => apiPatchAuth(`/api/v1/admin/users/${id}`, payload))
      )
      await load()
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  const updateSingleUser = async (userId, payload) => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      await apiPatchAuth(`/api/v1/admin/users/${userId}`, payload)
      await load()
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  const promoteToAdmin = async () => {
    if (!promoteUserId) {
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      await apiPatchAuth(`/api/v1/admin/users/${promoteUserId}`, { role: 'admin' })
      setPromoteUserId('')
      await Promise.all([load(), loadPromotableUsers()])
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  const hasNextPage = state.data.length === pageSize
  const allSelected =
    state.data.length > 0 && state.data.every((user) => selected.has(user.id))

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>User management</h2>
          <p>Review accounts, apply status changes, and promote admins.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="rc-card">
        <div className="rc-admin-actions rc-admin-actions--spread">
          <div>
            <h3>Promote to admin</h3>
            <p className="rc-muted">Select an existing owner or seeker to grant admin access.</p>
          </div>
          <div className="rc-admin-actions">
            <Select
              label="User"
              name="promote_user"
              value={promoteUserId}
              onChange={(event) => setPromoteUserId(event.target.value)}
            >
              <option value="">Select user</option>
              {promotableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" onClick={promoteToAdmin} disabled={!promoteUserId}>
              Make admin
            </Button>
          </div>
        </div>
      </Card>

      <Card className="rc-card">
        <div className="rc-filter">
          <Select
            label="Role"
            name="role"
            value={filters.role}
            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="seeker">Seeker</option>
            <option value="admin">Admin</option>
          </Select>
          <Select
            label="Active"
            name="is_active"
            value={filters.is_active}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, is_active: event.target.value }))
            }
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Select
            label="Verified"
            name="is_verified"
            value={filters.is_verified}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, is_verified: event.target.value }))
            }
          >
            <option value="">Any verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </Select>
          <Input
            label="Search"
            name="q"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="Name, email, or phone"
          />
        </div>
        <div className="rc-admin-actions">
          <Button size="sm" variant="secondary" onClick={applyFilters}>
            Apply filters
          </Button>
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </Card>

      <Card className="rc-card">
        <div className="rc-admin-actions rc-admin-actions--spread">
          <div>
            <h3>Bulk actions</h3>
            <p className="rc-muted">Selected: {selected.size}</p>
          </div>
          <div className="rc-admin-actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyBulkUpdate({ is_active: true })}
              disabled={selected.size === 0}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyBulkUpdate({ is_active: false })}
              disabled={selected.size === 0}
            >
              Deactivate
            </Button>
          </div>
        </div>
        {state.loading ? <p>Loading users...</p> : null}
        {state.error ? <p className="rc-error">{state.error}</p> : null}
        {!state.loading && !state.error && state.data.length === 0 ? (
          <Placeholder
            title="No users found"
            message="Try adjusting the filters to see more accounts."
          />
        ) : null}
        {state.data.length > 0 ? (
          <div className="rc-table rc-table--grid">
            <div className="rc-table__row rc-table__row--grid rc-table__row--header">
              <label className="rc-table__cell rc-table__cell--checkbox">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </label>
              <span className="rc-table__cell">User</span>
              <span className="rc-table__cell">Role</span>
              <span className="rc-table__cell">Status</span>
              <span className="rc-table__cell">Phone</span>
              <span className="rc-table__cell">Actions</span>
            </div>
            {state.data.map((user) => (
              <div key={user.id} className="rc-table__row rc-table__row--grid">
                <label className="rc-table__cell rc-table__cell--checkbox">
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleSelection(user.id)}
                  />
                </label>
                <div className="rc-table__cell">
                  <div className="rc-table__title">{user.full_name}</div>
                  <div className="rc-muted">{user.email}</div>
                </div>
                <div className="rc-table__cell">
                  <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="rc-table__cell rc-table__cell--stack">
                  <Badge tone={user.is_active ? 'accent' : 'neutral'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge tone={user.is_verified ? 'accent' : 'neutral'}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                <div className="rc-table__cell">{user.phone || '-'}</div>
                <div className="rc-table__cell rc-table__cell--actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateSingleUser(user.id, { is_active: !user.is_active })}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="rc-pagination">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="rc-muted">Page {page}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  )
}
