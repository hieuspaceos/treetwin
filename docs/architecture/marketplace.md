# Marketplace Architecture

Digital commerce layer enabling product sales, licensing, and user authentication.

## Overview

Tree Identity evolves from a static content engine to a **hybrid static+SSR platform** supporting:
- Product catalog with AI-powered search
- User authentication (Google OAuth)
- Order management + license delivery
- Checkout flow skeleton (ready for Stripe integration)

**Key Constraint:** Marketplace requires SSR for auth context + database queries, while landing pages remain fully static.

## Database Schema

### Supabase PostgreSQL (Primary)

Six core tables for marketplace operations:

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Synced from Supabase Auth on user signup
- Extensible for future profile fields (bio, company, etc.)

#### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  product_config JSONB, -- metadata, features, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- Git-tracked via Keystatic (yaml → SQL sync)
- Supports versioning + metadata

#### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- Status enum: pending → completed (on payment) → failed (if payment rejected)

#### order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Supports bulk orders (multiple items per order, future feature)

#### licenses
```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  key TEXT UNIQUE NOT NULL, -- generated via nanoid
  activated_at TIMESTAMP,
  expires_at TIMESTAMP, -- optional, for time-limited licenses
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Auto-generated on order confirmation
- Activation status tracked for deployment verification

#### payment_events
```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- checkout_created, confirm_received, stripe_webhook, etc.
  payload JSONB, -- event-specific data (e.g., Stripe webhook body)
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Audit log for payment flow debugging
- Future: webhook events from Stripe

### Row-Level Security (RLS) Policies

```sql
-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Orders: users can read own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Licenses: users can read own licenses
CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT USING (auth.uid() = user_id);
```

### SQLite Fallback (Local Development)

When `USE_SQLITE_FALLBACK=true`, all tables mapped to SQLite via better-sqlite3:
- Same schema, different dialect
- Auto-initialized on server start
- In-memory or file-based (`.db/dev.sqlite`)
- Zero Supabase credentials needed

**Benefits:** Offline development, faster iteration, no API key management

## Authentication Flow

### Google OAuth via Supabase Auth

```
1. User clicks "Sign in with Google" on /marketplace
2. Redirects to Supabase Auth provider
3. User authorizes at Google consent screen
4. Redirects back to /api/auth/callback?code=...&state=...
5. Handler exchanges code for JWT + session cookie
6. Redirects to /dashboard or previous page
```

### Session Management

- **JWT Token:** Signed by Supabase, contains `sub` (user ID) + metadata
- **Session Cookie:** Set on `/api/auth/callback`, httpOnly + secure flags
- **Middleware:** Server-side validation for protected routes

**Protected Routes:**
- `/checkout/[slug]` — requires auth
- `/dashboard` — requires auth
- API endpoints: `/api/checkout/*`, `/api/dashboard/*`

## Marketplace Pages

### `/marketplace`
**Purpose:** Product discovery with AI-powered search

**Components:**
- Product grid (title, price, cover image)
- Search bar → POST `/api/marketplace/search`
- Filter sidebar (category, price range, etc.)

**Data Flow:**
```
User types query → AI intent search (Gemini) → Confidence score + explanation
                 ↓
              Products ranked by relevance
                 ↓
              Display in grid with "View Details" CTA
```

**AI Intent Search:**
- **Endpoint:** `POST /api/marketplace/search`
- **Request:** `{ query: "I need email software", limit: 5 }`
- **Gemini Prompt:** "Analyze user intent and return matching product slugs"
- **Response:**
  ```json
  {
    "products": ["mailchimp-alternative", "newsletter-tool"],
    "confidence": 0.92,
    "explanation": "User seeking email marketing solution"
  }
  ```

### `/marketplace/[slug]`
**Purpose:** Product details + CTA to checkout

**Components:**
- Hero: product image, title, price, description
- Features list
- Reviews (future: from `orders` + user feedback)
- CTA button: "Buy Now" → `/checkout/[slug]`

**Data Source:** `GET /api/marketplace/[slug]`

### `/checkout/[slug]`
**Purpose:** Order creation + payment confirmation (skeleton)

**Components:**
- Product summary (title, price)
- User info auto-fill (from auth session)
- Payment form (skeleton: "Enter card details")
- Submit → `POST /api/checkout/create` → `POST /api/checkout/confirm`

