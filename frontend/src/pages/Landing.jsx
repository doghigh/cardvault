import { useAuth } from "../App";
import { Button } from "../components/ui/button";
import { CreditCard, Scan, Database, TrendingUp } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // If already logged in, redirect to dashboard
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1761847246291-4404b4569d5d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc2xhdGUlMjB0ZXh0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzQ2Nzc4NzB8MA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Header */}
      <header className="relative z-10 glass sticky top-0 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-zinc-950" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-zinc-50 tracking-tight">CardVault</span>
          </div>
          <Button 
            onClick={handleLogin}
            data-testid="header-login-btn"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-amber-500 mb-4">
              AI-Powered Card Collection
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-bold text-zinc-50 mb-6">
              Scan. Catalog. Value.
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-12 max-w-xl mx-auto">
              Transform your trading card collection with AI-powered scanning. 
              Instantly identify cards, track condition, and get real market prices.
            </p>
            <Button 
              onClick={handleLogin}
              data-testid="hero-login-btn"
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-lg px-8 py-6 h-auto"
            >
              Get Started with Google
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
            <FeatureCard 
              icon={<Scan className="w-6 h-6" strokeWidth={1.5} />}
              title="Smart Scanning"
              description="Upload or capture cards. Our AI reads text, identifies the card, and notes any damage automatically."
            />
            <FeatureCard 
              icon={<Database className="w-6 h-6" strokeWidth={1.5} />}
              title="Auto-Catalog"
              description="Card type, year, name, and condition are extracted and stored in your personal database."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6" strokeWidth={1.5} />}
              title="Price Tracking"
              description="Get average, top, and bottom sale prices from eBay or enter values manually."
            />
          </div>

          {/* Card Preview Image */}
          <div className="mt-24 relative">
            <div className="aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1672759043238-66899aeaf2ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwzfHxyYXJlJTIwdHJhZGluZyUyMGNhcmQlMjBob2xvZ3JhcGhpY3xlbnwwfHx8fDE3NzQ2Nzc4NjR8MA&ixlib=rb-4.1.0&q=85"
                alt="Trading card collection"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-zinc-500">
            © 2026 CardVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div 
      className="bg-zinc-900 border border-white/10 rounded-lg p-6 card-hover"
      data-testid={`feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-zinc-50 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
