import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DoctorWelcome from "../Common/DoctorWelcome";
import { getDoctorErrorMessage, getDoctorSession } from "../doctorApi";
import { doctorSchedule } from "../../jsonData/Schedule";
import ScheduleBox from "./ScheduleBox";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

function getScheduleDate(value) {
  const datePart = String(value || "").slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatScheduleDate(value, options) {
  const date = getScheduleDate(value);
  return date ? new Intl.DateTimeFormat("en", options).format(date) : "Invalid date";
}

function formatDuration(minutes) {
  return Number(minutes) === 60 ? "1 hour" : `${minutes} minutes`;
}

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const loadSchedules = useCallback(async () => {
    const session = getDoctorSession();
    if (!session) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/doctor/schedules`, {
        headers: { authorization: `Bearer ${session.token}` },
      });
      if (!Array.isArray(data?.data)) {
        throw new Error("The server returned an invalid schedule response.");
      }
      setSchedules(data.data);
    } catch (error) {
      setErrorMessage(getDoctorErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const openAddModal = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
    setErrorMessage("");
    setModalError("");
    setSuccessMessage("");
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
    setErrorMessage("");
    setModalError("");
    setSuccessMessage("");
  };

  const handleSaveSchedule = async (form) => {
    const session = getDoctorSession();
    if (!session) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setModalError("");
    setSuccessMessage("");
    try {
      const config = { headers: { authorization: `Bearer ${session.token}` } };
      const response = editingSchedule
        ? await axios.put(`${API_BASE_URL}/doctor/schedules/${editingSchedule._id}`, form, config)
        : await axios.post(`${API_BASE_URL}/doctor/schedules`, form, config);
      const savedSchedule = response.data?.data;
      if (!savedSchedule?._id) throw new Error("The server did not return the saved schedule.");

      if (editingSchedule) {
        setSchedules((current) => current.map((schedule) => (
          schedule._id === editingSchedule._id ? savedSchedule : schedule
        )).sort((left, right) => left.date.localeCompare(right.date)));
      } else {
        setSchedules((current) => [...current, savedSchedule].sort((left, right) => left.date.localeCompare(right.date)));
      }
      setIsModalOpen(false);
      setEditingSchedule(null);
      setSuccessMessage(response.data?.msg || "Schedule saved successfully.");
    } catch (error) {
      setModalError(getDoctorErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (schedule) => {
    const confirmation = await Swal.fire({
      title: "Remove this schedule?",
      text: `${formatScheduleDate(schedule.date, { month: "short", day: "numeric", year: "numeric" })} · ${schedule.start_time}–${schedule.end_time}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove schedule",
      confirmButtonColor: "#b84d48",
      cancelButtonText: "Keep it",
    });
    if (!confirmation.isConfirmed) return;

    const session = getDoctorSession();
    if (!session) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    setDeletingId(schedule._id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { data } = await axios.delete(`${API_BASE_URL}/doctor/schedules/${schedule._id}`, {
        headers: { authorization: `Bearer ${session.token}` },
      });
      setSchedules((current) => current.filter((item) => item._id !== schedule._id));
      setSuccessMessage(data.msg || "Schedule removed successfully.");
    } catch (error) {
      setErrorMessage(getDoctorErrorMessage(error));
    } finally {
      setDeletingId("");
    }
  };

  const renderActions = (schedule) => (
    <div className="doctor-schedule-actions">
      <button
        className="doctor-schedule-action"
        type="button"
        aria-label={`Edit schedule for ${formatScheduleDate(schedule.date, { month: "short", day: "numeric" })}`}
        disabled={Boolean(deletingId) || isSaving}
        onClick={() => openEditModal(schedule)}
      >
        <span className="material-icons-sharp" aria-hidden="true">edit</span>
      </button>
      <button
        className="doctor-schedule-action is-danger"
        type="button"
        aria-label={`Remove schedule for ${formatScheduleDate(schedule.date, { month: "short", day: "numeric" })}`}
        disabled={Boolean(deletingId) || isSaving}
        onClick={() => handleDeleteSchedule(schedule)}
      >
        <span className="material-icons-sharp" aria-hidden="true">{deletingId === schedule._id ? "hourglass_top" : "delete"}</span>
      </button>
    </div>
  );

  const renderScheduleCells = (schedule) => {
    const values = [
      formatScheduleDate(schedule.date, { month: "short", day: "numeric", year: "numeric" }),
      formatScheduleDate(schedule.date, { weekday: "long" }),
      schedule.start_time,
      schedule.end_time,
      formatDuration(schedule.consultation_minutes),
      schedule.status || "Active",
    ];
    return values;
  };

  return (
    <DoctorWelcome>
      {errorMessage && (
        <div className="doctor-alert" role="alert">
          <span className="material-icons-sharp">error_outline</span>
          <span>{errorMessage}</span>
          <button type="button" onClick={loadSchedules}>Try again</button>
        </div>
      )}
      {successMessage && <div className="doctor-success" role="status">{successMessage}</div>}

      <section className="doctor-card doctor-schedule-card">
        <div className="doctor-card-heading doctor-schedule-heading">
          <div>
            <h3>Doctor schedule list</h3>
            <p>{schedules.length} schedule{schedules.length === 1 ? "" : "s"} configured</p>
          </div>
          <button className="doctor-primary-button" type="button" onClick={openAddModal} disabled={isLoading}>
            <span className="material-icons-sharp" aria-hidden="true">add</span>
            Add schedule
          </button>
        </div>

        {isLoading ? (
          <div className="doctor-loading" role="status">Loading your schedules...</div>
        ) : schedules.length === 0 && !errorMessage ? (
          <div className="doctor-empty-state">
            <div>
              <span className="material-icons-sharp">calendar_month</span>
              <h3>No schedule added yet</h3>
              <p>Add your available date and clinic hours. Patients will only be able to book the time slots you configure.</p>
              <button className="doctor-primary-button" type="button" onClick={openAddModal}>Add your first schedule</button>
            </div>
          </div>
        ) : schedules.length > 0 ? (
          <>
            <div className="doctor-table-wrap doctor-schedule-table-wrap">
              <table className="doctor-table">
                <thead>
                  <tr>{doctorSchedule.map((heading) => <th key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id}>
                      {renderScheduleCells(schedule).map((value, index) => (
                        <td key={`${schedule._id}-${index}`}>
                          {index === 5 ? <span className="doctor-status">{value}</span> : value}
                        </td>
                      ))}
                      <td>{renderActions(schedule)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="doctor-schedule-cards">
              {schedules.map((schedule) => (
                <article className="doctor-schedule-mobile-card" key={`mobile-${schedule._id}`}>
                  <div className="doctor-schedule-mobile-heading">
                    <div>
                      <strong>{formatScheduleDate(schedule.date, { weekday: "long" })}</strong>
                      <span>{formatScheduleDate(schedule.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <span className="doctor-status">{schedule.status || "Active"}</span>
                  </div>
                  <div className="doctor-schedule-mobile-details">
                    <div><span>Hours</span><strong>{schedule.start_time} – {schedule.end_time}</strong></div>
                    <div><span>Consultation</span><strong>{formatDuration(schedule.consultation_minutes)}</strong></div>
                  </div>
                  {renderActions(schedule)}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {isModalOpen && (
        <ScheduleBox
          key={editingSchedule?._id || "new-schedule"}
          schedule={editingSchedule}
          errorMessage={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setEditingSchedule(null);
              setModalError("");
            }
          }}
          onSubmit={handleSaveSchedule}
        />
      )}
    </DoctorWelcome>
  );
}
