const express = require('express');
const app = express();
const port = 5000;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const Folder = require('../models/Folder');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const { createReadStream, createWriteStream } = require('fs');
const archiver = require('archiver');
const rimraf = require('rimraf'); // Optional: For deleting temporary files




// @route GET /api/folders/search
// @desc  Search folders and files by name
// @access Private
router.get('/search', authMiddleware, async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {
    const folders = await Folder.find({
      user: req.user._id,
      name: { $regex: search, $options: 'i' }
    });

    const files = await File.find({
      user: req.user._id,
      filename: { $regex: search, $options: 'i' }
    });

    res.json({ folders, files });
  } catch (err) {
    console.error('Error occurred during search:', err.message, err.stack);
    res.status(500).send('Server error');
  }
});

// Ensure temp directory exists
const ensureTempDir = async () => {
  try {
    await fs.promises.mkdir(path.join(__dirname, '../temp'), { recursive: true });
  } catch (err) {
    console.error('Error creating temp directory:', err);
  }
};


ensureTempDir();

// @route GET /api/folders
// @desc  Get all folders and files in the root or a specific folder
// @access Private
router.get('/', authMiddleware, async (req, res) => {
  const { folderId } = req.query;

  try {
    let folders, files;

    if (folderId) {
      folders = await Folder.find({ user: req.user._id, parentId: folderId });
      files = await File.find({ user: req.user._id, parentId: folderId });
    } else {
      folders = await Folder.find({ user: req.user._id, parentId: null });
      files = await File.find({ user: req.user._id, parentId: null });
    }

    res.json({ folders, files });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// @route POST /api/folders
// @desc  Create a new folder
// @access Private
router.post('/', authMiddleware, async (req, res) => {
  const { name, parentId } = req.body;

  try {
    const newFolder = new Folder({
      name,
      user: req.user._id,
      parentId: parentId || null,
    });

    const folder = await newFolder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route PUT /api/folders/rename
// @desc  Rename file or folder
// @access Private
router.put('/rename', authMiddleware, async (req, res) => {
  const { itemId, itemType, newName } = req.body;

  try {
    if (itemType === 'file') {
      const file = await File.findById(itemId);
      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      file.filename = newName;
      await file.save();
    } else if (itemType === 'folder') {
      const folder = await Folder.findById(itemId);
      if (!folder) {
        return res.status(404).json({ msg: 'Folder not found' });
      }

      folder.name = newName;
      await folder.save();
    }

    res.json({ msg: 'Item renamed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route PUT /api/folders/move
// @desc  Move file or folder to another folder
// @access Private
router.put('/move', authMiddleware, async (req, res) => {
  const { itemId, itemType, targetFolderId } = req.body;

  try {
    if (itemType === 'file') {
      const file = await File.findById(itemId);
      if (!file) {
        return res.status(404).send('File not found.');
      }
      file.parentId = targetFolderId;
      await file.save();
    } else if (itemType === 'folder') {
      const folder = await Folder.findById(itemId);
      if (!folder) {
        return res.status(404).send('Folder not found.');
      }
      folder.parentId = targetFolderId;
      await folder.save();
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

// @route DELETE /api/folders/:id
// @desc  Delete folder or file
// @access Private
router.delete('/:id', authMiddleware, async (req, res) => {
  const { itemType } = req.query; // Expecting itemType as a query parameter

  try {
    if (itemType === 'file') {
      const file = await File.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      await file.deleteOne(); // Using deleteOne() to remove the file
      res.json({ msg: 'File deleted' });
    } else if (itemType === 'folder') {
      const folder = await Folder.findById(req.params.id);
      if (!folder) {
        return res.status(404).json({ msg: 'Folder not found' });
      }

      await folder.deleteOne(); // Using deleteOne() to remove the folder
      res.json({ msg: 'Folder deleted' });
    } else {
      res.status(400).json({ msg: 'Invalid item type' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /api/folders/:folderId
// @desc  Get all folders and files in a specific folder
// @access Private
router.get('/:folderId', authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user._id, parentId: req.params.folderId });
    const files = await File.find({ user: req.user._id, parentId: req.params.folderId });

    res.json({ folders, files });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /api/folders/parent/:folderId
// @desc  Get parent folder of a specific folder
// @access Private
router.get('/parent/:folderId', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    const parentFolder = await Folder.findById(folder.parentId);

    res.json({ parentFolder });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const oneTimeLinks = {}; 


/// Route to generate a one-time download link
router.post('/generate-download-link', async (req, res) => {
  const { itemId, itemType } = req.body;
  const token = crypto.randomBytes(16).toString('hex'); // Generate a random token

  oneTimeLinks[token] = { itemId, itemType };

  // Link expiration time (optional)
  setTimeout(() => {
    delete oneTimeLinks[token];
  }, 60000); // Link valid for 1 minute

  res.json({ link: `http://localhost:5000/api/folders/download/${token}` });
});

// Route to handle one-time downloads
router.get('/download/:token', async (req, res) => {
  const { token } = req.params;
  const linkData = oneTimeLinks[token];

  if (!linkData) {
    return res.status(404).send('Link has expired or is invalid.');
  }

  const { itemId, itemType } = linkData;

  try {
    let item;
    if (itemType === 'folder') {
      item = await Folder.findById(itemId);
      if (!item) {
        return res.status(404).send('Folder not found.');
      }

      // Create a temporary zip file
      const zipFilePath = path.join(__dirname, `../temp/${item.name}.zip`);

      // Ensure the temp directory exists
      await fs.promises.mkdir(path.dirname(zipFilePath), { recursive: true });

      // Create a zip archive
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        res.download(zipFilePath, `${item.name}.zip`, (err) => {
          if (err) {
            console.error('Error during folder download:', err);
            return res.status(500).send('Error during folder download.');
          }
          // Invalidate the link after use and delete the temporary zip file
          delete oneTimeLinks[token];
          fs.promises.unlink(zipFilePath).catch(err => console.error('Error deleting temp zip file:', err));
        });
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Recursively gather all files in the folder
      await addFolderToArchive(item, archive);

      await archive.finalize();
    } else {
      item = await File.findById(itemId);
      if (!item || !item.path) {
        console.error('File not found or filePath is missing for itemId:', itemId);
        return res.status(404).send('File not found.');
      }

      const absoluteFilePath = path.resolve(__dirname, '..', item.path);
      res.download(absoluteFilePath, item.filename, (err) => {
        if (err) {
          console.error('Error during file download:', err);
          return res.status(500).send('Error during file download.');
        }
        // Invalidate the link after use
        delete oneTimeLinks[token];
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

// Helper function to recursively add folder contents to archive
async function addFolderToArchive(folder, archive, parentPath = '') {
  const folderPath = path.join(parentPath, folder.name);

  const files = await File.find({ parentId: folder._id });
  for (const file of files) {
    const filePath = path.join(__dirname, '..', file.path);
    archive.file(filePath, { name: path.join(folderPath, file.filename) });
  }

  const subFolders = await Folder.find({ parentId: folder._id });
  for (const subFolder of subFolders) {
    await addFolderToArchive(subFolder, archive, folderPath);
  }
}


// Route to fetch PDF file for viewing
router.get('/:fileId/view-pdf', async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findById(fileId);
    if (!file || file.mimetype !== 'application/pdf') {
      return res.status(404).json({ msg: 'PDF file not found.' });
    }

    // Assuming 'file.path' is the path where PDF files are stored
    const pdfUrl = `http://localhost:5000/${file.path}`; // Adjust path accordingly

    res.json({ pdfUrl });
  } catch (err) {
    console.error('Error fetching PDF:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});
module.exports = router;
