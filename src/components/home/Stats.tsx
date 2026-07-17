interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "$12M+", label: "Funds raised" },
  { value: "3,400+", label: "Campaigns launched" },
  { value: "85K+", label: "Generous backers" },
  { value: "120+", label: "Countries reached" },
];

/**
 * Social-proof stats band. Values are illustrative placeholders and will be
 * wired to real data in a later module.
 */
export function Stats() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-2 gap-8 rounded-2xl border border-border/60 bg-card px-6 py-10 text-center shadow-sm md:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <div key={label}>
            <p className="text-3xl font-bold text-primary sm:text-4xl">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
