import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expireIn: Number,
  createdAt: { type: Date, expires: "3m", default: Date.now },
});

const Otp = mongoose.model("Otp", otpSchema, "Otp");

export default Otp;
