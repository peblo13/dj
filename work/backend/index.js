const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JOOBLE_KEY = process.env.JOOBLE_API_KEY;
if (!JOOBLE_KEY) {
  console.warn('Warning: JOOBLE_API_KEY not set in environment. Add it to .env');
}

app.post('/api/search', async (req, res) => {
  try {
    const payload = req.body || {};

    // Forward the request to Jooble API
    // Jooble uses POST to https://jooble.org/api/<API_KEY>
    const url = `https://jooble.org/api/${JOOBLE_KEY}`;

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to fetch from Jooble API' });
  }
});

const path = require('path');

// Serve frontend production build if present
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend proxy running on port ${PORT}`));
