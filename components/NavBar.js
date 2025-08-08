import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
              ListGenie
            </Link>
          </div>

          {/* Center: Main Links */}
          <div className="hidden sm:flex sm:space-x-8 items-center">
            <Link
              href="/chat"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Chat
            </Link>
          </div>

          {/* Right: User */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}