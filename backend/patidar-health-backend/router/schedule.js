import express from "express";
import { body, validationResult } from "express-validator";
import Appointment from "../modal/appointment.js";
import DoctorSchedule from "../modal/schedule.js";
import { doctor } from "../modal/doctor.js";
import * as checkAuth from "../middleware/check-auth.js";
import {
  appointmentTimeToMinutes,
  formatDateOnly,
  getScheduleSlots,
  parseDateOnly,
} from "../services/schedule.js";

const router = express.Router();
const consultationDurations = [10, 20, 30, 45, 60];
const scheduleValidators = [
  body("date").notEmpty().withMessage("Please select a schedule date."),
  body("start_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Please enter a valid start time."),
  body("end_time").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Please enter a valid end time."),
  body("consultation_minutes")
    .isIn(consultationDurations.map(String))
    .withMessage("Please select a valid consultation duration."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });

    const date = parseDateOnly(req.body.date);
    const startMinutes = appointmentTimeToMinutes(req.body.start_time);
    const endMinutes = appointmentTimeToMinutes(req.body.end_time);
    const consultationMinutes = Number(req.body.consultation_minutes);

    if (!date) return res.status(400).json({ msg: "Please enter a valid schedule date." });
    if (date < new Date(new Date().toISOString().slice(0, 10))) {
      return res.status(400).json({ msg: "A schedule cannot be added for a past date." });
    }
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ msg: "End time must be later than start time." });
    }
    if (getScheduleSlots(req.body.start_time, req.body.end_time, consultationMinutes).length === 0) {
      return res.status(400).json({ msg: "The selected hours are too short for one consultation." });
    }

    req.scheduleInput = { date, start_time: req.body.start_time, end_time: req.body.end_time, consultation_minutes: consultationMinutes };
    return next();
  },
];

function getDoctorDisplayName(doctorData) {
  return [doctorData.fname, doctorData.lname].filter(Boolean).join(" ");
}

function formatSchedule(schedule) {
  const data = schedule.toObject ? schedule.toObject() : schedule;
  return { ...data, date: formatDateOnly(data.date) };
}

router.get("/doctor/schedules", checkAuth.doctorAuth, async (req, res) => {
  try {
    const data = await DoctorSchedule.find({ doctor_id: String(req.user._id) })
      .sort({ date: 1, start_time: 1 });
    return res.status(200).json({ data: data.map(formatSchedule) });
  } catch (error) {
    console.error("Could not fetch doctor schedules:", error);
    return res.status(500).json({ msg: "Could not fetch doctor schedules" });
  }
});

router.post("/doctor/schedules", checkAuth.doctorAuth, ...scheduleValidators, async (req, res) => {
    try {
      const doctorName = getDoctorDisplayName(req.user);
      const existingSchedule = await DoctorSchedule.findOne({
        doctor_id: String(req.user._id),
        date: req.scheduleInput.date,
      });
      if (existingSchedule) {
        return res.status(409).json({ msg: "A schedule already exists for this date. Remove it before adding another." });
      }

      const schedule = await new DoctorSchedule({
        doctor_id: String(req.user._id),
        doctor_name: doctorName,
        ...req.scheduleInput,
      }).save();
      return res.status(201).json({
        msg: "Doctor schedule saved successfully.",
        data: formatSchedule(schedule),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ msg: "A schedule already exists for this date." });
      }
      console.error("Could not save doctor schedule:", error);
      return res.status(500).json({ msg: "Could not save doctor schedule" });
    }
});

