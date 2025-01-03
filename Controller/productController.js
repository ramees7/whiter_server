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
      sku,
    } = req.body;

    // Validate required fields
    if (
      !category ||
      !title ||
      !MRP ||
      !offerPrice ||
      !stockCount ||
      !sizes ||
      !brand ||
      !color ||
      !description ||
      !material ||
      !careInstructions ||
      !occasion ||
      !pattern ||
      !ratings ||
      !reviews ||
      !sku
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required to add a product" });
    }

    // Check if the category exists
    const existingCategory = await categories.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if a product with the same SKU already exists
    const existingProduct = await products.findOne({ sku });
    if (existingProduct) {
      return res
        .status(409)
        .json({ message: "Product with this SKU already exists" });
    }

    // Extract uploaded image URLs
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    // Create new product
    const newProduct = new products({
      category,
      title,
      imageUrls,
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
      sku,
    });

    // Save product to the database
    await newProduct.save();

    return res
      .status(201)
      .json({ message: "Product created successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const productsList = await products
      .find()
      .populate("category", "category_name description");
    return res.status(200).json({
      message: "Products retrieved successfully",
      products: productsList,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await products
      .findById(id)
      .populate("category", "category_name description");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ message: "Product retrieved successfully", product });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
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
