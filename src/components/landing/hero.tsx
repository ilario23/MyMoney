import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-background">
      <div className="container max-w-screen-2xl relative z-10">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block rounded-lg px-4 py-1.5 text-sm font-medium bg-primary/15 text-primary">
              ✨ Launch Your Fitness Journey
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Your Personal Fitness
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Companion
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track workouts, plan meals, and achieve your fitness goals with
              our all-in-one platform. Built for everyone, from beginners to
              athletes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {[
              "No credit card required",
              "14-day free trial",
              "Cancel anytime",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 justify-center text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements now using primary with opacity for adaptability */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse bg-primary"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse bg-primary"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </section>
  );
}
