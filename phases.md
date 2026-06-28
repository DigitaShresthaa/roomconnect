# RoomConnect Delivery Phases

This plan breaks delivery into phases starting with an MVP. Each phase separates backend and frontend work under their own folders. Testing expectations are included for every feature.

## Phase 0: Project Setup and Foundations

### Goals
- Establish repo structure, shared conventions, and baseline infrastructure for both apps.

### Backend (backend/)
- FastAPI project scaffold with layered structure (routers, services, schemas, models).
- MySQL connection and schema management without Alembic (SQLAlchemy models + DDL-based approach).
- Environment configuration (.env) for DB, email, media storage, app secrets.
- Base error handling (consistent API error shape).
- Logging setup (request/response tracing, error logging).
- Static/media folder structure for local image storage.

### Frontend (frontend/)
- React + Bootstrap scaffold with routing.
- Global theme variables (Sand + Slate palette, deep green accent).
- Reusable UI atoms (buttons, inputs, cards, badges, skeletons).
- API client wrapper (fetch or axios) with error handling.
- Auth state management (simple context/store).

### Testing
- Backend: health check endpoint test; DB connectivity smoke test.
- Frontend: routing smoke test; layout load test.

---

## Phase 1: MVP (Core Marketplace)

### MVP Scope Summary
- Email/password auth with JWT + SMTP verification.
- Owner listing CRUD with images/videos stored locally.
- Seeker browse/search/filter and listing detail.
- Seeker saved listings.
- Seeker-owner messaging (single thread per listing).
- Admin reference data management (categories and locations).

### Backend (backend/)

#### Authentication and Accounts
- Endpoints for register, verify email (SMTP, optional), login, logout/token refresh.
- Password hashing and validation rules.
- Role-based access control for owner and seeker routes.
- Basic profile fields (full name, email, phone).
- Account activation without blocking features; email verification available in profile.
- JWT access and refresh tokens.

Testing
- Unit tests for password hashing and JWT token creation.
- Integration tests for register, verify, login flows (verification optional).
- Authorization tests for owner-only vs seeker-only endpoints.

#### Listings (Owner)
- Create listing with title, description, price, room specs, location, amenities, house rules, preferred tenant.
- Update listing (edit fields, change availability).
- Hide or delete listing.
- Media upload (images/videos) to local storage; persist file path in listing_media.
- Media limits: up to 10 files per listing; max 10MB per image, 100MB per video; any dimensions.
- Contact info stays hidden; communication happens only via messaging.

Testing
- CRUD API tests including validation errors.
- Media upload tests for size/type/count limits.
- Availability and hide behavior tests.

#### Discovery (Seeker)
- List available listings with pagination.
- Filter by province/district/locality, price range, category, size, availability.
- Search by keyword (title/description).
- Listing detail endpoint with media.

Testing
- Filter/search integration tests with seed data.
- Pagination correctness tests.
- Performance test: typical query under 2 seconds.

#### Saved Listings (Seeker)
- Save/unsave listing endpoint.
- List saved listings for seeker.

Testing
- Duplicate save prevention test.
- Save/unsave authorization tests.

#### Messaging
- Create inquiry thread (one per listing+seeker).
- Send and list inquiry messages.
- Owner and seeker access controls.

Testing
- Thread uniqueness constraint test.
- Message ordering tests.
- Access control tests for unrelated users.

#### Reference Data Management (Admin)
- CRUD for categories, provinces, districts, localities.
- Active/inactive filtering.
- Admin-only access; admins can hide/delete listings but not edit them.
- Admins can delete individual media files directly.

Testing
- CRUD tests with relational constraints.
- Prevent delete when referenced.
- Admin-only access tests.

### Frontend (frontend/)

#### Authentication
- Register, verify email (SMTP), login views.
- Basic profile view and logout.
- Guarded routes per role.

Testing
- Form validation tests.
- Auth guard behavior tests.

#### Owner Listing Management
- Listing form (create/edit) with image/video upload.
- Owner listings dashboard (status, availability toggle).
- Delete/hide actions with confirmation.
- Contact info is not shown on listing pages.

Testing
- Form submission and validation UI tests.
- Upload UI tests (preview, error states, count/size limits).

#### Seeker Discovery
- Home feed with filters and search.
- Listing cards with key metadata.
- Listing detail page with gallery.
- Save listing button.

Testing
- Filter UI tests with mocked API.
- Detail page render and media gallery tests.

#### Messaging
- Inquiry thread UI on listing detail.
- Inbox view for owner and seeker.
- Message composer and timeline.

Testing
- Thread loading and send message tests.

#### Reference Data Management (Admin)
- Admin login.
- User management tables and status toggles.
- Listing moderation views (hide/delete only).
- Media management (delete individual images/videos).
- Reference data management screens.

Testing
- Table actions and confirmation flows.
- Role-based route guards.

---

## Phase 2: Admin and User Management Expansion

### Backend (backend/)

#### Admin Dashboard APIs
- User management (list, deactivate/reactivate, verify overrides).
- Admin audit logs for user and listing actions.

Testing
- User state change tests.
- Audit log creation tests.

### Frontend (frontend/)

#### Admin UI Enhancements
- User management filters and bulk actions.
- Admin audit log viewer.

Testing
- User state change flows.
- Audit log visibility tests.

---

## Phase 3: Reviews and Trust Signals

### Backend (backend/)
- User reviews endpoint (one review per reviewer/reviewee pair) available anytime.
- Rating aggregation for owners and seekers.

Testing
- Unique review constraint tests.
- Rating range validation tests.

### Frontend (frontend/)
- Review submission form available anytime.
- Display rating summaries on profile and listings.

Testing
- Review form validation tests.
- Rating display tests.

---

## Phase 4: UX, Performance, and Hardening

### Backend (backend/)
- Query optimization, indexes review based on search patterns.
- Audit logging for admin actions.
- Media storage cleanup for deleted listings.

Testing
- Load test for search queries.
- Log audit tests.

### Frontend (frontend/)
- Accessibility pass (WCAG AA where feasible).
- Mobile layout refinements (filter drawer, sticky CTA).
- Visual polish and empty states.

Testing
- Responsive layout tests.
- Basic accessibility tests (contrast, labels, keyboard nav).

---

## Phase 5: Pre-Launch and Ops

### Backend (backend/)
- Seed scripts for categories and locations.
- Backup strategy for local media and DB.
- Monitoring hooks (health checks, uptime endpoint).

Testing
- Seed data verification.
- Backup/restore dry run.

### Frontend (frontend/)
- Error pages (404, 500).
- Simple onboarding tips.

Testing
- Error page routing tests.

---

## Open Questions

- None.
