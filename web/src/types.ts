export type StorageSize = "S" | "M" | "L";

export type Listing = {
  _id: string;
  hostId: string;
  title: string;
  description: string;
  size: StorageSize;
  sizeSqft?: number;
  pricePerMonth: number;
  addressSummary: string;
  zipCode: string;
  images: string[];
  availability: boolean;
  rating?: number;
  createdAt: string;
};

export type Reservation = {
  _id: string;
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  status: "pending_host_confirmation" | "confirmed" | "declined" | "expired";
  totalPrice: number;
  serviceFee: number;
  deposit: number;
  holdExpiresAt: string;
  createdAt: string;
  basePrice?: number;
};

export type Message = {
  _id: string;
  reservationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  zipCode: string;
  isHost: boolean;
  phone?: string;
};

