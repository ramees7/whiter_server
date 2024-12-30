const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Invalid Email Address"],
    },
    role: {
      type: String,
      enum: ["admin", "user"], // Only 'admin' or 'user' are valid roles
      default: "user", // Default role is 'user'
    },
  },
  { timestamps: true }
);

const users = mongoose.model("users", userSchema);
module.exports = users;
