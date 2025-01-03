const jwt = require("jsonwebtoken");
const users = require("../Models/userSchema");

const verifyAdmin = async (req, res, next) => {
  try {
    const token =req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header
    if (!token) {
      return res.status(401).json("Authorization token is missing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SUPERKEY); // Verify the token
    const user = await users.findById(decoded.userId); // Find the user by ID (this is a better approach than using findOne)


    if (!user || user.role !== "admin") {
      return res.status(403).json("You are not authorized");
    }

    req.user = user; // Attach user to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error("Error in verifyAdmin middleware:", error);
    return res.status(401).json("Invalid or expired token");
  }
};

module.exports = verifyAdmin;
