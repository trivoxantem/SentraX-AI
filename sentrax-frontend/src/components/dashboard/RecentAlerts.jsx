import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import GlassCard from '@/components/shared/GlassCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecentAlerts() {
  const { data: threats = [] } = useQuery({
    queryKey: ['threats-recent'],
    queryFn: () => base44.entities.Threat.list('-created_date', 5),
    initialData: [],
  });

  const mockAlerts = threats.length > 0 ? threats : [
    { id: 1, url: 'malware-site.xyz', status: 'dangerous', created_date: new Date().toISOString(), threat_type: 'malware' },
    { id: 2, url: 'phish-login.com', status: 'suspicious', created_date: new Date().toISOString(), threat_type: 'phishing' },
    { id: 3, url: 'safe-docs.org', status: 'safe', created_date: new Date().toISOString(), threat_type: 'safe' },
  ];

  return (
    <GlassCard hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-neon-blue" />
        <h3 className="text-sm font-semibold text-foreground">Recent Alerts</h3>
      </div>
      <div className="space-y-3">
        {mockAlerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground font-mono truncate">{alert.url}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(alert.created_date), 'HH:mm')} · {alert.threat_type}
              </p>
            </div>
            <StatusBadge status={alert.status} />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}