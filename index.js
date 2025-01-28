require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("./Connections/db");
const router = require("./Routes/router");
const path = require("path");

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS error: Unauthorized request."));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const whiterServer = express();
whiterServer.use(helmet());
whiterServer.use(cors(corsOptions));
whiterServer.use(express.json());
whiterServer.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  message: "Too many requests from this IP, please try again later.",
});
whiterServer.use(limiter);
whiterServer.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
});
whiterServer.use("/api", router);
whiterServer.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 4000;

whiterServer.listen(PORT, () => {
  console.log(`Whiter server started on port ${PORT}`);
});

whiterServer.get("/", (req, res) => {
  res.send("<h1>Daily Whiter Started... Waiting for Client requests...!!</h1>");
});

// Centralized error handling
whiterServer.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});
