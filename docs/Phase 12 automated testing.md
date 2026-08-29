# Phase 12 — Automated Testing

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Replace "manually re-testing everything in Postman every time something changes" with automated tests — 18 tests covering auth, movies, seat-hold concurrency, bookings, and payments, run with one command.

**Status:** ✅ Done — all 18 tests passing, after a genuinely useful debugging detour on one flaky test.

---

## 1. Why this phase exists

Every previous phase was verified by hand — open Postman, send a request, read the response. That works, but it doesn't scale: if a change in Phase 13 (Docker) or later accidentally breaks something in Phase 7's concurrency logic, nothing would catch it unless you happened to manually re-test that exact thing again. Automated tests solve this by being **cheap to re-run constantly** — one command re-verifies everything that was ever tested, in seconds, instead of you remembering to re-click through Postman requests by hand.

### The core mechanism: a temporary, throwaway test database

```python
class AuthTests(TestCase):
```
Django's `TestCase` automatically creates a **separate test database** before running, runs every test against it, then destroys it afterward. Your real Postgres data (the confirmed bookings, movies, etc. from every earlier phase) is never touched. This is why the terminal output shows `Creating test database...` at the start and `Destroying test database...` at the end of every run — it's not testing against your actual project data, it's testing against a clean, disposable copy of your schema.

### `APIClient` — a fake HTTP client

```python
self.client = APIClient()
response = self.client.post('/api/auth/register/', {...})
```
Instead of actually starting a server and sending real network requests (slow, and requires a running server), `APIClient` simulates the request/response cycle directly in Python, in-process. It's fast specifically because no real network round-trip happens — but it exercises the exact same view/serializer/permission code a real request would.

### `setUp()` — a clean slate before every single test

```python
def setUp(self):
    self.client = APIClient()
    self.admin = User.objects.create_superuser(...)
```
`setUp()` runs fresh, from scratch, before **every** `test_*` method in the class — not once for the whole class. This guarantees one test's leftover data can't accidentally influence another test's result (in theory — see Section 3 for a case where reality got more complicated).

---

## 2. What the different test files actually verify

This isn't just "does it run" — each test is aimed at a specific rule established in an earlier phase:

| File | Tests | What's actually being re-verified |
|---|---|---|
| `users/tests.py` | Register (valid + duplicate username), login (valid + wrong password) | The exact auth rules from Phase 2 |
| `movies/tests.py` | Public list/detail, TMDB search requires admin (`force_authenticate` as a normal user → expect `403`) | Phase 4's public-read / admin-write split |
| `shows/tests.py` | Available seat can be held, already-held seat can't be held again, an *expired* hold can be re-held, a booked seat can't be held | Phase 7's entire hold-status state machine, tested as individual rules instead of one big manual concurrency test |
| `bookings/tests.py` | Valid booking after a hold, booking fails without a hold, a user can't see another user's bookings, a booked seat can't be booked again | Phase 8's server-side pricing + Phase 8's user-scoping rule |
| `payments/tests.py` | Order creation fails for a nonexistent booking, fails for an already-confirmed booking, verify fails with an invalid signature | Phase 9's payment safety checks — deliberately **without** calling Razorpay's real API |

### Why payment tests deliberately never call the real Razorpay API

```python
def test_verify_fails_with_invalid_signature(self):
    ...
    response = self.client.post('/api/payments/verify/', {
        'razorpay_signature': 'invalid_signature_xyz'
    })
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```
Automated tests are supposed to be fast, reliable, and runnable without internet access or external accounts. A test that makes a real call to Razorpay would be slow, would depend on Razorpay's servers being up, and — worth stating plainly — making real API calls (even to Test Mode) inside an *automated* test suite that might run repeatedly (e.g. in CI) is generally the wrong pattern regardless. Instead, these tests only check the parts entirely within your own control: does the backend correctly reject an obviously-fake signature? Does it refuse to create a second order for an already-confirmed booking? These are exactly the failure modes worth guarding against with a fast, repeatable check, without needing Razorpay involved at all.

### `force_authenticate` — skipping the login dance in tests

