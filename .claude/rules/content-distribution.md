# Content Distribution Rules

Rules for generating social media posts from Tree Identity content.
Used by Claude Code, Gemini Flash, or any model in the distribution pipeline.

## Brand Voice

- Tone: thoughtful, concise, authentic — like a developer sharing what they learned
- No corporate speak, no hype words ("revolutionary", "game-changing", "unleash")
- No emojis unless the original article uses them
- Write as first person ("I built...", "I learned...", "Here's what I found...")
- Prefer short sentences. Cut filler words.
- Vietnamese articles → Vietnamese social posts. English → English.

## Platform Formats

### Twitter/X Thread
- First tweet: hook + key insight (max 260 chars to leave room for link)
- Thread: 2-4 tweets max, each adds a distinct point
- Last tweet: link to article + one-line CTA
- No hashtags unless highly relevant (max 2)
- Format: plain text, no markdown

### LinkedIn Post
- Max 1500 chars (short-form performs better)
- Opening line: bold statement or question (hook)
- Body: 3-5 short paragraphs, single key takeaway each
- End with article link
- No hashtag spam (max 3 relevant ones)

### Dev.to Article
- Repost full article with canonical_url pointing to original
- Add front matter: `title`, `published: true`, `tags` (max 4), `canonical_url`
- Keep all code blocks and formatting intact
- Add "Originally published at [treetwin.io](link)" at the bottom
- Tags: use popular Dev.to tags (webdev, javascript, tutorial, beginners, etc.)

### Hashnode Post
- Repost full article with canonical URL
- Add front matter: `title`, `slug`, `canonical`
- Keep markdown formatting, code blocks intact
- Select relevant tags (max 5)

### Reddit Post
- Target subreddits: r/webdev, r/programming, r/javascript, r/reactjs (match content topic)
- Title: direct, no clickbait, state what the post is about
- Body: 2-3 sentence intro + link. Reddit hates self-promotion — lead with value
- Only post if genuinely useful to the subreddit. Skip if too niche or promotional
- Format: plain text, no markdown headers

