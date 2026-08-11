const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary using placeholders or real env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder_api_secret',
});

// Setup multer storage for Cloudinary with compression parameters
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'distribucore_products',
    // Apply Cloudinary's automatic compression and optimization algorithms
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

module.exports = {
  cloudinary,
  storage
};
