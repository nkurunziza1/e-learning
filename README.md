# MCQ Assessment — Introduction to Research2

Small full-stack app: **React (Vite)** frontend, **Node/Express** API, **PostgreSQL**.

## What you do manually

1. **Install PostgreSQL** and create a database, e.g. `mcq_research`.

2. **Configure the API** — copy `backend/.env.example` to `backend/.env` and set:
   - `DATABASE_URL` — connection string for your DB
   - `JWT_SECRET` — long random string
   - Optional: `PASS_PERCENT` (default 70), `QUIZ_QUESTION_COUNT` (default 5), `PORT` (default 4000), `CORS_ORIGIN` (default `http://localhost:5173`)

3. **Initialize schema and seed data** (from `backend/`):
   ```bash
   npm install
   npm run db:init
   ```
   This creates tables, a **facilitator** user (`facilitator@greenstarz.local` / `facilitator123` unless overridden by `SEED_FACILITATOR_EMAIL` / `SEED_FACILITATOR_PASSWORD` in `.env`), and sample MCQs.

4. **Run the backend** (`backend/`):
   ```bash
   npm run dev
   ```

5. **Run the frontend** (`frontend/`):
   ```bash
   npm install
   npm run dev
   ```
   Open the URL Vite prints (usually `http://localhost:5173`). The dev server proxies `/api` to the backend.

6. **Production build** (optional): `cd frontend && npm run build` — serve `frontend/dist` with any static host and point API calls to your deployed API (set `VITE_API_URL` if you add that to the client, or use same-origin proxy).

Trainees self-register in the UI. Facilitators use the seeded account to manage questions and view attempt summaries.
