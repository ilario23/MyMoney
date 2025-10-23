import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg"></div>
          <span className="font-bold text-lg text-foreground">
            ActiveFitness
          </span>
        </div>

        <nav className="hidden md:flex gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            Features
          </a>
          <a
            href="#benefits"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            Benefits
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            Pricing
          </a>
          <a
            href="#cta"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign In
          </Button>
          <Button size="sm" className="hidden sm:inline-flex">
            Get Started
          </Button>
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
