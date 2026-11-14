import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  username: String,
  password: String,
  email: String,
  mobile: Number,
  specialist: String,
  gender: String,
  country: String,
  state: String,
  user_type: {
    type: String,
    default: "doctor_user",
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const doctor = mongoose.model("Doctor", doctorSchema);

export { doctor };
