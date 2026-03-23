# Unswap - Home Exchange for International Civil Servants

Unswap is a premium, closed-loop home exchange platform built for the UN, World Bank, IMF, and the global diplomatic corps. It enables verified international civil servants to safely and efficiently exchange homes during diplomatic rotations — replacing expensive hotels and unvetted rentals with trusted peer-to-peer home swaps backed by legal, insurance, and technology infrastructure.

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#-getting-started)
- [Project Architecture](#️-project-architecture)
- [Core Features](#-core-features)
- [Full Feature Deep-Dive](#-full-feature-deep-dive)
- [Swap Lifecycle](#-swap-lifecycle)
- [GuestPoints System](#-guestpoints-system)
- [Subscription Plans](#-subscription-plans)
- [Referral System](#-referral-system)
- [Admin Dashboard](#-admin-dashboard)
- [Database Models](#️-database-models-prismasqlite)
- [API Overview](#-api-overview)
- [Additional Services Required](#-additional-services-required)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributors](#contributors)

---

## Overview

UNswap is not a public marketplace — it is an **exclusively institutional** home exchange network. To participate, users must work for a recognised international organisation (UN system, World Bank Group, IMF, diplomatic missions, etc.) and pass a verification gate before they can list a property or initiate a swap.

The platform solves a real problem: during diplomatic rotations, civil servants often face a gap period where they need short-to-medium-term accommodation. Commercial rentals are expensive, Airbnb lacks institutional trust, and hotel stays are unsustainable for multi-month postings. UNswap fills this gap with a trust-first, peer-to-peer home exchange model backed by:

- **Institutional identity verification** (ID upload + optional institutional email check)
- **GuestPoints** — a points-based internal currency that makes swaps flexible even without simultaneous availability
- **Video call vetting** — hosts and guests meet before any swap is confirmed
- **Stripe-powered subscriptions** with annual membership tiers
- **A full admin control panel** for the platform operations team

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Google Cloud Platform Account (for OAuth)

> **Note:** The app currently runs on SQLite in self-hosted mode (default). PostgreSQL support is available by changing the `datasource` provider in `prisma/schema.prisma`.

### Backend Setup
1. `cd backend`
2. `npm install`
3. `cp .env.example .env` (Add your database and Google credentials — see [Environment Variables](#-environment-variables))
4. `npx prisma migrate dev` — creates the SQLite database and runs all migrations
5. `npx prisma generate` — generates the Prisma client
6. `npm run dev` — starts the Express server on port `5000`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env` (Add your `VITE_GOOGLE_CLIENT_ID` and `VITE_API_URL`)
4. `npm run dev` — starts the Vite dev server on port `5173`

---

## 🏗️ Project Architecture
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express, Prisma (SQLite / PostgreSQL).
- **Authentication**: JWT & Google OAuth & LinkedIn OAuth.
- **State Management**: TanStack Query (React Query v5) for server state
- **UI Components**: Shadcn/ui + Radix UI primitives
- **Payments**: Stripe Checkout Sessions + Stripe Webhooks
- **Video Calls**: Daily.co REST API
- **Email**: Resend HTTP API (no SMTP dependency)
- **Deployment**: Render (backend as a web service, frontend as a static site)

### Folder Structure

```
unswap-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # All 17 database models
│   │   └── migrations/            # Migration history
│   └── src/
│       ├── index.js               # Express entry point
│       ├── db.js                  # Prisma client singleton
│       ├── middleware/
│       │   └── auth.js            # JWT auth middleware
│       ├── routes/
│       │   ├── auth.js            # Login, register, OAuth, OTP, password reset
│       │   ├── entities.js        # Generic CRUD for all Prisma models
│       │   ├── functions.js       # Business logic (completeSwap, Stripe, Daily.co, etc.)
│       │   ├── uploads.js         # File/photo upload handling
│       │   ├── referrals.js       # Referral logic endpoints
│       │   ├── favorites.js       # Property favourites
│       │   ├── email.js           # Email via Resend
│       │   └── webhook.js         # Stripe webhook handler
│       └── services/
│           ├── adminNotificationService.js
│           └── referralService.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── apiClient.js       # Centralised API client with entity helpers
        ├── components/
        │   ├── calendar/          # BlockDateDialog, CalendarSyncDialog
        │   ├── host/              # HostContactDialog
        │   ├── messaging/         # Chat UI components, image attachments
        │   ├── notifications/     # Notification helper functions
        │   ├── onboarding/        # OnboardingWizard
        │   ├── points/            # PointsRedemptionDialog
        │   ├── swaps/             # SwapRequestCard, FinalizeSwapDialog, GuestFinalizeApprovalDialog, etc.
        │   ├── ui/                # Shadcn/ui primitives (Button, Dialog, Badge, etc.)
        │   └── verification/      # VerificationRequiredDialog
        └── pages/
            ├── Home.jsx           # Landing page
            ├── Login.jsx          # Auth (email/password + OAuth)
            ├── Dashboard.jsx      # Main post-login dashboard
            ├── GuestDashboard.jsx # Guest-specific dashboard
            ├── HostDashboard.jsx  # Host-specific dashboard
            ├── FindProperties.jsx # Property search & map
            ├── PropertyDetails.jsx
            ├── MyListings.jsx
            ├── MySwaps.jsx        # Swap management (Incoming / Outgoing / History tabs)
            ├── Messages.jsx       # Full messaging UI
            ├── Notifications.jsx
            ├── SubscriptionPlans.jsx
            ├── ReferralDashboard.jsx
            ├── Settings.jsx
            ├── AdminDashboard.jsx
            └── Documentation.jsx
```

---

## 📄 Core Documents
- [Features & Walkthrough](file://./walkthrough.md)
- [System Architecture](file://./architecture.md)

---

## ✨ Core Features
- **Referral Tiers**: Viral growth with milestone rewards.
- **Verification Gate**: Institutional verification for trust.
- **Luxury Aesthetic**: Clean, professional light mode design.
- **Swap Requests**: Streamlined home exchange workflow.
- **GuestPoints**: Flexible internal currency for point-based swaps.
- **Video Call Vetting**: Mandatory host–guest video call before swap confirmation.
- **Stripe Subscriptions**: Annual membership tiers with full webhook lifecycle.
- **Real-time Messaging**: Per-swap and direct threads with typing indicators.
- **Admin Dashboard**: Full platform control for operations staff.

---

## 📦 Full Feature Deep-Dive

### 🏠 Property Listings
Users can create detailed property listings to offer for exchange. Each listing includes:
- Title, description, property type, address, city, and country
- High-resolution photo gallery (multiple uploads supported)
- List of amenities (WiFi, parking, gym, etc.)
- Maximum guest count, number of bedrooms/bathrooms, and square footage
- Nightly GuestPoints pricing and swap preference (reciprocal / GuestPoints / both)
- Availability calendar with custom date ranges
- **Date blocking** — hosts can block specific dates for maintenance, personal use, or existing bookings
- **iCal Export** — each property generates a public iCal feed URL for syncing with Google Calendar, Apple Calendar, or Outlook
- **iCal Import** — hosts can import external iCal feeds (Airbnb, Booking.com, etc.) to prevent double-bookings
- Mobility/accessibility tags for guests with special requirements
- Nearest duty station info to help guests evaluate commute distance

### 🛡️ Verification & Trust
Institutional trust is the core of UNswap. The verification flow is:
1. **Email OTP at signup** — a one-time code is sent via Resend and must be verified before the account is created
2. **Profile completion** — users provide their organisation, job title, staff grade, and duty station
3. **Document submission** — users upload an employment letter, UN ID, or equivalent document via the verification flow
4. **Admin review** — the platform operations team reviews the submission in the Admin Dashboard
5. **Approval** — the user's status moves from `pending` to `verified`, unlocking property listings and swap initiation

Unverified users who attempt sensitive actions are shown a `VerificationRequiredDialog` prompting them to complete verification first.

### 💬 Real-time Messaging
Every swap request automatically creates a dedicated conversation thread between host and guest. Additionally, any user can start a direct message with any host from their property page.

Messaging features include:
- **Per-swap threads** labelled with the property name and swap dates
- **Direct conversations** outside of swap context
- **Typing indicators** — real-time "is typing..." status
- **Emoji reactions** on individual messages
- **Image attachments** — users can send photos in chat (with full-size lightbox preview)
- **Pinned conversations** for important chats
- **Unread message count** — circular blue badge in the navbar and on the Messages page list
- **Message deletion** — soft delete per sender/recipient
- **Message threading** — reply to specific messages

### 👤 User Profiles
- Public host and guest profile pages
- Profile photo upload
- Bio, languages spoken, institutional affiliation, and duty station
- Verification badge shown on verified profiles
- Review score and swap history summary visible to other users

---

## 🔁 Swap Lifecycle

```
1. Guest browses properties → opens CreateSwapRequestDialog
   ↓ Selects property, dates, guest count, and swap type (GuestPoints or Reciprocal)
   ↓ Sends request with intro message

2. Host receives notification → reviews in MySwaps (Incoming tab)
   ↓ OPTIONS:
   → Accept (status: accepted)
   → Reject (status: rejected)
   → Counter Proposal (status: counter_proposed) — host suggests alternative dates/terms
       ↓ Guest reviews counter → Accepts or Rejects

3. Swap is accepted
   ↓ Both parties sign the ImmunityWaiver
   ↓ Host creates a Daily.co video call room and schedules the call
   ↓ Guest sees a "Join Call" button at the scheduled time

4. Video call takes place
   ↓ Host marks the call as completed
   ↓ OPTIONS:
   → Host proceeds to finalize → opens FinalizeSwapDialog
   → Host declines after the call (swap rejected post-call)

5. Finalization
   ↓ Host fills in: key handoff method, lockbox code, emergency contact, special instructions
   ↓ Host clicks "Finalize Swap"
   ↓ Backend:
      - Deducts GuestPoints from guest
      - Credits GuestPoints to host
      - Creates GuestPointTransaction records (audit trail)
      - Sets swap status to "completed"
      - Records completion timestamp

6. Swap appears under the "History" tab in MySwaps
```

---

## 🪙 GuestPoints System

GuestPoints is UNswap's internal currency for point-based home exchanges. It allows asymmetric swaps where one party doesn't own a property or isn't available at the same time.

- **Starting balance**: Every new user receives **500 GuestPoints**
- **Earning points**: Hosts earn GuestPoints when a guest completes a stay at their property
- **Spending points**: Guests spend GuestPoints to book a stay at a host's property
- **Nightly rate**: Each property has a configurable nightly GuestPoints rate (default: 100 pts/night)
- **Escrow**: Points are held in escrow once a swap is accepted and only transferred on completion
- **Transaction ledger**: Every credit and debit is recorded in `GuestPointTransaction` with a `balance_after` snapshot
- **Points Redemption**: A dialog in the app allows users to manage and redeem their balance
- **Admin control**: Admins can manually adjust any user's balance from the Admin Dashboard

---

## 🏅 Subscription Plans

UNswap operates on an annual membership model. Subscriptions are required to access the platform's full swap capacity. Plans are managed via Stripe.

| Plan | Type | Description |
|---|---|---|
| Explorer | Annual | Entry-level access, limited swaps |
| Professional | Annual | Mid-tier with more exchanges per year |
| Executive | Annual | High-frequency swappers |
| Ambassador | Annual | Unlimited exchanges + priority support |
| Lifetime | One-time | Single payment, permanent access |

**Checkout flow:**
1. User selects a plan on the `SubscriptionPlans` page
2. Frontend calls `POST /api/functions/createStripeCheckoutSession`
3. Backend creates a Stripe Checkout Session and returns the URL
4. User is redirected to Stripe's hosted checkout
5. On payment success, Stripe sends a webhook to `POST /api/webhook`
6. The webhook handler updates the user's `subscription_plan_id`, `subscription_status`, and `subscription_renewal_date`

Plans are automatically seeded to the database on startup if missing — preventing 400 errors on fresh deployments.

---

## 👥 Referral System

UNswap uses a referral programme to grow its closed network virally within institutional circles.

- Every user receives a unique **referral code** at signup
- When a referred user signs up using the code, a `Referral` record is created
- When the referred user gets **verified**, the referral is marked as `completed`
- The referrer's `referred_users_verified_count` increments
- Once a threshold is reached (configurable in Platform Settings), the referrer earns a **subscription fee waiver** for the first year
- **Founders Circle** members with enough verified referrals receive the `has_first_year_guarantee` flag
- The `ReferralDashboard` page shows personal stats, referral link, and a copy-to-clipboard button
- Admins can view a full **referral leaderboard** (top 10 referrers) in the Admin Dashboard

---

## ⚙️ Admin Dashboard

The Admin Dashboard (`/AdminDashboard`) is available to users with `role: "admin"`. It provides full platform oversight with the following tabs:

| Tab | What you can do |
|---|---|
| **Users** | Search by name/email, view full profiles, change role (user/admin), verify instantly, delete accounts |
| **Properties** | Review all listings, approve, reject, feature, or remove any property |
| **Swaps** | Monitor all swap requests, view status, host/guest details, and swap dates |
| **Verifications** | Review submitted verification documents, approve or reject with reviewer notes |
| **Reviews** | Moderate user-submitted reviews — approve, flag, reject, or unpublish |
| **Subscriptions** | View all active subscribers, their plan tier, and renewal dates |
| **GuestPoints** | View all GuestPointTransactions across the platform, sorted by user or date |
| **Referrals** | Full referral leaderboard, top 10 referrers, conversion stats |
| **Settings** | Configure maintenance mode, waitlist toggle, early-bird discount %, waiver referral threshold, max properties per user, and more |
| **Activity Log** | Live audit trail of platform events (property created, swap initiated, user verified, etc.) |

---

## 🗄️ Database Models (Prisma/SQLite)

| Model | Key Fields | Purpose |
|---|---|---|
| `User` | `email`, `guest_points`, `subscription_status`, `verification_status`, `role` | User accounts with points and subscription data |
| `Property` | `owner_email`, `title`, `nightly_points`, `swap_preference`, `status` | Home listings with availability and amenities |
| `SwapRequest` | `requester_email`, `host_email`, `status`, `video_call_completed`, `total_points` | Full swap lifecycle tracking |
| `Message` | `conversation_id`, `sender_email`, `content`, `is_read` | Chat messages per conversation thread |
| `VideoCall` | `swap_request_id`, `room_url`, `scheduled_time`, `meeting_completed` | Daily.co video call session records |
| `SubscriptionPlan` | `name`, `price`, `type`, `features`, `exchanges_per_year` | Stripe-backed plan definitions |
| `PaymentTransaction` | `user_email`, `amount`, `status`, `payment_gateway_id` | Stripe payment and invoice records |
| `GuestPointTransaction` | `user_email`, `points`, `balance_after`, `transaction_type` | Full point audit log |
| `Verification` | `user_email`, `status`, `document_url`, `reviewer_notes` | Identity verification submissions |
| `Review` | `property_id`, `author_email`, `rating`, `status` | Property and user reviews with moderation status |
| `Notification` | `user_email`, `type`, `title`, `message`, `is_read` | In-app notification records |
| `Referral` | `referrer_email`, `referred_email`, `status` | Referral chain tracking |
| `ActivityLog` | `activity_type`, `description`, `is_public` | Platform-wide event audit trail |
| `PlatformSettings` | `platform_status`, `maintenance_mode`, `early_bird_discount_pct` | Global configuration |
| `TypingStatus` | `conversation_id`, `user_email`, `is_typing` | Real-time typing indicators |
| `PinnedConversation` | `user_email`, `conversation_id` | User-pinned conversations |
| `MessageReaction` | `message_id`, `user_email`, `emoji` | Emoji reactions on messages |

---

## 🔌 Additional Services Required

Beyond Node.js and Google OAuth, you will also need accounts for:

| Service | Purpose | Link |
|---|---|---|
| **Stripe** | Subscription billing and checkout | [stripe.com](https://stripe.com) |
| **Daily.co** | Video call room creation for swap vetting | [daily.co](https://daily.co) |
| **Resend** | Transactional email (OTP, password reset, notifications) | [resend.com](https://resend.com) |
| **LinkedIn Developers** | LinkedIn OAuth sign-in (optional) | [linkedin.com/developers](https://www.linkedin.com/developers/) |

---

## 🌐 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="your-long-random-jwt-secret"

# URLs
BACKEND_URL="https://your-backend.onrender.com"
FRONTEND_URL="https://your-frontend.onrender.com"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."

# Resend (Email)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."       # or sk_test_... for development
STRIPE_WEBHOOK_SECRET="whsec_..."

# Daily.co
DAILY_API_KEY="..."
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL="https://your-backend.onrender.com"
VITE_GOOGLE_CLIENT_ID="..."
```

---

## 🔌 API Overview

All entity CRUD operations are handled by a single generic router at `/api/entities/:entity`:

```
GET    /api/entities/:entity          — list / filter (supports ?field=value, _sort, _limit, _offset)
GET    /api/entities/:entity/:id      — get one record by ID
POST   /api/entities/:entity          — create a new record
PATCH  /api/entities/:entity/:id      — partial update a record
DELETE /api/entities/:entity/:id      — delete a record
```

Available entities: `Property`, `SwapRequest`, `Message`, `Notification`, `Verification`, `Review`, `VideoCall`, `SubscriptionPlan`, `PaymentTransaction`, `GuestPointTransaction`, `Referral`, `ActivityLog`, `PlatformSettings`, `User`, `TypingStatus`, `PinnedConversation`, `MessageReaction`

### Business Logic Functions (`/api/functions/*`)

| Endpoint | Method | Description |
|---|---|---|
| `completeSwap` | POST | Marks swap as completed; transfers GuestPoints from guest to host |
| `createVideoCallRoom` | POST | Creates a Daily.co video room and stores it on the swap |
| `markVideoCallCompleted` | POST | Sets `video_call_completed = true` on a SwapRequest |
| `createStripeCheckoutSession` | POST | Creates a Stripe Checkout Session for a subscription plan |
| `getSwapStats` | GET | Returns swap history analytics for a given user |
| `updateUserPoints` | POST | Manually adjust a user's GuestPoint balance (admin only) |

### Auth Endpoints (`/api/auth/*`)

| Endpoint | Method | Description |
|---|---|---|
| `/register` | POST | Register with email + OTP flow |
| `/verify-otp` | POST | Verify the OTP to complete registration |
| `/login` | POST | Email/password login — returns JWT |
| `/me` | GET | Get the currently authenticated user |
| `/google` | GET | Redirect to Google OAuth |
| `/google/callback` | GET | Google OAuth callback |
| `/linkedin` | GET | Redirect to LinkedIn OAuth |
| `/linkedin/callback` | GET | LinkedIn OAuth callback |
| `/forgot-password` | POST | Send password reset email |
| `/reset-password` | POST | Reset password with token |

---

## 🚢 Deployment

The app is deployed on **Render**:
- **Backend**: Node.js web service — set start command to `npm start` in `/backend`
- **Frontend**: Static site — build command `npm run build` in `/frontend`, publish directory `/dist`

### First-time deploy steps:

1. Push code to GitHub
2. Create a Render web service for the backend, link the repo
3. Add all backend environment variables in the Render dashboard
4. Create a Render Disk (at least 1GB) and mount it at `/backend/prisma` to persist SQLite across deploys
5. In the backend service's shell, run:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
6. Create a Render static site for the frontend with `VITE_API_URL` pointing to your backend URL
7. Configure your Stripe webhook to point to `https://your-backend.onrender.com/api/webhook`

---

## Contributors
- [@Qasim9937](https://github.com/Qasim9937) — Qasim Kolawole Adebisi
- [@tayari-org](https://github.com/tayari-org) — Tayari
