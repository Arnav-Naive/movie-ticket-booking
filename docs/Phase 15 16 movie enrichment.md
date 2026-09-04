# Phase 15 & 16 — Movie Enrichment + Real-Time Search

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Both done and tested.

---

## Phase 15 — Cast + Trailer

`Movie` got two new fields: `cast` (comma-separated names) and `trailer_key` (a YouTube video ID). TMDB's `/movie/{id}` endpoint supports `append_to_response=credits,videos` — one extra query param pulls cast and trailer data in the same request that already fetches movie details, instead of needing separate API calls. `extract_cast_and_trailer()` takes the top 6 cast names and the first official YouTube trailer it finds.

**Backfilling old data:** the 9 movies imported before this phase existed had no `cast`/`trailer_key`. Rather than re-importing them, a one-off management command (`backfill_movie_details`) finds any `Movie` with an empty `cast` field and re-fetches just those from TMDB. This command was also chained into Render's Build Command — since it's idempotent (only touches rows still missing the data), it's safe to run on every deploy and self-heals without a manual step.

**Frontend:** `MovieDetails.jsx` renders cast as small pill-shaped chips, and embeds the trailer via a YouTube `<iframe>` (`youtube.com/embed/{trailer_key}`) when one exists.

---

## Phase 16 — Real-Time Search (Postman no longer needed for imports)

Before this, adding a new movie required manually using Postman (search → note the TMDB ID → import) — meaning only whoever had Postman open could grow the catalog. This phase replaces that with a genuine live search built into the home page itself.

### `live_search` — checks local DB first, falls back to TMDB

```python
local_matches = Movie.objects.filter(title__icontains=query)
...
tmdb_results = search_movies(query)
for r in tmdb_results[:10]:
    if r['id'] in local_tmdb_ids:
        continue  # skip anything already imported
    remote_results.append({...})
```
Returns two separate lists: movies already in the local catalog (shown normally, clickable), and TMDB matches *not yet* imported (shown separately, with an add option). The `if r['id'] in local_tmdb_ids: continue` line is what prevents duplicates from appearing in both lists.

### `auto_import` — importing on demand, permission-gated

Initially built as `IsAuthenticated` (any logged-in user could trigger an import), then **corrected to `IsAdminUser`** after review — an open-to-any-user auto-import endpoint is a data-integrity risk (any user could spam the catalog with junk searches), whereas an admin-only version keeps the "who controls what's in the catalog" rule consistent with every other admin-gated action in this project (TMDB import from Phase 4, cinema writes from Phase 5). The frontend now checks `user?.is_staff` before even showing the "Add" button — regular users searching for something unimported see "Not yet available" instead.

### Frontend search UX
The home page's search box now does a **debounced** live search (waits 450ms after typing stops before calling the API — avoids firing a request on every keystroke) against `/movies/live-search/`. Results replace the normal filtered grid while a search is active; local matches show first, unimported TMDB results show below under "MORE FROM TMDB."

---

## Checklist
- [x] `cast` + `trailer_key` fields added, populated on import via TMDB's combined credits/videos response
- [x] Backfill command created and folded into Render's build command (self-healing, idempotent)
- [x] Movie Details page shows cast chips + embedded trailer
- [x] Live search (local + remote) with debouncing
- [x] Auto-import restricted to admins after a permission review caught the open-access risk
- [x] Committed and pushed; confirmed no new env vars needed (Render's existing build command covers it)