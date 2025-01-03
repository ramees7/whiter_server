const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category", // Reference to Category
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    imageUrls: [
      {
        type: String,
        required: true,
      },
    ],
    MRP: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
      required: true,
    },
    stockCount: {
      type: Number,
      required: true,
    },
    sizes: [
      {
        type: String,
        required: true,
      },
    ],
    brand: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    material: {
      type: String,
      required: true,
    },
    careInstructions: {
      type: String,
      required: true,
    },
    occasion: {
      type: String,
      required: true,
    },
    pattern: {
      type: String,
      required: true,
    },
    ratings: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const products = mongoose.model("products", productSchema);

module.exports = products;
