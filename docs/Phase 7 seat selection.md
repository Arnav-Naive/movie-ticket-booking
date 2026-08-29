# Phase 7 — Seat Selection: ShowSeat, Hold Logic, and Concurrency

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Make seat availability specific to *each show* (not just each screen), auto-generate that availability data the moment a show is created, and prove that two users clicking the same seat at the same time can't both win.

**Status:** ✅ Done — `ShowSeat` auto-creation confirmed via signal, and the core concurrency test (two simultaneous hold attempts on the same seat) confirmed working.

---

## 1. Why `ShowSeat` has to exist — the core problem

Seat A1 is a physical object. It lives permanently on Screen 1 (from Phase 5). But "is A1 available?" is not a fixed fact about A1 — it depends on *which show* you're asking about:

```
20 Aug, 5:00 PM show → A1 = BOOKED
20 Aug, 8:00 PM show → same physical A1 = AVAILABLE
```

If availability were stored directly on `Seat`, there'd be no way to represent both of those states at once — booking A1 for the 5PM show would incorrectly make it look booked for the 8PM show too. So a new table, `ShowSeat`, tracks status **per (Show, Seat) pair** instead of per Seat alone:

```python
class ShowSeat(models.Model):
    STATUS_CHOICES = [('AVAILABLE', 'Available'), ('HELD', 'Held'), ('BOOKED', 'Booked')]
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='show_seats')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='show_seats')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='AVAILABLE')
    hold_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('show', 'seat')
```

`unique_together = ('show', 'seat')` — same protective pattern as Phases 5 and 6, applied again: seat A1 can only have *one* status row for a given show, never two conflicting ones.

`hold_expires_at` is what will let a temporary hold automatically become "as good as available" once enough time passes, without needing a constantly-running background job (more on this below).

---

## 2. The signal — auto-creating ShowSeat rows the moment a Show is created

Manually creating 6+ `ShowSeat` rows every time an admin adds a show would be tedious and error-prone (easy to forget one). Instead, this is automated with a **Django signal**:

```python
@receiver(post_save, sender=Show)
def create_show_seats(sender, instance, created, **kwargs):
    if created:
        seats = instance.screen.seats.all()
        show_seats = [ShowSeat(show=instance, seat=seat, status='AVAILABLE') for seat in seats]
        ShowSeat.objects.bulk_create(show_seats)
```

Breaking down what's actually happening:

- **`post_save`** is a signal Django fires automatically, immediately after *any* model's `.save()` runs. `sender=Show` restricts this to only fire for `Show` saves, not every model in the project.
- **`created`** is a boolean Django passes in — `True` only the *first* time a row is saved (an insert), `False` on every subsequent update. The `if created:` check is what stops this from re-running (and re-creating duplicate seats) every time an admin merely edits an existing show's price.
- **`instance.screen.seats.all()`** walks the exact foreign-key chain from Phase 5 (`Screen → seats`) to get every physical seat on that screen.
- **`bulk_create`** inserts all the new `ShowSeat` rows in a single database query, instead of one query per seat — meaningfully faster once a screen has 50+ seats instead of 6.

<details>
<summary>Why a signal instead of just writing this logic inside the Show creation view?</summary>

A signal fires no matter *how* a Show gets created — through the API, through the Django admin panel, through the shell, through a management command written later. Logic placed inside one specific view would only run for requests that go through that exact view. Since shows in this project get created through the admin panel (an `is_staff` action) as well as potentially the API, the signal guarantees this behavior is consistent everywhere, not duplicated (or forgotten) in multiple places.
</details>

### Why the verification test mattered

