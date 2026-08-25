# Phase 2 — Custom User Model + JWT Authentication

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Replace Django's default User with a custom one (before any data exists), connect Django to the real Postgres database, and get working JWT login (register/login/me).

**Status:** ✅ Done — register, login, and the protected `/me/` endpoint all tested and working via Postman.

---

## 1. The one rule that shaped this whole phase

> **A custom User model must be set up *before* the first `migrate` — never after.**

Django's default `User` table, once created, gets referenced by lots of other tables (permissions, sessions, admin logs). Swapping it out afterward means untangling all those references — painful enough that the usual fix is "delete the database and start over." Since no `migrate` had been run yet in this project, this was the correct — and only easy — window to do it.

<details>
<summary>Why bother with a custom User at all, if it's just <code>pass</code> for now?</summary>

Right now `class User(AbstractUser): pass` adds nothing — it's identical to Django's default. The point isn't today, it's next month: when you eventually want a `phone_number` or `is_admin_theatre_manager` field, you just add it to this class and migrate. Without this step done now, adding a field to the User model later would mean going through the exact same "swap the User model after data exists" problem this phase was avoiding.
</details>

---

## 2. What got built, and why each piece exists

### `users` app + `AUTH_USER_MODEL`
```python
# users/models.py
class User(AbstractUser):
    pass
```
```python
# settings.py
AUTH_USER_MODEL = 'users.User'
```
This one setting is what tells Django, project-wide, "whenever anything needs *the* User model (login, admin, foreign keys), use `users.User`, not the built-in one." Every other app in this project (`bookings`, etc.) will later point `ForeignKey(User)` at this same model.

### Switching Django from SQLite to Postgres

Django ships defaulting to SQLite (a single file on disk) — fine for a five-minute demo, useless for this project since the real database is already running in Docker (Phase 0). Three things had to line up:

1. **`backend/.env`** — holds the real DB credentials (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`), matching exactly what was set when the Postgres container was created in Phase 0.
2. **`python-decouple`**'s `config(...)` — reads those values out of `.env` into Python.
3. **The `DATABASES` block in `settings.py`** — swapped from `django.db.backends.sqlite3` to `django.db.backends.postgresql`, using the values read in step 2.

Nothing here creates the connection *yet* — it's just configuration. The connection actually happens the moment a command like `migrate` runs.

### `makemigrations` vs `migrate` — a distinction that trips up most beginners

- `makemigrations` — Django looks at your models (`User`, etc.) and writes a **migration file**: a set of instructions describing what tables/columns *should* look like. Nothing touches the database yet. It's like writing a recipe.
- `migrate` — Django actually **runs** those instructions against the real database (Postgres, now that it's configured), creating the actual tables.

This is why "makemigrations ran clean" and "migrate ran clean" were two separate confirmed steps — one writes the plan, the other executes it.

### Confirming it actually worked: superuser + admin login

`createsuperuser` creates one User row with admin privileges. Logging into `/admin/` with it and seeing the Django admin panel proves two things simultaneously: the custom `User` model works, *and* Django is genuinely talking to Postgres (not silently falling back to SQLite).

---

## 3. Where is the database, actually? (a real question you asked)

Worth spelling out clearly since it's easy to get vague about:

```
Docker container (movie-booking-db)          ← the "house"
   └── Postgres server (running inside it)
         └── database: moviebooking          ← a "room" in the house
               └── tables: users_user, auth_group, django_admin_log, ...
                                              ← "cabinets" inside the room, holding rows of data
```

The `docker run ... -e POSTGRES_DB=moviebooking ...` command back in Phase 0 did two things at once: started the Postgres server *and* auto-created the empty `moviebooking` database inside it. Then `migrate` in this phase filled that empty database with actual tables.

**To look inside it directly:**
```powershell
docker exec -it movie-booking-db psql -U postgres -d moviebooking
```
then inside the prompt: `\dt` lists all tables, `SELECT * FROM users_user;` shows your actual rows, `\q` exits.
(A GUI tool like DBeaver, pointed at `localhost:5432` / db `moviebooking` / user `postgres`, gives the same view without typing SQL — worth setting up once you're doing this often.)

---

## 4. On deployment — a question worth flagging now, answered properly later

You asked something important: *if this Postgres container only exists on your laptop, does the laptop need to stay on forever once deployed?*

Short answer: **for local development, yes — the container only runs while Docker is running on your machine.** But this isn't how the *deployed* version will work. When Phase 14 (deployment) happens, the plan is to use a **managed Postgres database** hosted by the free-tier platform (e.g. Render's free Postgres, or similar) — a database that runs on their servers, always on, completely separate from your laptop. Your local Docker Postgres is purely a development tool; it gets left behind at deploy time, not shipped anywhere. This distinction — "local Docker for building" vs "hosted DB for the live site" — is worth remembering now so Phase 14 doesn't feel like a surprise.

---

## 5. JWT auth — what was actually tested

Three endpoints, each proving a different link in the chain:

| Test | What it proves |
|---|---|
| `POST /api/auth/register/` → 201, returns `id`/`username`/`email` (no password) | A new row is correctly created in `users_user`, and the password is hashed, never echoed back |
| `POST /api/auth/login/` → 200, returns `access` + `refresh` tokens | Django can verify a password against the hash and issue a signed JWT |
| `GET /api/auth/me/` with `Authorization: Bearer <access token>` → 200, returns user details | The access token alone — no session, no cookie — is enough to prove identity on a protected endpoint |

That third test is the real point of JWT: the server doesn't need to "remember" you're logged in (no server-side session). The token itself, once verified, *is* the proof — this is what makes JWT a good fit for a frontend (React) and backend (Django) that are otherwise strangers to each other, talking only over HTTP.

---

## 6. Connecting the dots

```
Phase 0: Postgres container running, empty "moviebooking" database
Phase 1: Django installed, but still pointed at SQLite, no models yet
Phase 2 (this phase):
   users.User  ──set as──►  AUTH_USER_MODEL
   settings.py ──points DATABASES at──► Postgres (Phase 0's container)
   migrate     ──creates──► users_user table + Django's built-in tables
   simplejwt   ──issues──►  access/refresh tokens on login
   /api/auth/me/ ──protected by──► the access token, proving the whole chain works
```

Every future app (`movies`, `bookings`, `payments`) will attach to this same `User` via foreign keys, and every protected endpoint from here on reuses this same `Authorization: Bearer <token>` pattern.

---

## 7. Checklist

- [x] `users` app created, `AbstractUser`-based `User` model defined
- [x] `AUTH_USER_MODEL = 'users.User'` set before first migration
- [x] `.env` created with real Postgres credentials, read via `python-decouple`
- [x] `DATABASES` switched from SQLite to Postgres
- [x] `makemigrations` + `migrate` run successfully against Postgres
- [x] Superuser created, logged into `/admin/` successfully
- [x] Register, login, and `/me/` endpoints all tested and working
- [x] `.env` confirmed **not** tracked by Git; changes committed and pushed

---

**Next: Phase 3 — React frontend setup (Vite), CORS wired so it can actually call this backend, and login/register UI.**