const cart = require("../Models/cartSchema");
const products = require("../Models/productSchema");

// Controller to add product to the cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, sku } = req.body;
    const userId = req.user.userId; // Assuming user ID is available from JWT Middleware

    // Find the product to get its price and ensure it exists
    const product = await products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate total price for the product based on quantity
    const totalPrice = product.offerPrice * quantity;

    // Find or create the user's cart
    let existingCart = await cart.findOne({ userId });
    if (!existingCart) {
      existingCart = new cart({ userId, items: [] });
    }

    // Check if the product already exists in the cart with the same attributes
    const isProductAlreadyInCart = existingCart.items.some(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.sku === sku &&
        item.size === size
    );

    if (isProductAlreadyInCart) {
      return res.status(400).json({
        message: "This product is already in the cart",
      });
    }

    // Add the new product to the cart
    existingCart.items.push({
      productId,
      quantity,
      size,
      sku,
      productTitle: product.title,
      productThumbnail: product.imageUrls[0],
      price: product.offerPrice,
      total: totalPrice,
    });

    await existingCart.save();

    return res.status(200).json({
      message: "Product added to cart successfully",
      cart: existingCart,
    });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// exports.addToCart = async (req, res) => {
//   try {
//     const { productId, quantity, size, sku } = req.body;
//     const userId = req.user.userId; // Assuming user ID is available from JWT Middleware

//     // Find the product to get its price and ensure it exists
//     const product = await products.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Calculate total price for the product based on quantity
//     const totalPrice = product.offerPrice * quantity;
    
//     let existingCart = await cart.findOne({ userId });
//     if (!existingCart) {
//       existingCart = new cart({ userId, items: [] });
//     }

//     // Check if the item already exists in the cart
//     const existingItemIndex = existingCart.items.findIndex(
//       (item) =>
//         item.productId.toString() === productId.toString() &&
//         item.sku === sku &&
//         item.size === size
//     );

//     if (existingItemIndex > -1) {
//       const existingItem = existingCart.items[existingItemIndex];

//       if (existingItem.quantity === quantity) {
//         return res.status(400).json({
//           message: "This product with the same quantity is already in the cart",
//         });
//       }

//       existingCart.items[existingItemIndex].total =
//         existingCart.items[existingItemIndex].quantity * product.offerPrice;
//     } else {
//       // If item doesn't exist, add it to the cart
//       existingCart.items.push({
//         productId,
//         quantity,
//         size,
//         sku,
//         productThumbnail: product.imageUrls[0],
//         price: product.offerPrice,
//         total: totalPrice,
//       });
//     }

//     await existingCart.save();

//     return res.status(200).json({
//       message: "Product added to cart successfully",
//       cart: existingCart,
//     });
//   } catch (error) {
//     console.error("Error adding product to cart:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.viewCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const existingCart = await cart.findOne({ userId });

    if (!existingCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json({ cart: existingCart });
  } catch (error) {
    console.error("Error viewing cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFromCart = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;

    // Find the cart for the user
    const existingCart = await cart.findOne({ userId });
    if (!existingCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item to delete by its ID
    const itemIndex = existingCart.items.findIndex(
      (item) => item._id.toString() === id
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the cart" });
    }

    // Remove the item from the cart
    existingCart.items.splice(itemIndex, 1);

    // Save the updated cart
    await existingCart.save();

    return res.status(200).json({
      message: "Item removed from cart successfully",
      cart: existingCart,
    });
  } catch (error) {
    console.error("Error deleting item from cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Controller to delete all items in the cart
exports.deleteAllCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find the cart for the user
    const existingCart = await cart.findOne({ userId });
    if (!existingCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear all items in the cart
    existingCart.items = [];

    // Save the updated cart (which now has no items)
    await existingCart.save();

    return res.status(200).json({
      message: "All items removed from cart successfully",
      cart: existingCart,
    });
  } catch (error) {
    console.error("Error deleting all items from cart:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;
    const userId = req.user.userId;

    // Find the cart for the user
    const existingCart = await cart.findOne({ userId });
    if (!existingCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item to update by its ID
    const itemIndex = existingCart.items.findIndex(
      (item) => item._id.toString() === id
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the cart" });
    }

    const existingItem = existingCart.items[itemIndex];

    // Check if quantity or size has changed
    const isQuantityUpdated = quantity && quantity !== existingItem.quantity;

    // If no changes detected, return a message
    if (!isQuantityUpdated) {
      return res
        .status(400)
        .json({ message: "No changes detected. Cart item was not updated." });
    }

    // Update the quantity or size if needed
    if (isQuantityUpdated) {
      existingItem.quantity = quantity;
    }

    // Recalculate the total price based on updated quantity
    existingItem.total = existingItem.quantity * existingItem.price;

    // Save the updated cart
    await existingCart.save();

    return res.status(200).json({
      message: "Cart item updated successfully",
      cart: existingCart,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
