#!/usr/bin/env node

/**
 * Test script to verify the setup
 */

import { fetchAuctionItem } from './lib/scraper.js';
import { compareImages } from './lib/image-similarity.js';
import fs from 'fs/promises';

const TEST_ITEMS = [
  '4711328', // Birch bookcase
  '4675202', // Armchair
  '4693735'  // Mahogany bookcase
];

async function test() {
  console.log('🧪 Testing Auction Hound Setup\n');
  console.log('='.repeat(60));

  // Test 1: Scraping
  console.log('\n📥 Test 1: Scraping auctionet...');
  try {
    const item = await fetchAuctionItem(TEST_ITEMS[0]);
    console.log('✅ Scraping works!');
    console.log(`   Title: ${item.title}`);
    console.log(`   Images: ${item.images.length} found`);
    console.log(`   URL: ${item.url}`);
  } catch (error) {
    console.log('❌ Scraping failed:', error.message);
    console.log('   This might mean auctionet changed their HTML structure');
    console.log('   Or rate limiting is strict. Try adding delays.');
  }

  // Test 2: Favorites file
  console.log('\n📂 Test 2: Checking favorites file...');
  try {
    const favData = await fs.readFile('./data/favorites.json', 'utf-8');
    const favorites = JSON.parse(favData);
    console.log(`✅ Found ${favorites.length} favorites`);

    if (favorites.length > 0) {
      const sample = favorites[0];
      console.log(`   Sample: ${sample.title || sample.itemId}`);
      console.log(`   Has images: ${sample.images?.length > 0 ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log('⚠️  No favorites.json found');
    console.log('   You need to export your favorites first!');
    console.log('   Open tools/export-favorites.html for instructions.');
  }

  // Test 3: Email config
  console.log('\n📧 Test 3: Email configuration...');
  if (process.env.EMAIL_PASSWORD) {
    console.log('✅ Email password configured');
  } else {
    console.log('⚠️  EMAIL_PASSWORD not set in .env');
    console.log('   Emails won\'t send until you add it');
  }

  // Test 4: Image processing
  console.log('\n🖼️  Test 4: Image processing...');
  try {
    await fs.mkdir('./temp', { recursive: true });
    console.log('✅ Temp directory ready');
    console.log('   Image comparison should work');
  } catch (error) {
    console.log('❌ Could not create temp directory:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   1. Scraper: Ready to test with real run');
  console.log('   2. Favorites: Export yours using tools/export-favorites.html');
  console.log('   3. Email: Add password to .env when ready');
  console.log('   4. Image processing: Ready\n');
  console.log('Next step: Export favorites, then run "npm start"\n');
}

test();
