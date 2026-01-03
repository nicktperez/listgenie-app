import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star, Zap, Layout, Share2, Shield } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      title: "AI-Powered Descriptions",
      description: "Generate captivating property descriptions in seconds with our advanced AI engine trained on millions of listings."
    },
    {
      icon: <Layout className="w-6 h-6 text-blue-400" />,
      title: "Examples & Templates",
      description: "Choose from MLS-ready, Luxury, or Social Media styles to perfectly match your target audience."
    },
    {
      icon: <Share2 className="w-6 h-6 text-pink-400" />,
      title: "Instant Flyers",
      description: "Create beautiful, professional PDF flyers automatically from your listing data."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-purple-500/30">
      <Head>
        <title>ListGenie.ai | Professional Real Estate Listings in Seconds</title>
        <meta name="description" content="Generate professional real estate listings, flyers, and social media content in seconds using AI." />
      </Head>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl flex items-center">
                <img src="/logo_icon.png" alt="ListGenie" className="w-8 h-8 object-contain" />
              </span>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                ListGenie.ai
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm text-gray-300">Now with AI Flyer Generation</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8">
              Write Listings that <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
                Sell Faster
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform basic property details into compelling descriptions,
              social media posts, and stunning flyers in seconds with AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chat" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2">
                Start Generating Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center">
                View Demo
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Basic export formats</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to list properties</h2>
            <p className="text-gray-400">Streamline your workflow from description to marketing materials</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group"
              >
                <div className="mb-6 p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-16">Trusted by real estate professionals</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/5 text-left">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <img key={s} src="/star_rating.png" alt="star" className="w-5 h-5 object-contain" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">
                  "This tool has completely changed how I work. I used to spend hours writing descriptions, now it takes minutes."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                  <div>
                    <div className="font-bold">Sarah Johnson</div>
                    <div className="text-xs text-gray-500">Realtor, Century 21</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-20" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Ready to upgrade your listings?</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of agents using AI to sell homes faster.
              </p>
              <Link href="/sign-up" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors">
                Get Started for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl flex items-center">
                  <img src="/logo_icon.png" alt="ListGenie" className="w-8 h-8 object-contain" />
                </span>
                <span className="font-bold text-xl">ListGenie.ai</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                The tailored AI assistant for real estate professionals.
                Create stunning listings, flyers, and social content in seconds.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/examples" className="hover:text-white transition-colors">Examples</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} ListGenie.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}