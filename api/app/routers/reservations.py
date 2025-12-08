from datetime import datetime, timedelta
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.deps.auth import get_current_user
from app.models.schemas import ReservationCreate, ReservationPublic, ReservationStatus
from app.db import get_db

router = APIRouter()


def _calculate_costs(price_per_month: float, start: datetime, end: datetime) -> tuple[float, float, float, float]:
    days = (end - start).days or 1
    base = price_per_month * (days / 30)
    service_fee = round(base * settings.service_fee_rate, 2)
    deposit = settings.refundable_deposit
    total = round(base + service_fee + deposit, 2)
    return total, base, service_fee, deposit


@router.post("/", response_model=ReservationPublic, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    listing = await db.listings.find_one({"_id": payload.listingId})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    start_dt = datetime.combine(payload.startDate, datetime.min.time())
    end_dt = datetime.combine(payload.endDate, datetime.min.time())
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    total, base, service_fee, deposit = _calculate_costs(
        listing["pricePerMonth"], start_dt, end_dt
    )

    reservation_id = str(uuid4())
    now = datetime.utcnow()
    doc = {
        "_id": reservation_id,
        "listingId": payload.listingId,
        "renterId": current_user["_id"],
        # Store as datetimes to satisfy MongoDB encoding
        "startDate": start_dt,
        "endDate": end_dt,
        "status": ReservationStatus.pending,
        "basePrice": base,
        "serviceFee": service_fee,
        "deposit": deposit,
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

