// components/BookingClient.tsx
import React, { useEffect, useMemo, useState } from "react";
import { BRAND, GREETING, PLAN_OPTIONS, SERVICE_OPTIONS } from "../lib/config";

type Customer = { id: number; name: string; code: string };
type CustomersResp =
  | { ok: true; data: Customer[] }
  | { ok: false; error: string };

type AvailabilityResp =
  | { ok: true; data: string[] } // times (HH:mm)
  | { ok: false; error: string };

type PostResp =
  | {
      ok: true;
      id: string;
      customerId: number;
      date: string;
      time: string;
      service?: string;
      plan?: string;
      notes?: string;
      createdAt: string;
    }
  | { ok: false; error: string };

const fmtDate = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);

export default function BookingClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [date, setDate] = useState<string>(fmtDate(new Date()));
  const [plan, setPlan] = useState<string>(PLAN_OPTIONS[0].value);
  const [service, setService] = useState<string>(SERVICE_OPTIONS[0].value);
  const [notes, setNotes] = useState<string>("");

  const [times, setTimes] = useState<string[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Load customers (mock API in project)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/customers?limit=10");
      const j = (await r.json()) as CustomersResp;
      if ("ok" in j && j.ok) {
        setCustomers(j.data);
        if (j.data.length && customerId === "") {
          setCustomerId(j.data[0].id);
        }
      }
    })();
  }, []);

  async function checkAvailability() {
    setTimes([]);
    setMessage("");
    setLoadingAvail(true);
    try {
      const r = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
      const j = (await r.json()) as AvailabilityResp;
      if (!("ok" in j) || !j.ok) throw new Error("Failed to load availability");
      setTimes(j.data);
    } catch (e: any) {
      setMessage(`Availability error: ${String(e?.message || e)}`);
    } finally {
      setLoadingAvail(false);
    }
  }

  async function book(time: string) {
    setMessage("");
    try {
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          date,
          time,
          plan,
          service,
          notes,
        }),
      });
      const j = (await r.json()) as PostResp;
      if (!("ok" in j) || !j.ok) throw new Error((j as any).error || "Booking failed");
      setMessage(
        `Booked #${j.id} for ${j.date} at ${j.time}${
          j.plan ? ` — ${j.plan}` : ""
        }${j.service ? ` — ${j.service}` : ""}`
      );
    } catch (e: any) {
      setMessage(`Error: ${String(e?.message || e)}`);
    }
  }

  const CustomerSelect = useMemo(() => {
    return (
      <select
        value={customerId}
        onChange={(e) => setCustomerId(Number(e.target.value))}
        style={{ width: "100%", padding: 8 }}
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.code}
          </option>
        ))}
      </select>
    );
  }, [customers, customerId]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: "0 0 8px" }}>{BRAND} — Booking</h1>
      <p style={{ margin: "0 0 24px" }}>{GREETING}</p>

      {message ? (
        <div style={{ color: "green", marginBottom: 12 }}>✅ {message}</div>
      ) : null}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Customer
        </label>
        {CustomerSelect}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={{ width: 280, padding: 8 }}
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Service
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ width: 320, padding: 8 }}
        >
          {SERVICE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, pet info, special instructions…"
          rows={3}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <button
        onClick={checkAvailability}
        disabled={loadingAvail}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: "pointer",
        }}
      >
        {loadingAvail ? "Loading…" : "Check availability"}
      </button>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ margin: "12px 0" }}>Available times</h3>
        {times.length === 0 ? (
          <div>No open times for {new Date(date).toLocaleDateString()}.</div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {times.map((t) => (
              <button
                key={t}
                onClick={() => book(t)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, fontSize: 12, color: "#666" }}>
        Serving South Central Missouri • {BRAND}
      </div>
    </div>
  );
}


