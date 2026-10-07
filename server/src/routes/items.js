import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB is not connected.');
  }

  return new mongoose.mongo.GridFSBucket(
    mongoose.connection.db,
    { bucketName: 'mpsFiles' }
  );
}

/* GET ITEMS */
router.get('/', requireAuth, async (req, res) => {
  try {
    const type = req.query.type;
    const trash = req.query.trash === 'true';
    const favorite = req.query.favorite === 'true';

    const filter = {
      owner: req.user._id,
      deletedAt: trash ? { $ne: null } : null,
    };

    if (type) filter.type = type;
    if (favorite) filter.favorite = true;

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/* CREATE SHAYARI / NOTE */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      type,
      title = '',
      content = '',
      description = '',
      category = '',
    } = req.body;

    if (!['shayari', 'notes'].includes(type)) {
      return res.status(400).json({
        error: 'Only Shayari and notes can be created here.',
      });
    }

    if (!title.trim() && !content.trim()) {
      return res.status(400).json({
        error: 'Add a title or content.',
      });
    }

    const item = await Item.create({
      owner: req.user._id,
      type,
      title,
      content,
      description,
      category,
    });

    res.status(201).json({ item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/* UPLOAD DOCUMENT / PHOTO */
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please select a file.',
        });
      }

      const type = req.body.type;

      if (!['documents', 'photos'].includes(type)) {
        return res.status(400).json({
          error: 'Upload type must be documents or photos.',
        });
      }

      if (type === 'photos' &&
          !req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          error: 'Only image files can be uploaded as photos.',
        });
      }

      if (type === 'documents' &&
          !ALLOWED_TYPES.has(req.file.mimetype)) {
        return res.status(400).json({
          error: 'Allowed documents: PDF, DOC, DOCX, TXT, JPG, PNG and WEBP.',
        });
      }

      if (
        req.user.storageUsed + req.file.size >
        req.user.storageLimit
      ) {
        return res.status(413).json({
          error: 'Your storage limit has been reached.',
        });
      }

      const bucket = getBucket();

      const uploadStream = bucket.openUploadStream(
        req.file.originalname,
        {
          contentType: req.file.mimetype,
          metadata: {
            owner: req.user._id.toString(),
            type,
          },
        }
      );

      const gridfsId = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
          resolve(uploadStream.id);
        });

        uploadStream.on('error', reject);

        uploadStream.end(req.file.buffer);
      });

      const item = await Item.create({
        owner: req.user._id,
        type,
        title: req.body.title || req.file.originalname,
        description: req.body.description || '',
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        gridfsId,
      });

      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            storageUsed: req.file.size,
          },
        }
      );

      res.status(201).json({ item });

    } catch (error) {
      console.error('UPLOAD ERROR:', error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/* OPEN FILE */
router.get('/:id/file', requireAuth, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!item || !item.gridfsId || item.deletedAt) {
      return res.status(404).json({
        error: 'File not found.',
      });
    }

    res.setHeader(
      'Content-Type',
      item.mimeType || 'application/octet-stream'
    );

    getBucket()
      .openDownloadStream(
        new mongoose.Types.ObjectId(item.gridfsId)
      )
      .pipe(res);

  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
});

/* FAVORITE */
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });

    if (!item) {
      return res.status(404).json({
        error: 'Item not found.',
      });
    }

    item.favorite = !item.favorite;
    await item.save();

    res.json({ item });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* DELETE */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: null,
    });

    if (!item) {
      return res.status(404).json({
        error: 'Item not found.',
      });
    }

    item.deletedAt = new Date();
    await item.save();

    res.json({ ok: true });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* RESTORE */
router.post('/:id/restore', requireAuth, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deletedAt: { $ne: null },
    });

    if (!item) {
      return res.status(404).json({
        error: 'Deleted item not found.',
      });
    }

    item.deletedAt = null;
    await item.save();

    res.json({ item });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;