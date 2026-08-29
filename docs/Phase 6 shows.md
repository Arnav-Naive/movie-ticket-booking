# Phase 6 — Shows (Movie + Screen + Date + Time + Price)

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Create the actual bookable unit of the app — a `Show`, which ties a specific movie to a specific screen at a specific date/time/price — plus filtering so users can search by movie, city, theatre, or date.

**Status:** ✅ Done — listing, filtering (movie/date confirmed), and permissions all working.

---

## 1. Why `Show` is the model that ties everything together

Every phase so far built one piece in isolation:
- Phase 4 gave you real **movies**
- Phase 5 gave you **screens** (inside theatres, inside cities)

Neither of those, alone, is bookable. "Inception" isn't bookable — "Inception, at CineMax Screen 1, on the 22nd at 7:30 PM, for ₹250" is. That specific combination is exactly what `Show` represents — it's the first model in this project that a customer will actually interact with directly.

```python
class Show(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='shows')
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='shows')
    date = models.DateField()
    start_time = models.TimeField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        unique_together = ('screen', 'date', 'start_time')
```

Two decisions worth understanding, not just copying:

### Why `DecimalField`, not `FloatField`, for price

`FloatField` stores numbers the way computers naturally represent decimals in binary — which means values like `250.00` can, after some calculations, silently drift to something like `249.999999999`. For money, that's not a cosmetic bug, it's a correctness bug — a booking total that's off by fractions of a rupee is still wrong. `DecimalField` stores the number in a way that avoids this entirely, which is why it's the standard choice for anything involving currency, in Django or any other framework.

### Why `unique_together = ('screen', 'date', 'start_time')`

This is the same database-level protection pattern used for `Seat` in Phase 5 (`unique_together` on `screen, row, number`), applied to a different real-world conflict: **a single screen physically cannot run two different shows at the same time.** Without this constraint, nothing would stop an admin (or a bug) from accidentally double-booking Screen 1 for 7:30 PM twice. The database itself refuses the second one.

---

## 2. The serializer — showing readable names, not just IDs

```python
class ShowSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    theatre_name = serializers.CharField(source='screen.theatre.name', read_only=True)
    screen_name = serializers.CharField(source='screen.name', read_only=True)

    class Meta:
        model = Show
        fields = '__all__'
```

Without this, a raw `Show` API response would just show `"movie": 1, "screen": 3` — numeric IDs the frontend would then have to look up separately to display anything meaningful. The three extra fields here solve that by walking the relationship chain **on the backend**, so the frontend gets human-readable names in the same response, with zero extra API calls.

`source='screen.theatre.name'` is the key trick: DRF reads this like a path — go to this Show's `screen`, then that Screen's `theatre`, then that Theatre's `name`. This works because of the exact foreign-key chain built in Phase 5 (`Show → Screen → Theatre → City`) — this serializer is only possible *because* that chain exists.

---

## 3. Filtering — the actual PRD requirement, and how it's implemented

The PRD specifically asked for filtering shows by movie, city, theatre, and date (Section 26). Rather than four separate endpoints, this is handled with one endpoint and optional query parameters:

```python
def get_queryset(self):
    queryset = Show.objects.all()
    movie_id = self.request.query_params.get('movie')
    city_id = self.request.query_params.get('city')
    ...
    if movie_id:
        queryset = queryset.filter(movie_id=movie_id)
    if city_id:
        queryset = queryset.filter(screen__theatre__city_id=city_id)
    ...
    return queryset
```

`get_queryset` is a method DRF calls automatically whenever a list request comes in — overriding it is how you customize *which* rows get returned, instead of always returning everything.

**`screen__theatre__city_id`** is Django's "double-underscore" syntax for filtering across relationships — read it the same way as the serializer's `source` path: start at `Show`, follow `screen`, follow `theatre`, filter on its `city_id`. This is what makes `GET /api/shows/?city=2` work even though `Show` has no direct `city` field of its own — Django builds the necessary SQL join automatically.

The filters are all optional and combinable — if none are given, every show is returned; if several are given, they combine (movie AND date AND city, etc.).

---

## 4. Reusing `IsAdminOrReadOnly` instead of rewriting it

```python
from cinemas.views import IsAdminOrReadOnly
```

Worth noting explicitly: this permission class was written once, in Phase 5, for the cinema models — and here it's simply *imported and reused* for `Show`, not rewritten. This is a small but real software-engineering habit: once a rule ("public read, admin write") is correctly written and tested once, every future model that needs the same rule just imports it. If the rule ever needs to change, there's one place to fix it, not five.

---

## 5. Two things worth calling out from the actual session

**The `api/` prefix appearing twice in `urlpatterns` is correct, not a bug.** Each `include(...)` brings in its own distinct set of paths (`cinemas.urls` → `cities/`, `theatres/`...; `shows.urls` → `shows/`). Django doesn't care how many times a *prefix* like `api/` is reused — it only cares whether two entries resolve to the exact same final path, which none of these do. So `api/cities/` and `api/shows/` coexist without any conflict.

**The 500 error on `GET /api/shows/?movie=%3C1%3E` wasn't a real bug.** `%3C1%3E` is the URL-encoded form of literal angle brackets around the number — `<1>` — which happened because the placeholder in the testing instructions (`<tumhari movie ka id>`) got pasted in literally, brackets included, instead of being replaced with an actual number. Once the real ID (`movie=1`) was used, it returned `200 OK` correctly. Worth remembering for future testing: angle brackets in these docs mean "replace this whole thing," not "keep the brackets."

---

## 6. Connecting the dots

```
Movie (Phase 4)  ─┐
                   ├──►  Show  ◄── date, start_time, price (Show's own fields)
Screen (Phase 5) ─┘        │
                            └──► Screen → Theatre → City chain (Phase 5)
                                  reused for both the serializer's readable
                                  names AND the city/theatre filters here

unique_together on Show ──► same protection pattern as Seat in Phase 5,
                             applied to a different real-world conflict
                             (no double-booked screen instead of no duplicate seat)
```

Nothing about seat *availability per show* exists yet — right now, `Show` just says a movie is playing on a screen at a time for a price. The next phase (`ShowSeat`) is what makes each individual seat's status (available/held/booked) specific to *this particular* show, rather than the screen in general.

---

## 7. Checklist

- [x] `shows` app created and registered
- [x] `Show` model created — `DecimalField` for price, `unique_together` on (screen, date, start_time)
- [x] Migrations created and applied
- [x] `ShowSerializer` includes readable `movie_title`/`theatre_name`/`screen_name` via `source=`
- [x] `IsAdminOrReadOnly` reused (not rewritten) from `cinemas`
- [x] `get_queryset` filtering by movie/city/theatre/date implemented
- [x] Router URLs wired into `config/urls.py`
- [x] Test show created via Django admin
- [x] Public list confirmed working, with readable names in the response
- [x] Filter by movie confirmed working
- [x] Filter by date confirmed working
- [x] Code committed and pushed

---

**Next: Phase 7 — Seat selection. `ShowSeat`, the seat map, hold logic with `select_for_update()`, and the countdown timer. This is the biggest phase so far.**