// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Configure temporary storage
// const tempStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     const tempFolder = path.join(__dirname, "../", "temp/uploads");
//     if (!fs.existsSync(tempFolder)) {
//       fs.mkdirSync(tempFolder, { recursive: true });
//     }
//     callback(null, tempFolder);
//   },
//   filename: (req, file, callback) => {
//     const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
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
//   storage: tempStorage,
//   fileFilter,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
// });

// module.exports = upload;

// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../Connections/cloudinary"); // Import Cloudinary

// // Configure Cloudinary storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "categories", // Folder name in Cloudinary
//     allowed_formats: ["jpg", "jpeg", "png", "webp"], // Allowed file types
//     public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`, // File name
//   },
// });

// // Configure multer
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
// });

// module.exports = upload;

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Connections/cloudinary");

// Function to create dynamic storage based on upload context
const createCloudinaryStorage = (context) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: context, // Dynamic folder selection
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: (req, file) =>
        `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    },
  });
};

// Middleware function to set multer upload dynamically
const setUploadMiddleware = (context) => {
  return multer({
    storage: createCloudinaryStorage(context),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  });
};

module.exports = setUploadMiddleware;
