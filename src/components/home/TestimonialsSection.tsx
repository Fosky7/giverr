import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
  avatarUrl?: string;
}

/**
 * Illustrative social-proof testimonials. Real data can be wired in later
 * without changing the markup.
 */
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Amara Okoye",
    role: "Campaign Creator, Clean Water Initiative",
    quote:
      "Rayze made launching our campaign effortless. We hit our funding goal in three weeks and brought clean water to two villages.",
    initials: "AO",
  },
  {
    name: "Daniel Reyes",
    role: "Monthly Donor",
    quote:
      "I love how transparent every campaign is. I can see exactly where my money goes and the impact it creates.",
    initials: "DR",
  },
  {
    name: "Priya Nair",
    role: "Director, Bright Futures NGO",
    quote:
      "The tools are professional and the reach is incredible. Rayze helped us connect with backers we never could have found on our own.",
    initials: "PN",
  },
];

/**
 * Social-proof section: a responsive grid of quotes paired with avatars to
 * build trust and credibility with prospective creators and donors.
 */
export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Trusted by creators and donors
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Real stories from the people making change happen with Rayze.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <Card
            key={testimonial.name}
            className="flex flex-col border-border/60 transition-shadow hover:shadow-lg"
          >
            <CardContent className="flex flex-1 flex-col gap-6 p-6">
              <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <Avatar>
                  {testimonial.avatarUrl ? (
                    <AvatarImage
                      src={testimonial.avatarUrl}
                      alt={testimonial.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsSection;
