import { SignedIn } from "@clerk/nextjs";

export default function ChatPage() {
  return (
    <SignedIn>
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-white to-blue-100 animate-gradient"></div>

        {/* Sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-75 animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-extrabold text-gray-900 drop-shadow-sm mb-6">
            Chat with ListGenie ✨
          </h1>
          <p className="text-lg text-gray-700 mb-10">
            Ask questions, draft listings, or brainstorm — your AI assistant is ready.
          </p>

          <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            {/* Placeholder for your chat UI */}
            <p className="text-gray-500">
              Chat interface goes here. (Your existing chat UI will render here.)
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite ease-in-out;
        }
      `}</style>
    </SignedIn>
  );
}