**Flow:**
```
1. User clicks "Buy Now"
2. Requires auth (redirects to Google OAuth if not signed in)
3. `/checkout/[slug]` displays form
4. POST /api/checkout/create
   ↓
   Creates draft order in DB
   ↓
   Returns orderId + confirmation page
5. POST /api/checkout/confirm
   ↓
   Local dev: auto-succeeds, generates license key
   Stripe (future): validates payment, generates license key
   ↓
   Returns license key + download URL (future)
6. Redirect to /dashboard/orders/[orderId]
```

**Status:** Skeleton with local simulation. Production payment logic deferred to Stripe integration phase.

### `/dashboard`
**Purpose:** User's purchases + license keys

**Components:**
- Purchases table: order ID, product, date, price, status
- Licenses table: key (masked), product, activation status, download button
- Support CTA

**Data Sources:**
- `GET /api/dashboard/purchases`
- `GET /api/dashboard/licenses`

## API Routes

### Marketplace Endpoints

#### `GET /api/marketplace/products`
List all products with filtering.

**Query Params:**
- `category`: string (future: filter by category)
- `maxPrice`: number
- `sortBy`: 'price-asc' | 'price-desc' | 'newest'

**Response:**
```json
{
  "products": [
    { "id": "...", "slug": "email-tool", "title": "...", "price": 49.99 }
  ],
  "total": 10
}
```

#### `POST /api/marketplace/search`
AI intent search via Gemini 2.5-flash.

**Request:**
```json
{
  "query": "I need a tool to send newsletters",
  "limit": 5
}
```

**Response:**
```json
{
  "products": [...],
  "confidence": 0.88,
  "explanation": "User seeking newsletter/email marketing solution"
}
```

**Fallback:** If Gemini fails, falls back to keyword search.

#### `GET /api/marketplace/[slug]`
Product details page data.

**Response:**
```json
{
  "id": "...",
  "slug": "email-tool",
  "title": "Email Tool Pro",
  "price": 49.99,
  "description": "...",
  "features": ["bulk send", "templates", "analytics"],
  "reviews": [...] // future
}
```

### Checkout Endpoints

#### `POST /api/checkout/create`
Create order session.

**Auth:** Required (JWT from session cookie)

**Request:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "orderId": "uuid",
  "status": "pending",
  "totalAmount": 49.99
}
```

#### `POST /api/checkout/confirm`
Confirm payment + generate license.

**Auth:** Required

**Request:**
```json
{
  "orderId": "uuid",
  "paymentToken": "stripe-token" // future
}
```

**Response (Local Dev):**
```json
{
  "confirmed": true,
  "licenseKey": "TREE-ID-ABCD1234...",
  "downloadUrl": "/downloads/email-tool-setup.exe" // future
}
```

**Local Dev Behavior:** Automatically succeeds without payment validation.

### Dashboard Endpoints

#### `GET /api/dashboard/purchases`
User's order history.

**Auth:** Required

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "productSlug": "email-tool",
      "productTitle": "Email Tool Pro",
      "totalAmount": 49.99,
      "status": "completed",
      "createdAt": "2026-03-28T..."
    }
  ]
}
```

#### `GET /api/dashboard/licenses`
User's active license keys.

**Auth:** Required

**Response:**
```json
{
  "licenses": [
    {
      "id": "uuid",
      "key": "TREE-ID-ABCD1234...",
      "productSlug": "email-tool",
      "productTitle": "Email Tool Pro",
      "activatedAt": null,
      "expiresAt": null,
      "status": "active"
    }
  ]
}
```

### Auth Endpoints

#### `GET /api/auth/callback`
Google OAuth callback handler.

**Query Params:** `code`, `state` (from Google)

**Behavior:**
1. Exchange code for JWT via Supabase Auth
2. Set session cookie (httpOnly, Secure, SameSite=Strict)
3. Redirect to `/dashboard` or referrer

#### `POST /api/auth/logout`
Clear session.

**Behavior:**
1. Clear session cookie
2. Clear JWT from client storage
3. Redirect to `/`

## Service Layer

### `src/lib/marketplace/product-service.ts`
Product queries + filtering.

