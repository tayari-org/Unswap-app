# Unswap - Home Exchange for International Civil Servants

Unswap is a premium, closed-loop home exchange platform built for the UN, World Bank, IMF, and the global diplomatic corps. 

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Google Cloud Platform Account (for OAuth)

### Backend Setup
1. `cd backend`
2. `npm install`
3. `cp .env.example .env` (Add your database and Google credentials)
4. `npx prisma migrate dev`
5. `npm run dev`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env` (Add your VITE_GOOGLE_CLIENT_ID)
4. `npm run dev`

## 🏗️ Project Architecture
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express, Prisma (PostgreSQL).
- **Authentication**: JWT & Google OAuth.

## 📄 Core Documents
- [Features & Walkthrough](file://./walkthrough.md)
- [System Architecture](file://./architecture.md)

## ✨ Core Features
- **Referral Tiers**: Viral growth with milestone rewards.
- **Verification Gate**: Institutional verification for trust.
- **Luxury Aesthetic**: Clean, professional light mode design.
- **Swap Requests**: Streamlined home exchange workflow.
