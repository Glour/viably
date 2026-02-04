# Viably Pricing Model

**Version:** 1.0  
**Last Updated:** February 4, 2026

---

## 💰 Pricing Tiers

### FREE
**Price:** $0/month

**Credits:**
- 5 credits on signup (one-time)
- +5 credits per referral (up to 50 max via referrals)
- 0 monthly recurring credits
- 0 daily bonus

**Features:**
- Max 2 active projects
- Public projects only (visible to all)
- Community support only
- "Powered by Viably" badge required

**Limitations:**
- Cannot deploy private bots
- No custom domains
- No priority support

---

### STARTER
**Price:** $15/month

**Credits:**
- 100 credits on subscription start
- +3 credits every day (90 credits/month additional)
- Total effective: ~190 credits/month
- Rollover up to 200 credits max

**Features:**
- Unlimited projects
- Private projects ✅
- Priority AI queue
- Email support
- Remove "Powered by" badge
- Basic analytics

---

### PRO
**Price:** $39/month

**Credits:**
- 300 credits on subscription start
- +10 credits every day (300 credits/month additional)
- Total effective: ~600 credits/month
- Rollover up to 600 credits max

**Features:**
- Everything in STARTER
- Custom domains for bots
- Advanced integrations
- Priority email support
- API access (future)
- White-label option

---

### BUSINESS
**Price:** $99/month

**Credits:**
- 1000 credits on subscription start
- +20 credits every day (600 credits/month additional)
- Total effective: ~1600 credits/month
- Rollover up to 2000 credits max

**Features:**
- Everything in PRO
- Team collaboration (5 seats included)
- +$10/month per additional seat
- Dedicated support
- SLA guarantee (99.9% uptime)
- Custom AI prompts
- Bulk generation

---

## 🎯 Credit Costs

### Bot Templates

| Template | Complexity | Credits | Avg Build Time |
|----------|-----------|---------|----------------|
| FAQ Bot | Simple | 3 | 30s |
| Notification Bot | Simple | 3 | 30s |
| Poll Bot | Medium | 4 | 45s |
| Shop Bot | Medium | 5 | 60s |
| Support Bot | Complex | 6 | 75s |
| Booking Bot | Complex | 8 | 90s |

### Operations

| Operation | Credits |
|-----------|---------|
| Code modification | 1 |
| Code review | 1 |
| Bug fix | 1 |
| Redeploy | 0 (free) |

---

## 🔄 Credit System Mechanics

### Credit Sources

**One-time:**
- Signup bonus: +5 credits
- Referral bonus: +5 credits per referred user (max 50 from referrals)
- Purchase: Various packages

**Recurring:**
- Monthly allocation (based on plan)
- Daily bonus (based on plan)

**Special:**
- Refunds (if generation fails)
- Admin adjustments

### Credit Usage

**Deducted when:**
- Project generation starts
- Code modification requested
- Code review requested

**NOT deducted:**
- Viewing existing code
- Downloading code
- Redeploying (no changes)
- Browsing templates

### Rollover Rules

Credits roll over month-to-month up to a plan-specific limit:

| Plan | Rollover Limit |
|------|---------------|
| FREE | No rollover (0) |
| STARTER | 200 credits |
| PRO | 600 credits |
| BUSINESS | 2000 credits |

**Example (STARTER):**
```
Month 1:
- Start: 100 credits (monthly allocation)
- Daily bonus: +90 (3/day × 30 days)
- Used: -50
- End: 140 credits

Month 2:
- Rollover: 140 credits (under 200 limit ✅)
- New allocation: +100
- Daily bonus: +90
- Available: 330 credits
```

### Daily Bonus

**Mechanics:**
- Awarded at 00:00 UTC each day
- Must log in to claim (auto-claimed on first visit each day)
- Stacks up to rollover limit
- Never expires while subscription active

---

## 💳 Payment & Billing

### Credit Purchases (one-time)

For users who need extra credits beyond their plan:

| Package | Credits | Price | Price per Credit |
|---------|---------|-------|------------------|
| Small | 50 | $5 | $0.10 |
| Medium | 120 | $10 | $0.083 |
| Large | 300 | $20 | $0.067 |
| XL | 1000 | $50 | $0.05 |

