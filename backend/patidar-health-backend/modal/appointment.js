import mongoose from "mongoose";

const appointmentShema = new mongoose.Schema({
  user_id: String,
  name: String,
  email: String,
  mobile: Number,
  query_category: String,
  time: String,
  doctor_name: String,
  doctor_id: String, 
  date: Date,
}); 

appointmentShema.index(
  { doctor_id: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { doctor_id: { $exists: true } } },
);

const Appointment = mongoose.model("Appointment", appointmentShema);

export default Appointment;
