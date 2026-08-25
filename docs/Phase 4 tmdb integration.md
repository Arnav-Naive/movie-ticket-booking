# Phase 4 — TMDB Integration (Real Movie Data)

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Stop using fake/placeholder movie data. Pull real movie info from TMDB, store only what's needed in your own database, and expose it through your own API — with import restricted to admins.

**Status:** ✅ Done — admin-only search/import working, public movie list/detail working, permission enforcement confirmed (normal users get 403 on admin-only actions).

---

## 1. What TMDB actually is, and why the project uses it this way

TMDB (The Movie Database) is a free, public database of movie information — titles, posters, descriptions, cast, ratings, release dates. It exposes this data through an API: your backend sends a request, TMDB sends back the data as JSON. This is the same pattern real platforms use (Netflix-style apps rarely hand-type every movie's metadata themselves).

The important architectural decision here, from the PRD, is:

> **TMDB is not the app's live source of truth. It's a one-time (or on-demand) import source.**

The flow is: Django asks TMDB for a movie → gets the data → **saves a copy into your own Postgres `Movie` table**. From then on, your app reads from *your own database*, not TMDB, every time a user browses movies. This matters for two reasons: your app doesn't slow down or break if TMDB is ever unreachable, and you're not sending a TMDB request every single time someone loads the movie list.

---

## 2. Getting API access — the account + token

TMDB requires a free account and an API credential before it'll answer any requests. After registering (Settings → API → Request an API Key → "Developer" use-case), TMDB gives you **two** different credentials:

- **API Key (v3 auth)** — an older, shorter key style
- **API Read Access Token (v4 auth)** — a newer, longer token

This project uses the **v4 token**, stored as:
```
TMDB_ACCESS_TOKEN="<the long v4 token>"
```
in `backend/.env` — same pattern as `SECRET_KEY` and the DB credentials from Phase 2: never hardcoded in a file, always read via `python-decouple`'s `config(...)`, and never committed to Git.

---

## 2a. The `Movie` model — deciding what to actually store

```python
class Movie(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    title = models.CharField(max_length=255)
    overview = models.TextField(blank=True)
    poster_path = models.CharField(max_length=255, blank=True, null=True)
    backdrop_path = models.CharField(max_length=255, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    runtime = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=10, blank=True, null=True)
    rating = models.FloatField(blank=True, null=True)
    genre = models.CharField(max_length=255, blank=True, null=True)
    ...
```

TMDB's raw response for a single movie contains dozens of fields. This model deliberately stores only what the app actually needs to display and filter on — this is a direct, intentional choice from the PRD (Section 4.3), not an oversight. Two fields deserve a specific callout:

- **`tmdb_id`, marked `unique=True`** — this is what prevents the same movie from being imported twice. Before importing, the app can check "does a `Movie` with this `tmdb_id` already exist?" and skip re-creating it.
- **`poster_path` / `backdrop_path` are just strings, not images** — TMDB doesn't give you the actual image file, it gives you a *path fragment* that gets combined with TMDB's image base URL to build a full image link when the frontend needs to display it. Storing the path (not the image itself) keeps your database small.

---

## 3. Search, import, and why import is admin-only

The general shape of this feature (per the PRD's API structure) is: an endpoint lets an admin **search** TMDB by title, see results, and **import** a chosen one — which is what triggers "fetch full details from TMDB → save into the `Movie` table."

The reason this is restricted to admins, not open to every logged-in user, comes straight from one of the project's core business rules: *the frontend never decides what data exists — the backend does, deliberately.* If any user could trigger a TMDB import, someone could flood your database with junk data, or hit TMDB's rate limits on your app's behalf. Keeping import admin-only means your movie catalog only grows when *you* (or another admin) decide it should.

**Public movie list/detail**, by contrast, needs no special permission — anyone should be able to browse `GET /api/movies/` and `GET /api/movies/{id}/` without logging in, since browsing movies is meant to happen before a user even considers creating an account.

---

## 4. What "permission enforcement confirmed (403)" actually proves

Testing this wasn't just "does importing work" — it specifically tested "does importing *correctly refuse* the wrong person." A normal (non-admin) user hitting the import endpoint got back a `403 Forbidden` — Django's way of saying "I know who you are, but you're not allowed to do this." This is different from a `401 Unauthorized` (which means "I don't know who you are at all").

This matters because it's the first real test of a rule stated back in the PRD's security section: *admin-only operations require admin permissions, enforced server-side* — not a button that's merely hidden in the React UI. Even if someone bypassed the frontend entirely and called the API directly (like with Postman), the backend itself refuses the request.

---

## 5. Connecting the dots

```
TMDB (external, free API)
     │  admin searches + imports (admin-only, enforced server-side)
     ▼
Movie table (your own Postgres DB, via Phase 0/2's connection)
     │
     ├── GET /api/movies/       ← public, anyone can browse
     └── GET /api/movies/{id}/  ← public, anyone can view details

Permission chain reused from Phase 2:
   Authorization: Bearer <token>  ──►  who is this user?
   is_staff / is_admin check      ──►  are they allowed to import?
```

This is the first phase where the "frontend displays, backend decides" rule (Section 39 of the PRD) actually got tested against a real attempt to break it — and held. Every future admin-only feature (creating theatres, shows, etc. in Phase 5+) will follow this exact same permission pattern.

---

## 6. Checklist

- [x] Free TMDB account created, v4 Read Access Token obtained
- [x] Token stored in `backend/.env` as `TMDB_ACCESS_TOKEN` (never committed)
- [x] `movies` app created and registered in `INSTALLED_APPS`
- [x] `Movie` model created with only the needed fields (not TMDB's full response), `tmdb_id` unique
- [x] Migrations created and applied
- [x] Admin-only search/import working
- [x] Public movie list + detail endpoints working, no auth required
- [x] Confirmed a normal (non-admin) user gets `403` when attempting import
- [x] Code committed and pushed

---

**Next: Phase 5 — Cinema data (City → Theatre → Screen → Seat), four interconnected models. Longer phase than the last few.**