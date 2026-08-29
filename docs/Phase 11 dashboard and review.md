# Phase 11 — Project Health Review + Admin Dashboard

**Project:** Movie Ticket Booking Platform
**Status:** ⚠️ **Dashboard code written, not yet tested/confirmed** — no test output was in what you pasted this time. Treat this phase as in-progress until you paste the actual Postman result.

---

## 1. The health check — arguably more important than the code in this phase

Before writing any new code, the backend so far was checked against the PRD's actual checklist, not just "does it feel done." Worth documenting this review itself, because the habit of doing it matters as much as the specific findings.

### Confirmed solid
Auth/JWT/custom User, TMDB import, City/Theatre/Screen/Seat CRUD, Show filtering + `ShowSeat` auto-generation, seat hold concurrency (real parallel-request tested), booking with server-side pricing, Razorpay order + signature verification (real test payment confirmed), QR ticket + admin verification, and the past-show rejection fix — all previously built **and** verified with actual test evidence, not just "written and assumed working."

### Three real gaps found

1. **Booking cancellation is entirely missing** — PRD Section 17 and business rule #15 both require it, and it hasn't been built yet. Deliberately deferred, not forgotten.
2. **The `release-seats` endpoint is missing** — the PRD explicitly lists it (Section 26) as its own endpoint (seats going back to `AVAILABLE` on cancellation/failure), and it doesn't exist yet. This shares the same underlying logic as cancellation, so the plan is to build both together.
3. **The frontend has fallen far behind the backend.** Since Phase 3, the frontend hasn't been touched beyond throwaway test pages (Login/Register/Payment, built purely to prove the backend worked). There's no real movie browsing, no seat-map UI, no booking flow UI — everything so far has been tested through Postman, not through an actual usable app.

### Why gap #3 is the one worth taking seriously

This is worth internalizing plainly, not softening: **a fully working backend with no usable frontend is not a demoable project.** The PRD's MVP explicitly requires a working *user-facing app*, not just a set of correct API endpoints. If Phases 11–13 (dashboard, cancellation, testing, Docker) all get finished while the frontend stays frozen at "test pages only," the project would reach Phase 14 (deployment) with nothing a recruiter or evaluator could actually click through — and for placements specifically, **what gets evaluated is the UI someone can interact with, not the API surface underneath it.** A backend-only demo, however technically sound, doesn't communicate that to someone who isn't going to open Postman.

### The decision made

Rather than building the frontend piecemeal alongside each remaining backend phase, the chosen order is: **finish the backend completely first** (Phase 11 dashboard → cancellation/release-seats → testing → Docker), **then** do one focused, larger push to build the real frontend (movie browsing, seat map, booking flow — the pages originally scoped in PRD Sections 19–24) as its own dedicated phase, before deployment. This trades a longer stretch without visible UI progress for not context-switching between backend logic and frontend UI work repeatedly — a reasonable trade-off, as long as the frontend push actually happens before deployment and doesn't get treated as optional "if there's time" work.

---

## 2. Phase 11 itself — Admin Dashboard

No new models needed — this phase is purely about *aggregating* data that already exists across `Movie`, `Theatre`, `Show`, `User`, and `Booking`.

```python
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    top_movies = (
        Booking.objects.filter(status='CONFIRMED')
        .values('show__movie__title')
        .annotate(booking_count=Count('id'))
        .order_by('-booking_count')[:5]
    )
    ...
```

Two Django ORM techniques worth actually understanding, since they're doing the real work here:

### `.aggregate(Sum('total_amount'))` — let the database do the math

This computes the total revenue **inside PostgreSQL itself**, in a single query, rather than pulling every `Booking` row into Python and summing them in a loop. For a handful of test bookings the difference is invisible; for a real dataset with thousands of rows, doing the sum in the database is dramatically faster and uses far less memory — the database is built for exactly this kind of aggregation.

### `.values(...).annotate(Count(...))` — the ORM's version of "group by"

```python
Booking.objects.filter(status='CONFIRMED')
    .values('show__movie__title')      # group by movie title
    .annotate(booking_count=Count('id'))  # count bookings per group
    .order_by('-booking_count')[:5]       # sort descending, take top 5
```
Read this the same way you'd read SQL's `GROUP BY`: `.values('show__movie__title')` tells Django "group the results by this field" (walking the `Booking → Show → Movie → title` chain, same double-underscore relationship-traversal pattern from Phase 6's filtering), `.annotate(Count('id'))` counts how many bookings fall into each group, and `.order_by('-booking_count')[:5]` sorts by that count (descending, the `-` prefix) and keeps only the top 5. This is meaningfully different from filtering (Phase 6) — filtering narrows *which rows* you see; this reshapes the result into *summarized groups*.

### `IsAdminUser` — a built-in permission, not a custom one this time

Unlike `IsAdminOrReadOnly` (written by hand back in Phase 5 for the "public read, admin write" pattern), `IsAdminUser` is one of DRF's **built-in** permission classes — it simply requires `request.user.is_staff` to be `True` for *any* access at all, since a dashboard has no legitimate "public read" case the way browsing movies or theatres does. Using a built-in class here instead of writing a new one is the right call — no need to hand-roll something DRF already provides correctly.

### Where the view lives — a deliberate structural choice

Rather than adding this to `bookings/views.py` or creating an entirely new Django app just for one endpoint, it was placed in a standalone `backend/dashboard_views.py`, sitting at the project root rather than inside any single app. The reasoning: this endpoint pulls from *five different apps* (`movies`, `cinemas`, `shows`, `users`, `bookings`) — it doesn't conceptually "belong" to any one of them more than another, so forcing it into one app's `views.py` would be a bit of a misfit. A tiny standalone file, wired directly into `config/urls.py`, better reflects what the endpoint actually is: a cross-cutting summary, not a feature of any single app.

---

## 3. Connecting the dots

```
Movie, Theatre, Show, User, Booking  (data already built across Phases 4–8)
                │
                ▼
   admin_dashboard()  ──►  aggregate() and values()/annotate() summarize it
                │              (no new tables, purely computed on read)
                ▼
   IsAdminUser  ──► only staff can view the summary
                │
                ▼
   GET /api/admin/dashboard/  (registered directly in config/urls.py,
                                not tied to any single app's urls.py)
```

This dashboard endpoint reads from every model built so far but changes none of them — it's the first purely "read and summarize" feature in the project, as opposed to everything before it, which created or modified data.

---

## 4. What's still open before this phase can be marked done

- [ ] Confirm `python manage.py runserver` restarts cleanly with the new file/route (no import errors)
- [ ] Test `GET /api/admin/dashboard/` with an admin token → expect `200` with real numbers (`total_movies`, `total_revenue`, `top_movies`, etc.)
- [ ] Test the same endpoint with a normal (non-admin) user token → expect `403` — same permission-check discipline as every previous admin-only feature
- [ ] Commit and push once confirmed

---

**Next after this is actually confirmed: cancellation + `release-seats` together, then testing, then Docker Compose — before the dedicated frontend-completion push.**