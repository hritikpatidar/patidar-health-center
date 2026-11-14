import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoctorWelcome from "../Common/DoctorWelcome";
import { fetchDoctorAppointments, getDoctorErrorMessage, getDoctorSession, getDoctorName } from "../doctorApi";

function getAppointmentDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getAppointmentDate(value);
  if (!date) return "Date not provided";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    const session = getDoctorSession();
    if (!session) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchDoctorAppointments(session, 1, 100);
      if (!Array.isArray(response?.data)) {
        throw new Error("The server returned an invalid appointments response.");
      }
      setAppointments(response.data);
      setTotal(Number(response.meta?.total) || response.data.length);
    } catch (error) {
      setErrorMessage(getDoctorErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter((appointment) => {
        const date = getAppointmentDate(appointment.date);
        return date && date >= today;
      })
      .sort((left, right) => getAppointmentDate(left.date) - getAppointmentDate(right.date));
  }, [appointments]);

  const thisWeekCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return upcomingAppointments.filter((appointment) => {
      const date = getAppointmentDate(appointment.date);
      return date && date < nextWeek;
    }).length;
  }, [upcomingAppointments]);

  return (
    <DoctorWelcome>
      {errorMessage && (
        <div className="doctor-alert" role="alert">
          <span className="material-icons-sharp">error_outline</span>
          <span>{errorMessage}</span>
          <button type="button" onClick={loadDashboard}>Try again</button>
        </div>
      )}
      <section className="doctor-stats">
        <article className="doctor-card doctor-stat-card">
          <span className="doctor-stat-icon material-icons-sharp">calendar_month</span>
          <div><div className="doctor-stat-label">Total appointments</div><div className="doctor-stat-value">{loading ? "-" : total}</div></div>
        </article>
        <article className="doctor-card doctor-stat-card">
          <span className="doctor-stat-icon material-icons-sharp">event_available</span>
          <div><div className="doctor-stat-label">Upcoming (latest 100)</div><div className="doctor-stat-value">{loading ? "-" : upcomingAppointments.length}</div></div>
        </article>
        <article className="doctor-card doctor-stat-card">
          <span className="doctor-stat-icon material-icons-sharp">date_range</span>
          <div><div className="doctor-stat-label">Next 7 days (latest 100)</div><div className="doctor-stat-value">{loading ? "-" : thisWeekCount}</div></div>
        </article>
      </section>

      <section className="doctor-dashboard-grid">
        <div className="doctor-card">
          <div className="doctor-card-heading">
            <div><h3>Upcoming appointments</h3><p>Your next scheduled patient visits</p></div>
            <Link to="/doctor/appointments" className="doctor-primary-button">View all</Link>
          </div>
          {loading ? (
            <div className="doctor-loading" role="status">Loading your dashboard…</div>
          ) : upcomingAppointments.length ? (
            <div className="doctor-dashboard-list">
              {upcomingAppointments.slice(0, 5).map((appointment, index) => (
                <div className="doctor-dashboard-appointment" key={appointment._id || `${appointment.email}-${index}`}>
                  <span className="doctor-patient-avatar">{String(appointment.name || "P").slice(0, 1).toUpperCase()}</span>
                  <div className="doctor-dashboard-appointment-copy">
                    <strong>{appointment.name || "Patient"}</strong>
                    <span>{appointment.query_category || "General consultation"}</span>
                  </div>
                  <div className="doctor-appointment-date">{formatDate(appointment.date)}<div className="doctor-appointment-time">{appointment.time || "Time pending"}</div></div>
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="doctor-empty-state">
              <div><span className="material-icons-sharp">cloud_off</span><h3>Appointments unavailable</h3><p>Retry after the connection issue is resolved to load your upcoming visits.</p></div>
            </div>
          ) : (
            <div className="doctor-empty-state">
              <div><span className="material-icons-sharp">event_available</span><h3>No upcoming appointments</h3><p>New bookings will show up here once they are received.</p></div>
            </div>
          )}
        </div>

        <aside className="doctor-card doctor-dashboard-welcome">
          <span className="material-icons-sharp">favorite</span>
          <h3>Welcome, Dr. {getDoctorName(getDoctorSession())}</h3>
          <p>Keep track of patient bookings and stay up to date with your practice from one place.</p>
          <Link to="/doctor/schedule">Review your schedule <span className="material-icons-sharp">arrow_forward</span></Link>
        </aside>
      </section>
    </DoctorWelcome>
  );
}
