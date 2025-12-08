"""
Seed script to create demo users and listings for Spacio.

Usage:
    source .venv/bin/activate
    MONGODB_URI="mongodb://localhost:27017" DATABASE_NAME="spacio" python seed.py
"""

import asyncio
from datetime import datetime
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import get_password_hash


async def seed():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    # Clear previous demo data
    await db.users.delete_many({"email": {"$in": ["host@example.com", "renter@example.com"]}})
    await db.listings.delete_many({"title": {"$in": ["Cozy Garage Bay", "Climate Closet"]}})

    now = datetime.utcnow()

    host_id = str(uuid4())
    renter_id = str(uuid4())

    host = {
        "_id": host_id,
        "name": "Demo Host",
        "email": "host@example.com",
        "hashed_password": get_password_hash("password123"),
        "zipCode": "94110",
        "isHost": True,
        "phone": "555-1000",
        "createdAt": now,
        "backgroundCheckAccepted": True,
        "verificationStatus": "verified-mock",
    }
    renter = {
        "_id": renter_id,
        "name": "Demo Renter",
        "email": "renter@example.com",
        "hashed_password": get_password_hash("password123"),
        "zipCode": "94110",
        "isHost": False,
        "phone": "555-2000",
        "createdAt": now,
        "backgroundCheckAccepted": False,
        "verificationStatus": "pending",
    }

    listings = [
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Cozy Garage Bay",
            "description": "Secure garage space perfect for bikes or boxes.",
            "size": "M",
            "pricePerMonth": 120.0,
            "addressSummary": "Near Mission, SF",
            "zipCode": "94110",
            "images": ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
            "availability": True,
            "rating": 4.8,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Climate Closet",
            "description": "Indoor closet for documents and small items.",
            "size": "S",
            "pricePerMonth": 80.0,
            "addressSummary": "Bernal Heights, SF",
            "zipCode": "94110",
            "images": ["https://images.unsplash.com/photo-1523419400524-fc1e0d912de8"],
            "availability": True,
            "rating": 4.9,
            "createdAt": now,
        },
    ]

    await db.users.insert_many([host, renter])
    await db.listings.insert_many(listings)

    print("Seed complete.")
    print("Host login: host@example.com / password123")
    print("Renter login: renter@example.com / password123")


if __name__ == "__main__":
    asyncio.run(seed())

