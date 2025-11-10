const fs = require('fs').promises;
const path = require('path');
const { Image } = require('../models/ImageModels');
const { SpeciesRecognition } = require('../models/SpeciesRecognitionModels');
const { returnResult, returnError } = require('../components/errcode');
const { body, query } = require('express-validator');
const { doWithTry } = require('../components/util');

// Helper function to ensure upload directory exists
const ensureUploadDir = async () => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }
    return uploadDir;
};

// Helper function to validate file type
const isValidFileType = (mimetype) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(mimetype);
};

// Helper function to validate file size (5MB limit)
const isValidFileSize = (size) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return size <= maxSize;
};

module.exports.uploadimage = {
    post:
        async (req, res) => {
            doWithTry(res, async () => {
                // Check if file exists in request
                console.log('Request files:', req.files);
                if (!req.files || !req.files.image) {
                    return returnError(res, 900101, 'No image file provided');
                }

                const file = req.files.image;

                // Validate file type
                if (!isValidFileType(file.mimetype)) {
                    return returnError(res, 900102, 'Invalid file type. Only JPEG, PNG, WEBP, JPG, and GIF allowed');
                }

                // Validate file size
                if (!isValidFileSize(file.size)) {
                    return returnError(res, 900103, 'File too large. Maximum size is 5MB');
                }

                // Generate unique filename
                const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;

                // Ensure upload directory exists and get path
                const uploadDir = await ensureUploadDir();
                const filepath = path.join(uploadDir, filename);

                try {
                    // Save file
                    await fs.writeFile(filepath, file.data);
                    const imageRecord = new Image({ url: `/uploads/${filename}`, userid: req.uid, filename: filename, size: file.size, mimetype: file.mimetype });
                    const savedImage = await imageRecord.save();
                    // Return success response
                    return returnResult(res, {
                        id: savedImage._id,
                        imageUrl: savedImage.url,
                    });
                } catch (error) {
                    console.error('File save error:', error);
                    return returnError(res, 900104, 'Failed to save file');
                }
            });
        }

};

module.exports.recognizeimage = {
    post: [
        [
            body('id').exists().isString().notEmpty().withMessage('id is required'),
            body('imageUrl').exists().isString().notEmpty().withMessage('imageUrl is required'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { imageUrl, id } = req.body;

                // Validate imageUr

                try {
                    // Find the image record by URL
                    const imageRecord = await Image.findOne({ _id: id, url: imageUrl });

                    if (!imageRecord) {
                        return returnError(res, 900202, 'Image not found');
                    }

                    // Update the image with processing type and status
                    if (imageRecord.status === 0) {
                        imageRecord.type = "recognize";
                        imageRecord.status = 1; // 1 = pending processing
                        const updatedImage = await imageRecord.save();
                        return returnResult(res, {
                            id: updatedImage._id,
                            imageUrl: updatedImage.url,
                            status: updatedImage.status,
                            message: `Image queued for processing`
                        });
                    } else if (imageRecord.status === 1) {
                        return returnResult(res, {
                            id: imageRecord._id,
                            imageUrl: imageRecord.url,
                            status: imageRecord.status,
                            message: `Image is already queued for processing`
                        });
                    } else if (imageRecord.status === 2) {
                        return returnResult(res, {
                            id: imageRecord._id,
                            imageUrl: imageRecord.url,
                            status: imageRecord.status,
                            document: imageRecord.document,
                            message: `Image has been processed`
                        });
                    }
                } catch (error) {
                    console.error('Image processing setup error:', error);
                    return returnError(res, 900203, 'Failed to setup image processing');
                }
            });
        }
    ]
}

module.exports.document = {
    get: [
        [
            query('documentId').exists().isMongoId().withMessage('Valid documentId is required'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { documentId } = req.query;

                try {
                    // Find the species recognition document and populate image references
                    console.log('Fetching documentId:', documentId);
                    const speciesDoc = await SpeciesRecognition.findById(documentId)
                        .populate('imageIds', 'url filename mimetype size userid');

                    if (!speciesDoc) {
                        return returnError(res, 900301, 'Species document not found');
                    }

                    // Filter images to only include the requesting user's images
                    const userImages = speciesDoc.imageIds.filter(img => 
                        img.userid && img.userid.toString() === req.uid
                    );

                    // Return the species information with only user's images
                    return returnResult(res, {
                        id: speciesDoc._id,
                        name: speciesDoc.name,
                        family: speciesDoc.family,
                        kingdom: speciesDoc.kingdom,
                        speciesType: speciesDoc.speciesType,
                        funFacts: speciesDoc.funFacts,
                        facts: speciesDoc.facts,
                        habitat: speciesDoc.habitat,
                        conservation: speciesDoc.conservation,
                        stockImageUrl: speciesDoc.stockImageUrl,
                        confidence: speciesDoc.confidence,
                        images: userImages.map(img => ({
                            id: img._id,
                            url: img.url,
                            filename: img.filename
                        })),
                        processedAt: speciesDoc.processedAt,
                        createdAt: speciesDoc.createdAt,
                        updatedAt: speciesDoc.updatedAt
                    });

                } catch (error) {
                    console.error('Error fetching species document:', error);
                    return returnError(res, 900302, 'Failed to fetch species information');
                }
            });
        }
    ]
}