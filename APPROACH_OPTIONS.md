# Auction Hound - Three Implementation Approaches

## Research Notes
- Auctionet has a dev team at [barsoom](https://github.com/barsoom)
- They mention having a public API but documentation is not readily available
- Contact: devs@auctionet.com
- May need to reverse-engineer endpoints or scrape website

---

## 🌟 Approach 1: Premium "Perfect" Solution

### Tech Stack
- **Backend**: Node.js + TypeScript
- **Image Similarity**:
  - OpenAI CLIP API or Google Vision AI ($$)
  - Or AWS Rekognition Custom Labels
- **Hosting**: Vercel/Railway/Render (serverless functions)
- **Database**: Supabase or Firebase (managed Postgres)
- **Storage**: Cloudinary for images (CDN + transformations)
- **Scheduling**: Vercel Cron or Railway Cron
- **Email**: SendGrid or Resend

### Features
- ✅ Beautiful web dashboard (React/Next.js)
- ✅ Real-time similarity scores with confidence levels
- ✅ Adjustable sensitivity sliders
- ✅ Visual comparison grid
- ✅ Price trend analysis
- ✅ Mobile app (React Native)
- ✅ Browser extension to save favorites
- ✅ Instant notifications (email + push)
- ✅ Historical tracking and analytics

### Cost Estimate
- **Monthly**: $20-50
  - Hosting: $0-20 (Vercel/Railway free tier → pro)
  - Image API: $10-20 (1000s of comparisons)
  - Database: Free (Supabase free tier covers this use case)
  - Email: Free (SendGrid 100 emails/day free)
  - Storage: $0-10 (Cloudinary free tier → paid)

### Complexity
- **Time**: 2-3 weeks
- **Difficulty**: Advanced
- **Maintenance**: Low (managed services)

### Pros
- Professional quality
- Scalable and reliable
- Great UX
- Easy to maintain

### Cons
- Ongoing costs
- More initial setup
- Overkill for personal use

---

## 🎯 Approach 2: "Nice & Free" Solution

### Tech Stack
- **Backend**: Node.js + TypeScript
- **Image Similarity**:
  - TensorFlow.js with MobileNet (runs in Node)
  - Or ONNX Runtime with ResNet
- **Hosting**: Free tier options:
  - Backend: Render/Railway/Fly.io free tier
  - Or GitHub Actions for cron jobs
- **Database**:
  - SQLite file in GitHub repo
  - Or Supabase free tier (500MB, plenty for this)
- **Storage**: Your Google Drive via API
- **Scheduling**: GitHub Actions (free cron)
- **Email**: Gmail SMTP (free, your own account)

### Features
- ✅ Simple web interface (React SPA)
- ✅ Automatic similarity matching
- ✅ Email with thumbnails and links
- ✅ Configurable threshold
- ✅ Basic statistics
- ✅ Manual favorite import/export

### Cost Estimate
- **Monthly**: $0
  - All services on free tiers
  - Uses your existing Google account

### Complexity
- **Time**: 1 week
- **Difficulty**: Intermediate
- **Maintenance**: Low-medium (occasional free tier limits)

### Architecture
```
GitHub Repo
├── /functions          # Serverless functions
│   ├── scrape.ts      # Gets new auctions
│   ├── compare.ts     # Image similarity
│   └── notify.ts      # Sends email
├── /web               # React dashboard (optional)
├── /data              # SQLite DB (committed to repo)
└── .github/workflows  # Cron job (every 3 days)
```

### Pros
- Free forever
- Decent performance
- Good architecture
- You control everything
- Can host dashboard on GitHub Pages

### Cons
- Setup more involved
- Free tier limits (should be fine for personal use)
- Image similarity is slower (but acceptable)
- Email might need SMTP configuration

---

## 🔧 Approach 3: "Scrappy MVP" Solution

### Tech Stack
- **Script**: Plain Node.js (single file)
- **Image Similarity**:
  - Simple perceptual hash (pHash) library
  - Or color histogram comparison
  - Fast but less accurate
- **"Database"**: JSON files in Google Drive
- **Storage**: Google Drive for everything
- **Scheduling**:
  - Your computer with cron (Mac/Linux)
  - Or Task Scheduler (Windows)
  - Or just run manually every 3 days
- **Email**: Nodemailer with Gmail

### Features
- ✅ Simple CLI script
- ✅ Basic image matching (decent accuracy)
- ✅ Plain text email with links
- ✅ Stores data in Google Drive as JSON

### Cost Estimate
- **Monthly**: $0
- No external services at all

### Complexity
- **Time**: 1-2 days
- **Difficulty**: Beginner-Intermediate
- **Maintenance**: Very low

### File Structure
```
auction-hound/
├── index.js           # Main script (300-400 lines)
├── config.json        # Your settings
└── package.json       # Just a few dependencies
```

### How it Works
1. Script reads your favorites from Google Drive
2. Scrapes auctionet for new items
3. Downloads new images to temp folder
4. Compares using simple image hashing
5. Sends you email with matches
6. Cleans up temp files
7. Updates data JSON in Google Drive

### Pros
- Super simple
- No external dependencies
- Free
- Easy to understand and modify
- Runs on your machine or any server
- Quick to build

### Cons
- Image matching less sophisticated (but probably good enough!)
- Need to run manually or set up cron yourself
- No web interface
- Matching based on visual similarity only (colors, shapes)
- Less accurate than ML models

---

## 📊 Comparison Table

| Feature | Approach 1 | Approach 2 | Approach 3 |
|---------|------------|------------|------------|
| **Cost** | $20-50/mo | Free | Free |
| **Build Time** | 2-3 weeks | 1 week | 1-2 days |
| **Accuracy** | Excellent | Good | Decent |
| **UI** | Beautiful | Simple | None (CLI) |
| **Maintenance** | Low | Low-Med | Very Low |
| **Your Skills** | React ✅ | React ✅ | Basic JS ✅ |
| **Learning** | APIs, Cloud | TF.js, Actions | Minimal |

---

## 🎯 My Recommendation

**Start with Approach 3**, here's why:

1. **You'll know in 2 days if this works** for your use case
2. **Image hashing is surprisingly good** for similar-looking items (similar colors, shapes, composition)
3. **If it's too inaccurate**, you can upgrade to Approach 2 later
4. **Email with links** is actually perfect for your needs
5. **Google Drive** is great since you already have space
6. Uses basic Node.js that's easy to understand even without Python knowledge

Then if you love it:
- Upgrade to Approach 2 for better accuracy (still free)
- Or Approach 1 if you want to make it pretty

---

## Next Steps

**Want me to build Approach 3?** I can create:
1. ✅ Simple Node.js script with image comparison
2. ✅ Google Drive integration for storage
3. ✅ Email alerts with thumbnails
4. ✅ Configuration file for your settings
5. ✅ Instructions to run it

It'll be ~400 lines of straightforward JavaScript that you can read and understand.

**Or prefer Approach 2?** We can build the GitHub Actions version with better ML-based similarity.

What do you think?
