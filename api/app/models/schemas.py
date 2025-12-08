from datetime import datetime, date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class StorageSize(str, Enum):
    small = "S"
    medium = "M"
    large = "L"


class ReservationStatus(str, Enum):
    pending = "pending_host_confirmation"
    confirmed = "confirmed"
    declined = "declined"
    expired = "expired"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    zipCode: str
    isHost: bool = False
    phone: Optional[str] = None
    backgroundCheckAccepted: bool = False


class UserPublic(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    zipCode: str
    isHost: bool
    phone: Optional[str] = None
    createdAt: datetime
    verificationStatus: Optional[str] = None

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ListingBase(BaseModel):
    title: str
    description: str
    size: StorageSize
    pricePerMonth: float
    addressSummary: str
    zipCode: str
    images: List[str] = []
    availability: bool = True
    rating: Optional[float] = None


class ListingCreate(ListingBase):
    pass


class ListingPublic(ListingBase):
    id: str = Field(alias="_id")
    hostId: str
    createdAt: datetime

    class Config:
        populate_by_name = True


class ReservationCreate(BaseModel):
    listingId: str
    startDate: date
    endDate: date


class ReservationPublic(BaseModel):
    id: str = Field(alias="_id")
    listingId: str
    renterId: str
    startDate: date
    endDate: date
    status: ReservationStatus
    totalPrice: float
    serviceFee: float
    deposit: float
    holdExpiresAt: datetime
    createdAt: datetime

    class Config:
        populate_by_name = True


class MessageCreate(BaseModel):
    reservationId: str
    content: str


class MessagePublic(BaseModel):
    id: str = Field(alias="_id")
    reservationId: str
    senderId: str
    content: str
    createdAt: datetime

    class Config:
        populate_by_name = True

