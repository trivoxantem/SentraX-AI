export default function StatusBadge({ status }) {
  const styles = {
    safe: 'bg-neon-green/10 text-neon-green border-neon-green/20',
    secure: 'bg-neon-green/10 text-neon-green border-neon-green/20',
    suspicious: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    dangerous: 'bg-neon-red/10 text-neon-red border-neon-red/20',
    at_risk: 'bg-neon-red/10 text-neon-red border-neon-red/20',
    offline: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
    blocked: 'bg-neon-purple/10 text-neon-purple border-neon-purple/20',
  };

  const dotStyles = {
    safe: 'bg-neon-green',
    secure: 'bg-neon-green',
    suspicious: 'bg-yellow-400',
    dangerous: 'bg-neon-red',
    at_risk: 'bg-neon-red',
    offline: 'bg-muted-foreground',
    blocked: 'bg-neon-purple',
  };

  const label = status?.replace(/_/g, ' ') || 'unknown';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.safe}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || dotStyles.safe}`} />
      <span className="capitalize">{label}</span>
    </span>
  );
}