// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const productSchema = new Schema(
//   {
//     category: {
//       type: Schema.Types.ObjectId,
//       ref: "categories",
//       required: true,
//     },
//     title: { type: String, required: true },
//     imageUrls: [{ type: String, required: true }],
//     MRP: { type: String, required: true },
//     offerPrice: { type: String, required: true },
//     stockCount: { type: String, required: true },
//     sizes: [{ type: String, required: true }],
//     brand: { type: String, required: true },
//     color: { type: String, required: true },
//     description: { type: String, required: true },
//     material: { type: String, required: true },
//     careInstructions: { type: String, required: true },
//     // ratings: [{ type: Number, min: 1, max: 5 }],
//     reviews: [{ type: Schema.Types.ObjectId, ref: "reviews" }], // Store references to review documents
//     sku: { type: String, required: true, unique: true },

//     //for sales
//     salesCount: { type: Number, default: 0 }, // Tracks the number of units sold
//     totalRevenue: { type: Number, default: 0 }, // Tracks the total revenue from sales
//   },
//   { timestamps: true }
// );

// const products = mongoose.model("products", productSchema);
// module.exports = products;

const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    },
    title: { type: String, required: true },
    imageUrls: [{ type: String, required: true }],
    MRP: { type: String, required: true },
    offerPrice: { type: String, required: true },
    stockCount: { type: String, required: true },
    sizes: [{ type: String, required: true }],
    brand: { type: String},
    color: { type: String },
    description: { type: String, required: true },
    material: { type: String},
    careInstructions: { type: String },
    itemVolume: { type: String }, // New field for Perfumes
    reviews: [{ type: Schema.Types.ObjectId, ref: "reviews" }],
    sku: { type: String, required: true, unique: true },
    salesCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const products = mongoose.model("products", productSchema);
module.exports = products;