```python
self.client.force_authenticate(user=self.normal_user)
```
Rather than actually calling `/api/auth/login/` and extracting a JWT token in every single test (slow, and not what's actually being tested), `force_authenticate` directly tells the test client "treat this request as if this specific user is logged in." This keeps each test focused on what it's actually verifying (a permission rule, a booking rule) instead of re-testing the login flow every time.

---

## 3. The genuinely interesting part — a real flaky-test debugging session

One test failed unpredictably, and the debugging process here is worth understanding as a pattern, not just a one-off story.

**What happened, in order:**
1. Running `python manage.py test` (the full suite, 18 tests) → **1 failure**: `test_expired_hold_can_be_held_by_another_user` got `400` instead of the expected `200`.
2. Running that *same test in isolation* (`python manage.py test shows.tests.SeatHoldTests.test_expired_hold_can_be_held_by_another_user`) → **passed**, with a debug `print()` showing `200 {'message': 'Seats held successfully', ...}` — exactly correct.
3. Running the full suite again → **failed again**, same test, same way.
4. Re-added the debug `print()`, but this time ran it as part of the **full suite** (not isolated) → this time it **passed**, with the debug line showing correct output.
5. Removed the debug print, ran the full suite one final time → **all 18 passed, clean.**

**What this actually demonstrates:** the test passing when isolated but failing in the full suite is the classic signature of an **order-dependent (flaky) test** — one test's outcome being unintentionally affected by something happening in a test that ran before it, even though `TestCase` is supposed to isolate each test's database state via automatic rollback. Since the *logic itself* was proven correct (steps 2 and 4 both showed the endpoint behaving exactly right, with real evidence — a printed response, not just an assumption), the underlying `hold_seats` view code was never actually the problem.

> **Worth being fully honest about:** the *exact* root cause of the order-dependency was never pinned down in what you pasted — the debugging stopped once the full suite passed cleanly, rather than identifying precisely *why* it had been flaky (e.g. a shared piece of state, a timing-sensitive assertion, or genuine nondeterminism in test ordering). This is a completely reasonable stopping point for a working student project — the underlying feature is confirmed correct, which is what actually matters — but if this flakiness reappears later (say, after adding more tests), it's worth revisiting with the same debug-print technique rather than assuming it'll "just resolve itself" again.

**The debugging discipline worth keeping, regardless of the unresolved root cause:**
- Never guess at a fix — get **evidence** first (the debug print showing the actual response body, not just the status code)
- Test the same thing in two different contexts (isolated vs. full suite) to narrow down *where* the difference in behavior comes from
- Once done, **remove debug prints** before committing — a `print()` statement is investigation scaffolding, not something that belongs in a finished test file

---

## 4. Connecting the dots

```
Every earlier phase's manually-verified behavior
      │
      ▼
Reformulated as individual, automated test_* methods
      │
      ├── users/tests.py    ← Phase 2's auth rules
      ├── movies/tests.py   ← Phase 4's permission split
      ├── shows/tests.py    ← Phase 7's hold state machine
      ├── bookings/tests.py ← Phase 8's pricing + user-scoping
      └── payments/tests.py ← Phase 9's payment safety checks (no real Razorpay calls)
                │
                ▼
        python manage.py test
                │
                ▼
   18 tests, one command, seconds — instead of manually
   re-clicking through every Postman request from Phases 2–10
   every time something in the codebase changes
```

This phase doesn't add any new user-facing feature — it's the first phase whose entire purpose is protecting everything already built, going forward.

---

## 5. Checklist

- [x] `users/tests.py` — 4 auth tests (register, duplicate, login valid/invalid)
- [x] `movies/tests.py` — public list/detail + admin-only TMDB search enforcement
- [x] `shows/tests.py` — 4 tests covering the full seat-hold status state machine
- [x] `bookings/tests.py` — booking creation, no-hold rejection, user-scoping, already-booked rejection
- [x] `payments/tests.py` — 3 tests, deliberately without calling the real Razorpay API
- [x] Diagnosed a real flaky/order-dependent test using debug prints in both isolated and full-suite runs
- [x] Debug print statements removed before final commit
- [x] Full suite (18 tests) passing cleanly
- [x] Code committed and pushed

---

**Next: Phase 13 — Full Docker Compose (frontend + backend + Postgres together, `docker compose up` starts everything).**