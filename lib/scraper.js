import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

/**
 * Scraper for auctionet.com
 * Handles fetching auction items with proper headers to avoid 403 blocks
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,sv;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'Referer': 'https://auctionet.com/'
};

/**
 * Fetch a single auction item page
 */
export async function fetchAuctionItem(itemId) {
  const url = `https://auctionet.com/en/${itemId}`;

  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    // Extract item details
    const title = $('h1').first().text().trim();

    // Get all images from the gallery
    const images = [];
    $('img[src*="auctiocdn.com"], img[data-src*="auctiocdn.com"]').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        // Get high-res version if possible
        const highResSrc = src.replace('/thumb/', '/large/').replace('_thumb', '');
        images.push(highResSrc);
      }
    });

    // Extract price info
    const currentBid = $('[class*="current-bid"], [class*="CurrentBid"]').first().text().trim();
    const estimate = $('[class*="estimate"], [class*="Estimate"]').first().text().trim();

    // Extract end time
    const endTime = $('[class*="end"], [class*="countdown"], time').first().text().trim();

    // Extract auction house
    const auctionHouse = $('[class*="auction-house"], [class*="seller"]').first().text().trim();

    return {
      itemId,
      url,
      title,
      images: [...new Set(images)], // Remove duplicates
      currentBid,
      estimate,
      endTime,
      auctionHouse,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    if (error.response?.status === 403) {
      console.warn(`⚠️  403 error for ${itemId} - may need to add delay`);
    }
    throw new Error(`Failed to fetch ${itemId}: ${error.message}`);
  }
}

/**
 * Fetch recent auctions from the main listing page
 * This scrapes the "new auctions" or "active auctions" page
 */
export async function fetchRecentAuctions(limit = 100) {
  const allItems = [];
  let page = 1;

  console.log('🔍 Fetching recent auctions from auctionet...');

  while (allItems.length < limit) {
    const url = `https://auctionet.com/en/search?page=${page}&sort=newest`;

    try {
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract item IDs from links
      const itemsOnPage = [];
      $('a[href*="/en/"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const match = href?.match(/\/en\/(\d+)-/);
        if (match && match[1]) {
          itemsOnPage.push(match[1]);
        }
      });

      if (itemsOnPage.length === 0) {
        console.log('No more items found');
        break;
      }

      // Remove duplicates
      const uniqueItems = [...new Set(itemsOnPage)];
      allItems.push(...uniqueItems);

      console.log(`  Page ${page}: found ${uniqueItems.length} items (total: ${allItems.length})`);

      page++;

      // Be nice to their servers
      await sleep(1000);

      if (allItems.length >= limit) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      break;
    }
  }

  return [...new Set(allItems)].slice(0, limit);
}

/**
 * Download an image and save to temp directory
 */
export async function downloadImage(imageUrl, itemId) {
  const tempDir = './temp';
  await fs.mkdir(tempDir, { recursive: true });

  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const filename = `${itemId}${ext}`;
  const filepath = path.join(tempDir, filename);

  try {
    const response = await axios.get(imageUrl, {
      headers: HEADERS,
      responseType: 'arraybuffer',
      timeout: 15000
    });

    await fs.writeFile(filepath, response.data);
    return filepath;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Helper: sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch fetch multiple items with rate limiting
 */
export async function fetchAuctionItemsBatch(itemIds, delayMs = 500) {
  const results = [];
  const errors = [];

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];

    try {
      console.log(`  [${i + 1}/${itemIds.length}] Fetching ${itemId}...`);
      const item = await fetchAuctionItem(itemId);
      results.push(item);

      // Rate limiting
      if (i < itemIds.length - 1) {
        await sleep(delayMs);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ itemId, error: error.message });
    }
  }

  return { results, errors };
}
