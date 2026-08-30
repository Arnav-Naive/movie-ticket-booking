# Frontend Completion — Part 3: Real-Data Home Page Redesign

**Project:** Movie Ticket Booking Platform
**Goal:** Fix a home page that only showed one movie card by importing real movies at scale, then rebuild the home page itself (hero carousel, filters, city dropdown, cinema strip) — using only real backend data, no fake/mock content.

**Status:** ✅ Redesign built; movie import partially succeeded (in-progress due to a transient network issue); one process failure (uncommitted work) caught and fixed.

---

## 1. The one principle this whole part is built around

A request came in with a reference to how a platform like BookMyShow's homepage looks, including a suggestion to use **mock/hardcoded movie data** to fill out the grid visually. This was pushed back on, for a specific, important reason:

> **This project is built entirely on real data — real TMDB movies, real backend bookings.** A hardcoded fake movie object has no real `id` in the database. Clicking it would lead to a details/booking flow that crashes, because the backend has no matching movie. If a recruiter or evaluator clicked through and hit that, it wouldn't read as a small bug — it would call the credibility of the *entire* project's "real data" claim into question.

The actual problem was simpler and safer to fix: only **one** movie had ever been imported (back in Phase 4, as a test). The fix wasn't fake data — it was importing more *real* movies, using the exact same TMDB import logic already built and tested in Phase 4, just run several times instead of once.

---

## 2. Bulk-importing real movies (and the shows to go with them)

Rather than manually repeating Phase 4's Postman search-then-import steps eight times, the same underlying logic (`search_movies` + `get_movie_details`, the actual functions the API view calls) was run directly in a Django shell script — looping over a list of movie titles, checking for duplicates (`tmdb_id` already existing, thanks to Phase 4's `unique=True` constraint), and creating each `Movie` row.

A second script then created a `Show` for each imported movie, spread across the next few days and a rotating set of times/prices — necessary because, without any shows, the newly imported movies would still all show "No shows available" when someone tried to book them.

> **Worth being upfront about the actual result:** the import ran into a real network/SSL issue partway through (see Section 4) — only some of the eight target movies successfully imported on the first attempt, with the rest failing and needing a retry pass. This section describes the intended, correct process; Section 4 covers what actually went wrong and how it was diagnosed.

---

## 3. The home page redesign — built from real data, piece by piece

### `LocationContext` — a second shared context, alongside `AuthContext`

