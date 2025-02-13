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
      itemVolume,
      careInstructions,
    } = req.body;

    // Validation
    if (!category || !title || !MRP || !offerPrice || !stockCount) {
      return res.status(400).json({ message: "Required fields are missing." });
    }
    if (!category || !title || !MRP || !offerPrice || !stockCount) {
      return res.status(400).json({
        message:
          "Category, title, MRP, offerPrice, stockCount are required fields.",
      });
    }
    const lastProduct = await products.findOne().sort({ sku: -1 }).limit(1);
    let newSku = "w-1000"; // Default SKU for the first product

    if (lastProduct) {
      // Get the numeric part of the SKU and increment it
      const lastSkuNumber = parseInt(lastProduct.sku.split("-")[1]);
      newSku = `w-${lastSkuNumber + 1}`;
    }
    const sizesArray = JSON.parse(req.body.sizes);

    const existingCategory = await categories.findOne({ _id: category });
    if (!existingCategory) {
      return res.status(400).json({ message: "Category not Found." });
    }

    const existingProduct = await products.findOne({ newSku });
    if (existingProduct) {
      return res
        .status(409)
        .json({ message: "Product with this SKU already exists" });
    }
    // Create product logic
    const newProduct = new products({
      category,
      title,
      imageUrls: [],
      MRP,
      offerPrice,
      stockCount,
      sizes: sizesArray,
      brand,
      color,
      description,
      material,
      careInstructions,
      reviews: [],
      itemVolume,
      sku: newSku,
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
    const productsList = await products.find().populate("category");
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
    const product = await products
      .findOne({ sku })
      .populate({
        path: "reviews",
        populate: { path: "userId", select: "name" }, // Populate user details (name, email)
      })
      .populate("category", "category_name");

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
      existingImageUrls, // Add existing images from request
    } = req.body;

    const sku = req.params.sku; // Get product SKU from URL

    // Find the existing product by SKU
    const existingProduct = await products.findOne({ sku: sku });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updatedProductData = { ...existingProduct._doc }; // Preserve existing product data
    let isUpdated = false;

    // Check for updated fields and log them
    if (sizes) {
      const sizesArray = sizes.split(","); // Convert the comma-separated string back into an array
      if (
        JSON.stringify(sizesArray) !== JSON.stringify(existingProduct.sizes)
      ) {
        console.log(
          `Updating sizes: ${JSON.stringify(
            existingProduct.sizes
          )} -> ${JSON.stringify(sizesArray)}`
        );
        updatedProductData.sizes = sizesArray;
        isUpdated = true;
      }
    }

    // Check for other fields...
    if (category && category !== existingProduct.category._id.toString()) {
      // console.log(
      //   `Updating category ID: ${existingProduct.category._id} -> ${category}`
      // );
      updatedProductData.category = { _id: category }; // Assuming category is stored by ID
      isUpdated = true;
    }
    if (title && title !== existingProduct.title) {
      // console.log(`Updating title: ${existingProduct.title} -> ${title}`);
      updatedProductData.title = title;
      isUpdated = true;
    }
    if (MRP && MRP !== existingProduct.MRP) {
      // console.log(`Updating MRP: ${existingProduct.MRP} -> ${MRP}`);
      updatedProductData.MRP = MRP;
      isUpdated = true;
    }
    if (offerPrice && offerPrice !== existingProduct.offerPrice) {
      // console.log(
      //   `Updating offerPrice: ${existingProduct.offerPrice} -> ${offerPrice}`
      // );
      updatedProductData.offerPrice = offerPrice;
      isUpdated = true;
    }
    if (stockCount && stockCount !== existingProduct.stockCount) {
      // console.log(
      //   `Updating stockCount: ${existingProduct.stockCount} -> ${stockCount}`
      // );
      updatedProductData.stockCount = stockCount;
      isUpdated = true;
    }

    if (brand && brand !== existingProduct.brand) {
      // console.log(`Updating brand: ${existingProduct.brand} -> ${brand}`);
      updatedProductData.brand = brand;
      isUpdated = true;
    }
    if (color && color !== existingProduct.color) {
      // console.log(`Updating color: ${existingProduct.color} -> ${color}`);
      updatedProductData.color = color;
      isUpdated = true;
    }
    if (description && description !== existingProduct.description) {
      // console.log(
      //   `Updating description: ${existingProduct.description} -> ${description}`
      // );
      updatedProductData.description = description;
      isUpdated = true;
    }
    if (material && material !== existingProduct.material) {
      // console.log(
      //   `Updating material: ${existingProduct.material} -> ${material}`
      // );
      updatedProductData.material = material;
      isUpdated = true;
    }
    if (
      careInstructions &&
      careInstructions !== existingProduct.careInstructions
    ) {
      // console.log(
      //   `Updating careInstructions: ${existingProduct.careInstructions} -> ${careInstructions}`
      // );
      updatedProductData.careInstructions = careInstructions;
      isUpdated = true;
    }

    // Preserve existing images from request
    updatedProductData.imageUrls = existingImageUrls
      ? JSON.parse(existingImageUrls)
      : existingProduct.imageUrls;

    // Handle newly uploaded images
    if (req.files && req.files.length > 0) {
      const finalFolder = path.join("uploads/products");
      if (!fs.existsSync(finalFolder)) {
        fs.mkdirSync(finalFolder, { recursive: true });
      }

      req.files.forEach((file) => {
        const finalPath = path.join(finalFolder, path.basename(file.filename));
        fs.renameSync(file.path, finalPath); // Move file
        updatedProductData.imageUrls.push(finalPath); // Append new image URLs
      });

      isUpdated = true;
    }

    // If no changes were detected
    if (!isUpdated) {
      return res
        .status(400)
        .json({ message: "No changes detected. Product was not updated." });
    }

    // Update the product with new and existing images
    const updatedProduct = await products.findOneAndUpdate(
      { sku: sku },
      updatedProductData,
      { new: true } // Return updated product
    );

    return res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
