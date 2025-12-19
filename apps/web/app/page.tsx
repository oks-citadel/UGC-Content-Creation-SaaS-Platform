import Link from 'next/link';
import { ArrowRight, Play, Zap, Users, BarChart3, ShoppingBag, Bot, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-bold">NEXUS</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/creators" className="text-sm font-medium hover:text-primary transition-colors">
              For Creators
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span>AI-Powered UGC Platform</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Create, Manage &{' '}
            <span className="text-gradient">Monetize UGC</span> at Scale
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            NEXUS unifies AI-powered content creation, creator marketplace, shoppable commerce,
            and enterprise analytics into one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need to Win with UGC
          </h2>
          <p className="text-lg text-muted-foreground">
            Replace 8-15 disconnected tools with one unified platform.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Bot className="h-6 w-6" />}
            title="AI Creation Suite"
            description="Generate UGC-style videos, scripts, voiceovers, and captions with AI. Pre-publish performance scoring."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Creator Marketplace"
            description="AI-powered creator matching, reputation scoring, automated payments, and ambassador programs."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Campaign Management"
            description="Brief builder, workflow automation, content calendar, and compliance checking in one place."
          />
          <FeatureCard
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Shoppable Commerce"
            description="Embeddable galleries with product tagging, direct checkout, and true revenue attribution."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Unified Analytics"
            description="Real-time dashboards, creative analytics, and custom reporting with multi-touch attribution."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Enterprise Security"
            description="SOC 2 Type II compliant, GDPR ready, blockchain-based rights management."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl rounded-2xl bg-primary p-8 md:p-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl mb-4">
            Ready to Transform Your UGC Strategy?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of brands and creators already using NEXUS to create, manage, and
            monetize user-generated content.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-background px-8 py-3 text-base font-medium text-foreground hover:bg-background/90 transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">N</span>
                </div>
                <span className="text-xl font-bold">NEXUS</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The unified platform for UGC creation, management, and monetization.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} NEXUS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
