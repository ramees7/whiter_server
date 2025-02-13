const products = require("../Models/productSchema");
const orders = require("../Models/orderSchema");
const carts = require("../Models/cartSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Add your Razorpay Key ID to .env
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Add your Razorpay Key Secret to .env
});

exports.createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise (e.g., ₹50 = 5000 paise)
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

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

exports.processPaymentAndOrder = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      shippingAddress,
      paymentMethod,
    } = req.body;

    const userId = req.user.userId; // Extracted from JWT

    // **1️⃣ Verify Payment Signature**
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    console.log("✅ Payment Verified:", razorpay_payment_id);

    // **2️⃣ Retrieve Cart**
    const cart = await carts.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // **3️⃣ Calculate Order Total**
    let subtotal = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal > 1000 ? 0 : 50; // Free shipping for orders > ₹1000
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + tax + shippingFee;

    // **4️⃣ Create Order**
    const order = new orders({
      user: userId,
      products: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        size: item.size,
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus: {
        status: "Paid",
        transactionId: razorpay_payment_id,
      },
      orderStatus: "Processing",
      subtotal,
      shippingFee,
      totalAmount,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days delivery
    });

    await order.save();

    // **5️⃣ Update Sales & Clear Cart**
    for (const item of cart.items) {
      await updateSales(item.productId._id, item.quantity);
    }
    await carts.findOneAndDelete({ userId });

    return res.status(201).json({
      message: "✅ Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Error processing payment/order:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body; // Contains fields to be updated

    // Find the order by ID
    const order = await orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update only the provided fields
    if (updates.orderStatus) {
      order.orderStatus = updates.orderStatus;
    }
    if (updates.paymentStatus) {
      order.paymentStatus.status = updates.paymentStatus;
    }
    if (updates.trackingNumber) {
      order.trackingNumber = updates.trackingNumber;
    }

    // Save updated order
    await order.save();

    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find and delete the order
    const order = await orders.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order deleted successfully",
      order,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
