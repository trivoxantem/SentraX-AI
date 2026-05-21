import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';

export default function StatsCard({ title, value, prefix = '', suffix = '', icon: Icon, glow, trend, trendLabel }) {
  return (
    <GlassCard glow={glow}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="text-3xl font-bold text-foreground mt-2">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </div>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || 'vs last week'}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}