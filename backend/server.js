// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// ==================== 5SIM MOCK API ====================
const mockCountries = {
  ru: { name: 'Russia', image: '🇷🇺' },
  ua: { name: 'Ukraine', image: '🇺🇦' },
  kz: { name: 'Kazakhstan', image: '🇰🇿' },
  us: { name: 'United States', image: '🇺🇸' },
  gb: { name: 'United Kingdom', image: '🇬🇧' },
  ke: { name: 'Kenya', image: '🇰🇪' },
  ng: { name: 'Nigeria', image: '🇳🇬' },
  za: { name: 'South Africa', image: '🇿🇦' },
  eg: { name: 'Egypt', image: '🇪🇬' },
  gh: { name: 'Ghana', image: '🇬🇭' },
  de: { name: 'Germany', image: '🇩🇪' },
  fr: { name: 'France', image: '🇫🇷' },
  es: { name: 'Spain', image: '🇪🇸' },
  it: { name: 'Italy', image: '🇮🇹' },
  ca: { name: 'Canada', image: '🇨🇦' }
};

const mockServices = {
  whatsapp: { name: 'WhatsApp', price: 1.99 },
  telegram: { name: 'Telegram', price: 1.49 },
  viber: { name: 'Viber', price: 1.29 },
  facebook: { name: 'Facebook', price: 1.89 },
  google: { name: 'Google', price: 1.59 },
  instagram: { name: 'Instagram', price: 1.79 },
  twitter: { name: 'Twitter', price: 1.39 },
  tiktok: { name: 'TikTok', price: 1.69 }
};

const operators = ['MTS', 'Beeline', 'Megafon', 'Tele2', 'Safaricom', 'Airtel', 'MTN', 'Glo'];

// Get countries
// Helper to call 5sim API with protocol key and optional fallback to old key
const FIVESIM_BASE = process.env.FIVESIM_BASE_URL || 'https://api.5sim.net/v1';
const PROTO_KEY = process.env.FIVESIM_PROTOCOL_KEY || null;
const OLD_KEY = process.env.FIVESIM_OLD_KEY || null;

async function call5sim(path, opts = {}) {
  const url = FIVESIM_BASE + path;
  const params = opts.params || {};
  const data = opts.data || undefined;

  async function tryRequest(key) {
    const headers = key ? { Authorization: `Bearer ${key}` } : {};
    return axios({ url, method: opts.method || 'get', params, data, headers, timeout: 15000 });
  }

  // Try protocol key first, then fallback to old key, otherwise throw
  if (PROTO_KEY) {
    try {
      return await tryRequest(PROTO_KEY);
    } catch (err) {
      // If auth error and we have an OLD_KEY, try fallback
      if (OLD_KEY && err.response && [401, 403].includes(err.response.status)) {
        return await tryRequest(OLD_KEY);
      }
      throw err;
    }
  }

  if (OLD_KEY) {
    return await tryRequest(OLD_KEY);
  }

  // No keys configured
  const e = new Error('No 5sim API key configured');
  e.code = 'NO_KEY';
  throw e;
}

app.get('/api/5sim/countries', async (req, res) => {
  try {
    const resp = await call5sim('/countries');
    // Some 5sim responses are objects keyed by country code; forward as-is
    return res.json(resp.data);
  } catch (err) {
    // Fallback to mock
    console.warn('5sim countries fetch failed, using mock:', err.message || err);
    return res.json(mockCountries);
  }
});

// Expose key presence (safe): do NOT return actual keys. Used by frontend to explain key capabilities.
app.get('/api/5sim/key-status', (req, res) => {
  try {
    return res.json({
      protocolConfigured: !!PROTO_KEY,
      oldConfigured: !!OLD_KEY,
      note: 'Keys are not exposed. This endpoint only reports whether keys are configured on the server.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not determine key status' });
  }
});

