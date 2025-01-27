// const multer = require("multer");
// const path = require("path");

// // Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     let folder = "uploads"; // Default upload folder

//     // Determine folder based on context
//     if (req.uploadContext === "category") {
//       folder = "uploads/categories";
//     } else if (req.uploadContext === "product") {
//       folder = "uploads/products";
//     }

//     callback(null, path.join(__dirname, "../", folder));
//   },
//   filename: (req, file, callback) => {
//     const uniqueName = `${Date.now()}-${file.originalname.replace(
//       /\s+/g,
//       "_"
//     )}`;
//     callback(null, uniqueName);
//   },
// });

// // File filter for image types
// const fileFilter = (req, file, callback) => {
//   const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
//   if (allowedTypes.includes(file.mimetype)) {
//     callback(null, true);
//   } else {
//     callback(new Error("Only .png, .jpg, .jpeg, and .webp files are allowed"));
//   }
// };

// // Multer configuration
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });

// module.exports = upload;


const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure temporary storage
const tempStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const tempFolder = path.join(__dirname, "../", "temp/uploads");
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }
    callback(null, tempFolder);
  },
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    callback(null, uniqueName);
  },
});

// File filter for image types
const fileFilter = (req, file, callback) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Only .png, .jpg, .jpeg, and .webp files are allowed"));
  }
};

// Multer configuration
const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
