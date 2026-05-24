---
title: Reddit Launch Posts
platform: Reddit
contentType: Community Launch
publishedAt: 2026-02-08
author: Viably Team
tone: Casual, authentic
tags: [launch, reddit, feedback, community]
---

# Reddit Launch Posts

## Post 1: r/SideProject

### Title
I built an AI tool that generates production-ready Telegram bots from natural language (no coding required)

### Post Body

Hey r/SideProject,

After 3 months of nights and weekends, I finally launched my side project today and wanted to share it here.

**What it does:**

Viably turns ideas into working Telegram bots using AI. You describe what you want in plain language, and it generates complete Python code, sets up the infrastructure, and deploys everything.

**Why I built it:**

I kept seeing the same pattern: friends and small business owners needed simple automation (event registration, feedback forms, notification systems) but the options were either:
- No-code tools that couldn't handle their specific needs
- Hiring a developer for $3k+ and waiting weeks

There had to be something in between.

**How it works:**

1. Pick a template (event bot, quiz bot, survey bot, etc.)
2. Describe your customizations in natural language
3. AI generates the complete code (Python + aiogram)
4. Deploy in one click to our cloud
5. Your bot is live in ~60 seconds

**Tech stack:**
- Backend: FastAPI + PostgreSQL
- Frontend: Next.js + shadcn/ui
- AI: Claude Sonnet 4
- Deploy: Docker on our servers (one-click deploy)

**Current features:**
- 6 bot templates
- Natural language customization
- One-click deploy
- Credit-based pricing (not token-based, so no surprise bills)
- Download source code if you want to modify it yourself

**What's NOT done yet:**
- Only Telegram bots (no WhatsApp/Slack yet)
- Limited to Python/aiogram (no Node.js option)
- Russian-first UI (English translation in progress)

**Honest challenges I'm facing:**

1. **Quality control** - The AI generates good code 80% of the time, but that 20% is tricky. I'm constantly improving the prompts and validation.

2. **Pricing** - Still figuring out the right balance. Currently 1 credit = 1 bot generation, but complex bots cost me more in API calls. Might need to tier this.

3. **Marketing** - I'm a developer, not a marketer. Getting the word out is harder than building the product.

**Why I'm posting here:**

I'd genuinely love feedback from this community:
- What would make this more useful for you?
- What's missing that would be a dealbreaker?
- Is the pricing reasonable? (FREE: 5 credits, STARTER: $15/mo for 100 credits)
- Would you actually use this, or is it solving a problem that doesn't exist?

**Try it here:** https://viably.dev

FREE tier includes 5 credits (5 bot generations) + 5 more per referral. No credit card required.

**Screenshots:**
- [Template gallery - shows 6 bot types]
- [Generation flow - shows AI creating code]
- [Deploy screen - shows one-click deploy]

I'll be around all day to answer questions, take suggestions, and honestly just hear if this is something people would actually use.

Thanks for checking it out. This community has inspired so many of my projects, so any feedback means a lot.

---

**Edit 1:** Wow, thanks for all the feedback! Top requests so far:
1. WhatsApp integration (noted!)
2. Payment processing bots (coming in Q2)
3. More detailed pricing calculator (working on it)

**Edit 2:** For those asking about data privacy - all generated code is yours. We don't store it after deployment unless you choose to keep it in your Viably project. Full privacy policy: https://viably.dev/privacy

---

### Comment Response Templates

**When someone asks "Why not just use Zapier/Make?":**
```
Great question! The main difference is depth of functionality.

Zapier is perfect for simple triggers and actions, but when you need:
- Custom validation logic
- Complex database queries
- Multi-step user flows with branching
- File processing
- Stateful conversations

...you hit the limits pretty fast.

Viably generates actual code, so there's no ceiling on complexity. You can also download and modify it if you outgrow the platform.
```

**When someone shares a bot idea:**
```
Love this! [Specific template] would be a great starting point.

DM me your email and I'll send you 10 bonus credits to try building it. Would be curious to hear how it goes.
```

**When someone asks about open source:**
```
Not planning to open source the generation engine (that's the core IP), but I'm considering open-sourcing the bot templates themselves.

Would that be valuable to you?
```

**When someone critiques the pricing:**
```
Appreciate the honest feedback.

The challenge is balancing API costs (Claude Sonnet 4 isn't cheap) with staying affordable for solo devs and small businesses.

What price point would feel fair to you for [specific use case]?
```

---

## Post 2: r/Entrepreneur

### Title
Launched a tool to automate business operations via Telegram bots - would love feedback from fellow entrepreneurs

### Post Body

Hey r/Entrepreneur,

I'm a developer who's been freelancing in the automation space for 3 years. After building similar bots for clients dozens of times, I decided to productize the process.

**The result: Viably** - an AI platform that builds custom Telegram bots based on natural language descriptions.

