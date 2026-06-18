# Art Gallery E-Commerce Platform

A full-stack art gallery e-commerce platform built with Next.js, Supabase, and Razorpay. Features a public gallery, customer accounts, admin panel, and automated payment verification via webhooks.

## What is this?

This is a production-ready art gallery website that allows artists to showcase and sell their artwork online. The platform includes:

- **Public Gallery**: Browse artworks with real-time availability status (Available, Reserved, Sold)
- **Customer Features**: User authentication, order history, saved shipping/billing addresses
- **Admin Panel**: Upload artwork with automatic image compression, manage inventory, view order ledger
- **Automated Payments**: Razorpay UPI payment links with automatic webhook verification (no manual UTR entry)
- **Inventory Management**: Atomic reservation system prevents double-booking with automatic release of unpaid reservations

## Tech Stack

### Frontend & Hosting
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vercel** - Deployment and hosting (free tier)

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and file storage
  - Row Level Security (RLS) policies for data protection
  - Storage bucket for artwork images
  - Atomic database functions for reservations
- **@supabase/ssr** - Server-side auth integration

### Payments
- **Razorpay** - UPI payment links with webhook integration
  - HMAC-SHA256 signature verification
  - Zero MDR on UPI transactions

### Additional Libraries
- **browser-image-compression** - Client-side image optimization (~2.5MB target)

## Key Features

### Payment Flow
- **No manual UTR verification**: Razorpay fires a signed `payment_link.paid` webhook that automatically updates order status
- **Signature verification**: HMAC-SHA256 verification on raw webhook body prevents fraud
- **Automatic status updates**: Webhook handles `paid`, `expired`, and `cancelled` events

### Reservation System
- **Status model**: `available → reserved → sold`
- **Atomic reservations**: Database function ensures no double-booking
- **15-minute hold**: Checkout reserves artwork for 15 minutes
- **Auto-release**: Cron job (`/api/cron/release-reservations`) runs every 10 minutes to release expired reservations

### Image Handling
- **Compression**: Images compressed to ~2.5MB for quality while staying within free tier limits
- **Storage**: Supabase storage bucket with public access for artwork images
- **Upload**: Admin can upload via camera or file browser with automatic compression

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- A Supabase account (free tier works)
- A Razorpay account (test mode available without KYC)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd gallery-website
npm install
```

### 2. Supabase Setup

1. **Create a new project** at [supabase.com](https://supabase.com)
   
2. **Run database migrations**:
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/0001_init.sql`
   - Click "Run"
   - This creates:
     - Tables: `profiles`, `addresses`, `artworks`, `orders`
     - Enums: `artwork_status`, `order_status`
     - RLS policies for data security
     - Storage bucket named `artworks`
     - Database functions: `reserve_artwork`, `release_artwork`

3. **Get API credentials**:
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon/public key** (safe to expose in browser)
     - **service_role key** (⚠️ keep secret, server-side only)

### 3. Razorpay Setup

1. **Create account** at [razorpay.com](https://razorpay.com)
   - Use **Test Mode** initially (no KYC required)
   - Complete KYC for live payments (~24h approval)

2. **Generate API keys**:
   - Go to Settings → API Keys
   - Generate and copy:
     - **Key ID** (e.g., `rzp_test_xxxxxxxx`)
     - **Key Secret**

3. **Configure webhook** (after deployment):
   - Go to Settings → Webhooks
   - Click "Add New Webhook"
   - URL: `https://<your-deployed-site>/api/webhooks/razorpay`
   - Secret: Create a random string (save as `RAZORPAY_WEBHOOK_SECRET`)
   - Active Events: Select these three:
     - `payment_link.paid`
     - `payment_link.expired`
     - `payment_link.cancelled`

### 4. Environment Variables

1. **Copy the example file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in all values** in `.env.local`:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   RAZORPAY_WEBHOOK_SECRET=your-random-webhook-secret
   
   # App
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ADMIN_EMAILS=your-email@example.com
   CRON_SECRET=another-random-string
   ```

   **Important**:
   - `ADMIN_EMAILS`: Comma-separated list of emails allowed to access `/admin`
   - `CRON_SECRET`: Optional, protects the cron endpoint
   - Never commit `.env.local` to git (it's gitignored)

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Create Admin Account

1. Go to `/login`
2. Sign up with an email from your `ADMIN_EMAILS` list
3. After signup, visit `/admin` to access the admin panel
4. Upload your first artwork!

## Deployment to Vercel

### 1. Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. **Import project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure environment variables**:
   - Add all variables from `.env.local` to Vercel
   - **Important**: Update `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g., `https://your-app.vercel.app`)

3. **Deploy**:
   - Click "Deploy"
   - `vercel.json` automatically registers the cron job for reservation cleanup

4. **Update Razorpay webhook**:
   - Go to Razorpay dashboard → Settings → Webhooks
   - Update webhook URL to: `https://your-app.vercel.app/api/webhooks/razorpay`

### 3. Verify Deployment

