import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-neon-blue" />
        </div>
        <h1 className="text-6xl font-bold text-foreground font-mono mb-2">404</h1>
        <p className="text-muted-foreground mb-8">This page doesn't exist in the network.</p>
        <Link to="/">
          <Button className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}