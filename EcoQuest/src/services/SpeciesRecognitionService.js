const OpenAI = require('openai');
const { Image } = require('../models/ImageModels');
const { SpeciesRecognition } = require('../models/SpeciesRecognitionModels');

class SpeciesRecognitionService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async processImageRecognition(imageRecord) {
        try {
            console.log(`Processing species recognition for image: ${imageRecord.url}`);

            // Create the full image URL
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const fullImageUrl = imageRecord.url.startsWith('http')
                ? imageRecord.url
                : `${baseUrl}${imageRecord.url}`;

            // Call OpenAI API for species recognition
            const response = await this.openai.chat.completions.create({
                model: "gpt-5-nano",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image and identify the species (plant, animal, fungi, etc.). Provide the following information in JSON format:
                                {
                                    "name": {
                                        "common": "common name",
                                        "scientific": "scientific name"
                                    },
                                    "family": "taxonomic family",
                                    "kingdom": "biological kingdom (Plantae, Animalia, Fungi, etc.)",
                                    "speciesType": "general type (plant, animal, fungi, bird, mammal, insect, etc.)",
                                    "funFacts": ["fact1", "fact2", "fact3"],
                                    "facts": ["general fact1", "general fact2", "general fact3"],
                                    "habitat": "natural habitat and distribution",
                                    "conservation": "conservation status if known",
                                    "confidence": 0.95
                                }
                                
                                If you cannot identify the species with confidence, set confidence to a lower value and provide your best guess with appropriate caveats in the facts.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: "https://tse4.mm.bing.net/th/id/OIP.yvj61X0dbFFF8viA7fmKcAHaEV?rs=1&pid=ImgDetMain&o=7&rm=3"
                                }
                            },
                            {
                                type: "text",
                                text: `Respond only with the JSON object as specified, without any additional text or explanation. Ensure the JSON is properly formatted.`
                            }
                        ]
                    }
                ],
            });

            const rawResponse = response.choices[0].message.content;
            console.log('OpenAI Raw Response:', rawResponse);

            // Parse the JSON response
            let recognitionData;
            try {
                recognitionData = JSON.parse(rawResponse);
            } catch (parseError) {
                console.error('Failed to parse OpenAI response as JSON:', parseError);
                throw new Error('Invalid JSON response from OpenAI');
            }

            // Create species recognition record
            const speciesRecognition = new SpeciesRecognition({
                imageId: imageRecord._id,
                name: recognitionData.name || { common: null, scientific: null },
                family: recognitionData.family || null,
                kingdom: recognitionData.kingdom || null,
                speciesType: recognitionData.speciesType || null,
                funFacts: recognitionData.funFacts || [],
                facts: recognitionData.facts || [],
                habitat: recognitionData.habitat || null,
                conservation: recognitionData.conservation || null,
                confidence: recognitionData.confidence || 0.5,
                rawResponse: rawResponse
            });

            const savedRecognition = await speciesRecognition.save();

            // Update image record with recognition reference and status
            imageRecord.document = savedRecognition._id;
            imageRecord.status = 2; // 2 = processing completed
            await imageRecord.save();

            console.log(`Species recognition completed for image ${imageRecord._id}`);
            return savedRecognition;

        } catch (error) {
            console.error('Species recognition failed:', error);

            // Update image status to failed
            imageRecord.status = -1; // -1 = processing failed
            await imageRecord.save();

            throw error;
        }
    }

    async processNextImage() {
        try {
            // Find one image with type 'recognize' and status 1 (pending)
            const pendingImage = await Image.findOne({
                type: 'recognize',
                status: 1
            });

            if (!pendingImage) {
                return null; // No pending images found
            }

            console.log(`Processing species recognition for image: ${pendingImage._id}`);

            try {
                // Update status to processing
                pendingImage.status = 3; // 3 = currently processing
                await pendingImage.save();

                const recognition = await this.processImageRecognition(pendingImage);

                return {
                    imageId: pendingImage._id,
                    success: true,
                    recognitionId: recognition._id
                };

            } catch (error) {
                console.error(`Failed to process image ${pendingImage._id}:`, error);
                return {
                    imageId: pendingImage._id,
                    success: false,
                    error: error.message
                };
            }

        } catch (error) {
            console.error('Error in processNextImage:', error);
            throw error;
        }
    }

    // async processRecognitionQueue() {
    //     try {
    //         console.log('Starting species recognition queue processing...');

    //         // Find all images with type 'recognize' and status 1 (pending)
    //         const pendingImages = await Image.find({
    //             type: 'recognize',
    //             status: 1
    //         }).limit(10); // Process in batches to avoid overwhelming the API

    //         console.log(`Found ${pendingImages.length} images pending recognition`);

    //         const results = [];
    //         for (const image of pendingImages) {
    //             try {
    //                 // Update status to processing
    //                 image.status = 3; // 3 = currently processing
    //                 await image.save();

    //                 const recognition = await this.processImageRecognition(image);
    //                 results.push({
    //                     imageId: image._id,
    //                     success: true,
    //                     recognitionId: recognition._id
    //                 });

    //                 // Add delay between API calls to respect rate limits
    //                 await new Promise(resolve => setTimeout(resolve, 2000));

    //             } catch (error) {
    //                 console.error(`Failed to process image ${image._id}:`, error);
    //                 results.push({
    //                     imageId: image._id,
    //                     success: false,
    //                     error: error.message
    //                 });
    //             }
    //         }

    //         console.log('Species recognition queue processing completed');
    //         return results;

    //     } catch (error) {
    //         console.error('Error in recognition queue processing:', error);
    //         throw error;
    //     }
    // }

    async getRecognitionById(recognitionId) {
        try {
            return await SpeciesRecognition.findById(recognitionId).populate('imageId');
        } catch (error) {
            console.error('Error fetching recognition:', error);
            throw error;
        }
    }

    async getRecognitionByImageId(imageId) {
        try {
            return await SpeciesRecognition.findOne({ imageId }).populate('imageId');
        } catch (error) {
            console.error('Error fetching recognition by image ID:', error);
            throw error;
        }
    }
}

module.exports = SpeciesRecognitionService;