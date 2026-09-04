# Phase 14 — Deployment (Render + Vercel)

**Project:** Movie Ticket Booking Platform
**Status:** Live on Render (backend) + Vercel (frontend). Auth, movies, and shows confirmed working in production. Full booking→payment→ticket flow test on the live site is the next step.

---

## 1. Backend production changes

```powershell
pip install gunicorn whitenoise
```
- **`gunicorn`** — a production-grade WSGI server. `python manage.py runserver` (used everywhere so far) is explicitly a *development* server — single-threaded, not built for real traffic, and Django itself warns against using it in production. Render needs a real server process to run, which is what the `gunicorn config.wsgi:application` start command provides.
- **`whitenoise`** — serves Django's static files (CSS/JS, including the admin panel's own styling) directly from the app in production. Without it, the Django admin panel would load with zero styling — technically functional, but broken-looking.

```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```
`collectstatic` (run at build time) gathers every static file into `STATIC_ROOT`; whitenoise then serves them efficiently (compressed, cached) straight from that folder.

---

## 2. Render setup — two real mistakes caught before they caused damage

Filling in the Render Web Service form, the local `.env` was almost copied in wholesale — worth flagging both catches as real, not hypothetical:

1. **`DB_HOST=postgres` would have been wrong here.** That value only resolves inside Docker Compose's internal network (Phase 13) — Render's hosted Postgres has its own real hostname (something like `dpg-xxxxx-a.singapore-postgres.render.com`), found on the database service's own Info/Connect tab. Blindly reusing a local `.env` value on a different infrastructure is exactly the kind of mistake worth double-checking every time an environment changes — the same category of error as Phase 13's local-vs-Docker `DB_HOST` confusion, just one environment further along.
2. **`DEBUG=True` in production is a real security risk**, not just a style preference — if `DEBUG=True` and an unhandled error occurs, Django shows the *full* stack trace, including settings values, to anyone who triggers the error. Correctly changed to `DEBUG=False` before deploying.

Everything else (`SECRET_KEY`, `TMDB_ACCESS_TOKEN`, Razorpay keys) was fine to carry over as-is — set directly in Render's Environment Variables dashboard, **not** by uploading a `.env` file (Render doesn't use your local `.env` at all; env vars live in its own dashboard, per service).

---

## 3. No Shell access on the free plan — migrations and superuser creation had to move into the build itself

Render's free tier doesn't include Shell access, which is what earlier plans assumed (`python manage.py migrate` run interactively, same as Docker's `exec` pattern from Phase 13). Two changes solved this properly rather than working around it:

**Migrations moved into the Build Command itself:**
```
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```
This means migrations run automatically on *every* deploy — arguably better practice than a manual step anyway, since it removes the chance of forgetting to run them after a schema change ships.

**A custom one-off management command for the superuser**, since `createsuperuser` normally requires interactive terminal input (which isn't available here either):
```python
# users/management/commands/create_admin.py
class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'ChangeMe123!')
```
The `if not ... exists()` check is what makes this **idempotent** — safe to run on every single deploy (since it's chained into the same Build Command) without ever trying to recreate a superuser that already exists and erroring out.

```
... && python manage.py migrate && python manage.py create_admin
```

<details>
<summary>Why this is a legitimate Django pattern, not just a hack</summary>

Django's `manage.py <command>` system is designed to be extended — any file placed at `<app>/management/commands/<name>.py` with a `Command` class automatically becomes a new manageable command, callable exactly like Django's built-in ones (`migrate`, `runserver`, etc.). This is the correct, standard way to script one-off or repeatable administrative tasks, rather than a workaround specific to this deployment.
</details>

---

## 4. Two smaller but real bugs along the way

- **CORS trailing slash**: `"https://your-app.vercel.app/"` (with a trailing `/`) was entered instead of `"https://your-app.vercel.app"` (without it). CORS origin matching is exact-string — a trailing slash makes it a different string entirely, so the browser correctly treated it as *not* an allowed origin, which is what caused registration to fail with a `500`.
- **The `500` on registration before migrations ran**: with no Shell access and migrations not yet wired into the build, the very first deploy had an empty/unmigrated database — any request touching the `User` table failed. Once the build command was updated to include `migrate`, this resolved itself on the next deploy — a good reminder that a `500` error can mean "the code is broken" *or* "the database this code expects doesn't exist yet," and it's worth checking which before assuming a code bug.

Both fixed, and confirmed via Render's **Logs** tab — checking for `Applying auth.0001_initial... OK`-style lines and `Superuser created` in the deploy log is what actually confirms a deploy did what it was supposed to, rather than just seeing "Deployed" as a status.

---

## 5. Re-seeding data on the live database

The production Postgres database (from Render) started completely empty — none of the local Docker database's City/Theatre/Screen/Seat/Movie/Show data carries over automatically; they're entirely separate databases. With no Shell access, this had to be done through the tools that *are* available:

- **City/Theatre/Screen/Seat** — created manually through the live Django admin panel (`https://<backend>.onrender.com/admin/`), the same process as every earlier phase's local admin data entry, just pointed at production.
- **Movies** — re-imported via Postman, hitting the live backend's real URLs (login → TMDB search → import), the exact same three-step process from Phase 4, just against `https://cinemax-backend-raok.onrender.com/api/...` instead of `127.0.0.1:8000`.
- **Shows** — created per movie through the admin panel.

This is genuinely repetitive manual work, but it's a direct consequence of the free-tier Shell limitation — without Shell access, there's no way to run the Phase 14c bulk-import shell script directly on the live server.

---

## 6. Where things stand — confirmed so far

- [x] `gunicorn` + `whitenoise` added for production
- [x] Render PostgreSQL database created, correct real credentials used (not local `.env` values)
- [x] `DEBUG=False` set for production
- [x] Backend deployed to Render, build command includes `migrate` + `create_admin`
- [x] Superuser (`admin` / `ChangeMe123!`) confirmed created via deploy logs — **should be changed from the default password once logged into `/admin/`**
- [x] CORS trailing-slash bug fixed
- [x] Frontend deployed to Vercel, `VITE_API_URL` pointed at the live Render backend
- [x] Registration and login confirmed working on the live site
- [x] City/Theatre/Screen/Seat data re-created on production via admin panel
- [x] Movies re-imported via Postman against the live backend
- [x] Shows created for the re-imported movies, live movie grid confirmed populated
- [ ] **Full booking flow (seats → hold → summary countdown → Razorpay payment → ticket → My Bookings) not yet tested on the live site** — this is the current next step
- [ ] Razorpay may need the live Vercel domain explicitly whitelisted in its dashboard (Settings → API/Website config) — flagged as a likely blocker for the payment step specifically, not yet confirmed either way

---

## 7. One important standing reminder

Render's free Postgres **auto-expires 30 days after creation** (14-day grace period before data loss) — flagged back when the database was first created. If this deployment sits untouched for over a month before being demoed, expect to redo the re-seeding in Section 5 — not a bug, just the free tier's actual behavior.

---

**Next: run the full booking → payment → ticket flow live on Vercel, checking specifically whether Razorpay's checkout needs the production domain whitelisted. Once that passes, the deployment is functionally complete — README polish (live URLs + screenshots) remains as the last documentation step.**