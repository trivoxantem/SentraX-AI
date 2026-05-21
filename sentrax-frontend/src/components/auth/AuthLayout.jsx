import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-neon-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/landing" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-green flex items-center justify-center">
            <Zap className="w-5 h-5 text-background" />
          </div>
          <span className="font-mono font-bold text-foreground tracking-wider text-lg">SENTRAX</span>
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8 glow-blue">
          {title && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}