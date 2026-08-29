# Phase 10 — Ticket + QR Code + Verification

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Give a confirmed booking a real digital ticket, encode a secure (not guessable) verification token into a QR code, and build an admin-only endpoint to check whether a scanned ticket is genuine.

**Status:** ✅ Done — ticket generation, QR encoding, and admin verification (valid/invalid/permission-denied) all confirmed.

---

## 1. The one security decision this whole phase is built around

> A QR code must encode a **random, unguessable token** — never the raw booking ID.

If the QR simply encoded `booking_id: 1`, anyone could screenshot/recreate a QR for `booking_id: 2`, `3`, `4`... by just incrementing a number — a trivial forgery. This is exactly what the PRD's Section 18 warned against ("do not put sensitive user information into the QR," and implicitly, don't put *guessable* information either). The fix is a separate, random field:

```python
verification_token = models.CharField(max_length=64, unique=True, blank=True)

def save(self, *args, **kwargs):
    if not self.booking_reference:
        self.booking_reference = f"BK-{uuid.uuid4().hex[:10].upper()}"
    if not self.verification_token:
        self.verification_token = uuid.uuid4().hex
    super().save(*args, **kwargs)
```

A UUID's hex form is a 32-character string drawn from an astronomically large space — practically impossible to guess by brute force, unlike a sequential integer ID. This is the *same* auto-generate-on-save pattern already used for `booking_reference` back in Phase 8, just applied to a second field with the same technique.

---

## 2. The `qrcode` library — what it actually does

```powershell
pip install qrcode[pil]
```
`qrcode` is a Python library that converts a string of data (here, the `verification_token`) into an actual QR code image. The `[pil]` part installs it together with **Pillow** (`PIL`, Python's standard image-handling library) — needed because `qrcode` produces a QR *pattern*, but turning that pattern into an actual image file (PNG, etc.) that a browser or phone camera can display/scan requires an image library underneath it.

> **Worth being upfront about:** the exact code that calls `qrcode` to generate the image and attaches it to a ticket response wasn't included in what you pasted — only the library install, the model change, and the verification endpoint's test results came through. The reasoning and security design below are accurate and understood; if you want the actual QR-generation view/serializer code documented, paste it separately.

---

## 3. A real migration gotcha — worth understanding, not just remembering the fix

Adding `verification_token` to an *existing* model (with an existing row already in the database, from Phase 8/9's confirmed test booking) triggered Django to ask for a one-time default value during the migration. This is a genuinely common situation worth understanding properly:

<details>
<summary>Why did Django need a default value, and why did the field still come out empty afterward?</summary>

When you add a new **non-nullable-by-default** field to a model that already has rows in the database, Django can't leave those existing rows' new column blank — every row needs *some* value for every column. Since there's no way for Django to know what a sensible "existing" token should be, it asks *you* for a one-time placeholder value to backfill old rows with, just to make the migration itself valid.

The important part: `save()` overrides (like the token-generation logic above) only run when Python code calls `.save()` — a migration operates directly at the database level and does **not** call your model's `save()` method. So the old row got the placeholder value from the migration prompt, not a real generated token, and stayed that way until something in Python explicitly called `.save()` on it again.
</details>

The first shell attempt to check the token appeared to print nothing — which turned out to be a red herring (likely a shell input issue, not a real bug), but re-running it carefully, one line at a time, correctly showed the placeholder value was still sitting there. Calling `b.save()` manually on that one existing row triggered the `save()` override for real, generating an actual random token — after which it printed correctly. This is a good illustration of a subtlety worth remembering generally: **`makemigrations`/`migrate` change the database schema; they don't run your model's Python logic against existing rows.** Only new saves do.

---

## 4. Also fixed along the way: `bookings` was never registered in Django admin

A smaller but practical fix — `movies`, `cinemas`, and `shows` had all been registered in their respective `admin.py` files back in earlier phases, but `bookings` had been missed:

```python
# bookings/admin.py
from django.contrib import admin
from .models import Booking, BookingSeat

admin.site.register(Booking)
admin.site.register(BookingSeat)
```

This is a one-line-per-model fix, but worth noting as a pattern: every new app with models you'll want to inspect/manage manually needs this registration step — it's easy to forget since the app still *works* without it, it's just invisible in `/admin/` until registered.

---

## 5. The verification endpoint — what each test actually proved

```
POST /api/bookings/verify-ticket/
Body: { "token": "<verification_token>" }
```

| Test | Result | What it proves |
|---|---|---|
| Valid token, admin user | `200 OK`, `"valid": true` + booking details | A genuine token correctly returns the real booking info — this is the "scan a real ticket" case |
| Fake/random token | `404`, `"valid": false` | An invalid token is correctly rejected — the endpoint doesn't just trust whatever string it's given |
| Valid *action*, but normal (non-admin) user | `403 Forbidden` | Only admins/staff can perform ticket verification — a customer scanning their own ticket isn't a valid use case here; this is meant for theatre staff at the door |

That third test matters as much as the first two — it's the same "backend decides, not the frontend" principle tested repeatedly since Phase 4 (TMDB import), Phase 5 (cinema writes), and now applied here: verification is a *privileged* action, not something any logged-in user should be able to trigger.

---

## 6. Connecting the dots

```
Booking (CONFIRMED, from Phase 9)
      │
      ├── booking_reference  (human-readable: "BK-E15DAD5BE3")
      └── verification_token (random, unguessable: encoded into the QR)
                │
                ▼
        QR code image (via qrcode + Pillow)
                │
                ▼
        theatre staff scans it ──► POST /verify-ticket/ with the token
                │
        ┌───────┴────────┐
   token exists        token doesn't exist
   → valid: true        / random garbage
   → shows booking      → valid: false
     details
```

The `booking_reference` and `verification_token` now serve two genuinely different purposes: the reference is what a *human* reads (in an email, on a ticket, in "My Bookings"), while the token is what a *machine* checks (the QR scan) — and deliberately, only the second one is designed to be unguessable.

---

## 7. Checklist

- [x] `qrcode[pil]` installed
- [x] `verification_token` field added, auto-generated via `save()` override (separate from `booking_reference`)
- [x] Migration run, existing row backfilled with a placeholder, then re-saved to get a real token
- [x] `bookings` app registered in Django admin (previously missed)
- [x] Verification endpoint tested: valid token → `200`/`valid: true`
- [x] Verification endpoint tested: fake token → `404`/`valid: false`
- [x] Verification endpoint tested: normal user → `403 Forbidden`
- [x] Code committed and pushed

---

**Next: Phase 11 — Admin dashboard. Movie/theatre/screen/show management UI, bookings list, users list, and basic stats (totals + revenue).**