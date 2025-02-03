const categories = require("../Models/categorySchema");
const products = require("../Models/productSchema");
const fs = require("fs");
const path = require("path");

exports.createProduct = async (req, res) => {
  try {
    const {
      category,
      title,
      MRP,
      offerPrice,
      stockCount,
      brand,
      color,
      description,
      material,
      careInstructions,
      sku,
    } = req.body;

    // Validation
    if (!category || !title || !MRP || !offerPrice || !stockCount || !sku) {
      return res.status(400).json({ message: "Required fields are missing." });
    }
    if (!category || !title || !MRP || !offerPrice || !stockCount || !sku) {
      return res.status(400).json({
        message:
          "Category, title, MRP, offerPrice, stockCount, and SKU are required fields.",
      });
    }
    const sizesArray = JSON.parse(req.body.sizes);

    const existingCategory = await categories.findOne({ _id: category });
    if (!existingCategory) {
      return res.status(400).json({ message: "Category not Found." });
    }

    const existingProduct = await products.findOne({ sku });
    if (existingProduct) {
      return res
        .status(409)
        .json({ message: "Product with this SKU already exists" });
    }
    // Create product logic
    const newProduct = new products({
      category,
      title,
      imageUrls: [], // Placeholder for images
      MRP,
      offerPrice,
      stockCount,
      sizes: sizesArray,
      brand,
      color,
      description,
      material,
      careInstructions,
      // ratings: [],
      reviews: [],
      sku,
    });

    // Save product to the database
    await newProduct.save();

    // Move uploaded files to the final folder
    const finalFolder = path.join("uploads/products");
    if (!fs.existsSync(finalFolder)) {
      fs.mkdirSync(finalFolder, { recursive: true });
    }

    req.files.forEach((file) => {
      const tempPath = file.path;
      const finalPath = path.join(finalFolder, path.basename(file.filename));
      fs.renameSync(tempPath, finalPath); // Move file
      newProduct.imageUrls.push(finalPath); // Update image URLs in the product
    });

    // Save updated product with image URLs
    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product created successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);

    // Cleanup temporary files on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }

    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const productsList = await products.find();
    return res.status(200).json({
      message: "Products retrieved successfully",
      products: productsList,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    // Ensure findOne receives an object as its filter
    const product = await products.findOne({ sku }).populate({
      path: "reviews",
      populate: { path: "userId", select: "name" }, // Populate user details (name, email)
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ message: "Product retrieved successfully", product });
  } catch (error) {
    console.error("Error fetching product by SKU:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await products.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Optionally, delete product images from the server
    if (product.imageUrls && product.imageUrls.length > 0) {
      product.imageUrls.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    return res
      .status(200)
      .json({ message: "Product deleted successfully", product });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      category,
      title,
      MRP,
      offerPrice,
      stockCount,
      sizes,
      brand,
      color,
      description,
      material,
      careInstructions,
      occasion,
      pattern,
      ratings,
      reviews,
    } = req.body;
    const productId = req.params.id; // Assuming productId is passed as a URL parameter

    // Find the existing product by ID (sku can also be used, but we are assuming a productId here)
    const existingProduct = await products.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updatedProductData = {};
    let isUpdated = false;

    // Check if each field has changed and update accordingly
    if (category && category !== existingProduct.category) {
      updatedProductData.category = category;
      isUpdated = true;
    }
    if (title && title !== existingProduct.title) {
      updatedProductData.title = title;
      isUpdated = true;
    }
    if (MRP && MRP !== existingProduct.MRP) {
      updatedProductData.MRP = MRP;
      isUpdated = true;
    }
    if (offerPrice && offerPrice !== existingProduct.offerPrice) {
      updatedProductData.offerPrice = offerPrice;
      isUpdated = true;
    }
    if (stockCount && stockCount !== existingProduct.stockCount) {
      updatedProductData.stockCount = stockCount;
      isUpdated = true;
    }
    if (sizes && sizes !== existingProduct.sizes) {
      updatedProductData.sizes = sizes;
      isUpdated = true;
    }
    if (brand && brand !== existingProduct.brand) {
      updatedProductData.brand = brand;
      isUpdated = true;
    }
    if (color && color !== existingProduct.color) {
      updatedProductData.color = color;
      isUpdated = true;
    }
    if (description && description !== existingProduct.description) {
      updatedProductData.description = description;
      isUpdated = true;
    }
    if (material && material !== existingProduct.material) {
      updatedProductData.material = material;
      isUpdated = true;
    }
    if (
      careInstructions &&
      careInstructions !== existingProduct.careInstructions
    ) {
      updatedProductData.careInstructions = careInstructions;
      isUpdated = true;
    }
    if (occasion && occasion !== existingProduct.occasion) {
      updatedProductData.occasion = occasion;
      isUpdated = true;
    }
    if (pattern && pattern !== existingProduct.pattern) {
      updatedProductData.pattern = pattern;
      isUpdated = true;
    }
    if (ratings && ratings !== existingProduct.ratings) {
      updatedProductData.ratings = ratings;
      isUpdated = true;
    }
    if (reviews && reviews !== existingProduct.reviews) {
      updatedProductData.reviews = reviews;
      isUpdated = true;
    }

    // Handle image file uploads (only if new files are uploaded)
    if (req.files && req.files.length > 0) {
      // Final folder for product images
      const finalFolder = path.join("uploads/products");
      if (!fs.existsSync(finalFolder)) {
        fs.mkdirSync(finalFolder, { recursive: true });
      }

      // Move uploaded files to the final folder and update image URLs
      req.files.forEach((file) => {
        const tempPath = file.path;
        const finalPath = path.join(finalFolder, path.basename(file.filename));
        fs.renameSync(tempPath, finalPath); // Move file
        updatedProductData.imageUrls = updatedProductData.imageUrls || []; // Initialize if not already
        updatedProductData.imageUrls.push(finalPath); // Update image URLs in the product
      });

      // If the product had existing images, delete them (to avoid leftover files)
      existingProduct.imageUrls.forEach((imagePath) => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Delete old image file
        }
      });
    }

    // If no changes were detected
    if (!isUpdated && !updatedProductData.imageUrls) {
      return res
        .status(400)
        .json({ message: "No changes detected. Product was not updated." });
    }

    // Update the product with the modified data
    const updatedProduct = await products.findByIdAndUpdate(
      productId,
      updatedProductData,
      {
        new: true, // Return the updated product object
      }
    );

    return res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);

    // Cleanup temporary files on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }

    return res.status(500).json({ message: "Server error", error });
  }
};
