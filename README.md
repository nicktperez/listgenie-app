# ListGenie.ai Web App

A GPT-powered listing assistant for realtors, built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

- **AI-Powered Listing Generation** - Create compelling property listings with AI
- **User Authentication** - Secure user management with Clerk
- **Subscription Management** - Stripe-powered billing with free/pro tiers
- **Database Integration** - Supabase for data persistence
- **Modern UI/UX** - Beautiful, responsive interface with Tailwind CSS
- **Type Safety** - Full TypeScript support
- **Testing** - Comprehensive test coverage with Jest & React Testing Library
- **Code Quality** - ESLint, Prettier, and automated formatting

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Authentication**: Clerk
- **Database**: Supabase
- **Payments**: Stripe
- **State Management**: TanStack Query (React Query)
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Stripe account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd listgenie-app-1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenRouter AI
OPENROUTER_API_KEY=your-api-key

# App Configuration
NODE_ENV=development
```

### 4. Database Setup

Run the database migrations in your Supabase dashboard or use the SQL commands in `DATABASE_SETUP.md`.

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest + React Testing Library
- **Component Testing**: Isolated component testing
- **API Testing**: Endpoint testing with mocks
- **Coverage**: Automated coverage reporting

Run tests:
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

## 🔧 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Format code with Prettier
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Component Structure

```tsx
// components/ComponentName.tsx
import React from 'react';

interface ComponentProps {
  // Define props interface
}

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    // JSX
  );
};

export default ComponentName;
```

### API Routes

```tsx
// pages/api/endpoint.ts
import { withErrorHandler, validateRequest, createApiResponse } from '@/lib/api';

async function handler(req, res) {
  // Route logic
}

export default withErrorHandler(handler);
```

## 🗄️ Database Schema

Key tables:
- `users` - User accounts and subscription info
- `listings` - Generated property listings
- `generations` - AI generation tracking
- `subscriptions` - Stripe subscription data

See `DATABASE_SETUP.md` for detailed schema information.

## 🔒 Security Features

- Input validation with Zod
- Rate limiting on API endpoints
- Authentication middleware
- CORS protection
- SQL injection prevention (Supabase)

## 📱 Performance Optimizations

- React Query for efficient data fetching
- Image optimization with Next.js
- Code splitting and lazy loading
- Service worker for offline support
- Optimistic updates for better UX

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms

- **Netlify**: Use `npm run build` and set build output to `.next`
- **AWS/GCP**: Build and deploy the `.next` folder
- **Docker**: Use the provided Dockerfile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the [issues](../../issues) page
- Review the documentation
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release with core functionality
- TypeScript migration
- Enhanced testing infrastructure
- Improved error handling
- Better UX components
