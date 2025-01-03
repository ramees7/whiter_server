const setUploadMiddleware = (context) => (req, res, next) => {
    req.uploadContext = context; // Set the context (e.g., "category" or "product")
    next();
  };
  
module.exports = setUploadMiddleware;
  