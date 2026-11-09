// backend/middlewares/uploadMiddleware.js
const multer = require('multer');

// Guardar archivo temporalmente en la memoria RAM (Buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por archivo
  },
});

module.exports = upload;