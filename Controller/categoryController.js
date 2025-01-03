const categories = require("../Models/categorySchema");
const fs = require("fs");
const path = require("path");

exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    // Validate required fields
    if (!category_name || !description) {
      return res
        .status(400)
        .json({ message: "Category name and description are required" });
    }

    // Check if category already exists
    const existingCategory = await categories.findOne({ category_name });
    if (existingCategory) {
      return res
        .status(409)
        .json({ message: "Category with this name already exists" });
    }

    // Extract the uploaded file path
    const thumbnail_image = req.file ? req.file.path : null;

    // Create new category
    const newCategory = new categories({
      category_name,
      description,
      thumbnail_image, // Add the uploaded file path
    });

    // Save category to the database
    await newCategory.save();

    return res
      .status(201)
      .json({ message: "Category created successfully", newCategory });
  } catch (error) {
    // console.error("Error creating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Controller to get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const allCategories = await categories.find(); // Fetch all categories
    return res.status(200).json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Controller to get a category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await categories.findById(req.params.id); // Find category by ID
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Controller to update a category by ID
exports.updateCategory = async (req, res) => {
  try {
    const { category_name, description, thumbnail_image } = req.body;
    const categoryId = req.params.id;

    const updatedCategory = await categories.findByIdAndUpdate(
      categoryId,
      {
        category_name,
        description,
        thumbnail_image,
      },
      { new: true } // Return the updated category object
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res
      .status(200)
      .json({ message: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find the category to get the image path
    const category = await categories.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete the image file if it exists
    if (category.thumbnail_image) {
      const imagePath = path.join(__dirname, "..", category.thumbnail_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Delete the image file
      }
    }

    // Delete the category from the database
    await categories.findByIdAndDelete(categoryId);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
