# GreenGeniusAI — Complete Launch Guide
## From Code to App Store to Paying Subscribers

---

## PHASE 1: ACCOUNTS & LEGAL (Week 1–2)
*Do this before you write a single line of production code.*

### 1.1 Business Formation
- [ ] Form an LLC in your state (LegalZoom or Stripe Atlas — ~$500)
- [ ] Open a business bank account (Mercury.com — free, great for startups)
- [ ] Get an EIN from IRS.gov (free, takes 5 minutes)

### 1.2 Regulatory — THE MOST IMPORTANT STEP
You CANNOT offer automated investment advice without compliance coverage.

**Option A (Recommended — fastest to market):**
- Sign up as a developer with **Alpaca Broker API** (alpaca.markets/broker-api)
- Alpaca is FINRA-registered. Your app uses their licensed infrastructure.
- This covers your trade execution legally. Cost: revenue share model.
- You still need to ensure your AI recommendations include proper disclosures.

**Option B (Full control, longer timeline):**
- Register as an Investment Advisor with your state (if AUM <$100M)
- Hire a securities attorney (~$5,000–$15,000 for setup)
- Apply through IARD/FINRA (finra.org)

**Minimum legal requirements regardless of path:**
- [ ] Add investment disclosures to every page (past performance disclaimer)
- [ ] Privacy Policy (compliant with CCPA/GDPR)
- [ ] Terms of Service written by an attorney
- [ ] Hire a securities attorney for at least a 2-hour consultation (~$500–$800)

---

## PHASE 2: API ACCOUNTS & KEYS (Week 1)

### Sign up for these services in order:

1. **Anthropic** — anthropic.com/api
   - Claude claude-opus-4-7 powers the AI brain
   - Cost: ~$15 per 1M output tokens. Budget ~$200/month to start.
   - Get your API key → paste in `.env`

2. **Polygon.io** — polygon.io
   - Real-time stock and crypto data
   - Start with Starter plan ($29/month) for live data
   - Get your API key → paste in `.env`

3. **Alpaca Markets** — alpaca.markets
   - Paper trading account (FREE) to test everything
   - Generate API keys in dashboard → paste in `.env`
   - Keep `ALPACA_PAPER=true` until you're ready for real money

4. **Stripe** — stripe.com
   - Create account, verify your business
   - Dashboard → Products → Create product:
     - Name: "GreenGeniusAI Genius"
     - Price: $8.99, recurring monthly
     - Add 7-day free trial
   - Copy the Price ID → paste in `.env`
   - Set up webhook endpoint (covered in Phase 4)

5. **Supabase** — supabase.com
   - Create a new project
   - Copy URL + anon key + service key → paste in `.env`
   - Run this SQL to create your users table:
   ```sql
   create table users (
     id uuid primary key default gen_random_uuid(),
     email text unique not null,
     name text,
     risk_profile text default 'moderate',
     bot_active boolean default true,
     stripe_customer_id text,
     alpaca_account_id text,
     subscription_status text default 'trialing',
     created_at timestamptz default now()
   );
   create table trades (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references users(id),
     ticker text,
     action text,
     amount numeric,
     confidence integer,
     reasoning text,
     executed_at timestamptz default now()
   );
   ```

6. **Apple Developer Account** — developer.apple.com
   - $99/year — required to publish to App Store
   - Enrollment takes 24–48 hours for verification

7. **Google Play Console** — play.google.com/console
   - $25 one-time fee
   - Instant setup

---

## PHASE 3: LOCAL DEVELOPMENT (Week 2–3)

### Backend setup (Python)
```bash
cd greengeniusai/backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp ../.env.example .env        # Fill in your API keys
uvicorn main:app --reload --port 8000
```
Visit: http://localhost:8000/docs — you'll see your full API

### Website setup (Next.js)
```bash
cd greengeniusai/website
npm install
cp ../.env.example .env.local  # Fill in your keys
npm run dev
```
Visit: http://localhost:3000 — your full website

### Mobile setup (Expo)
```bash
cd greengeniusai/mobile
npm install
npx expo start
```
Scan QR with Expo Go app on your phone to see it live

---

## PHASE 4: DEPLOYMENT (Week 3–4)

