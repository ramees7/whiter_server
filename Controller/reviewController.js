const reviews = require("../Models/reviewSchema");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const products = require("../Models/productSchema");

// exports.addReview = async (req, res) => {
//   try {
//     const { productId, review, stars } = req.body;

//     // Use userId from the JWT payload (set by jwtMiddleware)
//     const userId = req.user.userId;

//     // Validate required fields
//     if (
//       !mongoose.Types.ObjectId.isValid(userId) ||
//       !mongoose.Types.ObjectId.isValid(productId)
//     ) {
//       return res.status(400).json({ message: "Invalid userId or productId" });
//     }

//     // Validate star rating
//     if (stars != null && (stars < 1 || stars > 5)) {
//       return res.status(400).json({ message: "Stars must be between 1 and 5" });
//     }

//     // Ensure at least 'review' or 'stars' is provided
//     if (!review && stars == null) {
//       return res
//         .status(400)
//         .json({ message: "Either 'review' or 'stars' must be provided" });
//     }

//     // Check if the user already reviewed this product
//     const existingReview = await reviews.findOne({ userId, productId });
//     if (existingReview) {
//       return res
//         .status(409)
//         .json({ message: "User has already reviewed this product" });
//     }

//     // Create new review
//     const newReview = new reviews({
//       userId,
//       productId,
//       review,
//       stars,
//     });

//     // Save review to the database
//     await newReview.save();

//     return res
//       .status(201)
//       .json({ message: "Review added successfully", newReview });
//   } catch (error) {
//     console.error("Error adding review:", error);
//     return res.status(500).json({ message: "Server error", error });
//   }
// };

exports.addReview = async (req, res) => {
  try {
    const { productId, review, stars } = req.body;
    const userId = req.user.userId; // Extracted from JWT

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid userId or productId" });
    }

    if (stars != null && (stars < 1 || stars > 5)) {
      return res.status(400).json({ message: "Stars must be between 1 and 5" });
    }

    if (!review && stars == null) {
      return res
        .status(400)
        .json({ message: "Either 'review' or 'stars' must be provided" });
    }

    const existingReview = await reviews.findOne({ userId, productId });
    if (existingReview) {
      return res
        .status(409)
        .json({ message: "Already reviewed this product" });
    }

    // Create new review
    const newReview = new reviews({
      userId,
      productId,
      review,
      stars,
    });

    await newReview.save();

    // Add the new review's ObjectId to the product's reviews array
    await products.findByIdAndUpdate(
      productId,
      { $push: { reviews: newReview._id } },
      { new: true }
    );

    return res
      .status(201)
      .json({ message: "Review added successfully", newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviewsList = await reviews
      .find()
      .populate("userId", "name") // Fetch user name & email
      .populate("productId", "imageUrls sku");

    return res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews: reviewsList,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid reviewId" });
    }

    // Find the review by ID
    const review = await reviews.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user is the author of the review or an admin
    if (
      review.userId.toString() !== req.user.userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this review" });
    }

    const product = await products.findOne({ reviews: reviewId });
    if (product) {
      product.reviews = product.reviews.filter(
        (reviewRef) => reviewRef.toString() !== reviewId
      );
      await product.save(); // Save the updated product
    }

    // Delete the review
    await review.deleteOne();

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { review, stars } = req.body;
    const reviewId = req.params.id;

    // Find the existing review
    const existingReview = await reviews.findById(reviewId);
    if (!existingReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ensure productId and userId remain unchanged
    const productId = existingReview.productId;
    const userId = existingReview.userId;

    // Set updated values, only review_text and star_rating can be changed
    const updatedReviewText = review || existingReview.review;
    const updatedStarRating = stars || existingReview.stars;

    // If no updates are detected, return an error message
    if (
      updatedReviewText === existingReview.review &&
      updatedStarRating === existingReview.stars
    ) {
      return res
        .status(400)
        .json({ message: "No changes detected. Review was not updated." });
    }

    // Prepare the updated data
    const updatedData = {};
    if (updatedReviewText !== existingReview.review) {
      updatedData.review = updatedReviewText;
    }
    if (updatedStarRating !== existingReview.stars) {
      updatedData.stars = updatedStarRating;
    }

    // Update the review fields only if there are changes
    const updatedReview = await reviews.findByIdAndUpdate(
      reviewId,
      { ...updatedData, productId, userId }, // Ensure productId and userId remain unchanged
      { new: true } // Return the updated review object
    );

    return res
      .status(200)
      .json({ message: "Review updated successfully", updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
