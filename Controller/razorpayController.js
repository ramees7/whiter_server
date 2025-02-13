
// exports.verifyRazorpayPayment = async (req, res) => {
//   const {
//     razorpay_payment_id,
//     razorpay_order_id,
//     razorpay_signature,
//     formData,
//   } = req.body;

//   // Verify payment signature
//   const crypto = require("crypto");
//   const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//   hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//   const generatedSignature = hmac.digest("hex");

//   if (generatedSignature === razorpay_signature) {
//     // Payment is successful
//     console.log("Payment Verified:", {
//       razorpay_payment_id,
//       razorpay_order_id,
//       formData,
//     });
//     res.status(200).json({ message: "Payment verified successfully" });
//   } else {
//     // Payment verification failed
//     res.status(400).json({ message: "Payment verification failed" });
//   }
// };
