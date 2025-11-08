require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import API routes
const apiRoutes = require('./src/api');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Enable CORS with exposed headers for React Admin (using X-Total-Count for Vercel compatibility)
app.use(cors({
  exposedHeaders: ['X-Total-Count']
}));

// Parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'Server is running',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Load graph data
const graphData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'json_test_graph_large_01.json'), 'utf8')
);
const metadataData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'json_test_graph_large_01_aux.json'), 'utf8')
);


// default graph endpoint
app.get('/graph', (_req, res) => {
  res.json({
    graph: graphData,
    metadata: metadataData,
    root: 'D'
})});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
