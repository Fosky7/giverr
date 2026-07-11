const Index = () => (
  <main>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="#top" className="font-display text-xl font-bold text-primary">Open Hands</a>
          <ul className="hidden md:flex items-center gap-8 text-sm"><li key="features"><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">How</a></li><li key="about"><a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li><li key="contact"><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li></ul>
          <a href="#contact" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">Donate</a>
        </nav>
      </header>
      <section id="top" className="relative min-h-screen flex items-center justify-center text-center">
        <img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1920&q=80" alt="Open Hands hero image" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative z-10 max-w-2xl px-6 text-primary-foreground">
          <p className="uppercase tracking-[0.3em] text-sm text-accent mb-4">Nonprofit</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">Open Hands</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">Join us in building a more compassionate community.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="#contact" className="rounded-md bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90 transition-opacity">Donate</a>
            <a href="#contact" className="rounded-md border border-primary-foreground/40 px-6 py-3 font-medium hover:bg-primary-foreground/10 transition-colors">Learn More</a>
          </div>
        </div>
      </section>
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-12">How We Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div key="0" className="rounded-lg bg-card p-6 border border-border">
              <h3 className="font-display text-xl mb-2 text-primary">Food security</h3>
              <p className="text-sm text-muted-foreground">Meals for families in need.</p>
            </div><div key="1" className="rounded-lg bg-card p-6 border border-border">
              <h3 className="font-display text-xl mb-2 text-primary">Shelter</h3>
              <p className="text-sm text-muted-foreground">Safe places to rest and rebuild.</p>
            </div><div key="2" className="rounded-lg bg-card p-6 border border-border">
              <h3 className="font-display text-xl mb-2 text-primary">Programs</h3>
              <p className="text-sm text-muted-foreground">Job training and support.</p>
            </div></div>
        </div>
      </section>
      <section id="about" className="py-24 px-6 bg-muted">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">Open Hands has served our community for fifteen years, providing food, shelter, and opportunity. Every dollar and every hour goes toward lifting people up.</p>
        </div>
      </section>
      <section id="contact" className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Get Involved</h2>
          <p className="text-muted-foreground mb-8">Donate, volunteer, or partner with us.</p>
          <div className="flex flex-col items-center gap-2 mb-8">
            <a href="tel:+15550100" className="text-lg font-medium text-primary">+1 (555) 0100</a>
            <a href="mailto:hello@openhands.org" className="text-muted-foreground">hello@openhands.org</a>
          </div>
          <form className="space-y-4 text-left" action="mailto:hello@openhands.org" method="post" encType="text/plain">
            <input required name="name" placeholder="Name" className="w-full rounded-md border border-border bg-card px-4 py-3" />
            <input required name="email" type="email" placeholder="Email" className="w-full rounded-md border border-border bg-card px-4 py-3" />
            <textarea required name="message" placeholder="Tell us how we can help" rows={4} className="w-full rounded-md border border-border bg-card px-4 py-3" />
            <button type="submit" className="w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition-opacity">Send Message</button>
          </form>
        </div>
      </section>
      <footer className="bg-foreground text-background py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-xl">Open Hands</p>
          <p className="text-sm opacity-70">&copy; {new Date().getFullYear()} Open Hands. All rights reserved.</p>
        </div>
      </footer>
  </main>
);

export default Index;
