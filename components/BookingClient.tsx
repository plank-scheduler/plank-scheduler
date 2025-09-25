import React, { useEffect, useState } from "react";

type Customer = {
  id: number;
  customer_number: string;
  customer_name: string;
  city?: string;
  state?: string;
  primary_phone?: string;
  primary_email?: string;
};

function isWeekend(iso: string) {
  const day = new Date(`${iso}T00:00:00`).getDay(); // 0..6
  return day === 0 || day === 6;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function BookingClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [date, setDate] = useState<string>(todayISO);
  const [slots, setSlots] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New fields
  const [service, setService] = useState<string>("General");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoadingCustomers(true);
        const res = await fetch("/api/customers?limit=10");
        const json = await res.json();
        setCustomers(json.data || []);
      } catch {
        setError("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  async function checkAvailability() {
    try {
      setChecking(true);
      setError(null);
      if (isWeekend(date)) {
        setSlots([]);
        setError("Closed on weekends");
        return;
      }
      const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
      const json = await res.json();
      setSlots(json.slots || []);
    } catch {
      setError("Could not load availability");
    } finally {
      setChecking(false);
    }
  }

  async function book(time: string) {
    if (!customerId) { setError("Pick a customer first"); return; }
    try {
      setBooking(true);
      setError(null);
      setResult(null);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, date, time, service, notes })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setResult(`✅ Booked #${json.id} for ${date} at ${time}`);
    } catch (e: any) {
      setError(e.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Plank Scheduler — Booking</h1>

      {error ? <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div> : null}
      {result ? <div style={{ color: "green", marginBottom: 8 }}>{result}</div> : null}

      <section style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Customer</div>
          {loadingCustomers ? (
            <div>Loading customers…</div>
          ) : (
            <select
              value={customerId as any}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
              style={{ padding: 8, width: "100%" }}
            >
              <option value="">Select customer…</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} — {c.customer_number}
                </option>
              ))}
            </select>
          )}
        </label>

        <label>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Date</div>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8 }}
          />
        </label>

        {/* New: service */}
        <label>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Service</div>
          <select value={service} onChange={(e) => setService(e.target.value)} style={{ padding: 8 }}>
            <option>General</option>
            <option>Initial Service</option>
            <option>Quarterly</option>
            <option>Termite Inspection</option>
          </select>
        </label>

        {/* New: notes */}
        <label>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gate code, pet info, special instructions…"
            rows={3}
            style={{ padding: 8, width: "100%" }}
          />
        </label>

        <button onClick={checkAvailability} disabled={checking} style={{ padding: "8px 12px" }}>
          {checking ? "Checking…" : "Check availability"}
        </button>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Available times</h2>
        {slots.length === 0 ? (
          <div>No slots (try a weekday)</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {slots.map(t => (
              <button
                key={t}
                onClick={() => book(t)}
                disabled={booking}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
              >
                {booking ? "Booking…" : t}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
