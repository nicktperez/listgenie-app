# Database Setup Guide for ListGenie

## Required Database Tables and Columns

### 1. Users Table
Make sure your `users` table has these columns:

```sql
-- Add these columns to your existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
```

**Note**: We removed `usage_count` and `last_usage` columns since we no longer track usage limits.

### 2. Generations Table (for analytics)
Create this new table:

```sql
CREATE TABLE IF NOT EXISTS generations (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generations_clerk_id ON generations(clerk_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
```

### 3. Listings Table (if you don't have one)
```sql
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL,
  title TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_clerk_id ON listings(clerk_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
```

## Environment Variables Required

Make sure these are set in your deployment environment:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_... # Your Pro plan price ID

# Clerk
CLERK_SECRET_KEY=pk_test_... or pk_live_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Plan Model

**New Simplified Model:**
- **Trial Pro**: New users get 14 days of full Pro features
- **Paid Pro**: $19/month for unlimited access to all features
- **No Free Tier**: Users must upgrade after trial expires

**Features Available:**
- ✅ Unlimited listing generations
- ✅ Premium AI models  
- ✅ Flyer generation
- ✅ Batch processing (up to 20 properties)
- ✅ Advanced templates
- ✅ Priority support

## Deployment Checklist

- [ ] Database tables and columns created
- [ ] All environment variables set
- [ ] Stripe webhook endpoint configured in Stripe dashboard
- [ ] Clerk webhook configured (if needed)
- [ ] Test the app locally before deploying

## Testing After Deployment

1. **User Registration**: Test that new users get trial Pro access
2. **Trial Features**: Verify trial users can access all Pro features
3. **Stripe Integration**: Test Pro plan upgrade flow
4. **Batch Processing**: Verify Pro users can access batch features
5. **Analytics**: Check that usage page loads correctly
6. **Trial Expiration**: Test that expired users see upgrade prompts
