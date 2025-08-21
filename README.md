# ListGenie.ai Web App

A GPT-powered listing assistant for realtors, with Clerk authentication and Stripe payment.

## Setup

1. Create a `.env.local` file and include your Clerk publishable key:

   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your key>
   ```

   This prevents build errors like "Missing publishableKey".
2. Run `npm install`
3. Run `npm run dev`

## Features

- Clerk user authentication
- Stripe billing (setup + monthly)
- GPT listing generation
- Protected app dashboard
