const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    category_name: {
      type: String,
      required: true,
      unique: true, // Ensures the category name is unique
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail_image: {
      type: String, // URL of the category thumbnail image
    },
  },
  { timestamps: true }
);

const categories = mongoose.model("categories", categorySchema);

module.exports = categories;
