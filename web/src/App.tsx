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

const sizes: StorageSize[] = ["S", "M", "L"];

function Nav() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-semibold text-brand-600">
          Spacio
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link to="/host">Host</Link>
          <Link to="/renter">Renter</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user && (
            <button
              className="rounded-md border border-slate-200 px-3 py-1 text-slate-700"
              onClick={logout}
            >
              Logout
            </button>
          )}
          {user && (
            <span className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-600">
              {user.name} {user.isHost ? "• Host" : "• Renter"}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}

function Landing() {
  const [filters, setFilters] = useState<{
    zipCode?: string;
    priceMin?: number;
    priceMax?: number;
    size?: StorageSize;
  }>({});
  const [selected, setSelected] = useState<Listing | null>(null);
  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => listingApi.fetchListings(filters),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-4">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/70 to-slate-900/30" />
          <div className="relative z-10 grid gap-6 px-6 py-12 md:grid-cols-2 md:px-10 lg:px-14">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                Community-powered storage
              </span>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                Parking & storage, made friendly.
              </h1>
              <p className="text-lg text-slate-100/90">
                Save on nearby garages, closets, and spare rooms. Book in
                minutes. Cancel any month.
              </p>
              <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <label className="text-sm font-medium text-white/90">
                  Find storage near you
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    placeholder="Enter ZIP"
                    value={filters.zipCode || ""}
                    onChange={(e) => handleFilterChange("zipCode", e.target.value)}
                    className="w-full rounded-xl border border-white/30 bg-white/90 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-white focus:ring-2 focus:ring-white/60"
                  />
                  <button
                    className="w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-brand-500 sm:w-auto"
                    onClick={() => refetch()}
                  >
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/80">
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    Save up to 50%
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    No long-term lock-in
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    Verified hosts
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">
                How it works
              </h3>
              <div className="mt-4 space-y-4 text-white/90">
                <div className="flex gap-3">
                  <div className="mt-1 h-8 w-8 rounded-full bg-white/20 text-center text-sm font-semibold leading-8">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Find a great spot</p>
                    <p className="text-sm text-white/80">
                      Search where you need storage—on your schedule.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-8 w-8 rounded-full bg-white/20 text-center text-sm font-semibold leading-8">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Book in minutes</p>
                    <p className="text-sm text-white/80">
                      Compare options, reserve instantly, chat with hosts.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-8 w-8 rounded-full bg-white/20 text-center text-sm font-semibold leading-8">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Enjoy savings</p>
                    <p className="text-sm text-white/80">
                      Cheaper than traditional storage; cancel any month.
                    </p>
                  </div>
                </div>
                <button
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                  onClick={() => setSelected(listings[0] || null)}
                >
                  Explore nearby spaces
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Nearby spaces
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <select
                value={filters.size || ""}
                onChange={(e) =>
                  handleFilterChange("size", e.target.value as StorageSize)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="">Any size</option>
                <option value="S">S • Small</option>
                <option value="M">M • Medium</option>
                <option value="L">L • Large</option>
              </select>
              <input
                type="number"
                placeholder="Min $"
                value={filters.priceMin ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    priceMin: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-24 rounded-lg border border-slate-200 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Max $"
                value={filters.priceMax ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    priceMax: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-24 rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
          </div>
          {isLoading ? (
            <p className="text-slate-600">Loading listings…</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {listing.images?.length ? (
                    <div
                      className="h-40 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${listing.images[0]})` }}
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-slate-200 to-slate-100" />
                  )}
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
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">
                        ${listing.pricePerMonth}/mo
                      </span>
                      <button
                        className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
                        onClick={() => setSelected(listing)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!listings.length && (
                <p className="text-slate-600">
                  No listings yet—add one from the host dashboard.
                </p>
              )}
            </div>
          )}
        </section>

        {selected && (
          <ListingDetailModal
            listing={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </main>
  );
}

function ListingDetailModal({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      alert("Reservation requested!");
      onClose();
    },
  });

  const costs = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const base = listing.pricePerMonth * (diffDays / 30);
    const serviceFee = base * 0.1;
    const deposit = 50;
    const total = base + serviceFee + deposit;
    return {
      days: diffDays,
      base: Number(base.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      deposit,
      total: Number(total.toFixed(2)),
    };
  }, [startDate, endDate, listing.pricePerMonth]);

  const handleReserve = async () => {
    if (!user) {
      alert("Login first");
      return;
    }
    await mutateAsync({
      listingId: listing._id,
      startDate,
      endDate,
    });
  };

  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
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
            className="rounded-md px-2 py-1 text-sm text-slate-500"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Reserve</h4>
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
              {costs && (
                <div className="text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Base ({costs.days} days)</span>
                    <span>${costs.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee (10%)</span>
                    <span>${costs.serviceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deposit</span>
                    <span>${costs.deposit}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-semibold">
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
              <button
                disabled={!startDate || !endDate || isPending}
                onClick={handleReserve}
                className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60"
              >
                {isPending ? "Reserving..." : "Reserve spot"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Details</h4>
            <p className="mt-2 text-sm text-slate-600">
              Rating: {listing.rating ?? "4.7"} • Availability:{" "}
              {listing.availability ? "Available" : "Unavailable"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Price: ${listing.pricePerMonth}/month
            </p>
            {listing.images?.length ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="mt-3 h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mt-3 h-32 w-full rounded-lg bg-slate-100" />
            )}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form);
    navigate("/");
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
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.backgroundCheckAccepted}
            onChange={(e) =>
              setForm({ ...form, backgroundCheckAccepted: e.target.checked })
            }
          />
          Mock background check accepted
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating..." : "Register"}
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
  });
  const [indoor, setIndoor] = useState(true);
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
        pricePerMonth: 100,
        addressSummary: "",
        zipCode: "",
      });
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
      pricePerMonth: Number(form.pricePerMonth),
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
            Total ${reservation.totalPrice} (fee ${reservation.serviceFee} +
            deposit ${reservation.deposit})
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
          <div className="flex flex-col gap-2">
            {messages.map((m: Message) => (
              <div key={m._id} className="rounded-md bg-slate-50 p-2 text-sm">
                <p className="text-xs text-slate-500">{m.createdAt}</p>
                <p className="text-slate-700">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
        <CreateListingForm />
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
                  {listing.images?.length ? (
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${listing.images[0]})` }}
                    />
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-slate-200 to-slate-100" />
                  )}
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

