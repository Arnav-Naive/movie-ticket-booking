# Phase 0 — Repo Setup + PostgreSQL in Docker

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Get an empty project skeleton on disk, under Git, with a real PostgreSQL database running — before writing a single line of Django or React code.

**Status:** ✅ Done

---

## 1. The big picture — why this phase exists

Before any app code gets written, three things need to exist and be *verified working*:

1. A place on disk for the code (the project folder)
2. A place to track changes to that code (Git)
3. A real database the backend will eventually talk to (PostgreSQL)

The reason we do the database *first*, before Django even exists, is simple: **isolate the risk**. If Postgres itself is broken (wrong port, container won't start, wrong credentials), you want to know that *now*, with one command, not later while also debugging Django settings. This is exactly the class of bug that killed the previous project (a local MySQL version mismatch) — so this time the database runs in Docker from day one, completely separate from anything installed on your machine.

<details>
<summary>Why does "isolating the database in Docker" actually prevent that old bug?</summary>

Last time, Postgres/MySQL was installed *directly on the machine*. That means its version was whatever your OS package manager gave you, and if Django/a library expected a different version, things broke — and fixing it meant messing with system-level installs.

A Docker container is a small, self-contained box that includes its own exact copy of Postgres 16. It doesn't touch your machine's own software. If it breaks, you `docker rm` it and start a fresh one in ten seconds — no system-level cleanup required.
</details>

---

## 2. What each step actually did

### Step 1–3: Project folder + Git + skeleton folders

```
movie-ticket-booking/
├── backend/     ← Django + DRF will live here (Phase 1+)
├── frontend/    ← React will live here (Phase 3+)
└── docs/        ← project documentation (PRD, diagrams, these phase docs)
```

`git init` turns this folder into a Git repository — meaning Git starts watching it for changes. Nothing is committed yet; this just switches tracking on.

**Why separate `backend/` and `frontend/` folders at the root, instead of one big folder?**
Because they are two *independent* applications that just happen to talk to each other over HTTP. Django doesn't need to know React exists, and vice versa. Keeping them in sibling folders (rather than nested inside one another) makes this separation physical, not just conceptual — and it's exactly how you'll containerize them separately in Phase 13.

### Step 4: `.gitignore`

This file tells Git "never track these files/folders." Three categories, and *why* each matters:

| What's ignored | Why |
|---|---|
| `.env` | Contains real secrets (DB passwords, API keys). If this gets committed, it's in Git history forever — even if you delete it later. This is the single most common way student projects leak credentials on GitHub. |
| `__pycache__/`, `node_modules/`, `dist/` | Auto-generated files. They're rebuilt from your source code automatically, so committing them just bloats the repo for no benefit. |
| `db.sqlite3` | Leftover from Django's default database. You're using Postgres, so this shouldn't exist — but if Django ever creates one by accident, it won't get committed either. |

### Step 5: `.env.example`

This is the opposite of `.env` — it *is* meant to be committed. It lists every environment variable the project needs (`SECRET_KEY`, `DATABASE_URL`, `TMDB_ACCESS_TOKEN`, etc.) but with **empty values**. It's a template. Anyone (including you, three weeks from now) can copy it to `.env` and fill in real values, without ever having to guess what variables the project needs.

<details>
<summary>Why not just document the variable names in the README instead?</summary>

A README can go stale. A `.env.example` file is checked by the same tooling that reads `.env`, so if you add a new environment variable in Phase 9 (say, `RAZORPAY_KEY_ID`) and forget to add it to `.env.example`, it's an easy visual diff to catch in a code review. It also means `cp .env.example .env` is a literal, working setup step — not just prose.
</details>

### Step 6–7: PostgreSQL container

```powershell
docker run -d --name movie-booking-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=moviebooking -p 5432:5432 postgres:16
```

Breaking this command down piece by piece:

| Flag | Meaning |
|---|---|
| `docker run` | Start a new container from an image |
| `-d` | "Detached" — run it in the background, don't block your terminal |
| `--name movie-booking-db` | Give the container a human-readable name (instead of a random ID) so you can refer to it later, e.g. `docker stop movie-booking-db` |
| `-e POSTGRES_USER=postgres` etc. | Environment variables *the Postgres image itself* reads on first startup, to create the initial user, password, and database |
| `-p 5432:5432` | Map port 5432 **inside** the container to port 5432 **on your machine**. Without this, Postgres would be running but unreachable from outside the container. `5432` is Postgres's standard port. |
| `postgres:16` | The image to use — official Postgres, major version 16 |

**What actually happened when you ran it:** Docker didn't find `postgres:16` on your machine yet ("Unable to find image locally"), so it downloaded ("pulled") it layer by layer from Docker Hub — that's all the `Pulling`/`Download complete` lines. Once downloaded, it started a container from that image.

### Verifying it worked

```
CONTAINER ID   IMAGE         STATUS          PORTS                     NAMES
11922f7ec817   postgres:16   Up 47 seconds   0.0.0.0:5432->5432/tcp   movie-booking-db
```

This is exactly what you want to see:
- **STATUS: Up** — the container is running, not crashed
- **PORTS: 0.0.0.0:5432->5432/tcp** — confirms the port mapping from the `-p` flag actually took effect

If this container ever shows `Exited` instead of `Up`, the fix is: `docker logs movie-booking-db` — it'll print the exact error Postgres hit on startup.

---

## 3. Connecting the dots

```
Project folder (Git-tracked)
        │
        ├── .env.example  ──►  template for real secrets (never committed: .env)
        │
        ├── backend/   ──►  Phase 1 starts here (Django + this Postgres DB)
        │
        └── frontend/  ──►  Phase 3 starts here (React)

Postgres container (movie-booking-db)
        │
        └── running independently, listening on localhost:5432,
            waiting for Django to connect to it in Phase 1
```

Nothing here is "wired together" yet — Django doesn't exist, so nothing is actually talking to Postgres. This phase only proves the *pieces individually work*: the folder structure is right, Git is tracking it, and a real database is reachable. Phase 1 is where Django gets pointed at `localhost:5432` and actually uses it.

---

## 4. Checklist — confirm before moving on

- [x] `movie-ticket-booking/` folder exists with `backend/`, `frontend/`, `docs/`
- [x] `git init` run inside it
- [x] `.gitignore` created with env/Python/Node/media rules
- [x] `.env.example` created (placeholders only)
- [x] `docker ps` shows `movie-booking-db` as `Up` with port `5432` mapped

## 5. Try it yourself (sanity check)

```powershell
docker exec -it movie-booking-db psql -U postgres -d moviebooking
```
Expected: drops you into a `moviebooking=#` prompt. Type `\q` to exit. If this works, Django will be able to connect too — this is the same connection Django uses under the hood.

---

**Next: Phase 1 — Django project + `users` app + connecting Django to this Postgres container.**