require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const fronturl = process.env.FRONT_URL;
// Configure CORS to allow only your frontend
// app.use(cors({
//   origin: fronturl,
//   methods: ["GET", "POST", "PUT", "DELETE"], 
//   credentials: true 
// }));


// ------------------------
// MySQL setup
// ------------------------
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ------------------------
// Gmail config
// ------------------------
const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_REDIRECT_URI,
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
};



// ------------------------
// Helper functions
// ------------------------
async function getTokens(userEmail) {
  const [rows] = await db.query('SELECT * FROM gmail_tokens WHERE user_email = ?', [userEmail]);
  return rows[0];
}

async function saveTokens(userEmail, accessToken, refreshToken, expiry) {
  await db.query(
    `INSERT INTO gmail_tokens (user_email, access_token, refresh_token, expiry)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE access_token=?, refresh_token=?, expiry=?`,
    [userEmail, accessToken, refreshToken, expiry, accessToken, refreshToken, expiry]
  );
}
function formatDateForMySQL(isoString) {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

// ------------------------
// Gmail parsing functions
// ------------------------
function parseGmailMessage(gmailData) {
  const headers = gmailData.payload.headers || [];
  const getHeader = (name) => {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  const subject = getHeader('Subject') || '(No Subject)';
  const from = getHeader('From') || 'Unknown';
  const to = getHeader('To') || 'Unknown';
  const dateHeader = getHeader('Date') || new Date().toISOString();

  // Parse From field
  let fromName = from;
  let fromEmail = from;
  const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/);
  if (fromMatch) {
    fromName = fromMatch[1].trim().replace(/['"]/g, '');
    fromEmail = fromMatch[2].trim();
  }

  // Helper to find HTML or text recursively
  function findPart(parts, mimeType) {
    for (const p of parts) {
      if (p.mimeType === mimeType && p.body?.data)
        return Buffer.from(p.body.data, 'base64url').toString('utf-8');
      if (p.parts) {
        const r = findPart(p.parts, mimeType);
        if (r) return r;
      }
    }
    return '';
  }

  let htmlBody = '';
  let textBody = '';

  if (gmailData.payload.mimeType === 'text/html' && gmailData.payload.body?.data) {
    htmlBody = Buffer.from(gmailData.payload.body.data, 'base64url').toString('utf-8');
  } else if (gmailData.payload.parts) {
    htmlBody = findPart(gmailData.payload.parts, 'text/html');
  }

  if (gmailData.payload.mimeType === 'text/plain' && gmailData.payload.body?.data) {
    textBody = Buffer.from(gmailData.payload.body.data, 'base64url').toString('utf-8');
  } else if (gmailData.payload.parts) {
    textBody = findPart(gmailData.payload.parts, 'text/plain');
  }

  return {
    message_id: gmailData.id,
    thread_id: gmailData.threadId,
    subject,
    from_name: fromName,
    from_email: fromEmail,
    to_email: to,
    date: new Date(dateHeader).toISOString(),
    html_body: htmlBody || `<html><body>${textBody}</body></html>`,
    text_body: textBody,
    headers: headers.length > 0 ? headers : [], // ensure always an array
  };
}


// Dummy brand/language/country detection
function detectBrand(email) { return email.split('@')[1]?.split('.')[0] || 'Unknown'; }
function detectLanguage(text) { return 'en'; }
//async function detectCountry(headers) { return 'Unknown'; }
const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
const countryCache = {}; // cache results to reduce API calls

async function detectCountry(headers, fromEmail) {
  // 1️⃣ Try TLD first (sender domain)
  const domain = fromEmail.split('@')[1] || '';
  const tld = domain.split('.').pop()?.toLowerCase();
  const countryMap = { 
    uk: 'United Kingdom', 
    pk: 'Pakistan', 
    de: 'Germany', 
    fr: 'France', 
    in: 'India', 
    au: 'Australia', 
    ca: 'Canada', 
    us: 'United States' // add common TLDs
  };
  if (countryMap[tld]) return countryMap[tld];

  // 2️⃣ Try Received headers for public IP
  const receivedHeader = headers.find(h => h.name.toLowerCase() === 'received')?.value;
  if (!receivedHeader) return 'Unknown';

  const ipMatch = receivedHeader.match(/\b\d{1,3}(\.\d{1,3}){3}\b/);
  if (!ipMatch) return 'Unknown';

  const ip = ipMatch[0];

  // Skip private/internal IPs
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(ip)) {
    return 'Unknown';
  }

  // 3️⃣ Return from cache if already fetched
  if (countryCache[ip]) return countryCache[ip];

  // 4️⃣ Fetch from IPinfo Lite
  try {
    const res = await fetch(`https://ipinfo.io/lite/${ip}?token=${IPINFO_TOKEN}`);
    if (!res.ok) {
      // 404 is expected for many Gmail/Outlook IPs
      if (res.status !== 404) console.warn(`IPinfo API returned status ${res.status} for IP ${ip}`);
      countryCache[ip] = 'Unknown';
      return 'Unknown';
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn(`IPinfo response not JSON for IP ${ip}: ${text}`);
      countryCache[ip] = 'Unknown';
      return 'Unknown';
    }

    const country = data.country || 'Unknown';
    countryCache[ip] = country; // cache result
    return country;
  } catch (err) {
    console.error(`Error fetching country from IPinfo for IP ${ip}:`, err);
    countryCache[ip] = 'Unknown';
  }

  return 'Unknown';
}



// ------------------------
// Routes
// ------------------------

// Manual login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const [rows] = await db.query('SELECT * FROM users WHERE email=? AND password=?', [email, password]);
  if (!rows || rows.length === 0) return res.status(401).json({ error: 'Incorrect email or password' });

  const token = await getTokens(email);
  res.json({ email, tokenExists: !!token });
});

