from datetime import datetime, timedelta, date
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.deps.auth import get_current_user
from app.models.schemas import ReservationCreate, ReservationPublic, ReservationStatus
from app.db import get_db

router = APIRouter()


def _calculate_costs(
    price_per_month: float, 
    total_sqft: float,
    sqft_requested: float,
    start: datetime, 
    end: datetime, 
    add_insurance: bool
) -> tuple[float, float, float, float]:
    days = (end - start).days or 1
    space_ratio = sqft_requested / total_sqft
    base = price_per_month * space_ratio * (days / 30)
    service_fee = round(base * settings.service_fee_rate, 2)
    
    insurance = 0
    if add_insurance:
        insurance = round(sqft_requested * 0.15, 2)
    
    total = round(base + service_fee + insurance, 2)
    return total, base, service_fee, insurance


@router.post("/", response_model=ReservationPublic, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    listing = await db.listings.find_one({"_id": payload.listingId})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.get("hostId") == current_user["_id"]:
        raise HTTPException(status_code=400, detail="You cannot rent your own listing")

    start_dt = datetime.combine(payload.startDate, datetime.min.time())
    end_dt = datetime.combine(payload.endDate, datetime.min.time())
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    available_from = listing.get("availableFrom")
    available_to = listing.get("availableTo")
    if available_from and start_dt < datetime.combine(available_from, datetime.min.time()) if isinstance(available_from, date) else start_dt < available_from:
        raise HTTPException(status_code=400, detail=f"This space is not available until {available_from}")
    if available_to and end_dt > datetime.combine(available_to, datetime.min.time()) if isinstance(available_to, date) else end_dt > available_to:
        raise HTTPException(status_code=400, detail=f"This space is only available until {available_to}")

    booking_deadline = listing.get("bookingDeadline")
    if booking_deadline:
        deadline_dt = datetime.combine(booking_deadline, datetime.min.time()) if isinstance(booking_deadline, date) else booking_deadline
        if datetime.utcnow() > deadline_dt:
            raise HTTPException(status_code=400, detail=f"Booking deadline has passed ({booking_deadline}). No new reservations accepted.")

    total_sqft = listing.get("sizeSqft", 100)
    sqft_requested = payload.sqftRequested
    
    if sqft_requested <= 0:
        raise HTTPException(status_code=400, detail="Must request at least 1 sqft")
    if sqft_requested > total_sqft:
        raise HTTPException(status_code=400, detail=f"Cannot request more than {total_sqft} sqft available")
    
    overlapping_reservations = await db.reservations.find({
        "listingId": payload.listingId,
        "status": {"$in": ["confirmed", "pending_host_confirmation"]},
        "$and": [
            {"startDate": {"$lt": end_dt}},
            {"endDate": {"$gt": start_dt}}
        ]
    }).to_list(length=500)
    
    reserved_sqft = sum(r.get("sqftRequested", 0) for r in overlapping_reservations)
    available_sqft = total_sqft - reserved_sqft
    
    if sqft_requested > available_sqft:
        raise HTTPException(
            status_code=400, 
            detail=f"Only {available_sqft} sqft available for these dates. {reserved_sqft} sqft already reserved."
        )

    total, base, service_fee, insurance = _calculate_costs(
        listing["pricePerMonth"], total_sqft, sqft_requested, start_dt, end_dt, payload.addInsurance
    )

    reservation_id = str(uuid4())
    now = datetime.utcnow()
    doc = {
        "_id": reservation_id,
        "listingId": payload.listingId,
        "renterId": current_user["_id"],
        "startDate": start_dt,
        "endDate": end_dt,
        "sqftRequested": sqft_requested,
        "status": ReservationStatus.pending,
        "basePrice": base,
        "serviceFee": service_fee,
        "insurance": insurance,
        "totalPrice": total,
        "holdExpiresAt": now + timedelta(hours=24),
        "createdAt": now,
        "paymentStatus": "mocked-success",
    }
    await db.reservations.insert_one(doc)
    return ReservationPublic(**doc)


@router.post("/{reservation_id}/approve", response_model=ReservationPublic)
async def approve_reservation(
    reservation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reservation = await db.reservations.find_one({"_id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    listing = await db.listings.find_one({"_id": reservation["listingId"]})
    if not listing or listing.get("hostId") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this listing")

    await db.reservations.update_one(
        {"_id": reservation_id},
        {"$set": {"status": ReservationStatus.confirmed}},
    )
    reservation["status"] = ReservationStatus.confirmed
    return ReservationPublic(**reservation)


@router.post("/{reservation_id}/decline", response_model=ReservationPublic)
async def decline_reservation(
    reservation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reservation = await db.reservations.find_one({"_id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    listing = await db.listings.find_one({"_id": reservation["listingId"]})
    if not listing or listing.get("hostId") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this listing")

    await db.reservations.update_one(
        {"_id": reservation_id},
        {"$set": {"status": ReservationStatus.declined}},
    )
    reservation["status"] = ReservationStatus.declined
    return ReservationPublic(**reservation)


@router.get("/", response_model=List[ReservationPublic])
async def list_my_reservations(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    filters = {"renterId": current_user["_id"]}

    if current_user.get("isHost"):
        host_listings = await db.listings.find({"hostId": current_user["_id"]}).to_list(
            length=200
        )
        host_listing_ids = [l["_id"] for l in host_listings]
        filters = {"$or": [{"renterId": current_user["_id"]}, {"listingId": {"$in": host_listing_ids}}]}

    cursor = db.reservations.find(filters)
    reservations = await cursor.to_list(length=200)
    return [ReservationPublic(**r) for r in reservations]


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reservation = await db.reservations.find_one({"_id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    listing = await db.listings.find_one({"_id": reservation["listingId"]})
    is_host_owner = listing and listing.get("hostId") == current_user["_id"]
    is_renter = reservation.get("renterId") == current_user["_id"]

    if not (is_host_owner or is_renter):
        raise HTTPException(status_code=403, detail="Not authorized for this reservation")

    await db.reservations.delete_one({"_id": reservation_id})
    return None
