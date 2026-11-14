import bcrypt from "bcrypt";
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import OtpCreate from "../modal/reset-password.js";
import userCreate from "../modal/user.js";
import { doctor } from "../modal/doctor.js";

const router = express.Router();

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const size = Math.min(Math.max(Number.parseInt(query.size, 10) || 5, 1), 100);
  return { page, size, skip: (page - 1) * size };
};

const sendResetEmail = async (email, otp) => {
  const { SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured to send reset emails");
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  await transport.sendMail({
    from: SMTP_USER,
    to: email,
    subject: "Password Change",
    html: `<p>Use OTP: ${otp} to update your password on the Giri-healths Portal.</p>`,
  });
};

router.post(
  "/user/create",
  body("fname").notEmpty().withMessage("Please enter your first name"),
  body("lname").notEmpty().withMessage("Please enter your last name"),
  body("email").notEmpty().withMessage("Please enter you email").isEmail().withMessage("Invalid email"),
  body("mobile")
    .notEmpty()
    .withMessage("Please enter mobile number!")
    .isLength({ min: 10, max: 10 })
    .withMessage("Invalid mobile number!"),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 chars long")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    try {
      const existingUser = await userCreate.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ msg: "Email already in use!" });
      }

      const password = await bcrypt.hash(req.body.password, 10);
      await new userCreate({ ...req.body, password }).save();
      return res.status(201).json({ msg: "User Created Successfully!" });
    } catch (error) {
      console.error("Could not create user:", error);
      return res.status(500).json({ msg: "Could not create user" });
    }
  },
);

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userCreate.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "email or password is wrong!" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    const token = jwt.sign({ user: safeUser }, process.env.API_USER_AUTH_KEY, {
      expiresIn: "24h",
    });
    return res.status(200).json({ user: safeUser, token });
  } catch (error) {
    console.error("Could not log in user:", error);
    return res.status(500).json({ msg: "Could not log in" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { page, size, skip } = getPagination(req.query);
    const [count, docs] = await Promise.all([
      userCreate.countDocuments(),
      userCreate.find().select("-password").skip(skip).limit(size),
    ]);
    return res.status(200).json({
      data: docs,
      meta: { total: count, pageCount: Math.ceil(count / size), page, size },
    });
  } catch (error) {
    console.error("Could not fetch users:", error);
    return res.status(500).json({ msg: "Could not fetch users" });
  }
});

router.post("/users/email-send", async (req, res) => {
  try {
    const user = await userCreate.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: "Email isn't exist!" });
    }

    const randOtp = Math.floor(Math.random() * 900000 + 100000);
    const otpData = new OtpCreate({
      email: req.body.email,
      otp: randOtp,
      expireIn: Date.now() + 300_000,
    });
    await otpData.save();
    await sendResetEmail(otpData.email, randOtp);
    return res.status(200).json({ msg: "Please check your email id" });
  } catch (error) {
    console.error("Could not send reset email:", error);
    return res.status(500).json({ msg: "Could not send reset email" });
  }
});

router.put(
  "/users/fogot-pass",
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 chars long")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    try {
      const result = await OtpCreate.findOne({ otp: req.body.otp, email: req.body.email });
      if (!result) {
        return res.status(400).json({ msg: "Invalid Otp" });
      }
      if (result.expireIn < Date.now()) {
        return res.status(400).json({ msg: "otp has been expire!" });
      }

      const password = await bcrypt.hash(req.body.password, 10);
      await userCreate.updateOne({ email: req.body.email }, { password });
      return res.status(200).json({ msg: "Password Changed Successfully!" });
    } catch (error) {
      console.error("Could not change password:", error);
      return res.status(500).json({ msg: "Could not change password" });
    }
  },
);

router.post(
  "/user/doctor",
  body("fname").notEmpty().withMessage("Please enter your first name!"),
  body("lname").notEmpty().withMessage("Please enter your last name!"),
  body("username")
    .notEmpty()
    .withMessage("Please enter your username!")
    .isLength({ min: 6 })
    .withMessage("Username must be at least 5 chars long!"),
  body("password")
    .notEmpty()
    .withMessage("Please enter your password!")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 5 chars long!"),
  body("email").notEmpty().withMessage("Please enter valid email!").isEmail(),
  body("mobile")
    .notEmpty()
    .withMessage("Please enter mobile number!")
    .isLength({ min: 10, max: 10 })
    .withMessage("Invalid mobile number!"),
  body("specialist").notEmpty().withMessage("Please enter your specialisties!"),
  body("gender").notEmpty().withMessage("Please select your gender!"),
  body("country").notEmpty().withMessage("Please select your country!"),
  body("state").notEmpty().withMessage("Please select your state!"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    try {
      const emailCheck = await doctor.findOne({ email: req.body.email });
      if (emailCheck) {
        return res.status(400).json({ msg: "Email is already in use!" });
      }

      const password = await bcrypt.hash(req.body.password, 10);
      await new doctor({ ...req.body, password }).save();
      return res.status(201).json({ msg: "User Registered successfully..." });
    } catch (error) {
      console.error("Could not register doctor:", error);
      return res.status(500).json({ msg: "Could not register doctor" });
    }
  },
);

router.post("/user/doctor-login", async (req, res) => {
  try {
    const user = await doctor.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).json({ msg: "User Email or password is wrong!" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    const token = jwt.sign({ user: safeUser }, process.env.API_USER_AUTH_KEY, {
      expiresIn: "24h",
    });
    return res.status(200).json({ user: safeUser, token });
  } catch (error) {
    console.error("Could not log in doctor:", error);
    return res.status(500).json({ msg: "Could not log in" });
  }
});

export default router;
