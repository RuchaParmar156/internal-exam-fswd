const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const sharp = require('sharp');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/imageCompressionDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Successfully connected to MongoDB.');
}).catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('\nPlease make sure:');
    console.log('1. MongoDB is installed on your system');
    console.log('2. MongoDB service is running');
    console.log('3. MongoDB Compass is connected to mongodb://localhost:27017');
});

// Image Schema
const imageSchema = new mongoose.Schema({
    originalName: String,
    compressedName: String,
    originalSize: Number,
    compressedSize: Number,
    compressionRatio: Number,
    uploadDate: { type: Date, default: Date.now }
});

const Image = mongoose.model('Image', imageSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    // Check file type
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
        return cb(new Error('Only JPEG, JPG, and PNG files are allowed!'), false);
    }
    
    // Check file size (30MB limit)
    if (file.size > 30 * 1024 * 1024) {
        return cb(new Error('File size exceeds 30MB limit!'), false);
    }
    
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 30 * 1024 * 1024 // 30MB
    }
});

// Routes
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const originalSize = req.file.size;
        const compressedFileName = 'compressed_' + req.file.filename;
        const compressedPath = path.join(uploadsDir, compressedFileName);
        
        // Get compression quality from request (default to 80 if not provided)
        const quality = parseInt(req.body.quality) || 80;
        
        // Ensure quality is within valid range (10-90)
        const validQuality = Math.max(10, Math.min(90, quality));

        // Compress image
        await sharp(req.file.path)
            .resize(800, 800, { fit: 'inside' })
            .jpeg({ quality: validQuality })
            .toFile(compressedPath);

        // Get the compressed file size using fs.statSync
        const compressedStats = fs.statSync(compressedPath);
        const compressedSize = compressedStats.size;
        const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

        // Save to MongoDB
        const image = new Image({
            originalName: req.file.originalname,
            compressedName: compressedFileName,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio,
            uploadDate: new Date()
        });
        await image.save();

        res.json({
            message: 'Image uploaded and compressed successfully',
            originalSize,
            compressedSize,
            compressionRatio,
            savedToMongo: true
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/images', async (req, res) => {
    try {
        const images = await Image.find().sort({ uploadDate: -1 });
        res.json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Upload directory: ${uploadsDir}`);
}); 