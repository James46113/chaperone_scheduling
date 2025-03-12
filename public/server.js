import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3000;
const url = `http://chaperone_scheduling_api.railway.internal:5000`;

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

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
      redirect_uri: 'https://chaperones.steelcitychoristers.org.uk',
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  if (data.error) {
    console.log(`Error: ${data.error}`);
    return res.status(400).json({ error: data.error });
  }

  return res.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    id_token: data.id_token,
    expires_in: data.expires_in
  });
});

app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  console.log(`REFRESH TOKEN: ${refreshToken}`);

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

  try {
    const data = await response.json();
    console.log(`REFRESH RESPONSE: ${JSON.stringify(data)}`);
    return res.json({
      access_token: data.access_token,
      id_token: data.id_token,
      expires_in: data.expires_in
    });
  }
  catch (e) {
    return res.status(400).json({ error: e });
  }
});

app.use('/api/login/', async (req, res) => {
  const email = req.url.replaceAll('/', '');
  const response = await fetch(`${url}/login/${email}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return res.status(response.status).json(await response.json());
});

async function verifyAccessToken(accessToken) {
  const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

function revokeToken(token) {
  fetch(`https://oauth2.googleapis.com/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      token
    })
  });
}

app.use('/api/public/', async (req, res) => {
  const response = await fetch(`${url}/public${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });
  const clone = response.clone();
  try {
    return res.status(response.status).json(await response.json());
  }
  catch {
    console.log(`FAILED: ${url}/public${req.url}`)
    return res.status(response.status).send(clone.text());
  }
});


app.use('/api/p/', async (req, res) => {
  const { token, fingerprint } = req.headers;
  const tokenResponse = await fetch(`${url}/token/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, fingerprint })
  })
  if (!tokenResponse.ok) {
    console.log(`/token/validate failed: ${token}, ${fingerprint}, ${JSON.stringify(tokenResponse)}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { email } = await tokenResponse.json();

  const response = await fetch(`${url}${req.url}`, {
    method: req.method,
    headers: { ...req.headers, email: email },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  })
  return res.status(response.status).json(await response.json());
});

app.use('/api', async (req, res) => {
  let tokenInfo;
  const accessToken = req.headers.authorization?.split(' ')[1];
  try {

    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    tokenInfo = await verifyAccessToken(accessToken);

    if (!tokenInfo) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (tokenInfo.audience !== '898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com') {
      revokeToken(accessToken);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await fetch(`${url}/email/verify/${tokenInfo.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then((response) => {
      if (!response.ok) {
        revokeToken(accessToken);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    });

  } catch (error) {
    console.error('Error:', error);
    revokeToken(accessToken)
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(`${url}${req.url}`, {
      method: req.method,
      headers: { ...req.headers, email: tokenInfo.email },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    return res.status(response.status).json(await response.json());
  } catch (error) {
    console.error('Error:', error);
    console.log(`${url}${req.url}`)
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
