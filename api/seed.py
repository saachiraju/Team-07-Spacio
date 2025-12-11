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
        # San Francisco
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Mission Garage Bay",
            "description": "Secure garage space perfect for bikes or boxes.",
            "size": "M",
            "pricePerMonth": 120.0,
            "addressSummary": "Near Mission, SF",
            "zipCode": "94110",
            "images": ["https://images.unsplash.com/photo-1505692794403-34d4982c9b53?auto=format&fit=crop&w=1200&q=80"],
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
            "images": ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.9,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Inner Sunset Storage Nook",
            "description": "Small indoor nook great for boxes and documents.",
            "size": "S",
            "pricePerMonth": 95.0,
            "addressSummary": "Inner Sunset, SF",
            "zipCode": "94122",
            "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.6,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "SoMa Indoor Room",
            "description": "Lockable room for seasonal items and equipment.",
            "size": "M",
            "pricePerMonth": 180.0,
            "addressSummary": "SoMa, SF",
            "zipCode": "94103",
            "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.7,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Nob Hill Closet",
            "description": "Clean closet space in secure building.",
            "size": "S",
            "pricePerMonth": 110.0,
            "addressSummary": "Nob Hill, SF",
            "zipCode": "94109",
            "images": ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.5,
            "createdAt": now,
        },
        # Riverside
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Riverside Small Garage",
            "description": "Secure small garage ideal for boxes, small furniture, sports gear.",
            "size": "M",
            "pricePerMonth": 100,
            "addressSummary": "Near UCR campus",
            "zipCode": "92507",
            "images": ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.7,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Spare Room by UCR",
            "description": "Extra bedroom for clean, indoor storage. Ground floor.",
            "size": "M",
            "pricePerMonth": 95,
            "addressSummary": "3 miles from UCR",
            "zipCode": "92507",
            "images": ["https://images.unsplash.com/photo-1600585154340-0ef3c08f05d5?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.6,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Covered Carport Spot",
            "description": "Covered driveway spot for bikes or compact car storage.",
            "size": "L",
            "pricePerMonth": 130,
            "addressSummary": "Canyon Crest, Riverside",
            "zipCode": "92506",
            "images": ["https://images.unsplash.com/photo-1582719478248-54e9f2af5b7b?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.8,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Garage Corner Storage",
            "description": "Corner of attached garage, ideal for bins and gear.",
            "size": "S",
            "pricePerMonth": 75,
            "addressSummary": "Orangecrest, Riverside",
            "zipCode": "92508",
            "images": ["https://images.unsplash.com/photo-1600585154340-0ef3c08f05d5?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.6,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Indoor Closet Space",
            "description": "Hallway closet, climate-controlled, great for documents.",
            "size": "S",
            "pricePerMonth": 70,
            "addressSummary": "Downtown Riverside",
            "zipCode": "92501",
            "images": ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.5,
            "createdAt": now,
        },
        # Irvine / UCI
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Irvine Garage Spot",
            "description": "Private garage bay near UCI, good for bikes or boxes.",
            "size": "M",
            "pricePerMonth": 150,
            "addressSummary": "University Park, Irvine",
            "zipCode": "92612",
            "images": ["https://images.unsplash.com/photo-1505692069463-5e3405e30f98?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.8,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Westpark Storage Closet",
            "description": "Indoor closet in townhouse, clean and climate-controlled.",
            "size": "S",
            "pricePerMonth": 95,
            "addressSummary": "Westpark, Irvine",
            "zipCode": "92614",
            "images": ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.6,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Portola Parkway Carport",
            "description": "Covered carport for a sedan or gear, easy access.",
            "size": "L",
            "pricePerMonth": 140,
            "addressSummary": "Portola Springs, Irvine",
            "zipCode": "92618",
            "images": ["https://images.unsplash.com/photo-1523419400524-fc1e0d912de8?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.7,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Attached Garage Shelf Space",
            "description": "Shelf and floor space in attached garage, great for totes.",
            "size": "S",
            "pricePerMonth": 85,
            "addressSummary": "Woodbridge, Irvine",
            "zipCode": "92604",
            "images": ["https://images.unsplash.com/photo-1600585154340-0ef3c08f05d5?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.5,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Extra Room Near UCI",
            "description": "Spare bedroom for clean storage; easy access to campus.",
            "size": "M",
            "pricePerMonth": 160,
            "addressSummary": "Rancho San Joaquin, Irvine",
            "zipCode": "92612",
            "images": ["https://images.unsplash.com/photo-1505693415763-3ed5e04ba4cd?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.8,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Garage Storage by Spectrum",
            "description": "Half bay in two-car garage, ideal for boxes and gear.",
            "size": "M",
            "pricePerMonth": 145,
            "addressSummary": "Near Irvine Spectrum",
            "zipCode": "92618",
            "images": ["https://images.unsplash.com/photo-1582719478248-54e9f2af5b7b?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.7,
            "createdAt": now,
        },
        {
            "_id": str(uuid4()),
            "hostId": host_id,
            "title": "Clean Closet in Condo",
            "description": "Small indoor closet, climate-controlled for documents.",
            "size": "S",
            "pricePerMonth": 90,
            "addressSummary": "Spectrum area, Irvine",
            "zipCode": "92618",
            "images": ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"],
            "availability": True,
            "rating": 4.6,
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