router.put("/doctor/schedules/:scheduleId", checkAuth.doctorAuth, ...scheduleValidators, async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.scheduleId)) {
    return res.status(400).json({ msg: "Invalid schedule id." });
  }

  try {
    const existing = await DoctorSchedule.findOne({
      _id: req.params.scheduleId,
      doctor_id: String(req.user._id),
    });
    if (!existing) return res.status(404).json({ msg: "Schedule not found." });

    const doctorName = getDoctorDisplayName(req.user);
    const existingAppointment = await Appointment.findOne({
      date: existing.date,
      $or: [
        { doctor_id: String(req.user._id) },
        { doctor_id: { $exists: false }, doctor_name: doctorName },
      ],
    });
    if (existingAppointment) {
      return res.status(409).json({ msg: "This schedule has appointments booked and cannot be changed." });
    }

    const dateConflict = await DoctorSchedule.findOne({
      doctor_id: String(req.user._id),
      date: req.scheduleInput.date,
      _id: { $ne: existing._id },
    });
    if (dateConflict) {
      return res.status(409).json({ msg: "A schedule already exists for this date." });
    }

    Object.assign(existing, req.scheduleInput);
    const updated = await existing.save();
    return res.status(200).json({
      msg: "Doctor schedule updated successfully.",
      data: formatSchedule(updated),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ msg: "A schedule already exists for this date." });
    }
    console.error("Could not update doctor schedule:", error);
    return res.status(500).json({ msg: "Could not update doctor schedule" });
  }
});

router.delete("/doctor/schedules/:scheduleId", checkAuth.doctorAuth, async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.scheduleId)) {
    return res.status(400).json({ msg: "Invalid schedule id." });
  }

  try {
    const schedule = await DoctorSchedule.findOne({
      _id: req.params.scheduleId,
      doctor_id: String(req.user._id),
    });
    if (!schedule) return res.status(404).json({ msg: "Schedule not found." });

    const doctorName = getDoctorDisplayName(req.user);
    const existingAppointment = await Appointment.findOne({
      date: schedule.date,
      $or: [
        { doctor_id: String(req.user._id) },
        { doctor_id: { $exists: false }, doctor_name: doctorName },
      ],
    });
    if (existingAppointment) {
      return res.status(409).json({ msg: "This schedule has appointments booked and cannot be removed." });
    }

    await DoctorSchedule.deleteOne({ _id: schedule._id });
    return res.status(200).json({ msg: "Schedule removed successfully." });
  } catch (error) {
    console.error("Could not remove doctor schedule:", error);
    return res.status(500).json({ msg: "Could not remove doctor schedule" });
  }
});

router.get("/doctors/:doctorId/schedules", checkAuth.normalUer, async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.doctorId)) {
    return res.status(400).json({ msg: "Invalid doctor id." });
  }

  const from = parseDateOnly(req.query.from);
  const to = parseDateOnly(req.query.to);
  if (!from || !to || to < from) {
    return res.status(400).json({ msg: "Please provide a valid schedule date range." });
  }

  try {
    const doctorData = await doctor.findById(req.params.doctorId).select("fname lname");
    if (!doctorData) return res.status(404).json({ msg: "Doctor not found." });

    const toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const doctorName = getDoctorDisplayName(doctorData);
    const schedules = await DoctorSchedule.find({
      doctor_id: req.params.doctorId,
      status: "Active",
      date: { $gte: from, $lt: toExclusive },
    }).sort({ date: 1, start_time: 1 });
    const appointments = await Appointment.find({
      date: { $gte: from, $lt: toExclusive },
      $or: [
        { doctor_id: req.params.doctorId },
        { doctor_id: { $exists: false }, doctor_name: doctorName },
      ],
    }).select("time date -_id");
    const bookedTimesByDate = new Map();
    appointments.forEach((appointment) => {
      const dateKey = formatDateOnly(appointment.date);
      if (!bookedTimesByDate.has(dateKey)) bookedTimesByDate.set(dateKey, new Set());
      const time = appointmentTimeToMinutes(appointment.time);
      if (time !== null) bookedTimesByDate.get(dateKey).add(time);
    });

    return res.status(200).json({
      data: schedules.map((schedule) => {
        const bookedTimes = bookedTimesByDate.get(formatDateOnly(schedule.date)) || new Set();
        return {
          ...formatSchedule(schedule),
          slots: getScheduleSlots(
            schedule.start_time,
            schedule.end_time,
            schedule.consultation_minutes,
          ).filter((time) => !bookedTimes.has(appointmentTimeToMinutes(time))),
        };
      }),
    });
  } catch (error) {
    console.error("Could not fetch available doctor schedules:", error);
    return res.status(500).json({ msg: "Could not fetch available doctor schedules" });
  }
});

export default router;
