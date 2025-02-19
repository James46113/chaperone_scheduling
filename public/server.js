import express from 'express';
import fetch from 'node-fetch';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const port = 3000;
const client = new OAuth2Client('898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com');

app.use(express.json());


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
    console.log(data.error);
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

async function verifyAccessToken(accessToken) {
  const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

app.use('/api', async (req, res) => {
  const url = `http://chaperone_scheduling_api.railway.internal:5000`;
  let tokenInfo;
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    tokenInfo = await verifyAccessToken(accessToken);

    if (!tokenInfo) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (tokenInfo.audience !== '898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await fetch(`${url}/email/verify/${tokenInfo.email}`, {
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
      headers: { ...req.headers, email: tokenInfo.email },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    res.status(response.status).json(await response.json());
  } catch (error) {
    console.error('Error:', error);
    console.log(`${url}${req.url}`)
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});