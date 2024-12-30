const express = require("express");
const {
  registerUser,
  verifyOtp,
  loginUser,
  getCurrentUserDetails,
} = require("../Controller/userController"); // Import controller functions
const jwtMiddleware = require("../Middleware/authMiddleware");
const authorizeRoles = require("../Middleware/roleMiddleware");

const router = new express.Router();

// Define routes
router.post("/register", registerUser); // Route for registration and sending OTP
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
// router.post("/forget-password", forgetPassword); // Route for initiating forget password process
// router.post("/verify-password-otp", verifyOtpForPasswordReset); // Route for verifying OTP for password reset
// router.post("/reset-password", resetPassword);
router.get(
  "/admin-profile",
  jwtMiddleware,
  authorizeRoles("admin"),
  getCurrentUserDetails
);
router.get(
  "/user-profile",
  jwtMiddleware,
  authorizeRoles("admin", "user"),
  getCurrentUserDetails
);

module.exports = router;
