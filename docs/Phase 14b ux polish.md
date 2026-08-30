# Frontend Completion — Part 2: UI/UX Polish + Real Fixes

**Project:** Movie Ticket Booking Platform
**Goal:** Turn the working-but-rough Part 1 flow into something that behaves like a real app — no browser popups, mobile-usable, a real login-state bug fixed, missing pages added, and the token-expiry pain from earlier phases finally addressed properly.

**Status:** ✅ Built and confirmed. One real bug found and fixed along the way.

---

## 1. Why this pass happened — the self-review that triggered it

After Part 1's flow was working, a direct check-in was asked for: *"are we actually done, think about design/UI/UX carefully."* The honest answer was **no** — functionality worked, but the PRD's explicit requirement for a "modern, professional, responsive" app (Section 42) wasn't met yet. Specific gaps named at that point:

- No responsive design at all (navbar would overlap on mobile, no hamburger menu)
- `alert()` / `window.confirm()` — browser's own default popups, not a real app's UI
- No Profile page (PRD Section 19 requirement, missed earlier)
- No fallback for a missing movie poster (broken image instead of a placeholder)

This distinction — *"it works" is not the same as "it's done"* — is worth keeping in mind generally: a feature being functionally correct doesn't mean the surrounding experience is acceptable for something meant to be demoed or evaluated.

---

## 2. Toast notifications + a custom confirm dialog

`ToastContext.jsx` — a small notification system (success/error messages that appear briefly in a corner and auto-dismiss) — replaced `alert()` everywhere. `ConfirmDialog.jsx` — a proper in-app modal — replaced `window.confirm()` for the booking-cancellation flow. Both are standard patterns: browser-native popups (`alert`, `confirm`) block the entire page and look inconsistent with the app's own styling; a custom toast/dialog system stays visually consistent and doesn't freeze the UI.

---

## 3. Responsive Navbar

A hamburger menu (`☰` / `✕` toggle) was added, shown only below a 720px screen width via a CSS media query — the desktop nav links (`nav-links-desktop`) hide, and the hamburger reveals a stacked mobile menu instead. This directly addresses the PRD's explicit desktop/tablet/mobile requirement that had been skipped until this point.

---

## 4. Login/Register redesign — and a real bug found while doing it

Beyond visual redesign (centered card layout, labeled inputs, consistent button styling via new `.btn-primary`/`.input-field` CSS classes), a genuine functional bug was caught here:

> **The original `Login.jsx` saved the JWT tokens directly to `localStorage` but never updated `AuthContext`'s `user` state.** This meant the Navbar wouldn't show "Hi, {username}" immediately after logging in — only after a manual page refresh, because `AuthContext` only checked `localStorage` once, on initial app load.

The fix: after a successful login, explicitly call `/auth/me/` to get the user's data, then call `AuthContext`'s `login(userData, access, refresh)` — which updates both `localStorage` *and* the shared `user` state at the same time, so the Navbar reflects the change instantly. This is a good example of why centralizing state in one place (`AuthContext`) only works if *every* place that changes that state goes through the same function — bypassing it (writing directly to `localStorage`) silently breaks the sync.

---

## 5. Profile page

A straightforward missing PRD page — pulls the current user's data from `AuthContext` (already fetched at login) and displays username/email. No new backend call needed, since `/auth/me/`'s data was already available in context.

---

## 6. Missing-poster fallback

`MoviePoster`, a small component wrapping the `<img>` tag, uses React's `onError` handler: if the TMDB image URL 404s (or `poster_path` is null), it swaps to a plain colored box showing the movie's title as text instead of a broken image icon. Small detail, but exactly the kind of "empty state" the PRD's Section 43 asked for.

---

## 7. Deep-review round 2 — three more real gaps found

After the above was done, a second explicit request ("what else might be missing, think carefully") surfaced three further gaps — worth noting that *asking the question again* is what caught these, not a single review pass:

### 404 page
Previously, any invalid URL rendered a blank white page. A `NotFound.jsx` page plus a catch-all `<Route path="*" element={<NotFound />} />` (which must be the *last* route defined — React Router matches top to bottom) fixed this.

