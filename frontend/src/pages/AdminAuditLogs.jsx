import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Placeholder from './Placeholder'
import Select from '../components/ui/Select'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth } from '../lib/api'

const initialFilters = {
  admin_id: '',
  target_type: '',
  target_id: '',
  action: '',
}

const targetTypeOptions = ['user', 'listing']

export default function AdminAuditLogs() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [state, setState] = useState({ loading: true, error: '', data: [] })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(pageSize))
    if (appliedFilters.admin_id) {
      params.set('admin_id', appliedFilters.admin_id)
    }
    if (appliedFilters.target_type) {
      params.set('target_type', appliedFilters.target_type)
    }
    if (appliedFilters.target_id) {
      params.set('target_id', appliedFilters.target_id)
    }
    if (appliedFilters.action) {
      params.set('action', appliedFilters.action)
    }
    return params.toString()
  }, [appliedFilters, page, pageSize])

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      const data = await apiGetAuth(`/api/v1/admin/audit-logs?${queryString}`)
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

  const hasNextPage = state.data.length === pageSize

  return (
    <div className="rc-page">
      <div className="rc-page__header">
        <div>
          <h2>Audit logs</h2>
          <p>Trace administrative actions for listings and users.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="rc-card">
        <div className="rc-filter">
          <Input
            label="Admin id"
            name="admin_id"
            value={filters.admin_id}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, admin_id: event.target.value }))
            }
          />
          <Select
            label="Target type"
            name="target_type"
            value={filters.target_type}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, target_type: event.target.value }))
            }
          >
            <option value="">All targets</option>
            {targetTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input
            label="Target id"
            name="target_id"
            value={filters.target_id}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, target_id: event.target.value }))
            }
          />
          <Input
            label="Action"
            name="action"
            value={filters.action}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, action: event.target.value }))
            }
            placeholder="listing_hide, user_update"
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
        {state.loading ? <p>Loading audit logs...</p> : null}
        {state.error ? <p className="rc-error">{state.error}</p> : null}
        {!state.loading && !state.error && state.data.length === 0 ? (
          <Placeholder
            title="No audit logs yet"
            message="Admin actions will appear here once recorded."
          />
        ) : null}
        {state.data.length > 0 ? (
          <div className="rc-table rc-table--grid rc-table--audit">
            <div className="rc-table__row rc-table__row--grid rc-table__row--header">
              <span className="rc-table__cell">Time</span>
              <span className="rc-table__cell">Admin</span>
              <span className="rc-table__cell">Action</span>
              <span className="rc-table__cell">Target</span>
              <span className="rc-table__cell">Metadata</span>
            </div>
            {state.data.map((log) => (
              <div key={log.id} className="rc-table__row rc-table__row--grid">
                <span className="rc-table__cell">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className="rc-table__cell">#{log.admin_id}</span>
                <span className="rc-table__cell">
                  <Badge tone="accent">{log.action}</Badge>
                </span>
                <span className="rc-table__cell">
                  {log.target_type} #{log.target_id ?? 'n/a'}
                </span>
                <span className="rc-table__cell rc-table__cell--meta">
                  {log.metadata ? JSON.stringify(log.metadata) : '-'}
                </span>
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
