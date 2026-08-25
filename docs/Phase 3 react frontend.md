# Phase 3 — React Frontend Setup + Connecting It to Django

**Project:** Movie Ticket Booking Platform
**Goal of this phase:** Get a real React app running, prove it can actually talk to the Django backend (CORS + axios), then replace the throwaway test code with a real page/routing structure.

**Status:** ✅ Done — Home/Login/Register pages working, login flow tested end-to-end.

---

## 1. The big picture

Phases 1–2 proved the backend works *on its own* (Postman talking directly to Django). This phase has one real job: prove that **two separate applications, running on two separate ports, can talk to each other over HTTP** — because that's the actual architecture of this project. React and Django don't share a process or a codebase; they're strangers that only interact through API calls.

Everything in this phase builds toward one specific test: click a button in the browser, have it successfully call Django, and get a real token back.

---

## 2. What each step did

### Step 1–2: Creating the React project

```powershell
npm create vite@latest . -- --template react
```
**Vite** is a build tool — it's what turns your `.jsx` files into something a browser can actually run, and gives you the fast `npm run dev` live-reload server. The `.` (same trick as `django-admin startproject config .` in Phase 1) means "build it directly inside the current `frontend/` folder," not in a new nested one.

Seeing the default Vite+React starter page (logo, counter button) at `localhost:5173` confirmed: Node, npm, and Vite are all correctly installed and working — before any of your own code exists.

### Step 3–4: The two packages that matter most here

```powershell
npm install react-router-dom axios
```
- **`react-router-dom`** — lets the app show different "pages" (Home, Login, Register) without actually reloading the browser or hitting the server for a new HTML file each time. This is what makes a React app a *Single Page Application*.
- **`axios`** — a library for making HTTP requests. You *could* use the browser's built-in `fetch`, but axios has nicer defaults (automatic JSON parsing, cleaner error handling) — this is the tool React uses to actually call Django's API.

### `frontend/.env` + `VITE_API_URL`

```
VITE_API_URL=http://127.0.0.1:8000/api
```

<details>
<summary>Why does the variable need the <code>VITE_</code> prefix?</summary>

Anything in a `.env` file could theoretically be a secret. Vite only exposes variables prefixed with `VITE_` to your actual browser-side code — everything else stays server-side-only (not that Vite has a server-side in this setup, but the rule is consistent across Vite projects). It's a safety rail: you have to *opt in* a variable to be visible in the browser, rather than everything being exposed by default.
</details>

This is also why the URL is stored here instead of hardcoded in every file that makes an API call — when this app gets deployed later (Phase 14), only this one line changes (from `127.0.0.1:8000` to the real deployed backend URL), instead of hunting through every component.

### `src/services/api.js` — the centralized axios instance

```javascript
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```
Every API call in the app imports this `api` object instead of calling `axios` directly. The benefit: `baseURL` is defined exactly once. Every future call just writes `api.post('/auth/login/', ...)` instead of the full URL every time — and if the URL ever needs to change, there's one place to fix it, not fifty.

### The connection test — and why CORS mattered here

The temporary `App.jsx` test button called Django's `/auth/login/` directly from the browser. Getting back `"Connected! Access token: ..."` instead of an error proved something that wasn't obvious from Phase 1–2 alone: **`django-cors-headers` (installed back in Phase 1) is actually configured correctly.**

<details>
<summary>What would have happened without CORS configured?</summary>

Browsers enforce a rule called the *same-origin policy*: a page loaded from `localhost:5173` is, by default, **blocked** from making requests to `localhost:8000` — different port counts as a different "origin," and the browser refuses on your behalf, purely as a security measure (this has nothing to do with Django itself). `django-cors-headers`, once configured, tells Django to send back a header saying "requests from `localhost:5173` are explicitly allowed." Without it, Postman would still work fine (Postman doesn't enforce this browser rule) but the *actual React app* would fail with a CORS error in the console — this is exactly why testing through Postman alone in Phase 2 wasn't enough to prove the frontend would work.
</details>

---

## 3. Replacing the throwaway test code with real structure

Once the connection was proven, the temporary test button in `App.jsx` was thrown away and replaced with a real folder structure:

```
src/
├── pages/        ← full screens: Home, Login, Register
├── components/   ← smaller reusable pieces (empty for now, used from Phase 4+)
├── layouts/       ← shared page wrappers, e.g. navbar+footer (empty for now)
├── context/       ← app-wide state like "is the user logged in" (empty for now)
└── services/
    └── api.js     ← the centralized axios instance
```

**Why create empty folders now (`components/`, `layouts/`, `context/`) instead of when they're first needed?** Because the *shape* of the project is decided once, up front, and every future phase just fills folders that already exist — instead of you having to remember and decide "where should this new file go?" every single time.

### `Login.jsx` and `Register.jsx` — what they actually do

Both follow the same pattern: React's `useState` holds the form's current values as the user types, `handleSubmit` sends those values to Django via `api.post(...)`, and the result either shows success or an error message.

The one detail worth calling out: on successful login,
```javascript
localStorage.setItem('access', res.data.access);
localStorage.setItem('refresh', res.data.refresh);
```
This is the token-storage decision flagged back when the PRD was reviewed — storing JWTs in `localStorage` is the *simple* option (easy to read from any component) but carries an XSS risk (any malicious script that runs on your page could read them too). The safer alternative — `httpOnly` cookies — is more complex to set up correctly. For this project's stage, `localStorage` is the deliberate, acknowledged trade-off, not an oversight.

### `App.jsx` — routing

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Routes>
```
`react-router-dom`'s `Routes`/`Route` pair is essentially a lookup table: "when the URL path matches X, render component Y." `<Link to="/login">` in the navbar changes the URL and swaps the visible component — without a full page reload, which is what makes it feel instant.

---

## 4. Connecting the dots

```
Django backend (Phase 1–2)               React frontend (this phase)
   /api/auth/register/    ◄────axios────  Register.jsx
   /api/auth/login/       ◄────axios────  Login.jsx
   (CORS headers allow    ◄──────────────  localhost:5173 as an
    localhost:5173)                        allowed origin

Successful login response
   { access, refresh }  ──stored in──►  localStorage
                                            │
                                            └──► will be attached to every
                                                 future protected request as
                                                 "Authorization: Bearer <token>"
                                                 (this is the same pattern
                                                 tested manually in Phase 2's
                                                 Postman /me/ test)
```

Nothing about the seat booking, movies, or payments exists yet — this phase only proves the *communication layer* between the two halves of the app is solid. Every future feature (movie browsing, seat selection) is just "more pages that call more API endpoints," using this exact same `api.js` + routing pattern already in place.

---

## 5. Checklist

- [x] Vite React project created in `frontend/`
- [x] `react-router-dom` + `axios` installed
- [x] `frontend/.env` created with `VITE_API_URL`
- [x] Centralized `api.js` axios instance created
- [x] Frontend confirmed able to call Django and get a real token back (CORS working)
- [x] Temporary test code replaced with real `pages/`, `components/`, `layouts/`, `context/` structure
- [x] Home, Login, Register pages built and routed
- [x] Full login flow tested end-to-end in the browser (not just Postman)
- [x] Code committed and pushed

## 6. Try it yourself (sanity check)

With both servers running (`python manage.py runserver` in one terminal, `npm run dev` in another), open `http://localhost:5173/register`, register a brand-new user, then log in with it at `/login`. Expected: `"Login successful!"` alert, and if you open the browser's DevTools → Application → Local Storage, you should see `access` and `refresh` keys with long token strings as values.

---

**Next: Phase 4 — TMDB integration. Requires a free TMDB account + API key before starting.**