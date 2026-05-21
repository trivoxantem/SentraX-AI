import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glow = '', hover = true, ...props }) {
  const glowClass = glow === 'blue' ? 'glow-blue' : glow === 'green' ? 'glow-green' : glow === 'purple' ? 'glow-purple' : glow === 'red' ? 'glow-red' : '';

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : {}}
      transition={{ duration: 0.2 }}
      className={`glass rounded-xl p-5 ${glowClass} ${hover ? 'glass-hover' : ''} transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}