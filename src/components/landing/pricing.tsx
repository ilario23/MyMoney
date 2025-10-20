import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description: "For casual fitness enthusiasts",
    price: "$9",
    period: "per month",
    features: [
      "Up to 5 workouts per week",
      "Basic analytics",
      "Mobile app access",
      "Community forum",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious athletes",
    price: "$29",
    period: "per month",
    features: [
      "Unlimited workouts",
      "Advanced analytics",
      "AI-powered recommendations",
      "Priority support",
      "Custom meal plans",
      "1-on-1 coaching",
    ],
    highlighted: true,
  },
  {
    name: "Elite",
    description: "For fitness professionals",
    price: "$99",
    period: "per month",
    features: [
      "Everything in Pro",
      "Team management",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
    ],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-neutral-50">
      <div className="container max-w-screen-2xl">
        <div className="text-center space-y-4 mb-16">
          <Badge className="mx-auto">Pricing</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-950">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border transition-all ${
                plan.highlighted
                  ? "border-blue-600 shadow-xl scale-105 md:scale-110"
                  : "border-neutral-200"
              }`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-neutral-600 ml-2">{plan.period}</span>
                </div>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Get Started
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
