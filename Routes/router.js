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
  updateUser,
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
  deleteProduct,
  updateProduct,
  getProductBySku,
} = require("../Controller/productController");
const {
  addReview,
  getReviews,
  deleteReview,
  updateReview,
} = require("../Controller/reviewController");
const {
  addToCart,
  viewCart,
  deleteAllCart,
  deleteFromCart,
  updateCartItem,
} = require("../Controller/cartController");

const router = new express.Router();

// Define routes
router.post("/register", registerUser); // Route for registration and sending OTP
router.post("/register-admin", verifyAdmin, registerAdmin);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.patch("/update-user/:id", jwtMiddleware, updateUser);
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
router.patch(
  "/update-category/:id",
  verifyAdmin,
  setUploadMiddleware("category"),
  multerConfig.single("thumbnail_image"),
  updateCategory
);
router.delete(
  "/delete-category/:id",
  jwtMiddleware,
  verifyAdmin,
  deleteCategory
);
router.post(
  "/create-product",
  verifyAdmin,
  setUploadMiddleware("product"),
  multerConfig.array("imageUrls", 5),
  createProduct
);
router.get("/get-all-products", getAllProducts);
router.get("/get-product/:sku", getProductBySku);
router.patch(
  "/update-product/:id",
  verifyAdmin,
  setUploadMiddleware("product"),
  multerConfig.array("imageUrls", 5),
  updateProduct
);
router.delete("/delete-product/:id", verifyAdmin, deleteProduct);
router.post("/add-review", jwtMiddleware, addReview);
router.get("/get-reviews/:id", getReviews);
router.delete("/delete-review/:id", jwtMiddleware, deleteReview);
router.patch("/update-review/:id", jwtMiddleware, updateReview);
router.post("/add-to-cart", jwtMiddleware, addToCart);
router.get("/view-all-cart", jwtMiddleware, viewCart);
router.delete("/delete-all-cart", jwtMiddleware, deleteAllCart);
router.delete("/delete-from-cart/:id", jwtMiddleware, deleteFromCart);
router.patch("/update-cart/:id", jwtMiddleware, updateCartItem); // Update quantity or size of an item in the cart

module.exports = router;
