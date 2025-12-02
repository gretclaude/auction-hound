import imghash from 'imghash';
import fs from 'fs/promises';
import { downloadImage } from './scraper.js';

/**
 * Image similarity using perceptual hashing
 *
 * Perceptual hash (pHash) creates a "fingerprint" of an image based on its
 * visual features. Similar images have similar hashes.
 *
 * Hamming distance measures how different two hashes are.
 * Lower distance = more similar images
 */

/**
 * Calculate perceptual hash for an image file
 */
export async function calculateHash(imagePath) {
  try {
    const hash = await imghash.hash(imagePath);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash image ${imagePath}: ${error.message}`);
  }
}

/**
 * Calculate Hamming distance between two hashes
 * Returns a number between 0-64 (for 64-bit hash)
 * Lower = more similar
 */
export function hammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be same length');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Convert Hamming distance to similarity percentage
 * 0 distance = 100% similar
 * Max distance (64) = 0% similar
 */
export function distanceToSimilarity(distance, maxDistance = 64) {
  return Math.round(((maxDistance - distance) / maxDistance) * 100);
}

/**
 * Compare two images and return similarity percentage
 */
export async function compareImages(imagePath1, imagePath2) {
  try {
    const hash1 = await calculateHash(imagePath1);
    const hash2 = await calculateHash(imagePath2);

    const distance = hammingDistance(hash1, hash2);
    const similarity = distanceToSimilarity(distance);

    return {
      similarity,
      distance,
      hash1,
      hash2
    };
  } catch (error) {
    throw new Error(`Image comparison failed: ${error.message}`);
  }
}

/**
 * Compare a new item against all favorite items
 * Returns matches above the threshold
 */
export async function findSimilarItems(newItem, favoriteItems, threshold = 75) {
  if (!newItem.images || newItem.images.length === 0) {
    console.log(`  ⚠️  No images for item ${newItem.itemId}`);
    return [];
  }

  // Download the new item's first image
  const newImageUrl = newItem.images[0];
  let newImagePath;

  try {
    console.log(`  📥 Downloading new item image: ${newItem.itemId}`);
    newImagePath = await downloadImage(newImageUrl, `new-${newItem.itemId}`);
  } catch (error) {
    console.error(`  ❌ Failed to download: ${error.message}`);
    return [];
  }

  const matches = [];

  // Compare against each favorite
  for (const favorite of favoriteItems) {
    if (!favorite.images || favorite.images.length === 0) {
      continue;
    }

    try {
      // Download favorite image if we don't have it cached
      const favoriteImageUrl = favorite.images[0];
      const favoriteImagePath = await downloadImage(favoriteImageUrl, `fav-${favorite.itemId}`);

      // Compare images
      const result = await compareImages(newImagePath, favoriteImagePath);

      if (result.similarity >= threshold) {
        matches.push({
          newItem,
          matchedFavorite: favorite,
          similarity: result.similarity,
          distance: result.distance
        });
      }

      // Clean up favorite image (we'll re-download next time if needed)
      // Keep new image for the email
      await fs.unlink(favoriteImagePath).catch(() => {});

    } catch (error) {
      console.error(`  ⚠️  Error comparing with favorite ${favorite.itemId}: ${error.message}`);
      continue;
    }
  }

  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);

  return matches;
}

/**
 * Batch process multiple new items against favorites
 */
export async function batchFindSimilar(newItems, favoriteItems, threshold = 75) {
  console.log(`\n🔍 Comparing ${newItems.length} new items against ${favoriteItems.length} favorites...`);
  console.log(`   Threshold: ${threshold}% similarity\n`);

  const allMatches = [];

  for (let i = 0; i < newItems.length; i++) {
    const newItem = newItems[i];
    console.log(`[${i + 1}/${newItems.length}] Checking ${newItem.itemId}: ${newItem.title?.substring(0, 50)}...`);

    try {
      const matches = await findSimilarItems(newItem, favoriteItems, threshold);

      if (matches.length > 0) {
        console.log(`  ✅ Found ${matches.length} matches!`);
        allMatches.push(...matches);
      } else {
        console.log(`  No matches above ${threshold}%`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n✨ Total matches found: ${allMatches.length}`);

  return allMatches;
}

/**
 * Pre-calculate hashes for all favorite items (optimization)
 * Store hashes to avoid recalculating every time
 */
export async function precalculateFavoriteHashes(favoriteItems) {
  console.log('🔢 Pre-calculating hashes for favorite items...');

  const hashesPath = './data/favorite-hashes.json';
  await fs.mkdir('./data', { recursive: true });

  const hashes = {};

  for (let i = 0; i < favoriteItems.length; i++) {
    const item = favoriteItems[i];

    if (!item.images || item.images.length === 0) {
      continue;
    }

    try {
      console.log(`  [${i + 1}/${favoriteItems.length}] ${item.itemId}`);

      const imageUrl = item.images[0];
      const imagePath = await downloadImage(imageUrl, `fav-${item.itemId}`);
      const hash = await calculateHash(imagePath);

      hashes[item.itemId] = {
        hash,
        imageUrl
      };

      // Clean up
      await fs.unlink(imagePath).catch(() => {});

    } catch (error) {
      console.error(`  ⚠️  Failed: ${error.message}`);
    }
  }

  await fs.writeFile(hashesPath, JSON.stringify(hashes, null, 2));
  console.log(`✅ Saved ${Object.keys(hashes).length} hashes to ${hashesPath}`);

  return hashes;
}
