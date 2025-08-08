import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl"
          >
            Welcome to <span className="text-purple-600">ListGenie</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Your AI-powered assistant for creating real estate listings in seconds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6"
          >
            <Link
              href="/chat"
              className="px-6 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow hover:bg-purple-700 transition"
            >
              Start Chatting
            </Link>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Instant Listings',
              description:
                'Generate professional real estate listings instantly, ready to post.',
              icon: '⚡'
            },
            {
              title: 'AI-Powered',
              description:
                'Leverage cutting-edge AI models for high-quality, unique property descriptions.',
              icon: '🤖'
            },
            {
              title: 'Save Time',
              description:
                'Focus on closing deals while ListGenie handles the writing.',
              icon: '⏱️'
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * idx }}
              className="bg-white rounded-lg shadow p-6 text-center"
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}