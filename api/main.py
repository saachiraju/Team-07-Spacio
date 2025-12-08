from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, listings, reservations, messages

app = FastAPI(
    title="Spacio API",
    version="0.1.0",
    description="Community-powered storage MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(listings.router, prefix="/listings", tags=["listings"])
app.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])

