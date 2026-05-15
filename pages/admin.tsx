import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  service?: string;
  insulationService?: string;
  lawnCare?: string;
  holidayLighting?: string;
  plan?: string;
  date?: string;
  time?: string;
  notes?: string;
  officeNotes?: string;
  status?: string;
  archived?: boolean;
  photoUrls?: string[];
  createdAt?: string;
};

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  async function loadAppointments(adminPassword?: string) {
    try {
      const response = await fetch("/api/admin-appointments", {
        headers: {
          "x-admin-password": adminPassword || password,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadAppointments();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "100px auto",
          padding: 20,
          border: "1px solid #ccc",
        }}
      >
        <h1>Admin Login</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <button
          onClick={async () => {
            setAuthenticated(true);
          }}
          style={{
            width: "100%",
            padding: 10,
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1>Plank Pest Control — Booking Dashboard</h1>

      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          style={{
            border: "2px solid #ddd",
            borderLeft: "6px solid orange",
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2>{appointment.customer.name}</h2>

          <div>{appointment.customer.phone}</div>
          <div>{appointment.customer.email}</div>
          <div>{appointment.customer.address}</div>

          <br />

          <div>
            <strong>Pest Control:</strong>{" "}
            {appointment.service || "None selected"}
          </div>

          <div>
            <strong>Insulation:</strong>{" "}
            {appointment.insulationService || "None selected"}
          </div>

          <div>
            <strong>Lawn Care:</strong>{" "}
            {appointment.lawnCare || "None selected"}
          </div>

          <div>
            <strong>Holiday Lighting:</strong>{" "}
            {appointment.holidayLighting || "None selected"}
          </div>

          <br />

          <div>
            <strong>Date:</strong> {appointment.date}
          </div>

          <div>
            <strong>Time:</strong> {appointment.time}
          </div>

          <div>
            <strong>Plan:</strong> {appointment.plan}
          </div>

          <br />

          <div>
            <strong>Customer Notes:</strong>
          </div>

          <div
            style={{
              background: "#f4f4f4",
              padding: 10,
              borderRadius: 6,
              marginTop: 5,
            }}
          >
            {appointment.notes || "No customer notes"}
          </div>

          {appointment.photoUrls &&
            appointment.photoUrls.length > 0 && (
              <>
                <br />

                <div>
                  <strong>Uploaded Photos:</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {appointment.photoUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        style={{
                          width: 180,
                          height: 180,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </>
            )}
        </div>
      ))}
    </div>
  );
}