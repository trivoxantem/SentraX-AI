import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Laptop, Wifi, Router, ShieldCheck, ShieldAlert, WifiOff } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { formatDistanceToNow } from 'date-fns';

const deviceIcons = {
  desktop: Monitor,
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
  router: Router,
  iot: Wifi,
};

const statusStyles = {
  secure: {
    icon: ShieldCheck,
    iconColor: 'text-neon-green',
    bg: 'bg-neon-green/10',
    bar: 'bg-neon-green',
    label: 'Secure',
    labelColor: 'text-neon-green',
  },
  at_risk: {
    icon: ShieldAlert,
    iconColor: 'text-neon-red',
    bg: 'bg-neon-red/10',
    bar: 'bg-neon-red',
    label: 'At Risk',
    labelColor: 'text-neon-red',
  },
  offline: {
    icon: WifiOff,
    iconColor: 'text-muted-foreground',
    bg: 'bg-muted/50',
    bar: 'bg-muted-foreground',
    label: 'Offline',
    labelColor: 'text-muted-foreground',
  },
};

const mockDevices = [
  { id: 1, name: 'MacBook Pro', device_type: 'laptop', status: 'secure', last_seen: new Date(Date.now() - 60000).toISOString(), protection_enabled: true },
  { id: 2, name: 'iPhone 15 Pro', device_type: 'phone', status: 'secure', last_seen: new Date(Date.now() - 120000).toISOString(), protection_enabled: true },
  { id: 3, name: 'Windows Desktop', device_type: 'desktop', status: 'at_risk', last_seen: new Date(Date.now() - 600000).toISOString(), protection_enabled: false },
  { id: 4, name: 'iPad Air', device_type: 'tablet', status: 'secure', last_seen: new Date(Date.now() - 300000).toISOString(), protection_enabled: true },
  { id: 5, name: 'Smart TV', device_type: 'iot', status: 'offline', last_seen: new Date(Date.now() - 86400000).toISOString(), protection_enabled: true },
  { id: 6, name: 'Home Router', device_type: 'router', status: 'secure', last_seen: new Date(Date.now() - 30000).toISOString(), protection_enabled: true },
];

export default function DeviceActivitySummary() {
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list('-last_seen'),
    initialData: [],
    refetchInterval: 10000,
  });

  const items = (devices.length > 0 ? devices : mockDevices).slice(0, 6);

  const secure = items.filter(d => d.status === 'secure').length;
  const atRisk = items.filter(d => d.status === 'at_risk').length;
  const offline = items.filter(d => d.status === 'offline').length;

  return (
    <GlassCard hover={false} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Device Activity</h3>
          <p className="text-xs text-muted-foreground">Live network presence</p>
        </div>
        {/* Mini status pills */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green">{secure} OK</span>
          {atRisk > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neon-red/10 text-neon-red">{atRisk} Risk</span>}
          {offline > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{offline} Off</span>}
        </div>
      </div>

      {/* Health bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mb-4">
        {items.map((d) => (
          <motion.div
            key={d.id}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`flex-1 rounded-full ${statusStyles[d.status]?.bar || 'bg-muted'}`}
          />
        ))}
      </div>

      {/* Device list */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {items.map((device, i) => {
          const DevIcon = deviceIcons[device.device_type] || Monitor;
          const cfg = statusStyles[device.status] || statusStyles.offline;
          const StatusIcon = cfg.icon;

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-colors"
            >
              {/* Device icon */}
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <DevIcon className={`w-4 h-4 ${cfg.iconColor}`} />
              </div>

              {/* Name + last seen */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{device.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {device.status === 'offline'
                    ? `Last seen ${formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}`
                    : `Active ${formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}`}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <StatusIcon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                <span className={`text-[10px] font-mono ${cfg.labelColor}`}>{cfg.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}