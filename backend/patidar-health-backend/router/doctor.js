import express from "express";
import { doctor } from "../modal/doctor.js";
import * as checkAuth from "../middleware/check-auth.js";

const router = express.Router();

router.get("/doctors", checkAuth.allUser, async (req, res) => {
  try {
    const result = await doctor.find({}, { specialist: 1, fname: 1, lname: 1, _id: 1 });
    res.status(200).json(result);
  } catch (error) {
    console.error("Could not fetch doctors:", error);
    res.status(500).json({ msg: "Could not fetch doctors" });
  }
});

export default router;
