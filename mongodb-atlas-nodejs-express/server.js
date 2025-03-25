const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');
const bookRoutes = require('./routes/book');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
db.connect();

// Parse JSON request bodies
app.use(express.json());

// Use book routes
app.use('/api/books', bookRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});