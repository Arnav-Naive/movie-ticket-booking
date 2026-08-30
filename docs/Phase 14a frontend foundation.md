# Frontend Completion — Part 1: Foundation + Core Booking Flow

**Project:** Movie Ticket Booking Platform
**Goal:** Replace the throwaway test pages (frozen since Phase 3) with the real, working frontend — movie browsing, seat selection, booking, payment, and tickets, all wired to the real backend.

**Status:** ✅ Core flow built and confirmed end-to-end (movie → show → seats → summary → payment → ticket → my bookings).

---

## 1. The foundation, before any real pages

### `AuthContext` — one shared "who's logged in" box

Before this, every page would have had to separately read `localStorage` to check login status. `AuthContext` centralizes it: on app load, it checks for a saved token, and if found, calls `/auth/me/` to confirm it's still valid and fetch the current user. Any page can then just call `useAuth()` to get `user`, `login()`, `logout()` — instead of touching `localStorage` directly everywhere. This is a standard React pattern: **Context** is React's way of sharing state across many components without manually passing it down through every layer.

### Global CSS variables (`index.css`)

Colors (`--bg`, `--red`, `--card`, etc.) were defined once as CSS variables and referenced everywhere (`var(--red)`) rather than hardcoded per component. This is what makes a consistent dark theme possible without repeating hex codes in every file, and means changing the theme later means editing one place.

### `Navbar` reading from `AuthContext`

The navbar conditionally shows Login/Sign Up when logged out, or "Hi, {username}" + Logout + My Bookings when logged in — driven entirely by `useAuth()`'s `user` value, so it updates automatically wherever `AuthContext` changes.

---

## 2. Movie browsing

### `Home.jsx`
Fetches `/api/movies/` (Phase 4's public endpoint) and renders a grid of movie cards, each linking to `/movies/:id`. Standard React data-fetching pattern: `useEffect` triggers the API call once on mount, `loading`/`error`/data states each render something different — the same loading/error/empty-state discipline the PRD asked for back in its "frontend states" requirements section.

### `MovieDetails.jsx`
Fetches a single movie by ID (from the URL, via `useParams()`), shows the full TMDB data (poster, rating, runtime, genre, overview), with a "Book Tickets" button linking to `/book/:movieId`.

---

## 3. The booking flow — page by page, mapped to the backend already built

This is the part worth understanding as a *chain*, since each page calls exactly one backend feature already built in earlier phases:

```
MovieDetails ("Book Tickets")
      │
      ▼
BookShow.jsx        ──► GET /api/shows/?movie={id}        (Phase 6's filtering)
      │ ("Select Seats")
      ▼
SeatSelection.jsx   ──► GET /api/shows/{id}/seats/         (Phase 7's ShowSeat status)
      │                 POST /api/shows/{id}/hold-seats/   (Phase 7's concurrency-safe hold)
      │ ("Continue")
      ▼
BookingSummary.jsx  ──► POST /api/bookings/                (Phase 8's server-side pricing)
      │ ("Proceed to Payment")
      ▼
Payment.jsx         ──► POST /api/payments/create-order/   (Phase 9's Razorpay order)
      │                 Razorpay checkout popup
      │                 POST /api/payments/verify/         (Phase 9's signature check)
      ▼
Ticket.jsx          ──► GET /api/bookings/{id}/ticket/     (Phase 10's QR ticket)
```

Every one of these pages is, at its core, a thin UI layer over an endpoint that was already built and tested via Postman in earlier phases — this frontend push didn't invent new backend logic, it exposed what already existed to an actual user.

### `SeatSelection.jsx` — the seat map UI

Renders each seat as a clickable button, colored by its status (`AVAILABLE`/selected/`HELD`/`BOOKED`), grouped by row. Clicking toggles a seat in/out of a `selected` array (only if it's `AVAILABLE`). "Continue" sends the selected seat IDs to `hold-seats/` — the same endpoint, and the same concurrency protection, tested with real parallel requests back in Phase 7.

### `Payment.jsx` — the actual Razorpay checkout wiring

This is the frontend half of Phase 9's payment flow: it calls `create-order/`, gets back Razorpay's `order_id` + a `key_id`, then opens Razorpay's own checkout widget (loaded via a `<script>` tag pointing at `checkout.razorpay.com`) with those values. Razorpay's popup handles card/UPI/netbanking entry itself — none of that UI is custom-built. Once Razorpay reports success, its `handler` callback fires, sending the returned `payment_id` + `signature` to `/verify/` — the exact backend check from Phase 9 that either confirms the booking or rejects it.

---

## 4. Recurring friction worth remembering (not new bugs, just re-encountered ones)

A few things came up repeatedly while building this flow — worth naming plainly since they'll keep happening otherwise:

- **`DB_HOST` needing to differ between local (`localhost`) and Docker Compose (`postgres`)** — this tripped things up more than once (backend crashing with `ERR_EMPTY_RESPONSE` when the wrong value was set for whichever way it was being run). The rule from Phase 13 still holds: never run local `venv` and Docker Compose at the same time, and always double-check `.env` matches whichever one is actually running.
- **JWT's 5-minute access token expiry** — surfaced again here as confusing frontend errors ("prohibited" cursor icon on seat clicks, blank pages) whenever a token expired mid-testing. This is the same non-bug first explained back in Phase 8.
- **`docker compose down` resets the database** unless volumes are explicitly preserved — this wiped City/Theatre/Screen/Seat/Movie data mid-session more than once, requiring re-creating reference data from scratch via Django admin. Worth remembering: `docker compose restart` is safer for picking up code changes; `down` + `up` is sometimes necessary (e.g. for `.env` changes to actually reload) but destroys unpersisted state.
- **Editing `.env` alone doesn't apply inside a running container** — `docker compose restart` was found to *not* reliably reload `env_file` values in this setup; a full `docker compose down && docker compose up -d` was needed to force a fresh read of the updated `.env`. This is a genuine Docker Compose gotcha worth remembering specifically.

---

## 5. Checklist

- [x] `AuthContext` created — shared login state across the app
- [x] `Navbar` reads live auth state instead of manually checking `localStorage`
- [x] Home page fetching and rendering real TMDB-backed movies
- [x] Movie Details page showing full movie data
- [x] Show selection page (`BookShow`) using Phase 6's filtering
- [x] Seat map (`SeatSelection`) using Phase 7's hold logic, including real concurrency protection
- [x] Booking Summary (`BookingSummary`) using Phase 8's server-calculated pricing
- [x] Razorpay checkout wired into `Payment.jsx`, using Phase 9's order + verify flow
- [x] Ticket page displaying the QR code from Phase 10
- [x] My Bookings page, user-scoped, linking to tickets for confirmed bookings
- [x] Full flow confirmed end-to-end through the actual UI (not just Postman)

---

**Continues in Part 2 — the UI/UX polish pass (toasts, dialogs, responsive nav, redesigned auth pages, a real login-state bug fix, profile page, 404 page, token lifetime, seat-hold countdown).**