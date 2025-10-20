import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, BarChart3, Users, Shield, Clock, Target } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Tracking",
    description: "Log your workouts in seconds with our intuitive interface.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into your progress with beautiful charts and reports.",
  },
  {
    icon: Users,
    title: "Social Features",
    description: "Connect with friends and share your fitness achievements.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and never shared with third parties.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Sync across all your devices instantly.",
  },
  {
    icon: Target,
    title: "Smart Goals",
    description: "AI-powered goal suggestions based on your activity.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white">
      <div className="container max-w-screen-2xl">
        <div className="text-center space-y-4 mb-16">
          <Badge className="mx-auto">Features</Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-950">
            Everything you need
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Powerful features designed to keep you motivated and on track.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-neutral-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