### Token lifetime + automatic redirect on expiry
The 5-minute JWT access token lifetime (set back in Phase 2) had already caused confusion multiple times across earlier phases (Phase 8's "fucked up" moment, repeated re-logins during frontend testing). Two changes together fixed this properly instead of just working around it each time:

1. **Backend**: `SIMPLE_JWT = {'ACCESS_TOKEN_LIFETIME': timedelta(hours=2), ...}` in `settings.py` — extends the token life to 2 hours, reasonable for demoing/testing without constant re-logins (explicitly noted as *not* how a real production app would be configured — this is a deliberate demo-friendly trade-off, not a security best practice).
2. **Frontend**: an axios **response interceptor** in `api.js` — code that runs automatically on *every* API response. If any response comes back `401`, it clears the stored tokens and redirects to `/login` automatically, instead of the user seeing a confusing "Unable to load..." error with no clear next step.

<details>
<summary>What's an axios interceptor, actually?</summary>

Normally you'd have to check for a `401` and handle it manually in every single API call across the app — easy to forget somewhere. An interceptor is a function registered once on the shared `api` instance (from Phase 3) that automatically runs before every request or after every response, app-wide. This is the same "write the rule once, apply everywhere" pattern seen with `IsAdminOrReadOnly` back in Phase 5 — just on the frontend side this time, and reacting to responses instead of guarding requests.
</details>

### Seat-hold countdown timer
The PRD explicitly asked for this (Section 23: "Show: Countdown for hold") and it had been missing — a user could sit on the Booking Summary page indefinitely with no indication their hold was about to expire, then hit a confusing "seats not held" error out of nowhere. The fix: the hold endpoint's `expires_at` response (already returned by the backend since Phase 7) gets passed through React Router's navigation state into `BookingSummary`, which runs a `setInterval` ticking every second, counting down and displaying `mm:ss`, turning red under a minute, and disabling the "Proceed to Payment" button once time runs out.

---

## 8. The Spider-Man web-smash intro animation — attempted, and honestly assessed

An earlier idea (a themed loading animation on the Login/Register page) was built, using **only original CSS/SVG assets** — deliberately avoiding any actual Marvel character design, logo, or trademarked name, since using real copyrighted IP is infringement regardless of whether anyone notices. The first version was judged unsatisfying by the person building it; a second, more detailed version (real radial+concentric web pattern, glow filter, glass-shatter shard animation, screen-shake) was built as a genuine redo, not a minor tweak.

**Where it stands: still not fully wired in as intended, and has a known bug.** The intent was to show it once per session on the Home page (first visit, and once after logging in) using `sessionStorage` flags — but this wiring got dropped in an earlier pass and had to be re-added, and even then, a real visual bug was found: the "reveal" transition used `transform: scale(0.97) → scale(1)` alongside the fade, which reads as an unwanted "zoom" effect on a page with a large hero image. The fix (removing the `transform` entirely, keeping just the opacity fade) was written but **not yet confirmed tested** — this is a loose end going into Phase 14, worth explicitly checking rather than assuming it's resolved.

---

## 9. Checklist

- [x] Toast notification system replacing `alert()`
- [x] Custom confirm dialog replacing `window.confirm()` for cancellations
- [x] Responsive hamburger navbar for mobile
- [x] Login/Register redesigned, with a real login-state sync bug found and fixed
- [x] Profile page added
- [x] Missing-poster fallback added
- [x] 404 page added, catch-all route confirmed last in route order
- [x] Access token lifetime extended to 2 hours (explicitly noted as demo-appropriate, not production-appropriate)
- [x] Axios response interceptor added — automatic redirect to `/login` on any `401`
- [x] Seat-hold countdown timer implemented on Booking Summary
- [ ] Web-smash intro animation — built, zoom-transform bug fix written but **not yet confirmed working**

---

**Continues in Part 3 — real-data home page redesign (hero carousel, filters, city context, cinema strip) and the debugging around it (a missed commit, and a Docker networking/SSL issue during bulk movie import).**