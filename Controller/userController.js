const users = require("../Models/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

let user;
let otpStore = {}; // Temporary store for OTPs linked to emails

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User (Step 1: Send OTP)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json("All fields are required");
    }

    // Check for existing user
    const existingUser = await users.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json("Email or Phone already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // Store OTP with expiry (10 minutes)

    user = {
      name,
      email,
      phone,
      password: hashedPassword,
    };

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Whiter Registration",
      text: `<#> ${otp} is the One Time Password (OTP) for your login to the Whiter Web App. OTP is valid for the next 10 minutes. Please do not share with anyone.`,
    };
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json("OTP sent to your email. Please verify within 10 minutes.");
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json("Server Error");
  }
};

// Verify OTP and Finalize Registration (Step 2)
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const enteredOtp = otp.toString();
    // Check OTP validity
    const storedOtp = otpStore[user.email];

    if (!storedOtp) {
      return res.status(400).json("No OTP found. Please request again.");
    }
    if (storedOtp.otp !== enteredOtp) {
      return res.status(401).json("Invalid OTP");
    }
    if (Date.now() > storedOtp.expires) {
      delete otpStore[user.email];
      return res.status(401).json("OTP expired. Please request again.");
    }

    // Save user to the database
    const newUser = new users({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password, // Make sure hashed password is passed
    });

    await newUser.save();
    delete otpStore[user.email]; // Clear OTP after successful registration

    res.status(201).json("Registration Successful");
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json("Server Error");
  }
};
