# 🐕 Auction Hound

**Image similarity alerts for auctionet.com**

Get notified when items similar to your favorites come up for auction, using image matching instead of unreliable keyword search.

## What It Does

1. You export your ~1000 favorite auction items from auctionet
2. Every 3 days, it checks the newest auctions
3. Compares item images using perceptual hashing
4. Sends you an email with matches (with thumbnails + links)

## Features

✅ Image-based similarity (no keywords needed)
✅ Adjustable sensitivity (75% default)
✅ HTML email with thumbnails
✅ Separates high confidence vs. medium matches
✅ CSV log for tracking
✅ Free to run (just needs Node.js)

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env
```

### 2. Export Your Favorites

Open `tools/export-favorites.html` in your browser and follow the instructions to export your watchlist from auctionet.

Save the downloaded `favorites.json` to:
```
auction-hound/data/favorites.json
```

### 3. Configure Email (Tonight)

Edit `.env` file:
```bash
EMAIL_USER=grets05@msn.com
EMAIL_PASSWORD=your-app-password-here
SIMILARITY_THRESHOLD=75
```

**Get MSN/Outlook App Password:**
1. Go to https://account.microsoft.com/security
2. Advanced security options → App passwords
3. Create new app password
4. Copy it to `.env`

### 4. Test Run

```bash
# Test without sending email (saves preview to data/email-preview.html)
DRY_RUN=true npm start

# Real run (sends email)
npm start
```

### 5. Schedule (Every 3 Days)

**macOS/Linux (cron):**
```bash
crontab -e
```

Add this line (runs every 3 days at 9am):
```
0 9 */3 * * cd /path/to/auction-hound && npm start
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, repeat every 3 days
4. Action: Start a program
5. Program: `node`
6. Arguments: `/path/to/auction-hound/index.js`

## Configuration

Edit `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_USER` | grets05@msn.com | Your email |
| `EMAIL_PASSWORD` | - | App password (required) |
| `SIMILARITY_THRESHOLD` | 75 | Match threshold (70-90 recommended) |
| `MAX_AUCTIONS_TO_CHECK` | 500 | How many new items to check |
| `DRY_RUN` | false | Set to `true` to skip sending email |

**Threshold Guide:**
- `90+` = Very strict (almost identical items only)
- `80-89` = Similar style and color
- `70-79` = Somewhat similar (more results, more false positives)
- `<70` = Too loose, lots of noise

## File Structure

```
auction-hound/
├── index.js              # Main script
├── lib/
│   ├── scraper.js        # Auctionet scraping
│   ├── image-similarity.js   # Image comparison
│   └── email.js          # Email formatting
├── tools/
│   └── export-favorites.html  # Browser tool
├── data/
│   ├── favorites.json    # Your exported favorites
│   ├── log.csv           # Run history
│   └── email-preview.html # Last email preview
└── temp/                 # Temporary images (auto-deleted)
```

## How It Works

### Image Similarity (Perceptual Hashing)

1. **Perceptual Hash (pHash)**: Creates a "fingerprint" of each image based on visual features
   - Similar images = similar hashes
   - Insensitive to minor changes (size, compression, slight color shifts)

2. **Hamming Distance**: Measures how different two hashes are
   - Counts differing bits in the hash
   - Lower distance = more similar

3. **Similarity Score**: Converts distance to percentage
   - 100% = identical
   - 75% = similar style/composition
   - 50% = loosely related

### Scraping Strategy

Since auctionet has ~37,000 active items:
- Focuses on newest items (last 3 days)
- Checks up to 500 most recent auctions
- Rate-limited to 1 request/second
- Uses proper headers to avoid blocking

## Troubleshooting

### "No favorites found"
- Make sure `data/favorites.json` exists
- Check file has valid JSON (open in text editor)

### "403 Forbidden" errors
- Normal for occasional requests
- If persistent, increase delay in `scraper.js` (line with `delayMs`)

### "Failed to send email"
- Check email password is correct
- Make sure it's an **app password**, not your regular password
- For MSN/Outlook, must use app password

### No matches found
- Try lowering `SIMILARITY_THRESHOLD` to 70-75
- Check that favorites.json has image URLs
- Run with `DRY_RUN=true` and check `email-preview.html`

## Future Enhancements (Optional)

Once you confirm this works, you could:
1. **Move to Google Drive**: Store data in Drive instead of local files
2. **Better ML model**: Use TensorFlow.js for more accurate matching
3. **Web dashboard**: View matches in a browser
4. **Price filtering**: Only alert for items under X kr
5. **Category learning**: Learn which categories you like most

## Cost Breakdown

- Node.js: Free
- Image processing: Free (local)
- Email: Free (your MSN account)
- Storage: Free (local or your Google Drive)
- Total: **$0/month** 🎉

## Technical Details

**Dependencies:**
- `axios` - HTTP requests
- `cheerio` - HTML parsing
- `sharp` - Image processing
- `imghash` - Perceptual hashing
- `nodemailer` - Email sending

**Performance:**
- ~1-2 seconds per item comparison
- 500 items takes ~15-20 minutes
- CPU-bound during image hashing
- Memory: ~200MB peak

## Privacy & Security

- All processing happens locally on your machine
- No data sent to third parties
- Email password stored in `.env` (don't commit to git!)
- Temp images automatically deleted after run

## Support

Questions? Check:
1. `APPROACH_OPTIONS.md` - Architecture comparison
2. This README
3. Comment in the code (well-documented)

## License

MIT - Use however you like!

---

Built with ❤️ for finding vintage bookcases and display cabinets
