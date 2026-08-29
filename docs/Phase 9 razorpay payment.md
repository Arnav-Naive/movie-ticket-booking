# Phase 9 — Razorpay Payment Integration (+ a pre-phase safety fix)

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Take a `PENDING` booking through a real (test-mode) payment, cryptographically verify it on the backend, and only then mark it `CONFIRMED` with seats `BOOKED`. This is the exact phase that ended the previous project — so it was done slowly, with every step verified before moving on.

**Status:** ✅ Done — payment confirmed, verified in the database (booking `CONFIRMED`, seats `BOOKED`), after debugging one real failure along the way.

---

## 1. First — a safety fix that happened just before this phase (and fills a gap from Phases 7–8)

Before starting Razorpay, a "triple check" pass caught a real gap: nothing was stopping a seat from being **held or booked for a show that had already started**. Business rule #14 from the PRD ("Booking cannot be created for a show that has already started") wasn't actually enforced yet. This got fixed in both places that needed it — `shows/views.py` (`hold_seats`) and `bookings/views.py` (`create_booking`) — with the same pattern in each:

```python
show_datetime = timezone.make_aware(datetime.combine(show.date, show.start_time))
if show_datetime < now:
    return Response({"error": "Cannot hold/book seats for a show that has already started"}, status=400)
```

`Show` stores `date` and `start_time` as two separate fields (from Phase 6). `datetime.combine(...)` merges them into one comparable value. `timezone.make_aware(...)` is necessary because Django, once `USE_TZ` is on, works with **timezone-aware** datetimes internally — comparing an aware datetime (`timezone.now()`) against a naive one (a plain `datetime.combine` result) raises an error rather than silently giving a wrong answer. This check runs *before* anything touches the database lock from Phase 7 — rejecting an obviously-invalid request early, without spending the cost of a `select_for_update()` transaction on a request that was never going to succeed anyway.

<details>
<summary>This also finally answers something flagged as missing in the Phase 7 and Phase 8 docs</summary>

Those docs noted that the actual `hold_seats` and `create_booking` view code hadn't been shared yet — only the concept and test results. This fix pass included the **full files**, so for the record, here's what those views actually do, beyond the date check above:

- **`hold_seats`**: validates `seat_ids` were provided, locks the matching `ShowSeat` rows with `select_for_update()` inside `transaction.atomic()`, checks each one isn't already `BOOKED` or genuinely `HELD` (an *expired* hold is treated as available — `hold_expires_at < now`), and if all seats are free, updates them to `HELD` with a fresh `hold_expires_at` 5 minutes out.
- **`create_booking`**: takes a `show_id` and `show_seat_ids`, re-validates the show hasn't started, locks the same `ShowSeat` rows again, confirms every one is genuinely `HELD` by *this* attempt (not expired), computes `total_amount = show.price × number of seats` itself, creates the `Booking` (status `PENDING`) and one `BookingSeat` row per seat, and returns the serialized booking.

Both reuse the exact `transaction.atomic()` + `select_for_update()` pattern from Phase 7 — this is the "write the rule once, reuse it" habit already seen with `IsAdminOrReadOnly` in Phase 5–6, just applied to concurrency-safety instead of permissions.
</details>

---

## 2. The Razorpay payment flow — the concept before the code

```
1. User clicks "Pay"
2. Backend asks Razorpay to create an "order" → gets an order_id back
3. Frontend opens Razorpay's checkout popup using that order_id
4. User pays with a Razorpay TEST card/method (no real money moves)
5. Razorpay hands the frontend a payment_id + a signature
6. Frontend sends those to the backend
7. Backend cryptographically verifies the signature
8. Only if valid → Booking = CONFIRMED, Seats = BOOKED
```

**The one sentence that matters most in this entire phase:** *signature verification is the actual security boundary.* Without step 7, a modified frontend could simply lie — send a fake "payment_id" straight to the backend and claim success, and the backend would have no way to know the payment never really happened. The signature is a cryptographic proof, generated using Razorpay's secret key, that only Razorpay itself could have produced — the backend re-computes it from the same inputs and checks it matches exactly, which is what makes a faked "success" message impossible to fabricate from the frontend alone.

---

## 3. Reusing the existing Razorpay account

Rather than creating a new Razorpay account, the existing one (from the dropped expense tracker project, already KYC/PAN-verified) was reused. This works because **Razorpay's Test Mode keys are independent of KYC status and reusable indefinitely** — Test Mode exists specifically so developers can build and demo payment flows without needing a fully verified, live-money-capable account. The only care needed: confirm the dashboard toggle is set to **Test Mode**, not **Live Mode**, before copying any keys — using a Live key by mistake in a college project would be a real (if unlikely) risk, not just a mistake.

