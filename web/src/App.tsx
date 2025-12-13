import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Listing, Message, Reservation, StorageSize } from "./types";
import { useAuth } from "./hooks/useAuth";
import * as listingApi from "./api/listings";
import * as reservationApi from "./api/reservations";
import * as messageApi from "./api/messages";
import * as pricingApi from "./api/pricing";
import * as matchingApi from "./api/matching";
import * as verificationApi from "./api/verification";

const sizes: StorageSize[] = ["S", "M", "L"];

function getListingImage(listing: Listing | undefined, fallbackIndex: number = 0): string {
  if (listing?.images?.[0]) {
    return listing.images[0].startsWith('/') 
      ? `http://127.0.0.1:8000${listing.images[0]}` 
      : listing.images[0];
  }
  
  const text = `${listing?.title || ''} ${listing?.description || ''}`.toLowerCase();
  if (text.includes('closet') || text.includes('room') || text.includes('indoor') || text.includes('nook')) {
    return "http://127.0.0.1:8000/images/closet-img.webp";
  }
  if (text.includes('garage') || text.includes('parking') || text.includes('outdoor')) {
    return "http://127.0.0.1:8000/images/garage-img.jpg";
  }
  
  return fallbackIndex % 2 === 0 
    ? "http://127.0.0.1:8000/images/garage-img.jpg"
    : "http://127.0.0.1:8000/images/closet-img.webp";
}

function Nav() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-600">
          Spacio
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
          {!user && (
            <>
              <Link to="/login" className="hover:text-slate-900 transition-colors">Login</Link>
              <Link to="/register" className="bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-500 transition-colors">
                Sign up
              </Link>
            </>
          )}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pl-3 hover:shadow-md transition-shadow"
              >
                <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
              
              {showUserMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-slate-700">My Profile</span>
                    </Link>
                    
                    <Link 
                      to="/profile?tab=reservations" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-700">My Reservations</span>
                    </Link>
                    
                    {user.isHost && user.verificationStatus === "verified" && (
                      <Link 
                        to="/host" 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-slate-700">Host Dashboard</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors w-full text-left"
                      >
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-slate-700">Log out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function Landing() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<{
    zipCode?: string;
    startDate?: string;
    endDate?: string;
    priceMin?: number;
    priceMax?: number;
    size?: StorageSize;
  }>({});
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  
  const shouldSearch = (filters.zipCode?.length ?? 0) >= 1;
  
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => listingApi.fetchListings(filters),
    enabled: shouldSearch,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, "", "/");
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Payment Success Banner */}
      {showPaymentSuccess && (
        <div className="bg-emerald-500 text-white py-3 px-4">
          <div className="mx-auto max-w-6xl flex items-center gap-3">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Payment successful! Your reservation is confirmed.</span>
          </div>
        </div>
      )}

      {/* Hero Section with Search */}
      <div className="relative min-h-[380px]">
        <div 
          className="absolute inset-0 h-[380px] bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 h-[380px] bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16">
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Find storage space near you
            </h1>
            <p className="text-lg md:text-xl text-white/90 drop-shadow">
              Affordable, secure storage from verified local hosts
            </p>
          </div>

          {/* Modern Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Location */}
              <div className="p-3 md:border-r border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={filters.zipCode || ""}
                  onChange={(e) => setFilters(f => ({ ...f, zipCode: e.target.value }))}
                  className="w-full text-slate-900 font-medium placeholder:text-slate-400 outline-none text-lg"
                />
              </div>
              
              {/* Check In */}
              <div className="p-3 md:border-r border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full text-slate-900 font-medium outline-none text-lg"
                />
              </div>
              
              {/* Check Out */}
              <div className="p-3 md:border-r border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full text-slate-900 font-medium outline-none text-lg"
                />
              </div>
              
              {/* Search Button */}
              <div className="p-2 flex items-center">
                <div className="w-full h-full bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 min-h-[56px]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isLoading ? "Searching..." : "Search"}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/90">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Verified Hosts</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Secure Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Save up to 50%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 bg-slate-50">
        {/* Search Results */}
        {shouldSearch && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isLoading ? "Searching..." : `${listings.length} ${listings.length === 1 ? 'space' : 'spaces'} available`}
                </h2>
                <p className="text-slate-600">
                  {filters.zipCode && `matching "${filters.zipCode}"`}
                  {filters.startDate && filters.endDate && ` • ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filters.size || ""}
                  onChange={(e) => {
                    setFilters(f => ({ ...f, size: e.target.value as StorageSize || undefined }));
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition"
                >
                  <option value="">Any size</option>
                  <option value="S">Small</option>
                  <option value="M">Medium</option>
                  <option value="L">Large</option>
                </select>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing, index) => {
                  const imageUrl = getListingImage(listing, index);
                  
                  return (
                    <div
                      key={listing._id}
                      onClick={() => setSelected(listing)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                        <img
                          src={imageUrl}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "http://127.0.0.1:8000/images/garage-img.jpg";
                          }}
                        />
                        {listing.hostVerified && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                            <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        )}
                        <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm">
                            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium">{listing.rating ?? "4.7"}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm mt-0.5">{listing.addressSummary}</p>
                        <p className="text-slate-500 text-sm">{listing.sizeSqft ? `${listing.sizeSqft} sqft total` : listing.size} • {listing.zipCode}</p>
                        <p className="text-sm mt-1">
                          <span className={`font-medium ${(listing.availableSqft ?? listing.sizeSqft ?? 100) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {listing.availableSqft ?? listing.sizeSqft ?? 100} sqft available
                          </span>
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-slate-900">${listing.pricePerMonth}</span>
                          <span className="text-slate-500"> / month (full space)</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No spaces available</h3>
                <p className="mt-1 text-slate-500">Try adjusting your dates or searching a different area.</p>
              </div>
            )}
          </section>
        )}
        {!shouldSearch && (
          <section className="pt-8">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              How Spacio Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Search</h3>
                <p className="mt-2 text-slate-600">Enter your location and dates to find available storage spaces near you.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Book Securely</h3>
                <p className="mt-2 text-slate-600">Reserve your space instantly with secure payment and optional insurance.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Store & Save</h3>
                <p className="mt-2 text-slate-600">Access your storage anytime. Save up to 50% compared to traditional units.</p>
              </div>
            </div>
          </section>
        )}

        {selected && (
          <ListingDetailModal
            listing={selected}
            onClose={() => setSelected(null)}
            searchDates={{ startDate: filters.startDate, endDate: filters.endDate }}
          />
        )}
      </div>
    </main>
  );
}

