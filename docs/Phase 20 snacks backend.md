# Phase 20 — Snacks & Combos (Backend)

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Backend done and tested. Frontend (Phase 21) and admin management (Phase 22) still pending.

---

## The plan-first discipline worth noting

Before any code, a plan was written covering: current architecture, exact database changes, backend changes, the one real *flow* change required, frontend changes, admin changes, and phase ordering — plus one explicit open decision (whether to include a flat convenience fee) surfaced *before* writing anything. This is worth calling out as good practice generally: for a feature that touches pricing, booking creation, and the payment flow all at once, writing the plan down and getting a decision on the one ambiguous point *before* coding avoids building something that then needs to be half-undone.

**The convenience fee decision**: the recommendation was to skip it (no real business logic behind a flat fee, and it wasn't something the core "snacks as an add-on" feature actually needed) — but the person building the project chose to keep it, matching a reference spec's worked example. Fair call to make either way; worth recording that it was a deliberate choice, not a default.

---

## The models

```python
class Snack(models.Model):
    theatre = models.ForeignKey(Theatre, ..., null=True, blank=True)  # null = available everywhere
    category = models.CharField(choices=[...])  # POPCORN / BEVERAGE / SNACK / COMBO
    price = models.DecimalField(...)
    is_available = models.BooleanField(default=True)

class BookingSnack(models.Model):
    booking = models.ForeignKey('bookings.Booking', ...)
    snack = models.ForeignKey(Snack, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(...)   # copied from Snack.price AT BOOKING TIME
    total_price = models.DecimalField(...)  # unit_price × quantity
```

Two deliberate design choices worth understanding:

- **`unit_price` is copied, not referenced live.** If an admin changes a snack's price next month, every *past* booking's receipt should still show what was actually charged at the time — this is the same "snapshot the value, don't just point at the live one" principle that governs `WalletTransaction.amount` in Phase 17, applied here to order history integrity.
- **`on_delete=models.PROTECT` on `snack`** deliberately *blocks* deleting a `Snack` that appears in any past `BookingSnack` — Django will refuse the delete outright rather than silently orphaning historical order data. The correct way to retire a snack is to mark it `is_available=False`, not delete it — this is standard e-commerce practice (you don't delete a product that's ever been sold, you discontinue it).

---

## Extending `create_booking` — the one real flow change

The booking flow changes from `Seats → Summary → Payment` to `Seats → Snacks → Summary → Payment` — snacks get selected *before* the booking is created, and get folded into the *same* atomic `create_booking` call, rather than being bolted on as a separate step afterward. This matters for the same reason the original booking logic (Phase 8) insists on backend-calculated pricing: **every priced line item — tickets, snacks, and now the convenience fee — is computed from the database inside one transaction**, never assembled from numbers the frontend supplies.

```python
CONVENIENCE_FEE = Decimal('30.00')

# snacks priced from the DB, never trusted from the request body:
for item in snack_items:
    snack = Snack.objects.get(id=item['snack_id'], is_available=True)
    line_total = snack.price * item['quantity']
    snack_total += line_total

total_amount = ticket_amount + snack_total + CONVENIENCE_FEE
```
The frontend only ever sends `snack_id` + `quantity` pairs — exactly the same trust boundary already established for seats back in Phase 8 (frontend sends *what*, backend decides *how much*).

---

## API surface added

- `GET /api/snacks/?theatre=<id>` — public, filtered to available snacks for regular users; admins see unavailable ones too (needed for the admin management page in Phase 22)
- Admin CRUD on `Snack` — reuses the existing `IsAdminOrReadOnly` `ViewSet` pattern already used for City/Theatre/Screen/Seat, no new permission logic invented
- `BookingSerializer` gained a nested `booking_snacks` field, so the ticket endpoint (Phase 10) and My Bookings automatically include snack data with zero changes needed to those views — they already just serialize whatever `BookingSerializer` returns

---

## Production note

New app, new migration — Render's build command already runs `migrate` on every deploy, so no manual step needed there. The 8 seeded test snacks, however, **do** need to be manually re-created on production via the live Django admin panel (`/admin/snacks/snack/add/`) — the free tier's lack of Shell access means the local seeding shell script can't be run directly against Render, same limitation already worked around for movies/theatres back in Phase 14's deployment.

---

## Checklist
- [x] Plan written and one open decision (convenience fee) resolved before coding
- [x] `Snack` + `BookingSnack` models, with price-snapshotting and delete-protection
- [x] Public snacks endpoint (availability-filtered) + admin CRUD reusing existing permission pattern
- [x] `create_booking` extended: snacks priced server-side, convenience fee added, all atomic with seat/booking creation
- [x] `BookingSerializer` nests snack data, automatically flowing into ticket + My Bookings
- [x] 8 test snacks seeded locally
- [x] Tested via Postman: booking total correctly equals tickets + snacks + ₹30 fee
- [x] Committed and pushed
- [ ] Production snack seeding still pending (manual, via live admin panel)
- [ ] Phase 21 (frontend: Snacks page, flow rewiring) and Phase 22 (admin snack management UI) not started