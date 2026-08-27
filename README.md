# CineMax — Movie Ticket Booking Platform

A full-stack movie ticket booking web application inspired by BookMyShow, built as a college project. Real movie data via TMDB, real theatre/seat/booking management via a custom backend, and simulated payments via Razorpay Test Mode.

> This is **not** affiliated with or connected to BookMyShow or any real cinema chain. It uses TMDB solely for movie metadata.

## Features

- User registration/login with JWT authentication
- Browse real movies (posters, ratings, genre, cast overview) via TMDB
- City → Theatre → Screen → Seat management (admin)
- Show scheduling with movie/city/theatre/date filtering
- Interactive seat map with live availability
- Concurrency-safe seat holding (row-level DB locking — two users can never book the same seat)
- Server-side price calculation (never trusts frontend-supplied amounts)
- Razorpay Test Mode checkout with backend signature verification
- QR-coded e-tickets
- Booking cancellation with a 30-minute-before-showtime cutoff
- Admin dashboard with booking/revenue stats
- Fully Dockerized (frontend + backend + PostgreSQL run with one command)
- Automated backend test suite (18 tests covering auth, concurrency, bookings, payments)

## Tech Stack

**Frontend:** React (Vite), React Router
**Backend:** Django, Django REST Framework, Simple JWT
**Database:** PostgreSQL
**Payments:** Razorpay (Test Mode)
**Movie Data:** TMDB API
**Infra:** Docker, Docker Compose

## Architecture

React Frontend → Django REST API → PostgreSQL
↓
TMDB API · Razorpay


## Getting Started

### Prerequisites
- Docker Desktop installed and running
- A [TMDB API key](https://www.themoviedb.org/settings/api) (v4 Read Access Token)
- A [Razorpay Test Mode](https://dashboard.razorpay.com) Key ID + Key Secret

### Setup

1. Clone the repo:
git clone <repo-url>
cd movie-ticket-booking


2. Create `backend/.env` (see `backend/.env.example` for the full list of required variables) with your own `SECRET_KEY`, database credentials, TMDB token, and Razorpay keys. **Set `DB_HOST=postgres`** for Docker Compose.

3. Create `frontend/.env`:

VITE_API_URL=http://127.0.0.1:8000/api

4. Start everything:
docker compose up -d

5. Run migrations and create an admin user:
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

6. Open:
   - Frontend: http://localhost:5173
   - Backend admin: http://localhost:8000/admin

7. Import a movie via Django admin or the API (`/api/movies/tmdb/search/` then `/api/movies/tmdb/import/`, admin-only), and set up at least one City → Theatre → Screen → Seats → Show via Django admin so the frontend has something to display.

### Running Tests

docker compose exec backend python manage.py test


## API Overview

| Area | Base path |
|---|---|
| Auth | `/api/auth/` |
| Movies | `/api/movies/` |
| Cinemas (city/theatre/screen/seat) | `/api/` |
| Shows & seat holds | `/api/shows/` |
| Bookings | `/api/bookings/` |
| Payments | `/api/payments/` |
| Admin dashboard | `/api/admin/dashboard/` |

## Notes

- Movie data is provided by [TMDB](https://www.themoviedb.org/) but this product is not endorsed or certified by TMDB.
- All payments run through Razorpay **Test Mode** — no real transactions occur.

## Author

Arnav Fating — B.Tech Computer Science, DRIEMS University