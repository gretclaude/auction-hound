import { fetchAuctionItem } from './lib/scraper.js';

console.log('🧪 Quick scraper test...\n');

try {
  const item = await fetchAuctionItem('4711328');
  console.log('✅ SUCCESS!\n');
  console.log('Title:', item.title);
  console.log('URL:', item.url);
  console.log('Images found:', item.images.length);
  console.log('Image URL:', item.images[0]?.substring(0, 60) + '...');
  console.log('\nScraper works! Ready to go. 🚀');
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('\nMight need to adjust scraper for auctionet structure.');
}
