// components/BookingClient.tsx

import React, { useEffect, useMemo, useState } from "react";
import { BRAND, GREETING, PLANS, SERVICES } from "../lib/config";

type Customer = { id: number; name: string; account?: string };
type Availability = { time: string }[];

type Booked = {
  id: string;
  customerId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  service?: string;
  notes?: string;
  createdAt: string;
};

function fmtDate(d: string) {
  try {
    const [y, m, dd] = d.split("-").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, dd).toLocaleDateString();
  } catch {
    return d;
  }
}

function todayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookingClient() {
  // UI state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [planId, setPlanId] = useState<string>("initial");
  const [serviceId, setServiceId] = useState<string>("general");
  const [notes, setNotes] = useState<string>("");
  const [availability, setAvailability] = useState<Availability>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Fetch customers once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customers?limit=50");
        const j = await res.json();
        const list: Customer[] = j?.data || [];
        setCustomers(list);
        if (list.length && customerId == null) setCustomerId(list[0].id);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Availability on date change
  useEffect(() => {
    (async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
        const j = await res.json();
        setAvailability(j?.data || []);
      } catch (e) {
        console.error(e);
        setAvailability([]);
      } finally {
        setBusy(false);
      }
    })();
  }, [date]);

  const planLabel = useMemo(
    () => PLANS.find((p) => p.id === planId)?.label ?? "",
    [planId]
  );

  const serviceLabel = useMemo(
    () => SERVICES.find((s) => s.id === serviceId)?.label ?? "",
    [serviceId]
  );

  async function book(time: string) {
    if (!customerId) {
      setMessage("Please select a customer.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      // We do NOT change the API shape; include the Plan in notes for now.
      const mergedNotes = planLabel
        ? `[Plan: ${planLabel}] ${notes}`.trim()
        : notes.trim();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          date,
          time,
          service: serviceLabel || undefined,
          notes: mergedNotes || undefined,
        }),
      });

      const j = await res.json();
      if (!res.ok || !j?.ok) {
        const err = j?.error || `Unable to book ${time}.`;
        setMessage(err);
        return;
      }

      setMessage(
        `Booked ${j?.id ? `#${j.id}` : "appointment"} for ${fmtDate(date)} at ${time}.`
      );

      // Refresh availability after booking (slot becomes unavailable)
      const av = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
      const aj = await av.json();
      setAvailability(aj?.data || []);
    } catch (e: any) {
      console.error(e);
      setMessage(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Top header + greeting (title will be set by the page) */}
      <p style={{ marginTop: 10, color: "#222" }}>{GREETING}</p>

      {/* Inline “last action” message */}
      {message ? (
        <div
          style={{
            margin: "10px 0 20px",
            padding: "8px 10px",
            background: message.startsWith("Booked") ? "#efffee" : "#fff6f6",
            border: "1px solid #ddd",
          }}
        >
          {message}
        </div>
      ) : null}

      <h2 style={{ marginTop: 20 }}>Plank Scheduler — Booking</h2>

      {/* Customer */}
      <label style={{ display: "block", marginTop: 15, fontWeight: 600 }}>
        Customer
      </label>
      <select
        value={customerId ?? ""}
        onChange={(e) => setCustomerId(Number(e.target.value))}
        style={{ width: "100%", padding: 8 }}
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.account ? ` — ${c.account}` : ""}
          </option>
        ))}
      </select>

      {/* Date */}
      <label style={{ display: "block", marginTop: 15, fontWeight: 600 }}>
        Date
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ width: 200, padding: 8 }}
      />

      {/* Plan */}
      <label style={{ display: "block", marginTop: 15, fontWeight: 600 }}>
        Plan
      </label>
      <select
        value={planId}
        onChange={(e) => setPlanId(e.target.value)}
        style={{ width: 260, padding: 8 }}
      >
        {PLANS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Service */}
      <label style={{ display: "block", marginTop: 15, fontWeight: 600 }}>
        Service
      </label>
      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        style={{ width: 360, padding: 8 }}
      >
        {SERVICES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Notes */}
      <label style={{ display: "block", marginTop: 15, fontWeight: 600 }}>
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Gate code, pet info, special instructions…"
        rows={4}
        style={{ width: "100%", padding: 8 }}
      />

      {/* Availability */}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await fetch(
              `/api/availability?date=${encodeURIComponent(date)}`
            );
            const j = await res.json();
            setAvailability(j?.data || []);
          } finally {
            setBusy(false);
          }
        }}
        style={{
          display: "block",
          width: "100%",
          margin: "16px 0 12px",
          padding: "10px 12px",
        }}
      >
        Check availability
      </button>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Available times</div>
        {availability?.length ? (
          availability.map((slot) => (
            <button
              key={slot.time}
              disabled={busy}
              onClick={() => book(slot.time)}
              style={{ marginRight: 8, padding: "6px 12px" }}
              title={`Book ${fmtDate(date)} at ${slot.time}`}
            >
              {slot.time}
            </button>
          ))
        ) : (
          <div>No open times for {fmtDate(date)}.</div>
        )}
      </div>

      <div style={{ marginTop: 36, color: "#666", fontSize: 13 }}>
        Serving South Central Missouri • {BRAND}
      </div>
    </div>
  );
}

