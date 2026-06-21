import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import ClosingCTA from "./ClosingCTA";

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100">
      <Hero />
      <Features />
      <HowItWorks />
      <ClosingCTA />
    </div>
  );
}
