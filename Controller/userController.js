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

// Login User and Generate JWT Token
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json("Email and Password are required");
    }

    // Find user by email
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json("Invalid password");
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SUPERKEY, // JWT secret key, should be in environment variables
      { expiresIn: "1h" } // Token expiration time (1 hour)
    );

    res.status(200).json({
      message: "Login successful",
      token, // Return the generated JWT token
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json("Server Error");
  }
};

// Step 1: Send OTP for Password Reset
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json("Email is required");
    }

    // Check if user exists
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // Store OTP with 10-minute expiry

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `${otp} is the OTP for resetting your password. It is valid for the next 10 minutes. Please do not share it with anyone.`,
    };
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json("OTP sent to your email. Please verify within 10 minutes.");
  } catch (error) {
    console.error("Error in forgetPassword:", error);
    res.status(500).json("Server Error");
  }
};

// Step 2: Verify OTP for Password Reset
exports.verifyOtpForPasswordReset = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input fields
    if (!email || !otp) {
      return res.status(400).json("Email and OTP are required");
    }

    // Check OTP validity
    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json("No OTP found. Please request again.");
    }
    if (storedOtp.otp !== otp.toString()) {
      return res.status(401).json("Invalid OTP");
    }
    if (Date.now() > storedOtp.expires) {
      delete otpStore[email];
      return res.status(401).json("OTP expired. Please request again.");
    }

    res.status(200).json("OTP verified successfully");
  } catch (error) {
    console.error("Error in verifyOtpForPasswordReset:", error);
    res.status(500).json("Server Error");
  }
};

// Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json("All fields are required");
    }

    // Check OTP validity
    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json("No OTP found. Please request again.");
    }
    if (storedOtp.otp !== otp.toString()) {
      return res.status(401).json("Invalid OTP");
    }
    if (Date.now() > storedOtp.expires) {
      delete otpStore[email];
      return res.status(401).json("OTP expired. Please request again.");
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password in the database
    await users.updateOne({ email }, { password: hashedPassword });

    delete otpStore[email]; // Clear OTP after successful password reset

    res.status(200).json("Password reset successful");
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json("Server Error");
  }
};

exports.getCurrentUserDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(userId);
    const user = await users.findById(userId).select("-password"); // Exclude the password
    console.log(user);
    res.status(200).json({
      user, // Return the generated JWT token
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json("Server Error");
  }
};
