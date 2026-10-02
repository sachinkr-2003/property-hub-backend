const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials provided in .env
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ [Cloudinary Storage Enabled]: Real cloud CDN active.');
} else {
  console.log('📁 [Local Storage Enabled]: Files stored locally in /uploads directory (100% Free).');
}

/**
 * Ensure upload folders exist
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const uploadsRoot = path.join(__dirname, '../../uploads');
ensureDir(uploadsRoot);
ensureDir(path.join(uploadsRoot, 'properties'));
ensureDir(path.join(uploadsRoot, 'kyc'));
ensureDir(path.join(uploadsRoot, 'deeds'));
ensureDir(path.join(uploadsRoot, 'general'));

/**
 * Multer Disk Storage Configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'general';

    if (file.fieldname === 'images' || file.fieldname === 'propertyImage') {
      subfolder = 'properties';
    } else if (file.fieldname === 'aadhaar' || file.fieldname === 'pan' || file.fieldname === 'kycDoc') {
      subfolder = 'kyc';
    } else if (file.fieldname === 'registry' || file.fieldname === 'deed' || file.fieldname === 'propertyDeed') {
      subfolder = 'deeds';
    }

    const targetDir = path.join(uploadsRoot, subfolder);
    ensureDir(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(cleanName);
    const baseName = path.basename(cleanName, ext);
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter for images and documents (PDF, DOCX)
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx'];

  if (
    allowedMimes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    (file.mimetype === 'application/octet-stream' && allowedExts.includes(ext)) ||
    allowedExts.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type ${file.mimetype}. Allowed: JPG, PNG, WEBP, PDF, DOC.`), false);
  }
};

/**
 * Multer Upload Instance (15 MB Max per file)
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

/**
 * Helper to upload file to Cloudinary if configured, otherwise returns relative static URL
 */
async function processUploadedFile(file, subfolder = 'general') {
  if (!file) return null;

  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `property_hub/${subfolder}`,
        resource_type: 'auto',
      });
      // Optionally remove local file after upload
      fs.unlink(file.path, () => {});
      return {
        url: result.secure_url,
        publicId: result.public_id,
        storageType: 'cloudinary',
        originalName: file.originalname,
        size: file.size,
      };
    } catch (err) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local file URL:', err.message);
    }
  }

  // Local storage fallback (Static Express URL)
  const relativePath = path.relative(uploadsRoot, file.path).replace(/\\/g, '/');
  return {
    url: `/uploads/${relativePath}`,
    localPath: file.path,
    storageType: 'local',
    originalName: file.originalname,
    size: file.size,
  };
}

module.exports = {
  upload,
  processUploadedFile,
  hasCloudinary,
};
