const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", // Assuming you have a User model for the authenticated user
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products", // Assuming you have a Product model for the products in your store
        required: true,
      },
      quantity: {
        type: String,
        required: true,
        min: 1, // Quantity should be at least 1
      },
      size: {
        type: String, // You can adjust the type as per the size options (Small, Medium, Large, etc.)
        required: true,
      },
      sku: {
        type: String,
        required: true, // Unique SKU for the product variant
      },
      productTitle: {
        type: String,
        required: true, // Unique SKU for the product variant
      },
      productThumbnail: {
        type: String,
        required: true, // Unique SKU for the product variant
      },
      price: {
        type: String,
        required: true,
      },
      total: {
        type: String, // Total price for the specific product item in the cart (quantity * price)
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const cart = mongoose.model("cart", cartSchema);

module.exports = cart;
