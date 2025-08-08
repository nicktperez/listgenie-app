// pages/index.js
import { SignedIn, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { FiMessageSquare, FiDatabase, FiBarChart2 } from "react-icons/fi";

export default function Home() {
  const { user } = useUser();

  const tools = [
    {
      title: "Chat",
      description: "Ask ListGenie questions and draft listing content.",
      icon: <FiMessageSquare className="w-6 h-6 text-indigo-500" />,
      href: "/chat",
    },
    {
      title: "Models",
      description: "Browse available OpenRouter models.",
      icon: <FiDatabase className="w-6 h-6 text-green-500" />,
      href: "/models",
    },
    {
      title: "Usage",
      description: "See your request/token usage (admins can see all).",
      icon: <FiBarChart2 className="w-6 h-6 text-pink-500" />,
      href: "/usage",
    },
  ];

  return (
    <SignedIn>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, {user?.firstName || "there"} 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Ready to boost your productivity? Pick a tool below to get started.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {tool.icon}
                  </div>
                  <h2 className="text-lg font-semibold">{tool.title}</h2>
                </div>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SignedIn>
  );
}