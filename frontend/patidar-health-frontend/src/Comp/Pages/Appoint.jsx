import axios from "axios";
import { addDays, addYears, differenceInCalendarDays } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Layout from "../Common/Layout";
import { specialist } from "../../jsonData/specialist";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

function getPatientSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem("jwt-normal-user") || "null");
    return session?.token && session?.user?._id ? session : null;
  } catch {
    return null;
  }
}

function getDoctorName(doctor) {
  return [doctor?.fname, doctor?.lname].filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  return error.response?.data?.msg
    || error.response?.data?.message
    || (error.code === "ERR_NETWORK"
      ? "Could not connect to the server. Check your connection and try again."
      : error.message || "Something went wrong. Please try again.");
}

function formatApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDate(value) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function timeLabelToMinutes(value) {
  const match = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(value || "");
  if (!match) return null;
  const hour = Number(match[1]) % 12;
  return (hour + (match[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(match[2]);
}

function formatTimeLabel(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60);
  const hour12 = hour24 % 12 || 12;
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${String(hour12).padStart(2, "0")}:${minute} ${hour24 < 12 ? "AM" : "PM"}`;
}

function formatSlotRange(startTime, duration) {
  const start = timeLabelToMinutes(startTime);
  return start === null ? startTime : `${startTime} – ${formatTimeLabel(start + Number(duration))}`;
}

export default function Appoint() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [doctorError, setDoctorError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleRequestKey, setScheduleRequestKey] = useState(0);
  const [bookingError, setBookingError] = useState("");
  const [category, setCategory] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const firstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const lastAvailableDate = useMemo(() => addYears(firstAvailableDate, 1), [firstAvailableDate]);
  const dateRangeStart = formatApiDate(firstAvailableDate);
  const dateRangeEnd = formatApiDate(lastAvailableDate);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const loadDoctors = useCallback(async () => {
    const session = getPatientSession();
    if (!session) {
      navigate("/login-register", { replace: true });
      return;
    }

    setIsLoadingDoctors(true);
    setDoctorError("");
    try {
      const { data } = await axios.get(`${API_BASE_URL}/doctors`, {
        headers: { authorization: `Bearer ${session.token}` },
      });
      if (!Array.isArray(data) || data.some((doctor) => !doctor?._id)) {
        throw new Error("Doctor IDs are missing from the API response. Restart the backend with the latest schedule API.");
      }
      setDoctors(data);
    } catch (error) {
      setDoctorError(getErrorMessage(error));
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const categoryDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.specialist === category),
    [doctors, category],
  );

  useEffect(() => {
    if (!categoryDoctors.some((doctor) => String(doctor._id) === selectedDoctor)) {
      setSelectedDoctor(String(categoryDoctors[0]?._id || ""));
      setSelectedTime("");
    }
  }, [categoryDoctors, selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor) {
      setSchedules([]);
      setScheduleError("");
      setIsLoadingSchedules(false);
      return undefined;
    }

    const session = getPatientSession();
    if (!session) {
      navigate("/login-register", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    setSchedules([]);
    setSelectedTime("");
    setScheduleError("");
    setIsLoadingSchedules(true);
    axios.get(`${API_BASE_URL}/doctors/${selectedDoctor}/schedules?from=${dateRangeStart}&to=${dateRangeEnd}`, {
      headers: { authorization: `Bearer ${session.token}` },
    }).then(({ data }) => {
      if (!Array.isArray(data?.data) || data.data.some((schedule) => !schedule.date || !Array.isArray(schedule.slots))) {
        throw new Error("The server returned an invalid schedule response.");
      }
      if (isCurrent) setSchedules(data.data);
    }).catch((error) => {
      if (isCurrent) setScheduleError(getErrorMessage(error));
    }).finally(() => {
      if (isCurrent) setIsLoadingSchedules(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [dateRangeEnd, dateRangeStart, navigate, scheduleRequestKey, selectedDoctor]);

  const selectedDateKey = formatApiDate(selectedDate);
  const selectedDateSchedule = schedules.find((schedule) => schedule.date === selectedDateKey);
  const selectedDoctorData = categoryDoctors.find((doctor) => String(doctor._id) === selectedDoctor);
  const availableDates = useMemo(
    () => new Set(schedules.filter((schedule) => schedule.slots?.length).map((schedule) => schedule.date)),
    [schedules],
  );
  const disabledDates = useMemo(() => {
    if (!selectedDoctor || isLoadingSchedules || scheduleError) return [];
    const dateCount = differenceInCalendarDays(lastAvailableDate, firstAvailableDate) + 1;
    return Array.from({ length: dateCount }, (_, index) => addDays(firstAvailableDate, index))
      .filter((date) => !availableDates.has(formatApiDate(date)));
  }, [availableDates, dateRangeEnd, dateRangeStart, isLoadingSchedules, lastAvailableDate, scheduleError, selectedDoctor]);

  useEffect(() => {
    if (isLoadingSchedules || schedules.length === 0) return;
    if (!schedules.some((schedule) => schedule.date === selectedDateKey && schedule.slots?.length)) {
      const nextDate = schedules.find((schedule) => schedule.slots?.length);
      if (nextDate) setSelectedDate(parseApiDate(nextDate.date));
    }
  }, [isLoadingSchedules, schedules, selectedDateKey]);

  const isPastTimeSlot = (time, referenceTime = currentTime) => {
    if (selectedDateKey !== formatApiDate(referenceTime)) return false;
    const slotMinutes = timeLabelToMinutes(time);
    const currentMinutes = referenceTime.getHours() * 60 + referenceTime.getMinutes();
    return slotMinutes !== null && slotMinutes <= currentMinutes;
  };

  useEffect(() => {
    if (selectedTime && isPastTimeSlot(selectedTime)) setSelectedTime("");
  }, [currentTime, selectedDateKey, selectedTime]);

  const handleBooking = async (event) => {
    event.preventDefault();
    setBookingError("");

    const session = getPatientSession();
    if (!session) {
      navigate("/login-register", { replace: true });
      return;
    }

    if (!selectedDoctorData || !selectedDateSchedule?.slots?.includes(selectedTime) || isPastTimeSlot(selectedTime, new Date())) {
      setBookingError("Please select an available date and time from the doctor's schedule.");
      return;
    }

    const { fname, lname, email, mobile, _id } = session.user;
    if (!/^\d{10}$/.test(String(mobile || ""))) {
      setBookingError("Your account must have a valid 10-digit mobile number to book. Please update your profile.");
      return;
    }

    const dateText = selectedDate.toLocaleDateString("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const confirmation = await Swal.fire({
      title: "Confirm your appointment",
      text: `${getDoctorName(selectedDoctorData)} · ${dateText} · ${selectedTime}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Book appointment",
      confirmButtonColor: "#087f8c",
      cancelButtonText: "Go back",
    });
    if (!confirmation.isConfirmed) return;

    setIsBooking(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/appointment`,
        {
          name: [fname, lname].filter(Boolean).join(" "),
          user_id: _id,
          email,
          mobile: String(mobile),
          time: selectedTime,
          date: formatApiDate(selectedDate),
          query_category: selectedDoctorData.specialist,
          doctor_name: getDoctorName(selectedDoctorData),
          doctor_id: selectedDoctor,
        },
        { headers: { authorization: `Bearer ${session.token}` } },
      );

      await Swal.fire({
        title: "Appointment booked",
        text: response.data?.msg || "Your appointment has been booked successfully.",
        icon: "success",
        confirmButtonColor: "#087f8c",
      });
      navigate("/myappointments");
    } catch (error) {
      setBookingError(getErrorMessage(error));
      if (error.response?.status === 409) {
        setSelectedTime("");
        setScheduleRequestKey((current) => current + 1);
      }
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Layout>
      <main className="container patient-page-shell">
        <header className="patient-page-heading">
          <div>
            <span className="patient-eyebrow">PATIDAR-HEALTH</span>
            <h1>Book an appointment</h1>
            <p>Choose a specialist, doctor, date and time for your visit.</p>
          </div>
          <Link className="patient-secondary-link" to="/myappointments">View my appointments</Link>
        </header>

        {doctorError && (
          <div className="patient-alert" role="alert">
            <span>{doctorError}</span>
            <button type="button" onClick={loadDoctors}>Try again</button>
          </div>
        )}
        {bookingError && <div className="patient-alert" role="alert">{bookingError}</div>}

        <form className="patient-booking-grid" onSubmit={handleBooking}>
          <section className="patient-panel patient-booking-details">
            <div className="patient-panel-heading">
              <span className="patient-step">01</span>
              <div><h2>Choose your doctor</h2><p>Select the care you need.</p></div>
            </div>

            <label className="patient-field-label" htmlFor="appointment-category">Specialty</label>
            <select
              id="appointment-category"
              className="form-select patient-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setBookingError("");
              }}
              disabled={isLoadingDoctors || Boolean(doctorError)}
              required
            >
              <option value="">Select a specialty</option>
              {specialist.map((specialty) => <option key={specialty} value={specialty}>{specialty.replace("&amp;", "&")}</option>)}
            </select>

            <label className="patient-field-label" htmlFor="appointment-doctor">Available doctor</label>
            <select
              id="appointment-doctor"
              className="form-select patient-select"
              value={selectedDoctor}
              onChange={(event) => {
                setSelectedDoctor(event.target.value);
                setSelectedTime("");
                setBookingError("");
              }}
              disabled={isLoadingDoctors || !category || categoryDoctors.length === 0}
              required
            >
              {categoryDoctors.length === 0
                ? <option value="">{category ? "No doctors available for this specialty" : "Choose a specialty first"}</option>
                : categoryDoctors.map((doctor, index) => {
                  const name = getDoctorName(doctor);
                  return <option key={`${name}-${index}`} value={doctor._id}>{name}</option>;
                })}
            </select>
            {isLoadingDoctors && <p className="patient-muted" role="status">Loading available doctors...</p>}
            {scheduleError && (
              <div className="patient-alert" role="alert">
                <span>{scheduleError}</span>
                <button type="button" onClick={() => setScheduleRequestKey((current) => current + 1)}>Try again</button>
              </div>
            )}

            <div className="patient-time-heading">
              <div>
                <h3>Available time</h3>
                <p>{selectedDateSchedule ? `${selectedDateSchedule.start_time}–${selectedDateSchedule.end_time} · ${selectedDateSchedule.consultation_minutes}-minute visits` : "Based on the selected doctor's schedule"}</p>
              </div>
              {selectedTime && <span className="patient-selected-time">{selectedTime}</span>}
            </div>
            <div className="patient-time-grid" role="group" aria-label="Available appointment times">
              {(selectedDateSchedule?.slots || []).map((time) => (
                <button
                  className={`patient-time-slot${selectedTime === time ? " is-selected" : ""}`}
                  key={time}
                  type="button"
                  aria-pressed={selectedTime === time}
                  disabled={!selectedDoctor || isLoadingSchedules || isPastTimeSlot(time)}
                  onClick={() => {
                    setSelectedTime(time);
                    setBookingError("");
                  }}
                >
                  {formatSlotRange(time, selectedDateSchedule?.consultation_minutes)}
                </button>
              ))}
            </div>
            {isLoadingSchedules && <p className="patient-muted" role="status">Loading this doctor's availability...</p>}
            {!isLoadingSchedules && !scheduleError && selectedDoctor && !selectedDateSchedule && (
              <p className="patient-weekend-note">
                {schedules.length === 0
                  ? "This doctor has not added any availability for the next year."
                  : "This doctor is not available on the selected date. Choose a marked date on the calendar."}
              </p>
            )}
            {!isLoadingSchedules && selectedDateSchedule && selectedDateSchedule.slots.length === 0 && (
              <p className="patient-weekend-note">All time slots for this date are booked.</p>
            )}
          </section>

          <section className="patient-panel patient-calendar-panel">
            <div className="patient-panel-heading">
              <span className="patient-step">02</span>
              <div><h2>Select a date</h2><p>Appointments can be booked up to one year ahead.</p></div>
            </div>
            {!selectedDoctor && (
              <p className="patient-muted">Choose a specialty and doctor first to see their available dates. You can still select a date now.</p>
            )}

            <Calendar
              className="patient-calendar"
              date={selectedDate}
              dateDisplayFormat="yyyy.MM.dd"
              minDate={firstAvailableDate}
              maxDate={lastAvailableDate}
              disabledDates={disabledDates}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
                setBookingError("");
              }}
              color="#087f8c"
              showWeekNumbers={false}
            />

            <div className="patient-date-summary">
              <span className="material-icons-sharp" aria-hidden="true">event</span>
              <div><span>Selected date</span><strong>{selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong></div>
            </div>
            <button
              className="btn btn-primary patient-book-button"
              type="submit"
              disabled={isBooking || isLoadingDoctors || isLoadingSchedules || Boolean(doctorError) || Boolean(scheduleError) || !selectedDoctor || !selectedDateSchedule?.slots?.includes(selectedTime)}
            >
              {isBooking ? "Booking..." : "Confirm appointment"}
            </button>
          </section>
        </form>
      </main>
    </Layout>
  );
}