// Get services for a country
app.get('/api/5sim/services', async (req, res) => {
  const { country } = req.query;
  try {
    const resp = await call5sim('/services', { params: { country } });
    return res.json(resp.data);
  } catch (err) {
    console.warn('5sim services fetch failed, using mock:', err.message || err);
    return res.json({ services: Object.values(mockServices), operators, prices: mockServices });
  }
});

// Buy a number
app.post('/api/5sim/buy', async (req, res) => {
  const { country, service, operator } = req.body || {};
  try {
    // Attempt to call 5sim buy endpoint. The exact path may vary by 5sim API version; try common endpoints.
    // First try a POST to /buy
    try {
      const resp = await call5sim('/buy', { method: 'post', data: { country, service, operator } });
      return res.json(resp.data);
    } catch (e) {
      // If POST /buy not supported, try legacy /orders or fallback to mock
      if (e.response && e.response.status >= 400 && e.response.status < 600) {
        // fallthrough to mock
      } else {
        throw e;
      }
    }
    // Fallback: return mock buy
    const phoneNumber = `+${Math.floor(Math.random() * 10000000000)}`.substring(0, 13);
    return res.json({ success: true, phoneNumber, id: Date.now().toString(), operator: operator || 'Any', price: mockServices[service]?.price || 1.99 });
  } catch (err) {
    console.error('5sim buy error:', err.message || err);
    return res.status(502).json({ error: '5sim buy failed' });
  }
});

// Also support GET /api/5sim/buy for callers that use query params
app.get('/api/5sim/buy', async (req, res) => {
  const { country, service, operator } = req.query || {};
  try {
    // Try proxying to 5sim POST buy using query params
    try {
      const resp = await call5sim('/buy', { method: 'post', data: { country, service, operator } });
      return res.json(resp.data);
    } catch (e) {
      // fallback to mock
      const phoneNumber = `+${Math.floor(Math.random() * 10000000000)}`.substring(0, 13);
      return res.json({ success: true, phoneNumber, id: Date.now().toString(), operator: operator || 'Any', price: mockServices[service]?.price || 1.99 });
    }
  } catch (err) {
    console.error('5sim buy (GET) error:', err.message || err);
    return res.status(502).json({ error: '5sim buy failed' });
  }
});

// Check SMS
app.get('/api/5sim/check-sms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resp = await call5sim(`/check/${id}`);
    return res.json(resp.data);
  } catch (err) {
    console.warn('5sim check-sms failed, using mock:', err.message || err);
    return res.json({ success: true, messages: [{ date: new Date(), text: 'Your verification code is: 123456' }] });
  }
});

// Also support /api/5sim/check/:id to match frontend
app.get('/api/5sim/check/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resp = await call5sim(`/check/${id}`);
    return res.json(resp.data);
  } catch (err) {
    console.warn('5sim check failed, using mock:', err.message || err);
    return res.json({ success: true, messages: [{ date: new Date(), text: 'Your verification code is: 123456' }] });
  }
});

// ==================== PAYSTACK MOCK API ====================
app.get('/paystack-public-key', (req, res) => {
  res.json({
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_a0465f4104c57a61aa78866451b64a7bcf39a4bd'
  });
});

// Paystack verification using server-side secret key (do NOT expose secret)
app.get('/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || null;

  if (!PAYSTACK_SECRET) {
    // Fallback mock behavior
    return res.json({ status: 'success', reference });
  }

  try {
    const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    const resp = await axios.get(url, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, timeout: 10000 });
    // Forward Paystack response data to client
    return res.json(resp.data);
  } catch (err) {
    console.error('Paystack verify error:', err.response?.data || err.message || err);
    // Map error to 502
    return res.status(502).json({ error: 'Paystack verification failed', details: err.response?.data || err.message });
  }
});

// ==================== TELEGRAM MOCK API ====================
app.post('/api/telegram/notify/:userId', (req, res) => {
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/api/5sim/countries`);
  console.log(`   - GET  http://localhost:${PORT}/api/5sim/services?country=ke`);
  console.log(`   - POST http://localhost:${PORT}/api/5sim/buy`);
  console.log(`   - GET  http://localhost:${PORT}/paystack-public-key`);
});