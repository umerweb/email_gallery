// importBrandsWithFavicons.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// ---------------- CONFIG ----------------
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};


const brandsFile = 'brands.txt'; // Each line: BrandName<TAB>domain.com<TAB>Country

// ---------------- HELPER: FETCH FAVICON ----------------
async function fetchFavicon(domain) {
  const url = `https://${domain}/favicon.ico`;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return res.data; // Buffer
  } catch (err) {
    console.warn(`Failed to fetch favicon for ${domain}: ${err.message}`);
    return null;
  }
}

// ---------------- MAIN ----------------
async function main() {
  const connection = await mysql.createConnection(DB_CONFIG);

  const lines = fs.readFileSync(brandsFile, 'utf-8')
                  .split('\n')
                  .map(l => l.trim())
                  .filter(l => l);

  for (const line of lines) {
    const [name, domain, country] = line.split('\t');
    if (!name || !domain) continue;

    console.log(`Processing: ${name} (${domain})`);

    const faviconData = await fetchFavicon(domain);

    try {
      await connection.execute(
        `INSERT INTO brands (name, domain, image_url, country, description) VALUES (?, ?, ?, ?, ?)`,
        [name, domain, faviconData, country || null, null]
      );
      console.log(`Inserted ${name}`);
    } catch (err) {
      console.error(`DB insert failed for ${name}: ${err.message}`);
    }
  }

  await connection.end();
  console.log('Done.');
}

main();
