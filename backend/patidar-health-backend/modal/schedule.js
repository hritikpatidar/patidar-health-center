import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  doctor_name: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  consultation_minutes: { type: Number, required: true },
  status: { type: String, enum: ["Active"], default: "Active" },
}, { timestamps: true });

scheduleSchema.index({ doctor_id: 1, date: 1 }, { unique: true });

const DoctorSchedule = mongoose.model("DoctorSchedule", scheduleSchema);

export default DoctorSchedule;
