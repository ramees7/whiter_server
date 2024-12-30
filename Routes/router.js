const express = require("express");
const { registerUser, verifyOtp } = require("../Controller/userController"); // Import controller functions

const router = new express.Router();

// Define routes
router.post("/register", registerUser); // Route for registration and sending OTP
router.post("/verify-otp", verifyOtp); // Route for verifying OTP

module.exports = router;
