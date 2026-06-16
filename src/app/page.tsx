import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Target, Zap, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  
  // If user is authenticated, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-white">LeetCode Analyzer</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Track Your <span className="text-primary">LeetCode Progress</span> with AI
          </h1>
          <p className="text-xl text-muted-foreground">
            Analyze your coding journey, identify weaknesses, and get personalized insights 
            powered by artificial intelligence.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Progress Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your daily, weekly, and monthly progress with detailed analytics
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized recommendations and identify areas for improvement
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Goal Setting</h3>
            <p className="text-sm text-muted-foreground">
              Set and track coding goals to stay motivated and focused
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Visual Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful charts and heatmaps to visualize your coding journey
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Level Up Your Coding?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers tracking their LeetCode progress and improving their skills.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="text-lg">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; 2024 LeetCode Progress Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
