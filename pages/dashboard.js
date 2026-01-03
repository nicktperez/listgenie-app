import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Download,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import { useListings, useDeleteListing } from '../hooks/useListings';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  // Use Supabase hooks for data fetching
  const { data: savedListings = [], isLoading: loading } = useListings(
    user?.id
  );
  const deleteListingMutation = useDeleteListing();

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteListingMutation.mutate(id);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-2xl hover:opacity-80 transition-opacity flex items-center"
            >
              <img src="/logo_icon.png" alt="ListGenie" className="w-8 h-8 object-contain" />
            </Link>
            <span className="font-semibold text-lg">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Upgrade Plan
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 overflow-hidden">
              <img
                src={user?.imageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-slate-400">
              Manage your listings and marketing materials.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-purple-900/20"
          >
            <Plus className="w-5 h-5" />
            Create New Listing
          </Link>
        </div>

        {/* Stats Grid (Mock Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              label: 'Total Listings',
              value: savedListings.length || '0',
              icon: <FileText className="text-blue-400" />,
            },
            {
              label: 'Flyers Generated',
              value: '0',
              icon: <Download className="text-green-400" />,
            },
            {
              label: 'Days Remaining',
              value: 'Trailing',
              icon: <Calendar className="text-purple-400" />,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">
                  {stat.label}
                </span>
                <div className="p-2 rounded-lg bg-white/5">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Listings Section */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Listings</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search listings..."
              className="pl-9 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">
            Loading your content...
          </div>
        ) : savedListings.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-slate-800/20 border border-slate-700/50 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">No listings yet</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Generate your first AI listing to see it appear here.
            </p>
            <Link
              href="/chat"
              className="text-purple-400 font-medium hover:text-purple-300"
            >
              Start new listing →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedListings.map((listing) => (
              <div
                key={listing.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/30 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center p-2">
                    <img src="/logo_icon.png" alt="home" className="w-full h-full object-contain opacity-50 grayscale" />
                  </div>
                  <div>
                    <h4 className="font-bold truncate max-w-[200px] md:max-w-md">
                      {listing.address || listing.title || 'Untitled Listing'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Created{' '}
                      {new Date(
                        listing.created_at || listing.date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-300"
                    title="Download Flyer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
