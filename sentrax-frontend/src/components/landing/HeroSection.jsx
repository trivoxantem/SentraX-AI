import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-neon-blue/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-neon-green/5 rounded-full animate-float" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        {/* Terminal badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-blue/20 bg-neon-blue/5 mb-8"
        >
          <span className="w-2 h-2 bg-neon-green rounded-full animate-glow-pulse" />
          <span className="text-xs font-mono text-neon-blue tracking-wider">SYSTEM ACTIVE — ALL NETWORKS SECURED</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6"
        >
          <span className="text-foreground">You are</span>
          <br />
          <span className="gradient-text-blue">Protected</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          SentraX is the intelligence layer of the internet. AI-powered threat detection, 
          DNS protection, and privacy-first security for every device on your network.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold px-8 py-6 text-base rounded-xl hover:opacity-90 transition-opacity glow-blue"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="border-border/50 text-foreground px-8 py-6 text-base rounded-xl hover:bg-muted/50 hover:border-neon-blue/30"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Shield animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-green/20 flex items-center justify-center animate-float">
              <Shield className="w-10 h-10 text-neon-blue" />
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-neon-blue/10 blur-xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}