### 4.1 Deploy Backend (Railway — easiest)
1. Go to railway.app → New Project → Deploy from GitHub
2. Connect your repo
3. Set all environment variables in Railway dashboard
4. Railway gives you a URL like `https://greengeniusai-backend.up.railway.app`
5. Update `NEXT_PUBLIC_API_URL` in your website env to this URL

**Alternative: Render.com** (also easy, free tier available)

### 4.2 Deploy Website (Vercel — free)
1. Go to vercel.com → Import from GitHub
2. Set environment variables in Vercel dashboard
3. Deploy → you get `greengeniusai.vercel.app` instantly
4. Connect your custom domain `greengeniusai.com` in Vercel settings

### 4.3 Get your domain
- Buy `greengeniusai.com` on Namecheap or Google Domains (~$12/year)
- Point it to Vercel

### 4.4 Set up Stripe webhooks
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://api.greengeniusai.com/webhooks/stripe`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the Webhook Secret → add to your backend `.env`

### 4.5 Set up SSL & Security
- Vercel handles SSL automatically for the website
- Railway handles SSL for the backend
- Nothing else needed

---

## PHASE 5: MOBILE APP STORE SUBMISSION (Week 4–6)

### 5.1 Build the app
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

cd greengeniusai/mobile

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

### 5.2 iOS App Store Submission
1. **App Store Connect** — appstoreconnect.apple.com
2. Create new app:
   - Bundle ID: `com.greengeniusai.app`
   - Name: "GreenGeniusAI"
   - Primary language: English
3. Fill out app metadata:
   - **Name**: GreenGeniusAI — AI Investor
   - **Subtitle**: The World's Smartest AI Trader
   - **Description** (use this):
     ```
     GreenGeniusAI automatically invests your money into the hottest trending 
     assets and exits before declines — and explains every single decision.
     
     • AI scans 10,000+ assets in real-time
     • Buys trending stocks, ETFs, and crypto automatically
     • Exits positions before losses compound
     • Full trade transparency — know exactly why the AI acted
     • Flip the bot off and use it as your personal market terminal
     • Your risk profile, your rules
     
     Start your 7-day free trial. $8.99/month after.
     ```
   - **Keywords**: AI investing, stock market AI, auto invest, crypto AI, portfolio, trading bot, smart investor
   - **Category**: Finance
   - **Age Rating**: 4+
4. Screenshots: Create 6.7" iPhone screenshots of your app (use simulator)
   - Portfolio screen, Trade feed, AI reasoning popup, Bot toggle, Market scan
5. **Privacy Policy URL**: `https://greengeniusai.com/privacy`
6. Submit for review — typically 24–48 hours

### 5.3 Google Play Submission
1. Google Play Console → Create app
2. Fill all required store listing fields
3. Upload AAB file from EAS build
4. Set up in-app purchases (for subscription billing on Android)
5. Submit for review — typically 3–7 days

### 5.4 In-App Purchases Setup (CRITICAL)
- Apple takes **30%** of subscription revenue for year 1 (drops to 15% after 1 year)
- Google takes **15%** for subscriptions
- At $8.99/month: you keep ~$6.29 (Apple) or $7.64 (Google)
- Solution: Direct web signup at greengeniusai.com avoids these fees entirely
- Promote web signup in your marketing

---

## PHASE 6: TRUST BUILDING — HOW TO GET REAL REVIEWS FAST

### 6.1 The First 20 Reviews Strategy
Getting reviews is the #1 factor for App Store success. Here's the playbook:

**Week 1 (before launch):**
- [ ] Recruit 20 beta testers from friends, family, local investors, Facebook groups
- [ ] Give them free access for 3 months in exchange for honest reviews
- [ ] Run a closed beta via TestFlight (iOS) and Internal Testing (Android)
- [ ] Fix every bug they find. Every single one.

**Week 2–4 (launch week):**
- [ ] Use Expo's in-app review prompt (expo-store-review) — triggers after user's 3rd session
- [ ] Send email to your beta testers asking for App Store reviews
- [ ] Post in r/investing, r/stocks, r/personalfinance on Reddit (be transparent: "I built this")
- [ ] Create TikTok/Instagram content showing the AI making real-time decisions

