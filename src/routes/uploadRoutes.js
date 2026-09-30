const express = require('express');
const router = express.Router();
const { upload, processUploadedFile } = require('../utils/fileUpload');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/upload/property-images
 * @desc    Upload multiple photos for a property listing (up to 10 photos)
 * @access  Public / Owner / Admin
 */
router.post('/property-images', upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, 'No property images provided for upload.');
    }

    const uploadPromises = req.files.map((file) => processUploadedFile(file, 'properties'));
    const results = await Promise.all(uploadPromises);

    const imageUrls = results.map((r) => r.url);

    return successResponse(
      res,
      201,
      'Property images uploaded successfully.',
      {
        count: results.length,
        images: imageUrls,
        details: results,
      }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/upload/kyc-docs
 * @desc    Upload Owner KYC Documents (Aadhaar & PAN card)
 * @access  Public / Owner / Admin
 */
router.post(
  '/kyc-docs',
  upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files || {};
      if (!files.aadhaar && !files.pan) {
        return errorResponse(res, 400, 'Please provide at least Aadhaar or PAN document.');
      }

      let aadhaarResult = null;
      let panResult = null;

      if (files.aadhaar && files.aadhaar[0]) {
        aadhaarResult = await processUploadedFile(files.aadhaar[0], 'kyc');
      }

      if (files.pan && files.pan[0]) {
        panResult = await processUploadedFile(files.pan[0], 'kyc');
      }

      return successResponse(
        res,
        201,
        'KYC documents uploaded successfully.',
        {
          aadhaarUrl: aadhaarResult ? aadhaarResult.url : null,
          panUrl: panResult ? panResult.url : null,
          details: {
            aadhaar: aadhaarResult,
            pan: panResult,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/deed-doc
 * @desc    Upload Property Registry / Title Deed / Electricity Bill PDF or Image
 * @access  Public / Owner / Admin
 */
router.post(
  '/deed-doc',
  upload.fields([
    { name: 'registry', maxCount: 1 },
    { name: 'deed', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files || {};
      const fileToUpload = (files.registry && files.registry[0]) || (files.deed && files.deed[0]);

      if (!fileToUpload) {
        return errorResponse(res, 400, 'Please provide property registry or title deed document.');
      }

      const deedResult = await processUploadedFile(fileToUpload, 'deeds');

      return successResponse(
        res,
        201,
        'Property registry/deed document uploaded successfully.',
        {
          registryUrl: deedResult.url,
          details: deedResult,
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/single
 * @desc    Generic single file upload (profile photo, used item, chat media)
 * @access  Public / Authenticated
 */
router.post('/single', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file provided for upload.');
    }

    const result = await processUploadedFile(req.file, 'general');

    return successResponse(
      res,
      201,
      'File uploaded successfully.',
      {
        url: result.url,
        details: result,
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
