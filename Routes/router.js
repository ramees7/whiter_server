const express = require("express");
const {
  registerUser,
  verifyOtp,
  loginUser,
  getCurrentUserDetails,
  forgetPassword,
  resetPassword,
  verifyOtpForPasswordReset,
  logoutUser,
  resendOtp,
  resendOtpResetPass,
  registerAdmin,
} = require("../Controller/userController"); // Import controller functions
const { jwtMiddleware } = require("../Middleware/authMiddleware");
const verifyAdmin = require("../Middleware/adminMiddleware");
const {
  deleteCategory,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} = require("../Controller/categoryController");
const multerConfig = require("../Middleware/imageMiddleware");
const setUploadMiddleware = require("../Middleware/uploadMiddleware");
const {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateProduct,
} = require("../Controller/productController");

const router = new express.Router();

// Define routes
router.post("/register", registerUser); // Route for registration and sending OTP
router.post("/register-admin", verifyAdmin, registerAdmin);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.post("/logout", jwtMiddleware, logoutUser);
router.post("/forget-password", forgetPassword);
router.post("/resend-otp-forget", resendOtpResetPass);
router.post("/verify-password-otp", verifyOtpForPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/admin-profile", jwtMiddleware, verifyAdmin, getCurrentUserDetails);
router.get("/user-profile", jwtMiddleware, getCurrentUserDetails);
router.post(
  "/create-category",
  verifyAdmin, // Verifies the user is an admin
  setUploadMiddleware("category"), // Sets the folder context to "categories"
  multerConfig.single("thumbnail_image"), // Handles the file upload
  createCategory // Controller function
);
router.get("/get-categories", getAllCategories);
router.get("/get-category/:id", getCategoryById);
// router.put(
//   "/updatecategory/:id",
//   verifyAdmin,
//   setUploadMiddleware("category"), // Sets the folder context to "categories"
//   multerConfig.single("thumbnail_image"),
//   updateCategory
// );
router.patch(
  "/updatecategory/:id",
  verifyAdmin,
  setUploadMiddleware("category"), // Sets the folder context to "categories"
  multerConfig.single("thumbnail_image"), // Ensure the image field is handled
  updateCategory
);
router.delete("/delete-category/:id", verifyAdmin, deleteCategory);
router.post(
  "/create-product",
  verifyAdmin,
  setUploadMiddleware("product"),
  multerConfig.array("imageUrls", 5),
  createProduct
);
router.get("/get-all-products", getAllProducts);
router.get("/get-product/:id", getProductById);
router.patch(
  "/update-product/:id",
  verifyAdmin,
  setUploadMiddleware("product"),
  multerConfig.array("imageUrls", 5),
  updateProduct
);
router.delete("/delete-product/:id", verifyAdmin, deleteProduct);

module.exports = router;
