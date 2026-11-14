import cors from "cors";
import express from "express";
import "dotenv/config";
import connectDB from "./db/db.js";
import appointmentRoute from "./router/appointment.js";
import doctorsRoutes from "./router/doctor.js";
import scheduleRoutes from "./router/schedule.js";
import userRoute from "./router/user.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(cors());
app.use("/api", userRoute);
app.use("/api", appointmentRoute);
app.use("/api", doctorsRoutes);
app.use("/api", scheduleRoutes);
app.use((req, res) => {
  res.status(404).json({ msg: "Url Not Found!" });
});

const start = async () => {
  await connectDB();
  app.listen(port, () => console.log(`Server is running on port ${port}`));
};

start().catch((error) => {
  console.error("Could not start the server:", error.message);
  process.exitCode = 1;
});