**Why Telegram bots for business?**

I know what you're thinking: "Why not WhatsApp or a web app?"

Here's what I've learned from clients:

1. **Speed to market** - No app store approval, no lengthy dev cycles. Live in minutes.

2. **Universal access** - Desktop + mobile with one codebase. Your team is already on messaging apps.

3. **Low friction** - No downloads, no new logins. Just start a conversation.

4. **Rich features** - Buttons, forms, payments, file sharing all built in.

**Real business use cases I've seen:**

**Event companies:**
- Registration bots that handle 1000+ attendees
- Automated reminder sequences
- Real-time capacity tracking
- Post-event surveys

**Customer support:**
- First-line support bot that handles 60% of common questions
- Ticket creation and routing
- Status updates
- Escalation to humans when needed

**Internal operations:**
- Employee feedback collection (weekly pulse surveys)
- Shift swap requests
- Expense report submission
- Equipment/room reservations

**One client saved $2,400/month** by replacing a customer support VA with a bot for tier-1 inquiries. The VA now focuses on complex issues only.

**How Viably works:**

Instead of hiring a developer or learning to code:

1. Choose a template (or start from scratch)
2. Describe what you need: "I want a bot that collects RSVPs for my weekly webinar, sends reminder emails 1 day before, and exports attendee data to a Google Sheet"
3. AI generates the code
4. Deploy in one click
5. Bot is live

**Pricing model:**

I deliberately avoided token-based pricing (been burned by surprise OpenAI bills).

Instead: **1 credit = 1 bot generation** (flat rate, regardless of complexity)

- FREE: 5 credits to test
- STARTER: $15/mo for 100 credits
- PRO: $39/mo for 300 credits
- BUSINESS: $99/mo for 1,000 credits

**What I'm struggling with:**

1. **Trust** - "Will this AI actually generate working code?" (Fair question. That's why there's a free tier.)

2. **Positioning** - Is this a dev tool or a business tool? I'm targeting non-technical entrepreneurs, but developers are also interested.

3. **Expansion** - Should I focus on nailing Telegram bots first, or add WhatsApp/Slack ASAP?

**Questions for this community:**

1. Would you use this for your business? If not, what's the blocker?
2. What automation are you currently doing manually that this could handle?
3. Is $15/mo reasonable for 100 bot generations?
4. What integration would make this a no-brainer for you? (Shopify? Stripe? HubSpot?)

**Try it:** https://viably.dev (no credit card required for free tier)

I'm here all day to answer questions, take feedback, and learn what would make this actually useful vs. just a cool demo.

Thanks for reading. Appreciate any insights from people who've been in the trenches building businesses.

---

**Edit:** For those asking about ROI - if you save 5 hours/week of manual work at $50/hr (conservative), that's $1,000/month. Even the PRO plan at $39/mo pays for itself if it saves you ~2 hours/week.

---

### Comment Response Templates

**When someone asks about ROI:**
```
Great question. Here's how I think about it:

If the bot saves you 1 hour/week of manual work, that's ~50 hours/year.

At even $30/hr, that's $1,500/year in value from a one-time 1-credit generation.

The STARTER plan ($15/mo) pays for itself if you save ~30 minutes/week.

Obviously depends on your use case, but that's the math I've seen with clients.
```

**When someone shares their business:**
```
[Specific business type] is perfect for this!

I've seen similar businesses automate [specific process] with a simple bot that handles [outcome].

Happy to hop on a quick call to brainstorm what would work for your setup. DM me if interested.
```

**When someone asks about reliability:**
```
100% uptime is never realistic, but here's what I've built in:

- Auto-recovery if the bot crashes
- Health check monitoring
- Rollback to previous version if deploy fails
- Status page so you know if there's an issue

All generated bots are hosted on our dedicated servers with 99.9% uptime.
```

**When someone mentions a competitor:**
```
Good point about [competitor]. Main differences:

1. Viably generates actual code (not form builders)
2. Focus on production-ready quality, not prototypes
3. Credit-based pricing (not token-based)
4. You own the code and can download it

But honestly, if [competitor] works for you, stick with it! Different tools for different needs.
```

---

## Post 3: r/TelegramBots

### Title
Built an AI platform that generates production-ready Telegram bots - feedback from bot developers wanted

### Post Body

Hey r/TelegramBots,

I'm a Python dev who's been building Telegram bots with aiogram for ~4 years. Decided to build a tool that automates the whole process using AI.

**What it does:**

You describe a bot in natural language → AI generates Python/aiogram code → Deploy in one click → Bot is live.

**Tech details:**

- **Generation:** Claude Sonnet 4 with custom prompts
- **Framework:** aiogram 3.x (generated code)
- **Database:** PostgreSQL via SQLAlchemy
- **Deploy:** Docker containers on dedicated servers
- **Monitoring:** Built-in health checks and error logging