**Notes:**
- Purchased credits never expire
- No rollover limit for purchased credits
- Can buy multiple packages

### Subscription Billing

**Billing Cycle:**
- Monthly (default)
- Annual (20% discount - future)

**Payment Methods:**
- Credit/Debit card (Stripe)
- YooKassa (Russia)
- Crypto (future)

**Refund Policy:**
- No refunds on unused credits
- Pro-rated refund if service issue
- 7-day money-back guarantee (new subscriptions)

---

## 📊 Unit Economics

### Costs per User (Monthly)

**STARTER Plan ($15/month):**

```
Revenue: $15

Costs:
- AI API (avg 60 credits used): ~$6
- Compute/hosting: $2
- Storage (PostgreSQL): $0.50
- Deploy (Railway avg): $1
- Infrastructure overhead: $1.50

Total Cost: $11
Profit: $4 (27% margin)
```

**PRO Plan ($39/month):**

```
Revenue: $39

Costs:
- AI API (avg 200 credits used): ~$20
- Compute: $3
- Storage: $1
- Deploy: $3
- Infrastructure: $2

Total Cost: $29
Profit: $10 (26% margin)
```

### AI API Costs

**Claude Sonnet 4:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Avg generation: 15k input + 5k output = ~$0.10

**Claude Haiku (simple tasks):**
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Avg generation: 10k input + 3k output = ~$0.007

**Our Credit Cost Mapping:**
```
1 credit ≈ $0.10 of AI API cost (Sonnet)
Simple bot (3 credits) = $0.30 AI cost
Complex bot (8 credits) = $0.80 AI cost
```

---

## 🎁 Referral System

### How it Works

**Referrer (you):**
- Share your referral code: `ABC12345`
- Get +5 credits per signup using your code
- Max 50 credits total from referrals (10 referrals)

**Referee (your friend):**
- Uses your code during signup
- Gets standard 5 signup credits
- You both benefit!

### Referral Tracking

**Database:**
```sql
users:
  referral_code: 'ABC12345'  -- Your code
  referred_by: user_id       -- Who referred you

credit_transactions:
  transaction_type: 'referral_bonus'
  related_user_id: referee_user_id
```

---

## 📈 Projections

### Month 1
```
Users: 100
Free: 70 (70%)
Starter: 20 (20%)
Pro: 8 (8%)
Business: 2 (2%)

MRR: (20 × $15) + (8 × $39) + (2 × $99)
   = $300 + $312 + $198
   = $810
```

### Month 3
```
Users: 500
Free: 350 (70%)
Starter: 100 (20%)
Pro: 40 (8%)
Business: 10 (2%)

MRR: (100 × $15) + (40 × $39) + (10 × $99)
   = $1,500 + $1,560 + $990
   = $4,050
```

### Month 6 (Target)
```
Users: 2,000
Free: 1,400 (70%)
Starter: 400 (20%)
Pro: 160 (8%)
Business: 40 (2%)

MRR: (400 × $15) + (160 × $39) + (40 × $99)
   = $6,000 + $6,240 + $3,960
   = $16,200

Costs: ~$12,000
Profit: ~$4,200 (26% margin)
```

---

## 🎯 Conversion Strategy

### Free → Starter

**Triggers:**
- Hit 2 project limit
- Want private projects
- Need more credits
- Want to remove badge

**Tactics:**
- Show upgrade prompt at limits
- Highlight private project benefits
- Offer first month 20% off

### Starter → Pro

**Triggers:**
- Need custom domains
- Want more credits
- Advanced integrations
- API access

**Tactics:**
- Show custom domain feature
- Credit usage analytics
- "Upgrade to Pro" CTAs

### Pro → Business

**Triggers:**
- Team collaboration needs
- High volume (>600 credits/month)
- Need SLA/support

**Tactics:**
- Team invite feature
- Dedicated account manager
- Volume discounts

---

## 💡 Future Pricing Ideas

**Enterprise (Custom):**
- Custom credit allocation
- Dedicated infrastructure
- Custom AI models
- White-label platform
- SSO integration

**Pay-as-you-go:**
- $0.10 per credit
- No subscription
- For occasional users

**Annual Plans:**
- 20% discount
- Lock in price
- Upfront payment

---

**Document Status:** Finalized  
**Next Review:** March 1, 2026
