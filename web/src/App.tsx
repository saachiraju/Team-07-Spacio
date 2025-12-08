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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-600">
              Community-powered storage
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Find storage near you
            </h1>
            <p className="text-slate-600">
              Nearby garages, closets, and spare rooms—cheaper than traditional
              storage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="ZIP"
              value={filters.zipCode || ""}
              onChange={(e) => handleFilterChange("zipCode", e.target.value)}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2"
            />
            <select
              value={filters.size || ""}
              onChange={(e) =>
                handleFilterChange("size", e.target.value as StorageSize)
              }
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Any size</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
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
            <button
              className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm"
              onClick={() => refetch()}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Nearby spaces</h2>
          <p className="text-sm text-slate-500">
            Sorted by proximity and rating
          </p>
        </div>
        {isLoading ? (
          <p className="text-slate-600">Loading listings…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <div
                key={listing._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-brand-600">
                    {listing.size} • {listing.zipCode}
                  </p>
                  <span className="text-xs text-amber-600">
                    ★ {listing.rating ?? "4.7"}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {listing.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {listing.description}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {listing.addressSummary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    ${listing.pricePerMonth}/mo
                  </span>
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-brand-600"
                    onClick={() => setSelected(listing)}
                  >
                    View
                  </button>
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
              {listing.size} • {listing.zipCode}
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
    pricePerMonth: 100,
    addressSummary: "",
    zipCode: "",
    images: "",
  });
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (payload: any) => listingApi.createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      alert("Listing created");
      setForm({
        title: "",
        description: "",
        size: "M",
        pricePerMonth: 100,
        addressSummary: "",
        zipCode: "",
        images: "",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const images = form.images
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await mutateAsync({ ...form, images, pricePerMonth: Number(form.pricePerMonth) });
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
          <select
            value={form.size}
            onChange={(e) =>
              setForm({ ...form, size: e.target.value as StorageSize })
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="number"
            required
            placeholder="Price per month"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={form.pricePerMonth}
            onChange={(e) =>
              setForm({ ...form, pricePerMonth: Number(e.target.value) })
            }
          />
        </div>
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
        <input
          placeholder="Image URLs (comma-separated)"
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
        />
        {error && (
          <p className="text-sm text-red-600">
            {(error as any)?.response?.data?.detail || "Error creating listing"}
          </p>
        )}
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
      </Routes>
    </div>
  );
}

