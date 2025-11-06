const SpeciesRecognitionService = require('./SpeciesRecognitionService');

class AIQueue {
    constructor() {
        this.speciesRecognitionService = new SpeciesRecognitionService();
        this.isRunning = false;
        this.shouldStop = false;
    }

    // Start the continuous queue processing
    async start() {
        if (this.isRunning) {
            console.log('AIQueue is already running');
            return;
        }

        console.log('Starting AIQueue with continuous processing...');
        this.isRunning = true;
        this.shouldStop = false;

        // Start the continuous processing loop
        this.processLoop();
    }

    // Stop the queue processing
    stop() {
        console.log('Stopping AIQueue...');
        this.shouldStop = true;
        this.isRunning = false;
    }

    // Continuous processing loop
    async processLoop() {
        while (!this.shouldStop) {
            try {
                // Try to process one image
                const result = await this.speciesRecognitionService.processNextImage();

                if (result) {
                    // Non-processed image found and processed, continue checking immediately
                    console.log(`Processed image ${result.imageId}, checking for next...`);
                    continue;
                } else {
                    // No non-processed images found, wait 1 second
                    // console.log('No pending images found, waiting 1 second...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                console.error('Error in processing loop:', error);
                // Wait 1 second before retrying on error
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('AIQueue processing loop stopped');
    }

    // Legacy method for backward compatibility
    async processQueue() {
        return await this.speciesRecognitionService.processRecognitionQueue();
    }

    // Manually trigger processing of next image
    async processNext() {
        return await this.speciesRecognitionService.processNextImage();
    }

    // Get queue status
    getStatus() {
        return {
            isRunning: this.isRunning,
            shouldStop: this.shouldStop
        };
    }
}

// Export singleton instance
const aiQueue = new AIQueue();
module.exports = aiQueue;