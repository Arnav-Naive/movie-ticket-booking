# Pre-Deployment Wrap-up + Phase 14 Start (Deployment)

**Project:** Movie Ticket Booking Platform
**Status:** Bulk import confirmed (9 movies + 9 shows). Animation bug root-caused and fixed. Deployment started: Postgres created on Render.

---

## 1. The web-smash animation bug — actually fixed this time, in two parts

**Bug 1 — animation freezing mid-shatter, root cause found:**
The 8 "shard" pieces used `Math.random()` for their rotation angle, calculated fresh on every component render — but this value was also used to build the CSS `@keyframes` text injected via a `<style>` tag. Any time the `Home` page re-rendered for an unrelated reason (movies loading, the carousel's timer ticking), those keyframes got silently regenerated with new random values mid-animation, which restarts a CSS animation from scratch — visually showing up as the animation freezing in a broken, jagged, half-finished state.

**Fix:** wrapped the shard data and the generated keyframe string in `useMemo(..., [])` — meaning React calculates them exactly once, on first render, and never recalculates even if the component re-renders for other reasons.

<details>
<summary>Why does this matter beyond this one animation?</summary>

This is a genuinely common React bug category: any value used inside a `<style>` tag, an animation, or anything else that needs to stay *stable* across re-renders should be memoized if it involves randomness or expensive computation. Without `useMemo`, "generate once" logic silently becomes "regenerate every render" — which is invisible for static UI but breaks anything time-based or animated.
</details>

**Bug 2 — animation looking "zoomed" on smaller windows:**
The overlay's size was tied to its parent wrapper (`minHeight: 70vh`), which itself scales with the page content's height — so on a smaller browser window, the same animation covered proportionally less/more space, reading as inconsistent zoom. **Fix:** changed the overlay from `position: 'absolute'` (sized relative to its parent) to `position: 'fixed'` (sized relative to the actual browser viewport) — now the animation is always full-screen and consistent, regardless of window size or page content.

Both fixes committed and pushed.

---

## 2. Deployment plan

- **Frontend** → Vercel (free)
- **Backend** → Render (free tier)
- **Database** → Render's hosted PostgreSQL (free tier)

This is the point flagged back in Phase 9/13: the local Docker Postgres was always a dev-only tool. This is where it gets left behind — a real, separately-hosted database takes over.

### Backend production settings

```python
ALLOWED_HOSTS = ['.onrender.com', 'localhost', '127.0.0.1']
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # Vercel URL added once it exists
```
`ALLOWED_HOSTS` is a Django security setting — it rejects any request whose `Host` header doesn't match one of these, preventing a class of attack where a malicious request pretends to be for a different domain. `CORS_ALLOWED_ORIGINS` was already correctly set from Phase 3's setup; the only remaining step is adding the real Vercel URL once the frontend is actually deployed there.

### A genuinely useful caveat surfaced before committing to this plan

**Render's free PostgreSQL tier auto-expires 30 days after creation** (with a 14-day grace period to upgrade before data is deleted). Practically: if this project needs to be demoed in an interview more than a month after deployment, the database may come up empty — the fix is just re-running `migrate` + re-importing movies (a few minutes of work), not a real problem, but worth knowing *now* rather than being surprised by it later, especially since a placement-season demo could easily land outside that 30-day window.

Also confirmed: deploying this alongside the existing `network-monitor-ai` project on Render, and other Vercel projects, is fine — no conflicts, no meaningful free-tier project limits on either platform.

### Progress so far
1. Render account created (via GitHub)
2. Render PostgreSQL database created (`movie-booking-db`, free tier), Internal Database URL copied for use when creating the backend service next

---

## 3. Checklist

- [x] Animation keyframe-restart bug fixed via `useMemo`
- [x] Animation viewport-scaling bug fixed via `position: fixed`
- [x] Both animation fixes committed and pushed
- [x] `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` set for production
- [x] Render account created
- [x] Render PostgreSQL database created, connection URL obtained
- [ ] Render backend web service — not yet created
- [ ] Vercel frontend deployment — not yet started
- [ ] `CORS_ALLOWED_ORIGINS` updated with real Vercel URL — pending Vercel deployment

---

**Next: create the Render backend web service, connect it to the new hosted database, then deploy the frontend to Vercel.**