### 6.2 Trust Signals to Add Immediately
- [ ] Display "Built on Alpaca — FINRA Registered" in your footer and onboarding
- [ ] Add SIPC insurance badge ($500K protection)
- [ ] Show live trade count ("47,392 trades executed")
- [ ] Add a "Backtested Performance" section (run your AI on historical data and show results)
- [ ] Get SSL certificate (automatic with Vercel/Railway)
- [ ] Create a LinkedIn company page for GreenGeniusAI
- [ ] Register on TrustPilot.com — email early users to leave reviews
- [ ] Add a "Press" page (even if it's just 1 article — write a Medium post and link it)

### 6.3 Content Marketing (Organic Growth)
Create content that ranks on Google and goes viral on social:

**YouTube (most powerful):**
- "I let AI manage my investments for 30 days — here's what happened"
- "My AI bought NVDA at $800 — here's its reasoning"
- Weekly portfolio update videos showing real results

**TikTok/Instagram Reels:**
- Screen recording of AI catching a big move before it happens
- "My AI just sold TSLA 2 hours before the drop"
- Side-by-side: "What I would have done" vs "What the AI did"

**Twitter/X:**
- Daily AI trade alerts (screenshot each trade with reasoning)
- Engage in investing communities
- Follow and reply to finance influencers

### 6.4 Partnership Strategy
- **Reach out to finance influencers** with 10k–100k followers
- Offer 30% affiliate commission on subscriptions
- At $8.99/month: they earn ~$2.70/subscriber/month. 100 subscribers = $270/month passive income for them.
- Use Rewardful.com or PartnerStack to manage affiliates

---

## PHASE 7: GROWTH TO $10K MRR

### The Math
- $10,000 MRR ÷ $8.99 = **1,113 active subscribers**
- At 5% daily churn prevention = need to acquire ~60 new subscribers/month net
- Average fintech app cost to acquire: $15–$40 per subscriber
- At $25 CPA: $1,500/month in ads to hit $10K MRR

### Month-by-Month Targets
| Month | Subscribers | MRR     | Action |
|-------|-------------|---------|--------|
| 1     | 50          | $450    | Beta + friends/family |
| 2     | 150         | $1,350  | Reddit launch + content |
| 3     | 300         | $2,700  | Influencer partnerships |
| 4     | 500         | $4,500  | Paid ads start |
| 6     | 1,000       | $8,990  | Scale paid ads |
| 8     | 1,200       | $10,788 | 🎯 $10K MRR |

### Paid Advertising (Start Month 4)
- **Meta Ads**: Target "investing", "stock market", "Robinhood users", "crypto"
  - Video ad: Show AI catching a big market move
  - Hook: "This AI sold TSLA before the crash"
  - CTA: "Try free for 7 days — $8.99/month"
- **Google Ads**: Keywords: "AI stock trader", "automated investing app", "best investing app 2025"
- Budget: Start at $500/month, scale based on CPA

---

## COST BREAKDOWN (Monthly at Launch)

| Service | Cost |
|---------|------|
| Anthropic API (Claude) | ~$150–$300 |
| Polygon.io Starter | $29 |
| Alpaca Broker API | Revenue share |
| Stripe processing (2.9% + $0.30) | ~$50/100 subs |
| Railway (backend hosting) | $20 |
| Vercel (website hosting) | Free |
| Supabase | Free–$25 |
| Apple Developer | $8/mo ($99/yr) |
| **Total fixed costs** | **~$250–$400/mo** |

**Break-even**: ~45–50 subscribers covers all costs.

---

## QUICK START CHECKLIST

### This Week:
- [ ] Read this entire guide
- [ ] Set up all 7 service accounts (Section 2)
- [ ] Consult a securities attorney (most important)
- [ ] Run the backend locally and test the AI
- [ ] Run the website locally and verify it looks right

### Next 2 Weeks:
- [ ] Get Alpaca Broker API approval
- [ ] Deploy backend to Railway
- [ ] Deploy website to Vercel
- [ ] Set up Stripe products and webhooks
- [ ] Recruit 20 beta testers

### Month 1:
- [ ] Submit mobile apps to App Store and Play Store
- [ ] Get first 10 reviews
- [ ] Start content creation
- [ ] First paying subscribers

---

*GreenGeniusAI — Built by Jaden Green. The niche: transparent AI investing with full reasoning. Every trade explained. No other app does this at this price point.*
