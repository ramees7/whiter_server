const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users", // Reference to the users collection
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "products", // Reference to the products collection
      required: true,
    },
    review: {
      type: String,
      required: function () {
        return !this.stars; // Review is required if stars is not provided
      },
    },
    stars: {
      type: String,
      required: function () {
        return !this.review; // Stars are required if review is not provided
      },
      min: 1,
      max: 5, // Ensures the stars are between 1 and 5
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const reviews = mongoose.model("reviews", reviewSchema);

module.exports = reviews;