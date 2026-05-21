import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import { BarChart2, TrendingUp } from 'lucide-react';

const hourlyData = [
  { time: '00:00', threats: 2, blocked: 2 },
  { time: '02:00', threats: 1, blocked: 1 },
  { time: '04:00', threats: 1, blocked: 1 },
  { time: '06:00', threats: 3, blocked: 3 },
  { time: '08:00', threats: 7, blocked: 6 },
  { time: '10:00', threats: 11, blocked: 10 },
  { time: '12:00', threats: 14, blocked: 13 },
  { time: '14:00', threats: 9, blocked: 9 },
  { time: '16:00', threats: 6, blocked: 6 },
  { time: '18:00', threats: 8, blocked: 7 },
  { time: '20:00', threats: 12, blocked: 11 },
  { time: '22:00', threats: 5, blocked: 5 },
];

const weeklyData = [
  { day: 'Mon', threats: 45, blocked: 43 },
  { day: 'Tue', threats: 62, blocked: 60 },
  { day: 'Wed', threats: 38, blocked: 38 },
  { day: 'Thu', threats: 71, blocked: 68 },
  { day: 'Fri', threats: 55, blocked: 52 },
  { day: 'Sat', threats: 28, blocked: 27 },
  { day: 'Sun', threats: 19, blocked: 19 },
];

const monthlyData = [
  { month: 'Nov', threats: 310 },
  { month: 'Dec', threats: 278 },
  { month: 'Jan', threats: 420 },
  { month: 'Feb', threats: 385 },
  { month: 'Mar', threats: 512 },
  { month: 'Apr', threats: 448 },
  { month: 'May', threats: 310 },
];

const TABS = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg border border-border/40">
      <p className="text-muted-foreground font-mono mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-medium capitalize">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ThreatAnalyticsSection() {
  const [tab, setTab] = useState('24h');

  const is24h = tab === '24h';
  const is7d = tab === '7d';
  const isMonth = tab === '30d';

  const areaData = is24h ? hourlyData : is7d ? weeklyData : monthlyData;
  const areaKey = is24h ? 'time' : is7d ? 'day' : 'month';

  // Stats derived from current tab data
  const total = areaData.reduce((s, d) => s + d.threats, 0);
  const peak = Math.max(...areaData.map(d => d.threats));
  const blocked = areaData.reduce((s, d) => s + (d.blocked || d.threats), 0);
  const blockRate = Math.round((blocked / total) * 100);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-neon-blue" />
        <h2 className="text-sm font-semibold text-foreground">Threat Analytics</h2>
        <span className="text-xs text-muted-foreground">Frequency & patterns over time</span>
      </div>

      {/* Main area chart */}
      <GlassCard hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Threat Frequency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {is24h ? 'Threats detected per hour today' : is7d ? 'Daily threat count this week' : 'Monthly threat trend'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/30 self-start sm:self-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === t.key && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-md bg-muted/80 border border-border/40"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Threats', value: total, color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/20' },
            { label: 'Peak', value: peak, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
            { label: 'Block Rate', value: `${blockRate}%`, color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/20' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl p-3 border ${stat.bg}`}>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey={areaKey} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                {(is24h || is7d) && (
                  <Area type="monotone" dataKey="blocked" stroke="#00D4FF" fill="url(#blockedGrad)" strokeWidth={1.5} name="Blocked" strokeDasharray="4 2" />
                )}
                <Area type="monotone" dataKey="threats" stroke="#EF4444" fill="url(#threatGrad)" strokeWidth={2} name="Threats" dot={false} activeDot={{ r: 4, fill: '#EF4444', stroke: '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-6 h-0.5 bg-neon-red rounded inline-block" />
            Threats detected
          </span>
          {(is24h || is7d) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-6 h-0.5 bg-neon-blue rounded inline-block border-dashed" style={{ borderTop: '1px dashed #00D4FF', background: 'none' }} />
              Blocked
            </span>
          )}
        </div>
      </GlassCard>

      {/* Weekly bar breakdown */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-neon-purple" />
              Weekly Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Detected vs blocked by day</p>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barGap={3} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="threats" name="Threats" radius={[4, 4, 0, 0]} maxBarSize={18}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.threats > 60 ? '#EF4444' : entry.threats > 40 ? '#F59E0B' : '#8B5CF6'} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="blocked" name="Blocked" fill="#00D4FF" radius={[4, 4, 0, 0]} maxBarSize={18} fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 pt-3 border-t border-border/20">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-neon-red/85 inline-block" /> High (&gt;60)</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500/85 inline-block" /> Medium (40–60)</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-neon-purple/85 inline-block" /> Low (&lt;40)</span>
        </div>
      </GlassCard>
    </div>
  );
}