### Facebook Post
- Max 500 chars for feed post (longer gets truncated behind "See more")
- Hook in first 2 lines (visible before fold)
- Casual tone, slightly more personal than LinkedIn
- Tag relevant Facebook groups if applicable (webdev, JS, etc.)
- Link at the end, not inline
- No hashtags (Facebook algorithm doesn't reward them)

### Medium Article
- Repost full article with canonical URL (Import Story feature)
- Submit to relevant publications: Better Programming, JavaScript in Plain English, The Startup
- Tags: max 5, use high-traffic tags (programming, javascript, web-development, software-engineering)
- Add subtitle (1 sentence hook)

### Hacker News
- Title: factual, no hype — HN penalizes clickbait
- Format: "Show HN: ..." for projects, plain title for articles
- NO body text — just the link. HN is link-only for submissions
- Only submit genuinely novel/insightful content. HN audience is senior devs
- Best time: US morning (EST 8-10am)

### Threads Post
- Max 500 chars per post
- Conversational, casual — like Twitter but less formal
- Can do multi-post threads for longer content
- No hashtags (algorithm doesn't use them yet)
- Visual-first platform — mention if article has diagrams/screenshots

### Viblo (Vietnamese tech community)
- Only for Vietnamese articles
- Repost full article with canonical URL
- Tags: max 5, use popular Viblo tags (javascript, web, nodejs, etc.)
- Series support — group related articles

## Content Extraction Rules
- Read the full article/note markdown
- Identify: main thesis, 2-3 supporting points, conclusion
- Do NOT summarize everything — pick the most interesting angle
- If article has code: mention the tech but don't paste code in social posts
- If article is a note (short-form): one tweet + LinkedIn short post is enough

## UTM Parameters
- Always append UTM to article links in social posts
- Format: `?utm_source={platform}&utm_medium=social&utm_campaign=distribute`
- Platforms: `twitter`, `linkedin`, `devto`, `hashnode`, `reddit`, `facebook`, `medium`, `hackernews`, `threads`, `viblo`

## Output Format & Content Templates

Generate each platform section using these templates. Example article: "Building a Content Engine with Astro and Keystatic" at `https://treetwin.io/articles/building-content-engine`.

```
=== TWITTER THREAD ===

[1/3] I rebuilt my blog from Next.js + Postgres to Astro + Keystatic.

Zero database. Zero CMS hosting. Just markdown files in git.

Here's what I learned:

[2/3] The key insight: you don't need a database for a personal site.

Keystatic reads/writes markdown directly. Git is your database. Vercel deploys on push.

Total infrastructure cost: $0/month.

[3/3] Full write-up with code examples:

https://treetwin.io/articles/building-content-engine?utm_source=twitter&utm_medium=social&utm_campaign=distribute

=== LINKEDIN ===

I just mass-deleted my entire backend.

No more PostgreSQL. No more CMS server. No more $20/month hosting bill.

I rebuilt my personal site with Astro + Keystatic — a static site generator that treats markdown files as your CMS. Content lives in git. Deploy on push.

The result: a site that's faster, cheaper, and easier to maintain than anything I've built before.

If you're running a personal blog on a full-stack framework, you might be overengineering it.

https://treetwin.io/articles/building-content-engine?utm_source=linkedin&utm_medium=social&utm_campaign=distribute

#webdev #astro #staticsite

=== DEV.TO ===

---
title: Building a Content Engine with Astro and Keystatic
published: true
tags: webdev, astro, javascript, tutorial
canonical_url: https://treetwin.io/articles/building-content-engine
---

[Full article content here — keep all markdown, code blocks, images intact]

---

*Originally published at [treetwin.io](https://treetwin.io/articles/building-content-engine?utm_source=devto&utm_medium=social&utm_campaign=distribute)*

=== HASHNODE ===

---
title: Building a Content Engine with Astro and Keystatic
slug: building-content-engine-astro-keystatic
canonical: https://treetwin.io/articles/building-content-engine
tags: webdev, astro, javascript, static-site, tutorial
---

[Full article content here — keep all markdown, code blocks, images intact]

---

*Originally published at [treetwin.io](https://treetwin.io/articles/building-content-engine?utm_source=hashnode&utm_medium=social&utm_campaign=distribute)*

=== REDDIT ===

Subreddit: r/webdev
Title: I replaced my Next.js + PostgreSQL blog with Astro + Keystatic — zero database, zero CMS cost

I was paying $20/month to host a PostgreSQL database for a personal blog. Felt ridiculous.

Switched to Astro + Keystatic: content lives as markdown in git, Keystatic gives you a local CMS UI, Vercel deploys on push. Total cost: $0.

Wrote up the full migration process with code: https://treetwin.io/articles/building-content-engine?utm_source=reddit&utm_medium=social&utm_campaign=distribute

=== FACEBOOK ===

Vừa xoá sạch backend cho blog cá nhân.

Không database, không CMS server, không hosting phí. Chuyển sang Astro + Keystatic — content là markdown files trong git, deploy tự động qua Vercel.

Nhanh hơn, rẻ hơn, dễ maintain hơn mọi stack trước đó.

https://treetwin.io/articles/building-content-engine?utm_source=facebook&utm_medium=social&utm_campaign=distribute

=== MEDIUM ===

Title: Building a Content Engine with Astro and Keystatic
Subtitle: How I eliminated my database and cut hosting costs to $0

[Full article content here — keep all formatting, code blocks intact]

---

*Originally published at [treetwin.io](https://treetwin.io/articles/building-content-engine?utm_source=medium&utm_medium=social&utm_campaign=distribute)*

Tags: Programming, JavaScript, Web Development, Static Site, Tutorial

=== HACKER NEWS ===

Title: Building a content engine with Astro and Keystatic – zero database, git-based CMS
URL: https://treetwin.io/articles/building-content-engine?utm_source=hackernews&utm_medium=social&utm_campaign=distribute

=== THREADS ===

I mass-deleted my entire backend for a personal blog.

Switched from Next.js + PostgreSQL to Astro + Keystatic. Content = markdown in git. No database. No CMS hosting.

Cost went from $20/month to $0. Speed doubled.

Sometimes the best architecture is the simplest one.

https://treetwin.io/articles/building-content-engine?utm_source=threads&utm_medium=social&utm_campaign=distribute

=== VIBLO === (Vietnamese content only)

---
title: Xây dựng Content Engine với Astro và Keystatic
tags: javascript, web, astro, tutorial, devops
canonical_url: https://treetwin.io/articles/building-content-engine
---

[Toàn bộ nội dung bài viết tiếng Việt — giữ nguyên markdown, code blocks]

---

*Bài gốc tại [treetwin.io](https://treetwin.io/articles/building-content-engine?utm_source=viblo&utm_medium=social&utm_campaign=distribute)*
```

## Quality Checklist
Before outputting, verify:
- [ ] Character limits respected
- [ ] Link included with correct UTM
- [ ] Matches original article language (EN/VI)
- [ ] No hallucinated claims not in the article
- [ ] Tone matches brand voice above

## Distribution Tool: Postiz

**Postiz** — open-source social media scheduler for publishing generated posts.
- Self-host (Docker) or SaaS: https://postiz.com
- GitHub: https://github.com/gitroomhq/postiz-app
- 13+ platforms: X, LinkedIn, Instagram, YouTube, TikTok, Facebook, Discord, Pinterest, Threads, Reddit, Dribbble, Mastodon, Bluesky
- API + NodeJS SDK for automation (N8N, Make, Zapier)
- OAuth-based, no scraping

### Pipeline
```
Tree-ID article
  → Claude Code generates social posts (this file's rules)
  → Postiz API schedules & publishes to platforms
```

### Setup (separate project)
1. Self-host via Docker or use Postiz cloud
2. Connect social accounts via OAuth
3. Use API/SDK to push generated posts from Claude Code session
- Status: Backlog (Phases 2-3 of Content Distribution workflow)
