const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load graph data
const graphData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'json_test_graph_large_01.json'), 'utf8')
);
const metadataData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'json_test_graph_large_01_aux.json'), 'utf8')
);

app.get('/', (_req, res) => {
  res.json({
    status: 'Server is running',
    port: PORT
  });
});

app.get('/graph', (_req, res) => {
  res.json({
    graph: graphData,
    metadata: metadataData,
    root: 'D'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