```typescript
export async function getProducts(
  filter?: { category?: string; maxPrice?: number }
): Promise<Product[]>

export async function getProductBySlug(slug: string): Promise<Product>

export async function searchProducts(query: string): Promise<Product[]>
```

### `src/lib/marketplace/order-service.ts`
Order creation + management.

```typescript
export async function createOrder(
  userId: string,
  productId: string,
  quantity: number
): Promise<Order>

export async function getUserOrders(userId: string): Promise<Order[]>

export async function updateOrderStatus(
  orderId: string,
  status: 'completed' | 'failed'
): Promise<Order>
```

### `src/lib/marketplace/license-service.ts`
License key generation + validation.

```typescript
export async function generateLicenseKey(
  orderId: string,
  productId: string,
  userId: string
): Promise<License>

export async function getUserLicenses(userId: string): Promise<License[]>

export async function validateLicenseKey(key: string): Promise<License | null>

export async function activateLicense(
  key: string,
  deviceId: string
): Promise<{ activated: true; expiresAt: Date | null }>
```

### `src/lib/marketplace/ai-intent-search.ts`
Gemini-powered product matching.

```typescript
export async function searchByIntent(
  query: string,
  limit: number = 5
): Promise<{ products: Product[]; confidence: number; explanation: string }>
```

**Gemini Prompt:**
```
Analyze the user's query and identify product intent.
Return matching product slugs from this catalog: [products list]
Confidence: 0.0-1.0
```

## Hybrid SSR Architecture

### Before (v2.7.0)
```
Astro output: 'static'
All pages pre-rendered at build time
No runtime server needed (except Vercel cold-start)
```

### After (v3.0.0)
```
Astro output: 'server'
Static routes (content, landing, public pages) → prerendered
Dynamic routes (auth, checkout, dashboard, marketplace) → rendered on-demand
```

**Trade-offs:**
- **Pro:** Can use server context for auth + DB queries
- **Pro:** Reduced build time (no pre-rendering 1000+ landing pages)
- **Con:** Vercel cold-start latency for first request (but cached)

**Optimization:**
- Leverage Astro's `prerender: true` on content pages for max performance
- Only `/marketplace`, `/checkout`, `/dashboard` rendered on-demand

## Security Considerations

### Authentication
- **Google OAuth:** Redirects to Supabase Auth (verified provider)
- **JWT Verification:** Server validates token signature on each request
- **Session Cookie:** httpOnly, Secure flags prevent XSS/CSRF

### Database Access
- **RLS Policies:** Users can only read own orders/licenses
- **Service Role Key:** Stored server-side only (not sent to client)
- **Anon Key:** Used for client-side queries (public product list)

### Payment (Future)
- **PCI Compliance:** Use Stripe for card handling (not stored locally)
- **Webhook Verification:** HMAC signature validation on payment events
- **Idempotency:** Payment tokens prevent duplicate charges

### API Security
- **CORS:** Restrict to origin domain
- **Rate Limiting:** 100 req/min per IP (Vercel middleware)
- **Input Validation:** Zod schemas on all endpoints

## Development Workflow

### Local Development (SQLite Fallback)
```bash
# Install dependencies
npm install @supabase/supabase-js better-sqlite3

# Set environment
export USE_SQLITE_FALLBACK=true

# Start dev server
npm run dev
# SQLite auto-initializes; all marketplace features work offline
```

### Production (Supabase)
```bash
# Set environment
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export GOOGLE_OAUTH_CLIENT_ID=...
export GOOGLE_OAUTH_CLIENT_SECRET=...

# Deploy
npm run build && npm run start
# Astro renders SSR routes on-demand against Supabase
```

## Future Enhancements

### Phase 3.1 (Stripe Integration)
- Replace `/api/checkout/confirm` skeleton with Stripe webhook handling
- Email confirmations + invoice generation
- Refund management

### Phase 3.2 (Advanced Marketplace)
- User reviews + ratings
- Shopping cart system (bulk orders)
- Discount codes + promotions
- Affiliate tracking

### Phase 3.3 (License Management)
- Activation device tracking
- License key renewal system
- Usage analytics per license
- Admin revocation

---

**Last updated:** 2026-03-28
**Version:** v3.0.0 (In Progress)
**Related:** [Marketplace Evolution Roadmap](../development-roadmap.md#phase-13--marketplace-evolution)
