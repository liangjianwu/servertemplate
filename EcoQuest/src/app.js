const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/mainrouter');
const Auth = require('./routes/auth');
const dbConfig = require('./config/db');
const fileUpload = require('express-fileupload');
const path = require('path');
const aiQueue = require('./services/AIQueue');
const app = express();
const PORT = process.env.PORT || 3000; ~

    // Middleware
    app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(bodyParser.json());

// Add file upload middleware
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Database connection
dbConfig();
// Routes~
app.use('/api', Auth.authRouter)
for (let r of routes.routers) {
    app.use('/api/' + r.module, r.router)
}
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
aiQueue.start(); // Starts automatic processing
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT (Ctrl+C). Gracefully shutting down...');
    aiQueue.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    aiQueue.stop();
    process.exit(0);
});