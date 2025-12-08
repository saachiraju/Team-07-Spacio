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
Environment: create `.env` (see `api/env.example`) with `MONGODB_URI`, `DATABASE_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, etc. Defaults assume local MongoDB.

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