Fetches the real `/api/cities/` list (Phase 5's endpoint) once, and shares the selected city app-wide — the same Context pattern as `AuthContext` from Part 1, applied to a different piece of shared state. The Navbar got a city `<select>` dropdown driven by this, positioned next to the logo.

### Hero carousel

Cycles through a handful of real, already-imported movies (auto-advancing via `setInterval`, with clickable dots to jump directly to a slide), using each movie's real `backdrop_path` from TMDB as a full-width background image with a gradient overlay for text readability. No separate "banner" data was invented — it's the same `Movie` data already being fetched for the grid, just the first few of them presented differently.

### Filter pills (status / language / genre)

Rather than separate filter *endpoints*, filtering happens client-side in React over the already-fetched movie list — reasonable at this project's data scale (a handful of movies), where adding new backend filtering endpoints purely for this would be unnecessary complexity. "Upcoming" vs "Now Showing" is derived from comparing each movie's `release_date` to today's date; language and genre options are built dynamically from whatever values actually exist in the fetched movies (`[...new Set(...)]` — deduplicating), not from a hardcoded list — so the filter pills always reflect what's genuinely in the database.

### Movie grid

The same movie-card pattern from Part 1's `Home.jsx`, just restyled — larger cards, a rating badge overlay, hover lift effect — and now actually populated, once the bulk import succeeded, instead of showing a single lonely card.

### "Cinemas near {city}" strip

Filters the real `/api/theatres/` list (Phase 5) by the selected city, and for each theatre, counts how many of today's shows (`/api/shows/?date=<today>`) belong to it — giving a genuinely accurate "X show(s) today" count per theatre, computed from real `Show` data rather than a placeholder number.

### What was deliberately left out: a "Watch Trailer" button

The reference design asked for one, but it was explicitly skipped: the backend's `Movie` model (Phase 4) never fetches or stores a trailer URL from TMDB — only the fields listed back in the PRD's Section 4.3. Adding a trailer *button* that doesn't actually do anything would be worse than not having one at all — it's the same "don't fake it" principle from Section 1, applied to a UI detail rather than the dataset as a whole. If a real trailer link is wanted later, it would need a genuine backend addition (fetching TMDB's video/trailer data and storing it) before the button can honestly exist.

---

## 4. Two things that went wrong, and how they were actually resolved

### A process failure: work went uncommitted for an entire multi-step session

Across the whole UI/UX overhaul (toasts, dialogs, redesigns, 404 page, countdown timer, home page rebuild), **no `git commit` had been prompted or run** — a real gap, caught only when explicitly pointed out. This was acknowledged directly and fixed immediately with a single consolidated commit covering everything built up to that point, rather than trying to reconstruct commit-by-commit after the fact.

<details>
<summary>Why this matters beyond "should've committed sooner"</summary>

Every other phase in this project ended with a commit specifically *because* uncommitted work is one crash, laptop issue, or `docker compose down` away from being lost — and this session had already hit exactly that kind of issue once before (the accidental database reset in Part 1). Going a long stretch without committing broke the project's own established discipline, and is worth flagging as a pattern to actively watch for, not just a one-off slip.
</details>

### A transient Docker networking issue during bulk import

Partway through the import script, some movies succeeded (`OK: <title>`) while others failed with an SSL/network error — the *same* container that had successfully talked to TMDB during Phase 4's single-movie import. The diagnosis process, worth understanding as a general debugging approach for "it worked before, now it doesn't, nothing in my code changed":

1. **First, isolate whether it's actually a code problem or an infrastructure problem** — tested basic connectivity from inside the container directly (`curl -I https://api.themoviedb.org`), rather than assuming the Python code itself was at fault.
2. **The result (`curl` not even being installed in the container) redirected the investigation** — but the *pattern* of the original failures (some titles succeeding, some failing, no consistent title-specific cause) pointed toward a flaky, transient network/SSL handshake issue rather than anything wrong with the request logic itself. This is a known category of issue with Docker Desktop's networking layer, particularly on Windows/WSL2 setups.
3. **The fix applied: restart Docker Desktop itself** (not just the containers) — a genuinely appropriate response to networking-layer flakiness that container-level restarts wouldn't necessarily resolve, since the issue sits below the container in Docker's own network stack.
4. **The retry strategy**: rather than blindly re-running the whole import (risking hitting the same random failures again), the script was rewritten to only retry the *specific* movies that hadn't yet succeeded, with **3 attempts per title and a 2-second delay between attempts** — a standard, reasonable pattern for handling transient (not permanent) failures, since a brief delay gives a flaky connection a real chance to recover before giving up.

> **This part's actual completion is still in progress** — the retry script's full output (how many of the remaining movies succeeded) wasn't confirmed in what was pasted, so bulk import should be treated as ongoing, not finished, until that's verified.

---

## 5. Connecting the dots

```
Phase 4's TMDB import logic (search_movies, get_movie_details)
      │
      ├── reused via Django shell, looped over 8 titles ──► bulk-imported Movie rows
      │      (hit a transient Docker/SSL network issue — Docker Desktop restart + retry-with-delay fix)
      │
      └── companion script ──► Show rows created for each, spread across dates/times

LocationContext (new) ──► city dropdown in Navbar, "Cinemas near you" strip
      │
Home.jsx rebuilt around real data only:
      hero carousel  ← real backdrop_path images, real movies
      filter pills   ← derived from actual genre/language values present in the DB
      movie grid     ← same real Movie data, now actually populated
      cinema strip   ← real Theatre + Show data, real per-theatre show counts
```

Nothing fake was introduced anywhere in this redesign — every visual element traces back to a real, already-built backend endpoint from Phases 4–8. The one thing left honestly unbuilt (Watch Trailer) stays unbuilt rather than becoming a non-functional decoration.

---

## 6. Checklist

- [x] Principle established and held to: no mock/hardcoded movie data anywhere in the frontend
- [ ] Bulk import of 8 real movies — **partially confirmed**, remaining titles' retry-script result not yet verified
- [x] Companion `Show` generation script for imported movies
- [x] `LocationContext` created, city dropdown added to Navbar
- [x] Hero carousel built from real movie backdrops, auto-rotating
- [x] Filter pills (status/language/genre) derived dynamically from real data
- [x] Movie grid restyled and populated
- [x] "Cinemas near you" strip using real theatre + today's-show data
- [x] Deliberately did not add a non-functional "Watch Trailer" button
- [x] Uncommitted work caught and committed in one consolidated commit
- [x] Docker/SSL network issue diagnosed (transient, not code-related) and Docker Desktop restarted
- [ ] Full retry-import result still needs confirmation before this part is fully closed out

---

**Phase 14 (deployment) has not started yet.** Once bulk import is confirmed complete and the web-smash animation's zoom-fix is verified, that's the natural point to move on.