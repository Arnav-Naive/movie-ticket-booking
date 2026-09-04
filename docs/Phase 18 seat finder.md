# Phase 18 — Group Seat Finder

**Project:** Movie Ticket Booking Platform
**Status:** ✅ Done.

---

## The problem being solved

Booking seats for a group manually (clicking each one individually, checking availability by eye) is tedious once a screen has more than a handful of seats. `find_seats` automates it: given a desired count, it finds a genuinely contiguous block of available seats in a single row, or — if no perfect block exists — falls back to the best available cluster it can find and says so explicitly, rather than just failing.

```python
def is_available(s):
    if s.status == 'AVAILABLE':
        return True
    return s.status == 'HELD' and s.hold_expires_at and s.hold_expires_at < now
```
This reuses the exact same "an expired hold counts as available" rule established back in Phase 7 — the seat finder isn't a separate source of truth about availability, it's built on the same logic every other seat-status check in the project already uses.

**The row-scanning logic:** for each row, seats are sorted by number, and a running `block` list grows as long as consecutive seats are available; the moment a non-available seat is hit, the block resets. The first block that reaches the requested `count` is returned immediately. If no row has a big-enough contiguous block, it falls back to just grabbing *any* `count` available seats across the whole show, clearly labeled as an alternative (`"No {count}-seat contiguous block available, showing best alternative"`) rather than pretending it found a real cluster.

**Frontend integration:** a seat-count dropdown + "Find Seats" button above the seat map. On success, the returned `show_seat_ids` are matched back to the actual seat objects and added to the `selected` array — meaning the recommended seats are highlighted exactly the same way manually-clicked seats are, and the user can still adjust the selection afterward before continuing.

---

## Checklist
- [x] `find_seats` endpoint — contiguous-block search within rows, with best-effort fallback
- [x] Reuses Phase 7's expired-hold-counts-as-available logic (no separate availability rule invented)
- [x] Frontend seat-count selector + "Find Seats" button, results highlighted on the seat map
- [x] Tested: exact contiguous match found and highlighted; a count too large for any row correctly falls back with an explicit message
- [x] Committed and pushed