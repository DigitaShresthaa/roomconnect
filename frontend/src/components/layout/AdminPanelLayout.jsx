import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const panelLinks = [
  { to: '/admin/users', label: 'Manage users' },
  { to: '/admin/listings', label: 'Manage listings' },
  { to: '/admin/audit-logs', label: 'Audit logs' },
]

const referenceLinks = [
  { section: 'categories', label: 'Manage categories' },
  { section: 'provinces', label: 'Manage provinces' },
  { section: 'districts', label: 'Manage districts' },
  { section: 'localities', label: 'Manage localities' },
]

export default function AdminPanelLayout() {
  const location = useLocation()
  const currentSection = new URLSearchParams(location.search).get('section')

  return (
    <div className="rc-admin-shell">
      <aside className="rc-admin-sidebar rc-card">
        <div className="rc-admin-sidebar__header">
          <p className="rc-admin-sidebar__eyebrow">Admin only</p>
          <h3>Control panel</h3>
        </div>

        <nav className="rc-admin-sidebar__nav" aria-label="Admin navigation">
          {panelLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rc-admin-sidebar__link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <p className="rc-admin-sidebar__group-title">Reference data</p>
          {referenceLinks.map((item) => {
            const isActive =
              location.pathname === '/admin/reference' && currentSection === item.section
            return (
              <Link
                key={item.section}
                to={`/admin/reference?section=${item.section}`}
                className={`rc-admin-sidebar__link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className="rc-admin-content">
        <Outlet />
      </section>
    </div>
  )
}
