import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="cta" className="py-20 md:py-32 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="container max-w-screen-2xl">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your fitness?
            </h2>
            <p className="text-lg text-blue-100">
              Join thousands of people achieving their goals. Start your free trial today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-neutral-950"
            />
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 group whitespace-nowrap"
            >
              Start Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-sm text-blue-100">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
