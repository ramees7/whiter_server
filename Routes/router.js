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
  getAllUsers,
  deleteUser,
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
// const setUploadMiddleware = require("../Middleware/uploadMiddleware");
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
const {
  createRazorpayOrder,
  processPaymentAndOrder,
} = require("../Controller/orderController");
const setUploadMiddleware = require("../Middleware/imageMiddleware");

const router = new express.Router();

// Define routes
router.post("/register", registerUser); // Route for registration and sending OTP
router.post("/register-admin", verifyAdmin, registerAdmin);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.patch("/update-user/:id", jwtMiddleware, updateUser);
router.post("/logout", jwtMiddleware, logoutUser);
router.delete("/delete-user/:id", jwtMiddleware, deleteUser);
router.post("/forget-password", forgetPassword);
router.post("/resend-otp-forget", resendOtpResetPass);
router.post("/verify-password-otp", verifyOtpForPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/admin-profile", jwtMiddleware, verifyAdmin, getCurrentUserDetails);
router.get("/user-profile", jwtMiddleware, getCurrentUserDetails);
router.get("/all-users", verifyAdmin, getAllUsers);
router.post(
  "/create-category",
  verifyAdmin, // Verifies the user is an admin
  setUploadMiddleware("categories").single("thumbnail_image"), // Handles the file upload
  createCategory // Controller function
);
router.get("/get-categories", getAllCategories);
router.get("/get-category/:id", getCategoryById);
router.patch(
  "/update-category/:id",
  verifyAdmin,
  setUploadMiddleware("categories").single("thumbnail_image"),
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
  setUploadMiddleware("products").array("imageUrls", 5),
  createProduct
);
// router.post(
//   "/create-product",
//   verifyAdmin,
//   setUploadMiddleware("product"),
//   multerConfig.array("imageUrls", 5),
//   createProduct
// );
router.get("/get-all-products", getAllProducts);
router.get("/get-product/:sku", getProductBySku);
router.patch(
  "/update-product/:sku",
  verifyAdmin,
  setUploadMiddleware("products").array("imageUrls", 5),
  updateProduct
);
router.delete("/delete-product/:id", verifyAdmin, deleteProduct);
router.post("/add-review", jwtMiddleware, addReview);
router.get("/get-reviews", verifyAdmin, getReviews);
router.delete("/delete-review/:id", jwtMiddleware, deleteReview);
router.patch("/update-review/:id", jwtMiddleware, updateReview);
router.post("/add-to-cart", jwtMiddleware, addToCart);
router.get("/view-all-cart", jwtMiddleware, viewCart);
router.delete("/delete-all-cart", jwtMiddleware, deleteAllCart);
router.delete("/delete-from-cart/:id", jwtMiddleware, deleteFromCart);
router.patch("/update-cart/:id", jwtMiddleware, updateCartItem); // Update quantity or size of an item in the cart
router.post("/create-razorpay-order", jwtMiddleware, createRazorpayOrder);
router.post("/verify-razorpay-payment", jwtMiddleware, processPaymentAndOrder);

module.exports = router;
