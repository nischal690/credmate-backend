const express = require('express');
const admin = require('firebase-admin');
const creditRoutes = require('./routes/creditRoutes');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/credit', creditRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