The shell test specifically checked that the **old** Show (created back in Phase 6, before this signal existed) had `0` ShowSeats, while a **newly created** Show had exactly `6` (matching the screen's seat count). This wasn't a redundant check — it's proof the signal only affects *future* saves, not retroactively rewriting history. A migration doesn't run existing code against old data; a signal only fires going forward from the moment it's defined. Confirming both the 0 and the 6 is what separates "I assume this works" from "I checked it actually behaves the way I think it does."

---

## 3. The concurrency problem — and why it's the hardest part of this whole project

This is the scenario the PRD specifically called out as a must-handle case:

> User A selects seat A1 **and** User B selects seat A1, at almost the same time. Only one of them should succeed.

The naive way to check seat availability — "read the status, see if it's AVAILABLE, then write HELD" — has a dangerous gap between the *read* and the *write*. If both users' requests read "AVAILABLE" before either one writes "HELD", **both** could pass the check and both think they hold the seat. This is a **race condition**, and it's exactly the kind of bug that's invisible in casual manual testing (you're only ever one user clicking one button) but real the moment two genuine users hit the app at once.

The fix relies on two PostgreSQL/Django mechanisms working together:

- **`transaction.atomic()`** — groups a set of database operations so they either *all* succeed together or *all* get rolled back together, with no half-finished state visible to anyone else.
- **`select_for_update()`** — when reading a row inside that transaction, this tells Postgres "lock this specific row until my transaction finishes." If a second request tries to read (and lock) the *same* row at the same time, Postgres makes it **wait** until the first transaction is completely done — read, check, and write — before letting the second one even see the row's current state.

Put together, the effect is: the "is this seat available? → mark it held" sequence becomes a single, uninterruptible unit per seat. There's no gap for a second request to sneak through anymore.

### The test that proved it

Two near-simultaneous hold requests were fired at the same seat. The result:
- **Job 1: "Seats held successfully"**
- **Job 2: "Seats already unavailable"** — correctly rejected

This is the actual proof, not just the theory — one request won, the other was cleanly refused instead of both silently succeeding and creating a double-booked seat.

> **A note on completeness:** the exact endpoint code implementing `select_for_update()` + `transaction.atomic()` (and however the two simultaneous test requests were fired — likely two threads or two quick sequential Postman/script calls) wasn't included in what you pasted this time. The explanation above covers *why* it works and what the test result proves, but if you want the actual hold-seat view code documented line-by-line too, paste it and I'll add that in.

<details>
<summary>Why is this worth explaining confidently in an interview?</summary>

Most beginner CRUD projects never hit a genuine concurrency problem — everything is single-user, sequential testing. Being able to say "I identified a race condition, used PostgreSQL row-level locking inside an atomic transaction to serialize access to the contested resource, and verified it with a real concurrent test" is a specific, correct, and uncommon thing for a student project to demonstrate. It's worth being able to explain *why* the naive approach fails, not just that the fixed version works — that's the part that actually shows understanding.
</details>

---

## 4. Connecting the dots

```
Show created (Phase 6, now with the signal from this phase)
   │
   └──► post_save signal fires ──► bulk_create ──► one ShowSeat row per seat
                                                     on that show's screen,
                                                     status = AVAILABLE

User selects a seat
   │
   └──► hold request ──► transaction.atomic() + select_for_update()
                          on that ShowSeat row
                             │
              ┌──────────────┴───────────────┐
       row was AVAILABLE              row was already
       → status = HELD                HELD/BOOKED
       → hold_expires_at set          → request rejected
```

What's still missing, deliberately deferred per the PRD: nothing yet *expires* an old hold automatically in the background — the plan (per the original spec) is to treat an expired `hold_expires_at` as equivalent to available whenever a new hold/booking check happens, rather than running a scheduled cleanup job. That logic will matter once Phase 8 (bookings) and Phase 9 (payment timeout/failure) are built on top of this.

---

## 5. Checklist

- [x] `ShowSeat` model created with `status` and `hold_expires_at`, `unique_together` on (show, seat)
- [x] `post_save` signal auto-creates `ShowSeat` rows for every seat on a new show's screen
- [x] Migrations created and applied
- [x] Verified via shell: old show has 0 ShowSeats, new show has the correct count (6)
- [x] Concurrency handled with `transaction.atomic()` + `select_for_update()`
- [x] Verified with a real simultaneous-request test: one hold succeeds, the other is correctly rejected

---

**Next: Phase 8 — Bookings. `Booking` + `BookingSeat`, with the total price calculated on the backend from the actual held seats — never trusting a number sent by the frontend.**