import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import Appointment from "../modal/appointment.js";
import DoctorSchedule from "../modal/schedule.js";
import { doctor } from "../modal/doctor.js";
import Otp from "../modal/reset-password.js";
import user from "../modal/user.js";
import { allUser } from "../middleware/check-auth.js";
import {
  appointmentTimeToMinutes,
  getScheduleSlots,
  parseDateOnly,
} from "../services/schedule.js";

const response = () => ({
  statusCode: undefined,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("Mongoose models expose query methods", () => {
  for (const model of [Appointment, DoctorSchedule, doctor, Otp, user]) {
    assert.equal(typeof model.findOne, "function");
    assert.equal(typeof model.countDocuments, "function");
  }
});

test("appointment slots have a unique doctor-date-time index", () => {
  const hasUniqueSlotIndex = Appointment.schema.indexes().some(([fields, options]) => (
    fields.doctor_id === 1
    && fields.date === 1
    && fields.time === 1
    && options.unique === true
  ));

  assert.equal(hasUniqueSlotIndex, true);
});

test("auth middleware rejects requests without a bearer token", () => {
  const res = response();
  let nextCalled = false;

  allUser({ headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.msg, "Invalid Token");
});

test("auth middleware accepts a valid token for an allowed role", () => {
  const secret = "test-only-secret";
  process.env.API_USER_AUTH_KEY = secret;
  const token = jwt.sign({ user: { user_type: "doctor_user" } }, secret);
  const res = response();
  let nextCalled = false;

  const req = { headers: { authorization: `Bearer ${token}` } };
  allUser(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
  assert.equal(req.user.user_type, "doctor_user");
});

test("schedule slots use the consultation duration and exclude incomplete visits", () => {
  assert.deepEqual(getScheduleSlots("09:00", "10:00", 30), ["09:00 AM", "09:30 AM"]);
  assert.deepEqual(
    getScheduleSlots("09:00", "16:00", 60),
    ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"],
  );
  assert.deepEqual(getScheduleSlots("11:30", "13:00", 30), ["11:30 AM", "12:00 PM", "12:30 PM"]);
  assert.deepEqual(getScheduleSlots("09:00", "09:20", 30), []);
});

test("appointment times normalize legacy and schedule labels to minutes", () => {
  assert.equal(appointmentTimeToMinutes("09:30 AM"), 570);
  assert.equal(appointmentTimeToMinutes("12:00 AM"), 0);
  assert.equal(appointmentTimeToMinutes("12:00 PM"), 720);
  assert.equal(appointmentTimeToMinutes("14:30"), 870);
  assert.equal(appointmentTimeToMinutes("invalid"), null);
});

test("date-only values reject invalid calendar dates", () => {
  assert.equal(parseDateOnly("2026-11-13").toISOString(), "2026-11-13T00:00:00.000Z");
  assert.equal(parseDateOnly("2026-02-30"), null);
});