One practical note worth remembering: **Razorpay only shows the Key Secret once, at generation time.** If it wasn't saved somewhere safe before, the only fix is regenerating it — safe to do in Test Mode, but a reminder that these values need to be captured immediately when first shown, not "come back for it later."

---

## 4. The actual bug hit during testing — and how it was diagnosed

This is the most instructive part of the phase, and worth documenting properly rather than glossing over.

**Symptom:** Razorpay's popup showed a successful payment, but checking the backend afterward showed the booking still `PENDING` and the seats still `AVAILABLE` — meaning the confirmation never actually landed.

**The debugging approach — worth internalizing as a pattern, not just this one fix:**
1. First, check what the *frontend* actually showed after payment — was it a success message, a failure message, or something silent?
2. Then, check the browser console (F12 → Console) for actual JavaScript errors.
3. Then, check the Network tab specifically for the `verify` request — did it fire at all, and if so, what did the backend actually respond with?

This is a genuinely good general debugging habit for any full-stack bug: **don't guess where the failure is — walk the actual chain of events (frontend UI → console → network request/response) until you find the exact point where behavior diverges from expectation**, instead of re-testing the whole flow repeatedly hoping it resolves itself.

**What it turned out to be:** the verify call was failing silently — the Razorpay popup's own "payment successful" message is generated client-side by Razorpay itself the moment the *payment* succeeds, which is a separate event from your backend's `/verify/` endpoint successfully processing and confirming it. A successful Razorpay popup does **not** guarantee your own backend logic afterward ran cleanly — those are two different systems, and the popup has no visibility into whether your Django endpoint accepted or rejected the signature.

**Also worth noting:** many of the scary-looking red errors in the console (`Refused to get unsafe header "x-rtb-fingerprint-id"`, etc.) were **Razorpay's own internal analytics/tracking scripts failing**, completely unrelated to this project's code. Recognizing "this error is coming from a third-party script, not my code" is its own useful debugging skill — chasing an error that isn't actually yours wastes real time.

**Resolution:** once retried with fresh login (JWT tokens expire, same as Phase 8) and the flow re-run end to end, the correct result appeared: `"Success: Payment verified, booking confirmed"` — and this time confirmed against the actual database, not just the popup message.

---

## 5. Confirming it properly — checking the database, not just the UI message

```
GET /api/bookings/my/       → status: "CONFIRMED"
GET /api/shows/2/seats/     → A1, A2 status: "BOOKED"
```

This is the same discipline as every previous phase's testing: a UI message alone ("Success!") is not proof something worked — the actual database state is. This habit is exactly what caught the original bug in the first place (the popup said success while the database still said `PENDING`), and it's the same habit that confirmed the eventual fix actually worked.

---

## 6. Connecting the dots

```
Booking (PENDING, from Phase 8)
      │
      ▼
Razorpay order created (backend calls Razorpay, gets order_id)
      │
      ▼
Frontend checkout popup ──► user pays with test card/method
      │
      ▼
Razorpay returns payment_id + signature to frontend
      │
      ▼
Frontend sends both to backend's /verify/ endpoint
      │
      ▼
Backend re-computes the signature and compares
      │
   ┌──┴──┐
 valid   invalid
   │        │
   ▼        ▼
Booking    Booking stays PENDING,
CONFIRMED, nothing changes
Seats
BOOKED
```

Nothing here is disconnected from what came before: the seats being flipped to `BOOKED` here are the exact same `ShowSeat` rows that were `HELD` back in Phase 7/8, and the whole "already-started show" guard from Section 1 above protects both the hold step *and* this booking step from being tricked by an old, stale request.

---

## 7. Checklist

- [x] Pre-phase fix: show-already-started check added to both `hold_seats` and `create_booking`
- [x] Existing Razorpay account reused, confirmed in Test Mode
- [x] Key ID + Key Secret obtained (regenerated where the old secret wasn't saved)
- [x] Order creation → checkout popup → test payment flow implemented
- [x] Backend signature verification implemented
- [x] Diagnosed and fixed a real bug: popup "success" ≠ backend verification success
- [x] Confirmed fix by checking actual database state, not just the UI message
- [x] Booking confirmed `CONFIRMED`, seats confirmed `BOOKED` in the database
- [x] Code committed and pushed

---

**Next: Phase 10 — Ticket + QR code + booking history. New territory (the previous project never reached this far), but conceptually simpler than what you just finished.**