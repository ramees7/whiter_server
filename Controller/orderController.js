const products = require("../Models/productSchema");

const updateSales = async (productId, quantitySold) => {
  try {
    // Find the product by its ID
    const product = await products.findById(productId);
    if (!product) {
      console.log("Product not found");
      return;
    }

    // Calculate total revenue for the sale
    const saleAmount = parseFloat(product.offerPrice) * quantitySold;

    // Update the sales count and total revenue
    product.salesCount += quantitySold;
    product.totalRevenue += saleAmount;

    // Save the updated product
    await product.save();

    console.log(
      `Product ${product.title} updated. Sales Count: ${product.salesCount}, Total Revenue: ${product.totalRevenue}`
    );
  } catch (error) {
    console.error("Error updating sales:", error);
  }
};
