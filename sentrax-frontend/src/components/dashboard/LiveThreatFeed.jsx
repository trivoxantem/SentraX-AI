import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  dangerous: {
    icon: AlertTriangle,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/20',
    dot: 'bg-neon-red',
    label: 'THREAT',
  },
  suspicious: {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    dot: 'bg-yellow-400',
    label: 'SUSPECT',
  },
  safe: {
    icon: CheckCircle2,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/20',
    dot: 'bg-neon-green',
    label: 'SAFE',
  },
};

// Simulates new incoming alerts for live feel
const AI_MESSAGES = [
  'ML model flagged unusual DNS pattern',
  'Behavioral anomaly detected in traffic',
  'Known malware signature matched',
  'Heuristic scan identified risk vectors',
  'Deep packet inspection triggered',
  'Threat intelligence feed updated',
];

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-red/10 border border-neon-red/20 text-xs font-mono text-neon-red">
      <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
      LIVE
    </span>
  );
}

export default function LiveThreatFeed() {
  const [highlighted, setHighlighted] = useState(null);

  const { data: threats = [] } = useQuery({
    queryKey: ['threats-all'],
    queryFn: () => base44.entities.Threat.list('-created_date', 20),
    initialData: [],
    refetchInterval: 8000,
  });

  // Simulate a new "live" alert flashing in every few seconds
  useEffect(() => {
    if (threats.length === 0) return;
    const interval = setInterval(() => {
      const pick = threats[Math.floor(Math.random() * Math.min(threats.length, 5))];
      setHighlighted(pick?.id);
      setTimeout(() => setHighlighted(null), 1500);
    }, 4000);
    return () => clearInterval(interval);
  }, [threats]);

  const displayThreats = threats.length > 0 ? threats.slice(0, 8) : [
    { id: 1, url: 'malware-payload.xyz', status: 'dangerous', threat_type: 'malware', device_name: 'Windows PC', created_date: new Date(Date.now() - 60000).toISOString() },
    { id: 2, url: 'phish-login.io', status: 'dangerous', threat_type: 'phishing', device_name: 'iPhone 15', created_date: new Date(Date.now() - 180000).toISOString() },
    { id: 3, url: 'ad-tracker.net', status: 'suspicious', threat_type: 'tracking', device_name: 'MacBook Pro', created_date: new Date(Date.now() - 300000).toISOString() },
    { id: 4, url: 'google.com', status: 'safe', threat_type: 'safe', device_name: 'iPad Air', created_date: new Date(Date.now() - 420000).toISOString() },
    { id: 5, url: 'crypto-scam.org', status: 'dangerous', threat_type: 'phishing', device_name: 'Windows PC', created_date: new Date(Date.now() - 600000).toISOString() },
    { id: 6, url: 'youtube.com', status: 'safe', threat_type: 'safe', device_name: 'Smart TV', created_date: new Date(Date.now() - 720000).toISOString() },
  ];

  return (
    <GlassCard hover={false} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-red/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-neon-red" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Threat Alerts</h3>
            <p className="text-xs text-muted-foreground">Real-time threat intelligence</p>
          </div>
        </div>
        <LiveBadge />
      </div>

      {/* Feed */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-80 pr-1">
        <AnimatePresence initial={false}>
          {displayThreats.map((threat, i) => {
            const cfg = statusConfig[threat.status] || statusConfig.safe;
            const Icon = cfg.icon;
            const isHighlighted = highlighted === threat.id;
            return (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${cfg.bg} ${cfg.border} ${isHighlighted ? 'scale-[1.02] brightness-125' : ''}`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-foreground truncate">{threat.url}</p>
                    {isHighlighted && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-mono text-neon-red bg-neon-red/10 px-1.5 py-0.5 rounded flex-shrink-0"
                      >
                        NEW
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{threat.device_name}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{threat.threat_type}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(threat.created_date), { addSuffix: false })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* AI insight footer */}
      <AIInsightTicker />
    </GlassCard>
  );
}

function AIInsightTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIndex(i => (i + 1) % AI_MESSAGES.length), 3500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
      <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-1 rounded flex-shrink-0">AI</span>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="text-[10px] text-muted-foreground font-mono truncate"
        >
          {AI_MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}