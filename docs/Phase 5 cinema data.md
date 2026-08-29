# Phase 5 — Cinema Data (City → Theatre → Screen → Seat)

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Model the physical world the app operates in — cities, theatres, screens, and individual seats — as admin-managed data, with public read access and admin-only writes, all enforced by the backend.

**Status:** ✅ Done — full CRUD + permission checks confirmed for all four models.

---

## 1. The chain of ownership, and why it's a chain

```
City ──has many──► Theatre ──has many──► Screen ──has many──► Seat
```

Each level exists because the level above it isn't specific enough on its own. "Bhubaneswar" alone doesn't tell you which building; "CineMax" alone doesn't tell you which auditorium inside it; "Screen 1" alone doesn't tell you which physical chair. This four-level chain is what eventually lets a `Show` (Phase 6) say *exactly* which seats belong to it — because a Seat already knows which Screen it's in, which already knows which Theatre, which already knows which City.

This is all **admin-managed data**: a customer never creates a theatre or a seat — they only ever *browse* what an admin already set up. That split (admin writes, everyone reads) is the permission model this whole phase is built around.

---

## 2. The four models, and what each field decision means

### `City`
```python
class City(models.Model):
    name = models.CharField(max_length=100, unique=True)
```
Deliberately minimal — for this project's scope, a city is just a name. `unique=True` stops "Bhubaneswar" from accidentally being created twice.

### `Theatre`
```python
class Theatre(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='theatres')
```
The `ForeignKey` is what actually creates the "belongs to" relationship — every `Theatre` row must point at exactly one `City` row. `related_name='theatres'` means that from a `City` object in Python, you can write `some_city.theatres.all()` to get every theatre in that city, without writing a manual query.

<details>
<summary>What does <code>on_delete=models.CASCADE</code> actually do?</summary>

It answers the question "what happens to a Theatre if its City gets deleted?" `CASCADE` means: delete the City, and every Theatre pointing at it gets deleted too — automatically, at the database level. This same pattern repeats down the whole chain (Screen → Theatre, Seat → Screen), so deleting a City would eventually cascade all the way down and delete every Screen and Seat under it too. This is intentional here (an orphaned Screen with no Theatre makes no sense) — but it's worth knowing this is a *destructive default*, not a soft "just unlink it" behavior.
</details>

### `Screen`
```python
class Screen(models.Model):
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='screens')
    name = models.CharField(max_length=100)  # e.g. "Screen 1"
```
Same pattern one level down — a Screen belongs to exactly one Theatre.

### `Seat`
```python
class Seat(models.Model):
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='seats')
    row = models.CharField(max_length=2)
    number = models.IntegerField()
    seat_type = models.CharField(max_length=10, choices=SEAT_TYPES, default='REGULAR')

    class Meta:
        unique_together = ('screen', 'row', 'number')
```
Two things worth slowing down on:

- **`choices=SEAT_TYPES`** restricts `seat_type` to only `'REGULAR'` or `'PREMIUM'` — the database itself won't accept anything else, so there's no risk of a typo like `"Regualr"` silently creating a broken seat type.
- **`unique_together = ('screen', 'row', 'number')`** is a *database-level* constraint, not just an application check. It guarantees seat **A1** can never exist twice on the same Screen — even if a bug in your Python code tried to create it twice, Postgres itself would reject the second insert. This is stronger protection than checking "does this seat exist?" in your view code, because it can't be bypassed by a bug or a race condition.

---

## 3. `IsAdminOrReadOnly` — a custom permission, explained properly

```python
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return request.user and request.user.is_staff
```

DRF ships some built-in permission classes, but none of them exactly match "anyone can read, only admins can write" — so this one was written by hand. The logic, read plainly:

1. If the request is a **SAFE method** (`GET`, `HEAD`, `OPTIONS` — anything that only *reads* data, never changes it) → always allow, no login required.
2. Otherwise (this is a `POST`, `PUT`, `PATCH`, or `DELETE` — something that *changes* data) → only allow it if there's a logged-in user **and** that user's `is_staff` flag is `True`.