// Gmail OAuth
app.get('/auth/google', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: GMAIL_CONFIG.clientId,
    redirect_uri: GMAIL_CONFIG.redirectUri,
    response_type: 'code',
    scope: GMAIL_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  }).toString();
  res.redirect(url.toString());
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code received');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CONFIG.clientId,
      client_secret: GMAIL_CONFIG.clientSecret,
      redirect_uri: GMAIL_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await tokenRes.json();
  if (data.error) return res.send(`OAuth error: ${data.error}`);

  const expiry = new Date(Date.now() + data.expires_in * 1000);

  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profileData = await profileRes.json();
  const userEmail = profileData.emailAddress;

  await saveTokens(userEmail, data.access_token, data.refresh_token, expiry);

  res.redirect('http://localhost:5173'); 
});

// Get logged-in user email
app.get('/user/email', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT users.email FROM users
       JOIN gmail_tokens ON users.email = gmail_tokens.user_email
       ORDER BY gmail_tokens.expiry DESC
       LIMIT 1`
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'No logged-in user' });
    res.json({ email: rows[0].email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------
// Import emails (updated to fetch full data)
// ------------------------
app.get('/messages/import', async (req, res) => {
  try {
    const userEmail = req.query.user_email;
    let maxEmails = parseInt(req.query.max) || 50;
    if (maxEmails > 50) maxEmails = 50;
    if (!userEmail) return res.status(400).send('Missing user_email');

    const [userRows] = await db.query('SELECT * FROM users WHERE email=?', [userEmail]);
    if (!userRows || userRows.length === 0) return res.status(404).send('User not found');
    const user = userRows[0];

    let tokens = await getTokens(userEmail);
    if (!tokens) return res.status(400).send('No Gmail tokens found');

    // ---------- Refresh token if expired ----------
    const now = new Date();
    if (new Date(tokens.expiry) <= now) {
      console.log('Access token expired, refreshing...');
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GMAIL_CONFIG.clientId,
          client_secret: GMAIL_CONFIG.clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      const data = await tokenRes.json();
      if (!data.access_token) return res.status(400).send('Failed to refresh access token');

      const newExpiry = new Date(Date.now() + data.expires_in * 1000);
      await saveTokens(userEmail, data.access_token, tokens.refresh_token, newExpiry);

      tokens = { ...tokens, access_token: data.access_token, expiry: newExpiry };
      console.log('Token refreshed successfully');
    }

    // ---------- Fetch Gmail messages with pagination ----------
    let allMessages = [];
    let nextPageToken = null;

    do {
      const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages`);
      url.search = new URLSearchParams({
        maxResults: 50,
        pageToken: nextPageToken || ''
      });

      const listRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const listData = await listRes.json();
      console.log('Fetched batch of messages:', listData.messages?.length || 0);

      if (!listData.messages || listData.messages.length === 0) break;

      allMessages.push(...listData.messages);

      nextPageToken = listData.nextPageToken;

      if (allMessages.length >= maxEmails) break;

    } while (nextPageToken);

    // ---------- Process messages ----------
    const messages = [];

    for (const msg of allMessages) {
      const id = msg?.id;
      if (!id) continue;

      // Check if already exists
      const [existing] = await db.query(
        'SELECT 1 FROM emails WHERE message_id=? AND user_id=?',
        [id, user.id]
      );
      if (existing.length > 0) continue; // skip duplicates

      // Fetch full message
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const msgData = await msgRes.json();
      const parsed = parseGmailMessage(msgData);

      const messageId = parsed.message_id || id;
      const senderEmail = parsed.from_email || '';
      const senderName = parsed.from_name || 'Unknown Sender';
      const subject = parsed.subject || '(No Subject)';
      const htmlBody = parsed.html_body || `<html><body>${parsed.text_body || ''}</body></html>`;
      const textBody = parsed.text_body || '';
      const date = formatDateForMySQL(parsed.date || new Date().toISOString());
      const brandGuess = detectBrand(senderEmail);
      const languageGuess = detectLanguage(textBody);
      const countryGuess = parsed.headers ? await detectCountry(parsed.headers, senderEmail) : 'Unknown';
      const snippet = msgData.snippet || textBody.substring(0, 300);

      await db.query(
        `INSERT INTO emails
        (user_id, message_id, subject, sender_name, sender_email,
         recipient_email, sent_at, body_html, body_text,
         snippet, brand, language, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          messageId,
          subject,
          senderName,
          senderEmail,
          'me',
          date,
          htmlBody,
          textBody,
          snippet,
          brandGuess,
          languageGuess,
          countryGuess
        ]
      );

      messages.push({ message_id: messageId, subject, sender_name: senderName, sender_email: senderEmail, text_body: textBody, brand: brandGuess, language: languageGuess, country: countryGuess });

      // Stop if we reached maxEmails
      if (messages.length >= maxEmails) break;
    }

    // Update imported count
    await db.query(
      `UPDATE users SET emails_imported_count = emails_imported_count + ? WHERE id=?`,
      [messages.length, user.id]
    );

    console.log(`Imported ${messages.length} new emails for user ${userEmail}`);
    res.json({ imported: messages.length, emails: messages });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error while importing emails');
  }
});

// ------------------------
// Global Email Templates listing
// ------------------------
app.get('/templates', async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;

    if (limit > 50) limit = 50;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    // ---------- Build Filters ----------
    const where = [];
    const params = [];

    // Search
    if (req.query.search) {
      where.push(`(subject LIKE ? OR snippet LIKE ?)`);
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    // Brand filter
    if (req.query.brand) {
      where.push(`brand = ?`);
      params.push(req.query.brand);
    }

    // Language filter
    if (req.query.language) {
      where.push(`language = ?`);
      params.push(req.query.language);
    }

    // Country filter
    if (req.query.country) {
      where.push(`country = ?`);
      params.push(req.query.country);
    }

    // Combine WHERE
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ---------- Total Count ----------
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM emails ${whereSQL}`,
      params
    );

    // ---------- Fetch Templates ----------
    const [rows] = await db.query(
      `
      SELECT
        id,
        subject,
        sender_name,
        sender_email,
        snippet,
        brand,
        language,
        country,
        sent_at
      FROM emails
      ${whereSQL}
      ORDER BY sent_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      templates: rows,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.get('/templates/filters', async (req,res)=>{
  try {
    const [brands] = await db.query("SELECT DISTINCT brand FROM emails");
    const [langs] = await db.query("SELECT DISTINCT language FROM emails");
    const [countries] = await db.query("SELECT DISTINCT country FROM emails");

    res.json({
      brands: brands.map(x=>x.brand),
      languages: langs.map(x=>x.language),
      countries: countries.map(x=>x.country),
    });

  } catch(err){
    console.error(err);
    res.status(500).json({error:'Failed to load filters'});
  }
});

// ------------------------
// Get single email/template by ID
// ------------------------
app.get('/templates/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Fetch email by ID
    const [rows] = await db.query(
      `SELECT
        id,
        subject,
        sender_name,
        sender_email,
        recipient_email,
        snippet,
        brand,
        language,
        country,
        sent_at,
        body_html,
        body_text
      FROM emails
      WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});




app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
