import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorWelcome from "../Common/DoctorWelcome";
import { fetchDoctorAppointments, getDoctorErrorMessage, getDoctorSession } from "../doctorApi";

const initialAppointments = { data: [], meta: { pageCount: 0, total: 0 } };

function formatAppointmentDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function DoctorAppoint() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loadAppointments = useCallback(async (requestedPage = 1) => {
    const session = getDoctorSession();
    if (!session) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchDoctorAppointments(session, requestedPage);
      if (!Array.isArray(response?.data)) {
        throw new Error("The server returned an invalid appointments response.");
      }
      setAppointments({
        data: response.data,
        meta: {
          pageCount: Number(response.meta?.pageCount) || 0,
          total: Number(response.meta?.total) || response.data.length,
        },
      });
    } catch (error) {
      setErrorMessage(getDoctorErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAppointments(page);
  }, [loadAppointments, page]);

  const filteredAppointments = appointments.data.filter((appointment) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [appointment.name, appointment.email, appointment.mobile, appointment.query_category]
      .some((value) => String(value || "").toLowerCase().includes(term));
  });

  return (
    <DoctorWelcome>
      {errorMessage && (
        <div className="doctor-alert" role="alert">
          <span className="material-icons-sharp">error_outline</span>
          <span>{errorMessage}</span>
          <button type="button" onClick={() => loadAppointments(page)}>Try again</button>
        </div>
      )}
      <section className="doctor-card">
        <div className="doctor-card-heading">
          <div>
            <h3>Patient appointments</h3>
            <p>{appointments.meta.total} appointment{appointments.meta.total === 1 ? "" : "s"} in your list</p>
          </div>
          <input
            type="search"
            className="doctor-search"
            aria-label="Search appointments"
            placeholder="Search patient, email or reason"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {loading ? (
          <div className="doctor-loading" role="status">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="doctor-empty-state">
            <div>
              <span className="material-icons-sharp">{errorMessage ? "cloud_off" : "event_busy"}</span>
              <h3>{errorMessage ? "Appointments unavailable" : search ? "No matching appointments" : "No appointments yet"}</h3>
              <p>{errorMessage ? "Resolve the connection issue and retry to load your patient list." : search ? "Try another name, email or appointment reason." : "New patient appointments will appear here when they are booked."}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="doctor-table-wrap">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Reason for visit</th>
                    <th>Date & time</th>
                    <th>Contact</th>
                    <th>Reference</th>
                    <th>Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment, index) => (
                    <tr key={appointment._id || `${appointment.email}-${index}`}>
                      <td>
                        <div className="doctor-patient">
                          <span className="doctor-patient-avatar">{String(appointment.name || "P").slice(0, 1).toUpperCase()}</span>
                          <span className="doctor-patient-name">{appointment.name || "Patient"}</span>
                        </div>
                      </td>
                      <td><span className="doctor-appointment-topic">{appointment.query_category || "General consultation"}</span></td>
                      <td>
                        <div className="doctor-appointment-date">{formatAppointmentDate(appointment.date)}</div>
                        <div className="doctor-appointment-time">{appointment.time || "Time not provided"}</div>
                      </td>
                      <td>
                        <div>{appointment.mobile || "—"}</div>
                        <div className="doctor-appointment-time">{appointment.email || "Email not provided"}</div>
                      </td>
                      <td><span className="doctor-id">{appointment._id ? `#${String(appointment._id).slice(-8)}` : "—"}</span></td>
                      <td><span className="doctor-status">Received</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="doctor-pagination">
              <span>Page {page} of {Math.max(appointments.meta.pageCount, 1)}</span>
              <div>
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>{" "}
                <button type="button" disabled={page >= appointments.meta.pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </section>
    </DoctorWelcome>
  );
}
