# Spacio MVP (Team-07)

Community-powered storage MVP: hosts list spare space; renters reserve nearby storage.

## Structure
- `api/` FastAPI + MongoDB backend (JWT auth, listings, reservations, messages)
- `web/` Vite + React + TypeScript + Tailwind frontend

## Backend quickstart
```
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Environment: create `.env` (see `api/env.example`) with `MONGODB_URI`, `DATABASE_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, etc. Defaults assume local MongoDB. If you run the frontend on a different port (e.g., 5174), add it to `CORS_ORIGINS` like `["http://localhost:5173","http://localhost:5174"]`.

Seed demo data (optional):
```
cd api
source .venv/bin/activate
python seed.py
```

## Frontend quickstart
```
cd web
npm install
npm run dev
```
Vite dev server on http://localhost:5173 (configured for Tailwind, React Query, React Router).

Set `VITE_API_URL` to point to the backend (e.g., `VITE_API_URL=http://127.0.0.1:8000 npm run dev`).

## Demo accounts
- Host: `host@example.com` / `password123`
- Renter: `renter@example.com` / `password123`

Run `python seed.py` in `api/` to recreate these accounts and sample listings if you clear the database.