**Code quality:**

The AI generates:
- Proper handler organization (routers, filters, middlewares)
- Async/await patterns
- Database migrations (Alembic)
- Environment config
- Error handling
- Basic tests
- README with setup instructions

**Templates included:**

1. Event registration bot (FSM for multi-step registration)
2. Quiz bot (with scoring and results)
3. Feedback collection (with export to CSV)
4. Product catalog (inline keyboard navigation)
5. Survey bot (branching logic)
6. Notification bot (scheduled messages)

**What I'm looking for:**

Feedback from people who actually build bots:

1. **Code quality** - Is the generated code something you'd deploy? Or is it "AI slop" that needs heavy refactoring?
2. **Templates** - Are these useful starting points, or too basic?
3. **Customization** - Natural language prompts vs. traditional form inputs - which would you prefer?
4. **Pricing** - For people who build bots for clients, does this speed up your workflow enough to pay for?

**Try it:** https://viably.dev

Free tier includes 5 generations. You can inspect all the generated code before deploying.

**Not trying to replace developers** - More like providing scaffolding so you can focus on business logic instead of boilerplate.

Curious what this community thinks.

---

### Comment Response Templates

**When someone shares generated code issues:**
```
Thanks for testing and reporting this!

Can you share more about what went wrong? I want to fix the generation prompts.

DM me and I'll:
1. Give you credits back
2. Manually review what the AI generated
3. Update the prompts to prevent this

This is exactly the feedback I need to improve it.
```

**When someone asks about advanced features:**
```
Good question. Currently the templates cover basic patterns, but you can customize via prompts.

For [advanced feature], you'd describe it like: "[example prompt]"

The AI usually handles it, but for very complex stuff, you might need to download and modify the code yourself.

Are you building something specific that needs [advanced feature]? Happy to test if it works.
```

**When someone asks about aiogram version:**
```
Currently generates aiogram 3.x code (3.4.1 specifically).

Planning to support aiogram 2.x for legacy projects in the next update.

Which version do you need?
```

---

## Posting Strategy

### Timing
- **Best days:** Tuesday, Wednesday, Thursday
- **Best time:** 9-11 AM EST, 6-8 PM EST
- **Avoid:** Weekends (lower engagement in these subs)

### Subreddit Rules Check
Before posting, verify:
- r/SideProject: Self-promotion allowed with [Show & Tell] flair
- r/Entrepreneur: Avoid pure promotion, lead with value/story
- r/TelegramBots: Technical content encouraged, promotional allowed if relevant

### Engagement Plan
- **First 2 hours:** Respond to every comment
- **Next 6 hours:** Check every hour, respond within 30 min
- **Next 48 hours:** Daily check-ins

### Cross-Posting Rules
- Wait 24 hours between posts to different subs
- Don't post identical content (customize for each community)
- Never mention you're posting in other subs

---

## Follow-Up Posts (Week 2)

### r/SideProject - Lessons Learned
**Title:** "Week 1 of my AI bot builder launch: brutal lessons learned"

**Body:**
- What worked vs. what flopped
- Unexpected user behaviors
- Technical issues that came up
- Revenue/signup numbers (if willing to share)
- What I'm changing for week 2

### r/Entrepreneur - Case Study
**Title:** "Case study: How one business automated 15 hours/week using a Telegram bot"

**Body:**
- Specific business problem
- Solution built with Viably
- Step-by-step breakdown
- Results and ROI
- Lessons applicable to other businesses

---

## Red Flags to Avoid

**Don't:**
- Ask for upvotes (against Reddit rules)
- Post the same content in multiple subs at once
- Only respond to positive comments
- Get defensive about criticism
- Use marketing language ("revolutionary", "game-changing")
- Ignore questions about pricing/tech stack
- Promise features that don't exist yet

**Do:**
- Be honest about limitations
- Acknowledge competitors respectfully
- Engage with critical feedback professionally
- Offer bonus credits to people who test and report issues
- Update post with edits as questions come in
- Thank people for their time and feedback

---

## Success Metrics

**Track:**
- Upvotes (aim for 100+ in r/SideProject)
- Comments (aim for 50+ quality discussions)
- Direct traffic from Reddit (use UTM: ?utm_source=reddit&utm_campaign=launch)
- Signups from Reddit traffic
- Conversion rate from Reddit visitors

**Benchmarks:**
- 200+ upvotes = strong product-market fit signal
- 100+ comments = high engagement
- 10%+ upvote ratio = community approval
- 50+ signups from Reddit = successful launch

**Engagement quality matters more than quantity** - 10 meaningful conversations > 100 "cool!" comments.

---

*Reddit Strategy: Be authentic, humble, and genuinely interested in feedback. This is a community, not an ad platform.*
