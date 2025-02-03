const users = require("../Models/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { blacklistToken } = require("../Middleware/authMiddleware");
const cart = require("../Models/cartSchema");

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
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json("All fields are required");
    }

    // Verify that the request is coming from an existing admin
    const loggedInUser = req.user; // Assuming you're using middleware to get the logged-in user
    if (!loggedInUser || loggedInUser.role !== "admin") {
      return res
        .status(403)
        .json("You are not authorized to register an admin.");
    }

    // Check for existing user
    const existingUser = await users.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json("Email or Phone already exists");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // Store OTP with expiry (10 minutes)

    // Send OTP Email (ensure transporter is set up correctly)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Admin Registration",
      text: `<#> ${otp} is the One Time Password (OTP) for your admin registration to the Whiter Web App. OTP is valid for the next 10 minutes. Please do not share with anyone.`,
    };
    await transporter.sendMail(mailOptions);

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    user = new users({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
    });
    res
      .status(200)
      .json("OTP sent to your email. Please verify within 10 minutes.");
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res.status(500).json("Server Error");
  }
};
// Resend OTP Endpoint
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the request
    if (!email) {
      return res.status(400).json("Email is required.");
    }
    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // New OTP with expiry

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Whiter Registration",
      text: `<#> ${otp} is the One Time Password (OTP) for your login to the Whiter Web App. OTP is valid for the next 10 minutes. Please do not share with anyone.`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json("OTP has been resent to your email!");
  } catch (error) {
    console.error("Error in resendOtp:", error);
    res.status(500).json("Server Error");
  }
};

// Verify OTP and Finalize Registration (Step 2)
exports.verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    const enteredOtp = otp.toString();
    // Check OTP validity
    const storedOtp = otpStore[email];

    if (!storedOtp) {
      return res.status(400).json("No OTP found. Please request again.");
    }
    if (storedOtp.otp !== enteredOtp) {
      return res.status(401).json("Invalid OTP");
    }
    if (Date.now() > storedOtp.expires) {
      delete otpStore[email];
      return res.status(401).json("OTP expired. Please request again.");
    }

    // Save user to the database
    const newUser = new users({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password, // Make sure hashed password is passed
      role: user.role ? user.role : "user",
    });

    const savedUser = await newUser.save();
    delete otpStore[user.email]; // Clear OTP after successful registration

    const newCart = new cart({
      userId: savedUser._id,
      items: [], // Initialize with an empty array
    });

    await newCart.save();
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
      { expiresIn: "8h" } // Token expiration time (1 hour)
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
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

// Resend OTP Endpoint
exports.resendOtpResetPass = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the request
    if (!email) {
      return res.status(400).json("Email is required.");
    }

    // Find the user in the database
    const user = await users.findOne({ email });

    // Validate if user exists and is not verified
    if (!user) {
      return res.status(404).json("User not found.");
    }

    if (user.isVerified) {
      return res.status(400).json("User is already verified.");
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Registration",
      text: `<#> ${otp} is the One Time Password (OTP) for your login. OTP is valid for the next 10 minutes. Please do not share it with anyone.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json("OTP has been resent to your email!");
  } catch (error) {
    console.error("Error in resendOtp:", error);
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

exports.logoutUser = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(400).json("Token is required for logout");
  }

  blacklistToken(token); // Invalidate the token by adding it to the blacklist
  res.status(200).json("Logout successful");
};

exports.getCurrentUserDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    // console.log(userId);
    const user = await users.findById(userId).select("-password")
    // console.log(user);
    res.status(200).json({
      user, // Return the generated JWT token
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json("Server Error");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    // Get the user ID from the request parameters
    const userId = req.params.id;

    // Find the existing user by ID
    const existingUser = await users.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Object to hold updated user data
    const updatedData = {};

    // If fields are provided, update them
    if (name && name !== existingUser.name) {
      updatedData.name = name;
    }

    if (email && email !== existingUser.email) {
      // Optional: check if email is already in use by another user
      const emailInUse = await users.findOne({ email });
      if (emailInUse && emailInUse._id !== userId) {
        return res.status(400).json({ message: "Email already in use." });
      }
      updatedData.email = email;
    }
    if (phone && phone !== existingUser.phone) {
      // Optional: check if email is already in use by another user
      const phoneInUse = await users.findOne({ phone });
      if (phoneInUse && phoneInUse._id !== userId) {
        return res
          .status(400)
          .json({ message: "Phone Number already in use." });
      }
      updatedData.phone = phone;
    }

    if (role && role !== existingUser.role) {
      updatedData.role = role;
    }

    // If no updates are found, return a response saying no changes detected
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    // Update the user data in the database
    const updatedUser = await users.findByIdAndUpdate(userId, updatedData, {
      new: true, // This ensures the updated user is returned
    });

    return res
      .status(200)
      .json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
