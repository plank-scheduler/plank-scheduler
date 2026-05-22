console.log("TEST COMPONENT LOADED");

import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "./SiteHeader";
import {
  GREETING,
  PLAN_OPTIONS,
  SERVICE_GROUPS,
  BOOKING_MODE,
} from "../lib/config";

type Customer = {
  id: number;
  name: string;
  code?: string;
  phone?: string;
  address?: string;
};

type CustomersResp =
  | { ok: true; data: Customer[] }
  | { ok: false; error: string };

type UploadResp = { ok: true; url: string } | { ok: false; error: string };

type PostResp =
  | {
      ok: true;
      id: string;
      date: string;
      time: string;
      plan?: string;
      service?: string;
      insulationService?: string;
      lawnCare?: string;
      holidayLighting?: string;
      notes?: string;
      photoUrls?: string[];
      createdAt?: string;
    }
  | { ok: false; error: string };

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour24 = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
});

function getLocalISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isPastDate(iso: string) {
  try {
    return iso < getLocalISODate();
  } catch {
    return false;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export default function BookingClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");

  const [publicName, setPublicName] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [publicCity, setPublicCity] = useState("");
  const [publicState, setPublicState] = useState("");
  const [publicZip, setPublicZip] = useState("");
  const [publicEmail, setPublicEmail] = useState("");

  const [date, setDate] = useState<string>(getLocalISODate());
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [plan, setPlan] = useState<string>("");

  const [service, setService] = useState<string>("");
  const [insulationService, setInsulationService] = useState<string>("");
  const [lawnCare, setLawnCare] = useState<string>("");
  const [holidayLighting, setHolidayLighting] = useState<string>("");
  const [otherDetail, setOtherDetail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [msgKind, setMsgKind] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    if (BOOKING_MODE !== "admin") return;

    (async () => {
      try {
        const r = await fetch("/api/customers?limit=200");
        const j = (await r.json()) as CustomersResp;

        if ("ok" in j && j.ok) {
          setCustomers(j.data);
          if (j.data.length && customerId === "") setCustomerId(j.data[0].id);
        }
      } catch (err) {
        console.warn("Customer load skipped:", err);
      }
    })();
  }, [customerId]);

  function validateBasics(): string | null {
    if (!date) return "Please choose a date.";
    if (isPastDate(date)) return "Please choose a future date.";
    if (!preferredTime) return "Please choose a preferred time.";
    if (!plan) return "Please select a service frequency.";

    const pickedAnyService =
      service || insulationService || lawnCare || holidayLighting;

    if (!pickedAnyService) return "Please select at least one service.";

    if (service === "other" && !otherDetail.trim()) {
      return "Please describe the service under 'Other'.";
    }

    if (BOOKING_MODE === "admin") {
      if (!customerId) return "Please pick a customer.";
    } else {
      if (!publicName.trim()) return "Please enter your name.";
      if (!publicPhone.trim()) return "Please enter your phone.";
      if (!publicAddress.trim()) return "Please enter your address.";
      if (!publicEmail.trim()) return "Please enter your email.";
    }

    return null;
  }

  async function uploadPhotos() {
    const uploadedUrls: string[] = [];

    if (!photoFiles.length) {
      return uploadedUrls;
    }

    setMessage("Uploading photos...");
    setMsgKind("info");

    for (const file of photoFiles) {
      try {
        const base64 = await fileToBase64(file);

        const r = await fetch("/api/upload-photo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            base64,
          }),
        });

        const j = (await r.json()) as UploadResp;

        if ("ok" in j && j.ok && j.url) {
          uploadedUrls.push(j.url);
        } else {
          console.warn("Photo upload skipped:", (j as any).error);
        }
      } catch (err) {
        console.warn("Photo upload failed, continuing without photo:", err);
      }
    }

    return uploadedUrls;
  }

  async function submitRequest() {
    const v = validateBasics();

    if (v) {
      setMessage(v);
      setMsgKind("error");
      return;
    }

    setSubmitting(true);
    setMessage("Submitting request...");
    setMsgKind("info");

    try {
      const serviceToSend =
        service === "other" && otherDetail.trim()
          ? `Other — ${otherDetail.trim()}`
          : service;

      const fullAddress = [publicAddress, publicCity, publicState, publicZip]
        .filter(Boolean)
        .join(", ");

      const photoUrls = await uploadPhotos();

      setMessage("Saving request...");
      setMsgKind("info");

      const body =
        BOOKING_MODE === "admin"
          ? {
              customerId,
              date,
              time: preferredTime,
              plan,
              service: serviceToSend,
              insulationService,
              lawnCare,
              holidayLighting,
              notes,
              photoUrls,
            }
          : {
              customer: {
                name: publicName.trim(),
                phone: publicPhone.trim(),
                address: fullAddress || publicAddress.trim(),
                city: publicCity.trim(),
                state: publicState.trim(),
                zip: publicZip.trim(),
                email: publicEmail.trim(),
              },
              date,
              time: preferredTime,
              plan,
              service: serviceToSend,
              insulationService,
              lawnCare,
              holidayLighting,
              notes,
              photoUrls,
            };

      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = (await r.json()) as PostResp;

      if (!("ok" in j) || !j.ok) {
        throw new Error((j as any).error || "Request failed");
      }

      setMessage("Request submitted successfully.");
      setMsgKind("success");

      window.location.href = `/thanks?date=${encodeURIComponent(
        j.date
      )}&time=${encodeURIComponent(j.time)}`;
    } catch (e: any) {
      setMessage(`Error: ${String(e?.message || e)}`);
      setMsgKind("error");
      setSubmitting(false);
    }
  }

  const CustomerSelect = useMemo(() => {
    if (BOOKING_MODE !== "admin") return null;

    return (
      <select
        value={customerId}
        onChange={(e) => setCustomerId(Number(e.target.value))}
        style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
      >
        <option value="">— Select a customer —</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.code ? `— ${c.code}` : ""}
          </option>
        ))}
      </select>
    );
  }, [customers, customerId]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px 24px" }}>
      <SiteHeader subtitle="— Booking" greeting={GREETING} />

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1f7a34" }}>
         We’re More Than Pest Control — Ask About Our Insulation, Lawn Care, and Holiday Lighting Services!
        </div>
        <div style={{ fontSize: 14 }}>
          Energy savings • Better comfort • Outdoor lighting • Healthier lawns
        </div>
      </div>

      {message ? (
        <div
          style={{
            color:
              msgKind === "error"
                ? "crimson"
                : msgKind === "success"
                ? "green"
                : "#333",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      ) : null}

      {BOOKING_MODE === "admin" ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Customer
          </label>
          {CustomerSelect}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Your name
            </label>
            <input
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              placeholder="Full name"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Phone
            </label>
            <input
              value={publicPhone}
              onChange={(e) => setPublicPhone(e.target.value)}
              placeholder="Best contact number"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Address
            </label>
            <input
              value={publicAddress}
              onChange={(e) => setPublicAddress(e.target.value)}
              placeholder="Service address"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 10,
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            <input
              value={publicCity}
              onChange={(e) => setPublicCity(e.target.value)}
              placeholder="City"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
            <input
              value={publicState}
              onChange={(e) => setPublicState(e.target.value)}
              placeholder="State"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
            <input
              value={publicZip}
              onChange={(e) => setPublicZip(e.target.value)}
              placeholder="Zip"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Email
            </label>
            <input
              value={publicEmail}
              onChange={(e) => setPublicEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
          marginBottom: 12,
          alignItems: "end",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Preferred Time
          </label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          >
            <option value="">— Select time —</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Service Frequency
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          >
            <option value="">— Select frequency —</option>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          maxWidth: 900,
          gap: 20,
          marginBottom: 20,
          alignItems: "end",
          margin: "0 auto 20px auto",
        }}
      >
        <div>
          <label style={{ fontWeight: 700 }}>Pest Control</label>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            General pests, termites, rodents, and more
          </div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
          >
            <option value="">— Select pest service —</option>
            {SERVICE_GROUPS.filter(
              (g) =>
                g.group !== "Insulation" &&
                g.group !== "Lawn Care" &&
                g.group !== "Holiday / Seasonal Lighting"
            ).map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 700 }}>Insulation</label>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            Energy savings • Better comfort • Lower utility bills
          </div>
          <select
            value={insulationService}
            onChange={(e) => setInsulationService(e.target.value)}
            style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
          >
            <option value="">— Select insulation service —</option>
            {SERVICE_GROUPS.find((g) => g.group === "Insulation")?.options.map(
              (o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 700 }}>Lawn Care</label>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            Healthier lawn • Weed control • Seasonal programs
          </div>
          <select
            value={lawnCare}
            onChange={(e) => setLawnCare(e.target.value)}
            style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
          >
            <option value="">— Select lawn service —</option>
            {SERVICE_GROUPS.find((g) => g.group === "Lawn Care")?.options.map(
              (o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 700 }}>Holiday / Seasonal Lighting</label>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            Beautiful outdoor lighting • Hassle-free installs
          </div>
          <select
            value={holidayLighting}
            onChange={(e) => setHolidayLighting(e.target.value)}
            style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
          >
            <option value="">— Select lighting service —</option>
            {SERVICE_GROUPS.find(
              (g) => g.group === "Holiday / Seasonal Lighting"
            )?.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {service === "other" ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Other service details
          </label>
          <input
            value={otherDetail}
            onChange={(e) => setOtherDetail(e.target.value)}
            placeholder="Please describe the service needed"
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
      ) : null}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, pet info, special instructions…"
          rows={3}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
          Upload Photos Optional
        </label>

        <div style={{ fontSize: 12, marginBottom: 6 }}>
          Add up to 3 photos. Photos will be saved with your request.
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []).slice(0, 3);
            setPhotoFiles(files);
          }}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />

        {photoFiles.length ? (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            Selected photos:
            <ul>
              {photoFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={submitRequest}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: submitting ? "not-allowed" : "pointer",
          boxSizing: "border-box",
          fontWeight: 700,
        }}
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}