# Phase 13 — Docker Compose (Full Stack in One Command)

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Combine Postgres, backend, and frontend into a single `docker compose up` command instead of manually starting three separate things in three separate terminals.

**Status:** ✅ Done — full stack confirmed running together, migrations + admin login confirmed working in the new containerized setup.

---

## 1. What Docker actually is (the part worth truly understanding, not skipping)

The problem Docker solves: code that runs fine on your laptop can fail on a different machine — a friend's laptop, a server — because that machine might have a different Python version, missing Postgres, or different settings. This is the classic **"it works on my machine"** problem.

**The tiffin-box analogy:** a container is like a sealed tiffin box packed with the entire meal — roti, sabzi, chawal — all together. Wherever you eat it (office, train, park), it tastes the same, because everything needed is *inside the box*, independent of the surrounding environment. A Docker container packages your app together with its exact environment (Python version, libraries, settings) — it runs identically anywhere Docker itself is installed, regardless of what else is or isn't on that machine.

**Docker Compose** is what happens when there's more than one box that needs to work together — here, three: Postgres, backend, frontend. Compose is a single instruction file that says "start these three boxes, in this order, connected to each other this way" — replacing three manually-managed terminals with one command.

---

## 2. What this phase does and doesn't change — an honest, important distinction

A fair question got raised mid-phase: *does this affect deployment?* Worth stating plainly, since it's easy to assume "we Dockerized it, so deployment uses Docker now":

- **This Compose setup is a local development convenience** — it replaces manually running Postgres, `python manage.py runserver`, and `npm run dev` in three separate terminals with one `docker compose up`.
- **It's also a direct PRD requirement** (Section 34, and acceptance criterion AC20 explicitly expects `docker compose up` to start the project) — so beyond convenience, it's something the project spec actually requires, and a genuine resume/interview talking point ("I understand containerization").
- **It does *not* directly carry over to deployment.** When Phase 14 happens: Vercel (frontend) builds directly from the GitHub repo, with no relation to Docker at all. Render (backend) can build straight from `requirements.txt` *or* optionally use the `Dockerfile` — Docker isn't mandatory there either. Render's hosted Postgres is a completely separate, independent database from anything in `docker-compose.yml`.

So this phase's real scope is **local development + fulfilling an explicit requirement**, not the mechanism deployment will actually run on. Worth remembering so Phase 14 doesn't feel confusing later.

---

## 3. The three pieces that got built

### `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```
Each line is a step in building the "box": start from a base image that already has Python 3.12, set the working folder, install exactly the packages listed in `requirements.txt` (the same file generated back in Phase 1), copy in the rest of the code, then define the command that runs when the container starts.

**`0.0.0.0:8000`, not `127.0.0.1:8000`, matters here** — `127.0.0.1` only accepts connections from *inside* the same machine/container; `0.0.0.0` means "listen on every network interface," which is required for anything outside the container (your browser, on the host machine) to actually reach it.

### `frontend/Dockerfile`
Same idea, Node-based instead of Python-based. The one detail worth calling out:
```dockerfile
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```
Same `0.0.0.0` reasoning as the backend — without `--host 0.0.0.0`, Vite's dev server would only be reachable *inside* the container, invisible from your actual browser on the host machine.

### `docker-compose.yml` — tying the three together

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
  backend:
    build: ./backend
    depends_on:
      - postgres
  frontend:
    build: ./frontend
    depends_on:
      - backend
volumes:
  postgres_data:
```

Four things worth actually understanding here, not just pasting:

- **`volumes: postgres_data`** — without this, a container's internal filesystem (including the database's actual data files) is wiped every time the container is removed and recreated. This named volume stores Postgres's data *outside* the container's own lifecycle, so it survives restarts. This is genuinely an improvement over the standalone Postgres container from Phase 0, which didn't have this.
- **`volumes: ./backend:/app`** — this "live-mounts" your actual local code folder into the container. Without it, changing a Python file locally wouldn't affect the running container at all — you'd have to rebuild the image every time. With it, edits on your machine are immediately visible inside the container, which is what makes local development practical.
- **`depends_on`** — controls startup order (Postgres starts before backend, backend before frontend) — necessary because the backend would fail if it tried connecting to a database that hadn't started yet.
- **`/app/node_modules` (frontend only, no `./` prefix)** — a specific trick: without this line, mounting your local `frontend/` folder into the container would also mount your local (possibly empty or platform-mismatched) `node_modules` *over* the one properly installed inside the container during the build. This anonymous volume tells Docker "keep the container's own `node_modules`, don't let the host's version override it."

### The one required `.env` change

```
DB_HOST=postgres
```
Previously `DB_HOST=localhost` worked because Django and the standalone Postgres container both effectively shared the same network context via the port mapping from Phase 0. Inside Docker Compose, each service runs in its own isolated container — `localhost` *inside* the backend container refers to the backend container itself, not the separate Postgres container. Compose gives each service a hostname matching its name in `docker-compose.yml` — so `postgres` (the service name) is what other containers use to reach it, resolved automatically by Docker's internal networking. This is a subtle but important shift: within Compose, containers talk to each other by *service name*, not `localhost`.

---

## 4. Fresh database, fresh setup — why migrations and a superuser had to be redone

Removing the old standalone container (`docker stop movie-booking-db && docker rm movie-booking-db`) and replacing it with Compose's own Postgres service means starting from a genuinely empty database — the new `postgres_data` volume has no history from any earlier phase. This is why `migrate` and `createsuperuser` had to be run again, this time **inside the running container**:

```powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

`docker compose exec backend <command>` means "go into the already-running `backend` container and run this command there" — the direct equivalent of activating a venv and running a command locally, just relocated inside the container instead. This is not a new concept, just the same Phase 2 commands run in a new environment.

---

## 5. Connecting the dots

```
docker compose up --build
      │
      ├── postgres  (starts first, per depends_on)
      │      └── data persists in postgres_data volume across restarts
      │
      ├── backend   (starts after postgres; DB_HOST=postgres, not localhost)
      │      └── local code live-mounted, so edits apply without rebuilding
      │
      └── frontend  (starts after backend)
             └── local code live-mounted; own node_modules protected

docker compose exec backend python manage.py migrate       ← rebuilds schema in the fresh DB
docker compose exec backend python manage.py createsuperuser ← new admin, since old one lived in the removed container
```

This phase re-creates, inside containers, exactly the same working state that existed locally at the end of Phase 12 — nothing new functionally, but now portable and startable with one command, on any machine with Docker installed.

---

## 6. Checklist

- [x] Old standalone Postgres container stopped and removed
- [x] `backend/Dockerfile` and `frontend/Dockerfile` created (both binding to `0.0.0.0`, not `127.0.0.1`)
- [x] `docker-compose.yml` created with all three services, `depends_on` ordering, `postgres_data` volume, live code-mount volumes
- [x] `backend/.env`'s `DB_HOST` updated from `localhost` to `postgres`
- [x] `docker compose up --build` confirmed starting all three services
- [x] Frontend (`localhost:5173`) and Django admin (`localhost:8000/admin/`) both confirmed loading
- [x] Fresh-DB migrations run inside the container
- [x] Fresh superuser created and confirmed logging in
- [x] Code committed and pushed

---

**Next: The big frontend push — real movie browsing, seat-map UI, and the full booking flow (the pages originally scoped in the PRD's Sections 19–24), replacing the throwaway test pages that have existed since Phase 3.**