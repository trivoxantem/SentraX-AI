import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/shared/GlassCard';

const data = [
  { time: '00:00', threats: 2, safe: 45 },
  { time: '04:00', threats: 1, safe: 12 },
  { time: '08:00', threats: 5, safe: 89 },
  { time: '12:00', threats: 8, safe: 134 },
  { time: '16:00', threats: 3, safe: 156 },
  { time: '20:00', threats: 6, safe: 98 },
  { time: '24:00', threats: 2, safe: 42 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground font-mono mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ActivityChart() {
  return (
    <GlassCard hover={false} className="col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Network Activity</h3>
          <p className="text-xs text-muted-foreground mt-1">Requests processed today</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neon-blue" />Safe</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neon-red" />Threats</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="safe" stroke="#00D4FF" fill="url(#blueGrad)" strokeWidth={2} name="Safe" />
            <Area type="monotone" dataKey="threats" stroke="#EF4444" fill="url(#redGrad)" strokeWidth={2} name="Threats" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}