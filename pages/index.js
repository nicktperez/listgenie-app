// pages/index.js - Professional redirect to main chat page
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function HomePage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Longer delay to appreciate the beautiful page
    const timer = setTimeout(() => {
      setRedirecting(true);
      router.replace("/chat");
    }, 3500); // Increased from 800ms to 3.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Logo and Brand */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}>
          🏠
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          ListGenie.ai
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          margin: '0',
          fontWeight: '500'
        }}>
          AI-Powered Real Estate Listings
        </p>
      </div>

      {/* Loading Animation */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
          margin: '0 auto 1.5rem',
          filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3))'
        }}></div>
        
        <div style={{
          fontSize: '1.2rem',
          color: '#e2e8f0',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          {redirecting ? 'Redirecting...' : 'Preparing your workspace...'}
        </div>
        
        <p style={{
          fontSize: '0.95rem',
          color: '#94a3b8',
          margin: '0',
          maxWidth: '300px'
        }}>
          {redirecting ? 'Taking you to the AI Listing Generator' : 'Setting up your personalized experience'}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '300px',
        height: '4px',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
          borderRadius: '2px',
          animation: 'progress 2s ease-in-out infinite',
          background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)'
        }}></div>
      </div>

      {/* Features Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        maxWidth: '600px',
        marginTop: '2rem'
      }}>
        {[
          { icon: '✨', title: 'AI Generated', desc: 'Professional listings in seconds' },
          { icon: '🎯', title: 'Multiple Formats', desc: 'MLS, social, luxury & more' },
          { icon: '🚀', title: 'Pro Features', desc: 'Flyers, batch processing & more' }
        ].map((feature, index) => (
          <div key={index} style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '0.25rem'
            }}>{feature.title}</div>
            <div style={{
              fontSize: '0.8rem',
              color: '#94a3b8',
              lineHeight: '1.4'
            }}>{feature.desc}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}