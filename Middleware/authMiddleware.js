const jwt = require("jsonwebtoken");

// JWT Middleware for Authorization
const jwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json("Authorization token is missing");
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SUPERKEY);
    req.user = decoded; // Attach user data (decoded payload) to the request object
    next(); // Pass control to the next middleware/route handler
  } catch (error) {
    return res.status(401).json("Invalid or expired token");
  }
};

module.exports = jwtMiddleware;
