# ListGenie.ai Web App

A GPT-powered listing assistant for realtors, with Clerk authentication and Stripe payment.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Run `npm install`
3. Run `npm run dev`

### Tests

Run unit tests for helper utilities with:

```bash
npm test
```

## Features

- Clerk user authentication
- Stripe billing (setup + monthly)
- GPT listing generation
- Protected app dashboard
