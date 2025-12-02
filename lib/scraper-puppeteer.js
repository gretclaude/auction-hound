import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

/**
 * Puppeteer-based scraper for auctionet.com
 * Uses a real browser to bypass bot protection
 */

let browser = null;
let page = null;

/**
 * Initialize browser
 */
async function initBrowser() {
  if (!browser) {
    console.log('🌐 Starting browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  }
  return page;
}

/**
 * Close browser
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

/**
 * Fetch a single auction item page
 */
export async function fetchAuctionItem(itemId) {
  const url = `https://auctionet.com/en/${itemId}`;
  const page = await initBrowser();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract item details
    const title = $('h1').first().text().trim();

    // Get all images
    const images = [];
    $('img[src*="auctiocdn.com"]').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        const highResSrc = src.replace('/thumb/', '/large/').replace('_thumb', '');
        images.push(highResSrc);
      }
    });

    // Extract other details
    const currentBid = $('[class*="current"], [class*="bid"]').first().text().trim();
    const estimate = $('[class*="estimate"]').first().text().trim();
    const endTime = $('time, [class*="countdown"]').first().text().trim();
    const auctionHouse = $('[class*="auction-house"], [class*="seller"]').first().text().trim();

    return {
      itemId,
      url,
      title,
      images: [...new Set(images)],
      currentBid,
      estimate,
      endTime,
      auctionHouse,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch ${itemId}: ${error.message}`);
  }
}

/**
 * Fetch recent auctions from listing page
 */
export async function fetchRecentAuctions(limit = 100) {
  const page = await initBrowser();
  const allItems = [];
  let pageNum = 1;

  console.log('🔍 Fetching recent auctions...');

  while (allItems.length < limit) {
    const url = `https://auctionet.com/en/search?page=${pageNum}&sort=newest`;

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();
      const $ = cheerio.load(html);

      const itemsOnPage = [];
      $('a[href*="/en/"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const match = href?.match(/\/en\/(\d+)-/);
        if (match && match[1]) {
          itemsOnPage.push(match[1]);
        }
      });

      if (itemsOnPage.length === 0) break;

      const uniqueItems = [...new Set(itemsOnPage)];
      allItems.push(...uniqueItems);

      console.log(`  Page ${pageNum}: found ${uniqueItems.length} items (total: ${allItems.length})`);

      pageNum++;
      if (allItems.length >= limit) break;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error on page ${pageNum}:`, error.message);
      break;
    }
  }

  return [...new Set(allItems)].slice(0, limit);
}

/**
 * Download image
 */
export async function downloadImage(imageUrl, itemId) {
  const tempDir = './temp';
  await fs.mkdir(tempDir, { recursive: true });

  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const filename = `${itemId}${ext}`;
  const filepath = path.join(tempDir, filename);

  const page = await initBrowser();
  const response = await page.goto(imageUrl);
  const buffer = await response.buffer();

  await fs.writeFile(filepath, buffer);
  return filepath;
}

/**
 * Batch fetch with browser reuse
 */
export async function fetchAuctionItemsBatch(itemIds, delayMs = 500) {
  await initBrowser();

  const results = [];
  const errors = [];

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];

    try {
      console.log(`  [${i + 1}/${itemIds.length}] Fetching ${itemId}...`);
      const item = await fetchAuctionItem(itemId);
      results.push(item);

      if (i < itemIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ itemId, error: error.message });
    }
  }

  await closeBrowser();
  return { results, errors };
}
