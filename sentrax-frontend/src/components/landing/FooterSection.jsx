import { Zap } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-green flex items-center justify-center">
            <Zap className="w-4 h-4 text-background" />
          </div>
          <span className="font-mono font-bold text-foreground tracking-wider text-sm">SENTRAX</span>
        </div>
        <p className="text-sm text-muted-foreground font-mono">
          © 2026 SentraX. The Intelligence Layer of the Internet.
        </p>
      </div>
    </footer>
  );
}