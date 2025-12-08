from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.deps.auth import get_current_user
from app.models.schemas import ListingCreate, ListingPublic, StorageSize
from app.db import get_db

router = APIRouter()


@router.post("/", response_model=ListingPublic, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not current_user.get("isHost"):
        raise HTTPException(status_code=403, detail="Only hosts can create listings")

    listing_id = str(uuid4())
    now = datetime.utcnow()
    doc = {
        "_id": listing_id,
        "hostId": current_user["_id"],
        **payload.model_dump(),
        "rating": payload.rating or 4.7,  # fake rating placeholder
        "createdAt": now,
    }
    await db.listings.insert_one(doc)
    return ListingPublic(**doc)


@router.get("/", response_model=List[ListingPublic])
async def list_listings(
    zipCode: Optional[str] = None,
    priceMin: Optional[float] = Query(default=None, ge=0),
    priceMax: Optional[float] = Query(default=None, ge=0),
    size: Optional[StorageSize] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    filters: dict = {}
    if zipCode:
        filters["zipCode"] = zipCode
    if size:
        filters["size"] = size
    if priceMin is not None or priceMax is not None:
        price_filter: dict = {}
        if priceMin is not None:
            price_filter["$gte"] = priceMin
        if priceMax is not None:
            price_filter["$lte"] = priceMax
        filters["pricePerMonth"] = price_filter

    cursor = db.listings.find(filters)
    listings = await cursor.to_list(length=100)

    if zipCode:
        listings.sort(
            key=lambda l: (
                0 if l.get("zipCode") == zipCode else 1,
                -(l.get("rating") or 0),
            )
        )
    return [ListingPublic(**l) for l in listings]


@router.get("/{listing_id}", response_model=ListingPublic)
async def get_listing(
    listing_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
):
    listing = await db.listings.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingPublic(**listing)

