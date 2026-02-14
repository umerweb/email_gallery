const { chromium } = require('playwright');
const sharp = require('sharp');

/**
 * Generate email thumbnails and store directly in DB as base64 PNG
 * @param {object} db - MySQL2/promise instance
 * @param {number} batchSize - Number of emails to process per run
 */
async function generateThumbnailsForEmails(db, batchSize = 50) {
  try {
    const [emails] = await db.query(
      'SELECT id, body_html FROM emails WHERE thumbnail_path IS NULL LIMIT ?',
      [batchSize]
    );

    if (!emails.length) {
      console.log('No emails without thumbnails.');
      return;
    }

    console.log(`Generating thumbnails for ${emails.length} emails...`);

    const browser = await chromium.launch({ args: ['--no-sandbox'] });

    for (const email of emails) {
      const page = await browser.newPage();

      try {
        // Mobile-like viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Load email HTML fully
        await page.setContent(email.body_html, {
          waitUntil: 'networkidle',
          timeout: 30000, // 30s max
        });

        // Wait a bit extra for images/fonts to render
        await page.waitForTimeout(2000); // tweak if needed

        // Take full viewport screenshot (not full page to avoid extra empty space)
        const screenshotBuffer = await page.screenshot({ fullPage: false });

        // Resize/crop to fixed 250x333 px thumbnail
        const thumbBuffer = await sharp(screenshotBuffer)
          .resize(250, 333, { fit: 'cover', position: 'top' }) // top-focus for mobile view
          .png({ quality: 85 })
          .toBuffer();

        const thumbBase64 = thumbBuffer.toString('base64');

        // Save to DB
        await db.query('UPDATE emails SET thumbnail_path=? WHERE id=?', [
          thumbBase64,
          email.id,
        ]);

        console.log(`Thumbnail saved for email ID ${email.id}`);
      } catch (err) {
        console.error(`Failed thumbnail for email ID ${email.id}:`, err.message);
      } finally {
        await page.close();
      }
    }

    await browser.close();
    console.log('Thumbnail generation batch complete.');
  } catch (err) {
    console.error('Error in generateThumbnailsForEmails:', err);
  }
}

module.exports = { generateThumbnailsForEmails };
