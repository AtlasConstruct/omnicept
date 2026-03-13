/**
 * Omnicept - Data Visualization for Everyone
 * Express server handling file uploads and serving the application
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure file upload
const upload = multer({
  dest: path.join(__dirname, '../tmp/uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload CSV, JSON, or XLSX files.'));
    }
  }
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

/**
 * Upload dataset
 */
app.post('/api/upload', upload.single('dataset'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileInfo = {
    id: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    path: req.file.path
  };

  res.json({
    success: true,
    file: fileInfo,
    message: 'File uploaded successfully'
  });
});

/**
 * Parse uploaded dataset
 */
app.post('/api/parse', async (req, res) => {
  const { fileId } = req.body;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  const filePath = path.join(uploadDir, fileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Parsing logic will be handled client-side with PapaParse
  // This endpoint confirms the file exists and is ready
  res.json({ 
    success: true, 
    message: 'File ready for parsing',
    filePath: `/api/download/${fileId}`
  });
});

/**
 * Download file (for client-side parsing)
 */
app.get('/api/download/:fileId', (req, res) => {
  const filePath = path.join(uploadDir, req.params.fileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

/**
 * Clean up old files (run periodically)
 */
function cleanupOldFiles() {
  const files = fs.readdirSync(uploadDir);
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stat = fs.statSync(filePath);
    
    if (now - stat.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  });
}

// Run cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🎯 Omnicept running at http://localhost:${PORT}\n`);
  console.log('  Upload a dataset to get started.\n');
});
