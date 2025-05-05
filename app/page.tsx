import HeroSection from '@/components/hero-section';
import ToolCreator from '@/components/tool-creator';
import { ModeToggle } from '@/components/mode-toggle';
import { Navigation } from '@/components/navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Navigation />
        <main className="flex flex-col">
          <HeroSection />
          <ToolCreator />
        </main>
      </div>
    </div>
  );
}