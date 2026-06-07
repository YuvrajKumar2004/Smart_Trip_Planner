# TripPlanner Frontend

Modern React frontend for the Smart Trip Planning & Expense Split System.

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Zustand | Global state (auth) |
| Axios | API client with interceptors |
| React Hook Form | Form management |
| Framer Motion | Animations |
| Recharts | Admin dashboard charts |
| React Hot Toast | Notifications |
| Lucide React | Icons |

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          Sticky glass navbar, auth-aware, mobile responsive
│   └── Footer.jsx          Full footer with links
│
├── pages/
│   ├── HomePage.jsx        Hero, features, popular trips, how-it-works, CTA
│   ├── AuthPages.jsx       Login + Register (shared layout, Google OAuth2)
│   ├── ExplorePage.jsx     Browse + filter predefined trips (7 filter params)
│   ├── TripDetailPage.jsx  Full trip detail + Razorpay booking flow
│   ├── MyTripsPage.jsx     User trips list + Create Trip modal
│   ├── ExpensePage.jsx     Expenses, balances, simplified debt settlement
│   ├── BookingsPage.jsx    Booking history + cancel with refund
│   ├── RecommendationPage.jsx  AI recommendations + budget optimizer
│   ├── ProfilePage.jsx     Edit profile, change password
│   └── AdminDashboard.jsx  Stats cards, revenue chart, pie chart, users table
│
├── services/
│   ├── api.js              Axios instance with JWT inject + auto refresh
│   └── index.js            All API calls organized by module
│
├── store/
│   └── authStore.js        Zustand store — login/register/logout/isAdmin
│
├── utils/
│   └── helpers.js          formatINR, debounce, initials, STATUS_COLORS etc.
│
├── App.jsx                 Router with ProtectedRoute + GuestRoute guards
├── index.js                Entry point
└── index.css               Full design system (dark theme, tokens, components)
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
echo "REACT_APP_API_URL=http://localhost:8080/api" > .env

# 3. Start dev server
npm start
# Runs on http://localhost:3000
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8080/api
```

## Pages & Routes

| Route | Access | Page |
|-------|--------|------|
| / | Public | Landing / Home |
| /login | Guest only | Login |
| /register | Guest only | Register |
| /explore | Public | Browse trips |
| /explore/:id | Public | Trip detail + Book |
| /trips | Auth | My trips |
| /trips/:id/expenses | Auth | Expenses & settlement |
| /bookings | Auth | Booking history |
| /recommend | Auth | AI recommendations |
| /profile | Auth | User profile |
| /admin | Admin | Admin dashboard |

## Key Features

### Auth
- JWT login/register with form validation
- Google OAuth2 redirect flow
- Auto token refresh on 401 via Axios interceptor
- Zustand persisted auth store (survives page refresh)

### Explore
- Debounced keyword search
- 6 filter parameters: category, budget range, season, transport, duration
- Paginated results with animated cards
- Skeleton loading states

### Trip Booking (Razorpay)
- 2-step flow: create order → verify signature
- Razorpay checkout modal opens in-browser
- Backend-verified payment on success

### Expenses
- Add expense with EQUAL / CUSTOM / PERCENTAGE split
- Balance summary per member (paid vs owed vs net)
- Simplified transactions from debt algorithm
- One-click "Mark Settled"

### Admin Dashboard
- Real-time stats cards with trend indicators
- Recharts BarChart for monthly revenue
- PieChart for bookings by category
- Users table with booking stats

## Design System

Dark-first design with:
- CSS custom properties (all colors, spacing, radius, shadows)
- Clash Display + Cabinet Grotesk fonts
- Framer Motion animations on all major interactions
- Glass morphism cards with blur + border
- Ambient gradient orbs on hero sections
- Fully responsive (mobile breakpoints via CSS)