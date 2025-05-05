export default function HeroSection() {
  return (
    <section className="pt-12 pb-8 md:pt-20 md:pb-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-gradient pb-2">
          Magic Tool Generator
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Turn your ideas into working tools with a simple description. No coding required.
        </p>
      </div>
    </section>
  );
}