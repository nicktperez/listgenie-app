# Database Setup Guide for ListGenie

## Required Database Tables and Columns

### 1. Users Table

```sql
create table if not exists users (
  id text primary key, -- This will store the Clerk User ID
  email text,
  role text default 'user', -- 'admin' or 'user'
  plan text default 'trial',
  trial_end_date timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index
create index if not exists idx_users_email on users(email);
```

### 2. Listings Table

```sql
create table if not exists listings (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade not null,
  title text,
  description text,
  address text,
  bedrooms numeric,
  bathrooms numeric,
  sqft numeric,
  style text,
  features text,
  generated_content jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_created_at on listings(created_at);
```

### 3. Generations Table (Analytics)

```sql
create table if not exists generations (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade not null,
  input text,
  output text,
  model text,
  tokens_used integer,
  cost numeric,
  created_at timestamp with time zone default now()
);

create index if not exists idx_generations_user_id on generations(user_id);
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
