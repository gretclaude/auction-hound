#!/usr/bin/env node

/**
 * Auction Hound - Main Script
 *
 * Compares new auctionet items against your saved favorites
 * using image similarity, and sends email alerts for matches.
 */

import 'dotenv/config';
import fs from 'fs/promises';
import { fetchRecentAuctions, fetchAuctionItemsBatch } from './lib/scraper.js';
import { batchFindSimilar } from './lib/image-similarity.js';
import { createTransporter, sendMatchEmail, saveEmailPreview } from './lib/email.js';

// Configuration
const CONFIG = {
  emailUser: process.env.EMAIL_USER || 'grets05@msn.com',
  emailPassword: process.env.EMAIL_PASSWORD,
  similarityThreshold: parseInt(process.env.SIMILARITY_THRESHOLD) || 75,
  maxAuctionsToCheck: parseInt(process.env.MAX_AUCTIONS_TO_CHECK) || 500,
  favoritesFile: './data/favorites.json',
  logFile: './data/log.csv',
  dryRun: process.env.DRY_RUN === 'true', // Set to true to skip sending email
};

/**
 * Main function
 */
async function main() {
  console.log('🐕 Auction Hound - Image Similarity Alert System');
  console.log('='.repeat(60));
  console.log(`Similarity threshold: ${CONFIG.similarityThreshold}%`);
  console.log(`Checking up to ${CONFIG.maxAuctionsToCheck} newest auctions`);
  console.log('');

  try {
    // Step 1: Load favorites
    console.log('📂 Loading your favorites...');
    const favorites = await loadFavorites(CONFIG.favoritesFile);
    console.log(`   Found ${favorites.length} favorite items\n`);

    if (favorites.length === 0) {
      console.log('⚠️  No favorites found!');
      console.log('   Run the favorites export tool first to save your watchlist.');
      console.log('   See SETUP.md for instructions.\n');
      return;
    }

    // Step 2: Fetch recent auctions
    console.log('🔍 Fetching newest auctions from auctionet...');
    const recentItemIds = await fetchRecentAuctions(CONFIG.maxAuctionsToCheck);
    console.log(`   Found ${recentItemIds.length} recent items\n`);

    if (recentItemIds.length === 0) {
      console.log('⚠️  No new auctions found. This might be a scraping issue.');
      return;
    }

    // Step 3: Fetch full details for recent items
    console.log('📥 Fetching details for recent auctions...');
    const { results: newItems, errors } = await fetchAuctionItemsBatch(
      recentItemIds.slice(0, 50), // Start with first 50 for testing
      1000 // 1 second delay between requests
    );
    console.log(`   Successfully fetched ${newItems.length} items`);
    if (errors.length > 0) {
      console.log(`   ${errors.length} errors occurred\n`);
    }

    // Step 4: Compare images and find matches
    const matches = await batchFindSimilar(
      newItems,
      favorites,
      CONFIG.similarityThreshold
    );

    // Step 5: Send results
    if (matches.length === 0) {
      console.log('\n😴 No similar items found this time.');
      await logRun(CONFIG.logFile, { newItemsChecked: newItems.length, matchesFound: 0 });
      return;
    }

    console.log(`\n✨ Found ${matches.length} matches!\n`);

    // Group matches by new item to avoid duplicates
    const uniqueMatches = deduplicateMatches(matches);
    console.log(`   ${uniqueMatches.length} unique items after deduplication\n`);

    // Save email preview
    await saveEmailPreview(uniqueMatches, CONFIG.similarityThreshold);

    // Send email
    if (CONFIG.dryRun || !CONFIG.emailPassword) {
      console.log('📧 DRY RUN - Email not sent (preview saved to data/email-preview.html)');
      console.log('   Set EMAIL_PASSWORD in .env to enable sending\n');
    } else {
      console.log('📧 Sending email notification...');
      const transporter = createTransporter(CONFIG.emailUser, CONFIG.emailPassword);
      await sendMatchEmail(
        transporter,
        CONFIG.emailUser,
        uniqueMatches,
        CONFIG.similarityThreshold
      );
    }

    // Log this run
    await logRun(CONFIG.logFile, {
      newItemsChecked: newItems.length,
      matchesFound: uniqueMatches.length
    });

    // Cleanup temp files
    await cleanupTempFiles();

    console.log('✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Load favorites from JSON file
 */
async function loadFavorites(filepath) {
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    const favorites = JSON.parse(data);
    return Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // File doesn't exist yet
    }
    throw error;
  }
}

/**
 * Remove duplicate matches (keep highest similarity for each new item)
 */
function deduplicateMatches(matches) {
  const uniqueMap = new Map();

  for (const match of matches) {
    const itemId = match.newItem.itemId;

    if (!uniqueMap.has(itemId)) {
      uniqueMap.set(itemId, match);
    } else {
      // Keep the match with higher similarity
      const existing = uniqueMap.get(itemId);
      if (match.similarity > existing.similarity) {
        uniqueMap.set(itemId, match);
      }
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Log run to CSV file
 */
async function logRun(logFile, data) {
  await fs.mkdir('./data', { recursive: true });

  const timestamp = new Date().toISOString();
  const logLine = `${timestamp},${data.newItemsChecked},${data.matchesFound}\n`;

  try {
    // Check if file exists
    try {
      await fs.access(logFile);
    } catch {
      // File doesn't exist, create with header
      await fs.writeFile(logFile, 'timestamp,items_checked,matches_found\n');
    }

    // Append log entry
    await fs.appendFile(logFile, logLine);
  } catch (error) {
    console.error('Warning: Failed to write log:', error.message);
  }
}

/**
 * Clean up temporary image files
 */
async function cleanupTempFiles() {
  try {
    const files = await fs.readdir('./temp');
    for (const file of files) {
      await fs.unlink(`./temp/${file}`);
    }
    console.log('🧹 Cleaned up temp files');
  } catch (error) {
    // Temp dir might not exist, that's okay
  }
}

// Run main function
main();
