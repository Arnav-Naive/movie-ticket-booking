# Phase 1 — Django Project Setup + First Push to GitHub

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Get a working, isolated Django project inside `backend/`, with all the core libraries installed, and get it safely onto GitHub.

**Status:** ✅ Done

---

## 1. The big picture

Phase 0 proved the *database* works. This phase proves the *backend framework* works — but before writing any app code, two setup problems need solving:

1. **Dependency isolation** — this project's Python packages shouldn't mix with anything else on your machine.
2. **Version control hygiene** — get the code onto GitHub without accidentally uploading giant, machine-specific junk.

---

## 2. What each step did

### Step 1–2: Virtual environment (`venv`)

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Your terminal was showing `(base)` — that's Anaconda's *global* Python environment. If you install packages there, every project on your machine shares them, and versions start fighting each other (Project A needs Django 4, Project B needs Django 5 — global installs can't do both).

`python -m venv venv` creates a **completely separate, empty Python installation** inside `backend/venv/`, private to this project. Activating it just tells your terminal "for now, use *this* Python and *this* pip, not the global one" — shown by the prompt switching to `(venv)`.

<details>
<summary>Why is <code>venv/</code> in <code>.gitignore</code> then?</summary>

It's not source code — it's a full copy of Python plus every installed package, often hundreds of MB. It's also OS-specific (a Windows venv won't work on Mac/Linux). Nobody needs to download that from GitHub; they just need `requirements.txt` (see Step 4) and can rebuild the exact same venv themselves in seconds.
</details>

### Step 3: Installing the core packages

```powershell
pip install django djangorestframework psycopg2-binary python-decouple djangorestframework-simplejwt django-cors-headers
```

| Package | What it actually does |
|---|---|
| `django` | The web framework itself — URL routing, models, admin panel |
| `djangorestframework` | Adds REST API tooling on top of Django (serializers, viewsets) — Django alone builds *websites*, DRF makes it build *APIs* |
| `psycopg2-binary` | The driver Django uses to actually talk to PostgreSQL over the network — without it, Django has no idea how to speak Postgres's protocol |
| `python-decouple` | Reads values out of the `.env` file (built in Phase 0) into Python, e.g. `config('SECRET_KEY')` |
| `djangorestframework-simplejwt` | Implements JWT login (issues access/refresh tokens) so the app doesn't need to hand-roll authentication |
| `django-cors-headers` | Without this, the browser will **block** React (running on a different port) from calling the Django API at all — this is a browser security rule (CORS), not a Django one |

### Step 4: `requirements.txt`

```powershell
pip freeze > requirements.txt
```

`pip freeze` prints every package currently installed *in the active venv*, with exact version numbers. Redirecting it into a file creates a manifest. Anyone (or you, on a new machine) can now run `pip install -r requirements.txt` and get the identical set of packages — this is what makes the project reproducible without committing the `venv/` folder itself.

### Step 5: Creating the Django project

```powershell
django-admin startproject config .
```

Two things worth noticing:
- `config` is just a name for the project's settings package — could be called anything, `config` is a common convention.
- The trailing **`.`** matters: it tells Django "create the project files directly in the current folder" instead of nesting everything one level deeper inside an extra `backend/backend/` folder. Small detail, avoids annoying import-path confusion later.

This created `backend/config/settings.py`, `urls.py`, etc. — the skeleton every Django app plugs into.

---

## 3. Getting it onto GitHub safely

The real risk in this step isn't Git syntax — it's **accidentally uploading the 100+ MB `venv/` folder** to a public repo. So the workflow was:

1. **Check `.gitignore` first**, before committing anything — confirm `venv/` is listed (it was, from Phase 0).
2. Create the empty GitHub repo (no README/license from GitHub's side, since the code already exists locally — avoids merge conflicts on first push).
3. `git add .` + `git commit` — stage and save a snapshot locally.
4. `git remote add origin <url>` + `git push` — connect the local repo to GitHub and upload.
5. **Verify, don't assume**: run
   ```powershell
   git ls-files | findstr venv
   ```
   `git ls-files` lists every file Git is actually tracking. Piping it through `findstr venv` filters for anything venv-related. Empty output = confirmed clean, `.gitignore` did its job correctly.

<details>
<summary>Why verify with `git ls-files` instead of just trusting `.gitignore`?</summary>

`.gitignore` only stops files from being added *for the first time*. If a file was ever accidentally committed *before* it was added to `.gitignore`, Git keeps tracking it forever until it's explicitly removed (`git rm --cached`). Checking `git ls-files` is the only way to be 100% sure nothing slipped through — trusting the config file without checking the actual result is how these mistakes end up live on GitHub.
</details>

---

## 4. Connecting the dots

```
backend/
├── venv/            ← private, per-machine, NEVER pushed
├── requirements.txt ← the reproducible list of what venv/ contains
├── config/          ← Django project settings (Phase 1 output)
│   ├── settings.py
│   └── urls.py
└── manage.py

Postgres (from Phase 0) ──── not connected yet.
django-cors-headers ──── installed, not configured yet (that's Phase 3, once React exists).
djangorestframework-simplejwt ──── installed, not wired to a User model yet (that's Phase 2).
```

This phase only installed the *tools*. Nothing is talking to Postgres yet, there's no custom User model yet, and CORS isn't configured yet — those are exactly what Phase 2 and Phase 3 do with what's now sitting in `requirements.txt`.

---

## 5. Checklist

- [x] `backend/venv/` created and activated
- [x] Core packages installed (Django, DRF, psycopg2-binary, decouple, simplejwt, cors-headers)
- [x] `requirements.txt` generated
- [x] `django-admin startproject config .` run correctly (no nested folder)
- [x] Code pushed to GitHub
- [x] Verified `venv/` is **not** tracked (`git ls-files | findstr venv` → empty)

## 6. Try it yourself (sanity check)

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```
Expected: Django's dev server starts, and visiting `http://127.0.0.1:8000` shows the default "The install worked successfully!" rocket page. If you see that, the project skeleton is genuinely functional — not just files sitting there.

---

**Next: Phase 2 — `users` app with a custom User model, connect Django to the Postgres container from Phase 0, and JWT auth endpoints.**