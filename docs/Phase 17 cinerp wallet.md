# Phase 17 — CineRP Loyalty Wallet (+ a real local Docker bug)

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Done — earning, spending, and cancellation reversal all confirmed.

---

## The design

A new, deliberately separate `wallet` app — `Wallet` (1-to-1 with User, holds `balance`) and `WalletTransaction` (an audit log: every earn/spend/refund/reversal, each tagged with a type and linked to the booking that caused it). Keeping wallet logic in its own app rather than bolting it onto `bookings` or `payments` keeps it independently testable and reviewable — a clean feature boundary, the same reasoning `payments` got split from `bookings` back in the original PRD structure.

**The rules, and why each exists:**
- **Earning**: 5% of a Razorpay payment's amount is credited as CineRP the moment `verify_payment` confirms the booking — tied to the exact same trusted, backend-verified event from Phase 9, not something the frontend could fake.
- **Spending**: at checkout, if the wallet balance covers the full amount, "Pay with CineRP" skips Razorpay entirely and confirms the booking directly — inside `transaction.atomic()`, since deducting the balance and confirming the booking must succeed or fail together.
- **Cancellation — two separate corrections, not one:**
  1. **Reverse earned CineRP** — but capped: `min(earned, wallet.balance)`. If the user already *spent* the CineRP they earned from this booking before cancelling it, you can't take back points that no longer exist — the cap prevents the balance from going negative, and the shortfall is simply not reversed (logged as a smaller `REVERSED` amount) rather than silently failing.
  2. **Refund any CineRP that was *spent* on this booking** — otherwise a cancelled booking would have permanently cost the user real points for nothing.

This two-part cancellation logic was flagged as a genuine gap in the original CineRP plan and folded in before any code was written — worth noting as an example of catching a design flaw *before* implementation, not after.

### Why `unit_price` isn't needed here but the general pattern matters
Not applicable to wallet directly, but the same "copy the value at time of transaction, don't just reference the live price" principle governs `WalletTransaction.amount` — it's a fixed snapshot of what was earned/spent *then*, not a live-calculated number, so the audit trail stays accurate even if rules change later.

---

## A real local Docker bug — worth remembering as its own lesson

After this phase's local testing, the backend started crash-looping — "unable to load movies," admin panel not loading. Root cause: **`whitenoise` (added back in Phase 14's deployment prep) was installed in the local venv on the host machine, but the Docker image was never rebuilt to include it.** `docker compose up -d` (without `--build`) reuses the existing image — it does *not* automatically pick up a new `requirements.txt`.

**Fix:**
```powershell
docker compose up -d --build backend
```

<details>
<summary>The rule worth keeping from this</summary>

Any time `requirements.txt` (or `package.json`) changes, the corresponding container needs an explicit `--build` to actually install the new dependency — `restart` or a plain `up -d` will keep running the old image. This is a distinct gotcha from the earlier `.env`-not-reloading issue (Phase 14) — different root cause (stale *image* vs. stale *environment variables*), same category of "Docker isn't automatically as fresh as you'd assume."

Also confirmed: **production (Render) was never affected by this**, because Render does a clean container build from scratch on every single deploy — it always installs fresh from `requirements.txt`. This is a genuinely reassuring signal that the local/production separation (Phase 14's whole design point) is holding up correctly.
</details>

---

## Navbar balance display

The Navbar now fetches `/api/wallet/` whenever `user` changes and shows a small "₹{balance} CineRP" pill next to the username — a minor addition, but it's what makes the wallet system visible during normal use instead of only on the Profile page.

---

## Checklist
- [x] `Wallet` + `WalletTransaction` models, kept as a separate app
- [x] 5% CineRP earned on confirmed Razorpay payments
- [x] "Pay with CineRP" checkout path when balance covers the total, atomic with booking confirmation
- [x] Cancellation reversal logic: earned-CineRP reversal capped at current balance, spent-CineRP refunded
- [x] Wallet balance + transaction history on Profile page
- [x] Balance pill added to Navbar
- [x] Local Docker rebuild bug diagnosed (stale image, not a code bug) and fixed with `--build`
- [x] Confirmed production was unaffected by the same issue