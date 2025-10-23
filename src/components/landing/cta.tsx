import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section
      id="cta"
      className="py-20 md:py-32 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground"
    >
      <div className="container max-w-screen-2xl">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your fitness?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Join thousands of people achieving their goals. Start your free
              trial today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-background text-foreground"
            />
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-muted group whitespace-nowrap"
            >
              Start Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/80">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