function ListingDetailModal({
  listing,
  onClose,
  searchDates,
}: {
  listing: Listing;
  onClose: () => void;
  searchDates?: { startDate?: string; endDate?: string };
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(searchDates?.startDate || "");
  const [endDate, setEndDate] = useState(searchDates?.endDate || "");
  const [addInsurance, setAddInsurance] = useState(false);
  

  const totalSqft = listing.sizeSqft || 100;
  const availableSqft = listing.availableSqft ?? totalSqft;
  const [sqftRequested, setSqftRequested] = useState(Math.min(50, availableSqft));
  
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      window.location.href = "https://buy.stripe.com/aFa28keNJ5NAaNg4T408g00";
    },
  });

  const insurancePrice = Number((sqftRequested * 0.15).toFixed(2));

  const costs = useMemo(() => {
    if (!startDate || !endDate || sqftRequested <= 0) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const spaceRatio = sqftRequested / totalSqft;
    const base = listing.pricePerMonth * spaceRatio * (diffDays / 30);
    const serviceFee = base * 0.20;
    const insurance = addInsurance ? insurancePrice : 0;
    const total = base + serviceFee + insurance;
    return {
      days: diffDays,
      sqft: sqftRequested,
      spaceRatio: Math.round(spaceRatio * 100),
      base: Number(base.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      insurance,
      total: Number(total.toFixed(2)),
    };
  }, [startDate, endDate, listing.pricePerMonth, addInsurance, insurancePrice, sqftRequested, totalSqft]);

  const isOwnListing = user && listing.hostId === user._id;

  const handleReserve = async () => {
    if (!user) {
      alert("Login first");
      return;
    }
    if (isOwnListing) {
      alert("You cannot rent your own listing");
      return;
    }
    if (sqftRequested > availableSqft) {
      alert(`Only ${availableSqft} sqft available`);
      return;
    }
    await mutateAsync({
      listingId: listing._id,
      startDate,
      endDate,
      sqftRequested,
      addInsurance,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-brand-600">
              {listing.sizeSqft ? `${listing.sizeSqft} sqft` : listing.size} • {listing.zipCode}
            </p>
            <h3 className="text-2xl font-semibold text-slate-900">
              {listing.title}
            </h3>
            <p className="text-sm text-slate-600">{listing.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              {listing.addressSummary}
            </p>
          </div>
          <button
            className="rounded-full p-2 hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Reserve</h4>
            <div className="mt-3 flex flex-col gap-2">
              {/* Space selector */}
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Space needed</span>
                  <span className="text-sm text-emerald-600 font-medium">{availableSqft} sqft available</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={availableSqft}
                    step={5}
                    value={sqftRequested}
                    onChange={(e) => setSqftRequested(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={availableSqft}
                      value={sqftRequested}
                      onChange={(e) => setSqftRequested(Math.min(availableSqft, Math.max(10, Number(e.target.value))))}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                    />
                    <span className="text-sm text-slate-500">sqft</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {Math.round((sqftRequested / totalSqft) * 100)}% of total space ({totalSqft} sqft)
                </p>
              </div>
              
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={listing.availableFrom ? listing.availableFrom.split('T')[0] : undefined}
                max={listing.availableTo ? listing.availableTo.split('T')[0] : undefined}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || (listing.availableFrom ? listing.availableFrom.split('T')[0] : undefined)}
                max={listing.availableTo ? listing.availableTo.split('T')[0] : undefined}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={addInsurance}
                  onChange={(e) => setAddInsurance(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    Add Insurance Protection
                  </span>
                  <p className="text-xs text-slate-500">
                    Coverage for damage or loss of stored items
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  +${insurancePrice}
                </span>
              </label>
              {costs && (
                <div className="text-sm text-slate-700">
                  <div className="flex justify-between text-slate-500">
                    <span>{costs.sqft} sqft × {costs.days} days ({costs.spaceRatio}% of space)</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Base price</span>
                    <span>${costs.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee (20%)</span>
                    <span>${costs.serviceFee}</span>
                  </div>
                  {costs.insurance > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Insurance</span>
                      <span>${costs.insurance}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between font-semibold border-t border-slate-200 pt-2">
                    <span>Total</span>
                    <span>${costs.total}</span>
                  </div>
                </div>
              )}
              {error && (
                <p className="text-sm text-red-600">
                  {(error as any)?.response?.data?.detail || "Error"}
                </p>
              )}
              {isOwnListing ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-amber-800">This is your listing</p>
                  <p className="text-xs text-amber-600 mt-1">You cannot rent your own space</p>
                </div>
              ) : (
                <button
                  disabled={!startDate || !endDate || isPending || sqftRequested <= 0 || sqftRequested > availableSqft}
                  onClick={handleReserve}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60 hover:bg-brand-500 transition-colors"
                >
                  {isPending ? "Reserving..." : "Reserve spot"}
                </button>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Details</h4>
            <p className="mt-2 text-sm text-slate-600">
              Rating: {listing.rating ?? "4.7"} • Availability:{" "}
              {listing.availability ? "Available" : "Unavailable"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Price: ${listing.pricePerMonth}/month (full space)
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Size: {listing.sizeSqft || 100} sq ft total
            </p>
            {listing.availableFrom && listing.availableTo && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Available:</span>{" "}
                {new Date(listing.availableFrom).toLocaleDateString()} - {new Date(listing.availableTo).toLocaleDateString()}
              </p>
            )}
            {listing.bookingDeadline ? (
              <p className="mt-2 text-sm text-amber-600">
                <span className="font-medium">⚠️ Book by:</span>{" "}
                {new Date(listing.bookingDeadline).toLocaleDateString()}
              </p>
            ) : (
              <p className="mt-2 text-sm text-emerald-600">
                ✓ No booking deadline
              </p>
            )}
            <img
              src={getListingImage(listing)}
              alt={listing.title}
              className="mt-3 h-32 w-full rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-900">Free cancellation until 72 hours before your reservation</p>
              <p className="text-xs text-slate-500 mt-1">
                Cancel before check-in for a full refund. After that, you'll be charged 50% of the reservation total to the host for no-shows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.email, form.password);
    navigate("/");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          required
          type="email"
          placeholder="Email"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          placeholder="Password"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

function RegisterPage() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    zipCode: "",
    isHost: false,
    phone: "",
    backgroundCheckAccepted: false,
  });

  const startVerification = useMutation({
    mutationFn: verificationApi.createVerificationSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form);
    
    if (form.isHost) {
      try {
        await startVerification.mutateAsync();
      } catch {
        navigate("/host");
      }
    } else {
      navigate("/");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Name"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          placeholder="Password"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <input
          required
          placeholder="ZIP code"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
        />
        <input
          placeholder="Phone (optional)"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isHost}
            onChange={(e) => setForm({ ...form, isHost: e.target.checked })}
          />
          I want to host spaces
        </label>
        {form.isHost && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium">🔐 Identity Verification Required</p>
            <p className="mt-1 text-blue-600">
              As a host, you'll be asked to verify your identity (ID + selfie) after registration to build trust with renters.
            </p>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {startVerification.error && (
          <p className="text-sm text-red-600">
            {(startVerification.error as any)?.response?.data?.detail || "Verification setup failed, but your account was created. You can verify later from the Host dashboard."}
          </p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60"
          disabled={loading || startVerification.isPending}
        >
          {loading ? "Creating account..." : startVerification.isPending ? "Starting verification..." : form.isHost ? "Register & Verify Identity" : "Register"}
        </button>
      </form>
    </div>
  );
}

function RequireAuth({ children, hostOnly = false }: { children: JSX.Element; hostOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hostOnly && !user.isHost) return <Navigate to="/" replace />;
  return children;
}

function CreateListingForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    size: "M" as StorageSize,
    sizeSqft: 100,
    pricePerMonth: 100,
    addressSummary: "",
    zipCode: "",
    availableFrom: "",
    availableTo: "",
    bookingDeadline: "",
  });
  const [indoor, setIndoor] = useState(true);
  const [noBookingDeadline, setNoBookingDeadline] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<{
    price: number;
    min: number;
    max: number;
    reason: string;
  } | null>(null);

  const pricing = useMutation({
    mutationFn: () =>
      pricingApi.suggestPrice({
        size:
          form.sizeSqft <= 60
            ? "S"
            : form.sizeSqft <= 150
              ? "M"
              : "L",
        zipCode: form.zipCode,
        indoor,
        title: form.title,
        description: form.description,
      }),
    onSuccess: (res) => {
      setSuggested({
        price: res.suggestedPrice,
        min: res.minPrice,
        max: res.maxPrice,
        reason: res.explanation,
      });
      setForm((prev) => ({ ...prev, pricePerMonth: res.suggestedPrice }));
    },
  });
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: any) => listingApi.createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      alert("Listing created");
      setForm({
        title: "",
        description: "",
        size: "M",
        sizeSqft: 100,
        pricePerMonth: 100,
        addressSummary: "",
        zipCode: "",
        availableFrom: "",
        availableTo: "",
        bookingDeadline: "",
      });
      setNoBookingDeadline(true);
      setFile(null);
      setPreview(null);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let images: string[] = [];
    if (file) {
    const uploaded = await listingApi.uploadImage(file);
      images = [uploaded.url];
    }
    await mutateAsync({
      ...form,
      sizeSqft: Number(form.sizeSqft),
      pricePerMonth: Number(form.pricePerMonth),
      bookingDeadline: noBookingDeadline ? null : form.bookingDeadline,
      images,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Create listing</h3>
      <form className="mt-3 grid gap-3" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Title"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          required
          placeholder="Description"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Size (sqft)
            <input
              type="number"
              required
              min={1}
              placeholder="e.g., 80"
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={form.sizeSqft}
              onChange={(e) =>
                setForm({ ...form, sizeSqft: Number(e.target.value) })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Price per month ($)
            <input
              type="number"
              required
              min={1}
              placeholder="e.g., 120"
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={form.pricePerMonth}
              onChange={(e) =>
                setForm({ ...form, pricePerMonth: Number(e.target.value) })
              }
            />
          </label>
        </div>
        {suggested && (
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="text-lg">🤖</span>
            <div>
              <div className="font-semibold">
                AI suggestion: ${suggested.price} (range ${suggested.min} – ${suggested.max})
              </div>
              <div className="text-slate-600">{suggested.reason}</div>
            </div>
          </div>
        )}
        <input
          required
          placeholder="ZIP code"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
        />
        <input
          required
          placeholder="Address summary"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.addressSummary}
          onChange={(e) =>
            setForm({ ...form, addressSummary: e.target.value })
          }
        />
        
        {/* Availability Period */}
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <p className="text-sm font-semibold text-slate-800 mb-2">
            Availability Period
          </p>
          <p className="text-xs text-slate-500 mb-3">
            When is this space available for renters?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Available from
              <input
                type="date"
                required
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Available until
              <input
                type="date"
                required
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.availableTo}
                onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Booking Deadline */}
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <p className="text-sm font-semibold text-slate-800 mb-2">
            Booking Deadline
          </p>
          <p className="text-xs text-slate-500 mb-3">
            By when must reservations be finalized? (e.g., if you're going on vacation)
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={noBookingDeadline}
              onChange={(e) => setNoBookingDeadline(e.target.checked)}
            />
            No deadline - renters can book anytime during availability
          </label>
          {!noBookingDeadline && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Reservations must be finalized by
              <input
                type="date"
                required={!noBookingDeadline}
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={form.bookingDeadline}
                onChange={(e) => setForm({ ...form, bookingDeadline: e.target.value })}
              />
            </label>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={indoor}
            onChange={(e) => setIndoor(e.target.checked)}
          />
          Indoor storage (adds premium in suggestion)
        </label>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Add photo (JPEG or PNG)
          </p>
          <label
            className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
            <span>Click or drag an image here</span>
          </label>
          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="h-28 w-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">
            {(error as any)?.response?.data?.detail || "Error creating listing"}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={() => pricing.mutate()}
            disabled={pricing.isPending || !form.zipCode || !form.sizeSqft}
          >
            {pricing.isPending ? "Getting AI price…" : "AI pricing"}
          </button>
          {pricing.isError && (
            <span className="text-sm text-red-600">
              Could not fetch AI price. Please try again.
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create listing"}
        </button>
      </form>
    </div>
  );
}

function ReservationList({ asHost }: { asHost: boolean }) {
  const queryClient = useQueryClient();
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: reservationApi.listReservations,
  });
  const approve = useMutation({
    mutationFn: (id: string) => reservationApi.approveReservation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
  const decline = useMutation({
    mutationFn: (id: string) => reservationApi.declineReservation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });

  if (isLoading) return <p className="text-slate-600">Loading reservations…</p>;
  if (!reservations.length)
    return <p className="text-slate-600">No reservations yet.</p>;

  return (
    <div className="grid gap-3">
      {reservations.map((r) => (
        <ReservationCard
          key={r._id}
          reservation={r}
          asHost={asHost}
          onApprove={() => approve.mutate(r._id)}
          onDecline={() => decline.mutate(r._id)}
        />
      ))}
    </div>
  );
}

function ReservationCard({
  reservation,
  asHost,
  onApprove,
  onDecline,
}: {
  reservation: Reservation;
  asHost: boolean;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [showMessages, setShowMessages] = useState(false);
  const { data: messages = [], refetch } = useQuery({
    queryKey: ["messages", reservation._id],
    queryFn: () => messageApi.listMessages(reservation._id),
    enabled: showMessages,
  });
  const send = useMutation({
    mutationFn: (content: string) =>
      messageApi.sendMessage({ reservationId: reservation._id, content }),
    onSuccess: () => refetch(),
  });
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => reservationApi.deleteReservation(reservation._id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-slate-500">{reservation._id}</p>
          <p className="text-sm text-slate-600">
            {reservation.startDate} → {reservation.endDate}
          </p>
          <p className="text-sm text-slate-600">
            Status: {reservation.status}
          </p>
          <p className="text-sm text-slate-600">
            Total ${reservation.totalPrice} (fee ${reservation.serviceFee}
            {reservation.insurance > 0 && ` + insurance $${reservation.insurance}`})
          </p>
        </div>
        {asHost && reservation.status === "pending_host_confirmation" && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-white"
            >
              Approve
            </button>
            <button
              onClick={onDecline}
              className="rounded-lg bg-red-600 px-3 py-1 text-white"
            >
              Decline
            </button>
          </div>
        )}
        {!asHost && (
          <button
            className="text-sm text-red-600 underline"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Cancelling..." : "Cancel reservation"}
          </button>
        )}
        <button
          className="text-sm text-brand-600 underline"
          onClick={() => setShowMessages((s) => !s)}
        >
          {showMessages ? "Hide messages" : "Messages"}
        </button>
      </div>
      {showMessages && (
        <div className="mt-3 rounded-lg border border-slate-200 p-3">
          {!messages.length && (
            <p className="text-sm text-slate-500">No messages yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {messages.map((m: Message) => {
              const isFromHost = m.senderId !== reservation.renterId;
              return (
                <div key={m._id} className={`rounded-lg p-3 text-sm ${isFromHost ? "bg-purple-50 border border-purple-100" : "bg-blue-50 border border-blue-100"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isFromHost ? "text-purple-600" : "text-blue-600"}`}>
                      {isFromHost ? "Host (You)" : "Renter"}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700">{m.content}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  send.mutateAsync(message.trim());
                  setMessage("");
                }
              }}
              placeholder="Type a message"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
            />
            <button
              className="rounded-lg bg-brand-600 px-3 py-2 text-white"
              onClick={async () => {
                if (!message.trim()) return;
                await send.mutateAsync(message.trim());
                setMessage("");
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationCard() {
  const { user } = useAuth();
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["verification-status"],
    queryFn: verificationApi.getVerificationStatus,
    refetchInterval: 5000, // Poll every 5 seconds while pending
  });

  const createSession = useMutation({
    mutationFn: verificationApi.createVerificationSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const isVerified = status?.verified || user?.verificationStatus === "verified";
  const isPending = status?.status === "pending" || status?.status === "processing";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Identity Verification
          </h3>
          <p className="text-sm text-slate-600">
            Verify your ID to build trust with renters.
          </p>
        </div>
        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Checking status...</p>
      ) : isVerified ? (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3">
          <p className="text-sm text-emerald-700">
            ✓ Your identity has been verified. Renters will see a "Verified Host" badge on your listings.
          </p>
        </div>
      ) : isPending ? (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="text-sm text-amber-700">
            ⏳ Verification in progress. This usually takes a few minutes.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-amber-700 underline"
          >
            Check status
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-3">
            Complete a quick ID verification (driver's license, passport, or ID card) with a selfie match.
          </p>
          <button
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:opacity-60"
          >
            {createSession.isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Starting verification...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify My Identity
              </>
            )}
          </button>
          {createSession.error && (
            <p className="mt-2 text-sm text-red-600">
              {(createSession.error as any)?.response?.data?.detail || "Failed to start verification"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function HostDashboard() {
  const { data: myListings = [], isLoading: loadingMy } = useQuery({
    queryKey: ["my-listings"],
    queryFn: listingApi.fetchMyListings,
  });
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  const updateListing = useMutation({
    mutationFn: (vars: { id: string; payload: any }) =>
      listingApi.updateListing(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setEditingId(null);
      setEditFile(null);
      setEditPreview(null);
    },
  });

  const deleteListing = useMutation({
    mutationFn: (id: string) => listingApi.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Host workspace</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <VerificationCard />
          <CreateListingForm />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Reservations
          </h3>
          <p className="text-sm text-slate-600">
            Approve or decline pending requests.
          </p>
          <div className="mt-3">
            <ReservationList asHost />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  My listings
                </h3>
                <p className="text-sm text-slate-600">
                  All listings you host.
                </p>
              </div>
              <span className="text-sm text-slate-500">
                {myListings.length} total
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loadingMy ? (
                <p className="text-slate-600">Loading…</p>
              ) : myListings.length ? (
                myListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="uppercase tracking-wide text-brand-600">
                        {listing.size} • {listing.zipCode}
                      </span>
                      <span className="text-amber-600">
                        ★ {listing.rating ?? "4.7"}
                      </span>
                    </div>
                    <h4 className="mt-1 text-base font-semibold text-slate-900">
                      {listing.title}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {listing.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      ${listing.pricePerMonth}/mo •{" "}
                      {listing.availability ? "Available" : "Unavailable"}
                    </p>
                    <div className="mt-3 flex justify-between text-sm text-slate-600">
                      <span>{listing.addressSummary}</span>
                      <span className="text-slate-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {listing.sizeSqft ? `${listing.sizeSqft} sqft` : listing.size}
                    </p>
                    {editingId === listing._id ? (
                      <div className="mt-3 space-y-2">
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue={listing.title}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, title: e.target.value }))
                          }
                        />
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue={listing.pricePerMonth}
                          type="number"
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              pricePerMonth: Number(e.target.value),
                            }))
                          }
                        />
                        <select
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue={listing.size}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, size: e.target.value }))
                          }
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                        </select>
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold text-slate-800">
                            Replace photo (optional)
                          </p>
                          <label
                            className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const f = e.dataTransfer.files?.[0];
                              if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
                                setEditFile(f);
                                setEditPreview(URL.createObjectURL(f));
                              }
                            }}
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
                                  setEditFile(f);
                                  setEditPreview(URL.createObjectURL(f));
                                }
                              }}
                            />
                            <span>Click or drag an image here</span>
                          </label>
                          {editPreview || listing.images?.[0] ? (
                            <div className="mt-2">
                              <img
                                src={editPreview || listing.images?.[0]}
                                alt="Preview"
                                className="h-20 w-full rounded-lg object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                            onClick={async () => {
                              let payload = { ...editForm };
                              if (editFile) {
                                const uploaded = await listingApi.uploadImage(editFile);
                                payload = { ...payload, images: [uploaded.url] };
                              }
                              updateListing.mutate({
                                id: listing._id,
                                payload,
                              });
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({});
                              setEditFile(null);
                              setEditPreview(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        {updateListing.error && (
                          <p className="text-sm text-red-600">
                            Error saving changes
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                          onClick={() => {
                            setEditingId(listing._id);
                            setEditForm({});
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                          onClick={() => deleteListing.mutate(listing._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-600">
                  You have no listings yet. Create one to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "reservations">("profile");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "reservations") {
      setActiveTab("reservations");
    }
    if (params.get("verified")) {
      refreshUser();
      window.history.replaceState({}, "", "/profile");
    }
  }, [refreshUser]);

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: reservationApi.listReservations,
  });

  const myReservations = reservations.filter(
    (r) => r.renterId === user?._id
  );

  const becomeHostMutation = useMutation({
    mutationFn: async () => {
      const response = await verificationApi.createVerificationSession();
      return response;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const activeReservations = myReservations.filter(
    (r) => r.status === "confirmed" || r.status === "pending_host_confirmation"
  );
  const pastReservations = myReservations.filter(
    (r) => r.status === "declined" || r.status === "expired"
  );

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500">{user.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {user.isHost && user.verificationStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Host
                  </span>
                ) : user.isHost && user.verificationStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verification Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Renter
                  </span>
                )}
              </div>
            </div>
            
            {/* Become a Host / Go to Dashboard */}
            <div className="flex-shrink-0">
              {user.isHost && user.verificationStatus === "verified" ? (
                <button
                  onClick={() => navigate("/host")}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-500 transition-colors"
                >
                  Host Dashboard
                </button>
              ) : !user.isHost ? (
                <button
                  onClick={() => becomeHostMutation.mutate()}
                  disabled={becomeHostMutation.isPending}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:from-brand-500 hover:to-brand-400 transition-all disabled:opacity-50"
                >
                  {becomeHostMutation.isPending ? "Starting..." : "Become a Host"}
                </button>
              ) : user.verificationStatus === "pending" ? (
                <span className="text-sm text-slate-500">Verification in progress</span>
              ) : (
                <button
                  onClick={() => becomeHostMutation.mutate()}
                  disabled={becomeHostMutation.isPending}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-500 transition-colors disabled:opacity-50"
                >
                  {becomeHostMutation.isPending ? "Starting..." : "Complete Verification"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "reservations"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            My Reservations
            {activeReservations.length > 0 && (
              <span className="ml-2 bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
                {activeReservations.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                <p className="text-slate-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
                <p className="text-slate-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Account Type</label>
                <p className="text-slate-900">{user.isHost ? "Host & Renter" : "Renter"}</p>
              </div>
              {user.isHost && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Verification Status</label>
                  <p className="text-slate-900 capitalize">{user.verificationStatus || "Not verified"}</p>
                </div>
              )}
            </div>

            {/* Become a Host CTA */}
            {!user.isHost && (
              <div className="mt-8 p-6 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl border border-brand-100">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Want to earn money with your extra space?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Become a verified host and list your garage, closet, or spare room. Earn up to $500/month!
                    </p>
                    <button
                      onClick={() => becomeHostMutation.mutate()}
                      disabled={becomeHostMutation.isPending}
                      className="mt-4 bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-500 transition-colors disabled:opacity-50"
                    >
                      {becomeHostMutation.isPending ? "Starting verification..." : "Become a Host"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="space-y-6">
            {/* Active Reservations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Active Reservations
                {activeReservations.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({activeReservations.length})
                  </span>
                )}
              </h2>
              
              {loadingReservations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              ) : activeReservations.length > 0 ? (
                <div className="space-y-4">
                  {activeReservations.map((reservation) => (
                    <ProfileReservationCard key={reservation._id} reservation={reservation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-500">No active reservations</p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 text-brand-600 font-medium hover:text-brand-500"
                  >
                    Find storage space →
                  </button>
                </div>
              )}
            </div>

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Past Reservations
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({pastReservations.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {pastReservations.map((reservation) => (
                    <ProfileReservationCard key={reservation._id} reservation={reservation} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileReservationCard({ reservation }: { reservation: Reservation }) {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: listing } = useQuery({
    queryKey: ["listing", reservation.listingId],
    queryFn: () => listingApi.fetchListing(reservation.listingId),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", reservation._id],
    queryFn: () => messageApi.listMessages(reservation._id),
    enabled: showChat,
    refetchInterval: showChat ? 3000 : false, // Poll for new messages when chat is open
  });

  const sendMsg = useMutation({
    mutationFn: (content: string) =>
      messageApi.sendMessage({ reservationId: reservation._id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", reservation._id] });
    },
  });

  const statusConfig = {
    pending_host_confirmation: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending Approval" },
    confirmed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Confirmed" },
    declined: { bg: "bg-red-100", text: "text-red-700", label: "Declined" },
    expired: { bg: "bg-slate-100", text: "text-slate-600", label: "Expired" },
  };

  const status = statusConfig[reservation.status];

  const isHostMessage = (msg: Message) => {
    return msg.senderId !== reservation.renterId;
  };

  return (
    <>
      <div 
        className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer"
        onClick={() => setShowChat(true)}
      >
        <img
          src={getListingImage(listing)}
          alt={listing?.title || "Storage space"}
          className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{listing?.title || "Loading..."}</h3>
              <p className="text-sm text-slate-500">{listing?.addressSummary}</p>
            </div>
            <span className={`${status.bg} ${status.text} px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0`}>
              {status.label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-slate-600">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {reservation.insurance > 0 && (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Insured
                </span>
              )}
              <span className="font-bold text-slate-900">${reservation.totalPrice}</span>
            </div>
            <div className="flex items-center gap-1 text-brand-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">Chat with Host</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-900">{listing?.title || "Reservation"}</h3>
                <p className="text-sm text-slate-500">Chat with your host</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg: Message) => {
                  const fromHost = isHostMessage(msg);
                  const isMe = msg.senderId === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className={`text-xs font-semibold mb-1 ${fromHost ? "text-purple-600" : "text-brand-600"}`}>
                        {fromHost ? "Host" : "You"}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                          isMe
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <span className="text-xs text-slate-400 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && message.trim()) {
                      sendMsg.mutate(message.trim());
                      setMessage("");
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (message.trim()) {
                      sendMsg.mutate(message.trim());
                      setMessage("");
                    }
                  }}
                  disabled={!message.trim() || sendMsg.isPending}
                  className="rounded-full bg-brand-600 px-4 py-2 text-white hover:bg-brand-500 disabled:opacity-50 transition-colors"
                >
                  {sendMsg.isPending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AiMatchPage() {
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const { data, mutateAsync, isPending, error } = useMutation({
    mutationFn: () => matchingApi.recommend({ query, zipCode: zip || undefined }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">AI Match</h1>
      <p className="text-sm text-slate-600">
        Describe what you need to store, and we’ll recommend spaces for you.
      </p>
      <div className="mt-4 grid gap-3">
        <textarea
          className="rounded-lg border border-slate-200 px-3 py-2"
          rows={4}
          placeholder="e.g., I have 6 medium boxes and a bike"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-200 px-3 py-2"
          placeholder="ZIP code (optional)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <button
          onClick={() => mutateAsync()}
          disabled={!query || isPending}
          className="inline-flex w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {isPending ? "Finding matches..." : "Find Matches with AI"}
        </button>
        {error && (
          <p className="text-sm text-red-600">
            Could not fetch matches. Please try again.
          </p>
        )}
        {data && (
          <div className="mt-2 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="font-semibold">Why these matches?</div>
              <div className="text-slate-600">{data.explanation}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.listings.map((listing) => (
                <div
                  key={listing._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="h-32 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${getListingImage(listing)})` }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="uppercase tracking-wide text-brand-600">
                        {listing.sizeSqft ? `${listing.sizeSqft} sqft` : listing.size} •{" "}
                        {listing.zipCode}
                      </span>
                      <span className="text-amber-600">
                        ★ {listing.rating ?? "4.7"}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {listing.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {listing.addressSummary}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">
                        ${listing.pricePerMonth}/mo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RenterDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Renter dashboard
      </h1>
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            My reservations
          </h3>
          <ReservationList asHost={false} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            AI Match
          </h3>
          <p className="text-sm text-slate-600">
            Describe what you need to store and get suggested spaces.
          </p>
          <Link
            to="/ai-match"
            className="mt-3 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Try AI Matching
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/host"
          element={
            <RequireAuth hostOnly>
              <HostDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/renter"
          element={
            <RequireAuth>
              <RenterDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/ai-match"
          element={
            <RequireAuth>
              <AiMatchPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}


