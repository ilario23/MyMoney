import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marathon Runner",
    content: "This app completely changed my training. The analytics helped me optimize my runs and I've never been faster!",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Gym Enthusiast",
    content: "Finally, an app that doesn't overcomplicate things. Simple, effective, and the community is amazing.",
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    role: "Fitness Coach",
    content: "I recommend this to all my clients. The meal planning integration saves hours of work every week.",
    avatar: "ER",
  },
];

export function Testimonials() {
  return (
    <section id="benefits" className="py-20 md:py-32 bg-white">
      <div className="container max-w-screen-2xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-950">
            Loved by thousands
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Join our community of fitness enthusiasts achieving their goals every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-neutral-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-neutral-700 italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
