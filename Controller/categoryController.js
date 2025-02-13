const categories = require("../Models/categorySchema");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../Connections/cloudinary");

// exports.createCategory = async (req, res) => {
//   try {
//     const { category_name, description } = req.body;

//     // Validate required fields
//     if (!category_name || !description) {
//       return res.status(400).json({
//         message: "Category name and description are required",
//       });
//     }

//     // Check if the category already exists
//     const existingCategory = await categories.findOne({ category_name });
//     if (existingCategory) {
//       return res.status(409).json({
//         message: "Category with this name already exists",
//       });
//     }

//     // Handle file upload
//     const tempPath = req.file ? req.file.path : null;
//     const finalFolder = path.join("uploads/categories");

//     // Ensure the upload directory exists
//     if (!fs.existsSync(finalFolder)) {
//       fs.mkdirSync(finalFolder, { recursive: true });
//     }

//     let finalThumbnailPath = null;

//     // Move the uploaded file to the final folder
//     if (tempPath) {
//       const finalFileName = `${Date.now()}-${req.file.originalname.replace(
//         /\s+/g,
//         "_"
//       )}`;
//       finalThumbnailPath = path.join(finalFolder, finalFileName);
//       fs.renameSync(tempPath, finalThumbnailPath); // Move the file to the target directory
//     }

//     // Create the new category object
//     const newCategory = new categories({
//       category_name,
//       description,
//       thumbnail_image: finalThumbnailPath, // Save the absolute file path
//     });

//     // Save the new category in the database
//     await newCategory.save();

//     // Respond with success
//     return res.status(201).json({
//       message: "Category created successfully",
//       newCategory,
//     });
//   } catch (error) {
//     console.error("Error creating category:", error);

//     // Remove the temporary file in case of error
//     if (req.file && req.file.path) {
//       fs.unlinkSync(req.file.path);
//     }

//     // Respond with a server error
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

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

    // Upload file to Cloudinary
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary automatically provides the file URL
    }

    // Create new category
    const newCategory = new categories({
      category_name,
      description,
      thumbnail_image: imageUrl, // Store Cloudinary image URL
    });

    // Save category in database
    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
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

// // Controller to update a category by ID
// exports.updateCategory = async (req, res) => {
//   try {
//     const { category_name, description } = req.body;
//     const categoryId = req.params.id;

//     // Find the existing category
//     const existingCategory = await categories.findById(categoryId);
//     if (!existingCategory) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     let thumbnail_image = existingCategory.thumbnail_image; // Retain current image

//     // Check if a new file is uploaded
//     if (req.file) {
//       // Final folder for category thumbnails
//       const finalFolder = path.join(__dirname, "../", "uploads/categories");
//       if (!fs.existsSync(finalFolder)) {
//         fs.mkdirSync(finalFolder, { recursive: true });
//       }

//       // Generate final path for the new image
//       const finalFileName = `${Date.now()}-${req.file.originalname.replace(
//         /\s+/g,
//         "_"
//       )}`;
//       const finalThumbnailPath = path.join(finalFolder, finalFileName);

//       // Move the uploaded file to the final folder
//       fs.renameSync(req.file.path, finalThumbnailPath);

//       // Delete the old image if it exists
//       if (thumbnail_image && fs.existsSync(thumbnail_image)) {
//         fs.unlinkSync(thumbnail_image);
//       }

//       // Update the image path
//       thumbnail_image = finalThumbnailPath;
//     }

//     // Determine if there are any changes to update
//     const isCategoryNameSame = category_name === existingCategory.category_name;
//     const isDescriptionSame = description === existingCategory.description;
//     const isImageSame = thumbnail_image === existingCategory.thumbnail_image;

//     // If no changes, return a response without updating
//     if (isCategoryNameSame && isDescriptionSame && isImageSame) {
//       return res
//         .status(200)
//         .json({ message: "No changes detected", category: existingCategory });
//     }

//     // Update the category fields
//     const updatedCategory = await categories.findByIdAndUpdate(
//       categoryId,
//       {
//         category_name,
//         description,
//         thumbnail_image,
//       },
//       { new: true } // Return the updated category object
//     );

//     return res
//       .status(200)
//       .json({ message: "Category updated successfully", updatedCategory });
//   } catch (error) {
//     console.error("Error updating category:", error);

//     // Cleanup temporary files on error
//     if (req.file && req.file.path) {
//       fs.unlinkSync(req.file.path);
//     }

//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.deleteCategory = async (req, res) => {
//   try {
//     const categoryId = req.params.id;

//     // Find the category to get the image path
//     const category = await categories.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     // Delete the image file if it exists
//     if (category.thumbnail_image) {
//       const imagePath = path.join(__dirname, "..", category.thumbnail_image);
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath); // Delete the image file
//       }
//     }

