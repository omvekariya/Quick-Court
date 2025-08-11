import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dx6x5xijo",
  api_key: process.env.CLOUDINARY_API_KEY || "187423451296415",
  api_secret: process.env.CLOUDINARY_API_SECRET || "k87pUXV_lntcJEaP8QiSw-m_t98",
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'quickcourt/venues' },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // @ts-ignore
    res.json({ success: true, data: { url: uploadResult.secure_url } });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
