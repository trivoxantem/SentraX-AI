import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, Globe, Users, Eye } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';

const features = [
  {
    icon: Brain,
    title: 'AI Threat Detection',
    description: 'Machine learning algorithms analyze network traffic in real-time to identify and neutralize threats before they reach your devices.',
    glow: 'blue',
    gradient: 'from-neon-blue to-blue-600',
  },
  {
    icon: Globe,
    title: 'DNS Protection',
    description: 'Enterprise-grade DNS filtering that blocks malicious domains, phishing sites, and unwanted content at the network level.',
    glow: 'green',
    gradient: 'from-neon-green to-emerald-600',
  },
  {
    icon: Users,
    title: 'Parental Control',
    description: 'Comprehensive family protection with customizable screen time limits, content filters, and activity monitoring for each family member.',
    glow: 'purple',
    gradient: 'from-neon-purple to-purple-600',
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'Zero-logging policy with encrypted DNS queries. Your data stays yours. No tracking, no profiling, no compromises.',
    glow: 'blue',
    gradient: 'from-neon-blue to-neon-purple',
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-neon-blue tracking-widest uppercase">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 tracking-tight">
            Intelligence at <span className="gradient-text-green">Every Layer</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Advanced protection powered by next-generation AI that adapts and evolves with emerging threats.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <GlassCard glow={feature.glow} className="h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}