- Visit your site and test the gallery
- Sign up with an admin email
- Upload a test artwork
- Test the checkout flow with Razorpay test mode

## Project Structure

```
gallery-website/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Gallery homepage
│   ├── art/[id]/            # Artwork detail page
│   ├── checkout/[id]/       # Checkout flow
│   ├── account/             # User account & orders
│   ├── admin/               # Admin panel (protected)
│   │   ├── page.tsx         # Upload artwork
│   │   └── orders/          # Order management
│   ├── login/               # Authentication
│   └── api/
│       ├── webhooks/        # Razorpay webhook handler
│       └── cron/            # Reservation cleanup cron
├── components/              # Reusable React components
├── lib/                     # Utilities & helpers
│   ├── supabase/           # Supabase client setup
│   ├── auth.ts             # Auth helpers
│   ├── types.ts            # TypeScript types
│   ├── format.ts           # Formatting utilities
│   └── razorpay.ts         # Razorpay integration
├── supabase/
│   └── migrations/         # Database schema
│       ├── 0001_init.sql   # Initial schema
│       └── 0002_address_edit.sql
├── middleware.ts           # Auth session refresh
├── .env.local.example      # Environment template
└── vercel.json            # Vercel config (cron jobs)
```

## Application Routes

### Public Routes
- **`/`** - Gallery homepage (browse all artworks)
- **`/art/[id]`** - Individual artwork detail page
- **`/login`** - User authentication (sign up/sign in)

### Protected Routes (Require Login)
- **`/checkout/[id]`** - Checkout page for purchasing artwork
- **`/checkout/return`** - Payment return/callback page
- **`/account`** - User dashboard (orders, saved addresses)

### Admin Routes (Require Admin Email)
- **`/admin`** - Upload new artwork with image compression
- **`/admin/orders`** - Order ledger and management

### API Routes
- **`/api/webhooks/razorpay`** - Razorpay webhook handler (payment events)
- **`/api/cron/release-reservations`** - Automated reservation cleanup (runs every 10 min)

## Database Schema

### Tables
- **`profiles`** - User profiles (1:1 with auth.users)
- **`addresses`** - Shipping/billing addresses (many per user)
- **`artworks`** - Art pieces with status tracking
- **`orders`** - Purchase records with Razorpay linkage

### Key Functions
- **`reserve_artwork(artwork_id, user_id, minutes)`** - Atomically reserve artwork
- **`release_artwork(artwork_id)`** - Release reservation

## Free Tier Considerations

### Supabase
- **Pauses after ~7 days of inactivity**: First visitor after pause experiences cold start
- **1 GB storage limit**: ~100 artworks at 2.5MB each
- **500 MB database**: Sufficient for thousands of orders
- **Solution**: Upgrade to Pro ($25/mo) or implement scheduled pings

### Razorpay
- **Test mode**: No KYC required, works for development
- **Live mode**: Requires KYC approval (~24h)
- **UPI transactions**: Zero MDR (Merchant Discount Rate)

### Vercel
- **100 GB bandwidth/month**: Adequate for small galleries
- **Serverless function limits**: 10-second timeout (sufficient for this app)

## Security Features

### Authentication & Authorization
- **Supabase Auth**: Email-based authentication with session management
- **Row Level Security (RLS)**: Database-level access control
- **Admin protection**: Email allowlist for admin routes
- **Service role key**: Server-side only, never exposed to browser

### Payment Security
- **Webhook signature verification**: HMAC-SHA256 on raw request body
- **Atomic reservations**: Database-level locking prevents race conditions
- **No manual UTR entry**: Eliminates inventory-freeze exploit

### Data Protection
- **Environment variables**: Secrets stored securely, never committed
- **HTTPS only**: All production traffic encrypted
- **CORS protection**: API routes validate origins

## Development Tips

### Local Testing
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing Payments
1. Use Razorpay test mode credentials
2. Test card: `4111 1111 1111 1111`
3. Any future expiry date and CVV
4. Webhook events can be triggered manually in Razorpay dashboard

### Debugging
- Check Supabase logs for database errors
- Monitor Vercel function logs for API issues
- Use Razorpay dashboard to view webhook delivery status

## Troubleshooting

### Common Issues

**"Could not load artworks" error**:
- Ensure `0001_init.sql` migration has been run in Supabase
- Check Supabase credentials in `.env.local`

**Admin panel not accessible**:
- Verify your email is in `ADMIN_EMAILS` environment variable
- Sign up with the exact email from the allowlist

**Webhook not working**:
- Verify webhook URL matches deployed domain
- Check `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- Ensure webhook events are enabled: `payment_link.paid`, `payment_link.expired`, `payment_link.cancelled`

**Images not loading**:
- Check Supabase storage bucket `artworks` exists
- Verify bucket has public access enabled
- Confirm `NEXT_PUBLIC_SUPABASE_URL` is correct

** NOTE: Payment Flow Test Credentials used.

## License

This project is open source and available under the MIT License.
