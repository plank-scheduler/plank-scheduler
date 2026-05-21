import { useEffect, useState } from "react";

type Appointment = {
  id: string | number;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
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
  const [showArchived, setShowArchived] = useState(false);

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
      } else {
        alert("Unable to load appointments.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading appointments.");
    }
  }

  async function updateAppointmentStatus(
    id: string | number,
    status: string,
    archived: boolean = false
  ) {
    try {
      const response = await fetch("/api/update-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          id,
          status,
          archived,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert("Unable to update appointment.");
        return;
      }

      await loadAppointments();
    } catch (err) {
      console.error(err);
      alert("Error updating appointment.");
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadAppointments();
    }
  }, [authenticated]);

  const visibleAppointments = appointments.filter((appointment) =>
    showArchived ? appointment.archived : !appointment.archived
  );

  if (!authenticated) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "100px auto",
          padding: 20,
          border: "1px solid #ccc",
          borderRadius: 8,
          fontFamily: "Arial, sans-serif",
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
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={() => {
            setAuthenticated(true);
          }}
          style={{
            width: "100%",
            padding: 10,
            cursor: "pointer",
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
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Plank Pest Control — Booking Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowArchived(false)}
          style={{
            padding: "10px 14px",
            marginRight: 10,
            cursor: "pointer",
            background: !showArchived ? "#1f7a34" : "#eee",
            color: !showArchived ? "white" : "black",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          Active Appointments
        </button>

        <button
          onClick={() => setShowArchived(true)}
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            background: showArchived ? "#555" : "#eee",
            color: showArchived ? "white" : "black",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          Archived Appointments
        </button>
      </div>

      {visibleAppointments.length === 0 && (
        <p>No appointments to show.</p>
      )}

      {visibleAppointments.map((appointment) => (
        <div
          key={appointment.id}
          style={{
            border: "2px solid #ddd",
            borderLeft: `6px solid ${
              appointment.archived
                ? "#777"
                : appointment.status === "Responded"
                ? "#1f7a34"
                : appointment.status === "Contacted"
                ? "#2563eb"
                : appointment.status === "Completed"
                ? "#6b21a8"
                : "orange"
            }`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
            background: appointment.archived ? "#f7f7f7" : "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{appointment.customer.name}</h2>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "#eee",
                fontWeight: 700,
              }}
            >
              Status: {appointment.status || "New"}
            </div>
          </div>

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
            <strong>Date:</strong> {appointment.date || "Not selected"}
          </div>

          <div>
            <strong>Time:</strong> {appointment.time || "Not selected"}
          </div>

          <div>
            <strong>Plan:</strong> {appointment.plan || "Not selected"}
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

          {appointment.photoUrls && appointment.photoUrls.length > 0 && (
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

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 20,
              paddingTop: 15,
              borderTop: "1px solid #ddd",
            }}
          >
            <button
              onClick={() =>
                updateAppointmentStatus(appointment.id, "New", false)
              }
              style={buttonStyle}
            >
              Mark New
            </button>

            <button
              onClick={() =>
                updateAppointmentStatus(appointment.id, "Contacted", false)
              }
              style={buttonStyle}
            >
              Contacted
            </button>

            <button
              onClick={() =>
                updateAppointmentStatus(appointment.id, "Responded", false)
              }
              style={buttonStyle}
            >
              Responded
            </button>

            <button
              onClick={() =>
                updateAppointmentStatus(appointment.id, "Completed", false)
              }
              style={buttonStyle}
            >
              Completed
            </button>

            {!appointment.archived ? (
              <button
                onClick={() =>
                  updateAppointmentStatus(appointment.id, "Archived", true)
                }
                style={archiveButtonStyle}
              >
                Archive
              </button>
            ) : (
              <button
                onClick={() =>
                  updateAppointmentStatus(appointment.id, "New", false)
                }
                style={buttonStyle}
              >
                Restore
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f5f5f5",
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #999",
  borderRadius: 6,
  background: "#555",
  color: "white",
  cursor: "pointer",
};