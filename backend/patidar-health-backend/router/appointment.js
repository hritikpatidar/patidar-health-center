import express from "express";
import { body, validationResult } from "express-validator";
import Appointment from "../modal/appointment.js";
import DoctorSchedule from "../modal/schedule.js";
import { doctor } from "../modal/doctor.js";
import * as checkAuth from "../middleware/check-auth.js";
import {
  appointmentTimeToMinutes,
  getScheduleSlots,
  parseDateOnly,
} from "../services/schedule.js";

const router = express.Router();

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const size = Math.min(Math.max(Number.parseInt(query.size, 10) || 5, 1), 100);
  return { page, size, skip: (page - 1) * size };
};

router.post(
  "/appointment",
  checkAuth.normalUer,
  body("name").notEmpty().withMessage("please enter your name!"),
  body("email").notEmpty().withMessage("please enter your email!").isEmail().withMessage("invalid email!"),
  body("mobile")
    .notEmpty()
    .withMessage("please enter you mobile number!")
    .isLength({ min: 10, max: 10 })
    .withMessage("please enter valid number!")
    .isNumeric()
    .withMessage("number must be numeric!"),
  body("date").notEmpty().withMessage("please select date!"),
  body("query_category").notEmpty().withMessage("please select query category!"),
  body("doctor_id").isMongoId().withMessage("Please select a valid doctor."),
  body("time").notEmpty().withMessage("Please select an available time."),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const date = parseDateOnly(req.body.date);
    if (!date) return res.status(400).json({ msg: "Please enter a valid appointment date." });
    if (date < new Date(new Date().toISOString().slice(0, 10))) {
      return res.status(400).json({ msg: "An appointment cannot be booked for a past date." });
    }
    if (String(req.user._id) !== String(req.body.user_id)) {
      return res.status(403).json({ msg: "You can only book an appointment for your own account." });
    }

    try {
      const selectedDoctor = await doctor.findById(req.body.doctor_id).select("fname lname specialist");
      if (!selectedDoctor || selectedDoctor.specialist !== req.body.query_category) {
        return res.status(400).json({ msg: "The selected doctor does not match this specialty." });
      }

      const schedule = await DoctorSchedule.findOne({
        doctor_id: String(selectedDoctor._id),
        date,
        status: "Active",
      });
      if (!schedule) {
        return res.status(409).json({ msg: "This doctor is not available on the selected date." });
      }

      const doctorName = [selectedDoctor.fname, selectedDoctor.lname].filter(Boolean).join(" ");
      const appointments = await Appointment.find({
        date: schedule.date,
        $or: [
          { doctor_id: String(selectedDoctor._id) },
          { doctor_id: { $exists: false }, doctor_name: doctorName },
        ],
      }).select("time -_id");
      const bookedTimes = new Set(
        appointments
          .map((appointment) => appointmentTimeToMinutes(appointment.time))
          .filter((time) => time !== null),
      );
      const availableSlots = getScheduleSlots(
        schedule.start_time,
        schedule.end_time,
        schedule.consultation_minutes,
      );
      const requestedTime = appointmentTimeToMinutes(req.body.time);
      if (requestedTime === null || !availableSlots.includes(req.body.time) || bookedTimes.has(requestedTime)) {
        return res.status(409).json({ msg: "This time slot is no longer available. Please choose another." });
      }

      await new Appointment({
        user_id: String(req.user._id),
        name: [req.user.fname, req.user.lname].filter(Boolean).join(" "),
        email: req.user.email,
        mobile: req.user.mobile,
        query_category: selectedDoctor.specialist,
        time: req.body.time,
        doctor_name: doctorName,
        doctor_id: String(selectedDoctor._id),
        date,
      }).save();
      return res.status(201).json({ msg: "appointment booked successfully!" });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ msg: "This time slot was just booked. Please choose another." });
      }
      console.error("Could not book appointment:", error);
      return res.status(500).json({ msg: "Could not book appointment" });
    }
  },
);

router.get("/appointment", checkAuth.suerAdmin, async (req, res) => {
  try {
    const { page, size, skip } = getPagination(req.query);
    const [count, docs] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.find().sort({ date: -1 }).skip(skip).limit(size),
    ]);
    return res.status(200).json({
      data: docs,
      meta: { total: count, pageCount: Math.ceil(count / size), page, size },
    });
  } catch (error) {
    console.error("Could not fetch appointments:", error);
    return res.status(500).json({ msg: "Could not fetch appointments" });
  }
});

router.get("/appointment/:id", checkAuth.allUser, async (req, res) => {
  try {
    const { page, size, skip } = getPagination(req.query);
    const filter = { user_id: req.params.id };
    const [data, total] = await Promise.all([
      Appointment.find(filter).sort({ date: -1 }).skip(skip).limit(size),
      Appointment.countDocuments(filter),
    ]);
    return res.status(200).json({
      data,
      meta: { total, pageCount: Math.ceil(total / size), page, size },
    });
  } catch (error) {
    console.error("Could not fetch appointments:", error);
    return res.status(500).json({ msg: "Could not fetch appointments" });
  }
});

router.get("/appointment/find/:doctorname", checkAuth.doctorAuth, async (req, res) => {
  try {
    const { page, size, skip } = getPagination(req.query);
    const filter = { doctor_name: req.params.doctorname };
    const [data, total] = await Promise.all([
      Appointment.find(filter).skip(skip).limit(size),
      Appointment.countDocuments(filter),
    ]);
    return res.status(200).json({
      data,
      meta: { total, pageCount: Math.ceil(total / size), page, size },
    });
  } catch (error) {
    console.error("Could not fetch appointments:", error);
    return res.status(500).json({ msg: "Could not fetch appointments" });
  }
});

router.delete("/appointment/:id", checkAuth.allUser, async (req, res) => {
  try {
    const result = await Appointment.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: "Appointment id not found" });
    }
    return res.status(200).json({ msg: "Appointment Deleted Successfully!" });
  } catch (error) {
    console.error("Could not delete appointment:", error);
    return res.status(400).json({ msg: "Appointment id not found" });
  }
});

export default router;
