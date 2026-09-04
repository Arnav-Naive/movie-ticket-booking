# Phase 19 — Custom Admin Panel

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Done — both a Render crash and a Postman permission gap hit and fixed along the way.

---

## Why build a second admin interface at all

Django's built-in `/admin/` already existed and worked — but it's generic, one-record-at-a-time, and not designed for the specific repetitive tasks this project's admin actually does (importing movies, building seat layouts, checking ticket validity). This phase builds a *purpose-built* admin frontend at `/admin-panel/*`, reusing backend endpoints that mostly already existed rather than inventing new ones.

## What was genuinely new on the backend

- **Movie edit/delete** — `MovieDetailView` upgraded from read-only to `RetrieveUpdateDestroyAPIView`, gated by the existing `IsAdminOrReadOnly`.
- **Seat-layout bulk builder** — `build_seat_layout` takes a list like `[{"row": "A", "count": 10, "seat_type": "REGULAR"}, ...]` and creates every seat in one call, using `get_or_create` per seat so it's safe to re-run without creating duplicates. This directly replaces the one-by-one manual seat entry through Django admin that's been done by hand since Phase 5 — a genuine time-saver going forward, not just a nicety.
- **All-bookings admin view** — `AdminBookingsView`, filterable by status and searchable by reference, restricted to `IsAdminUser`. `BookingSerializer` gained a `username` field so admins can see *whose* booking each row is (harmless to expose to regular users too, since they only ever see their own bookings anyway via the existing user-scoped `/my/` endpoint).
- **User list + deactivate** — read-only list plus a toggle-active action, deliberately **not** full user editing. This was an intentional scope limit: giving an admin panel the ability to edit arbitrary user fields (email, password, etc.) is a meaningfully larger trust/security surface than a college project needs, and deactivating a `is_staff` account is explicitly blocked in the view itself.

Reused as-is: the existing City/Theatre/Screen/Seat/Show ViewSets already supported full CRUD via `IsAdminOrReadOnly` — no changes needed there, just a frontend that calls them.

## Two real bugs hit deploying this

**1. `NameError: User is not defined` on Render.** `User = get_user_model()` was written *below* `AdminUserListView`, which references `User` at class-definition time — Python executes top to bottom, so the class definition failed before the assignment below it ever ran. Fix: move `User = get_user_model()` above its first use, right after the imports. A reminder that Python module-level code order matters, not just inside functions.

**2. Postman `"Method PATCH not allowed"` on movies** — this turned out not to be a separate bug at all: the deploy that changed `MovieDetailView` to support `PATCH` never actually shipped, because the *same* commit's crash (bug #1) meant Render never got past a failed build to serve the new code. Fixing bug #1 fixed this too, with no separate change needed — worth remembering that one crash can make multiple, seemingly-unrelated things look broken simultaneously.

## The frontend structure

A protected route tree: `AdminRoute` checks `user?.is_staff` and redirects to home otherwise (checked client-side for UX — the *real* enforcement is every underlying endpoint's `IsAdminUser`/`IsAdminOrReadOnly`, so a regular user can't actually reach protected data even if they bypassed the frontend redirect). `AdminLayout` provides a sidebar + `<Outlet />` for React Router's nested routing, with six sections: Dashboard (existing Phase 11 stats endpoint, now with a real UI instead of raw JSON), Movies, Theatres & Screens (including the new seat-layout builder, using a compact `Row:Count:Type` shorthand input), Shows, Bookings, Verify Ticket (a UI wrapper around Phase 10's `verify-ticket` endpoint), and Users.

---

## Checklist
- [x] Movie edit/delete enabled via existing permission pattern
- [x] Bulk seat-layout builder — replaces manual one-by-one seat creation
- [x] Admin all-bookings view, filterable/searchable
- [x] User list + deactivate (deliberately not full user editing)
- [x] `NameError` (import-order bug) diagnosed and fixed
- [x] Confirmed the "PATCH not allowed" issue was a symptom of the same crash, not a separate bug
- [x] `/admin-panel/*` route tree built: Dashboard, Movies, Theatres/Screens, Shows, Bookings, Verify, Users
- [x] Route protected client-side (`AdminRoute`) with real enforcement still living server-side
- [x] Confirmed: non-admin navigating to `/admin-panel` directly gets redirected home
- [x] Committed and pushed