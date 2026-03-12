const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = 3000;

const CLIENT_ID     = 'ccaabd097b914790934ac89fbaddd9ce';
const CLIENT_SECRET = 'bf71b2541d944fdda09d841c00d7daed';
const REDIRECT_URI  = process.env.REDIRECT_URI || 'https://www.lineapp.club/callback';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// 1. Login
app.get('/login', (req, res) => {
  const state  = crypto.randomBytes(16).toString('hex');
  const scopes = 'user-top-read user-read-private user-read-email';
  const url    = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    scope:         scopes,
    redirect_uri:  REDIRECT_URI,
    state,
  });
  res.redirect(url);
});

// 2. Callback
app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect('/?error=' + error);
  try {
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64') } }
    );
    const { access_token, expires_in } = tokenRes.data;
    res.redirect(`/app?token=${access_token}&expires=${expires_in}`);
  } catch (err) {
    console.error('Token error:', err.response?.data || err.message);
    res.redirect('/?error=token_failed');
  }
});

// 3. Top artists
app.get('/api/top-artists', async (req, res) => {
  const { token, time_range = 'medium_term' } = req.query;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const r = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      params: { limit: 20, time_range },
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// 4. Me
app.get('/api/me', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const r = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// 5. Conciertos — Ticketmaster
const TM_KEY = '0RzIGZAMZs5LI8GcOcCKAANoKYNDmF4A';

app.get('/api/concerts', async (req, res) => {
  const { artists, city } = req.query;
  if (!artists || !city) return res.json([]);

  const artistList = artists.split(',').slice(0, 10);
  const results = [];

  await Promise.all(artistList.map(async (artist) => {
    try {
      const r = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey:  TM_KEY,
          keyword: artist,
          city:    city,
          size:    3,
          sort:    'date,asc',
          classificationName: 'music',
        }
      });

      const events = r.data?._embedded?.events || [];
      events.forEach(ev => {
        const venue = ev._embedded?.venues?.[0];
        results.push({
          artist,
          venue:  venue?.name || '',
          city:   `${venue?.city?.name || ''}, ${venue?.country?.name || ''}`,
          date:   ev.dates?.start?.dateTime || ev.dates?.start?.localDate,
          url:    ev.url,
        });
      });
    } catch {}
  }));

  results.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(results.slice(0, 12));
});


// 6. Roast — Claude AI
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

app.post('/api/roast', async (req, res) => {
  const { messages, artists, lang } = req.body;
  if (!messages || !artists) return res.status(400).json({ error: 'Missing data' });

  const langName = lang === 'es' ? 'Spanish' : lang === 'pt' ? 'Portuguese' : 'English';

  try {
    const r = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 180,
      system: `You are a savage, witty, irreverent music critic roasting someone's Spotify taste in a chat. 
Be VERY specific — mention actual artist names and roast the weird or contradictory combinations brutally but playfully.
Short punchy replies, like texting a friend. Max 2 sentences. 
Write in ${langName}. No hashtags. No emojis. Be surprising and creative each time — never repeat the same reply.
Their top artists: ${artists.join(', ')}.`,
      messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    res.json({ reply: r.data.content?.[0]?.text || '' });
  } catch(err) {
    console.error('Roast error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Roast failed' });
  }
});

app.listen(PORT, () => console.log(`\n🎵 LineApp en http://127.0.0.1:${PORT}\n`));
