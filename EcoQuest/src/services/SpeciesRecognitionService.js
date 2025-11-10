const OpenAI = require('openai');
const { Image } = require('../models/ImageModels');
const { SpeciesRecognition } = require('../models/SpeciesRecognitionModels');

class SpeciesRecognitionService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Step 1: Identify the species from the image
     * Returns the scientific name to check against existing documents
     */
    async identifySpecies(imageUrl) {
        try {
            console.log(`Identifying species from image: ${imageUrl}`);

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Identify the species in this image. Respond ONLY with a JSON object in this exact format (no \`\`\`json\`\`\` tags):
                                {
                                    "scientific": "Scientific name",
                                    "common": "Common name",
                                    "confidence": 0.95
                                }
                                
                                If you cannot identify the species, set confidence to a lower value and provide your best guess.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    // url: 'https://i.guim.co.uk/img/media/327aa3f0c3b8e40ab03b4ae80319064e401c6fbc/377_133_3542_2834/master/3542.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=34d32522f47e4a67286f9894fc81c863'
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            });

            const rawResponse = response.choices[0].message.content;
            console.log('Species identification response:', rawResponse);

            const identificationData = JSON.parse(rawResponse);
            return identificationData;

        } catch (error) {
            console.error('Species identification failed:', error);
            throw error;
        }
    }

    /**
     * Step 2: Generate comprehensive species information
     * Only called when species document doesn't exist yet
     */
    async generateSpeciesDocument(scientificName, commonName) {
        try {
            console.log(`Generating comprehensive document for: ${scientificName}`);

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: `Provide comprehensive information about ${scientificName} (${commonName}). Respond ONLY with a JSON object in this exact format (no \`\`\`json\`\`\` tags):
                        {
                            "family": "taxonomic family",
                            "kingdom": "biological kingdom (Plantae, Animalia, Fungi, etc.)",
                            "speciesType": "general type (plant, animal, fungi, bird, mammal, insect, etc.)",
                            "funFacts": ["interesting fact 1", "interesting fact 2", "interesting fact 3"],
                            "facts": ["general fact 1", "general fact 2", "general fact 3"],
                            "habitat": "natural habitat and distribution",
                            "conservation": "conservation status if known",
                            "stockImageUrl": "a publicly accessible URL to a high-quality stock/reference image of this species (from Wikimedia Commons, iNaturalist, or similar public domain sources)"
                        }
                        
                        Ensure all facts are accurate and educational. For the stockImageUrl, provide a real, working URL to a representative image.`
                    }
                ],
                max_tokens: 1000
            });

            const rawResponse = response.choices[0].message.content;
            console.log('Species document generation response:', rawResponse);

            const documentData = JSON.parse(rawResponse);
            return documentData;

        } catch (error) {
            console.error('Species document generation failed:', error);
            throw error;
        }
    }

    /**
     * Main processing function that implements the new logic:
     * 1. Identify species
     * 2. Check if document exists
     * 3. Either reuse existing or generate new
     */
    async processImageRecognition(imageRecord) {
        try {
            console.log(`Processing species recognition for image: ${imageRecord.url}`);

            // Create the full image URL
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const fullImageUrl = imageRecord.url.startsWith('http')
                ? imageRecord.url
                : `${baseUrl}${imageRecord.url}`;

            // Step 1: Identify the species
            const identification = await this.identifySpecies(fullImageUrl);
            const scientificName = identification.scientific;
            const commonName = identification.common;
            const confidence = identification.confidence || 0.5;

            console.log(`Identified species: ${scientificName} (${commonName}) with confidence ${confidence}`);

            // Step 2: Check if we already have a document for this species
            let speciesDoc = await SpeciesRecognition.findOne({
                'name.scientific': { $regex: new RegExp(`^${scientificName}$`, 'i') }
            });

            if (speciesDoc) {
                // Document exists - add this image to the existing document
                console.log(`Found existing document for ${scientificName}, adding image to it`);
                
                // Add image ID if not already present
                if (!speciesDoc.imageIds.includes(imageRecord._id)) {
                    speciesDoc.imageIds.push(imageRecord._id);
                    await speciesDoc.save();
                }

                // Update image record with reference to existing document
                imageRecord.document = speciesDoc._id;
                imageRecord.status = 2; // 2 = processing completed
                await imageRecord.save();

                console.log(`Image ${imageRecord._id} linked to existing species document ${speciesDoc._id}`);
                return speciesDoc;

            } else {
                // Document doesn't exist - generate comprehensive information
                console.log(`No existing document for ${scientificName}, generating new one`);
                
                const documentData = await this.generateSpeciesDocument(scientificName, commonName);

                // Create new species recognition document
                const speciesRecognition = new SpeciesRecognition({
                    imageIds: [imageRecord._id],
                    name: {
                        common: commonName,
                        scientific: scientificName
                    },
                    family: documentData.family || null,
                    kingdom: documentData.kingdom || null,
                    speciesType: documentData.speciesType || null,
                    funFacts: documentData.funFacts || [],
                    facts: documentData.facts || [],
                    habitat: documentData.habitat || null,
                    conservation: documentData.conservation || null,
                    stockImageUrl: documentData.stockImageUrl || null,
                    confidence: confidence,
                    rawResponse: JSON.stringify(documentData)
                });

                const savedRecognition = await speciesRecognition.save();

                // Update image record with recognition reference and status
                imageRecord.document = savedRecognition._id;
                imageRecord.status = 2; // 2 = processing completed
                await imageRecord.save();

                console.log(`New species document created: ${savedRecognition._id}`);
                return savedRecognition;
            }

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