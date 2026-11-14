import mongoose from "mongoose";

const userCreateSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: Number, required: true },
  active: { type: Boolean, default: true },
  user_type: { type: String, default: "normal_user" },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const user = mongoose.model("User", userCreateSchema);

export default user;
