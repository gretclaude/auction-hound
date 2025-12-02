# 🚀 Quick Setup Guide (Tonight's Tasks)

This is your checklist for setting up Auction Hound tonight after work!

## ✅ Phase 1: Initial Setup (5 minutes)

### 1. Install Dependencies

```bash
cd auction-hound
npm install
```

This installs:
- axios (HTTP requests)
- cheerio (HTML parsing)
- sharp (image processing)
- imghash (perceptual hashing)
- nodemailer (email)
- dotenv (config)

### 2. Create Config File

```bash
cp .env.example .env
```

Edit `.env` and add:
```
EMAIL_USER=grets05@msn.com
EMAIL_PASSWORD=          # Leave blank for now
SIMILARITY_THRESHOLD=75
MAX_AUCTIONS_TO_CHECK=500
```

## ✅ Phase 2: Export Your Favorites (2-3 minutes)

### Option A: Browser Console (Recommended)

1. **Go to** https://auctionet.com/en/my/watchlist
2. **Click** "Ended auctions" tab
3. **Scroll down** multiple times to load all ~1000 items
   - Each scroll loads ~50 more
   - Keep scrolling until no new items appear
4. **Open console** (F12 or Cmd+Option+J)
5. **Copy/paste this code:**

```javascript
// Extract all items
const items = [];
const links = document.querySelectorAll('a[href*="/en/"]');

links.forEach(elem => {
  const href = elem.getAttribute('href');
  const match = href?.match(/\/en\/(\d+)-(.+)/);

  if (match && match[1]) {
    const img = elem.querySelector('img') || elem.closest('tr, div')?.querySelector('img');
    items.push({
      itemId: match[1],
      title: elem.textContent.trim() || match[2],
      url: `https://auctionet.com${href}`,
      images: img ? [img.src || img.getAttribute('data-src')] : [],
      exportedAt: new Date().toISOString()
    });
  }
});

// Remove duplicates
const unique = Array.from(new Map(items.map(item => [item.itemId, item])).values());

// Download JSON
const dataStr = JSON.stringify(unique, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'favorites.json';
a.click();

console.log(`✅ Exported ${unique.length} favorites!`);
```

6. **Save the downloaded file** as:
   ```
   auction-hound/data/favorites.json
   ```

### Option B: Bookmarklet

1. Open `tools/export-favorites.html` in browser
2. Drag the bookmarklet to your bookmarks bar
3. Go to watchlist, scroll to load all items
4. Click bookmarklet
5. Save file to `data/favorites.json`

## ✅ Phase 3: Test Run (2 minutes)

```bash
# Test configuration
npm test

# Dry run (doesn't send email, saves preview)
DRY_RUN=true npm start
```

Check the output:
- ✅ Did it scrape new auctions?
- ✅ Did it find your favorites?
- ✅ Did it compare images?
- ✅ Is there a preview at `data/email-preview.html`?

Open `data/email-preview.html` in your browser to see what the email looks like!

## ✅ Phase 4: Email Setup (10 minutes)

### Get MSN/Outlook App Password

1. Go to https://account.microsoft.com/security
2. Click **"Advanced security options"**
3. Scroll to **"App passwords"**
4. Click **"Create a new app password"**
5. Copy the generated password (looks like: `abcd efgh ijkl mnop`)
6. Paste it in `.env`:
   ```
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

### Test Email

```bash
npm start
```

Check your email (grets05@msn.com) - you should get an alert!

**Note:** If no matches are found, that's normal - it means no new items are similar to your favorites right now.

## ✅ Phase 5: Schedule It (5 minutes)

### macOS/Linux (cron)

```bash
# Open crontab editor
crontab -e

# Add this line (runs every 3 days at 9am)
0 9 */3 * * cd /Users/yourname/auction-hound && /usr/local/bin/node index.js >> /Users/yourname/auction-hound/cron.log 2>&1
```

**Find your paths:**
```bash
# Get full path to auction-hound
pwd

# Get full path to node
which node
```

### Windows (Task Scheduler)

1. Open **Task Scheduler**
2. Click **"Create Basic Task"**
3. Name: "Auction Hound"
4. Trigger: **Daily**
5. Repeat: **Every 3 days**
6. Time: **9:00 AM**
7. Action: **Start a program**
8. Program/script: `C:\Program Files\nodejs\node.exe`
9. Arguments: `C:\Users\YourName\auction-hound\index.js`
10. Start in: `C:\Users\YourName\auction-hound`

## 🎉 You're Done!

The script will now run automatically every 3 days and email you when it finds similar items.

## Troubleshooting

### No favorites exported?
- Make sure you scrolled down on the "Ended auctions" tab
- Try the bookmarklet method instead
- Check browser console for errors

### Scraping errors (403)?
- This is normal for some requests
- If it happens a lot, increase the delay in `lib/scraper.js`

### Email not sending?
- Double-check app password (no spaces)
- Make sure it's an **app password**, not your regular password
- Check spam folder

### No matches found?
- Normal! Means no similar items right now
- Try lowering threshold to 70 in `.env`
- Check `data/log.csv` to see run history

## Next Steps

**Tomorrow morning**, check your email - you should have run logs showing it worked!

**In a few days**, if you want to improve it:
- Add Google Drive integration (see APPROACH_OPTIONS.md)
- Build a web dashboard
- Use better ML models (Approach 2)

## Files Created

After setup, you'll have:
```
auction-hound/
├── node_modules/         # Installed
├── data/
│   ├── favorites.json    # Your 1000 items
│   ├── log.csv           # Run history
│   └── email-preview.html # Last email
├── temp/                 # Auto-cleaned
└── .env                  # Your config
```

## Questions?

- Check README.md for detailed info
- All code is commented - read it!
- Or just ask me when you're back 😊

---

Enjoy finding those vintage bookcases! 📚✨