//     // Delete the category from the database
//     await categories.findByIdAndDelete(categoryId);

//     return res.status(200).json({ message: "Category deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find the category to get the image URL
    const category = await categories.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete the image from Cloudinary if it exists
    if (category.thumbnail_image) {
      // Extract the public_id from the Cloudinary URL
      const publicId = category.thumbnail_image.split("/").pop().split(".")[0];

      await cloudinary.uploader.destroy(publicId);
    }

    // Delete the category from the database
    await categories.findByIdAndDelete(categoryId);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



// Controller to update a category by ID using PATCH
// exports.updateCategory = async (req, res) => {
//   try {
//     const { category_name, description } = req.body;
//     const categoryId = req.params.id;
//     console.log(req);

//     // Find the existing category
//     const existingCategory = await categories.findById(categoryId);
//     if (!existingCategory) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     // Set all fields to the existing values initially
//     // let updatedCategoryName = existingCategory.category_name;
//     // let updatedDescription = existingCategory.description;
//     let updatedThumbnailImage = existingCategory.thumbnail_image;

//     // Check if a new file is uploaded
//     if (req.file) {
//       // Final folder for category thumbnails
//       const finalFolder = path.join("uploads/categories");
//       if (!fs.existsSync(finalFolder)) {
//         fs.mkdirSync(finalFolder, { recursive: true });
//       }

//       // Generate final path for the new image
//       const finalFileName = `${Date.now()}-${req.file.originalname.replace(
//         /\s+/g,
//         "_"
//       )}`;
//       const finalThumbnailPath = path.join(finalFolder, finalFileName);

//       // Move the uploaded file to the final folder
//       fs.renameSync(req.file.path, finalThumbnailPath);

//       // Delete the old image if it exists
//       if (updatedThumbnailImage && fs.existsSync(updatedThumbnailImage)) {
//         fs.unlinkSync(updatedThumbnailImage);
//       }

//       // Set the updated thumbnail image path
//       updatedThumbnailImage = finalThumbnailPath;
//     }

//     // Determine if any field has been updated
//     const isCategoryNameUpdated =
//       category_name && category_name !== existingCategory.category_name;
//     const isDescriptionUpdated =
//       description && description !== existingCategory.description;
//     const isImageUpdated =
//       updatedThumbnailImage !== existingCategory.thumbnail_image;

//     // If no changes detected, return an error message
//     if (!isCategoryNameUpdated && !isDescriptionUpdated && !isImageUpdated) {
//       return res
//         .status(400)
//         .json({ message: "No changes detected. Category was not updated." });
//     }

//     // Create an object with only the fields that have changed
//     const updatedData = {};
//     if (isCategoryNameUpdated) {
//       updatedData.category_name = category_name;
//     }
//     if (isDescriptionUpdated) {
//       updatedData.description = description;
//     }
//     if (isImageUpdated) {
//       updatedData.thumbnail_image = updatedThumbnailImage;
//     }

//     // Update the category fields only if there are changes
//     const updatedCategory = await categories.findByIdAndUpdate(
//       categoryId,
//       updatedData,
//       { new: true } // Return the updated category object
//     );

//     return res
//       .status(200)
//       .json({ message: "Category updated successfully", updatedCategory });
//   } catch (error) {
//     console.error("Error updating category:", error);

//     // Cleanup temporary files on error
//     if (req.file && req.file.path) {
//       fs.unlinkSync(req.file.path);
//     }

//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.updateCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const categoryId = req.params.id;

    // Find the existing category
    const existingCategory = await categories.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    let updatedThumbnailImage = existingCategory.thumbnail_image;

    // If a new file is uploaded
    if (req.file) {
      // Upload new image to Cloudinary
      const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories", // Store images inside the "categories" folder
      });

      // Delete the old image from Cloudinary
      if (existingCategory.thumbnail_image) {
        const publicId = existingCategory.thumbnail_image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Set the new image URL
      updatedThumbnailImage = cloudinaryUpload.secure_url;
    }

    // Check if any field has changed
    const isCategoryNameUpdated = category_name && category_name !== existingCategory.category_name;
    const isDescriptionUpdated = description && description !== existingCategory.description;
    const isImageUpdated = updatedThumbnailImage !== existingCategory.thumbnail_image;

    if (!isCategoryNameUpdated && !isDescriptionUpdated && !isImageUpdated) {
      return res.status(400).json({ message: "No changes detected. Category was not updated." });
    }

    // Create an object with updated fields
    const updatedData = {};
    if (isCategoryNameUpdated) updatedData.category_name = category_name;
    if (isDescriptionUpdated) updatedData.description = description;
    if (isImageUpdated) updatedData.thumbnail_image = updatedThumbnailImage;

    // Update the category
    const updatedCategory = await categories.findByIdAndUpdate(categoryId, updatedData, { new: true });

    return res.status(200).json({ message: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
