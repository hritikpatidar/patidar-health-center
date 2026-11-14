import { addYears } from "date-fns";
import { useState } from "react";

function getLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ScheduleBox({ schedule, errorMessage, isSaving, onClose, onSubmit }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = addYears(today, 1);
  const [form, setForm] = useState({
    date: schedule?.date?.slice(0, 10) || getLocalDateValue(today),
    start_time: schedule?.start_time || "09:00",
    end_time: schedule?.end_time || "17:00",
    consultation_minutes: String(schedule?.consultation_minutes || 30),
  });
  const [validationError, setValidationError] = useState("");

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setValidationError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.end_time <= form.start_time) {
      setValidationError("End time must be later than start time.");
      return;
    }
    if ((parseInt(form.end_time.slice(0, 2), 10) * 60 + Number(form.end_time.slice(3)))
      - (parseInt(form.start_time.slice(0, 2), 10) * 60 + Number(form.start_time.slice(3)))
      < Number(form.consultation_minutes)) {
      setValidationError("Working hours must include at least one full consultation.");
      return;
    }
    onSubmit(form);
  };

  return (
    <div
      className="doctor-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section className="doctor-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <header className="doctor-schedule-modal-heading">
          <div>
            <span className="doctor-eyebrow">AVAILABILITY</span>
            <h2 id="schedule-modal-title">{schedule ? "Edit schedule" : "Add schedule"}</h2>
          </div>
          <button className="doctor-schedule-modal-close" type="button" onClick={onClose} disabled={isSaving} aria-label="Close">
            <span className="material-icons-sharp">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label className="doctor-schedule-label" htmlFor="schedule-date">Schedule date</label>
          <input
            id="schedule-date"
            className="doctor-schedule-input"
            type="date"
            name="date"
            value={form.date}
            min={getLocalDateValue(today)}
            max={getLocalDateValue(maxDate)}
            onChange={handleChange}
            required
          />

          <div className="doctor-schedule-form-row">
            <div>
              <label className="doctor-schedule-label" htmlFor="schedule-start">Start time</label>
              <input id="schedule-start" className="doctor-schedule-input" type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
            </div>
            <div>
              <label className="doctor-schedule-label" htmlFor="schedule-end">End time</label>
              <input id="schedule-end" className="doctor-schedule-input" type="time" name="end_time" value={form.end_time} onChange={handleChange} required />
            </div>
          </div>

          <label className="doctor-schedule-label" htmlFor="consultation-minutes">Consultation duration</label>
          <select
            id="consultation-minutes"
            className="doctor-schedule-input"
            name="consultation_minutes"
            value={form.consultation_minutes}
            onChange={handleChange}
            required
          >
            <option value="10">10 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
          </select>

          {validationError && <p className="doctor-schedule-form-error" role="alert">{validationError}</p>}
          {errorMessage && <p className="doctor-schedule-form-error" role="alert">{errorMessage}</p>}
          <div className="doctor-schedule-modal-actions">
            <button className="doctor-schedule-cancel" type="button" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className="doctor-primary-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : schedule ? "Save changes" : "Add schedule"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