This single class gets reused across all four `ViewSet`s (`City`, `Theatre`, `Screen`, `Seat`) — write it once, apply it everywhere the same rule applies. It's the same "backend decides, not the frontend" principle already tested in Phase 4's TMDB import — just generalized into a reusable rule instead of one-off logic.

---

## 4. `ModelViewSet` + `DefaultRouter` — why so little code produces so many endpoints

```python
class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAdminOrReadOnly]
```
A `ModelViewSet` is DRF's way of saying "generate list, retrieve, create, update, and delete behavior for this model, automatically" — instead of hand-writing five separate view functions per model (which is what you'd do in plain Django). The `serializer_class` (see below) tells it how to convert a `City` row into JSON and back; `permission_classes` tells it who's allowed to do what.

```python
router = DefaultRouter()
router.register('cities', CityViewSet)
...
urlpatterns = router.urls
```
The `router` then looks at each registered `ViewSet` and automatically builds the matching URLs — `GET/POST /api/cities/`, `GET/PUT/DELETE /api/cities/{id}/`, and so on — for all four models, without a single URL being typed out by hand. This is why Step 9 is so short: the router is doing the repetitive part.

### Serializers — the translation layer

```python
class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'
```
A `ModelSerializer` converts between a Django model instance (a Python object) and JSON (what the API sends/receives over HTTP). `fields = '__all__'` means "include every field from the model" — a fine default here since none of these models contain anything sensitive worth hiding.

---

## 5. What the five tests actually verified

| Test | What it proves |
|---|---|
| A — `GET /api/cities/`, no token | Public read access works — browsing doesn't require login |
| B — `POST /api/cities/` with a **superuser** token | An admin *can* create data |
| C — `POST /api/cities/` with a **normal user** token → expected `403` | A regular logged-in user still **cannot** write — this is the test that actually proves `IsAdminOrReadOnly` works, not just that it exists in the code |
| D — `GET /api/theatres/` | Confirms the `city` foreign key correctly shows up in the response |
| E — `GET /api/seats/` | Confirms all 6 test seats (A1–A3 Regular, B1–B3 Premium) were created correctly and `unique_together` didn't block legitimate distinct seats |

Test C is the one that matters most — a permission class that merely *exists* in code but was never tested against an actual unauthorized attempt isn't the same as one that's *confirmed working*. This mirrors exactly the check done for TMDB import in Phase 4.

---

## 6. Connecting the dots

```
City (Bhubaneswar)
  └── Theatre (CineMax)
        └── Screen (Screen 1)
              └── Seat (A1, A2, A3 [Regular], B1, B2, B3 [Premium])

Permission rule (IsAdminOrReadOnly), reused across all 4 models:
   GET   → open to everyone
   write → only is_staff=True users (same is_staff check style as Phase 4's admin-only import)

Not yet connected: none of this is tied to a specific movie or showtime yet.
That link — Movie + Screen + Date + Time + Price — is exactly what Phase 6 builds.
```

---

## 7. Checklist

- [x] `cinemas` app created and registered
- [x] `City`, `Theatre`, `Screen`, `Seat` models created with correct foreign key chain
- [x] `unique_together` on `Seat` prevents duplicate seats per screen
- [x] Migrations created and applied
- [x] Serializers created for all four models
- [x] Custom `IsAdminOrReadOnly` permission written and applied
- [x] Router-based URLs wired into `config/urls.py` under `/api/`
- [x] Public GET confirmed working without a token
- [x] Admin POST confirmed working (201)
- [x] Normal user POST confirmed **rejected** (403)
- [x] Nested data (theatre → city, seats → screen) confirmed showing correctly
- [x] Code committed and pushed

---

**Next: Phase 6 — Shows. Connects Movie + Screen + Date + Time + Price into one bookable unit.**