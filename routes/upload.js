const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Set up storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: async (req, file, cb) => {
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);

    let newFilename = originalName;
    let counter = 1;

    while (fs.existsSync(path.join('./uploads/', newFilename))) {
      newFilename = `${basename}-${counter}${ext}`;
      counter++;
    }

    cb(null, newFilename);
  }
});

// Initialize upload with increased file size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file'); // 'file' is the name attribute in the form

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/; // Allowed extensions
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images, PDFs, and Docs Only!');
  }
}

// @route POST /api/upload
// @desc  Upload file
// @access Private
router.post('/', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    console.log('Multer upload process started');
    if (err) {
      console.log('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'File too large. Maximum size is 100MB.' });
      }
      return res.status(400).json({ msg: err.message });
    }
    
    if (req.file === undefined) {
      console.log('No file selected');
      return res.status(400).json({ msg: 'No file selected!' });
    }

    try {
      console.log('File uploaded:', req.file);

      const newFile = new File({
        user: req.user._id, // Get user ID from auth middleware
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      await newFile.save();

      console.log('File saved to database');

      res.json({
        msg: 'File uploaded!',
        file: `uploads/${req.file.filename}`
      });
    } catch (err) {
      console.error('Error saving file to database:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
});

module.exports = router;
