# UNswap — System Architecture

> A reference document describing the technical architecture of the UNswap home exchange platform, covering infrastructure, data flow, component relationships, and key design decisions.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Infrastructure & Deployment](#2-infrastructure--deployment)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication & Security](#6-authentication--security)
7. [API Design](#7-api-design)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Key Data Flows](#9-key-data-flows)
10. [Concurrency & State Management](#10-concurrency--state-management)

---

## 1. High-Level Overview

UNswap is a full-stack web application with a clear separation between a React SPA frontend and a Node.js/Express backend. They communicate exclusively over a REST API.

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│   React SPA (Vite) — served as static files via Render CDN      │
│   TanStack Query · React Router · Radix UI · Framer Motion      │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS REST API
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express / Node.js)                    │
│   auth · entities · functions · uploads · referrals · webhook   │
│                    Prisma ORM                                    │
│                    SQLite Database (Render Disk)                 │
└──────────┬───────────────┬──────────────┬────────────────────────┘
           │               │              │
    ┌──────▼──────┐  ┌─────▼─────┐  ┌────▼────────┐
    │   Stripe    │  │  Daily.co │  │   Resend    │
    │ (Payments)  │  │  (Video)  │  │  (Email)    │
    └─────────────┘  └───────────┘  └─────────────┘
```

---

## 2. Infrastructure & Deployment

### Hosting: Render

| Service | Type | Config |
|---|---|---|
| Backend | Node.js web service | `npm start` in `/backend`, port 5000 |
| Frontend | Static site | `npm run build` in `/frontend`, publish `/dist` |
| Database | SQLite file | Render Disk mounted at `/backend/prisma/` |

### Database Persistence
SQLite is used for self-hosted deployments. The database file lives at `backend/prisma/dev.db`. On Render, a persistent disk is mounted at `/backend/prisma` so the file survives deploys and restarts.

> For production scale-out, switching to PostgreSQL requires only changing the `datasource provider` in `prisma/schema.prisma` and updating `DATABASE_URL`. No application code changes are needed.

### Environment Configuration
Every configurable value (secrets, URLs, API keys) is injected via environment variables — no hardcoded secrets anywhere in the codebase. The full variable reference is in `README.md`.

---

## 3. Frontend Architecture

### Technology Stack

| Concern | Library |
|---|---|
| Build / bundler | Vite |
| UI framework | React 18 |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| UI components | Shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Date handling | date-fns |
| Notifications | Sonner (toast) |

### Page Routing

Pages are auto-registered via `src/pages.config.js`. Each `.jsx` file in `src/pages/` is imported and added to the `PAGES` map. `App.jsx` renders a `<Routes>` from this map.

**Route protection levels:**
- **Public** — accessible without being logged in (`Home`, `FindProperties`, `Login`, `PropertyDetails`, `PaymentSuccess`)
- **Authenticated** — requires a valid JWT (`Dashboard`, `MySwaps`, `Messages`, etc.)
- **Verified** — requires `verification_status === 'verified'` (`HostDashboard`, `GuestDashboard`, `ReferralDashboard`, etc.)
- **Admin** — role-checked at action level inside `AdminDashboard`

### Authentication Context

`AuthContext.jsx` wraps the app and provides:
- `isAuthenticated` — boolean from JWT presence
- `isVerified` — `user.verification_status === 'verified'`
- `isLoadingAuth` — guard for first-load flicker
- `user` — the current user object from `/api/auth/me`
- `navigateToLogin()` — logout + redirect helper

### API Client (`src/api/apiClient.js`)

All API calls go through a single client module that:
1. Reads `VITE_API_URL` from the environment
2. Attaches the JWT from `localStorage` to every request as `Authorization: Bearer <token>`
3. Exposes three sub-clients:
   - `api.auth.*` — login, register, me, OAuth, OTP, password reset
   - `api.entities.<ModelName>.*` — `.list()`, `.filter()`, `.get()`, `.create()`, `.update()`, `.delete()`
   - `api.functions.invoke(name, payload)` — calls `/api/functions/:name`

### State Management Pattern

**Server state** is managed exclusively with TanStack Query:
- `useQuery` for fetching (with caching and background refetch)
- `useMutation` for writes (with `onSuccess` invalidation)
- `queryClient.invalidateQueries(key)` to trigger refetch after mutations

**UI state** is managed locally with `useState` inside each page component. No global client-side state store is used outside of Auth context.

### Component Architecture

```
src/
├── pages/           # Full-page route components
├── components/
│   ├── ui/          # Primitive design system (Shadcn/Radix wrappers)
│   ├── swaps/       # Swap-specific components (cards, dialogs, forms)
│   ├── video/       # ScheduledCallCard, VideoCallRoom, VideoCallScheduler
│   ├── messaging/   # MessageThread, ChatInput, ImageAttachment
│   ├── notifications/
│   ├── reviews/
│   ├── verification/
│   ├── points/
│   ├── calendar/
│   └── onboarding/
└── lib/             # AuthContext, utils, NavigationTracker
```

---

## 4. Backend Architecture

### Technology Stack

| Concern | Library |
|---|---|
| HTTP server | Express.js |
| ORM | Prisma |
| Database | SQLite (via `better-sqlite3`) |
| Auth | JWT (`jsonwebtoken`), `bcrypt` |
| Uploads | Multer (local disk storage) |
| Payments | Stripe Node SDK |
| Video | Daily.co REST API (via `axios`) |
| Email | Resend SDK (`resend`) |

### Route Structure

```
backend/src/
├── index.js              # App bootstrap, route mounting, static serving
├── db.js                 # Prisma client singleton (imported everywhere)
├── middleware/
│   └── auth.js           # requireAuth / optionalAuth middleware
└── routes/
    ├── auth.js           # /api/auth/*
    ├── entities.js       # /api/entities/:entity  (generic CRUD)
    ├── functions.js      # /api/functions/:name   (business logic)
    ├── uploads.js        # /api/uploads/*
    ├── referrals.js      # /api/referrals/*
    ├── favorites.js      # /api/favorites/*
    ├── email.js          # /api/email/send  +  sendEmail() export
    └── webhook.js        # /api/webhook  (Stripe events)
```

### Generic Entity Router (`entities.js`)

All 17 Prisma models share a single CRUD router. The `:entity` URL segment is mapped to a Prisma model name via a `MODEL_MAP`. This eliminates boilerplate while supporting:
- Filtering via query string params (e.g. `?status=pending&host_email=x@y.com`)
- Sort (`?_sort=-created_date`)
- Pagination (`?_limit=20&_offset=0`)
- `$or` compound queries (passed as JSON)
- **JSON field auto-parsing** — fields listed in `JSON_FIELDS[model]` (e.g. `features` on `SubscriptionPlan`, amenity arrays on `Property`) are transparently serialized on write and deserialized on read

Access control per entity:
- `READ` — public (no auth required for most entities)
- `WRITE` — `requireAuth` checked in middleware; admin-only writes enforced for sensitive models (`User`, `SubscriptionPlan`, `ActivityLog`, `PlatformSettings`)

### Business Logic Functions (`functions.js`)

Complex operations that span multiple models are isolated as named functions called via `POST /api/functions/:name`:

| Function | Key Logic |
|---|---|
| `completeSwap` | Deduct points from guest, credit host, create GuestPointTransaction records, mark swap completed |
| `createVideoCallRoom` | Call Daily.co API to create a room, store `room_url` on `VideoCall` |
| `markVideoCallCompleted` | Set `video_call_completed = true` on `SwapRequest`, update `VideoCall.status` |
| `createStripeCheckoutSession` | Look up or auto-create `SubscriptionPlan`, create Stripe Checkout Session |
| `createGuestPointsCheckoutSession` | Create one-time Stripe checkout for GuestPoints top-up |
| `getSwapStats` | Aggregate swap counts per status for a user |
| `updateUserPoints` | Admin-only manual point balance adjustment |

### Stripe Webhook Handler (`webhook.js`)

Handles the full Stripe event lifecycle:

| Event | Action |
|---|---|
| `checkout.session.completed` | Mark `PaymentTransaction` complete; activate subscription or credit GuestPoints; send detailed HTML email |
| `invoice.payment_succeeded` | Record renewal transaction; extend `subscription_renewal_date`; send renewal email |
| `invoice.payment_failed` | Create in-app notification; no email (Stripe sends its own dunning emails) |
| `customer.subscription.deleted` | Set `subscription_status` to `inactive`; send cancellation notification |

All webhook events are signature-verified with `stripe.webhooks.constructEvent`.

---

## 5. Database Schema

### Entity Relationship Overview

```
User ──────────────────────────────────────┐
 │  1:N  Property                          │
 │  1:N  SwapRequest (as requester)        │
 │  1:N  SwapRequest (as host)             │
 │  1:N  Message                           │
 │  1:N  Notification                      │
 │  1:N  GuestPointTransaction             │
 │  1:N  PaymentTransaction                │
 │  1:1  Verification                      │
 │  1:N  Review                            │
 │  1:N  Referral (as referrer)            │
 │       belongs to  SubscriptionPlan      │
 └───────────────────────────────────────┘

SwapRequest ──┐
              ├── 1:1  VideoCall
              └── N:N  Message (via conversation_id)
```

### Key Models

**User**
```
id, email, full_name, password_hash, role (user|admin)
verification_status (unverified|pending|verified)
subscription_plan_id → SubscriptionPlan
subscription_status (inactive|active|lifetime)
subscription_renewal_date
guest_points (int, default 500)
referred_users_verified_count
has_first_year_guarantee
referral_code (unique)
```

**SwapRequest**
```
id, property_id → Property
requester_email → User
host_email → User
status (pending|approved|rejected|counter_proposed|
        video_scheduled|video_call_completed|completed|cancelled)
swap_type (reciprocal|guest_points|both)
start_date, end_date, guest_count
total_points (GuestPoints cost of swap)
video_call_completed (bool)
key_handoff_method, lockbox_code, emergency_contact
special_instructions
```

**VideoCall**
```
id, swap_request_id → SwapRequest
host_email, guest_email
host_name, guest_name
room_id, room_url (Daily.co room)
status (scheduled|in_progress|completed|missed|cancelled)
scheduled_time, duration_minutes
meeting_completed (bool)
```

**GuestPointTransaction**
```
id, user_email → User
transaction_type (initial_grant|spent_swap|earned_swap|
                  earned_purchase|earned_referral|admin_adjustment)
points (positive or negative)
balance_after
swap_request_id (optional, for swap-related transfers)
description
```

**SubscriptionPlan**
```
id, name, description
price (USD), type (annual|lifetime)
exchanges_per_year, guest_points_allocation
property_guarantee_amount
features (JSON array)
is_active, highlight, color, badge
```

---

## 6. Authentication & Security

### JWT Flow

```
Login → POST /api/auth/login
     ← { token: "eyJ..." }

All subsequent requests:
     → Authorization: Bearer eyJ...
     ← Middleware decodes → req.user = { email, role, ... }
```

JWTs are signed with `JWT_SECRET`, expiry is 30 days. No refresh token mechanism — expiry triggers a redirect to `/login`.

### OAuth (Google & LinkedIn)

Server-side OAuth 2.0 flow:
1. Frontend redirects to `/api/auth/google` (or `/linkedin`)
2. Backend redirects to Google/LinkedIn authorization URL with `redirect_uri` set to `/api/auth/google/callback`
3. On callback, backend exchanges code for access token, fetches profile, upserts `User`, issues JWT
4. Backend redirects to `/oauth-callback?token=...`
5. Frontend `OAuthCallback.jsx` reads token from URL, stores in `localStorage`, redirects to `Dashboard`

### Email OTP at Registration

1. `POST /api/auth/register` with `{email, password, ...}` → generates 6-digit OTP, stores with 10-min expiry, sends via Resend
2. `POST /api/auth/verify-otp` with `{email, otp}` → validates OTP, creates `User`

### Role-Based Access

- `role: "admin"` — set manually by a platform administrator
- Backend middleware `requireAuth` ensures a valid JWT for write operations
- Admin-only routes check `req.user.role === 'admin'` explicitly
- Entity writes for `User`, `PlatformSettings`, `SubscriptionPlan`, `ActivityLog` require admin role

### SES Lockdown

The frontend uses Lockdown (from SES/Agoric) loaded in `index.html` to restrict unsafe JavaScript intrinsic mutation, hardening the browser runtime against prototype pollution attacks.

---

## 7. API Design

### Convention

All endpoints are under `/api`. The API is RESTful by convention, with the following patterns:

```
GET    /api/entities/:entity              → list (with optional filters)
GET    /api/entities/:entity/:id          → get single
POST   /api/entities/:entity              → create
PATCH  /api/entities/:entity/:id          → partial update
DELETE /api/entities/:entity/:id          → delete

POST   /api/functions/:name               → invoke business logic function

POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/verify-otp
GET    /api/auth/me
GET    /api/auth/google  →  GET /api/auth/google/callback
GET    /api/auth/linkedin  →  GET /api/auth/linkedin/callback
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

POST   /api/uploads/image
POST   /api/email/send

POST   /api/webhook                       → Stripe webhook
```

### Error Handling

All routes return JSON. Error responses follow:
```json
{ "error": "Human-readable error message" }
```
HTTP status codes: `400` (bad request), `401` (unauthenticated), `403` (forbidden), `404` (not found), `500` (server error).

### Static File Serving

Uploaded images are stored at `backend/uploads/` and served as static files at `/uploads/*` via Express's `express.static` middleware. URLs are constructed with `BACKEND_URL + /uploads/filename`.

---

## 8. Third-Party Integrations

### Stripe

- **SDK**: Official `stripe` Node.js library
- **Checkout Sessions**: Created server-side; client is redirected to Stripe-hosted payment page
- **Success flow**: `success_url` includes plan name, price, and type as query params → `PaymentSuccess` page reads them to show a proper receipt
- **Webhooks**: Stripe POSTs to `/api/webhook`; signature verified before processing
- **Plans**: `SubscriptionPlan` records in the DB are the source of truth for price and metadata; Stripe is told the price at session creation time (not stored in Stripe products)

### Daily.co

- **API**: REST (`https://api.daily.co/v1/rooms`) called server-side with `Bearer` API key auth
- **Room lifecycle**: A room is created when the host schedules a call. The `room_url` is stored on `VideoCall` and shared with both parties. Rooms have a 1-hour expiry by default.
- **Frontend**: The `VideoCallRoom` component loads the Daily.co prebuilt UI inside an `<iframe>` using the `room_url` directly.

### Resend

- **SDK**: `resend` npm package
- **Configuration**: `RESEND_API_KEY` + `EMAIL_FROM` env vars
- **Resilience**: All `sendEmail` calls are wrapped to silently log network failures without crashing the request handler — email is non-blocking and best-effort
- **Email types**: OTP verification, password reset, subscription activation, GuestPoints purchase, annual renewal, and future notification emails

---

## 9. Key Data Flows

### Swap Request Lifecycle

```
1. Guest → POST /api/entities/SwapRequest (status: pending)
2. Host  → PATCH /api/entities/SwapRequest/:id (status: approved)
3. Host  → POST /api/functions/createVideoCallRoom
                (creates Daily.co room, POST /api/entities/VideoCall)
4. Host  → PATCH /api/entities/VideoCall/:id (scheduled_time, guests)
5. Both join video call via room_url
6. Host  → POST /api/functions/markVideoCallCompleted
                (SwapRequest.video_call_completed = true)
7. Host  → POST /api/functions/completeSwap
                (points transfer, SwapRequest.status = completed)
```

### Stripe Payment Flow

```
1. User   → POST /api/functions/createStripeCheckoutSession
          ← { url: "https://checkout.stripe.com/..." }
2. User  redirected to Stripe hosted page
3. User completes payment
4. User  redirected back to /PaymentSuccess?type=subscription&plan=...&price=...
5. Stripe → POST /api/webhook (checkout.session.completed)
         Backend activates subscription, sends confirmation email
```

### GuestPoints Transfer (Swap Completion)

```
completeSwap(swapRequestId):
  1. Load SwapRequest (total_points, host_email, requester_email)
  2. Deduct total_points from guest:
       User.guest_points -= total_points
       GuestPointTransaction { type: spent_swap, points: -N }
  3. Credit total_points to host:
       User.guest_points += total_points
       GuestPointTransaction { type: earned_swap, points: +N }
  4. SwapRequest.status = 'completed'
  5. Both transactions recorded with balance_after snapshot
```

### Email OTP Registration

```
POST /api/auth/register
  → Generate 6-digit OTP
  → Store { email, otp, expires_at } temporarily
  → sendEmail(OTP email via Resend)
  ← { message: "OTP sent" }

POST /api/auth/verify-otp
  → Validate OTP + expiry
  → Create User record
  → Issue JWT
  ← { token }
```

---

## 10. Concurrency & State Management

### Backend Concurrency

- Node.js is single-threaded; all I/O (DB, HTTP calls to Stripe/Daily/Resend) is async/await
- Prisma uses a connection pool backed by `better-sqlite3` — SQLite serializes writes, so no write conflicts in single-process mode
- For multi-instance deployments (horizontal scaling), migrating to PostgreSQL would be required to safely share state

### Frontend Data Freshness

TanStack Query manages cache invalidation:

- **`staleTime`**: Most queries use the default (0ms) — data is considered stale immediately after fetching, triggering a background refetch on re-mount
- **`refetchInterval`**: Used selectively on `PaymentSuccess` (3s polling until subscription activates) and messaging (typing indicators, new message checking)
- **`invalidateQueries`**: Called in `onSuccess` of every mutation to flush the relevant cache key and trigger fresh data

### Optimistic Updates

Currently not implemented — all mutations wait for server confirmation before the UI reflects the change. This is intentional for correctness on financial and status operations (swaps, points, subscriptions).

---

*Last updated: March 2026*
