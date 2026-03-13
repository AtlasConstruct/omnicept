/**
 * Omnicept — Data Visualization for Everyone
 * Express server: serves static frontend
 * 
 * All parsing happens client-side (PapaParse / FileReader).
 * This server exists to serve the app and handle future API needs
 * (e.g., server-side Excel parsing, saved dashboards, sharing).
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  \u{1F3AF} Omnicept running at http://localhost:${PORT}\n`);
});
