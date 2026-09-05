# Phase 23 — Camera-Based QR Ticket Scanning (Final Feature Phase)

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Done. This closes out the project's functional scope.

---

## The design decision worth understanding

Two roles now exist for ticket-checking, not one:

- **`is_staff`** (existing) — full admin access, unchanged.
- **`is_verifier`** (new) — a separate, narrower flag. A regular user granted this gets access to *only* the ticket-scanning page — not the admin panel, not movie/theatre management, nothing else.

This matters because the original idea ("admin scans tickets") didn't match how it would actually be used — the person checking tickets at the door usually isn't the same person managing the catalog. Rather than giving door-staff full admin rights just so they can check tickets, `is_verifier` is a minimal, purpose-built permission — the same "give exactly the access needed, nothing more" principle that shaped the admin panel's deliberately-limited user management back in Phase 19 (read-only list + deactivate, not full editing).

```python
class IsAdminOrVerifier(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_verifier))
```
`verify_ticket`'s permission was widened from admin-only to this — either role can check a ticket, but neither role gains access to anything else through this endpoint.

A guard was also added preventing an admin from being toggled as a verifier (`if target.is_staff: return error`) — redundant but intentional, since an admin already has every permission a verifier would grant.

---

## The scanning mechanism

Uses the `qr-scanner` npm library, which handles the actual camera access and QR-decoding loop — genuinely sensible to reach for a small, focused library here rather than hand-rolling camera + decode logic, since that's a solved problem with real edge cases (camera permissions, decode performance) not worth reinventing for this project's scope.

**Two places got scanning added:**
1. **`ScanTicket.jsx`** — a standalone page at `/scan`, reachable by both admins and verifiers, showing just the camera feed and a valid/invalid result.
2. **`AdminVerify.jsx`** (existing, from Phase 19) — gained a Manual Entry / Camera Scan toggle, so admins have both options in the same place they already used for manual token verification.

**The cooldown mechanism is worth understanding, not just copying:**
```javascript
const busyRef = useRef(false);
const handleDecoded = async (token) => {
  if (busyRef.current) return;
  busyRef.current = true;
  ...
  finally { setTimeout(() => { busyRef.current = false; }, 2000); }
};
```
A QR scanner's decode callback fires repeatedly, many times per second, for as long as the same code stays in frame — without a guard, one ticket held in front of the camera would trigger dozens of duplicate verify requests in quick succession. `busyRef` (a `useRef`, not `useState`, since it doesn't need to trigger a re-render) blocks new scans while one is being processed, and the 2-second cooldown after prevents an immediate re-trigger the instant the same ticket is still in frame right after the first result comes back.

---

## Access control — enforced in two places, deliberately

`VerifierRoute` (client-side) redirects a non-staff, non-verifier user away from `/scan` immediately — this is a UX nicety, not the real security boundary. The actual enforcement is `IsAdminOrVerifier` on the backend endpoint itself, meaning even if someone bypassed the frontend redirect entirely, the API call would still be correctly refused. This is the same two-layer pattern used everywhere in this project since Phase 5 — the frontend hides what a user shouldn't see, but the backend is what actually stops them from doing it.

---

## Checklist
- [x] `is_verifier` field added to `User`, separate from `is_staff`
- [x] `IsAdminOrVerifier` permission — narrower access than full admin, not a duplicate of it
- [x] Admin can grant/revoke verifier status per user from the existing Users page
- [x] Camera-based scanning added to both a standalone `/scan` page and the existing admin verify page
- [x] Duplicate-scan cooldown implemented and understood (not just copy-pasted)
- [x] Access enforced both client-side (UX) and server-side (real security)
- [x] Confirmed: a non-verifier navigating to `/scan` directly gets redirected
- [x] Committed and pushed; `qr-scanner` added to `package.json`, Vercel installs it automatically on next deploy
- [x] No new env vars; camera access works under HTTPS (Vercel) and localhost (browser-exempted)

---

## Project status — functional scope now complete

This was named as the last planned feature phase. Across Phases 0–23, the project now has: full auth, real TMDB-backed movie data with cast/trailer and live search, cinema/show management with a bulk seat-layout builder, concurrency-safe seat holding with a group seat finder, server-priced bookings with Razorpay payments, a CineRP loyalty wallet with correct cancellation reversal logic, snacks & combos, QR ticketing with both manual and camera-based verification, a full custom admin panel, Docker Compose for local dev, and a live deployment on Render + Vercel.

**Two open items carried forward, not silently dropped:**
- The 18 automated tests from Phase 12 don't cover CineRP, the seat finder, or snacks — a named, accepted gap rather than an oversight.
- The README still needs its final pass — live URLs (Vercel + Render) and real screenshots — before the repo is genuinely presentation-ready.

From here, the next step is the UI/UX redesign pass, separately.