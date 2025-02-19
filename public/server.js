import express from 'express';
import fetch from 'node-fetch';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const port = 3000;
const client = new OAuth2Client('898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com');

app.use(express.json());

app.use('/api', async (req, res) => {
  const url = `http://chaperone_scheduling_api.railway.internal:5000`;
  let payload = null;
  try {

    const idToken = req.headers.authorization?.split(' ')[1];

    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: '898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com',
    });

    payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await fetch(`${url}/email/verify/${payload.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then((response) => {
      if (!response.ok) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(`${url}${req.url}`, {
      method: req.method,
      headers: { ...req.headers, email: payload.email },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/token', async (req, res) => {
  const { code } = req.body;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: '898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com',
      client_secret: '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',
      redirect_uri: 'https://dev-chaperones-steelcitychoristers.up.railway.app',
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  if (data.error) {
    return res.status(400).json({ error: data.error });
  }

  res.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    id_token: data.id_token,
    expires_in: data.expires_in
  });
});

app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: '898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com',
      client_secret: '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',
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (data.error) {
    return res.status(400).json({ error: data.error });
  }

  res.json({
    access_token: data.access_token,
    expires_in: data.expires_in
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});