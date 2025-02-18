import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', async (req, res) => {
  const url = `https://chaperone_scheduling_api.railway.internal:5000/${req.url}`;
  const headers = {
    ...req.headers,
    'Authorization': `Bearer ${process.env.API_KEY}`
  };

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});