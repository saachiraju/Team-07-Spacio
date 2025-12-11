import api from "./client";
import type { Listing, StorageSize } from "../types";

export async function fetchListings(params: {
  zipCode?: string;
  priceMin?: number;
  priceMax?: number;
  size?: StorageSize;
}) {
  const { data } = await api.get<Listing[]>("/listings", { params });
  return data;
}

export async function fetchListing(id: string) {
  const { data } = await api.get<Listing>(`/listings/${id}`);
  return data;
}

export async function createListing(payload: {
  title: string;
  description: string;
  size: StorageSize;
  pricePerMonth: number;
  addressSummary: string;
  zipCode: string;
  images: string[];
}) {
  const { data } = await api.post<Listing>("/listings", payload);
  return data;
}

export async function fetchMyListings() {
  const { data } = await api.get<Listing[]>("/listings/mine");
  return data;
}

