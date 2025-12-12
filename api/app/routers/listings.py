from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from pathlib import Path
import shutil

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps.auth import get_current_user
from app.models.schemas import ListingCreate, ListingPublic, ListingUpdate, StorageSize
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
    # Derive size bucket from sqft
    size_bucket = payload.size
    if payload.sizeSqft:
        if payload.sizeSqft <= 60:
            size_bucket = StorageSize.small
        elif payload.sizeSqft <= 150:
            size_bucket = StorageSize.medium
        else:
            size_bucket = StorageSize.large

    doc = {
        "_id": listing_id,
        "hostId": current_user["_id"],
        **payload.model_dump(),
        "size": size_bucket,
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


@router.get("/mine", response_model=List[ListingPublic])
async def my_listings(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not current_user.get("isHost"):
        raise HTTPException(status_code=403, detail="Only hosts can view their listings")
    cursor = db.listings.find({"hostId": current_user["_id"]})
    items = await cursor.to_list(length=200)
    return [ListingPublic(**l) for l in items]


@router.get("/{listing_id}", response_model=ListingPublic)
async def get_listing(
    listing_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
):
    listing = await db.listings.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingPublic(**listing)


@router.patch("/{listing_id}", response_model=ListingPublic)
async def update_listing(
    listing_id: str,
    payload: ListingUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    listing = await db.listings.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("hostId") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if "sizeSqft" in updates:
        sqft = updates["sizeSqft"]
        if sqft is not None:
            if sqft <= 60:
                updates["size"] = StorageSize.small
            elif sqft <= 150:
                updates["size"] = StorageSize.medium
            else:
                updates["size"] = StorageSize.large
    if not updates:
        return ListingPublic(**listing)

    await db.listings.update_one({"_id": listing_id}, {"$set": updates})
    listing.update(updates)
    return ListingPublic(**listing)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    listing = await db.listings.find_one({"_id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("hostId") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.listings.delete_one({"_id": listing_id})
    return None


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")

    upload_dir = Path(__file__).resolve().parent.parent / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = ".jpg" if file.content_type == "image/jpeg" else ".png"
    filename = f"{uuid4()}{ext}"
    dest = upload_dir / filename

    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/{filename}"}

