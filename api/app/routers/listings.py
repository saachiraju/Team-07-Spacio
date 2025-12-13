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
    
    if current_user.get("verificationStatus") != "verified":
        raise HTTPException(status_code=403, detail="You must verify your identity before creating listings")

    listing_id = str(uuid4())
    now = datetime.utcnow()
    size_bucket = payload.size
    if payload.sizeSqft:
        if payload.sizeSqft <= 60:
            size_bucket = StorageSize.small
        elif payload.sizeSqft <= 150:
            size_bucket = StorageSize.medium
        else:
            size_bucket = StorageSize.large

    payload_dict = payload.model_dump()
    if payload_dict.get("availableFrom"):
        payload_dict["availableFrom"] = datetime.combine(payload_dict["availableFrom"], datetime.min.time())
    if payload_dict.get("availableTo"):
        payload_dict["availableTo"] = datetime.combine(payload_dict["availableTo"], datetime.min.time())
    if payload_dict.get("bookingDeadline"):
        payload_dict["bookingDeadline"] = datetime.combine(payload_dict["bookingDeadline"], datetime.min.time())

    doc = {
        "_id": listing_id,
        "hostId": current_user["_id"],
        **payload_dict,
        "size": size_bucket,
        "rating": payload_dict.get("rating") or 4.7,
        "createdAt": now,
    }
    await db.listings.insert_one(doc)
    return ListingPublic(**doc)


@router.get("/")
async def list_listings(
    zipCode: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    priceMin: Optional[float] = Query(default=None, ge=0),
    priceMax: Optional[float] = Query(default=None, ge=0),
    size: Optional[StorageSize] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    filters: dict = {}
    if zipCode:
        filters["zipCode"] = {"$regex": f"^{zipCode}", "$options": "i"}
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

    if startDate and endDate:
        from datetime import datetime as dt
        search_start = dt.fromisoformat(startDate)
        search_end = dt.fromisoformat(endDate)
        
        def is_within_availability(listing):
            available_from = listing.get("availableFrom")
            available_to = listing.get("availableTo")
            
            if not available_from and not available_to:
                return True
            
            if available_from:
                if hasattr(available_from, 'date'):
                    pass
                else:
                    available_from = dt.combine(available_from, dt.min.time())
            
            if available_to:
                if hasattr(available_to, 'date'):
                    pass
                else:
                    available_to = dt.combine(available_to, dt.min.time())
            
            if available_from and search_start < available_from:
                return False
            if available_to and search_end > available_to:
                return False
            
            return True
        
        listings = [l for l in listings if is_within_availability(l)]
        
        overlapping_reservations = await db.reservations.find({
            "status": {"$in": ["confirmed", "pending_host_confirmation"]},
            "$and": [
                {"startDate": {"$lt": search_end}},
                {"endDate": {"$gt": search_start}}
            ]
        }).to_list(length=500)
        
        reserved_listing_ids = set(r["listingId"] for r in overlapping_reservations)
        
        listings = [l for l in listings if l["_id"] not in reserved_listing_ids]

    host_ids = list(set(l.get("hostId") for l in listings if l.get("hostId")))
    hosts = {}
    if host_ids:
        host_cursor = db.users.find({"_id": {"$in": host_ids}})
        host_list = await host_cursor.to_list(length=100)
        hosts = {h["_id"]: h for h in host_list}

    listing_ids = [l["_id"] for l in listings]
    from datetime import datetime as dt
    now = dt.utcnow()
    
    active_reservations = await db.reservations.find({
        "listingId": {"$in": listing_ids},
        "status": {"$in": ["confirmed", "pending_host_confirmation"]},
        "endDate": {"$gt": now}
    }).to_list(length=1000)
    
    reserved_by_listing = {}
    for r in active_reservations:
        lid = r["listingId"]
        if lid not in reserved_by_listing:
            reserved_by_listing[lid] = 0
        reserved_by_listing[lid] += r.get("sqftRequested", 0)

    for listing in listings:
        host = hosts.get(listing.get("hostId"), {})
        listing["hostVerified"] = host.get("verificationStatus") == "verified"
        
        total_sqft = listing.get("sizeSqft", 100)
        reserved_sqft = reserved_by_listing.get(listing["_id"], 0)
        listing["availableSqft"] = max(0, total_sqft - reserved_sqft)

    if zipCode:
        listings.sort(
            key=lambda l: (
                0 if l.get("zipCode") == zipCode else 1,
                -(l.get("rating") or 0),
            )
        )
    return listings


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
