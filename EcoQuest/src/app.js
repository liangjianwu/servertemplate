const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/mainrouter');
const Auth = require('./routes/auth');
const dbConfig = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;~

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(bodyParser.json());

// Database connection
dbConfig();
// Routes~
app.use('/api', Auth.authRouter)
for(let r of routes.routers) {    
    app.use('/api/'+r.module,r.router)
}
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});