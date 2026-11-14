import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import ReactPaginateModule from "react-paginate";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../Common/Layout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const ReactPaginate = ReactPaginateModule.default;
const PAGE_SIZE = 5;
const EMPTY_APPOINTMENTS = { data: [], meta: { pageCount: 0, total: 0 } };
const DAYS_IN_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getPatientSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem("jwt-normal-user") || "null");
    return session?.token && session?.user?._id ? session : null;
  } catch {
    return null;
  }
}

function formatDate(value, options = { year: "numeric", month: "short", day: "numeric" }) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en", options).format(date);
}

function getErrorMessage(error) {
  return error.response?.data?.msg
    || error.response?.data?.message
    || (error.code === "ERR_NETWORK"
      ? "Could not connect to the server. Check your connection and try again."
      : error.message || "Unable to load your appointments. Please try again.");
}

function saveAppointmentPdf(appointment, user) {
  const doc = new jsPDF();
  const { fname = "", lname = "", email = "", mobile = "" } = user;
  const day = appointment.date ? DAYS_IN_WEEK[new Date(appointment.date).getDay()] : "—";

  doc.setTextColor(8, 127, 140);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Patidar-Health", 105, 16, { align: "center" });
  doc.setTextColor(90);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Patient: ${[fname, lname].filter(Boolean).join(" ") || "Patient"}`, 18, 30);
  doc.text(`Email: ${email || "—"}`, 18, 37);
  doc.text(`Mobile: ${mobile || "—"}`, 18, 44);
  autoTable(doc, {
    startY: 54,
    head: [["Appointment ID", "Doctor", "Specialty", "Date", "Time", "Day", "Status"]],
    body: [[
      appointment._id || "—",
      appointment.doctor_name || "—",
      appointment.query_category || "—",
      formatDate(appointment.date),
      appointment.time || "—",
      day,
      appointment.status || "Booked",
    ]],
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [8, 127, 140] },
  });
  doc.save(`appointment-${String(appointment._id || "details").slice(-8)}.pdf`);
}

export default function MyAppointment() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState(EMPTY_APPOINTMENTS);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAppointments = useCallback(async (requestedPage = 1) => {
    const session = getPatientSession();
    if (!session) {
      navigate("/login-register", { replace: true });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setAppointments((current) => ({ ...current, data: [] }));
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/appointment/${session.user._id}?page=${requestedPage}&size=${PAGE_SIZE}`,
        { headers: { authorization: `Bearer ${session.token}` } },
      );
      if (!Array.isArray(data?.data)) {
        throw new Error("The server returned an invalid appointments response.");
      }
      setAppointments({
        data: data.data,
        meta: {
          pageCount: Math.max(Number(data.meta?.pageCount) || 0, 0),
          total: Math.max(Number(data.meta?.total) || 0, 0),
        },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAppointments(page);
  }, [loadAppointments, page]);

  const handlePageChange = ({ selected }) => {
    setPage(selected + 1);
  };

  const session = getPatientSession();

  return (
    <Layout>
      <main className="container patient-page-shell patient-history-page">
        <header className="patient-page-heading">
          <div>
            <span className="patient-eyebrow">YOUR HEALTH JOURNEY</span>
            <h1>My appointments</h1>
            <p>Review your bookings and download appointment details.</p>
          </div>
          <Link className="btn btn-primary patient-new-booking" to="/contact">Book an appointment</Link>
        </header>

        <section className="patient-panel patient-history-panel">
          <div className="patient-history-heading">
            <div>
              <h2>Appointment history</h2>
              <p>{appointments.meta.total} appointment{appointments.meta.total === 1 ? "" : "s"} in your account</p>
            </div>
            {!isLoading && <span className="patient-history-count">{appointments.meta.total} total</span>}
          </div>

          {errorMessage && (
            <div className="patient-alert patient-history-alert" role="alert">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => loadAppointments(page)}>Try again</button>
            </div>
          )}

          {isLoading ? (
            <div className="patient-empty-state" role="status">Loading your appointments...</div>
          ) : appointments.data.length === 0 && !errorMessage ? (
            <div className="patient-empty-state">
              <span className="material-icons-sharp" aria-hidden="true">event_available</span>
              <h3>No appointments yet</h3>
              <p>Your booked appointments will appear here.</p>
              <Link className="btn btn-primary" to="/contact">Book your first appointment</Link>
            </div>
          ) : (
            <div className="patient-appointment-list">
              {appointments.data.map((appointment, index) => {
                const date = appointment.date ? new Date(appointment.date) : null;
                const validDate = date && !Number.isNaN(date.getTime());
                const status = appointment.status || "Booked";

                return (
                  <article className="patient-appointment-card" key={appointment._id || `${appointment.date}-${index}`}>
                    <div className="patient-appointment-card-heading">
                      <div className="patient-doctor-avatar" aria-hidden="true">
                        <span className="material-icons-sharp">medical_services</span>
                      </div>
                      <div className="patient-appointment-doctor">
                        <span className="patient-card-label">DOCTOR</span>
                        <h3>{appointment.doctor_name || "Doctor not assigned"}</h3>
                      </div>
                      <span className={`patient-status patient-status-${String(status).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{status}</span>
                    </div>

                    <div className="patient-appointment-details">
                      <div><span>Specialty</span><strong>{appointment.query_category || "—"}</strong></div>
                      <div><span>Date</span><strong>{formatDate(appointment.date)}</strong></div>
                      <div><span>Day & time</span><strong>{validDate ? DAYS_IN_WEEK[date.getDay()] : "—"}{appointment.time ? ` · ${appointment.time}` : ""}</strong></div>
                      <div><span>Appointment ID</span><strong className="patient-appointment-id">{appointment._id || "—"}</strong></div>
                    </div>

                    <div className="patient-appointment-card-footer">
                      <span>Keep this appointment summary for your records.</span>
                      <button
                        className="patient-download-button"
                        type="button"
                        onClick={() => saveAppointmentPdf(appointment, session?.user || {})}
                      >
                        <span className="material-icons-sharp" aria-hidden="true">download</span>
                        Download PDF
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && appointments.meta.pageCount > 1 && (
            <ReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              breakLabel="..."
              pageCount={appointments.meta.pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
              onPageChange={handlePageChange}
              forcePage={page - 1}
              containerClassName="pagination patient-pagination"
              pageClassName="page-item"
              pageLinkClassName="page-link"
              previousClassName="page-item"
              previousLinkClassName="page-link"
              nextClassName="page-item"
              nextLinkClassName="page-link"
              breakClassName="page-item"
              breakLinkClassName="page-link"
              activeClassName="active"
              disabledClassName="disabled"
            />
          )}
        </section>
      </main>
    </Layout>
  );
}
